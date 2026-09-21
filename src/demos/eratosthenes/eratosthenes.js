// Eratosthenes: Prime Sieve & Earth Circumference Simulation Engine
// Pliny Game Lab — Pavilion VI: Mathematica & Geometria
// Zero external dependencies — pure ES module

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

// -------------------------------------------------------------
// Historical & Mathematical Constants
// -------------------------------------------------------------
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const TWO_PI = Math.PI * 2;

// Standard Stadia conversion (Attic stadion ~185m, Egyptian stadion ~157.5m)
const STADIA_TO_KM = 0.1575; // Egyptian Royal Stadia (~157.5 m)
const MODERN_EARTH_CIRCUMFERENCE_KM = 40008; // Polar circumference

// Papyrus & Obsidian Aesthetic Palette
const THEME = {
  // Obsidian backgrounds & deep basalt
  obsidianDeep: '#08080b',
  obsidianSlab: '#121217',
  obsidianCard: '#1a1a24',
  obsidianBorder: 'rgba(212, 175, 55, 0.28)',
  obsidianBorderHover: 'rgba(212, 175, 55, 0.65)',

  // Papyrus parchment tones
  papyrusLight: '#f6eedb',
  papyrusMedium: '#e4d5b7',
  papyrusDark: '#c7b28a',
  papyrusInk: '#3d2e1e',
  papyrusInkFaded: 'rgba(61, 46, 30, 0.45)',

  // Hellenistic Imperial Gold & Sunlight
  goldPure: '#ffd700',
  goldWarm: '#e6b422',
  goldMuted: '#c59b27',
  goldGlow: 'rgba(255, 215, 0, 0.35)',
  sunRay: 'rgba(255, 223, 93, 0.45)',
  sunCore: '#fffdf0',

  // Accents: Mediterranean Lapis Lazuli & Terracotta
  lapisNile: '#1d4277',
  lapisBright: '#2962ff',
  terracotta: '#b85333',
  terracottaMuted: '#6d301e',
  emeraldOasis: '#10b981',
  textMain: '#ede8dc',
  textMuted: '#9e9689'
};

