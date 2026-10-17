import assert from "node:assert/strict";
import test from "node:test";
import type { StoryboardScene } from "../src/contracts/plan.js";
import type { ElevenLabsAlignment } from "../src/contracts/alignment.js";
import {
  mapAlignmentToBlockTimings,
  resolvePhraseTimingFromBlock,
} from "../src/timing/alignmentMapper.js";

test("mapAlignmentToBlockTimings groups characters into timed words and maps to narration blocks", () => {
  const scene: StoryboardScene = {
    id: "scene-test",
    type: "title-hook",
    purpose: "Test alignment mapping",
    estimatedDurationMs: 5000,
    narration: [
      { id: "nar-1", text: "Every drop of water on Earth is recycled." },
      { id: "nar-2", text: "This is the water cycle." },
    ],
    objects: [{ id: "drop", kind: "shape", label: "Droplet" }],
    events: [],
    onScreenText: ["The Water Cycle"],
    sourceRefs: [],
  };

  const text = "Every drop of water on Earth is recycled. This is the water cycle.";
  const chars = text.split("");
  const starts: number[] = [];
  const ends: number[] = [];

  let time = 0.1;
  for (let i = 0; i < chars.length; i++) {
    starts.push(Number(time.toFixed(2)));
    time += 0.05;
    ends.push(Number(time.toFixed(2)));
  }

  const alignment: ElevenLabsAlignment = {
    characters: chars,
    character_start_times_seconds: starts,
    character_end_times_seconds: ends,
  };

  const blocks = mapAlignmentToBlockTimings(scene, alignment);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].blockId, "nar-1");
  assert.equal(blocks[0].words.length, 8); // Every, drop, of, water, on, Earth, is, recycled.
  assert.equal(blocks[0].words[0].word, "Every");
  assert.equal(blocks[0].words[0].startMs, 100);
  assert.ok(blocks[0].words[0].endMs > blocks[0].words[0].startMs);

  assert.equal(blocks[1].blockId, "nar-2");
  assert.equal(blocks[1].words.length, 5); // This, is, the, water, cycle.
  assert.equal(blocks[1].words[0].word, "This");
});

test("resolvePhraseTimingFromBlock resolves exact phrase start and end in milliseconds", () => {
  const block = {
    blockId: "nar-1",
    text: "The sun warms water across oceans and lakes.",
    words: [
      { word: "The", startMs: 200, endMs: 400 },
      { word: "sun", startMs: 420, endMs: 650 },
      { word: "warms", startMs: 670, endMs: 950 },
      { word: "water", startMs: 970, endMs: 1300 },
      { word: "across", startMs: 1320, endMs: 1650 },
      { word: "oceans", startMs: 1670, endMs: 2100 },
      { word: "and", startMs: 2120, endMs: 2300 },
      { word: "lakes.", startMs: 2320, endMs: 2800 },
    ],
  };

  const timing = resolvePhraseTimingFromBlock(block, "warms water", 1);
  assert.equal(timing.startMs, 670);
  assert.equal(timing.endMs, 1300);

  const sunTiming = resolvePhraseTimingFromBlock(block, "sun", 1);
  assert.equal(sunTiming.startMs, 420);
  assert.equal(sunTiming.endMs, 650);

  assert.throws(
    () => resolvePhraseTimingFromBlock(block, "nonexistent phrase", 1),
    /Phrase "nonexistent phrase" occurrence 1 not found/
  );
});
