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

export const SummaryTakeawayTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Summary & Key Takeaways",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Key Takeaway";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const objects = scene.objects;
  const takeaway = visualData.takeaway || {
    headline: title,
    keyTakeaways: objects.length >= 2
      ? objects.map((obj, i) => ({
          number: i + 1,
          title: obj.label,
          description: `Key synthesized insight regarding ${obj.label.toLowerCase()}`,
          color: ["#38BDF8", "#10B981", "#F59E0B"][i % 3],
        }))
      : [
          { number: 1, title: "Acoustic Transduction", description: "Vocal pressure converts to electrical and digital signals", color: "#38BDF8" },
          { number: 2, title: "Near-Light Transit", description: "Signals transit at 200,000 km/s through global fiber backbones", color: "#10B981" },
          { number: 3, title: "Continuous Duplex", description: "Real-time acoustic reconstruction preserves two-way conversation", color: "#F59E0B" },
        ],
  };

  const headerCategory = visualData.headerBadge?.category ?? "SUMMARY & KEY TAKEAWAYS";
  const headerIcon = visualData.headerBadge?.icon ?? "🎓";
  const headerColor = visualData.headerBadge?.color ?? "#10B981";

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

        {/* Central Synthesis Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
            opacity: contentOpacity,
          }}
        >
          {takeaway.keyTakeaways.map((item, idx) => {
            const cardSpr = spring({
              frame: Math.max(0, frame - idx * 12),
              fps,
              config: { damping: 14, stiffness: 120 },
            });

            return (
              <div
                key={idx}
                style={{
                  opacity: interpolate(cardSpr, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(cardSpr, [0, 1], [0.94, 1])})`,
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.98))",
                  borderRadius: 26,
                  border: `2px solid ${item.color || headerColor}66`,
                  borderLeft: `8px solid ${item.color || headerColor}`,
                  boxShadow: `0 14px 32px rgba(0,0,0,0.4), inset 0 0 20px ${item.color || headerColor}11`,
                  padding: "24px 30px",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background: `${item.color || headerColor}22`,
                    border: `2px solid ${item.color || headerColor}`,
                    color: item.color || headerColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                  }}
                >
                  {item.number}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 800 }}>
                    {item.title}
                  </div>
                  <div style={{ color: "#94A3B8", fontSize: 16, marginTop: 4, lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="🎓"
          category="FINAL SYNTHESIS"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
