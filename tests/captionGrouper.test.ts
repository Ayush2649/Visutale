import assert from "node:assert/strict";
import test from "node:test";
import { groupWordsIntoCaptions, wrapToTwoLines } from "../src/timing/captionGrouper.js";

test("wrapToTwoLines enforces 2-line maximum and balances length", () => {
  const shortText = "The water cycle";
  assert.equal(wrapToTwoLines(shortText), "The water cycle");

  const longText = "Water on Earth is constantly moving through a natural loop.";
  const wrapped = wrapToTwoLines(longText, 35);
  const lines = wrapped.split("\n");
  assert.equal(lines.length, 2);
  assert.ok(lines[0].length <= 35);
  assert.ok(lines[1].length <= 35);
});

test("groupWordsIntoCaptions produces ordered, non-overlapping caption cues", () => {
  const blockTimings = [
    {
      blockId: "b1",
      text: "Water on Earth is constantly moving through a natural loop. This journey is called the water cycle, and sunlight helps drive it.",
      words: [
        { word: "Water", startMs: 200, endMs: 400 },
        { word: "on", startMs: 400, endMs: 550 },
        { word: "Earth", startMs: 550, endMs: 800 },
        { word: "is", startMs: 800, endMs: 950 },
        { word: "constantly", startMs: 950, endMs: 1400 },
        { word: "moving", startMs: 1400, endMs: 1800 },
        { word: "through", startMs: 1800, endMs: 2100 },
        { word: "a", startMs: 2100, endMs: 2200 },
        { word: "natural", startMs: 2200, endMs: 2600 },
        { word: "loop.", startMs: 2600, endMs: 3000 },
        { word: "This", startMs: 3100, endMs: 3400 },
        { word: "journey", startMs: 3400, endMs: 3800 },
        { word: "is", startMs: 3800, endMs: 4000 },
        { word: "called", startMs: 4000, endMs: 4400 },
        { word: "the", startMs: 4400, endMs: 4600 },
        { word: "water", startMs: 4600, endMs: 5000 },
        { word: "cycle,", startMs: 5000, endMs: 5500 },
        { word: "and", startMs: 5600, endMs: 5800 },
        { word: "sunlight", startMs: 5800, endMs: 6400 },
        { word: "helps", startMs: 6400, endMs: 6800 },
        { word: "drive", startMs: 6800, endMs: 7200 },
        { word: "it.", startMs: 7200, endMs: 7600 },
      ],
    },
  ];

  const captions = groupWordsIntoCaptions(blockTimings, 0, 270, 30);
  assert.ok(captions.length >= 2);

  for (let i = 0; i < captions.length; i++) {
    const cue = captions[i];
    const lines = cue.text.split("\n");
    assert.ok(lines.length <= 2, `Caption ${cue.id} has <= 2 lines`);
    assert.ok(cue.startFrame >= 0);
    assert.ok(cue.endFrame <= 270);
    assert.ok(cue.endFrame > cue.startFrame);

    if (i > 0) {
      assert.ok(cue.startFrame >= captions[i - 1].endFrame, "Captions are non-overlapping and contiguous");
    }
  }
});

