import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const WaterCycleTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "The Water Cycle",
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

  const cycleRotation = (frame * 0.75) % 360;

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
          {/* Top Category Badge */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <AnimatedBadge
              label="Earth Science"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={22}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: THEME.colors.textMuted,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Continuous Natural Loop
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
                textShadow: highlightGlow > 0 ? `0 0 24px rgba(37,99,235,${highlightGlow * 0.3})` : "none",
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

          {/* Water Droplet Orbit Hero */}
          <div
            style={{
              position: "relative",
              width: 480,
              height: 480,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <svg
              width="460"
              height="460"
              viewBox="0 0 460 460"
              style={{ position: "absolute", transform: `rotate(${cycleRotation}deg)` }}
            >
              <circle cx="230" cy="230" r="190" fill="none" stroke="#DBEAFE" strokeWidth="3" strokeDasharray="10 8" />
              <circle cx="230" cy="40" r="14" fill={THEME.colors.sunAmber} />
              <circle cx="420" cy="230" r="14" fill={THEME.colors.condensationCyan} />
              <circle cx="230" cy="420" r="14" fill={THEME.colors.waterBlue} />
              <circle cx="40" cy="230" r="14" fill={THEME.colors.plantGreen} />
            </svg>
            <div
              style={{
                width: 280,
                height: 340,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                background: "linear-gradient(180deg, #60A5FA 0%, #2563EB 60%, #1D4ED8 100%)",
                boxShadow: "0 20px 45px rgba(37,99,235,0.28)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 10 }}>💧</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.04em" }}>
                WATER CYCLE
              </div>
            </div>
          </div>

          {/* Bottom subtitle / stats */}
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: THEME.colors.textSecondary }}>
              4 Continuous Stages
            </span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: THEME.colors.border }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: THEME.colors.textSecondary }}>
              Solar Powered Loop
            </span>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

