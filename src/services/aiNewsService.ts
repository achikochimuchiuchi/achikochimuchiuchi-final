import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { MisconductRecord, MisconductCategory, MisconductType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const syncAINews = async () => {
  try {
    const model = "gemini-3-flash-preview";
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      現在の日付: ${today}
      
      日本国内の【直近7日間以内】に報道された、行政組織または公務員による重大な不祥事ニュースを最大10件、徹底的に調査して収集してください。
      
      特に以下の内容を重点的に探してください：
      1. 汚職・収賄・贈収賄（逮捕や家宅捜索が行われたもの）
      2. 公金横領・不正流用
      3. 公文書偽造・隠蔽・改ざん
      4. 重大なハラスメント（セクハラ、パワハラによる懲戒処分）
      5. 選挙違反や政治資金規正法違反（公務員や行政が関与するもの）
      
      各項目について、以下のJSON形式で厳密に返してください：
      - title: 具体的で事実に基づいたタイトル（例：「〇〇市職員、収賄容疑で逮捕」）
      - date: 報道された正確な日付 (YYYY-MM-DD)
      - organization: 関与した具体的な組織名（例：「東京都庁」「〇〇県警」）
      - description: 事案の具体的な内容、報道機関名、および現在の状況（捜査中、起訴など）を含めた詳細な説明（150文字程度）
      - type: "corruption" | "fraud" | "cover-up" | "harassment" | "other" の中から最も適切なものを1つ選択
      - category: "administrative" (組織ぐるみの不正) | "public-servant" (個人の不祥事) のいずれか
      - involvedParties: 判明している関与者の役職や氏名（氏名は報道されている場合のみ）のリスト
      - url: 信頼できる大手ニュースサイト（NHK, 朝日, 読売, 毎日, 日経, 共同通信など）のソースURL
      - severity: 社会的影響度に基づき1から5の数値で評価（5が最も深刻）
      
      ※ 信頼性の低いソースや古いニュースは除外してください。
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
      // Check if already exists by title or URL (deduplication)
      const titleQuery = query(misconductRef, where("title", "==", item.title), limit(1));
      const urlQuery = query(misconductRef, where("url", "==", item.url), limit(1));
      
      const [titleSnap, urlSnap] = await Promise.all([
        getDocs(titleQuery),
        getDocs(urlQuery)
      ]);
      
      if (titleSnap.empty && urlSnap.empty) {
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
