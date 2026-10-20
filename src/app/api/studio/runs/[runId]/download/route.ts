import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { stat, readFile } from "node:fs/promises";
import { resolveRunPath, readRunManifest } from "@/pipeline/runService";
import { getStudioJobManager } from "@/lib/studioJobManager";
import { findRunPathById } from "@/lib/studioService";
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

    const store = getStudioJobManager().getStore();
    const runDir = resolveRunPath(store, runPathStr);
    const manifest = await readRunManifest(store, runPathStr);

    const videoRel = manifest.artifacts.outputVideo || "output.mp4";
    const videoAbs = path.join(runDir, videoRel);

    const fileStat = await stat(videoAbs);
    if (!fileStat.isFile() || fileStat.size === 0) {
      return NextResponse.json(
        { error: "Master render artifact does not exist or has zero bytes. Generation must complete before downloading." },
        { status: 404 }
      );
    }

    const buffer = await readFile(videoAbs);
    const downloadFilename = `${manifest.runId}-master.mp4`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 }
    );
  }
}
