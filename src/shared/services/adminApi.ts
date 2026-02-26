import { getToken } from "@/shared/services/authApi";

const ADMIN_KEY_STORAGE = "techwiki_admin_key";

export function getAdminKey() {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setAdminKey(value: string) {
  try {
    localStorage.setItem(ADMIN_KEY_STORAGE, value);
  } catch {
    // ignore
  }
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const key = getAdminKey();
  const headers = new Headers(options.headers || {});
  if (key) headers.set("x-admin-key", key);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Request failed");
  }

  return response.json();
}

export type AdminArticleSummary = {
  id: number;
  category: string;
  slug: string;
  topic: string;
  updated_at?: string;
  snippet?: string;
};

export type AdminArticle = {
  id: number;
  category: string;
  topic: string;
  slug: string;
  markdown: string;
  created_at: string;
  updated_at: string;
  version: number;
  references?: Array<{ title: string; url: string }> | null;
};

export async function listAdminArticles(query?: string) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  const url = `/api/admin/articles${params.toString() ? `?${params.toString()}` : ""}`;
  const data = await adminFetch(url);
  return (data?.results || []) as AdminArticleSummary[];
}

export async function getAdminArticle(id: number) {
  const data = await adminFetch(`/api/admin/article/${id}`);
  return data?.article as AdminArticle;
}

export async function updateAdminArticle(
  id: number,
  payload: { markdown: string; references?: Array<{ title: string; url: string }> | null }
) {
  const data = await adminFetch(`/api/admin/article/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data?.article as AdminArticle;
}

export type IngestStatus = {
  state: "running" | "completed" | "failed";
  processed: number;
  total: number;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  errorCount?: number;
};

export async function startIngestion(payload?: { limit?: number; category?: string }) {
  const data = await adminFetch(`/api/admin/ingest`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
  return data?.status as IngestStatus;
}

export async function getIngestionStatus() {
  const data = await adminFetch(`/api/admin/ingest/status`);
  return data?.status as IngestStatus | null;
}
