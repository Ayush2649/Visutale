import {
  type AnimationAction,
  type SceneType,
  type VisualObject,
  SCENE_TYPES,
  ANIMATION_ACTIONS,
  type ValidationIssue,
} from "./plan.js";

export const TIMELINE_SCHEMA_VERSION = "1.0" as const;
export const TIMELINE_COMPILER_VERSION = "0.1.0" as const;

export interface CompositionConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  durationInSeconds: number;
}

export interface ResolvedAnimationEvent {
  id: string;
  targetId: string;
  action: AnimationAction;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  cuePhrase: string;
  resolvedStartMs: number;
  resolvedEndMs: number;
}

export interface CaptionCue {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
  startMs: number;
  endMs: number;
}

export interface SceneAudioTrack {
  isFixture: boolean;
  audioPath?: string;
  audioBase64?: string;
  alignmentPath?: string;
  durationMs: number;
  note?: string;
}

export interface CompiledScene {
  sceneId: string;
  type: SceneType;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  purpose: string;
  onScreenText: string[];
  objects: VisualObject[];
  events: ResolvedAnimationEvent[];
  captions: CaptionCue[];
  audio: SceneAudioTrack;
  visualVariant?: string;
  visualData?: Record<string, unknown>;
}

export interface CompiledTimeline {
  schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  compilerVersion: typeof TIMELINE_COMPILER_VERSION;
  planHash: string;
  projectId: string;
  versionId: string;
  topic?: string;
  voicePreset: string;
  composition: CompositionConfig;
  scenes: CompiledScene[];
  warnings: string[];
  createdAt: string;
}

export type TimelineValidationResult =
  | { success: true; data: CompiledTimeline; issues: [] }
  | { success: false; issues: ValidationIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateTimeline(input: unknown): TimelineValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return { success: false, issues: [{ path: "$", message: "Expected a timeline object." }] };
  }

  if (input.schemaVersion !== TIMELINE_SCHEMA_VERSION) {
    issues.push({ path: "schemaVersion", message: `Expected schema version ${TIMELINE_SCHEMA_VERSION}.` });
  }

  if (typeof input.planHash !== "string" || !input.planHash) {
    issues.push({ path: "planHash", message: "Expected a non-empty planHash." });
  }

  if (!isRecord(input.composition)) {
    issues.push({ path: "composition", message: "Expected a composition object." });
  } else {
    const comp = input.composition;
    if (comp.width !== 1080) issues.push({ path: "composition.width", message: "Expected width 1080." });
    if (comp.height !== 1920) issues.push({ path: "composition.height", message: "Expected height 1920." });
    if (comp.fps !== 30) issues.push({ path: "composition.fps", message: "Expected fps 30." });
    if (typeof comp.durationInFrames !== "number" || comp.durationInFrames < 1800 || comp.durationInFrames > 2700) {
      issues.push({
        path: "composition.durationInFrames",
        message: `Duration ${comp.durationInFrames} frames is outside the required 1800-2700 range (60-90s).`,
      });
    }
  }

  if (!Array.isArray(input.scenes) || input.scenes.length === 0) {
    issues.push({ path: "scenes", message: "Timeline must contain at least one scene." });
    return { success: false, issues };
  }

  let expectedStartFrame = 0;
  for (let i = 0; i < input.scenes.length; i++) {
    const sceneRaw = input.scenes[i];
    const scenePath = `scenes[${i}]`;
    if (!isRecord(sceneRaw)) {
      issues.push({ path: scenePath, message: "Expected a scene object." });
      continue;
    }

    if (!SCENE_TYPES.includes(sceneRaw.type as SceneType)) {
      issues.push({ path: `${scenePath}.type`, message: `Unsupported scene type '${sceneRaw.type}'.` });
    }

    const startFrame = Number(sceneRaw.startFrame);
    const endFrame = Number(sceneRaw.endFrame);
    const durationInFrames = Number(sceneRaw.durationInFrames);

    if (startFrame !== expectedStartFrame) {
      issues.push({
        path: `${scenePath}.startFrame`,
        message: `Scene timing gap or overlap detected. Expected startFrame ${expectedStartFrame}, found ${startFrame}.`,
      });
    }

    if (endFrame <= startFrame) {
      issues.push({
        path: `${scenePath}.endFrame`,
        message: `Scene endFrame ${endFrame} must be greater than startFrame ${startFrame}.`,
      });
    }

    if (durationInFrames !== endFrame - startFrame) {
      issues.push({
        path: `${scenePath}.durationInFrames`,
        message: `Scene durationInFrames (${durationInFrames}) does not match endFrame - startFrame (${endFrame - startFrame}).`,
      });
    }

    expectedStartFrame = endFrame;

    if (Array.isArray(sceneRaw.events)) {
      for (let j = 0; j < sceneRaw.events.length; j++) {
        const ev = sceneRaw.events[j];
        const eventPath = `${scenePath}.events[${j}]`;
        if (!isRecord(ev)) continue;
        if (!ANIMATION_ACTIONS.includes(ev.action as AnimationAction)) {
          issues.push({ path: `${eventPath}.action`, message: `Unsupported action '${ev.action}'.` });
        }
        const evStart = Number(ev.startFrame);
        const evEnd = Number(ev.endFrame);
        if (evStart < startFrame || evEnd > endFrame) {
          issues.push({
            path: eventPath,
            message: `Event frames [${evStart}, ${evEnd}] exceed scene frame bounds [${startFrame}, ${endFrame}].`,
          });
        }
      }
    }

    if (Array.isArray(sceneRaw.captions)) {
      let lastCaptionEnd = startFrame;
      for (let k = 0; k < sceneRaw.captions.length; k++) {
        const cap = sceneRaw.captions[k];
        const capPath = `${scenePath}.captions[${k}]`;
        if (!isRecord(cap)) continue;
        const capStart = Number(cap.startFrame);
        const capEnd = Number(cap.endFrame);
        if (capStart < lastCaptionEnd) {
          issues.push({
            path: capPath,
            message: `Caption overlaps with prior caption or starts before scene (start ${capStart} < ${lastCaptionEnd}).`,
          });
        }
        if (capEnd > endFrame) {
          issues.push({
            path: capPath,
            message: `Caption ends at frame ${capEnd}, exceeding scene endFrame ${endFrame}.`,
          });
        }
        lastCaptionEnd = capEnd;
      }
    }
  }

  const comp = isRecord(input.composition) ? input.composition : null;
  if (comp && expectedStartFrame !== comp.durationInFrames) {
    issues.push({
      path: "composition.durationInFrames",
      message: `Total scenes frames (${expectedStartFrame}) does not match composition durationInFrames (${comp.durationInFrames}).`,
    });
  }

  return issues.length === 0
    ? { success: true, data: input as unknown as CompiledTimeline, issues: [] }
    : { success: false, issues };
}

