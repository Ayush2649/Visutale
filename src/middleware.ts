import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets, Next internals, and public auth endpoints are exempt
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/session/sign-in") ||
    pathname.startsWith("/api/session/sign-up") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthPage = pathname === "/sign-in" || pathname === "/create-account";
  const isProtectedPage =
    pathname === "/your-videos" ||
    pathname === "/welcome" ||
    pathname === "/settings" ||
    pathname.startsWith("/studio");

  // If user visits an auth page with an active session token, route to protected library
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/your-videos", request.url));
  }

  // If user visits a protected page without a session token, redirect to sign-in
  if (isProtectedPage && !sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

