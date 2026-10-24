import {
  type StoryboardPlan,
  type VoicePreset,
  validatePlan,
  validatePlanSemantics,
} from "../contracts/plan.js";
import {
  buildPlannerSystemPrompt,
  buildPlannerUserPrompt,
} from "../planning/plannerPrompt.js";
import { normalizeStoryboardPlan } from "../planning/storyboardNormalizer.js";
import {
  ProviderUnavailableError,
  ProviderTimeoutError,
  ModelOutputValidationError,
  RequestValidationError,
  ProviderAuthenticationError,
  ProviderNotFoundError,
} from "./errors.js";

export {
  ProviderUnavailableError,
  ProviderTimeoutError,
  ModelOutputValidationError,
  RequestValidationError,
  ProviderAuthenticationError,
  ProviderNotFoundError,
};

export interface GenerateStoryboardOptions {
  topic: string;
  notes?: string;
  voicePreset?: VoicePreset;
  apiKey: string;
  model: string;
  projectId?: string;
  ownerId?: string;
  versionId?: string;
  maxRetries?: number;
  totalTimeoutMs?: number;
  requestTimeoutMs?: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
      role?: string;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export async function generateStoryboardWithGemini(
  options: GenerateStoryboardOptions
): Promise<StoryboardPlan> {
  const {
    topic,
    notes,
    voicePreset = "indian-english-female",
    apiKey,
    model,
    projectId = slugify(topic),
    ownerId = "local-owner",
    versionId = "v1",
    maxRetries = 3,
    totalTimeoutMs = 240000,
    requestTimeoutMs = 120000,
    fetchFn = globalThis.fetch,
    sleepFn = sleep,
  } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new RequestValidationError("GEMINI_API_KEY is missing or empty.");
  }
  if (!model || model.trim().length === 0) {
    throw new RequestValidationError("GEMINI_MODEL is missing or empty.");
  }

  const systemInstruction = buildPlannerSystemPrompt();
  const userPrompt = buildPlannerUserPrompt(topic, notes, voicePreset);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  const startTime = Date.now();
  let attempts = 0;
  let rawJsonText = "";
  let lastTransientError: Error | null = null;

