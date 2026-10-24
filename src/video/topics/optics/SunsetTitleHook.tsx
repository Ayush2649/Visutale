import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneContainer } from "../../core/SceneContainer.js";
import type { SceneProps } from "../../core/contracts/visualTypes.js";

export const SunsetTitleHook: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  globalProgress,
  topic = "Why the Sky Turns Orange and Red at Sunset",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = scene.onScreenText[0] ?? "Why is the Sunset Red?";
  const subtitle = scene.onScreenText[1] ?? "The Science of Rayleigh Scattering";

  // Camera slow cinematic dolly / zoom
  const cameraZoom = interpolate(frame, [0, 300], [1, 1.05], { extrapolateRight: "clamp" });
  const cameraPanY = interpolate(frame, [0, 300], [0, -18], { extrapolateRight: "clamp" });

  // Event 1: Opening reveal (cue: "Have you ever wondered")
  const ev1 = scene.events[0];
  const ev1Rel = ev1 ? Math.max(0, ev1.startFrame - scene.startFrame) : 0;
  const ev1Spr = spring({
    frame: Math.max(0, frame - ev1Rel),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Event 2: Crimson & orange flare (cue: "brilliant reds and oranges")
  const ev2 = scene.events[1];
  const ev2Rel = ev2 ? Math.max(0, ev2.startFrame - scene.startFrame) : 60;
  const ev2Spr = spring({
    frame: Math.max(0, frame - ev2Rel),
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  // Dynamic Sun sinking animation
  const sunY = interpolate(frame, [0, 300], [1080, 1140], { extrapolateRight: "clamp" });
  const sunPulse = 1 + Math.sin(frame * 0.05) * 0.03;
  const flareIntensity = interpolate(ev2Spr, [0, 1], [0.35, 0.85]);

  return (
    <SceneContainer
      topic={topic}
      sceneIndex={sceneIndex}
      totalScenes={totalScenes}
      progress={globalProgress}
      layoutMode="cinematic"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transform: `scale(${cameraZoom}) translateY(${cameraPanY}px)`,
          transformOrigin: "center center",
          overflow: "hidden",
        }}
      >
        {/* Full-bleed Sunset Sky SVG Canvas */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            {/* Sky Background Gradient */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" /> {/* Deep twilight indigo */}
              <stop offset="30%" stopColor="#4C1D95" /> {/* Velvet purple */}
              <stop offset="52%" stopColor="#9D174D" /> {/* Crimson magenta */}
              <stop offset="70%" stopColor="#EA580C" /> {/* Blazing orange */}
              <stop offset="85%" stopColor="#F97316" /> {/* Radiant sunset amber */}
              <stop offset="100%" stopColor="#FEF08A" /> {/* Golden horizon light */}
            </linearGradient>

            {/* Radiant Sun Corona Radial Gradient */}
            <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="25%" stopColor="#FEF08A" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#F97316" stopOpacity="0.75" />
              <stop offset="80%" stopColor="#EA580C" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </radialGradient>

            {/* Atmosphere Glow Flare */}
            <radialGradient id="flareGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF7A00" stopOpacity={flareIntensity} />
              <stop offset="50%" stopColor="#FF3D00" stopOpacity={flareIntensity * 0.5} />
              <stop offset="100%" stopColor="#990000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky background */}
          <rect width="1080" height="1920" fill="url(#skyGrad)" />

          {/* Sun Glow Flare behind Sun */}
          <circle cx="540" cy={sunY} r={320 * sunPulse} fill="url(#flareGrad)" />

          {/* Sun Solar Disk */}
          <circle cx="540" cy={sunY} r={105 * sunPulse} fill="url(#sunCorona)" filter="drop-shadow(0 0 45px #FF8A00)" />

          {/* Horizon Atmospheric Light Haze Layer */}
          <rect x="0" y="1120" width="1080" height="200" fill="url(#flareGrad)" opacity="0.6" />

          {/* Layer 3: Distant Mountain Silhouettes */}
          <path
            d="M 0 1280 Q 220 1200 440 1250 T 880 1210 T 1080 1260 L 1080 1920 L 0 1920 Z"
            fill="#31103E"
            opacity="0.8"
          />

          {/* Layer 2: Mid-distance Ridges */}
          <path
            d="M 0 1330 Q 300 1270 600 1310 T 1080 1290 L 1080 1920 L 0 1920 Z"
            fill="#1E0E33"
            opacity="0.9"
          />

          {/* Layer 1: Foreground Landscape & Terrain */}
          <path
            d="M 0 1410 Q 260 1360 520 1400 T 1080 1370 L 1080 1920 L 0 1920 Z"
            fill="#0F091E"
          />

          {/* Calm reflective lake water in foreground */}
          <rect x="0" y="1520" width="1080" height="400" fill="#0A0614" />
          <ellipse
            cx="540"
            cy="1580"
            rx="180"
            ry="24"
            fill="#F97316"
            opacity={0.35 + Math.sin(frame * 0.1) * 0.08}
            filter="blur(16px)"
          />
        </svg>

        {/* Elegant Floating Hero Title Card (Top Safe Area) */}
        <div
          style={{
            position: "absolute",
            top: 230,
            left: 72,
            right: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: interpolate(ev1Spr, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(ev1Spr, [0, 1], [24, 0])}px)`,
            zIndex: 20,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(14px)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              padding: "10px 24px",
              borderRadius: 30,
              fontSize: 22,
              fontWeight: 700,
              color: "#FEF08A",
              marginBottom: 18,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <span>✨</span>
            <span>Atmospheric Optics & Sky Colors</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              margin: 0,
              fontSize: 54,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 24px rgba(0,0,0,0.7), 0 0 40px rgba(234,88,12,0.6)",
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              margin: "14px 0 0 0",
              fontSize: 26,
              fontWeight: 500,
              color: "#FED7AA",
              lineHeight: 1.35,
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </SceneContainer>
  );
};

