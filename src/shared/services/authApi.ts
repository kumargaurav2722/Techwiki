export type AuthUser = {
  id: number;
  email: string;
  role: string;
};

const TOKEN_KEY = "techwiki_auth_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

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

export async function login(email: string, password: string) {
  const data = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data as { token: string; user: AuthUser };
}

export async function register(email: string, password: string) {
  const data = await authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data as { token: string; user: AuthUser };
}

export async function getMe() {
  const data = await authFetch("/api/auth/me");
  return data as { user: AuthUser };
}
