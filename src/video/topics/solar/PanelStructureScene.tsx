import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const PanelStructureScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Solar Panel Anatomy & Architecture",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Solar Panels: The Energy Catcher";
  const subtitle = scene.onScreenText[1] ?? "Engineered to trap sunlight photons with minimal reflection";

  // Event 1: Zoom in on panel architecture (cue: "These are solar panels")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Photons striking & absorbing (cue: "catch energy from sunlight")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 35;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const zoomScale = interpolate(ev1Spr, [0, 1], [0.85, 1.05]);
  const layersReveal = interpolate(ev1Spr, [0, 1], [0, 1]);
  const photonPulse = (frame * 5) % 90;

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
          background: "linear-gradient(180deg, #0B132B 0%, #1C2541 40%, #0F172A 100%)",
        }}
      >
        {/* Subtle Background Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.8,
          }}
        />

        {/* Top Floating Badge */}
        <div
          style={{
            position: "absolute",
            top: 140,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            padding: "10px 24px",
            borderRadius: 30,
            border: "1px solid rgba(56, 189, 248, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ fontSize: 24 }}>🔍</span>
          <span style={{ color: "#38BDF8", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Macro-View Anatomy: Photovoltaic Module
          </span>
        </div>

        {/* Incoming Sunbeam Particle Stream */}
        <svg
          style={{ position: "absolute", top: 180, left: 0, width: "100%", height: 350, pointerEvents: "none" }}
          viewBox="0 0 1080 350"
        >
          <defs>
            <linearGradient id="photonStream" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {[180, 320, 460, 600, 740, 880].map((x, idx) => {
            const yOffset = (photonPulse + idx * 15) % 90;
            return (
              <g key={idx} opacity={interpolate(ev2Spr, [0, 1], [0.3, 1])}>
                <line
                  x1={x - 40}
                  y1={40}
                  x2={x}
                  y2={320}
                  stroke="url(#photonStream)"
                  strokeWidth="6"
                  strokeDasharray="25 15"
                  strokeDashoffset={-yOffset * 3.5}
                />
                <circle
                  cx={x - 40 + ((x - (x - 40)) * (yOffset / 90))}
                  cy={40 + ((320 - 40) * (yOffset / 90))}
                  r="7"
                  fill="#FEF08A"
                  filter="drop-shadow(0 0 8px #F59E0B)"
                />
              </g>
            );
          })}
        </svg>

        {/* Centered Exploded Layer Architecture */}
        <div
          style={{
            position: "absolute",
            top: 420,
            left: "50%",
            transform: `translateX(-50%) scale(${zoomScale})`,
            width: 880,
            height: 980,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Main Solar Panel 3D Isometric View */}
          <svg viewBox="0 0 880 720" style={{ width: "100%", height: 720 }}>
            <defs>
              <filter id="panelGlow">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="cellShine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="30%" stopColor="#0369A1" />
                <stop offset="70%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0C4A6E" />
              </linearGradient>
            </defs>

            {/* Aluminum Outer Framing */}
            <rect x="90" y="40" width="700" height="620" rx="16" fill="#1E293B" stroke="#64748B" strokeWidth="8" />
            <rect x="110" y="60" width="660" height="580" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="4" />

            {/* 6x4 Grid of Monocrystalline Silicon Cells */}
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 6 }).map((_, col) => {
                const cx = 130 + col * 105;
                const cy = 80 + row * 135;
                return (
                  <g key={`${row}-${col}`}>
                    {/* Silicon Wafer Base */}
                    <rect
                      x={cx}
                      y={cy}
                      width="95"
                      height="125"
                      rx="8"
                      fill="url(#cellShine)"
                      stroke="#0284C7"
                      strokeWidth="2"
                    />

                    {/* Wafer Chamfered Corners (Monocrystalline look) */}
                    <polygon
                      points={`${cx},${cy + 12} ${cx + 12},${cy} ${cx},${cy}`}
                      fill="#0F172A"
                    />
                    <polygon
                      points={`${cx + 83},${cy} ${cx + 95},${cy + 12} ${cx + 95},${cy}`}
                      fill="#0F172A"
                    />
                    <polygon
                      points={`${cx},${cy + 113} ${cx + 12},${cy + 125} ${cx},${cy + 125}`}
                      fill="#0F172A"
                    />
                    <polygon
                      points={`${cx + 83},${cy + 125} ${cx + 95},${cy + 113} ${cx + 95},${cy + 125}`}
                      fill="#0F172A"
                    />

                    {/* Silver Busbars (Vertical charge collectors) */}
                    <line x1={cx + 30} y1={cy} x2={cx + 30} y2={cy + 125} stroke="#E2E8F0" strokeWidth="2.5" opacity="0.9" />
                    <line x1={cx + 65} y1={cy} x2={cx + 65} y2={cy + 125} stroke="#E2E8F0" strokeWidth="2.5" opacity="0.9" />

                    {/* Fine Contact Fingers (Horizontal) */}
                    {Array.from({ length: 8 }).map((_, fIdx) => (
                      <line
                        key={fIdx}
                        x1={cx + 5}
                        y1={cy + 15 + fIdx * 14}
                        x2={cx + 90}
                        y2={cy + 15 + fIdx * 14}
                        stroke="#94A3B8"
                        strokeWidth="0.8"
                        opacity="0.6"
                      />
                    ))}
                  </g>
                );
              })
            )}

            {/* Tempered Protective Anti-Reflective Glass Layer Overlay */}
            <rect
              x="110"
              y="60"
              width="660"
              height="580"
              rx="10"
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38BDF8"
              strokeWidth="3"
              style={{
                mixBlendMode: "screen",
              }}
            />

            {/* Sunlight Reflection Glint traversing diagonally */}
            <polygon
              points={`
                ${150 + ((frame * 4) % 600)},60 
                ${260 + ((frame * 4) % 600)},60 
                ${140 + ((frame * 4) % 600)},640 
                ${30 + ((frame * 4) % 600)},640
              `}
              fill="rgba(255, 255, 255, 0.12)"
              style={{ mixBlendMode: "overlay" }}
            />
          </svg>

          {/* Callout Layer Labels */}
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 10,
              opacity: layersReveal,
            }}
          >
            <div
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: 16,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 10px #38BDF8" }} />
              <div>
                <div style={{ color: "#38BDF8", fontSize: 18, fontWeight: 700 }}>Anti-Reflective Glass</div>
                <div style={{ color: "#94A3B8", fontSize: 16 }}>Traps incoming photons</div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                borderRadius: 16,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 10px #F59E0B" }} />
              <div>
                <div style={{ color: "#F59E0B", fontSize: 18, fontWeight: 700 }}>Silicon Solar Cells</div>
                <div style={{ color: "#94A3B8", fontSize: 16 }}>Semiconductor energy absorbers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="Photovoltaic Architecture"
          categoryColor="#38BDF8"
          icon="🛡️"
          title={subtitle}
          borderColor="rgba(56, 189, 248, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

