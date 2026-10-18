import assert from "node:assert/strict";
import test from "node:test";
import { compilePlanTimeline } from "../src/timing/timelineCompiler.js";
import { renderSceneComponent } from "../src/video/MainVideo.js";
import {
  validateVisualSelection,
  resolveTopicDomain,
  CrossTopicContaminationError,
} from "../src/video/registry/index.js";
import {
  GenericTitleHook,
  GenericLabeledDiagram,
  GenericProcessFlow,
  GenericComparison,
  GenericTakeaway,
} from "../src/video/core/generic/index.js";
import {
  validateSceneDomainSemantics,
  validatePlanDomainSemantics,
} from "../src/validation/semanticValidator.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";

function createDynamicApiPlan(): StoryboardPlan {
  return {
    schemaVersion: "1.0",
    projectId: "how-an-api-request-works",
    ownerId: "local",
    versionId: "run-api-001",
    parentVersionId: null,
    topic: "How an API Request Works",
    audience: "Computer Science Students",
    learningObjective: "Understand client-server architecture, HTTP requests, and backend data retrieval.",
    language: "en",
    voicePreset: "indian-english-female",
    sources: [{ id: "src-1", text: "HTTP networking fundamentals" }],
    scenes: [
      {
        id: "scene-api-intro",
        type: "title-hook",
        purpose: "Introduce how client applications talk to web servers across the internet.",
        estimatedDurationMs: 13000,
        narration: [
          {
            id: "narr-1",
            text: "Every time you tap a button on your phone, an API request travels across the world to fetch your data.",
          },
        ],
        objects: [
          { id: "obj-client-app", kind: "node", label: "Mobile Application" },
          { id: "obj-api-cloud", kind: "container", label: "Cloud Backend" },
        ],
        events: [
          {
            id: "ev-1",
            targetId: "obj-client-app",
            action: "reveal",
            cue: { blockId: "narr-1", phrase: "tap a button", occurrence: 1 },
            offsetMs: 0,
            durationMs: 500,
          },
        ],
        onScreenText: ["How an API Request Works", "Client to Cloud Architecture"],
        sourceRefs: ["src-1"],
      },
      {
        id: "scene-api-architecture",
        type: "labeled-diagram",
        purpose: "Display the core components involved in an API transaction.",
        estimatedDurationMs: 13000,
        narration: [
          {
            id: "narr-2",
            text: "The request moves from the client device through a load balancer to a backend application server, which queries the database.",
          },
        ],
        objects: [
          { id: "obj-client", kind: "node", label: "Client Device" },
          { id: "obj-lb", kind: "node", label: "Load Balancer" },
          { id: "obj-app-server", kind: "node", label: "Application Server" },
          { id: "obj-db", kind: "node", label: "Database Cluster" },
        ],
        events: [
          {
            id: "ev-2",
            targetId: "obj-client",
            action: "reveal",
            cue: { blockId: "narr-2", phrase: "moves from the client", occurrence: 1 },
            offsetMs: 0,
            durationMs: 500,
          },
        ],
        onScreenText: ["API Architecture", "Request Journey Across Nodes"],
        sourceRefs: ["src-1"],
      },
      {
        id: "scene-api-lifecycle",
        type: "process-flow",
        purpose: "Walk through the 4 sequential phases of an HTTP transaction.",
        estimatedDurationMs: 13000,
        narration: [
          {
            id: "narr-3",
            text: "First, DNS resolves the domain name into an IP address. Next, a secure TLS handshake establishes encryption. Then the HTTP request is sent, and finally the server returns a response.",
          },
        ],
        objects: [
          { id: "stage-dns", kind: "node", label: "1. DNS Resolution" },
          { id: "stage-tls", kind: "node", label: "2. TLS Handshake" },
          { id: "stage-request", kind: "node", label: "3. HTTP Request" },
          { id: "stage-response", kind: "node", label: "4. JSON Response" },
        ],
        events: [
          {
            id: "ev-3",
            targetId: "stage-dns",
            action: "reveal",
            cue: { blockId: "narr-3", phrase: "DNS resolves", occurrence: 1 },
            offsetMs: 0,
            durationMs: 500,
          },
        ],
        onScreenText: ["Request Lifecycle", "From Domain to Data"],
        sourceRefs: ["src-1"],
      },
      {
        id: "scene-api-comparison",
        type: "comparison",
        purpose: "Compare REST APIs with GraphQL query endpoints.",
        estimatedDurationMs: 13000,
        narration: [
          {
            id: "narr-4",
            text: "REST APIs use multiple fixed endpoints returning fixed data structures, while GraphQL lets clients request exactly the fields they need in a single round trip.",
          },
        ],
        objects: [
          { id: "obj-rest", kind: "container", label: "REST Architecture" },
          { id: "obj-graphql", kind: "container", label: "GraphQL Architecture" },
          { id: "prop-endpoints", kind: "label", label: "Multiple Endpoints" },
          { id: "prop-single-query", kind: "label", label: "Single Smart Endpoint" },
        ],
        events: [
          {
            id: "ev-4",
            targetId: "obj-rest",
            action: "reveal",
            cue: { blockId: "narr-4", phrase: "REST APIs", occurrence: 1 },
            offsetMs: 0,
            durationMs: 500,
          },
        ],
        onScreenText: ["REST vs GraphQL", "Comparing API Paradigms"],
        sourceRefs: ["src-1"],
      },
      {
        id: "scene-api-takeaway",
        type: "takeaway",
        purpose: "Summarize the key principles of modern web APIs.",
        estimatedDurationMs: 13000,
        narration: [
          {
            id: "narr-5",
            text: "In summary, APIs provide standard, secure contracts that allow distributed systems to exchange data reliably across the globe.",
          },
        ],
        objects: [
          { id: "takeaway-contract", kind: "node", label: "Standardized Contracts" },
          { id: "takeaway-security", kind: "node", label: "Encrypted Transport" },
          { id: "takeaway-decoupling", kind: "node", label: "Decoupled Architecture" },
        ],
        events: [
          {
            id: "ev-5",
            targetId: "takeaway-contract",
            action: "reveal",
            cue: { blockId: "narr-5", phrase: "standard, secure contracts", occurrence: 1 },
            offsetMs: 0,
            durationMs: 500,
          },
        ],
        onScreenText: ["Key API Takeaways", "Reliable Distributed Communication"],
        sourceRefs: ["src-1"],
      },
    ],
    warnings: [],
  };
}

