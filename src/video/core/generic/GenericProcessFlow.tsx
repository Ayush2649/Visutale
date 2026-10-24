import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  SafeCalloutCard,
} from "../primitives/index.js";

export const GenericProcessFlow: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Technical Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Process Flow";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const stageObjects = scene.objects.filter(
    (o) => o.kind === "node" || o.kind === "container" || o.kind === "shape" || o.kind === "icon"
  );
  const stages = stageObjects.length >= 2 ? stageObjects : scene.objects;
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
      <CinematicEnvironment theme="tech-dark" showGrid>
        <HUDHeaderPill
          icon="⚡"
          category="SEQUENTIAL PROCESS & FLOW"
          color="#10B981"
          borderColor="rgba(16, 185, 129, 0.4)"
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
            gap: 22,
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
                    ? "rgba(16, 185, 129, 0.16)"
                    : isCompleted
                    ? "rgba(15, 23, 42, 0.6)"
                    : "rgba(15, 23, 42, 0.8)",
                  border: `1.5px solid ${isActive ? "#10B981" : isCompleted ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: 22,
                  padding: "22px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: isActive
                    ? "0 12px 28px rgba(16, 185, 129, 0.25), 0 0 16px rgba(16, 185, 129, 0.2)"
                    : "0 8px 20px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(14px)",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      background: isCompleted ? "#10B981" : isActive ? "#38BDF8" : "rgba(255,255,255,0.08)",
                      color: isCompleted || isActive ? "#0F172A" : "#94A3B8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 900,
                      boxShadow: isActive ? "0 0 15px #38BDF8" : "none",
                    }}
                  >
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <div>
                    <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800 }}>
                      {stg.label}
                    </div>
                    <div style={{ color: isActive ? "#38BDF8" : "#94A3B8", fontSize: 13, marginTop: 4, textTransform: "uppercase" }}>
                      Phase {i + 1} • {isActive ? "Active State" : isCompleted ? "Completed" : "Pending"}
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 12,
                    background: isActive ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isActive ? "#38BDF8" : "transparent"}`,
                    color: isActive ? "#38BDF8" : "#64748B",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {isActive ? "PROCESSING" : isCompleted ? "VERIFIED" : "STANDBY"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="⚡"
          title={title}
          description={subtitle}
          accentColor="#10B981"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
