#!/usr/bin/env node
/**
 * Removes duplicate blocks and repeated welcome/boilerplate text from cl-docs.md.
 * Run: node dedup-cl-docs.js
 */

const fs = require("fs");
const path = require("path");
const OUT_FILE = path.join(__dirname, "cl-docs.md");

let raw = fs.readFileSync(OUT_FILE, "utf8");

// ---- Pass 1: Remove duplicate "## Scraped from: URL" sections (keep first occurrence per URL) ----
const lines = raw.split("\n");
const outLines = [];
let i = 0;
const seenScraped = new Set();
while (i < lines.length) {
  const m = lines[i].match(/^## Scraped from: (.+)$/);
  if (m) {
    const url = m[1].trim();
    if (seenScraped.has(url)) {
      i++;
      while (i < lines.length && !/^## /.test(lines[i])) i++;
      continue;
    }
    seenScraped.add(url);
  }
  outLines.push(lines[i]);
  i++;
}
raw = outLines.join("\n");

// ---- Pass 2: Remove repeated forum boilerplate inside "## Forum docs & tips" section ----
const forumStart = raw.indexOf("## Forum docs & tips (scraped)");
if (forumStart >= 0) {
  const before = raw.slice(0, forumStart);
  let forum = raw.slice(forumStart);
  forum = forum.replace(/\n\nComputation Layer Support Forum\n\n/g, "\n\n");
  forum = forum.replace(/\n[^\n]+ - [^\n]+ - Computation Layer Support Forum\n/g, "\n");
  forum = forum.replace(/\n(Resources|Articles|Examples|Home|Categories)\n(?=\n)/g, "\n");
  forum = forum.replace(/\n(Powered by [^\n]+|Privacy Policy|Terms of Service|Guidelines)\n/g, "\n");
  forum = forum.replace(/\nbest viewed with JavaScript enabled\n/g, "\n");
  forum = forum.replace(/\n{4,}/g, "\n\n\n");
  raw = before + forum;
}

fs.writeFileSync(OUT_FILE, raw.trimEnd() + "\n", "utf8");
console.log("Deduped", OUT_FILE, "— removed duplicate Scraped sections and forum boilerplate.");
console.log("Kept", seenScraped.size, "unique Scraped URL sections.");
