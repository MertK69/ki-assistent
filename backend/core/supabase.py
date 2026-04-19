from typing import Optional
from supabase import create_client, Client
from config import settings


def get_anon_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_admin_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def verify_jwt(token: str) -> Optional[str]:
    """Verify access token and return user_id or None."""
    if not settings.supabase_configured:
        return None
    try:
        client = get_anon_client()
        response = client.auth.get_user(token)
        if response and response.user:
            return response.user.id
        return None
    except Exception:
        return None
