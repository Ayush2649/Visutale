import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email and passphrase are required.",
          },
        },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email and passphrase are required.",
          },
        },
        { status: 400 }
      );
    }

    try {
      const authResponse = await auth.api.signInEmail({
        body: { email, password },
        headers: request.headers,
        asResponse: true,
      });

      if (!authResponse.ok) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or passphrase.",
            },
          },
          { status: 401 }
        );
      }

      // Re-read active session to construct canonical SessionView
      const responseData = await authResponse.json().catch(() => null);
      const user = responseData?.user;

      const sessionView = {
        user: {
          id: user?.id || "",
          email: user?.email || email,
          name: user?.name || "",
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        workspaceId: user?.id || "",
        capabilities: {
          generation: true,
          instagramPublishing: false,
        },
      };

      const res = NextResponse.json(
        {
          data: sessionView,
          meta: {
            requestId: `req_${Date.now()}`,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );

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

      return res;
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or passphrase.",
          },
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("POST /api/session/sign-in error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Sign in failed.",
        },
      },
      { status: 500 }
    );
  }
}

