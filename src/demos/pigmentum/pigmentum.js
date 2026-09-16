// Pigmentum: Buon Fresco Optical Pigment Mixing & Plaster Carbonatization Engine
// Grounded in Pliny the Elder's Naturalis Historia (Book XXXV: Painting, Colors & Mineral Pigments)
// and Vitruvius' De Architectura (Book VII: Plaster Stucco & Fresco Painting)

export const PIGMENTUM_PRESETS = {
  MYSTERIES: 'Villa of the Mysteries (Pompeian Red)',
  LIVIA: 'Garden of Livia (Acanthus & Birds)',
  SAPPHO: 'Sappho Medallion (Poetess Portrait)',
  MARINE: 'Herculaneum Marine (Dolphin & Waves)',
  BLANK: 'Blank Wet Intonaco (Pristine Wall)'
};

// 6 Authentic Roman Mineral Pigments + Charcoal Lampblack
// Optical absorption (K) and scattering (S) coefficients for RGB Kubelka-Munk subtractive mixing
export const PIGMENTS = {
  PURPURISSUM: {
    id: 'purpurissum',
    name: 'Purpurissum (Tyrian Purple)',
    latin: 'Murex brandaris / Purpura',
    formula: 'C16H8Br2N2O2',
    colorHex: '#6a1843',
    rgb: [106, 24, 67],
    // K: Absorption across [R, G, B]
    K: [0.22, 0.88, 0.36],
    // S: Scattering across [R, G, B]
    S: [0.18, 0.05, 0.14],
    desc: 'Imperial purple extracted from marine murex mollusks along the Campania coast.'
  },
  CAERULEUM: {
    id: 'caeruleum',
    name: 'Caeruleum (Egyptian Blue)',
    latin: 'Cuprorivaite frit',
    formula: 'CaCuSi4O10',
    colorHex: '#1b64a8',
    rgb: [27, 100, 168],
    K: [0.92, 0.46, 0.07],
    S: [0.08, 0.22, 0.74],
    desc: 'Ancient synthetic azure glass frit synthesized at Puteoli from silica, copper, and lime.'
  },
  CINNABARIS: {
    id: 'cinnabaris',
    name: 'Cinnabaris (Vermilion Red)',
    latin: 'Minium Hispaniensis',
    formula: 'HgS',
    colorHex: '#d52a1b',
    rgb: [213, 42, 27],
    K: [0.06, 0.90, 0.96],
    S: [0.82, 0.10, 0.05],
    desc: 'Sacred scarlet mercuric sulfide from Hispania; basis of iconic Pompeian Red walls.'
  },
  CHRYSOCOLLA: {
    id: 'chrysocolla',
    name: 'Chrysocolla (Malachite Green)',
    latin: 'Creta Viridis / Appianum',
    formula: 'Cu2CO3(OH)2',
    colorHex: '#258444',
    rgb: [37, 132, 68],
    K: [0.85, 0.09, 0.78],
    S: [0.10, 0.70, 0.12],
    desc: 'Verdant green basic copper carbonate and celadonite green earth for lush garden frescoes.'
  },
  SIL: {
    id: 'sil',
    name: 'Sil Atticum (Yellow Ochre)',
    latin: 'Sil Atticum aureum',
    formula: 'FeO(OH)·nH2O',
    colorHex: '#dba32a',
    rgb: [219, 163, 42],
    K: [0.10, 0.24, 0.95],
    S: [0.65, 0.58, 0.08],
    desc: 'Luminous golden hydrated iron oxide earth from Athenian and Campanian clay beds.'
  },
  PARAETONIUM: {
    id: 'paraetonium',
    name: 'Paraetonium (Lime Stucco White)',
    latin: 'Calx Extincta / Marmor Parium',
    formula: 'Ca(OH)2 + CaCO3',
    colorHex: '#f6f1e5',
    rgb: [246, 241, 229],
    K: [0.02, 0.02, 0.02],
    S: [0.98, 0.98, 0.98],
    desc: 'Pure slaked high-calcium lime with pulverized Parian marble dust for intonaco highlights.'
  },
  ATRAMENTUM: {
    id: 'atramentum',
    name: 'Atramentum (Vine Lampblack)',
    latin: 'Fuligo vitis combusta',
    formula: 'C',
    colorHex: '#1d1a19',
    rgb: [29, 26, 25],
    K: [0.99, 0.99, 0.99],
    S: [0.02, 0.02, 0.02],
    desc: 'Dense velvety black carbon soot from calcined wine pressings and resin torches.'
  }
};

/**
 * Optical Subtractive Color Mixing via Kubelka-Munk Theory
 * Reflectance R(lambda) = 1 + K/S - sqrt((K/S)^2 + 2*(K/S))
 */
export function computeKubelkaMunkRgb(pigmentFractions, waterContent = 0.3) {
  // Fresh lime intonaco plaster optical parameters
  const kPlaster = [0.025, 0.025, 0.03];
  const sPlaster = [0.94, 0.92, 0.88];

  let kTot = [0, 0, 0];
  let sTot = [0, 0, 0];
  let totalFraction = 0;

  for (const item of pigmentFractions) {
    const p = item.pigment;
    const w = Math.max(0, item.weight);
    totalFraction += w;
    for (let c = 0; c < 3; c++) {
      kTot[c] += w * p.K[c];
      sTot[c] += w * p.S[c];
    }
  }

  // Water dilution increases transparency, revealing the intonaco substrate
  const pigmentOpacity = Math.max(0.01, Math.min(1.0, 1.0 - waterContent * 0.65));
  const effectiveFraction = totalFraction * pigmentOpacity;

  // Intonaco substrate contribution
  const plasterFraction = Math.max(0.001, 1.0 - Math.min(1.0, effectiveFraction));
  for (let c = 0; c < 3; c++) {
    kTot[c] += plasterFraction * kPlaster[c];
    sTot[c] += plasterFraction * sPlaster[c];
  }

  // Calculate reflectance R for each RGB spectral band
  const rgb = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const s = Math.max(0.001, sTot[c]);
    const ks = kTot[c] / s;
    const r = 1.0 + ks - Math.sqrt(ks * ks + 2.0 * ks);
    rgb[c] = Math.max(0, Math.min(255, Math.round(r * 255)));
  }

  return rgb;
}

