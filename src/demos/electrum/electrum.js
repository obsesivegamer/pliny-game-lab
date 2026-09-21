// Electrum: Baltic Amber Triboelectricity & Electrostatic Induction
// Grounded in Pliny the Elder's Naturalis Historia (Book XXXVII, Chapter 11: De Succino / On Amber)
// "When friction has imparted life to amber, it attracts dry leaves, straw, chaff, and shreds of papyrus."

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export const PARTICLE_TYPE = {
  GOLD_LEAF: 0,
  CHAFF: 1,
  PAPYRUS: 2,
  PLUME: 3
};

export const PARTICLE_SPECS = {
  [PARTICLE_TYPE.GOLD_LEAF]: {
    name: 'Bractea Auri (Gold Leaf)',
    latin: 'Aurum Bracteatum',
    color: '#FFD700',
    edgeColor: '#FFF275',
    darkColor: '#B8860B',
    polarizability: 1.85,
    mass: 0.12,
    drag: 0.88,
    restitution: 0.22,
    chargeCapacity: 1.25,
    defaultWidth: 10,
    defaultHeight: 8
  },
  [PARTICLE_TYPE.CHAFF]: {
    name: 'Palea (Straw Chaff)',
    latin: 'Culmus Aridus',
    color: '#E5C158',
    edgeColor: '#F7E49A',
    darkColor: '#8C6D1F',
    polarizability: 1.15,
    mass: 0.20,
    drag: 0.72,
    restitution: 0.38,
    chargeCapacity: 0.95,
    defaultWidth: 14,
    defaultHeight: 3.5
  },
  [PARTICLE_TYPE.PAPYRUS]: {
    name: 'Ramenta Papvri (Papyrus Shreds)',
    latin: 'Charta Aegyptia',
    color: '#E8DFC8',
    edgeColor: '#FAF4E3',
    darkColor: '#A89979',
    polarizability: 0.95,
    mass: 0.18,
    drag: 0.80,
    restitution: 0.30,
    chargeCapacity: 0.80,
    defaultWidth: 12,
    defaultHeight: 6
  },
  [PARTICLE_TYPE.PLUME]: {
    name: 'Pluma (Feather Down)',
    latin: 'Plumula Candens',
    color: '#F0F3F4',
    edgeColor: '#FFFFFF',
    darkColor: '#BDC3C7',
    polarizability: 1.30,
    mass: 0.08,
    drag: 0.94,
    restitution: 0.15,
    chargeCapacity: 1.10,
    defaultWidth: 16,
    defaultHeight: 4
  }
};

