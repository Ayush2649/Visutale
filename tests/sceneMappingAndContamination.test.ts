import assert from "node:assert/strict";
import test from "node:test";
import { validateComparisonData, resolveComparisonConcepts, type ComparisonConcept } from "../src/video/scenes/ComparisonScene.js";
import { renderSceneComponent } from "../src/video/MainVideo.js";
import { resolveDiagramVariant } from "../src/video/scenes/LabeledDiagramScene.js";
import { EvaporationScene, TranspirationScene } from "../src/video/topics/water-cycle/index.js";
import { SortedArrayPrerequisite, BinarySearchStepSequence, SearchComparison } from "../src/video/topics/algorithms/index.js";
import { RamArchitectureDiagram, StorageArchitectureDiagram } from "../src/video/topics/computer-architecture/index.js";
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

test("validateComparisonData enforces distinct concepts and non-empty properties", () => {
  const baseConcept: ComparisonConcept = {
    title: "RAM",
    analogyOrRole: "Working Desk",
    badge: "Fast & Volatile",
    icon: "⚡",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    properties: [{ label: "Speed", value: "50 GB/s" }],
  };

  // Identical concepts rejected
  assert.throws(
    () => validateComparisonData(baseConcept, { ...baseConcept }),
    /must be distinct/
  );

  // Missing properties rejected
  assert.throws(
    () =>
      validateComparisonData(baseConcept, {
        ...baseConcept,
        title: "Storage",
        properties: [],
      }),
    /at least one property/
  );
});

test("validateComparisonData catches cross-topic contamination", () => {
  const searchConceptA: ComparisonConcept = {
    title: "Linear Search",
    analogyOrRole: "Sequential scan",
    badge: "O(n)",
    icon: "🔍",
    color: "#0284C7",
    bgColor: "#F0F7FF",
    borderColor: "#BAE6FD",
    properties: [{ label: "Method", value: "Checks each item" }],
  };

  // Search comparison contaminated with RAM/Storage hardware properties
  const contaminatedSearchConceptB: ComparisonConcept = {
    title: "Binary Search",
    analogyOrRole: "Divide and conquer",
    badge: "O(log n)",
    icon: "⚡",
    color: "#059669",
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    properties: [
      { label: "Speed", value: "50 GB/s bus transfer" }, // Contamination!
    ],
  };

  assert.throws(
    () => validateComparisonData(searchConceptA, contaminatedSearchConceptB),
    /Cross-topic contamination: RAM\/Storage hardware properties found in Search comparison/
  );

  // RAM comparison contaminated with Search algorithmic complexity
  const ramConceptA: ComparisonConcept = {
    title: "RAM",
    analogyOrRole: "Working Desk",
    badge: "Volatile",
    icon: "⚡",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    properties: [{ label: "Speed", value: "Fast" }],
  };

  const contaminatedStorageConceptB: ComparisonConcept = {
    title: "Storage",
    analogyOrRole: "Filing Cabinet",
    badge: "Permanent",
    icon: "🗄️",
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
    properties: [
      { label: "Complexity", value: "O(log n) access time" }, // Contamination!
    ],
  };

  assert.throws(
    () => validateComparisonData(ramConceptA, contaminatedStorageConceptB),
    /Cross-topic contamination: Search algorithm properties found in RAM\/Storage comparison/
  );
});

test("resolveComparisonConcepts produces topic-accurate, uncontaminated concepts for RAM vs Storage", () => {
  const scene = makeDummyScene({
    sceneId: "scene-ram-storage-comparison",
    type: "comparison",
    purpose: "Direct comparison between RAM and SSD Storage",
    objects: [
      { id: "ram-card", kind: "container", label: "RAM (Memory)" },
      { id: "storage-card", kind: "container", label: "Storage (SSD/HDD)" },
    ],
  });

  const { conceptA, conceptB } = resolveComparisonConcepts(scene, "RAM vs Storage");
  assert.equal(conceptA.title, "RAM (Active Memory)");
  assert.equal(conceptB.title, "Storage (SSD / Disk)");
  assert.ok(conceptA.analogyOrRole.includes("Desk"));
  assert.ok(conceptB.analogyOrRole.includes("Filing Cabinet") || conceptB.analogyOrRole.includes("Closet"));

  // Must pass validation without throwing
  assert.doesNotThrow(() => validateComparisonData(conceptA, conceptB));
});

