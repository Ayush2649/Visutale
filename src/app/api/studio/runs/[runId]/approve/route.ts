import { NextRequest, NextResponse } from "next/server";
import { approveStudioRun, findRunPathById } from "@/lib/studioService";
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

    const body = await request.json().catch(() => null);
    const planHash = body?.planHash;

    if (!planHash) {
      return NextResponse.json(
        { error: "planHash is required to approve run" },
        { status: 400 }
      );
    }

    const updatedManifest = await approveStudioRun({
      runPath: runPathStr,
      planHash,
      approvedBy: session.user.email || session.user.name || session.user.id,
      ownerId: session.user.id,
    });

    return NextResponse.json({ success: true, manifest: updatedManifest });
  } catch (err: any) {
    if (err?.status === 404 || err?.message === "RESOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err?.message || "Approval failed" },
      { status: 400 }
    );
  }
}
