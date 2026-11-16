(() => {
  const cfg = window.GIFT_CONFIG;
  const sleeves = window.BINDER_SLEEVES;
  const SLEEVES_PER_PAGE = 2;
  const totalPages = Math.ceil(sleeves.length / SLEEVES_PER_PAGE);

  let currentPage = 0;
  let isFlipping = false;
  let deskPokes = 0;
  const state = {
    peeled: new Set(),
    scratched: new Set(),
    angryLevel: {},
    quizReply: {},
    rpsUnlocked: new Set()
  };

  // DOM references
  const deskView = document.getElementById("desk-view");
  const binderView = document.getElementById("binder-view");
  const btnBackDesk = document.getElementById("btn-back-desk");
  const sleeveCounter = document.getElementById("sleeve-counter");
  const openBinderBtn = document.getElementById("open-binder-btn");
  const binderBook = document.getElementById("binder-book");
  const pageLeft = document.getElementById("binder-page-left");
  const pageRight = document.getElementById("binder-page-right");
  const prevPageBtn = document.getElementById("prev-page-btn");
  const nextPageBtn = document.getElementById("next-page-btn");
  const pageDots = document.getElementById("page-dots");

  // Desk note & cover config
  document.getElementById("cover-name").textContent = cfg.recipientName;
  document.getElementById("desk-note-tab").textContent = cfg.deskNote.tabLabel;
  document.getElementById("desk-note-title").textContent = cfg.deskNote.title;
  document.getElementById("desk-note-text").textContent = cfg.deskNote.body;

  const toggleNoteBtn = document.getElementById("toggle-note-btn");
  const deskNoteBody = document.getElementById("desk-note-body");
  toggleNoteBtn.addEventListener("click", () => {
    const isHidden = deskNoteBody.classList.toggle("hidden");
    toggleNoteBtn.setAttribute("aria-expanded", String(!isHidden));
    toggleNoteBtn.querySelector(".note-hint").textContent = isHidden ? "click to unfold" : "fold back";
  });

  // Desk "minsan angry" poke gag
  const deskAngryBtn = document.getElementById("desk-angry-btn");
  const deskAngryCount = document.getElementById("desk-angry-count");
  const deskAngryMsg = document.getElementById("desk-angry-msg");
  const pokeMessages = [
    "chill pa naman.",
    "okay, medyo nakatingin na siya.",
    "Careful. minsan angry mode loading...",
    "ayun, galit na. open the binder na lang."
  ];
  deskAngryBtn.addEventListener("click", () => {
    deskPokes += 1;
    deskAngryCount.textContent = String(deskPokes);
    const idx = Math.min(deskPokes - 1, pokeMessages.length - 1);
    deskAngryMsg.textContent = pokeMessages[idx];
  });

  // Letter Modal
  const letterModal = document.getElementById("letter-modal");
  const closeLetterBtn = document.getElementById("close-letter-btn");
  document.getElementById("letter-date").textContent = cfg.finalLetter.dateLine;
  document.getElementById("letter-heading").textContent = cfg.finalLetter.heading;
  document.getElementById("letter-signature").textContent = cfg.finalLetter.signature;
  const letterBody = document.getElementById("letter-body");
  cfg.finalLetter.paragraphs.forEach((pText) => {
    const p = document.createElement("p");
    p.textContent = pText;
    letterBody.appendChild(p);
  });

  function openLetterModal() {
    letterModal.classList.remove("hidden");
  }

  function closeLetterModal() {
    letterModal.classList.add("hidden");
  }

  closeLetterBtn.addEventListener("click", closeLetterModal);
  letterModal.addEventListener("click", (e) => {
    if (e.target === letterModal) closeLetterModal();
  });

  // SVG stickers (Samoyed for Jeno, Hamster for Jisung)
  function getStickerSvg(kind) {
    if (kind === "samoyed") {
      return `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M16 26 L12 10 L25 18 Q32 15 39 18 L52 10 L48 26 Q54 34 50 45 Q42 54 32 54 Q22 54 14 45 Q10 34 16 26 Z" fill="#fffdf8" stroke="#1f161a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M22 33 Q25 30 28 33" stroke="#1f161a" stroke-width="3" stroke-linecap="round"/>
        <path d="M36 33 Q39 30 42 33" stroke="#1f161a" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="32" cy="39" rx="3" ry="2" fill="#1f161a"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="18" cy="20" r="7" fill="#ffd9e6" stroke="#1f161a" stroke-width="3"/>
      <circle cx="46" cy="20" r="7" fill="#ffd9e6" stroke="#1f161a" stroke-width="3"/>
      <ellipse cx="32" cy="36" rx="20" ry="17" fill="#fffdf8" stroke="#1f161a" stroke-width="3"/>
      <circle cx="25" cy="33" r="2.5" fill="#1f161a"/>
      <circle cx="39" cy="33" r="2.5" fill="#1f161a"/>
      <circle cx="20" cy="39" r="3.5" fill="#f48fb1"/>
      <circle cx="44" cy="39" r="3.5" fill="#f48fb1"/>
    </svg>`;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildSleeveContent(item) {
    if (item.type === "photocard") {
      const themeClass = item.frameTheme ? `theme-${item.frameTheme}` : "";
      const stickerHtml = item.sticker
        ? `<div class="pc-sticker-corner">${getStickerSvg(item.sticker)}</div>`
        : "";
      return `
        <div class="pc-flip-container" data-action="flip" role="button" tabindex="0" aria-label="Flip photocard ${item.title}">
          <div class="pc-flip-inner">
            <div class="pc-face ${themeClass}">
              <div class="pc-photo-wrap">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
                <span class="pc-rarity">${escapeHtml(item.rarity)}</span>
                ${stickerHtml}
              </div>
              <div class="pc-footer">
                <strong>${escapeHtml(item.frontCaption)}</strong>
                <span class="flip-hint">tap to flip</span>
              </div>
            </div>
            <div class="pc-face pc-back">
              <p class="mono-label">${escapeHtml(item.backHeading)}</p>
              <p class="hand-body">${escapeHtml(item.backNote)}</p>
              <span class="flip-hint" style="margin-top:auto">tap to flip back</span>
            </div>
          </div>
        </div>`;
    }

    if (item.type === "pass") {
      const rowsHtml = item.rows
        .map((r) => `<div class="pass-row"><span>${escapeHtml(r.label)}</span><span>${escapeHtml(r.value)}</span></div>`)
        .join("");
      return `
        <div class="card-pass">
          <div class="pass-head">${escapeHtml(item.passHeader)}</div>
          <div class="pass-rows">${rowsHtml}</div>
          <p class="mono-small" style="text-align:center">${escapeHtml(item.footerNote)}</p>
        </div>`;
    }

    if (item.type === "tape-peel") {
      const isPeeled = state.peeled.has(item.id);
      const tapeHtml = isPeeled
        ? ""
        : `<div class="tape-peel-stage is-idle" data-tape-stage="${item.id}" role="button" tabindex="0" aria-label="Peel tape to reveal note">
            <div class="tape-stuck">${escapeHtml(item.tapeText)}</div>
            <div class="tape-curl"></div>
          </div>`;
      return `
        <div class="tape-peel-box">
          <p class="mono-label">${escapeHtml(item.hiddenHeading)}</p>
          <p class="hand-body">${escapeHtml(item.hiddenNote)}</p>
          ${tapeHtml}
        </div>`;
    }

    if (item.type === "angry-meter") {
      const lvl = state.angryLevel[item.id] ?? 0;
      return `
        <div class="interactive-card">
          <div>
            <p class="mono-label">PERSONALITY CHECK</p>
            <p class="card-prompt">${escapeHtml(item.prompt)}</p>
          </div>
          <div class="mood-readout" data-angry-readout="${item.id}">${escapeHtml(item.levels[lvl])}</div>
          <button class="btn-stamp" data-angry-id="${item.id}" type="button">test patience</button>
        </div>`;
    }

    if (item.type === "slogan") {
      return `
        <div class="card-slogan">
          <span class="mono-label">${escapeHtml(item.topLine)}</span>
          <div class="slogan-ko">${escapeHtml(item.koreanLine)}</div>
          <span class="slogan-sub">${escapeHtml(item.bottomLine)}</span>
          <p class="slogan-note">${escapeHtml(item.note)}</p>
        </div>`;
    }

    if (item.type === "note") {
      return `
        <div class="card-note paper-${escapeHtml(item.paperStyle || "lined")}">
          <p class="mono-label">${escapeHtml(item.heading)}</p>
          <p class="hand-body">${escapeHtml(item.body)}</p>
        </div>`;
    }

    if (item.type === "scratch") {
      const isScratched = state.scratched.has(item.id);
      const canvasHtml = isScratched
        ? ""
        : `<canvas class="scratch-canvas" data-scratch-canvas="${item.id}" data-scratch-label="${escapeHtml(item.coverLabel)}" aria-label="Scratch foil to reveal reward"></canvas>`;
      return `
        <div class="scratch-box">
          <img class="sticker-mini" src="assets/stickers/chocolate.jpg" alt="Chocolate sticker" loading="lazy" />
          <p class="mono-label">${escapeHtml(item.revealTitle)}</p>
          <p class="hand-body">${escapeHtml(item.revealBody)}</p>
          ${canvasHtml}
        </div>`;
    }

    if (item.type === "receipt") {
      const lines = item.items
        .map((it) => `<div class="receipt-line"><span>${escapeHtml(it.name)}</span><span>${escapeHtml(it.price)}</span></div>`)
        .join("");
      return `
        <div class="card-receipt">
          <div style="text-align:center;font-weight:700;margin-bottom:4px">${escapeHtml(item.store)}</div>
          <div class="receipt-lines">${lines}</div>
          <div class="receipt-total">
            <span>${escapeHtml(item.totalLabel)}</span>
            <span>${escapeHtml(item.totalValue)}</span>
          </div>
        </div>`;
    }

    if (item.type === "quiz") {
      const savedReply = state.quizReply[item.id] || "";
      const opts = item.options
        .map((o, idx) => `<button class="choice-btn" data-quiz-id="${item.id}" data-opt-idx="${idx}" type="button">${escapeHtml(o.text)}</button>`)
        .join("");
      return `
        <div class="interactive-card">
          <p class="card-prompt">${escapeHtml(item.question)}</p>
          <div class="choice-list">${opts}</div>
          <p class="mono-small" data-quiz-reply="${item.id}">${escapeHtml(savedReply)}</p>
        </div>`;
    }

    if (item.type === "rps-lock") {
      if (state.rpsUnlocked.has(item.id)) {
        return `
          <div class="card-note paper-pink-card">
            <img class="sticker-mini" src="assets/stickers/rps-duo.jpg" alt="Jeno and Jisung sticker" loading="lazy" />
            <p class="mono-label">${escapeHtml(item.unlockedHeading)}</p>
            <p class="hand-body">${escapeHtml(item.unlockedNote)}</p>
          </div>`;
      }
      return `
        <div class="interactive-card" data-rps-box="${item.id}">
          <img class="rps-art" src="assets/stickers/rps-duo.jpg" alt="Jeno Samoyed and Jisung Hamster playing Rock Paper Scissors" loading="lazy" />
          <p class="card-prompt">${escapeHtml(item.prompt)}</p>
          <div class="rps-buttons">
            <button class="choice-btn" data-rps-id="${item.id}" data-move="rock" type="button">rock</button>
            <button class="choice-btn" data-rps-id="${item.id}" data-move="paper" type="button">paper</button>
            <button class="choice-btn" data-rps-id="${item.id}" data-move="scissors" type="button">scissors</button>
          </div>
          <p class="mono-small" data-rps-status="${item.id}">pick one to play jeno & jisung</p>
        </div>`;
    }

    if (item.type === "photobooth") {
      const framesHtml = item.frames
        .map((f) => {
          if (f.image) {
            const pos = f.pos ? `object-position:${escapeHtml(f.pos)}` : "";
            return `<div class="strip-frame"><img src="${escapeHtml(f.image)}" alt="${escapeHtml(f.caption)}" style="${pos}" loading="lazy" /></div>`;
          }
          return `<div class="strip-frame"><div class="strip-num-21">${escapeHtml(f.text)}</div></div>`;
        })
        .join("");
      return `
        <div class="photobooth-strip">
          ${framesHtml}
          <div class="strip-date">LIFE4CUTS // ${escapeHtml(item.stripDate)}</div>
        </div>`;
    }

    if (item.type === "song") {
      return `
        <div class="card-song">
          <div class="cassette-bar">
            <span>SIDE A</span>
            <span>${escapeHtml(item.artist)}</span>
          </div>
          <p class="hand-body">${escapeHtml(item.note)}</p>
          <iframe
            class="spotify-embed"
            title="Spotify Embed: ${escapeHtml(item.trackName)}"
            src="${escapeHtml(item.spotifyEmbedUrl)}"
            width="100%"
            height="152"
            frameborder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy">
          </iframe>
        </div>`;
    }

    if (item.type === "countdown") {
      return `
        <div class="card-countdown">
          <div class="big-21">${escapeHtml(item.bigNumber)}</div>
          <p class="mono-small">${escapeHtml(item.caption)}</p>
        </div>`;
    }

    if (item.type === "envelope") {
      return `
        <button class="envelope-card" data-action="open-letter" type="button">
          <div class="wax-seal">${escapeHtml(item.sealText)}</div>
          <h2 class="hand-title">${escapeHtml(item.label)}</h2>
          <span class="mono-tag">${escapeHtml(item.sublabel)}</span>
        </button>`;
    }

    return "";
  }

  function renderPocketHtml(item) {
    return `
      <article class="sleeve-pocket">
        <div class="sleeve-header">
          <span class="sleeve-num">${pad2(item.id)} / 21</span>
          <span class="sleeve-tag">${escapeHtml(item.tag)}</span>
        </div>
        ${buildSleeveContent(item)}
      </article>`;
  }

  function getPageHtmlPair(pageIdx) {
    const start = pageIdx * SLEEVES_PER_PAGE;
    const pageItems = sleeves.slice(start, start + SLEEVES_PER_PAGE);
    const isFinale = pageItems.length === 1 && pageItems[0].type === "envelope";

    if (isFinale) {
      return {
        isFinale: true,
        counterText: "21 / 21",
        leftHtml: `
          <div class="book-end-card">
            <img class="sticker-mini" src="assets/stickers/neobong.jpg" alt="Neobong sticker" loading="lazy" />
            <span class="mono-tag">LAST PAGE // 21</span>
            <h2 class="hand-title">happy 21st, angela!</h2>
            <p class="hand-body">sana napangiti ka kahit konti habang binubuksan mo lahat ng pockets. buksan mo na yung envelope sa kabila.</p>
            <span class="mono-small">- lixter</span>
          </div>`,
        rightHtml: buildSleeveContent(pageItems[0])
      };
    }

    const leftItems = pageItems.slice(0, 1);
    const rightItems = pageItems.slice(1, 2);
    const endNum = pageItems[pageItems.length - 1].id;
    return {
      isFinale: false,
      counterText: `${pad2(start + 1)}-${pad2(endNum)} / 21`,
      leftHtml: leftItems.map(renderPocketHtml).join(""),
      rightHtml: rightItems.map(renderPocketHtml).join("")
    };
  }

  function updateNavUi() {
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage === totalPages - 1;

    pageDots.innerHTML = "";
    for (let i = 0; i < totalPages; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `page-dot ${i === currentPage ? "active" : ""}`;
      dot.textContent = String(i + 1);
      dot.setAttribute("aria-label", `Go to binder page ${i + 1}`);
      dot.addEventListener("click", () => {
        if (i === currentPage || isFlipping) return;
        turnToPage(i, 460);
      });
      pageDots.appendChild(dot);
    }
  }

  function applyTapePeelVisual(stage, p) {
    const stuck = stage.querySelector(".tape-stuck");
    const curl = stage.querySelector(".tape-curl");
    if (!stuck || !curl) return;

    // Diagonal peel from bottom-right (p=0) to top-left (p=1)
    const d = Math.max(0, Math.min(1, p)) * 200;
    const x1 = Math.max(0, 100 - d);
    const y2 = Math.max(0, 100 - d);
    const rightY = d > 100 ? Math.max(0, 200 - d) : 100;
    const bottomX = d > 100 ? Math.max(0, 200 - d) : 100;

    if (d === 0) {
      stuck.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
      curl.style.opacity = "0";
      return;
    }

    if (d <= 100) {
      stuck.style.clipPath = `polygon(0 0, 100% 0, 100% ${y2}%, ${x1}% 100%, 0 100%)`;
      const cx = Math.max(0, 100 - d * 1.15);
      const cy = Math.max(0, 100 - d * 1.15);
      curl.style.clipPath = `polygon(${x1}% 100%, 100% ${y2}%, ${Math.min(100, cx + 18)}% ${Math.min(100, cy + 18)}%)`;
    } else {
      stuck.style.clipPath = `polygon(0 0, ${rightY}% 0, 0 ${bottomX}%)`;
      curl.style.clipPath = `polygon(0 ${bottomX}%, ${rightY}% 0, ${Math.max(0, rightY - 22)}% ${Math.max(0, bottomX - 22)}%)`;
    }
    curl.style.opacity = p > 0.02 ? "0.96" : "0";
  }

  function initTapePeel(stage) {
    if (stage.dataset.bound) return;
    stage.dataset.bound = "1";
    const id = Number(stage.dataset.tapeStage);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let progress = 0.08;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let maxDragDist = 0;

    applyTapePeelVisual(stage, progress);

    const completePeel = () => {
      state.peeled.add(id);
      if (navigator.vibrate) navigator.vibrate(12);
      stage.classList.add("is-flying");
      setTimeout(() => stage.remove(), 460);
    };

    const runAutoPeel = () => {
      if (reducedMotion) {
        state.peeled.add(id);
        stage.style.transition = "opacity 0.35s ease";
        stage.style.opacity = "0";
        setTimeout(() => stage.remove(), 360);
        return;
      }
      const startP = progress;
      const startT = performance.now();
      const duration = 780;
      const step = (now) => {
        const t = Math.min(1, (now - startT) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        progress = startP + (1 - startP) * eased;
        applyTapePeelVisual(stage, progress);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          completePeel();
        }
      };
      requestAnimationFrame(step);
    };

    stage.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      stage.classList.remove("is-idle", "is-snapping");
      stage.setPointerCapture(e.pointerId);
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      maxDragDist = 0;
    });

    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = startX - e.clientX;
      const dy = startY - e.clientY;
      const rawDist = Math.hypot(dx, dy);
      maxDragDist = Math.max(maxDragDist, rawDist);
      // Sticky resistance on first 14px, then smooth diagonal peel
      const effective = rawDist < 14 ? rawDist * 0.35 : 5 + (rawDist - 14);
      const rect = stage.getBoundingClientRect();
      const span = Math.max(120, Math.hypot(rect.width, rect.height) * 0.65);
      progress = Math.max(0.08, Math.min(1, 0.08 + effective / span));
      applyTapePeelVisual(stage, progress);
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (maxDragDist < 8) {
        runAutoPeel();
        return;
      }
      if (progress >= 0.5) {
        completePeel();
      } else {
        stage.classList.add("is-snapping");
        progress = 0.08;
        applyTapePeelVisual(stage, progress);
      }
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
  }

  function spawnFoilFlake(box, x, y) {
    const flake = document.createElement("span");
    flake.className = "foil-flake";
    flake.style.left = `${x}px`;
    flake.style.top = `${y}px`;
    flake.style.setProperty("--dx", `${(Math.random() - 0.5) * 28}px`);
    flake.style.setProperty("--dy", `${18 + Math.random() * 24}px`);
    box.appendChild(flake);
    setTimeout(() => flake.remove(), 580);
  }

  function spawnScratchSparkles(box) {
    const colors = ["#f48fb1", "#c6f628", "#d95b88"];
    for (let i = 0; i < 14; i += 1) {
      const sp = document.createElement("span");
      sp.className = "scratch-sparkle";
      sp.style.left = `${20 + Math.random() * 60}%`;
      sp.style.top = `${25 + Math.random() * 50}%`;
      sp.style.background = colors[i % colors.length];
      sp.style.setProperty("--sx", `${(Math.random() - 0.5) * 90}px`);
      sp.style.setProperty("--sy", `${(Math.random() - 0.5) * 80}px`);
      box.appendChild(sp);
      setTimeout(() => sp.remove(), 680);
    }
  }

  function initScratchCanvas(canvas) {
    if (canvas.dataset.bound) return;
    canvas.dataset.bound = "1";
    const id = Number(canvas.dataset.scratchCanvas);
    const label = canvas.dataset.scratchLabel || "tap to scratch foil";
    const box = canvas.closest(".scratch-box");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");

    const drawFoil = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Diagonal striped foil + subtle sheen
      ctx.fillStyle = "#d8d5dc";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = "#c3bec9";
      ctx.lineWidth = 10;
      for (let i = -rect.height; i < rect.width + rect.height; i += 22) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + rect.height, rect.height);
        ctx.stroke();
      }
      const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, "rgba(255,255,255,0.35)");
      grad.addColorStop(0.5, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(255,255,255,0.28)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.fillStyle = "#1f161a";
      ctx.font = "700 14px 'Space Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, rect.width / 2, rect.height / 2);
    };

    drawFoil();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        if (!state.scratched.has(id) && !canvas.dataset.started) drawFoil();
      });
      ro.observe(canvas);
    }

    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    let lastSample = 0;
    let lastFlake = 0;

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const checkCleared = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      const data = ctx.getImageData(0, 0, w, h).data;
      let cleared = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += 32) {
        total += 1;
        if (data[i] < 128) cleared += 1;
      }
      if (total > 0 && cleared / total >= 0.56) {
        state.scratched.add(id);
        canvas.classList.add("is-fading");
        if (box) spawnScratchSparkles(box);
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(() => canvas.remove(), 360);
      }
    };

    canvas.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (reducedMotion) {
        state.scratched.add(id);
        canvas.classList.add("is-fading");
        setTimeout(() => canvas.remove(), 360);
        return;
      }
      canvas.setPointerCapture(e.pointerId);
      canvas.dataset.started = "1";
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
      ctx.fill();
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;

      const now = performance.now();
      if (box && now - lastFlake > 75) {
        lastFlake = now;
        spawnFoilFlake(box, pos.x + 10, pos.y + 10);
        if (navigator.vibrate) navigator.vibrate(4);
      }
      if (now - lastSample > 240) {
        lastSample = now;
        checkCleared();
      }
    });

    const stopDraw = () => {
      if (!drawing) return;
      drawing = false;
      checkCleared();
    };
    canvas.addEventListener("pointerup", stopDraw);
    canvas.addEventListener("pointercancel", stopDraw);
  }

  function initInteractivePockets(root = binderBook) {
    root.querySelectorAll("[data-tape-stage]").forEach(initTapePeel);
    root.querySelectorAll("[data-scratch-canvas]").forEach(initScratchCanvas);
  }

  function renderSpreadInstant(pageIdx) {
    const pair = getPageHtmlPair(pageIdx);
    pageLeft.className = `binder-page binder-page-left ${pair.isFinale ? "single-side" : ""}`;
    pageRight.className = `binder-page binder-page-right ${pair.isFinale ? "single-side" : ""}`;
    pageLeft.innerHTML = `${pair.leftHtml}<div class="page-shadow-overlay"></div>`;
    pageRight.innerHTML = `${pair.rightHtml}<div class="page-shadow-overlay"></div>`;
    sleeveCounter.textContent = pair.counterText;
    currentPage = pageIdx;
    updateNavUi();
    initInteractivePockets(binderBook);
  }

  function turnToPage(targetPage, durationMs = 700) {
    if (isFlipping || targetPage === currentPage || targetPage < 0 || targetPage >= totalPages) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isStackedMobile = window.innerWidth <= 980;

    if (reducedMotion || isStackedMobile) {
      isFlipping = true;
      binderBook.classList.remove("is-crossfading");
      void binderBook.offsetWidth;
      binderBook.classList.add("is-crossfading");
      renderSpreadInstant(targetPage);
      setTimeout(() => {
        binderBook.classList.remove("is-crossfading");
        isFlipping = false;
      }, 320);
      return;
    }

    isFlipping = true;
    const isNext = targetPage > currentPage;
    const currPair = getPageHtmlPair(currentPage);
    const nextPair = getPageHtmlPair(targetPage);

    binderBook.style.setProperty("--flip-ms", `${durationMs}ms`);

    const leaf = document.createElement("div");
    leaf.className = `turning-leaf ${isNext ? "from-right" : "from-left"}`;

    const frontFace = document.createElement("div");
    frontFace.className = `leaf-face leaf-front binder-page ${isNext ? "binder-page-right" : "binder-page-left"} ${currPair.isFinale ? "single-side" : ""}`;
    frontFace.innerHTML = isNext ? currPair.rightHtml : currPair.leftHtml;

    const backFace = document.createElement("div");
    backFace.className = `leaf-face leaf-back binder-page ${isNext ? "binder-page-left" : "binder-page-right"} ${nextPair.isFinale ? "single-side" : ""}`;
    backFace.innerHTML = isNext ? nextPair.leftHtml : nextPair.rightHtml;

    leaf.appendChild(frontFace);
    leaf.appendChild(backFace);

    if (isNext) {
      pageRight.className = `binder-page binder-page-right ${nextPair.isFinale ? "single-side" : ""}`;
      pageRight.innerHTML = `${nextPair.rightHtml}<div class="page-shadow-overlay"></div>`;
      pageLeft.classList.add("is-covered");
    } else {
      pageLeft.className = `binder-page binder-page-left ${nextPair.isFinale ? "single-side" : ""}`;
      pageLeft.innerHTML = `${nextPair.leftHtml}<div class="page-shadow-overlay"></div>`;
      pageRight.classList.add("is-covered");
    }

    binderBook.appendChild(leaf);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        leaf.classList.add("is-turning");
        if (isNext) {
          pageLeft.classList.remove("is-covered");
        } else {
          pageRight.classList.remove("is-covered");
        }
      });
    });

    let finished = false;
    const finishTurn = () => {
      if (finished) return;
      finished = true;
      pageLeft.classList.remove("is-covered");
      pageRight.classList.remove("is-covered");
      renderSpreadInstant(targetPage);
      requestAnimationFrame(() => {
        leaf.remove();
        isFlipping = false;
      });
    };

    leaf.addEventListener("transitionend", (e) => {
      if (e.propertyName === "transform") finishTurn();
    });
    setTimeout(finishTurn, durationMs + 90);
  }

  // Delegated interactions inside binder
  binderBook.addEventListener("click", (e) => {
    const flipCard = e.target.closest("[data-action='flip']");
    if (flipCard) {
      flipCard.classList.toggle("is-flipped");
      return;
    }

    const angryBtn = e.target.closest("[data-angry-id]");
    if (angryBtn) {
      const id = Number(angryBtn.dataset.angryId);
      const item = sleeves.find((s) => s.id === id);
      const next = ((state.angryLevel[id] ?? 0) + 1) % item.levels.length;
      state.angryLevel[id] = next;
      const readout = binderBook.querySelector(`[data-angry-readout="${id}"]`);
      if (readout) readout.textContent = item.levels[next];
      return;
    }

    const quizBtn = e.target.closest("[data-quiz-id]");
    if (quizBtn) {
      const id = Number(quizBtn.dataset.quizId);
      const optIdx = Number(quizBtn.dataset.optIdx);
      const item = sleeves.find((s) => s.id === id);
      const reply = item.options[optIdx].reply;
      state.quizReply[id] = reply;
      const target = binderBook.querySelector(`[data-quiz-reply="${id}"]`);
      if (target) target.textContent = reply;
      return;
    }

    const rpsBtn = e.target.closest("[data-rps-id]");
    if (rpsBtn) {
      const id = Number(rpsBtn.dataset.rpsId);
      const playerMove = rpsBtn.dataset.move;
      const moves = ["rock", "paper", "scissors"];
      const cpuMove = moves[Math.floor(Math.random() * moves.length)];
      const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
      const statusEl = binderBook.querySelector(`[data-rps-status="${id}"]`);

      if (beats[playerMove] === cpuMove) {
        state.rpsUnlocked.add(id);
        renderSpreadInstant(currentPage);
      } else if (playerMove === cpuMove) {
        if (statusEl) statusEl.textContent = `tie (${cpuMove})! go again.`;
      } else {
        if (statusEl) statusEl.textContent = `they picked ${cpuMove}. try again!`;
      }
      return;
    }

    const letterBtn = e.target.closest("[data-action='open-letter']");
    if (letterBtn) {
      openLetterModal();
    }
  });

  // View switching (wait for fonts so no fallback-to-webfont size jump occurs)
  openBinderBtn.addEventListener("click", async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    deskView.classList.add("hidden");
    binderView.classList.remove("hidden");
    btnBackDesk.classList.remove("hidden");
    sleeveCounter.classList.remove("hidden");
    renderSpreadInstant(currentPage);
  });

  btnBackDesk.addEventListener("click", () => {
    if (isFlipping) return;
    binderView.classList.add("hidden");
    btnBackDesk.classList.add("hidden");
    sleeveCounter.classList.add("hidden");
    deskView.classList.remove("hidden");
  });

  prevPageBtn.addEventListener("click", () => {
    turnToPage(currentPage - 1, 700);
  });

  nextPageBtn.addEventListener("click", () => {
    turnToPage(currentPage + 1, 700);
  });

  // Touch swipe support for mobile (ignore drags starting on tape or scratch canvas)
  let touchStartX = 0;
  let ignoreSwipe = false;
  binderBook.addEventListener("touchstart", (e) => {
    ignoreSwipe = Boolean(e.target.closest("[data-tape-stage], [data-scratch-canvas]"));
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  binderBook.addEventListener("touchend", (e) => {
    if (ignoreSwipe) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 55) {
      if (dx < 0) turnToPage(currentPage + 1, 700);
      else turnToPage(currentPage - 1, 700);
    }
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !letterModal.classList.contains("hidden")) {
      closeLetterModal();
      return;
    }
    if (!binderView.classList.contains("hidden") && letterModal.classList.contains("hidden")) {
      if (e.key === "ArrowLeft") {
        turnToPage(currentPage - 1, 700);
      } else if (e.key === "ArrowRight") {
        turnToPage(currentPage + 1, 700);
      }
    }
  });
})();
