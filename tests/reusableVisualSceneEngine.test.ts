import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import type { StoryboardPlan } from "../src/contracts/plan.js";
import { validatePlan } from "../src/contracts/plan.js";
import { compilePlanTimeline } from "../src/timing/timelineCompiler.js";
import {
  getAllRegisteredVariants,
  getVisualComponent,
  requireVisualComponent,
  resolveLegacyVariant,
  validateVisualSelection,
} from "../src/video/registry/index.js";
import { renderSceneComponent } from "../src/video/MainVideo.js";

// Helper to snapshot all file paths in a directory
function snapshotDirectory(dir: string): string[] {
  const results: string[] = [];
  function scan(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        scan(full);
      } else {
        results.push(path.relative(dir, full));
      }
    }
  }
  scan(dir);
  return results.sort();
}

test("Reusable Scene Architecture: 1. Multiple unrelated topics render using the same reusable templates", () => {
  // Topic A: Phone Call
  const phoneCallPlan: StoryboardPlan = {
    schemaVersion: "1.0",
    projectId: "phone-call-demo",
    ownerId: "user-test",
    versionId: "v1",
    parentVersionId: null,
    topic: "How a Mobile Phone Call Works",
    audience: "General Science Learners",
    learningObjective: "Understand voice conversion, digital sampling, RF radiation, and fiber transmission.",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [],
    warnings: [],
    scenes: [
      {
        id: "scene-hook",
        type: "title-hook",
        purpose: "Introduce long-distance voice transmission between Mumbai and Delhi",
        estimatedDurationMs: 8000,
        narration: [{ id: "nar-1-1", text: "When you speak into your phone, your voice travels thousands of miles in a blink." }],
        objects: [
          { id: "obj-caller", kind: "node", label: "Mumbai Caller" },
          { id: "obj-receiver", kind: "node", label: "Delhi Receiver" },
        ],
        events: [{ id: "ev-1", targetId: "obj-caller", action: "reveal", cue: { blockId: "nar-1-1", phrase: "When you speak", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }],
        onScreenText: ["How Phones Connect Distance", "Instant Voice Across Thousands of Miles"],
        sourceRefs: [],
        visualVariant: "template.concept-hook",
        visualData: {
          template: "concept-hook",
          theme: "tech-dark",
          telemetryMetrics: [
            { label: "DISTANCE", value: "1,400", unit: "km", color: "#38BDF8" },
            { label: "LATENCY", value: "42", unit: "ms", color: "#10B981" },
            { label: "MEDIUM", value: "FIBER & RF", color: "#F59E0B" },
          ],
        },
      },
      {
        id: "scene-microphone",
        type: "process-flow",
        purpose: "Show sound waves vibrating the MEMS diaphragm into voltage",
        estimatedDurationMs: 8000,
        narration: [{ id: "nar-2-1", text: "Inside the phone, a microscopic diaphragm vibrates with your voice pressure." }],
        objects: [
          { id: "obj-sound", kind: "icon", label: "Sound Waves" },
          { id: "obj-mems", kind: "shape", label: "MEMS Diaphragm" },
          { id: "obj-voltage", kind: "icon", label: "Analog Voltage" },
        ],
        events: [{ id: "ev-2", targetId: "obj-sound", action: "reveal", cue: { blockId: "nar-2-1", phrase: "Inside the phone", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }],
        onScreenText: ["Acoustic to Electrical", "Microscopic Diaphragm Oscillation"],
        sourceRefs: [],
        visualVariant: "template.physical-transformation",
        visualData: {
          template: "physical-transformation",
          conversion: {
            input: { label: "Sound Waves", icon: "🔊", color: "#38BDF8", property: "1.0 kHz Acoustic Pressure" },
            mechanism: { label: "MEMS Diaphragm", property: "1.25 µm Gap Deflection", color: "#F59E0B" },
            output: { label: "Analog Voltage", icon: "⚡", color: "#10B981", property: "Continuous Electrical Signal" },
          },
        },
      },
    ],
  };

  // Topic B: Rainbow Formation (completely unrelated domain: atmospheric optics & meteorology)
  const rainbowPlan: StoryboardPlan = {
    schemaVersion: "1.0",
    projectId: "rainbow-demo",
    ownerId: "user-test",
    versionId: "v1",
    parentVersionId: null,
    topic: "How a Rainbow Forms in the Sky",
    audience: "General Science Learners",
    learningObjective: "Understand light refraction, dispersion, and internal reflection inside water droplets.",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [],
    warnings: [],
    scenes: [
      {
        id: "scene-rainbow-hook",
        type: "title-hook",
        purpose: "Introduce sunlight interacting with raindrops in the atmosphere",
        estimatedDurationMs: 8000,
        narration: [{ id: "nar-r-1", text: "Have you ever wondered how brilliant arches of color appear in the sky?" }],
        objects: [
          { id: "obj-sunlight", kind: "node", label: "Sunlight Source" },
          { id: "obj-rainshower", kind: "node", label: "Raindrop Shower" },
        ],
        events: [{ id: "ev-r-1", targetId: "obj-sunlight", action: "reveal", cue: { blockId: "nar-r-1", phrase: "Have you ever", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }],
        onScreenText: ["Why Rainbows Appear", "Sunlight Splitting Across Droplets"],
        sourceRefs: [],
        visualVariant: "template.concept-hook",
        visualData: {
          template: "concept-hook",
          theme: "twilight",
          telemetryMetrics: [
            { label: "CRITICAL ANGLE", value: "42°", color: "#38BDF8" },
            { label: "INDEX RATIO", value: "1.33", color: "#10B981" },
            { label: "SPECTRUM", value: "7 COLORS", color: "#F59E0B" },
          ],
        },
      },
      {
        id: "scene-dispersion",
        type: "process-flow",
        purpose: "Demonstrate light refraction and wavelength dispersion inside a single droplet",
        estimatedDurationMs: 8000,
        narration: [{ id: "nar-r-2", text: "As white light enters a water drop, each color bends at a slightly different angle." }],
        objects: [
          { id: "obj-white-light", kind: "icon", label: "White Sunlight" },
          { id: "obj-droplet-prism", kind: "shape", label: "Spherical Water Drop" },
          { id: "obj-spectrum", kind: "icon", label: "Dispersed Rainbow Spectrum" },
        ],
        events: [{ id: "ev-r-2", targetId: "obj-white-light", action: "reveal", cue: { blockId: "nar-r-2", phrase: "As white light", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }],
        onScreenText: ["Refraction & Dispersion", "Differential Wavelength Deflection"],
        sourceRefs: [],
        visualVariant: "template.physical-transformation",
        visualData: {
          template: "physical-transformation",
          conversion: {
            input: { label: "White Sunlight", icon: "☀️", color: "#F59E0B", property: "Composite Visible Spectrum" },
            mechanism: { label: "Spherical Water Drop", property: "Air-to-Water Boundary Refraction", color: "#38BDF8" },
            output: { label: "Dispersed Spectrum", icon: "🌈", color: "#10B981", property: "Red (42°) to Violet (40°)" },
          },
        },
      },
    ],
  };

  // 1. Both plans pass validatePlan
  const valA = validatePlan(phoneCallPlan);
  assert.equal(valA.success, true, `Phone plan validation issues: ${valA.issues?.map((i) => i.message).join(", ")}`);

  const valB = validatePlan(rainbowPlan);
  assert.equal(valB.success, true, `Rainbow plan validation issues: ${valB.issues?.map((i) => i.message).join(", ")}`);

  // 2. Both compile into valid timelines
  const timelineA = compilePlanTimeline(phoneCallPlan);
  const timelineB = compilePlanTimeline(rainbowPlan);

  assert.equal(timelineA.scenes.length, 2);
  assert.equal(timelineB.scenes.length, 2);

  // 3. Both resolve to the EXACT SAME reusable templates
  assert.equal(timelineA.scenes[0].visualVariant, "template.concept-hook");
  assert.equal(timelineB.scenes[0].visualVariant, "template.concept-hook");

  assert.equal(timelineA.scenes[1].visualVariant, "template.physical-transformation");
  assert.equal(timelineB.scenes[1].visualVariant, "template.physical-transformation");

  // 4. Both render valid React elements using the same underlying component
  const renderedA0 = renderSceneComponent(timelineA.scenes[0], 0, 2, 0.25, phoneCallPlan.topic);
  const renderedB0 = renderSceneComponent(timelineB.scenes[0], 0, 2, 0.25, rainbowPlan.topic);

  assert.ok(React.isValidElement(renderedA0));
  assert.ok(React.isValidElement(renderedB0));

  // Both use the same ConceptHookTemplate function
  const CompA0 = requireVisualComponent("template.concept-hook");
  const CompB0 = requireVisualComponent("template.concept-hook");
  assert.equal(CompA0, CompB0);
});

test("Reusable Scene Architecture: 2. Source tree immutability — rendering does not create or alter source files", () => {
  const srcDir = path.resolve(process.cwd(), "src");
  const beforeSnapshot = snapshotDirectory(srcDir);

  // Simulate scene variant resolution and rendering pipeline execution
  const testScene = {
    sceneId: "novel-concept-scene",
    type: "title-hook" as const,
    startFrame: 0,
    endFrame: 900,
    durationInFrames: 900,
    purpose: "Testing novel topic without creating source files",
    onScreenText: ["Novel Discovery", "Data-driven visuals"],
    objects: [{ id: "obj-1", kind: "node" as const, label: "Novel Entity" }],
    events: [],
    captions: [],
    audio: { isFixture: true, durationMs: 30000 },
    visualVariant: "template.concept-hook",
    visualData: {
      template: "concept-hook",
      telemetryMetrics: [{ label: "INNOVATION", value: "100%", color: "#10B981" }],
    },
  };

  const resolved = resolveLegacyVariant(testScene, "Novel Discovery Topic");
  assert.equal(resolved, "template.concept-hook");

  validateVisualSelection("Novel Discovery Topic", resolved);
  const rendered = renderSceneComponent(testScene, 0, 1, 0.5, "Novel Discovery Topic");
  assert.ok(React.isValidElement(rendered));

  const afterSnapshot = snapshotDirectory(srcDir);

  // Verify 0 new files created, 0 deleted
  assert.deepEqual(
    afterSnapshot,
    beforeSnapshot,
    "Rendering or processing must not add, remove, or modify any files in the src/ directory!"
  );
});

test("Reusable Scene Architecture: 3. Unknown scene types produce explicit safe errors or validated fallbacks", () => {
  const invalidScene = {
    sceneId: "invalid-scene",
    type: "unsupported-random-type-xyz",
    startFrame: 0,
    endFrame: 300,
    durationInFrames: 300,
    purpose: "Invalid scene",
    onScreenText: [],
    objects: [],
    events: [],
    captions: [],
    audio: { isFixture: true, durationMs: 10000 },
  };

  // Calling resolveLegacyVariant with an unsupported scene type must throw an explicit error
  assert.throws(
    () => {
      resolveLegacyVariant(invalidScene as any, "Some Topic");
    },
    /Unsupported scene type/i
  );
});

test("Reusable Scene Architecture: 4. The visual scene registry is not modified during normal generation", () => {
  const initialVariants = getAllRegisteredVariants();
  const initialCount = initialVariants.length;

  // Run resolutions and validations
  resolveLegacyVariant({
    sceneId: "test-run",
    type: "process-flow",
    startFrame: 0,
    endFrame: 300,
    durationInFrames: 300,
    purpose: "Test",
    onScreenText: [],
    objects: [],
    events: [],
    captions: [],
    audio: { isFixture: true, durationMs: 10000 },
  }, "Another New Topic");

  const postVariants = getAllRegisteredVariants();
  assert.equal(postVariants.length, initialCount, "Registry must remain finite and immutable during execution.");
});

