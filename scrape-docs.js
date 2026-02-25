#!/usr/bin/env node
/**
 * Scrapes Computation Layer documentation from official JS-rendered pages
 * and appends the extracted text to cl-docs.md.
 *
 * Requires: npm install puppeteer
 * Run: node scrape-docs.js
 */

const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "cl-docs.md");
const DEBUG = process.argv.includes("--debug");
const DOC_URLS = [
  "https://classroom.amplify.com/computation-layer/documentation",
  "https://classroom.amplify.com/computation-layer/documentation#components",
  "https://teacher.desmos.com/computation-layer/documentation",
  "https://classroom.amplify.com/computation-layer/documentation#sinks-sources",
  "https://classroom.amplify.com/computation-layer/documentation#dynamic-text",
  "https://classroom.amplify.com/computation-layer/documentation#conditionals",
 "https://classroom.amplify.com/computation-layer/documentation#correctness",
 "https://classroom.amplify.com/computation-layer/documentation#component:action-button",
 "https://classroom.amplify.com/computation-layer/documentation#component:cardsort",
 "https://classroom.amplify.com/computation-layer/documentation#component:challenge",
 "https://classroom.amplify.com/computation-layer/documentation#component:input/text",
 "https://classroom.amplify.com/computation-layer/documentation#component:input/graph",
 "https://classroom.amplify.com/computation-layer/documentation#component:exhibit/image",
 "https://classroom.amplify.com/computation-layer/documentation#component:input/expression",
 "https://classroom.amplify.com/computation-layer/documentation#component:video", 
 "https://classroom.amplify.com/computation-layer/documentation#component:multiple-choice",
 "https://classroom.amplify.com/computation-layer/documentation#component:exhibit/text",
 "https://classroom.amplify.com/computation-layer/documentation#component:reorder",
 "https://classroom.amplify.com/computation-layer/documentation#component:polygraph", 
 "https://classroom.amplify.com/computation-layer/documentation#component:polypad", 
 "https://classroom.amplify.com/computation-layer/documentation#component:screen",
 "https://classroom.amplify.com/computation-layer/documentation#component:sketch", 
 "https://classroom.amplify.com/computation-layer/documentation#component:table",
 "https://classroom.amplify.com/computation-layer/documentation#advanced",
 "https://classroom.amplify.com/computation-layer/documentation#graphs", 
 "https://classroom.amplify.com/computation-layer/documentation#aggregate",
 "https://classroom.amplify.com/computation-layer/documentation#interpreting-math",
 "https://classroom.amplify.com/computation-layer/documentation#random", 
 "https://classroom.amplify.com/computation-layer/documentation#index", 
 "https://classroom.amplify.com/computation-layer/documentation#logic",
 "https://classroom.amplify.com/computation-layer/documentation#types", 
 "https://classroom.amplify.com/computation-layer/documentation#type:annotationKeyPair",
 "https://classroom.amplify.com/computation-layer/documentation#type:bounds",
 "https://classroom.amplify.com/computation-layer/documentation#type:buttonStyles",
 "https://classroom.amplify.com/computation-layer/documentation#type:color",
 "https://classroom.amplify.com/computation-layer/documentation#type:colorPalette",
 "https://classroom.amplify.com/computation-layer/documentation#type:conic",
 "https://classroom.amplify.com/computation-layer/documentation#type:equation",
 "https://classroom.amplify.com/computation-layer/documentation#type:evaluationFrame",
 "https://classroom.amplify.com/computation-layer/documentation#type:inequality", 
 "https://classroom.amplify.com/computation-layer/documentation#type:list",
 "https://classroom.amplify.com/computation-layer/documentation#type:location",
 "https://classroom.amplify.com/computation-layer/documentation#type:mathFunction",
 "https://classroom.amplify.com/computation-layer/documentation#type:orderedPair",
 "https://classroom.amplify.com/computation-layer/documentation#type:parabola",
 "https://classroom.amplify.com/computation-layer/documentation#type:polypadTools",
 "https://classroom.amplify.com/computation-layer/documentation#type:randomGenerator",
 "https://classroom.amplify.com/computation-layer/documentation#type:sketch",
 "https://classroom.amplify.com/computation-layer/documentation#type:sketchTools",
 "https://classroom.amplify.com/computation-layer/documentation#type:xyLine",
 "https://classroom.amplify.com/computation-layer/documentation#other-functions",
 "https://classroom.amplify.com/computation-layer/documentation#deprecated-functions"
];

