import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { isEventActiveInScene } from "../../core/sharedAnimationUtilities.js";

const ARRAY = [4, 9, 15, 23, 38, 56, 72, 85, 94];

export const SortedArrayPrerequisite: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Binary Search Algorithm",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Prerequisite: Sorted Input";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const isBadgeActive =
    isEventActiveInScene(scene, "obj-sorted-badge", frame) ||
    isEventActiveInScene(scene, "sorted-badge", frame);

  const badgeSpr = spring({
    frame,
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
              label="Mandatory Prerequisite"
              frame={frame}
              revealFrame={5}
              color="#92400E"
              bgColor="#FEF3C7"
            />
          </div>
        </div>

        {/* Visual Stage */}
        <div
          style={{
            flex: 1,
            padding: "24px 36px 36px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 36,
          }}
        >
          {/* Mandatory Rule Banner */}
          <div
            style={{
              backgroundColor: "#FEF3C7",
              border: "2px solid #F59E0B",
              borderRadius: 18,
              padding: "16px 32px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 6px 18px rgba(245, 158, 11, 0.15)",
              transform: `scale(${isBadgeActive ? 1.05 : 1})`,
              transition: "transform 0.2s ease",
            }}
          >
            <span style={{ fontSize: 28 }}>⚠️</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>
              MANDATORY RULE: Input List Must Be Sorted
            </span>
          </div>

          {/* 9 Sorted Array Tiles */}
          <div style={{ width: "100%", maxWidth: 840, display: "flex", gap: 10, justifyContent: "center" }}>
            {ARRAY.map((num, i) => {
              const isTarget = num === 72;
              return (
                <div
                  key={`sort-tile-${i}`}
                  style={{
                    flex: 1,
                    height: 96,
                    backgroundColor: isTarget ? "#EFF6FF" : "#FFFFFF",
                    border: `2px solid ${isTarget ? THEME.colors.waterBlue : THEME.colors.border}`,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isTarget ? "0 4px 14px rgba(37,99,235,0.18)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: isTarget ? THEME.colors.waterBlue : THEME.colors.textPrimary,
                    }}
                  >
                    {num}
                  </span>
                  <span style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 4 }}>
                    [{i}]
                  </span>
                </div>
              );
            })}
          </div>

          {/* Target Indicator Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 18,
              padding: "18px 36px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: THEME.colors.waterBlue }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: THEME.colors.textPrimary }}>
              Target to Find: <strong style={{ color: THEME.colors.waterBlue }}>72</strong>
            </span>
            <span style={{ fontSize: 18, color: THEME.colors.textMuted }}>
              (Present at Index 6)
            </span>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

