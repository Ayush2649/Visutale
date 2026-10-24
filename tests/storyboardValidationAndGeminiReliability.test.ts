import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  validatePlan,
  type StoryboardPlan,
} from "../src/contracts/plan.js";
import {
  generateStoryboardWithGemini,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ModelOutputValidationError,
  RequestValidationError,
  ProviderAuthenticationError,
  ProviderNotFoundError,
} from "../src/providers/geminiPlanner.js";
import { hashCanonicalJson } from "../src/pipeline/canonicalHash.js";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import { StudioJobRegistry } from "../src/studio/studioJobManager.js";

const fixturePath = path.resolve(process.cwd(), "fixtures/plans/water-cycle.json");

async function loadBasePlan(): Promise<StoryboardPlan> {
  const raw = JSON.parse(await readFile(fixturePath, "utf8"));
  const parsed = validatePlan(raw);
  if (!parsed.success) throw new Error("Base fixture failed validation");
  return parsed.data;
}

test("Storyboard Contract: valid storyboard without visualVariant passes cleanly", async () => {
  const plan = await loadBasePlan();
  // Ensure base fixture does not have visualVariant
  assert.equal(plan.scenes[0].visualVariant, undefined);
  const result = validatePlan(plan);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.scenes[0].visualVariant, undefined);
  }
});

test("Storyboard Contract: valid storyboard with visualVariant and visualData passes cleanly", async () => {
  const plan = await loadBasePlan();
  plan.scenes[0].visualVariant = "generic.title-hook";
  plan.scenes[0].visualData = { accentColor: "#0284c7" };
  plan.scenes[1].visualVariant = "water-cycle.evaporation";

  const result = validatePlan(plan);
  assert.equal(result.success, true, result.success ? undefined : JSON.stringify(result.issues));
  if (result.success) {
    assert.equal(result.data.scenes[0].visualVariant, "generic.title-hook");
    assert.deepEqual(result.data.scenes[0].visualData, { accentColor: "#0284c7" });
    assert.equal(result.data.scenes[1].visualVariant, "water-cycle.evaporation");
  }
});

test("Storyboard Contract: rejection of genuinely unknown fields across scenes, objects, events, and root", async () => {
  const plan = await loadBasePlan();
  const raw = JSON.parse(JSON.stringify(plan)) as Record<string, unknown>;

  // 1. Unknown field on scene
  (raw.scenes as any[])[0].unknownSceneProperty = "should-fail";
  let result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].unknownSceneProperty"));

  delete (raw.scenes as any[])[0].unknownSceneProperty;

  // 2. Unknown field on root plan
  raw.unknownRootField = 12345;
  result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "$.unknownRootField"));

  delete raw.unknownRootField;

  // 3. Unknown field on narration block
  (raw.scenes as any[])[0].narration[0].inventedField = true;
  result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].narration[0].inventedField"));

  delete (raw.scenes as any[])[0].narration[0].inventedField;

  // 4. Unknown field on visual object
  (raw.scenes as any[])[0].objects[0].extraneousKey = "bad";
  result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].objects[0].extraneousKey"));
});

test("Storyboard Contract: validation of visualVariant and visualData formats", async () => {
  const plan = await loadBasePlan();
  const raw = JSON.parse(JSON.stringify(plan)) as Record<string, any>;

  // 1. Empty string visualVariant is rejected
  raw.scenes[0].visualVariant = "";
  let result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].visualVariant"));

  // 2. Whitespace-only visualVariant is rejected
  raw.scenes[0].visualVariant = "   ";
  result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].visualVariant"));

  // 3. Invalid characters (spaces, special symbols) rejected
  raw.scenes[0].visualVariant = "generic/title hook!";
  result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].visualVariant"));

  // 4. Non-object visualData rejected
  raw.scenes[0].visualVariant = "generic.title-hook";
  raw.scenes[0].visualData = "not-an-object";
  result = validatePlan(raw);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((i) => i.path === "scenes[0].visualData"));
});

test("Storyboard Contract: visualVariant changes alter canonical hash and invalidate approvals", async () => {
  const planA = await loadBasePlan();
  const planB = await loadBasePlan();
  const planC = await loadBasePlan();

  planB.scenes[0].visualVariant = "generic.title-hook";
  planC.scenes[0].visualVariant = "water-cycle.title-hook";

  const hashA = hashCanonicalJson(planA);
  const hashB = hashCanonicalJson(planB);
  const hashC = hashCanonicalJson(planC);

  assert.notEqual(hashA, hashB, "Adding visualVariant must alter canonical plan hash");
  assert.notEqual(hashB, hashC, "Altering visualVariant must alter canonical plan hash");
});

