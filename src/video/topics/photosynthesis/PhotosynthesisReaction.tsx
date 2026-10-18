import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { isEventActiveInScene, getEventSpringProgress } from "../../core/sharedAnimationUtilities.js";

export const PhotosynthesisReaction: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Photosynthesis",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "The Solar Recipe";
  const subtitle = scene.onScreenText[1] ?? "Produces Glucose + Oxygen";

  const isReactionActive = isEventActiveInScene(scene, "obj-reaction-container", frame);
  const isInputsActive = isEventActiveInScene(scene, "obj-inputs-node", frame);
  const isGlucoseActive = isEventActiveInScene(scene, "obj-glucose-node", frame);
  const isOxygenActive = isEventActiveInScene(scene, "obj-oxygen-node", frame);

  const reactionSpr = getEventSpringProgress(scene, "obj-reaction-container", frame, fps, 0);
  const inputsSpr = getEventSpringProgress(scene, "obj-inputs-node", frame, fps, 20);
  const glucoseSpr = getEventSpringProgress(scene, "obj-glucose-node", frame, fps, 50);
  const oxygenSpr = getEventSpringProgress(scene, "obj-oxygen-node", frame, fps, 70);

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
              label="Chemical Reaction"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
            />
          </div>
        </div>

        {/* Reaction Flow Stage */}
        <div
          style={{
            flex: 1,
            padding: "16px 36px 36px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Top Formula Banner */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#F8FAFC",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 18,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textPrimary }}>
              6 CO₂ + 6 H₂O
            </span>
            <span style={{ fontSize: 24, color: "#D97706", fontWeight: 900 }}>+ Light ➔</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.plantGreenDark }}>
              C₆H₁₂O₆ (Glucose)
            </span>
            <span style={{ fontSize: 24, color: THEME.colors.textMuted, fontWeight: 900 }}>+</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0284C7" }}>
              6 O₂ (Oxygen)
            </span>
          </div>

          {/* Three-Column Reaction Architecture (Inputs -> Solar Reaction -> Outputs) */}
          <div
            style={{
              width: "100%",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              padding: "20px 0",
            }}
          >
            {/* Column 1: Raw Inputs */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                opacity: interpolate(inputsSpr, [0, 1], [0.8, 1]),
                transform: `scale(${isInputsActive ? 1.02 : 1})`,
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0369A1",
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                RAW INPUTS
              </div>

              {/* Water Card */}
              <div
                style={{
                  backgroundColor: "#EFF6FF",
                  border: `2px solid ${isInputsActive ? THEME.colors.waterBlue : "#BFDBFE"}`,
                  borderRadius: 18,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <span style={{ fontSize: 32 }}>💧</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: THEME.colors.waterBlueDeep }}>
                    Water (H₂O)
                  </div>
                  <div style={{ fontSize: 13, color: THEME.colors.waterBlueDark, marginTop: 2 }}>
                    Drawn up by roots
                  </div>
                </div>
              </div>

              {/* CO2 Card */}
              <div
                style={{
                  backgroundColor: "#F0F9FF",
                  border: `2px solid ${isInputsActive ? "#0284C7" : "#BAE6FD"}`,
                  borderRadius: 18,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <span style={{ fontSize: 32 }}>💨</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0369A1" }}>
                    Carbon Dioxide (CO₂)
                  </div>
                  <div style={{ fontSize: 13, color: "#0284C7", marginTop: 2 }}>
                    Absorbed via stomata
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Central Reaction Chamber */}
            <div
              style={{
                width: 240,
                backgroundColor: isReactionActive ? "#ECFDF5" : "#FFFFFF",
                border: `3px solid ${isReactionActive ? THEME.colors.plantGreenDark : THEME.colors.plantGreenLight}`,
                borderRadius: 24,
                padding: "24px 18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 12,
                boxShadow: isReactionActive ? "0 10px 28px rgba(5,150,105,0.18)" : "none",
                transform: `scale(${interpolate(reactionSpr, [0, 1], [0.95, 1])})`,
              }}
            >
              <div style={{ fontSize: 44 }}>☀️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: THEME.colors.plantGreenDark }}>
                Solar Rearrangement
              </div>
              <div style={{ fontSize: 13, color: THEME.colors.textMuted, lineHeight: 1.4 }}>
                Photons break apart chemical bonds and recombine H, C, and O atoms.
              </div>
              <div
                style={{
                  backgroundColor: "#FEF3C7",
                  color: "#B45309",
                  padding: "6px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  marginTop: 6,
                }}
              >
                Energy Absorbed
              </div>
            </div>

            {/* Column 3: Vital Outputs */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: THEME.colors.plantGreenDark,
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                VITAL OUTPUTS
              </div>

              {/* Glucose Card */}
              <div
                style={{
                  backgroundColor: isGlucoseActive ? "#ECFDF5" : "#F0FDF4",
                  border: `2px solid ${isGlucoseActive ? THEME.colors.plantGreenDark : "#A7F3D0"}`,
                  borderRadius: 18,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transform: `scale(${isGlucoseActive ? 1.04 : 1})`,
                  transition: "all 0.2s ease",
                  opacity: interpolate(glucoseSpr, [0, 1], [0.8, 1]),
                }}
              >
                <span style={{ fontSize: 32 }}>🍯</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: THEME.colors.plantGreenDark }}>
                    Glucose (C₆H₁₂O₆)
                  </div>
                  <div style={{ fontSize: 13, color: "#047857", marginTop: 2 }}>
                    Energy food for plant growth
                  </div>
                </div>
              </div>

              {/* Oxygen Card */}
              <div
                style={{
                  backgroundColor: isOxygenActive ? "#ECFEFF" : "#F0FDFA",
                  border: `2px solid ${isOxygenActive ? "#0891B2" : "#A5F3FC"}`,
                  borderRadius: 18,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transform: `scale(${isOxygenActive ? 1.04 : 1})`,
                  transition: "all 0.2s ease",
                  opacity: interpolate(oxygenSpr, [0, 1], [0.8, 1]),
                }}
              >
                <span style={{ fontSize: 32 }}>🌬️</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0E7490" }}>
                    Oxygen (O₂)
                  </div>
                  <div style={{ fontSize: 13, color: "#0891B2", marginTop: 2 }}>
                    Released byproduct for air
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              border: `1.5px solid ${THEME.colors.border}`,
              borderRadius: 14,
              padding: "12px 20px",
              textAlign: "center",
              fontSize: 16,
              fontWeight: 700,
              color: THEME.colors.textSecondary,
            }}
          >
            Chloroplasts harness solar photons to convert simple inorganic matter into high-energy organic sugars.
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

