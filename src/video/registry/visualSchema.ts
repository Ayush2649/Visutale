import type React from "react";
import type { SceneProps } from "../core/contracts/visualTypes.js";

export type VisualDomain =
  | "water-cycle"
  | "photosynthesis"
  | "computer-architecture"
  | "algorithms"
  | "generic";

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
  | GenericVariantId;

export interface VisualRegistryEntry {
  id: VisualVariantId;
  domain: VisualDomain;
  name: string;
  description: string;
  component: React.FC<SceneProps>;
}

