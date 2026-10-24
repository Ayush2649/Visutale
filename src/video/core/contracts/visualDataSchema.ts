/**
 * Strongly typed schema for data-driven reusable visual scene templates.
 *
 * Every reusable visual template receives this structured visual data payload,
 * which configures telemetry gauges, themes, physical conversion stages,
 * wave radiation properties, conduit flows, comparative pillars, or takeaway insights.
 */

export type TemplateTheme =
  | "outdoor-sky"
  | "deep-space"
  | "tech-dark"
  | "clean-lab"
  | "twilight"
  | "circuit-emerald";

export interface TelemetryMetricData {
  label: string;
  value: string;
  unit?: string;
  statusText?: string;
  color?: string;
}

export interface HeaderBadgeData {
  category: string;
  icon?: string;
  color?: string;
}

export interface PhysicalConversionData {
  input: {
    label: string;
    sublabel?: string;
    kind?: string;
    icon?: string;
    color?: string;
    property?: string;
  };
  mechanism: {
    label: string;
    sublabel?: string;
    kind?: string;
    property?: string;
    statusText?: string;
    color?: string;
  };
  output: {
    label: string;
    sublabel?: string;
    kind?: string;
    icon?: string;
    color?: string;
    property?: string;
  };
}

export interface WaveTransmissionData {
  source: {
    label: string;
    sublabel?: string;
    icon?: string;
    color?: string;
  };
  waveType: "acoustic" | "rf" | "light" | "laser" | "particles";
  carrierFrequency?: string;
  propagationMedium?: string;
  waveColor?: string;
  receiver: {
    label: string;
    sublabel?: string;
    icon?: string;
    color?: string;
  };
}

export interface DataSamplingData {
  signalType: string;
  samplingRate: string;
  bitDepth: string;
  samplePoints?: number;
  digitalStream?: string[];
  processorLabel?: string;
}

export interface ConduitFlowData {
  channelType: string;
  speed: string;
  coreMaterial?: string;
  packets?: Array<{
    id: string;
    label: string;
    color?: string;
  }>;
  routingNodes?: Array<{
    id: string;
    label: string;
    sublabel?: string;
    status?: string;
  }>;
}

export interface DualComparisonData {
  conceptA: {
    title: string;
    subtitle?: string;
    badge?: string;
    color?: string;
    attributes: Array<{ label: string; value: string }>;
  };
  conceptB: {
    title: string;
    subtitle?: string;
    badge?: string;
    color?: string;
    attributes: Array<{ label: string; value: string }>;
  };
}

export interface CutawayAnatomyData {
  subject: string;
  layers: Array<{
    id: string;
    name: string;
    thickness?: string;
    functionText: string;
    color: string;
  }>;
}

export interface ClosedLoopData {
  loopTitle?: string;
  nodeA: { label: string; role: string; icon?: string; color?: string };
  nodeB: { label: string; role: string; icon?: string; color?: string };
  forwardPath: { label: string; type: string };
  returnPath: { label: string; type: string };
}

export interface SummaryTakeawayData {
  headline?: string;
  keyTakeaways: Array<{
    number: number;
    title: string;
    description: string;
    icon?: string;
    color?: string;
  }>;
}

export interface ReusableVisualData {
  template?: string;
  theme?: TemplateTheme;
  headerBadge?: HeaderBadgeData;
  telemetryMetrics?: TelemetryMetricData[];
  conversion?: PhysicalConversionData;
  transmission?: WaveTransmissionData;
  sampling?: DataSamplingData;
  conduit?: ConduitFlowData;
  comparison?: DualComparisonData;
  anatomy?: CutawayAnatomyData;
  closedLoop?: ClosedLoopData;
  takeaway?: SummaryTakeawayData;
  calloutText?: string;
  [key: string]: unknown;
}
