import { GoogleGenAI } from "@google/genai";
import { buildPrompt } from "./prompts";
import { getRagContext } from "../rag/context";

export type GenerateInput = {
  category: string;
  topic: string;
};

async function generateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });
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

async function generateWithGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set on the server.");
  }
  if (!model) {
    throw new Error("GROQ_MODEL is not set on the server.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data?.choices?.[0]?.message?.content || "";
}

export async function generateArticleMarkdown(input: GenerateInput) {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  let rag = null;
  try {
    rag = await getRagContext(input.topic, input.category);
  } catch (error) {
    console.warn("RAG context failed, continuing without sources", error);
  }
  const prompt = buildPrompt({ ...input, rag });

  let output = "";
  if (provider === "groq") {
    output = await generateWithGroq(prompt);
  } else {
    output = await generateWithGemini(prompt);
  }

  if (rag?.sources?.length) {
    const hasReferences = /^#{1,3}\s+References/mi.test(output);
    if (!hasReferences) {
      const refs = rag.sources
        .map((source) => `- [${source.title}](${source.url})`)
        .join("\n");
      output = `${output}\n\n## References\n${refs}\n`;
    }
  }

  return output;
}
