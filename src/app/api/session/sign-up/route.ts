import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      typeof body.name !== "string"
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Full name, work email, and passphrase are required.",
          },
        },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!name || name.length < 2) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Please enter a valid author or educator name.",
          },
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Please enter a valid institutional or workspace email.",
          },
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Password must be at least 8 characters with numbers or symbols.",
          },
        },
        { status: 400 }
      );
    }

    try {
      const authResponse = await auth.api.signUpEmail({
        body: { email, password, name },
        headers: request.headers,
        asResponse: true,
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => null);
        const errorMessage = errorData?.message?.toLowerCase() || "";
        if (errorMessage.includes("exist") || errorMessage.includes("duplicate")) {
          return NextResponse.json(
            {
              error: {
                code: "ACCOUNT_EXISTS",
                message: "An account with this email address already exists. Please sign in.",
              },
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            error: {
              code: "REGISTRATION_FAILED",
              message: errorData?.message || "Registration failed.",
            },
          },
          { status: authResponse.status || 400 }
        );
      }

      const responseData = await authResponse.json().catch(() => null);
      const user = responseData?.user;

      const sessionView = {
        user: {
          id: user?.id || "",
          email: user?.email || email,
          name: user?.name || name,
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
          status: 201,
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
    } catch (authError: unknown) {
      const err = authError as { message?: string };
      if (err?.message?.toLowerCase().includes("exist")) {
        return NextResponse.json(
          {
            error: {
              code: "ACCOUNT_EXISTS",
              message: "An account with this email address already exists. Please sign in.",
            },
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error: {
            code: "REGISTRATION_FAILED",
            message: err?.message || "Account creation failed.",
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("POST /api/session/sign-up error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Registration service encountered an error.",
        },
      },
      { status: 500 }
    );
  }
}

