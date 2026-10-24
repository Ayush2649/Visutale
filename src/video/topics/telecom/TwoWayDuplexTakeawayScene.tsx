import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import {
  CinematicEnvironment,
  HUDHeaderPill,
  TakeawayInsightCard,
} from "../../core/primitives/index.js";

export const TwoWayDuplexTakeawayScene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Full Duplex Mobile Communication",
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
          icon="🔄"
          category="COMPLETE JOURNEY: FULL DUPLEX IN MILLISECONDS"
          color="#38BDF8"
          borderColor="rgba(56, 189, 248, 0.4)"
        />

        {/* Hero Visual Stage */}
        <div
          style={{
            position: "absolute",
            top: 230,
            left: 72,
            right: 72,
            height: 1200,
            opacity: contentOpacity,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Top: Panoramic Multi-Stage Banner Loop */}
          <div
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 20,
              background: "rgba(15, 23, 42, 0.85)",
              border: "1.5px solid rgba(56, 189, 248, 0.4)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {[
              { icon: "🎙️", label: "SOUND" },
              { icon: "🔢", label: "BITS" },
              { icon: "📡", label: "RADIO" },
              { icon: "💡", label: "FIBER" },
              { icon: "🔊", label: "VOICE" },
            ].map((node, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid #38BDF8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {node.icon}
                  </div>
                  <span style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 800 }}>{node.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: "#38BDF8", fontSize: 18, fontWeight: 900 }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 3 Structured Takeaway Insight Cards */}
          <TakeawayInsightCard
            stepNumber="1"
            icon="🎙️"
            title="Acoustic to Digital Conversion"
            description="Your vocal cords vibrate air molecules, a MEMS microphone diaphragm turns sound pressure into electrical voltage, and your phone samples it 48,000 times a second into binary bits."
            color="#F59E0B"
            bg="rgba(245, 158, 11, 0.08)"
            border="rgba(245, 158, 11, 0.35)"
          />

          <TakeawayInsightCard
            stepNumber="2"
            icon="🌐"
            title="Air Waves to Underground Glass"
            description="Your phone beams radio waves to a cellular tower, which routes the data into underground fiber-optic cables shooting laser light through glass at 200,000 km/s across the continent."
            color="#38BDF8"
            bg="rgba(56, 189, 248, 0.08)"
            border="rgba(56, 189, 248, 0.35)"
          />

          <TakeawayInsightCard
            stepNumber="3"
            icon="🔊"
            title="Instant Sound Reconstruction"
            description="The destination tower beams the signal to your friend's phone, where a DAC powers an electromagnet speaker cone, vibrating the air and recreating your voice in milliseconds."
            color="#10B981"
            bg="rgba(16, 185, 129, 0.08)"
            border="rgba(16, 185, 129, 0.35)"
          />
        </div>
      </CinematicEnvironment>
    </SceneContainer>
  );
};

