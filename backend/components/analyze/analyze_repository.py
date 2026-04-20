import json
from pathlib import Path
from typing import Optional
import httpx
from components.analyze.analyze_classes import AnalysisResult, Hint
from config import settings

_data_dir = Path(__file__).parent.parent.parent / "data"


def _load_json(filename: str):
    with open(_data_dir / filename, encoding="utf-8") as f:
        return json.load(f)


def build_analysis(raw: dict, language: Optional[str] = None) -> AnalysisResult:
    detected_issue = raw["detectedIssue"]
    if detected_issue is None:
        detected_issue = f"Kein eindeutiger Laufzeitfehler für {language} erkannt."
    return AnalysisResult(
        detectedIssue=detected_issue,
        explanationSimple=raw["explanationSimple"],
        likelyConcepts=raw["likelyConcepts"],
        reflectionQuestions=raw["reflectionQuestions"],
        hints=[Hint(**h) for h in raw["hints"]],
        confidenceLevel=raw["confidenceLevel"],
        hallucinationWarning=raw["hallucinationWarning"],
        relevanceNote=raw["relevanceNote"],
        conceptFocus=raw["conceptFocus"],
    )


analyses = _load_json("analyses.json")
FALLBACK_ANALYSIS = build_analysis(analyses["fallback"])


async def call_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Call LLM API and return raw JSON content string, or None on failure."""
    if not settings.llm_configured:
        print(f"[LLM] not configured: OPENAI_ENABLED={settings.OPENAI_ENABLED} key_set={bool(settings.OPENAI_API_KEY.strip())}", flush=True)
        return None
    base_url = settings.OPENAI_BASE_URL.rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                },
                json={
                    "model": settings.OPENAI_MODEL,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
        if not response.is_success:
            print(f"[LLM] API {response.status_code}: {response.text[:500]}", flush=True)
            return None
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content")
    except Exception as e:
        print(f"[LLM] call failed: {type(e).__name__}: {e}", flush=True)
        return None
