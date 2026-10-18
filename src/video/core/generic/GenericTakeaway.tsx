import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "../contracts/visualTypes.js";

export const GenericTakeaway: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Key Takeaway",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Key Takeaways";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const takeawayItems =
    scene.objects.length > 0
      ? scene.objects
      : [
          { id: "tk-1", kind: "node" as const, label: scene.onScreenText[0] ?? "Core takeaway principle" },
          { id: "tk-2", kind: "node" as const, label: scene.onScreenText[1] ?? "Practical application" },
        ];

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
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
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                {subtitle}
              </div>
            </div>
            <AnimatedBadge
              label="Summary"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
            />
          </div>

          {/* Central Takeaway Cards */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              margin: "24px 0",
            }}
          >
            {takeawayItems.map((item, i) => {
              const cardSpr = spring({
                frame: Math.max(0, frame - 10 - i * 15),
                fps,
                config: { damping: 14, stiffness: 120 },
              });

              return (
                <div
                  key={item.id}
                  style={{
                    opacity: interpolate(cardSpr, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(cardSpr, [0, 1], [0.94, 1])})`,
                    backgroundColor: "#FFFFFF",
                    border: `2px solid ${THEME.colors.border}`,
                    borderRadius: 20,
                    padding: "22px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: THEME.colors.waterBlueLight,
                      color: THEME.colors.waterBlueDark,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textPrimary }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 2 }}>
                      Summary Point {i + 1} • {item.kind}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Banner */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#0F172A",
              borderRadius: 20,
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 26 }}>✨</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
                Core Takeaway Summary
              </span>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#94A3B8",
                letterSpacing: "0.04em",
              }}
            >
              COMPLETE
            </span>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

