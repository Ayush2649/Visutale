import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import { isEventActiveInScene, getEventSpringProgress } from "../../core/sharedAnimationUtilities.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const PlantIngredientsDiagram: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "How Photosynthesis Works",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "The 3 Key Ingredients";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const isSunActive = isEventActiveInScene(scene, "obj-sun-rays", frame);
  const isCo2Active = isEventActiveInScene(scene, "obj-co2-node", frame);
  const isWaterActive = isEventActiveInScene(scene, "obj-water-arrow", frame);

  const sunSpr = getEventSpringProgress(scene, "obj-sun-rays", frame, fps, 60);
  const co2Spr = getEventSpringProgress(scene, "obj-co2-node", frame, fps, 40);
  const waterSpr = getEventSpringProgress(scene, "obj-water-arrow", frame, fps, 20);
  const plantSpr = getEventSpringProgress(scene, "obj-plant-diagram", frame, fps, 0);

  const sunOpacity = interpolate(sunSpr, [0, 1], [0.8, 1]);
  const co2Opacity = interpolate(co2Spr, [0, 1], [0.8, 1]);
  const waterOpacity = interpolate(waterSpr, [0, 1], [0.8, 1]);

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
              label="Plant Anatomy & Inputs"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
            />
          </div>
        </div>

        {/* Dynamic Diagram Visual Stage */}
        <div
          style={{
            flex: 1,
            padding: "8px 36px 28px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Top Row: Two Overhead Ingredients (Sunlight & CO2) */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: 16 }}>
            {/* 1. Sunlight Card */}
            <div
              style={{
                flex: 1,
                backgroundColor: isSunActive ? "#FEF3C7" : "#FFFBEB",
                border: `2.5px solid ${isSunActive ? "#D97706" : "#FDE68A"}`,
                borderRadius: 18,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: isSunActive
                  ? "0 8px 24px rgba(217,119,6,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.03)",
                transform: `scale(${isSunActive ? 1.03 : 1})`,
                opacity: sunOpacity,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 34 }}>☀️</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#92400E" }}>
                  1. Sunlight (Light Energy)
                </div>
                <div style={{ fontSize: 14, color: "#B45309", fontWeight: 600, marginTop: 2 }}>
                  Photons trapped by chlorophyll
                </div>
              </div>
            </div>

            {/* 2. CO2 Card */}
            <div
              style={{
                flex: 1,
                backgroundColor: isCo2Active ? "#EFF6FF" : "#F8FAFC",
                border: `2.5px solid ${isCo2Active ? "#0284C7" : "#CBD5E1"}`,
                borderRadius: 18,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: isCo2Active
                  ? "0 8px 24px rgba(2,132,199,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.03)",
                transform: `scale(${isCo2Active ? 1.03 : 1})`,
                opacity: co2Opacity,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 34 }}>💨</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0369A1" }}>
                  2. Carbon Dioxide (CO₂)
                </div>
                <div style={{ fontSize: 14, color: "#0284C7", fontWeight: 600, marginTop: 2 }}>
                  Absorbed from air via leaf pores
                </div>
              </div>
            </div>
          </div>

          {/* Central Plant Illustration SVG with Dynamic Water, CO2 & Sun Ray Flow */}
          <div
            style={{
              width: "100%",
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "8px 0",
            }}
          >
            <svg
              width="840"
              height="560"
              viewBox="0 0 840 560"
              style={{
                transform: `scale(${interpolate(plantSpr, [0, 1], [0.96, 1])})`,
                transformOrigin: "center center",
              }}
            >
              <defs>
                <radialGradient id="sunCoronaPl" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="leafGradPl" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* --- Soil Layer (y: 360 to 550) --- */}
              <rect
                x="24"
                y="360"
                width="792"
                height="180"
                rx="16"
                fill="#FEF3C7"
                stroke="#B45309"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <line x1="24" y1="360" x2="816" y2="360" stroke="#92400E" strokeWidth="4" />
              <text x="44" y="386" fontSize="14" fontWeight="800" fill="#92400E" letterSpacing="0.05em">
                SOIL HORIZON (H₂O & NUTRIENT RESERVOIR)
              </text>

              {/* Root Network Underground */}
              <g>
                {/* Main Taproot */}
                <path
                  d="M 420 360 Q 418 440 420 530"
                  stroke="#92400E"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Lateral Left Roots */}
                <path
                  d="M 420 380 Q 330 405 220 440"
                  stroke="#92400E"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 420 420 Q 340 455 250 500"
                  stroke="#92400E"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Lateral Right Roots */}
                <path
                  d="M 420 380 Q 510 405 620 440"
                  stroke="#92400E"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 420 420 Q 500 455 590 500"
                  stroke="#92400E"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Soil Water Droplets */}
                {[
                  { cx: 180, cy: 420 },
                  { cx: 280, cy: 470 },
                  { cx: 360, cy: 490 },
                  { cx: 480, cy: 490 },
                  { cx: 560, cy: 470 },
                  { cx: 660, cy: 420 },
                ].map((d, i) => (
                  <g key={`droplet-pl-${i}`}>
                    <circle
                      cx={d.cx}
                      cy={d.cy}
                      r={isWaterActive ? 10 : 8}
                      fill="#38BDF8"
                      stroke="#0284C7"
                      strokeWidth="2"
                    />
                    <circle cx={d.cx - 2} cy={d.cy - 2} r="2.5" fill="#FFFFFF" />
                  </g>
                ))}

                {/* Animated Inflow into Roots */}
                {[0, 1, 2].map((i) => {
                  const inX = 260 + ((frame * 2.2 + i * 45) % 130);
                  const inY = 430 - ((frame * 1.5 + i * 30) % 50);
                  return (
                    <circle
                      key={`inflow-left-pl-${i}`}
                      cx={inX}
                      cy={inY}
                      r={isWaterActive ? 4.5 : 3.5}
                      fill="#0284C7"
                    />
                  );
                })}
                {[0, 1, 2].map((i) => {
                  const inX = 580 - ((frame * 2.2 + i * 45) % 130);
                  const inY = 430 - ((frame * 1.5 + i * 30) % 50);
                  return (
                    <circle
                      key={`inflow-right-pl-${i}`}
                      cx={inX}
                      cy={inY}
                      r={isWaterActive ? 4.5 : 3.5}
                      fill="#0284C7"
                    />
                  );
                })}
              </g>

              {/* --- Central Main Stem --- */}
              <path
                d="M 420 360 Q 416 240 420 130"
                stroke={THEME.colors.plantGreenDark}
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
              />

              {/* Capillary Upward Moisture Stream in Stem */}
              {[0, 1, 2, 3, 4].map((i) => {
                const dotY = 350 - ((frame * 3 + i * 44) % 210);
                return (
                  <circle
                    key={`xylem-pl-${i}`}
                    cx={418}
                    cy={dotY}
                    r={isWaterActive ? 5.5 : 4}
                    fill={isWaterActive ? "#0284C7" : "#38BDF8"}
                  />
                );
              })}

              {/* --- Leaves and Stomata --- */}
              {/* Lower Left Leaf */}
              <g>
                <path
                  d="M 416 270 Q 300 230 180 220 Q 290 165 416 220"
                  fill="url(#leafGradPl)"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="4"
                />
                <path d="M 416 245 Q 300 210 180 220" stroke="#047857" strokeWidth="3" fill="none" />
                <circle cx="260" cy="220" r="5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
                <circle cx="210" cy="222" r="4.5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
                <text x="210" y="248" fontSize="13" fontWeight="800" fill="#047857">
                  Stomata Pores
                </text>
              </g>

              {/* Lower Right Leaf */}
              <g>
                <path
                  d="M 424 250 Q 540 210 660 200 Q 550 145 424 200"
                  fill="url(#leafGradPl)"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="4"
                />
                <path d="M 424 225 Q 540 190 660 200" stroke="#047857" strokeWidth="3" fill="none" />
                <circle cx="580" cy="200" r="5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
                <circle cx="630" cy="202" r="4.5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
                <text x="560" y="228" fontSize="13" fontWeight="800" fill="#047857">
                  Stomata Pores
                </text>
              </g>

              {/* Upper Left Leaf (Facing Sun Rays) */}
              <g>
                <path
                  d="M 418 180 Q 320 130 220 110 Q 320 80 418 140"
                  fill="url(#leafGradPl)"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="4"
                />
                <path d="M 418 160 Q 320 120 220 110" stroke="#047857" strokeWidth="3" fill="none" />
                <circle cx="300" cy="125" r="5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
              </g>

              {/* Upper Right Leaf (Facing CO2 Inflow) */}
              <g>
                <path
                  d="M 422 165 Q 520 115 620 95 Q 520 65 422 125"
                  fill="url(#leafGradPl)"
                  stroke={THEME.colors.plantGreenDark}
                  strokeWidth="4"
                />
                <path d="M 422 145 Q 520 105 620 95" stroke="#047857" strokeWidth="3" fill="none" />
                <circle cx="540" cy="110" r="5" fill="#A7F3D0" stroke="#047857" strokeWidth="2" />
              </g>

              {/* Top Crown Leaves */}
              <path
                d="M 420 130 Q 370 70 390 20 Q 420 65 420 130"
                fill="#059669"
                stroke="#047857"
                strokeWidth="3.5"
              />
              <path
                d="M 420 130 Q 470 70 450 20 Q 420 65 420 130"
                fill="#059669"
                stroke="#047857"
                strokeWidth="3.5"
              />

              {/* --- Sunlight Source & Rays (Top-Left) --- */}
              <g>
                <circle cx="95" cy="55" r="50" fill="url(#sunCoronaPl)" />
                <circle cx="95" cy="55" r="28" fill="#F59E0B" stroke="#D97706" strokeWidth="3.5" />
                <circle cx="95" cy="55" r="38" fill="none" stroke="#FBBF24" strokeWidth="2" strokeDasharray="5 4" />

                {/* Sunlight Traveling Streamlines */}
                <path
                  d="M 125 72 L 235 110"
                  stroke="#F59E0B"
                  strokeWidth={isSunActive ? 5 : 3.5}
                  strokeDasharray="8 5"
                  strokeDashoffset={-frame * 3}
                  fill="none"
                />
                <polygon points="240,112 227,105 229,118" fill="#D97706" />

                <path
                  d="M 130 55 L 350 45"
                  stroke="#F59E0B"
                  strokeWidth={isSunActive ? 4.5 : 3}
                  strokeDasharray="7 5"
                  strokeDashoffset={-frame * 3}
                  fill="none"
                />
                <polygon points="355,45 342,39 342,51" fill="#D97706" />

                <path
                  d="M 115 88 L 205 190"
                  stroke="#F59E0B"
                  strokeWidth={isSunActive ? 4 : 2.5}
                  strokeDasharray="6 4"
                  strokeDashoffset={-frame * 2.5}
                  fill="none"
                />
                <polygon points="210,195 197,188 205,180" fill="#D97706" />
              </g>

              {/* --- Carbon Dioxide Inflow Streams (Top-Right) --- */}
              <g>
                {/* Ambient CO2 Badges */}
                {[
                  { x: 700, y: 55 },
                  { x: 740, y: 125 },
                  { x: 690, y: 175 },
                ].map((pos, i) => (
                  <g key={`co2-pill-pl-${i}`}>
                    <rect
                      x={pos.x}
                      y={pos.y}
                      width="58"
                      height="30"
                      rx="8"
                      fill="#EFF6FF"
                      stroke="#0284C7"
                      strokeWidth="2"
                    />
                    <text
                      x={pos.x + 12}
                      y={pos.y + 21}
                      fontSize="14"
                      fontWeight="800"
                      fill="#0369A1"
                    >
                      CO₂
                    </text>
                  </g>
                ))}

                {/* CO2 Inflow Arcs into Leaves */}
                <path
                  d="M 695 68 Q 590 85 540 105"
                  stroke="#0284C7"
                  strokeWidth={isCo2Active ? 4.5 : 3}
                  strokeDasharray="7 5"
                  strokeDashoffset={-frame * 2.5}
                  fill="none"
                />
                <polygon points="535,107 548,100 546,114" fill="#0284C7" />

                <path
                  d="M 735 140 Q 655 170 590 195"
                  stroke="#0284C7"
                  strokeWidth={isCo2Active ? 4.5 : 3}
                  strokeDasharray="7 5"
                  strokeDashoffset={-frame * 2.5}
                  fill="none"
                />
                <polygon points="585,197 598,190 596,204" fill="#0284C7" />
              </g>
            </svg>
          </div>

          {/* Bottom Row: Water (H2O) Intake Full-Width Card */}
          <div
            style={{
              width: "100%",
              backgroundColor: isWaterActive ? "#EFF6FF" : "#F0F9FF",
              border: `2.5px solid ${isWaterActive ? "#2563EB" : "#BAE6FD"}`,
              borderRadius: 18,
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: isWaterActive
                ? "0 8px 24px rgba(37,99,235,0.22)"
                : "0 2px 8px rgba(0,0,0,0.03)",
              transform: `scale(${isWaterActive ? 1.02 : 1})`,
              opacity: waterOpacity,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 34 }}>💧</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1E40AF" }}>
                  3. Water (H₂O) Intake via Root System
                </div>
                <div style={{ fontSize: 14, color: "#2563EB", fontWeight: 600, marginTop: 2 }}>
                  Roots absorb water from soil & capillary stem channels transport it upward to leaves
                </div>
              </div>
            </div>
            <div
              style={{
                backgroundColor: isWaterActive ? "#2563EB" : "#DBEAFE",
                color: isWaterActive ? "#FFFFFF" : "#1E40AF",
                padding: "8px 18px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              Xylem Capillary Flow
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

