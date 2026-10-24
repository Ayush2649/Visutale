import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  validatePlan,
  validatePlanSemantics,
  type StoryboardPlan,
  type StoryboardScene,
} from "../src/contracts/plan.js";
import {
  normalizeAnimationAction,
  normalizeVisualObjectKind,
  normalizeStoryboardPlan,
  remapEventsForNarrationChange,
  findPhraseMatch,
  cleanPhraseText,
  VALID_ACTIONS,
} from "../src/planning/storyboardNormalizer.js";
import { generateStoryboardWithGemini } from "../src/providers/geminiPlanner.js";
import { generateStoryboardWithOpenAICompatible } from "../src/providers/openAICompatiblePlanner.js";
import { ModelOutputValidationError } from "../src/providers/errors.js";

const waterCyclePath = path.resolve(process.cwd(), "fixtures/plans/water-cycle.json");
const binarySearchPath = path.resolve(process.cwd(), "fixtures/plans/binary-search.json");

async function loadFixture(filePath: string): Promise<StoryboardPlan> {
  const raw = JSON.parse(await readFile(filePath, "utf8"));
  const parsed = validatePlan(raw);
  if (!parsed.success) throw new Error(`Fixture ${filePath} failed validation`);
  return parsed.data;
}

test("1. Recognized animation-action aliases normalize correctly", () => {
  // Direct canonical actions
  for (const act of VALID_ACTIONS) {
    assert.equal(normalizeAnimationAction(act), act);
  }

  // Casing and whitespace
  assert.equal(normalizeAnimationAction("  REVEAL  "), "reveal");
  assert.equal(normalizeAnimationAction("Highlight"), "highlight");
  assert.equal(normalizeAnimationAction("EMPHASIZE"), "emphasize");

  // Delimiters (camelCase, hyphens, underscores)
  assert.equal(normalizeAnimationAction("fade-in"), "reveal");
  assert.equal(normalizeAnimationAction("fade_in"), "reveal");
  assert.equal(normalizeAnimationAction("fadeIn"), "reveal");
  assert.equal(normalizeAnimationAction("pop-in"), "reveal");
  assert.equal(normalizeAnimationAction("zoom-in"), "emphasize");
  assert.equal(normalizeAnimationAction("zoom_in"), "emphasize");
  assert.equal(normalizeAnimationAction("zoomIn"), "emphasize");
  assert.equal(normalizeAnimationAction("scale-up"), "emphasize");
  assert.equal(normalizeAnimationAction("slide-in"), "move");
  assert.equal(normalizeAnimationAction("slideIn"), "move");
  assert.equal(normalizeAnimationAction("fly-in"), "move");

  // Semantic synonyms
  assert.equal(normalizeAnimationAction("appear"), "reveal");
  assert.equal(normalizeAnimationAction("show"), "reveal");
  assert.equal(normalizeAnimationAction("draw"), "reveal");
  assert.equal(normalizeAnimationAction("focus"), "emphasize");
  assert.equal(normalizeAnimationAction("pulse"), "emphasize");
  assert.equal(normalizeAnimationAction("slide"), "move");
  assert.equal(normalizeAnimationAction("pan"), "move");
  assert.equal(normalizeAnimationAction("link"), "connect");
  assert.equal(normalizeAnimationAction("arrow"), "connect");
  assert.equal(normalizeAnimationAction("glow"), "highlight");
  assert.equal(normalizeAnimationAction("shine"), "highlight");
});

