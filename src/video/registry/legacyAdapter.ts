import type { CompiledScene } from "../../contracts/timeline.js";
import { SCENE_TYPES } from "../../contracts/plan.js";
import type { VisualVariantId } from "./visualSchema.js";
import { resolveTopicDomain } from "./validateVisualSelection.js";

/**
 * Resolves legacy or unadorned storyboard scenes (which lack an explicit visualVariant)
 * to their deterministic VisualVariantId.
 *
 * Guaranteed to never return a topic-specific component for an unrelated topic.
 */
export function resolveLegacyVariant(scene: CompiledScene, topic?: string): VisualVariantId {
  const sceneType = scene.type;
  if (!SCENE_TYPES.includes(sceneType as any)) {
    throw new Error(
      `Unsupported scene type "${sceneType}" for scene ID "${scene.sceneId}" in topic "${topic ?? "unknown"}".`
    );
  }

  // If scene already specifies a valid visualVariant, respect it directly
  if (scene.visualVariant) {
    return scene.visualVariant as VisualVariantId;
  }

  const domain = resolveTopicDomain(topic);
  const sceneId = scene.sceneId.toLowerCase();

  // 1. Water Cycle Domain
  if (domain === "water-cycle") {
    if (sceneType === "title-hook" || sceneId.includes("hook")) return "water-cycle.title-hook";
    if (sceneId.includes("evap")) return "water-cycle.evaporation";
    if (sceneId.includes("transpir")) return "water-cycle.transpiration";
    if (sceneId.includes("condens")) return "water-cycle.condensation";
    if (sceneId.includes("precip")) return "water-cycle.precipitation";
    if (sceneId.includes("collect")) return "water-cycle.collection";
    if (sceneType === "takeaway" || sceneId.includes("takeaway")) return "water-cycle.takeaway";
    return resolveGenericFallback(sceneType);
  }

  // 2. Photosynthesis Domain
  if (domain === "photosynthesis") {
    if (sceneType === "title-hook" || sceneId.includes("hook")) return "photosynthesis.title-hook";
    if (sceneId.includes("ingredient") || sceneId.includes("sunlight-water")) return "photosynthesis.ingredients";
    if (sceneId.includes("chloroplast") || sceneId.includes("cell")) return "photosynthesis.chloroplast";
    if (sceneId.includes("reaction") || sceneId.includes("recipe") || sceneId.includes("chemical")) return "photosynthesis.reaction";
    if (sceneId.includes("impact") || sceneId.includes("fuel-air") || sceneId.includes("oxygen")) return "photosynthesis.impact";
    if (sceneType === "takeaway" || sceneId.includes("takeaway")) return "photosynthesis.takeaway";
    return resolveGenericFallback(sceneType);
  }

  // 3. Computer Architecture Domain
  if (domain === "computer-architecture") {
    if (sceneType === "title-hook" || sceneId.includes("hook")) return "computer.title-hook";
    if (sceneType === "comparison" || sceneId.includes("desk") || sceneId.includes("cabinet") || sceneId.includes("volatil")) {
      return "computer.ram-storage-comparison";
    }
    if (sceneType === "labeled-diagram") {
      const hasStorageToken = scene.objects.some((o) => {
        const tokens = o.id.toLowerCase().split(/[^a-z0-9]+/);
        return tokens.includes("storage") || tokens.includes("ssd");
      }) || sceneId.includes("storage");

      if (hasStorageToken) return "computer.storage-architecture";
      return "computer.ram-architecture";
    }
    if (sceneType === "takeaway" || sceneId.includes("takeaway")) return "computer.takeaway";
    return resolveGenericFallback(sceneType);
  }

  // 4. Algorithms Domain
  if (domain === "algorithms") {
    if (sceneType === "title-hook" || sceneId.includes("hook")) return "algorithm.title-hook";
    if (sceneId.includes("prereq") || sceneId.includes("sort")) return "algorithm.sorted-array";
    if (sceneType === "step-sequence" || sceneId.includes("step")) return "algorithm.binary-search";
    if (sceneType === "comparison" || sceneId.includes("linear") || sceneId.includes("compar")) return "algorithm.search-comparison";
    if (sceneType === "takeaway" || sceneId.includes("takeaway")) return "algorithm.takeaway";
    return resolveGenericFallback(sceneType);
  }

  // 5. Generic Fallback for New or Unmatched Topics
  return resolveGenericFallback(sceneType);
}

function resolveGenericFallback(sceneType: string): VisualVariantId {
  switch (sceneType) {
    case "title-hook":
      return "generic.title-hook";
    case "labeled-diagram":
      return "generic.labeled-diagram";
    case "process-flow":
      return "generic.process-flow";
    case "step-sequence":
      return "generic.step-sequence";
    case "comparison":
      return "generic.comparison";
    case "takeaway":
      return "generic.takeaway";
    default:
      return "generic.process-flow";
  }
}

