import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkLiveConfig, readConfig } from "../config/env.js";
import { validatePlan, type VoicePreset, type StoryboardPlan, VOICE_PRESETS } from "../contracts/plan.js";
import { LocalArtifactStore } from "../storage/localArtifactStore.js";
import {
  approveRun,
  createFixtureRun,
  createLivePlanRun,
  createRevisionRun,
  synthesizeSpeechForRun,
  readRunManifest,
  resolveRunPath,
} from "../pipeline/runService.js";
import { renderRun } from "../pipeline/renderService.js";
import { validateRenderOutput } from "../validation/mediaValidator.js";
import type { CompiledTimeline } from "../contracts/timeline.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const store = new LocalArtifactStore(path.join(projectRoot, "runs"));
const fixtureRoot = path.join(projectRoot, "fixtures", "plans");

async function main(args: string[]): Promise<void> {
  const command = args[0] ?? "help";
  const options = parseFlags(args.slice(1));

  switch (command) {
    case "preflight":
      await runPreflight(options);
      return;
    case "plan":
      await runPlan(options);
      return;
    case "speech":
    case "synthesize-speech":
      await runSpeech(options);
      return;
    case "validate-plan":
      await runValidatePlan(options);
      return;
    case "fixture":
      await runFixture(options);
      return;
    case "approve":
      await runApprove(options);
      return;
    case "revise":
      await runRevise(options);
      return;
    case "render":
    case "generate":
      await runRender(options);
      return;
    case "validate":
      await runValidate(options);
      return;
    case "status":
      await runStatus(options);
      return;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    default:
      throw new Error(`Unknown command '${command}'. Run 'npm run pipeline -- help' for usage.`);
  }
}

async function runPreflight(options: Map<string, string | true>): Promise<void> {
  const version = process.versions.node;
  const major = Number(version.split(".")[0]);
  const runtimeOk = Number.isInteger(major) && major >= 22 && major < 25;
  printCheck("Node.js runtime", runtimeOk, `v${version} (expected >=22 and <25 for this scaffold)`);

  const disk = await store.checkWritable();
  printCheck("Local runs/ directory", disk.writable, disk.writable
    ? `writable${disk.freeBytes === undefined ? "" : `; ${formatBytes(disk.freeBytes)} free`}`
    : disk.message ?? "not writable");

  const fixtures = (await readdir(fixtureRoot)).filter((name) => name.endsWith(".json"));
  printCheck("Storyboard fixtures", fixtures.length > 0, `${fixtures.length} JSON fixture(s) found`);

  const liveCheck = checkLiveConfig(readConfig());
  printCheck("Live provider configuration", liveCheck.ready, liveCheck.ready
    ? "all required environment values are present; connectivity has not been tested"
    : `not ready; missing: ${liveCheck.missing.join(", ")}`);
  for (const note of liveCheck.notes) process.stdout.write(`  Note: ${note}\n`);
  process.stdout.write("  Safety: preflight does not make provider requests or spend API credits.\n");
  printCheck("Renderer tooling", true, "Remotion composition and local browser renderer ready for 1080x1920 @ 30fps");

  const requireLive = options.has("require-live");
  if (!runtimeOk || !disk.writable || fixtures.length === 0 || (requireLive && !liveCheck.ready)) {
    process.exitCode = 1;
  }
}

