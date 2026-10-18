import assert from "node:assert/strict";
import test from "node:test";
import { renderSceneComponent } from "../src/video/MainVideo.js";
import {
  resolveLegacyVariant,
  validateVisualSelection,
  CrossTopicContaminationError,
} from "../src/video/registry/index.js";
import {
  validateGenericComparison,
  type ComparisonConceptData,
} from "../src/video/core/generic/GenericComparison.js";
import {
  validateSceneDomainSemantics,
} from "../src/validation/semanticValidator.js";
import { EvaporationScene, TranspirationScene } from "../src/video/topics/water-cycle/index.js";
import {
  SortedArrayPrerequisite,
  BinarySearchStepSequence,
  SearchComparison,
} from "../src/video/topics/algorithms/index.js";
import {
  RamArchitectureDiagram,
  StorageArchitectureDiagram,
} from "../src/video/topics/computer-architecture/index.js";
import { GenericLabeledDiagram } from "../src/video/core/generic/index.js";
import type { CompiledScene } from "../src/contracts/timeline.js";

function makeDummyScene(overrides: Partial<CompiledScene>): CompiledScene {
  return {
    sceneId: "scene-1",
    type: "labeled-diagram",
    startFrame: 0,
    endFrame: 150,
    durationInFrames: 150,
    purpose: "Testing scene routing and data isolation",
    onScreenText: ["Test Title", "Test Subtitle"],
    objects: [],
    events: [],
    captions: [],
    audio: { isFixture: true, durationMs: 5000 },
    ...overrides,
  };
}

test("validateGenericComparison enforces distinct concepts and non-empty properties", () => {
  const baseConcept: ComparisonConceptData = {
    title: "RAM",
    badge: "Fast & Volatile",
    icon: "⚡",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    properties: [{ label: "Speed", value: "50 GB/s" }],
  };

  // Identical concepts rejected
  assert.throws(
    () => validateGenericComparison(baseConcept, { ...baseConcept }),
    /must be distinct/
  );

  // Missing properties rejected
  assert.throws(
    () =>
      validateGenericComparison(baseConcept, {
        ...baseConcept,
        title: "Storage",
        properties: [],
      }),
    /at least one property/
  );
});

test("validateSceneDomainSemantics catches cross-topic domain contamination", () => {
  // Search scene contaminated with RAM/Storage hardware properties
  const contaminatedSearchScene = makeDummyScene({
    sceneId: "scene-search-step",
    type: "labeled-diagram",
    purpose: "Demonstrate binary search traversal",
    onScreenText: ["Binary Search Step", "RAM Chip bus link"],
    objects: [{ id: "obj-ram-bus", kind: "node", label: "RAM Chip Bus Link" }],
  });

  const issues1 = validateSceneDomainSemantics(contaminatedSearchScene, "Binary Search");
  assert.ok(issues1.length > 0, "Should detect hardware contamination in search scene");
  assert.ok(
    issues1.some((i) => i.message.includes("computer-architecture")),
    "Should identify computer-architecture vocabulary contamination"
  );

  // Photosynthesis scene contaminated with computer architecture vocabulary
  const contaminatedPhotoScene = makeDummyScene({
    sceneId: "scene-ingredients",
    type: "labeled-diagram",
    purpose: "Identify raw ingredients",
    onScreenText: ["The 3 Key Ingredients", "CPU processor volatile memory"],
    objects: [{ id: "obj-cpu", kind: "node", label: "CPU Processor" }],
  });

  const issues2 = validateSceneDomainSemantics(contaminatedPhotoScene, "How Photosynthesis Works");
  assert.ok(issues2.length > 0, "Should detect hardware contamination in photosynthesis scene");
  assert.ok(
    issues2.some((i) => i.message.includes("computer-architecture")),
    "Should identify computer-architecture vocabulary in photosynthesis"
  );

  // Uncontaminated scene has 0 issues
  const cleanPhotoScene = makeDummyScene({
    sceneId: "scene-ingredients",
    type: "labeled-diagram",
    purpose: "Identify raw ingredients",
    onScreenText: ["The 3 Key Ingredients", "Sunlight + Water + CO2"],
    objects: [
      { id: "obj-water", kind: "arrow", label: "Water via Roots" },
      { id: "obj-co2", kind: "node", label: "CO2 via Stomata" },
    ],
  });

  const issues3 = validateSceneDomainSemantics(cleanPhotoScene, "How Photosynthesis Works");
  assert.equal(issues3.length, 0, "Clean scene should have 0 semantic issues");
});

