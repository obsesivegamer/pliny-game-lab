// Pharos: Lighthouse of Alexandria Beacon Optics & Volumetric Coastal Fog Simulation
// Pliny Game Lab — Pavilion VII: Mare Nostrum (Ocean & Marine)
// Spec: Volumetric 2D raymarching through dynamic inhomogeneous fog and sea mist.
// Parabolic polished bronze mirror beam collimation and rotation.
// Rendering: Volumetric golden-white light shaft #FFF8DC sweeping across midnight ocean #050814 with drifting fog particles.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

const TWO_PI = Math.PI * 2;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= TWO_PI;
  while (a < -Math.PI) a += TWO_PI;
  return a;
}

function drawEllipse(ctx, x, y, rx, ry, rotation = 0, startAngle = 0, endAngle = TWO_PI) {
  if (ctx.ellipse) {
    ctx.ellipse(x, y, rx, ry, rotation, startAngle, endAngle);
  } else if (ctx.scale) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation && ctx.rotate) ctx.rotate(rotation);
    ctx.scale(rx, ry);
    ctx.arc(0, 0, 1, startAngle, endAngle);
    ctx.restore();
  } else {
    ctx.arc(x, y, (rx + ry) * 0.5, startAngle, endAngle);
  }
}

function drawQuadCurve(ctx, cx, cy, x, y) {
  if (ctx.quadraticCurveTo) {
    ctx.quadraticCurveTo(cx, cy, x, y);
  } else {
    ctx.lineTo(x, y);
  }
}

function drawBezierCurve(ctx, cp1x, cp1y, cp2x, cp2y, x, y) {
  if (ctx.bezierCurveTo) {
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  } else {
    ctx.lineTo(x, y);
  }
}

