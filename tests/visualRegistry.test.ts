import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllRegisteredVariants,
  getVisualComponent,
  requireVisualComponent,
  resolveTopicDomain,
  validateVisualSelection,
  CrossTopicContaminationError,
  resolveLegacyVariant,
  type VisualVariantId,
} from "../src/video/registry/index.js";
import type { CompiledScene } from "../src/contracts/timeline.js";

function makeTestScene(overrides: Partial<CompiledScene>): CompiledScene {
  return {
    sceneId: "scene-1",
    type: "title-hook",
    startFrame: 0,
    endFrame: 150,
    durationInFrames: 150,
    purpose: "Test scene",
    onScreenText: ["Test Title"],
    objects: [],
    events: [],
    captions: [],
    audio: { isFixture: true, durationMs: 5000 },
    ...overrides,
  };
}

test("Visual Registry: all registered variants have valid metadata and components", () => {
  const variants = getAllRegisteredVariants();
  assert.ok(variants.length >= 25, `Expected at least 25 registered variants, found ${variants.length}`);

  for (const entry of variants) {
    assert.ok(entry.id, "Variant entry must have an id");
    assert.ok(entry.domain, `Variant ${entry.id} must have a domain`);
    assert.ok(entry.name, `Variant ${entry.id} must have a name`);
    assert.ok(entry.description, `Variant ${entry.id} must have a description`);
    assert.equal(typeof entry.component, "function", `Variant ${entry.id} must have a valid component function`);

    // Lookup functions must return this component
    assert.equal(getVisualComponent(entry.id), entry.component);
    assert.equal(requireVisualComponent(entry.id), entry.component);
  }
});

test("Visual Registry: resolveTopicDomain resolves known domains accurately", () => {
  assert.equal(resolveTopicDomain("How the Water Cycle Works"), "water-cycle");
  assert.equal(resolveTopicDomain("Water Purification and Rain"), "water-cycle");
  assert.equal(resolveTopicDomain("How Photosynthesis Works"), "photosynthesis");
  assert.equal(resolveTopicDomain("Plant Biology and Chloroplasts"), "photosynthesis");
  assert.equal(resolveTopicDomain("RAM vs Storage: Understanding Computer Memory"), "computer-architecture");
  assert.equal(resolveTopicDomain("Binary Search Algorithm"), "algorithms");
  assert.equal(resolveTopicDomain("Introduction to Quantum Mechanics"), "generic");
  assert.equal(resolveTopicDomain(undefined), "generic");
});

test("Visual Registry: validateVisualSelection allows matching topic domain variants and generic variants", () => {
  // Photosynthesis domain
  assert.doesNotThrow(() =>
    validateVisualSelection("How Photosynthesis Works", "photosynthesis.ingredients")
  );
  assert.doesNotThrow(() =>
    validateVisualSelection("How Photosynthesis Works", "generic.process-flow")
  );

  // Water Cycle domain
  assert.doesNotThrow(() =>
    validateVisualSelection("The Water Cycle", "water-cycle.evaporation")
  );
  assert.doesNotThrow(() =>
    validateVisualSelection("The Water Cycle", "generic.takeaway")
  );

  // Computer Architecture domain
  assert.doesNotThrow(() =>
    validateVisualSelection("RAM vs Storage", "computer.ram-architecture")
  );

  // Algorithms domain
  assert.doesNotThrow(() =>
    validateVisualSelection("Binary Search", "algorithm.binary-search")
  );

  // Generic / novel topic accepts generic variants
  assert.doesNotThrow(() =>
    validateVisualSelection("Quantum Computing", "generic.labeled-diagram")
  );
});

test("Visual Registry: validateVisualSelection BLOCKS cross-topic contamination", () => {
  // Photosynthesis cannot use CPU/RAM architecture
  assert.throws(
    () => validateVisualSelection("How Photosynthesis Works", "computer.ram-architecture"),
    CrossTopicContaminationError
  );

  // Photosynthesis cannot use Binary Search
  assert.throws(
    () => validateVisualSelection("How Photosynthesis Works", "algorithm.binary-search"),
    CrossTopicContaminationError
  );

  // RAM vs Storage cannot use Water Cycle transpiration
  assert.throws(
    () => validateVisualSelection("RAM vs Storage", "water-cycle.transpiration"),
    CrossTopicContaminationError
  );

  // Binary Search cannot use RAM vs Storage comparison
  assert.throws(
    () => validateVisualSelection("Binary Search", "computer.ram-storage-comparison"),
    CrossTopicContaminationError
  );
});

test("Legacy Adapter: deterministically maps historical scenes without contamination", () => {
  // 1. Water cycle scenes
  const evap = makeTestScene({ sceneId: "scene-evaporation", type: "process-flow" });
  assert.equal(resolveLegacyVariant(evap, "Water Cycle"), "water-cycle.evaporation");

  const trans = makeTestScene({ sceneId: "scene-transpiration", type: "labeled-diagram" });
  assert.equal(resolveLegacyVariant(trans, "Water Cycle"), "water-cycle.transpiration");

  // 2. Photosynthesis scenes
  const photoIngredients = makeTestScene({ sceneId: "scene-ingredients", type: "labeled-diagram" });
  assert.equal(resolveLegacyVariant(photoIngredients, "Photosynthesis"), "photosynthesis.ingredients");

  const photoChloroplast = makeTestScene({ sceneId: "scene-chloroplast", type: "labeled-diagram" });
  assert.equal(resolveLegacyVariant(photoChloroplast, "Photosynthesis"), "photosynthesis.chloroplast");

  // 3. RAM vs Storage scenes
  const ramArch = makeTestScene({
    sceneId: "scene-ram-chip",
    type: "labeled-diagram",
    objects: [{ id: "obj-ram-chip", kind: "node", label: "RAM" }],
  });
  assert.equal(resolveLegacyVariant(ramArch, "RAM vs Storage"), "computer.ram-architecture");

  // 4. Binary search scenes
  const bsPrereq = makeTestScene({ sceneId: "scene-prerequisite", type: "step-sequence" });
  assert.equal(resolveLegacyVariant(bsPrereq, "Binary Search"), "algorithm.sorted-array");

  const bsStep = makeTestScene({ sceneId: "scene-step-1", type: "step-sequence" });
  assert.equal(resolveLegacyVariant(bsStep, "Binary Search"), "algorithm.binary-search");

  // 5. Novel unmatched topic defaults strictly to generic.* (never topic visuals)
  const novelScene = makeTestScene({ sceneId: "scene-intro", type: "title-hook" });
  assert.equal(resolveLegacyVariant(novelScene, "Quantum Physics"), "generic.title-hook");

  const novelDiagram = makeTestScene({ sceneId: "scene-particle-interaction", type: "labeled-diagram" });
  assert.equal(resolveLegacyVariant(novelDiagram, "Quantum Physics"), "generic.labeled-diagram");
});

test("Legacy Adapter: rejects unsupported scene types", () => {
  const bogusScene = makeTestScene({ sceneId: "scene-invalid", type: "unsupported-type" as any });
  assert.throws(
    () => resolveLegacyVariant(bogusScene, "Any Topic"),
    /Unsupported scene type/
  );
});

