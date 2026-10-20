import { NextRequest, NextResponse } from "next/server";
import { getStudioJobManager } from "@/lib/studioJobManager";
import { findRunPathById } from "@/lib/studioService";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    const runPathStr = await findRunPathById(params.runId, undefined, session.user.id);
    if (!runPathStr) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const jobManager = getStudioJobManager();
    const job = await jobManager.startRenderJob(runPathStr, session.user.id);

    return NextResponse.json({ success: true, job }, { status: 202 });
  } catch (err: any) {
    if (err?.status === 404 || err?.message === "RESOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to start render job" },
      { status: 400 }
    );
  }
}
