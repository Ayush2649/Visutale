import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJson, hashCanonicalJson } from "../src/pipeline/canonicalHash.js";

test("canonical JSON is independent of object key insertion order", () => {
  const first = { topic: "water", settings: { width: 1080, height: 1920 } };
  const second = { settings: { height: 1920, width: 1080 }, topic: "water" };
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.equal(hashCanonicalJson(first), hashCanonicalJson(second));
});

test("canonical hash changes when a value changes", () => {
  assert.notEqual(hashCanonicalJson({ phrase: "evaporation" }), hashCanonicalJson({ phrase: "condensation" }));
});
