import { NextRequest, NextResponse } from "next/server";
import { getStudioRun, updateStudioPlan, findRunPathById } from "@/lib/studioService";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
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

    const result = await getStudioRun(runPathStr, session.user.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 }
    );
  }
}

export async function PUT(
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
    if (!body || !body.modifiedPlan) {
      return NextResponse.json(
        { error: "modifiedPlan is required in request body" },
        { status: 400 }
      );
    }

    const result = await updateStudioPlan({
      runPath: runPathStr,
      modifiedPlan: body.modifiedPlan,
      ownerId: session.user.id,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    if (err?.status === 404 || err?.message === "RESOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to update manuscript plan" },
      { status: 400 }
    );
  }
}
