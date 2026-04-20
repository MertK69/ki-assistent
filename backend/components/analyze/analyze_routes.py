from __future__ import annotations

import asyncio
from fastapi import APIRouter, Request, Depends
from components.analyze.analyze_classes import AnalyzeRequest
from components.profile.profile_functions import get_current_user
from components.profile.profile_repository import get_learner_profile
from components.history.history_repository import insert_history_entry
from components.analyze.analyze_functions import (
    analyze_didactically,
    run_mock_analysis,
    _looks_language_inconsistent,
)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze")
async def analyze(request: Request, body: AnalyzeRequest, current_user=Depends(get_current_user)):
    profile = None
    user_id = str(current_user.id)
    token = request.cookies.get("sb-access-token", "")
    if token:
        profile = await get_learner_profile(user_id, token)

    llm_result = await analyze_didactically(body, profile)
    if llm_result and not _looks_language_inconsistent(body.language, llm_result):
        asyncio.create_task(insert_history_entry(
            user_id=user_id,
            language=body.language,
            code_snippet=body.code,
            analysis_result=llm_result.model_dump(by_alias=True),
            provider=(profile.llm_provider if profile else "openai"),
        ))
        return {"result": llm_result}

    if llm_result:
        print(f"[ANALYZE] llm_result rejected (language inconsistent) | lang={body.language}", flush=True)

    mock_result = await run_mock_analysis(body)
    return {"result": mock_result}
