import { getTasks } from "@/lib/api";

export default async function TasksPage() {
  const tasks = await getTasks() as Array<{
    id: string;
    title: string;
    difficulty: string;
    language: string;
    conceptTags: string[];
    prompt: string;
    successCriteria: string;
    starterCode: string;
  }>;

  const difficultyColor: Record<string, string> = {
    leicht: "bg-emerald-100 text-emerald-800",
    mittel: "bg-amber-100 text-amber-800",
    fortgeschritten: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Verstehen statt Kopieren</p>
        <h1 className="text-xl font-semibold tracking-tight">Aufgaben- und Übungsmodus</h1>
        <p className="text-sm text-muted-foreground">
          Wähle eine Aufgabe und arbeite mit Lernbegleitung statt Lösungsausgabe.
        </p>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-sm font-medium">Kleine Programmieraufgaben</p>
          <p className="text-sm text-muted-foreground">
            Jede Aufgabe trainiert ein Kernkonzept mit sokratischen Impulsen.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border bg-card p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-medium">{task.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor[task.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                  {task.difficulty}
                </span>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{task.prompt}</p>
              <div className="flex flex-wrap gap-1">
                {task.conceptTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium">Ziel:</span> {task.successCriteria}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
