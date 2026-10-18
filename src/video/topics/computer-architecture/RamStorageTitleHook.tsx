import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const RamStorageTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "RAM vs Storage",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "RAM vs Storage";
  const subtitle = scene.onScreenText[1] ?? "The Core Difference";

  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8 },
  });

  const introOpacity = interpolate(introSpring, [0, 1], [0, 1]);
  const introScale = interpolate(introSpring, [0, 1], [0.95, 1]);

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
              label="Computer Architecture"
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
              Hardware Essentials
            </div>
          </div>

          {/* Prominent Title */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 52,
                fontWeight: 900,
                color: THEME.colors.textPrimary,
                letterSpacing: "-0.03em",
              }}
            >
              {title}
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
              {subtitle}
            </p>
          </div>

          {/* RAM vs Storage Device Spec Sheet Hero */}
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
                <div style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textPrimary }}>
                  Device Specification Sheet
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted }}>
                  Why do phones and laptops list two completely different numbers?
                </div>
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
                <div style={{ fontSize: 15, fontWeight: 700, color: THEME.colors.waterBlueDark }}>
                  RAM (Working Memory)
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.waterBlueDeep, marginTop: 4 }}>
                  8 GB RAM
                </div>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 4 }}>
                  Active multitasking speed
                </div>
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
                <div style={{ fontSize: 15, fontWeight: 700, color: "#7E22CE" }}>
                  Storage (Permanent Library)
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#581C87", marginTop: 4 }}>
                  128 GB Storage
                </div>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 4 }}>
                  Permanent file capacity
                </div>
              </div>
            </div>
          </div>

          {/* Bottom helper text */}
          <div style={{ fontSize: 18, color: THEME.colors.textMuted, fontWeight: 600 }}>
            {scene.objects.length} Core Elements • 60-90s Visual Explainer
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

