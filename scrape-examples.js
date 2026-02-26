#!/usr/bin/env node
/**
 * Scrapes CL code examples from Desmos Computation Layer forum example topics
 * and writes them to cl-examples.md for use as context when generating code.
 *
 * Requires: npm install puppeteer
 * Run: node scrape-examples.js
 */

const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "cl-examples.md");
const DEBUG = process.argv.includes("--debug");

const FORUM_EXAMPLE_URLS = [
  "https://cl.desmos.com/t/show-hide-a-component/2028",
  "https://cl.desmos.com/t/desmos-demo-content-sink-providing-feedback-guess-my-number-activity/669",
  "https://cl.desmos.com/t/multiple-choice-question-w-immediate-feedback/1282",
  "https://cl.desmos.com/t/piecewise-expressions-in-notes-component-based-approach/4106",
];

// Patterns that suggest CL code (sinks, when/otherwise, etc.)
const CL_LIKE = /^\s*(content|hidden|label|correct|number\s*\(|when\s*\(|otherwise|bind\s*:|\w+\s*=\s*when|pointLabel|numericValue)/im;

function extractCodeBlocks(html) {
  const blocks = [];
  // <pre> or <code> blocks
  const preRe = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  const codeRe = /<code[^>]*>([\s\S]*?)<\/code>/gi;
  let m;
  while ((m = preRe.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
    if (text.length > 20 && CL_LIKE.test(text)) blocks.push(text);
  }
  while ((m = codeRe.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
    if (text.length > 20 && CL_LIKE.test(text) && !blocks.includes(text)) blocks.push(text);
  }
  return blocks;
}

function extractFromBodyText(bodyText) {
  const lines = bodyText.split(/\n/);
  const collected = [];
  let inBlock = false;
  let block = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const looksLikeCL = /^\s*(content|hidden|label|correct|number\s*\(|when\s*\(|otherwise|bind\s*:|\w+\s*=\s*when|pointLabel|numericValue|#\s)/im.test(trimmed) || (inBlock && (trimmed.endsWith(":") || trimmed.includes("otherwise") || /^[\w\.\("']/.test(trimmed)));
    if (looksLikeCL && trimmed.length > 0 && trimmed.length < 500) {
      if (!inBlock) inBlock = true;
      block.push(trimmed);
    } else if (inBlock && block.length > 0) {
      if (trimmed.length === 0 || block.length > 15) {
        const joined = block.join("\n");
        if (joined.length > 30 && CL_LIKE.test(joined)) collected.push(joined);
        block = [];
        inBlock = false;
      }
    }
  }
  if (block.length > 0) {
    const joined = block.join("\n");
    if (joined.length > 30 && CL_LIKE.test(joined)) collected.push(joined);
  }
  return collected;
}

async function scrapeWithPuppeteer() {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    console.error("Puppeteer not found. Run: npm install puppeteer");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: !DEBUG });
  const allBlocks = [];
  const seen = new Set();

  try {
    for (const url of FORUM_EXAMPLE_URLS) {
      console.log("Loading:", url);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
      } catch (e) {
        console.log("  -> timeout or error, continuing with current content");
      }
      await new Promise((r) => setTimeout(r, 2000));

      const html = await page.content();
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText : "");

      const fromPreCode = extractCodeBlocks(html);
      const fromBody = extractFromBodyText(bodyText);

      for (const block of fromPreCode) {
        const sig = block.slice(0, 80);
        if (!seen.has(sig)) {
          seen.add(sig);
          allBlocks.push(block);
        }
      }
      for (const block of fromBody) {
        const sig = block.slice(0, 80);
        if (!seen.has(sig)) {
          seen.add(sig);
          allBlocks.push(block);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const intro = `# Computation Layer — Forum example code

**Purpose:** Real CL code snippets from the [Computation Layer Support Forum](https://cl.desmos.com/c/examples/8) examples. Use these as patterns when generating code; match their structure and syntax.

**Source:** Scraped from forum example topics. Re-run \`node scrape-examples.js\` to refresh.

---

`;

  const section = allBlocks.length > 0
    ? "## Example snippets\n\n```\n" + allBlocks.map((b) => b.trim()).join("\n\n---\n\n") + "\n```\n"
    : "## No snippets extracted\n\nRun with Puppeteer; forum pages may need JavaScript to render.\n";

  fs.writeFileSync(OUT_FILE, intro + section, "utf8");
  console.log("Wrote", allBlocks.length, "snippets to", OUT_FILE);
}

scrapeWithPuppeteer().catch((err) => {
  console.error(err);
  process.exit(1);
});
