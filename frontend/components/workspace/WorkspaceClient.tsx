"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  FlaskConical,
  Lightbulb,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

const LANGUAGE_LABELS: Record<string, string> = {
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  assembly: "Assembly",
};

function monacoLang(lang: string) {
  return lang === "assembly" ? "plaintext" : lang;
}

interface Hint {
  level: 1 | 2 | 3;
  title: string;
  content: string;
}

interface AnalysisResult {
  detectedIssue: string;
  explanationSimple: string;
  likelyConcepts: string[];
  reflectionQuestions: string[];
  hints: Hint[];
  confidenceLevel: "low" | "medium" | "high";
  hallucinationWarning: boolean;
  relevanceNote: string;
  conceptFocus: string;
}

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  errorMessage: string;
}

const CONFIDENCE_VALUE = { low: 35, medium: 65, high: 90 };

export function WorkspaceClient({
  snippets,
  initialLanguage = "java",
}: {
  snippets: Snippet[];
  initialLanguage?: string;
}) {
  const defaultSnippet = snippets.find((s) => s.language === initialLanguage) ?? snippets[0];

  const [language, setLanguage] = useState(defaultSnippet?.language ?? "java");
  const [code, setCode] = useState(defaultSnippet?.code ?? "");
  const [errorMessage, setErrorMessage] = useState(defaultSnippet?.errorMessage ?? "");
  const [safeLearningMode, setSafeLearningMode] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeHintLevel, setActiveHintLevel] = useState<1 | 2 | 3>(1);

  function applySnippet(snippetId: string) {
    const s = snippets.find((x) => x.id === snippetId);
    if (!s) return;
    setLanguage(s.language);
    setCode(s.code);
    setErrorMessage(s.errorMessage);
    setAnalysis(null);
    setActiveHintLevel(1);
  }

  async function handleAnalyze() {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/api/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          error_message: errorMessage || undefined,
          avoid_direct_solution: safeLearningMode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setAnalysis(data.result);
        setActiveHintLevel(1);
      } else {
        setAnalysis(null);
      }
    } catch {
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const activeHint = analysis?.hints.find((h) => h.level === activeHintLevel) ?? analysis?.hints[0];
  const progressValue = activeHintLevel === 1 ? 35 : activeHintLevel === 2 ? 68 : 100;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <section className="space-y-4">
        <div className="rounded-2xl border bg-card">
          <div className="space-y-4 p-5 pb-0">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Code Studio</p>
              <p className="text-sm text-muted-foreground">
                Analysiere deinen Code schrittweise statt nur fertige Antworten zu konsumieren.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setAnalysis(null);
                  setActiveHintLevel(1);
                }}
                className="rounded-xl border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(LANGUAGE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              <select
                onChange={(e) => { if (e.target.value) applySnippet(e.target.value); }}
                className="rounded-xl border bg-background px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>Starter Snippet laden</option>
                {snippets.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <PlayCircle className="h-4 w-4" />
                {isAnalyzing ? "Analysiere…" : "Analysieren"}
              </button>
            </div>

            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Optionale Fehlermeldung einfügen"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            />

            <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              <FlaskConical className="h-4 w-4 text-primary" />
              Aktive Sprache: {LANGUAGE_LABELS[language]} – Analyse mit Mock-Fallback und optionalem LLM.
            </div>
          </div>

          <div className="p-5 pt-3">
            <div className="overflow-hidden rounded-xl border">
              <Editor
                height="420px"
                language={monacoLang(language)}
                value={code}
                onChange={(val) => { setCode(val ?? ""); setAnalysis(null); }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbersMinChars: 3,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          <div className="border-t px-5 py-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={safeLearningMode}
                onChange={(e) => setSafeLearningMode(e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">Sicherer Lernmodus</span>
              <span className="text-muted-foreground">– Direktlösungen werden vermieden</span>
            </label>
          </div>
        </div>
      </section>

      {/* Assistant Panel */}
      <section className="space-y-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center rounded-2xl border bg-card p-12 text-sm text-muted-foreground">
            Didaktische Analyse wird vorbereitet…
          </div>
        ) : !analysis ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center">
            <p className="font-medium">Noch keine Analyse vorhanden</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Klicke auf Analysieren, um Diagnose, Leitfragen und gestufte Hilfen zu erhalten.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card">
            <div className="space-y-4 p-5 pb-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Assistance Panel</p>
                <p className="text-sm text-muted-foreground">
                  Diagnose, Konzept und Guided Hints statt direkter Komplettlösung.
                </p>
              </div>

              {/* Confidence Badge */}
              <div className="space-y-2 rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Confidence Meter</p>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
                    {analysis.confidenceLevel}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${CONFIDENCE_VALUE[analysis.confidenceLevel]}%` }}
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  {analysis.hallucinationWarning ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                  ) : (
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  )}
                  <p>
                    {analysis.hallucinationWarning
                      ? "Möglicherweise unsicher. Bitte Code testen und mit eigener Logik prüfen."
                      : "Relativ konsistente Analyse. Trotzdem vor Ausführung validieren."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 pt-0">
              {/* Diagnosis */}
              <div className="rounded-xl border bg-muted/50 p-4">
                <p className="mb-2 text-sm font-medium">Fehlerdiagnose-Karte</p>
                <p className="text-sm font-medium text-foreground">{analysis.detectedIssue}</p>
                <p className="mt-1 text-sm text-muted-foreground">{analysis.explanationSimple}</p>
              </div>

              {/* Hints */}
              <div className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Fragestrecke / Guided Hints</p>
                  <button
                    onClick={() => setActiveHintLevel((l) => Math.min(3, l + 1) as 1 | 2 | 3)}
                    className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                  >
                    Nächsten Hinweis
                  </button>
                </div>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setActiveHintLevel(lvl)}
                      className={[
                        "rounded-lg px-3 py-1 text-xs font-medium",
                        activeHintLevel === lvl
                          ? "bg-primary text-primary-foreground"
                          : "border hover:bg-accent",
                      ].join(" ")}
                    >
                      Hinweis {lvl}
                    </button>
                  ))}
                </div>
                {activeHint ? (
                  <div className="rounded-xl border border-primary/60 p-3 shadow-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        {activeHint.title}
                      </span>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        Level {activeHint.level}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activeHint.content}</p>
                  </div>
                ) : null}
              </div>

              {/* Reflection */}
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-sm font-medium">Reflexionsfragen</p>
                <ul className="space-y-2">
                  {analysis.reflectionQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concepts */}
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-1 text-sm font-medium">Welches Konzept steckt dahinter?</p>
                <p className="text-sm text-muted-foreground">{analysis.conceptFocus}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-1 text-sm font-medium">Warum ist das relevant?</p>
                <p className="text-sm text-muted-foreground">{analysis.relevanceNote}</p>
              </div>

              {/* Progress */}
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-sm font-medium">Fortschritt der Selbstableitung</p>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <p className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Problem erkannt
                  </p>
                  <p className="flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-blue-600" /> Konzept verstanden
                  </p>
                  <p className="flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-violet-600" /> Lösung selbst hergeleitet
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-300/70 bg-amber-50/70 p-3 text-xs text-amber-900">
                <p className="mb-1 flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Vertrauenshinweis
                </p>
                <p>
                  Möglicherweise unsicher. Bitte Code testen, Randfälle prüfen und Annahmen hinterfragen.
                  Antwort basiert auf Heuristik und Modellannahmen.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
