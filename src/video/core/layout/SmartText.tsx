import React from "react";
import { calculateOptimalFontSize } from "./textLayoutEngine.js";

export interface SmartTextProps {
  text: string;
  maxFontSize?: number;
  minFontSize?: number;
  maxWidth?: number;
  maxLines?: number;
  lineHeightMultiplier?: number;
  color?: string;
  fontWeight?: number | string;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * SmartText dynamically computes optimal font scaling to ensure that text
 * fits cleanly within maxWidth and maxLines without clipping or overflowing.
 */
export const SmartText: React.FC<SmartTextProps> = ({
  text,
  maxFontSize = 36,
  minFontSize = 20,
  maxWidth = 920,
  maxLines = 2,
  lineHeightMultiplier = 1.3,
  color = "#FFFFFF",
  fontWeight = 700,
  textAlign = "left",
  letterSpacing = "-0.01em",
  style = {},
  className,
}) => {
  const { fontSize, lines } = calculateOptimalFontSize(
    text,
    maxFontSize,
    minFontSize,
    maxWidth,
    maxLines,
    lineHeightMultiplier
  );

  return (
    <div
      className={className}
      style={{
        maxWidth,
        textAlign,
        display: "flex",
        flexDirection: "column",
        alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
        ...style,
      }}
    >
      {lines.map((line, index) => (
        <span
          key={index}
          style={{
            fontSize,
            lineHeight: lineHeightMultiplier,
            color,
            fontWeight,
            letterSpacing,
            wordBreak: "break-word",
            display: "block",
            whiteSpace: "normal",
          }}
        >
          {line}
        </span>
      ))}
    </div>
  );
};

