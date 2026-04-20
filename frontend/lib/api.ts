// Server-side API helpers — called from Server Components with the user's token.
// Browser-side calls go directly to NEXT_PUBLIC_FASTAPI_URL with credentials: "include".

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, tokenOrInit?: string | RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { cache: "no-store" };

  if (typeof tokenOrInit === "string") {
    headers["Authorization"] = `Bearer ${tokenOrInit}`;
  } else if (tokenOrInit) {
    Object.assign(init, tokenOrInit);
  }

  if (!headers["Authorization"] && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const token = (await cookies()).get("sb-access-token")?.value ?? "";
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {
      // Keep request without Authorization if cookies are unavailable.
    }
  }

  init.headers = { ...(init.headers as Record<string, string>), ...headers };
  if (!init.credentials) init.credentials = "include";

  const res = await fetch(`${FASTAPI_URL}${path}`, init);
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

export async function getLlmProviderStatus(): Promise<{
  provider: 'openai' | 'ollama';
  ollama_online: boolean;
}> {
  return apiFetch('/api/profile/provider-status');
  // Nutze die bestehende apiFetch-Hilfsfunktion exakt wie
  // sie bereits in dieser Datei verwendet wird
}

export async function updateLlmProvider(
  provider: 'openai' | 'ollama'
): Promise<void> {
  const current = await apiFetch<{
    known_languages?: string[];
    target_language?: string;
    skill_level?: string;
    known_concepts?: string[];
    goal_tags?: string[];
    goals_free_text?: string;
    onboarding_completed?: boolean;
  }>('/api/profile');

  await apiFetch('/api/profile', {
    method: 'PUT',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      known_languages: current.known_languages ?? ["python"],
      target_language: current.target_language ?? "python",
      skill_level: current.skill_level ?? "beginner",
      known_concepts: current.known_concepts ?? [],
      goal_tags: current.goal_tags ?? [],
      goals_free_text: current.goals_free_text ?? "",
      onboarding_completed: current.onboarding_completed ?? true,
      llm_provider: provider,
    }),
  });
  // Nutze PUT /api/profile – das Profil-Update existiert bereits
}

export async function getHistory(limit = 20, offset = 0) {
  return apiFetch(`/api/history?limit=${limit}&offset=${offset}`);
  // Nutze apiFetch exakt wie bereits in dieser Datei verwendet
}

export async function deleteHistoryEntry(entryId: string): Promise<void> {
  await apiFetch(`/api/history/${entryId}`, { method: 'DELETE' });
}

export async function clearHistory(): Promise<void> {
  await apiFetch('/api/history', { method: 'DELETE' });
}
