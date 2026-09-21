// Signal Fire: Polybius Optical Telegraph & Mountain Watchtower Network
// Pliny Game Lab — Pavilion X: Strategia & Legio (Military Tactics)
// Grounded in Polybius (Histories Book X.45–47) and Pliny the Elder (Naturalis Historia)
// Zero external dependencies — pure ES module

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

const TWO_PI = Math.PI * 2;
const DEG2RAD = Math.PI / 180;

// Polybius 5x5 Coordinate Cipher Matrix (Classical Roman / Greek 25-letter alphabet)
// Note: 'J' is mapped to 'I' in the classical Latin Polybius square.
const POLYBIUS_GRID = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'K'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z']
];

const ROMAN_NUMS = ['I', 'II', 'III', 'IV', 'V'];

// Build fast lookup table for characters -> { row, col } (1-indexed)
const CHAR_MAP = {};
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    const ch = POLYBIUS_GRID[r][c];
    CHAR_MAP[ch] = { row: r + 1, col: c + 1, char: ch };
  }
}
// Map 'J' to 'I'
CHAR_MAP['J'] = { row: 2, col: 4, char: 'I' };

function encodeChar(c) {
  if (!c) return null;
  const upper = c.toUpperCase();
  if (upper === ' ') return { isSpace: true, char: ' ' };
  return CHAR_MAP[upper] || null;
}

