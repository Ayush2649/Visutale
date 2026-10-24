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
  VibratingDiaphragm,
} from "../../core/primitives/index.js";

export const MicrophoneAcousticScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Acoustic to Electrical Signal Conversion",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);
  const waveDisplacement = Math.sin(frame * 0.35) * 16;

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
          icon="🎙️"
          category="STEP 1: ACOUSTIC PRESSURE → ELECTRICAL VOLTAGE"
          color="#F59E0B"
          borderColor="rgba(245, 158, 11, 0.4)"
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
            <MetricHUDGauge label="PRESSURE WAVE" value="1.0" unit="kHz" color="#38BDF8" statusText="Vocal Cord Vibration" width={280} />
            <MetricHUDGauge label="MEMS GAP" value="1.25" unit="µm" color="#F59E0B" statusText="Variable Capacitance" width={280} />
            <MetricHUDGauge label="ANALOG OUTPUT" value={(0.45 + waveDisplacement * 0.02).toFixed(2)} unit="V" color="#10B981" statusText="Continuous Signal" width={280} />
          </div>

          {/* Main Visual: Acoustic Waves entering Smartphone & MEMS Cutaway */}
          <div
            style={{
              position: "absolute",
              top: 160,
              left: 72,
              right: 72,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 40,
            }}
          >
            {/* Left: Smartphone Outline with sound waves hitting mic hole */}
            <div
              style={{
                width: 380,
                height: 520,
                borderRadius: 36,
                background: "linear-gradient(145deg, #1E293B, #0F172A)",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 20px",
                boxSizing: "border-box",
                boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
              }}
            >
              {/* Screen Area */}
              <div
                style={{
                  width: "100%",
                  height: 380,
                  borderRadius: 24,
                  background: "#090D16",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  padding: 16,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: 38 }}>🗣️</div>
                <div style={{ color: "#F8FAFC", fontSize: 18, fontWeight: 800 }}>Spoken Voice</div>
                <div style={{ color: "#94A3B8", fontSize: 14, textAlign: "center" }}>
                  Air compression waves enter bottom microphone port
                </div>
              </div>

              {/* Bottom Mic Port Indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#F59E0B",
                    boxShadow: "0 0 12px #F59E0B",
                  }}
                />
                <span style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 700 }}>
                  MIC PORT PINHOLE
                </span>
              </div>

              {/* Incoming Sound Waves */}
              <AcousticWaveform
                frame={frame}
                originX={-20}
                originY={470}
                baseRadius={20}
                maxRadius={220}
                direction="right"
                color="#38BDF8"
              />
            </div>

            {/* Right: MEMS Microscopic Diaphragm Cutaway */}
            <div style={{ width: 440, height: 520, position: "relative" }}>
              <VibratingDiaphragm
                frame={frame}
                width={440}
                height={520}
                amplitude={20}
                color="#F59E0B"
                housingColor="#1E293B"
              />
            </div>
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="⚡"
          title="Sound Pressure Creates Electrical Waves"
          description={scene.purpose || "Sound waves hit the ultra-thin microphone diaphragm, creating mechanical vibrations that generate continuous electrical signals."}
          accentColor="#F59E0B"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};

