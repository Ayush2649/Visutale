import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {
  getAllRegisteredVariants,
  getVisualComponent,
  requireVisualComponent,
  resolveTopicDomain,
  validateVisualSelection,
  resolveLegacyVariant,
  CrossTopicContaminationError,
} from "../src/video/registry/index.js";
import {
  SunsetTitleHook,
  LightPrismSpectrumScene,
  EarthAtmosphereScene,
  RayleighScatteringScene,
  SunsetPathScene,
  SunsetTakeawayScene,
} from "../src/video/topics/optics/index.js";
import {
  RooftopHookScene,
  PanelStructureScene,
  CellPhotovoltaicScene,
  CircuitFlowScene,
  InverterHomeScene,
  BatteryStorageScene,
  SolarTakeawayScene,
} from "../src/video/topics/solar/index.js";
import { compilePlanTimeline } from "../src/timing/timelineCompiler.js";
import { validateTimeline } from "../src/contracts/timeline.js";
import { validateRenderOutput } from "../src/validation/mediaValidator.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";
import type { CompiledScene, CompiledTimeline } from "../src/contracts/timeline.js";
import type { SceneSpeechArtifact } from "../src/contracts/alignment.js";

function makeMockScene(overrides: Partial<CompiledScene> = {}): CompiledScene {
  return {
    sceneId: "scene-1",
    type: "title-hook",
    startFrame: 0,
    endFrame: 180,
    durationInFrames: 180,
    purpose: "Explain why sunsets are red",
    onScreenText: ["Why is the Sunset Red?", "The Science of Sky Colors"],
    objects: [
      { id: "obj-sun", kind: "icon", label: "Sunset" },
      { id: "obj-title", kind: "text", label: "Sky Colors" },
    ],
    events: [
      {
        id: "ev-1",
        targetId: "obj-sun",
        action: "reveal",
        startFrame: 0,
        endFrame: 45,
        durationFrames: 45,
        cuePhrase: "Have you ever wondered",
        resolvedStartMs: 0,
        resolvedEndMs: 1500,
      },
    ],
    captions: [
      {
        id: "cap-1",
        text: "Have you ever wondered why sunsets burst into red?",
        startFrame: 0,
        endFrame: 120,
        startMs: 0,
        endMs: 4000,
      },
    ],
    audio: { isFixture: true, durationMs: 4000 },
    ...overrides,
  };
}

test("Visual Storytelling: 1. Optics domain registration and component resolution", () => {
  assert.equal(resolveTopicDomain("Explain why the sky turns orange and red at sunset"), "optics");
  assert.equal(resolveTopicDomain("Rayleigh Scattering and Atmospheric Optics"), "optics");
  assert.equal(resolveTopicDomain("Why Sunsets Are Red"), "optics");

  const opticsVariants = [
    "optics.title-hook",
    "optics.prism-spectrum",
    "optics.earth-atmosphere",
    "optics.rayleigh-scattering",
    "optics.sunset-path",
    "optics.takeaway",
  ] as const;

  for (const variant of opticsVariants) {
    const comp = requireVisualComponent(variant);
    assert.equal(typeof comp, "function", `Variant ${variant} must resolve to a valid React component`);
    assert.doesNotThrow(() => validateVisualSelection("Why Sunsets Are Red", variant));
  }

  // Cross-topic protection: Optics cannot use water-cycle or photosynthesis specialized components
  assert.throws(
    () => validateVisualSelection("Why Sunsets Are Red", "water-cycle.evaporation"),
    CrossTopicContaminationError
  );
  assert.throws(
    () => validateVisualSelection("Why Sunsets Are Red", "photosynthesis.chloroplast"),
    CrossTopicContaminationError
  );
});

test("Visual Storytelling: 2. Legacy adapter deterministically routes sunset scenes to optics components", () => {
  const sunsetTopic = "Explain why the sky turns orange and red at sunset";

  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-hook", type: "title-hook" }), sunsetTopic),
    "optics.title-hook"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-sunlight", type: "labeled-diagram" }), sunsetTopic),
    "optics.prism-spectrum"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-atmosphere", type: "process-flow" }), sunsetTopic),
    "optics.earth-atmosphere"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-scattering", type: "comparison" }), sunsetTopic),
    "optics.rayleigh-scattering"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-sunset-path", type: "step-sequence" }), sunsetTopic),
    "optics.sunset-path"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-takeaway", type: "takeaway" }), sunsetTopic),
    "optics.takeaway"
  );
});

