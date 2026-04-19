from typing import Optional
from fastapi import APIRouter, Request, HTTPException
from components.profile.profile_classes import QualificationProfile, ProfileUpsertRequest
from components.profile.profile_functions import extract_token, get_current_user_id
from components.profile.profile_repository import (
    get_learner_profile,
    upsert_learner_profile,
    set_onboarding_incomplete,
)

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=Optional[QualificationProfile])
async def get_profile(request: Request):
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    user_id = await get_current_user_id(request)
    return await get_learner_profile(user_id, token)


@router.put("")
async def update_profile(request: Request, body: ProfileUpsertRequest):
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    user_id = await get_current_user_id(request)
    try:
        await upsert_learner_profile(user_id, body, token)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}


@router.post("/reset-onboarding")
async def reset_onboarding(request: Request):
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    user_id = await get_current_user_id(request)
    try:
        await set_onboarding_incomplete(user_id, token)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}
