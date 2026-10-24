import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const ClosedLoopSystemTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Closed-Loop Feedback System",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Closed-Loop System";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const objects = scene.objects;
  const loop = visualData.closedLoop || {
    loopTitle: "Continuous Full-Duplex Cycle",
    nodeA: {
      label: objects[0]?.label || "Origin Entity",
      role: "Transmitter / Sensor",
      icon: "👤",
      color: "#38BDF8",
    },
    nodeB: {
      label: objects[1]?.label || "Target Entity",
      role: "Receiver / Actuator",
      icon: "👥",
      color: "#10B981",
    },
    forwardPath: { label: "Forward Data Link", type: "Transmission Flow" },
    returnPath: { label: "Return Feedback Link", type: "Continuous Duplex" },
  };

  const headerCategory = visualData.headerBadge?.category ?? "CLOSED-LOOP FEEDBACK & CONTINUOUS CYCLE";
  const headerIcon = visualData.headerBadge?.icon ?? "🔄";
  const headerColor = visualData.headerBadge?.color ?? "#10B981";

  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "DUPLEX MODE", value: "FULL DUPLEX", color: "#10B981", statusText: "Simultaneous 2-Way" },
        { label: "PACKET SYNC", value: "< 50", unit: "ms", color: "#38BDF8", statusText: "Zero Perceived Delay" },
        { label: "SYSTEM CYCLE", value: "CONTINUOUS", color: "#F59E0B", statusText: "Infinite Loop" },
      ];

  const loopProgress = (frame * 4) % 360;

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

          {/* Closed-Loop Graphic Container */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 72,
              right: 72,
              height: 540,
              background: "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.98) 100%)",
              borderRadius: 36,
              border: "2px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              padding: "32px 36px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {/* SVG Connecting Bidirectional Curved Arrows */}
            <svg
              width="100%"
              height="100%"
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              {/* Upper Forward Path */}
              <path
                d="M 220 220 Q 468 120 716 220"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
              {/* Lower Return Path */}
              <path
                d="M 716 320 Q 468 420 220 320"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
              {/* Moving Pulse Packet Forward */}
              <circle
                cx={220 + (716 - 220) * ((loopProgress % 180) / 180)}
                cy={220 - Math.sin(((loopProgress % 180) / 180) * Math.PI) * 100}
                r="8"
                fill="#38BDF8"
                filter="drop-shadow(0 0 10px #38BDF8)"
              />
              {/* Moving Pulse Packet Return */}
              <circle
                cx={716 - (716 - 220) * ((loopProgress % 180) / 180)}
                cy={320 + Math.sin(((loopProgress % 180) / 180) * Math.PI) * 100}
                r="8"
                fill="#10B981"
                filter="drop-shadow(0 0 10px #10B981)"
              />
            </svg>

            {/* Node A */}
            <div style={{ width: 240, textAlign: "center", zIndex: 10 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 30,
                  background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.9))",
                  border: `2px solid ${loop.nodeA.color || "#38BDF8"}`,
                  margin: "0 auto 16px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 50,
                  boxShadow: `0 0 35px ${loop.nodeA.color || "#38BDF8"}44`,
                }}
              >
                {loop.nodeA.icon || "👤"}
              </div>
              <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 800 }}>{loop.nodeA.label}</div>
              <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{loop.nodeA.role}</div>
            </div>

            {/* Center Dynamic Loop Badge */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                border: "2px solid rgba(16, 185, 129, 0.4)",
                borderRadius: 24,
                padding: "20px 28px",
                textAlign: "center",
                backdropFilter: "blur(14px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                zIndex: 10,
              }}
            >
              <div style={{ fontSize: 36 }}>🔄</div>
              <div style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 800, marginTop: 8 }}>
                {loop.loopTitle}
              </div>
              <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                ZERO-LATENCY FEEDBACK
              </div>
            </div>

            {/* Node B */}
            <div style={{ width: 240, textAlign: "center", zIndex: 10 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 30,
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.9))",
                  border: `2px solid ${loop.nodeB.color || "#10B981"}`,
                  margin: "0 auto 16px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 50,
                  boxShadow: `0 0 35px ${loop.nodeB.color || "#10B981"}44`,
                }}
              >
                {loop.nodeB.icon || "👥"}
              </div>
              <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 800 }}>{loop.nodeB.label}</div>
              <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{loop.nodeB.role}</div>
            </div>
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="🔄"
          category="CYCLE PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
