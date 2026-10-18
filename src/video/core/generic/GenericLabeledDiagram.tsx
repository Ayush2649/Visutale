import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import { isEventActiveInScene, getEventSpringProgress } from "../sharedAnimationUtilities.js";
import type { SceneProps } from "../contracts/visualTypes.js";

export const GenericLabeledDiagram: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Technical Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Labeled Diagram";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

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
              label="Diagram"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>
        </div>

        {/* Dynamic Diagram Visual Stage */}
        <div
          style={{
            flex: 1,
            padding: "16px 40px 32px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: scene.objects.length > 2 ? "1fr 1fr" : "1fr",
              gap: 20,
              width: "100%",
              maxWidth: 820,
            }}
          >
            {scene.objects.map((obj, i) => {
              const isActive = isEventActiveInScene(scene, obj.id, frame);
              const spr = getEventSpringProgress(scene, obj.id, frame, fps, i * 15);
              return (
                <div
                  key={obj.id}
                  style={{
                    opacity: interpolate(spr, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(spr, [0, 1], [0.92, 1])})`,
                    backgroundColor: isActive ? THEME.colors.waterBlueLight : "#FFFFFF",
                    border: `2px solid ${isActive ? THEME.colors.waterBlue : THEME.colors.border}`,
                    borderRadius: 18,
                    padding: "24px 28px",
                    boxShadow: isActive
                      ? "0 8px 24px rgba(37,99,235,0.12)"
                      : "0 4px 12px rgba(15,23,42,0.04)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isActive ? THEME.colors.waterBlue : "#F1F5F9",
                      color: isActive ? "#FFFFFF" : THEME.colors.textPrimary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textPrimary }}>
                      {obj.label}
                    </div>
                    <div style={{ fontSize: 15, color: THEME.colors.textMuted, marginTop: 2 }}>
                      Type: {obj.kind}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

