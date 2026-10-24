import {
  type AnimationAction,
  type VisualObjectKind,
  ANIMATION_ACTIONS,
  VISUAL_OBJECT_KINDS,
  type StoryboardScene,
  type AnimationEvent,
} from "../contracts/plan.js";

export const VALID_ACTIONS = new Set<string>(ANIMATION_ACTIONS);
export const VALID_OBJECT_KINDS = new Set<string>(VISUAL_OBJECT_KINDS);

/**
 * Canonical Animation Action Aliases.
 * Maps unambiguous semantic aliases, synonyms, and variations to the 5 canonical actions:
 * "reveal", "emphasize", "move", "connect", "highlight".
 */
export const ACTION_ALIASES: Record<string, AnimationAction> = {
  // reveal: making an object appear, fade in, enter, or show on screen
  reveal: "reveal",
  appear: "reveal",
  appearance: "reveal",
  show: "reveal",
  display: "reveal",
  enter: "reveal",
  entry: "reveal",
  fadein: "reveal",
  "fade in": "reveal",
  fade: "reveal",
  popin: "reveal",
  "pop in": "reveal",
  introduce: "reveal",
  introduction: "reveal",
  draw: "reveal",
  spawn: "reveal",
  visible: "reveal",
  present: "reveal",

  // emphasize: drawing attention, zooming, scaling, pulsing, or focusing
  emphasize: "emphasize",
  emphasis: "emphasize",
  focus: "emphasize",
  zoom: "emphasize",
  zoomin: "emphasize",
  "zoom in": "emphasize",
  scale: "emphasize",
  scaleup: "emphasize",
  "scale up": "emphasize",
  pulse: "emphasize",
  bounce: "emphasize",
  enlarge: "emphasize",
  grow: "emphasize",
  pop: "emphasize",
  beat: "emphasize",
  accentuate: "emphasize",

  // move: spatial movement, sliding, panning, shifting, or translating
  move: "move",
  slide: "move",
  slidein: "move",
  "slide in": "move",
  translate: "move",
  shift: "move",
  pan: "move",
  drift: "move",
  float: "move",
  animate: "move",
  travel: "move",
  fly: "move",
  flyin: "move",
  "fly in": "move",
  reposition: "move",
  motion: "move",

  // connect: linking, drawing lines, pointing arrows, or bridging
  connect: "connect",
  link: "connect",
  attach: "connect",
  join: "connect",
  point: "connect",
  arrow: "connect",
  line: "connect",
  bridge: "connect",
  bind: "connect",
  tie: "connect",
  associate: "connect",

  // highlight: illuminating, glowing, coloring, or flashing
  highlight: "highlight",
  glow: "highlight",
  flash: "highlight",
  shine: "highlight",
  color: "highlight",
  tint: "highlight",
  illuminate: "highlight",
  spotlight: "highlight",
  underline: "highlight",
  accent: "highlight",
  brighten: "highlight",
};

/**
 * Visual Object Kind Aliases.
 */
export const KIND_ALIASES: Record<string, VisualObjectKind> = {
  image: "icon",
  img: "icon",
  illustration: "icon",
  graphic: "icon",
  badge: "icon",
  symbol: "icon",
  box: "container",
  card: "container",
  panel: "container",
  group: "container",
  line: "connector",
  path: "connector",
  link: "connector",
  title: "text",
  heading: "text",
  paragraph: "text",
  caption: "label",
  tag: "label",
  rect: "shape",
  rectangle: "shape",
  circle: "shape",
  dot: "shape",
};

/**
 * Normalizes an animation action string.
 * Strips whitespace, delimiters (camelCase, hyphens, underscores), and maps
 * recognized unambiguous aliases to the 5 canonical actions.
 * Returns null if the action cannot be unambiguously mapped.
 */
export function normalizeAnimationAction(rawAction: unknown): AnimationAction | null {
  if (typeof rawAction !== "string") return null;

  const cleaned = rawAction
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase
    .toLowerCase()
    .replace(/[-_]+/g, " ")             // replace hyphens and underscores with spaces
    .replace(/\s+/g, " ")               // collapse whitespace
    .trim();

  if (VALID_ACTIONS.has(cleaned)) {
    return cleaned as AnimationAction;
  }

  return ACTION_ALIASES[cleaned] ?? null;
}

