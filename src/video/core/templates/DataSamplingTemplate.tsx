import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  AnalogToDigitalGraph,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const DataSamplingTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Signal Sampling & Digital Encoding",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Digital Quantization";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const sampling = visualData.sampling || {
    signalType: "Analog Voice Wave",
    samplingRate: "48 kHz",
    bitDepth: "8-bit",
    samplePoints: 16,
    digitalStream: ["01101001", "11010010", "10110101", "00101110"],
    processorLabel: "DSP Encoder",
  };

  const headerCategory = visualData.headerBadge?.category ?? "NYQUIST SAMPLING & BINARY ENCODING";
  const headerIcon = visualData.headerBadge?.icon ?? "🔢";
  const headerColor = visualData.headerBadge?.color ?? "#10B981";

  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "SAMPLING RATE", value: sampling.samplingRate, color: "#10B981", statusText: "Nyquist Standard" },
        { label: "QUANTIZATION", value: sampling.bitDepth, color: "#38BDF8", statusText: "256 Amplitude Levels" },
        { label: "DSP ENCODER", value: "ACTIVE", color: "#F59E0B", statusText: sampling.processorLabel },
      ];

  const bitIndex = Math.floor(frame / 6) % (sampling.digitalStream?.length || 4);
  const activeBitChunk = sampling.digitalStream ? sampling.digitalStream[bitIndex] : "01101001";

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

          {/* Graph Stage & Processor Unit */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 72,
              right: 72,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* 1. Continuous to Discrete Sampling Graph Container */}
            <div
              style={{
                width: "100%",
                height: 320,
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
                borderRadius: 28,
                border: "2px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                padding: "20px 28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#38BDF8", fontSize: 16, fontWeight: 700, letterSpacing: "0.08em" }}>
                  DISCRETE TIME SAMPLING (f_s = {sampling.samplingRate})
                </span>
                <span style={{ color: "#94A3B8", fontSize: 14 }}>SIGNAL: {sampling.signalType}</span>
              </div>

              {/* Reusable Analog to Digital SVG Graph */}
              <div style={{ width: "100%", height: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AnalogToDigitalGraph frame={frame} width={860} height={200} sampleCount={16} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: 13 }}>
                <span>AMPLITUDE QUANTIZATION</span>
                <span>TIME INCREMENTS (1/48,000 s)</span>
              </div>
            </div>

            {/* 2. DSP Processor & Flowing Binary Stream */}
            <div
              style={{
                width: "100%",
                height: 200,
                background: "linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.95))",
                borderRadius: 28,
                border: "2px solid rgba(16, 185, 129, 0.4)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.4), inset 0 0 30px rgba(16, 185, 129, 0.08)",
                padding: "20px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Processor Chip Icon */}
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 20,
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(15, 23, 42, 0.9))",
                    border: "2px solid #10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  ⚡
                </div>
                <div>
                  <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 800 }}>{sampling.processorLabel}</div>
                  <div style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>PULSE CODE MODULATION (PCM)</div>
                </div>
              </div>

              {/* Streaming Output Bits */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.85)",
                  border: "1.5px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: 18,
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontFamily: "monospace",
                }}
              >
                <div style={{ color: "#94A3B8", fontSize: 14 }}>STREAM:</div>
                <div
                  style={{
                    color: "#38BDF8",
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: "0.15em",
                    textShadow: "0 0 10px rgba(56, 189, 248, 0.6)",
                  }}
                >
                  {activeBitChunk}
                </div>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 10px #10B981",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="🔢"
          category="DATA PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