export class ElectrumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    attachTouchBridge(this, canvas);

    // Simulation Parameters
    this.coulombK = 32000;          // Electrostatic force constant
    this.dielectrophoreticK = 18000; // DEP gradient force coefficient
    this.gravity = 420;              // Gravitational acceleration (px/s²)
    this.targetChargeDensity = 0.80; // Default charge ratio
    this.polarity = -1;             // -1 for negative (amber resinous), +1 for positive (vitreous)
    this.showFluxLines = true;
    this.showFieldVectors = false;
    this.showElectroscope = true;

    // Amber Rod (Baculum Succineum)
    this.amberRod = {
      x: this.width * 0.50,
      y: this.height * 0.35,
      vx: 0,
      vy: 0,
      targetX: this.width * 0.50,
      targetY: this.height * 0.35,
      length: 220,
      radius: 18,
      angle: -0.06, // slight natural tilt
      charge: -180.0, // Accumulated electrostatic charge (statC / simulation units)
      maxCharge: 260.0,
      isHeld: false,
      isRubbing: false,
      rubVelocity: 0,
      glowIntensity: 0.8,
      frictionAccumulator: 0,
      glowTimer: 0
    };

    // Wool Swatch Bench (Vellus Lanae)
    this.woolSwatch = {
      x: 130,
      y: this.height * 0.70,
      width: 140,
      height: 70,
      fibers: [],
      rubCounter: 0,
      activeFriction: 0
    };

    // Specimen Table / Tray (Mensa Philosophica)
    this.table = {
      x: 0,
      y: this.height * 0.76,
      width: this.width,
      height: this.height * 0.24,
      floorY: this.height * 0.76 - 4,
      dishX: this.width * 0.52,
      dishY: this.height * 0.76,
      dishRadiusX: 230,
      dishRadiusY: 28
    };

    // Grounding Stylus (Acus Aerata / Brass Grounding Needle)
    this.groundStylus = {
      x: this.width * 0.88,
      y: this.height * 0.44,
      needleLength: 110,
      baseRadius: 18,
      sparkReady: true,
      glow: 0
    };

    // Gold-Leaf Electroscope (Electroscopium Aureum)
    this.electroscope = {
      x: this.width * 0.86,
      y: this.height * 0.73,
      knobRadius: 14,
      jarWidth: 70,
      jarHeight: 90,
      leafLength: 32,
      leafAngle: 0.1,
      targetLeafAngle: 0.1,
      charge: 0,
      grounded: true
    };

    // Collections
    this.particles = [];       // Chaff, gold leaf, papyrus, plume
    this.fluxLines = [];       // Cyan electric field streamlines
    this.sparks = [];          // Active branching purple lightning breakdown arcs
    this.sparkEmbers = [];     // Spattered breakdown sparks
    this.woolLints = [];       // Floating static fleece fibers
    this.floatingAuras = [];   // Corona discharge micro-glows

    // Auto-rubbing animation state
    this.autoRubbing = {
      active: false,
      timer: 0,
      duration: 1.3,
      cycle: 0
    };

    // Telemetry & Statistics
    this.telemetry = {
      totalAttractions: 0,
      totalRepulsions: 0,
      totalSparks: 0,
      voltageKV: 0,
      bannerText: 'ELECTRVM • BALTIC AMBER TRIBOELECTRICITY',
      bannerTimer: 4.0
    };

    // Interaction State
    this.mouse = {
      x: this.amberRod.x,
      y: this.amberRod.y,
      prevX: this.amberRod.x,
      prevY: this.amberRod.y,
      vx: 0,
      vy: 0,
      isDown: false,
      dragTarget: null // 'amber', 'wool', 'stylus'
    };

    // Audio Context (WebAudio lazy synthesizer)
    this.audioCtx = null;
    this.audioGain = null;
    this.lastAudioTime = 0;

    // DOM Controls references
    this.domControls = {};

    this.initGeometry();
    this.initWoolFibers();
    this.initParticles(75);
    this.initFluxLines();
    this.buildControls();
    this.updateRodCharge();
  }

  // =========================================================================
  // Geometry & Initial Layout
  // =========================================================================

  initGeometry() {
    this.table.width = this.width;
    this.table.height = Math.max(130, this.height * 0.24);
    this.table.y = this.height - this.table.height;
    this.table.floorY = this.table.y;
    this.table.dishX = this.width * 0.48;
    this.table.dishY = this.table.y + 4;
    this.table.dishRadiusX = Math.min(260, this.width * 0.28);
    this.table.dishRadiusY = 28;

    this.woolSwatch.width = Math.min(150, this.width * 0.18);
    this.woolSwatch.height = Math.min(75, this.height * 0.12);
    this.woolSwatch.x = Math.max(70, this.width * 0.11);
    this.woolSwatch.y = this.table.y - this.woolSwatch.height * 0.55;

    this.groundStylus.x = Math.min(this.width - 70, this.width * 0.88);
    this.groundStylus.y = this.height * 0.40;

    this.electroscope.x = Math.min(this.width - 80, this.width * 0.88);
    this.electroscope.y = this.table.y - 45;

    this.amberRod.length = Math.min(230, Math.max(160, this.width * 0.26));
    this.amberRod.radius = 17;
  }

  initWoolFibers() {
    this.woolSwatch.fibers = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const u = (Math.random() - 0.5) * (this.woolSwatch.width - 20);
      const v = (Math.random() - 0.5) * (this.woolSwatch.height - 18);
      this.woolSwatch.fibers.push({
        rx: u,
        ry: v,
        curlRadius: 3.5 + Math.random() * 4.5,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() - 0.5) * 2,
        hueOffset: (Math.random() - 0.5) * 8
      });
    }
  }

  initParticles(count = 75) {
    this.particles = [];
    const types = [
      PARTICLE_TYPE.GOLD_LEAF,
      PARTICLE_TYPE.CHAFF,
      PARTICLE_TYPE.PAPYRUS,
      PARTICLE_TYPE.PLUME
    ];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const spec = PARTICLE_SPECS[type];

      // Distribute naturally within the specimen dish on the table
      const spreadAngle = Math.random() * Math.PI * 2;
      const spreadR = Math.sqrt(Math.random()) * 0.92;
      const px = this.table.dishX + Math.cos(spreadAngle) * (this.table.dishRadiusX * spreadR);
      const py = this.table.floorY - Math.abs(Math.sin(spreadAngle) * (this.table.dishRadiusY * spreadR * 0.5)) - (Math.random() * 8);

      const w = spec.defaultWidth * (0.8 + Math.random() * 0.45);
      const h = spec.defaultHeight * (0.8 + Math.random() * 0.45);

      this.particles.push({
        id: i,
        type: type,
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 10,
        vy: 0,
        w: w,
        h: h,
        angle: Math.random() * Math.PI * 2,
        vAngular: (Math.random() - 0.5) * 1.5,
        mass: spec.mass * (0.85 + Math.random() * 0.3),
        polarizability: spec.polarizability,
        drag: spec.drag,
        restitution: spec.restitution,
        charge: 0.0, // Neutral initially
        maxCharge: spec.chargeCapacity,
        isAirborne: false,
        cooldown: 0,
        shimmerPhase: Math.random() * Math.PI * 2,
        lastSparkTimer: 0
      });
    }
  }

  initFluxLines() {
    this.fluxLines = [];
    const numLines = 18;
    for (let i = 0; i < numLines; i++) {
      this.fluxLines.push({
        id: i,
        seedAngle: (i / numLines) * Math.PI * 2,
        points: [],
        pulsePhase: (i / numLines) * Math.PI * 2
      });
    }
    this.computeFluxLineGeometry();
  }

  // =========================================================================
  // Safe Headless DOM Controls
  // =========================================================================

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Electrostatic Charge</span>
          <span id="lbl-electrum-charge">${Math.abs(Math.round(this.amberRod.charge))} µC</span>
        </label>
        <input type="range" id="slider-charge" min="0" max="100" step="1" value="${Math.round(this.targetChargeDensity * 100)}">
      </div>

      <div class="control-group">
        <label>
          <span>Particle Gravity</span>
          <span id="lbl-electrum-grav">${Math.round(this.gravity)} px/s²</span>
        </label>
        <input type="range" id="slider-grav" min="100" max="900" step="20" value="${Math.round(this.gravity)}">
      </div>

      <div class="control-btn-grid" style="margin-top: 4px;">
        <button id="btn-rub-wool" class="sub-btn active" style="border-color: #ffd700; color: #ffd700; font-weight: 700;">
          ⚡ Rub Amber with Wool (R)
        </button>
        <button id="btn-scatter-chaff" class="sub-btn">
          🌾 Scatter Chaff (S)
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="btn-ground-discharge" class="sub-btn" style="background: rgba(155, 89, 182, 0.2); border-color: #9b59b6; color: #e8d7ff; font-weight: 700;">
          ⚡ Ground Discharge (Space)
        </button>
      </div>

      <div class="control-btn-grid" style="margin-top: 6px;">
        <button id="btn-toggle-flux" class="sub-btn ${this.showFluxLines ? 'active' : ''}">
          Cyan Flux Lines
        </button>
        <button id="btn-toggle-polarity" class="sub-btn">
          Polarity: Resin (-)
        </button>
      </div>
    `;

    // Cache DOM Elements
    this.domControls = {
      sliderCharge: this.controlsContainer.querySelector('#slider-charge'),
      lblCharge: this.controlsContainer.querySelector('#lbl-electrum-charge'),
      sliderGrav: this.controlsContainer.querySelector('#slider-grav'),
      lblGrav: this.controlsContainer.querySelector('#lbl-electrum-grav'),
      btnRub: this.controlsContainer.querySelector('#btn-rub-wool'),
      btnScatter: this.controlsContainer.querySelector('#btn-scatter-chaff'),
      btnDischarge: this.controlsContainer.querySelector('#btn-ground-discharge'),
      btnToggleFlux: this.controlsContainer.querySelector('#btn-toggle-flux'),
      btnTogglePolarity: this.controlsContainer.querySelector('#btn-toggle-polarity')
    };

    // Attach DOM Events
    if (this.domControls.sliderCharge) {
      this.domControls.sliderCharge.addEventListener('input', (e) => {
        this.targetChargeDensity = parseFloat(e.target.value) / 100;
        this.amberRod.charge = this.polarity * this.amberRod.maxCharge * this.targetChargeDensity;
        this.updateRodCharge();
      });
    }

    if (this.domControls.sliderGrav) {
      this.domControls.sliderGrav.addEventListener('input', (e) => {
        this.gravity = parseFloat(e.target.value);
        if (this.domControls.lblGrav) {
          this.domControls.lblGrav.textContent = `${Math.round(this.gravity)} px/s²`;
        }
      });
    }

    if (this.domControls.btnRub) {
      this.domControls.btnRub.addEventListener('click', () => {
        this.startAutoRubbing();
      });
    }

    if (this.domControls.btnScatter) {
      this.domControls.btnScatter.addEventListener('click', () => {
        this.scatterChaff();
      });
    }

    if (this.domControls.btnDischarge) {
      this.domControls.btnDischarge.addEventListener('click', () => {
        this.groundDischarge(true);
      });
    }

    if (this.domControls.btnToggleFlux) {
      this.domControls.btnToggleFlux.addEventListener('click', () => {
        this.showFluxLines = !this.showFluxLines;
        this.domControls.btnToggleFlux.classList.toggle('active', this.showFluxLines);
      });
    }

    if (this.domControls.btnTogglePolarity) {
      this.domControls.btnTogglePolarity.addEventListener('click', () => {
        this.polarity = this.polarity === -1 ? 1 : -1;
        this.amberRod.charge = this.polarity * Math.abs(this.amberRod.charge);
        this.domControls.btnTogglePolarity.textContent = this.polarity === -1 ? 'Polarity: Resin (-)' : 'Polarity: Glass (+)';
        this.showBanner(this.polarity === -1 ? 'Resinous Polarity (Electrons Transferred from Wool)' : 'Vitreous Polarity (Electrons Transferred to Silk)');
      });
    }
  }

  updateRodCharge() {
    const qMag = Math.abs(this.amberRod.charge);
    this.targetChargeDensity = qMag / this.amberRod.maxCharge;
    this.telemetry.voltageKV = (qMag * 0.24).toFixed(1);

    if (this.domControls.lblCharge) {
      this.domControls.lblCharge.textContent = `${Math.round(qMag)} µC (${this.telemetry.voltageKV} kV)`;
    }
    if (this.domControls.sliderCharge && typeof document !== 'undefined' && document.activeElement !== this.domControls.sliderCharge) {
      this.domControls.sliderCharge.value = Math.round(this.targetChargeDensity * 100);
    }
  }

  // =========================================================================
  // Physics: Electrostatic Calculations & Electric Field
  // =========================================================================

  getRodChargeCenters() {
    const numSegments = 9;
    const centers = [];
    const halfL = this.amberRod.length * 0.5;
    const cosA = Math.cos(this.amberRod.angle);
    const sinA = Math.sin(this.amberRod.angle);

    const qPerSegment = this.amberRod.charge / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const t = (i / (numSegments - 1) - 0.5) * 2; // -1 to 1
      const offset = t * halfL;
      centers.push({
        x: this.amberRod.x + cosA * offset,
        y: this.amberRod.y + sinA * offset,
        q: qPerSegment
      });
    }
    return centers;
  }

  computeElectricField(px, py) {
    const centers = this.getRodChargeCenters();
    let ex = 0;
    let ey = 0;
    const softeningSq = 22 * 22;

    for (let i = 0; i < centers.length; i++) {
      const c = centers[i];
      const dx = px - c.x;
      const dy = py - c.y;
      const rSq = dx * dx + dy * dy + softeningSq;
      const r = Math.sqrt(rSq);
      const invR3 = 1 / (rSq * r);
      const kQ = this.coulombK * c.q;

      ex += kQ * dx * invR3;
      ey += kQ * dy * invR3;

      // Ground plane image charges (mirror reflection with opposite sign)
      const mirrorY = 2 * this.table.floorY - c.y;
      const mdy = py - mirrorY;
      const mrSq = dx * dx + mdy * mdy + softeningSq * 1.5;
      const mr = Math.sqrt(mrSq);
      const minvR3 = 1 / (mrSq * mr);
      const kQMirror = -kQ;

      ex += kQMirror * dx * minvR3;
      ey += kQMirror * mdy * minvR3;
    }

    // Induced field from grounded stylus needle
    if (this.groundStylus) {
      const gdx = px - this.groundStylus.x;
      const gdy = py - this.groundStylus.y;
      const grSq = gdx * gdx + gdy * gdy + softeningSq * 1.8;
      const gr = Math.sqrt(grSq);
      const gqInduced = -this.amberRod.charge * 0.28;
      const gkQ = this.coulombK * gqInduced;
      const ginvR3 = 1 / (grSq * gr);

      ex += gkQ * gdx * ginvR3;
      ey += gkQ * gdy * ginvR3;
    }

    return { ex, ey, magSq: ex * ex + ey * ey };
  }

  computeDEPForce(px, py, alpha) {
    const delta = 4.0;
    const fCenter = this.computeElectricField(px, py);
    const fRight = this.computeElectricField(px + delta, py);
    const fTop = this.computeElectricField(px, py - delta);

    const gradX = (fRight.magSq - fCenter.magSq) / delta;
    const gradY = (fCenter.magSq - fTop.magSq) / delta;

    const factor = 0.5 * alpha * (this.dielectrophoreticK / 1000000);
    const fx = gradX * factor;
    const fy = gradY * factor;

    const maxF = 950;
    const mag = Math.sqrt(fx * fx + fy * fy);
    if (mag > maxF) {
      const s = maxF / mag;
      return { fx: fx * s, fy: fy * s };
    }
    return { fx, fy };
  }

  getDistanceToRod(px, py) {
    const halfL = this.amberRod.length * 0.5;
    const cosA = Math.cos(this.amberRod.angle);
    const sinA = Math.sin(this.amberRod.angle);

    const x1 = this.amberRod.x - cosA * halfL;
    const y1 = this.amberRod.y - sinA * halfL;
    const x2 = this.amberRod.x + cosA * halfL;
    const y2 = this.amberRod.y + sinA * halfL;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { dist: Math.hypot(px - x1, py - y1), nx: 0, ny: -1, nearestX: x1, nearestY: y1 };

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    const dist = Math.hypot(px - nearestX, py - nearestY);

    let nx = px - nearestX;
    let ny = py - nearestY;
    if (dist > 0.0001) {
      nx /= dist;
      ny /= dist;
    } else {
      nx = -sinA;
      ny = cosA;
    }

    return { dist, nx, ny, nearestX, nearestY, t };
  }

  computeFluxLineGeometry() {
    if (!this.showFluxLines || Math.abs(this.amberRod.charge) < 2) {
      for (let i = 0; i < this.fluxLines.length; i++) {
        this.fluxLines[i].points = [];
      }
      return;
    }

    const halfL = this.amberRod.length * 0.5;
    const cosA = Math.cos(this.amberRod.angle);
    const sinA = Math.sin(this.amberRod.angle);
    const numLines = this.fluxLines.length;

    for (let i = 0; i < numLines; i++) {
      const fl = this.fluxLines[i];
      fl.points = [];

      const u = (i / numLines - 0.5) * 2;
      const side = (i % 2 === 0) ? 1 : -1;
      const seedX = this.amberRod.x + cosA * (u * halfL) - sinA * (side * (this.amberRod.radius + 2));
      const seedY = this.amberRod.y + sinA * (u * halfL) + cosA * (side * (this.amberRod.radius + 2));

      let curX = seedX;
      let curY = seedY;
      fl.points.push({ x: curX, y: curY, alpha: 1.0 });

      const maxSteps = 22;
      const stepSize = 14;

      for (let s = 0; s < maxSteps; s++) {
        const field = this.computeElectricField(curX, curY);
        const fMag = Math.sqrt(field.magSq);
        if (fMag < 0.001) break;

        const dir = (this.polarity === -1) ? -1 : 1;
        const dx = (field.ex / fMag) * stepSize * dir;
        const dy = (field.ey / fMag) * stepSize * dir;

        curX += dx;
        curY += dy;

        if (curX < 0 || curX > this.width || curY < 0 || curY > this.table.floorY) {
          fl.points.push({ x: curX, y: Math.min(curY, this.table.floorY), alpha: 0.1 });
          break;
        }

        const normAlpha = Math.max(0.12, 1.0 - (s / maxSteps) * 0.85);
        fl.points.push({ x: curX, y: curY, alpha: normAlpha });
      }
    }
  }

  // =========================================================================
  // Interactive Mechanics: Rubbing, Discharging, Scattering
  // =========================================================================

  startAutoRubbing() {
    this.autoRubbing.active = true;
    this.autoRubbing.timer = 0;
    this.autoRubbing.cycle = 0;
    this.amberRod.isHeld = false;
    this.showBanner('Rubbing Amber with Wool: Frictional Transfer of Resinous Charge');
  }

  rubAmberWithWool(frictionAmount = 1.0) {
    const qInc = frictionAmount * 1.6;
    const maxQ = this.amberRod.maxCharge;
    const currentQ = Math.abs(this.amberRod.charge);

    if (currentQ < maxQ) {
      this.amberRod.charge += this.polarity * qInc;
      if (Math.abs(this.amberRod.charge) > maxQ) {
        this.amberRod.charge = this.polarity * maxQ;
      }
      this.updateRodCharge();
    }

    this.woolSwatch.activeFriction = 1.0;
    this.amberRod.glowTimer = 0.5;

    if (Math.random() < 0.35 && this.woolLints.length < 35) {
      this.woolLints.push({
        x: this.woolSwatch.x + (Math.random() - 0.5) * this.woolSwatch.width,
        y: this.woolSwatch.y + (Math.random() - 0.5) * this.woolSwatch.height,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        length: 8 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        alpha: 1.0,
        life: 1.2 + Math.random() * 0.8
      });
    }

    this.playAudioFriction();
  }

  scatterChaff() {
    this.initParticles(75);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.vy = -40 - Math.random() * 110;
      p.vx += (Math.random() - 0.5) * 80;
      p.isAirborne = true;
    }
    this.showBanner('Scattered Pliny Particulates: Gold Leaf, Straw Chaff, Papyrus, & Down');
    this.playAudioTone(380, 0.08, 'triangle');
  }

  groundDischarge(forced = false) {
    const currentQ = Math.abs(this.amberRod.charge);
    if (currentQ < 8 && !forced) return;

    const rodHit = this.getDistanceToRod(this.groundStylus.x, this.groundStylus.y);
    const startX = rodHit.nearestX;
    const startY = rodHit.nearestY;
    const targetX = this.groundStylus.x;
    const targetY = this.groundStylus.y;

    this.triggerSparkArc(startX, startY, targetX, targetY, Math.min(1.0, currentQ / 100));

    this.amberRod.charge = 0.0;
    this.updateRodCharge();
    this.telemetry.totalSparks++;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.charge !== 0) {
        p.charge = 0;
      }
    }

    this.electroscope.charge = 0;
    this.electroscope.targetLeafAngle = 0.08;

    this.showBanner('⚡ DIELECTRIC BREAKDOWN: Paschen Spark Discharge to Ground');
    this.playAudioSpark();
  }

  triggerSparkArc(startX, startY, targetX, targetY, intensity = 1.0) {
    const segments = [];
    this.buildBranchingLightning(startX, startY, targetX, targetY, 4, 38 * intensity, segments);

    this.sparks.push({
      startX,
      startY,
      targetX,
      targetY,
      intensity,
      life: 0.22,
      maxLife: 0.22,
      segments: segments
    });

    const numEmbers = Math.round(18 * intensity);
    for (let i = 0; i < numEmbers; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.sparkEmbers.push({
        x: targetX,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        size: 1.5 + Math.random() * 2.5,
        color: (Math.random() < 0.6) ? '#9B59B6' : '#00FFFF',
        life: 0.35 + Math.random() * 0.4
      });
    }
  }

  buildBranchingLightning(x1, y1, x2, y2, depth, displacement, outSegments) {
    if (depth <= 0) {
      outSegments.push({ x1, y1, x2, y2, width: 2.2 });
      return;
    }

    const midX = (x1 + x2) * 0.5;
    const midY = (y1 + y2) * 0.5;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;

    const nx = -dy / len;
    const ny = dx / len;
    const offset = (Math.random() - 0.5) * displacement;
    const cx = midX + nx * offset;
    const cy = midY + ny * offset;

    this.buildBranchingLightning(x1, y1, cx, cy, depth - 1, displacement * 0.55, outSegments);
    this.buildBranchingLightning(cx, cy, x2, y2, depth - 1, displacement * 0.55, outSegments);

    if (depth >= 2 && Math.random() < 0.45) {
      const branchAngle = (Math.random() - 0.5) * 0.9;
      const branchLen = len * 0.45;
      const bx = cx + (dx * Math.cos(branchAngle) - dy * Math.sin(branchAngle)) * (branchLen / len);
      const by = cy + (dx * Math.sin(branchAngle) + dy * Math.cos(branchAngle)) * (branchLen / len);
      this.buildBranchingLightning(cx, cy, bx, by, depth - 2, displacement * 0.4, outSegments);
    }
  }

  showBanner(msg) {
    this.telemetry.bannerText = msg;
    this.telemetry.bannerTimer = 3.5;
  }

  // =========================================================================
  // WebAudio Static Synthesizer
  // =========================================================================

  initAudio() {
    if (this.audioCtx) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      this.audioGain = this.audioCtx.createGain();
      this.audioGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.audioGain.connect(this.audioCtx.destination);
    } catch (e) {}
  }

  playAudioTone(freq, duration, type = 'sine') {
    try {
      this.initAudio();
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioGain || this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playAudioFriction() {
    const now = Date.now();
    if (now - this.lastAudioTime < 60) return;
    this.lastAudioTime = now;
    this.playAudioTone(160 + Math.random() * 80, 0.05, 'sawtooth');
  }

  playAudioSpark() {
    try {
      this.initAudio();
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
      const bufferSize = this.audioCtx.sampleRate * 0.12;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioGain || this.audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  // =========================================================================
  // Engine Update Loop
  // =========================================================================

  update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;
    dt = Math.min(dt, 0.05);

    // 1. Auto-Rubbing Animation Cycle
    if (this.autoRubbing.active) {
      this.autoRubbing.timer += dt;
      const progress = this.autoRubbing.timer / this.autoRubbing.duration;
      const sweep = Math.sin(progress * Math.PI * 4);

      this.amberRod.targetX = this.woolSwatch.x + sweep * (this.woolSwatch.width * 0.35);
      this.amberRod.targetY = this.woolSwatch.y - 10 + Math.abs(sweep) * 12;

      this.rubAmberWithWool(dt * 120);

      if (progress >= 1.0) {
        this.autoRubbing.active = false;
        this.amberRod.targetX = this.width * 0.50;
        this.amberRod.targetY = this.height * 0.36;
      }
    }

    // 2. Amber Rod Motion & Dragging Physics
    if (this.amberRod.isHeld) {
      const targetVx = (this.mouse.x - this.amberRod.x) * 14;
      const targetVy = (this.mouse.y - this.amberRod.y) * 14;
      this.amberRod.vx += (targetVx - this.amberRod.vx) * 0.45;
      this.amberRod.vy += (targetVy - this.amberRod.vy) * 0.45;
      this.amberRod.x += this.amberRod.vx * dt;
      this.amberRod.y += this.amberRod.vy * dt;

      this.amberRod.y = Math.min(this.table.floorY - this.amberRod.radius - 8, Math.max(50, this.amberRod.y));
      this.amberRod.x = Math.max(this.amberRod.radius + 20, Math.min(this.width - this.amberRod.radius - 20, this.amberRod.x));

      const rodDistToWool = Math.hypot(this.amberRod.x - this.woolSwatch.x, this.amberRod.y - this.woolSwatch.y);
      if (rodDistToWool < this.woolSwatch.width * 0.65) {
        const speed = Math.hypot(this.amberRod.vx, this.amberRod.vy);
        if (speed > 40) {
          this.rubAmberWithWool((speed / 100) * dt * 45);
        }
      }
    } else if (!this.autoRubbing.active) {
      const dx = this.amberRod.targetX - this.amberRod.x;
      const dy = this.amberRod.targetY - this.amberRod.y;
      this.amberRod.vx += (dx * 5.0 - this.amberRod.vx * 3.5) * dt;
      this.amberRod.vy += (dy * 5.0 - this.amberRod.vy * 3.5) * dt;
      this.amberRod.x += this.amberRod.vx * dt;
      this.amberRod.y += this.amberRod.vy * dt;
    }

    // Natural dissipation (humidity leakage)
    if (Math.abs(this.amberRod.charge) > 0.05) {
      this.amberRod.charge *= Math.exp(-0.003 * dt);
      this.updateRodCharge();
    }

    // Dielectric Breakdown Spark against Grounded Stylus
    const currentQ = Math.abs(this.amberRod.charge);
    if (currentQ > 25) {
      const rodHit = this.getDistanceToRod(this.groundStylus.x, this.groundStylus.y);
      const sparkThresholdDist = 30 + (currentQ / this.amberRod.maxCharge) * 85;
      if (rodHit.dist < sparkThresholdDist && this.groundStylus.sparkReady) {
        this.groundDischarge(false);
      }
    }

    // 3. Update Particulates (Chaff, Gold Leaf, Papyrus, Plume)
    const rodHitBoxRadius = this.amberRod.radius + 6;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.shimmerPhase += dt * 3.0;

      const rodDistInfo = this.getDistanceToRod(p.x, p.y);
      const distToRod = rodDistInfo.dist;

      if (distToRod < rodHitBoxRadius + p.w * 0.45 && p.cooldown <= 0) {
        if (p.charge === 0 && currentQ > 5) {
          const transferRatio = 0.065;
          const transferredQ = this.amberRod.charge * transferRatio;
          p.charge = transferredQ;
          this.amberRod.charge -= transferredQ * 0.4;
          this.updateRodCharge();

          p.cooldown = 0.18;
          p.isAirborne = true;

          const kickSpeed = 220 + Math.random() * 180;
          p.vx = rodDistInfo.nx * kickSpeed + (Math.random() - 0.5) * 80;
          p.vy = rodDistInfo.ny * kickSpeed - 40;
          p.vAngular = (Math.random() - 0.5) * 16;

          this.telemetry.totalRepulsions++;
          this.playAudioTone(880 + Math.random() * 400, 0.03, 'sine');
        }
      }

      let fx = 0;
      let fy = p.mass * this.gravity;

      if (p.charge === 0) {
        if (currentQ > 2) {
          const dep = this.computeDEPForce(p.x, p.y, p.polarizability);
          fx += dep.fx;
          fy += dep.fy;

          if (-dep.fy > p.mass * this.gravity * 0.95) {
            p.isAirborne = true;
            this.telemetry.totalAttractions++;
          }

          const field = this.computeElectricField(p.x, p.y);
          const fAngle = Math.atan2(field.ey, field.ex);
          let diffAngle = fAngle - p.angle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
          p.vAngular += diffAngle * 45 * dt;
        }
      } else {
        const field = this.computeElectricField(p.x, p.y);
        const coulombScale = 2.4;
        const qEx = p.charge * field.ex * coulombScale;
        const qEy = p.charge * field.ey * coulombScale;

        fx += qEx;
        fy += qEy;

        p.charge *= Math.exp(-0.02 * dt);
      }

      if (p.charge !== 0) {
        const checkCount = Math.min(10, this.particles.length);
        for (let k = 0; k < checkCount; k++) {
          const other = this.particles[(i + k + 1) % this.particles.length];
          if (other.charge !== 0) {
            const pdx = p.x - other.x;
            const pdy = p.y - other.y;
            const pDistSq = pdx * pdx + pdy * pdy + 64;
            if (pDistSq < 1600) {
              const pDist = Math.sqrt(pDistSq);
              const repF = (this.coulombK * 0.04 * p.charge * other.charge) / pDistSq;
              fx += (pdx / pDist) * repF;
              fy += (pdy / pDist) * repF;
            }
          }
        }
      }

      const airDrag = p.drag;
      p.vx *= Math.pow(airDrag, dt * 60);
      p.vy *= Math.pow(airDrag, dt * 60);
      p.vAngular *= Math.pow(0.92, dt * 60);

      const ax = fx / p.mass;
      const ay = fy / p.mass;
      p.vx += ax * dt;
      p.vy += ay * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngular * dt;

      if (p.y >= this.table.floorY) {
        p.y = this.table.floorY;
        p.vy = -p.vy * p.restitution;
        p.vx *= 0.72;

        if (Math.abs(p.vy) < 18) {
          p.vy = 0;
          p.isAirborne = false;
        }

        if (p.charge !== 0) {
          p.charge = 0;
        }
      }

      if (p.x < 15) { p.x = 15; p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > this.width - 15) { p.x = this.width - 15; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < 20) { p.y = 20; p.vy = Math.abs(p.vy) * 0.4; }
    }

    // 4. Update Electroscope Gold Leaves Induction
    if (this.showElectroscope) {
      const distToKnob = Math.hypot(this.amberRod.x - this.electroscope.x, this.amberRod.y - this.electroscope.y);
      if (distToKnob < 220) {
        const inducedChargeRatio = Math.max(0, 1.0 - distToKnob / 220);
        this.electroscope.targetLeafAngle = 0.08 + (currentQ / this.amberRod.maxCharge) * inducedChargeRatio * 0.62;
      } else {
        this.electroscope.targetLeafAngle = 0.08;
      }
      this.electroscope.leafAngle += (this.electroscope.targetLeafAngle - this.electroscope.leafAngle) * 0.15;
    }

    // 5. Update Sparks & Embers
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spk = this.sparks[i];
      spk.life -= dt;
      if (spk.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    for (let i = this.sparkEmbers.length - 1; i >= 0; i--) {
      const emb = this.sparkEmbers[i];
      emb.life -= dt;
      emb.x += emb.vx * dt;
      emb.y += emb.vy * dt;
      emb.vy += 220 * dt;
      emb.alpha = Math.max(0, emb.life / 0.7);
      if (emb.life <= 0) {
        this.sparkEmbers.splice(i, 1);
      }
    }

    // 6. Update Wool Lints
    for (let i = this.woolLints.length - 1; i >= 0; i--) {
      const lint = this.woolLints[i];
      lint.life -= dt;
      lint.x += lint.vx * dt;
      lint.y += lint.vy * dt;
      lint.angle += 1.5 * dt;
      lint.alpha = Math.max(0, lint.life / 1.5);
      if (lint.life <= 0 || lint.y > this.table.floorY) {
        this.woolLints.splice(i, 1);
      }
    }

    // 7. Update Flux Lines
    if (this.showFluxLines) {
      this.computeFluxLineGeometry();
      for (let i = 0; i < this.fluxLines.length; i++) {
        this.fluxLines[i].pulsePhase = (this.fluxLines[i].pulsePhase + dt * 4.0) % (Math.PI * 2);
      }
    }

    // 8. Telemetry banner timer
    if (this.telemetry.bannerTimer > 0) {
      this.telemetry.bannerTimer -= dt;
    }
  }

  // =========================================================================
  // Rendering
  // =========================================================================

  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    // 1. Chamber Background & Slate Worktable
    this.renderChamberBackground(ctx);
    this.renderTable(ctx);
    this.renderWoolSwatch(ctx);
    this.renderGroundStylus(ctx);

    if (this.showElectroscope) {
      this.renderElectroscope(ctx);
    }

    // 2. Electric Field Flux Lines (Cyan #00FFFF)
    if (this.showFluxLines && Math.abs(this.amberRod.charge) > 2) {
      this.renderFluxLines(ctx);
    }

    // 3. Jumping Chaff, Gold Leaf, Papyrus, & Plume Particulates
    this.renderParticulates(ctx);

    // 4. Baltic Honey Amber Rod (Baculum Succineum)
    this.renderAmberRod(ctx);

    // 5. Branching Purple Spark Lightning Arcs (#9B59B6)
    this.renderSparks(ctx);

    // 6. HUD / Telemetry Overlay
    this.renderHUD(ctx);
  }

  renderChamberBackground(ctx) {
    const grad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.35, 60,
      this.width * 0.5, this.height * 0.45, Math.max(this.width, this.height) * 0.85
    );
    grad.addColorStop(0, '#151722');
    grad.addColorStop(0.5, '#0d0f15');
    grad.addColorStop(1, '#07080b');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.font = '700 28px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('NATURALIS HISTORIA • LIBER XXXVII: DE SVCCINO', this.width * 0.5, 42);
    ctx.restore();
  }

  renderTable(ctx) {
    const ty = this.table.y;
    const th = this.table.height;

    const tableGrad = ctx.createLinearGradient(0, ty, 0, this.height);
    tableGrad.addColorStop(0, '#221f1c');
    tableGrad.addColorStop(0.08, '#2a2622');
    tableGrad.addColorStop(0.4, '#1b1816');
    tableGrad.addColorStop(1, '#0e0c0b');

    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, ty, this.width, th);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.fillRect(0, ty - 2, this.width, 3);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const tickStep = 24;
    for (let x = 20; x < this.width - 20; x += tickStep) {
      const isMajor = (Math.round(x / tickStep) % 5 === 0);
      const tickH = isMajor ? 8 : 4;
      ctx.moveTo(x, ty + 1);
      ctx.lineTo(x, ty + 1 + tickH);
    }
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(this.table.dishX, this.table.dishY, this.table.dishRadiusX, this.table.dishRadiusY, 0, 0, Math.PI * 2);
    const dishGrad = ctx.createLinearGradient(0, this.table.dishY - this.table.dishRadiusY, 0, this.table.dishY + this.table.dishRadiusY);
    dishGrad.addColorStop(0, 'rgba(45, 38, 30, 0.9)');
    dishGrad.addColorStop(1, 'rgba(24, 20, 16, 0.95)');
    ctx.fillStyle = dishGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DISCUS PALEAE ET FOLIORUM AURI', this.table.dishX, this.table.dishY + 18);
    ctx.restore();
  }

  renderWoolSwatch(ctx) {
    const ws = this.woolSwatch;
    const x = ws.x - ws.width * 0.5;
    const y = ws.y - ws.height * 0.5;

    ctx.save();

    ctx.fillStyle = '#1c1511';
    ctx.fillRect(x - 6, y + ws.height - 4, ws.width + 12, 16);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.strokeRect(x - 6, y + ws.height - 4, ws.width + 12, 16);

    ctx.beginPath();
    ctx.roundRect(x, y, ws.width, ws.height, 12);
    const fleeceGrad = ctx.createRadialGradient(
      ws.x, ws.y, 8,
      ws.x, ws.y, ws.width * 0.6
    );
    fleeceGrad.addColorStop(0, '#f5ede0');
    fleeceGrad.addColorStop(0.65, '#dfd2c0');
    fleeceGrad.addColorStop(1, '#b5a590');
    ctx.fillStyle = fleeceGrad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#c4b5a0';
    ctx.stroke();

    ctx.strokeStyle = '#9e8c74';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < ws.fibers.length; i++) {
      const fb = ws.fibers[i];
      const fx = ws.x + fb.rx;
      const fy = ws.y + fb.ry;
      ctx.beginPath();
      ctx.arc(fx, fy, fb.curlRadius, fb.angle, fb.angle + Math.PI * 1.4);
      ctx.stroke();
    }

    ctx.fillStyle = '#4a3f31';
    ctx.font = 'bold 9px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VELLUS LANAE', ws.x, y + ws.height - 10);
    ctx.fillStyle = '#7a6851';
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillText('(Triboelectric Donor)', ws.x, y + ws.height - 2);

    for (let i = 0; i < this.woolLints.length; i++) {
      const lint = this.woolLints[i];
      ctx.save();
      ctx.globalAlpha = lint.alpha;
      ctx.strokeStyle = '#FAF4E3';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lint.x, lint.y);
      ctx.lineTo(lint.x + Math.cos(lint.angle) * lint.length, lint.y + Math.sin(lint.angle) * lint.length);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  renderGroundStylus(ctx) {
    const gs = this.groundStylus;
    ctx.save();

    const tipX = gs.x;
    const tipY = gs.y;
    const baseY = this.table.floorY;

    const rodGrad = ctx.createLinearGradient(tipX - 4, tipY, tipX + 4, tipY);
    rodGrad.addColorStop(0, '#B8860B');
    rodGrad.addColorStop(0.5, '#FFD700');
    rodGrad.addColorStop(1, '#8B6508');

    ctx.fillStyle = rodGrad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 6, tipY + gs.needleLength);
    ctx.lineTo(tipX + 6, tipY + gs.needleLength);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tipX, tipY + gs.needleLength, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#b87333';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY + gs.needleLength + 8);
    ctx.bezierCurveTo(tipX + 18, tipY + gs.needleLength + 20, tipX - 10, baseY - 10, tipX, baseY);
    ctx.stroke();

    const qMag = Math.abs(this.amberRod.charge);
    if (qMag > 20) {
      const glowAlpha = Math.min(0.85, (qMag / this.amberRod.maxCharge) * 0.9);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(155, 89, 182, ${glowAlpha})`;
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ACUS AERATA (GROUND)', tipX, tipY - 8);

    ctx.restore();
  }

  renderElectroscope(ctx) {
    const es = this.electroscope;
    ctx.save();

    ctx.fillStyle = 'rgba(60, 80, 110, 0.12)';
    ctx.strokeStyle = 'rgba(120, 160, 200, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(es.x - es.jarWidth * 0.5, es.y, es.jarWidth, es.jarHeight, [16, 16, 4, 4]);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(es.x - es.jarWidth * 0.35, es.y + 12);
    ctx.lineTo(es.x - es.jarWidth * 0.35, es.y + es.jarHeight - 14);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(es.x, es.y - 4, es.knobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.stroke();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(es.x, es.y);
    ctx.lineTo(es.x, es.y + 35);
    ctx.stroke();

    const hookY = es.y + 35;
    const lAngle = es.leafAngle;

    ctx.strokeStyle = '#FFD700';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(es.x, hookY);
    ctx.rotate(-lAngle);
    ctx.fillRect(-1, 0, 2.5, es.leafLength);
    ctx.restore();

    ctx.save();
    ctx.translate(es.x, hookY);
    ctx.rotate(lAngle);
    ctx.fillRect(-1.5, 0, 2.5, es.leafLength);
    ctx.restore();

    ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ELECTROSCOPIUM', es.x, es.y + es.jarHeight + 10);

    ctx.restore();
  }

  renderFluxLines(ctx) {
    ctx.save();
    const qMag = Math.abs(this.amberRod.charge);
    const baseAlpha = Math.min(0.85, (qMag / this.amberRod.maxCharge) * 0.75 + 0.1);

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1.0;

    for (let i = 0; i < this.fluxLines.length; i++) {
      const fl = this.fluxLines[i];
      if (fl.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(fl.points[0].x, fl.points[0].y);

      for (let p = 1; p < fl.points.length; p++) {
        ctx.lineTo(fl.points[p].x, fl.points[p].y);
      }
      ctx.globalAlpha = baseAlpha * 0.45;
      ctx.stroke();

      const pulseIndex = Math.floor(((fl.pulsePhase / (Math.PI * 2)) * (fl.points.length - 1))) % fl.points.length;
      const bead = fl.points[pulseIndex];
      if (bead) {
        ctx.globalAlpha = baseAlpha * bead.alpha;
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(bead.x, bead.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderParticulates(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const spec = PARTICLE_SPECS[p.type];

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (p.charge !== 0) {
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(p.w, p.h) * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = (this.polarity === -1) ? 'rgba(0, 255, 255, 0.22)' : 'rgba(230, 80, 80, 0.22)';
        ctx.fill();
      }

      if (p.type === PARTICLE_TYPE.GOLD_LEAF) {
        const shimmer = 0.8 + Math.sin(p.shimmerPhase) * 0.2;
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.moveTo(-p.w * 0.5, -p.h * 0.3);
        ctx.lineTo(p.w * 0.4, -p.h * 0.5);
        ctx.lineTo(p.w * 0.5, p.h * 0.4);
        ctx.lineTo(-p.w * 0.3, p.h * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = spec.edgeColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        if (shimmer > 0.92) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === PARTICLE_TYPE.CHAFF) {
        ctx.fillStyle = spec.color;
        ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        ctx.strokeStyle = spec.edgeColor;
        ctx.lineWidth = 0.6;
        ctx.strokeRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
      } else if (p.type === PARTICLE_TYPE.PAPYRUS) {
        ctx.fillStyle = spec.color;
        ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        ctx.strokeStyle = spec.darkColor;
        ctx.lineWidth = 0.6;
        ctx.strokeRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
      } else {
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w * 0.5, p.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = spec.edgeColor;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderAmberRod(ctx) {
    const rod = this.amberRod;
    const halfL = rod.length * 0.5;
    const qMag = Math.abs(rod.charge);
    const chargeRatio = qMag / rod.maxCharge;

    ctx.save();
    ctx.translate(rod.x, rod.y);
    ctx.rotate(rod.angle);

    if (qMag > 5) {
      const glowGrad = ctx.createRadialGradient(
        0, 0, rod.radius,
        0, 0, rod.radius + 35 * chargeRatio
      );
      glowGrad.addColorStop(0, 'rgba(0, 255, 255, 0.45)');
      glowGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.15)');
      glowGrad.addColorStop(1, 'rgba(0, 255, 255, 0.0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL - 25, -rod.radius - 25, rod.length + 50, (rod.radius + 25) * 2, rod.radius + 25);
      ctx.fill();
    }

    const amberGrad = ctx.createLinearGradient(0, -rod.radius, 0, rod.radius);
    amberGrad.addColorStop(0, '#FFA834');
    amberGrad.addColorStop(0.2, '#FFC266');
    amberGrad.addColorStop(0.5, '#E07A10');
    amberGrad.addColorStop(0.85, '#B85500');
    amberGrad.addColorStop(1, '#662B00');

    ctx.beginPath();
    ctx.roundRect(-halfL, -rod.radius, rod.length, rod.radius * 2, rod.radius);
    ctx.fillStyle = amberGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-halfL + 12, -rod.radius + 3, rod.length - 24, rod.radius * 0.45, 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    const ferruleW = 38;
    const ferruleGrad = ctx.createLinearGradient(-halfL, -rod.radius - 1, -halfL + ferruleW, rod.radius + 1);
    ferruleGrad.addColorStop(0, '#B8860B');
    ferruleGrad.addColorStop(0.5, '#FFD700');
    ferruleGrad.addColorStop(1, '#8B6508');

    ctx.beginPath();
    ctx.roundRect(-halfL - 2, -rod.radius - 1, ferruleW, (rod.radius + 1) * 2, [rod.radius, 0, 0, rod.radius]);
    ctx.fillStyle = ferruleGrad;
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = '#5a4208';
    ctx.beginPath();
    ctx.moveTo(-halfL + 16, -rod.radius - 1);
    ctx.lineTo(-halfL + 16, rod.radius + 1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (rod.isHeld) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-halfL - 6, -rod.radius - 6, rod.length + 12, (rod.radius + 6) * 2);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  renderSparks(ctx) {
    ctx.save();

    for (let i = 0; i < this.sparks.length; i++) {
      const spk = this.sparks[i];
      const alpha = Math.max(0, spk.life / spk.maxLife);

      ctx.strokeStyle = `rgba(155, 89, 182, ${alpha * 0.55})`;
      ctx.lineWidth = 9.0;
      ctx.beginPath();
      for (let s = 0; s < spk.segments.length; s++) {
        const seg = spk.segments[s];
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      ctx.strokeStyle = `rgba(195, 155, 211, ${alpha * 0.9})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    for (let i = 0; i < this.sparkEmbers.length; i++) {
      const emb = this.sparkEmbers[i];
      ctx.save();
      ctx.globalAlpha = emb.alpha;
      ctx.fillStyle = emb.color;
      ctx.beginPath();
      ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderHUD(ctx) {
    const ui = this.uiScale();
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    ctx.save();
    ctx.scale(ui, ui);

    const hudX = 14;
    const hudY = 14;
    const hudW = Math.min(sw - 28, narrow ? 320 : 340);
    const hudH = narrow ? 76 : 84;

    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${narrow ? 11 : 12}px "Cinzel", Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.fillText(narrow ? 'ELECTRVM • AMBER' : 'ELECTRVM • AMBER TRIBOELECTRICITY', hudX + 10, hudY + 20);

    ctx.fillStyle = '#e6e8ee';
    ctx.font = `${narrow ? 9 : 10}px "JetBrains Mono", monospace`;
    const qVal = Math.abs(Math.round(this.amberRod.charge));
    const polSign = (this.polarity === -1) ? '−' : '+';
    ctx.fillText(`POTENTIAL: ${this.telemetry.voltageKV} kV | CHARGE: ${polSign}${qVal} µC`, hudX + 10, hudY + (narrow ? 38 : 42));

    ctx.fillStyle = '#8c909e';
    if (narrow) {
      ctx.fillText(`ATTR: ${this.telemetry.totalAttractions} | REP: ${this.telemetry.totalRepulsions} | SPARKS: ${this.telemetry.totalSparks}`, hudX + 10, hudY + 54);
    } else {
      ctx.fillText(`ATTRACTED: ${this.telemetry.totalAttractions}  |  REPELLED: ${this.telemetry.totalRepulsions}  |  SPARKS: ${this.telemetry.totalSparks}`, hudX + 10, hudY + 58);
    }

    ctx.fillStyle = '#00FFFF';
    ctx.fillText(`FLUX: ${this.showFluxLines ? 'ON' : 'OFF'} | GRAV: ${Math.round(this.gravity)} px/s²`, hudX + 10, hudY + (narrow ? 68 : 74));

    if (this.telemetry.bannerTimer > 0 && this.telemetry.bannerText) {
      const bannerAlpha = Math.min(1.0, this.telemetry.bannerTimer * 1.5);
      ctx.save();
      ctx.globalAlpha = bannerAlpha;
      ctx.fillStyle = 'rgba(10, 11, 14, 0.88)';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      const bW = Math.min(sw - 40, 520);
      const bX = (sw - bW) * 0.5;
      const bY = sh - 40;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.telemetry.bannerText, sw * 0.5, bY + 18);
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // Contract Methods: getEntityCount, resize, reset, destroy, input handling
  // =========================================================================

  getEntityCount() {
    let count = this.particles.length;

    if (this.showFluxLines) {
      for (let i = 0; i < this.fluxLines.length; i++) {
        count += this.fluxLines[i].points.length;
      }
    }

    for (let i = 0; i < this.sparks.length; i++) {
      count += this.sparks[i].segments.length;
    }

    count += this.sparkEmbers.length;
    count += this.woolLints.length;

    return count;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.initGeometry();
    this.initWoolFibers();
    this.initFluxLines();

    this.amberRod.x = Math.max(100, Math.min(this.width - 100, this.amberRod.x));
    this.amberRod.y = Math.min(this.table.floorY - 60, Math.max(80, this.amberRod.y));
    this.amberRod.targetX = this.width * 0.50;
    this.amberRod.targetY = this.height * 0.35;
  }

  reset() {
    this.amberRod.x = this.width * 0.50;
    this.amberRod.y = this.height * 0.35;
    this.amberRod.targetX = this.width * 0.50;
    this.amberRod.targetY = this.height * 0.35;
    this.amberRod.vx = 0;
    this.amberRod.vy = 0;
    this.amberRod.charge = -180.0;
    this.amberRod.isHeld = false;
    this.autoRubbing.active = false;

    this.sparks = [];
    this.sparkEmbers = [];
    this.woolLints = [];

    this.initParticles(75);
    this.initFluxLines();
    this.updateRodCharge();
    this.showBanner('ELECTRVM RESET: Baltic Amber Electrostatic Field Restored');
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.sparks = [];
    this.particles = [];
    this.fluxLines = [];
    this.sparkEmbers = [];
    this.woolLints = [];

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }

    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  // =========================================================================
  // Input Handling: Mouse & Keyboard
  // =========================================================================

  onMouseDown(pos) {
    this.mouse.isDown = true;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.mouse.prevX = pos.x;
    this.mouse.prevY = pos.y;

    const rodHit = this.getDistanceToRod(pos.x, pos.y);
    if (rodHit.dist < this.amberRod.radius + 20) {
      this.amberRod.isHeld = true;
      this.autoRubbing.active = false;
      this.mouse.dragTarget = 'amber';
      return;
    }

    const distToWool = Math.hypot(pos.x - this.woolSwatch.x, pos.y - this.woolSwatch.y);
    if (distToWool < this.woolSwatch.width * 0.6) {
      this.startAutoRubbing();
      return;
    }

    const distToStylus = Math.hypot(pos.x - this.groundStylus.x, pos.y - this.groundStylus.y);
    if (distToStylus < 40) {
      this.groundDischarge(true);
      return;
    }

    this.amberRod.targetX = pos.x;
    this.amberRod.targetY = Math.min(this.table.floorY - this.amberRod.radius - 8, pos.y);
  }

  onMouseMove(pos) {
    this.mouse.vx = pos.x - this.mouse.x;
    this.mouse.vy = pos.y - this.mouse.y;
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    if (this.amberRod.isHeld) {
      this.amberRod.targetX = pos.x;
      this.amberRod.targetY = Math.min(this.table.floorY - this.amberRod.radius - 8, pos.y);
    }
  }

  onMouseUp(pos) {
    this.mouse.isDown = false;
    this.amberRod.isHeld = false;
    this.mouse.dragTarget = null;
  }

  onWheel(delta) {
    this.amberRod.y = Math.max(80, Math.min(this.table.floorY - this.amberRod.radius - 8, this.amberRod.y + delta * 0.25));
    this.amberRod.targetY = this.amberRod.y;
  }

  onKeyDown(key, e) {
    const k = (key || '').toLowerCase();
    if (k === ' ' || k === 'spacebar') {
      this.groundDischarge(true);
    } else if (k === 'r') {
      this.startAutoRubbing();
    } else if (k === 's') {
      this.scatterChaff();
    } else if (k === 'f') {
      this.showFluxLines = !this.showFluxLines;
      if (this.domControls.btnToggleFlux) {
        this.domControls.btnToggleFlux.classList.toggle('active', this.showFluxLines);
      }
    } else if (k === 'p') {
      this.polarity = this.polarity === -1 ? 1 : -1;
      this.amberRod.charge = this.polarity * Math.abs(this.amberRod.charge);
      this.updateRodCharge();
      this.showBanner(this.polarity === -1 ? 'Resinous Polarity (Negative)' : 'Vitreous Polarity (Positive)');
    }
  }

  onKeyUp(key, e) {
    // Clean keyup
  }
}
