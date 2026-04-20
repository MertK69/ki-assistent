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
Du bist ein didaktischer Coding-Assistent für Einsteiger.
Ziele:
- Erkläre Fehler in einfacher Sprache.
- Stelle sokratische Fragen.
- Gib abgestufte Hinweise statt direkter Komplettlösungen.
- Nenne Unsicherheit transparent.
- Erfinde keine Fehlertypen.
- Nutze nur Fehlertypen, die zur Sprache passen (z. B. kein NullPointerException für Python).
- Wenn im Code kein klaren Fehler erkennbar ist, sage das explizit.
- Wenn ein Lernkontext (Nutzerprofil) mitgeliefert wird, passe Tiefe und Vokabular daran an, ohne die JSON-Struktur zu ändern.

Ausgabeformat JSON:
{
  "detectedIssue": "...",
  "explanationSimple": "...",
  "likelyConcepts": ["...", "..."],
  "reflectionQuestions": ["...", "..."],
  "hints": [
    { "level": 1, "title": "...", "content": "..." },
    { "level": 2, "title": "...", "content": "..." },
    { "level": 3, "title": "...", "content": "..." }
  ],
  "confidenceLevel": "low|medium|high",
  "hallucinationWarning": false,
  "relevanceNote": "...",
  "conceptFocus": "..."
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
    raw_content = await call_llm(DIDACTIC_SYSTEM_PROMPT, user_prompt)
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
