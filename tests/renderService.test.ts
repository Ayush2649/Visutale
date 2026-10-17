import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createFixtureRun, approveRun } from "../src/pipeline/runService.js";
import { renderRun } from "../src/pipeline/renderService.js";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";

const fixtureRoot = path.resolve("fixtures/plans");

test("renderRun rejects unapproved run", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-render-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
      now: new Date("2026-10-17T10:00:00.000Z"),
    });

    assert.equal(created.manifest.state, "awaiting-approval");

    await assert.rejects(
      () => renderRun({ runPath: created.runPath, store }),
      /Only approved/
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("renderRun rejects mutated plan even if previously approved", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-render-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
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

    // Mutate the plan in storage
    const plan = await store.readJson<StoryboardPlan>(created.runDir, "plan.json");
    plan.topic = "Mutated topic that breaks hash";
    await store.writeJson(created.runDir, "plan.json", plan);

    await assert.rejects(
      () => renderRun({ runPath: created.runPath, store }),
      /Plan has been modified since approval was recorded/
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
