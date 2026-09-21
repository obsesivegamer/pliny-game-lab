/**
 * Pliny Game Lab — Horologium (Vitruvian Water Clock / Clepsydra)
 * 
 * Based on Vitruvius (De Architectura, Liber IX, Caput VIII) and Ctesibius of Alexandria:
 * 1. Fluid Dynamics: Main supply clepsydra draining via Torricelli's Law:
 *      dV/dt = -k * A_orifice * sqrt(h)
 * 2. Rotary Stepping & Transmission: Falling water stream turns impulse waterwheel.
 * 3. Float Escapement (Phellos & Regula Dentata): Water accumulates in calibrated
 *    cylinder; rising cork float lifts a toothed rack, rotating pinion and
 *    astronomical dial with 12 Roman unequal hours (Horae Temporales) and Zodiac signs.
 * 4. Automatic Inverted Siphon (Sipho Inversus): Flushes reservoir upon completion of 12-hour cycle.
 * 5. Acoustic Tintinnabulum (Bell Chime): Strikes on each hour transition.
 * 6. Cyber-Classical Styling: Gold (#FFD700), Cyan (#00FFFF), Deep Blue (#000033).
 */

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class HorologiumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    // Simulation Parameters
    this.initialVolume = 500; // mL (V0)
    this.upperVolume = 500; // current mL (V1)
    this.maxCapacity = 1000; // max reservoir mL
    this.drainRateK = 1.0; // Torricelli orifice coefficient k
    this.timeScale = 1.0; // simulation speed multiplier
    this.orificeAperture = 1.0; // valve opening (0.0 to 1.0)
    this.lowerVolume = 0; // accumulated volume mL (V2)
    this.lowerMaxVolume = 600; // mL corresponding to 12 hours cycle
    this.soundEnabled = true;

    // Physical States & Dimensions
    this.headHeight = 0; // Torricelli head h in cm
    this.flowRate = 0; // instantaneous dV/dt in mL/s
    this.floatY = 0; // current Y position of float
    this.floatTargetY = 0; // target buoyant Y
    this.floatVelocity = 0;
    this.siphonActive = false; // inverted siphon purge active
    this.siphonRate = 350; // mL/s purge speed
    this.escapementTicks = 0;
    this.lastTickHour = -1;
    this.bellStrikerAngle = 0; // hammer strike animation angle
    this.bellStrikerVel = 0;
    this.bellGlow = 0;

    // Gear Train Rotations (angles in radians)
    this.waterwheelAngle = 0;
    this.waterwheelSpeed = 0;
    this.pinionAngle = 0;
    this.idlerAngle = 0;
    this.reducerAngle = 0;
    this.dialAngle = 0; // 0 rad = XII (12 o'clock)
    this.dialAngularVel = 0;
    this.escapementAngle = 0;

    // Interactive States
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.isDraggingDial = false;
    this.dialDragStartAngle = 0;
    this.dialBaseAngle = 0;
    this.hoveredItem = null;
    this.timeElapsed = 0;

    // Particles & Splashes
    this.droplets = [];
    this.splashes = [];
    this.surfaceRipples = [];
    this.lowerSurfaceRipples = [];
    this.dropletAccumulator = 0;

    // Distinct Mechanical Gears
    this.gearWaterwheel = { id: 'gearWaterwheel', name: 'Rota Aquaria (Impeller)', radius: 38, teeth: 16, angle: 0, x: 0, y: 0 };
    this.gearRackPinion = { id: 'gearRackPinion', name: 'Tympanum Dentatum (Pinion)', radius: 20, teeth: 12, angle: 0, x: 0, y: 0 };
    this.gearIdler = { id: 'gearIdler', name: 'Rota Transmissoria (Idler)', radius: 34, teeth: 20, angle: 0, x: 0, y: 0 };
    this.gearReducer = { id: 'gearReducer', name: 'Rota Moderatrix (Reducer)', radius: 26, teeth: 15, angle: 0, x: 0, y: 0 };
    this.gearDial = { id: 'gearDial', name: 'Horologium Anaphoricum (Astro Dial)', radius: 140, teeth: 60, angle: 0, x: 0, y: 0 };
    this.gearEscapement = { id: 'gearEscapement', name: 'Rota Ctesibiana (Escapement)', radius: 26, teeth: 12, angle: 0, x: 0, y: 0 };

    this.gears = [
      this.gearWaterwheel,
      this.gearRackPinion,
      this.gearIdler,
      this.gearReducer,
      this.gearDial,
      this.gearEscapement
    ];

    // Distinct Visual Markers
    this.markers = [
      { id: 'markerFloat', type: 'float', name: 'Phellos (Cork Float)' },
      { id: 'markerRack', type: 'rack', name: 'Regula Dentata (Toothed Rack)' },
      { id: 'markerHourHand', type: 'pointer', name: 'Index Horarius (Hour Hand)' },
      { id: 'markerMinuteHand', type: 'pointer', name: 'Index Minutalis (Minute Pointer)' },
      { id: 'markerSun', type: 'celestial', name: 'Index Solis (Solar Orb)' },
      { id: 'markerValve', type: 'valve', name: 'Epitonium (Needle Valve)' },
      { id: 'markerHammer', type: 'striker', name: 'Malleus Tintinnabuli (Bell Striker)' },
      { id: 'markerSiphon', type: 'siphon', name: 'Sipho Inversus (Overflow Siphon)' },
      { id: 'markerGaugeUpper', type: 'gauge', name: 'Gradus Superior (Upper Gauge)' },
      { id: 'markerGaugeLower', type: 'gauge', name: 'Gradus Inferior (Lower Gauge)' }
    ];

    // Roman Numerals for 12 Hours (Horae Temporales)
    this.romanHours = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    this.zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

    // Audio Context (Safe Lazy Initialization)
    this.audioCtx = null;
    this.audioInitialized = false;

    // Layout Geometries
    this.calculateLayout();
    this.buildControls();
    this.reset();
    attachTouchBridge(this, canvas);
  }

  // Calculate Responsive Layout Coordinates
  calculateLayout() {
    const w = this.width;
    const h = this.height;

    // Left Column: Fluid Hydraulics
    this.tankX = w * 0.23;
    this.tankTopY = h * 0.13;
    this.tankWidth = Math.min(w * 0.22, 160);
    this.tankHeight = Math.min(h * 0.22, 130);
    this.tankBottomY = this.tankTopY + this.tankHeight;
    this.nozzleX = this.tankX;
    this.nozzleY = this.tankBottomY + 12;

    // Waterwheel position (positioned below nozzle to catch jet)
    this.gearWaterwheel.x = this.tankX + this.tankWidth * 0.16;
    this.gearWaterwheel.y = this.tankBottomY + 62;
    this.gearWaterwheel.radius = Math.min(w * 0.055, 38);

    // Lower Cylinder (Inflow Accumulator)
    this.lowerX = this.tankX;
    this.lowerTopY = this.gearWaterwheel.y + 44;
    this.lowerWidth = Math.min(w * 0.20, 140);
    this.lowerHeight = Math.min(h * 0.32, 190);
    this.lowerBottomY = this.lowerTopY + this.lowerHeight;

    // Rack & Pinion Position
    this.rackX = this.lowerX + 16;
    this.gearRackPinion.x = this.rackX + this.gearRackPinion.radius + 3;
    this.gearRackPinion.y = this.lowerTopY + 18;

    // Right Column: Celestial Astronomical Dial & Gear Train
    this.gearDial.x = Math.max(w * 0.68, this.tankX + this.tankWidth + 180);
    this.gearDial.y = h * 0.50;
    this.gearDial.radius = Math.min(w * 0.21, h * 0.32, 150);

    // Intermediate Gears connecting Rack Pinion to Main Dial
    this.gearIdler.x = (this.gearRackPinion.x + this.gearDial.x) * 0.44;
    this.gearIdler.y = (this.gearRackPinion.y + this.gearDial.y) * 0.48 - 18;

    this.gearReducer.x = (this.gearRackPinion.x + this.gearDial.x) * 0.72;
    this.gearReducer.y = (this.gearRackPinion.y + this.gearDial.y) * 0.52 - 10;

    // Escapement Gear above Main Dial
    this.gearEscapement.x = this.gearDial.x;
    this.gearEscapement.y = this.gearDial.y - this.gearDial.radius - this.gearEscapement.radius + 6;

    // Tintinnabulum (Bronze Chime Bell)
    this.bellX = this.gearDial.x + this.gearDial.radius * 0.72;
    this.bellY = this.gearDial.y - this.gearDial.radius * 0.72;
    this.bellRadius = 26;

    // Siphon Tube on Right Edge of Lower Cylinder
    this.siphonX = this.lowerX + this.lowerWidth * 0.5;
    this.siphonTopY = this.lowerTopY + 20;
    this.siphonBottomY = this.lowerBottomY + 24;
  }

  // Safe Headless DOM Guard
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Drain Rate (k)</span>
          <span id="drain-rate-val" style="color: #00FFFF; font-weight: 600;">${this.drainRateK.toFixed(2)}</span>
        </label>
        <input type="range" id="drain-rate-slider" min="0.1" max="3.0" step="0.05" value="${this.drainRateK}">
      </div>

      <div class="control-group">
        <label>
          <span>Initial Volume</span>
          <span id="initial-vol-val" style="color: #FFD700; font-weight: 600;">${this.initialVolume} mL</span>
        </label>
        <input type="range" id="initial-vol-slider" min="100" max="1000" step="25" value="${this.initialVolume}">
      </div>

      <div class="control-group">
        <label>
          <span>Time Scale</span>
          <span id="time-scale-val" style="color: #3BD6C6; font-weight: 600;">${this.timeScale.toFixed(1)}x</span>
        </label>
        <input type="range" id="time-scale-slider" min="0.2" max="5.0" step="0.1" value="${this.timeScale}">
      </div>

      <div class="control-btn-grid" style="margin-top: 8px;">
        <button id="reset-btn" class="sub-btn" style="border-color: #FFD700; color: #FFD700;">Reset Clock</button>
        <button id="refill-btn" class="sub-btn">Refill Tank</button>
      </div>

      <div class="control-btn-grid" style="margin-top: 4px;">
        <button id="strike-bell-btn" class="sub-btn">Strike Bell</button>
        <button id="toggle-sound-btn" class="sub-btn">Sound: ON</button>
      </div>

      <div style="margin-top: 10px; font-size: 0.73rem; color: #8c909e; line-height: 1.45; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
        <strong style="color: #FFD700;">Vitruvian Water Clock (Clepsydra):</strong><br>
        Upper reservoir drains under Torricelli fluid head: <span style="color: #00FFFF;">dV/dt = -k√h</span>.
        Water stream propels impeller wheel and accumulates in the graduated cylinder, lifting the cork float rack and driving the celestial bronze dial.
      </div>
    `;

    const drainSlider = this.controlsContainer.querySelector('#drain-rate-slider');
    const drainVal = this.controlsContainer.querySelector('#drain-rate-val');
    if (drainSlider) {
      drainSlider.addEventListener('input', (e) => {
        this.drainRateK = parseFloat(e.target.value);
        if (drainVal) drainVal.textContent = this.drainRateK.toFixed(2);
      });
    }

    const volSlider = this.controlsContainer.querySelector('#initial-vol-slider');
    const volVal = this.controlsContainer.querySelector('#initial-vol-val');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.initialVolume = parseInt(e.target.value, 10);
        if (volVal) volVal.textContent = `${this.initialVolume} mL`;
      });
    }

    const speedSlider = this.controlsContainer.querySelector('#time-scale-slider');
    const speedVal = this.controlsContainer.querySelector('#time-scale-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.timeScale = parseFloat(e.target.value);
        if (speedVal) speedVal.textContent = `${this.timeScale.toFixed(1)}x`;
      });
    }

    const resetBtn = this.controlsContainer.querySelector('#reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }

    const refillBtn = this.controlsContainer.querySelector('#refill-btn');
    if (refillBtn) {
      refillBtn.addEventListener('click', () => {
        this.upperVolume = this.initialVolume;
        this.triggerSplash(this.tankX, this.tankTopY + 20, 8, '#00FFFF');
        this.initAudio();
        this.playDripSound();
      });
    }

    const strikeBtn = this.controlsContainer.querySelector('#strike-bell-btn');
    if (strikeBtn) {
      strikeBtn.addEventListener('click', () => {
        this.triggerBellStrike();
      });
    }

    const soundBtn = this.controlsContainer.querySelector('#toggle-sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        soundBtn.textContent = this.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
      });
    }
  }

  // Resize Handler
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.calculateLayout();
  }

  // Reset Clock Simulation State
  reset() {
    this.upperVolume = this.initialVolume;
    this.lowerVolume = 0;
    this.siphonActive = false;
    this.dialAngle = 0;
    this.dialAngularVel = 0;
    this.waterwheelAngle = 0;
    this.waterwheelSpeed = 0;
    this.pinionAngle = 0;
    this.idlerAngle = 0;
    this.reducerAngle = 0;
    this.escapementAngle = 0;
    this.escapementTicks = 0;
    this.lastTickHour = 0;
    this.bellStrikerAngle = 0;
    this.bellStrikerVel = 0;
    this.bellGlow = 0;
    this.droplets = [];
    this.splashes = [];
    this.surfaceRipples = [];
    this.lowerSurfaceRipples = [];
    this.floatY = this.lowerBottomY - 14;
    this.floatTargetY = this.floatY;
    this.floatVelocity = 0;
    this.timeElapsed = 0;
  }

  // Web Audio Synthesis (Pure Web Audio with safe try-catch & fallback)
  initAudio() {
    if (this.audioInitialized) return;
    try {
      const AudioCtxClass = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        this.audioInitialized = true;
      }
    } catch (e) {
      // Safe fallback for test/mock environments
    }
  }

  playDripSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      const startF = 1400 + Math.random() * 600;
      osc.frequency.setValueAtTime(startF, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.audioCtx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.055);
    } catch (e) {}
  }

  playTickSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.audioCtx.currentTime + 0.02);
      gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.022);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.025);
    } catch (e) {}
  }

  playChimeSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      // Roman Bronze Bell Chime: Harmonics at 587.3 Hz (D5), 880 Hz (A5), 1468 Hz (D6)
      const freqs = [587.3, 880.0, 1468.0];
      const gains = [0.22, 0.12, 0.05];
      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(gains[idx], this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.8);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.85);
      });
    } catch (e) {}
  }

  // Bell Striker Event Trigger
  triggerBellStrike() {
    this.initAudio();
    this.bellStrikerAngle = 0.55; // Pull hammer back
    this.bellGlow = 1.0;
    this.playChimeSound();
    this.triggerSplash(this.bellX, this.bellY, 6, '#FFD700');
  }

  // Splash Particle Emitter
  triggerSplash(x, y, count = 4, color = '#00FFFF') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      this.splashes.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        radius: 1.2 + Math.random() * 2.0,
        color,
        life: 1.0,
        decay: 1.5 + Math.random() * 1.5
      });
    }
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  // Destroy / Cleanup
  destroy() {
    detachTouchBridge(this, this.canvas);
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

  // Entity Count Contract: droplets + gears + markers + splashes
  getEntityCount() {
    const drops = this.droplets ? this.droplets.length : 0;
    const gears = this.gears ? this.gears.length : 0;
    const markers = this.markers ? this.markers.length : 0;
    const splashes = this.splashes ? this.splashes.length : 0;
    return drops + gears + markers + splashes;
  }

  // Simulation Update Loop
  update(dt) {
    // Clamp delta time to avoid large physics steps
    const safeDt = Math.min(dt, 0.05) * this.timeScale;
    this.timeElapsed += safeDt;

    // 1. Fluid Dynamics: Torricelli Reservoir Drain: dV/dt = -k * sqrt(h)
    const normalizedUpperHeight = Math.max(0, this.upperVolume / this.maxCapacity);
    this.headHeight = normalizedUpperHeight * 30; // normalized head 0 - 30 cm

    if (this.upperVolume > 0 && this.orificeAperture > 0) {
      // Torricelli instantaneous flow rate: dV/dt = -k * A * sqrt(h)
      const k = this.drainRateK * 18.0;
      this.flowRate = k * this.orificeAperture * Math.sqrt(Math.max(0.01, normalizedUpperHeight));
      const dV = this.flowRate * safeDt;

      const drainedVolume = Math.min(this.upperVolume, dV);
      this.upperVolume = Math.max(0, this.upperVolume - drainedVolume);

      // Inflow into lower receiving cylinder (if siphon not purging)
      if (!this.siphonActive) {
        this.lowerVolume = Math.min(this.lowerMaxVolume, this.lowerVolume + drainedVolume);
      }

      // Droplet Emitter Accumulator
      this.dropletAccumulator += drainedVolume;
      const volumePerDroplet = 0.75;
      while (this.dropletAccumulator >= volumePerDroplet) {
        this.dropletAccumulator -= volumePerDroplet;
        const dropletSpeed = 100 + Math.sqrt(normalizedUpperHeight) * 90;
        this.droplets.push({
          x: this.nozzleX + (Math.random() - 0.5) * 4,
          y: this.nozzleY,
          vx: (Math.random() - 0.5) * 12,
          vy: dropletSpeed + (Math.random() - 0.5) * 20,
          radius: 2.0 + Math.random() * 1.8,
          alpha: 0.95
        });
      }
    } else {
      this.flowRate = 0;
    }

    // 2. Automatic Inverted Siphon Purge Logic
    if (!this.siphonActive && this.lowerVolume >= this.lowerMaxVolume * 0.985) {
      this.siphonActive = true;
      this.triggerSplash(this.siphonX, this.siphonTopY, 12, '#00FFFF');
    }

    if (this.siphonActive) {
      const siphonDischarge = this.siphonRate * safeDt;
      this.lowerVolume = Math.max(0, this.lowerVolume - siphonDischarge);
      this.triggerSplash(this.siphonX, this.siphonBottomY, 2, '#00FFFF');
      if (this.lowerVolume <= 2) {
        this.siphonActive = false;
        this.lowerVolume = 0;
        this.triggerBellStrike(); // Cycle completion chime
      }
    }

    // 3. Lower Accumulation Cylinder & Float Buoyancy Dynamics
    const lowerFillRatio = Math.min(1.0, Math.max(0, this.lowerVolume / this.lowerMaxVolume));
    const waterSurfaceY = this.lowerBottomY - lowerFillRatio * (this.lowerHeight - 20);
    this.floatTargetY = waterSurfaceY - 8; // Float rests on water surface

    // Damped harmonic bobbing for cork float
    const floatSpring = 60;
    const floatDamping = 9.0;
    const floatForce = (this.floatTargetY - this.floatY) * floatSpring;
    this.floatVelocity += (floatForce - this.floatVelocity * floatDamping) * safeDt;
    this.floatY += this.floatVelocity * safeDt;

    // 4. Water Droplets Dynamics & Collision with Impeller / Lower Basin
    const gravity = 550;
    const wheelX = this.gearWaterwheel.x;
    const wheelY = this.gearWaterwheel.y;
    const wheelRadius = this.gearWaterwheel.radius;

    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const drop = this.droplets[i];
      drop.vy += gravity * safeDt;
      drop.x += drop.vx * safeDt;
      drop.y += drop.vy * safeDt;

      // Collision with Impeller (Waterwheel) paddles
      const dxWheel = drop.x - wheelX;
      const dyWheel = drop.y - wheelY;
      const distWheel = Math.hypot(dxWheel, dyWheel);

      if (distWheel < wheelRadius + 6 && distWheel > wheelRadius - 14 && dxWheel < 4) {
        // Torque imparted to wheel: tau = r * F
        const impactTorque = drop.vy * 0.008;
        this.waterwheelSpeed = Math.min(18, this.waterwheelSpeed + impactTorque);
        drop.vx = (Math.random() - 0.5) * 35 + 15;
        drop.vy *= 0.35;
        this.triggerSplash(drop.x, drop.y, 1, '#00FFFF');
      }

      // Arrival at lower water surface or bottom
      if (drop.y >= waterSurfaceY) {
        this.lowerSurfaceRipples.push({
          x: drop.x,
          radius: 1.5,
          alpha: 0.8,
          maxRadius: 18 + Math.random() * 10
        });
        if (Math.random() < 0.15) {
          this.initAudio();
          this.playDripSound();
        }
        this.triggerSplash(drop.x, drop.y, 1, '#00FFFF');
        this.droplets.splice(i, 1);
        continue;
      }

      // Bottom boundary safety
      if (drop.y > this.height + 20) {
        this.droplets.splice(i, 1);
      }
    }

    // 5. Update Splashes & Ripple Wavefronts
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.x += sp.vx * safeDt;
      sp.y += sp.vy * safeDt;
      sp.vy += 300 * safeDt;
      sp.life -= sp.decay * safeDt;
      if (sp.life <= 0) {
        this.splashes.splice(i, 1);
      }
    }

    for (let i = this.lowerSurfaceRipples.length - 1; i >= 0; i--) {
      const rip = this.lowerSurfaceRipples[i];
      rip.radius += 24 * safeDt;
      rip.alpha -= 1.8 * safeDt;
      if (rip.alpha <= 0) {
        this.lowerSurfaceRipples.splice(i, 1);
      }
    }

    // 6. Mechanical Gear Train Dynamics & Float Coupling
    // Float elevation turns rack pinion
    const floatTravel = (this.lowerBottomY - 14) - this.floatY;
    const rackPinionRad = this.gearRackPinion.radius;
    const targetPinionAngle = (floatTravel / rackPinionRad);

    // Smooth coupling with slight mechanical inertia
    this.pinionAngle += (targetPinionAngle - this.pinionAngle) * Math.min(1.0, 15 * safeDt);

    // Impeller waterwheel decay
    this.waterwheelSpeed = Math.max(0, this.waterwheelSpeed - 2.8 * safeDt);
    this.waterwheelAngle += this.waterwheelSpeed * safeDt;

    // Gear mesh kinematics
    // Ratio Pinion -> Idler (12:20)
    this.idlerAngle = -this.pinionAngle * (this.gearRackPinion.teeth / this.gearIdler.teeth);
    // Ratio Idler -> Reducer (20:15)
    this.reducerAngle = -this.idlerAngle * (this.gearIdler.teeth / this.gearReducer.teeth);

    // If user is not dragging dial directly, drive dial from float rack
    if (!this.isDraggingDial) {
      // 12 hours cycle = 2 * PI radians on the dial
      const targetDialAngle = (lowerFillRatio * Math.PI * 2);
      const dialDiff = targetDialAngle - this.dialAngle;
      this.dialAngularVel = dialDiff * 8.0;
      this.dialAngle += this.dialAngularVel * safeDt;
    } else {
      this.dialAngle += this.dialAngularVel * safeDt;
      this.dialAngularVel *= Math.max(0, 1 - 5 * safeDt);
    }

    // Escapement Gear meshes with Main Dial (60:12 -> 5:1 ratio)
    this.escapementAngle = -this.dialAngle * (this.gearDial.teeth / this.gearEscapement.teeth);

    // Update Gear Objects with live angles
    this.gearWaterwheel.angle = this.waterwheelAngle;
    this.gearRackPinion.angle = this.pinionAngle;
    this.gearIdler.angle = this.idlerAngle;
    this.gearReducer.angle = this.reducerAngle;
    this.gearDial.angle = this.dialAngle;
    this.gearEscapement.angle = this.escapementAngle;

    // 7. Discrete Mechanical Stepping & Escapement Ticks
    // 120 ticks per 12 hours (1 tick per minute of time)
    const totalTicksInCycle = 120;
    const currentTickIndex = Math.floor(((this.dialAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2 / totalTicksInCycle));
    if (currentTickIndex !== this.lastTickIndex && Math.abs(this.flowRate) > 0.05) {
      this.escapementTicks++;
      this.lastTickIndex = currentTickIndex;
      if (this.escapementTicks % 2 === 0) {
        this.initAudio();
        this.playTickSound();
      }
    }

    // 8. Roman Hour Transition & Tintinnabulum Chime
    const normalizedDial = ((this.dialAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const currentHour = Math.floor((normalizedDial / (Math.PI * 2)) * 12);
    if (this.lastTickHour !== -1 && currentHour !== this.lastTickHour && Math.abs(this.flowRate) > 0.05) {
      this.triggerBellStrike();
    }
    this.lastTickHour = currentHour;

    // 9. Bell Striker Hammer Animation
    if (this.bellStrikerAngle > 0.01) {
      this.bellStrikerVel -= 25.0 * safeDt;
      this.bellStrikerAngle += this.bellStrikerVel * safeDt;
      if (this.bellStrikerAngle <= 0) {
        this.bellStrikerAngle = 0;
        this.bellStrikerVel = 0;
      }
    }
    this.bellGlow = Math.max(0, this.bellGlow - 1.2 * safeDt);
  }

  // Main Render Pass: Cyber-Classical Styling
  render(ctx) {
    const w = this.width;
    const h = this.height;

    // Background: Deep Blue Cyber-Classical Space (#000033)
    const bgGradient = ctx.createLinearGradient(0, 0, w, h);
    bgGradient.addColorStop(0, '#000028');
    bgGradient.addColorStop(0.5, '#000033');
    bgGradient.addColorStop(1, '#050a30');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Subtle Architectural Perspective Grid & Colonnade Accent
    this.renderArchitecturalGrid(ctx);

    // Vitruvian Header & Telemetry Header
    this.renderHeaderHUD(ctx);

    // Render Upper Reservoir (Supply Clepsydra)
    this.renderUpperReservoir(ctx);

    // Render Water Stream & Jet Droplets
    this.renderDropletsAndStream(ctx);

    // Render Waterwheel (Impeller)
    this.renderWaterwheel(ctx);

    // Render Lower Reservoir (Inflow Accumulator)
    this.renderLowerReservoir(ctx);

    // Render Intermediate Gear Train (Idler & Reducer)
    this.renderGearTrain(ctx);

    // Render Main Astronomical Dial (Horologium Anaphoricum)
    this.renderAstronomicalDial(ctx);

    // Render Escapement & Bell Chime
    this.renderEscapementAndBell(ctx);

    // Render Interactive Tooltip & Overlay
    this.renderOverlayTelemetry(ctx);
  }

  // Subtle Roman Colonnade & Perspective Blueprint Lines
  renderArchitecturalGrid(ctx) {
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.035)';
    ctx.lineWidth = 1;

    // Vertical Classical Flutes / Columns
    const colStep = Math.max(40, w / 16);
    for (let x = colStep; x < w; x += colStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal Entablature Dividers
    const rowStep = Math.max(30, h / 12);
    for (let y = rowStep; y < h; y += rowStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Classical Arch Outline behind Astronomical Dial
    const dialX = this.gearDial.x;
    const dialY = this.gearDial.y;
    const dialR = this.gearDial.radius * 1.35;

    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR, Math.PI, 0);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.07)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dialX - dialR, dialY);
    ctx.lineTo(dialX - dialR, h);
    ctx.moveTo(dialX + dialR, dialY);
    ctx.lineTo(dialX + dialR, h);
    ctx.stroke();

    ctx.restore();
  }

  // Classical Header HUD
  renderHeaderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    ctx.fillStyle = '#FFD700';
    ctx.font = narrow ? 'bold 12px monospace' : 'bold 15px monospace';
    ctx.fillText(narrow ? 'HOROLOGIUM VITRUVIANUM' : 'HOROLOGIUM VITRUVIANUM // CLEPSYDRA CTESIBII', 16, 24);

    if (!narrow) {
      ctx.fillStyle = '#3bd6c6';
      ctx.font = '11px monospace';
      ctx.fillText('DE ARCHITECTURA LIBER IX — TORRICELLI HYDRO-MECHANICAL ESCAPEMENT', 16, 42);
    }

    // Current Roman Hour Readout
    const normalizedDial = ((this.dialAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const hourIndex = Math.floor((normalizedDial / (Math.PI * 2)) * 12);
    const currentRoman = this.romanHours[hourIndex];
    const minuteFrac = Math.floor(((normalizedDial / (Math.PI * 2)) * 12 - hourIndex) * 60);

    ctx.fillStyle = '#FFD700';
    ctx.font = narrow ? 'bold 11px monospace' : 'bold 13px monospace';
    ctx.textAlign = narrow ? 'left' : 'right';
    if (narrow) {
      ctx.fillText(`HORA: ${currentRoman} +${minuteFrac.toString().padStart(2, '0')}m`, 16, 40);
    } else {
      ctx.fillText(`HORA: ${currentRoman} +${minuteFrac.toString().padStart(2, '0')}m | TICKS: ${this.escapementTicks}`, sw - 24, 24);
      ctx.fillStyle = '#00FFFF';
      ctx.font = '11px monospace';
      ctx.fillText(`HEAD h: ${this.headHeight.toFixed(1)} cm | dV/dt: ${this.flowRate.toFixed(1)} mL/s`, sw - 24, 42);
    }

    ctx.restore();
  }

  // Upper Reservoir (Glass & Bronze Clepsydra)
  renderUpperReservoir(ctx) {
    const x = this.tankX;
    const y = this.tankTopY;
    const w = this.tankWidth;
    const h = this.tankHeight;
    const fillRatio = Math.max(0, Math.min(1, this.upperVolume / this.maxCapacity));
    const waterHeight = h * fillRatio;
    const waterSurfaceY = y + h - waterHeight;

    ctx.save();

    // Classical Bronze Pedestal / Rim
    ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w * 0.5 - 4, y - 6, w + 8, 8);
    ctx.fillRect(x - w * 0.5 - 4, y - 6, w + 8, 8);

    // Semi-Transparent Chamber Body (Opus Vitreum)
    ctx.fillStyle = 'rgba(0, 15, 50, 0.65)';
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - w * 0.5, y, w, h);
    ctx.fill();
    ctx.stroke();

    // Water Volume (Semi-Transparent Glowing Cyan #00FFFF / Deep Blue #000033)
    if (fillRatio > 0.001) {
      const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, y + h);
      waterGrad.addColorStop(0, 'rgba(0, 255, 255, 0.65)');
      waterGrad.addColorStop(0.3, 'rgba(0, 180, 240, 0.45)');
      waterGrad.addColorStop(1, 'rgba(0, 40, 140, 0.7)');

      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y + h);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.lineTo(x + w * 0.5, waterSurfaceY);

      // Surface ripples
      const waveAmp = this.flowRate > 0 ? 1.5 : 0.5;
      for (let rx = x + w * 0.5; rx >= x - w * 0.5; rx -= 10) {
        const sineY = Math.sin((rx - x) * 0.15 + this.timeElapsed * 6) * waveAmp;
        ctx.lineTo(rx, waterSurfaceY + sineY);
      }
      ctx.closePath();
      ctx.fill();

      // Glowing Meniscus Line
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, waterSurfaceY);
      ctx.lineTo(x + w * 0.5, waterSurfaceY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Volume Graduations & Roman Labels (Sextarii / Heminae)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.fillStyle = '#FFD700';
    ctx.font = '9px monospace';
    ctx.lineWidth = 1;
    const numGrads = 5;
    for (let i = 1; i <= numGrads; i++) {
      const gy = y + h - (h / numGrads) * i;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, gy);
      ctx.lineTo(x - w * 0.5 + 8, gy);
      ctx.stroke();
      ctx.fillText(`${(i * 200)}mL`, x - w * 0.5 + 12, gy + 3);
    }

    // Lower Funnel & Drain Orifice
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y + h);
    ctx.lineTo(x - 8, y + h + 10);
    ctx.lineTo(x - 4, this.nozzleY);
    ctx.lineTo(x + 4, this.nozzleY);
    ctx.lineTo(x + 8, y + h + 10);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Needle Valve Handle (Epitonium)
    ctx.save();
    ctx.translate(x + 16, y + h + 6);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-2, -6, 4, 12);
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Vessel Label
    ctx.fillStyle = '#FFD700';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SUPPLY CLEPSYDRA [${this.upperVolume.toFixed(0)} mL]`, x, y - 12);

    ctx.restore();
  }

  // Render Water Stream and Falling Droplets
  renderDropletsAndStream(ctx) {
    ctx.save();

    // Continuous Jet Stream from Nozzle
    if (this.flowRate > 0) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
      ctx.lineWidth = Math.max(2, Math.min(6, this.flowRate * 0.25));
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(this.nozzleX, this.nozzleY);
      ctx.lineTo(this.nozzleX + (Math.random() - 0.5) * 1.5, this.nozzleY + 28);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Individual Falling Droplets
    for (const drop of this.droplets) {
      ctx.fillStyle = '#00FFFF';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();

      // Droplet trailing motion blur tail
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)';
      ctx.lineWidth = drop.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.vx * 0.03, drop.y - drop.vy * 0.03);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Splashes
    for (const sp of this.splashes) {
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  // Waterwheel (Impeller / Rota Aquaria)
  renderWaterwheel(ctx) {
    const w = this.gearWaterwheel;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.angle);

    const r = w.radius;
    const paddles = w.teeth;

    // Wheel Outer Rim
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Cyber-Cyan Glowing Ring
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1.5;
    const numSpokes = 8;
    for (let s = 0; s < numSpokes; s++) {
      const sa = (s / numSpokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * (r * 0.25), Math.sin(sa) * (r * 0.25));
      ctx.lineTo(Math.cos(sa) * r, Math.sin(sa) * r);
      ctx.stroke();
    }

    // Paddles (Buckets / Pinnae)
    for (let i = 0; i < paddles; i++) {
      const a = (i / paddles) * Math.PI * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      const paddleAngle = a + Math.PI * 0.25;

      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(paddleAngle) * 9, py + Math.sin(paddleAngle) * 9);
      ctx.stroke();
    }

    // Central Brass Hub
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000033';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Impeller Title
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ROTA AQUARIA', w.x, w.y + r + 14);
    ctx.restore();
  }

  // Lower Receiving Reservoir (Inflow Accumulator & Cork Float)
  renderLowerReservoir(ctx) {
    const x = this.lowerX;
    const y = this.lowerTopY;
    const w = this.lowerWidth;
    const h = this.lowerHeight;
    const fillRatio = Math.max(0, Math.min(1, this.lowerVolume / this.lowerMaxVolume));
    const waterHeight = (h - 20) * fillRatio;
    const waterSurfaceY = this.lowerBottomY - waterHeight;

    ctx.save();

    // Base Pedestal
    ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w * 0.5 - 6, this.lowerBottomY, w + 12, 10);
    ctx.fillRect(x - w * 0.5 - 6, this.lowerBottomY, w + 12, 10);

    // Graduated Glass Column Body
    ctx.fillStyle = 'rgba(0, 15, 45, 0.6)';
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w * 0.5, y, w, h);
    ctx.fillRect(x - w * 0.5, y, w, h);

    // Accumulated Water Volume
    if (fillRatio > 0.001) {
      const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, this.lowerBottomY);
      waterGrad.addColorStop(0, 'rgba(0, 255, 255, 0.7)');
      waterGrad.addColorStop(0.35, 'rgba(0, 160, 230, 0.55)');
      waterGrad.addColorStop(1, 'rgba(0, 30, 130, 0.8)');

      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, this.lowerBottomY);
      ctx.lineTo(x + w * 0.5, this.lowerBottomY);
      ctx.lineTo(x + w * 0.5, waterSurfaceY);

      // Oscillating surface wave
      for (let rx = x + w * 0.5; rx >= x - w * 0.5; rx -= 8) {
        const sineWave = Math.sin((rx - x) * 0.18 + this.timeElapsed * 4) * 1.0;
        ctx.lineTo(rx, waterSurfaceY + sineWave);
      }
      ctx.closePath();
      ctx.fill();

      // Glowing Meniscus
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, waterSurfaceY);
      ctx.lineTo(x + w * 0.5, waterSurfaceY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Ripple Rings inside Lower Reservoir
    for (const rip of this.lowerSurfaceRipples) {
      ctx.strokeStyle = `rgba(0, 255, 255, ${rip.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(rip.x, waterSurfaceY, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Calibration Marks (12 Roman Unequal Hours Scale)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.fillStyle = '#FFD700';
    ctx.font = '8px monospace';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 12; i++) {
      const gy = this.lowerBottomY - ((h - 20) / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, gy);
      ctx.lineTo(x - w * 0.5 + 6, gy);
      ctx.stroke();
      ctx.fillText(this.romanHours[i % 12], x - w * 0.5 + 9, gy + 3);
    }

    // Cork Float (Phellos) & Vertical Toothed Rack (Regula Dentata)
    const floatWidth = w * 0.72;
    const floatHeight = 12;
    const floatTop = this.floatY - floatHeight * 0.5;

    // Bronze Float Body
    ctx.fillStyle = '#C5A059';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - floatWidth * 0.5, floatTop, floatWidth, floatHeight);
    ctx.strokeRect(x - floatWidth * 0.5, floatTop, floatWidth, floatHeight);

    // Vertical Toothed Rack Rod rising from Float into Pinion
    const rackW = 8;
    const rackTopY = y - 40;
    const rackBottomY = floatTop;

    ctx.fillStyle = '#C5A059';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.fillRect(this.rackX - rackW * 0.5, rackTopY, rackW, rackBottomY - rackTopY);
    ctx.strokeRect(this.rackX - rackW * 0.5, rackTopY, rackW, rackBottomY - rackTopY);

    // Teeth on the right edge of the rack
    ctx.fillStyle = '#FFD700';
    const toothPitch = 6;
    for (let ty = rackTopY; ty < rackBottomY; ty += toothPitch) {
      ctx.fillRect(this.rackX + rackW * 0.5, ty, 4, 3);
    }

    // Rack Pinion Gear
    this.renderInvoluteGear(ctx, this.gearRackPinion.x, this.gearRackPinion.y, this.gearRackPinion.radius, this.gearRackPinion.teeth, this.gearRackPinion.angle, '#FFD700', '#00FFFF');

    // Automatic Inverted Siphon Pipe
    this.renderSiphonPipe(ctx);

    // Inflow Accumulator Label
    ctx.fillStyle = '#FFD700';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`INFLOW ACCUMULATOR [${this.lowerVolume.toFixed(0)} mL]`, x, this.lowerBottomY + 24);

    ctx.restore();
  }

  // Automatic Inverted Siphon Pipe (Sipho Inversus)
  renderSiphonPipe(ctx) {
    const x = this.siphonX;
    const topY = this.siphonTopY;
    const botY = this.siphonBottomY;

    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.siphonActive ? '#00FFFF' : 'rgba(0, 255, 255, 0.35)';

    if (this.siphonActive) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.moveTo(x - 10, botY - 30);
    ctx.lineTo(x + 12, botY - 30);
    ctx.lineTo(x + 12, topY);
    ctx.arc(x + 20, topY, 8, Math.PI, 0);
    ctx.lineTo(x + 28, botY);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Siphon Label
    ctx.fillStyle = this.siphonActive ? '#00FFFF' : 'rgba(212, 175, 55, 0.6)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SIPHO INVERSUS', x + 34, topY + 12);

    ctx.restore();
  }

  // Intermediate Gear Train (Idler and Reducer)
  renderGearTrain(ctx) {
    ctx.save();

    // Mechanical Gear Framework Bracket Lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.gearRackPinion.x, this.gearRackPinion.y);
    ctx.lineTo(this.gearIdler.x, this.gearIdler.y);
    ctx.lineTo(this.gearReducer.x, this.gearReducer.y);
    ctx.lineTo(this.gearDial.x, this.gearDial.y);
    ctx.stroke();

    // Render Idler Gear
    this.renderInvoluteGear(ctx, this.gearIdler.x, this.gearIdler.y, this.gearIdler.radius, this.gearIdler.teeth, this.gearIdler.angle, '#FFD700', 'rgba(0, 255, 255, 0.6)');

    // Render Reducer Gear
    this.renderInvoluteGear(ctx, this.gearReducer.x, this.gearReducer.y, this.gearReducer.radius, this.gearReducer.teeth, this.gearReducer.angle, '#E6C229', 'rgba(0, 255, 255, 0.6)');

    ctx.restore();
  }

  // High-Precision Involute Cogwheel Drawing Helper
  renderInvoluteGear(ctx, cx, cy, radius, teeth, angle, colorGold = '#FFD700', colorCyan = '#00FFFF') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const toothHeight = radius * 0.18;
    const rootR = radius - toothHeight * 0.5;
    const tipR = radius + toothHeight * 0.5;
    const numSegments = teeth * 2;

    // Gear Outline with Teeth
    ctx.beginPath();
    for (let i = 0; i < numSegments; i++) {
      const a = (i / numSegments) * Math.PI * 2;
      const isTip = (i % 2 === 0);
      const r = isTip ? tipR : rootR;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = 'rgba(12, 18, 38, 0.9)';
    ctx.fill();
    ctx.strokeStyle = colorGold;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Inner Concentric Cyber Rim
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = colorCyan;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Wheel Spokes
    const numSpokes = Math.min(6, Math.max(3, Math.floor(teeth / 3)));
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < numSpokes; s++) {
      const sa = (s / numSpokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * (radius * 0.22), Math.sin(sa) * (radius * 0.22));
      ctx.lineTo(Math.cos(sa) * (radius * 0.7), Math.sin(sa) * (radius * 0.7));
      ctx.stroke();
    }

    // Center Axle Hub
    ctx.fillStyle = colorGold;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000033';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Astronomical Bronze Dial (Horologium Anaphoricum)
  renderAstronomicalDial(ctx) {
    const cx = this.gearDial.x;
    const cy = this.gearDial.y;
    const r = this.gearDial.radius;
    const angle = this.gearDial.angle;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Outer Involute Gear Ring (60 Bronze Teeth)
    this.renderInvoluteGear(ctx, 0, 0, r, this.gearDial.teeth, angle, '#FFD700', 'rgba(0, 255, 255, 0.4)');

    // 2. Fixed Outer Bezel with Roman Numeral Hours (I to XII)
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 12, 30, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Minute Graduation Ticks (60 minute divisions)
    for (let m = 0; m < 60; m++) {
      const ma = (m / 60) * Math.PI * 2 - Math.PI * 0.5;
      const isMajor = (m % 5 === 0);
      const tickLen = isMajor ? 8 : 4;
      ctx.strokeStyle = isMajor ? '#FFD700' : 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ma) * (r * 0.86), Math.sin(ma) * (r * 0.86));
      ctx.lineTo(Math.cos(ma) * (r * 0.86 - tickLen), Math.sin(ma) * (r * 0.86 - tickLen));
      ctx.stroke();
    }

    // 4. Roman Numeral Hour Markers
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.max(10, Math.floor(r * 0.09))}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let h = 0; h < 12; h++) {
      const ha = (h / 12) * Math.PI * 2 - Math.PI * 0.5;
      const hx = Math.cos(ha) * (r * 0.74);
      const hy = Math.sin(ha) * (r * 0.74);
      ctx.fillText(this.romanHours[h], hx, hy);
    }

    // 5. Rotating Inner Celestial Sky Disc (Zodiac & Constellations)
    ctx.save();
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    const celestialGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.62);
    celestialGrad.addColorStop(0, '#000030');
    celestialGrad.addColorStop(0.8, '#001045');
    celestialGrad.addColorStop(1, '#002560');
    ctx.fillStyle = celestialGrad;
    ctx.fill();
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Zodiac Ring Symbols (♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓)
    ctx.fillStyle = '#00FFFF';
    ctx.font = `${Math.max(10, Math.floor(r * 0.08))}px serif`;
    for (let z = 0; z < 12; z++) {
      const za = (z / 12) * Math.PI * 2;
      const zx = Math.cos(za) * (r * 0.50);
      const zy = Math.sin(za) * (r * 0.50);
      ctx.fillText(this.zodiacSymbols[z], zx, zy);
    }

    // Constellation coordinate reticle crosshairs
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(r * 0.4, 0);
    ctx.moveTo(0, -r * 0.4);
    ctx.lineTo(0, r * 0.4);
    ctx.stroke();

    // Solar Indicator Disc (Index Solis)
    const sunDist = r * 0.48;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sunDist, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sunburst rays
    for (let ray = 0; ray < 8; ray++) {
      const raya = (ray / 8) * Math.PI * 2;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sunDist + Math.cos(raya) * 7, Math.sin(raya) * 7);
      ctx.lineTo(sunDist + Math.cos(raya) * 11, Math.sin(raya) * 11);
      ctx.stroke();
    }

    ctx.restore(); // end rotating inner disc

    // 6. Center Hour Pointer Hand (Fixed to gear rotation angle or showing current hour)
    ctx.save();
    ctx.rotate(angle - Math.PI * 0.5);

    // Classical Winged Pointer / Stylus
    ctx.strokeStyle = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.70, 0);
    ctx.stroke();

    // Pointer Spear Tip
    ctx.beginPath();
    ctx.moveTo(r * 0.70, 0);
    ctx.lineTo(r * 0.64, -6);
    ctx.lineTo(r * 0.76, 0);
    ctx.lineTo(r * 0.64, 6);
    ctx.closePath();
    ctx.fill();

    // Counterweight
    ctx.beginPath();
    ctx.arc(-14, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Center Boss / Axle Rivet
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Dial Title
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOROLOGIUM ANAPHORICUM', cx, cy + r + 24);
    ctx.restore();
  }

  // Escapement Ratchet Wheel & Tintinnabulum Chime Bell
  renderEscapementAndBell(ctx) {
    const e = this.gearEscapement;
    ctx.save();

    // Escapement Gear
    this.renderInvoluteGear(ctx, e.x, e.y, e.radius, e.teeth, e.angle, '#FFD700', '#00FFFF');

    // Escapement Verge / Anchor Pallet
    ctx.save();
    ctx.translate(e.x, e.y - e.radius - 6);
    const anchorTilt = Math.sin(this.timeElapsed * 14) * 0.18;
    ctx.rotate(anchorTilt);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.lineTo(0, -6);
    ctx.lineTo(16, -2);
    ctx.stroke();
    ctx.restore();

    // Tintinnabulum (Bronze Bell)
    const bx = this.bellX;
    const by = this.bellY;
    const br = this.bellRadius;

    ctx.save();
    ctx.translate(bx, by);

    if (this.bellGlow > 0.01) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20 * this.bellGlow;
    }

    // Bell Dome & Lip
    ctx.fillStyle = '#C5A059';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-br, 10);
    ctx.quadraticCurveTo(-br * 0.8, -br, 0, -br);
    ctx.quadraticCurveTo(br * 0.8, -br, br, 10);
    ctx.quadraticCurveTo(0, 16, -br, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Striking Hammer (Malleus)
    ctx.save();
    ctx.rotate(-this.bellStrikerAngle);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(br + 6, 4);
    ctx.lineTo(br + 22, -10);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(br + 22, -10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Bell Label
    ctx.fillStyle = '#FFD700';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TINTINNABULUM', bx, by + br + 16);

    ctx.restore();
  }

  // Interactive Cursor Tooltip & Overlay
  renderOverlayTelemetry(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;

    // Bottom Navigation & Interaction Key Hints
    ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[DRAG DIAL] Rotate | [CLICK VALVE] Drain | [SPACE] Chime | [R] Reset', sw * 0.5, sh - 14);

    // Hovered Item Highlight
    if (this.hoveredItem) {
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`TARGET: ${this.hoveredItem}`, (this.mousePos.x / ui) + 12, (this.mousePos.y / ui) - 12);
    }

    ctx.restore();
  }

  // Mouse Down Event
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = pos;
    this.initAudio();

    // 1. Check if clicked near Main Astronomical Dial (Initiate Drag / Winding)
    const distDial = Math.hypot(pos.x - this.gearDial.x, pos.y - this.gearDial.y);
    if (distDial < this.gearDial.radius + 15) {
      this.isDraggingDial = true;
      this.dialDragStartAngle = Math.atan2(pos.y - this.gearDial.y, pos.x - this.gearDial.x);
      this.dialBaseAngle = this.dialAngle;
      return;
    }

    // 2. Check if clicked near Bell Chime (Strike Bell)
    const distBell = Math.hypot(pos.x - this.bellX, pos.y - this.bellY);
    if (distBell < this.bellRadius + 15) {
      this.triggerBellStrike();
      return;
    }

    // 3. Check if clicked near Needle Valve (Adjust Orifice)
    const distValve = Math.hypot(pos.x - (this.tankX + 16), pos.y - (this.tankBottomY + 6));
    if (distValve < 22) {
      this.orificeAperture = this.orificeAperture > 0.1 ? 0.0 : 1.0;
      this.triggerSplash(this.nozzleX, this.nozzleY, 4, '#FFD700');
      this.playTickSound();
      return;
    }

    // 4. Click inside Upper Reservoir to create fluid ripples
    if (pos.x >= this.tankX - this.tankWidth * 0.5 && pos.x <= this.tankX + this.tankWidth * 0.5 &&
        pos.y >= this.tankTopY && pos.y <= this.tankBottomY) {
      this.triggerSplash(pos.x, pos.y, 6, '#00FFFF');
      this.playDripSound();
      return;
    }

    // 5. Click inside Lower Reservoir to agitate float
    if (pos.x >= this.lowerX - this.lowerWidth * 0.5 && pos.x <= this.lowerX + this.lowerWidth * 0.5 &&
        pos.y >= this.lowerTopY && pos.y <= this.lowerBottomY) {
      this.floatVelocity += -45;
      this.triggerSplash(pos.x, pos.y, 5, '#00FFFF');
      this.playDripSound();
      return;
    }
  }

  // Mouse Move Event
  onMouseMove(pos) {
    this.mousePos = pos;

    if (this.isDraggingDial) {
      const currentAngle = Math.atan2(pos.y - this.gearDial.y, pos.x - this.gearDial.x);
      const delta = currentAngle - this.dialDragStartAngle;
      this.dialAngle = this.dialBaseAngle + delta;
      this.dialAngularVel = delta * 15;
      return;
    }

    // Component Hover Detection for Tooltips
    const distDial = Math.hypot(pos.x - this.gearDial.x, pos.y - this.gearDial.y);
    const distBell = Math.hypot(pos.x - this.bellX, pos.y - this.bellY);
    const distValve = Math.hypot(pos.x - (this.tankX + 16), pos.y - (this.tankBottomY + 6));

    if (distDial < this.gearDial.radius) {
      this.hoveredItem = 'HOROLOGIUM ANAPHORICUM (CELESTIAL DIAL)';
    } else if (distBell < this.bellRadius + 10) {
      this.hoveredItem = 'TINTINNABULUM (BRONZE CHIME BELL)';
    } else if (distValve < 20) {
      this.hoveredItem = 'EPITONIUM (NEEDLE VALVE)';
    } else if (pos.x >= this.lowerX - this.lowerWidth * 0.5 && pos.x <= this.lowerX + this.lowerWidth * 0.5 &&
               pos.y >= this.lowerTopY && pos.y <= this.lowerBottomY) {
      this.hoveredItem = 'PHELLOS & SIPHO (CORK FLOAT & SIPHON)';
    } else if (pos.x >= this.tankX - this.tankWidth * 0.5 && pos.x <= this.tankX + this.tankWidth * 0.5 &&
               pos.y >= this.tankTopY && pos.y <= this.tankBottomY) {
      this.hoveredItem = 'SUPPLY CLEPSYDRA (TORRICELLI HEAD)';
    } else {
      this.hoveredItem = null;
    }
  }

  // Mouse Up Event
  onMouseUp(pos) {
    this.isMouseDown = false;
    this.isDraggingDial = false;
  }

  // Keyboard Event Handlers
  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.triggerBellStrike();
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === 'f' || key === 'F') {
      this.upperVolume = this.initialVolume;
      this.triggerSplash(this.tankX, this.tankTopY + 20, 8, '#00FFFF');
    } else if (key === 'm' || key === 'M') {
      this.soundEnabled = !this.soundEnabled;
    }
  }

  onKeyUp(key, e) {
    // Guard handler
  }
}
