import React from "react";
import { SmartText } from "../layout/SmartText.js";

export type EnvironmentTheme =
  | "outdoor-sky"
  | "deep-space"
  | "tech-dark"
  | "clean-lab"
  | "twilight"
  | "circuit-emerald";

export interface CinematicEnvironmentProps {
  theme?: EnvironmentTheme;
  children?: React.ReactNode;
  showGrid?: boolean;
}

const THEME_GRADIENTS: Record<EnvironmentTheme, string> = {
  "outdoor-sky": "linear-gradient(180deg, #0284C7 0%, #38BDF8 35%, #BAE6FD 65%, #F0F9FF 100%)",
  "deep-space": "linear-gradient(180deg, #030712 0%, #0F172A 50%, #020617 100%)",
  "tech-dark": "linear-gradient(180deg, #0B132B 0%, #1C2541 45%, #0F172A 100%)",
  "clean-lab": "linear-gradient(180deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)",
  twilight: "linear-gradient(180deg, #0F172A 0%, #7C2D12 45%, #EA580C 75%, #0B0F19 100%)",
  "circuit-emerald": "linear-gradient(180deg, #090D16 0%, #0F172A 50%, #064E3B 100%)",
};

export const CinematicEnvironment: React.FC<CinematicEnvironmentProps> = ({
  theme = "tech-dark",
  children,
  showGrid = true,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: THEME_GRADIENTS[theme],
      }}
    >
      {showGrid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </div>
  );
};

export interface HUDHeaderPillProps {
  icon?: string;
  category: string;
  color?: string;
  borderColor?: string;
}

export const HUDHeaderPill: React.FC<HUDHeaderPillProps> = ({
  icon = "⚡",
  category,
  color = "#38BDF8",
  borderColor = "rgba(56, 189, 248, 0.4)",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 140,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(12px)",
        padding: "10px 24px",
        borderRadius: 30,
        border: `1.5px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        zIndex: 35,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span
        style={{
          color,
          fontSize: 19,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {category}
      </span>
    </div>
  );
};

export interface MetricHUDGaugeProps {
  label: string;
  value: string | number;
  unit?: string;
  statusText?: string;
  color?: string;
  width?: number;
  height?: number;
}

export const MetricHUDGauge: React.FC<MetricHUDGaugeProps> = ({
  label,
  value,
  unit,
  statusText,
  color = "#10B981",
  width = 240,
  height = 100,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        background: "rgba(15, 23, 42, 0.9)",
        border: `1.5px solid ${color}60`,
        padding: "12px 18px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: `0 8px 20px rgba(0,0,0,0.4), 0 0 15px ${color}20`,
      }}
    >
      <div style={{ color: "#94A3B8", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color, fontSize: 32, fontWeight: 900, letterSpacing: "0.02em" }}>
          {value}
        </span>
        {unit && <span style={{ color: "#CBD5E1", fontSize: 16, fontWeight: 700 }}>{unit}</span>}
      </div>
      {statusText && (
        <div style={{ color: "#64748B", fontSize: 12, fontWeight: 600 }}>
          {statusText}
        </div>
      )}
    </div>
  );
};

export interface TakeawayInsightCardProps {
  stepNumber: string | number;
  icon: string;
  title: string;
  description: string;
  color?: string;
  bg?: string;
  border?: string;
  style?: React.CSSProperties;
}

export const TakeawayInsightCard: React.FC<TakeawayInsightCardProps> = ({
  stepNumber,
  icon,
  title,
  description,
  color = "#38BDF8",
  bg = "rgba(56, 189, 248, 0.12)",
  border = "rgba(56, 189, 248, 0.4)",
  style = {},
}) => {
  return (
    <div
      style={{
        background: bg,
        backdropFilter: "blur(14px)",
        borderRadius: 24,
        border: `2px solid ${border}`,
        padding: "24px 32px",
        display: "flex",
        alignItems: "flex-start",
        gap: 22,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      {/* Icon Capsule */}
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0F172A",
          fontSize: 26,
          fontWeight: 900,
          flexShrink: 0,
          boxShadow: `0 0 20px ${color}66`,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color, fontSize: 16, fontWeight: 800, textTransform: "uppercase" }}>
            STEP {stepNumber}
          </span>
          <h3
            style={{
              margin: 0,
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h3>
        </div>
        <div style={{ marginTop: 8 }}>
          <SmartText
            text={description}
            maxFontSize={20}
            minFontSize={16}
            maxWidth={720}
            maxLines={3}
            color="#E2E8F0"
            fontWeight={500}
            lineHeightMultiplier={1.4}
          />
        </div>
      </div>
    </div>
  );
};

