/**
 * Minimal backend to proxy OpenAI requests (keeps API key off the client).
 * Run: npm run start  (or node server.js)
 * Then open http://localhost:3000
 */

require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
let pdfParse = null;
try {
  pdfParse = require("pdf-parse");
} catch (_) {
  // pdf-parse optional; PDFs in Docs will be skipped if not installed
}

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash-lite";
const GEMINI_INSTRUCTIONS = process.env.GEMINI_INSTRUCTIONS || "You are Dezzy, an expert in Desmos Activity Builder Computation Layer (CL). Output valid CL code when asked; you can add brief comments. You can use code the user has saved in slides to give context-aware help.";

function getClDocsContext() {
  const p = path.join(__dirname, "cl-docs.md");
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8").slice(0, 14000);
}

function getClExamplesContext() {
  const p = path.join(__dirname, "cl-examples.md");
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8").slice(0, 4000);
}

// Extra docs/sites Dezzy can use. Put pasted content, links, or notes here.
function getDezzyExtraContext() {
  const p = path.join(__dirname, "dezzy-docs.md");
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8").slice(0, 12000);
}

// Docs folder: philosophy, style, learning objects, scope and sequence, etc.
const DOCS_FOLDER = path.join(__dirname, "Docs");
const DOCS_MAX_CHARS = 25000;
const DOCS_TEXT_EXTENSIONS = [".md", ".txt", ".json"];
const DOCS_PDF_EXTENSION = ".pdf";

