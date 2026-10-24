import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  RadioTowerAntenna,
} from "../../core/primitives/index.js";

export const CellTowerTransmissionScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Radio Wave Transmission to Cell Tower",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);
  const rfPulseLoop = (frame * 8) % 360;

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
          icon="📡"
          category="STEP 3: PHONE RF ANTENNA → CELLULAR BASE TOWER"
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
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
            <MetricHUDGauge label="CARRIER FREQUENCY" value="2.1" unit="GHz" color="#38BDF8" statusText="Electromagnetic Wave" width={280} />
            <MetricHUDGauge label="TOWER DISTANCE" value="1.8" unit="km" color="#10B981" statusText="Nearest Base Station" width={280} />
            <MetricHUDGauge label="SIGNAL POWER" value="-68" unit="dBm" color="#F59E0B" statusText="Optimal RF Link" width={280} />
          </div>

          {/* Main Visual: Phone on Left transmitting to Cell Tower on Right */}
          <div
            style={{
              position: "absolute",
              top: 160,
              left: 72,
              right: 72,
              height: 580,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left: Smartphone Transmitter */}
            <div
              style={{
                width: 280,
                height: 480,
                borderRadius: 32,
                background: "linear-gradient(145deg, #1E293B, #0F172A)",
                border: "2px solid #38BDF8",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 20px",
                boxSizing: "border-box",
                boxShadow: "0 18px 40px rgba(56, 189, 248, 0.2)",
                zIndex: 15,
              }}
            >
              <div style={{ color: "#38BDF8", fontSize: 14, fontWeight: 800 }}>TRANSMITTING RF</div>
              <div style={{ fontSize: 52 }}>📱</div>
              <div
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 14,
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700 }}>Internal Antenna</div>
                <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>Modulates digital bits</div>
              </div>
            </div>

            {/* Middle: Propagating Electromagnetic Waves SVG */}
            <svg
              style={{
                position: "absolute",
                left: 260,
                width: 360,
                height: 480,
                overflow: "visible",
                zIndex: 10,
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const waveX = (rfPulseLoop + i * 72) % 360;
                const op = interpolate(waveX, [0, 60, 300, 360], [0, 0.9, 0.7, 0]);
                const waveHeight = interpolate(waveX, [0, 360], [40, 280]);
                return (
                  <path
                    key={i}
                    d={`M ${waveX} ${240 - waveHeight / 2} Q ${waveX + 25} 240 ${waveX} ${240 + waveHeight / 2}`}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={op}
                    style={{ filter: "drop-shadow(0 0 8px #38BDF8)" }}
                  />
                );
              })}
            </svg>

            {/* Right: Cellular Base Station Tower */}
            <div style={{ width: 320, height: 540, zIndex: 15 }}>
              <RadioTowerAntenna
                frame={frame}
                width={320}
                height={540}
                isTransmitting={true}
              />
            </div>
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="📡"
          title="Radio Waves Carry Data Through the Air"
          description={scene.purpose || "The phone's internal antenna converts the digital bits into high-frequency radio waves, beaming them across the neighborhood to a nearby cellular tower."}
          accentColor="#38BDF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
