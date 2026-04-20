import { cookies } from "next/headers";
import { WorkspaceClient } from "@/components/workspace/WorkspaceClient";
import { getProfile, getSnippets, getTasks } from "@/lib/api";

interface Task {
  id: string;
  title: string;
  language: string;
  prompt: string;
  starterCode: string;
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value ?? "";
  const { task: taskId } = await searchParams;

  const [snippets, profile, tasks] = await Promise.all([
    getSnippets(),
    token ? getProfile(token) : null,
    taskId ? (getTasks() as Promise<Task[]>) : Promise.resolve([] as Task[]),
  ]);

  const selectedTask = taskId ? tasks.find((t) => t.id === taskId) : undefined;
  const initialLanguage = selectedTask?.language ?? (profile as any)?.target_language ?? "java";

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
      {selectedTask ? (
        <div className="border-b bg-muted/30 px-4 py-3 sm:px-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Aktuelle Aufgabe</p>
          <p className="mt-1 text-sm font-medium">{selectedTask.title}</p>
          <p className="text-sm text-muted-foreground">{selectedTask.prompt}</p>
        </div>
      ) : null}
      <main className="flex-1 p-4 sm:p-6">
        <WorkspaceClient
          snippets={snippets}
          initialLanguage={initialLanguage}
          initialCode={selectedTask?.starterCode}
        />
      </main>
    </div>
  );
}
