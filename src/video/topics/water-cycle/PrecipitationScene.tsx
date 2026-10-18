import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const PrecipitationScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rainEvent = scene.events.find((e) => e.targetId === "rainfall");
  const rainRevealFrame = rainEvent ? Math.max(0, rainEvent.startFrame - scene.startFrame) : 40;

  const rainSpring = spring({
    frame: Math.max(0, frame - rainRevealFrame),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const rainOpacity = interpolate(rainSpring, [0, 1], [0.1, 1]);
  const rainScale = interpolate(rainSpring, [0, 1], [0.9, 1]);

  // Cloud density swell as droplets become heavy
  const cloudSwell = 1 + Math.sin(frame * 0.08) * 0.03;

  return (
    <SceneContainer
      topic="The Water Cycle"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle="Stage 3: Precipitation"
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
            boxSizing: "border-box",
          }}
        >
          {/* Top Header */}
          <div
            style={{
              padding: "28px 36px 0 36px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: THEME.colors.textPrimary }}>
                Water Returns to Earth
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                When droplet weight overcomes air currents, moisture falls as rain or snow
              </div>
            </div>
            <AnimatedBadge
              label="Atmosphere ➔ Surface"
              frame={frame}
              revealFrame={5}
              color="#1E40AF"
              bgColor="#DBEAFE"
              fontSize={20}
            />
          </div>

          {/* Central Hero: Moisture Cloud + Cascading Rain & Snow to Earth */}
          <div
            style={{
              position: "relative",
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            {/* The Heavy Rain Cloud at Top */}
            <div style={{ transform: `scale(${cloudSwell})`, position: "relative", zIndex: 10 }}>
              <svg width="520" height="220" viewBox="0 0 500 200">
                <defs>
                  <filter id="rainCloudShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="16" stdDeviation="22" floodColor="#1E293B" floodOpacity="0.3" />
                  </filter>
                </defs>
                {/* Heavy, dark moisture cloud */}
                <g filter="url(#rainCloudShadow)">
                  <circle cx="150" cy="120" r="75" fill="#475569" />
                  <circle cx="250" cy="85" r="95" fill="#334155" />
                  <circle cx="350" cy="120" r="75" fill="#475569" />
                  <circle cx="200" cy="135" r="65" fill="#334155" />
                  <circle cx="300" cy="135" r="65" fill="#334155" />
                  <rect x="130" y="110" width="240" height="60" rx="30" fill="#334155" />
                </g>
                {/* Heavy moisture indicator droplets inside cloud */}
                <circle cx="210" cy="100" r="8" fill="#60A5FA" opacity="0.8" />
                <circle cx="260" cy="120" r="10" fill="#3B82F6" opacity="0.9" />
                <circle cx="310" cy="95" r="8" fill="#60A5FA" opacity="0.8" />
              </svg>
            </div>

            {/* Precipitation falling directly from cloud base toward ground */}
            <div
              style={{
                opacity: rainOpacity,
                transform: `scale(${rainScale})`,
                position: "relative",
                width: 560,
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              {/* Rain Streaks cascading downward */}
              {[
                { x: 50, speed: 18, delay: 0 },
                { x: 120, speed: 22, delay: 12 },
                { x: 190, speed: 19, delay: 4 },
                { x: 260, speed: 23, delay: 18 },
                { x: 330, speed: 20, delay: 8 },
                { x: 400, speed: 24, delay: 14 },
                { x: 470, speed: 19, delay: 2 },
              ].map((streak, i) => {
                const y = ((frame * streak.speed + streak.delay * 28) % 280) - 20;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: streak.x,
                      top: y,
                      width: 5,
                      height: 48,
                      borderRadius: 3,
                      backgroundColor: THEME.colors.waterBlue,
                      transform: "rotate(10deg)",
                      boxShadow: "0 2px 8px rgba(37,99,235,0.45)",
                    }}
                  />
                );
              })}

              {/* Snow crystals drifting downward */}
              {[
                { x: 90, delay: 10 },
                { x: 220, delay: 35 },
                { x: 360, delay: 20 },
                { x: 440, delay: 5 },
              ].map((snow, i) => {
                const y = ((frame * 6 + snow.delay * 35) % 260) - 10;
                const driftX = Math.sin((frame + snow.delay * 20) * 0.1) * 14;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: snow.x + driftX,
                      top: y,
                      color: "#0284C7",
                      fontSize: 24,
                      fontWeight: 900,
                      opacity: 0.85,
                    }}
                  >
                    ❄
                  </div>
                );
              })}

              {/* Central Precipitation Callout Pill */}
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "#FFFFFF",
                  border: `2.5px solid ${THEME.colors.waterBlue}`,
                  padding: "10px 28px",
                  borderRadius: 20,
                  fontSize: 24,
                  fontWeight: 900,
                  color: THEME.colors.waterBlueDark,
                  boxShadow: "0 8px 24px rgba(37,99,235,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  zIndex: 15,
                }}
              >
                <span>🌧️ Rain</span>
                <span style={{ color: THEME.colors.textMuted }}>•</span>
                <span>❄️ Snow</span>
              </div>
            </div>
          </div>

          {/* Bottom Ground Landscape with Impact Splashes */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 200,
              backgroundColor: "#E2E8F0",
              borderTop: "5px solid #94A3B8",
              borderRadius: "0 0 30px 30px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "24px 36px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Ground Impact Splashes (animated ripples on surface) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 20,
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              {[60, 160, 280, 420, 560, 700, 820].map((x, idx) => {
                const splashScale = 0.5 + Math.abs(Math.sin((frame * 0.3 + idx) * 0.8)) * 0.9;
                return (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: x,
                      top: 4,
                      width: 24,
                      height: 8,
                      borderRadius: "50%",
                      border: "2px solid #2563EB",
                      transform: `scale(${splashScale})`,
                      opacity: 0.8,
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.textPrimary }}>
                  Earth's Land and Oceans
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                  Precipitation replenishes freshwater across soil, lakes, streams, and oceans
                </div>
              </div>
              <div
                style={{
                  backgroundColor: THEME.colors.waterBlue,
                  color: "#FFFFFF",
                  padding: "8px 22px",
                  borderRadius: 14,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Precipitation
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
