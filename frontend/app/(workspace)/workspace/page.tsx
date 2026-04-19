import { cookies } from "next/headers";
import { WorkspaceClient } from "@/components/workspace/WorkspaceClient";
import { getCurrentUser, getProfile, getSnippets } from "@/lib/api";

export default async function WorkspacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value ?? "";

  const [snippets, profile] = await Promise.all([
    getSnippets(),
    token ? getProfile(token) : null,
  ]);

  const initialLanguage = (profile as any)?.target_language ?? "java";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Verstehen statt Kopieren</p>
          <h1 className="text-xl font-semibold tracking-tight">Learning Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Didaktische Analyse für Fehlerdiagnose, Konzepte und reflektiertes Debugging.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
          Modellgestützte Heuristik
        </span>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <WorkspaceClient snippets={snippets} initialLanguage={initialLanguage} />
      </main>
    </div>
  );
}
