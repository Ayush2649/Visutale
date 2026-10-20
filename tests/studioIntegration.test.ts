import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import {
  listAvailableFixtures,
  createStudioRun,
  updateStudioPlan,
  approveStudioRun,
  getStudioRun,
} from "../src/studio/studioService.js";
import { StudioJobRegistry } from "../src/studio/studioJobManager.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";

const fixtureRoot = path.resolve("fixtures/plans");

test("Studio Integration: listAvailableFixtures returns known educational benchmark fixtures", async () => {
  const fixtures = await listAvailableFixtures(fixtureRoot);
  assert.ok(fixtures.length >= 3, "Expected at least 3 benchmark fixtures");
  const fixtureIds = fixtures.map((f) => f.id);
  assert.ok(fixtureIds.includes("water-cycle"), "Expected water-cycle fixture");
  assert.ok(fixtureIds.includes("ram-vs-storage"), "Expected ram-vs-storage fixture");
  assert.ok(fixtureIds.includes("binary-search"), "Expected binary-search fixture");

  const waterCycle = fixtures.find((f) => f.id === "water-cycle");
  assert.ok(waterCycle?.topic.length, "Expected non-empty topic");
  assert.ok((waterCycle?.sceneCount ?? 0) > 0, "Expected non-zero scene count");
});

test("Studio Integration: createStudioRun creates valid awaiting-approval run with canonical planHash", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-studio-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createStudioRun({
      topic: "How the water cycle works",
      fixtureId: "water-cycle",
      store,
      customFixtureRoot: fixtureRoot,
    });

    assert.equal(created.manifest.state, "awaiting-approval");
    assert.equal(created.manifest.stage, "plan");
    assert.ok(created.planHash.length > 20, "Plan hash must be a SHA-256 canonical hash");
    assert.equal(created.manifest.planHash, created.planHash);
    assert.equal(created.plan.topic, "How the water cycle works");
    assert.ok(created.plan.scenes.length >= 3);

    // Verify stored files
    const runDir = store.resolveRunDir(created.plan.ownerId, created.plan.projectId, created.plan.versionId);
    assert.ok(await store.exists(runDir, "plan.json"));
    assert.ok(await store.exists(runDir, "manifest.json"));
    assert.ok(await store.exists(runDir, "plan-review.html"));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("Studio Integration: modifying manuscript plan changes canonical hash and invalidates stale approval", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-studio-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createStudioRun({
      topic: "How the water cycle works",
      fixtureId: "water-cycle",
      store,
      customFixtureRoot: fixtureRoot,
    });

    const originalHash = created.planHash;

    // Approve the original plan
    await approveStudioRun({
      runPath: created.runPath,
      planHash: originalHash,
      approvedBy: "test-editor",
      store,
    });

    // Revise narration in Scene 1
    const modifiedPlan: StoryboardPlan = {
      ...created.plan,
      scenes: created.plan.scenes.map((s, idx) =>
        idx === 0
          ? {
              ...s,
              narration: [{ id: "line-hook", text: "Water on Earth is constantly moving in a dynamic loop known as the water cycle, driven by solar energy." }],
            }
          : s
      ),
    };

    const revResult = await updateStudioPlan({
      runPath: created.runPath,
      modifiedPlan,
      store,
    });

    assert.notEqual(revResult.newPlanHash, originalHash, "Canonical hash must change after plan modification");
    assert.equal(revResult.newManifest.state, "awaiting-approval", "Revised plan must require new approval");
    assert.equal(revResult.revisionType, "narration-affecting");

    // Attempting to approve the revised plan using the OLD stale hash must be rejected
    await assert.rejects(
      () =>
        approveStudioRun({
          runPath: revResult.newRunPath,
          planHash: originalHash, // Stale hash
          approvedBy: "test-editor",
          store,
        }),
      /Plan hash does not match/
    );

    // Approving with the correct new hash succeeds
    const approvedNew = await approveStudioRun({
      runPath: revResult.newRunPath,
      planHash: revResult.newPlanHash,
      approvedBy: "test-editor",
      store,
    });
    assert.equal(approvedNew.state, "approved");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("Studio Integration: JobRegistry prevents duplicate generation and tracks non-blocking progress", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-studio-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const jobRegistry = new StudioJobRegistry(store);

    const created = await createStudioRun({
      topic: "How the water cycle works",
      fixtureId: "water-cycle",
      store,
      customFixtureRoot: fixtureRoot,
    });

    // Must be approved before render
    await approveStudioRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "test-editor",
      store,
    });

    // Start render job
    const job1 = await jobRegistry.startRenderJob(created.runPath);
    assert.ok(job1.jobId.startsWith("job-"));
    assert.equal(job1.status, "running");
    assert.equal(job1.stage, "compositor");

    // Attempting to start duplicate job for the same runPath must return the existing running job
    const job2 = await jobRegistry.startRenderJob(created.runPath);
    assert.equal(job1.jobId, job2.jobId, "Duplicate render request must return the existing running job instance");

    // Check status retrieval
    const status = await jobRegistry.getRunStatus(created.runPath);
    assert.equal(status.jobId, job1.jobId);
    assert.ok(status.telemetryLogs.length >= 4, "Expected telemetry initialization logs");
  } finally {
    try {
      await rm(temporary, { recursive: true, force: true });
    } catch {
      // Ignore async file lock on Windows temp cleanup
    }
  }
});

test("Studio Integration: Artifact verification strictly requires existing non-empty output.mp4", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-studio-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const jobRegistry = new StudioJobRegistry(store);

    const created = await createStudioRun({
      topic: "Binary Search Algorithm",
      fixtureId: "binary-search",
      store,
      customFixtureRoot: fixtureRoot,
    });

    // Without output.mp4, run status must NOT be completed
    const initialStatus = await jobRegistry.getRunStatus(created.runPath);
    assert.notEqual(initialStatus.status, "completed");

    // Simulate completed artifact
    const runDir = store.resolveRunDir(created.plan.ownerId, created.plan.projectId, created.plan.versionId);
    await writeFile(path.join(runDir, "output.mp4"), Buffer.from("mock-mp4-data-stream-verification"));

    // Update manifest to ready-for-review
    const manifest = await store.readJson<any>(runDir, "manifest.json");
    manifest.state = "ready-for-review";
    manifest.artifacts.outputVideo = "output.mp4";
    await store.writeJson(runDir, "manifest.json", manifest);

    // Status inspection must now report completed with verified artifact size
    const verifiedStatus = await jobRegistry.getRunStatus(created.runPath);
    assert.equal(verifiedStatus.status, "completed");
    assert.equal(verifiedStatus.stage, "completed");
    assert.equal(verifiedStatus.percent, 100);
    assert.ok((verifiedStatus.videoSizeBytes ?? 0) > 0, "Video size bytes must be reported from filesystem");
  } finally {
    try {
      await rm(temporary, { recursive: true, force: true });
    } catch {
      // Ignore async file lock on Windows temp cleanup
    }
  }
});

