import React from "react";
import { Composition, registerRoot } from "remotion";
import { MainVideo } from "./MainVideo.js";
import type { CompiledTimeline } from "../contracts/timeline.js";

const fallbackTimeline: CompiledTimeline = {
  schemaVersion: "1.0",
  compilerVersion: "0.1.0",
  planHash: "fallback-hash",
  projectId: "water-cycle",
  versionId: "fallback-v1",
  voicePreset: "indian-english-female",
  composition: {
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 2040,
    durationInSeconds: 68,
  },
  scenes: [],
  warnings: [],
  createdAt: new Date().toISOString(),
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NamasteVideo"
      component={MainVideo as any}
      durationInFrames={2040}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        timeline: fallbackTimeline,
      }}
      calculateMetadata={async ({ props }) => {
        const p = props as { timeline?: CompiledTimeline };
        const t = p.timeline ?? fallbackTimeline;
        return {
          durationInFrames: t.composition?.durationInFrames ?? 2040,
          fps: t.composition?.fps ?? 30,
          width: t.composition?.width ?? 1080,
          height: t.composition?.height ?? 1920,
        };
      }}
    />
  );
};

registerRoot(RemotionRoot);