test("Gemini Provider: HTTP 503 followed by successful retry succeeds and logs attempt", async () => {
  const basePlan = await loadBasePlan();
  const mockPlanOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes.map((s) => ({
      ...s,
      visualVariant: "generic.process-flow",
    })),
    warnings: [],
  });

  let fetchCallCount = 0;
  const recordedSleeps: number[] = [];

  const mockFetch = async () => {
    fetchCallCount++;
    if (fetchCallCount < 3) {
      return {
        ok: false,
        status: 503,
        headers: new Headers(),
        text: async () => JSON.stringify({ error: { code: 503, message: "Model is overloaded.", status: "UNAVAILABLE" } }),
      } as any;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockPlanOutput }] } }],
      }),
    } as any;
  };

  const mockSleep = async (ms: number) => {
    recordedSleeps.push(ms);
  };

  const plan = await generateStoryboardWithGemini({
    topic: basePlan.topic,
    apiKey: "mock-key",
    model: "gemini-3.8-flash",
    maxRetries: 3,
    fetchFn: mockFetch as any,
    sleepFn: mockSleep,
  });

  assert.equal(fetchCallCount, 3, "Must retry twice and succeed on 3rd attempt");
  assert.equal(recordedSleeps.length, 2, "Must have paused twice");
  assert.ok(recordedSleeps[0] >= 1000, "First backoff delay >= 1000ms");
  assert.ok(recordedSleeps[1] > recordedSleeps[0] * 0.9, "Second backoff delay scales exponentially");
  assert.equal(plan.scenes[0].visualVariant, "generic.process-flow");
});

test("Gemini Provider: HTTP 503 respects Retry-After header", async () => {
  const basePlan = await loadBasePlan();
  const mockPlanOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let fetchCallCount = 0;
  const recordedSleeps: number[] = [];

  const mockFetch = async () => {
    fetchCallCount++;
    if (fetchCallCount === 1) {
      const headers = new Headers();
      headers.set("retry-after", "4");
      return {
        ok: false,
        status: 503,
        headers,
        text: async () => JSON.stringify({ error: { code: 503, message: "Overloaded", status: "UNAVAILABLE" } }),
      } as any;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockPlanOutput }] } }],
      }),
    } as any;
  };

  await generateStoryboardWithGemini({
    topic: basePlan.topic,
    apiKey: "mock-key",
    model: "gemini-3.8-flash",
    maxRetries: 2,
    fetchFn: mockFetch as any,
    sleepFn: async (ms) => { recordedSleeps.push(ms); },
  });

  assert.equal(fetchCallCount, 2);
  assert.equal(recordedSleeps.length, 1);
  assert.equal(recordedSleeps[0], 4000, "Must respect 4-second Retry-After header exactly");
});

test("Gemini Provider: HTTP 429 rate limit is treated as transient and retries with backoff", async () => {
  const basePlan = await loadBasePlan();
  const mockPlanOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let fetchCallCount = 0;
  const recordedSleeps: number[] = [];

  const mockFetch = async () => {
    fetchCallCount++;
    if (fetchCallCount === 1) {
      return {
        ok: false,
        status: 429,
        headers: new Headers(),
        text: async () => JSON.stringify({ error: { code: 429, message: "Resource exhausted", status: "RESOURCE_EXHAUSTED" } }),
      } as any;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockPlanOutput }] } }],
      }),
    } as any;
  };

  const plan = await generateStoryboardWithGemini({
    topic: basePlan.topic,
    apiKey: "mock-key",
    model: "gemini-3.8-flash",
    maxRetries: 2,
    fetchFn: mockFetch as any,
    sleepFn: async (ms) => { recordedSleeps.push(ms); },
  });

  assert.equal(fetchCallCount, 2);
  assert.equal(recordedSleeps.length, 1);
  assert.ok(recordedSleeps[0] >= 1000);
  assert.equal(plan.topic, basePlan.topic);
});

test("Gemini Provider: Local request timeout (AbortError) is retried within total budget", async () => {
  const basePlan = await loadBasePlan();
  const mockPlanOutput = JSON.stringify({
    topic: basePlan.topic,
    audience: basePlan.audience,
    learningObjective: basePlan.learningObjective,
    language: "en",
    voicePreset: basePlan.voicePreset,
    scenes: basePlan.scenes,
    warnings: [],
  });

  let fetchCallCount = 0;

  const mockFetch = async () => {
    fetchCallCount++;
    if (fetchCallCount === 1) {
      const abortErr = new Error("This operation was aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockPlanOutput }] } }],
      }),
    } as any;
  };

  const plan = await generateStoryboardWithGemini({
    topic: basePlan.topic,
    apiKey: "mock-key",
    model: "gemini-3.8-flash",
    maxRetries: 2,
    fetchFn: mockFetch as any,
    sleepFn: async () => {},
  });

  assert.equal(fetchCallCount, 2, "Must retry after local abort error");
  assert.equal(plan.topic, basePlan.topic);
});

