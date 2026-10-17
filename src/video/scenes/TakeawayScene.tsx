import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "./TitleHookScene.js";

export const TakeawayScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const summaryEvent = scene.events.find((e) => e.targetId === "cycle-summary");
  const revealFrame = summaryEvent ? Math.max(0, summaryEvent.startFrame - scene.startFrame) : 40;

  const spr = spring({
    frame: Math.max(0, frame - revealFrame),
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  const summaryOpacity = interpolate(spr, [0, 1], [0, 1]);
  const summaryScale = interpolate(spr, [0, 1], [0.92, 1]);

  // Meaningful sequential stage highlighting across the 240-frame scene
  // 1. Evaporation (0-60) -> 2. Condensation (60-120) -> 3. Precipitation (120-180) -> 4. Collection (180-240)
  const activeStage = Math.min(3, Math.floor(frame / 60));

  const stages = [
    {
      id: "evap",
      num: "1",
      name: "Evaporation",
      icon: "☀️",
      desc: "Water warms & rises",
      color: THEME.colors.sunAmber,
      bg: THEME.colors.sunAmberLight,
    },
    {
      id: "cond",
      num: "2",
      name: "Condensation",
      icon: "☁️",
      desc: "Vapour forms clouds",
      color: THEME.colors.condensationCyan,
      bg: THEME.colors.condensationCyanLight,
    },
    {
      id: "precip",
      num: "3",
      name: "Precipitation",
      icon: "🌧️",
      desc: "Rain & snow fall",
      color: THEME.colors.waterBlue,
      bg: THEME.colors.waterBlueLight,
    },
    {
      id: "collect",
      num: "4",
      name: "Collection",
      icon: "🌊",
      desc: "Lakes & oceans pool",
      color: THEME.colors.plantGreenDark,
      bg: THEME.colors.plantGreenLight,
    },
  ];

  return (
    <SceneContainer
      topic="The Water Cycle"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle="Key Takeaway: The Endless Loop"
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
          {/* Top Header */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: THEME.colors.textPrimary }}>
                A Perpetual Planetary Cycle
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                Water moves between Earth's surface and the atmosphere continuously
              </div>
            </div>
            <AnimatedBadge
              label="Endless Cycle"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
            />
          </div>

          {/* Central Circular Cycle Graph (Interconnecting All 4 Stages) */}
          <div
            style={{
              position: "relative",
              width: 580,
              height: 440,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Circular interconnecting arrows */}
            <svg
              width="500"
              height="400"
              viewBox="0 0 500 400"
              style={{ position: "absolute" }}
            >
              {/* Outer circular guide */}
              <circle
                cx="250"
                cy="200"
                r="150"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="10"
                strokeDasharray="16 12"
              />
              {/* Animated active path connecting stages */}
              <path
                d="M 250 50 A 150 150 0 0 1 400 200"
                fill="none"
                stroke={activeStage >= 1 ? THEME.colors.condensationCyan : "#CBD5E1"}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 400 200 A 150 150 0 0 1 250 350"
                fill="none"
                stroke={activeStage >= 2 ? THEME.colors.waterBlue : "#CBD5E1"}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 250 350 A 150 150 0 0 1 100 200"
                fill="none"
                stroke={activeStage >= 3 ? THEME.colors.plantGreenDark : "#CBD5E1"}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 100 200 A 150 150 0 0 1 250 50"
                fill="none"
                stroke={THEME.colors.sunAmber}
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>

            {/* 4 Stage Nodes on the Circle */}
            {/* Top: 1. Evaporation */}
            <div
              style={{
                position: "absolute",
                top: 0,
                backgroundColor: activeStage === 0 ? stages[0].bg : "#FFFFFF",
                border: `3px solid ${activeStage === 0 ? stages[0].color : THEME.colors.border}`,
                borderRadius: 20,
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: activeStage === 0 ? "0 8px 20px rgba(217,119,6,0.25)" : "none",
                transform: activeStage === 0 ? "scale(1.08)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 24 }}>{stages[0].icon}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: stages[0].color }}>
                {stages[0].name}
              </span>
            </div>

            {/* Right: 2. Condensation */}
            <div
              style={{
                position: "absolute",
                right: 0,
                backgroundColor: activeStage === 1 ? stages[1].bg : "#FFFFFF",
                border: `3px solid ${activeStage === 1 ? stages[1].color : THEME.colors.border}`,
                borderRadius: 20,
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: activeStage === 1 ? "0 8px 20px rgba(2,132,199,0.25)" : "none",
                transform: activeStage === 1 ? "scale(1.08)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 24 }}>{stages[1].icon}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: stages[1].color }}>
                {stages[1].name}
              </span>
            </div>

            {/* Bottom: 3. Precipitation */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                backgroundColor: activeStage === 2 ? stages[2].bg : "#FFFFFF",
                border: `3px solid ${activeStage === 2 ? stages[2].color : THEME.colors.border}`,
                borderRadius: 20,
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: activeStage === 2 ? "0 8px 20px rgba(37,99,235,0.25)" : "none",
                transform: activeStage === 2 ? "scale(1.08)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 24 }}>{stages[2].icon}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: stages[2].color }}>
                {stages[2].name}
              </span>
            </div>

            {/* Left: 4. Collection */}
            <div
              style={{
                position: "absolute",
                left: 0,
                backgroundColor: activeStage === 3 ? stages[3].bg : "#FFFFFF",
                border: `3px solid ${activeStage === 3 ? stages[3].color : THEME.colors.border}`,
                borderRadius: 20,
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: activeStage === 3 ? "0 8px 20px rgba(4,120,87,0.25)" : "none",
                transform: activeStage === 3 ? "scale(1.08)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 24 }}>{stages[3].icon}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: stages[3].color }}>
                {stages[3].name}
              </span>
            </div>

            {/* Center Emblem: Recycled Water Journey */}
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                backgroundColor: "#EFF6FF",
                border: "2px solid #BFDBFE",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: 10,
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 28 }}>🔄</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.waterBlueDark, marginTop: 4 }}>
                Continuous Loop
              </span>
            </div>
          </div>

          {/* Strong Final Takeaway Card (reveals at cue) */}
          <div
            style={{
              opacity: summaryOpacity,
              transform: `scale(${summaryScale})`,
              width: "100%",
              backgroundColor: "#0F172A", // High contrast dark slate card
              borderRadius: 24,
              padding: "32px 36px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 16px 36px rgba(15,23,42,0.3)",
              transition: "transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#38BDF8",
                }}
              />
              <span
                style={{
                  color: "#94A3B8",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Key Educational Takeaway
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.25 }}>
              The Same Water Travels These Stages Again & Again
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#CBD5E1", lineHeight: 1.35 }}>
              Water is never lost on Earth — it constantly recycles between our oceans, soil, atmosphere, and living plants.
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
