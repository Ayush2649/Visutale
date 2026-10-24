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

import {
  SunsetTitleHook,
  LightPrismSpectrumScene,
  EarthAtmosphereScene,
  RayleighScatteringScene,
  SunsetPathScene,
  SunsetTakeawayScene,
} from "../topics/optics/index.js";

import {
  RooftopHookScene,
  PanelStructureScene,
  CellPhotovoltaicScene,
  CircuitFlowScene,
  InverterHomeScene,
  BatteryStorageScene,
  SolarTakeawayScene,
} from "../topics/solar/index.js";

import {
  CityCallHookScene,
  MicrophoneAcousticScene,
  DigitalSamplingScene,
  CellTowerTransmissionScene,
  FiberNetworkBackboneScene,
  SpeakerAcousticScene,
  TwoWayDuplexTakeawayScene,
} from "../topics/telecom/index.js";

// Core Generic Components (topic-independent fallbacks)
import { GenericTitleHook } from "../core/generic/GenericTitleHook.js";
import { GenericLabeledDiagram } from "../core/generic/GenericLabeledDiagram.js";
import { GenericProcessFlow } from "../core/generic/GenericProcessFlow.js";
import { GenericStepSequence } from "../core/generic/GenericStepSequence.js";
import { GenericComparison } from "../core/generic/GenericComparison.js";
import { GenericTakeaway } from "../core/generic/GenericTakeaway.js";