test("Gemini Provider: HTTP 503 after all retries throws ProviderUnavailableError (status 503)", async () => {
  let fetchCallCount = 0;
  const mockFetch = async () => {
    fetchCallCount++;
    return {
      ok: false,
      status: 503,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { code: 503, message: "Overloaded", status: "UNAVAILABLE" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "Photosynthesis",
        apiKey: "mock-key",
        model: "gemini-3.8-flash",
        maxRetries: 2,
        fetchFn: mockFetch as any,
        sleepFn: async () => {},
      });
    },
    (err: any) => {
      assert.ok(err instanceof ProviderUnavailableError);
      assert.equal(err.statusCode, 503);
      assert.equal(err.code, "PROVIDER_UNAVAILABLE");
      assert.equal(err.isRetryable, true);
      return true;
    }
  );

  assert.equal(fetchCallCount, 3, "Initial attempt + 2 retries = 3 attempts total");
});

test("Gemini Provider: Non-retryable errors fail immediately without retrying", async () => {
  let fetchCallCount = 0;
  const mockFetchAuth = async () => {
    fetchCallCount++;
    return {
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { message: "API key invalid" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "Binary Search",
        apiKey: "bad-key",
        model: "gemini-3.8-flash",
        maxRetries: 5,
        fetchFn: mockFetchAuth as any,
        sleepFn: async () => {},
      });
    },
    (err: any) => {
      assert.ok(err instanceof ProviderAuthenticationError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, "PROVIDER_AUTH_ERROR");
      return true;
    }
  );
  assert.equal(fetchCallCount, 1, "401 must fail immediately with 0 retries");

  fetchCallCount = 0;
  const mockFetchNotFound = async () => {
    fetchCallCount++;
    return {
      ok: false,
      status: 404,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { message: "Model not found" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "Binary Search",
        apiKey: "valid-key",
        model: "nonexistent-model",
        maxRetries: 5,
        fetchFn: mockFetchNotFound as any,
        sleepFn: async () => {},
      });
    },
    (err: any) => {
      assert.ok(err instanceof ProviderNotFoundError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, "PROVIDER_NOT_FOUND");
      return true;
    }
  );
  assert.equal(fetchCallCount, 1, "404 must fail immediately with 0 retries");

  fetchCallCount = 0;
  const mockFetchBadRequest = async () => {
    fetchCallCount++;
    return {
      ok: false,
      status: 400,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { message: "Invalid argument" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "Binary Search",
        apiKey: "valid-key",
        model: "gemini-3.8-flash",
        maxRetries: 5,
        fetchFn: mockFetchBadRequest as any,
        sleepFn: async () => {},
      });
    },
    (err: any) => {
      assert.ok(err instanceof RequestValidationError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, "INVALID_REQUEST");
      return true;
    }
  );
  assert.equal(fetchCallCount, 1, "400 must fail immediately with 0 retries");
});

test("Gemini Provider: Timeout and time-budget enforcement halts promptly", async () => {
  let fetchCallCount = 0;
  const mockFetch = async () => {
    fetchCallCount++;
    return {
      ok: false,
      status: 503,
      headers: new Headers(),
      text: async () => JSON.stringify({ error: { code: 503, message: "Busy" } }),
    } as any;
  };

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "RAM vs Storage",
        apiKey: "mock-key",
        model: "gemini-3.8-flash",
        maxRetries: 10,
        totalTimeoutMs: 50, // 50ms total budget
        requestTimeoutMs: 20,
        fetchFn: mockFetch as any,
        sleepFn: async () => {
          // Simulate time passing beyond budget
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

test("Gemini Provider: ModelOutputValidationError returned for malformed model output (status 502)", async () => {
  // 1. Unparseable JSON
  let mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: "THIS IS NOT VALID JSON" }] } }],
    }),
  });

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "Test",
        apiKey: "mock-key",
        model: "gemini-3.8-flash",
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

  // 2. Schema validation failure (e.g. missing narration or unsupported scene type)
  mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              topic: "Test",
              scenes: [{ id: "s1", type: "unsupported-scene-type" }],
            }),
          }],
        },
      }],
    }),
  });

  await assert.rejects(
    async () => {
      await generateStoryboardWithGemini({
        topic: "Test",
        apiKey: "mock-key",
        model: "gemini-3.8-flash",
        fetchFn: mockFetch as any,
      });
    },
    (err: any) => {
      assert.ok(err instanceof ModelOutputValidationError);
      assert.equal(err.statusCode, 502);
      assert.equal(err.code, "MODEL_OUTPUT_INVALID");
      assert.ok(Array.isArray(err.issues));
      return true;
    }
  );
});

test("Studio Job Registry: failed jobs are never left indefinitely in running state", async () => {
  const store = new LocalArtifactStore(path.resolve(process.cwd(), "tests/tmp_reliability_test_runs"));
  const registry = new StudioJobRegistry(store);

  // Attempting render on non-existent runPath
  const runPath = "non_existent/user/project/run";
  await assert.rejects(async () => {
    await registry.startRenderJob(runPath);
  });

  // Verify non-existent run is not tracked as running
  assert.equal(registry.hasActiveJob(runPath), false);
  const status = registry.getJob(runPath);
  assert.equal(status, undefined);
});

