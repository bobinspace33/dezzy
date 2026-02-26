# Desmos CL Prompt → Code

Simple split-screen UI: prompt + slide thumbnails on the left, **Computation Layer** code output on the right (black background, neon green text). Built for [Amplify Desmos Activity Builder](https://cl.desmos.com/) and [Computation Layer](https://classroom.amplify.com/computation-layer/documentation).

## What’s included

- **Left:** Landscape slide cards (drag-and-drop to reorder, + to add), prompt textarea, “Generate CL code” button.
- **Right:** Code output panel (black bg, neon green text) for pasting or generated CL code.

## What you need to wire up the LLM

1. **LLM API**
   - **Option A:** OpenAI-compatible API (OpenAI, Azure, or any compatible endpoint).
   - **Option B:** Anthropic (Claude) or another provider with a REST API.
   - You’ll need: **API key**, **base URL** (if not default), and **model name**.

2. **Computation Layer context for the model**
   - **`cl-docs.md`** in this repo contains a curated reference (CL 101, show/hide, list functions, forum links). Use it as system/RAG context for the LLM.
   - Official docs (content loads via JS):
     - [Computation Layer Documentation](https://classroom.amplify.com/computation-layer/documentation) · [Components](https://classroom.amplify.com/computation-layer/documentation#components)
     - [teacher.desmos.com/computation-layer/documentation](https://teacher.desmos.com/computation-layer/documentation)
   - **Scrape full official docs into `cl-docs.md`:** run `npm install` then `npm run scrape-docs`. This uses Puppeteer to open the docs, wait for content, and append the text to `cl-docs.md`.
   - **Scrape sites into the Guides folder:** Add URLs to `Guides/urls.txt` (one per line) or pass them as arguments. Run `npm run scrape-guides` to fetch each site and save it as a markdown file in `Guides/` (e.g. for reference materials, style guides, or learning-object docs). Requires Puppeteer.

3. **Files you might add**
   - `config.js` or `.env`: store `API_KEY`, `API_BASE_URL`, `MODEL` (don’t commit real keys).
   - `cl-docs.md` (or similar): exported Computation Layer docs/snippets to send to the LLM.
   - **`Docs/` folder:** Any `.md`, `.txt`, `.json`, or `.pdf` files in this folder are loaded and sent to **Dezzy** (the Gemini chatbot). PDFs are parsed for text via `pdf-parse`. Use the folder for Amplify Desmos math philosophy, style, learning objects, scope and sequence, etc. Dezzy uses them to align advice and suggestions with your materials.
   - In `app.js`: replace the placeholder in the “Generate CL code” click handler with a `fetch()` (or SDK) call to your LLM, passing the prompt and optionally the current slide list; put the model’s response into the right-hand code panel.

## Backup with Git

The repo is set up for Git. To use a remote for backup:

1. Create a new repository on GitHub (or GitLab, etc.) — do **not** add a README or .gitignore (this repo already has them).
2. From the project folder run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git add .
   git commit -m "Initial commit"
   git push -u origin master
   ```
3. Use `git add .`, `git commit -m "message"`, and `git push` to back up changes. `.env` and `node_modules` are ignored and won’t be committed.

## Save / open projects

Use **Save project** to store the current state (slide order, number of slides, code on each slide, code output panel, and prompt) in the browser’s local storage. Use **Open project** to pick a saved project and restore it. Projects are stored only in this browser; they are not sent to the server or Git.

## Run locally

Open `index.html` in a browser (no build step). For LLM calls from the browser you’ll need either a backend proxy (to hide the API key) or a serverless function that forwards requests to your LLM provider.

## Summary

| Need | Purpose |
|------|--------|
| **LLM API key + endpoint** | To turn the prompt into CL code. |
| **Computation Layer docs** | So the model knows CL syntax/components; use Amplify/teacher docs or a local copy. |
| **Optional: backend proxy** | To keep the API key off the client. |
