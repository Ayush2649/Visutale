import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { CompiledScene } from "../../contracts/timeline.js";

export interface SceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
  topic?: string;
}

export const TitleHookScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Educational Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isPhotosynthesis = topic.toLowerCase().includes("photosynthesis");
  const isWaterCycle = !isPhotosynthesis && (topic.toLowerCase().includes("water cycle") || (topic.toLowerCase().includes("water") && !topic.toLowerCase().includes("plant")));
  const isHardware = topic.toLowerCase().includes("ram") || topic.toLowerCase().includes("storage");
  const isAlgorithm = topic.toLowerCase().includes("binary") || topic.toLowerCase().includes("search");

  // Entrance spring from frame 0 - title is immediately prominent
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8 },
  });

  const introOpacity = interpolate(introSpring, [0, 1], [0, 1]);
  const introScale = interpolate(introSpring, [0, 1], [0.95, 1]);

  // Target event cue emphasis
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
  const waveShift = (frame * 3) % 120;

  const displayTitle = scene.onScreenText[0] ?? topic;
  const displaySubtitle = scene.onScreenText[1] ?? scene.purpose;
  const badgeLabel = scene.onScreenText[2] ?? (isWaterCycle ? "Earth Science" : isHardware ? "Computer Architecture" : isAlgorithm ? "Algorithm" : isPhotosynthesis ? "Plant Biology" : "Core Concept");

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
            opacity: introOpacity,
            transform: `scale(${introScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            padding: "44px 36px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Top category badges */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <AnimatedBadge
              label={badgeLabel}
              frame={frame}
              revealFrame={0}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
              padding="6px 18px"
            />
            <div
              style={{
                backgroundColor: "#FEF3C7",
                color: "#B45309",
                border: "1.5px solid #FCD34D",
                padding: "6px 16px",
                borderRadius: 16,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {isWaterCycle ? "Continuous Natural Loop" : isHardware ? "RAM vs Storage" : isAlgorithm ? "Divide & Conquer" : isPhotosynthesis ? "Solar Powered Energy" : "Quick Explainer"}
            </div>
          </div>

          {/* Prominent Title - derived from actual approved topic & scene text */}
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

          {/* Hero Visual Area: Topic-Specific */}
          {isWaterCycle ? (
            /* Water Droplet Orbit for Water Cycle only */
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
              <svg width="460" height="460" viewBox="0 0 460 460" style={{ position: "absolute", transform: `rotate(${cycleRotation}deg)` }}>
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
                <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.04em" }}>WATER CYCLE</div>
              </div>
            </div>
          ) : isHardware ? (
            /* RAM vs Storage Device Spec Sheet Hero */
            <div
              style={{
                width: "100%",
                maxWidth: 680,
                backgroundColor: "#FFFFFF",
                border: `2px solid ${THEME.colors.border}`,
                borderRadius: 24,
                padding: "32px 36px",
                boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>📱</span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textPrimary }}>Device Specification Sheet</div>
                  <div style={{ fontSize: 16, color: THEME.colors.textMuted }}>Why do phones and laptops list two different numbers?</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#EFF6FF",
                    border: `2px solid ${THEME.colors.waterBlue}`,
                    borderRadius: 16,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: THEME.colors.waterBlueDark }}>RAM (Short-Term)</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.waterBlueDeep, marginTop: 4 }}>8 GB RAM</div>
                  <div style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 4 }}>Active task speed</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#FAF5FF",
                    border: "2px solid #C084FC",
                    borderRadius: 16,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#7E22CE" }}>Storage (Long-Term)</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#581C87", marginTop: 4 }}>128 GB Storage</div>
                  <div style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 4 }}>Permanent file space</div>
                </div>
              </div>
            </div>
          ) : isAlgorithm ? (
            /* Binary Search Divide & Conquer Hero */
            <div
              style={{
                width: "100%",
                maxWidth: 680,
                backgroundColor: "#FFFFFF",
                border: `2px solid ${THEME.colors.border}`,
                borderRadius: 24,
                padding: "32px 36px",
                boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 36 }}>⚡</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.textPrimary }}>Divide & Conquer Algorithm</div>
                  <div style={{ fontSize: 16, color: THEME.colors.textMuted }}>Cuts search range in half at every step</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "center" }}>
                {[4, 9, 15, 23, 38, 56, 72, 85, 94].map((num, i) => (
                  <div
                    key={`hero-tile-${i}`}
                    style={{
                      flex: 1,
                      height: 64,
                      backgroundColor: num === 72 ? "#EFF6FF" : num === 38 ? "#FEF3C7" : "#F8FAFC",
                      border: `2px solid ${num === 72 ? THEME.colors.waterBlue : num === 38 ? THEME.colors.sunAmber : THEME.colors.border}`,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 800,
                      color: num === 72 ? THEME.colors.waterBlue : num === 38 ? "#B45309" : THEME.colors.textPrimary,
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ backgroundColor: "#FEF3C7", color: "#B45309", padding: "4px 14px", borderRadius: 8, fontSize: 14, fontWeight: 700 }}>
                  Midpoint: 38
                </span>
                <span style={{ backgroundColor: "#ECFDF5", color: THEME.colors.plantGreenDark, padding: "4px 14px", borderRadius: 8, fontSize: 14, fontWeight: 700 }}>
                  Target: 72 Found in 2 Steps
                </span>
              </div>
            </div>
          ) : isPhotosynthesis ? (
            /* Photosynthesis Energy Transformation Hero */
            <div
              style={{
                width: "100%",
                maxWidth: 720,
                backgroundColor: "#FFFFFF",
                border: `2px solid ${THEME.colors.plantGreen}`,
                borderRadius: 24,
                padding: "28px 24px",
                boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 36 }}>🌿</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.textPrimary }}>Solar Energy Transformation</div>
                  <div style={{ fontSize: 16, color: THEME.colors.textMuted }}>How plants make food from sunlight, water & air</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center", alignItems: "center" }}>
                <div style={{ flex: 1, backgroundColor: "#FEF3C7", border: "2px solid #FCD34D", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 26 }}>☀️</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#B45309", marginTop: 4 }}>Sunlight</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Light Energy</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#EFF6FF", border: `2px solid ${THEME.colors.waterBlue}`, borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 26 }}>💧</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: THEME.colors.waterBlueDeep, marginTop: 4 }}>Water</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Via Roots</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#F1F5F9", border: `2px solid ${THEME.colors.border}`, borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 26 }}>💨</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 4 }}>CO2</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>From Air</div>
                </div>
                <div style={{ fontSize: 22, color: THEME.colors.plantGreenDark, fontWeight: 900 }}>
                  ➔
                </div>
                <div style={{ flex: 1, backgroundColor: "#ECFDF5", border: "2px solid #A7F3D0", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 26 }}>🍃</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: THEME.colors.plantGreenDark, marginTop: 4 }}>Glucose</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Plant Food</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#ECFEFF", border: "2px solid #A5F3FC", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 26 }}>🌬️</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0E7490", marginTop: 4 }}>Oxygen</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textMuted }}>Released</div>
                </div>
              </div>
            </div>
          ) : (
            /* Generic Explainer Visual Objects */
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {scene.objects.map((obj) => (
                <div
                  key={obj.id}
                  style={{
                    backgroundColor: "#F1F5F9",
                    padding: "16px 24px",
                    borderRadius: 16,
                    fontSize: 20,
                    fontWeight: 700,
                    color: THEME.colors.textPrimary,
                  }}
                >
                  {obj.label}
                </div>
              ))}
            </div>
          )}

          {/* Bottom helper text */}
          <div style={{ fontSize: 18, color: THEME.colors.textMuted, fontWeight: 600 }}>
            {scene.objects.length} Core Elements • 60-90s Visual Explainer
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
