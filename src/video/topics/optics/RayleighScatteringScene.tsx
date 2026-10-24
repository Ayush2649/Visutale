import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const RayleighScatteringScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Rayleigh Scattering: Wavelength Comparison",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Rayleigh Scattering in Action";
  const subtitle = scene.onScreenText[1] ?? "Blue waves scatter everywhere; Red waves pass straight through";

  // Event 1: Blue wavelength scatters omnidirectionally (cue: "blue and violet scatter")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Red wavelength penetrates straight through (cue: "red and orange pass")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 45;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const blueScatterProgress = interpolate(ev1Spr, [0, 1], [0, 1]);
  const redPassProgress = interpolate(ev2Spr, [0, 1], [0, 1]);

  // Wave motion animations
  const waveShift = frame * 4;

  // 8 Omnidirectional scatter angles for blue light (45 degree increments)
  const scatterAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
      backgroundColor="#070B18"
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
              backgroundColor: "rgba(37,99,235,0.2)",
              border: "1px solid rgba(59,130,246,0.4)",
              padding: "6px 20px",
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 700,
              color: "#60A5FA",
              marginBottom: 10,
            }}
          >
            Physical Mechanism
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

        {/* Dual Path Comparison Stage */}
        <div
          style={{
            position: "absolute",
            top: 380,
            left: 60,
            right: 60,
            bottom: 300,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            zIndex: 10,
          }}
        >
          {/* ================= TOP CARD: SHORT BLUE WAVELENGTH ================= */}
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(14px)",
              border: "2px solid rgba(59,130,246,0.4)",
              borderRadius: 24,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 32px rgba(37,99,235,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    padding: "4px 14px",
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  SHORT WAVE
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#60A5FA" }}>
                  Blue & Violet Light (~400 nm)
                </span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#93C5FD" }}>High Frequency</span>
            </div>

            {/* Wave & Collision SVG Area */}
            <svg viewBox="0 0 960 220" style={{ width: "100%", height: 160 }}>
              <defs>
                <filter id="blueGlow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Incoming High-Frequency Blue Sine Wave (x: 40 to 460) */}
              <path
                d={`M 40 110 Q ${60 - (waveShift % 40)} 70, 80 110 T 120 110 T 160 110 T 200 110 T 240 110 T 280 110 T 320 110 T 360 110 T 400 110 T 440 110`}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="5"
                filter="url(#blueGlow)"
              />

              {/* Central Collision Gas Molecule (at x: 480, y: 110) */}
              <circle cx="480" cy="110" r="26" fill="#1E293B" stroke="#60A5FA" strokeWidth="3" />
              <text x="480" y="117" fill="#93C5FD" fontSize="16" fontWeight="800" textAnchor="middle">
                N₂
              </text>
              <text x="480" y="160" fill="#94A3B8" fontSize="15" fontWeight="600" textAnchor="middle">
                Gas Molecule
              </text>

              {/* 8 Omnidirectional Scattering Arrows Spreading in all directions */}
              {scatterAngles.map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const distance = 130 * blueScatterProgress;
                const endX = 480 + Math.cos(rad) * distance;
                const endY = 110 + Math.sin(rad) * distance;

                return (
                  <g key={`scat-${angle}`} opacity={blueScatterProgress}>
                    <line
                      x1="480"
                      y1="110"
                      x2={endX}
                      y2={endY}
                      stroke="#60A5FA"
                      strokeWidth="3.5"
                      strokeDasharray="6 4"
                      filter="url(#blueGlow)"
                    />
                    <circle cx={endX} cy={endY} r="5" fill="#93C5FD" />
                  </g>
                );
              })}
            </svg>

            {/* Bottom Outcome Label */}
            <div
              style={{
                backgroundColor: "rgba(37,99,235,0.18)",
                borderRadius: 12,
                padding: "8px 16px",
                fontSize: 18,
                fontWeight: 600,
                color: "#BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>⚡ Result: Blue waves strike tiny air molecules and scatter in all 360° directions.</span>
              <span style={{ color: "#60A5FA", fontWeight: 800 }}>Dispersed</span>
            </div>
          </div>

          {/* ================= BOTTOM CARD: LONG RED WAVELENGTH ================= */}
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(14px)",
              border: "2px solid rgba(239,68,68,0.4)",
              borderRadius: 24,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 32px rgba(239,68,68,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    padding: "4px 14px",
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  LONG WAVE
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#F87171" }}>
                  Red & Orange Light (~700 nm)
                </span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#FECACA" }}>Low Frequency</span>
            </div>

            {/* Low-Frequency Wave Passing Straight Through SVG */}
            <svg viewBox="0 0 960 220" style={{ width: "100%", height: 160 }}>
              <defs>
                <filter id="redGlow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Wide Gentle Low-Frequency Red Sine Wave */}
              <path
                d={`M 40 110 Q ${100 - (waveShift % 80)} 40, 160 110 T 280 110 T 400 110 T 520 110 T 640 110 T 760 110 T 880 110`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="6"
                filter="url(#redGlow)"
              />

              {/* Tiny Gas Molecule at x: 480 (Wave easily slips over/under) */}
              <circle cx="480" cy="110" r="18" fill="#1E293B" stroke="#F87171" strokeWidth="2.5" opacity="0.8" />
              <text x="480" y="116" fill="#FCA5A5" fontSize="14" fontWeight="800" textAnchor="middle">
                N₂
              </text>

              {/* Straight Directional Penetration Arrow (x: 480 to 920) */}
              <g opacity={redPassProgress}>
                <line
                  x1="480"
                  y1="110"
                  x2={480 + 440 * redPassProgress}
                  y2="110"
                  stroke="#F87171"
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="url(#redGlow)"
                />
                <polygon
                  points={`${480 + 440 * redPassProgress},100 ${480 + 440 * redPassProgress + 20},110 ${480 + 440 * redPassProgress},120`}
                  fill="#EF4444"
                />
              </g>

              {/* Observer Eye Indicator at Far Right */}
              <g transform="translate(900, 110)" opacity={redPassProgress}>
                <circle cx="0" cy="0" r="22" fill="#FEF08A" filter="url(#redGlow)" />
                <text x="0" y="42" fill="#FEF08A" fontSize="16" fontWeight="700" textAnchor="middle">
                  Observer
                </text>
              </g>
            </svg>

            {/* Bottom Outcome Label */}
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.18)",
                borderRadius: 12,
                padding: "8px 16px",
                fontSize: 18,
                fontWeight: 600,
                color: "#FECACA",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>🎯 Result: Long red wavelengths pass right over tiny particles without scattering.</span>
              <span style={{ color: "#EF4444", fontWeight: 800 }}>Transmitted</span>
            </div>
          </div>

          {/* Scientific Law Callout Banner */}
          <div
            style={{
              backgroundColor: "rgba(30,41,59,0.9)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: "14px 20px",
              textAlign: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#F1F5F9",
            }}
          >
            📐 Rayleigh's Law: Scattering ∝ 1/λ⁴ — Blue light scatters ~10× more than Red!
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
