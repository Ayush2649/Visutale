import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const InverterHomeScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Inverter Conversion & Household Power",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Inverter: Powering Your Home";
  const subtitle = scene.onScreenText[1] ?? "Converts DC into alternating AC power to run home appliances";

  // Event 1: Inverter transforms DC to AC (cue: "An inverter changes the electricity")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Appliances power on - lights on, fan spinning (cue: "turn on lights, run a fan")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 35;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const inverterActive = interpolate(ev1Spr, [0, 1], [0.4, 1]);
  const appliancePower = interpolate(ev2Spr, [0, 1], [0, 1]);

  // Continuous fan rotation and light warmth
  const fanRotation = (frame * 14 * appliancePower) % 360;
  const acSineOffset = (frame * 0.2) % (Math.PI * 2);

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
          background: "linear-gradient(180deg, #020617 0%, #0F172A 40%, #1E1B4B 100%)",
        }}
      >
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
            border: "1px solid rgba(129, 140, 248, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 24 }}>🔄</span>
          <span style={{ color: "#A5B4FC", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Energy Transformation: DC ➔ AC (230V / 50Hz)
          </span>
        </div>

        {/* Dual Chamber Layout: Left Inverter & Right Home Interior */}
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
              <filter id="lightGlow">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="inverterMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* Left Section: Solar Inverter Unit */}
            <g transform="translate(60, 80)">
              {/* Outer Inverter Enclosure */}
              <rect x="0" y="0" width="360" height="520" rx="24" fill="url(#inverterMetal)" stroke="#6366F1" strokeWidth="4" />

              {/* Status Display Screen */}
              <rect x="30" y="40" width="300" height="130" rx="12" fill="#020617" stroke="#4F46E5" strokeWidth="2" />
              <text x="50" y="75" fill="#818CF8" fontSize="18" fontWeight="700">
                SOLAR INVERTER STATUS
              </text>
              <text x="50" y="115" fill="#38BDF8" fontSize="24" fontWeight="800">
                DC IN: 380V ➔ AC OUT: 230V
              </text>
              <text x="50" y="145" fill="#34D399" fontSize="18" fontWeight="600">
                ● GRID SYNCHRONIZED (50 Hz)
              </text>

              {/* DC Wave (Straight constant level) */}
              <g transform="translate(40, 220)">
                <rect x="0" y="0" width="120" height="80" rx="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
                <text x="60" y="24" fill="#38BDF8" fontSize="14" fontWeight="700" textAnchor="middle">
                  DIRECT (DC)
                </text>
                <line x1="20" y1="50" x2="100" y2="50" stroke="#38BDF8" strokeWidth="4" />
              </g>

              {/* Conversion Arrow */}
              <g transform="translate(180, 250)">
                <polygon points="0,-15 20,0 0,15" fill="#A5B4FC" />
                <polygon points="-10,-15 10,0 -10,15" fill="#6366F1" opacity="0.6" />
              </g>

              {/* AC Sine Wave (Oscillating) */}
              <g transform="translate(200, 220)">
                <rect x="0" y="0" width="120" height="80" rx="8" fill="#1E293B" stroke="#A855F7" strokeWidth="2" />
                <text x="60" y="24" fill="#A855F7" fontSize="14" fontWeight="700" textAnchor="middle">
                  ALTERNATING (AC)
                </text>
                {/* Dynamically flowing sine wave */}
                <path
                  d={`
                    M 20,${50 + Math.sin(acSineOffset) * 18} 
                    Q 40,${50 + Math.sin(acSineOffset + 1.5) * 22} 60,${50 + Math.sin(acSineOffset + 3.0) * 18} 
                    T 100,${50 + Math.sin(acSineOffset + 6.0) * 18}
                  `}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="4"
                />
              </g>

              {/* Cooling Vents & Active Heat Sinks */}
              {Array.from({ length: 5 }).map((_, vi) => (
                <line
                  key={vi}
                  x1="60"
                  y1={360 + vi * 20}
                  x2="300"
                  y2={360 + vi * 20}
                  stroke="#334155"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              ))}

              {/* Output Power Badge */}
              <rect x="60" y="460" width="240" height="40" rx="20" fill="#4338CA" />
              <text x="180" y="486" fill="#FFFFFF" fontSize="18" fontWeight="800" textAnchor="middle">
                ⚡ Output: Pure Sine Wave
              </text>
            </g>

            {/* Glowing Power Conduit Connecting Inverter to Living Room */}
            <path
              d="M 420,340 L 490,340 L 490,200 L 540,200"
              fill="none"
              stroke="#6366F1"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 420,340 L 490,340 L 490,200 L 540,200"
              fill="none"
              stroke="#FEF08A"
              strokeWidth="4"
              strokeDasharray="20 15"
              strokeDashoffset={-frame * 6}
              opacity={inverterActive}
              filter="url(#lightGlow)"
            />

            {/* Right Section: Home Living Room Interior */}
            <g transform="translate(520, 40)">
              {/* Room Background */}
              <rect x="0" y="0" width="380" height="600" rx="20" fill="#1E293B" stroke="#475569" strokeWidth="4" />
              <rect x="0" y="480" width="380" height="120" rx="0" fill="#0F172A" />

              {/* 1. Ceiling Pendant Light with Dynamic Warm Illumination */}
              {/* Hanging wire */}
              <line x1="120" y1="0" x2="120" y2="120" stroke="#94A3B8" strokeWidth="3" />
              {/* Lamp shade */}
              <polygon points="80,150 160,150 140,120 100,120" fill="#F59E0B" />
              {/* Light Bulb */}
              <circle cx="120" cy="160" r="16" fill={appliancePower > 0.5 ? "#FEF08A" : "#64748B"} />

              {/* Dynamic Cone of Light Illuminating the Room */}
              {appliancePower > 0.3 && (
                <polygon
                  points="120,165 20,480 240,480"
                  fill="url(#lightCone)"
                  opacity={appliancePower * 0.45}
                  filter="url(#lightGlow)"
                />
              )}

              {/* 2. Ceiling Fan Actively Spinning */}
              <g transform="translate(280, 110)">
                <line x1="0" y1="-110" x2="0" y2="0" stroke="#64748B" strokeWidth="4" />
                <circle cx="0" cy="0" r="18" fill="#0F172A" stroke="#CBD5E1" strokeWidth="3" />

                {/* Rotating Fan Blades */}
                <g transform={`rotate(${fanRotation})`}>
                  {/* Blade 1 */}
                  <rect x="-10" y="-75" width="20" height="65" rx="8" fill="#60A5FA" opacity="0.9" />
                  {/* Blade 2 */}
                  <rect x="-10" y="10" width="20" height="65" rx="8" fill="#60A5FA" opacity="0.9" />
                  {/* Blade 3 */}
                  <rect x="-75" y="-10" width="65" height="20" rx="8" fill="#60A5FA" opacity="0.9" />
                  {/* Blade 4 */}
                  <rect x="10" y="-10" width="65" height="20" rx="8" fill="#60A5FA" opacity="0.9" />
                </g>

                {/* Fan Motion Wind Indicator */}
                {appliancePower > 0.5 && (
                  <circle
                    cx="0"
                    cy="0"
                    r="85"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="25 20"
                    opacity="0.6"
                    transform={`rotate(${frame * 8})`}
                  />
                )}
                <text x="0" y="110" fill="#93C5FD" fontSize="16" fontWeight="700" textAnchor="middle">
                  Ceiling Fan Spinning
                </text>
              </g>

              {/* Living Room Furniture / Table */}
              <rect x="60" y="420" width="140" height="60" rx="6" fill="#334155" />
              <line x1="75" y1="480" x2="75" y2="520" stroke="#475569" strokeWidth="6" />
              <line x1="185" y1="480" x2="185" y2="520" stroke="#475569" strokeWidth="6" />

              {/* Interactive Label Cards */}
              <g transform="translate(40, 530)">
                <rect x="0" y="0" width="300" height="50" rx="12" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
                <text x="150" y="32" fill="#34D399" fontSize="18" fontWeight="800" textAnchor="middle">
                  ✓ Lights On & Fan Operating!
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="Appliance Operation"
          categoryColor="#818CF8"
          icon="💡"
          title={subtitle}
          borderColor="rgba(129, 140, 248, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

