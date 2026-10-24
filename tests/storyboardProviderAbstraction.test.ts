import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validatePlan, type StoryboardPlan } from "../src/contracts/plan.js";
import {
  generateStoryboard,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ModelOutputValidationError,
  RequestValidationError,
  ProviderAuthenticationError,
  ProviderNotFoundError,
} from "../src/providers/storyboardPlanner.js";
import { generateStoryboardWithOpenAICompatible } from "../src/providers/openAICompatiblePlanner.js";

const fixturePath = path.resolve(process.cwd(), "fixtures/plans/water-cycle.json");

async function loadBasePlan(): Promise<StoryboardPlan> {
  const raw = JSON.parse(await readFile(fixturePath, "utf8"));
  const parsed = validatePlan(raw);
  if (!parsed.success) throw new Error("Base fixture failed validation");
  return parsed.data;
}

test("Provider Abstraction: unsupported provider throws RequestValidationError", async () => {
  await assert.rejects(
    async () => {
      await generateStoryboard({
        provider: "unsupported-provider" as any,
        topic: "Solar Energy",
      });
    },
    (err: any) => {
      assert.ok(err instanceof RequestValidationError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, "INVALID_REQUEST");
      return true;
    }
  );
});

test("Provider Abstraction: Groq provider dispatches and handles successful generation (mocked)", async () => {
  const basePlan = await loadBasePlan();
  const mockOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let capturedEndpoint = "";
  let capturedAuth = "";
  let capturedBody: any = null;

  const mockFetch = async (url: string, init: any) => {
    capturedEndpoint = url;
    capturedAuth = init.headers.Authorization;
    capturedBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: mockOutput }, finish_reason: "stop" }],
      }),
    } as any;
  };

  const plan = await generateStoryboard({
    provider: "groq",
    apiKey: "mock-groq-key",
    model: "llama-3.3-70b-versatile",
    topic: basePlan.topic,
    fetchFn: mockFetch as any,
  });

  assert.equal(capturedEndpoint, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(capturedAuth, "Bearer mock-groq-key");
  assert.equal(capturedBody.model, "llama-3.3-70b-versatile");
  assert.deepEqual(capturedBody.response_format, { type: "json_object" });
  assert.equal(plan.topic, basePlan.topic);
  assert.equal(plan.scenes.length, basePlan.scenes.length);
});

test("Provider Abstraction: OpenRouter provider dispatches with custom headers (mocked)", async () => {
  const basePlan = await loadBasePlan();
  const mockOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let capturedEndpoint = "";
  let capturedHeaders: any = {};

  const mockFetch = async (url: string, init: any) => {
    capturedEndpoint = url;
    capturedHeaders = init.headers;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: mockOutput }, finish_reason: "stop" }],
      }),
    } as any;
  };

  const plan = await generateStoryboard({
    provider: "openrouter",
    apiKey: "mock-openrouter-key",
    model: "qwen/qwen3.8-max",
    topic: basePlan.topic,
    fetchFn: mockFetch as any,
  });

  assert.equal(capturedEndpoint, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(capturedHeaders.Authorization, "Bearer mock-openrouter-key");
  assert.equal(capturedHeaders["X-Title"], "VisuTale Studio");
  assert.equal(plan.topic, basePlan.topic);
});

test("Provider Abstraction: Qwen / DashScope provider dispatches to compatible endpoint (mocked)", async () => {
  const basePlan = await loadBasePlan();
  const mockOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let capturedEndpoint = "";
  const mockFetch = async (url: string) => {
    capturedEndpoint = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: mockOutput }, finish_reason: "stop" }],
      }),
    } as any;
  };

  const plan = await generateStoryboard({
    provider: "qwen",
    apiKey: "mock-dashscope-key",
    model: "qwen-plus",
    topic: basePlan.topic,
    fetchFn: mockFetch as any,
  });

  assert.ok(capturedEndpoint.includes("dashscope-intl.aliyuncs.com"));
  assert.equal(plan.topic, basePlan.topic);
});

test("Provider Abstraction: invalid JSON throws ModelOutputValidationError (status 502)", async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: "INVALID JSON { unclosed" } }],
    }),
  });

  await assert.rejects(
    async () => {
      await generateStoryboardWithOpenAICompatible({
        providerName: "groq",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: "mock-key",
        model: "llama-3.3-70b-versatile",
        topic: "Physics",
        fetchFn: mockFetch as any,
      });
    },
    (err: any) => {
      assert.ok(err instanceof ModelOutputValidationError);
      assert.equal(err.statusCode, 502);
      assert.equal(err.code, "MODEL_OUTPUT_INVALID");
      return true;
    }
  );
});

