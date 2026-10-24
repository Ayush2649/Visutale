import React from "react";
import { interpolate, spring } from "remotion";

/**
 * Reusable Acoustic Waves: Generates concentric compression wavefronts
 * radiating from a sound source (voice, instrument, speaker).
 */
export interface AcousticWaveformProps {
  frame: number;
  originX?: number;
  originY?: number;
  baseRadius?: number;
  arcCount?: number;
  direction?: "right" | "left" | "omnidirectional";
  color?: string;
  speed?: number;
  maxRadius?: number;
}

export const AcousticWaveform: React.FC<AcousticWaveformProps> = ({
  frame,
  originX = 200,
  originY = 500,
  baseRadius = 40,
  arcCount = 6,
  direction = "right",
  color = "#38BDF8",
  speed = 4,
  maxRadius = 360,
}) => {
  const waves = Array.from({ length: arcCount }, (_, i) => {
    const rawProgress = ((frame * speed + i * (maxRadius / arcCount)) % maxRadius);
    const radius = baseRadius + rawProgress;
    const progress = rawProgress / maxRadius;
    const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 0.9, 0.7, 0]);
    const strokeWidth = interpolate(progress, [0, 1], [6, 2]);

    let pathD = "";
    if (direction === "right") {
      // 90-degree forward arc facing right
      const startAngle = -Math.PI / 3;
      const endAngle = Math.PI / 3;
      const x1 = originX + radius * Math.cos(startAngle);
      const y1 = originY + radius * Math.sin(startAngle);
      const x2 = originX + radius * Math.cos(endAngle);
      const y2 = originY + radius * Math.sin(endAngle);
      pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
    } else if (direction === "left") {
      const startAngle = (2 * Math.PI) / 3;
      const endAngle = (4 * Math.PI) / 3;
      const x1 = originX + radius * Math.cos(startAngle);
      const y1 = originY + radius * Math.sin(startAngle);
      const x2 = originX + radius * Math.cos(endAngle);
      const y2 = originY + radius * Math.sin(endAngle);
      pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
    } else {
      pathD = `M ${originX - radius} ${originY} A ${radius} ${radius} 0 1 0 ${originX + radius} ${originY} A ${radius} ${radius} 0 1 0 ${originX - radius} ${originY}`;
    }

    return (
      <path
        key={i}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
        style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
      />
    );
  });

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {waves}
    </svg>
  );
};

/**
 * Reusable Vibrating Diaphragm: Shows acoustic membrane deflection
 * and conversion into physical displacement.
 */
export interface VibratingDiaphragmProps {
  frame: number;
  width?: number;
  height?: number;
  amplitude?: number;
  frequency?: number;
  color?: string;
  housingColor?: string;
}

export const VibratingDiaphragm: React.FC<VibratingDiaphragmProps> = ({
  frame,
  width = 380,
  height = 500,
  amplitude = 18,
  frequency = 0.35,
  color = "#F59E0B",
  housingColor = "#1E293B",
}) => {
  // Sinusoidal oscillation with high-frequency micro-jitter
  const displacement = Math.sin(frame * frequency) * amplitude + Math.sin(frame * frequency * 2.3) * (amplitude * 0.25);
  const centerX = width / 2;

  // Diaphragm curved path under tension
  const topY = 60;
  const bottomY = height - 60;
  const midY = (topY + bottomY) / 2;
  const controlX = centerX + displacement;

  const membranePath = `M ${centerX} ${topY} Q ${controlX} ${midY} ${centerX} ${bottomY}`;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        background: "rgba(15, 23, 42, 0.75)",
        borderRadius: 24,
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* Enclosure walls */}
        <rect x={20} y={40} width={width - 40} height={height - 80} rx={16} fill={housingColor} stroke="#334155" strokeWidth={2} />

        {/* Backplate (fixed electrode in MEMS mic) */}
        <line x1={centerX + 40} y1={topY} x2={centerX + 40} y2={bottomY} stroke="#64748B" strokeWidth={8} strokeDasharray="12 8" strokeLinecap="round" />
        <text x={centerX + 55} y={midY} fill="#94A3B8" fontSize={13} fontWeight={700} transform={`rotate(90 ${centerX + 55} ${midY})`}>
          FIXED BACKPLATE
        </text>

        {/* Capacitor electric field lines */}
        {Array.from({ length: 9 }).map((_, i) => {
          const y = topY + 25 + i * 38;
          const currentGap = centerX + 40 - (centerX + displacement * (1 - Math.abs((i - 4) / 5)));
          return (
            <line
              key={i}
              x1={centerX + displacement * (1 - Math.abs((i - 4) / 5))}
              y1={y}
              x2={centerX + 38}
              y2={y}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="4 4"
              opacity={interpolate(Math.abs(displacement), [0, amplitude], [0.3, 0.9])}
            />
          );
        })}

        {/* Flexible Diaphragm membrane */}
        <path d={membranePath} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />

        {/* Top & Bottom anchor clamps */}
        <rect x={centerX - 18} y={topY - 12} width={36} height={24} rx={6} fill="#E2E8F0" />
        <rect x={centerX - 18} y={bottomY - 12} width={36} height={24} rx={6} fill="#E2E8F0" />

        {/* Port entrance with arrow */}
        <circle cx={45} cy={midY} r={18} fill="#0F172A" stroke="#38BDF8" strokeWidth={2} />
        <path d={`M 35 ${midY} L 55 ${midY} M 48 ${midY - 6} L 55 ${midY} L 48 ${midY + 6}`} stroke="#38BDF8" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </svg>

      {/* Realtime displacement readout */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "#94A3B8",
        }}
      >
        <span>MEMS DIAPHRAGM</span>
        <span style={{ color, fontFamily: "monospace" }}>Δd = {(displacement * 0.12).toFixed(2)} µm</span>
      </div>
    </div>
  );
};

