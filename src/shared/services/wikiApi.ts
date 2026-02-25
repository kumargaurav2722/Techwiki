export type Article = {
  id: number;
  category: string;
  topic: string;
  slug: string;
  markdown: string;
  created_at: string;
  updated_at: string;
  version: number;
};

export type ArticleResponse = {
  article: Article;
  source: "cache" | "generated" | "refreshed";
};

export async function fetchArticle(
  category: string,
  slug: string,
  options?: { refresh?: boolean; topic?: string }
): Promise<ArticleResponse> {
  const params = new URLSearchParams();
  if (options?.refresh) params.set("refresh", "true");
  if (options?.topic) params.set("topic", options.topic);

  const url = `/api/article/${encodeURIComponent(category)}/${encodeURIComponent(slug)}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to load article");
  }

  return res.json();
}

export type SearchResult = {
  id: number;
  category: string;
  slug: string;
  topic: string;
  snippet: string;
};

export async function searchArticles(query: string): Promise<SearchResult[]> {
  const url = `/api/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data?.results || [];
}
