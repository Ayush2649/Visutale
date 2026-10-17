const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  console.error("ELEVENLABS_API_KEY is missing from .env");
  process.exitCode = 1;
} else {
  async function searchVoices(params) {
    const url = new URL("https://api.elevenlabs.io/v2/voices");

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: { "xi-api-key": apiKey }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ` +
        JSON.stringify(data.detail ?? data.message ?? "Voice lookup failed")
      );
    }

    return data.voices ?? [];
  }

  try {
    console.log("Searching for English Indian-accent premade voices...");

    let voices = await searchVoices({
      page_size: "100",
      category: "premade",
      voice_type: "default",
      language: "en",
      accent: "indian"
    });

    if (voices.length > 0) {
      console.log("\nIndian-accent candidates:");
    } else {
      console.log(
        "\nNo matches for that exact filter. " +
        "Searching the account's available English premade voices instead."
      );

      voices = await searchVoices({
        page_size: "100",
        category: "premade",
        voice_type: "default",
        language: "en"
      });
    }

    console.log(JSON.stringify(
      voices.map(v => ({
        name: v.name,
        voice_id: v.voice_id,
        category: v.category,
        labels: v.labels,
        available_for_tiers: v.available_for_tiers,
        free_users_allowed: v.sharing?.free_users_allowed
      })),
      null,
      2
    ));

    console.log(`\nVoices returned: ${voices.length}`);
    console.log("No audio was generated.");
  } catch (error) {
    console.error("Voice search failed:", error.message);
    process.exitCode = 1;
  }
}
