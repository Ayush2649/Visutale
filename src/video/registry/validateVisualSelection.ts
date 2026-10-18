import type { VisualDomain, VisualVariantId } from "./visualSchema.js";
import { getVisualRegistryEntry } from "./visualRegistry.js";

export class CrossTopicContaminationError extends Error {
  constructor(
    public readonly topic: string,
    public readonly expectedDomain: VisualDomain,
    public readonly attemptedVariant: string,
    public readonly attemptedDomain: VisualDomain
  ) {
    super(
      `Cross-Topic Visual Contamination Blocked: Topic '${topic}' resolves to domain '${expectedDomain}', ` +
        `but attempted to render variant '${attemptedVariant}' from domain '${attemptedDomain}'.`
    );
    this.name = "CrossTopicContaminationError";
  }
}

export function resolveTopicDomain(topic?: string): VisualDomain {
  if (!topic) return "generic";
  const norm = topic.toLowerCase();

  if (norm.includes("photo") || norm.includes("botany") || (norm.includes("plant") && !norm.includes("water"))) {
    return "photosynthesis";
  }
  if (norm.includes("water cycle") || (norm.includes("water") && !norm.includes("plant"))) {
    return "water-cycle";
  }
  if (
    norm.includes("ram") ||
    norm.includes("storage") ||
    norm.includes("hardware") ||
    norm.includes("memory") ||
    norm.includes("cpu")
  ) {
    return "computer-architecture";
  }
  if (
    norm.includes("binary") ||
    norm.includes("search") ||
    norm.includes("algorithm") ||
    norm.includes("sorting")
  ) {
    return "algorithms";
  }

  return "generic";
}

export function validateVisualSelection(
  topic: string | undefined,
  variantId: string
): { isValid: true; domain: VisualDomain } {
  const entry = getVisualRegistryEntry(variantId);
  if (!entry) {
    throw new Error(`Unknown visual variant '${variantId}'.`);
  }

  const expectedDomain = resolveTopicDomain(topic);

  // Generic variants are universal and always allowed
  if (entry.domain === "generic" || expectedDomain === "generic") {
    return { isValid: true, domain: entry.domain };
  }

  // If topic has a specialized domain, variant MUST match that domain
  if (entry.domain !== expectedDomain) {
    throw new CrossTopicContaminationError(
      topic ?? "unknown",
      expectedDomain,
      variantId,
      entry.domain
    );
  }

  return { isValid: true, domain: entry.domain };
}

