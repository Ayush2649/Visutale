import React from "react";
import { THEME } from "../theme.js";

export interface SceneContainerProps {
  topic: string;
  sceneIndex: number;
  totalScenes: number;
  stepTitle?: string;
  progress: number; // 0 to 1
  children: React.ReactNode;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  topic,
  sceneIndex,
  totalScenes,
  stepTitle,
  progress,
  children,
}) => {
  return (
    <div
      style={{
        width: THEME.layout.width,
        height: THEME.layout.height,
        backgroundColor: THEME.colors.background,
        color: THEME.colors.textPrimary,
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
          backgroundColor: THEME.colors.border,
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            backgroundColor: THEME.colors.waterBlue,
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
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: THEME.colors.waterBlue,
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: THEME.colors.textPrimary,
              letterSpacing: "-0.01em",
            }}
          >
            {topic}
          </span>
        </div>

        <div
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1.5px solid ${THEME.colors.border}`,
            borderRadius: 20,
            padding: "8px 20px",
            fontSize: 20,
            fontWeight: 700,
            color: THEME.colors.textSecondary,
            boxShadow: "0 2px 6px rgba(15,23,42,0.04)",
          }}
        >
          Scene {sceneIndex + 1} of {totalScenes}
        </div>
      </div>

      {/* Step Title Header (if provided) */}
      {stepTitle && (
        <div
          style={{
            paddingLeft: THEME.layout.safeArea.left,
            paddingRight: THEME.layout.safeArea.right,
            marginTop: 18,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: THEME.colors.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            {stepTitle}
          </span>
        </div>
      )}

      {/* Main visual canvas area (between top header and bottom caption zone) */}
      <div
        style={{
          flex: 1,
          paddingLeft: THEME.layout.safeArea.left,
          paddingRight: THEME.layout.safeArea.right,
          marginTop: stepTitle ? 16 : 24,
          marginBottom: 280, // Generous space reserved for captions at bottom
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          zIndex: 5,
        }}
      >
        {children}
      </div>
    </div>
  );
};
