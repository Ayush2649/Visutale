import assert from "node:assert/strict";
import test from "node:test";
import { validateAlignment } from "../src/contracts/alignment.js";
import { synthesizeSpeechWithElevenLabs } from "../src/providers/elevenLabsSpeech.js";

test("validateAlignment accepts valid character timestamps", () => {
  const result = validateAlignment({
    characters: ["H", "i"],
    character_start_times_seconds: [0.0, 0.1],
    character_end_times_seconds: [0.1, 0.25],
  });
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("validateAlignment rejects array length mismatch and negative/decreasing timestamps", () => {
  const mismatched = validateAlignment({
    characters: ["H", "i"],
    character_start_times_seconds: [0.0],
    character_end_times_seconds: [0.1, 0.2],
  });
  assert.equal(mismatched.valid, false);
  assert.ok(mismatched.errors.some((e) => e.includes("length mismatch")));

  const negative = validateAlignment({
    characters: ["A"],
    character_start_times_seconds: [-0.5],
    character_end_times_seconds: [0.2],
  });
  assert.equal(negative.valid, false);
  assert.ok(negative.errors.some((e) => e.includes("Invalid start time")));

  const decreasing = validateAlignment({
    characters: ["A", "B"],
    character_start_times_seconds: [0.5, 0.2],
    character_end_times_seconds: [0.6, 0.4],
  });
  assert.equal(decreasing.valid, false);
  assert.ok(decreasing.errors.some((e) => e.includes("Decreasing start time")));
});

test("synthesizeSpeechWithElevenLabs rejects missing options without network calls", async () => {
  await assert.rejects(
    () => synthesizeSpeechWithElevenLabs({ text: "", voiceId: "v1", modelId: "m1", apiKey: "k1" }),
    /Narration text is empty/
  );

  await assert.rejects(
    () => synthesizeSpeechWithElevenLabs({ text: "Hello", voiceId: "", modelId: "m1", apiKey: "k1" }),
    /voiceId is missing or empty/
  );

  await assert.rejects(
    () => synthesizeSpeechWithElevenLabs({ text: "Hello", voiceId: "v1", modelId: "", apiKey: "k1" }),
    /ELEVENLABS_MODEL is missing or empty/
  );

  await assert.rejects(
    () => synthesizeSpeechWithElevenLabs({ text: "Hello", voiceId: "v1", modelId: "m1", apiKey: "" }),
    /ELEVENLABS_API_KEY is missing or empty/
  );
});

