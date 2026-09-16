// Pliny Game Lab — Archimedes Spiral (Golden Harmonics & Parametric Polar Geometry)
// Pure ES module simulating Archimedean (r = a + bθ), Logarithmic (spira mirabilis),
// Fermat, and Phyllotaxis Golden Angle flower packing with chromatic spectral trails.
// Grounded in Archimedes of Syracuse's treatise "On Spirals" (Περὶ ἑλίκων, c. 225 BC).

// Fast Prime Sieve Cache for Ulam / Sacks Prime Harmonics
const MAX_PRIME_INDEX = 5000;
const IS_PRIME = new Uint8Array(MAX_PRIME_INDEX + 1);
(function initPrimeSieve() {
  IS_PRIME.fill(1);
  IS_PRIME[0] = IS_PRIME[1] = 0;
  for (let p = 2; p * p <= MAX_PRIME_INDEX; p++) {
    if (IS_PRIME[p]) {
      for (let i = p * p; i <= MAX_PRIME_INDEX; i += p) {
        IS_PRIME[i] = 0;
      }
    }
  }
})();

// Golden Ratio and Golden Angle constants
const PHI = (1 + Math.sqrt(5)) * 0.5; // ~1.6180339887
const GOLDEN_ANGLE_DEG = 360 * (1 - 1 / PHI); // ~137.507764°

// Fibonacci Sequence for Parastichy Harmonic Linkages
const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

export const SPIRAL_MODES = {
  ARCHIMEDEAN: 'archimedean',
  LOGARITHMIC: 'logarithmic',
  PHYLLOTAXIS: 'phyllotaxis',
  FERMAT: 'fermat'
};

export const COLOR_PALETTES = {
  SPECTRAL: {
    name: 'Chromatic Spectral Prism',
    bg: '#06070a',
    primary: '#00f0ff',
    secondary: '#ff00aa',
    accent: '#ffe600',
    harmonic: 'rgba(0, 240, 255, 0.22)',
    curveAlpha: 0.85,
    getHue: (t, theta) => (theta * (180 / Math.PI) * 0.6 + t * 40) % 360
  },
  IMPERIAL_GOLD: {
    name: 'Archimedean Syracuse Gold',
    bg: '#0a0806',
    primary: '#ffd700',
    secondary: '#e5a93c',
    accent: '#ffffff',
    harmonic: 'rgba(255, 215, 0, 0.2)',
    curveAlpha: 0.8,
    getHue: (t, theta) => (42 + Math.sin(theta * 0.3 + t) * 16) % 360
  },
  AEGEAN_CYAN: {
    name: 'Aegean Bioluminescence',
    bg: '#03080d',
    primary: '#38ef7d',
    secondary: '#11998e',
    accent: '#a8ff78',
    harmonic: 'rgba(56, 239, 125, 0.25)',
    curveAlpha: 0.85,
    getHue: (t, theta) => (165 + Math.cos(theta * 0.25 - t * 0.5) * 45) % 360
  }
};

