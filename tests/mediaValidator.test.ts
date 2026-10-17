import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRenderOutput } from "../src/validation/mediaValidator.js";
import type { CompiledTimeline } from "../src/contracts/timeline.js";

function makeMockTimeline(): CompiledTimeline {
  return {
    schemaVersion: "1.0",
    compilerVersion: "0.1.0",
    planHash: "test-hash",
    projectId: "water-cycle",
    versionId: "v1",
    voicePreset: "indian-english-female",
    composition: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 2040,
      durationInSeconds: 68,
    },
    scenes: [
      {
        sceneId: "scene-1",
        type: "title-hook",
        startFrame: 0,
        endFrame: 2040,
        durationInFrames: 2040,
        purpose: "test",
        onScreenText: ["test"],
        objects: [],
        events: [],
        captions: [
          {
            id: "cap-1",
            text: "Line 1\nLine 2",
            startFrame: 0,
            endFrame: 100,
            startMs: 0,
            endMs: 3333,
          },
        ],
        audio: {
          isFixture: true,
          durationMs: 68000,
        },
      },
    ],
    warnings: [],
    createdAt: new Date().toISOString(),
  };
}

test("validateRenderOutput fails when MP4 does not exist", async () => {
  const timeline = makeMockTimeline();
  const report = await validateRenderOutput({
    mp4Path: "non-existent-output.mp4",
    timeline,
    runId: "run-1",
    planHash: "test-hash",
  });

  assert.equal(report.overallPassed, false);
  assert.equal(report.checks.file.exists, false);
  assert.ok(report.errors.some((e) => e.includes("does not exist")));
});

test("validateRenderOutput fails when MP4 is 0 bytes", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "namaste-qa-test-"));
  try {
    const emptyFile = path.join(temporary, "empty.mp4");
    await writeFile(emptyFile, Buffer.alloc(0));

    const timeline = makeMockTimeline();
    const report = await validateRenderOutput({
      mp4Path: emptyFile,
      timeline,
      runId: "run-1",
      planHash: "test-hash",
    });

    assert.equal(report.overallPassed, false);
    assert.equal(report.checks.file.exists, true);
    assert.equal(report.checks.file.isNonEmpty, false);
    assert.ok(report.errors.some((e) => e.includes("empty")));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("validateRenderOutput validates captions limits and timeline continuity", async () => {
  const badTimeline = makeMockTimeline();
  // Add a 3-line caption (violates 2-line max)
  badTimeline.scenes[0].captions.push({
    id: "cap-2",
    text: "Line 1\nLine 2\nLine 3",
    startFrame: 100,
    endFrame: 200,
    startMs: 3333,
    endMs: 6666,
  });

  const report = await validateRenderOutput({
    mp4Path: "non-existent.mp4",
    timeline: badTimeline,
    runId: "run-1",
    planHash: "test-hash",
  });

  assert.equal(report.checks.captions.valid, false);
  assert.ok(report.errors.some((e) => e.includes("exceeds maximum 2 lines")));
});

