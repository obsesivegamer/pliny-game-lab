// Terrae Motus: Seismic Dynamics & Roman Structural Seismology Engine
// Grounded in Pliny the Elder's Naturalis Historia (Book II: Earthquakes and Chasmata)
// Simulates elastodynamic P/S-wave propagation, stick-slip tectonic fault slip,
// and resonance collapse of monumental Roman architecture.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class TerraeMotusEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 1200;
    this.height = canvas.height || 800;
    this.dpr = 1;

    // Viewport layout: split view (surface architecture vs subterranean bedrock)
    this.surfaceRatio = 0.44;
    this.groundY = Math.floor(this.height * this.surfaceRatio);

    // Simulation parameters
    this.stressRate = 0.25; // Tectonic stress accumulation rate (MPa/s)
    this.magnitude = 6.8; // Richter scale magnitude (3.0 to 9.0)
    this.hypocenterDepthKm = 15; // Depth in km (5 to 30 km)

    // Tectonic fault state
    this.tectonicStress = 0.35; // Current accumulated stress [0, 1]
    this.faultRupturing = false;
    this.ruptureProgress = 0;
    this.ruptureDuration = 0.8; // Seconds
    this.faultSlipOffset = 0; // Cumulative visual fault offset
    this.targetSlipOffset = 0;

    // Elastodynamic wave grid (P-waves and S-waves)
    this.gridW = 90;
    this.gridH = 45;
    this.waveNodesCount = this.gridW * this.gridH;

    // Wave potential fields (P = compressional potential, S = shear potential)
    this.pWave = new Float32Array(this.waveNodesCount);
    this.pWavePrev = new Float32Array(this.waveNodesCount);
    this.sWave = new Float32Array(this.waveNodesCount);
    this.sWavePrev = new Float32Array(this.waveNodesCount);

    // Medium velocity profiles by depth (stratified rock layers)
    this.vpProfile = new Float32Array(this.gridH);
    this.vsProfile = new Float32Array(this.gridH);
    this.initVelocityProfiles();

    // Fault geometry across subsurface grid
    this.initFaultGeometry();

    // Surface wave field & ground motion
    this.surfaceDispX = new Float32Array(this.gridW);
    this.surfaceDispY = new Float32Array(this.gridW);
    this.surfaceVelX = new Float32Array(this.gridW);
    this.surfaceVelY = new Float32Array(this.gridW);

    // Accelerogram telemetry buffer
    this.seismoBufferSize = 260;
    this.accelBuffer = new Float32Array(this.seismoBufferSize);
    this.seismoHead = 0;
    this.currentPGA = 0; // Peak Ground Acceleration in g
    this.seismicPhase = 'QUIESCENT';

    // Roman Architecture & Rigid Block Physics
    this.activePreset = 'Basilica Colonnade'; // 'Basilica Colonnade' | 'Two-Tier Aqueduct' | 'Temple of Jupiter'
    this.blocks = [];
    this.dustParticles = [];
    this.maxParticles = 350;

    // User interaction state
    this.isDragging = false;
    this.dragTarget = null;
    this.mousePos = { x: 0, y: 0 };
    this.uiElements = [];

    // Initialize simulation & DOM controls
    this.initControls();
    this.buildPreset(this.activePreset);
    attachTouchBridge(this, canvas);
  }

  // ==========================================
  // VELOCITY PROFILES & GEOLOGICAL STRATIFICATION
  // ==========================================
  initVelocityProfiles() {
    // Stratified geological layers:
    // 0 -> 0.28: Alluvium / Pozzolanic volcanic ash (low velocity, high amplification)
    // 0.28 -> 0.65: Sedimentary Limestone / Travertine
    // 0.65 -> 1.0: Dense Basaltic / Metamorphic Basement
    for (let j = 0; j < this.gridH; j++) {
      const depthFrac = j / (this.gridH - 1);
      let vp;
      if (depthFrac < 0.28) {
        vp = 260 + depthFrac * 180; // 260 - 310 px/s
      } else if (depthFrac < 0.65) {
        vp = 330 + (depthFrac - 0.28) * 220; // 330 - 410 px/s
      } else {
        vp = 440 + (depthFrac - 0.65) * 200; // 440 - 510 px/s
      }
      this.vpProfile[j] = vp;
      // In elastic Poisson solid: Vs = Vp / sqrt(3) ~ 0.577 * Vp
      this.vsProfile[j] = vp * 0.58;
    }
  }

  initFaultGeometry() {
    // Fault trace coordinates in subsurface pixel space:
    // Dipping planar fault (~62 degrees) from surface to deep crust
    this.faultSurfaceX = this.width * 0.28;
    this.faultSurfaceY = this.groundY;
    this.faultDeepX = this.width * 0.72;
    this.faultDeepY = this.height - 15;

    this.updateHypocenter();
  }

  updateHypocenter() {
    // Map hypocenter depth (5km to 30km) along the fault plane
    const depthT = (this.hypocenterDepthKm - 5) / 25; // [0, 1]
    this.hypoX = this.faultSurfaceX + depthT * (this.faultDeepX - this.faultSurfaceX);
    this.hypoY = this.faultSurfaceY + depthT * (this.faultDeepY - this.faultSurfaceY);

    // Corresponding grid cell indices
    this.hypoGridI = Math.min(
      this.gridW - 2,
      Math.max(1, Math.floor((this.hypoX / this.width) * this.gridW))
    );
    const subH = Math.max(10, this.height - this.groundY);
    this.hypoGridJ = Math.min(
      this.gridH - 2,
      Math.max(1, Math.floor(((this.hypoY - this.groundY) / subH) * this.gridH))
    );
  }

  // ==========================================
  // DOM CONTROLS BUILDER
  // ==========================================
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.controlsContainer.style.color = '#fff';
    this.controlsContainer.style.fontFamily = 'monospace';

    // Preset selector buttons
    const presetGroup = document.createElement('div');
    presetGroup.className = 'control-group';
    presetGroup.innerHTML = `<label>Roman Architecture Preset</label>`;
    const btnGrid = document.createElement('div');
    btnGrid.className = 'control-btn-grid';

    const presets = ['Basilica Colonnade', 'Two-Tier Aqueduct', 'Temple of Jupiter'];
    presets.forEach((name) => {
      const btn = document.createElement('button');
      btn.className = `sub-btn ${name === this.activePreset ? 'active' : ''}`;
      btn.textContent = name;
      btn.addEventListener('click', () => {
        btnGrid.querySelectorAll('.sub-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activePreset = name;
        this.buildPreset(name);
      });
      btnGrid.appendChild(btn);
    });
    presetGroup.appendChild(btnGrid);
    this.controlsContainer.appendChild(presetGroup);

    // Slider: Tectonic Stress Rate
    this.addSlider(
      'Tectonic Stress Accumulation Rate',
      0.05,
      1.0,
      0.05,
      this.stressRate,
      (val) => `${val.toFixed(2)} MPa/s`,
      (val) => {
        this.stressRate = val;
      }
    );

    // Slider: Earthquake Richter Magnitude (3.0 to 9.0)
    this.addSlider(
      'Earthquake Richter Magnitude',
      3.0,
      9.0,
      0.1,
      this.magnitude,
      (val) => `M ${val.toFixed(1)}`,
      (val) => {
        this.magnitude = val;
      }
    );

    // Slider: Hypocenter Depth
    this.addSlider(
      'Hypocenter Depth',
      5,
      30,
      1,
      this.hypocenterDepthKm,
      (val) => `${val} km`,
      (val) => {
        this.hypocenterDepthKm = val;
        this.updateHypocenter();
      }
    );

    // Action Buttons
    const actionGroup = document.createElement('div');
    actionGroup.className = 'control-group';
    actionGroup.style.marginTop = '10px';
    actionGroup.style.display = 'flex';
    actionGroup.style.flexDirection = 'column';
    actionGroup.style.gap = '8px';

    const ruptureBtn = document.createElement('button');
    ruptureBtn.className = 'sub-btn';
    ruptureBtn.style.background = 'rgba(200, 50, 50, 0.3)';
    ruptureBtn.style.borderColor = 'var(--accent-crimson, #c83232)';
    ruptureBtn.style.color = '#ff8080';
    ruptureBtn.style.fontWeight = 'bold';
    ruptureBtn.style.padding = '8px';
    ruptureBtn.textContent = '⚡ TRIGGER FAULT RUPTURE';
    ruptureBtn.addEventListener('click', () => {
      this.triggerFaultRupture();
    });
    actionGroup.appendChild(ruptureBtn);

    const rebuildBtn = document.createElement('button');
    rebuildBtn.className = 'sub-btn';
    rebuildBtn.style.borderColor = 'var(--accent-gold, #d4af37)';
    rebuildBtn.style.padding = '8px';
    rebuildBtn.textContent = '🏛️ Rebuild Roman Colonnade';
    rebuildBtn.addEventListener('click', () => {
      this.buildPreset(this.activePreset);
    });
    actionGroup.appendChild(rebuildBtn);

    this.controlsContainer.appendChild(actionGroup);
  }

  addSlider(title, min, max, step, initialVal, formatFn, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'control-group';

    const lbl = document.createElement('label');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    const valSpan = document.createElement('span');
    valSpan.textContent = formatFn(initialVal);
    lbl.appendChild(titleSpan);
    lbl.appendChild(valSpan);

    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = min;
    inp.max = max;
    inp.step = step;
    inp.value = initialVal;
    inp.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valSpan.textContent = formatFn(val);
      onChange(val);
    });

    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    this.controlsContainer.appendChild(wrap);
  }

  // ==========================================
  // ARCHITECTURAL STRUCTURE PRESETS
  // ==========================================
  buildPreset(name) {
    this.blocks = [];
    this.dustParticles = [];
    this.activePreset = name;

    const gY = this.groundY;
    const cX = this.width * 0.52; // Centered on ground above epicenter

    if (name === 'Basilica Colonnade') {
      this.buildBasilicaColonnade(cX, gY);
    } else if (name === 'Two-Tier Aqueduct') {
      this.buildTwoTierAqueduct(cX, gY);
    } else {
      this.buildTempleOfJupiter(cX, gY);
    }
  }

  // 1. Basilica Colonnade: Stepped crepidoma base, 5 fluted column stacks, capitals, lintels & pediment
  buildBasilicaColonnade(cx, gy) {
    // Stylobate foundations (pinned/anchored to ground surface)
    const baseW = 540;
    const baseH = 14;
    for (let step = 0; step < 2; step++) {
      const sw = baseW - step * 30;
      const sy = gy - baseH * 0.5 - step * baseH;
      this.addBlock({
        x: cx,
        y: sy,
        w: sw,
        h: baseH,
        type: 'stylobate',
        isFoundation: true,
        mass: 5000,
        color: '#b8b2a5'
      });
    }

    const colonnadeY = gy - baseH * 2;
    const numCols = 5;
    const colSpacing = 100;
    const startX = cx - ((numCols - 1) * colSpacing) * 0.5;

    const drumW = 26;
    const drumH = 22;
    const drumsPerCol = 6;

    for (let c = 0; c < numCols; c++) {
      const colX = startX + c * colSpacing;

      // Base plinth
      this.addBlock({
        x: colX,
        y: colonnadeY - 8,
        w: drumW + 8,
        h: 16,
        type: 'plinth',
        mass: 120,
        color: '#cfc9be'
      });

      // Stacked column drums
      for (let d = 0; d < drumsPerCol; d++) {
        const dy = colonnadeY - 16 - drumH * 0.5 - d * drumH;
        this.addBlock({
          x: colX,
          y: dy,
          w: drumW,
          h: drumH,
          type: 'drum',
          colIndex: c,
          drumIndex: d,
          mass: 75,
          color: d % 2 === 0 ? '#ded8cd' : '#d5cfc4'
        });
      }

      // Corinthian / Tuscan Capital
      const capY = colonnadeY - 16 - drumsPerCol * drumH - 10;
      this.addBlock({
        x: colX,
        y: capY,
        w: drumW + 10,
        h: 20,
        type: 'capital',
        mass: 90,
        color: '#e4dfd5'
      });
    }

    // Horizontal Architrave / Epistyle lintels spanning column pairs
    const lintelY = colonnadeY - 16 - drumsPerCol * drumH - 20 - 9;
    const lintelW = colSpacing + 12;
    const lintelH = 18;

    for (let c = 0; c < numCols - 1; c++) {
      const lx = startX + (c + 0.5) * colSpacing;
      this.addBlock({
        x: lx,
        y: lintelY,
        w: lintelW,
        h: lintelH,
        type: 'lintel',
        mass: 160,
        color: '#d6d0c4'
      });
    }

    // Frieze & Cornice beam
    const friezeY = lintelY - lintelH * 0.5 - 9;
    this.addBlock({
      x: cx,
      y: friezeY,
      w: (numCols - 1) * colSpacing + 40,
      h: 18,
      type: 'frieze',
      mass: 450,
      color: '#cbc4b7'
    });

    // Triangular Pediment roof gable (tympanum masonry blocks)
    const pedimentY = friezeY - 9;
    const pedLayers = 3;
    for (let layer = 0; layer < pedLayers; layer++) {
      const pw = ((numCols - 1) * colSpacing + 30) * (1 - layer * 0.28);
      const ph = 14;
      this.addBlock({
        x: cx,
        y: pedimentY - ph * 0.5 - layer * ph,
        w: pw,
        h: ph,
        type: 'pediment',
        mass: 220 - layer * 40,
        color: '#e2dcd0'
      });
    }
  }

  // 2. Two-Tier Aqueduct: Lower piers, lower semicircular arches (voussoirs + keystone),
  // intermediate cornice, upper arcade, and top specus conduit.
  buildTwoTierAqueduct(cx, gy) {
    const numPiers = 4;
    const pierSpacing = 130;
    const startX = cx - ((numPiers - 1) * pierSpacing) * 0.5;

    // Foundation blocks
    this.addBlock({
      x: cx,
      y: gy - 7,
      w: (numPiers - 1) * pierSpacing + 120,
      h: 14,
      type: 'stylobate',
      isFoundation: true,
      mass: 6000,
      color: '#9e978b'
    });

    // Lower Tier: Massive square stone piers
    const lowerPierW = 38;
    const lowerPierH = 75;
    const lowerDeckY = gy - 14 - lowerPierH;

    for (let i = 0; i < numPiers; i++) {
      const px = startX + i * pierSpacing;
      // 3 vertically stacked blocks per lower pier
      for (let b = 0; b < 3; b++) {
        const bh = lowerPierH / 3;
        this.addBlock({
          x: px,
          y: gy - 14 - bh * 0.5 - b * bh,
          w: lowerPierW,
          h: bh - 1,
          type: 'pier_lower',
          mass: 160,
          color: '#c2bcb0'
        });
      }
    }

    // Lower Tier Semicircular Arches between piers (voussoirs + keystone)
    for (let i = 0; i < numPiers - 1; i++) {
      const p1x = startX + i * pierSpacing;
      const p2x = startX + (i + 1) * pierSpacing;
      const spanCx = (p1x + p2x) * 0.5;
      const archR = pierSpacing * 0.44;

      // 5 radial voussoir blocks + 1 central keystone
      const numVoussoirs = 5;
      for (let v = 0; v < numVoussoirs; v++) {
        const t = (v + 0.5) / numVoussoirs; // [0, 1]
        const angle = Math.PI * (0.85 - t * 0.7); // Semicircle arch curve
        const vx = spanCx + Math.cos(angle) * archR;
        const vy = lowerDeckY + 22 - Math.sin(angle) * (archR * 0.55);
        const isKey = v === Math.floor(numVoussoirs / 2);

        this.addBlock({
          x: vx,
          y: vy,
          w: isKey ? 22 : 18,
          h: isKey ? 20 : 16,
          type: isKey ? 'keystone' : 'voussoir',
          mass: isKey ? 80 : 60,
          color: isKey ? '#eddac2' : '#d2cbc0'
        });
      }
    }

    // Mid-tier horizontal cornice course
    const midCorniceY = lowerDeckY - 8;
    const midDeckW = (numPiers - 1) * pierSpacing + 90;
    this.addBlock({
      x: cx,
      y: midCorniceY,
      w: midDeckW,
      h: 16,
      type: 'mid_deck',
      mass: 500,
      color: '#b5ada0'
    });

    // Upper Tier: Smaller arcade piers & arches
    const upperPiers = 7;
    const upperSpacing = midDeckW / (upperPiers + 0.2);
    const upperStartX = cx - ((upperPiers - 1) * upperSpacing) * 0.5;
    const upperPierH = 45;
    const upperPierW = 20;

    for (let i = 0; i < upperPiers; i++) {
      const upx = upperStartX + i * upperSpacing;
      this.addBlock({
        x: upx,
        y: midCorniceY - 8 - upperPierH * 0.5,
        w: upperPierW,
        h: upperPierH,
        type: 'pier_upper',
        mass: 70,
        color: '#cfc8bd'
      });
    }

    // Upper lintels & Specus (Water conduit channel)
    const specusY = midCorniceY - 8 - upperPierH - 10;
    this.addBlock({
      x: cx,
      y: specusY,
      w: midDeckW + 10,
      h: 20,
      type: 'specus',
      mass: 420,
      color: '#ded8cd'
    });
  }

  // 3. Temple of Jupiter: Grand Capitoline podium, monumental front steps,
  // 6 columns with capitals, frieze, and heavy pediment with tympanum relief
  buildTempleOfJupiter(cx, gy) {
    // Grand raised podium
    const podW = 500;
    const podH = 34;
    this.addBlock({
      x: cx + 25,
      y: gy - podH * 0.5,
      w: podW,
      h: podH,
      type: 'podium',
      isFoundation: true,
      mass: 9000,
      color: '#9e9688'
    });

    // Ceremonial front steps
    for (let s = 0; s < 4; s++) {
      const sw = 90 - s * 16;
      const sh = podH / 4;
      this.addBlock({
        x: cx - podW * 0.5 + 25 - sw * 0.5,
        y: gy - sh * 0.5 - s * sh,
        w: sw,
        h: sh,
        type: 'steps',
        isFoundation: true,
        mass: 800,
        color: '#b0a99c'
      });
    }

    // Back cella wall (solid masonry stack)
    const cellaX = cx + podW * 0.3;
    const cellaH = 135;
    const cellaW = 85;
    for (let l = 0; l < 4; l++) {
      const lh = cellaH / 4;
      this.addBlock({
        x: cellaX,
        y: gy - podH - lh * 0.5 - l * lh,
        w: cellaW,
        h: lh - 1,
        type: 'cella',
        mass: 320,
        color: '#bbb4a7'
      });
    }

    // Hexastyle portico (6 grand columns)
    const numCols = 5;
    const colSpacing = 68;
    const startX = cx - podW * 0.42 + 40;
    const drumW = 24;
    const drumH = 20;
    const drumsPerCol = 6;
    const colBaseY = gy - podH;

    for (let c = 0; c < numCols; c++) {
      const colX = startX + c * colSpacing;

      // Base torus
      this.addBlock({
        x: colX,
        y: colBaseY - 6,
        w: drumW + 6,
        h: 12,
        type: 'plinth',
        mass: 90,
        color: '#cdc6bb'
      });

      // Drums
      for (let d = 0; d < drumsPerCol; d++) {
        this.addBlock({
          x: colX,
          y: colBaseY - 12 - drumH * 0.5 - d * drumH,
          w: drumW,
          h: drumH,
          type: 'drum',
          mass: 70,
          color: d % 2 === 0 ? '#ded7cc' : '#d4cdc1'
        });
      }

      // Corinthian Capital
      const capY = colBaseY - 12 - drumsPerCol * drumH - 9;
      this.addBlock({
        x: colX,
        y: capY,
        w: drumW + 8,
        h: 18,
        type: 'capital',
        mass: 85,
        color: '#e7e2d7'
      });
    }

    // Entablature lintels
    const entablatureY = colBaseY - 12 - drumsPerCol * drumH - 18 - 8;
    const entW = (numCols - 1) * colSpacing + 40;
    this.addBlock({
      x: startX + ((numCols - 1) * colSpacing) * 0.5,
      y: entablatureY,
      w: entW,
      h: 16,
      type: 'lintel',
      mass: 340,
      color: '#dcd6ca'
    });

    // Heavy Frieze and Roof Pediment
    const friezeY = entablatureY - 8 - 7;
    this.addBlock({
      x: cx - 30,
      y: friezeY,
      w: entW + 120,
      h: 14,
      type: 'frieze',
      mass: 550,
      color: '#cfc9be'
    });

    // Monumental Pediment Gable
    for (let p = 0; p < 3; p++) {
      const pw = (entW + 100) * (1 - p * 0.32);
      this.addBlock({
        x: cx - 30,
        y: friezeY - 7 - 7 - p * 14,
        w: pw,
        h: 14,
        type: 'pediment',
        mass: 300 - p * 60,
        color: '#e2dcd1'
      });
    }
  }

  addBlock(opts) {
    const hw = opts.w * 0.5;
    const hh = opts.h * 0.5;
    const mass = opts.mass || opts.w * opts.h * 0.1;
    const inertia = (1 / 12) * mass * (opts.w * opts.w + opts.h * opts.h);

    const block = {
      x: opts.x,
      y: opts.y,
      initX: opts.x,
      initY: opts.y,
      vx: 0,
      vy: 0,
      angle: 0,
      omega: 0,
      w: opts.w,
      h: opts.h,
      hw: hw,
      hh: hh,
      type: opts.type || 'block',
      isFoundation: !!opts.isFoundation,
      mass: mass,
      invMass: opts.isFoundation ? 0 : 1 / mass,
      inertia: inertia,
      invInertia: opts.isFoundation ? 0 : 1 / inertia,
      friction: 0.62,
      restitution: 0.15,
      color: opts.color || '#ded7cc',
      stress: 0, // Shear stress scalar [0, 1]
      cracked: false,
      cracks: [],
      rubble: false
    };

    this.blocks.push(block);
    return block;
  }

  // ==========================================
  // FAULT RUPTURE & SEISMIC DYNAMICS
  // ==========================================
  triggerFaultRupture() {
    this.faultRupturing = true;
    this.ruptureProgress = 0;
    // Energy scales exponentially with Richter magnitude: E ~ 10^(1.5 * M)
    const relE = Math.pow(10, 1.5 * (this.magnitude - 4.5));
    this.ruptureEnergy = Math.min(2500, Math.max(8, relE * 0.008));
    this.ruptureDuration = 0.5 + Math.min(2.5, (this.magnitude - 3.0) * 0.35);

    // Dynamic slip offset on fault
    this.targetSlipOffset = Math.min(30, (this.magnitude - 3.0) * 4.0);

    // Initial sharp P-wave pulse at hypocenter
    this.injectWavePulse();
  }

  injectWavePulse() {
    const hi = this.hypoGridI;
    const hj = this.hypoGridJ;
    const energy = this.ruptureEnergy;

    // P-wave source: Quadrupole dilatational/compressional radiation
    // High frequency, longitudinal motion
    const radius = 2;
    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        const ni = hi + di;
        const nj = hj + dj;
        if (ni > 0 && ni < this.gridW - 1 && nj > 0 && nj < this.gridH - 1) {
          const idx = nj * this.gridW + ni;
          const r = Math.sqrt(di * di + dj * dj);
          if (r <= radius) {
            const factor = Math.cos((r / radius) * Math.PI * 0.5);
            // Radiation pattern sin(2*theta)
            const theta = Math.atan2(dj, di);
            const radP = Math.sin(2 * theta);
            this.pWave[idx] += energy * 0.45 * factor * (radP !== 0 ? radP : 1.0);

            // S-wave source: Strong transverse shear pulse cos(2*theta)
            const radS = Math.cos(2 * theta);
            this.sWave[idx] += energy * 0.85 * factor * (radS !== 0 ? radS : 1.0);
          }
        }
      }
    }
  }

  // ==========================================
  // ELASTODYNAMIC 2D FINITE-DIFFERENCE SOLVER
  // ==========================================
  stepWaveField(dt) {
    const gw = this.gridW;
    const gh = this.gridH;
    const dx = this.width / gw;
    const subH = Math.max(10, this.height - this.groundY);
    const dy = subH / gh;
    const invDx2 = 1 / (dx * dx);
    const invDy2 = 1 / (dy * dy);

    // 2 sub-steps for CFL stability
    const subSteps = 2;
    const sdt = dt / subSteps;

    for (let step = 0; step < subSteps; step++) {
      // Step P-wave (compressional) & S-wave (shear) fields
      for (let j = 1; j < gh - 1; j++) {
        const vp = this.vpProfile[j];
        const vs = this.vsProfile[j];
        const c2P = vp * vp * (sdt * sdt);
        const c2S = vs * vs * (sdt * sdt);

        // Cerjan damping boundary zone (sponge layer) on left, right, bottom edges
        let damping = 0.994;
        if (j > gh - 8) damping *= 1 - ((j - (gh - 8)) / 8) * 0.08;

        for (let i = 1; i < gw - 1; i++) {
          let edgeDamp = damping;
          if (i < 8) edgeDamp *= 1 - ((8 - i) / 8) * 0.08;
          if (i > gw - 9) edgeDamp *= 1 - ((i - (gw - 9)) / 8) * 0.08;

          const idx = j * gw + i;

          // 2D 5-point discrete Laplacian operator
          const pC = this.pWave[idx];
          const lapP =
            (this.pWave[idx + 1] + this.pWave[idx - 1] - 2 * pC) * invDx2 +
            (this.pWave[idx + gw] + this.pWave[idx - gw] - 2 * pC) * invDy2;

          const nextP = (2 * pC - this.pWavePrev[idx] + c2P * lapP) * edgeDamp;
          this.pWavePrev[idx] = pC;
          this.pWave[idx] = nextP;

          const sC = this.sWave[idx];
          const lapS =
            (this.sWave[idx + 1] + this.sWave[idx - 1] - 2 * sC) * invDx2 +
            (this.sWave[idx + gw] + this.sWave[idx - gw] - 2 * sC) * invDy2;

          const nextS = (2 * sC - this.sWavePrev[idx] + c2S * lapS) * edgeDamp;
          this.sWavePrev[idx] = sC;
          this.sWave[idx] = nextS;
        }
      }

      // Free-surface boundary condition at j = 0 (ground level)
      // Surface wave reflection: doubles displacement and generates Rayleigh surface wave motion
      for (let i = 1; i < gw - 1; i++) {
        this.pWave[i] = this.pWave[gw + i];
        this.sWave[i] = this.sWave[gw + i];
      }
    }

    // Synthesize surface ground displacement & velocity fields from surface waves
    for (let i = 1; i < gw - 1; i++) {
      const idx = gw + i;
      // Longitudinal P-wave gradient + Transverse S-wave shear
      const dPdx = (this.pWave[idx + 1] - this.pWave[idx - 1]) / (2 * dx);
      const dSdy = (this.sWave[2 * gw + i] - this.sWave[i]) / (2 * dy);
      const dPdy = (this.pWave[2 * gw + i] - this.pWave[i]) / (2 * dy);
      const dSdx = (this.sWave[idx + 1] - this.sWave[idx - 1]) / (2 * dx);

      // Horizontal displacement Ux = dP/dx + dS/dy
      // Vertical displacement Uy = dP/dy - dS/dx
      const scale = 0.045;
      const targetUx = (dPdx * 12 + dSdy * 24) * scale;
      const targetUy = (dPdy * 8 - dSdx * 18) * scale;

      this.surfaceVelX[i] = (targetUx - this.surfaceDispX[i]) / dt;
      this.surfaceVelY[i] = (targetUy - this.surfaceDispY[i]) / dt;
      this.surfaceDispX[i] = targetUx;
      this.surfaceDispY[i] = targetUy;
    }
  }

  // ==========================================
  // SIMULATION UPDATE LOOP
  // ==========================================
  update(dt) {
    const clampedDt = Math.min(dt, 0.033);

    // 1. Tectonic Stress Accumulation (Stick-Slip Friction Mechanics)
    if (!this.faultRupturing) {
      this.tectonicStress += this.stressRate * clampedDt * 0.04;
      if (this.tectonicStress >= 1.0) {
        // Natural stick-slip fault slip trigger
        this.triggerFaultRupture();
      }
    } else {
      // Rupture in progress
      this.ruptureProgress += clampedDt / this.ruptureDuration;

      // Continuous rupture energy injection along fault plane
      if (this.ruptureProgress < 0.6) {
        this.injectWavePulse();
      }

      // Dynamic fault slip offset animation
      this.faultSlipOffset +=
        (this.targetSlipOffset - this.faultSlipOffset) * clampedDt * 6.0;

      if (this.ruptureProgress >= 1.0) {
        this.faultRupturing = false;
        this.tectonicStress = 0.05; // Drop to residual stress after rupture
        this.ruptureProgress = 0;
      }
    }

    // 2. Elastodynamic wave propagation step
    this.stepWaveField(clampedDt);

    // 3. Foundation shaking & ground acceleration readout
    const centerIdx = Math.floor(this.gridW * 0.52);
    const gAccX = (this.surfaceVelX[centerIdx] - (this.lastVelX || 0)) / clampedDt;
    this.lastVelX = this.surfaceVelX[centerIdx];

    // Convert to ground acceleration in units of g (9.81 m/s^2 equivalent)
    const accelG = Math.abs(gAccX) * 0.035;
    this.currentPGA = Math.max(this.currentPGA * 0.96, accelG);

    // Update accelerogram rolling buffer
    this.accelBuffer[this.seismoHead] = gAccX * 0.035;
    this.seismoHead = (this.seismoHead + 1) % this.seismoBufferSize;

    // Determine current seismic phase for telemetry
    if (this.currentPGA < 0.04) {
      this.seismicPhase = 'QUIESCENT';
    } else if (this.currentPGA < 0.25) {
      this.seismicPhase = 'P-WAVE TREMOR (HIGH FREQ)';
    } else if (this.currentPGA < 0.7) {
      this.seismicPhase = 'S-WAVE VIOLENT SHEAR';
    } else {
      this.seismicPhase = 'CATASTROPHIC RESONANCE COLLAPSE';
    }

    // 4. Rigid body dynamics for Roman stone blocks
    this.updateBlocks(clampedDt, gAccX);

    // 5. Dust and rubble particle physics
    this.updateParticles(clampedDt);
  }

  // ==========================================
  // RIGID BLOCK DYNAMICS & CONTACT MANIFOLDS
  // ==========================================
  updateBlocks(dt, groundAccX) {
    const gravity = 550; // px/s^2
    const gw = this.gridW;

    // Apply forces & base motion
    for (const block of this.blocks) {
      if (block.isFoundation) {
        // Foundation blocks follow surface wave ground displacement
        const gridI = Math.min(
          gw - 2,
          Math.max(1, Math.floor((block.initX / this.width) * gw))
        );
        const dispX = this.surfaceDispX[gridI] * 18;
        const dispY = this.surfaceDispY[gridI] * 12;
        block.x = block.initX + dispX;
        block.y = block.initY + dispY;
        block.vx = this.surfaceVelX[gridI] * 18;
        block.vy = this.surfaceVelY[gridI] * 12;
        continue;
      }

      // Free blocks: Gravity
      block.vy += gravity * dt;

      // Inertial base shear force from ground acceleration: F = -m * a_ground
      const inertialShear = -groundAccX * 22;
      block.vx += inertialShear * dt;

      // Air drag
      block.vx *= 0.996;
      block.vy *= 0.998;
      block.omega *= 0.985;

      // Integrate positions
      block.x += block.vx * dt;
      block.y += block.vy * dt;
      block.angle += block.omega * dt;

      // Decay internal stress highlight
      block.stress = Math.max(0, block.stress - dt * 2.2);

      // Check if block has toppled or fallen into rubble
      if (!block.rubble && (Math.abs(block.angle) > 0.45 || block.y > this.groundY + 10)) {
        block.rubble = true;
        this.spawnDust(block.x, block.y, 8);
      }
    }

    // Collision Resolution (Blocks vs Ground & Blocks vs Blocks)
    const iterations = 4;
    for (let iter = 0; iter < iterations; iter++) {
      // 1. Ground collision
      for (const block of this.blocks) {
        if (block.isFoundation) continue;
        this.collideBlockWithGround(block);
      }

      // 2. Block vs Block collision (OBB / Contact Manifold)
      for (let i = 0; i < this.blocks.length; i++) {
        for (let j = i + 1; j < this.blocks.length; j++) {
          this.collideBlocks(this.blocks[i], this.blocks[j]);
        }
      }
    }

    // Boundary constraints
    for (const b of this.blocks) {
      if (b.x < b.hw) {
        b.x = b.hw;
        b.vx *= -0.2;
      } else if (b.x > this.width - b.hw) {
        b.x = this.width - b.hw;
        b.vx *= -0.2;
      }
    }
  }

  collideBlockWithGround(block) {
    const corners = this.getBlockCorners(block);
    for (const pt of corners) {
      const gX = Math.min(
        this.gridW - 2,
        Math.max(1, Math.floor((pt.x / this.width) * this.gridW))
      );
      const groundSurfaceY = this.groundY + this.surfaceDispY[gX] * 12;

      if (pt.y > groundSurfaceY) {
        const pen = pt.y - groundSurfaceY;
        block.y -= pen * 0.5;

        // Ground contact impulse
        const rX = pt.x - block.x;
        const rY = pt.y - block.y;
        const vptX = block.vx - block.omega * rY;
        const vptY = block.vy + block.omega * rX;

        if (vptY > 0) {
          const impulse = (1 + block.restitution) * vptY;
          block.vy -= impulse * 0.6;
          block.vx *= 0.85; // Friction
          block.omega -= (rX * impulse) * 0.0008;

          // Dust burst on hard impact
          if (vptY > 60) {
            this.spawnDust(pt.x, groundSurfaceY, Math.min(12, Math.floor(vptY * 0.1)));
            block.stress = Math.min(1.0, block.stress + 0.5);
          }
        }
      }
    }
  }

  collideBlocks(b1, b2) {
    // Fast broadphase AABB check
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const rTot = Math.max(b1.hw, b1.hh) + Math.max(b2.hw, b2.hh) + 6;
    if (Math.abs(dx) > rTot || Math.abs(dy) > rTot) return;

    // For mostly upright stacked columns (angle < 0.15 rad), optimize with stable multi-point contact
    const bothUpright = Math.abs(b1.angle) < 0.15 && Math.abs(b2.angle) < 0.15;
    if (bothUpright) {
      const overlapX = (b1.hw + b2.hw) - Math.abs(dx);
      const overlapY = (b1.hh + b2.hh) - Math.abs(dy);

      if (overlapX > 0 && overlapY > 0) {
        if (overlapY < overlapX) {
          // Vertical stacking contact (Column drum on drum or lintel on capital)
          const signY = dy > 0 ? 1 : -1;
          const totalInvM = b1.invMass + b2.invMass;
          if (totalInvM === 0) return;

          // Positional correction
          b1.y -= (overlapY * (b1.invMass / totalInvM)) * signY * 0.6;
          b2.y += (overlapY * (b2.invMass / totalInvM)) * signY * 0.6;

          // Relative velocity
          const relVy = b2.vy - b1.vy;
          if (relVy * signY < 0) {
            const impulseY = -(1 + Math.min(b1.restitution, b2.restitution)) * relVy;
            b1.vy -= impulseY * (b1.invMass / totalInvM);
            b2.vy += impulseY * (b2.invMass / totalInvM);

            // Tangential friction
            const relVx = b2.vx - b1.vx;
            const frictionImpulse = relVx * 0.35;
            b1.vx += frictionImpulse * (b1.invMass / totalInvM);
            b2.vx -= frictionImpulse * (b2.invMass / totalInvM);

            // Rocking moment on tall columns: Housner inverted pendulum rocking
            const leverX = dx;
            const rockingTorque = (relVy * leverX) * 0.001;
            b1.omega -= rockingTorque * b1.invInertia * 200;
            b2.omega += rockingTorque * b2.invInertia * 200;

            // Shear strain stress accumulation -> gold stress highlight!
            const shearStrain = Math.abs(relVx) * 0.05 + Math.abs(rockingTorque) * 2.0;
            if (shearStrain > 0.15) {
              b1.stress = Math.min(1.0, b1.stress + shearStrain);
              b2.stress = Math.min(1.0, b2.stress + shearStrain);
            }
          }
        } else {
          // Horizontal side-by-side contact
          const signX = dx > 0 ? 1 : -1;
          const totalInvM = b1.invMass + b2.invMass;
          if (totalInvM === 0) return;

          b1.x -= (overlapX * (b1.invMass / totalInvM)) * signX * 0.5;
          b2.x += (overlapX * (b2.invMass / totalInvM)) * signX * 0.5;

          const relVx = b2.vx - b1.vx;
          if (relVx * signX < 0) {
            const impulseX = -(1 + 0.1) * relVx;
            b1.vx -= impulseX * (b1.invMass / totalInvM);
            b2.vx += impulseX * (b2.invMass / totalInvM);
          }
        }
      }
      return;
    }

    // General OBB polygon collision for tumbled rubble blocks
    this.collideOBB(b1, b2);
  }

  collideOBB(b1, b2) {
    const c1 = this.getBlockCorners(b1);
    const c2 = this.getBlockCorners(b2);

    // SAT test on edges
    let minOverlap = Infinity;
    let normal = { x: 0, y: 0 };

    const axes = [
      { x: Math.cos(b1.angle), y: Math.sin(b1.angle) },
      { x: -Math.sin(b1.angle), y: Math.cos(b1.angle) },
      { x: Math.cos(b2.angle), y: Math.sin(b2.angle) },
      { x: -Math.sin(b2.angle), y: Math.cos(b2.angle) }
    ];

    for (const axis of axes) {
      let min1 = Infinity, max1 = -Infinity;
      for (const p of c1) {
        const proj = p.x * axis.x + p.y * axis.y;
        if (proj < min1) min1 = proj;
        if (proj > max1) max1 = proj;
      }

      let min2 = Infinity, max2 = -Infinity;
      for (const p of c2) {
        const proj = p.x * axis.x + p.y * axis.y;
        if (proj < min2) min2 = proj;
        if (proj > max2) max2 = proj;
      }

      const overlap = Math.min(max1, max2) - Math.max(min1, min2);
      if (overlap <= 0) return; // Separating axis found, no collision

      if (overlap < minOverlap) {
        minOverlap = overlap;
        normal = axis;
      }
    }

    // Ensure normal points from b1 to b2
    const dCenter = { x: b2.x - b1.x, y: b2.y - b1.y };
    if (dCenter.x * normal.x + dCenter.y * normal.y < 0) {
      normal.x = -normal.x;
      normal.y = -normal.y;
    }

    const totalInvM = b1.invMass + b2.invMass;
    if (totalInvM === 0) return;

    // Positional separation
    b1.x -= normal.x * minOverlap * (b1.invMass / totalInvM) * 0.5;
    b1.y -= normal.y * minOverlap * (b1.invMass / totalInvM) * 0.5;
    b2.x += normal.x * minOverlap * (b2.invMass / totalInvM) * 0.5;
    b2.y += normal.y * minOverlap * (b2.invMass / totalInvM) * 0.5;

    // Impulse
    const relV = { x: b2.vx - b1.vx, y: b2.vy - b1.vy };
    const velAlongNormal = relV.x * normal.x + relV.y * normal.y;
    if (velAlongNormal < 0) {
      const impulse = -(1 + 0.15) * velAlongNormal;
      b1.vx -= normal.x * impulse * (b1.invMass / totalInvM);
      b1.vy -= normal.y * impulse * (b1.invMass / totalInvM);
      b2.vx += normal.x * impulse * (b2.invMass / totalInvM);
      b2.vy += normal.y * impulse * (b2.invMass / totalInvM);

      b1.stress = Math.min(1.0, b1.stress + Math.abs(impulse) * 0.02);
      b2.stress = Math.min(1.0, b2.stress + Math.abs(impulse) * 0.02);
    }
  }

  getBlockCorners(b) {
    const cos = Math.cos(b.angle);
    const sin = Math.sin(b.angle);
    return [
      { x: b.x + cos * -b.hw - sin * -b.hh, y: b.y + sin * -b.hw + cos * -b.hh },
      { x: b.x + cos * b.hw - sin * -b.hh, y: b.y + sin * b.hw + cos * -b.hh },
      { x: b.x + cos * b.hw - sin * b.hh, y: b.y + sin * b.hw + cos * b.hh },
      { x: b.x + cos * -b.hw - sin * b.hh, y: b.y + sin * -b.hw + cos * b.hh }
    ];
  }

  // ==========================================
  // DUST & RUBBLE PARTICLES
  // ==========================================
  spawnDust(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      if (this.dustParticles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 65;
      this.dustParticles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        radius: 3 + Math.random() * 7,
        growth: 4 + Math.random() * 6,
        life: 1.0,
        decay: 0.5 + Math.random() * 0.7,
        color: Math.random() > 0.4 ? '#d8cebe' : '#b5ab99'
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.radius += p.growth * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // RENDERING PIPELINE
  // ==========================================
  render(ctx) {
    if (!ctx) return;

    ctx.save();

    // 1. Clear background
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render Sky & Surface Landscape (y < groundY)
    this.renderAtmosphere(ctx);

    // 3. Render Subsurface Geology & Bedrock Strata (y >= groundY)
    this.renderSubsurfaceGeology(ctx);

    // 4. Render Elastodynamic P & S Wavefronts
    this.renderSeismicWaveField(ctx);

    // 5. Render Fault Line & Hypocenter
    this.renderTectonicFault(ctx);

    // 6. Render Ground Surface Interface
    this.renderGroundSurface(ctx);

    // 7. Render Roman Architectural Blocks & Rubble
    this.renderArchitecture(ctx);

    // 8. Render Dust Particles
    this.renderDust(ctx);

    // 9. Render Seismograph Accelerogram HUD (Bottom Corner)
    this.renderSeismograph(ctx);

    ctx.restore();
  }

  // Sky, Mediterranean backdrop, distant Alban Hills / Vesuvius silhouette & pines
  renderAtmosphere(ctx) {
    const gy = this.groundY;

    // Atmospheric sky gradient: warm Roman dusk sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, gy);
    skyGrad.addColorStop(0, '#101726'); // Deep cerulean
    skyGrad.addColorStop(0.65, '#2e2b3c'); // Hazy twilight
    skyGrad.addColorStop(1, '#664d3c'); // Warm volcanic amber horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, gy);

    // Distant volcanic hills silhouette
    ctx.fillStyle = '#171822';
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(0, gy - 75);
    ctx.bezierCurveTo(
      this.width * 0.15,
      gy - 130,
      this.width * 0.28,
      gy - 60,
      this.width * 0.45,
      gy - 110
    );
    ctx.bezierCurveTo(
      this.width * 0.58,
      gy - 150,
      this.width * 0.72,
      gy - 70,
      this.width * 0.88,
      gy - 120
    );
    ctx.lineTo(this.width, gy - 80);
    ctx.lineTo(this.width, gy);
    ctx.closePath();
    ctx.fill();

    // Roman stone pine silhouettes (Pinus pinea)
    this.drawPine(ctx, this.width * 0.09, gy - 20, 45);
    this.drawPine(ctx, this.width * 0.14, gy - 16, 38);
    this.drawPine(ctx, this.width * 0.89, gy - 22, 50);
  }

  drawPine(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#11131a';
    // Slender bent trunk
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.quadraticCurveTo(x - 4, y - size * 0.6, x + 2, y - size * 0.85);
    ctx.lineTo(x + 5, y - size * 0.85);
    ctx.quadraticCurveTo(x, y - size * 0.6, x + 2, y);
    ctx.closePath();
    ctx.fill();

    // Parasol canopy
    ctx.beginPath();
    ctx.ellipse(x + 3, y - size * 0.92, size * 0.45, size * 0.22, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Subsurface stratified rock layers (Alluvium, Pozzolanic Tuff, Basalt)
  renderSubsurfaceGeology(ctx) {
    const gy = this.groundY;
    const subH = this.height - gy;

    // Layer 1: Alluvium / Pozzolana Tuff
    const y1 = gy;
    const h1 = subH * 0.28;
    ctx.fillStyle = '#2d261e';
    ctx.fillRect(0, y1, this.width, h1);

    // Layer 2: Travertine / Limestone Strata
    const y2 = y1 + h1;
    const h2 = subH * 0.37;
    ctx.fillStyle = '#222026';
    ctx.fillRect(0, y2, this.width, h2);

    // Layer 3: Crystalline Basalt Basement
    const y3 = y2 + h2;
    const h3 = this.height - y3;
    ctx.fillStyle = '#14151c';
    ctx.fillRect(0, y3, this.width, h3);

    // Bedrock strata lines & texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let l = 1; l < 9; l++) {
      const ly = gy + l * (subH / 9);
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(this.width, ly);
      ctx.stroke();
    }

    // Geological layer labels
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('I. ALLUVIUM & TUFF (Vp=300m/s)', 16, y1 + 18);
    ctx.fillText('II. TRAVERTINE & LIMESTONE (Vp=400m/s)', 16, y2 + 18);
    ctx.fillText('III. BASALTIC BASEMENT (Vp=510m/s)', 16, y3 + 18);
  }

  // Glowing elastodynamic wave fronts (P-waves = cyan, S-waves = crimson/gold)
  renderSeismicWaveField(ctx) {
    const gw = this.gridW;
    const gh = this.gridH;
    const dx = this.width / gw;
    const subH = this.height - this.groundY;
    const dy = subH / gh;
    const gy = this.groundY;

    // Draw sampling points of the wave field where amplitude is significant
    for (let j = 1; j < gh - 1; j += 2) {
      const y = gy + j * dy;
      for (let i = 1; i < gw - 1; i += 2) {
        const idx = j * gw + i;
        const pAmp = this.pWave[idx];
        const sAmp = this.sWave[idx];

        const pAbs = Math.abs(pAmp);
        const sAbs = Math.abs(sAmp);

        if (pAbs > 0.08 || sAbs > 0.08) {
          const x = i * dx;

          // P-wave: Compressional wave (Cyan-white glowing wavefront)
          if (pAbs > 0.08) {
            const pAlpha = Math.min(0.85, pAbs * 0.12);
            ctx.fillStyle = `rgba(100, 210, 255, ${pAlpha})`;
            const r = Math.min(dx * 1.5, 2 + pAbs * 0.6);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }

          // S-wave: Destructive shear wave (Intense Crimson/Gold wavefront)
          if (sAbs > 0.08) {
            const sAlpha = Math.min(0.9, sAbs * 0.14);
            ctx.fillStyle = `rgba(255, 149, 0, ${sAlpha})`;
            const r = Math.min(dx * 2.0, 3 + sAbs * 0.8);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // Tectonic fault line with crimson stick-slip stress glow & hypocenter focus
  renderTectonicFault(ctx) {
    const sX = this.faultSurfaceX;
    const sY = this.faultSurfaceY;
    const dX = this.faultDeepX;
    const dY = this.faultDeepY;

    // Fault line crimson stress glow based on accumulated tectonic stress
    const stressAlpha = 0.25 + this.tectonicStress * 0.65;
    const glowWidth = 3 + this.tectonicStress * 8;

    // Crimson glow halo
    ctx.save();
    ctx.strokeStyle = `rgba(200, 50, 50, ${stressAlpha * 0.5})`;
    ctx.lineWidth = glowWidth * 2;
    ctx.beginPath();
    ctx.moveTo(sX, sY);
    ctx.lineTo(dX, dY);
    ctx.stroke();

    // Sharp fault rupture trace
    ctx.strokeStyle = this.faultRupturing ? '#ff4040' : '#c83232';
    ctx.lineWidth = this.faultRupturing ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(sX, sY);
    ctx.lineTo(dX, dY);
    ctx.stroke();

    // Fault slip arrows
    const midX = (sX + dX) * 0.5;
    const midY = (sY + dY) * 0.5;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 120, 120, 0.8)';
    ctx.fillText('FAULT TRACE (STRIKE-SLIP / DIP-SLIP)', midX + 15, midY);

    // Hypocenter (Earthquake Focus)
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.hypoX, this.hypoY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Epicenter ray projecting to surface
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 204, 0, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(this.hypoX, this.hypoY);
    ctx.lineTo(this.hypoX, this.groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Epicenter marker on surface
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(this.hypoX, this.groundY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`HYPOCENTER (${this.hypocenterDepthKm}km)`, this.hypoX + 12, this.hypoY + 4);
    ctx.fillText('EPICENTER', this.hypoX + 10, this.groundY - 8);

    ctx.restore();
  }

  // Surface interface with dynamic seismic wave undulation
  renderGroundSurface(ctx) {
    const gw = this.gridW;
    const dx = this.width / gw;
    const gy = this.groundY;

    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let i = 0; i < gw; i++) {
      const x = i * dx;
      const y = gy + this.surfaceDispY[i] * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width, gy);
    ctx.closePath();

    ctx.strokeStyle = '#8a8275';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Roman Architecture: Ashlar blocks, fluted drums, pediments, and gold stress highlights
  renderArchitecture(ctx) {
    for (const b of this.blocks) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Block fill
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.hw, -b.hh, b.w, b.h);

      // Ashlar stone bevel & contour line
      ctx.strokeStyle = 'rgba(30, 25, 20, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-b.hw, -b.hh, b.w, b.h);

      // Fluted column drum details
      if (b.type === 'drum') {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        const flutes = 3;
        for (let f = 1; f <= flutes; f++) {
          const fx = -b.hw + f * (b.w / (flutes + 1));
          ctx.beginPath();
          ctx.moveTo(fx, -b.hh);
          ctx.lineTo(fx, b.hh);
          ctx.stroke();
        }
      }

      // Corinthian / sculpted capital scroll relief
      if (b.type === 'capital') {
        ctx.strokeStyle = 'rgba(120, 100, 70, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-b.hw + 5, -b.hh + 5, 4, 0, Math.PI * 1.5);
        ctx.arc(b.hw - 5, -b.hh + 5, 4, -Math.PI * 0.5, Math.PI);
        ctx.stroke();
      }

      // Architrave dentils / pediment relief
      if (b.type === 'frieze') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        const dentils = 14;
        for (let d = 0; d < dentils; d++) {
          const dx = -b.hw + d * (b.w / dentils);
          ctx.fillRect(dx, b.hh - 4, 4, 4);
        }
      }

      // Gold #d4af37 stress concentration highlight on straining stone joints!
      if (b.stress > 0.05) {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2 + b.stress * 3;
        ctx.shadowColor = '#d4af37';
        ctx.shadowBlur = 8 * b.stress;
        ctx.strokeRect(-b.hw, -b.hh, b.w, b.h);
      }

      ctx.restore();
    }
  }

  // Billowing limestone dust cloud particles on structural impact
  renderDust(ctx) {
    for (const p of this.dustParticles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life * 0.45);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Seismograph Accelerogram HUD (Bottom Corner Readout)
  renderSeismograph(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    const w = narrow ? Math.min(sw - 32, 280) : 290;
    const h = 120;
    const x = 16;
    const y = sh - h - 16;

    // Bezel container
    ctx.fillStyle = 'rgba(14, 16, 22, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'; // Gold border
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Header & Telemetry
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#d4af37'; // Gold
    ctx.fillText('SEISMOGRAPH • ACCELEROGRAM', x + 10, y + 14);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText(`PGA: ${(this.currentPGA).toFixed(2)} g`, x + 10, y + 26);
    ctx.fillText(`MAGNITUDE: M ${this.magnitude.toFixed(1)}`, x + 100, y + 26);
    ctx.fillText(`DEPTH: ${this.hypocenterDepthKm} km`, x + 215, y + 26);

    // Trace display area
    const traceX = x + 10;
    const traceY = y + 34;
    const traceW = w - 20;
    const traceH = h - 42;
    const midY = traceY + traceH * 0.5;

    // Grid baseline & amplitude marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(traceX, midY);
    ctx.lineTo(traceX + traceW, midY);
    ctx.moveTo(traceX, midY - traceH * 0.35);
    ctx.lineTo(traceX + traceW, midY - traceH * 0.35);
    ctx.moveTo(traceX, midY + traceH * 0.35);
    ctx.lineTo(traceX + traceW, midY + traceH * 0.35);
    ctx.stroke();

    // Real-time rolling waveform trace
    ctx.strokeStyle =
      this.currentPGA > 0.5 ? '#ff4040' : this.currentPGA > 0.15 ? '#ff9500' : '#64d2ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const n = this.seismoBufferSize;
    for (let i = 0; i < traceW; i++) {
      const bufIdx = (this.seismoHead - traceW + i + n) % n;
      const accVal = this.accelBuffer[bufIdx] || 0;
      const py = midY - accVal * (traceH * 0.7);
      const px = traceX + i;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Phase telemetry footer
    ctx.font = '8px monospace';
    ctx.fillStyle = this.currentPGA > 0.5 ? '#ff6060' : '#8c909e';
    ctx.fillText(`PHASE: ${this.seismicPhase}`, traceX, y + h - 4);

    ctx.restore();
  }

  // ==========================================
  // CONTRACT LIFECYCLE & INPUT METHODS
  // ==========================================
  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    this.groundY = Math.floor(this.height * this.surfaceRatio);
    this.initFaultGeometry();
    this.buildPreset(this.activePreset);
  }

  reset() {
    // Clear wave fields
    this.pWave.fill(0);
    this.pWavePrev.fill(0);
    this.sWave.fill(0);
    this.sWavePrev.fill(0);
    this.surfaceDispX.fill(0);
    this.surfaceDispY.fill(0);
    this.accelBuffer.fill(0);

    this.faultRupturing = false;
    this.tectonicStress = 0.25;
    this.currentPGA = 0;
    this.faultSlipOffset = 0;

    // Rebuild active structure preset
    this.buildPreset(this.activePreset);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.blocks = [];
    this.dustParticles = [];
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  getEntityCount() {
    // Wave nodes + structural blocks + active dust particles
    return this.waveNodesCount + this.blocks.length + this.dustParticles.length;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  onMouseDown(pos) {
    this.isDragging = true;
    this.mousePos = { ...pos };

    // If clicked underground: check if near hypocenter or fault to adjust
    if (pos.y >= this.groundY) {
      const dHypo = Math.hypot(pos.x - this.hypoX, pos.y - this.hypoY);
      if (dHypo < 35) {
        this.dragTarget = 'hypocenter';
        return;
      }
      // Dragging across fault builds manual tectonic strain
      this.tectonicStress = Math.min(1.0, this.tectonicStress + 0.15);
      return;
    }

    // If clicked above ground: grab and fling stone blocks
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (b.isFoundation) continue;
      if (
        Math.abs(pos.x - b.x) < b.hw + 6 &&
        Math.abs(pos.y - b.y) < b.hh + 6
      ) {
        this.dragTarget = b;
        b.vx = 0;
        b.vy = 0;
        break;
      }
    }
  }

  onMouseMove(pos) {
    this.mousePos = { ...pos };

    if (!this.isDragging) return;

    if (this.dragTarget === 'hypocenter') {
      // Map y position to hypocenter depth
      const subH = this.height - this.groundY;
      const depthFrac = Math.min(1, Math.max(0, (pos.y - this.groundY) / subH));
      this.hypocenterDepthKm = Math.round(5 + depthFrac * 25);
      this.updateHypocenter();
    } else if (this.dragTarget && typeof this.dragTarget === 'object') {
      // Dragging a stone block
      this.dragTarget.vx = (pos.x - this.dragTarget.x) * 12;
      this.dragTarget.vy = (pos.y - this.dragTarget.y) * 12;
      this.dragTarget.x = pos.x;
      this.dragTarget.y = pos.y;
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.dragTarget = null;
  }

  onKeyDown(key) {
    if (key === ' ' || key === 'Spacebar') {
      this.triggerFaultRupture();
    } else if (key === '1') {
      this.buildPreset('Basilica Colonnade');
    } else if (key === '2') {
      this.buildPreset('Two-Tier Aqueduct');
    } else if (key === '3') {
      this.buildPreset('Temple of Jupiter');
    } else if (key === 'r' || key === 'R') {
      this.buildPreset(this.activePreset);
    }
  }
}
