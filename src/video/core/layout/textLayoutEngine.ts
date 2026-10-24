/**
 * Unified Text Layout & Overlap Prevention Engine
 * 
 * Provides deterministic bounding box calculation, text wrapping, dynamic font scaling,
 * safe-area enforcement, and collision detection across all VisuTale video scenes.
 */

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export const SAFE_MARGINS = {
  left: 72,
  right: 72,
  top: 100,
  bottom: 80,
  maxWidth: 936, // 1080 - 72*2
} as const;

export const LAYOUT_ZONES = {
  topNav: { top: 0, bottom: 200, height: 200 },
  stageHero: { top: 200, bottom: 1420, height: 1220 },
  lowerCallout: { top: 1420, bottom: 1620, height: 200 },
  captionSafe: { top: 1640, bottom: 1840, height: 200 },
} as const;

export interface TextBoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  lineCount: number;
  lines: string[];
  zone?: "topNav" | "stageHero" | "lowerCallout" | "captionSafe";
  startFrame?: number;
  endFrame?: number;
}

export interface LayoutCollision {
  boxIdA: string;
  boxIdB: string;
  overlapX: number;
  overlapY: number;
  zoneA?: string;
  zoneB?: string;
}

export interface LayoutOverflow {
  boxId: string;
  boundary: "left" | "right" | "top" | "bottom" | "maxLines" | "zone";
  exceededBy: number;
  details: string;
}

export interface LayoutValidationResult {
  valid: boolean;
  collisions: LayoutCollision[];
  overflows: LayoutOverflow[];
}

/**
 * Calculates approximate character width for high-clarity sans-serif typography.
 * Uses a weighted glyph width estimation model.
 */
export function estimateCharacterWidth(char: string, fontSize: number): number {
  if ("ijl|.,:;'! ".includes(char)) return fontSize * 0.28;
  if ("fkt()[]{}".includes(char)) return fontSize * 0.38;
  if ("mwMW@#%&".includes(char)) return fontSize * 0.85;
  if (char >= "A" && char <= "Z") return fontSize * 0.65;
  return fontSize * 0.53;
}

/**
 * Measures the pixel width of a single text line based on character proportions.
 */
export function measureLineWidth(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    width += estimateCharacterWidth(text[i], fontSize);
  }
  return Math.ceil(width);
}

/**
 * Greedily wraps words into multiple lines such that no line exceeds maxWidth.
 */
