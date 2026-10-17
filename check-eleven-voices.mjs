const ids = [
  "U1me6X0sIhQz6nAjDuVU",
  "JBFqnCBsd6RMkjVDRZzb",
  "3cjtcbSfNCiKYL34TDbF",
  "6ce2j5ZU8hRGBD9VwEaX"
];

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is missing from .env");
  process.exit(1);
}

const url = new URL("https://api.elevenlabs.io/v2/voices");

for (const id of ids) {
  url.searchParams.append("voice_ids", id);
}

console.log("Checking access to four candidate voices...");

const response = await fetch(url, {
  headers: {
    "xi-api-key": process.env.ELEVENLABS_API_KEY
  }
});

const data = await response.json();

if (!response.ok) {
  console.error("HTTP status:", response.status);
  console.error(
    "API error:",
    typeof data.detail === "string"
      ? data.detail
      : JSON.stringify(data.detail ?? data.message ?? "Voice lookup failed")
  );
  process.exit(1);
}

const voices = (data.voices ?? []).map(v => ({
  name: v.name,
  voice_id: v.voice_id,
  category: v.category,
  labels: v.labels,
  available_for_tiers: v.available_for_tiers,
  permission_on_resource: v.permission_on_resource,
  is_owner: v.is_owner,
  is_legacy: v.is_legacy,
  free_users_allowed: v.sharing?.free_users_allowed
}));

console.log("\nVoice lookup results:");
console.log(JSON.stringify(voices, null, 2));

console.log("\nVoices returned:", voices.length);
console.log("Metadata lookup complete. No speech was generated.");
