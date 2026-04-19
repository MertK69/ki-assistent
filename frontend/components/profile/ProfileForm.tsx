"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

const FOCUS_LANGUAGES = [
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "assembly", label: "Assembly" },
];

const CONCEPT_OPTIONS = [
  { id: "variables", label: "Variablen & Typen" },
  { id: "control-flow", label: "Kontrollfluss (if/else, Schleifen)" },
  { id: "functions", label: "Funktionen / Methoden" },
  { id: "collections", label: "Listen, Arrays, Maps" },
  { id: "memory-pointers", label: "Speicher / Pointer (z. B. bei C/Assembly)" },
  { id: "exceptions", label: "Exceptions & Fehlerbehandlung" },
  { id: "debugging", label: "Debugging & Tests" },
  { id: "algorithms", label: "Algorithmen & Komplexität" },
];

const GOAL_TAG_OPTIONS = [
  { id: "exam-prep", label: "Prüfungsvorbereitung" },
  { id: "assignments", label: "Übungsblätter / Projekte" },
  { id: "debugging-habits", label: "Sauberes Debuggen lernen" },
  { id: "oop", label: "OOP / Klassendesign" },
  { id: "functional", label: "Funktionale Konzepte" },
  { id: "low-level", label: "Hardwarenahe Programmierung" },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Einsteiger" },
  { value: "basic", label: "Grundlagen" },
  { value: "intermediate", label: "Fortgeschritten" },
  { value: "advanced", label: "Sehr erfahren" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProfileForm({
  mode,
  initial,
}: {
  mode: "onboarding" | "settings";
  initial: Record<string, any> | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [knownLanguages, setKnownLanguages] = useState<string[]>(
    initial?.known_languages?.length ? initial.known_languages : ["python"],
  );
  const [targetLanguage, setTargetLanguage] = useState<string>(initial?.target_language ?? "python");
  const [skillLevel, setSkillLevel] = useState<string>(initial?.skill_level ?? "beginner");
  const [knownConcepts, setKnownConcepts] = useState<string[]>(initial?.known_concepts ?? []);
  const [goalTags, setGoalTags] = useState<string[]>(initial?.goal_tags ?? []);
  const [goalsFreeText, setGoalsFreeText] = useState<string>(initial?.goals_free_text ?? "");

  async function submit() {
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          known_languages: knownLanguages,
          target_language: targetLanguage,
          skill_level: skillLevel,
          known_concepts: knownConcepts,
          goal_tags: goalTags,
          goals_free_text: goalsFreeText,
          onboarding_completed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Speichern fehlgeschlagen.");
        return;
      }
      setSuccess(true);
      router.refresh();
      if (mode === "onboarding") {
        router.push("/workspace");
      }
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold">
        {mode === "onboarding" ? "Qualifikationsprofil" : "Lernprofil bearbeiten"}
      </h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Diese Angaben sind die Grundlage für personalisierte Erklärungen und Aufgaben.
      </p>

      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-medium">Bekannte Programmiersprachen</p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_LANGUAGES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setKnownLanguages(toggle(knownLanguages, value))}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium",
                  knownLanguages.includes(value)
                    ? "bg-primary text-primary-foreground"
                    : "border hover:bg-accent",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Unterstützung aktuell in</p>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              {FOCUS_LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Selbsteinschätzung</p>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              {SKILL_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium">Bereits bekannte Konzepte</p>
          <div className="flex flex-wrap gap-2">
            {CONCEPT_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setKnownConcepts(toggle(knownConcepts, id))}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium",
                  knownConcepts.includes(id)
                    ? "bg-secondary text-secondary-foreground"
                    : "border hover:bg-accent",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium">Lernziele (Schlagworte)</p>
          <div className="flex flex-wrap gap-2">
            {GOAL_TAG_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setGoalTags(toggle(goalTags, id))}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium",
                  goalTags.includes(id)
                    ? "bg-secondary text-secondary-foreground"
                    : "border hover:bg-accent",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Freitext (optional)</p>
            <textarea
              value={goalsFreeText}
              onChange={(e) => setGoalsFreeText(e.target.value)}
              placeholder="z. B. Prüfung Algorithmen im Sommer, sichere Schleifen verstehen …"
              maxLength={2000}
              rows={4}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            />
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success && mode === "settings" ? (
          <p className="text-sm text-emerald-700">Profil gespeichert.</p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Speichern…
            </>
          ) : mode === "onboarding" ? (
            "Profil speichern und Studio öffnen"
          ) : (
            "Änderungen speichern"
          )}
        </button>
      </div>
    </div>
  );
}
