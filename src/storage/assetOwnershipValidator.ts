import path from "node:path";
import type { CompiledScene, CompiledTimeline } from "../contracts/timeline.js";

export class AssetIsolationError extends Error {
  constructor(message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "AssetIsolationError";
  }
}

/**
 * Validates that an asset path is strictly relative and does not escape the run root.
 */
export function validateRelativeAssetPath(relativePath: string, assetType: string): void {
  if (!relativePath || typeof relativePath !== "string") {
    throw new AssetIsolationError(`Empty or invalid ${assetType} path.`);
  }

  // Reject absolute paths (POSIX and Windows drive letters)
  if (path.isAbsolute(relativePath) || /^[a-zA-Z]:/.test(relativePath)) {
    throw new AssetIsolationError(
      `Illegal absolute path for ${assetType}: '${relativePath}'. Assets must be relative to the run directory.`,
      { relativePath, assetType }
    );
  }

  // Reject path traversal
  const normalized = path.normalize(relativePath);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`) || normalized.startsWith("../")) {
    throw new AssetIsolationError(
      `Cross-run directory escape detected in ${assetType} path: '${relativePath}'.`,
      { relativePath, assetType }
    );
  }
}

/**
 * Validates that a compiled scene strictly references its own dedicated assets
 * and does not point to another scene's or another run's files.
 */
export function validateSceneAssetOwnership(scene: CompiledScene, runId?: string): void {
  if (!scene.audio || scene.audio.isFixture) {
    return; // Fixtures use synthetic placeholder audio without physical disk paths
  }

  const { audioPath, alignmentPath } = scene.audio;

  if (audioPath) {
    validateRelativeAssetPath(audioPath, "audio");

    // Audio file must belong to this specific scene
    const audioBasename = path.basename(audioPath, path.extname(audioPath));
    if (audioBasename !== scene.sceneId) {
      throw new AssetIsolationError(
        `Cross-scene audio reference rejected: Scene '${scene.sceneId}' cannot consume audio asset '${audioPath}' belonging to '${audioBasename}'.`,
        { sceneId: scene.sceneId, audioPath, expectedBasename: scene.sceneId }
      );
    }
  }

  if (alignmentPath) {
    validateRelativeAssetPath(alignmentPath, "alignment");

    // Alignment file must belong to this specific scene
    const alignmentBasename = path.basename(alignmentPath, path.extname(alignmentPath));
    if (alignmentBasename !== scene.sceneId) {
      throw new AssetIsolationError(
        `Cross-scene alignment reference rejected: Scene '${scene.sceneId}' cannot consume alignment asset '${alignmentPath}' belonging to '${alignmentBasename}'.`,
        { sceneId: scene.sceneId, alignmentPath, expectedBasename: scene.sceneId }
      );
    }
  }
}

/**
 * Validates that all scenes in a compiled timeline strictly maintain asset ownership,
 * with zero duplicate or cross-referenced assets across scenes.
 */
export function validateTimelineAssetIsolation(timeline: CompiledTimeline): void {
  const seenAudio = new Map<string, string>(); // normalized path -> sceneId
  const seenAlignment = new Map<string, string>(); // normalized path -> sceneId

  for (const scene of timeline.scenes) {
    validateSceneAssetOwnership(scene, timeline.versionId);

    if (scene.audio && !scene.audio.isFixture) {
      if (scene.audio.audioPath) {
        const normAudio = path.normalize(scene.audio.audioPath).toLowerCase();
        const existingScene = seenAudio.get(normAudio);
        if (existingScene && existingScene !== scene.sceneId) {
          throw new AssetIsolationError(
            `Cross-scene audio collision: Asset '${scene.audio.audioPath}' is claimed by both scene '${existingScene}' and '${scene.sceneId}'.`,
            { path: scene.audio.audioPath, scene1: existingScene, scene2: scene.sceneId }
          );
        }
        seenAudio.set(normAudio, scene.sceneId);
      }

      if (scene.audio.alignmentPath) {
        const normAlign = path.normalize(scene.audio.alignmentPath).toLowerCase();
        const existingScene = seenAlignment.get(normAlign);
        if (existingScene && existingScene !== scene.sceneId) {
          throw new AssetIsolationError(
            `Cross-scene alignment collision: Asset '${scene.audio.alignmentPath}' is claimed by both scene '${existingScene}' and '${scene.sceneId}'.`,
            { path: scene.audio.alignmentPath, scene1: existingScene, scene2: scene.sceneId }
          );
        }
        seenAlignment.set(normAlign, scene.sceneId);
      }
    }
  }
}

/**
 * Computes an isolated, collision-free cache key for any scene-level artifact.
 */
export function computeSceneCacheKey(runId: string, sceneId: string, assetType: string, contentHash: string): string {
  return `${runId}::${sceneId}::${assetType}::${contentHash}`;
}

