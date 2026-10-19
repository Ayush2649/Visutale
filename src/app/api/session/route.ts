import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.session) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "No active authenticated session found.",
          },
        },
        { status: 401 }
      );
    }

    const sessionView = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      expiresAt: session.session.expiresAt,
      workspaceId: session.user.id,
      capabilities: {
        generation: true,
        instagramPublishing: false,
      },
    };

    return NextResponse.json(
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
  } catch (error) {
    console.error("GET /api/session error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to resolve session.",
        },
      },
      { status: 500 }
    );
  }
}
