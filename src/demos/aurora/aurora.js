// Aurora: Geomagnetic Plasma Field & Atmospheric Spectral Emission
// Grounded in Pliny the Elder's Naturalis Historia (Book II, Chapter 33: De Chasmate et Caelestibus Miraculis)
// and modern Magnetospheric Physics (Lorentz Force, Dipole Trapping & Auroral Oval Spectral Transitions).

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

/**
 * Deterministic 2D Perlin & Fractal Brownian Motion (FBM) Noise Generator.
 * Zero external dependencies, pure ES implementation.
 */
class PerlinNoise {
  constructor(seed = 1066) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;

    // Linear congruential generator for reproducible shuffle
    let s = seed >>> 0;
    for (let i = 255; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      this.p[i] = perm[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1.0, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1.0), this.grad(bb, xf - 1.0, yf - 1.0));
    return this.lerp(v, x1, x2);
  }

  fbm(x, y, octaves = 3, lacunarity = 2.0, gain = 0.5) {
    let total = 0.0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxVal = 0.0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxVal += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return total / maxVal;
  }
}

/**
 * AuroraEngine: Simulates geomagnetic dipole plasma funnels, multi-curtain auroral draperies,
 * vertical atomic emission ray striations, and solar flare coronal mass ejections.
 */