export class PharosEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    attachTouchBridge(this, canvas);

    // Simulation Parameters
    this.collimationDeg = 14.0; // Half-spread angle in degrees (tight ~4° to wide ~40°)
    this.beamHalfSpread = this.collimationDeg * DEG2RAD;
    this.rotationSpeed = 0.35; // rad/s
    this.fogDensity = 0.48; // 0.05 (clear) to 1.0 (impenetrable sea soup)
    this.isStorm = false;
    this.stormIntensity = 0.0; // 0 (calm) to 1.0 (squall)

    // Mirror & Optics state
    this.beamAngle = 0.15; // Current pointing angle in radians
    this.autoRotate = true;
    this.beamRange = 1200; // Raymarching max reach in pixels
    this.mirrorSpecularity = 0.92; // Polished specular bronze
    this.fireIntensity = 1.0; // Summit brazier luminance

    // Lighthouse Placement (Pharos Island promontory at Western entrance to Alexandria harbor)
    this.pharosPos = {
      x: 130,
      y: this.height * 0.52
    };

    // Alexandria Harbor mouth target (where ships must steer safely)
    this.harborMouth = {
      x: 170,
      y: this.height * 0.52,
      radius: 55
    };

    // Interaction state
    this.isDragging = false;
    this.mousePos = { x: this.width * 0.75, y: this.height * 0.5 };
    this.manualAimTarget = null;

    // Timing & Environment
    this.time = 0;
    this.windAngle = Math.PI * 0.18; // North-Northwest Mediterranean drift
    this.windSpeed = 24.0;
    this.lightningTimer = 0;
    this.lightningAlpha = 0;

    // Statistics
    this.shipsGuided = 0;
    this.shipsInBeam = 0;
    this.totalShipsLost = 0;

    // Entity collections
    this.fogParticles = [];
    this.maxFogParticles = 280;
    this.ships = [];
    this.maxShips = 7;
    this.brazierParticles = [];
    this.maxBrazierParticles = 50;
    this.waveCrests = [];
    this.reefHazards = [];
    this.rayMarchSamples = []; // Sample points along the beam cone for volumetric raymarching
    this.rayMarchRays = 48; // Discrete raymarch angular steps across collimation cone
    this.rayMarchSteps = 16; // Radial depth samples per ray

    // Initialize systems
    this.initReefHazards();
    this.initFogParticles();
    this.initShips();
    this.initWaveCrests();
    this.initBrazier();
    this.initRaySamples();

    // UI Setup
    this.initControls();
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION HELPERS                                                     */
  /* -------------------------------------------------------------------------- */

  initReefHazards() {
    // Rocky reefs outside Alexandria's Great Harbor (Choerades & Diamond Shoals)
    this.reefHazards = [
      {
        name: 'Diamond Reef (Choerades)',
        x: this.width * 0.44,
        y: this.height * 0.26,
        radius: 42,
        spikes: 8,
        jaggedness: 0.35,
        beaconLit: true
      },
      {
        name: 'Akra Lochias Shoal',
        x: this.width * 0.62,
        y: this.height * 0.76,
        radius: 48,
        spikes: 10,
        jaggedness: 0.4,
        beaconLit: false
      },
      {
        name: 'Sunken Granite Mole',
        x: this.width * 0.32,
        y: this.height * 0.82,
        radius: 36,
        spikes: 7,
        jaggedness: 0.3,
        beaconLit: true
      },
      {
        name: 'Outer Siren Ledge',
        x: this.width * 0.78,
        y: this.height * 0.34,
        radius: 38,
        spikes: 9,
        jaggedness: 0.38,
        beaconLit: false
      }
    ];
  }

  initFogParticles() {
    this.fogParticles = [];
    for (let i = 0; i < this.maxFogParticles; i++) {
      this.fogParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: 20 + Math.random() * 45,
        density: 0.2 + Math.random() * 0.8,
        phase: Math.random() * TWO_PI,
        pulseSpeed: 0.4 + Math.random() * 0.8,
        illumination: 0, // Volumetric illumination factor [0, 1]
        scatterColor: '#FFF8DC'
      });
    }
  }

  initShips() {
    this.ships = [];
    // Spawn initial diverse Mediterranean merchant vessels
    const initialTypes = ['corbita', 'trireme', 'gaulos', 'skiff', 'corbita'];
    for (let i = 0; i < initialTypes.length; i++) {
      this.spawnShip(initialTypes[i], false);
    }
  }

  spawnShip(type = null, atFarEdge = true) {
    if (this.ships.length >= this.maxShips) return;

    const shipTypes = [
      {
        type: 'corbita',
        name: 'Alexandrian Grain Freighter (Corbita)',
        length: 42,
        beam: 16,
        speed: 26,
        turnRate: 0.6,
        hullColor: '#8B4513',
        sailColor: '#F5DEB3',
        sailShape: 'square',
        cargo: 'Egyptus Wheat'
      },
      {
        type: 'trireme',
        name: 'Ptolemaic Imperial Trireme',
        length: 50,
        beam: 12,
        speed: 38,
        turnRate: 0.9,
        hullColor: '#3E2723',
        sailColor: '#B22222',
        sailShape: 'war_square',
        cargo: 'Archers & Bronze Ram'
      },
      {
        type: 'gaulos',
        name: 'Phoenician Merchant Cog (Gaulos)',
        length: 36,
        beam: 14,
        speed: 28,
        turnRate: 0.7,
        hullColor: '#5D4037',
        sailColor: '#FFF8DC',
        sailShape: 'lateen',
        cargo: 'Tyrian Purple & Wine'
      },
      {
        type: 'skiff',
        name: 'Pharos Fisher Barque',
        length: 24,
        beam: 9,
        speed: 24,
        turnRate: 1.1,
        hullColor: '#6D4C41',
        sailColor: '#E0E0E0',
        sailShape: 'small_lateen',
        cargo: 'Red Mullet & Sponge'
      }
    ];

    const chosen = type ? shipTypes.find(s => s.type === type) || shipTypes[0] : shipTypes[Math.floor(Math.random() * shipTypes.length)];

    // Spawn location: on the right or top/bottom edges heading toward Alexandria
    let x, y;
    if (atFarEdge) {
      const edge = Math.random();
      if (edge < 0.6) {
        // East deep sea (right)
        x = this.width + 30 + Math.random() * 80;
        y = 60 + Math.random() * (this.height - 120);
      } else if (edge < 0.8) {
        // Northeast (top right)
        x = this.width * 0.6 + Math.random() * (this.width * 0.4);
        y = -40 - Math.random() * 50;
      } else {
        // Southeast (bottom right)
        x = this.width * 0.6 + Math.random() * (this.width * 0.4);
        y = this.height + 40 + Math.random() * 50;
      }
    } else {
      // Distributed across the sea for initial start
      x = this.width * 0.4 + Math.random() * (this.width * 0.55);
      y = 80 + Math.random() * (this.height - 160);
    }

    // Initial heading towards harbor mouth with slight variance
    const angleToHarbor = Math.atan2(this.harborMouth.y - y, this.harborMouth.x - x);
    const initialHeading = angleToHarbor + (Math.random() - 0.5) * 0.5;

    this.ships.push({
      ...chosen,
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      vx: Math.cos(initialHeading) * chosen.speed,
      vy: Math.sin(initialHeading) * chosen.speed,
      heading: initialHeading,
      targetHeading: angleToHarbor,
      roll: 0,
      pitch: 0,
      inBeam: false,
      beamExposureTimer: 0,
      isGuided: false,
      isWrecked: false,
      wreckTimer: 0,
      distressTorchTimer: 0,
      oarCycle: 0,
      wakeTrail: []
    });
  }

  initWaveCrests() {
    this.waveCrests = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      this.waveCrests.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: 25 + Math.random() * 55,
        speed: 18 + Math.random() * 22,
        angle: Math.PI * 0.15 + (Math.random() - 0.5) * 0.2,
        phase: Math.random() * TWO_PI,
        foamAlpha: 0.1 + Math.random() * 0.4
      });
    }
  }

  initBrazier() {
    this.brazierParticles = [];
    for (let i = 0; i < this.maxBrazierParticles; i++) {
      this.brazierParticles.push({
        x: this.pharosPos.x,
        y: this.pharosPos.y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: Math.random(),
        maxLife: 0.5 + Math.random() * 0.7,
        size: 1.5 + Math.random() * 3.5,
        color: Math.random() < 0.4 ? '#FFF8DC' : (Math.random() < 0.7 ? '#FFD700' : '#FF4500')
      });
    }
  }

  initRaySamples() {
    // Pre-allocate discrete raymarch sample points for telemetry and structure
    this.rayMarchSamples = [];
    const totalSamples = this.rayMarchRays * this.rayMarchSteps;
    for (let i = 0; i < totalSamples; i++) {
      this.rayMarchSamples.push({
        x: 0,
        y: 0,
        r: 0,
        angle: 0,
        attenuation: 1.0,
        fogSample: 0.0,
        inShadow: false
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* UI CONTROLS & DOM HOOKS                                                    */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Beam Collimation (Spread): <span id="val-collimation">${this.collimationDeg.toFixed(1)}°</span></label>
        <input type="range" id="slider-collimation" min="4" max="45" step="0.5" value="${this.collimationDeg}">
      </div>

      <div class="control-group">
        <label>Mirror Rotation Speed: <span id="val-rotation">${this.rotationSpeed.toFixed(2)} rad/s</span></label>
        <input type="range" id="slider-rotation" min="0.0" max="1.4" step="0.05" value="${this.rotationSpeed}">
      </div>

      <div class="control-group">
        <label>Alexandria Coastal Fog Density: <span id="val-fog">${(this.fogDensity * 100).toFixed(0)}%</span></label>
        <input type="range" id="slider-fog" min="0.05" max="1.0" step="0.02" value="${this.fogDensity}">
      </div>

      <div class="control-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
        <button id="btn-storm" class="sub-btn" style="background: ${this.isStorm ? 'rgba(255, 69, 0, 0.35)' : 'rgba(72, 202, 228, 0.2)'}; border-color: ${this.isStorm ? '#FF5722' : '#48CAE4'}; font-weight: bold; padding: 8px;">
          ${this.isStorm ? '⚡ Squall Tempest [ON]' : '🌊 Toggle Storm Waves'}
        </button>
        <button id="btn-sweep" class="sub-btn" style="background: rgba(212, 175, 55, 0.2); border-color: #D4AF37; font-weight: bold; padding: 8px;">
          ${this.autoRotate ? '↻ Auto Sweep: ON' : '🎯 Manual Aim: ON'}
        </button>
      </div>

      <div class="control-group" style="display: flex; gap: 8px; margin-top: 4px;">
        <button id="btn-spawn-ship" class="sub-btn" style="flex: 1; background: rgba(46, 204, 113, 0.2); border-color: #2ECC71; font-weight: bold; padding: 8px;">
          ⛵ Dispatch Merchant Vessel
        </button>
        <button id="btn-reset" class="sub-btn" style="flex: 1; background: rgba(180, 50, 50, 0.2); border-color: #FF5A5F; font-weight: bold; padding: 8px;">
          ↺ Reset Beacon
        </button>
      </div>

      <div class="control-group" style="font-size: 0.8rem; line-height: 1.45; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 8px; margin-top: 8px;">
        <div><strong>Optics Controls:</strong> Drag cursor to direct the Parabolic Mirror beam.</div>
        <div><strong>Scroll Wheel:</strong> Tighten or widen beam collimation angle.</div>
        <div><strong>Hotkeys:</strong> [Space] Toggle Mediterranean storm | [A/D] Steer mirror | [W/S] Focal spread</div>
      </div>
    `;

    // Sliders
    const sliderCollimation = this.controlsContainer.querySelector('#slider-collimation');
    const valCollimation = this.controlsContainer.querySelector('#val-collimation');
    if (sliderCollimation) {
      sliderCollimation.addEventListener('input', (e) => {
        this.collimationDeg = parseFloat(e.target.value);
        this.beamHalfSpread = this.collimationDeg * DEG2RAD;
        if (valCollimation) valCollimation.textContent = `${this.collimationDeg.toFixed(1)}°`;
      });
    }

    const sliderRotation = this.controlsContainer.querySelector('#slider-rotation');
    const valRotation = this.controlsContainer.querySelector('#val-rotation');
    if (sliderRotation) {
      sliderRotation.addEventListener('input', (e) => {
        this.rotationSpeed = parseFloat(e.target.value);
        if (valRotation) valRotation.textContent = `${this.rotationSpeed.toFixed(2)} rad/s`;
      });
    }

    const sliderFog = this.controlsContainer.querySelector('#slider-fog');
    const valFog = this.controlsContainer.querySelector('#val-fog');
    if (sliderFog) {
      sliderFog.addEventListener('input', (e) => {
        this.fogDensity = parseFloat(e.target.value);
        if (valFog) valFog.textContent = `${(this.fogDensity * 100).toFixed(0)}%`;
      });
    }

    // Buttons
    const btnStorm = this.controlsContainer.querySelector('#btn-storm');
    if (btnStorm) {
      btnStorm.addEventListener('click', () => {
        this.toggleStorm();
      });
    }

    const btnSweep = this.controlsContainer.querySelector('#btn-sweep');
    if (btnSweep) {
      btnSweep.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        btnSweep.textContent = this.autoRotate ? '↻ Auto Sweep: ON' : '🎯 Manual Aim: ON';
        btnSweep.style.borderColor = this.autoRotate ? '#D4AF37' : '#48CAE4';
      });
    }

    const btnSpawn = this.controlsContainer.querySelector('#btn-spawn-ship');
    if (btnSpawn) {
      btnSpawn.addEventListener('click', () => {
        this.spawnShip(null, true);
      });
    }

    const btnReset = this.controlsContainer.querySelector('#btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  toggleStorm() {
    this.isStorm = !this.isStorm;
    const btnStorm = this.controlsContainer ? this.controlsContainer.querySelector('#btn-storm') : null;
    if (btnStorm) {
      btnStorm.textContent = this.isStorm ? '⚡ Squall Tempest [ON]' : '🌊 Toggle Storm Waves';
      btnStorm.style.background = this.isStorm ? 'rgba(255, 69, 0, 0.35)' : 'rgba(72, 202, 228, 0.2)';
      btnStorm.style.borderColor = this.isStorm ? '#FF5722' : '#48CAE4';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE METHODS                                                          */
  /* -------------------------------------------------------------------------- */

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.pharosPos.x = Math.max(110, this.width * 0.14);
    this.pharosPos.y = this.height * 0.52;

    this.harborMouth.x = this.pharosPos.x + 40;
    this.harborMouth.y = this.pharosPos.y;

    this.initReefHazards();
  }

  getEntityCount() {
    // Light ray samples + fog particles + approaching ships (+ active flame motes & wave crests)
    const activeRayCount = this.rayMarchSamples ? this.rayMarchSamples.length : (this.rayMarchRays * this.rayMarchSteps);
    const activeFogCount = this.fogParticles ? this.fogParticles.length : 0;
    const activeShipsCount = this.ships ? this.ships.length : 0;
    const activeFlames = this.brazierParticles ? this.brazierParticles.length : 0;
    const activeHazards = this.reefHazards ? this.reefHazards.length : 0;

    return activeRayCount + activeFogCount + activeShipsCount + activeFlames + activeHazards;
  }

  reset() {
    this.time = 0;
    this.beamAngle = 0.15;
    this.isStorm = false;
    this.stormIntensity = 0.0;
    this.shipsGuided = 0;
    this.shipsInBeam = 0;
    this.totalShipsLost = 0;

    this.initReefHazards();
    this.initFogParticles();
    this.initShips();
    this.initWaveCrests();
    this.initBrazier();

    const btnStorm = this.controlsContainer ? this.controlsContainer.querySelector('#btn-storm') : null;
    if (btnStorm) {
      btnStorm.textContent = '🌊 Toggle Storm Waves';
      btnStorm.style.background = 'rgba(72, 202, 228, 0.2)';
      btnStorm.style.borderColor = '#48CAE4';
    }
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.fogParticles = [];
    this.ships = [];
    this.brazierParticles = [];
    this.waveCrests = [];
    this.rayMarchSamples = [];
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING                                                             */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    this.isDragging = true;
    this.mousePos = { x: pos.x, y: pos.y };
    this.aimAt(pos.x, pos.y);
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };
    if (this.isDragging) {
      this.aimAt(pos.x, pos.y);
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  aimAt(x, y) {
    const dx = x - this.pharosPos.x;
    const dy = y - this.pharosPos.y;
    this.beamAngle = Math.atan2(dy, dx);
    this.autoRotate = false;

    const btnSweep = this.controlsContainer ? this.controlsContainer.querySelector('#btn-sweep') : null;
    if (btnSweep) {
      btnSweep.textContent = '🎯 Manual Aim: ON';
      btnSweep.style.borderColor = '#48CAE4';
    }
  }

  onKeyDown(key, e) {
    const k = (key || '').toLowerCase();
    if (k === ' ' || k === 'space') {
      this.toggleStorm();
      if (e && e.preventDefault) e.preventDefault();
    } else if (k === 'arrowleft' || k === 'a') {
      this.beamAngle -= 0.08;
      this.autoRotate = false;
    } else if (k === 'arrowright' || k === 'd') {
      this.beamAngle += 0.08;
      this.autoRotate = false;
    } else if (k === 'arrowup' || k === 'w') {
      this.collimationDeg = clamp(this.collimationDeg - 1.5, 4, 45);
      this.beamHalfSpread = this.collimationDeg * DEG2RAD;
      this.updateCollimationUI();
    } else if (k === 'arrowdown' || k === 's') {
      this.collimationDeg = clamp(this.collimationDeg + 1.5, 4, 45);
      this.beamHalfSpread = this.collimationDeg * DEG2RAD;
      this.updateCollimationUI();
    } else if (k === 'r') {
      this.reset();
    }
  }

  onKeyUp() {}

  onWheel(e) {
    if (!e) return;
    const delta = Math.sign(e.deltaY || 0);
    this.collimationDeg = clamp(this.collimationDeg + delta * 1.5, 4, 45);
    this.beamHalfSpread = this.collimationDeg * DEG2RAD;
    this.updateCollimationUI();
  }

  updateCollimationUI() {
    const sliderCollimation = this.controlsContainer ? this.controlsContainer.querySelector('#slider-collimation') : null;
    const valCollimation = this.controlsContainer ? this.controlsContainer.querySelector('#val-collimation') : null;
    if (sliderCollimation) sliderCollimation.value = this.collimationDeg;
    if (valCollimation) valCollimation.textContent = `${this.collimationDeg.toFixed(1)}°`;
  }

  /* -------------------------------------------------------------------------- */
  /* SIMULATION STEP & PHYSICS (Raymarching, Fog, Waves, Ships)                 */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    // Clamp delta time to avoid large physics steps
    const delta = Math.min(dt, 0.1);
    this.time += delta;

    // 1. Storm Transition Dynamics
    const targetStorm = this.isStorm ? 1.0 : 0.0;
    this.stormIntensity = lerp(this.stormIntensity, targetStorm, delta * 1.8);

    // Weather & Wind
    this.windSpeed = 20.0 + this.stormIntensity * 45.0;
    this.windAngle = Math.PI * 0.18 + Math.sin(this.time * 0.3) * (0.1 + this.stormIntensity * 0.2);

    // Occasional lightning during heavy squalls
    if (this.stormIntensity > 0.6) {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.lightningAlpha = 0.8 + Math.random() * 0.2;
        this.lightningTimer = 4.0 + Math.random() * 8.0;
      }
    }
    if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - delta * 3.5);
    }

    // 2. Parabolic Mirror Rotation
    if (this.autoRotate) {
      this.beamAngle += this.rotationSpeed * delta;
      this.beamAngle = normalizeAngle(this.beamAngle);
    }

    // 3. Volumetric 2D Raymarching Update
    this.updateRaymarching(delta);

    // 4. Fog Particles Motion & Inhomogeneous Field
    this.updateFog(delta);

    // 5. Ocean Wave Crests & Swell
    this.updateWaves(delta);

    // 6. Brazier Fire Particles
    this.updateBrazier(delta);

    // 7. Ships Navigation, Steering & Light Interaction
    this.updateShips(delta);
  }

  updateRaymarching() {
    // Cast ray fan across the collimation cone: [beamAngle - halfSpread, beamAngle + halfSpread]
    const numRays = this.rayMarchRays;
    const numSteps = this.rayMarchSteps;
    const minAngle = this.beamAngle - this.beamHalfSpread;
    const maxAngle = this.beamAngle + this.beamHalfSpread;
    const angleStep = (maxAngle - minAngle) / (numRays - 1);

    const maxR = Math.min(this.beamRange, Math.max(this.width, this.height) * 1.3);
    const stepR = maxR / numSteps;

    let sampleIdx = 0;

    for (let i = 0; i < numRays; i++) {
      const rayAngle = minAngle + i * angleStep;
      const cosA = Math.cos(rayAngle);
      const sinA = Math.sin(rayAngle);

      // Beer-Lambert transmittance accumulator along the ray
      let opticalDepth = 0.0;
      let hitObstacle = false;

      // Parabolic mirror aperture profile (brightest along optical axis)
      const angularOffset = Math.abs(rayAngle - this.beamAngle) / this.beamHalfSpread;
      const mirrorWeight = Math.pow(Math.cos(angularOffset * (Math.PI * 0.5)), 1.8);

      for (let j = 0; j < numSteps; j++) {
        const r = (j + 0.5) * stepR;
        const px = this.pharosPos.x + cosA * r;
        const py = this.pharosPos.y + sinA * r;

        // Check shadow occlusion by reefs or ships
        if (!hitObstacle) {
          // Check reefs
          for (let k = 0; k < this.reefHazards.length; k++) {
            const rf = this.reefHazards[k];
            if (distSq(px, py, rf.x, rf.y) < rf.radius * rf.radius) {
              hitObstacle = true;
              break;
            }
          }

          // Check ships
          if (!hitObstacle) {
            for (let s = 0; s < this.ships.length; s++) {
              const ship = this.ships[s];
              const sRad = ship.beam * 1.1;
              if (distSq(px, py, ship.x, ship.y) < sRad * sRad) {
                hitObstacle = true;
                break;
              }
            }
          }
        }

        // Evaluate dynamic inhomogeneous fog density at (px, py)
        // Layered sinusoidal noise representing turbulent coastal moisture
        const fogTurbulence = 0.5 +
          0.3 * Math.sin(px * 0.005 + py * 0.003 - this.time * 0.8) +
          0.2 * Math.cos(px * 0.009 - py * 0.007 + this.time * 0.5);

        const localFog = this.fogDensity * (0.6 + 0.4 * fogTurbulence);

        // Accumulate extinction: sigma_t * localFog * dr
        const extinctionCoef = 0.0018;
        opticalDepth += localFog * extinctionCoef * stepR;

        // Transmittance I = I0 * exp(-tau)
        const geometricSpread = 1.0 / (1.0 + (r * 0.0012));
        const transmittance = Math.exp(-opticalDepth) * geometricSpread * mirrorWeight;

        if (sampleIdx < this.rayMarchSamples.length) {
          const sample = this.rayMarchSamples[sampleIdx];
          sample.x = px;
          sample.y = py;
          sample.r = r;
          sample.angle = rayAngle;
          sample.fogSample = localFog;
          sample.inShadow = hitObstacle;
          sample.attenuation = hitObstacle ? transmittance * 0.08 : transmittance;
        }

        sampleIdx++;
      }
    }
  }

  updateFog(dt) {
    const wx = Math.cos(this.windAngle) * this.windSpeed;
    const wy = Math.sin(this.windAngle) * this.windSpeed;

    for (let i = 0; i < this.fogParticles.length; i++) {
      const p = this.fogParticles[i];

      // Drift with sea wind and wave turbulence
      p.x += (wx + p.vx) * dt;
      p.y += (wy + p.vy) * dt;

      // Wrap around bounds with buffer
      const pad = p.radius * 1.5;
      if (p.x < -pad) p.x = this.width + pad;
      if (p.x > this.width + pad) p.x = -pad;
      if (p.y < -pad) p.y = this.height + pad;
      if (p.y > this.height + pad) p.y = -pad;

      // Calculate illumination from Pharos light shaft
      const dx = p.x - this.pharosPos.x;
      const dy = p.y - this.pharosPos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const diffAngle = Math.abs(normalizeAngle(angle - this.beamAngle));

      if (diffAngle < this.beamHalfSpread && d < this.beamRange) {
        // Inside collimation cone: evaluate forward Mie scattering
        const radialFalloff = Math.max(0, 1.0 - (d / this.beamRange));
        const angularFalloff = Math.cos((diffAngle / this.beamHalfSpread) * (Math.PI * 0.5));
        const targetIllum = radialFalloff * angularFalloff * (0.8 + 0.2 * Math.sin(p.phase + this.time * p.pulseSpeed));
        p.illumination = lerp(p.illumination, targetIllum, dt * 6.0);
      } else {
        // Outside main beam: ambient moonlit sea fog
        p.illumination = lerp(p.illumination, 0.0, dt * 4.0);
      }
    }
  }

  updateWaves(dt) {
    const stormMult = 1.0 + this.stormIntensity * 2.2;
    for (let i = 0; i < this.waveCrests.length; i++) {
      const w = this.waveCrests[i];
      w.phase += dt * (1.2 + this.stormIntensity * 2.0);
      w.x += Math.cos(w.angle) * w.speed * stormMult * dt;
      w.y += Math.sin(w.angle) * w.speed * stormMult * dt;

      if (w.x > this.width + 80) w.x = -60;
      if (w.y > this.height + 80) w.y = -60;
    }
  }

  updateBrazier(dt) {
    for (let i = 0; i < this.brazierParticles.length; i++) {
      const b = this.brazierParticles[i];
      b.life += dt;
      if (b.life >= b.maxLife) {
        b.life = 0;
        b.x = this.pharosPos.x + (Math.random() - 0.5) * 8;
        b.y = this.pharosPos.y + (Math.random() - 0.5) * 8;
        const speed = 25 + Math.random() * 40;
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        b.size = 1.5 + Math.random() * 3.5;
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy -= 12 * dt; // Fire updraft
      }
    }
  }

  updateShips(dt) {
    let beamCounter = 0;

    for (let i = this.ships.length - 1; i >= 0; i--) {
      const ship = this.ships[i];

      // 1. Check if illuminated by the Pharos beam
      const dx = ship.x - this.pharosPos.x;
      const dy = ship.y - this.pharosPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const diffAngle = Math.abs(normalizeAngle(angle - this.beamAngle));

      // Is within beam cone angle and range?
      const inCone = diffAngle < this.beamHalfSpread && dist < this.beamRange;

      // Check shadow ray occlusion
      let inShadow = false;
      if (inCone) {
        for (let k = 0; k < this.reefHazards.length; k++) {
          const reef = this.reefHazards[k];
          const rDist = Math.sqrt(distSq(this.pharosPos.x, this.pharosPos.y, reef.x, reef.y));
          if (rDist < dist - 20) {
            // Check cross product / angle alignment
            const reefAngle = Math.atan2(reef.y - this.pharosPos.y, reef.x - this.pharosPos.x);
            const angularSpread = Math.atan2(reef.radius, rDist);
            if (Math.abs(normalizeAngle(angle - reefAngle)) < angularSpread) {
              inShadow = true;
              break;
            }
          }
        }
      }

      ship.inBeam = inCone && !inShadow;
      if (ship.inBeam) {
        beamCounter++;
        ship.beamExposureTimer += dt;
        if (ship.beamExposureTimer > 0.4) {
          ship.isGuided = true;
        }
      }

      // 2. Navigation AI
      if (!ship.isWrecked) {
        // Target heading: steer towards Alexandria Harbor entrance
        let desiredHeading = Math.atan2(this.harborMouth.y - ship.y, this.harborMouth.x - ship.x);

        // Reef hazard avoidance
        for (let k = 0; k < this.reefHazards.length; k++) {
          const reef = this.reefHazards[k];
          const dToReef = Math.sqrt(distSq(ship.x, ship.y, reef.x, reef.y));
          const safeZone = reef.radius + ship.length * 1.2;

          if (dToReef < safeZone) {
            // Collision check
            if (dToReef < reef.radius + 8) {
              // Wreck if struck in storm or unguided
              if (this.stormIntensity > 0.5 && !ship.isGuided) {
                ship.isWrecked = true;
                ship.wreckTimer = 0;
                this.totalShipsLost++;
                break;
              }
            }

            // Repulsion vector away from danger
            const repelAngle = Math.atan2(ship.y - reef.y, ship.x - reef.x);
            // If guided by the beacon, crew reacts with precision
            const avoidanceStrength = ship.isGuided ? 1.5 : (1.0 - this.fogDensity * 0.7);
            desiredHeading = lerp(desiredHeading, repelAngle, avoidanceStrength * (1.0 - dToReef / safeZone));
          }
        }

        // Steer ship heading towards desired heading
        let turnDiff = normalizeAngle(desiredHeading - ship.heading);
        ship.heading += turnDiff * ship.turnRate * dt;

        // Effective speed
        let currentSpeed = ship.speed;
        if (ship.isGuided) {
          currentSpeed *= 1.25; // Confident full sail into Alexandria port
        }
        if (this.stormIntensity > 0.4) {
          currentSpeed *= (1.0 - this.stormIntensity * 0.3); // Heavy seas drag
        }

        // Drift due to wind and storm swell
        const stormDriftX = Math.cos(this.windAngle) * this.stormIntensity * 16.0;
        const stormDriftY = Math.sin(this.windAngle) * this.stormIntensity * 16.0;

        ship.vx = Math.cos(ship.heading) * currentSpeed + stormDriftX;
        ship.vy = Math.sin(ship.heading) * currentSpeed + stormDriftY;

        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;

        // Roll and pitch on waves
        ship.roll = Math.sin(this.time * 3.0 + ship.x * 0.05) * (0.05 + this.stormIntensity * 0.2);
        ship.pitch = Math.cos(this.time * 2.5 + ship.y * 0.05) * (0.04 + this.stormIntensity * 0.16);

        // Oar cycle timing for triremes and skiffs
        ship.oarCycle += dt * (ship.speed * 0.15);

        // Wake trail
        if (Math.random() < 0.35) {
          ship.wakeTrail.push({
            x: ship.x - Math.cos(ship.heading) * (ship.length * 0.4),
            y: ship.y - Math.sin(ship.heading) * (ship.length * 0.4),
            life: 1.0
          });
          if (ship.wakeTrail.length > 20) ship.wakeTrail.shift();
        }

        // Update wake trail decay
        for (let w = 0; w < ship.wakeTrail.length; w++) {
          ship.wakeTrail[w].life -= dt * 0.6;
        }

        // Safe arrival at Alexandria Harbor check
        const distToHarbor = Math.sqrt(distSq(ship.x, ship.y, this.harborMouth.x, this.harborMouth.y));
        if (distToHarbor < this.harborMouth.radius + 15) {
          // Guided safely home!
          this.shipsGuided++;
          this.ships.splice(i, 1);
          this.spawnShip(null, true);
          continue;
        }

        // Off-screen bounds wrap or despawn
        if (ship.x < -80 || ship.y < -100 || ship.y > this.height + 100) {
          this.ships.splice(i, 1);
          this.spawnShip(null, true);
          continue;
        }
      } else {
        // Wrecked ship sinking / splintering
        ship.wreckTimer += dt;
        ship.roll = lerp(ship.roll, 0.45, dt * 2);
        if (ship.wreckTimer > 8.0) {
          this.ships.splice(i, 1);
          this.spawnShip(null, true);
          continue;
        }
      }
    }

    this.shipsInBeam = beamCounter;

    // Ensure minimum fleet presence
    while (this.ships.length < 4) {
      this.spawnShip(null, true);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING ENGINE (Midnight Ocean, Volumetric Shaft, Fog, Ships, Pharos)     */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    if (!ctx) return;

    // Clear background: Deep Mediterranean Midnight Ocean (#050814)
    ctx.save();

    // 1. Midnight Ocean & Depth Gradients
    this.renderOcean(ctx);

    // 2. Coastal Reefs & Diamond Rock Hazards
    this.renderReefs(ctx);

    // 3. Ambient Sea Swell Waves & Whitecaps
    this.renderWaves(ctx);

    // 4. Approaching Merchant & Imperial Ships (Bottom layer)
    this.renderShips(ctx);

    // 5. Volumetric Golden-White Light Shaft (#FFF8DC) from Parabolic Mirror
    this.renderVolumetricBeam(ctx);

    // 6. Illuminated Dynamic Sea Fog & Drifting Mist Particles
    this.renderFog(ctx);

    // 7. Alexandria Harbor Promontory & Pharos Lighthouse Monument
    this.renderPharosMonument(ctx);

    // 8. Lightning flash (during storm)
    if (this.lightningAlpha > 0.01) {
      ctx.fillStyle = `rgba(224, 247, 250, ${this.lightningAlpha * 0.45})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 9. Classical Architectural Telemetry / HUD
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderOcean(ctx) {
    // Deep water midnight gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
    oceanGrad.addColorStop(0, '#050814'); // Abyss midnight
    oceanGrad.addColorStop(0.45, '#070C1E'); // Mediterranean deep
    oceanGrad.addColorStop(1, '#091329'); // Coastal shelf
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle water caustics / shoals near Alexandria coast (left side)
    const coastGrad = ctx.createRadialGradient(
      this.pharosPos.x, this.pharosPos.y, 10,
      this.pharosPos.x, this.pharosPos.y, this.width * 0.45
    );
    coastGrad.addColorStop(0, 'rgba(10, 38, 64, 0.45)');
    coastGrad.addColorStop(0.7, 'rgba(6, 22, 40, 0.2)');
    coastGrad.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = coastGrad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderReefs(ctx) {
    for (let i = 0; i < this.reefHazards.length; i++) {
      const reef = this.reefHazards[i];

      ctx.save();
      ctx.translate(reef.x, reef.y);

      // Submerged reef aura (turquoise shelf water)
      const shelfGrad = ctx.createRadialGradient(0, 0, reef.radius * 0.3, 0, 0, reef.radius * 1.5);
      shelfGrad.addColorStop(0, 'rgba(20, 75, 90, 0.55)');
      shelfGrad.addColorStop(0.7, 'rgba(12, 45, 60, 0.25)');
      shelfGrad.addColorStop(1, 'rgba(5, 8, 20, 0)');
      ctx.fillStyle = shelfGrad;
      ctx.beginPath();
      ctx.arc(0, 0, reef.radius * 1.5, 0, TWO_PI);
      ctx.fill();

      // Jagged limestone / granite rock silhouette
      ctx.fillStyle = '#1A1817';
      ctx.strokeStyle = '#3D3734';
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      const numPoints = reef.spikes * 2;
      for (let p = 0; p < numPoints; p++) {
        const a = (p / numPoints) * TWO_PI;
        const rFactor = (p % 2 === 0) ? 1.0 : (1.0 - reef.jaggedness);
        const r = reef.radius * rFactor + Math.sin(p * 3.5) * 4;
        const rx = Math.cos(a) * r;
        const ry = Math.sin(a) * r;
        if (p === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crashing sea foam against rock perimeter
      ctx.strokeStyle = 'rgba(224, 247, 250, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Reef warning beacon if equipped
      if (reef.beaconLit) {
        ctx.fillStyle = '#FFB300';
        ctx.shadowColor = '#FF8F00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, TWO_PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  renderWaves(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(224, 247, 250, 0.22)';
    ctx.lineWidth = 1.4;

    for (let i = 0; i < this.waveCrests.length; i++) {
      const w = this.waveCrests[i];
      const alpha = (0.12 + 0.18 * Math.sin(w.phase)) * (1.0 + this.stormIntensity * 0.8);
      ctx.strokeStyle = `rgba(200, 235, 245, ${alpha.toFixed(3)})`;

      ctx.beginPath();
      const nx = -Math.sin(w.angle);
      const ny = Math.cos(w.angle);
      const halfL = w.length * (0.8 + 0.4 * this.stormIntensity);

      ctx.moveTo(w.x - nx * halfL, w.y - ny * halfL);
      drawQuadCurve(
        ctx,
        w.x + Math.cos(w.angle) * 8,
        w.y + Math.sin(w.angle) * 8,
        w.x + nx * halfL,
        w.y + ny * halfL
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  renderVolumetricBeam(ctx) {
    const px = this.pharosPos.x;
    const py = this.pharosPos.y;
    const rMax = this.beamRange;
    const halfSpread = this.beamHalfSpread;

    ctx.save();

    // Use 'screen' or 'lighter' blend for realistic additive atmospheric photon scattering
    ctx.globalCompositeOperation = 'screen';

    // 1. Soft wide ambient lantern bloom around Pharos summit
    const lanternBloom = ctx.createRadialGradient(px, py, 5, px, py, 180);
    lanternBloom.addColorStop(0, 'rgba(255, 248, 220, 0.7)');
    lanternBloom.addColorStop(0.2, 'rgba(255, 215, 0, 0.35)');
    lanternBloom.addColorStop(0.6, 'rgba(255, 140, 0, 0.12)');
    lanternBloom.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = lanternBloom;
    ctx.beginPath();
    ctx.arc(px, py, 180, 0, TWO_PI);
    ctx.fill();

    // 2. Collimated Golden-White Light Shaft (#FFF8DC)
    // Primary conical volumetric fan
    const angleLeft = this.beamAngle - halfSpread;
    const angleRight = this.beamAngle + halfSpread;

    const xLeft = px + Math.cos(angleLeft) * rMax;
    const yLeft = py + Math.sin(angleLeft) * rMax;
    const xRight = px + Math.cos(angleRight) * rMax;
    const yRight = py + Math.sin(angleRight) * rMax;

    // Linear gradient along the beam axis
    const beamGrad = ctx.createLinearGradient(
      px, py,
      px + Math.cos(this.beamAngle) * rMax,
      py + Math.sin(this.beamAngle) * rMax
    );

    // Specular bronze warmth into midnight air: #FFF8DC (Cornsilk), #FFE4A0, #FFD700
    const beamAlpha = 0.65 * (1.0 - this.fogDensity * 0.25);
    beamGrad.addColorStop(0, `rgba(255, 255, 250, ${beamAlpha})`);
    beamGrad.addColorStop(0.12, `rgba(255, 248, 220, ${(beamAlpha * 0.85).toFixed(3)})`);
    beamGrad.addColorStop(0.45, `rgba(255, 228, 160, ${(beamAlpha * 0.5).toFixed(3)})`);
    beamGrad.addColorStop(0.8, `rgba(243, 156, 18, ${(beamAlpha * 0.2).toFixed(3)})`);
    beamGrad.addColorStop(1, 'rgba(5, 8, 20, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(xLeft, yLeft);
    ctx.arc(px, py, rMax, angleLeft, angleRight);
    ctx.closePath();
    ctx.fill();

    // 3. Intense Central Optical Core (Simulating high-collimation specular parabolic mirror focus)
    const coreHalfSpread = halfSpread * 0.35;
    const cLeft = px + Math.cos(this.beamAngle - coreHalfSpread) * rMax;
    const cLeftY = py + Math.sin(this.beamAngle - coreHalfSpread) * rMax;
    const cRight = px + Math.cos(this.beamAngle + coreHalfSpread) * rMax;
    const cRightY = py + Math.sin(this.beamAngle + coreHalfSpread) * rMax;

    const coreGrad = ctx.createLinearGradient(
      px, py,
      px + Math.cos(this.beamAngle) * rMax,
      py + Math.sin(this.beamAngle) * rMax
    );
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    coreGrad.addColorStop(0.15, 'rgba(255, 248, 220, 0.65)');
    coreGrad.addColorStop(0.5, 'rgba(255, 235, 170, 0.25)');
    coreGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(cLeft, cLeftY);
    ctx.arc(px, py, rMax, this.beamAngle - coreHalfSpread, this.beamAngle + coreHalfSpread);
    ctx.closePath();
    ctx.fill();

    // 4. Volumetric Shadow Occlusion Wedges (Reefs & Ships cast dark shadow cones)
    ctx.globalCompositeOperation = 'source-over'; // Carve out shadows
    this.renderShadowOcclusions(ctx);

    ctx.restore();
  }

  renderShadowOcclusions(ctx) {
    const px = this.pharosPos.x;
    const py = this.pharosPos.y;
    const shadowDist = this.beamRange * 1.2;

    // Collect all occluding obstacles
    const obstacles = [];
    for (let i = 0; i < this.reefHazards.length; i++) {
      const r = this.reefHazards[i];
      obstacles.push({ x: r.x, y: r.y, radius: r.radius * 0.95 });
    }
    for (let i = 0; i < this.ships.length; i++) {
      const s = this.ships[i];
      if (s.inBeam) {
        obstacles.push({ x: s.x, y: s.y, radius: s.beam * 0.9 });
      }
    }

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const dx = obs.x - px;
      const dy = obs.y - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const diffAngle = Math.abs(normalizeAngle(angle - this.beamAngle));

      // If obstacle is near or within the beam cone, cast volumetric shadow cone
      if (diffAngle < this.beamHalfSpread + 0.25 && d > obs.radius) {
        const tangentOffset = Math.asin(clamp(obs.radius / d, 0, 0.99));
        const a1 = angle - tangentOffset;
        const a2 = angle + tangentOffset;

        const p1x = obs.x + Math.cos(a1 + Math.PI * 0.5) * obs.radius;
        const p1y = obs.y + Math.sin(a1 + Math.PI * 0.5) * obs.radius;
        const p2x = obs.x + Math.cos(a2 - Math.PI * 0.5) * obs.radius;
        const p2y = obs.y + Math.sin(a2 - Math.PI * 0.5) * obs.radius;

        const end1x = px + Math.cos(a1) * shadowDist;
        const end1y = py + Math.sin(a1) * shadowDist;
        const end2x = px + Math.cos(a2) * shadowDist;
        const end2y = py + Math.sin(a2) * shadowDist;

        // Draw dark shadow polygon over the beam
        const shadowGrad = ctx.createLinearGradient(obs.x, obs.y, end1x, end1y);
        shadowGrad.addColorStop(0, 'rgba(5, 8, 20, 0.85)');
        shadowGrad.addColorStop(0.7, 'rgba(5, 8, 20, 0.6)');
        shadowGrad.addColorStop(1, 'rgba(5, 8, 20, 0.2)');

        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(end1x, end1y);
        ctx.lineTo(end2x, end2y);
        ctx.lineTo(p2x, p2y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  renderFog(ctx) {
    ctx.save();

    for (let i = 0; i < this.fogParticles.length; i++) {
      const p = this.fogParticles[i];

      // Base night mist opacity scaled by fogDensity setting
      const baseAlpha = p.density * this.fogDensity * 0.18;

      if (p.illumination > 0.02) {
        // Particle is illuminated by the golden-white beam: brilliant atmospheric forward scattering!
        ctx.globalCompositeOperation = 'screen';
        const illumGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        const alpha = Math.min(1.0, (baseAlpha + p.illumination * 0.45));
        illumGrad.addColorStop(0, `rgba(255, 248, 220, ${(alpha * 0.9).toFixed(3)})`);
        illumGrad.addColorStop(0.4, `rgba(255, 230, 150, ${(alpha * 0.45).toFixed(3)})`);
        illumGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');

        ctx.fillStyle = illumGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1.0 + p.illumination * 0.3), 0, TWO_PI);
        ctx.fill();
      } else {
        // Outside beam: subtle dark drifting coastal sea mist
        ctx.globalCompositeOperation = 'source-over';
        const darkFogGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        darkFogGrad.addColorStop(0, `rgba(24, 38, 56, ${baseAlpha.toFixed(3)})`);
        darkFogGrad.addColorStop(1, 'rgba(5, 8, 20, 0)');

        ctx.fillStyle = darkFogGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderShips(ctx) {
    for (let i = 0; i < this.ships.length; i++) {
      const ship = this.ships[i];

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.heading);

      // Ship shadow on water
      ctx.fillStyle = 'rgba(2, 4, 10, 0.65)';
      ctx.beginPath();
      drawEllipse(ctx, -2, 4, ship.length * 0.5, ship.beam * 0.55, 0, 0, TWO_PI);
      ctx.fill();

      // Hull Construction
      ctx.fillStyle = ship.hullColor;
      ctx.strokeStyle = ship.inBeam ? '#FFEAA7' : '#2A1810';
      ctx.lineWidth = ship.inBeam ? 2.0 : 1.2;

      // Double-ended classical Mediterranean hull silhouette (prorated beak & stern aphlaston)
      ctx.beginPath();
      ctx.moveTo(ship.length * 0.55, 0); // Prow beak / ram
      drawBezierCurve(
        ctx,
        ship.length * 0.2, -ship.beam * 0.6,
        -ship.length * 0.2, -ship.beam * 0.55,
        -ship.length * 0.5, -ship.beam * 0.35
      );
      drawQuadCurve(ctx, -ship.length * 0.58, 0, -ship.length * 0.5, ship.beam * 0.35);
      drawBezierCurve(
        ctx,
        -ship.length * 0.2, ship.beam * 0.55,
        ship.length * 0.2, ship.beam * 0.6,
        ship.length * 0.55, 0
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Deck deck-house / hatch
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(-ship.length * 0.15, -ship.beam * 0.3, ship.length * 0.3, ship.beam * 0.6);

      // Oars (if trireme or skiff)
      if (ship.type === 'trireme' || ship.type === 'skiff') {
        ctx.strokeStyle = ship.inBeam ? '#D7CCC8' : '#5D4037';
        ctx.lineWidth = 1.0;
        const oarCount = ship.type === 'trireme' ? 6 : 3;
        const oarSpan = ship.length * 0.45;
        const startX = -oarSpan * 0.5;

        for (let o = 0; o < oarCount; o++) {
          const ox = startX + (o / (oarCount - 1)) * oarSpan;
          const oarAngle = Math.sin(ship.oarCycle + o * 0.4) * 0.35;

          // Port & Starboard oars
          const oarLen = ship.beam * 1.25;
          ctx.beginPath();
          ctx.moveTo(ox, -ship.beam * 0.45);
          ctx.lineTo(ox - Math.sin(oarAngle) * oarLen, -ship.beam * 0.45 - Math.cos(oarAngle) * oarLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ox, ship.beam * 0.45);
          ctx.lineTo(ox - Math.sin(oarAngle) * oarLen, ship.beam * 0.45 + Math.cos(oarAngle) * oarLen);
          ctx.stroke();
        }
      }

      // Mast & Canvas Sail
      ctx.strokeStyle = '#271A11';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ship.length * 0.05, -ship.beam * 0.65);
      ctx.lineTo(ship.length * 0.05, ship.beam * 0.65);
      ctx.stroke();

      // Curved full belly canvas sail
      ctx.fillStyle = ship.inBeam ? '#FFF8DC' : ship.sailColor;
      ctx.strokeStyle = ship.inBeam ? '#F1C40F' : '#8D6E63';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(ship.length * 0.05, -ship.beam * 0.65);
      drawQuadCurve(
        ctx,
        ship.length * 0.22, 0,
        ship.length * 0.05, ship.beam * 0.65
      );
      drawQuadCurve(
        ctx,
        ship.length * 0.12, 0,
        ship.length * 0.05, -ship.beam * 0.65
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stern navigation lantern
      const lanternColor = ship.isGuided ? '#2ECC71' : (ship.isWrecked ? '#E74C3C' : '#FFA000');
      ctx.fillStyle = lanternColor;
      ctx.shadowColor = lanternColor;
      ctx.shadowBlur = ship.inBeam ? 12 : 5;
      ctx.beginPath();
      ctx.arc(-ship.length * 0.48, 0, 3, 0, TWO_PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Status Indicator floating above ship
      if (ship.isGuided && !ship.isWrecked) {
        ctx.fillStyle = '#2ECC71';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚓ SAFE HARBOR', 0, -ship.beam - 8);
      } else if (ship.isWrecked) {
        ctx.fillStyle = '#FF5252';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ WRECKED ON REEF', 0, -ship.beam - 8);
      }

      ctx.restore();
    }
  }

  renderPharosMonument(ctx) {
    const px = this.pharosPos.x;
    const py = this.pharosPos.y;

    ctx.save();

    // 1. Rocky Promontory of Pharos Island
    ctx.fillStyle = '#1A1816';
    ctx.strokeStyle = '#38332E';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    drawEllipse(ctx, px - 15, py, 75, 95, 0, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    // Stone Mole & Breakwater blocks (Heptastadion jetty)
    ctx.fillStyle = '#26221E';
    ctx.strokeStyle = '#4A423B';
    ctx.lineWidth = 1.5;
    for (let b = -4; b <= 4; b++) {
      ctx.strokeRect(px - 65, py + b * 18 - 8, 28, 14);
    }

    // 2. Alexandria Harbor Entrance Buoys & Pilot Lights
    ctx.fillStyle = '#00E676';
    ctx.shadowColor = '#00E676';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.harborMouth.x, this.harborMouth.y - 45, 4, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = '#FF5252';
    ctx.shadowColor = '#FF5252';
    ctx.beginPath();
    ctx.arc(this.harborMouth.x, this.harborMouth.y + 45, 4, 0, TWO_PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Pharos Monument Base Tier (Square White Limestone Bastion)
    ctx.fillStyle = '#D7D0C5';
    ctx.strokeStyle = '#8C8275';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.strokeRect(px - 28, py - 28, 56, 56);
    ctx.fillRect(px - 28, py - 28, 56, 56);
    ctx.shadowBlur = 0;

    // Greek Dedicatory Inscription Band
    ctx.fillStyle = '#5A5248';
    ctx.fillRect(px - 24, py - 24, 48, 48);

    // 4. Middle Octagonal Tier (Polished Proconnesian Marble)
    ctx.fillStyle = '#ECE7DE';
    ctx.strokeStyle = '#A89E90';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    const octR = 18;
    for (let o = 0; o < 8; o++) {
      const a = (o / 8) * TWO_PI + Math.PI * 0.125;
      const ox = px + Math.cos(a) * octR;
      const oy = py + Math.sin(a) * octR;
      if (o === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Cylindrical Lantern Summit Room
    ctx.fillStyle = '#B0A89B';
    ctx.strokeStyle = '#7D7569';
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    // 6. Polished Parabolic Bronze Mirror Mechanism
    // Rotates with beamAngle, directing specular reflection outward
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.beamAngle);

    // Concave parabolic mirror curvature (Bronze alloy #CD7F32 & Gold speculum)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Parabolic arc behind the fire focal point
    ctx.arc(-3, 0, 8, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.stroke();

    // Specular bronze backplate highlight
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(-3.5, 0, 7.5, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    ctx.restore();

    // 7. Summit Brazier Fire & Sparks (Focal Point of the Parabola)
    ctx.fillStyle = '#FFF8DC';
    ctx.shadowColor = '#FF8F00';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, TWO_PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Flame sparks leaping from summit
    for (let f = 0; f < this.brazierParticles.length; f++) {
      const b = this.brazierParticles[f];
      const alpha = 1.0 - (b.life / b.maxLife);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * alpha, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 8. Colossal Bronze Statue of Zeus Soter / Poseidon atop summit
    ctx.fillStyle = '#B87333';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(px - 1, py - 1, 2.2, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    // Top Header Banner
    const pad = 10;
    const boxW = narrow ? Math.min(sw - 20, 260) : 310;
    const boxH = narrow ? 104 : 126;

    ctx.fillStyle = 'rgba(5, 8, 20, 0.78)';
    ctx.fillRect(pad, pad, boxW, boxH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(pad, pad, boxW, boxH);

    // Classical Greek Header
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px "Cinzel", "Times New Roman", serif';
    ctx.fillText('PHAROS ALEXANDRINUS', pad + 10, pad + 18);

    if (!narrow) {
      ctx.fillStyle = 'rgba(255, 248, 220, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('WONDER OF THE ANCIENT MEDITERRANEAN', pad + 10, pad + 32);
    }

    // Telemetry lines
    const beamDeg = ((this.beamAngle * RAD2DEG) % 360 + 360) % 360;
    const opticalRangeStadia = ((this.beamRange * 0.25) * (1.0 - this.fogDensity * 0.45)).toFixed(0);

    ctx.fillStyle = '#FFF8DC';
    ctx.font = narrow ? '10px monospace' : '11px monospace';

    const yStart = narrow ? pad + 34 : pad + 52;
    const lineH = narrow ? 15 : 16;
    ctx.fillText(`• Azimuth   : ${beamDeg.toFixed(1)}° (±${this.collimationDeg.toFixed(0)}°)`, pad + 10, yStart);
    ctx.fillText(`• Range     : ${opticalRangeStadia} Stadia (~${(opticalRangeStadia * 0.185).toFixed(1)} km)`, pad + 10, yStart + lineH);

    // Ships guided status
    ctx.fillStyle = '#2ECC71';
    ctx.fillText(`• Guided    : ${this.shipsGuided} safe`, pad + 10, yStart + lineH * 2);
    if (this.totalShipsLost > 0) {
      ctx.fillStyle = '#FF5252';
      ctx.fillText(`• Lost      : ${this.totalShipsLost}`, pad + 10, yStart + lineH * 3);
    } else {
      ctx.fillStyle = '#48CAE4';
      ctx.fillText(`• Approach  : Clear`, pad + 10, yStart + lineH * 3);
    }

    if (!narrow) {
      // Weather HUD (Top Right)
      const rightBoxW = 200;
      const rightX = sw - rightBoxW - 12;

      ctx.fillStyle = 'rgba(5, 8, 20, 0.78)';
      ctx.fillRect(rightX, 10, rightBoxW, 72);
      ctx.strokeStyle = this.isStorm ? 'rgba(255, 87, 34, 0.6)' : 'rgba(72, 202, 228, 0.35)';
      ctx.strokeRect(rightX, 10, rightBoxW, 72);

      ctx.fillStyle = this.isStorm ? '#FF7043' : '#48CAE4';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(this.isStorm ? '⚡ MEDITERRANEAN SQUALL' : '🌊 CALM COASTAL SWELL', rightX + 14, 28);

      ctx.fillStyle = '#E0F7FA';
      ctx.font = '10px monospace';
      ctx.fillText(`Fog Density  : ${(this.fogDensity * 100).toFixed(0)}%`, rightX + 14, 44);
      ctx.fillText(`Vessels Track: ${this.shipsInBeam} in beam`, rightX + 14, 58);
      ctx.fillText(`Wind Velocity: ${this.windSpeed.toFixed(0)} knots`, rightX + 14, 72);
    }

    ctx.restore();
  }
}