test("resolveComparisonConcepts produces topic-accurate, uncontaminated concepts for Binary Search", () => {
  const scene = makeDummyScene({
    sceneId: "scene-complexity",
    type: "comparison",
    purpose: "Compare algorithmic efficiency of linear and binary search",
    objects: [
      { id: "comp-linear", kind: "container", label: "Linear Search" },
      { id: "comp-binary", kind: "container", label: "Binary Search" },
    ],
  });

  const { conceptA, conceptB } = resolveComparisonConcepts(scene, "Binary Search");
  assert.equal(conceptA.title, "Linear Search");
  assert.equal(conceptB.title, "Binary Search");
  assert.ok(conceptA.badge.includes("O(n)"));
  assert.ok(conceptB.badge.includes("O(log n)"));

  // Must pass validation without throwing
  assert.doesNotThrow(() => validateComparisonData(conceptA, conceptB));
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

test("resolveDiagramVariant resolves plant-ingredients for photosynthesis Scene 2 without RAM contamination", () => {
  // Photosynthesis Scene 2 from approved plan
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

  const variant = resolveDiagramVariant(photoScene2, "How Photosynthesis Works");
  assert.equal(variant, "plant-ingredients");
  // Regression check: "obj-plant-diagram" contains substring "ram", but MUST NOT resolve to ram-architecture!
  assert.notEqual(variant, "ram-architecture");
  assert.notEqual(variant, "storage-architecture");
  assert.notEqual(variant, "binary-search-array");
});

test("resolveDiagramVariant resolves generic for internal chloroplast detail scene", () => {
  // Photosynthesis Scene 3 from approved plan
  const photoScene3 = makeDummyScene({
    sceneId: "scene-chloroplast",
    type: "labeled-diagram",
    purpose: "Explain the role of chloroplasts and chlorophyll as biological solar panels.",
    onScreenText: ["Inside the Leaf", "Chloroplasts & Chlorophyll"],
    objects: [
      { id: "obj-cell-container", kind: "container", label: "Plant Cell Structure" },
      { id: "obj-chloroplast-node", kind: "node", label: "Chloroplast Organelle" },
      { id: "obj-chlorophyll-pigment", kind: "shape", label: "Green Chlorophyll Pigment" },
    ],
  });

  const variant = resolveDiagramVariant(photoScene3, "How Photosynthesis Works");
  assert.equal(variant, "generic");
  assert.notEqual(variant, "ram-architecture");
  assert.notEqual(variant, "plant-ingredients");
});

test("resolveDiagramVariant only resolves ram-architecture for hardware topics with tokenized RAM objects", () => {
  const hardwareRamScene = makeDummyScene({
    sceneId: "scene-how-ram-works",
    type: "labeled-diagram",
    purpose: "Explain RAM workspace",
    objects: [{ id: "obj-3-ram-chip", kind: "container", label: "RAM Module" }],
  });

  const variant1 = resolveDiagramVariant(hardwareRamScene, "RAM vs Storage");
  assert.equal(variant1, "ram-architecture");

  // Non-hardware topic with an object named 'diagram' or 'program' must NEVER resolve to ram-architecture
  const nonHardwareScene = makeDummyScene({
    sceneId: "scene-diagram-overview",
    type: "labeled-diagram",
    purpose: "System diagram overview",
    objects: [{ id: "obj-diagram-flow", kind: "container", label: "Program Diagram" }],
  });

  const variant2 = resolveDiagramVariant(nonHardwareScene, "Algorithm Complexity");
  assert.notEqual(variant2, "ram-architecture");
  assert.equal(variant2, "generic");
});

