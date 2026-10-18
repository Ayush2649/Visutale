import type React from "react";
import type { SceneProps } from "../core/contracts/visualTypes.js";
import type { VisualDomain, VisualVariantId, VisualRegistryEntry } from "./visualSchema.js";

// Topic Modules (imported strictly through public module index boundaries)
import {
  WaterCycleTitleHook,
  EvaporationScene,
  TranspirationScene,
  CondensationScene,
  PrecipitationScene,
  CollectionScene,
  WaterCycleTakeaway,
} from "../topics/water-cycle/index.js";

import {
  PhotosynthesisTitleHook,
  PlantIngredientsDiagram,
  ChloroplastDiagram,
  PhotosynthesisReaction,
  PhotosynthesisImpact,
  PhotosynthesisTakeaway,
} from "../topics/photosynthesis/index.js";

import {
  RamStorageTitleHook,
  RamArchitectureDiagram,
  StorageArchitectureDiagram,
  RamStorageComparison,
  RamStorageTakeaway,
} from "../topics/computer-architecture/index.js";

import {
  BinarySearchTitleHook,
  SortedArrayPrerequisite,
  BinarySearchStepSequence,
  SearchComparison,
  BinarySearchTakeaway,
} from "../topics/algorithms/index.js";

// Core Generic Components (topic-independent fallbacks)
import { GenericTitleHook } from "../core/generic/GenericTitleHook.js";
import { GenericLabeledDiagram } from "../core/generic/GenericLabeledDiagram.js";
import { GenericProcessFlow } from "../core/generic/GenericProcessFlow.js";
import { GenericStepSequence } from "../core/generic/GenericStepSequence.js";
import { GenericComparison } from "../core/generic/GenericComparison.js";
import { GenericTakeaway } from "../core/generic/GenericTakeaway.js";

