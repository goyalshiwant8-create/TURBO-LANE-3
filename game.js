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
      baseSpeed: 390,
      maxSpeed: 640,
      accelPerSec: 8,
      spawnInterval: 1.05,
      minSpawnInterval: 0.58,
      spawnRampPerSec: 0.01,
      doubleSpawnChance: 0.28,
      laneChangeChance: 0.08,
      scoreMult: 1,
    },
    hard: {
      id: "hard",
      label: "Hard",
      badgeClass: "hard",
      baseSpeed: 540,
      maxSpeed: 880,
      accelPerSec: 13,
      spawnInterval: 0.78,
      minSpawnInterval: 0.38,
      spawnRampPerSec: 0.014,
      doubleSpawnChance: 0.52,
      laneChangeChance: 0.26,
      scoreMult: 1.6,
    },
    extreme: {
      id: "extreme",
      label: "Extreme Hard",
      badgeClass: "extreme",
      baseSpeed: 700,
      maxSpeed: 1180,
      accelPerSec: 19,
      spawnInterval: 0.55,
      minSpawnInterval: 0.26,
      spawnRampPerSec: 0.018,
      doubleSpawnChance: 0.72,
      laneChangeChance: 0.42,
      scoreMult: 2.5,
    },
  };

  const ROADS = {
    neon: {
      id: "neon",
      label: "Neon Night",
      skyTop: "#060b16",
      skyHorizon: "#1b2842",
      sky: 0x101829,
      fog: 0x131d31,
      ground: 0x1e242b,
      shoulder: 0x262b33,
      asphalt: 0x1e2228,
      edgeLine: 0xf59e0b,
      laneDash: 0xd1d5db,
      ambientColor: 0x64748b,
      ambientIntensity: 0.72,
      sunColor: 0xcbd5e1,
      sunIntensity: 0.85,
      propType: "neonPole",
      nightMode: true,
    },
    highway: {
      id: "highway",
      label: "Sunny Highway",
      skyTop: "#2563eb",
      skyHorizon: "#bae6fd",
      sky: 0x93c5fd,
      fog: 0xbfe0f7,
      ground: 0x3b5323,
      shoulder: 0x57534e,
      asphalt: 0x272b30,
      edgeLine: 0xf59e0b,
      laneDash: 0xf1f5f9,
      ambientColor: 0xf8fafc,
      ambientIntensity: 0.78,
      sunColor: 0xfff7e6,
      sunIntensity: 1.3,
      propType: "tree",
      nightMode: false,
    },
    desert: {
      id: "desert",
      label: "Desert Canyon",
      skyTop: "#0284c7",
      skyHorizon: "#fed7aa",
      sky: 0xfdba74,
      fog: 0xf3c694,
      ground: 0xa68158,
      shoulder: 0x78624a,
      asphalt: 0x2b2927,
      edgeLine: 0xfbbf24,
      laneDash: 0xf3f4f6,
      ambientColor: 0xfff1e0,
      ambientIntensity: 0.78,
      sunColor: 0xffe8cc,
      sunIntensity: 1.35,
      propType: "cactus",
      nightMode: false,
    },
  };

  const VEHICLE_TYPES = [
    { kind: "hypercar", w: 2.02, len: 4.3, h: 1.02, speedFactor: 0.45, colors: [0xb91c1c, 0x1d4ed8, 0xe5e7eb, 0x18181b, 0x94a3b8] },
    { kind: "gt", w: 1.98, len: 4.2, h: 1.05, speedFactor: 0.45, colors: [0xc2410c, 0x1e3a8a, 0x374151, 0xd4d4d8] },
    { kind: "spider", w: 1.96, len: 4.1, h: 0.98, speedFactor: 0.45, colors: [0xc29b48, 0x15803d, 0x991b1b, 0x0f766e] },
    { kind: "prototype", w: 2.06, len: 4.4, h: 0.96, speedFactor: 0.45, colors: [0x334155, 0xf8fafc, 0x7c2d12, 0x1e293b] },
    { kind: "apex", w: 2.0, len: 4.25, h: 1.0, speedFactor: 0.45, colors: [0x4b5563, 0x0369a1, 0x854d0e, 0xe2e8f0] },
  ];

  // 3D Road Dimensions
  const LANE_WIDTH = 3.4;
  const LANE_CENTERS = [-LANE_WIDTH, 0, LANE_WIDTH];
  const ROAD_WIDTH = LANE_WIDTH * 3 + 0.8;
  const SPEED_TO_3D = 0.085;
  const SPAWN_Z = -135;
  const DESPAWN_Z = 18;

  // ---------------------------------------------------------------------------
  // DOM Elements
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById("game-canvas");

  const hud = document.getElementById("hud");
  const hudScore = document.getElementById("hud-score");
  const hudSpeed = document.getElementById("hud-speed");
  const hudBest = document.getElementById("hud-best");
  const hudCoins = document.getElementById("hud-coins");
  const hudFriendStat = document.getElementById("hud-friend-stat");
  const hudFriendScore = document.getElementById("hud-friend-score");
  const hudModeBadge = document.getElementById("hud-mode-badge");
  const hudProgressFill = document.getElementById("hud-progress-fill");
  const btnSound = document.getElementById("btn-sound");
  const btnPause = document.getElementById("btn-pause");
  const calloutEl = document.getElementById("callout");
  const countdownEl = document.getElementById("countdown");

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
  const paintDotBtns = document.querySelectorAll("#car-color-options .paint-dot");
  const menuModeLabel = document.getElementById("menu-mode-label");
  const menuBestScore = document.getElementById("menu-best-score");
  const menuSoundBtn = document.getElementById("menu-sound-btn");

  const overScore = document.getElementById("over-score");
  const overBest = document.getElementById("over-best");
  const overDistance = document.getElementById("over-distance");
  const overNearmiss = document.getElementById("over-nearmiss");
  const overNewBest = document.getElementById("over-new-best");
  const overMpResult = document.getElementById("over-mp-result");

  // ---------------------------------------------------------------------------
  // Web Audio Synthesizer (SFX + Dynamic Arcade Music)
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

      const stepMs = (60 / this.musicBpm / 4) * 1000;
      const bassPattern = [55, 55, 65.41, 55, 73.42, 73.42, 82.41, 65.41];
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

    playCoin() {
      const ac = this.ensureContext();
      if (!ac) return;
      const now = ac.currentTime;
      [880, 1174.66].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.045);
        gain.gain.setValueAtTime(0.11, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.14);
        osc.connect(gain).connect(ac.destination);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.15);
      });
    }

    playLevelUp() {
      const ac = this.ensureContext();
      if (!ac) return;
      const now = ac.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.11, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
        osc.connect(gain).connect(ac.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.23);
      });
    }

    playCountdown(isGo) {
      const ac = this.ensureContext();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = isGo ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.25 : 0.14));
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + (isGo ? 0.26 : 0.15));
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
  // Three.js 3D Scene Setup
  // ---------------------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 220);

  const hemiLight = new THREE.HemisphereLight(0xa5f3fc, 0x0f172a, 0.75);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(16, 28, 12);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 110;
  const d = 28;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  // Procedural Real-World Textures (Terrain, Asphalt with Tire Tracks, Sky Dome)
  function createTerrainTexture() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#dcdcdc";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1200; i++) {
      const v = 165 + Math.floor(Math.random() * 75);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(22, 24);
    return tex;
  }

  const terrainTex = createTerrainTexture();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e242b, map: terrainTex, roughness: 0.96, metalness: 0.02 });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, -0.04, -75);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x262b33, map: terrainTex, roughness: 0.92, metalness: 0.04 });
  const shoulderMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH + 2.8, 240), shoulderMat);
  shoulderMesh.rotation.x = -Math.PI / 2;
  shoulderMesh.position.set(0, -0.02, -75);
  shoulderMesh.receiveShadow = true;
  scene.add(shoulderMesh);

  // Procedural Asphalt Grain Texture with Subtle Tire Tracks
  function createAsphaltTexture() {
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 256;
    texCanvas.height = 256;
    const tctx = texCanvas.getContext("2d");
    tctx.fillStyle = "#e0e0e0";
    tctx.fillRect(0, 0, 256, 256);
    // Subtle dark tire-wear lanes in each of the 3 lanes
    tctx.fillStyle = "rgba(0, 0, 0, 0.14)";
    [42, 128, 214].forEach((cx) => {
      tctx.fillRect(cx - 18, 0, 10, 256);
      tctx.fillRect(cx + 8, 0, 10, 256);
    });
    for (let i = 0; i < 2400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const v = 175 + Math.floor(Math.random() * 65);
      tctx.fillStyle = `rgb(${v},${v},${v})`;
      tctx.fillRect(x, y, 2, 2);
    }
    const tex = new THREE.CanvasTexture(texCanvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 22);
    return tex;
  }

  const asphaltTex = createAsphaltTexture();
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x171d33,
    map: asphaltTex,
    roughness: 0.85,
    metalness: 0.1,
  });
  const asphaltMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, 240), asphaltMat);
  asphaltMesh.rotation.x = -Math.PI / 2;
  asphaltMesh.position.set(0, 0, -75);
  asphaltMesh.receiveShadow = true;
  scene.add(asphaltMesh);

  const edgeLineMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 240), edgeLineMat);
  leftEdge.position.set(-ROAD_WIDTH / 2 + 0.15, 0.02, -75);
  const rightEdge = leftEdge.clone();
  rightEdge.position.x = ROAD_WIDTH / 2 - 0.15;
  scene.add(leftEdge, rightEdge);

  // 3D Highway Guardrails
  const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.35 });
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 240), railMat);
  railL.position.set(-ROAD_WIDTH / 2 - 1.15, 0.55, -75);
  const railR = railL.clone();
  railR.position.x = ROAD_WIDTH / 2 + 1.15;
  scene.add(railL, railR);

  // Scrolling Lane Dashes
  const laneDashMat = new THREE.MeshBasicMaterial({ color: 0xff3d71 });
  const dashGeo = new THREE.BoxGeometry(0.16, 0.03, 3.6);
  const laneDashes = [];
  const DASH_STEP = 8.5;
  const DASH_COUNT = 26;
  for (let i = 0; i < DASH_COUNT; i++) {
    const z = 20 - i * DASH_STEP;
    const d1 = new THREE.Mesh(dashGeo, laneDashMat);
    d1.position.set(-LANE_WIDTH / 2, 0.02, z);
    const d2 = new THREE.Mesh(dashGeo, laneDashMat);
    d2.position.set(LANE_WIDTH / 2, 0.02, z);
    scene.add(d1, d2);
    laneDashes.push(d1, d2);
  }

  // ---------------------------------------------------------------------------
  // 3D Vehicle Builder
  // ---------------------------------------------------------------------------
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 10);
  rimGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.75, roughness: 0.12 });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.45 });

  function createVehicleMesh(kind, color, isPlayer) {
    const group = new THREE.Group();
    const spec = isPlayer
      ? { w: 2.04, len: 4.35, h: 1.0 }
      : VEHICLE_TYPES.find((v) => v.kind === kind) || VEHICLE_TYPES[0];

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.58,
      roughness: 0.18,
    });

    // Low-slung Supercar Main Body
    const chassisH = spec.h * 0.48;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(spec.w, chassisH, spec.len * 0.88), bodyMat);
    chassis.position.set(0, 0.32 + chassisH / 2, 0.08);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Wedge Front Nose & Carbon-Fiber Splitter
    const nose = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.92, chassisH * 0.68, spec.len * 0.24), bodyMat);
    nose.position.set(0, 0.32 + chassisH * 0.34, -spec.len * 0.42);
    nose.rotation.x = 0.12;
    nose.castShadow = true;
    group.add(nose);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 1.02, 0.07, 0.38), carbonMat);
    splitter.position.set(0, 0.26, -spec.len * 0.51);
    group.add(splitter);

    // Carbon Side Skirts & Side Air Intakes
    [-1, 1].forEach((side) => {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, spec.len * 0.62), carbonMat);
      skirt.position.set(side * (spec.w * 0.5 + 0.02), 0.29, 0.05);
      group.add(skirt);

      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.08, chassisH * 0.55, 0.55), carbonMat);
      intake.position.set(side * (spec.w * 0.49), 0.34 + chassisH * 0.5, 0.45);
      group.add(intake);
    });

    // Sleek Teardrop Supercar Cockpit Canopy
    const cabinH = spec.h * 0.42;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.68, cabinH, spec.len * 0.44), glassMat);
    cabin.position.set(0, 0.32 + chassisH + cabinH / 2 - 0.03, 0.12);
    cabin.castShadow = true;
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.6, 0.07, spec.len * 0.32), bodyMat);
    roof.position.set(0, 0.32 + chassisH + cabinH - 0.02, 0.2);
    group.add(roof);

    // Aggressive GT Carbon-Fiber Rear Wing + Twin Struts
    const wing = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.96, 0.08, 0.36), carbonMat);
    wing.position.set(0, 0.32 + chassisH + 0.34, spec.len / 2 - 0.18);
    wing.castShadow = true;
    group.add(wing);

    [-0.42, 0.42].forEach((sx) => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.16), carbonMat);
      strut.position.set(sx, 0.32 + chassisH + 0.17, spec.len / 2 - 0.2);
      group.add(strut);
    });

    // Twin Rear Exhausts
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    [-0.36, 0.36].forEach((ex) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), exhaustMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ex, 0.34, spec.len / 2 + 0.04);
      group.add(pipe);
    });

    if (isPlayer) {
      // Twin Racing Stripes
      [-0.18, 0.18].forEach((sx) => {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.03, spec.len * 0.9),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        stripe.position.set(sx, 0.32 + chassisH + 0.02, 0.02);
        group.add(stripe);
      });
    }

    // 4 Wheels
    const wheels = [];
    const wheelOffsets = [
      [-spec.w / 2 + 0.06, 0.36, -spec.len * 0.3],
      [spec.w / 2 - 0.06, 0.36, -spec.len * 0.3],
      [-spec.w / 2 + 0.06, 0.36, spec.len * 0.3],
      [spec.w / 2 - 0.06, 0.36, spec.len * 0.3],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      w.add(rim);
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      group.add(w);
      wheels.push(w);
    });

    // Headlights (front = -Z)
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.08), headlightMat);
    hlL.position.set(-spec.w * 0.32, 0.36 + chassisH * 0.5, -spec.len / 2 - 0.02);
    const hlR = hlL.clone();
    hlR.position.x = spec.w * 0.32;
    group.add(hlL, hlR);

    // Taillights (rear = +Z)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a55 });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), tailMat);
    tlL.position.set(-spec.w * 0.32, 0.36 + chassisH * 0.5, spec.len / 2 + 0.02);
    const tlR = tlL.clone();
    tlR.position.x = spec.w * 0.32;
    group.add(tlL, tlR);

    if (isPlayer) {
      // Headlight beam cone for Neon Night
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beamGeo = new THREE.ConeGeometry(2.6, 12, 16, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 0.45, -spec.len / 2 - 6);
      beam.visible = false;
      group.add(beam);

      // Nitro flames
      const flameGeo = new THREE.ConeGeometry(0.22, 1.3, 8);
      flameGeo.rotateX(Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const flameL = new THREE.Mesh(flameGeo, flameMat);
      flameL.position.set(-0.4, 0.42, spec.len / 2 + 0.65);
      const flameR = flameL.clone();
      flameR.position.x = 0.4;
      flameL.visible = false;
      flameR.visible = false;
      group.add(flameL, flameR);

      group.userData = { bodyMat, wheels, tailMat, tlL, tlR, beam, flameL, flameR };
    } else {
      group.userData = { wheels };
    }

    return group;
  }

  const bodyPaintDefault = 0x1d4ed8;
  // Player 3D Mesh & Friend 3D Mesh (for Online Multiplayer)
  const playerMesh = createVehicleMesh("sports", bodyPaintDefault, true);
  scene.add(playerMesh);

  const friendMesh = createVehicleMesh("sports", 0xb91c1c, true);
  friendMesh.visible = false;
  scene.add(friendMesh);

  // 3D Checkered Finish Line Arch (visible near 1000m in Multiplayer)
  const finishArch = new THREE.Group();
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.2, 0.45), pillarMat);
  pillarL.position.set(-ROAD_WIDTH / 2 - 0.3, 2.6, 0);
  const pillarR = pillarL.clone();
  pillarR.position.x = ROAD_WIDTH / 2 + 0.3;
  finishArch.add(pillarL, pillarR);
  for (let c = 0; c < 12; c++) {
    const sqColor = c % 2 === 0 ? 0xffffff : 0x0f172a;
    const sq = new THREE.Mesh(
      new THREE.BoxGeometry((ROAD_WIDTH + 0.8) / 12, 0.9, 0.35),
      new THREE.MeshBasicMaterial({ color: sqColor })
    );
    sq.position.set(-ROAD_WIDTH / 2 - 0.4 + ((c + 0.5) * (ROAD_WIDTH + 0.8)) / 12, 4.9, 0);
    finishArch.add(sq);

    const floorSq = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH / 12, 1.4),
      new THREE.MeshBasicMaterial({ color: sqColor })
    );
    floorSq.rotation.x = -Math.PI / 2;
    floorSq.position.set(-ROAD_WIDTH / 2 + ((c + 0.5) * ROAD_WIDTH) / 12, 0.03, 0);
    finishArch.add(floorSq);
  }
  finishArch.visible = false;
  scene.add(finishArch);

  // ---------------------------------------------------------------------------
  // Roadside 3D Props Pool
  // ---------------------------------------------------------------------------
  const propGroup = new THREE.Group();
  scene.add(propGroup);
  let propItems = [];

  function buildRoadProps(propType) {
    while (propGroup.children.length > 0) {
      propGroup.remove(propGroup.children[0]);
    }
    propItems = [];

    const count = 18;
    const spacing = 11;
    for (let i = 0; i < count; i++) {
      const z = 16 - i * spacing;
      [-1, 1].forEach((side) => {
        const x = side * (ROAD_WIDTH / 2 + 2.6 + (i % 2) * 0.6);
        const obj = new THREE.Group();
        if (propType === "neonPole") {
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 4.2, 8),
            new THREE.MeshLambertMaterial({ color: 0x1e293b })
          );
          pole.position.y = 2.1;
          const lamp = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 10, 10),
            new THREE.MeshBasicMaterial({ color: side < 0 ? 0x00e5ff : 0xff3d71 })
          );
          lamp.position.y = 4.2;
          obj.add(pole, lamp);
        } else if (propType === "tree") {
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.3, 1.8, 8),
            new THREE.MeshLambertMaterial({ color: 0x78350f })
          );
          trunk.position.y = 0.9;
          const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.3, 3.2, 8),
            new THREE.MeshLambertMaterial({ color: 0x15803d })
          );
          leaves.position.y = 3.1;
          leaves.castShadow = true;
          obj.add(trunk, leaves);
        } else {
          const cactusMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 2.8, 8), cactusMat);
          body.position.y = 1.4;
          const armL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.24), cactusMat);
          armL.position.set(-0.35, 1.7, 0);
          const armR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.24), cactusMat);
          armR.position.set(0.35, 2.0, 0);
          obj.add(body, armL, armR);
        }
        obj.position.set(x, 0, z);
        propGroup.add(obj);
        propItems.push(obj);
      });
    }
  }

  const skylineGroup = new THREE.Group();
  scene.add(skylineGroup);

  // Real-Life World Landmarks: Buildings, Train Bridges + Moving Train, Airport + Jet, Nature & Clouds
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  let worldLoopers = [];
  let skyClouds = [];
  let movingTrain = null;
  let airportRadar = null;
  let skyPlane = null;

  function createBuildingTexture(nightMode) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = nightMode ? "#182032" : "#9aa4b2";
    g.fillRect(0, 0, 128, 256);
    for (let y = 10; y < 246; y += 18) {
      for (let x = 8; x < 118; x += 18) {
        if (nightMode) {
          const lit = Math.random() > 0.35;
          g.fillStyle = lit ? (Math.random() > 0.2 ? "#fde68a" : "#e0f2fe") : "#0f172a";
        } else {
          g.fillStyle = Math.random() > 0.25 ? "#1e293b" : "#334155";
        }
        g.fillRect(x, y, 12, 11);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  const buildingDayTex = createBuildingTexture(false);
  const buildingNightTex = createBuildingTexture(true);

  function createBuildingMesh(nightMode, desertMode, idx) {
    const bGroup = new THREE.Group();
    const w = 4.5 + (idx % 3) * 1.4;
    const d = 4.5 + ((idx + 1) % 3) * 1.4;
    const h = 8 + ((idx * 5) % 15);
    const palette = nightMode
      ? [0x94a3b8, 0x64748b, 0xcbd5e1]
      : desertMode
      ? [0xd6b892, 0xc29b6c, 0xb8966a]
      : [0xdbe3ec, 0xcbd5e1, 0xb8c4d4, 0xe5e7eb];
    const wallMat = new THREE.MeshStandardMaterial({
      color: palette[idx % palette.length],
      map: nightMode ? buildingNightTex : buildingDayTex,
      roughness: 0.55,
      metalness: 0.25,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    // Rooftop detail
    const roofBox = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.4, 0.9, d * 0.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    roofBox.position.y = h + 0.45;
    bGroup.add(roofBox);
    return bGroup;
  }

  function createNatureCluster(roadId, idx) {
    const nGroup = new THREE.Group();
    if (roadId === "desert") {
      // Desert boulders & scrub
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + (idx % 2) * 0.6, 0), rockMat);
      rock.position.y = 0.8;
      rock.scale.y = 0.7;
      nGroup.add(rock);
    } else {
      // Lush oak tree + bush
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.28, 1.8, 7),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      trunk.position.y = 0.9;
      const canopyColor = roadId === "neon" ? 0x065f46 : idx % 2 === 0 ? 0x16a34a : 0x15803d;
      const canopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.5, 1),
        new THREE.MeshLambertMaterial({ color: canopyColor })
      );
      canopy.position.y = 2.6;
      canopy.castShadow = true;
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x22c55e })
      );
      bush.position.set(1.2, 0.5, 0.6);
      nGroup.add(trunk, canopy, bush);
    }
    return nGroup;
  }

  function createTrainBridge(nightMode) {
    const br = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });

    // Support pillars outside road
    [-7.6, 7.6].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 7.2, 1.8), concreteMat);
      pillar.position.set(px, 3.6, 0);
      pillar.castShadow = true;
      br.add(pillar);
    });

    // Overhead bridge deck (high above highway so cars pass cleanly underneath)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(46, 0.75, 3.4), concreteMat);
    deck.position.set(0, 7.2, 0);
    deck.castShadow = true;
    br.add(deck);

    // Steel side trusses + OHE (Overhead Electric) Catenary Masts & Wire
    [-1.5, 1.5].forEach((rz) => {
      const truss = new THREE.Mesh(new THREE.BoxGeometry(46, 0.5, 0.18), steelMat);
      truss.position.set(0, 8.1, rz);
      br.add(truss);
    });
    for (let mx = -18; mx <= 18; mx += 12) {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.0, 0.16), steelMat);
      mast.position.set(mx, 9.0, -1.55);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.7), steelMat);
      arm.position.set(mx, 10.2, -0.75);
      br.add(mast, arm);
    }
    const oheWire = new THREE.Mesh(
      new THREE.BoxGeometry(46, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
    );
    oheWire.position.set(0, 10.05, 0);
    br.add(oheWire);

    // Animated 3D Indian Railways Express Train (WAP-7 Loco + Blue ICF Coaches)
    const train = new THREE.Group();
    const wapWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.35, roughness: 0.3 });
    const wapRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.35, roughness: 0.35 });
    const icfBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, metalness: 0.35, roughness: 0.35 });
    const icfStripeMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.4 });
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 });
    const winMat = new THREE.MeshBasicMaterial({ color: nightMode ? 0xfef08a : 0x0f172a });

    // WAP-7 Electric Locomotive
    const loco = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.55, 1.62), wapWhiteMat);
    loco.position.set(0, 0.82, 0);
    const locoStripe = new THREE.Mesh(new THREE.BoxGeometry(4.64, 0.36, 1.66), wapRedMat);
    locoStripe.position.set(0, 0.72, 0);
    const locoRoof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 1.5), roofMat);
    locoRoof.position.set(0, 1.65, 0);
    const locoCabWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 1.25), winMat);
    locoCabWin.position.set(2.28, 1.15, 0);
    const locoHeadlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    locoHeadlight.position.set(2.34, 0.68, 0);

    // Raised Pantograph on WAP-7 Roof
    const pantoArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), steelMat);
    pantoArm1.position.set(-0.6, 2.0, 0);
    pantoArm1.rotation.z = -0.45;
    const pantoArm2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), steelMat);
    pantoArm2.position.set(-0.35, 2.0, 0);
    pantoArm2.rotation.z = 0.45;
    const pantoTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.9), steelMat);
    pantoTop.position.set(-0.48, 2.38, 0);
    train.add(loco, locoStripe, locoRoof, locoCabWin, locoHeadlight, pantoArm1, pantoArm2, pantoTop);

    // 4 Iconic Indian Railways Blue Express Coaches
    for (let c = 1; c <= 4; c++) {
      const cx = -c * 4.9;
      const carriage = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.45, 1.54), icfBlueMat);
      carriage.position.set(cx, 0.78, 0);
      const band = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.55, 1.56), icfStripeMat);
      band.position.set(cx, 0.94, 0);
      const creamLine = new THREE.Mesh(new THREE.BoxGeometry(4.54, 0.12, 1.57), creamMat);
      creamLine.position.set(cx, 0.56, 0);
      const cRoof = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.14, 1.44), roofMat);
      cRoof.position.set(cx, 1.56, 0);
      train.add(carriage, band, creamLine, cRoof);

      // Individual Passenger Windows along the coach
      for (let wx = -1.5; wx <= 1.5; wx += 0.6) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 1.6), winMat);
        win.position.set(cx + wx, 0.96, 0);
        train.add(win);
      }
    }
    train.position.set(-24, 7.6, 0);
    br.add(train);
    movingTrain = train;

    return br;
  }

  function createAirportLandmark(nightMode) {
    const ap = new THREE.Group();
    // Runway strip parallel to the highway
    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 42),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.02, 0);
    ap.add(runway);

    // Runway center markings & edge lights
    for (let i = -16; i <= 16; i += 4) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, i);
      ap.add(dash);

      [-3.5, 3.5].forEach((lx) => {
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 6, 6),
          new THREE.MeshBasicMaterial({ color: nightMode ? 0x38bdf8 : 0xfbbf24 })
        );
        bulb.position.set(lx, 0.12, i);
        ap.add(bulb);
      });
    }

    // Airport Terminal Building
    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 3.4, 14),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3 })
    );
    terminal.position.set(-7.5, 1.7, 0);
    terminal.castShadow = true;
    const termGlass = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 1.6, 13.4),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.8, roughness: 0.1 })
    );
    termGlass.position.set(-7.5, 1.8, 0);
    ap.add(terminal, termGlass);

    // Air Traffic Control Tower + Rotating Radar
    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.2, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    towerShaft.position.set(-7.5, 5, -10);
    const towerCab = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 1.5, 2.0, 10),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.15 })
    );
    towerCab.position.set(-7.5, 10.6, -10);
    const radar = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.4, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    radar.position.set(-7.5, 12.1, -10);
    ap.add(towerShaft, towerCab, radar);
    airportRadar = radar;

    return ap;
  }

  function createAirplane() {
    const plane = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.25 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 5.2, 10), bodyMat);
    fuselage.rotation.x = Math.PI / 2;
    const wings = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 1.3), bodyMat);
    wings.position.set(0, 0, -0.2);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.9), accentMat);
    tail.position.set(0, 0.6, 2.1);
    const hStab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.65), accentMat);
    hStab.position.set(0, 0.1, 2.2);

    const navL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2a55 }));
    navL.position.set(-3.2, 0, -0.2);
    const navR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    navR.position.set(3.2, 0, -0.2);

    plane.add(fuselage, wings, tail, hStab, navL, navR);
    plane.scale.set(1.3, 1.3, 1.3);
    return plane;
  }

  function buildRealWorldScenery(roadId) {
    while (worldGroup.children.length > 0) {
      worldGroup.remove(worldGroup.children[0]);
    }
    worldLoopers = [];
    skyClouds = [];
    movingTrain = null;
    airportRadar = null;
    skyPlane = null;

    const nightMode = roadId === "neon";
    const desertMode = roadId === "desert";

    // Roadside Buildings + Nature Clusters along both sides
    for (let i = 0; i < 12; i++) {
      const z = 12 - i * 16;
      [-1, 1].forEach((side, sIdx) => {
        const bldg = createBuildingMesh(nightMode, desertMode, i + sIdx);
        bldg.position.set(side * (13.5 + (i % 2) * 3.5), 0, z);
        worldGroup.add(bldg);
        worldLoopers.push({ obj: bldg, span: 12 * 16 });

        const nat = createNatureCluster(roadId, i + sIdx);
        nat.position.set(side * (9.5 + (i % 3) * 1.4), 0, z - 8);
        worldGroup.add(nat);
        worldLoopers.push({ obj: nat, span: 12 * 16 });
      });
    }

    // Overhead Train Bridge + Moving Express Train
    const bridge = createTrainBridge(nightMode);
    bridge.position.set(0, 0, -95);
    worldGroup.add(bridge);
    worldLoopers.push({ obj: bridge, span: 192 });

    // Roadside Airport Terminal + Runway + Control Tower
    const airport = createAirportLandmark(nightMode);
    airport.position.set(-22, 0, -145);
    worldGroup.add(airport);
    worldLoopers.push({ obj: airport, span: 210 });

    // Flying Passenger Jet in the Sky
    skyPlane = createAirplane();
    skyPlane.position.set(-40, 20, -65);
    skyPlane.rotation.y = -Math.PI / 3;
    worldGroup.add(skyPlane);

    // 3D Fluffy Sky Clouds
    const cloudMat = new THREE.MeshLambertMaterial({
      color: nightMode ? 0x1e293b : desertMode ? 0xfde68a : 0xffffff,
      transparent: true,
      opacity: nightMode ? 0.45 : 0.85,
      fog: false,
    });
    for (let c = 0; c < 8; c++) {
      const cl = new THREE.Group();
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(2.2 - p * 0.35, 8, 8), cloudMat);
        puff.position.set((p - 1) * 1.8, (p % 2) * 0.6, 0);
        puff.scale.set(1.4, 0.7, 1.0);
        cl.add(puff);
      }
      cl.position.set(-45 + c * 14, 22 + (c % 3) * 3, -80 - (c % 4) * 18);
      worldGroup.add(cl);
      skyClouds.push(cl);
    }
  }

  function updateWorldScenery(speed3D, dt) {
    for (const item of worldLoopers) {
      item.obj.position.z += speed3D * dt;
      if (item.obj.position.z > 28) {
        item.obj.position.z -= item.span;
      }
    }
    if (movingTrain) {
      movingTrain.position.x += 14 * dt;
      if (movingTrain.position.x > 34) movingTrain.position.x = -26;
    }
    if (airportRadar) {
      airportRadar.rotation.y += 2.6 * dt;
    }
    if (skyPlane) {
      skyPlane.position.x += 13 * dt;
      skyPlane.position.z -= 4 * dt;
      if (skyPlane.position.x > 55) {
        skyPlane.position.set(-55, 19 + Math.random() * 5, -55 - Math.random() * 25);
      }
    }
    for (const cl of skyClouds) {
      cl.position.x += 1.4 * dt;
      if (cl.position.x > 65) cl.position.x = -65;
    }
  }

  function createSkyTexture(topColor, horizonColor) {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, topColor);
    grad.addColorStop(0.65, horizonColor);
    grad.addColorStop(1, horizonColor);
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    return new THREE.CanvasTexture(c);
  }

  function createSunGlowTexture(isNight) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(128, 128, 6, 128, 128, 124);
    grad.addColorStop(0, isNight ? "rgba(226,232,240,0.95)" : "rgba(255,252,235,0.98)");
    grad.addColorStop(0.2, isNight ? "rgba(148,163,184,0.35)" : "rgba(254,240,138,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function buildSkyline(roadId) {
    while (skylineGroup.children.length > 0) {
      skylineGroup.remove(skylineGroup.children[0]);
    }
    const count = 16;
    for (let i = 0; i < count; i++) {
      const x = -85 + i * 11.5 + (Math.random() - 0.5) * 3;
      if (Math.abs(x) < 12) continue;
      if (roadId === "neon") {
        const h = 14 + Math.random() * 24;
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(6 + Math.random() * 3, h, 6),
          new THREE.MeshStandardMaterial({ color: 0x334155, map: buildingNightTex, fog: false })
        );
        b.position.set(x, h / 2 - 2, -162 - Math.random() * 12);
        skylineGroup.add(b);
      } else if (roadId === "highway") {
        const hill = new THREE.Mesh(
          new THREE.SphereGeometry(14 + Math.random() * 6, 10, 8),
          new THREE.MeshLambertMaterial({ color: 0x2f4820, fog: false })
        );
        hill.scale.set(1.3, 0.7, 0.8);
        hill.position.set(x, 1, -158 - Math.random() * 10);
        skylineGroup.add(hill);
      } else {
        const mesaH = 10 + Math.random() * 12;
        const mesa = new THREE.Mesh(
          new THREE.CylinderGeometry(5 + Math.random() * 3, 9 + Math.random() * 4, mesaH, 7),
          new THREE.MeshLambertMaterial({ color: 0x8c5a3c, fog: false })
        );
        mesa.position.set(x, mesaH / 2 - 1, -158 - Math.random() * 10);
        skylineGroup.add(mesa);
      }
    }
  }

  function applyRoadTheme(roadId) {
    const road = ROADS[roadId];
    scene.background = createSkyTexture(road.skyTop, road.skyHorizon);
    scene.fog = new THREE.Fog(road.fog, 50, 155);
    groundMat.color.setHex(road.ground);
    shoulderMat.color.setHex(road.shoulder);
    asphaltMat.color.setHex(road.asphalt);
    edgeLineMat.color.setHex(road.edgeLine);
    laneDashMat.color.setHex(road.laneDash);

    hemiLight.color.setHex(road.sky);
    hemiLight.groundColor.setHex(road.ground);
    ambientLight.color.setHex(road.ambientColor);
    ambientLight.intensity = road.ambientIntensity;
    sunLight.color.setHex(road.sunColor);
    sunLight.intensity = road.sunIntensity;

    if (playerMesh.userData.beam) {
      playerMesh.userData.beam.visible = road.nightMode;
    }
    horizonMat.map = createSunGlowTexture(road.nightMode);
    horizonMat.needsUpdate = true;
    horizonDisc.position.set(road.nightMode ? -24 : 26, road.nightMode ? 32 : 28, -172);
    buildRoadProps(road.propType);
    buildSkyline(roadId);
    buildRealWorldScenery(roadId);
  }

  // Atmospheric Sun / Moon Soft Halo
  const horizonMat = new THREE.MeshBasicMaterial({
    map: createSunGlowTexture(true),
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const horizonDisc = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), horizonMat);
  horizonDisc.position.set(26, 28, -172);
  scene.add(horizonDisc);

  // Clean Racing Wind-Streak Particle Streams (Side-Fender Slipstream + Peripheral Speed Lines)
  function createWindRibbonTexture() {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 128;
    const g = c.getContext("2d");
    const hGrad = g.createLinearGradient(0, 0, 32, 0);
    hGrad.addColorStop(0, "rgba(255,255,255,0)");
    hGrad.addColorStop(0.5, "rgba(255,255,255,0.95)");
    hGrad.addColorStop(1, "rgba(255,255,255,0)");

    const vGrad = g.createLinearGradient(0, 0, 0, 128);
    vGrad.addColorStop(0, "rgba(255,255,255,0)");
    vGrad.addColorStop(0.2, "rgba(255,255,255,1)");
    vGrad.addColorStop(0.85, "rgba(255,255,255,0.35)");
    vGrad.addColorStop(1, "rgba(255,255,255,0)");

    g.fillStyle = hGrad;
    g.fillRect(0, 0, 32, 128);
    g.globalCompositeOperation = "destination-in";
    g.fillStyle = vGrad;
    g.fillRect(0, 0, 32, 128);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  const windRibbonTex = createWindRibbonTexture();
  const sideWindStreaks = [];
  const sideWindGeo = new THREE.PlaneGeometry(0.055, 1.85);
  sideWindGeo.rotateX(-Math.PI / 2);
  const sideWindMat = new THREE.MeshBasicMaterial({
    map: windRibbonTex,
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 14 crisp razor-thin slipstream wisps streaming past the left & right flanks of the car
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const m = new THREE.Mesh(sideWindGeo, sideWindMat);
    const xOffset = side * (1.16 + (i % 4) * 0.14);
    const yOffset = 0.35 + (i % 5) * 0.16;
    const zPos = -2.4 + Math.random() * 8.4;
    m.position.set(xOffset, yOffset, zPos);
    playerMesh.add(m);
    sideWindStreaks.push({ mesh: m, baseX: xOffset, baseY: yOffset, phase: i * 0.9 });
  }

  let lastWindUpdateSec = 0;
  function updateCarWindWaves(timeSec, currentSpeed, isBoosting, isBraking) {
    const wdt = Math.min(0.05, Math.max(0.001, timeSec - lastWindUpdateSec));
    lastWindUpdateSec = timeSec;

    const speedNorm = Math.max(0, Math.min(1, (currentSpeed - 350) / 550));
    const targetOpacity = isBraking ? 0.04 : isBoosting ? 0.65 : 0.14 + speedNorm * 0.36;
    sideWindMat.opacity += (targetOpacity - sideWindMat.opacity) * 0.18;
    sideWindMat.color.setHex(isBoosting ? 0xbae6fd : 0xf8fafc);

    const flowSpeed = 16 + speedNorm * 22 + (isBoosting ? 14 : 0);
    for (const s of sideWindStreaks) {
      s.mesh.position.z += flowSpeed * wdt;
      s.mesh.position.y = s.baseY + Math.sin(timeSec * 10 + s.phase) * 0.03;
      s.mesh.scale.z = 0.75 + speedNorm * 0.8 + (isBoosting ? 0.65 : 0);
      if (s.mesh.position.z > 6.2) {
        s.mesh.position.z = -2.8 - Math.random() * 1.4;
      }
    }
  }

  // Crisp Peripheral Highway Speed Lines (along outer edges, keeping road lanes unobstructed)
  const speedStreaks = [];
  const streakGeo = new THREE.PlaneGeometry(0.05, 3.8);
  streakGeo.rotateX(-Math.PI / 2);
  const streakMat = new THREE.MeshBasicMaterial({
    map: windRibbonTex,
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Mesh(streakGeo, streakMat);
    const side = i % 2 === 0 ? -1 : 1;
    s.position.set(side * (4.6 + Math.random() * 5.2), 0.6 + Math.random() * 3.4, 10 - Math.random() * 90);
    scene.add(s);
    speedStreaks.push({ mesh: s, phase: Math.random() * Math.PI * 2, baseX: s.position.x, baseY: s.position.y });
  }

  // 3D Collectible Metallic Gold Coin Geometry & Material
  const coinGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.14, 20);
  coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.16 });

  // ---------------------------------------------------------------------------
  // Game State
  // ---------------------------------------------------------------------------
  let selectedMode = "easy";
  let selectedRoad = "neon";
  let state = "menu"; // menu | playing | paused | crashing | gameover

  let player = {
    lane: 1,
    x: 0,
    w: 1.95,
    len: 4.2,
    tilt: 0,
    boosting: false,
    braking: false,
  };

  let speed = 0;
  let score = 0;
  let distanceMeters = 0;
  let nearMisses = 0;
  let elapsedTime = 0;
  let spawnTimer = 0;
  let crashTimer = 0;
  let shakeTime = 0;

  let traffic = [];
  let coins = [];
  let particles = [];
  let coinTimer = 0;
  let coinsCollected = 0;
  let coinCombo = 0;
  let comboTimer = 0;
  let level = 1;
  let nextLevelDist = 500;
  let lastFrameTime = 0;

  const MP_FINISH_METERS = 10000;
  const MP_MAX_SECONDS = 240; // 4:00 max multiplayer match length

  // Online Multiplayer (WSS Pub/Sub via MQTT over WebSockets — works across all mobile/WiFi networks)
  const mp = {
    active: false,
    isHost: false,
    client: null,
    connected: false,
    roomCode: "",
    syncTimer: 0,
    joinRetryTimer: null,
    joinTimeoutTimer: null,
    resultReason: "",
    friend: {
      x: 0,
      targetX: 0,
      tilt: 0,
      score: 0,
      coins: 0,
      alive: true,
    },
  };

  function sendMp(payload) {
    if (!mp.client || !mp.client.connected || !mp.roomCode) return;
    const channel = mp.isHost ? "host" : "guest";
    try {
      mp.client.publish(`turbolane3/room/${mp.roomCode}/${channel}`, JSON.stringify(payload));
    } catch {
      // Ignore transient publish errors
    }
  }

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
      // Ignore storage errors
    }
  }

  // ---------------------------------------------------------------------------
  // Responsive Resize
  // ---------------------------------------------------------------------------
  function resizeRenderer() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Slightly wider FOV on narrow portrait mobile screens so all 3 lanes stay clear
    camera.fov = w < 520 ? 72 : 60;
    camera.updateProjectionMatrix();
  }

  function getLaneCenterX(laneIndex) {
    return LANE_CENTERS[laneIndex];
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
    menuSoundBtn.textContent = sfx.enabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    btnSound.textContent = sfx.enabled ? "🔊" : "🔇";
  }

  function showCallout(text) {
    calloutEl.textContent = text;
    calloutEl.classList.remove("hidden");
    calloutEl.style.animation = "none";
    void calloutEl.offsetWidth;
    calloutEl.style.animation = "";
    clearTimeout(showCallout._tid);
    showCallout._tid = setTimeout(() => calloutEl.classList.add("hidden"), 700);
  }

  function clearTrafficAndParticles() {
    for (const car of traffic) scene.remove(car.mesh);
    for (const coin of coins) scene.remove(coin.mesh);
    for (const p of particles) scene.remove(p.mesh);
    traffic = [];
    coins = [];
    particles = [];
  }

  // ---------------------------------------------------------------------------
  // Game Lifecycle
  // ---------------------------------------------------------------------------
  function runCountdown() {
    if (!countdownEl) return;
    clearTimeout(runCountdown._t1);
    clearTimeout(runCountdown._t2);
    clearTimeout(runCountdown._t3);
    clearTimeout(runCountdown._t4);
    const showStep = (txt, isGo) => {
      countdownEl.textContent = txt;
      countdownEl.classList.toggle("go", Boolean(isGo));
      countdownEl.classList.remove("hidden");
      countdownEl.style.animation = "none";
      void countdownEl.offsetWidth;
      countdownEl.style.animation = "";
      sfx.playCountdown(Boolean(isGo));
    };
    showStep("3", false);
    runCountdown._t1 = setTimeout(() => showStep("2", false), 420);
    runCountdown._t2 = setTimeout(() => showStep("1", false), 840);
    runCountdown._t3 = setTimeout(() => showStep("GO!", true), 1260);
    runCountdown._t4 = setTimeout(() => countdownEl.classList.add("hidden"), 1750);
  }

  function startGame(isMultiplayer = false) {
    sfx.ensureContext();
    mp.active = Boolean(isMultiplayer);
    const mode = MODES[selectedMode];

    clearTrafficAndParticles();
    applyRoadTheme(selectedRoad);
    finishArch.visible = false;
    hudProgressFill.style.width = "0%";

    state = "playing";
    player.lane = mp.active ? (mp.isHost ? 0 : 2) : 1;
    player.x = getLaneCenterX(player.lane);
    player.tilt = 0;
    player.boosting = false;
    player.braking = false;
    playerMesh.position.set(player.x, 0, 0);
    playerMesh.rotation.set(0, 0, 0);

    if (mp.active) {
      mp.resultReason = "";
      mp.friend.alive = true;
      mp.friend.score = 0;
      mp.friend.coins = 0;
      mp.friend.x = getLaneCenterX(mp.isHost ? 2 : 0);
      mp.friend.targetX = mp.friend.x;
      mp.friend.tilt = 0;
      mp.syncTimer = 0;
      friendMesh.visible = true;
      friendMesh.position.set(mp.friend.x, 0, -1.6);
      hudFriendStat.classList.remove("hidden");
      hudFriendScore.textContent = "🪙 0";
    } else {
      friendMesh.visible = false;
      hudFriendStat.classList.add("hidden");
    }

    speed = mode.baseSpeed;
    score = 0;
    distanceMeters = 0;
    nearMisses = 0;
    elapsedTime = 0;
    spawnTimer = 0.45;
    coinTimer = 0.7;
    coinsCollected = 0;
    coinCombo = 0;
    comboTimer = 0;
    hudCoins.textContent = "🪙 0";
    level = 1;
    nextLevelDist = 500;
    crashTimer = 0;
    shakeTime = 0;

    hudModeBadge.textContent = mode.label.toUpperCase();
    hudModeBadge.className = `badge ${mode.badgeClass}`.trim();
    hudBest.textContent = getBestScore(selectedMode).toLocaleString();

    screenMenu.classList.add("hidden");
    screenPause.classList.add("hidden");
    screenGameover.classList.add("hidden");
    if (screenMulti) screenMulti.classList.add("hidden");
    hud.classList.remove("hidden");
    touchControls.classList.remove("hidden");
    const isExtreme = selectedMode === "extreme";
    touchBrake.classList.toggle("hidden", !isExtreme);
    desktopBrakeBtn.classList.toggle("hidden", !isExtreme);
    sfx.startMusic(selectedMode);
    runCountdown();
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
    mp.active = false;
    friendMesh.visible = false;
    hudFriendStat.classList.add("hidden");
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
    shakeTime = 0.48;
    player.boosting = false;
    player.braking = false;
    sfx.stopMusic();
    sfx.playCrash();
    if (mp.active) {
      sendMp({ type: "crash", score: Math.floor(score), coins: coinsCollected });
    }

    const cx = (player.x + hitCar.x) / 2;
    const cz = hitCar.z / 2;
    const sparkGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const sparkColors = [0xff3d71, 0xfbbf24, 0xf97316, 0xffffff];

    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(sparkGeo, mat);
      mesh.position.set(cx, 0.8, cz);
      scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 14;
      particles.push({
        mesh,
        mat,
        vx: Math.cos(angle) * spd,
        vy: 4 + Math.random() * 10,
        vz: Math.sin(angle) * spd,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
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

    const overTag = screenGameover.querySelector(".crash-tag");
    const overTitle = screenGameover.querySelector("h2");
    const overSub = screenGameover.querySelector(".subtitle");

    if (mp.active) {
      const fScore = Math.floor(mp.friend.score);
      const myCoins = coinsCollected;
      const fCoins = mp.friend.coins || 0;
      if (mp.resultReason === "coins_win") {
        overTag.textContent = `🪙 ${MP_FINISH_METERS}m FINISH!`;
        overTitle.textContent = "YOU WIN!";
        overSub.textContent = `You collected more coins under ${MP_FINISH_METERS}m!`;
        overMpResult.textContent = `🏆 YOU WIN! (🪙 ${myCoins} vs 🪙 ${fCoins})`;
      } else if (mp.resultReason === "coins_loss") {
        overTag.textContent = `🪙 ${MP_FINISH_METERS}m FINISH!`;
        overTitle.textContent = "2ND PLACE";
        overSub.textContent = `Your friend collected more coins under ${MP_FINISH_METERS}m!`;
        overMpResult.textContent = `🥈 FRIEND WINS! (🪙 ${myCoins} vs 🪙 ${fCoins})`;
      } else if (mp.resultReason === "coins_draw") {
        overTag.textContent = `🪙 ${MP_FINISH_METERS}m FINISH!`;
        overTitle.textContent = "TIE GAME!";
        overSub.textContent = `Both collected ${myCoins} coins!`;
        overMpResult.textContent = `🤝 DRAW! (🪙 ${myCoins} vs 🪙 ${fCoins} • Score ${finalScore} vs ${fScore})`;
      } else if (mp.resultReason === "friend_crashed") {
        overTag.textContent = "🏆 VICTORY!";
        overTitle.textContent = "YOU WIN!";
        overSub.textContent = "Your friend crashed first!";
        overMpResult.textContent = `🏆 YOU SURVIVED! (Coins: 🪙 ${myCoins} vs 🪙 ${fCoins})`;
      } else {
        overTag.textContent = "CRASHED!";
        overTitle.textContent = "RACE FAILED";
        overSub.textContent = "You hit another vehicle.";
        overMpResult.textContent = `🥈 FRIEND WINS! (Coins: 🪙 ${myCoins} vs 🪙 ${fCoins})`;
      }
      overMpResult.classList.remove("hidden");
    } else {
      overTag.textContent = "CRASHED!";
      overTitle.textContent = "RACE FAILED";
      overSub.textContent = "You hit another vehicle.";
      overMpResult.classList.add("hidden");
    }

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
      player.tilt = -dir * 0.16;
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
    const multiOpen = screenMulti && !screenMulti.classList.contains("hidden");
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || feedbackOpen || multiOpen) {
      if (e.key === "Escape" && feedbackOpen) closeFeedback();
      if (e.key === "Escape" && multiOpen) closeMultiLobby();
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
      applyRoadTheme(selectedRoad);
      updateMenuUI();
    });
  });

  paintDotBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const hex = Number(btn.dataset.color);
      paintDotBtns.forEach((b) => b.classList.toggle("active", b === btn));
      if (playerMesh.userData && playerMesh.userData.bodyMat) {
        playerMesh.userData.bodyMat.color.setHex(hex);
      }
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
  document.getElementById("btn-start").addEventListener("click", () => startGame(false));
  document.getElementById("btn-resume").addEventListener("click", resumeGame);
  document.getElementById("btn-restart-pause").addEventListener("click", () => startGame(mp.active));
  document.getElementById("btn-menu-pause").addEventListener("click", goToMenu);
  document.getElementById("btn-retry").addEventListener("click", () => {
    if (mp.active && mp.isHost) {
      sendMp({ type: "start", mode: selectedMode, road: selectedRoad });
      startGame(true);
    } else if (mp.active && !mp.isHost) {
      sendMp({ type: "rematch_request" });
      overMpResult.textContent = "⏳ Rematch requested! Waiting for Host...";
    } else {
      startGame(false);
    }
  });
  document.getElementById("btn-menu-over").addEventListener("click", goToMenu);

  // ---------------------------------------------------------------------------
  // Online Multiplayer Lobby (WebSocket Relay — works on 4G/5G/WiFi)
  // ---------------------------------------------------------------------------
  const screenMulti = document.getElementById("screen-multi");
  const mpHostIdle = document.getElementById("mp-host-idle");
  const mpHostActive = document.getElementById("mp-host-active");
  const mpRoomCodeEl = document.getElementById("mp-room-code");
  const mpJoinInput = document.getElementById("mp-join-input");
  const mpStatusEl = document.getElementById("mp-status");
  const btnMpCreate = document.getElementById("btn-mp-create");
  const btnMpCopyLink = document.getElementById("btn-mp-copy-link");
  const btnMpJoin = document.getElementById("btn-mp-join");
  const btnMpStart = document.getElementById("btn-mp-start");

  const WSS_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
  ];

  function setMpStatus(msg) {
    mpStatusEl.textContent = msg;
    mpStatusEl.classList.remove("hidden");
  }

  function openMultiLobby() {
    screenMenu.classList.add("hidden");
    screenMulti.classList.remove("hidden");
  }

  function closeMultiLobby() {
    screenMulti.classList.add("hidden");
    screenMenu.classList.remove("hidden");
  }

  function clearMpTimers() {
    if (mp.joinRetryTimer) {
      clearInterval(mp.joinRetryTimer);
      mp.joinRetryTimer = null;
    }
    if (mp.joinTimeoutTimer) {
      clearTimeout(mp.joinTimeoutTimer);
      mp.joinTimeoutTimer = null;
    }
  }

  function cleanupMpClient() {
    clearMpTimers();
    mp.connected = false;
    if (mp.client) {
      try {
        mp.client.end(true);
      } catch {
        // Ignore cleanup errors
      }
      mp.client = null;
    }
  }

  function spawnSyncedTraffic(items) {
    items.forEach((item) => {
      const template = VEHICLE_TYPES.find((v) => v.kind === item.kind) || VEHICLE_TYPES[0];
      const mesh = createVehicleMesh(template.kind, item.color, false);
      const x = getLaneCenterX(item.lane);
      mesh.position.set(x, 0, SPAWN_Z);
      scene.add(mesh);
      traffic.push({
        mesh,
        kind: template.kind,
        lane: item.lane,
        targetLane: item.lane,
        x,
        z: SPAWN_Z,
        w: template.w,
        len: template.len,
        speedFactor: template.speedFactor,
        canLaneChange: false,
        changedLane: false,
        nearMissed: false,
      });
    });
  }

  function spawnSyncedCoin(laneIdx) {
    const mesh = new THREE.Mesh(coinGeo, coinMat);
    const x = getLaneCenterX(laneIdx);
    mesh.position.set(x, 1.05, SPAWN_Z);
    scene.add(mesh);
    coins.push({ mesh, x, z: SPAWN_Z });
  }

  function handleMpMessage(data) {
    if (!data || !data.type) return;
    if (data.type === "hello" && mp.isHost) {
      mp.connected = true;
      sendMp({ type: "welcome" });
      setMpStatus("✅ Friend connected! Click START MULTIPLAYER RACE.");
      btnMpStart.classList.remove("hidden");
    } else if (data.type === "welcome" && !mp.isHost) {
      mp.connected = true;
      clearMpTimers();
      setMpStatus("✅ Connected to Host! Waiting for Host to start...");
    } else if (data.type === "start") {
      selectedMode = data.mode || selectedMode;
      selectedRoad = data.road || selectedRoad;
      updateMenuUI();
      startGame(true);
    } else if (data.type === "spawn" && !mp.isHost) {
      spawnSyncedTraffic(data.items || []);
    } else if (data.type === "coin" && !mp.isHost) {
      spawnSyncedCoin(data.lane);
    } else if (data.type === "state") {
      mp.friend.targetX = data.x;
      mp.friend.tilt = data.tilt || 0;
      mp.friend.score = data.score || 0;
      if (typeof data.coins === "number") mp.friend.coins = data.coins;
      mp.friend.alive = data.alive !== false;
      hudFriendScore.textContent = `🪙 ${mp.friend.coins}`;
    } else if (data.type === "crash") {
      mp.friend.alive = false;
      mp.friend.score = data.score || mp.friend.score;
      if (typeof data.coins === "number") mp.friend.coins = data.coins;
      friendMesh.visible = false;
      hudFriendScore.textContent = `🪙 ${mp.friend.coins} 💥`;
      if (state === "playing") {
        mp.resultReason = "friend_crashed";
        sfx.stopMusic();
        sfx.playLevelUp();
        finishGameOver();
      }
    } else if (data.type === "finish") {
      mp.friend.score = data.score || mp.friend.score;
      if (typeof data.coins === "number") mp.friend.coins = data.coins;
      hudFriendScore.textContent = `🪙 ${mp.friend.coins} 🏁`;
      if (state === "playing") {
        if (coinsCollected > mp.friend.coins) mp.resultReason = "coins_win";
        else if (coinsCollected < mp.friend.coins) mp.resultReason = "coins_loss";
        else if (Math.floor(score) > Math.floor(mp.friend.score)) mp.resultReason = "coins_win";
        else if (Math.floor(score) < Math.floor(mp.friend.score)) mp.resultReason = "coins_loss";
        else mp.resultReason = "coins_draw";
        sfx.stopMusic();
        if (mp.resultReason === "coins_win") sfx.playLevelUp();
        finishGameOver();
      }
    } else if (data.type === "rematch_request" && mp.isHost) {
      overMpResult.textContent = "🔄 Friend wants a rematch! Click RACE AGAIN.";
    }
  }

  function connectWssRoom(brokerIdx = 0) {
    if (typeof mqtt === "undefined") {
      setMpStatus("⏳ Loading multiplayer, retrying...");
      setTimeout(() => connectWssRoom(brokerIdx), 700);
      return;
    }

    cleanupMpClient();
    const url = WSS_BROKERS[brokerIdx] || WSS_BROKERS[0];
    const client = mqtt.connect(url, {
      clientId: `tl3_${mp.isHost ? "h" : "g"}_${Math.random().toString(36).slice(2, 8)}`,
      connectTimeout: 9000,
      reconnectPeriod: 2000,
      clean: true,
    });
    mp.client = client;

    client.on("connect", () => {
      const listenChannel = mp.isHost ? "guest" : "host";
      client.subscribe(`turbolane3/room/${mp.roomCode}/${listenChannel}`, (err) => {
        if (err) {
          setMpStatus("⚠️ Could not subscribe to room. Try again.");
          return;
        }
        if (mp.isHost) {
          setMpStatus(`⏳ Waiting for friend to join room ${mp.roomCode}...`);
        } else {
          setMpStatus(`⏳ Connecting to room ${mp.roomCode}... (make sure Host keeps tab open)`);
          sendMp({ type: "hello" });
          if (!mp.joinRetryTimer) {
            mp.joinRetryTimer = setInterval(() => {
              if (!mp.connected) sendMp({ type: "hello" });
            }, 1200);
          }
          if (!mp.joinTimeoutTimer) {
            mp.joinTimeoutTimer = setTimeout(() => {
              if (!mp.connected) {
                clearMpTimers();
                setMpStatus(`⚠️ Host did not reply for room ${mp.roomCode}. Make sure Host stays on the game tab!`);
              }
            }, 35000);
          }
        }
      });
    });

    client.on("message", (_topic, payload) => {
      try {
        handleMpMessage(JSON.parse(payload.toString()));
      } catch {
        // Ignore malformed packets
      }
    });

    client.on("error", () => {
      if (!mp.connected && brokerIdx + 1 < WSS_BROKERS.length) {
        connectWssRoom(brokerIdx + 1);
      } else if (!mp.connected) {
        setMpStatus("⚠️ Network error connecting to room. Please try again.");
      }
    });
  }

  function createRoom() {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    mp.roomCode = code;
    mp.isHost = true;
    mpHostIdle.classList.add("hidden");
    mpHostActive.classList.remove("hidden");
    btnMpStart.classList.add("hidden");
    mpRoomCodeEl.textContent = code;
    setMpStatus("⏳ Creating room...");
    connectWssRoom(0);
  }

  function extractRoomCode(raw) {
    const val = String(raw || "").trim();
    if (!val) return "";
    const match = val.match(/[?&]room=([A-Za-z0-9_-]+)/i);
    if (match) return match[1].toUpperCase();
    return val.replace(/\s+/g, "").toUpperCase();
  }

  function joinRoom(rawCode) {
    const code = extractRoomCode(rawCode || mpJoinInput.value);
    if (!code) {
      setMpStatus("⚠️ Please enter the Room Code.");
      return;
    }
    mpJoinInput.value = code;
    mp.roomCode = code;
    mp.isHost = false;
    setMpStatus(`⏳ Joining room ${code}...`);
    connectWssRoom(0);
  }

  document.getElementById("btn-multiplayer").addEventListener("click", openMultiLobby);
  document.getElementById("btn-mp-close").addEventListener("click", closeMultiLobby);
  btnMpCreate.addEventListener("click", createRoom);
  btnMpJoin.addEventListener("click", () => joinRoom());
  mpJoinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      joinRoom();
    }
  });
  btnMpStart.addEventListener("click", () => {
    if (!mp.isHost || !mp.connected) return;
    sendMp({ type: "start", mode: selectedMode, road: selectedRoad });
    startGame(true);
  });
  btnMpCopyLink.addEventListener("click", async () => {
    if (!mp.roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${mp.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      btnMpCopyLink.textContent = "✓ INVITE LINK COPIED!";
    } catch {
      btnMpCopyLink.textContent = url;
    }
    setTimeout(() => {
      btnMpCopyLink.textContent = "🔗 COPY INVITE LINK";
    }, 2200);
  });

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
  const btnFbSubmit = document.getElementById("btn-fb-submit");

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

  window.addEventListener("resize", resizeRenderer);

  // ---------------------------------------------------------------------------
  // Traffic Spawner (3D Z-space with guaranteed minimum overtake gap)
  // ---------------------------------------------------------------------------
  function spawnTraffic() {
    const mode = MODES[selectedMode];
    const lanes = [0, 1, 2];
    const minSameLaneGap = 28;
    const minOvertakeGap = 26;

    const clearLanes = lanes.filter((laneIdx) => {
      return !traffic.some((c) => (c.lane === laneIdx || c.targetLane === laneIdx) && c.z < SPAWN_Z + minSameLaneGap);
    });
    if (clearLanes.length === 0) return;

    const occupiedInWindow = lanes.filter((l) =>
      traffic.some((c) => (c.lane === l || c.targetLane === l) && c.z < SPAWN_Z + minOvertakeGap)
    );
    if (occupiedInWindow.length >= 2) return;

    // Never pick a lane that would close the last open lane in the overtake window
    const safeLanes = clearLanes.filter((candidateLane) => {
      const wouldBeOccupied = new Set(occupiedInWindow);
      wouldBeOccupied.add(candidateLane);
      return wouldBeOccupied.size <= 2;
    });
    if (safeLanes.length === 0) return;

    const firstLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
    const chosen = [firstLane];

    if (safeLanes.length >= 2 && occupiedInWindow.length === 0 && Math.random() < mode.doubleSpawnChance) {
      const remaining = safeLanes.filter((l) => l !== firstLane);
      chosen.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }

    const spawnedItems = [];
    chosen.forEach((laneIdx) => {
      const template = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
      const color = template.colors[Math.floor(Math.random() * template.colors.length)];
      const mesh = createVehicleMesh(template.kind, color, false);
      const x = getLaneCenterX(laneIdx);
      mesh.position.set(x, 0, SPAWN_Z);
      scene.add(mesh);

      traffic.push({
        mesh,
        kind: template.kind,
        lane: laneIdx,
        targetLane: laneIdx,
        x,
        z: SPAWN_Z,
        w: template.w,
        len: template.len,
        speedFactor: template.speedFactor,
        canLaneChange: Math.random() < mode.laneChangeChance,
        changedLane: false,
        nearMissed: false,
      });
      spawnedItems.push({ lane: laneIdx, kind: template.kind, color });
    });

    if (mp.active && mp.isHost && spawnedItems.length > 0) {
      sendMp({ type: "spawn", items: spawnedItems });
    }
  }

  // ---------------------------------------------------------------------------
  // Update Loop
  // ---------------------------------------------------------------------------
  function update(dt) {
    const mode = MODES[selectedMode];

    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
    }

    // Update 3D crash particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy -= 22 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.15, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += 6 * dt;
      p.mesh.rotation.y += 6 * dt;
      p.life -= dt;
      p.mat.opacity = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
      }
    }

    if (state === "crashing") {
      crashTimer -= dt;
      if (crashTimer <= 0) {
        finishGameOver();
      }
      return;
    }

    // Live 3D Attract-Mode Demo Race on Menu
    if (state === "menu") {
      const demoSpeed3D = 26;
      const demoTime = performance.now() * 0.001;
      for (const dash of laneDashes) {
        dash.position.z += demoSpeed3D * dt;
        if (dash.position.z > 20) dash.position.z -= DASH_COUNT * DASH_STEP;
      }
      for (const prop of propItems) {
        prop.position.z += demoSpeed3D * dt;
        if (prop.position.z > 22) prop.position.z -= 18 * 11;
      }
      asphaltTex.offset.y = (asphaltTex.offset.y + demoSpeed3D * dt * 0.1) % 1;
      terrainTex.offset.y = (terrainTex.offset.y + demoSpeed3D * dt * 0.1) % 1;
      updateWorldScenery(demoSpeed3D, dt);
      for (const s of speedStreaks) {
        s.mesh.position.z += demoSpeed3D * 1.55 * dt;
        s.mesh.position.y = s.baseY + Math.sin(demoTime * 6 + s.phase) * 0.16;
        if (s.mesh.position.z > 16) s.mesh.position.z -= 95;
      }
      updateCarWindWaves(demoTime, 460, false, false);

      // Spawn & move demo traffic
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTraffic();
        spawnTimer = 0.95;
      }
      for (let i = traffic.length - 1; i >= 0; i--) {
        const car = traffic[i];
        car.z += demoSpeed3D * 0.74 * dt;
        car.mesh.position.set(car.x, 0, car.z);
        if (car.mesh.userData && car.mesh.userData.wheels) {
          for (const w of car.mesh.userData.wheels) w.rotation.x -= demoSpeed3D * 0.45 * dt;
        }
        if (car.z > DESPAWN_Z) {
          scene.remove(car.mesh);
          traffic.splice(i, 1);
        }
      }

      // AI auto-dodge for demo player car
      const blockedAhead = traffic.some(
        (c) => c.targetLane === player.lane && c.z > -38 && c.z < 5
      );
      if (blockedAhead) {
        const safeDemoLane = [0, 1, 2].find(
          (l) => !traffic.some((c) => c.targetLane === l && c.z > -40 && c.z < 6)
        );
        if (safeDemoLane !== undefined && safeDemoLane !== player.lane) {
          player.tilt = safeDemoLane > player.lane ? -0.14 : 0.14;
          player.lane = safeDemoLane;
        }
      }

      const targetX = getLaneCenterX(player.lane);
      player.x += (targetX - player.x) * Math.min(1, dt * 10);
      player.tilt += (0 - player.tilt) * Math.min(1, dt * 8);
      playerMesh.position.set(player.x, Math.sin(demoTime * 22) * 0.02, 0);
      playerMesh.rotation.set(0, player.tilt * 0.4, player.tilt);
      if (playerMesh.userData && playerMesh.userData.wheels) {
        for (const w of playerMesh.userData.wheels) w.rotation.x -= demoSpeed3D * dt * 1.5;
      }

      camera.position.set(player.x * 0.35 + Math.sin(demoTime * 0.6) * 0.8, 4.7, 9.2);
      camera.lookAt(player.x * 0.5, 1.1, -18);
      return;
    }

    if (state !== "playing") return;

    elapsedTime += dt;

    // Speed progression + nitro boost / extreme-mode brake
    const baseTarget = Math.min(mode.maxSpeed, mode.baseSpeed + elapsedTime * mode.accelPerSec);
    let activeSpeed = baseTarget;
    if (player.braking) {
      activeSpeed = baseTarget * 0.50;
    } else if (player.boosting) {
      activeSpeed = baseTarget * 1.32;
    }
    const lerpRate = player.braking ? 9 : 6;
    speed += (activeSpeed - speed) * Math.min(1, dt * lerpRate);
    const speed3D = speed * SPEED_TO_3D;

    // Smooth player lane interpolation, suspension bounce & 3D tilt
    const targetX = getLaneCenterX(player.lane);
    player.x += (targetX - player.x) * Math.min(1, dt * 15);
    player.tilt += (0 - player.tilt) * Math.min(1, dt * 10);
    playerMesh.position.x = player.x;
    playerMesh.position.y = Math.sin(elapsedTime * 28) * 0.025;
    playerMesh.rotation.z = player.tilt;
    playerMesh.rotation.y = player.tilt * 0.45;
    const targetPitch = player.boosting ? 0.04 : player.braking ? -0.05 : 0;
    playerMesh.rotation.x += (targetPitch - playerMesh.rotation.x) * Math.min(1, dt * 10);

    // Spin player wheels & animate brake lights / nitro flames
    const ud = playerMesh.userData;
    if (ud && ud.wheels) {
      for (const w of ud.wheels) w.rotation.x -= speed3D * dt * 1.6;
    }
    if (ud && ud.tailMat) {
      ud.tailMat.color.setHex(player.braking ? 0xff1744 : 0xff2a55);
      const scale = player.braking ? 1.45 : 1;
      ud.tlL.scale.set(scale, scale, 1);
      ud.tlR.scale.set(scale, scale, 1);
      const showFlames = player.boosting && !player.braking;
      ud.flameL.visible = showFlames;
      ud.flameR.visible = showFlames;
      if (showFlames) {
        const fScale = 0.85 + Math.random() * 0.45;
        ud.flameL.scale.set(1, 1, fScale);
        ud.flameR.scale.set(1, 1, fScale);
      }
    }

    // Dynamic 3D chase camera
    const baseFov = window.innerWidth < 520 ? 72 : 60;
    const targetFov = player.boosting ? baseFov + 7 : player.braking ? baseFov - 4 : baseFov;
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 8);
    camera.updateProjectionMatrix();

    const shakeX = shakeTime > 0 ? (Math.random() - 0.5) * shakeTime * 1.4 : 0;
    const shakeY = shakeTime > 0 ? (Math.random() - 0.5) * shakeTime * 1.4 : 0;
    camera.position.set(player.x * 0.45 + shakeX, 4.7 + shakeY, 9.0);
    camera.lookAt(player.x * 0.65, 1.1, -18);

    // Scroll 3D asphalt texture, terrain texture, lane dashes, roadside props & speed streaks
    asphaltTex.offset.y = (asphaltTex.offset.y + speed3D * dt * 0.1) % 1;
    terrainTex.offset.y = (terrainTex.offset.y + speed3D * dt * 0.1) % 1;
    for (const dash of laneDashes) {
      dash.position.z += speed3D * dt;
      if (dash.position.z > 20) dash.position.z -= DASH_COUNT * DASH_STEP;
    }
    for (const prop of propItems) {
      prop.position.z += speed3D * dt;
      if (prop.position.z > 22) prop.position.z -= 18 * 11;
    }
    updateWorldScenery(speed3D, dt);
    updateCarWindWaves(elapsedTime, speed, player.boosting, player.braking);
    const speedRatio = Math.max(0, Math.min(1, (speed - 350) / 550));
    const streakSpeed = speed3D * (player.boosting ? 2.4 : 1.5 + speedRatio * 0.6);
    streakMat.opacity = player.braking ? 0.06 : player.boosting ? 0.45 : 0.14 + speedRatio * 0.24;
    for (const s of speedStreaks) {
      s.mesh.position.z += streakSpeed * dt;
      s.mesh.position.y = s.baseY + Math.sin(elapsedTime * 8 + s.phase) * 0.22;
      s.mesh.scale.z = 0.8 + speedRatio * 0.9 + (player.boosting ? 0.6 : 0);
      if (s.mesh.position.z > 16) s.mesh.position.z -= 95;
    }

    // Score, Distance & 500m Level-Up Milestones (1000m Finish Line in Multiplayer)
    const boostMult = player.boosting ? 1.5 : 1;
    score += dt * 28 * mode.scoreMult * boostMult;
    distanceMeters += (speed * dt) / 16;

    if (mp.active) {
      const timeLeft = Math.max(0, Math.ceil(MP_MAX_SECONDS - elapsedTime));
      const mins = Math.floor(timeLeft / 60);
      const secs = String(timeLeft % 60).padStart(2, "0");
      hudModeBadge.textContent = `${Math.floor(distanceMeters)}/${MP_FINISH_METERS}m • ${mins}:${secs}`;

      const pct = Math.min(100, (distanceMeters / MP_FINISH_METERS) * 100);
      hudProgressFill.style.width = `${pct}%`;
      const metersLeft = MP_FINISH_METERS - distanceMeters;
      if (metersLeft <= 130 && metersLeft > -15) {
        finishArch.visible = true;
        finishArch.position.z = -metersLeft * 1.1;
      } else {
        finishArch.visible = false;
      }

      if (distanceMeters >= MP_FINISH_METERS || elapsedTime >= MP_MAX_SECONDS) {
        if (coinsCollected > mp.friend.coins) mp.resultReason = "coins_win";
        else if (coinsCollected < mp.friend.coins) mp.resultReason = "coins_loss";
        else if (Math.floor(score) > Math.floor(mp.friend.score)) mp.resultReason = "coins_win";
        else if (Math.floor(score) < Math.floor(mp.friend.score)) mp.resultReason = "coins_loss";
        else mp.resultReason = "coins_draw";
        sendMp({ type: "finish", score: Math.floor(score), coins: coinsCollected });
        sfx.stopMusic();
        if (mp.resultReason === "coins_win") sfx.playLevelUp();
        finishGameOver();
        return;
      }
    } else {
      const stagePct = ((distanceMeters % 500) / 500) * 100;
      hudProgressFill.style.width = `${stagePct}%`;
    }
    if (distanceMeters >= nextLevelDist) {
      level += 1;
      nextLevelDist += 500;
      sfx.playLevelUp();
      showCallout(`🏁 LEVEL ${level} — HYPER DRIVE!`);
    }

    // Collectible 3D Turbo Coins
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) coinCombo = 0;
    }
    if (!mp.active || mp.isHost) {
      coinTimer -= dt;
      if (coinTimer <= 0) {
        coinTimer = mp.active ? 0.72 + Math.random() * 0.45 : 1.1 + Math.random() * 0.75;
        const openCoinLanes = [0, 1, 2].filter(
          (l) => !traffic.some((c) => (c.lane === l || c.targetLane === l) && c.z < SPAWN_Z + 18)
        );
        if (openCoinLanes.length > 0) {
          const laneIdx = openCoinLanes[Math.floor(Math.random() * openCoinLanes.length)];
          spawnSyncedCoin(laneIdx);
          if (mp.active && mp.isHost) {
            sendMp({ type: "coin", lane: laneIdx });
          }
        }
      }
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.z += speed3D * 0.86 * dt;
      coin.mesh.position.z = coin.z;
      coin.mesh.position.y = 1.05 + Math.sin(elapsedTime * 5 + coin.z * 0.2) * 0.18;
      coin.mesh.rotation.y += 4.5 * dt;

      if (Math.abs(player.x - coin.x) < 1.45 && Math.abs(coin.z) < 2.6) {
        coinsCollected += 1;
        hudCoins.textContent = `🪙 ${coinsCollected}`;
        coinCombo = Math.min(5, coinCombo + 1);
        comboTimer = 3.5;
        const pts = Math.round(75 * coinCombo * mode.scoreMult);
        score += pts;
        sfx.playCoin();
        showCallout(coinCombo > 1 ? `+${pts} COIN x${coinCombo}!` : `+${pts} COIN!`);
        // Golden sparkle burst
        const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        for (let k = 0; k < 8; k++) {
          const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 1 });
          const m = new THREE.Mesh(sparkGeo, mat);
          m.position.set(coin.x, 1.0, 0);
          scene.add(m);
          const ang = Math.random() * Math.PI * 2;
          particles.push({
            mesh: m,
            mat,
            vx: Math.cos(ang) * 5,
            vy: 3 + Math.random() * 5,
            vz: Math.sin(ang) * 5,
            life: 0.35,
            maxLife: 0.35,
          });
        }
        scene.remove(coin.mesh);
        coins.splice(i, 1);
        continue;
      }
      if (coin.z > DESPAWN_Z) {
        scene.remove(coin.mesh);
        coins.splice(i, 1);
      }
    }

    // Spawning (In multiplayer, only Host spawns & broadcasts traffic)
    if (!mp.active || mp.isHost) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTraffic();
        const dynamicInterval = Math.max(
          mode.minSpawnInterval,
          mode.spawnInterval - elapsedTime * mode.spawnRampPerSec
        );
        spawnTimer = dynamicInterval * (0.82 + Math.random() * 0.36);
      }
    }

    // Multiplayer live car sync
    if (mp.active) {
      mp.syncTimer += dt;
      if (mp.syncTimer >= 0.05) {
        mp.syncTimer = 0;
        sendMp({
          type: "state",
          x: player.x,
          tilt: player.tilt,
          score: Math.floor(score),
          coins: coinsCollected,
          alive: true,
        });
      }
      if (mp.friend.alive) {
        mp.friend.x += (mp.friend.targetX - mp.friend.x) * Math.min(1, dt * 14);
        friendMesh.position.set(mp.friend.x, Math.sin(elapsedTime * 28 + 1) * 0.025, -1.6);
        friendMesh.rotation.set(0, mp.friend.tilt * 0.45, mp.friend.tilt);
        if (friendMesh.userData && friendMesh.userData.wheels) {
          for (const w of friendMesh.userData.wheels) w.rotation.x -= speed3D * dt * 1.6;
        }
      }
    }

    // Traffic update, overtaking gaps & 3D collision check
    const minFollowGap = 12;
    const minLaneChangeGap = 25;
    const minOvertakeCorridor = 24;

    for (let i = traffic.length - 1; i >= 0; i--) {
      const car = traffic[i];
      // Uniform cruising pace keeps waves from catching up and forming a 3-lane wall
      let relSpeed3D = speed3D * 0.74;

      // Maintain following distance behind slower cars ahead in the same lane
      for (const ahead of traffic) {
        if (ahead === car || ahead.targetLane !== car.targetLane || ahead.z <= car.z) continue;
        const requiredDist = (car.len + ahead.len) * 0.5 + minFollowGap;
        if (ahead.z - car.z < requiredDist) {
          const aheadRelSpeed3D = speed3D * 0.74;
          relSpeed3D = Math.min(relSpeed3D, aheadRelSpeed3D);
        }
      }

      car.z += relSpeed3D * dt;

      // Occasional lane change in Hard / Extreme Hard
      if (car.canLaneChange && !car.changedLane && car.z > -95 && car.z < -45) {
        car.changedLane = true;
        const candidates = [car.lane - 1, car.lane + 1].filter((l) => l >= 0 && l <= 2);
        const safeTarget = candidates.find((targetL) => {
          const targetClear = !traffic.some(
            (other) => other !== car && other.targetLane === targetL && Math.abs(other.z - car.z) < minLaneChangeGap
          );
          if (!targetClear) return false;
          const thirdLane = [0, 1, 2].find((l) => l !== car.lane && l !== targetL);
          return !traffic.some(
            (other) => other !== car && other.targetLane === thirdLane && Math.abs(other.z - car.z) < minOvertakeCorridor
          );
        });
        if (safeTarget !== undefined) {
          car.targetLane = safeTarget;
        }
      }

      const carTargetX = getLaneCenterX(car.targetLane);
      car.x += (carTargetX - car.x) * Math.min(1, dt * 8);
      if (Math.abs(carTargetX - car.x) < 0.2) car.lane = car.targetLane;

      car.mesh.position.set(car.x, 0, car.z);
      if (car.mesh.userData && car.mesh.userData.wheels) {
        for (const w of car.mesh.userData.wheels) w.rotation.x -= speed3D * 0.45 * dt;
      }

      // Collision check (any hit = instant fail)
      if (
        Math.abs(player.x - car.x) < (player.w + car.w) * 0.42 &&
        Math.abs(car.z) < (player.len + car.len) * 0.42
      ) {
        triggerCrash(car);
        return;
      }

      // Near-miss bonus
      if (!car.nearMissed && car.z > 2.2 && car.z < 5.5 && Math.abs(car.x - player.x) < LANE_WIDTH * 1.15) {
        car.nearMissed = true;
        nearMisses += 1;
        score += 50 * mode.scoreMult;
        sfx.playNearMiss();
        showCallout(`+${Math.round(50 * mode.scoreMult)} NEAR MISS!`);
      }

      if (car.z > DESPAWN_Z) {
        scene.remove(car.mesh);
        traffic.splice(i, 1);
      }
    }

    hudScore.textContent = Math.floor(score).toLocaleString();
    hudSpeed.textContent = `${Math.round(speed * 0.28)} km/h`;
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000 || 0);
    lastFrameTime = now;
    update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------------------
  // Init & Splash Loading Sequence
  // ---------------------------------------------------------------------------
  resizeRenderer();
  applyRoadTheme(selectedRoad);
  updateMenuUI();
  lastFrameTime = performance.now();
  requestAnimationFrame(loop);

  const screenLoading = document.getElementById("screen-loading");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const loadingText = document.getElementById("loading-text");
  if (screenLoading && loadingBarFill) {
    setTimeout(() => {
      loadingBarFill.style.width = "45%";
      if (loadingText) loadingText.textContent = "Building 3D Highway...";
    }, 80);
    setTimeout(() => {
      loadingBarFill.style.width = "100%";
      if (loadingText) loadingText.textContent = "Ready to Race!";
    }, 420);
    setTimeout(() => {
      screenLoading.classList.add("fade-out");
      setTimeout(() => screenLoading.classList.add("hidden"), 480);
    }, 750);
  }

  // Auto-open & join if opened via ?room=CODE invite link
  const roomParam = new URLSearchParams(window.location.search).get("room");
  if (roomParam) {
    mpJoinInput.value = roomParam.toUpperCase();
    openMultiLobby();
    setTimeout(() => joinRoom(roomParam), 600);
  }
})();
