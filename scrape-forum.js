#!/usr/bin/env node
/**
 * Scrapes Activity Builder / Computation Layer forum for docs and tips,
 * extracts readable text, and updates the single "Forum docs & tips (scraped)"
 * section in cl-docs.md (replaces it if present, otherwise appends).
 * No duplicate blocks.
 *
 * Run: node scrape-forum.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "cl-docs.md");

const FORUM_URLS = [
  "https://cl.desmos.com/t/computation-layer-101/8414",
  "https://cl.desmos.com/t/show-hide-a-component/2028",
  "https://cl.desmos.com/t/list-functions-in-cl/7353",
  "https://cl.desmos.com/t/numericvalue-vs-simplefunction/5528",
  "https://cl.desmos.com/t/about-the-examples-category/123",
  "https://cl.desmos.com/t/cl-newsletter-january-2020-ordering-conditional-statements/5439",
  "https://cl.desmos.com/t/desmos-demo-content-sink-providing-feedback-guess-my-number-activity/669",
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CL-docs-scraper)" },
      timeout: 20000,
    };
    https
      .get(url, opts, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject)
      .on("timeout", () => reject(new Error("timeout")));
  });
}

function extractTextFromHtml(html) {
  const noScript = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  const noStyle = noScript.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  let text = noStyle
    .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  text = text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  text = text.join("\n\n").replace(/\n{3,}/g, "\n\n");
  const maxLen = 50000;
  if (text.length > maxLen) {
    const main = text.indexOf("Computation Layer");
    const start = main >= 0 ? Math.max(0, main - 500) : 0;
    text = text.slice(start, start + maxLen);
  }
  return text.trim();
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s*-\s*Computation Layer.*$/i, "").trim() : "";
}

async function main() {
  const sections = [];
  const seen = new Set();

  for (const url of FORUM_URLS) {
    process.stdout.write("Fetching " + url.slice(0, 50) + "... ");
    try {
      const html = await fetchUrl(url);
      const title = extractTitle(html);
      const text = extractTextFromHtml(html);
      if (text.length < 200) {
        console.log("too little text, skip");
        continue;
      }
      const sig = text.slice(0, 200);
      if (seen.has(sig)) {
        console.log("duplicate, skip");
        continue;
      }
      seen.add(sig);
      sections.push({ url, title, text });
      console.log(title || "ok", text.length, "chars");
    } catch (err) {
      console.log("error:", err.message);
    }
  }

  if (sections.length === 0) {
    console.log("\nNo content scraped, file unchanged.");
    return;
  }

  const block = [
    "---",
    "",
    "## Forum docs & tips (scraped)",
    "",
    "Content below scraped from the [Computation Layer Support Forum](https://cl.desmos.com/).",
    "",
    ...sections.map(
      (s) =>
        `### ${s.title || s.url}\n\nSource: ${s.url}\n\n${s.text.slice(0, 12000)}${s.text.length > 12000 ? "\n\n[... truncated ...]" : ""}`
    ),
  ].join("\n");

  const forumHeading = "## Forum docs & tips (scraped)";
  let out;
  if (fs.existsSync(OUT_FILE)) {
    const raw = fs.readFileSync(OUT_FILE, "utf8");
    const start = raw.indexOf(forumHeading);
    if (start >= 0) {
      const after = raw.slice(start);
      const nextH2 = after.indexOf("\n## ");
      const end = nextH2 > 0 ? start + nextH2 : raw.length;
      out = raw.slice(0, start).trimEnd() + "\n\n" + block + (end < raw.length ? "\n\n" + raw.slice(end).trimStart() : "");
    } else {
      out = raw.trimEnd() + "\n\n" + block;
    }
  } else {
    out = block;
  }

  fs.writeFileSync(OUT_FILE, out.trimEnd() + "\n", "utf8");
  console.log("\nUpdated", OUT_FILE, "— forum section has", sections.length, "thread(s).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
