import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const RamStorageTakeaway: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "RAM vs Storage",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Key Takeaway";
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
              label="Hardware Summary"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>

          {/* Central Body: RAM vs Storage Mental Model Takeaway */}
          <div
            style={{
              opacity: summaryOpacity,
              transform: `scale(${summaryScale})`,
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
              padding: "16px 0",
            }}
          >
            {/* RAM Desk Card */}
            <div
              style={{
                backgroundColor: "#EFF6FF",
                border: `2px solid ${THEME.colors.waterBlue}`,
                borderRadius: 20,
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ fontSize: 44 }}>🖥️</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.colors.waterBlueDeep }}>
                  RAM = Working Desk Space
                </div>
                <div style={{ fontSize: 17, color: THEME.colors.waterBlueDark, marginTop: 4 }}>
                  Lightning-fast working memory for apps you are actively running right now. Resets on restart.
                </div>
              </div>
            </div>

            {/* Storage Cabinet Card */}
            <div
              style={{
                backgroundColor: "#FAF5FF",
                border: "2px solid #C084FC",
                borderRadius: 20,
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ fontSize: 44 }}>🗄️</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#581C87" }}>
                  Storage = Bedroom Closet & Filing Cabinet
                </div>
                <div style={{ fontSize: 17, color: "#7E22CE", marginTop: 4 }}>
                  Massive, permanent long-term library for all your photos, games, documents, and the operating system.
                </div>
              </div>
            </div>

            {/* Rule of Thumb Box */}
            <div
              style={{
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
              Rule of thumb: RAM gives you multitasking speed; Storage gives you file capacity!
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

