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

    const setCookie = authResponse.headers.get("set-cookie");
    if (setCookie) {
      res.headers.set("set-cookie", setCookie);
    } else {
      // Ensure session cookie is explicitly cleared
      res.cookies.set("better-auth.session_token", "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res;
  } catch (error) {
    console.error("POST /api/session/sign-out error:", error);
    const res = new NextResponse(null, { status: 204 });
    res.cookies.set("better-auth.session_token", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }
}

