import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  TakeawayInsightCard,
} from "../primitives/index.js";

export const GenericTakeaway: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Key Takeaway",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Key Takeaways";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const takeawayItems =
    scene.objects.length > 0
      ? scene.objects
      : [
          { id: "tk-1", kind: "node" as const, label: scene.onScreenText[0] ?? "Core takeaway principle" },
          { id: "tk-2", kind: "node" as const, label: scene.onScreenText[1] ?? "Practical application" },
        ];

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme="tech-dark" showGrid>
        <HUDHeaderPill
          icon="🎯"
          category="KEY EDUCATIONAL TAKEAWAYS"
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
        />

        {/* Central Takeaway Cards Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1200,
            opacity: contentOpacity,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            justifyContent: "center",
          }}
        >
          {takeawayItems.slice(0, 3).map((item, idx) => {
            const colors = ["#38BDF8", "#F59E0B", "#10B981"];
            const color = colors[idx % colors.length];
            return (
              <TakeawayInsightCard
                key={item.id}
                stepNumber={idx + 1}
                icon={idx === 0 ? "💡" : idx === 1 ? "⚡" : "🎯"}
                title={item.label}
                description={
                  idx === 0 && subtitle
                    ? subtitle
                    : `Core scientific principle demonstrated in ${item.label}`
                }
                color={color}
                bg={`${color}15`}
                border={`${color}44`}
              />
            );
          })}
        </div>
      </CinematicEnvironment>
    </SceneContainer>
  );
};