// Text that indicates the real doc content has loaded (not just welcome/loading)
const DOC_INDICATORS = /sink|source|component|when\s*\(|otherwise|screen\d|\.(content|hidden|latex)|numericValue|bind\s*:/i;

async function scrapeWithPuppeteer() {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    console.error("Puppeteer not found. Run: npm install puppeteer");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: !DEBUG });
  const seen = new Set();
  const allText = [];

  try {
    for (let i = 0; i < DOC_URLS.length; i++) {
      const url = DOC_URLS[i];
      console.log("Loading:", url);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Wait until doc-like content appears (not just "Computation Layer Documentation" + Loading)
      let docIndicatorsFound = false;
      try {
        await page.waitForFunction(
          (pattern) => {
            const body = document.body && document.body.innerText;
            if (!body || body.length < 500) return false;
            return new RegExp(pattern).test(body);
          },
          { timeout: 20000 },
          DOC_INDICATORS.source
        );
        docIndicatorsFound = true;
      } catch (_) {
        console.log("  -> doc indicators not found within 20s, waiting longer and will use longest text block");
        // Give slow or differently-worded pages more time to render
        await new Promise((r) => setTimeout(r, 12000));
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await new Promise((r) => setTimeout(r, 3000));
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Extra time for hash-routed content (e.g. #components) to render
      if (docIndicatorsFound) await new Promise((r) => setTimeout(r, 3000));

      // Scroll to trigger lazy-loaded content
      await page.evaluate(() => {
        const main = document.querySelector("main") || document.querySelector("[role='main']") || document.body;
        if (main) {
          main.scrollTop = main.scrollHeight / 2;
        }
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise((r) => setTimeout(r, 1500));
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise((r) => setTimeout(r, 1000));

      const text = await page.evaluate((useDocLikeScoring) => {
        // Collect candidates: main, article, and any div/section that might hold doc body
        const candidates = [];
        const add = (el) => {
          if (!el || !el.innerText) return;
          const t = el.innerText.trim();
          if (t.length < 400) return;
          const cls = (el.getAttribute && el.getAttribute("class")) || "";
          if (/nav|sidebar|header|footer|menu/.test(cls)) return;
          candidates.push({ el, text: t, len: t.length });
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
          // When doc indicators weren't found on the page, just pick longest block (no keyword bonus)
          const score = useDocLikeScoring && docLike.test(t) ? len + 100000 : len;
          if (score > bestScore) {
            bestScore = score;
            best = t;
          }
        });
        if (best) return best;
        return (document.body && document.body.innerText) || "";
      }, docIndicatorsFound);

      let trimmed = text && text.trim();

      // If main page had only shell/welcome text, try iframes (some doc SPAs render inside iframe)
      if (trimmed.length < 2000 || !DOC_INDICATORS.test(trimmed)) {
        for (const frame of page.frames()) {
          if (frame === page.mainFrame()) continue;
          try {
            const frameText = await frame.evaluate(() => document.body && document.body.innerText);
            const t = (frameText || "").trim();
            if (t.length > trimmed.length && t.length > 500) {
              trimmed = t;
              console.log("  -> using content from iframe");
              break;
            }
          } catch (_) {}
        }
      }

      // Debug: save first page HTML to inspect DOM
      if (DEBUG && i === 0) {
        const html = await page.content();
        fs.writeFileSync(path.join(__dirname, "scrape-debug.html"), html, "utf8");
        console.log("  -> saved scrape-debug.html for inspection");
      }

      const sig = trimmed.slice(0, 500) + "…" + trimmed.length;
      if (seen.has(sig)) {
        console.log("  -> same content as a previous page, skipping duplicate");
        await page.close();
        continue;
      }
      seen.add(sig);

      if (trimmed.length > 300) {
        allText.push(`\n\n---\n\n## Scraped from: ${url}\n\n${trimmed}`);
        console.log("  -> got", trimmed.length, "chars");
      } else {
        console.log("  -> little or no content (", trimmed.length, "chars)");
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  if (allText.length > 0) {
    const append = "\n\n" + allText.join("");
    fs.appendFileSync(OUT_FILE, append);
    console.log("\nAppended scraped content to", OUT_FILE);
  } else {
    console.log("\nNo new content was scraped. Pages may show the same shell or require login.");
  }
}

scrapeWithPuppeteer().catch((err) => {
  console.error(err);
  process.exit(1);
});
