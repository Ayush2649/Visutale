import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "./TitleHookScene.js";

export const EvaporationScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const vapourEvent = scene.events.find((e) => e.targetId === "vapour-arrow");
  const vapourRevealFrame = vapourEvent ? Math.max(0, vapourEvent.startFrame - scene.startFrame) : 45;

  const vapourSpring = spring({
    frame: Math.max(0, frame - vapourRevealFrame),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const vapourOpacity = interpolate(vapourSpring, [0, 1], [0.15, 1]);
  const vapourScale = interpolate(vapourSpring, [0, 1], [0.85, 1]);

  // Sun pulsing animation
  const sunPulse = 1 + Math.sin(frame * 0.08) * 0.04;
  // Surface wave flow
  const waveOffset = (frame * 3.5) % 180;
  // Downward sunlight ray animation
  const rayOffset = (frame * 4) % 80;

  return (
    <SceneContainer
      topic="The Water Cycle"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle="Stage 1: Evaporation"
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
          {/* Top Stage Header */}
          <div
            style={{
              padding: "28px 36px 0 36px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: THEME.colors.textPrimary }}>
                Solar Heat Drives Evaporation
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                Sunlight warms liquid water, transforming it into rising invisible vapour
              </div>
            </div>
            <AnimatedBadge
              label="Liquid ➔ Gas"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.sunAmberDark}
              bgColor={THEME.colors.sunAmberLight}
              fontSize={20}
            />
          </div>

          {/* Interactive Motion Graphic Area */}
          <div
            style={{
              position: "relative",
              flex: 1,
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 36px",
              boxSizing: "border-box",
            }}
          >
            {/* LEFT: Radiant Sun and Downward Sunlight Beams */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 320,
              }}
            >
              {/* Sun graphic */}
              <div style={{ transform: `scale(${sunPulse})`, position: "relative" }}>
                <svg width="180" height="180" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="42" fill="#F59E0B" />
                  <circle cx="80" cy="80" r="34" fill="#FBBF24" />
                  {/* Radiating sun spikes */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x1 = 80 + Math.cos(rad) * 48;
                    const y1 = 80 + Math.sin(rad) * 48;
                    const x2 = 80 + Math.cos(rad) * 62;
                    const y2 = 80 + Math.sin(rad) * 62;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#F59E0B"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Downward Sunlight Rays (Gold/Amber) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    backgroundColor: "#FEF3C7",
                    border: "1.5px solid #F59E0B",
                    borderRadius: 12,
                    padding: "4px 14px",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#B45309",
                    marginBottom: 8,
                  }}
                >
                  ↓ Sunlight Energy (Downward)
                </div>

                {/* Animated downward arrow rays */}
                <svg width="160" height="140" viewBox="0 0 160 140">
                  {[30, 80, 130].map((x, idx) => {
                    const shift = (rayOffset + idx * 25) % 60;
                    return (
                      <g key={idx} transform={`translate(0, ${shift})`}>
                        <line
                          x1={x}
                          y1="0"
                          x2={x}
                          y2="50"
                          stroke="#F59E0B"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="8 6"
                        />
                        <polygon
                          points={`${x},65 ${x - 8},48 ${x + 8},48`}
                          fill="#D97706"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* RIGHT: Ascending Water Vapour Streams (Cyan/Blue Upward) */}
            <div
              style={{
                opacity: vapourOpacity,
                transform: `scale(${vapourScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 480,
                transition: "opacity 0.2s ease",
              }}
            >
              <div
                style={{
                  backgroundColor: THEME.colors.waterBlueLight,
                  border: `2px solid ${THEME.colors.waterBlue}`,
                  borderRadius: 16,
                  padding: "10px 24px",
                  fontSize: 22,
                  fontWeight: 800,
                  color: THEME.colors.waterBlueDark,
                  marginBottom: 16,
                  boxShadow: "0 6px 16px rgba(37,99,235,0.12)",
                }}
              >
                ↑ Water Vapour Rises (Upward)
              </div>

              {/* Animated rising vapour trails */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  width: "100%",
                  height: 240,
                  position: "relative",
                }}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const y = -((frame * 3 + idx * 35) % 200);
                  const waveX = Math.sin((frame + idx * 30) * 0.12) * 12;
                  return (
                    <div
                      key={idx}
                      style={{
                        transform: `translate(${waveX}px, ${y}px)`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* Vapour stream line */}
                      <svg width="44" height="90" viewBox="0 0 44 90">
                        <path
                          d="M 22 90 Q 38 65 22 45 Q 6 25 22 0"
                          stroke={THEME.colors.condensationCyan}
                          strokeWidth="5"
                          strokeDasharray="8 6"
                          fill="none"
                        />
                        <polygon points="22,0 14,14 30,14" fill={THEME.colors.condensationCyan} />
                      </svg>
                      {/* Rising water droplet particle */}
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: THEME.colors.waterBlue,
                          marginTop: 6,
                          boxShadow: "0 0 8px rgba(37,99,235,0.6)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Reservoir: Ocean, Lake, or River */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 250,
              backgroundColor: THEME.colors.waterBlue,
              borderRadius: "0 0 30px 30px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "28px 40px",
              boxSizing: "border-box",
            }}
          >
            {/* Animated Liquid Surface Waves */}
            <svg
              width="1400"
              height="40"
              style={{
                position: "absolute",
                top: 0,
                left: -waveOffset,
              }}
            >
              <path
                d="M 0 20 Q 40 0 80 20 T 160 20 T 240 20 T 320 20 T 400 20 T 480 20 T 560 20 T 640 20 T 720 20 T 800 20 T 880 20 T 960 20 T 1040 20 T 1120 20 T 1200 20 T 1280 20 T 1360 20 L 1360 40 L 0 40 Z"
                fill="rgba(255,255,255,0.3)"
              />
            </svg>

            {/* Heat Absorption Glow on the left water surface */}
            <div
              style={{
                position: "absolute",
                top: 4,
                left: 60,
                width: 220,
                height: 14,
                backgroundColor: "#FDE047",
                borderRadius: 8,
                opacity: 0.6 + Math.sin(frame * 0.1) * 0.3,
                filter: "blur(6px)",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#FFFFFF",
                zIndex: 2,
              }}
            >
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.01em" }}>
                  Ocean, Lake, or River Reservoir
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, opacity: 0.95, marginTop: 4 }}>
                  Sunlight warms liquid water at the surface, exciting water molecules
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.25)",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  padding: "8px 20px",
                  borderRadius: 14,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Liquid Water
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
