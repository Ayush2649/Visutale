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
import { validateTimelineAssetIsolation } from "../storage/assetOwnershipValidator.js";

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

  let isLiveSpeech = false;

  // Pass 1: Compute baseline durations and allocations for each scene.
  // Pass 1: Determine natural scene durations.
  // Each scene accommodates its speech narration with a natural pedagogical trailing hold (800ms)
  // while ensuring speech is never clipped. For fixture mode, use planned estimatedDurationMs.
  const sceneDurationsMs: number[] = [];
  const sceneMinRequiredMs: number[] = [];
  const sceneBlockTimings: BlockTiming[][] = [];

  for (const scene of plan.scenes) {
    const speech = speechMap?.get(scene.id);
    let durationMs: number;
    let minMs: number;
    let blockTimings: BlockTiming[];

    if (speech) {
      isLiveSpeech = true;
      minMs = speech.durationMs + 300;
      // Natural speech duration: spoken duration + comfortable 800ms absorption hold
      durationMs = speech.durationMs + 800;
      blockTimings = mapAlignmentToBlockTimings(scene, speech.alignment);
    } else {
      minMs = Math.min(scene.estimatedDurationMs, 3000);
      durationMs = scene.estimatedDurationMs;
      blockTimings = calculateBlockTimings(scene);
    }

    sceneDurationsMs.push(durationMs);
    sceneMinRequiredMs.push(minMs);
    sceneBlockTimings.push(blockTimings);
  }

  // Convert target durations to frames
  const sceneFrames = sceneDurationsMs.map((ms) => Math.ceil((ms / 1000) * fps));
  let totalFrames = sceneFrames.reduce((sum, f) => sum + f, 0);

  // Guarantee timeline conforms strictly to [1800, 2700] frames (60s to 90s contract)
  const MIN_TIMELINE_FRAMES = 1800;
  const MAX_TIMELINE_FRAMES = 2700;

  if (totalFrames < MIN_TIMELINE_FRAMES && sceneFrames.length > 0) {
    // Distribute shortfall frames evenly across scenes so no scene has dead-air voids
    let shortfall = MIN_TIMELINE_FRAMES - totalFrames;

    // Allocate an extra closing visual hold to the final takeaway/conclusion scene (up to ~75 frames = 2.5s)
    const finalSceneOutroHold = Math.min(shortfall, Math.round(shortfall * 0.25));
    sceneFrames[sceneFrames.length - 1] += finalSceneOutroHold;
    shortfall -= finalSceneOutroHold;

    // Distribute remaining shortfall evenly across all scenes to support active visual demonstrations
    const perSceneShare = Math.floor(shortfall / sceneFrames.length);
    let remainder = shortfall % sceneFrames.length;

    for (let i = 0; i < sceneFrames.length; i++) {
      sceneFrames[i] += perSceneShare + (i < remainder ? 1 : 0);
    }
    totalFrames = MIN_TIMELINE_FRAMES;
  } else if (totalFrames > MAX_TIMELINE_FRAMES && sceneFrames.length > 0) {
    // Compress hold times while ensuring every scene retains at least its minRequiredFrames
    const minFrames = sceneMinRequiredMs.map((ms) => Math.ceil((ms / 1000) * fps));
    const totalMinFrames = minFrames.reduce((sum, f) => sum + f, 0);

    if (totalMinFrames <= MAX_TIMELINE_FRAMES) {
      const excess = totalFrames - MAX_TIMELINE_FRAMES;
      const reduciblePool = totalFrames - totalMinFrames;
      if (reduciblePool > 0) {
        let remainingToDeduct = excess;
        for (let i = 0; i < sceneFrames.length; i++) {
          const reducible = sceneFrames[i] - minFrames[i];
          if (reducible > 0) {
            const deduction = Math.min(
              reducible,
              Math.round((reducible / reduciblePool) * excess)
            );
            sceneFrames[i] -= deduction;
            remainingToDeduct -= deduction;
          }
        }
        if (remainingToDeduct > 0) {
          // Adjust any rounding residual on the last scene with room
          for (let i = sceneFrames.length - 1; i >= 0 && remainingToDeduct > 0; i--) {
            const reducible = sceneFrames[i] - minFrames[i];
            const deduction = Math.min(reducible, remainingToDeduct);
            sceneFrames[i] -= deduction;
            remainingToDeduct -= deduction;
          }
        }
      }
    }
  }

  // Pass 2: Assemble compiled scenes with strictly contiguous frames
  let currentFrame = 0;
  const compiledScenes: CompiledScene[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    const durationInFrames = sceneFrames[i];
    const sceneStartFrame = currentFrame;
    const sceneEndFrame = sceneStartFrame + durationInFrames;
    const speech = speechMap?.get(scene.id);
    const blockTimings = sceneBlockTimings[i];

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

    const resolvedVariant = resolveLegacyVariant(candidateCompiledScene, plan.topic);
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
  validateTimelineAssetIsolation(timeline);

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
