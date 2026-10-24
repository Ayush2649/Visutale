import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { LocalArtifactStore } from "../storage/localArtifactStore.js";
import {
  createFixtureRun,
  createLivePlanRun,
  createRevisionRun,
  approveRun,
  readRunManifest,
  resolveRunPath,
} from "../pipeline/runService.js";
import { readConfig } from "../config/env.js";
import type { StoryboardPlan, VoicePreset } from "../contracts/plan.js";
import { getStudioJobManager, StudioJobRegistry, type StudioJob } from "./studioJobManager.js";
import type { RunManifest } from "../contracts/manifest.js";
import { RequestValidationError } from "../providers/geminiPlanner.js";

const fixtureRoot = path.resolve(process.cwd(), "fixtures", "plans");

export interface StudioRunSummary {
  runId: string;
  runPath: string;
  topic: string;
  state: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
  planHash: string;
  hasOutputVideo: boolean;
  videoSizeBytes?: number;
}

export interface AvailableFixture {
  id: string;
  name: string;
  topic: string;
  learningObjective: string;
  sceneCount: number;
}

/**
 * Sanitizes any user identifier into a valid segment for LocalArtifactStore
 * satisfying /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/ without path traversal or unsafe characters.
 */
export function sanitizeOwnerId(ownerId: string): string {
  const sanitized = ownerId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!sanitized) return "user_default";
  return /^[a-zA-Z0-9]/.test(sanitized) ? sanitized : `u_${sanitized}`;
}

export async function listAvailableFixtures(customFixtureRoot?: string): Promise<AvailableFixture[]> {
  const root = customFixtureRoot || fixtureRoot;
  try {
    const files = await readdir(root);
    const fixtures: AvailableFixture[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const id = file.replace(".json", "");
        const raw = JSON.parse(await readFile(path.join(root, file), "utf8"));
        fixtures.push({
          id,
          name: id,
          topic: raw.topic || id,
          learningObjective: raw.learningObjective || "",
          sceneCount: raw.scenes?.length || 0,
        });
      }
    }
    return fixtures;
  } catch {
    return [];
  }
}

export async function listRecentRuns(
  customStore?: LocalArtifactStore,
  ownerId?: string
): Promise<StudioRunSummary[]> {
  const store = customStore || getStudioJobManager().getStore();
  const runsRoot = store.rootDir;
  const results: StudioRunSummary[] = [];

  try {
    const owners = ownerId ? [sanitizeOwnerId(ownerId)] : await readdir(runsRoot);
    for (const owner of owners) {
      const ownerDir = path.join(runsRoot, owner);
      try {
        const ownerStat = await stat(ownerDir);
        if (!ownerStat.isDirectory()) continue;
      } catch {
        continue;
      }

      let projects: string[] = [];
      try {
        projects = await readdir(ownerDir);
      } catch {
        continue;
      }

      for (const project of projects) {
        const projectDir = path.join(ownerDir, project);
        try {
          const projectStat = await stat(projectDir);
          if (!projectStat.isDirectory()) continue;
        } catch {
          continue;
        }

        let versions: string[] = [];
        try {
          versions = await readdir(projectDir);
        } catch {
          continue;
        }

        for (const version of versions) {
          const versionDir = path.join(projectDir, version);
          try {
            const versionStat = await stat(versionDir);
            if (!versionStat.isDirectory()) continue;
          } catch {
            continue;
          }

          try {
            const runPath = `${owner}/${project}/${version}`;
            const manifest = await readRunManifest(store, runPath);
            const plan = await store.readJson<StoryboardPlan>(versionDir, "plan.json").catch(() => null);

            let hasOutputVideo = false;
            let videoSizeBytes: number | undefined;
            try {
              const vs = await stat(path.join(versionDir, manifest.artifacts.outputVideo || "output.mp4"));
              if (vs.isFile() && vs.size > 0) {
                hasOutputVideo = true;
                videoSizeBytes = vs.size;
              }
            } catch {
              hasOutputVideo = false;
            }

            results.push({
              runId: manifest.runId,
              runPath,
              topic: plan?.topic || manifest.projectId,
              state: manifest.state,
              stage: manifest.stage,
              createdAt: manifest.createdAt,
              updatedAt: manifest.updatedAt,
              planHash: manifest.planHash || "",
              hasOutputVideo,
              videoSizeBytes,
            });
          } catch {
            // Ignore incomplete directories
          }
        }
      }
    }
  } catch {
    // If runs directory is empty or inaccessible
  }

  // Sort descending by updatedAt
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return results;
}

