import { getConcepts } from "@/lib/api";

export default async function ConceptsPage() {
  const concepts = await getConcepts() as Array<{
    id: string;
    title: string;
    shortDescription: string;
    practicalTip: string;
  }>;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Verstehen statt Kopieren</p>
        <h1 className="text-xl font-semibold tracking-tight">Konzeptbibliothek</h1>
        <p className="text-sm text-muted-foreground">Kernkonzepte und praktische Tipps für sauberes Programmieren.</p>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {concepts.map((concept) => (
            <div key={concept.id} className="rounded-2xl border bg-card p-5">
              <h3 className="mb-2 font-medium">{concept.title}</h3>
              <p className="mb-3 text-sm text-muted-foreground">{concept.shortDescription}</p>
              <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Tipp:</span> {concept.practicalTip}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
