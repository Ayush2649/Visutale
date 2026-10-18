import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { isEventActiveInScene, getEventSpringProgress } from "../../core/sharedAnimationUtilities.js";

export const RamArchitectureDiagram: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "RAM Architecture",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "RAM Hardware Architecture";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const isCpuActive = isEventActiveInScene(scene, "obj-3-cpu-node", frame);
  const isRamActive = isEventActiveInScene(scene, "obj-3-ram-chip", frame) || isEventActiveInScene(scene, "obj-ram-desk", frame);

  const spr = spring({
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
              label="Hardware Architecture"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>
        </div>

        {/* Dynamic Diagram Visual Stage */}
        <div
          style={{
            flex: 1,
            padding: "24px 36px 36px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 28,
              alignItems: "center",
              transform: `scale(${interpolate(spr, [0, 1], [0.95, 1])})`,
            }}
          >
            <div style={{ display: "flex", width: "100%", maxWidth: 800, gap: 24, alignItems: "center" }}>
              {/* CPU Node */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  border: `2px solid ${isCpuActive ? THEME.colors.waterBlue : THEME.colors.border}`,
                  borderRadius: 20,
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
                }}
              >
                <span style={{ fontSize: 40 }}>🔲</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.textPrimary }}>
                  CPU Processor
                </span>
                <span style={{ fontSize: 16, color: THEME.colors.textMuted, textAlign: "center" }}>
                  Executes instructions in nanoseconds
                </span>
              </div>

              {/* Ultra-Fast Bus Connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 160 }}>
                <div
                  style={{
                    height: 6,
                    width: "100%",
                    backgroundColor: THEME.colors.waterBlue,
                    borderRadius: 3,
                    boxShadow: "0 0 12px rgba(37,99,235,0.4)",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: THEME.colors.waterBlue }}>
                  ⚡ Ultra-Fast Link
                </span>
                <span style={{ fontSize: 12, color: THEME.colors.textMuted }}>~50 GB/s Direct Bus</span>
              </div>

              {/* RAM Chip Node */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#EFF6FF",
                  border: `2px solid ${isRamActive ? THEME.colors.waterBlue : "#93C5FD"}`,
                  borderRadius: 20,
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 6px 16px rgba(37,99,235,0.08)",
                }}
              >
                <span style={{ fontSize: 40 }}>⚡</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.waterBlueDeep }}>
                  RAM Chip
                </span>
                <span style={{ fontSize: 16, color: THEME.colors.waterBlueDark, textAlign: "center" }}>
                  Active Working State
                </span>
              </div>
            </div>

            {/* Volatility Warning Banner */}
            <div
              style={{
                width: "100%",
                maxWidth: 800,
                backgroundColor: "#FEF2F2",
                border: "2px solid #FCA5A5",
                borderRadius: 16,
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 26 }}>🔄</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#991B1B" }}>
                  Volatile Memory (Temporary)
                </div>
                <div style={{ fontSize: 16, color: "#B91C1C", marginTop: 2 }}>
                  Instant access while powered on; clears completely the moment device restarts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

