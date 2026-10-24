import fs from "node:fs";
import path from "node:path";
import { generateStoryboard } from "../dist/src/providers/storyboardPlanner.js";
import { validatePlan } from "../dist/src/contracts/plan.js";

// Load .env if present
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const BENCHMARK_PROMPTS = [
  { id: "A", topic: "Why does the sky turn orange at twilight?" },
  { id: "B", topic: "Explain the water cycle." },
  { id: "C", topic: "Explain binary search with a visual example." },
];

async function runBenchmark() {
  const args = process.argv.slice(2);
  let provider = "gemini";
  let model = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--provider" && args[i + 1]) {
      provider = args[i + 1];
      i++;
    } else if (args[i] === "--model" && args[i + 1]) {
      model = args[i + 1];
      i++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`VISUTALE STORYBOARD PROVIDER BENCHMARK`);
  console.log(`Provider: ${provider}`);
  console.log(`Model:    ${model || "(default for provider)"}`);
  console.log(`======================================================\n`);

  const results = [];

  for (const item of BENCHMARK_PROMPTS) {
    console.log(`\n--- Running Prompt ${item.id}: "${item.topic}" ---`);
    const startTime = Date.now();
    let retryCount = 0;
    let httpStatus = "200";
    let jsonParseSuccess = false;
    let schemaValidation = "FAIL";
    let semanticValidation = "FAIL";
    let sceneCount = 0;
    let estimatedDurationMs = 0;
    let notes = "";

    try {
      const plan = await generateStoryboard({
        provider: provider,
        model: model || undefined,
        topic: item.topic,
        maxRetries: 2,
        requestTimeoutMs: 120000,
        totalTimeoutMs: 240000,
      });

      const durationMs = Date.now() - startTime;
      jsonParseSuccess = true;

      const val = validatePlan(plan);
      if (val.success) {
        schemaValidation = "PASS";
        semanticValidation = "PASS";
        sceneCount = val.data.scenes.length;
        estimatedDurationMs = val.data.scenes.reduce((sum, s) => sum + s.estimatedDurationMs, 0);

        // Quality check
        const hasHook = val.data.scenes[0]?.type === "title-hook";
        const hasTakeaway = val.data.scenes[val.data.scenes.length - 1]?.type === "takeaway";
        const totalWords = val.data.scenes
          .flatMap((s) => s.narration)
          .map((n) => n.text)
          .join(" ")
          .split(/\s+/).length;

        notes = `Valid pedagogy (${sceneCount} scenes, ${totalWords} words). Hook: ${hasHook}, Takeaway: ${hasTakeaway}.`;
      } else {
        schemaValidation = "FAIL";
        notes = `Validation issues: ${val.issues.map((i) => i.path).join(", ")}`;
      }

      results.push({
        promptId: item.id,
        topic: item.topic,
        provider,
        model: model || plan.warnings?.[0] || "default",
        durationMs,
        status: "200 OK",
        retries: retryCount,
        jsonParseSuccess,
        schemaValidation,
        semanticValidation,
        sceneCount,
        durationSec: Math.round(estimatedDurationMs / 1000),
        notes,
      });

      console.log(`✓ Completed in ${(durationMs / 1000).toFixed(1)}s: ${notes}`);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const statusCode = err?.statusCode || (err?.name === "ProviderTimeoutError" ? 504 : 500);
      const code = err?.code || err?.name || "ERROR";

      results.push({
        promptId: item.id,
        topic: item.topic,
        provider,
        model: model || "default",
        durationMs,
        status: `HTTP ${statusCode} (${code})`,
        retries: retryCount,
        jsonParseSuccess: false,
        schemaValidation: "FAIL",
        semanticValidation: "FAIL",
        sceneCount: 0,
        durationSec: 0,
        notes: err.message.slice(0, 150),
      });

      console.log(`✗ Failed in ${(durationMs / 1000).toFixed(1)}s: [${code}] ${err.message}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`BENCHMARK SUMMARY`);
  console.log(`======================================================`);
  console.table(
    results.map((r) => ({
      Prompt: r.promptId,
      Topic: r.topic.slice(0, 25),
      Duration: `${(r.durationMs / 1000).toFixed(1)}s`,
      Status: r.status,
      Schema: r.schemaValidation,
      Scenes: r.sceneCount,
      NarrationSec: `${r.durationSec}s`,
      Notes: r.notes.slice(0, 45),
    }))
  );
}

runBenchmark().catch((e) => {
  console.error(e);
  process.exit(1);
});

