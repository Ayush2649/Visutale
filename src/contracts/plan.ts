/**
 * Versioned, renderer-independent storyboard contract.
 *
 * This P0 implementation intentionally uses small explicit runtime validators instead of
 * adding a runtime schema dependency. The contract is application-owned: model output must
 * pass through validatePlan() and validatePlanSemantics() before it can reach a renderer.
 */

export const PLAN_SCHEMA_VERSION = "1.0" as const;

export const SCENE_TYPES = [
  "title-hook",
  "labeled-diagram",
  "process-flow",
  "comparison",
  "timeline",
  "chart",
  "step-sequence",
  "takeaway",
] as const;

export const VOICE_PRESETS = ["indian-english-male", "indian-english-female"] as const;

// The registry is deliberately finite. A planner cannot introduce arbitrary component types.
export const VISUAL_OBJECT_KINDS = [
  "label",
  "text",
  "icon",
  "arrow",
  "shape",
  "node",
  "connector",
  "bar",
  "container",
] as const;

export const ANIMATION_ACTIONS = ["reveal", "emphasize", "move", "connect", "highlight"] as const;

export type SceneType = (typeof SCENE_TYPES)[number];
export type VoicePreset = (typeof VOICE_PRESETS)[number];
export type VisualObjectKind = (typeof VISUAL_OBJECT_KINDS)[number];
export type AnimationAction = (typeof ANIMATION_ACTIONS)[number];

export interface PlanSource {
  id: string;
  text: string;
}

export interface NarrationBlock {
  id: string;
  text: string;
  /** Optional approved spoken form for provider-specific pronunciation normalization. */
  pronunciationText?: string;
  /** Optional on-screen/display form, retained independently from spoken text. */
  displayText?: string;
}

export interface VisualObject {
  id: string;
  kind: VisualObjectKind;
  label: string;
}

export interface PhraseCue {
  blockId: string;
  phrase: string;
  /** 1-based occurrence when the phrase appears more than once. */
  occurrence: number;
}

export interface AnimationEvent {
  id: string;
  targetId: string;
  action: AnimationAction;
  cue: PhraseCue;
  offsetMs: number;
  durationMs: number;
}

export interface StoryboardScene {
  id: string;
  type: SceneType;
  purpose: string;
  estimatedDurationMs: number;
  narration: NarrationBlock[];
  objects: VisualObject[];
  events: AnimationEvent[];
  onScreenText: string[];
  /** Stable IDs of user-provided notes relevant to this scene. */
  sourceRefs: string[];
}

export interface StoryboardPlan {
  schemaVersion: typeof PLAN_SCHEMA_VERSION;
  projectId: string;
  ownerId: string;
  versionId: string;
  parentVersionId: string | null;
  topic: string;
  audience: string;
  learningObjective: string;
  language: "en";
  voicePreset: VoicePreset;
  sources: PlanSource[];
  scenes: StoryboardScene[];
  warnings: string[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type PlanValidationResult =
  | { success: true; data: StoryboardPlan; issues: [] }
  | { success: false; issues: ValidationIssue[] };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: UnknownRecord, allowed: readonly string[], path: string, issues: ValidationIssue[]): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) issues.push({ path: `${path}.${key}`, message: "Unknown field is not allowed." });
  }
}

function readString(value: unknown, path: string, issues: ValidationIssue[], options: { optional?: boolean } = {}): string | undefined {
  if (value === undefined && options.optional) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "Expected a non-empty string." });
    return undefined;
  }
  return value;
}

function readStringArray(value: unknown, path: string, issues: ValidationIssue[]): string[] {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Expected an array of strings." });
    return [];
  }
  return value.map((entry, index) => readString(entry, `${path}[${index}]`, issues) ?? "");
}

function readInteger(value: unknown, path: string, issues: ValidationIssue[], minimum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || !Number.isFinite(value)) {
    issues.push({ path, message: `Expected an integer greater than or equal to ${minimum}.` });
    return minimum;
  }
  return value;
}

function readArray(value: unknown, path: string, issues: ValidationIssue[]): unknown[] {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Expected an array." });
    return [];
  }
  return value;
}

