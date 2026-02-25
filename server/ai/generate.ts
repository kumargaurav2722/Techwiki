import { GoogleGenAI } from "@google/genai";
import { buildPrompt } from "./prompts";

export type GenerateInput = {
  category: string;
  topic: string;
};

export async function generateArticleMarkdown(input: GenerateInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(input);
  const model = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  return response.text || "";
}
