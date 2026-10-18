import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

const ARRAY = [4, 9, 15, 23, 38, 56, 72, 85, 94];
const TARGET = 72;

export const BinarySearchStepSequence: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Binary Search Algorithm",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isExplicitStep1 =
    scene.sceneId.includes("first") || scene.sceneId.includes("step-1") || scene.sceneId.includes("step1");
  const isExplicitStep2 =
    scene.sceneId.includes("second") || scene.sceneId.includes("step-2") || scene.sceneId.includes("step2");
  const isExplicitStep3 =
    scene.sceneId.includes("third") || scene.sceneId.includes("step-3") || scene.sceneId.includes("step3");

  let step = 1;
  if (isExplicitStep1) {
    step = 1;
  } else if (isExplicitStep2 || isExplicitStep3) {
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

          {/* Main Array Elements */}
          <div
            style={{
              display: "flex",
              gap: 8,
              width: "100%",
              maxWidth: 820,
              justifyContent: "space-between",
            }}
          >
            {ARRAY.map((num, idx) => {
              const isDiscarded = idx < low || idx > high;
              const isMid = idx === mid;
              const isFound = isMid && step === 3;

              let bg: string = "#FFFFFF";
              let border: string = `2px solid ${THEME.colors.border}`;
              let textColor: string = THEME.colors.textPrimary;

              if (isDiscarded) {
                bg = "#F1F5F9";
                border = "2px dashed #CBD5E1";
                textColor = "#94A3B8";
              } else if (isFound) {
                bg = THEME.colors.plantGreenLight;
                border = `3px solid ${THEME.colors.plantGreen}`;
                textColor = THEME.colors.plantGreenDark;
              } else if (isMid) {
                bg = THEME.colors.sunAmberLight;
                border = `3px solid ${THEME.colors.sunAmber}`;
                textColor = "#B45309";
              } else {
                bg = "#EFF6FF";
                border = `2px solid #BFDBFE`;
                textColor = THEME.colors.waterBlueDeep;
              }

              const scale = isFound ? interpolate(matchPulse, [0, 1], [1, 1.12]) : isMid ? 1.05 : 1;

              return (
                <div
                  key={`arr-${idx}`}
                  style={{
                    flex: 1,
                    height: 90,
                    backgroundColor: bg,
                    border,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    transform: `scale(${scale})`,
                    transition: "all 0.3s ease",
                    boxShadow: isFound
                      ? "0 10px 24px rgba(16,185,129,0.3)"
                      : isMid
                      ? "0 8px 16px rgba(245,158,11,0.2)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 800, color: textColor }}>
                    {num}
                  </span>
                  <span style={{ fontSize: 13, color: isDiscarded ? "#94A3B8" : THEME.colors.textMuted, marginTop: 4 }}>
                    [{idx}]
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Step Explanation Card */}
          <div
            style={{
              marginTop: 32,
              width: "100%",
              maxWidth: 780,
              backgroundColor: step === 3 ? "#ECFDF5" : "#F8FAFC",
              border: `2px solid ${step === 3 ? "#A7F3D0" : THEME.colors.border}`,
              borderRadius: 20,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              boxShadow: "0 6px 16px rgba(15,23,42,0.03)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: step === 3 ? THEME.colors.plantGreen : THEME.colors.waterBlue,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {step === 3 ? "✓" : `S${step}`}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: THEME.colors.textPrimary }}>
                {comparisonText}
              </div>
              <div style={{ fontSize: 16, color: THEME.colors.textSecondary, marginTop: 4 }}>
                {actionText}
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

