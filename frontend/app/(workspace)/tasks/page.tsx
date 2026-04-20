import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { getTasks } from "@/lib/api";

interface Task {
  id: string;
  title: string;
  difficulty: string;
  language: string;
  conceptTags: string[];
  prompt: string;
  successCriteria: string;
  starterCode: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
};

const DIFFICULTY_ORDER: Record<string, number> = {
  leicht: 0,
  mittel: 1,
  fortgeschritten: 2,
};

const difficultyColor: Record<string, string> = {
  leicht: "bg-emerald-100 text-emerald-800",
  mittel: "bg-amber-100 text-amber-800",
  fortgeschritten: "bg-red-100 text-red-800",
};

export default async function TasksPage() {
  const tasks = (await getTasks()) as unknown as Task[];

  const grouped = Object.keys(LANGUAGE_LABELS).map((lang) => ({
    language: lang,
    label: LANGUAGE_LABELS[lang],
    items: tasks
      .filter((t) => t.language === lang)
      .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99)),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Verstehen statt Kopieren</p>
        <h1 className="text-xl font-semibold tracking-tight">Aufgaben- und Übungsmodus</h1>
        <p className="text-sm text-muted-foreground">
          Wähle eine Aufgabe und arbeite mit Lernbegleitung statt Lösungsausgabe.
        </p>
      </header>
      <main className="flex-1 space-y-8 p-4 sm:p-6">
        {grouped.map((group) => (
          <section key={group.language} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold">{group.label}</h2>
              <span className="text-xs text-muted-foreground">{group.items.length} Aufgaben</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {group.items.map((task) => (
                <div key={task.id} className="flex flex-col rounded-2xl border bg-card p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        difficultyColor[task.difficulty] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {task.difficulty}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{task.prompt}</p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {task.conceptTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">
                    <span className="font-medium">Ziel:</span> {task.successCriteria}
                  </p>
                  <Link
                    href={`/workspace?task=${encodeURIComponent(task.id)}`}
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Starte Aufgabe
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
