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
  topic = "Key Takeaway",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isPhotosynthesis = topic.toLowerCase().includes("photosynthesis");
  const isWaterCycle = !isPhotosynthesis && (topic.toLowerCase().includes("water cycle") || (topic.toLowerCase().includes("water") && !topic.toLowerCase().includes("plant")));
  const isHardware = topic.toLowerCase().includes("ram") || topic.toLowerCase().includes("storage");
  const isAlgorithm = topic.toLowerCase().includes("binary") || topic.toLowerCase().includes("search");

  const title = scene.onScreenText[0] ?? "Key Takeaways";
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
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 6, maxWidth: 680 }}>
                {subtitle}
              </div>
            </div>
            <AnimatedBadge
              label="Summary"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>

          {/* Central Body: Topic Specific */}
          <div
            style={{
              opacity: summaryOpacity,
              transform: `scale(${summaryScale})`,
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
              padding: "16px 0",
            }}
          >
            {isWaterCycle ? (
              /* Water Cycle 4-Phase Closed Loop */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { num: "1", name: "Evaporation", desc: "Liquid water absorbs solar energy and rises as vapor", icon: "☀️", color: THEME.colors.sunAmber, bg: THEME.colors.sunAmberLight },
                  { num: "2", name: "Condensation", desc: "Cooling air condenses rising vapor into clouds", icon: "☁️", color: THEME.colors.condensationCyan, bg: THEME.colors.condensationCyanLight },
                  { num: "3", name: "Precipitation", desc: "Gravity pulls condensed rain and snow back to Earth", icon: "🌧️", color: THEME.colors.waterBlue, bg: THEME.colors.waterBlueLight },
                  { num: "4", name: "Collection", desc: "Runoff replenishes lakes, oceans, and aquifers", icon: "🌊", color: THEME.colors.plantGreenDark, bg: THEME.colors.plantGreenLight },
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
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: stg.color, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
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
            ) : isHardware ? (
              /* RAM vs Storage Mental Model Takeaway */
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div
                  style={{
                    backgroundColor: "#EFF6FF",
                    border: `2px solid ${THEME.colors.waterBlue}`,
                    borderRadius: 20,
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <div style={{ fontSize: 44 }}>🖥️</div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.waterBlueDeep }}>
                      RAM = Working Desk Space
                    </div>
                    <div style={{ fontSize: 17, color: THEME.colors.waterBlueDark, marginTop: 4 }}>
                      Lightning-fast working memory for apps you are actively running right now. Resets on restart.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#FAF5FF",
                    border: "2px solid #C084FC",
                    borderRadius: 20,
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <div style={{ fontSize: 44 }}>🗄️</div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#581C87" }}>
                      Storage = Bedroom Closet & Filing Cabinet
                    </div>
                    <div style={{ fontSize: 17, color: "#7E22CE", marginTop: 4 }}>
                      Massive, permanent long-term library for all your photos, games, documents, and the operating system.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: `1.5px solid ${THEME.colors.border}`,
                    borderRadius: 14,
                    padding: "14px 20px",
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: THEME.colors.textPrimary,
                  }}
                >
                  Rule of thumb: RAM gives you multitasking speed; Storage gives you file capacity!
                </div>
              </div>
            ) : isAlgorithm ? (
              /* Binary Search 3 Core Takeaways */
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  {
                    step: "1",
                    title: "Prerequisite: Input Must Be Sorted",
                    desc: "Binary search cannot discard intervals safely unless data is in strict ascending order.",
                    badge: "Requirement",
                    color: "#D97706",
                    bg: "#FEF3C7",
                    border: "#FDE68A",
                  },
                  {
                    step: "2",
                    title: "Divide & Conquer: Halve Range Every Step",
                    desc: "Checking the midpoint eliminates 50% of remaining candidates in a single comparison.",
                    badge: "Mechanism",
                    color: THEME.colors.waterBlue,
                    bg: "#EFF6FF",
                    border: "#BFDBFE",
                  },
                  {
                    step: "3",
                    title: "Logarithmic Scaling: O(log n) Efficiency",
                    desc: "Searches 1,000,000 items in ~20 steps; 1,000,000,000 items in only ~30 comparisons.",
                    badge: "Complexity",
                    color: THEME.colors.plantGreenDark,
                    bg: "#ECFDF5",
                    border: "#A7F3D0",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      backgroundColor: item.bg,
                      border: `2px solid ${item.border}`,
                      borderRadius: 18,
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: item.color,
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          fontWeight: 800,
                        }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 15, color: THEME.colors.textSecondary, marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        backgroundColor: "#FFFFFF",
                        color: item.color,
                        padding: "4px 12px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        border: `1px solid ${item.border}`,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : isPhotosynthesis ? (
              /* Photosynthesis Core Takeaways */
              <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
                {[
                  {
                    step: "1",
                    title: "Sunlight & Chlorophyll",
                    desc: "Chlorophyll inside chloroplasts captures light energy from the sun.",
                    badge: "Energy",
                    color: "#D97706",
                    bg: "#FEF3C7",
                    border: "#FDE68A",
                  },
                  {
                    step: "2",
                    title: "Raw Inputs: Water & CO2",
                    desc: "Roots draw water from soil while leaf pores absorb carbon dioxide from air.",
                    badge: "Inputs",
                    color: THEME.colors.waterBlue,
                    bg: "#EFF6FF",
                    border: "#BFDBFE",
                  },
                  {
                    step: "3",
                    title: "Vital Outputs: Glucose & Oxygen",
                    desc: "Produces glucose sugars to fuel plant growth and releases oxygen to support life.",
                    badge: "Outputs",
                    color: THEME.colors.plantGreenDark,
                    bg: "#ECFDF5",
                    border: "#A7F3D0",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      backgroundColor: item.bg,
                      border: `2px solid ${item.border}`,
                      borderRadius: 18,
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: item.color,
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          fontWeight: 800,
                        }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 15, color: THEME.colors.textSecondary, marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        backgroundColor: "#FFFFFF",
                        color: item.color,
                        padding: "4px 12px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        border: `1px solid ${item.border}`,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Generic Object-Driven Takeaways */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {scene.objects.map((obj, i) => (
                  <div
                    key={obj.id}
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: `2px solid ${THEME.colors.border}`,
                      borderRadius: 16,
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: THEME.colors.waterBlue, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>
                      {obj.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Card */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#1E293B",
              borderRadius: 18,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#F8FAFC" }}>
                {isWaterCycle ? "Earth's continuous natural engine" : isHardware ? "RAM for speed • Storage for space" : isAlgorithm ? "Divide & conquer at logarithmic scale" : isPhotosynthesis ? "Solar-powered engine sustaining life on Earth" : "Core takeaway summary"}
              </span>
            </div>
            <span style={{ fontSize: 16, color: "#94A3B8", fontWeight: 600 }}>
              Complete
            </span>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
