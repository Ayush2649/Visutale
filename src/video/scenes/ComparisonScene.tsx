import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CompiledScene } from "../../contracts/timeline.js";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";

export interface ComparisonSceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Progressive reveal animations
  const card1Spring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const card2Spring = spring({
    frame: Math.max(0, frame - 30), // Reveals 1s into scene
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const contrastSpring = spring({
    frame: Math.max(0, frame - 70), // Comparison highlight
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Check for specific event highlights
  const hasHighlightEvent = scene.events.some(
    (ev) => frame >= ev.startFrame && frame <= ev.endFrame && (ev.action === "highlight" || ev.action === "emphasize")
  );

  // Extract titles and labels from onScreenText or fallback to RAM vs Storage
  const titleA = scene.onScreenText[0] ?? "RAM (Active Memory)";
  const titleB = scene.onScreenText[1] ?? "Storage (SSD / Disk)";
  const headline = scene.purpose || "Comparing Working Memory vs Long-Term Storage";

  return (
    <SceneContainer
      topic="Computer Architecture"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={scene.onScreenText[2] ?? "Key Differences"}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        {/* Header section */}
        <div style={{ padding: "32px 40px 16px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 800,
                  color: THEME.colors.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                {headline.length > 55 ? headline.slice(0, 52) + "..." : headline}
              </h2>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: 22,
                  color: THEME.colors.textMuted,
                  fontWeight: 500,
                }}
              >
                Speed, volatility, and capacity compared
              </p>
            </div>
            <AnimatedBadge
              label="Comparison"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>
        </div>

        {/* Comparison Dual Cards */}
        <div
          style={{
            flex: 1,
            padding: "8px 40px 24px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            justifyContent: "center",
          }}
        >
          {/* Top Card: Concept A (RAM / Working Memory) */}
          <div
            style={{
              opacity: interpolate(card1Spring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(card1Spring, [0, 1], [24, 0])}px)`,
              backgroundColor: "#F0F7FF",
              border: `2px solid ${hasHighlightEvent ? THEME.colors.waterBlue : "#BFDBFE"}`,
              borderRadius: 24,
              padding: "24px 28px",
              boxShadow: "0 6px 16px rgba(37, 99, 235, 0.06)",
              transition: "border 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: THEME.colors.waterBlue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  ⚡
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: THEME.colors.waterBlueDeep }}>
                    {titleA}
                  </h3>
                  <span style={{ fontSize: 18, color: THEME.colors.waterBlueDark, fontWeight: 600 }}>
                    The Active Desk Analogy
                  </span>
                </div>
              </div>
              <span
                style={{
                  backgroundColor: "#DBEAFE",
                  color: THEME.colors.waterBlueDark,
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                Volatile
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
              <div style={{ backgroundColor: "#FFFFFF", padding: "10px 14px", borderRadius: 12, border: "1px solid #DBEAFE" }}>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, fontWeight: 600 }}>Speed</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>~50 GB/s (Ultra Fast)</div>
              </div>
              <div style={{ backgroundColor: "#FFFFFF", padding: "10px 14px", borderRadius: 12, border: "1px solid #DBEAFE" }}>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, fontWeight: 600 }}>Power Off</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#DC2626" }}>Resets Empty</div>
              </div>
              <div style={{ backgroundColor: "#FFFFFF", padding: "10px 14px", borderRadius: 12, border: "1px solid #DBEAFE" }}>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, fontWeight: 600 }}>Capacity</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>8 GB - 32 GB</div>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", width: "100%", height: 1, backgroundColor: THEME.colors.border }} />
            <div
              style={{
                position: "relative",
                backgroundColor: THEME.colors.surface,
                border: `2px solid ${THEME.colors.border}`,
                color: THEME.colors.textMuted,
                borderRadius: 20,
                padding: "4px 18px",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.1em",
              }}
            >
              VS
            </div>
          </div>

          {/* Bottom Card: Concept B (Storage / SSD / Long-term) */}
          <div
            style={{
              opacity: interpolate(card2Spring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(card2Spring, [0, 1], [24, 0])}px)`,
              backgroundColor: "#FAF5FF",
              border: `2px solid ${hasHighlightEvent ? "#9333EA" : "#E9D5FF"}`,
              borderRadius: 24,
              padding: "24px 28px",
              boxShadow: "0 6px 16px rgba(147, 51, 234, 0.06)",
              transition: "border 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#7E22CE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  💾
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#581C87" }}>
                    {titleB}
                  </h3>
                  <span style={{ fontSize: 18, color: "#7E22CE", fontWeight: 600 }}>
                    The Filing Cabinet Analogy
                  </span>
                </div>
              </div>
              <span
                style={{
                  backgroundColor: "#F3E8FF",
                  color: "#6B21A8",
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                Non-Volatile
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
              <div style={{ backgroundColor: "#FFFFFF", padding: "10px 14px", borderRadius: 12, border: "1px solid #F3E8FF" }}>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, fontWeight: 600 }}>Speed</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>~0.5 - 7 GB/s</div>
              </div>
              <div style={{ backgroundColor: "#FFFFFF", padding: "10px 14px", borderRadius: 12, border: "1px solid #F3E8FF" }}>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, fontWeight: 600 }}>Power Off</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.plantGreen }}>Saves Permanently</div>
              </div>
              <div style={{ backgroundColor: "#FFFFFF", padding: "10px 14px", borderRadius: 12, border: "1px solid #F3E8FF" }}>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, fontWeight: 600 }}>Capacity</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>512 GB - 2 TB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Takeaway bar */}
        <div
          style={{
            margin: "0 40px 28px 40px",
            backgroundColor: "#F8FAFC",
            border: `1.5px solid ${THEME.colors.border}`,
            borderRadius: 16,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: interpolate(contrastSpring, [0, 1], [0, 1]),
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: THEME.colors.textSecondary }}>
            💡 Rule of Thumb: RAM is your working desk; Storage is your bookshelf.
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.waterBlue }}>
            Active vs Archive
          </span>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

