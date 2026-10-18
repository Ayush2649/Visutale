import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const SearchComparison: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Search Algorithm Comparison",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Linear Search vs Binary Search";
  const subtitle = scene.onScreenText[1] ?? "Sequential O(n) vs Logarithmic O(log n)";

  const conceptA = {
    title: "Linear Search",
    analogyOrRole: "Sequential Checking (One-by-One)",
    badge: "O(n) Steps",
    icon: "🔍",
    color: THEME.colors.waterBlueDeep,
    bgColor: "#F0F7FF",
    borderColor: "#BFDBFE",
    properties: [
      { label: "Search Method", value: "Checks each item sequentially" },
      { label: "Target 72 Checks", value: "Takes up to 7 comparisons" },
      { label: "Worst Case", value: "Checks all n elements (Slow)" },
    ],
  };

  const conceptB = {
    title: "Binary Search",
    analogyOrRole: "Divide & Conquer (Halving Range)",
    badge: "O(log n) Steps",
    icon: "⚡",
    color: THEME.colors.plantGreenDark,
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    properties: [
      { label: "Search Method", value: "Eliminates half at each midpoint" },
      { label: "Target 72 Checks", value: "Found in only 2 quick steps" },
      { label: "Worst Case", value: "Logarithmic: O(log n) (Ultra-Fast)" },
    ],
  };

  const sprA = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const sprB = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

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
              label="Complexity Comparison"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
            />
          </div>
        </div>

        {/* 2-Column Comparison Stage */}
        <div
          style={{
            flex: 1,
            padding: "16px 36px 36px 36px",
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {/* Concept A Card (Linear Search) */}
          <div
            style={{
              flex: 1,
              backgroundColor: conceptA.bgColor,
              border: `2.5px solid ${conceptA.borderColor}`,
              borderRadius: 24,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: interpolate(sprA, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(sprA, [0, 1], [24, 0])}px)`,
              boxShadow: "0 8px 24px rgba(37,99,235,0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 38 }}>{conceptA.icon}</span>
                <span
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: conceptA.color,
                    padding: "4px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    border: `1.5px solid ${conceptA.borderColor}`,
                  }}
                >
                  {conceptA.badge}
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: conceptA.color }}>
                  {conceptA.title}
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted, marginTop: 4, fontWeight: 600 }}>
                  {conceptA.analogyOrRole}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {conceptA.properties.map((prop, idx) => (
                <div
                  key={`prop-a-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.textMuted }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 2 }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concept B Card (Binary Search) */}
          <div
            style={{
              flex: 1,
              backgroundColor: conceptB.bgColor,
              border: `2.5px solid ${conceptB.borderColor}`,
              borderRadius: 24,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: interpolate(sprB, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(sprB, [0, 1], [24, 0])}px)`,
              boxShadow: "0 8px 24px rgba(16,185,129,0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 38 }}>{conceptB.icon}</span>
                <span
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: conceptB.color,
                    padding: "4px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    border: `1.5px solid ${conceptB.borderColor}`,
                  }}
                >
                  {conceptB.badge}
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: conceptB.color }}>
                  {conceptB.title}
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted, marginTop: 4, fontWeight: 600 }}>
                  {conceptB.analogyOrRole}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {conceptB.properties.map((prop, idx) => (
                <div
                  key={`prop-b-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.textMuted }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 2 }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

