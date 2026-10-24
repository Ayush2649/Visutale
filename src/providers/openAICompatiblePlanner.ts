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

export interface OpenAICompatiblePlannerOptions {
  providerName?: "groq" | "openrouter" | "qwen" | "custom";
  endpoint: string;
  apiKey: string;
  model: string;
  topic: string;
  notes?: string;
  voicePreset?: VoicePreset;
  projectId?: string;
  ownerId?: string;
  versionId?: string;
  maxRetries?: number;
  totalTimeoutMs?: number;
  requestTimeoutMs?: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
  extraHeaders?: Record<string, string>;
}

export async function generateStoryboardWithOpenAICompatible(
  options: OpenAICompatiblePlannerOptions
): Promise<StoryboardPlan> {
  const {
    providerName = "openai-compatible",
    endpoint,
    apiKey,
    model,
    topic,
    notes,
    voicePreset = "indian-english-female",
    projectId = slugify(topic),
    ownerId = "local-owner",
    versionId = "v1",
    maxRetries = 3,
    totalTimeoutMs = 120000,
    requestTimeoutMs = 60000,
    fetchFn = globalThis.fetch,
    sleepFn = sleep,
    extraHeaders = {},
  } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new RequestValidationError(`${providerName.toUpperCase()}_API_KEY is missing or empty.`);
  }
  if (!model || model.trim().length === 0) {
    throw new RequestValidationError(`${providerName.toUpperCase()}_MODEL is missing or empty.`);
  }
  if (!endpoint || endpoint.trim().length === 0) {
    throw new RequestValidationError("Endpoint URL is required for OpenAI-compatible provider.");
  }

  const systemInstruction = buildPlannerSystemPrompt();
  const userPrompt = buildPlannerUserPrompt(topic, notes, voicePreset);

  const requestBody = {
    model,
    messages: [
      {
        role: "system",
        content: systemInstruction,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.2,
  };

  const startTime = Date.now();
  let attempts = 0;
  let rawContentText = "";
  let lastTransientError: Error | null = null;

  while (attempts <= maxRetries) {
    const elapsedMs = Date.now() - startTime;
    const remainingTimeMs = totalTimeoutMs - elapsedMs;
    if (remainingTimeMs < 2000 && attempts > 0) {
      throw new ProviderTimeoutError(
        `${providerName} storyboard generation exceeded time budget of ${Math.round(totalTimeoutMs / 1000)}s after ${attempts} attempt(s). Last error: ${lastTransientError?.message || "Time budget exhausted"}`,
        providerName
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
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedErrorMsg = `HTTP ${response.status}`;
        let parsedCode = "";
        try {
          const errObj = JSON.parse(errorText) as { error?: { message?: string; code?: string; type?: string } };
          if (errObj.error?.message) parsedErrorMsg = errObj.error.message;
          if (errObj.error?.code) parsedCode = errObj.error.code;
        } catch {
          if (errorText.trim().length > 0) parsedErrorMsg = errorText.slice(0, 300);
        }

        // Fatal non-transient errors (auth, model not found, client request errors)
        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError(
            `${providerName} authentication failed (HTTP ${response.status}): ${parsedErrorMsg}`,
            providerName
          );
        }
        if (response.status === 404) {
          throw new ProviderNotFoundError(
            `${providerName} model '${model}' or endpoint not found (HTTP 404): ${parsedErrorMsg}`,
            providerName
          );
        }
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new RequestValidationError(
            `${providerName} rejected request (HTTP ${response.status}): ${parsedErrorMsg}`
          );
        }

        // Transient errors (429, 500, 502, 503, 504)
        const isTransient = response.status === 429 || response.status >= 500;
        if (isTransient) {
          const errorType = response.status === 429 ? "rate-limited" : "busy/unavailable";
          lastTransientError = new ProviderUnavailableError(
            `${providerName} model ${errorType} (HTTP ${response.status}${parsedCode ? ` - ${parsedCode}` : ""}): ${parsedErrorMsg}`,
            providerName
          );

          if (attempts > maxRetries) {
            throw lastTransientError;
          }

          let delayMs = Math.min(1500 * Math.pow(2, attempts - 1), 8000);
          const retryAfterHeader = response.headers?.get?.("retry-after");
          if (retryAfterHeader) {
            const parsedSec = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSec) && parsedSec > 0) {
              delayMs = parsedSec * 1000;
            }
          } else {
            const jitterFactor = 0.8 + Math.random() * 0.4;
            delayMs = Math.round(delayMs * jitterFactor);
          }

          const remainingBudget = totalTimeoutMs - (Date.now() - startTime);
          if (remainingBudget <= delayMs + 1000) {
            throw new ProviderTimeoutError(
              `${providerName} retry deadline exceeded (needed ${delayMs}ms delay, only ${remainingBudget}ms left in budget). Last status: HTTP ${response.status}`,
              providerName
            );
          }

          process.stdout.write(
            `  [${providerName}] model="${model}" attempt=${attempts}/${maxRetries} status=${response.status} retryIn=${(delayMs / 1000).toFixed(1)}s: ${parsedErrorMsg}\n`
          );

          await sleepFn(delayMs);
          continue;
        }

        throw new ProviderUnavailableError(
          `${providerName} request failed (HTTP ${response.status}): ${parsedErrorMsg}`,
          providerName
        );
      }

      const responseData = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
          finish_reason?: string;
        }>;
        error?: {
          message?: string;
        };
      };

      if (responseData.error) {
        throw new ProviderUnavailableError(
          `${providerName} API error: ${responseData.error.message}`,
          providerName
        );
      }

      const content = responseData.choices?.[0]?.message?.content;
      if (!content || content.trim().length === 0) {
        throw new ModelOutputValidationError(`${providerName} response contained no content text.`);
      }

      rawContentText = content;
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

      lastTransientError = new ProviderUnavailableError(
        `${providerName} transient network/timeout error: ${errMessage}`,
        providerName
      );

      if (attempts > maxRetries) {
        throw lastTransientError;
      }

      const remainingBudget = totalTimeoutMs - (Date.now() - startTime);
      if (remainingBudget < 3000) {
        throw new ProviderTimeoutError(
          `${providerName} request time budget exceeded (${Math.round((Date.now() - startTime) / 1000)}s elapsed). Last error: ${errMessage}`,
          providerName
        );
      }

      let delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      delayMs = Math.round(delayMs * (0.8 + Math.random() * 0.4));
      delayMs = Math.min(delayMs, remainingBudget - 1000);

      process.stdout.write(
        `  [${providerName}] model="${model}" attempt=${attempts}/${maxRetries} transient error, retryIn=${(delayMs / 1000).toFixed(1)}s: ${errMessage}\n`
      );

      await sleepFn(delayMs);
    } finally {
      clearTimeout(timer);
    }
  }

  // Parse JSON
  const cleanedJson = stripMarkdownFences(rawContentText);
  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(cleanedJson) as Record<string, unknown>;
  } catch (err) {
    throw new ModelOutputValidationError(
      `Failed to parse ${providerName} output as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw output: ${cleanedJson.slice(0, 500)}`
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

