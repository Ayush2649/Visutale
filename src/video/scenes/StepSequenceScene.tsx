import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CompiledScene } from "../../contracts/timeline.js";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";

export interface StepSequenceSceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
  topic?: string;
}

// Trusted deterministic binary search dataset
const ARRAY = [4, 9, 15, 23, 38, 56, 72, 85, 94];
const TARGET = 72;

export const StepSequenceScene: React.FC<StepSequenceSceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Algorithm: Binary Search",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isExplicitStep1 = scene.sceneId.includes("first") || scene.sceneId.includes("step-1") || scene.sceneId.includes("step1");
  const isExplicitStep2 = scene.sceneId.includes("second") || scene.sceneId.includes("step-2") || scene.sceneId.includes("step2");
  const isExplicitStep3 = scene.sceneId.includes("third") || scene.sceneId.includes("step-3") || scene.sceneId.includes("step3");

  let step = 1;
  if (isExplicitStep1) {
    step = 1;
  } else if (isExplicitStep2 || isExplicitStep3) {
    // If in second step, start by showing the narrowed range and confirm match
    step = frame < 60 ? 2 : 3;
  } else {
    step = frame < 90 ? 1 : frame < 180 ? 2 : 3;
  }

  let low = 0;
  let high = 8;
  let mid = 4;
  let comparisonText = `Check midpoint index 4 (Value: 38) vs Target ${TARGET}`;
  let actionText = `Target ${TARGET} > 38 → Discard left half [4, 9, 15, 23, 38]`;

  if (step === 2) {
    low = 5;
    high = 8;
    mid = 6;
    comparisonText = `Narrowed range to indices [5..8]. New Mid = 6 (Value: 72)`;
    actionText = `Comparing array[6] (72) with Target (${TARGET}) ...`;
  } else if (step === 3) {
    low = 5;
    high = 8;
    mid = 6;
    comparisonText = `Match Confirmed! array[6] === ${TARGET}`;
    actionText = `Binary Search Completed in O(log n) steps!`;
  }

  const matchPulse = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={scene.onScreenText[0] ?? "Binary Search Step"}
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
                Binary Search in Action
              </h2>
              <p style={{ margin: "6px 0 0 0", fontSize: 22, color: THEME.colors.textMuted, fontWeight: 500 }}>
                Finding Target: <strong style={{ color: THEME.colors.waterBlue }}>{TARGET}</strong> in sorted array
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span
                style={{
                  backgroundColor: "#FEF3C7",
                  color: "#B45309",
                  border: "1.5px solid #FDE68A",
                  borderRadius: 16,
                  padding: "6px 16px",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Requires Sorted Input
              </span>
              <AnimatedBadge
                label="O(log n)"
                frame={frame}
                revealFrame={5}
                color={THEME.colors.plantGreenDark}
                bgColor={THEME.colors.plantGreenLight}
              />
            </div>
          </div>
        </div>

        {/* Array Visualization Area */}
        <div
          style={{
            flex: 1,
            padding: "20px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Pointers: Low, Mid, High indicators */}
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              position: "relative",
              height: 36,
            }}
          >
            {ARRAY.map((val, idx) => {
              const isLow = idx === low;
              const isHigh = idx === high;
              const isMid = idx === mid;

              return (
                <div
                  key={`ptr-${idx}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  {isMid && (
                    <span
                      style={{
                        backgroundColor: step === 3 ? THEME.colors.plantGreen : THEME.colors.sunAmber,
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {step === 3 ? "FOUND" : "MID"}
                    </span>
                  )}
                  {isLow && !isMid && (
                    <span style={{ color: THEME.colors.waterBlue, fontSize: 13, fontWeight: 800 }}>
                      LOW
                    </span>
                  )}
                  {isHigh && !isMid && (
                    <span style={{ color: THEME.colors.waterBlue, fontSize: 13, fontWeight: 800 }}>
                      HIGH
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Number Tiles Row */}
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              display: "flex",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {ARRAY.map((val, idx) => {
              const isEliminated = idx < low || idx > high;
              const isMid = idx === mid;
              const isMatch = step === 3 && idx === 6;

              let tileBg: string = "#FFFFFF";
              let tileBorder: string = THEME.colors.border;
              let textColor: string = THEME.colors.textPrimary;
              let scale = 1;

              if (isEliminated) {
                tileBg = "#F1F5F9";
                tileBorder = "#E2E8F0";
                textColor = "#94A3B8";
              } else if (isMatch) {
                tileBg = "#ECFDF5";
                tileBorder = THEME.colors.plantGreen;
                textColor = THEME.colors.plantGreenDark;
                scale = interpolate(matchPulse, [0, 1], [1, 1.15]);
              } else if (isMid) {
                tileBg = "#FEF3C7";
                tileBorder = THEME.colors.sunAmber;
                textColor = "#92400E";
                scale = 1.08;
              }

              return (
                <div
                  key={`val-${idx}`}
                  style={{
                    flex: 1,
                    height: 78,
                    borderRadius: 16,
                    backgroundColor: tileBg,
                    border: `2px solid ${tileBorder}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${scale})`,
                    boxShadow: isMid ? "0 8px 18px rgba(217, 119, 6, 0.15)" : "0 2px 6px rgba(15,23,42,0.03)",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 800, color: textColor }}>{val}</span>
                  <span style={{ fontSize: 13, color: THEME.colors.textMuted, marginTop: 2 }}>[{idx}]</span>
                  {isEliminated && (
                    <div
                      style={{
                        position: "absolute",
                        width: "80%",
                        height: 2,
                        backgroundColor: "#CBD5E1",
                        transform: "rotate(-45deg)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Step Card */}
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              marginTop: 36,
              backgroundColor: "#F8FAFC",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 20,
              padding: "24px 28px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span
                style={{
                  backgroundColor: THEME.colors.waterBlueLight,
                  color: THEME.colors.waterBlueDark,
                  borderRadius: 10,
                  padding: "4px 14px",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                Step {step} of 3
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: THEME.colors.textMuted }}>
                Active Search Window: [{low} ... {high}]
              </span>
            </div>

            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.colors.textPrimary, marginBottom: 8 }}>
              {comparisonText}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: step === 3 ? THEME.colors.plantGreenDark : THEME.colors.textSecondary,
              }}
            >
              {actionText}
            </div>
          </div>
        </div>

        {/* Footer takeaway */}
        <div
          style={{
            margin: "0 40px 28px 40px",
            backgroundColor: "#EFF6FF",
            border: "1.5px solid #BFDBFE",
            borderRadius: 16,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: THEME.colors.waterBlueDeep }}>
            ⚡ Halves search space each step: 1,000,000 items checked in just ~20 comparisons!
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.waterBlue }}>
            Logarithmic Time
          </span>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
