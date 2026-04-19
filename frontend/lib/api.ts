// Server-side API helpers — called from Server Components with the user's token.
// Browser-side calls go directly to NEXT_PUBLIC_FASTAPI_URL with credentials: "include".

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${FASTAPI_URL}${path}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

export async function getProfile(token: string) {
  try {
    return await apiFetch<Record<string, unknown>>("/api/profile", token);
  } catch {
    return null;
  }
}

export async function getSnippets() {
  return apiFetch<Array<{ id: string; title: string; language: string; code: string; errorMessage: string }>>("/api/data/snippets");
}

export async function getTasks() {
  return apiFetch<Array<Record<string, unknown>>>("/api/data/tasks");
}

export async function getConcepts() {
  return apiFetch<Array<Record<string, unknown>>>("/api/data/concepts");
}

export async function getCurrentUser(token: string) {
  try {
    return await apiFetch<{ user_id: string; email: string }>("/api/auth/me", token);
  } catch {
    return null;
  }
}
