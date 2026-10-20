import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authResponse = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });

    const res = new NextResponse(null, { status: 204 });

    const setCookies = typeof authResponse.headers.getSetCookie === "function"
      ? authResponse.headers.getSetCookie()
      : [];

    if (setCookies.length > 0) {
      for (const cookie of setCookies) {
        res.headers.append("set-cookie", cookie);
      }
    } else {
      const singleCookie = authResponse.headers.get("set-cookie");
      if (singleCookie) {
        res.headers.set("set-cookie", singleCookie);
      }
    }

    // Always ensure cookie deletion is explicitly enforced in response headers
    const clearOpts = {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };
    res.cookies.set("better-auth.session_token", "", clearOpts);
    res.cookies.set("__Secure-better-auth.session_token", "", clearOpts);

    return res;
  } catch (error) {
    console.error("POST /api/session/sign-out error:", error);
    const res = new NextResponse(null, { status: 204 });
    const clearOpts = {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };
    res.cookies.set("better-auth.session_token", "", clearOpts);
    res.cookies.set("__Secure-better-auth.session_token", "", clearOpts);
    return res;
  }
}
