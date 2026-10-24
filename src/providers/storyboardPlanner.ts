import type { StoryboardPlan, VoicePreset } from "../contracts/plan.js";
import { generateStoryboardWithGemini } from "./geminiPlanner.js";
import { generateStoryboardWithOpenAICompatible } from "./openAICompatiblePlanner.js";
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

export type StoryboardProviderId = "gemini" | "groq" | "openrouter" | "qwen" | "custom";

export interface StoryboardPlannerOptions {
  provider?: StoryboardProviderId;
  topic: string;
  notes?: string;
  voicePreset?: VoicePreset;
  apiKey?: string;
  model?: string;
  endpoint?: string;
  projectId?: string;
  ownerId?: string;
  versionId?: string;
  maxRetries?: number;
  totalTimeoutMs?: number;
  requestTimeoutMs?: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

export async function generateStoryboard(options: StoryboardPlannerOptions): Promise<StoryboardPlan> {
  const provider = options.provider || "gemini";

  switch (provider) {
    case "gemini": {
      const apiKey = options.apiKey || process.env.GEMINI_API_KEY || "";
      const model = options.model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
      return generateStoryboardWithGemini({
        ...options,
        apiKey,
        model,
      });
    }

    case "groq": {
      const apiKey = options.apiKey || process.env.GROQ_API_KEY || "";
      const model = options.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
      const endpoint = options.endpoint || "https://api.groq.com/openai/v1/chat/completions";
      return generateStoryboardWithOpenAICompatible({
        ...options,
        providerName: "groq",
        endpoint,
        apiKey,
        model,
      });
    }

    case "openrouter": {
      const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY || "";
      const model = options.model || process.env.OPENROUTER_MODEL || "qwen/qwen3.8-max";
      const endpoint = options.endpoint || "https://openrouter.ai/api/v1/chat/completions";
      return generateStoryboardWithOpenAICompatible({
        ...options,
        providerName: "openrouter",
        endpoint,
        apiKey,
        model,
        extraHeaders: {
          "HTTP-Referer": "https://visutale.app",
          "X-Title": "VisuTale Studio",
        },
      });
    }

    case "qwen": {
      const apiKey = options.apiKey || process.env.DASHSCOPE_API_KEY || "";
      const model = options.model || process.env.DASHSCOPE_MODEL || "qwen-plus";
      const endpoint = options.endpoint || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
      return generateStoryboardWithOpenAICompatible({
        ...options,
        providerName: "qwen",
        endpoint,
        apiKey,
        model,
      });
    }

    case "custom": {
      const apiKey = options.apiKey || "";
      const model = options.model || "";
      const endpoint = options.endpoint || "";
      return generateStoryboardWithOpenAICompatible({
        ...options,
        providerName: "custom",
        endpoint,
        apiKey,
        model,
      });
    }

    default:
      throw new RequestValidationError(`Unsupported storyboard provider: '${provider}'.`);
  }
}

