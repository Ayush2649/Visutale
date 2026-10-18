import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export interface ComparisonProperty {
  label: string;
  value: string;
}

export interface ComparisonConcept {
  title: string;
  analogyOrRole: string;
  badge: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  properties: ComparisonProperty[];
}

export const RamStorageComparison: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "RAM vs Storage",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDeskAnalogy =
    scene.sceneId.includes("desk") ||
    scene.objects.some((o) => o.label.includes("Desk") || o.id.includes("desk"));

  const isStorageCabinet =
    scene.sceneId.includes("storage-cabinet") ||
    scene.sceneId.includes("cabinet") ||
    scene.objects.some((o) => o.label.includes("Cabinet"));

  const isVolatilityContrast =
    scene.sceneId.includes("volatil") ||
    scene.onScreenText.some((t) => t.toLowerCase().includes("volatile"));

  const headline = isVolatilityContrast
    ? "Volatile vs Non-Volatile Memory"
    : isDeskAnalogy || isStorageCabinet
    ? "The Physical Analogy: Desk vs Filing Cabinet"
    : (scene.onScreenText[0] ?? "Direct Comparison");

  const titleA = isDeskAnalogy
    ? "RAM: Working Desk"
    : isVolatilityContrast
    ? "RAM: Volatile Memory"
    : "RAM (Active Memory)";

  const titleB = isDeskAnalogy || isStorageCabinet
    ? "Storage: Filing Cabinet"
    : isVolatilityContrast
    ? "Storage: Non-Volatile"
    : "Storage (SSD / Disk)";

  const conceptA: ComparisonConcept = {
    title: titleA,
    analogyOrRole: isDeskAnalogy ? "Active Workspace (The Desk)" : "Fast Multitasking State",
    badge: "Volatile",
    icon: "⚡",
    color: THEME.colors.waterBlueDeep,
    bgColor: "#F0F7FF",
    borderColor: "#BFDBFE",
    properties: [
      { label: "Primary Role", value: "Holds open apps & active data" },
      { label: "Access Speed", value: "~50 GB/s (Ultra-Fast Direct Link)" },
      { label: "On Power Off", value: "Resets empty when device shuts down" },
    ],
  };

  const conceptB: ComparisonConcept = {
    title: titleB,
    analogyOrRole: isDeskAnalogy || isStorageCabinet ? "Long-Term Archive (Filing Cabinet)" : "Permanent File Storage",
    badge: "Non-Volatile",
    icon: "💾",
    color: "#581C87",
    bgColor: "#FAF5FF",
    borderColor: "#E9D5FF",
    properties: [
      { label: "Primary Role", value: "Saves photos, videos, apps & OS" },
      { label: "Capacity", value: "128 GB - 2 TB (Large Volume)" },
      { label: "On Power Off", value: "Retains all data safely forever" },
    ],
  };

  const sprA = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const sprB = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={headline}
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
                {headline}
              </h2>
              <p style={{ margin: "8px 0 0 0", fontSize: 22, color: THEME.colors.textMuted, fontWeight: 500 }}>
                {scene.onScreenText[1] ?? scene.purpose}
              </p>
            </div>
            <AnimatedBadge
              label="Hardware Comparison"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>
        </div>

        {/* 2-Column Comparison Stage */}
        <div
          style={{
            flex: 1,
            padding: "16px 36px 36px 36px",
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {/* Concept A Card (RAM) */}
          <div
            style={{
              flex: 1,
              backgroundColor: conceptA.bgColor,
              border: `2.5px solid ${conceptA.borderColor}`,
              borderRadius: 24,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: interpolate(sprA, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(sprA, [0, 1], [24, 0])}px)`,
              boxShadow: "0 8px 24px rgba(37,99,235,0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 38 }}>{conceptA.icon}</span>
                <span
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: conceptA.color,
                    padding: "4px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    border: `1.5px solid ${conceptA.borderColor}`,
                  }}
                >
                  {conceptA.badge}
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: conceptA.color }}>
                  {conceptA.title}
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted, marginTop: 4, fontWeight: 600 }}>
                  {conceptA.analogyOrRole}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {conceptA.properties.map((prop, idx) => (
                <div
                  key={`prop-a-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.textMuted }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 2 }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concept B Card (Storage) */}
          <div
            style={{
              flex: 1,
              backgroundColor: conceptB.bgColor,
              border: `2.5px solid ${conceptB.borderColor}`,
              borderRadius: 24,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: interpolate(sprB, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(sprB, [0, 1], [24, 0])}px)`,
              boxShadow: "0 8px 24px rgba(126,34,206,0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 38 }}>{conceptB.icon}</span>
                <span
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: conceptB.color,
                    padding: "4px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    border: `1.5px solid ${conceptB.borderColor}`,
                  }}
                >
                  {conceptB.badge}
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: conceptB.color }}>
                  {conceptB.title}
                </div>
                <div style={{ fontSize: 16, color: THEME.colors.textMuted, marginTop: 4, fontWeight: 600 }}>
                  {conceptB.analogyOrRole}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {conceptB.properties.map((prop, idx) => (
                <div
                  key={`prop-b-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.textMuted }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 2 }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

