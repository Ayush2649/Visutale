import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../contracts/visualTypes.js";
import { SceneContainer } from "../SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  SafeCalloutCard,
} from "../primitives/index.js";

export const GenericStepSequence: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Educational Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Step-by-Step Sequence";
  const subtitle = scene.onScreenText[1] ?? scene.purpose;

  const steps = scene.objects.length > 0 ? scene.objects : [
    { id: "step-1", kind: "node" as const, label: scene.onScreenText[0] ?? "Step 1" },
    { id: "step-2", kind: "node" as const, label: scene.onScreenText[1] ?? "Step 2" },
  ];

  const stepCount = Math.max(1, steps.length);
  const activeStepIndex = Math.min(
    stepCount - 1,
    Math.floor((frame / scene.durationInFrames) * stepCount)
  );

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
          icon="📋"
          category="CHRONOLOGICAL STEPS"
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
        />

        {/* Central Visual Stage */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 72,
            right: 72,
            height: 1140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {steps.map((st, i) => {
            const isActive = i === activeStepIndex;
            const spr = spring({
              frame: Math.max(0, frame - i * 15),
              fps,
              config: { damping: 14, stiffness: 120 },
            });

            return (
              <div
                key={st.id}
                style={{
                  opacity: interpolate(spr, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(spr, [0, 1], [0.94, 1])})`,
                  background: isActive ? "rgba(56, 189, 248, 0.16)" : "rgba(15, 23, 42, 0.8)",
                  border: `1.5px solid ${isActive ? "#38BDF8" : "rgba(255, 255, 255, 0.12)"}`,
                  borderRadius: 22,
                  padding: "22px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  boxShadow: isActive ? "0 12px 28px rgba(56, 189, 248, 0.25)" : "0 8px 20px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: isActive ? "#38BDF8" : "rgba(255, 255, 255, 0.08)",
                    color: isActive ? "#0F172A" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800 }}>{st.label}</div>
                  <div style={{ color: isActive ? "#38BDF8" : "#94A3B8", fontSize: 13, marginTop: 4 }}>
                    Step {i + 1} of {stepCount}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="📋"
          title={title}
          description={subtitle}
          accentColor="#38BDF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
