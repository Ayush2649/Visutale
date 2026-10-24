import assert from "node:assert/strict";
import test from "node:test";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SAFE_MARGINS,
  LAYOUT_ZONES,
  wrapTextToLines,
  calculateTextDimensions,
  calculateOptimalFontSize,
  doBoxesOverlap,
  calculateBoxCollision,
  validateSceneTextLayout,
  type TextBoundingBox,
} from "../src/video/core/layout/textLayoutEngine.js";

test("Text Layout Engine: 1. Word wrapping adheres strictly to container max width", () => {
  const text = "Solar energy transforms sunlight into clean electricity for modern homes";
  const maxWidth = 400;
  const fontSize = 28;

  const lines = wrapTextToLines(text, fontSize, maxWidth);
  assert.ok(lines.length >= 2, "Text should wrap into multiple lines");

  // Every line's dimensions must not exceed maxWidth
  const dims = calculateTextDimensions(text, fontSize, maxWidth);
  assert.ok(dims.width <= maxWidth, `Measured width (${dims.width}px) must not exceed ${maxWidth}px`);
  assert.equal(dims.lineCount, lines.length, "Line count must match wrapped lines length");
});

test("Text Layout Engine: 2. Dynamic font scaling prevents multi-line overflow", () => {
  const longTitle = "Understanding the Complex Quantum Photovoltaic Process of Electron Excitation";
  const maxWidth = 800;
  const maxLines = 2;

  const result = calculateOptimalFontSize(longTitle, 48, 22, maxWidth, maxLines);
  assert.ok(
    result.lineCount <= maxLines,
    `Resulting line count (${result.lineCount}) must fit within ${maxLines} lines`
  );
  assert.ok(result.fontSize <= 48, "Font size should not exceed maxFontSize");
  assert.ok(result.fontSize >= 22, "Font size should not drop below minFontSize");
  assert.ok(result.width <= maxWidth, "Width must stay within maxWidth");
});

test("Text Layout Engine: 3. Collision detection catches intersecting bounding boxes", () => {
  const boxA: TextBoundingBox = {
    id: "box-a",
    x: 100,
    y: 1400,
    width: 800,
    height: 120,
    text: "Box A",
    fontSize: 24,
    lineCount: 1,
    lines: ["Box A"],
  };

  // Overlapping box
  const boxB: TextBoundingBox = {
    id: "box-b",
    x: 100,
    y: 1480, // Overlaps boxA (1400 to 1520)
    width: 800,
    height: 100,
    text: "Box B",
    fontSize: 24,
    lineCount: 1,
    lines: ["Box B"],
  };

  assert.equal(doBoxesOverlap(boxA, boxB), true, "doBoxesOverlap should detect vertical intersection");
  const collision = calculateBoxCollision(boxA, boxB);
  assert.ok(collision !== null, "calculateBoxCollision should return collision details");
  assert.equal(collision?.boxIdA, "box-a");
  assert.equal(collision?.boxIdB, "box-b");
  assert.ok((collision?.overlapY ?? 0) > 0, "Vertical overlap should be greater than zero");

  // Non-overlapping box
  const boxC: TextBoundingBox = {
    id: "box-c",
    x: 100,
    y: 1650, // Clearly below boxA (ended at 1520)
    width: 800,
    height: 100,
    text: "Box C",
    fontSize: 24,
    lineCount: 1,
    lines: ["Box C"],
  };

  assert.equal(doBoxesOverlap(boxA, boxC), false, "doBoxesOverlap should return false for disjoint boxes");
  assert.equal(calculateBoxCollision(boxA, boxC), null, "calculateBoxCollision should be null for disjoint boxes");
});

test("Text Layout Engine: 4. validateSceneTextLayout enforces zone boundaries and clearances", () => {
  // Valid layout: Title in topNav, callout in lowerCallout, caption in captionSafe
  const validBoxes: TextBoundingBox[] = [
    {
      id: "title",
      x: SAFE_MARGINS.left,
      y: 130,
      width: SAFE_MARGINS.maxWidth,
      height: 60,
      text: "The Sun Powers Your Home",
      fontSize: 44,
      lineCount: 1,
      lines: ["The Sun Powers Your Home"],
      zone: "topNav",
    },
    {
      id: "callout",
      x: SAFE_MARGINS.left,
      y: LAYOUT_ZONES.lowerCallout.top + 10, // 1430
      width: SAFE_MARGINS.maxWidth,
      height: 120, // ends at 1550
      text: "Solar Energy Transformation",
      fontSize: 24,
      lineCount: 1,
      lines: ["Solar Energy Transformation"],
      zone: "lowerCallout",
    },
    {
      id: "caption",
      x: SAFE_MARGINS.left,
      y: LAYOUT_ZONES.captionSafe.top, // 1640
      width: SAFE_MARGINS.maxWidth,
      height: 90, // ends at 1730
      text: "The Sun can power your home! But how does sunlight become electricity?",
      fontSize: 36,
      lineCount: 2,
      lines: ["The Sun can power your home!", "But how does sunlight become electricity?"],
      zone: "captionSafe",
    },
  ];

  const validResult = validateSceneTextLayout(validBoxes);
  assert.equal(validResult.valid, true, "Valid layout must pass validation");
  assert.equal(validResult.collisions.length, 0, "Must have zero collisions");
  assert.equal(validResult.overflows.length, 0, "Must have zero overflows");

  // Invalid layout: Callout placed too low (breaches captionSafe boundary)
  const defectiveBoxes: TextBoundingBox[] = [
    {
      id: "defective-callout",
      x: SAFE_MARGINS.left,
      y: 1550,
      width: SAFE_MARGINS.maxWidth,
      height: 150, // ends at 1700, penetrating captionSafe.top (1640)
      text: "Defective Callout",
      fontSize: 24,
      lineCount: 2,
      lines: ["Defective", "Callout"],
      zone: "lowerCallout",
    },
    {
      id: "caption",
      x: SAFE_MARGINS.left,
      y: LAYOUT_ZONES.captionSafe.top, // 1640
      width: SAFE_MARGINS.maxWidth,
      height: 90,
      text: "Caption text here",
      fontSize: 36,
      lineCount: 1,
      lines: ["Caption text here"],
      zone: "captionSafe",
    },
  ];

  const defectiveResult = validateSceneTextLayout(defectiveBoxes);
  assert.equal(defectiveResult.valid, false, "Defective layout must fail validation");
  assert.ok(defectiveResult.collisions.length > 0, "Should detect collision between callout and caption");
  assert.ok(
    defectiveResult.overflows.some((o) => o.boundary === "zone"),
    "Should detect zone clearance violation"
  );
});

test("Text Layout Engine: 5. Boundary overflows beyond safe margins are caught", () => {
  const overflowingBox: TextBoundingBox[] = [
    {
      id: "too-far-right",
      x: 200,
      y: 300,
      width: 900, // 200 + 900 = 1100 > CANVAS_WIDTH - SAFE_MARGINS.right (1008)
      height: 50,
      text: "Overflowing right",
      fontSize: 24,
      lineCount: 1,
      lines: ["Overflowing right"],
    },
  ];

  const result = validateSceneTextLayout(overflowingBox);
  assert.equal(result.valid, false);
  assert.ok(result.overflows.some((o) => o.boundary === "right"));
});

