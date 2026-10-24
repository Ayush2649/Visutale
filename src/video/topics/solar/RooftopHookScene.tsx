import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const RooftopHookScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "How Solar Panels Turn Sunlight into Electricity",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "The Sun Powers Your Home!";
  const subtitle = scene.onScreenText[1] ?? "How does sunlight become electricity?";

  // Event 1: Sun reveal & pulse (cue: "The Sun can power")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Sunlight rays descend to roof (cue: "But how does sunlight")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 30;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  // Event 3: House rooftop panels glow and absorb energy (cue: "become electricity")
  const ev3 = scene.events[2];
  const ev3Rel = ev3 ? Math.max(0, ev3.startFrame - scene.startFrame) : 60;
  const ev3Spr = spring({
    frame: Math.max(0, frame - ev3Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  // Continuous animation calculations
  const sunPulse = 1 + Math.sin(frame * 0.06) * 0.05;
  const sunRayCycle = (frame * 4) % 120;
  const rayStreamProgress = interpolate(ev2Spr, [0, 1], [0, 1]);
  const panelGlow = interpolate(ev3Spr, [0, 1], [0.3, 1]);

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
          background: "linear-gradient(180deg, #0284C7 0%, #38BDF8 35%, #BAE6FD 65%, #F0F9FF 100%)",
        }}
      >
        {/* Subtle cloud layers in sky */}
        <svg
          style={{ position: "absolute", top: 120, left: 0, width: "100%", height: 300, opacity: 0.6 }}
          viewBox="0 0 1080 300"
        >
          <path
            d="M 80,180 Q 140,120 220,150 Q 300,100 400,140 Q 480,110 540,160 Q 600,180 620,200 L 60,200 Z"
            fill="#FFFFFF"
            opacity="0.8"
            transform={`translate(${((frame * 0.5) % 200) - 50}, 0)`}
          />
          <path
            d="M 650,140 Q 720,80 820,110 Q 900,70 1000,110 Q 1060,90 1100,140 L 620,150 Z"
            fill="#FFFFFF"
            opacity="0.75"
            transform={`translate(${(-((frame * 0.3) % 200)) + 50}, 0)`}
          />
        </svg>

        {/* Dynamic Radiant Sun */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 120,
            transform: `scale(${interpolate(ev1Spr, [0, 1], [0.6, 1]) * sunPulse})`,
            opacity: interpolate(ev1Spr, [0, 1], [0, 1]),
            transformOrigin: "center center",
          }}
        >
          {/* Corona Glow Ring */}
          <div
            style={{
              position: "absolute",
              top: -60,
              left: -60,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(251,191,36,0.2) 50%, rgba(245,158,11,0) 75%)",
              filter: "blur(10px)",
            }}
          />
          {/* Inner Golden Sun Body */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #FEF08A 0%, #FBBF24 55%, #F59E0B 100%)",
              boxShadow: "0 0 60px rgba(245, 158, 11, 0.6), 0 0 120px rgba(251, 191, 36, 0.4)",
            }}
          />
          {/* Badge Label */}
          <div
            style={{
              position: "absolute",
              top: 75,
              left: 230,
              background: "rgba(15,23,42,0.75)",
              backdropFilter: "blur(8px)",
              padding: "8px 18px",
              borderRadius: 20,
              border: "1px solid rgba(251, 191, 36, 0.5)",
              color: "#FEF08A",
              fontSize: 22,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            ☀️ Solar Energy Source
          </div>
        </div>

        {/* Sunlight Beams Descending to Rooftop */}
        <svg
          style={{
            position: "absolute",
            top: 320,
            left: 180,
            width: 800,
            height: 800,
            pointerEvents: "none",
          }}
          viewBox="0 0 800 800"
        >
          <defs>
            <linearGradient id="sunBeamGrad" x1="0%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Animated Photon Beams */}
          {[
            { x1: 50, y1: 50, x2: 420, y2: 600, delay: 0 },
            { x1: 80, y1: 40, x2: 480, y2: 580, delay: 20 },
            { x1: 120, y1: 30, x2: 540, y2: 560, delay: 40 },
            { x1: 150, y1: 40, x2: 600, y2: 550, delay: 60 },
          ].map((beam, i) => {
            const currentDash = (sunRayCycle + beam.delay) % 120;
            return (
              <g key={i} opacity={rayStreamProgress}>
                <line
                  x1={beam.x1}
                  y1={beam.y1}
                  x2={beam.x2}
                  y2={beam.y2}
                  stroke="url(#sunBeamGrad)"
                  strokeWidth="8"
                  strokeDasharray="40 25"
                  strokeDashoffset={-currentDash * 3}
                  filter="url(#glow)"
                />
              </g>
            );
          })}
        </svg>

        {/* Modern Suburban House with Pitched Solar Roof */}
        <div
          style={{
            position: "absolute",
            bottom: 340,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 620,
          }}
        >
          <svg viewBox="0 0 900 620" style={{ width: "100%", height: "100%" }}>
            {/* Ground Lawn */}
            <rect x="0" y="520" width="900" height="100" fill="#15803D" />
            <path d="M 0,520 Q 450,510 900,520 L 900,620 L 0,620 Z" fill="#16A34A" />

            {/* Main House Walls */}
            <rect x="180" y="260" width="540" height="260" fill="#F8FAFC" rx="8" />
            <rect x="180" y="260" width="540" height="260" fill="none" stroke="#CBD5E1" strokeWidth="4" rx="8" />

            {/* Front Door */}
            <rect x="410" y="380" width="80" height="140" fill="#0F172A" rx="4" />
            <circle cx="475" cy="450" r="5" fill="#F59E0B" />

            {/* Living Room Windows with Interior Glow */}
            <rect x="230" y="360" width="120" height="90" fill="#FEF08A" rx="6" opacity={panelGlow} />
            <rect x="230" y="360" width="120" height="90" fill="none" stroke="#64748B" strokeWidth="4" rx="6" />
            <line x1="290" y1="360" x2="290" y2="450" stroke="#64748B" strokeWidth="3" />
            <line x1="230" y1="405" x2="350" y2="405" stroke="#64748B" strokeWidth="3" />

            <rect x="550" y="360" width="120" height="90" fill="#FEF08A" rx="6" opacity={panelGlow} />
            <rect x="550" y="360" width="120" height="90" fill="none" stroke="#64748B" strokeWidth="4" rx="6" />
            <line x1="610" y1="360" x2="610" y2="450" stroke="#64748B" strokeWidth="3" />
            <line x1="550" y1="405" x2="670" y2="405" stroke="#64748B" strokeWidth="3" />

            {/* Pitched Roof */}
            <polygon points="140,260 450,90 760,260" fill="#334155" />
            <polygon points="140,260 450,90 760,260" fill="none" stroke="#1E293B" strokeWidth="6" />

            {/* Solar Panel Array on Roof (Facing Sun) */}
            <g transform="translate(240, 140)">
              {/* Outer Panel Frame */}
              <polygon
                points="0,100 200,-10 420,100 220,210"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth={3 + panelGlow * 2}
                filter="url(#glow)"
              />
              {/* Silicon Solar Cells Grid */}
              <polygon
                points="10,98 195,-2 405,98 220,198"
                fill="#0284C7"
                opacity={0.85 + Math.sin(frame * 0.1) * 0.15}
              />

              {/* Grid Busbar lines */}
              <line x1="60" y1="70" x2="270" y2="170" stroke="#E2E8F0" strokeWidth="2" opacity="0.8" />
              <line x1="110" y1="40" x2="320" y2="140" stroke="#E2E8F0" strokeWidth="2" opacity="0.8" />
              <line x1="160" y1="15" x2="370" y2="115" stroke="#E2E8F0" strokeWidth="2" opacity="0.8" />

              <line x1="100" y1="145" x2="300" y2="40" stroke="#E2E8F0" strokeWidth="2" opacity="0.8" />
              <line x1="150" y1="170" x2="350" y2="65" stroke="#E2E8F0" strokeWidth="2" opacity="0.8" />

              {/* Energy Glint Highlight */}
              <circle
                cx={220 + Math.sin(frame * 0.08) * 100}
                cy={100 + Math.cos(frame * 0.08) * 50}
                r="30"
                fill="#BAE6FD"
                opacity="0.6"
                filter="blur(15px)"
              />
            </g>
          </svg>

          {/* Floating Rooftop Panel Annotation Pill */}
          <div
            style={{
              position: "absolute",
              top: 130,
              right: 80,
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(12px)",
              padding: "12px 24px",
              borderRadius: 24,
              border: "2px solid #38BDF8",
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: 800,
              boxShadow: "0 12px 30px rgba(56,189,248,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: interpolate(ev3Spr, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(ev3Spr, [0, 1], [15, 0])}px)`,
            }}
          >
            <span style={{ fontSize: 26 }}>⚡</span>
            <span>Rooftop Photovoltaic Array</span>
          </div>
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="Solar Energy Transformation"
          categoryColor="#F59E0B"
          icon="☀️"
          title={subtitle}
          borderColor="rgba(245, 158, 11, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

