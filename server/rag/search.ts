export type RagSource = {
  title: string;
  url: string;
  snippet?: string;
};

async function searchWikipedia(query: string, limit: number) {
  const params = new URLSearchParams({
    action: "opensearch",
    search: query,
    limit: String(limit),
    namespace: "0",
    format: "json",
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wikipedia search failed: ${response.status}`);
  }

  const data = (await response.json()) as [string, string[], string[], string[]];
  const titles = data[1] || [];
  const descriptions = data[2] || [];
  const urls = data[3] || [];

  return urls.map((url, index) => ({
    title: titles[index] || url,
    url,
    snippet: descriptions[index] || "",
  }));
}

async function searchTavily(query: string, limit: number) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: limit,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Tavily search failed: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as { results?: Array<{ title: string; url: string; content?: string }> };
  return (data.results || []).map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.content || "",
  }));
}

export async function searchSources(query: string, limit: number) {
  const provider = (process.env.RAG_PROVIDER || "wikipedia").toLowerCase();
  if (provider === "tavily") {
    return searchTavily(query, limit);
  }

  return searchWikipedia(query, limit);
}
