import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { CompiledScene } from "../../contracts/timeline.js";

export interface ProcessFlowSceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
  topic?: string;
}

export const ProcessFlowScene: React.FC<ProcessFlowSceneProps> = ({
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

  // Stages derived from scene.objects (filtered for nodes/containers/shapes)
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
      stepTitle={title}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        {/* Header */}
        <div style={{ padding: "32px 40px 16px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ maxWidth: 680 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 800,
                  color: THEME.colors.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h2>
              <p style={{ margin: "8px 0 0 0", fontSize: 22, color: THEME.colors.textMuted, fontWeight: 500 }}>
                {subtitle}
              </p>
            </div>
            <AnimatedBadge
              label="Process Flow"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>
        </div>

        {/* Sequential Stages Flow Area */}
        <div
          style={{
            flex: 1,
            padding: "20px 40px 32px 40px",
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
              frame: Math.max(0, frame - i * 20),
              fps,
              config: { damping: 14, stiffness: 120 },
            });

            return (
              <div
                key={stg.id}
                style={{
                  opacity: interpolate(spr, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(spr, [0, 1], [20, 0])}px)`,
                  backgroundColor: isActive ? "#EFF6FF" : isCompleted ? "#F8FAFC" : "#FFFFFF",
                  border: `2px solid ${isActive ? THEME.colors.waterBlue : isCompleted ? "#CBD5E1" : THEME.colors.border}`,
                  borderRadius: 20,
                  padding: "22px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: isActive ? "0 8px 20px rgba(37,99,235,0.12)" : "0 2px 6px rgba(15,23,42,0.03)",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: isActive
                        ? THEME.colors.waterBlue
                        : isCompleted
                        ? THEME.colors.plantGreen
                        : "#F1F5F9",
                      color: isActive || isCompleted ? "#FFFFFF" : THEME.colors.textPrimary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: isActive ? THEME.colors.waterBlueDeep : THEME.colors.textPrimary,
                      }}
                    >
                      {stg.label}
                    </div>
                    <div style={{ fontSize: 16, color: THEME.colors.textMuted, marginTop: 2 }}>
                      Step {i + 1} of {stages.length} • {stg.kind}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <span
                    style={{
                      backgroundColor: THEME.colors.waterBlue,
                      color: "#FFFFFF",
                      padding: "4px 14px",
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

