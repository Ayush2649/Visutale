import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme.js";
import { SceneContainer } from "../primitives/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../primitives/CommonPrimitives.js";
import type { CompiledScene } from "../../contracts/timeline.js";

export interface SceneProps {
  scene: CompiledScene;
  sceneIndex: number;
  totalScenes: number;
  globalProgress: number;
}

export const TitleHookScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring from frame 0 - title is immediately prominent!
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8 },
  });

  const introOpacity = interpolate(introSpring, [0, 1], [0, 1]);
  const introScale = interpolate(introSpring, [0, 1], [0.95, 1]);

  // Target event: "water cycle" cue emphasis (not initial appearance)
  const titleEvent = scene.events.find((e) => e.targetId === "hook-title");
  const cueFrame = titleEvent ? Math.max(0, titleEvent.startFrame - scene.startFrame) : 40;

  const cueSpring = spring({
    frame: Math.max(0, frame - cueFrame),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const titleEmphasisScale = interpolate(cueSpring, [0, 0.5, 1], [1, 1.05, 1]);
  const highlightGlow = interpolate(cueSpring, [0, 1], [0, 1]);

  // Continuous subtle orbital movement of cycle markers
  const cycleRotation = (frame * 0.75) % 360;
  // Subtle liquid wave inside droplet
  const waveShift = (frame * 3) % 120;
  // Natural transition into evaporation in final frames
  const transitionStart = scene.durationInFrames - 40;
  const transitionProgress = Math.max(0, Math.min(1, (frame - transitionStart) / 40));
  const sunWarmth = 1 + transitionProgress * 0.25;

  return (
    <SceneContainer
      topic="NamasteVideo Explainer"
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        <div
          style={{
            opacity: introOpacity,
            transform: `scale(${introScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            padding: "44px 36px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Top category badge */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <AnimatedBadge
              label="Earth Science Explainer"
              frame={frame}
              revealFrame={0}
              color={THEME.colors.waterBlueDark}
              bgColor={THEME.colors.waterBlueLight}
              fontSize={20}
              padding="6px 18px"
            />
            <div
              style={{
                backgroundColor: "#FEF3C7",
                color: "#B45309",
                border: "1.5px solid #FCD34D",
                padding: "6px 16px",
                borderRadius: 16,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Continuous Natural Loop
            </div>
          </div>

          {/* Prominent Title - immediately clear and centered */}
          <div
            style={{
              textAlign: "center",
              transform: `scale(${titleEmphasisScale})`,
              transition: "transform 0.2s ease",
              marginTop: 10,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 54,
                fontWeight: 900,
                color: THEME.colors.textPrimary,
                letterSpacing: "-0.03em",
                textShadow: highlightGlow > 0 ? `0 0 24px rgba(37,99,235,${highlightGlow * 0.3})` : "none",
              }}
            >
              The Water Cycle
            </h1>
            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: 26,
                fontWeight: 600,
                color: THEME.colors.textSecondary,
                maxWidth: 720,
                lineHeight: 1.35,
              }}
            >
              Earth's water is constantly moving in an endless natural loop driven by sunlight
            </p>
          </div>

          {/* Central Hero: Meaningful animated water droplet with cycle orbit */}
          <div
            style={{
              position: "relative",
              width: 480,
              height: 480,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Outer Circular Flow Orbit */}
            <svg
              width="460"
              height="460"
              viewBox="0 0 460 460"
              style={{
                position: "absolute",
                transform: `rotate(${cycleRotation}deg)`,
              }}
            >
              {/* Circular guide track */}
              <circle
                cx="230"
                cy="230"
                r="190"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="10"
                strokeDasharray="16 12"
              />
              {/* Active flowing arc */}
              <path
                d="M 230 40 A 190 190 0 0 1 420 230"
                fill="none"
                stroke={THEME.colors.waterBlue}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <polygon points="420,230 408,210 432,210" fill={THEME.colors.waterBlue} />

              <path
                d="M 230 420 A 190 190 0 0 1 40 230"
                fill="none"
                stroke={THEME.colors.condensationCyan}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <polygon points="40,230 52,250 28,250" fill={THEME.colors.condensationCyan} />
            </svg>

            {/* Stage markers positioned around the loop */}
            <div style={{ position: "absolute", top: 12, fontWeight: 800, fontSize: 18, color: THEME.colors.sunAmber }}>
              1. Evaporation
            </div>
            <div style={{ position: "absolute", right: 8, fontWeight: 800, fontSize: 18, color: THEME.colors.condensationCyan }}>
              2. Condensation
            </div>
            <div style={{ position: "absolute", bottom: 12, fontWeight: 800, fontSize: 18, color: THEME.colors.waterBlueDark }}>
              3. Precipitation
            </div>
            <div style={{ position: "absolute", left: 16, fontWeight: 800, fontSize: 18, color: THEME.colors.plantGreenDark }}>
              4. Collection
            </div>

            {/* Central Illustrated Water Droplet Container */}
            <div
              style={{
                width: 250,
                height: 310,
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <svg width="240" height="300" viewBox="0 0 200 250">
                <defs>
                  <linearGradient id="dropletGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <clipPath id="dropletClip">
                    <path d="M 100 10 C 130 65 185 130 185 180 C 185 220 145 245 100 245 C 55 245 15 220 15 180 C 15 130 70 65 100 10 Z" />
                  </clipPath>
                </defs>

                {/* Droplet Outline and Base Fill */}
                <path
                  d="M 100 10 C 130 65 185 130 185 180 C 185 220 145 245 100 245 C 55 245 15 220 15 180 C 15 130 70 65 100 10 Z"
                  fill="url(#dropletGrad)"
                  stroke="#1E40AF"
                  strokeWidth="6"
                />

                {/* Internal Liquid Wave (clipped to droplet interior) */}
                <g clipPath="url(#dropletClip)">
                  {/* Sun warmth at the top of droplet */}
                  <circle cx="100" cy="55" r={22 * sunWarmth} fill="#FDE047" opacity="0.9" />
                  {/* Inner Water Surface Wave */}
                  <path
                    d={`M -20 160 Q ${20 + waveShift} 145 ${60 + waveShift} 160 T ${140 + waveShift} 160 T ${220 + waveShift} 160 L 220 250 L -20 250 Z`}
                    fill="#1E3A8A"
                    opacity="0.6"
                  />
                  {/* Rising vapour bubbles inside droplet */}
                  {[0, 1, 2].map((i) => {
                    const bubbleY = 220 - ((frame * 2 + i * 40) % 110);
                    const bubbleX = 80 + i * 20;
                    return (
                      <circle
                        key={i}
                        cx={bubbleX}
                        cy={bubbleY}
                        r="5"
                        fill="#FFFFFF"
                        opacity="0.75"
                      />
                    );
                  })}
                </g>

                {/* Droplet glossy highlight */}
                <path
                  d="M 100 30 C 80 75 45 125 45 170 C 45 180 50 190 55 195 C 50 185 45 170 50 140 C 60 90 90 40 100 30 Z"
                  fill="#FFFFFF"
                  opacity="0.4"
                />
              </svg>
            </div>
          </div>

          {/* Bottom guidance card - sets educational context */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#F1F5F9",
              border: `1.5px solid ${THEME.colors.border}`,
              borderRadius: 20,
              padding: "16px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: THEME.colors.sunAmber,
                }}
              />
              <span style={{ fontSize: 22, fontWeight: 700, color: THEME.colors.textPrimary }}>
                How water cycles between Earth's surface and atmosphere
              </span>
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
              Start Explainer ➔
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};
