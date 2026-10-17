import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPlannerSystemPrompt,
  buildPlannerUserPrompt,
} from "../src/planning/plannerPrompt.js";
import { generateStoryboardWithGemini } from "../src/providers/geminiPlanner.js";

test("buildPlannerSystemPrompt includes schema rules and all allowed visual constants", () => {
  const prompt = buildPlannerSystemPrompt();
  assert.ok(prompt.includes("title-hook"));
  assert.ok(prompt.includes("process-flow"));
  assert.ok(prompt.includes("labeled-diagram"));
  assert.ok(prompt.includes("comparison"));
  assert.ok(prompt.includes("step-sequence"));
  assert.ok(prompt.includes("takeaway"));
  assert.ok(prompt.includes("indian-english-female"));
  assert.ok(prompt.includes("indian-english-male"));
  assert.ok(prompt.includes("60 to 90 second"));
  assert.ok(prompt.includes("1080x1920"));
});

test("buildPlannerUserPrompt includes topic and optional notes", () => {
  const promptWithoutNotes = buildPlannerUserPrompt("Photosynthesis");
  assert.ok(promptWithoutNotes.includes("Photosynthesis"));
  assert.ok(!promptWithoutNotes.includes("Reference Notes"));

  const promptWithNotes = buildPlannerUserPrompt("Photosynthesis", "Focus on chlorophyll and sunlight.");
  assert.ok(promptWithNotes.includes("Photosynthesis"));
  assert.ok(promptWithNotes.includes("Reference Notes:"));
  assert.ok(promptWithNotes.includes("Focus on chlorophyll and sunlight."));
});

test("generateStoryboardWithGemini rejects empty API key or model without network calls", async () => {
  await assert.rejects(
    () => generateStoryboardWithGemini({ topic: "Test", apiKey: "", model: "gemini-3.8-flash" }),
    /GEMINI_API_KEY is missing or empty/
  );

  await assert.rejects(
    () => generateStoryboardWithGemini({ topic: "Test", apiKey: "valid-key", model: "" }),
    /GEMINI_MODEL is missing or empty/
  );
});

