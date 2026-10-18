import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../core/theme.js";
import { SceneContainer } from "../../core/SceneContainer.js";
import { VisualStageCard, AnimatedBadge } from "../../core/primitives/CommonPrimitives.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";
import { isEventActiveInScene, getEventSpringProgress } from "../../core/sharedAnimationUtilities.js";

export const ChloroplastDiagram: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Photosynthesis",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Inside the Leaf";
  const subtitle = scene.onScreenText[1] ?? "Chloroplasts & Chlorophyll";

  const isCellActive = isEventActiveInScene(scene, "obj-cell-container", frame);
  const isChloroplastActive = isEventActiveInScene(scene, "obj-chloroplast-node", frame);
  const isChlorophyllActive = isEventActiveInScene(scene, "obj-chlorophyll-pigment", frame);

  const cellSpr = getEventSpringProgress(scene, "obj-cell-container", frame, fps, 0);
  const chloroplastSpr = getEventSpringProgress(scene, "obj-chloroplast-node", frame, fps, 20);
  const chlorophyllSpr = getEventSpringProgress(scene, "obj-chlorophyll-pigment", frame, fps, 40);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      stepTitle={title}
      progress={globalProgress}
    >
      <VisualStageCard width={936} height={1040}>
        {/* Header */}
        <div style={{ padding: "32px 40px 16px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ maxWidth: 680 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 800,
                  color: THEME.colors.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h2>
              <p style={{ margin: "8px 0 0 0", fontSize: 22, color: THEME.colors.textMuted, fontWeight: 500 }}>
                {subtitle}
              </p>
            </div>
            <AnimatedBadge
              label="Cellular Biology"
              frame={frame}
              revealFrame={5}
              color={THEME.colors.plantGreenDark}
              bgColor={THEME.colors.plantGreenLight}
            />
          </div>
        </div>

        {/* Organelle Diagram Area */}
        <div
          style={{
            flex: 1,
            padding: "12px 36px 32px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Main SVG Organelle Graphic */}
          <div
            style={{
              width: "100%",
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <svg
              width="820"
              height="580"
              viewBox="0 0 820 580"
              style={{
                transform: `scale(${interpolate(chloroplastSpr, [0, 1], [0.95, 1])})`,
                transformOrigin: "center center",
              }}
            >
              <defs>
                <radialGradient id="chloroplastInner" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#34D399" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                </radialGradient>
                <linearGradient id="thylakoidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>

              {/* Plant Cell Wall Boundary */}
              <rect
                x="40"
                y="30"
                width="740"
                height="520"
                rx="40"
                fill="#F0FDF4"
                stroke={isCellActive ? "#10B981" : "#A7F3D0"}
                strokeWidth={isCellActive ? "6" : "4"}
                strokeDasharray="12 8"
              />
              <text x="65" y="65" fontSize="16" fontWeight="800" fill="#047857" letterSpacing="0.05em">
                PLANT CELL WALL & CYTOPLASM
              </text>

              {/* Central Chloroplast Organelle Oval */}
              <g transform="translate(410, 290)">
                {/* Outer & Inner Membranes */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="310"
                  ry="190"
                  fill="url(#chloroplastInner)"
                  stroke={isChloroplastActive ? "#047857" : "#059669"}
                  strokeWidth="8"
                />
                <ellipse
                  cx="0"
                  cy="0"
                  rx="290"
                  ry="172"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                />

                {/* Stroma Label */}
                <text x="-260" y="-130" fontSize="15" fontWeight="800" fill="#065F46">
                  CHLOROPLAST ORGANELLE (STROMA FLUID)
                </text>

                {/* Thylakoid Stacks (Grana) - The Solar Panel Discs containing Chlorophyll */}
                {/* Stack 1 (Left) */}
                <g transform="translate(-160, -30)">
                  {[0, 22, 44, 66].map((offsetY, idx) => (
                    <ellipse
                      key={`thy-1-${idx}`}
                      cx="0"
                      cy={offsetY}
                      rx="65"
                      ry="18"
                      fill="url(#thylakoidGrad)"
                      stroke={isChlorophyllActive ? "#FBBF24" : "#065F46"}
                      strokeWidth={isChlorophyllActive ? "3.5" : "2"}
                    />
                  ))}
                  <text x="-55" y="110" fontSize="14" fontWeight="800" fill="#065F46">
                    Granum Stack
                  </text>
                </g>

                {/* Connecting Lamella */}
                <path
                  d="M -100 2 M -95 10 Q 0 5 95 10"
                  stroke="#10B981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Stack 2 (Center) */}
                <g transform="translate(0, -45)">
                  {[0, 22, 44, 66, 88].map((offsetY, idx) => (
                    <ellipse
                      key={`thy-2-${idx}`}
                      cx="0"
                      cy={offsetY}
                      rx="70"
                      ry="20"
                      fill="url(#thylakoidGrad)"
                      stroke={isChlorophyllActive ? "#FBBF24" : "#065F46"}
                      strokeWidth={isChlorophyllActive ? "4" : "2"}
                    />
                  ))}
                  <text x="-48" y="130" fontSize="15" fontWeight="800" fill="#065F46">
                    Chlorophyll Discs
                  </text>
                </g>

                {/* Connecting Lamella */}
                <path
                  d="M 65 30 Q 110 35 155 20"
                  stroke="#10B981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Stack 3 (Right) */}
                <g transform="translate(160, -30)">
                  {[0, 22, 44, 66].map((offsetY, idx) => (
                    <ellipse
                      key={`thy-3-${idx}`}
                      cx="0"
                      cy={offsetY}
                      rx="65"
                      ry="18"
                      fill="url(#thylakoidGrad)"
                      stroke={isChlorophyllActive ? "#FBBF24" : "#065F46"}
                      strokeWidth={isChlorophyllActive ? "3.5" : "2"}
                    />
                  ))}
                  <text x="-55" y="110" fontSize="14" fontWeight="800" fill="#065F46">
                    Light Collectors
                  </text>
                </g>

                {/* Solar Photons Trapping Animation */}
                {isChlorophyllActive && (
                  <g>
                    {[
                      { x: -160, y: -90 },
                      { x: 0, y: -110 },
                      { x: 160, y: -90 },
                    ].map((pt, i) => (
                      <g key={`photon-${i}`}>
                        <circle cx={pt.x} cy={pt.y} r="14" fill="#FEF08A" opacity="0.9" />
                        <circle cx={pt.x} cy={pt.y} r="8" fill="#F59E0B" />
                        <line
                          x1={pt.x}
                          y1={pt.y - 25}
                          x2={pt.x}
                          y2={pt.y - 5}
                          stroke="#F59E0B"
                          strokeWidth="3"
                          strokeDasharray="4 3"
                        />
                      </g>
                    ))}
                  </g>
                )}
              </g>
            </svg>
          </div>

          {/* Bottom Explanation Cards */}
          <div style={{ width: "100%", display: "flex", gap: 16 }}>
            <div
              style={{
                flex: 1,
                backgroundColor: isChloroplastActive ? "#ECFDF5" : "#FFFFFF",
                border: `2px solid ${isChloroplastActive ? THEME.colors.plantGreen : THEME.colors.border}`,
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 32 }}>🍃</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: THEME.colors.plantGreenDark }}>
                  Chloroplast Kitchens
                </div>
                <div style={{ fontSize: 14, color: THEME.colors.textMuted, marginTop: 2 }}>
                  Microscopic organelles where the entire chemical conversion happens.
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: isChlorophyllActive ? "#FEF3C7" : "#FFFFFF",
                border: `2px solid ${isChlorophyllActive ? "#F59E0B" : THEME.colors.border}`,
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 32 }}>⚡</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#92400E" }}>
                  Chlorophyll Solar Panels
                </div>
                <div style={{ fontSize: 14, color: "#B45309", marginTop: 2 }}>
                  Green pigment molecules that actively trap photons to power the reaction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </VisualStageCard>
    </SceneContainer>
  );
};

