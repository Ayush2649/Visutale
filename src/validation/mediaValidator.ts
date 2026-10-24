import { stat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { getVideoMetadata } from "@remotion/renderer";
import type { CompiledTimeline } from "../contracts/timeline.js";
import type { QaReport, QaSceneVisualReview, QaCreativeCheck } from "../contracts/qa.js";
import { resolveTopicDomain } from "../video/registry/index.js";
import {
  validateSceneTextLayout,
  calculateTextDimensions,
  SAFE_MARGINS,
  LAYOUT_ZONES,
  type TextBoundingBox,
} from "../video/core/layout/textLayoutEngine.js";

export interface ValidateMediaOptions {
  mp4Path: string;
  timeline: CompiledTimeline;
  runId: string;
  planHash: string;
  now?: Date;
  previewFramesDir?: string;
}

function analyzePngBuffer(buf: Buffer): { blackPixelPercentage: number; whiteCardPixelPercentage: number } {
  try {
    let pos = 8;
    const idatChunks: Buffer[] = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString("ascii", pos + 4, pos + 8);
      if (type === "IDAT") {
        idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
      }
      pos += 12 + len;
    }
    if (idatChunks.length === 0) return { blackPixelPercentage: 0, whiteCardPixelPercentage: 0 };
    const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
    let blackCount = 0;
    let whiteCount = 0;
    let totalPixels = 0;
    const stride = 1080 * 4 + 1;
    for (let y = 0; y < 1920; y += 4) {
      const rowStart = y * stride + 1;
      for (let x = 0; x < 1080; x += 4) {
        const idx = rowStart + x * 4;
        if (idx + 2 < decompressed.length) {
          const r = decompressed[idx];
          const g = decompressed[idx + 1];
          const b = decompressed[idx + 2];
          totalPixels++;
          if (r < 25 && g < 25 && b < 30) blackCount++;
          if (r > 235 && g > 235 && b > 235) whiteCount++;
        }
      }
    }
    if (totalPixels === 0) return { blackPixelPercentage: 0, whiteCardPixelPercentage: 0 };
    return {
      blackPixelPercentage: Number(((blackCount / totalPixels) * 100).toFixed(1)),
      whiteCardPixelPercentage: Number(((whiteCount / totalPixels) * 100).toFixed(1)),
    };
  } catch {
    return { blackPixelPercentage: 0, whiteCardPixelPercentage: 0 };
  }
}

