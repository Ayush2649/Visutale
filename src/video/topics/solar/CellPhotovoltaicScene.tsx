import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const CellPhotovoltaicScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "The Photovoltaic Effect: Inside the Solar Cell",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Inside the Solar Cell";
  const subtitle = scene.onScreenText[1] ?? "Photons collide with atoms, knocking electrons free";

  // Event 1: Photons arrive (cue: "Sunlight carries tiny packets")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Electrons energized & pushed (cue: "electrons a push")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 40;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const photonProgress = interpolate(ev1Spr, [0, 1], [0, 1]);
  const electronExcitation = interpolate(ev2Spr, [0, 1], [0, 1]);

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
          background: "linear-gradient(180deg, #030712 0%, #0F172A 45%, #022C22 100%)",
        }}
      >
        {/* Background Energy Matrix */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)",
          }}
        />

        {/* Section Pill Badge */}
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
            border: "1px solid rgba(245, 158, 11, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 24 }}>⚛️</span>
          <span style={{ color: "#F59E0B", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Microscopic Cutaway: Silicon P-N Junction
          </span>
        </div>

        {/* Main Cutaway Stage SVG */}
        <div
          style={{
            position: "absolute",
            top: 240,
            left: "50%",
            transform: "translateX(-50%)",
            width: 960,
            height: 1100,
          }}
        >
          <svg viewBox="0 0 960 1100" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="nLayerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="pLayerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#831843" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#BE185D" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="depletionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <filter id="glowPhoton">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Top Metallic Contact Fingers */}
            <rect x="180" y="240" width="40" height="40" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
            <rect x="460" y="240" width="40" height="40" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
            <rect x="740" y="240" width="40" height="40" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />

            {/* Layer 1: N-Type Silicon (Phosphorus Doped) */}
            <rect x="100" y="280" width="760" height="200" rx="12" fill="url(#nLayerGrad)" stroke="#3B82F6" strokeWidth="3" />
            <text x="130" y="325" fill="#93C5FD" fontSize="22" fontWeight="800">
              N-TYPE SILICON LAYER (Negative Charges / Free Electrons)
            </text>

            {/* Layer 2: Central Depletion Zone / P-N Junction */}
            <rect x="100" y="480" width="760" height="130" fill="url(#depletionGrad)" stroke="#F59E0B" strokeWidth="2" strokeDasharray="8 6" />
            <text x="130" y="555" fill="#FEF08A" fontSize="20" fontWeight="800">
              ⚡ DEPLETION ZONE & BUILT-IN ELECTRIC FIELD
            </text>

            {/* Directional Electric Field Arrows */}
            {[260, 480, 700].map((arrowX) => (
              <g key={arrowX} opacity="0.8">
                <line x1={arrowX} y1="585" x2={arrowX} y2="505" stroke="#F59E0B" strokeWidth="4" />
                <polygon points={`${arrowX - 8},515 ${arrowX + 8},515 ${arrowX},500`} fill="#F59E0B" />
              </g>
            ))}

            {/* Layer 3: P-Type Silicon (Boron Doped) */}
            <rect x="100" y="610" width="760" height="260" rx="12" fill="url(#pLayerGrad)" stroke="#EC4899" strokeWidth="3" />
            <text x="130" y="660" fill="#FBCFE8" fontSize="22" fontWeight="800">
              P-TYPE SILICON LAYER (Positive Holes)
            </text>

            {/* Bottom Metal Contact Base */}
            <rect x="100" y="870" width="760" height="30" rx="4" fill="#64748B" stroke="#475569" strokeWidth="2" />
            <text x="480" y="892" fill="#E2E8F0" fontSize="18" fontWeight="700" textAnchor="middle">
              Back Metallic Electrode (+)
            </text>

            {/* Incoming Photons (Packets of Sunlight) */}
            {[
              { x: 260, delay: 0 },
              { x: 380, delay: 25 },
              { x: 520, delay: 10 },
              { x: 680, delay: 35 },
            ].map((p, idx) => {
              const photonCycle = (frame * 4 + p.delay) % 90;
              const curY = 60 + photonCycle * 4.5;
              const hasCollided = curY >= 480;

              return (
                <g key={idx} opacity={photonProgress}>
                  {/* Wavy photon trajectory line */}
                  <path
                    d={`M ${p.x - 15},${curY - 40} Q ${p.x + 15},${curY - 20} ${p.x - 15},${curY} Q ${p.x + 15},${curY + 20} ${p.x},${curY + 40}`}
                    stroke="#FBBF24"
                    strokeWidth="4"
                    fill="none"
                    filter="url(#glowPhoton)"
                  />
                  {/* Photon Core */}
                  <circle cx={p.x} cy={curY} r="10" fill="#FEF08A" filter="url(#glowPhoton)" />
                  <text x={p.x + 20} y={curY + 6} fill="#FEF08A" fontSize="16" fontWeight="800">
                    hν
                  </text>

                  {/* Impact Energy Burst when reaching Depletion Zone */}
                  {hasCollided && (
                    <circle
                      cx={p.x}
                      cy={545}
                      r={15 + Math.sin(frame * 0.2) * 10}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      opacity="0.8"
                    />
                  )}
                </g>
              );
            })}

            {/* Silicon Atoms & Electron Cloud Particles */}
            {/* Bound silicon atom nodes */}
            {[
              { cx: 220, cy: 380 }, { cx: 360, cy: 380 }, { cx: 500, cy: 380 }, { cx: 640, cy: 380 }, { cx: 780, cy: 380 },
              { cx: 220, cy: 740 }, { cx: 360, cy: 740 }, { cx: 500, cy: 740 }, { cx: 640, cy: 740 }, { cx: 780, cy: 740 },
            ].map((atom, i) => (
              <g key={i}>
                <circle cx={atom.cx} cy={atom.cy} r="20" fill="#0F172A" stroke="#60A5FA" strokeWidth="2" />
                <text x={atom.cx} y={atom.cy + 6} fill="#93C5FD" fontSize="16" fontWeight="bold" textAnchor="middle">
                  Si
                </text>
              </g>
            ))}

            {/* Energized Electrons (Moving upward to N-layer when pushed) */}
            {[
              { id: 1, homeX: 280, homeY: 530, destX: 200, destY: 250 },
              { id: 2, homeX: 420, homeY: 540, destX: 480, destY: 250 },
              { id: 3, homeX: 580, homeY: 525, destX: 480, destY: 250 },
              { id: 4, homeX: 720, homeY: 535, destX: 760, destY: 250 },
            ].map((e) => {
              const currentX = interpolate(electronExcitation, [0, 1], [e.homeX, e.destX]);
              const currentY = interpolate(electronExcitation, [0, 1], [e.homeY, e.destY]);
              const electronOscillation = Math.sin((frame + e.id * 20) * 0.15) * 8;

              return (
                <g key={e.id}>
                  {/* Trail line */}
                  <line
                    x1={e.homeX}
                    y1={e.homeY}
                    x2={currentX}
                    y2={currentY}
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity={electronExcitation * 0.7}
                  />

                  {/* Free Electron Sphere */}
                  <circle
                    cx={currentX + electronOscillation}
                    cy={currentY}
                    r="14"
                    fill="#38BDF8"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    filter="url(#glowPhoton)"
                  />
                  <text
                    x={currentX + electronOscillation}
                    y={currentY + 5}
                    fill="#0F172A"
                    fontSize="16"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    e⁻
                  </text>

                  {/* Positive Hole Left Behind in P Layer */}
                  <circle
                    cx={e.homeX}
                    cy={e.homeY + 180}
                    r="12"
                    fill="none"
                    stroke="#F472B6"
                    strokeWidth="3"
                    strokeDasharray="3 3"
                    opacity={electronExcitation}
                  />
                  <text
                    x={e.homeX}
                    y={e.homeY + 185}
                    fill="#F472B6"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    opacity={electronExcitation}
                  >
                    h⁺
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="Electron Excitation"
          categoryColor="#FBBF24"
          icon="⚡"
          title={subtitle}
          borderColor="rgba(245, 158, 11, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

