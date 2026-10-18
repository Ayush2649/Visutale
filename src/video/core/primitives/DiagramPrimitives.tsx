import React from "react";
import { THEME } from "../theme.js";

export interface DiagramNodeProps {
  label: string;
  sublabel?: string;
  icon?: string;
  numberBadge?: number | string;
  isActive?: boolean;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  style?: React.CSSProperties;
}

export const DiagramNode: React.FC<DiagramNodeProps> = ({
  label,
  sublabel,
  icon,
  numberBadge,
  isActive = false,
  color = THEME.colors.textPrimary,
  bgColor = "#FFFFFF",
  borderColor = THEME.colors.border,
  style = {},
}) => {
  return (
    <div
      style={{
        backgroundColor: isActive ? THEME.colors.waterBlueLight : bgColor,
        border: `2px solid ${isActive ? THEME.colors.waterBlue : borderColor}`,
        borderRadius: 18,
        padding: "20px 24px",
        boxShadow: isActive ? "0 8px 24px rgba(37,99,235,0.14)" : "0 4px 12px rgba(15,23,42,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxSizing: "border-box",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {numberBadge !== undefined && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isActive ? THEME.colors.waterBlue : "#F1F5F9",
            color: isActive ? "#FFFFFF" : THEME.colors.textPrimary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {numberBadge}
        </div>
      )}
      {icon && <span style={{ fontSize: 32, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 15, color: THEME.colors.textMuted, marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
};

export interface DiagramArrowProps {
  direction?: "down" | "right" | "up" | "left";
  label?: string;
  color?: string;
  style?: React.CSSProperties;
}

export const DiagramArrow: React.FC<DiagramArrowProps> = ({
  direction = "down",
  label,
  color = THEME.colors.waterBlue,
  style = {},
}) => {
  const symbol =
    direction === "down" ? "↓" : direction === "right" ? "→" : direction === "up" ? "↑" : "←";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction === "down" || direction === "up" ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        color,
        ...style,
      }}
    >
      <span style={{ fontSize: 28, fontWeight: 900 }}>{symbol}</span>
      {label && <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>}
    </div>
  );
};

