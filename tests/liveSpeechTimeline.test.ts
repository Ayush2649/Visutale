import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validatePlan, type StoryboardPlan } from "../src/contracts/plan.js";
import { compilePlanTimeline } from "../src/timing/timelineCompiler.js";
import { validateTimeline } from "../src/contracts/timeline.js";
import type { SceneSpeechArtifact, ElevenLabsAlignment } from "../src/contracts/alignment.js";

const fixturePath = path.resolve("fixtures/plans/water-cycle.json");

test("compilePlanTimeline with live speech artifacts creates valid synchronized timeline", async () => {
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
  const parsed = validatePlan(raw);
  assert.equal(parsed.success, true);
  const plan = parsed.data;

  // Build mock speech artifacts for each scene with realistic alignments
  const speechArtifacts = new Map<string, SceneSpeechArtifact>();

  for (const scene of plan.scenes) {
    const fullText = scene.narration.map((n) => n.text.trim()).join(" ");
    const chars = fullText.split("");
    const starts: number[] = [];
    const ends: number[] = [];

    let t = 0.05;
    const charStep = (scene.estimatedDurationMs - 400) / 1000 / Math.max(1, chars.length);
    for (let i = 0; i < chars.length; i++) {
      starts.push(Number(t.toFixed(3)));
      t += charStep;
      ends.push(Number(t.toFixed(3)));
    }

    const alignment: ElevenLabsAlignment = {
      characters: chars,
      character_start_times_seconds: starts,
      character_end_times_seconds: ends,
    };

    const durationMs = Math.round(t * 1000);

    speechArtifacts.set(scene.id, {
      sceneId: scene.id,
      voiceId: "test-voice-id",
      modelId: "eleven_multilingual_v2",
      audioFilename: `audio/${scene.id}.mp3`,
      audioBase64: Buffer.from("MOCK_AUDIO_DATA").toString("base64"),
      alignmentFilename: `alignment/${scene.id}.json`,
      durationMs,
      alignment,
      createdAt: new Date().toISOString(),
    });
  }

  const timeline = compilePlanTimeline(plan, { fps: 30, speechArtifacts });
  const validation = validateTimeline(timeline);
  assert.equal(validation.success, true);

  // Verify all scenes have live audio tracks
  for (const scene of timeline.scenes) {
    assert.equal(scene.audio.isFixture, false);
    assert.ok(scene.audio.audioBase64);
    assert.ok(scene.audio.durationMs > 0);
  }

  // Verify timeline continuity
  let expectedStart = 0;
  for (let i = 0; i < timeline.scenes.length; i++) {
    const sc = timeline.scenes[i];
    assert.equal(sc.startFrame, expectedStart);
    assert.ok(sc.endFrame > sc.startFrame);
    assert.equal(sc.durationInFrames, sc.endFrame - sc.startFrame);
    expectedStart = sc.endFrame;

    // Captions stay within scene bounds
    for (const cap of sc.captions) {
      assert.ok(cap.startFrame >= sc.startFrame);
      assert.ok(cap.endFrame <= sc.endFrame);
    }

    // Animation events stay within scene bounds
    for (const ev of sc.events) {
      assert.ok(ev.startFrame >= sc.startFrame);
      assert.ok(ev.endFrame <= sc.endFrame);
    }
  }

  assert.equal(expectedStart, timeline.composition.durationInFrames);
});
