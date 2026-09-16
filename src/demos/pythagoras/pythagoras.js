// Pliny Game Lab — Pythagoras (Monochord & Harmonics)
// Pure ES module with zero external dependencies.
// Simulates 1D vibrating string wave equation with movable bridge,
// Fourier overtone decomposition, oscilloscope waveforms, Lissajous figures,
// and polished Roman/Hellenistic bronze soundboard aesthetics.

export class PythagorasEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Simulation Parameters
    this.time = 0;
    this.tension = 60; // Pluck tension (affects wave speed c and pitch)
    this.damping = 0.9982; // Wave dissipation per substep
    this.bridgeRatio = 2 / 3; // Position of the movable bridge (3:2 fifth)
    this.audioEnabled = true;

    // Wave equation grid discretization (1D string)
    this.NODE_COUNT = 128;
    this.y = new Float32Array(this.NODE_COUNT); // Current displacement
    this.yPrev = new Float32Array(this.NODE_COUNT); // Previous displacement
    this.yNext = new Float32Array(this.NODE_COUNT); // Next displacement
    this.envelope = new Float32Array(this.NODE_COUNT); // Peak envelope tracker

    // Harmonic Spectrum (Fourier Decomposition)
    this.HARMONIC_COUNT = 16;
    this.harmonicsLeft = new Float32Array(this.HARMONIC_COUNT);
    this.harmonicsRight = new Float32Array(this.HARMONIC_COUNT);

    // Oscilloscope trace buffer
    this.OSC_SAMPLES = 240;
    this.oscBuffer = new Float32Array(this.OSC_SAMPLES);
    this.oscIndex = 0;

    // Interactive State
    this.isDraggingBridge = false;
    this.isPluckingString = false;
    this.pluckPos = { x: 0.33, y: 0 };
    this.mouse = { x: 0, y: 0, rawX: 0, rawY: 0, down: false };
    this.hoverBridge = false;

    // Classical Interval Presets
    this.presets = [
      { name: '1:1 Unison (Isophonos)', ratio: 0.500, label: '1:1', greek: 'ΙΣΟΦΩΝΟΣ', num: 1, den: 1 },
      { name: '2:1 Octave (Diapason)', ratio: 2 / 3, label: '2:1', greek: 'ΔΙΑ ΠΑΣΩΝ', num: 2, den: 1 },
      { name: '3:2 Fifth (Diapente)', ratio: 3 / 5, label: '3:2', greek: 'ΔΙΑ ΠΕΝΤΕ', num: 3, den: 2 },
      { name: '4:3 Fourth (Diatessaron)', ratio: 4 / 7, label: '4:3', greek: 'ΔΙΑ ΤΕΣΣΑΡΩΝ', num: 4, den: 3 },
      { name: '9:8 Tone (Epogdoon)', ratio: 9 / 17, label: '9:8', greek: 'ΕΠΟΓΔΟΟΝ', num: 9, den: 8 }
    ];

    // Soundboard layout cache
    this.board = { x: 40, y: 160, w: 720, h: 100, stringY: 210 };

    // WebAudio context (safe lazy init)
    this.audioCtx = null;

    // Initialize systems
    this.updateBoardLayout();
    this.buildControls();
    this.reset();
  }

  // ---------------------------------------------------------------------------
  // Audio Synthesis (Safe WebAudio with Headless Guards)
  // ---------------------------------------------------------------------------

  initAudio() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      // Safe fallback in headless / sandboxed environments
    }
  }

  playPluckSound(amp = 1.0) {
    if (!this.audioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx || this.audioCtx.state !== 'running') return;

      const now = this.audioCtx.currentTime;
      const baseFreq = 110 * (this.tension / 50); // A2 fundamental base

      // Left segment frequency (shorter segment = higher pitch)
      const r = Math.max(0.1, Math.min(0.9, this.bridgeRatio));
      const freqLeft = baseFreq / r;
      const freqRight = baseFreq / (1 - r);

      const segments = [
        { freq: freqLeft, weight: 0.65 * amp, duration: 1.6 },
        { freq: freqRight, weight: 0.50 * amp, duration: 1.4 }
      ];

      segments.forEach(({ freq, weight, duration }) => {
        // Additive harmonics: fundamental, 2nd, 3rd, 4th
        const harmonics = [
          { mult: 1, gainMult: 1.0 },
          { mult: 2, gainMult: 0.5 },
          { mult: 3, gainMult: 0.25 },
          { mult: 4, gainMult: 0.12 }
        ];

        harmonics.forEach(({ mult, gainMult }) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = mult === 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq * mult, now);

          const startGain = Math.min(0.2, 0.08 * weight * gainMult);
          gain.gain.setValueAtTime(startGain, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / mult);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now);
          osc.stop(now + duration / mult + 0.05);
        });
      });
    } catch (e) {
      // Safe guard
    }
  }

  // ---------------------------------------------------------------------------
  // Geometry & Layout
  // ---------------------------------------------------------------------------

  updateBoardLayout() {
    const w = this.width || 800;
    const h = this.height || 600;
    const boardMargin = Math.max(30, Math.min(60, w * 0.06));
    const boardW = Math.max(200, w - boardMargin * 2);
    const boardH = Math.max(70, Math.min(110, h * 0.18));
    const boardY = Math.max(130, Math.min(220, h * 0.28));
    const stringY = boardY + boardH * 0.52;

    this.board = {
      x: boardMargin,
      y: boardY,
      w: boardW,
      h: boardH,
      stringY: stringY,
      leftNutX: boardMargin + 35,
      rightNutX: boardMargin + boardW - 35
    };
    this.board.stringLength = Math.max(50, this.board.rightNutX - this.board.leftNutX);
  }

  // ---------------------------------------------------------------------------
  // Simulation: 1D Wave Equation Numerical Integration
  // ---------------------------------------------------------------------------

  reset() {
    this.time = 0;
    this.y.fill(0);
    this.yPrev.fill(0);
    this.yNext.fill(0);
    this.envelope.fill(0);
    this.oscBuffer.fill(0);
    this.harmonicsLeft.fill(0);
    this.harmonicsRight.fill(0);

    // Initial classical pluck
    this.pluck(0.35, 38);
  }

  pluck(normPos = 0.35, amplitude = 35) {
    const N = this.NODE_COUNT;
    const center = Math.max(1, Math.min(N - 2, Math.round(normPos * (N - 1))));
    const bridgeK = this.getBridgeNodeIndex();

    for (let i = 0; i < N; i++) {
      let disp = 0;
      if (center <= bridgeK && i <= bridgeK && bridgeK > 0) {
        // Pluck within left segment
        if (i <= center) {
          disp = (i / center) * amplitude;
        } else {
          disp = ((bridgeK - i) / (bridgeK - center)) * amplitude;
        }
      } else if (center > bridgeK && i >= bridgeK && bridgeK < N - 1) {
        // Pluck within right segment
        if (i <= center) {
          disp = ((i - bridgeK) / (center - bridgeK)) * amplitude;
        } else {
          disp = ((N - 1 - i) / (N - 1 - center)) * amplitude;
        }
      } else {
        // Full string fallback
        if (i <= center) {
          disp = (i / center) * amplitude;
        } else {
          disp = ((N - 1 - i) / (N - 1 - center)) * amplitude;
        }
      }

      this.y[i] = disp;
      this.yPrev[i] = disp;
      this.yNext[i] = disp;
      this.envelope[i] = Math.abs(disp);
    }

    // Clamp boundary nodes and bridge
    this.y[0] = 0;
    this.yPrev[0] = 0;
    this.y[N - 1] = 0;
    this.yPrev[N - 1] = 0;
    if (bridgeK >= 0 && bridgeK < N) {
      this.y[bridgeK] = 0;
      this.yPrev[bridgeK] = 0;
    }

    this.playPluckSound(amplitude / 35);
  }

  getBridgeNodeIndex() {
    const r = Math.max(0.05, Math.min(0.95, this.bridgeRatio));
    return Math.round(r * (this.NODE_COUNT - 1));
  }

  getBridgeScreenX() {
    return this.board.leftNutX + this.bridgeRatio * this.board.stringLength;
  }

  setBridgePositionFromScreenX(screenX) {
    const clampedX = Math.max(this.board.leftNutX + 20, Math.min(this.board.rightNutX - 20, screenX));
    let ratio = (clampedX - this.board.leftNutX) / this.board.stringLength;

    // Magnetic snap to known Pythagorean intervals if within 2.5%
    for (const p of this.presets) {
      if (Math.abs(ratio - p.ratio) < 0.022) {
        ratio = p.ratio;
        break;
      }
    }

    this.bridgeRatio = ratio;
    if (this.bridgeInput) {
      this.bridgeInput.value = ratio.toFixed(3);
    }
    if (this.bridgeLabel) {
      this.bridgeLabel.textContent = `Bridge Position: ${ratio.toFixed(3)} (${this.getActiveIntervalLabel()})`;
    }
  }

  getActiveIntervalLabel() {
    for (const p of this.presets) {
      if (Math.abs(this.bridgeRatio - p.ratio) < 0.02) {
        return `${p.label} ${p.greek}`;
      }
    }
    return `${(this.bridgeRatio / (1 - this.bridgeRatio)).toFixed(2)}:1`;
  }

  update(dt) {
    const safeDt = Math.min(dt || 0.016, 0.05);
    this.time += safeDt;

    const N = this.NODE_COUNT;
    const bridgeK = this.getBridgeNodeIndex();

    // Wave propagation physics
    // Stability factor: alpha = (c * dt / dx)^2 <= 1
    // Number of sub-steps ensures high acoustic resolution without instability
    const subSteps = 12;
    const tensionFactor = (this.tension / 50);
    const alpha = Math.min(0.68, 0.45 * tensionFactor);
    const damp = Math.pow(this.damping, 1 / subSteps);

    for (let s = 0; s < subSteps; s++) {
      // 1D discrete wave equation update
      for (let i = 1; i < N - 1; i++) {
        if (i === bridgeK) {
          this.yNext[i] = 0; // Clamped at movable bridge
          continue;
        }
        const laplacian = this.y[i + 1] - 2 * this.y[i] + this.y[i - 1];
        const nextVal = 2 * this.y[i] - this.yPrev[i] + alpha * laplacian;
        this.yNext[i] = nextVal * damp;
      }

      // Fixed string ends
      this.yNext[0] = 0;
      this.yNext[N - 1] = 0;
      if (bridgeK > 0 && bridgeK < N - 1) {
        this.yNext[bridgeK] = 0;
      }

      // Cycle buffers
      for (let i = 0; i < N; i++) {
        this.yPrev[i] = this.y[i];
        this.y[i] = this.yNext[i];

        // Track peak amplitude envelope with gradual decay
        if (Math.abs(this.y[i]) > this.envelope[i]) {
          this.envelope[i] = Math.abs(this.y[i]);
        } else {
          this.envelope[i] *= 0.9995;
        }
      }
    }

    // Sample audio oscilloscope trace at 1/4 of string
    const sampleNode = Math.round(N * 0.25);
    this.oscBuffer[this.oscIndex] = this.y[sampleNode];
    this.oscIndex = (this.oscIndex + 1) % this.OSC_SAMPLES;

    // Compute Discrete Sine Fourier Transform (Harmonic Overtones)
    this.computeHarmonics(bridgeK);
  }

  computeHarmonics(bridgeK) {
    const H = this.HARMONIC_COUNT;
    const N = this.NODE_COUNT;

    // Left segment harmonics (0 to bridgeK)
    const lenL = Math.max(1, bridgeK);
    for (let m = 1; m <= H; m++) {
      let sum = 0;
      for (let j = 1; j < bridgeK; j++) {
        sum += this.y[j] * Math.sin((m * Math.PI * j) / lenL);
      }
      const amp = Math.abs((2 / lenL) * sum);
      // Smooth filter
      this.harmonicsLeft[m - 1] = this.harmonicsLeft[m - 1] * 0.7 + amp * 0.3;
    }

    // Right segment harmonics (bridgeK to N - 1)
    const lenR = Math.max(1, N - 1 - bridgeK);
    for (let m = 1; m <= H; m++) {
      let sum = 0;
      for (let j = bridgeK + 1; j < N - 1; j++) {
        const offset = j - bridgeK;
        sum += this.y[j] * Math.sin((m * Math.PI * offset) / lenR);
      }
      const amp = Math.abs((2 / lenR) * sum);
      this.harmonicsRight[m - 1] = this.harmonicsRight[m - 1] * 0.7 + amp * 0.3;
    }
  }

  // ---------------------------------------------------------------------------
  // Contract: Entity Count
  // Wave discretization nodes (128) + active harmonic spectrum bars (16) = 144
  // ---------------------------------------------------------------------------

  getEntityCount() {
    return this.NODE_COUNT + this.HARMONIC_COUNT;
  }

  // ---------------------------------------------------------------------------
  // Rendering System
  // ---------------------------------------------------------------------------

  render(ctx) {
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    // Background: Deep obsidian bronze aesthetic
    ctx.save();
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, w, h);

    // Subtle classical acoustic grid pattern
    this.renderAcousticGrid(ctx, w, h);

    // 1. Classical Soundboard & Monochord Kanon
    this.renderSoundboard(ctx);

    // 2. Movable Bridge (Magas) & Ruler Markers
    this.renderBridge(ctx);

    // 3. Vibrating String & Envelope Glow
    this.renderVibratingString(ctx);

    // 4. Oscilloscope Waveform Panel (Time Domain)
    this.renderOscilloscope(ctx);

    // 5. Lissajous Harmonic Figures (Consonant Ratio Orbit)
    this.renderLissajousFigure(ctx);

    // 6. Fourier Harmonic Spectrum Analyzer (Frequency Domain)
    this.renderHarmonicSpectrum(ctx);

    // 7. Classical Roman Inscriptions & HUD Header
    this.renderHUD(ctx, w, h);

    ctx.restore();
  }

  renderAcousticGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.035)';
    ctx.lineWidth = 1;
    const gridSize = 36;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSoundboard(ctx) {
    const b = this.board;
    ctx.save();

    // Wooden resonance box shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;

    // Rich antique walnut / cypress soundboard body
    const woodGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    woodGrad.addColorStop(0, '#2b1b12');
    woodGrad.addColorStop(0.3, '#3d2618');
    woodGrad.addColorStop(0.7, '#2f1d13');
    woodGrad.addColorStop(1, '#1c100a');

    ctx.fillStyle = woodGrad;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 6);
      ctx.fill();
    } else {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.shadowColor = 'transparent';

    // Polished bronze border trim
    const bronzeGrad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y);
    bronzeGrad.addColorStop(0, '#d4af37');
    bronzeGrad.addColorStop(0.2, '#aa8230');
    bronzeGrad.addColorStop(0.5, '#ffd97d');
    bronzeGrad.addColorStop(0.8, '#aa8230');
    bronzeGrad.addColorStop(1, '#d4af37');

    ctx.strokeStyle = bronzeGrad;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

    // Sound hole rosettes (Hellenistic lute / lyre rosette)
    const holeRadius = Math.min(18, b.h * 0.18);
    const holes = [
      { x: b.x + b.w * 0.22, y: b.stringY + 22 },
      { x: b.x + b.w * 0.78, y: b.stringY + 22 }
    ];

    holes.forEach(hole => {
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, holeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#100a06';
      ctx.fill();
      ctx.strokeStyle = '#aa8230';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rosette star spokes
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(hole.x, hole.y);
        ctx.lineTo(hole.x + Math.cos(ang) * holeRadius, hole.y + Math.sin(ang) * holeRadius);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Soundboard ruler scale with classical whole-number harmonic ratios
    this.renderHarmonicRuler(ctx, b);

    // Left and right fixed nuts (Magades)
    this.renderNut(ctx, b.leftNutX, b.stringY, 'left');
    this.renderNut(ctx, b.rightNutX, b.stringY, 'right');

    ctx.restore();
  }

  renderHarmonicRuler(ctx, b) {
    const rulerY = b.y + b.h - 18;
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;

    // Main ruler axis line
    ctx.beginPath();
    ctx.moveTo(b.leftNutX, rulerY);
    ctx.lineTo(b.rightNutX, rulerY);
    ctx.stroke();

    // Major interval tick marks
    const marks = [
      { ratio: 0.500, label: '1:2', greek: 'ΔΙΑ ΠΑΣΩΝ' },
      { ratio: 0.600, label: '2:3', greek: 'ΔΙΑ ΠΕΝΤΕ' },
      { ratio: 0.667, label: '3:4', greek: 'ΔΙΑ ΤΕΣΣΑΡΩΝ' },
      { ratio: 0.750, label: '4:5', greek: 'ΔΙΤΟΝΟΣ' },
      { ratio: 0.889, label: '8:9', greek: 'ΕΠΟΓΔΟΟΝ' }
    ];

    marks.forEach(m => {
      const mx = b.leftNutX + (1 - m.ratio) * b.stringLength;
      ctx.beginPath();
      ctx.moveTo(mx, rulerY - 6);
      ctx.lineTo(mx, rulerY + 6);
      ctx.strokeStyle = '#ffd97d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#e0dacb';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, mx, rulerY + 14);
    });

    // Fine subdivision ticks (12 steps)
    for (let i = 1; i < 12; i++) {
      const tx = b.leftNutX + (i / 12) * b.stringLength;
      ctx.beginPath();
      ctx.moveTo(tx, rulerY - 2);
      ctx.lineTo(tx, rulerY + 2);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderNut(ctx, x, y, side) {
    ctx.save();
    // Bronze capo pillar
    const nutW = 10;
    const nutH = 34;
    const nutY = y - nutH * 0.5;

    const nutGrad = ctx.createLinearGradient(x - nutW / 2, nutY, x + nutW / 2, nutY);
    nutGrad.addColorStop(0, '#aa8230');
    nutGrad.addColorStop(0.4, '#ffd97d');
    nutGrad.addColorStop(1, '#664c18');

    ctx.fillStyle = nutGrad;
    ctx.fillRect(x - nutW / 2, nutY, nutW, nutH);

    ctx.strokeStyle = '#ffe49e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - nutW / 2, nutY, nutW, nutH);

    // Tuning peg bolt
    ctx.beginPath();
    ctx.arc(x, nutY - 5, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd97d';
    ctx.fill();
    ctx.strokeStyle = '#553d10';
    ctx.stroke();

    ctx.restore();
  }

  renderBridge(ctx) {
    const b = this.board;
    const bridgeX = this.getBridgeScreenX();
    const bridgeY = b.stringY;
    const bridgeW = 18;
    const bridgeH = 32;

    ctx.save();

    // Draggable movable bridge: classical triangular wooden / ivory wedge
    ctx.beginPath();
    ctx.moveTo(bridgeX, bridgeY - 14); // Top vertex under string
    ctx.lineTo(bridgeX + bridgeW / 2, bridgeY + bridgeH - 14);
    ctx.lineTo(bridgeX - bridgeW / 2, bridgeY + bridgeH - 14);
    ctx.closePath();

    // Polished bronze / ivory gradient
    const brGrad = ctx.createLinearGradient(bridgeX - bridgeW / 2, bridgeY, bridgeX + bridgeW / 2, bridgeY);
    brGrad.addColorStop(0, '#b8860b');
    brGrad.addColorStop(0.3, '#f5e298');
    brGrad.addColorStop(0.7, '#d4af37');
    brGrad.addColorStop(1, '#8b6508');

    ctx.fillStyle = brGrad;
    ctx.shadowColor = this.hoverBridge || this.isDraggingBridge ? '#ffd700' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = this.hoverBridge || this.isDraggingBridge ? 12 : 5;
    ctx.fill();

    ctx.strokeStyle = '#fff0a6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ivory saddle contact point at apex
    ctx.beginPath();
    ctx.arc(bridgeX, bridgeY - 13, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Glowing Bridge Ratio Badge floating above
    const activeLabel = this.getActiveIntervalLabel();
    ctx.font = 'bold 11px monospace';
    const tagW = ctx.measureText(activeLabel).width + 14;
    const tagH = 18;
    const tagY = bridgeY - 32;

    ctx.fillStyle = 'rgba(20, 16, 12, 0.88)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.fillRect(bridgeX - tagW / 2, tagY - tagH / 2, tagW, tagH);
    ctx.strokeRect(bridgeX - tagW / 2, tagY - tagH / 2, tagW, tagH);

    ctx.fillStyle = '#ffd97d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeLabel, bridgeX, tagY);

    // Tiny leader line from badge to apex
    ctx.beginPath();
    ctx.moveTo(bridgeX, tagY + tagH / 2);
    ctx.lineTo(bridgeX, bridgeY - 14);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.stroke();

    ctx.restore();
  }

  renderVibratingString(ctx) {
    const b = this.board;
    const N = this.NODE_COUNT;
    const stepX = b.stringLength / (N - 1);
    const bridgeK = this.getBridgeNodeIndex();

    ctx.save();

    // 1. Peak Envelope Ghosting (Resonant Vibration Body Aura)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const px = b.leftNutX + i * stepX;
      const py = b.stringY - this.envelope[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = N - 1; i >= 0; i--) {
      const px = b.leftNutX + i * stepX;
      const py = b.stringY + this.envelope[i];
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.fill();

    // 2. Translucent String Motion Blur Trails
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const px = b.leftNutX + i * stepX;
      const py = b.stringY + this.yPrev[i] * 0.7;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. Main Instantaneous Bronze String
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const px = b.leftNutX + i * stepX;
      const py = b.stringY + this.y[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Highlight node point at bridge
    const bridgeX = b.leftNutX + bridgeK * stepX;
    ctx.beginPath();
    ctx.arc(bridgeX, b.stringY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.restore();
  }

  renderOscilloscope(ctx) {
    const w = this.width;
    const h = this.height;

    // Panel dimensions
    const panelW = Math.max(160, Math.min(240, w * 0.28));
    const panelH = Math.max(120, Math.min(160, h * 0.25));
    const panelX = 40;
    const panelY = Math.max(this.board.y + this.board.h + 24, h - panelH - 24);

    ctx.save();

    // Instrument Frame: Polished Bronze & Cathode Screen
    this.renderBezelFrame(ctx, panelX, panelY, panelW, panelH, 'OSCILLOGRAPHIA (WAVE)');

    // CRT phosphor display background
    const crtX = panelX + 6;
    const crtY = panelY + 22;
    const crtW = panelW - 12;
    const crtH = panelH - 28;

    ctx.fillStyle = '#06120d';
    ctx.fillRect(crtX, crtY, crtW, crtH);

    // Phosphor Reticle Grid
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.12)';
    ctx.lineWidth = 1;
    for (let gx = crtX; gx < crtX + crtW; gx += 18) {
      ctx.beginPath();
      ctx.moveTo(gx, crtY);
      ctx.lineTo(gx, crtY + crtH);
      ctx.stroke();
    }
    for (let gy = crtY; gy < crtY + crtH; gy += 18) {
      ctx.beginPath();
      ctx.moveTo(crtX, gy);
      ctx.lineTo(crtX + crtW, gy);
      ctx.stroke();
    }

    // Center zero line
    const midY = crtY + crtH * 0.5;
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.25)';
    ctx.beginPath();
    ctx.moveTo(crtX, midY);
    ctx.lineTo(crtX + crtW, midY);
    ctx.stroke();

    // Oscilloscope trace line
    const S = this.OSC_SAMPLES;
    ctx.beginPath();
    for (let i = 0; i < S; i++) {
      const sampleIdx = (this.oscIndex + i) % S;
      const val = this.oscBuffer[sampleIdx];
      const px = crtX + (i / (S - 1)) * crtW;
      const py = midY - val * (crtH * 0.024);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.restore();
  }

  renderLissajousFigure(ctx) {
    const w = this.width;
    const h = this.height;

    const panelW = Math.max(160, Math.min(240, w * 0.28));
    const panelH = Math.max(120, Math.min(160, h * 0.25));
    const panelX = Math.round(w * 0.5 - panelW * 0.5);
    const panelY = Math.max(this.board.y + this.board.h + 24, h - panelH - 24);

    ctx.save();

    this.renderBezelFrame(ctx, panelX, panelY, panelW, panelH, 'LISSAJOUS (RATIO ORBIT)');

    const crtX = panelX + 6;
    const crtY = panelY + 22;
    const crtW = panelW - 12;
    const crtH = panelH - 28;

    ctx.fillStyle = '#100c06';
    ctx.fillRect(crtX, crtY, crtW, crtH);

    // Circular scope reticle
    const cx = crtX + crtW * 0.5;
    const cy = crtY + crtH * 0.5;
    const radius = Math.min(crtW, crtH) * 0.42;

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Frequency ratio derived from bridge position: L2 / L1 = (1 - r) / r
    const r = Math.max(0.1, Math.min(0.9, this.bridgeRatio));
    const ratio = (1 - r) / r;

    // Lissajous curve rendering:
    // x(theta) = Ax * sin(f1 * theta + phase)
    // y(theta) = Ay * sin(f2 * theta)
    const points = 240;
    const phase = this.time * 1.8;
    const f1 = 1.0;
    const f2 = ratio;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const theta = (i / points) * Math.PI * 4;
      const lx = cx + Math.sin(f1 * theta + phase) * radius * 0.85;
      const ly = cy + Math.sin(f2 * theta) * radius * 0.85;
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Ratio readout
    ctx.fillStyle = '#e0dacb';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Ratio: ${ratio.toFixed(2)}:1`, cx, crtY + crtH - 6);

    ctx.restore();
  }

  renderHarmonicSpectrum(ctx) {
    const w = this.width;
    const h = this.height;

    const panelW = Math.max(160, Math.min(240, w * 0.28));
    const panelH = Math.max(120, Math.min(160, h * 0.25));
    const panelX = Math.max(w - panelW - 40, 20);
    const panelY = Math.max(this.board.y + this.board.h + 24, h - panelH - 24);

    ctx.save();

    this.renderBezelFrame(ctx, panelX, panelY, panelW, panelH, 'FOURIER SPECTRUM (HARMONICS)');

    const crtX = panelX + 6;
    const crtY = panelY + 22;
    const crtW = panelW - 12;
    const crtH = panelH - 28;

    ctx.fillStyle = '#060a12';
    ctx.fillRect(crtX, crtY, crtW, crtH);

    // Spectrum bars: 16 harmonics
    const H = this.HARMONIC_COUNT;
    const barWidth = (crtW - (H + 1) * 2) / H;
    const baseY = crtY + crtH - 4;

    for (let m = 0; m < H; m++) {
      const bx = crtX + 2 + m * (barWidth + 2);
      const val = Math.min(1, (this.harmonicsLeft[m] + this.harmonicsRight[m]) * 0.05);
      const barH = Math.max(2, val * (crtH - 14));

      // Dual-tone bronze/amber harmonic bars
      const barGrad = ctx.createLinearGradient(bx, baseY - barH, bx, baseY);
      barGrad.addColorStop(0, '#00e5ff');
      barGrad.addColorStop(0.5, '#ffd700');
      barGrad.addColorStop(1, '#b8860b');

      ctx.fillStyle = barGrad;
      ctx.fillRect(bx, baseY - barH, barWidth, barH);

      // Harmonic label on 1st, 2nd, 3rd, 4th
      if (m < 4) {
        ctx.fillStyle = 'rgba(224, 218, 203, 0.7)';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${m + 1}`, bx + barWidth / 2, baseY - barH - 3);
      }
    }

    ctx.restore();
  }

  renderBezelFrame(ctx, x, y, w, h, title) {
    // Polished bronze panel chassis
    ctx.fillStyle = '#14120e';
    ctx.fillRect(x, y, w, h);

    const bronzeGrad = ctx.createLinearGradient(x, y, x + w, y);
    bronzeGrad.addColorStop(0, '#aa8230');
    bronzeGrad.addColorStop(0.5, '#ffd97d');
    bronzeGrad.addColorStop(1, '#664c18');

    ctx.strokeStyle = bronzeGrad;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Corner rivet screws
    const rivets = [
      { rx: x + 4, ry: y + 4 },
      { rx: x + w - 4, ry: y + 4 },
      { rx: x + 4, ry: y + h - 4 },
      { rx: x + w - 4, ry: y + h - 4 }
    ];
    rivets.forEach(rv => {
      ctx.beginPath();
      ctx.arc(rv.rx, rv.ry, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd97d';
      ctx.fill();
    });

    // Panel Title
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, x + 8, y + 6);
  }

  renderHUD(ctx, w, h) {
    ctx.save();

    // Classical Inscription Header
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('PYTHAGORAS: KANON HARMONICUS', 40, 20);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('Naturalis Historia Lib. II — Monochordum & Mathematica Consonantia', 40, 40);

    // Consonant Ratio readout badge
    const activePreset = this.presets.find(p => Math.abs(this.bridgeRatio - p.ratio) < 0.02);
    ctx.fillStyle = '#ffd97d';
    ctx.font = '11px monospace';
    if (activePreset) {
      ctx.fillText(`Interval: ${activePreset.name}`, 40, 58);
    } else {
      ctx.fillText(`Interval: Custom Ratio (${(this.bridgeRatio / (1 - this.bridgeRatio)).toFixed(3)}:1)`, 40, 58);
    }

    // Interaction hint footer
    ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.font = '10px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Click/Drag String: Pluck | Drag Bridge: Ratio | 1-5: Presets | Space: Pluck', 40, Math.min(this.board.y - 12, 130));

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HTML Controls Builder
  // ---------------------------------------------------------------------------

  buildControls() {
    // Safe headless DOM guard
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.controlsContainer.style.color = '#e0dacb';
    this.controlsContainer.style.fontFamily = "'Cinzel', 'JetBrains Mono', Georgia, serif";
    this.controlsContainer.style.fontSize = '12px';

    const createGroup = () => {
      const g = document.createElement('div');
      g.style.marginBottom = '12px';
      g.style.padding = '8px 10px';
      g.style.background = 'rgba(25, 23, 22, 0.75)';
      g.style.border = '1px solid rgba(212, 175, 55, 0.3)';
      g.style.borderRadius = '4px';
      return g;
    };

    // 1. Pluck Action Button
    const pluckGroup = createGroup();
    const pluckBtn = document.createElement('button');
    pluckBtn.textContent = '🎵 PLUCK STRING';
    pluckBtn.style.width = '100%';
    pluckBtn.style.padding = '8px';
    pluckBtn.style.background = 'linear-gradient(135deg, #aa8230, #664c18)';
    pluckBtn.style.color = '#fff8dc';
    pluckBtn.style.border = '1px solid #ffd700';
    pluckBtn.style.borderRadius = '3px';
    pluckBtn.style.fontWeight = 'bold';
    pluckBtn.style.cursor = 'pointer';
    pluckBtn.onclick = () => {
      this.initAudio();
      this.pluck(0.33, 40);
    };
    pluckGroup.appendChild(pluckBtn);
    this.controlsContainer.appendChild(pluckGroup);

    // 2. Harmonic Interval Presets
    const presetGroup = createGroup();
    const presetLabel = document.createElement('div');
    presetLabel.textContent = '🏛️ HARMONIC PRESETS';
    presetLabel.style.color = '#d4af37';
    presetLabel.style.fontWeight = 'bold';
    presetLabel.style.marginBottom = '6px';
    presetGroup.appendChild(presetLabel);

    const presetSelect = document.createElement('select');
    presetSelect.style.width = '100%';
    presetSelect.style.padding = '5px';
    presetSelect.style.background = '#151310';
    presetSelect.style.color = '#ffd97d';
    presetSelect.style.border = '1px solid #aa8230';
    presetSelect.style.borderRadius = '3px';

    this.presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.ratio;
      opt.textContent = p.name;
      if (Math.abs(this.bridgeRatio - p.ratio) < 0.01) opt.selected = true;
      presetSelect.appendChild(opt);
    });

    presetSelect.onchange = (e) => {
      this.bridgeRatio = parseFloat(e.target.value);
      if (this.bridgeInput) this.bridgeInput.value = this.bridgeRatio.toFixed(3);
      if (this.bridgeLabel) this.bridgeLabel.textContent = `Bridge Position: ${this.bridgeRatio.toFixed(3)} (${this.getActiveIntervalLabel()})`;
      this.pluck(0.33, 35);
    };
    presetGroup.appendChild(presetSelect);
    this.presetSelect = presetSelect;
    this.controlsContainer.appendChild(presetGroup);

    // 3. Bridge Position Slider
    const bridgeGroup = createGroup();
    this.bridgeLabel = document.createElement('div');
    this.bridgeLabel.textContent = `Bridge Position: ${this.bridgeRatio.toFixed(3)} (${this.getActiveIntervalLabel()})`;
    this.bridgeLabel.style.marginBottom = '4px';
    this.bridgeLabel.style.color = '#d4af37';
    bridgeGroup.appendChild(this.bridgeLabel);

    this.bridgeInput = document.createElement('input');
    this.bridgeInput.type = 'range';
    this.bridgeInput.min = '0.15';
    this.bridgeInput.max = '0.85';
    this.bridgeInput.step = '0.005';
    this.bridgeInput.value = this.bridgeRatio.toFixed(3);
    this.bridgeInput.style.width = '100%';
    this.bridgeInput.oninput = (e) => {
      this.bridgeRatio = parseFloat(e.target.value);
      this.bridgeLabel.textContent = `Bridge Position: ${this.bridgeRatio.toFixed(3)} (${this.getActiveIntervalLabel()})`;
    };
    bridgeGroup.appendChild(this.bridgeInput);
    this.controlsContainer.appendChild(bridgeGroup);

    // 4. Pluck Tension Slider
    const tensionGroup = createGroup();
    const tensionLabel = document.createElement('div');
    tensionLabel.textContent = `Pluck Tension: ${this.tension}`;
    tensionLabel.style.marginBottom = '4px';
    tensionLabel.style.color = '#d4af37';
    tensionGroup.appendChild(tensionLabel);

    const tensionInput = document.createElement('input');
    tensionInput.type = 'range';
    tensionInput.min = '20';
    tensionInput.max = '100';
    tensionInput.step = '1';
    tensionInput.value = this.tension;
    tensionInput.style.width = '100%';
    tensionInput.oninput = (e) => {
      this.tension = parseFloat(e.target.value);
      tensionLabel.textContent = `Pluck Tension: ${this.tension}`;
    };
    tensionGroup.appendChild(tensionInput);
    this.controlsContainer.appendChild(tensionGroup);

    // 5. Sound & Damping Toggles
    const optGroup = createGroup();
    const audioLabel = document.createElement('label');
    audioLabel.style.display = 'flex';
    audioLabel.style.alignItems = 'center';
    audioLabel.style.gap = '8px';
    audioLabel.style.cursor = 'pointer';

    const audioCheck = document.createElement('input');
    audioCheck.type = 'checkbox';
    audioCheck.checked = this.audioEnabled;
    audioCheck.onchange = (e) => {
      this.audioEnabled = e.target.checked;
      if (this.audioEnabled) this.initAudio();
    };

    audioLabel.appendChild(audioCheck);
    const audioSpan = document.createElement('span');
    audioSpan.textContent = '🔊 Synthesizer Audio (WebAudio)';
    audioLabel.appendChild(audioSpan);
    optGroup.appendChild(audioLabel);

    this.controlsContainer.appendChild(optGroup);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Resize
  // ---------------------------------------------------------------------------

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.updateBoardLayout();
  }

  destroy() {
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

  // ---------------------------------------------------------------------------
  // Input Handling: Mouse & Keyboard
  // ---------------------------------------------------------------------------

  onMouseDown(pos) {
    this.initAudio();
    this.mouse.down = true;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    const b = this.board;
    const bridgeX = this.getBridgeScreenX();

    // Check if clicking near movable bridge
    if (Math.abs(pos.x - bridgeX) < 24 && pos.y >= b.y && pos.y <= b.y + b.h) {
      this.isDraggingBridge = true;
      return;
    }

    // Check if clicking on or near the string to pluck
    if (pos.x >= b.leftNutX && pos.x <= b.rightNutX && Math.abs(pos.y - b.stringY) < 32) {
      this.isPluckingString = true;
      const normPos = (pos.x - b.leftNutX) / b.stringLength;
      const amp = Math.max(-45, Math.min(45, pos.y - b.stringY));
      this.pluck(normPos, Math.abs(amp) > 8 ? amp : 32);
    }
  }

  onMouseMove(pos) {
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    const b = this.board;
    const bridgeX = this.getBridgeScreenX();

    // Hover state for cursor styling
    this.hoverBridge = Math.abs(pos.x - bridgeX) < 20 && pos.y >= b.y && pos.y <= b.y + b.h;
    if (this.canvas && this.canvas.style) {
      if (this.isDraggingBridge || this.hoverBridge) {
        this.canvas.style.cursor = 'ew-resize';
      } else {
        this.canvas.style.cursor = 'default';
      }
    }

    if (this.isDraggingBridge) {
      this.setBridgePositionFromScreenX(pos.x);
    } else if (this.isPluckingString && this.mouse.down) {
      const normPos = (pos.x - b.leftNutX) / b.stringLength;
      const amp = Math.max(-50, Math.min(50, pos.y - b.stringY));
      this.pluck(normPos, amp);
    }
  }

  onMouseUp() {
    this.mouse.down = false;
    if (this.isPluckingString) {
      this.isPluckingString = false;
      this.playPluckSound(0.9);
    }
    this.isDraggingBridge = false;
  }

  onKeyDown(key) {
    const k = (key || '').toLowerCase();
    switch (k) {
      case ' ':
      case 'p':
        this.pluck(0.33, 40);
        break;
      case '1':
        this.selectPresetByRatio(0.500); // 1:1
        break;
      case '2':
        this.selectPresetByRatio(2 / 3); // 2:1 Octave
        break;
      case '3':
        this.selectPresetByRatio(3 / 5); // 3:2 Fifth
        break;
      case '4':
        this.selectPresetByRatio(4 / 7); // 4:3 Fourth
        break;
      case '5':
        this.selectPresetByRatio(9 / 17); // 9:8 Tone
        break;
      case 'r':
        this.reset();
        break;
    }
  }

  onKeyUp() {
    // Parity with engine input contract
  }

  selectPresetByRatio(r) {
    this.bridgeRatio = r;
    if (this.bridgeInput) this.bridgeInput.value = r.toFixed(3);
    if (this.bridgeLabel) this.bridgeLabel.textContent = `Bridge Position: ${r.toFixed(3)} (${this.getActiveIntervalLabel()})`;
    if (this.presetSelect) this.presetSelect.value = r;
    this.pluck(0.33, 36);
  }
}
