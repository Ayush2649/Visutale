import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { stat, open } from "node:fs/promises";
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
        { error: "Video output artifact not found or has zero bytes." },
        { status: 404 }
      );
    }

    const fileSize = fileStat.size;
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileHandle = await open(videoAbs, "r");
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    }

    const fileHandle = await open(videoAbs, "r");
    const buffer = Buffer.alloc(fileSize);
    await fileHandle.read(buffer, 0, fileSize, 0);
    await fileHandle.close();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 }
    );
  }
}
