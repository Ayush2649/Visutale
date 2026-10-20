import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validatePlan, type StoryboardPlan, type VoicePreset } from "../contracts/plan.js";
import { isRunManifest, type RunManifest } from "../contracts/manifest.js";
import type { SceneSpeechArtifact } from "../contracts/alignment.js";
import type { AppConfig } from "../config/env.js";
import { LocalArtifactStore } from "../storage/localArtifactStore.js";
import { hashCanonicalJson } from "./canonicalHash.js";
import { renderStoryboardReviewHtml } from "./storyboardHtml.js";
import { generateStoryboardWithGemini } from "../providers/geminiPlanner.js";
import { synthesizeSpeechWithElevenLabs } from "../providers/elevenLabsSpeech.js";

export interface FixtureRunResult {
  runDir: string;
  runPath: string;
  manifest: RunManifest;
  planHash: string;
}

export interface LivePlanRunResult {
  runDir: string;
  runPath: string;
  manifest: RunManifest;
  planHash: string;
  reviewHtmlPath: string;
  warnings: string[];
}

export async function createFixtureRun(options: {
  name: string;
  fixtureRoot: string;
  store: LocalArtifactStore;
  ownerId?: string;
  now?: Date;
}): Promise<FixtureRunResult> {
  const { name, fixtureRoot, store, ownerId = "local" } = options;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) throw new Error("Fixture name contains unsupported characters.");

  const fixturePath = path.resolve(fixtureRoot, `${name}.json`);
  const relativeFixture = path.relative(path.resolve(fixtureRoot), fixturePath);
  if (relativeFixture.startsWith("..") || path.isAbsolute(relativeFixture)) throw new Error("Fixture path escapes the fixture directory.");
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
  const parsed = validatePlan(raw);
  if (!parsed.success) throw new Error(`Fixture plan is invalid:\n${formatIssues(parsed.issues)}`);

  const now = options.now ?? new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z");
  const runId = `${name}-${timestamp}`;
  const plan: StoryboardPlan = {
    ...parsed.data,
    projectId: name,
    ownerId,
    versionId: runId,
    parentVersionId: null,
  };
  const finalValidation = validatePlan(plan);
  if (!finalValidation.success) throw new Error(`Adjusted fixture plan is invalid:\n${formatIssues(finalValidation.issues)}`);

  const runDir = store.resolveRunDir(plan.ownerId, plan.projectId, plan.versionId);
  if (await store.exists(runDir, "manifest.json")) throw new Error(`Run already exists: ${runId}`);
  await store.ensureRunDir(runDir);
  const planHash = hashCanonicalJson(plan);
  const manifest: RunManifest = {
    manifestVersion: 1,
    runId,
    mode: "fixture",
    state: "awaiting-approval",
    stage: "plan",
    ownerId: plan.ownerId,
    projectId: plan.projectId,
    versionId: plan.versionId,
    planHash,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    artifacts: { plan: "plan.json", reviewHtml: "plan-review.html" },
  };

  await store.writeJson(runDir, "plan.json", plan);
  await store.writeText(runDir, "plan-review.html", renderStoryboardReviewHtml(plan, planHash));
  await store.writeJson(runDir, "manifest.json", manifest);

  return { runDir, runPath: path.relative(store.rootDir, runDir).split(path.sep).join("/"), manifest, planHash };
}

export async function createLivePlanRun(options: {
  topic: string;
  notes?: string;
  voicePreset?: VoicePreset;
  store: LocalArtifactStore;
  config: AppConfig;
  ownerId?: string;
  now?: Date;
}): Promise<LivePlanRunResult> {
  const { topic, notes, voicePreset = "indian-english-female", store, config, ownerId = "local" } = options;

  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required for live planning.");
  }
  if (!config.geminiModel) {
    throw new Error("GEMINI_MODEL environment variable is required for live planning.");
  }

  const projectSlug = slugify(topic);
  const now = options.now ?? new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z");
  const runId = `${projectSlug}-${timestamp}`;

  const plan = await generateStoryboardWithGemini({
    topic,
    notes,
    voicePreset,
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    projectId: projectSlug,
    ownerId,
    versionId: runId,
  });

  const runDir = store.resolveRunDir(plan.ownerId, plan.projectId, plan.versionId);
  if (await store.exists(runDir, "manifest.json")) throw new Error(`Run already exists: ${runId}`);
  await store.ensureRunDir(runDir);

  const planHash = hashCanonicalJson(plan);
  const manifest: RunManifest = {
    manifestVersion: 1,
    runId,
    mode: "live",
    state: "awaiting-approval",
    stage: "approve",
    ownerId: plan.ownerId,
    projectId: plan.projectId,
    versionId: plan.versionId,
    planHash,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    artifacts: {
      plan: "plan.json",
      reviewHtml: "plan-review.html",
    },
  };

  await store.writeJson(runDir, "plan.json", plan);
  const htmlContent = renderStoryboardReviewHtml(plan, planHash);
  await store.writeText(runDir, "plan-review.html", htmlContent);
  await store.writeJson(runDir, "manifest.json", manifest);

  const runPath = path.relative(store.rootDir, runDir).split(path.sep).join("/");
  const reviewHtmlPath = path.join(runDir, "plan-review.html");

  return {
    runDir,
    runPath,
    manifest,
    planHash,
    reviewHtmlPath,
    warnings: plan.warnings,
  };
}

