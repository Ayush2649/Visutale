import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { isEventActiveInScene, getEventSpringProgress } from "../../core/sharedAnimationUtilities.js";

export const PhotosynthesisImpact: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Photosynthesis",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Food for Plants";
  const subtitle = scene.onScreenText[1] ?? "Air for Us";

  const isGrowthActive = isEventActiveInScene(scene, "obj-growth-icon", frame);
  const isReleaseActive = isEventActiveInScene(scene, "obj-release-arrow", frame);
  const isAtmosphereActive = isEventActiveInScene(scene, "obj-atmosphere-box", frame);

  const growthSpr = getEventSpringProgress(scene, "obj-growth-icon", frame, fps, 0);
  const releaseSpr = getEventSpringProgress(scene, "obj-release-arrow", frame, fps, 30);
  const atmosphereSpr = getEventSpringProgress(scene, "obj-atmosphere-box", frame, fps, 60);

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
              label="Dual Outcome"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
            />
          </div>
        </div>

        {/* Dual Impact Stage: Plant Fuel vs Earth Atmosphere */}
        <div
          style={{
            flex: 1,
            padding: "16px 40px 36px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          {/* Outcome 1: Plant Fuel & Physical Growth */}
          <div
            style={{
              flex: 1,
              backgroundColor: isGrowthActive ? "#ECFDF5" : "#FFFFFF",
              border: `2.5px solid ${isGrowthActive ? THEME.colors.plantGreenDark : THEME.colors.border}`,
              borderRadius: 24,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              boxShadow: isGrowthActive ? "0 8px 24px rgba(5,150,105,0.14)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: `scale(${interpolate(growthSpr, [0, 1], [0.96, 1])})`,
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: "#D1FAE5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
              }}
            >
              🌱
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.plantGreenDark }}>
                  1. Plant Fuel: Cellulose & Starch
                </span>
                <span
                  style={{
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Growth
                </span>
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: 17, color: THEME.colors.textSecondary, lineHeight: 1.4 }}>
                Glucose fuels metabolic energy for root expansion, stronger cellulose stems, lush green foliage, and sweet fruits.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {["Root Expansion", "Stems & Leaves", "Seeds & Flowers"].map((item, idx) => (
                  <span
                    key={`fuel-${idx}`}
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #A7F3D0",
                      padding: "4px 12px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#047857",
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Outcome 2: Oxygen Release into Atmosphere */}
          <div
            style={{
              flex: 1,
              backgroundColor: isAtmosphereActive ? "#F0FDFA" : "#FFFFFF",
              border: `2.5px solid ${isAtmosphereActive ? "#0891B2" : THEME.colors.border}`,
              borderRadius: 24,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              boxShadow: isAtmosphereActive ? "0 8px 24px rgba(8,145,178,0.14)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: `scale(${interpolate(atmosphereSpr, [0, 1], [0.96, 1])})`,
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: "#CFFAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
              }}
            >
              🌬️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#0E7490" }}>
                  2. Planet Air: Oxygen Byproduct
                </span>
                <span
                  style={{
                    backgroundColor: "#0891B2",
                    color: "#FFFFFF",
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Atmosphere
                </span>
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: 17, color: THEME.colors.textSecondary, lineHeight: 1.4 }}>
                Excess oxygen escapes through stomata into the atmosphere, sustaining aerobic respiration for animals and humans worldwide.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {["Atmospheric O₂", "Animal Respiration", "Global Biosphere"].map((item, idx) => (
                  <span
                    key={`air-${idx}`}
                    style={{
                      backgroundColor: "#ECFEFF",
                      border: "1px solid #A5F3FC",
                      padding: "4px 12px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0891B2",
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

