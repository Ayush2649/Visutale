import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { isEventActiveInScene } from "../../core/sharedAnimationUtilities.js";

export const StorageArchitectureDiagram: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Storage Architecture",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Storage Architecture";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const isSsdActive = isEventActiveInScene(scene, "obj-4-ssd-box", frame) || isEventActiveInScene(scene, "obj-storage-cabinet", frame);
  const isFilesActive = isEventActiveInScene(scene, "obj-4-files-container", frame) || isEventActiveInScene(scene, "obj-storage-capacity", frame);

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
              label="Storage Architecture"
              frame={frame}
              revealFrame={5}
              color="#6B21A8"
              bgColor="#F3E8FF"
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
              {/* SSD Drive Node */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#FAF5FF",
                  border: `2px solid ${isSsdActive ? "#7E22CE" : "#E9D5FF"}`,
                  borderRadius: 20,
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 6px 16px rgba(126,34,206,0.06)",
                }}
              >
                <span style={{ fontSize: 44 }}>💾</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#581C87" }}>
                  SSD / Hard Drive
                </span>
                <span style={{ fontSize: 16, color: "#7E22CE", textAlign: "center" }}>
                  Non-Volatile Storage Medium
                </span>
              </div>

              {/* Arrow */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 32, color: THEME.colors.textMuted }}>➔</span>
                <span style={{ fontSize: 13, color: THEME.colors.textMuted, fontWeight: 600 }}>Preserved</span>
              </div>

              {/* Stored Content Container */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  border: `2px solid ${isFilesActive ? THEME.colors.plantGreen : THEME.colors.border}`,
                  borderRadius: 20,
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: THEME.colors.textPrimary, marginBottom: 4 }}>
                  📁 Saved Content:
                </div>
                {["Operating System (OS)", "Photos & 4K Videos", "Installed Apps & Games", "User Documents"].map((f, i) => (
                  <div
                    key={`file-${i}`}
                    style={{
                      backgroundColor: "#F8FAFC",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: THEME.colors.textSecondary,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Volatile Persistence Banner */}
            <div
              style={{
                width: "100%",
                maxWidth: 800,
                backgroundColor: "#ECFDF5",
                border: "2px solid #6EE7B7",
                borderRadius: 16,
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 26 }}>🔒</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#065F46" }}>
                  Non-Volatile Persistence (Permanent)
                </div>
                <div style={{ fontSize: 16, color: "#047857", marginTop: 2 }}>
                  Safe archival storage; all data stays completely intact even when powered off for years.
                </div>
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