/**
 * Normalizes a visual object kind string.
 */
export function normalizeVisualObjectKind(rawKind: unknown): VisualObjectKind {
  if (typeof rawKind !== "string") return "shape";
  const cleaned = rawKind.trim().toLowerCase();
  if (VALID_OBJECT_KINDS.has(cleaned)) {
    return cleaned as VisualObjectKind;
  }
  return KIND_ALIASES[cleaned] ?? "shape";
}

/**
 * Strips quotes, outer punctuation, and normalizes internal whitespace.
 */
export function cleanPhraseText(phrase: string): string {
  return phrase
    .trim()
    .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "") // remove surrounding quotes
    .replace(/^[.,;:!?\-–—]+|[.,;:!?\-–—]+$/g, "") // remove outer punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches for a phrase in a narration text block, returning the exact verbatim
 * substring in the text and its 1-based occurrence.
 */
export function findPhraseMatch(
  haystack: string,
  needle: string,
  preferredOccurrence = 1
): { matchedSubstring: string; occurrence: number } | null {
  if (!haystack || !needle) return null;

  const hLower = haystack.toLocaleLowerCase();
  const nLower = needle.toLocaleLowerCase();

  const occurrences: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  while (true) {
    const idx = hLower.indexOf(nLower, cursor);
    if (idx < 0) break;
    occurrences.push({ start: idx, end: idx + needle.length });
    cursor = idx + Math.max(1, needle.length);
  }

  if (occurrences.length === 0) return null;

  const occIdx = preferredOccurrence >= 1 && preferredOccurrence <= occurrences.length
    ? preferredOccurrence - 1
    : 0;

  const match = occurrences[occIdx];
  return {
    matchedSubstring: haystack.slice(match.start, match.end),
    occurrence: occIdx + 1,
  };
}

/**
 * Searches for the longest contiguous word sequence (min 2 words) from `phrase`
 * that appears inside `text`.
 */
export function findSubphraseMatch(
  text: string,
  phrase: string
): { matchedSubstring: string; occurrence: number } | null {
  const words = cleanPhraseText(phrase).split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return null;

  // Search from longest word window down to 2 words
  for (let windowSize = words.length; windowSize >= 2; windowSize--) {
    for (let i = 0; i <= words.length - windowSize; i++) {
      const subCandidate = words.slice(i, i + windowSize).join(" ");
      const match = findPhraseMatch(text, subCandidate);
      if (match) {
        return match;
      }
    }
  }

  return null;
}

/**
 * Normalizes and repairs a scene's animation events and visual cues against its narration blocks.
 *
 * Rules:
 * 1. Action normalization: converts recognized aliases to canonical actions; leaves unknown intact for diagnostics.
 * 2. Visual object kinds: normalized to canonical kinds.
 * 3. Event cues:
 *    - First checks if cue phrase matches referenced block verbatim.
 *    - If not, strips quotes/punctuation and rechecks.
 *    - If not, checks other narration blocks in the same scene and remaps blockId.
 *    - If not, searches for a contiguous sub-phrase (>=2 words) in the referenced block or other blocks.
 *    - If the cue phrase is an onScreenText title/header and the event animates an opening object,
 *      aligns cue to the opening words of the narration.
 */
