import { mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { validatePlan } from "../contracts/plan.js";
import { isRunManifest, type RunManifest } from "../contracts/manifest.js";
import type { QaReport } from "../contracts/qa.js";
import type { SceneSpeechArtifact, ElevenLabsAlignment } from "../contracts/alignment.js";
import { LocalArtifactStore } from "../storage/localArtifactStore.js";
import { hashCanonicalJson } from "./canonicalHash.js";
import { resolveRunPath } from "./runService.js";
import { compilePlanTimeline } from "../timing/timelineCompiler.js";
import { validateRenderOutput } from "../validation/mediaValidator.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export interface RenderRunResult {
  manifest: RunManifest;
  qaReport: QaReport;
  outputVideoPath: string;
}

export async function renderRun(options: {
  runPath: string;
  store: LocalArtifactStore;
  now?: Date;
  onProgress?: (renderedFrames: number, totalFrames: number) => void;
}): Promise<RenderRunResult> {
  const { store, runPath } = options;
  const runDir = resolveRunPath(store, runPath);
  const now = options.now ?? new Date();

  // 1. Read manifest and verify approval state
  const rawManifest = await store.readJson<unknown>(runDir, "manifest.json");
  if (!isRunManifest(rawManifest)) {
    throw new Error("Run manifest is malformed or uses an unsupported version.");
  }
  let manifest = rawManifest;

  const canRender =
    manifest.state === "approved" ||
    manifest.state === "ready-for-review" ||
    (manifest.state === "failed" && Boolean(manifest.artifacts.approval));

  if (!canRender) {
    throw new Error(
      `Run state is '${manifest.state}'. Only approved, ready-for-review, or retried failed approved runs can be rendered.`
    );
  }

  // 2. Validate approval record
  if (!manifest.artifacts.approval) {
    throw new Error("Run has not been approved. Approval record is missing from manifest.");
  }
  const approval = await store.readJson<{ planHash: string }>(runDir, manifest.artifacts.approval);
  if (!approval || approval.planHash !== manifest.planHash) {
    throw new Error("Approval record does not match current manifest plan hash.");
  }

  // 3. Read and validate plan, check canonical hash
  const rawPlan = await store.readJson<unknown>(runDir, "plan.json");
  const planValidation = validatePlan(rawPlan);
  if (!planValidation.success) {
    throw new Error("Stored plan failed validation. Rendering is blocked.");
  }
  const plan = planValidation.data;
  const currentPlanHash = hashCanonicalJson(plan);
  if (currentPlanHash !== manifest.planHash) {
    throw new Error(
      "Plan has been modified since approval was recorded. Approval is invalidated; re-review and approve the new plan before rendering."
    );
  }

  // 4. Check for speech artifacts and compile deterministic timeline
  let speechArtifacts: Map<string, SceneSpeechArtifact> | undefined;
  if (manifest.artifacts.audio && manifest.artifacts.alignment) {
    speechArtifacts = new Map();
    for (const scene of plan.scenes) {
      const audioRel = path.join(manifest.artifacts.audio, `${scene.id}.mp3`);
      const alignRel = path.join(manifest.artifacts.alignment, `${scene.id}.json`);
      if ((await store.exists(runDir, audioRel)) && (await store.exists(runDir, alignRel))) {
        const alignment = await store.readJson<ElevenLabsAlignment>(runDir, alignRel);
        const audioBuffer = await readFile(path.join(runDir, audioRel));
        const audioBase64 = audioBuffer.toString("base64");
        const maxEndSeconds = alignment.character_end_times_seconds.length > 0
          ? Math.max(...alignment.character_end_times_seconds)
          : 0;
        speechArtifacts.set(scene.id, {
          sceneId: scene.id,
          voiceId: manifest.provenance?.resolvedVoiceId ?? plan.voicePreset,
          modelId: manifest.provenance?.modelId ?? "eleven_multilingual_v2",
          audioFilename: audioRel,
          audioBase64,
          alignmentFilename: alignRel,
          durationMs: Math.round(maxEndSeconds * 1000),
          alignment,
          createdAt: now.toISOString(),
        });
      }
    }
  }

  const timeline = compilePlanTimeline(plan, { fps: 30, now, speechArtifacts });
  await store.writeJson(runDir, "timeline.json", timeline);

  // Extract standalone captions artifact
  const captionsArtifact = timeline.scenes.flatMap((s) => s.captions);
  await store.writeJson(runDir, "captions.json", captionsArtifact);

  // Update manifest to running
  manifest = {
    ...manifest,
    state: "running",
    stage: "render",
    updatedAt: now.toISOString(),
    artifacts: {
      ...manifest.artifacts,
      timeline: "timeline.json",
      captions: "captions.json",
    },
  };
  await store.writeJson(runDir, "manifest.json", manifest);

  const finalVideoFilename = "output.mp4";
  const finalVideoPath = path.join(runDir, finalVideoFilename);
  const tmpVideoFilename = `output.tmp-${Date.now()}.mp4`;
  const tmpVideoPath = path.join(runDir, tmpVideoFilename);

  // 5. Render Remotion Composition
  let bundleLocation: string | null = null;
  try {
    const entryPoint = path.join(projectRoot, "src", "video", "Root.tsx");
    bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          extensionAlias: {
            ".js": [".ts", ".tsx", ".js", ".jsx"],
            ".mjs": [".mts", ".mjs"],
            ".cjs": [".cts", ".cjs"],
          },
        },
      }),
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "NamasteVideo",
      inputProps: { timeline },
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: tmpVideoPath,
      inputProps: { timeline },
      onProgress: (prog) => {
        if (options.onProgress) {
          options.onProgress(prog.renderedFrames, composition.durationInFrames);
        }
      },
    });

    // Atomically move output to final destination
    await rename(tmpVideoPath, finalVideoPath);

    // Render representative still frames for each scene into preview-frames/
    const previewDir = path.join(runDir, "preview-frames");
    await mkdir(previewDir, { recursive: true });
    for (let i = 0; i < timeline.scenes.length; i++) {
      const sc = timeline.scenes[i];
      const midFrame = Math.floor((sc.startFrame + sc.endFrame) / 2);
      const framePath = path.join(previewDir, `scene-${i + 1}-${sc.sceneId}.png`);
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: framePath,
        imageFormat: "png",
        frame: midFrame,
        inputProps: { timeline },
      });
    }
  } catch (renderError: unknown) {
    // Clean up temp file if exists
    try {
      await rm(tmpVideoPath, { force: true });
    } catch {
      // ignore
    }

    const errorMsg = renderError instanceof Error ? renderError.message : "Unknown render failure";
    manifest = {
      ...manifest,
      state: "failed",
      stage: "render",
      updatedAt: new Date().toISOString(),
      error: {
        code: "RENDER_FAILED",
        message: errorMsg,
        stage: "render",
      },
    };
    await store.writeJson(runDir, "manifest.json", manifest);
    throw new Error(`Remotion rendering failed: ${errorMsg}`);
  }

  // 6. Output Validation Stage
  manifest = {
    ...manifest,
    stage: "validate",
    updatedAt: new Date().toISOString(),
  };
  await store.writeJson(runDir, "manifest.json", manifest);

  const qaReport = await validateRenderOutput({
    mp4Path: finalVideoPath,
    timeline,
    runId: manifest.runId,
    planHash: currentPlanHash,
  });

  await store.writeJson(runDir, "qa.json", qaReport);

  if (!qaReport.overallPassed) {
    manifest = {
      ...manifest,
      state: "failed",
      stage: "validate",
      updatedAt: new Date().toISOString(),
      artifacts: {
        ...manifest.artifacts,
        qaReport: "qa.json",
      },
      error: {
        code: "VALIDATION_FAILED",
        message: qaReport.errors.join("; "),
        stage: "validate",
      },
    };
    await store.writeJson(runDir, "manifest.json", manifest);
    throw new Error(`Media validation failed:\n${qaReport.errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  // 7. Ready for review
  manifest = {
    ...manifest,
    state: "ready-for-review",
    stage: "review",
    updatedAt: new Date().toISOString(),
    artifacts: {
      ...manifest.artifacts,
      outputVideo: finalVideoFilename,
      qaReport: "qa.json",
      previewFrames: "preview-frames",
    },
  };
  delete manifest.error;
  await store.writeJson(runDir, "manifest.json", manifest);

  return {
    manifest,
    qaReport,
    outputVideoPath: finalVideoPath,
  };
}
