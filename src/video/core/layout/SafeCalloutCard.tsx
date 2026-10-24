import React from "react";
import { SmartText } from "./SmartText.js";
import { SAFE_MARGINS, LAYOUT_ZONES } from "./textLayoutEngine.js";

export interface SafeCalloutCardProps {
  category?: string;
  categoryColor?: string;
  accentColor?: string;
  icon?: string;
  title: string;
  description?: string;
  style?: React.CSSProperties;
  borderColor?: string;
  bgGradient?: string;
}

/**
 * SafeCalloutCard renders secondary conceptual context and narration takeaways
 * strictly within the designated Lower Callout Zone (y: 1420 - 1620px).
 *
 * Guaranteed to maintain at least 40px of clear vertical buffer above the
 * Caption Safe Zone (y: 1640px), preventing text-on-text collisions.
 */
export const SafeCalloutCard: React.FC<SafeCalloutCardProps> = ({
  category,
  categoryColor,
  accentColor = "#38BDF8",
  icon = "💡",
  title,
  description,
  style = {},
  borderColor,
  bgGradient = "rgba(15, 23, 42, 0.92)",
}) => {
  const effectiveColor = categoryColor ?? accentColor;
  const effectiveBorder = borderColor ?? `${effectiveColor}55`;
  const topText = category ?? (description ? title : "KEY INSIGHT");
  const mainText = description ?? title;

  return (
    <div
      style={{
        position: "absolute",
        top: LAYOUT_ZONES.lowerCallout.top + 10, // y: 1430px
        left: SAFE_MARGINS.left, // x: 72px
        width: SAFE_MARGINS.maxWidth, // width: 936px
        maxHeight: 160,
        boxSizing: "border-box",
        background: bgGradient,
        backdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: "18px 28px",
        border: `1.5px solid ${effectiveBorder}`,
        boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        zIndex: 30,
        ...style,
      }}
    >
      {/* Visual Category Icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `${effectiveColor}25`,
          border: `1.5px solid ${effectiveColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Auto-wrapping collision-safe text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: effectiveColor,
            fontSize: 18,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          {topText}
        </div>
        <SmartText
          text={mainText}
          maxFontSize={24}
          minFontSize={18}
          maxWidth={780}
          maxLines={2}
          color="#F8FAFC"
          fontWeight={600}
        />
      </div>
    </div>
  );
};