async function getDocsFolderContext() {
  if (!fs.existsSync(DOCS_FOLDER) || !fs.statSync(DOCS_FOLDER).isDirectory()) return "";
  const parts = [];
  try {
    const entries = fs.readdirSync(DOCS_FOLDER, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort();
    for (const name of files) {
      const fp = path.join(DOCS_FOLDER, name);
      const ext = path.extname(name).toLowerCase();
      let raw = "";
      if (DOCS_TEXT_EXTENSIONS.includes(ext)) {
        raw = fs.readFileSync(fp, "utf8");
      } else if (ext === DOCS_PDF_EXTENSION && pdfParse) {
        try {
          const buf = fs.readFileSync(fp);
          const data = await pdfParse(buf);
          raw = (data && data.text) ? data.text : "";
        } catch (_) {
          raw = "";
        }
      }
      if (raw && raw.length > 0) parts.push("--- " + name + " ---\n" + raw);
    }
    if (parts.length === 0) return "";
    return parts.join("\n\n").slice(0, DOCS_MAX_CHARS);
  } catch (_) {
    return "";
  }
}

// Guides folder: scraped sites (from scrape-guides.js), .md only
const GUIDES_FOLDER = path.join(__dirname, "Guides");
const GUIDES_MAX_CHARS = 18000;

function getGuidesFolderContext() {
  if (!fs.existsSync(GUIDES_FOLDER) || !fs.statSync(GUIDES_FOLDER).isDirectory()) return "";
  const parts = [];
  try {
    const entries = fs.readdirSync(GUIDES_FOLDER, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => e.name)
      .sort();
    for (const name of files) {
      const fp = path.join(GUIDES_FOLDER, name);
      const raw = fs.readFileSync(fp, "utf8");
      if (raw && raw.trim().length > 0) parts.push(raw);
    }
    if (parts.length === 0) return "";
    return parts.join("\n\n").slice(0, GUIDES_MAX_CHARS);
  } catch (_) {
    return "";
  }
}

// Dezzy chat history: last 24 hours, persisted to file across restarts
const DEZZY_HISTORY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const DEZZY_HISTORY_MAX_TURNS = 30;
const DEZZY_HISTORY_FILE = path.join(__dirname, "dezzy-history.json");

let dezzyChatHistory = [];

function loadDezzyHistory() {
  try {
    if (fs.existsSync(DEZZY_HISTORY_FILE)) {
      const raw = fs.readFileSync(DEZZY_HISTORY_FILE, "utf8");
      const arr = JSON.parse(raw);
      const cutoff = Date.now() - DEZZY_HISTORY_MAX_AGE_MS;
      dezzyChatHistory = Array.isArray(arr) ? arr.filter((m) => m && m.at > cutoff) : [];
    }
  } catch (_) {
    dezzyChatHistory = [];
  }
}

function saveDezzyHistory() {
  try {
    const cutoff = Date.now() - DEZZY_HISTORY_MAX_AGE_MS;
    const trimmed = dezzyChatHistory.filter((m) => m && m.at > cutoff);
    dezzyChatHistory = trimmed;
    fs.writeFileSync(DEZZY_HISTORY_FILE, JSON.stringify(trimmed, null, 0), "utf8");
  } catch (_) {}
}

function buildDezzyContents(newUserText) {
  const cutoff = Date.now() - DEZZY_HISTORY_MAX_AGE_MS;
  const recent = dezzyChatHistory.filter((m) => m && m.at > cutoff).slice(-DEZZY_HISTORY_MAX_TURNS);
  const contents = recent.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  contents.push({ role: "user", parts: [{ text: newUserText || "Say hello and remind me you can help with CL." }] });
  return contents;
}

loadDezzyHistory();

function serveFile(res, filePath, contentType) {
  const full = path.join(__dirname, filePath);
  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function parseJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve static files
  if (req.method === "GET") {
    if (req.url === "/" || req.url === "") {
      serveFile(res, "index.html", "text/html");
      return;
    }
    if (req.url === "/styles.css") {
      serveFile(res, "styles.css", "text/css");
      return;
    }
    if (req.url === "/app.js") {
      serveFile(res, "app.js", "application/javascript");
      return;
    }
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  // POST /api/generate
  if (req.method === "POST" && req.url === "/api/generate") {
    if (!OPENAI_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "OPENAI_API_KEY not set in .env" }));
      return;
    }

    let body;
    try {
      body = await parseJson(req);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing or invalid prompt" }));
      return;
    }

    const clDocsContext = getClDocsContext().slice(0, 10000);
    const clExamplesContext = getClExamplesContext();
    const systemPrompt = `You are an expert in Desmos Activity Builder Computation Layer (CL). You must output ONLY valid CL code that uses built-in, documented features. Do not wrap in markdown code fences.

Prefer the "Working code examples" and any "Forum example snippets" in the documentation below — match their structure, syntax, and component names (input1, note1, graph1, exp1, etc.) unless the user asks otherwise.

STRICT RULES — only use features that exist in the CL documentation below:
- Every top-level line in CL must be either a variable assignment (name = expression) or a sink assignment (sinkName: value). Do not output bare expressions or standalone when(...) or function calls at top level — this causes "toplevel declarations must be variable or sink assignments" errors. Use when/otherwise only on the right-hand side of = or :.
- Use ONLY sinks, sources, functions, component types, and syntax that appear in the documentation provided. Do not invent or assume any APIs. If a feature is not documented below, do not use it.
- For slide CL and component CL, only reference documented components (e.g. note, graph, Math Response [for math/expressions], action button, multiple choice, table, etc.) and their documented sinks/sources. In slide CL, reference components by name only: use table1, note1, graph1, etc., not slide1.table1 or screen1.note1 (no slide/screen prefix). The math/expression component is called Math Response (formerly Math Input). There is no separate slider component — use the graph component for sliders (e.g. add a Graph, create a variable like a in the graph with its slider; reference via graph1.number("a")). Do not use numberList — it is no longer a valid sink. To set a list variable in the graph (e.g. for aggregate), use the expression sink with list literal latex: L = aggregate(...), listLatex = \`[\${L.reduce("", (acc, cur) => when(acc = "", \`\${cur}\`, \`\${acc},\${cur}\`))}]\` (use template literals only, no +), then expression("a_{class}"): listLatex.
- Do not use deprecated functions; use the replacements listed in the Deprecated Functions section (e.g. sketch.strokeCount not sketchStrokeCount, line.angle not angleOfLine). Use randomGenerator() with r.int() or r.float() for random numbers — do not use randomInteger. For mean of a list, do not use mean() — use list.reduce(0, (acc, cur) => numericValue(...)) for sum, length(list) for count, then numericValue with \\frac{sum}{n} for the mean. For table columns use table1.columnNumericValues(columnIndex), not table.column(""). Do not use zip — CL has no zip; pair two lists by index using range(length(L)).map((i) => ...) with L.elementAt(i) and M.elementAt(i) (1-based). Do not use countBy — CL has no countBy; use reduce or filter+length to count by value. In arrow functions use a space after the comma: (el, i) => not (el,i) => to avoid "expected =>" syntax errors. list.join(otherList) only concatenates two lists; it does not join list elements into a string with a separator — use reduce to build a string from a list of strings (e.g. list.reduce("", (acc, cur) => when(acc = "", cur, acc + ", " + cur))).
- In numericValue() strings (LaTeX): do not use raw / for division — use \\frac{numerator}{denominator} or \\div. For subtraction use - with parentheses around operands when needed, e.g. numericValue(\`(\${a})-(\${b})\`).
- Arithmetic with variables: CL does not support infix expressions like target = 500 + 100*randNum. Use numericValue with a template literal (e.g. target = numericValue(\`500+100*\${randNum}\`)) or simpleFunction (e.g. f = simpleFunction("500+100*x", "x") then target = f.evaluateAt(randNum)).
- If the user asks for something that has no documented CL feature, use the closest documented alternative and add a brief comment (#) explaining the limitation.

Where code goes — output instructions in slide order with these exact headers (so the UI can show placement in orange):
- Order by slide: Slide 1 first, then Slide 2, then Slide 3, etc.
- For each slide, give the slide-level CL first, then each component on that slide.
- Use exactly these header lines (one per block), then a blank line, then the CL code:
  - Slide-level: "Slide 1 CL", "Slide 2 CL", "Slide 3 CL", etc.
  - Component-level: "Slide 1 - Note CL", "Slide 1 - Graph CL", "Slide 2 - Math Response CL", "Slide 2 - Table CL", etc. (Slide N - ComponentName CL).
- Example order: Slide 1 CL → Slide 1 - Note CL → Slide 1 - Graph CL → Slide 2 CL → Slide 2 - Note CL → …

Format: plain text only. Each block = one header line (Slide N CL or Slide N - Component CL), blank line, then CL code. In CL code, comments use # only. Do not use // or /* */.

Other rules:
- Use standard documented syntax: when/otherwise, content, hidden, numericValue, component names (e.g. input1, note1, graph1).
- Write code only for what the user asked; do not generate long lists of screens unless they ask.
- Prefer a few targeted lines over repeating the same property on many screens.
- Target the specific component or screen the user mentions (e.g. for "hide X", hide that component only). For aggregating all student responses on a new slide: Slide 1 has a graph (e.g. graph1) with a value to collect; Slide 2 — put the code in the Graph component CL: number("a"): graph1.number("a"), and for the class list use expression sink with list latex (not numberList): L = aggregate(graph1.number("a")), listLatex = \`[\${L.reduce("", (acc, cur) => when(acc = "", \`\${cur}\`, \`\${acc},\${cur}\`))}]\`, expression("a_{class}"): listLatex.

--- BEGIN CL DOCUMENTATION (authoritative reference; only use features described here) ---
${clDocsContext}
${clExamplesContext ? "\n\n--- FORUM / WORKING EXAMPLES (prefer these patterns) ---\n\n" + clExamplesContext + "\n--- END EXAMPLES ---\n" : ""}
--- END CL DOCUMENTATION ---`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 1024,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error?.message || data.error?.code || response.statusText;
        console.error("[api/generate] OpenAI error:", data.error || response.status);
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(errMsg) }));
        return;
      }

      const content = (data.choices?.[0]?.message?.content ?? "").trim();
      if (!content) {
        console.error("[api/generate] OpenAI returned empty content. Model:", OPENAI_MODEL, "Raw choices:", JSON.stringify(data.choices?.length ?? 0));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          code: "",
          error: "OpenAI returned no text. Check OPENAI_MODEL in .env (e.g. gpt-4o, gpt-4o-mini, gpt-4.1) and that your API key is valid.",
        }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: content }));
    } catch (err) {
      console.error("[api/generate] Request failed:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "OpenAI request failed" }));
    }
    return;
  }

  // POST /api/summarize — short (max 8 word) summary of CL code for slide thumbnail
  if (req.method === "POST" && req.url === "/api/summarize") {
    if (!OPENAI_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "OPENAI_API_KEY not set in .env" }));
      return;
    }

    let body;
    try {
      body = await parseJson(req);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const code = body.code;
    if (code === undefined || code === null) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing code" }));
      return;
    }

    const systemPrompt = "You summarize Desmos Activity Builder Computation Layer (CL) code in very short phrases for a slide thumbnail. Reply with only the phrase: at most 8 words, no quotes, no period. Describe what the code does (e.g. 'Note shows feedback when input submitted', 'Hide button until graph slider value is 5'). There is no separate slider component; sliders use the graph component.";

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: String(code).slice(0, 2000) },
          ],
          max_completion_tokens: 60,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error?.message || data.error?.code || response.statusText;
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(errMsg) }));
        return;
      }

      const raw = (data.choices?.[0]?.message?.content || "").trim();
      const summary = raw.replace(/^["']|["']$/g, "").slice(0, 80);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ summary }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "OpenAI request failed" }));
    }
    return;
  }

  // POST /api/dezzy — Gemini chatbot (Dezzy) with cl-docs context
  if (req.method === "POST" && req.url === "/api/dezzy") {
    if (!GEMINI_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "GEMINI_API_KEY not set in .env" }));
      return;
    }

    let body;
    try {
      body = await parseJson(req);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const message = body.message != null ? String(body.message) : "";
    const slideCodeContext = body.slideCodeContext && typeof body.slideCodeContext === "object" ? body.slideCodeContext : {};
    const suggestionRequest = body.suggestionRequest === true;
    const codeJustStored = body.codeJustStored != null ? String(body.codeJustStored) : "";

    const clDocs = getClDocsContext();
    const dezzyExtra = getDezzyExtraContext();
    const docsFolder = await getDocsFolderContext();
    let systemText = (GEMINI_INSTRUCTIONS || "").trim();
    systemText += "\n\nGive complete, thorough answers. Do not stop mid-explanation; include full solutions, code fixes, and steps when explaining errors or answering questions. When writing CL code, use # for comments only (not // or /* */).";
    if (clDocs) {
      systemText += "\n\nUse the following Computation Layer documentation as reference (abbreviated):\n\n" + clDocs;
    }
    if (dezzyExtra) {
      systemText += "\n\nAdditional reference (sites, documents, notes):\n\n" + dezzyExtra;
    }
    if (docsFolder) {
      systemText += "\n\nReference from Docs folder (Amplify Desmos math philosophy, style, learning objects, scope and sequence, etc.). Use these to align advice and suggestions:\n\n" + docsFolder;
    }
    const guidesFolder = getGuidesFolderContext();
    if (guidesFolder) {
      systemText += "\n\nScraped guides (from Guides folder). Use for style, pedagogy, or reference:\n\n" + guidesFolder;
    }
    if (Object.keys(slideCodeContext).length > 0) {
      systemText += "\n\nCode the user has saved per slide (slideId -> code):\n" + JSON.stringify(slideCodeContext, null, 0).slice(0, 4000);
    }

    let userText = message;
    if (suggestionRequest && codeJustStored) {
      userText = "The user just copied this code to a new slide:\n\n" + codeJustStored.slice(0, 2000) + "\n\nGive 1-2 short ideas for: (1) how to improve or extend this activity, (2) how to make it more interactive (e.g. with CL, graph, input, or feedback), and/or (3) how to include a higher-order or higher DOK (Depth of Knowledge) task—e.g. reasoning, explaining, comparing, or creating. Reply in plain text only, clear English, 2-4 sentences. No placeholders or scrambled text.";
    }
    const userMessageForHistory = userText || "Say hello and remind me you can help with CL.";

    const contents = buildDezzyContents(userMessageForHistory);
    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemText }] },
      generationConfig: { maxOutputTokens: 16384 },
    };

    async function callGemini(model) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(GEMINI_API_KEY);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const errMsg = data.error?.message || (data.error && JSON.stringify(data.error)) || response.statusText;
      const isQuota = response.status === 429 || (errMsg && /quota|RESOURCE_EXHAUSTED|rate.limit/i.test(errMsg));
      return { response, data, errMsg: errMsg ? String(errMsg) : "", isQuota };
    }

    try {
      let result = await callGemini(GEMINI_MODEL);
      if (result.isQuota && GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL) {
        result = await callGemini(GEMINI_FALLBACK_MODEL);
      }

      const { response, data, errMsg, isQuota } = result;

      if (!response.ok) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: errMsg || response.statusText }));
        return;
      }

      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        const fb = data.promptFeedback;
        const blockReason = fb?.blockReason ? " Block reason: " + fb.blockReason : "";
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Gemini returned no reply." + blockReason, text: "" }));
        return;
      }

      const candidate = candidates[0];
      const part = candidate?.content?.parts?.[0];
      const text = (part?.text || "").trim();
      const finishReason = candidate?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        console.warn("Dezzy response was cut (MAX_TOKENS). Consider increasing maxOutputTokens.");
      }

      dezzyChatHistory.push({ role: "user", text: userMessageForHistory, at: Date.now() });
      dezzyChatHistory.push({ role: "model", text, at: Date.now() });
      saveDezzyHistory();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ text }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Gemini request failed" }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("Server at http://localhost:" + PORT);
  console.log("Open in browser and use the prompt to test OpenAI → CL code.");
  if (OPENAI_API_KEY) console.log("OPENAI_MODEL:", OPENAI_MODEL);
  else console.warn("OPENAI_API_KEY not set; /api/generate will fail.");
  if (!OPENAI_API_KEY) console.warn("WARN: OPENAI_API_KEY not set in .env");
});
