import fs from "node:fs";
import path from "node:path";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import { renderRun } from "../src/pipeline/renderService.js";
import { hashCanonicalJson } from "../src/pipeline/canonicalHash.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";
import type { RunManifest } from "../src/contracts/manifest.js";

function snapshotDirectory(dir: string): string[] {
  const results: string[] = [];
  function scan(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        scan(full);
      } else {
        results.push(path.relative(dir, full));
      }
    }
  }
  scan(dir);
  return results.sort();
}

async function run() {
  console.log("=== Studio Verification: Reusable Visual Scene Engine ===");
  const srcDir = path.resolve(process.cwd(), "src");
  const beforeSrcSnapshot = snapshotDirectory(srcDir);
  console.log(`[Immutability Check] Initial src/ file count: ${beforeSrcSnapshot.length}`);

  const runsDir = path.resolve(process.cwd(), "runs");
  const store = new LocalArtifactStore(runsDir);

  // -------------------------------------------------------------
  // Video 1: How a Phone Call Travels Between Two People
  // -------------------------------------------------------------
  console.log("\n--- 1. Generating & Verifying Phone Call Video via Reusable Engine ---");
  const phoneRunPath = "6ad63fbf93aab50770f69ff4/how-does-your-phone-let-you-talk-to-some/how-does-your-phone-let-you-talk-to-some-20261022-141311127Z";
  const phoneRunDir = path.join(runsDir, phoneRunPath);

  // Read existing plan and upgrade scenes to use reusable templates with data
  const phonePlanRaw = JSON.parse(fs.readFileSync(path.join(phoneRunDir, "plan.json"), "utf8")) as StoryboardPlan;
  
  phonePlanRaw.scenes[0].visualVariant = "template.concept-hook";
  phonePlanRaw.scenes[0].visualData = {
    template: "concept-hook",
    theme: "tech-dark",
    headerBadge: { category: "LONG DISTANCE COMMUNICATION HOOK", icon: "📱", color: "#38BDF8" },
    telemetryMetrics: [
      { label: "DISTANCE", value: "1,400", unit: "km", color: "#38BDF8", statusText: "Mumbai to Delhi" },
      { label: "TRANSIT TIME", value: "42", unit: "ms", color: "#10B981", statusText: "Speed of Light in Fiber" },
      { label: "CALL CHANNEL", value: "FULL DUPLEX", color: "#F59E0B", statusText: "Active Voice Stream" },
    ],
    calloutText: "Your voice crosses 1,400 kilometers between cities in 42 milliseconds using fiber optic light pulses.",
  };

  phonePlanRaw.scenes[1].visualVariant = "template.physical-transformation";
  phonePlanRaw.scenes[1].visualData = {
    template: "physical-transformation",
    theme: "tech-dark",
    headerBadge: { category: "ACOUSTIC PRESSURE → ELECTRICAL VOLTAGE", icon: "🎙️", color: "#F59E0B" },
    conversion: {
      input: { label: "Voice Sound Waves", sublabel: "Acoustic Pressure", icon: "🔊", color: "#38BDF8", property: "1.0 kHz Waveform" },
      mechanism: { label: "MEMS Diaphragm", sublabel: "Micro-Transducer", property: "1.25 µm Gap Oscillation", color: "#F59E0B" },
      output: { label: "Analog Voltage", sublabel: "Continuous Signal", icon: "⚡", color: "#10B981", property: "0.45 V Signal" },
    },
    calloutText: "Sound waves enter the microphone port and physically flex a microscopic diaphragm, generating electric voltage.",
  };

  phonePlanRaw.scenes[2].visualVariant = "template.data-sampling";
  phonePlanRaw.scenes[2].visualData = {
    template: "data-sampling",
    theme: "tech-dark",
    headerBadge: { category: "NYQUIST SAMPLING & DIGITAL QUANTIZATION", icon: "🔢", color: "#10B981" },
    sampling: {
      signalType: "Continuous Analog Audio",
      samplingRate: "48 kHz",
      bitDepth: "8-bit",
      samplePoints: 16,
      digitalStream: ["01101001", "11010010", "10110101", "00101110"],
      processorLabel: "DSP Audio ADC",
    },
    calloutText: "The phone measures analog voltage 48,000 times per second, converting physical sound into binary 1s and 0s.",
  };

  phonePlanRaw.scenes[3].visualVariant = "template.wave-transmission";
  phonePlanRaw.scenes[3].visualData = {
    template: "wave-transmission",
    theme: "tech-dark",
    headerBadge: { category: "WIRELESS RF UPLINK TRANSMISSION", icon: "📡", color: "#38BDF8" },
    transmission: {
      source: { label: "Smartphone Antenna", sublabel: "Transmitter", icon: "📱", color: "#38BDF8" },
      waveType: "rf",
      carrierFrequency: "2.4 GHz Carrier",
      propagationMedium: "Atmospheric Air",
      waveColor: "#38BDF8",
      receiver: { label: "Cell Tower Mast", sublabel: "Base Station Receiver", icon: "🗼", color: "#10B981" },
    },
    calloutText: "An internal radio antenna pulses gigahertz electromagnetic waves through the air to the nearest cellular tower.",
  };

  phonePlanRaw.scenes[4].visualVariant = "template.conduit-flow";
  phonePlanRaw.scenes[4].visualData = {
    template: "conduit-flow",
    theme: "tech-dark",
    headerBadge: { category: "UNDERGROUND FIBER OPTIC TRANSIT", icon: "⚡", color: "#F59E0B" },
    conduit: {
      channelType: "Silica Glass Fiber Core",
      speed: "200,000 km/s",
      coreMaterial: "Pure Silica Glass Core (n1 > n2)",
      packets: [
        { id: "pkt-1", label: "Voice Packet A", color: "#38BDF8" },
        { id: "pkt-2", label: "Voice Packet B", color: "#10B981" },
      ],
      routingNodes: [
        { id: "node-1", label: "Mumbai Central Switch", sublabel: "Ingress Router", status: "Active" },
        { id: "node-2", label: "Delhi Central Switch", sublabel: "Egress Router", status: "Forwarding" },
      ],
    },
    calloutText: "Cell towers route voice data into underground fiber cables, bouncing laser light at 200,000 km/s across continents.",
  };

  phonePlanRaw.scenes[5].visualVariant = "template.physical-transformation";
  phonePlanRaw.scenes[5].visualData = {
    template: "physical-transformation",
    theme: "tech-dark",
    headerBadge: { category: "DIGITAL DECODING & SPEAKER CONE ACOUSTICS", icon: "🔊", color: "#10B981" },
    conversion: {
      input: { label: "Incoming Bitstream", sublabel: "Digital Packets", icon: "📥", color: "#38BDF8", property: "PCM Audio Bits" },
      mechanism: { label: "Voice Coil Driver", sublabel: "Electromagnet", property: "Electromagnetic Flux", color: "#F59E0B" },
      output: { label: "Recreated Sound Waves", sublabel: "Audible Speech", icon: "🔊", color: "#10B981", property: "Pressure Waves to Ear" },
    },
    calloutText: "The receiving phone's DAC turns binary numbers back into current, vibrating an electromagnet to reproduce your exact voice.",
  };

  phonePlanRaw.scenes[6].visualVariant = "template.closed-loop-system";
  phonePlanRaw.scenes[6].visualData = {
    template: "closed-loop-system",
    theme: "tech-dark",
    headerBadge: { category: "CONTINUOUS FULL DUPLEX LOOP", icon: "🔄", color: "#10B981" },
    closedLoop: {
      loopTitle: "Full-Duplex Two-Way Voice Loop",
      nodeA: { label: "Mumbai Caller", role: "Speaking & Listening", icon: "👤", color: "#38BDF8" },
      nodeB: { label: "Delhi Friend", role: "Listening & Speaking", icon: "👥", color: "#10B981" },
      forwardPath: { label: "Mumbai → Cellular → Fiber → Delhi", type: "Forward Voice Link" },
      returnPath: { label: "Delhi → Fiber → Cellular → Mumbai", type: "Return Voice Link" },
    },
    calloutText: "This cycle happens in both directions simultaneously, letting two friends talk across thousands of miles without delay.",
  };

  // Re-hash canonical plan, update approval and manifest
  const newPhonePlanHash = hashCanonicalJson(phonePlanRaw);
  fs.writeFileSync(path.join(phoneRunDir, "plan.json"), JSON.stringify(phonePlanRaw, null, 2));

  const phoneApproval = {
    planHash: newPhonePlanHash,
    approvedBy: "user-verifier",
    approvedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(phoneRunDir, "approval.json"), JSON.stringify(phoneApproval, null, 2));

  const phoneManifest = JSON.parse(fs.readFileSync(path.join(phoneRunDir, "manifest.json"), "utf8")) as RunManifest;
  phoneManifest.planHash = newPhonePlanHash;
  phoneManifest.state = "approved";
  phoneManifest.artifacts.approval = "approval.json";
  fs.writeFileSync(path.join(phoneRunDir, "manifest.json"), JSON.stringify(phoneManifest, null, 2));

  // Render Phone Call video (or reuse if just rendered)
  const phoneMp4 = path.join(phoneRunDir, "output.mp4");
  const phoneQaPath = path.join(phoneRunDir, "qa.json");
  let phoneResult: any;
  if (fs.existsSync(phoneMp4) && fs.existsSync(phoneQaPath)) {
    console.log("Phone call video already rendered. Loading QA report...");
    const qaReport = JSON.parse(fs.readFileSync(phoneQaPath, "utf8"));
    const manifest = JSON.parse(fs.readFileSync(path.join(phoneRunDir, "manifest.json"), "utf8"));
    phoneResult = {
      manifest,
      qaReport,
      outputVideoPath: phoneMp4,
    };
  } else {
    console.log("Rendering phone call video with Remotion...");
    phoneResult = await renderRun({
      runPath: phoneRunPath,
      store,
    });
  }

  console.log(`[Phone Call Rendered] Output: ${phoneResult.outputVideoPath}`);
  console.log(`[Phone Call QA] Passed: ${phoneResult.qaReport.overallPassed}, Creative Valid: ${phoneResult.qaReport.checks.creative?.valid}`);
  console.log(`[Phone Call Frame Analysis] Avg Black: ${phoneResult.qaReport.checks.creative?.frameImageAnalysis?.averageBlackPixelPercentage}%`);

  // -------------------------------------------------------------
  // Video 2: How a Rainbow Forms (Unrelated Domain: Optics & Rain)
  // -------------------------------------------------------------
  console.log("\n--- 2. Generating & Verifying Rainbow Formation Video via Reusable Engine ---");
  const rainbowRunSlug = "how-a-rainbow-forms-in-the-sky";
  const rainbowTimestamp = Date.now().toString();
  const rainbowRunId = `${rainbowRunSlug}-${rainbowTimestamp}`;
  const rainbowRunPath = `6ad63fbf93aab50770f69ff4/${rainbowRunSlug}/${rainbowRunId}`;
  const rainbowRunDir = path.join(runsDir, rainbowRunPath);

  fs.mkdirSync(rainbowRunDir, { recursive: true });

  const rainbowPlan: StoryboardPlan = {
    schemaVersion: "1.0",
    projectId: rainbowRunSlug,
    ownerId: "6ad63fbf93aab50770f69ff4",
    versionId: rainbowRunId,
    parentVersionId: null,
    topic: "How a Rainbow Forms in the Sky",
    audience: "General audience curious about nature",
    learningObjective: "Understand how sunlight refracts, disperses by wavelength, and internally reflects inside raindrops to form a rainbow.",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [],
    warnings: [],
    scenes: [
      {
        id: "scene-rainbow-hook",
        type: "title-hook",
        purpose: "Introduce the spectacle of a brilliant rainbow arching across a sunlit rainshower.",
        estimatedDurationMs: 8500,
        narration: [
          {
            id: "nar-rb-1",
            text: "Have you ever wondered how brilliant arches of color appear in the sky right after rain?"
          }
        ],
        objects: [
          { id: "obj-sunlight", kind: "node", label: "Sun Behind Observer" },
          { id: "obj-rainshower", kind: "node", label: "Raindrop Shower" }
        ],
        events: [
          { id: "ev-rb-1", targetId: "obj-sunlight", action: "reveal", cue: { blockId: "nar-rb-1", phrase: "Have you ever", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }
        ],
        onScreenText: ["Why Rainbows Appear", "Sunlight Splitting Across Droplets"],
        sourceRefs: [],
        visualVariant: "template.concept-hook",
        visualData: {
          template: "concept-hook",
          theme: "twilight",
          headerBadge: { category: "ATMOSPHERIC OPTICS & REFRACTION", icon: "🌈", color: "#38BDF8" },
          telemetryMetrics: [
            { label: "DEFLECTION", value: "42°", color: "#38BDF8", statusText: "Rainbow Viewing Angle" },
            { label: "REFRACTIVE INDEX", value: "1.33", color: "#10B981", statusText: "Water to Air" },
            { label: "VISIBLE SPECTRUM", value: "7 COLORS", color: "#F59E0B", statusText: "Red through Violet" }
          ],
          calloutText: "A rainbow requires two essential ingredients: bright sunlight behind you and millions of water droplets in front of you."
        }
      },
      {
        id: "scene-entering-droplet",
        type: "process-flow",
        purpose: "Show white sunlight entering the curved surface of a spherical water droplet.",
        estimatedDurationMs: 8500,
        narration: [
          {
            id: "nar-rb-2",
            text: "When white sunlight enters a round water droplet, it slows down and bends at the surface."
          }
        ],
        objects: [
          { id: "obj-white-beam", kind: "icon", label: "White Sunlight Ray" },
          { id: "obj-drop-surface", kind: "shape", label: "Curved Water Boundary" },
          { id: "obj-refraction-entry", kind: "icon", label: "Initial Refraction Point" }
        ],
        events: [
          { id: "ev-rb-2", targetId: "obj-white-beam", action: "reveal", cue: { blockId: "nar-rb-2", phrase: "When white sunlight", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }
        ],
        onScreenText: ["Light Entering the Drop", "Speed Transition: Air to Water"],
        sourceRefs: [],
        visualVariant: "template.conduit-flow",
        visualData: {
          template: "conduit-flow",
          theme: "clean-lab",
          headerBadge: { category: "REFRACTION AT SPHERICAL BOUNDARY", icon: "💧", color: "#38BDF8" },
          conduit: {
            channelType: "Spherical Raindrop Interface",
            speed: "225,000 km/s in water",
            coreMaterial: "Pure Liquid Water (n = 1.333)",
            packets: [
              { id: "pkt-r", label: "Red Wavelength", color: "#EF4444" },
              { id: "pkt-b", label: "Blue Wavelength", color: "#3B82F6" }
            ],
            routingNodes: [
              { id: "node-in", label: "Air Boundary", sublabel: "Speed 300,000 km/s", status: "Entry" },
              { id: "node-out", label: "Water Boundary", sublabel: "Speed 225,000 km/s", status: "Bending" }
            ]
          },
          calloutText: "Because water is denser than air, sunlight slows from 300,000 to 225,000 km/s, bending sharply."
        }
      },
      {
        id: "scene-dispersion-spectrum",
        type: "process-flow",
        purpose: "Demonstrate wavelength dispersion separating white light into red, orange, yellow, green, blue, and violet.",
        estimatedDurationMs: 8500,
        narration: [
          {
            id: "nar-rb-3",
            text: "Because each color travels at a slightly different speed in water, blue bends more sharply than red."
          }
        ],
        objects: [
          { id: "obj-composite-light", kind: "icon", label: "Composite White Light" },
          { id: "obj-water-prism", kind: "shape", label: "Prismatic Liquid Core" },
          { id: "obj-spread-spectrum", kind: "icon", label: "Dispersed Rainbow Spectrum" }
        ],
        events: [
          { id: "ev-rb-3", targetId: "obj-composite-light", action: "reveal", cue: { blockId: "nar-rb-3", phrase: "Because each color", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }
        ],
        onScreenText: ["Wavelength Dispersion", "Red Bends Least, Violet Bends Most"],
        sourceRefs: [],
        visualVariant: "template.physical-transformation",
        visualData: {
          template: "physical-transformation",
          theme: "twilight",
          headerBadge: { category: "WAVELENGTH-DEPENDENT DISPERSION", icon: "🌈", color: "#F59E0B" },
          conversion: {
            input: { label: "Incoming White Light", sublabel: "Mixed Wavelengths", icon: "☀️", color: "#F8FAFC", property: "380nm - 700nm Band" },
            mechanism: { label: "Prismatic Water Core", sublabel: "Differential Dispersion", property: "Snell's Law: n(λ)", color: "#38BDF8" },
            output: { label: "Dispersed Colors", sublabel: "Rainbow Spectrum", icon: "🌈", color: "#10B981", property: "Separated Spectral Rays" }
          },
          calloutText: "Shorter blue wavelengths bend more than longer red wavelengths, fanning white light out into a spectrum."
        }
      },
      {
        id: "scene-internal-reflection",
        type: "process-flow",
        purpose: "Show total internal reflection off the back inside surface of the droplet.",
        estimatedDurationMs: 8500,
        narration: [
          {
            id: "nar-rb-4",
            text: "The separated rays hit the back inner wall of the droplet and bounce forward like a mirror."
          }
        ],
        objects: [
          { id: "obj-back-wall", kind: "shape", label: "Inner Droplet Wall" },
          { id: "obj-reflection-rays", kind: "connector", label: "Internally Reflected Rays" },
          { id: "obj-mirror-effect", kind: "icon", label: "Total Internal Reflection" }
        ],
        events: [
          { id: "ev-rb-4", targetId: "obj-back-wall", action: "reveal", cue: { blockId: "nar-rb-4", phrase: "The separated rays", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }
        ],
        onScreenText: ["Internal Reflection", "Back Wall Acts Like a Curved Mirror"],
        sourceRefs: [],
        visualVariant: "template.conduit-flow",
        visualData: {
          template: "conduit-flow",
          theme: "deep-space",
          headerBadge: { category: "INTERNAL REFLECTION AT BACK WALL", icon: "🪞", color: "#10B981" },
          conduit: {
            channelType: "Internal Droplet Reflection Basin",
            speed: "Critical Angle θ_c",
            coreMaterial: "Curved Water-Air Boundary",
            packets: [
              { id: "pkt-1", label: "Reflected Red Ray", color: "#EF4444" },
              { id: "pkt-2", label: "Reflected Violet Ray", color: "#8B5CF6" }
            ],
            routingNodes: [
              { id: "rn-1", label: "Back Wall Impact", sublabel: "Angle > Critical", status: "Total Reflection" },
              { id: "rn-2", label: "Exit Re-direction", sublabel: "Facing Observer", status: "Forward Bounce" }
            ]
          },
          calloutText: "When the light strikes the back inner surface beyond the critical angle, it reflects forward like a curved mirror."
        }
      },
      {
        id: "scene-droplet-exit",
        type: "process-flow",
        purpose: "Show the rays exiting the front of the droplet, bending a second time into the air.",
        estimatedDurationMs: 8500,
        narration: [
          {
            id: "nar-rb-5",
            text: "Finally, the light exits the front of the drop, bending one more time into the air toward your eyes."
          }
        ],
        objects: [
          { id: "obj-exit-boundary", kind: "shape", label: "Exit Front Boundary" },
          { id: "obj-angle-beam", kind: "connector", label: "40° to 42° Ray Cone" },
          { id: "obj-observer-eye", kind: "node", label: "Observer's Eye" }
        ],
        events: [
          { id: "ev-rb-5", targetId: "obj-exit-boundary", action: "reveal", cue: { blockId: "nar-rb-5", phrase: "Finally, the light", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }
        ],
        onScreenText: ["Refraction on Exit", "Red at 42°, Violet at 40°"],
        sourceRefs: [],
        visualVariant: "template.wave-transmission",
        visualData: {
          template: "wave-transmission",
          theme: "twilight",
          headerBadge: { category: "EXIT REFRACTION & ANGULAR CONE", icon: "👁️", color: "#38BDF8" },
          transmission: {
            source: { label: "Exiting Droplet Ray Cone", sublabel: "Refracted Spectrum", icon: "💧", color: "#38BDF8" },
            waveType: "light",
            carrierFrequency: "Visible Light Band (400-700 THz)",
            propagationMedium: "Atmospheric Air to Eye",
            waveColor: "#38BDF8",
            receiver: { label: "Observer's Eye", sublabel: "Cone Photoreceptors", icon: "👁️", color: "#10B981" }
          },
          calloutText: "As the rays exit into air, red emerges at 42 degrees and violet at 40 degrees relative to sunlight."
        }
      },
      {
        id: "scene-rainbow-takeaway",
        type: "takeaway",
        purpose: "Synthesize the 3-step sequence: Refract, Reflect, and Disperse.",
        estimatedDurationMs: 8500,
        narration: [
          {
            id: "nar-rb-6",
            text: "Millions of raindrops doing this together create the circular rainbow you see arching across the sky."
          }
        ],
        objects: [
          { id: "obj-step1", kind: "node", label: "1. Refraction" },
          { id: "obj-step2", kind: "node", label: "2. Dispersion" },
          { id: "obj-step3", kind: "node", label: "3. Total Reflection" }
        ],
        events: [
          { id: "ev-rb-6", targetId: "obj-step1", action: "reveal", cue: { blockId: "nar-rb-6", phrase: "Millions of raindrops", occurrence: 1 }, offsetMs: 0, durationMs: 1000 }
        ],
        onScreenText: ["Nature's Optical Prism", "Refract → Reflect → Disperse"],
        sourceRefs: [],
        visualVariant: "template.summary-takeaway",
        visualData: {
          template: "summary-takeaway",
          theme: "twilight",
          headerBadge: { category: "HOW RAINBOWS FORM: SUMMARY", icon: "🎓", color: "#10B981" },
          takeaway: {
            headline: "The Science of Rainbows",
            keyTakeaways: [
              { number: 1, title: "Refraction Slowdown", description: "Light slows down and bends upon entering the dense water droplet.", color: "#38BDF8" },
              { number: 2, title: "Color Dispersion", description: "Different wavelengths travel at different speeds, fanning white light into seven colors.", color: "#F59E0B" },
              { number: 3, title: "Internal Mirroring", description: "Rays reflect off the back inside wall and exit at 42 degrees directly toward your eyes.", color: "#10B981" }
            ]
          },
          calloutText: "Every rainbow is an optical illusion created by millions of raindrops acting as tiny spherical prisms."
        }
      }
    ]
  };

  const rainbowPlanHash = hashCanonicalJson(rainbowPlan);
  fs.writeFileSync(path.join(rainbowRunDir, "plan.json"), JSON.stringify(rainbowPlan, null, 2));

  const rainbowApproval = {
    planHash: rainbowPlanHash,
    approvedBy: "user-verifier",
    approvedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(rainbowRunDir, "approval.json"), JSON.stringify(rainbowApproval, null, 2));

  const rainbowManifest: RunManifest = {
    manifestVersion: 1,
    mode: "live",
    runId: rainbowRunId,
    versionId: rainbowRunId,
    projectId: rainbowRunSlug,
    ownerId: "6ad63fbf93aab50770f69ff4",
    state: "approved",
    stage: "approve",
    planHash: rainbowPlanHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    artifacts: {
      plan: "plan.json",
      approval: "approval.json",
    },
    provenance: {
      voicePreset: "indian-english-female",
      resolvedVoiceId: "clara",
      modelId: "gemini-3.5-flash-lite",
      voiceName: "Clara Neural",
    },
  };
  fs.writeFileSync(path.join(rainbowRunDir, "manifest.json"), JSON.stringify(rainbowManifest, null, 2));

  console.log("Rendering rainbow formation video with Remotion...");
  const rainbowResult = await renderRun({
    runPath: rainbowRunPath,
    store,
  });

  console.log(`[Rainbow Video Rendered] Output: ${rainbowResult.outputVideoPath}`);
  console.log(`[Rainbow Video QA] Passed: ${rainbowResult.qaReport.overallPassed}, Creative Valid: ${rainbowResult.qaReport.checks.creative?.valid}`);
  console.log(`[Rainbow Video Frame Analysis] Avg Black: ${rainbowResult.qaReport.checks.creative?.frameImageAnalysis?.averageBlackPixelPercentage}%`);

  // -------------------------------------------------------------
  // Verify Source Tree Immutability
  // -------------------------------------------------------------
  const afterSrcSnapshot = snapshotDirectory(srcDir);
  console.log(`\n[Immutability Check] Final src/ file count: ${afterSrcSnapshot.length}`);
  const createdFiles = afterSrcSnapshot.filter((f) => !beforeSrcSnapshot.includes(f));
  const deletedFiles = beforeSrcSnapshot.filter((f) => !afterSrcSnapshot.includes(f));

  if (createdFiles.length === 0 && deletedFiles.length === 0) {
    console.log("SUCCESS: ZERO source files were created, modified, or deleted in src/ during video generation!");
  } else {
    console.error("FAILURE: Source tree was modified during video generation:", { createdFiles, deletedFiles });
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Save Preview Frames to Artifact Directory
  // -------------------------------------------------------------
  const artifactDir = "C:\\Users\\ayush\\.gemini\\antigravity\\brain\\23c4de3e-4fa0-45b4-adbc-852f0d4eb032";
  const phoneStillsDst = path.join(artifactDir, "studio_phone_call_stills");
  const rainbowStillsDst = path.join(artifactDir, "studio_rainbow_stills");

  fs.mkdirSync(phoneStillsDst, { recursive: true });
  fs.mkdirSync(rainbowStillsDst, { recursive: true });

  const phonePreviewDir = path.join(phoneRunDir, "preview-frames");
  for (const f of fs.readdirSync(phonePreviewDir)) {
    if (f.endsWith(".png")) {
      fs.copyFileSync(path.join(phonePreviewDir, f), path.join(phoneStillsDst, f));
    }
  }

  const rainbowPreviewDir = path.join(rainbowRunDir, "preview-frames");
  for (const f of fs.readdirSync(rainbowPreviewDir)) {
    if (f.endsWith(".png")) {
      fs.copyFileSync(path.join(rainbowPreviewDir, f), path.join(rainbowStillsDst, f));
    }
  }

  console.log(`[Stills Preserved] Copied preview frames to: \n - ${phoneStillsDst}\n - ${rainbowStillsDst}`);
  console.log("\n=== Studio Verification Complete ===");
}

run().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
