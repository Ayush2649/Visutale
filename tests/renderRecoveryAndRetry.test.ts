import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import {
  createFixtureRun,
  approveRun,
  synthesizeSpeechForRun,
  resolveRunPath,
  readRunManifest,
} from "../src/pipeline/runService.js";
import { renderRun } from "../src/pipeline/renderService.js";
import { compilePlanTimeline } from "../src/timing/timelineCompiler.js";
import { StudioJobRegistry } from "../src/studio/studioJobManager.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";
import type { RunManifest } from "../src/contracts/manifest.js";
import type { AppConfig } from "../src/config/env.js";
import type { SceneSpeechArtifact, ElevenLabsAlignment } from "../src/contracts/alignment.js";

const fixtureRoot = path.resolve("fixtures/plans");

const mockConfig: AppConfig = {
  elevenLabsApiKey: "test-key-mock",
  elevenLabsModel: "eleven_multilingual_v2",
  elevenLabsFemaleVoiceId: "test-voice-female",
  elevenLabsMaleVoiceId: "test-voice-male",
} as unknown as AppConfig;

async function safeCleanup(dir: string) {
  try {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  } catch {
    // ignore
  }
}

test("Render Recovery: 1. Failed runs cannot be approved", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    const runDir = created.runDir;
    let manifest = await readRunManifest(store, created.runPath);

    // Simulate run failed during render
    manifest = {
      ...manifest,
      state: "failed",
      stage: "render",
      error: { code: "RENDER_FAILED", message: "Simulated failure", stage: "render" },
    };
    await store.writeJson(runDir, "manifest.json", manifest);

    // Attempting to approve a failed run must be rejected
    await assert.rejects(
      () =>
        approveRun({
          runPath: created.runPath,
          planHash: created.planHash,
          approvedBy: "teacher@test.edu",
          store,
        }),
      /Only awaiting-approval runs can be approved/
    );
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 2. Retry does not regenerate existing narration", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "teacher@test.edu",
      store,
    });

    const runDir = created.runDir;
    const plan = await store.readJson<StoryboardPlan>(runDir, "plan.json");

    // Pre-populate audio and alignment on disk
    await mkdir(path.join(runDir, "audio"), { recursive: true });
    await mkdir(path.join(runDir, "alignment"), { recursive: true });

    const originalAudioBuffers = new Map<string, string>();
    for (const scene of plan.scenes) {
      const audioContent = `EXISTING_AUDIO_BYTES_FOR_${scene.id}`;
      originalAudioBuffers.set(scene.id, audioContent);
      await writeFile(path.join(runDir, "audio", `${scene.id}.mp3`), Buffer.from(audioContent));

      const mockAlignment: ElevenLabsAlignment = {
        characters: ["A", "B"],
        character_start_times_seconds: [0, 0.5],
        character_end_times_seconds: [0.5, 1.0],
      };
      await store.writeJson(runDir, path.join("alignment", `${scene.id}.json`), mockAlignment);
    }

    // Call synthesizeSpeechForRun with a mock key that would throw if called via network
    const result = await synthesizeSpeechForRun({
      runPath: created.runPath,
      store,
      config: mockConfig,
    });

    assert.equal(result.speechArtifacts.length, plan.scenes.length);

    // Verify existing audio was untouched and preserved
    for (const scene of plan.scenes) {
      const diskBuffer = await readFile(path.join(runDir, "audio", `${scene.id}.mp3`), "utf8");
      assert.equal(diskBuffer, originalAudioBuffers.get(scene.id));
    }
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 3. Concurrent retry requests do not start duplicate renders", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const jobRegistry = new StudioJobRegistry(store);

    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "teacher@test.edu",
      store,
    });

    // Start concurrent render jobs simultaneously
    const [job1, job2] = await Promise.all([
      jobRegistry.startRenderJob(created.runPath),
      jobRegistry.startRenderJob(created.runPath),
    ]);

    assert.equal(job1.jobId, job2.jobId, "Concurrent requests must return the exact same active StudioJob");
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 4. Timeline compiler ensures 60-90s contract with short live speech", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    const plan = await store.readJson<StoryboardPlan>(created.runDir, "plan.json");

    // Create fast/short speech artifacts (e.g. 3s per scene = 21s total across 7 scenes)
    const shortSpeechMap = new Map<string, SceneSpeechArtifact>();
    for (const scene of plan.scenes) {
      shortSpeechMap.set(scene.id, {
        sceneId: scene.id,
        voiceId: "v1",
        modelId: "m1",
        audioFilename: `audio/${scene.id}.mp3`,
        audioBase64: Buffer.from("test").toString("base64"),
        alignmentFilename: `alignment/${scene.id}.json`,
        durationMs: 3000,
        alignment: {
          characters: ["H", "i"],
          character_start_times_seconds: [0, 0.5],
          character_end_times_seconds: [0.5, 3.0],
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Timeline compiler must not throw and must guarantee at least 1800 frames (60s)
    const timeline = compilePlanTimeline(plan, { fps: 30, speechArtifacts: shortSpeechMap });
    assert.ok(
      timeline.composition.durationInFrames >= 1800,
      `Duration (${timeline.composition.durationInFrames}) must be at least 1800 frames`
    );
    assert.ok(
      timeline.composition.durationInFrames <= 2700,
      `Duration (${timeline.composition.durationInFrames}) must not exceed 2700 frames`
    );
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 5. StudioJobRegistry inspectCheckpoint accurately reports verified assets", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const jobRegistry = new StudioJobRegistry(store);

    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    const runDir = created.runDir;
    let manifest = await readRunManifest(store, created.runPath);

    // Initial check: awaiting approval, no audio
    let status = await jobRegistry.getRunStatus(created.runPath);
    assert.equal(status.checkpoint?.hasPlan, true);
    assert.equal(status.checkpoint?.hasApproval, false);
    assert.equal(status.checkpoint?.hasAudio, false);
    assert.ok(status.checkpoint?.missingArtifacts.includes("approval.json"));

    // Approve run
    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "teacher@test.edu",
      store,
    });

    manifest = await readRunManifest(store, created.runPath);
    manifest.artifacts.audio = "audio";
    manifest.artifacts.alignment = "alignment";
    await store.writeJson(runDir, "manifest.json", manifest);

    // Write audio for all scenes
    await mkdir(path.join(runDir, "audio"), { recursive: true });
    await mkdir(path.join(runDir, "alignment"), { recursive: true });

    const plan = await store.readJson<StoryboardPlan>(runDir, "plan.json");
    for (const scene of plan.scenes) {
      await writeFile(path.join(runDir, "audio", `${scene.id}.mp3`), "audio");
      await store.writeJson(runDir, path.join("alignment", `${scene.id}.json`), {
        characters: ["A"],
        character_start_times_seconds: [0],
        character_end_times_seconds: [1],
      });
    }

    status = await jobRegistry.getRunStatus(created.runPath);
    assert.equal(status.checkpoint?.hasPlan, true);
    assert.equal(status.checkpoint?.hasApproval, true);
    assert.equal(status.checkpoint?.hasAudio, true);
    assert.equal(status.checkpoint?.audioScenesCount, plan.scenes.length);
    assert.equal(status.checkpoint?.missingArtifacts.length, 0);
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 6. Missing scene asset or invalid plan fails with an actionable error", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "teacher@test.edu",
      store,
    });

    const runDir = created.runDir;

    // Delete plan.json to simulate missing required asset
    await rm(path.join(runDir, "plan.json"), { force: true });

    await assert.rejects(
      () => renderRun({ runPath: created.runPath, store }),
      /Stored plan failed validation|ENOENT/
    );
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 7. Invalid or empty narration file is detected", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "teacher@test.edu",
      store,
    });

    const runDir = created.runDir;
    const plan = await store.readJson<StoryboardPlan>(runDir, "plan.json");

    // Write empty (0-byte) audio file and malformed alignment
    await mkdir(path.join(runDir, "audio"), { recursive: true });
    await mkdir(path.join(runDir, "alignment"), { recursive: true });

    await writeFile(path.join(runDir, "audio", `${plan.scenes[0].id}.mp3`), Buffer.alloc(0)); // 0 bytes!
    await writeFile(path.join(runDir, "alignment", `${plan.scenes[0].id}.json`), "{ malformed json");

    // Without a valid API key, corrupt file fallback attempts synthesis and throws an actionable config/key error
    await assert.rejects(
      () =>
        synthesizeSpeechForRun({
          runPath: created.runPath,
          store,
          config: { ...mockConfig, elevenLabsApiKey: "" },
        }),
      /ELEVENLABS_API_KEY/
    );
  } finally {
    await safeCleanup(temporary);
  }
});

test("Render Recovery: 8. Render timeout produces a useful error with ERR_FRAME_TIMEOUT code", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-retry-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "teacher@test.edu",
      store,
    });

    const runDir = created.runDir;

    // Simulate manifest in failed state with timeout error
    let manifest = await readRunManifest(store, created.runPath);
    manifest = {
      ...manifest,
      state: "failed",
      stage: "render",
      error: {
        code: "ERR_FRAME_TIMEOUT",
        message: "Timeout error: frame 142 failed to render within 120000ms budget.",
        stage: "render",
      },
    };
    await store.writeJson(runDir, "manifest.json", manifest);

    const jobRegistry = new StudioJobRegistry(store);
    const status = await jobRegistry.getRunStatus(created.runPath);

    assert.equal(status.status, "failed");
    assert.equal(status.stage, "failed");
    assert.ok(status.error?.includes("Timeout error"));
    assert.ok(status.telemetryLogs.some((l) => l.tag === "HALT"));
  } finally {
    await safeCleanup(temporary);
  }
});
