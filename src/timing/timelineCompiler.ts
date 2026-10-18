import {
  type StoryboardPlan,
  type StoryboardScene,
  type AnimationEvent,
  validatePlan,
} from "../contracts/plan.js";
import {
  type CompiledTimeline,
  type CompiledScene,
  type ResolvedAnimationEvent,
  TIMELINE_SCHEMA_VERSION,
  TIMELINE_COMPILER_VERSION,
  validateTimeline,
} from "../contracts/timeline.js";
import type { SceneSpeechArtifact } from "../contracts/alignment.js";
import { hashCanonicalJson } from "../pipeline/canonicalHash.js";
import {
  groupWordsIntoCaptions,
  type BlockTiming,
  type WordTiming,
} from "./captionGrouper.js";
import {
  mapAlignmentToBlockTimings,
  resolvePhraseTimingFromBlock,
} from "./alignmentMapper.js";
import { resolveLegacyVariant, validateVisualSelection } from "../video/registry/index.js";

export interface CompileOptions {
  fps?: number;
  width?: number;
  height?: number;
  now?: Date;
  speechArtifacts?: Map<string, SceneSpeechArtifact> | Record<string, SceneSpeechArtifact>;
}

export function compilePlanTimeline(
  plan: StoryboardPlan,
  options: CompileOptions = {}
): CompiledTimeline {
  const validation = validatePlan(plan);
  if (!validation.success) {
    throw new Error(`Cannot compile timeline from invalid plan: ${validation.issues.map((i) => i.message).join(", ")}`);
  }

  const fps = options.fps ?? 30;
  const width = options.width ?? 1080;
  const height = options.height ?? 1920;
  const planHash = hashCanonicalJson(plan);

  const speechMap = options.speechArtifacts instanceof Map
    ? options.speechArtifacts
    : options.speechArtifacts
      ? new Map(Object.entries(options.speechArtifacts))
      : null;

  let currentFrame = 0;
  const compiledScenes: CompiledScene[] = [];
  let isLiveSpeech = false;

  for (const scene of plan.scenes) {
    const sceneStartFrame = currentFrame;
    const speech = speechMap?.get(scene.id);

    let sceneDurationMs: number;
    let blockTimings: BlockTiming[];

    if (speech) {
      isLiveSpeech = true;
      // Actual audio duration plus a comfortable 300ms trailing hold
      sceneDurationMs = speech.durationMs + 300;
      blockTimings = mapAlignmentToBlockTimings(scene, speech.alignment);
    } else {
      sceneDurationMs = scene.estimatedDurationMs;
      blockTimings = calculateBlockTimings(scene);
    }

    const durationInFrames = Math.ceil((sceneDurationMs / 1000) * fps);
    const sceneEndFrame = sceneStartFrame + durationInFrames;

    // Resolve visual animation events
    const resolvedEvents = resolveSceneEvents(
      scene.events,
      blockTimings,
      sceneStartFrame,
      sceneEndFrame,
      fps
    );

    // Generate caption cues
    const captions = groupWordsIntoCaptions(
      blockTimings,
      sceneStartFrame,
      sceneEndFrame,
      fps
    );

    const sceneAudio = speech
      ? {
          isFixture: false,
          audioPath: speech.audioFilename,
          audioBase64: speech.audioBase64,
          alignmentPath: speech.alignmentFilename,
          durationMs: speech.durationMs,
        }
      : {
          isFixture: true,
          durationMs: scene.estimatedDurationMs,
          note: "Silent fixture placeholder audio. Live ElevenLabs narration integration is deferred to P2.",
        };

    const candidateCompiledScene: CompiledScene = {
      sceneId: scene.id,
      type: scene.type,
      startFrame: sceneStartFrame,
      endFrame: sceneEndFrame,
      durationInFrames,
      purpose: scene.purpose,
      onScreenText: [...scene.onScreenText],
      objects: [...scene.objects],
      events: resolvedEvents,
      captions,
      audio: sceneAudio,
      visualVariant: scene.visualVariant,
      visualData: scene.visualData,
    };

    const resolvedVariant = scene.visualVariant ?? resolveLegacyVariant(candidateCompiledScene, plan.topic);
    validateVisualSelection(plan.topic, resolvedVariant);
    candidateCompiledScene.visualVariant = resolvedVariant;

    compiledScenes.push(candidateCompiledScene);

    currentFrame = sceneEndFrame;
  }

  const totalDurationInFrames = currentFrame;
  const totalDurationInSeconds = totalDurationInFrames / fps;

  const timeline: CompiledTimeline = {
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    compilerVersion: TIMELINE_COMPILER_VERSION,
    planHash,
    projectId: plan.projectId,
    versionId: plan.versionId,
    topic: plan.topic,
    voicePreset: plan.voicePreset,
    composition: {
      width,
      height,
      fps,
      durationInFrames: totalDurationInFrames,
      durationInSeconds: totalDurationInSeconds,
    },
    scenes: compiledScenes,
    warnings: [
      ...plan.warnings,
      isLiveSpeech
        ? "Live speech timeline: audio timings and alignments compiled from ElevenLabs narration."
        : "Fixture mode timeline: audio timings are synthesized deterministically from estimated scene durations.",
    ],
    createdAt: (options.now ?? new Date()).toISOString(),
  };

  const timelineValidation = validateTimeline(timeline);
  if (!timelineValidation.success) {
    throw new Error(
      `Compiled timeline failed validation:\n${timelineValidation.issues
        .map((i) => `  - ${i.path}: ${i.message}`)
        .join("\n")}`
    );
  }

  return timeline;
}