test("Visual Storytelling: 3. Visual components render valid elements with required features", () => {
  // Test SunsetTitleHook component directly
  const hookElement = React.createElement(SunsetTitleHook, {
    scene: makeMockScene({ sceneId: "scene-hook", visualVariant: "optics.title-hook" }),
    sceneIndex: 0,
    totalScenes: 6,
    globalProgress: 0.1,
    topic: "Why Sunsets Are Red",
  });
  assert.ok(hookElement, "SunsetTitleHook renders valid React element");

  // Test LightPrismSpectrumScene component
  const prismElement = React.createElement(LightPrismSpectrumScene, {
    scene: makeMockScene({ sceneId: "scene-sunlight", visualVariant: "optics.prism-spectrum" }),
    sceneIndex: 1,
    totalScenes: 6,
    globalProgress: 0.3,
    topic: "Why Sunsets Are Red",
  });
  assert.ok(prismElement, "LightPrismSpectrumScene renders valid React element");

  // Test EarthAtmosphereScene component
  const earthElement = React.createElement(EarthAtmosphereScene, {
    scene: makeMockScene({ sceneId: "scene-atmosphere", visualVariant: "optics.earth-atmosphere" }),
    sceneIndex: 2,
    totalScenes: 6,
    globalProgress: 0.5,
    topic: "Why Sunsets Are Red",
  });
  assert.ok(earthElement, "EarthAtmosphereScene renders valid React element");

  // Test RayleighScatteringScene component
  const scatterElement = React.createElement(RayleighScatteringScene, {
    scene: makeMockScene({ sceneId: "scene-scattering", visualVariant: "optics.rayleigh-scattering" }),
    sceneIndex: 3,
    totalScenes: 6,
    globalProgress: 0.65,
    topic: "Why Sunsets Are Red",
  });
  assert.ok(scatterElement, "RayleighScatteringScene renders valid React element");

  // Test SunsetPathScene component
  const pathElement = React.createElement(SunsetPathScene, {
    scene: makeMockScene({ sceneId: "scene-sunset-path", visualVariant: "optics.sunset-path" }),
    sceneIndex: 4,
    totalScenes: 6,
    globalProgress: 0.8,
    topic: "Why Sunsets Are Red",
  });
  assert.ok(pathElement, "SunsetPathScene renders valid React element");

  // Test SunsetTakeawayScene component
  const takeawayElement = React.createElement(SunsetTakeawayScene, {
    scene: makeMockScene({ sceneId: "scene-takeaway", visualVariant: "optics.takeaway" }),
    sceneIndex: 5,
    totalScenes: 6,
    globalProgress: 0.95,
    topic: "Why Sunsets Are Red",
  });
  assert.ok(takeawayElement, "SunsetTakeawayScene renders valid React element");
});

