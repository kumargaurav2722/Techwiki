export type ArticleSummary = {
  id: number;
  category: string;
  slug: string;
  topic: string;
  updated_at?: string;
  views?: number;
};

export async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json() as Promise<{
    counts: { articles: number; categories: number };
    recent: ArticleSummary[];
    trending: ArticleSummary[];
  }>;
}

export async function fetchRandomArticle() {
  const res = await fetch("/api/articles/random");
  if (!res.ok) throw new Error("Failed to fetch random article");
  return res.json() as Promise<{ article: ArticleSummary }>;
}
