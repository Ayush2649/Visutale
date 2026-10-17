import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "./TitleHookScene.js";

export const TranspirationScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const transpEvent = scene.events.find((e) => e.targetId === "leaf-vapour");
  const revealFrame = transpEvent ? Math.max(0, transpEvent.startFrame - scene.startFrame) : 40;

  const spr = spring({
    frame: Math.max(0, frame - revealFrame),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const transpHighlightOpacity = interpolate(spr, [0, 1], [0.3, 1]);
  const transpBadgeScale = interpolate(spr, [0, 1], [0.88, 1]);
  const transpBadgeOpacity = interpolate(spr, [0, 1], [0, 1]);

  return (
    <SceneContainer
      topic="The Water Cycle"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle="Plant Evaporation: Transpiration"
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
            padding: "32px 36px",
            boxSizing: "border-box",
          }}
        >
          {/* Header Description */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: THEME.colors.textPrimary }}>
                Plants Release Water Vapour
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                Moisture travels through the plant and evaporates from microscopic leaf pores
              </div>
            </div>
            <AnimatedBadge
              label="Foliage Evaporation"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
              fontSize={20}
            />
          </div>

          {/* Central Hero: Plant Illustration with Upward Leaf Vapour Streams */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 640,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Callout Badge for Transpiration (reveals prominently at cue) */}
            <div
              style={{
                position: "absolute",
                top: 10,
                opacity: transpBadgeOpacity,
                transform: `scale(${transpBadgeScale})`,
                zIndex: 20,
              }}
            >
              <div
                style={{
                  backgroundColor: "#ECFDF5",
                  border: `2.5px solid ${THEME.colors.plantGreen}`,
                  padding: "10px 28px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 24px rgba(5,150,105,0.18)",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: THEME.colors.plantGreen,
                  }}
                />
                <span style={{ fontSize: 26, fontWeight: 900, color: THEME.colors.plantGreenDark }}>
                  Transpiration: Water Vapour from Leaves
                </span>
              </div>
            </div>

            {/* Rising Leaf Vapour Streams (Cyan/Blue traveling upward) */}
            <div
              style={{
                position: "absolute",
                top: 70,
                width: 600,
                height: 280,
                opacity: transpHighlightOpacity,
                display: "flex",
                justifyContent: "space-around",
                zIndex: 15,
                pointerEvents: "none",
              }}
            >
              {[
                { xOffset: -140, leafOriginY: 180, delay: 0 },
                { xOffset: -60, leafOriginY: 120, delay: 15 },
                { xOffset: 70, leafOriginY: 110, delay: 8 },
                { xOffset: 160, leafOriginY: 190, delay: 22 },
              ].map((stream, idx) => {
                const y = -((frame * 3 + stream.delay * 25) % 180);
                const waveX = Math.sin((frame + stream.delay * 20) * 0.15) * 10;
                return (
                  <div
                    key={idx}
                    style={{
                      transform: `translate(${stream.xOffset + waveX}px, ${stream.leafOriginY + y}px)`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <svg width="36" height="70" viewBox="0 0 36 70">
                      <path
                        d="M 18 70 Q 30 50 18 30 Q 6 15 18 0"
                        stroke={THEME.colors.condensationCyan}
                        strokeWidth="4"
                        strokeDasharray="6 4"
                        fill="none"
                      />
                      <polygon points="18,0 11,12 25,12" fill={THEME.colors.condensationCyan} />
                    </svg>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: THEME.colors.waterBlue,
                        marginTop: 4,
                        boxShadow: "0 0 6px rgba(37,99,235,0.5)",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Clear Plant Illustration */}
            <svg width="520" height="540" viewBox="0 0 500 520" style={{ marginTop: 50 }}>
              {/* Central Main Stem */}
              <path
                d="M 250 500 Q 245 360 250 200"
                stroke={THEME.colors.plantGreenDark}
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
              />

              {/* Internal upward capillary moisture flow in stem */}
              {[0, 1, 2, 3].map((i) => {
                const dotY = 480 - ((frame * 2.5 + i * 70) % 280);
                return (
                  <circle
                    key={i}
                    cx="248"
                    cy={dotY}
                    r="5"
                    fill="#38BDF8"
                  />
                );
              })}

              {/* Lower Left Leaf Branch */}
              <g>
                <path
                  d="M 245 380 Q 170 330 90 320 Q 160 260 245 320"
                  fill="#10B981"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="6"
                />
                <path d="M 245 350 Q 175 325 90 320" stroke="#047857" strokeWidth="4" fill="none" />
                {/* Microscopic stomata indicator */}
                <circle cx="160" cy="310" r="6" fill="#6EE7B7" stroke="#047857" strokeWidth="2" />
                <circle cx="120" cy="318" r="5" fill="#6EE7B7" stroke="#047857" strokeWidth="2" />
              </g>

              {/* Lower Right Leaf Branch */}
              <g>
                <path
                  d="M 255 350 Q 330 300 410 290 Q 340 230 255 290"
                  fill="#10B981"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="6"
                />
                <path d="M 255 320 Q 325 295 410 290" stroke="#047857" strokeWidth="4" fill="none" />
                <circle cx="340" cy="285" r="6" fill="#6EE7B7" stroke="#047857" strokeWidth="2" />
                <circle cx="380" cy="288" r="5" fill="#6EE7B7" stroke="#047857" strokeWidth="2" />
              </g>

              {/* Upper Left Leaf Branch */}
              <g>
                <path
                  d="M 248 260 Q 180 200 130 180 Q 200 140 248 210"
                  fill="#34D399"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="6"
                />
                <path d="M 248 235 Q 190 200 130 180" stroke="#047857" strokeWidth="4" fill="none" />
                <circle cx="180" cy="185" r="5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
              </g>

              {/* Upper Right Leaf Branch */}
              <g>
                <path
                  d="M 252 230 Q 320 170 370 150 Q 300 110 252 180"
                  fill="#34D399"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="6"
                />
                <path d="M 252 205 Q 310 170 370 150" stroke="#047857" strokeWidth="4" fill="none" />
                <circle cx="320" cy="155" r="5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
              </g>

              {/* Crown Top Leaves */}
              <path
                d="M 250 200 Q 200 120 220 50 Q 250 100 250 190"
                fill="#059669"
                stroke="#047857"
                strokeWidth="5"
              />
              <path
                d="M 250 200 Q 300 120 280 50 Q 250 100 250 190"
                fill="#059669"
                stroke="#047857"
                strokeWidth="5"
              />

              {/* Plant Pot / Soil Base - small, minimal plant base (not confusing groundwater panel) */}
              <path
                d="M 210 500 L 290 500 L 280 520 L 220 520 Z"
                fill="#64748B"
              />
            </svg>
          </div>

          {/* Bottom Educational Summary Bar */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#F8FAFC",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 20,
              padding: "18px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: THEME.colors.condensationCyan,
                }}
              />
              <span style={{ fontSize: 24, fontWeight: 700, color: THEME.colors.textPrimary }}>
                Water escapes through leaf stomata into atmospheric air
              </span>
            </div>
            <div
              style={{
                backgroundColor: THEME.colors.plantGreenLight,
                color: THEME.colors.plantGreenDark,
                border: `1.5px solid ${THEME.colors.plantGreen}`,
                padding: "6px 18px",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Adds to Air Moisture
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
