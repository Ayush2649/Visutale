import React from "react";
import { THEME } from "../theme.js";
import { LAYOUT_ZONES, SAFE_MARGINS, calculateOptimalFontSize } from "../core/layout/textLayoutEngine.js";

export interface CaptionsProps {
  currentCaption: string | null;
}

export const Captions: React.FC<CaptionsProps> = ({ currentCaption }) => {
  if (!currentCaption || currentCaption.trim().length === 0) {
    return null;
  }

  const rawLines = currentCaption.split("\n").slice(0, 2);
  const textContent = rawLines.join(" ");

  const maxCaptionWidth = SAFE_MARGINS.maxWidth - 48;
  const { fontSize, lines } = calculateOptimalFontSize(
    textContent,
    36,
    24,
    maxCaptionWidth,
    2,
    1.3
  );

  return (
    <div
      style={{
        position: "absolute",
        top: LAYOUT_ZONES.captionSafe.top,
        left: SAFE_MARGINS.left,
        width: SAFE_MARGINS.maxWidth,
        height: LAYOUT_ZONES.captionSafe.height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        pointerEvents: "none",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: THEME.colors.captionBg,
          color: THEME.colors.captionText,
          borderRadius: 24,
          padding: "16px 32px",
          maxWidth: maxCaptionWidth + 48,
          width: "auto",
          textAlign: "center",
          boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid rgba(255,255,255,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        {lines.map((line, idx) => (
          <span
            key={idx}
            style={{
              fontSize,
              fontWeight: 700,
              lineHeight: 1.3,
              fontFamily: THEME.typography.fontFamily,
              letterSpacing: "-0.015em",
              color: "#FFFFFF",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
};
