import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY;
const modelId = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

// Bella: premade female voice labelled for informative/educational use.
const voiceId = "hpp4J3VqNfWAUOO0d1Us";

const text =
  "Welcome to NamasteVideo AI. " +
  "Let us explore how water moves through evaporation, " +
  "condensation, precipitation, and collection.";

if (!apiKey) {
  throw new Error("ELEVENLABS_API_KEY is missing from .env");
}

console.log("Testing ElevenLabs text-to-speech...");
console.log("Voice: Bella");
console.log("Model:", modelId);
console.log("Text length:", text.length, "characters");

const url =
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text,
    model_id: modelId
  })
});

const data = await response.json();

if (!response.ok) {
  console.error("HTTP status:", response.status);

  const detail = data.detail;

  console.error(
    "API error:",
    typeof detail === "string"
      ? detail
      : JSON.stringify(detail ?? data.message ?? "Speech generation failed")
  );

  process.exitCode = 1;
} else if (!data.audio_base64) {
  console.error("The API response did not contain audio.");
  process.exitCode = 1;
} else {
  const outputDir = path.resolve("runs", "voice-tests");
  const outputPath = path.join(outputDir, "bella-test.mp3");

  await mkdir(outputDir, { recursive: true });

  await writeFile(
    outputPath,
    Buffer.from(data.audio_base64, "base64")
  );

  const alignment =
    data.normalized_alignment ?? data.alignment ?? null;

  console.log("\nSUCCESS: Audio generated.");
  console.log("Audio file:", outputPath);
  console.log("File size:", (Buffer.byteLength(data.audio_base64, "base64")), "bytes");
  console.log("Alignment returned:", Boolean(alignment));

  if (alignment?.characters) {
    console.log("Aligned characters:", alignment.characters.length);
  }
}
