// Testudo: Roman Legionary Shield Formation & Ballistic Deflection Mechanics
// Grounded in Vegetius (De Re Militari), Polybius (Histories), and Pliny the Elder (Naturalis Historia)
// Zero external dependencies — pure ES module

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class TestudoEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Display
    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    attachTouchBridge(this, canvas);

    // Tactical State & Formation
    this.formationType = 'testudo'; // 'testudo', 'acies', 'orbis'
    this.marchSpeed = 45; // Base march speed in px/s
    this.volleyIntensity = 3; // Waves per second (1 - 10)
    this.isCharging = false;
    this.chargeTimer = 0;
    this.isTestudoRoofRaised = true; // In testudo, interior holds shields overhead

    // Formation Position & Steering
    this.cohortPos = { x: this.width * 0.5, y: this.height * 0.58 };
    this.targetPos = { x: this.width * 0.5, y: this.height * 0.58 };
    this.marchHeading = -Math.PI / 2; // Northward advance by default
    this.currentHeading = -Math.PI / 2;
    this.isDraggingRally = false;

    // Simulation Entities
    this.soldiers = [];
    this.shields = [];
    this.arrows = [];
    this.sparks = [];
    this.splinters = [];
    this.floatingTexts = [];
    this.groundScuffs = [];

    // Volley Spawner State
    this.volleyTimer = 0;
    this.volleyCooldown = 1.0 / this.volleyIntensity;
    this.ambientTime = 0;

    // Metrics & Telemetry
    this.totalDeflected = 0;
    this.totalImpulseJoules = 0;
    this.cohesionIndex = 1.0;

    // Audio Synthesizer
    this.audioCtx = null;
    this.audioMuted = false;

    // Initialize UI and Cohort
    this.initControls();
    this.reset();
  }

  // Safe Web Audio Synthesizer for Battlefield Clangs and Horns
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

  playSound(type, intensity = 1.0) {
    if (this.audioMuted || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    if (type === 'shield_clang') {
      // High-pitched metallic rim resonance + deep wood scutum thud
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800 + Math.random() * 400, t);
      osc1.frequency.exponentialRampToValueAtTime(220, t + 0.08);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(140 + Math.random() * 50, t);
      osc2.frequency.exponentialRampToValueAtTime(45, t + 0.14);

      const vol = Math.min(0.35, 0.15 * intensity);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.16);
      osc2.stop(t + 0.16);
    } else if (type === 'arrow_launch') {
      // Bowstring twang + rush
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === 'cornu_horn') {
      // Roman G-shaped Cornu / Buccina military brass call
      const fund = 196; // G3
      [fund, fund * 1.5, fund * 2].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * 1.05, t + 0.35);

        gain.gain.setValueAtTime(0.12 / (idx + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } else if (type === 'shout') {
      // Deep war roar
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.4);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  }

  // Safe DOM Initializer
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Tactical Formation</label>
        <div class="control-btn-grid" id="testudo-formation-selector">
          <button class="sub-btn active" data-formation="testudo" title="Locked roof & perimeter scutum tortoise">🐢 Testudo</button>
          <button class="sub-btn" data-formation="acies" title="Triplex Acies three staggered battle ranks">⚔️ Acies Triplex</button>
          <button class="sub-btn" data-formation="orbis" title="Circular hedgehog defensive ring">⭕ Orbis</button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>March Speed</span>
          <span id="march-speed-val" style="color: var(--accent-gold, #d4af37); font-weight:600;">45 px/s</span>
        </label>
        <input type="range" id="march-speed-slider" min="0" max="120" step="5" value="45">
      </div>

      <div class="control-group">
        <label>
          <span>Arrow Volley Intensity</span>
          <span id="arrow-intensity-val" style="color: var(--accent-cyan, #e74c3c); font-weight:600;">3 / sec</span>
        </label>
        <input type="range" id="arrow-intensity-slider" min="0" max="10" step="1" value="3">
      </div>

      <div class="control-group">
        <label>Tactical Commands</label>
        <div class="control-btn-grid">
          <button class="sub-btn" id="btn-charge" style="background: rgba(180, 40, 40, 0.4); border-color: #d4af37; font-weight: bold; color: #ffe6a0;">⚡ Charge! (Ad Gladium)</button>
          <button class="sub-btn" id="btn-fire-volley">🏹 Launch Volley</button>
        </div>
        <button class="sub-btn" id="btn-reset-formation" style="margin-top: 6px; width: 100%;">🔄 Reform Cohort & Clear Field</button>
      </div>

      <div class="control-group" style="background: rgba(22, 16, 12, 0.7); padding: 10px; border-radius: 6px; border: 1px solid rgba(212, 175, 55, 0.35);">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #d4af37; margin-bottom: 5px; font-weight: 700;">Legio Cohort Telemetry</div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
          <span>Arrows Deflected:</span>
          <span id="telemetry-deflected" style="color: #4cd964; font-weight: bold;">0</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
          <span>Kinetic Deflection:</span>
          <span id="telemetry-energy" style="color: #e5c158; font-weight: bold;">0 Joules</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span>Formation Cohesion:</span>
          <span id="telemetry-cohesion" style="color: #5ac8fa; font-weight: bold;">100%</span>
        </div>
      </div>
    `;

    // Formation Buttons
    const formBtns = this.controlsContainer.querySelectorAll('#testudo-formation-selector .sub-btn');
    formBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const formation = e.currentTarget.dataset.formation;
        this.setFormation(formation);
      });
    });

    // March Speed Slider
    const speedSlider = this.controlsContainer.querySelector('#march-speed-slider');
    const speedVal = this.controlsContainer.querySelector('#march-speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.marchSpeed = parseFloat(e.target.value);
        if (speedVal) speedVal.textContent = `${this.marchSpeed} px/s`;
      });
    }

    // Volley Intensity Slider
    const intensitySlider = this.controlsContainer.querySelector('#arrow-intensity-slider');
    const intensityVal = this.controlsContainer.querySelector('#arrow-intensity-val');
    if (intensitySlider) {
      intensitySlider.addEventListener('input', (e) => {
        this.volleyIntensity = parseInt(e.target.value, 10);
        this.volleyCooldown = this.volleyIntensity > 0 ? 1.0 / this.volleyIntensity : 999999;
        if (intensityVal) {
          intensityVal.textContent = this.volleyIntensity === 0 ? 'Peace (0 / sec)' : `${this.volleyIntensity} / sec`;
        }
      });
    }

    // Charge Button
    const chargeBtn = this.controlsContainer.querySelector('#btn-charge');
    if (chargeBtn) {
      chargeBtn.addEventListener('click', () => {
        this.triggerCharge();
      });
    }

    // Fire Volley Button
    const volleyBtn = this.controlsContainer.querySelector('#btn-fire-volley');
    if (volleyBtn) {
      volleyBtn.addEventListener('click', () => {
        this.spawnArrowVolley(36, true);
      });
    }

    // Reset Button
    const resetBtn = this.controlsContainer.querySelector('#btn-reset-formation');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    this.updateTelemetry();
  }

  setFormation(name) {
    if (name !== 'testudo' && name !== 'acies' && name !== 'orbis') return;
    this.formationType = name;

    if (this.controlsContainer) {
      const btns = this.controlsContainer.querySelectorAll('#testudo-formation-selector .sub-btn');
      btns.forEach(b => {
        b.classList.toggle('active', b.dataset.formation === name);
      });
    }

    this.initAudio();
    this.playSound('cornu_horn');
    this.addFloatingText(
      this.cohortPos.x,
      this.cohortPos.y - 70,
      name === 'testudo' ? 'TESTUDO FORMATE!' : name === 'acies' ? 'ACIES TRIPLEX!' : 'ORBIS CLAUDITE!',
      '#e5c158'
    );

    this.recomputeFormationSlots();
  }

  triggerCharge() {
    this.isCharging = true;
    this.chargeTimer = 3.5; // 3.5 seconds of high-speed charge
    this.initAudio();
    this.playSound('cornu_horn');
    this.playSound('shout');
    this.addFloatingText(this.cohortPos.x, this.cohortPos.y - 60, 'AD GLADIUM! CHARGE!', '#ff4444');

    // Scatter burst of battle dust
    for (let i = 0; i < 20; i++) {
      this.sparks.push(new Particle(
        this.cohortPos.x + (Math.random() - 0.5) * 100,
        this.cohortPos.y + (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        'dust'
      ));
    }
  }

  updateTelemetry() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const defEl = this.controlsContainer.querySelector('#telemetry-deflected');
    const energyEl = this.controlsContainer.querySelector('#telemetry-energy');
    const cohEl = this.controlsContainer.querySelector('#telemetry-cohesion');

    if (defEl) defEl.textContent = `${this.totalDeflected}`;
    if (energyEl) energyEl.textContent = `${Math.round(this.totalImpulseJoules).toLocaleString()} J`;
    if (cohEl) cohEl.textContent = `${Math.round(this.cohesionIndex * 100)}%`;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    // Keep cohort in bounds if resized drastically
    if (this.cohortPos.x > this.width) this.cohortPos.x = this.width * 0.5;
    if (this.cohortPos.y > this.height) this.cohortPos.y = this.height * 0.58;
  }

  reset() {
    this.cohortPos = { x: this.width * 0.5, y: this.height * 0.58 };
    this.targetPos = { x: this.width * 0.5, y: this.height * 0.58 };
    this.marchHeading = -Math.PI / 2;
    this.currentHeading = -Math.PI / 2;
    this.isCharging = false;
    this.chargeTimer = 0;
    this.totalDeflected = 0;
    this.totalImpulseJoules = 0;
    this.cohesionIndex = 1.0;

    this.arrows = [];
    this.sparks = [];
    this.splinters = [];
    this.floatingTexts = [];
    this.groundScuffs = [];

    this.initLegionaries();
    this.recomputeFormationSlots();
    this.updateTelemetry();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.arrows = [];
    this.sparks = [];
    this.splinters = [];
    this.soldiers = [];
    this.shields = [];
    this.floatingTexts = [];
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  getEntityCount() {
    // Legionary soldiers + scutum shields + incoming arrows + impact sparks & splinters
    const activeArrows = this.arrows.filter(a => a.active).length;
    const activeSparks = this.sparks.filter(s => s.active).length;
    const activeSplinters = this.splinters.filter(s => s.active).length;
    return this.soldiers.length + this.shields.length + activeArrows + activeSparks + activeSplinters;
  }

  // Build the 36 Legionaries of the Centuria Cohort
  initLegionaries() {
    this.soldiers = [];
    this.shields = [];

    // 36 Legionaries (6x6 formation standard for a solid testudo module)
    const count = 36;
    for (let i = 0; i < count; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);

      let role = 'legionary';
      if (row === 2 && col === 2) role = 'centurion'; // Centurion leading the center-front
      else if (row === 2 && col === 3) role = 'aquilifer'; // Bearer of the golden Aquila standard
      else if (row === 3 && col === 2) role = 'cornicen'; // Horn-blower with curled brass cornu

      const soldier = new Legionary(i, row, col, role);
      soldier.x = this.cohortPos.x + (col - 2.5) * 32;
      soldier.y = this.cohortPos.y + (row - 2.5) * 28;
      soldier.targetX = soldier.x;
      soldier.targetY = soldier.y;

      const shield = new ScutumShield(soldier);
      soldier.shield = shield;

      this.soldiers.push(soldier);
      this.shields.push(shield);
    }
  }

  // Recompute relative target offsets and shield stances for each legionary
  recomputeFormationSlots() {
    const cols = 6;
    const rows = 6;

    if (this.formationType === 'testudo') {
      // 6x6 tight grid with interlocked shields
      const dx = 30;
      const dy = 26;
      for (const s of this.soldiers) {
        const c = s.col;
        const r = s.row;
        s.slotOffsetX = (c - 2.5) * dx;
        s.slotOffsetY = (r - 2.5) * dy;

        // Determine shield role in Testudo
        if (r === 0) {
          // Front Rank: Shields held vertically forward facing North
          s.shieldStance = 'front';
          s.baseFacing = -Math.PI / 2;
        } else if (r === rows - 1) {
          // Rear Rank: Shields held facing South
          s.shieldStance = 'rear';
          s.baseFacing = Math.PI / 2;
        } else if (c === 0) {
          // Left Flank: Shields held facing West
          s.shieldStance = 'left';
          s.baseFacing = Math.PI;
        } else if (c === cols - 1) {
          // Right Flank: Shields held facing East
          s.shieldStance = 'right';
          s.baseFacing = 0;
        } else {
          // Interior: Roof Testudo — shields held overhead overlapping like tiles!
          s.shieldStance = 'roof';
          s.baseFacing = -Math.PI / 2;
        }
      }
    } else if (this.formationType === 'acies') {
      // Acies Triplex: Three staggered battle lines (Hastati, Principes, Triarii)
      // 12 men per line across 3 ranks
      const rankDx = 38;
      const rankDy = 42;
      for (let i = 0; i < this.soldiers.length; i++) {
        const s = this.soldiers[i];
        const lineIdx = Math.floor(i / 12); // 0 = Hastati, 1 = Principes, 2 = Triarii
        const colIdx = i % 12;
        const stagger = (lineIdx % 2 === 1) ? rankDx * 0.5 : 0;

        s.slotOffsetX = (colIdx - 5.5) * rankDx + stagger;
        s.slotOffsetY = (lineIdx - 1.0) * rankDy;
        s.shieldStance = 'front';
        s.baseFacing = -Math.PI / 2;
      }
    } else if (this.formationType === 'orbis') {
      // Orbis: Defensive circular ring (hedgehog)
      // 22 in outer ring, 12 in middle ring, 2 commanders at absolute center
      for (let i = 0; i < this.soldiers.length; i++) {
        const s = this.soldiers[i];
        if (i < 22) {
          // Outer ring
          const angle = (i / 22) * Math.PI * 2;
          const radius = 105;
          s.slotOffsetX = Math.cos(angle) * radius;
          s.slotOffsetY = Math.sin(angle) * radius;
          s.shieldStance = 'perimeter';
          s.baseFacing = angle;
        } else if (i < 34) {
          // Middle ring
          const idx = i - 22;
          const angle = (idx / 12) * Math.PI * 2;
          const radius = 54;
          s.slotOffsetX = Math.cos(angle) * radius;
          s.slotOffsetY = Math.sin(angle) * radius;
          s.shieldStance = 'roof';
          s.baseFacing = angle;
        } else {
          // Center commanders (Centurion & Aquilifer)
          const idx = i - 34;
          s.slotOffsetX = (idx - 0.5) * 20;
          s.slotOffsetY = 0;
          s.shieldStance = 'roof';
          s.baseFacing = -Math.PI / 2;
        }
      }
    }
  }

  // Launch a barrage of ballistic arrows with parabolic trajectories
  spawnArrowVolley(count = 12, forceVolley = false) {
    this.initAudio();
    if (forceVolley) {
      this.playSound('arrow_launch');
      this.addFloatingText(this.cohortPos.x, 60, 'SAGITTARII VOLLEY!', '#ff8844');
    }

    // Origin: Incoming from enemy skirmishers at top or upper flanks
    const targetCenterX = this.cohortPos.x + (Math.random() - 0.5) * 60;
    const targetCenterY = this.cohortPos.y + (Math.random() - 0.5) * 60;

    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * 220;
      const spreadY = (Math.random() - 0.5) * 180;
      const destX = targetCenterX + spreadX;
      const destY = targetCenterY + spreadY;

      // Launch position from top edge or angled upper quadrant
      const startX = destX + (Math.random() - 0.5) * 140;
      const startY = -40 - Math.random() * 80;
      const startZ = 220 + Math.random() * 120; // 3D altitude in px

      // Flight time based on distance
      const flightDuration = 1.1 + Math.random() * 0.4;
      const vx = (destX - startX) / flightDuration;
      const vy = (destY - startY) / flightDuration;
      // Ballistic arc: vz initial such that z lands near 0 at flightDuration with gravity g=420
      const gravity = 420;
      const vz = (gravity * flightDuration * 0.5) - (startZ / flightDuration);

      const arrow = new Arrow(startX, startY, startZ, vx, vy, vz, gravity);
      this.arrows.push(arrow);
    }
  }

  // Update Loop
  update(dt) {
    if (!dt || isNaN(dt) || dt > 0.1) dt = 0.016;
    this.ambientTime += dt;

    // Handle Charge Timer
    if (this.isCharging) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.isCharging = false;
      }
    }

    // March Movement toward Target Waypoint
    const effectiveSpeed = this.marchSpeed * (this.isCharging ? 2.4 : 1.0);
    const toTargetX = this.targetPos.x - this.cohortPos.x;
    const toTargetY = this.targetPos.y - this.cohortPos.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);

    if (distToTarget > 4 && effectiveSpeed > 0) {
      this.marchHeading = Math.atan2(toTargetY, toTargetX);
      const step = Math.min(distToTarget, effectiveSpeed * dt);
      this.cohortPos.x += Math.cos(this.marchHeading) * step;
      this.cohortPos.y += Math.sin(this.marchHeading) * step;
    }

    // Smooth heading angle slerp
    let diff = this.marchHeading - this.currentHeading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentHeading += diff * Math.min(1.0, dt * 5.0);

    // Update Soldiers & Shields
    let totalDisplacement = 0;
    const cosH = Math.cos(this.currentHeading + Math.PI / 2);
    const sinH = Math.sin(this.currentHeading + Math.PI / 2);

    for (let i = 0; i < this.soldiers.length; i++) {
      const s = this.soldiers[i];

      // Rotate slot offset by formation heading
      const worldSlotX = this.cohortPos.x + (s.slotOffsetX * cosH - s.slotOffsetY * sinH);
      const worldSlotY = this.cohortPos.y + (s.slotOffsetX * sinH + s.slotOffsetY * cosH);

      s.targetX = worldSlotX;
      s.targetY = worldSlotY;
      s.update(dt, this.currentHeading, effectiveSpeed > 5);

      totalDisplacement += Math.hypot(s.x - worldSlotX, s.y - worldSlotY);
    }

    // Cohort Cohesion Index (100% when perfectly in formation, drops on impacts/turns)
    const avgDisplacement = totalDisplacement / this.soldiers.length;
    this.cohesionIndex = Math.max(0.4, Math.min(1.0, 1.0 - avgDisplacement / 45));

    // Arrow Spawner Logic
    if (this.volleyIntensity > 0) {
      this.volleyTimer += dt;
      if (this.volleyTimer >= this.volleyCooldown) {
        this.volleyTimer = 0;
        const arrowsInSalvo = Math.max(2, Math.round(this.volleyIntensity * 2.2));
        this.spawnArrowVolley(arrowsInSalvo, false);
      }
    }

    // Update Arrows & Physical Deflection
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.update(dt);

      // Check collision against scutum shields if arrow is in descending flight
      if (a.active && !a.ricocheted && a.z <= 32 && a.z >= 0) {
        this.checkShieldCollisions(a);
      }

      // Remove inactive or out of bounds arrows
      if (!a.active || a.y > this.height + 150 || a.x < -100 || a.x > this.width + 100) {
        this.arrows.splice(i, 1);
      }
    }

    // Cap arrows to prevent memory leak
    if (this.arrows.length > 250) {
      this.arrows.splice(0, this.arrows.length - 250);
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.update(dt);
      if (!sp.active) {
        this.sparks.splice(i, 1);
      }
    }

    // Update Splinters
    for (let i = this.splinters.length - 1; i >= 0; i--) {
      const sp = this.splinters[i];
      sp.update(dt);
      if (!sp.active) {
        this.splinters.splice(i, 1);
      }
    }

    // Update Floating Battle Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update(dt);
      if (!ft.active) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Periodically prune old ground scuffs
    if (this.groundScuffs.length > 80) {
      this.groundScuffs.splice(0, this.groundScuffs.length - 80);
    }

    this.updateTelemetry();
  }

  // Rigid Scutum Shield Collision & Impulse Deflection Physics
  checkShieldCollisions(arrow) {
    // Check against each soldier's scutum shield
    for (let i = 0; i < this.soldiers.length; i++) {
      const soldier = this.soldiers[i];
      const shield = soldier.shield;
      if (!shield) continue;

      const shieldPoly = shield.getCollisionBounds();
      const arrowX = arrow.x;
      const arrowY = arrow.y;

      // Check 2D projected collision point
      const dx = arrowX - shieldPoly.cx;
      const dy = arrowY - shieldPoly.cy;
      const dist = Math.hypot(dx, dy);

      if (dist < shieldPoly.radius) {
        // Altitude check
        const shieldTopZ = shieldPoly.topZ;
        const shieldBottomZ = shieldPoly.bottomZ;

        if (arrow.z <= shieldTopZ && arrow.z >= shieldBottomZ) {
          // Deflection collision confirmed!
          this.deflectArrow(arrow, shield, soldier);
          break;
        }
      }
    }
  }

  deflectArrow(arrow, shield, soldier) {
    arrow.ricocheted = true;
    this.totalDeflected++;

    // Calculate kinetic energy of arrow: E = 0.5 * m * v^2
    const speed = Math.hypot(arrow.vx, arrow.vy, arrow.vz);
    const arrowMassKg = 0.045; // 45 gram Roman/Parthian combat arrow
    const energyJoules = 0.5 * arrowMassKg * (speed * 0.1) * (speed * 0.1);
    this.totalImpulseJoules += energyJoules;

    // Normal vector of the shield at impact point
    const normal = shield.getNormal();

    // Specular deflection with restitution and randomized tangent deflection
    // v_out = v_in - 2*(v_in . n)*n
    const dot = arrow.vx * normal.x + arrow.vy * normal.y + arrow.vz * normal.z;
    const restitution = 0.55 + Math.random() * 0.25;

    arrow.vx = (arrow.vx - (1 + restitution) * dot * normal.x) + (Math.random() - 0.5) * 90;
    arrow.vy = (arrow.vy - (1 + restitution) * dot * normal.y) + (Math.random() - 0.5) * 90;
    arrow.vz = Math.abs(arrow.vz * restitution) + 110 + Math.random() * 80; // High bounce upward

    // Randomize tumbling spin
    arrow.tumbleSpeed = (Math.random() - 0.5) * 18;

    // Shield vibration and soldier recoil
    shield.recoil = 1.0;
    soldier.recoilX += normal.x * -4.5;
    soldier.recoilY += normal.y * -4.5;

    // Sound effect
    this.playSound('shield_clang', speed / 250);

    // Spawn sparks (golden brass / iron sparks)
    const sparkCount = 8 + Math.floor(Math.random() * 8);
    for (let s = 0; s < sparkCount; s++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 160;
      this.sparks.push(new Particle(
        arrow.x,
        arrow.y - arrow.z, // Render position of impact
        Math.cos(angle) * spd,
        Math.sin(angle) * spd - 40,
        'spark'
      ));
    }

    // Wood splinters
    for (let w = 0; w < 3; w++) {
      this.splinters.push(new Particle(
        arrow.x,
        arrow.y - arrow.z,
        (Math.random() - 0.5) * 80,
        -20 - Math.random() * 60,
        'wood'
      ));
    }

    // Leave a dent on the shield
    shield.addDent(arrow.x - shield.worldX, arrow.y - shield.worldY);
  }

  addFloatingText(x, y, text, color = '#ffd700') {
    this.floatingTexts.push(new FloatingText(x, y, text, color));
  }

  // Main Render Pass
  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    // Clear Canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Roman Campaign Battlefield Ground (Roman paved stones / arid Mediterranean plain)
    this.renderGround(ctx);

    // Ground Scuffs & Fallen Arrows
    this.renderGroundDebris(ctx);

    // Formation Rally Marker
    this.renderRallyPoint(ctx);

    // Shadows of soldiers and shields
    ctx.save();
    this.renderCohortShadows(ctx);
    ctx.restore();

    // Render Legionaries & Shields (sorted by Y for proper 3/4 perspective layering)
    ctx.save();
    const renderList = [...this.soldiers].sort((a, b) => a.y - b.y);
    for (const soldier of renderList) {
      soldier.render(ctx, this.isCharging);
    }
    ctx.restore();

    // In Testudo, render the interlocking roof shields on top of soldiers
    if (this.formationType === 'testudo') {
      ctx.save();
      this.renderTestudoRoofMesh(ctx);
      ctx.restore();
    }

    // Render Airborne Arrows & Shadows
    ctx.save();
    this.renderArrows(ctx);
    ctx.restore();

    // Render Impact Sparks & Splinters
    ctx.save();
    this.renderParticles(ctx);
    ctx.restore();

    // Floating War Cries & Labels
    ctx.save();
    for (const ft of this.floatingTexts) {
      ft.render(ctx);
    }
    ctx.restore();

    // Tactical Battlefield HUD & Compass
    this.renderHUD(ctx);

    ctx.restore();
  }

  // Render Roman Via Appia Basalt Pavement & Arid Battlefield Ground
  renderGround(ctx) {
    const w = this.width;
    const h = this.height;

    // Warm arid Roman plain background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#2e261f');
    bgGrad.addColorStop(0.5, '#3b3127');
    bgGrad.addColorStop(1, '#2c241c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Basalt Flagstone Pavement running vertically down the battlefield
    const roadWidth = Math.min(w * 0.75, 480);
    const roadLeft = (w - roadWidth) * 0.5;
    const roadRight = roadLeft + roadWidth;

    // Roadbed curb stones
    ctx.fillStyle = 'rgba(75, 62, 52, 0.45)';
    ctx.fillRect(roadLeft - 12, 0, 12, h);
    ctx.fillRect(roadRight, 0, 12, h);

    // Curb edge highlights
    ctx.strokeStyle = 'rgba(180, 155, 125, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(roadLeft, 0);
    ctx.lineTo(roadLeft, h);
    ctx.moveTo(roadRight, 0);
    ctx.lineTo(roadRight, h);
    ctx.stroke();

    // Procedural stone flagstone lines
    ctx.save();
    ctx.strokeStyle = 'rgba(25, 20, 16, 0.35)';
    ctx.lineWidth = 1;
    const rowH = 40;
    const offsetRows = Math.floor(h / rowH) + 2;

    for (let r = 0; r < offsetRows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(roadLeft, y);
      ctx.lineTo(roadRight, y);
      ctx.stroke();

      // Staggered vertical stone joints
      const colsInRow = 8;
      const colW = roadWidth / colsInRow;
      const stagger = (r % 2) * (colW * 0.5);
      for (let c = 0; c <= colsInRow; c++) {
        const x = roadLeft + c * colW + stagger;
        if (x >= roadLeft && x <= roadRight) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // Subtle campaign grit texture & chariot track ruts
    ctx.fillStyle = 'rgba(20, 15, 10, 0.15)';
    ctx.fillRect(roadLeft + roadWidth * 0.28, 0, 24, h);
    ctx.fillRect(roadLeft + roadWidth * 0.68, 0, 24, h);
  }

  renderGroundDebris(ctx) {
    // Draw stuck arrows in ground
    for (const scuff of this.groundScuffs) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(scuff.x, scuff.y, scuff.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tactical Rally Banner / Waypoint Marker
  renderRallyPoint(ctx) {
    const tx = this.targetPos.x;
    const ty = this.targetPos.y;

    // Pulsing circle
    const pulse = 1.0 + Math.sin(this.ambientTime * 4.0) * 0.15;
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(tx, ty, 28 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Roman Vexillum Waypoint Flagpole
    ctx.fillStyle = '#8b1515';
    ctx.fillRect(tx - 2, ty - 38, 4, 38);

    // Golden Eagle finial
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(tx, ty - 40, 5, 0, Math.PI * 2);
    ctx.fill();

    // Red banner cloth
    ctx.fillStyle = '#a82020';
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty - 38);
    ctx.lineTo(tx + 22, ty - 34);
    ctx.lineTo(tx + 2, ty - 22);
    ctx.closePath();
    ctx.fill();

    // Gold SPQR on banner
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 7px serif';
    ctx.fillText('SPQR', tx + 4, ty - 28);
    ctx.restore();
  }

  renderCohortShadows(ctx) {
    ctx.fillStyle = 'rgba(10, 8, 6, 0.45)';
    for (const s of this.soldiers) {
      ctx.beginPath();
      ctx.ellipse(s.x + 3, s.y + 12, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Render Interlocked Scutum Roof for Testudo Formation
  renderTestudoRoofMesh(ctx) {
    // In Testudo, interior legionaries raise their scuta overhead creating a unified impenetrable shell
    const roofSoldiers = this.soldiers.filter(s => s.shieldStance === 'roof');
    roofSoldiers.sort((a, b) => a.y - b.y);

    for (const s of roofSoldiers) {
      const shield = s.shield;
      if (!shield) continue;
      shield.renderRoof(ctx, s);
    }

    // Connective brass rim lines showing interlocking shield clamps
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 1.5;
    for (let r = 1; r < 5; r++) {
      for (let c = 1; c < 5; c++) {
        const s = this.soldiers[r * 6 + c];
        if (s && s.shield) {
          ctx.beginPath();
          ctx.arc(s.x, s.y - 18, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  // Render Incoming and Ricocheting Ballistic Arrows
  renderArrows(ctx) {
    for (const a of this.arrows) {
      a.render(ctx);
    }
  }

  // Render Sparks & Splinters
  renderParticles(ctx) {
    for (const p of this.sparks) {
      p.render(ctx);
    }
    for (const p of this.splinters) {
      p.render(ctx);
    }
  }

  // Battlefield HUD & Tactical Telemetry
  renderHUD(ctx) {
    const ui = this.uiScale();
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    ctx.save();
    ctx.scale(ui, ui);

    // Roman Banner Emblem (Top Left)
    const bannerW = narrow ? Math.min(sw - 28, 260) : 210;
    const bannerH = narrow ? 72 : 78;
    ctx.fillStyle = 'rgba(18, 14, 10, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, 14, bannerW, bannerH, 6);
    ctx.fill();
    ctx.stroke();

    // Golden Eagle Icon
    ctx.fillStyle = '#d4af37';
    ctx.font = `bold ${narrow ? 11 : 13}px serif`;
    ctx.textAlign = 'left';
    ctx.fillText('⚡ LEGIO VI FERRATA', 24, 32);

    ctx.font = `${narrow ? 9 : 11}px sans-serif`;
    ctx.fillStyle = '#dcd0b8';
    const formName = this.formationType === 'testudo' ? 'Testudo (Roof Lock)' :
                     this.formationType === 'acies' ? (narrow ? 'Acies Triplex' : 'Acies Triplex (3 Lines)') : 'Orbis (Ring)';
    ctx.fillText(`Tactics: ${formName}`, 24, narrow ? 48 : 52);

    const statusText = this.isCharging ? '⚡ CHARGING!' : '🛡️ ADVANCE';
    ctx.fillStyle = this.isCharging ? '#ff4d4d' : '#5ac8fa';
    ctx.font = `bold ${narrow ? 10 : 11}px sans-serif`;
    ctx.fillText(statusText, 24, narrow ? 64 : 70);

    // Deflection counter
    if (!narrow) {
      const rightBoxW = 160;
      const rightBoxX = sw - rightBoxW - 14;
      ctx.fillStyle = 'rgba(18, 14, 10, 0.85)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.beginPath();
      ctx.roundRect(rightBoxX, 14, rightBoxW, 58, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 10px serif';
      ctx.fillText('PROJECTILES DEFLECTED', rightBoxX + 12, 32);

      ctx.fillStyle = '#4cd964';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${this.totalDeflected}`, rightBoxX + 12, 54);
    } else {
      const badgeW = 70;
      const badgeX = bannerW - badgeW - 6;
      ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.beginPath();
      ctx.roundRect(badgeX + 14, 20, badgeW, 40, 4);
      ctx.fill();
      ctx.fillStyle = '#4cd964';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.totalDeflected}`, badgeX + 14 + badgeW / 2, 38);
      ctx.fillStyle = '#d4af37';
      ctx.font = '8px serif';
      ctx.fillText('DEFLECTED', badgeX + 14 + badgeW / 2, 50);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  // Pointer & Touch Controls
  onMouseDown(pos) {
    if (!pos) return;
    this.initAudio();
    this.isDraggingRally = true;
    this.targetPos = { x: pos.x, y: pos.y };
  }

  onMouseMove(pos) {
    if (!pos) return;
    if (this.isDraggingRally) {
      this.targetPos = { x: pos.x, y: pos.y };
    }
  }

  onMouseUp() {
    this.isDraggingRally = false;
  }

  onKeyDown(key, e) {
    this.initAudio();
    if (key === ' ' || key === 'Spacebar') {
      // Space toggles Testudo roof raise / lower
      this.isTestudoRoofRaised = !this.isTestudoRoofRaised;
      this.addFloatingText(this.cohortPos.x, this.cohortPos.y - 50, this.isTestudoRoofRaised ? 'SCUTA LEVATE!' : 'SCUTA DEMITTITE!', '#ffd700');
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === '1') {
      this.setFormation('testudo');
    } else if (key === '2') {
      this.setFormation('acies');
    } else if (key === '3') {
      this.setFormation('orbis');
    } else if (key === 'c' || key === 'C') {
      this.triggerCharge();
    } else if (key === 'f' || key === 'F') {
      this.spawnArrowVolley(40, true);
    } else if (key === 'r' || key === 'R') {
      this.reset();
    }
  }

  onKeyUp() {}
}

// ---------------------------------------------------------------------------
// Legionary Soldier Class
// ---------------------------------------------------------------------------
class Legionary {
  constructor(id, row, col, role = 'legionary') {
    this.id = id;
    this.row = row;
    this.col = col;
    this.role = role; // 'legionary', 'centurion', 'aquilifer', 'cornicen'

    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.slotOffsetX = 0;
    this.slotOffsetY = 0;

    this.vx = 0;
    this.vy = 0;
    this.facing = -Math.PI / 2;
    this.baseFacing = -Math.PI / 2;
    this.shieldStance = 'front'; // 'front', 'left', 'right', 'rear', 'roof', 'perimeter'

    // Walk animation cadence
    this.walkCycle = Math.random() * Math.PI * 2;
    this.isMoving = false;

    // Flinch recoil from arrow deflections
    this.recoilX = 0;
    this.recoilY = 0;

    // Attached Scutum Shield
    this.shield = null;
  }

  update(dt, cohortHeading, isMarching) {
    // Spring-damped steering toward formation target slot
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    const springK = 28.0;
    const damping = 7.5;

    const ax = dx * springK - this.vx * damping;
    const ay = dy * springK - this.vy * damping;

    this.vx += ax * dt;
    this.vy += ay * dt;

    this.x += this.vx * dt + this.recoilX;
    this.y += this.vy * dt + this.recoilY;

    // Decay recoil
    this.recoilX *= Math.max(0, 1.0 - dt * 10);
    this.recoilY *= Math.max(0, 1.0 - dt * 10);

    this.isMoving = dist > 2 || isMarching;
    if (this.isMoving) {
      this.walkCycle += dt * 9.0;
    }

    // Facing angle: interpolate toward baseFacing + cohort heading
    const desiredFacing = this.baseFacing + cohortHeading + Math.PI / 2;
    let diff = desiredFacing - this.facing;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.facing += diff * Math.min(1.0, dt * 8.0);

    // Update attached shield position and orientation
    if (this.shield) {
      this.shield.update(dt, this);
    }
  }

  render(ctx, isCharging) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facing + Math.PI / 2);

    const stride = Math.sin(this.walkCycle) * (this.isMoving ? 4.5 : 0);

    // 1. Caligae Sandals (Roman military studded boots)
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(-6, 3 + stride, 4, 7);
    ctx.fillRect(2, 3 - stride, 4, 7);

    // 2. Red Wool Tunic Skirt (Tunica)
    ctx.fillStyle = '#9e1a1a';
    ctx.beginPath();
    ctx.ellipse(0, 2, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Lorica Segmentata / Squamata Plate Armor (Iron bands with gilded brass hooks)
    if (this.role === 'centurion') {
      // Centurion gilded brass cuirass (Lorica Musculata)
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Silver Phalerae medals on chest harness
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(-3, -2, 1.8, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.8, 0, Math.PI * 2);
      ctx.arc(0, 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.role === 'aquilifer') {
      // Standard bearer wears lion / bear pelt hood over shoulders
      ctx.fillStyle = '#6b4b32';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard Legionary segmented steel armor
      ctx.fillStyle = '#5c646b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brass shoulder hinges
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-7, -4, 3, 2);
      ctx.fillRect(4, -4, 3, 2);
    }

    // 4. Galea Helmet (Roman bronze/iron helmet)
    ctx.fillStyle = (this.role === 'centurion' || this.role === 'cornicen') ? '#d4af37' : '#71797e';
    ctx.beginPath();
    ctx.arc(0, -3, 5, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Brow Guard & Neck Guard
    ctx.fillStyle = '#8f979d';
    ctx.fillRect(-4, 0, 8, 2);

    // Centurion Crest (Transverse red horsehair crest — Crista Transversa)
    if (this.role === 'centurion') {
      ctx.fillStyle = '#c92222';
      ctx.fillRect(-7, -4, 14, 2.5);
      ctx.strokeStyle = '#ffe6a0';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(-7, -4, 14, 2.5);
    }

    // Aquila Standard (if Aquilifer)
    if (this.role === 'aquilifer') {
      ctx.save();
      ctx.translate(6, -6);
      // Brass staff
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-1, -18, 2, 22);
      // Golden Aquila eagle
      ctx.beginPath();
      ctx.arc(0, -20, 4, 0, Math.PI * 2);
      ctx.fill();
      // Laurel wreath
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -20, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Cornu Horn (if Cornicen)
    if (this.role === 'cornicen') {
      ctx.save();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, 0, 10, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Drawn Gladius Hispaniensis Short Sword (when charging)
    if (isCharging) {
      ctx.fillStyle = '#e0e6ed';
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(10, -14);
      ctx.lineTo(12, -2);
      ctx.closePath();
      ctx.fill();

      // Brass hilt
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(7, -2, 6, 2);
    }

    // 6. Perimeter Scutum Shield (if not roof stance)
    if (this.shield && this.shieldStance !== 'roof') {
      this.shield.renderPerimeter(ctx);
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Scutum Shield Class
// ---------------------------------------------------------------------------
class ScutumShield {
  constructor(soldier) {
    this.soldier = soldier;
    this.width = 30; // 30px width
    this.height = 16; // 16px depth in 2D top-down projection
    this.recoil = 0;
    this.dents = [];

    this.worldX = 0;
    this.worldY = 0;
  }

  update(dt, soldier) {
    this.recoil = Math.max(0, this.recoil - dt * 6.0);
    this.worldX = soldier.x;
    this.worldY = soldier.y;
  }

  addDent(localX, localY) {
    if (this.dents.length < 6) {
      this.dents.push({ x: localX * 0.4, y: localY * 0.4, r: 1.5 + Math.random() * 1.5 });
    }
  }

  getCollisionBounds() {
    const s = this.soldier;
    const isRoof = s.shieldStance === 'roof';
    return {
      cx: s.x,
      cy: s.y + (isRoof ? -14 : 0),
      radius: isRoof ? 22 : 18,
      topZ: isRoof ? 28 : 22,
      bottomZ: isRoof ? 12 : 2
    };
  }

  getNormal() {
    const s = this.soldier;
    if (s.shieldStance === 'roof') {
      // Roof shield faces mostly straight up with slight tilt along soldier facing
      const fx = Math.cos(s.facing);
      const fy = Math.sin(s.facing);
      return { x: fx * 0.15, y: fy * 0.15, z: 0.98 };
    }
    // Perimeter shield faces outward along soldier facing
    const fx = Math.cos(s.facing);
    const fy = Math.sin(s.facing);
    return { x: fx, y: fy, z: 0.35 };
  }

  // Render shield held on perimeter (facing front, flanks, or rear)
  renderPerimeter(ctx) {
    ctx.save();
    // Shield held in front of soldier body
    ctx.translate(0, -9 - this.recoil * 3);

    // Scutum Curvature gradient
    const grad = ctx.createLinearGradient(-15, 0, 15, 0);
    grad.addColorStop(0, '#751313');
    grad.addColorStop(0.2, '#a61c1c');
    grad.addColorStop(0.5, '#c92424');
    grad.addColorStop(0.8, '#a61c1c');
    grad.addColorStop(1, '#751313');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-15, -4, 30, 8, [3, 3, 2, 2]);
    ctx.fill();

    // Gilded Brass Rim Banding (Gilt bronze border)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Ornate Winged Thunderbolt (Fulgur et Aquila) Motif
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    // Left lightning wing
    ctx.moveTo(-4, 0);
    ctx.lineTo(-12, -2);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-13, 2);
    // Right lightning wing
    ctx.moveTo(4, 0);
    ctx.lineTo(12, -2);
    ctx.lineTo(8, 0);
    ctx.lineTo(13, 2);
    ctx.stroke();

    // Central Brass Umbo (Hemispherical shield boss)
    const bossGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 4);
    bossGrad.addColorStop(0, '#fff4cc');
    bossGrad.addColorStop(0.5, '#d4af37');
    bossGrad.addColorStop(1, '#7a5e12');

    ctx.fillStyle = bossGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Dents from arrow impacts
    ctx.fillStyle = 'rgba(20, 15, 10, 0.7)';
    for (const d of this.dents) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Render shield raised overhead as interlocking Testudo roof
  renderRoof(ctx, soldier) {
    ctx.save();
    ctx.translate(soldier.x, soldier.y - 16 - this.recoil * 4);
    ctx.rotate(soldier.facing + Math.PI / 2);

    // Drop shadow under overhead shield
    ctx.fillStyle = 'rgba(12, 8, 5, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-14, -10, 28, 22, 4);
    ctx.fill();

    // Overhead Scutum curved surface
    const roofGrad = ctx.createLinearGradient(-15, -12, 15, 12);
    roofGrad.addColorStop(0, '#851616');
    roofGrad.addColorStop(0.5, '#ba2323');
    roofGrad.addColorStop(1, '#851616');

    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.roundRect(-15, -12, 30, 24, 3);
    ctx.fill();

    // Gilded Rim Border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Roman Winged Thunderbolt motif
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    // Central Fulmen lightning
    ctx.moveTo(-11, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-11, 7);
    ctx.moveTo(11, -7);
    ctx.lineTo(4, 0);
    ctx.lineTo(11, 7);
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 9);
    ctx.stroke();

    // Central Brass Umbo Boss
    const umboGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 5);
    umboGrad.addColorStop(0, '#ffffff');
    umboGrad.addColorStop(0.4, '#d4af37');
    umboGrad.addColorStop(1, '#664c0a');

    ctx.fillStyle = umboGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Dents
    ctx.fillStyle = 'rgba(15, 10, 8, 0.8)';
    for (const d of this.dents) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 3D Ballistic Arrow Class
// ---------------------------------------------------------------------------
class Arrow {
  constructor(x, y, z, vx, vy, vz, gravity = 420) {
    this.x = x;
    this.y = y;
    this.z = z; // 3D altitude in px
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.gravity = gravity;

    this.active = true;
    this.ricocheted = false;
    this.stuckInGround = false;
    this.groundStickTimer = 2.8;

    this.length = 22;
    this.tumbleAngle = 0;
    this.tumbleSpeed = 0;
  }

  update(dt) {
    if (this.stuckInGround) {
      this.groundStickTimer -= dt;
      if (this.groundStickTimer <= 0) {
        this.active = false;
      }
      return;
    }

    // Ballistic integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
    this.vz -= this.gravity * dt;

    // Aerodynamic drag
    this.vx *= Math.max(0, 1.0 - dt * 0.15);
    this.vy *= Math.max(0, 1.0 - dt * 0.15);

    // Tumble if ricocheted
    if (this.ricocheted) {
      this.tumbleAngle += this.tumbleSpeed * dt;
    }

    // Ground impact
    if (this.z <= 0) {
      this.z = 0;
      if (!this.ricocheted) {
        // Arrow sticks into ground
        this.stuckInGround = true;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
      } else {
        // Ricocheted arrow skids to halt
        this.active = false;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;

    // 1. Shadow on ground at (x, y)
    const shadowAlpha = Math.max(0.1, 0.45 * (1.0 - Math.min(1.0, this.z / 250)));
    ctx.save();
    ctx.fillStyle = `rgba(15, 10, 8, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Projected Arrow in 3/4 perspective at (x, y - z)
    const projY = this.y - this.z;

    ctx.save();
    ctx.translate(this.x, projY);

    // Angle of flight tangent
    let angle = Math.atan2(this.vy - this.vz * 0.35, this.vx);
    if (this.ricocheted) {
      angle = this.tumbleAngle;
    }
    ctx.rotate(angle);

    // Arrow Shaft (Ash wood)
    ctx.strokeStyle = '#8a6543';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-this.length * 0.5, 0);
    ctx.lineTo(this.length * 0.5, 0);
    ctx.stroke();

    // Iron Bodkin Arrowhead
    ctx.fillStyle = '#b0b8c2';
    ctx.beginPath();
    ctx.moveTo(this.length * 0.5 + 4, 0);
    ctx.lineTo(this.length * 0.5, -2);
    ctx.lineTo(this.length * 0.5, 2);
    ctx.closePath();
    ctx.fill();

    // Goose Feather Fletching (Crimson / White)
    ctx.fillStyle = this.ricocheted ? '#ff5533' : '#e6dfd5';
    ctx.beginPath();
    ctx.moveTo(-this.length * 0.5, 0);
    ctx.lineTo(-this.length * 0.5 - 4, -2.5);
    ctx.lineTo(-this.length * 0.5 + 2, 0);
    ctx.lineTo(-this.length * 0.5 - 4, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Particle Class for Sparks & Wood Splinters
// ---------------------------------------------------------------------------
class Particle {
  constructor(x, y, vx, vy, type = 'spark') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'spark', 'wood', 'dust'

    this.life = 1.0;
    this.maxLife = type === 'spark' ? 0.35 + Math.random() * 0.25 : 0.6 + Math.random() * 0.4;
    this.active = true;
    this.size = type === 'wood' ? 2.5 + Math.random() * 2 : 1.5 + Math.random() * 1.5;
  }

  update(dt) {
    this.life -= dt / this.maxLife;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.type === 'spark') {
      this.vy += 220 * dt; // Gravity
      this.vx *= Math.max(0, 1.0 - dt * 2.0);
    } else if (this.type === 'wood') {
      this.vy += 320 * dt;
    } else if (this.type === 'dust') {
      this.vy -= 15 * dt;
      this.vx *= 0.95;
    }
  }

  render(ctx) {
    if (!this.active) return;
    const alpha = Math.max(0, this.life);

    ctx.save();
    if (this.type === 'spark') {
      ctx.fillStyle = `rgba(255, ${Math.floor(180 * alpha + 75)}, 50, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'wood') {
      ctx.fillStyle = `rgba(138, 92, 53, ${alpha})`;
      ctx.fillRect(this.x, this.y, this.size, this.size * 0.6);
    } else if (this.type === 'dust') {
      ctx.fillStyle = `rgba(160, 140, 120, ${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (2.0 - alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Floating Battle Cry Text
// ---------------------------------------------------------------------------
class FloatingText {
  constructor(x, y, text, color = '#ffd700') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.active = true;
  }

  update(dt) {
    this.life -= dt * 0.9;
    this.y -= dt * 24;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