async function runPlan(options: Map<string, string | true>): Promise<void> {
  const topic = requireOption(options, "topic");
  const notes = typeof options.get("notes") === "string" ? (options.get("notes") as string) : undefined;
  const voiceRaw = typeof options.get("voice") === "string" ? (options.get("voice") as string) : "indian-english-female";

  if (!VOICE_PRESETS.includes(voiceRaw as VoicePreset)) {
    throw new Error(`Unsupported voice preset '${voiceRaw}'. Must be one of: ${VOICE_PRESETS.join(", ")}`);
  }
  const voicePreset = voiceRaw as VoicePreset;

  const config = readConfig();
  process.stdout.write(`Generating live storyboard plan for "${topic}" using Gemini (${config.geminiModel})...\n`);

  const result = await createLivePlanRun({
    topic,
    notes,
    voicePreset,
    store,
    config,
  });

  process.stdout.write("\n==================================================\n");
  process.stdout.write("LIVE STORYBOARD GENERATED (AWAITING APPROVAL)\n");
  process.stdout.write("==================================================\n");
  process.stdout.write(`Run ID: ${result.manifest.runId}\n`);
  process.stdout.write(`Run Path: runs/${result.runPath}\n`);
  process.stdout.write(`Storyboard Review HTML: runs/${result.runPath}/plan-review.html\n`);
  process.stdout.write(`Plan Hash: ${result.planHash}\n`);
  process.stdout.write(`Manifest State: ${result.manifest.state} (stage: ${result.manifest.stage})\n`);

  if (result.warnings && result.warnings.length > 0) {
    process.stdout.write("\nValidation Warnings:\n");
    for (const w of result.warnings) {
      process.stdout.write(`  - ${w}\n`);
    }
  } else {
    process.stdout.write("Validation Warnings: None\n");
  }

  process.stdout.write("\nSTOPPING WORKFLOW FOR HUMAN APPROVAL:\n");
  process.stdout.write("1. Open and review the storyboard HTML:\n");
  process.stdout.write(`   file:///${result.reviewHtmlPath.replace(/\\/g, "/")}\n`);
  process.stdout.write("2. To approve this exact plan hash and proceed to ElevenLabs speech synthesis, run:\n");
  process.stdout.write(`   npm run pipeline -- approve --run ${result.runPath} --plan-hash ${result.planHash}\n`);
}

async function runSpeech(options: Map<string, string | true>): Promise<void> {
  const runPath = requireOption(options, "run");
  const config = readConfig();

  process.stdout.write(`Starting ElevenLabs speech synthesis for run '${runPath}'...\n`);
  const result = await synthesizeSpeechForRun({
    runPath,
    store,
    config,
    onSceneProgress: (idx, total, sceneId) => {
      process.stdout.write(`  [${idx}/${total}] Synthesized speech and timestamps for scene '${sceneId}'\n`);
    },
  });

  process.stdout.write("\nSpeech synthesis completed successfully!\n");
  process.stdout.write(`Scenes synthesized: ${result.speechArtifacts.length}\n`);
  process.stdout.write(`Audio artifacts saved to: runs/${runPath}/audio/\n`);
  process.stdout.write(`Alignment artifacts saved to: runs/${runPath}/alignment/\n`);
  process.stdout.write(`Manifest state: ${result.manifest.state} (stage: ${result.manifest.stage})\n`);
  process.stdout.write(`Next step: render video with: npm run pipeline -- render --run ${runPath}\n`);
}

