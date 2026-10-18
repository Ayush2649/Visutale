import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const PhotosynthesisTakeaway: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Photosynthesis",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Light + Water + CO2 = Life";
  const subtitle = scene.onScreenText[1] ?? "Nature's Solar Factory";

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
              label="Key Takeaways"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
            />
          </div>

          {/* Central Body: 3 Photosynthesis Takeaways */}
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
              backgroundColor: "#F0FDF4",
              border: `1.5px solid ${THEME.colors.plantGreenLight}`,
              borderRadius: 14,
              padding: "14px 20px",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 700,
              color: THEME.colors.plantGreenDark,
            }}
          >
            Photosynthesis powers Earth: fueling the plant kingdom and providing the air we breathe!
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

