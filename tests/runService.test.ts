import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createFixtureRun, approveRun, readRunManifest } from "../src/pipeline/runService.js";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";

const fixtureRoot = path.resolve("fixtures/plans");

test("fixture run requires exact storyboard hash approval", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namastevideo-run-test-"));
  try {
    const store = new LocalArtifactStore(path.join(temporary, "runs"));
    const created = await createFixtureRun({
      name: "water-cycle",
      fixtureRoot,
      store,
      now: new Date("2026-10-17T10:00:00.000Z"),
    });
    assert.equal(created.manifest.state, "awaiting-approval");
    assert.equal(await store.exists(created.runDir, "plan-review.html"), true);
    await assert.rejects(() => approveRun({
      runPath: created.runPath,
      planHash: "not-the-current-hash",
      approvedBy: "test-user",
      store,
    }), /Plan hash does not match/);
    const approved = await approveRun({
      runPath: created.runPath,
      planHash: created.planHash,
      approvedBy: "test-user",
      store,
      now: new Date("2026-10-17T10:01:00.000Z"),
    });
    assert.equal(approved.state, "approved");
    assert.equal(approved.artifacts.approval, "approval.json");
    const status = await readRunManifest(store, created.runPath);
    assert.equal(status.state, "approved");
    const approval = JSON.parse(await readFile(path.join(created.runDir, "approval.json"), "utf8")) as { approvedBy: string };
    assert.equal(approval.approvedBy, "test-user");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
