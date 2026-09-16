/**
 * Pliny Game Lab — Aqueduct (Hydraulic Incline & Siphon Simulator)
 * 
 * Roman Hydraulic Engineering based on Vitruvius (De Architectura VIII)
 * and Sextus Julius Frontinus (De Aquaeductu Urbis Romae).
 * 
 * Simulates:
 * 1. Open-Channel Flow via Manning's Equation:
 *      v = (1/n) * R_h^(2/3) * S^(1/2)
 * 2. Inverted Siphon Hydrodynamics via Bernoulli & Torricelli Head Equations:
 *      P_bottom = rho * g * H_depth,  v_siphon = valve * sqrt(2 * g * deltaH)
 * 3. Sediment Decantation Basin (Piscina Limaria) with Stokes' Settling & Baffles
 * 4. Urban Distribution Manifold (Castellum Divisorium) with Calices to Fountains, Baths, Insulae
 */

export class AqueductEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    // Simulation Parameters & Hydraulics
    this.inclineGradient = 400; // 1:400 slope (S = 0.0025)
    this.manningN = 0.014; // Roman opus signinum hydraulic cement lining
    this.channelWidth = 1.2; // meters
    this.springFlowRate = 240; // Roman Quinariae (~0.48 L/s each -> ~115 L/s)
    this.siphonValve = 1.0; // 100% open
    this.flashFloodTimer = 0; // Duration of active storm surge
    this.scourFlushTimer = 0; // Duration of active sediment purge
    this.activePreset = 'Pont du Gard Valley';

    // Telemetry & Computed State
    this.manningVelocity = 1.35; // m/s
    this.flowDischarge = 115.2; // L/s
    this.siphonPressureBar = 3.6; // Hydrostatic bar at chasm bottom
    this.sedimentClarity = 0.96; // 96% pure drinking water
    this.bathsAlloc = 0.35;
    this.fountainsAlloc = 0.45;
    this.insulaeAlloc = 0.20;

    // Simulation Entities
    this.waterParticles = [];
    this.sedimentNodes = [];
    this.archPiers = [];
    this.foamParticles = [];
    this.steamParticles = [];

    // Interaction State
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.hoveredZone = null;
    this.time = 0;

    // Audio State (Lazy Web Audio)
    this.audioCtx = null;
    this.ambientGain = null;
    this.audioInitialized = false;

    // Initialize Architecture & Controls
    this.initPiers();
    this.initSediment();
    this.buildControls();
    this.reset();
  }

  // Guarded DOM Initialization
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Channel Incline Gradient</span>
          <span id="slope-label" style="color: var(--accent-gold, #d4af37); font-weight:600;">1:400 (0.25%)</span>
        </label>
        <input type="range" id="slope-slider" min="150" max="1000" step="10" value="400">
      </div>

      <div class="control-group">
        <label>
          <span>Mountain Spring Flow</span>
          <span id="flow-label" style="color: var(--accent-cyan, #3bd6c6); font-weight:600;">240 Quinariae (115 L/s)</span>
        </label>
        <input type="range" id="flow-slider" min="60" max="500" step="10" value="240">
      </div>

      <div class="control-group">
        <label>
          <span>Siphon Pressure Valve</span>
          <span id="valve-label" style="color: var(--accent-gold, #d4af37); font-weight:600;">100% Open</span>
        </label>
        <input type="range" id="valve-slider" min="10" max="100" step="1" value="100">
      </div>

      <div class="control-group">
        <label>Hydraulic Operations</label>
        <div class="control-btn-grid">
          <button class="sub-btn" id="btn-surge">⚡ Flash Flood Surge</button>
          <button class="sub-btn" id="btn-flush">🧹 Flush Sediment Basin</button>
        </div>
      </div>

      <div class="control-group">
        <label>Historical Engineering Presets</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" data-preset="Pont du Gard Valley">🏛️ Pont du Gard</button>
          <button class="sub-btn" data-preset="Mountain Siphon Chasm">⛰️ Siphon Chasm</button>
        </div>
        <button class="sub-btn" style="margin-top: 6px; width: 100%;" data-preset="City Distribution Castellum">🏙️ Castellum Divisorium</button>
      </div>
    `;

    // Hook Sliders
    const slopeSlider = this.controlsContainer.querySelector('#slope-slider');
    const slopeLabel = this.controlsContainer.querySelector('#slope-label');
    if (slopeSlider && slopeLabel) {
      slopeSlider.addEventListener('input', (e) => {
        this.inclineGradient = parseFloat(e.target.value);
        const pct = (100 / this.inclineGradient).toFixed(2);
        slopeLabel.textContent = `1:${Math.round(this.inclineGradient)} (${pct}%)`;
        this.calculateHydraulics();
      });
    }

    const flowSlider = this.controlsContainer.querySelector('#flow-slider');
    const flowLabel = this.controlsContainer.querySelector('#flow-label');
    if (flowSlider && flowLabel) {
      flowSlider.addEventListener('input', (e) => {
        this.springFlowRate = parseFloat(e.target.value);
        const lps = (this.springFlowRate * 0.48).toFixed(0);
        flowLabel.textContent = `${Math.round(this.springFlowRate)} Quinariae (${lps} L/s)`;
        this.calculateHydraulics();
      });
    }

    const valveSlider = this.controlsContainer.querySelector('#valve-slider');
    const valveLabel = this.controlsContainer.querySelector('#valve-label');
    if (valveSlider && valveLabel) {
      valveSlider.addEventListener('input', (e) => {
        this.siphonValve = parseFloat(e.target.value) / 100;
        valveLabel.textContent = `${Math.round(this.siphonValve * 100)}% Open`;
        this.calculateHydraulics();
      });
    }

    // Hook Action Buttons
    const btnSurge = this.controlsContainer.querySelector('#btn-surge');
    if (btnSurge) {
      btnSurge.addEventListener('click', () => this.triggerFlashFlood());
    }

    const btnFlush = this.controlsContainer.querySelector('#btn-flush');
    if (btnFlush) {
      btnFlush.addEventListener('click', () => this.triggerSedimentFlush());
    }

    // Hook Preset Buttons
    const presetButtons = this.controlsContainer.querySelectorAll('[data-preset]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyPreset(btn.dataset.preset);
      });
    });
  }

  // Architecture & Geometry Setup
  initPiers() {
    this.archPiers = [];
    const w = this.width;
    const h = this.height;

    // Foothill arcade piers (Section 1)
    const foothillPiers = [0.14, 0.18, 0.22, 0.26, 0.30];
    foothillPiers.forEach((nx, i) => {
      this.archPiers.push({
        id: `foothill_${i}`,
        nx: nx,
        x: nx * w,
        topNy: 0.33 + (nx - 0.10) * 0.22,
        baseNy: 0.72 - (i % 2) * 0.04,
        width: 22,
        tiers: 1,
        style: 'ashlar'
      });
    });

    // Settling basin buttress pillars (Section 2)
    this.archPiers.push({
      id: 'piscina_west',
      nx: 0.35,
      x: 0.35 * w,
      topNy: 0.38,
      baseNy: 0.70,
      width: 28,
      tiers: 1,
      style: 'buttress'
    });
    this.archPiers.push({
      id: 'piscina_east',
      nx: 0.47,
      x: 0.47 * w,
      topNy: 0.40,
      baseNy: 0.70,
      width: 28,
      tiers: 1,
      style: 'buttress'
    });

    // Gorge Arcade / Venter Piers (Section 3)
    if (this.activePreset === 'Pont du Gard Valley') {
      const gorgePiers = [0.52, 0.58, 0.64, 0.70];
      gorgePiers.forEach((nx, i) => {
        this.archPiers.push({
          id: `gard_${i}`,
          nx: nx,
          x: nx * w,
          topNy: 0.40 + (nx - 0.48) * 0.15,
          baseNy: 0.84 - (i === 1 || i === 2 ? 0.0 : 0.08),
          width: 30,
          tiers: 3, // Monumental triple-tier arcade
          style: 'gard'
        });
      });
    } else {
      // Siphon chasm low venter bridge piers
      const siphonPiers = [0.57, 0.63];
      siphonPiers.forEach((nx, i) => {
        this.archPiers.push({
          id: `venter_${i}`,
          nx: nx,
          x: nx * w,
          topNy: 0.80,
          baseNy: 0.88,
          width: 24,
          tiers: 1,
          style: 'venter'
        });
      });
    }

    // City Approach Arcade (Section 4)
    const cityPiers = [0.74, 0.78, 0.82];
    cityPiers.forEach((nx, i) => {
      this.archPiers.push({
        id: `city_${i}`,
        nx: nx,
        x: nx * w,
        topNy: 0.44 + (nx - 0.72) * 0.18,
        baseNy: 0.74,
        width: 22,
        tiers: 1,
        style: 'ashlar'
      });
    });

    // Castellum Aquae foundation
    this.archPiers.push({
      id: 'castellum_substructure',
      nx: 0.88,
      x: 0.88 * w,
      topNy: 0.49,
      baseNy: 0.82,
      width: 44,
      tiers: 2,
      style: 'rotunda'
    });
  }

  // Pre-seed sediment bed in Piscina Limaria
  initSediment() {
    this.sedimentNodes = [];
    const w = this.width;
    const h = this.height;
    const basinLeft = 0.36 * w;
    const basinRight = 0.46 * w;
    const floorY = 0.55 * h;

    // Initial 40 settled silt nodes
    for (let i = 0; i < 40; i++) {
      const px = basinLeft + Math.random() * (basinRight - basinLeft);
      const py = floorY - Math.random() * 12;
      this.sedimentNodes.push({
        x: px,
        y: py,
        vx: 0,
        vy: 0,
        radius: 1.5 + Math.random() * 2.0,
        settled: true,
        settledTime: Math.random() * 10,
        density: 1800 + Math.random() * 600, // kg/m3 (silt / quartz sand)
        opacity: 0.65 + Math.random() * 0.3
      });
    }
  }

  // Manning Equation & Hydraulic Solvers
  calculateHydraulics() {
    const slopeS = 1.0 / this.inclineGradient;
    const Q_lps = this.springFlowRate * 0.48; // L/s
    const Q_m3s = Q_lps / 1000.0; // m3/s

    // Estimate water depth 'y' in rectangular flume: Q = (1/n) * (b*y) * (b*y / (b + 2y))^(2/3) * S^(1/2)
    // Solve iteratively:
    let y = 0.35; // Initial guess 35cm
    const b = this.channelWidth;
    const sqrtS = Math.sqrt(slopeS);

    for (let iter = 0; iter < 4; iter++) {
      const A = b * y;
      const P = b + 2 * y;
      const Rh = A / P;
      const v = (1.0 / this.manningN) * Math.pow(Rh, 2 / 3) * sqrtS;
      const f = A * v - Q_m3s;
      const df = v * b + A * (2 / 3) * (1 / this.manningN) * Math.pow(Rh, -1 / 3) * ((b * P - 2 * A) / (P * P)) * sqrtS;
      if (Math.abs(df) > 0.0001) {
        y = Math.max(0.08, Math.min(1.2, y - f / df));
      }
    }

    const A_final = b * y;
    const Rh_final = A_final / (b + 2 * y);
    this.manningVelocity = (1.0 / this.manningN) * Math.pow(Rh_final, 2 / 3) * sqrtS;
    this.waterDepth = y;
    this.flowDischarge = Q_lps;

    // Inverted Siphon Hydrostatic Head
    // Depth from header tank (elevation 40m) to gorge bottom (elevation 5m) -> 35m head
    const chasmDepthMeters = (this.activePreset === 'Pont du Gard Valley') ? 12 : 36;
    const staticPressurePa = 1000 * 9.81 * chasmDepthMeters;
    // Siphon flow head loss & valve throttling
    const dynamicCoeff = 0.85 * Math.sqrt(this.siphonValve);
    const effectiveHeadLoss = (1.0 - this.siphonValve) * 0.6;
    this.siphonPressureBar = ((staticPressurePa / 100000) * (1.0 + effectiveHeadLoss)).toFixed(2);
    this.siphonVelocity = Math.max(0.4, 4.2 * dynamicCoeff);

    // Castellum Divisorium Priority Splitting
    // Public Fountains (Lacus) always get first 50 L/s priority
    const Q_fountain = Math.min(this.flowDischarge * 0.45, 55);
    const remainingAfterFountain = Math.max(0, this.flowDischarge - Q_fountain);
    // Imperial Baths (Thermae) get second priority
    const Q_baths = Math.min(remainingAfterFountain * 0.65, 60);
    // Private insulae gets remainder (cut first during drought)
    const Q_insulae = Math.max(0, remainingAfterFountain - Q_baths);

    const totalAlloc = (Q_fountain + Q_baths + Q_insulae) || 1;
    this.fountainsAlloc = Q_fountain / totalAlloc;
    this.bathsAlloc = Q_baths / totalAlloc;
    this.insulaeAlloc = Q_insulae / totalAlloc;

    // Sediment Clarity based on settling basin efficiency: Stokes decantation
    const basinResidenceTime = 40.0 / (this.manningVelocity + 0.1);
    const basePurity = Math.min(0.99, 0.70 + basinResidenceTime * 0.015);
    const floodPenalty = (this.flashFloodTimer > 0) ? 0.35 : 0;
    this.sedimentClarity = Math.max(0.45, basePurity - floodPenalty);
  }

  // Presets
  applyPreset(name) {
    this.activePreset = name;
    if (name === 'Pont du Gard Valley') {
      this.inclineGradient = 400;
      this.springFlowRate = 240;
      this.siphonValve = 1.0;
    } else if (name === 'Mountain Siphon Chasm') {
      this.inclineGradient = 280;
      this.springFlowRate = 320;
      this.siphonValve = 0.75;
    } else if (name === 'City Distribution Castellum') {
      this.inclineGradient = 550;
      this.springFlowRate = 180;
      this.siphonValve = 1.0;
    }

    // Sync UI Sliders if DOM present
    if (this.controlsContainer) {
      const slopeSlider = this.controlsContainer.querySelector('#slope-slider');
      const slopeLabel = this.controlsContainer.querySelector('#slope-label');
      if (slopeSlider && slopeLabel) {
        slopeSlider.value = this.inclineGradient;
        const pct = (100 / this.inclineGradient).toFixed(2);
        slopeLabel.textContent = `1:${Math.round(this.inclineGradient)} (${pct}%)`;
      }

      const flowSlider = this.controlsContainer.querySelector('#flow-slider');
      const flowLabel = this.controlsContainer.querySelector('#flow-label');
      if (flowSlider && flowLabel) {
        flowSlider.value = this.springFlowRate;
        const lps = (this.springFlowRate * 0.48).toFixed(0);
        flowLabel.textContent = `${Math.round(this.springFlowRate)} Quinariae (${lps} L/s)`;
      }

      const valveSlider = this.controlsContainer.querySelector('#valve-slider');
      const valveLabel = this.controlsContainer.querySelector('#valve-label');
      if (valveSlider && valveLabel) {
        valveSlider.value = Math.round(this.siphonValve * 100);
        valveLabel.textContent = `${Math.round(this.siphonValve * 100)}% Open`;
      }
    }

    this.initPiers();
    this.calculateHydraulics();
  }

  triggerFlashFlood() {
    this.flashFloodTimer = 7.0; // 7 seconds storm surge
    this.springFlowRate = Math.min(500, this.springFlowRate * 1.8);
    this.calculateHydraulics();

    // Spawn burst of muddy sediment at mountain spring
    const w = this.width;
    const h = this.height;
    for (let i = 0; i < 35; i++) {
      this.sedimentNodes.push({
        x: 0.05 * w + Math.random() * 20,
        y: 0.32 * h + Math.random() * 12,
        vx: 40 + Math.random() * 30,
        vy: (Math.random() - 0.5) * 10,
        radius: 1.5 + Math.random() * 2.5,
        settled: false,
        settledTime: 0,
        density: 1900,
        opacity: 0.8
      });
    }

    this.playAudioTone(180, 0.4, 'sawtooth');
  }

  triggerSedimentFlush() {
    this.scourFlushTimer = 5.0; // 5 seconds scour purge
    this.playAudioTone(240, 0.3, 'triangle');
  }

  // Audio helper (safe in all environments)
  playAudioTone(freq, duration, type = 'sine') {
    try {
      if (typeof window === 'undefined' || !window.AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Ignore audio failure in headless test environments
    }
  }

  // Contract Methods
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.initPiers();
  }

  reset() {
    this.time = 0;
    this.flashFloodTimer = 0;
    this.scourFlushTimer = 0;
    this.waterParticles = [];
    this.foamParticles = [];
    this.steamParticles = [];
    this.initSediment();
    this.calculateHydraulics();

    // Seed 140 initial water particles along the full flume
    const w = this.width;
    for (let i = 0; i < 140; i++) {
      const progress = i / 140;
      const pt = this.getAqueductPoint(progress);
      this.waterParticles.push({
        progress: progress,
        x: pt.x,
        y: pt.y + (Math.random() - 0.5) * 6,
        size: 2.2 + Math.random() * 1.8,
        sparkle: Math.random() * Math.PI * 2,
        clarity: progress > 0.48 ? 0.95 : 0.75,
        zone: pt.zone
      });
    }
  }

  destroy() {
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }

  getEntityCount() {
    const waterCount = this.waterParticles ? this.waterParticles.length : 0;
    const sedimentCount = this.sedimentNodes ? this.sedimentNodes.length : 0;
    const pierCount = this.archPiers ? this.archPiers.length : 0;
    return waterCount + sedimentCount + pierCount;
  }

  // Aqueduct Path Evaluator (Normalized parameter t: 0.0 -> 1.0)
  getAqueductPoint(t) {
    const w = this.width;
    const h = this.height;

    // t is mapped along key functional segments:
    // 0.00 - 0.10: Mountain Spring (Caput Aquae)
    // 0.10 - 0.35: Elevated Arcade 1 (Foothills flume)
    // 0.35 - 0.48: Piscina Limaria (Settling Basin)
    // 0.48 - 0.72: Chasm (Inverted Siphon or Pont du Gard 3-tier bridge)
    // 0.72 - 0.85: Elevated Arcade 2 (City approach flume)
    // 0.85 - 1.00: Castellum Aquae & Manifold Outflow

    let nx = t;
    let ny = 0.32;
    let zone = 'spring';

    if (t < 0.10) {
      zone = 'spring';
      ny = 0.32;
    } else if (t < 0.35) {
      zone = 'arcade1';
      const segT = (t - 0.10) / 0.25;
      ny = 0.32 + segT * (0.38 - 0.32);
    } else if (t < 0.48) {
      zone = 'piscina';
      const segT = (t - 0.35) / 0.13;
      // Serpentines around baffles in basin
      if (segT < 0.3) {
        ny = 0.38 + segT * 0.4;
      } else if (segT < 0.7) {
        ny = 0.50 - (segT - 0.3) * 0.2;
      } else {
        ny = 0.42 - (segT - 0.7) * 0.1;
      }
    } else if (t < 0.72) {
      const segT = (t - 0.48) / 0.24;
      if (this.activePreset === 'Pont du Gard Valley') {
        zone = 'gard';
        // Smooth gentle slope across the 3-tier grand bridge
        ny = 0.40 + segT * (0.44 - 0.40);
      } else {
        zone = 'siphon';
        // Inverted siphon plunge down gorge, cross venter, climb opposing cliff
        if (segT < 0.40) {
          const s = segT / 0.40;
          ny = 0.40 + s * (0.83 - 0.40); // plunge down
        } else if (segT < 0.60) {
          ny = 0.83; // venter chasm floor
        } else {
          const s = (segT - 0.60) / 0.40;
          ny = 0.83 - s * (0.83 - 0.44); // climb up to receiving tank
        }
      }
    } else if (t < 0.85) {
      zone = 'arcade2';
      const segT = (t - 0.72) / 0.13;
      ny = 0.44 + segT * (0.49 - 0.44);
    } else {
      zone = 'castellum';
      const segT = (t - 0.85) / 0.15;
      ny = 0.49 + segT * 0.15;
    }

    return { x: nx * w, y: ny * h, zone: zone };
  }

  // Simulation Update Loop
  update(dt) {
    // Clamp delta time to prevent physics explosions
    const safeDt = Math.min(dt, 0.05);
    this.time += safeDt;

    // Handle Timers
    if (this.flashFloodTimer > 0) {
      this.flashFloodTimer = Math.max(0, this.flashFloodTimer - safeDt);
      if (this.flashFloodTimer === 0) {
        this.calculateHydraulics();
      }
    }

    if (this.scourFlushTimer > 0) {
      this.scourFlushTimer = Math.max(0, this.scourFlushTimer - safeDt);
    }

    // Spawn new water particles from mountain spring
    const spawnRate = (this.springFlowRate / 240) * (this.flashFloodTimer > 0 ? 30 : 18);
    const particlesToSpawn = Math.floor(spawnRate * safeDt * 12);
    for (let i = 0; i < particlesToSpawn; i++) {
      if (this.waterParticles.length < 260) {
        const pt = this.getAqueductPoint(0);
        this.waterParticles.push({
          progress: 0.0,
          x: pt.x,
          y: pt.y + (Math.random() - 0.5) * 6,
          size: 2.2 + Math.random() * 1.8,
          sparkle: Math.random() * Math.PI * 2,
          clarity: this.flashFloodTimer > 0 ? 0.35 : 0.75,
          zone: 'spring'
        });
      }
    }

    // Update Water Particles
    const w = this.width;
    const h = this.height;
    const baseSpeed = 0.065 * (this.manningVelocity / 1.35);

    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const p = this.waterParticles[i];
      let speedMult = 1.0;

      // Speed varies according to local hydraulic physics
      if (p.zone === 'piscina') {
        // Drastic velocity drop in settling tank (Manning A1 -> A2 continuity)
        speedMult = 0.22;
      } else if (p.zone === 'siphon') {
        // High velocity under hydrostatic Torricelli head
        speedMult = 1.85 * this.siphonValve;
      } else if (p.zone === 'gard') {
        speedMult = 0.95;
      }

      p.progress += baseSpeed * speedMult * safeDt;
      p.sparkle += safeDt * 6;

      if (p.progress >= 1.0) {
        // Particle arrived at Castellum Aquae
        // Emit splashes or steam at fountains/baths
        if (Math.random() < 0.4 && this.steamParticles.length < 50) {
          this.steamParticles.push({
            x: 0.94 * w + (Math.random() - 0.5) * 16,
            y: 0.63 * h,
            vx: (Math.random() - 0.5) * 8,
            vy: -15 - Math.random() * 18,
            radius: 3 + Math.random() * 4,
            alpha: 0.7,
            life: 1.0
          });
        }
        this.waterParticles.splice(i, 1);
        continue;
      }

      const pt = this.getAqueductPoint(p.progress);
      p.x = pt.x;
      // Slight vertical turbulence
      p.y = pt.y + Math.sin(p.progress * 60 + this.time * 4) * 2;
      p.zone = pt.zone;

      // Clarify water through decantation basin
      if (p.progress > 0.47) {
        p.clarity = Math.min(0.98, p.clarity + safeDt * 0.5);
      }
    }

    // Update Sediment Nodes (Silt particles)
    const basinLeft = 0.35 * w;
    const basinRight = 0.47 * w;
    const basinFloor = 0.55 * h;
    const drainX = 0.41 * w;
    const drainY = 0.56 * h;

    for (let i = this.sedimentNodes.length - 1; i >= 0; i--) {
      const s = this.sedimentNodes[i];

      if (this.scourFlushTimer > 0) {
        // Scour valve open: vortex suction towards bottom flush canal
        const dx = drainX - s.x;
        const dy = drainY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 120) {
          s.settled = false;
          s.vx += (dx / dist) * 260 * safeDt;
          s.vy += (dy / dist) * 260 * safeDt;
          s.x += s.vx * safeDt;
          s.y += s.vy * safeDt;
          if (dist < 8) {
            // Flushed out of the bottom scour sluice
            this.sedimentNodes.splice(i, 1);
            continue;
          }
        }
      }

      if (s.settled) {
        s.settledTime += safeDt;
        continue;
      }

      // Sediment in transit
      s.x += s.vx * safeDt;
      s.y += s.vy * safeDt;

      // In the settling tank, Stokes gravity settling pulls silt down
      if (s.x >= basinLeft && s.x <= basinRight) {
        s.vx *= 0.88; // decelerate in wide chamber
        s.vy += 32 * safeDt; // Stokes gravity fall
        if (s.y >= basinFloor - Math.random() * 6) {
          s.y = basinFloor - Math.random() * 4;
          s.vx = 0;
          s.vy = 0;
          s.settled = true;
        }
      } else if (s.x > basinRight) {
        // Escaped sediment continues towards city
        s.vx = this.manningVelocity * 35;
        s.vy = Math.sin(this.time * 6 + i) * 8;
        if (s.x > w) {
          this.sedimentNodes.splice(i, 1);
        }
      }
    }

    // Update Steam Wisps from Thermae
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const st = this.steamParticles[i];
      st.x += st.vx * safeDt;
      st.y += st.vy * safeDt;
      st.radius += safeDt * 3;
      st.alpha -= safeDt * 0.45;
      if (st.alpha <= 0) {
        this.steamParticles.splice(i, 1);
      }
    }
  }

  // Canvas Render Pass
  render(ctx) {
    const w = this.width;
    const h = this.height;

    // 1. Sky & Atmospheric Vista
    this.renderSkyAndLandscape(ctx, w, h);

    // 2. Distant & Middle Roman Arcades
    this.renderArcades(ctx, w, h);

    // 3. Cutaways: Piscina Limaria, Inverted Siphon, Castellum Aquae
    this.renderPiscinaLimaria(ctx, w, h);
    this.renderInvertedSiphon(ctx, w, h);
    this.renderCastellumDivisorium(ctx, w, h);

    // 4. Fluid Dynamics: Sparkling Water Particles & Foam
    this.renderFluidStream(ctx, w, h);

    // 5. Sediment Particles & Settling Bed
    this.renderSedimentNodes(ctx, w, h);

    // 6. Interactive Telemetry & Roman Inscriptions
    this.renderHUD(ctx, w, h);

    // 7. Interactive Hover Tooltip
    if (this.hoveredZone) {
      this.renderTooltip(ctx);
    }
  }

  renderSkyAndLandscape(ctx, w, h) {
    // Warm Mediterranean Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0.0, '#1c3654'); // Zenith azure
    skyGrad.addColorStop(0.4, '#4a6b82');
    skyGrad.addColorStop(0.75, '#cbb892'); // Warm golden limestone haze
    skyGrad.addColorStop(1.0, '#e8d4a6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Radiant Roman Sun
    const sunGrad = ctx.createRadialGradient(w * 0.18, h * 0.16, 4, w * 0.18, h * 0.16, 75);
    sunGrad.addColorStop(0.0, 'rgba(255, 248, 220, 0.85)');
    sunGrad.addColorStop(0.5, 'rgba(245, 210, 140, 0.35)');
    sunGrad.addColorStop(1.0, 'rgba(240, 190, 100, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.18, h * 0.16, 75, 0, Math.PI * 2);
    ctx.fill();

    // Distant Apennine Mountain Peaks
    ctx.fillStyle = '#657488';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.52);
    ctx.lineTo(w * 0.08, h * 0.28);
    ctx.lineTo(w * 0.22, h * 0.44);
    ctx.lineTo(w * 0.38, h * 0.32);
    ctx.lineTo(w * 0.54, h * 0.48);
    ctx.lineTo(w * 0.72, h * 0.36);
    ctx.lineTo(w * 0.90, h * 0.46);
    ctx.lineTo(w, h * 0.42);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Near Foothills & Valley Gorge Terrain
    ctx.fillStyle = '#485642';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.48);
    ctx.quadraticCurveTo(w * 0.18, h * 0.60, w * 0.34, h * 0.68);
    ctx.lineTo(w * 0.48, h * 0.72);
    // Deep gorge drop (at x = 0.50 to 0.72)
    ctx.lineTo(w * 0.54, h * 0.88);
    ctx.lineTo(w * 0.66, h * 0.88);
    ctx.lineTo(w * 0.72, h * 0.74);
    ctx.quadraticCurveTo(w * 0.85, h * 0.72, w, h * 0.76);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Canyon River at Chasm Floor
    const riverGrad = ctx.createLinearGradient(w * 0.52, h * 0.88, w * 0.68, h * 0.88);
    riverGrad.addColorStop(0, '#2b4d5e');
    riverGrad.addColorStop(0.5, '#4a7b8e');
    riverGrad.addColorStop(1, '#2b4d5e');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(w * 0.52, h * 0.86, w * 0.16, h * 0.14);

    // Mediterranean Stone Pines & Cypresses along ridges
    ctx.fillStyle = '#223620';
    const treeXs = [0.03, 0.07, 0.12, 0.28, 0.33, 0.75, 0.80, 0.97];
    treeXs.forEach(tx => {
      const px = tx * w;
      const py = (tx < 0.4 ? 0.50 : 0.68) * h;
      ctx.beginPath();
      ctx.ellipse(px, py, 6, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderArcades(ctx, w, h) {
    // Ashlar Travertine Stone Palette
    const stoneBase = '#b8a68d';
    const stoneDark = '#847460';
    const stoneHighlight = '#dfd3be';
    const mortarLine = 'rgba(45, 38, 30, 0.45)';

    // Render Piers
    this.archPiers.forEach(pier => {
      const px = pier.x;
      const py = pier.topNy * h;
      const pBase = pier.baseNy * h;
      const pw = pier.width;

      // Pier Main Shaft
      const pierGrad = ctx.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
      pierGrad.addColorStop(0, stoneHighlight);
      pierGrad.addColorStop(0.3, stoneBase);
      pierGrad.addColorStop(0.85, stoneDark);
      pierGrad.addColorStop(1, '#564a3c');

      ctx.fillStyle = pierGrad;
      ctx.fillRect(px - pw / 2, py, pw, pBase - py);

      // Ashlar Block Masonry Seams (Rustication)
      ctx.strokeStyle = mortarLine;
      ctx.lineWidth = 1;
      const blockH = 14;
      for (let y = py; y < pBase; y += blockH) {
        ctx.beginPath();
        ctx.moveTo(px - pw / 2, y);
        ctx.lineTo(px + pw / 2, y);
        ctx.stroke();
      }

      // Impost Cornice Molding at Arch Springing Line
      ctx.fillStyle = stoneHighlight;
      ctx.fillRect(px - pw / 2 - 4, py, pw + 8, 4);

      // Pier Cutwater Footing (Stramentum in river/valley)
      if (pier.baseNy > 0.75) {
        ctx.fillStyle = '#655745';
        ctx.beginPath();
        ctx.moveTo(px - pw / 2 - 4, pBase);
        ctx.lineTo(px, pBase + 8);
        ctx.lineTo(px + pw / 2 + 4, pBase);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Render Semicircular Arches between piers
    for (let i = 0; i < this.archPiers.length - 1; i++) {
      const p1 = this.archPiers[i];
      const p2 = this.archPiers[i + 1];

      // Only span arches within compatible segments
      if (Math.abs(p2.nx - p1.nx) > 0.12) continue;

      const x1 = p1.x + p1.width / 2;
      const x2 = p2.x - p2.width / 2;
      const span = x2 - x1;
      const midX = (x1 + x2) / 2;
      const archTopY = Math.min(p1.topNy, p2.topNy) * h;
      const radius = span / 2;

      // Semicircular Arch Void / Intrados
      ctx.save();
      ctx.beginPath();
      ctx.arc(midX, archTopY + radius, radius, Math.PI, 0, false);
      ctx.lineTo(x2, archTopY);
      ctx.lineTo(x1, archTopY);
      ctx.closePath();

      // Arch Stone Voussoirs & Spandrels
      ctx.fillStyle = stoneBase;
      ctx.fill();
      ctx.strokeStyle = mortarLine;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Keystone (Clavus) in Crown of Arch
      ctx.fillStyle = '#cbb89d';
      ctx.fillRect(midX - 4, archTopY, 8, 8);
      ctx.restore();

      // For Pont du Gard 3-Tier Mode: Render Middle and Lower Grand Arches
      if (this.activePreset === 'Pont du Gard Valley' && p1.style === 'gard' && p2.style === 'gard') {
        const midTierY = archTopY + 55;
        const lowTierY = archTopY + 115;

        // Middle Tier Arch
        ctx.fillStyle = stoneBase;
        ctx.beginPath();
        ctx.arc(midX, midTierY + radius * 0.9, radius * 0.9, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();

        // Keystone
        ctx.fillStyle = stoneHighlight;
        ctx.fillRect(midX - 5, midTierY, 10, 10);
      }
    }

    // Continuous Upper Flume Cornice & Opus Signinum Channel Trough
    const flumeGrad = ctx.createLinearGradient(0, 0, 0, h);
    flumeGrad.addColorStop(0, '#9c4332'); // Opus signinum terracotta mortar
    flumeGrad.addColorStop(1, '#664d3c');

    ctx.fillStyle = flumeGrad;
    // Render top channel bed across the arcade
    ctx.beginPath();
    ctx.moveTo(0.10 * w, 0.32 * h + 8);
    ctx.lineTo(0.35 * w, 0.38 * h + 8);
    ctx.lineTo(0.35 * w, 0.38 * h + 14);
    ctx.lineTo(0.10 * w, 0.32 * h + 14);
    ctx.closePath();
    ctx.fill();
  }

  renderPiscinaLimaria(ctx, w, h) {
    const x = 0.35 * w;
    const y = 0.36 * h;
    const bw = 0.13 * w;
    const bh = 0.22 * h;

    // Chamber Vaulted Masonry Cross-Section
    ctx.fillStyle = 'rgba(25, 22, 20, 0.88)';
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, bw, bh, 8) : ctx.rect(x, y, bw, bh);
    ctx.fill();
    ctx.stroke();

    // Chamber Interior Water Basin Fill
    const waterGrad = ctx.createLinearGradient(x, y, x + bw, y);
    // Turbid inlet fading into clear crystal outlet!
    waterGrad.addColorStop(0.0, 'rgba(160, 120, 65, 0.65)'); // Silty inflow
    waterGrad.addColorStop(0.5, 'rgba(80, 150, 180, 0.70)');
    waterGrad.addColorStop(1.0, 'rgba(65, 195, 245, 0.75)'); // Purified outflow
    ctx.fillStyle = waterGrad;
    ctx.fillRect(x + 4, y + 16, bw - 8, bh - 20);

    // Stone Decantation Baffles (Parietes Limariae)
    ctx.fillStyle = '#8f7e68';
    ctx.strokeStyle = '#544636';
    ctx.lineWidth = 1.5;

    // Baffle 1 (Hanging Baffle: forces water downwards)
    const b1x = x + bw * 0.32;
    ctx.fillRect(b1x - 3, y + 6, 6, bh * 0.65);
    ctx.strokeRect(b1x - 3, y + 6, 6, bh * 0.65);

    // Baffle 2 (Weir Baffle: forces clarified water to spill over top)
    const b2x = x + bw * 0.68;
    const b2y = y + bh * 0.38;
    ctx.fillRect(b2x - 3, b2y, 6, bh - (b2y - y) - 4);
    ctx.strokeRect(b2x - 3, b2y, 6, bh - (b2y - y) - 4);

    // Bottom Scour Flush Valve (Cataracta Purgatoria)
    const drainX = x + bw * 0.50;
    const drainY = y + bh - 4;
    ctx.fillStyle = this.scourFlushTimer > 0 ? '#ffaa33' : '#b8860b';
    ctx.beginPath();
    ctx.arc(drainX, drainY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Chamber Title Plaque
    ctx.fillStyle = '#d4af37';
    ctx.font = '9px monospace';
    ctx.fillText('PISCINA LIMARIA (SETTLING TANK)', x + 6, y + 12);
  }

  renderInvertedSiphon(ctx, w, h) {
    if (this.activePreset === 'Pont du Gard Valley') return;

    const x1 = 0.48 * w;
    const y1 = 0.40 * h;
    const xMid1 = 0.58 * w;
    const yBot = 0.83 * h;
    const xMid2 = 0.62 * w;
    const x2 = 0.72 * w;
    const y2 = 0.44 * h;

    // Heavy Roman Lead Siphon Pipes (Fistulae Plumbeae)
    // Siphon Plunging Tube
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#4e5b6a'; // Weathered lead bluish-grey
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(xMid1, yBot);
    ctx.lineTo(xMid2, yBot);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Inner Pressurized Water Jet Core
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(120, 220, 255, 0.9)';
    ctx.stroke();

    // Bronze Pipe Joint Collars & Anchors (Saxa Perforata)
    ctx.fillStyle = '#c5a059';
    const joints = [
      { x: (x1 + xMid1) / 2, y: (y1 + yBot) / 2 },
      { x: xMid1, y: yBot },
      { x: xMid2, y: yBot },
      { x: (xMid2 + x2) / 2, y: (yBot + y2) / 2 }
    ];
    joints.forEach(j => {
      ctx.fillRect(j.x - 3, j.y - 5, 6, 10);
    });

    // High Pressure Bronze Stopcock Valve & Manometer at Venter Bottom
    const valveX = (xMid1 + xMid2) / 2;
    const valveY = yBot;
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(valveX, valveY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Manometer Needle Indicator
    const needleAngle = (parseFloat(this.siphonPressureBar) / 6.0) * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(valveX, valveY);
    ctx.lineTo(valveX + Math.cos(needleAngle) * 9, valveY + Math.sin(needleAngle) * 9);
    ctx.strokeStyle = '#c83232';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#e6e8ee';
    ctx.font = '9px monospace';
    ctx.fillText(`SIPHON INVERSUS (${this.siphonPressureBar} BAR)`, valveX - 45, valveY + 18);
  }

  renderCastellumDivisorium(ctx, w, h) {
    const cx = 0.86 * w;
    const cy = 0.48 * h;
    const cw = 0.12 * w;
    const ch = 0.40 * h;

    // Classical Brick & Ashlar Terminal Rotunda
    ctx.fillStyle = '#9c4332'; // Roman brick opus latericium
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Distribution Basin Cutaway
    ctx.fillStyle = 'rgba(15, 20, 25, 0.85)';
    ctx.fillRect(cx + 4, cy + 6, cw - 8, ch * 0.45);

    // Basin Water Level
    ctx.fillStyle = 'rgba(65, 195, 245, 0.85)';
    ctx.fillRect(cx + 6, cy + 18, cw - 12, ch * 0.38);

    // Three Bronze Calices & Spouts:
    // 1. Lacus (Public Fountain)
    const fY = cy + ch * 0.65;
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(cx + cw - 4, fY - 3, 10, 6);
    // Water stream into public fountain basin
    ctx.strokeStyle = 'rgba(120, 225, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + cw + 6, fY);
    ctx.quadraticCurveTo(cx + cw + 14, fY + 12, cx + cw + 18, fY + 28);
    ctx.stroke();

    // Marble Fountain Basin (Lacus)
    ctx.fillStyle = '#c8c2b5';
    ctx.fillRect(cx + cw + 8, fY + 28, 24, 14);
    ctx.fillStyle = '#3bd6c6';
    ctx.fillText('LACUS', cx + cw - 32, fY + 4);

    // 2. Thermae (Imperial Baths)
    const bY = cy + ch * 0.35;
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(cx + cw - 4, bY - 3, 10, 6);
    ctx.strokeStyle = 'rgba(240, 240, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + cw + 6, bY);
    ctx.lineTo(cx + cw + 20, bY + 4);
    ctx.stroke();
    ctx.fillStyle = '#d4af37';
    ctx.fillText('THERMAE', cx + cw - 45, bY + 4);

    // 3. Insulae (Private Domestic Supply)
    const iY = cy + ch * 0.15;
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(cx + cw - 4, iY - 3, 10, 6);
    ctx.strokeStyle = 'rgba(90, 180, 240, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + cw + 6, iY);
    ctx.lineTo(cx + cw + 18, iY - 2);
    ctx.stroke();
    ctx.fillStyle = '#8c909e';
    ctx.fillText('INSULAE', cx + cw - 42, iY + 4);

    // Inscription Header
    ctx.fillStyle = '#d4af37';
    ctx.font = '9px monospace';
    ctx.fillText('CASTELLUM AQUAE', cx + 6, cy + 14);
  }

  renderFluidStream(ctx, w, h) {
    // Render Water Particles with Specular Shimmer & Sparkle
    for (let i = 0; i < this.waterParticles.length; i++) {
      const p = this.waterParticles[i];
      const alpha = 0.45 + Math.sin(p.sparkle) * 0.35;

      // Color tinted by sediment clarity (amber silty -> crystalline aqua)
      const r = Math.round(180 * (1.0 - p.clarity) + 65 * p.clarity);
      const g = Math.round(140 * (1.0 - p.clarity) + 195 * p.clarity);
      const b = Math.round(60 * (1.0 - p.clarity) + 245 * p.clarity);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight dot
      if (p.clarity > 0.85 && Math.sin(p.sparkle) > 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
      }
    }

    // Render Steam Wisps over Thermae
    this.steamParticles.forEach(st => {
      ctx.fillStyle = `rgba(235, 245, 255, ${st.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderSedimentNodes(ctx, w, h) {
    // Silt Nodes
    for (let i = 0; i < this.sedimentNodes.length; i++) {
      const s = this.sedimentNodes[i];
      ctx.fillStyle = s.settled
        ? `rgba(130, 85, 45, ${s.opacity})`
        : `rgba(175, 115, 60, ${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderHUD(ctx, w, h) {
    // Classic Roman Telemetry Banner
    const panelW = 340;
    const panelH = 110;
    const px = 16;
    const py = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(12, 14, 20, 0.86)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(px, py, panelW, panelH, 8) : ctx.rect(px, py, panelW, panelH);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 11px "Cinzel", Georgia, serif';
    ctx.fillText('AQUAEDUCTUS ROMANUS — HYDRAULIC TELEMETRY', px + 10, py + 18);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#e6e8ee';

    // Manning Open Channel Status
    const slopeStr = `1:${Math.round(this.inclineGradient)}`;
    const velStr = `${this.manningVelocity.toFixed(2)} m/s`;
    const flowStr = `${Math.round(this.flowDischarge)} L/s (${Math.round(this.springFlowRate)} Q)`;
    ctx.fillText(`Manning Gradient:  ${slopeStr} | Velocity: ${velStr}`, px + 10, py + 36);
    ctx.fillText(`Spring Discharge:  ${flowStr}`, px + 10, py + 50);

    // Siphon & Basin Status
    const siphonStr = `${this.siphonPressureBar} bar (${this.activePreset === 'Pont du Gard Valley' ? 'Bridged' : 'Active'})`;
    const clarityStr = `${Math.round(this.sedimentClarity * 100)}% Pure`;
    ctx.fillText(`Siphon Pressure:   ${siphonStr}`, px + 10, py + 66);
    ctx.fillText(`Water Clarity:     ${clarityStr}`, px + 10, py + 80);

    // Distribution Splitting
    const allocStr = `Lacus: ${Math.round(this.fountainsAlloc * 100)}% | Thermae: ${Math.round(this.bathsAlloc * 100)}% | Insulae: ${Math.round(this.insulaeAlloc * 100)}%`;
    ctx.fillStyle = '#3bd6c6';
    ctx.fillText(`Urban Split:       ${allocStr}`, px + 10, py + 96);

    // Operational Alerts
    if (this.flashFloodTimer > 0) {
      ctx.fillStyle = '#c83232';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`⚠️ FLASH FLOOD SURGE (${this.flashFloodTimer.toFixed(1)}s)`, px + panelW + 12, py + 20);
    }
    if (this.scourFlushTimer > 0) {
      ctx.fillStyle = '#ffaa33';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`🧹 SEDIMENT SCOUR ACTIVE (${this.scourFlushTimer.toFixed(1)}s)`, px + panelW + 12, py + 38);
    }
    ctx.restore();
  }

  renderTooltip(ctx) {
    const { x, y, title, desc } = this.hoveredZone;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 20, 28, 0.94)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    const tw = 240;
    const th = 48;
    const tx = Math.min(this.width - tw - 12, Math.max(12, x - tw / 2));
    const ty = Math.max(12, y - th - 12);

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tx, ty, tw, th, 6) : ctx.rect(tx, ty, tw, th);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 10px "Cinzel", Georgia, serif';
    ctx.fillText(title, tx + 8, ty + 16);

    ctx.fillStyle = '#8c909e';
    ctx.font = '9px monospace';
    ctx.fillText(desc, tx + 8, ty + 32);
    ctx.restore();
  }

  // Interactive Mouse Events
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = pos;

    const w = this.width;
    const h = this.height;

    // Check if clicked near Piscina Limaria scour valve -> toggle flush
    const drainX = 0.41 * w;
    const drainY = 0.56 * h;
    const distDrain = Math.hypot(pos.x - drainX, pos.y - drainY);
    if (distDrain < 25) {
      this.triggerSedimentFlush();
      return;
    }

    // Check if clicked near Siphon valve -> toggle valve
    const valveX = 0.60 * w;
    const valveY = 0.83 * h;
    const distValve = Math.hypot(pos.x - valveX, pos.y - valveY);
    if (distValve < 25 && this.activePreset !== 'Pont du Gard Valley') {
      this.siphonValve = this.siphonValve > 0.5 ? 0.25 : 1.0;
      this.calculateHydraulics();
      this.playAudioTone(320, 0.2, 'square');
      return;
    }

    // Dropping tracer dye / sediment into the water
    for (let i = 0; i < 8; i++) {
      this.sedimentNodes.push({
        x: pos.x + (Math.random() - 0.5) * 12,
        y: pos.y + (Math.random() - 0.5) * 12,
        vx: 30 + Math.random() * 20,
        vy: (Math.random() - 0.5) * 10,
        radius: 1.8 + Math.random() * 1.5,
        settled: false,
        settledTime: 0,
        density: 1750,
        opacity: 0.85
      });
    }
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    const nx = pos.x / this.width;

    // Detect hovered zone for historical annotation tooltip
    if (nx < 0.12) {
      this.hoveredZone = {
        x: pos.x,
        y: pos.y,
        title: 'CAPUT AQUAE (SPRINGHEAD)',
        desc: 'Mountain catchment cave & sluice gate'
      };
    } else if (nx >= 0.12 && nx < 0.35) {
      this.hoveredZone = {
        x: pos.x,
        y: pos.y,
        title: 'ARCUS PONTIS (ELEVATED ARCADE)',
        desc: 'Manning channel with opus signinum lining'
      };
    } else if (nx >= 0.35 && nx < 0.48) {
      this.hoveredZone = {
        x: pos.x,
        y: pos.y,
        title: 'PISCINA LIMARIA (SETTLING BASIN)',
        desc: 'Baffled sump where silt decelerates & drops'
      };
    } else if (nx >= 0.48 && nx < 0.72) {
      if (this.activePreset === 'Pont du Gard Valley') {
        this.hoveredZone = {
          x: pos.x,
          y: pos.y,
          title: 'MONUMENTAL ARCADE (PONT DU GARD)',
          desc: 'Three-tiered limestone bridge across the Gardon'
        };
      } else {
        this.hoveredZone = {
          x: pos.x,
          y: pos.y,
          title: 'SIPHON INVERSUS (INVERTED SIPHON)',
          desc: 'Pressurized lead fistulae crossing deep chasm'
        };
      }
    } else if (nx >= 0.85) {
      this.hoveredZone = {
        x: pos.x,
        y: pos.y,
        title: 'CASTELLUM DIVISORIUM (TERMINUS)',
        desc: 'Bronze calices to Lacus, Thermae, Insulae'
      };
    } else {
      this.hoveredZone = null;
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.triggerFlashFlood();
    } else if (key === 'f' || key === 'F') {
      this.triggerSedimentFlush();
    } else if (key === '1') {
      this.applyPreset('Pont du Gard Valley');
    } else if (key === '2') {
      this.applyPreset('Mountain Siphon Chasm');
    } else if (key === '3') {
      this.applyPreset('City Distribution Castellum');
    }
  }

  onKeyUp(key, e) {
    // Guard handler
  }
}
