from .history_repository import (
    get_history_for_user,
    delete_history_entry,
    delete_all_history_for_user,
)
from .history_classes import HistoryListResponse, HistoryEntry


async def fetch_user_history(
    user_id: str,
    limit: int = 20,
    offset: int = 0
) -> HistoryListResponse:
    data, total = await get_history_for_user(user_id, limit, offset)
    entries = [HistoryEntry(**entry) for entry in data]
    return HistoryListResponse(entries=entries, total=total)


async def remove_history_entry(entry_id: str, user_id: str) -> dict:
    success = await delete_history_entry(entry_id, user_id)
    if not success:
        raise ValueError("Entry not found or unauthorized")
    return {"ok": True}


async def clear_all_history(user_id: str) -> dict:
    await delete_all_history_for_user(user_id)
    return {"ok": True}
