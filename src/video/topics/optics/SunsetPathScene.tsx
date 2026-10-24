import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const SunsetPathScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Longer Atmospheric Path at Sunset",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "The 10× Longer Path at Sunset";
  const subtitle = scene.onScreenText[1] ?? "Blue scatters out along the journey; Only red reaches your eyes";

  // Event 1: Sun approaches horizon, beam starts (cue: "At sunset, sunlight")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Long path penetration & blue depletion (cue: "much thicker layer")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 45;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const pathProgress = interpolate(ev1Spr, [0, 1], [0, 1]);
  const colorShiftProgress = interpolate(ev2Spr, [0, 1], [0, 1]);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
      backgroundColor="#090D1C"
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
              backgroundColor: "rgba(234,88,12,0.2)",
              border: "1px solid rgba(249,115,22,0.4)",
              padding: "6px 20px",
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 700,
              color: "#FB923C",
              marginBottom: 10,
            }}
          >
            Atmospheric Distance Factor
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

        {/* Planetary Geometry Diagram SVG */}
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
            {/* Earth Surface Gradient */}
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Atmosphere Layer Blue Glow */}
            <linearGradient id="atmoLayerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
            </linearGradient>

            {/* Color transformation gradient along sunset beam: White/Yellow -> Orange -> Deep Red */}
            <linearGradient id="sunsetBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>

            <filter id="pathGlow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ================= SECTION A: NOON PATH (SHORT 1X) ================= */}
          <g transform="translate(0, -60)">
            {/* Noon Sun (Overhead, at x: 260, y: 460) */}
            <circle cx="260" cy="480" r="34" fill="#FEF08A" filter="url(#pathGlow)" />
            <text x="260" y="430" fill="#FEF08A" fontSize="22" fontWeight="800" textAnchor="middle">
              Noon Sun (Overhead)
            </text>

            {/* Short Vertical Beam down to Ground */}
            <line
              x1="260"
              y1="514"
              x2="260"
              y2="660"
              stroke="#FEF08A"
              strokeWidth="10"
              strokeLinecap="round"
              filter="url(#pathGlow)"
            />
            <line x1="260" y1="514" x2="260" y2="660" stroke="#FFFFFF" strokeWidth="4" />

            {/* Path Length Badge: 1x */}
            <rect x="290" y="565" width="140" height="40" rx="10" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="360" y="591" fill="#38BDF8" fontSize="18" fontWeight="800" textAnchor="middle">
              Short Path (1×)
            </text>

            {/* Small ground observer at x: 260, y: 680 */}
            <circle cx="260" cy="670" r="10" fill="#E2E8F0" />
            <line x1="260" y1="680" x2="260" y2="705" stroke="#E2E8F0" strokeWidth="3" />
            <text x="260" y="735" fill="#94A3B8" fontSize="18" fontWeight="600" textAnchor="middle">
              Sunlight looks White/Yellow
            </text>
          </g>

          {/* Dividing dashed guide line */}
          <line x1="80" y1="720" x2="1000" y2="720" stroke="rgba(255,255,255,0.15)" strokeDasharray="6 6" />

          {/* ================= SECTION B: SUNSET PATH (LONG 10X) ================= */}
          {/* Earth Curved Ground Horizon (Lower Center arc) */}
          <path
            d="M 60 1480 Q 540 1340 1020 1480 L 1020 1920 L 60 1920 Z"
            fill="url(#groundGrad)"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* Atmosphere Curved Shell Boundary */}
          <path
            d="M 60 1140 Q 540 980 1020 1140"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3.5"
            strokeDasharray="10 8"
            opacity="0.8"
          />
          <text x="540" y="960" fill="#38BDF8" fontSize="22" fontWeight="800" textAnchor="middle">
            Atmosphere Outer Boundary (~100 km)
          </text>

          {/* Setting Sun at Far Left Horizon (x: 120, y: 1300) */}
          <g transform="translate(120, 1300)" opacity={pathProgress}>
            <circle cx="0" cy="0" r="54" fill="#F97316" filter="url(#pathGlow)" />
            <circle cx="0" cy="0" r="36" fill="#FBBF24" />
            <text x="0" y="80" fill="#FB923C" fontSize="22" fontWeight="800" textAnchor="middle">
              Setting Sun
            </text>
            <text x="0" y="105" fill="#94A3B8" fontSize="18" fontWeight="600" textAnchor="middle">
              (Low on Horizon)
            </text>
          </g>

          {/* Observer Standing on Earth (at x: 860, y: 1380) */}
          <g transform="translate(860, 1380)">
            <circle cx="0" cy="-24" r="14" fill="#FFFFFF" />
            <line x1="0" y1="-10" x2="0" y2="24" stroke="#FFFFFF" strokeWidth="4" />
            <line x1="0" y1="4" x2="-14" y2="18" stroke="#FFFFFF" strokeWidth="3.5" />
            <line x1="0" y1="4" x2="14" y2="18" stroke="#FFFFFF" strokeWidth="3.5" />
            <circle cx="0" cy="-24" r="28" fill="none" stroke="#F97316" strokeWidth="2" strokeDasharray="4 4" />
            <text x="0" y="60" fill="#FEF08A" fontSize="22" fontWeight="800" textAnchor="middle">
              Observer Eye
            </text>
          </g>

          {/* The 10x Long Atmospheric Path (Beam traveling from x: 174 to 860 at y: 1350) */}
          {(() => {
            const beamStartX = 174;
            const beamEndX = 850;
            const curEndX = beamStartX + (beamEndX - beamStartX) * pathProgress;

            return (
              <g opacity={pathProgress}>
                {/* Thick Atmospheric Light Highway */}
                <line
                  x1={beamStartX}
                  y1="1350"
                  x2={curEndX}
                  y2="1350"
                  stroke="url(#sunsetBeamGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  filter="url(#pathGlow)"
                />
                <line
                  x1={beamStartX}
                  y1="1350"
                  x2={curEndX}
                  y2="1350"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Blue light scattering away arrows along the corridor */}
                {[280, 420, 560, 680].map((scatX, i) => {
                  if (curEndX < scatX) return null;
                  return (
                    <g key={`blue-loss-${i}`} opacity={colorShiftProgress}>
                      {/* Upward blue scatter arrow */}
                      <line x1={scatX} y1="1340" x2={scatX} y2="1260" stroke="#38BDF8" strokeWidth="3" strokeDasharray="4 3" />
                      <polygon points={`${scatX - 5},1270 ${scatX},1255 ${scatX + 5},1270`} fill="#38BDF8" />
                      {/* Downward blue scatter arrow */}
                      <line x1={scatX} y1="1360" x2={scatX} y2="1420" stroke="#38BDF8" strokeWidth="3" strokeDasharray="4 3" />
                      <polygon points={`${scatX - 5},1410 ${scatX},1425 ${scatX + 5},1410`} fill="#38BDF8" />
                      <text x={scatX} y="1245" fill="#38BDF8" fontSize="14" fontWeight="700" textAnchor="middle">
                        Blue Scatters Out
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>

        {/* Quantitative Comparison Callout Cards (Bottom Area) */}
        <div
          style={{
            position: "absolute",
            bottom: 300,
            left: 72,
            right: 72,
            backgroundColor: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(14px)",
            border: "2px solid rgba(249,115,22,0.4)",
            borderRadius: 24,
            padding: "20px 28px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
            zIndex: 25,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: "#EA580C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#FFFFFF",
                }}
              >
                10×
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>
                  10× More Atmosphere Traversed
                </div>
                <div style={{ fontSize: 16, color: "#FED7AA", marginTop: 2 }}>
                  Over thousands of km, all blue light is scattered away.
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.25)",
                border: "1.5px solid #EF4444",
                borderRadius: 14,
                padding: "8px 18px",
                textAlign: "right",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FCA5A5" }}>Only Surviving Colors</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#EF4444" }}>RED & ORANGE</div>
            </div>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};

