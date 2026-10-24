import React from "react";
import { THEME } from "./theme.js";

export interface SceneContainerProps {
  topic: string;
  sceneIndex: number;
  totalScenes: number;
  stepTitle?: string;
  progress: number; // 0 to 1
  children: React.ReactNode;
  layoutMode?: "card" | "cinematic";
  backgroundColor?: string;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  topic,
  sceneIndex,
  totalScenes,
  stepTitle,
  progress,
  children,
  layoutMode = "cinematic",
  backgroundColor,
}) => {
  const isCinematic = layoutMode === "cinematic";

  return (
    <div
      style={{
        width: THEME.layout.width,
        height: THEME.layout.height,
        backgroundColor: backgroundColor ?? (isCinematic ? "#0B0F19" : THEME.colors.background),
        color: isCinematic ? "#FFFFFF" : THEME.colors.textPrimary,
        fontFamily: THEME.typography.fontFamily,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top continuous progress indicator */}
      <div
        style={{
          width: "100%",
          height: 6,
          backgroundColor: isCinematic ? "rgba(255,255,255,0.15)" : THEME.colors.border,
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 30,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            backgroundColor: isCinematic ? "#F59E0B" : THEME.colors.waterBlue,
            boxShadow: isCinematic ? "0 0 10px #F59E0B" : "none",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Header bar */}
      <div
        style={{
          paddingTop: THEME.layout.safeArea.top,
          paddingLeft: THEME.layout.safeArea.left,
          paddingRight: THEME.layout.safeArea.right,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 25,
          position: "relative",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            backgroundColor: isCinematic ? "rgba(15,23,42,0.65)" : "transparent",
            backdropFilter: isCinematic ? "blur(12px)" : "none",
            padding: isCinematic ? "8px 20px" : "0",
            borderRadius: isCinematic ? 24 : 0,
            border: isCinematic ? "1px solid rgba(255,255,255,0.15)" : "none",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: isCinematic ? "#F59E0B" : THEME.colors.waterBlue,
              boxShadow: isCinematic ? "0 0 8px #F59E0B" : "none",
            }}
          />
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: isCinematic ? "#FFFFFF" : THEME.colors.textPrimary,
              letterSpacing: "-0.01em",
            }}
          >
            {topic}
          </span>
        </div>

        <div
          style={{
            backgroundColor: isCinematic ? "rgba(15,23,42,0.65)" : THEME.colors.surface,
            border: `1.5px solid ${isCinematic ? "rgba(255,255,255,0.18)" : THEME.colors.border}`,
            borderRadius: 20,
            padding: "8px 20px",
            fontSize: 20,
            fontWeight: 700,
            color: isCinematic ? "#E2E8F0" : THEME.colors.textSecondary,
            boxShadow: isCinematic ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 6px rgba(15,23,42,0.04)",
            backdropFilter: isCinematic ? "blur(12px)" : "none",
          }}
        >
          Scene {sceneIndex + 1} of {totalScenes}
        </div>
      </div>

      {/* Step title */}
      {stepTitle && (
        <div
          style={{
            paddingLeft: THEME.layout.safeArea.left,
            paddingRight: THEME.layout.safeArea.right,
            paddingTop: 18,
            paddingBottom: isCinematic ? 12 : 28,
            zIndex: 25,
            position: "relative",
            pointerEvents: "none",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: THEME.typography.title.fontSize,
              fontWeight: THEME.typography.title.fontWeight,
              lineHeight: THEME.typography.title.lineHeight,
              color: isCinematic ? "#FFFFFF" : THEME.colors.textPrimary,
              letterSpacing: "-0.02em",
              textShadow: isCinematic ? "0 2px 12px rgba(0,0,0,0.6)" : "none",
            }}
          >
            {stepTitle}
          </h1>
        </div>
      )}

      {/* Main visual stage container */}
      <div
        style={
          isCinematic
            ? {
                position: "absolute",
                top: 0,
                left: 0,
                width: THEME.layout.width,
                height: THEME.layout.height,
                zIndex: 10,
                display: "flex",
                overflow: "hidden",
              }
            : {
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingLeft: THEME.layout.safeArea.left,
                paddingRight: THEME.layout.safeArea.right,
                zIndex: 10,
              }
        }
      >
        {children}
      </div>

      {/* Reserve bottom space for floating caption overlay */}
      {!isCinematic && <div style={{ height: THEME.layout.safeArea.bottom }} />}
    </div>
  );
};

