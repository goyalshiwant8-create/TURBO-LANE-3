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
      sky: 0x050814,
      fog: 0x070b1a,
      ground: 0x090e1c,
      shoulder: 0x111827,
      asphalt: 0x171d33,
      edgeLine: 0x00e5ff,
      laneDash: 0xff3d71,
      ambientColor: 0x6b7db3,
      ambientIntensity: 0.75,
      sunColor: 0xa5f3fc,
      sunIntensity: 0.8,
      propType: "neonPole",
      nightMode: true,
    },
    highway: {
      id: "highway",
      label: "Sunny Highway",
      sky: 0x60a5fa,
      fog: 0x93c5fd,
      ground: 0x16a34a,
      shoulder: 0x64748b,
      asphalt: 0x334155,
      edgeLine: 0xf8fafc,
      laneDash: 0xffffff,
      ambientColor: 0xffffff,
      ambientIntensity: 0.85,
      sunColor: 0xfffbeb,
      sunIntensity: 1.15,
      propType: "tree",
      nightMode: false,
    },
    desert: {
      id: "desert",
      label: "Desert Canyon",
      sky: 0xf59e0b,
      fog: 0xfbbf24,
      ground: 0xd97706,
      shoulder: 0x92400e,
      asphalt: 0x44403c,
      edgeLine: 0xfde047,
      laneDash: 0xfef08a,
      ambientColor: 0xffedd5,
      ambientIntensity: 0.85,
      sunColor: 0xfff7ed,
      sunIntensity: 1.2,
      propType: "cactus",
      nightMode: false,
    },
  };

  const VEHICLE_TYPES = [
    { kind: "sedan", w: 1.9, len: 4.1, h: 1.25, speedFactor: 0.42, colors: [0x38bdf8, 0xf43f5e, 0xa855f7, 0x22c55e, 0xe2e8f0] },
    { kind: "sports", w: 1.95, len: 4.0, h: 1.1, speedFactor: 0.56, colors: [0xf97316, 0xec4899, 0xeab308, 0x06b6d4] },
    { kind: "taxi", w: 1.9, len: 4.1, h: 1.25, speedFactor: 0.45, colors: [0xfacc15] },
    { kind: "suv", w: 2.05, len: 4.5, h: 1.55, speedFactor: 0.36, colors: [0x64748b, 0x0f766e, 0xdc2626, 0x1d4ed8] },
    { kind: "truck", w: 2.2, len: 5.9, h: 2.3, speedFactor: 0.26, colors: [0xcbd5e1, 0xfb923c, 0x60a5fa, 0x4ade80] },
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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 220);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
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

  // Road & Ground Meshes
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x090e1c });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, -0.04, -75);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const shoulderMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const shoulderMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH + 2.6, 240), shoulderMat);
  shoulderMesh.rotation.x = -Math.PI / 2;
  shoulderMesh.position.set(0, -0.02, -75);
  shoulderMesh.receiveShadow = true;
  scene.add(shoulderMesh);

  const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x171d33 });
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
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  function createVehicleMesh(kind, color, isPlayer) {
    const group = new THREE.Group();
    const spec = isPlayer
      ? { w: 1.95, len: 4.2, h: 1.15 }
      : VEHICLE_TYPES.find((v) => v.kind === kind) || VEHICLE_TYPES[0];

    const bodyMat = new THREE.MeshLambertMaterial({ color });

    // Main Chassis
    const chassisH = kind === "truck" ? 0.65 : spec.h * 0.55;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(spec.w, chassisH, spec.len), bodyMat);
    chassis.position.y = 0.36 + chassisH / 2;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    if (kind === "truck") {
      // Truck cab + cargo container
      const cab = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.9, 1.0, 1.5), bodyMat);
      cab.position.set(0, 0.36 + chassisH + 0.5, -spec.len * 0.32);
      cab.castShadow = true;
      group.add(cab);

      const cargoMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.96, 1.45, spec.len * 0.68), cargoMat);
      cargo.position.set(0, 0.36 + chassisH + 0.72, spec.len * 0.14);
      cargo.castShadow = true;
      group.add(cargo);
    } else {
      // Cabin / windshield
      const cabinH = spec.h * 0.45;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.78, cabinH, spec.len * 0.48), glassMat);
      cabin.position.set(0, 0.36 + chassisH + cabinH / 2 - 0.02, 0.1);
      cabin.castShadow = true;
      group.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.72, 0.08, spec.len * 0.38), bodyMat);
      roof.position.set(0, 0.36 + chassisH + cabinH, 0.15);
      group.add(roof);
    }

    if (kind === "taxi") {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.2, 0.32),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      sign.position.set(0, 0.36 + spec.h + 0.1, 0.1);
      group.add(sign);
    }

    if (isPlayer || kind === "sports") {
      const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(spec.w * 0.88, 0.1, 0.35),
        new THREE.MeshLambertMaterial({ color: 0x0f172a })
      );
      spoiler.position.set(0, 0.36 + chassisH + 0.22, spec.len / 2 - 0.25);
      group.add(spoiler);
    }

    if (isPlayer) {
      // Racing stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.03, spec.len * 0.94),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      stripe.position.set(0, 0.36 + chassisH + 0.02, 0);
      group.add(stripe);
    }

    // 4 Wheels
    const wheelOffsets = [
      [-spec.w / 2 + 0.06, 0.36, -spec.len * 0.3],
      [spec.w / 2 - 0.06, 0.36, -spec.len * 0.3],
      [-spec.w / 2 + 0.06, 0.36, spec.len * 0.3],
      [spec.w / 2 - 0.06, 0.36, spec.len * 0.3],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      group.add(w);
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

      group.userData = { tailMat, tlL, tlR, beam, flameL, flameR };
    }

    return group;
  }

  // Player 3D Mesh
  const playerMesh = createVehicleMesh("sports", 0x00e5ff, true);
  scene.add(playerMesh);

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

  function applyRoadTheme(roadId) {
    const road = ROADS[roadId];
    scene.background = new THREE.Color(road.sky);
    scene.fog = new THREE.Fog(road.fog, 48, 145);
    groundMat.color.setHex(road.ground);
    shoulderMat.color.setHex(road.shoulder);
    asphaltMat.color.setHex(road.asphalt);
    edgeLineMat.color.setHex(road.edgeLine);
    laneDashMat.color.setHex(road.laneDash);

    ambientLight.color.setHex(road.ambientColor);
    ambientLight.intensity = road.ambientIntensity;
    sunLight.color.setHex(road.sunColor);
    sunLight.intensity = road.sunIntensity;

    if (playerMesh.userData.beam) {
      playerMesh.userData.beam.visible = road.nightMode;
    }
    buildRoadProps(road.propType);
  }

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
    for (const p of particles) scene.remove(p.mesh);
    traffic = [];
    particles = [];
  }

  // ---------------------------------------------------------------------------
  // Game Lifecycle
  // ---------------------------------------------------------------------------
  function startGame() {
    sfx.ensureContext();
    const mode = MODES[selectedMode];

    clearTrafficAndParticles();
    applyRoadTheme(selectedRoad);

    state = "playing";
    player.lane = 1;
    player.x = getLaneCenterX(1);
    player.tilt = 0;
    player.boosting = false;
    player.braking = false;
    playerMesh.position.set(player.x, 0, 0);
    playerMesh.rotation.set(0, 0, 0);

    speed = mode.baseSpeed;
    score = 0;
    distanceMeters = 0;
    nearMisses = 0;
    elapsedTime = 0;
    spawnTimer = 0.45;
    crashTimer = 0;
    shakeTime = 0;

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
    shakeTime = 0.48;
    player.boosting = false;
    player.braking = false;
    sfx.stopMusic();
    sfx.playCrash();

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

    // Gentle idle animation on menu
    if (state === "menu") {
      const idleSpeed3D = 12;
      for (const dash of laneDashes) {
        dash.position.z += idleSpeed3D * dt;
        if (dash.position.z > 20) dash.position.z -= DASH_COUNT * DASH_STEP;
      }
      for (const prop of propItems) {
        prop.position.z += idleSpeed3D * dt;
        if (prop.position.z > 22) prop.position.z -= 18 * 11;
      }
      camera.position.set(0, 4.6, 8.8);
      camera.lookAt(0, 1.0, -18);
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

    // Smooth player lane interpolation & 3D tilt
    const targetX = getLaneCenterX(player.lane);
    player.x += (targetX - player.x) * Math.min(1, dt * 15);
    player.tilt += (0 - player.tilt) * Math.min(1, dt * 10);
    playerMesh.position.x = player.x;
    playerMesh.rotation.z = player.tilt;
    playerMesh.rotation.y = player.tilt * 0.45;

    // Visual brake lights & nitro flames
    const ud = playerMesh.userData;
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

    // Scroll 3D lane dashes & roadside props
    for (const dash of laneDashes) {
      dash.position.z += speed3D * dt;
      if (dash.position.z > 20) dash.position.z -= DASH_COUNT * DASH_STEP;
    }
    for (const prop of propItems) {
      prop.position.z += speed3D * dt;
      if (prop.position.z > 22) prop.position.z -= 18 * 11;
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

    // Traffic update, overtaking gaps & 3D collision check
    const minFollowGap = 11;
    const minLaneChangeGap = 24;
    const minOvertakeCorridor = 22;

    for (let i = traffic.length - 1; i >= 0; i--) {
      const car = traffic[i];
      // Uniform cruising pace keeps waves from catching up and forming a 3-lane wall
      let relSpeed3D = speed3D * 0.74;

      // Maintain following distance behind slower cars ahead in the same lane
      for (const ahead of traffic) {
        if (ahead === car || ahead.targetLane !== car.targetLane || ahead.z <= car.z) continue;
        const requiredDist = (car.len + ahead.len) * 0.5 + minFollowGap;
        if (ahead.z - car.z < requiredDist) {
          const aheadRelSpeed3D = speed3D - speed3D * ahead.speedFactor * 0.55;
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
  // Init
  // ---------------------------------------------------------------------------
  resizeRenderer();
  applyRoadTheme(selectedRoad);
  updateMenuUI();
  lastFrameTime = performance.now();
  requestAnimationFrame(loop);
})();