test("Provider Abstraction: schema-invalid output throws ModelOutputValidationError with issues (status 502)", async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            topic: "Physics",
            scenes: [{ id: "bad-scene", type: "invalid-type" }],
          }),
        },
      }],
    }),
  });

  await assert.rejects(
    async () => {
      await generateStoryboardWithOpenAICompatible({
        providerName: "groq",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: "mock-key",
        model: "llama-3.3-70b-versatile",
        topic: "Physics",
        fetchFn: mockFetch as any,
      });
    },
    (err: any) => {
      assert.ok(err instanceof ModelOutputValidationError);
      assert.equal(err.statusCode, 502);
      assert.ok(err.issues.length > 0);
      return true;
    }
  );
});

test("Provider Abstraction: HTTP 503 and 429 transient errors retry with backoff and jitter", async () => {
  const basePlan = await loadBasePlan();
  const mockOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let attempts = 0;
  const recordedSleeps: number[] = [];

  const mockFetch = async () => {
    attempts++;
    if (attempts === 1) {
      return {
        ok: false,
        status: 503,
        headers: new Headers(),
        text: async () => JSON.stringify({ error: { message: "Service busy" } }),
      } as any;
    }
    if (attempts === 2) {
      const headers = new Headers();
      headers.set("retry-after", "2");
      return {
        ok: false,
        status: 429,
        headers,
        text: async () => JSON.stringify({ error: { message: "Rate limit reached" } }),
      } as any;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: mockOutput } }],
      }),
    } as any;
  };

  const plan = await generateStoryboardWithOpenAICompatible({
    providerName: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: "mock-key",
    model: "llama-3.3-70b-versatile",
    topic: basePlan.topic,
    maxRetries: 3,
    fetchFn: mockFetch as any,
    sleepFn: async (ms) => { recordedSleeps.push(ms); },
  });

  assert.equal(attempts, 3, "Must retry on 503 and 429 before succeeding");
  assert.equal(recordedSleeps.length, 2);
  assert.equal(recordedSleeps[1], 2000, "Second sleep must respect Retry-After header");
  assert.equal(plan.topic, basePlan.topic);
});

test("Provider Abstraction: HTTP 401 authentication failure aborts immediately without retrying", async () => {
  let attempts = 0;
  const mockFetch = async () => {
    attempts++;
    return {
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { message: "Invalid API Key" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithOpenAICompatible({
        providerName: "groq",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: "bad-key",
        model: "llama-3.3-70b-versatile",
        topic: "Algorithms",
        maxRetries: 5,
        fetchFn: mockFetch as any,
        sleepFn: async () => {},
      });
    },
    (err: any) => {
      assert.ok(err instanceof ProviderAuthenticationError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.isRetryable, false);
      return true;
    }
  );

  assert.equal(attempts, 1, "401 must never be retried");
});

test("Provider Abstraction: HTTP 404 model not found aborts immediately without retrying", async () => {
  let attempts = 0;
  const mockFetch = async () => {
    attempts++;
    return {
      ok: false,
      status: 404,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { message: "Model does not exist" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithOpenAICompatible({
        providerName: "openrouter",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: "mock-key",
        model: "nonexistent-model",
        topic: "Biology",
        maxRetries: 5,
        fetchFn: mockFetch as any,
        sleepFn: async () => {},
      });
    },
    (err: any) => {
      assert.ok(err instanceof ProviderNotFoundError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.isRetryable, false);
      return true;
    }
  );

  assert.equal(attempts, 1, "404 must never be retried");
});

test("Provider Abstraction: Total budget exhaustion throws ProviderTimeoutError (status 504)", async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 503,
    headers: new Headers(),
    text: async () => JSON.stringify({ error: { message: "Busy" } }),
  });

  await assert.rejects(
    async () => {
      await generateStoryboardWithOpenAICompatible({
        providerName: "groq",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: "mock-key",
        model: "llama-3.3-70b-versatile",
        topic: "Chemistry",
        maxRetries: 10,
        totalTimeoutMs: 50,
        requestTimeoutMs: 20,
        fetchFn: mockFetch as any,
        sleepFn: async () => {
          await new Promise((r) => setTimeout(r, 60));
        },
      });
    },
    (err: any) => {
      assert.ok(err instanceof ProviderTimeoutError || err instanceof ProviderUnavailableError);
      assert.ok(err.statusCode === 504 || err.statusCode === 503);
      return true;
    }
  );
});

