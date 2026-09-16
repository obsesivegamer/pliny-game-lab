// Cometa: Cometary Trajectory, Solar Sublimation & Gravitational Slingshot Engine
// Pliny Game Lab — Pavilion IV: Cosmographia & Astra
// Grounded in Pliny the Elder's Naturalis Historia (Book II, 22-24: "De cometis eorumque natura et speciebus")

export const COMETA_PRESETS = {
  HALLEY: 'Halley Elliptical (e = 0.96)',
  SLINGSHOT: 'Iuppiter Grav-Assist (Slingshot)',
  HYPERBOLIC: 'Hyperbolic Escape (Sidus Iulium)',
  BINARY: 'Binary Sun Chaos'
};

export const PLINY_COMET_TYPES = [
  { name: 'Pogoniae', desc: 'Bearded comet with lower streaming mane' },
  { name: 'Acontiae', desc: 'Javelin dart darting towards the sun' },
  { name: 'Xiphiae', desc: 'Short sword comet with gleaming blade' },
  { name: 'Ceratiae', desc: 'Horned comet bending like a crescent' },
  { name: 'Discei', desc: 'Solar disk comet radiating amber halo' },
  { name: 'Hippei', desc: 'Steed-mane comet of blinding velocity' }
];

export class CometaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 1200;
    this.height = canvas ? canvas.height : 800;
    this.dpr = 1;

    // Simulation Parameters & Controls
    this.starMass = 26000;         // Central Star gravitational mass
    this.cometVelocity = 150;      // Base launch velocity (px/s)
    this.planetMass = 2800;        // Perturbing planet (Iuppiter) mass
    this.outgassingRate = 1.4;     // Volatile ice sublimation multiplier
    this.timeSpeed = 1.0;          // Simulation time scale
    this.currentPreset = COMETA_PRESETS.HALLEY;

    this.simTime = 0;
    this.gravityConstant = 1.0;
    this.softening = 22.0;         // Gravitational softening radius (px)

    // Celestial Entities
    this.bodies = [];              // Stars, planets, major attractors
    this.comets = [];              // Active cometary nuclei
    this.tailParticles = [];       // Ion & dust tail particles
    this.particlePoolLimit = 1600;

    // Starfield Background
    this.backgroundStars = [];
    this.initStarfield();

    // Interactive Launch Vector / Drag State
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };
    this.mousePos = { x: this.width * 0.5, y: this.height * 0.5 };
    this.selectedBody = null;

    // Telemetry Statistics
    this.maxSpeedRecorded = 0;
    this.closestPerihelion = Infinity;
    this.totalCometsLaunched = 0;
    this.currentClassification = PLINY_COMET_TYPES[0];

    // UI tracking
    this.uiElements = [];

    // Initialize Simulation & UI
    this.initControls();
    this.loadPreset(this.currentPreset);
  }

  // -------------------------------------------------------------------------
  // Starfield & Deep Space Background
  // -------------------------------------------------------------------------
  initStarfield() {
    this.backgroundStars = [];
    const numStars = 220;
    for (let i = 0; i < numStars; i++) {
      this.backgroundStars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.85 ? '#b0e0e6' : (Math.random() > 0.7 ? '#ffe4b5' : '#ffffff')
      });
    }
  }

  // -------------------------------------------------------------------------
  // DOM Controls & UI Construction
  // -------------------------------------------------------------------------
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Orbital Scenario Preset</label>
        <select id="cometa-preset" class="sub-btn" style="width: 100%; text-align: left; padding: 6px 8px;">
          <option value="${COMETA_PRESETS.HALLEY}" ${this.currentPreset === COMETA_PRESETS.HALLEY ? 'selected' : ''}>Halley Elliptical Orbit</option>
          <option value="${COMETA_PRESETS.SLINGSHOT}" ${this.currentPreset === COMETA_PRESETS.SLINGSHOT ? 'selected' : ''}>Iuppiter Gravity Slingshot</option>
          <option value="${COMETA_PRESETS.HYPERBOLIC}" ${this.currentPreset === COMETA_PRESETS.HYPERBOLIC ? 'selected' : ''}>Hyperbolic Escape (Sidus Iulium)</option>
          <option value="${COMETA_PRESETS.BINARY}" ${this.currentPreset === COMETA_PRESETS.BINARY ? 'selected' : ''}>Binary Star Chaotic Orbit</option>
        </select>
      </div>

      <div class="control-group">
        <label>Comet Velocity: <span id="cometa-vel-val">${Math.round(this.cometVelocity)} px/s</span></label>
        <input type="range" id="cometa-vel-slider" min="40" max="360" step="5" value="${this.cometVelocity}">
      </div>

      <div class="control-group">
        <label>Star Mass (Sol): <span id="cometa-mass-val">${Math.round(this.starMass)}</span></label>
        <input type="range" id="cometa-mass-slider" min="6000" max="55000" step="1000" value="${this.starMass}">
      </div>

      <div class="control-group">
        <label>Sublimation Outgassing: <span id="cometa-gas-val">${this.outgassingRate.toFixed(1)}x</span></label>
        <input type="range" id="cometa-gas-slider" min="0.2" max="3.0" step="0.1" value="${this.outgassingRate}">
      </div>

      <div class="control-group">
        <label>Planet Mass (Iuppiter): <span id="cometa-planet-val">${Math.round(this.planetMass)}</span></label>
        <input type="range" id="cometa-planet-slider" min="0" max="7000" step="250" value="${this.planetMass}">
      </div>

      <div class="control-group">
        <div class="control-btn-grid">
          <button class="sub-btn" id="launch-comet-btn" style="border-color: #00e5ff; color: #e0ffff; font-weight: bold;">
            ☄️ Launch New Comet
          </button>
          <button class="sub-btn" id="reset-sim-btn">
            🔄 Reset Scenario
          </button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 8px; font-size: 0.75rem; color: #8c909e; font-family: monospace; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
        <div>Comet Species: <strong id="pliny-type-readout" style="color: #e0ffff;">Pogoniae (Bearded)</strong></div>
        <div>Current Velocity: <strong id="speed-readout" style="color: #64b5f6;">0.0 px/s</strong></div>
        <div>Perihelion Distance: <strong id="perihelion-readout" style="color: #ffd700;">--</strong></div>
        <div>Tail Particle Cloud: <strong id="particles-readout" style="color: #2ecc71;">0</strong></div>
      </div>
    `;

    // Bind UI elements
    const presetSelect = this.controlsContainer.querySelector('#cometa-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.currentPreset = e.target.value;
        this.loadPreset(this.currentPreset);
      });
    }

    const velSlider = this.controlsContainer.querySelector('#cometa-vel-slider');
    const velVal = this.controlsContainer.querySelector('#cometa-vel-val');
    if (velSlider) {
      velSlider.addEventListener('input', (e) => {
        this.cometVelocity = parseFloat(e.target.value);
        if (velVal) velVal.textContent = `${Math.round(this.cometVelocity)} px/s`;
      });
    }

    const massSlider = this.controlsContainer.querySelector('#cometa-mass-slider');
    const massVal = this.controlsContainer.querySelector('#cometa-mass-val');
    if (massSlider) {
      massSlider.addEventListener('input', (e) => {
        this.starMass = parseFloat(e.target.value);
        if (massVal) massVal.textContent = `${Math.round(this.starMass)}`;
        // Update main star mass in active simulation
        const primaryStar = this.bodies.find(b => b.isPrimaryStar);
        if (primaryStar) primaryStar.mass = this.starMass;
      });
    }

    const gasSlider = this.controlsContainer.querySelector('#cometa-gas-slider');
    const gasVal = this.controlsContainer.querySelector('#cometa-gas-val');
    if (gasSlider) {
      gasSlider.addEventListener('input', (e) => {
        this.outgassingRate = parseFloat(e.target.value);
        if (gasVal) gasVal.textContent = `${this.outgassingRate.toFixed(1)}x`;
      });
    }

    const planetSlider = this.controlsContainer.querySelector('#cometa-planet-slider');
    const planetVal = this.controlsContainer.querySelector('#cometa-planet-val');
    if (planetSlider) {
      planetSlider.addEventListener('input', (e) => {
        this.planetMass = parseFloat(e.target.value);
        if (planetVal) planetVal.textContent = `${Math.round(this.planetMass)}`;
        const planet = this.bodies.find(b => b.isPlanet);
        if (planet) planet.mass = this.planetMass;
      });
    }

    const launchBtn = this.controlsContainer.querySelector('#launch-comet-btn');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        this.launchNewComet();
      });
    }

    const resetBtn = this.controlsContainer.querySelector('#reset-sim-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  // -------------------------------------------------------------------------
  // Preset Loading & Celestial System Initialization
  // -------------------------------------------------------------------------
  loadPreset(presetName) {
    this.currentPreset = presetName;
    this.simTime = 0;
    this.bodies = [];
    this.comets = [];
    this.tailParticles = [];
    this.maxSpeedRecorded = 0;
    this.closestPerihelion = Infinity;

    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    if (presetName === COMETA_PRESETS.HALLEY) {
      // Single massive Central Sun (Sol)
      this.bodies.push({
        name: 'Sol',
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        mass: this.starMass,
        radius: 26,
        color: '#fff3a8',
        glowColor: '#ff9d00',
        isPrimaryStar: true,
        isStationary: true
      });

      // Distant inner planet (Terra / Mars)
      const orbitR = Math.min(this.width, this.height) * 0.28;
      const vOrbit = Math.sqrt((this.gravityConstant * this.starMass) / orbitR);
      this.bodies.push({
        name: 'Terra',
        x: cx + orbitR,
        y: cy,
        vx: 0,
        vy: vOrbit,
        mass: 600,
        radius: 8,
        color: '#4fc3f7',
        glowColor: '#0288d1',
        isPlanet: true,
        orbitRadius: orbitR,
        orbitAngle: 0,
        orbitSpeed: vOrbit / orbitR
      });

      // Elongated highly eccentric elliptical comet orbit (Halley)
      const apoapsis = Math.min(this.width, this.height) * 0.44;
      // Vis-viva equation: v = sqrt(GM * (2/r - 1/a)) with periapsis ~ 80px
      const periapsis = 82;
      const semiMajor = (apoapsis + periapsis) / 2;
      const vApoapsis = Math.sqrt(this.gravityConstant * this.starMass * (2 / apoapsis - 1 / semiMajor));

      this.spawnComet({
        name: 'Cometa Halley',
        x: cx + apoapsis * 0.95,
        y: cy - 30,
        vx: -vApoapsis * 0.2,
        vy: -vApoapsis * 0.98,
        mass: 1.0,
        radius: 5,
        coreColor: '#e0ffff',
        tailColor: '#80d8ff'
      });

      this.currentClassification = PLINY_COMET_TYPES[0]; // Pogoniae
    } else if (presetName === COMETA_PRESETS.SLINGSHOT) {
      // Central Sun (Sol)
      this.bodies.push({
        name: 'Sol',
        x: cx - 60,
        y: cy,
        vx: 0,
        vy: 0,
        mass: this.starMass,
        radius: 28,
        color: '#fff9c4',
        glowColor: '#ffb300',
        isPrimaryStar: true,
        isStationary: true
      });

      // Massive gas giant planet (Iuppiter / Jupiter)
      const jupR = Math.min(this.width, this.height) * 0.32;
      const vJup = Math.sqrt((this.gravityConstant * this.starMass) / jupR);
      this.bodies.push({
        name: 'Iuppiter',
        x: (cx - 60) + jupR * 0.7,
        y: cy + jupR * 0.7,
        vx: -vJup * 0.7,
        vy: vJup * 0.7,
        mass: this.planetMass,
        radius: 16,
        color: '#e0a96d',
        glowColor: '#c77d40',
        isPlanet: true,
        orbitRadius: jupR,
        orbitAngle: Math.PI * 0.25,
        orbitSpeed: vJup / jupR
      });

      // Comet approaching on an inbound trajectory targeted for a Jupiter slingshot
      this.spawnComet({
        name: 'Cometa Slingshot',
        x: cx + 340,
        y: cy - 220,
        vx: -this.cometVelocity * 0.85,
        vy: this.cometVelocity * 0.45,
        mass: 1.0,
        radius: 5,
        coreColor: '#ffffff',
        tailColor: '#00e5ff'
      });

      this.currentClassification = PLINY_COMET_TYPES[1]; // Acontiae
    } else if (presetName === COMETA_PRESETS.HYPERBOLIC) {
      // Sidus Iulium (Caesar's Comet of 44 BC, described by Pliny)
      this.bodies.push({
        name: 'Sol',
        x: cx,
        y: cy + 40,
        vx: 0,
        vy: 0,
        mass: this.starMass * 1.1,
        radius: 30,
        color: '#ffffff',
        glowColor: '#ffc107',
        isPrimaryStar: true,
        isStationary: true
      });

      // Fast hyperbolic trajectory exceeding escape velocity
      this.spawnComet({
        name: 'Sidus Iulium',
        x: -50,
        y: cy - 260,
        vx: this.cometVelocity * 1.4,
        vy: this.cometVelocity * 0.55,
        mass: 1.0,
        radius: 6,
        coreColor: '#ffffff',
        tailColor: '#b388ff'
      });

      this.currentClassification = PLINY_COMET_TYPES[5]; // Hippei
    } else if (presetName === COMETA_PRESETS.BINARY) {
      // Binary Star System (Sol Alpha & Sol Beta)
      const separation = 140;
      const vBin = Math.sqrt((this.gravityConstant * (this.starMass * 0.5)) / (2 * separation));

      this.bodies.push({
        name: 'Sol Alpha',
        x: cx - separation,
        y: cy,
        vx: 0,
        vy: vBin,
        mass: this.starMass * 0.55,
        radius: 20,
        color: '#ffeb3b',
        glowColor: '#ff9800',
        isPrimaryStar: true,
        isStationary: false
      });

      this.bodies.push({
        name: 'Sol Beta',
        x: cx + separation,
        y: cy,
        vx: 0,
        vy: -vBin,
        mass: this.starMass * 0.55,
        radius: 19,
        color: '#80d8ff',
        glowColor: '#0091ea',
        isPrimaryStar: false,
        isStationary: false
      });

      // Chaotic test comet orbiting the binary barycenter
      this.spawnComet({
        name: 'Cometa Chaos',
        x: cx,
        y: cy - 250,
        vx: this.cometVelocity * 0.9,
        vy: 0,
        mass: 1.0,
        radius: 5,
        coreColor: '#e0ffff',
        tailColor: '#7c4dff'
      });

      this.currentClassification = PLINY_COMET_TYPES[3]; // Ceratiae
    }
  }

  // -------------------------------------------------------------------------
  // Spawning & Managing Comets
  // -------------------------------------------------------------------------
  spawnComet(config) {
    this.totalCometsLaunched++;
    const comet = {
      id: `comet_${Date.now()}_${Math.random()}`,
      name: config.name || `Cometa ${this.totalCometsLaunched}`,
      x: config.x,
      y: config.y,
      vx: config.vx,
      vy: config.vy,
      mass: config.mass || 1.0,
      radius: config.radius || 5,
      coreColor: config.coreColor || '#e0ffff',
      tailColor: config.tailColor || '#00e5ff',
      history: [],
      maxHistory: 350,
      active: true,
      age: 0,
      closestSunDist: Infinity,
      currentSpeed: Math.hypot(config.vx, config.vy)
    };
    this.comets.push(comet);
    return comet;
  }

  launchNewComet(startX, startY, velocityX, velocityY) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    let x = startX !== undefined ? startX : 50;
    let y = startY !== undefined ? startY : cy - 200;
    let vx = velocityX !== undefined ? velocityX : this.cometVelocity * 0.8;
    let vy = velocityY !== undefined ? velocityY : this.cometVelocity * 0.3;

    // Pick a classical Pliny classification cycle
    const typeIdx = this.totalCometsLaunched % PLINY_COMET_TYPES.length;
    this.currentClassification = PLINY_COMET_TYPES[typeIdx];

    return this.spawnComet({
      name: `Cometa ${this.currentClassification.name}`,
      x,
      y,
      vx,
      vy,
      mass: 1.0,
      radius: 5,
      coreColor: '#ffffff',
      tailColor: '#e0ffff'
    });
  }

  // -------------------------------------------------------------------------
  // Sublimation & Dual-Tail Particle System
  // -------------------------------------------------------------------------
  emitTailParticles(comet, dt) {
    if (!comet.active) return;

    // Find nearest star and calculate distance
    let nearestStar = null;
    let minDistSq = Infinity;

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b.isPrimaryStar || b.mass >= 5000) {
        const dx = b.x - comet.x;
        const dy = b.y - comet.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          nearestStar = b;
        }
      }
    }

    if (!nearestStar) return;

    const dist = Math.sqrt(minDistSq);
    if (dist < comet.closestSunDist) {
      comet.closestSunDist = dist;
    }
    if (dist < this.closestPerihelion) {
      this.closestPerihelion = dist;
    }

    // Solar Sublimation physics:
    // Solar flux = L / (4 * pi * r^2). Outgassing increases dramatically as comet nears perihelion!
    const referenceDist = 320;
    const proximityFactor = Math.min(12.0, Math.pow(referenceDist / Math.max(dist, 50), 1.7));
    const baseEmitCount = Math.floor(proximityFactor * this.outgassingRate * 4.5);

    // Vector pointing away from the star (Solar Wind / Radiation Pressure direction)
    const antiSolarX = (comet.x - nearestStar.x) / (dist || 1);
    const antiSolarY = (comet.y - nearestStar.y) / (dist || 1);

    // Limit maximum particles in active array
    if (this.tailParticles.length >= this.particlePoolLimit) return;

    for (let p = 0; p < baseEmitCount; p++) {
      const isIon = Math.random() < 0.45; // 45% Type I Ion tail, 55% Type II Dust tail

      if (isIon) {
        // TYPE I: ION TAIL (Molecular gas ions: CO+, N2+, H2O+)
        // Driven straight away from the Sun by high-speed solar wind & radiation pressure
        const spreadAngle = (Math.random() - 0.5) * 0.12;
        const cosS = Math.cos(spreadAngle);
        const sinS = Math.sin(spreadAngle);
        const dirX = antiSolarX * cosS - antiSolarY * sinS;
        const dirY = antiSolarX * sinS + antiSolarY * cosS;

        const solarWindSpeed = 160 + Math.random() * 240; // High velocity
        const pVx = comet.vx * 0.2 + dirX * solarWindSpeed;
        const pVy = comet.vy * 0.2 + dirY * solarWindSpeed;

        this.tailParticles.push({
          type: 'ion',
          x: comet.x + (Math.random() - 0.5) * 3,
          y: comet.y + (Math.random() - 0.5) * 3,
          vx: pVx,
          vy: pVy,
          life: 0,
          maxLife: 0.65 + Math.random() * 0.75,
          size: Math.random() * 2.2 + 1.2,
          alpha: 0.85,
          color: '#e0ffff',
          radPressure: 1.4 // Strong outward force
        });
      } else {
        // TYPE II: DUST TAIL (Silicate & carbonaceous grains)
        // Released with nucleus velocity, feels reduced gravity + weaker radiation pressure
        // Curves along Keplerian syndyne orbits
        const thermalSpread = 20 + Math.random() * 35;
        const angle = Math.random() * Math.PI * 2;
        const pVx = comet.vx * 0.92 + Math.cos(angle) * thermalSpread + antiSolarX * 45;
        const pVy = comet.vy * 0.92 + Math.sin(angle) * thermalSpread + antiSolarY * 45;

        this.tailParticles.push({
          type: 'dust',
          x: comet.x + (Math.random() - 0.5) * 5,
          y: comet.y + (Math.random() - 0.5) * 5,
          vx: pVx,
          vy: pVy,
          life: 0,
          maxLife: 1.1 + Math.random() * 1.3,
          size: Math.random() * 3.0 + 1.5,
          alpha: 0.7,
          color: Math.random() > 0.4 ? '#b0e0e6' : '#ffffff',
          radPressure: 0.45
        });
      }
    }

    // Always emit glowing coma envelope around nucleus
    if (Math.random() < 0.7) {
      this.tailParticles.push({
        type: 'coma',
        x: comet.x + (Math.random() - 0.5) * 10,
        y: comet.y + (Math.random() - 0.5) * 10,
        vx: comet.vx * 0.5 + (Math.random() - 0.5) * 15,
        vy: comet.vy * 0.5 + (Math.random() - 0.5) * 15,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        size: Math.random() * 6.0 + 3.0,
        alpha: 0.5,
        color: '#e0ffff',
        radPressure: 0.1
      });
    }
  }

  // -------------------------------------------------------------------------
  // Numerical Gravitational Integration (N-body Substepping)
  // -------------------------------------------------------------------------
  update(dt) {
    if (!dt || isNaN(dt)) return;
    const clampedDt = Math.min(dt, 0.05) * this.timeSpeed;
    this.simTime += clampedDt;

    // Substepping for orbital numerical stability and accurate perihelion swings
    const subSteps = 4;
    const subDt = clampedDt / subSteps;

    for (let step = 0; step < subSteps; step++) {
      // 1. Update Planetary orbits (if planet is kinematic Keplerian orbit or N-body)
      for (let i = 0; i < this.bodies.length; i++) {
        const body = this.bodies[i];
        if (body.isPlanet && body.orbitRadius) {
          body.orbitAngle += body.orbitSpeed * subDt;
          const primary = this.bodies.find(b => b.isPrimaryStar) || { x: this.width * 0.5, y: this.height * 0.5 };
          body.x = primary.x + Math.cos(body.orbitAngle) * body.orbitRadius;
          body.y = primary.y + Math.sin(body.orbitAngle) * body.orbitRadius;
          body.vx = -Math.sin(body.orbitAngle) * (body.orbitSpeed * body.orbitRadius);
          body.vy = Math.cos(body.orbitAngle) * (body.orbitSpeed * body.orbitRadius);
        } else if (!body.isStationary) {
          // N-body gravity between stars (e.g. Binary star preset)
          let ax = 0;
          let ay = 0;
          for (let j = 0; j < this.bodies.length; j++) {
            if (i === j) continue;
            const other = this.bodies[j];
            const dx = other.x - body.x;
            const dy = other.y - body.y;
            const distSq = dx * dx + dy * dy + this.softening * this.softening;
            const dist = Math.sqrt(distSq);
            const force = (this.gravityConstant * other.mass) / (distSq * dist);
            ax += dx * force;
            ay += dy * force;
          }
          body.vx += ax * subDt;
          body.vy += ay * subDt;
          body.x += body.vx * subDt;
          body.y += body.vy * subDt;
        }
      }

      // 2. Update Comets
      for (let c = 0; c < this.comets.length; c++) {
        const comet = this.comets[c];
        if (!comet.active) continue;

        let totalAx = 0;
        let totalAy = 0;

        // Gravitational pull from all celestial bodies: F = G(m1*m2)/r^2
        for (let b = 0; b < this.bodies.length; b++) {
          const body = this.bodies[b];
          const dx = body.x - comet.x;
          const dy = body.y - comet.y;
          const distSq = dx * dx + dy * dy + this.softening * this.softening;
          const dist = Math.sqrt(distSq);

          // Check if collided with celestial body surface
          if (dist < body.radius + comet.radius) {
            comet.active = false;
            // Create explosive impact debris
            for (let k = 0; k < 40; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = Math.random() * 120 + 30;
              this.tailParticles.push({
                type: 'dust',
                x: comet.x,
                y: comet.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 0,
                maxLife: 1.2,
                size: Math.random() * 4 + 2,
                alpha: 1.0,
                color: '#ffeb3b',
                radPressure: 0.1
              });
            }
            break;
          }

          const acc = (this.gravityConstant * body.mass) / (distSq * dist);
          totalAx += dx * acc;
          totalAy += dy * acc;
        }

        if (!comet.active) continue;

        // Symplectic velocity & position integration
        comet.vx += totalAx * subDt;
        comet.vy += totalAy * subDt;
        comet.x += comet.vx * subDt;
        comet.y += comet.vy * subDt;

        comet.age += subDt;
        comet.currentSpeed = Math.hypot(comet.vx, comet.vy);
        if (comet.currentSpeed > this.maxSpeedRecorded) {
          this.maxSpeedRecorded = comet.currentSpeed;
        }

        // Add to historical path breadcrumbs
        if (step === 0 && (comet.history.length === 0 || Math.hypot(comet.x - comet.history[comet.history.length - 1].x, comet.y - comet.history[comet.history.length - 1].y) > 3.5)) {
          comet.history.push({ x: comet.x, y: comet.y });
          if (comet.history.length > comet.maxHistory) {
            comet.history.shift();
          }
        }

        // Out of bounds check (escaped beyond distant solar system boundary)
        const margin = 1400;
        if (comet.x < -margin || comet.x > this.width + margin ||
            comet.y < -margin || comet.y > this.height + margin) {
          comet.active = false;
        }
      }

      // 3. Emit tail particles on first substep
      if (step === 0) {
        for (let c = 0; c < this.comets.length; c++) {
          this.emitTailParticles(this.comets[c], clampedDt);
        }
      }
    }

    // 4. Update and integrate Tail Particles
    const primaryStar = this.bodies.find(b => b.isPrimaryStar) || { x: this.width * 0.5, y: this.height * 0.5 };

    for (let i = this.tailParticles.length - 1; i >= 0; i--) {
      const p = this.tailParticles[i];
      p.life += clampedDt;
      if (p.life >= p.maxLife) {
        this.tailParticles.splice(i, 1);
        continue;
      }

      // Radiation pressure acceleration away from primary star
      const dx = p.x - primaryStar.x;
      const dy = p.y - primaryStar.y;
      const dist = Math.hypot(dx, dy) || 1;
      const radAcc = (p.radPressure * 12000) / (dist * dist + 800);

      p.vx += (dx / dist) * radAcc * clampedDt;
      p.vy += (dy / dist) * radAcc * clampedDt;

      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.alpha = 1.0 - (p.life / p.maxLife);
    }

    // 5. Update UI Telemetry Readouts safely
    this.updateTelemetryDOM();
  }

  updateTelemetryDOM() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const typeEl = this.controlsContainer.querySelector('#pliny-type-readout');
    if (typeEl && this.currentClassification) {
      typeEl.textContent = `${this.currentClassification.name} (${this.currentClassification.desc.split(' ')[0]})`;
    }

    const activeComet = this.comets.find(c => c.active) || this.comets[this.comets.length - 1];
    const speedEl = this.controlsContainer.querySelector('#speed-readout');
    if (speedEl && activeComet) {
      speedEl.textContent = `${activeComet.currentSpeed.toFixed(1)} px/s`;
    }

    const perihelionEl = this.controlsContainer.querySelector('#perihelion-readout');
    if (perihelionEl) {
      if (this.closestPerihelion < Infinity) {
        perihelionEl.textContent = `${Math.round(this.closestPerihelion)} px`;
      } else {
        perihelionEl.textContent = `--`;
      }
    }

    const particlesEl = this.controlsContainer.querySelector('#particles-readout');
    if (particlesEl) {
      particlesEl.textContent = `${this.tailParticles.length}`;
    }
  }

  // -------------------------------------------------------------------------
  // Rendering: Deep Space, Glows, Orbits & Blinding White/Blue Comets
  // -------------------------------------------------------------------------
  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    // 1. Deep Space Black Canvas Background
    ctx.save();
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle cosmic vignette / nebula tint
    const bgGrad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.5, 50,
      this.width * 0.5, this.height * 0.5, Math.max(this.width, this.height) * 0.8
    );
    bgGrad.addColorStop(0, 'rgba(10, 18, 38, 0.4)');
    bgGrad.addColorStop(0.5, 'rgba(4, 9, 20, 0.6)');
    bgGrad.addColorStop(1, 'rgba(2, 4, 8, 1.0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Starfield with Twinkle
    this.renderStarfield(ctx);

    // 3. Planetary & Barycentric Orbit Guides
    this.renderOrbitGuides(ctx);

    // 4. Comet Past Trajectory History
    this.renderCometTrajectories(ctx);

    // 5. Predictive Future Orbit (Analytical Runge-Kutta trace)
    this.renderTrajectoryPrediction(ctx);

    // 6. Interactive Aiming Vector (Drag Reticle)
    if (this.isDragging) {
      this.renderAimReticle(ctx);
    }

    // 7. Celestial Attractors (Sun & Planets)
    this.renderCelestialBodies(ctx);

    // 8. Cometary Tail Particles (Additive Blending for Blinding Glow)
    this.renderTails(ctx);

    // 9. Cometary Nucleus & Coma
    this.renderCometNuclei(ctx);

    // 10. Classical Roman Telemetry Overlay
    this.renderOverlay(ctx);

    ctx.restore();
  }

  renderStarfield(ctx) {
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const s = this.backgroundStars[i];
      const twinkle = Math.sin(this.simTime * s.twinkleSpeed + s.phase) * 0.35 + 0.65;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.1, s.alpha * twinkle);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  renderOrbitGuides(ctx) {
    ctx.save();
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b.isPlanet && b.orbitRadius) {
        const primary = this.bodies.find(s => s.isPrimaryStar) || { x: this.width * 0.5, y: this.height * 0.5 };
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(primary.x, primary.y, b.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  renderCometTrajectories(ctx) {
    ctx.save();
    for (let c = 0; c < this.comets.length; c++) {
      const comet = this.comets[c];
      if (comet.history.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(comet.history[0].x, comet.history[0].y);
      for (let h = 1; h < comet.history.length; h++) {
        ctx.lineTo(comet.history[h].x, comet.history[h].y);
      }
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderTrajectoryPrediction(ctx) {
    const activeComet = this.comets.find(c => c.active);
    let startX = 0, startY = 0, startVx = 0, startVy = 0;

    if (this.isDragging) {
      startX = this.dragStart.x;
      startY = this.dragStart.y;
      const pullDx = this.dragStart.x - this.dragCurrent.x;
      const pullDy = this.dragStart.y - this.dragCurrent.y;
      startVx = pullDx * 1.8;
      startVy = pullDy * 1.8;
    } else if (activeComet) {
      startX = activeComet.x;
      startY = activeComet.y;
      startVx = activeComet.vx;
      startVy = activeComet.vy;
    } else {
      return;
    }

    // Forward numerical integration prediction steps
    const simSteps = 160;
    const predDt = 0.035;
    let px = startX;
    let py = startY;
    let pvx = startVx;
    let pvy = startVy;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px, py);

    let drawCount = 0;
    for (let s = 0; s < simSteps; s++) {
      let tax = 0;
      let tay = 0;

      for (let b = 0; b < this.bodies.length; b++) {
        const body = this.bodies[b];
        const dx = body.x - px;
        const dy = body.y - py;
        const distSq = dx * dx + dy * dy + this.softening * this.softening;
        const dist = Math.sqrt(distSq);
        const acc = (this.gravityConstant * body.mass) / (distSq * dist);
        tax += dx * acc;
        tay += dy * acc;
      }

      pvx += tax * predDt;
      pvy += tay * predDt;
      px += pvx * predDt;
      py += pvy * predDt;

      drawCount++;
      if (s % 3 === 0) {
        ctx.lineTo(px, py);
      }
    }

    ctx.strokeStyle = this.isDragging ? 'rgba(0, 255, 204, 0.75)' : 'rgba(224, 255, 255, 0.28)';
    ctx.lineWidth = this.isDragging ? 2.0 : 1.2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  renderAimReticle(ctx) {
    ctx.save();
    const sx = this.dragStart.x;
    const sy = this.dragStart.y;
    const cx = this.dragCurrent.x;
    const cy = this.dragCurrent.y;

    // Launch sling line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Pull handle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Origin launch point halo
    ctx.strokeStyle = '#e0ffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderCelestialBodies(ctx) {
    ctx.save();
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];

      if (b.isPrimaryStar || b.mass >= 5000) {
        // Multi-layered Glowing Star (Sol)
        const radGrad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.2, b.x, b.y, b.radius * 3.8);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.25, b.color || '#fff3a8');
        radGrad.addColorStop(0.6, b.glowColor || '#ff9800');
        radGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 3.8, 0, Math.PI * 2);
        ctx.fill();

        // White-hot solar core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Solar corona diffraction flares
        ctx.strokeStyle = 'rgba(255, 230, 150, 0.45)';
        ctx.lineWidth = 1.5;
        const flareLen = b.radius * 2.2;
        ctx.beginPath();
        ctx.moveTo(b.x - flareLen, b.y);
        ctx.lineTo(b.x + flareLen, b.y);
        ctx.moveTo(b.x, b.y - flareLen);
        ctx.lineTo(b.x + flareLen, b.y);
        ctx.stroke();
      } else {
        // Planet (e.g. Iuppiter or Terra)
        const pGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
          b.x, b.y, b.radius * 1.2
        );
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.4, b.color);
        pGrad.addColorStop(1, '#1b1b1b');

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Planet label
        ctx.fillStyle = '#b0bec5';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, b.x, b.y + b.radius + 14);
      }
    }
    ctx.restore();
  }

  renderTails(ctx) {
    if (this.tailParticles.length === 0) return;

    ctx.save();
    // Additive blending for brilliant luminous cometary tail
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.tailParticles.length; i++) {
      const p = this.tailParticles[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'ion') {
        // Electric Blue / Cyan Ion streamer
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        // Blinding white / pale azure dust grain
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Soft diffuse Coma cloud
        ctx.fillStyle = 'rgba(224, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderCometNuclei(ctx) {
    ctx.save();
    for (let c = 0; c < this.comets.length; c++) {
      const comet = this.comets[c];
      if (!comet.active) continue;

      // Outer Coma Halo (#E0FFFF)
      const comaRad = comet.radius * 3.5;
      const comaGrad = ctx.createRadialGradient(
        comet.x, comet.y, comet.radius * 0.4,
        comet.x, comet.y, comaRad
      );
      comaGrad.addColorStop(0, '#ffffff');
      comaGrad.addColorStop(0.3, '#e0ffff');
      comaGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.4)');
      comaGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

      ctx.fillStyle = comaGrad;
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, comaRad, 0, Math.PI * 2);
      ctx.fill();

      // Blinding White Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, comet.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cross diffraction spikes on nucleus
      ctx.strokeStyle = '#e0ffff';
      ctx.lineWidth = 1.0;
      const spikeLen = comet.radius * 3.0;
      ctx.beginPath();
      ctx.moveTo(comet.x - spikeLen, comet.y);
      ctx.lineTo(comet.x + spikeLen, comet.y);
      ctx.moveTo(comet.x, comet.y - spikeLen);
      ctx.lineTo(comet.x + spikeLen, comet.y);
      ctx.stroke();

      // Comet Title tag
      ctx.fillStyle = '#e0ffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(comet.name, comet.x + 12, comet.y - 8);
    }
    ctx.restore();
  }

  renderOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(224, 255, 255, 0.85)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('COMETA: CELESTIAL GRAVITATION & SUBLIMATION TAIL', 20, 28);

    ctx.fillStyle = 'rgba(140, 144, 158, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText('Drag on screen to launch custom comet vector | Space to re-launch', 20, 46);

    // Bottom left telemetry summary
    const count = this.getEntityCount();
    ctx.fillText(`Bodies: ${this.bodies.length + this.comets.length} | Tail Particles: ${this.tailParticles.length} | Total Entities: ${count}`, 20, this.height - 20);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Lifecycle & Interactive Events
  // -------------------------------------------------------------------------
  resize(width, height, dpr = 1) {
    this.width = width || 1200;
    this.height = height || 800;
    this.dpr = dpr || 1;
    this.initStarfield();
  }

  reset() {
    this.loadPreset(this.currentPreset);
  }

  destroy() {
    this.bodies = [];
    this.comets = [];
    this.tailParticles = [];
    this.backgroundStars = [];
    this.uiElements.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    this.uiElements = [];
  }

  getEntityCount() {
    // Number of celestial bodies (stars + planets + comets) + active tail particles
    const bodyCount = this.bodies.length + this.comets.filter(c => c.active).length;
    return bodyCount + this.tailParticles.length;
  }

  onMouseDown(pos) {
    if (!pos) return;
    this.mousePos = { x: pos.x, y: pos.y };

    // Check if clicked near an existing body (e.g. Star or Planet) to drag/select
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      const dist = Math.hypot(b.x - pos.x, b.y - pos.y);
      if (dist < b.radius + 10) {
        this.selectedBody = b;
        return;
      }
    }

    // Otherwise, initiate a slingshot launch vector
    this.isDragging = true;
    this.dragStart = { x: pos.x, y: pos.y };
    this.dragCurrent = { x: pos.x, y: pos.y };
  }

  onMouseMove(pos) {
    if (!pos) return;
    this.mousePos = { x: pos.x, y: pos.y };

    if (this.selectedBody) {
      this.selectedBody.x = pos.x;
      this.selectedBody.y = pos.y;
    } else if (this.isDragging) {
      this.dragCurrent = { x: pos.x, y: pos.y };
    }
  }

  onMouseUp(pos) {
    if (this.selectedBody) {
      this.selectedBody = null;
      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      const releasePos = pos || this.dragCurrent;
      const pullDx = this.dragStart.x - releasePos.x;
      const pullDy = this.dragStart.y - releasePos.y;
      const dist = Math.hypot(pullDx, pullDy);

      if (dist > 15) {
        // Launch new comet with velocity proportional to drag vector
        const launchVx = pullDx * 1.8;
        const launchVy = pullDy * 1.8;
        this.launchNewComet(this.dragStart.x, this.dragStart.y, launchVx, launchVy);
      }
    }
  }

  onKeyDown(key, e) {
    if (!key) return;
    const lower = key.toLowerCase();

    if (lower === ' ' || lower === 'c') {
      this.launchNewComet();
      if (e && e.preventDefault) e.preventDefault();
    } else if (lower === 'r') {
      this.reset();
    } else if (lower === '1') {
      this.loadPreset(COMETA_PRESETS.HALLEY);
    } else if (lower === '2') {
      this.loadPreset(COMETA_PRESETS.SLINGSHOT);
    } else if (lower === '3') {
      this.loadPreset(COMETA_PRESETS.HYPERBOLIC);
    } else if (lower === '4') {
      this.loadPreset(COMETA_PRESETS.BINARY);
    }
  }
}
