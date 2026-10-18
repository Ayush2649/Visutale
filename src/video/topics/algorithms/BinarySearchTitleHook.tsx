import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const BinarySearchTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Binary Search Algorithm",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Binary Search";
  const subtitle = scene.onScreenText[1] ?? "Divide and Conquer";

  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8 },
  });

  const introOpacity = interpolate(introSpring, [0, 1], [0, 1]);
  const introScale = interpolate(introSpring, [0, 1], [0.95, 1]);

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
            opacity: introOpacity,
            transform: `scale(${introScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            padding: "44px 36px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Top category badges */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <AnimatedBadge
              label="Computer Science Algorithm"
              frame={frame}
              revealFrame={0}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
              padding="6px 18px"
            />
            <div
              style={{
                backgroundColor: "#FEF3C7",
                color: "#B45309",
                border: "1.5px solid #FCD34D",
                padding: "6px 16px",
                borderRadius: 16,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Divide & Conquer
            </div>
          </div>

          {/* Prominent Title */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 52,
                fontWeight: 900,
                color: THEME.colors.textPrimary,
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: "12px 0 0 0",
                fontSize: 24,
                fontWeight: 600,
                color: THEME.colors.textSecondary,
                maxWidth: 720,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Hero Visual Area: 9 Array Tiles */}
          <div
            style={{
              width: "100%",
              maxWidth: 680,
              backgroundColor: "#FFFFFF",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 24,
              padding: "32px 36px",
              boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 36 }}>⚡</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.textPrimary }}>
                  Divide & Conquer Algorithm
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted }}>
                  Cuts search range in half at every step
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "center" }}>
              {[4, 9, 15, 23, 38, 56, 72, 85, 94].map((num, i) => (
                <div
                  key={`hero-tile-${i}`}
                  style={{
                    flex: 1,
                    height: 64,
                    backgroundColor: num === 72 ? "#EFF6FF" : num === 38 ? "#FEF3C7" : "#F8FAFC",
                    border: `2px solid ${
                      num === 72
                        ? THEME.colors.waterBlue
                        : num === 38
                        ? THEME.colors.sunAmber
                        : THEME.colors.border
                    }`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    color:
                      num === 72
                        ? THEME.colors.waterBlue
                        : num === 38
                        ? "#B45309"
                        : THEME.colors.textPrimary,
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span
                style={{
                  backgroundColor: "#FEF3C7",
                  color: "#B45309",
                  padding: "4px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Midpoint: 38
              </span>
              <span
                style={{
                  backgroundColor: "#ECFDF5",
                  color: THEME.colors.plantGreenDark,
                  padding: "4px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Target: 72 Found in 2 Steps
              </span>
            </div>
          </div>

          {/* Bottom helper text */}
          <div style={{ fontSize: 18, color: THEME.colors.textMuted, fontWeight: 600 }}>
            {scene.objects.length} Core Elements • 60-90s Visual Explainer
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

