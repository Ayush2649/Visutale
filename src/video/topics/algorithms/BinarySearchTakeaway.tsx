import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const BinarySearchTakeaway: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Binary Search Algorithm",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Key Takeaways";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  const summaryOpacity = interpolate(spr, [0, 1], [0, 1]);
  const summaryScale = interpolate(spr, [0, 1], [0.94, 1]);

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
              label="Algorithm Summary"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>

          {/* Central Body: 3 Binary Search Takeaways */}
          <div
            style={{
              opacity: summaryOpacity,
              transform: `scale(${summaryScale})`,
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 18,
              padding: "16px 0",
            }}
          >
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
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: item.color,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
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
                    padding: "4px 14px",
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

          {/* Bottom Memorable Summary Badge */}
          <div
            style={{
              width: "100%",
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
            Logarithmic efficiency turns billions of records into mere dozens of comparisons!
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

