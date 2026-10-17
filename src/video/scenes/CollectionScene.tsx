import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "./TitleHookScene.js";

export const CollectionScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const collectionEvent = scene.events.find((e) => e.targetId === "water-reservoir");
  const highlightFrame = collectionEvent ? Math.max(0, collectionEvent.startFrame - scene.startFrame) : 180;

  // Progressive disclosure phases:
  // Phase 1: Runoff (0 - 110)
  // Phase 2: Infiltration (110 - 210)
  // Phase 3: Collection (210 - end)
  const isPhase1 = frame < 110;
  const isPhase2 = frame >= 110 && frame < 210;
  const isPhase3 = frame >= 210;

  const collectionSpring = spring({
    frame: Math.max(0, frame - highlightFrame),
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const reservoirGlow = interpolate(collectionSpring, [0, 1], [1, 1.04]);
  const highlightBorder = interpolate(collectionSpring, [0, 1], [2, 6]);

  // Runoff wave animation
  const runoffFlow = (frame * 3.5) % 80;
  // Infiltration drop animation
  const dropY = (frame * 2) % 40;

  return (
    <SceneContainer
      topic="The Water Cycle"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle="Stage 4: Collection"
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
            padding: "28px 36px",
            boxSizing: "border-box",
          }}
        >
          {/* Header Description */}
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: THEME.colors.textPrimary }}>
              Water Collects Across Land and Reservoirs
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
              Water flows through rivers, soaks into soil, and pools in lakes and oceans
            </div>
          </div>

          {/* Progressive Stage Indicator Tabs (Clean & High Contrast) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div
              style={{
                backgroundColor: isPhase1 ? THEME.colors.waterBlueLight : "#F8FAFC",
                border: `2px solid ${isPhase1 ? THEME.colors.waterBlue : THEME.colors.border}`,
                borderRadius: 16,
                padding: "10px 14px",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: isPhase1 ? THEME.colors.waterBlueDark : THEME.colors.textMuted }}>
                1. Surface Runoff
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: isPhase1 ? THEME.colors.textPrimary : THEME.colors.textMuted }}>
                Streams & Rivers
              </div>
            </div>

            <div
              style={{
                backgroundColor: isPhase2 ? "#FEF3C7" : "#F8FAFC",
                border: `2px solid ${isPhase2 ? "#D97706" : THEME.colors.border}`,
                borderRadius: 16,
                padding: "10px 14px",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: isPhase2 ? "#B45309" : THEME.colors.textMuted }}>
                2. Infiltration
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: isPhase2 ? THEME.colors.textPrimary : THEME.colors.textMuted }}>
                Groundwater in Soil
              </div>
            </div>

            <div
              style={{
                backgroundColor: isPhase3 ? "#DBEAFE" : "#F8FAFC",
                border: `2px solid ${isPhase3 ? "#1D4ED8" : THEME.colors.border}`,
                borderRadius: 16,
                padding: "10px 14px",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: isPhase3 ? "#1E40AF" : THEME.colors.textMuted }}>
                3. Collection
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: isPhase3 ? THEME.colors.textPrimary : THEME.colors.textMuted }}>
                Lakes & Oceans
              </div>
            </div>
          </div>

          {/* Central Landscape Cross-section Diagram */}
          <div
            style={{
              position: "relative",
              flex: 1,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "12px 0",
            }}
          >
            <svg width="864" height="480" viewBox="0 0 864 480">
              {/* Mountain Terrain Slope (Left) */}
              <path
                d="M 0 120 Q 200 160 400 240 L 400 480 L 0 480 Z"
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="3"
              />

              {/* Surface Runoff Streams (active in Phase 1 and 3) */}
              <path
                d="M 40 120 Q 200 165 390 250"
                stroke={THEME.colors.waterBlue}
                strokeWidth={isPhase1 ? "12" : "8"}
                strokeDasharray="16 12"
                strokeDashoffset={-runoffFlow}
                fill="none"
              />
              {/* Runoff label */}
              <rect x="50" y="80" width="220" height="34" rx="8" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
              <text x="65" y="104" fill="#1D4ED8" fontSize="18" fontWeight="800">
                Surface Runoff (River Flow) ➔
              </text>

              {/* Soil Layer Cross-section (Lower Middle) */}
              <path
                d="M 0 260 Q 180 290 400 320 L 400 480 L 0 480 Z"
                fill="#FEF3C7"
                stroke="#FCD34D"
                strokeWidth="2"
              />
              {/* Infiltration Label */}
              <rect x="40" y="340" width="230" height="34" rx="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="2" />
              <text x="55" y="364" fill="#B45309" fontSize="18" fontWeight="800">
                Soil Infiltration (Groundwater)
              </text>

              {/* Infiltration percolating water drops (active in Phase 2 and 3) */}
              {[100, 160, 220, 280, 340].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={290 + ((dropY + i * 15) % 40)}
                  r="5"
                  fill="#D97706"
                />
              ))}

              {/* Large Ocean/Lake Reservoir Basin (Right) */}
              <g
                transform={`translate(400, 180) scale(${isPhase3 ? reservoirGlow : 1})`}
                style={{ transformOrigin: "200px 150px" }}
              >
                <rect
                  x="0"
                  y="0"
                  width="464"
                  height="300"
                  rx="24"
                  fill={THEME.colors.waterBlue}
                  stroke={isPhase3 ? "#60A5FA" : "#1D4ED8"}
                  strokeWidth={highlightBorder}
                />
                {/* Surface water ripples */}
                <path
                  d="M 20 30 Q 80 15 140 30 T 260 30 T 380 30 T 440 30"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  fill="none"
                  opacity="0.75"
                />
                <text x="40" y="90" fill="#FFFFFF" fontSize="34" fontWeight="900">
                  Lakes and Oceans
                </text>
                <text x="40" y="135" fill="#FFFFFF" fontSize="22" fontWeight="600" opacity="0.95">
                  Vast reservoirs collect returning water
                </text>
                <rect
                  x="40"
                  y="180"
                  width="280"
                  height="48"
                  rx="12"
                  fill="rgba(255,255,255,0.25)"
                />
                <text x="58" y="212" fill="#FFFFFF" fontSize="22" fontWeight="800">
                  Ready to Restart the Cycle ↺
                </text>
              </g>
            </svg>
          </div>

          {/* Bottom Summary Bar */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#F8FAFC",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 20,
              padding: "16px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: THEME.colors.waterBlue,
                }}
              />
              <span style={{ fontSize: 24, fontWeight: 700, color: THEME.colors.textPrimary }}>
                Collected water will warm again under the sun, repeating the loop
              </span>
            </div>
            <div
              style={{
                backgroundColor: THEME.colors.waterBlueLight,
                color: THEME.colors.waterBlueDark,
                border: `1.5px solid ${THEME.colors.waterBlue}`,
                padding: "6px 18px",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Cycle Continues
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