export async function createStudioRun(options: {
  topic: string;
  notes?: string;
  voicePreset?: VoicePreset;
  fixtureId?: string;
  ownerId?: string;
  store?: LocalArtifactStore;
  customFixtureRoot?: string;
}): Promise<{
  runId: string;
  runPath: string;
  planHash: string;
  plan: StoryboardPlan;
  manifest: RunManifest;
  warnings?: string[];
}> {
  const store = options.store || getStudioJobManager().getStore();
  const fRoot = options.customFixtureRoot || fixtureRoot;
  const config = readConfig();
  const owner = options.ownerId ? sanitizeOwnerId(options.ownerId) : "local";

  // If a benchmark fixture is requested or matches known fixtures
  if (options.fixtureId) {
    const fixtureResult = await createFixtureRun({
      name: options.fixtureId,
      fixtureRoot: fRoot,
      store,
      ownerId: owner,
    });
    const plan = await store.readJson<StoryboardPlan>(fixtureResult.runDir, "plan.json");
    return {
      runId: fixtureResult.manifest.runId,
      runPath: fixtureResult.runPath,
      planHash: fixtureResult.planHash,
      plan,
      manifest: fixtureResult.manifest,
    };
  }

  // Check if topic maps directly to a fixture (e.g. "water-cycle" or "How the water cycle works")
  const normTopic = options.topic.toLowerCase();
  let matchedFixture: string | null = null;
  if (normTopic.includes("water") && normTopic.includes("cycle")) {
    matchedFixture = "water-cycle";
  } else if (normTopic.includes("ram") && normTopic.includes("storage")) {
    matchedFixture = "ram-vs-storage";
  } else if (normTopic.includes("binary") && normTopic.includes("search")) {
    matchedFixture = "binary-search";
  }

  const activeProvider = config.storyboardProvider || "gemini";
  let hasActiveApiKey = Boolean(config.geminiApiKey);
  if (activeProvider === "groq") hasActiveApiKey = Boolean(config.groqApiKey);
  else if (activeProvider === "openrouter") hasActiveApiKey = Boolean(config.openRouterApiKey);
  else if (activeProvider === "qwen") hasActiveApiKey = Boolean(config.dashscopeApiKey);

  // If matched a fixture and no API key is configured, use fixture gracefully
  if (matchedFixture && !hasActiveApiKey) {
    const fixtureResult = await createFixtureRun({
      name: matchedFixture,
      fixtureRoot: fRoot,
      store,
      ownerId: owner,
    });
    const plan = await store.readJson<StoryboardPlan>(fixtureResult.runDir, "plan.json");
    return {
      runId: fixtureResult.manifest.runId,
      runPath: fixtureResult.runPath,
      planHash: fixtureResult.planHash,
      plan,
      manifest: fixtureResult.manifest,
      warnings: [`Using verified educational benchmark fixture (${activeProvider.toUpperCase()}_API_KEY not configured).`],
    };
  }

  // Otherwise, live generation via configured provider
  if (!hasActiveApiKey) {
    throw new RequestValidationError(
      `${activeProvider.toUpperCase()}_API_KEY environment variable is required to generate new custom topics with AI. Alternatively, select one of the built-in benchmark fixtures (Water Cycle, RAM vs Storage, Binary Search).`
    );
  }

  const liveResult = await createLivePlanRun({
    topic: options.topic,
    notes: options.notes,
    voicePreset: options.voicePreset,
    store,
    config,
    ownerId: owner,
  });

  const plan = await store.readJson<StoryboardPlan>(liveResult.runDir, "plan.json");
  return {
    runId: liveResult.manifest.runId,
    runPath: liveResult.runPath,
    planHash: liveResult.planHash,
    plan,
    manifest: liveResult.manifest,
    warnings: liveResult.warnings,
  };
}

