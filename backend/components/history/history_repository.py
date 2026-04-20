from core.supabase import get_supabase_client
from typing import Any


async def insert_history_entry(
    user_id: str,
    language: str,
    code_snippet: str,
    analysis_result: dict[str, Any],
    provider: str = "openai"
) -> None:
    """Speichert eine Analyse in der DB. Fehler werden geloggt aber nicht geworfen
    – die Analyse selbst soll nicht scheitern wenn das Speichern fehlschlägt."""
    try:
        supabase = get_supabase_client()
        supabase.table("analysis_history").insert({
            "user_id": user_id,
            "language": language,
            "code_snippet": code_snippet,
            "analysis_result": analysis_result,
            "provider": provider,
        }).execute()
    except Exception as e:
        print(f"[history] Failed to save entry: {e}")


async def get_history_for_user(
    user_id: str,
    limit: int = 20,
    offset: int = 0
) -> tuple[list[dict], int]:
    """Gibt paginierten Verlauf zurück (neueste zuerst)."""
    supabase = get_supabase_client()

    result = (
        supabase.table("analysis_history")
        .select("*", count="exact")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data, result.count or 0


async def delete_history_entry(entry_id: str, user_id: str) -> bool:
    """Löscht einen Eintrag. Gibt True zurück wenn erfolgreich."""
    supabase = get_supabase_client()
    result = (
        supabase.table("analysis_history")
        .delete()
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(result.data) > 0


async def delete_all_history_for_user(user_id: str) -> None:
    """Löscht gesamten Verlauf eines Users."""
    supabase = get_supabase_client()
    supabase.table("analysis_history").delete().eq("user_id", user_id).execute()