function readId(value: unknown, path: string, issues: ValidationIssue[]): string {
  const id = readString(value, path, issues) ?? "invalid-id";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) {
    issues.push({ path, message: "IDs may contain letters, numbers, underscores, and hyphens only." });
  }
  return id;
}

function readOptionalString(value: unknown, path: string, issues: ValidationIssue[]): string | undefined {
  return readString(value, path, issues, { optional: true });
}

export function validatePlan(input: unknown): PlanValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { success: false, issues: [{ path: "$", message: "Expected a plan object." }] };

  hasOnlyKeys(input, ["schemaVersion", "projectId", "ownerId", "versionId", "parentVersionId", "topic", "audience", "learningObjective", "language", "voicePreset", "sources", "scenes", "warnings"], "$", issues);

  if (input.schemaVersion !== PLAN_SCHEMA_VERSION) {
    issues.push({ path: "schemaVersion", message: `Expected schema version ${PLAN_SCHEMA_VERSION}.` });
  }
  if (input.language !== "en") issues.push({ path: "language", message: "V1 supports English only (language code 'en')." });
  if (!VOICE_PRESETS.includes(input.voicePreset as VoicePreset)) {
    issues.push({ path: "voicePreset", message: `Expected one of: ${VOICE_PRESETS.join(", ")}.` });
  }
  if (input.parentVersionId !== null && typeof input.parentVersionId !== "string") {
    issues.push({ path: "parentVersionId", message: "Expected a string or null." });
  }

  const sources = readArray(input.sources, "sources", issues).map((raw, index): PlanSource => {
    const path = `sources[${index}]`;
    if (!isRecord(raw)) {
      issues.push({ path, message: "Expected a source object." });
      return { id: "invalid-source", text: "invalid" };
    }
    hasOnlyKeys(raw, ["id", "text"], path, issues);
    return {
      id: readId(raw.id, `${path}.id`, issues),
      text: readString(raw.text, `${path}.text`, issues) ?? "",
    };
  });

  const scenes = readArray(input.scenes, "scenes", issues).map((raw, index): StoryboardScene => {
    const path = `scenes[${index}]`;
    if (!isRecord(raw)) {
      issues.push({ path, message: "Expected a scene object." });
      return emptyScene();
    }
    hasOnlyKeys(raw, ["id", "type", "purpose", "estimatedDurationMs", "narration", "objects", "events", "onScreenText", "sourceRefs"], path, issues);

    if (!SCENE_TYPES.includes(raw.type as SceneType)) {
      issues.push({ path: `${path}.type`, message: `Unsupported scene type. Use: ${SCENE_TYPES.join(", ")}.` });
    }

    const narration = readArray(raw.narration, `${path}.narration`, issues).map((blockRaw, blockIndex): NarrationBlock => {
      const blockPath = `${path}.narration[${blockIndex}]`;
      if (!isRecord(blockRaw)) {
        issues.push({ path: blockPath, message: "Expected a narration block." });
        return { id: "invalid-block", text: "invalid" };
      }
      hasOnlyKeys(blockRaw, ["id", "text", "pronunciationText", "displayText"], blockPath, issues);
      const block: NarrationBlock = {
        id: readId(blockRaw.id, `${blockPath}.id`, issues),
        text: readString(blockRaw.text, `${blockPath}.text`, issues) ?? "",
      };
      const pronunciationText = readOptionalString(blockRaw.pronunciationText, `${blockPath}.pronunciationText`, issues);
      const displayText = readOptionalString(blockRaw.displayText, `${blockPath}.displayText`, issues);
      if (pronunciationText !== undefined) block.pronunciationText = pronunciationText;
      if (displayText !== undefined) block.displayText = displayText;
      return block;
    });

    const objects = readArray(raw.objects, `${path}.objects`, issues).map((objectRaw, objectIndex): VisualObject => {
      const objectPath = `${path}.objects[${objectIndex}]`;
      if (!isRecord(objectRaw)) {
        issues.push({ path: objectPath, message: "Expected a visual object." });
        return { id: "invalid-object", kind: "shape", label: "invalid" };
      }
      hasOnlyKeys(objectRaw, ["id", "kind", "label"], objectPath, issues);
      if (!VISUAL_OBJECT_KINDS.includes(objectRaw.kind as VisualObjectKind)) {
        issues.push({ path: `${objectPath}.kind`, message: `Unsupported visual object kind. Use: ${VISUAL_OBJECT_KINDS.join(", ")}.` });
      }
      return {
        id: readId(objectRaw.id, `${objectPath}.id`, issues),
        kind: VISUAL_OBJECT_KINDS.includes(objectRaw.kind as VisualObjectKind) ? objectRaw.kind as VisualObjectKind : "shape",
        label: readString(objectRaw.label, `${objectPath}.label`, issues) ?? "",
      };
    });

    const events = readArray(raw.events, `${path}.events`, issues).map((eventRaw, eventIndex): AnimationEvent => {
      const eventPath = `${path}.events[${eventIndex}]`;
      if (!isRecord(eventRaw)) {
        issues.push({ path: eventPath, message: "Expected an animation event." });
        return emptyEvent();
      }
      hasOnlyKeys(eventRaw, ["id", "targetId", "action", "cue", "offsetMs", "durationMs"], eventPath, issues);
      if (!ANIMATION_ACTIONS.includes(eventRaw.action as AnimationAction)) {
        issues.push({ path: `${eventPath}.action`, message: `Unsupported action. Use: ${ANIMATION_ACTIONS.join(", ")}.` });
      }
      let cue: PhraseCue = { blockId: "invalid-block", phrase: "invalid", occurrence: 1 };
      if (!isRecord(eventRaw.cue)) {
        issues.push({ path: `${eventPath}.cue`, message: "Expected a phrase cue object." });
      } else {
        hasOnlyKeys(eventRaw.cue, ["blockId", "phrase", "occurrence"], `${eventPath}.cue`, issues);
        cue = {
          blockId: readId(eventRaw.cue.blockId, `${eventPath}.cue.blockId`, issues),
          phrase: readString(eventRaw.cue.phrase, `${eventPath}.cue.phrase`, issues) ?? "",
          occurrence: readInteger(eventRaw.cue.occurrence, `${eventPath}.cue.occurrence`, issues, 1),
        };
      }
      return {
        id: readId(eventRaw.id, `${eventPath}.id`, issues),
        targetId: readId(eventRaw.targetId, `${eventPath}.targetId`, issues),
        action: ANIMATION_ACTIONS.includes(eventRaw.action as AnimationAction) ? eventRaw.action as AnimationAction : "reveal",
        cue,
        offsetMs: readInteger(eventRaw.offsetMs, `${eventPath}.offsetMs`, issues, 0),
        durationMs: readInteger(eventRaw.durationMs, `${eventPath}.durationMs`, issues, 1),
      };
    });

    return {
      id: readId(raw.id, `${path}.id`, issues),
      type: SCENE_TYPES.includes(raw.type as SceneType) ? raw.type as SceneType : "labeled-diagram",
      purpose: readString(raw.purpose, `${path}.purpose`, issues) ?? "",
      estimatedDurationMs: readInteger(raw.estimatedDurationMs, `${path}.estimatedDurationMs`, issues, 1),
      narration,
      objects,
      events,
      onScreenText: readStringArray(raw.onScreenText, `${path}.onScreenText`, issues),
      sourceRefs: readStringArray(raw.sourceRefs, `${path}.sourceRefs`, issues),
    };
  });

  const warnings = readStringArray(input.warnings, "warnings", issues);
  const plan: StoryboardPlan = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    projectId: readId(input.projectId, "projectId", issues),
    ownerId: readId(input.ownerId, "ownerId", issues),
    versionId: readId(input.versionId, "versionId", issues),
    parentVersionId: input.parentVersionId === null ? null : readId(input.parentVersionId, "parentVersionId", issues),
    topic: readString(input.topic, "topic", issues) ?? "",
    audience: readString(input.audience, "audience", issues) ?? "",
    learningObjective: readString(input.learningObjective, "learningObjective", issues) ?? "",
    language: "en",
    voicePreset: VOICE_PRESETS.includes(input.voicePreset as VoicePreset) ? input.voicePreset as VoicePreset : "indian-english-female",
    sources,
    scenes,
    warnings,
  };

  if (scenes.length === 0) issues.push({ path: "scenes", message: "A plan must contain at least one scene." });
  issues.push(...validatePlanSemantics(plan));

  return issues.length === 0 ? { success: true, data: plan, issues: [] } : { success: false, issues };
}

