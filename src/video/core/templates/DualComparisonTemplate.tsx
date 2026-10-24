import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  SafeCalloutCard,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const DualComparisonTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Comparative Analysis",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Dual Comparison";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const objects = scene.objects;
  const comparison = visualData.comparison || {
    conceptA: {
      title: objects[0]?.label || "Concept Alpha",
      subtitle: "High Speed / Volatile",
      badge: "ACTIVE FOCUS",
      color: "#38BDF8",
      attributes: [
        { label: "LATENCY", value: "Ultra-low (Nanoseconds)" },
        { label: "PERSISTENCE", value: "Temporary State" },
        { label: "PURPOSE", value: "Immediate Execution" },
      ],
    },
    conceptB: {
      title: objects[1]?.label || "Concept Beta",
      subtitle: "Persistent / Bulk",
      badge: "STORAGE FOCUS",
      color: "#10B981",
      attributes: [
        { label: "CAPACITY", value: "High-volume (Gigabytes)" },
        { label: "PERSISTENCE", value: "Permanent Storage" },
        { label: "PURPOSE", value: "Long-term Retention" },
      ],
    },
  };

  const headerCategory = visualData.headerBadge?.category ?? "COMPARATIVE ARCHITECTURAL ANALYSIS";
  const headerIcon = visualData.headerBadge?.icon ?? "⚖️";
  const headerColor = visualData.headerBadge?.color ?? "#38BDF8";

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme={theme} showGrid>
        <HUDHeaderPill
          icon={headerIcon}
          category={headerCategory}
          color={headerColor}
          borderColor={`${headerColor}66`}
        />

        {/* Hero Visual Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            opacity: contentOpacity,
          }}
        >
          {/* Pillar A */}
          <div
            style={{
              flex: 1,
              height: 640,
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.98))",
              borderRadius: 32,
              border: `2px solid ${comparison.conceptA.color || "#38BDF8"}`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 25px ${comparison.conceptA.color || "#38BDF8"}22`,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span
                style={{
                  background: `${comparison.conceptA.color || "#38BDF8"}22`,
                  border: `1px solid ${comparison.conceptA.color || "#38BDF8"}`,
                  borderRadius: 10,
                  padding: "4px 12px",
                  color: comparison.conceptA.color || "#38BDF8",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {comparison.conceptA.badge || "CONCEPT A"}
              </span>
              <div style={{ color: "#F8FAFC", fontSize: 26, fontWeight: 800, marginTop: 12 }}>
                {comparison.conceptA.title}
              </div>
              <div style={{ color: "#94A3B8", fontSize: 16, marginTop: 4 }}>
                {comparison.conceptA.subtitle}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {comparison.conceptA.attributes.map((attr, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>{attr.label}</div>
                  <div style={{ color: "#F8FAFC", fontSize: 16, fontWeight: 700, marginTop: 2 }}>{attr.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VS Divider Badge */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.95)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 18,
              boxShadow: "0 0 20px rgba(0,0,0,0.8)",
              zIndex: 20,
            }}
          >
            VS
          </div>

          {/* Pillar B */}
          <div
            style={{
              flex: 1,
              height: 640,
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.98))",
              borderRadius: 32,
              border: `2px solid ${comparison.conceptB.color || "#10B981"}`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 25px ${comparison.conceptB.color || "#10B981"}22`,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span
                style={{
                  background: `${comparison.conceptB.color || "#10B981"}22`,
                  border: `1px solid ${comparison.conceptB.color || "#10B981"}`,
                  borderRadius: 10,
                  padding: "4px 12px",
                  color: comparison.conceptB.color || "#10B981",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {comparison.conceptB.badge || "CONCEPT B"}
              </span>
              <div style={{ color: "#F8FAFC", fontSize: 26, fontWeight: 800, marginTop: 12 }}>
                {comparison.conceptB.title}
              </div>
              <div style={{ color: "#94A3B8", fontSize: 16, marginTop: 4 }}>
                {comparison.conceptB.subtitle}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {comparison.conceptB.attributes.map((attr, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>{attr.label}</div>
                  <div style={{ color: "#F8FAFC", fontSize: 16, fontWeight: 700, marginTop: 2 }}>{attr.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="⚖️"
          category="COMPARISON PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
