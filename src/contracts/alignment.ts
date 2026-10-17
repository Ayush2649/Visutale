export interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ElevenLabsNormalizedAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ElevenLabsTimestampResponse {
  audio_base64: string;
  alignment: ElevenLabsAlignment;
  normalized_alignment?: ElevenLabsNormalizedAlignment;
}

export interface SceneSpeechArtifact {
  sceneId: string;
  voiceId: string;
  modelId: string;
  audioFilename: string;
  audioBase64: string;
  alignmentFilename: string;
  durationMs: number;
  alignment: ElevenLabsAlignment;
  createdAt: string;
}

export interface AlignmentValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAlignment(alignment: unknown): AlignmentValidationResult {
  const errors: string[] = [];
  if (typeof alignment !== "object" || alignment === null || Array.isArray(alignment)) {
    return { valid: false, errors: ["Alignment must be an object."] };
  }

  const rec = alignment as Record<string, unknown>;
  const chars = rec.characters;
  const starts = rec.character_start_times_seconds;
  const ends = rec.character_end_times_seconds;

  if (!Array.isArray(chars) || !Array.isArray(starts) || !Array.isArray(ends)) {
    return {
      valid: false,
      errors: ["Alignment must contain characters, character_start_times_seconds, and character_end_times_seconds arrays."],
    };
  }

  if (chars.length !== starts.length || chars.length !== ends.length) {
    errors.push(
      `Alignment array length mismatch: characters (${chars.length}), starts (${starts.length}), ends (${ends.length}).`
    );
  }

  let prevStart = 0;
  for (let i = 0; i < starts.length; i++) {
    const s = Number(starts[i]);
    const e = Number(ends[i]);

    if (!Number.isFinite(s) || s < 0) {
      errors.push(`Invalid start time at index ${i}: ${starts[i]}`);
    }
    if (!Number.isFinite(e) || e < 0) {
      errors.push(`Invalid end time at index ${i}: ${ends[i]}`);
    }
    if (e < s) {
      errors.push(`End time ${e} is before start time ${s} at index ${i}`);
    }
    if (s < prevStart - 0.001) {
      errors.push(`Decreasing start time detected at index ${i}: ${s} < ${prevStart}`);
    }
    prevStart = s;
  }

  return { valid: errors.length === 0, errors };
}

