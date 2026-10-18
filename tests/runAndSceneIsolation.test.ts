import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import {
  validateRelativeAssetPath,
  validateSceneAssetOwnership,
  validateTimelineAssetIsolation,
  computeSceneCacheKey,
  AssetIsolationError,
} from "../src/storage/assetOwnershipValidator.js";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import {
  type CompiledScene,
  type CompiledTimeline,
  TIMELINE_SCHEMA_VERSION,
  TIMELINE_COMPILER_VERSION,
} from "../src/contracts/timeline.js";

function makeIsolatedTestScene(sceneId: string, overrides: Partial<CompiledScene> = {}): CompiledScene {
  return {
    sceneId,
    type: "labeled-diagram",
    startFrame: 0,
    endFrame: 150,
    durationInFrames: 150,
    purpose: `Purpose for ${sceneId}`,
    onScreenText: [`Title for ${sceneId}`],
    objects: [{ id: `obj-${sceneId}`, kind: "node", label: `Object ${sceneId}` }],
    events: [],
    captions: [],
    audio: {
      isFixture: false,
      audioPath: path.join("audio", `${sceneId}.mp3`),
      alignmentPath: path.join("alignment", `${sceneId}.json`),
      durationMs: 5000,
    },
    ...overrides,
  };
}

test("Asset Isolation: validateRelativeAssetPath rejects path traversal and absolute paths", () => {
  // Valid relative paths
  assert.doesNotThrow(() => validateRelativeAssetPath("audio/scene-1.mp3", "audio"));
  assert.doesNotThrow(() => validateRelativeAssetPath("alignment/scene-1.json", "alignment"));

  // Reject path traversal
  assert.throws(
    () => validateRelativeAssetPath("../other-run/audio/scene-1.mp3", "audio"),
    AssetIsolationError
  );
  assert.throws(
    () => validateRelativeAssetPath("..\\other-run\\audio\\scene-1.mp3", "audio"),
    AssetIsolationError
  );

  // Reject absolute paths
  assert.throws(
    () => validateRelativeAssetPath("/etc/passwd", "audio"),
    AssetIsolationError
  );
  assert.throws(
    () => validateRelativeAssetPath("C:\\Windows\\system32\\cmd.exe", "audio"),
    AssetIsolationError
  );
});

test("Asset Isolation: validateSceneAssetOwnership prevents cross-scene asset leakage", () => {
  // Clean scene referencing its own assets
  const cleanScene = makeIsolatedTestScene("scene-photosynthesis");
  assert.doesNotThrow(() => validateSceneAssetOwnership(cleanScene));

  // Scene attempting to consume another scene's audio asset
  const contaminatedAudioScene = makeIsolatedTestScene("scene-photosynthesis", {
    audio: {
      isFixture: false,
      audioPath: path.join("audio", "scene-ram-architecture.mp3"), // Cross-scene leakage!
      alignmentPath: path.join("alignment", "scene-photosynthesis.json"),
      durationMs: 5000,
    },
  });

  assert.throws(
    () => validateSceneAssetOwnership(contaminatedAudioScene),
    (err: unknown) => {
      assert.ok(err instanceof AssetIsolationError);
      assert.ok(err.message.includes("Cross-scene audio reference rejected"));
      return true;
    }
  );

  // Scene attempting to consume another scene's alignment asset
  const contaminatedAlignmentScene = makeIsolatedTestScene("scene-photosynthesis", {
    audio: {
      isFixture: false,
      audioPath: path.join("audio", "scene-photosynthesis.mp3"),
      alignmentPath: path.join("alignment", "scene-binary-search.json"), // Cross-scene leakage!
      durationMs: 5000,
    },
  });

  assert.throws(
    () => validateSceneAssetOwnership(contaminatedAlignmentScene),
    (err: unknown) => {
      assert.ok(err instanceof AssetIsolationError);
      assert.ok(err.message.includes("Cross-scene alignment reference rejected"));
      return true;
    }
  );
});