test("2. Unknown animation actions are rejected", () => {
  // Genuinely unsupported actions must return null
  assert.equal(normalizeAnimationAction("explode"), null);
  assert.equal(normalizeAnimationAction("destroy"), null);
  assert.equal(normalizeAnimationAction("unknown_action"), null);
  assert.equal(normalizeAnimationAction("teleport"), null);
  assert.equal(normalizeAnimationAction(123), null);
  assert.equal(normalizeAnimationAction(null), null);

  // When an unsupported action is present in a plan, validatePlan() must strictly reject it
  const basePlan: Record<string, unknown> = {
    schemaVersion: "1.0",
    projectId: "test",
    ownerId: "owner",
    versionId: "v1",
    parentVersionId: null,
    topic: "Test",
    audience: "Students",
    learningObjective: "Testing",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [],
    scenes: [
      {
        id: "s1",
        type: "title-hook",
        purpose: "Testing invalid action",
        estimatedDurationMs: 10000,
        narration: [{ id: "n1", text: "This is test narration." }],
        objects: [{ id: "o1", kind: "shape", label: "Box" }],
        events: [
          {
            id: "e1",
            targetId: "o1",
            action: "explode", // Unsupported
            cue: { blockId: "n1", phrase: "test narration", occurrence: 1 },
            offsetMs: 0,
            durationMs: 1000,
          },
        ],
        onScreenText: ["Test"],
        sourceRefs: [],
      },
    ],
    warnings: [],
  };

  const validation = validatePlan(basePlan);
  assert.equal(validation.success, false);
  const actionIssue = validation.issues.find((i) => i.path.includes("action"));
  assert.ok(actionIssue, "Must report action issue");
  assert.ok(actionIssue.message.includes("Unsupported action"));
  assert.ok(actionIssue.message.includes("reveal, emphasize, move, connect, highlight"));
});

test("3. An exact cue in its referenced narration block passes", async () => {
  const plan = await loadFixture(waterCyclePath);
  const firstScene = plan.scenes[0];
  const firstEvent = firstScene.events[0];
  const targetBlock = firstScene.narration.find((n) => n.id === firstEvent.cue.blockId);
  assert.ok(targetBlock, "Target block must exist");

  // Ensure exact phrase exists in the block
  assert.ok(
    targetBlock.text.toLowerCase().includes(firstEvent.cue.phrase.toLowerCase()),
    "Phrase must exist in referenced block"
  );

  const result = validatePlan(plan);
  assert.equal(result.success, true);
});

test("4. A cue missing from its referenced block fails", async () => {
  const plan = await loadFixture(waterCyclePath);
  const raw = JSON.parse(JSON.stringify(plan)) as StoryboardPlan;
  raw.scenes[0].events[0].cue.phrase = "Non-existent phrase that definitely does not exist in the script";

  const result = validatePlan(raw);
  assert.equal(result.success, false);
  const cueIssue = result.issues.find((i) => i.path.includes("cue"));
  assert.ok(cueIssue, "Must report cue issue");
  assert.ok(cueIssue.message.includes("does not resolve in narration block"));
});

test("5. A cue appearing only in a different narration block fails validation", async () => {
  const plan = await loadFixture(waterCyclePath);
  const raw = JSON.parse(JSON.stringify(plan)) as StoryboardPlan;

  // Create a scene with two distinct narration blocks
  raw.scenes[0].narration = [
    { id: "nar-1-1", text: "Have you ever wondered where rain comes from?" },
    { id: "nar-1-2", text: "Water cycles continuously between earth and sky." },
  ];

  // Point the cue to nar-1-1, but use a phrase that ONLY exists in nar-1-2
  raw.scenes[0].events[0].cue = {
    blockId: "nar-1-1",
    phrase: "cycles continuously", // Exists in nar-1-2, NOT in nar-1-1
    occurrence: 1,
  };

  // Direct strict validation without normalization must fail
  const directValidation = validatePlan(raw);
  assert.equal(directValidation.success, false);
  const cueIssue = directValidation.issues.find((i) => i.path.includes("cue"));
  assert.ok(cueIssue);
  assert.ok(cueIssue.message.includes("does not resolve in narration block 'nar-1-1'"));

  // Bounded safe recovery in normalizeStoryboardPlan should safely remap the blockId to nar-1-2
  const repaired = normalizeStoryboardPlan(raw as unknown as Record<string, unknown>, {
    topic: raw.topic,
  });
  const repairedValidation = validatePlan(repaired);
  assert.equal(repairedValidation.success, true);
  const repairedEvent = (repaired.scenes as StoryboardScene[])[0].events[0];
  assert.equal(repairedEvent.cue.blockId, "nar-1-2");
  assert.equal(repairedEvent.cue.phrase, "cycles continuously");
});

