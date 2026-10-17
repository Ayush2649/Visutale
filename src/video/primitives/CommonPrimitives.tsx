import React from "react";
import { interpolate, spring } from "remotion";
import { THEME } from "../theme.js";

export interface AnimatedBadgeProps {
  label: string;
  frame: number;
  revealFrame: number;
  fps?: number;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  padding?: string;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  label,
  frame,
  revealFrame,
  fps = 30,
  color = THEME.colors.waterBlueDark,
  bgColor = THEME.colors.waterBlueLight,
  fontSize = 22,
  padding = "8px 20px",
}) => {
  const spr = spring({
    frame: Math.max(0, frame - revealFrame),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const opacity = interpolate(spr, [0, 1], [0, 1]);
  const translateY = interpolate(spr, [0, 1], [14, 0]);
  const scale = interpolate(spr, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: bgColor,
        color,
        border: `1.5px solid ${color}40`,
        padding,
        borderRadius: 16,
        fontSize,
        fontWeight: 700,
        boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
      }}
    >
      {label}
    </div>
  );
};

export interface VisualStageCardProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export const VisualStageCard: React.FC<VisualStageCardProps> = ({
  children,
  width = 936,
  height = 1040,
  style = {},
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: THEME.colors.surface,
        border: `2px solid ${THEME.colors.border}`,
        borderRadius: 32,
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Backward-compatible alias for existing imports
export const DiagramCard = VisualStageCard;
