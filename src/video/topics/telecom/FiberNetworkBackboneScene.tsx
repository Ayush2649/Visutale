import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  FiberOpticCore,
} from "../../core/primitives/index.js";

export const FiberNetworkBackboneScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Underground Fiber Optic Backbone",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <CinematicEnvironment theme="tech-dark" showGrid>
        <HUDHeaderPill
          icon="💡"
          category="STEP 4: NATIONAL FIBER-OPTIC BACKBONE NETWORK"
          color="#F43F5E"
          borderColor="rgba(244, 63, 94, 0.4)"
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
            <MetricHUDGauge label="PROPAGATION SPEED" value="200,000" unit="km/s" color="#F43F5E" statusText="Light in Silica Glass" width={280} />
            <MetricHUDGauge label="NETWORK CORE" value="100" unit="Gbps" color="#38BDF8" statusText="DWDM Optical Channels" width={280} />
            <MetricHUDGauge label="ROUTER HOPS" value="4" unit="nodes" color="#10B981" statusText="Packet Switching" width={280} />
          </div>

          {/* Main Visual: Network Topology + Fiber Optic Cutaway */}
          <div
            style={{
              position: "absolute",
              top: 150,
              left: 72,
              right: 72,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
            }}
          >
            {/* Upper: Fiber Cable Cutaway with Total Internal Reflection */}
            <FiberOpticCore
              frame={frame}
              width={936}
              height={280}
              pulseColor="#F43F5E"
              speed={16}
            />

            {/* Lower: Network Infrastructure Routers across Cities */}
            <div
              style={{
                width: 936,
                height: 250,
                background: "rgba(15, 23, 42, 0.8)",
                borderRadius: 24,
                border: "1.5px solid rgba(244, 63, 94, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                padding: "20px 24px",
                boxSizing: "border-box",
                boxShadow: "0 14px 35px rgba(0,0,0,0.4)",
              }}
            >
              {[
                { name: "ORIGIN TOWER", sub: "Mumbai Base Station", icon: "🗼" },
                { name: "REGIONAL HUB", sub: "Packet Switch Router", icon: "🔀" },
                { name: "BACKBONE TRUNK", sub: "Underground Optical Fiber", icon: "🌐" },
                { name: "DESTINATION TOWER", sub: "Delhi Base Station", icon: "📡" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      background: "rgba(244, 63, 94, 0.15)",
                      border: "1.5px solid #F43F5E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      boxShadow: "0 0 16px rgba(244, 63, 94, 0.3)",
                    }}
                  >
                    {step.icon}
                  </div>
                  <div style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 800, marginTop: 10 }}>{step.name}</div>
                  <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>{step.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="💡"
          title="Light Pulses Travel Through Underground Glass"
          description={scene.purpose || "The cell tower connects to underground fiber-optic cables, shooting laser pulses through glass strands thousands of miles across the country in just a few milliseconds."}
          accentColor="#F43F5E"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};

