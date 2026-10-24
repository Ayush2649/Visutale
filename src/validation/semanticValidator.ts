import type { StoryboardPlan, StoryboardScene } from "../contracts/plan.js";
import type { CompiledScene, CompiledTimeline } from "../contracts/timeline.js";
import { resolveTopicDomain, type VisualDomain } from "../video/registry/index.js";

export interface SemanticValidationIssue {
  sceneId?: string;
  field: string;
  message: string;
  domain?: VisualDomain;
}

export interface SemanticValidationResult {
  valid: boolean;
  issues: SemanticValidationIssue[];
}

/**
 * Reserved keywords strongly indicative of specific domain internals.
 * If these appear in an alien domain, it flags potential visual or narrative cross-contamination.
 */
const DOMAIN_EXCLUSIVE_VOCABULARY: Record<VisualDomain, readonly string[]> = {
  photosynthesis: [
    "chloroplast",
    "chlorophyll",
    "stomata",
    "thylakoid",
    "glucose synthesis",
    "calvin cycle",
  ],
  "computer-architecture": [
    "ram chip",
    "ssd storage",
    "volatile memory",
    "non-volatile memory",
    "cpu processor",
    "bus link",
  ],
  algorithms: [
    "binary search",
    "sorted array",
    "o(log n)",
    "o(n) linear",
    "divide and conquer",
    "midpoint pointer",
  ],
  "water-cycle": [
    "evaporation",
    "transpiration",
    "condensation cloud",
    "precipitation rainfall",
    "hydrological loop",
  ],
  optics: [
    "prism spectrum",
    "rayleigh scattering",
    "dispersion wavelength",
    "refraction angle",
  ],
  solar: [
    "photovoltaic cell",
    "p-n junction",
    "solar inverter",
    "electron excitation",
    "silicon wafer",
    "direct current dc",
  ],
  telecom: [
    "cellular tower",
    "mems diaphragm",
    "radio frequency rf",
    "analog to digital adc",
    "fiber optic backbone",
    "loudspeaker voice coil",
  ],
  generic: [],
  template: [],
};

/**
 * Validates that scene text and object labels do not contain terminology
 * exclusive to an unrelated domain.
 */
export function validateSceneDomainSemantics(
  scene: StoryboardScene | CompiledScene,
  topic: string
): SemanticValidationIssue[] {
  const issues: SemanticValidationIssue[] = [];
  const expectedDomain = resolveTopicDomain(topic);

  // If the topic is generic, verify it does not inadvertently use specialized domain components
  const allSceneText = [
    scene.purpose,
    ...(scene.onScreenText || []),
    ...scene.objects.map((o) => `${o.label} ${o.id}`),
  ]
    .join(" ")
    .toLowerCase();

  for (const [domain, keywords] of Object.entries(DOMAIN_EXCLUSIVE_VOCABULARY) as [VisualDomain, readonly string[]][]) {
    // Skip checking against the scene's own domain
    if (domain === expectedDomain || domain === "generic") continue;

    for (const kw of keywords) {
      if (allSceneText.includes(kw)) {
        issues.push({
          sceneId: "id" in scene ? scene.id : scene.sceneId,
          field: "objects/onScreenText",
          message: `Semantic contamination: Found reserved ${domain} vocabulary '${kw}' in scene belonging to domain '${expectedDomain}'.`,
          domain,
        });
      }
    }
  }

  return issues;
}

/**
 * Validates semantic integrity of all scenes in a plan.
 */
export function validatePlanDomainSemantics(plan: StoryboardPlan): SemanticValidationResult {
  const issues: SemanticValidationIssue[] = [];

  for (const scene of plan.scenes) {
    const sceneIssues = validateSceneDomainSemantics(scene, plan.topic);
    issues.push(...sceneIssues);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validates semantic integrity of all scenes in a compiled timeline.
 */
export function validateTimelineDomainSemantics(timeline: CompiledTimeline): SemanticValidationResult {
  const issues: SemanticValidationIssue[] = [];
  const topic = timeline.topic ?? "Educational Explainer";

  for (const scene of timeline.scenes) {
    const sceneIssues = validateSceneDomainSemantics(scene, topic);
    issues.push(...sceneIssues);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

