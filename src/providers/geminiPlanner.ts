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
    maxRetries = 2,
  } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("GEMINI_API_KEY is missing or empty.");
  }
  if (!model || model.trim().length === 0) {
    throw new Error("GEMINI_MODEL is missing or empty.");
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

  let attempts = 0;
  let rawJsonText = "";

  while (attempts <= maxRetries) {
    attempts++;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedErrorMsg = errorText;
        try {
          const errObj = JSON.parse(errorText) as { error?: { message?: string } };
          if (errObj.error?.message) parsedErrorMsg = errObj.error.message;
        } catch {
          // use raw text
        }

        // Fatal errors (auth, model not found) do not retry
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Gemini API authentication failed (HTTP ${response.status}): ${parsedErrorMsg}`);
        }
        if (response.status === 404) {
          throw new Error(`Gemini model '${model}' not found (HTTP 404): ${parsedErrorMsg}`);
        }

        // Transient errors (429, 500, 503) retry with backoff
        if ((response.status === 429 || response.status >= 500) && attempts <= maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempts), 5000);
          await sleep(delayMs);
          continue;
        }

        throw new Error(`Gemini API request failed (HTTP ${response.status}): ${parsedErrorMsg}`);
      }

      const responseData = (await response.json()) as GeminiApiResponse;
      if (responseData.error) {
        throw new Error(`Gemini API error: ${responseData.error.message}`);
      }

      const candidate = responseData.candidates?.[0];
      const partText = candidate?.content?.parts?.[0]?.text;
      if (!partText) {
        throw new Error("Gemini response contained no content text.");
      }

      rawJsonText = partText;
      break;
    } catch (err: unknown) {
      if (attempts > maxRetries || (err instanceof Error && (err.message.includes("authentication failed") || err.message.includes("not found")))) {
        throw err;
      }
      const delayMs = Math.min(1000 * Math.pow(2, attempts), 5000);
      await sleep(delayMs);
    }
  }

  // Parse JSON
  const cleanedJson = stripMarkdownFences(rawJsonText);
  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(cleanedJson) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Failed to parse Gemini output as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw output: ${cleanedJson.slice(0, 500)}`);
  }

  const sources: Array<{ id: string; text: string }> = notes
    ? [{ id: "src-user-notes", text: notes }]
    : [];
  const validSourceIds = new Set(sources.map((s) => s.id));

  // Sanitize scenes: ensure sourceRefs only contains valid source IDs (prevent invented citations)
  const sanitizedScenes = Array.isArray(parsedJson.scenes)
    ? parsedJson.scenes.map((sc: unknown) => {
        if (!sc || typeof sc !== "object" || Array.isArray(sc)) return sc;
        const sceneRecord = sc as Record<string, unknown>;
        const rawRefs = Array.isArray(sceneRecord.sourceRefs) ? sceneRecord.sourceRefs : [];
        const filteredRefs = rawRefs.filter((r) => typeof r === "string" && validSourceIds.has(r));
        return {
          ...sceneRecord,
          sourceRefs: filteredRefs,
        };
      })
    : parsedJson.scenes;

  // Apply application-level immutable envelope
  const candidatePlan: Record<string, unknown> = {
    schemaVersion: "1.0",
    projectId,
    ownerId,
    versionId,
    parentVersionId: null,
    topic: parsedJson.topic ?? topic,
    audience: parsedJson.audience ?? "General audience seeking clear visual explanation",
    learningObjective: parsedJson.learningObjective ?? `Explain ${topic} with clear visual motion graphics`,
    language: "en",
    voicePreset: parsedJson.voicePreset ?? voicePreset,
    sources,
    scenes: sanitizedScenes,
    warnings: Array.isArray(parsedJson.warnings) ? parsedJson.warnings : [],
  };

  // Structural and semantic validation
  const validation = validatePlan(candidatePlan);
  if (!validation.success) {
    const issueList = validation.issues.map((i) => `  - ${i.path}: ${i.message}`).join("\n");
    throw new Error(`Generated storyboard failed validation:\n${issueList}`);
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