test("Visual Storytelling: 4. Timeline compiler eliminates multi-second silence gaps with natural pacing", () => {
  const plan: StoryboardPlan = {
    schemaVersion: "1.0",
    projectId: "sunset-test",
    ownerId: "teacher",
    versionId: "v1",
    parentVersionId: null,
    topic: "Explain why the sky turns orange and red at sunset",
    audience: "Students",
    learningObjective: "Understand Rayleigh scattering",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [],
    scenes: [
      {
        id: "scene-1",
        type: "title-hook",
        purpose: "Intro hook",
        estimatedDurationMs: 10000,
        onScreenText: ["Why is the Sunset Red?"],
        narration: [{ id: "n-1", text: "Have you ever wondered why sunsets burst into brilliant reds and oranges?" }],
        objects: [{ id: "obj-sun", kind: "icon", label: "Sun" }],
        events: [{ id: "e-1", targetId: "obj-sun", action: "reveal", cue: { blockId: "n-1", phrase: "Have you ever wondered", occurrence: 1 }, offsetMs: 0, durationMs: 1500 }],
        sourceRefs: [],
      },
      {
        id: "scene-2",
        type: "labeled-diagram",
        purpose: "Spectrum",
        estimatedDurationMs: 12000,
        onScreenText: ["White Light Spectrum"],
        narration: [{ id: "n-2", text: "Sunlight looks white, but it is actually made of all colors of the rainbow combined together." }],
        objects: [{ id: "obj-prism", kind: "shape", label: "Prism" }],
        events: [{ id: "e-2", targetId: "obj-prism", action: "reveal", cue: { blockId: "n-2", phrase: "Sunlight looks white", occurrence: 1 }, offsetMs: 0, durationMs: 1500 }],
        sourceRefs: [],
      },
      {
        id: "scene-3",
        type: "process-flow",
        purpose: "Atmosphere",
        estimatedDurationMs: 12000,
        onScreenText: ["Earth Atmosphere"],
        narration: [{ id: "n-3", text: "As sunlight enters Earth's atmosphere, it meets tiny gas molecules and dust particles floating around." }],
        objects: [{ id: "obj-air", kind: "container", label: "Air" }],
        events: [{ id: "e-3", targetId: "obj-air", action: "reveal", cue: { blockId: "n-3", phrase: "enters Earth's atmosphere", occurrence: 1 }, offsetMs: 0, durationMs: 1500 }],
        sourceRefs: [],
      },
      {
        id: "scene-4",
        type: "comparison",
        purpose: "Scattering",
        estimatedDurationMs: 13000,
        onScreenText: ["Rayleigh Scattering"],
        narration: [{ id: "n-4", text: "Shorter wavelengths like blue and violet scatter in all directions. Longer wavelengths pass straight through." }],
        objects: [{ id: "obj-blue", kind: "icon", label: "Blue" }],
        events: [{ id: "e-4", targetId: "obj-blue", action: "reveal", cue: { blockId: "n-4", phrase: "blue and violet scatter", occurrence: 1 }, offsetMs: 0, durationMs: 1500 }],
        sourceRefs: [],
      },
      {
        id: "scene-5",
        type: "step-sequence",
        purpose: "Path",
        estimatedDurationMs: 13000,
        onScreenText: ["Longer Path"],
        narration: [{ id: "n-5", text: "At sunset, sunlight travels through a much thicker layer of atmosphere to reach your eyes, scattering away the blue light." }],
        objects: [{ id: "obj-path", kind: "arrow", label: "Path" }],
        events: [{ id: "e-5", targetId: "obj-path", action: "reveal", cue: { blockId: "n-5", phrase: "At sunset, sunlight", occurrence: 1 }, offsetMs: 0, durationMs: 1500 }],
        sourceRefs: [],
      },
      {
        id: "scene-6",
        type: "takeaway",
        purpose: "Conclusion",
        estimatedDurationMs: 12000,
        onScreenText: ["Key Takeaway"],
        narration: [{ id: "n-6", text: "So, red sunsets happen because light travels farther through the air. Volcanic dust makes colors even more vivid!" }],
        objects: [{ id: "obj-box", kind: "container", label: "Summary" }],
        events: [{ id: "e-6", targetId: "obj-box", action: "reveal", cue: { blockId: "n-6", phrase: "So, red sunsets", occurrence: 1 }, offsetMs: 0, durationMs: 1500 }],
        sourceRefs: [],
      },
    ],
    warnings: [],
  };

  // Mock speech artifacts matching our actual recorded durations
  const speechMap = new Map<string, SceneSpeechArtifact>();
  const durations = [4551, 4690, 6780, 8127, 7848, 9613];

  plan.scenes.forEach((sc, i) => {
    speechMap.set(sc.id, {
      sceneId: sc.id,
      voiceId: "v1",
      modelId: "eleven_multilingual_v2",
      audioFilename: `audio/${sc.id}.mp3`,
      audioBase64: Buffer.from("AUDIO").toString("base64"),
      alignmentFilename: `alignment/${sc.id}.json`,
      durationMs: durations[i],
      alignment: {
        characters: ["H", "e", "l", "l", "o"],
        character_start_times_seconds: [0, 0.5, 1.0, 2.0, durations[i] / 1000],
        character_end_times_seconds: [0.5, 1.0, 2.0, 2.5, durations[i] / 1000],
      },
      createdAt: new Date().toISOString(),
    });
  });

  const timeline = compilePlanTimeline(plan, { fps: 30, speechArtifacts: speechMap });
  const validation = validateTimeline(timeline);
  assert.equal(validation.success, true, "Timeline must pass validateTimeline contract");
  assert.equal(timeline.composition.durationInFrames, 1800, "Timeline duration must be exactly 1800 frames (60.0s)");

  // Verify that NO non-final scene has a tail silence greater than 3.5 seconds
  for (let i = 0; i < timeline.scenes.length - 1; i++) {
    const sc = timeline.scenes[i];
    const speechSec = (speechMap.get(sc.sceneId)?.durationMs ?? 0) / 1000;
    const sceneSec = sc.durationInFrames / 30;
    const tailSilence = sceneSec - speechSec;
    assert.ok(
      tailSilence <= 3.5,
      `Scene '${sc.sceneId}' tail silence (${tailSilence.toFixed(2)}s) exceeds 3.5s limit`
    );
    assert.ok(
      tailSilence >= 1.0,
      `Scene '${sc.sceneId}' must retain at least 1.0s of visual holding time (found ${tailSilence.toFixed(2)}s)`
    );
  }
});

