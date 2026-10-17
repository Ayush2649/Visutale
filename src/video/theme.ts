export const THEME = {
  colors: {
    background: "#F8FAFC", // Clean, light slate neutral background
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    border: "#E2E8F0",
    borderHighlight: "#94A3B8",
    textPrimary: "#0F172A", // Slate 900 - dark, high contrast
    textSecondary: "#334155", // Slate 700
    textMuted: "#64748B", // Slate 500
    waterBlue: "#2563EB", // Rich primary water blue
    waterBlueLight: "#EFF6FF", // Light blue tint
    waterBlueDark: "#1D4ED8",
    waterBlueDeep: "#1E3A8A",
    sunAmber: "#D97706", // Solar warmth
    sunAmberLight: "#FEF3C7",
    sunAmberDark: "#B45309",
    plantGreen: "#059669", // Natural foliage green
    plantGreenLight: "#ECFDF5",
    plantGreenDark: "#047857",
    condensationCyan: "#0284C7", // Cool atmospheric cyan
    condensationCyanLight: "#F0F9FF",
    rainNavy: "#1E293B", // Dense precipitation cloud
    captionBg: "rgba(15, 23, 42, 0.92)",
    captionText: "#FFFFFF",
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: { fontSize: 52, fontWeight: 800, lineHeight: 1.15 },
    title: { fontSize: 40, fontWeight: 700, lineHeight: 1.2 },
    subtitle: { fontSize: 30, fontWeight: 600, lineHeight: 1.3 },
    body: { fontSize: 26, fontWeight: 500, lineHeight: 1.4 },
    label: { fontSize: 22, fontWeight: 600, lineHeight: 1.25 },
    caption: { fontSize: 38, fontWeight: 600, lineHeight: 1.35 },
  },
  layout: {
    width: 1080,
    height: 1920,
    safeArea: {
      top: 130,
      bottom: 200,
      left: 72,
      right: 72,
    },
  },
} as const;
