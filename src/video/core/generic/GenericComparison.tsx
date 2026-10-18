import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "../contracts/visualTypes.js";

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
  const half = Math.ceil(remainingObjects.length / 2);
  const propsA: ComparisonProperty[] =
    remainingObjects.slice(0, half).map((o) => ({ label: o.kind, value: o.label }));
  const propsB: ComparisonProperty[] =
    remainingObjects.slice(half).map((o) => ({ label: o.kind, value: o.label }));

  const conceptA: ComparisonConceptData = {
    title: titleA,
    badge: candA?.kind ?? "Concept A",
    icon: "🔹",
    color: THEME.colors.waterBlueDeep,
    bgColor: "#F0F7FF",
    borderColor: "#BFDBFE",
    properties:
      propsA.length > 0 ? propsA : [{ label: "Characteristic", value: `Key attributes of ${titleA}` }],
  };

  const conceptB: ComparisonConceptData = {
    title: titleB,
    badge: candB?.kind ?? "Concept B",
    icon: "🔸",
    color: "#581C87",
    bgColor: "#FAF5FF",
    borderColor: "#E9D5FF",
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
              label="Comparison"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
            />
          </div>
        </div>

        {/* Dual Cards Comparison Stage */}
        <div
          style={{
            flex: 1,
            padding: "16px 36px 32px 36px",
            display: "flex",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {/* Concept A Card */}
          <div
            style={{
              flex: 1,
              opacity: interpolate(sprA, [0, 1], [0, 1]),
              transform: `scale(${interpolate(sprA, [0, 1], [0.93, 1])})`,
              backgroundColor: conceptA.bgColor,
              border: `2px solid ${conceptA.borderColor}`,
              borderRadius: 24,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 36 }}>{conceptA.icon}</span>
                {conceptA.badge && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: "#FFFFFF",
                      padding: "4px 12px",
                      borderRadius: 12,
                      color: conceptA.color,
                      border: `1px solid ${conceptA.borderColor}`,
                    }}
                  >
                    {conceptA.badge}
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: "16px 0 0 0",
                  fontSize: 26,
                  fontWeight: 800,
                  color: conceptA.color,
                  lineHeight: 1.2,
                }}
              >
                {conceptA.title}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              {conceptA.properties.map((prop, idx) => (
                <div
                  key={`propA-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${conceptA.borderColor}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.textMuted }}>
                    {prop.label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: THEME.colors.textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concept B Card */}
          <div
            style={{
              flex: 1,
              opacity: interpolate(sprB, [0, 1], [0, 1]),
              transform: `scale(${interpolate(sprB, [0, 1], [0.93, 1])})`,
              backgroundColor: conceptB.bgColor,
              border: `2px solid ${conceptB.borderColor}`,
              borderRadius: 24,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 36 }}>{conceptB.icon}</span>
                {conceptB.badge && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: "#FFFFFF",
                      padding: "4px 12px",
                      borderRadius: 12,
                      color: conceptB.color,
                      border: `1px solid ${conceptB.borderColor}`,
                    }}
                  >
                    {conceptB.badge}
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: "16px 0 0 0",
                  fontSize: 26,
                  fontWeight: 800,
                  color: conceptB.color,
                  lineHeight: 1.2,
                }}
              >
                {conceptB.title}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              {conceptB.properties.map((prop, idx) => (
                <div
                  key={`propB-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${conceptB.borderColor}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.textMuted }}>
                    {prop.label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: THEME.colors.textPrimary,
                      marginTop: 2,
                    }}
                  >
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

