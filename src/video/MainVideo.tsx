import React from "react";
import { Sequence, useCurrentFrame, useVideoConfig, Audio } from "remotion";
import type { CompiledTimeline, CompiledScene } from "../contracts/timeline.js";
import { Captions } from "./primitives/Captions.js";
import { TitleHookScene } from "./scenes/TitleHookScene.js";
import { EvaporationScene } from "./scenes/EvaporationScene.js";
import { TranspirationScene } from "./scenes/TranspirationScene.js";
import { CondensationScene } from "./scenes/CondensationScene.js";
import { PrecipitationScene } from "./scenes/PrecipitationScene.js";
import { CollectionScene } from "./scenes/CollectionScene.js";
import { TakeawayScene } from "./scenes/TakeawayScene.js";
import { ComparisonScene } from "./scenes/ComparisonScene.js";
import { StepSequenceScene } from "./scenes/StepSequenceScene.js";

export interface MainVideoProps {
  timeline: CompiledTimeline;
}

export const MainVideo: React.FC<MainVideoProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Find active caption across all scenes
  let currentCaptionText: string | null = null;
  for (const scene of timeline.scenes) {
    for (const cue of scene.captions) {
      if (frame >= cue.startFrame && frame < cue.endFrame) {
        currentCaptionText = cue.text;
        break;
      }
    }
    if (currentCaptionText) break;
  }

  const globalProgress = frame / Math.max(1, durationInFrames);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Scenes */}
      {timeline.scenes.map((scene, index) => {
        const audioSrc = scene.audio?.audioBase64
          ? `data:audio/mp3;base64,${scene.audio.audioBase64}`
          : scene.audio?.audioPath;

        return (
          <Sequence
            key={scene.sceneId}
            from={scene.startFrame}
            durationInFrames={scene.durationInFrames}
            name={`${index + 1}-${scene.sceneId}`}
          >
            {renderSceneComponent(scene, index, timeline.scenes.length, globalProgress)}
            {audioSrc && !scene.audio?.isFixture && (
              <Audio src={audioSrc} />
            )}
          </Sequence>
        );
      })}

      {/* Global Captions Overlay */}
      <Captions currentCaption={currentCaptionText} />
    </div>
  );
};

function renderSceneComponent(
  scene: CompiledScene,
  sceneIndex: number,
  totalScenes: number,
  globalProgress: number
): React.ReactElement {
  const props = {
    scene,
    sceneIndex,
    totalScenes,
    globalProgress,
  };

  // Specific explainer scenes
  if (scene.sceneId === "scene-hook" || scene.sceneId.includes("hook")) return <TitleHookScene {...props} />;
  if (scene.sceneId === "scene-evaporation" || scene.sceneId.includes("evaporation")) return <EvaporationScene {...props} />;
  if (scene.sceneId === "scene-transpiration" || scene.sceneId.includes("transpiration")) return <TranspirationScene {...props} />;
  if (scene.sceneId === "scene-condensation" || scene.sceneId.includes("condensation")) return <CondensationScene {...props} />;
  if (scene.sceneId === "scene-precipitation" || scene.sceneId.includes("precipitation")) return <PrecipitationScene {...props} />;
  if (scene.sceneId === "scene-collection" || scene.sceneId.includes("collection")) return <CollectionScene {...props} />;
  if (scene.sceneId === "scene-takeaway" || scene.sceneId.includes("takeaway")) return <TakeawayScene {...props} />;
  if (scene.sceneId.includes("ram") || scene.sceneId.includes("storage")) {
    return <ComparisonScene {...props} />;
  }
  if (scene.sceneId.includes("search") || scene.sceneId.includes("binary")) {
    return <StepSequenceScene {...props} />;
  }

  switch (scene.type) {
    case "title-hook":
      return <TitleHookScene {...props} />;
    case "takeaway":
      return <TakeawayScene {...props} />;
    case "comparison":
      return <ComparisonScene {...props} />;
    case "step-sequence":
      return <StepSequenceScene {...props} />;
    case "process-flow":
      return <EvaporationScene {...props} />;
    case "labeled-diagram":
      return <TranspirationScene {...props} />;
    default:
      return <TitleHookScene {...props} />;
  }
}
