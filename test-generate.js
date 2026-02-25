#!/usr/bin/env node
/**
 * Quick test of /api/generate code output.
 * Start the server first: npm run start
 * Then run: node test-generate.js
 */

const http = require("http");

const BASE = "http://localhost:3000";

function generate(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ prompt });
    const req = http.request(
      BASE + "/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const j = JSON.parse(data);
            if (j.error) reject(new Error(j.error));
            else resolve(j.code);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const tests = [
    "On screen 1, when the student submits the math input, show Correct! in a note. Otherwise show the prompt.",
    "Hide a note until the user clicks a button.",
  ];

  console.log("Testing code output (server must be running: npm run start)\n");

  for (let i = 0; i < tests.length; i++) {
    const prompt = tests[i];
    console.log("Prompt:", prompt);
    try {
      const code = await generate(prompt);
      console.log("Code:\n", code || "(empty)");
    } catch (err) {
      console.log("Error:", err.message);
    }
    console.log("---");
  }
}

main();
