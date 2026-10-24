import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  RadioTowerAntenna,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const WaveTransmissionTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Wave Radiation & Wireless Transmission",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Wave Transmission";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const objects = scene.objects;
  const transmission = visualData.transmission || {
    source: {
      label: objects[0]?.label || "Phone RF Antenna",
      sublabel: "Emitter Source",
      icon: "📱",
      color: "#38BDF8",
    },
    waveType: "rf" as const,
    carrierFrequency: "2.4 GHz",
    propagationMedium: "Atmospheric Air",
    waveColor: "#38BDF8",
    receiver: {
      label: objects[1]?.label || "Cellular Base Station",
      sublabel: "Mast Receiver",
      icon: "🗼",
      color: "#10B981",
    },
  };

  const headerCategory = visualData.headerBadge?.category ?? "ELECTROMAGNETIC WAVE PROPAGATION";
  const headerIcon = visualData.headerBadge?.icon ?? "📡";
  const headerColor = visualData.headerBadge?.color ?? "#38BDF8";

  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "CARRIER FREQ", value: transmission.carrierFrequency || "GIGAHERTZ", color: "#38BDF8", statusText: "Electromagnetic Wave" },
        { label: "SPEED", value: "300,000", unit: "km/s", color: "#10B981", statusText: "Speed of Light in Air" },
        { label: "CHANNEL", value: "UPLINK", color: "#F59E0B", statusText: "Direct Line-of-Sight" },
      ];

  const waveOffset1 = (frame * 3) % 180;
  const waveOffset2 = (frame * 3 + 60) % 180;
  const waveOffset3 = (frame * 3 + 120) % 180;

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme={theme} showGrid>
        <HUDHeaderPill
          icon={headerIcon}
          category={headerCategory}
          color={headerColor}
          borderColor={`${headerColor}66`}
        />

        {/* Hero Visual Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 0,
            width: 1080,
            height: 1140,
            opacity: contentOpacity,
          }}
        >
          {/* Telemetry Gauges */}
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
            {metrics.slice(0, 3).map((m, idx) => (
              <MetricHUDGauge
                key={idx}
                label={m.label}
                value={m.value}
                unit={m.unit}
                color={m.color || headerColor}
                statusText={m.statusText}
                width={280}
              />
            ))}
          </div>

          {/* Emitter, Wavefield, and Receiver Stage */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 72,
              right: 72,
              height: 540,
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))",
              borderRadius: 36,
              border: "2px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              padding: "36px 40px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {/* Background SVG Radiation Waves */}
            <svg
              width="100%"
              height="100%"
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              {[waveOffset1, waveOffset2, waveOffset3].map((r, i) => (
                <circle
                  key={i}
                  cx="160"
                  cy="270"
                  r={Math.max(10, r * 2.8)}
                  fill="none"
                  stroke={transmission.waveColor || "#38BDF8"}
                  strokeWidth="2.5"
                  opacity={Math.max(0, 1 - (r * 2.8) / 540)}
                  strokeDasharray="6 4"
                />
              ))}
            </svg>

            {/* Left: Emitter Device / Source */}
            <div style={{ width: 260, textAlign: "center", zIndex: 10 }}>
              <div
                style={{
                  width: 120,
                  height: 180,
                  borderRadius: 24,
                  background: "linear-gradient(145deg, #1E293B, #0F172A)",
                  border: `2px solid ${transmission.source.color || "#38BDF8"}`,
                  margin: "0 auto 16px auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 35px ${transmission.source.color || "#38BDF8"}44`,
                  position: "relative",
                }}
              >
                {/* Antenna tip glow */}
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#38BDF8",
                    boxShadow: "0 0 15px #38BDF8",
                  }}
                />
                <div style={{ fontSize: 44 }}>{transmission.source.icon || "📱"}</div>
                <div style={{ color: "#38BDF8", fontSize: 13, fontWeight: 700, marginTop: 10 }}>EMITTING</div>
              </div>
              <div style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 700 }}>{transmission.source.label}</div>
              <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{transmission.source.sublabel}</div>
            </div>

            {/* Middle: Frequency & Wave Characteristics Info Pill */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: "1.5px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 20,
                padding: "16px 24px",
                textAlign: "center",
                backdropFilter: "blur(12px)",
                zIndex: 10,
              }}
            >
              <div style={{ color: "#94A3B8", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em" }}>WAVE PROPAGATION</div>
              <div style={{ color: "#38BDF8", fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {transmission.carrierFrequency || "GIGAHERTZ"}
              </div>
              <div style={{ color: "#10B981", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                {transmission.propagationMedium || "Free Space / Air"}
              </div>
            </div>

            {/* Right: Receiver Antenna / Target */}
            <div style={{ width: 260, textAlign: "center", zIndex: 10 }}>
              <div
                style={{
                  width: 160,
                  height: 220,
                  margin: "0 auto 12px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {transmission.waveType === "rf" ? (
                  <RadioTowerAntenna frame={frame} width={150} height={210} />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 180,
                      borderRadius: 24,
                      background: "linear-gradient(145deg, #1E293B, #0F172A)",
                      border: `2px solid ${transmission.receiver.color || "#10B981"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 35px ${transmission.receiver.color || "#10B981"}44`,
                    }}
                  >
                    <div style={{ fontSize: 44 }}>{transmission.receiver.icon || "🎯"}</div>
                    <div style={{ color: transmission.receiver.color || "#10B981", fontSize: 13, fontWeight: 700, marginTop: 10 }}>
                      RECEIVING
                    </div>
                  </div>
                )}
              </div>
              <div style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 700 }}>{transmission.receiver.label}</div>
              <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{transmission.receiver.sublabel}</div>
            </div>
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="📡"
          category="WAVE PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
