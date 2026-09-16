// Hermetica: Alexandrian Alembic Distillation & Vaporization Thermodynamics
// Grounded in Pliny the Elder's Naturalis Historia:
// - Book XXXIII & XXXIV: Distillation of quicksilver and mineral sublimations in alembics
// - Book XII & XIII: Distillation of essential oils and fragrant unguents from roses and aromatics
// - Book XIV: Aqua ardens (distillation of wine spirits / aqua vitae)
// and the works of Maria the Jewess and Zosimos of Panopolis (inventors of the tribikos alembic).

export const FEED_TYPE = {
  WINE: 'wine',
  ROSE: 'rose',
  SULFUR: 'sulfur'
};

export const FEED_CONFIG = {
  [FEED_TYPE.WINE]: {
    name: 'Aqua Vitae (Wine Spirits)',
    latin: 'Vinum & Spiritus Vini',
    description: "Fractional distillation of fermented grape must into high-proof spiritus ardens.",
    book: 'Pliny Nat. Hist. XIV',
    washColor: '#68132c',
    washHighlight: '#9b2242',
    washDeep: '#380a17',
    vaporColor: 'rgba(215, 235, 255, ',
    distillateColor: 'rgba(225, 245, 255, 0.85)',
    spiritColor: '#e0f2fe',
    oilColor: null,
    boilPointVolatile: 78.3, // Ethanol bp (°C)
    boilPointAqueous: 100.0, // Water bp (°C)
    latentHeat: 841,         // kJ/kg
    volatilityAlpha: 4.2,    // Relative volatility (Raoult-Dalton separation factor)
    initialVolatileFraction: 0.14, // 14% ABV wine
    targetVolatileFraction: 0.82,  // High proof distillate
    particlesName: 'Spirit Particles',
    sedimentType: 'tartrate',
    hudUnit: 'ABV (% Spirit)'
  },
  [FEED_TYPE.ROSE]: {
    name: 'Aqua Rosarum (Attar & Hydrosol)',
    latin: 'Rosa Damascena & Hydrolat',
    description: "Steam co-distillation of Damask rose petals yielding fragrant floral hydrosol and floating attar.",
    book: 'Pliny Nat. Hist. XII, XIII',
    washColor: '#8a1d48',
    washHighlight: '#c2336e',
    washDeep: '#4a0e26',
    vaporColor: 'rgba(255, 220, 235, ',
    distillateColor: 'rgba(255, 240, 246, 0.88)',
    spiritColor: '#fce7f3',
    oilColor: 'rgba(245, 190, 40, 0.95)', // Golden essential oil
    boilPointVolatile: 96.0, // Co-distillation steam temp (°C)
    boilPointAqueous: 100.0,
    latentHeat: 2150,
    volatilityAlpha: 2.8,
    initialVolatileFraction: 0.08, // 8% essential oil precursors
    targetVolatileFraction: 0.45,
    particlesName: 'Floral Essence',
    sedimentType: 'petals',
    hudUnit: 'Attar (% Essential Oil)'
  },
  [FEED_TYPE.SULFUR]: {
    name: 'Spiritus Sulfuris (Brimstone Acid)',
    latin: 'Sulfur & Oleum Vitrioli',
    description: "High-temperature alchemical sublimation of volcanic brimstone and green vitriol.",
    book: 'Pliny Nat. Hist. XXXV',
    washColor: '#6d681b',
    washHighlight: '#a39b28',
    washDeep: '#3b380d',
    vaporColor: 'rgba(240, 255, 170, ',
    distillateColor: 'rgba(235, 255, 190, 0.85)',
    spiritColor: '#ecfccb',
    oilColor: 'rgba(195, 220, 30, 0.9)',
    boilPointVolatile: 112.0, // Sublimation & acid vapor (°C)
    boilPointAqueous: 100.0,
    latentHeat: 1400,
    volatilityAlpha: 1.9,
    initialVolatileFraction: 0.22,
    targetVolatileFraction: 0.74,
    particlesName: 'Vitriolic Vapor',
    sedimentType: 'sulfur_crystals',
    hudUnit: 'Purity (% Acidum)'
  }
};