export class AuroraEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 1200 : 1200;
    this.height = canvas ? canvas.height || 800 : 800;
    this.dpr = 1;

    // Simulation Parameters
    this.solarWindStrength = 520; // 200 to 1000 km/s (typical fast solar wind)
    this.colorShift = 0.40;       // 0.0 (Pure Oxygen Green) to 1.0 (Deep Nitrogen Purple)
    this.turbulence = 1.25;       // 0.2 to 3.0 (wave harmonic & noise multiplier)
    this.dipoleTilt = 0.18;       // Magnetic dipole axis tilt in radians (~10.5°)
    this.showFieldLines = true;   // Visualizing dipole magnetic flux
    this.showAtmosphereHaze = true;

    // Dynamics & Timing
    this.time = 0;
    this.cmePulse = 0.0;          // Coronal Mass Ejection shockwave factor (0.0 to 1.0)
    this.cmeDecayRate = 0.28;     // CME cooldown rate per second
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.cmeFlashes = [];         // Active flare impact bursts

    // Noise Generator
    this.noiseGen = new PerlinNoise(4242);

    // Entity Containers
    this.stars = [];
    this.landscapeNodes = [];
    this.ribbons = [];
    this.plasmaParticles = [];
    this.fieldLines = [];

    // UI tracking
    this.uiElements = [];

    // Initial setup
    this.initSimulation();
    this.initControls();
    attachTouchBridge(this, canvas);
  }

  /* -------------------------------------------------------------------------
   * INITIALIZATION
   * ---------------------------------------------------------------------- */
  initSimulation() {
    this.initStarfield();
    this.initLandscape();
    this.initRibbons();
    this.initPlasmaParticles();
    this.initFieldLines();
  }

  initStarfield() {
    this.stars = [];
    const starCount = 220;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.78),
        size: Math.random() * 1.8 + 0.5,
        baseAlpha: Math.random() * 0.65 + 0.25,
        twinkleSpeed: Math.random() * 2.5 + 0.8,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.85 ? '#b8d8ff' : (Math.random() > 0.9 ? '#ffe0b2' : '#ffffff')
      });
    }
  }

  initLandscape() {
    this.landscapeNodes = [];
    const segments = 90;
    const baseY = this.height * 0.86;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const x = u * this.width;
      // Procedural mountain ridge with jagged snowy crags
      const m1 = Math.sin(u * 14.0 + 1.2) * 28;
      const m2 = Math.cos(u * 29.0 - 0.5) * 14;
      const m3 = Math.sin(u * 5.0) * 45;
      const crag = this.noiseGen.noise(u * 18.0, 5.5) * 20;
      const y = baseY + m1 + m2 + m3 + crag;
      this.landscapeNodes.push({ x, y });
    }
  }

  initRibbons() {
    this.ribbons = [];
    // 6 discrete auroral curtain ribbons flowing at different altitudes/depths
    const ribbonCount = 6;
    const nodesPerRibbon = 85;

    for (let r = 0; r < ribbonCount; r++) {
      const depth = r / (ribbonCount - 1); // 0 (foreground) to 1 (distant background)
      const baseAltitude = this.height * (0.32 + depth * 0.22);
      const curtainHeight = this.height * (0.28 + (1.0 - depth) * 0.18);
      const nodes = [];

      for (let i = 0; i < nodesPerRibbon; i++) {
        const u = i / (nodesPerRibbon - 1);
        nodes.push({
          u,
          x: u * this.width,
          y: baseAltitude,
          topY: baseAltitude - curtainHeight,
          intensity: 1.0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.8 + Math.random() * 0.6
        });
      }

      this.ribbons.push({
        id: r,
        depth,
        baseAltitude,
        curtainHeight,
        speedMultiplier: 0.85 + depth * 0.4,
        harmonicFreq: 1.8 + depth * 1.2,
        nodes
      });
    }
  }

  initPlasmaParticles() {
    this.plasmaParticles = [];
    const particleCount = 380;
    for (let i = 0; i < particleCount; i++) {
      this.plasmaParticles.push(this.spawnPlasmaParticle(true));
    }
  }

  spawnPlasmaParticle(randomizeProgress = false) {
    const isSolarWind = Math.random() > 0.45;
    const startX = isSolarWind ? Math.random() * this.width * 0.35 : Math.random() * this.width;
    const startY = isSolarWind ? Math.random() * this.height * 0.25 : Math.random() * this.height * 0.4;

    return {
      x: startX,
      y: startY,
      vx: (Math.random() * 0.8 + 0.4) * (this.solarWindStrength / 300),
      vy: (Math.random() - 0.2) * 1.5,
      altitude: Math.random(),
      charge: Math.random() > 0.5 ? 1 : -1, // Proton vs Electron
      energy: Math.random() * 0.8 + 0.2,
      life: randomizeProgress ? Math.random() * 3.5 : 0,
      maxLife: 3.0 + Math.random() * 2.5,
      size: Math.random() * 2.2 + 0.8,
      colorType: Math.random() // Used for spectral emission on collision
    };
  }

  initFieldLines() {
    this.fieldLines = [];
    // 12 planetary dipole magnetic flux lines arcing through the magnetosphere
    const lineCount = 12;
    const pointsPerLine = 32;
    for (let l = 0; l < lineCount; l++) {
      const L = 0.55 + (l / lineCount) * 1.35; // L-shell parameter
      const points = [];
      for (let p = 0; p < pointsPerLine; p++) {
        points.push({ x: 0, y: 0, alpha: 0.2 });
      }
      this.fieldLines.push({ L, points, id: l });
    }
    this.recomputeFieldLines();
  }

  recomputeFieldLines() {
    // Calculate dipole field lines in screen coordinates
    // r = L * sin^2(theta)
    const centerX = this.width * 0.52;
    const centerY = this.height * 0.98;
    const baseRadius = this.width * 0.42;

    for (let l = 0; l < this.fieldLines.length; l++) {
      const fLine = this.fieldLines[l];
      const pts = fLine.points;
      const numPts = pts.length;
      const L_shell = fLine.L;

      for (let p = 0; p < numPts; p++) {
        // Parametric angle theta from south pole to north pole
        const theta = 0.20 + (p / (numPts - 1)) * (Math.PI - 0.40);
        const r = baseRadius * L_shell * Math.pow(Math.sin(theta), 2.0);

        // Apply dipole tilt
        const tiltedAngle = theta - Math.PI * 0.5 + this.dipoleTilt;
        const px = centerX + r * Math.sin(tiltedAngle);
        const py = centerY - r * Math.cos(tiltedAngle);

        pts[p].x = px;
        pts[p].y = py;
        // Fade lines as they reach outer edges
        pts[p].alpha = Math.sin(theta) * 0.22;
      }
    }
  }

  /* -------------------------------------------------------------------------
   * HEADLESS DOM CONTROLS
   * ---------------------------------------------------------------------- */
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Solar Wind Strength: <span id="aurora-wind-val">${Math.round(this.solarWindStrength)} km/s</span></label>
        <input type="range" id="aurora-wind-slider" min="200" max="1000" step="10" value="${this.solarWindStrength}">
      </div>

      <div class="control-group">
        <label>Color Shift: <span id="aurora-color-val">${(this.colorShift * 100).toFixed(0)}%</span></label>
        <input type="range" id="aurora-color-slider" min="0.0" max="1.0" step="0.05" value="${this.colorShift}">
      </div>

      <div class="control-group">
        <label>Turbulence: <span id="aurora-turb-val">${this.turbulence.toFixed(2)}x</span></label>
        <input type="range" id="aurora-turb-slider" min="0.2" max="3.0" step="0.1" value="${this.turbulence}">
      </div>

      <div class="control-btn-grid" style="margin-top: 6px;">
        <button id="aurora-cme-btn" class="sub-btn" style="border-color: #ff007f; color: #ff80df; font-weight: bold;">
          ⚡ Coronal Mass Ejection
        </button>
        <button id="aurora-reset-btn" class="sub-btn" style="border-color: #d4af37; color: #f9e79f;">
          ↺ Calibrate Magnetosphere
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="aurora-field-btn" class="sub-btn" style="border-color: #00ffff; color: #70ffff; width: 100%; padding: 7px;">
          🌐 Toggle Dipole Field Lines: ON
        </button>
      </div>

      <div class="control-group" style="margin-top: 8px; font-size: 0.75rem; color: #8c909e; font-family: monospace;">
        <div>Geomagnetic Index: <strong id="aurora-kp-readout" style="color: #39ff14;">Kp 4 (Active Auroral Oval)</strong></div>
        <div>Spectral Dominance: <strong id="aurora-spec-readout" style="color: #00ffff;">OI 557.7nm (Green) / N2+ (Cyan)</strong></div>
        <div>Active Entities: <strong id="aurora-entity-readout" style="color: #d4af37;">${this.getEntityCount()}</strong></div>
      </div>
    `;

    // Solar Wind Slider
    const windSlider = this.controlsContainer.querySelector('#aurora-wind-slider');
    const windVal = this.controlsContainer.querySelector('#aurora-wind-val');
    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.solarWindStrength = parseFloat(e.target.value);
        if (windVal) windVal.textContent = `${Math.round(this.solarWindStrength)} km/s`;
        this.updateTelemetryHUD();
      });
    }

    // Color Shift Slider
    const colorSlider = this.controlsContainer.querySelector('#aurora-color-slider');
    const colorVal = this.controlsContainer.querySelector('#aurora-color-val');
    if (colorSlider) {
      colorSlider.addEventListener('input', (e) => {
        this.colorShift = parseFloat(e.target.value);
        if (colorVal) colorVal.textContent = `${(this.colorShift * 100).toFixed(0)}%`;
        this.updateTelemetryHUD();
      });
    }

    // Turbulence Slider
    const turbSlider = this.controlsContainer.querySelector('#aurora-turb-slider');
    const turbVal = this.controlsContainer.querySelector('#aurora-turb-val');
    if (turbSlider) {
      turbSlider.addEventListener('input', (e) => {
        this.turbulence = parseFloat(e.target.value);
        if (turbVal) turbVal.textContent = `${this.turbulence.toFixed(2)}x`;
      });
    }

    // Button: CME
    const cmeBtn = this.controlsContainer.querySelector('#aurora-cme-btn');
    if (cmeBtn) {
      cmeBtn.addEventListener('click', () => {
        this.triggerCME();
      });
    }

    // Button: Reset
    const resetBtn = this.controlsContainer.querySelector('#aurora-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    // Button: Field Lines
    const fieldBtn = this.controlsContainer.querySelector('#aurora-field-btn');
    if (fieldBtn) {
      fieldBtn.addEventListener('click', () => {
        this.showFieldLines = !this.showFieldLines;
        fieldBtn.textContent = `🌐 Toggle Dipole Field Lines: ${this.showFieldLines ? 'ON' : 'OFF'}`;
      });
    }

    this.updateTelemetryHUD();
  }

  updateTelemetryHUD() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const kpReadout = this.controlsContainer.querySelector('#aurora-kp-readout');
    const specReadout = this.controlsContainer.querySelector('#aurora-spec-readout');
    const entReadout = this.controlsContainer.querySelector('#aurora-entity-readout');

    if (kpReadout) {
      let kp = Math.min(9, Math.max(1, Math.floor((this.solarWindStrength - 150) / 95) + (this.cmePulse > 0.2 ? 3 : 0)));
      let status = kp >= 7 ? 'Severe Geomagnetic Storm' : (kp >= 5 ? 'Active Substorm' : 'Quiet Oval');
      let color = kp >= 7 ? '#ff0055' : (kp >= 5 ? '#ffaa00' : '#39ff14');
      kpReadout.textContent = `Kp ${kp} (${status})`;
      kpReadout.style.color = color;
    }

    if (specReadout) {
      if (this.colorShift < 0.35) {
        specReadout.textContent = 'OI 557.7nm (Atomic Oxygen Emerald)';
        specReadout.style.color = '#39ff14';
      } else if (this.colorShift < 0.65) {
        specReadout.textContent = 'N2+ 391.4nm (Ionized Cyber Cyan)';
        specReadout.style.color = '#00ffff';
      } else {
        specReadout.textContent = 'OI 630.0nm & N2 (Imperial Purple/Violet)';
        specReadout.style.color = '#bf40bf';
      }
    }

    if (entReadout) {
      entReadout.textContent = `${this.getEntityCount()}`;
    }
  }

  /* -------------------------------------------------------------------------
   * SIMULATION STEP
   * ---------------------------------------------------------------------- */
  update(dt) {
    const safeDt = Math.min(dt, 0.05);
    this.time += safeDt;

    // Decay Coronal Mass Ejection excitation
    if (this.cmePulse > 0.001) {
      this.cmePulse = Math.max(0, this.cmePulse - this.cmeDecayRate * safeDt);
    } else {
      this.cmePulse = 0;
    }

    // Update active flare flashes
    for (let i = this.cmeFlashes.length - 1; i >= 0; i--) {
      const flash = this.cmeFlashes[i];
      flash.life -= safeDt;
      flash.radius += safeDt * 120;
      flash.alpha = Math.max(0, flash.life / flash.maxLife);
      if (flash.life <= 0) {
        this.cmeFlashes.splice(i, 1);
      }
    }

    // Normalized solar wind excitation factor
    const windRatio = (this.solarWindStrength / 500.0) * (1.0 + this.cmePulse * 1.5);
    const speed = windRatio * 0.8;

    // 1. Update Auroral Curtain Ribbons via Sine Waves & Perlin Noise Interference
    for (let r = 0; r < this.ribbons.length; r++) {
      const ribbon = this.ribbons[r];
      const nodes = ribbon.nodes;
      const numNodes = nodes.length;
      const rSpeed = ribbon.speedMultiplier * speed;
      const baseFreq = ribbon.harmonicFreq;

      for (let i = 0; i < numNodes; i++) {
        const node = nodes[i];
        const u = node.u;

        // Sine wave harmonic interference: 3 primary wave components
        const wave1 = Math.sin(u * (Math.PI * 2 * baseFreq) + this.time * (1.4 * rSpeed) + node.phase);
        const wave2 = Math.sin(u * (Math.PI * 4 * baseFreq) - this.time * (0.9 * rSpeed) + r * 1.1);
        const wave3 = Math.cos(u * (Math.PI * 6.5) + this.time * (2.1 * rSpeed));

        const sineInterference = (wave1 * 0.55 + wave2 * 0.32 + wave3 * 0.13);

        // 2D Perlin Noise field (spatial coordinate + time dimension)
        const noiseVal = this.noiseGen.fbm(
          u * 3.5 * this.turbulence + this.time * 0.12 * rSpeed,
          r * 1.4 + this.time * 0.08,
          3,
          2.0,
          0.5
        );

        // Vertical drapery fold displacement
        const foldDisp = (sineInterference * 42.0 + noiseVal * 75.0) * this.turbulence;
        node.y = ribbon.baseAltitude + foldDisp;

        // Curtain height swells with solar wind strength and CME energy
        const heightNoise = this.noiseGen.noise(u * 5.0 + this.time * 0.15, r * 2.2);
        const dynamicCurtainHeight = ribbon.curtainHeight * (0.8 + 0.35 * heightNoise) * Math.min(1.8, windRatio);
        node.topY = node.y - dynamicCurtainHeight;

        // Dynamic spectral intensity & flutter modulation
        const flutter = Math.sin(u * 28.0 + this.time * 4.5 + node.phase);
        node.intensity = Math.max(0.1, Math.min(1.0, 0.65 + flutter * 0.25 + (noiseVal * 0.3) + this.cmePulse * 0.4));
      }
    }

    // 2. Update Plasma Particles (Lorentz force in planetary magnetic dipole field)
    const centerX = this.width * 0.52;
    const centerY = this.height * 0.98;

    for (let i = 0; i < this.plasmaParticles.length; i++) {
      const p = this.plasmaParticles[i];
      p.life += safeDt;

      if (p.life >= p.maxLife || p.y > this.height || p.x > this.width + 50 || p.x < -50) {
        Object.assign(p, this.spawnPlasmaParticle(false));
      }

      // Dipole field magnetic attraction towards the magnetic pole (polar cusp)
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const distSq = dx * dx + dy * dy + 400.0;
      const dist = Math.sqrt(distSq);

      // Simplified Lorentz gyro-acceleration around field line:
      // F = q * (v x B) -> induces centripetal acceleration towards field line
      const fieldStrength = (this.solarWindStrength * 2200.0) / distSq;
      const normalX = -dy / dist;
      const normalY = dx / dist;

      p.vx += normalX * p.charge * fieldStrength * safeDt * 0.015;
      p.vy += (normalY * p.charge * fieldStrength * 0.01 + 18.0 * windRatio) * safeDt;

      // Solar wind bulk drift pushing down and to the right
      p.vx += (this.solarWindStrength * 0.08) * safeDt;

      // Atmospheric dampening in lower ionosphere
      if (p.y > this.height * 0.45) {
        p.vx *= 0.96;
        p.vy *= 0.96;
      }

      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
    }
  }

  /* -------------------------------------------------------------------------
   * RENDERING PIPELINE
   * ---------------------------------------------------------------------- */
  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    ctx.save();

    // 1. Dark Cosmos & Arctic Night Sky Backdrop
    this.renderDarkSkyBackdrop(ctx);

    // 2. Twinkling Starfield
    this.renderStarfield(ctx);

    // 3. Planetary Dipole Magnetic Flux Lines (Optional Cyber Overlay)
    if (this.showFieldLines) {
      this.renderDipoleFieldLines(ctx);
    }

    // 4. Aurora Curtains & Atmospheric Emission Strips (Additive Blending)
    this.renderAuroraCurtains(ctx);

    // 5. Magnetospheric Plasma Particles (Ion Glow & Spiraling Stream)
    this.renderPlasmaStream(ctx);

    // 6. Coronal Mass Ejection Impact Shockwaves
    this.renderCMEImpactFlashes(ctx);

    // 7. Mountain Silhouette & Roman Frontier Ruins
    this.renderArcticLandscape(ctx);

    // 8. Frozen Lake / Glacial Ice Reflection
    this.renderIceReflections(ctx);

    // 9. Classical Roman Parchment Telemetry HUD
    this.renderRomanTelemetryHUD(ctx);

    ctx.restore();
  }

  renderDarkSkyBackdrop(ctx) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    // Deep polar night gradient: Obsidian Blue -> Twilight Navy -> Dark Ionosphere
    skyGrad.addColorStop(0.0, '#020308');
    skyGrad.addColorStop(0.4, '#040714');
    skyGrad.addColorStop(0.75, '#070d22');
    skyGrad.addColorStop(1.0, '#0b132e');

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Diffuse atmospheric auroral glow in upper sky
    const glowGrad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.35, 20,
      this.width * 0.5, this.height * 0.35, this.width * 0.65
    );

    // Soft spectral glow based on colorShift
    const glowColor = this.getDominantSpectralColor(0.12 * (1.0 + this.cmePulse));
    glowGrad.addColorStop(0.0, glowColor);
    glowGrad.addColorStop(1.0, 'rgba(2, 3, 8, 0.0)');

    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderStarfield(ctx) {
    ctx.save();
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const twinkle = Math.sin(this.time * s.twinkleSpeed + s.twinkleOffset) * 0.35;
      const alpha = Math.max(0.1, Math.min(1.0, s.baseAlpha + twinkle));

      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderDipoleFieldLines(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.14)';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([4, 6]);

    for (let l = 0; l < this.fieldLines.length; l++) {
      const fLine = this.fieldLines[l];
      const pts = fLine.points;
      if (pts.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let p = 1; p < pts.length; p++) {
        ctx.lineTo(pts[p].x, pts[p].y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  /**
   * Main Aurora Rendering: Additive Blending with multi-layer vertical gradients
   * Green (#39FF14), Purple (#800080), and Cyber-Blue (#00FFFF).
   */
  renderAuroraCurtains(ctx) {
    ctx.save();
    // Enable Additive Blending for ethereal, self-illuminating plasma light
    ctx.globalCompositeOperation = 'lighter';

    const numRibbons = this.ribbons.length;

    // Render back-to-front by depth
    for (let r = numRibbons - 1; r >= 0; r--) {
      const ribbon = this.ribbons[r];
      const nodes = ribbon.nodes;
      const numNodes = nodes.length;
      if (numNodes < 2) continue;

      // Pass A: Soft Luminous Sheet / Veil Body
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);

      // Bottom contour (lower ionospheric excitation boundary)
      for (let i = 1; i < numNodes; i++) {
        const prev = nodes[i - 1];
        const curr = nodes[i];
        const midX = (prev.x + curr.x) * 0.5;
        const midY = (prev.y + curr.y) * 0.5;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      ctx.lineTo(nodes[numNodes - 1].x, nodes[numNodes - 1].y);

      // Top contour (high-altitude atomic oxygen crown)
      ctx.lineTo(nodes[numNodes - 1].x, nodes[numNodes - 1].topY);
      for (let i = numNodes - 2; i >= 0; i--) {
        const next = nodes[i + 1];
        const curr = nodes[i];
        const midX = (next.x + curr.x) * 0.5;
        const midTopY = (next.topY + curr.topY) * 0.5;
        ctx.quadraticCurveTo(next.x, next.topY, midX, midTopY);
      }
      ctx.lineTo(nodes[0].x, nodes[0].topY);
      ctx.closePath();

      // Multi-stop Vertical Linear Gradient for the sheet
      const avgBaseY = ribbon.baseAltitude;
      const avgTopY = ribbon.baseAltitude - ribbon.curtainHeight;
      const sheetGrad = ctx.createLinearGradient(0, avgBaseY, 0, avgTopY);

      this.populateSpectralGradientStops(sheetGrad, 0.28 * (1.0 - ribbon.depth * 0.4));
      ctx.fillStyle = sheetGrad;
      ctx.fill();

      // Pass B: Vertical Ray Striations (Columnar Magnetic Field Lines)
      // Realistic fluttering vertical folds & bright curtain pleats
      for (let i = 0; i < numNodes; i += 2) {
        const node = nodes[i];
        const rayAlpha = node.intensity * (0.35 + (1.0 - ribbon.depth) * 0.45);

        // Slight tilt according to dipole inclination
        const tiltX = Math.sin(this.dipoleTilt) * (node.y - node.topY) * 0.3;

        const rayGrad = ctx.createLinearGradient(node.x, node.y, node.x + tiltX, node.topY);
        this.populateSpectralGradientStops(rayGrad, rayAlpha);

        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 2.4 + (1.0 - ribbon.depth) * 2.2;

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.x + tiltX, node.topY);
        ctx.stroke();

        // Intense glowing core filament for prominent nodes
        if (node.intensity > 0.72) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 * rayAlpha})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.x + tiltX, node.topY * 0.8 + node.y * 0.2);
          ctx.stroke();
        }
      }

      // Pass C: Sharp Lower Border Glow (Oxygen 557.7nm green boundary)
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < numNodes; i++) {
        const prev = nodes[i - 1];
        const curr = nodes[i];
        const midX = (prev.x + curr.x) * 0.5;
        const midY = (prev.y + curr.y) * 0.5;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      ctx.lineTo(nodes[numNodes - 1].x, nodes[numNodes - 1].y);

      // Lower edge border color
      const edgeAlpha = (0.55 + this.cmePulse * 0.35) * (1.0 - ribbon.depth * 0.3);
      ctx.strokeStyle = this.getLowerEdgeColor(edgeAlpha);
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Constructs the physical spectral emission gradient:
   * Bottom: Neon Green #39FF14 (Atomic Oxygen OI 557.7nm)
   * Mid: Cyber-Blue #00FFFF (Ionized Molecular Nitrogen N2+ 391.4nm)
   * Top: Purple/Magenta #800080 / #BA55D3 (High Altitude OI 630.0nm)
   */
  populateSpectralGradientStops(gradient, alphaMultiplier) {
    const a = Math.max(0, Math.min(1.0, alphaMultiplier));
    const c = this.colorShift; // 0.0 (Green dominant) to 1.0 (Purple dominant)

    // Dynamic color balance modulation
    // Neon Green #39FF14 -> rgb(57, 255, 20)
    // Cyber-Blue #00FFFF -> rgb(0, 255, 255)
    // Imperial Purple #800080 / Neon Violet -> rgb(170, 30, 230)

    const greenAlpha = Math.max(0, (1.0 - c * 0.85) * a);
    const cyanAlpha = Math.max(0, (0.85 + Math.sin(c * Math.PI) * 0.4) * a);
    const purpleAlpha = Math.max(0, (0.35 + c * 0.75) * a);

    // Gradient goes from bottom (0.0) to top (1.0)
    gradient.addColorStop(0.00, `rgba(57, 255, 20, ${greenAlpha.toFixed(3)})`);
    gradient.addColorStop(0.18, `rgba(70, 255, 120, ${(greenAlpha * 0.9).toFixed(3)})`);
    gradient.addColorStop(0.42, `rgba(0, 255, 255, ${cyanAlpha.toFixed(3)})`);
    gradient.addColorStop(0.72, `rgba(180, 40, 240, ${purpleAlpha.toFixed(3)})`);
    gradient.addColorStop(0.92, `rgba(128, 0, 128, ${(purpleAlpha * 0.5).toFixed(3)})`);
    gradient.addColorStop(1.00, `rgba(80, 0, 120, 0.000)`);
  }

  getDominantSpectralColor(alpha) {
    const c = this.colorShift;
    if (c < 0.35) {
      return `rgba(57, 255, 20, ${alpha.toFixed(3)})`;
    } else if (c < 0.70) {
      return `rgba(0, 255, 255, ${alpha.toFixed(3)})`;
    } else {
      return `rgba(180, 40, 240, ${alpha.toFixed(3)})`;
    }
  }

  getLowerEdgeColor(alpha) {
    const c = this.colorShift;
    if (c < 0.5) {
      return `rgba(57, 255, 20, ${alpha.toFixed(3)})`;
    } else {
      return `rgba(0, 255, 255, ${alpha.toFixed(3)})`;
    }
  }

  renderPlasmaStream(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.plasmaParticles.length; i++) {
      const p = this.plasmaParticles[i];
      const lifeRatio = p.life / p.maxLife;
      const alpha = Math.sin(lifeRatio * Math.PI) * 0.85;

      // Color based on particle energy and global colorShift
      let colorStr;
      if (p.colorType < 0.45) {
        colorStr = `rgba(57, 255, 20, ${alpha.toFixed(3)})`; // Green
      } else if (p.colorType < 0.75) {
        colorStr = `rgba(0, 255, 255, ${alpha.toFixed(3)})`; // Cyan
      } else {
        colorStr = `rgba(210, 50, 255, ${alpha.toFixed(3)})`; // Purple
      }

      ctx.fillStyle = colorStr;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // High-energy particles cast small ion streaks
      if (p.energy > 0.6) {
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderCMEImpactFlashes(ctx) {
    if (this.cmeFlashes.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.cmeFlashes.length; i++) {
      const f = this.cmeFlashes[i];
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      grad.addColorStop(0.0, `rgba(255, 255, 255, ${(f.alpha * 0.9).toFixed(3)})`);
      grad.addColorStop(0.35, `rgba(0, 255, 255, ${(f.alpha * 0.6).toFixed(3)})`);
      grad.addColorStop(0.70, `rgba(255, 0, 128, ${(f.alpha * 0.35).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(128, 0, 128, 0.0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderArcticLandscape(ctx) {
    ctx.save();

    // 1. Distant Snowy Mountain Silhouette
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let i = 0; i < this.landscapeNodes.length; i++) {
      const pt = this.landscapeNodes[i];
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();

    const mountainGrad = ctx.createLinearGradient(0, this.height * 0.78, 0, this.height);
    mountainGrad.addColorStop(0.0, '#0a1022');
    mountainGrad.addColorStop(0.5, '#050814');
    mountainGrad.addColorStop(1.0, '#020308');

    ctx.fillStyle = mountainGrad;
    ctx.fill();

    // Snowy highlight along mountain crests illuminated by aurora light
    ctx.strokeStyle = this.getDominantSpectralColor(0.28);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < this.landscapeNodes.length; i++) {
      const pt = this.landscapeNodes[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // 2. Classical Roman Polar Outpost / Observation Columns (Cyber-Classical Silhouette)
    const outpostX = this.width * 0.82;
    const outpostY = this.height * 0.85;

    ctx.fillStyle = '#050711';
    // Base platform
    ctx.fillRect(outpostX - 45, outpostY - 10, 90, 12);
    // 4 Classical Pillars
    for (let c = 0; c < 4; c++) {
      const px = outpostX - 35 + c * 23;
      ctx.fillRect(px, outpostY - 45, 6, 35);
      // Capital & base
      ctx.fillRect(px - 2, outpostY - 48, 10, 4);
      ctx.fillRect(px - 1, outpostY - 12, 8, 3);
    }
    // Entablature & Pediment roof
    ctx.fillRect(outpostX - 42, outpostY - 52, 84, 5);
    ctx.beginPath();
    ctx.moveTo(outpostX - 42, outpostY - 52);
    ctx.lineTo(outpostX, outpostY - 70);
    ctx.lineTo(outpostX + 42, outpostY - 52);
    ctx.closePath();
    ctx.fill();

    // Cyber-Gold laurel crest on pediment
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.restore();
  }

  renderIceReflections(ctx) {
    ctx.save();
    const iceY = this.height * 0.91;
    const iceH = this.height - iceY;

    // Dark frozen lake surface
    const iceGrad = ctx.createLinearGradient(0, iceY, 0, this.height);
    iceGrad.addColorStop(0.0, 'rgba(4, 7, 18, 0.90)');
    iceGrad.addColorStop(1.0, 'rgba(2, 3, 8, 0.98)');

    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, iceY, this.width, iceH);

    // Shimmering horizontal reflection strips (Additive blending)
    ctx.globalCompositeOperation = 'lighter';

    const reflectionCount = 18;
    for (let i = 0; i < reflectionCount; i++) {
      const u = (i + 0.5) / reflectionCount;
      const rx = u * this.width;
      const ry = iceY + 8 + (i % 5) * (iceH / 6.0);
      const rippleW = 60 + Math.sin(this.time * 2.0 + i) * 35;

      const rippleGrad = ctx.createLinearGradient(rx - rippleW * 0.5, 0, rx + rippleW * 0.5, 0);
      const col = this.getDominantSpectralColor(0.08 * (1.0 + this.cmePulse));
      rippleGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
      rippleGrad.addColorStop(0.5, col);
      rippleGrad.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.fillStyle = rippleGrad;
      ctx.fillRect(rx - rippleW * 0.5, ry, rippleW, 2.5);
    }

    ctx.restore();
  }

  renderRomanTelemetryHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    const hudW = narrow ? Math.min(sw - 28, 280) : 280;
    const hudH = narrow ? 134 : 150;
    const hudX = 14;
    const hudY = 14;

    // Roman parchment & cyber dark plate
    const hudGrad = ctx.createLinearGradient(hudX, hudY, hudX + hudW, hudY + hudH);
    hudGrad.addColorStop(0.0, 'rgba(10, 14, 26, 0.88)');
    hudGrad.addColorStop(1.0, 'rgba(5, 8, 16, 0.94)');

    ctx.fillStyle = hudGrad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(hudX, hudY, hudW, hudH, 8) : ctx.rect(hudX, hudY, hudW, hudH);
    ctx.fill();

    // Cyber-Gold border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Header: Naturalis Historia Reference
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'left';
    ctx.fillText('AURORA BOREALIS • CHASMA CAELI', hudX + 12, hudY + 22);

    // Pliny the Elder Quote
    ctx.fillStyle = '#b0b8d0';
    ctx.font = 'italic 10px serif';
    ctx.fillText('“In caelo trabes ac chasmata...”', hudX + 12, hudY + 38);

    // Telemetry lines
    ctx.font = '10px monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('Solar Wind:', hudX + 12, hudY + 58);
    ctx.fillStyle = '#39ff14';
    ctx.fillText(`${Math.round(this.solarWindStrength)} km/s`, hudX + 105, hudY + 58);

    ctx.fillStyle = '#8c909e';
    ctx.fillText('B_z Coup  :', hudX + 12, hudY + 74);
    const bzVal = (-3.2 - (this.solarWindStrength / 300) * 2.1).toFixed(1);
    ctx.fillStyle = '#ff80df';
    ctx.fillText(`${bzVal} nT`, hudX + 105, hudY + 74);

    ctx.fillStyle = '#8c909e';
    ctx.fillText('Oval Lat  :', hudX + 12, hudY + 90);
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`67.5° N`, hudX + 105, hudY + 90);

    ctx.fillStyle = '#8c909e';
    ctx.fillText('Emission  :', hudX + 12, hudY + 106);
    const specLabel = this.colorShift < 0.4 ? 'OI 557nm [Grn]' : (this.colorShift < 0.7 ? 'N2+ 391nm [Cyan]' : 'OI 630nm [Purp]');
    ctx.fillStyle = this.colorShift < 0.4 ? '#39ff14' : (this.colorShift < 0.7 ? '#00ffff' : '#bf40bf');
    ctx.fillText(specLabel, hudX + 105, hudY + 106);

    if (!narrow || hudH > 140) {
      ctx.fillStyle = '#8c909e';
      ctx.fillText('Entities  :', hudX + 12, hudY + 122);
      ctx.fillStyle = '#d4af37';
      ctx.fillText(`${this.getEntityCount()} nodes/ions`, hudX + 105, hudY + 122);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * ACTIONS & LIFECYCLE
   * ---------------------------------------------------------------------- */
  triggerCME(pos = null) {
    this.cmePulse = 1.0;

    const fx = pos ? pos.x : this.width * 0.45;
    const fy = pos ? pos.y : this.height * 0.35;

    this.cmeFlashes.push({
      x: fx,
      y: fy,
      radius: 20,
      life: 1.2,
      maxLife: 1.2,
      alpha: 1.0
    });

    // Burst 40 new energetic plasma ions
    for (let i = 0; i < 40; i++) {
      const p = this.spawnPlasmaParticle(false);
      p.x = fx + (Math.random() - 0.5) * 60;
      p.y = fy + (Math.random() - 0.5) * 60;
      p.vx = (Math.random() - 0.5) * 160 + 50;
      p.vy = (Math.random() - 0.3) * 120;
      p.energy = 1.0;
      this.plasmaParticles.push(p);
    }

    // Keep particles capped to reasonable bound
    if (this.plasmaParticles.length > 500) {
      this.plasmaParticles.splice(0, this.plasmaParticles.length - 450);
    }

    this.updateTelemetryHUD();
  }

  reset() {
    this.solarWindStrength = 520;
    this.colorShift = 0.40;
    this.turbulence = 1.25;
    this.dipoleTilt = 0.18;
    this.cmePulse = 0;
    this.cmeFlashes = [];
    this.time = 0;

    this.initSimulation();
    this.initControls();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer && typeof document !== 'undefined') {
      this.uiElements.forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      this.controlsContainer.innerHTML = '';
    }
    this.uiElements = [];
    this.stars = [];
    this.landscapeNodes = [];
    this.ribbons = [];
    this.plasmaParticles = [];
    this.fieldLines = [];
    this.cmeFlashes = [];
  }

  /**
   * Returns total count of rendered aurora strips/nodes and active plasma ions.
   */
  getEntityCount() {
    let ribbonNodeCount = 0;
    for (let r = 0; r < this.ribbons.length; r++) {
      ribbonNodeCount += this.ribbons[r].nodes.length;
    }
    let fieldNodesCount = 0;
    for (let l = 0; l < this.fieldLines.length; l++) {
      fieldNodesCount += this.fieldLines[l].points.length;
    }
    return ribbonNodeCount + this.plasmaParticles.length + fieldNodesCount;
  }

  resize(width, height, dpr = 1) {
    this.width = width || 1200;
    this.height = height || 800;
    this.dpr = dpr || 1;

    this.initStarfield();
    this.initLandscape();
    this.initRibbons();
    this.recomputeFieldLines();
    this.updateTelemetryHUD();
  }

  /* -------------------------------------------------------------------------
   * INPUT HANDLING
   * ---------------------------------------------------------------------- */
  onMouseDown(pos) {
    if (!pos) return;
    this.isDragging = true;
    this.lastMousePos = { x: pos.x, y: pos.y };

    // Inject coronal mass ejection at click location
    this.triggerCME(pos);
  }

  onMouseMove(pos) {
    if (!pos) return;
    if (this.isDragging) {
      const dx = pos.x - this.lastMousePos.x;
      // Mouse drag tilts the geomagnetic dipole axis
      this.dipoleTilt += dx * 0.004;
      this.dipoleTilt = Math.max(-0.65, Math.min(0.65, this.dipoleTilt));
      this.recomputeFieldLines();
      this.lastMousePos = { x: pos.x, y: pos.y };
    }
  }

  onMouseUp(pos) {
    this.isDragging = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar' || key === 'f' || key === 'F') {
      this.triggerCME();
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === 'm' || key === 'M') {
      this.showFieldLines = !this.showFieldLines;
      const fieldBtn = this.controlsContainer ? this.controlsContainer.querySelector('#aurora-field-btn') : null;
      if (fieldBtn) {
        fieldBtn.textContent = `🌐 Toggle Dipole Field Lines: ${this.showFieldLines ? 'ON' : 'OFF'}`;
      }
    } else if (key === 'c' || key === 'C') {
      // Cycle color shift presets
      this.colorShift = (this.colorShift + 0.33) % 1.0;
      const colorSlider = this.controlsContainer ? this.controlsContainer.querySelector('#aurora-color-slider') : null;
      const colorVal = this.controlsContainer ? this.controlsContainer.querySelector('#aurora-color-val') : null;
      if (colorSlider) colorSlider.value = this.colorShift;
      if (colorVal) colorVal.textContent = `${(this.colorShift * 100).toFixed(0)}%`;
      this.updateTelemetryHUD();
    }
  }

  onKeyUp(key, e) {
    // No-op
  }
}
