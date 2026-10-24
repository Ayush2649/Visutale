import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

interface SpectrumColor {
  name: string;
  color: string;
  wavelength: string;
  refractionAngle: number;
}

const SPECTRUM_COLORS: SpectrumColor[] = [
  { name: "Red", color: "#FF3B30", wavelength: "700 nm (Longest)", refractionAngle: 18 },
  { name: "Orange", color: "#FF9500", wavelength: "620 nm", refractionAngle: 21 },
  { name: "Yellow", color: "#FFCC00", wavelength: "580 nm", refractionAngle: 24 },
  { name: "Green", color: "#34C759", wavelength: "530 nm", refractionAngle: 27 },
  { name: "Blue", color: "#007AFF", wavelength: "470 nm", refractionAngle: 30 },
  { name: "Indigo", color: "#5856D6", wavelength: "430 nm", refractionAngle: 33 },
  { name: "Violet", color: "#AF52DE", wavelength: "400 nm (Shortest)", refractionAngle: 36 },
];

export const LightPrismSpectrumScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "White Light & The Visible Spectrum",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "White Light = All Colors";
  const subtitle = scene.onScreenText[1] ?? "Refraction splits white light into 7 visible wavelengths";

  // Event 1: White beam arrives (cue: "Sunlight looks white")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Prism rainbow spectrum fans out (cue: "all colors of the rainbow")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 45;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  // Pulse animation for light flow
  const lightPulse = (frame * 6) % 80;
  const beamProgress = interpolate(ev1Spr, [0, 1], [0, 1]);
  const spectrumProgress = interpolate(ev2Spr, [0, 1], [0, 1]);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
      backgroundColor="#090D1A"
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
        {/* Header Callout (Top Safe Area) */}
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
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "6px 18px",
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 700,
              color: "#38BDF8",
              marginBottom: 10,
            }}
          >
            Optical Dispersion
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

        {/* Optical Ray Diagram SVG Stage */}
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
            {/* White light beam gradient */}
            <linearGradient id="whiteBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>

            {/* Prism Glass Gradient */}
            <linearGradient id="prismGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.4" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Laboratory Grid Lines */}
          <g opacity="0.12">
            {[...Array(11)].map((_, i) => (
              <line key={`vg-${i}`} x1={i * 100} y1="360" x2={i * 100} y2="1500" stroke="#38BDF8" strokeWidth="1" />
            ))}
            {[...Array(12)].map((_, i) => (
              <line key={`hg-${i}`} x1="40" y1={360 + i * 100} x2="1040" y2={360 + i * 100} stroke="#38BDF8" strokeWidth="1" />
            ))}
          </g>

          {/* Incoming White Sunlight Ray (from Upper-Left into Prism Face at x:420, y:820) */}
          <path
            d={`M 140 620 L ${140 + (420 - 140) * beamProgress} ${620 + (820 - 620) * beamProgress}`}
            stroke="url(#whiteBeam)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#laserGlow)"
          />
          {/* Core high-intensity white centerline */}
          <path
            d={`M 140 620 L ${140 + (420 - 140) * beamProgress} ${620 + (820 - 620) * beamProgress}`}
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Incoming Beam Source Badge */}
          <g opacity={beamProgress}>
            <circle cx="140" cy="620" r="16" fill="#FDE047" filter="url(#laserGlow)" />
            <text x="140" y="580" fill="#FEF08A" fontSize="22" fontWeight="700" textAnchor="middle">
              Sunlight (White Light)
            </text>
          </g>

          {/* Glass Triangular Prism (Vertices: Top (520, 680), Bottom-Left (380, 960), Bottom-Right (660, 960)) */}
          <polygon
            points="520,680 380,960 660,960"
            fill="url(#prismGlass)"
            stroke="#E0F2FE"
            strokeWidth="3.5"
            filter="drop-shadow(0 0 20px rgba(56,189,248,0.35))"
          />
          {/* Internal reflection edge highlights */}
          <line x1="520" y1="680" x2="380" y2="960" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
          <text x="520" y="990" fill="#94A3B8" fontSize="22" fontWeight="700" textAnchor="middle">
            Glass Triangular Prism
          </text>

          {/* 7 Refracted Spectral Color Rays Emerging from Prism Right Face (x:560, y:840) */}
          {SPECTRUM_COLORS.map((spec, idx) => {
            const startX = 560;
            const startY = 820 + idx * 7;
            const targetX = 960;
            const targetY = 700 + idx * 80;

            const currentX = startX + (targetX - startX) * spectrumProgress;
            const currentY = startY + (targetY - startY) * spectrumProgress;

            return (
              <g key={spec.name} opacity={spectrumProgress}>
                {/* Glow band */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={currentX}
                  y2={currentY}
                  stroke={spec.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="url(#laserGlow)"
                  opacity="0.8"
                />
                {/* Bright core ray */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={currentX}
                  y2={currentY}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                {/* Color Dot at end */}
                <circle cx={currentX} cy={currentY} r="7" fill={spec.color} filter="url(#laserGlow)" />
              </g>
            );
          })}
        </svg>

        {/* 7 Color Spectrum Vertical Legend Cards (Right / Lower Area) */}
        <div
          style={{
            position: "absolute",
            top: 1040,
            left: 72,
            right: 72,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            opacity: spectrumProgress,
            transform: `translateY(${interpolate(ev2Spr, [0, 1], [30, 0])}px)`,
            zIndex: 20,
          }}
        >
          {SPECTRUM_COLORS.map((spec, i) => (
            <div
              key={spec.name}
              style={{
                backgroundColor: "rgba(15,23,42,0.8)",
                backdropFilter: "blur(12px)",
                border: `1.5px solid ${spec.color}60`,
                borderRadius: 16,
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: `0 4px 16px ${spec.color}20`,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: spec.color,
                  boxShadow: `0 0 10px ${spec.color}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF" }}>
                  {i + 1}. {spec.name}
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>
                  {spec.wavelength}
                </div>
              </div>
            </div>
          ))}

          {/* Summary Callout Banner */}
          <div
            style={{
              gridColumn: "span 2",
              backgroundColor: "rgba(30,41,59,0.7)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "12px 20px",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 600,
              color: "#F8FAFC",
            }}
          >
            🌈 ROYGBIV: Red refracts least (longest wave); Violet refracts most (shortest wave).
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};