export class HermeticaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation State
    this.activeFeed = FEED_TYPE.WINE;
    this.furnaceHeat = 0.65;        // 0.0 (Off/Cold) to 1.0 (Blazing Athanor)
    this.condenserCoolness = 0.75;  // 0.0 (Ambient 35°C) to 1.0 (Ice water sponge 5°C)
    this.ambientTemp = 20.0;        // °C

    // Thermodynamic Wash State in Cucurbit
    this.washTemp = 22.0;           // °C
    this.washVolume = 480.0;        // mL (initial charge)
    this.maxWashVolume = 500.0;
    this.washVolatileFraction = FEED_CONFIG[this.activeFeed].initialVolatileFraction;

    // Condenser State in Alembic Helm Dome
    this.condenserTemp = 18.0;      // °C
    this.vaporPressureTotal = 0.0;  // kPa
    this.vaporPurity = 0.0;         // current vapor composition
    this.boilIntensity = 0.0;       // 0 to 1 normalized boiling vigour

    // Distillate Harvest in Receiver Flask
    this.distillateVolume = 0.0;    // mL collected
    this.maxReceiverVolume = 280.0; // mL capacity
    this.distillateVolatileFraction = 0.0; // Accumulated purity
    this.oilLayerVolume = 0.0;      // For essential oils
    this.fractionPhase = 'FORESHOTS'; // 'IDLE', 'FORESHOTS', 'HEARTS', 'TAILS'

    // Collections & Physical Entities
    this.vaporParticles = [];       // Rising steam / congener gas plumes
    this.condensationDroplets = [];  // Droplets clinging to alembic helm dome
    this.beakDrops = [];            // Drops traveling down delivery rostrum
    this.fallingDrops = [];         // Drips in freefall into receiver
    this.bubbles = [];              // Boiling nucleation bubbles in cucurbit
    this.washSediment = [];         // Petals / tartrates / sulfur granules
    this.flameParticles = [];       // Athanor kiln fire and glowing embers
    this.causticRays = [];          // Atmospheric light rays through glass
    this.receiverWaves = [];        // Surface ripples on distillate
    this.splashes = [];             // Splash droplets on drip collision

    // Layout Geometry (computed on resize)
    this.geo = {};

    // Interaction & Animation Timers
    this.time = 0;
    this.dripTimer = 0;
    this.lastDripTime = 0;
    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.5,
      rawX: this.width * 0.5,
      rawY: this.height * 0.5,
      isDown: false,
      hoverTarget: null
    };

    // DOM Controls References
    this.domControls = {};

    // Audio Synthesizer (Zero-dependency WebAudio, safely muted headless)
    this.audio = {
      ctx: null,
      enabled: false,
      masterGain: null,
      bubbleGain: null,
      fireGain: null
    };

    this.recomputeGeometry();
    this.initSediment();
    this.buildControls();
    this.reset(false);
  }

  /* -------------------------------------------------------------------------
   * GEOMETRY & APPARATUS LAYOUT
   * ---------------------------------------------------------------------- */
  recomputeGeometry() {
    const w = this.width;
    const h = this.height;

    // Workbench Table Line
    const tableY = Math.floor(h * 0.82);

    // 1. Athanor (Furnace) & Cucurbit (Boiling Flask)
    const cucurbitCenterX = Math.floor(w * 0.30);
    const cucurbitCenterY = Math.floor(h * 0.55);
    const cucurbitRadius = Math.max(48, Math.min(110, Math.floor(h * 0.16)));
    const cucurbitNeckTopY = cucurbitCenterY - cucurbitRadius * 1.35;
    const cucurbitNeckWidth = Math.max(26, Math.floor(cucurbitRadius * 0.36));

    const furnaceTopY = cucurbitCenterY + cucurbitRadius * 0.55;
    const furnaceBottomY = tableY;
    const furnaceWidth = Math.floor(cucurbitRadius * 1.85);

    // 2. Alembic Helm (Capitellum / Dome)
    const helmDomeRadius = Math.floor(cucurbitRadius * 0.95);
    const helmCenterY = cucurbitNeckTopY - Math.floor(helmDomeRadius * 0.25);
    const helmGutterY = cucurbitNeckTopY + 4; // Internal collection gutter ring

    // 3. Delivery Spout (Rostrum / Beak)
    const beakStartX = cucurbitCenterX + Math.floor(cucurbitNeckWidth * 0.45);
    const beakStartY = helmGutterY;
    const beakLength = Math.max(160, Math.floor(w * 0.38));
    const beakAngle = 0.38; // ~22 degrees downward slope
    const beakEndX = beakStartX + Math.floor(beakLength * Math.cos(beakAngle));
    const beakEndY = beakStartY + Math.floor(beakLength * Math.sin(beakAngle));

    // 4. Receiver Flask (Matras / Phial)
    const receiverCenterX = beakEndX + 8;
    const receiverBaseY = tableY;
    const receiverRadius = Math.max(36, Math.min(85, Math.floor(cucurbitRadius * 0.72)));
    const receiverNeckTopY = beakEndY + 28;
    const receiverCenterY = receiverBaseY - receiverRadius * 0.92;
    const receiverNeckWidth = Math.max(22, Math.floor(receiverRadius * 0.38));

    this.geo = {
      tableY,
      cucurbit: {
        x: cucurbitCenterX,
        y: cucurbitCenterY,
        r: cucurbitRadius,
        neckTopY: cucurbitNeckTopY,
        neckWidth: cucurbitNeckWidth,
        liquidLevelY: cucurbitCenterY + cucurbitRadius * 0.05
      },
      furnace: {
        x: cucurbitCenterX,
        topY: furnaceTopY,
        bottomY: furnaceBottomY,
        width: furnaceWidth,
        hearthX: cucurbitCenterX,
        hearthY: furnaceBottomY - 14
      },
      helm: {
        x: cucurbitCenterX,
        y: helmCenterY,
        r: helmDomeRadius,
        gutterY: helmGutterY,
        gutterLeft: cucurbitCenterX - helmDomeRadius * 0.85,
        gutterRight: cucurbitCenterX + helmDomeRadius * 0.85
      },
      beak: {
        startX: beakStartX,
        startY: beakStartY,
        endX: beakEndX,
        endY: beakEndY,
        angle: beakAngle,
        length: beakLength,
        tubeRadius: 6.5
      },
      receiver: {
        x: receiverCenterX,
        y: receiverCenterY,
        r: receiverRadius,
        neckTopY: receiverNeckTopY,
        neckWidth: receiverNeckWidth,
        baseY: receiverBaseY
      }
    };
  }

  initSediment() {
    this.washSediment = [];
    const feed = FEED_CONFIG[this.activeFeed];
    const count = feed.sedimentType === 'petals' ? 32 : (feed.sedimentType === 'tartrate' ? 24 : 36);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (this.geo.cucurbit.r * 0.75);
      this.washSediment.push({
        x: this.geo.cucurbit.x + Math.cos(angle) * dist,
        y: this.geo.cucurbit.y + Math.abs(Math.sin(angle)) * (this.geo.cucurbit.r * 0.65),
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 2,
        opacity: 0.4 + Math.random() * 0.5,
        aspect: 0.5 + Math.random() * 0.8
      });
    }
  }

  /* -------------------------------------------------------------------------
   * DOM CONTROLS BUILDER (SAFE HEADLESS GUARD)
   * ---------------------------------------------------------------------- */
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Feed Wash Mixture</label>
        <div class="control-btn-grid" id="feed-selector" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
          <button class="sub-btn ${this.activeFeed === FEED_TYPE.WINE ? 'active' : ''}" data-feed="${FEED_TYPE.WINE}" title="Aqua Vitae: Wine spirit fractional distillation">
            🍷 Wine
          </button>
          <button class="sub-btn ${this.activeFeed === FEED_TYPE.ROSE ? 'active' : ''}" data-feed="${FEED_TYPE.ROSE}" title="Aqua Rosarum: Damask rose essential oil & hydrosol">
            🌹 Rose
          </button>
          <button class="sub-btn ${this.activeFeed === FEED_TYPE.SULFUR ? 'active' : ''}" data-feed="${FEED_TYPE.SULFUR}" title="Spiritus Sulfuris: Alchemical brimstone vitriol">
            ⚗️ Sulfur
          </button>
        </div>
      </div>

      <div class="control-group" id="group-furnace">
        <label style="display: flex; justify-content: space-between;">
          <span>Furnace Heat (Athanor Flame)</span>
          <span id="val-furnace" style="color: #ff9d42; font-weight: 600;">${Math.round(this.furnaceHeat * 100)}%</span>
        </label>
        <input type="range" id="slider-furnace" min="0" max="100" step="1" value="${Math.round(this.furnaceHeat * 100)}">
      </div>

      <div class="control-group" id="group-condenser">
        <label style="display: flex; justify-content: space-between;">
          <span>Condenser Coolness (Helm Sponge)</span>
          <span id="val-condenser" style="color: #67e8f9; font-weight: 600;">${Math.round(this.condenserCoolness * 100)}%</span>
        </label>
        <input type="range" id="slider-condenser" min="0" max="100" step="1" value="${Math.round(this.condenserCoolness * 100)}">
      </div>

      <div class="control-btn-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
        <button id="btn-purge-condenser" class="sub-btn" style="background: rgba(14, 165, 233, 0.2); border-color: #38bdf8; color: #bae6fd; font-weight: 600;">
          🧹 Purge Condenser (Space)
        </button>
        <button id="btn-refill-charge" class="sub-btn" style="background: rgba(212, 175, 55, 0.2); border-color: #eab308; color: #fde047; font-weight: 600;">
          🏺 Refill Wash (R)
        </button>
      </div>

      <div class="control-group" style="margin-top: 10px; font-size: 0.82rem; opacity: 0.85; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
        <div id="hermetica-status-feed" style="font-weight: 600; color: #fef08a;">${FEED_CONFIG[this.activeFeed].name}</div>
        <div id="hermetica-status-desc" style="font-style: italic;">${FEED_CONFIG[this.activeFeed].description}</div>
      </div>
    `;

    // Cache DOM Elements
    this.domControls = {
      feedBtns: this.controlsContainer.querySelectorAll('#feed-selector .sub-btn'),
      sliderFurnace: this.controlsContainer.querySelector('#slider-furnace'),
      valFurnace: this.controlsContainer.querySelector('#val-furnace'),
      sliderCondenser: this.controlsContainer.querySelector('#slider-condenser'),
      valCondenser: this.controlsContainer.querySelector('#val-condenser'),
      btnPurge: this.controlsContainer.querySelector('#btn-purge-condenser'),
      btnRefill: this.controlsContainer.querySelector('#btn-refill-charge'),
      statusFeed: this.controlsContainer.querySelector('#hermetica-status-feed'),
      statusDesc: this.controlsContainer.querySelector('#hermetica-status-desc')
    };

    // Feed selection listeners
    this.domControls.feedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.domControls.feedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setFeed(btn.dataset.feed);
      });
    });

    // Slider Furnace
    if (this.domControls.sliderFurnace) {
      this.domControls.sliderFurnace.addEventListener('input', (e) => {
        this.furnaceHeat = parseFloat(e.target.value) / 100;
        if (this.domControls.valFurnace) {
          this.domControls.valFurnace.textContent = `${Math.round(this.furnaceHeat * 100)}%`;
        }
        this.initAudio();
      });
    }

    // Slider Condenser
    if (this.domControls.sliderCondenser) {
      this.domControls.sliderCondenser.addEventListener('input', (e) => {
        this.condenserCoolness = parseFloat(e.target.value) / 100;
        if (this.domControls.valCondenser) {
          this.domControls.valCondenser.textContent = `${Math.round(this.condenserCoolness * 100)}%`;
        }
      });
    }

    // Purge Condenser Button
    if (this.domControls.btnPurge) {
      this.domControls.btnPurge.addEventListener('click', () => {
        this.purgeCondenser();
      });
    }

    // Refill Wash Button
    if (this.domControls.btnRefill) {
      this.domControls.btnRefill.addEventListener('click', () => {
        this.reset(false);
      });
    }
  }

  setFeed(feedKey) {
    if (!FEED_CONFIG[feedKey]) return;
    this.activeFeed = feedKey;
    const cfg = FEED_CONFIG[feedKey];

    // Reset thermodynamic wash
    this.washVolume = this.maxWashVolume * 0.95;
    this.washVolatileFraction = cfg.initialVolatileFraction;
    this.distillateVolume = 0;
    this.distillateVolatileFraction = 0;
    this.oilLayerVolume = 0;
    this.fractionPhase = 'IDLE';

    // Clear dynamic particulates
    this.vaporParticles = [];
    this.condensationDroplets = [];
    this.beakDrops = [];
    this.fallingDrops = [];
    this.bubbles = [];

    this.initSediment();

    // Update DOM labels if present
    if (this.domControls.statusFeed) {
      this.domControls.statusFeed.textContent = cfg.name;
    }
    if (this.domControls.statusDesc) {
      this.domControls.statusDesc.textContent = cfg.description;
    }
  }

  purgeCondenser() {
    // Clear out droplets in helm dome and beak tube, and reset receiver cut
    this.condensationDroplets = [];
    this.beakDrops = [];
    this.fallingDrops = [];
    this.distillateVolume = 0.0;
    this.distillateVolatileFraction = 0.0;
    this.oilLayerVolume = 0.0;
    this.fractionPhase = 'IDLE';

    // Generate brief steam release puff at beak tip
    for (let i = 0; i < 16; i++) {
      this.vaporParticles.push({
        x: this.geo.beak.endX,
        y: this.geo.beak.endY,
        vx: (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 25,
        temp: 60,
        volatileRatio: 0.5,
        alpha: 0.8,
        size: 3 + Math.random() * 6,
        age: 0,
        maxAge: 0.8 + Math.random() * 0.6
      });
    }
  }

  /* -------------------------------------------------------------------------
   * AUDIO PROCEDURAL SYNTHESIS (Zero External Deps, Headless-Safe)
   * ---------------------------------------------------------------------- */
  initAudio() {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    if (this.audio.ctx) {
      if (this.audio.ctx.state === 'suspended') {
        this.audio.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.24, ctx.currentTime);
      master.connect(ctx.destination);

      this.audio.ctx = ctx;
      this.audio.masterGain = master;
      this.audio.enabled = true;
    } catch (e) {
      // Safely ignore audio init failures
    }
  }

  playDripSound(purity = 0.5) {
    if (!this.audio.enabled || !this.audio.ctx) return;
    try {
      const ctx = this.audio.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Fluid glass ping: pitch rises slightly with purity / alcohol proof
      const baseFreq = 800 + purity * 450;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.audio.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  /* -------------------------------------------------------------------------
   * LIFECYCLE: RESET, RESIZE, DESTROY, GET_ENTITY_COUNT
   * ---------------------------------------------------------------------- */
  reset(hard = true) {
    this.time = 0;
    this.washTemp = 24.0;
    this.condenserTemp = 18.0;
    this.washVolume = this.maxWashVolume * 0.95;
    this.distillateVolume = 0.0;
    this.distillateVolatileFraction = 0.0;
    this.oilLayerVolume = 0.0;
    this.fractionPhase = 'IDLE';

    this.vaporParticles = [];
    this.condensationDroplets = [];
    this.beakDrops = [];
    this.fallingDrops = [];
    this.bubbles = [];
    this.flameParticles = [];
    this.receiverWaves = [];
    this.splashes = [];

    if (hard) {
      this.activeFeed = FEED_TYPE.WINE;
      this.furnaceHeat = 0.65;
      this.condenserCoolness = 0.75;
      if (this.domControls.sliderFurnace) this.domControls.sliderFurnace.value = 65;
      if (this.domControls.valFurnace) this.domControls.valFurnace.textContent = '65%';
      if (this.domControls.sliderCondenser) this.domControls.sliderCondenser.value = 75;
      if (this.domControls.valCondenser) this.domControls.valCondenser.textContent = '75%';
      if (this.domControls.feedBtns) {
        this.domControls.feedBtns.forEach(b => {
          b.classList.toggle('active', b.dataset.feed === FEED_TYPE.WINE);
        });
      }
    }

    this.washVolatileFraction = FEED_CONFIG[this.activeFeed].initialVolatileFraction;
    this.initSediment();
  }

  resize(width, height, dpr = 1) {
    this.width = width || (this.canvas ? this.canvas.width : 800);
    this.height = height || (this.canvas ? this.canvas.height : 600);
    this.dpr = dpr || 1;
    this.recomputeGeometry();
  }

  destroy() {
    if (this.audio.ctx) {
      try {
        this.audio.ctx.close();
      } catch (e) {}
      this.audio.ctx = null;
    }
  }

  getEntityCount() {
    // Contract requirement:
    // Vapor particles + condensation droplets + receiver liquid volume nodes (+ beak/falling drops + bubbles)
    const receiverNodesCount = 32; // Number of simulated fluid columns in receiver
    return (
      this.vaporParticles.length +
      this.condensationDroplets.length +
      this.beakDrops.length +
      this.fallingDrops.length +
      this.bubbles.length +
      this.washSediment.length +
      this.flameParticles.length +
      receiverNodesCount
    );
  }

  /* -------------------------------------------------------------------------
   * SIMULATION ENGINE & THERMODYNAMICS
   * ---------------------------------------------------------------------- */
  update(dt) {
    // Clamp dt to prevent step explosion
    dt = Math.min(0.05, Math.max(0.001, dt));
    this.time += dt;

    const feed = FEED_CONFIG[this.activeFeed];
    const geo = this.geo;

    // 1. THERMAL BALANCE: Furnace Athanor Heat Transfer
    // Flame temp reaches up to 340°C
    const flameTemp = 20.0 + this.furnaceHeat * 320.0;
    const heatTransferCoeff = 0.45;
    const coolingLossCoeff = 0.08;

    // dT/dt = Q_in - Q_out
    const tempDelta = (heatTransferCoeff * (flameTemp - this.washTemp) - coolingLossCoeff * (this.washTemp - this.ambientTemp)) * dt;
    this.washTemp = Math.max(this.ambientTemp, this.washTemp + tempDelta);

    // 2. CONDENSER COOLING BALANCE
    // Target condenser temp range: 6°C (max cooling) to 48°C (ambient/poor cooling)
    const targetCondenserTemp = 6.0 + (1.0 - this.condenserCoolness) * 42.0;
    this.condenserTemp += (targetCondenserTemp - this.condenserTemp) * 1.5 * dt;

    // 3. FRACTIONAL VAPORIZATION THERMODYNAMICS (Raoult's & Dalton's Laws)
    // Mixture effective boiling point based on mole fraction:
    // T_bp_mix = x_vol * T_bp_vol + (1 - x_vol) * T_bp_aq
    const mixtureBoilPoint = (
      this.washVolatileFraction * feed.boilPointVolatile +
      (1.0 - this.washVolatileFraction) * feed.boilPointAqueous
    );

    // Relative volatility equilibrium (McCabe-Thiele vapor equilibrium):
    // y = (alpha * x) / (1 + (alpha - 1) * x)
    const alpha = feed.volatilityAlpha;
    const x = Math.max(0.001, Math.min(0.999, this.washVolatileFraction));
    const equilibriumVaporFraction = (alpha * x) / (1.0 + (alpha - 1.0) * x);

    // Vapor pressure Clapeyron scaling
    const superHeat = Math.max(0, this.washTemp - mixtureBoilPoint);
    this.boilIntensity = Math.min(1.0, superHeat / 12.0) * Math.min(1.0, this.furnaceHeat * 1.4);

    // Dalton partial vapor pressure in kPa
    const pVol = x * 101.3 * Math.exp((feed.boilPointVolatile * 0.015) * (this.washTemp / feed.boilPointVolatile - 1));
    const pWater = (1 - x) * 101.3 * Math.exp((feed.boilPointAqueous * 0.015) * (this.washTemp / feed.boilPointAqueous - 1));
    this.vaporPressureTotal = Math.min(220, (pVol + pWater) * (this.washTemp > 50 ? 1 : 0.2));
    this.vaporPurity = equilibriumVaporFraction;

    // 4. BUBBLE NUCLEATION IN CUCURBIT
    if (this.boilIntensity > 0.05 && this.washVolume > 5.0) {
      const bubbleSpawnRate = this.boilIntensity * 40;
      if (Math.random() < bubbleSpawnRate * dt) {
        const span = geo.cucurbit.r * 0.65;
        this.bubbles.push({
          x: geo.cucurbit.x + (Math.random() - 0.5) * span * 2,
          y: geo.cucurbit.y + geo.cucurbit.r * 0.75 - Math.random() * 8,
          vy: -35 - Math.random() * 55 * (1 + this.boilIntensity),
          vx: (Math.random() - 0.5) * 10,
          radius: 1.5 + Math.random() * (2.5 + this.boilIntensity * 3.5),
          wobblePhase: Math.random() * Math.PI * 2,
          growth: 1.0
        });
      }
    }

    // Update Bubbles
    const cucurbitLiquidSurfaceY = geo.cucurbit.liquidLevelY;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y += b.vy * dt;
      b.x += b.vx * dt + Math.sin(b.wobblePhase + this.time * 6) * 0.4;
      b.growth += dt * 0.6;

      // Burst at liquid surface
      if (b.y <= cucurbitLiquidSurfaceY) {
        // Eject vapor particle
        if (Math.random() < 0.65) {
          this.spawnVaporParticle(b.x, cucurbitLiquidSurfaceY, equilibriumVaporFraction);
        }
        this.bubbles.splice(i, 1);
      }
    }

    // 5. VAPOR PLUME EXPANSION & DOME FLOW
    if (this.boilIntensity > 0.08 && this.washVolume > 2.0) {
      const vaporSpawnCount = Math.floor(this.boilIntensity * 14 * dt * 60);
      for (let s = 0; s < vaporSpawnCount; s++) {
        const spawnX = geo.cucurbit.x + (Math.random() - 0.5) * (geo.cucurbit.r * 0.6);
        this.spawnVaporParticle(spawnX, cucurbitLiquidSurfaceY, equilibriumVaporFraction);
      }

      // Slowly deplete wash volume
      const boilOffVolume = 0.08 * this.boilIntensity * dt;
      this.washVolume = Math.max(0, this.washVolume - boilOffVolume);

      // Deplete volatiles faster than aqueous base (fractional depletion)
      const volatileLoss = boilOffVolume * equilibriumVaporFraction * 0.7;
      this.washVolatileFraction = Math.max(0.005, this.washVolatileFraction - volatileLoss * 0.002);
    }

    // Update Vapor Particles
    const helm = geo.helm;
    for (let i = this.vaporParticles.length - 1; i >= 0; i--) {
      const p = this.vaporParticles[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        this.vaporParticles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += (Math.random() - 0.5) * 18 * dt; // Brownian jitter
      p.vy += -15 * dt; // Thermal buoyancy

      // Collision / Condensation on Alembic Helm Dome Ceiling
      // The helm dome is an arc centered at (helm.x, helm.y) with radius helm.r
      const dx = p.x - helm.x;
      const dy = p.y - helm.y;
      const distFromHelmCenter = Math.hypot(dx, dy);

      // Check if vapor reaches the upper cooling dome
      if (p.y < helm.gutterY && distFromHelmCenter >= helm.r * 0.92 && distFromHelmCenter <= helm.r * 1.12) {
        // Condensation check: vapor loses heat to condenser dome
        const dewPoint = p.volatileRatio * feed.boilPointVolatile + (1 - p.volatileRatio) * feed.boilPointAqueous;
        if (this.condenserTemp < dewPoint) {
          // Condense into droplet on helm dome!
          const angle = Math.atan2(dy, dx);
          this.spawnCondensationDroplet(angle, p.volatileRatio);
          this.vaporParticles.splice(i, 1);
          continue;
        }
      }

      // Keep vapor within neck & dome boundaries
      if (p.y >= helm.gutterY) {
        // In neck: clamp X to neck bounds
        const halfNeck = geo.cucurbit.neckWidth * 0.5;
        if (p.x < geo.cucurbit.x - halfNeck) {
          p.x = geo.cucurbit.x - halfNeck;
          p.vx = Math.abs(p.vx) * 0.5;
        } else if (p.x > geo.cucurbit.x + halfNeck) {
          p.x = geo.cucurbit.x + halfNeck;
          p.vx = -Math.abs(p.vx) * 0.5;
        }
      }
    }

    // Cap vapor particles for silky smooth 60fps
    if (this.vaporParticles.length > 320) {
      this.vaporParticles.splice(0, this.vaporParticles.length - 320);
    }

    // 6. CONDENSATION DROPLETS ON ALEMBIc HELM & GUTTER RUNOFF
    // Droplets cling to the dome arc and slide down due to gravity into the gutter channel
    for (let i = this.condensationDroplets.length - 1; i >= 0; i--) {
      const d = this.condensationDroplets[i];

      // Gravity pulls droplets down along the curved dome surface toward the gutter ring
      // Angle: -PI is left, -PI/2 is top apex, 0 is right
      const isRightSide = d.angle > -Math.PI * 0.5;
      const gravitySlide = (isRightSide ? 0.8 : -0.8) * Math.cos(d.angle);

      d.angle += gravitySlide * dt * (0.8 + d.mass * 0.4);
      d.mass += dt * 0.05; // Droplet accretion

      // Compute physical (x, y) on dome ceiling
      d.x = helm.x + Math.cos(d.angle) * helm.r;
      d.y = helm.y + Math.sin(d.angle) * helm.r;

      // When droplet reaches the bottom gutter ring of the helm:
      if (d.y >= helm.gutterY - 3) {
        // If on the right side, it flows into the delivery beak spout!
        if (isRightSide) {
          this.beakDrops.push({
            distAlongBeak: 0,
            speed: 55 + Math.random() * 30 + d.mass * 12,
            mass: d.mass,
            purity: d.purity
          });
        }
        // Droplet drained into gutter
        this.condensationDroplets.splice(i, 1);
      }
    }

    // 7. BEAK SPOUT RUNOFF (ROSTRUM FLOW)
    const beak = geo.beak;
    for (let i = this.beakDrops.length - 1; i >= 0; i--) {
      const bd = this.beakDrops[i];
      bd.distAlongBeak += bd.speed * dt;

      // Reached the beak drip nozzle tip?
      if (bd.distAlongBeak >= beak.length) {
        // Detach and fall as a free drip!
        this.fallingDrops.push({
          x: beak.endX,
          y: beak.endY,
          vx: Math.cos(beak.angle) * (bd.speed * 0.25),
          vy: Math.sin(beak.angle) * (bd.speed * 0.25),
          purity: bd.purity,
          mass: bd.mass
        });
        this.beakDrops.splice(i, 1);
      }
    }

    // 8. FALLING DRIPS & RECEIVER FLASK COLLECTION
    const receiver = geo.receiver;
    const receiverLiquidSurfaceY = receiver.baseY - Math.min(receiver.r * 1.5, (this.distillateVolume / this.maxReceiverVolume) * (receiver.r * 1.4) + 6);

    for (let i = this.fallingDrops.length - 1; i >= 0; i--) {
      const fd = this.fallingDrops[i];
      fd.vy += 450 * dt; // Gravity
      fd.x += fd.vx * dt;
      fd.y += fd.vy * dt;

      // Has drop hit the liquid surface in receiver?
      if (fd.y >= receiverLiquidSurfaceY) {
        // Collect volume into receiver!
        const volIncrement = 0.45 * (0.8 + fd.mass * 0.5);
        this.distillateVolume = Math.min(this.maxReceiverVolume, this.distillateVolume + volIncrement);

        // Update weighted distillate purity
        const total = this.distillateVolume;
        this.distillateVolatileFraction = (
          (this.distillateVolatileFraction * (total - volIncrement) + fd.purity * volIncrement) / total
        );

        // For Rose: separate floating essential oil layer
        if (feed.oilColor) {
          this.oilLayerVolume = Math.min(25, this.oilLayerVolume + volIncrement * fd.purity * 0.35);
        }

        // Determine fraction phase classification
        if (total < 15.0) {
          this.fractionPhase = 'FORESHOTS (Heads)';
        } else if (this.distillateVolatileFraction >= feed.targetVolatileFraction * 0.75) {
          this.fractionPhase = 'SPIRITUS (Hearts)';
        } else {
          this.fractionPhase = 'FEINTS (Tails)';
        }

        // Trigger surface ripple wave in receiver
        this.receiverWaves.push({
          x: fd.x - receiver.x,
          amplitude: 4.5,
          phase: 0,
          speed: 12
        });

        // Small splash particles
        for (let s = 0; s < 4; s++) {
          this.splashes.push({
            x: fd.x,
            y: receiverLiquidSurfaceY,
            vx: (Math.random() - 0.5) * 45,
            vy: -25 - Math.random() * 35,
            life: 0.25,
            purity: fd.purity
          });
        }

        // Play procedural ping sound if enabled
        this.playDripSound(fd.purity);

        this.fallingDrops.splice(i, 1);
      }
    }

    // 9. SPLASHES & SURFACE RIPPLES
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 500 * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        this.splashes.splice(i, 1);
      }
    }

    for (let i = this.receiverWaves.length - 1; i >= 0; i--) {
      const w = this.receiverWaves[i];
      w.phase += dt * w.speed;
      w.amplitude *= (1 - dt * 2.5);
      if (w.amplitude < 0.2) {
        this.receiverWaves.splice(i, 1);
      }
    }

    // 10. SEDIMENT / BOTANICAL SWIRL IN CUCURBIT
    const cucurbit = geo.cucurbit;
    const convectionStrength = this.boilIntensity * 35;
    for (let i = 0; i < this.washSediment.length; i++) {
      const s = this.washSediment[i];
      // Convection cells: rise near heated center, fall along outer glass walls
      const relX = (s.x - cucurbit.x) / cucurbit.r;
      s.vy += (-convectionStrength * (1.2 - Math.abs(relX)) + 12) * dt;
      s.vx += (relX > 0 ? 1 : -1) * convectionStrength * 0.4 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vrot * dt;

      // Clamp inside lower cucurbit bulb
      const dx = s.x - cucurbit.x;
      const dy = s.y - cucurbit.y;
      const d = Math.hypot(dx, dy);
      if (d > cucurbit.r * 0.78) {
        const nx = dx / d;
        const ny = dy / d;
        s.x = cucurbit.x + nx * cucurbit.r * 0.78;
        s.y = cucurbit.y + ny * cucurbit.r * 0.78;
        s.vx *= -0.5;
        s.vy *= -0.5;
      }
      // Damping
      s.vx *= (1 - dt * 1.5);
      s.vy *= (1 - dt * 1.5);
    }

    // 11. ATHANOR FLAME PARTICLES & GLOWING EMBERS
    const furnace = geo.furnace;
    if (this.furnaceHeat > 0.02) {
      const flameCount = Math.floor(this.furnaceHeat * 24 * dt * 60);
      for (let f = 0; f < flameCount; f++) {
        this.flameParticles.push({
          x: furnace.hearthX + (Math.random() - 0.5) * (furnace.width * 0.6),
          y: furnace.hearthY - Math.random() * 8,
          vx: (Math.random() - 0.5) * 22,
          vy: -60 - Math.random() * 120 * this.furnaceHeat,
          size: 4 + Math.random() * 8 * this.furnaceHeat,
          hue: 25 + Math.random() * 25, // 25 (orange-red) to 50 (bright yellow)
          life: 0,
          maxLife: 0.25 + Math.random() * 0.35
        });
      }
    }

    // Update Flame
    for (let i = this.flameParticles.length - 1; i >= 0; i--) {
      const fp = this.flameParticles[i];
      fp.life += dt;
      if (fp.life >= fp.maxLife) {
        this.flameParticles.splice(i, 1);
        continue;
      }
      fp.x += fp.vx * dt;
      fp.y += fp.vy * dt;
      fp.size *= (1 - dt * 2.2);
    }
  }

  spawnVaporParticle(x, y, volatileRatio) {
    const geo = this.geo;
    this.vaporParticles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y - 2,
      vx: (Math.random() - 0.5) * 16,
      vy: -35 - Math.random() * 45 * (1 + this.boilIntensity),
      temp: this.washTemp,
      volatileRatio: volatileRatio,
      alpha: 0.45 + Math.random() * 0.4,
      size: 3.5 + Math.random() * 5.5,
      age: 0,
      maxAge: 1.6 + Math.random() * 1.4
    });
  }

  spawnCondensationDroplet(angle, purity) {
    // Only add if not overcrowded
    if (this.condensationDroplets.length > 80) return;
    this.condensationDroplets.push({
      angle: angle,
      mass: 0.5 + Math.random() * 0.8,
      purity: purity,
      radius: 2 + Math.random() * 2.5
    });
  }

  /* -------------------------------------------------------------------------
   * RENDERING PIPELINE: ROMAN ALCHEMY & APPARATUS ART
   * ---------------------------------------------------------------------- */
  render(ctx) {
    if (!ctx) return;
    const w = this.width;
    const h = this.height;
    const geo = this.geo;
    const feed = FEED_CONFIG[this.activeFeed];

    // Clear Canvas with deep alchemical slate backdrop
    ctx.save();
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    // Vignette & subtle ambient laboratory glow
    const bgGrad = ctx.createRadialGradient(w * 0.42, h * 0.45, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    bgGrad.addColorStop(0, '#161c28');
    bgGrad.addColorStop(0.5, '#0d111a');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw Laboratory Workbench & Roman Brick Hearth
    this.renderEnvironment(ctx);

    // Draw Athanor Furnace & Flames
    this.renderAthanor(ctx);

    // Draw Cucurbit Boiling Wash, Sediments & Bubbles
    this.renderCucurbit(ctx);

    // Draw Alembic Helm (Capitellum), Dome Condenser & Gutters
    this.renderAlembicHelm(ctx);

    // Draw Delivery Beak Spout & Condensate Drops
    this.renderDeliveryBeak(ctx);

    // Draw Receiver Flask & Harvest Distillate
    this.renderReceiverFlask(ctx);

    // Draw Alchemical Telemetry HUD & Scientific Instrumentation
    this.renderHUD(ctx);

    ctx.restore();
  }

  /* --- Sub-renderers --- */

  renderEnvironment(ctx) {
    const geo = this.geo;
    const w = this.width;

    // Heavy Roman Oak Laboratory Table / Bench
    ctx.save();
    ctx.fillStyle = '#1c1510';
    ctx.fillRect(0, geo.tableY, w, this.height - geo.tableY);

    // Tabletop bevel & highlight
    ctx.strokeStyle = '#4a382a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, geo.tableY);
    ctx.lineTo(w, geo.tableY);
    ctx.stroke();

    ctx.strokeStyle = '#2b1f16';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, geo.tableY + 4);
    ctx.lineTo(w, geo.tableY + 4);
    ctx.stroke();

    // Subtle bench wood grain lines
    ctx.strokeStyle = 'rgba(70, 50, 35, 0.25)';
    for (let y = geo.tableY + 12; y < this.height; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderAthanor(ctx) {
    const geo = this.geo;
    const f = geo.furnace;

    ctx.save();
    // Terracotta kiln masonry base
    ctx.fillStyle = '#261711';
    ctx.strokeStyle = '#5a3525';
    ctx.lineWidth = 2.5;

    // Arched furnace profile
    ctx.beginPath();
    ctx.moveTo(f.x - f.width * 0.5, f.bottomY);
    ctx.lineTo(f.x - f.width * 0.5, f.topY + 20);
    ctx.quadraticCurveTo(f.x, f.topY, f.x + f.width * 0.5, f.topY + 20);
    ctx.lineTo(f.x + f.width * 0.5, f.bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Roman arched firebox aperture
    const archW = f.width * 0.62;
    const archH = (f.bottomY - f.topY) * 0.68;
    const archTopY = f.bottomY - archH;

    ctx.fillStyle = '#0f0805';
    ctx.beginPath();
    ctx.moveTo(f.x - archW * 0.5, f.bottomY);
    ctx.lineTo(f.x - archW * 0.5, archTopY + archW * 0.3);
    ctx.quadraticCurveTo(f.x, archTopY - 6, f.x + archW * 0.5, archTopY + archW * 0.3);
    ctx.lineTo(f.x + archW * 0.5, f.bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7c3f25';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wrought Iron grate bars across firebox
    ctx.strokeStyle = '#3a2016';
    ctx.lineWidth = 3;
    for (let gx = f.x - archW * 0.38; gx <= f.x + archW * 0.38; gx += archW * 0.18) {
      ctx.beginPath();
      ctx.moveTo(gx, archTopY + 12);
      ctx.lineTo(gx, f.bottomY);
      ctx.stroke();
    }

    // Glowing charcoal embers in hearth
    const emberGlow = ctx.createRadialGradient(f.hearthX, f.hearthY - 10, 5, f.hearthX, f.hearthY - 10, archW * 0.6);
    const heatAlpha = Math.min(1.0, this.furnaceHeat * 1.2);
    emberGlow.addColorStop(0, `rgba(255, 140, 30, ${heatAlpha})`);
    emberGlow.addColorStop(0.4, `rgba(200, 50, 10, ${heatAlpha * 0.7})`);
    emberGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emberGlow;
    ctx.fillRect(f.x - archW * 0.5, archTopY, archW, archH);

    // Render animated flame particles
    for (let i = 0; i < this.flameParticles.length; i++) {
      const fp = this.flameParticles[i];
      const relLife = 1 - (fp.life / fp.maxLife);
      ctx.fillStyle = `hsla(${fp.hue}, 100%, ${50 + relLife * 35}%, ${relLife * 0.85})`;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tripod iron collar supporting the cucurbit
    ctx.strokeStyle = '#4e3322';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(f.x, f.topY + 14, f.width * 0.44, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderCucurbit(ctx) {
    const geo = this.geo;
    const c = geo.cucurbit;
    const feed = FEED_CONFIG[this.activeFeed];

    ctx.save();

    // 1. Back Glass Shadow / Glow
    const cucurbitGlow = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.r);
    cucurbitGlow.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    cucurbitGlow.addColorStop(0.8, 'rgba(100, 150, 180, 0.04)');
    cucurbitGlow.addColorStop(1, 'rgba(40, 70, 90, 0.12)');
    ctx.fillStyle = cucurbitGlow;

    // Glass bulb & elongated neck path
    ctx.beginPath();
    this.pathCucurbitVessel(ctx, c);
    ctx.fill();

    // 2. Liquid Wash Body (Clipped inside cucurbit bulb)
    ctx.save();
    ctx.beginPath();
    this.pathCucurbitVessel(ctx, c);
    ctx.clip();

    // Compute wash liquid level
    const fillFraction = Math.max(0.05, this.washVolume / this.maxWashVolume);
    const liquidTopY = c.y + c.r * (1 - fillFraction * 1.6);
    c.liquidLevelY = liquidTopY;

    // Liquid fill gradient
    const liquidGrad = ctx.createLinearGradient(c.x, liquidTopY, c.x, c.y + c.r);
    liquidGrad.addColorStop(0, feed.washHighlight);
    liquidGrad.addColorStop(0.35, feed.washColor);
    liquidGrad.addColorStop(1, feed.washDeep);
    ctx.fillStyle = liquidGrad;

    ctx.beginPath();
    ctx.rect(c.x - c.r * 1.2, liquidTopY, c.r * 2.4, c.r * 2);
    ctx.fill();

    // Boiling Liquid Meniscus with thermal agitation wave
    ctx.fillStyle = feed.washHighlight;
    ctx.beginPath();
    ctx.moveTo(c.x - c.r, liquidTopY);
    for (let x = c.x - c.r; x <= c.x + c.r; x += 6) {
      const wave = Math.sin(x * 0.08 + this.time * 8) * (1.2 + this.boilIntensity * 3.5);
      ctx.lineTo(x, liquidTopY + wave);
    }
    ctx.lineTo(c.x + c.r, liquidTopY + 12);
    ctx.lineTo(c.x - c.r, liquidTopY + 12);
    ctx.closePath();
    ctx.fill();

    // 3. Swirling Sediments / Botanicals in Wash
    for (let i = 0; i < this.washSediment.length; i++) {
      const s = this.washSediment[i];
      if (s.y > liquidTopY) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        if (feed.sedimentType === 'petals') {
          // Rose petals: curved organic oval
          ctx.fillStyle = `rgba(230, 70, 120, ${s.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, s.size, s.size * s.aspect, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (feed.sedimentType === 'sulfur_crystals') {
          // Brimstone granules: angular diamond crystals
          ctx.fillStyle = `rgba(240, 235, 70, ${s.opacity})`;
          ctx.fillRect(-s.size * 0.5, -s.size * 0.5, s.size, s.size);
        } else {
          // Tartrate lees: speckles
          ctx.fillStyle = `rgba(240, 210, 190, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(0, 0, s.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 4. Boiling Bubbles inside wash
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * b.growth, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Specular highlight on bubble
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end clip

    // 5. Rising Vapor Plume inside cucurbit neck & into dome
    for (let i = 0; i < this.vaporParticles.length; i++) {
      const vp = this.vaporParticles[i];
      const relAge = vp.age / vp.maxAge;
      const alpha = (1 - relAge) * vp.alpha;
      ctx.fillStyle = `${feed.vaporColor}${alpha})`;
      ctx.beginPath();
      ctx.arc(vp.x, vp.y, vp.size * (1 + relAge * 1.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Blown Glass Outer Specular Curves & Reflections
    ctx.strokeStyle = 'rgba(180, 220, 240, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    this.pathCucurbitVessel(ctx, c);
    ctx.stroke();

    // Curved specular highlight line along glass flank
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r - 5, Math.PI * 0.75, Math.PI * 1.15);
    ctx.stroke();

    // Luteum Sapientiae (Philosophic seal clay collar connecting cucurbit to helm)
    ctx.fillStyle = '#8b6540';
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(c.x - c.neckWidth * 0.65, c.neckTopY - 4, c.neckWidth * 1.3, 10, 4);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  pathCucurbitVessel(ctx, c) {
    const halfNeck = c.neckWidth * 0.5;
    // Spherical bulb seamlessly merging into narrow vertical neck
    const neckAngle = Math.asin(halfNeck / c.r);

    ctx.moveTo(c.x - halfNeck, c.neckTopY);
    ctx.lineTo(c.x - halfNeck, c.y - Math.cos(neckAngle) * c.r);
    // Lower spherical curve
    ctx.arc(c.x, c.y, c.r, -Math.PI * 0.5 - neckAngle, -Math.PI * 0.5 + neckAngle, true);
    ctx.lineTo(c.x + halfNeck, c.neckTopY);
    ctx.closePath();
  }

  renderAlembicHelm(ctx) {
    const geo = this.geo;
    const helm = geo.helm;
    const feed = FEED_CONFIG[this.activeFeed];

    ctx.save();

    // Helm Dome Body (Turban / Onion dome shape of Alexandrian alembic)
    const domeGrad = ctx.createRadialGradient(helm.x, helm.y - helm.r * 0.3, 10, helm.x, helm.y, helm.r);
    domeGrad.addColorStop(0, 'rgba(200, 240, 255, 0.15)');
    domeGrad.addColorStop(0.7, 'rgba(100, 180, 210, 0.1)');
    domeGrad.addColorStop(1, 'rgba(40, 100, 130, 0.25)');
    ctx.fillStyle = domeGrad;

    ctx.beginPath();
    this.pathAlembicDome(ctx, helm);
    ctx.fill();

    // Cooling Mantle / Wet Sponge Wrapped around top dome
    const spongeAlpha = Math.min(0.85, 0.2 + this.condenserCoolness * 0.65);
    ctx.fillStyle = `rgba(56, 189, 248, ${spongeAlpha * 0.25})`;
    ctx.strokeStyle = `rgba(125, 211, 252, ${spongeAlpha * 0.55})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(helm.x, helm.y, helm.r + 4, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Internal Condensation Gutter (Ring channel catching condensate at dome base)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)'; // Gilded copper gutter ring
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(helm.x, helm.gutterY, helm.r * 0.85, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Render Clinging Condensation Droplets on inner dome ceiling
    for (let i = 0; i < this.condensationDroplets.length; i++) {
      const d = this.condensationDroplets[i];
      ctx.fillStyle = feed.distillateColor;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius * (0.8 + d.mass * 0.4), 0, Math.PI * 2);
      ctx.fill();

      // Gleam on bead
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(d.x - 0.8, d.y - 0.8, d.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Blown glass dome outer rim
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    this.pathAlembicDome(ctx, helm);
    ctx.stroke();

    // Helm apex nipple / knob
    ctx.fillStyle = 'rgba(180, 230, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(helm.x, helm.y - helm.r * 0.98, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  pathAlembicDome(ctx, helm) {
    const hr = helm.r;
    // Hellenistic alembic turban dome with internal gutter lip
    ctx.moveTo(helm.x - hr * 0.85, helm.gutterY);
    ctx.bezierCurveTo(
      helm.x - hr * 1.05, helm.y + hr * 0.1,
      helm.x - hr * 0.95, helm.y - hr * 0.6,
      helm.x, helm.y - hr * 0.98
    );
    ctx.bezierCurveTo(
      helm.x + hr * 0.95, helm.y - hr * 0.6,
      helm.x + hr * 1.05, helm.y + hr * 0.1,
      helm.x + hr * 0.85, helm.gutterY
    );
    ctx.closePath();
  }

  renderDeliveryBeak(ctx) {
    const geo = this.geo;
    const beak = geo.beak;
    const feed = FEED_CONFIG[this.activeFeed];

    ctx.save();

    // Delivery Rostrum / Beak (Slender inclined glass tube)
    const normalX = -Math.sin(beak.angle) * beak.tubeRadius;
    const normalY = Math.cos(beak.angle) * beak.tubeRadius;

    // Tube cavity
    ctx.fillStyle = 'rgba(140, 200, 230, 0.08)';
    ctx.beginPath();
    ctx.moveTo(beak.startX + normalX, beak.startY + normalY);
    ctx.lineTo(beak.endX + normalX, beak.endY + normalY);
    ctx.lineTo(beak.endX - normalX, beak.endY - normalY);
    ctx.lineTo(beak.startX - normalX, beak.startY - normalY);
    ctx.closePath();
    ctx.fill();

    // Condensate stream sliding down the floor of the beak tube
    ctx.strokeStyle = feed.distillateColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(beak.startX - normalX * 0.5, beak.startY - normalY * 0.5);
    ctx.lineTo(beak.endX - normalX * 0.5, beak.endY - normalY * 0.5);
    ctx.stroke();

    // Traveling droplets inside the delivery tube
    for (let i = 0; i < this.beakDrops.length; i++) {
      const bd = this.beakDrops[i];
      const frac = bd.distAlongBeak / beak.length;
      const dx = beak.startX + (beak.endX - beak.startX) * frac;
      const dy = beak.startY + (beak.endY - beak.startY) * frac - normalY * 0.4;

      ctx.fillStyle = feed.distillateColor;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.5 + bd.mass * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glass tube walls
    ctx.strokeStyle = 'rgba(180, 225, 245, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(beak.startX + normalX, beak.startY + normalY);
    ctx.lineTo(beak.endX + normalX, beak.endY + normalY);
    ctx.moveTo(beak.startX - normalX, beak.startY - normalY);
    ctx.lineTo(beak.endX - normalX, beak.endY - normalY);
    ctx.stroke();

    // Nozzle tip at beak end
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(beak.endX, beak.endY, beak.tubeRadius, 3, beak.angle, 0, Math.PI * 2);
    ctx.stroke();

    // Freefalling Distillate Drips
    for (let i = 0; i < this.fallingDrops.length; i++) {
      const fd = this.fallingDrops[i];
      ctx.fillStyle = feed.distillateColor;
      ctx.beginPath();
      // Elongated teardrop shape in flight
      ctx.ellipse(fd.x, fd.y, 2.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular shine on drip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fd.x - 0.7, fd.y - 1.2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderReceiverFlask(ctx) {
    const geo = this.geo;
    const r = geo.receiver;
    const feed = FEED_CONFIG[this.activeFeed];

    ctx.save();

    // Wooden stand block underneath receiver
    ctx.fillStyle = '#2d1f14';
    ctx.strokeStyle = '#4e3422';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(r.x - r.r * 0.65, r.baseY - 12, r.r * 1.3, 12, 3);
    ctx.fill();
    ctx.stroke();

    // 1. Receiver Glass Flask Body
    const receiverGlow = ctx.createRadialGradient(r.x, r.y, 8, r.x, r.y, r.r);
    receiverGlow.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    receiverGlow.addColorStop(0.8, 'rgba(120, 180, 220, 0.06)');
    receiverGlow.addColorStop(1, 'rgba(50, 90, 120, 0.15)');
    ctx.fillStyle = receiverGlow;

    ctx.beginPath();
    this.pathReceiverVessel(ctx, r);
    ctx.fill();

    // 2. Accumulated Distillate Liquid (Clipped inside receiver)
    ctx.save();
    ctx.beginPath();
    this.pathReceiverVessel(ctx, r);
    ctx.clip();

    if (this.distillateVolume > 0.5) {
      const fillHeight = (this.distillateVolume / this.maxReceiverVolume) * (r.r * 1.35) + 8;
      const liquidSurfaceY = r.baseY - fillHeight;

      // Aqueous / Spirit Distillate Layer
      const distGrad = ctx.createLinearGradient(r.x, liquidSurfaceY, r.x, r.baseY);
      distGrad.addColorStop(0, feed.distillateColor);
      distGrad.addColorStop(1, 'rgba(140, 210, 245, 0.45)');
      ctx.fillStyle = distGrad;
      ctx.fillRect(r.x - r.r * 1.1, liquidSurfaceY, r.r * 2.2, fillHeight + 10);

      // Essential Oil Floating Layer (For Rosewater Attar)
      if (feed.oilColor && this.oilLayerVolume > 0.2) {
        const oilHeight = Math.min(14, (this.oilLayerVolume / 20) * 12 + 3);
        ctx.fillStyle = feed.oilColor;
        ctx.fillRect(r.x - r.r * 0.9, liquidSurfaceY - 1, r.r * 1.8, oilHeight);
      }

      // Distillate Meniscus with ripple waves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r.x - r.r * 0.75, liquidSurfaceY);
      for (let x = r.x - r.r * 0.75; x <= r.x + r.r * 0.75; x += 4) {
        let waveOffset = 0;
        for (let w = 0; w < this.receiverWaves.length; w++) {
          const rw = this.receiverWaves[w];
          const dist = Math.abs((x - r.x) - rw.x);
          waveOffset += Math.sin(dist * 0.3 - rw.phase) * rw.amplitude * Math.exp(-dist * 0.08);
        }
        ctx.lineTo(x, liquidSurfaceY + waveOffset);
      }
      ctx.stroke();
    }

    // Splashes on surface
    for (let i = 0; i < this.splashes.length; i++) {
      const sp = this.splashes[i];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end clip

    // 3. Roman Graduation Marks on Glass Flank (Unciae / Cyathi)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    for (let m = 1; m <= 5; m++) {
      const markY = r.baseY - (m / 6) * (r.r * 1.35) - 6;
      ctx.beginPath();
      ctx.moveTo(r.x + r.r * 0.45, markY);
      ctx.lineTo(r.x + r.r * 0.65, markY);
      ctx.stroke();
    }

    // 4. Blown Glass Outer Specular Curves
    ctx.strokeStyle = 'rgba(180, 220, 240, 0.55)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    this.pathReceiverVessel(ctx, r);
    ctx.stroke();

    // Highlight sheen along right side
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r - 4, -Math.PI * 0.15, Math.PI * 0.25);
    ctx.stroke();

    ctx.restore();
  }

  pathReceiverVessel(ctx, r) {
    const halfNeck = r.neckWidth * 0.5;
    ctx.moveTo(r.x - halfNeck, r.neckTopY);
    ctx.lineTo(r.x - halfNeck, r.y - r.r * 0.55);
    // Bulbous pyriform vessel
    ctx.bezierCurveTo(
      r.x - r.r * 0.95, r.y - r.r * 0.2,
      r.x - r.r * 0.95, r.baseY - 4,
      r.x, r.baseY - 4
    );
    ctx.bezierCurveTo(
      r.x + r.r * 0.95, r.baseY - 4,
      r.x + r.r * 0.95, r.y - r.r * 0.2,
      r.x + halfNeck, r.y - r.r * 0.55
    );
    ctx.lineTo(r.x + halfNeck, r.neckTopY);
    ctx.closePath();
  }

  renderHUD(ctx) {
    const w = this.width;
    const feed = FEED_CONFIG[this.activeFeed];

    ctx.save();

    // Top Laboratory Telemetry Header Bar
    ctx.fillStyle = 'rgba(12, 16, 24, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)'; // Gilded alchemical border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, Math.min(w - 28, 480), 108, 6);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px "Cinzel", "Times New Roman", serif, sans-serif';
    ctx.fillText(`ALEXANDRIAN ALEMBIC • ${feed.latin.toUpperCase()}`, 26, 34);

    // Book citation
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${feed.book} — ${feed.name}`, 26, 50);

    // Live Thermodynamic Telemetry Columns
    ctx.font = '12px "Courier New", monospace, sans-serif';

    // Wash & Boiler
    ctx.fillStyle = '#f97316';
    ctx.fillText(`Cucurbit Wash: ${this.washTemp.toFixed(1)}°C`, 26, 72);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Volume: ${this.washVolume.toFixed(0)} mL (${Math.round(this.washVolatileFraction * 100)}% init)`, 26, 88);
    ctx.fillStyle = this.boilIntensity > 0.05 ? '#22c55e' : '#64748b';
    ctx.fillText(`Vapor Press: ${this.vaporPressureTotal.toFixed(1)} kPa [${this.boilIntensity > 0.05 ? 'EBULLITION' : 'HEATING'}]`, 26, 104);

    // Condenser & Receiver Card (Right-aligned or beside)
    const cardX = Math.min(w - 28, 480) - 175;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Helm Dome: ${this.condenserTemp.toFixed(1)}°C`, cardX, 72);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText(`Yield: ${this.distillateVolume.toFixed(1)} mL`, cardX, 88);

    // Fraction Phase Badge
    ctx.fillStyle = this.fractionPhase.includes('Hearts') || this.fractionPhase.includes('SPIRITUS')
      ? '#4ade80'
      : (this.fractionPhase.includes('Heads') || this.fractionPhase.includes('FORESHOTS') ? '#facc15' : '#94a3b8');
    ctx.fillText(`Cut: ${this.fractionPhase}`, cardX, 104);

    // Vessel Floating Labels
    ctx.font = '11px "Cinzel", "Times New Roman", serif, sans-serif';
    ctx.textAlign = 'center';

    // Cucurbit label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('CUCURBITA (BOILER)', this.geo.cucurbit.x, this.geo.cucurbit.y + this.geo.cucurbit.r + 20);

    // Helm label
    ctx.fillText('CAPITELLUM (HELM)', this.geo.helm.x, this.geo.helm.y - this.geo.helm.r - 8);

    // Receiver label
    ctx.fillText('AMPULLA (RECEIVER)', this.geo.receiver.x, this.geo.receiver.baseY + 18);

    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * USER INTERACTION HANDLERS (MOUSE & KEYBOARD)
   * ---------------------------------------------------------------------- */
  onMouseDown(pos) {
    if (!pos) return;
    this.mouse.isDown = true;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.initAudio();

    // Check interaction hotspots
    const geo = this.geo;

    // 1. Click on Athanor Furnace -> Stoke fire / adjust flame
    const f = geo.furnace;
    if (pos.x >= f.x - f.width * 0.6 && pos.x <= f.width * 0.6 + f.x &&
        pos.y >= f.topY && pos.y <= f.bottomY) {
      // Toggle or boost furnace heat
      this.furnaceHeat = Math.min(1.0, this.furnaceHeat + 0.2);
      if (this.domControls.sliderFurnace) {
        this.domControls.sliderFurnace.value = Math.round(this.furnaceHeat * 100);
      }
      if (this.domControls.valFurnace) {
        this.domControls.valFurnace.textContent = `${Math.round(this.furnaceHeat * 100)}%`;
      }
      return;
    }

    // 2. Click on Cucurbit -> Agitate wash / nucleate burst
    const c = geo.cucurbit;
    if (Math.hypot(pos.x - c.x, pos.y - c.y) <= c.r) {
      for (let i = 0; i < 18; i++) {
        this.bubbles.push({
          x: c.x + (Math.random() - 0.5) * (c.r * 0.8),
          y: c.y + c.r * 0.5 - Math.random() * 20,
          vy: -60 - Math.random() * 50,
          vx: (Math.random() - 0.5) * 20,
          radius: 2 + Math.random() * 3,
          wobblePhase: Math.random() * Math.PI * 2,
          growth: 1.0
        });
      }
      return;
    }

    // 3. Click on Receiver -> Purge / collect fraction cut
    const r = geo.receiver;
    if (Math.hypot(pos.x - r.x, pos.y - r.y) <= r.r) {
      this.purgeCondenser();
    }
  }

  onMouseMove(pos) {
    if (!pos) return;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    // Dragging near furnace adjusts flame height
    if (this.mouse.isDown) {
      const f = this.geo.furnace;
      if (pos.x >= f.x - f.width * 0.7 && pos.x <= f.x + f.width * 0.7 &&
          pos.y >= f.topY - 30 && pos.y <= f.bottomY + 20) {
        const normY = 1.0 - Math.max(0, Math.min(1, (pos.y - f.topY) / (f.bottomY - f.topY)));
        this.furnaceHeat = normY;
        if (this.domControls.sliderFurnace) {
          this.domControls.sliderFurnace.value = Math.round(this.furnaceHeat * 100);
        }
        if (this.domControls.valFurnace) {
          this.domControls.valFurnace.textContent = `${Math.round(this.furnaceHeat * 100)}%`;
        }
      }
    }
  }

  onMouseUp() {
    this.mouse.isDown = false;
  }

  onKeyDown(key, e) {
    if (!key) return;
    const k = key.toLowerCase();

    if (k === ' ' || key === 'Spacebar') {
      if (e && e.preventDefault) e.preventDefault();
      this.purgeCondenser();
    } else if (k === 'r') {
      this.reset(false);
    } else if (k === '1') {
      this.setFeed(FEED_TYPE.WINE);
      if (this.domControls.feedBtns) {
        this.domControls.feedBtns.forEach(b => b.classList.toggle('active', b.dataset.feed === FEED_TYPE.WINE));
      }
    } else if (k === '2') {
      this.setFeed(FEED_TYPE.ROSE);
      if (this.domControls.feedBtns) {
        this.domControls.feedBtns.forEach(b => b.classList.toggle('active', b.dataset.feed === FEED_TYPE.ROSE));
      }
    } else if (k === '3') {
      this.setFeed(FEED_TYPE.SULFUR);
      if (this.domControls.feedBtns) {
        this.domControls.feedBtns.forEach(b => b.classList.toggle('active', b.dataset.feed === FEED_TYPE.SULFUR));
      }
    } else if (k === 'arrowup') {
      if (e && e.preventDefault) e.preventDefault();
      this.furnaceHeat = Math.min(1.0, this.furnaceHeat + 0.05);
      if (this.domControls.sliderFurnace) this.domControls.sliderFurnace.value = Math.round(this.furnaceHeat * 100);
      if (this.domControls.valFurnace) this.domControls.valFurnace.textContent = `${Math.round(this.furnaceHeat * 100)}%`;
    } else if (k === 'arrowdown') {
      if (e && e.preventDefault) e.preventDefault();
      this.furnaceHeat = Math.max(0.0, this.furnaceHeat - 0.05);
      if (this.domControls.sliderFurnace) this.domControls.sliderFurnace.value = Math.round(this.furnaceHeat * 100);
      if (this.domControls.valFurnace) this.domControls.valFurnace.textContent = `${Math.round(this.furnaceHeat * 100)}%`;
    } else if (k === 'arrowleft') {
      if (e && e.preventDefault) e.preventDefault();
      this.condenserCoolness = Math.max(0.0, this.condenserCoolness - 0.05);
      if (this.domControls.sliderCondenser) this.domControls.sliderCondenser.value = Math.round(this.condenserCoolness * 100);
      if (this.domControls.valCondenser) this.domControls.valCondenser.textContent = `${Math.round(this.condenserCoolness * 100)}%`;
    } else if (k === 'arrowright') {
      if (e && e.preventDefault) e.preventDefault();
      this.condenserCoolness = Math.min(1.0, this.condenserCoolness + 0.05);
      if (this.domControls.sliderCondenser) this.domControls.sliderCondenser.value = Math.round(this.condenserCoolness * 100);
      if (this.domControls.valCondenser) this.domControls.valCondenser.textContent = `${Math.round(this.condenserCoolness * 100)}%`;
    }
  }

  onKeyUp(key, e) {
    // Optional safe handler
  }
}
