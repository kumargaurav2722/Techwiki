import { getToken } from "@/shared/services/authApi";

async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Request failed");
  }
  return response.json();
}

export type Bookmark = {
  id: number;
  category: string;
  slug: string;
  topic: string;
  created_at: string;
};

export type ReadingListItem = {
  id: number;
  list_id: number;
  category: string;
  slug: string;
  topic: string;
  created_at: string;
};

export type ReadingList = {
  id: number;
  name: string;
  created_at: string;
  items: ReadingListItem[];
};

export async function listBookmarks() {
  const data = await authFetch("/api/library/bookmarks");
  return data?.bookmarks as Bookmark[];
}

export async function addBookmark(input: { category: string; slug: string; topic: string }) {
  const data = await authFetch("/api/library/bookmarks", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data?.bookmark as Bookmark;
}

export async function removeBookmark(id: number) {
  await authFetch(`/api/library/bookmarks/${id}`, { method: "DELETE" });
}

export async function listReadingLists() {
  const data = await authFetch("/api/library/reading-lists");
  return data?.lists as ReadingList[];
}

export async function createReadingList(name: string) {
  const data = await authFetch("/api/library/reading-lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data?.list as ReadingList;
}

export async function deleteReadingList(id: number) {
  await authFetch(`/api/library/reading-lists/${id}`, { method: "DELETE" });
}

export async function addReadingListItem(
  listId: number,
  input: { category: string; slug: string; topic: string }
) {
  const data = await authFetch(`/api/library/reading-lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data?.item as ReadingListItem;
}

export async function deleteReadingListItem(listId: number, itemId: number) {
  await authFetch(`/api/library/reading-lists/${listId}/items/${itemId}`, {
    method: "DELETE" });
}
