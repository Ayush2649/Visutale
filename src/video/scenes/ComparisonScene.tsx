import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CompiledScene } from "../../contracts/timeline.js";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";

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

export interface ComparisonSceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
  topic?: string;
}

export function validateComparisonData(conceptA: ComparisonConcept, conceptB: ComparisonConcept): void {
  if (!conceptA.title || !conceptB.title) {
    throw new Error("Comparison must contain two non-empty concept titles.");
  }
  if (conceptA.title.trim().toLowerCase() === conceptB.title.trim().toLowerCase()) {
    throw new Error(`Comparison concepts must be distinct: got '${conceptA.title}' for both.`);
  }
  if (conceptA.properties.length === 0 || conceptB.properties.length === 0) {
    throw new Error("Each comparison concept must contain at least one property.");
  }

  // Cross-domain contamination validation
  const isSearchComparison =
    conceptA.title.toLowerCase().includes("search") ||
    conceptB.title.toLowerCase().includes("search");

  if (isSearchComparison) {
    const allPropsText = [...conceptA.properties, ...conceptB.properties]
      .map((p) => `${p.label} ${p.value}`)
      .join(" ")
      .toLowerCase();

    if (
      allPropsText.includes("volatile") ||
      allPropsText.includes("50 gb/s") ||
      allPropsText.includes("filing cabinet") ||
      allPropsText.includes("ssd")
    ) {
      throw new Error("Cross-topic contamination: RAM/Storage hardware properties found in Search comparison.");
    }
  }

  const isRamStorageComparison =
    conceptA.title.toLowerCase().includes("ram") ||
    conceptA.title.toLowerCase().includes("desk") ||
    conceptB.title.toLowerCase().includes("storage") ||
    conceptB.title.toLowerCase().includes("cabinet");

  if (isRamStorageComparison) {
    const allPropsText = [...conceptA.properties, ...conceptB.properties]
      .map((p) => `${p.label} ${p.value}`)
      .join(" ")
      .toLowerCase();

    if (
      allPropsText.includes("o(log n)") ||
      allPropsText.includes("o(n)") ||
      allPropsText.includes("linear search") ||
      allPropsText.includes("binary search")
    ) {
      throw new Error("Cross-topic contamination: Search algorithm properties found in RAM/Storage comparison.");
    }
  }
}