const REGISTRY: Record<VisualVariantId, VisualRegistryEntry> = {
  // Water Cycle
  "water-cycle.title-hook": {
    id: "water-cycle.title-hook",
    domain: "water-cycle",
    name: "Water Cycle Hero",
    description: "Orbiting hydrological droplet and loop hero visualization",
    component: WaterCycleTitleHook,
  },
  "water-cycle.evaporation": {
    id: "water-cycle.evaporation",
    domain: "water-cycle",
    name: "Evaporation Stage",
    description: "Solar heating causing water vapor ascent",
    component: EvaporationScene,
  },
  "water-cycle.transpiration": {
    id: "water-cycle.transpiration",
    domain: "water-cycle",
    name: "Transpiration Stage",
    description: "Plant stomata vapor release into atmosphere",
    component: TranspirationScene,
  },
  "water-cycle.condensation": {
    id: "water-cycle.condensation",
    domain: "water-cycle",
    name: "Condensation Stage",
    description: "Cooling aloft condensing vapor into clouds",
    component: CondensationScene,
  },
  "water-cycle.precipitation": {
    id: "water-cycle.precipitation",
    domain: "water-cycle",
    name: "Precipitation Stage",
    description: "Raindrops and cloud saturation gravity fall",
    component: PrecipitationScene,
  },
  "water-cycle.collection": {
    id: "water-cycle.collection",
    domain: "water-cycle",
    name: "Collection Stage",
    description: "Watershed replenishment and runoff accumulation",
    component: CollectionScene,
  },
  "water-cycle.takeaway": {
    id: "water-cycle.takeaway",
    domain: "water-cycle",
    name: "Water Cycle Takeaway",
    description: "4-phase continuous hydrological closed loop summary",
    component: WaterCycleTakeaway,
  },

  // Photosynthesis
  "photosynthesis.title-hook": {
    id: "photosynthesis.title-hook",
    domain: "photosynthesis",
    name: "Photosynthesis Title Hook",
    description: "Solar energy transformation overview hook",
    component: PhotosynthesisTitleHook,
  },
  "photosynthesis.ingredients": {
    id: "photosynthesis.ingredients",
    domain: "photosynthesis",
    name: "3 Key Ingredients Diagram",
    description: "Plant anatomy with sunlight, CO2 stomata, and root H2O intake",
    component: PlantIngredientsDiagram,
  },
  "photosynthesis.chloroplast": {
    id: "photosynthesis.chloroplast",
    domain: "photosynthesis",
    name: "Chloroplast & Chlorophyll Organelle",
    description: "Microscopic chloroplast kitchens and chlorophyll solar panels",
    component: ChloroplastDiagram,
  },
  "photosynthesis.reaction": {
    id: "photosynthesis.reaction",
    domain: "photosynthesis",
    name: "Photosynthesis Chemical Reaction",
    description: "Solar rearrangement of H2O and CO2 into Glucose and O2",
    component: PhotosynthesisReaction,
  },
  "photosynthesis.impact": {
    id: "photosynthesis.impact",
    domain: "photosynthesis",
    name: "Photosynthesis Dual Outcome",
    description: "Plant growth fuel and atmospheric oxygen release",
    component: PhotosynthesisImpact,
  },
  "photosynthesis.takeaway": {
    id: "photosynthesis.takeaway",
    domain: "photosynthesis",
    name: "Photosynthesis Takeaway",
    description: "3 key summary cards: Energy, Inputs, Outputs",
    component: PhotosynthesisTakeaway,
  },

  // Computer Architecture
  "computer.title-hook": {
    id: "computer.title-hook",
    domain: "computer-architecture",
    name: "RAM vs Storage Title Hook",
    description: "Phone and laptop device specification sheet hero",
    component: RamStorageTitleHook,
  },
  "computer.ram-architecture": {
    id: "computer.ram-architecture",
    domain: "computer-architecture",
    name: "RAM Architecture Diagram",
    description: "CPU to RAM ultra-fast bus link and volatile memory banner",
    component: RamArchitectureDiagram,
  },
  "computer.storage-architecture": {
    id: "computer.storage-architecture",
    domain: "computer-architecture",
    name: "Storage Architecture Diagram",
    description: "SSD non-volatile medium and persistent file containers",
    component: StorageArchitectureDiagram,
  },
  "computer.ram-storage-comparison": {
    id: "computer.ram-storage-comparison",
    domain: "computer-architecture",
    name: "RAM vs Storage Comparison",
    description: "Working Desk vs Filing Cabinet / Volatile vs Non-Volatile comparison",
    component: RamStorageComparison,
  },
  "computer.takeaway": {
    id: "computer.takeaway",
    domain: "computer-architecture",
    name: "RAM vs Storage Takeaway",
    description: "Desk vs filing cabinet mental model and speed vs capacity rule",
    component: RamStorageTakeaway,
  },

  // Algorithms
  "algorithm.title-hook": {
    id: "algorithm.title-hook",
    domain: "algorithms",
    name: "Binary Search Title Hook",
    description: "Divide and conquer algorithm hero with 9 sorted array tiles",
    component: BinarySearchTitleHook,
  },
  "algorithm.sorted-array": {
    id: "algorithm.sorted-array",
    domain: "algorithms",
    name: "Sorted Array Prerequisite",
    description: "Mandatory sorted input rule with 9 tiles and target indicator",
    component: SortedArrayPrerequisite,
  },
  "algorithm.binary-search": {
    id: "algorithm.binary-search",
    domain: "algorithms",
    name: "Binary Search Step Sequence",
    description: "Interactive array pointers, range halving, and match confirmation",
    component: BinarySearchStepSequence,
  },
  "algorithm.search-comparison": {
    id: "algorithm.search-comparison",
    domain: "algorithms",
    name: "Search Complexity Comparison",
    description: "Linear Search O(n) vs Binary Search O(log n)",
    component: SearchComparison,
  },
  "algorithm.takeaway": {
    id: "algorithm.takeaway",
    domain: "algorithms",
    name: "Binary Search Takeaway",
    description: "Sorted prerequisite, divide & conquer mechanism, O(log n) efficiency",
    component: BinarySearchTakeaway,
  },

  // Generic Fallbacks
  "generic.title-hook": {
    id: "generic.title-hook",
    domain: "generic",
    name: "Generic Title Hook",
    description: "Topic-independent clean intro title and badges",
    component: GenericTitleHook,
  },
  "generic.labeled-diagram": {
    id: "generic.labeled-diagram",
    domain: "generic",
    name: "Generic Labeled Diagram",
    description: "Topic-independent node and container diagram",
    component: GenericLabeledDiagram,
  },
  "generic.process-flow": {
    id: "generic.process-flow",
    domain: "generic",
    name: "Generic Process Flow",
    description: "Topic-independent sequential stage cards",
    component: GenericProcessFlow,
  },
  "generic.step-sequence": {
    id: "generic.step-sequence",
    domain: "generic",
    name: "Generic Step Sequence",
    description: "Topic-independent numbered sequence stages",
    component: GenericStepSequence,
  },
  "generic.comparison": {
    id: "generic.comparison",
    domain: "generic",
    name: "Generic Comparison",
    description: "Topic-independent 2-concept comparison cards",
    component: GenericComparison,
  },
  "generic.takeaway": {
    id: "generic.takeaway",
    domain: "generic",
    name: "Generic Takeaway",
    description: "Topic-independent summary takeaway cards",
    component: GenericTakeaway,
  },
};

export function getVisualComponent(variantId?: string): React.FC<SceneProps> | undefined {
  if (!variantId) return undefined;
  return REGISTRY[variantId as VisualVariantId]?.component;
}

export function requireVisualComponent(variantId: VisualVariantId): React.FC<SceneProps> {
  const entry = REGISTRY[variantId];
  if (!entry) {
    throw new Error(`Visual variant '${variantId}' is not registered in the Visual Registry.`);
  }
  return entry.component;
}

export function getVisualRegistryEntry(variantId?: string): VisualRegistryEntry | undefined {
  if (!variantId) return undefined;
  return REGISTRY[variantId as VisualVariantId];
}

export function getAllRegisteredVariants(): VisualRegistryEntry[] {
  return Object.values(REGISTRY);
}

export function isVariantInDomain(variantId: string, domain: VisualDomain): boolean {
  const entry = REGISTRY[variantId as VisualVariantId];
  if (!entry) return false;
  return entry.domain === domain || entry.domain === "generic";
}

