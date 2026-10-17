import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validatePlan } from "../src/contracts/plan.js";

const fixturePath = path.resolve(process.cwd(), "fixtures/plans/water-cycle.json");

async function loadFixture(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(fixturePath, "utf8")) as Record<string, unknown>;
}

test("water-cycle fixture passes structural and semantic validation", async () => {
  const result = validatePlan(await loadFixture());
  assert.equal(result.success, true, result.success ? undefined : JSON.stringify(result.issues, null, 2));
  if (result.success) {
    assert.equal(result.data.language, "en");
    assert.equal(result.data.scenes.length, 7);
    assert.equal(result.data.scenes.reduce((sum, scene) => sum + scene.estimatedDurationMs, 0), 68000);
  }
});

test("invalid animation cue is rejected before rendering", async () => {
  const plan = await loadFixture();
  const scenes = plan.scenes as Array<Record<string, unknown>>;
  const firstScene = scenes[0];
  const events = firstScene?.events as Array<Record<string, unknown>>;
  const firstEvent = events[0];
  if (!firstEvent) throw new Error("Fixture needs a first event.");
  firstEvent.targetId = "missing-object";
  const result = validatePlan(plan);
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.issues.some((issue) => issue.path.endsWith("targetId")));
});

test("unsupported scene type is rejected", async () => {
  const plan = await loadFixture();
  const scenes = plan.scenes as Array<Record<string, unknown>>;
  if (!scenes[0]) throw new Error("Fixture needs a scene.");
  scenes[0].type = "ai-generated-react-component";
  const result = validatePlan(plan);
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.issues.some((issue) => issue.path.endsWith(".type")));
});

test("ram-vs-storage fixture passes structural and semantic validation", async () => {
  const raw = JSON.parse(await readFile(path.resolve(process.cwd(), "fixtures/plans/ram-vs-storage.json"), "utf8")) as Record<string, unknown>;
  const result = validatePlan(raw);
  assert.equal(result.success, true, result.success ? undefined : JSON.stringify(result.issues, null, 2));
  if (result.success) {
    assert.equal(result.data.scenes.length, 5);
    assert.ok(result.data.scenes.some((s) => s.type === "comparison"));
  }
});

test("binary-search fixture passes structural and semantic validation", async () => {
  const raw = JSON.parse(await readFile(path.resolve(process.cwd(), "fixtures/plans/binary-search.json"), "utf8")) as Record<string, unknown>;
  const result = validatePlan(raw);
  assert.equal(result.success, true, result.success ? undefined : JSON.stringify(result.issues, null, 2));
  if (result.success) {
    assert.equal(result.data.scenes.length, 6);
    assert.ok(result.data.scenes.some((s) => s.type === "step-sequence"));
  }
});


