import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  MetricHUDGauge,
  SafeCalloutCard,
  AcousticWaveform,
  VibratingDiaphragm,
} from "../primitives/index.js";
import type { ReusableVisualData } from "../contracts/visualDataSchema.js";

export const PhysicalTransformationTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Energy & State Transformation",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Physical Conversion";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);
  const waveDisplacement = Math.sin(frame * 0.35) * 14;

  // Conversion data from visualData or inferred from scene.objects
  const objects = scene.objects;
  const inputObj = visualData.conversion?.input || {
    label: objects[0]?.label || "Acoustic Pressure",
    sublabel: "Physical Energy Input",
    icon: "🔊",
    color: "#38BDF8",
    property: "1.0 kHz Waveform",
  };

  const mechObj = visualData.conversion?.mechanism || {
    label: objects[1]?.label || "Sensor Diaphragm",
    sublabel: "Transducer Mechanism",
    property: "Mechanical Oscillation",
    statusText: "Variable Capacitance",
    color: "#F59E0B",
  };

  const outputObj = visualData.conversion?.output || {
    label: objects[2]?.label || "Electrical Voltage",
    sublabel: "Converted Output",
    icon: "⚡",
    color: "#10B981",
    property: "Continuous Analog Signal",
  };

  const headerCategory = visualData.headerBadge?.category ?? "PHYSICAL CONVERSION & TRANSDUCTION";
  const headerIcon = visualData.headerBadge?.icon ?? "⚙️";
  const headerColor = visualData.headerBadge?.color ?? "#F59E0B";

  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "INPUT STAGE", value: "ACTIVE", color: inputObj.color || "#38BDF8", statusText: inputObj.label },
        { label: "TRANSDUCER", value: "RESONANT", color: mechObj.color || "#F59E0B", statusText: mechObj.label },
        { label: "OUTPUT YIELD", value: "100%", color: outputObj.color || "#10B981", statusText: outputObj.label },
      ];

  const isAcoustic = inputObj.label.toLowerCase().includes("sound") ||
                     inputObj.label.toLowerCase().includes("acoustic") ||
                     mechObj.label.toLowerCase().includes("diaphragm") ||
                     mechObj.label.toLowerCase().includes("mic");

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

          {/* Central Tri-Part Conversion Pipeline */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 72,
              right: 72,
              height: 540,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* 1. Input Stage Card */}
            <div
              style={{
                flex: 1,
                height: 500,
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))",
                borderRadius: 28,
                border: `2px solid ${inputObj.color || "#38BDF8"}66`,
                boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40 }}>{inputObj.icon || "📥"}</div>
                <div style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 700, marginTop: 10 }}>{inputObj.label}</div>
                <div style={{ color: "#94A3B8", fontSize: 14 }}>{inputObj.sublabel || "Input Stage"}</div>
              </div>

              {/* Graphic inside Input Stage */}
              <div style={{ width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isAcoustic ? (
                  <AcousticWaveform frame={frame} color={inputObj.color || "#38BDF8"} />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${inputObj.color || "#38BDF8"}55 0%, transparent 70%)`,
                      border: `2px dashed ${inputObj.color || "#38BDF8"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      boxShadow: `0 0 24px ${inputObj.color || "#38BDF8"}44`,
                    }}
                  >
                    ⚡
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: 12,
                  padding: "8px 14px",
                  fontSize: 14,
                  color: inputObj.color || "#38BDF8",
                  fontWeight: 600,
                }}
              >
                {inputObj.property || "Primary Stimulus"}
              </div>
            </div>

            {/* Transition Arrow 1 */}
            <div style={{ fontSize: 26, color: "#94A3B8", animation: "pulse 1s infinite" }}>➔</div>

            {/* 2. Central Transducer / Mechanism Chamber */}
            <div
              style={{
                flex: 1.25,
                height: 520,
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
                borderRadius: 32,
                border: `2px solid ${mechObj.color || "#F59E0B"}`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${mechObj.color || "#F59E0B"}33`,
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    background: `${mechObj.color || "#F59E0B"}22`,
                    border: `1px solid ${mechObj.color || "#F59E0B"}`,
                    color: mechObj.color || "#F59E0B",
                    borderRadius: 10,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  CONVERSION CORE
                </span>
                <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 800, marginTop: 10 }}>{mechObj.label}</div>
                <div style={{ color: "#94A3B8", fontSize: 14 }}>{mechObj.sublabel || "Active Mechanism"}</div>
              </div>

              {/* Graphic inside Transducer: Diaphragm or Resonant Junction */}
              <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isAcoustic ? (
                  <VibratingDiaphragm frame={frame} color={mechObj.color || "#F59E0B"} />
                ) : (
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 24,
                        background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.8))",
                        border: "2px solid #F59E0B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 48,
                        boxShadow: "0 0 30px rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      ⚙️
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.9)",
                  borderRadius: 14,
                  padding: "10px 18px",
                  fontSize: 14,
                  color: mechObj.color || "#F59E0B",
                  fontWeight: 700,
                  border: `1px solid ${mechObj.color || "#F59E0B"}44`,
                  textAlign: "center",
                }}
              >
                {mechObj.property || "Dynamic Physical State"}
              </div>
            </div>

            {/* Transition Arrow 2 */}
            <div style={{ fontSize: 26, color: "#94A3B8" }}>➔</div>

            {/* 3. Output Stage Card */}
            <div
              style={{
                flex: 1,
                height: 500,
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))",
                borderRadius: 28,
                border: `2px solid ${outputObj.color || "#10B981"}66`,
                boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40 }}>{outputObj.icon || "📤"}</div>
                <div style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 700, marginTop: 10 }}>{outputObj.label}</div>
                <div style={{ color: "#94A3B8", fontSize: 14 }}>{outputObj.sublabel || "Output State"}</div>
              </div>

              {/* Graphic inside Output Stage */}
              <div style={{ width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${outputObj.color || "#10B981"}33, rgba(15,23,42,0.9))`,
                    border: `2px solid ${outputObj.color || "#10B981"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 44,
                    boxShadow: `0 0 30px ${outputObj.color || "#10B981"}44`,
                  }}
                >
                  {outputObj.icon || "⚡"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: 12,
                  padding: "8px 14px",
                  fontSize: 14,
                  color: outputObj.color || "#10B981",
                  fontWeight: 600,
                }}
              >
                {outputObj.property || "Emitted Output"}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="⚡"
          category="CONVERSION PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