export function resolveComparisonConcepts(scene: CompiledScene, topic?: string): {
  conceptA: ComparisonConcept;
  conceptB: ComparisonConcept;
  headline: string;
} {
  const isSearchTopic =
    (topic && topic.toLowerCase().includes("search")) ||
    scene.sceneId.includes("complexity") ||
    scene.onScreenText.some((t) => t.toLowerCase().includes("linear") || t.toLowerCase().includes("binary")) ||
    scene.objects.some((o) => o.label.toLowerCase().includes("linear") || o.label.toLowerCase().includes("binary"));

  const isRamTopic =
    (topic && (topic.toLowerCase().includes("ram") || topic.toLowerCase().includes("storage"))) ||
    scene.sceneId.includes("ram") ||
    scene.sceneId.includes("storage") ||
    scene.sceneId.includes("desk") ||
    scene.objects.some((o) => o.label.toLowerCase().includes("ram") || o.label.toLowerCase().includes("storage"));

  let conceptA: ComparisonConcept;
  let conceptB: ComparisonConcept;
  let headline = scene.purpose || "Direct Comparison";

  if (isSearchTopic) {
    headline = "Search Efficiency: Linear vs Binary Search";
    const titleA = scene.objects.find((o) => o.id.includes("linear"))?.label ?? scene.onScreenText[0] ?? "Linear Search";
    const titleB = scene.objects.find((o) => o.id.includes("binary"))?.label ?? scene.onScreenText[1] ?? "Binary Search";

    conceptA = {
      title: titleA,
      analogyOrRole: "Sequential Checking (One-by-One)",
      badge: "O(n) Steps",
      icon: "🔍",
      color: THEME.colors.waterBlueDeep,
      bgColor: "#F0F7FF",
      borderColor: "#BFDBFE",
      properties: [
        { label: "Search Method", value: "Checks each item sequentially" },
        { label: "Target 72 Checks", value: "Takes up to 7 comparisons" },
        { label: "Worst Case", value: "Checks all n elements (Slow)" },
      ],
    };

    conceptB = {
      title: titleB,
      analogyOrRole: "Divide & Conquer (Halving Search Range)",
      badge: "O(log n) Steps",
      icon: "⚡",
      color: THEME.colors.plantGreenDark,
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
      properties: [
        { label: "Search Method", value: "Eliminates half at each midpoint" },
        { label: "Target 72 Checks", value: "Found in only 2 quick steps" },
        { label: "Worst Case", value: "Logarithmic: O(log n) (Ultra-Fast)" },
      ],
    };
  } else if (isRamTopic) {
    const isDeskAnalogy = scene.sceneId.includes("desk") || scene.objects.some((o) => o.label.includes("Desk"));
    headline = isDeskAnalogy
      ? "The Office Analogy: Desk vs Filing Cabinet"
      : "Direct Comparison: Working Memory vs Permanent Storage";

    const titleA = isDeskAnalogy ? "RAM: Office Desk" : "RAM (Active Memory)";
    const titleB = isDeskAnalogy ? "Storage: Filing Cabinet" : "Storage (SSD / Disk)";

    conceptA = {
      title: titleA,
      analogyOrRole: "Active Workspace (The Desk)",
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

    conceptB = {
      title: titleB,
      analogyOrRole: "Long-Term Archive (Filing Cabinet)",
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
  } else {
    // Generic comparison between two concepts
    const candA = scene.objects[0];
    const candB = scene.objects[1];
    const titleA = candA?.label ?? scene.onScreenText[0] ?? "Concept A";
    const titleB = candB?.label ?? scene.onScreenText[1] ?? "Concept B";

    const remainingObjects = scene.objects.slice(2);
    const half = Math.ceil(remainingObjects.length / 2);
    const propsA = remainingObjects.slice(0, half).map((o) => ({ label: o.kind, value: o.label }));
    const propsB = remainingObjects.slice(half).map((o) => ({ label: o.kind, value: o.label }));

    conceptA = {
      title: titleA,
      analogyOrRole: candA?.kind ?? "Concept A",
      badge: "Aspect A",
      icon: "🔹",
      color: THEME.colors.waterBlueDeep,
      bgColor: "#F0F7FF",
      borderColor: "#BFDBFE",
      properties: propsA.length > 0 ? propsA : [{ label: "Feature", value: "Primary characteristics of " + titleA }],
    };

    conceptB = {
      title: titleB,
      analogyOrRole: candB?.kind ?? "Concept B",
      badge: "Aspect B",
      icon: "🔸",
      color: "#581C87",
      bgColor: "#FAF5FF",
      borderColor: "#E9D5FF",
      properties: propsB.length > 0 ? propsB : [{ label: "Feature", value: "Primary characteristics of " + titleB }],
    };
  }

  // Validate to guarantee correctness
  validateComparisonData(conceptA, conceptB);

  return { conceptA, conceptB, headline };
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Direct Comparison",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { conceptA, conceptB, headline } = resolveComparisonConcepts(scene, topic);

  // Progressive reveal animations
  const card1Spring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const card2Spring = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const hasHighlightEvent = scene.events.some(
    (ev) => frame >= ev.startFrame && frame <= ev.endFrame && (ev.action === "highlight" || ev.action === "emphasize")
  );

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={scene.onScreenText[0] ?? "Direct Comparison"}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        {/* Header section */}
        <div style={{ padding: "32px 40px 14px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ maxWidth: 680 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight: 800,
                  color: THEME.colors.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                {headline}
              </h2>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: 20,
                  color: THEME.colors.textMuted,
                  fontWeight: 500,
                }}
              >
                Side-by-side core trade-offs & roles
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

        {/* Dual Cards */}
        <div
          style={{
            flex: 1,
            padding: "8px 40px 24px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {/* Concept A Card */}
          <div
            style={{
              opacity: interpolate(card1Spring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(card1Spring, [0, 1], [20, 0])}px)`,
              backgroundColor: conceptA.bgColor,
              border: `2px solid ${hasHighlightEvent ? THEME.colors.waterBlue : conceptA.borderColor}`,
              borderRadius: 22,
              padding: "20px 26px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: conceptA.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {conceptA.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: conceptA.color }}>
                    {conceptA.title}
                  </h3>
                  <span style={{ fontSize: 16, color: THEME.colors.textSecondary, fontWeight: 600 }}>
                    {conceptA.analogyOrRole}
                  </span>
                </div>
              </div>
              <span
                style={{
                  backgroundColor: "#FFFFFF",
                  color: conceptA.color,
                  border: `1.5px solid ${conceptA.borderColor}`,
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {conceptA.badge}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
              {conceptA.properties.map((p, idx) => (
                <div
                  key={`prop-a-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${conceptA.borderColor}`,
                  }}
                >
                  <div style={{ fontSize: 13, color: THEME.colors.textMuted, fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 2 }}>
                    {p.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VS Divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", width: "100%", height: 1, backgroundColor: THEME.colors.border }} />
            <div
              style={{
                position: "relative",
                backgroundColor: THEME.colors.surface,
                border: `2px solid ${THEME.colors.border}`,
                color: THEME.colors.textMuted,
                borderRadius: 20,
                padding: "2px 16px",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.1em",
              }}
            >
              VS
            </div>
          </div>

          {/* Concept B Card */}
          <div
            style={{
              opacity: interpolate(card2Spring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(card2Spring, [0, 1], [20, 0])}px)`,
              backgroundColor: conceptB.bgColor,
              border: `2px solid ${conceptB.borderColor}`,
              borderRadius: 22,
              padding: "20px 26px",
              boxShadow: "0 4px 14px rgba(126, 34, 206, 0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: conceptB.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {conceptB.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: conceptB.color }}>
                    {conceptB.title}
                  </h3>
                  <span style={{ fontSize: 16, color: THEME.colors.textSecondary, fontWeight: 600 }}>
                    {conceptB.analogyOrRole}
                  </span>
                </div>
              </div>
              <span
                style={{
                  backgroundColor: "#FFFFFF",
                  color: conceptB.color,
                  border: `1.5px solid ${conceptB.borderColor}`,
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {conceptB.badge}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
              {conceptB.properties.map((p, idx) => (
                <div
                  key={`prop-b-${idx}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${conceptB.borderColor}`,
                  }}
                >
                  <div style={{ fontSize: 13, color: THEME.colors.textMuted, fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: THEME.colors.textPrimary, marginTop: 2 }}>
                    {p.value}
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