function emptyScene(): StoryboardScene {
  return { id: "invalid-scene", type: "labeled-diagram", purpose: "invalid", estimatedDurationMs: 1, narration: [], objects: [], events: [], onScreenText: [], sourceRefs: [] };
}

function emptyEvent(): AnimationEvent {
  return { id: "invalid-event", targetId: "invalid-object", action: "reveal", cue: { blockId: "invalid-block", phrase: "invalid", occurrence: 1 }, offsetMs: 0, durationMs: 1 };
}

function countPhraseOccurrences(text: string, phrase: string): number {
  if (!phrase.trim()) return 0;
  const haystack = text.toLocaleLowerCase();
  const needle = phrase.toLocaleLowerCase();
  let count = 0;
  let cursor = 0;
  while (true) {
    const index = haystack.indexOf(needle, cursor);
    if (index < 0) return count;
    count += 1;
    cursor = index + Math.max(1, needle.length);
  }
}

export function validatePlanSemantics(plan: StoryboardPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sceneIds = new Set<string>();
  const narrationIds = new Set<string>();
  const sourceIds = new Set<string>();

  plan.sources.forEach((source, index) => {
    if (sourceIds.has(source.id)) issues.push({ path: `sources[${index}].id`, message: `Duplicate source ID '${source.id}'.` });
    sourceIds.add(source.id);
  });

  plan.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `scenes[${sceneIndex}]`;
    if (sceneIds.has(scene.id)) issues.push({ path: `${scenePath}.id`, message: `Duplicate scene ID '${scene.id}'.` });
    sceneIds.add(scene.id);
    if (scene.narration.length === 0) issues.push({ path: `${scenePath}.narration`, message: "Every scene must contain narration." });
    scene.sourceRefs.forEach((sourceId, sourceIndex) => {
      if (!sourceIds.has(sourceId)) issues.push({ path: `${scenePath}.sourceRefs[${sourceIndex}]`, message: `Source reference '${sourceId}' does not exist in plan.sources.` });
    });

    const blockById = new Map<string, NarrationBlock>();
    scene.narration.forEach((block, blockIndex) => {
      if (narrationIds.has(block.id)) issues.push({ path: `${scenePath}.narration[${blockIndex}].id`, message: `Duplicate narration block ID '${block.id}'.` });
      narrationIds.add(block.id);
      blockById.set(block.id, block);
    });

    const objectIds = new Set<string>();
    scene.objects.forEach((object, objectIndex) => {
      if (objectIds.has(object.id)) issues.push({ path: `${scenePath}.objects[${objectIndex}].id`, message: `Duplicate object ID '${object.id}' in this scene.` });
      objectIds.add(object.id);
    });

    const eventIds = new Set<string>();
    scene.events.forEach((event, eventIndex) => {
      const eventPath = `${scenePath}.events[${eventIndex}]`;
      if (eventIds.has(event.id)) issues.push({ path: `${eventPath}.id`, message: `Duplicate event ID '${event.id}' in this scene.` });
      eventIds.add(event.id);
      if (!objectIds.has(event.targetId)) issues.push({ path: `${eventPath}.targetId`, message: `Target object '${event.targetId}' does not exist in this scene.` });
      const block = blockById.get(event.cue.blockId);
      if (!block) {
        issues.push({ path: `${eventPath}.cue.blockId`, message: `Narration block '${event.cue.blockId}' does not exist in this scene.` });
      } else if (countPhraseOccurrences(block.text, event.cue.phrase) < event.cue.occurrence) {
        issues.push({ path: `${eventPath}.cue`, message: `Phrase '${event.cue.phrase}' occurrence ${event.cue.occurrence} does not resolve in narration block '${block.id}'.` });
      }
    });
  });

  return issues;
}
