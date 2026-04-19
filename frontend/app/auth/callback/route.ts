import { type NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

// Supabase sends the user here after email confirmation.
// We exchange the code for a session via FastAPI, which sets httpOnly cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/workspace";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const res = await fetch(`${FASTAPI_URL}/api/auth/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    const data = await res.json();
    const response = NextResponse.redirect(`${origin}${next}`);

    if (data.access_token) {
      response.cookies.set("sb-access-token", data.access_token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    if (data.refresh_token) {
      response.cookies.set("sb-refresh-token", data.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