export function normalizeAndRepairScene(
  sceneRecord: Record<string, unknown>,
  validSourceIds: Set<string>
): Record<string, unknown> {
  const rawRefs = Array.isArray(sceneRecord.sourceRefs) ? sceneRecord.sourceRefs : [];
  const filteredRefs = rawRefs.filter((r) => typeof r === "string" && validSourceIds.has(r));

  // 1. Sanitize visual objects strictly to allowed keys: id, kind, label
  const rawObjects = Array.isArray(sceneRecord.objects) ? sceneRecord.objects : [];
  const sanitizedObjects = rawObjects.map((obj: unknown) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
    const objRecord = obj as Record<string, unknown>;
    const kind = typeof objRecord.kind === "string" ? normalizeVisualObjectKind(objRecord.kind) : "shape";
    const id = typeof objRecord.id === "string" ? objRecord.id : "obj";
    const label = typeof objRecord.label === "string" ? objRecord.label : (typeof objRecord.text === "string" ? String(objRecord.text) : "");
    return {
      id,
      kind,
      label,
    };
  });

  // Extract valid narration blocks and sanitize to allowed keys: id, text, pronunciationText, displayText
  const rawNarration = Array.isArray(sceneRecord.narration) ? sceneRecord.narration : [];
  const sanitizedNarration = rawNarration.map((block: unknown) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) return block;
    const blockRecord = block as Record<string, unknown>;
    const res: Record<string, unknown> = {
      id: typeof blockRecord.id === "string" ? blockRecord.id : "nar",
      text: typeof blockRecord.text === "string" ? blockRecord.text : "",
    };
    if (typeof blockRecord.pronunciationText === "string") {
      res.pronunciationText = blockRecord.pronunciationText;
    }
    if (typeof blockRecord.displayText === "string") {
      res.displayText = blockRecord.displayText;
    }
    return res;
  });

  const narrationBlocks: Array<{ id: string; text: string }> = sanitizedNarration
    .filter(
      (b): b is Record<string, unknown> => {
        if (!b || typeof b !== "object") return false;
        const rec = b as Record<string, unknown>;
        return typeof rec.id === "string" && typeof rec.text === "string";
      }
    )
    .map((b) => {
      const rec = b as Record<string, unknown>;
      return { id: String(rec.id), text: String(rec.text) };
    });

  const blockMap = new Map<string, { id: string; text: string }>();
  narrationBlocks.forEach((b) => blockMap.set(b.id, b));

  // Extract onScreenText strings to detect when the model used an on-screen title in cue.phrase
  const onScreenTexts = Array.isArray(sceneRecord.onScreenText)
    ? (sceneRecord.onScreenText.filter((t) => typeof t === "string") as string[])
    : [];

  // 2. Sanitize and repair animation events strictly to allowed keys: id, targetId, action, cue, offsetMs, durationMs
  const rawEvents = Array.isArray(sceneRecord.events) ? sceneRecord.events : [];
  const sanitizedEvents = rawEvents.map((evt: unknown, evtIndex: number) => {
    if (!evt || typeof evt !== "object" || Array.isArray(evt)) return evt;
    const evtRecord = { ...(evt as Record<string, unknown>) };

    // Action normalization
    if (typeof evtRecord.action === "string") {
      const normAction = normalizeAnimationAction(evtRecord.action);
      if (normAction) {
        evtRecord.action = normAction;
      }
      // If normAction is null, leave as-is so validatePlan() produces strict actionable diagnostics
    }

    // Cue normalization and repair
    let cueRecord: Record<string, unknown> = {
      blockId: "invalid-block",
      phrase: "invalid",
      occurrence: 1,
    };

    if (evtRecord.cue && typeof evtRecord.cue === "object" && !Array.isArray(evtRecord.cue)) {
      cueRecord = { ...(evtRecord.cue as Record<string, unknown>) };
      const rawPhrase = typeof cueRecord.phrase === "string" ? cueRecord.phrase : "";
      const rawBlockId = typeof cueRecord.blockId === "string" ? cueRecord.blockId : "";
      const rawOccurrence = typeof cueRecord.occurrence === "number" ? cueRecord.occurrence : 1;

      if (rawPhrase && narrationBlocks.length > 0) {
        let targetBlock = blockMap.get(rawBlockId);
        let resolved = false;

        // Step A: Verbatim check in referenced block
        if (targetBlock) {
          const directMatch = findPhraseMatch(targetBlock.text, rawPhrase, rawOccurrence);
          if (directMatch) {
            cueRecord.phrase = directMatch.matchedSubstring;
            cueRecord.occurrence = directMatch.occurrence;
            resolved = true;
          }
        }

        // Step B: Cleaned phrase (strip quotes, outer punctuation, normalize whitespace)
        if (!resolved && targetBlock) {
          const cleaned = cleanPhraseText(rawPhrase);
          if (cleaned.length > 0) {
            const cleanedMatch = findPhraseMatch(targetBlock.text, cleaned, rawOccurrence);
            if (cleanedMatch) {
              cueRecord.phrase = cleanedMatch.matchedSubstring;
              cueRecord.occurrence = cleanedMatch.occurrence;
              resolved = true;
            }
          }
        }

        // Step C: Check if phrase appears in another narration block in the same scene
        if (!resolved) {
          const cleaned = cleanPhraseText(rawPhrase);
          for (const otherBlock of narrationBlocks) {
            if (targetBlock && otherBlock.id === targetBlock.id) continue;
            const otherMatch = findPhraseMatch(otherBlock.text, cleaned || rawPhrase, rawOccurrence);
            if (otherMatch) {
              cueRecord.blockId = otherBlock.id;
              cueRecord.phrase = otherMatch.matchedSubstring;
              cueRecord.occurrence = otherMatch.occurrence;
              targetBlock = otherBlock;
              resolved = true;
              break;
            }
          }
        }

        // Step D: Contiguous word sequence match (>= 2 words) in referenced block or other blocks
        if (!resolved) {
          const blocksToCheck = targetBlock ? [targetBlock, ...narrationBlocks.filter((b) => b.id !== targetBlock!.id)] : narrationBlocks;
          for (const candidateBlock of blocksToCheck) {
            const subMatch = findSubphraseMatch(candidateBlock.text, rawPhrase);
            if (subMatch) {
              cueRecord.blockId = candidateBlock.id;
              cueRecord.phrase = subMatch.matchedSubstring;
              cueRecord.occurrence = subMatch.occurrence;
              targetBlock = candidateBlock;
              resolved = true;
              break;
            }
          }
        }

        // Step E: OnScreenText / Title cue recovery for opening reveal events
        // If the cue was an on-screen title (e.g. "Why is the Sunset Red?") and this is an opening reveal
        // event (evtIndex === 0 or action === "reveal"), align to the opening spoken words of the block
        if (!resolved && targetBlock) {
          const isOpeningEvent = evtIndex === 0 || evtRecord.action === "reveal" || Number(evtRecord.offsetMs || 0) === 0;
          const cleaned = cleanPhraseText(rawPhrase).toLowerCase();
          const matchesOnScreenText = onScreenTexts.some((ost) => cleanPhraseText(ost).toLowerCase() === cleaned);

          if (isOpeningEvent && matchesOnScreenText) {
            // Select the first 2 to 4 words of the narration block
            const blockWords = targetBlock.text.trim().split(/\s+/).filter((w) => w.length > 0);
            if (blockWords.length >= 2) {
              const takeCount = Math.min(3, blockWords.length);
              const openingCandidate = blockWords.slice(0, takeCount).join(" ");
              const openingMatch = findPhraseMatch(targetBlock.text, openingCandidate, 1);
              if (openingMatch) {
                cueRecord.phrase = openingMatch.matchedSubstring;
                cueRecord.occurrence = 1;
                resolved = true;
              }
            }
          }
        }
      }
    }

    const sanitizedCue: Record<string, unknown> = {
      blockId: cueRecord.blockId,
      phrase: cueRecord.phrase,
      occurrence: cueRecord.occurrence,
    };

    return {
      id: typeof evtRecord.id === "string" ? evtRecord.id : "evt",
      targetId: typeof evtRecord.targetId === "string" ? evtRecord.targetId : "obj",
      action: evtRecord.action,
      cue: sanitizedCue,
      offsetMs: typeof evtRecord.offsetMs === "number" ? evtRecord.offsetMs : 0,
      durationMs: typeof evtRecord.durationMs === "number" ? evtRecord.durationMs : 1000,
    };
  });

  const res: Record<string, unknown> = {
    id: typeof sceneRecord.id === "string" ? sceneRecord.id : "scene",
    type: typeof sceneRecord.type === "string" ? sceneRecord.type : "labeled-diagram",
    purpose: typeof sceneRecord.purpose === "string" ? sceneRecord.purpose : "",
    estimatedDurationMs: typeof sceneRecord.estimatedDurationMs === "number" ? sceneRecord.estimatedDurationMs : 10000,
    narration: sanitizedNarration,
    objects: sanitizedObjects,
    events: sanitizedEvents,
    onScreenText: onScreenTexts,
    sourceRefs: filteredRefs,
  };

  // Normalize visualVariant: trim or remove if empty
  if (typeof sceneRecord.visualVariant === "string") {
    const trimmed = sceneRecord.visualVariant.trim();
    if (trimmed.length > 0) {
      res.visualVariant = trimmed;
    }
  }

  // Ensure visualData is populated with rich data-driven structured parameters
  if (sceneRecord.visualData && typeof sceneRecord.visualData === "object" && !Array.isArray(sceneRecord.visualData)) {
    res.visualData = sceneRecord.visualData as Record<string, unknown>;
  } else {
    // Generate structured default visualData from scene content
    const objList = sanitizedObjects as Array<{ id: string; kind: string; label: string }>;
    const sceneType = String(res.type || "labeled-diagram");
    const scenePurpose = String(res.purpose || "");

    const telemetryMetrics = objList.slice(0, 3).map((o, idx) => ({
      label: o.label.toUpperCase().slice(0, 16),
      value: `${(idx + 1) * 25}%`,
      unit: "",
      statusText: o.kind.toUpperCase(),
      color: ["#38BDF8", "#10B981", "#F59E0B"][idx % 3],
    }));

    res.visualData = {
      theme: "tech-dark",
      headerBadge: {
        category: (onScreenTexts[0] || scenePurpose || sceneType).toUpperCase().slice(0, 36),
        icon: "⚡",
        color: "#38BDF8",
      },
      telemetryMetrics: telemetryMetrics.length > 0 ? telemetryMetrics : [
        { label: "STATUS", value: "OPTIMAL", color: "#10B981", statusText: "Data-Driven" },
        { label: "PRECISION", value: "HIGH", color: "#38BDF8", statusText: "Synchronized" },
        { label: "LATENCY", value: "< 50", unit: "ms", color: "#F59E0B", statusText: "Real-time" },
      ],
      calloutText: onScreenTexts[1] || scenePurpose || "Educational concept demonstration",
    };
  }

  return res;
}

