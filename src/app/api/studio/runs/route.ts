import { NextRequest, NextResponse } from "next/server";
import {
  listRecentRuns,
  listAvailableFixtures,
  createStudioRun,
} from "@/lib/studioService";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required to access studio workspace." } },
        { status: 401 }
      );
    }

    const [runs, fixtures] = await Promise.all([
      listRecentRuns(undefined, session.user.id),
      listAvailableFixtures(),
    ]);

    return NextResponse.json({
      runs,
      fixtures,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load runs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required to create studio runs." } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "Invalid JSON request body." } },
        { status: 400 }
      );
    }

    const { topic, notes, voicePreset, fixtureId } = body;

    if (!topic && !fixtureId) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "A topic premise or benchmark fixture ID is required." } },
        { status: 400 }
      );
    }

    // Never trust client-supplied ownerId; always resolve from verified server session
    const result = await createStudioRun({
      topic: topic || fixtureId,
      notes,
      voicePreset: voicePreset || "indian-english-female",
      fixtureId,
      ownerId: session.user.id,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: any) {
    const statusCode = typeof err?.statusCode === "number" ? err.statusCode : (err?.code === "UNAUTHORIZED" ? 401 : 500);
    const safeError = {
      code: err?.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED"),
      message: err?.message || "Failed to create studio run",
      ...(err?.issues ? { issues: err.issues } : {}),
      ...(err?.provider ? { provider: err.provider } : {}),
      ...(err?.isRetryable !== undefined ? { isRetryable: err.isRetryable } : {}),
    };
    return NextResponse.json({ error: safeError }, { status: statusCode });
  }
}
