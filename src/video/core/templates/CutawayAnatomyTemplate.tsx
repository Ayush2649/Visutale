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

export const CutawayAnatomyTemplate: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Layered Structural Cutaway",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visualData = (scene.visualData as ReusableVisualData) || {};
  const theme = visualData.theme || "tech-dark";

  const title = scene.onScreenText[0] ?? "Layered Anatomy";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);

  const objects = scene.objects;
  const anatomy = visualData.anatomy || {
    subject: title,
    layers: objects.length >= 2
      ? objects.map((obj, i) => ({
          id: obj.id,
          name: obj.label,
          functionText: `Core layer ${i + 1} function`,
          color: ["#38BDF8", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"][i % 5],
        }))
      : [
          { id: "layer-1", name: "Protective Surface Stratum", functionText: "Environmental Shielding", color: "#38BDF8" },
          { id: "layer-2", name: "Active Functional Core", functionText: "Primary Energy/Material Reaction", color: "#F59E0B" },
          { id: "layer-3", name: "Substrate Base Support", functionText: "Structural Ground & Stabilization", color: "#10B981" },
        ],
  };

  const headerCategory = visualData.headerBadge?.category ?? "CROSS-SECTIONAL CUTAWAY & ANATOMY";
  const headerIcon = visualData.headerBadge?.icon ?? "🔬";
  const headerColor = visualData.headerBadge?.color ?? "#38BDF8";

  const metrics = visualData.telemetryMetrics && visualData.telemetryMetrics.length > 0
    ? visualData.telemetryMetrics
    : [
        { label: "LAYER COUNT", value: `${anatomy.layers.length}`, unit: "STRATA", color: "#38BDF8", statusText: "Exploded Anatomy" },
        { label: "CROSS-SECTION", value: "CUTAWAY", color: "#F59E0B", statusText: "Internal Inspection" },
        { label: "INTEGRITY", value: "OPTIMAL", color: "#10B981", statusText: "Multi-Layer System" },
      ];

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

          {/* Layered Cross-Section Stack */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 72,
              right: 72,
              height: 540,
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))",
              borderRadius: 36,
              border: "2px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              padding: "28px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            {anatomy.layers.map((layer, idx) => {
              const layerSpr = spring({
                frame: Math.max(0, frame - idx * 10),
                fps,
                config: { damping: 14, stiffness: 120 },
              });

              return (
                <div
                  key={layer.id || idx}
                  style={{
                    opacity: interpolate(layerSpr, [0, 1], [0, 1]),
                    transform: `translateX(${interpolate(layerSpr, [0, 1], [-30, 0])}px)`,
                    background: "rgba(15, 23, 42, 0.85)",
                    border: `1.5px solid ${layer.color}66`,
                    borderLeft: `8px solid ${layer.color}`,
                    borderRadius: 18,
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: `0 8px 20px rgba(0,0,0,0.3), inset 0 0 15px ${layer.color}11`,
                  }}
                >
                  <div>
                    <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 700 }}>
                      {layer.name}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: 15, marginTop: 4 }}>
                      {layer.functionText}
                    </div>
                  </div>
                  <div
                    style={{
                      background: `${layer.color}22`,
                      border: `1px solid ${layer.color}`,
                      borderRadius: 10,
                      padding: "6px 14px",
                      color: layer.color,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    STRATUM {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary Callout */}
        <SafeCalloutCard
          icon="🔬"
          category="ANATOMICAL PRINCIPLE"
          title={title}
          description={visualData.calloutText || subtitle}
          accentColor={headerColor}
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
