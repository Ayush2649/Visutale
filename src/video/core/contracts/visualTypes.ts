import type { CompiledScene } from "../../../contracts/timeline.js";
export * from "./visualDataSchema.js";

export interface SceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
  topic?: string;
}

export type VisualDomain =
  | "photosynthesis"
  | "water-cycle"
  | "computer-architecture"
  | "algorithms"
  | "optics"
  | "solar"
  | "telecom"
  | "generic";

export interface VisualVariantValidationResult {
  valid: boolean;
  errors: string[];
}