export async function approveRun(options: {
  runPath: string;
  planHash: string;
  approvedBy: string;
  store: LocalArtifactStore;
  now?: Date;
}): Promise<RunManifest> {
  const runDir = resolveRunPath(options.store, options.runPath);
  const manifest = await readManifest(options.store, runDir);
  if (manifest.state !== "awaiting-approval") {
    throw new Error(`Run state is '${manifest.state}'. Only awaiting-approval runs can be approved.`);
  }

  const plan = validatePlan(await options.store.readJson<unknown>(runDir, "plan.json"));
  if (!plan.success) throw new Error(`Cannot approve invalid plan:\n${formatIssues(plan.issues)}`);
  const currentHash = hashCanonicalJson(plan.data);
  if (currentHash !== options.planHash) throw new Error("Plan hash does not match the current plan. Re-open the review artifact and use its current hash.");
  if (manifest.planHash !== currentHash) throw new Error("Manifest hash does not match the current plan. Approval is blocked to prevent stale approval.");

  const now = options.now ?? new Date();
  const approval = { planHash: currentHash, approvedBy: options.approvedBy, approvedAt: now.toISOString() };
  await options.store.writeJson(runDir, "approval.json", approval);
  const updated: RunManifest = {
    ...manifest,
    state: "approved",
    stage: "speech",
    updatedAt: now.toISOString(),
    artifacts: { ...manifest.artifacts, approval: "approval.json" },
  };
  await options.store.writeJson(runDir, "manifest.json", updated);
  return updated;
}

export async function synthesizeSpeechForRun(options: {
  runPath: string;
  store: LocalArtifactStore;
  config: AppConfig;
  now?: Date;
  onSceneProgress?: (sceneIndex: number, totalScenes: number, sceneId: string) => void;
}): Promise<{ manifest: RunManifest; speechArtifacts: SceneSpeechArtifact[] }> {
  const { runPath, store, config } = options;
  const runDir = resolveRunPath(store, runPath);
  let manifest = await readManifest(store, runDir);

  if (!manifest.artifacts.approval) {
    throw new Error("Run has not been approved. Approval record is missing from manifest.");
  }
  const approval = await store.readJson<{ planHash: string }>(runDir, manifest.artifacts.approval);
  if (!approval || approval.planHash !== manifest.planHash) {
    throw new Error("Approval record does not match current manifest plan hash.");
  }

  const rawPlan = await store.readJson<unknown>(runDir, "plan.json");
  const planValidation = validatePlan(rawPlan);
  if (!planValidation.success) {
    throw new Error(`Cannot synthesize speech for invalid plan:\n${formatIssues(planValidation.issues)}`);
  }
  const plan = planValidation.data;
  const currentPlanHash = hashCanonicalJson(plan);
  if (currentPlanHash !== manifest.planHash) {
    throw new Error("Plan was modified after approval. Approval is invalidated.");
  }

  if (!config.elevenLabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is required for speech synthesis.");
  }
  if (!config.elevenLabsModel) {
    throw new Error("ELEVENLABS_MODEL environment variable is required for speech synthesis.");
  }

  const voiceId = plan.voicePreset === "indian-english-female"
    ? config.elevenLabsFemaleVoiceId
    : config.elevenLabsMaleVoiceId;

  if (!voiceId) {
    throw new Error(
      `No voice ID configured for preset '${plan.voicePreset}'. Check ELEVENLABS_VOICE_ID_INDIAN_FEMALE and ELEVENLABS_VOICE_ID_INDIAN_MALE.`
    );
  }

  const audioDir = path.join(runDir, "audio");
  const alignmentDir = path.join(runDir, "alignment");
  await mkdir(audioDir, { recursive: true });
  await mkdir(alignmentDir, { recursive: true });

  const now = options.now ?? new Date();
  const speechArtifacts: SceneSpeechArtifact[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    if (options.onSceneProgress) {
      options.onSceneProgress(i + 1, plan.scenes.length, scene.id);
    }

    const narrationText = scene.narration.map((n) => n.text.trim()).join(" ");
    const audioFilename = path.join("audio", `${scene.id}.mp3`);
    const alignmentFilename = path.join("alignment", `${scene.id}.json`);

    const result = await synthesizeSpeechWithElevenLabs({
      text: narrationText,
      voiceId,
      modelId: config.elevenLabsModel,
      apiKey: config.elevenLabsApiKey,
    });

    await writeFile(path.join(runDir, audioFilename), result.audioBuffer);
    await store.writeJson(runDir, alignmentFilename, result.alignment);

    speechArtifacts.push({
      sceneId: scene.id,
      voiceId,
      modelId: config.elevenLabsModel,
      audioFilename,
      audioBase64: result.audioBase64,
      alignmentFilename,
      durationMs: result.durationMs,
      alignment: result.alignment,
      createdAt: now.toISOString(),
    });
  }

  const isBellaDevVoice = voiceId === "hpp4J3VqNfWAUOO0d1Us";
  const voiceName = isBellaDevVoice ? "Bella" : "Custom Voice";
  const voiceAccent = isBellaDevVoice
    ? "American (temporary development voice; does not satisfy final Indian English requirement)"
    : plan.voicePreset;
  const provenanceNote = isBellaDevVoice
    ? "Temporary American-accented development voice Bella (hpp4J3VqNfWAUOO0d1Us) used for pipeline testing. Does not satisfy final Indian English requirement."
    : undefined;

  manifest = {
    ...manifest,
    state: "approved",
    stage: "compile",
    updatedAt: now.toISOString(),
    artifacts: {
      ...manifest.artifacts,
      audio: "audio",
      alignment: "alignment",
    },
    provenance: {
      voicePreset: plan.voicePreset,
      resolvedVoiceId: voiceId,
      voiceName,
      voiceAccent,
      modelId: config.elevenLabsModel,
      note: provenanceNote,
    },
  };
  await store.writeJson(runDir, "manifest.json", manifest);

  return { manifest, speechArtifacts };
}

