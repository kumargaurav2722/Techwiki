import { GoogleGenAI } from "@google/genai";
import { buildPrompt } from "./prompts";
import { getRagContext } from "../rag/context";

export type GenerateInput = {
  category: string;
  topic: string;
  userTier?: "free" | "premium";
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
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set on the server.");
  }

  // Use configured model or default to llama-3.3-70b-versatile (best free model)
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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

/**
 * Resolve which AI provider to use based on user tier.
 *
 * Priority:
 *  1. Free users → always Groq (Llama 3.1 70B) — fast, free, good quality
 *  2. Premium users → Gemini (best quality)
 *  3. No user (background ingestion) → Groq (saves Gemini quota)
 *  4. Fallback: if Gemini key is missing but Groq key exists → Groq
 *  5. Fallback: if Groq key is missing but Gemini key exists → Gemini
 */
function resolveProvider(tier?: "free" | "premium"): "gemini" | "groq" {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  // Premium users get Gemini when available
  if (tier === "premium" && hasGemini) return "gemini";

  // Free users and background ingestion use Groq
  if (hasGroq) return "groq";

  // Fallback: use whatever is available
  if (hasGemini) return "gemini";

  throw new Error("No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.");
}

/**
 * Resolve which RAG provider to use based on user tier.
 * Free users: Wikipedia only (free, no API key needed)
 * Premium users: configured provider (Wikipedia or Tavily)
 */
function resolveRagProvider(tier?: "free" | "premium"): string {
  if (tier !== "premium") return "wikipedia";
  return (process.env.RAG_PROVIDER || "wikipedia").toLowerCase();
}

export async function generateArticleMarkdown(input: GenerateInput) {
  const provider = resolveProvider(input.userTier);
  const ragProvider = resolveRagProvider(input.userTier);

  let rag = null;
  const ragEnabled = process.env.RAG_ENABLED === "true";
  if (ragEnabled) {
    try {
      // Override RAG_PROVIDER for this call based on user tier
      const origProvider = process.env.RAG_PROVIDER;
      process.env.RAG_PROVIDER = ragProvider;
      rag = await getRagContext(input.topic, input.category);
      process.env.RAG_PROVIDER = origProvider;
    } catch (error) {
      console.warn("RAG context failed, continuing without sources", error);
    }
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

  return { markdown: output, provider };
}
