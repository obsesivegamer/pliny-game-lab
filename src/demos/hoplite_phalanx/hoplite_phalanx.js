// Hoplite Phalanx (Othismos Push Dynamics)
// Ancient Greek Heavy Infantry Crowd Physics & Collective Wave Shock
// Grounded in Thucydides, Xenophon, and Epaminondas' Oblique Order (Leuctra, 371 BC)
// Zero external dependencies — pure ES module

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class HoplitePhalanxEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Scale
    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    attachTouchBridge(this, canvas);

    // Simulation Parameters (Tunable via UI)
    this.ranksDepth = 8;             // 4, 8, 16 ranks (or 32 for Epaminondas oblique mode)
    this.filesCount = 14;            // Number of soldiers across the front line
    this.othismosPushForce = 220.0;  // Base push force per hoplite (N / simulated units)
    this.formationCohesion = 0.78;   // Spring tension binding files and ranks
    this.rightwardDrift = 0.35;      // Historical rightward drift tendency (Thucydides 5.71)
    this.spearHedgeLowered = true;   // True = 3 ranks of lowered spears; False = locked shield shove
    this.showHeatmap = true;         // Dynamic compressive pressure heatmap overlay
    this.showForceVectors = true;    // Force transmission arrows through the ranks
    this.showShieldBorders = true;   // Shield wall outline & overlap links
    this.isAsymmetricEpaminondas = false; // Theban 32-deep shock column vs Spartan 8-deep line

    // Dynamic State
    this.time = 0;
    this.spartanShoveTimer = 0;      // Active Mass Shove heave duration
    this.thebanShoveTimer = 0;
    this.spartanShoveCooldown = 0;
    this.battleLineOffset = 0;       // Center displacement (px): >0 Spartan advance, <0 Theban advance
    this.battleLineVelocity = 0;
    this.spartanTotalPressure = 0;   // Aggregate front-line pressure
    this.thebanTotalPressure = 0;
    this.spartanCasualties = 0;
    this.thebanCasualties = 0;
    this.battleStatus = 'CLASH OF BRONZE'; // Tactical HUD banner text

    // Entities
    this.spartans = [];              // Red / Lakedaimonian Hoplites
    this.thebans = [];               // Blue / Theban Sacred Band Hoplites
    this.spears = [];                // All active dory spears
    this.pressureNodes = [];         // 2D grid of pressure vector nodes
    this.particles = [];             // Dust, sparks, blood, floating texts, shockwave rings
    this.javelins = [];              // Peltast missile skirmish projectiles

    // Input & Interaction
    this.isMouseDown = false;
    this.mousePos = { x: 400, y: 300 };
    this.selectedHoplite = null;
    this.commandTarget = null;
    this.keys = {
      w: false, s: false, a: false, d: false,
      ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
      Space: false, Shift: false
    };

    // Pressure Grid Configuration
    this.gridCols = 32;
    this.gridRows = 20;
    this.initPressureGrid();

    // Sound Synthesizer (Safe Web Audio)
    this.audioCtx = null;

    // Initialize UI Controls & Simulation Armies
    this.initControls();
    this.reset();
  }

  /* -------------------------------------------------------------------------- */
  /* SAFE WEB AUDIO SYNTHESIZER                                                 */
  /* -------------------------------------------------------------------------- */

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
    if (!this.audioCtx) {
      this.initAudio();
    }
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    try {
      if (type === 'shove') {
        // Deep collective heave: filtered low-frequency rumble + roar
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(85, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.35);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      } else if (type === 'shield_clash') {
        // Bronze-on-bronze shield impact clang
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.18);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } else if (type === 'spear_jab') {
        // High metallic spear deflecting tick / jab
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(780, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      } else if (type === 'rout') {
        // Brass trumpet / salpinx war horn blast
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.linearRampToValueAtTime(390, t + 0.25);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
      }
    } catch {
      // Audio fallback silent
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION & FORMATION GENERATION                                      */
  /* -------------------------------------------------------------------------- */

  initPressureGrid() {
    this.pressureNodes = [];
    const cellW = this.width / this.gridCols;
    const cellH = this.height / this.gridRows;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        this.pressureNodes.push({
          x: (c + 0.5) * cellW,
          y: (r + 0.5) * cellH,
          pressure: 0,
          fx: 0,
          fy: 0,
          colorAlpha: 0
        });
      }
    }
  }

  buildArmies() {
    this.spartans = [];
    this.thebans = [];
    this.spears = [];
    this.particles = [];
    this.javelins = [];

    const midY = this.height * 0.5;
    const clashX = this.width * 0.5;
    const fileSpacing = 27.0; // Distance between adjacent files (along Y)
    const rankSpacing = 26.0; // Distance between adjacent ranks (along X)
    const totalFiles = this.filesCount;
    const startY = midY - ((totalFiles - 1) * fileSpacing) * 0.5;

    // Spartan Army (Red, advances East toward +X)
    const spartanRanks = this.ranksDepth;
    const spartanFrontX = clashX - 42.0;

    let idCounter = 1;
    for (let f = 0; f < totalFiles; f++) {
      for (let r = 0; r < spartanRanks; r++) {
        const slotX = spartanFrontX - (r * rankSpacing);
        const slotY = startY + (f * fileSpacing);

        const hoplite = this.createHoplite({
          id: idCounter++,
          side: 'spartan',
          rank: r,
          file: f,
          x: slotX - (Math.random() * 6),
          y: slotY + (Math.random() - 0.5) * 4,
          slotX,
          slotY,
          facing: 0.0, // Radians: 0 = East
          colorTunic: '#901a1e', // Spartan Crimson
          colorBronze: '#d4af37', // Polished Bronze
          colorRim: '#5c1012',
          emblem: 'lambda' // Golden Lambda (Λ)
        });

        this.spartans.push(hoplite);
        if (hoplite.spear) this.spears.push(hoplite.spear);
      }
    }

    // Theban Army (Blue, advances West toward -X)
    // In Epaminondas mode, Theban left wing (lower files) is stacked 32 ranks deep!
    const thebanFrontX = clashX + 42.0;

    for (let f = 0; f < totalFiles; f++) {
      let ranksForFile = this.ranksDepth;
      if (this.isAsymmetricEpaminondas) {
        // Epaminondas Oblique Order: Left wing (higher file indices) stacked up to 28 ranks!
        const weight = (f / (totalFiles - 1));
        ranksForFile = Math.min(32, Math.floor(8 + (weight * 22)));
      }

      for (let r = 0; r < ranksForFile; r++) {
        const slotX = thebanFrontX + (r * rankSpacing);
        const slotY = startY + (f * fileSpacing);

        const hoplite = this.createHoplite({
          id: idCounter++,
          side: 'theban',
          rank: r,
          file: f,
          x: slotX + (Math.random() * 6),
          y: slotY + (Math.random() - 0.5) * 4,
          slotX,
          slotY,
          facing: Math.PI, // Radians: Pi = West
          colorTunic: '#1b3b6f', // Theban Royal Indigo
          colorBronze: '#c9933b', // Boeotian Bronze
          colorRim: '#0d1f3d',
          emblem: 'club' // Boeotian Heraklean Club / Delta
        });

        this.thebans.push(hoplite);
        if (hoplite.spear) this.spears.push(hoplite.spear);
      }
    }
  }

  createHoplite(cfg) {
    const isFront3 = cfg.rank < 3;
    // Dory Spear: Ranks 0, 1, 2 project forward over shields
    // Rank 0: 42px reach, Rank 1: 52px reach, Rank 2: 62px reach
    const spearReach = isFront3 ? 42 + (cfg.rank * 10) : 34;

    const hoplite = {
      id: cfg.id,
      side: cfg.side,
      rank: cfg.rank,
      file: cfg.file,
      x: cfg.x,
      y: cfg.y,
      vx: 0,
      vy: 0,
      slotX: cfg.slotX,
      slotY: cfg.slotY,
      radius: 12.5,
      shieldRadius: 13.0,
      facing: cfg.facing,
      shieldAngle: cfg.facing,
      colorTunic: cfg.colorTunic,
      colorBronze: cfg.colorBronze,
      colorRim: cfg.colorRim,
      emblem: cfg.emblem,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      morale: 100,
      pressure: 0,
      pressureFx: 0,
      pressureFy: 0,
      isAlive: true,
      isRouted: false,
      isShoving: false,
      shoveCooldown: 0,
      thrustCooldown: Math.random() * 0.5,
      thrustOffset: 0,
      wobbleOffset: Math.random() * Math.PI * 2,
      spear: null
    };

    // Instantiate attached dory spear
    hoplite.spear = {
      owner: hoplite,
      baseReach: spearReach,
      currentReach: spearReach,
      isLowered: isFront3 && this.spearHedgeLowered,
      tipX: 0,
      tipY: 0,
      angle: cfg.facing
    };

    return hoplite;
  }

  /* -------------------------------------------------------------------------- */
  /* CONTROLS UI CREATION & EVENT LISTENERS                                     */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Phalanx Formation Depth</label>
        <div class="control-btn-grid" id="phalanx-depth-selector">
          <button class="sub-btn ${this.ranksDepth === 4 && !this.isAsymmetricEpaminondas ? 'active' : ''}" data-depth="4">4 Ranks (Broad)</button>
          <button class="sub-btn ${this.ranksDepth === 8 && !this.isAsymmetricEpaminondas ? 'active' : ''}" data-depth="8">8 Ranks (Standard)</button>
          <button class="sub-btn ${this.ranksDepth === 16 && !this.isAsymmetricEpaminondas ? 'active' : ''}" data-depth="16">16 Ranks (Shock)</button>
          <button class="sub-btn ${this.isAsymmetricEpaminondas ? 'active' : ''}" data-depth="epaminondas" title="Leuctra 371 BC: 32-Deep Theban Wedge">⚡ Epaminondas</button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>Othismos Push Force</span>
          <span id="val-push-force">${this.othismosPushForce.toFixed(0)} N</span>
        </label>
        <input type="range" id="slider-push-force" min="80" max="450" step="10" value="${this.othismosPushForce}">
      </div>

      <div class="control-group">
        <label>
          <span>Formation Cohesion (Synaspismos)</span>
          <span id="val-cohesion">${(this.formationCohesion * 100).toFixed(0)}%</span>
        </label>
        <input type="range" id="slider-cohesion" min="0.3" max="1.0" step="0.05" value="${this.formationCohesion}">
      </div>

      <div class="control-group">
        <label>
          <span>Rightward Phalanx Drift (Thucydides)</span>
          <span id="val-drift">${(this.rightwardDrift * 100).toFixed(0)}%</span>
        </label>
        <input type="range" id="slider-drift" min="0.0" max="0.8" step="0.05" value="${this.rightwardDrift}">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
        <button id="btn-mass-shove" class="sub-btn" style="background: rgba(212, 175, 55, 0.25); border-color: #d4af37; font-weight: bold; padding: 8px;">
          ⚡ Mass Shove! — ὠθισμός (Space)
        </button>
        <button id="btn-toggle-spears" class="sub-btn" style="background: rgba(59, 214, 198, 0.2); border-color: #3bd6c6; font-weight: bold; padding: 8px;">
          🛡️ Lower Spear Hedge: 3 Ranks (Shift)
        </button>
        <button id="btn-skirmish" class="sub-btn" style="background: rgba(200, 50, 50, 0.2); border-color: #c83232; font-weight: 500; padding: 8px;">
          🏹 Peltast Javelin Volley (F)
        </button>
        <button id="btn-reset-battle" class="sub-btn" style="background: rgba(255, 255, 255, 0.05); border-color: rgba(255,255,255,0.2); font-weight: 500; padding: 7px;">
          ↺ Reset Battle Line (R)
        </button>
      </div>

      <div class="control-group" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">Compressive Heatmap</span>
          <input type="checkbox" id="chk-heatmap" ${this.showHeatmap ? 'checked' : ''} style="cursor: pointer;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">Force Transmission Vectors</span>
          <input type="checkbox" id="chk-vectors" ${this.showForceVectors ? 'checked' : ''} style="cursor: pointer;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">Shield Overlap Borders</span>
          <input type="checkbox" id="chk-borders" ${this.showShieldBorders ? 'checked' : ''} style="cursor: pointer;">
        </div>
      </div>

      <div class="control-group" style="font-size: 0.76rem; line-height: 1.4; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
        <div><strong>Tactical Guide:</strong> Rear ranks lean into front shields, generating a cumulative pressure wave. Click to command battle focus.</div>
      </div>
    `;

    // Bind Depth Selector Buttons
    const depthBtns = this.controlsContainer.querySelectorAll('#phalanx-depth-selector button');
    depthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        depthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const depthVal = btn.dataset.depth;
        if (depthVal === 'epaminondas') {
          this.isAsymmetricEpaminondas = true;
          this.ranksDepth = 8;
        } else {
          this.isAsymmetricEpaminondas = false;
          this.ranksDepth = parseInt(depthVal, 10);
        }
        this.reset();
      });
    });

    // Bind Push Force Slider
    const sliderPush = this.controlsContainer.querySelector('#slider-push-force');
    const valPush = this.controlsContainer.querySelector('#val-push-force');
    if (sliderPush) {
      sliderPush.addEventListener('input', (e) => {
        this.othismosPushForce = parseFloat(e.target.value);
        if (valPush) valPush.textContent = `${this.othismosPushForce.toFixed(0)} N`;
      });
    }

    // Bind Cohesion Slider
    const sliderCohesion = this.controlsContainer.querySelector('#slider-cohesion');
    const valCohesion = this.controlsContainer.querySelector('#val-cohesion');
    if (sliderCohesion) {
      sliderCohesion.addEventListener('input', (e) => {
        this.formationCohesion = parseFloat(e.target.value);
        if (valCohesion) valCohesion.textContent = `${(this.formationCohesion * 100).toFixed(0)}%`;
      });
    }

    // Bind Rightward Drift Slider
    const sliderDrift = this.controlsContainer.querySelector('#slider-drift');
    const valDrift = this.controlsContainer.querySelector('#val-drift');
    if (sliderDrift) {
      sliderDrift.addEventListener('input', (e) => {
        this.rightwardDrift = parseFloat(e.target.value);
        if (valDrift) valDrift.textContent = `${(this.rightwardDrift * 100).toFixed(0)}%`;
      });
    }

    // Action Buttons
    const btnMassShove = this.controlsContainer.querySelector('#btn-mass-shove');
    if (btnMassShove) {
      btnMassShove.addEventListener('click', () => this.triggerMassShove('spartan'));
    }

    const btnToggleSpears = this.controlsContainer.querySelector('#btn-toggle-spears');
    if (btnToggleSpears) {
      btnToggleSpears.addEventListener('click', () => this.toggleSpearHedge());
    }

    const btnSkirmish = this.controlsContainer.querySelector('#btn-skirmish');
    if (btnSkirmish) {
      btnSkirmish.addEventListener('click', () => this.triggerSkirmishVolley());
    }

    const btnResetBattle = this.controlsContainer.querySelector('#btn-reset-battle');
    if (btnResetBattle) {
      btnResetBattle.addEventListener('click', () => this.reset());
    }

    // Toggles
    const chkHeatmap = this.controlsContainer.querySelector('#chk-heatmap');
    if (chkHeatmap) {
      chkHeatmap.addEventListener('change', (e) => {
        this.showHeatmap = e.target.checked;
      });
    }

    const chkVectors = this.controlsContainer.querySelector('#chk-vectors');
    if (chkVectors) {
      chkVectors.addEventListener('change', (e) => {
        this.showForceVectors = e.target.checked;
      });
    }

    const chkBorders = this.controlsContainer.querySelector('#chk-borders');
    if (chkBorders) {
      chkBorders.addEventListener('change', (e) => {
        this.showShieldBorders = e.target.checked;
      });
    }
  }

  updateSpearButtonText() {
    if (!this.controlsContainer) return;
    const btn = this.controlsContainer.querySelector('#btn-toggle-spears');
    if (btn) {
      if (this.spearHedgeLowered) {
        btn.textContent = '🛡️ Lower Spear Hedge: 3 Ranks (Shift)';
        btn.style.borderColor = '#3bd6c6';
      } else {
        btn.textContent = '🛡️ Locked Shield Wall (Synaspismos)';
        btn.style.borderColor = '#d4af37';
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* TACTICAL ABILITIES & ACTIONS                                               */
  /* -------------------------------------------------------------------------- */

  triggerMassShove(side = 'spartan') {
    this.initAudio();
    if (side === 'spartan') {
      this.spartanShoveTimer = 2.4; // 2.4 seconds synchronized push surge
      this.playSound('shove');
      this.spawnShockwave(this.width * 0.5 - 50, this.height * 0.5, '#d4af37');
      this.spawnFloatingText(this.width * 0.38, this.height * 0.3, 'ALALA! (ὠθισμός!)', '#ffd700');
    } else {
      this.thebanShoveTimer = 2.4;
      this.playSound('shove');
      this.spawnShockwave(this.width * 0.5 + 50, this.height * 0.5, '#48cae4');
      this.spawnFloatingText(this.width * 0.62, this.height * 0.3, 'SACRED BAND HEAVE!', '#70d6ff');
    }
  }

  toggleSpearHedge() {
    this.spearHedgeLowered = !this.spearHedgeLowered;
    this.updateSpearButtonText();
    this.playSound('spear_jab');

    const label = this.spearHedgeLowered ? 'SPEAR HEDGE LOWERED' : 'SYNASPISMOS LOCKED';
    this.spawnFloatingText(this.width * 0.5, this.height * 0.22, label, '#3bd6c6');

    // Update hoplite spears
    for (const h of this.spartans) {
      if (h.spear && h.rank < 3) h.spear.isLowered = this.spearHedgeLowered;
    }
    for (const h of this.thebans) {
      if (h.spear && h.rank < 3) h.spear.isLowered = this.spearHedgeLowered;
    }
  }

  triggerSkirmishVolley() {
    this.initAudio();
    this.playSound('spear_jab');
    const midY = this.height * 0.5;

    // Spartan peltasts cast javelins from top/bottom left
    for (let i = 0; i < 7; i++) {
      const startX = this.width * 0.15 + (Math.random() * 80);
      const startY = i % 2 === 0 ? 80 + Math.random() * 40 : this.height - 100 + Math.random() * 40;
      const targetX = this.width * 0.5 + 20 + Math.random() * 80;
      const targetY = midY + (Math.random() - 0.5) * 160;

      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy);
      const speed = 360 + Math.random() * 60;

      this.javelins.push({
        x: startX,
        y: startY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        angle: Math.atan2(dy, dx),
        side: 'spartan',
        life: 1.6
      });
    }

    this.spawnFloatingText(this.width * 0.25, 100, 'PELTAST JAVELINS!', '#ffd700');
  }

  spawnShockwave(x, y, color) {
    this.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 12,
      maxRadius: 180,
      color,
      alpha: 0.85,
      life: 0.6,
      maxLife: 0.6
    });
  }

  spawnDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 22,
        vy: (Math.random() - 0.5) * 22,
        radius: 2 + Math.random() * 3.5,
        alpha: 0.6,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4
      });
    }
  }

  spawnSparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 110;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 1.2 + Math.random() * 1.5,
        color: Math.random() > 0.3 ? '#ffda79' : '#ffffff',
        alpha: 1.0,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45
      });
    }
  }

  spawnBlood(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 60;
      this.particles.push({
        type: 'blood',
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 1.5 + Math.random() * 2.0,
        alpha: 0.9,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1
      });
    }
  }

  spawnFloatingText(x, y, text, color = '#ffd700') {
    this.particles.push({
      type: 'text',
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -28,
      life: 1.4,
      maxLife: 1.4
    });
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE & CONTRACT METHODS                                               */
  /* -------------------------------------------------------------------------- */

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.initPressureGrid();
    this.buildArmies();
  }

  getEntityCount() {
    // Entities: Hoplites + Active Spears + Pressure Vector Nodes + Active FX Particles
    const activeSpartans = this.spartans.length;
    const activeThebans = this.thebans.length;
    const spearsCount = this.spears.length;
    const gridNodesCount = this.pressureNodes.length;
    const particlesCount = this.particles.length + this.javelins.length;

    return activeSpartans + activeThebans + spearsCount + gridNodesCount + particlesCount;
  }

  reset() {
    this.time = 0;
    this.spartanShoveTimer = 0;
    this.thebanShoveTimer = 0;
    this.battleLineOffset = 0;
    this.battleLineVelocity = 0;
    this.spartanCasualties = 0;
    this.thebanCasualties = 0;
    this.selectedHoplite = null;
    this.commandTarget = null;
    this.battleStatus = 'ENGAGING IN SYNASPISMOS';

    this.buildArmies();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING                                                             */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };

    // Check click on hoplites
    let closest = null;
    let minDist = 24.0;
    const all = [...this.spartans, ...this.thebans];
    for (const h of all) {
      const d = Math.hypot(h.x - pos.x, h.y - pos.y);
      if (d < minDist) {
        minDist = d;
        closest = h;
      }
    }

    if (closest) {
      this.selectedHoplite = closest;
      this.commandTarget = null;
      this.playSound('shield_clash');
    } else {
      this.selectedHoplite = null;
      this.commandTarget = { x: pos.x, y: pos.y };
      // Tactical shove focus ping
      this.spawnShockwave(pos.x, pos.y, '#3bd6c6');
    }
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };
    if (this.isMouseDown && this.commandTarget) {
      this.commandTarget = { x: pos.x, y: pos.y };
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      if (e && e.preventDefault) e.preventDefault();
      this.triggerMassShove('spartan');
    }
    if (key === 'Shift') {
      this.toggleSpearHedge();
    }
    if (key === 'f' || key === 'F') {
      this.triggerSkirmishVolley();
    }
    if (key === 'r' || key === 'R') {
      this.reset();
    }

    // Advance / Shove control
    if (key === 'w' || key === 'W' || key === 'ArrowUp') this.keys.w = true;
    if (key === 's' || key === 'S' || key === 'ArrowDown') this.keys.s = true;
    if (key === 'a' || key === 'A' || key === 'ArrowLeft') this.keys.a = true;
    if (key === 'd' || key === 'D' || key === 'ArrowRight') this.keys.d = true;
  }

  onKeyUp(key, e) {
    if (key === 'w' || key === 'W' || key === 'ArrowUp') this.keys.w = false;
    if (key === 's' || key === 'S' || key === 'ArrowDown') this.keys.s = false;
    if (key === 'a' || key === 'A' || key === 'ArrowLeft') this.keys.a = false;
    if (key === 'd' || key === 'D' || key === 'ArrowRight') this.keys.d = false;
  }

  /* -------------------------------------------------------------------------- */
  /* PHYSICS ENGINE: OTHISMOS, CROWD FORCES, AND SPEAR COMBAT                   */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    // Clamp delta time to maintain stability
    dt = Math.min(dt, 0.04);
    this.time += dt;

    // Manage shove timers
    if (this.spartanShoveTimer > 0) this.spartanShoveTimer -= dt;
    if (this.thebanShoveTimer > 0) this.thebanShoveTimer -= dt;

    // AI periodic counter-heave
    if (this.thebanShoveTimer <= 0 && Math.random() < 0.008) {
      this.triggerMassShove('theban');
    }

    // 1. Calculate Individual & Collective Cumulative Othismos Pressures
    this.calculateOthismosPressure(dt);

    // 2. Resolve Multi-Agent Crowd Physics (Repulsion, Cohesion, Shield Wall Overlap)
    this.updatePhalanxUnits(this.spartans, 'spartan', dt);
    this.updatePhalanxUnits(this.thebans, 'theban', dt);

    // 3. Resolve Clash Line Collisions (Spartan Front Rank vs Theban Front Rank)
    this.resolveClashCollisions(dt);

    // 4. Update Lowered Dory Spears & Combat Thrusts
    this.updateSpears(dt);

    // 5. Update Skirmish Javelins
    this.updateJavelins(dt);

    // 6. Update Pressure Heatmap & Vector Field Grid
    this.updatePressureGrid(dt);

    // 7. Update FX Particles (Dust, Sparks, Blood, Shockwaves, Floaters)
    this.updateParticles(dt);

    // 8. Update Tactical HUD Status & Morale Checks
    this.updateBattleStatus();
  }

  calculateOthismosPressure(dt) {
    // Compressive wave transmission from rear ranks to front ranks
    // Rank N-1 pushes into Rank N-2, which pushes into Rank N-3... peaking at Rank 0!
    const spartanShoveMul = this.spartanShoveTimer > 0 ? 2.6 : 1.0;
    const thebanShoveMul = this.thebanShoveTimer > 0 ? 2.6 : 1.0;
    const spearPushBonus = !this.spearHedgeLowered ? 1.5 : 1.0; // Locked shields push 50% harder!

    // Reset base pressures
    for (const h of this.spartans) {
      h.pressure = (this.othismosPushForce * spartanShoveMul * spearPushBonus * (h.stamina / 100)) * (1.0 + Math.sin(this.time * 3 + h.rank) * 0.08);
      h.pressureFx = Math.cos(h.facing) * h.pressure;
      h.pressureFy = Math.sin(h.facing) * h.pressure;
    }
    for (const h of this.thebans) {
      h.pressure = (this.othismosPushForce * thebanShoveMul * spearPushBonus * (h.stamina / 100)) * (1.0 + Math.sin(this.time * 3 + h.rank) * 0.08);
      h.pressureFx = Math.cos(h.facing) * h.pressure;
      h.pressureFy = Math.sin(h.facing) * h.pressure;
    }

    // Propagate forward through files for Spartans (advance +X, from highest rank to rank 0)
    for (let f = 0; f < this.filesCount; f++) {
      const fileSpartans = this.spartans.filter(h => h.file === f && h.isAlive).sort((a, b) => b.rank - a.rank);
      for (let i = 0; i < fileSpartans.length - 1; i++) {
        const rear = fileSpartans[i];
        const front = fileSpartans[i + 1];
        const dist = Math.hypot(front.x - rear.x, front.y - rear.y);
        if (dist < rear.radius * 2 + 16.0) {
          // Compressible forward impulse transfer
          const transferRatio = this.formationCohesion * 0.95;
          front.pressure += rear.pressure * transferRatio;
          front.pressureFx += rear.pressureFx * transferRatio;
          front.pressureFy += rear.pressureFy * transferRatio;
        }
      }
    }

    // Propagate forward through files for Thebans (advance -X, from highest rank to rank 0)
    for (let f = 0; f < this.filesCount; f++) {
      const fileThebans = this.thebans.filter(h => h.file === f && h.isAlive).sort((a, b) => b.rank - a.rank);
      for (let i = 0; i < fileThebans.length - 1; i++) {
        const rear = fileThebans[i];
        const front = fileThebans[i + 1];
        const dist = Math.hypot(front.x - rear.x, front.y - rear.y);
        if (dist < rear.radius * 2 + 16.0) {
          const transferRatio = this.formationCohesion * 0.95;
          front.pressure += rear.pressure * transferRatio;
          front.pressureFx += rear.pressureFx * transferRatio;
          front.pressureFy += rear.pressureFy * transferRatio;
        }
      }
    }

    // Aggregate front rank 0 pressures
    const spartanRank0 = this.spartans.filter(h => h.rank === 0 && h.isAlive);
    const thebanRank0 = this.thebans.filter(h => h.rank === 0 && h.isAlive);

    this.spartanTotalPressure = spartanRank0.reduce((acc, h) => acc + h.pressure, 0);
    this.thebanTotalPressure = thebanRank0.reduce((acc, h) => acc + h.pressure, 0);
  }

  updatePhalanxUnits(units, side, dt) {
    const isSpartan = side === 'spartan';
    const driftSign = isSpartan ? 1.0 : -1.0;

    // Steer push via keys if player controls Spartans
    let manualX = 0;
    let manualY = 0;
    if (isSpartan) {
      if (this.keys.d) manualX += 45;
      if (this.keys.a) manualX -= 45;
      if (this.keys.s) manualY += 35;
      if (this.keys.w) manualY -= 35;
    }

    for (let i = 0; i < units.length; i++) {
      const h = units[i];
      if (!h.isAlive) continue;

      // 1. Formation Anchor Spring (Cohesion to target rank/file slot)
      const dynamicSlotX = h.slotX + this.battleLineOffset;
      const dynamicSlotY = h.slotY;

      const toSlotX = dynamicSlotX - h.x;
      const toSlotY = dynamicSlotY - h.y;
      const springK = 35.0 * this.formationCohesion;

      let fx = toSlotX * springK;
      let fy = toSlotY * springK;

      // 2. Forward Push Force
      const pushMag = h.pressure * 0.12;
      fx += Math.cos(h.facing) * pushMag;
      fy += Math.sin(h.facing) * pushMag;

      // 3. Historical Rightward Drift (Thucydides 5.71)
      // Soldiers naturally drift rightward to tuck behind their right comrade's shield
      const driftMag = 18.0 * this.rightwardDrift;
      fy += driftSign * driftMag;

      // 4. Command Point Pull
      if (isSpartan && this.commandTarget) {
        const cdx = this.commandTarget.x - h.x;
        const cdy = this.commandTarget.y - h.y;
        const cdist = Math.hypot(cdx, cdy);
        if (cdist > 10) {
          fx += (cdx / cdist) * 40.0;
          fy += (cdy / cdist) * 40.0;
        }
      }

      // Add manual control bias
      fx += manualX;
      fy += manualY;

      // 5. Intra-Phalanx Interpenetration Repulsion & Shield Overlap (Synaspismos)
      for (let j = 0; j < units.length; j++) {
        if (i === j) continue;
        const o = units[j];
        if (!o.isAlive) continue;

        const dx = h.x - o.x;
        const dy = h.y - o.y;
        const dist = Math.hypot(dx, dy);
        const minDist = h.radius + o.radius;

        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          const repulse = (overlap / dist) * 180.0;
          fx += dx * repulse;
          fy += dy * repulse;
        }

        // Aspis shield interlocking: adjacent file comrade on the left
        // The aspis shield covers the left half of the bearer and right half of the neighbor
        if (h.rank === o.rank && h.file === o.file - 1) {
          // Optimal shield overlap spacing ~24px
          const idealShieldDist = 24.0;
          const shieldDiff = dist - idealShieldDist;
          // Spring pull to keep shield-wall locked without gaps
          const interlockForce = -shieldDiff * 15.0 * this.formationCohesion;
          fx += (dx / dist) * interlockForce;
          fy += (dy / dist) * interlockForce;
        }
      }

      // Integration (Verlet / Semi-implicit Euler)
      const mass = 1.0 + (h.pressure * 0.002);
      h.vx += (fx / mass) * dt;
      h.vy += (fy / mass) * dt;

      // Damping
      h.vx *= Math.pow(0.82, dt * 60);
      h.vy *= Math.pow(0.82, dt * 60);

      h.x += h.vx * dt;
      h.y += h.vy * dt;

      // Dynamic shield angle: faces forward with natural breathing & compression deflection
      const targetAngle = isSpartan ? 0.0 : Math.PI;
      const angleWobble = Math.sin(this.time * 2.5 + h.wobbleOffset) * 0.05;
      h.shieldAngle += (targetAngle + angleWobble - h.shieldAngle) * 0.1;

      // Footstep dust
      if (Math.hypot(h.vx, h.vy) > 12 && Math.random() < 0.05) {
        this.spawnDust(h.x, h.y, 1);
      }
    }
  }

  resolveClashCollisions(dt) {
    // The violent interface where Spartan rank 0 meets Theban rank 0
    const spartanRank0 = this.spartans.filter(h => h.rank === 0 && h.isAlive);
    const thebanRank0 = this.thebans.filter(h => h.rank === 0 && h.isAlive);

    let clashCount = 0;

    for (let i = 0; i < spartanRank0.length; i++) {
      const s = spartanRank0[i];
      for (let j = 0; j < thebanRank0.length; j++) {
        const t = thebanRank0[j];

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.hypot(dx, dy);
        const shieldContactDist = s.shieldRadius + t.shieldRadius + 4.0;

        if (dist < shieldContactDist && dist > 0.001) {
          clashCount++;
          const overlap = shieldContactDist - dist;

          // Normal contact repulsion force
          const normalX = dx / dist;
          const normalY = dy / dist;
          const contactSpring = 520.0;

          s.vx -= normalX * overlap * contactSpring * dt;
          s.vy -= normalY * overlap * contactSpring * dt;
          t.vx += normalX * overlap * contactSpring * dt;
          t.vy += normalY * overlap * contactSpring * dt;

          // Clashing sparks & dust
          if (Math.random() < 0.08) {
            const midX = (s.x + t.x) * 0.5;
            const midY = (s.y + t.y) * 0.5;
            this.spawnSparks(midX, midY, 2);
            this.spawnDust(midX, midY, 1);
            if (Math.random() < 0.03) this.playSound('shield_clash');
          }
        }
      }
    }

    // Net battle line shift: driven by the difference in collective othismos push force
    if (clashCount > 0) {
      const netPushDelta = (this.spartanTotalPressure - this.thebanTotalPressure);
      const pushAcceleration = (netPushDelta * 0.00045);

      this.battleLineVelocity += pushAcceleration * dt;
      this.battleLineVelocity *= Math.pow(0.88, dt * 60); // Friction of thousands of hobnailed sandals
      this.battleLineOffset += this.battleLineVelocity * dt * 45.0;

      // Bound battle line displacement
      this.battleLineOffset = Math.max(-180, Math.min(180, this.battleLineOffset));
    }
  }

  updateSpears(dt) {
    // 3 Ranks of bristling dory spears
    for (const h of [...this.spartans, ...this.thebans]) {
      const spear = h.spear;
      if (!spear || !h.isAlive) continue;

      const isSpartan = h.side === 'spartan';
      const enemies = isSpartan ? this.thebans : this.spartans;

      // Thrust cycle animation
      h.thrustCooldown -= dt;
      if (h.thrustCooldown <= 0) {
        h.thrustCooldown = 0.8 + Math.random() * 0.6;
        h.thrustOffset = 10.0 + Math.random() * 8.0; // Piston thrust forward
      }
      h.thrustOffset += (0 - h.thrustOffset) * 0.12;

      // Calculate spear position
      // Spear rests in right hand (offset from center)
      const handOffsetY = isSpartan ? 6.0 : -6.0;
      const originX = h.x + Math.cos(h.shieldAngle) * 6;
      const originY = h.y + handOffsetY;

      // Lowered dory vs upright spear
      if (spear.isLowered && h.rank < 3) {
        spear.angle = h.shieldAngle + (Math.sin(this.time * 4 + h.wobbleOffset) * 0.04);
        const reach = spear.baseReach + h.thrustOffset;
        spear.tipX = originX + Math.cos(spear.angle) * reach;
        spear.tipY = originY + Math.sin(spear.angle) * reach;

        // Combat collision: check if spear tip punctures enemy front rank
        if (h.thrustOffset > 6.0) {
          for (const enemy of enemies) {
            if (!enemy.isAlive || enemy.rank > 1) continue;

            const tipDist = Math.hypot(enemy.x - spear.tipX, enemy.y - spear.tipY);
            if (tipDist < enemy.shieldRadius + 3.0) {
              // Spear strike!
              // 70% chance shield deflects; 30% chance penetrating strike
              const isDeflected = Math.random() < 0.72;
              if (isDeflected) {
                this.spawnSparks(spear.tipX, spear.tipY, 3);
                enemy.stamina = Math.max(0, enemy.stamina - 4);
                enemy.vx += Math.cos(spear.angle) * 8.0;
              } else {
                // Piercing strike
                this.spawnBlood(spear.tipX, spear.tipY, 5);
                enemy.health -= 28;
                enemy.stamina = Math.max(0, enemy.stamina - 15);
                if (Math.random() < 0.08) this.playSound('spear_jab');

                if (enemy.health <= 0) {
                  enemy.isAlive = false;
                  if (enemy.side === 'spartan') this.spartanCasualties++;
                  else this.thebanCasualties++;
                  this.spawnBlood(enemy.x, enemy.y, 10);
                }
              }
              break;
            }
          }
        }
      } else {
        // Spears held upright or braced (45-80 degrees upward angle)
        spear.angle = isSpartan ? -0.8 : -2.3;
        const uprightReach = 28.0;
        spear.tipX = originX + Math.cos(spear.angle) * uprightReach;
        spear.tipY = originY + Math.sin(spear.angle) * uprightReach;
      }
    }
  }

  updateJavelins(dt) {
    for (let i = this.javelins.length - 1; i >= 0; i--) {
      const j = this.javelins[i];
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      j.life -= dt;

      // Hit test vs enemies
      const targets = j.side === 'spartan' ? this.thebans : this.spartans;
      for (const t of targets) {
        if (!t.isAlive) continue;
        const d = Math.hypot(t.x - j.x, t.y - j.y);
        if (d < t.shieldRadius) {
          // Javelin shield impact
          t.stamina = Math.max(0, t.stamina - 20);
          t.vx += j.vx * 0.08;
          this.spawnSparks(j.x, j.y, 4);
          this.spawnDust(j.x, j.y, 2);
          j.life = 0;
          break;
        }
      }

      if (j.life <= 0) {
        this.javelins.splice(i, 1);
      }
    }
  }

  updatePressureGrid(dt) {
    const allHoplites = [...this.spartans, ...this.thebans].filter(h => h.isAlive);

    for (let i = 0; i < this.pressureNodes.length; i++) {
      const node = this.pressureNodes[i];
      let sumP = 0;
      let sumFx = 0;
      let sumFy = 0;

      // Smooth Gaussian falloff kernel
      for (let j = 0; j < allHoplites.length; j++) {
        const h = allHoplites[j];
        const dx = node.x - h.x;
        const dy = node.y - h.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = 48.0 * 48.0; // 48px influence kernel

        if (distSq < radiusSq) {
          const w = 1.0 - (distSq / radiusSq);
          sumP += h.pressure * w;
          sumFx += h.pressureFx * w;
          sumFy += h.pressureFy * w;
        }
      }

      node.pressure += (sumP - node.pressure) * 0.25;
      node.fx += (sumFx - node.fx) * 0.25;
      node.fy += (sumFy - node.fy) * 0.25;
      node.colorAlpha = Math.min(0.85, (node.pressure / 850.0) * 0.85);
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.type === 'shockwave') {
        p.radius += (p.maxRadius - p.radius) * (dt * 6.0);
        p.alpha = (p.life / p.maxLife) * 0.8;
      } else if (p.type === 'text') {
        p.y += p.vy * dt;
        p.alpha = p.life / p.maxLife;
      } else {
        p.x += (p.vx || 0) * dt;
        p.y += (p.vy || 0) * dt;
        p.alpha = p.life / p.maxLife;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateBattleStatus() {
    if (this.battleLineOffset > 90) {
      this.battleStatus = 'SPARTAN VICTORY — THEBAN RANKS BUCKLING!';
    } else if (this.battleLineOffset < -90) {
      this.battleStatus = 'THEBAN LEUCTRA BREAKTHROUGH!';
    } else if (this.spartanShoveTimer > 0) {
      this.battleStatus = 'SPARTAN OTHISMOS MASS HEAVE (ὠθισμός!)';
    } else if (this.thebanShoveTimer > 0) {
      this.battleStatus = 'THEBAN SACRED BAND COUNTER-SHOVE!';
    } else if (this.spearHedgeLowered) {
      this.battleStatus = 'BRISTLING DORY SPEAR CLASH';
    } else {
      this.battleStatus = 'LOCKED SHIELD CRUSH (SYNASPISMOS)';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING PIPELINE                                                         */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    if (!ctx) return;

    // 1. Draw Battlefield Earth & Greek Meander Key Borders
    this.renderBattlefield(ctx);

    // 2. Draw Dynamic Pressure Heatmap Overlay
    if (this.showHeatmap) {
      this.renderPressureHeatmap(ctx);
    }

    // 3. Draw Force Transmission Vectors
    if (this.showForceVectors) {
      this.renderForceVectors(ctx);
    }

    // 4. Draw Dead Fallen Hoplites (Ground Layer)
    this.renderFallenHoplites(ctx);

    // 5. Draw Shield Overlap Lines & Cohesion Web
    if (this.showShieldBorders) {
      this.renderShieldWallLines(ctx);
    }

    // 6. Draw Hoplites & Upright Spears (Rank-Sorted Depth Pass)
    this.renderHoplites(ctx);

    // 7. Draw Lowered Dory Spear Hedge (Front 3 Ranks)
    this.renderLoweredSpears(ctx);

    // 8. Draw Skirmish Javelins & FX Particles
    this.renderParticles(ctx);

    // 9. Draw Tactical HUD & Push Momentum Tug-of-War Bar
    this.renderHUD(ctx);
  }

  renderBattlefield(ctx) {
    // Dusty Arid Hellenic Battlefield Soil
    const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, '#15130f');
    grad.addColorStop(0.5, '#1e1a14');
    grad.addColorStop(1, '#14120e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Center Battle Line Chalk Marks (Stadia / Plethra markers)
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(this.width * 0.5, 30);
    ctx.lineTo(this.width * 0.5, this.height - 30);
    ctx.stroke();

    // Dynamic Battle Line Contact Point
    const dynamicClashX = this.width * 0.5 + this.battleLineOffset;
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(dynamicClashX, 60);
    ctx.lineTo(dynamicClashX, this.height - 60);
    ctx.stroke();
    ctx.restore();

    // Greek Meander Decorative Border Framing
    this.renderMeanderBorder(ctx);
  }

  renderMeanderBorder(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, this.width - 20, this.height - 20);

    // Corner decorative rosettes
    const corners = [
      { x: 10, y: 10 },
      { x: this.width - 10, y: 10 },
      { x: 10, y: this.height - 10 },
      { x: this.width - 10, y: this.height - 10 }
    ];

    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    for (const c of corners) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderPressureHeatmap(ctx) {
    // Dynamic thermographic pressure interpolation across grid
    ctx.save();
    const cellW = this.width / this.gridCols;
    const cellH = this.height / this.gridRows;

    for (let i = 0; i < this.pressureNodes.length; i++) {
      const node = this.pressureNodes[i];
      if (node.colorAlpha < 0.04) continue;

      // Color mapping: Cyan (low) -> Yellow (medium) -> Bright Crimson/Orange (high) -> White (peak)
      const pRatio = Math.min(1.0, node.pressure / 600.0);
      let r, g, b;

      if (pRatio < 0.3) {
        // Cyan to Yellow-Green
        const t = pRatio / 0.3;
        r = Math.floor(20 + t * 140);
        g = Math.floor(140 + t * 90);
        b = Math.floor(220 - t * 150);
      } else if (pRatio < 0.7) {
        // Yellow to Crimson
        const t = (pRatio - 0.3) / 0.4;
        r = Math.floor(160 + t * 95);
        g = Math.floor(230 - t * 180);
        b = Math.floor(70 - t * 50);
      } else {
        // Crimson to Incandescent Gold/White
        const t = (pRatio - 0.7) / 0.3;
        r = 255;
        g = Math.floor(50 + t * 190);
        b = Math.floor(20 + t * 180);
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${node.colorAlpha * 0.42})`;
      ctx.fillRect(node.x - cellW * 0.5, node.y - cellH * 0.5, cellW, cellH);
    }
    ctx.restore();
  }

  renderForceVectors(ctx) {
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 235, 150, 0.4)';

    // Stride through nodes for clean rendering
    for (let i = 0; i < this.pressureNodes.length; i += 2) {
      const node = this.pressureNodes[i];
      const mag = Math.hypot(node.fx, node.fy);
      if (mag < 25.0) continue;

      const len = Math.min(18.0, mag * 0.04);
      const angle = Math.atan2(node.fy, node.fx);
      const endX = node.x + Math.cos(angle) * len;
      const endY = node.y + Math.sin(angle) * len;

      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Tiny arrow tip
      const tipAngle = 0.4;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - Math.cos(angle - tipAngle) * 3.5, endY - Math.sin(angle - tipAngle) * 3.5);
      ctx.lineTo(endX - Math.cos(angle + tipAngle) * 3.5, endY - Math.sin(angle + tipAngle) * 3.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderShieldWallLines(ctx) {
    // Interlocking aspis shield borders showing Synaspismos
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;

    // Connect files along ranks to visualize the interlocking line
    const drawInterlock = (army) => {
      for (let r = 0; r < this.ranksDepth; r++) {
        const rankUnits = army.filter(h => h.rank === r && h.isAlive).sort((a, b) => a.file - b.file);
        if (rankUnits.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(rankUnits[0].x, rankUnits[0].y);
        for (let i = 1; i < rankUnits.length; i++) {
          ctx.lineTo(rankUnits[i].x, rankUnits[i].y);
        }
        ctx.stroke();
      }
    };

    drawInterlock(this.spartans);
    drawInterlock(this.thebans);
    ctx.restore();
  }

  renderFallenHoplites(ctx) {
    const fallen = [...this.spartans, ...this.thebans].filter(h => !h.isAlive);
    ctx.save();
    for (const h of fallen) {
      // Fallen shield on the ground
      ctx.fillStyle = 'rgba(40, 30, 20, 0.5)';
      ctx.beginPath();
      ctx.arc(h.x + 3, h.y + 3, h.shieldRadius, 0, Math.PI * 2);
      ctx.fill();

      // Dented bronze shield rim
      ctx.strokeStyle = '#5a4625';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#3a2d18';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHoplites(ctx) {
    // Depth sort so rear ranks render behind front ranks properly
    const aliveHoplites = [...this.spartans, ...this.thebans]
      .filter(h => h.isAlive)
      .sort((a, b) => b.rank - a.rank);

    for (const h of aliveHoplites) {
      this.drawHoplite(ctx, h);
    }
  }

  drawHoplite(ctx, h) {
    ctx.save();
    const isSpartan = h.side === 'spartan';

    // 1. Drop shadow under shield and body
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(h.x + 2.5, h.y + 3.0, h.shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Body / Shoulders (Corinthian Helmet with Horsehair Crest)
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.facing);

    // Tunic & greaves shoulder block
    ctx.fillStyle = h.colorTunic;
    ctx.fillRect(-6, -8, 12, 16);

    // Corinthian Helmet (Bronze Dome)
    ctx.fillStyle = h.colorBronze;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Horsehair Crest (Transverse for Spartans, Longitudinal for Thebans)
    ctx.fillStyle = isSpartan ? '#d62828' : '#e0e1dd';
    ctx.fillRect(-8, -2, 16, 4);

    ctx.restore();

    // 3. Aspis (Hoplon) Round Shield
    // Held on the left forearm: offset slightly toward the left shoulder
    const shieldOffsetX = Math.cos(h.shieldAngle) * 3;
    const shieldOffsetY = isSpartan ? -4 : 4;
    const sx = h.x + shieldOffsetX;
    const sy = h.y + shieldOffsetY;

    // Bronze Bowl Gradient
    const shieldGrad = ctx.createRadialGradient(
      sx - 3, sy - 3, 2,
      sx, sy, h.shieldRadius
    );
    shieldGrad.addColorStop(0, '#f9d77e'); // Specular highlight
    shieldGrad.addColorStop(0.3, h.colorBronze);
    shieldGrad.addColorStop(0.85, isSpartan ? '#9e2a2b' : '#1d3557');
    shieldGrad.addColorStop(1, h.colorRim);

    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, h.shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shield Rim (Antix) & Rivets
    ctx.strokeStyle = '#2b1e0f';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. Shield Blazon / Emblem (Lambda or Boeotian Club)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#ffd700'; // Golden emblem

    if (h.emblem === 'lambda') {
      // Spartan Golden Chevron Lambda (Λ)
      ctx.beginPath();
      ctx.moveTo(0, -6.5);
      ctx.lineTo(4.5, 5.0);
      ctx.lineTo(2.2, 5.0);
      ctx.lineTo(0, -2.0);
      ctx.lineTo(-2.2, 5.0);
      ctx.lineTo(-4.5, 5.0);
      ctx.closePath();
      ctx.fill();
    } else {
      // Theban Boeotian Club of Herakles / Delta
      ctx.beginPath();
      ctx.moveTo(-4, -4);
      ctx.lineTo(4, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 5. Upright Spears (Ranks 3 and behind hold spears pointing upward)
    if (h.spear && (!h.spear.isLowered || h.rank >= 3)) {
      ctx.strokeStyle = '#3e2723'; // Dark ash shaft
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(h.spear.tipX, h.spear.tipY);
      ctx.stroke();

      // Gleaming spear point
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.arc(h.spear.tipX, h.spear.tipY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Selection Highlight
    if (this.selectedHoplite === h) {
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.shieldRadius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderLoweredSpears(ctx) {
    // Bristling lowered dory spears of front 3 ranks
    ctx.save();
    for (const h of [...this.spartans, ...this.thebans]) {
      const spear = h.spear;
      if (!spear || !h.isAlive || !spear.isLowered || h.rank >= 3) continue;

      const isSpartan = h.side === 'spartan';
      const handOffsetY = isSpartan ? 6.0 : -6.0;
      const originX = h.x + Math.cos(h.shieldAngle) * 6;
      const originY = h.y + handOffsetY;

      // Wooden Ash Shaft
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(spear.tipX, spear.tipY);
      ctx.stroke();

      // Leaf-Shaped Iron Spearhead (Aichme)
      const tipAngle = spear.angle;
      ctx.save();
      ctx.translate(spear.tipX, spear.tipY);
      ctx.rotate(tipAngle);

      // Metallic Iron Spearhead
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -3.2);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 3.2);
      ctx.closePath();
      ctx.fill();

      // Central bronze spine
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();

    // 1. Skirmish Javelins
    for (const j of this.javelins) {
      ctx.save();
      ctx.translate(j.x, j.y);
      ctx.rotate(j.angle);

      // Shaft
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();

      // Tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(12, -2.5);
      ctx.lineTo(12, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Shockwaves, Dust, Sparks, Blood, Text
    for (const p of this.particles) {
      if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.0 * p.alpha;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.fillStyle = `rgba(180, 150, 110, ${p.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'blood') {
        ctx.fillStyle = `rgba(180, 20, 25, ${p.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.font = 'bold 13px Cinzel, serif, -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      }
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

    // 1. Center Top: Tug-of-War Othismos Push Gauge
    const barW = Math.min(narrow ? 260 : 340, sw - 40);
    const barH = narrow ? 12 : 14;
    const barX = (sw - barW) * 0.5;
    const barY = narrow ? 20 : 24;

    // Bar Background
    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);

    // Dynamic Displacement Fill
    const normalized = Math.max(0, Math.min(1, (this.battleLineOffset + 180) / 360.0));
    const splitX = barX + (barW * normalized);

    // Spartan (Red) Half
    ctx.fillStyle = '#9e2a2b';
    ctx.fillRect(barX, barY + 1, splitX - barX, barH - 2);

    // Theban (Blue) Half
    ctx.fillStyle = '#1b3b6f';
    ctx.fillRect(splitX, barY + 1, (barX + barW) - splitX, barH - 2);

    // Center Notch (Initial line)
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(barX + barW * 0.5 - 1, barY - 2, 2, barH + 4);

    // Push Offset Marker Needle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(splitX - 1.5, barY - 4, 3, barH + 8);

    // 2. HUD Labels & Pressure Gauges
    ctx.font = `bold ${narrow ? 9 : 11}px Cinzel, serif, -apple-system`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e63946';
    ctx.fillText(narrow ? `SP: ${(this.spartanTotalPressure / 1000).toFixed(1)} kN` : `SPARTANS: ${(this.spartanTotalPressure / 1000).toFixed(1)} kN`, barX, barY - 6);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#70d6ff';
    ctx.fillText(narrow ? `TH: ${(this.thebanTotalPressure / 1000).toFixed(1)} kN` : `THEBANS: ${(this.thebanTotalPressure / 1000).toFixed(1)} kN`, barX + barW, barY - 6);

    // 3. Tactical Status Banner
    ctx.font = `600 ${narrow ? 10 : 12}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(this.battleStatus, sw * 0.5, barY + barH + 16);

    ctx.restore();

    // 4. Selected Hoplite Inspector Tooltip (in world coordinates)
    if (this.selectedHoplite && this.selectedHoplite.isAlive) {
      ctx.save();
      const h = this.selectedHoplite;
      const tipW = 160;
      const tipH = 68;
      const tipX = Math.min(this.width - tipW - 10, Math.max(10, h.x - tipW * 0.5));
      const tipY = Math.max(10, h.y - h.shieldRadius - tipH - 8);

      ctx.fillStyle = 'rgba(12, 14, 20, 0.92)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 1;
      ctx.fillRect(tipX, tipY, tipW, tipH);
      ctx.strokeRect(tipX, tipY, tipW, tipH);

      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(`${h.side.toUpperCase()} HOPLITE #${h.id}`, tipX + 8, tipY + 16);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(`Rank: ${h.rank + 1} | File: ${h.file + 1}`, tipX + 8, tipY + 30);
      ctx.fillText(`Othismos Load: ${h.pressure.toFixed(0)} N`, tipX + 8, tipY + 44);
      ctx.fillText(`Stamina: ${h.stamina.toFixed(0)}% | HP: ${h.health}`, tipX + 8, tipY + 58);
      ctx.restore();
    }
  }
}
