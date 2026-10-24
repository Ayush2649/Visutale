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

  if (
    norm.includes("solar") ||
    norm.includes("photovoltaic") ||
    (norm.includes("sunlight") &&
      (norm.includes("electricity") || norm.includes("power") || norm.includes("energy") || norm.includes("cell") || norm.includes("panel"))) ||
    (norm.includes("panel") && (norm.includes("sun") || norm.includes("electric")))
  ) {
    return "solar";
  }
  if (
    norm.includes("photosynthe") ||
    norm.includes("botany") ||
    (norm.includes("plant") && !norm.includes("water")) ||
    (norm.includes("photo") && !norm.includes("photovoltaic") && !norm.includes("photon"))
  ) {
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
  if (
    norm.includes("sunset") ||
    norm.includes("sky turn") ||
    norm.includes("sky color") ||
    norm.includes("rayleigh") ||
    norm.includes("scatter") ||
    (norm.includes("optics") && !norm.includes("fiber")) ||
    norm.includes("prism") ||
    (norm.includes("light") && (norm.includes("wavelength") || norm.includes("spectrum") || norm.includes("color")))
  ) {
    return "optics";
  }
  if (
    norm.includes("phone") ||
    norm.includes("call") ||
    norm.includes("cellular") ||
    norm.includes("telecom") ||
    norm.includes("microphone") ||
    norm.includes("fiber optic") ||
    norm.includes("cell tower") ||
    norm.includes("mobile") ||
    (norm.includes("talk") && norm.includes("away")) ||
    (norm.includes("voice") && (norm.includes("travel") || norm.includes("reach") || norm.includes("distance") || norm.includes("wire")))
  ) {
    return "telecom";
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

  // Generic and Template variants are universal and always allowed across any topic
  if (entry.domain === "generic" || entry.domain === "template") {
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

