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

export const ConceptHookTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Educational Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? topic;
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  // Telemetry metrics: either from visualData or derived from scene objects
  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "TOPIC DOMAIN", value: "SCIENCE", unit: "", color: "#38BDF8", statusText: "Concept Explainer" },
        { label: "TARGET TIME", value: "60", unit: "SEC", color: "#10B981", statusText: "Paced Breakdown" },
        { label: "PRECISION", value: "HIGH", unit: "", color: "#F59E0B", statusText: "Data-Driven" },
      ];

  // Header pill data
  const category = visualData.headerBadge?.category ?? "CONCEPT HOOK & INTRODUCTION";
  const icon = visualData.headerBadge?.icon ?? "🎯";
  const headerColor = visualData.headerBadge?.color ?? "#38BDF8";

  // Nodes: either 2 locations/entities across space, or central subject
  const objects = scene.objects;
  const nodeA = objects[0] ? objects[0].label : "Origin Node";
  const nodeB = objects[1] ? objects[1].label : (objects.length === 1 ? null : "Target Node");

  // Animated arc progress
  const arcProgress = interpolate((frame * 2.5) % 120, [0, 100], [0, 1], { extrapolateRight: "clamp" });
  const pulseLoop = (frame * 6) % 360;

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
          icon={icon}
          category={category}
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

          {/* Dynamic Graphic: Dual Node Spatial Connection OR Hero Subject Orbit */}
          {nodeB ? (
            <div
              style={{
                position: "absolute",
                top: 180,
                left: 72,
                right: 72,
                height: 520,
                background: "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)",
                borderRadius: 36,
                border: "2px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 0 40px rgba(56, 189, 248, 0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "36px 48px",
                overflow: "hidden",
              }}
            >
              {/* Background Coordinate Grid & Radar Rings */}
              <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, opacity: 0.25 }}
              >
                <circle cx="20%" cy="50%" r="90" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="80%" cy="50%" r="90" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
                {/* Dynamic Connection Arc */}
                <path
                  d="M 180 260 Q 468 100 756 260"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
                <path
                  d="M 180 260 Q 468 100 756 260"
                  fill="none"
                  stroke={headerColor}
                  strokeWidth="4"
                  strokeDasharray={`${arcProgress * 650} 650`}
                />
                {/* Moving Pulse Packet */}
                <circle
                  cx={180 + (756 - 180) * arcProgress}
                  cy={260 - Math.sin(arcProgress * Math.PI) * 160}
                  r="9"
                  fill="#FFFFFF"
                  filter="drop-shadow(0 0 12px #38BDF8)"
                />
              </svg>

              {/* Spatial Nodes */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, marginTop: 40 }}>
                {/* Node A */}
                <div style={{ textAlign: "center", width: 260 }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 28,
                      background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.9))",
                      border: "2px solid #38BDF8",
                      margin: "0 auto 16px auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 44,
                      boxShadow: "0 0 25px rgba(56, 189, 248, 0.4)",
                    }}
                  >
                    📍
                  </div>
                  <div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 700 }}>{nodeA}</div>
                  <div style={{ color: "#94A3B8", fontSize: 18, marginTop: 4 }}>ORIGIN ENTITY</div>
                </div>

                {/* Central Distance Badge */}
                <div
                  style={{
                    background: "rgba(15, 23, 42, 0.85)",
                    border: "1.5px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 20,
                    padding: "12px 24px",
                    textAlign: "center",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ color: "#94A3B8", fontSize: 14, fontWeight: 600, letterSpacing: "0.1em" }}>SPATIAL CARRIER</div>
                  <div style={{ color: headerColor, fontSize: 22, fontWeight: 800, marginTop: 2 }}>⚡ HIGH SPEED LINK</div>
                </div>

                {/* Node B */}
                <div style={{ textAlign: "center", width: 260 }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 28,
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.9))",
                      border: "2px solid #10B981",
                      margin: "0 auto 16px auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 44,
                      boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
                    }}
                  >
                    🎯
                  </div>
                  <div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 700 }}>{nodeB}</div>
                  <div style={{ color: "#94A3B8", fontSize: 18, marginTop: 4 }}>DESTINATION</div>
                </div>
              </div>

              {/* Bottom telemetry footer */}
              <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, zIndex: 10 }}>
                <span style={{ color: "#94A3B8", fontSize: 16 }}>LATENCY: <strong style={{ color: "#10B981" }}>SYNCHRONIZED</strong></span>
                <span style={{ color: "#94A3B8", fontSize: 16 }}>MEDIUM: <strong style={{ color: "#38BDF8" }}>PHYSICAL & DIGITAL</strong></span>
                <span style={{ color: "#94A3B8", fontSize: 16 }}>CHANNEL: <strong style={{ color: "#F59E0B" }}>ACTIVE DUPLEX</strong></span>
              </div>
            </div>
          ) : (
            /* Single Subject Focus Hero Orbit */
            <div
              style={{
                position: "absolute",
                top: 180,
                left: 72,
                right: 72,
                height: 520,
                background: "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)",
                borderRadius: 36,
                border: "2px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Pulsing Radar Aura */}
              <div
                style={{
                  position: "absolute",
                  width: 340,
                  height: 340,
                  borderRadius: "50%",
                  border: `2px dashed ${headerColor}66`,
                  transform: `rotate(${pulseLoop}deg)`,
                }}
              />
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${headerColor}44 0%, rgba(15,23,42,0.9) 75%)`,
                  border: `3px solid ${headerColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                  boxShadow: `0 0 50px ${headerColor}66`,
                  zIndex: 10,
                }}
              >
                {icon}
              </div>
              <div style={{ color: "#F8FAFC", fontSize: 32, fontWeight: 800, marginTop: 24, zIndex: 10 }}>
                {nodeA}
              </div>
              <div style={{ color: "#94A3B8", fontSize: 20, marginTop: 6, zIndex: 10 }}>
                {subtitle}
              </div>
            </div>
          )}
        </div>

        {/* Secondary Pedagogy Callout */}
        <SafeCalloutCard
          icon="💡"
          category="CORE PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
