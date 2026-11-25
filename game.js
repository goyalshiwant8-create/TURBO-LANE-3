(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configurations: 3 Modes & 3 Roads
  // ---------------------------------------------------------------------------
  const MODES = {
    easy: {
      id: "easy",
      label: "Easy",
      badgeClass: "",
      baseSpeed: 330,
      maxSpeed: 560,
      accelPerSec: 6,
      spawnInterval: 1.25,
      minSpawnInterval: 0.72,
      spawnRampPerSec: 0.008,
      doubleSpawnChance: 0.18,
      laneChangeChance: 0,
      scoreMult: 1,
    },
    hard: {
      id: "hard",
      label: "Hard",
      badgeClass: "hard",
      baseSpeed: 460,
      maxSpeed: 780,
      accelPerSec: 11,
      spawnInterval: 0.92,
      minSpawnInterval: 0.46,
      spawnRampPerSec: 0.012,
      doubleSpawnChance: 0.38,
      laneChangeChance: 0.14,
      scoreMult: 1.6,
    },
    extreme: {
      id: "extreme",
      label: "Extreme Hard",
      badgeClass: "extreme",
      baseSpeed: 610,
      maxSpeed: 1050,
      accelPerSec: 16,
      spawnInterval: 0.68,
      minSpawnInterval: 0.32,
      spawnRampPerSec: 0.016,
      doubleSpawnChance: 0.56,
      laneChangeChance: 0.28,
      scoreMult: 2.5,
    },
  };

  const ROADS = {
    neon: {
      id: "neon",
      label: "Neon Night",
      ground: "#070a14",
      shoulder: "#111827",
      asphalt: "#161b2e",
      edgeLine: "#00e5ff",
      laneDash: "rgba(255, 61, 113, 0.78)",
      propType: "neonPole",
      nightMode: true,
    },
    highway: {
      id: "highway",
      label: "Sunny Highway",
      ground: "#15803d",
      shoulder: "#475569",
      asphalt: "#334155",
      edgeLine: "#f8fafc",
      laneDash: "rgba(255, 255, 255, 0.85)",
      propType: "tree",
      nightMode: false,
    },
    desert: {
      id: "desert",
      label: "Desert Canyon",
      ground: "#b45309",
      shoulder: "#78350f",
      asphalt: "#3f3835",
      edgeLine: "#fbbf24",
      laneDash: "rgba(253, 224, 71, 0.85)",
      propType: "cactus",
      nightMode: false,
    },
  };

  const VEHICLE_TYPES = [
    { kind: "sedan", wRatio: 0.54, hRatio: 1.0, speedFactor: 0.42, colors: ["#38bdf8", "#f43f5e", "#a855f7", "#22c55e", "#e2e8f0"] },
    { kind: "sports", wRatio: 0.52, hRatio: 0.96, speedFactor: 0.56, colors: ["#f97316", "#ec4899", "#eab308", "#06b6d4"] },
    { kind: "taxi", wRatio: 0.54, hRatio: 1.0, speedFactor: 0.45, colors: ["#facc15"] },
    { kind: "suv", wRatio: 0.60, hRatio: 1.12, speedFactor: 0.36, colors: ["#64748b", "#0f766e", "#dc2626", "#1d4ed8"] },
    { kind: "truck", wRatio: 0.64, hRatio: 1.46, speedFactor: 0.26, colors: ["#cbd5e1", "#fb923c", "#60a5fa", "#4ade80"] },
  ];

  // ---------------------------------------------------------------------------
  // DOM Elements
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const hud = document.getElementById("hud");
  const hudScore = document.getElementById("hud-score");
  const hudSpeed = document.getElementById("hud-speed");
  const hudBest = document.getElementById("hud-best");
  const hudModeBadge = document.getElementById("hud-mode-badge");
  const btnSound = document.getElementById("btn-sound");
  const btnPause = document.getElementById("btn-pause");
  const calloutEl = document.getElementById("callout");

  const touchControls = document.getElementById("touch-controls");
  const touchLeft = document.getElementById("touch-left");
  const touchRight = document.getElementById("touch-right");
  const touchBoost = document.getElementById("touch-boost");
  const touchBrake = document.getElementById("touch-brake");
  const desktopBrakeBtn = document.getElementById("desktop-brake-btn");

  const screenMenu = document.getElementById("screen-menu");
  const screenPause = document.getElementById("screen-pause");
  const screenGameover = document.getElementById("screen-gameover");

  const modeOptionBtns = document.querySelectorAll("#mode-options .option-card");
  const roadOptionBtns = document.querySelectorAll("#road-options .option-card");
  const menuModeLabel = document.getElementById("menu-mode-label");
  const menuBestScore = document.getElementById("menu-best-score");
  const menuSoundBtn = document.getElementById("menu-sound-btn");

  const overScore = document.getElementById("over-score");
  const overBest = document.getElementById("over-best");
  const overDistance = document.getElementById("over-distance");
  const overNearmiss = document.getElementById("over-nearmiss");
  const overNewBest = document.getElementById("over-new-best");

  // ---------------------------------------------------------------------------
  // Web Audio Synthesizer (no external assets needed)
  // ---------------------------------------------------------------------------
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      this.musicTimer = null;
      this.musicStep = 0;
      this.musicPlaying = false;
      this.musicBpm = 122;
    }

    ensureContext() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    startMusic(modeId) {
      this.stopMusic();
      if (!this.enabled) return;
      const ac = this.ensureContext();
      if (!ac) return;

      const bpmMap = { easy: 118, hard: 132, extreme: 148 };
      this.musicBpm = bpmMap[modeId] || 122;
      this.musicStep = 0;
      this.musicPlaying = true;

      const stepMs = (60 / this.musicBpm / 4) * 1000; // 16th-note groove
      const bassPattern = [55, 55, 65.41, 55, 73.42, 73.42, 82.41, 65.41]; // A1, C2, D2, E2
      const leadPattern = [
        440, 0, 523.25, 659.25,
        587.33, 0, 523.25, 440,
        392, 0, 440, 523.25,
        659.25, 587.33, 523.25, 392,
      ];

      const tick = () => {
        if (!this.musicPlaying || !this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const step = this.musicStep % 16;

        // Kick on quarter notes (0, 4, 8, 12)
        if (step % 4 === 0) {
          const kick = this.ctx.createOscillator();
          const kGain = this.ctx.createGain();
          kick.type = "sine";
          kick.frequency.setValueAtTime(135, now);
          kick.frequency.exponentialRampToValueAtTime(42, now + 0.11);
          kGain.gain.setValueAtTime(0.16, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          kick.connect(kGain).connect(this.ctx.destination);
          kick.start(now);
          kick.stop(now + 0.13);
        }

        // Crisp offbeat hi-hat (2, 6, 10, 14)
        if (step % 4 === 2) {
          const hat = this.ctx.createOscillator();
          const hGain = this.ctx.createGain();
          hat.type = "square";
          hat.frequency.setValueAtTime(6400, now);
          hGain.gain.setValueAtTime(0.018, now);
          hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          hat.connect(hGain).connect(this.ctx.destination);
          hat.start(now);
          hat.stop(now + 0.04);
        }

        // Driving 8th-note synth bass
        if (step % 2 === 0) {
          const bassFreq = bassPattern[(step / 2) % bassPattern.length];
          const bass = this.ctx.createOscillator();
          const bFilter = this.ctx.createBiquadFilter();
          const bGain = this.ctx.createGain();
          bass.type = "sawtooth";
          bass.frequency.setValueAtTime(bassFreq, now);
          bFilter.type = "lowpass";
          bFilter.frequency.setValueAtTime(420, now);
          bGain.gain.setValueAtTime(0.065, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          bass.connect(bFilter).connect(bGain).connect(this.ctx.destination);
          bass.start(now);
          bass.stop(now + 0.15);
        }

        // Arcade synth lead
        const leadFreq = leadPattern[step];
        if (leadFreq > 0) {
          const lead = this.ctx.createOscillator();
          const lGain = this.ctx.createGain();
          lead.type = "triangle";
          lead.frequency.setValueAtTime(leadFreq, now);
          lGain.gain.setValueAtTime(0.045, now);
          lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          lead.connect(lGain).connect(this.ctx.destination);
          lead.start(now);
          lead.stop(now + 0.12);
        }

        this.musicStep += 1;
      };

      tick();
      this.musicTimer = setInterval(tick, stepMs);
    }

    stopMusic() {
      this.musicPlaying = false;
      if (this.musicTimer !== null) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }

    playSteer() {
      const ac = this.ensureContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, ac.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.075);
    }

    playNearMiss() {
      const ac = this.ensureContext();
      if (!ac) return;
      const now = ac.currentTime;
      [520, 780].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.09, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.14);
        osc.connect(gain).connect(ac.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.15);
      });
    }

    playCrash() {
      const ac = this.ensureContext();
      if (!ac) return;
      const now = ac.currentTime;
      const bufferSize = ac.sampleRate * 0.45;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.14));
      }
      const noise = ac.createBufferSource();
      noise.buffer = buffer;

      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(110, now + 0.4);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter).connect(gain).connect(ac.destination);
      noise.start(now);
    }
  }

  const sfx = new SoundFX();

  // ---------------------------------------------------------------------------
  // Game State
  // ---------------------------------------------------------------------------
  let selectedMode = "easy";
  let selectedRoad = "neon";
  let state = "menu"; // menu | playing | paused | crashing | gameover

  let viewW = 0;
  let viewH = 0;
  let roadLeft = 0;
  let roadWidth = 0;
  let laneWidth = 0;
  let shoulderWidth = 0;

  let player = {
    lane: 1,
    x: 0,
    y: 0,
    w: 44,
    h: 82,
    tilt: 0,
    boosting: false,
    braking: false,
  };

  let speed = 0;
  let roadOffset = 0;
  let score = 0;
  let distanceMeters = 0;
  let nearMisses = 0;
  let elapsedTime = 0;
  let spawnTimer = 0;
  let crashTimer = 0;
  let shakeTime = 0;

  let traffic = [];
  let props = [];
  let particles = [];
  let lastFrameTime = 0;

  // ---------------------------------------------------------------------------
  // Storage Helpers
  // ---------------------------------------------------------------------------
  function getBestScore(modeId) {
    try {
      return Number(localStorage.getItem(`turboLane3_best_${modeId}`)) || 0;
    } catch {
      return 0;
    }
  }

  function saveBestScore(modeId, val) {
    try {
      localStorage.setItem(`turboLane3_best_${modeId}`, String(val));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  // ---------------------------------------------------------------------------
  // Responsive Layout & Canvas Sizing
  // ---------------------------------------------------------------------------
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Responsive 3-lane road sizing across mobile portrait, tablet, and desktop
    roadWidth = Math.min(Math.max(viewW * 0.72, 240), 460);
    if (viewW <= 420) {
      roadWidth = viewW * 0.80;
    }
    roadLeft = (viewW - roadWidth) / 2;
    laneWidth = roadWidth / 3;
    shoulderWidth = Math.max(10, laneWidth * 0.14);

    player.w = Math.min(laneWidth * 0.56, 56);
    player.h = player.w * 1.84;
    player.y = viewH - Math.max(player.h * 1.45, viewH < 640 ? 130 : 145);

    if (state === "menu") {
      player.x = getLaneCenterX(player.lane);
    }
  }

  function getLaneCenterX(laneIndex) {
    return roadLeft + laneWidth * (laneIndex + 0.5);
  }

  // ---------------------------------------------------------------------------
  // Menu & UI Sync
  // ---------------------------------------------------------------------------
  function updateMenuUI() {
    modeOptionBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === selectedMode);
    });
    roadOptionBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.road === selectedRoad);
    });
    menuModeLabel.textContent = MODES[selectedMode].label;
    menuBestScore.textContent = getBestScore(selectedMode).toLocaleString();
    const soundLabel = sfx.enabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    menuSoundBtn.textContent = soundLabel;
    btnSound.textContent = sfx.enabled ? "🔊" : "🔇";
  }

  function showCallout(text) {
    calloutEl.textContent = text;
    calloutEl.classList.remove("hidden");
    calloutEl.style.animation = "none";
    // Trigger reflow to restart animation
    void calloutEl.offsetWidth;
    calloutEl.style.animation = "";
    clearTimeout(showCallout._tid);
    showCallout._tid = setTimeout(() => calloutEl.classList.add("hidden"), 700);
  }

  // ---------------------------------------------------------------------------
  // Game Lifecycle
  // ---------------------------------------------------------------------------
  function initProps() {
    props = [];
    const spacing = 120;
    const count = Math.ceil(viewH / spacing) + 2;
    for (let i = 0; i < count; i++) {
      props.push({ y: i * spacing - 60, side: 0 });
      props.push({ y: i * spacing - 60, side: 1 });
    }
  }

  function startGame() {
    sfx.ensureContext();
    const mode = MODES[selectedMode];

    state = "playing";
    player.lane = 1;
    player.x = getLaneCenterX(1);
    player.tilt = 0;
    player.boosting = false;
    player.braking = false;

    speed = mode.baseSpeed;
    roadOffset = 0;
    score = 0;
    distanceMeters = 0;
    nearMisses = 0;
    elapsedTime = 0;
    spawnTimer = 0.45;
    crashTimer = 0;
    shakeTime = 0;

    traffic = [];
    particles = [];
    initProps();

    hudModeBadge.textContent = mode.label.toUpperCase();
    hudModeBadge.className = `badge ${mode.badgeClass}`.trim();
    hudBest.textContent = getBestScore(selectedMode).toLocaleString();

    screenMenu.classList.add("hidden");
    screenPause.classList.add("hidden");
    screenGameover.classList.add("hidden");
    hud.classList.remove("hidden");
    touchControls.classList.remove("hidden");
    const isExtreme = selectedMode === "extreme";
    touchBrake.classList.toggle("hidden", !isExtreme);
    desktopBrakeBtn.classList.toggle("hidden", !isExtreme);
    sfx.startMusic(selectedMode);
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    sfx.stopMusic();
    screenPause.classList.remove("hidden");
  }

  function resumeGame() {
    if (state !== "paused") return;
    state = "playing";
    screenPause.classList.add("hidden");
    sfx.startMusic(selectedMode);
    lastFrameTime = performance.now();
  }

  function goToMenu() {
    state = "menu";
    sfx.stopMusic();
    hud.classList.add("hidden");
    touchControls.classList.add("hidden");
    touchBrake.classList.add("hidden");
    desktopBrakeBtn.classList.add("hidden");
    screenPause.classList.add("hidden");
    screenGameover.classList.add("hidden");
    screenMenu.classList.remove("hidden");
    updateMenuUI();
  }

  function triggerCrash(hitCar) {
    state = "crashing";
    crashTimer = 0.65;
    shakeTime = 0.45;
    player.boosting = false;
    player.braking = false;
    sfx.stopMusic();
    sfx.playCrash();

    const cx = (player.x + hitCar.x) / 2;
    const cy = (player.y + hitCar.y) / 2;
    for (let i = 0; i < 34; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 280;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 6,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        color: ["#ff3d71", "#fbbf24", "#f97316", "#ffffff"][Math.floor(Math.random() * 4)],
      });
    }
  }

  function finishGameOver() {
    state = "gameover";
    touchControls.classList.add("hidden");
    desktopBrakeBtn.classList.add("hidden");

    const finalScore = Math.floor(score);
    const prevBest = getBestScore(selectedMode);
    const isNewBest = finalScore > prevBest;
    const best = isNewBest ? finalScore : prevBest;
    if (isNewBest) saveBestScore(selectedMode, best);

    overScore.textContent = finalScore.toLocaleString();
    overBest.textContent = best.toLocaleString();
    overDistance.textContent = `${Math.floor(distanceMeters)} m`;
    overNearmiss.textContent = String(nearMisses);
    overNewBest.classList.toggle("hidden", !isNewBest);

    screenGameover.classList.remove("hidden");
  }

  // ---------------------------------------------------------------------------
  // Steering & Controls
  // ---------------------------------------------------------------------------
  function steer(dir) {
    if (state !== "playing") return;
    const nextLane = Math.max(0, Math.min(2, player.lane + dir));
    if (nextLane !== player.lane) {
      player.lane = nextLane;
      player.tilt = dir * 0.22;
      sfx.playSteer();
    }
  }

  function setBoost(active) {
    if (state !== "playing") {
      player.boosting = false;
      return;
    }
    player.boosting = active;
    touchBoost.classList.toggle("pressed", active);
  }

  function setBrake(active) {
    if (state !== "playing" || selectedMode !== "extreme") {
      player.braking = false;
      return;
    }
    player.braking = active;
    touchBrake.classList.toggle("pressed", active);
    desktopBrakeBtn.classList.toggle("pressed", active);
  }

  window.addEventListener("keydown", (e) => {
    const tag = e.target && e.target.tagName;
    const feedbackOpen = screenFeedback && !screenFeedback.classList.contains("hidden");
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || feedbackOpen) {
      if (e.key === "Escape" && feedbackOpen) {
        closeFeedback();
      }
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      e.preventDefault();
      steer(-1);
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      e.preventDefault();
      steer(1);
    } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      setBoost(true);
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      e.preventDefault();
      setBrake(true);
    } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    } else if (e.key === "Enter" || e.key === " ") {
      if (state === "menu") startGame();
      else if (state === "gameover") startGame();
    }
  });

  window.addEventListener("keyup", (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      setBoost(false);
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      setBrake(false);
    }
  });

  // Touch buttons
  const bindTap = (el, fn) => {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      fn();
    });
  };
  bindTap(touchLeft, () => steer(-1));
  bindTap(touchRight, () => steer(1));

  touchBoost.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    setBoost(true);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((evt) => {
    touchBoost.addEventListener(evt, () => setBoost(false));
  });

  [touchBrake, desktopBrakeBtn].forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      setBrake(true);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((evt) => {
      btn.addEventListener(evt, () => setBrake(false));
    });
  });

  // Swipe gestures on canvas
  let swipeStartX = null;
  let swipeStartY = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "playing") return;
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (state !== "playing" || swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
      steer(dx > 0 ? 1 : -1);
      swipeStartX = null;
      swipeStartY = null;
    }
  });
  canvas.addEventListener("pointerup", () => {
    swipeStartX = null;
    swipeStartY = null;
  });

  // UI Buttons
  modeOptionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMode = btn.dataset.mode;
      updateMenuUI();
    });
  });

  roadOptionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRoad = btn.dataset.road;
      updateMenuUI();
    });
  });

  const toggleSound = () => {
    sfx.enabled = !sfx.enabled;
    if (!sfx.enabled) {
      sfx.stopMusic();
    } else if (state === "playing") {
      sfx.startMusic(selectedMode);
    }
    updateMenuUI();
  };

  menuSoundBtn.addEventListener("click", toggleSound);
  btnSound.addEventListener("click", toggleSound);
  btnPause.addEventListener("click", pauseGame);
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-resume").addEventListener("click", resumeGame);
  document.getElementById("btn-restart-pause").addEventListener("click", startGame);
  document.getElementById("btn-menu-pause").addEventListener("click", goToMenu);
  document.getElementById("btn-retry").addEventListener("click", startGame);
  document.getElementById("btn-menu-over").addEventListener("click", goToMenu);

  // ---------------------------------------------------------------------------
  // Bug Report / Feedback Form
  // ---------------------------------------------------------------------------
  const screenFeedback = document.getElementById("screen-feedback");
  const feedbackForm = document.getElementById("feedback-form");
  const fbCategory = document.getElementById("fb-category");
  const fbMode = document.getElementById("fb-mode");
  const fbRoad = document.getElementById("fb-road");
  const fbContact = document.getElementById("fb-contact");
  const fbMessage = document.getElementById("fb-message");
  const fbStatus = document.getElementById("fb-status");
  const btnFbCopy = document.getElementById("btn-fb-copy");
  const btnFbView = document.getElementById("btn-fb-view");
  const fbSavedWrap = document.getElementById("fb-saved-wrap");
  const fbSavedList = document.getElementById("fb-saved-list");
  const btnFbClear = document.getElementById("btn-fb-clear");

  let feedbackReturnScreen = screenMenu;
  let lastSavedReportText = "";

  function loadFeedbackList() {
    try {
      return JSON.parse(localStorage.getItem("turboLane3_feedback") || "[]");
    } catch {
      return [];
    }
  }

  function renderSavedFeedback() {
    const list = loadFeedbackList();
    btnFbView.textContent = `📂 View Saved Reports (${list.length})`;
    fbSavedList.innerHTML = "";
    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "fb-saved-item";
      empty.textContent = "No reports saved yet.";
      fbSavedList.appendChild(empty);
      return;
    }
    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "fb-saved-item";
      const meta = document.createElement("div");
      meta.className = "fb-saved-meta";
      const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : "";
      meta.textContent = `${item.category.toUpperCase()} • ${item.mode} • ${item.road} • ${dateStr}`;
      const msg = document.createElement("div");
      msg.className = "fb-saved-msg";
      msg.textContent = `${item.contact}: ${item.message}`;
      card.append(meta, msg);
      fbSavedList.appendChild(card);
    });
  }

  function openFeedback(returnToEl) {
    feedbackReturnScreen = returnToEl;
    returnToEl.classList.add("hidden");
    fbMode.value = MODES[selectedMode].label;
    fbRoad.value = ROADS[selectedRoad].label;
    fbStatus.classList.add("hidden");
    btnFbCopy.classList.add("hidden");
    fbSavedWrap.classList.add("hidden");
    renderSavedFeedback();
    screenFeedback.classList.remove("hidden");
  }

  function closeFeedback() {
    screenFeedback.classList.add("hidden");
    feedbackReturnScreen.classList.remove("hidden");
  }

  document.getElementById("btn-feedback-menu").addEventListener("click", () => openFeedback(screenMenu));
  document.getElementById("btn-feedback-over").addEventListener("click", () => openFeedback(screenGameover));
  document.getElementById("btn-feedback-close").addEventListener("click", closeFeedback);

  const btnFbSubmit = document.getElementById("btn-fb-submit");

  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = fbMessage.value.trim();
    if (!message) return;

    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      category: fbCategory.value,
      mode: fbMode.value,
      road: fbRoad.value,
      contact: fbContact.value.trim() || "Anonymous",
      message,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };

    try {
      const existing = JSON.parse(localStorage.getItem("turboLane3_feedback") || "[]");
      existing.unshift(entry);
      localStorage.setItem("turboLane3_feedback", JSON.stringify(existing.slice(0, 25)));
    } catch {
      // Ignore storage errors
    }

    lastSavedReportText =
      `[Turbo Lane 3 - ${entry.category.toUpperCase()}]\n` +
      `Mode: ${entry.mode} | Road: ${entry.road} | Viewport: ${entry.viewport}\n` +
      `From: ${entry.contact}\n` +
      `Message: ${entry.message}`;

    let emailed = false;
    btnFbSubmit.disabled = true;
    btnFbSubmit.textContent = "SENDING...";
    try {
      const cfgRes = await fetch("/api/config");
      const cfg = cfgRes.ok ? await cfgRes.json() : {};
      if (cfg.accessKey) {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: cfg.accessKey,
            subject: `[Turbo Lane 3] ${entry.category.toUpperCase()} (${entry.mode} - ${entry.road})`,
            from_name: entry.contact,
            category: entry.category,
            mode: entry.mode,
            road: entry.road,
            viewport: entry.viewport,
            message: entry.message,
          }),
        });
        const data = await res.json();
        emailed = Boolean(res.ok && data.success);
      }
    } catch {
      emailed = false;
    } finally {
      btnFbSubmit.disabled = false;
      btnFbSubmit.textContent = "SUBMIT FEEDBACK";
    }

    fbMessage.value = "";
    fbStatus.textContent = emailed
      ? "✅ Thank you! Your feedback was sent to our inbox."
      : "✅ Saved locally! (Email delivery activates automatically on Vercel.)";
    fbStatus.classList.remove("hidden");
    btnFbCopy.classList.remove("hidden");
    renderSavedFeedback();
  });

  btnFbView.addEventListener("click", () => {
    fbSavedWrap.classList.toggle("hidden");
    renderSavedFeedback();
  });

  btnFbClear.addEventListener("click", () => {
    try {
      localStorage.removeItem("turboLane3_feedback");
    } catch {
      // Ignore storage errors
    }
    renderSavedFeedback();
  });

  btnFbCopy.addEventListener("click", async () => {
    if (!lastSavedReportText) return;
    try {
      await navigator.clipboard.writeText(lastSavedReportText);
      btnFbCopy.textContent = "✓ COPIED TO CLIPBOARD";
    } catch {
      btnFbCopy.textContent = "✓ REPORT READY";
    }
    setTimeout(() => {
      btnFbCopy.textContent = "📋 COPY REPORT";
    }, 2000);
  });

  window.addEventListener("resize", resizeCanvas);

  // ---------------------------------------------------------------------------
  // Traffic Spawner (Always leaves >= 1 passable lane & minimum overtake gap)
  // ---------------------------------------------------------------------------
  function spawnTraffic() {
    const mode = MODES[selectedMode];
    const lanes = [0, 1, 2];
    const minSameLaneGap = Math.max(player.h * 2.5, 220);
    const minOvertakeGap = Math.max(player.h * 1.95, 175);

    // Check which lanes have enough vertical gap from the last spawned car
    const clearLanes = lanes.filter((laneIdx) => {
      return !traffic.some((c) => (c.lane === laneIdx || c.targetLane === laneIdx) && c.y < minSameLaneGap);
    });
    if (clearLanes.length === 0) return;

    // Lanes that already have a car inside the overtake window near the top
    const occupiedInWindow = lanes.filter((l) =>
      traffic.some((c) => (c.lane === l || c.targetLane === l) && c.y < minOvertakeGap)
    );
    if (occupiedInWindow.length >= 2) return; // Keep at least 1 full lane open to overtake

    const firstLane = clearLanes[Math.floor(Math.random() * clearLanes.length)];
    const chosen = [firstLane];

    // Allow a second car only if at least 1 lane remains completely open in the overtake window
    if (clearLanes.length >= 2 && occupiedInWindow.length === 0 && Math.random() < mode.doubleSpawnChance) {
      const remaining = clearLanes.filter((l) => l !== firstLane);
      chosen.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }

    chosen.forEach((laneIdx) => {
      const template = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
      const w = Math.min(laneWidth * template.wRatio, 62);
      const h = w * (template.hRatio / template.wRatio) * 1.65;
      const color = template.colors[Math.floor(Math.random() * template.colors.length)];

      traffic.push({
        kind: template.kind,
        lane: laneIdx,
        targetLane: laneIdx,
        x: getLaneCenterX(laneIdx),
        y: -h,
        w,
        h,
        color,
        speedFactor: template.speedFactor,
        canLaneChange: Math.random() < mode.laneChangeChance,
        changedLane: false,
        nearMissed: false,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Update Loop
  // ---------------------------------------------------------------------------
  function update(dt) {
    const mode = MODES[selectedMode];

    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
    }

    // Update particles even while crashing
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (state === "crashing") {
      crashTimer -= dt;
      if (crashTimer <= 0) {
        finishGameOver();
      }
      return;
    }

    if (state !== "playing") return;

    elapsedTime += dt;

    // Speed progression + optional nitro boost / extreme-mode brake
    const baseTarget = Math.min(mode.maxSpeed, mode.baseSpeed + elapsedTime * mode.accelPerSec);
    let activeSpeed = baseTarget;
    if (player.braking) {
      activeSpeed = baseTarget * 0.50;
    } else if (player.boosting) {
      activeSpeed = baseTarget * 1.32;
    }
    const lerpRate = player.braking ? 9 : 6;
    speed += (activeSpeed - speed) * Math.min(1, dt * lerpRate);

    // Smooth player lane interpolation
    const targetX = getLaneCenterX(player.lane);
    player.x += (targetX - player.x) * Math.min(1, dt * 16);
    player.tilt += (0 - player.tilt) * Math.min(1, dt * 10);

    // Scroll road & props
    roadOffset = (roadOffset + speed * dt) % 80;
    for (const prop of props) {
      prop.y += speed * dt;
      if (prop.y > viewH + 80) {
        prop.y -= (Math.ceil(viewH / 120) + 2) * 120;
      }
    }

    // Score & Distance
    const boostMult = player.boosting ? 1.5 : 1;
    score += dt * 28 * mode.scoreMult * boostMult;
    distanceMeters += (speed * dt) / 16;

    // Spawning
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTraffic();
      const dynamicInterval = Math.max(
        mode.minSpawnInterval,
        mode.spawnInterval - elapsedTime * mode.spawnRampPerSec
      );
      spawnTimer = dynamicInterval * (0.82 + Math.random() * 0.36);
    }

    // Update traffic & check collisions
    const pLeft = player.x - player.w * 0.39;
    const pRight = player.x + player.w * 0.39;
    const pTop = player.y - player.h * 0.41;
    const pBottom = player.y + player.h * 0.41;

    const minFollowGap = Math.max(player.h * 1.35, 115);
    const minLaneChangeGap = Math.max(player.h * 2.2, 200);
    const minOvertakeCorridor = Math.max(player.h * 1.85, 165);

    for (let i = traffic.length - 1; i >= 0; i--) {
      const car = traffic[i];
      let relSpeed = speed - speed * car.speedFactor * 0.55;

      // Maintain minimum following gap behind slower cars in the same lane
      for (const ahead of traffic) {
        if (ahead === car || ahead.targetLane !== car.targetLane || ahead.y <= car.y) continue;
        const requiredDist = (car.h + ahead.h) * 0.5 + minFollowGap;
        if (ahead.y - car.y < requiredDist) {
          const aheadRelSpeed = speed - speed * ahead.speedFactor * 0.55;
          relSpeed = Math.min(relSpeed, aheadRelSpeed);
        }
      }

      car.y += relSpeed * dt;

      // Occasional lane change in Hard / Extreme Hard when approaching mid-screen
      if (car.canLaneChange && !car.changedLane && car.y > viewH * 0.18 && car.y < viewH * 0.36) {
        car.changedLane = true;
        const candidates = [car.lane - 1, car.lane + 1].filter((l) => l >= 0 && l <= 2);
        const safeTarget = candidates.find((targetL) => {
          const targetClear = !traffic.some(
            (other) => other !== car && other.targetLane === targetL && Math.abs(other.y - car.y) < minLaneChangeGap
          );
          if (!targetClear) return false;
          // Ensure at least 1 lane remains open for the player to overtake
          const thirdLane = [0, 1, 2].find((l) => l !== car.lane && l !== targetL);
          return !traffic.some(
            (other) => other !== car && other.targetLane === thirdLane && Math.abs(other.y - car.y) < minOvertakeCorridor
          );
        });
        if (safeTarget !== undefined) {
          car.targetLane = safeTarget;
        }
      }

      const carTargetX = getLaneCenterX(car.targetLane);
      car.x += (carTargetX - car.x) * Math.min(1, dt * 8);
      if (Math.abs(carTargetX - car.x) < 4) car.lane = car.targetLane;

      // Collision check (any hit = instant fail)
      const cLeft = car.x - car.w * 0.40;
      const cRight = car.x + car.w * 0.40;
      const cTop = car.y - car.h * 0.42;
      const cBottom = car.y + car.h * 0.42;

      if (pLeft < cRight && pRight > cLeft && pTop < cBottom && pBottom > cTop) {
        triggerCrash(car);
        return;
      }

      // Near-miss bonus
      if (!car.nearMissed && cTop > pBottom && Math.abs(car.x - player.x) < laneWidth * 1.15 && cTop - pBottom < 45) {
        car.nearMissed = true;
        nearMisses += 1;
        score += 50 * mode.scoreMult;
        sfx.playNearMiss();
        showCallout(`+${Math.round(50 * mode.scoreMult)} NEAR MISS!`);
      }

      if (car.y - car.h > viewH + 120) {
        traffic.splice(i, 1);
      }
    }

    // Update HUD
    hudScore.textContent = Math.floor(score).toLocaleString();
    hudSpeed.textContent = `${Math.round(speed * 0.28)} km/h`;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function drawRoad(road) {
    // Ground / grass / sand
    ctx.fillStyle = road.ground;
    ctx.fillRect(0, 0, viewW, viewH);

    // Road shoulders
    ctx.fillStyle = road.shoulder;
    ctx.fillRect(roadLeft - shoulderWidth, 0, roadWidth + shoulderWidth * 2, viewH);

    // Asphalt
    ctx.fillStyle = road.asphalt;
    ctx.fillRect(roadLeft, 0, roadWidth, viewH);

    // Outer edge lines
    ctx.fillStyle = road.edgeLine;
    ctx.fillRect(roadLeft + 3, 0, 4, viewH);
    ctx.fillRect(roadLeft + roadWidth - 7, 0, 4, viewH);

    // 3-Lane dashed dividers (2 interior dividers)
    ctx.fillStyle = road.laneDash;
    const dashH = 42;
    const gap = 38;
    const step = dashH + gap;
    for (let lane = 1; lane <= 2; lane++) {
      const lx = roadLeft + lane * laneWidth - 2;
      for (let y = (roadOffset % step) - step; y < viewH; y += step) {
        ctx.fillRect(lx, y, 4, dashH);
      }
    }

    // Roadside props
    for (const prop of props) {
      const px = prop.side === 0
        ? roadLeft - shoulderWidth - 26
        : roadLeft + roadWidth + shoulderWidth + 26;
      if (px < -30 || px > viewW + 30) continue;

      if (road.propType === "neonPole") {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(px - 3, prop.y - 4, 6, 10);
        ctx.fillStyle = prop.side === 0 ? "#00e5ff" : "#ff3d71";
        ctx.beginPath();
        ctx.arc(px, prop.y, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (road.propType === "tree") {
        ctx.fillStyle = "#14532d";
        ctx.beginPath();
        ctx.arc(px, prop.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(px - 2, prop.y - 3, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Cactus / Desert rock
        ctx.fillStyle = "#15803d";
        ctx.fillRect(px - 4, prop.y - 12, 8, 22);
        ctx.fillRect(px - 10, prop.y - 6, 6, 4);
        ctx.fillRect(px + 4, prop.y - 9, 6, 4);
      }
    }
  }

  function drawVehicle(x, y, w, h, color, tilt, isPlayer, road) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 3, -h / 2 + 5, w, h, 10);
    ctx.fill();

    // Headlight glow in Neon Night mode
    if (road.nightMode) {
      const grad = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 - 75);
      grad.addColorStop(0, isPlayer ? "rgba(0, 229, 255, 0.34)" : "rgba(255, 255, 200, 0.16)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.38, -h / 2);
      ctx.lineTo(-w * 0.72, -h / 2 - 75);
      ctx.lineTo(w * 0.72, -h / 2 - 75);
      ctx.lineTo(w * 0.38, -h / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Car body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 10);
    ctx.fill();

    // Racing stripe for player
    if (isPlayer) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(-w * 0.08, -h / 2 + 4, w * 0.16, h - 8);
    }

    // Windshield & rear glass
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-w * 0.36, -h * 0.24, w * 0.72, h * 0.22, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-w * 0.32, h * 0.10, w * 0.64, h * 0.16, 4);
    ctx.fill();

    // Roof
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.roundRect(-w * 0.32, -h * 0.03, w * 0.64, h * 0.14, 4);
    ctx.fill();

    // Headlights
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(-w * 0.36, -h / 2 + 2, w * 0.2, 5);
    ctx.fillRect(w * 0.16, -h / 2 + 2, w * 0.2, 5);

    // Taillights (bright glow when braking)
    const isBraking = isPlayer && player.braking && state === "playing";
    ctx.fillStyle = isBraking ? "#ff1744" : "#ff2a55";
    ctx.fillRect(-w * 0.36, h / 2 - 6, w * 0.22, isBraking ? 6 : 4);
    ctx.fillRect(w * 0.14, h / 2 - 6, w * 0.22, isBraking ? 6 : 4);
    if (isBraking) {
      ctx.fillStyle = "rgba(255, 23, 68, 0.35)";
      ctx.beginPath();
      ctx.arc(-w * 0.25, h / 2, 12, 0, Math.PI * 2);
      ctx.arc(w * 0.25, h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nitro flame when boosting
    if (isPlayer && player.boosting && !player.braking && state === "playing") {
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.moveTo(-w * 0.22, h / 2);
      ctx.lineTo(0, h / 2 + 16 + Math.random() * 12);
      ctx.lineTo(w * 0.22, h / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function render() {
    const road = ROADS[selectedRoad];

    ctx.save();
    if (shakeTime > 0) {
      const mag = shakeTime * 18;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    drawRoad(road);

    // Traffic cars
    for (const car of traffic) {
      drawVehicle(car.x, car.y, car.w, car.h, car.color, 0, false, road);
    }

    // Player car
    drawVehicle(player.x, player.y, player.w, player.h, "#00e5ff", player.tilt, true, road);

    // Crash particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000 || 0);
    lastFrameTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  resizeCanvas();
  initProps();
  updateMenuUI();
  lastFrameTime = performance.now();
  requestAnimationFrame(loop);
})();
