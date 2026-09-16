// Aurum: Hydraulic Alluvial Mining & Roman Sluice Box Physics
// Grounded in Pliny the Elder's Naturalis Historia (Book XXXIII: Ruina Montium & Gold Washing)

export const SEDIMENT_TYPE = {
  GOLD: 0,
  BLACK_SAND: 1,
  QUARTZ: 2
};

export const MATERIAL_CONFIG = {
  [SEDIMENT_TYPE.GOLD]: {
    name: 'Aurum (Gold)',
    symbol: 'Au',
    density: 19.3, // g/cm³
    baseColor: '#ffd700',
    highlightColor: '#fff8a6',
    darkColor: '#b8860b',
    specular: '#ffffff',
    radiusRange: [3.0, 5.8],
    dragMultiplier: 0.14, // High mass = low drag-to-mass ratio
    restitution: 0.18,
    friction: 0.88,
    valuePerUnit: 0.25 // Roman unciae
  },
  [SEDIMENT_TYPE.BLACK_SAND]: {
    name: 'Magnetite (Black Sand)',
    symbol: 'Fe3O4',
    density: 5.2, // g/cm³
    baseColor: '#25272e',
    highlightColor: '#4f5565',
    darkColor: '#121317',
    specular: '#8a94a6',
    radiusRange: [2.0, 3.4],
    dragMultiplier: 0.48,
    restitution: 0.28,
    friction: 0.72,
    valuePerUnit: 0.0
  },
  [SEDIMENT_TYPE.QUARTZ]: {
    name: 'Quartz Gravel / Silt',
    symbol: 'SiO2',
    density: 2.6, // g/cm³
    baseColor: '#d8c89d',
    highlightColor: '#f3ebd6',
    darkColor: '#9e8f66',
    specular: '#fdfbf7',
    radiusRange: [2.2, 4.4],
    dragMultiplier: 1.0, // High buoyancy and high drag
    restitution: 0.42,
    friction: 0.52,
    valuePerUnit: 0.0
  }
};

