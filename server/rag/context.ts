import { searchSources, type RagSource } from "./search";

export type RagContext = {
  sources: RagSource[];
  context: string;
};

function toJinaUrl(url: string) {
  const stripped = url.replace(/^https?:\/\//, "");
  return `https://r.jina.ai/http://${stripped}`;
}

async function fetchSourceText(url: string, maxChars: number) {
  const response = await fetch(toJinaUrl(url));
  if (!response.ok) {
    return "";
  }
  const text = await response.text();
  return text.slice(0, maxChars);
}

export async function getRagContext(topic: string, category: string) {
  const enabled = process.env.RAG_ENABLED === "true";
  if (!enabled) return null;

  const maxSources = Number(process.env.RAG_MAX_SOURCES || 4);
  const maxChars = Number(process.env.RAG_MAX_CHARS || 2500);

  const query = `${topic} ${category}`.trim();
  const sources = await searchSources(query, maxSources);

  const contentParts: string[] = [];

  await Promise.all(
    sources.map(async (source, index) => {
      const text = await fetchSourceText(source.url, maxChars);
      if (text) {
        contentParts.push(
          `Source ${index + 1}: ${source.title}\nURL: ${source.url}\n${text}`
        );
      }
    })
  );

  return {
    sources,
    context: contentParts.join("\n\n"),
  } satisfies RagContext;
}
