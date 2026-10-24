import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  AnalogToDigitalGraph,
} from "../../core/primitives/index.js";

export const DigitalSamplingScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Analog to Digital Conversion",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);
  const bitstreamString = "0110100101101001";
  const activeBitIndex = Math.floor((frame / 4) % bitstreamString.length);

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
          icon="🔢"
          category="STEP 2: ANALOG WAVE → BINARY DIGITAL BITS"
          color="#10B981"
          borderColor="rgba(16, 185, 129, 0.4)"
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
            <MetricHUDGauge label="SAMPLE RATE" value="48.0" unit="kHz" color="#10B981" statusText="48,000 samples / sec" width={280} />
            <MetricHUDGauge label="BIT DEPTH" value="16" unit="bits" color="#38BDF8" statusText="65,536 Voltage Steps" width={280} />
            <MetricHUDGauge label="BITSTREAM" value="0 1 1 0" unit="BIN" color="#F59E0B" statusText="Voice Compression" width={280} />
          </div>

          {/* Main Visual: ADC Graph + Digital Processor Chip */}
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
            {/* Upper: Interactive ADC Wave Graph */}
            <AnalogToDigitalGraph
              frame={frame}
              width={936}
              height={320}
              sampleCount={16}
              bitstream={bitstreamString}
            />

            {/* Lower: Phone DSP / Modem Processor with Stream of 0s and 1s */}
            <div
              style={{
                width: 936,
                height: 240,
                background: "rgba(15, 23, 42, 0.8)",
                borderRadius: 24,
                border: "1.5px solid rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 36px",
                boxSizing: "border-box",
                boxShadow: "0 14px 35px rgba(0,0,0,0.4)",
              }}
            >
              {/* Silicon Processor Chip Icon */}
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    background: "linear-gradient(135deg, #065F46, #064E3B)",
                    border: "2px solid #10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 34,
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  ⚡
                </div>
                <div>
                  <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 800 }}>AUDIO DSP PROCESSOR</div>
                  <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>
                    Compresses and encodes voice data into packet frames
                  </div>
                </div>
              </div>

              {/* Streaming Binary Buffer Display */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const bit = bitstreamString[(activeBitIndex + i) % bitstreamString.length];
                  const isCurrent = i === 0;
                  return (
                    <div
                      key={i}
                      style={{
                        width: 36,
                        height: 48,
                        borderRadius: 10,
                        background: isCurrent ? "#10B981" : "rgba(16, 185, 129, 0.12)",
                        border: `1.5px solid ${isCurrent ? "#10B981" : "rgba(16, 185, 129, 0.3)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isCurrent ? "#0F172A" : "#10B981",
                        fontSize: 22,
                        fontWeight: 900,
                        fontFamily: "monospace",
                        boxShadow: isCurrent ? "0 0 15px #10B981" : "none",
                        transition: "all 0.1s ease",
                      }}
                    >
                      {bit}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="0️⃣"
          title="Digital Sampling Converts Waves into Code"
          description={scene.purpose || "The phone's processor measures the electrical wave tens of thousands of times a second, turning your voice into a precise stream of ones and zeros."}
          accentColor="#10B981"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};

