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

export type Team = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
};

export type Note = {
  id: number;
  user_id: number;
  article_id: number;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: number;
  user_id: number;
  article_id: number;
  content: string;
  created_at: string;
};

export type SharedList = {
  list_id: number;
  name: string;
  user_id: number;
  team_id: number;
  items: Array<{ id: number; list_id: number; category: string; slug: string; topic: string; created_at: string }>;
};

export async function listTeams() {
  const data = await authFetch("/api/teams");
  return data?.teams as Team[];
}

export async function createTeam(name: string) {
  const data = await authFetch("/api/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data?.team as Team;
}

export async function addTeamMember(teamId: number, email: string) {
  await authFetch(`/api/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function listNotes(articleId: number) {
  const data = await authFetch(`/api/notes/${articleId}`);
  return data?.notes as Note[];
}

export async function createNote(articleId: number, content: string) {
  const data = await authFetch(`/api/notes/${articleId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return data?.note as Note;
}

export async function listComments(articleId: number) {
  const data = await authFetch(`/api/comments/${articleId}`);
  return data?.comments as Comment[];
}

export async function createComment(articleId: number, content: string) {
  const data = await authFetch(`/api/comments/${articleId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return data?.comment as Comment;
}

export async function shareReadingList(listId: number, teamId: number) {
  await authFetch(`/api/library/reading-lists/${listId}/share`, {
    method: "POST",
    body: JSON.stringify({ teamId }),
  });
}

export async function listSharedLists() {
  const data = await authFetch("/api/library/shared");
  return data?.lists as SharedList[];
}
