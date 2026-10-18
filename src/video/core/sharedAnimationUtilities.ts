import { interpolate, spring } from "remotion";
import type { CompiledScene } from "../../contracts/timeline.js";

export interface SpringConfigOptions {
  damping?: number;
  mass?: number;
  stiffness?: number;
}

/**
 * Creates a standard spring animation starting at a delay frame offset.
 */
export function createSpring(
  frame: number,
  fps: number,
  startFrameOffset = 0,
  config: SpringConfigOptions = { damping: 14, mass: 0.8, stiffness: 120 }
): number {
  return spring({
    frame: Math.max(0, frame - startFrameOffset),
    fps,
    config,
  });
}

/**
 * Checks whether an animation event with targetId is currently active in the given frame,
 * accounting for the scene's start frame.
 */
export function isEventActiveInScene(
  scene: CompiledScene,
  targetId: string,
  frame: number,
  extraLingerFrames = 20
): boolean {
  return scene.events.some((ev) => {
    const relStart = ev.startFrame - scene.startFrame;
    const relEnd = ev.endFrame - scene.startFrame;
    return ev.targetId === targetId && frame >= relStart && frame <= relEnd + extraLingerFrames;
  });
}

/**
 * Computes progressive spring value for a scene event based on its cue timing.
 */
export function getEventSpringProgress(
  scene: CompiledScene,
  targetId: string,
  frame: number,
  fps: number,
  fallbackDelayOffset = 0,
  config?: SpringConfigOptions
): number {
  const ev = scene.events.find((e) => e.targetId === targetId);
  const startOffset = ev ? Math.max(0, ev.startFrame - scene.startFrame) : fallbackDelayOffset;
  return createSpring(frame, fps, startOffset, config);
}

/**
 * Standard entrance fade and scale for cards.
 */
export function cardEntrance(spr: number): { opacity: number; transform: string } {
  return {
    opacity: interpolate(spr, [0, 1], [0, 1]),
    transform: `scale(${interpolate(spr, [0, 1], [0.93, 1])})`,
  };
}