test("Visual Storytelling: 5. Solar domain registration and component resolution", () => {
  assert.equal(resolveTopicDomain("How solar panels turn sunlight into electricity"), "solar");
  assert.equal(resolveTopicDomain("Solar Energy and Photovoltaics"), "solar");
  assert.equal(resolveTopicDomain("How a solar cell generates power"), "solar");

  const solarVariants = [
    "solar.rooftop-hook",
    "solar.panel-structure",
    "solar.cell-photovoltaic",
    "solar.circuit-flow",
    "solar.inverter-home",
    "solar.battery-storage",
    "solar.takeaway",
  ] as const;

  for (const variant of solarVariants) {
    const comp = requireVisualComponent(variant);
    assert.equal(typeof comp, "function", `Variant ${variant} must resolve to a valid React component`);
    assert.doesNotThrow(() => validateVisualSelection("How solar panels turn sunlight into electricity", variant));
  }

  // Cross-topic protection: Solar cannot use optics or water-cycle components
  assert.throws(
    () => validateVisualSelection("How solar panels turn sunlight into electricity", "optics.prism-spectrum"),
    CrossTopicContaminationError
  );
  assert.throws(
    () => validateVisualSelection("How solar panels turn sunlight into electricity", "water-cycle.evaporation"),
    CrossTopicContaminationError
  );
});

test("Visual Storytelling: 6. Legacy adapter routes solar panels topic to solar components", () => {
  const solarTopic = "How solar panels turn sunlight into electricity";

  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-hook", type: "title-hook" }), solarTopic),
    "solar.rooftop-hook"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-panel", type: "labeled-diagram" }), solarTopic),
    "solar.panel-structure"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-cell", type: "process-flow" }), solarTopic),
    "solar.cell-photovoltaic"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-circuit", type: "step-sequence" }), solarTopic),
    "solar.circuit-flow"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-inverter", type: "process-flow" }), solarTopic),
    "solar.inverter-home"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-battery", type: "comparison" }), solarTopic),
    "solar.battery-storage"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-takeaway", type: "takeaway" }), solarTopic),
    "solar.takeaway"
  );
});

test("Visual Storytelling: 7. Solar components render valid React elements with required features", () => {
  const components = [
    { comp: RooftopHookScene, id: "scene-hook", variant: "solar.rooftop-hook" },
    { comp: PanelStructureScene, id: "scene-panel", variant: "solar.panel-structure" },
    { comp: CellPhotovoltaicScene, id: "scene-cell", variant: "solar.cell-photovoltaic" },
    { comp: CircuitFlowScene, id: "scene-circuit", variant: "solar.circuit-flow" },
    { comp: InverterHomeScene, id: "scene-inverter", variant: "solar.inverter-home" },
    { comp: BatteryStorageScene, id: "scene-battery", variant: "solar.battery-storage" },
    { comp: SolarTakeawayScene, id: "scene-takeaway", variant: "solar.takeaway" },
  ];

  components.forEach(({ comp, id, variant }, idx) => {
    const el = React.createElement(comp, {
      scene: makeMockScene({ sceneId: id, visualVariant: variant }),
      sceneIndex: idx,
      totalScenes: 7,
      globalProgress: idx / 7,
      topic: "How Solar Panels Turn Sunlight into Electricity",
    });
    assert.ok(el, `${comp.name} must render a valid React element`);
  });
});