test("Dynamic Topic: novel 'How an API Request Works' compiles cleanly with zero contamination", () => {
  const plan = createDynamicApiPlan();

  // 1. Topic domain resolves to generic
  const domain = resolveTopicDomain(plan.topic);
  assert.equal(domain, "generic");

  // 2. Semantic validation passes with 0 domain issues
  const semanticResult = validatePlanDomainSemantics(plan);
  assert.equal(semanticResult.valid, true);
  assert.equal(semanticResult.issues.length, 0);

  // 3. Compile timeline
  const timeline = compilePlanTimeline(plan);
  assert.equal(timeline.scenes.length, 5);

  // 4. Verify all scenes resolved strictly to generic variants
  const expectedVariants = [
    "generic.title-hook",
    "generic.labeled-diagram",
    "generic.process-flow",
    "generic.comparison",
    "generic.takeaway",
  ];

  for (let i = 0; i < timeline.scenes.length; i++) {
    const scene = timeline.scenes[i];
    assert.equal(
      scene.visualVariant,
      expectedVariants[i],
      `Scene ${i + 1} (${scene.sceneId}) must resolve to ${expectedVariants[i]}`
    );

    // Verify visual selection against topic domain allows generic
    const validated = validateVisualSelection(plan.topic, scene.visualVariant!);
    assert.equal(validated.isValid, true);
  }

  // 5. Verify rendering dispatches cleanly to generic components without contamination
  const el0 = renderSceneComponent(timeline.scenes[0], 0, 5, 0.1, plan.topic);
  assert.equal(el0.type, GenericTitleHook);

  const el1 = renderSceneComponent(timeline.scenes[1], 1, 5, 0.3, plan.topic);
  assert.equal(el1.type, GenericLabeledDiagram);

  const el2 = renderSceneComponent(timeline.scenes[2], 2, 5, 0.5, plan.topic);
  assert.equal(el2.type, GenericProcessFlow);

  const el3 = renderSceneComponent(timeline.scenes[3], 3, 5, 0.7, plan.topic);
  assert.equal(el3.type, GenericComparison);

  const el4 = renderSceneComponent(timeline.scenes[4], 4, 5, 0.9, plan.topic);
  assert.equal(el4.type, GenericTakeaway);
});

test("Adversarial Attack: attempting to inject specialized domain variants into novel topic is BLOCKED", () => {
  const topic = "How an API Request Works";

  // Attempting to slip RAM hardware into API request topic
  assert.throws(
    () => validateVisualSelection(topic, "computer.ram-architecture"),
    CrossTopicContaminationError
  );

  // Attempting to slip Photosynthesis chloroplast into API request topic
  assert.throws(
    () => validateVisualSelection(topic, "photosynthesis.chloroplast"),
    CrossTopicContaminationError
  );

  // Attempting to slip Water Cycle evaporation into API request topic
  assert.throws(
    () => validateVisualSelection(topic, "water-cycle.evaporation"),
    CrossTopicContaminationError
  );

  // Attempting to slip Binary Search algorithm into API request topic
  assert.throws(
    () => validateVisualSelection(topic, "algorithm.binary-search"),
    CrossTopicContaminationError
  );
});

test("Adversarial Attack: cross-domain vocabulary pollution is caught by semantic validator", () => {
  const plan = createDynamicApiPlan();

  // Inject alien vocabulary into scene 2
  plan.scenes[1].onScreenText.push("Contains volatile memory and CPU processor link");
  plan.scenes[1].objects.push({ id: "obj-ram", kind: "node", label: "RAM Chip Module" });

  const result = validatePlanDomainSemantics(plan);
  assert.equal(result.valid, false);
  assert.ok(result.issues.length >= 1);
  assert.ok(result.issues.some((i) => i.domain === "computer-architecture"));
});
