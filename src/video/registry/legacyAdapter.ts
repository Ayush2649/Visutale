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

  // If scene specifies a reusable template variant, respect it directly.
  if (scene.visualVariant && scene.visualVariant.startsWith("template.")) {
    return scene.visualVariant as VisualVariantId;
  }

  // If scene visualData specifies a template, map directly to that template
  if (scene.visualData && typeof (scene.visualData as any).template === "string") {
    const rawT = (scene.visualData as any).template;
    const tId = rawT.startsWith("template.") ? rawT : `template.${rawT}`;
    return tId as VisualVariantId;
  }

  // If scene specifies a specialized (non-generic) visualVariant, respect it directly.
  // If it specified a generic placeholder but the topic has a specialized domain, upgrade to the domain's visual component.
  if (scene.visualVariant && !scene.visualVariant.startsWith("generic.")) {
    return scene.visualVariant as VisualVariantId;
  }

  const domain = resolveTopicDomain(topic);
  const sceneId = scene.sceneId.toLowerCase();

  // If topic is generic and scene already specified a generic variant, respect it directly
  if (domain === "generic" && scene.visualVariant) {
    return scene.visualVariant as VisualVariantId;
  }

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

  // 5. Atmospheric Optics Domain
  if (domain === "optics") {
    if (sceneType === "title-hook" || sceneId.includes("hook") || sceneId.includes("intro")) return "optics.title-hook";
    if (sceneId.includes("prism") || sceneId.includes("spectrum") || sceneId.includes("sunlight") || sceneId.includes("color")) {
      return "optics.prism-spectrum";
    }
    if (sceneId.includes("atmosphere") || sceneId.includes("shell") || sceneId.includes("earth") || sceneId.includes("gas") || sceneId.includes("molecule")) {
      return "optics.earth-atmosphere";
    }
    if (sceneId.includes("scatter") || sceneId.includes("rayleigh") || sceneId.includes("blue") || sceneType === "comparison") {
      return "optics.rayleigh-scattering";
    }
    if (sceneId.includes("path") || sceneId.includes("distance") || sceneId.includes("horizon") || sceneType === "step-sequence") {
      return "optics.sunset-path";
    }
    if (sceneType === "takeaway" || sceneId.includes("takeaway") || sceneId.includes("conclu") || sceneId.includes("summary")) {
      return "optics.takeaway";
    }
    return resolveGenericFallback(sceneType);
  }

  // 6. Solar Energy & Photovoltaics Domain
  if (domain === "solar") {
    if (sceneType === "title-hook" || sceneId.includes("hook") || sceneId.includes("intro")) return "solar.rooftop-hook";
    if (
      sceneId.includes("panel") ||
      sceneId.includes("catcher") ||
      sceneId.includes("structure") ||
      sceneId.includes("anatomy") ||
      sceneId.includes("module")
    ) {
      return "solar.panel-structure";
    }
    if (
      sceneId.includes("cell") ||
      sceneId.includes("photon") ||
      sceneId.includes("electron") ||
      sceneId.includes("wafer") ||
      sceneId.includes("junction") ||
      sceneId.includes("silicon")
    ) {
      return "solar.cell-photovoltaic";
    }
    if (
      sceneId.includes("circuit") ||
      sceneId.includes("wire") ||
      sceneId.includes("current") ||
      sceneId.includes("voltage") ||
      sceneId.includes("flow")
    ) {
      return "solar.circuit-flow";
    }
    if (
      sceneId.includes("inverter") ||
      sceneId.includes("appliance") ||
      sceneId.includes("house") ||
      sceneId.includes("home") ||
      sceneId.includes("ac")
    ) {
      return "solar.inverter-home";
    }
    if (
      sceneId.includes("battery") ||
      sceneId.includes("storage") ||
      sceneId.includes("night") ||
      sceneId.includes("sunset") ||
      sceneType === "comparison"
    ) {
      return "solar.battery-storage";
    }
    if (sceneType === "takeaway" || sceneId.includes("takeaway") || sceneId.includes("conclu") || sceneId.includes("summary")) {
      return "solar.takeaway";
    }
    return resolveGenericFallback(sceneType);
  }

  // 7. Telecommunications & Mobile Signals Domain
  if (domain === "telecom") {
    if (sceneType === "title-hook" || sceneId.includes("hook") || sceneId.includes("intro") || sceneId.includes("mumbai") || sceneId.includes("distance")) {
      return "telecom.city-hook";
    }
    if (
      sceneId.includes("mic") ||
      sceneId.includes("diaphragm") ||
      sceneId.includes("sound-wave") ||
      sceneId.includes("acoustic") ||
      sceneId.includes("voice-input")
    ) {
      return "telecom.microphone-acoustic";
    }
    if (
      sceneId.includes("digital") ||
      sceneId.includes("encoding") ||
      sceneId.includes("sampling") ||
      sceneId.includes("adc") ||
      sceneId.includes("binary") ||
      sceneId.includes("bit") ||
      sceneId.includes("processor")
    ) {
      return "telecom.digital-sampling";
    }
    if (
      sceneId.includes("tower") ||
      sceneId.includes("wireless") ||
      sceneId.includes("radio") ||
      sceneId.includes("cellular") ||
      sceneId.includes("antenna")
    ) {
      return "telecom.cell-tower";
    }
    if (
      sceneId.includes("fiber") ||
      sceneId.includes("network") ||
      sceneId.includes("journey") ||
      sceneId.includes("backbone") ||
      sceneId.includes("cable") ||
      sceneId.includes("router") ||
      sceneId.includes("optic")
    ) {
      return "telecom.fiber-network";
    }
    if (
      sceneId.includes("receiving") ||
      sceneId.includes("speaker") ||
      sceneId.includes("reconstruct") ||
      sceneId.includes("dac") ||
      sceneId.includes("ear") ||
      sceneId.includes("output")
    ) {
      return "telecom.speaker-acoustic";
    }
    if (
      sceneType === "takeaway" ||
      sceneId.includes("takeaway") ||
      sceneId.includes("summary") ||
      sceneId.includes("loop") ||
      sceneId.includes("duplex")
    ) {
      return "telecom.two-way-loop";
    }
    return resolveGenericFallback(sceneType);
  }

  // 8. Generic Fallback for Historical Unmatched Topics
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

