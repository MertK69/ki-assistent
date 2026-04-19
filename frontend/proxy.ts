import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/workspace", "/tasks", "/concepts", "/history", "/settings", "/onboarding"];
const AUTH_ONLY = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("sb-access-token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
