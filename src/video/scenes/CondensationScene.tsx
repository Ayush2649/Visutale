import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { SceneProps } from "./TitleHookScene.js";

export const CondensationScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cloudEvent = scene.events.find((e) => e.targetId === "cloud-shape");
  const cloudRevealFrame = cloudEvent ? Math.max(0, cloudEvent.startFrame - scene.startFrame) : 55;

  // Cloud gathering and swelling spring
  const cloudSpring = spring({
    frame: Math.max(0, frame - cloudRevealFrame),
    fps,
    config: { damping: 13, mass: 0.9 },
  });

  const cloudScale = interpolate(cloudSpring, [0, 1], [0.35, 1]);
  const cloudOpacity = interpolate(cloudSpring, [0, 1], [0, 1]);

  // Phase 2: Droplet clustering progress (before cloud forms)
  const dropletClusterProgress = Math.max(0, Math.min(1, (frame - 20) / 70));

  return (
    <SceneContainer
      topic="The Water Cycle"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle="Stage 2: Condensation"
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "32px 36px",
            boxSizing: "border-box",
          }}
        >
          {/* Header Description */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: THEME.colors.textPrimary }}>
                Cooling Vapour Forms Clouds
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: THEME.colors.textSecondary, marginTop: 4 }}>
                Water vapour cools in higher altitudes, condensing into billions of tiny droplets
              </div>
            </div>
            <AnimatedBadge
              label="Gas ➔ Liquid"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.condensationCyan}
              bgColor={THEME.colors.condensationCyanLight}
              fontSize={20}
            />
          </div>

          {/* Cooler Air Altitude Band */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#E0F2FE",
              border: `2px solid ${THEME.colors.condensationCyan}`,
              borderRadius: 20,
              padding: "14px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>❄️</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0369A1" }}>
                  Cooler Upper Atmosphere
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#0284C7" }}>
                  Lower temperature causes water vapour molecules to lose kinetic energy
                </div>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#0284C7",
                color: "#FFFFFF",
                padding: "6px 16px",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Cooling Zone
            </div>
          </div>

          {/* Central Hero: Progressive Droplets Gathering into Cloud */}
          <div
            style={{
              position: "relative",
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* The Fully Forming Cloud (grows and billows from center) */}
            <div
              style={{
                opacity: cloudOpacity,
                transform: `scale(${cloudScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <svg width="560" height="280" viewBox="0 0 540 280">
                <defs>
                  <filter id="cloudDepth" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#0284C7" floodOpacity="0.18" />
                  </filter>
                </defs>
                {/* Cloud puffs merging into one massive cumulus cloud */}
                <g filter="url(#cloudDepth)">
                  <circle cx="160" cy="170" r="85" fill="#E0F2FE" />
                  <circle cx="270" cy="130" r="110" fill="#FFFFFF" />
                  <circle cx="370" cy="170" r="85" fill="#E0F2FE" />
                  <circle cx="210" cy="190" r="75" fill="#FFFFFF" />
                  <circle cx="320" cy="190" r="75" fill="#FFFFFF" />
                  <rect x="140" y="170" width="250" height="75" rx="36" fill="#FFFFFF" />
                </g>
                <circle cx="270" cy="130" r="108" fill="none" stroke="#BAE6FD" strokeWidth="4" />
              </svg>

              <div
                style={{
                  backgroundColor: THEME.colors.surface,
                  border: `2px solid ${THEME.colors.waterBlue}`,
                  padding: "10px 28px",
                  borderRadius: 20,
                  fontSize: 24,
                  fontWeight: 800,
                  color: THEME.colors.waterBlueDark,
                  boxShadow: "0 8px 20px rgba(37,99,235,0.14)",
                  marginTop: -10,
                }}
              >
                Clouds Form as Droplets Cluster
              </div>
            </div>

            {/* Droplets visibly clustering from outside toward the center */}
            {cloudOpacity < 0.95 && (
              <div
                style={{
                  position: "absolute",
                  width: 500,
                  height: 240,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {[
                  { startX: -220, startY: 80, endX: -40, endY: 0 },
                  { startX: -140, startY: -90, endX: -20, endY: -20 },
                  { startX: 180, startY: 90, endX: 30, endY: 10 },
                  { startX: 200, startY: -80, endX: 25, endY: -15 },
                  { startX: 0, startY: 120, endX: 0, endY: 20 },
                  { startX: -80, startY: 100, endX: -15, endY: 15 },
                  { startX: 100, startY: 110, endX: 20, endY: 20 },
                ].map((drop, idx) => {
                  const currX = drop.startX + (drop.endX - drop.startX) * dropletClusterProgress;
                  const currY = drop.startY + (drop.endY - drop.startY) * dropletClusterProgress;
                  const dropScale = 1 + dropletClusterProgress * 0.4;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        transform: `translate(${currX}px, ${currY}px) scale(${dropScale})`,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill={THEME.colors.waterBlue}>
                        <path d="M12 2.69l4 4a5.66 5.66 0 1 1-8 0z" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Progressive Sequence Bar */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#F8FAFC",
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: 20,
              padding: "16px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <AnimatedBadge label="1. Vapour Cools" frame={frame} revealFrame={10} color="#0369A1" bgColor="#E0F2FE" />
              <span style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textMuted }}>➔</span>
              <AnimatedBadge label="2. Droplets Cluster" frame={frame} revealFrame={30} color="#0369A1" bgColor="#E0F2FE" />
              <span style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.textMuted }}>➔</span>
              <AnimatedBadge label="3. Cloud Grows" frame={frame} revealFrame={cloudRevealFrame} color="#1D4ED8" bgColor="#DBEAFE" />
            </div>
            <div
              style={{
                backgroundColor: THEME.colors.waterBlue,
                color: "#FFFFFF",
                padding: "6px 18px",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Condensation
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