export async function readRunManifest(store: LocalArtifactStore, runPath: string): Promise<RunManifest> {
  return readManifest(store, resolveRunPath(store, runPath));
}

export function resolveRunPath(store: LocalArtifactStore, runPath: string): string {
  if (path.isAbsolute(runPath)) throw new Error("Run path must be relative to the runs/ directory.");
  const runDir = path.resolve(store.rootDir, runPath);
  const relativePath = path.relative(store.rootDir, runDir);
  if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error("Run path must identify a child directory under runs/.");
  }
  return runDir;
}

async function readManifest(store: LocalArtifactStore, runDir: string): Promise<RunManifest> {
  const raw = await store.readJson<unknown>(runDir, "manifest.json");
  if (!isRunManifest(raw)) throw new Error("Run manifest is malformed or uses an unsupported version.");
  return raw;
}

function formatIssues(issues: Array<{ path: string; message: string }>): string {
  return issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "project";
}

export interface RevisionRunResult {
  runDir: string;
  runPath: string;
  manifest: RunManifest;
  planHash: string;
  revisionType: "visual-only" | "narration-affecting" | "narrator-change";
  reusedAudioScenes: string[];
}

export async function createRevisionRun(options: {
  parentRunPath: string;
  modifiedPlan: StoryboardPlan;
  store: LocalArtifactStore;
  now?: Date;
}): Promise<RevisionRunResult> {
  const { parentRunPath, modifiedPlan, store } = options;
  const parentRunDir = resolveRunPath(store, parentRunPath);
  const parentManifest = await readManifest(store, parentRunDir);
  const parentPlan = await store.readJson<StoryboardPlan>(parentRunDir, "plan.json");

  // Validate modified plan
  const planValidation = validatePlan(modifiedPlan);
  if (!planValidation.success) {
    throw new Error(`Modified plan failed validation:\n${formatIssues(planValidation.issues)}`);
  }
  const plan = planValidation.data;

  // Determine revision type
  const voiceChanged = plan.voicePreset !== parentPlan.voicePreset;

  let narrationChanged = false;
  if (plan.scenes.length !== parentPlan.scenes.length) {
    narrationChanged = true;
  } else {
    for (let i = 0; i < plan.scenes.length; i++) {
      const parentScene = parentPlan.scenes[i];
      const newScene = plan.scenes[i];
      if (parentScene.id !== newScene.id) {
        narrationChanged = true;
        break;
      }
      const parentNarration = parentScene.narration.map((n) => n.text.trim()).join(" ");
      const newNarration = newScene.narration.map((n) => n.text.trim()).join(" ");
      if (parentNarration !== newNarration) {
        narrationChanged = true;
        break;
      }
    }
  }

  let revisionType: "visual-only" | "narration-affecting" | "narrator-change";
  if (voiceChanged) {
    revisionType = "narrator-change";
  } else if (narrationChanged) {
    revisionType = "narration-affecting";
  } else {
    revisionType = "visual-only";
  }

  const now = options.now ?? new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z");
  const runId = `${parentManifest.projectId}-rev-${timestamp}`;
  const runDir = store.resolveRunDir(parentManifest.ownerId, parentManifest.projectId, runId);
  await store.ensureRunDir(runDir);

  const revisedPlan: StoryboardPlan = {
    ...plan,
    projectId: parentManifest.projectId,
    ownerId: parentManifest.ownerId,
    versionId: runId,
    parentVersionId: parentManifest.versionId,
  };

  const planHash = hashCanonicalJson(revisedPlan);
  await store.writeJson(runDir, "plan.json", revisedPlan);
  await store.writeText(runDir, "plan-review.html", renderStoryboardReviewHtml(revisedPlan, planHash));

  const reusedAudioScenes: string[] = [];

  if (revisionType === "visual-only") {
    // Reuse parent's speech audio and alignment without re-synthesizing!
    if (parentManifest.artifacts.audio && parentManifest.artifacts.alignment) {
      await mkdir(path.join(runDir, "audio"), { recursive: true });
      await mkdir(path.join(runDir, "alignment"), { recursive: true });

      for (const scene of revisedPlan.scenes) {
        const audioFile = `${scene.id}.mp3`;
        const alignFile = `${scene.id}.json`;
        const parentAudioRel = path.join("audio", audioFile);
        const parentAlignRel = path.join("alignment", alignFile);

        if (await store.exists(parentRunDir, parentAudioRel)) {
          const audioBuffer = await readFile(path.join(parentRunDir, parentAudioRel));
          await writeFile(path.join(runDir, "audio", audioFile), audioBuffer);
          const alignData = await store.readJson<unknown>(parentRunDir, parentAlignRel);
          await store.writeJson(runDir, parentAlignRel, alignData);
          reusedAudioScenes.push(scene.id);
        }
      }
    }

    const approval = {
      planHash,
      approvedAt: now.toISOString(),
      approvedBy: "visual-revision-inheritance",
      parentPlanHash: parentManifest.planHash,
    };
    await store.writeJson(runDir, "approval.json", approval);

    const manifest: RunManifest = {
      manifestVersion: 1,
      runId,
      mode: parentManifest.mode,
      state: "approved",
      stage: "compile",
      ownerId: revisedPlan.ownerId,
      projectId: revisedPlan.projectId,
      versionId: runId,
      parentRunId: parentManifest.runId,
      revisionType,
      planHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      artifacts: {
        plan: "plan.json",
        reviewHtml: "plan-review.html",
        approval: "approval.json",
        audio: reusedAudioScenes.length > 0 ? "audio" : undefined,
        alignment: reusedAudioScenes.length > 0 ? "alignment" : undefined,
      },
      provenance: parentManifest.provenance,
    };
    await store.writeJson(runDir, "manifest.json", manifest);

    return {
      runDir,
      runPath: path.relative(store.rootDir, runDir).split(path.sep).join("/"),
      manifest,
      planHash,
      revisionType,
      reusedAudioScenes,
    };
  } else if (revisionType === "narrator-change") {
    // Voice changed: approved narration is kept, audio is invalidated and must be synthesized
    const approval = {
      planHash,
      approvedAt: now.toISOString(),
      approvedBy: "narrator-change",
      parentPlanHash: parentManifest.planHash,
    };
    await store.writeJson(runDir, "approval.json", approval);

    const manifest: RunManifest = {
      manifestVersion: 1,
      runId,
      mode: parentManifest.mode,
      state: "approved",
      stage: "speech",
      ownerId: revisedPlan.ownerId,
      projectId: revisedPlan.projectId,
      versionId: runId,
      parentRunId: parentManifest.runId,
      revisionType,
      planHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      artifacts: {
        plan: "plan.json",
        reviewHtml: "plan-review.html",
        approval: "approval.json",
      },
    };
    await store.writeJson(runDir, "manifest.json", manifest);

    return {
      runDir,
      runPath: path.relative(store.rootDir, runDir).split(path.sep).join("/"),
      manifest,
      planHash,
      revisionType,
      reusedAudioScenes: [],
    };
  } else {
    // Narration changed: requires human re-approval of revised script
    const manifest: RunManifest = {
      manifestVersion: 1,
      runId,
      mode: parentManifest.mode,
      state: "awaiting-approval",
      stage: "approve",
      ownerId: revisedPlan.ownerId,
      projectId: revisedPlan.projectId,
      versionId: runId,
      parentRunId: parentManifest.runId,
      revisionType,
      planHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      artifacts: {
        plan: "plan.json",
        reviewHtml: "plan-review.html",
      },
    };
    await store.writeJson(runDir, "manifest.json", manifest);

    return {
      runDir,
      runPath: path.relative(store.rootDir, runDir).split(path.sep).join("/"),
      manifest,
      planHash,
      revisionType,
      reusedAudioScenes: [],
    };
  }
}
