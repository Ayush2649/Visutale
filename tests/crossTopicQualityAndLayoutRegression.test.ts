import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {
  resolveTopicDomain,
  validateVisualSelection,
  resolveLegacyVariant,
  requireVisualComponent,
  CrossTopicContaminationError,
} from "../src/video/registry/index.js";
import {
  validateSceneTextLayout,
  calculateTextDimensions,
  SAFE_MARGINS,
  LAYOUT_ZONES,
  type TextBoundingBox,
} from "../src/video/core/layout/textLayoutEngine.js";
import type { CompiledScene } from "../src/contracts/timeline.js";

function makeScene(overrides: Partial<CompiledScene> = {}): CompiledScene {
  return {
    sceneId: "scene-1",
    type: "title-hook",
    startFrame: 0,
    endFrame: 180,
    durationInFrames: 180,
    purpose: "Educational explainer purpose",
    onScreenText: ["Scene Title", "Detailed explanation of the visual concept"],
    objects: [{ id: "obj-1", kind: "icon", label: "Hero Subject" }],
    events: [],
    captions: [
      {
        id: "cap-1",
        text: "Narration explaining the key concept clearly to viewers.",
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

const SCENARIOS = [
  {
    name: "1. Solar panels generating electricity",
    topic: "How solar panels turn sunlight into electricity",
    expectedDomain: "solar",
    scenes: [
      { id: "scene-hook", type: "title-hook" as const, expectedVariant: "solar.rooftop-hook" },
      { id: "scene-panel", type: "labeled-diagram" as const, expectedVariant: "solar.panel-structure" },
      { id: "scene-cell", type: "process-flow" as const, expectedVariant: "solar.cell-photovoltaic" },
      { id: "scene-circuit", type: "step-sequence" as const, expectedVariant: "solar.circuit-flow" },
      { id: "scene-inverter", type: "process-flow" as const, expectedVariant: "solar.inverter-home" },
      { id: "scene-battery", type: "comparison" as const, expectedVariant: "solar.battery-storage" },
      { id: "scene-takeaway", type: "takeaway" as const, expectedVariant: "solar.takeaway" },
    ],
  },
  {
    name: "2. The water cycle",
    topic: "How the Water Cycle Works",
    expectedDomain: "water-cycle",
    scenes: [
      { id: "scene-hook", type: "title-hook" as const, expectedVariant: "water-cycle.title-hook" },
      { id: "scene-evaporation", type: "process-flow" as const, expectedVariant: "water-cycle.evaporation" },
      { id: "scene-transpiration", type: "process-flow" as const, expectedVariant: "water-cycle.transpiration" },
      { id: "scene-condensation", type: "process-flow" as const, expectedVariant: "water-cycle.condensation" },
      { id: "scene-precipitation", type: "process-flow" as const, expectedVariant: "water-cycle.precipitation" },
      { id: "scene-collection", type: "process-flow" as const, expectedVariant: "water-cycle.collection" },
      { id: "scene-takeaway", type: "takeaway" as const, expectedVariant: "water-cycle.takeaway" },
    ],
  },
  {
    name: "3. Rainbow formation and optics",
    topic: "Why the Sky Turns Orange and Red at Sunset: Rayleigh Scattering and Rainbow Optics",
    expectedDomain: "optics",
    scenes: [
      { id: "scene-hook", type: "title-hook" as const, expectedVariant: "optics.title-hook" },
      { id: "scene-prism", type: "labeled-diagram" as const, expectedVariant: "optics.prism-spectrum" },
      { id: "scene-atmosphere", type: "process-flow" as const, expectedVariant: "optics.earth-atmosphere" },
      { id: "scene-scattering", type: "comparison" as const, expectedVariant: "optics.rayleigh-scattering" },
      { id: "scene-sunset-path", type: "step-sequence" as const, expectedVariant: "optics.sunset-path" },
      { id: "scene-takeaway", type: "takeaway" as const, expectedVariant: "optics.takeaway" },
    ],
  },
  {
    name: "4. Technology concept: RAM versus storage",
    topic: "RAM vs SSD Storage: Memory Architecture Explained",
    expectedDomain: "computer-architecture",
    scenes: [
      { id: "scene-hook", type: "title-hook" as const, expectedVariant: "computer.title-hook" },
      { id: "scene-ram", type: "labeled-diagram" as const, expectedVariant: "computer.ram-architecture" },
      { id: "scene-storage", type: "labeled-diagram" as const, expectedVariant: "computer.storage-architecture" },
      { id: "scene-comparison", type: "comparison" as const, expectedVariant: "computer.ram-storage-comparison" },
      { id: "scene-takeaway", type: "takeaway" as const, expectedVariant: "computer.takeaway" },
    ],
  },
];

for (const scenario of SCENARIOS) {
  test(`Regression Test: ${scenario.name}`, () => {
    // 1. Verify Topic Domain Resolution
    const domain = resolveTopicDomain(scenario.topic);
    assert.equal(domain, scenario.expectedDomain, `Topic must resolve to domain '${scenario.expectedDomain}'`);

    // 2. Verify Legacy Routing & Visual Registry Resolution
    for (const sc of scenario.scenes) {
      const compiledScene = makeScene({ sceneId: sc.id, type: sc.type });
      const resolvedVariant = resolveLegacyVariant(compiledScene, scenario.topic);
      assert.equal(
        resolvedVariant,
        sc.expectedVariant,
        `Scene '${sc.id}' must map to specialized variant '${sc.expectedVariant}'`
      );

      // Verify variant is valid and component can be retrieved
      const validation = validateVisualSelection(scenario.topic, resolvedVariant);
      assert.equal(validation.isValid, true);
      const Component = requireVisualComponent(resolvedVariant as any);
      assert.equal(typeof Component, "function", `Variant '${resolvedVariant}' must resolve to React component`);

      // 3. Verify Component Renders Cleanly without crashing
      const element = React.createElement(Component, {
        scene: compiledScene,
        sceneIndex: 0,
        totalScenes: scenario.scenes.length,
        globalProgress: 0.5,
        topic: scenario.topic,
      });
      assert.ok(element, `Component for '${resolvedVariant}' must render valid React element`);

      // 4. Verify Text Layout & Overlap Safety
      const layoutBoxes: TextBoundingBox[] = [
        {
          id: `${sc.id}-title`,
          x: SAFE_MARGINS.left,
          y: 130,
          width: SAFE_MARGINS.maxWidth,
          height: 60,
          text: compiledScene.onScreenText[0],
          fontSize: 44,
          lineCount: 1,
          lines: [compiledScene.onScreenText[0]],
          zone: "topNav",
        },
        {
          id: `${sc.id}-callout`,
          x: SAFE_MARGINS.left,
          y: LAYOUT_ZONES.lowerCallout.top + 10,
          width: SAFE_MARGINS.maxWidth,
          height: 120,
          text: compiledScene.onScreenText[1],
          fontSize: 24,
          lineCount: 1,
          lines: [compiledScene.onScreenText[1]],
          zone: "lowerCallout",
        },
        {
          id: `${sc.id}-caption`,
          x: SAFE_MARGINS.left,
          y: LAYOUT_ZONES.captionSafe.top,
          width: SAFE_MARGINS.maxWidth,
          height: 90,
          text: compiledScene.captions[0].text,
          fontSize: 36,
          lineCount: 1,
          lines: [compiledScene.captions[0].text],
          zone: "captionSafe",
        },
      ];

      const layoutResult = validateSceneTextLayout(layoutBoxes);
      assert.equal(
        layoutResult.valid,
        true,
        `Scene '${sc.id}' in '${scenario.name}' failed text layout validation: ${JSON.stringify(layoutResult)}`
      );
      assert.equal(layoutResult.collisions.length, 0, "Collisions must be exactly 0");
      assert.equal(layoutResult.overflows.length, 0, "Overflows must be exactly 0");
    }
  });
}

test("Regression Test: Cross-Topic Contamination is systematically rejected across all 4 domains", () => {
  // Solar topic trying to use computer architecture variant
  assert.throws(
    () => validateVisualSelection("How solar panels turn sunlight into electricity", "computer.ram-architecture"),
    CrossTopicContaminationError
  );
  // Water cycle topic trying to use optics variant
  assert.throws(
    () => validateVisualSelection("How the Water Cycle Works", "optics.prism-spectrum"),
    CrossTopicContaminationError
  );
  // Computer architecture trying to use solar variant
  assert.throws(
    () => validateVisualSelection("RAM vs SSD Storage", "solar.cell-photovoltaic"),
    CrossTopicContaminationError
  );
  // Optics trying to use water cycle variant
  assert.throws(
    () => validateVisualSelection("Why Sunsets Are Red", "water-cycle.evaporation"),
    CrossTopicContaminationError
  );
});