export async function validateRenderOutput(
  options: ValidateMediaOptions
): Promise<QaReport> {
  const { mp4Path, timeline, runId, planHash } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. File checks
  let fileExists = false;
  let sizeBytes = 0;
  try {
    const fileStat = await stat(mp4Path);
    fileExists = true;
    sizeBytes = fileStat.size;
    if (sizeBytes === 0) {
      errors.push("Rendered MP4 file exists but is empty (0 bytes).");
    }
  } catch (err) {
    errors.push(`Rendered MP4 file does not exist at '${mp4Path}'.`);
  }

  // 2. Playback and metadata checks via Remotion's getVideoMetadata
  let canPlayInVideoTag = false;
  let supportsSeeking = false;
  let codec = "unknown";
  let width = 0;
  let height = 0;
  let fps = 0;
  let durationInSeconds = 0;
  let audioCodec: string | null = null;

  if (fileExists && sizeBytes > 0) {
    try {
      const meta = await getVideoMetadata(mp4Path);
      canPlayInVideoTag = Boolean(meta.canPlayInVideoTag);
      supportsSeeking = Boolean(meta.supportsSeeking);
      codec = meta.codec ?? "unknown";
      width = meta.width;
      height = meta.height;
      fps = Math.round(meta.fps);
      durationInSeconds = meta.durationInSeconds != null ? Number(meta.durationInSeconds.toFixed(2)) : 0;
      audioCodec = meta.audioCodec ?? null;

      if (!canPlayInVideoTag) {
        errors.push("Rendered MP4 cannot be decoded or played by standard video players (canPlayInVideoTag is false).");
      }
      if (width !== 1080) {
        errors.push(`Invalid video width: ${width}px (expected 1080px).`);
      }
      if (height !== 1920) {
        errors.push(`Invalid video height: ${height}px (expected 1920px).`);
      }
      if (fps !== 30) {
        errors.push(`Invalid video frame rate: ${fps} fps (expected 30 fps).`);
      }
      if (durationInSeconds < 60 || durationInSeconds > 90) {
        errors.push(`Video duration ${durationInSeconds}s is outside the required 60-90 second range.`);
      }
    } catch (probeError: unknown) {
      const msg = probeError instanceof Error ? probeError.message : String(probeError);
      errors.push(`Failed to probe video file metadata: ${msg}`);
    }
  }

  // 3. Audio track inspection
  const hasAudioTrack = audioCodec !== null;
  const isLiveAudio = timeline.scenes.some((s) => !s.audio.isFixture);
  const isFixtureAudio = !isLiveAudio;
  const audioNote = hasAudioTrack
    ? `Audio track detected (${audioCodec}).`
    : isLiveAudio
      ? "No audio track present in live narrated render."
      : "No audio track present. This is expected for silent fixture runs; live ElevenLabs narration is used in live mode.";

  if (isLiveAudio && !hasAudioTrack) {
    errors.push("Rendered MP4 does not contain an audio track, but live narration was expected.");
  } else if (!hasAudioTrack) {
    warnings.push(audioNote);
  }

  // 4. Timeline continuity checks
  let gapsDetected = 0;
  let overlapsDetected = 0;
  let expectedStart = 0;
  for (let i = 0; i < timeline.scenes.length; i++) {
    const sc = timeline.scenes[i];
    if (sc.startFrame < expectedStart) overlapsDetected++;
    if (sc.startFrame > expectedStart) gapsDetected++;
    expectedStart = sc.endFrame;
  }
  const timelineValid = gapsDetected === 0 && overlapsDetected === 0;
  if (!timelineValid) {
    errors.push(`Timeline continuity failure: ${gapsDetected} gap(s), ${overlapsDetected} overlap(s).`);
  }

  // 5. Captions bounds checks
  let maxLinesPerCue = 0;
  let maxLineLength = 0;
  let totalCaptions = 0;
  for (const sc of timeline.scenes) {
    for (const cue of sc.captions) {
      totalCaptions++;
      const lines = cue.text.split("\n");
      if (lines.length > maxLinesPerCue) maxLinesPerCue = lines.length;
      for (const line of lines) {
        if (line.length > maxLineLength) maxLineLength = line.length;
      }
    }
  }
  const captionsValid = maxLinesPerCue <= 2 && maxLineLength <= 50;
  if (maxLinesPerCue > 2) {
    errors.push(`Caption formatting error: cue exceeds maximum 2 lines (found ${maxLinesPerCue} lines).`);
  }
  if (maxLineLength > 50) {
    errors.push(`Caption formatting error: line length ${maxLineLength} exceeds 50 character limit.`);
  }

  // 6. Creative quality, visual storytelling & audio silence checks
  const silenceIntervals: Array<{
    startSeconds: number;
    endSeconds: number;
    durationSeconds: number;
    sceneId: string;
  }> = [];
  let maxSilenceSeconds = 0;
  const missingRequiredElements: string[] = [];
  const reviewNotes: string[] = [];
  const sceneVisualReview: QaSceneVisualReview[] = [];
  const placeholderOnlyScenes: string[] = [];
  const textOverlapDetails: string[] = [];
  const textOverflowDetails: string[] = [];
  let consecutiveVariantCount = 1;
  let previousVariant = "";
  let excessiveRepetitionDetected = false;

  const topicDomain = resolveTopicDomain(timeline.topic);

  for (let i = 0; i < timeline.scenes.length; i++) {
    const sc = timeline.scenes[i];
    const isLastScene = i === timeline.scenes.length - 1;
    const sceneDurationSec = sc.durationInFrames / (timeline.composition.fps || 30);

    // Track consecutive repetition
    if (sc.visualVariant && sc.visualVariant === previousVariant) {
      consecutiveVariantCount++;
      if (consecutiveVariantCount > 2) {
        excessiveRepetitionDetected = true;
        warnings.push(`Excessive visual repetition: variant '${sc.visualVariant}' repeated across ${consecutiveVariantCount} consecutive scenes.`);
      }
    } else {
      consecutiveVariantCount = 1;
      previousVariant = sc.visualVariant || "";
    }

    if (!sc.audio.isFixture && sc.audio.durationMs != null && sc.audio.durationMs > 0) {
      const speechDurationSec = sc.audio.durationMs / 1000;
      const tailSilenceSec = Math.max(0, sceneDurationSec - speechDurationSec);

      if (tailSilenceSec > maxSilenceSeconds) {
        maxSilenceSeconds = Number(tailSilenceSec.toFixed(2));
      }

      // Flag unexpected long silence if tail silence exceeds 3.5s in non-final scenes
      if (tailSilenceSec > 3.5 && !isLastScene) {
        const startSec = Number(((sc.startFrame / 30) + speechDurationSec).toFixed(2));
        const endSec = Number((sc.endFrame / 30).toFixed(2));
        silenceIntervals.push({
          sceneId: sc.sceneId,
          startSeconds: startSec,
          endSeconds: endSec,
          durationSeconds: Number(tailSilenceSec.toFixed(2)),
        });
        warnings.push(
          `Unexpected long silence (${tailSilenceSec.toFixed(1)}s) detected in scene '${sc.sceneId}' between ${startSec}s and ${endSec}s.`
        );
      }
    }

    // Verify scene has registered visual variant
    if (!sc.visualVariant) {
      missingRequiredElements.push(`Scene '${sc.sceneId}' is missing a registered visualVariant.`);
    }

    // Check for empty or placeholder-only scenes
    const hasVisualObjects = (sc.objects || []).length > 0;
    const hasAnimationEvents = (sc.events || []).length > 0;
    if (!hasVisualObjects && !hasAnimationEvents) {
      placeholderOnlyScenes.push(sc.sceneId);
      warnings.push(`Scene '${sc.sceneId}' has no visual objects or animation events (placeholder-only).`);
    }

    const isDegraded = !sc.visualVariant || sc.visualVariant.startsWith("generic.");
    sceneVisualReview.push({
      sceneId: sc.sceneId,
      visualObjective: sc.purpose || sc.onScreenText[0] || "Educational scene explanation",
      visualVariant: sc.visualVariant || "unspecified",
      domain: topicDomain,
      assetsUsed: (sc.objects || []).map((o) => o.label),
      animationsPerformed: (sc.events || []).map((e) => `${e.targetId} -> ${e.action}`),
      narrationTiming: {
        startMs: sc.captions[0]?.startMs ?? 0,
        durationMs: sc.audio.durationMs ?? 0,
      },
      isDegradedFallback: isDegraded,
      degradedReason: isDegraded
        ? `Fallback to generic presentation card for topic '${timeline.topic ?? "unknown"}'`
        : undefined,
      passed: !isDegraded && hasVisualObjects,
    });

    // 7. System-wide Text Layout, Safe Area & Overlap Validation
    const layoutBoxes: TextBoundingBox[] = [];
    if (sc.onScreenText[0]) {
      const titleDims = calculateTextDimensions(sc.onScreenText[0], 44, SAFE_MARGINS.maxWidth);
      layoutBoxes.push({
        id: `${sc.sceneId}-title`,
        x: SAFE_MARGINS.left,
        y: 130,
        width: titleDims.width,
        height: titleDims.height,
        text: sc.onScreenText[0],
        fontSize: 44,
        lineCount: titleDims.lineCount,
        lines: titleDims.lines,
        zone: "topNav",
        startFrame: sc.startFrame,
        endFrame: sc.endFrame,
      });
    }

    if (sc.onScreenText[1]) {
      const calloutDims = calculateTextDimensions(sc.onScreenText[1], 24, SAFE_MARGINS.maxWidth - 80);
      layoutBoxes.push({
        id: `${sc.sceneId}-callout`,
        x: SAFE_MARGINS.left,
        y: LAYOUT_ZONES.lowerCallout.top + 10,
        width: SAFE_MARGINS.maxWidth,
        height: Math.min(160, Math.max(100, calloutDims.height + 40)),
        text: sc.onScreenText[1],
        fontSize: 24,
        lineCount: calloutDims.lineCount,
        lines: calloutDims.lines,
        zone: "lowerCallout",
        startFrame: sc.startFrame,
        endFrame: sc.endFrame,
      });
    }

    // Add scene captions
    for (const cue of sc.captions || []) {
      const capDims = calculateTextDimensions(cue.text, 36, SAFE_MARGINS.maxWidth - 48);
      layoutBoxes.push({
        id: `${sc.sceneId}-caption-${cue.id}`,
        x: SAFE_MARGINS.left,
        y: LAYOUT_ZONES.captionSafe.top,
        width: SAFE_MARGINS.maxWidth,
        height: Math.min(160, Math.max(80, capDims.height + 32)),
        text: cue.text,
        fontSize: 36,
        lineCount: capDims.lineCount,
        lines: capDims.lines,
        zone: "captionSafe",
        startFrame: cue.startFrame,
        endFrame: cue.endFrame,
      });
    }

    const layoutResult = validateSceneTextLayout(layoutBoxes);
    if (!layoutResult.valid) {
      for (const col of layoutResult.collisions) {
        textOverlapDetails.push(
          `Scene '${sc.sceneId}': text collision between '${col.boxIdA}' and '${col.boxIdB}' (overlap ${col.overlapX}x${col.overlapY}px).`
        );
      }
      for (const ovf of layoutResult.overflows) {
        textOverflowDetails.push(
          `Scene '${sc.sceneId}': overflow on boundary '${ovf.boundary}' for '${ovf.boxId}' (${ovf.details}).`
        );
      }
    }
  }

  if (textOverlapDetails.length > 0) {
    warnings.push(`Text collision defects detected across ${textOverlapDetails.length} elements.`);
  }
  if (textOverflowDetails.length > 0) {
    warnings.push(`Text overflow defects detected across ${textOverflowDetails.length} elements.`);
  }

  // 8. Visual Fallback Policy & Repetition Hard Checks
  if (topicDomain !== "generic") {
    const degradedScenes = sceneVisualReview.filter((s) => s.isDegradedFallback);
    if (degradedScenes.length > 0) {
      errors.push(
        `Visual Fallback Policy Violation: Topic '${timeline.topic}' resolves to domain '${topicDomain}', but ${degradedScenes.length} scenes fell back to generic placeholders (${degradedScenes.map((s) => s.sceneId).join(", ")}).`
      );
    }
  }

  if (excessiveRepetitionDetected) {
    errors.push(
      "Visual Quality Defect: Excessive visual repetition detected across consecutive scenes."
    );
  }

  // 9. Rendered Frame Still Image Inspection (Direct Frame Analysis)
  let frameImageAnalysis: QaCreativeCheck["frameImageAnalysis"] | undefined = undefined;
  let largeEmptyAreasDetected = false;
  let degradedCardLayoutDetected = false;
  const lowVisualDensityScenes: string[] = [];

  if (options.previewFramesDir) {
    try {
      const files = await readdir(options.previewFramesDir);
      const pngFiles = files.filter((f) => f.endsWith(".png")).sort();
      const frameDetails: Array<{
        sceneId: string;
        framePath: string;
        fileSizeBytes: number;
        blackPixelPercentage: number;
        whiteCardPixelPercentage: number;
        passed: boolean;
      }> = [];

      let totalBlackPct = 0;
      let maxBlackPct = 0;

      for (const pngFile of pngFiles) {
        const fullPath = path.join(options.previewFramesDir, pngFile);
        const fStat = await stat(fullPath);
        const buf = await readFile(fullPath);
        const stats = analyzePngBuffer(buf);
        totalBlackPct += stats.blackPixelPercentage;
        if (stats.blackPixelPercentage > maxBlackPct) {
          maxBlackPct = stats.blackPixelPercentage;
        }

        const sceneIdMatch = pngFile.match(/scene-\d+-(.+)\.png/);
        const sceneId = sceneIdMatch ? sceneIdMatch[1] : pngFile;

        // Signature failure mode: >=68% black and small white presentation card in center
        const isDegradedCard = stats.blackPixelPercentage >= 68 && stats.whiteCardPixelPercentage >= 15;
        if (isDegradedCard) {
          degradedCardLayoutDetected = true;
        }

        // Low density or blank scene: >=72% black or file size < 120KB
        const isLowDensity = stats.blackPixelPercentage >= 72 || fStat.size < 120000;
        if (isLowDensity) {
          lowVisualDensityScenes.push(sceneId);
        }

        frameDetails.push({
          sceneId,
          framePath: fullPath,
          fileSizeBytes: fStat.size,
          blackPixelPercentage: stats.blackPixelPercentage,
          whiteCardPixelPercentage: stats.whiteCardPixelPercentage,
          passed: !isDegradedCard && stats.blackPixelPercentage < 70,
        });
      }

      const totalFrames = frameDetails.length;
      const avgBlackPct = totalFrames > 0 ? Number((totalBlackPct / totalFrames).toFixed(1)) : 0;
      if (totalFrames > 0 && avgBlackPct >= 65) {
        largeEmptyAreasDetected = true;
      }

      frameImageAnalysis = {
        totalFramesAnalyzed: totalFrames,
        averageBlackPixelPercentage: avgBlackPct,
        maxBlackPixelPercentage: maxBlackPct,
        largeEmptyAreasDetected,
        degradedCardLayoutDetected,
        lowVisualDensityScenes,
        frameDetails,
      };

      if (largeEmptyAreasDetected) {
        errors.push(
          `Excessive empty black areas detected in rendered video stills (average ${avgBlackPct}% black pixels across frames). Video must contain full-bleed cinematic composition.`
        );
      }
      if (degradedCardLayoutDetected) {
        errors.push(
          `Degraded presentation card layout detected in rendered video frames. Videos must render active visual storytelling, not white cards on black backgrounds.`
        );
      }
    } catch {
      // ignore frame analysis error if preview directory not accessible
    }
  }

  const creativeValid =
    silenceIntervals.length === 0 &&
    missingRequiredElements.length === 0 &&
    !excessiveRepetitionDetected &&
    textOverlapDetails.length === 0 &&
    textOverflowDetails.length === 0 &&
    !largeEmptyAreasDetected &&
    !degradedCardLayoutDetected &&
    (topicDomain === "generic" || !sceneVisualReview.some((s) => s.isDegradedFallback));

  const creativeCheck = {
    valid: creativeValid,
    unexpectedSilenceDetected: silenceIntervals.length > 0,
    maxSilenceIntervalSeconds: maxSilenceSeconds,
    silenceIntervals,
    visualElementsPresent: missingRequiredElements.length === 0,
    missingRequiredElements,
    sceneVisualReview,
    emptySceneDetected: placeholderOnlyScenes.length > 0,
    placeholderOnlyScenes,
    excessiveRepetitionDetected,
    textOverlapDetected: textOverlapDetails.length > 0,
    textOverlapDetails,
    textOverflowDetected: textOverflowDetails.length > 0,
    textOverflowDetails,
    frameImageAnalysis,
    safeAreaCompliant: textOverflowDetails.length === 0,
    humanReviewRecommended: true,
    reviewNotes,
  };

  const overallPassed = errors.length === 0 && creativeCheck.valid;
  if (!creativeCheck.valid && errors.length === 0) {
    errors.push("Creative visual validation failed: Video output did not pass visual quality inspection.");
  }

  return {
    runId,
    planHash,
    validatedAt: (options.now ?? new Date()).toISOString(),
    overallPassed,
    checks: {
      file: {
        exists: fileExists,
        sizeBytes,
        isNonEmpty: sizeBytes > 0,
        path: mp4Path,
      },
      playback: {
        canPlayInVideoTag,
        supportsSeeking,
        codec,
      },
      dimensions: {
        width,
        height,
        expectedWidth: 1080,
        expectedHeight: 1920,
        valid: width === 1080 && height === 1920,
      },
      frameRate: {
        fps,
        expectedFps: 30,
        valid: fps === 30,
      },
      duration: {
        durationInSeconds,
        durationInFrames: Math.round(durationInSeconds * 30),
        minSeconds: 60,
        maxSeconds: 90,
        valid: durationInSeconds >= 60 && durationInSeconds <= 90,
      },
      audio: {
        present: hasAudioTrack,
        codec: audioCodec,
        isFixturePlaceholder: isFixtureAudio,
        note: audioNote,
      },
      timeline: {
        valid: timelineValid,
        sceneCount: timeline.scenes.length,
        gapsDetected,
        overlapsDetected,
      },
      captions: {
        valid: captionsValid,
        totalCaptions,
        maxLinesPerCue,
        maxLineLength,
      },
      creative: creativeCheck,
    },
    errors,
    warnings,
  };
}
