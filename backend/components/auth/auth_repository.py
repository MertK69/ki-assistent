from typing import Optional
from config import settings
from core.supabase import get_anon_client


async def sign_in(email: str, password: str) -> Optional[dict]:
    if not settings.supabase_configured:
        return None
    try:
        client = get_anon_client()
        response = client.auth.sign_in_with_password({"email": email, "password": password})
        if response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {"id": response.user.id, "email": response.user.email},
            }
        return None
    except Exception:
        return None


async def sign_up(email: str, password: str, redirect_to: str) -> dict:
    if not settings.supabase_configured:
        return {"error": "Supabase ist nicht konfiguriert."}
    try:
        client = get_anon_client()
        response = client.auth.sign_up(
            {"email": email, "password": password, "options": {"email_redirect_to": redirect_to}}
        )
        if response.session:
            return {
                "ok": True,
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
            }
        return {"ok": True, "needs_email_confirmation": True}
    except Exception as e:
        return {"error": str(e)}


async def sign_out(token: str) -> None:
    if not settings.supabase_configured:
        return
    try:
        client = get_anon_client()
        client.auth.sign_out()
    except Exception:
        pass


async def get_current_user(token: str) -> Optional[dict]:
    if not settings.supabase_configured:
        return None
    try:
        client = get_anon_client()
        response = client.auth.get_user(token)
        if response and response.user:
            return {"user_id": response.user.id, "email": response.user.email or ""}
        return None
    except Exception:
        return None


async def exchange_code_for_session(code: str) -> dict:
    if not settings.supabase_configured:
        raise ValueError("Supabase nicht konfiguriert.")
    client = get_anon_client()
    response = client.auth.exchange_code_for_session(code)
    if not response.session:
        raise ValueError("Code ungültig.")
    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
    }
