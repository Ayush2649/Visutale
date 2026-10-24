import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard, TakeawayInsightCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const SolarTakeawayScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Solar Power: Key Scientific Takeaways",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "The Power of Solar Energy";
  const subtitle = scene.onScreenText[1] ?? "Sunlight gives energy to solar cells, producing clean electricity";

  // Event 1: Complete flow reveal (cue: "magic of solar power")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const takeaways = [
    {
      num: "01",
      icon: "☀️",
      title: "Photons Excite Electrons",
      desc: "Sunlight packets strike silicon P-N junctions, knocking electrons free into conduction bands.",
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.4)",
    },
    {
      num: "02",
      icon: "⚡",
      title: "Directional Electric Current",
      desc: "Built-in electric fields force electrons through metal contacts, creating direct current (DC).",
      color: "#10B981",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.4)",
    },
    {
      num: "03",
      icon: "🏡",
      title: "Inverter Powers the Home",
      desc: "Inverters convert DC into alternating current (AC) for appliances, with batteries buffering 24/7.",
      color: "#38BDF8",
      bg: "rgba(56, 189, 248, 0.12)",
      border: "rgba(56, 189, 248, 0.4)",
    },
  ];

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={title}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #020617 0%, #0F172A 40%, #032E3A 100%)",
        }}
      >
        {/* Ambient Glow */}
        <div
          style={{
            position: "absolute",
            top: 200,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Header HUD Pill */}
        <div
          style={{
            position: "absolute",
            top: 140,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(12px)",
            padding: "10px 24px",
            borderRadius: 30,
            border: "1px solid rgba(56, 189, 248, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 24 }}>🎓</span>
          <span style={{ color: "#38BDF8", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Complete System Journey: Key Takeaways
          </span>
        </div>

        {/* Interactive Loop Diagram Banner */}
        <div
          style={{
            position: "absolute",
            top: 240,
            left: "50%",
            transform: "translateX(-50%)",
            width: "88%",
            maxWidth: 960,
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: 24,
            padding: "20px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {[
            { label: "SUNLIGHT", icon: "☀️", color: "#F59E0B" },
            { label: "PANELS", icon: "🛡️", color: "#38BDF8" },
            { label: "INVERTER", icon: "🔄", color: "#818CF8" },
            { label: "ELECTRICITY", icon: "⚡", color: "#10B981" },
          ].map((node, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: `${node.color}22`,
                    border: `2px solid ${node.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    boxShadow: `0 0 16px ${node.color}44`,
                  }}
                >
                  {node.icon}
                </div>
                <span style={{ color: node.color, fontSize: 16, fontWeight: 800 }}>{node.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ color: "#64748B", fontSize: 24, fontWeight: "bold" }}>➔</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 3 Main Takeaway Educational Cards */}
        <div
          style={{
            position: "absolute",
            top: 410,
            left: "50%",
            transform: "translateX(-50%)",
            width: "88%",
            maxWidth: 960,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {takeaways.map((card, idx) => {
            const cardSpr = spring({
              frame: Math.max(0, frame - idx * 12),
              fps,
              config: { damping: 14, mass: 0.8 },
            });
            const cardOpacity = interpolate(cardSpr, [0, 1], [0, 1]);
            const cardY = interpolate(cardSpr, [0, 1], [30, 0]);

            return (
              <TakeawayInsightCard
                key={card.num}
                stepNumber={card.num}
                icon={card.icon}
                title={card.title}
                description={card.desc}
                color={card.color}
                bg={card.bg}
                border={card.border}
                style={{
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                }}
              />
            );
          })}
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="Clean Renewable Future"
          categoryColor="#38BDF8"
          icon="☀️"
          title={subtitle}
          borderColor="rgba(56, 189, 248, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

