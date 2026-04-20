from typing import Optional
from datetime import datetime, timezone
from components.profile.profile_classes import QualificationProfile, ProfileUpsertRequest
from config import settings
from core.supabase import get_anon_client


async def get_learner_profile(user_id: str, token: str) -> Optional[QualificationProfile]:
    if not settings.supabase_configured:
        return None
    try:
        client = get_anon_client()
        client.postgrest.auth(token)
        response = (
            client.table("learner_profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        rows = response.data
        if not rows:
            return None
        row = rows[0]
        return QualificationProfile(
            user_id=row["id"],
            known_languages=row.get("known_languages", []),
            target_language=row.get("target_language", "python"),
            skill_level=row.get("skill_level", "beginner"),
            known_concepts=row.get("known_concepts", []),
            goal_tags=row.get("goal_tags", []),
            goals_free_text=row.get("goals_free_text") or "",
            onboarding_completed=row.get("onboarding_completed", False),
            llm_provider=row.get("llm_provider", "openai"),
            updated_at=row.get("updated_at", ""),
        )
    except Exception:
        return None


async def upsert_learner_profile(user_id: str, data: ProfileUpsertRequest, token: str) -> None:
    if not settings.supabase_configured:
        raise RuntimeError("Supabase ist nicht konfiguriert.")
    client = get_anon_client()
    client.postgrest.auth(token)
    payload = {
        "id": user_id,
        "known_languages": data.known_languages,
        "target_language": data.target_language,
        "skill_level": data.skill_level,
        "known_concepts": data.known_concepts,
        "goal_tags": data.goal_tags,
        "goals_free_text": data.goals_free_text.strip() or None,
        "onboarding_completed": data.onboarding_completed,
        "llm_provider": data.llm_provider or "openai",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    client.table("learner_profiles").upsert(payload, on_conflict="id").execute()


async def set_onboarding_incomplete(user_id: str, token: str) -> None:
    if not settings.supabase_configured:
        raise RuntimeError("Supabase ist nicht konfiguriert.")
    client = get_anon_client()
    client.postgrest.auth(token)
    client.table("learner_profiles").update(
        {"onboarding_completed": False, "updated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", user_id).execute()
