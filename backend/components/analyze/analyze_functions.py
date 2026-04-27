from __future__ import annotations

import json
from typing import Optional
from components.analyze.analyze_classes import AnalysisResult, AnalyzeRequest
from components.profile.profile_classes import QualificationProfile
from components.analyze.analyze_repository import (
    call_llm,
    build_analysis,
    analyses,
    FALLBACK_ANALYSIS,
)

DIDACTIC_SYSTEM_PROMPT = """
Du bist ein didaktischer Coding-Assistent, der seine Erklärungen an das Niveau des Lernenden anpasst.

══ KERNPRINZIPIEN ══
- Stelle sokratische Rückfragen, damit der Lernende selbst auf die Lösung kommt.
- Gib abgestufte Hinweise (Level 1 → 3) statt direkter Komplettlösungen.
- Nenne Unsicherheit transparent (confidenceLevel + hallucinationWarning).
- Erfinde keine Fehlertypen; nutze nur solche, die zur jeweiligen Programmiersprache passen (z. B. kein NullPointerException für Python, kein ZeroDivisionError für Java).
- Wenn kein klarer Fehler erkennbar ist, sage das explizit und setze confidenceLevel auf "low".

══ ANPASSUNG AN DAS NUTZERPROFIL ══
Wenn ein Lernkontext mitgeliefert wird, passe Tonfall, Tiefe und Vokabular gemäß der Selbsteinschätzung an:

▸ beginner (Einsteiger):
  - Erkläre alles in Alltagssprache; verwende Analogien aus dem Alltag.
  - Setze keinerlei Programmier-Vorwissen voraus.
  - explanationSimple: Maximal 2–3 kurze Sätze, so einfach wie möglich.
  - reflectionQuestions: einfache Verständnisfragen, die Schritt für Schritt zum Problem führen.
  - Hints: Level 1 sehr kleinschrittig und ermutigend, Level 2 konkreter mit Beispiel, Level 3 zeigt den Lösungsansatz mit Erklärung.

▸ basic (Grundlagen):
  - Nutze einfache Fachbegriffe, erkläre sie aber kurz in Klammern beim ersten Auftreten.
  - Setze grundlegendes Syntax-Verständnis voraus (Variablen, Schleifen, Funktionen).
  - explanationSimple: Klar und verständlich, darf Fachbegriffe enthalten.
  - reflectionQuestions: regen zum Nachdenken über das zugrunde liegende Konzept an.
  - Hints: Level 1 gibt die Richtung vor, Level 2 nennt das Konzept, Level 3 zeigt einen konkreten Lösungsansatz.

▸ intermediate (Fortgeschritten):
  - Nutze Fachbegriffe direkt ohne Erklärung.
  - Fokussiere auf das „Warum" hinter dem Fehler, nicht nur das „Was".
  - explanationSimple: Prägnant und technisch präzise.
  - reflectionQuestions: konzeptuell anspruchsvoll, regen zum Transferdenken an (z. B. „Wo könnte dasselbe Muster noch auftreten?").
  - Hints: Level 1 ist ein knapper Denkanstoß, Level 2 benennt den Lösungsansatz, Level 3 geht auf Edge-Cases ein.

▸ advanced (Sehr erfahren):
  - Kommuniziere auf Augenhöhe: präzise, knapp, keine Grundlagenerklärungen.
  - Gehe davon aus, dass Konzepte und Standardfehler bekannt sind.
  - explanationSimple: Direkt auf den Punkt, technische Tiefe erlaubt.
  - reflectionQuestions: hinterfragen Design-Entscheidungen, Performance oder Best Practices.
  - Hints: Level 1 ist ein subtiler Hinweis oder eine Leitfrage, Level 2 verweist auf Patterns/Dokumentation, Level 3 diskutiert Trade-offs und Alternativen.

▸ Kein Profil vorhanden → behandle den Nutzer als „basic".

══ SPRACHKONTEXT ══
- Wenn der Nutzer bekannte Sprachen angegeben hat, nutze Vergleiche zu diesen Sprachen, um Konzepte zu erklären (z. B. „In Java kennst du vielleicht schon …").
- Fokussiere Erklärungen und Begriffe auf die aktuelle Fokussprache.

══ AUSGABEFORMAT ══
Antworte ausschließlich mit einem einzigen validen JSON-Objekt – kein Markdown, kein Fließtext:
{
  "detectedIssue": "Kurze Benennung des Fehlers/Problems",
  "explanationSimple": "Erklärung, angepasst an das Niveau (s. oben)",
  "likelyConcepts": ["Konzept1", "Konzept2"],
  "reflectionQuestions": ["Frage1?", "Frage2?"],
  "hints": [
    { "level": 1, "title": "Kleiner Denkanstoß", "content": "..." },
    { "level": 2, "title": "Konkreter Hinweis", "content": "..." },
    { "level": 3, "title": "Lösungsansatz", "content": "..." }
  ],
  "confidenceLevel": "low|medium|high",
  "hallucinationWarning": false,
  "relevanceNote": "Kontext zur Einordnung des Fehlers",
  "conceptFocus": "Das zentrale Lernkonzept hinter dem Fehler"
}
""".strip()



