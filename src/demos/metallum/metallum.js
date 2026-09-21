// Metallum: Roman Bloomery Iron Smelter & Anvil Forging Physics
// Grounded in Pliny the Elder's Naturalis Historia (Book XXXIV: De Ferro / The Natural History of Metals)
// Chemical Redox Cellular Automata: Fe2O3 + 3CO -> 2Fe + 3CO2, Bellows Draft (1200°C), Slag Tapping & Solid-State Bloom Forging

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export const MATERIAL = {
  CHARCOAL: 0,        // Carbo: Hardwood charcoal fuel (C)
  ORE_HEMATITE: 1,    // Vena Ferri: Raw red iron ore (Fe2O3)
  ORE_MAGNETITE: 2,   // Reduced stage 1 (Fe3O4)
  ORE_WUSTITE: 3,     // Reduced stage 2 (FeO)
  SPONGE_IRON: 4,     // Ferrum Spongiosum: Solid metallic iron (Fe)
  FLUX_LIMESTONE: 5,  // Calx: Calcium carbonate limestone (CaCO3)
  SLAG: 6             // Scoria: Molten/solidified fayalite & silicate slag
};

export const MATERIAL_CONFIG = {
  [MATERIAL.CHARCOAL]: {
    name: 'Carbo (Charcoal)',
    symbol: 'C',
    color: '#2a2624',
    glowColor: '#ff4d00',
    hotColor: '#ffaa33',
    density: 0.65,
    restitution: 0.2,
    friction: 0.75
  },
  [MATERIAL.ORE_HEMATITE]: {
    name: 'Hematite (Raw Ore)',
    symbol: 'Fe₂O₃',
    color: '#8b3a2b',
    glowColor: '#c4452e',
    hotColor: '#ff7744',
    density: 5.2,
    restitution: 0.25,
    friction: 0.8
  },
  [MATERIAL.ORE_MAGNETITE]: {
    name: 'Magnetite (Intermediate)',
    symbol: 'Fe₃O₄',
    color: '#3d383b',
    glowColor: '#a84a32',
    hotColor: '#ff8855',
    density: 5.1,
    restitution: 0.25,
    friction: 0.8
  },
  [MATERIAL.ORE_WUSTITE]: {
    name: 'Wüstite (Reduced Oxide)',
    symbol: 'FeO',
    color: '#4a4843',
    glowColor: '#bd5329',
    hotColor: '#ffa044',
    density: 5.7,
    restitution: 0.22,
    friction: 0.82
  },
  [MATERIAL.SPONGE_IRON]: {
    name: 'Sponge Iron (Ferrum)',
    symbol: '2Fe',
    color: '#9ba0a6',
    glowColor: '#ff9933',
    hotColor: '#fff5cc',
    density: 7.8,
    restitution: 0.15,
    friction: 0.9
  },
  [MATERIAL.FLUX_LIMESTONE]: {
    name: 'Calx (Limestone Flux)',
    symbol: 'CaCO₃',
    color: '#d6cdbe',
    glowColor: '#e09867',
    hotColor: '#ffbe88',
    density: 2.7,
    restitution: 0.3,
    friction: 0.7
  },
  [MATERIAL.SLAG]: {
    name: 'Scoria (Liquid Slag)',
    symbol: 'Fe₂SiO₄',
    color: '#1a1714',
    glowColor: '#e65c00',
    hotColor: '#ffcc00',
    density: 3.8,
    restitution: 0.05,
    friction: 0.95
  }
};

// Procedural Web Audio Synthesizer (fully safe in headless / mock environments)
class MetallumAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.isMuted = false;
    this.init();
  }

  init() {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.enabled = true;
      }
    } catch {
      this.enabled = false;
    }
  }

  ensureContext() {
    if (!this.enabled || !this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx.state === 'running';
  }

  playBellowsWhoosh() {
    if (!this.ensureContext()) return;
    try {
      const now = this.ctx.currentTime;
      // White noise buffer for air puff
      const bufSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.4));
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(850, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.45);
      filter.Q.value = 3.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(now);
      source.stop(now + 0.45);
    } catch {}
  }

  playHammerClang(consolidation = 0.5) {
    if (!this.ensureContext()) return;
    try {
      const now = this.ctx.currentTime;
      // Dual resonant bell modes for forged Roman iron anvil
      const freqs = [
        680 + consolidation * 320,
        1420 + consolidation * 600,
        2840 + consolidation * 900
      ];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const decay = 0.25 + (1 - idx * 0.25) * 0.6 * (0.4 + consolidation * 0.6);
        const peakGain = (0.22 / (idx + 1)) * (0.8 + consolidation * 0.4);

        gain.gain.setValueAtTime(peakGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay);
      });

      // Low impact thump
      const thump = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(160, now);
      thump.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      thumpGain.gain.setValueAtTime(0.35, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      thump.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);
      thump.start(now);
      thump.stop(now + 0.14);
    } catch {}
  }

  playSlagHiss() {
    if (!this.ensureContext()) return;
    try {
      const now = this.ctx.currentTime;
      const bufSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(now);
      source.stop(now + 0.35);
    } catch {}
  }

  destroy() {
    try {
      if (this.ctx && this.ctx.close) {
        this.ctx.close();
      }
    } catch {}
    this.ctx = null;
    this.enabled = false;
  }
}

