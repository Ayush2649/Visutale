import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  AcousticWaveform,
} from "../../core/primitives/index.js";

export const CityCallHookScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "How Mobile Calls Travel Across Distance",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9 },
  });

  const cityAOpacity = interpolate(spr, [0, 1], [0, 1]);
  const arcProgress = interpolate(frame, [15, 60], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const pulseLoop = (frame * 12) % 800;

  // Arc path between City A (x=160, y=780) and City B (x=920, y=780) peaking at y=480
  const cityAX = 160;
  const cityBX = 920;
  const cityY = 780;
  const peakY = 460;
  const arcD = `M ${cityAX} ${cityY} Q ${(cityAX + cityBX) / 2} ${peakY} ${cityBX} ${cityY}`;

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme="tech-dark" showGrid>
        {/* Header Pill */}
        <HUDHeaderPill
          icon="📱"
          category="TELECOMMUNICATIONS & SIGNALS"
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
        />

        {/* Hero Visual Stage: 2-City Long-Distance Map */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: 0,
            width: 1080,
            height: 1140,
            opacity: cityAOpacity,
          }}
        >
          {/* Telemetry HUD Gauges */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 72,
              right: 72,
              display: "flex",
              justifyContent: "space-between",
              zIndex: 20,
            }}
          >
            <MetricHUDGauge label="DISTANCE" value="1,400" unit="km" color="#38BDF8" statusText="Mumbai ↔ Delhi" width={280} />
            <MetricHUDGauge label="LATENCY" value="42" unit="ms" color="#10B981" statusText="Speed of Light in Glass" width={280} />
            <MetricHUDGauge label="CHANNEL" value="4G / 5G" unit="LTE" color="#F59E0B" statusText="Full Duplex" width={280} />
          </div>

          <svg width={1080} height={1000} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#818CF8" stopOpacity={1} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.9} />
              </linearGradient>
              <filter id="glowArc">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Continental Horizon / Elevation Curve */}
            <path d="M 0 880 Q 540 850 1080 880 L 1080 1080 L 0 1080 Z" fill="#0B132B" opacity={0.7} />
            <path d="M 0 880 Q 540 850 1080 880" stroke="rgba(56, 189, 248, 0.25)" strokeWidth={2} fill="none" />

            {/* Long Distance Curved Telecommunication Link */}
            <path
              d={arcD}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth={4.5}
              strokeDasharray="1000"
              strokeDashoffset={1000 * (1 - arcProgress)}
              filter="url(#glowArc)"
            />

            {/* Kinetic Signal Packets traveling along the arc */}
            {arcProgress >= 0.8 &&
              [0, 260, 520].map((offset, i) => {
                const currentT = ((pulseLoop + offset) % 800) / 800;
                // Quadratic bezier formula
                const qx = (1 - currentT) * (1 - currentT) * cityAX + 2 * (1 - currentT) * currentT * ((cityAX + cityBX) / 2) + currentT * currentT * cityBX;
                const qy = (1 - currentT) * (1 - currentT) * cityY + 2 * (1 - currentT) * currentT * peakY + currentT * currentT * cityY;

                return (
                  <g key={i}>
                    <circle cx={qx} cy={qy} r={8} fill="#FFFFFF" style={{ filter: "drop-shadow(0 0 10px #38BDF8)" }} />
                    <circle cx={qx} cy={qy} r={14} fill="none" stroke="#38BDF8" strokeWidth={2} opacity={0.6} />
                  </g>
                );
              })}

            {/* City A: Mumbai Node */}
            <g transform={`translate(${cityAX}, ${cityY})`}>
              <circle cx={0} cy={0} r={48} fill="rgba(56, 189, 248, 0.15)" stroke="#38BDF8" strokeWidth={2.5} />
              <circle cx={0} cy={0} r={28} fill="#0F172A" stroke="#38BDF8" strokeWidth={2} />
              <text x={0} y={6} fill="#FFFFFF" fontSize={22} textAnchor="middle">📱</text>
              <text x={0} y={72} fill="#F8FAFC" fontSize={20} fontWeight={800} textAnchor="middle">MUMBAI</text>
              <text x={0} y={94} fill="#94A3B8" fontSize={14} fontWeight={600} textAnchor="middle">Caller (Audio In)</text>
            </g>

            {/* City B: Delhi Node */}
            <g transform={`translate(${cityBX}, ${cityY})`}>
              <circle cx={0} cy={0} r={48} fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" strokeWidth={2.5} />
              <circle cx={0} cy={0} r={28} fill="#0F172A" stroke="#10B981" strokeWidth={2} />
              <text x={0} y={6} fill="#FFFFFF" fontSize={22} textAnchor="middle">📱</text>
              <text x={0} y={72} fill="#F8FAFC" fontSize={20} fontWeight={800} textAnchor="middle">DELHI</text>
              <text x={0} y={94} fill="#94A3B8" fontSize={14} fontWeight={600} textAnchor="middle">Receiver (Audio Out)</text>
            </g>
          </svg>

          {/* Caller Sound Waves */}
          <AcousticWaveform
            frame={frame}
            originX={cityAX}
            originY={cityY - 30}
            baseRadius={35}
            maxRadius={140}
            direction="omnidirectional"
            color="#38BDF8"
          />
        </div>

        {/* Standard Safe Callout Card */}
        <SafeCalloutCard
          icon="🌐"
          title="Voice Across Thousands of Kilometers"
          description={scene.purpose || "How does your voice travel hundreds or thousands of miles in mere milliseconds?"}
          accentColor="#38BDF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};