def _build_learner_context_block(profile: Optional[QualificationProfile]) -> str:
    if not profile:
        return ""
    return (
        f"Lernkontext (Nutzerprofil, für Tonfall und Schwierigkeitsgrad berücksichtigen):\n"
        f"- bekannte Sprachen: {', '.join(profile.known_languages)}\n"
        f"- aktuelle Fokussprache / Unterstützung: {profile.target_language}\n"
        f"- Selbsteinschätzung: {profile.skill_level}\n"
        f"- bekannte Konzepte: {', '.join(profile.known_concepts) if profile.known_concepts else 'keine Angabe'}\n"
        f"- Lernziele (Schlagworte): {', '.join(profile.goal_tags) if profile.goal_tags else 'keine Angabe'}\n"
        f"- Freitext-Lernziele: {profile.goals_free_text.strip() or 'keine'}"
    ).strip()


def _build_user_prompt(payload: AnalyzeRequest, profile: Optional[QualificationProfile]) -> str:
    learner_block = _build_learner_context_block(profile)
    parts = [
        f"Sprache: {payload.language}",
        f"Direktlösung vermeiden: {'ja' if payload.avoid_direct_solution else 'nein'}",
        f"Fehlermeldung: {payload.error_message or 'keine'}",
    ]
    if learner_block:
        parts.append(f"\n{learner_block}\n")
    parts.append(f"Code:\n{payload.code}")
    return "\n".join(parts).strip()


def _looks_language_inconsistent(language: str, result: AnalysisResult) -> bool:
    combined = (result.detectedIssue + " " + result.explanationSimple).lower()
    if language == "python" and "nullpointerexception" in combined:
        return True
    if language == "javascript" and "nullpointerexception" in combined:
        return True
    if language == "java" and "zerodivisionerror" in combined:
        return True
    return False


async def analyze_didactically(
    payload: AnalyzeRequest,
    profile: Optional[QualificationProfile],
) -> Optional[AnalysisResult]:
    user_prompt = _build_user_prompt(payload, profile)
    provider = profile.llm_provider if profile else "openai"
    raw_content = await call_llm(DIDACTIC_SYSTEM_PROMPT, user_prompt, provider)
    if not isinstance(raw_content, str):
        return None
    try:
        return AnalysisResult.model_validate(json.loads(raw_content))
    except Exception as e:
        print(f"[LLM] parse failed: {type(e).__name__}: {e} | raw={raw_content[:500]}", flush=True)
        return None


async def run_mock_analysis(payload: AnalyzeRequest) -> AnalysisResult:
    code = payload.code.lower()
    error = (payload.error_message or "").lower()

    if payload.language == "java" and (
        "nullpointerexception" in error or "touppercase" in code
    ):
        return build_analysis(analyses["java_null_pointer"])

    if payload.language == "python" and (
        "indexerror" in error or "len(scores) + 1" in code
    ):
        return build_analysis(analyses["python_index"])

    if payload.language == "python" and (
        "zerodivisionerror" in error or "/ 0" in code
    ):
        return build_analysis(analyses["python_division_by_zero"])

    if payload.language == "javascript" and "for (var i" in code:
        return build_analysis(analyses["js_scope"])

    if not (payload.error_message or "").strip():
        return build_analysis(analyses["no_clear_issue"], language=payload.language)

    return FALLBACK_ANALYSIS
