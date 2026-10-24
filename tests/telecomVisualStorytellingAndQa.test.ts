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
  CityCallHookScene,
  MicrophoneAcousticScene,
  DigitalSamplingScene,
  CellTowerTransmissionScene,
  FiberNetworkBackboneScene,
  SpeakerAcousticScene,
  TwoWayDuplexTakeawayScene,
} from "../src/video/topics/telecom/index.js";
import type { CompiledScene } from "../src/contracts/timeline.js";
import { validateRenderOutput } from "../src/validation/mediaValidator.js";

function makeMockScene(overrides: Partial<CompiledScene> = {}): CompiledScene {
  return {
    sceneId: "scene-hook",
    type: "title-hook",
    startFrame: 0,
    endFrame: 180,
    durationInFrames: 180,
    purpose: "Introduce long-distance phone call communication",
    onScreenText: ["How Mobile Calls Work", "Mumbai to Delhi in Milliseconds"],
    objects: [
      { id: "obj-person-mumbai", kind: "icon", label: "Person in Mumbai" },
      { id: "obj-person-delhi", kind: "icon", label: "Person in Delhi" },
    ],
    events: [
      {
        id: "ev-1",
        targetId: "obj-person-mumbai",
        action: "reveal",
        startFrame: 0,
        endFrame: 45,
        durationFrames: 45,
        cuePhrase: "Your friend is",
        resolvedStartMs: 0,
        resolvedEndMs: 1500,
      },
    ],
    captions: [
      {
        id: "cap-1",
        text: "Your friend is hundreds of miles away.",
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

test("Telecom Visual Storytelling: 1. Telecom domain registration and component resolution", () => {
  assert.equal(
    resolveTopicDomain("How does your phone let you talk to someone hundreds or thousands of miles away?"),
    "telecom"
  );
  assert.equal(resolveTopicDomain("Mobile Cellular Network and Fiber Optics"), "telecom");
  assert.equal(resolveTopicDomain("How Phone Calls Travel"), "telecom");

  const telecomVariants = [
    "telecom.city-hook",
    "telecom.microphone-acoustic",
    "telecom.digital-sampling",
    "telecom.cell-tower",
    "telecom.fiber-network",
    "telecom.speaker-acoustic",
    "telecom.two-way-loop",
  ] as const;

  for (const variant of telecomVariants) {
    const comp = requireVisualComponent(variant);
    assert.equal(typeof comp, "function", `Variant ${variant} must resolve to a valid React component`);
    assert.doesNotThrow(() =>
      validateVisualSelection(
        "How does your phone let you talk to someone hundreds or thousands of miles away?",
        variant
      )
    );
  }

  // Cross-topic protection: Telecom cannot use solar or optics specialized components
  assert.throws(
    () =>
      validateVisualSelection(
        "How does your phone let you talk to someone hundreds or thousands of miles away?",
        "solar.rooftop-hook"
      ),
    CrossTopicContaminationError
  );
  assert.throws(
    () =>
      validateVisualSelection(
        "How does your phone let you talk to someone hundreds or thousands of miles away?",
        "optics.prism-spectrum"
      ),
    CrossTopicContaminationError
  );
});

test("Telecom Visual Storytelling: 2. Legacy adapter deterministically routes phone scenes to telecom components", () => {
  const topic = "How does your phone let you talk to someone hundreds or thousands of miles away?";

  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-hook", type: "title-hook" }), topic),
    "telecom.city-hook"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-microphone", type: "labeled-diagram" }), topic),
    "telecom.microphone-acoustic"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-digital-encoding", type: "process-flow" }), topic),
    "telecom.digital-sampling"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-wireless-tower", type: "process-flow" }), topic),
    "telecom.cell-tower"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-network-journey", type: "process-flow" }), topic),
    "telecom.fiber-network"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-receiving-phone", type: "labeled-diagram" }), topic),
    "telecom.speaker-acoustic"
  );
  assert.equal(
    resolveLegacyVariant(makeMockScene({ sceneId: "scene-takeaway", type: "takeaway" }), topic),
    "telecom.two-way-loop"
  );
});

test("Telecom Visual Storytelling: 3. Telecom components render valid React elements", () => {
  const components = [
    { comp: CityCallHookScene, id: "scene-hook", variant: "telecom.city-hook" },
    { comp: MicrophoneAcousticScene, id: "scene-microphone", variant: "telecom.microphone-acoustic" },
    { comp: DigitalSamplingScene, id: "scene-digital", variant: "telecom.digital-sampling" },
    { comp: CellTowerTransmissionScene, id: "scene-tower", variant: "telecom.cell-tower" },
    { comp: FiberNetworkBackboneScene, id: "scene-fiber", variant: "telecom.fiber-network" },
    { comp: SpeakerAcousticScene, id: "scene-speaker", variant: "telecom.speaker-acoustic" },
    { comp: TwoWayDuplexTakeawayScene, id: "scene-takeaway", variant: "telecom.two-way-loop" },
  ];

  components.forEach(({ comp, id, variant }, idx) => {
    const el = React.createElement(comp, {
      scene: makeMockScene({ sceneId: id, visualVariant: variant }),
      sceneIndex: idx,
      totalScenes: 7,
      globalProgress: idx / 7,
      topic: "How does your phone let you talk to someone hundreds or thousands of miles away?",
    });
    assert.ok(el, `${comp.name} must render a valid React element`);
  });
});

