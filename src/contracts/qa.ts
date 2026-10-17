export interface QaFileCheck {
  exists: boolean;
  sizeBytes: number;
  isNonEmpty: boolean;
  path: string;
}

export interface QaPlaybackCheck {
  canPlayInVideoTag: boolean;
  supportsSeeking: boolean;
  codec: string;
}

export interface QaDimensionsCheck {
  width: number;
  height: number;
  expectedWidth: 1080;
  expectedHeight: 1920;
  valid: boolean;
}

export interface QaFrameRateCheck {
  fps: number;
  expectedFps: 30;
  valid: boolean;
}

export interface QaDurationCheck {
  durationInSeconds: number;
  durationInFrames: number;
  minSeconds: 60;
  maxSeconds: 90;
  valid: boolean;
}

export interface QaAudioCheck {
  present: boolean;
  codec: string | null;
  isFixturePlaceholder: boolean;
  note: string;
}

export interface QaTimelineCheck {
  valid: boolean;
  sceneCount: number;
  gapsDetected: number;
  overlapsDetected: number;
}

export interface QaCaptionsCheck {
  valid: boolean;
  totalCaptions: number;
  maxLinesPerCue: number;
  maxLineLength: number;
}

export interface QaReport {
  runId: string;
  planHash: string;
  validatedAt: string;
  overallPassed: boolean;
  checks: {
    file: QaFileCheck;
    playback: QaPlaybackCheck;
    dimensions: QaDimensionsCheck;
    frameRate: QaFrameRateCheck;
    duration: QaDurationCheck;
    audio: QaAudioCheck;
    timeline: QaTimelineCheck;
    captions: QaCaptionsCheck;
  };
  errors: string[];
  warnings: string[];
}

