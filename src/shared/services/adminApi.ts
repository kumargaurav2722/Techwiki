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
  status?: string;
  references?: Array<{ title: string; url: string }> | null;
};

export type ArticleVersion = {
  id: number;
  article_id: number;
  markdown: string;
  status: string;
  created_at: string;
  created_by?: number | null;
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
  payload: { markdown: string; references?: Array<{ title: string; url: string }> | null; status?: string }
) {
  const data = await adminFetch(`/api/admin/article/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data?.article as AdminArticle;
}

export async function createDraft(id: number, payload: { markdown: string; references?: Array<{ title: string; url: string }> | null }) {
  const data = await adminFetch(`/api/admin/article/${id}/draft`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.article as AdminArticle;
}

export async function approveDraft(id: number) {
  const data = await adminFetch(`/api/admin/article/${id}/approve`, { method: "POST" });
  return data?.version as ArticleVersion;
}

export async function publishDraft(id: number) {
  const data = await adminFetch(`/api/admin/article/${id}/publish`, { method: "POST" });
  return data?.article as AdminArticle;
}

export async function restoreArticleVersion(
  id: number,
  payload: { versionId: number; publish?: boolean }
) {
  const data = await adminFetch(`/api/admin/article/${id}/restore`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.article as AdminArticle;
}

export async function listArticleVersions(id: number) {
  const data = await adminFetch(`/api/admin/article/${id}/versions`);
  return data?.versions as ArticleVersion[];
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

export type CommentReport = {
  id: number;
  comment_id: number;
  reporter_id: number;
  reason?: string | null;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: number | null;
  comment_content?: string;
  comment_status?: string;
  comment_user_id?: number;
  reporter_email?: string | null;
  comment_author_email?: string | null;
  article_id?: number;
  article_category?: string;
  article_slug?: string;
  article_topic?: string;
};

export async function listCommentReports(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const url = `/api/admin/comment-reports${params.toString() ? `?${params.toString()}` : ""}`;
  const data = await adminFetch(url);
  return (data?.reports || []) as CommentReport[];
}

export async function actOnCommentReport(id: number, action: "dismiss" | "resolve" | "hide") {
  const data = await adminFetch(`/api/admin/comment-reports/${id}/action`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  return data?.report as CommentReport;
}

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  status?: string;
  ban_reason?: string | null;
  banned_until?: string | null;
  created_at: string;
};

export async function listAdminUsers(query?: string, status?: string) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (status) params.set("status", status);
  const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
  const data = await adminFetch(url);
  return (data?.users || []) as AdminUser[];
}

export async function banAdminUser(id: number, payload?: { reason?: string; until?: string }) {
  const data = await adminFetch(`/api/admin/users/${id}/ban`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
  return data?.user as AdminUser;
}

export async function unbanAdminUser(id: number) {
  const data = await adminFetch(`/api/admin/users/${id}/unban`, { method: "POST" });
  return data?.user as AdminUser;
}
