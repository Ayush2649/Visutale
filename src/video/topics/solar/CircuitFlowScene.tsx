import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const CircuitFlowScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Electric Current: Electrons on the Move",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Directional Electron Flow";
  const subtitle = scene.onScreenText[1] ?? "Moving electrons through a wire create electric current (DC)";

  // Event 1: Wire circuit illuminates (cue: "electrons move in one direction")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Electric current flow indicator surges (cue: "creates an electric current")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 35;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const circuitGlow = interpolate(ev1Spr, [0, 1], [0.3, 1]);
  const currentSurge = interpolate(ev2Spr, [0, 1], [0, 1]);
  const electronLoop = (frame * 5) % 180;

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
          background: "linear-gradient(180deg, #090D16 0%, #0F172A 50%, #064E3B 100%)",
        }}
      >
        {/* Subtle Tech Circuit Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
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
            border: "1px solid rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 24 }}>⚡</span>
          <span style={{ color: "#34D399", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Closed Circuit: Direct Current (DC)
          </span>
        </div>

        {/* Central Circuit Vector Stage */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: "50%",
            transform: "translateX(-50%)",
            width: 920,
            height: 1040,
          }}
        >
          <svg viewBox="0 0 920 1040" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="wireCopper" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <filter id="circuitBloom">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Left: Solar Cell Unit (Power Generator) */}
            <g transform="translate(60, 200)">
              <rect x="0" y="0" width="220" height="420" rx="16" fill="#0F172A" stroke="#0284C7" strokeWidth="4" />
              <rect x="15" y="15" width="190" height="390" rx="10" fill="#0369A1" opacity="0.85" />

              {/* Silicon Grid pattern */}
              {Array.from({ length: 4 }).map((_, r) => (
                <line key={r} x1="15" y1={40 + r * 90} x2="205" y2={40 + r * 90} stroke="#BAE6FD" strokeWidth="2" opacity="0.6" />
              ))}
              <line x1="75" y1="15" x2="75" y2="405" stroke="#E2E8F0" strokeWidth="2.5" opacity="0.8" />
              <line x1="145" y1="15" x2="145" y2="405" stroke="#E2E8F0" strokeWidth="2.5" opacity="0.8" />

              <text x="110" y="210" fill="#FFFFFF" fontSize="22" fontWeight="800" textAnchor="middle">
                SOLAR CELL
              </text>
              <text x="110" y="240" fill="#7DD3FC" fontSize="16" fontWeight="700" textAnchor="middle">
                PV Generator
              </text>

              {/* Negative Terminal (Top) */}
              <circle cx="110" cy="-10" r="14" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
              <text x="110" y="-4" fill="#FFFFFF" fontSize="18" fontWeight="bold" textAnchor="middle">
                −
              </text>

              {/* Positive Terminal (Bottom) */}
              <circle cx="110" cy="430" r="14" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
              <text x="110" y="436" fill="#FFFFFF" fontSize="18" fontWeight="bold" textAnchor="middle">
                +
              </text>
            </g>

            {/* Circuit Copper Wire Loop */}
            {/* Top wire from negative terminal to right */}
            <path
              d="M 170,190 L 170,100 L 760,100 L 760,260"
              fill="none"
              stroke="#D97706"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Illuminated Wire Conduit Glow */}
            <path
              d="M 170,190 L 170,100 L 760,100 L 760,260"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={circuitGlow}
              filter="url(#circuitBloom)"
            />

            {/* Bottom return wire from right to positive terminal */}
            <path
              d="M 760,560 L 760,720 L 170,720 L 170,630"
              fill="none"
              stroke="#D97706"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 760,560 L 760,720 L 170,720 L 170,630"
              fill="none"
              stroke="#34D399"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={circuitGlow}
              filter="url(#circuitBloom)"
            />

            {/* Moving Electron Particles Streaming along the Wire */}
            {Array.from({ length: 12 }).map((_, i) => {
              // Path segments: Total perimeter length ~ 1600
              const t = (electronLoop * 10 + i * 140) % 1680;
              let ex = 170;
              let ey = 190;

              if (t < 90) {
                // Moving up from terminal to y=100
                ex = 170;
                ey = 190 - t;
              } else if (t < 680) {
                // Moving right from x=170 to x=760 along y=100
                ex = 170 + (t - 90);
                ey = 100;
              } else if (t < 840) {
                // Moving down through load from y=100 to y=260
                ex = 760;
                ey = 100 + (t - 680);
              } else if (t < 1140) {
                // Moving down from y=560 to y=720
                ex = 760;
                ey = 560 + (t - 840) * 0.53;
              } else if (t < 1630) {
                // Moving left from x=760 to x=170 along y=720
                ex = 760 - (t - 1140) * 1.2;
                ey = 720;
              } else {
                // Moving up into bottom terminal
                ex = 170;
                ey = 720 - (t - 1630);
              }

              return (
                <g key={i} opacity={currentSurge}>
                  <circle cx={ex} cy={ey} r="10" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" filter="url(#circuitBloom)" />
                  <text x={ex} y={ey + 4} fill="#0F172A" fontSize="12" fontWeight="900" textAnchor="middle">
                    e⁻
                  </text>
                </g>
              );
            })}

            {/* Right Side: Digital Multimeter HUD & Power Measurement */}
            <g transform="translate(630, 260)">
              {/* Load Housing */}
              <rect x="0" y="0" width="260" height="300" rx="20" fill="#0F172A" stroke="#10B981" strokeWidth="4" />

              {/* Digital Meter Screen */}
              <rect x="25" y="25" width="210" height="90" rx="10" fill="#022C22" stroke="#059669" strokeWidth="2" />
              <text x="40" y="55" fill="#34D399" fontSize="16" fontWeight="700">
                DC VOLTAGE
              </text>
              <text x="40" y="95" fill="#10B981" fontSize="32" fontWeight="900" letterSpacing="0.05em">
                38.4 V
              </text>

              <rect x="25" y="130" width="210" height="90" rx="10" fill="#022C22" stroke="#059669" strokeWidth="2" />
              <text x="40" y="160" fill="#34D399" fontSize="16" fontWeight="700">
                ELECTRIC CURRENT
              </text>
              <text x="40" y="200" fill="#10B981" fontSize="32" fontWeight="900" letterSpacing="0.05em">
                9.52 A
              </text>

              {/* Instantaneous Power Gauge */}
              <text x="130" y="260" fill="#FBBF24" fontSize="18" fontWeight="800" textAnchor="middle">
                POWER: 365.5 W
              </text>
            </g>

            {/* Center Flow Annotation Vector */}
            <g transform="translate(460, 220)">
              <rect x="-140" y="-30" width="280" height="60" rx="30" fill="rgba(15,23,42,0.85)" stroke="#38BDF8" strokeWidth="2" />
              <text x="0" y="8" fill="#38BDF8" fontSize="18" fontWeight="800" textAnchor="middle">
                ➔ Electron Flow: One Direction ➔
              </text>
            </g>
          </svg>
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="Direct Current Generation"
          categoryColor="#34D399"
          icon="🔋"
          title={subtitle}
          borderColor="rgba(16, 185, 129, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

