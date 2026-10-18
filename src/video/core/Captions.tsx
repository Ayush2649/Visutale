import React from "react";
import { THEME } from "./theme.js";

export interface CaptionsProps {
  currentCaption: string | null;
}

export const Captions: React.FC<CaptionsProps> = ({ currentCaption }) => {
  if (!currentCaption || currentCaption.trim().length === 0) {
    return null;
  }

  const lines = currentCaption.split("\n").slice(0, 2);

  return (
    <div
      style={{
        position: "absolute",
        bottom: THEME.layout.safeArea.bottom,
        left: THEME.layout.safeArea.left,
        right: THEME.layout.safeArea.right,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: THEME.colors.captionBg,
          color: THEME.colors.captionText,
          borderRadius: 20,
          padding: "16px 28px",
          maxWidth: 920,
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.22)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {lines.map((line, idx) => (
          <div
            key={idx}
            style={{
              fontSize: THEME.typography.caption.fontSize,
              fontWeight: THEME.typography.caption.fontWeight,
              lineHeight: THEME.typography.caption.lineHeight,
              fontFamily: THEME.typography.fontFamily,
              letterSpacing: "-0.01em",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

