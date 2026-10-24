import fs from "node:fs";
import path from "node:path";

// Load .env manually for this node process
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const k = trimmed.slice(0, idx);
      const v = trimmed.slice(idx + 1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

async function run() {
  const [envMod, plannerMod, planMod] = await Promise.all([
    import("../dist/src/config/env.js"),
    import("../dist/src/providers/storyboardPlanner.js"),
    import("../dist/src/contracts/plan.js")
  ]);

  const config = envMod.readConfig();
  console.log("=== STEP 2 VERIFICATION: MODEL & STORYBOARD GENERATION ===");
  console.log("Resolved Provider:      ", config.storyboardProvider);
  console.log("Resolved Model:         ", config.geminiModel);
  console.log("Has Gemini API Key:     ", Boolean(config.geminiApiKey));

  if (config.geminiModel !== "gemini-3.5-flash-lite") {
    throw new Error(`Expected gemini-3.5-flash-lite, got: ${config.geminiModel}`);
  }

  const prompt =
    "Create a 45-second educational video storyboard explaining why the sky turns orange and red at twilight. " +
    "The target audience is students aged 10–16. Explain atmospheric scattering accurately and simply. " +
    "Include a curiosity-driven hook, clear narration, visual directions, on-screen labels, and a memorable ending.";
  const topic = "Why the sky turns orange and red at twilight";

  console.log("\nExecuting live generateStoryboard request with Gemini...");
  const startTime = Date.now();
  const plan = await plannerMod.generateStoryboard({
    provider: "gemini",
    topic,
    notes: prompt,
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    requestTimeoutMs: 60000,
    totalTimeoutMs: 120000,
  });
  const latencyMs = Date.now() - startTime;
  console.log(`Live generation completed in ${latencyMs}ms (${(latencyMs / 1000).toFixed(2)}s)!`);

  // Validate structural contract
  const structValidation = planMod.validatePlan(plan);
  console.log("\n--- Structural Validation ---");
  console.log("validatePlan() success: ", structValidation.success);
  if (!structValidation.success) {
    console.error("Validation issues:", JSON.stringify(structValidation.issues, null, 2));
    throw new Error("Structural validation failed");
  }

  // Validate semantic contract (returns ValidationIssue[])
  const semanticIssues = planMod.validatePlanSemantics(plan);
  console.log("\n--- Semantic Validation ---");
  console.log("validatePlanSemantics() issues count:", semanticIssues.length);
  if (semanticIssues.length > 0) {
    console.error("Semantic validation issues:", JSON.stringify(semanticIssues, null, 2));
    throw new Error("Semantic validation failed");
  }

  // Verify scenes and narration fields
  console.log("\n--- Scene & Narration Breakdown ---");
  console.log("Total scenes count:     ", plan.scenes.length);
  const totalDuration = plan.scenes.reduce((sum, s) => sum + s.estimatedDurationMs, 0);
  console.log(`Total duration:          ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);

  for (let i = 0; i < plan.scenes.length; i++) {
    const s = plan.scenes[i];
    console.log(`\nScene ${i + 1} [${s.type}]: id="${s.id}", duration=${s.estimatedDurationMs}ms`);
    console.log(`  Purpose:        ${s.purpose}`);
    console.log(`  Narration (${s.narration.length}): "${s.narration[0]?.text}"`);
    console.log(`  Visual objects:  ${s.objects.map((o) => `${o.kind}:${o.id}('${o.label}')`).join(", ")}`);
    console.log(`  Animation events: ${s.events.map((e) => `${e.action}->${e.targetId} (cue: "${e.cue.phrase}")`).join("; ")}`);
    console.log(`  On-screen text:  ${JSON.stringify(s.onScreenText)}`);
  }

  console.log("\n==================================================");
  console.log("ALL STEP 2 LIVE VERIFICATIONS PASSED CLEANLY (100%)!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exitCode = 1;
});

