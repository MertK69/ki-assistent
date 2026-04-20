import json
from pathlib import Path
from typing import Optional
from components.analyze.analyze_classes import AnalysisResult, Hint
from config import settings

_data_dir = Path(__file__).parent.parent.parent / "data"


def get_llm_client(provider: str = "openai"):
    """Gibt einen OpenAI-kompatiblen Client zurück.
    Ollama nutzt dieselbe API-Struktur wie OpenAI."""
    from openai import AsyncOpenAI
    import os

    if provider == "ollama":
        return AsyncOpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama",  # Ollama braucht keinen echten Key
        ), "gemma3:4b"

    return AsyncOpenAI(
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        api_key=os.getenv("OPENAI_API_KEY"),
    ), os.getenv("OPENAI_MODEL", "gpt-4o-mini")


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


async def call_llm(system_prompt: str, user_prompt: str, provider: str = "openai") -> Optional[str]:
    """Call LLM API and return raw JSON content string, or None on failure."""
    if provider == "openai" and not settings.llm_configured:
        print(f"[LLM] not configured: OPENAI_ENABLED={settings.OPENAI_ENABLED} key_set={bool(settings.OPENAI_API_KEY.strip())}", flush=True)
        return None
    try:
        client, model_name = get_llm_client(provider)
        response = await client.chat.completions.create(
            model=model_name,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            timeout=30.0,
        )
        if not response or not response.choices:
            print("[LLM] API returned empty choices", flush=True)
            return None
        content = response.choices[0].message.content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "".join(part.text for part in content if hasattr(part, "text"))
        return None
    except Exception as e:
        print(f"[LLM] call failed: {type(e).__name__}: {e}", flush=True)
        return None
