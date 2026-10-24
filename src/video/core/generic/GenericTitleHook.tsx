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

export const GenericTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Educational Explainer",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? topic;
  const subtitle = scene.onScreenText[1] ?? scene.purpose;
  const badgeLabel = scene.onScreenText[2] ?? "Key Concept";

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(spr, [0, 1], [0, 1]);
  const ringRotation = frame * 0.4;
  const pulseScale = 1 + Math.sin(frame * 0.08) * 0.04;

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
          icon="✨"
          category={badgeLabel.toUpperCase()}
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
        />

        {/* Central Hero Stage */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: 72,
            right: 72,
            height: 1140,
            opacity: contentOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {/* Animated Orbital Centerpiece */}
          <div style={{ position: "relative", width: 440, height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={440} height={440} style={{ position: "absolute", inset: 0, transform: `rotate(${ringRotation}deg)` }}>
              <defs>
                <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <circle cx={220} cy={220} r={190} fill="none" stroke="url(#hookGrad)" strokeWidth={3} strokeDasharray="24 16" opacity={0.6} />
              <circle cx={220} cy={220} r={150} fill="none" stroke="#38BDF8" strokeWidth={2} strokeDasharray="8 12" opacity={0.4} />
              <circle cx={220} cy={30} r={10} fill="#38BDF8" style={{ filter: "drop-shadow(0 0 10px #38BDF8)" }} />
              <circle cx={380} cy={300} r={8} fill="#F59E0B" style={{ filter: "drop-shadow(0 0 10px #F59E0B)" }} />
              <circle cx={50} cy={280} r={7} fill="#818CF8" style={{ filter: "drop-shadow(0 0 10px #818CF8)" }} />
            </svg>

            {/* Glowing Core Orb */}
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.9) 70%)",
                border: "2px solid rgba(56, 189, 248, 0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${pulseScale})`,
                boxShadow: "0 0 45px rgba(56, 189, 248, 0.35)",
              }}
            >
              <div style={{ fontSize: 56 }}>💡</div>
              <div style={{ color: "#38BDF8", fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", marginTop: 8 }}>
                VISUTALE
              </div>
            </div>
          </div>

          {/* Central Title Plate */}
          <div style={{ width: "100%", maxWidth: 840, textAlign: "center" }}>
            <SmartText
              text={title}
              maxFontSize={48}
              minFontSize={32}
              maxWidth={840}
              maxLines={3}
              color="#FFFFFF"
              fontWeight={900}
              lineHeightMultiplier={1.2}
            />
          </div>
        </div>

        {/* Safe Callout Card */}
        <SafeCalloutCard
          icon="💡"
          title={title}
          description={subtitle}
          accentColor="#38BDF8"
        />
      </CinematicEnvironment>
    </SceneContainer>
  );
};
