import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const PhotosynthesisTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "How Photosynthesis Works",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8 },
  });

  const introOpacity = interpolate(introSpring, [0, 1], [0, 1]);
  const introScale = interpolate(introSpring, [0, 1], [0.95, 1]);

  const primaryEvent = scene.events[0];
  const cueFrame = primaryEvent ? Math.max(0, primaryEvent.startFrame - scene.startFrame) : 40;

  const cueSpring = spring({
    frame: Math.max(0, frame - cueFrame),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const titleEmphasisScale = interpolate(cueSpring, [0, 0.5, 1], [1, 1.05, 1]);
  const highlightGlow = interpolate(cueSpring, [0, 1], [0, 1]);

  const displayTitle = scene.onScreenText[0] ?? topic;
  const displaySubtitle = scene.onScreenText[1] ?? scene.purpose;

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={displayTitle}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "48px 48px",
            boxSizing: "border-box",
            opacity: introOpacity,
            transform: `scale(${introScale})`,
          }}
        >
          {/* Top Category Badges */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
            <AnimatedBadge
              label="Plant Biology"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
            />
            <div
              style={{
                backgroundColor: "#FEF3C7",
                color: "#B45309",
                border: "1.5px solid #FCD34D",
                padding: "8px 18px",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Solar Powered Energy
            </div>
          </div>

          {/* Prominent Title */}
          <div
            style={{
              textAlign: "center",
              transform: `scale(${titleEmphasisScale})`,
              transition: "transform 0.2s ease",
              marginTop: 10,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 52,
                fontWeight: 900,
                color: THEME.colors.textPrimary,
                letterSpacing: "-0.03em",
                textShadow: highlightGlow > 0 ? `0 0 24px rgba(5,150,105,${highlightGlow * 0.3})` : "none",
              }}
            >
              {displayTitle}
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
              {displaySubtitle}
            </p>
          </div>

          {/* Solar Energy Transformation Spec Hero */}
          <div
            style={{
              width: "100%",
              maxWidth: 780,
              backgroundColor: "#FFFFFF",
              border: `2px solid ${THEME.colors.plantGreen}`,
              borderRadius: 24,
              padding: "28px 24px",
              boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 36 }}>🌿</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.textPrimary }}>
                  Solar Energy Transformation
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted }}>
                  How plants make food from sunlight, water & air
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center", alignItems: "center" }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#FEF3C7",
                  border: "2px solid #FCD34D",
                  borderRadius: 16,
                  padding: "12px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26 }}>☀️</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#B45309", marginTop: 4 }}>Sunlight</div>
                <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Light Energy</div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#EFF6FF",
                  border: `2px solid ${THEME.colors.waterBlue}`,
                  borderRadius: 16,
                  padding: "12px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26 }}>💧</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.colors.waterBlueDeep, marginTop: 4 }}>
                  Water
                </div>
                <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Via Roots</div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#F1F5F9",
                  border: `2px solid ${THEME.colors.border}`,
                  borderRadius: 16,
                  padding: "12px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26 }}>💨</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 4 }}>CO2</div>
                <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>From Air</div>
              </div>
              <div style={{ fontSize: 22, color: THEME.colors.plantGreenDark, fontWeight: 900 }}>➔</div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#ECFDF5",
                  border: "2px solid #A7F3D0",
                  borderRadius: 16,
                  padding: "12px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26 }}>🍃</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.colors.plantGreenDark, marginTop: 4 }}>
                  Glucose
                </div>
                <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Plant Food</div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#ECFEFF",
                  border: "2px solid #A5F3FC",
                  borderRadius: 16,
                  padding: "12px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26 }}>🌬️</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0E7490", marginTop: 4 }}>Oxygen</div>
                <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Released</div>
              </div>
            </div>
          </div>

          {/* Bottom subtitle info */}
          <div style={{ fontSize: 18, color: THEME.colors.textMuted, fontWeight: 600 }}>
            3 Core Elements • 60-90s Visual Explainer
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

