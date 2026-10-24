import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import { SafeCalloutCard } from "../../core/primitives/index.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const BatteryStorageScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Energy Storage: Batteries for Nighttime Power",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Save Energy with Battery Storage";
  const subtitle = scene.onScreenText[1] ?? "Store surplus daytime solar power to run your home at night";

  // Event 1: Sun begins to set (cue: "When sunlight fades")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Battery storage saves energy for later (cue: "save some energy for later")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 35;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  // Dynamic sunset & battery charge level
  const sunsetTransition = interpolate(ev1Spr, [0, 1], [0, 1]);
  const batteryCharging = interpolate(ev2Spr, [0, 1], [0.35, 1]);
  const sunY = interpolate(sunsetTransition, [0, 1], [180, 360]);

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
        }}
      >
        {/* Daytime Sky Base */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #0284C7 0%, #38BDF8 45%, #FDE047 75%, #0B0F19 100%)",
            opacity: 1 - sunsetTransition,
          }}
        />
        {/* Twilight / Sunset Sky Layer (Crossfades in) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #0F172A 0%, #7C2D12 45%, #EA580C 75%, #0B0F19 100%)",
            opacity: sunsetTransition,
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
            border: "1px solid rgba(245, 158, 11, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 24 }}>🔋</span>
          <span style={{ color: "#FBBF24", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Energy Storage & Continuity
          </span>
        </div>

        {/* Setting Sun on Horizon */}
        <div
          style={{
            position: "absolute",
            top: sunY,
            left: 120,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 40%, #FEF08A 0%, #F59E0B 60%, #DC2626 100%)",
            boxShadow: "0 0 80px rgba(234, 88, 12, 0.8)",
            opacity: interpolate(sunsetTransition, [0, 1], [0.95, 0.5]),
          }}
        />

        {/* Main Central Stage: High-Capacity Home Battery System */}
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
              <linearGradient id="batteryChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <filter id="batteryGlow">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Battery Enclosure (Modern Wall Pack) */}
            <rect
              x="260"
              y="80"
              width="400"
              height="620"
              rx="28"
              fill="url(#batteryChassis)"
              stroke="#10B981"
              strokeWidth="4"
              filter="url(#batteryGlow)"
            />

            {/* Battery Brand / Header Badge */}
            <rect x="310" y="110" width="300" height="45" rx="12" fill="#022C22" stroke="#059669" strokeWidth="2" />
            <text x="460" y="140" fill="#34D399" fontSize="20" fontWeight="800" textAnchor="middle">
              LITHIUM-ION HOME STORAGE
            </text>

            {/* Battery Cell Stacks (4 Individual Energy Blocks) */}
            {Array.from({ length: 4 }).map((_, i) => {
              const cellY = 560 - i * 95;
              const cellThreshold = (i + 1) * 0.25;
              const isFilled = batteryCharging >= cellThreshold;
              const fillProgress = Math.min(1, Math.max(0, (batteryCharging - i * 0.25) / 0.25));

              return (
                <g key={i}>
                  {/* Cell Cavity */}
                  <rect
                    x="300"
                    y={cellY}
                    width="320"
                    height="75"
                    rx="12"
                    fill="#0F172A"
                    stroke="#334155"
                    strokeWidth="2"
                  />

                  {/* Active Glowing Charge Fill */}
                  <rect
                    x="305"
                    y={cellY + 5}
                    width={310 * fillProgress}
                    height="65"
                    rx="8"
                    fill={isFilled ? "#10B981" : "#059669"}
                    opacity={0.85 + Math.sin((frame + i * 15) * 0.1) * 0.15}
                  />

                  {/* Text indicator per cell */}
                  <text x="460" y={cellY + 45} fill="#FFFFFF" fontSize="18" fontWeight="700" textAnchor="middle">
                    MODULE {4 - i}: {isFilled ? "CHARGED" : `${Math.round(fillProgress * 100)}%`}
                  </text>
                </g>
              );
            })}

            {/* Digital Energy Meter Display */}
            <g transform="translate(310, 180)">
              <rect x="0" y="0" width="300" height="90" rx="16" fill="#020617" stroke="#10B981" strokeWidth="2" />
              <text x="25" y="35" fill="#34D399" fontSize="16" fontWeight="700">
                TOTAL STATE OF CHARGE
              </text>
              <text x="25" y="75" fill="#10B981" fontSize="38" fontWeight="900" letterSpacing="0.05em">
                {Math.round(batteryCharging * 100)}%
              </text>
              <text x="220" y="70" fill="#FBBF24" fontSize="18" fontWeight="800">
                13.5 kWh
              </text>
            </g>

            {/* Dual Status Pill: Day Charging vs Night Discharging */}
            <g transform="translate(460, 750)">
              <rect x="-180" y="-30" width="360" height="60" rx="30" fill="rgba(15,23,42,0.9)" stroke="#38BDF8" strokeWidth="2" />
              <text x="0" y="8" fill="#38BDF8" fontSize="20" fontWeight="800" textAnchor="middle">
                {sunsetTransition > 0.5 ? "🌙 Discharging to Home Circuit" : "☀️ Storing Surplus Daytime Energy"}
              </text>
            </g>
          </svg>
        </div>

        {/* Collision-Safe Narrative Callout Card */}
        <SafeCalloutCard
          category="24/7 Clean Power"
          categoryColor="#FBBF24"
          icon="🌙"
          title={subtitle}
          borderColor="rgba(245, 158, 11, 0.4)"
        />
      </div>
    </SceneContainer>
  );
};

