import {
  type ElevenLabsTimestampResponse,
  type ElevenLabsAlignment,
  validateAlignment,
} from "../contracts/alignment.js";

export interface SynthesizeSpeechOptions {
  text: string;
  voiceId: string;
  modelId: string;
  apiKey: string;
  maxRetries?: number;
}

export interface SynthesizeSpeechResult {
  audioBuffer: Buffer;
  audioBase64: string;
  alignment: ElevenLabsAlignment;
  durationMs: number;
}

export async function synthesizeSpeechWithElevenLabs(
  options: SynthesizeSpeechOptions
): Promise<SynthesizeSpeechResult> {
  const { text, voiceId, modelId, apiKey, maxRetries = 2 } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("ELEVENLABS_API_KEY is missing or empty.");
  }
  if (!voiceId || voiceId.trim().length === 0) {
    throw new Error("ElevenLabs voiceId is missing or empty.");
  }
  if (!modelId || modelId.trim().length === 0) {
    throw new Error("ELEVENLABS_MODEL is missing or empty.");
  }
  if (!text || text.trim().length === 0) {
    throw new Error("Narration text is empty; cannot synthesize speech.");
  }

  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`;

  const requestBody = {
    text: text.trim(),
    model_id: modelId,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  };

  let attempts = 0;
  let responseData: ElevenLabsTimestampResponse | null = null;

  while (attempts <= maxRetries) {
    attempts++;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail = errorText;
        try {
          const parsed = JSON.parse(errorText) as {
            detail?: { message?: string; status?: string } | string;
            message?: string;
          };
          if (typeof parsed.detail === "object" && parsed.detail?.message) {
            errorDetail = parsed.detail.message;
          } else if (typeof parsed.detail === "string") {
            errorDetail = parsed.detail;
          } else if (parsed.message) {
            errorDetail = parsed.message;
          }
        } catch {
          // use raw text
        }

        if (response.status === 401) {
          throw new Error(`ElevenLabs authentication failed (HTTP 401): ${errorDetail}`);
        }
        if (response.status === 402 || errorText.includes("payment_required") || errorText.includes("paid_plan_required")) {
          throw new Error(`ElevenLabs payment required (HTTP 402): ${errorDetail}`);
        }
        if (response.status === 404) {
          throw new Error(`ElevenLabs voice '${voiceId}' not found (HTTP 404): ${errorDetail}`);
        }

        // Retry transient errors
        if ((response.status === 429 || response.status >= 500) && attempts <= maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempts), 5000);
          await sleep(delayMs);
          continue;
        }

        throw new Error(`ElevenLabs request failed (HTTP ${response.status}): ${errorDetail}`);
      }

      responseData = (await response.json()) as ElevenLabsTimestampResponse;
      break;
    } catch (err: unknown) {
      if (
        attempts > maxRetries ||
        (err instanceof Error &&
          (err.message.includes("authentication failed") ||
            err.message.includes("payment required") ||
            err.message.includes("not found")))
      ) {
        throw err;
      }
      const delayMs = Math.min(1000 * Math.pow(2, attempts), 5000);
      await sleep(delayMs);
    }
  }

  if (!responseData) {
    throw new Error("No response received from ElevenLabs.");
  }

  if (!responseData.audio_base64 || typeof responseData.audio_base64 !== "string") {
    throw new Error("ElevenLabs response did not contain audio_base64.");
  }

  const alignmentValidation = validateAlignment(responseData.alignment);
  if (!alignmentValidation.valid) {
    throw new Error(`Invalid alignment data returned by ElevenLabs:\n${alignmentValidation.errors.join("\n")}`);
  }

  const audioBuffer = Buffer.from(responseData.audio_base64, "base64");
  if (audioBuffer.length === 0) {
    throw new Error("Decoded audio buffer from ElevenLabs is 0 bytes.");
  }

  // Calculate audio duration from alignment end times
  const endTimes = responseData.alignment.character_end_times_seconds;
  const maxEndSeconds = endTimes.length > 0 ? Math.max(...endTimes) : 0;
  const durationMs = Math.round(maxEndSeconds * 1000);

  return {
    audioBuffer,
    audioBase64: responseData.audio_base64,
    alignment: responseData.alignment,
    durationMs,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

