from fastapi import Request, HTTPException
from core.supabase import verify_jwt


def extract_token(request: Request) -> str:
    """Read token from cookie (browser) or Authorization header (SSR)."""
    token = request.cookies.get("sb-access-token", "")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    return token


async def get_current_user_id(request: Request) -> str:
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    user_id = await verify_jwt(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Ungültige Session.")
    return user_id


async def get_current_user(request: Request):
    user_id = await get_current_user_id(request)

    class CurrentUser:
        def __init__(self, id: str):
            self.id = id

    return CurrentUser(user_id)
