import { GoogleGenAI } from "@google/genai";

export async function generateArticle(category: string, topic: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
You are a highly knowledgeable technical writer contributing to a comprehensive "Tech Wikipedia".
Your task is to write an in-depth, Wikipedia-style article about "${topic}" in the context of "${category}".

The article MUST include:
1. A clear, concise introductory summary.
2. History and background (if applicable).
3. Core concepts and detailed explanations.
4. Code examples in relevant programming languages (e.g., Python, Java, Rust, Go, JS/TS, React, etc.) with proper syntax highlighting.
5. Use cases and real-world applications.
6. Pros and cons (if applicable).
7. A "See Also" section at the end with 3-5 related topics formatted as Markdown links (e.g., [Topic](/wiki/category/topic-slug)). Try to guess the category for the link.

Format the output STRICTLY in Markdown. Use appropriate headings (##, ###), lists, and code blocks (\`\`\`language).
Do not include any conversational filler like "Here is the article" or "Sure, I can help with that." Just output the Markdown content directly.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating article:", error);
    throw new Error("Failed to generate article. Please try again later.");
  }
}