/**
 * Normalizes an entire candidate storyboard plan object before passing into validatePlan().
 */
export function normalizeStoryboardPlan(
  parsedJson: Record<string, unknown>,
  options: {
    topic: string;
    notes?: string;
    voicePreset?: string;
    projectId?: string;
    ownerId?: string;
    versionId?: string;
  }
): Record<string, unknown> {
  const sources: Array<{ id: string; text: string }> = options.notes
    ? [{ id: "src-user-notes", text: options.notes }]
    : [];
  const validSourceIds = new Set(sources.map((s) => s.id));

  const sanitizedScenes = Array.isArray(parsedJson.scenes)
    ? parsedJson.scenes.map((sc: unknown) => {
        if (!sc || typeof sc !== "object" || Array.isArray(sc)) return sc;
        return normalizeAndRepairScene(sc as Record<string, unknown>, validSourceIds);
      })
    : parsedJson.scenes;

  return {
    schemaVersion: "1.0",
    projectId: options.projectId ?? slugify(options.topic),
    ownerId: options.ownerId ?? "local-owner",
    versionId: options.versionId ?? "v1",
    parentVersionId: null,
    topic: parsedJson.topic ?? options.topic,
    audience: parsedJson.audience ?? "General audience seeking clear visual explanation",
    learningObjective: parsedJson.learningObjective ?? `Explain ${options.topic} with clear visual motion graphics`,
    language: "en",
    voicePreset: parsedJson.voicePreset ?? options.voicePreset ?? "indian-english-female",
    sources,
    scenes: sanitizedScenes,
    warnings: Array.isArray(parsedJson.warnings) ? parsedJson.warnings : [],
  };
}

/**
 * Remaps animation event cues when a narration block's text is modified in a revision.
 * Returns the updated events array.
 */
export function remapEventsForNarrationChange(
  events: AnimationEvent[],
  oldText: string,
  newText: string,
  blockId: string
): AnimationEvent[] {
  return events.map((event) => {
    if (event.cue.blockId !== blockId) return event;

    // 1. If old cue phrase is still in new text, update occurrence if needed
    const directMatch = findPhraseMatch(newText, event.cue.phrase);
    if (directMatch) {
      return {
        ...event,
        cue: {
          ...event.cue,
          phrase: directMatch.matchedSubstring,
          occurrence: directMatch.occurrence,
        },
      };
    }

    // 2. Check for contiguous subphrase in new text
    const subMatch = findSubphraseMatch(newText, event.cue.phrase);
    if (subMatch) {
      return {
        ...event,
        cue: {
          ...event.cue,
          phrase: subMatch.matchedSubstring,
          occurrence: subMatch.occurrence,
        },
      };
    }

    // If no match found, keep original so validation can detect and flag the invalid cue
    return event;
  });
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "project"
  );
}
