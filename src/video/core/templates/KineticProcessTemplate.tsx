import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  SafeCalloutCard,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const KineticProcessTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Sequential Process & Workflow",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Process Pipeline";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const headerCategory = visualData.headerBadge?.category ?? "SEQUENTIAL PROCESS & FLOW";
  const headerIcon = visualData.headerBadge?.icon ?? "⚡";
  const headerColor = visualData.headerBadge?.color ?? "#10B981";

  const stages = scene.objects.length >= 2 ? scene.objects : [
    { id: "stg-1", kind: "node" as const, label: "Initiation & Input" },
    { id: "stg-2", kind: "node" as const, label: "Intermediate Transformation" },
    { id: "stg-3", kind: "node" as const, label: "Target Resolution" },
  ];

  const stageCount = Math.max(1, stages.length);
  const activeStageIndex = Math.min(
    stageCount - 1,
    Math.floor((frame / scene.durationInFrames) * stageCount)
  );

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme={theme} showGrid>
        <HUDHeaderPill
          icon={headerIcon}
          category={headerCategory}
          color={headerColor}
          borderColor={`${headerColor}66`}
        />

        {/* Central Visual Pipeline Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {stages.map((stg, i) => {
            const isActive = i === activeStageIndex;
            const isCompleted = i < activeStageIndex;
            const spr = spring({
              frame: Math.max(0, frame - i * 16),
              fps,
              config: { damping: 14, stiffness: 120 },
            });

            return (
              <div
                key={stg.id}
                style={{
                  opacity: interpolate(spr, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(spr, [0, 1], [0.94, 1])})`,
                  background: isActive
                    ? "rgba(16, 185, 129, 0.18)"
                    : isCompleted
                    ? "rgba(15, 23, 42, 0.65)"
                    : "rgba(15, 23, 42, 0.85)",
                  border: `2px solid ${isActive ? headerColor : isCompleted ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.12)"}`,
                  borderRadius: 24,
                  padding: "24px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: isActive
                    ? `0 14px 32px ${headerColor}33, 0 0 20px ${headerColor}22`
                    : "0 8px 24px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: isActive ? headerColor : isCompleted ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.08)",
                      color: isActive ? "#0F172A" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 22,
                    }}
                  >
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <div>
                    <div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 700 }}>
                      {stg.label}
                    </div>
                    <div style={{ color: isActive ? headerColor : "#94A3B8", fontSize: 16, marginTop: 4 }}>
                      {isActive ? "ACTIVE STAGE EXECUTION" : isCompleted ? "COMPLETED" : "PENDING STAGE"}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: headerColor,
                      boxShadow: `0 0 16px ${headerColor}`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="⚡"
          category="PROCESS PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
