import type React from "react";
import type { SceneProps } from "../core/contracts/visualTypes.js";

export type VisualDomain =
  | "water-cycle"
  | "photosynthesis"
  | "computer-architecture"
  | "algorithms"
  | "optics"
  | "solar"
  | "telecom"
  | "generic"
  | "template";

export type ReusableTemplateVariantId =
  | "template.concept-hook"
  | "template.kinetic-process"
  | "template.physical-transformation"
  | "template.wave-transmission"
  | "template.data-sampling"
  | "template.conduit-flow"
  | "template.cutaway-anatomy"
  | "template.dual-comparison"
  | "template.closed-loop-system"
  | "template.summary-takeaway";

export type TelecomVariantId =
  | "telecom.city-hook"
  | "telecom.microphone-acoustic"
  | "telecom.digital-sampling"
  | "telecom.cell-tower"
  | "telecom.fiber-network"
  | "telecom.speaker-acoustic"
  | "telecom.two-way-loop";

export type SolarVariantId =
  | "solar.rooftop-hook"
  | "solar.panel-structure"
  | "solar.cell-photovoltaic"
  | "solar.circuit-flow"
  | "solar.inverter-home"
  | "solar.battery-storage"
  | "solar.takeaway";

export type OpticsVariantId =
  | "optics.title-hook"
  | "optics.prism-spectrum"
  | "optics.earth-atmosphere"
  | "optics.rayleigh-scattering"
  | "optics.sunset-path"
  | "optics.takeaway";

export type WaterCycleVariantId =
  | "water-cycle.title-hook"
  | "water-cycle.evaporation"
  | "water-cycle.transpiration"
  | "water-cycle.condensation"
  | "water-cycle.precipitation"
  | "water-cycle.collection"
  | "water-cycle.takeaway";

export type PhotosynthesisVariantId =
  | "photosynthesis.title-hook"
  | "photosynthesis.ingredients"
  | "photosynthesis.chloroplast"
  | "photosynthesis.reaction"
  | "photosynthesis.impact"
  | "photosynthesis.takeaway";

export type ComputerArchitectureVariantId =
  | "computer.title-hook"
  | "computer.ram-architecture"
  | "computer.storage-architecture"
  | "computer.ram-storage-comparison"
  | "computer.takeaway";

export type AlgorithmVariantId =
  | "algorithm.title-hook"
  | "algorithm.sorted-array"
  | "algorithm.binary-search"
  | "algorithm.search-comparison"
  | "algorithm.takeaway";

export type GenericVariantId =
  | "generic.title-hook"
  | "generic.labeled-diagram"
  | "generic.process-flow"
  | "generic.step-sequence"
  | "generic.comparison"
  | "generic.takeaway";

export type VisualVariantId =
  | WaterCycleVariantId
  | PhotosynthesisVariantId
  | ComputerArchitectureVariantId
  | AlgorithmVariantId
  | OpticsVariantId
  | SolarVariantId
  | TelecomVariantId
  | GenericVariantId
  | ReusableTemplateVariantId;

export interface VisualRegistryEntry {
  id: VisualVariantId;
  domain: VisualDomain;
  name: string;
  description: string;
  component: React.FC<SceneProps>;
}