export class ArchimedesSpiralEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation Clock & Animation
    this.time = 0;
    this.dt = 0.016;
    this.autoRotateSpeed = 0.08; // radians per second rotation
    this.autoAngleDrift = 0.0; // divergence angle drift rate
    this.spiralRotation = 0; // current global rotation angle

    // Core Spiral Model Parameters
    this.mode = SPIRAL_MODES.PHYLLOTAXIS;
    this.divergenceAngle = GOLDEN_ANGLE_DEG; // degrees
    this.growthRate = 1.0; // radial scaling factor
    this.pointCount = 900; // active entities count
    this.paramA = 4.0; // initial offset radius (a)
    this.paramB = 3.2; // expansion coefficient (b)
    this.morphFactor = 1.0; // 0.0 = pure Archimedes, 1.0 = target mode

    // Visual & Harmonics Options
    this.currentPaletteKey = 'SPECTRAL';
    this.palette = COLOR_PALETTES.SPECTRAL;
    this.showHarmonicLines = true;
    this.showContinuousCurve = true;
    this.showPrimesOnly = false;
    this.showPointers = true;
    this.parastichyIndex = 5; // Fibonacci index 5 -> 13 & 21 parastichies
    this.glowIntensity = 1.0;

    // Viewport Pan and Zoom
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetZoom: 1.0,
      isPanning: false,
      panStartX: 0,
      panStartY: 0
    };

    // Mouse Interaction
    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.5,
      rawX: this.width * 0.5,
      rawY: this.height * 0.5,
      isDown: false,
      hoveredIndex: -1
    };

    // Cached Simulation Entities
    this.points = [];
    this.curveVertices = [];
    this.harmonicLinks = [];

    // Web Audio Synthesizer for Harmonic Tones
    this.audioCtx = null;
    this.initAudio();

    // Setup Controls and initial state
    this.buildControls();
    this.reset();
  }

  // ---------------------------------------------------------------------------
  // Safe Audio Initialization (pythagorean / harmonic chime)
  // ---------------------------------------------------------------------------
  initAudio() {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch {
      this.audioCtx = null;
    }
  }

  playHarmonicTone(freq = 432, duration = 0.25, volume = 0.08) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // ---------------------------------------------------------------------------
  // Geometric Simulation Models
  // ---------------------------------------------------------------------------
  recomputeSpiral() {
    const N = Math.max(10, Math.min(3000, Math.floor(this.pointCount)));
    const angleRad = (this.divergenceAngle * Math.PI) / 180;
    const growth = Math.max(0.05, this.growthRate);
    const mode = this.mode;

    const points = [];
    const maxScreenRadius = Math.min(this.width, this.height) * 0.46;

    // 1. Generate active spiral nodes / points
    for (let i = 0; i < N; i++) {
      let r = 0;
      let theta = 0;

      if (mode === SPIRAL_MODES.PHYLLOTAXIS) {
        // Vogel's Phyllotaxis packing: r = c * sqrt(n), θ = n * divergence
        theta = i * angleRad;
        const c = 7.5 * growth;
        r = c * Math.sqrt(i + 1);
      } else if (mode === SPIRAL_MODES.ARCHIMEDEAN) {
        // Archimedes: r = a + b * θ
        const turns = (i / N) * 12 * Math.PI;
        theta = turns;
        r = (this.paramA + this.paramB * turns) * (growth * 1.8);
      } else if (mode === SPIRAL_MODES.LOGARITHMIC) {
        // Logarithmic / Spira Mirabilis: r = a * e^(b * θ)
        const t = (i / N);
        const thetaTotal = t * 10 * Math.PI;
        theta = thetaTotal;
        const b = 0.12;
        r = (this.paramA * 2.0 * Math.exp(b * thetaTotal)) * (growth * 0.15);
        if (r > maxScreenRadius * 2.5) r = maxScreenRadius * 2.5;
      } else if (mode === SPIRAL_MODES.FERMAT) {
        // Fermat's Parabolic Spiral: r = b * sqrt(θ)
        const turns = (i / N) * 16 * Math.PI;
        theta = turns;
        r = 18.0 * growth * Math.sqrt(turns);
      }

      // Check prime harmonic status
      const isPrime = i <= MAX_PRIME_INDEX ? IS_PRIME[i] === 1 : false;

      points.push({
        index: i,
        r: r,
        theta: theta,
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
        isPrime: isPrime,
        pulse: 0,
        energy: isPrime ? 1.0 : 0.5
      });
    }
    this.points = points;

    // 2. Generate continuous smooth curve vertices for chromatic trajectory
    const curveVerts = [];
    const curveSamples = Math.min(2000, N * 2);
    const maxTheta = 14 * Math.PI;

    for (let s = 0; s < curveSamples; s++) {
      const frac = s / (curveSamples - 1);
      let rCurve = 0;
      let thCurve = 0;

      if (mode === SPIRAL_MODES.PHYLLOTAXIS) {
        // Continuous Vogel spiral trajectory
        const nCont = frac * N;
        thCurve = nCont * angleRad;
        rCurve = (7.5 * growth) * Math.sqrt(nCont + 1);
      } else if (mode === SPIRAL_MODES.ARCHIMEDEAN) {
        thCurve = frac * maxTheta;
        rCurve = (this.paramA + this.paramB * thCurve) * (growth * 1.8);
      } else if (mode === SPIRAL_MODES.LOGARITHMIC) {
        thCurve = frac * 10 * Math.PI;
        rCurve = (this.paramA * 2.0 * Math.exp(0.12 * thCurve)) * (growth * 0.15);
        if (rCurve > maxScreenRadius * 2.5) rCurve = maxScreenRadius * 2.5;
      } else {
        thCurve = frac * 16 * Math.PI;
        rCurve = 18.0 * growth * Math.sqrt(thCurve);
      }

      curveVerts.push({
        r: rCurve,
        theta: thCurve,
        x: rCurve * Math.cos(thCurve),
        y: rCurve * Math.sin(thCurve)
      });
    }
    this.curveVertices = curveVerts;

    // 3. Recompute Parastichy Harmonic Links
    this.recomputeHarmonics();
  }

  recomputeHarmonics() {
    if (!this.showHarmonicLines) {
      this.harmonicLinks = [];
      return;
    }

    const links = [];
    const N = this.points.length;
    const fibA = FIBONACCI[Math.min(this.parastichyIndex, FIBONACCI.length - 2)] || 13;
    const fibB = FIBONACCI[Math.min(this.parastichyIndex + 1, FIBONACCI.length - 1)] || 21;

    for (let i = 0; i < N; i++) {
      if (i + fibA < N) {
        links.push({ p1: this.points[i], p2: this.points[i + fibA], type: 'primary' });
      }
      if (i + fibB < N) {
        links.push({ p1: this.points[i], p2: this.points[i + fibB], type: 'secondary' });
      }
    }
    this.harmonicLinks = links;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Methods
  // ---------------------------------------------------------------------------
  resize(width, height, dpr = 1) {
    this.width = width || (this.canvas ? this.canvas.width : 800);
    this.height = height || (this.canvas ? this.canvas.height : 600);
    this.dpr = dpr || 1;
    this.recomputeSpiral();
  }

  update(dt = 0.016) {
    this.dt = dt;
    this.time += dt;

    if (this.autoRotateSpeed !== 0) {
      this.spiralRotation = (this.spiralRotation + this.autoRotateSpeed * dt) % (Math.PI * 2);
    }

    if (this.autoAngleDrift !== 0) {
      this.divergenceAngle = (this.divergenceAngle + this.autoAngleDrift * dt) % 360;
      this.recomputeSpiral();
      this.updateControlReadouts();
    }

    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;

    const pts = this.points;
    const len = pts.length;
    for (let i = 0; i < len; i++) {
      const pt = pts[i];
      if (pt.pulse > 0) {
        pt.pulse = Math.max(0, pt.pulse - dt * 2.5);
      }
    }
  }

  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;
    const cx = w * 0.5 + this.camera.x;
    const cy = h * 0.5 + this.camera.y;
    const zoom = this.camera.zoom;
    const rot = this.spiralRotation;
    const pal = this.palette;

    ctx.save();

    // Background
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, w, h);

    // Polar Grid
    this.renderPolarGrid(ctx, cx, cy, zoom);

    // Centered transformed space
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(zoom, zoom);

    // Harmonic Lines
    if (this.showHarmonicLines && this.harmonicLinks.length > 0) {
      this.renderHarmonicLinks(ctx);
    }

    // Continuous Spectral Curve Trails
    if (this.showContinuousCurve && this.curveVertices.length > 1) {
      this.renderContinuousCurve(ctx);
    }

    // Spiral Nodes
    this.renderSpiralPoints(ctx);

    ctx.restore();

    // Philosophical & Mathematical HUD
    this.renderHUD(ctx, w, h);

    ctx.restore();
  }

  renderPolarGrid(ctx, cx, cy, zoom) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    const maxR = Math.max(this.width, this.height) * 0.6;
    const step = 60 * zoom;

    for (let r = step; r < maxR; r += step) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHarmonicLinks(ctx) {
    const links = this.harmonicLinks;
    const len = links.length;
    const pal = this.palette;

    ctx.save();
    ctx.lineWidth = 1;

    for (let i = 0; i < len; i++) {
      const link = links[i];
      const p1 = link.p1;
      const p2 = link.p2;

      if (link.type === 'primary') {
        ctx.strokeStyle = pal.harmonic;
      } else {
        ctx.strokeStyle = 'rgba(255, 230, 0, 0.12)';
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderContinuousCurve(ctx) {
    const verts = this.curveVertices;
    const count = verts.length;
    const pal = this.palette;
    const t = this.time;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const chunkSize = 24;
    for (let i = 0; i < count - 1; i += chunkSize) {
      const nextIdx = Math.min(count - 1, i + chunkSize);
      const midVert = verts[i];
      const hue = pal.getHue(t, midVert.theta);

      ctx.beginPath();
      ctx.moveTo(verts[i].x, verts[i].y);
      for (let j = i + 1; j <= nextIdx; j++) {
        ctx.lineTo(verts[j].x, verts[j].y);
      }

      ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${pal.curveAlpha})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderSpiralPoints(ctx) {
    const pts = this.points;
    const len = pts.length;
    const pal = this.palette;
    const t = this.time;
    const showPrimesOnly = this.showPrimesOnly;
    const hoveredIdx = this.mouse.hoveredIndex;

    ctx.save();

    for (let i = 0; i < len; i++) {
      const pt = pts[i];
      const isPrime = pt.isPrime;

      if (showPrimesOnly && !isPrime) continue;

      const isHovered = (i === hoveredIdx);
      const hue = pal.getHue(t, pt.theta);
      let radius = isPrime ? 3.5 : 2.0;

      if (isHovered) {
        radius = 7.0;
      } else if (pt.pulse > 0) {
        radius += pt.pulse * 4;
      }

      if (isPrime || isHovered) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = isPrime
          ? `hsla(${hue}, 100%, 70%, 0.28)`
          : 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isPrime
        ? `hsl(${hue}, 100%, 75%)`
        : `hsla(${hue}, 80%, 60%, 0.85)`;
      ctx.fill();

      if (i === 0) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderHUD(ctx, w, h) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 13px Cinzel, Georgia, serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('ARCHIMEDES SPIRAL (ΠΕΡΙ ΕΛΙΚΩΝ)', 20, 20);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#8e96a4';
    ctx.fillText('Syracuse, c. 225 BC — Parametric Polar Geometry & Golden Ratio', 20, 38);

    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = '#dcdde2';

    let formulaStr = 'r = a + bθ (Linear Archimedean)';
    if (this.mode === SPIRAL_MODES.LOGARITHMIC) {
      formulaStr = 'r = a · e^(bθ) (Spira Mirabilis)';
    } else if (this.mode === SPIRAL_MODES.PHYLLOTAXIS) {
      formulaStr = 'r = c√n, θ = n · α (Vogel Phyllotaxis)';
    } else if (this.mode === SPIRAL_MODES.FERMAT) {
      formulaStr = 'r = b√θ (Fermat Parabolic)';
    }

    ctx.fillText(`Mode: ${formulaStr}`, 20, 56);
    ctx.fillText(`Divergence Angle α: ${this.divergenceAngle.toFixed(4)}°`, 20, 72);

    const deltaGold = Math.abs(this.divergenceAngle - GOLDEN_ANGLE_DEG);
    const goldPercent = Math.max(0, 100 - deltaGold * 10).toFixed(1);
    ctx.fillStyle = deltaGold < 0.05 ? '#00f0ff' : '#99a1b0';
    ctx.fillText(`Golden Angle Harmony: ${goldPercent}% (Target: ${GOLDEN_ANGLE_DEG.toFixed(4)}°)`, 20, 88);

    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Active Entities: ${this.getEntityCount()} (Vertices + Nodes + Harmonics: ${this.harmonicLinks.length})`, 20, 104);

    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.font = '10px Cinzel, Georgia, serif';
    ctx.fillText('Drag: Morph Divergence Angle | Scroll: Zoom | Space: Toggle Primes | G: Golden Snap', 20, h - 26);

    ctx.restore();
  }

  getEntityCount() {
    return this.curveVertices.length + this.points.length;
  }

  reset() {
    this.spiralRotation = 0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.zoom = 1.0;
    this.camera.targetZoom = 1.0;
    this.recomputeSpiral();
  }

  destroy() {
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // Safe close
      }
      this.audioCtx = null;
    }
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  // ---------------------------------------------------------------------------
  // UI Controls (Headless Guard + Dynamic HTML / Event Binding)
  // ---------------------------------------------------------------------------
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group" style="margin-bottom: 12px; padding: 8px 10px; background: rgba(18, 19, 24, 0.7); border: 1px solid rgba(255, 215, 0, 0.25); border-radius: 4px;">
        <label style="display: block; font-weight: bold; color: #ffd700; margin-bottom: 6px; font-size: 11px; letter-spacing: 1px;">
          🌀 SPIRAL GEOMETRY MODE
        </label>
        <select id="sel-spiral-mode" style="width: 100%; padding: 6px; background: #0c0d12; color: #e5e5eb; border: 1px solid #ffd700; border-radius: 3px; cursor: pointer; font-size: 11px;">
          <option value="${SPIRAL_MODES.PHYLLOTAXIS}" ${this.mode === SPIRAL_MODES.PHYLLOTAXIS ? 'selected' : ''}>Phyllotaxis Golden Flower (Vogel)</option>
          <option value="${SPIRAL_MODES.ARCHIMEDEAN}" ${this.mode === SPIRAL_MODES.ARCHIMEDEAN ? 'selected' : ''}>Archimedean Spiral (r = a + bθ)</option>
          <option value="${SPIRAL_MODES.LOGARITHMIC}" ${this.mode === SPIRAL_MODES.LOGARITHMIC ? 'selected' : ''}>Logarithmic Spiral (Spira Mirabilis)</option>
          <option value="${SPIRAL_MODES.FERMAT}" ${this.mode === SPIRAL_MODES.FERMAT ? 'selected' : ''}>Fermat Spiral (r = b√θ)</option>
        </select>
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #c9cdd7;">
          <span>Divergence Angle:</span>
          <span id="val-divergence" style="color: #00f0ff; font-weight: bold;">${this.divergenceAngle.toFixed(3)}°</span>
        </div>
        <input type="range" id="slider-divergence" min="0" max="360" step="0.05" value="${this.divergenceAngle}" style="width: 100%; accent-color: #00f0ff;">
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #c9cdd7;">
          <span>Growth Rate (Spacing):</span>
          <span id="val-growth" style="color: #ffd700; font-weight: bold;">${this.growthRate.toFixed(2)}x</span>
        </div>
        <input type="range" id="slider-growth" min="0.1" max="4.0" step="0.05" value="${this.growthRate}" style="width: 100%; accent-color: #ffd700;">
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #c9cdd7;">
          <span>Point Count:</span>
          <span id="val-points" style="color: #ff00aa; font-weight: bold;">${this.pointCount}</span>
        </div>
        <input type="range" id="slider-points" min="100" max="2500" step="50" value="${this.pointCount}" style="width: 100%; accent-color: #ff00aa;">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
        <button id="btn-golden-snap" class="sub-btn" style="background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; font-weight: bold; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          ✨ Golden Ratio Snap (137.508°)
        </button>
        <button id="btn-toggle-harmonics" class="sub-btn" style="background: rgba(0, 240, 255, 0.15); border: 1px solid #00f0ff; color: #00f0ff; font-weight: bold; padding: 7px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          🔗 Toggle Harmonic Parastichies
        </button>
        <button id="btn-toggle-primes" class="sub-btn" style="background: rgba(255, 0, 170, 0.15); border: 1px solid #ff00aa; color: #ff00aa; font-weight: bold; padding: 7px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          🔢 Toggle Prime Ulam Helices
        </button>
        <button id="btn-toggle-drift" class="sub-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff; padding: 7px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          🔄 Toggle Precession Drift
        </button>
      </div>

      <div class="control-group" style="padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; font-size: 10px; color: #8e96a4; line-height: 1.4;">
        <div><strong>Hotkeys:</strong></div>
        <div>• <strong>[Space]:</strong> Toggle Prime Highlighting</div>
        <div>• <strong>[G]:</strong> Snap Golden Ratio (137.508°)</div>
        <div>• <strong>[H]:</strong> Toggle Harmonic Links</div>
        <div>• <strong>[R]:</strong> Reset Viewport & Rotation</div>
      </div>
    `;

    const selMode = this.controlsContainer.querySelector('#sel-spiral-mode');
    if (selMode) {
      selMode.addEventListener('change', (e) => {
        this.mode = e.target.value;
        this.recomputeSpiral();
      });
    }

    const sliderDiv = this.controlsContainer.querySelector('#slider-divergence');
    const valDiv = this.controlsContainer.querySelector('#val-divergence');
    if (sliderDiv) {
      sliderDiv.addEventListener('input', (e) => {
        this.divergenceAngle = parseFloat(e.target.value);
        if (valDiv) valDiv.textContent = `${this.divergenceAngle.toFixed(3)}°`;
        this.recomputeSpiral();
      });
    }

    const sliderGrowth = this.controlsContainer.querySelector('#slider-growth');
    const valGrowth = this.controlsContainer.querySelector('#val-growth');
    if (sliderGrowth) {
      sliderGrowth.addEventListener('input', (e) => {
        this.growthRate = parseFloat(e.target.value);
        if (valGrowth) valGrowth.textContent = `${this.growthRate.toFixed(2)}x`;
        this.recomputeSpiral();
      });
    }

    const sliderPts = this.controlsContainer.querySelector('#slider-points');
    const valPts = this.controlsContainer.querySelector('#val-points');
    if (sliderPts) {
      sliderPts.addEventListener('input', (e) => {
        this.pointCount = parseInt(e.target.value, 10);
        if (valPts) valPts.textContent = String(this.pointCount);
        this.recomputeSpiral();
      });
    }

    const btnGolden = this.controlsContainer.querySelector('#btn-golden-snap');
    if (btnGolden) {
      btnGolden.addEventListener('click', () => {
        this.snapGoldenAngle();
      });
    }

    const btnHarmonics = this.controlsContainer.querySelector('#btn-toggle-harmonics');
    if (btnHarmonics) {
      btnHarmonics.addEventListener('click', () => {
        this.showHarmonicLines = !this.showHarmonicLines;
        this.recomputeHarmonics();
      });
    }

    const btnPrimes = this.controlsContainer.querySelector('#btn-toggle-primes');
    if (btnPrimes) {
      btnPrimes.addEventListener('click', () => {
        this.showPrimesOnly = !this.showPrimesOnly;
      });
    }

    const btnDrift = this.controlsContainer.querySelector('#btn-toggle-drift');
    if (btnDrift) {
      btnDrift.addEventListener('click', () => {
        this.autoAngleDrift = this.autoAngleDrift === 0 ? 0.35 : 0;
      });
    }
  }

  updateControlReadouts() {
    if (!this.controlsContainer) return;
    const sliderDiv = this.controlsContainer.querySelector('#slider-divergence');
    const valDiv = this.controlsContainer.querySelector('#val-divergence');
    if (sliderDiv) sliderDiv.value = String(this.divergenceAngle);
    if (valDiv) valDiv.textContent = `${this.divergenceAngle.toFixed(3)}°`;
  }

  snapGoldenAngle() {
    this.divergenceAngle = GOLDEN_ANGLE_DEG;
    this.autoAngleDrift = 0;
    this.updateControlReadouts();
    this.recomputeSpiral();
    this.playHarmonicTone(528, 0.45, 0.12);
  }

  // ---------------------------------------------------------------------------
  // Input Handling
  // ---------------------------------------------------------------------------
  onMouseDown(pos) {
    this.mouse.isDown = true;
    this.mouse.rawX = pos.x;
    this.mouse.rawY = pos.y;
    this.camera.panStartX = pos.x - this.camera.x;
    this.camera.panStartY = pos.y - this.camera.y;
    this.checkHitPoint(pos);
  }

  onMouseMove(pos) {
    this.mouse.rawX = pos.x;
    this.mouse.rawY = pos.y;

    if (this.mouse.isDown) {
      const dx = pos.x - (this.mouse.x || pos.x);
      this.divergenceAngle = (this.divergenceAngle + dx * 0.08 + 360) % 360;
      this.recomputeSpiral();
      this.updateControlReadouts();
    } else {
      this.checkHitPoint(pos);
    }
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }

  onMouseUp() {
    this.mouse.isDown = false;
  }

  checkHitPoint(pos) {
    const cx = this.width * 0.5 + this.camera.x;
    const cy = this.height * 0.5 + this.camera.y;
    const zoom = this.camera.zoom;
    const rot = this.spiralRotation;

    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const cosR = Math.cos(-rot);
    const sinR = Math.sin(-rot);
    const lx = (dx * cosR - dy * sinR) / zoom;
    const ly = (dx * sinR + dy * cosR) / zoom;

    let closestIdx = -1;
    let minDistSq = 144;

    const pts = this.points;
    const len = pts.length;
    for (let i = 0; i < len; i++) {
      const p = pts[i];
      const dSq = (p.x - lx) * (p.x - lx) + (p.y - ly) * (p.y - ly);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1 && closestIdx !== this.mouse.hoveredIndex) {
      this.mouse.hoveredIndex = closestIdx;
      pts[closestIdx].pulse = 1.0;
      const freq = 220 + (closestIdx % 48) * 16;
      this.playHarmonicTone(freq, 0.15, 0.04);
    } else if (closestIdx === -1) {
      this.mouse.hoveredIndex = -1;
    }
  }

  onWheel(delta) {
    const factor = delta > 0 ? 0.92 : 1.08;
    this.camera.targetZoom = Math.max(0.2, Math.min(6.0, this.camera.targetZoom * factor));
  }

  onKeyDown(key) {
    if (!key) return;
    const k = key.toLowerCase();

    switch (k) {
      case 'g':
        this.snapGoldenAngle();
        break;
      case ' ':
        this.showPrimesOnly = !this.showPrimesOnly;
        break;
      case 'h':
        this.showHarmonicLines = !this.showHarmonicLines;
        this.recomputeHarmonics();
        break;
      case 'r':
        this.reset();
        break;
      case 'c':
        this.showContinuousCurve = !this.showContinuousCurve;
        break;
      case 'p':
        const keys = Object.keys(COLOR_PALETTES);
        const idx = (keys.indexOf(this.currentPaletteKey) + 1) % keys.length;
        this.currentPaletteKey = keys[idx];
        this.palette = COLOR_PALETTES[this.currentPaletteKey];
        break;
    }
  }

  onKeyUp() {
    // Parity with input contract
  }
}
