import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { InactionRecord, Severity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const syncInactionNews = async () => {
  try {
    const model = "gemini-3-flash-preview";
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      現在の日付: ${today}
      
      日本国内の【直近1ヶ月以内】に報道または問題視された、行政の「不作為」（やるべきことをやっていない、放置、怠慢、遅延）に関するニュースや事案を最大10件収集してください。
      
      特に以下の内容を重点的に探してください：
      1. 危険箇所の放置（道路、橋梁、空き家、盛り土など）
      2. 申請や給付の著しい遅延（福祉、助成金、行政手続き）
      3. 住民の苦情や要望に対する長期的な無視・放置
      4. 法的に義務付けられた調査や監査の未実施
      5. 災害対策や安全基準の不備・放置
      
      各項目について、以下のJSON形式で厳密に返してください：
      - title: 具体的で事実に基づいたタイトル
      - date: 報道された、または問題が表面化した日付 (YYYY-MM-DD)
      - category: "行政不作為" | "安全管理怠慢" | "手続き遅延" | "その他"
      - description: 不作為の内容、それによって生じているリスク、および現在の状況（150文字程度）
      - severity: リスクの大きさに基づき1から5の数値で評価（5が最も深刻）
      - location: 該当する自治体や場所の名前
      - tags: 関連するキーワードの配列 (例: ["道路", "安全", "予算不足"])
      
      ※ 信頼性の高いソースに基づいた具体的な事案のみを収集してください。
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ 
          googleSearch: {
            searchTypes: {
              webSearch: {}
            }
          } 
        }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.NUMBER },
              location: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "date", "category", "description", "severity", "location", "tags"]
          }
        }
      }
    });

    const items = JSON.parse(response.text);
    const ref = collection(db, "inaction_records");

    for (const item of items) {
      const q = query(ref, where("title", "==", item.title), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        await addDoc(ref, {
          ...item,
          status: "investigating",
          evidenceCount: 0,
          authorUid: "system-ai",
          createdAt: serverTimestamp()
        });
      }
    }

    return items.length;
  } catch (error) {
    console.error("Inaction News Sync Error:", error);
    throw error;
  }
};
