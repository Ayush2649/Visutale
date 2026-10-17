export const RUN_STATES = [
  "draft",
  "awaiting-approval",
  "running",
  "needs-input",
  "failed",
  "cancelled",
  "ready-for-review",
  "approved",
] as const;

export const PIPELINE_STAGES = [
  "preflight",
  "plan",
  "approve",
  "speech",
  "compile",
  "render",
  "validate",
  "review",
  "complete",
] as const;

export type RunState = (typeof RUN_STATES)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface RunManifest {
  manifestVersion: 1;
  runId: string;
  mode: "fixture" | "live";
  state: RunState;
  stage: PipelineStage;
  ownerId: string;
  projectId: string;
  versionId: string;
  planHash?: string;
  createdAt: string;
  updatedAt: string;
  error?: { code: string; message: string; stage: PipelineStage };
  artifacts: {
    plan?: string;
    reviewHtml?: string;
    approval?: string;
    timeline?: string;
    captions?: string;
    outputVideo?: string;
    qaReport?: string;
    previewFrames?: string;
    audio?: string;
    alignment?: string;
  };
  provenance?: {
    voicePreset: string;
    resolvedVoiceId: string;
    voiceName?: string;
    voiceAccent?: string;
    modelId?: string;
    note?: string;
  };
}

export function isRunManifest(value: unknown): value is RunManifest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const states: readonly string[] = RUN_STATES;
  const stages: readonly string[] = PIPELINE_STAGES;
  return record.manifestVersion === 1
    && typeof record.runId === "string"
    && (record.mode === "fixture" || record.mode === "live")
    && typeof record.state === "string" && states.includes(record.state)
    && typeof record.stage === "string" && stages.includes(record.stage)
    && typeof record.ownerId === "string"
    && typeof record.projectId === "string"
    && typeof record.versionId === "string"
    && typeof record.createdAt === "string"
    && typeof record.updatedAt === "string"
    && typeof record.artifacts === "object" && record.artifacts !== null && !Array.isArray(record.artifacts);
}
