import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  SafeCalloutCard,
  SmartText,
} from "../primitives/index.js";
import { isEventActiveInScene, getEventSpringProgress } from "../sharedAnimationUtilities.js";

export const GenericLabeledDiagram: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Technical Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Labeled Diagram";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);
  const nodeCount = Math.max(1, scene.objects.length);
  const pulseLoop = (frame * 6) % 360;

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
          icon="🔬"
          category="DIAGRAM & COMPONENT ARCHITECTURE"
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
        />

        {/* Central Visual Constellation Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1140,
            opacity: contentOpacity,
          }}
        >
          {/* Radial Hub and Satellite SVG Grid */}
          <div
            style={{
              width: "100%",
              height: 720,
              display: "grid",
              gridTemplateColumns: nodeCount > 3 ? "1fr 1fr" : "1fr",
              gap: 24,
              alignContent: "center",
              marginTop: 40,
            }}
          >
            {scene.objects.map((obj, i) => {
              const isActive = isEventActiveInScene(scene, obj.id, frame);
              const nodeSpr = getEventSpringProgress(scene, obj.id, frame, fps, i * 12);
              const scale = interpolate(nodeSpr, [0, 1], [0.92, 1]);
              const op = interpolate(nodeSpr, [0, 1], [0, 1]);

              return (
                <div
                  key={obj.id}
                  style={{
                    opacity: op,
                    transform: `scale(${scale})`,
                    background: isActive ? "rgba(56, 189, 248, 0.16)" : "rgba(15, 23, 42, 0.8)",
                    border: `1.5px solid ${isActive ? "#38BDF8" : "rgba(255, 255, 255, 0.12)"}`,
                    borderRadius: 24,
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    boxShadow: isActive
                      ? "0 12px 30px rgba(56, 189, 248, 0.3), 0 0 15px rgba(56, 189, 248, 0.2)"
                      : "0 8px 24px rgba(0,0,0,0.4)",
                    backdropFilter: "blur(14px)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Step / Node Number Badge */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: isActive ? "#38BDF8" : "rgba(255, 255, 255, 0.08)",
                      color: isActive ? "#0F172A" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 900,
                      flexShrink: 0,
                      boxShadow: isActive ? "0 0 16px #38BDF8" : "none",
                    }}
                  >
                    {i + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>
                      {obj.label}
                    </div>
                    <div
                      style={{
                        color: isActive ? "#38BDF8" : "#94A3B8",
                        fontSize: 14,
                        fontWeight: 600,
                        marginTop: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {obj.kind} • Concept Node
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="🔬"
          title={title}
          description={subtitle}
          accentColor="#38BDF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
