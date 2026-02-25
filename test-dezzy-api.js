/**
 * Quick test of Gemini API (Dezzy). Run: node test-dezzy-api.js
 * Uses GEMINI_API_KEY from .env.
 */
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set in .env");
  process.exit(1);
}

const url = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + encodeURIComponent(GEMINI_API_KEY);
const payload = {
  contents: [{ parts: [{ text: "Reply with exactly: Hello from Gemini!" }] }],
  generationConfig: { maxOutputTokens: 64 },
};

async function test() {
  console.log("Calling Gemini API...");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    console.log("HTTP status:", response.status);
    if (!response.ok) {
      console.error("API error:", JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const part = data.candidates?.[0]?.content?.parts?.[0];
    const text = part?.text?.trim();
    if (text) {
      console.log("Response text:", text);
      console.log("Test OK.");
    } else {
      console.error("No text in response. Full response:", JSON.stringify(data, null, 2));
      if (data.promptFeedback) console.error("promptFeedback:", data.promptFeedback);
      process.exit(1);
    }
  } catch (err) {
    console.error("Request failed:", err.message);
    process.exit(1);
  }
}

test();
