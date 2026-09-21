// Siege Tower (Turris Ambulatoria / Helepolis Rampart Assault)
// Physics simulation of a multi-story Roman siege tower, swinging battering ram,
// counterweighted drop drawbridge, defender burning pitch cauldrons, and combustion thermodynamics.
// Pure ES module — zero external dependencies.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class SiegeTowerEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Scale
    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    attachTouchBridge(this, canvas);

    // Audio Synthesizer
    this.audioCtx = null;

    // Simulation Parameters & Controls
    this.advanceSpeed = 22; // px/s commanded forward push speed (-30 to 70)
    this.pitchVolleyRate = 0.55; // Volleys per second (0 to 2)
    this.isBridgeDeployed = false;
    this.isBridgeDropping = false;
    this.isBridgeRaising = false;

    // World Dimensions
    this.groundY = this.height - 90;
    this.wallX = Math.max(this.width * 0.78, 620);
    this.wallWidth = 180;
    this.wallHeight = 330;
    this.wallTopY = this.groundY - this.wallHeight;

    // Tower Structure & Kinematics
    this.towerWidth = 165;
    this.towerHeight = 350;
    this.towerX = 90; // Left edge of tower
    this.towerY = this.groundY - this.towerHeight;
    this.wheelRadius = 24;
    this.wheelAngle = 0;
    this.towerVelocityX = 0;
    this.isDraggingTower = false;
    this.dragOffsetX = 0;

    // Tower Structural Integrity & Health
    this.towerMaxHealth = 1000;
    this.towerHealth = 1000;
    this.wallMaxIntegrity = 1200;
    this.wallIntegrity = 1200;
    this.gateBreached = false;

    // Battering Ram (Aries) Pendulum Physics
    this.ramLength = 80; // Suspension chain length
    this.ramBeamLength = 135; // Total wood trunk length
    this.ramTheta = 0; // Angle from vertical
    this.ramOmega = 0; // Angular velocity (rad/s)
    this.ramDamping = 0.32;
    this.ramMass = 600; // kg equivalent
    this.isDraggingRam = false;
    this.ramDragStartAngle = 0;

    // Counterweighted Assault Drawbridge (Pons Deiectus)
    this.bridgeLength = 145;
    this.bridgeAngle = -1.36; // -78° stowed upright
    this.bridgeTargetAngle = 0;
    this.bridgeAngularVel = 0;
    this.bridgeStowedAngle = -1.36;

    // Entity Collections
    this.frameworkJoints = [];
    this.frameworkBeams = [];
    this.wheels = [];
    this.legionaries = [];
    this.defenders = [];
    this.pitchProjectiles = [];
    this.arrows = [];
    this.fireNodes = [];
    this.particles = [];
    this.debris = [];
    this.waterParticles = [];
    this.smokeParticles = [];

    // Timers and State
    this.pitchTimer = 0;
    this.screenShake = 0;
    this.assaultTriggered = false;
    this.timeElapsed = 0;
    this.lastCreakSound = 0;

    // Build Model & Controls
    this.initControls();
    this.reset();
  }

  // Safe Web Audio Synthesizer
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

  playSound(type, intensity = 1) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    try {
      if (type === 'ram_impact') {
        // Deep resonant timber & stone masonry collision
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(85, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.35);
        gain.gain.setValueAtTime(Math.min(0.8, 0.3 + intensity * 0.4), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      } else if (type === 'bridge_slam') {
        // Heavy oak drawbridge landing on stone parapet
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.4);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      } else if (type === 'pitch_launch') {
        // Boiling pitch projectile whoosh
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.22);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      } else if (type === 'pitch_impact') {
        // Fiery explosive splash
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
      } else if (type === 'douse') {
        // Water splash and steam sizzle
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.35);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      } else if (type === 'creak') {
        // Strained timber rolling groans
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(75, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.15);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      } else if (type === 'horn') {
        // Roman buccina trumpet fanfare
        const freqs = [220, 277, 330, 440];
        freqs.forEach((f, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + idx * 0.12);
          gain.gain.setValueAtTime(0.18, t + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.28);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t + idx * 0.12);
          osc.stop(t + idx * 0.12 + 0.3);
        });
      }
    } catch {
      // Ignore audio synthesis glitches
    }
  }

  // Safe Headless DOM Initialization
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Tower Advance Speed</span>
          <span id="siege-speed-val">${this.advanceSpeed} px/s</span>
        </label>
        <input type="range" id="siege-speed" min="-25" max="60" step="5" value="${this.advanceSpeed}">
      </div>

      <div class="control-group">
        <label>
          <span>Pitch Volley Rate</span>
          <span id="siege-pitch-val">${this.pitchVolleyRate.toFixed(2)} /s</span>
        </label>
        <input type="range" id="siege-pitch" min="0" max="1.6" step="0.1" value="${this.pitchVolleyRate}">
      </div>

      <div class="control-group" style="margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <button id="siege-bridge-btn" class="sub-btn" style="background: rgba(184, 134, 11, 0.25); border-color: var(--accent-gold, #d4af37); color: #fff; font-weight: bold; padding: 8px;">
          🌉 Drop Drawbridge
        </button>
        <button id="siege-ram-btn" class="sub-btn" style="background: rgba(200, 50, 50, 0.25); border-color: var(--accent-crimson, #c83232); color: #fff; font-weight: bold; padding: 8px;">
          🔨 Swing Ram
        </button>
      </div>

      <div class="control-group" style="margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <button id="siege-douse-btn" class="sub-btn" style="background: rgba(45, 120, 200, 0.25); border-color: #38bdf8; color: #fff; padding: 8px;">
          💧 Douse Fires
        </button>
        <button id="siege-reset-btn" class="sub-btn" style="padding: 8px;">
          🔄 Reset Siege
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #a0a6b6; line-height: 1.5;">
        <div><strong>Tower Health:</strong> <span id="telemetry-tower-health">100%</span></div>
        <div><strong>Rampart Gate:</strong> <span id="telemetry-wall-health">100%</span></div>
        <div><strong>Distance to Wall:</strong> <span id="telemetry-distance">0.0 m</span></div>
        <div><strong>Bridge Status:</strong> <span id="telemetry-bridge">Stowed Upright</span></div>
      </div>
    `;

    // Speed Slider
    const speedSlider = this.controlsContainer.querySelector('#siege-speed');
    const speedVal = this.controlsContainer.querySelector('#siege-speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.advanceSpeed = parseFloat(e.target.value);
        if (speedVal) speedVal.textContent = `${this.advanceSpeed} px/s`;
      });
    }

    // Pitch Slider
    const pitchSlider = this.controlsContainer.querySelector('#siege-pitch');
    const pitchVal = this.controlsContainer.querySelector('#siege-pitch-val');
    if (pitchSlider) {
      pitchSlider.addEventListener('input', (e) => {
        this.pitchVolleyRate = parseFloat(e.target.value);
        if (pitchVal) pitchVal.textContent = `${this.pitchVolleyRate.toFixed(2)} /s`;
      });
    }

    // Buttons
    const bridgeBtn = this.controlsContainer.querySelector('#siege-bridge-btn');
    if (bridgeBtn) {
      bridgeBtn.addEventListener('click', () => {
        this.toggleDrawbridge();
      });
    }

    const ramBtn = this.controlsContainer.querySelector('#siege-ram-btn');
    if (ramBtn) {
      ramBtn.addEventListener('click', () => {
        this.swingBatteringRam();
      });
    }

    const douseBtn = this.controlsContainer.querySelector('#siege-douse-btn');
    if (douseBtn) {
      douseBtn.addEventListener('click', () => {
        this.douseFires();
      });
    }

    const resetBtn = this.controlsContainer.querySelector('#siege-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    this.updateTelemetry();
  }

  updateTelemetry() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const towerHealthEl = this.controlsContainer.querySelector('#telemetry-tower-health');
    const wallHealthEl = this.controlsContainer.querySelector('#telemetry-wall-health');
    const distEl = this.controlsContainer.querySelector('#telemetry-distance');
    const bridgeEl = this.controlsContainer.querySelector('#telemetry-bridge');

    const maxDist = this.wallX - (this.towerX + this.towerWidth);
    const distMeters = Math.max(0, (maxDist * 0.18)).toFixed(1);

    if (towerHealthEl) {
      const pct = Math.max(0, Math.round((this.towerHealth / this.towerMaxHealth) * 100));
      towerHealthEl.textContent = `${pct}%`;
      towerHealthEl.style.color = pct > 50 ? '#38bdf8' : (pct > 25 ? '#f59e0b' : '#ef4444');
    }

    if (wallHealthEl) {
      const pct = Math.max(0, Math.round((this.wallIntegrity / this.wallMaxIntegrity) * 100));
      wallHealthEl.textContent = pct <= 0 ? 'BREACHED!' : `${pct}%`;
      wallHealthEl.style.color = pct <= 0 ? '#ef4444' : '#d4af37';
    }

    if (distEl) {
      distEl.textContent = maxDist <= 4 ? 'CONTACT (0.0 m)' : `${distMeters} m`;
    }

    if (bridgeEl) {
      if (this.isBridgeDeployed) {
        bridgeEl.textContent = 'DEPLOYED (Assault Ramp)';
        bridgeEl.style.color = '#34d399';
      } else if (this.isBridgeDropping) {
        bridgeEl.textContent = 'Dropping Ramp...';
        bridgeEl.style.color = '#f59e0b';
      } else if (this.isBridgeRaising) {
        bridgeEl.textContent = 'Winching Up...';
        bridgeEl.style.color = '#a0aec0';
      } else {
        bridgeEl.textContent = 'Stowed Upright';
        bridgeEl.style.color = '#a0aec0';
      }
    }
  }

  // Setup Tower Structure & Entities
  buildSimulation() {
    this.groundY = this.height - 90;
    this.wallX = Math.max(this.width * 0.78, 620);
    this.wallTopY = this.groundY - this.wallHeight;

    // Build Structural Framework Joints & Beams
    this.frameworkJoints = [];
    this.frameworkBeams = [];
    this.fireNodes = [];

    const levels = 4;
    const cols = 3;
    const deckSpacing = (this.towerHeight - 35) / (levels - 1);
    const colSpacing = this.towerWidth / (cols - 1);

    for (let l = 0; l < levels; l++) {
      for (let c = 0; c < cols; c++) {
        const relX = c * colSpacing;
        const relY = this.towerHeight - 20 - l * deckSpacing;
        const joint = {
          id: `j_${l}_${c}`,
          level: l,
          col: c,
          relX,
          relY,
          x: this.towerX + relX,
          y: this.towerY + relY,
          fireLevel: 0,
          charLevel: 0
        };
        this.frameworkJoints.push(joint);
        this.fireNodes.push(joint);
      }
    }

    // Structural Beams
    for (let l = 0; l < levels; l++) {
      for (let c = 0; c < cols; c++) {
        const idx = l * cols + c;
        // Horizontal floor beam
        if (c < cols - 1) {
          this.frameworkBeams.push({ a: idx, b: idx + 1, type: 'floor' });
        }
        // Vertical post
        if (l < levels - 1) {
          this.frameworkBeams.push({ a: idx, b: idx + cols, type: 'post' });
        }
        // Diagonal cross-brace
        if (l < levels - 1 && c < cols - 1) {
          this.frameworkBeams.push({ a: idx, b: idx + cols + 1, type: 'brace' });
          this.frameworkBeams.push({ a: idx + 1, b: idx + cols, type: 'brace' });
        }
      }
    }

    // 4 Heavy Rolling Timber Wheels with Iron Rims
    this.wheels = [
      { relX: 25, relY: this.towerHeight - 4, radius: this.wheelRadius },
      { relX: 68, relY: this.towerHeight - 4, radius: this.wheelRadius },
      { relX: 110, relY: this.towerHeight - 4, radius: this.wheelRadius },
      { relX: 145, relY: this.towerHeight - 4, radius: this.wheelRadius }
    ];

    // Legionaries in the Tower
    this.legionaries = [
      // Deck 1: Ram Crew (3 soldiers)
      { id: 'ram_1', role: 'ram_crew', deck: 1, relX: 30, relY: this.towerHeight - 38, animOffset: 0 },
      { id: 'ram_2', role: 'ram_crew', deck: 1, relX: 58, relY: this.towerHeight - 38, animOffset: 1.2 },
      { id: 'ram_3', role: 'ram_crew', deck: 1, relX: 86, relY: this.towerHeight - 38, animOffset: 2.4 },

      // Deck 2: Legionary Archers (2 soldiers)
      { id: 'arch_1', role: 'archer', deck: 2, relX: 42, relY: this.towerHeight - 145, shootTimer: 1.2 },
      { id: 'arch_2', role: 'archer', deck: 2, relX: 120, relY: this.towerHeight - 145, shootTimer: 2.4 },

      // Deck 3: Assault Shock Legion (4 soldiers with scuta shields & gladius)
      { id: 'assault_1', role: 'assault', deck: 3, relX: 30, relY: this.towerHeight - 250, charging: false, chargeX: 0 },
      { id: 'assault_2', role: 'assault', deck: 3, relX: 62, relY: this.towerHeight - 250, charging: false, chargeX: 0 },
      { id: 'assault_3', role: 'assault', deck: 3, relX: 95, relY: this.towerHeight - 250, charging: false, chargeX: 0 },
      { id: 'assault_4', role: 'assault', deck: 3, relX: 128, relY: this.towerHeight - 250, charging: false, chargeX: 0 }
    ];

    // Defender Garrison atop Ramparts
    this.defenders = [
      { id: 'def_arch_1', role: 'def_archer', x: this.wallX + 45, y: this.wallTopY - 26, hp: 100, shootTimer: 1.5 },
      { id: 'def_arch_2', role: 'def_archer', x: this.wallX + 110, y: this.wallTopY - 26, hp: 100, shootTimer: 2.8 },
      { id: 'def_pitch', role: 'pitch_master', x: this.wallX + 22, y: this.wallTopY - 26, hp: 100 }
    ];

    this.pitchProjectiles = [];
    this.arrows = [];
    this.particles = [];
    this.debris = [];
    this.waterParticles = [];
    this.smokeParticles = [];
  }

  reset() {
    this.towerX = Math.max(60, this.width * 0.12);
    this.towerVelocityX = 0;
    this.towerHealth = this.towerMaxHealth;
    this.wallIntegrity = this.wallMaxIntegrity;
    this.gateBreached = false;

    this.ramTheta = 0;
    this.ramOmega = 0;

    this.bridgeAngle = this.bridgeStowedAngle;
    this.bridgeAngularVel = 0;
    this.isBridgeDeployed = false;
    this.isBridgeDropping = false;
    this.isBridgeRaising = false;
    this.assaultTriggered = false;

    this.pitchTimer = 0;
    this.screenShake = 0;
    this.timeElapsed = 0;

    this.buildSimulation();
    this.updateTelemetry();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    this.groundY = height - 90;
    this.wallX = Math.max(width * 0.78, 620);
    this.wallTopY = this.groundY - this.wallHeight;

    // Clamp tower position within bounds
    const maxTowerX = this.wallX - this.towerWidth - 8;
    this.towerX = Math.min(Math.max(40, this.towerX), maxTowerX);
    this.towerY = this.groundY - this.towerHeight;

    this.updateJointPositions();
    this.updateTelemetry();
  }

  updateJointPositions() {
    for (let i = 0; i < this.frameworkJoints.length; i++) {
      const j = this.frameworkJoints[i];
      j.x = this.towerX + j.relX;
      j.y = this.towerY + j.relY;
    }
  }

  // Drawbridge Controls
  toggleDrawbridge() {
    this.initAudio();
    if (this.isBridgeDeployed || this.isBridgeDropping) {
      // Retract drawbridge
      this.isBridgeRaising = true;
      this.isBridgeDropping = false;
      this.isBridgeDeployed = false;
    } else {
      // Drop drawbridge
      this.isBridgeDropping = true;
      this.isBridgeRaising = false;
      this.isBridgeDeployed = false;
      this.playSound('creak');
    }
    this.updateTelemetry();
  }

  // Battering Ram Impulse
  swingBatteringRam() {
    this.initAudio();
    // Pull back and launch forward with great momentum
    if (this.ramTheta > -0.15) {
      this.ramOmega -= 3.8; // Backward heave
    } else {
      this.ramOmega += 5.2; // Forward release heave
    }
    this.playSound('creak');
  }

  // Douse Tower Fires with Water & Vinegar Buckets
  douseFires() {
    this.initAudio();
    let extinguishedCount = 0;
    for (let i = 0; i < this.fireNodes.length; i++) {
      const node = this.fireNodes[i];
      if (node.fireLevel > 0.05) {
        node.fireLevel = 0;
        extinguishedCount++;

        // Spawn cool water & steam clouds
        for (let k = 0; k < 12; k++) {
          this.waterParticles.push({
            x: node.x + (Math.random() - 0.5) * 30,
            y: node.y - 20 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 50,
            vy: -40 - Math.random() * 80,
            radius: 2 + Math.random() * 2.5,
            life: 0.8 + Math.random() * 0.4
          });

          this.smokeParticles.push({
            x: node.x + (Math.random() - 0.5) * 25,
            y: node.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 30,
            vy: -30 - Math.random() * 50,
            radius: 8 + Math.random() * 12,
            alpha: 0.8,
            life: 1.2 + Math.random() * 0.6,
            isSteam: true
          });
        }
      }
    }

    if (extinguishedCount > 0) {
      this.playSound('douse');
    }
  }

  // Main Simulation Step
  update(dt) {
    // Clamp delta time to prevent physics explosions
    const clampedDt = Math.min(dt, 0.05);
    this.timeElapsed += clampedDt;

    // Decay Screen Shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - clampedDt * 18);
    }

    // 1. Tower Kinematics & Wheel Rolling
    const maxTowerX = this.wallX - this.towerWidth - 6;
    const minTowerX = 30;

    if (!this.isDraggingTower) {
      // Smoothly accelerate toward commanded speed
      const targetVel = (this.towerX >= maxTowerX && this.advanceSpeed > 0) ? 0 : this.advanceSpeed;
      this.towerVelocityX += (targetVel - this.towerVelocityX) * Math.min(clampedDt * 4, 1);

      const dx = this.towerVelocityX * clampedDt;
      this.towerX += dx;

      // Wheel Angular Rotation
      if (Math.abs(dx) > 0.001) {
        this.wheelAngle += dx / this.wheelRadius;
        this.wheelAngle %= (Math.PI * 2);

        // Occasional rolling timber creak
        if (this.timeElapsed - this.lastCreakSound > 2.8 && Math.abs(this.towerVelocityX) > 10) {
          this.playSound('creak');
          this.lastCreakSound = this.timeElapsed;
        }
      }
    }

    // Wall Collision Clamp
    if (this.towerX > maxTowerX) {
      this.towerX = maxTowerX;
      this.towerVelocityX = 0;
    } else if (this.towerX < minTowerX) {
      this.towerX = minTowerX;
      this.towerVelocityX = 0;
    }

    this.towerY = this.groundY - this.towerHeight;
    this.updateJointPositions();

    // 2. Battering Ram (Aries) Pendulum Dynamics
    const g = 380; // Simulated gravity for pendulum
    const alpha = (-g / this.ramLength) * Math.sin(this.ramTheta) - this.ramDamping * this.ramOmega;
    this.ramOmega += alpha * clampedDt;
    this.ramTheta += this.ramOmega * clampedDt;

    // Ram Head Collision with Curtain Wall
    const ramPivotX = this.towerX + 70;
    const ramPivotY = this.groundY - 60;
    const ramTipX = ramPivotX + this.ramLength * Math.sin(this.ramTheta) + (this.ramBeamLength * 0.55) * Math.cos(this.ramTheta);

    if (ramTipX >= this.wallX && this.ramOmega > 0) {
      // Strike the stone wall!
      const impactSpeed = this.ramOmega * this.ramLength;
      if (impactSpeed > 15) {
        const damage = Math.round(impactSpeed * 3.8);
        this.wallIntegrity = Math.max(0, this.wallIntegrity - damage);
        this.screenShake = Math.min(10, impactSpeed * 0.18);
        this.playSound('ram_impact', Math.min(1, impactSpeed / 80));

        // Spawn crumbling masonry fragments
        for (let k = 0; k < 18; k++) {
          this.debris.push({
            x: this.wallX + (Math.random() - 0.5) * 15,
            y: ramPivotY + (Math.random() - 0.5) * 30,
            vx: -60 - Math.random() * 120,
            vy: -40 - Math.random() * 140,
            size: 3 + Math.random() * 6,
            rot: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 8,
            color: Math.random() > 0.4 ? '#8a94a6' : '#5a6270',
            life: 1.5 + Math.random() * 0.8
          });
        }

        // Check for Gate Breach
        if (this.wallIntegrity <= 0 && !this.gateBreached) {
          this.gateBreached = true;
          this.playSound('horn');
          this.screenShake = 14;
        }

        this.updateTelemetry();
      }

      // Rebound ram
      this.ramOmega = -this.ramOmega * 0.38;
      this.ramTheta = Math.max(-0.6, this.ramTheta - 0.05);
    }

    // 3. Counterweighted Drawbridge (Pons Deiectus) Deployment Physics
    const hingeX = this.towerX + this.towerWidth;
    const hingeY = this.towerY + (this.towerHeight - 250); // Deck 3 lip

    // Calculate angle to rest on rampart parapet
    const parapetEdgeX = this.wallX;
    const parapetEdgeY = this.wallTopY + 12;
    const dxToWall = parapetEdgeX - hingeX;
    const dyToWall = parapetEdgeY - hingeY;

    let targetRampAngle = Math.atan2(dyToWall, Math.max(10, dxToWall));
    // If tower is far away, bridge falls to resting chain limit
    if (dxToWall > this.bridgeLength - 5) {
      targetRampAngle = 0.22; // 12° decline suspended by safety chains
    }

    if (this.isBridgeDropping) {
      // Counterweights released — gravity pulls bridge down
      const bridgeTorque = 14.5 * Math.cos(this.bridgeAngle);
      this.bridgeAngularVel += bridgeTorque * clampedDt;
      this.bridgeAngle += this.bridgeAngularVel * clampedDt;

      if (this.bridgeAngle >= targetRampAngle) {
        this.bridgeAngle = targetRampAngle;
        this.bridgeAngularVel = 0;
        this.isBridgeDropping = false;
        this.isBridgeDeployed = true;
        this.screenShake = 6;
        this.playSound('bridge_slam');
        this.updateTelemetry();

        // Check if ramp reached the rampart
        if (dxToWall <= this.bridgeLength + 4) {
          this.triggerLegionaryAssault();
        }
      }
    } else if (this.isBridgeRaising) {
      // Winch bridge upright
      this.bridgeAngle -= 2.2 * clampedDt;
      if (this.bridgeAngle <= this.bridgeStowedAngle) {
        this.bridgeAngle = this.bridgeStowedAngle;
        this.isBridgeRaising = false;
        this.isBridgeDeployed = false;
        this.updateTelemetry();
      }
    }

    // 4. Defender Boiling Pitch Projectiles
    if (this.pitchVolleyRate > 0) {
      this.pitchTimer += clampedDt;
      const interval = 1 / Math.max(0.05, this.pitchVolleyRate);
      if (this.pitchTimer >= interval) {
        this.pitchTimer = 0;
        this.launchPitchBomb();
      }
    }

    // Update Pitch Projectiles
    for (let i = this.pitchProjectiles.length - 1; i >= 0; i--) {
      const p = this.pitchProjectiles[i];
      p.vx += p.ax * clampedDt;
      p.vy += (240) * clampedDt; // Gravity
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.life -= clampedDt;

      // Trailing Fire & Embers
      if (Math.random() > 0.25) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 8,
          y: p.y + (Math.random() - 0.5) * 8,
          vx: -p.vx * 0.15 + (Math.random() - 0.5) * 30,
          vy: -p.vy * 0.15 - Math.random() * 30,
          radius: 2.5 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#ff4d00' : '#ff9900',
          life: 0.45 + Math.random() * 0.3
        });
      }

      // Check Tower Collision
      if (
        p.x >= this.towerX &&
        p.x <= this.towerX + this.towerWidth &&
        p.y >= this.towerY &&
        p.y <= this.groundY
      ) {
        // Impact with siege tower timber!
        this.igniteNearestJoint(p.x, p.y);
        this.playSound('pitch_impact');
        this.screenShake = 3;

        // Fiery blast splash
        for (let k = 0; k < 20; k++) {
          this.particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 140,
            vy: -40 - Math.random() * 120,
            radius: 2 + Math.random() * 4,
            color: Math.random() > 0.4 ? '#ff3b00' : '#ffaa00',
            life: 0.6 + Math.random() * 0.5
          });
        }

        this.pitchProjectiles.splice(i, 1);
        continue;
      }

      // Ground Collision
      if (p.y >= this.groundY) {
        this.pitchProjectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0 || p.x < 0) {
        this.pitchProjectiles.splice(i, 1);
      }
    }

    // 5. Fire Combustion & Thermal Spread Model
    let activeFires = 0;
    for (let i = 0; i < this.fireNodes.length; i++) {
      const node = this.fireNodes[i];
      if (node.fireLevel > 0.05) {
        activeFires++;
        // Damage tower
        this.towerHealth = Math.max(0, this.towerHealth - node.fireLevel * clampedDt * 6);
        node.charLevel = Math.min(1, node.charLevel + clampedDt * 0.12);

        // Fire particle emission
        if (Math.random() < node.fireLevel * 0.8) {
          this.particles.push({
            x: node.x + (Math.random() - 0.5) * 20,
            y: node.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 25,
            vy: -40 - Math.random() * 70,
            radius: 2.5 + Math.random() * 4.5,
            color: Math.random() > 0.5 ? '#ff2a00' : '#ff8800',
            life: 0.5 + Math.random() * 0.4
          });

          this.smokeParticles.push({
            x: node.x + (Math.random() - 0.5) * 15,
            y: node.y - 15,
            vx: 15 + (Math.random() - 0.5) * 20, // Drift in wind
            vy: -35 - Math.random() * 40,
            radius: 6 + Math.random() * 10,
            alpha: 0.65,
            life: 1.4 + Math.random() * 0.8,
            isSteam: false
          });
        }

        // Fire Spread to adjacent nodes
        if (node.fireLevel > 0.6 && Math.random() < 0.008) {
          const neighborIdx = Math.floor(Math.random() * this.fireNodes.length);
          const neighbor = this.fireNodes[neighborIdx];
          const dist = Math.hypot(neighbor.x - node.x, neighbor.y - node.y);
          if (dist < 80 && neighbor.fireLevel < 0.3) {
            neighbor.fireLevel = 0.35;
          }
        }
      }
    }

    if (activeFires > 0 && Math.random() < 0.05) {
      this.updateTelemetry();
    }

    // 6. Legionary Assault Sprint Dynamics
    for (let i = 0; i < this.legionaries.length; i++) {
      const sol = this.legionaries[i];
      if (sol.role === 'assault' && sol.charging) {
        sol.chargeProgress = Math.min(1.4, (sol.chargeProgress || 0) + clampedDt * 0.65);
      }
    }

    // 7. Update Particles, Debris, Smoke & Water
    this.updateParticles(clampedDt);
  }

  triggerLegionaryAssault() {
    if (this.assaultTriggered) return;
    this.assaultTriggered = true;
    this.playSound('horn');

    for (let i = 0; i < this.legionaries.length; i++) {
      const sol = this.legionaries[i];
      if (sol.role === 'assault') {
        sol.charging = true;
        sol.chargeProgress = 0;
      }
    }
  }

  launchPitchBomb() {
    this.initAudio();
    const cauldronX = this.wallX + 24;
    const cauldronY = this.wallTopY - 18;

    // Parabolic trajectory aimed toward the mid-to-upper decks of the tower
    const targetX = this.towerX + this.towerWidth * 0.5;
    const targetY = this.towerY + this.towerHeight * 0.45;

    const dx = targetX - cauldronX;
    const dy = targetY - cauldronY;
    const speedX = -130 - Math.random() * 60;
    const timeToHit = Math.abs(dx / speedX);
    const speedY = (dy - 0.5 * 240 * timeToHit * timeToHit) / timeToHit;

    this.pitchProjectiles.push({
      active: true,
      x: cauldronX,
      y: cauldronY,
      vx: speedX,
      vy: speedY,
      ax: 0,
      radius: 6.5,
      life: 5.0
    });

    this.playSound('pitch_launch');
  }

  igniteNearestJoint(x, y) {
    let closestNode = null;
    let minDist = 99999;
    for (let i = 0; i < this.fireNodes.length; i++) {
      const node = this.fireNodes[i];
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    }

    if (closestNode) {
      closestNode.fireLevel = Math.min(1.0, closestNode.fireLevel + 0.55);
    }
  }

  updateParticles(dt) {
    // Standard Flame/Ember Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Smoke & Steam Billows
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const s = this.smokeParticles[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.radius += dt * 8;
      s.life -= dt;
      s.alpha = Math.max(0, s.life * 0.5);
      if (s.life <= 0) {
        this.smokeParticles.splice(i, 1);
      }
    }

    // Water Splash Droplets
    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const w = this.waterParticles[i];
      w.vy += 320 * dt; // Gravity
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.life -= dt;
      if (w.life <= 0 || w.y >= this.groundY) {
        this.waterParticles.splice(i, 1);
      }
    }

    // Stone Masonry Debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.vy += 420 * dt; // Gravity
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vRot * dt;
      d.life -= dt;

      if (d.y >= this.groundY) {
        d.y = this.groundY;
        d.vx *= 0.6;
        d.vy = -d.vy * 0.35;
        if (Math.abs(d.vy) < 25) d.vy = 0;
      }

      if (d.life <= 0) {
        this.debris.splice(i, 1);
      }
    }
  }

  // Pure Canvas 2D Rendering
  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    ctx.save();

    // Screen Shake Translation
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 1.5;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 1.5;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky & Atmospheric Twilight Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#151322'); // Deep Roman twilight navy
    skyGrad.addColorStop(0.5, '#2e192a'); // Fiery purple-maroon siege dusk
    skyGrad.addColorStop(1, '#502319'); // Glowing ember horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Distant Siege Camp & Mountains
    this.renderDistantScenery(ctx);

    // 2. Earthworks (Agger) & Battlefield Terrain
    this.renderGround(ctx);

    // 3. Stone Curtain Wall & Bastion Ramparts
    this.renderCurtainWall(ctx);

    // 4. The Siege Tower (Helepolis Cutaway)
    this.renderSiegeTower(ctx);

    // 5. Active Projectiles & Burning Pitch Bombs
    this.renderProjectiles(ctx);

    // 6. Particles, Smoke, Embers & Water
    this.renderParticles(ctx);

    // 7. Tactical HUD & Banner Overlay
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderDistantScenery(ctx) {
    // Distant mountain ridge silhouette
    ctx.fillStyle = 'rgba(25, 20, 36, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(0, this.groundY - 140);
    ctx.lineTo(this.width * 0.2, this.groundY - 180);
    ctx.lineTo(this.width * 0.45, this.groundY - 130);
    ctx.lineTo(this.width * 0.7, this.groundY - 170);
    ctx.lineTo(this.width, this.groundY - 110);
    ctx.lineTo(this.width, this.groundY);
    ctx.closePath();
    ctx.fill();

    // Distant Roman siege tents & watchfires
    ctx.fillStyle = 'rgba(70, 35, 30, 0.85)';
    for (let x = 30; x < this.width * 0.5; x += 65) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + 16, this.groundY - 22);
      ctx.lineTo(x + 32, this.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  renderGround(ctx) {
    // Textured Siege Earthworks & Log Rollers
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGrad.addColorStop(0, '#2e251a'); // Dark compacted dirt & gravel
    groundGrad.addColorStop(1, '#18130d');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Earthwork timber reinforcement beams laid on the ground
    ctx.fillStyle = '#423324';
    ctx.strokeStyle = '#1d1610';
    ctx.lineWidth = 1.5;
    for (let x = 15; x < this.wallX; x += 38) {
      ctx.fillRect(x, this.groundY + 2, 28, 8);
      ctx.strokeRect(x, this.groundY + 2, 28, 8);
    }
  }

  renderCurtainWall(ctx) {
    // Grand Roman / Hellenistic Stone Bastion Ramparts
    const wallTop = this.wallTopY;
    const wallHeight = this.wallHeight;

    // Stone Wall Base Body
    const wallGrad = ctx.createLinearGradient(this.wallX, 0, this.wallX + this.wallWidth, 0);
    wallGrad.addColorStop(0, '#697282');
    wallGrad.addColorStop(0.15, '#8792a6');
    wallGrad.addColorStop(0.8, '#525a68');
    wallGrad.addColorStop(1, '#3b414d');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(this.wallX, wallTop, this.wallWidth, wallHeight);

    // Ashlar Masonry Courses & Textured Joints
    ctx.strokeStyle = 'rgba(30, 35, 45, 0.65)';
    ctx.lineWidth = 1.5;
    const rowHeight = 22;
    const blockWidth = 46;
    const rows = Math.floor(wallHeight / rowHeight);

    for (let r = 0; r < rows; r++) {
      const y = wallTop + r * rowHeight;
      ctx.beginPath();
      ctx.moveTo(this.wallX, y);
      ctx.lineTo(this.wallX + this.wallWidth, y);
      ctx.stroke();

      // Vertical block joints staggered
      const offset = (r % 2) * (blockWidth * 0.5);
      for (let x = this.wallX + offset; x < this.wallX + this.wallWidth; x += blockWidth) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowHeight);
        ctx.stroke();
      }
    }

    // Lower Gate / Ram Impact Zone Damage Cracks
    const gateY = this.groundY - 90;
    const gateW = 60;
    const gateH = 90;

    // Heavy Iron-reinforced Wooden Gate
    if (!this.gateBreached) {
      ctx.fillStyle = '#3a271d';
      ctx.fillRect(this.wallX, gateY, gateW, gateH);

      // Iron studs and reinforcement bands
      ctx.fillStyle = '#1e2229';
      ctx.fillRect(this.wallX + 4, gateY + 18, gateW - 8, 7);
      ctx.fillRect(this.wallX + 4, gateY + 58, gateW - 8, 7);

      // Cracks showing damage level
      const dmg = 1 - (this.wallIntegrity / this.wallMaxIntegrity);
      if (dmg > 0.2) {
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.wallX + 8, gateY + 45);
        ctx.lineTo(this.wallX + 28, gateY + 38);
        ctx.lineTo(this.wallX + 48, gateY + 52);
        ctx.stroke();
      }
    } else {
      // Breached, splintered timber gap!
      ctx.fillStyle = '#140e0b';
      ctx.fillRect(this.wallX, gateY, gateW, gateH);
      ctx.fillStyle = '#5c3a21';
      for (let s = 0; s < 5; s++) {
        ctx.fillRect(this.wallX + s * 10, gateY + gateH - 12 - s * 2, 8, 12);
      }
    }

    // Parapet Crenellations / Merlons atop Wall
    ctx.fillStyle = '#7a8599';
    ctx.strokeStyle = '#2b303c';
    ctx.lineWidth = 2;

    const merlonW = 26;
    const merlonH = 34;
    const embrasureW = 20;

    for (let x = this.wallX; x < this.wallX + this.wallWidth; x += merlonW + embrasureW) {
      ctx.fillRect(x, wallTop - merlonH, merlonW, merlonH);
      ctx.strokeRect(x, wallTop - merlonH, merlonW, merlonH);

      // Arrow slit in merlon
      ctx.fillStyle = '#1a1d24';
      ctx.fillRect(x + merlonW * 0.4, wallTop - merlonH + 8, 4, 16);
      ctx.fillStyle = '#7a8599';
    }

    // Parapet Walkway Timber Planking
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(this.wallX - 10, wallTop - 2, this.wallWidth + 10, 8);

    // Defender Pitch Cauldron on Timber Pivot
    this.renderPitchCauldron(ctx);

    // Defender Soldiers atop Ramparts
    this.renderDefenders(ctx);
  }

  renderPitchCauldron(ctx) {
    const cx = this.wallX + 24;
    const cy = this.wallTopY - 14;

    // Timber A-frame support
    ctx.strokeStyle = '#4a3525';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, this.wallTopY - 2);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 10, this.wallTopY - 2);
    ctx.stroke();

    // Heavy Cast Iron Boiling Pitch Pot
    ctx.fillStyle = '#22262d';
    ctx.strokeStyle = '#111417';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boiling Glowing Pitch Liquid Surface
    ctx.fillStyle = '#ff5500';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fire Brazier underneath cauldron
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(cx - 5, cy + 8, 10, 4);
  }

  renderDefenders(ctx) {
    for (let i = 0; i < this.defenders.length; i++) {
      const def = this.defenders[i];
      ctx.save();
      ctx.translate(def.x, def.y);

      // Defender Tunic (Bronze / Greek Iron armor)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -18, 12, 18);

      // Bronze Cuirass
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-5, -16, 10, 10);

      // Head & Helmet
      ctx.fillStyle = '#fcd34d'; // Bronze helmet
      ctx.beginPath();
      ctx.arc(0, -22, 6, 0, Math.PI * 2);
      ctx.fill();

      // Horsehair Crest
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-2, -29, 4, 7);

      // Composite Bow for Archers
      if (def.role === 'def_archer') {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-8, -14, 12, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderSiegeTower(ctx) {
    const tx = this.towerX;
    const ty = this.towerY;
    const tw = this.towerWidth;
    const th = this.towerHeight;

    // 1. Heavy Timber Outer Framework (Cutaway View)
    // Draw charred or standard timber beams
    ctx.lineWidth = 6;
    for (let i = 0; i < this.frameworkBeams.length; i++) {
      const b = this.frameworkBeams[i];
      const jA = this.frameworkJoints[b.a];
      const jB = this.frameworkJoints[b.b];

      // Blend wood color based on burn damage
      const avgBurn = (jA.charLevel + jB.charLevel) * 0.5;
      ctx.strokeStyle = avgBurn > 0.3 ? '#1c1512' : (b.type === 'floor' ? '#5a3d28' : '#734e32');

      ctx.beginPath();
      ctx.moveTo(jA.x, jA.y);
      ctx.lineTo(jB.x, jB.y);
      ctx.stroke();
    }

    // Heavy Iron Reinforcement Corner Brackets
    ctx.fillStyle = '#2d3748';
    for (let i = 0; i < this.frameworkJoints.length; i++) {
      const j = this.frameworkJoints[i];
      ctx.beginPath();
      ctx.arc(j.x, j.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Protective Rawhide Front Shielding / Screens (Vitruvian Lorica)
    // Front face shields with arrow slits
    ctx.fillStyle = 'rgba(110, 75, 45, 0.4)';
    ctx.fillRect(tx + tw - 18, ty + 20, 14, th - 50);

    // 3. Decks & Internal Floors
    const deckYs = [
      this.groundY - 20, // Ground base
      this.groundY - 110, // Deck 1 ceiling / Deck 2 floor
      this.groundY - 210, // Deck 2 ceiling / Deck 3 floor
      this.groundY - 300 // Deck 3 roof / battlements
    ];

    ctx.fillStyle = '#4a3320';
    deckYs.forEach(y => {
      ctx.fillRect(tx + 4, y - 4, tw - 8, 8);
    });

    // 4. Level 1: Swinging Battering Ram (Aries)
    this.renderBatteringRam(ctx);

    // 5. Level 3: Counterweighted Assault Drawbridge (Pons Deiectus)
    this.renderDrawbridge(ctx);

    // 6. Roman Soldiers inside the Tower
    this.renderLegionaries(ctx);

    // 7. Base Wheels (Rolling on the Ground)
    this.renderWheels(ctx);

    // 8. Tower Battlement Crown & SPQR Eagle (Aquila Standard)
    this.renderTowerCrown(ctx);
  }

  renderWheels(ctx) {
    for (let i = 0; i < this.wheels.length; i++) {
      const w = this.wheels[i];
      const wx = this.towerX + w.relX;
      const wy = this.groundY - w.radius + 2;

      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(this.wheelAngle);

      // Outer Heavy Iron Rim
      ctx.fillStyle = '#2b303a';
      ctx.beginPath();
      ctx.arc(0, 0, w.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner Solid Timber Wheel Disk
      ctx.fillStyle = '#6b4423';
      ctx.beginPath();
      ctx.arc(0, 0, w.radius - 4, 0, Math.PI * 2);
      ctx.fill();

      // 6 Radiating Spoked Timber Reinforcements
      ctx.strokeStyle = '#3e2716';
      ctx.lineWidth = 3.5;
      for (let s = 0; s < 6; s++) {
        const ang = (s * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * (w.radius - 3), Math.sin(ang) * (w.radius - 3));
        ctx.stroke();
      }

      // Bronze Wheel Hub & Axle Pin
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderBatteringRam(ctx) {
    const pivotX = this.towerX + 70;
    const pivotY = this.groundY - 105;

    // Suspension Chains hanging from Deck 2 ceiling
    const chain1X = pivotX - 25;
    const chain2X = pivotX + 25;
    const bobX = pivotX + this.ramLength * Math.sin(this.ramTheta);
    const bobY = pivotY + this.ramLength * Math.cos(this.ramTheta);

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2.5;

    // Chain 1
    ctx.beginPath();
    ctx.moveTo(chain1X, pivotY);
    ctx.lineTo(bobX - 25, bobY);
    ctx.stroke();

    // Chain 2
    ctx.beginPath();
    ctx.moveTo(chain2X, pivotY);
    ctx.lineTo(bobX + 25, bobY);
    ctx.stroke();

    // The Massive Timber Oak Ram Trunk
    ctx.save();
    ctx.translate(bobX, bobY);
    ctx.rotate(this.ramTheta);

    const halfLen = this.ramBeamLength * 0.5;
    const beamH = 18;

    // Oak Trunk
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-halfLen, -beamH * 0.5, this.ramBeamLength, beamH);

    // Iron Reinforcement Hoops
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(-halfLen + 20, -beamH * 0.5 - 1, 6, beamH + 2);
    ctx.fillRect(0, -beamH * 0.5 - 1, 6, beamH + 2);
    ctx.fillRect(halfLen - 25, -beamH * 0.5 - 1, 6, beamH + 2);

    // Forged Bronze / Iron Ram Head (Caput Arietis)
    ctx.fillStyle = '#c5832b'; // Heavy bronze
    ctx.strokeStyle = '#6b4718';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfLen - 6, -beamH * 0.7);
    ctx.lineTo(halfLen + 24, -beamH * 0.4);
    ctx.lineTo(halfLen + 30, 0); // Ram snout
    ctx.lineTo(halfLen + 24, beamH * 0.4);
    ctx.lineTo(halfLen - 6, beamH * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Curled Bronze Horns
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(halfLen + 10, -beamH * 0.6, 7, 0, Math.PI * 1.5, true);
    ctx.stroke();

    ctx.restore();
  }

  renderDrawbridge(ctx) {
    const hingeX = this.towerX + this.towerWidth;
    const hingeY = this.towerY + (this.towerHeight - 210);

    ctx.save();
    ctx.translate(hingeX, hingeY);
    ctx.rotate(this.bridgeAngle);

    // Heavy Timber Gangway Platform
    ctx.fillStyle = '#6e472a';
    ctx.fillRect(0, -5, this.bridgeLength, 10);

    // Raised Protective Parapet Railing along the bridge
    ctx.fillStyle = '#4a2f1c';
    ctx.fillRect(0, -16, this.bridgeLength, 5);

    // Vertical railing posts
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#4a2f1c';
    for (let x = 15; x < this.bridgeLength; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, -5);
      ctx.lineTo(x, -16);
      ctx.stroke();
    }

    // Iron Claws / Grapnel Teeth at tip (Corvus spikes to latch onto stone)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(this.bridgeLength - 4, -4);
    ctx.lineTo(this.bridgeLength + 10, 8);
    ctx.lineTo(this.bridgeLength - 8, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Counterweight Chains running to top of tower
    const pulleyX = this.towerX + this.towerWidth - 4;
    const pulleyY = this.towerY + 30;

    // Bridge tip coordinates in world space
    const tipX = hingeX + Math.cos(this.bridgeAngle) * this.bridgeLength;
    const tipY = hingeY + Math.sin(this.bridgeAngle) * this.bridgeLength;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pulleyX, pulleyY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Counterweight Box inside Tower
    ctx.fillStyle = '#334155';
    ctx.fillRect(this.towerX + this.towerWidth - 30, this.towerY + 50, 18, 25);
  }

  renderLegionaries(ctx) {
    for (let i = 0; i < this.legionaries.length; i++) {
      const sol = this.legionaries[i];
      let sx = this.towerX + sol.relX;
      let sy = this.towerY + sol.relY;

      // Handle assault legionary charging across bridge
      if (sol.role === 'assault' && sol.charging && sol.chargeProgress) {
        const hingeX = this.towerX + this.towerWidth;
        const hingeY = this.towerY + (this.towerHeight - 210);
        const tipX = hingeX + Math.cos(this.bridgeAngle) * this.bridgeLength;
        const tipY = hingeY + Math.sin(this.bridgeAngle) * this.bridgeLength;

        const p = sol.chargeProgress;
        if (p < 0.8) {
          // Running along the drawbridge
          const prog = p / 0.8;
          sx = hingeX + (tipX - hingeX) * prog;
          sy = hingeY + (tipY - hingeY) * prog - 8;
        } else {
          // Reached the ramparts!
          const rampProg = (p - 0.8) / 0.6;
          sx = this.wallX + rampProg * 45 + sol.relX * 0.15;
          sy = this.wallTopY - 14;
        }
      }

      ctx.save();
      ctx.translate(sx, sy);

      // Roman Red Tunic
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-5, -16, 10, 16);

      // Lorica Segmentata (Segmented Iron Plate Armor)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-4, -14, 8, 9);

      // Galea Helmet (Imperial Gallic with red horsehair crest)
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, -19, 5, 0, Math.PI * 2);
      ctx.fill();

      // Red Crest
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -26, 4, 7);

      // Equipment by Role
      if (sol.role === 'ram_crew') {
        // Hands holding suspension rope
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, -10);
        ctx.lineTo(8, -6);
        ctx.stroke();
      } else if (sol.role === 'archer') {
        // Bow
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(8, -10, 10, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
      } else if (sol.role === 'assault') {
        // Red Curved Scutum (Shield) with Gold Thunderbolt
        ctx.fillStyle = '#991b1b';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-7, -15, 6, 17);
        ctx.strokeRect(-7, -15, 6, 17);

        // Gold Shield Boss (Umbo)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-4, -6.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Drawn Gladius Sword
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(3, -9);
        ctx.lineTo(12, -14);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderTowerCrown(ctx) {
    const tx = this.towerX;
    const ty = this.towerY;
    const tw = this.towerWidth;

    // Roof Battlement Merlons
    ctx.fillStyle = '#5c3a21';
    for (let x = tx + 4; x < tx + tw - 8; x += 22) {
      ctx.fillRect(x, ty - 12, 14, 12);
    }

    // Golden Roman Aquila (Eagle Standard)
    const eagleX = tx + tw * 0.5;
    const eagleY = ty - 14;

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(eagleX, ty);
    ctx.lineTo(eagleX, eagleY - 22);
    ctx.stroke();

    // Golden Eagle
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(eagleX, eagleY - 26, 6, 0, Math.PI * 2);
    ctx.fill();

    // Crimson SPQR Vexillum Flag
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(eagleX + 3, eagleY - 22, 22, 14);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('SPQR', eagleX + 5, eagleY - 12);
  }

  renderProjectiles(ctx) {
    // Defender Boiling Pitch Projectiles
    for (let i = 0; i < this.pitchProjectiles.length; i++) {
      const p = this.pitchProjectiles[i];
      ctx.save();

      // Fiery Outer Glow
      const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius * 2.2);
      glow.addColorStop(0, '#fff');
      glow.addColorStop(0.3, '#ffcc00');
      glow.addColorStop(0.7, '#ff3b00');
      glow.addColorStop(1, 'rgba(255, 59, 0, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Dense Molten Core
      ctx.fillStyle = '#3a1005';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderParticles(ctx) {
    // 1. Smoke & Steam Billows
    for (let i = 0; i < this.smokeParticles.length; i++) {
      const s = this.smokeParticles[i];
      ctx.fillStyle = s.isSteam ? `rgba(220, 235, 250, ${s.alpha * 0.4})` : `rgba(35, 30, 30, ${s.alpha * 0.55})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Fire Embers (Additive Lighter Glow)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Water Droplets
    ctx.fillStyle = 'rgba(147, 197, 253, 0.8)';
    for (let i = 0; i < this.waterParticles.length; i++) {
      const w = this.waterParticles[i];
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Shattered Stone Masonry Debris
    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i];
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.size * 0.5, -d.size * 0.5, d.size, d.size);
      ctx.restore();
    }
  }

  renderHUD(ctx) {
    const ui = this.uiScale();
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    ctx.save();
    ctx.scale(ui, ui);

    // Top Title & Legend
    const cardW = Math.min(sw - 28, narrow ? 320 : 340);
    const cardH = narrow ? 66 : 68;
    ctx.fillStyle = 'rgba(15, 12, 22, 0.75)';
    ctx.beginPath();
    ctx.roundRect(14, 14, cardW, cardH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#d4af37';
    ctx.font = `bold ${narrow ? 11 : 13}px 'Cinzel', serif, Georgia`;
    ctx.textAlign = 'left';
    ctx.fillText(narrow ? 'TURRIS AMBULATORIA' : 'TURRIS AMBULATORIA (HELEPOLIS)', 24, 32);

    ctx.fillStyle = '#a0aec0';
    ctx.font = `${narrow ? 9 : 11}px 'JetBrains Mono', monospace`;
    ctx.fillText(narrow ? 'Vitruvius X.13 — Rampart Assault' : 'Vitruvius De Architectura X.13 — Rampart Assault', 24, narrow ? 46 : 50);

    const dist = Math.max(0, ((this.wallX - (this.towerX + this.towerWidth)) * 0.18)).toFixed(1);
    ctx.fillStyle = '#38bdf8';
    ctx.font = `${narrow ? 9 : 11}px 'JetBrains Mono', monospace`;
    ctx.fillText(`DIST: ${dist}m | TOWER: ${Math.round(this.towerHealth / 10)}% | GATE: ${Math.round(this.wallIntegrity / 12)}%`, 24, narrow ? 60 : 66);

    // Wall Breach Banner
    if (this.gateBreached) {
      const bannerW = Math.min(sw - 40, 260);
      const bannerX = (sw - bannerW) * 0.5;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
      ctx.beginPath();
      ctx.roundRect(bannerX, 25, bannerW, 36, 6);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${narrow ? 12 : 14}px 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.fillText('⚡ RAMPART GATE BREACHED! ⚡', sw * 0.5, 48);
    }

    ctx.restore();
  }

  // Interactive Input Handling
  onMouseDown(pos) {
    if (!pos) return;
    this.initAudio();

    // Check if clicked near Ram Head to heave it manually
    const ramPivotX = this.towerX + 70;
    const ramPivotY = this.groundY - 60;
    const ramTipX = ramPivotX + this.ramLength * Math.sin(this.ramTheta) + 60 * Math.cos(this.ramTheta);
    const distToRam = Math.hypot(pos.x - ramTipX, pos.y - ramPivotY);

    if (distToRam < 55) {
      this.isDraggingRam = true;
      return;
    }

    // Check if clicked on a burning node to targetedly douse it
    for (let i = 0; i < this.fireNodes.length; i++) {
      const node = this.fireNodes[i];
      if (node.fireLevel > 0.1 && Math.hypot(pos.x - node.x, pos.y - node.y) < 35) {
        node.fireLevel = 0;
        this.playSound('douse');
        for (let k = 0; k < 8; k++) {
          this.waterParticles.push({
            x: node.x,
            y: node.y,
            vx: (Math.random() - 0.5) * 40,
            vy: -30 - Math.random() * 50,
            radius: 2.5,
            life: 0.6
          });
        }
        return;
      }
    }

    // Check if clicked on Tower to drag roll it
    if (
      pos.x >= this.towerX &&
      pos.x <= this.towerX + this.towerWidth &&
      pos.y >= this.towerY &&
      pos.y <= this.groundY
    ) {
      this.isDraggingTower = true;
      this.dragOffsetX = pos.x - this.towerX;
    }
  }

  onMouseMove(pos) {
    if (!pos) return;

    if (this.isDraggingTower) {
      const maxTowerX = this.wallX - this.towerWidth - 6;
      const minTowerX = 30;
      const newX = pos.x - this.dragOffsetX;
      const dx = newX - this.towerX;

      this.towerX = Math.min(Math.max(minTowerX, newX), maxTowerX);
      if (Math.abs(dx) > 0.1) {
        this.wheelAngle += dx / this.wheelRadius;
        this.wheelAngle %= (Math.PI * 2);
      }
      this.updateJointPositions();
      this.updateTelemetry();
    } else if (this.isDraggingRam) {
      const ramPivotX = this.towerX + 70;
      const dx = pos.x - ramPivotX;
      this.ramTheta = Math.max(-0.95, Math.min(0.7, dx / this.ramLength));
      this.ramOmega = 0;
    }
  }

  onMouseUp(pos) {
    if (this.isDraggingRam) {
      this.isDraggingRam = false;
      // Launch forward with momentum if pulled back
      if (this.ramTheta < -0.1) {
        this.ramOmega = Math.abs(this.ramTheta) * 7.5;
        this.playSound('creak');
      }
    }
    this.isDraggingTower = false;
  }

  onKeyDown(key, e) {
    this.initAudio();
    if (key === ' ' || key === 'Enter') {
      this.toggleDrawbridge();
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === 'b' || key === 'B') {
      this.swingBatteringRam();
    } else if (key === 'f' || key === 'F') {
      this.douseFires();
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.advanceSpeed = Math.min(60, this.advanceSpeed + 15);
      this.updateSpeedSlider();
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.advanceSpeed = Math.max(-25, this.advanceSpeed - 15);
      this.updateSpeedSlider();
    }
  }

  onKeyUp(key, e) {
    // Optional keyup handling
  }

  updateSpeedSlider() {
    if (!this.controlsContainer) return;
    const speedSlider = this.controlsContainer.querySelector('#siege-speed');
    const speedVal = this.controlsContainer.querySelector('#siege-speed-val');
    if (speedSlider) speedSlider.value = this.advanceSpeed;
    if (speedVal) speedVal.textContent = `${this.advanceSpeed} px/s`;
  }

  // Contract: Return total active entities
  getEntityCount() {
    const joints = this.frameworkJoints ? this.frameworkJoints.length : 0;
    const wheels = this.wheels ? this.wheels.length : 0;
    const soldiers = (this.legionaries ? this.legionaries.length : 0) + (this.defenders ? this.defenders.length : 0);
    const projectiles = this.pitchProjectiles ? this.pitchProjectiles.length : 0;
    const debris = this.debris ? this.debris.length : 0;
    const particles = this.particles ? this.particles.length : 0;
    return joints + wheels + soldiers + projectiles + debris + particles;
  }

  // Teardown & Resource Cleanup
  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.frameworkJoints = [];
    this.frameworkBeams = [];
    this.wheels = [];
    this.legionaries = [];
    this.defenders = [];
    this.pitchProjectiles = [];
    this.particles = [];
    this.debris = [];
    this.waterParticles = [];
    this.smokeParticles = [];
  }
}
