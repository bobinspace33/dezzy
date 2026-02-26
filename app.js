(function () {
  "use strict";

  const slidesTrack = document.getElementById("slidesTrack");
  const addSlideBtn = document.getElementById("addSlide");
  const promptInput = document.getElementById("promptInput");
  const generateBtn = document.getElementById("generateBtn");
  const codeContent = document.getElementById("codeContent");
  const codeText = document.getElementById("codeText");
  const codeCursor = document.getElementById("codeCursor");
  const sendCodeToSlideBtn = document.getElementById("sendCodeToSlideBtn");
  const codeLoading = document.getElementById("codeLoading");
  const askDezzyBtn = document.getElementById("askDezzyBtn");
  const dezzyThinking = document.getElementById("dezzyThinking");
  const dezzyReply = document.getElementById("dezzyReply");
  const clearPromptBtn = document.getElementById("clearPromptBtn");
  const dezzyReplyCloseBtn = document.getElementById("dezzyReplyCloseBtn");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatDezzyResponse(text) {
    if (!text || !text.trim()) return "";
    var t = escapeHtml(text);
    var codeBlocks = [];
    t = t.replace(/`([^`]*)`/g, function (_, code) {
      var i = codeBlocks.length;
      codeBlocks.push(escapeHtml(code));
      return "\x00CODE" + i + "\x00";
    });
    var lines = t.split("\n");
    for (var k = 0; k < lines.length; k++) {
      var line = lines[k];
      if (/^\s*(screen\d+|note\d+|input\d+|graph\d+|table\d+)\.[\s\S]*/.test(line) || /when\s*\(|otherwise|bind\s*:/.test(line)) {
        lines[k] = "<span class=\"dezzy-code\">" + line + "</span>";
      }
    }
    t = lines.join("\n");
    var keywordRegex = /\b(screen\d+|note\d+|input\d+|graph\d+|table\d+|cardsort\d+|challenge\d+|polygraph\d+|sketch\d+|actionbutton\d+|reorder\d+|Computation Layer|CL|component|Graph|Note|Input|Screen|Table|Math Response|when|otherwise|bind:|numericValue|content\.|\.content|\.hidden)\b/gi;
    t = t.replace(keywordRegex, "<span class=\"dezzy-keyword\">$1</span>");
    for (var j = 0; j < codeBlocks.length; j++) {
      t = t.replace("\x00CODE" + j + "\x00", "<span class=\"dezzy-code\">" + codeBlocks[j] + "</span>");
    }
    return t.replace(/\n/g, "<br>");
  }

  function showDezzyReply(html, append) {
    if (!dezzyReply) return;
    dezzyReply.removeAttribute("hidden");
    dezzyReply.setAttribute("aria-hidden", "false");
    if (append) {
      dezzyReply.innerHTML = dezzyReply.innerHTML + "<br><br>" + html;
    } else {
      dezzyReply.innerHTML = html;
    }
  }

  var CHAR_DELAY_MS = 12;
  var SENTENCE_PAUSE_MS = 1000;

  function typeDezzyReply(plainText, append, done) {
    if (!dezzyReply || !plainText) {
      if (done) done();
      return;
    }
    plainText = decodeHtmlEntities(plainText);
    if (!append) {
      dezzyReply.removeAttribute("hidden");
      dezzyReply.setAttribute("aria-hidden", "false");
      dezzyReply.innerHTML = "";
    }
    var prefix = append ? dezzyReply.innerHTML + "<br><br>" : "";
    var i = 0;
    promptTypingInProgress = true;
    function tick() {
      if (i >= plainText.length) {
        promptTypingInProgress = false;
        if (done) done();
        setTimeout(flushSuggestionQueue, 50);
        return;
      }
      var visible = plainText.slice(0, i + 1);
      dezzyReply.innerHTML = prefix + formatDezzyResponse(visible);
      var lastChar = plainText[i];
      i++;
      var nextDelay = /[.!?]/.test(lastChar) ? SENTENCE_PAUSE_MS : CHAR_DELAY_MS;
      setTimeout(tick, nextDelay);
    }
    tick();
  }

  function getAsciiFromTemplate(id) {
    var el = document.getElementById(id);
    if (!el || !el.content) return "";
    var pre = el.content.querySelector("pre");
    return pre ? pre.textContent : "";
  }

  const DEZZY_WELCOME = "Hey! I'm Dezzy, a Desmos Activity Builder Assistant! (purr) I can help you turn your ideas into Computation Layer code that can be used to make amazing things happen in the Activity Builder. Tell me what you want to build! (scratches your pant leg) You can also ask me questions by clicking the \"Ask Dezzy\" button below. Happy building!";

  // Only strip leading/trailing newlines so leading spaces are preserved
  function trimAscii(s) {
    if (!s) return "";
    return s.replace(/^\n+|\n+$/g, "");
  }

  let slideCount = 1;
  let slideIdCounter = 1;
  const slideCode = {};
  const slideSummary = {};
  let sendCodeToSlideMode = false;
  let draggedCard = null;
  let justDragged = false;
  let lastInsertIndex = null;
  let dropIndicatorEl = null;

  function fetchSummaryFromLLM(code) {
    var base = window.location.origin;
    return fetch(base + "/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code }),
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (data.error) throw new Error(data.error);
      return (data.summary || "").trim().slice(0, 80);
    });
  }

  function getSlideLabel(card, index) {
    const id = card.dataset.slideId;
    return slideSummary[id] || "Slide " + (index + 1);
  }

  function updateSlideThumbLabel(card, index) {
    const thumb = card.querySelector(".slide-thumb");
    if (!thumb) return;
    const id = card.dataset.slideId;
    const label = slideSummary[id] || "Slide " + (index + 1);
    thumb.textContent = label;
    thumb.classList.toggle("slide-thumb-summary", !!slideSummary[id]);
  }

  function updateSlideGlow(card) {
    const id = card.dataset.slideId;
    if (slideCode[id]) {
      card.classList.add("has-code");
    } else {
      card.classList.remove("has-code");
    }
  }

  function attachDragListeners(card) {
    card.setAttribute("draggable", "true");
    card.addEventListener("dragstart", onDragStart);
    card.addEventListener("dragend", onDragEnd);
  }

  function createSlideCard(index, existingId) {
    const card = document.createElement("article");
    card.className = "slide-card";
    const slideId = existingId || ("slide-" + slideIdCounter++);
    card.dataset.slideId = slideId;
    card.dataset.slideIndex = String(index);
    if (existingId) {
      var n = parseInt((existingId || "").replace(/^slide-/, ""), 10) || 0;
      if (n >= slideIdCounter) slideIdCounter = n + 1;
    }
    card.draggable = true;
    card.setAttribute("role", "listitem");
    card.innerHTML = '<div class="slide-thumb">Slide ' + (index + 1) + "</div>";

    attachDragListeners(card);
    card.addEventListener("click", onSlideClick);

    return card;
  }

  function getCodeToSend() {
    var sel = window.getSelection();
    var fullCode = (codeContent && codeContent.textContent || "").trim();
    if (!sel || sel.rangeCount === 0) return fullCode;
    var text = sel.toString().trim();
    if (text.length === 0) return fullCode;
    var node = sel.anchorNode;
    if (!node) return fullCode;
    var codeOutput = document.getElementById("codeOutput");
    var inCode = codeContent.contains(node) || (codeOutput && codeOutput.contains(node));
    return inCode ? text : fullCode;
  }

  function onSlideClick(e) {
    if (justDragged) return;
    const card = e.currentTarget;
    if (card.classList.contains("slide-card") === false) return;
    const id = card.dataset.slideId;

    if (sendCodeToSlideMode) {
      const code = getCodeToSend();
      slideCode[id] = code || null;
      if (!code) {
        delete slideCode[id];
        delete slideSummary[id];
        updateSlideGlow(card);
        var idx = parseInt(card.dataset.slideIndex, 10);
        updateSlideThumbLabel(card, idx);
        sendCodeToSlideMode = false;
        sendCodeToSlideBtn.classList.remove("active");
        sendCodeToSlideBtn.textContent = "Send Code to Slide";
        return;
      }
      updateSlideGlow(card);
      var idx = parseInt(card.dataset.slideIndex, 10);
      var thumb = card.querySelector(".slide-thumb");
      if (thumb) {
        thumb.textContent = "…";
        thumb.classList.add("slide-thumb-summary");
      }
      sendCodeToSlideMode = false;
      sendCodeToSlideBtn.classList.remove("active");
      sendCodeToSlideBtn.textContent = "Send Code to Slide";

      fetchSummaryFromLLM(code).then(function (summary) {
        slideSummary[id] = summary || "";
        updateSlideThumbLabel(card, idx);
      }).catch(function () {
        slideSummary[id] = "";
        updateSlideThumbLabel(card, idx);
      });
      askDezzy("", slideCode, code).then(function (data) {
        if (data && data.text) {
          var suggestion = data.text.trim();
          if (!suggestion) return;
          if (promptTypingInProgress) {
            pendingSuggestionQueue.push(suggestion);
          } else if (promptInput && promptInput.value.trim().length > 0) {
            appendDezzyToPrompt(suggestion, null);
          } else {
            typeIntoPrompt(suggestion, null, true);
          }
        }
      }).catch(function () {});
      return;
    }

    if (slideCode[id]) {
      setCodeOutput(slideCode[id], false);
    }
  }

  function getCards() {
    return Array.from(slidesTrack.querySelectorAll(".slide-card"));
  }

  function showDropIndicator(insertIndex) {
    if (!dropIndicatorEl) return;
    var cards = getCards();
    var trackRect = slidesTrack.getBoundingClientRect();
    var leftPx;
    if (insertIndex <= 0) {
      leftPx = 0;
    } else if (insertIndex >= cards.length) {
      var last = cards[cards.length - 1];
      var r = last.getBoundingClientRect();
      leftPx = (r.right - trackRect.left) + 6;
    } else {
      var card = cards[insertIndex];
      var rect = card.getBoundingClientRect();
      leftPx = (rect.left - trackRect.left) - 2;
    }
    dropIndicatorEl.style.left = leftPx + "px";
    dropIndicatorEl.style.display = "block";
  }

  function hideDropIndicator() {
    if (dropIndicatorEl) dropIndicatorEl.style.display = "none";
    lastInsertIndex = null;
  }

  function onDragStart(e) {
    justDragged = false;
    draggedCard = e.currentTarget;
    draggedCard.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedCard.dataset.slideIndex);
    e.dataTransfer.setData("application/x-slide-id", draggedCard.dataset.slideId || "");
  }

  function onDragEnd(e) {
    var card = e.currentTarget;
    card.classList.remove("dragging");
    hideDropIndicator();
    draggedCard = null;
    justDragged = true;
    setTimeout(function () {
      justDragged = false;
    }, 100);
  }

  function onTrackDragOver(e) {
    if (!draggedCard) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    var cards = getCards();
    var card = e.target.closest(".slide-card");
    var insertIndex;
    if (!card) {
      insertIndex = cards.length;
    } else {
      var cardIndex = cards.indexOf(card);
      var rect = card.getBoundingClientRect();
      insertIndex = e.clientX - rect.left > rect.width / 2 ? cardIndex + 1 : cardIndex;
    }
    lastInsertIndex = insertIndex;
    showDropIndicator(insertIndex);
  }

  function onTrackDrop(e) {
    e.preventDefault();
    if (!draggedCard || lastInsertIndex == null) return;
    var cards = getCards();
    var ref = cards[lastInsertIndex] || null;
    slidesTrack.insertBefore(draggedCard, ref);
    hideDropIndicator();
    reindexSlides();
    draggedCard = null;
  }

  function reindexSlides() {
    const cards = slidesTrack.querySelectorAll(".slide-card");
    cards.forEach(function (card, i) {
      card.dataset.slideIndex = String(i);
      updateSlideThumbLabel(card, i);
      updateSlideGlow(card);
    });
  }

  function addSlide() {
    const card = createSlideCard(slideCount);
    slidesTrack.appendChild(card);
    slideCount += 1;
  }

  // --- Project save/load (localStorage) ---
  const PROJECT_NAMES_KEY = "cl-prompt-project-names";
  const PROJECT_PREFIX = "cl-prompt-project:";

  function getProjectData() {
    var cards = getCards();
    var slides = cards.map(function (card) {
      var id = card.dataset.slideId;
      return { id: id, code: slideCode[id] || "", summary: slideSummary[id] || "" };
    });
    var codeOutput = codeContent ? codeContent.textContent : "";
    var prompt = promptInput ? promptInput.value : "";
    return { version: 1, slides: slides, codeOutput: codeOutput, prompt: prompt };
  }

  function getProjectNames() {
    try {
      var raw = localStorage.getItem(PROJECT_NAMES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveProject(name) {
    if (!name || !name.trim()) return;
    name = name.trim();
    var data = getProjectData();
    data.savedAt = new Date().toISOString();
    try {
      localStorage.setItem(PROJECT_PREFIX + name, JSON.stringify(data));
      var names = getProjectNames();
      if (names.indexOf(name) === -1) names.push(name);
      localStorage.setItem(PROJECT_NAMES_KEY, JSON.stringify(names));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadProject(name) {
    if (!name) return;
    var raw = localStorage.getItem(PROJECT_PREFIX + name);
    if (!raw) return;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      return;
    }
    var slides = data.slides || [];
    var codeOutput = data.codeOutput != null ? data.codeOutput : "";
    var prompt = data.prompt != null ? data.prompt : "";

    // Remove all slide cards (keep drop indicator)
    while (slidesTrack.querySelector(".slide-card")) {
      slidesTrack.removeChild(slidesTrack.querySelector(".slide-card"));
    }

    // Clear in-memory state
    Object.keys(slideCode).forEach(function (k) { delete slideCode[k]; });
    Object.keys(slideSummary).forEach(function (k) { delete slideSummary[k]; });

    slideCount = slides.length || 1;
    slideIdCounter = 0;
    slides.forEach(function (s, i) {
      var id = s.id || "slide-" + i;
      var card = createSlideCard(i, id);
      slidesTrack.insertBefore(card, dropIndicatorEl);
      if (s.code) slideCode[id] = s.code;
      if (s.summary) slideSummary[id] = s.summary;
      updateSlideGlow(card);
      updateSlideThumbLabel(card, i);
    });
    if (slideIdCounter === 0) slideIdCounter = slideCount;

    if (codeContent) setCodeOutput(codeOutput, false);
    if (promptInput) promptInput.value = prompt;
  }

  function refreshOpenProjectList() {
    var sel = document.getElementById("openProjectSelect");
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '<option value="">Open project…</option>';
    getProjectNames().forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
    sel.value = current || "";
  }

  var saveProjectBtn = document.getElementById("saveProjectBtn");
  var openProjectSelect = document.getElementById("openProjectSelect");
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener("click", function () {
      var defaultName = "Project " + new Date().toISOString().slice(0, 10);
      var name = prompt("Save project as:", defaultName);
      if (name != null && saveProject(name)) {
        refreshOpenProjectList();
        saveProjectBtn.textContent = "Saved!";
        setTimeout(function () { saveProjectBtn.textContent = "Save project"; }, 1500);
      } else if (name != null) {
        alert("Could not save (e.g. storage full or name invalid).");
      }
    });
  }
  if (openProjectSelect) {
    refreshOpenProjectList();
    openProjectSelect.addEventListener("change", function () {
      var name = openProjectSelect.value;
      if (name) {
        loadProject(name);
        openProjectSelect.value = "";
      }
    });
  }

  addSlideBtn.addEventListener("click", addSlide);

  sendCodeToSlideBtn.addEventListener("click", function () {
    sendCodeToSlideMode = !sendCodeToSlideMode;
    if (sendCodeToSlideMode) {
      sendCodeToSlideBtn.classList.add("active");
      sendCodeToSlideBtn.textContent = "Click a slide to store code…";
    } else {
      sendCodeToSlideBtn.classList.remove("active");
      sendCodeToSlideBtn.textContent = "Send Code to Slide";
    }
  });

  dropIndicatorEl = document.createElement("div");
  dropIndicatorEl.className = "drop-indicator";
  dropIndicatorEl.setAttribute("aria-hidden", "true");
  slidesTrack.appendChild(dropIndicatorEl);

  slidesTrack.addEventListener("dragover", onTrackDragOver);
  slidesTrack.addEventListener("drop", onTrackDrop);

  slidesTrack.querySelectorAll(".slide-card").forEach(function (card) {
    attachDragListeners(card);
    card.addEventListener("click", onSlideClick);
    updateSlideGlow(card);
    var i = parseInt(card.dataset.slideIndex, 10);
    if (isNaN(i)) i = 0;
    updateSlideThumbLabel(card, i);
  });

  var promptTypingInProgress = false;
  var pendingSuggestionQueue = [];

  function flushSuggestionQueue() {
    if (promptTypingInProgress || pendingSuggestionQueue.length === 0) return;
    var next = pendingSuggestionQueue.shift();
    appendDezzyToPrompt(next, function () {
      if (pendingSuggestionQueue.length > 0) setTimeout(flushSuggestionQueue, 100);
    });
  }

  function typeIntoPrompt(fullText, done, isDezzy) {
    if (isDezzy && fullText) {
      if (fullText.indexOf("(Dezzy)") !== 0) fullText = "(Dezzy) " + fullText;
      typeDezzyReply(fullText, false, done);
      return;
    }
    promptInput.value = "";
    promptTypingInProgress = true;
    var i = 0;
    function tick() {
      if (i >= fullText.length) {
        promptTypingInProgress = false;
        if (done) done();
        setTimeout(flushSuggestionQueue, 50);
        return;
      }
      promptInput.value += fullText[i];
      i++;
      setTimeout(tick, 18);
    }
    tick();
  }

  function appendDezzyToPrompt(text, done) {
    if (!text || !text.trim()) { if (done) done(); return; }
    var prefixed = "(Dezzy) " + text.trim();
    typeDezzyReply(prefixed, true, done);
  }

  function removeDezzyOutputClass() {
    if (promptInput) promptInput.classList.remove("dezzy-output");
  }

  function decodeHtmlEntities(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&le;/g, "≤")
      .replace(/&ge;/g, "≥")
      .replace(/&quot;/g, "\"")
      .replace(/&nbsp;/g, "\u00A0")
      .replace(/&amp;/g, "&");
  }

  function isPlacementLabel(line) {
    return /^\s*Slide \d+ CL\s*$/i.test(line) ||
      /^\s*Slide \d+ - .+ CL\s*$/i.test(line) ||
      /^\s*Add to .+ CL\s*$/i.test(line) ||
      /^\s*(Screen|Slide)\s*CL\s*:?\s*$/i.test(line) ||
      /^\s*In (the )?.+ Computation Layer/i.test(line) ||
      /^\s*Add (a |this to the )?.+ (component\. )?[Ii]n its Computation Layer/i.test(line);
  }

  function formatCodeOutputAsHtml(text) {
    if (!text || !text.trim()) return escapeHtml(text || "");
    var lines = text.split("\n");
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var escaped = escapeHtml(line);
      if (isPlacementLabel(line)) {
        out.push("<span class=\"cl-placement-label\">" + escaped + "</span>");
      } else {
        out.push(escaped);
      }
      if (i < lines.length - 1) out.push("\n");
    }
    return out.join("");
  }

  function setCodeOutput(text, animate) {
    var s = decodeHtmlEntities(text || "# No code yet. Enter a prompt and click Generate.");
    if (!codeContent) return;
    if (codeCursor) codeCursor.style.display = "inline-block";
    if (animate && s.length > 0) {
      var target = document.getElementById("codeText");
      if (!target) {
        target = document.createElement("span");
        target.id = "codeText";
        codeContent.innerHTML = "";
        codeContent.appendChild(target);
        if (codeCursor) codeContent.appendChild(codeCursor);
      }
      target.textContent = "";
      var idx = 0;
      function tick() {
        if (idx >= s.length) {
          if (codeCursor) codeCursor.style.display = "none";
          codeContent.innerHTML = formatCodeOutputAsHtml(s);
          if (codeCursor) codeContent.appendChild(codeCursor);
          return;
        }
        target.textContent = s.slice(0, idx + 1);
        idx++;
        setTimeout(tick, 12);
      }
      tick();
    } else {
      codeContent.innerHTML = formatCodeOutputAsHtml(s);
      if (codeCursor) {
        codeContent.appendChild(codeCursor);
        codeCursor.style.display = "none";
      }
    }
  }

  function askDezzy(userMessage, slideContext, suggestionForCode) {
    var body = { message: userMessage, slideCodeContext: slideContext || {} };
    if (suggestionForCode) {
      body.suggestionRequest = true;
      body.codeJustStored = suggestionForCode;
    }
    return fetch(window.location.origin + "/api/dezzy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }

  if (promptInput) {
    var asciiBlock = trimAscii(getAsciiFromTemplate("dezzy-ascii"));
    promptInput.placeholder = asciiBlock ? asciiBlock + "\n\n" + DEZZY_WELCOME : DEZZY_WELCOME;
    promptInput.addEventListener("focus", removeDezzyOutputClass);
  }

  if (clearPromptBtn && promptInput) {
    clearPromptBtn.addEventListener("click", function () {
      promptInput.value = "";
      promptInput.focus();
    });
  }

  if (dezzyReplyCloseBtn && dezzyReply) {
    dezzyReplyCloseBtn.addEventListener("click", function () {
      dezzyReply.setAttribute("hidden", "");
      dezzyReply.setAttribute("aria-hidden", "true");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!e.metaKey && !e.ctrlKey) return;
    if (e.key === "1") {
      e.preventDefault();
      if (generateBtn) generateBtn.click();
    } else if (e.key === "2") {
      e.preventDefault();
      if (askDezzyBtn) askDezzyBtn.click();
    }
  });

  function showDezzyThinking(show) {
    if (!dezzyThinking) return;
    if (show) {
      dezzyThinking.removeAttribute("hidden");
      dezzyThinking.setAttribute("aria-hidden", "false");
    } else {
      dezzyThinking.setAttribute("hidden", "");
      dezzyThinking.setAttribute("aria-hidden", "true");
    }
  }

  if (askDezzyBtn) {
    askDezzyBtn.addEventListener("click", function () {
      if (askDezzyBtn.disabled) return;
      var msg = (promptInput && promptInput.value.trim()) || "Hello! What can you help me with?";
      askDezzyBtn.disabled = true;
      showDezzyThinking(true);
      askDezzy(msg, slideCode, null).then(function (data) {
        showDezzyThinking(false);
        if (data && data.error) {
          typeIntoPrompt("Dezzy ran into an issue: " + data.error, function () { askDezzyBtn.disabled = false; }, true);
        } else if (data && data.text) {
          typeIntoPrompt(data.text.trim(), function () { askDezzyBtn.disabled = false; }, true);
        } else {
          askDezzyBtn.disabled = false;
        }
      }).catch(function (err) {
        showDezzyThinking(false);
        typeIntoPrompt("Request failed: " + (err.message || "network error") + ". Is the server running?", function () { askDezzyBtn.disabled = false; }, true);
      });
    });
  }

  generateBtn.addEventListener("click", async function () {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      setCodeOutput("# Enter a prompt describing the Computation Layer behavior you want.");
      return;
    }
    generateBtn.disabled = true;
    if (codeLoading) {
      codeLoading.classList.add("visible");
      codeLoading.setAttribute("aria-hidden", "false");
    }
    setCodeOutput("# Generating...");
    try {
      const base = window.location.origin;
      const res = await fetch(base + "/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeOutput("# Error: " + (data.error || res.statusText));
        return;
      }
      const code = data.code != null ? data.code : "";
      const errHint = data.error ? "\n# " + data.error : "";
      setCodeOutput(code || "# No code returned." + errHint, true);
    } catch (err) {
      setCodeOutput("# Request failed: " + err.message + "\n# Make sure the server is running (npm run start).");
    } finally {
      generateBtn.disabled = false;
      if (codeLoading) {
        codeLoading.classList.remove("visible");
        codeLoading.setAttribute("aria-hidden", "true");
      }
    }
  });

  // Optional: after paste, trim trailing whitespace and re-apply placement labels
  codeContent.addEventListener("paste", function (e) {
    setTimeout(function () {
      var raw = codeContent.textContent.replace(/\s*$/, "");
      setCodeOutput(raw, false);
    }, 0);
  });
})();
