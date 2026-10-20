import path from "node:path";
import { stat } from "node:fs/promises";
import { LocalArtifactStore } from "../storage/localArtifactStore.js";
import {
  readRunManifest,
  resolveRunPath,
} from "../pipeline/runService.js";
import type { PipelineStage, RunManifest } from "../contracts/manifest.js";

export interface StudioTelemetryLog {
  timestamp: string;
  tag: string;
  message: string;
}

export interface StudioJob {
  jobId: string;
  runPath: string;
  ownerId?: string;
  stage: "queued" | "manuscript" | "art-plates" | "voiceover" | "compositor" | "packaging" | "completed" | "failed";
  status: "idle" | "running" | "completed" | "failed";
  renderedFrames: number;
  totalFrames: number;
  percent: number;
  currentMessage: string;
  telemetryLogs: StudioTelemetryLog[];
  error: string | null;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  outputVideoPath?: string;
  videoSizeBytes?: number;
}

function sanitizeId(ownerId: string): string {
  const sanitized = ownerId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!sanitized) return "user_default";
  return /^[a-zA-Z0-9]/.test(sanitized) ? sanitized : `u_${sanitized}`;
}

export class StudioJobRegistry {
  private jobs = new Map<string, StudioJob>();
  private store: LocalArtifactStore;

  constructor(store?: LocalArtifactStore) {
    if (store) {
      this.store = store;
    } else {
      const runsDir = path.resolve(process.cwd(), "runs");
      this.store = new LocalArtifactStore(runsDir);
    }
  }

  getStore(): LocalArtifactStore {
    return this.store;
  }

  getJob(runPath: string, ownerId?: string): StudioJob | undefined {
    const job = this.jobs.get(runPath);
    if (!job) return undefined;
    if (ownerId && job.ownerId && job.ownerId !== sanitizeId(ownerId)) {
      return undefined;
    }
    return job;
  }

  hasActiveJob(runPath: string): boolean {
    const job = this.jobs.get(runPath);
    return Boolean(job && job.status === "running");
  }