export class MetallumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    attachTouchBridge(this, canvas);

    // Simulation time and speed
    this.elapsedTime = 0;
    this.simSpeed = 1.0;
    this.nextParticleId = 1;

    // Thermodynamic & Chemical State
    this.tuyereTemp = 850; // Starting smolder temp °C (range 400°C - 1350°C)
    this.throatTemp = 420; // Upper shaft temp °C
    this.targetTemp = 850;
    this.bellowsPumpingSpeed = 45; // % automatic bellows stroke speed (0 - 100)
    this.bellowsPhase = 0;
    this.bellowsStroke = 0;
    this.bellowsPuffTimer = 0;
    this.coRatio = 0.45; // Carbon monoxide reducing ratio (0 - 1)
    this.co2Ratio = 0.55;
    this.reductionEfficiency = 0.85;

    // Active Particulate Systems (Entities)
    this.burden = [];          // Solid particles in the furnace stack (Charcoal, Ore, Flux, Sponge Iron)
    this.slagDroplets = [];    // Liquid slag drops percolating / tapping
    this.forgeSparks = [];     // Incandescent sparks from anvil strikes
    this.gasParticles = [];    // Updraft gas and smoke particles
    this.tapStream = [];       // Flowing tapped slag stream particles

    // Slag Basin & Tapping Mechanism
    this.slagBasinLevel = 18;  // % slag accumulated in crucible hearth (0 - 100)
    this.slagTapped = false;   // Whether taphole clay plug is breached
    this.tapTimer = 0;         // Tapping duration countdown
    this.tappedTotalKg = 0;    // Telemetry total slag drained

    // Iron Bloom on the Anvil (Lupa / Massa Ferri)
    this.anvilBloom = {
      massKg: 4.8,             // Mass in kg
      consolidation: 0.15,      // 0.0 (raw sponge) to 1.0 (pure wrought iron)
      temp: 1100,              // Temperature on anvil in °C
      slagContent: 0.32,        // Trapped slag percentage
      shapeWidth: 64,          // Width px
      shapeHeight: 46,         // Height px
      squashFactor: 1.0,       // Dynamic squashing on impact
      strikesCount: 0,         // Number of hammer blows delivered
      isForged: false          // High-purity wrought iron achieved
    };

    // Smith's Hammer & Forging State
    this.hammer = {
      armAngle: -0.65,         // Resting cocked angle (radians)
      targetAngle: -0.65,
      angularVelocity: 0,
      isStriking: false,
      strikeProgress: 0,
      impactFlash: 0
    };

    // User Interaction & Charge Selection
    this.selectedCharge = MATERIAL.ORE_HEMATITE;
    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.5,
      isDown: false,
      downX: 0,
      downY: 0
    };

    // Audio Synthesizer
    this.audio = new MetallumAudio();

    // Visual Alerts / Triumphs
    this.bannerMessage = 'PLINII NATURALIS HISTORIA • LIBER XXXIV: METALLUM';
    this.bannerTimer = 4.0;
    this.triumphTimer = 0;

    // DOM Controls References
    this.domControls = {};

    // Layout Geometry Setup
    this.initGeometry();
    this.buildControls();
    this.reset();
  }

  initGeometry() {
    const w = this.width;
    const h = this.height;

    // Bloomery Furnace Cross-Section (Left-Center)
    this.furnace = {
      x: w * 0.06,
      y: h * 0.15,
      w: w * 0.46,
      h: h * 0.74,
      // Throat (top opening)
      throatX1: w * 0.17,
      throatX2: w * 0.36,
      throatY: h * 0.16,
      // Belly / Bosh (widest part of shaft)
      boshX1: w * 0.10,
      boshX2: w * 0.43,
      boshY: h * 0.55,
      // Hearth (bottom crucible)
      hearthX1: w * 0.14,
      hearthX2: w * 0.39,
      hearthY: h * 0.82,
      // Tuyère (air inlet nozzle on left)
      tuyereX: w * 0.135,
      tuyereY: h * 0.71,
      tuyereRadius: 9,
      // Taphole (slag drain on right)
      tapX: w * 0.39,
      tapY: h * 0.81,
      // Slag Pit (outside furnace to right of taphole)
      slagPitX: w * 0.43,
      slagPitY: h * 0.85,
      slagPitW: w * 0.08,
      slagPitH: h * 0.04
    };

    // Leather Bellows Apparatus (Left of Furnace)
    this.bellows = {
      x: w * 0.02,
      y: h * 0.65,
      w: w * 0.10,
      h: h * 0.12,
      pipeEndX: this.furnace.tuyereX,
      pipeEndY: this.furnace.tuyereY
    };

    // Smith's Anvil Station (Right Side)
    this.anvil = {
      baseX: w * 0.64,
      baseY: h * 0.62,
      w: w * 0.28,
      h: h * 0.27,
      topFaceX: w * 0.68,
      topFaceY: h * 0.62,
      topFaceW: w * 0.20,
      bloomX: w * 0.77,
      bloomY: h * 0.59,
      hammerPivotX: w * 0.89,
      hammerPivotY: h * 0.42
    };
  }

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Charge Selection (Furnace Burden)</span>
        </label>
        <div class="control-btn-grid" id="charge-selector">
          <button class="sub-btn ${this.selectedCharge === MATERIAL.ORE_HEMATITE ? 'active' : ''}" data-mat="${MATERIAL.ORE_HEMATITE}">
            ⛏️ Ore (Fe₂O₃) [1]
          </button>
          <button class="sub-btn ${this.selectedCharge === MATERIAL.CHARCOAL ? 'active' : ''}" data-mat="${MATERIAL.CHARCOAL}">
            🪵 Charcoal (C) [2]
          </button>
          <button class="sub-btn ${this.selectedCharge === MATERIAL.FLUX_LIMESTONE ? 'active' : ''}" data-mat="${MATERIAL.FLUX_LIMESTONE}">
            🪨 Flux (CaCO₃) [3]
          </button>
          <button class="sub-btn" id="btn-auto-charge" style="border-color: var(--accent-gold);">
            ⚖️ Balanced Batch [4]
          </button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>Bellows Draft Speed</span>
          <span id="val-bellows">${Math.round(this.bellowsPumpingSpeed)}% (${Math.round(this.tuyereTemp)}°C)</span>
        </label>
        <input type="range" id="slider-bellows" min="0" max="100" step="1" value="${this.bellowsPumpingSpeed}">
      </div>

      <div class="control-btn-grid" style="margin-top: 6px;">
        <button id="btn-pump-bellows" class="sub-btn" style="background: rgba(255, 120, 30, 0.2); border-color: #ff7722; font-weight: 600;">
          💨 Pump Bellows [B]
        </button>
        <button id="btn-tap-slag" class="sub-btn" style="background: rgba(255, 60, 0, 0.2); border-color: #ff4400; font-weight: 600;">
          🌋 Tap Slag [T]
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="btn-hammer-bloom" class="sub-btn" style="background: rgba(212, 175, 55, 0.25); border-color: #ffd700; color: #ffd700; font-weight: 700; padding: 10px 6px;">
          🔨 Hammer Bloom on Anvil [Space]
        </button>
      </div>

      <div class="control-btn-grid" style="margin-top: 6px;">
        <button id="btn-extract-bloom" class="sub-btn" style="font-size: 0.72rem;">
          🔥 Reheat Bloom [H]
        </button>
        <button id="btn-clear-burden" class="sub-btn" style="font-size: 0.72rem;">
          🧹 Reset Smelter [R]
        </button>
      </div>
    `;

    // Cache elements
    this.domControls = {
      chargeBtns: this.controlsContainer.querySelectorAll('#charge-selector .sub-btn[data-mat]'),
      btnAutoCharge: this.controlsContainer.querySelector('#btn-auto-charge'),
      sliderBellows: this.controlsContainer.querySelector('#slider-bellows'),
      valBellows: this.controlsContainer.querySelector('#val-bellows'),
      btnPumpBellows: this.controlsContainer.querySelector('#btn-pump-bellows'),
      btnTapSlag: this.controlsContainer.querySelector('#btn-tap-slag'),
      btnHammerBloom: this.controlsContainer.querySelector('#btn-hammer-bloom'),
      btnExtractBloom: this.controlsContainer.querySelector('#btn-extract-bloom'),
      btnClearBurden: this.controlsContainer.querySelector('#btn-clear-burden')
    };

    // Bind charge selection
    this.domControls.chargeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.domControls.chargeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCharge = parseInt(btn.dataset.mat, 10);
        this.chargeMaterial(this.selectedCharge, 8);
      });
    });

    if (this.domControls.btnAutoCharge) {
      this.domControls.btnAutoCharge.addEventListener('click', () => {
        this.chargeBalancedBurden();
      });
    }

    if (this.domControls.sliderBellows) {
      this.domControls.sliderBellows.addEventListener('input', (e) => {
        this.bellowsPumpingSpeed = parseFloat(e.target.value);
        this.updateControlLabels();
      });
    }

    if (this.domControls.btnPumpBellows) {
      this.domControls.btnPumpBellows.addEventListener('click', () => {
        this.manualPumpBellows();
      });
    }

    if (this.domControls.btnTapSlag) {
      this.domControls.btnTapSlag.addEventListener('click', () => {
        this.tapSlag();
      });
    }

    if (this.domControls.btnHammerBloom) {
      this.domControls.btnHammerBloom.addEventListener('click', () => {
        this.strikeHammer();
      });
    }

    if (this.domControls.btnExtractBloom) {
      this.domControls.btnExtractBloom.addEventListener('click', () => {
        this.reheatBloom();
      });
    }

    if (this.domControls.btnClearBurden) {
      this.domControls.btnClearBurden.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  updateControlLabels() {
    if (!this.domControls.valBellows) return;
    this.domControls.valBellows.textContent = `${Math.round(this.bellowsPumpingSpeed)}% (${Math.round(this.tuyereTemp)}°C)`;
  }

  reset() {
    this.burden = [];
    this.slagDroplets = [];
    this.forgeSparks = [];
    this.gasParticles = [];
    this.tapStream = [];

    this.tuyereTemp = 850;
    this.throatTemp = 420;
    this.targetTemp = 850;
    this.slagBasinLevel = 15;
    this.slagTapped = false;
    this.tapTimer = 0;
    this.tappedTotalKg = 0;

    this.anvilBloom = {
      massKg: 4.8,
      consolidation: 0.15,
      temp: 1100,
      slagContent: 0.32,
      shapeWidth: 64,
      shapeHeight: 46,
      squashFactor: 1.0,
      strikesCount: 0,
      isForged: false
    };

    this.hammer.isStriking = false;
    this.hammer.armAngle = -0.65;
    this.hammer.targetAngle = -0.65;
    this.hammer.impactFlash = 0;

    // Populate initial furnace burden column (alternating layers of charcoal and iron ore)
    this.seedInitialBurden();
  }

  seedInitialBurden() {
    const f = this.furnace;
    const numRows = 16;
    const particlesPerRow = 9;

    for (let r = 0; r < numRows; r++) {
      const fracY = r / (numRows - 1);
      // Interpolate width between throat, bosh, and hearth
      let leftX, rightX, py;
      if (fracY < 0.6) {
        const t = fracY / 0.6;
        leftX = f.throatX1 + (f.boshX1 - f.throatX1) * t;
        rightX = f.throatX2 + (f.boshX2 - f.throatX2) * t;
        py = f.throatY + (f.boshY - f.throatY) * t;
      } else {
        const t = (fracY - 0.6) / 0.4;
        leftX = f.boshX1 + (f.hearthX1 - f.boshX1) * t;
        rightX = f.boshX2 + (f.hearthX2 - f.boshX2) * t;
        py = f.boshY + (f.hearthY - f.boshY) * t;
      }

      // Layer alternating materials: Charcoal base, then Hematite & Limestone
      const isCharcoalLayer = (r % 2 === 0) || r > 12;
      const isFlux = (r % 5 === 0);

      for (let c = 0; c < particlesPerRow; c++) {
        const fracX = (c + 0.5 + (Math.random() * 0.4 - 0.2)) / particlesPerRow;
        const px = leftX + (rightX - leftX) * fracX;
        const yOffset = (Math.random() - 0.5) * 6;

        let mat = MATERIAL.CHARCOAL;
        if (!isCharcoalLayer) {
          mat = isFlux ? MATERIAL.FLUX_LIMESTONE : MATERIAL.ORE_HEMATITE;
        }

        // Deeper particles in hearth have partially reduced states
        if (mat === MATERIAL.ORE_HEMATITE && fracY > 0.75) {
          mat = MATERIAL.ORE_WUSTITE;
        } else if (mat === MATERIAL.ORE_HEMATITE && fracY > 0.45) {
          mat = MATERIAL.ORE_MAGNETITE;
        }

        this.addBurdenParticle(px, py + yOffset, mat, 4.5 + Math.random() * 2.5);
      }
    }
  }

  addBurdenParticle(x, y, materialType, radius = 5.5) {
    const cfg = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG[MATERIAL.CHARCOAL];
    const particle = {
      id: this.nextParticleId++,
      type: materialType,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 20,
      radius: radius,
      mass: (radius * radius * 0.1) * (cfg.density || 1.0),
      temp: this.throatTemp + (this.tuyereTemp - this.throatTemp) * ((y - this.furnace.throatY) / (this.furnace.hearthY - this.furnace.throatY + 1)),
      reduction: materialType === MATERIAL.SPONGE_IRON ? 1.0 : (materialType === MATERIAL.ORE_WUSTITE ? 0.66 : (materialType === MATERIAL.ORE_MAGNETITE ? 0.33 : 0.0)),
      burnTime: 0,
      maxBurnTime: 12 + Math.random() * 10,
      slagYield: materialType === MATERIAL.ORE_HEMATITE ? 0.25 : (materialType === MATERIAL.FLUX_LIMESTONE ? 0.7 : 0),
      age: 0
    };
    this.burden.push(particle);
    return particle;
  }

  chargeMaterial(materialType, count = 8) {
    const f = this.furnace;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() * 0.8 + 0.1);
      const px = f.throatX1 + (f.throatX2 - f.throatX1) * spread;
      const py = f.throatY - 15 - Math.random() * 25;
      const rad = 4.2 + Math.random() * 2.8;
      this.addBurdenParticle(px, py, materialType, rad);
    }
  }

  chargeBalancedBurden() {
    // Ancient Roman recipe: 4 parts Charcoal to 2 parts Hematite to 1 part Limestone
    this.chargeMaterial(MATERIAL.CHARCOAL, 10);
    this.chargeMaterial(MATERIAL.ORE_HEMATITE, 6);
    this.chargeMaterial(MATERIAL.FLUX_LIMESTONE, 3);
  }

  manualPumpBellows() {
    this.audio.playBellowsWhoosh();
    this.bellowsStroke = 1.0;
    this.tuyereTemp = Math.min(1320, this.tuyereTemp + 35);
    this.spawnBellowsDraftParticles(25);
  }

  spawnBellowsDraftParticles(count = 15) {
    const f = this.furnace;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.45) * 0.55;
      const speed = 140 + Math.random() * 180;
      this.gasParticles.push({
        x: f.tuyereX + 5,
        y: f.tuyereY + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        temp: this.tuyereTemp,
        life: 0.8 + Math.random() * 0.8,
        maxLife: 1.6,
        radius: 3 + Math.random() * 3,
        type: 'air_blast'
      });
    }
  }

  tapSlag() {
    if (this.slagTapped) return;
    this.slagTapped = true;
    this.tapTimer = 6.0; // 6 seconds of fiery slag drainage
    this.audio.playSlagHiss();
    this.bannerMessage = 'SCORIAE EMISSIO • SLAG TAPPED FROM CRUCIBLE HEARTH';
    this.bannerTimer = 3.5;
  }

  strikeHammer() {
    if (this.hammer.isStriking) return;
    this.hammer.isStriking = true;
    this.hammer.strikeProgress = 0;
    this.hammer.targetAngle = 0.28; // Down on anvil face
    this.hammer.angularVelocity = 14;

    // Trigger audio & impact physics after brief downswing
    setTimeout(() => {
      this.deliverHammerBlow();
    }, 90);
  }

  deliverHammerBlow() {
    const b = this.anvilBloom;
    b.strikesCount++;

    // Calculate consolidation gains
    const prevCons = b.consolidation;
    const gain = (1.0 - b.consolidation) * 0.14;
    b.consolidation = Math.min(1.0, b.consolidation + gain);

    // Expel trapped slag inclusions
    const slagExpelled = b.slagContent * 0.24;
    b.slagContent = Math.max(0.02, b.slagContent - slagExpelled);

    // Bloom flattening / squashing dynamics
    b.squashFactor = 0.72;
    b.shapeWidth = Math.min(96, b.shapeWidth + 3.2);
    b.shapeHeight = Math.max(26, b.shapeHeight - 1.8);

    // Reheat slightly from plastic mechanical deformation
    b.temp = Math.min(1150, b.temp + 22);

    // Play anvil chime
    this.audio.playHammerClang(b.consolidation);
    this.hammer.impactFlash = 1.0;

    // Scatter shower of incandescent forge sparks
    const sparkCount = Math.floor(40 + (1.0 - b.consolidation) * 50);
    this.spawnForgeSparks(this.anvil.bloomX, this.anvil.bloomY - 6, sparkCount);

    // Check for high-purity wrought iron achievement
    if (b.consolidation >= 0.95 && !b.isForged) {
      b.isForged = true;
      this.triumphTimer = 6.0;
      this.bannerMessage = 'FERRUM PURUM FABRICATUM! • REFINED ROMAN WROUGHT IRON';
      this.bannerTimer = 6.0;
    }
  }

  spawnForgeSparks(x, y, count = 50) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.35;
      const speed = 180 + Math.random() * 420;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const temp = 1100 + Math.random() * 250;

      this.forgeSparks.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 8,
        prevX: x,
        prevY: y,
        vx: vx,
        vy: vy,
        temp: temp,
        life: 0.6 + Math.random() * 1.1,
        maxLife: 1.7,
        radius: 1.2 + Math.random() * 1.8,
        bounces: 0
      });
    }
  }

  reheatBloom() {
    // Return bloom to furnace tuyère zone to reheat
    this.anvilBloom.temp = 1200;
    this.anvilBloom.squashFactor = 1.0;
    this.audio.playSlagHiss();
    this.bannerMessage = 'REHEATING BLOOM IN CHARCOAL EMBERS';
    this.bannerTimer = 2.5;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    this.initGeometry();
  }

  update(dt) {
    const delta = Math.min(dt, 0.05) * this.simSpeed;
    this.elapsedTime += delta;

    if (this.bannerTimer > 0) this.bannerTimer -= delta;
    if (this.triumphTimer > 0) this.triumphTimer -= delta;

    // 1. Automatic Bellows Pumping & Thermodynamic Draft
    this.updateBellowsAndDraft(delta);

    // 2. Chemical Redox & Combustion Cellular Automata
    this.updateChemicalReactions(delta);

    // 3. Furnace Burden Physics (Granular Motion & Gravity)
    this.updateBurdenPhysics(delta);

    // 4. Molten Slag Percolation & Drainage
    this.updateSlagDynamics(delta);

    // 5. Gas Updraft & Thermal Smoke
    this.updateGasAndSmoke(delta);

    // 6. Anvil Smithing & Spark Ballistics
    this.updateForgeAndHammer(delta);

    // Update Control Labels occasionally
    if (Math.floor(this.elapsedTime * 10) % 5 === 0) {
      this.updateControlLabels();
    }
  }

  updateBellowsAndDraft(dt) {
    // Periodic stroke cycle based on pumping speed
    if (this.bellowsPumpingSpeed > 0) {
      const freq = 0.5 + (this.bellowsPumpingSpeed / 100) * 2.0; // 0.5 to 2.5 Hz
      this.bellowsPhase += dt * freq * Math.PI * 2;
      this.bellowsStroke = (Math.sin(this.bellowsPhase) + 1) * 0.5;

      // Puff draft air into tuyère at peak stroke
      this.bellowsPuffTimer += dt;
      if (this.bellowsPuffTimer > (1.0 / freq)) {
        this.bellowsPuffTimer = 0;
        this.spawnBellowsDraftParticles(Math.floor(4 + this.bellowsPumpingSpeed * 0.15));
      }

      // Heat generation proportional to air blast rate
      this.targetTemp = 600 + (this.bellowsPumpingSpeed / 100) * 650; // up to 1250°C
    } else {
      this.bellowsStroke = Math.max(0, this.bellowsStroke - dt * 2.0);
      this.targetTemp = 480; // Passive smolder
    }

    // Thermal inertia
    const lerpRate = dt * 0.8;
    this.tuyereTemp += (this.targetTemp - this.tuyereTemp) * lerpRate;
    this.throatTemp = 320 + (this.tuyereTemp - 600) * 0.35;

    // Equilibrium gas ratios (Boudouard reaction: CO2 + C <=> 2CO at > 900°C)
    const hotZone = Math.max(0, (this.tuyereTemp - 750) / 500);
    this.coRatio = 0.25 + hotZone * 0.65; // High CO in hot charcoal
    this.co2Ratio = 1.0 - this.coRatio;
  }

  updateChemicalReactions(dt) {
    const f = this.furnace;

    for (let i = this.burden.length - 1; i >= 0; i--) {
      const p = this.burden[i];
      p.age += dt;

      // Local temperature interpolation based on height in furnace
      const heightFrac = Math.max(0, Math.min(1, (p.y - f.throatY) / (f.hearthY - f.throatY)));
      const ambientTemp = this.throatTemp + (this.tuyereTemp - this.throatTemp) * Math.pow(heightFrac, 1.4);
      p.temp += (ambientTemp - p.temp) * dt * 1.5;

      // CHARCOAL COMBUSTION (C + O2 -> CO2 + Heat)
      if (p.type === MATERIAL.CHARCOAL) {
        if (p.temp > 650) {
          p.burnTime += dt * (p.temp / 900);
          // Shrink slowly as carbon is oxidized
          p.radius = Math.max(2.0, p.radius - dt * 0.08);

          // Charcoal depleted -> turns into rising gas / ash
          if (p.burnTime >= p.maxBurnTime || p.radius <= 2.2) {
            this.burden.splice(i, 1);
            continue;
          }
        }
      }

      // IRON ORE REDOX REDUCTION (Fe2O3 -> Fe3O4 -> FeO -> 2Fe)
      else if (
        p.type === MATERIAL.ORE_HEMATITE ||
        p.type === MATERIAL.ORE_MAGNETITE ||
        p.type === MATERIAL.ORE_WUSTITE
      ) {
        if (p.temp > 580 && this.coRatio > 0.3) {
          const reductionRate = dt * (p.temp / 1000) * this.coRatio * 0.22;
          p.reduction = Math.min(1.0, p.reduction + reductionRate);

          // Phase transition 1: Hematite -> Magnetite
          if (p.type === MATERIAL.ORE_HEMATITE && p.reduction > 0.33) {
            p.type = MATERIAL.ORE_MAGNETITE;
          }
          // Phase transition 2: Magnetite -> Wüstite
          else if (p.type === MATERIAL.ORE_MAGNETITE && p.reduction > 0.66) {
            p.type = MATERIAL.ORE_WUSTITE;
          }
          // Phase transition 3: Wüstite -> Metallic Sponge Iron!
          else if (p.type === MATERIAL.ORE_WUSTITE && p.reduction >= 0.98) {
            p.type = MATERIAL.SPONGE_IRON;
            // Spawn separate molten slag droplet from released silicate gangue
            this.spawnSlagDroplet(p.x, p.y + p.radius);
            this.slagBasinLevel = Math.min(100, this.slagBasinLevel + 1.2);
          }
        }
      }

      // LIMESTONE FLUX CALCINATION & SLAG LIQUEFACTION (CaCO3 -> CaO + CO2)
      else if (p.type === MATERIAL.FLUX_LIMESTONE) {
        if (p.temp > 820) {
          p.burnTime += dt;
          if (p.burnTime > 4.5) {
            // Converts directly into fluid slag droplet
            this.spawnSlagDroplet(p.x, p.y);
            this.slagBasinLevel = Math.min(100, this.slagBasinLevel + 2.5);
            this.burden.splice(i, 1);
            continue;
          }
        }
      }

      // SPONGE IRON SOLID-STATE SINTERING (Grows iron bloom)
      else if (p.type === MATERIAL.SPONGE_IRON) {
        // In hearth zone, sponge iron aggregates into the growing bloom
        if (p.y > f.hearthY - 35 && p.temp > 1000) {
          this.anvilBloom.massKg = Math.min(18.0, this.anvilBloom.massKg + 0.05);
          // Slowly absorb particles to prevent entity bloat while growing the bloom
          if (Math.random() < 0.03 && this.burden.length > 70) {
            this.burden.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  updateBurdenPhysics(dt) {
    const f = this.furnace;
    const gravity = 85; // px/s² descending granular gravity
    const damping = 0.88;

    for (let i = 0; i < this.burden.length; i++) {
      const p = this.burden[i];

      // Downward gravity
      p.vy += gravity * dt;
      p.vx *= damping;
      p.vy *= damping;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Conical furnace wall containment
      const wallBounds = this.getFurnaceWallBounds(p.y);
      if (p.x - p.radius < wallBounds.left) {
        p.x = wallBounds.left + p.radius;
        p.vx = Math.abs(p.vx) * 0.3;
      } else if (p.x + p.radius > wallBounds.right) {
        p.x = wallBounds.right - p.radius;
        p.vx = -Math.abs(p.vx) * 0.3;
      }

      // Bottom hearth floor
      if (p.y + p.radius > f.hearthY) {
        p.y = f.hearthY - p.radius;
        p.vy = 0;
      }
    }

    // Granular soft repulsion between nearby burden particles (stacking support)
    const len = this.burden.length;
    for (let i = 0; i < len; i++) {
      const p1 = this.burden[i];
      // Compare with a subset of nearby particles for efficiency
      const step = Math.max(1, Math.floor(len / 45));
      for (let j = i + 1; j < Math.min(len, i + 14); j += step) {
        const p2 = this.burden[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const minDist = p1.radius + p2.radius;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;

          p1.x -= nx * overlap;
          p1.y -= ny * overlap;
          p2.x += nx * overlap;
          p2.y += ny * overlap;

          // Transfer vertical support
          p1.vy *= 0.85;
          p2.vy *= 0.85;
        }
      }
    }
  }

  getFurnaceWallBounds(y) {
    const f = this.furnace;
    if (y <= f.throatY) {
      return { left: f.throatX1, right: f.throatX2 };
    } else if (y <= f.boshY) {
      const t = (y - f.throatY) / (f.boshY - f.throatY);
      return {
        left: f.throatX1 + (f.boshX1 - f.throatX1) * t,
        right: f.throatX2 + (f.boshX2 - f.throatX2) * t
      };
    } else {
      const t = (y - f.boshY) / (f.hearthY - f.boshY);
      return {
        left: f.boshX1 + (f.hearthX1 - f.boshX1) * t,
        right: f.boshX2 + (f.hearthX2 - f.boshX2) * t
      };
    }
  }

  spawnSlagDroplet(x, y) {
    this.slagDroplets.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: 15 + Math.random() * 25,
      radius: 2.2 + Math.random() * 1.8,
      temp: this.tuyereTemp,
      viscosity: 0.92,
      life: 0
    });
  }

  updateSlagDynamics(dt) {
    const f = this.furnace;

    // Percolating droplets inside the furnace
    for (let i = this.slagDroplets.length - 1; i >= 0; i--) {
      const s = this.slagDroplets[i];
      s.life += dt;
      s.vy += 120 * dt; // viscous gravity
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Wall bounds
      const bounds = this.getFurnaceWallBounds(s.y);
      if (s.x < bounds.left + 2) s.x = bounds.left + 2;
      if (s.x > bounds.right - 2) s.x = bounds.right - 2;

      // Reached hearth bottom pool
      if (s.y >= f.hearthY - 4) {
        this.slagDroplets.splice(i, 1);
        this.slagBasinLevel = Math.min(100, this.slagBasinLevel + 0.4);
      }
    }

    // Slag Tapping Stream (draining out through the taphole)
    if (this.slagTapped) {
      this.tapTimer -= dt;
      if (this.slagBasinLevel > 2) {
        this.slagBasinLevel = Math.max(0, this.slagBasinLevel - dt * 14);
        this.tappedTotalKg += dt * 0.85;

        // Spawn glowing stream droplets exiting taphole
        for (let k = 0; k < 3; k++) {
          this.tapStream.push({
            x: f.tapX + Math.random() * 4,
            y: f.tapY + Math.random() * 4,
            vx: 40 + Math.random() * 45,
            vy: 20 + Math.random() * 30,
            temp: 1160,
            radius: 2.5 + Math.random() * 2.0,
            life: 1.5,
            maxLife: 1.5
          });
        }
      }

      if (this.tapTimer <= 0 || this.slagBasinLevel <= 2) {
        this.slagTapped = false;
        this.bannerMessage = 'TAPHOLE PLUGGED WITH CLAY • SLAG DISCHARGED';
        this.bannerTimer = 3.0;
      }
    }

    // Update tapped slag stream particles
    for (let i = this.tapStream.length - 1; i >= 0; i--) {
      const tp = this.tapStream[i];
      tp.life -= dt;
      tp.vy += 220 * dt;
      tp.x += tp.vx * dt;
      tp.y += tp.vy * dt;

      // Settle in external slag pit
      if (tp.y >= f.slagPitY + f.slagPitH) {
        tp.y = f.slagPitY + f.slagPitH;
        tp.vx *= 0.5;
        tp.vy = 0;
      }

      if (tp.life <= 0) {
        this.tapStream.splice(i, 1);
      }
    }
  }

  updateGasAndSmoke(dt) {
    const f = this.furnace;

    // Updraft smoke particles ascending through the charge
    for (let i = this.gasParticles.length - 1; i >= 0; i--) {
      const g = this.gasParticles[i];
      g.life -= dt;

      // Upward convection and wind dispersion
      g.vy -= 140 * dt;
      g.vx += (Math.random() - 0.48) * 45 * dt;

      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.radius += dt * 3.5;

      if (g.life <= 0 || g.y < f.throatY - 80) {
        this.gasParticles.splice(i, 1);
      }
    }

    // Ambient smoke puffs from stack top
    if (this.tuyereTemp > 500 && Math.random() < 0.35) {
      const px = f.throatX1 + Math.random() * (f.throatX2 - f.throatX1);
      this.gasParticles.push({
        x: px,
        y: f.throatY - 5,
        vx: (Math.random() - 0.45) * 20,
        vy: -30 - Math.random() * 40,
        temp: this.throatTemp,
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2.0,
        radius: 4 + Math.random() * 4,
        type: 'chimney_smoke'
      });
    }
  }

  updateForgeAndHammer(dt) {
    const b = this.anvilBloom;

    // Cool bloom slowly over time on anvil
    if (b.temp > 250) {
      b.temp -= dt * 7.5; // ~7.5°C per second cooling
    }

    // Squash factor restoration spring
    b.squashFactor += (1.0 - b.squashFactor) * dt * 6.0;

    // Hammer swinging physics
    if (this.hammer.isStriking) {
      this.hammer.strikeProgress += dt * 9.0;
      if (this.hammer.strikeProgress >= 1.0) {
        this.hammer.isStriking = false;
        this.hammer.targetAngle = -0.65; // Return to cocked position
      }
    }

    // Smooth angle interpolation
    this.hammer.armAngle += (this.hammer.targetAngle - this.hammer.armAngle) * dt * 14.0;
    if (this.hammer.impactFlash > 0) {
      this.hammer.impactFlash = Math.max(0, this.hammer.impactFlash - dt * 4.0);
    }

    // Forge sparks ballistic motion & floor collision
    const floorY = this.height * 0.88;
    const anvilTop = this.anvil.topFaceY;

    for (let i = this.forgeSparks.length - 1; i >= 0; i--) {
      const s = this.forgeSparks[i];
      s.life -= dt;
      s.prevX = s.x;
      s.prevY = s.y;

      // Gravity & air drag
      s.vy += 980 * dt;
      s.vx *= Math.pow(0.98, dt * 60);
      s.vy *= Math.pow(0.98, dt * 60);

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Cool spark temperature
      s.temp = Math.max(200, s.temp - dt * 900);

      // Bounce against anvil face
      if (s.x > this.anvil.topFaceX && s.x < this.anvil.topFaceX + this.anvil.topFaceW) {
        if (s.y >= anvilTop && s.prevY <= anvilTop) {
          s.y = anvilTop;
          s.vy = -Math.abs(s.vy) * 0.38;
          s.bounces++;
        }
      }

      // Bounce against stone ground floor
      if (s.y >= floorY) {
        s.y = floorY;
        s.vy = -Math.abs(s.vy) * 0.42;
        s.vx *= 0.65;
        s.bounces++;
      }

      if (s.life <= 0 || s.bounces > 4) {
        this.forgeSparks.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------
  // Rendering Pass
  // -------------------------------------------------------------
  render(ctx) {
    ctx.save();

    // 1. Dark Roman Workshop & Smithy Ambient Background
    this.renderSmithyBackground(ctx);

    // 2. Bloomery Furnace Stack (Refractory Wall & Cutaway Interior)
    this.renderBloomeryFurnace(ctx);

    // 3. Furnace Burden Particles (Charcoal, Ore, Flux, Reduced Iron)
    this.renderBurdenParticles(ctx);

    // 4. Molten Slag Drops, Hearth Pool & Tapping Stream
    this.renderSlagAndTapping(ctx);

    // 5. Gas, Updraft Flame & Smoke Plume
    this.renderGasAndSmoke(ctx);

    // 6. Leather Bellows Apparatus
    this.renderBellows(ctx);

    // 7. Smith's Anvil, Glowing Bloom, Sparks & Hammer
    this.renderAnvilAndForge(ctx);

    // 8. Classical Roman Telemetry Banner & HUD
    this.renderRomanHUD(ctx);

    ctx.restore();
  }

  renderSmithyBackground(ctx) {
    const w = this.width;
    const h = this.height;

    // Dark charcoal & stone gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0e1014');
    bgGrad.addColorStop(0.6, '#171921');
    bgGrad.addColorStop(1, '#0c0d11');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Roman stone ashlar masonry floor
    const floorY = h * 0.88;
    ctx.fillStyle = '#1e2129';
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.strokeStyle = '#2b2f3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // Floor flagstone joints
    const stoneW = 85;
    for (let x = 0; x < w; x += stoneW) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + 15, h);
      ctx.stroke();
    }

    // Ambient fiery furnace glow reflection on floor
    const furnaceGlow = ctx.createRadialGradient(
      this.furnace.x + this.furnace.w * 0.5, this.furnace.hearthY,
      20,
      this.furnace.x + this.furnace.w * 0.5, this.furnace.hearthY,
      this.furnace.w * 0.9
    );
    furnaceGlow.addColorStop(0, `rgba(255, 90, 10, ${0.15 + (this.tuyereTemp / 1300) * 0.2})`);
    furnaceGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = furnaceGlow;
    ctx.fillRect(0, this.furnace.y, w, h);
  }

  renderBloomeryFurnace(ctx) {
    const f = this.furnace;

    // Exterior Roman refractory clay & brick stack walls
    ctx.save();

    // Outer wall profile path
    ctx.beginPath();
    ctx.moveTo(f.throatX1 - 28, f.throatY - 10);
    ctx.lineTo(f.boshX1 - 32, f.boshY);
    ctx.lineTo(f.hearthX1 - 34, f.hearthY + 22);
    ctx.lineTo(f.hearthX2 + 34, f.hearthY + 22);
    ctx.lineTo(f.boshX2 + 32, f.boshY);
    ctx.lineTo(f.throatX2 + 28, f.throatY - 10);
    ctx.closePath();

    ctx.fillStyle = '#4a2c22'; // Terracotta clay
    ctx.fill();
    ctx.strokeStyle = '#261510';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cutaway Interior Chamber Path (The Cavity)
    ctx.beginPath();
    ctx.moveTo(f.throatX1, f.throatY);
    ctx.lineTo(f.boshX1, f.boshY);
    ctx.lineTo(f.hearthX1, f.hearthY);
    ctx.lineTo(f.hearthX2, f.hearthY);
    ctx.lineTo(f.boshX2, f.boshY);
    ctx.lineTo(f.throatX2, f.throatY);
    ctx.closePath();

    // Interior soot & thermal glow gradient
    const cavGrad = ctx.createLinearGradient(0, f.throatY, 0, f.hearthY);
    cavGrad.addColorStop(0, '#1a1817');
    cavGrad.addColorStop(0.5, '#261814');
    const glowAlpha = Math.min(0.9, 0.2 + (this.tuyereTemp / 1300) * 0.7);
    cavGrad.addColorStop(1, `rgba(180, 50, 10, ${glowAlpha})`);
    ctx.fillStyle = cavGrad;
    ctx.fill();
    ctx.stroke();

    // Tuyère ceramic inlet pipe (bottom left)
    ctx.fillStyle = '#6e5d53';
    ctx.fillRect(f.tuyereX - 22, f.tuyereY - 7, 26, 14);
    ctx.strokeStyle = '#1e1814';
    ctx.lineWidth = 2;
    ctx.strokeRect(f.tuyereX - 22, f.tuyereY - 7, 26, 14);

    // Tuyère incandescent nozzle opening
    const nozzleGlow = ctx.createRadialGradient(f.tuyereX + 4, f.tuyereY, 2, f.tuyereX + 4, f.tuyereY, 24);
    nozzleGlow.addColorStop(0, '#ffffff');
    nozzleGlow.addColorStop(0.4, '#ffaa22');
    nozzleGlow.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = nozzleGlow;
    ctx.beginPath();
    ctx.arc(f.tuyereX + 4, f.tuyereY, 24, 0, Math.PI * 2);
    ctx.fill();

    // Slag taphole on bottom right
    ctx.fillStyle = this.slagTapped ? '#ffaa00' : '#3d251d';
    ctx.beginPath();
    ctx.arc(f.tapX + 4, f.tapY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Slag external basin / pit
    ctx.fillStyle = '#1c1a19';
    ctx.fillRect(f.slagPitX, f.slagPitY, f.slagPitW, f.slagPitH);
    ctx.strokeRect(f.slagPitX, f.slagPitY, f.slagPitW, f.slagPitH);

    ctx.restore();
  }

  renderBurdenParticles(ctx) {
    for (let i = 0; i < this.burden.length; i++) {
      const p = this.burden[i];
      const cfg = MATERIAL_CONFIG[p.type] || MATERIAL_CONFIG[MATERIAL.CHARCOAL];

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      // Temperature incandescence color blending
      if (p.temp > 750) {
        const heatFrac = Math.min(1.0, (p.temp - 750) / 450);
        ctx.fillStyle = heatFrac > 0.6 ? cfg.hotColor : cfg.glowColor;
        ctx.shadowColor = cfg.glowColor;
        ctx.shadowBlur = heatFrac * 10;
      } else {
        ctx.fillStyle = cfg.color;
      }

      ctx.fill();

      // Specular rim for iron & ore
      if (p.type === MATERIAL.SPONGE_IRON || p.type === MATERIAL.ORE_HEMATITE) {
        ctx.strokeStyle = p.type === MATERIAL.SPONGE_IRON ? '#d0d4dc' : '#421a14';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderSlagAndTapping(ctx) {
    const f = this.furnace;

    // 1. Hearth molten slag pool (bottom of crucible)
    if (this.slagBasinLevel > 0) {
      const poolH = (this.slagBasinLevel / 100) * 26;
      ctx.save();
      ctx.beginPath();
      ctx.rect(f.hearthX1 + 4, f.hearthY - poolH, (f.hearthX2 - f.hearthX1) - 8, poolH);

      const poolGrad = ctx.createLinearGradient(0, f.hearthY - poolH, 0, f.hearthY);
      poolGrad.addColorStop(0, '#ff9900');
      poolGrad.addColorStop(0.5, '#cc4400');
      poolGrad.addColorStop(1, '#661100');
      ctx.fillStyle = poolGrad;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    // 2. Individual molten slag droplets trickling down
    for (let i = 0; i < this.slagDroplets.length; i++) {
      const s = this.slagDroplets[i];
      ctx.save();
      ctx.fillStyle = '#ff8800';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Tapped slag stream pouring into outside basin
    for (let i = 0; i < this.tapStream.length; i++) {
      const tp = this.tapStream[i];
      ctx.save();
      const alpha = tp.life / tp.maxLife;
      ctx.fillStyle = `rgba(255, 170, 30, ${alpha})`;
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, tp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderGasAndSmoke(ctx) {
    for (let i = 0; i < this.gasParticles.length; i++) {
      const g = this.gasParticles[i];
      ctx.save();
      const alpha = (g.life / g.maxLife) * 0.45;

      if (g.type === 'air_blast') {
        ctx.fillStyle = `rgba(255, 230, 160, ${alpha * 1.4})`;
      } else {
        ctx.fillStyle = `rgba(60, 56, 52, ${alpha})`;
      }

      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderBellows(ctx) {
    const b = this.bellows;
    ctx.save();

    // Accordion folds displacement based on stroke
    const compression = 1.0 - this.bellowsStroke * 0.4;
    const bellowsW = b.w * compression;

    // Wood clamping end plates
    ctx.fillStyle = '#8b5a2b';
    ctx.strokeStyle = '#3e230e';
    ctx.lineWidth = 2;

    // Left fixed plate
    ctx.fillRect(b.x, b.y, 8, b.h);
    ctx.strokeRect(b.x, b.y, 8, b.h);

    // Right moving nozzle plate
    const movingX = b.x + bellowsW;
    ctx.fillRect(movingX, b.y + 6, 8, b.h - 12);
    ctx.strokeRect(movingX, b.y + 6, 8, b.h - 12);

    // Leather folds (zigzag polygons)
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y);
    const folds = 5;
    for (let i = 1; i <= folds; i++) {
      const fx = b.x + 8 + (bellowsW - 8) * (i / folds);
      const fy = i % 2 === 1 ? b.y - 8 : b.y;
      ctx.lineTo(fx, fy);
    }
    ctx.lineTo(movingX, b.y + 6);
    ctx.lineTo(movingX, b.y + b.h - 6);
    for (let i = folds; i >= 1; i--) {
      const fx = b.x + 8 + (bellowsW - 8) * (i / folds);
      const fy = i % 2 === 1 ? b.y + b.h + 8 : b.y + b.h;
      ctx.lineTo(fx, fy);
    }
    ctx.closePath();

    ctx.fillStyle = '#4a3324'; // Treated Roman cowhide leather
    ctx.fill();
    ctx.stroke();

    // Connecting blast pipe into tuyère
    ctx.strokeStyle = '#8a7768';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(movingX + 8, b.y + b.h * 0.5);
    ctx.lineTo(b.pipeEndX, b.pipeEndY);
    ctx.stroke();

    // Air blast speed indicator text
    ctx.fillStyle = '#ffeedd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FOLLES (BELLOWS)', b.x + b.w * 0.5, b.y + b.h + 18);

    ctx.restore();
  }

  renderAnvilAndForge(ctx) {
    const a = this.anvil;
    const b = this.anvilBloom;
    ctx.save();

    // 1. Massive Oak Timber Stump Base (Cippus)
    const stumpX = a.baseX + 16;
    const stumpY = a.baseY + 40;
    const stumpW = a.w - 32;
    const stumpH = (this.height * 0.88) - stumpY;

    ctx.fillStyle = '#3a2418';
    ctx.fillRect(stumpX, stumpY, stumpW, stumpH);
    ctx.strokeStyle = '#1e110a';
    ctx.lineWidth = 2;
    ctx.strokeRect(stumpX, stumpY, stumpW, stumpH);

    // Iron reinforcing bands around stump
    ctx.fillStyle = '#22252a';
    ctx.fillRect(stumpX - 3, stumpY + 16, stumpW + 6, 8);
    ctx.fillRect(stumpX - 3, stumpY + stumpH - 24, stumpW + 6, 8);

    // 2. Roman Forged Iron Anvil (Incus)
    ctx.beginPath();
    // Horn on left (cornu)
    ctx.moveTo(a.topFaceX - 30, a.topFaceY + 14);
    ctx.quadraticCurveTo(a.topFaceX - 10, a.topFaceY, a.topFaceX, a.topFaceY);
    // Flat anvil face (striking plateau)
    ctx.lineTo(a.topFaceX + a.topFaceW, a.topFaceY);
    // Heel & hardy hole step on right
    ctx.lineTo(a.topFaceX + a.topFaceW + 18, a.topFaceY + 12);
    ctx.lineTo(a.topFaceX + a.topFaceW + 14, a.topFaceY + 44);
    // Anvil waist / foot flares
    ctx.lineTo(stumpX + stumpW - 6, stumpY);
    ctx.lineTo(stumpX + 6, stumpY);
    ctx.lineTo(a.topFaceX - 4, a.topFaceY + 44);
    ctx.closePath();

    ctx.fillStyle = '#3a3f4a';
    ctx.fill();
    ctx.strokeStyle = '#16191f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Polished anvil face highlight
    ctx.fillStyle = '#788294';
    ctx.fillRect(a.topFaceX, a.topFaceY, a.topFaceW, 4);

    // 3. The Iron Bloom (Lupa / Massa Ferri) on the Anvil Face
    const bw = b.shapeWidth * (2.0 - b.squashFactor);
    const bh = b.shapeHeight * b.squashFactor;
    const bx = a.bloomX - bw * 0.5;
    const by = a.bloomY - bh;

    // Thermal incandescence color based on bloom temperature
    let bloomColor = '#ffeedd';
    let bloomGlow = '#ff6600';
    if (b.temp > 1050) {
      bloomColor = '#fffbe6'; // White hot
      bloomGlow = '#ffbb33';
    } else if (b.temp > 900) {
      bloomColor = '#ffb333'; // Bright yellow-orange
      bloomGlow = '#ff6600';
    } else if (b.temp > 700) {
      bloomColor = '#e64411'; // Cherry red
      bloomGlow = '#991100';
    } else {
      bloomColor = '#4a3b38'; // Cooled dark iron
      bloomGlow = '#221510';
    }

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, [6, 6, 2, 2]);
    ctx.fillStyle = bloomColor;
    ctx.shadowColor = bloomGlow;
    ctx.shadowBlur = b.temp > 700 ? 18 : 2;
    ctx.fill();
    ctx.strokeStyle = '#33180c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spongy texture / slag inclusions dots
    if (b.slagContent > 0.05) {
      ctx.fillStyle = '#1c1512';
      const numPits = Math.floor(b.slagContent * 20);
      for (let k = 0; k < numPits; k++) {
        const px = bx + 6 + (k * 13) % (bw - 12);
        const py = by + 4 + (k * 7) % (bh - 8);
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 4. Blacksmith's Tongs (Holding Bloom)
    ctx.strokeStyle = '#22252d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx - 18, by + bh * 0.5);
    ctx.lineTo(bx + 4, by + bh * 0.5);
    ctx.moveTo(bx - 18, by + bh * 0.5);
    ctx.lineTo(bx - 55, by + bh * 0.5 + 18);
    ctx.stroke();

    // 5. Incandescent Forge Sparks (High Velocity Streaks)
    for (let i = 0; i < this.forgeSparks.length; i++) {
      const s = this.forgeSparks[i];
      ctx.save();
      ctx.strokeStyle = s.temp > 900 ? '#fff8cc' : (s.temp > 600 ? '#ff7700' : '#882200');
      ctx.lineWidth = s.radius;
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(s.prevX, s.prevY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Impact Flash Bloom on Strike
    if (this.hammer.impactFlash > 0) {
      ctx.save();
      const flashGrad = ctx.createRadialGradient(a.bloomX, a.bloomY - 10, 5, a.bloomX, a.bloomY - 10, 85);
      flashGrad.addColorStop(0, `rgba(255, 255, 240, ${this.hammer.impactFlash})`);
      flashGrad.addColorStop(0.3, `rgba(255, 180, 40, ${this.hammer.impactFlash * 0.7})`);
      flashGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(a.bloomX, a.bloomY - 10, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Forging Sledgehammer (Malleus)
    ctx.save();
    ctx.translate(a.hammerPivotX, a.hammerPivotY);
    ctx.rotate(this.hammer.armAngle);

    // Ash wood handle
    ctx.fillStyle = '#b58548';
    ctx.strokeStyle = '#4a2e10';
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -95, 12, 105);
    ctx.strokeRect(-10, -95, 12, 105);

    // Heavy forged iron hammer head
    ctx.fillStyle = '#2c3038';
    ctx.strokeStyle = '#111317';
    ctx.fillRect(-22, -125, 36, 32);
    ctx.strokeRect(-22, -125, 36, 32);

    ctx.restore();

    ctx.restore();
  }

  renderRomanHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    const bannerH = narrow ? 50 : 56;
    ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
    ctx.fillRect(0, 0, sw, bannerH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, bannerH);
    ctx.lineTo(sw, bannerH);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#d4af37';
    ctx.font = narrow ? 'bold 12px Cinzel, serif' : 'bold 14px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText(narrow ? 'METALLUM • BLOOMERY' : 'METALLUM • CAMINI EXCOCTIO FERRI', 12, 20);

    if (narrow) {
      ctx.fillStyle = this.tuyereTemp > 1150 ? '#ff7733' : '#ffd700';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.round(this.tuyereTemp)}°C | Bloom: ${this.anvilBloom.massKg.toFixed(1)}kg`, 12, 38);
    } else {
      ctx.fillStyle = '#a0a6b2';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('REDOX: Fe₂O₃ + 3CO → 2Fe + 3CO₂  |  TUYÈRE DRAFT: 1200°C', 12, 40);

      // Live Metrics Telemetry (Top Right)
      ctx.textAlign = 'right';
      ctx.fillStyle = this.tuyereTemp > 1150 ? '#ff7733' : '#ffd700';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`FURNACE: ${Math.round(this.tuyereTemp)}°C`, sw - 16, 22);

      ctx.fillStyle = '#a0a6b2';
      ctx.font = '11px "JetBrains Mono", monospace';
      const bloomKg = this.anvilBloom.massKg.toFixed(1);
      const consPct = Math.round(this.anvilBloom.consolidation * 100);
      ctx.fillText(`BLOOM: ${bloomKg}kg (${consPct}% PURE)`, sw - 16, 40);
    }

    // Center Notification Banner / Triumph
    if (this.bannerTimer > 0) {
      const bannerAlpha = Math.min(1.0, this.bannerTimer);
      ctx.fillStyle = `rgba(20, 22, 28, ${bannerAlpha * 0.92})`;
      ctx.strokeStyle = `rgba(212, 175, 55, ${bannerAlpha})`;
      ctx.lineWidth = 1.5;

      const bw = Math.min(sw * 0.85, 480);
      const bx = (sw - bw) * 0.5;
      const by = bannerH + 10;
      ctx.fillRect(bx, by, bw, 28);
      ctx.strokeRect(bx, by, bw, 28);

      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 230, 160, ${bannerAlpha})`;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(this.bannerMessage, sw * 0.5, by + 18);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Architecture Contract Methods
  // -------------------------------------------------------------
  getEntityCount() {
    return (
      this.burden.length +
      this.slagDroplets.length +
      this.forgeSparks.length +
      this.gasParticles.length +
      this.tapStream.length
    );
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.audio) {
      this.audio.destroy();
    }
    this.burden = [];
    this.slagDroplets = [];
    this.forgeSparks = [];
    this.gasParticles = [];
    this.tapStream = [];
  }

  // -------------------------------------------------------------
  // Input Handling
  // -------------------------------------------------------------
  onMouseDown(pos) {
    this.mouse.isDown = true;
    this.mouse.downX = pos.x;
    this.mouse.downY = pos.y;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    // Check interaction targets:
    // 1. Click on Bellows -> pump bellows
    const b = this.bellows;
    if (pos.x >= b.x && pos.x <= b.x + b.w + 20 && pos.y >= b.y && pos.y <= b.y + b.h + 20) {
      this.manualPumpBellows();
      return;
    }

    // 2. Click on Anvil / Bloom -> strike hammer
    const a = this.anvil;
    if (pos.x >= a.topFaceX - 30 && pos.x <= a.topFaceX + a.topFaceW + 40 && pos.y >= a.bloomY - 40 && pos.y <= a.baseY + 50) {
      this.strikeHammer();
      return;
    }

    // 3. Click on Taphole -> tap slag
    const f = this.furnace;
    if (Math.hypot(pos.x - f.tapX, pos.y - f.tapY) < 25) {
      this.tapSlag();
      return;
    }

    // 4. Click in furnace interior -> drop selected charge material
    if (pos.x >= f.throatX1 - 20 && pos.x <= f.throatX2 + 20 && pos.y >= f.throatY - 40 && pos.y <= f.hearthY) {
      this.chargeMaterial(this.selectedCharge, 5);
      return;
    }
  }

  onMouseMove(pos) {
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }

  onMouseUp(pos) {
    this.mouse.isDown = false;
  }

  onKeyDown(key, e) {
    const k = (key || '').toLowerCase();

    if (k === '1') {
      this.selectedCharge = MATERIAL.ORE_HEMATITE;
      this.chargeMaterial(MATERIAL.ORE_HEMATITE, 8);
    } else if (k === '2') {
      this.selectedCharge = MATERIAL.CHARCOAL;
      this.chargeMaterial(MATERIAL.CHARCOAL, 8);
    } else if (k === '3') {
      this.selectedCharge = MATERIAL.FLUX_LIMESTONE;
      this.chargeMaterial(MATERIAL.FLUX_LIMESTONE, 6);
    } else if (k === '4') {
      this.chargeBalancedBurden();
    } else if (k === 'b') {
      this.manualPumpBellows();
    } else if (k === 't') {
      this.tapSlag();
    } else if (k === ' ' || k === 'space' || k === 'spacebar') {
      this.strikeHammer();
    } else if (k === 'h') {
      this.reheatBloom();
    } else if (k === 'r') {
      this.reset();
    }
  }

  onKeyUp(key, e) {}
}
