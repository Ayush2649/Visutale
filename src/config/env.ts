export type StoryboardProviderName = "gemini" | "groq" | "openrouter" | "qwen";

export interface AppConfig {
  storyboardProvider: StoryboardProviderName;
  geminiApiKey?: string;
  geminiModel?: string;
  groqApiKey?: string;
  groqModel?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  dashscopeApiKey?: string;
  dashscopeModel?: string;
  elevenLabsApiKey?: string;
  elevenLabsModel?: string;
  elevenLabsMaleVoiceId?: string;
  elevenLabsFemaleVoiceId?: string;
}

export interface LiveConfigCheck {
  ready: boolean;
  missing: string[];
  notes: string[];
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawProvider = env.STORYBOARD_PROVIDER?.trim().toLowerCase();
  const storyboardProvider: StoryboardProviderName =
    rawProvider === "groq" || rawProvider === "openrouter" || rawProvider === "qwen"
      ? rawProvider
      : "gemini";

  return {
    storyboardProvider,
    geminiApiKey: nonEmpty(env.GEMINI_API_KEY),
    geminiModel: nonEmpty(env.GEMINI_MODEL),
    groqApiKey: nonEmpty(env.GROQ_API_KEY),
    groqModel: nonEmpty(env.GROQ_MODEL),
    openRouterApiKey: nonEmpty(env.OPENROUTER_API_KEY),
    openRouterModel: nonEmpty(env.OPENROUTER_MODEL),
    dashscopeApiKey: nonEmpty(env.DASHSCOPE_API_KEY),
    dashscopeModel: nonEmpty(env.DASHSCOPE_MODEL),
    elevenLabsApiKey: nonEmpty(env.ELEVENLABS_API_KEY),
    elevenLabsModel: nonEmpty(env.ELEVENLABS_MODEL),
    elevenLabsMaleVoiceId: nonEmpty(env.ELEVENLABS_VOICE_ID_INDIAN_MALE),
    elevenLabsFemaleVoiceId: nonEmpty(env.ELEVENLABS_VOICE_ID_INDIAN_FEMALE),
  };
}

/** Checks local configuration only. It never calls a provider or spends API credits. */
export function checkLiveConfig(config: AppConfig): LiveConfigCheck {
  const values: Array<[string, string | undefined]> = [
    ["GEMINI_API_KEY", config.geminiApiKey],
    ["GEMINI_MODEL", config.geminiModel],
    ["ELEVENLABS_API_KEY", config.elevenLabsApiKey],
    ["ELEVENLABS_MODEL", config.elevenLabsModel],
    ["ELEVENLABS_VOICE_ID_INDIAN_MALE", config.elevenLabsMaleVoiceId],
    ["ELEVENLABS_VOICE_ID_INDIAN_FEMALE", config.elevenLabsFemaleVoiceId],
  ];
  const missing = values.filter(([, value]) => !value).map(([name]) => name);
  const notes = [
    "This is a local completeness check only; no network request or paid generation was attempted.",
    "Resolve the Gemini model-default discrepancy between PRD.md and PIPELINE_TECHNICAL_DESIGN.md before live P2 generation.",
  ];
  return { ready: missing.length === 0, missing, notes };
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