function calculateBlockTimings(scene: StoryboardScene): BlockTiming[] {
  const result: BlockTiming[] = [];
  const sceneDurationMs = scene.estimatedDurationMs;

  const totalChars = scene.narration.reduce((sum, b) => sum + b.text.trim().length, 0);
  if (totalChars === 0) return result;

  let currentBlockOffsetMs = 150; // Start margin
  const usableDurationMs = Math.max(500, sceneDurationMs - 350); // Leave 200ms end margin

  for (const block of scene.narration) {
    const text = block.text.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const blockDurationMs = Math.round((text.length / totalChars) * usableDurationMs);
    const wordDurationMs = words.length > 0 ? blockDurationMs / words.length : 0;

    const wordTimings: WordTiming[] = [];
    for (let i = 0; i < words.length; i++) {
      const startMs = Math.round(currentBlockOffsetMs + i * wordDurationMs);
      const endMs = Math.round(currentBlockOffsetMs + (i + 1) * wordDurationMs);
      wordTimings.push({ word: words[i], startMs, endMs });
    }

    result.push({
      blockId: block.id,
      text,
      words: wordTimings,
    });

    currentBlockOffsetMs += blockDurationMs;
  }

  return result;
}

function resolveSceneEvents(
  events: AnimationEvent[],
  blockTimings: BlockTiming[],
  sceneStartFrame: number,
  sceneEndFrame: number,
  fps: number
): ResolvedAnimationEvent[] {
  const resolved: ResolvedAnimationEvent[] = [];

  for (const event of events) {
    const blockTiming = blockTimings.find((b) => b.blockId === event.cue.blockId);
    if (!blockTiming) {
      throw new Error(`Event ${event.id} refers to non-existent block ${event.cue.blockId}`);
    }

    const { startMs: cueStartMs, endMs: cueEndMs } = resolvePhraseTimingFromBlock(
      blockTiming,
      event.cue.phrase,
      event.cue.occurrence
    );

    const resolvedStartMs = Math.max(0, cueStartMs + event.offsetMs);
    const resolvedEndMs = resolvedStartMs + event.durationMs;

    const startRelFrame = Math.floor((resolvedStartMs / 1000) * fps);
    const endRelFrame = Math.ceil((resolvedEndMs / 1000) * fps);

    const absStartFrame = Math.max(sceneStartFrame, Math.min(sceneEndFrame - 1, sceneStartFrame + startRelFrame));
    const absEndFrame = Math.max(absStartFrame + 1, Math.min(sceneEndFrame, sceneStartFrame + endRelFrame));

    resolved.push({
      id: event.id,
      targetId: event.targetId,
      action: event.action,
      startFrame: absStartFrame,
      endFrame: absEndFrame,
      durationFrames: absEndFrame - absStartFrame,
      cuePhrase: event.cue.phrase,
      resolvedStartMs,
      resolvedEndMs,
    });
  }

  return resolved;
}
