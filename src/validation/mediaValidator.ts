import { stat } from "node:fs/promises";
import { getVideoMetadata } from "@remotion/renderer";
import type { CompiledTimeline } from "../contracts/timeline.js";
import type { QaReport } from "../contracts/qa.js";

export interface ValidateMediaOptions {
  mp4Path: string;
  timeline: CompiledTimeline;
  runId: string;
  planHash: string;
  now?: Date;
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

  const overallPassed = errors.length === 0;

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
    },
    errors,
    warnings,
  };
}
