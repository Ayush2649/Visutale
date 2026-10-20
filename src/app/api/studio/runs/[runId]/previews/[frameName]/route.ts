import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { resolveRunPath, readRunManifest } from "@/pipeline/runService";
import { getStudioJobManager } from "@/lib/studioJobManager";
import { findRunPathById } from "@/lib/studioService";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string; frameName: string } }
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

    const frameName = params.frameName;

    // Guard against path traversal
    if (!/^[a-zA-Z0-9_-]+\.png$/.test(frameName)) {
      return NextResponse.json({ error: "Invalid frame filename" }, { status: 400 });
    }

    const store = getStudioJobManager().getStore();
    const manifest = await readRunManifest(store, runPathStr);
    if (manifest.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const runDir = resolveRunPath(store, runPathStr);
    const framePath = path.join(runDir, "preview-frames", frameName);

    const s = await stat(framePath);
    if (!s.isFile() || s.size === 0) {
      return NextResponse.json({ error: "Preview frame not found" }, { status: 404 });
    }

    const buffer = await readFile(framePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": s.size.toString(),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 }
    );
  }
}
