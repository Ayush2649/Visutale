import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  SafeCalloutCard,
} from "../primitives/index.js";

export interface ComparisonProperty {
  label: string;
  value: string;
}

export interface ComparisonConceptData {
  title: string;
  badge?: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  properties: ComparisonProperty[];
}

export function validateGenericComparison(
  conceptA: ComparisonConceptData,
  conceptB: ComparisonConceptData
): void {
  if (!conceptA.title || !conceptB.title) {
    throw new Error("Generic comparison must contain two non-empty concept titles.");
  }
  if (conceptA.title.trim().toLowerCase() === conceptB.title.trim().toLowerCase()) {
    throw new Error(
      `Comparison concepts must be distinct: got '${conceptA.title}' for both concept A and concept B.`
    );
  }
  if (conceptA.properties.length === 0 || conceptB.properties.length === 0) {
    throw new Error("Each comparison concept must contain at least one property.");
  }
}

export const GenericComparison: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Educational Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Direct Comparison";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  // Extract concepts from scene objects or visualData
  const candA = scene.objects[0];
  const candB = scene.objects[1];

  const titleA = candA?.label ?? scene.onScreenText[0] ?? "Concept A";
  const titleB = candB?.label ?? scene.onScreenText[1] ?? "Concept B";

  const remainingObjects = scene.objects.slice(2);
  const propsA: ComparisonProperty[] = [];
  const propsB: ComparisonProperty[] = [];

  remainingObjects.forEach((obj, idx) => {
    const prop: ComparisonProperty = {
      label: obj.kind === "text" || obj.kind === "label" ? "Feature" : obj.kind,
      value: obj.label,
    };
    if (idx % 2 === 0) {
      propsA.push(prop);
    } else {
      propsB.push(prop);
    }
  });

  const conceptA: ComparisonConceptData = {
    title: titleA,
    badge: candA?.kind ?? "Concept A",
    icon: "🔹",
    color: "#38BDF8",
    bgColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.4)",
    properties:
      propsA.length > 0 ? propsA : [{ label: "Characteristic", value: `Key attributes of ${titleA}` }],
  };

  const conceptB: ComparisonConceptData = {
    title: titleB,
    badge: candB?.kind ?? "Concept B",
    icon: "🔸",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    properties:
      propsB.length > 0 ? propsB : [{ label: "Characteristic", value: `Key attributes of ${titleB}` }],
  };

  validateGenericComparison(conceptA, conceptB);

  const sprA = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, mass: 0.9 },
  });
  const sprB = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme="tech-dark" showGrid>
        <HUDHeaderPill
          icon="⚖️"
          category="HEAD-TO-HEAD COMPARISON"
          color="#818CF8"
          borderColor="rgba(129, 140, 248, 0.4)"
        />

        {/* Dual Pillars Comparison Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1140,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          {/* Concept A Pillar */}
          <div
            style={{
              flex: 1,
              height: 680,
              opacity: interpolate(sprA, [0, 1], [0, 1]),
              transform: `scale(${interpolate(sprA, [0, 1], [0.93, 1])})`,
              background: "rgba(15, 23, 42, 0.85)",
              border: `2px solid ${conceptA.borderColor}`,
              borderRadius: 26,
              padding: "32px 26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: `0 14px 35px rgba(0,0,0,0.4), 0 0 20px ${conceptA.color}22`,
              backdropFilter: "blur(14px)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 40 }}>{conceptA.icon}</span>
                {conceptA.badge && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: "rgba(56, 189, 248, 0.2)",
                      padding: "6px 14px",
                      borderRadius: 14,
                      color: conceptA.color,
                      border: `1px solid ${conceptA.borderColor}`,
                      textTransform: "uppercase",
                    }}
                  >
                    {conceptA.badge}
                  </span>
                )}
              </div>
              <h3 style={{ margin: "20px 0 0 0", fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2 }}>
                {conceptA.title}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {conceptA.properties.map((prop, idx) => (
                <div
                  key={`propA-${idx}`}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginTop: 4 }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concept B Pillar */}
          <div
            style={{
              flex: 1,
              height: 680,
              opacity: interpolate(sprB, [0, 1], [0, 1]),
              transform: `scale(${interpolate(sprB, [0, 1], [0.93, 1])})`,
              background: "rgba(15, 23, 42, 0.85)",
              border: `2px solid ${conceptB.borderColor}`,
              borderRadius: 26,
              padding: "32px 26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: `0 14px 35px rgba(0,0,0,0.4), 0 0 20px ${conceptB.color}22`,
              backdropFilter: "blur(14px)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 40 }}>{conceptB.icon}</span>
                {conceptB.badge && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: "rgba(245, 158, 11, 0.2)",
                      padding: "6px 14px",
                      borderRadius: 14,
                      color: conceptB.color,
                      border: `1px solid ${conceptB.borderColor}`,
                      textTransform: "uppercase",
                    }}
                  >
                    {conceptB.badge}
                  </span>
                )}
              </div>
              <h3 style={{ margin: "20px 0 0 0", fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2 }}>
                {conceptB.title}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {conceptB.properties.map((prop, idx) => (
                <div
                  key={`propB-${idx}`}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginTop: 4 }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="⚖️"
          title={title}
          description={subtitle}
          accentColor="#818CF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
