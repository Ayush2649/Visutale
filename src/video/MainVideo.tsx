import React from "react";
import { Sequence, useCurrentFrame, useVideoConfig, Audio } from "remotion";
import type { CompiledTimeline, CompiledScene } from "../contracts/timeline.js";
import { Captions } from "./core/Captions.js";
import type { SceneProps } from "./core/contracts/visualTypes.js";
import {
  requireVisualComponent,
  resolveLegacyVariant,
  validateVisualSelection,
  type VisualVariantId,
} from "./registry/index.js";

export interface MainVideoProps {
  timeline: CompiledTimeline;
}

export function inferTopic(timeline: CompiledTimeline): string {
  if (timeline.topic) return timeline.topic;
  const project = timeline.projectId?.toLowerCase() ?? "";
  if (project.includes("water")) return "The Water Cycle";
  if (project.includes("photo") || project.includes("plant")) return "How Photosynthesis Works";
  if (/\bram\b/.test(project) || project.includes("storage")) return "RAM vs Storage";
  if (project.includes("search") || project.includes("binary")) return "Binary Search";

  for (const scene of timeline.scenes) {
    const text = (scene.onScreenText || []).join(" ").toLowerCase();
    const purpose = (scene.purpose || "").toLowerCase();
    if (text.includes("water") || purpose.includes("water")) return "The Water Cycle";
    if (text.includes("photo") || text.includes("plant") || purpose.includes("photo") || purpose.includes("plant")) return "How Photosynthesis Works";
    if (/\bram\b/.test(text) || text.includes("storage") || /\bram\b/.test(purpose)) return "RAM vs Storage";
    if (text.includes("binary") || text.includes("search") || purpose.includes("search")) return "Binary Search";
  }
  return "Technical Explainer";
}

export const MainVideo: React.FC<MainVideoProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const topic = inferTopic(timeline);

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
            {renderSceneComponent(scene, index, timeline.scenes.length, globalProgress, topic)}
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

export function renderSceneComponent(
  scene: CompiledScene,
  sceneIndex: number,
  totalScenes: number,
  globalProgress: number,
  topic?: string
): React.ReactElement {
  const props: SceneProps = {
    scene,
    sceneIndex,
    totalScenes,
    globalProgress,
    topic,
  };

  // Resolve visual variant: prefer explicit scene variant, fallback to deterministic legacy resolution
  const variantId: VisualVariantId = (scene.visualVariant as VisualVariantId) ?? resolveLegacyVariant(scene, topic);

  // Validate visual selection against topic to guarantee 0% cross-topic contamination
  validateVisualSelection(topic, variantId);

  // Lookup the registered visual component
  const Component = requireVisualComponent(variantId);

  return <Component {...props} />;
}
