import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const SunsetTakeawayScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Why the Sky Turns Orange and Red at Sunset",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Key Scientific Takeaway";
  const subtitle = scene.onScreenText[1] ?? "Dust & Pollution Make Sunset Colors Even More Vivid!";

  // Event 1: Summary cards reveal (cue: "So, red sunsets")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Fun Fact reveal (cue: "volcanic dust and pollution")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 45;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const cardsProgress = interpolate(ev1Spr, [0, 1], [0, 1]);
  const factProgress = interpolate(ev2Spr, [0, 1], [0, 1]);

  // Subtle camera breathing
  const scale = interpolate(frame, [0, 300], [1, 1.04], { extrapolateRight: "clamp" });

  const summaryCards = [
    {
      step: "1",
      title: "White Sunlight",
      desc: "Contains all 7 rainbow colors combined.",
      icon: "☀️",
      color: "#FEF08A",
    },
    {
      step: "2",
      title: "Rayleigh Scattering",
      desc: "Short blue waves scatter off tiny air particles.",
      icon: "🌌",
      color: "#60A5FA",
    },
    {
      step: "3",
      title: "10× Longer Horizon Path",
      desc: "All blue scatters away; only red & orange reach your eyes.",
      icon: "🌅",
      color: "#F97316",
    },
  ];

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
        }}
      >
        {/* Cinematic Sunset Vista SVG Backdrop */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <linearGradient id="twilightSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F0C29" />
              <stop offset="30%" stopColor="#302B63" />
              <stop offset="60%" stopColor="#831843" />
              <stop offset="80%" stopColor="#C2410C" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>

            <radialGradient id="twilightSun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#FDE047" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#EA580C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky background */}
          <rect width="1080" height="1920" fill="url(#twilightSky)" />

          {/* Sunk Sunset Glow on Horizon */}
          <circle cx="540" cy="1220" r="380" fill="url(#twilightSun)" />

          {/* Distant mountains silhouette */}
          <path
            d="M 0 1340 Q 240 1260 480 1310 T 960 1280 T 1080 1320 L 1080 1920 L 0 1920 Z"
            fill="#180A22"
            opacity="0.9"
          />
          <path
            d="M 0 1440 Q 340 1380 680 1420 T 1080 1400 L 1080 1920 L 0 1920 Z"
            fill="#0B0512"
          />

          {/* Water reflection */}
          <rect x="0" y="1560" width="1080" height="360" fill="#06020A" />
          <ellipse cx="540" cy="1620" rx="220" ry="28" fill="#EA580C" opacity="0.3" filter="blur(18px)" />
        </svg>

        {/* Content Container (Top to Mid Area) */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 72,
            right: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          {/* Header Badge */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(14px)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              padding: "10px 24px",
              borderRadius: 30,
              fontSize: 22,
              fontWeight: 700,
              color: "#FEF08A",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            🎓 Summary & Scientific Takeaway
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 50,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              textAlign: "center",
              textShadow: "0 4px 20px rgba(0,0,0,0.7)",
            }}
          >
            {title}
          </h2>

          {/* 3 Step Scientific Summary Cards */}
          <div
            style={{
              width: "100%",
              marginTop: 36,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: cardsProgress,
              transform: `translateY(${interpolate(ev1Spr, [0, 1], [30, 0])}px)`,
            }}
          >
            {summaryCards.map((card) => (
              <div
                key={card.step}
                style={{
                  backgroundColor: "rgba(15,23,42,0.85)",
                  backdropFilter: "blur(16px)",
                  border: `2px solid ${card.color}50`,
                  borderRadius: 20,
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${card.color}20`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: `${card.color}25`,
                    border: `2px solid ${card.color}`,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 18, color: "#E2E8F0", marginTop: 4, fontWeight: 500 }}>
                    {card.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fun Fact Callout Card (Revealed on cue "volcanic dust and pollution") */}
          <div
            style={{
              width: "100%",
              marginTop: 24,
              backgroundColor: "rgba(234,88,12,0.22)",
              backdropFilter: "blur(14px)",
              border: "2px solid #F97316",
              borderRadius: 20,
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: factProgress,
              transform: `translateY(${interpolate(ev2Spr, [0, 1], [24, 0])}px)`,
              boxShadow: "0 8px 32px rgba(234,88,12,0.25)",
            }}
          >
            <span style={{ fontSize: 36, flexShrink: 0 }}>🌋</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FEF08A" }}>
                Scientific Fun Fact
              </div>
              <div style={{ fontSize: 17, color: "#FED7AA", marginTop: 3, fontWeight: 500, lineHeight: 1.35 }}>
                {subtitle} Particles scatter extra light, creating deep crimson twilights!
              </div>
            </div>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};

