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

export interface QaSceneVisualReview {
  sceneId: string;
  visualObjective: string;
  visualVariant: string;
  domain: string;
  assetsUsed: string[];
  animationsPerformed: string[];
  narrationTiming: {
    startMs: number;
    durationMs: number;
  };
  isDegradedFallback: boolean;
  degradedReason?: string;
  passed: boolean;
}

export interface QaCreativeCheck {
  valid: boolean;
  unexpectedSilenceDetected: boolean;
  maxSilenceIntervalSeconds: number;
  silenceIntervals: Array<{
    startSeconds: number;
    endSeconds: number;
    durationSeconds: number;
    sceneId: string;
  }>;
  visualElementsPresent: boolean;
  missingRequiredElements: string[];
  sceneVisualReview?: QaSceneVisualReview[];
  emptySceneDetected?: boolean;
  placeholderOnlyScenes?: string[];
  excessiveRepetitionDetected?: boolean;
  textOverlapDetected?: boolean;
  textOverlapDetails?: string[];
  textOverflowDetected?: boolean;
  textOverflowDetails?: string[];
  contactSheetPath?: string;
  frameImageAnalysis?: {
    totalFramesAnalyzed: number;
    averageBlackPixelPercentage: number;
    maxBlackPixelPercentage: number;
    largeEmptyAreasDetected: boolean;
    degradedCardLayoutDetected: boolean;
    lowVisualDensityScenes: string[];
    frameDetails: Array<{
      sceneId: string;
      framePath: string;
      fileSizeBytes: number;
      blackPixelPercentage: number;
      whiteCardPixelPercentage: number;
      passed: boolean;
    }>;
  };
  safeAreaCompliant: boolean;
  humanReviewRecommended: boolean;
  reviewNotes: string[];
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
    creative?: QaCreativeCheck;
  };
  errors: string[];
  warnings: string[];
}