/**
 * Reusable Analog-To-Digital Graph: Displays an analog smooth wave being
 * sampled at discrete clock pulses and converted into binary bitstream.
 */
export interface AnalogToDigitalGraphProps {
  frame: number;
  width?: number;
  height?: number;
  sampleCount?: number;
  bitstream?: string;
}

export const AnalogToDigitalGraph: React.FC<AnalogToDigitalGraphProps> = ({
  frame,
  width = 720,
  height = 360,
  sampleCount = 14,
  bitstream = "01101001011010",
}) => {
  const points: { x: number; y: number; sampleVal: number; bit: string }[] = [];
  const paddingX = 40;
  const paddingY = 40;
  const graphW = width - paddingX * 2;
  const graphH = height - paddingY * 2;
  const centerY = paddingY + graphH / 2;

  for (let i = 0; i <= sampleCount; i++) {
    const x = paddingX + (i / sampleCount) * graphW;
    const normX = (i / sampleCount) * 2 * Math.PI;
    const waveY = Math.sin(normX - frame * 0.08) * 0.7 + Math.sin(normX * 2 + frame * 0.04) * 0.25;
    const y = centerY - waveY * (graphH / 2.2);
    const bit = bitstream[i % bitstream.length] ?? "0";
    points.push({ x, y, sampleVal: waveY, bit });
  }

  // Smooth SVG curve path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  // Active sample indicator sweeping across
  const activeSampleIndex = Math.floor((frame / 6) % (sampleCount + 1));

  return (
    <div
      style={{
        width,
        height,
        background: "rgba(11, 19, 43, 0.85)",
        borderRadius: 24,
        border: "1.5px solid rgba(56, 189, 248, 0.3)",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(14px)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* Horizontal Quantization Grid Lines */}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((level, i) => {
          const y = centerY - level * (graphH / 2.2);
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <text x={paddingX - 12} y={y + 4} fill="#64748B" fontSize={11} textAnchor="end" fontFamily="monospace">
                {(level * 3.3).toFixed(1)}V
              </text>
            </g>
          );
        })}

        {/* Analog Smooth Curve */}
        <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth={4} strokeLinecap="round" opacity={0.8} />

        {/* Sampling vertical bars & binary dots */}
        {points.map((pt, i) => {
          const isActive = i === activeSampleIndex;
          return (
            <g key={i}>
              <line
                x1={pt.x}
                y1={centerY}
                x2={pt.x}
                y2={pt.y}
                stroke={isActive ? "#F59E0B" : "rgba(255,255,255,0.25)"}
                strokeWidth={isActive ? 3 : 1.5}
                strokeDasharray={isActive ? "none" : "3 3"}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 8 : 5}
                fill={isActive ? "#F59E0B" : "#10B981"}
                stroke="#0F172A"
                strokeWidth={2}
                style={{ filter: isActive ? "drop-shadow(0 0 10px #F59E0B)" : "none" }}
              />
              {/* Bit value pill */}
              <rect
                x={pt.x - 14}
                y={centerY + 15}
                width={28}
                height={22}
                rx={6}
                fill={isActive ? "#F59E0B" : "rgba(15,23,42,0.8)"}
                stroke={isActive ? "#F59E0B" : "#334155"}
              />
              <text
                x={pt.x}
                y={centerY + 30}
                fill={isActive ? "#0F172A" : "#E2E8F0"}
                fontSize={12}
                fontWeight={800}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {pt.bit}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Header telemetry badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#38BDF8", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em" }}>
          ADC: ANALOG → 8-BIT QUANTIZATION
        </span>
        <span style={{ color: "#10B981", fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
          Fs = 48.0 kHz
        </span>
      </div>
    </div>
  );
};

/**
 * Reusable Radio Cellular Tower: Displays cellular base station mast
 * with directional antennas and pulsed RF carrier spherical waves.
 */
export interface RadioTowerAntennaProps {
  frame: number;
  width?: number;
  height?: number;
  signalStrength?: number;
  isTransmitting?: boolean;
}

export const RadioTowerAntenna: React.FC<RadioTowerAntennaProps> = ({
  frame,
  width = 340,
  height = 540,
  signalStrength = 4,
  isTransmitting = true,
}) => {
  const topX = width / 2;
  const topY = 80;
  const baseW = 120;
  const baseY = height - 40;

  // Pulse rings emanating from tower top
  const pulseCount = 4;
  const maxRadius = 240;

  return (
    <div style={{ width, height, position: "relative" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* Pulsing RF Waves */}
        {isTransmitting &&
          Array.from({ length: pulseCount }).map((_, i) => {
            const raw = (frame * 5 + i * (maxRadius / pulseCount)) % maxRadius;
            const progress = raw / maxRadius;
            const op = interpolate(progress, [0, 0.2, 0.8, 1], [0, 0.8, 0.4, 0]);
            return (
              <circle
                key={i}
                cx={topX}
                cy={topY}
                r={raw}
                fill="none"
                stroke="#38BDF8"
                strokeWidth={interpolate(progress, [0, 1], [5, 1.5])}
                opacity={op}
                style={{ filter: "drop-shadow(0 0 8px #38BDF8)" }}
              />
            );
          })}

        {/* Tower Steel Lattice Structure */}
        {/* Main legs */}
        <line x1={topX - 14} y1={topY + 30} x2={topX - baseW / 2} y2={baseY} stroke="#94A3B8" strokeWidth={5} strokeLinecap="round" />
        <line x1={topX + 14} y1={topY + 30} x2={topX + baseW / 2} y2={baseY} stroke="#94A3B8" strokeWidth={5} strokeLinecap="round" />

        {/* Cross lattice diagonals */}
        {Array.from({ length: 6 }).map((_, i) => {
          const t1 = i / 6;
          const t2 = (i + 1) / 6;
          const y1 = topY + 30 + t1 * (baseY - topY - 30);
          const y2 = topY + 30 + t2 * (baseY - topY - 30);
          const w1 = 28 + t1 * (baseW - 28);
          const w2 = 28 + t2 * (baseW - 28);

          return (
            <g key={i}>
              <line x1={topX - w1 / 2} y1={y1} x2={topX + w1 / 2} y2={y1} stroke="#64748B" strokeWidth={3} />
              <line x1={topX - w1 / 2} y1={y1} x2={topX + w2 / 2} y2={y2} stroke="#64748B" strokeWidth={2.5} />
              <line x1={topX + w1 / 2} y1={y1} x2={topX - w2 / 2} y2={y2} stroke="#64748B" strokeWidth={2.5} />
            </g>
          );
        })}

        {/* Top Platform & Triangular Sector Antennas */}
        <rect x={topX - 32} y={topY + 20} width={64} height={10} rx={3} fill="#CBD5E1" />
        <rect x={topX - 36} y={topY - 10} width={16} height={36} rx={4} fill="#F8FAFC" stroke="#0F172A" strokeWidth={2} />
        <rect x={topX + 20} y={topY - 10} width={16} height={36} rx={4} fill="#F8FAFC" stroke="#0F172A" strokeWidth={2} />
        <rect x={topX - 8} y={topY - 16} width={16} height={42} rx={4} fill="#F8FAFC" stroke="#0F172A" strokeWidth={2} />

        {/* Mast Lightning Rod / Red Warning Beacon */}
        <line x1={topX} y1={topY - 16} x2={topX} y2={topY - 45} stroke="#E2E8F0" strokeWidth={4} strokeLinecap="round" />
        <circle
          cx={topX}
          cy={topY - 48}
          r={7}
          fill="#EF4444"
          style={{ filter: "drop-shadow(0 0 10px #EF4444)" }}
          opacity={Math.sin(frame * 0.2) > 0 ? 1 : 0.3}
        />

        {/* Foundation Base Concrete Pier */}
        <rect x={topX - baseW / 2 - 20} y={baseY} width={baseW + 40} height={18} rx={6} fill="#334155" />
      </svg>
    </div>
  );
};

/**
 * Reusable Fiber Optic Core: Demonstrates Total Internal Reflection (TIR)
 * inside a high-purity glass core with moving laser pulses.
 */
export interface FiberOpticCoreProps {
  frame: number;
  width?: number;
  height?: number;
  pulseColor?: string;
  speed?: number;
}

export const FiberOpticCore: React.FC<FiberOpticCoreProps> = ({
  frame,
  width = 760,
  height = 240,
  pulseColor = "#F43F5E",
  speed = 12,
}) => {
  const coreH = 90;
  const coreY = (height - coreH) / 2;
  const bounceHeight = coreH - 24;
  const bounceW = 120; // wavelength of bounce

  // Generate zigzag total internal reflection path across width
  const zigzags: string[] = [];
  const pointsCount = Math.ceil(width / bounceW) + 2;
  for (let i = 0; i <= pointsCount; i++) {
    const x = i * bounceW;
    const y = i % 2 === 0 ? coreY + 12 : coreY + 12 + bounceHeight;
    zigzags.push(`${x},${y}`);
  }
  const zigPath = `M ${zigzags.join(" L ")}`;

  // Moving light photons
  const photonCount = 5;
  const totalLength = width + bounceW;

  return (
    <div
      style={{
        width,
        height,
        background: "rgba(15, 23, 42, 0.85)",
        borderRadius: 24,
        border: "1.5px solid rgba(244, 63, 94, 0.35)",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(14px)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* Outer Cladding Layer */}
        <rect x={0} y={coreY - 30} width={width} height={coreH + 60} fill="#1E293B" opacity={0.6} />
        <line x1={0} y1={coreY} x2={width} y2={coreY} stroke="#38BDF8" strokeWidth={2.5} strokeDasharray="8 6" />
        <line x1={0} y1={coreY + coreH} x2={width} y2={coreY + coreH} stroke="#38BDF8" strokeWidth={2.5} strokeDasharray="8 6" />

        {/* High-Purity Silica Core */}
        <rect x={0} y={coreY} width={width} height={coreH} fill="rgba(56, 189, 248, 0.08)" />

        {/* Total Internal Reflection Zigzag Laser Beam */}
        <path d={zigPath} fill="none" stroke={pulseColor} strokeWidth={4} strokeLinecap="round" opacity={0.4} />

        {/* Moving Laser Pulses */}
        {Array.from({ length: photonCount }).map((_, i) => {
          const raw = (frame * speed + i * (totalLength / photonCount)) % totalLength;
          const segmentIndex = Math.floor(raw / bounceW);
          const t = (raw % bounceW) / bounceW;
          const startY = segmentIndex % 2 === 0 ? coreY + 12 : coreY + 12 + bounceHeight;
          const endY = segmentIndex % 2 === 0 ? coreY + 12 + bounceHeight : coreY + 12;
          const currentY = startY + t * (endY - startY);

          return (
            <g key={i}>
              <circle
                cx={raw}
                cy={currentY}
                r={9}
                fill="#FFFFFF"
                style={{ filter: `drop-shadow(0 0 12px ${pulseColor})` }}
              />
              <circle cx={raw} cy={currentY} r={16} fill="none" stroke={pulseColor} strokeWidth={2} opacity={0.6} />
            </g>
          );
        })}
      </svg>

      {/* Realtime velocity readout */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "#94A3B8",
        }}
      >
        <span style={{ color: pulseColor }}>TOTAL INTERNAL REFLECTION (TIR)</span>
        <span style={{ color: "#38BDF8", fontFamily: "monospace" }}>v ≈ 200,000 km/s (c/n)</span>
      </div>
    </div>
  );
};

/**
 * Reusable Speaker Acoustic Cone: Cross section of audio loudspeaker
 * with electromagnet coil and vibrating cone launching sound waves.
 */
export interface SpeakerAcousticConeProps {
  frame: number;
  width?: number;
  height?: number;
  amplitude?: number;
  frequency?: number;
  coneColor?: string;
}

export const SpeakerAcousticCone: React.FC<SpeakerAcousticConeProps> = ({
  frame,
  width = 400,
  height = 500,
  amplitude = 16,
  frequency = 0.35,
  coneColor = "#38BDF8",
}) => {
  const displacement = Math.sin(frame * frequency) * amplitude;
  const leftX = 80;
  const midY = height / 2;
  const coneLength = 220;
  const coneApexX = leftX + 80 + displacement;
  const coneEdgeX = coneApexX + coneLength;
  const coneTopY = midY - 140;
  const coneBottomY = midY + 140;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        background: "rgba(15, 23, 42, 0.75)",
        borderRadius: 24,
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* Permanent Magnet Housing (Left) */}
        <rect x={leftX - 40} y={midY - 60} width={70} height={120} rx={10} fill="#334155" stroke="#475569" strokeWidth={3} />
        <rect x={leftX - 30} y={midY - 45} width={20} height={90} rx={4} fill="#EF4444" />
        <rect x={leftX - 5} y={midY - 45} width={20} height={90} rx={4} fill="#3B82F6" />

        {/* Voice Coil Cylinder (moving inside magnet gap) */}
        <rect
          x={coneApexX - 35}
          y={midY - 30}
          width={40}
          height={60}
          rx={6}
          fill="#D97706"
          stroke="#F59E0B"
          strokeWidth={2}
          style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }}
        />

        {/* Flexible Spider Suspension */}
        <path
          d={`M ${coneApexX - 15} ${midY - 65} Q ${coneApexX - 25} ${midY - 45} ${coneApexX - 15} ${midY - 30}`}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth={4}
        />
        <path
          d={`M ${coneApexX - 15} ${midY + 30} Q ${coneApexX - 25} ${midY + 45} ${coneApexX - 15} ${midY + 65}`}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth={4}
        />

        {/* Dynamic Speaker Cone Structure */}
        <path
          d={`M ${coneApexX} ${midY - 25} L ${coneEdgeX} ${coneTopY} L ${coneEdgeX + 15} ${coneTopY + 10} L ${coneApexX + 12} ${midY} L ${coneEdgeX + 15} ${coneBottomY - 10} L ${coneEdgeX} ${coneBottomY} L ${coneApexX} ${midY + 25} Z`}
          fill="rgba(56, 189, 248, 0.2)"
          stroke={coneColor}
          strokeWidth={4}
          strokeLinejoin="round"
        />

        {/* Dust Cap (Center Dome) */}
        <path
          d={`M ${coneApexX + 10} ${midY - 35} Q ${coneApexX + 45} ${midY} ${coneApexX + 10} ${midY + 35}`}
          fill="none"
          stroke="#F8FAFC"
          strokeWidth={5}
        />

        {/* Sound Compression Wavefronts emanating into air */}
        {Array.from({ length: 4 }).map((_, i) => {
          const waveRadius = 40 + ((frame * 4 + i * 50) % 180);
          const op = interpolate(waveRadius, [40, 80, 150, 180], [0, 0.8, 0.5, 0]);
          const startAngle = -Math.PI / 4;
          const endAngle = Math.PI / 4;
          const cx = coneEdgeX + 20;
          const x1 = cx + waveRadius * Math.cos(startAngle);
          const y1 = midY + waveRadius * Math.sin(startAngle);
          const x2 = cx + waveRadius * Math.cos(endAngle);
          const y2 = midY + waveRadius * Math.sin(endAngle);
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${waveRadius} ${waveRadius} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke="#38BDF8"
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={op}
            />
          );
        })}
      </svg>

      {/* Subtitle readout */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "#94A3B8",
        }}
      >
        <span>LOUDSPEAKER VOICE COIL</span>
        <span style={{ color: coneColor, fontFamily: "monospace" }}>PRESSURE WAVES</span>
      </div>
    </div>
  );
};

