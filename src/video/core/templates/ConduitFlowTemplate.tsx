import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  FiberOpticCore,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const ConduitFlowTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Internal Reflection & Conduit Transport",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Conduit Transmission";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const conduit = visualData.conduit || {
    channelType: "Optical Fiber Glass Core",
    speed: "200,000 km/s",
    coreMaterial: "Pure Silica Glass (n = 1.48)",
    packets: [
      { id: "pkt-1", label: "Voice Packet A", color: "#38BDF8" },
      { id: "pkt-2", label: "Voice Packet B", color: "#10B981" },
    ],
    routingNodes: [
      { id: "node-1", label: "Switch Router A", sublabel: "Ingress", status: "Active" },
      { id: "node-2", label: "Switch Router B", sublabel: "Egress", status: "Forwarding" },
    ],
  };

  const headerCategory = visualData.headerBadge?.category ?? "TOTAL INTERNAL REFLECTION & CONDUIT ROUTING";
  const headerIcon = visualData.headerBadge?.icon ?? "⚡";
  const headerColor = visualData.headerBadge?.color ?? "#F59E0B";

  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "MEDIUM SPEED", value: "200,000", unit: "km/s", color: "#F59E0B", statusText: "Silica Glass (2/3 c)" },
        { label: "INDEX RATIO", value: "n1 > n2", color: "#38BDF8", statusText: "Zero Light Leakage" },
        { label: "ROUTING NODES", value: "SYNCHRONIZED", color: "#10B981", statusText: "Global Packet Transit" },
      ];

  const lightPulseProgress = (frame * 5) % 860;

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

          {/* Conduit / Waveguide Core Stage */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 72,
              right: 72,
              height: 540,
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.98))",
              borderRadius: 36,
              border: "2px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              padding: "30px 36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "#F59E0B", fontSize: 16, fontWeight: 700, letterSpacing: "0.08em" }}>
                  INTERNAL REFLECTION WAVEGUIDE
                </span>
                <div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                  {conduit.channelType}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1.5px solid #F59E0B",
                  borderRadius: 14,
                  padding: "8px 18px",
                  color: "#F59E0B",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                SPEED: {conduit.speed}
              </div>
            </div>

            {/* Fiber / Conduit Cross-section SVG */}
            <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiberOpticCore frame={frame} width={860} height={240} />
            </div>

            {/* Routing Switching Nodes Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: 16,
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ color: "#94A3B8", fontSize: 14 }}>ROUTING NODE:</span>
                <span style={{ color: "#38BDF8", fontSize: 15, fontWeight: 700 }}>
                  {conduit.routingNodes ? conduit.routingNodes[0]?.label : "Transit Switch"}
                </span>
              </div>
              <div style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>
                CRITICAL ANGLE (θ_c): 100% INTERNAL RETENTION
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="⚡"
          category="CONDUIT PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