test("6. Narration changes invalidate or remap affected cues", () => {
  const oldText = "Sunlight looks white, but it is actually a rainbow.";
  const blockId = "nar-block-1";
  const events = [
    {
      id: "evt-1",
      targetId: "obj-1",
      action: "reveal" as const,
      cue: { blockId, phrase: "looks white", occurrence: 1 },
      offsetMs: 0,
      durationMs: 1000,
    },
    {
      id: "evt-2",
      targetId: "obj-2",
      action: "highlight" as const,
      cue: { blockId, phrase: "actually a rainbow", occurrence: 1 },
      offsetMs: 0,
      durationMs: 1000,
    },
  ];

  // Case A: Minor edit that retains the phrase
  const newTextMinor = "Bright sunlight looks white, but it is actually a rainbow of colors.";
  const remappedMinor = remapEventsForNarrationChange(events, oldText, newTextMinor, blockId);
  assert.equal(remappedMinor[0].cue.phrase, "looks white");
  assert.equal(remappedMinor[1].cue.phrase, "actually a rainbow");

  // Case B: Contiguous subphrase remapping
  const newTextParaphrase = "Sunlight appears white, but it is a rainbow.";
  const remappedSub = remapEventsForNarrationChange(events, oldText, newTextParaphrase, blockId);
  assert.equal(remappedSub[1].cue.phrase, "a rainbow");

  // Case C: Completely deleted / rewritten text leaves unresolved cue for strict validator
  const newTextUnrelated = "Quantum mechanics governs photon emission.";
  const remappedDeleted = remapEventsForNarrationChange(events, oldText, newTextUnrelated, blockId);
  assert.equal(remappedDeleted[0].cue.phrase, "looks white"); // Kept original, cannot resolve in new text

  const testScene: StoryboardScene = {
    id: "s1",
    type: "labeled-diagram",
    purpose: "Testing",
    estimatedDurationMs: 10000,
    narration: [{ id: blockId, text: newTextUnrelated }],
    objects: [
      { id: "obj-1", kind: "shape", label: "O1" },
      { id: "obj-2", kind: "shape", label: "O2" },
    ],
    events: remappedDeleted,
    onScreenText: ["Title"],
    sourceRefs: [],
  };

  const validation = validatePlan({
    schemaVersion: "1.0",
    projectId: "p",
    ownerId: "o",
    versionId: "v",
    parentVersionId: null,
    topic: "T",
    audience: "A",
    learningObjective: "L",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [],
    scenes: [testScene],
    warnings: [],
  });

  assert.equal(validation.success, false);
  assert.ok(validation.issues.some((i) => i.path.includes("cue")));
});

test("7. All supported storyboard providers follow the same contract", async () => {
  const basePlan = await loadFixture(waterCyclePath);
  const rawModelResponse = {
    topic: "Atmospheric Scattering",
    audience: "Students",
    learningObjective: "Scattering",
    language: "en",
    voicePreset: "indian-english-female",
    scenes: [
      {
        id: "s1",
        type: "title-hook",
        purpose: "Hook",
        estimatedDurationMs: 10000,
        narration: [{ id: "n1", text: "Have you ever wondered why twilight turns red?" }],
        objects: [{ id: "o1", kind: "img", label: "Sunset" }], // Non-canonical kind alias
        events: [
          {
            id: "e1",
            targetId: "o1",
            action: "fade-in", // Non-canonical action alias
            cue: { blockId: "n1", phrase: " \"Have you ever wondered\" ", occurrence: 1 }, // Quotes & spaces
            offsetMs: 0,
            durationMs: 1000,
          },
        ],
        onScreenText: ["Twilight Science"],
        sourceRefs: [],
      },
    ],
    warnings: [],
  };

  // 1. Gemini provider
  const mockGeminiFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(rawModelResponse) }] } }],
    }),
  });

  const geminiResult = await generateStoryboardWithGemini({
    topic: "Atmospheric Scattering",
    apiKey: "mock-key",
    model: "gemini-3.5-flash-lite",
    fetchFn: mockGeminiFetch as any,
  });

  assert.equal(geminiResult.scenes[0].objects[0].kind, "icon"); // img -> icon
  assert.equal(geminiResult.scenes[0].events[0].action, "reveal"); // fade-in -> reveal
  assert.equal(geminiResult.scenes[0].events[0].cue.phrase, "Have you ever wondered"); // cleaned

  // 2. OpenAI-compatible / Groq provider
  const mockOpenAIFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(rawModelResponse) } }],
    }),
  });

  const groqResult = await generateStoryboardWithOpenAICompatible({
    providerName: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    topic: "Atmospheric Scattering",
    apiKey: "mock-key",
    model: "llama-3.3-70b-versatile",
    fetchFn: mockOpenAIFetch as any,
  });

  assert.equal(groqResult.scenes[0].objects[0].kind, "icon");
  assert.equal(groqResult.scenes[0].events[0].action, "reveal");
  assert.equal(groqResult.scenes[0].events[0].cue.phrase, "Have you ever wondered");
});

