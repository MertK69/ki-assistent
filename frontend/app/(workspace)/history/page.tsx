export default function HistoryPage() {
  // History persistence requires a future /api/history endpoint
  const entries = [
    { id: "1", language: "Java", title: "NullPointerException in StudentPrinter", summary: "Ursache isoliert: Aufruf auf null-Referenz.", confidence: "high", createdAt: "Heute, 10:24" },
    { id: "2", language: "Python", title: "IndexError in Notenliste", summary: "Schleifenende war um +1 verschoben.", confidence: "medium", createdAt: "Gestern, 19:11" },
  ];

  const confidenceColor: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Verstehen statt Kopieren</p>
        <h1 className="text-xl font-semibold tracking-tight">Lernverlauf</h1>
        <p className="text-sm text-muted-foreground">Deine bisherigen Analysesessions im Überblick.</p>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between rounded-2xl border bg-card p-5">
              <div>
                <p className="font-medium">{entry.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">{entry.createdAt} · {entry.language}</p>
              </div>
              <span className={`ml-4 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor[entry.confidence] ?? "bg-muted"}`}>
                {entry.confidence}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
