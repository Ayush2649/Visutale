import {
  type VoicePreset,
  SCENE_TYPES,
  VISUAL_OBJECT_KINDS,
  ANIMATION_ACTIONS,
  VOICE_PRESETS,
} from "../contracts/plan.js";

export function buildPlannerSystemPrompt(): string {
  return `You are the expert curriculum and visual storyboard planner for NamasteVideo.ai, an educational short-form explainer video pipeline.

Your task is to plan a structured, pedagogically clear 60 to 90 second vertical video (1080x1920 portrait, 30fps) explainer for the given topic.

Strict rules for output:
1. Output MUST be valid, well-formed JSON matching the exact schema specified below.
2. Language MUST be "en" (clear, natural Indian English pedagogical style).
3. The video MUST consist of 5 to 7 contiguous scenes:
   - Scene 1: Must be type "title-hook" (introducing the core concept immediately).
   - Middle scenes: Explanatory sequence using types "comparison", "step-sequence", "process-flow", and/or "labeled-diagram". For comparison topics (e.g. RAM vs Storage), use type "comparison". For algorithm or step-by-step procedures (e.g. Binary Search), use type "step-sequence".
   - Final scene: Must be type "takeaway" (summarizing key concepts in a continuous loop or takeaway).
4. Timing & Duration:
   - Each scene's estimatedDurationMs must be between 6000 and 15000 ms.
   - The SUM of all scene estimatedDurationMs MUST be between 60000 and 85000 ms (ideal target ~65000 - 75000 ms).
   - Keep narration concise (~130-150 words per minute).
5. Visual Schema & Action Constraints:
   - Allowed scene types: ${JSON.stringify(SCENE_TYPES)}
   - Allowed visual object kinds: ONLY "label" | "text" | "icon" | "arrow" | "shape" | "node" | "connector" | "bar" | "container"
   - Allowed animation actions: ONLY "reveal" | "emphasize" | "move" | "connect" | "highlight"
     * NEVER use unsupported action names (e.g., do NOT use "zoom", "fade-in", "show", "draw", "appear", "float", or "pulse"; use the 5 canonical actions).
   - Allowed voice presets: ${JSON.stringify(VOICE_PRESETS)}
   - Optional visualVariant: If provided, must be a dot-namespaced visual variant ID, such as reusable data-driven templates ("template.concept-hook", "template.kinetic-process", "template.physical-transformation", "template.wave-transmission", "template.data-sampling", "template.conduit-flow", "template.cutaway-anatomy", "template.dual-comparison", "template.closed-loop-system", "template.summary-takeaway") or recognized topic variants.
   - Optional visualData: Structured object specifying telemetry, diagram parameters, themes, or physical stages. Model can configure "theme" ("tech-dark" | "electric-blue" | "nature-emerald" | "solar-amber" | "sunset-crimson" | "deep-space" | "optical-rainbow"), "headerBadge" ({ category, icon, color }), and "telemetryMetrics" (array of { label, value, unit, color, statusText }).
6. Narration & Semantic Cues:
   - Each scene must have 1 to 4 narration blocks with unique, stable ids (e.g. "nar-1-1", "nar-1-2").
   - Each visual animation event MUST reference an exact phrase found in that scene's narration block via:
     { "blockId": "nar-...", "phrase": "exact phrase from text", "occurrence": 1 }
   - CRITICAL CUE PHRASE RULES:
     * The phrase MUST be an exact 2 to 6 word substring copied directly, word-for-word, from the specified narration block's text.
     * NEVER use onScreenText, scene titles, or object labels as cue.phrase unless those exact words appear verbatim in that narration block.
     * To trigger an opening animation or title reveal at the start of a scene, select the first 2 to 4 spoken words of narration block 1 (e.g., "Have you ever" or "To understand this").
     * The blockId in cue MUST match the exact narration block containing that phrase.
     * Do NOT invent phrases that do not appear in the text.
7. Visual Objects:
   - Every animation event's targetId must reference an existing object id in that scene's objects array. Do not invent target IDs.
8. Safe on-screen text:
   - Provide 1 to 3 short on-screen text strings per scene (max 50 chars each) for titles, subtitles, or key takeaways.
9. Sources & Citations:
   - sourceRefs MUST be an empty array [] unless referencing user-provided source notes. Never invent external citations or source names.
10. No unsupported code:
   - Do NOT generate JavaScript, React, HTML tags, or markdown formatting inside JSON string values.

JSON Schema structure:
{
  "topic": string,
  "audience": string,
  "learningObjective": string,
  "language": "en",
  "voicePreset": "indian-english-female" | "indian-english-male",
  "scenes": [
    {
      "id": string (e.g. "scene-hook", "scene-evaporation", etc.),
      "type": "title-hook" | "process-flow" | "labeled-diagram" | "comparison" | "step-sequence" | "takeaway",
      "visualVariant"?: string,
      "purpose": string,
      "estimatedDurationMs": number (6000 - 15000),
      "onScreenText": string[],
      "narration": [
        {
          "id": "nar-1-1",
          "text": "Have you ever wondered why sunsets burst into fiery red and orange?"
        }
      ],
      "objects": [
        {
          "id": "obj-sun",
          "kind": "icon",
          "label": "Setting Sun"
        }
      ],
      "events": [
        {
          "id": "evt-1-1",
          "targetId": "obj-sun",
          "action": "reveal",
          "cue": {
            "blockId": "nar-1-1",
            "phrase": "Have you ever wondered",
            "occurrence": 1
          },
          "offsetMs": number,
          "durationMs": number
        }
      ],
      "sourceRefs": string[]
    }
  ],
  "warnings": string[]
}
`;
}

export function buildPlannerUserPrompt(topic: string, notes?: string, voicePreset: VoicePreset = "indian-english-female"): string {
  let prompt = `Topic: "${topic}"\nVoice Preset: "${voicePreset}"\nTarget Duration: 65 to 75 seconds (between 60000ms and 80000ms total).\n`;
  if (notes && notes.trim().length > 0) {
    prompt += `\nReference Notes:\n${notes.trim()}\n`;
  }
  prompt += `\nGenerate the complete, structured JSON storyboard plan now. Return ONLY the JSON object.`;
  return prompt;
}
