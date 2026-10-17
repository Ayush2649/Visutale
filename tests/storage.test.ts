import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";

test("local artifact store atomically writes and reads JSON", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "namastevideo-store-test-"));
  try {
    const store = new LocalArtifactStore(path.join(parent, "runs"));
    const runDir = store.resolveRunDir("local", "water-cycle", "version-1");
    await store.ensureRunDir(runDir);
    await store.writeJson(runDir, "plan.json", { topic: "How the water cycle works" });
    assert.deepEqual(await store.readJson(runDir, "plan.json"), { topic: "How the water cycle works" });
    assert.equal(await store.hashFile(runDir, "plan.json").then((hash) => hash.length), 64);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("local artifact store rejects path traversal", () => {
  const store = new LocalArtifactStore(path.resolve("test-runs"));
  assert.throws(() => store.resolveRunDir("../escape", "project", "version"));
  const runDir = store.resolveRunDir("local", "project", "version");
  assert.throws(() => store.resolveArtifactPath(runDir, "../../outside.json"));
});