function decodeCoords(row, col) {
  if (row >= 1 && row <= 5 && col >= 1 && col <= 5) {
    return POLYBIUS_GRID[row - 1][col - 1];
  }
  return '?';
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class SignalFireEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Scaling
    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    attachTouchBridge(this, canvas);

    // Simulation Modes & Parameters
    this.mode = 'night'; // 'night' (torches & dusk sky) or 'day' (smoke columns & sunlit mountains)
    this.transmissionSpeed = 1.0; // Speed multiplier (0.5x to 3.0x)
    this.haze = 0.35; // Optical atmospheric line-of-sight haze (0.05 to 0.90)
    this.windSpeed = 22.0; // Horizontal wind drift (px/s)
    this.time = 0;

    // Transmission Pipeline State
    this.presets = [
      { id: 'HOSTIS ADEST', label: 'HOSTIS ADEST', desc: 'Enemy is at hand (Frontier Alarm)' },
      { id: 'LEGIO VICTA', label: 'LEGIO VICTA', desc: 'Legion Victorious (Triumph)' },
      { id: 'MITTE AUXILIUM', label: 'MITTE AUXILIUM', desc: 'Send Reinforcements (Urgent Relief)' }
    ];
    this.selectedPreset = 'HOSTIS ADEST';
    this.messageText = 'HOSTIS ADEST';
    this.customInputText = 'HOSTIS ADEST';
    this.isTransmitting = false;
    this.isPaused = false;
    this.transmitIndex = 0; // Index of next character to transmit from Tower 0
    this.charTimer = 0; // Timer for current character cycle at Tower 0
    this.currentSymbol = null; // { char, row, col, isSpace } currently held at Tower 0
    this.decodedOutput = ''; // Text successfully received & decoded at Tower 3 (Rome Command)

    // Interactive UI HUD Layout (Polybius 5x5 Matrix on screen)
    this.hud = {
      x: 22,
      y: 20,
      w: 220,
      h: 220,
      cellSize: 36,
      hoverCell: null // { r, c }
    };
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;

    // Watchtower Network (4 Mountain Watchtowers along the Roman Limes)
    this.towers = [];
    this.initTowers();

    // Signal Packets & Particles
    this.packets = []; // Optical line-of-sight wavefront packets traveling between towers
    this.particles = []; // Fire ember and smoke particles
    this.maxParticles = 600;

    // Audio System
    this.audioCtx = null;

    // Build UI Controls
    this.initControls();

    // Initial state reset
    this.reset();
  }

  /* -------------------------------------------------------------------------- */
  /* WATCHTOWER NETWORK INITIALIZATION                                          */
  /* -------------------------------------------------------------------------- */

  initTowers() {
    // 4 Watchtowers positioned along panoramic mountain summits
    // Tower 0: Frontier Outpost (Mons Algidus)
    // Tower 1: Relay Station Alpha (Mons Albanus)
    // Tower 2: Relay Station Beta (Mons Tusculum)
    // Tower 3: Imperial Headquarters (Arx Capitolina)
    this.towers = [
      {
        id: 0,
        name: 'Turris I — Mons Algidus',
        role: 'Limes Outpost (Origin TX)',
        xRatio: 0.12,
        yRatio: 0.60,
        x: 0,
        y: 0,
        leftLit: 0, // Number of torches lit in Left Bank (Row: 1..5)
        rightLit: 0, // Number of torches lit in Right Bank (Col: 1..5)
        targetLeftLit: 0,
        targetRightLit: 0,
        activeChar: '',
        statusText: 'READY',
        receivedText: '',
        flashAlpha: 0,
        bannerPhase: 0,
        braziersLeft: [],
        braziersRight: []
      },
      {
        id: 1,
        name: 'Turris II — Mons Albanus',
        role: 'Relay Statio I',
        xRatio: 0.38,
        yRatio: 0.49,
        x: 0,
        y: 0,
        leftLit: 0,
        rightLit: 0,
        targetLeftLit: 0,
        targetRightLit: 0,
        activeChar: '',
        statusText: 'LISTENING',
        receivedText: '',
        flashAlpha: 0,
        bannerPhase: 1.2,
        braziersLeft: [],
        braziersRight: []
      },
      {
        id: 2,
        name: 'Turris III — Mons Tusculum',
        role: 'Relay Statio II',
        xRatio: 0.64,
        yRatio: 0.56,
        x: 0,
        y: 0,
        leftLit: 0,
        rightLit: 0,
        targetLeftLit: 0,
        targetRightLit: 0,
        activeChar: '',
        statusText: 'LISTENING',
        receivedText: '',
        flashAlpha: 0,
        bannerPhase: 2.5,
        braziersLeft: [],
        braziersRight: []
      },
      {
        id: 3,
        name: 'Turris IV — Arx Capitolina',
        role: 'Roma Imperialis (Terminal RX)',
        xRatio: 0.89,
        yRatio: 0.44,
        x: 0,
        y: 0,
        leftLit: 0,
        rightLit: 0,
        targetLeftLit: 0,
        targetRightLit: 0,
        activeChar: '',
        statusText: 'RECEIVING',
        receivedText: '',
        flashAlpha: 0,
        bannerPhase: 3.8,
        braziersLeft: [],
        braziersRight: []
      }
    ];

    this.updateTowerPositions();
  }

  updateTowerPositions() {
    const w = this.width;
    const h = this.height;

    // Calculate watchtower spatial positions based on aspect ratio & layout
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      t.x = t.xRatio * w;
      // Adjust vertical position to sit realistically along mountain ridge
      t.y = t.yRatio * h;

      // Calculate the 5 Left Braziers and 5 Right Braziers on the crenellated roof deck
      // Tower roof platform width ~52px
      const platformHalfW = 28;
      const roofY = t.y - 46;

      t.braziersLeft = [];
      t.braziersRight = [];

      // 5 torches on Left Bank (Row indicators)
      const leftStartX = t.x - platformHalfW - 14;
      for (let j = 0; j < 5; j++) {
        t.braziersLeft.push({
          x: leftStartX + j * 6.5,
          y: roofY,
          lit: false
        });
      }

      // 5 torches on Right Bank (Column indicators)
      const rightStartX = t.x + 8;
      for (let j = 0; j < 5; j++) {
        t.braziersRight.push({
          x: rightStartX + j * 6.5,
          y: roofY,
          lit: false
        });
      }
    }

    // Reposition Polybius HUD to bottom-left with safe padding
    if (this.hud) {
      this.hud.w = Math.min(220, w * 0.32);
      this.hud.cellSize = Math.floor((this.hud.w - 32) / 5);
      this.hud.h = this.hud.cellSize * 5 + 38;
      this.hud.x = 22;
      this.hud.y = Math.max(14, h - this.hud.h - 22);
    }
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

  playSound(type, param = 0) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    try {
      if (type === 'torch') {
        // Warm flame ignition whoosh
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 30, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      } else if (type === 'relay') {
        // Resonant Roman cornu / bronze beacon chime
        // Hop index gives ascending melodic notes: C4 (261Hz), E4 (329Hz), G4 (392Hz), C5 (523Hz)
        const notes = [261.63, 329.63, 392.0, 523.25];
        const freq = notes[param % notes.length] || 330;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.35);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      } else if (type === 'click') {
        // Crisp stone tablet click
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    } catch {
      // Audio failsafes
    }
  }

  /* -------------------------------------------------------------------------- */
  /* DYNAMIC UI CONTROLS                                                        */
  /* -------------------------------------------------------------------------- */

  initControls() {
    // Safe headless DOM guard
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Message Preset</label>
        <div class="control-btn-grid" id="signal-preset-selector">
          <button class="sub-btn ${this.selectedPreset === 'HOSTIS ADEST' ? 'active' : ''}" data-preset="HOSTIS ADEST" title="Frontier Alarm">⚔️ HOSTIS ADEST</button>
          <button class="sub-btn ${this.selectedPreset === 'LEGIO VICTA' ? 'active' : ''}" data-preset="LEGIO VICTA" title="Victory Signal">🦅 LEGIO VICTA</button>
          <button class="sub-btn ${this.selectedPreset === 'MITTE AUXILIUM' ? 'active' : ''}" data-preset="MITTE AUXILIUM" title="Urgent Relief">🛡️ MITTE AUXILIUM</button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>Custom Message Input</span>
          <span style="font-size: 0.72rem; color: #d4af37;">(Polybius 5x5)</span>
        </label>
        <div style="display: flex; gap: 6px;">
          <input type="text" id="signal-custom-text" value="${this.messageText}" maxlength="24"
            style="flex: 1; background: rgba(18, 22, 34, 0.85); border: 1px solid #4a3e28; border-radius: 4px; color: #fff; padding: 6px 8px; font-family: monospace; font-size: 0.85rem; text-transform: uppercase;">
          <button id="signal-apply-btn" class="sub-btn" style="padding: 6px 12px; font-weight: bold; border-color: #d4af37;">Set</button>
        </div>
      </div>

      <div class="control-group">
        <label>Signalling Mode</label>
        <div class="control-btn-grid" id="signal-mode-selector">
          <button class="sub-btn ${this.mode === 'night' ? 'active' : ''}" data-mode="night" title="Dusk Night Torches">🔥 Night Torches</button>
          <button class="sub-btn ${this.mode === 'day' ? 'active' : ''}" data-mode="day" title="Daylight Smoke Plumes">💨 Day Smoke</button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>Transmission Speed</span>
          <span id="signal-speed-val">${this.transmissionSpeed.toFixed(1)}x</span>
        </label>
        <input type="range" id="signal-speed-slider" min="0.5" max="3.0" step="0.1" value="${this.transmissionSpeed}">
      </div>

      <div class="control-group">
        <label>
          <span>Mountain Atmospheric Haze</span>
          <span id="signal-haze-val">${Math.round(this.haze * 100)}%</span>
        </label>
        <input type="range" id="signal-haze-slider" min="0.05" max="0.90" step="0.05" value="${this.haze}">
      </div>

      <div class="control-group" style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
        <button id="signal-transmit-btn" class="sub-btn" style="background: rgba(212, 175, 55, 0.25); border-color: var(--accent-gold, #d4af37); color: #fff; font-weight: bold; padding: 9px;">
          ⚡ Transmit Message
        </button>
        <button id="signal-reset-btn" class="sub-btn" style="border-color: #665233; padding: 6px;">
          🔄 Reset Network & Clear Log
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.35); border-radius: 6px; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #a0a6b6; line-height: 1.55;">
        <div><strong>Active Cipher:</strong> Polybius 5x5 Matrix</div>
        <div><strong>Left Bank:</strong> Row (I..V Torches)</div>
        <div><strong>Right Bank:</strong> Column (I..V Torches)</div>
        <div><strong>Terminal Reception:</strong> <span id="telemetry-rx-text" style="color: #ffd700;">---</span></div>
      </div>
    `;

    // Hook Presets
    const presetBtns = this.controlsContainer.querySelectorAll('#signal-preset-selector .sub-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pId = btn.dataset.preset;
        this.selectedPreset = pId;
        this.setMessage(pId);
        const input = this.controlsContainer.querySelector('#signal-custom-text');
        if (input) input.value = pId;
        this.startTransmission();
      });
    });

    // Custom text input
    const applyBtn = this.controlsContainer.querySelector('#signal-apply-btn');
    const inputEl = this.controlsContainer.querySelector('#signal-custom-text');
    if (applyBtn && inputEl) {
      applyBtn.addEventListener('click', () => {
        const val = inputEl.value.trim().toUpperCase();
        if (val) {
          presetBtns.forEach(b => b.classList.remove('active'));
          this.setMessage(val);
          this.startTransmission();
        }
      });
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          applyBtn.click();
        }
      });
    }

    // Mode Selector
    const modeBtns = this.controlsContainer.querySelectorAll('#signal-mode-selector .sub-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.mode);
      });
    });

    // Speed Slider
    const speedSlider = this.controlsContainer.querySelector('#signal-speed-slider');
    const speedVal = this.controlsContainer.querySelector('#signal-speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.transmissionSpeed = parseFloat(e.target.value);
        if (speedVal) speedVal.textContent = `${this.transmissionSpeed.toFixed(1)}x`;
      });
    }

    // Haze Slider
    const hazeSlider = this.controlsContainer.querySelector('#signal-haze-slider');
    const hazeVal = this.controlsContainer.querySelector('#signal-haze-val');
    if (hazeSlider) {
      hazeSlider.addEventListener('input', (e) => {
        this.haze = parseFloat(e.target.value);
        if (hazeVal) hazeVal.textContent = `${Math.round(this.haze * 100)}%`;
      });
    }

    // Transmit Button
    const transmitBtn = this.controlsContainer.querySelector('#signal-transmit-btn');
    if (transmitBtn) {
      transmitBtn.addEventListener('click', () => {
        if (!this.isTransmitting) {
          this.startTransmission();
        } else {
          this.isPaused = !this.isPaused;
          transmitBtn.textContent = this.isPaused ? '▶️ RESUME TRANSMISSION' : '⏸️ PAUSE TRANSMISSION';
        }
      });
    }

    // Reset Button
    const resetBtn = this.controlsContainer.querySelector('#signal-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    this.updateTelemetry();
  }

  updateTelemetry() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const rxEl = this.controlsContainer.querySelector('#telemetry-rx-text');
    if (rxEl) {
      rxEl.textContent = this.decodedOutput || '---';
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.initAudio();
    this.playSound('click');
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const btns = this.controlsContainer.querySelectorAll('#signal-mode-selector .sub-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  setMessage(text) {
    this.messageText = text.toUpperCase().replace(/[^A-Z ]/g, '');
    this.customInputText = this.messageText;
  }

  startTransmission() {
    this.initAudio();
    this.isTransmitting = true;
    this.isPaused = false;
    this.transmitIndex = 0;
    this.charTimer = 0;
    this.decodedOutput = '';
    this.packets = [];

    // Clear received messages across all towers
    for (let i = 0; i < this.towers.length; i++) {
      this.towers[i].receivedText = '';
      this.towers[i].leftLit = 0;
      this.towers[i].rightLit = 0;
      this.towers[i].activeChar = '';
      this.towers[i].statusText = i === 0 ? 'TX ACTIVE' : 'LISTENING';
    }

    if (this.controlsContainer && typeof document !== 'undefined') {
      const btn = this.controlsContainer.querySelector('#signal-transmit-btn');
      if (btn) btn.textContent = '⏸️ PAUSE TRANSMISSION';
    }

    this.updateTelemetry();
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE & CONTRACT METHODS                                               */
  /* -------------------------------------------------------------------------- */

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
    this.updateTowerPositions();
  }

  reset() {
    this.isTransmitting = false;
    this.isPaused = false;
    this.transmitIndex = 0;
    this.charTimer = 0;
    this.currentSymbol = null;
    this.decodedOutput = '';
    this.packets = [];
    this.particles = [];

    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      t.leftLit = 0;
      t.rightLit = 0;
      t.activeChar = '';
      t.statusText = i === 0 ? 'READY' : (i === 3 ? 'RECEIVING' : 'LISTENING');
      t.receivedText = '';
      t.flashAlpha = 0;
    }

    if (this.controlsContainer && typeof document !== 'undefined') {
      const btn = this.controlsContainer.querySelector('#signal-transmit-btn');
      if (btn) btn.textContent = '⚡ Transmit Message';
    }

    this.updateTelemetry();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer && typeof document !== 'undefined') {
      this.controlsContainer.innerHTML = '';
    }
    this.packets = [];
    this.particles = [];
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  getEntityCount() {
    // Specification: "Entity Count: Watchtowers + torches + fire ember particles + signal transmission packets."
    const towersCount = this.towers.length; // 4 watchtowers
    let torchesCount = 0;
    for (let i = 0; i < this.towers.length; i++) {
      torchesCount += this.towers[i].braziersLeft.length + this.towers[i].braziersRight.length; // 10 per tower = 40
    }
    const particlesCount = this.particles.length;
    const packetsCount = this.packets.length;

    return towersCount + torchesCount + particlesCount + packetsCount;
  }

  /* -------------------------------------------------------------------------- */
  /* SIMULATION UPDATE                                                          */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    // Safeguard delta time against huge pauses or background tabs
    const delta = Math.min(0.1, dt);
    this.time += delta;

    // 1. Update Transmit State Machine at Origin (Tower 0)
    if (this.isTransmitting && !this.isPaused) {
      // Cycle timing scaled by transmissionSpeed
      // baseCycleDuration: 1.4 seconds per character
      const cycleDuration = 1.4 / this.transmissionSpeed;
      const holdDuration = cycleDuration * 0.72; // Hold torches lit for 72% of cycle

      this.charTimer += delta;

      if (this.transmitIndex < this.messageText.length) {
        const rawChar = this.messageText[this.transmitIndex];
        const encoded = encodeChar(rawChar);

        if (this.charTimer < holdDuration) {
          // ACTIVE SIGNALLING PHASE: Tower 0 has torches raised
          if (encoded && !encoded.isSpace) {
            if (this.towers[0].leftLit !== encoded.row || this.towers[0].rightLit !== encoded.col) {
              this.towers[0].leftLit = encoded.row;
              this.towers[0].rightLit = encoded.col;
              this.towers[0].activeChar = encoded.char;
              this.towers[0].flashAlpha = 1.0;
              this.currentSymbol = encoded;
              this.playSound('torch', 0);

              // Dispatch optical signal wavefront packet from Tower 0 to Tower 1
              this.spawnPacket(0, 1, encoded);
            }
          } else {
            // Space delimiter: lower torches briefly
            this.towers[0].leftLit = 0;
            this.towers[0].rightLit = 0;
            this.towers[0].activeChar = ' ';
            this.currentSymbol = { isSpace: true, char: ' ' };
          }
          this.towers[0].statusText = `TX [${rawChar}]`;
        } else if (this.charTimer < cycleDuration) {
          // BLANKING INTERVAL PHASE: Extinguish torches to clearly delineate consecutive letters
          this.towers[0].leftLit = 0;
          this.towers[0].rightLit = 0;
          this.towers[0].activeChar = '';
          this.towers[0].statusText = 'TX BLANK';
        } else {
          // Advance to next character
          this.charTimer = 0;
          this.transmitIndex++;
          if (this.transmitIndex >= this.messageText.length) {
            // Transmission complete!
            this.isTransmitting = false;
            this.towers[0].statusText = 'TX COMPLETE';
            if (this.controlsContainer && typeof document !== 'undefined') {
              const btn = this.controlsContainer.querySelector('#signal-transmit-btn');
              if (btn) btn.textContent = '⚡ Transmit Message';
            }
          }
        }
      }
    }

    // 2. Update Optical Transmission Packets (Traveling between towers)
    const packetSpeed = 1.35 * this.transmissionSpeed; // Progress per second
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const pkt = this.packets[i];
      pkt.progress += delta * packetSpeed;

      // Position interpolation
      const tA = this.towers[pkt.fromTower];
      const tB = this.towers[pkt.toTower];
      pkt.x = lerp(tA.x, tB.x, pkt.progress);
      // Slight atmospheric arc across mountain pass
      const arc = Math.sin(pkt.progress * Math.PI) * -24;
      pkt.y = lerp(tA.y - 45, tB.y - 45, pkt.progress) + arc;

      // Emit optical flare sparks as packet moves
      if (Math.random() < 0.35) {
        this.emitPacketParticle(pkt.x, pkt.y);
      }

      // Check packet arrival at destination tower
      if (pkt.progress >= 1.0) {
        const destTower = this.towers[pkt.toTower];
        destTower.flashAlpha = 1.0;
        this.playSound('relay', pkt.toTower);

        if (!pkt.encoded.isSpace) {
          // Light up destination tower's torches to confirm reception and repeat
          destTower.leftLit = pkt.encoded.row;
          destTower.rightLit = pkt.encoded.col;
          destTower.activeChar = pkt.encoded.char;

          // If this tower is not the terminal receiver, relay to the next tower down the line!
          if (pkt.toTower < this.towers.length - 1) {
            destTower.statusText = `RELAY [${pkt.encoded.char}]`;
            // Forward packet along network chain
            this.spawnPacket(pkt.toTower, pkt.toTower + 1, pkt.encoded);
          } else {
            // Terminal Receiver (Tower 3 - Rome Command)
            destTower.statusText = `DECODED [${pkt.encoded.char}]`;
            this.decodedOutput += pkt.encoded.char;
            destTower.receivedText = this.decodedOutput;
            this.updateTelemetry();
          }
        } else {
          // Space delimiter
          if (pkt.toTower === this.towers.length - 1) {
            this.decodedOutput += ' ';
            destTower.receivedText = this.decodedOutput;
            this.updateTelemetry();
          }
        }

        // Spawn golden reception sparks at watchtower crenellation
        this.emitReceptionBurst(destTower.x, destTower.y - 50);

        // Remove packet
        this.packets.splice(i, 1);
      }
    }

    // 3. Update Watchtower Status & Torches
    for (let i = 0; i < this.towers.length; i++) {
      const tower = this.towers[i];

      // Fade reception flash
      if (tower.flashAlpha > 0) {
        tower.flashAlpha = Math.max(0, tower.flashAlpha - delta * 2.2);
      }

      // If a relay tower has torches lit, slowly extinguish them after brief display duration
      if (i > 0 && tower.leftLit > 0 && this.packets.every(p => p.fromTower !== i && p.toTower !== i)) {
        // Extinguish after 0.7s
        tower.leftLit = 0;
        tower.rightLit = 0;
        tower.activeChar = '';
        if (i !== 3) tower.statusText = 'LISTENING';
      }

      // Banner wind flutter phase
      tower.bannerPhase += delta * (4.0 + (this.windSpeed * 0.08));

      // Emit brazier embers and smoke
      this.updateBrazierParticles(tower, delta);
    }

    // 4. Update Particle Physics (Flames, Embers, Smoke)
    this.updateParticles(delta);
  }

  spawnPacket(fromIdx, toIdx, encoded) {
    this.packets.push({
      fromTower: fromIdx,
      toTower: toIdx,
      encoded,
      progress: 0.0,
      x: this.towers[fromIdx].x,
      y: this.towers[fromIdx].y - 45
    });
  }

  /* -------------------------------------------------------------------------- */
  /* PARTICLE SYSTEMS (TORCH FLAMES, EMBERS, SMOKE)                             */
  /* -------------------------------------------------------------------------- */

  updateBrazierParticles(tower, dt) {
    const isDay = this.mode === 'day';

    // Left Braziers (Row indicator torches)
    for (let b = 0; b < tower.braziersLeft.length; b++) {
      const brazier = tower.braziersLeft[b];
      const isLit = b < tower.leftLit;

      // Lit torches emit active fire particles or heavy smoke plumes
      if (isLit) {
        if (isDay) {
          // Dense billowing day smoke
          if (Math.random() < 0.45) {
            this.emitSmokeParticle(brazier.x, brazier.y - 4, 1.2);
          }
        } else {
          // Night fire flame & rising ember
          this.emitFlameParticle(brazier.x, brazier.y - 4);
          if (Math.random() < 0.3) {
            this.emitEmberParticle(brazier.x, brazier.y - 6);
          }
        }
      } else {
        // Dormant pilot coals: occasional faint ember/wisp
        if (!isDay && Math.random() < 0.02) {
          this.emitEmberParticle(brazier.x, brazier.y - 2, 0.4);
        }
      }
    }

    // Right Braziers (Col indicator torches)
    for (let b = 0; b < tower.braziersRight.length; b++) {
      const brazier = tower.braziersRight[b];
      const isLit = b < tower.rightLit;

      if (isLit) {
        if (isDay) {
          if (Math.random() < 0.45) {
            this.emitSmokeParticle(brazier.x, brazier.y - 4, 1.2);
          }
        } else {
          this.emitFlameParticle(brazier.x, brazier.y - 4);
          if (Math.random() < 0.3) {
            this.emitEmberParticle(brazier.x, brazier.y - 6);
          }
        }
      } else {
        if (!isDay && Math.random() < 0.02) {
          this.emitEmberParticle(brazier.x, brazier.y - 2, 0.4);
        }
      }
    }
  }

  emitFlameParticle(x, y) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      type: 'flame',
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: (Math.random() - 0.5) * 8 + (this.windSpeed * 0.12),
      vy: -18 - Math.random() * 26,
      size: 3.5 + Math.random() * 3.5,
      alpha: 0.9,
      maxLife: 0.28 + Math.random() * 0.2,
      life: 0
    });
  }

  emitEmberParticle(x, y, scale = 1.0) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      type: 'ember',
      x: x + (Math.random() - 0.5) * 6,
      y: y,
      vx: (Math.random() - 0.5) * 14 + (this.windSpeed * 0.4),
      vy: -35 - Math.random() * 45,
      size: (1.2 + Math.random() * 1.8) * scale,
      alpha: 1.0,
      maxLife: 0.8 + Math.random() * 0.7,
      life: 0
    });
  }

  emitSmokeParticle(x, y, density = 1.0) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: (Math.random() - 0.5) * 10 + (this.windSpeed * 0.5),
      vy: -30 - Math.random() * 35,
      size: 5 + Math.random() * 4,
      maxSize: (20 + Math.random() * 16) * density,
      alpha: 0.55 * density,
      maxLife: 1.8 + Math.random() * 1.2,
      life: 0
    });
  }

  emitPacketParticle(x, y) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      type: 'packet_spark',
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      size: 1.5 + Math.random() * 2.0,
      alpha: 1.0,
      maxLife: 0.35,
      life: 0
    });
  }

  emitReceptionBurst(x, y) {
    for (let i = 0; i < 14; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * TWO_PI;
      const spd = 30 + Math.random() * 70;
      this.particles.push({
        type: 'burst_spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 20,
        size: 2.0 + Math.random() * 2.5,
        alpha: 1.0,
        maxLife: 0.5 + Math.random() * 0.3,
        life: 0
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'flame') {
        p.alpha = (1.0 - progress) * 0.9;
        p.size = Math.max(1, p.size - dt * 4);
      } else if (p.type === 'ember') {
        p.alpha = 1.0 - Math.pow(progress, 1.5);
        p.vx += (Math.random() - 0.5) * 30 * dt;
        p.vy -= 12 * dt; // Slight thermal buoyancy
      } else if (p.type === 'smoke') {
        p.alpha = (1.0 - progress) * 0.55;
        p.size = lerp(p.size, p.maxSize, progress);
        p.vx += (this.windSpeed * 0.2) * dt;
      } else if (p.type === 'packet_spark' || p.type === 'burst_spark') {
        p.alpha = 1.0 - progress;
        p.vy += 60 * dt; // Gravity
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING PIPELINE                                                         */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // 1. Draw Panoramic Mountain Ridge Sky & Atmosphere
    this.renderSky(ctx, w, h);

    // 2. Distant & Mid-ground Mountain Ridges
    this.renderMountainRidges(ctx, w, h);

    // 3. Atmospheric Fog / Valley Haze
    this.renderAtmosphericHaze(ctx, w, h);

    // 4. Optical Line-of-Sight Telegraph Lines & Traveling Packets
    this.renderOpticalSightlines(ctx);

    // 5. Roman Watchtowers (Ashlar masonry, timber decks, guard, braziers)
    for (let i = 0; i < this.towers.length; i++) {
      this.renderWatchtower(ctx, this.towers[i]);
    }

    // 6. Particles (Torch flames, glowing embers, day smoke columns)
    this.renderParticles(ctx);

    // 7. Interactive Polybius 5x5 Matrix HUD & Telemetry Ribbon
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderSky(ctx, w, h) {
    const isDay = this.mode === 'day';
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.75);

    if (isDay) {
      // Mediterranean daylight
      grad.addColorStop(0, '#3a7bd5');
      grad.addColorStop(0.45, '#68a0e8');
      grad.addColorStop(0.82, '#c4daf5');
      grad.addColorStop(1, '#e4eaf4');
    } else {
      // Dusk twilight (Indigo -> Burnt crimson -> Sunset gold along mountain peaks)
      grad.addColorStop(0, '#090a14');
      grad.addColorStop(0.35, '#16152b');
      grad.addColorStop(0.65, '#3b1c2b');
      grad.addColorStop(0.85, '#7a3120');
      grad.addColorStop(1, '#a84c24');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars at dusk
    if (!isDay) {
      ctx.fillStyle = '#ffffff';
      // Deterministic decorative starfield
      for (let i = 0; i < 48; i++) {
        const sx = ((i * 137.5) % w);
        const sy = ((i * 83.1) % (h * 0.42));
        const twinkle = Math.sin(this.time * 2.5 + i) * 0.35 + 0.65;
        const rad = (i % 3 === 0 ? 1.5 : 1.0);
        ctx.globalAlpha = twinkle * 0.85;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, TWO_PI);
        ctx.fill();
      }

      // Crescent Moon in dusk sky
      const moonX = w * 0.82;
      const moonY = h * 0.16;
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#fff4db';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 14, 0, TWO_PI);
      ctx.fill();
      // Cutout for crescent
      ctx.fillStyle = '#16152b';
      ctx.beginPath();
      ctx.arc(moonX + 6, moonY - 2, 12, 0, TWO_PI);
      ctx.fill();

      ctx.globalAlpha = 1.0;
    }
  }

  renderMountainRidges(ctx, w, h) {
    const isDay = this.mode === 'day';

    // Layer 1: Distant majestic mountain peaks (Silhouette with atmospheric fading)
    ctx.save();
    ctx.fillStyle = isDay ? 'rgba(105, 138, 178, 0.65)' : 'rgba(32, 24, 48, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    const peaks = [
      { x: 0, y: h * 0.62 },
      { x: w * 0.15, y: h * 0.42 },
      { x: w * 0.28, y: h * 0.54 },
      { x: w * 0.42, y: h * 0.34 },
      { x: w * 0.58, y: h * 0.50 },
      { x: w * 0.74, y: h * 0.38 },
      { x: w * 0.88, y: h * 0.48 },
      { x: w, y: h * 0.40 }
    ];
    for (let p of peaks) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Mid-ground rugged crags where watchtowers sit
    ctx.fillStyle = isDay ? '#5a6e82' : '#1c1624';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    const crags = [
      { x: 0, y: h * 0.70 },
      { x: w * 0.12, y: h * 0.60 }, // Mons Algidus summit (Tower 0)
      { x: w * 0.24, y: h * 0.72 },
      { x: w * 0.38, y: h * 0.49 }, // Mons Albanus summit (Tower 1)
      { x: w * 0.52, y: h * 0.68 },
      { x: w * 0.64, y: h * 0.56 }, // Mons Tusculum summit (Tower 2)
      { x: w * 0.76, y: h * 0.66 },
      { x: w * 0.89, y: h * 0.44 }, // Arx Capitolina summit (Tower 3)
      { x: w, y: h * 0.58 }
    ];
    for (let c of crags) {
      ctx.lineTo(c.x, c.y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Foreground rock strata & crags base
    ctx.fillStyle = isDay ? '#3d4a58' : '#120f18';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.88);
    ctx.lineTo(w * 0.18, h * 0.76);
    ctx.lineTo(w * 0.44, h * 0.82);
    ctx.lineTo(w * 0.70, h * 0.78);
    ctx.lineTo(w, h * 0.84);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderAtmosphericHaze(ctx, w, h) {
    // Optical haze layer based on this.haze slider
    if (this.haze <= 0.05) return;

    ctx.save();
    const isDay = this.mode === 'day';
    const hazeAlpha = this.haze * (isDay ? 0.45 : 0.38);

    const hazeGrad = ctx.createLinearGradient(0, h * 0.4, 0, h * 0.85);
    if (isDay) {
      hazeGrad.addColorStop(0, `rgba(220, 230, 245, 0)`);
      hazeGrad.addColorStop(0.5, `rgba(200, 218, 238, ${hazeAlpha})`);
      hazeGrad.addColorStop(1, `rgba(180, 200, 220, ${hazeAlpha * 1.3})`);
    } else {
      hazeGrad.addColorStop(0, `rgba(80, 50, 70, 0)`);
      hazeGrad.addColorStop(0.5, `rgba(110, 55, 60, ${hazeAlpha * 0.8})`);
      hazeGrad.addColorStop(1, `rgba(45, 25, 40, ${hazeAlpha * 1.2})`);
    }

    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, h * 0.35, w, h * 0.55);

    ctx.restore();
  }

  renderOpticalSightlines(ctx) {
    ctx.save();

    // Line-of-sight sightline between adjacent towers
    for (let i = 0; i < this.towers.length - 1; i++) {
      const tA = this.towers[i];
      const tB = this.towers[i + 1];

      // Dashed optical sightline
      ctx.strokeStyle = this.mode === 'day' ? 'rgba(80, 110, 140, 0.28)' : 'rgba(212, 175, 55, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(tA.x, tA.y - 45);
      ctx.lineTo(tB.x, tB.y - 45);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Active Traveling Packets (Optical light pulses)
    for (let pkt of this.packets) {
      const isDay = this.mode === 'day';

      // Glowing outer halo
      const haloGrad = ctx.createRadialGradient(pkt.x, pkt.y, 1, pkt.x, pkt.y, 22);
      if (isDay) {
        haloGrad.addColorStop(0, 'rgba(255, 240, 150, 0.9)');
        haloGrad.addColorStop(0.4, 'rgba(240, 180, 50, 0.45)');
        haloGrad.addColorStop(1, 'rgba(200, 120, 20, 0)');
      } else {
        haloGrad.addColorStop(0, 'rgba(255, 255, 240, 1.0)');
        haloGrad.addColorStop(0.3, 'rgba(255, 170, 40, 0.7)');
        haloGrad.addColorStop(0.7, 'rgba(255, 90, 10, 0.3)');
        haloGrad.addColorStop(1, 'rgba(200, 40, 0, 0)');
      }

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, 22, 0, TWO_PI);
      ctx.fill();

      // Brilliant core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, 3.5, 0, TWO_PI);
      ctx.fill();

      // Floating character badge above packet
      if (!pkt.encoded.isSpace) {
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(`[${pkt.encoded.char}]`, pkt.x, pkt.y - 14);
      }
    }

    ctx.restore();
  }

  renderWatchtower(ctx, tower) {
    ctx.save();
    const x = tower.x;
    const y = tower.y;
    const isDay = this.mode === 'day';

    // Flash illumination when receiving / transmitting packet
    if (tower.flashAlpha > 0.01) {
      const flashGrad = ctx.createRadialGradient(x, y - 40, 5, x, y - 40, 95);
      flashGrad.addColorStop(0, `rgba(255, 215, 80, ${tower.flashAlpha * 0.65})`);
      flashGrad.addColorStop(0.5, `rgba(255, 140, 20, ${tower.flashAlpha * 0.35})`);
      flashGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(x, y - 40, 95, 0, TWO_PI);
      ctx.fill();
    }

    // 1. Stone Ashlar Masonry Foundation & Main Tower
    const towerW = 44;
    const towerH = 48;
    const baseH = 10;

    // Slanted battered base
    ctx.fillStyle = isDay ? '#70695d' : '#2d2724';
    ctx.beginPath();
    ctx.moveTo(x - towerW * 0.58, y);
    ctx.lineTo(x + towerW * 0.58, y);
    ctx.lineTo(x + towerW * 0.5, y - baseH);
    ctx.lineTo(x - towerW * 0.5, y - baseH);
    ctx.closePath();
    ctx.fill();

    // Main Tower Body
    const bodyGrad = ctx.createLinearGradient(x - towerW * 0.5, 0, x + towerW * 0.5, 0);
    if (isDay) {
      bodyGrad.addColorStop(0, '#948a7b');
      bodyGrad.addColorStop(0.5, '#aba091');
      bodyGrad.addColorStop(1, '#6c6356');
    } else {
      bodyGrad.addColorStop(0, '#3a322c');
      bodyGrad.addColorStop(0.6, '#463c35');
      bodyGrad.addColorStop(1, '#231d19');
    }
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x - towerW * 0.5, y - towerH, towerW, towerH - baseH);

    // Ashlar stone course lines
    ctx.strokeStyle = isDay ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    for (let row = 1; row <= 4; row++) {
      const lineY = y - baseH - (row * 8);
      ctx.beginPath();
      ctx.moveTo(x - towerW * 0.5, lineY);
      ctx.lineTo(x + towerW * 0.5, lineY);
      ctx.stroke();
    }

    // Arched Roman Window / Arrow Slit
    ctx.fillStyle = isDay ? '#2b2622' : '#0e0c0b';
    ctx.beginPath();
    ctx.arc(x, y - 28, 4, Math.PI, 0);
    ctx.lineTo(x + 4, y - 20);
    ctx.lineTo(x - 4, y - 20);
    ctx.closePath();
    ctx.fill();

    // 2. Crenellated Parapet / Battlement Terrace
    const parapetW = 54;
    const parapetY = y - towerH;
    ctx.fillStyle = isDay ? '#aba091' : '#4d423b';
    ctx.fillRect(x - parapetW * 0.5, parapetY - 5, parapetW, 6);

    // Stone Crenellations (Merlons)
    const merlonW = 7;
    const merlonH = 8;
    ctx.fillStyle = isDay ? '#948a7b' : '#3d342e';
    // 5 merlons across roof
    for (let m = 0; m < 5; m++) {
      const mx = x - parapetW * 0.5 + (m * 11.5);
      ctx.fillRect(mx, parapetY - 5 - merlonH, merlonW, merlonH);
    }

    // 3. Central Lookout Sentry & Roman SPQR Vexillum (Banner)
    // Sentry silhouette
    ctx.fillStyle = isDay ? '#231d19' : '#14100e';
    // Head & plumed helmet
    ctx.beginPath();
    ctx.arc(x, parapetY - 14, 2.5, 0, TWO_PI);
    ctx.fill();
    // Torso
    ctx.fillRect(x - 2, parapetY - 11, 4, 7);
    // Spear / Staff
    ctx.strokeStyle = isDay ? '#4a3828' : '#33271c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 3, parapetY - 22);
    ctx.lineTo(x + 3, parapetY - 4);
    ctx.stroke();

    // Vexillum flagpole & fluttering red Roman banner
    const poleX = x - 5;
    ctx.strokeStyle = '#6b5840';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(poleX, parapetY - 28);
    ctx.lineTo(poleX, parapetY - 4);
    ctx.stroke();

    // Red banner fluttering with wave
    const wave = Math.sin(tower.bannerPhase) * 3.5;
    ctx.fillStyle = '#9e2a2b';
    ctx.beginPath();
    ctx.moveTo(poleX, parapetY - 28);
    ctx.lineTo(poleX - 14, parapetY - 28 + wave * 0.5);
    ctx.lineTo(poleX - 12, parapetY - 18 + wave);
    ctx.lineTo(poleX, parapetY - 19);
    ctx.closePath();
    ctx.fill();

    // Gold fringe / SPQR marker on banner
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(poleX - 8, parapetY - 25 + wave * 0.5, 4, 3);

    // 4. Torch Brazier Stands (Left Bank = Row, Right Bank = Column)
    this.renderBrazierBank(ctx, tower.braziersLeft, tower.leftLit, 'LEFT (ROW)');
    this.renderBrazierBank(ctx, tower.braziersRight, tower.rightLit, 'RIGHT (COL)');

    // 5. Watchtower Name & Status Readout
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(tower.name, x, y + 16);

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c5b8a5';
    ctx.fillText(`[ ${tower.statusText} ]`, x, y + 27);

    ctx.restore();
  }

  renderBrazierBank(ctx, braziers, litCount, label) {
    const isDay = this.mode === 'day';

    for (let i = 0; i < braziers.length; i++) {
      const b = braziers[i];
      const isLit = i < litCount;

      // Iron Tripod Brazier Stand
      ctx.strokeStyle = isDay ? '#36302a' : '#221c18';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Tripod legs
      ctx.moveTo(b.x - 2.5, b.y + 4);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(b.x + 2.5, b.y + 4);
      ctx.stroke();

      // Bronze bowl
      ctx.fillStyle = isDay ? '#8a5d2d' : '#473117';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI);
      ctx.fill();

      // Fire coals
      if (isLit) {
        // Blazing torch / coals
        ctx.fillStyle = '#ff7700';
        ctx.beginPath();
        ctx.arc(b.x, b.y - 1, 2.5, 0, TWO_PI);
        ctx.fill();

        ctx.fillStyle = '#fff4bd';
        ctx.beginPath();
        ctx.arc(b.x, b.y - 1.5, 1.2, 0, TWO_PI);
        ctx.fill();
      } else {
        // Dormant embers
        ctx.fillStyle = isDay ? '#2b231d' : '#521d15';
        ctx.beginPath();
        ctx.arc(b.x, b.y - 0.5, 1.2, 0, TWO_PI);
        ctx.fill();
      }
    }
  }

  renderParticles(ctx) {
    ctx.save();

    for (let p of this.particles) {
      if (p.alpha <= 0.01) continue;

      if (p.type === 'flame') {
        const rad = Math.max(1, p.size);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(255, 255, 230, ${p.alpha})`);
        grad.addColorStop(0.4, `rgba(255, 150, 20, ${p.alpha * 0.9})`);
        grad.addColorStop(1, `rgba(210, 40, 0, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, TWO_PI);
        ctx.fill();
      } else if (p.type === 'ember') {
        ctx.fillStyle = `rgba(255, 200, 50, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
        ctx.fill();
      } else if (p.type === 'smoke') {
        // Volumetric smoke puff
        const rad = Math.max(2, p.size);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(50, 55, 65, ${p.alpha})`);
        grad.addColorStop(0.7, `rgba(90, 95, 105, ${p.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(130, 135, 145, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, TWO_PI);
        ctx.fill();
      } else if (p.type === 'packet_spark' || p.type === 'burst_spark') {
        ctx.fillStyle = `rgba(255, 235, 120, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* POLYBIUS 5X5 MATRIX HUD & TELEMETRY RIBBON                                 */
  /* -------------------------------------------------------------------------- */

  renderPolybiusHUD(ctx) {
    ctx.save();
    const h = this.hud;

    // Background Roman parchment / bronze tablet
    const bgGrad = ctx.createLinearGradient(h.x, h.y, h.x + h.w, h.y + h.h);
    bgGrad.addColorStop(0, 'rgba(18, 14, 12, 0.92)');
    bgGrad.addColorStop(1, 'rgba(28, 22, 18, 0.95)');
    ctx.fillStyle = bgGrad;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(h.x, h.y, h.w, h.h, 6);
      ctx.fill();
    } else {
      ctx.fillRect(h.x, h.y, h.w, h.h);
    }

    // Classical gold border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(h.x, h.y, h.w, h.h, 6);
      ctx.stroke();
    } else {
      ctx.strokeRect(h.x, h.y, h.w, h.h);
    }

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px "JetBrains Mono", serif';
    ctx.textAlign = 'left';
    ctx.fillText('POLYBII TELEGRAPHUS (5x5)', h.x + 10, h.y + 16);

    // Active Row and Column highlight beams
    const activeRow = (this.currentSymbol && !this.currentSymbol.isSpace) ? this.currentSymbol.row : null;
    const activeCol = (this.currentSymbol && !this.currentSymbol.isSpace) ? this.currentSymbol.col : null;

    const startX = h.x + 24;
    const startY = h.y + 32;
    const cs = h.cellSize;

    // Column Headers (I .. V)
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    for (let c = 0; c < 5; c++) {
      const cx = startX + c * cs + cs * 0.5;
      const isColActive = activeCol === (c + 1);
      ctx.fillStyle = isColActive ? '#ff8c00' : '#a89878';
      ctx.fillText(ROMAN_NUMS[c], cx, startY - 4);
    }

    // Render Grid Cells
    for (let r = 0; r < 5; r++) {
      const ry = startY + r * cs;
      const isRowActive = activeRow === (r + 1);

      // Row Header (I .. V)
      ctx.fillStyle = isRowActive ? '#ff8c00' : '#a89878';
      ctx.textAlign = 'right';
      ctx.fillText(ROMAN_NUMS[r], startX - 6, ry + cs * 0.65);

      for (let c = 0; c < 5; c++) {
        const rx = startX + c * cs;
        const letter = POLYBIUS_GRID[r][c];
        const isSelected = activeRow === (r + 1) && activeCol === (c + 1);
        const isHover = h.hoverCell && h.hoverCell.r === r && h.hoverCell.c === c;

        // Cell background
        if (isSelected) {
          ctx.fillStyle = 'rgba(255, 140, 0, 0.45)';
          ctx.fillRect(rx, ry, cs, cs);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, cs, cs);
        } else if (isHover) {
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.fillRect(rx, ry, cs, cs);
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, ry, cs, cs);
        } else {
          ctx.strokeStyle = 'rgba(100, 80, 50, 0.35)';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(rx, ry, cs, cs);
        }

        // Letter text
        ctx.font = isSelected ? 'bold 12px monospace' : '11px monospace';
        ctx.fillStyle = isSelected ? '#ffffff' : (isHover ? '#ffd700' : '#dcd2b8');
        ctx.textAlign = 'center';
        ctx.fillText(letter === 'I' ? 'I/J' : letter, rx + cs * 0.5, ry + cs * 0.68);
      }
    }

    ctx.restore();
  }

  renderHUD(ctx) {
    this.renderPolybiusHUD(ctx);
    this.renderTelemetryRibbon(ctx, this.width, this.height);
  }

  renderTelemetryRibbon(ctx, w, h) {
    ctx.save();

    const narrow = w < 560;
    const barH = narrow ? 44 : 58;
    const barY = 12;
    const barX = narrow ? 14 : Math.max(this.hud.x + this.hud.w + 16, w * 0.28);
    const barW = narrow ? (w - 28) : (w - barX - 18);

    if (barW > 120) {
      // Background Plate
      const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY + barH);
      barGrad.addColorStop(0, 'rgba(14, 12, 16, 0.88)');
      barGrad.addColorStop(1, 'rgba(24, 18, 14, 0.92)');
      ctx.fillStyle = barGrad;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 6);
        ctx.fill();
      } else {
        ctx.fillRect(barX, barY, barW, barH);
      }

      ctx.strokeStyle = '#8d7343';
      ctx.lineWidth = 1.2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 6);
        ctx.stroke();
      } else {
        ctx.strokeRect(barX, barY, barW, barH);
      }

      if (narrow) {
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#a89878';
        ctx.fillText(`TX: ${this.messageText}`, barX + 8, barY + 16);

        ctx.fillStyle = '#ffd700';
        ctx.fillText('RX (ROMA):', barX + 8, barY + 32);
        ctx.fillStyle = '#3bd6c6';
        ctx.fillText(`"${this.decodedOutput || '---'}"`, barX + 75, barY + 32);
      } else {
        // Origin Message Stream
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#a89878';
        ctx.fillText('ORIGIN TRANSMISSION:', barX + 12, barY + 18);

        // Render message letters with active cursor highlight
        let textX = barX + 145;
        for (let i = 0; i < this.messageText.length; i++) {
          const ch = this.messageText[i];
          if (i === this.transmitIndex && this.isTransmitting) {
            ctx.fillStyle = '#ff8c00';
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
          } else if (i < this.transmitIndex) {
            ctx.fillStyle = '#6e6556';
            ctx.font = '10px "JetBrains Mono", monospace';
          } else {
            ctx.fillStyle = '#dcd2b8';
            ctx.font = '10px "JetBrains Mono", monospace';
          }
          ctx.fillText(ch, textX, barY + 18);
          textX += 9;
        }

        // Terminal Reception Decoded at Rome
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('DECODED AT ROMA (ARX):', barX + 12, barY + 40);

        ctx.fillStyle = '#3bd6c6';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`"${this.decodedOutput || '---'}"`, barX + 165, barY + 40);
      }
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* INTERACTIVE INPUT HANDLING                                                 */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    this.initAudio();
    this.isMouseDown = true;
    this.mousePos = pos;

    // Check if clicked inside Polybius 5x5 Grid HUD
    const h = this.hud;
    const startX = h.x + 24;
    const startY = h.y + 32;
    const cs = h.cellSize;

    if (pos && pos.x >= startX && pos.x <= startX + cs * 5 && pos.y >= startY && pos.y <= startY + cs * 5) {
      const c = Math.floor((pos.x - startX) / cs);
      const r = Math.floor((pos.y - startY) / cs);
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const clickedLetter = POLYBIUS_GRID[r][c];
        this.playSound('click');
        // Transmit clicked letter immediately
        this.transmitSingleLetter(clickedLetter);
        return;
      }
    }

    // Check if clicked on a watchtower
    if (pos) {
      for (let i = 0; i < this.towers.length; i++) {
        const t = this.towers[i];
        const dx = pos.x - t.x;
        const dy = pos.y - (t.y - 25);
        if (Math.hypot(dx, dy) < 40) {
          // Fire celebration flare from watchtower
          this.emitReceptionBurst(t.x, t.y - 48);
          this.playSound('relay', i);
          return;
        }
      }
    }
  }

  transmitSingleLetter(char) {
    const encoded = encodeChar(char);
    if (!encoded) return;

    this.currentSymbol = encoded;
    this.towers[0].leftLit = encoded.row;
    this.towers[0].rightLit = encoded.col;
    this.towers[0].activeChar = encoded.char;
    this.towers[0].flashAlpha = 1.0;
    this.playSound('torch', 0);

    // Dispatch packet along network
    this.spawnPacket(0, 1, encoded);
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    if (!pos) return;

    // Track hover over Polybius grid
    const h = this.hud;
    const startX = h.x + 24;
    const startY = h.y + 32;
    const cs = h.cellSize;

    if (pos.x >= startX && pos.x <= startX + cs * 5 && pos.y >= startY && pos.y <= startY + cs * 5) {
      const c = Math.floor((pos.x - startX) / cs);
      const r = Math.floor((pos.y - startY) / cs);
      h.hoverCell = { r, c };
    } else {
      h.hoverCell = null;
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Enter') {
      if (!this.isTransmitting) {
        this.startTransmission();
      } else {
        this.isPaused = !this.isPaused;
      }
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === '1') {
      this.selectedPreset = 'HOSTIS ADEST';
      this.setMessage('HOSTIS ADEST');
      this.startTransmission();
    } else if (key === '2') {
      this.selectedPreset = 'LEGIO VICTA';
      this.setMessage('LEGIO VICTA');
      this.startTransmission();
    } else if (key === '3') {
      this.selectedPreset = 'MITTE AUXILIUM';
      this.setMessage('MITTE AUXILIUM');
      this.startTransmission();
    } else if (key === 'n' || key === 'N') {
      this.setMode(this.mode === 'night' ? 'day' : 'night');
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key && key.length === 1 && /[a-zA-Z]/.test(key)) {
      // Direct keyboard letter typing
      this.transmitSingleLetter(key.toUpperCase());
    }
  }
}