test("Asset Isolation: validateTimelineAssetIsolation prevents asset collision across timeline", () => {
  const scene1 = makeIsolatedTestScene("scene-1");
  const scene2 = makeIsolatedTestScene("scene-2");

  const validTimeline: CompiledTimeline = {
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    compilerVersion: TIMELINE_COMPILER_VERSION,
    planHash: "abc123hash",
    projectId: "test-project",
    versionId: "run-001",
    topic: "Isolation Test",
    voicePreset: "indian-english-female",
    composition: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 300,
      durationInSeconds: 10,
    },
    scenes: [scene1, scene2],
    warnings: [],
    createdAt: new Date().toISOString(),
  };

  assert.doesNotThrow(() => validateTimelineAssetIsolation(validTimeline));

  // If scene 2 illegally shares scene 1's audio file
  const collidingScene2: CompiledScene = {
    ...scene2,
    audio: {
      isFixture: false,
      audioPath: path.join("audio", "scene-1.mp3"), // collision!
      alignmentPath: path.join("alignment", "scene-2.json"),
      durationMs: 5000,
    },
  };

  const collidingTimeline: CompiledTimeline = {
    ...validTimeline,
    scenes: [scene1, collidingScene2],
  };

  assert.throws(
    () => validateTimelineAssetIsolation(collidingTimeline),
    (err: unknown) => {
      assert.ok(err instanceof AssetIsolationError);
      return true;
    }
  );
});

test("Asset Isolation: computeSceneCacheKey isolates keys across runs and scenes", () => {
  const keyRun1Scene1 = computeSceneCacheKey("run-alpha", "scene-1", "audio", "hash123");
  const keyRun2Scene1 = computeSceneCacheKey("run-beta", "scene-1", "audio", "hash123");
  const keyRun1Scene2 = computeSceneCacheKey("run-alpha", "scene-2", "audio", "hash123");

  // Identical scene ID across different runs must never collide
  assert.notEqual(keyRun1Scene1, keyRun2Scene1);

  // Different scenes in same run must never collide
  assert.notEqual(keyRun1Scene1, keyRun1Scene2);

  // Determinism
  assert.equal(
    keyRun1Scene1,
    computeSceneCacheKey("run-alpha", "scene-1", "audio", "hash123")
  );
});

test("Asset Isolation: concurrent runs write safely to isolated directories without race conditions", async () => {
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), "namaste-isolation-test-"));
  try {
    const store = new LocalArtifactStore(tmpBase);

    // Run 10 parallel simulated runs writing identical relative artifact names
    const parallelRuns = Array.from({ length: 10 }, (_, i) => ({
      ownerId: "tenant-a",
      projectId: "parallel-project",
      runId: `run-${i.toString().padStart(3, "0")}`,
    }));

    await Promise.all(
      parallelRuns.map(async (run) => {
        const runDir = store.resolveRunDir(run.ownerId, run.projectId, run.runId);
        await store.ensureRunDir(runDir);

        // Write isolated payload
        const payload = { runId: run.runId, secret: `secret-for-${run.runId}` };
        await store.writeJson(runDir, "manifest.json", payload);

        // Read it back immediately
        const readBack = await store.readJson<{ runId: string; secret: string }>(runDir, "manifest.json");
        assert.equal(readBack.runId, run.runId);
        assert.equal(readBack.secret, `secret-for-${run.runId}`);
      })
    );

    // Verify all 10 runs exist and remained untainted
    for (const run of parallelRuns) {
      const runDir = store.resolveRunDir(run.ownerId, run.projectId, run.runId);
      const readBack = await store.readJson<{ runId: string; secret: string }>(runDir, "manifest.json");
      assert.equal(readBack.runId, run.runId);
    }
  } finally {
    await fs.rm(tmpBase, { recursive: true, force: true }).catch(() => undefined);
  }
});
