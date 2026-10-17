import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validatePlan, type StoryboardPlan } from "../src/contracts/plan.js";
import { compilePlanTimeline } from "../src/timing/timelineCompiler.js";
import { validateTimeline } from "../src/contracts/timeline.js";

const fixturePath = path.resolve("fixtures/plans/water-cycle.json");

test("timeline compilation creates contiguous frames and valid duration", async () => {
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
  const parsed = validatePlan(raw);
  assert.equal(parsed.success, true);

  const timeline = compilePlanTimeline(parsed.data, { fps: 30 });
  const validation = validateTimeline(timeline);
  assert.equal(validation.success, true);

  // Check 1080x1920 30fps
  assert.equal(timeline.composition.width, 1080);
  assert.equal(timeline.composition.height, 1920);
  assert.equal(timeline.composition.fps, 30);

  // Total duration: 68s = 2040 frames (between 1800 and 2700 frames)
  assert.equal(timeline.composition.durationInFrames, 2040);
  assert.equal(timeline.composition.durationInSeconds, 68);
  assert.ok(timeline.composition.durationInFrames >= 1800 && timeline.composition.durationInFrames <= 2700);

  // Check contiguity: scene[0] starts at 0, scene[i] starts at scene[i-1].endFrame
  assert.equal(timeline.scenes.length, 7);
  let expectedStart = 0;
  for (let i = 0; i < timeline.scenes.length; i++) {
    const sc = timeline.scenes[i];
    assert.equal(sc.startFrame, expectedStart, `Scene ${i} startFrame matches expected`);
    assert.ok(sc.endFrame > sc.startFrame, `Scene ${i} endFrame > startFrame`);
    assert.equal(sc.durationInFrames, sc.endFrame - sc.startFrame);
    expectedStart = sc.endFrame;

    // Events stay within scene boundaries
    for (const ev of sc.events) {
      assert.ok(ev.startFrame >= sc.startFrame, `Event ${ev.id} starts at/after scene start`);
      assert.ok(ev.endFrame <= sc.endFrame, `Event ${ev.id} ends at/before scene end`);
    }

    // Captions stay within scene boundaries
    for (const cap of sc.captions) {
      assert.ok(cap.startFrame >= sc.startFrame, `Caption ${cap.id} starts at/after scene start`);
      assert.ok(cap.endFrame <= sc.endFrame, `Caption ${cap.id} ends at/before scene end`);
    }
  }

  assert.equal(expectedStart, 2040);
});

test("timeline compilation is deterministic", async () => {
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
  const plan = (validatePlan(raw) as { success: true; data: StoryboardPlan }).data;

  const fixedDate = new Date("2026-10-17T12:00:00.000Z");
  const t1 = compilePlanTimeline(plan, { fps: 30, now: fixedDate });
  const t2 = compilePlanTimeline(plan, { fps: 30, now: fixedDate });

  assert.deepEqual(t1, t2);
});

test("timeline compilation fails when plan is invalid or cue is missing", async () => {
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as StoryboardPlan;
  const invalidPlan: StoryboardPlan = {
    ...raw,
    scenes: [
      {
        ...raw.scenes[0],
        events: [
          {
            ...raw.scenes[0].events[0],
            cue: {
              blockId: "line-hook",
              phrase: "phrase-not-in-text",
              occurrence: 1,
            },
          },
        ],
      },
    ],
  };

  assert.throws(() => compilePlanTimeline(invalidPlan), /invalid plan/);
});

test("validateTimeline detects timing gaps and overlaps", () => {
  const badTimeline = {
    schemaVersion: "1.0",
    compilerVersion: "0.1.0",
    planHash: "abc",
    projectId: "test",
    versionId: "v1",
    voicePreset: "indian-english-female",
    composition: { width: 1080, height: 1920, fps: 30, durationInFrames: 2000, durationInSeconds: 66.67 },
    scenes: [
      {
        sceneId: "s1",
        type: "title-hook",
        startFrame: 0,
        endFrame: 100,
        durationInFrames: 100,
        purpose: "test",
        onScreenText: [],
        objects: [],
        events: [],
        captions: [],
        audio: { isFixture: true, durationMs: 3333 },
      },
      {
        sceneId: "s2",
        type: "process-flow",
        startFrame: 120, // GAP: expected 100
        endFrame: 2000,
        durationInFrames: 1880,
        purpose: "test",
        onScreenText: [],
        objects: [],
        events: [],
        captions: [],
        audio: { isFixture: true, durationMs: 62667 },
      },
    ],
    warnings: [],
    createdAt: new Date().toISOString(),
  };

  const result = validateTimeline(badTimeline);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.message.includes("gap or overlap")));
});

