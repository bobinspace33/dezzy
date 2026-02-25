#!/usr/bin/env node
/**
 * Rescrapes only the URLs that previously timed out ("doc indicators not found").
 * Uses longer waits and only appends to cl-docs.md if new content is found.
 *
 * Run: node scrape-docs-retry-timeouts.js
 */

const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "cl-docs.md");
const DOC_INDICATORS = /sink|source|component|when\s*\(|otherwise|screen\d|\.(content|hidden|latex)|numericValue|bind\s*:/i;

// URLs that showed "doc indicators not found within 20s" in the terminal run
const TIMEOUT_URLS = [
  "https://classroom.amplify.com/computation-layer/documentation#component:polygraph",
  "https://classroom.amplify.com/computation-layer/documentation#advanced",
  "https://classroom.amplify.com/computation-layer/documentation#type:annotationKeyPair",
  "https://classroom.amplify.com/computation-layer/documentation#type:buttonStyles",
  "https://classroom.amplify.com/computation-layer/documentation#type:color",
  "https://classroom.amplify.com/computation-layer/documentation#type:location",
  "https://classroom.amplify.com/computation-layer/documentation#type:polypadTools",
  "https://classroom.amplify.com/computation-layer/documentation#type:sketchTools",
  "https://classroom.amplify.com/computation-layer/documentation#deprecated-functions",
];

function getExistingSections(filePath) {
  if (!fs.existsSync(filePath)) return { byUrl: new Map(), allSigs: new Set() };
  const raw = fs.readFileSync(filePath, "utf8");
  const byUrl = new Map();
  const allSigs = new Set();
  const re = /## Scraped from: (\S+)\n\n([\s\S]*?)(?=\n\n---\n\n## Scraped from: |$)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const url = m[1].trim();
    const content = m[2].trim();
    const sig = content.slice(0, 300) + "…" + content.length;
    byUrl.set(url, { content, sig });
    allSigs.add(sig);
  }
  return { byUrl, allSigs };
}

async function scrapeOne(page, url, existingByUrl) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 35000 });

  let docIndicatorsFound = false;
  try {
    await page.waitForFunction(
      (pattern) => {
        const body = document.body && document.body.innerText;
        if (!body || body.length < 500) return false;
        return new RegExp(pattern).test(body);
      },
      { timeout: 35000 },
      DOC_INDICATORS.source
    );
    docIndicatorsFound = true;
  } catch (_) {
    // Longer extra wait for timeout pages
    await new Promise((r) => setTimeout(r, 15000));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise((r) => setTimeout(r, 4000));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 3000));
  }

  await new Promise((r) => setTimeout(r, 2000));

  // Try to apply hash inside iframe so section-specific content loads
  const hash = url.includes("#") ? url.slice(url.indexOf("#")) : "";
  if (hash) {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      try {
        await frame.evaluate((h) => {
          if (h && window.location.hash !== h) window.location.hash = h;
        }, hash);
      } catch (_) {}
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 1500));

  const text = await page.evaluate((useDocLikeScoring) => {
    const candidates = [];
    const add = (el) => {
      if (!el || !el.innerText) return;
      const t = el.innerText.trim();
      if (t.length < 400) return;
      const cls = (el.getAttribute && el.getAttribute("class")) || "";
      if (/nav|sidebar|header|footer|menu/.test(cls)) return;
      candidates.push({ text: t, len: t.length });
    };
    document.querySelectorAll("main, article, [role='main']").forEach(add);
    document.querySelectorAll("[class*='content'], [class*='documentation'], [class*='doc'], [class*='markdown'], [class*='prose']").forEach(add);
    [].forEach.call(document.querySelectorAll("div, section"), (el) => {
      if (el.closest("nav") || el.closest("[role='navigation']")) return;
      add(el);
    });
    const docLike = /sink|source|when\s*\(|otherwise|component|screen\d|\.(content|hidden|latex)|numericValue|bind\s*:/i;
    let best = null;
    let bestScore = 0;
    candidates.forEach(({ text: t, len }) => {
      const score = useDocLikeScoring && docLike.test(t) ? len + 100000 : len;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    });
    return best || (document.body && document.body.innerText) || "";
  }, docIndicatorsFound);

  let trimmed = (text && text.trim()) || "";

  // Iframe fallback
  if (trimmed.length < 2000 || !DOC_INDICATORS.test(trimmed)) {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      try {
        const frameText = await frame.evaluate(() => document.body && document.body.innerText);
        const t = (frameText || "").trim();
        if (t.length > trimmed.length && t.length > 500) trimmed = t;
      } catch (_) {}
    }
  }

  return trimmed;
}

async function main() {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    console.error("Puppeteer not found. Run: npm install puppeteer");
    process.exit(1);
  }

  const { byUrl: existingByUrl, allSigs: existingSigs } = getExistingSections(OUT_FILE);
  const toAppend = [];

  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const url of TIMEOUT_URLS) {
      console.log("Loading:", url);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      try {
        const trimmed = await scrapeOne(page, url, existingByUrl);
        await page.close();

        if (trimmed.length < 300) {
          console.log("  -> too little content, skipping");
          continue;
        }

        const sig = trimmed.slice(0, 300) + "…" + trimmed.length;
        const existing = existingByUrl.get(url);
        if (existing && existing.sig === sig) {
          console.log("  -> same content already in cl-docs.md for this URL, skipping");
          continue;
        }
        // Don't append if this exact content is already in the file under any URL (generic iframe blob)
        if (existingSigs.has(sig)) {
          console.log("  -> content duplicate of another section, skipping");
          continue;
        }
        if (existing && existing.content.length > 500 && trimmed.length <= existing.content.length + 100) {
          const overlap = trimmed.slice(0, 500) === existing.content.slice(0, 500);
          if (overlap) {
            console.log("  -> content matches existing section, skipping");
            continue;
          }
        }

        toAppend.push({ url, text: trimmed });
        console.log("  -> new content:", trimmed.length, "chars (will append)");
      } catch (err) {
        await page.close();
        console.log("  -> error:", err.message);
      }
    }
  } finally {
    await browser.close();
  }

  if (toAppend.length > 0) {
    const block = toAppend.map(({ url, text }) => `\n\n---\n\n## Scraped from: ${url}\n\n${text}`).join("");
    fs.appendFileSync(OUT_FILE, block);
    console.log("\nAppended", toAppend.length, "section(s) to", OUT_FILE);
  } else {
    console.log("\nNo new content to append.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