// Finite Reusable Scene Templates
import {
  ConceptHookTemplate,
  PhysicalTransformationTemplate,
  DataSamplingTemplate,
  WaveTransmissionTemplate,
  ConduitFlowTemplate,
  KineticProcessTemplate,
  CutawayAnatomyTemplate,
  DualComparisonTemplate,
  ClosedLoopSystemTemplate,
  SummaryTakeawayTemplate,
} from "../core/templates/index.js";

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

  // Atmospheric Optics & Sky Colors
  "optics.title-hook": {
    id: "optics.title-hook",
    domain: "optics",
    name: "Sunset Title Hook",
    description: "Panoramic full-bleed sunset horizon with solar disk, layered ridges, and camera motion",
    component: SunsetTitleHook,
  },
  "optics.prism-spectrum": {
    id: "optics.prism-spectrum",
    domain: "optics",
    name: "White Light & Prism Spectrum",
    description: "Glass triangular prism separating white sunlight into 7 distinct ROYGBIV spectral bands",
    component: LightPrismSpectrumScene,
  },
  "optics.earth-atmosphere": {
    id: "optics.earth-atmosphere",
    domain: "optics",
    name: "Earth & Atmospheric Shell",
    description: "Space view of Earth with luminous atmospheric shell, solar rays, and gas molecule inset",
    component: EarthAtmosphereScene,
  },
  "optics.rayleigh-scattering": {
    id: "optics.rayleigh-scattering",
    domain: "optics",
    name: "Rayleigh Scattering Wavelength Comparison",
    description: "Short blue wavelengths scattering omnidirectionally vs long red wavelengths penetrating directly",
    component: RayleighScatteringScene,
  },
  "optics.sunset-path": {
    id: "optics.sunset-path",
    domain: "optics",
    name: "10x Longer Sunset Path",
    description: "Geometric curvature showing shallow horizon angle, 10x thicker atmospheric distance, and blue depletion",
    component: SunsetPathScene,
  },
  "optics.takeaway": {
    id: "optics.takeaway",
    domain: "optics",
    name: "Sunset Scientific Takeaway",
    description: "Twilight sunset panorama with 3 summary cards and volcanic dust color-vibrancy callout",
    component: SunsetTakeawayScene,
  },

  // Solar Energy / Photovoltaics
  "solar.rooftop-hook": {
    id: "solar.rooftop-hook",
    domain: "solar",
    name: "Solar Rooftop Hook",
    description: "Outdoor suburban home environment under bright radiant sun with beams descending to roof panel array",
    component: RooftopHookScene,
  },
  "solar.panel-structure": {
    id: "solar.panel-structure",
    domain: "solar",
    name: "Solar Panel Structure & Anatomy",
    description: "Camera zoom into panel architecture with protective anti-reflective glass, silicon cells, and silver busbars",
    component: PanelStructureScene,
  },
  "solar.cell-photovoltaic": {
    id: "solar.cell-photovoltaic",
    domain: "solar",
    name: "Photovoltaic Silicon Cell Cutaway",
    description: "Microscopic cutaway of P-N junction, incoming photon wave-packets, and electron excitation into conduction band",
    component: CellPhotovoltaicScene,
  },
  "solar.circuit-flow": {
    id: "solar.circuit-flow",
    domain: "solar",
    name: "Directional Electron Circuit Flow",
    description: "Electrons collected into external copper circuit creating direct current (DC) with voltmeter/ammeter HUD",
    component: CircuitFlowScene,
  },
  "solar.inverter-home": {
    id: "solar.inverter-home",
    domain: "solar",
    name: "Inverter DC-to-AC Household Power",
    description: "Inverter converting DC to AC sine wave, illuminating living room lights and rotating ceiling fan",
    component: InverterHomeScene,
  },
  "solar.battery-storage": {
    id: "solar.battery-storage",
    domain: "solar",
    name: "Battery Energy Storage & Continuity",
    description: "Surplus daytime solar charging home battery system, transitioning seamlessly into nighttime discharge",
    component: BatteryStorageScene,
  },
  "solar.takeaway": {
    id: "solar.takeaway",
    domain: "solar",
    name: "Solar Energy System Takeaway",
    description: "Panoramic loop connecting Sun -> Panels -> Inverter -> Home & Battery with 3 key scientific summary cards",
    component: SolarTakeawayScene,
  },

  // Telecommunications & Signals
  "telecom.city-hook": {
    id: "telecom.city-hook",
    domain: "telecom",
    name: "Two-City Long Distance Hook",
    description: "Panoramic dual-city map showing long-distance mobile call connection and telemetry",
    component: CityCallHookScene,
  },
  "telecom.microphone-acoustic": {
    id: "telecom.microphone-acoustic",
    domain: "telecom",
    name: "Microphone Acoustic Diaphragm",
    description: "MEMS microphone cutaway showing sound pressure waves converting to electrical signals",
    component: MicrophoneAcousticScene,
  },
  "telecom.digital-sampling": {
    id: "telecom.digital-sampling",
    domain: "telecom",
    name: "Digital Sampling & Encoding",
    description: "ADC graph showing analog waveform sampled and quantized into binary bits",
    component: DigitalSamplingScene,
  },
  "telecom.cell-tower": {
    id: "telecom.cell-tower",
    domain: "telecom",
    name: "Radio Cell Tower Transmission",
    description: "Smartphone RF antenna beaming radio frequency waves to cellular base station mast",
    component: CellTowerTransmissionScene,
  },
  "telecom.fiber-network": {
    id: "telecom.fiber-network",
    domain: "telecom",
    name: "Underground Fiber Optic Backbone",
    description: "Silica glass fiber cutaway showing total internal reflection and nationwide packet routing",
    component: FiberNetworkBackboneScene,
  },
  "telecom.speaker-acoustic": {
    id: "telecom.speaker-acoustic",
    domain: "telecom",
    name: "Speaker Acoustic Reconstruction",
    description: "DAC audio decoding and vibrating voice coil loudspeaker recreating sound waves",
    component: SpeakerAcousticScene,
  },
  "telecom.two-way-loop": {
    id: "telecom.two-way-loop",
    domain: "telecom",
    name: "Full Duplex Communication Loop",
    description: "Two-way communication journey summary with structured takeaway insight cards",
    component: TwoWayDuplexTakeawayScene,
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

  // Reusable Data-Driven Visual Scene Templates
  "template.concept-hook": {
    id: "template.concept-hook",
    domain: "template",
    name: "Concept Hook Template",
    description: "Data-driven spatial hero opening with telemetry gauges and dynamic connection arcs",
    component: ConceptHookTemplate,
  },
  "template.kinetic-process": {
    id: "template.kinetic-process",
    domain: "template",
    name: "Kinetic Process Template",
    description: "Data-driven sequential pipeline with animated stage states",
    component: KineticProcessTemplate,
  },
  "template.physical-transformation": {
    id: "template.physical-transformation",
    domain: "template",
    name: "Physical Transformation Template",
    description: "Data-driven multi-stage transducer and physical conversion chamber",
    component: PhysicalTransformationTemplate,
  },
  "template.wave-transmission": {
    id: "template.wave-transmission",
    domain: "template",
    name: "Wave Transmission Template",
    description: "Data-driven emitter source radiating wavefields across space to a receiver",
    component: WaveTransmissionTemplate,
  },
  "template.data-sampling": {
    id: "template.data-sampling",
    domain: "template",
    name: "Data Sampling Template",
    description: "Data-driven discrete time sampling curve and streaming digital binary processor",
    component: DataSamplingTemplate,
  },
  "template.conduit-flow": {
    id: "template.conduit-flow",
    domain: "template",
    name: "Conduit Flow Template",
    description: "Data-driven waveguide / pipeline with total internal reflection and routing transit",
    component: ConduitFlowTemplate,
  },
  "template.cutaway-anatomy": {
    id: "template.cutaway-anatomy",
    domain: "template",
    name: "Cutaway Anatomy Template",
    description: "Data-driven cross-sectional exploded stratum cutaway",
    component: CutawayAnatomyTemplate,
  },
  "template.dual-comparison": {
    id: "template.dual-comparison",
    domain: "template",
    name: "Dual Comparison Template",
    description: "Data-driven side-by-side comparative inspection with highlighted attributes",
    component: DualComparisonTemplate,
  },
  "template.closed-loop-system": {
    id: "template.closed-loop-system",
    domain: "template",
    name: "Closed-Loop System Template",
    description: "Data-driven bidirectional duplex loop with continuous feedback",
    component: ClosedLoopSystemTemplate,
  },
  "template.summary-takeaway": {
    id: "template.summary-takeaway",
    domain: "template",
    name: "Summary Takeaway Template",
    description: "Data-driven multi-card synthesized key insights with dynamic progress metrics",
    component: SummaryTakeawayTemplate,
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
  return entry.domain === domain || entry.domain === "generic" || entry.domain === "template";
}

