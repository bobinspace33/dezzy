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

    const systemPrompt = `You are an expert in Desmos Activity Builder Computation Layer (CL). Output only valid CL code, no markdown code fences or extra explanation.

Rules:
- Use standard CL syntax: component names (e.g. input1, note1), when/otherwise, content, hidden, numericValue, etc.
- Write code for the screens and components the user is describing. Do NOT generate a long list of screens (e.g. screen1, screen2, ... screen20) unless the user explicitly asks for many screens.
- Prefer one or a few targeted lines (e.g. one note, one input) over repeating the same property across many screens.
- If the user says "hide" something, target that specific component or screen, not every screen.`;

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
          max_completion_tokens: 1024,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error?.message || data.error?.code || response.statusText;
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(errMsg) }));
        return;
      }

      const content = data.choices?.[0]?.message?.content?.trim() || "";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: content }));
    } catch (err) {
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

    const systemPrompt = "You summarize Desmos Activity Builder Computation Layer (CL) code in very short phrases for a slide thumbnail. Reply with only the phrase: at most 8 words, no quotes, no period. Describe what the code does (e.g. 'Note shows feedback when input submitted', 'Hide button until slider value is 5').";

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
    if (clDocs) {
      systemText += "\n\nUse the following Computation Layer documentation as reference (abbreviated):\n\n" + clDocs;
    }
    if (dezzyExtra) {
      systemText += "\n\nAdditional reference (sites, documents, notes):\n\n" + dezzyExtra;
    }
    if (docsFolder) {
      systemText += "\n\nReference from Docs folder (Amplify Desmos math philosophy, style, learning objects, scope and sequence, etc.). Use these to align advice and suggestions:\n\n" + docsFolder;
    }
    if (Object.keys(slideCodeContext).length > 0) {
      systemText += "\n\nCode the user has saved per slide (slideId -> code):\n" + JSON.stringify(slideCodeContext, null, 0).slice(0, 4000);
    }

    let userText = message;
    if (suggestionRequest && codeJustStored) {
      userText = "The user just copied this code to a slide:\n\n" + codeJustStored.slice(0, 2000) + "\n\nGive 1-2 short suggestions for what else they could add to other slides (e.g. related CL features or improvements). Reply in plain text only, clear English, 2-4 sentences. No placeholders or scrambled text.";
    }
    const userMessageForHistory = userText || "Say hello and remind me you can help with CL.";

    const contents = buildDezzyContents(userMessageForHistory);
    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemText }] },
      generationConfig: { maxOutputTokens: 1024 },
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

      const part = candidates[0]?.content?.parts?.[0];
      const text = (part?.text || "").trim();

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
  if (!OPENAI_API_KEY) console.warn("WARN: OPENAI_API_KEY not set in .env");
});
