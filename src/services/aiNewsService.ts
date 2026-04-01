import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { MisconductRecord, MisconductCategory, MisconductType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const syncAINews = async () => {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      日本国内の最近の行政組織または公務員による不祥事（汚職、収賄、不正、隠蔽、ハラスメントなど）に関するニュースを最大10件収集してください。
      各項目について以下の情報をJSON形式で返してください：
      - title: 事案のタイトル
      - date: 発生日または報道日 (YYYY-MM-DD)
      - organization: 関与した組織名
      - description: 事案の簡潔な説明
      - type: "corruption" | "fraud" | "cover-up" | "harassment" | "other" のいずれか
      - category: "administrative" (行政組織) | "public-servant" (公務員) のいずれか
      - involvedParties: 関与者のリスト (文字列の配列)
      - url: ニュースソースのURL
      - severity: 1から5の数値 (5が最も深刻)
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              organization: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING },
              category: { type: Type.STRING },
              involvedParties: { type: Type.ARRAY, items: { type: Type.STRING } },
              url: { type: Type.STRING },
              severity: { type: Type.NUMBER }
            },
            required: ["title", "date", "organization", "description", "type", "category", "involvedParties", "url", "severity"]
          }
        }
      }
    });

    const newsItems = JSON.parse(response.text);
    const misconductRef = collection(db, "misconduct_records");

    for (const item of newsItems) {
      // Check if already exists by title (simple deduplication)
      const q = query(misconductRef, where("title", "==", item.title), limit(1));
      const existing = await getDocs(q);
      
      if (existing.empty) {
        await addDoc(misconductRef, {
          ...item,
          source: "ai-collected",
          status: "under-investigation",
          authorUid: "system-ai",
          createdAt: serverTimestamp()
        });
      }
    }

    return newsItems.length;
  } catch (error) {
    console.error("AI News Sync Error:", error);
    throw error;
  }
};