  while (attempts <= maxRetries) {
    const elapsedMs = Date.now() - startTime;
    const remainingTimeMs = totalTimeoutMs - elapsedMs;
    if (remainingTimeMs < 2000 && attempts > 0) {
      throw new ProviderTimeoutError(
        `Gemini storyboard generation exceeded time budget of ${Math.round(totalTimeoutMs / 1000)}s after ${attempts} attempt(s). Last error: ${lastTransientError?.message || "Time budget exhausted"}`
      );
    }

    attempts++;
    const currentTimeoutMs = Math.min(requestTimeoutMs, Math.max(1000, remainingTimeMs));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), currentTimeoutMs);

    try {
      const response = await fetchFn(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedErrorMsg = `HTTP ${response.status}`;
        let parsedStatus = "";
        try {
          const errObj = JSON.parse(errorText) as { error?: { message?: string; status?: string } };
          if (errObj.error?.message) parsedErrorMsg = errObj.error.message;
          if (errObj.error?.status) parsedStatus = errObj.error.status;
        } catch {
          if (errorText.trim().length > 0) parsedErrorMsg = errorText.slice(0, 300);
        }

        // Fatal non-transient errors (auth, model not found, client request errors)
        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError(`Gemini API authentication failed (HTTP ${response.status}): ${parsedErrorMsg}`);
        }
        if (response.status === 404) {
          throw new ProviderNotFoundError(`Gemini model '${model}' not found (HTTP 404): ${parsedErrorMsg}`);
        }
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new RequestValidationError(`Gemini rejected request (HTTP ${response.status}): ${parsedErrorMsg}`);
        }

        // Transient errors (429, 500, 502, 503, 504) retry with bounded backoff and jitter
        const isTransient = response.status === 429 || response.status >= 500;
        if (isTransient) {
          const errorType = response.status === 429 ? "rate-limited" : "busy/unavailable";
          lastTransientError = new ProviderUnavailableError(
            `Gemini model ${errorType} (HTTP ${response.status}${parsedStatus ? ` - ${parsedStatus}` : ""}): ${parsedErrorMsg}`
          );

          if (attempts > maxRetries) {
            throw lastTransientError;
          }

          // Calculate backoff, respecting Retry-After header if present
          let delayMs = Math.min(1500 * Math.pow(2, attempts - 1), 8000);
          const retryAfterHeader = response.headers?.get?.("retry-after");
          if (retryAfterHeader) {
            const parsedSec = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSec) && parsedSec > 0) {
              delayMs = parsedSec * 1000;
            }
          } else {
            // Apply bounded jitter: +/- 20%
            const jitterFactor = 0.8 + Math.random() * 0.4;
            delayMs = Math.round(delayMs * jitterFactor);
          }

          const remainingBudget = totalTimeoutMs - (Date.now() - startTime);
          if (remainingBudget <= delayMs + 1000) {
            throw new ProviderTimeoutError(
              `Gemini retry deadline exceeded (needed ${delayMs}ms delay, only ${remainingBudget}ms left in budget). Last status: HTTP ${response.status}`
            );
          }

          process.stdout.write(
            `  [Gemini] model="${model}" attempt=${attempts}/${maxRetries} status=${response.status} ${parsedStatus ? `(${parsedStatus}) ` : ""}retryIn=${(delayMs / 1000).toFixed(1)}s: ${parsedErrorMsg}\n`
          );

          await sleepFn(delayMs);
          continue;
        }

        throw new ProviderUnavailableError(`Gemini API request failed (HTTP ${response.status}): ${parsedErrorMsg}`);
      }

      const responseData = (await response.json()) as GeminiApiResponse;
      if (responseData.error) {
        throw new ProviderUnavailableError(`Gemini API error: ${responseData.error.message}`);
      }

      const candidate = responseData.candidates?.[0];
      const partText = candidate?.content?.parts?.[0]?.text;
      if (!partText) {
        throw new ModelOutputValidationError("Gemini response contained no content text.");
      }

      rawJsonText = partText;
      break;
    } catch (err: unknown) {
      if (
        err instanceof ProviderAuthenticationError ||
        err instanceof ProviderNotFoundError ||
        err instanceof RequestValidationError ||
        err instanceof ModelOutputValidationError ||
        err instanceof ProviderTimeoutError
      ) {
        throw err;
      }

      const isAbort = err instanceof Error && err.name === "AbortError";
      const errMessage = isAbort
        ? `Request timed out locally (aborted by client after ${currentTimeoutMs}ms before provider response received)`
        : (err instanceof Error ? err.message : String(err));

      lastTransientError = new ProviderUnavailableError(`Gemini transient network error: ${errMessage}`);

      if (attempts > maxRetries) {
        throw lastTransientError;
      }

      const remainingBudget = totalTimeoutMs - (Date.now() - startTime);
      if (remainingBudget < 3000) {
        throw new ProviderTimeoutError(
          `Gemini request time budget exceeded (${Math.round((Date.now() - startTime) / 1000)}s elapsed). Last error: ${errMessage}`
        );
      }

      let delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      delayMs = Math.round(delayMs * (0.8 + Math.random() * 0.4));
      delayMs = Math.min(delayMs, remainingBudget - 1000);

      process.stdout.write(
        `  [Gemini] model="${model}" attempt=${attempts}/${maxRetries} transient error, retryIn=${(delayMs / 1000).toFixed(1)}s: ${errMessage}\n`
      );

      await sleepFn(delayMs);
    } finally {
      clearTimeout(timer);
    }
  }

  // Parse JSON
  const cleanedJson = stripMarkdownFences(rawJsonText);
  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(cleanedJson) as Record<string, unknown>;
  } catch (err) {
    throw new ModelOutputValidationError(
      `Failed to parse Gemini output as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw output: ${cleanedJson.slice(0, 500)}`
    );
  }

  // Apply bounded normalization and safe recovery before strict validation
  const candidatePlan = normalizeStoryboardPlan(parsedJson, {
    topic,
    notes,
    voicePreset,
    projectId,
    ownerId,
    versionId,
  });

  // Structural and semantic validation
  const validation = validatePlan(candidatePlan);
  if (!validation.success) {
    const issueList = validation.issues.map((i) => `  - ${i.path}: ${i.message}`).join("\n");
    throw new ModelOutputValidationError(
      `Generated storyboard failed validation:\n${issueList}`,
      validation.issues
    );
  }

  return validation.data;
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```json")) {
    return trimmed.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  }
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "project";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