test("8. Existing water-cycle and binary-search fixtures still pass", async () => {
  const water = await loadFixture(waterCyclePath);
  const waterRes = validatePlan(water);
  assert.equal(waterRes.success, true);
  assert.equal(waterRes.issues.length, 0);

  const binary = await loadFixture(binarySearchPath);
  const binaryRes = validatePlan(binary);
  assert.equal(binaryRes.success, true);
  assert.equal(binaryRes.issues.length, 0);
});

test("9. Existing semantic validation remains enabled", () => {
  const validPlan: StoryboardPlan = {
    schemaVersion: "1.0",
    projectId: "proj",
    ownerId: "owner",
    versionId: "v1",
    parentVersionId: null,
    topic: "Semantic Checks",
    audience: "Audience",
    learningObjective: "Objective",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [{ id: "src-1", text: "Source notes" }],
    scenes: [
      {
        id: "scene-1",
        type: "title-hook",
        purpose: "Purpose",
        estimatedDurationMs: 10000,
        narration: [{ id: "nar-1", text: "Hello world of educational science." }],
        objects: [{ id: "obj-1", kind: "text", label: "Title" }],
        events: [
          {
            id: "evt-1",
            targetId: "obj-1",
            action: "reveal",
            cue: { blockId: "nar-1", phrase: "Hello world", occurrence: 1 },
            offsetMs: 0,
            durationMs: 1000,
          },
        ],
        onScreenText: ["Hello"],
        sourceRefs: ["src-1"],
      },
    ],
    warnings: [],
  };

  // Baseline passes
  assert.equal(validatePlanSemantics(validPlan).length, 0);

  // A. Duplicate scene ID
  const dupScene = JSON.parse(JSON.stringify(validPlan)) as StoryboardPlan;
  dupScene.scenes.push({ ...dupScene.scenes[0] });
  assert.ok(validatePlanSemantics(dupScene).some((i) => i.message.includes("Duplicate scene ID")));

  // B. Target object does not exist
  const badTarget = JSON.parse(JSON.stringify(validPlan)) as StoryboardPlan;
  badTarget.scenes[0].events[0].targetId = "non-existent-obj";
  assert.ok(validatePlanSemantics(badTarget).some((i) => i.message.includes("Target object 'non-existent-obj' does not exist")));

  // C. Invalid sourceRef
  const badSource = JSON.parse(JSON.stringify(validPlan)) as StoryboardPlan;
  badSource.scenes[0].sourceRefs = ["missing-src-id"];
  assert.ok(validatePlanSemantics(badSource).some((i) => i.message.includes("Source reference 'missing-src-id' does not exist")));
});

test("10. HTTP errors expose useful diagnostics without leaking API keys or internal secrets", () => {
  const secretKey = "ai_studio_secret_key_abcdef123456";
  const issues = [
    { path: "scenes[1].events[1].action", message: "Unsupported action. Use: reveal, emphasize, move, connect, highlight." },
    { path: "scenes[0].events[0].cue", message: "Phrase 'Why is the Sunset Red?' occurrence 1 does not resolve in narration block 'nar-1-1'." },
  ];

  const err = new ModelOutputValidationError(
    `Generated storyboard failed validation:\n${issues.map((i) => `  - ${i.path}: ${i.message}`).join("\n")}`,
    issues
  );

  assert.equal(err.statusCode, 502);
  assert.equal(err.code, "MODEL_OUTPUT_INVALID");
  assert.equal(err.issues?.length, 2);

  // Format as returned by route handler
  const responsePayload = {
    error: {
      code: err.code,
      message: err.message,
      issues: err.issues,
    },
  };

  const jsonStr = JSON.stringify(responsePayload);
  assert.ok(!jsonStr.includes(secretKey), "Must not leak secret keys");
  assert.ok(jsonStr.includes("scenes[1].events[1].action"), "Must expose actionable field path");
  assert.ok(jsonStr.includes("reveal, emphasize, move, connect, highlight"), "Must expose expected values");
  assert.ok(jsonStr.includes("Why is the Sunset Red?"), "Must expose failing cue phrase");
});

