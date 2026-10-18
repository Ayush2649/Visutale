import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "../contracts/visualTypes.js";

export const GenericTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Educational Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? topic;
  const subtitle = scene.onScreenText[1] ?? scene.purpose;
  const badgeLabel = scene.onScreenText[2] ?? "Key Concept";

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const titleOpacity = interpolate(spr, [0, 1], [0, 1]);
  const titleScale = interpolate(spr, [0, 1], [0.94, 1]);

  const primaryEvent = scene.events[0];
  const cueFrame = primaryEvent ? Math.max(0, primaryEvent.startFrame - scene.startFrame) : 30;
  const cueSpr = spring({
    frame: Math.max(0, frame - cueFrame),
    fps,
    config: { damping: 12, mass: 0.7 },
  });
  const highlightGlow = interpolate(cueSpr, [0, 1], [0, 1]);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={title}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Top Badge */}
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <AnimatedBadge
              label={badgeLabel}
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={22}
            />
          </div>

          {/* Central Title Hero */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: 780,
              opacity: titleOpacity,
              transform: `scale(${titleScale})`,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 800,
                color: THEME.colors.textPrimary,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                textShadow: `0 0 24px rgba(37,99,235,${highlightGlow * 0.25})`,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: "18px 0 0 0",
                fontSize: 24,
                color: THEME.colors.textSecondary,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Structured Objects Grid */}
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              display: "grid",
              gridTemplateColumns: scene.objects.length > 2 ? "1fr 1fr" : "1fr",
              gap: 16,
            }}
          >
            {scene.objects.map((obj, i) => {
              const objSpr = spring({
                frame: Math.max(0, frame - 20 - i * 15),
                fps,
                config: { damping: 14, stiffness: 120 },
              });
              return (
                <div
                  key={obj.id}
                  style={{
                    opacity: interpolate(objSpr, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(objSpr, [0, 1], [0.93, 1])})`,
                    backgroundColor: "#FFFFFF",
                    border: `2px solid ${THEME.colors.border}`,
                    borderRadius: 18,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: THEME.colors.waterBlueLight,
                      color: THEME.colors.waterBlueDark,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 18,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>
                      {obj.label}
                    </div>
                    <div style={{ fontSize: 13, color: THEME.colors.textMuted, marginTop: 2 }}>
                      Type: {obj.kind}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ fontSize: 16, color: THEME.colors.textMuted, fontWeight: 600 }}>
            {scene.objects.length} Core Elements • Structured Explainer
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

