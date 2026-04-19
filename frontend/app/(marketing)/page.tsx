import Link from "next/link";
import { ArrowRight, BookMarked, BrainCircuit, Bug, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    title: "Fehler verstehen",
    description: "Fehlermeldungen in einfacher Sprache mit Kontext zur eigentlichen Ursache.",
    icon: Bug,
  },
  {
    title: "Schrittweise Hilfe",
    description: "Guided Hints in drei Tiefenstufen statt sofortiger Komplettlösung.",
    icon: BrainCircuit,
  },
  {
    title: "Konzepte lernen",
    description: "Aus jedem Bug wird ein Lernmoment mit relevantem Kernkonzept.",
    icon: BookMarked,
  },
  {
    title: "Sicherer Umgang mit KI",
    description: "Confidence Meter, Halluzinationshinweis und klare Testempfehlungen.",
    icon: ShieldCheck,
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,theme(colors.indigo.50),theme(colors.background)_55%)] px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-3xl border bg-background/85 p-8 shadow-sm backdrop-blur sm:p-12">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            KI-gestützte Programmierausbildung
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            CodeMentor Learn – das Lernstudio für{" "}
            <span className="text-primary">Verstehen statt Kopieren</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Ein didaktisches Assistenzsystem für Programmier-Anfänger. Fokus auf Diagnose, Reflexion und
            schrittweiser Selbstableitung statt stumpfer Lösungsausgabe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Konto anlegen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login?next=/workspace"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Anmelden
            </Link>
            <Link
              href="/login?next=/tasks"
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              Zum Übungsmodus
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-base font-medium">
                <Icon className="h-5 w-5 text-primary" />
                {title}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