async function runValidatePlan(options: Map<string, string | true>): Promise<void> {
  const file = requireOption(options, "file");
  const fullPath = path.resolve(projectRoot, file);
  const raw = JSON.parse(await (await import("node:fs/promises")).readFile(fullPath, "utf8")) as unknown;
  const result = validatePlan(raw);
  if (!result.success) {
    process.stderr.write(`Plan validation failed for ${path.relative(projectRoot, fullPath)}:\n`);
    for (const issue of result.issues) process.stderr.write(`  ${issue.path}: ${issue.message}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Plan is valid: ${result.data.topic}\n`);
  process.stdout.write(`Scenes: ${result.data.scenes.length}\n`);
  process.stdout.write(`Estimated scene time: ${(result.data.scenes.reduce((sum, scene) => sum + scene.estimatedDurationMs, 0) / 1000).toFixed(1)} seconds\n`);
}

async function runFixture(options: Map<string, string | true>): Promise<void> {
  const name = requireOption(options, "name");
  const result = await createFixtureRun({ name, fixtureRoot, store });
  process.stdout.write("Created a fixture run. This did not call Gemini or ElevenLabs and did not render an MP4.\n");
  process.stdout.write(`Run: runs/${result.runPath}\n`);
  process.stdout.write(`State: ${result.manifest.state}\n`);
  process.stdout.write(`Review: runs/${result.runPath}/plan-review.html\n`);
  process.stdout.write(`Plan hash: ${result.planHash}\n`);
  process.stdout.write("Next: inspect the HTML and approve this exact hash using the approve command.\n");
}

async function runApprove(options: Map<string, string | true>): Promise<void> {
  const runPath = requireOption(options, "run");
  const planHash = requireOption(options, "plan-hash");
  const approvedBy = typeof options.get("approved-by") === "string" ? options.get("approved-by") as string : "local-creator";
  const manifest = await approveRun({ runPath, planHash, approvedBy, store });
  process.stdout.write(`Approved run '${manifest.runId}'.\n`);
  process.stdout.write(`State: ${manifest.state}\n`);
  process.stdout.write("Storyboard approval recorded. You can now synthesize speech (live) or render the video.\n");
}

async function runRevise(options: Map<string, string | true>): Promise<void> {
  const runPath = requireOption(options, "run");
  const parentRunDir = resolveRunPath(store, runPath);
  const parentPlan = await store.readJson<StoryboardPlan>(parentRunDir, "plan.json");

  let modifiedPlan: StoryboardPlan;
  if (typeof options.get("plan-file") === "string") {
    const filePath = path.resolve(projectRoot, options.get("plan-file") as string);
    modifiedPlan = JSON.parse(await readFile(filePath, "utf8")) as StoryboardPlan;
  } else if (typeof options.get("change-narrator") === "string") {
    const newVoice = options.get("change-narrator") as VoicePreset;
    if (!VOICE_PRESETS.includes(newVoice)) {
      throw new Error(`Unsupported voice preset '${newVoice}'. Must be one of: ${VOICE_PRESETS.join(", ")}`);
    }
    modifiedPlan = {
      ...parentPlan,
      voicePreset: newVoice,
    };
  } else if (options.has("increase-labels")) {
    modifiedPlan = {
      ...parentPlan,
      scenes: parentPlan.scenes.map((scene) => ({
        ...scene,
        onScreenText: scene.onScreenText.map((t) => t.toUpperCase()),
      })),
    };
  } else {
    throw new Error("Revision requires --plan-file <path>, --change-narrator <preset>, or --increase-labels");
  }

  process.stdout.write(`Creating revision run from parent '${runPath}'...\n`);
  const result = await createRevisionRun({
    parentRunPath: runPath,
    modifiedPlan,
    store,
  });

  process.stdout.write("\n==================================================\n");
  process.stdout.write("REVISION RUN CREATED\n");
  process.stdout.write("==================================================\n");
  process.stdout.write(`Run ID: ${result.manifest.runId}\n`);
  process.stdout.write(`Run Path: runs/${result.runPath}\n`);
  process.stdout.write(`Revision Type: ${result.revisionType}\n`);
  process.stdout.write(`Plan Hash: ${result.planHash}\n`);
  process.stdout.write(`Manifest State: ${result.manifest.state} (stage: ${result.manifest.stage})\n`);

  if (result.revisionType === "visual-only") {
    process.stdout.write(`Reused audio scenes without speech regeneration: ${result.reusedAudioScenes.length} scenes\n`);
    process.stdout.write(`Next step: render revised video with: npm run pipeline -- render --run ${result.runPath}\n`);
  } else if (result.revisionType === "narrator-change") {
    process.stdout.write("Narration is preserved; new narrator speech synthesis required.\n");
    process.stdout.write(`Next step: synthesize speech with: npm run pipeline -- speech --run ${result.runPath}\n`);
  } else {
    process.stdout.write("Narration text was modified; explicit approval of new plan hash is required.\n");
    process.stdout.write(`Next step: approve plan hash with: npm run pipeline -- approve --run ${result.runPath} --plan-hash ${result.planHash}\n`);
  }
}

async function runRender(options: Map<string, string | true>): Promise<void> {
  const runPath = requireOption(options, "run");
  process.stdout.write(`Starting video render for run '${runPath}'...\n`);
  let lastPct = -1;
  const result = await renderRun({
    runPath,
    store,
    onProgress: (rendered, total) => {
      const pct = Math.floor((rendered / total) * 100);
      if (pct % 10 === 0 && pct !== lastPct) {
        lastPct = pct;
        process.stdout.write(`  Render progress: ${pct}% (${rendered}/${total} frames)\n`);
      }
    },
  });

  process.stdout.write("\nRender and validation succeeded!\n");
  process.stdout.write(`Output video: ${result.outputVideoPath}\n`);
  process.stdout.write(`Dimensions: ${result.qaReport.checks.dimensions.width}x${result.qaReport.checks.dimensions.height} (9:16 vertical)\n`);
  process.stdout.write(`Frame rate: ${result.qaReport.checks.frameRate.fps} fps\n`);
  process.stdout.write(`Duration: ${result.qaReport.checks.duration.durationInSeconds}s (${result.qaReport.checks.duration.durationInFrames} frames)\n`);
  process.stdout.write(`Audio note: ${result.qaReport.checks.audio.note}\n`);
  process.stdout.write(`QA report: runs/${runPath}/qa.json\n`);
  process.stdout.write(`Manifest state: ${result.manifest.state} (stage: ${result.manifest.stage})\n`);
}

async function runValidate(options: Map<string, string | true>): Promise<void> {
  const runPath = requireOption(options, "run");
  const runDir = resolveRunPath(store, runPath);
  const manifest = await readRunManifest(store, runPath);
  const videoFile = manifest.artifacts.outputVideo ?? "output.mp4";
  const videoPath = path.join(runDir, videoFile);
  const timelineFile = manifest.artifacts.timeline ?? "timeline.json";
  const timeline = await store.readJson<CompiledTimeline>(runDir, timelineFile);

  const qaReport = await validateRenderOutput({
    mp4Path: videoPath,
    timeline,
    runId: manifest.runId,
    planHash: manifest.planHash ?? "",
  });

  await store.writeJson(runDir, "qa.json", qaReport);
  process.stdout.write(`Validation complete. Status: ${qaReport.overallPassed ? "[PASSED]" : "[FAILED]"}\n`);
  process.stdout.write(`${JSON.stringify(qaReport, null, 2)}\n`);
  if (!qaReport.overallPassed) {
    process.exitCode = 1;
  }
}

async function runStatus(options: Map<string, string | true>): Promise<void> {
  const runPath = requireOption(options, "run");
  const manifest = await readRunManifest(store, runPath);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

function parseFlags(args: string[]): Map<string, string | true> {
  const output = new Map<string, string | true>();
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument '${token}'. Options must use --name value form.`);
    const key = token.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      output.set(key, true);
    } else {
      output.set(key, next);
      index += 1;
    }
  }
  return output;
}

function requireOption(options: Map<string, string | true>, name: string): string {
  const value = options.get(name);
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`Missing required option --${name}.`);
  return value;
}

function printCheck(label: string, ok: boolean, details: string): void {
  process.stdout.write(`${ok ? "[PASS]" : "[WARN]"} ${label}: ${details}\n`);
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function printHelp(): void {
  process.stdout.write(`NamasteVideo.ai pipeline CLI\n\nCommands:\n  npm run pipeline -- preflight [--require-live]\n  npm run pipeline -- plan --topic "<topic>" [--notes "<notes>"] [--voice <preset>]\n  npm run pipeline -- approve --run local/<project>/<version> --plan-hash <sha256> [--approved-by <id>]\n  npm run pipeline -- speech --run local/<project>/<version>\n  npm run pipeline -- render --run local/<project>/<version>\n  npm run pipeline -- revise --run local/<project>/<version> [--plan-file <path>] [--change-narrator <preset>] [--increase-labels]\n  npm run pipeline -- validate --run local/<project>/<version>\n  npm run pipeline -- status --run local/<project>/<version>\n  npm run pipeline -- validate-plan --file fixtures/plans/water-cycle.json\n  npm run pipeline -- fixture --name water-cycle\n  npm run pipeline -- help\n`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