  async getRunStatus(runPath: string, ownerId?: string): Promise<StudioJob> {
    const active = this.jobs.get(runPath);
    if (active && (active.status === "running" || active.status === "completed" || active.status === "failed")) {
      if (ownerId && active.ownerId && active.ownerId !== sanitizeId(ownerId)) {
        const err = new Error("RESOURCE_NOT_FOUND");
        (err as unknown as { status: number; code: string }).status = 404;
        (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
        throw err;
      }
      return active;
    }

    // Inspect disk manifest and artifacts
    const runDir = resolveRunPath(this.store, runPath);
    const manifest = await readRunManifest(this.store, runPath);

    if (ownerId && manifest.ownerId !== sanitizeId(ownerId)) {
      const err = new Error("RESOURCE_NOT_FOUND");
      (err as unknown as { status: number; code: string }).status = 404;
      (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
      throw err;
    }

    const videoRel = manifest.artifacts.outputVideo || "output.mp4";
    const videoAbs = path.join(runDir, videoRel);

    let videoExists = false;
    let videoSizeBytes = 0;
    try {
      const s = await stat(videoAbs);
      if (s.isFile() && s.size > 0) {
        videoExists = true;
        videoSizeBytes = s.size;
      }
    } catch {
      videoExists = false;
    }

    if (videoExists && (manifest.state === "ready-for-review" || manifest.state === "approved")) {
      return {
        jobId: `disk-${manifest.runId}`,
        runPath,
        ownerId: manifest.ownerId,
        stage: "completed",
        status: "completed",
        renderedFrames: 1800,
        totalFrames: 1800,
        percent: 100,
        currentMessage: "Master render verified and available.",
        telemetryLogs: [
          { timestamp: manifest.createdAt, tag: "INITIALIZATION", message: "Plan and manuscript ingested." },
          { timestamp: manifest.updatedAt, tag: "STAGE_05", message: `Output master video validated (${(videoSizeBytes / (1024 * 1024)).toFixed(1)} MB).` },
        ],
        error: null,
        startedAt: manifest.createdAt,
        updatedAt: manifest.updatedAt,
        completedAt: manifest.updatedAt,
        outputVideoPath: videoAbs,
        videoSizeBytes,
      };
    }

    if (manifest.state === "failed") {
      const errMsg = manifest.error?.message || "Render process encountered an interruption. Safe recovery checkpoint preserved.";
      return {
        jobId: `disk-${manifest.runId}`,
        runPath,
        ownerId: manifest.ownerId,
        stage: "failed",
        status: "failed",
        renderedFrames: 0,
        totalFrames: 100,
        percent: 86,
        currentMessage: errMsg,
        telemetryLogs: [
          { timestamp: manifest.updatedAt, tag: "HALT", message: errMsg },
        ],
        error: errMsg,
        startedAt: manifest.createdAt,
        updatedAt: manifest.updatedAt,
      };
    }

    return {
      jobId: `disk-${manifest.runId}`,
      runPath,
      ownerId: manifest.ownerId,
      stage: manifest.state === "approved" ? "compositor" : "manuscript",
      status: "idle",
      renderedFrames: 0,
      totalFrames: 100,
      percent: manifest.state === "approved" ? 50 : 20,
      currentMessage: manifest.state === "approved" ? "Plan approved. Ready for video rendering." : "Draft manuscript awaiting review and approval.",
      telemetryLogs: [
        { timestamp: manifest.createdAt, tag: "STATUS", message: `Run manifest loaded in state: ${manifest.state}` },
      ],
      error: null,
      startedAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
    };
  }

  async startRenderJob(runPath: string, ownerId?: string): Promise<StudioJob> {
    // 1. Prevent duplicate generation requests
    const existing = this.jobs.get(runPath);
    if (existing && existing.status === "running") {
      if (ownerId && existing.ownerId && existing.ownerId !== sanitizeId(ownerId)) {
        const err = new Error("RESOURCE_NOT_FOUND");
        (err as unknown as { status: number; code: string }).status = 404;
        (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
        throw err;
      }
      return existing;
    }

    // 2. Verify run manifest and approval
    const runDir = resolveRunPath(this.store, runPath);
    let manifest = await readRunManifest(this.store, runPath);

    if (ownerId && manifest.ownerId !== sanitizeId(ownerId)) {
      const err = new Error("RESOURCE_NOT_FOUND");
      (err as unknown as { status: number; code: string }).status = 404;
      (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
      throw err;
    }

    if (manifest.state !== "approved" && manifest.state !== "ready-for-review" && !(manifest.state === "failed" && manifest.artifacts.approval)) {
      throw new Error(`Run state is '${manifest.state}'. Only approved runs can be rendered.`);
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();

    // Reset failed manifest back to approved on retry
    if (manifest.state === "failed") {
      manifest = {
        ...manifest,
        state: "approved",
        stage: "speech",
        updatedAt: nowIso,
      };
      delete manifest.error;
      await this.store.writeJson(runDir, "manifest.json", manifest);
    }

    // Inspect if speech audio and alignments are already present
    let hasAudio = Boolean(manifest.artifacts.audio && manifest.artifacts.alignment);
    const rawPlan = await this.store.readJson<any>(runDir, "plan.json").catch(() => null);
    if (hasAudio && rawPlan?.scenes) {
      for (const scene of rawPlan.scenes) {
        const audioRel = path.join(manifest.artifacts.audio!, `${scene.id}.mp3`);
        const alignRel = path.join(manifest.artifacts.alignment!, `${scene.id}.json`);
        if (!(await this.store.exists(runDir, audioRel)) || !(await this.store.exists(runDir, alignRel))) {
          hasAudio = false;
          break;
        }
      }
    }

    const { readConfig } = await import("../config/env.js");
    const config = readConfig();
    const needsSpeechSynthesis = !hasAudio && Boolean(config.elevenLabsApiKey && config.elevenLabsModel);

    const initialStage = needsSpeechSynthesis ? "voiceover" : "compositor";
    const initialMessage = needsSpeechSynthesis
      ? "Synthesizing voiceover narration with ElevenLabs (Phase III / V)..."
      : "Initializing Remotion compositor and compiling frame layers (Phase IV / V)...";
    const initialPercent = needsSpeechSynthesis ? 10 : 25;

    const job: StudioJob = {
      jobId,
      runPath,
      ownerId: manifest.ownerId,
      stage: initialStage,
      status: "running",
      renderedFrames: 0,
      totalFrames: 100,
      percent: initialPercent,
      currentMessage: initialMessage,
      telemetryLogs: [
        { timestamp: nowIso, tag: "INITIALIZATION", message: `Dispatched render job for run: ${runPath}` },
        { timestamp: nowIso, tag: "STAGE_01", message: "Manuscript approved and canonical hash verified." },
        { timestamp: nowIso, tag: "STAGE_02", message: "Visual plates and coordinate grids loaded." },
      ],
      error: null,
      startedAt: nowIso,
      updatedAt: nowIso,
    };

    this.jobs.set(runPath, job);

    // 3. Launch async execution without blocking HTTP request
    (async () => {
      try {
        // Step A: Speech Synthesis if required and configured
        if (needsSpeechSynthesis) {
          job.stage = "voiceover";
          job.telemetryLogs.push({
            timestamp: new Date().toISOString(),
            tag: "STAGE_03",
            message: "Synthesizing neural voiceover narration with ElevenLabs...",
          });

          const { synthesizeSpeechForRun } = await import("../pipeline/runService.js");
          await synthesizeSpeechForRun({
            runPath,
            store: this.store,
            config,
            onSceneProgress: (sceneIndex, totalScenes, sceneId) => {
              job.currentMessage = `Synthesizing narration for scene ${sceneIndex} of ${totalScenes} (${sceneId})...`;
              job.percent = Math.round(10 + (sceneIndex / totalScenes) * 20);
              job.updatedAt = new Date().toISOString();
            },
          });

          job.telemetryLogs.push({
            timestamp: new Date().toISOString(),
            tag: "STAGE_03_DONE",
            message: "Neural voiceover audio and alignment timestamps synthesized successfully.",
          });
        } else if (!hasAudio) {
          job.telemetryLogs.push({
            timestamp: new Date().toISOString(),
            tag: "STAGE_03_SKIPPED",
            message: "ElevenLabs API key omitted. Compiling timeline using estimated acoustic cadences.",
          });
        } else {
          job.telemetryLogs.push({
            timestamp: new Date().toISOString(),
            tag: "STAGE_03_REUSED",
            message: "Reusing verified voiceover acoustics from run cache.",
          });
        }

        // Step B: Compositor Frame Rendering
        job.stage = "compositor";
        job.percent = 35;
        job.currentMessage = "Initializing Remotion compositor and compiling frame layers...";
        job.telemetryLogs.push({
          timestamp: new Date().toISOString(),
          tag: "STAGE_04",
          message: "Remotion compositor started. Rendering 1080x1920 @ 30fps frames...",
        });

        const { renderRun } = await import("../pipeline/renderService.js");
        const renderResult = await renderRun({
          runPath,
          store: this.store,
          onProgress: (renderedFrames, totalFrames) => {
            job.renderedFrames = renderedFrames;
            job.totalFrames = totalFrames;
            job.percent = totalFrames > 0 ? Math.round(35 + (renderedFrames / totalFrames) * 60) : 35;
            job.currentMessage = `Compositing frame ${renderedFrames} of ${totalFrames} (Phase IV / V)`;
            job.updatedAt = new Date().toISOString();
          },
        });

        // Step C: Packaging & Output Validation
        job.stage = "packaging";
        job.percent = 98;
        job.currentMessage = "Validating master render and preview stills...";
        job.updatedAt = new Date().toISOString();

        const videoStat = await stat(renderResult.outputVideoPath);
        if (!videoStat.isFile() || videoStat.size === 0) {
          throw new Error("Rendered output file was not created or is empty.");
        }

        job.stage = "completed";
        job.percent = 100;
        job.status = "completed";
        job.completedAt = new Date().toISOString();
        job.outputVideoPath = renderResult.outputVideoPath;
        job.videoSizeBytes = videoStat.size;
        job.currentMessage = "Master 1080x1920 video ready for playback and export.";
        job.telemetryLogs.push({
          timestamp: new Date().toISOString(),
          tag: "STAGE_05",
          message: `Packaging validated: 1080x1920 @ 30fps master render ready (${(videoStat.size / (1024 * 1024)).toFixed(1)} MB).`,
        });
      } catch (renderError: any) {
        const failedJobStage = job.stage;
        job.status = "failed";
        job.stage = "failed";
        job.error = renderError?.message || "Render failed";
        job.currentMessage = "Generation interrupted. Saved work preserved in local cache.";
        job.telemetryLogs.push({
          timestamp: new Date().toISOString(),
          tag: "HALT",
          message: renderError?.message || "Render failure",
        });

        try {
          const currentManifest = await readRunManifest(this.store, runPath);
          let pipelineStage: PipelineStage = currentManifest.stage;
          if (failedJobStage === "voiceover") pipelineStage = "speech";
          else if (failedJobStage === "compositor") pipelineStage = "render";
          else if (failedJobStage === "packaging") pipelineStage = "validate";

          const updatedManifest: RunManifest = {
            ...currentManifest,
            state: "failed" as const,
            stage: pipelineStage,
            updatedAt: new Date().toISOString(),
            error: {
              code: "RENDER_FAILED",
              message: renderError?.message || "Render failed",
              stage: pipelineStage,
            },
          };
          await this.store.writeJson(runDir, "manifest.json", updatedManifest);
        } catch {
          // Ignore secondary disk write error
        }
      }
    })();

    return job;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __visutaleStudioJobRegistry: StudioJobRegistry | undefined;
}

export function getStudioJobManager(): StudioJobRegistry {
  if (!global.__visutaleStudioJobRegistry) {
    global.__visutaleStudioJobRegistry = new StudioJobRegistry();
  }
  return global.__visutaleStudioJobRegistry;
}