export function wrapTextToLines(text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${currentLine} ${words[i]}`;
    const candidateWidth = measureLineWidth(candidate, fontSize);

    if (candidateWidth <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Calculates the bounding box dimensions of text wrapped within a container.
 */
export function calculateTextDimensions(
  text: string,
  fontSize: number,
  maxWidth: number,
  lineHeightMultiplier = 1.35
): { width: number; height: number; lines: string[]; lineCount: number } {
  const lines = wrapTextToLines(text, fontSize, maxWidth);
  let maxLineWidth = 0;
  for (const line of lines) {
    const w = measureLineWidth(line, fontSize);
    if (w > maxLineWidth) maxLineWidth = w;
  }
  const lineHeight = Math.round(fontSize * lineHeightMultiplier);
  const totalHeight = lines.length * lineHeight;

  return {
    width: Math.min(maxWidth, maxLineWidth),
    height: totalHeight,
    lines,
    lineCount: lines.length,
  };
}

/**
 * Iteratively calculates the optimal font size between minFontSize and maxFontSize
 * that allows text to fit within maxWidth and maxLines without clipping.
 */
export function calculateOptimalFontSize(
  text: string,
  maxFontSize: number,
  minFontSize: number,
  maxWidth: number,
  maxLines: number,
  lineHeightMultiplier = 1.35
): { fontSize: number; width: number; height: number; lines: string[]; lineCount: number } {
  let currentSize = maxFontSize;

  while (currentSize >= minFontSize) {
    const dims = calculateTextDimensions(text, currentSize, maxWidth, lineHeightMultiplier);
    if (dims.lineCount <= maxLines && dims.width <= maxWidth) {
      return {
        fontSize: currentSize,
        width: dims.width,
        height: dims.height,
        lines: dims.lines,
        lineCount: dims.lineCount,
      };
    }
    currentSize -= 2; // Step down by 2px
  }

  // Fallback to minFontSize
  const dims = calculateTextDimensions(text, minFontSize, maxWidth, lineHeightMultiplier);
  return {
    fontSize: minFontSize,
    width: dims.width,
    height: dims.height,
    lines: dims.lines,
    lineCount: dims.lineCount,
  };
}

/**
 * Checks whether two 2D axis-aligned bounding boxes intersect with an optional safety margin.
 * Elements that are active during completely disjoint time frames do not collide.
 */
export function doBoxesOverlap(boxA: TextBoundingBox, boxB: TextBoundingBox, margin = 8): boolean {
  // Check temporal overlap if time bounds are provided
  if (
    boxA.startFrame !== undefined &&
    boxA.endFrame !== undefined &&
    boxB.startFrame !== undefined &&
    boxB.endFrame !== undefined
  ) {
    if (boxA.endFrame <= boxB.startFrame || boxB.endFrame <= boxA.startFrame) {
      return false; // Temporally disjoint, cannot collide
    }
  }

  const aLeft = boxA.x - margin;
  const aRight = boxA.x + boxA.width + margin;
  const aTop = boxA.y - margin;
  const aBottom = boxA.y + boxA.height + margin;

  const bLeft = boxB.x - margin;
  const bRight = boxB.x + boxB.width + margin;
  const bTop = boxB.y - margin;
  const bBottom = boxB.y + boxB.height + margin;

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}

/**
 * Computes overlap metrics between two intersecting boxes.
 */
export function calculateBoxCollision(boxA: TextBoundingBox, boxB: TextBoundingBox, margin = 8): LayoutCollision | null {
  if (!doBoxesOverlap(boxA, boxB, margin)) return null;

  const overlapX = Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x);
  const overlapY = Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y);

  return {
    boxIdA: boxA.id,
    boxIdB: boxB.id,
    overlapX: Math.max(0, overlapX),
    overlapY: Math.max(0, overlapY),
    zoneA: boxA.zone,
    zoneB: boxB.zone,
  };
}

/**
 * Validates a complete scene layout specification against frame bounds, safe margins,
 * zone restrictions, and element-element collisions.
 */
export function validateSceneTextLayout(boxes: TextBoundingBox[]): LayoutValidationResult {
  const collisions: LayoutCollision[] = [];
  const overflows: LayoutOverflow[] = [];

  // 1. Boundary & Safe Area Checks
  for (const box of boxes) {
    if (box.x < SAFE_MARGINS.left) {
      overflows.push({
        boxId: box.id,
        boundary: "left",
        exceededBy: SAFE_MARGINS.left - box.x,
        details: `Element '${box.id}' left edge (${box.x}px) violates left safe margin (${SAFE_MARGINS.left}px).`,
      });
    }

    if (box.x + box.width > CANVAS_WIDTH - SAFE_MARGINS.right) {
      overflows.push({
        boxId: box.id,
        boundary: "right",
        exceededBy: box.x + box.width - (CANVAS_WIDTH - SAFE_MARGINS.right),
        details: `Element '${box.id}' right edge (${box.x + box.width}px) exceeds right safe margin (${CANVAS_WIDTH - SAFE_MARGINS.right}px).`,
      });
    }

    if (box.y < SAFE_MARGINS.top) {
      overflows.push({
        boxId: box.id,
        boundary: "top",
        exceededBy: SAFE_MARGINS.top - box.y,
        details: `Element '${box.id}' top edge (${box.y}px) violates top safe margin (${SAFE_MARGINS.top}px).`,
      });
    }

    if (box.y + box.height > CANVAS_HEIGHT - SAFE_MARGINS.bottom) {
      overflows.push({
        boxId: box.id,
        boundary: "bottom",
        exceededBy: box.y + box.height - (CANVAS_HEIGHT - SAFE_MARGINS.bottom),
        details: `Element '${box.id}' bottom edge (${box.y + box.height}px) exceeds bottom safe margin (${CANVAS_HEIGHT - SAFE_MARGINS.bottom}px).`,
      });
    }

    // Zone clearance rule: Callouts must never penetrate into the caption zone
    if (box.zone === "lowerCallout" && box.y + box.height > LAYOUT_ZONES.captionSafe.top) {
      overflows.push({
        boxId: box.id,
        boundary: "zone",
        exceededBy: box.y + box.height - LAYOUT_ZONES.captionSafe.top,
        details: `Lower callout '${box.id}' (${box.y + box.height}px) breaches caption clearance boundary (${LAYOUT_ZONES.captionSafe.top}px).`,
      });
    }
  }

  // 2. Pairwise Collision Checks
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const collision = calculateBoxCollision(boxes[i], boxes[j]);
      if (collision) {
        collisions.push(collision);
      }
    }
  }

  return {
    valid: collisions.length === 0 && overflows.length === 0,
    collisions,
    overflows,
  };
}

/**
 * Resolves vertical positions for an array of boxes to stack them cleanly
 * with guaranteed gap spacing and zero vertical overlap.
 */
export function resolveVerticalStack(
  boxes: Array<{ id: string; height: number; width?: number; x?: number }>,
  startY: number,
  gap = 16,
  maxBottom = 1620
): Array<{ id: string; x: number; y: number; width: number; height: number }> {
  let currentY = startY;
  const placed: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

  for (const item of boxes) {
    const width = item.width ?? SAFE_MARGINS.maxWidth;
    const x = item.x ?? SAFE_MARGINS.left;
    placed.push({
      id: item.id,
      x,
      y: currentY,
      width,
      height: item.height,
    });
    currentY += item.height + gap;
  }

  // If stack exceeds maxBottom, scale down gaps or report overflow
  return placed;
}

