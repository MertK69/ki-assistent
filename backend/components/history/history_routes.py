from fastapi import APIRouter, Depends, HTTPException, Query
from .history_functions import fetch_user_history, remove_history_entry, clear_all_history
from .history_classes import HistoryListResponse
from components.profile.profile_functions import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=HistoryListResponse)
async def get_history(
    limit: int = Query(default=20, le=50),
    offset: int = Query(default=0, ge=0),
    current_user=Depends(get_current_user)
):
    return await fetch_user_history(str(current_user.id), limit, offset)


@router.delete("/{entry_id}")
async def delete_entry(entry_id: str, current_user=Depends(get_current_user)):
    try:
        return await remove_history_entry(entry_id, str(current_user.id))
    except ValueError:
        raise HTTPException(status_code=404, detail="Entry not found")


@router.delete("")
async def clear_history(current_user=Depends(get_current_user)):
    return await clear_all_history(str(current_user.id))
