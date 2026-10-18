import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const WaterCycleTakeaway: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "The Water Cycle",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "The Continuous Loop";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  const summaryOpacity = interpolate(spr, [0, 1], [0, 1]);
  const summaryScale = interpolate(spr, [0, 1], [0.92, 1]);

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
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "36px 40px",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 800, color: THEME.colors.textPrimary }}>
                {title}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                {subtitle}
              </div>
            </div>
            <AnimatedBadge
              label="Summary"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
            />
          </div>

          {/* Central 4-Phase Closed Loop */}
          <div
            style={{
              opacity: summaryOpacity,
              transform: `scale(${summaryScale})`,
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 14,
              padding: "16px 0",
            }}
          >
            {[
              {
                num: "1",
                name: "Evaporation",
                desc: "Liquid water absorbs solar energy and rises as vapor",
                icon: "☀️",
                color: THEME.colors.sunAmber,
                bg: THEME.colors.sunAmberLight,
              },
              {
                num: "2",
                name: "Condensation",
                desc: "Cooling air condenses rising vapor into clouds",
                icon: "☁️",
                color: THEME.colors.condensationCyan,
                bg: THEME.colors.condensationCyanLight,
              },
              {
                num: "3",
                name: "Precipitation",
                desc: "Gravity pulls condensed rain and snow back to Earth",
                icon: "🌧️",
                color: THEME.colors.waterBlue,
                bg: THEME.colors.waterBlueLight,
              },
              {
                num: "4",
                name: "Collection",
                desc: "Runoff replenishes lakes, oceans, and aquifers",
                icon: "🌊",
                color: THEME.colors.plantGreenDark,
                bg: THEME.colors.plantGreenLight,
              },
            ].map((stg, i) => {
              const active = Math.min(3, Math.floor(frame / 60)) === i;
              return (
                <div
                  key={stg.name}
                  style={{
                    backgroundColor: active ? stg.bg : "#FFFFFF",
                    border: `2px solid ${active ? stg.color : THEME.colors.border}`,
                    borderRadius: 16,
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    boxShadow: active ? "0 4px 14px rgba(37,99,235,0.08)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: stg.color,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    {stg.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>
                      Stage {stg.num}: {stg.name}
                    </div>
                    <div style={{ fontSize: 15, color: THEME.colors.textMuted }}>{stg.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Callout */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#0F172A",
              borderRadius: 20,
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 26 }}>🔄</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
                Earth's continuous natural engine
              </span>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#94A3B8",
                letterSpacing: "0.04em",
              }}
            >
              INFINITE LOOP
            </span>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