export class AurumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Active Mode: 'sluice' (Roman Sluice Box) or 'batea' (Batea Gold Pan)
    this.mode = 'sluice';

    // Simulation Parameters
    this.waterVelocity = 280; // px/sec inflow
    this.sluiceAngle = 10.5; // degrees inclination
    this.paydirtFeedRate = 12; // particles per second continuous feed
    this.feedAccumulator = 0;

    // Particulate Collections
    this.sediment = []; // Multi-density particulate paydirt
    this.waterParticles = []; // Flowing fluid markers / streamlines
    this.foamParticles = []; // Aerated froth & vortex bubbles
    this.sparkles = []; // Sun glints on exposed gold nuggets
    this.harvestCoins = []; // Celebratory coin burst FX

    // Sluice Box Geometry & Riffles
    this.sluice = {
      x1: 60,
      y1: 150,
      x2: 740,
      y2: 430,
      length: 700,
      bedDepth: 75,
      riffleHeight: 22,
      riffleWidth: 10,
      numRiffles: 6,
      riffleSpacing: 78,
      firstRiffleOffset: 160
    };

    // Batea Gold Pan Geometry & State
    this.batea = {
      cx: 400,
      cy: 320,
      radius: 220,
      depth: 40,
      tiltX: 0,
      tiltY: 0,
      targetTiltX: 0,
      targetTiltY: 0,
      swirlAngle: 0,
      swirlVelocity: 0,
      swirlIntensity: 0,
      waterSloshX: 0,
      waterSloshY: 0,
      waterSloshVx: 0,
      waterSloshVy: 0,
      waterVolume: 1.0,
      isPanning: false
    };

    // Telemetry & Roman Treasury HUD
    this.goldHarvestedOz = 0.0; // Roman Unciae (1 Uncia = 27.28 grams)
    this.tailingsWashedCount = 0;
    this.paydirtDepositedCount = 0;
    this.bannerText = '';
    this.bannerTimer = 0;
    this.harvestFlash = 0;

    // Input Tracking
    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.5,
      rawX: this.width * 0.5,
      rawY: this.height * 0.5,
      prevX: this.width * 0.5,
      prevY: this.height * 0.5,
      vx: 0,
      vy: 0,
      isDown: false,
      downStartTime: 0
    };

    // DOM Controls references
    this.domControls = {};

    this.initSluiceGeometry();
    this.buildControls();
    this.reset();
  }

  initSluiceGeometry() {
    const marginX = Math.max(50, this.width * 0.07);
    const startY = Math.max(100, this.height * 0.22);
    const rad = (this.sluiceAngle * Math.PI) / 180;
    const availableW = this.width - marginX * 2;
    
    this.sluice.x1 = marginX;
    this.sluice.y1 = startY;
    this.sluice.length = availableW / Math.cos(rad);
    this.sluice.x2 = this.sluice.x1 + this.sluice.length * Math.cos(rad);
    this.sluice.y2 = this.sluice.y1 + this.sluice.length * Math.sin(rad);
    this.sluice.bedDepth = Math.max(65, this.height * 0.12);

    // Reposition Batea Pan
    this.batea.cx = this.width * 0.5;
    this.batea.cy = Math.max(220, this.height * 0.52);
    this.batea.radius = Math.min(this.width * 0.38, this.height * 0.36, 240);
  }

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Operational Mode</label>
        <div class="control-btn-grid" id="mode-selector">
          <button class="sub-btn ${this.mode === 'sluice' ? 'active' : ''}" data-mode="sluice">
            🌊 Sluice Box (Agoga)
          </button>
          <button class="sub-btn ${this.mode === 'batea' ? 'active' : ''}" data-mode="batea">
            🥣 Batea Pan (Pelvis)
          </button>
        </div>
      </div>

      <div class="control-group" id="group-water">
        <label>
          <span>Water Inflow Velocity</span>
          <span id="val-water">${Math.round(this.waterVelocity)} px/s</span>
        </label>
        <input type="range" id="slider-water" min="100" max="520" step="10" value="${this.waterVelocity}">
      </div>

      <div class="control-group" id="group-angle">
        <label>
          <span>Sluice Incline Angle</span>
          <span id="val-angle">${this.sluiceAngle.toFixed(1)}°</span>
        </label>
        <input type="range" id="slider-angle" min="4" max="22" step="0.5" value="${this.sluiceAngle}">
      </div>

      <div class="control-group">
        <label>
          <span>Paydirt Feed Rate</span>
          <span id="val-feed">${this.paydirtFeedRate} parts/s</span>
        </label>
        <input type="range" id="slider-feed" min="0" max="35" step="1" value="${this.paydirtFeedRate}">
      </div>

      <div class="control-btn-grid" style="margin-top: 6px;">
        <button id="btn-deposit-scoop" class="sub-btn" style="background: rgba(212, 175, 55, 0.18); border-color: var(--accent-gold); font-weight: 600;">
          ⛏️ Scoop Paydirt (S)
        </button>
        <button id="btn-harvest-gold" class="sub-btn" style="background: rgba(255, 215, 0, 0.25); border-color: #ffd700; color: #ffd700; font-weight: 700;">
          🏺 Harvest Gold (H)
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="btn-flush-clean" class="sub-btn">
          🧹 Clean Out / Reset Sluice
        </button>
      </div>
    `;

    // Cache elements
    this.domControls = {
      modeBtns: this.controlsContainer.querySelectorAll('#mode-selector .sub-btn'),
      sliderWater: this.controlsContainer.querySelector('#slider-water'),
      valWater: this.controlsContainer.querySelector('#val-water'),
      sliderAngle: this.controlsContainer.querySelector('#slider-angle'),
      valAngle: this.controlsContainer.querySelector('#val-angle'),
      sliderFeed: this.controlsContainer.querySelector('#slider-feed'),
      valFeed: this.controlsContainer.querySelector('#val-feed'),
      btnDeposit: this.controlsContainer.querySelector('#btn-deposit-scoop'),
      btnHarvest: this.controlsContainer.querySelector('#btn-harvest-gold'),
      btnClean: this.controlsContainer.querySelector('#btn-flush-clean')
    };

    // Mode switch handler
    this.domControls.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.domControls.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.mode);
      });
    });

    // Slider Water
    this.domControls.sliderWater.addEventListener('input', (e) => {
      this.waterVelocity = parseFloat(e.target.value);
      this.domControls.valWater.textContent = `${Math.round(this.waterVelocity)} px/s`;
    });

    // Slider Angle
    this.domControls.sliderAngle.addEventListener('input', (e) => {
      this.sluiceAngle = parseFloat(e.target.value);
      this.domControls.valAngle.textContent = `${this.sluiceAngle.toFixed(1)}°`;
      this.initSluiceGeometry();
    });

    // Slider Feed
    this.domControls.sliderFeed.addEventListener('input', (e) => {
      this.paydirtFeedRate = parseFloat(e.target.value);
      this.domControls.valFeed.textContent = `${this.paydirtFeedRate} parts/s`;
    });

    // Button Deposit Scoop
    this.domControls.btnDeposit.addEventListener('click', () => {
      this.depositPaydirtScoop();
    });

    // Button Harvest Gold
    this.domControls.btnHarvest.addEventListener('click', () => {
      this.harvestGold();
    });

    // Button Clean
    this.domControls.btnClean.addEventListener('click', () => {
      this.reset();
    });
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    if (this.domControls.modeBtns) {
      this.domControls.modeBtns.forEach(b => {
        if (b.dataset.mode === this.mode) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    if (this.mode === 'batea') {
      this.setBanner('PELVIS AURARIA — Swirl mouse to stratify; tilt outward to wash quartz!');
      // Populate batea with initial paydirt
      this.sediment = [];
      this.waterParticles = [];
      this.depositPaydirtScoop(80);
    } else {
      this.setBanner('AGOGA HISPANICA — Roman wooden sluice box with vortex riffle cleats');
      this.reset();
    }
  }

  setBanner(msg, duration = 3.5) {
    this.bannerText = msg;
    this.bannerTimer = duration;
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.initSluiceGeometry();
  }

  reset() {
    this.sediment = [];
    this.waterParticles = [];
    this.foamParticles = [];
    this.sparkles = [];
    this.harvestCoins = [];
    this.feedAccumulator = 0;
    this.batea.waterVolume = 1.0;
    this.batea.tiltX = 0;
    this.batea.tiltY = 0;
    this.batea.swirlIntensity = 0;

    // Seed with initial paydirt scoop
    this.depositPaydirtScoop(50);
  }

  destroy() {
    this.sediment = [];
    this.waterParticles = [];
    this.foamParticles = [];
    this.sparkles = [];
    this.harvestCoins = [];
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  getEntityCount() {
    // Total count of active gold nuggets, quartz sand particles, and water particles
    return this.sediment.length + this.waterParticles.length;
  }

  depositPaydirtScoop(count = 65) {
    this.paydirtDepositedCount += count;
    const isSluice = (this.mode === 'sluice');

    for (let i = 0; i < count; i++) {
      // Composition: ~18% Gold, ~27% Black Sand, ~55% Quartz Gravel
      const roll = Math.random();
      let type = SEDIMENT_TYPE.QUARTZ;
      if (roll < 0.18) type = SEDIMENT_TYPE.GOLD;
      else if (roll < 0.45) type = SEDIMENT_TYPE.BLACK_SAND;

      const cfg = MATERIAL_CONFIG[type];
      const r = cfg.radiusRange[0] + Math.random() * (cfg.radiusRange[1] - cfg.radiusRange[0]);

      if (isSluice) {
        // Drop in hopper flume at top left
        const rad = (this.sluiceAngle * Math.PI) / 180;
        const normX = -Math.sin(rad);
        const normY = Math.cos(rad);
        const tangX = Math.cos(rad);
        const tangY = Math.sin(rad);

        const sPos = 20 + Math.random() * 60;
        const hPos = 15 + Math.random() * 35;

        const x = this.sluice.x1 + tangX * sPos - normX * hPos;
        const y = this.sluice.y1 + tangY * sPos - normY * hPos;

        this.sediment.push({
          type,
          x,
          y,
          vx: tangX * (50 + Math.random() * 80),
          vy: tangY * (50 + Math.random() * 80),
          radius: r,
          density: cfg.density,
          mass: cfg.density * (r * r * 0.1),
          trappedInRiffle: -1,
          glintTimer: Math.random() * 2.0,
          stratLayer: 0 // 0: bottom, 1: mid, 2: top
        });
      } else {
        // Drop into circular batea pan
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * (this.batea.radius * 0.45);
        const x = this.batea.cx + Math.cos(ang) * dist;
        const y = this.batea.cy + Math.sin(ang) * dist;

        this.sediment.push({
          type,
          x,
          y,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          radius: r,
          density: cfg.density,
          mass: cfg.density * (r * r * 0.1),
          trappedInRiffle: -1,
          glintTimer: Math.random() * 2.0,
          stratLayer: type === SEDIMENT_TYPE.GOLD ? 0 : (type === SEDIMENT_TYPE.BLACK_SAND ? 1 : 2)
        });
      }
    }

    if (this.sediment.length > 750) {
      // Keep within high performance bounds: cull excess quartz first
      let culled = 0;
      for (let j = this.sediment.length - 1; j >= 0 && culled < 80; j--) {
        if (this.sediment[j].type === SEDIMENT_TYPE.QUARTZ) {
          this.sediment.splice(j, 1);
          culled++;
        }
      }
    }
  }

  harvestGold() {
    let harvestedGoldCount = 0;
    let trappedBlackSand = 0;
    let trappedQuartz = 0;
    let harvestedOz = 0;

    const remainingSediment = [];

    if (this.mode === 'sluice') {
      for (const p of this.sediment) {
        if (p.trappedInRiffle >= 0) {
          if (p.type === SEDIMENT_TYPE.GOLD) {
            harvestedGoldCount++;
            harvestedOz += MATERIAL_CONFIG[SEDIMENT_TYPE.GOLD].valuePerUnit * (p.radius / 4.0);
            this.spawnHarvestEffect(p.x, p.y);
          } else if (p.type === SEDIMENT_TYPE.BLACK_SAND) {
            trappedBlackSand++;
          } else {
            trappedQuartz++;
          }
        } else {
          remainingSediment.push(p);
        }
      }
    } else {
      // In Batea: harvest all gold resting in center or riffle rings
      for (const p of this.sediment) {
        const d = Math.hypot(p.x - this.batea.cx, p.y - this.batea.cy);
        if (p.type === SEDIMENT_TYPE.GOLD && d < this.batea.radius * 0.6) {
          harvestedGoldCount++;
          harvestedOz += MATERIAL_CONFIG[SEDIMENT_TYPE.GOLD].valuePerUnit * (p.radius / 4.0);
          this.spawnHarvestEffect(p.x, p.y);
        } else if (d < this.batea.radius * 0.6) {
          if (p.type === SEDIMENT_TYPE.BLACK_SAND) trappedBlackSand++;
          else trappedQuartz++;
          remainingSediment.push(p);
        } else {
          remainingSediment.push(p);
        }
      }
    }

    this.sediment = remainingSediment;

    if (harvestedGoldCount > 0) {
      this.goldHarvestedOz += harvestedOz;
      const totalConcentrate = harvestedGoldCount + trappedBlackSand + trappedQuartz;
      const purity = totalConcentrate > 0 ? (harvestedGoldCount / totalConcentrate) * 100 : 100;
      this.harvestFlash = 1.0;
      this.setBanner(`VICTORIA AURIFERA! Harvested +${harvestedOz.toFixed(2)} Unciae (Purity: ${purity.toFixed(1)}% Au)`, 4.5);
    } else {
      this.setBanner('No trapped gold ready in riffles yet! Allow water to wash quartz away first.', 3.0);
    }
  }

  spawnHarvestEffect(x, y) {
    for (let i = 0; i < 3; i++) {
      this.harvestCoins.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 90,
        vy: -80 - Math.random() * 120,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 8,
        size: 5 + Math.random() * 4,
        life: 1.2,
        maxLife: 1.2
      });
    }
  }

  update(dt) {
    // Clamp dt to avoid physics blowup on tab blur
    const clampedDt = Math.min(dt, 0.05);

    if (this.bannerTimer > 0) {
      this.bannerTimer -= clampedDt;
    }
    if (this.harvestFlash > 0) {
      this.harvestFlash = Math.max(0, this.harvestFlash - clampedDt * 2.0);
    }

    // Auto feed paydirt if continuous feed active
    if (this.paydirtFeedRate > 0) {
      this.feedAccumulator += clampedDt * this.paydirtFeedRate;
      if (this.feedAccumulator >= 1.0) {
        const count = Math.floor(this.feedAccumulator);
        this.feedAccumulator -= count;
        this.depositPaydirtScoop(Math.min(count, 4));
      }
    }

    if (this.mode === 'sluice') {
      this.updateSluiceMode(clampedDt);
    } else {
      this.updateBateaMode(clampedDt);
    }

    // Update Coin FX
    for (let i = this.harvestCoins.length - 1; i >= 0; i--) {
      const c = this.harvestCoins[i];
      c.x += c.vx * clampedDt;
      c.y += c.vy * clampedDt;
      c.vy += 220 * clampedDt; // Gravity
      c.rot += c.rotV * clampedDt;
      c.life -= clampedDt;
      if (c.life <= 0) {
        this.harvestCoins.splice(i, 1);
      }
    }

    // Update Sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.scale += s.scaleSpeed * clampedDt;
      s.life -= clampedDt;
      if (s.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  updateSluiceMode(dt) {
    const rad = (this.sluiceAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    // Tangent down the sluice incline: (cosA, sinA)
    // Normal perpendicular upward from bed: (-sinA, cosA)
    const tangX = cosA;
    const tangY = sinA;
    const normX = -sinA;
    const normY = cosA;

    const g = 480; // Gravity acceleration px/s²
    const gTang = g * sinA; // Downhill gravity component

    // 1. Inflow Water Stream Injection
    const waterSpawnCount = Math.floor(this.waterVelocity * 0.12 * dt * 25);
    for (let w = 0; w < Math.min(waterSpawnCount, 6); w++) {
      if (this.waterParticles.length < 380) {
        const s = 10 + Math.random() * 30;
        const h = 5 + Math.random() * (this.sluice.bedDepth * 0.45);
        const x = this.sluice.x1 + tangX * s - normX * h;
        const y = this.sluice.y1 + tangY * s - normY * h;

        this.waterParticles.push({
          x,
          y,
          s,
          h,
          vx: tangX * this.waterVelocity,
          vy: tangY * this.waterVelocity,
          life: 1.0,
          opacity: 0.35 + Math.random() * 0.35
        });
      }
    }

    // 2. Update Water Stream & Riffle Vortices
    const riffleCount = this.sluice.numRiffles;
    const rHeight = this.sluice.riffleHeight;
    const rSpacing = this.sluice.riffleSpacing;
    const rStart = this.sluice.firstRiffleOffset;

    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const wp = this.waterParticles[i];

      // Project into Sluice (s, h) coordinates
      const relX = wp.x - this.sluice.x1;
      const relY = wp.y - this.sluice.y1;
      let s = relX * tangX + relY * tangY;
      let h = -(relX * normX + relY * normY);

      // Main channel velocity
      let u_water = this.waterVelocity * Math.sqrt(Math.max(0.15, h / this.sluice.bedDepth)) + gTang * 0.15;
      let v_water = 0;

      // Check riffle vortex eddy interactions
      for (let r = 0; r < riffleCount; r++) {
        const rPos = rStart + r * rSpacing;
        // Upstream deflector zone: flow climbs over riffle
        if (s > rPos - 20 && s <= rPos && h < rHeight * 1.3) {
          v_water += 60 * (1 - (rPos - s) / 20);
        }
        // Downstream eddy zone: counter-clockwise recirculation vortex
        else if (s > rPos && s < rPos + 52 && h < rHeight * 1.6) {
          const eddyDistX = s - (rPos + 22);
          const eddyDistY = h - (rHeight * 0.45);
          const vortexSpeed = this.waterVelocity * 0.42;

          // Tangential eddy velocity: [-dy, dx]
          u_water = -eddyDistY * (vortexSpeed / 20);
          v_water = eddyDistX * (vortexSpeed / 24);

          // Chance to spawn froth bubble in vortex shear
          if (Math.random() < 0.04 && this.foamParticles.length < 90) {
            this.foamParticles.push({
              x: wp.x,
              y: wp.y,
              vx: (Math.random() - 0.5) * 25,
              vy: -15 - Math.random() * 20,
              radius: 1.5 + Math.random() * 2.5,
              life: 0.6 + Math.random() * 0.5,
              maxLife: 1.1
            });
          }
        }
      }

      // Accelerate water particle towards local fluid velocity
      wp.vx += (tangX * u_water - normX * v_water - wp.vx) * 8.0 * dt;
      wp.vy += (tangY * u_water - normY * v_water - wp.vy) * 8.0 * dt;

      wp.x += wp.vx * dt;
      wp.y += wp.vy * dt;

      // Despawn water exiting sluice or past bounds
      if (s > this.sluice.length || h > this.sluice.bedDepth * 1.2 || wp.x > this.width + 50 || wp.y > this.height + 50) {
        this.waterParticles.splice(i, 1);
      }
    }

    // 3. Update Sediment Particulates (Gold, Black Sand, Quartz)
    for (let i = this.sediment.length - 1; i >= 0; i--) {
      const p = this.sediment[i];

      // Convert to sluice coordinates
      const relX = p.x - this.sluice.x1;
      const relY = p.y - this.sluice.y1;
      let s = relX * tangX + relY * tangY;
      let h = -(relX * normX + relY * normY);

      // Local water velocity at particle location
      let u_water = this.waterVelocity * Math.sqrt(Math.max(0.08, h / this.sluice.bedDepth)) + gTang * 0.12;
      let v_water = 0;

      for (let r = 0; r < riffleCount; r++) {
        const rPos = rStart + r * rSpacing;
        if (s > rPos && s < rPos + 55 && h < rHeight * 1.5) {
          const eddyDistX = s - (rPos + 20);
          const eddyDistY = h - (rHeight * 0.4);
          const vortexSpeed = this.waterVelocity * 0.38;

          // Eddy velocity: reverse bottom flow traps heavy nuggets against back of riffle
          u_water = -eddyDistY * (vortexSpeed / 20);
          v_water = eddyDistX * (vortexSpeed / 24);
          break;
        }
      }

      // Convert local water velocity back to world space
      const wVx = tangX * u_water - normX * v_water;
      const wVy = tangY * u_water - normY * v_water;

      // Calculate Relative Fluid Drag
      const cfg = MATERIAL_CONFIG[p.type];
      const relVx = wVx - p.vx;
      const relVy = wVy - p.vy;
      const relSpeed = Math.hypot(relVx, relVy);

      // Buoyancy adjusted gravity:
      // Gold: 19.3 -> buoyant factor 0.948 (almost pure weight)
      // Quartz: 2.6 -> buoyant factor 0.615 (very floaty!)
      const buoyantFactor = (cfg.density - 1.0) / cfg.density;
      const effGravity = g * buoyantFactor;

      // Drag acceleration: inversely proportional to density * radius
      const dragCoeff = (cfg.dragMultiplier * 220) / (cfg.density * (p.radius * 0.5));
      const dragAx = relVx * relSpeed * dragCoeff;
      const dragAy = relVy * relSpeed * dragCoeff;

      // Apply forces
      p.vx += (dragAx) * dt;
      p.vy += (effGravity + dragAy) * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Recalculate (s, h) after movement
      const curRelX = p.x - this.sluice.x1;
      const curRelY = p.y - this.sluice.y1;
      s = curRelX * tangX + curRelY * tangY;
      h = -(curRelX * normX + curRelY * normY);

      // Boundary Collisions with Sluice Bed Floor
      if (h < p.radius) {
        h = p.radius;
        // Project velocity onto tangent and normal
        let vTang = p.vx * tangX + p.vy * tangY;
        let vNorm = -(p.vx * normX + p.vy * normY);

        vNorm = -vNorm * cfg.restitution;
        vTang = vTang * cfg.friction;

        p.vx = tangX * vTang - normX * vNorm;
        p.vy = tangY * vTang - normY * vNorm;

        // Restore position in world coords
        p.x = this.sluice.x1 + tangX * s - normX * h;
        p.y = this.sluice.y1 + tangY * s - normY * h;
      }

      // Boundary Collisions with Wooden Riffles
      p.trappedInRiffle = -1;
      for (let r = 0; r < riffleCount; r++) {
        const rPos = rStart + r * rSpacing;
        const rEnd = rPos + this.sluice.riffleWidth;

        // Inside the solid riffle bar
        if (s >= rPos - p.radius && s <= rEnd + p.radius && h <= rHeight + p.radius) {
          if (s < rPos) {
            // Hitting upstream face
            s = rPos - p.radius;
            let vTang = p.vx * tangX + p.vy * tangY;
            if (vTang > 0) vTang = -vTang * cfg.restitution;
            let vNorm = -(p.vx * normX + p.vy * normY);
            p.vx = tangX * vTang - normX * vNorm;
            p.vy = tangY * vTang - normY * vNorm;
          } else if (h <= rHeight && s > rEnd) {
            // Resting against downstream face (inside trap pocket)
            s = rEnd + p.radius;
            p.vx *= 0.5;
            p.vy *= 0.5;
          } else if (h > rHeight - 4) {
            // Rolling across top crest
            h = rHeight + p.radius;
            let vNorm = -(p.vx * normX + p.vy * normY);
            if (vNorm < 0) vNorm = -vNorm * cfg.restitution;
            p.vx = tangX * (p.vx * tangX + p.vy * tangY) - normX * vNorm;
            p.vy = tangY * (p.vx * tangX + p.vy * tangY) - normY * vNorm;
          }
          p.x = this.sluice.x1 + tangX * s - normX * h;
          p.y = this.sluice.y1 + tangY * s - normY * h;
        }

        // Check if trapped behind riffle bar
        if (s > rEnd && s < rPos + 48 && h < rHeight * 0.95) {
          p.trappedInRiffle = r;
          // Dense gold locks into bed corner
          if (p.type === SEDIMENT_TYPE.GOLD) {
            p.vx *= 0.82;
            p.vy *= 0.82;
            // Sparkle timer
            p.glintTimer -= dt;
            if (p.glintTimer <= 0) {
              p.glintTimer = 1.2 + Math.random() * 2.0;
              if (this.sparkles.length < 25) {
                this.sparkles.push({
                  x: p.x,
                  y: p.y,
                  scale: 0.1,
                  scaleSpeed: 3.5,
                  life: 0.5,
                  maxLife: 0.5
                });
              }
            }
          }
        }
      }

      // Exit down the sluice tailing chute
      if (s > this.sluice.length) {
        this.tailingsWashedCount++;
        this.sediment.splice(i, 1);
      }
    }

    // 4. Update Foam Particles
    for (let i = this.foamParticles.length - 1; i >= 0; i--) {
      const f = this.foamParticles[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) {
        this.foamParticles.splice(i, 1);
      }
    }
  }

  updateBateaMode(dt) {
    const cx = this.batea.cx;
    const cy = this.batea.cy;
    const bRad = this.batea.radius;

    // Handle mouse pan agitation & swirling physics
    if (this.mouse.isDown) {
      const dx = this.mouse.x - cx;
      const dy = this.mouse.y - cy;
      const dist = Math.hypot(dx, dy);

      // Calculate circular angular velocity from mouse movement: (r x v) / r^2
      const cross = (dx * this.mouse.vy - dy * this.mouse.vx);
      const instantAngVel = cross / (dist * dist + 400);

      this.batea.swirlVelocity += (instantAngVel * 45 - this.batea.swirlVelocity) * 12.0 * dt;
      this.batea.targetTiltX = (dx / bRad) * 0.45;
      this.batea.targetTiltY = (dy / bRad) * 0.45;
      this.batea.swirlIntensity = Math.min(1.5, Math.abs(this.batea.swirlVelocity) * 0.25);
    } else {
      this.batea.swirlVelocity *= Math.pow(0.85, dt * 60);
      this.batea.targetTiltX *= Math.pow(0.88, dt * 60);
      this.batea.targetTiltY *= Math.pow(0.88, dt * 60);
      this.batea.swirlIntensity *= Math.pow(0.90, dt * 60);
    }

    this.batea.tiltX += (this.batea.targetTiltX - this.batea.tiltX) * 8.0 * dt;
    this.batea.tiltY += (this.batea.targetTiltY - this.batea.tiltY) * 8.0 * dt;
    this.batea.swirlAngle += this.batea.swirlVelocity * dt;

    // Water slosh dynamics
    const sloshTargetX = this.batea.tiltX * 60;
    const sloshTargetY = this.batea.tiltY * 60;
    this.batea.waterSloshVx += (sloshTargetX - this.batea.waterSloshX) * 15.0 * dt;
    this.batea.waterSloshVy += (sloshTargetY - this.batea.waterSloshY) * 15.0 * dt;
    this.batea.waterSloshVx *= 0.92;
    this.batea.waterSloshVy *= 0.92;
    this.batea.waterSloshX += this.batea.waterSloshVx * dt;
    this.batea.waterSloshY += this.batea.waterSloshVy * dt;

    // Batea Particle Simulation
    const swirlOmega = this.batea.swirlVelocity;

    for (let i = this.sediment.length - 1; i >= 0; i--) {
      const p = this.sediment[i];
      const cfg = MATERIAL_CONFIG[p.type];

      let rx = p.x - cx;
      let ry = p.y - cy;
      let rDist = Math.hypot(rx, ry);

      // Centrifugal Force & Vortex drag from swirling the wooden pan
      const tanX = -ry / (rDist + 0.001);
      const tanY = rx / (rDist + 0.001);
      const fluidCircSpeed = swirlOmega * (rDist * 0.85);

      // Relative fluid velocity in pan
      const vFluidX = tanX * fluidCircSpeed + this.batea.waterSloshVx * 0.8;
      const vFluidY = tanY * fluidCircSpeed + this.batea.waterSloshVy * 0.8;

      const relVx = vFluidX - p.vx;
      const relVy = vFluidY - p.vy;
      const relSpeed = Math.hypot(relVx, relVy);

      // Drag acceleration depends on particle density
      const dragAccel = (cfg.dragMultiplier * 140 * relSpeed) / cfg.density;
      p.vx += (relVx * dragAccel) * dt;
      p.vy += (relVy * dragAccel) * dt;

      // Pan Tilt Gravity Component (sloshing pays off)
      p.vx += this.batea.tiltX * 380 * dt;
      p.vy += this.batea.tiltY * 380 * dt;

      // Brazil Nut Effect / Granular Stratification:
      // When pan is swirled / agitated, high density gold sinks inward & downward toward center cone
      // Light quartz gravel rises to top where tilt wave flushes it over the rim!
      if (this.batea.swirlIntensity > 0.08) {
        if (p.type === SEDIMENT_TYPE.GOLD) {
          // Gold migrates inward towards center conical trap
          p.vx -= (rx / (rDist + 1)) * 45 * this.batea.swirlIntensity * dt;
          p.vy -= (ry / (rDist + 1)) * 45 * this.batea.swirlIntensity * dt;
          p.stratLayer = 0;
        } else if (p.type === SEDIMENT_TYPE.BLACK_SAND) {
          // Magnetite forms middle ring
          if (rDist > bRad * 0.55) {
            p.vx -= (rx / (rDist + 1)) * 25 * this.batea.swirlIntensity * dt;
            p.vy -= (ry / (rDist + 1)) * 25 * this.batea.swirlIntensity * dt;
          }
          p.stratLayer = 1;
        } else {
          // Quartz floats on surface layer
          p.stratLayer = 2;
          p.vx += (Math.random() - 0.5) * 20 * dt;
          p.vy += (Math.random() - 0.5) * 20 * dt;
        }
      }

      // Apply friction with pan floor
      p.vx *= Math.pow(cfg.friction, dt * 30);
      p.vy *= Math.pow(cfg.friction, dt * 30);

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Re-evaluate radius after step
      rx = p.x - cx;
      ry = p.y - cy;
      rDist = Math.hypot(rx, ry);

      // Circular wooden pan lip constraint & wash-over
      if (rDist > bRad) {
        // If tilted strongly in this direction, light surface particles wash off the lip!
        const dirDotTilt = (rx * this.batea.tiltX + ry * this.batea.tiltY) / (rDist + 0.01);
        const canWashOut = (dirDotTilt > 0.15 && (p.type === SEDIMENT_TYPE.QUARTZ || (p.type === SEDIMENT_TYPE.BLACK_SAND && dirDotTilt > 0.28)));

        if (canWashOut) {
          // Washed over pan lip as tailings!
          this.tailingsWashedCount++;
          this.sediment.splice(i, 1);
          continue;
        } else {
          // Bounce off wooden lip
          const nx = rx / rDist;
          const ny = ry / rDist;
          p.x = cx + nx * bRad;
          p.y = cy + ny * bRad;

          const dot = p.vx * nx + p.vy * ny;
          if (dot > 0) {
            p.vx -= (1 + cfg.restitution) * dot * nx;
            p.vy -= (1 + cfg.restitution) * dot * ny;
          }
        }
      }

      // Sparkle timer on gold resting in pan
      if (p.type === SEDIMENT_TYPE.GOLD) {
        p.glintTimer -= dt;
        if (p.glintTimer <= 0) {
          p.glintTimer = 1.0 + Math.random() * 2.5;
          if (this.sparkles.length < 25) {
            this.sparkles.push({
              x: p.x,
              y: p.y,
              scale: 0.1,
              scaleSpeed: 4.0,
              life: 0.5,
              maxLife: 0.5
            });
          }
        }
      }
    }
  }

  render(ctx) {
    if (!ctx) return;

    // Background: Roman Slate & Ancient Ashlar Masonry
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle stone block masonry grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridStep = 80;
    for (let x = 0; x < this.width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    if (this.mode === 'sluice') {
      this.renderSluiceBox(ctx);
    } else {
      this.renderBateaPan(ctx);
    }

    // Render Sparkle Glints
    this.renderSparkles(ctx);

    // Render Harvest Coins FX
    this.renderHarvestCoins(ctx);

    // Render Imperial Treasury HUD
    this.renderHUD(ctx);

    // Harvest celebratory flash
    if (this.harvestFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.harvestFlash * 0.22})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  renderSluiceBox(ctx) {
    const rad = (this.sluiceAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const tangX = cosA;
    const tangY = sinA;
    const normX = -sinA;
    const normY = cosA;

    const x1 = this.sluice.x1;
    const y1 = this.sluice.y1;
    const L = this.sluice.length;
    const D = this.sluice.bedDepth;

    // 1. Sluice Box Timber Bed & Sideboards
    ctx.save();

    // Bed Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 18);
    ctx.lineTo(x1 + tangX * L, y1 + tangY * L + 18);
    ctx.lineTo(x1 + tangX * L - normX * (D + 18), y1 + tangY * L - normY * (D + 18) + 18);
    ctx.lineTo(x1 - normX * (D + 18), y1 - normY * (D + 18) + 18);
    ctx.closePath();
    ctx.fill();

    // Wooden Flume Background Planks (Cypress & Oak)
    const woodGrad = ctx.createLinearGradient(x1, y1, x1 - normX * D, y1 - normY * D);
    woodGrad.addColorStop(0, '#2d1c14');
    woodGrad.addColorStop(0.3, '#3d261b');
    woodGrad.addColorStop(0.7, '#4a2f22');
    woodGrad.addColorStop(1, '#573829');

    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + tangX * L, y1 + tangY * L);
    ctx.lineTo(x1 + tangX * L - normX * D, y1 + tangY * L - normY * D);
    ctx.lineTo(x1 - normX * D, y1 - normY * D);
    ctx.closePath();
    ctx.fill();

    // Flume Timber Longitudinal Planks Grain
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    for (let p = 0.2; p < 1.0; p += 0.25) {
      ctx.beginPath();
      ctx.moveTo(x1 - normX * (D * p), y1 - normY * (D * p));
      ctx.lineTo(x1 + tangX * L - normX * (D * p), y1 + tangY * L - normY * (D * p));
      ctx.stroke();
    }

    // Heavy Iron / Bronze Corner Braces (Clavi Romanorum)
    ctx.fillStyle = '#1c1e24';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    for (let b = 0; b <= L; b += L * 0.25) {
      const bx = x1 + tangX * b;
      const by = y1 + tangY * b;
      ctx.fillRect(bx - 3, by - 6, 6, 12);
      ctx.strokeRect(bx - 3, by - 6, 6, 12);
    }

    // 2. Transverse Wooden Riffles (Gradus / Claves)
    const riffleCount = this.sluice.numRiffles;
    const rHeight = this.sluice.riffleHeight;
    const rWidth = this.sluice.riffleWidth;
    const rSpacing = this.sluice.riffleSpacing;
    const rStart = this.sluice.firstRiffleOffset;

    for (let r = 0; r < riffleCount; r++) {
      const rPos = rStart + r * rSpacing;
      const rx1 = x1 + tangX * rPos;
      const ry1 = y1 + tangY * rPos;
      const rx2 = rx1 + tangX * rWidth;
      const ry2 = ry1 + tangY * rWidth;
      const rx3 = rx2 - normX * rHeight;
      const ry3 = ry2 - normY * rHeight;
      const rx4 = rx1 - normX * rHeight;
      const ry4 = ry1 - normY * rHeight;

      // Drop shadow behind riffle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.moveTo(rx2, ry2);
      ctx.lineTo(rx2 + tangX * 24, ry2 + tangY * 24);
      ctx.lineTo(rx3 + tangX * 16, ry3 + tangY * 16);
      ctx.lineTo(rx3, ry3);
      ctx.closePath();
      ctx.fill();

      // Riffle cleat wood body
      const riffleGrad = ctx.createLinearGradient(rx1, ry1, rx4, ry4);
      riffleGrad.addColorStop(0, '#5a3421');
      riffleGrad.addColorStop(0.5, '#78482f');
      riffleGrad.addColorStop(1, '#945c3e');

      ctx.fillStyle = riffleGrad;
      ctx.beginPath();
      ctx.moveTo(rx1, ry1);
      ctx.lineTo(rx2, ry2);
      ctx.lineTo(rx3, ry3);
      ctx.lineTo(rx4, ry4);
      ctx.closePath();
      ctx.fill();

      // Golden highlight on riffle crest
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx4, ry4);
      ctx.lineTo(rx3, ry3);
      ctx.stroke();

      // Riffle Iron Stud / Bolt
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc((rx1 + rx3) * 0.5, (ry1 + ry3) * 0.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Flowing Water Channel & Vortex Eddies
    // Render Water Stream Ribbon
    const waterGrad = ctx.createLinearGradient(x1, y1, x1 - normX * (D * 0.6), y1 - normY * (D * 0.6));
    waterGrad.addColorStop(0, 'rgba(25, 95, 175, 0.25)');
    waterGrad.addColorStop(0.6, 'rgba(45, 145, 235, 0.45)');
    waterGrad.addColorStop(1, 'rgba(165, 225, 255, 0.65)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + tangX * L, y1 + tangY * L);
    ctx.lineTo(x1 + tangX * L - normX * (D * 0.65), y1 + tangY * L - normY * (D * 0.65));
    ctx.lineTo(x1 - normX * (D * 0.65), y1 - normY * (D * 0.65));
    ctx.closePath();
    ctx.fill();

    // Water Surface Specular Highlight Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(x1 - normX * (D * 0.65), y1 - normY * (D * 0.65));
    ctx.lineTo(x1 + tangX * L - normX * (D * 0.65), y1 + tangY * L - normY * (D * 0.65));
    ctx.stroke();

    // Render Individual Water Particles (Streamline Droplets)
    ctx.fillStyle = 'rgba(175, 225, 255, 0.55)';
    for (let i = 0; i < this.waterParticles.length; i++) {
      const wp = this.waterParticles[i];
      ctx.fillRect(wp.x - 1, wp.y - 1, 3, 2);
    }

    // Render Foam & Vortex Froth Bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < this.foamParticles.length; i++) {
      const f = this.foamParticles[i];
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * (f.life / f.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Render Sediment Particulates (Gold, Black Sand, Quartz)
    this.renderSedimentGroup(ctx, SEDIMENT_TYPE.QUARTZ);
    this.renderSedimentGroup(ctx, SEDIMENT_TYPE.BLACK_SAND);
    this.renderSedimentGroup(ctx, SEDIMENT_TYPE.GOLD);

    // 5. Headbox Hopper Flume & Roman Water Spout
    ctx.fillStyle = '#3a251a';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.fillRect(x1 - 35, y1 - D - 20, 45, D + 35);
    ctx.strokeRect(x1 - 35, y1 - D - 20, 45, D + 35);

    // Latin inscription on flume
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('EMISSARIVM', x1 - 30, y1 - D - 6);

    // Tailings Chute at Exit
    const tailX = x1 + tangX * L;
    const tailY = y1 + tangY * L;
    ctx.fillStyle = '#2b1b13';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tailX + 45, tailY + 25);
    ctx.lineTo(tailX + 45 - normX * D, tailY + 25 - normY * D);
    ctx.lineTo(tailX - normX * D, tailY - normY * D);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.stroke();

    ctx.restore();
  }

  renderBateaPan(ctx) {
    const cx = this.batea.cx;
    const cy = this.batea.cy;
    const R = this.batea.radius;

    ctx.save();

    // Pan Drop Shadow on Stone Floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx + this.batea.tiltX * 25, cy + this.batea.tiltY * 25 + 14, R * 1.05, R * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer Wooden Rim
    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R);
    rimGrad.addColorStop(0, '#583624');
    rimGrad.addColorStop(0.7, '#724730');
    rimGrad.addColorStop(1, '#392115');

    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Wooden Turn-Lathing Rings
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.5;
    for (let ring = 0.25; ring <= 0.85; ring += 0.15) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * ring, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Carved Roman Concentric Riffle Steps (Concha)
    const riffleRadii = [R * 0.72, R * 0.52, R * 0.32];
    for (const rr of riffleRadii) {
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rr - 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center Conical Sump (Deep Gold Trap)
    const sumpGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22);
    sumpGrad.addColorStop(0, '#1a110a');
    sumpGrad.addColorStop(0.7, '#2b1b12');
    sumpGrad.addColorStop(1, '#442b1d');

    ctx.fillStyle = sumpGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Latin Inscription on Batea Rim
    ctx.fillStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PELVIS • HISPANICA • AVRIFERA', cx, cy - R + 18);
    ctx.fillText('• RUINA MONTIUM •', cx, cy + R - 10);

    // Swirling Water Body with Dynamic Sloshing
    const sloshX = cx + this.batea.waterSloshX;
    const sloshY = cy + this.batea.waterSloshY;
    const waterGrad = ctx.createRadialGradient(sloshX, sloshY, 10, sloshX, sloshY, R * 0.88);
    waterGrad.addColorStop(0, 'rgba(70, 165, 245, 0.42)');
    waterGrad.addColorStop(0.7, 'rgba(30, 115, 200, 0.48)');
    waterGrad.addColorStop(1, 'rgba(180, 235, 255, 0.65)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.arc(sloshX, sloshY, R * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // Swirl Vortex Streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < 3; a++) {
      const ang = this.batea.swirlAngle + (a * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.6, ang, ang + 0.9);
      ctx.stroke();
    }

    // Render Sediment Particulates in Pan
    this.renderSedimentGroup(ctx, SEDIMENT_TYPE.QUARTZ);
    this.renderSedimentGroup(ctx, SEDIMENT_TYPE.BLACK_SAND);
    this.renderSedimentGroup(ctx, SEDIMENT_TYPE.GOLD);

    // Pan Swirl Cursor Indicator
    if (this.mouse.isDown) {
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(this.mouse.x, this.mouse.y);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.stroke();
    }

    ctx.restore();
  }

  renderSedimentGroup(ctx, type) {
    const cfg = MATERIAL_CONFIG[type];

    for (let i = 0; i < this.sediment.length; i++) {
      const p = this.sediment[i];
      if (p.type !== type) continue;

      const r = p.radius;
      ctx.save();
      ctx.translate(p.x, p.y);

      if (type === SEDIMENT_TYPE.GOLD) {
        // Metallic Gold Shading with Specular Core
        const gGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0.5, 0, 0, r);
        gGrad.addColorStop(0, cfg.highlightColor);
        gGrad.addColorStop(0.45, cfg.baseColor);
        gGrad.addColorStop(1, cfg.darkColor);

        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // High-contrast rim for sharp definition
        ctx.strokeStyle = '#ffe44d';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Inner Specular Dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === SEDIMENT_TYPE.BLACK_SAND) {
        // Dark Charcoal / Magnetite
        const bGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 0.5, 0, 0, r);
        bGrad.addColorStop(0, cfg.highlightColor);
        bGrad.addColorStop(0.6, cfg.baseColor);
        bGrad.addColorStop(1, cfg.darkColor);

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Quartz Gravel / Silt
        const qGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0.5, 0, 0, r);
        qGrad.addColorStop(0, cfg.highlightColor);
        qGrad.addColorStop(0.6, cfg.baseColor);
        qGrad.addColorStop(1, cfg.darkColor);

        ctx.fillStyle = qGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderSparkles(ctx) {
    ctx.save();
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      const size = s.scale * 9;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;

      // 4-Pointed Star Glint
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - size);
      ctx.lineTo(s.x + size * 0.25, s.y - size * 0.25);
      ctx.lineTo(s.x + size, s.y);
      ctx.lineTo(s.x + size * 0.25, s.y + size * 0.25);
      ctx.lineTo(s.x, s.y + size);
      ctx.lineTo(s.x - size * 0.25, s.y + size * 0.25);
      ctx.lineTo(s.x - size, s.y);
      ctx.lineTo(s.x - size * 0.25, s.y - size * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHarvestCoins(ctx) {
    ctx.save();
    for (let i = 0; i < this.harvestCoins.length; i++) {
      const c = this.harvestCoins[i];
      const alpha = Math.min(1.0, c.life / (c.maxLife * 0.4));

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.globalAlpha = alpha;

      // Roman Aureus Coin
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, c.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Laureate Emperor Profile cross
      ctx.fillStyle = '#fff080';
      ctx.fillRect(-c.size * 0.4, -1, c.size * 0.8, 2);

      ctx.restore();
    }
    ctx.restore();
  }

  renderHUD(ctx) {
    const cardW = 270;
    const cardH = 115;
    const cardX = 20;
    const cardY = 20;

    ctx.save();

    // Telemetry Card Background
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Title & Header
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('PAVILION I • IGNIS & TERRA', cardX + 12, cardY + 18);

    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = '#ffffff';
    const modeName = this.mode === 'sluice' ? 'AURUM HISPANICUM (SLUICE)' : 'PELVIS AURARIA (BATEA PAN)';
    ctx.fillText(modeName, cardX + 12, cardY + 34);

    // Calculate Active Concentrate Purity in System
    let goldCount = 0;
    let blackSandCount = 0;
    let quartzCount = 0;

    for (const p of this.sediment) {
      if (p.trappedInRiffle >= 0 || this.mode === 'batea') {
        if (p.type === SEDIMENT_TYPE.GOLD) goldCount++;
        else if (p.type === SEDIMENT_TYPE.BLACK_SAND) blackSandCount++;
        else quartzCount++;
      }
    }

    const totalConc = goldCount + blackSandCount + quartzCount;
    const purityPct = totalConc > 0 ? (goldCount / totalConc) * 100 : 0;

    // Metrics readout
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('TREASURY:', cardX + 12, cardY + 54);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${this.goldHarvestedOz.toFixed(2)} Unciae (oz)`, cardX + 90, cardY + 54);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('PURITAS:', cardX + 12, cardY + 72);
    ctx.fillStyle = purityPct > 70 ? '#3bd6c6' : (purityPct > 35 ? '#ffd700' : '#e6e8ee');
    ctx.fillText(`${purityPct.toFixed(1)}% Au in Riffles`, cardX + 90, cardY + 72);

    ctx.fillStyle = '#8c909e';
    ctx.fillText('TAILINGS:', cardX + 12, cardY + 90);
    ctx.fillStyle = '#d8c89d';
    ctx.fillText(`${this.tailingsWashedCount} units washed`, cardX + 90, cardY + 90);

    // Particle breakdown indicators
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Au:${goldCount}`, cardX + 12, cardY + 106);
    ctx.fillStyle = '#8a94a6';
    ctx.fillText(`Fe:${blackSandCount}`, cardX + 70, cardY + 106);
    ctx.fillStyle = '#d8c89d';
    ctx.fillText(`SiO2:${quartzCount}`, cardX + 130, cardY + 106);

    // Top-Center Banner Notification (Latin Pliny Lore)
    if (this.bannerTimer > 0 && this.bannerText) {
      const bannerAlpha = Math.min(1.0, this.bannerTimer / 0.5);
      ctx.globalAlpha = bannerAlpha;
      ctx.font = 'bold 12px Cinzel, serif';
      const textW = ctx.measureText(this.bannerText).width;
      const bX = (this.width - textW) * 0.5;
      const bY = 32;

      ctx.fillStyle = 'rgba(14, 16, 24, 0.92)';
      ctx.strokeStyle = 'var(--accent-gold, #d4af37)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bX - 16, bY - 18, textW + 32, 28);
      ctx.strokeRect(bX - 16, bY - 18, textW + 32, 28);

      ctx.fillStyle = '#ffd700';
      ctx.fillText(this.bannerText, bX, bY);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  // ==========================================
  // Input Handling
  // ==========================================

  onMouseDown(pos) {
    this.mouse.isDown = true;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.mouse.prevX = pos.x;
    this.mouse.prevY = pos.y;
    this.mouse.vx = 0;
    this.mouse.vy = 0;
    this.mouse.downStartTime = Date.now();

    if (this.mode === 'sluice') {
      // Click on flume or canvas drops a quick paydirt scoop
      if (pos.button === 0) {
        this.depositPaydirtScoop(25);
      }
    }
  }

  onMouseMove(pos) {
    this.mouse.vx = pos.x - this.mouse.prevX;
    this.mouse.vy = pos.y - this.mouse.prevY;
    this.mouse.prevX = pos.x;
    this.mouse.prevY = pos.y;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }

  onMouseUp(pos) {
    this.mouse.isDown = false;
  }

  onWheel(delta) {
    // Scroll adjusts water inflow velocity
    this.waterVelocity = Math.max(100, Math.min(520, this.waterVelocity - delta * 0.5));
    if (this.domControls.sliderWater) {
      this.domControls.sliderWater.value = this.waterVelocity;
    }
    if (this.domControls.valWater) {
      this.domControls.valWater.textContent = `${Math.round(this.waterVelocity)} px/s`;
    }
  }

  onKeyDown(key, e) {
    const k = (key || '').toLowerCase();
    if (k === 's') {
      this.depositPaydirtScoop();
    } else if (k === 'h' || k === ' ') {
      this.harvestGold();
    } else if (k === 'm') {
      this.setMode(this.mode === 'sluice' ? 'batea' : 'sluice');
    } else if (k === 'r') {
      this.reset();
    } else if (k === 'arrowup') {
      this.waterVelocity = Math.min(520, this.waterVelocity + 20);
      if (this.domControls.sliderWater) this.domControls.sliderWater.value = this.waterVelocity;
      if (this.domControls.valWater) this.domControls.valWater.textContent = `${Math.round(this.waterVelocity)} px/s`;
    } else if (k === 'arrowdown') {
      this.waterVelocity = Math.max(100, this.waterVelocity - 20);
      if (this.domControls.sliderWater) this.domControls.sliderWater.value = this.waterVelocity;
      if (this.domControls.valWater) this.domControls.valWater.textContent = `${Math.round(this.waterVelocity)} px/s`;
    }
  }

  onKeyUp(key, e) {
    // Handled cleanly
  }
}
