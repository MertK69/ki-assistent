from __future__ import annotations

from fastapi import APIRouter, Request
from components.analyze.analyze_classes import AnalyzeRequest
from core.supabase import verify_jwt
from components.profile.profile_repository import get_learner_profile
from components.analyze.analyze_functions import (
    analyze_didactically,
    run_mock_analysis,
    _looks_language_inconsistent,
)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze")
async def analyze(request: Request, body: AnalyzeRequest):
    profile = None
    token = request.cookies.get("sb-access-token", "")
    if token:
        user_id = await verify_jwt(token)
        if user_id:
            profile = await get_learner_profile(user_id, token)

    llm_result = await analyze_didactically(body, profile)
    if llm_result and not _looks_language_inconsistent(body.language, llm_result):
        return {"result": llm_result}

    mock_result = await run_mock_analysis(body)
    return {"result": mock_result}
