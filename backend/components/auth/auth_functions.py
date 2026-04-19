from fastapi import Response

COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="sb-access-token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )
    response.set_cookie(
        key="sb-refresh-token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("sb-access-token", path="/")
    response.delete_cookie("sb-refresh-token", path="/")