test("renderSceneComponent routes Binary Search scenes cleanly without Water Cycle contamination", () => {
  // 1. scene-sorted-array (type: labeled-diagram) must render SortedArrayPrerequisite, NOT TranspirationScene
  const sortedArrayScene = makeDummyScene({
    sceneId: "scene-sorted-array",
    type: "labeled-diagram",
    onScreenText: ["Sorted Array Requirement", "Must be sorted for binary search"],
    objects: [{ id: "sorted-badge", kind: "label", label: "Prerequisite: Ascending Order" }],
  });

  const el1 = renderSceneComponent(sortedArrayScene, 1, 6, 0.2, "Binary Search");
  assert.equal(el1.type, SortedArrayPrerequisite);
  assert.notEqual(el1.type, TranspirationScene);

  // 2. scene-complexity (type: comparison) must render SearchComparison with search topic
  const complexityScene = makeDummyScene({
    sceneId: "scene-complexity",
    type: "comparison",
    onScreenText: ["Linear vs Binary Search", "O(n) vs O(log n)"],
    objects: [
      { id: "comp-linear", kind: "container", label: "Linear Search" },
      { id: "comp-binary", kind: "container", label: "Binary Search" },
    ],
  });

  const el2 = renderSceneComponent(complexityScene, 4, 6, 0.8, "Binary Search");
  assert.equal(el2.type, SearchComparison);

  // 3. scene-first-step (type: step-sequence) must render BinarySearchStepSequence
  const stepScene = makeDummyScene({
    sceneId: "scene-first-step",
    type: "step-sequence",
    onScreenText: ["Step 1: Check Midpoint", "Target = 72"],
  });

  const el3 = renderSceneComponent(stepScene, 2, 6, 0.4, "Binary Search");
  assert.equal(el3.type, BinarySearchStepSequence);
});

test("renderSceneComponent routes RAM vs Storage scenes cleanly to dedicated components", () => {
  // scene-how-ram-works (type: labeled-diagram) must render RamArchitectureDiagram
  const ramScene = makeDummyScene({
    sceneId: "scene-how-ram-works",
    type: "labeled-diagram",
    onScreenText: ["How RAM Works", "High-speed volatile workspace"],
    objects: [{ id: "ram-chip", kind: "container", label: "RAM Module" }],
  });

  const elRam = renderSceneComponent(ramScene, 1, 6, 0.2, "RAM vs Storage");
  assert.equal(elRam.type, RamArchitectureDiagram);
  assert.notEqual(elRam.type, TranspirationScene);

  // scene-how-storage-works (type: labeled-diagram) must render StorageArchitectureDiagram
  const storageScene = makeDummyScene({
    sceneId: "scene-how-storage-works",
    type: "labeled-diagram",
    onScreenText: ["How Storage Works", "Non-volatile permanent archive"],
    objects: [{ id: "ssd-drive", kind: "container", label: "NVMe SSD" }],
  });

  const elStorage = renderSceneComponent(storageScene, 2, 6, 0.4, "RAM vs Storage");
  assert.equal(elStorage.type, StorageArchitectureDiagram);
});

