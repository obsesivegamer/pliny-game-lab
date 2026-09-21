// Scorpio: Precision Roman Torsion Bolt Launcher (Sniper Catapulta)
// Grounded in Vitruvius (De Architectura Book X) and Pliny the Elder (Naturalis Historia)
// Zero external dependencies — pure ES module

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class ScorpioEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Screen Scaling
    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    attachTouchBridge(this, canvas);

    // -------------------------------------------------------------------------
    // Ballistics & Simulation Parameters (Vitruvian Torsion Mechanics)
    // -------------------------------------------------------------------------
    this.targetDistance = 150; // Primary target range: 50m to 400m
    this.windage = 12;         // Crosswind lateral velocity: -50 m/s to +50 m/s
    this.torsionPower = 2400;   // Torsion sinew spring power: 500 N to 3500 N
    this.boltMass = 0.38;       // Roman forged iron bodkin bolt mass (kg)
    this.dragCoeff = 0.28;      // Aerodynamic drag coefficient for ash quarrel
    this.frontalArea = 0.0008;  // Cross-sectional frontal area (m^2)
    this.airDensity = 1.225;    // Ambient air density (kg/m^3)
    this.gravity = 9.81;        // Earth gravity (m/s^2)

    // Torsion Winch State (Cranking & Cocking)
    this.winchState = 1.0;      // 0.0 (slack/unwound) to 1.0 (fully cocked)
    this.boltLoaded = true;     // Whether a bolt is seated in the bronze track
    this.crankAngle = 0;        // Winch handle rotation angle (rad)
    this.winchCrankSpeed = 0;   // Visual crank spin rate

    // Sight & Aiming Coordinates
    this.aimX = 0;              // Horizontal traverse aim offset (pixels)
    this.aimY = -12;            // Vertical elevation aim offset (pixels)
    this.targetAimX = 0;
    this.targetAimY = -12;
    this.isDraggingAim = false;
    this.lastMouse = { x: 0, y: 0 };
    this.zoom = 1.0;            // Sniper sight magnification (1.0x to 2.2x)
    this.targetZoom = 1.0;

    // Scorpio Frame Dynamics & Recoil
    this.recoil = 0;            // Backward kick displacement (px)
    this.recoilVel = 0;         // Recoil recovery velocity
    this.swayTimer = 0;         // Breathing / atmospheric sight sway timer
    this.stringVibration = 0;   // Bowstring post-shot oscillation
    this.armSnap = 0;           // Torsion arm angle deflection (0 to 1)

    // Simulation Entities
    this.bolts = [];            // Active projectiles
    this.targets = [];          // Destructible Roman practice targets
    this.trajectoryPreview = [];// Ballistic prediction dots
    this.debris = [];           // Wood splinters, bronze sparks, dust
    this.hitNotices = [];       // Floating combat telemetry popups

    // Statistics & Performance Telemetry
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.totalScore = 0;
    this.lastHitData = null;

    // Audio Synthesizer (Safe Web Audio API)
    this.audioCtx = null;

    // Initialize UI Controls & Simulation Scene
    this.initControls();
    this.reset();
  }

  // ---------------------------------------------------------------------------
  // Web Audio Synthesizer (Safe, Headless Guarded)
  // ---------------------------------------------------------------------------
  initAudio() {
    if (this.audioCtx || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.audioCtx = new AudioContextClass();
      } catch {
        this.audioCtx = null;
      }
    }
  }

  playSound(type) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    try {
      if (type === 'ratchet') {
        // Metallic pawl clicking into bronze gear tooth
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === 'lock') {
        // Heavy iron trigger sear locking into place
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      } else if (type === 'fire') {
        // Explosive sinew release: low wooden thud + sharp string snap + high whir
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(320, t);
        osc1.frequency.exponentialRampToValueAtTime(45, t + 0.16);
        gain1.gain.setValueAtTime(0.45, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(t);
        osc1.stop(t + 0.18);

        // High frequency string twang
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, t);
        osc2.frequency.exponentialRampToValueAtTime(220, t + 0.22);
        gain2.gain.setValueAtTime(0.25, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(t);
        osc2.stop(t + 0.22);
      } else if (type === 'hit_wood') {
        // Deep oak wood penetration punch + fracture
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.14);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      } else if (type === 'hit_bronze') {
        // Resonant metallic bell clatter
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(960, t);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.45);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      } else if (type === 'hit_ground') {
        // Soft dirt/gravel impact
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      }
    } catch {
      // Audio playback safely ignored if context is unready
    }
  }

  // ---------------------------------------------------------------------------
  // Control Panel UI (Strict Headless Guard)
  // ---------------------------------------------------------------------------
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>🎯 Target Distance</span>
          <span id="scorpio-target-dist-val">${this.targetDistance} m</span>
        </label>
        <input type="range" id="scorpio-target-dist" min="50" max="400" step="10" value="${this.targetDistance}">
      </div>

      <div class="control-group">
        <label>
          <span>💨 Windage Deflection</span>
          <span id="scorpio-windage-val">${this.windage > 0 ? '+' + this.windage : this.windage} m/s</span>
        </label>
        <input type="range" id="scorpio-windage" min="-50" max="50" step="1" value="${this.windage}">
      </div>

      <div class="control-group">
        <label>
          <span>⚙️ Torsion Power</span>
          <span id="scorpio-torsion-val">${this.torsionPower} N</span>
        </label>
        <input type="range" id="scorpio-torsion" min="500" max="3500" step="50" value="${this.torsionPower}">
      </div>

      <div class="control-group" style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
        <button id="scorpio-crank-btn" class="sub-btn" style="border-color: var(--accent-gold, #d4af37); color: #f0e68c; font-weight: bold; padding: 8px;">
          ⚙️ Crank Winch (C)
        </button>
        <button id="scorpio-fire-btn" class="sub-btn" style="background: rgba(200, 50, 50, 0.38); border-color: var(--accent-crimson, #c83232); color: #fff; font-weight: bold; padding: 9px;">
          ⚡ FIRE BOLT (Space)
        </button>
        <button id="scorpio-reset-btn" class="sub-btn" style="border-color: rgba(255,255,255,0.25); padding: 6px; font-size: 0.78rem;">
          🛡️ Rebuild Practice Targets (R)
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.32); border-radius: 6px; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #a0a6b6; line-height: 1.55;">
        <div><strong>Stored Energy:</strong> <span id="scorpio-telemetry-energy">0 J</span></div>
        <div><strong>Muzzle Velocity:</strong> <span id="scorpio-telemetry-vel">0 m/s</span></div>
        <div><strong>Winch Tension:</strong> <span id="scorpio-telemetry-winch">100% (Armed)</span></div>
        <div><strong>Ballistics:</strong> <span id="scorpio-telemetry-drop">0 cm drop</span></div>
      </div>
    `;

    // Target Distance Slider
    const distSlider = this.controlsContainer.querySelector('#scorpio-target-dist');
    const distVal = this.controlsContainer.querySelector('#scorpio-target-dist-val');
    if (distSlider) {
      distSlider.addEventListener('input', (e) => {
        this.targetDistance = parseFloat(e.target.value);
        if (distVal) distVal.textContent = `${this.targetDistance} m`;
        this.updateTargetPositions();
        this.computeTrajectoryPreview();
        this.updateTelemetry();
      });
    }

    // Windage Deflection Slider
    const windSlider = this.controlsContainer.querySelector('#scorpio-windage');
    const windVal = this.controlsContainer.querySelector('#scorpio-windage-val');
    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.windage = parseFloat(e.target.value);
        if (windVal) windVal.textContent = `${this.windage > 0 ? '+' + this.windage : this.windage} m/s`;
        this.computeTrajectoryPreview();
      });
    }

    // Torsion Power Slider
    const torsionSlider = this.controlsContainer.querySelector('#scorpio-torsion');
    const torsionVal = this.controlsContainer.querySelector('#scorpio-torsion-val');
    if (torsionSlider) {
      torsionSlider.addEventListener('input', (e) => {
        this.torsionPower = parseFloat(e.target.value);
        if (torsionVal) torsionVal.textContent = `${this.torsionPower} N`;
        this.computeTrajectoryPreview();
        this.updateTelemetry();
      });
    }

    // Crank Winch Button
    const crankBtn = this.controlsContainer.querySelector('#scorpio-crank-btn');
    if (crankBtn) {
      crankBtn.addEventListener('click', () => {
        this.crankWinch(0.35);
      });
    }

    // Fire Bolt Button
    const fireBtn = this.controlsContainer.querySelector('#scorpio-fire-btn');
    if (fireBtn) {
      fireBtn.addEventListener('click', () => {
        this.fire();
      });
    }

    // Rebuild Targets Button
    const resetBtn = this.controlsContainer.querySelector('#scorpio-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetTargets();
      });
    }

    this.updateTelemetry();
  }

  updateTelemetry() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const energyEl = this.controlsContainer.querySelector('#scorpio-telemetry-energy');
    const velEl = this.controlsContainer.querySelector('#scorpio-telemetry-vel');
    const winchEl = this.controlsContainer.querySelector('#scorpio-telemetry-winch');
    const dropEl = this.controlsContainer.querySelector('#scorpio-telemetry-drop');
    const crankBtn = this.controlsContainer.querySelector('#scorpio-crank-btn');
    const fireBtn = this.controlsContainer.querySelector('#scorpio-fire-btn');

    const drawStroke = 0.82; // meters draw length
    const storedJoules = Math.round(this.torsionPower * drawStroke * this.winchState * 0.92);
    const eff = 0.84;
    const muzzleVel = Math.round(Math.sqrt((2 * eff * Math.max(10, storedJoules)) / this.boltMass));
    const flightTime = this.targetDistance / Math.max(20, muzzleVel);
    const dropMeters = 0.5 * this.gravity * flightTime * flightTime;

    if (energyEl) energyEl.textContent = `${storedJoules} J`;
    if (velEl) velEl.textContent = `${muzzleVel} m/s (${(muzzleVel * 3.6).toFixed(0)} km/h)`;
    if (winchEl) {
      const pct = Math.round(this.winchState * 100);
      winchEl.textContent = this.boltLoaded ? `${pct}% (Armed & Ready)` : `${pct}% (Cranking...)`;
      winchEl.style.color = this.boltLoaded ? '#73d13d' : '#ffa940';
    }
    if (dropEl) {
      dropEl.textContent = `${(dropMeters * 100).toFixed(1)} cm drop @ ${this.targetDistance}m`;
    }

    if (crankBtn) {
      if (this.boltLoaded) {
        crankBtn.textContent = '🔒 Winch Fully Cocked (100%)';
        crankBtn.style.opacity = '0.7';
      } else {
        crankBtn.textContent = `⚙️ Crank Winch (${Math.round(this.winchState * 100)}%)`;
        crankBtn.style.opacity = '1.0';
      }
    }

    if (fireBtn) {
      if (this.boltLoaded) {
        fireBtn.style.filter = 'brightness(1.15)';
        fireBtn.textContent = '⚡ FIRE BOLT (Space)';
      } else {
        fireBtn.style.filter = 'brightness(0.65)';
        fireBtn.textContent = '⚙️ WINCH UNCOCKED';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Target Configuration & Practice Range
  // ---------------------------------------------------------------------------
  resetTargets() {
    this.targets = [
      {
        id: 'target_primary',
        name: 'Centurion Scutum & Oak Post',
        x: 0.0,
        y: 1.45,
        z: this.targetDistance,
        width: 1.1,
        height: 1.5,
        type: 'scutum',
        hp: 100,
        maxHp: 100,
        armorThickness: 38, // mm of seasoned Italian oak
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        active: true,
        punctureHoles: []
      },
      {
        id: 'target_bullseye_near',
        name: 'Campanian Bullseye Board (Near)',
        x: -3.8,
        y: 1.35,
        z: 75,
        width: 1.2,
        height: 1.2,
        type: 'bullseye',
        hp: 80,
        maxHp: 80,
        armorThickness: 25,
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        active: true,
        punctureHoles: []
      },
      {
        id: 'target_dummy_mid',
        name: 'Gallic Helm Training Dummy',
        x: 3.4,
        y: 1.5,
        z: 120,
        width: 0.9,
        height: 1.7,
        type: 'dummy',
        hp: 90,
        maxHp: 90,
        armorThickness: 30,
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        active: true,
        punctureHoles: []
      },
      {
        id: 'target_palisade_far',
        name: 'Fortified Siege Palisade Plank',
        x: -5.2,
        y: 1.6,
        z: 220,
        width: 1.6,
        height: 1.8,
        type: 'palisade',
        hp: 140,
        maxHp: 140,
        armorThickness: 65,
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        active: true,
        punctureHoles: []
      },
      {
        id: 'target_bronze_gong',
        name: 'Gilded Trophy Bell of Mars',
        x: 5.6,
        y: 1.7,
        z: 320,
        width: 1.1,
        height: 1.1,
        type: 'bronze_gong',
        hp: 110,
        maxHp: 110,
        armorThickness: 45,
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        active: true,
        punctureHoles: []
      }
    ];
  }

  updateTargetPositions() {
    const primary = this.targets.find(t => t.id === 'target_primary');
    if (primary) {
      primary.z = this.targetDistance;
    }
  }

  // ---------------------------------------------------------------------------
  // Trajectory Prediction (Analytical & Numerical Pre-calculation)
  // ---------------------------------------------------------------------------
  computeTrajectoryPreview() {
    this.trajectoryPreview = [];

    const drawStroke = 0.82;
    const storedJoules = Math.max(50, this.torsionPower * drawStroke * Math.max(0.2, this.winchState) * 0.92);
    const eff = 0.84;
    const v0 = Math.sqrt((2 * eff * storedJoules) / this.boltMass);

    // Aim angles derived from mouse offsets
    const elevAngle = 0.052 - (this.aimY / (this.height * 0.5)) * 0.18;
    const travAngle = (this.aimX / (this.width * 0.5)) * 0.22;

    let posX = 0;
    let posY = 1.35; // Scorpio launcher muzzle height in meters
    let posZ = 0.5;

    let velX = v0 * Math.sin(travAngle) * Math.cos(elevAngle);
    let velY = v0 * Math.sin(elevAngle);
    let velZ = v0 * Math.cos(travAngle) * Math.cos(elevAngle);

    const dt = 0.022;
    const maxSamples = 45;

    for (let i = 0; i < maxSamples; i++) {
      this.trajectoryPreview.push({ x: posX, y: posY, z: posZ });

      // Relative air velocity accounting for crosswind
      const relVx = velX - this.windage;
      const relVy = velY;
      const relVz = velZ;
      const speed = Math.sqrt(relVx * relVx + relVy * relVy + relVz * relVz);

      const dragForce = 0.5 * this.airDensity * this.dragCoeff * this.frontalArea * speed * speed;
      const ax = -(dragForce / this.boltMass) * (relVx / Math.max(1, speed));
      const ay = -this.gravity - (dragForce / this.boltMass) * (relVy / Math.max(1, speed));
      const az = -(dragForce / this.boltMass) * (relVz / Math.max(1, speed));

      velX += ax * dt;
      velY += ay * dt;
      velZ += az * dt;

      posX += velX * dt;
      posY += velY * dt;
      posZ += velZ * dt;

      if (posY <= 0 || posZ > 450) {
        this.trajectoryPreview.push({ x: posX, y: Math.max(0, posY), z: posZ });
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Firing & Winch Mechanics
  // ---------------------------------------------------------------------------
  crankWinch(delta = 0.35) {
    this.initAudio();
    if (this.boltLoaded) {
      this.playSound('ratchet');
      return;
    }

    this.winchState = Math.min(1.0, this.winchState + delta);
    this.crankAngle += 1.8;
    this.winchCrankSpeed = 12;

    if (this.winchState >= 0.999) {
      this.winchState = 1.0;
      this.boltLoaded = true;
      this.playSound('lock');
    } else {
      this.playSound('ratchet');
    }

    this.computeTrajectoryPreview();
    this.updateTelemetry();
  }

  fire() {
    this.initAudio();

    if (!this.boltLoaded || this.winchState < 0.9) {
      // Auto-assist if uncocked: start cranking
      this.crankWinch(0.4);
      return;
    }

    const drawStroke = 0.82;
    const storedJoules = this.torsionPower * drawStroke * this.winchState * 0.92;
    const eff = 0.84;
    const v0 = Math.sqrt((2 * eff * storedJoules) / this.boltMass);

    // Muzzle launch angles
    const elevAngle = 0.052 - (this.aimY / (this.height * 0.5)) * 0.18;
    const travAngle = (this.aimX / (this.width * 0.5)) * 0.22;

    const velX = v0 * Math.sin(travAngle) * Math.cos(elevAngle);
    const velY = v0 * Math.sin(elevAngle);
    const velZ = v0 * Math.cos(travAngle) * Math.cos(elevAngle);

    const newBolt = {
      x: 0,
      y: 1.35,
      z: 0.8,
      vx: velX,
      vy: velY,
      vz: velZ,
      initialSpeed: v0,
      mass: this.boltMass,
      active: true,
      stuck: false,
      stuckTarget: null,
      stuckOffset: { x: 0, y: 0 },
      trail: [],
      life: 0
    };

    this.bolts.push(newBolt);
    this.shotsFired++;

    // Unload scorpio
    this.boltLoaded = false;
    this.winchState = 0.0;
    this.recoilVel = 28;
    this.recoil = 22;
    this.armSnap = 1.0;
    this.stringVibration = 1.0;

    this.playSound('fire');
    this.computeTrajectoryPreview();
    this.updateTelemetry();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Contract Methods
  // ---------------------------------------------------------------------------
  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    this.computeTrajectoryPreview();
  }

  reset() {
    this.bolts = [];
    this.debris = [];
    this.hitNotices = [];
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.totalScore = 0;
    this.winchState = 1.0;
    this.boltLoaded = true;
    this.recoil = 0;
    this.recoilVel = 0;
    this.aimX = 0;
    this.aimY = -12;
    this.targetAimX = 0;
    this.targetAimY = -12;

    this.resetTargets();
    this.computeTrajectoryPreview();
    this.updateTelemetry();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.bolts = [];
    this.targets = [];
    this.trajectoryPreview = [];
    this.debris = [];
    this.hitNotices = [];

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  getEntityCount() {
    const activeBolts = this.bolts.filter(b => b.active).length;
    const activeTargets = this.targets.filter(t => t.active).length;
    const trajectorySamples = this.trajectoryPreview.length;
    const activeDebris = this.debris.filter(d => d.active).length;
    return activeBolts + activeTargets + trajectorySamples + activeDebris;
  }

  // ---------------------------------------------------------------------------
  // 3D Perspective Projection Engine
  // ---------------------------------------------------------------------------
  project(wx, wy, wz) {
    const depth = Math.max(0.15, wz);
    // Dynamic field of view with zoom
    const fov = (this.height * 0.76) * this.zoom;
    const scale = fov / depth;

    // View center with aiming offset
    const cx = this.width * 0.5 - (this.aimX * 0.15 * this.zoom);
    const cy = this.height * 0.51 - (this.aimY * 0.15 * this.zoom);

    const screenX = cx + wx * scale;
    const screenY = cy - (wy - 1.35) * scale;

    return {
      x: screenX,
      y: screenY,
      scale,
      depth
    };
  }

  // ---------------------------------------------------------------------------
  // Update Loop
  // ---------------------------------------------------------------------------
  update(dt) {
    // Clamp delta time to prevent tunneling
    const timeStep = Math.min(dt, 0.05);

    // Aim smoothing
    this.aimX += (this.targetAimX - this.aimX) * 0.15;
    this.aimY += (this.targetAimY - this.aimY) * 0.15;
    this.zoom += (this.targetZoom - this.zoom) * 0.12;

    // Recoil spring oscillation (F = -kx - cv)
    this.recoilVel += (-this.recoil * 36 - this.recoilVel * 7.5) * timeStep;
    this.recoil += this.recoilVel * timeStep;
    if (this.recoil < 0) this.recoil = 0;

    // Arm snap & string vibration relaxation
    this.armSnap = Math.max(0, this.armSnap - timeStep * 3.2);
    this.stringVibration = Math.max(0, this.stringVibration - timeStep * 4.5);

    // Breathing & natural sight sway
    this.swayTimer += timeStep * 1.6;

    // Winch handle spin damping
    if (this.winchCrankSpeed > 0) {
      this.crankAngle += this.winchCrankSpeed * timeStep;
      this.winchCrankSpeed = Math.max(0, this.winchCrankSpeed - timeStep * 16);
    }

    // Update Targets (Dynamic tilt physics when struck)
    for (let i = 0; i < this.targets.length; i++) {
      const tgt = this.targets[i];
      if (!tgt.active) continue;

      tgt.tiltVelX += (-tgt.tiltX * 24 - tgt.tiltVelX * 5.2) * timeStep;
      tgt.tiltVelY += (-tgt.tiltY * 24 - tgt.tiltVelY * 5.2) * timeStep;
      tgt.tiltX += tgt.tiltVelX * timeStep;
      tgt.tiltY += tgt.tiltVelY * timeStep;
    }

    // Update Active Bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      if (!b.active) continue;

      b.life += timeStep;

      if (!b.stuck) {
        // Aerodynamic forces: Drag & Windage
        const relVx = b.vx - this.windage;
        const relVy = b.vy;
        const relVz = b.vz;
        const speed = Math.sqrt(relVx * relVx + relVy * relVy + relVz * relVz);

        const dragForce = 0.5 * this.airDensity * this.dragCoeff * this.frontalArea * speed * speed;
        const ax = -(dragForce / b.mass) * (relVx / Math.max(1, speed));
        const ay = -this.gravity - (dragForce / b.mass) * (relVy / Math.max(1, speed));
        const az = -(dragForce / b.mass) * (relVz / Math.max(1, speed));

        b.vx += ax * timeStep;
        b.vy += ay * timeStep;
        b.vz += az * timeStep;

        const prevZ = b.z;
        b.x += b.vx * timeStep;
        b.y += b.vy * timeStep;
        b.z += b.vz * timeStep;

        // Record high-speed camera tracer trail
        b.trail.unshift({ x: b.x, y: b.y, z: b.z, speed });
        if (b.trail.length > 24) b.trail.pop();

        // Target Impact Detection
        for (let tIdx = 0; tIdx < this.targets.length; tIdx++) {
          const tgt = this.targets[tIdx];
          if (!tgt.active) continue;

          // Check if bolt passed through target Z plane this frame
          if (prevZ <= tgt.z && b.z >= tgt.z) {
            const hitDx = b.x - tgt.x;
            const hitDy = b.y - tgt.y;

            if (Math.abs(hitDx) <= tgt.width * 0.55 && Math.abs(hitDy) <= tgt.height * 0.55) {
              this.handleTargetHit(b, tgt, hitDx, hitDy, speed);
              break;
            }
          }
        }

        // Ground Impact Detection
        if (b.y <= 0.05 && !b.stuck) {
          b.y = 0.05;
          b.stuck = true;
          b.vx = 0;
          b.vy = 0;
          b.vz = 0;
          this.spawnGroundDust(b.x, b.y, b.z);
          this.playSound('hit_ground');
        }

        // Despawn if out of range
        if (b.z > 500) {
          b.active = false;
        }
      } else {
        // Stuck bolt stays embedded for visual satisfaction
        if (b.life > 14) {
          b.active = false;
        }
      }
    }

    // Update Debris Particles
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const p = this.debris[i];
      p.life -= timeStep;
      if (p.life <= 0) {
        this.debris.splice(i, 1);
        continue;
      }

      p.vy -= this.gravity * 0.8 * timeStep;
      p.x += p.vx * timeStep;
      p.y += p.vy * timeStep;
      p.z += p.vz * timeStep;
      p.rot += p.rotSpeed * timeStep;

      // Bounce on ground
      if (p.y <= 0) {
        p.y = 0;
        p.vy = -p.vy * 0.38;
        p.vx *= Math.pow(0.65, dt * 60);
        p.vz *= Math.pow(0.65, dt * 60);
      }
    }

    // Update Hit Notices
    for (let i = this.hitNotices.length - 1; i >= 0; i--) {
      const hn = this.hitNotices[i];
      hn.life -= timeStep;
      hn.alpha = Math.min(1.0, hn.life / 0.8);
      hn.yOffset += timeStep * 35;
      if (hn.life <= 0) {
        this.hitNotices.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Impact Physics & Kinetic Penetration
  // ---------------------------------------------------------------------------
  handleTargetHit(bolt, tgt, hitDx, hitDy, speed) {
    bolt.stuck = true;
    bolt.stuckTarget = tgt;
    bolt.stuckOffset = { x: hitDx, y: hitDy };
    bolt.vx = 0;
    bolt.vy = 0;
    bolt.vz = 0;

    // Calculate kinetic energy & penetration
    const kineticEnergy = Math.round(0.5 * bolt.mass * speed * speed);
    const penetrationMm = Math.min(140, Math.round((kineticEnergy / (tgt.armorThickness * 14)) * 42));
    const isPenetrated = penetrationMm >= tgt.armorThickness;

    // Target damage & impulse tilt
    const damage = Math.round((kineticEnergy / 15) * (isPenetrated ? 1.4 : 0.8));
    tgt.hp = Math.max(0, tgt.hp - damage);
    tgt.tiltVelX += (hitDy > 0 ? 1 : -1) * 3.8;
    tgt.tiltVelY += (hitDx > 0 ? -1 : 1) * 3.8;

    // Save puncture hole on target
    tgt.punctureHoles.push({
      relX: hitDx,
      relY: hitDy,
      penetrationMm,
      isPuncture: isPenetrated
    });

    this.shotsHit++;
    const bullseyeDist = Math.sqrt(hitDx * hitDx + hitDy * hitDy);
    const isBullseye = bullseyeDist < 0.22;
    const scoreAdd = isBullseye ? 1000 : Math.max(100, Math.round(800 - bullseyeDist * 400));
    this.totalScore += scoreAdd;

    this.lastHitData = {
      target: tgt.name,
      range: tgt.z,
      speed: Math.round(speed),
      energy: kineticEnergy,
      penetration: penetrationMm,
      isBullseye
    };

    // Spawn rich debris & sound
    if (tgt.type === 'bronze_gong') {
      this.playSound('hit_bronze');
      this.spawnBronzeSparks(tgt.x + hitDx, tgt.y + hitDy, tgt.z);
    } else {
      this.playSound('hit_wood');
      this.spawnWoodSplinters(tgt.x + hitDx, tgt.y + hitDy, tgt.z, isPenetrated);
    }

    // Add floating visual combat announcement
    this.hitNotices.push({
      title: isBullseye ? '🏆 OPTIME! BULLSEYE' : (isPenetrated ? '⚡ COMPLETE ARMOR PUNCTURE' : '🎯 DIRECT IMPACT'),
      sub: `${tgt.z}m | ${Math.round(speed)} m/s | ${kineticEnergy} Joules | ${penetrationMm}mm Penetration`,
      score: `+${scoreAdd} PTS`,
      life: 2.2,
      alpha: 1.0,
      yOffset: 0,
      isBullseye
    });
  }

  spawnWoodSplinters(x, y, z, highEnergy) {
    const count = highEnergy ? 32 : 18;
    for (let i = 0; i < count; i++) {
      this.debris.push({
        x: x + (Math.random() - 0.5) * 0.2,
        y: y + (Math.random() - 0.5) * 0.2,
        z: z - Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5 + 1.5,
        vz: -(Math.random() * 7 + 2),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 14,
        size: Math.random() * 0.08 + 0.03,
        type: 'wood',
        life: Math.random() * 1.2 + 0.6,
        maxLife: 1.8,
        active: true
      });
    }
  }

  spawnBronzeSparks(x, y, z) {
    for (let i = 0; i < 28; i++) {
      this.debris.push({
        x,
        y,
        z: z - 0.1,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 7 + 1,
        vz: -(Math.random() * 8 + 3),
        rot: 0,
        rotSpeed: 0,
        size: Math.random() * 0.04 + 0.02,
        type: 'spark',
        life: Math.random() * 0.6 + 0.2,
        maxLife: 0.8,
        active: true
      });
    }
  }

  spawnGroundDust(x, y, z) {
    for (let i = 0; i < 16; i++) {
      this.debris.push({
        x: x + (Math.random() - 0.5) * 0.3,
        y: y + Math.random() * 0.2,
        z: z + (Math.random() - 0.5) * 0.3,
        vx: (Math.random() - 0.5) * 2.5,
        vy: Math.random() * 2 + 0.5,
        vz: (Math.random() - 0.5) * 2.5,
        rot: 0,
        rotSpeed: 0,
        size: Math.random() * 0.12 + 0.05,
        type: 'dust',
        life: Math.random() * 1.0 + 0.4,
        maxLife: 1.4,
        active: true
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Master Render Pass
  // ---------------------------------------------------------------------------
  render(ctx) {
    const c = ctx || this.ctx;
    if (!c) return;

    c.save();

    // 1. Campanian Sky & Distant Apennine Mountains
    this.renderEnvironment(c);

    // 2. Destructible Roman Practice Range & Distance Markers
    this.renderPracticeRange(c);

    // 3. Targets (Sorted by depth)
    this.renderTargets(c);

    // 4. Trajectory Preview Arc (Stadia Dots)
    this.renderTrajectoryPreview(c);

    // 5. Active Precision Bolts & High-Speed Tracer Trails
    this.renderBolts(c);

    // 6. Impact Debris (Wood Splinters, Sparks, Dust)
    this.renderDebris(c);

    // 7. Foreground Roman Scorpio Engine (First-Person Bronze & Oak)
    this.renderScorpioForeground(c);

    // 8. Iron Sight Reticle & Range Stadia
    this.renderReticle(c);

    // 9. Tactical Telemetry & Combat Hit Notices
    this.renderHUD(c);

    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Background & Range Rendering
  // ---------------------------------------------------------------------------
  renderEnvironment(c) {
    const w = this.width;
    const h = this.height;

    // Sky Gradient: Campanian Golden Twilight
    const skyGrad = c.createLinearGradient(0, 0, 0, h * 0.54);
    skyGrad.addColorStop(0, '#1c2b42');
    skyGrad.addColorStop(0.55, '#4a5b6e');
    skyGrad.addColorStop(0.85, '#a47e5b');
    skyGrad.addColorStop(1.0, '#c99a68');
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, w, h * 0.54);

    // Distant Apennine Mountain Ridge
    c.fillStyle = '#3a434c';
    c.beginPath();
    c.moveTo(0, h * 0.52);
    c.lineTo(w * 0.12, h * 0.44);
    c.lineTo(w * 0.28, h * 0.48);
    c.lineTo(w * 0.48, h * 0.42);
    c.lineTo(w * 0.68, h * 0.47);
    c.lineTo(w * 0.85, h * 0.43);
    c.lineTo(w, h * 0.50);
    c.lineTo(w, h * 0.54);
    c.lineTo(0, h * 0.54);
    c.closePath();
    c.fill();

    // Haze Layer
    const haze = c.createLinearGradient(0, h * 0.42, 0, h * 0.54);
    haze.addColorStop(0, 'rgba(201, 154, 104, 0)');
    haze.addColorStop(1, 'rgba(201, 154, 104, 0.45)');
    c.fillStyle = haze;
    c.fillRect(0, h * 0.42, w, h * 0.12);

    // Ground Plane: Sun-baked Gravel & Roman Turf
    const groundGrad = c.createLinearGradient(0, h * 0.52, 0, h);
    groundGrad.addColorStop(0, '#5b4a36');
    groundGrad.addColorStop(0.2, '#483928');
    groundGrad.addColorStop(0.65, '#35291b');
    groundGrad.addColorStop(1, '#20180f');
    c.fillStyle = groundGrad;
    c.fillRect(0, h * 0.52, w, h * 0.48);

    // Perspective Range Distance Lines & Roman Numerals
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(212, 175, 55, 0.22)';
    c.fillStyle = 'rgba(212, 175, 55, 0.55)';
    c.font = '10px var(--font-mono, monospace)';
    c.textAlign = 'center';

    const distMarkers = [
      { z: 50, label: 'L METRA' },
      { z: 100, label: 'C METRA' },
      { z: 150, label: 'CL METRA' },
      { z: 200, label: 'CC METRA' },
      { z: 300, label: 'CCC METRA' },
      { z: 400, label: 'CD METRA' }
    ];

    for (let i = 0; i < distMarkers.length; i++) {
      const dm = distMarkers[i];
      const pLeft = this.project(-12, 0, dm.z);
      const pRight = this.project(12, 0, dm.z);
      const pCenter = this.project(0, 0, dm.z);

      if (pLeft.depth > 0 && pLeft.y > 0 && pLeft.y < h) {
        c.beginPath();
        c.moveTo(pLeft.x, pLeft.y);
        c.lineTo(pRight.x, pRight.y);
        c.stroke();

        // Stone Distance Pillar
        const pillarW = 8 * pCenter.scale * 0.05;
        const pillarH = 24 * pCenter.scale * 0.05;
        c.fillStyle = '#8a7d6b';
        c.fillRect(pCenter.x - pillarW * 0.5, pCenter.y - pillarH, pillarW, pillarH);

        c.fillStyle = 'rgba(240, 230, 200, 0.7)';
        c.fillText(dm.label, pCenter.x, pCenter.y + 12);
      }
    }
  }

  drawRoundRect(c, x, y, w, h, r) {
    if (typeof c.roundRect === 'function') {
      c.roundRect(x, y, w, h, r);
    } else {
      c.rect(x, y, w, h);
    }
  }

  drawEllipse(c, x, y, rx, ry) {
    if (typeof c.ellipse === 'function') {
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    } else {
      c.save();
      c.translate(x, y);
      c.scale(rx, ry);
      c.arc(0, 0, 1, 0, Math.PI * 2);
      c.restore();
    }
  }

  renderPracticeRange(c) {
    // Roman Cavalry Pennant (Wind Direction & Speed Indicator)
    const staffBase = this.project(-8.5, 0, 35);
    const staffTop = this.project(-8.5, 3.8, 35);

    if (staffBase.depth > 0) {
      // Wooden Staff
      c.strokeStyle = '#5a4228';
      c.lineWidth = Math.max(2, 4 * staffBase.scale * 0.06);
      c.beginPath();
      c.moveTo(staffBase.x, staffBase.y);
      c.lineTo(staffTop.x, staffTop.y);
      c.stroke();

      // Bronze Eagle Top Finial
      c.fillStyle = '#d4af37';
      c.beginPath();
      c.arc(staffTop.x, staffTop.y, Math.max(3, 5 * staffBase.scale * 0.06), 0, Math.PI * 2);
      c.fill();

      // Fluttering Red Silk Pennant
      const windLen = (this.windage / 50) * 38 * staffBase.scale * 0.08;
      const ripple = Math.sin(this.swayTimer * 6) * 6;

      c.fillStyle = 'rgba(190, 35, 35, 0.88)';
      c.beginPath();
      c.moveTo(staffTop.x, staffTop.y);
      if (typeof c.quadraticCurveTo === 'function') {
        c.quadraticCurveTo(staffTop.x + windLen * 0.5, staffTop.y + ripple, staffTop.x + windLen, staffTop.y + ripple * 0.5);
      } else {
        c.lineTo(staffTop.x + windLen, staffTop.y + ripple * 0.5);
      }
      c.lineTo(staffTop.x + windLen * 0.85, staffTop.y + 14 * staffBase.scale * 0.06);
      c.lineTo(staffTop.x, staffTop.y + 8 * staffBase.scale * 0.06);
      c.closePath();
      c.fill();
    }
  }

  // ---------------------------------------------------------------------------
  // Target Rendering (Depth Sorted)
  // ---------------------------------------------------------------------------
  renderTargets(c) {
    // Sort targets back to front
    const sorted = [...this.targets].sort((a, b) => b.z - a.z);

    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      if (!t.active) continue;

      const p = this.project(t.x, t.y, t.z);
      if (p.depth <= 0) continue;

      c.save();
      c.translate(p.x, p.y);
      c.rotate(t.tiltX * 0.04);

      const tw = t.width * p.scale;
      const th = t.height * p.scale;

      if (t.type === 'scutum') {
        // Roman Legionary Curved Scutum Shield
        // Wooden frame & red leather surface
        c.fillStyle = '#1c1510';
        c.fillRect(-tw * 0.1, th * 0.45, tw * 0.2, th * 0.55); // Supporting oak stake

        // Shield Body (Curved Rect)
        c.fillStyle = '#8f1d1d';
        c.strokeStyle = '#d4af37';
        c.lineWidth = Math.max(1, 2.5 * p.scale * 0.06);

        c.beginPath();
        this.drawRoundRect(c, -tw * 0.5, -th * 0.5, tw, th, 8 * p.scale * 0.05);
        c.fill();
        c.stroke();

        // Gilded Jupiter Lightning Bolts (Fulmina)
        c.strokeStyle = '#f5d76e';
        c.lineWidth = Math.max(1, 1.8 * p.scale * 0.05);
        c.beginPath();
        c.moveTo(-tw * 0.35, -th * 0.35);
        c.lineTo(-tw * 0.1, -th * 0.1);
        c.lineTo(tw * 0.1, -th * 0.1);
        c.lineTo(tw * 0.35, -th * 0.35);
        c.stroke();

        // Bronze Umbo (Central Boss)
        c.fillStyle = '#d4af37';
        c.beginPath();
        c.arc(0, 0, Math.max(4, tw * 0.18), 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#6e5414';
        c.stroke();
      } else if (t.type === 'bullseye') {
        // Classical Concentric Ring Board
        // Tripod Stand
        c.strokeStyle = '#4a3825';
        c.lineWidth = Math.max(1.5, 3 * p.scale * 0.05);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-tw * 0.5, th * 0.9);
        c.moveTo(0, 0);
        c.lineTo(tw * 0.5, th * 0.9);
        c.moveTo(0, 0);
        c.lineTo(0, th * 0.95);
        c.stroke();

        const radius = tw * 0.5;
        const rings = [
          { r: 1.0, col: '#f5f5f5' },
          { r: 0.8, col: '#1a1a1a' },
          { r: 0.6, col: '#2c82c9' },
          { r: 0.4, col: '#c83232' },
          { r: 0.2, col: '#d4af37' }
        ];

        for (let rIdx = 0; rIdx < rings.length; rIdx++) {
          const ring = rings[rIdx];
          c.fillStyle = ring.col;
          c.beginPath();
          c.arc(0, 0, radius * ring.r, 0, Math.PI * 2);
          c.fill();
        }
      } else if (t.type === 'dummy') {
        // Training Dummy with Bronze Helmet
        c.fillStyle = '#4a3825';
        c.fillRect(-tw * 0.08, 0, tw * 0.16, th * 0.9); // Center post
        c.fillRect(-tw * 0.45, -th * 0.2, tw * 0.9, th * 0.1); // Crossarm

        // Wicker / Straw Body
        c.fillStyle = '#947a4d';
        c.beginPath();
        this.drawEllipse(c, 0, 0, tw * 0.35, th * 0.38);
        c.fill();

        // Bronze Helmet
        c.fillStyle = '#c49a37';
        c.beginPath();
        c.arc(0, -th * 0.42, Math.max(4, tw * 0.22), Math.PI, 0);
        c.fill();
      } else if (t.type === 'palisade') {
        // Heavy Fortified Oak Timber
        c.fillStyle = '#3a2d21';
        c.fillRect(-tw * 0.5, -th * 0.5, tw, th);
        // Iron bands
        c.fillStyle = '#222';
        c.fillRect(-tw * 0.5, -th * 0.3, tw, th * 0.12);
        c.fillRect(-tw * 0.5, th * 0.18, tw, th * 0.12);
      } else if (t.type === 'bronze_gong') {
        // Gilded Trophy Bell
        c.strokeStyle = '#5a4630';
        c.lineWidth = Math.max(2, 4 * p.scale * 0.05);
        c.beginPath();
        c.moveTo(-tw * 0.6, -th * 0.6);
        c.lineTo(tw * 0.6, -th * 0.6);
        c.lineTo(tw * 0.6, th * 0.8);
        c.moveTo(-tw * 0.6, -th * 0.6);
        c.lineTo(-tw * 0.6, th * 0.8);
        c.stroke();

        c.fillStyle = '#d4af37';
        c.beginPath();
        c.arc(0, 0, tw * 0.45, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#fff';
        c.stroke();
      }

      // Render Puncture Holes
      for (let hIdx = 0; hIdx < t.punctureHoles.length; hIdx++) {
        const ph = t.punctureHoles[hIdx];
        const hx = ph.relX * p.scale;
        const hy = -ph.relY * p.scale;

        c.fillStyle = '#111';
        c.beginPath();
        c.arc(hx, hy, Math.max(2, 4 * p.scale * 0.06), 0, Math.PI * 2);
        c.fill();

        if (ph.isPuncture) {
          c.strokeStyle = '#d4af37';
          c.lineWidth = 1;
          c.beginPath();
          c.arc(hx, hy, Math.max(3, 6 * p.scale * 0.06), 0, Math.PI * 2);
          c.stroke();
        }
      }

      // Distance Label above Target
      c.fillStyle = 'rgba(255, 255, 255, 0.75)';
      c.font = '10px var(--font-mono, monospace)';
      c.textAlign = 'center';
      c.fillText(`${Math.round(t.z)}m [HP: ${t.hp}/${t.maxHp}]`, 0, -th * 0.58);

      c.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Trajectory Prediction Arc
  // ---------------------------------------------------------------------------
  renderTrajectoryPreview(c) {
    if (this.trajectoryPreview.length < 2) return;

    c.save();
    for (let i = 0; i < this.trajectoryPreview.length; i++) {
      const pt = this.trajectoryPreview[i];
      const p = this.project(pt.x, pt.y, pt.z);

      if (p.depth > 0 && p.y > 0 && p.y < this.height) {
        const alpha = Math.max(0.12, 1.0 - (pt.z / 450));
        const rad = Math.max(1.2, 3.0 * p.scale * 0.06);

        c.fillStyle = `rgba(245, 215, 110, ${alpha * 0.65})`;
        c.beginPath();
        c.arc(p.x, p.y, rad, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Precision Bolt & High-Speed Tracer Trail Rendering
  // ---------------------------------------------------------------------------
  renderBolts(c) {
    for (let i = 0; i < this.bolts.length; i++) {
      const b = this.bolts[i];
      if (!b.active) continue;

      // Render High-Speed Camera Tracer Trail
      if (b.trail.length >= 2) {
        c.save();
        for (let t = 0; t < b.trail.length - 1; t++) {
          const pt1 = b.trail[t];
          const pt2 = b.trail[t + 1];
          const p1 = this.project(pt1.x, pt1.y, pt1.z);
          const p2 = this.project(pt2.x, pt2.y, pt2.z);

          if (p1.depth > 0 && p2.depth > 0) {
            const trailAlpha = (1.0 - t / b.trail.length) * 0.85;
            const trailWidth = Math.max(1.5, 4.5 * p1.scale * 0.06);

            c.strokeStyle = `rgba(255, 190, 80, ${trailAlpha})`;
            c.lineWidth = trailWidth;
            c.beginPath();
            c.moveTo(p1.x, p1.y);
            c.lineTo(p2.x, p2.y);
            c.stroke();
          }
        }
        c.restore();
      }

      // Render Iron Dart Head & Ash Shaft
      const pBolt = this.project(b.x, b.y, b.z);
      if (pBolt.depth > 0) {
        c.save();
        c.translate(pBolt.x, pBolt.y);

        const bSize = Math.max(3, 14 * pBolt.scale * 0.06);

        // Gleaming forged iron bodkin point
        c.fillStyle = '#f0f0f0';
        c.beginPath();
        c.arc(0, 0, bSize * 0.45, 0, Math.PI * 2);
        c.fill();

        // Copper binding glow
        c.fillStyle = '#ff7a45';
        c.beginPath();
        c.arc(0, 0, bSize * 0.25, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Impact Debris Rendering
  // ---------------------------------------------------------------------------
  renderDebris(c) {
    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i];
      const p = this.project(d.x, d.y, d.z);
      if (p.depth <= 0) continue;

      c.save();
      c.translate(p.x, p.y);
      c.rotate(d.rot);

      const alpha = Math.max(0, d.life / d.maxLife);
      const sz = Math.max(1.5, d.size * p.scale);

      if (d.type === 'wood') {
        c.fillStyle = `rgba(180, 130, 80, ${alpha})`;
        c.fillRect(-sz * 0.5, -sz * 1.5, sz, sz * 3);
      } else if (d.type === 'spark') {
        c.fillStyle = `rgba(255, 220, 120, ${alpha})`;
        c.beginPath();
        c.arc(0, 0, sz * 0.8, 0, Math.PI * 2);
        c.fill();
      } else {
        // Dust puff
        c.fillStyle = `rgba(160, 140, 110, ${alpha * 0.35})`;
        c.beginPath();
        c.arc(0, 0, sz * 2.2, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Foreground Scorpio Siege Engine (First Person Perspective)
  // ---------------------------------------------------------------------------
  renderScorpioForeground(c) {
    const w = this.width;
    const h = this.height;

    c.save();

    // Center scorpio on player vantage point with subtle recoil kick
    const scorpioBaseX = w * 0.5 + (this.aimX * 0.08);
    const scorpioBaseY = h + this.recoil;

    // 1. Heavy Roman Oak Stock (Mensa / Slider Bed)
    const stockGrad = c.createLinearGradient(scorpioBaseX - 80, scorpioBaseY - 320, scorpioBaseX + 80, scorpioBaseY);
    stockGrad.addColorStop(0, '#2d1f14');
    stockGrad.addColorStop(0.5, '#4a3320');
    stockGrad.addColorStop(1, '#1b120a');

    c.fillStyle = stockGrad;
    c.beginPath();
    c.moveTo(scorpioBaseX - 45, scorpioBaseY - 260);
    c.lineTo(scorpioBaseX + 45, scorpioBaseY - 260);
    c.lineTo(scorpioBaseX + 110, scorpioBaseY);
    c.lineTo(scorpioBaseX - 110, scorpioBaseY);
    c.closePath();
    c.fill();

    // Polished Bronze Side Reinforcement Plates & Forged Rivets
    c.strokeStyle = '#d4af37';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(scorpioBaseX - 44, scorpioBaseY - 258);
    c.lineTo(scorpioBaseX - 108, scorpioBaseY);
    c.moveTo(scorpioBaseX + 44, scorpioBaseY - 258);
    c.lineTo(scorpioBaseX + 108, scorpioBaseY);
    c.stroke();

    // Central Bronze Slider Channel (Canaliculus)
    const grooveGrad = c.createLinearGradient(scorpioBaseX - 14, 0, scorpioBaseX + 14, 0);
    grooveGrad.addColorStop(0, '#1a140e');
    grooveGrad.addColorStop(0.5, '#0a0805');
    grooveGrad.addColorStop(1, '#1a140e');

    c.fillStyle = grooveGrad;
    c.fillRect(scorpioBaseX - 12, scorpioBaseY - 260, 24, 260);

    // 2. Transverse Bronze Headframe (Capitulum)
    const capY = scorpioBaseY - 260;
    c.fillStyle = '#b58d3d';
    c.strokeStyle = '#5a4214';
    c.lineWidth = 2;
    c.beginPath();
    this.drawRoundRect(c, scorpioBaseX - 140, capY - 28, 280, 48, 6);
    c.fill();
    c.stroke();

    // Twin Vertical Sinew Torsion Spring Cylinders (Tormenta)
    const springLeftX = scorpioBaseX - 100;
    const springRightX = scorpioBaseX + 100;

    for (const sx of [springLeftX, springRightX]) {
      // Bronze Cylinder Housings
      const cylGrad = c.createLinearGradient(sx - 24, 0, sx + 24, 0);
      cylGrad.addColorStop(0, '#664d1c');
      cylGrad.addColorStop(0.5, '#d4af37');
      cylGrad.addColorStop(1, '#443210');
      c.fillStyle = cylGrad;
      c.fillRect(sx - 22, capY - 55, 44, 105);

      // Top Torsion Tightening Washers (Modioli) & Iron Locking Pins
      c.fillStyle = '#e6c86e';
      c.beginPath();
      c.arc(sx, capY - 55, 18, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }

    // 3. Composite Torsion Arms (Brachia)
    const armAngleLeft = -0.38 + this.winchState * 0.45;
    const armAngleRight = 0.38 - this.winchState * 0.45;
    const armLen = 110;

    // Left Arm
    c.save();
    c.translate(springLeftX, capY);
    c.rotate(armAngleLeft);
    c.fillStyle = '#221910';
    c.fillRect(0, -7, -armLen, 14);
    c.fillStyle = '#d4af37';
    c.beginPath();
    c.arc(-armLen, 0, 7, 0, Math.PI * 2);
    c.fill();
    const tipLeftX = springLeftX + Math.cos(armAngleLeft) * (-armLen);
    const tipLeftY = capY + Math.sin(armAngleLeft) * (-armLen);
    c.restore();

    // Right Arm
    c.save();
    c.translate(springRightX, capY);
    c.rotate(armAngleRight);
    c.fillStyle = '#221910';
    c.fillRect(0, -7, armLen, 14);
    c.fillStyle = '#d4af37';
    c.beginPath();
    c.arc(armLen, 0, 7, 0, Math.PI * 2);
    c.fill();
    const tipRightX = springRightX + Math.cos(armAngleRight) * armLen;
    const tipRightY = capY + Math.sin(armAngleRight) * armLen;
    c.restore();

    // 4. High-Tensile Bowstring (Nervus)
    const nockY = capY + (this.winchState * 190);
    const vib = Math.sin(this.swayTimer * 38) * (this.stringVibration * 12);

    c.strokeStyle = '#d9d0be';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(tipLeftX, tipLeftY);
    c.lineTo(scorpioBaseX + vib, nockY);
    c.lineTo(tipRightX, tipRightY);
    c.stroke();

    // 5. Loaded Bodkin Bolt in Slider (If armed)
    if (this.boltLoaded) {
      const boltTipY = capY - 60;
      const boltTailY = nockY;

      // Ash Wood Shaft
      c.strokeStyle = '#c2a67e';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(scorpioBaseX, boltTailY);
      c.lineTo(scorpioBaseX, boltTipY);
      c.stroke();

      // Forged Diamond Point
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(scorpioBaseX, boltTipY - 14);
      c.lineTo(scorpioBaseX - 6, boltTipY);
      c.lineTo(scorpioBaseX + 6, boltTipY);
      c.closePath();
      c.fill();

      // Red Leather Fletchings
      c.fillStyle = '#c83232';
      c.fillRect(scorpioBaseX - 8, boltTailY - 30, 16, 25);
    }

    // 6. Side Winch Crank Handle (Sucula)
    c.save();
    c.translate(scorpioBaseX + 105, scorpioBaseY - 60);
    c.rotate(this.crankAngle);
    c.strokeStyle = '#d4af37';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(24, 0);
    c.lineTo(24, 28);
    c.stroke();
    c.fillStyle = '#4a3320';
    c.beginPath();
    c.arc(24, 28, 6, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Iron Sight Reticle & Stadia Markings
  // ---------------------------------------------------------------------------
  renderReticle(c) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.51;

    c.save();

    // Roman Combat Aperture Sight Ring
    c.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, 110, 0, Math.PI * 2);
    c.stroke();

    // Central Crosshair Wires
    c.strokeStyle = '#d4af37';
    c.lineWidth = 1.2;

    // Horizontal Wire with Windage Mils Ticks
    c.beginPath();
    c.moveTo(cx - 130, cy);
    c.lineTo(cx + 130, cy);
    c.moveTo(cx, cy - 80);
    c.lineTo(cx, cy + 120);
    c.stroke();

    // Windage Ticks (-40 to +40 mils)
    for (let m = -40; m <= 40; m += 10) {
      if (m === 0) continue;
      const xTick = cx + m * 2.8;
      const tickH = m % 20 === 0 ? 9 : 5;
      c.beginPath();
      c.moveTo(xTick, cy - tickH * 0.5);
      c.lineTo(xTick, cy + tickH * 0.5);
      c.stroke();
    }

    // Elevation Drop Stadia Markings (Calibrated for Roman Quarreling Drop)
    const stadiaDrops = [
      { dist: 50, yOff: 8 },
      { dist: 100, yOff: 22 },
      { dist: 150, yOff: 42 },
      { dist: 200, yOff: 68 },
      { dist: 300, yOff: 98 },
      { dist: 400, yOff: 130 }
    ];

    c.font = '9px var(--font-mono, monospace)';
    c.fillStyle = '#f5d76e';
    c.textAlign = 'left';

    for (let sIdx = 0; sIdx < stadiaDrops.length; sIdx++) {
      const s = stadiaDrops[sIdx];
      const yLine = cy + s.yOff;
      const barW = s.dist % 100 === 0 ? 22 : 14;

      c.beginPath();
      c.moveTo(cx - barW, yLine);
      c.lineTo(cx + barW, yLine);
      c.stroke();

      c.fillText(`${s.dist}m`, cx + barW + 5, yLine + 3);
    }

    // Front Bronze Sight Pin / Chevron
    c.fillStyle = '#ff4d4f';
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx - 4, cy + 7);
    c.lineTo(cx + 4, cy + 7);
    c.closePath();
    c.fill();

    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Tactical HUD & Telemetry Overlays
  // ---------------------------------------------------------------------------
  renderHUD(c) {
    const ui = this.uiScale();
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    c.save();
    c.scale(ui, ui);

    // Top Header Banner
    c.fillStyle = 'rgba(12, 16, 24, 0.75)';
    c.fillRect(0, 0, sw, narrow ? 36 : 28);
    c.fillStyle = '#d4af37';
    c.font = `bold ${narrow ? 10 : 11}px var(--font-mono, monospace)`;
    c.textAlign = 'left';
    c.fillText(narrow ? '🏹 SCORPIO' : '🏹 PLINY GAME LAB — SCORPIO (TORSION SNIPER DART)', 12, narrow ? 15 : 18);

    c.textAlign = narrow ? 'left' : 'right';
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100;
    if (narrow) {
      c.fillStyle = '#e8d8b5';
      c.font = '9px var(--font-mono, monospace)';
      c.fillText(`SCORE: ${this.totalScore} | ACC: ${accuracy}% (${this.shotsHit}/${this.shotsFired})`, 12, 28);
    } else {
      c.fillText(`SCORE: ${this.totalScore} | SHOTS: ${this.shotsFired} | HITS: ${this.shotsHit} (${accuracy}%)`, sw - 14, 18);
    }

    // Left Tactical Data Card
    const boxX = 12;
    const boxY = narrow ? 42 : 36;
    const boxW = Math.min(sw - 24, narrow ? 240 : 210);
    const boxH = narrow ? 86 : 115;
    c.fillStyle = 'rgba(12, 16, 24, 0.75)';
    c.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(boxX, boxY, boxW, boxH, 6);
    c.fill();
    c.stroke();

    c.textAlign = 'left';
    c.fillStyle = '#e8d8b5';
    c.font = `${narrow ? 9 : 10}px var(--font-mono, monospace)`;

    const vWindText = this.windage > 0 ? `+${this.windage}m/s` : `${this.windage}m/s`;
    if (narrow) {
      c.fillText(`WIND: ${vWindText} | RANGE: ${this.targetDistance}m`, boxX + 8, boxY + 18);
      c.fillText(`TORSION: ${this.torsionPower}N | ZOOM: ${this.zoom.toFixed(1)}x`, boxX + 8, boxY + 36);
      c.fillText(`STATUS: ${this.boltLoaded ? '⚡ ARMED' : '⚙️ SLACK'}`, boxX + 8, boxY + 54);
    } else {
      const vWindFull = this.windage > 0 ? `+${this.windage} M/S (FAVONIUS/W)` : `${this.windage} M/S (AUSTER/E)`;
      c.fillText(`VENTUS: ${vWindFull}`, boxX + 10, boxY + 20);
      c.fillText(`RANGE:  ${this.targetDistance} METRA`, boxX + 10, boxY + 38);
      c.fillText(`TORSION: ${this.torsionPower} N SINEW`, boxX + 10, boxY + 56);
      c.fillText(`STATUS:  ${this.boltLoaded ? '⚡ ARMED & COCKED' : '⚙️ WINCH SLACK (CRANK)'}`, boxX + 10, boxY + 74);
      c.fillText(`MAGNIF:  ${this.zoom.toFixed(1)}x ZOOM (Z)`, boxX + 10, boxY + 92);
    }

    // Floating Combat Notices (Hits / Bullseyes / Shatters)
    for (let i = 0; i < this.hitNotices.length; i++) {
      const hn = this.hitNotices[i];
      c.save();
      c.translate(sw * 0.5, sh * 0.32 - hn.yOffset);
      c.globalAlpha = hn.alpha;

      c.textAlign = 'center';
      c.fillStyle = hn.isBullseye ? '#ffd700' : '#73d13d';
      c.font = `bold ${narrow ? 14 : 16}px var(--font-mono, monospace)`;
      c.fillText(hn.title, 0, 0);

      c.fillStyle = '#ffffff';
      c.font = `${narrow ? 10 : 12}px var(--font-mono, monospace)`;
      c.fillText(hn.sub, 0, 18);

      c.fillStyle = '#fadb14';
      c.font = `bold ${narrow ? 12 : 14}px var(--font-mono, monospace)`;
      c.fillText(hn.score, 0, 36);

      c.restore();
    }

    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Input Handling Contract (Mouse, Keys, Touch)
  // ---------------------------------------------------------------------------
  onMouseDown(pos) {
    this.initAudio();
    this.isDraggingAim = true;
    this.lastMouse = { x: pos.x, y: pos.y };
  }

  onMouseMove(pos) {
    if (!pos) return;

    if (this.isDraggingAim) {
      const dx = pos.x - this.lastMouse.x;
      const dy = pos.y - this.lastMouse.y;

      this.targetAimX = Math.max(-280, Math.min(280, this.targetAimX + dx));
      this.targetAimY = Math.max(-240, Math.min(180, this.targetAimY + dy));

      this.lastMouse = { x: pos.x, y: pos.y };
      this.computeTrajectoryPreview();
    }
  }

  onMouseUp(pos) {
    this.isDraggingAim = false;
  }

  onKeyDown(key, e) {
    this.initAudio();

    if (key === ' ' || key === 'Enter') {
      if (e && e.preventDefault) e.preventDefault();
      if (this.boltLoaded) {
        this.fire();
      } else {
        this.crankWinch(0.4);
      }
    } else if (key === 'c' || key === 'C') {
      this.crankWinch(0.35);
    } else if (key === 'r' || key === 'R') {
      this.resetTargets();
    } else if (key === 'z' || key === 'Z') {
      this.targetZoom = this.targetZoom > 1.2 ? 1.0 : 2.0;
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.targetAimY = Math.max(-240, this.targetAimY - 8);
      this.computeTrajectoryPreview();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.targetAimY = Math.min(180, this.targetAimY + 8);
      this.computeTrajectoryPreview();
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.targetAimX = Math.max(-280, this.targetAimX - 8);
      this.computeTrajectoryPreview();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.targetAimX = Math.min(280, this.targetAimX + 8);
      this.computeTrajectoryPreview();
    }
  }

  onKeyUp(key, e) {
    // Parity with input contract
  }
}