export class EratosthenesEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Scaling
    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    // Active Simulation Mode: 'circumference' or 'sieve'
    this.mode = 'circumference';

    // ---------------------------------------------------------
    // Mode 1: Earth Circumference Geometry State
    // ---------------------------------------------------------
    this.sunAngle = 7.2; // degrees (nominally 1/50th of 360° = 7.2°)
    this.stadiaDistance = 5000; // 5,000 stadia between Alexandria and Syene
    this.obeliskHeight = 72; // pixels representation
    this.wellDepth = 65; // pixels depth of well
    this.isDraggingSun = false;
    this.isDraggingShadow = false;

    // Solar photon particles flowing along parallel beams
    this.photons = [];
    this.photonMax = 60;

    // ---------------------------------------------------------
    // Mode 2: Sieve of Eratosthenes Prime State
    // ---------------------------------------------------------
    this.gridLimit = 100; // max number (100, 144, or 200)
    this.numbers = []; // items { value, state: 'untouched'|'prime'|'composite', primeFactor, animGlow }
    this.currentPrime = 2;
    this.currentMultipleIndex = 0;
    this.currentMultipleValue = 4;
    this.sieveState = 'SELECT_PRIME'; // 'SELECT_PRIME', 'MARK_MULTIPLES', 'FINISHED'
    this.autoPlay = false;
    this.sieveSpeed = 4.0; // steps per second
    this.stepTimer = 0;
    this.activeEliminationRay = null; // { fromX, fromY, toX, toY, progress }
    this.sparks = []; // visual ink/dust particles when striking out

    // Discovered primes list
    this.primesFound = [];

    // Interactive Hover & Selection
    this.hoverCell = null;
    this.selectedCell = null;
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;

    // Audio Synthesizer (Safe Web Audio)
    this.audioCtx = null;

    // Internal timing
    this.elapsed = 0;

    // Entity tracking collections for contract
    this.entitiesCount = 0;

    // Initialize systems
    this.initPhotons();
    this.initSieveGrid();
    this.initControls();
    attachTouchBridge(this, canvas);
  }

  // -------------------------------------------------------------
  // Safe Audio Synthesizer (Hellenistic Tones)
  // -------------------------------------------------------------
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

  playSound(type, freq = 440) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    if (type === 'prime') {
      // Harmonic golden chime: Greek Pythagorean fifth / pure harmonic
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.25);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } else if (type === 'strike') {
      // Crisp parchment ink tap
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    } else if (type === 'complete') {
      // Fanfare of pure Pythagorean intervals
      [freq, freq * 1.25, freq * 1.5, freq * 2].forEach((f, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.08);
        gain.gain.setValueAtTime(0.2, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.45);
      });
    } else if (type === 'sun_ray') {
      // Gentle warm drone modulation
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(196, t); // Sol (G3)
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  // -------------------------------------------------------------
  // Solar Photons (Mode 1 Entity System)
  // -------------------------------------------------------------
  initPhotons() {
    this.photons = [];
    for (let i = 0; i < this.photonMax; i++) {
      this.photons.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.4),
        speed: 120 + Math.random() * 100,
        size: 1.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        beamIndex: Math.floor(Math.random() * 8)
      });
    }
  }

  updatePhotons(dt) {
    const angleRad = (90 - this.sunAngle) * DEG2RAD;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);

    for (let p of this.photons) {
      p.x += dirX * p.speed * dt;
      p.y += dirY * p.speed * dt;
      if (p.y > this.height || p.x > this.width || p.x < 0) {
        p.y = -10;
        p.x = Math.random() * this.width;
        p.speed = 120 + Math.random() * 100;
      }
    }
  }

  // -------------------------------------------------------------
  // Sieve Grid Initialization & Logic (Mode 2)
  // -------------------------------------------------------------
  initSieveGrid() {
    this.numbers = [];
    this.primesFound = [];
    for (let i = 2; i <= this.gridLimit; i++) {
      this.numbers.push({
        value: i,
        state: 'untouched', // 'untouched', 'prime', 'composite'
        primeFactor: null,
        glow: 0,
        crossProgress: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0
      });
    }

    this.currentPrime = 2;
    this.currentMultipleIndex = 2;
    this.currentMultipleValue = 4;
    this.sieveState = 'SELECT_PRIME';
    this.activeEliminationRay = null;
    this.sparks = [];

    // Mark 2 as active prime immediately
    const firstCell = this.numbers[0];
    if (firstCell) {
      firstCell.state = 'prime';
      firstCell.glow = 1.0;
      this.primesFound.push(2);
    }
  }

  stepSieve() {
    this.initAudio();

    if (this.sieveState === 'FINISHED') return;

    if (this.sieveState === 'SELECT_PRIME') {
      // Find next multiple of currentPrime starting from currentPrime * 2
      this.currentMultipleValue = this.currentPrime * 2;
      this.sieveState = 'MARK_MULTIPLES';
      this.stepSieveMultiple();
      return;
    }

    if (this.sieveState === 'MARK_MULTIPLES') {
      this.stepSieveMultiple();
    }
  }

  stepSieveMultiple() {
    // Find next multiple >= currentMultipleValue that is within grid
    while (this.currentMultipleValue <= this.gridLimit) {
      const targetVal = this.currentMultipleValue;
      this.currentMultipleValue += this.currentPrime;

      const cell = this.numbers.find(c => c.value === targetVal);
      if (cell) {
        if (cell.state !== 'composite') {
          cell.state = 'composite';
          cell.primeFactor = this.currentPrime;
          cell.crossProgress = 1.0;

          // Spawn ink sparks
          this.spawnSparks(cell.x + cell.w * 0.5, cell.y + cell.h * 0.5, THEME.terracotta);

          // Active ray animation from prime cell to multiple cell
          const primeCell = this.numbers.find(c => c.value === this.currentPrime);
          if (primeCell) {
            this.activeEliminationRay = {
              fromX: primeCell.x + primeCell.w * 0.5,
              fromY: primeCell.y + primeCell.h * 0.5,
              toX: cell.x + cell.w * 0.5,
              toY: cell.y + cell.h * 0.5,
              life: 0.35,
              maxLife: 0.35
            };
          }

          this.playSound('strike');
          return; // One elimination per step
        }
      }
    }

    // Finished all multiples of currentPrime. Find next prime!
    let nextPrime = null;
    for (let c of this.numbers) {
      if (c.value > this.currentPrime && c.state === 'untouched') {
        nextPrime = c.value;
        break;
      }
    }

    // Check if nextPrime squared > gridLimit
    if (!nextPrime || nextPrime * nextPrime > this.gridLimit) {
      // All remaining untouched numbers are primes!
      for (let c of this.numbers) {
        if (c.state === 'untouched') {
          c.state = 'prime';
          c.glow = 1.0;
          if (!this.primesFound.includes(c.value)) {
            this.primesFound.push(c.value);
          }
        }
      }
      this.sieveState = 'FINISHED';
      this.autoPlay = false;
      this.playSound('complete', 523.25); // High C
      this.updateControlsUI();
      return;
    }

    // Advance to next prime
    this.currentPrime = nextPrime;
    const primeCell = this.numbers.find(c => c.value === nextPrime);
    if (primeCell) {
      primeCell.state = 'prime';
      primeCell.glow = 1.0;
      if (!this.primesFound.includes(nextPrime)) {
        this.primesFound.push(nextPrime);
      }
      this.spawnSparks(primeCell.x + primeCell.w * 0.5, primeCell.y + primeCell.h * 0.5, THEME.goldPure);
      // Frequencies mapped to Hellenistic scale
      const freq = 260 + (this.primesFound.length % 12) * 28;
      this.playSound('prime', freq);
    }

    this.currentMultipleValue = this.currentPrime * this.currentPrime;
    this.sieveState = 'MARK_MULTIPLES';
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 40 + Math.random() * 90;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 1.2 + Math.random() * 2,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  updateSparks(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------
  // HTML Controls & DOM Binding (Safe Headless Guard)
  // -------------------------------------------------------------
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Simulation Mode</label>
        <div class="control-btn-grid" id="eratosthenes-mode-selector">
          <button class="sub-btn ${this.mode === 'circumference' ? 'active' : ''}" data-mode="circumference" title="Planetary Measurement of Earth">
            🌍 Earth Circumference
          </button>
          <button class="sub-btn ${this.mode === 'sieve' ? 'active' : ''}" data-mode="sieve" title="Sieve of Eratosthenes Prime Grid">
            🔢 Prime Sieve
          </button>
        </div>
      </div>

      <div id="circumference-controls" style="display: ${this.mode === 'circumference' ? 'flex' : 'none'}; flex-direction: column; gap: 10px;">
        <div class="control-group">
          <label>
            <span>Sun Ray Angle (Alexandria)</span>
            <span id="sun-angle-val">${this.sunAngle.toFixed(1)}° (${(360 / this.sunAngle).toFixed(1)}th circle)</span>
          </label>
          <input type="range" id="sun-angle" min="1.0" max="25.0" step="0.1" value="${this.sunAngle}">
        </div>

        <div class="control-group">
          <label>
            <span>Stadia Distance (Syene ↔ Alexandria)</span>
            <span id="stadia-val">${this.stadiaDistance} stadia (~${Math.round(this.stadiaDistance * STADIA_TO_KM)} km)</span>
          </label>
          <input type="range" id="stadia-dist" min="2000" max="10000" step="100" value="${this.stadiaDistance}">
        </div>

        <div class="control-group" style="margin-top: 4px;">
          <button id="reset-angle-btn" class="sub-btn" style="border-color: var(--accent-gold); color: #ffd700; font-weight: bold;">
            ☀️ Reset to Solstice Standard (7.2°)
          </button>
        </div>
      </div>

      <div id="sieve-controls" style="display: ${this.mode === 'sieve' ? 'flex' : 'none'}; flex-direction: column; gap: 10px;">
        <div class="control-group">
          <label>Grid Size Limit (N)</label>
          <div class="control-btn-grid" id="grid-limit-selector" style="grid-template-columns: repeat(3, 1fr);">
            <button class="sub-btn ${this.gridLimit === 100 ? 'active' : ''}" data-limit="100">100</button>
            <button class="sub-btn ${this.gridLimit === 144 ? 'active' : ''}" data-limit="144">144</button>
            <button class="sub-btn ${this.gridLimit === 200 ? 'active' : ''}" data-limit="200">200</button>
          </div>
        </div>

        <div class="control-group">
          <label>
            <span>Sieve Speed</span>
            <span id="sieve-speed-val">${this.sieveSpeed.toFixed(1)} steps/s</span>
          </label>
          <input type="range" id="sieve-speed" min="1.0" max="16.0" step="0.5" value="${this.sieveSpeed}">
        </div>

        <div class="control-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px;">
          <button id="step-sieve-btn" class="sub-btn" style="border-color: var(--accent-gold); color: #ffd700; font-weight: bold; padding: 8px;">
            ⏩ Step Sieve
          </button>
          <button id="autoplay-sieve-btn" class="sub-btn" style="border-color: #3bd6c6; color: #3bd6c6; font-weight: bold; padding: 8px;">
            ${this.autoPlay ? '⏸ Pause' : '▶ Auto-Play'}
          </button>
        </div>

        <div class="control-group">
          <button id="reset-sieve-btn" class="sub-btn" style="border-color: rgba(255,255,255,0.2);">
            🔄 Reset Sieve Grid
          </button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.35); border-radius: 6px; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #a0a6b6; line-height: 1.5;">
        <div id="eratosthenes-telemetry">
          <!-- Populated dynamically in updateControlsUI() -->
        </div>
      </div>
    `;

    // Hook Mode Switcher
    const modeSelector = this.controlsContainer.querySelector('#eratosthenes-mode-selector');
    if (modeSelector) {
      modeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const newMode = btn.getAttribute('data-mode');
        if (newMode && newMode !== this.mode) {
          this.setMode(newMode);
        }
      });
    }

    // Circumference Slider: Sun Angle
    const angleSlider = this.controlsContainer.querySelector('#sun-angle');
    if (angleSlider) {
      angleSlider.addEventListener('input', (e) => {
        this.sunAngle = parseFloat(e.target.value);
        this.initAudio();
        this.playSound('sun_ray');
        this.updateControlsUI();
      });
    }

    // Circumference Slider: Stadia
    const stadiaSlider = this.controlsContainer.querySelector('#stadia-dist');
    if (stadiaSlider) {
      stadiaSlider.addEventListener('input', (e) => {
        this.stadiaDistance = parseInt(e.target.value, 10);
        this.updateControlsUI();
      });
    }

    // Reset Angle Button
    const resetAngleBtn = this.controlsContainer.querySelector('#reset-angle-btn');
    if (resetAngleBtn) {
      resetAngleBtn.addEventListener('click', () => {
        this.sunAngle = 7.2;
        if (angleSlider) angleSlider.value = 7.2;
        this.initAudio();
        this.playSound('sun_ray');
        this.updateControlsUI();
      });
    }

    // Sieve Limit Selector
    const limitSelector = this.controlsContainer.querySelector('#grid-limit-selector');
    if (limitSelector) {
      limitSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const limit = parseInt(btn.getAttribute('data-limit'), 10);
        if (limit && limit !== this.gridLimit) {
          this.gridLimit = limit;
          limitSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.initSieveGrid();
          this.updateControlsUI();
        }
      });
    }

    // Sieve Speed Slider
    const speedSlider = this.controlsContainer.querySelector('#sieve-speed');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.sieveSpeed = parseFloat(e.target.value);
        const valSpan = this.controlsContainer.querySelector('#sieve-speed-val');
        if (valSpan) valSpan.textContent = `${this.sieveSpeed.toFixed(1)} steps/s`;
      });
    }

    // Step Sieve Button
    const stepBtn = this.controlsContainer.querySelector('#step-sieve-btn');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        this.autoPlay = false;
        this.stepSieve();
        this.updateControlsUI();
      });
    }

    // Auto-Play Sieve Button
    const autoPlayBtn = this.controlsContainer.querySelector('#autoplay-sieve-btn');
    if (autoPlayBtn) {
      autoPlayBtn.addEventListener('click', () => {
        this.initAudio();
        this.autoPlay = !this.autoPlay;
        autoPlayBtn.textContent = this.autoPlay ? '⏸ Pause' : '▶ Auto-Play';
        autoPlayBtn.style.color = this.autoPlay ? '#ffd700' : '#3bd6c6';
        autoPlayBtn.style.borderColor = this.autoPlay ? '#ffd700' : '#3bd6c6';
      });
    }

    // Reset Sieve Button
    const resetSieveBtn = this.controlsContainer.querySelector('#reset-sieve-btn');
    if (resetSieveBtn) {
      resetSieveBtn.addEventListener('click', () => {
        this.autoPlay = false;
        this.initSieveGrid();
        this.updateControlsUI();
      });
    }

    this.updateControlsUI();
  }

  setMode(newMode) {
    this.mode = newMode;
    if (!this.controlsContainer) return;

    // Toggle button active classes
    const modeBtns = this.controlsContainer.querySelectorAll('#eratosthenes-mode-selector button');
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === newMode);
    });

    const circCtrl = this.controlsContainer.querySelector('#circumference-controls');
    const sieveCtrl = this.controlsContainer.querySelector('#sieve-controls');
    if (circCtrl) circCtrl.style.display = newMode === 'circumference' ? 'flex' : 'none';
    if (sieveCtrl) sieveCtrl.style.display = newMode === 'sieve' ? 'flex' : 'none';

    this.updateControlsUI();
  }

  updateControlsUI() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    // Angle span update
    const angleSpan = this.controlsContainer.querySelector('#sun-angle-val');
    if (angleSpan) {
      const circleFraction = (360 / this.sunAngle).toFixed(1);
      angleSpan.textContent = `${this.sunAngle.toFixed(1)}° (1/${circleFraction}th)`;
    }

    // Stadia span update
    const stadiaSpan = this.controlsContainer.querySelector('#stadia-val');
    if (stadiaSpan) {
      const km = Math.round(this.stadiaDistance * STADIA_TO_KM);
      stadiaSpan.textContent = `${this.stadiaDistance} stadia (~${km} km)`;
    }

    // Telemetry Box
    const tele = this.controlsContainer.querySelector('#eratosthenes-telemetry');
    if (tele) {
      if (this.mode === 'circumference') {
        const circumStadia = Math.round(this.stadiaDistance * (360 / this.sunAngle));
        const circumKm = Math.round(circumStadia * STADIA_TO_KM);
        const radiusKm = Math.round(circumKm / (2 * Math.PI));
        const errorPct = Math.abs((circumKm - MODERN_EARTH_CIRCUMFERENCE_KM) / MODERN_EARTH_CIRCUMFERENCE_KM * 100).toFixed(1);

        tele.innerHTML = `
          <div><strong>Sun Shadow Angle θ:</strong> <span style="color:#ffd700;">${this.sunAngle.toFixed(2)}°</span></div>
          <div><strong>Arc Distance s:</strong> ${this.stadiaDistance} stadia (${Math.round(this.stadiaDistance * STADIA_TO_KM)} km)</div>
          <div><strong>Calculated Circ.:</strong> <span style="color:#3bd6c6;">${circumStadia.toLocaleString()} stadia</span></div>
          <div><strong>Metric Circumf.:</strong> <span style="color:#ffd700;">${circumKm.toLocaleString()} km</span></div>
          <div><strong>Deduced Radius R:</strong> ${radiusKm.toLocaleString()} km</div>
          <div><strong>Modern Error:</strong> ${errorPct}% (True ~40,008 km)</div>
        `;
      } else {
        const primesCount = this.primesFound.length;
        const totalChecked = this.numbers.filter(n => n.state !== 'untouched').length;
        const density = ((primesCount / this.gridLimit) * 100).toFixed(1);

        tele.innerHTML = `
          <div><strong>Active Prime:</strong> <span style="color:#ffd700; font-weight:bold;">${this.currentPrime}</span></div>
          <div><strong>Primes Discovered π(N):</strong> <span style="color:#3bd6c6; font-weight:bold;">${primesCount}</span></div>
          <div><strong>Current Phase:</strong> ${this.sieveState === 'FINISHED' ? '🏆 Completed!' : this.sieveState}</div>
          <div><strong>Elimination Progress:</strong> ${totalChecked} / ${this.gridLimit - 1}</div>
          <div><strong>Prime Density:</strong> ${density}% of numbers</div>
        `;
      }
    }
  }

  // -------------------------------------------------------------
  // Public Lifecycle: Resize, Update, Reset, Destroy
  // -------------------------------------------------------------
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.initPhotons();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  update(dt) {
    this.elapsed += dt;

    if (this.mode === 'circumference') {
      this.updatePhotons(dt);
    } else {
      this.updateSparks(dt);

      // Fade active elimination ray
      if (this.activeEliminationRay) {
        this.activeEliminationRay.life -= dt;
        if (this.activeEliminationRay.life <= 0) {
          this.activeEliminationRay = null;
        }
      }

      // Auto-play sieve state machine
      if (this.autoPlay && this.sieveState !== 'FINISHED') {
        this.stepTimer += dt;
        const interval = 1.0 / this.sieveSpeed;
        if (this.stepTimer >= interval) {
          this.stepTimer = 0;
          this.stepSieve();
          this.updateControlsUI();
        }
      }

      // Cell pulse / glow animations
      for (let cell of this.numbers) {
        if (cell.state === 'prime') {
          cell.glow = Math.sin(this.elapsed * 3 + cell.value) * 0.2 + 0.8;
        }
      }
    }
  }

  reset() {
    this.sunAngle = 7.2;
    this.stadiaDistance = 5000;
    this.autoPlay = false;
    this.initPhotons();
    this.initSieveGrid();
    this.updateControlsUI();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  getEntityCount() {
    if (this.mode === 'circumference') {
      // Photons (60) + Sun rays (24) + Obelisk vertices (12) + Well vertices (8) + Ground points (16)
      return this.photons.length + 60;
    } else {
      // Total grid cells + active sparks + primes found
      return this.numbers.length + this.sparks.length + this.primesFound.length;
    }
  }

  // -------------------------------------------------------------
  // Render Orchestrator: Papyrus & Obsidian Master Canvas
  // -------------------------------------------------------------
  render(ctx) {
    // 1. Draw Obsidian & Papyrus Background
    this.renderBackdrop(ctx);

    // 2. Render Active Simulation
    if (this.mode === 'circumference') {
      this.renderEarthCircumference(ctx);
    } else {
      this.renderPrimeSieve(ctx);
    }
  }

  renderBackdrop(ctx) {
    const w = this.width;
    const h = this.height;

    // Deep basalt gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090a0f');
    bgGrad.addColorStop(0.5, '#10121a');
    bgGrad.addColorStop(1, '#08080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle celestial / papyrus grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Classical Greek Corner Cornerpieces & Borders
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    const cornerSize = 16;
    // Top-left corner
    ctx.strokeRect(14, 14, cornerSize, cornerSize);
    // Top-right corner
    ctx.strokeRect(w - 14 - cornerSize, 14, cornerSize, cornerSize);
    // Bottom-left corner
    ctx.strokeRect(14, h - 14 - cornerSize, cornerSize, cornerSize);
    // Bottom-right corner
    ctx.strokeRect(w - 14 - cornerSize, h - 14 - cornerSize, cornerSize, cornerSize);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Mode 1 Renderer: Earth Circumference Geometry
  // -------------------------------------------------------------
  renderEarthCircumference(ctx) {
    const w = this.width;
    const h = this.height;

    // Split layout:
    // Left: Planetary Arc & Deep Space Sun Rays (~55% width)
    // Right: Papyrus Architectural Vignette of Alexandria & Syene (~45% width)
    const splitX = Math.floor(w * 0.54);

    this.renderPlanetaryGlobeView(ctx, 0, 0, splitX, h);
    this.renderArchitecturalVignette(ctx, splitX, 0, w - splitX, h);

    // Dividing Pillar
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, 20);
    ctx.lineTo(splitX, h - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  renderPlanetaryGlobeView(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 10, y + 10, width - 20, height - 20);
    ctx.clip();

    // Earth Sphere Center and Radius
    // Place Earth center lower-left to show a grand sweep of the northern hemisphere
    const earthCenterX = width * 0.25;
    const earthCenterY = height * 1.05;
    const earthRadius = Math.min(width, height) * 0.82;

    // Angle of Syene on Earth's rim (Tropic of Cancer)
    const syeneAngleRad = -Math.PI * 0.42; // pointing up and slightly right
    const angleDeltaRad = this.sunAngle * DEG2RAD;
    const alexandriaAngleRad = syeneAngleRad - angleDeltaRad; // further north (towards left)

    const syeneX = earthCenterX + Math.cos(syeneAngleRad) * earthRadius;
    const syeneY = earthCenterY + Math.sin(syeneAngleRad) * earthRadius;

    const alexandriaX = earthCenterX + Math.cos(alexandriaAngleRad) * earthRadius;
    const alexandriaY = earthCenterY + Math.sin(alexandriaAngleRad) * earthRadius;

    // Draw Parallel Golden Sunbeams from Deep Space
    const sunBeamAngle = -Math.PI * 0.5 + (90 * DEG2RAD + syeneAngleRad); // perpendicular to Syene tangent = exactly along Syene radius!
    const rayLength = height * 0.75;

    ctx.save();
    // Radiant Sun in the Heavens
    const sunOrbX = width * 0.75;
    const sunOrbY = height * 0.12;
    const sunGrad = ctx.createRadialGradient(sunOrbX, sunOrbY, 4, sunOrbX, sunOrbY, 48);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.2, '#fff494');
    sunGrad.addColorStop(0.6, 'rgba(255, 215, 0, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunOrbX, sunOrbY, 48, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = '#fff9d6';
    ctx.beginPath();
    ctx.arc(sunOrbX, sunOrbY, 14, 0, TWO_PI);
    ctx.fill();

    // Parallel ray fan demonstrating infinite solar distance
    const numRays = 14;
    const raySpacing = width / (numRays + 1);
    ctx.strokeStyle = 'rgba(255, 223, 93, 0.12)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i <= numRays; i++) {
      const rx = i * raySpacing;
      ctx.beginPath();
      ctx.moveTo(rx, 10);
      ctx.lineTo(rx - Math.tan(0) * height, height);
      ctx.stroke();
    }

    // Highlight the two key rays: to Syene (vertical) and Alexandria (slanted)
    // Ray to Syene: passes directly down into the well towards Earth's center
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(syeneX, 15);
    ctx.lineTo(syeneX, syeneY);
    ctx.stroke();

    // Ray to Alexandria: parallel to Syene ray, strikes top of obelisk
    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(alexandriaX, 15);
    ctx.lineTo(alexandriaX, alexandriaY);
    ctx.stroke();

    ctx.restore();

    // Earth Body: Shaded curved planet
    const earthGrad = ctx.createRadialGradient(
      earthCenterX, earthCenterY - earthRadius * 0.3, earthRadius * 0.2,
      earthCenterX, earthCenterY, earthRadius
    );
    earthGrad.addColorStop(0, '#1c3d5a'); // Mediterranean water
    earthGrad.addColorStop(0.7, '#112233');
    earthGrad.addColorStop(0.98, '#0b1622');
    earthGrad.addColorStop(1, '#d4af37'); // Golden atmosphere glow line

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, TWO_PI);
    ctx.fill();

    // Earth Atmospheric Rim
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, TWO_PI);
    ctx.stroke();

    // Nile Green Strip on Earth's Rim
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, earthRadius, alexandriaAngleRad - 0.05, syeneAngleRad + 0.05);
    ctx.stroke();

    // Central Radius Vectors to Alexandria and Syene
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Vector to Syene
    ctx.beginPath();
    ctx.moveTo(earthCenterX, earthCenterY);
    ctx.lineTo(syeneX, syeneY);
    ctx.stroke();

    // Vector to Alexandria
    ctx.beginPath();
    ctx.moveTo(earthCenterX, earthCenterY);
    ctx.lineTo(alexandriaX, alexandriaY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central Angle Arc (θ) at Earth's Core
    const arcRadius = 75;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, arcRadius, alexandriaAngleRad, syeneAngleRad);
    ctx.stroke();

    // Label θ at Earth center
    const midAngle = (alexandriaAngleRad + syeneAngleRad) * 0.5;
    const labelX = earthCenterX + Math.cos(midAngle) * (arcRadius + 20);
    const labelY = earthCenterY + Math.sin(midAngle) * (arcRadius + 20);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`θ = ${this.sunAngle.toFixed(1)}°`, labelX, labelY);

    // Earth Center Marker
    ctx.fillStyle = '#e4d5b7';
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, 5, 0, TWO_PI);
    ctx.fill();
    ctx.fillText('Center of Earth (O)', earthCenterX, earthCenterY - 12);

    ctx.restore();

    // Obelisk at Alexandria (Extending radially outward from globe)
    const obeliskH = 36;
    const alexObeliskTipX = alexandriaX + Math.cos(alexandriaAngleRad) * obeliskH;
    const alexObeliskTipY = alexandriaY + Math.sin(alexandriaAngleRad) * obeliskH;

    ctx.save();
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(alexandriaX, alexandriaY);
    ctx.lineTo(alexObeliskTipX, alexObeliskTipY);
    ctx.stroke();

    // Obelisk shadow arc on Earth surface
    const shadowArcRad = angleDeltaRad * 0.6;
    ctx.strokeStyle = '#c83232';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, earthRadius + 1, alexandriaAngleRad - shadowArcRad, alexandriaAngleRad);
    ctx.stroke();

    // City Labels on Globe
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillText('Alexandria (31.2° N)', alexandriaX - 12, alexandriaY - 14);

    ctx.textAlign = 'left';
    ctx.fillText('Syene / Aswan (23.5° N)', syeneX + 14, syeneY - 10);

    // Well at Syene (Vertical shaft pointing to center)
    const wellDepthPx = 28;
    const wellBottomX = syeneX - Math.cos(syeneAngleRad) * wellDepthPx;
    const wellBottomY = syeneY - Math.sin(syeneAngleRad) * wellDepthPx;
    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(syeneX, syeneY);
    ctx.lineTo(wellBottomX, wellBottomY);
    ctx.stroke();

    // Sparkling reflection at well bottom
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(wellBottomX, wellBottomY, 3, 0, TWO_PI);
    ctx.fill();

    // Arc Distance Label along Earth curvature
    const arcMidX = earthCenterX + Math.cos(midAngle) * (earthRadius + 22);
    const arcMidY = earthCenterY + Math.sin(midAngle) * (earthRadius + 22);
    ctx.fillStyle = '#e6b422';
    ctx.font = 'italic 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`s = 5,000 stadia`, arcMidX, arcMidY);

    ctx.restore();

    // Draw Photon Particles
    ctx.save();
    ctx.fillStyle = '#fff2a8';
    for (let p of this.photons) {
      if (p.x < width) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
        ctx.fill();
      }
    }
    ctx.restore();

    // Panel Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('I. MACRO COSMOS: PARALLEL SOLAR GEOMETRY', x + 24, y + 32);

    ctx.restore();
  }

  renderArchitecturalVignette(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    // Papyrus Scroll Plate
    const pad = 16;
    const plateX = x + pad;
    const plateY = y + pad;
    const plateW = width - pad * 2;
    const plateH = height - pad * 2;

    // Papyrus textured card
    const papGrad = ctx.createLinearGradient(plateX, plateY, plateX + plateW, plateY + plateH);
    papGrad.addColorStop(0, 'rgba(24, 20, 16, 0.94)');
    papGrad.addColorStop(1, 'rgba(15, 12, 10, 0.97)');
    ctx.fillStyle = papGrad;
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateW, plateH, 8);
    ctx.fill();

    ctx.strokeStyle = THEME.obsidianBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Header: Hellenistic Scientific Proof
    ctx.fillStyle = THEME.goldPure;
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('II. ARCHITECTURA & GNOMONICA', plateX + 16, plateY + 28);

    ctx.fillStyle = THEME.papyrusMedium;
    ctx.font = '11px serif';
    ctx.fillText('Alexandria Gnomon Shadow vs. Syene Solstice Well', plateX + 16, plateY + 46);

    // ---------------------------------------------------------
    // Top Half of Vignette: Alexandria Obelisk & Shadow Triangle
    // ---------------------------------------------------------
    const groundY1 = plateY + plateH * 0.42;
    const obeliskX = plateX + plateW * 0.38;
    const obeliskH = 95;
    const obeliskTopY = groundY1 - obeliskH;

    // Paved ground line
    ctx.strokeStyle = THEME.papyrusDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plateX + 14, groundY1);
    ctx.lineTo(plateX + plateW - 14, groundY1);
    ctx.stroke();

    // Alexandria Obelisk (Pink Aswan Granite with Gold Capstone)
    const obeliskBaseW = 16;
    const obeliskTopW = 10;
    const pyramidionH = 14;

    // Obelisk body
    ctx.fillStyle = '#b85d38'; // Red granite
    ctx.beginPath();
    ctx.moveTo(obeliskX - obeliskBaseW * 0.5, groundY1);
    ctx.lineTo(obeliskX - obeliskTopW * 0.5, obeliskTopY + pyramidionH);
    ctx.lineTo(obeliskX + obeliskTopW * 0.5, obeliskTopY + pyramidionH);
    ctx.lineTo(obeliskX + obeliskBaseW * 0.5, groundY1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e4d5b7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pyramidion (Electrum / Gold leaf tip)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(obeliskX - obeliskTopW * 0.5, obeliskTopY + pyramidionH);
    ctx.lineTo(obeliskX, obeliskTopY);
    ctx.lineTo(obeliskX + obeliskTopW * 0.5, obeliskTopY + pyramidionH);
    ctx.closePath();
    ctx.fill();

    // Shadow cast on ground: Length L = H * tan(theta)
    const angleRad = this.sunAngle * DEG2RAD;
    const shadowLen = obeliskH * Math.tan(angleRad);
    const shadowEndX = obeliskX + shadowLen;

    // Shadow Polygon
    ctx.fillStyle = 'rgba(10, 10, 15, 0.75)';
    ctx.beginPath();
    ctx.moveTo(obeliskX - obeliskBaseW * 0.5, groundY1);
    ctx.lineTo(obeliskX + obeliskBaseW * 0.5, groundY1);
    ctx.lineTo(shadowEndX, groundY1 + 4);
    ctx.lineTo(shadowEndX - 4, groundY1);
    ctx.closePath();
    ctx.fill();

    // Red dotted line for shadow length measurement
    ctx.strokeStyle = '#c83232';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(obeliskX, groundY1 + 6);
    ctx.lineTo(shadowEndX, groundY1 + 6);
    ctx.stroke();

    // Sunlight Ray grazing pyramidion and meeting shadow tip
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(obeliskX - (obeliskH + 30) * Math.tan(angleRad), obeliskTopY - 30);
    ctx.lineTo(shadowEndX, groundY1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Protractor angle arc at obelisk tip
    const arcR = 35;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(obeliskX, obeliskTopY, arcR, Math.PI * 0.5, Math.PI * 0.5 + angleRad);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`θ = ${this.sunAngle.toFixed(1)}°`, obeliskX + 8, obeliskTopY + arcR + 14);

    // Annotations on Obelisk Diagram
    ctx.fillStyle = '#ede8dc';
    ctx.font = '10px serif';
    ctx.fillText(`Alexandria Obelisk (Height H)`, obeliskX - 80, obeliskTopY + 30);
    ctx.fillStyle = '#c83232';
    ctx.fillText(`Shadow Length L = H · tan(θ)`, obeliskX + 10, groundY1 + 22);

    ctx.restore();

    // ---------------------------------------------------------
    // Bottom Half of Vignette: Syene Solstice Well (Zenith)
    // ---------------------------------------------------------
    const groundY2 = plateY + plateH * 0.72;
    const wellX = plateX + plateW * 0.38;
    const wellW = 44;
    const wellD = 58;

    // Ground line for Syene
    ctx.strokeStyle = THEME.papyrusDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plateX + 14, groundY2);
    ctx.lineTo(plateX + plateW - 14, groundY2);
    ctx.stroke();

    // Well Masonry Walls
    ctx.fillStyle = '#22232a';
    ctx.fillRect(wellX - wellW * 0.5, groundY2, wellW, wellD);

    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wellX - wellW * 0.5, groundY2, wellW, wellD);

    // Shimmering Water Table at well bottom
    const waterY = groundY2 + wellD - 12;
    ctx.fillStyle = '#1c4482';
    ctx.fillRect(wellX - wellW * 0.5 + 2, waterY, wellW - 4, 10);

    // Direct Vertical Sunray down the center of the well (θ = 0°)
    const beamGrad = ctx.createLinearGradient(wellX, groundY2 - 40, wellX, waterY);
    beamGrad.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
    beamGrad.addColorStop(1, 'rgba(255, 215, 0, 0.85)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(wellX - 10, groundY2 - 40, 20, wellD - 12 + 40);

    // Glowing golden sun reflection on the water
    ctx.fillStyle = '#fff8b0';
    ctx.beginPath();
    ctx.arc(wellX, waterY + 4, 8, 0, TWO_PI);
    ctx.fill();

    // Well Annotations
    ctx.fillStyle = '#3bd6c6';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Syene Solstice Well (Tropic of Cancer)', plateX + 16, groundY2 - 14);

    ctx.fillStyle = '#ede8dc';
    ctx.font = '10px serif';
    ctx.fillText('Sun overhead at zenith (θ = 0°)', plateX + 16, groundY2 + 20);
    ctx.fillText('No shadow cast on vertical walls!', plateX + 16, groundY2 + 34);
    ctx.fillText('Bottom of well illuminated directly.', plateX + 16, groundY2 + 48);

    // ---------------------------------------------------------
    // Mathematical Synthesis Card (Bottom Box)
    // ---------------------------------------------------------
    const cardY = plateY + plateH * 0.78;
    const cardH = plateH * 0.20;
    ctx.fillStyle = 'rgba(10, 10, 14, 0.8)';
    ctx.beginPath();
    ctx.roundRect(plateX + 10, cardY, plateW - 20, cardH, 6);
    ctx.fill();
    ctx.strokeStyle = THEME.obsidianBorder;
    ctx.stroke();

    const circumStadia = Math.round(this.stadiaDistance * (360 / this.sunAngle));
    const circumKm = Math.round(circumStadia * STADIA_TO_KM);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillText('Eratosthenes Equation of the Cosmos', plateX + 22, cardY + 20);

    ctx.fillStyle = '#e4d5b7';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`Circumference C = s · (360° / θ)`, plateX + 22, cardY + 38);
    ctx.fillText(`C = ${this.stadiaDistance} · ${(360 / this.sunAngle).toFixed(2)} = ${circumStadia.toLocaleString()} stadia (~${circumKm.toLocaleString()} km)`, plateX + 22, cardY + 54);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Mode 2 Renderer: Sieve of Eratosthenes (Prime Grid)
  // -------------------------------------------------------------
  renderPrimeSieve(ctx) {
    const w = this.width;
    const h = this.height;

    // Header & Telemetry Banner
    this.renderSieveHeader(ctx);

    // Layout Numbers Grid
    const cols = this.gridLimit > 144 ? 14 : (this.gridLimit > 100 ? 12 : 10);
    const rows = Math.ceil(this.numbers.length / cols);

    const marginX = 28;
    const marginTop = 90;
    const marginBottom = 65;
    const gridW = w - marginX * 2;
    const gridH = h - marginTop - marginBottom;

    const cellGap = 6;
    const cellW = (gridW - (cols - 1) * cellGap) / cols;
    const cellH = (gridH - (rows - 1) * cellGap) / rows;

    // Store cell coordinates for click/hover testing
    for (let i = 0; i < this.numbers.length; i++) {
      const cell = this.numbers[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      cell.x = marginX + col * (cellW + cellGap);
      cell.y = marginTop + row * (cellH + cellGap);
      cell.w = cellW;
      cell.h = cellH;
    }

    // Active Elimination Ray (Laser/Quill stroke from prime to multiple)
    if (this.activeEliminationRay) {
      const ray = this.activeEliminationRay;
      const alpha = Math.max(0, ray.life / ray.maxLife);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ray.fromX, ray.fromY);
      ctx.lineTo(ray.toX, ray.toY);
      ctx.stroke();

      // Glowing pulse dot at target
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(ray.toX, ray.toY, 6, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }

    // Render Each Cell
    for (let cell of this.numbers) {
      this.renderSieveCell(ctx, cell);
    }

    // Render Particle Sparks
    this.renderSparks(ctx);

    // Render Prime Sequence Timeline at bottom
    this.renderPrimeTimeline(ctx, marginX, h - 52, gridW, 38);
  }

  renderSieveHeader(ctx) {
    const w = this.width;
    const narrow = w < 560;

    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${narrow ? 12 : 16}px Cinzel, serif`;
    ctx.textAlign = 'left';
    ctx.fillText(narrow ? 'SIEVE OF ERATOSTHENES' : 'SIEVE OF ERATOSTHENES • KOKKINON (Κόσκινον Ἐρατοσθένους)', narrow ? 16 : 28, 34);

    ctx.fillStyle = '#c7b28a';
    ctx.font = `${narrow ? 9.5 : 12}px serif`;
    ctx.fillText(narrow ? 'Elimination of composite multiples' : 'Systematic elimination of composite multiples in a natural number grid', narrow ? 16 : 28, 52);

    // Status Pill
    let statusText = `Sifting with Prime p = ${this.currentPrime}`;
    let statusColor = '#ffd700';
    if (this.sieveState === 'FINISHED') {
      statusText = `🏆 Primes Found up to ${this.gridLimit}!`;
      statusColor = '#3bd6c6';
    } else if (this.sieveState === 'MARK_MULTIPLES') {
      statusText = `Eliminating multiples: ${this.currentPrime} × k ...`;
      statusColor = '#f59e0b';
    }

    if (!narrow) {
      ctx.textAlign = 'right';
      ctx.fillStyle = statusColor;
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(statusText, w - 28, 36);

      ctx.fillStyle = '#ede8dc';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(`Prime Density π(${this.gridLimit})/${this.gridLimit} = ${((this.primesFound.length / this.gridLimit) * 100).toFixed(1)}%`, w - 28, 52);
    }

    ctx.restore();
  }

  renderSieveCell(ctx, cell) {
    const { x, y, w, h, value, state, primeFactor, glow } = cell;
    const isHovered = this.hoverCell === cell;
    const isCurrentPrime = state === 'prime' && value === this.currentPrime;
    const isHighlightedMultiple = this.hoverCell && this.hoverCell.state === 'prime' && value % this.hoverCell.value === 0 && value > this.hoverCell.value;

    ctx.save();

    // 1. Cell Card Background
    if (state === 'prime') {
      // Confirmed Prime: Cyber-Gold radiant card
      const primeGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      primeGrad.addColorStop(0, '#594411');
      primeGrad.addColorStop(0.5, '#785b14');
      primeGrad.addColorStop(1, '#3b2c09');
      ctx.fillStyle = primeGrad;

      // Outer golden aura
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = isCurrentPrime ? 16 * glow : 8;
    } else if (state === 'composite') {
      // Eliminated composite: Basalt charcoal slab
      ctx.fillStyle = isHighlightedMultiple ? '#2c1e18' : '#141418';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else {
      // Untouched cell: Papyrus obsidian card
      ctx.fillStyle = isHovered ? '#262633' : '#1c1c24';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // 2. Cell Borders
    if (isCurrentPrime) {
      ctx.strokeStyle = '#fff899';
      ctx.lineWidth = 2.5;
    } else if (state === 'prime') {
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
    } else if (state === 'composite') {
      ctx.strokeStyle = isHighlightedMultiple ? '#c83232' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = isHovered ? '#d4af37' : 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    // 3. Number Typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state === 'prime') {
      ctx.fillStyle = '#fff3aa';
      ctx.font = 'bold 14px Cinzel, serif';
      ctx.fillText(value.toString(), x + w * 0.5, y + h * 0.46);

      // Tiny Prime Laurel badge
      ctx.fillStyle = '#ffd700';
      ctx.font = '8px serif';
      ctx.fillText('PRIME', x + w * 0.5, y + h * 0.8);
    } else if (state === 'composite') {
      // Composite: dimmed font + slash line
      ctx.fillStyle = isHighlightedMultiple ? '#ff8a80' : '#6b6762';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText(value.toString(), x + w * 0.5, y + h * 0.48);

      // Terracotta ink slash line
      ctx.strokeStyle = isHighlightedMultiple ? '#ff5252' : 'rgba(184, 83, 51, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h - 4);
      ctx.lineTo(x + w - 4, y + 4);
      ctx.stroke();

      // Divisor factor tag
      if (primeFactor) {
        ctx.fillStyle = 'rgba(184, 83, 51, 0.9)';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText(`÷${primeFactor}`, x + w * 0.5, y + h * 0.82);
      }
    } else {
      // Untouched natural number
      ctx.fillStyle = isHovered ? '#ffd700' : '#e4d5b7';
      ctx.font = '13px JetBrains Mono, monospace';
      ctx.fillText(value.toString(), x + w * 0.5, y + h * 0.5);
    }

    ctx.restore();
  }

  renderSparks(ctx) {
    ctx.save();
    for (let s of this.sparks) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  }

  renderPrimeTimeline(ctx, x, y, width, height) {
    ctx.save();

    // Backdrop slab for primes list
    ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.strokeStyle = THEME.obsidianBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRIMES: ', x + 10, y + height * 0.5);

    // Render horizontally scrollable/wrapped discovered primes
    const startX = x + 72;
    const maxItems = Math.min(this.primesFound.length, 28);
    let curX = startX;

    for (let i = 0; i < maxItems; i++) {
      const p = this.primesFound[i];
      const pStr = p.toString();
      const pW = ctx.measureText(pStr).width + 12;

      if (curX + pW > x + width - 10) break;

      // Small gold pill
      ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
      ctx.beginPath();
      ctx.roundRect(curX, y + 6, pW, height - 12, 4);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.stroke();

      ctx.fillStyle = '#fff8b0';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pStr, curX + pW * 0.5, y + height * 0.5);

      curX += pW + 6;
    }

    if (this.primesFound.length > maxItems) {
      ctx.fillStyle = '#8c909e';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`+${this.primesFound.length - maxItems} more`, curX + 4, y + height * 0.5);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Input Handling: Mouse Interaction
  // -------------------------------------------------------------
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };
    this.initAudio();

    if (this.mode === 'circumference') {
      // In circumference mode: allow dragging to adjust sun angle
      this.isDraggingSun = true;
      this.handleCircumferenceDrag(pos.x, pos.y);
    } else {
      // In sieve mode: click on cell
      const clickedCell = this.findCellAt(pos.x, pos.y);
      if (clickedCell) {
        this.selectedCell = clickedCell;
        if (clickedCell.state === 'prime') {
          this.playSound('prime', 300 + (clickedCell.value % 15) * 30);
        } else if (clickedCell.state === 'composite') {
          this.playSound('strike');
        }
      }
    }
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };

    if (this.mode === 'circumference') {
      if (this.isMouseDown && this.isDraggingSun) {
        this.handleCircumferenceDrag(pos.x, pos.y);
      }
    } else {
      this.hoverCell = this.findCellAt(pos.x, pos.y);
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    this.isDraggingSun = false;
    this.isDraggingShadow = false;
  }

  handleCircumferenceDrag(x, y) {
    // Map mouse X across viewport to sun angle between 1.0° and 25.0°
    const norm = Math.max(0, Math.min(1, x / this.width));
    const newAngle = 1.0 + norm * 24.0;
    this.sunAngle = Math.round(newAngle * 10) / 10;
    this.updateControlsUI();
  }

  findCellAt(x, y) {
    if (this.mode !== 'sieve') return null;
    for (let cell of this.numbers) {
      if (x >= cell.x && x <= cell.x + cell.w && y >= cell.y && y <= cell.y + cell.h) {
        return cell;
      }
    }
    return null;
  }

  // -------------------------------------------------------------
  // Input Handling: Keyboard Interaction
  // -------------------------------------------------------------
  onKeyDown(key, e) {
    this.initAudio();

    if (key === ' ' || key === 'Spacebar') {
      if (this.mode === 'sieve') {
        this.stepSieve();
        this.updateControlsUI();
      }
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === '1' || key === 'c' || key === 'C') {
      this.setMode('circumference');
    } else if (key === '2' || key === 's' || key === 'S' || key === 'p' || key === 'P') {
      this.setMode('sieve');
    } else if (key === 'r' || key === 'R') {
      this.reset();
    }
  }

  onKeyUp(key, e) {}
}
