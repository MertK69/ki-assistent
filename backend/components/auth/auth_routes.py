from __future__ import annotations

from fastapi import APIRouter, Response, Request, HTTPException
from config import settings
from components.auth.auth_repository import (
    sign_in,
    sign_up,
    sign_out,
    get_current_user,
    exchange_code_for_session,
)
from components.auth.auth_functions import set_auth_cookies, clear_auth_cookies
from components.auth.auth_classes import LoginRequest, RegisterRequest, ExchangeCodeRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    session = await sign_in(body.email, body.password)
    if not session:
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten.")
    set_auth_cookies(response, session["access_token"], session["refresh_token"])
    return {"ok": True, "redirect_to": "/workspace", "user": session["user"]}


@router.post("/register")
async def register(body: RegisterRequest, response: Response):
    redirect_to = f"{settings.FRONTEND_ORIGIN}/auth/callback?next=/onboarding"
    result = await sign_up(body.email, body.password, redirect_to)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    if result.get("access_token"):
        set_auth_cookies(response, result["access_token"], result.get("refresh_token", ""))
        return {"ok": True, "redirect_to": "/onboarding"}
    return {
        "ok": True,
        "needs_email_confirmation": True,
        "message": "Bitte bestätige deine E-Mail über den Link von Supabase, um fortzufahren.",
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("sb-access-token", "")
    if token:
        await sign_out(token)
    clear_auth_cookies(response)
    return {"ok": True, "redirect_to": "/login"}


@router.post("/exchange-code")
async def exchange_code(body: ExchangeCodeRequest):
    if not settings.supabase_configured:
        raise HTTPException(status_code=503, detail="Supabase nicht konfiguriert.")
    try:
        return await exchange_code_for_session(body.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
async def me(request: Request):
    token = request.cookies.get("sb-access-token", "")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    user_info = await get_current_user(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Ungültige Session.")
    return user_info