test("renderSceneComponent preserves handcrafted scenes exclusively for Water Cycle topic", () => {
  const evaporationScene = makeDummyScene({
    sceneId: "scene-evaporation",
    type: "process-flow",
    onScreenText: ["Evaporation", "Liquid water to water vapor"],
  });

  const transpirationScene = makeDummyScene({
    sceneId: "scene-transpiration",
    type: "labeled-diagram",
    onScreenText: ["Transpiration", "Plant moisture release"],
  });

  // For Water Cycle topic: routes to dedicated visual scenes
  const elEvap = renderSceneComponent(evaporationScene, 1, 7, 0.2, "How the Water Cycle Works");
  assert.equal(elEvap.type, EvaporationScene);

  const elTrans = renderSceneComponent(transpirationScene, 2, 7, 0.35, "How the Water Cycle Works");
  assert.equal(elTrans.type, TranspirationScene);

  // For a DIFFERENT topic: must NOT route to EvaporationScene or TranspirationScene
  const elNonWaterDiagram = renderSceneComponent(transpirationScene, 2, 6, 0.35, "Compiler Optimization");
  assert.equal(elNonWaterDiagram.type, GenericLabeledDiagram);
  assert.notEqual(elNonWaterDiagram.type, TranspirationScene);
});

test("renderSceneComponent throws exhaustive error on unsupported scene type", () => {
  const bogusScene = makeDummyScene({
    sceneId: "scene-bogus",
    type: "unknown-experimental-3d-scene" as any,
  });

  assert.throws(
    () => renderSceneComponent(bogusScene, 0, 1, 0, "Any Topic"),
    /Unsupported scene type "unknown-experimental-3d-scene"/
  );
});

test("resolveLegacyVariant resolves photosynthesis.ingredients for Scene 2 without RAM contamination", () => {
  const photoScene2 = makeDummyScene({
    sceneId: "scene-ingredients",
    type: "labeled-diagram",
    purpose: "Identify the three essential raw ingredients required for the reaction.",
    onScreenText: ["The 3 Key Ingredients", "Sunlight + Water + CO2"],
    objects: [
      { id: "obj-plant-diagram", kind: "container", label: "Plant Anatomy Diagram" },
      { id: "obj-water-arrow", kind: "arrow", label: "Water Intake via Roots" },
      { id: "obj-co2-node", kind: "node", label: "CO2 Intake via Stomata" },
      { id: "obj-sun-rays", kind: "arrow", label: "Sunlight Absorption" },
    ],
  });

  const variant = resolveLegacyVariant(photoScene2, "How Photosynthesis Works");
  assert.equal(variant, "photosynthesis.ingredients");

  // Verify that cross-topic variant cannot be used
  assert.throws(
    () => validateVisualSelection("How Photosynthesis Works", "computer.ram-architecture"),
    CrossTopicContaminationError
  );
});

test("resolveLegacyVariant resolves photosynthesis.chloroplast for internal organelle scene", () => {
  const photoScene3 = makeDummyScene({
    sceneId: "scene-chloroplast",
    type: "labeled-diagram",
    purpose: "Explain the role of chloroplasts and chlorophyll as biological solar panels.",
    onScreenText: ["Inside the Leaf", "Chloroplasts & Chlorophyll"],
    objects: [
      { id: "obj-cell-container", kind: "container", label: "Plant Cell Structure" },
      { id: "obj-chloroplast-node", kind: "node", label: "Chloroplast Organelle" },
    ],
  });

  const variant = resolveLegacyVariant(photoScene3, "How Photosynthesis Works");
  assert.equal(variant, "photosynthesis.chloroplast");
});

test("resolveLegacyVariant only resolves computer.ram-architecture for hardware topics", () => {
  const hardwareRamScene = makeDummyScene({
    sceneId: "scene-how-ram-works",
    type: "labeled-diagram",
    purpose: "Explain RAM workspace",
    objects: [{ id: "obj-3-ram-chip", kind: "container", label: "RAM Module" }],
  });

  const variant1 = resolveLegacyVariant(hardwareRamScene, "RAM vs Storage");
  assert.equal(variant1, "computer.ram-architecture");

  // Non-hardware topic with an object named 'diagram' or 'program' must NEVER resolve to ram-architecture
  const nonHardwareScene = makeDummyScene({
    sceneId: "scene-diagram-overview",
    type: "labeled-diagram",
    purpose: "System diagram overview",
    objects: [{ id: "obj-diagram-flow", kind: "container", label: "Program Diagram" }],
  });

  const variant2 = resolveLegacyVariant(nonHardwareScene, "Algorithm Complexity");
  assert.notEqual(variant2, "computer.ram-architecture");
  assert.equal(variant2, "generic.labeled-diagram");
});