export class PigmentumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation Clock
    this.simTime = 0;
    this.lastTimestamp = 0;

    // Plaster Intonaco Surface State
    this.intonacoHumidity = 0.85;       // Plaster moisture (1.0 = freshly spread wet lime, 0 = bone dry)
    this.carbonatizationProgress = 0.15; // CaCO3 crystallization (0 = unreacted slaked lime, 1.0 = fully set stone)
    this.evaporationRate = 0.02;        // Natural drying speed per second
    this.currentPreset = PIGMENTUM_PRESETS.MYSTERIES;

    // Artist Brush Parameters
    this.selectedPigmentKey = 'PURPURISSUM';
    this.brushSize = 18;                // Brush radius in px
    this.waterContent = 0.35;           // Water dilution (0.05 = thick impasto, 0.9 = watery glaze)
    this.isPainting = false;
    this.lastPaintPos = null;

    // Core Dynamic Entities
    this.strokeNodes = [];              // Wet pigment stroke nodes deposited on the fresco
    this.colorMixSamplePoints = [];     // Dynamic Kubelka-Munk optical blend sampling points
    this.splatters = [];                // Micro capillary water spatter / pigment granules
    this.craquelureFissures = [];       // Procedural antique plaster cracks
    this.marbleSparkles = [];           // Crushed Parian marble dust specks in the stucco

    // Offscreen Fresco Wall Canvas & Buffer
    this.initWallSurfaces();

    // Sound FX Synthesis State
    this.audioCtx = null;
    this.initAudio();

    // DOM Controls Setup
    this.initControls();

    // Load initial authentic Pompeian motif
    this.loadPreset(this.currentPreset);
  }

  // -------------------------------------------------------------------------
  // Offscreen Buffers & Surface Texture
  // -------------------------------------------------------------------------
  initWallSurfaces() {
    if (typeof document === 'undefined') return;

    // Offscreen canvas storing permanent fresco pigment layers
    this.frescoCanvas = document.createElement('canvas');
    this.frescoCanvas.width = this.width;
    this.frescoCanvas.height = this.height;
    this.frescoCtx = this.frescoCanvas.getContext('2d');

    // Plaster texture background cache
    this.plasterCanvas = document.createElement('canvas');
    this.plasterCanvas.width = this.width;
    this.plasterCanvas.height = this.height;
    this.plasterCtx = this.plasterCanvas.getContext('2d');

    this.generateStuccoTexture();
  }

  generateStuccoTexture() {
    if (!this.plasterCtx) return;
    const ctx = this.plasterCtx;
    const w = this.width;
    const h = this.height;

    // 1. Base Roman mortar: warm, aged travertine lime wash
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0.0, '#f7f2e7');
    grad.addColorStop(0.4, '#f2ece0');
    grad.addColorStop(0.8, '#ede6d6');
    grad.addColorStop(1.0, '#e8e0ce');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. Hand-troweled intonaco texture ripples
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const y = (h / 40) * i + (Math.sin(i * 1.5) * 8);
      const angle = (Math.sin(i * 0.7) * 0.03);
      ctx.save();
      ctx.translate(0, y);
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(180, 165, 140, 0.08)';
      ctx.fillRect(-20, -15, w + 40, 28);
      ctx.restore();
    }
    ctx.restore();

    // 3. Crushed Parian marble dust specks (sparkles)
    this.marbleSparkles = [];
    const sparkleCount = Math.floor((w * h) / 1800);
    for (let i = 0; i < sparkleCount; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const size = 0.6 + Math.random() * 1.4;
      const alpha = 0.2 + Math.random() * 0.5;
      this.marbleSparkles.push({ x: sx, y: sy, size, alpha });

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Subtle ancient hairline craquelure fissures in dry plaster
    this.generateCraquelure();
  }

  generateCraquelure() {
    this.craquelureFissures = [];
    const numCenters = 8;
    const w = this.width;
    const h = this.height;

    for (let c = 0; c < numCenters; c++) {
      let x = 80 + Math.random() * (w - 160);
      let y = 80 + Math.random() * (h - 160);
      let angle = Math.random() * Math.PI * 2;
      const branches = 3 + Math.floor(Math.random() * 3);

      for (let b = 0; b < branches; b++) {
        const branchAngle = angle + (b * Math.PI * 2) / branches + (Math.random() - 0.5) * 0.5;
        let cx = x;
        let cy = y;
        const pts = [{ x: cx, y: cy }];
        const segs = 6 + Math.floor(Math.random() * 8);

        for (let s = 0; s < segs; s++) {
          const step = 8 + Math.random() * 14;
          const turn = (Math.random() - 0.5) * 0.8;
          const a = branchAngle + turn;
          cx += Math.cos(a) * step;
          cy += Math.sin(a) * step;
          pts.push({ x: cx, y: cy });
        }
        this.craquelureFissures.push({ pts, opacity: 0.12 + Math.random() * 0.15 });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Safe Headless Audio Synthesizer (Hog-Bristle Brush on Wet Stucco)
  // -------------------------------------------------------------------------
  initAudio() {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      this.audioCtx = new window.AudioContext();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playBrushSound(intensity = 1.0) {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    try {
      const t = this.audioCtx.currentTime;
      // White noise buffer shaped into soft bristly brush friction
      const dur = 0.08 + Math.random() * 0.05;
      const buffer = this.audioCtx.createBuffer(1, Math.floor(this.audioCtx.sampleRate * dur), this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.4));
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, t);
      filter.Q.setValueAtTime(1.8, t);

      const gain = this.audioCtx.createGain();
      const vol = Math.min(0.12, 0.04 * intensity * (1.0 - this.waterContent * 0.4));
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noise.start(t);
      noise.stop(t + dur);
    } catch (e) {}
  }

  playPlasterTrowelSound() {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  // -------------------------------------------------------------------------
  // DOM Controls Construction
  // -------------------------------------------------------------------------
  initControls() {
    // Safe headless DOM guard
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Pompeian Fresco Motif</label>
        <select id="pigmentum-preset" class="sub-btn" style="width: 100%; text-align: left; padding: 6px 8px;">
          <option value="${PIGMENTUM_PRESETS.MYSTERIES}" ${this.currentPreset === PIGMENTUM_PRESETS.MYSTERIES ? 'selected' : ''}>Villa of the Mysteries (Pompeian Red)</option>
          <option value="${PIGMENTUM_PRESETS.LIVIA}" ${this.currentPreset === PIGMENTUM_PRESETS.LIVIA ? 'selected' : ''}>Garden of Livia (Acanthus & Birds)</option>
          <option value="${PIGMENTUM_PRESETS.SAPPHO}" ${this.currentPreset === PIGMENTUM_PRESETS.SAPPHO ? 'selected' : ''}>Sappho Medallion (Poetess Portrait)</option>
          <option value="${PIGMENTUM_PRESETS.MARINE}" ${this.currentPreset === PIGMENTUM_PRESETS.MARINE ? 'selected' : ''}>Herculaneum Marine (Dolphin & Waves)</option>
          <option value="${PIGMENTUM_PRESETS.BLANK}" ${this.currentPreset === PIGMENTUM_PRESETS.BLANK ? 'selected' : ''}>Blank Wet Intonaco (Pristine Wall)</option>
        </select>
      </div>

      <div class="control-group">
        <label>Authentic Roman Mineral Pigment</label>
        <div class="control-btn-grid" id="pigment-selector" style="grid-template-columns: repeat(3, 1fr); gap: 5px;">
          <button class="sub-btn active" data-pigment="PURPURISSUM" style="border-left: 4px solid ${PIGMENTS.PURPURISSUM.colorHex}; font-size: 11px;">
            🟣 Purpurissum
          </button>
          <button class="sub-btn" data-pigment="CAERULEUM" style="border-left: 4px solid ${PIGMENTS.CAERULEUM.colorHex}; font-size: 11px;">
            🔵 Caeruleum
          </button>
          <button class="sub-btn" data-pigment="CINNABARIS" style="border-left: 4px solid ${PIGMENTS.CINNABARIS.colorHex}; font-size: 11px;">
            🔴 Cinnabaris
          </button>
          <button class="sub-btn" data-pigment="CHRYSOCOLLA" style="border-left: 4px solid ${PIGMENTS.CHRYSOCOLLA.colorHex}; font-size: 11px;">
            🟢 Chrysocolla
          </button>
          <button class="sub-btn" data-pigment="SIL" style="border-left: 4px solid ${PIGMENTS.SIL.colorHex}; font-size: 11px;">
            🟡 Sil Atticum
          </button>
          <button class="sub-btn" data-pigment="PARAETONIUM" style="border-left: 4px solid ${PIGMENTS.PARAETONIUM.colorHex}; font-size: 11px;">
            ⚪ Paraetonium
          </button>
        </div>
      </div>

      <div class="control-group">
        <label>Brush Radius: <span id="brush-val">${this.brushSize}px</span></label>
        <input type="range" id="brush-slider" min="4" max="60" step="1" value="${this.brushSize}">
      </div>

      <div class="control-group">
        <label>Water Content / Dilution: <span id="water-val">${Math.round(this.waterContent * 100)}%</span></label>
        <input type="range" id="water-slider" min="0.05" max="0.95" step="0.05" value="${this.waterContent}">
      </div>

      <div class="control-group">
        <label>Buon Fresco Actions</label>
        <div class="control-btn-grid">
          <button class="sub-btn" id="btn-clear">🧹 Clear Fresco</button>
          <button class="sub-btn" id="btn-spritz">💧 Spritz Water</button>
          <button class="sub-btn" id="btn-carbonatize">⏳ Carbonatize</button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Active Mineral:</span>
          <span id="mineral-formula" style="color: #d4af37; font-weight: bold;">C16H8Br2N2O2</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Intonaco Humidity:</span>
          <span id="humidity-val" style="color: #8bc34a;">85% (Buon Fresco)</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>CaCO3 Carbonatized:</span>
          <span id="carb-val" style="color: #e0e0e0;">15%</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Stroke Nodes / Mix Pts:</span>
          <span id="entities-val" style="color: #ffca28;">0</span>
        </div>
      </div>
    `;

    // Hook listeners
    const presetSelect = this.controlsContainer.querySelector('#pigmentum-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.loadPreset(e.target.value);
      });
    }

    const pigmentBtns = this.controlsContainer.querySelectorAll('#pigment-selector button');
    pigmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        pigmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedPigmentKey = btn.dataset.pigment;
        this.updateHUD();
      });
    });

    const brushSlider = this.controlsContainer.querySelector('#brush-slider');
    const brushVal = this.controlsContainer.querySelector('#brush-val');
    if (brushSlider && brushVal) {
      brushSlider.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value, 10);
        brushVal.textContent = `${this.brushSize}px`;
      });
    }

    const waterSlider = this.controlsContainer.querySelector('#water-slider');
    const waterVal = this.controlsContainer.querySelector('#water-val');
    if (waterSlider && waterVal) {
      waterSlider.addEventListener('input', (e) => {
        this.waterContent = parseFloat(e.target.value);
        waterVal.textContent = `${Math.round(this.waterContent * 100)}%`;
      });
    }

    const btnClear = this.controlsContainer.querySelector('#btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.clearFresco());
    }

    const btnSpritz = this.controlsContainer.querySelector('#btn-spritz');
    if (btnSpritz) {
      btnSpritz.addEventListener('click', () => this.spritzWater());
    }

    const btnCarbonatize = this.controlsContainer.querySelector('#btn-carbonatize');
    if (btnCarbonatize) {
      btnCarbonatize.addEventListener('click', () => this.accelerateCarbonatization());
    }

    this.updateHUD();
  }

  updateHUD() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const pig = PIGMENTS[this.selectedPigmentKey] || PIGMENTS.PURPURISSUM;
    const formulaVal = this.controlsContainer.querySelector('#mineral-formula');
    if (formulaVal) formulaVal.textContent = pig.formula;

    const humidityVal = this.controlsContainer.querySelector('#humidity-val');
    if (humidityVal) {
      const pct = Math.round(this.intonacoHumidity * 100);
      const state = this.intonacoHumidity > 0.4 ? 'Buon Fresco' : 'Fresco a Secco';
      humidityVal.textContent = `${pct}% (${state})`;
      humidityVal.style.color = this.intonacoHumidity > 0.4 ? '#8bc34a' : '#ff9800';
    }

    const carbVal = this.controlsContainer.querySelector('#carb-val');
    if (carbVal) {
      carbVal.textContent = `${Math.round(this.carbonatizationProgress * 100)}%`;
    }

    const entitiesVal = this.controlsContainer.querySelector('#entities-val');
    if (entitiesVal) {
      entitiesVal.textContent = `${this.getEntityCount()}`;
    }
  }

  // -------------------------------------------------------------------------
  // Preset Fresco Generation (Authentic Roman Motifs)
  // -------------------------------------------------------------------------
  loadPreset(presetName) {
    this.currentPreset = presetName;
    this.clearFresco(false);

    if (presetName === PIGMENTUM_PRESETS.MYSTERIES) {
      this.paintVillaOfTheMysteries();
    } else if (presetName === PIGMENTUM_PRESETS.LIVIA) {
      this.paintGardenOfLivia();
    } else if (presetName === PIGMENTUM_PRESETS.SAPPHO) {
      this.paintSapphoMedallion();
    } else if (presetName === PIGMENTUM_PRESETS.MARINE) {
      this.paintMarineDolphin();
    } else if (presetName === PIGMENTUM_PRESETS.BLANK) {
      // Pristine wet plaster with a few exploratory brush test strokes
      this.paintArtistTrialSwatches();
    }

    this.updateHUD();
  }

  clearFresco(triggerSound = true) {
    this.strokeNodes = [];
    this.colorMixSamplePoints = [];
    this.splatters = [];
    this.intonacoHumidity = 0.95;
    this.carbonatizationProgress = 0.05;

    if (this.frescoCtx) {
      this.frescoCtx.clearRect(0, 0, this.width, this.height);
    }
    if (triggerSound) {
      this.playPlasterTrowelSound();
    }
  }

  spritzWater() {
    this.intonacoHumidity = Math.min(1.0, this.intonacoHumidity + 0.35);
    // Add fine mist splatters across the fresco
    const w = this.width;
    const h = this.height;
    for (let i = 0; i < 60; i++) {
      this.splatters.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.8 + Math.random() * 2.2,
        rgb: [255, 255, 255],
        alpha: 0.25 + Math.random() * 0.3,
        life: 4.0
      });
    }
    this.updateHUD();
  }

  accelerateCarbonatization() {
    this.carbonatizationProgress = Math.min(1.0, this.carbonatizationProgress + 0.4);
    this.intonacoHumidity = Math.max(0.05, this.intonacoHumidity - 0.4);
    this.bakeStrokeNodesToCanvas();
    this.updateHUD();
  }

  // -------------------------------------------------------------------------
  // Procedural Pompeian Motifs Artwork
  // -------------------------------------------------------------------------
  paintVillaOfTheMysteries() {
    const w = this.width;
    const h = this.height;

    // 1. Large Cinnabar Vermilion Panels (Rosso Pompeiano)
    const margin = 40;
    const panelW = (w - margin * 3) / 2;
    const panelH = h - 140;

    // Background dado base in Egyptian Blue
    this.addStrokePath([
      { x: margin, y: h - 50 },
      { x: w - margin, y: h - 50 }
    ], 'CAERULEUM', 34, 0.4);

    // Left Vermilion Panel
    this.addStrokePath([
      { x: margin + panelW * 0.5, y: 70 },
      { x: margin + panelW * 0.5, y: 70 + panelH }
    ], 'CINNABARIS', panelW * 0.85, 0.3);

    // Right Vermilion Panel
    this.addStrokePath([
      { x: margin * 2 + panelW * 1.5, y: 70 },
      { x: margin * 2 + panelW * 1.5, y: 70 + panelH }
    ], 'CINNABARIS', panelW * 0.85, 0.3);

    // Architectural golden ochre cornice & pilaster borders
    this.addStrokePath([
      { x: margin, y: 70 },
      { x: margin + panelW, y: 70 },
      { x: margin + panelW, y: 70 + panelH },
      { x: margin, y: 70 + panelH },
      { x: margin, y: 70 }
    ], 'SIL', 10, 0.25);

    this.addStrokePath([
      { x: margin * 2 + panelW, y: 70 },
      { x: margin * 2 + panelW * 2, y: 70 },
      { x: margin * 2 + panelW * 2, y: 70 + panelH },
      { x: margin * 2 + panelW, y: 70 + panelH },
      { x: margin * 2 + panelW, y: 70 }
    ], 'SIL', 10, 0.25);

    // Central Tyrian Purple imperial drape & laurel wreath
    const cx1 = margin + panelW * 0.5;
    const cy1 = 70 + panelH * 0.45;
    const r = 50;
    const wreathPts = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.3) {
      wreathPts.push({ x: cx1 + Math.cos(a) * r, y: cy1 + Math.sin(a) * r });
    }
    this.addStrokePath(wreathPts, 'CHRYSOCOLLA', 14, 0.3);

    // Tyrian Purple ribbons fluttering from the wreath
    this.addStrokePath([
      { x: cx1, y: cy1 + r },
      { x: cx1 - 25, y: cy1 + r + 35 },
      { x: cx1 - 15, y: cy1 + r + 70 }
    ], 'PURPURISSUM', 9, 0.2);

    this.addStrokePath([
      { x: cx1, y: cy1 + r },
      { x: cx1 + 25, y: cy1 + r + 35 },
      { x: cx1 + 15, y: cy1 + r + 70 }
    ], 'PURPURISSUM', 9, 0.2);

    // Right panel: Golden Thyrsus staff entwined with ivy
    const cx2 = margin * 2 + panelW * 1.5;
    this.addStrokePath([
      { x: cx2, y: 90 },
      { x: cx2, y: 70 + panelH - 30 }
    ], 'SIL', 12, 0.2);

    // Pinecone tip in Tyrian purple & lime white highlight
    this.addStrokePath([
      { x: cx2, y: 80 },
      { x: cx2, y: 70 }
    ], 'PURPURISSUM', 18, 0.15);

    this.addStrokePath([
      { x: cx2 - 3, y: 72 },
      { x: cx2 + 3, y: 72 }
    ], 'PARAETONIUM', 6, 0.1);

    // Overlapping optical color mix evaluation points
    this.seedColorMixSamplePoints();
  }

  paintGardenOfLivia() {
    const w = this.width;
    const h = this.height;

    // Atmospheric Egyptian Blue sky wash
    this.addStrokePath([
      { x: 50, y: 90 },
      { x: w - 50, y: 90 }
    ], 'CAERULEUM', 80, 0.65);

    // Lower marble trellis balustrade in Lime White & Yellow Ochre
    this.addStrokePath([
      { x: 40, y: h - 100 },
      { x: w - 40, y: h - 100 }
    ], 'PARAETONIUM', 32, 0.2);

    this.addStrokePath([
      { x: 40, y: h - 85 },
      { x: w - 40, y: h - 85 }
    ], 'SIL', 10, 0.3);

    // Lush central acanthus scrollwork & laurel branches in Malachite Green
    const branchPoints = [
      { x: w * 0.2, y: h - 110 },
      { x: w * 0.32, y: h * 0.55 },
      { x: w * 0.45, y: h * 0.4 },
      { x: w * 0.55, y: h * 0.35 },
      { x: w * 0.7, y: h * 0.45 },
      { x: w * 0.8, y: h - 110 }
    ];
    this.addStrokePath(branchPoints, 'CHRYSOCOLLA', 22, 0.3);

    // Acanthus leaves radiating outward
    for (let i = 0; i < 16; i++) {
      const u = i / 15;
      const bx = w * 0.2 + u * (w * 0.6);
      const by = h * 0.5 + Math.sin(u * Math.PI) * -120;
      const leafLen = 35 + Math.sin(i * 1.8) * 15;
      const leafAngle = -Math.PI * 0.5 + (u - 0.5) * 1.4;

      this.addStrokePath([
        { x: bx, y: by },
        { x: bx + Math.cos(leafAngle) * leafLen, y: by + Math.sin(leafAngle) * leafLen }
      ], 'CHRYSOCOLLA', 14, 0.35);

      // Pomegranate fruits in fiery Cinnabar & Attic Ochre
      if (i === 3 || i === 7 || i === 12) {
        const px = bx + Math.cos(leafAngle) * (leafLen + 12);
        const py = by + Math.sin(leafAngle) * (leafLen + 12);
        this.addStrokePath([
          { x: px, y: py },
          { x: px, y: py }
        ], 'CINNABARIS', 20, 0.2);

        this.addStrokePath([
          { x: px - 2, y: py - 2 },
          { x: px, y: py - 2 }
        ], 'SIL', 8, 0.25);
      }
    }

    // Perched Roman thrush / songbird atop balustrade in Egyptian Blue & Tyrian Purple
    const birdX = w * 0.65;
    const birdY = h - 125;
    this.addStrokePath([
      { x: birdX, y: birdY },
      { x: birdX + 28, y: birdY - 14 },
      { x: birdX + 45, y: birdY - 8 }
    ], 'CAERULEUM', 16, 0.25);

    this.addStrokePath([
      { x: birdX + 45, y: birdY - 8 },
      { x: birdX + 70, y: birdY + 12 }
    ], 'PURPURISSUM', 10, 0.2);

    this.seedColorMixSamplePoints();
  }

  paintSapphoMedallion() {
    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // Concentric Pompeian roundel medallion frame in Ochre, Cinnabar & Egyptian Blue
    const rOuter = Math.min(w, h) * 0.38;
    const outerRing = [];
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
      outerRing.push({ x: cx + Math.cos(a) * rOuter, y: cy + Math.sin(a) * rOuter });
    }
    this.addStrokePath(outerRing, 'SIL', 26, 0.3);

    const midRing = [];
    const rMid = rOuter - 18;
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
      midRing.push({ x: cx + Math.cos(a) * rMid, y: cy + Math.sin(a) * rMid });
    }
    this.addStrokePath(midRing, 'CINNABARIS', 14, 0.25);

    const innerRing = [];
    const rInner = rMid - 14;
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
      innerRing.push({ x: cx + Math.cos(a) * rInner, y: cy + Math.sin(a) * rInner });
    }
    this.addStrokePath(innerRing, 'CAERULEUM', 10, 0.3);

    // Inner medallion warm stucco background wash
    this.addStrokePath([
      { x: cx, y: cy - 20 },
      { x: cx, y: cy + 20 }
    ], 'PARAETONIUM', rInner * 0.9, 0.6);

    // Sappho silhouette: Tyrian purple tunic & palla
    this.addStrokePath([
      { x: cx - 50, y: cy + 70 },
      { x: cx, y: cy + 40 },
      { x: cx + 60, y: cy + 75 }
    ], 'PURPURISSUM', 38, 0.3);

    // Golden net hair & curls in Sil Atticum
    this.addStrokePath([
      { x: cx - 15, y: cy - 35 },
      { x: cx + 25, y: cy - 45 },
      { x: cx + 35, y: cy - 15 }
    ], 'SIL', 22, 0.25);

    // Face & neck profile in warm Ochre & Lime White blend
    this.addStrokePath([
      { x: cx, y: cy - 30 },
      { x: cx + 18, y: cy - 10 },
      { x: cx + 8, y: cy + 18 }
    ], 'PARAETONIUM', 24, 0.25);

    // Cinnabar lips
    this.addStrokePath([
      { x: cx + 12, y: cy - 2 },
      { x: cx + 15, y: cy - 2 }
    ], 'CINNABARIS', 6, 0.15);

    // Golden stylus raised thoughtfully to lips
    this.addStrokePath([
      { x: cx + 22, y: cy + 16 },
      { x: cx + 16, y: cy }
    ], 'SIL', 5, 0.15);

    // Four-leaved folding wax tablets (pugillares) in left hand
    this.addStrokePath([
      { x: cx - 45, y: cy + 15 },
      { x: cx - 15, y: cy + 25 },
      { x: cx - 20, y: cy + 55 },
      { x: cx - 50, y: cy + 45 },
      { x: cx - 45, y: cy + 15 }
    ], 'SIL', 8, 0.2);

    this.addStrokePath([
      { x: cx - 35, y: cy + 30 },
      { x: cx - 30, y: cy + 45 }
    ], 'ATRAMENTUM', 12, 0.35);

    this.seedColorMixSamplePoints();
  }

  paintMarineDolphin() {
    const w = this.width;
    const h = this.height;

    // Rolling Egyptian Blue marine sea waves
    for (let wave = 0; wave < 4; wave++) {
      const waveY = h * 0.55 + wave * 45;
      const pts = [];
      for (let x = 30; x <= w - 30; x += 30) {
        const y = waveY + Math.sin((x + wave * 90) * 0.02) * 22;
        pts.push({ x, y });
      }
      this.addStrokePath(pts, 'CAERULEUM', 24 - wave * 3, 0.35);

      // Foaming wave crests in Lime White
      const crestPts = pts.filter((_, idx) => idx % 3 === 0);
      crestPts.forEach(pt => {
        this.addStrokePath([
          { x: pt.x - 12, y: pt.y - 8 },
          { x: pt.x + 12, y: pt.y - 8 }
        ], 'PARAETONIUM', 8, 0.2);
      });
    }

    // Leaping Roman Dolphin: Malachite Green spine, Egyptian Blue body, Cinnabar beak
    const cx = w * 0.5;
    const cy = h * 0.38;
    const dolphinSpine = [
      { x: cx - 110, y: cy + 55 },   // Fluke tail
      { x: cx - 60, y: cy },        // Arching back
      { x: cx, y: cy - 35 },        // Dorsal crest
      { x: cx + 65, y: cy - 20 },   // Snout head
      { x: cx + 95, y: cy - 10 }    // Beak
    ];
    this.addStrokePath(dolphinSpine, 'CAERULEUM', 28, 0.3);
    this.addStrokePath(dolphinSpine, 'CHRYSOCOLLA', 14, 0.25);

    // Dolphin fluke tail fins
    this.addStrokePath([
      { x: cx - 110, y: cy + 55 },
      { x: cx - 135, y: cy + 35 }
    ], 'CAERULEUM', 12, 0.25);
    this.addStrokePath([
      { x: cx - 110, y: cy + 55 },
      { x: cx - 130, y: cy + 75 }
    ], 'CAERULEUM', 12, 0.25);

    // Beak & eyes in Cinnabaris vermilion
    this.addStrokePath([
      { x: cx + 85, y: cy - 12 },
      { x: cx + 105, y: cy - 8 }
    ], 'CINNABARIS', 7, 0.15);

    this.addStrokePath([
      { x: cx + 55, y: cy - 25 },
      { x: cx + 55, y: cy - 25 }
    ], 'CINNABARIS', 6, 0.1);

    // Branch of Red Coral in bottom left
    const coralBaseX = 100;
    const coralBaseY = h - 60;
    this.addStrokePath([
      { x: coralBaseX, y: coralBaseY },
      { x: coralBaseX + 25, y: coralBaseY - 50 },
      { x: coralBaseX + 15, y: coralBaseY - 90 }
    ], 'CINNABARIS', 14, 0.2);

    this.addStrokePath([
      { x: coralBaseX + 25, y: coralBaseY - 50 },
      { x: coralBaseX + 55, y: coralBaseY - 80 }
    ], 'CINNABARIS', 10, 0.2);

    this.seedColorMixSamplePoints();
  }

  paintArtistTrialSwatches() {
    const w = this.width;
    const h = this.height;
    const pigmentsList = ['PURPURISSUM', 'CAERULEUM', 'CINNABARIS', 'CHRYSOCOLLA', 'SIL', 'PARAETONIUM'];
    const colStep = (w - 120) / (pigmentsList.length - 1);

    pigmentsList.forEach((pigKey, idx) => {
      const x = 60 + idx * colStep;
      this.addStrokePath([
        { x, y: 120 },
        { x, y: h - 160 }
      ], pigKey, 24, 0.15 + idx * 0.1);
    });

    // Horizontal subtractive optical mixing trial strokes across the vertical swatches
    this.addStrokePath([
      { x: 40, y: h * 0.4 },
      { x: w - 40, y: h * 0.4 }
    ], 'SIL', 20, 0.35);

    this.addStrokePath([
      { x: 40, y: h * 0.65 },
      { x: w - 40, y: h * 0.65 }
    ], 'CAERULEUM', 20, 0.35);

    this.seedColorMixSamplePoints();
  }

  // -------------------------------------------------------------------------
  // Stroke & Entity Management
  // -------------------------------------------------------------------------
  addStrokePath(points, pigmentKey, brushRadius = 18, water = 0.35) {
    if (!points || points.length < 1) return;
    const pig = PIGMENTS[pigmentKey] || PIGMENTS.PURPURISSUM;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / (brushRadius * 0.35)));

      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const x = p1.x + dx * u;
        const y = p1.y + dy * u;

        const node = {
          x,
          y,
          radius: brushRadius,
          pigmentKey,
          pigment: pig,
          water,
          rgb: pig.rgb,
          alpha: Math.max(0.2, 1.0 - water * 0.5),
          wetness: 1.0,
          age: 0,
          seed: Math.random()
        };

        this.strokeNodes.push(node);

        // Micro pigment dispersion particles
        if (Math.random() < 0.25) {
          const spread = brushRadius * (0.8 + water * 0.6);
          const angle = Math.random() * Math.PI * 2;
          this.splatters.push({
            x: x + Math.cos(angle) * spread,
            y: y + Math.sin(angle) * spread,
            radius: 0.7 + Math.random() * 1.8,
            rgb: pig.rgb,
            alpha: 0.3 + Math.random() * 0.4,
            life: 3.5
          });
        }
      }
    }
  }

  seedColorMixSamplePoints() {
    this.colorMixSamplePoints = [];
    const step = 28;
    const w = this.width;
    const h = this.height;

    // Evaluate overlapping pigment interactions on a regular inspection grid
    for (let y = 50; y < h - 50; y += step) {
      for (let x = 50; x < w - 50; x += step) {
        // Find strokes influencing this sample point
        const influencing = [];
        for (let i = 0; i < this.strokeNodes.length; i++) {
          const node = this.strokeNodes[i];
          const dx = node.x - x;
          const dy = node.y - y;
          const distSq = dx * dx + dy * dy;
          const r = node.radius * 1.3;
          if (distSq < r * r) {
            const weight = 1.0 - Math.sqrt(distSq) / r;
            influencing.push({ pigment: node.pigment, weight: weight * (1.0 - node.water * 0.4) });
          }
        }

        if (influencing.length > 0) {
          const mixedRgb = computeKubelkaMunkRgb(influencing, this.waterContent);
          this.colorMixSamplePoints.push({
            x,
            y,
            rgb: mixedRgb,
            count: influencing.length,
            pulse: Math.random() * Math.PI * 2
          });
        }
      }
    }
  }

  // Contract requirement:
  // integer count of wet pigment stroke nodes + color mix sample points
  getEntityCount() {
    return this.strokeNodes.length + this.colorMixSamplePoints.length;
  }

  // -------------------------------------------------------------------------
  // Simulation Update Loop: Absorption, Capillary Bleed & Carbonatization
  // -------------------------------------------------------------------------
  update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;
    dt = Math.min(dt, 0.1);
    this.simTime += dt;

    // 1. Fresco Intonaco moisture evaporation & carbonatization progression
    // Ca(OH)2 + CO2 -> CaCO3 + H2O
    if (this.intonacoHumidity > 0.1) {
      this.intonacoHumidity = Math.max(0.08, this.intonacoHumidity - this.evaporationRate * dt);
      const carbRate = 0.012 * (1.0 - this.intonacoHumidity * 0.4);
      this.carbonatizationProgress = Math.min(1.0, this.carbonatizationProgress + carbRate * dt);
    }

    // 2. Wet pigment stroke nodes capillary absorption and drying
    const maxActiveNodes = 1200;
    if (this.strokeNodes.length > maxActiveNodes) {
      // Bake older crystallized nodes directly into the offscreen fresco canvas
      this.bakeOlderStrokeNodes(this.strokeNodes.length - maxActiveNodes);
    }

    for (let i = 0; i < this.strokeNodes.length; i++) {
      const node = this.strokeNodes[i];
      node.age += dt;

      // When wet and plaster is humid, pigment slowly diffuses outward into the intonaco
      if (node.wetness > 0.05 && this.intonacoHumidity > 0.3) {
        node.radius += 0.8 * dt * node.water;
        node.wetness = Math.max(0.02, node.wetness - (0.05 + this.carbonatizationProgress * 0.1) * dt);
      }
    }

    // 3. Splatter particles decay
    for (let i = this.splatters.length - 1; i >= 0; i--) {
      const sp = this.splatters[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        this.splatters.splice(i, 1);
      }
    }

    // 4. Update HUD values periodically
    if (Math.floor(this.simTime * 4) !== Math.floor((this.simTime - dt) * 4)) {
      this.updateHUD();
    }
  }

  bakeOlderStrokeNodes(count) {
    if (!this.frescoCtx) return;
    const ctx = this.frescoCtx;
    const nodesToBake = this.strokeNodes.splice(0, count);

    for (const node of nodesToBake) {
      this.drawSingleStrokeNode(ctx, node, true);
    }
  }

  bakeStrokeNodesToCanvas() {
    if (!this.frescoCtx || this.strokeNodes.length === 0) return;
    const ctx = this.frescoCtx;
    for (const node of this.strokeNodes) {
      this.drawSingleStrokeNode(ctx, node, true);
    }
    this.strokeNodes = [];
  }

  // -------------------------------------------------------------------------
  // Rendering Pass: Stucco Texture, Wet Intonaco Sheen, Bristles & Pigments
  // -------------------------------------------------------------------------
  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;

    // 1. Draw cached warm Roman lime intonaco wall
    if (this.plasterCanvas) {
      ctx.drawImage(this.plasterCanvas, 0, 0);
    } else {
      ctx.fillStyle = '#f5eee2';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Draw ancient craquelure micro-fissures (darkened in damp intonaco)
    this.renderCraquelure(ctx);

    // 3. Draw permanent baked fresco layers from offscreen canvas
    if (this.frescoCanvas) {
      ctx.drawImage(this.frescoCanvas, 0, 0);
    }

    // 4. Render active wet stroke nodes with Kubelka-Munk optical blending
    this.renderActiveStrokeNodes(ctx);

    // 5. Render pigment splatters and capillary bleeding fringe
    this.renderSplatters(ctx);

    // 6. Wet intonaco specular sheen (fresh buon fresco water glaze)
    this.renderWetPlasterSheen(ctx);

    // 7. Interactive brush cursor & current pigment swatch
    this.renderBrushCursor(ctx);
  }

  drawSingleStrokeNode(ctx, node, isBaked = false) {
    const r = node.radius;
    const rgb = node.rgb;
    // Water dilution creates translucent watercolor-like washes on wet plaster
    const alpha = isBaked ? node.alpha * 0.85 : node.alpha;

    ctx.save();
    const grad = ctx.createRadialGradient(node.x, node.y, r * 0.15, node.x, node.y, r);
    grad.addColorStop(0.0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`);
    grad.addColorStop(0.65, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.7})`);
    grad.addColorStop(1.0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle bristle striations (authentic Roman hog-bristle brush texture)
    if (!isBaked && node.radius > 8) {
      ctx.strokeStyle = `rgba(${Math.max(0, rgb[0] - 25)}, ${Math.max(0, rgb[1] - 25)}, ${Math.max(0, rgb[2] - 25)}, ${alpha * 0.35})`;
      ctx.lineWidth = 1.2;
      for (let b = -2; b <= 2; b++) {
        const off = (b / 2.5) * (r * 0.55);
        ctx.beginPath();
        ctx.arc(node.x + off, node.y + off * 0.3, r * 0.4, 0, Math.PI);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderActiveStrokeNodes(ctx) {
    for (let i = 0; i < this.strokeNodes.length; i++) {
      this.drawSingleStrokeNode(ctx, this.strokeNodes[i], false);
    }
  }

  renderCraquelure(ctx) {
    if (!this.craquelureFissures || this.craquelureFissures.length === 0) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const fiss of this.craquelureFissures) {
      if (!fiss.pts || fiss.pts.length < 2) continue;
      // When plaster is wet, fissures absorb water and appear darker; when dry, softer
      const a = fiss.opacity * (0.8 + this.intonacoHumidity * 0.5);
      ctx.strokeStyle = `rgba(80, 68, 55, ${a})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(fiss.pts[0].x, fiss.pts[0].y);
      for (let i = 1; i < fiss.pts.length; i++) {
        ctx.lineTo(fiss.pts[i].x, fiss.pts[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSplatters(ctx) {
    if (!this.splatters || this.splatters.length === 0) return;
    ctx.save();
    for (const sp of this.splatters) {
      const a = Math.max(0, Math.min(1, sp.alpha * (sp.life / 3.5)));
      ctx.fillStyle = `rgba(${sp.rgb[0]}, ${sp.rgb[1]}, ${sp.rgb[2]}, ${a})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderWetPlasterSheen(ctx) {
    if (this.intonacoHumidity <= 0.25) return;
    const w = this.width;
    const h = this.height;

    // Glossy raking-light specular sheen when intonaco is freshly troweled and wet
    ctx.save();
    const sheenAlpha = (this.intonacoHumidity - 0.25) * 0.12;
    const sheenGrad = ctx.createLinearGradient(0, 0, w * 0.8, h * 0.8);
    sheenGrad.addColorStop(0.0, `rgba(255, 255, 255, ${sheenAlpha})`);
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    sheenGrad.addColorStop(1.0, `rgba(255, 255, 255, ${sheenAlpha * 0.6})`);

    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  renderBrushCursor(ctx) {
    if (!this.lastPaintPos) return;
    const { x, y } = this.lastPaintPos;
    const pig = PIGMENTS[this.selectedPigmentKey] || PIGMENTS.PURPURISSUM;

    ctx.save();
    // Inner active mineral spot
    ctx.fillStyle = pig.colorHex;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer brush radius circle
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)'; // Roman bronze/gold ring
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Interactive Mouse / Pointer Events
  // -------------------------------------------------------------------------
  onMouseDown(pos) {
    if (!pos) return;
    this.isPainting = true;
    this.lastPaintPos = { x: pos.x, y: pos.y };
    this.paintAt(pos.x, pos.y);

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  onMouseMove(pos) {
    if (!pos) return;
    this.lastPaintPos = { x: pos.x, y: pos.y };

    if (this.isPainting) {
      this.paintAt(pos.x, pos.y);
    }
  }

  onMouseUp(pos) {
    this.isPainting = false;
    if (pos) {
      this.lastPaintPos = { x: pos.x, y: pos.y };
    }
  }

  paintAt(x, y) {
    const pig = PIGMENTS[this.selectedPigmentKey] || PIGMENTS.PURPURISSUM;
    const node = {
      x,
      y,
      radius: this.brushSize,
      pigmentKey: this.selectedPigmentKey,
      pigment: pig,
      water: this.waterContent,
      rgb: pig.rgb,
      alpha: Math.max(0.25, 1.0 - this.waterContent * 0.5),
      wetness: 1.0,
      age: 0,
      seed: Math.random()
    };

    this.strokeNodes.push(node);

    // Audio feedback
    this.playBrushSound(this.brushSize / 25);

    // Capillary micro-spatters
    if (Math.random() < 0.35) {
      const spread = this.brushSize * (0.8 + this.waterContent * 0.8);
      const angle = Math.random() * Math.PI * 2;
      this.splatters.push({
        x: x + Math.cos(angle) * spread,
        y: y + Math.sin(angle) * spread,
        radius: 0.8 + Math.random() * 2.0,
        rgb: pig.rgb,
        alpha: 0.3 + Math.random() * 0.4,
        life: 3.5
      });
    }

    // Evaluate color mix sample points near this stroke
    this.updateNearbyColorMixPoints(x, y, this.brushSize * 1.5);
  }

  updateNearbyColorMixPoints(cx, cy, radius) {
    const rSq = radius * radius;
    // Find or add sample point
    let found = false;
    for (let i = 0; i < this.colorMixSamplePoints.length; i++) {
      const pt = this.colorMixSamplePoints[i];
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      if (dx * dx + dy * dy < rSq) {
        found = true;
        // Re-evaluate mix
        const nearbyNodes = this.strokeNodes.filter(n => {
          const ddx = n.x - pt.x;
          const ddy = n.y - pt.y;
          return (ddx * ddx + ddy * ddy) < (n.radius * 1.4) * (n.radius * 1.4);
        });
        if (nearbyNodes.length > 0) {
          const fractions = nearbyNodes.map(n => ({ pigment: n.pigment, weight: 1.0 - n.water * 0.4 }));
          pt.rgb = computeKubelkaMunkRgb(fractions, this.waterContent);
          pt.count = nearbyNodes.length;
        }
      }
    }

    if (!found && this.colorMixSamplePoints.length < 500) {
      this.colorMixSamplePoints.push({
        x: cx,
        y: cy,
        rgb: PIGMENTS[this.selectedPigmentKey].rgb,
        count: 1,
        pulse: 0
      });
    }
  }

  // -------------------------------------------------------------------------
  // Keyboard Shortcuts
  // -------------------------------------------------------------------------
  onKeyDown(key, e) {
    if (!key) return;
    const lower = key.toLowerCase();

    if (lower === '1') {
      this.selectPigment('PURPURISSUM');
    } else if (lower === '2') {
      this.selectPigment('CAERULEUM');
    } else if (lower === '3') {
      this.selectPigment('CINNABARIS');
    } else if (lower === '4') {
      this.selectPigment('CHRYSOCOLLA');
    } else if (lower === '5') {
      this.selectPigment('SIL');
    } else if (lower === '6') {
      this.selectPigment('PARAETONIUM');
    } else if (lower === 'c') {
      this.clearFresco();
    } else if (lower === 'r') {
      this.reset();
    } else if (lower === ' ') {
      this.spritzWater();
      if (e && e.preventDefault) e.preventDefault();
    } else if (lower === '[') {
      this.brushSize = Math.max(4, this.brushSize - 4);
      this.updateHUD();
    } else if (lower === ']') {
      this.brushSize = Math.min(60, this.brushSize + 4);
      this.updateHUD();
    }
  }

  selectPigment(pigKey) {
    if (!PIGMENTS[pigKey]) return;
    this.selectedPigmentKey = pigKey;
    if (this.controlsContainer && typeof document !== 'undefined') {
      const btns = this.controlsContainer.querySelectorAll('#pigment-selector button');
      btns.forEach(b => {
        if (b.dataset.pigment === pigKey) b.classList.add('active');
        else b.classList.remove('active');
      });
    }
    this.updateHUD();
  }

  // -------------------------------------------------------------------------
  // Lifecycle Requirements
  // -------------------------------------------------------------------------
  resize(width, height, dpr = 1) {
    this.width = width || 800;
    this.height = height || 600;
    this.dpr = dpr || 1;

    this.initWallSurfaces();
    this.loadPreset(this.currentPreset);
  }

  reset() {
    this.loadPreset(this.currentPreset);
  }

  destroy() {
    this.strokeNodes = [];
    this.colorMixSamplePoints = [];
    this.splatters = [];
    this.craquelureFissures = [];
    this.marbleSparkles = [];

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}
