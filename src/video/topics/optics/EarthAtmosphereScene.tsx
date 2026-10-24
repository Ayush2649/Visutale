import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const EarthAtmosphereScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Earth's Atmosphere & Atmospheric Particles",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Earth's Atmospheric Shield";
  const subtitle = scene.onScreenText[1] ?? "Sunlight strikes billions of gas molecules and particles";

  // Event 1: Sunlight enters atmosphere (cue: "enters Earth's atmosphere")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Zoom on Gas molecules & particles (cue: "tiny gas molecules")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 45;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const sunRaysProgress = interpolate(ev1Spr, [0, 1], [0, 1]);
  const particleZoomProgress = interpolate(ev2Spr, [0, 1], [0, 1]);
  const atmospherePulse = 1 + Math.sin(frame * 0.08) * 0.02;

  // Particle positions floating and vibrating
  const particles = [
    { name: "N₂ (78%)", x: 160, y: 130, color: "#38BDF8", size: 28 },
    { name: "O₂ (21%)", x: 320, y: 190, color: "#34D399", size: 26 },
    { name: "Ar (0.9%)", x: 190, y: 260, color: "#A78BFA", size: 22 },
    { name: "Dust Particle", x: 380, y: 110, color: "#FBBF24", size: 32 },
    { name: "N₂", x: 260, y: 90, color: "#38BDF8", size: 24 },
    { name: "O₂", x: 400, y: 240, color: "#34D399", size: 25 },
  ];

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
      backgroundColor="#050814"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Header (Top Safe Area) */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 72,
            right: 72,
            textAlign: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(56,189,248,0.15)",
              border: "1px solid rgba(56,189,248,0.3)",
              padding: "6px 18px",
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 700,
              color: "#38BDF8",
              marginBottom: 10,
            }}
          >
            Atmospheric Composition
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 44,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 16px rgba(0,0,0,0.6)",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: 24,
              fontWeight: 500,
              color: "#94A3B8",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Space, Earth & Atmosphere SVG Visualization */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 10,
          }}
        >
          <defs>
            {/* Distant stars */}
            <radialGradient id="spaceAtmosphereGlow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
            </radialGradient>

            {/* Earth Gradient */}
            <radialGradient id="earthGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="80%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>

            {/* Sunlight beam gradient */}
            <linearGradient id="sunBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#FDE047" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
            </linearGradient>

            <filter id="glowEffect">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Distant twinkling stars */}
          {[
            [120, 380], [240, 520], [820, 420], [940, 560], [180, 890],
            [900, 920], [150, 1420], [920, 1380], [850, 720], [280, 1100]
          ].map(([sx, sy], idx) => (
            <circle
              key={`star-${idx}`}
              cx={sx}
              cy={sy}
              r={idx % 2 === 0 ? 2 : 3}
              fill="#FFFFFF"
              opacity={0.3 + Math.sin(frame * 0.1 + idx) * 0.4}
            />
          ))}

          {/* Incoming Sunlight Collimated Beams from upper right space into atmosphere */}
          {[0, 1, 2, 3].map((rayIdx) => {
            const startX = 1040;
            const startY = 560 + rayIdx * 70;
            const targetX = 640;
            const targetY = 780 + rayIdx * 50;

            const curX = startX + (targetX - startX) * sunRaysProgress;
            const curY = startY + (targetY - startY) * sunRaysProgress;

            return (
              <g key={`ray-${rayIdx}`} opacity={sunRaysProgress}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={curX}
                  y2={curY}
                  stroke="url(#sunBeamGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#glowEffect)"
                />
                <line
                  x1={startX}
                  y1={startY}
                  x2={curX}
                  y2={curY}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Sun in Deep Space (Upper Right) */}
          <g transform="translate(980, 500)">
            <circle cx="0" cy="0" r="80" fill="#FEF08A" filter="url(#glowEffect)" opacity="0.9" />
            <circle cx="0" cy="0" r="45" fill="#FFFFFF" />
            <text x="0" y="70" fill="#FDE047" fontSize="20" fontWeight="700" textAnchor="middle">
              Sun (Source)
            </text>
          </g>

          {/* Visible Earth Planetary Globe (Centered at 380, 1020, radius 260) */}
          {/* Luminous Atmospheric Shell (radius 320, 60px visible shell) */}
          <circle
            cx="380"
            cy="1020"
            r={320 * atmospherePulse}
            fill="url(#spaceAtmosphereGlow)"
            filter="url(#glowEffect)"
          />
          <circle
            cx="380"
            cy="1020"
            r="320"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeDasharray="8 6"
            opacity="0.8"
          />

          {/* Earth Body */}
          <circle cx="380" cy="1020" r="260" fill="url(#earthGrad)" />

          {/* Continents Outline on Earth */}
          <g fill="#10B981" opacity="0.65">
            <path d="M 300 860 Q 360 820 420 880 T 480 940 T 440 1020 T 360 1000 Z" />
            <path d="M 240 1000 Q 280 960 320 1020 T 300 1120 T 220 1080 Z" />
            <path d="M 400 1080 Q 460 1040 500 1100 T 460 1180 T 380 1140 Z" />
          </g>

          {/* Earth Center Label */}
          <text x="360" y="1030" fill="#FFFFFF" fontSize="32" fontWeight="800" textAnchor="middle">
            EARTH
          </text>
          <text x="360" y="1065" fill="#93C5FD" fontSize="20" fontWeight="600" textAnchor="middle">
            Diameter: 12,742 km
          </text>

          {/* Atmosphere Layer Annotation Bracket */}
          <line x1="640" y1="1020" x2="700" y2="1020" stroke="#38BDF8" strokeWidth="2.5" />
          <line x1="700" y1="990" x2="700" y2="1050" stroke="#38BDF8" strokeWidth="2.5" />
          <text x="715" y="1015" fill="#38BDF8" fontSize="22" fontWeight="800">
            Atmospheric Shell
          </text>
          <text x="715" y="1040" fill="#94A3B8" fontSize="18" fontWeight="600">
            Troposphere + Stratosphere (~100 km)
          </text>
        </svg>

        {/* Magnified Microscope Inset: Gas Molecules & Dust Particles */}
        <div
          style={{
            position: "absolute",
            bottom: 300,
            left: 72,
            right: 72,
            backgroundColor: "rgba(15,23,42,0.88)",
            backdropFilter: "blur(14px)",
            border: "2px solid rgba(56,189,248,0.4)",
            borderRadius: 24,
            padding: "24px 28px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
            opacity: particleZoomProgress,
            transform: `translateY(${interpolate(ev2Spr, [0, 1], [40, 0])}px)`,
            zIndex: 25,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>🔬</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#38BDF8" }}>
                Magnified View: Atmospheric Gas Matrix
              </span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8" }}>Scale: Molecular (~0.3 nm)</span>
          </div>

          {/* Floating animated molecule dots */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 120,
              backgroundColor: "rgba(2,6,23,0.7)",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "0 16px",
            }}
          >
            {particles.map((p, idx) => {
              const vibX = Math.sin(frame * 0.15 + idx * 1.5) * 6;
              const vibY = Math.cos(frame * 0.12 + idx * 1.2) * 5;

              return (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transform: `translate(${vibX}px, ${vibY}px)`,
                  }}
                >
                  <div
                    style={{
                      width: p.size,
                      height: p.size,
                      borderRadius: "50%",
                      backgroundColor: p.color,
                      boxShadow: `0 0 14px ${p.color}`,
                      marginBottom: 6,
                    }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC" }}>{p.name}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, fontSize: 17, color: "#CBD5E1", textAlign: "center", fontWeight: 500 }}>
            Gas molecules are smaller than light wavelengths, triggering Rayleigh scattering.
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};

