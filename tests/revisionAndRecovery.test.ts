import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createFixtureRun, approveRun, createRevisionRun, readRunManifest } from "../src/pipeline/runService.js";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";
import type { RunManifest } from "../src/contracts/manifest.js";

const fixtureRoot = path.resolve("fixtures/plans");

test("visual-only revision creates new child version, preserves original, and reuses speech without network calls", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-rev-visual-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "ram-vs-storage",
      fixtureRoot,
      store,
      now: new Date("2026-10-17T10:00:00.000Z"),
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "test-creator",
      store,
    });

    // Simulate mock audio and alignment in parent run
    const parentRunDir = created.runDir;
    await mkdir(path.join(parentRunDir, "audio"), { recursive: true });
    await mkdir(path.join(parentRunDir, "alignment"), { recursive: true });
    await writeFile(path.join(parentRunDir, "audio", "scene-hook.mp3"), Buffer.from("mock-mp3-audio-bytes"));
    await writeFile(path.join(parentRunDir, "alignment", "scene-hook.json"), JSON.stringify({
      characters: ["H", "i"],
      character_start_times_seconds: [0, 0.2],
      character_end_times_seconds: [0.2, 0.4],
    }));

    // Update parent manifest to record audio/alignment artifacts
    const parentManifest = await store.readJson<RunManifest>(parentRunDir, "manifest.json");
    parentManifest.artifacts.audio = "audio";
    parentManifest.artifacts.alignment = "alignment";
    await store.writeJson(parentRunDir, "manifest.json", parentManifest);

    // Read parent plan and make a visual-only modification (e.g. increase label sizes / uppercase onScreenText)
    const parentPlan = await store.readJson<StoryboardPlan>(parentRunDir, "plan.json");
    const visualModifiedPlan: StoryboardPlan = {
      ...parentPlan,
      scenes: parentPlan.scenes.map((s) => ({
        ...s,
        onScreenText: s.onScreenText.map((t) => `EMPHASIZED: ${t}`),
      })),
    };

    const revResult = await createRevisionRun({
      parentRunPath: created.runPath,
      modifiedPlan: visualModifiedPlan,
      store,
      now: new Date("2026-10-17T10:05:00.000Z"),
    });

    assert.equal(revResult.revisionType, "visual-only");
    assert.equal(revResult.manifest.state, "approved");
    assert.equal(revResult.manifest.stage, "compile");
    assert.equal(revResult.manifest.parentRunId, created.manifest.runId);
    assert.ok(revResult.reusedAudioScenes.includes("scene-hook"));

    // Verify audio file was copied into revised run without network calls
    assert.equal(await store.exists(revResult.runDir, "audio/scene-hook.mp3"), true);
    assert.equal(await store.exists(revResult.runDir, "alignment/scene-hook.json"), true);

    // Verify parent run was preserved untouched
    const parentCheck = await readRunManifest(store, created.runPath);
    assert.equal(parentCheck.runId, created.manifest.runId);
    assert.equal(parentCheck.state, "approved");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("narration-affecting revision invalidates audio and requires explicit approval of new plan hash", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-rev-narr-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "ram-vs-storage",
      fixtureRoot,
      store,
      now: new Date("2026-10-17T10:00:00.000Z"),
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "test-creator",
      store,
    });

    const parentPlan = await store.readJson<StoryboardPlan>(created.runDir, "plan.json");
    const narrativeModifiedPlan: StoryboardPlan = {
      ...parentPlan,
      scenes: parentPlan.scenes.map((s, idx) => {
        if (idx === 0) {
          return {
            ...s,
            narration: [
              {
                id: "nar-hook-revised",
                text: "Have you ever wondered why your computer needs both RAM and storage? Let us explore their differences.",
              },
            ],
            events: [
              {
                id: "ev-hook-1",
                targetId: "obj-hook-title",
                action: "reveal",
                cue: {
                  blockId: "nar-hook-revised",
                  phrase: "RAM and storage",
                  occurrence: 1,
                },
                offsetMs: 0,
                durationMs: 500,
              },
            ],
          };
        }
        return s;
      }),
    };

    const revResult = await createRevisionRun({
      parentRunPath: created.runPath,
      modifiedPlan: narrativeModifiedPlan,
      store,
      now: new Date("2026-10-17T10:06:00.000Z"),
    });

    assert.equal(revResult.revisionType, "narration-affecting");
    assert.equal(revResult.manifest.state, "awaiting-approval");
    assert.equal(revResult.manifest.stage, "approve");
    assert.equal(revResult.reusedAudioScenes.length, 0);

    // Audio directory should not exist or be empty
    assert.equal(await store.exists(revResult.runDir, "audio/scene-hook.mp3"), false);

    // Trying to approve with wrong hash fails
    await assert.rejects(() => approveRun({
      runPath: revResult.runPath,
      planHash: created.planHash, // Old hash
      approvedBy: "test-creator",
      store,
    }), /Plan hash does not match/);

    // Approving with exact revised plan hash succeeds
    const approved = await approveRun({
      runPath: revResult.runPath,
      planHash: revResult.planHash,
      approvedBy: "test-creator",
      store,
    });
    assert.equal(approved.state, "approved");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("narrator change retains narration, invalidates audio, and sets stage to speech", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-rev-narrator-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "ram-vs-storage",
      fixtureRoot,
      store,
      now: new Date("2026-10-17T10:00:00.000Z"),
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "test-creator",
      store,
    });

    const parentPlan = await store.readJson<StoryboardPlan>(created.runDir, "plan.json");
    const voiceChangedPlan: StoryboardPlan = {
      ...parentPlan,
      voicePreset: "indian-english-male",
    };

    const revResult = await createRevisionRun({
      parentRunPath: created.runPath,
      modifiedPlan: voiceChangedPlan,
      store,
      now: new Date("2026-10-17T10:07:00.000Z"),
    });

    assert.equal(revResult.revisionType, "narrator-change");
    assert.equal(revResult.manifest.state, "approved");
    assert.equal(revResult.manifest.stage, "speech");
    assert.equal(revResult.manifest.artifacts.approval, "approval.json");
    assert.equal(revResult.manifest.artifacts.audio, undefined);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("controlled render failure persists failed state, and retry preserves audio", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-failure-recovery-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "ram-vs-storage",
      fixtureRoot,
      store,
      now: new Date("2026-10-17T10:00:00.000Z"),
    });

    await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "test-creator",
      store,
    });

    // Simulate audio and alignment artifacts exist
    const runDir = created.runDir;
    await mkdir(path.join(runDir, "audio"), { recursive: true });
    await writeFile(path.join(runDir, "audio", "scene-hook.mp3"), Buffer.from("audio-data"));

    // Simulate a failed render state (e.g. out of memory or interrupted renderer)
    let manifest = await store.readJson<RunManifest>(runDir, "manifest.json");
    manifest = {
      ...manifest,
      state: "failed",
      stage: "render",
      artifacts: {
        ...manifest.artifacts,
        audio: "audio",
      },
      error: {
        code: "RENDER_FAILED",
        message: "Injected controlled render crash for testing recovery",
        stage: "render",
      },
    };
    await store.writeJson(runDir, "manifest.json", manifest);

    // Verify failed state is persisted
    const failedManifest = await readRunManifest(store, created.runPath);
    assert.equal(failedManifest.state, "failed");
    assert.equal(failedManifest.error?.code, "RENDER_FAILED");

    // Verify audio is intact and preserved
    assert.equal(await store.exists(runDir, "audio/scene-hook.mp3"), true);
    const audioContent = await readFile(path.join(runDir, "audio", "scene-hook.mp3"), "utf8");
    assert.equal(audioContent, "audio-data");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

