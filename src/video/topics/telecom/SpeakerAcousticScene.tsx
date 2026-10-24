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
  SpeakerAcousticCone,
} from "../../core/primitives/index.js";

export const SpeakerAcousticScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Digital Decoding and Sound Wave Output",
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
          icon="🔊"
          category="STEP 5: DAC RECONSTRUCTION → LOUDSPEAKER SOUND WAVES"
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
            <MetricHUDGauge label="DAC RECONSTRUCTION" value="16" unit="bit" color="#10B981" statusText="Bits to Voltage" width={280} />
            <MetricHUDGauge label="VOICE COIL" value="3.2" unit="kHz" color="#38BDF8" statusText="Electromagnetic Force" width={280} />
            <MetricHUDGauge label="AIR PRESSURE" value="65" unit="dB" color="#F59E0B" statusText="Acoustic Output" width={280} />
          </div>

          {/* Main Visual: Speaker Cross-Section on Left & Listener Silhouette on Right */}
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
            {/* Left: Speaker Cross-Section */}
            <div style={{ width: 440, height: 520, position: "relative" }}>
              <SpeakerAcousticCone
                frame={frame}
                width={440}
                height={520}
                amplitude={18}
                coneColor="#38BDF8"
              />
            </div>

            {/* Right: Receiving Phone & Listener Ear */}
            <div
              style={{
                width: 380,
                height: 520,
                borderRadius: 36,
                background: "linear-gradient(145deg, #1E293B, #0F172A)",
                border: "2px solid rgba(56, 189, 248, 0.4)",
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
              {/* Receiving Phone Display */}
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
                <div style={{ fontSize: 44 }}>👂</div>
                <div style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 800 }}>Friend's Ear</div>
                <div style={{ color: "#94A3B8", fontSize: 14, textAlign: "center" }}>
                  Eardrum vibrates in perfect sync with the original vocal cords
                </div>
              </div>

              {/* Speaker Earpiece Grill */}
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
                    width: 32,
                    height: 8,
                    borderRadius: 4,
                    background: "#38BDF8",
                    boxShadow: "0 0 10px #38BDF8",
                  }}
                />
                <span style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 700 }}>
                  TOP EARPIECE SPEAKER
                </span>
              </div>

              {/* Sound Waves arriving at ear */}
              <AcousticWaveform
                frame={frame}
                originX={-30}
                originY={260}
                baseRadius={20}
                maxRadius={200}
                direction="right"
                color="#38BDF8"
              />
            </div>
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="🔊"
          title="Digital Bits Reconstruct As Natural Sound"
          description={scene.purpose || "The receiving phone decodes the digital bits into electrical voltages that vibrate a tiny speaker cone, recreating the original voice as sound waves in your friend's ear."}
          accentColor="#38BDF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};