export async function getStudioRun(
  runPath: string,
  ownerId?: string,
  customStore?: LocalArtifactStore
): Promise<{
  manifest: RunManifest;
  plan: StoryboardPlan;
  jobStatus: StudioJob;
  approvalRecord?: { planHash: string; approvedBy: string; approvedAt: string };
  previewFrames: string[];
}> {
  const store = customStore || getStudioJobManager().getStore();
  const manifest = await readRunManifest(store, runPath);

  if (ownerId) {
    const sanitizedOwner = sanitizeOwnerId(ownerId);
    if (manifest.ownerId !== sanitizedOwner) {
      const err = new Error("RESOURCE_NOT_FOUND");
      (err as unknown as { status: number; code: string }).status = 404;
      (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
      throw err;
    }
  }

  const runDir = resolveRunPath(store, runPath);
  const plan = await store.readJson<StoryboardPlan>(runDir, "plan.json");
  const jobMgr = customStore ? new StudioJobRegistry(customStore) : getStudioJobManager();
  const jobStatus = await jobMgr.getRunStatus(runPath, ownerId);

  let approvalRecord: { planHash: string; approvedBy: string; approvedAt: string } | undefined;
  if (manifest.artifacts.approval) {
    try {
      approvalRecord = await store.readJson(runDir, manifest.artifacts.approval);
    } catch {
      // not yet approved
    }
  }

  // Check preview frames
  const previewFrames: string[] = [];
  try {
    const previewDir = path.join(runDir, "preview-frames");
    const frameFiles = await readdir(previewDir);
    for (const f of frameFiles) {
      if (f.endsWith(".png")) {
        previewFrames.push(f);
      }
    }
    previewFrames.sort();
  } catch {
    // no preview frames directory yet
  }

  return {
    manifest,
    plan,
    jobStatus,
    approvalRecord,
    previewFrames,
  };
}

export async function updateStudioPlan(options: {
  runPath: string;
  modifiedPlan: StoryboardPlan;
  ownerId?: string;
  store?: LocalArtifactStore;
}): Promise<{
  newRunPath: string;
  newPlanHash: string;
  newPlan: StoryboardPlan;
  newManifest: RunManifest;
  revisionType: "visual-only" | "narration-affecting" | "narrator-change";
}> {
  const store = options.store || getStudioJobManager().getStore();
  const parentManifest = await readRunManifest(store, options.runPath);

  if (options.ownerId) {
    const sanitizedOwner = sanitizeOwnerId(options.ownerId);
    if (parentManifest.ownerId !== sanitizedOwner) {
      const err = new Error("RESOURCE_NOT_FOUND");
      (err as unknown as { status: number; code: string }).status = 404;
      (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
      throw err;
    }
  }

  const revResult = await createRevisionRun({
    parentRunPath: options.runPath,
    modifiedPlan: options.modifiedPlan,
    store,
  });

  const newPlan = await store.readJson<StoryboardPlan>(revResult.runDir, "plan.json");

  return {
    newRunPath: revResult.runPath,
    newPlanHash: revResult.planHash,
    newPlan,
    newManifest: revResult.manifest,
    revisionType: revResult.revisionType,
  };
}

export async function approveStudioRun(options: {
  runPath: string;
  planHash: string;
  approvedBy?: string;
  ownerId?: string;
  store?: LocalArtifactStore;
}): Promise<RunManifest> {
  const store = options.store || getStudioJobManager().getStore();
  const manifest = await readRunManifest(store, options.runPath);

  if (options.ownerId) {
    const sanitizedOwner = sanitizeOwnerId(options.ownerId);
    if (manifest.ownerId !== sanitizedOwner) {
      const err = new Error("RESOURCE_NOT_FOUND");
      (err as unknown as { status: number; code: string }).status = 404;
      (err as unknown as { status: number; code: string }).code = "RESOURCE_NOT_FOUND";
      throw err;
    }
  }

  return approveRun({
    runPath: options.runPath,
    planHash: options.planHash,
    approvedBy: options.approvedBy || "creator",
    store,
  });
}

export async function findRunPathById(
  runId: string,
  customStore?: LocalArtifactStore,
  ownerId?: string
): Promise<string | null> {
  const store = customStore || getStudioJobManager().getStore();
  const sanitizedOwner = ownerId ? sanitizeOwnerId(ownerId) : null;

  // If runId is already a valid 3-part path (owner/project/version)
  if (runId.includes("/")) {
    if (sanitizedOwner && !runId.startsWith(`${sanitizedOwner}/`)) {
      return null;
    }
    try {
      const manifest = await readRunManifest(store, runId);
      if (sanitizedOwner && manifest.ownerId !== sanitizedOwner) {
        return null;
      }
      return runId;
    } catch {
      return null;
    }
  }

  const runs = await listRecentRuns(store, ownerId);
  const found = runs.find((r) => r.runId === runId || r.runPath.endsWith(`/${runId}`));
  return found ? found.runPath : null;
}

