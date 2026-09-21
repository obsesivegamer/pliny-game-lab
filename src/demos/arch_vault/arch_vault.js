/**
 * Pliny Game Lab — Arch Vault (Keystone Physics & Line of Thrust)
 * 
 * Roman Structural Engineering based on Vitruvius (De Architectura, Liber VI),
 * Robert Hooke's Inverted Catenary Principle (1676), and Jacques Heyman's
 * Limit Analysis of Masonry Arches (Middle-Third Rule / Kern Analysis).
 * 
 * Features:
 * 1. Voussoir Wedge Block Physics & Clavis Lapis (Keystone) friction locking
 * 2. Real-time Catenary Line of Thrust & Funicular Polygon calculation
 * 3. Hooke's Middle-Third Kern Rule (Green = pure compression, Yellow = cracking, Red = hinge failure)
 * 4. Pier Stability & Overturning Moment Analysis (Abutment spread)
 * 5. Wooden Centering (Armatura / Falsework) striking mechanism
 * 6. Dynamic Multi-Body Structural Collapse & Debris Particle Simulation
 * 7. Architectural Blueprint Aesthetic with drafting guides, stress vectors & Vitruvian telemetry
 */

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class ArchVaultEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;
    attachTouchBridge(this, canvas);

    // Architectural & Structural Parameters
    this.spanWidth = 380;        // Distance between springing points (pixels, ~7.6 m)
    this.pierThickness = 75;     // Abutment pier width (pixels, ~1.5 m)
    this.crownLiveLoad = 40;     // Concentrated load on keystone (kN)
    this.archThickness = 48;     // Radial voussoir depth (pixels, ~0.95 m)
    this.pierHeight = 175;       // Pier height to springing (pixels, ~3.5 m)
    this.numVoussoirs = 15;      // Odd number to ensure a single central keystone
    this.masonryDensity = 2.4;   // Travertine / Tufa stone density (t/m^3)

    // Structural State
    this.scaffoldActive = true;  // Wooden centering falsework in place
    this.collapsed = false;      // True if dynamic collapse has occurred
    this.maxEccentricity = 0;    // Peak line-of-thrust eccentricity relative to kern
    this.horizontalThrust = 0;   // Calculated outward thrust H (kN)
    this.safetyFactor = 2.5;     // Masonry safety factor
    this.stabilityStatus = 'STABLE (CENTERING IN PLACE)'; // Human-readable status
    this.showVectors = true;     // Display voussoir contact stress vectors
    this.showMiddleThird = true; // Display translucent middle-third ribbon

    // Physical Entities
    this.blocks = [];            // Voussoirs, keystones, and pier blocks
    this.thrustNodes = [];       // Sample points along the funicular thrust curve
    this.debris = [];            // Collapse rubble, stone fragments, dust particles
    this.timberScaffold = [];    // Centering posts, ribs, and wedges

    // Interaction State
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.hoveredBlock = null;
    this.isDraggingCrown = false;
    this.time = 0;

    // Audio State (Lazy Web Audio)
    this.audioCtx = null;
    this.audioInitialized = false;

    // Initialize Architecture & Controls
    this.buildControls();
    this.rebuildArch();
  }

  // Safe Guarded DOM Controls Initialization
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Span Width</span>
          <span id="span-val" style="color: var(--accent-gold, #d4af37); font-weight:600;">${(this.spanWidth * 0.02).toFixed(1)} m</span>
        </label>
        <input type="range" id="arch-span" min="260" max="520" step="10" value="${this.spanWidth}">
      </div>

      <div class="control-group">
        <label>
          <span>Pier Thickness</span>
          <span id="pier-val" style="color: var(--accent-cyan, #3bd6c6); font-weight:600;">${(this.pierThickness * 0.02).toFixed(2)} m</span>
        </label>
        <input type="range" id="arch-pier" min="30" max="150" step="5" value="${this.pierThickness}">
      </div>

      <div class="control-group">
        <label>
          <span>Crown Live Load</span>
          <span id="load-val" style="color: #ff6b6b; font-weight:600;">${this.crownLiveLoad} kN</span>
        </label>
        <input type="range" id="arch-load" min="0" max="250" step="5" value="${this.crownLiveLoad}">
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <label>Centering & Masonry Operations</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="btn-strike" title="Knock out timber wedges to transfer thrust">🔨 Strike Centering</button>
          <button class="sub-btn" id="btn-rebuild" title="Erect centering and relay voussoirs">🏛️ Rebuild Arch</button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 4px;">
        <label>Vitruvian Engineering Presets</label>
        <div class="control-btn-grid">
          <button class="sub-btn" data-preset="pont_du_gard">🏛️ Pont du Gard</button>
          <button class="sub-btn" data-preset="colosseum">🏟️ Colosseum Arcade</button>
          <button class="sub-btn" data-preset="segmental">🌉 Flat Segmental</button>
          <button class="sub-btn" data-preset="overload">💥 Overload Breached</button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 4px;">
        <label>Diagnostics & Display</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="btn-toggle-vectors">Vectors: ON</button>
          <button class="sub-btn active" id="btn-toggle-kern">Kern Rule: ON</button>
        </div>
      </div>

      <div id="arch-telemetry" style="font-family: var(--font-mono, monospace); font-size: 0.72rem; color: var(--text-muted, #8c909e); background: rgba(0,0,0,0.35); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); margin-top: 6px; line-height: 1.45;">
        <div>THRUST H: <strong id="tel-thrust" style="color: var(--accent-cyan, #3bd6c6);">0.0 kN</strong></div>
        <div>MAX ECCENTRICITY: <strong id="tel-ecc" style="color: var(--accent-gold, #d4af37);">0.0 cm</strong></div>
        <div>SAFETY FACTOR: <strong id="tel-safety" style="color: #3bd678;">2.50</strong></div>
        <div style="margin-top: 4px; font-weight: bold;" id="tel-status">STABLE (CENTERING IN PLACE)</div>
      </div>
    `;

    // Hook Sliders
    const spanSlider = this.controlsContainer.querySelector('#arch-span');
    const spanVal = this.controlsContainer.querySelector('#span-val');
    if (spanSlider && spanVal) {
      spanSlider.addEventListener('input', (e) => {
        this.spanWidth = parseFloat(e.target.value);
        spanVal.textContent = `${(this.spanWidth * 0.02).toFixed(1)} m`;
        this.rebuildArch();
      });
    }

    const pierSlider = this.controlsContainer.querySelector('#arch-pier');
    const pierVal = this.controlsContainer.querySelector('#pier-val');
    if (pierSlider && pierVal) {
      pierSlider.addEventListener('input', (e) => {
        this.pierThickness = parseFloat(e.target.value);
        pierVal.textContent = `${(this.pierThickness * 0.02).toFixed(2)} m`;
        this.rebuildArch();
      });
    }

    const loadSlider = this.controlsContainer.querySelector('#arch-load');
    const loadVal = this.controlsContainer.querySelector('#load-val');
    if (loadSlider && loadVal) {
      loadSlider.addEventListener('input', (e) => {
        this.crownLiveLoad = parseFloat(e.target.value);
        loadVal.textContent = `${this.crownLiveLoad} kN`;
        this.updateThrustAndStability();
        if (!this.scaffoldActive && !this.collapsed && this.maxEccentricity > 1.5) {
          this.triggerCollapse('EXCESSIVE CROWN LOAD EXCEEDED MASONRY THRUST CAPACITY');
        }
      });
    }

    // Hook Buttons
    const btnStrike = this.controlsContainer.querySelector('#btn-strike');
    if (btnStrike) {
      btnStrike.addEventListener('click', () => {
        this.strikeCentering();
      });
    }

    const btnRebuild = this.controlsContainer.querySelector('#btn-rebuild');
    if (btnRebuild) {
      btnRebuild.addEventListener('click', () => {
        this.rebuildArch();
      });
    }

    // Hook Presets
    const presetBtns = this.controlsContainer.querySelectorAll('[data-preset]');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.dataset.preset;
        this.applyPreset(preset);
      });
    });

    // Hook Diagnostic Toggles
    const btnVectors = this.controlsContainer.querySelector('#btn-toggle-vectors');
    if (btnVectors) {
      btnVectors.addEventListener('click', () => {
        this.showVectors = !this.showVectors;
        btnVectors.textContent = `Vectors: ${this.showVectors ? 'ON' : 'OFF'}`;
        btnVectors.classList.toggle('active', this.showVectors);
      });
    }

    const btnKern = this.controlsContainer.querySelector('#btn-toggle-kern');
    if (btnKern) {
      btnKern.addEventListener('click', () => {
        this.showMiddleThird = !this.showMiddleThird;
        btnKern.textContent = `Kern Rule: ${this.showMiddleThird ? 'ON' : 'OFF'}`;
        btnKern.classList.toggle('active', this.showMiddleThird);
      });
    }
  }

  applyPreset(preset) {
    if (preset === 'pont_du_gard') {
      this.spanWidth = 420;
      this.pierThickness = 95;
      this.crownLiveLoad = 30;
      this.archThickness = 52;
    } else if (preset === 'colosseum') {
      this.spanWidth = 360;
      this.pierThickness = 70;
      this.crownLiveLoad = 45;
      this.archThickness = 46;
    } else if (preset === 'segmental') {
      this.spanWidth = 480;
      this.pierThickness = 50;
      this.crownLiveLoad = 20;
      this.archThickness = 40;
    } else if (preset === 'overload') {
      this.spanWidth = 460;
      this.pierThickness = 40;
      this.crownLiveLoad = 180;
      this.archThickness = 44;
    }

    // Sync Slider Inputs
    if (this.controlsContainer) {
      const s1 = this.controlsContainer.querySelector('#arch-span');
      const s2 = this.controlsContainer.querySelector('#arch-pier');
      const s3 = this.controlsContainer.querySelector('#arch-load');
      const l1 = this.controlsContainer.querySelector('#span-val');
      const l2 = this.controlsContainer.querySelector('#pier-val');
      const l3 = this.controlsContainer.querySelector('#load-val');
      if (s1 && l1) { s1.value = this.spanWidth; l1.textContent = `${(this.spanWidth * 0.02).toFixed(1)} m`; }
      if (s2 && l2) { s2.value = this.pierThickness; l2.textContent = `${(this.pierThickness * 0.02).toFixed(2)} m`; }
      if (s3 && l3) { s3.value = this.crownLiveLoad; l3.textContent = `${this.crownLiveLoad} kN`; }
    }

    this.rebuildArch();
  }

  // Construct Masonry Blocks, Scaffolding & Geometry
  rebuildArch() {
    this.collapsed = false;
    this.scaffoldActive = true;
    this.debris = [];
    this.blocks = [];
    this.timberScaffold = [];

    const groundY = this.height - 90;
    const xc = this.width / 2;
    const rIn = this.spanWidth / 2;
    const rOut = rIn + this.archThickness;
    const rMid = (rIn + rOut) / 2;
    const ySpring = groundY - this.pierHeight;

    // 1. Construct Piers (Left & Right Abutments)
    // Left Pier
    const leftPierX = xc - rIn - this.pierThickness;
    this.blocks.push({
      id: 'pier_left',
      name: 'Pila Sinistra (Left Pier)',
      isPier: true,
      isKeystone: false,
      side: 'left',
      x: leftPierX + this.pierThickness / 2,
      y: ySpring + this.pierHeight / 2,
      w: this.pierThickness,
      h: this.pierHeight,
      poly: [
        { x: leftPierX, y: ySpring },
        { x: leftPierX + this.pierThickness, y: ySpring },
        { x: leftPierX + this.pierThickness, y: groundY },
        { x: leftPierX, y: groundY }
      ],
      vx: 0,
      vy: 0,
      angle: 0,
      omega: 0,
      mass: this.pierThickness * this.pierHeight * 0.4,
      stress: 0.15,
      active: true
    });

    // Right Pier
    const rightPierX = xc + rIn;
    this.blocks.push({
      id: 'pier_right',
      name: 'Pila Dextra (Right Pier)',
      isPier: true,
      isKeystone: false,
      side: 'right',
      x: rightPierX + this.pierThickness / 2,
      y: ySpring + this.pierHeight / 2,
      w: this.pierThickness,
      h: this.pierHeight,
      poly: [
        { x: rightPierX, y: ySpring },
        { x: rightPierX + this.pierThickness, y: ySpring },
        { x: rightPierX + this.pierThickness, y: groundY },
        { x: rightPierX, y: groundY }
      ],
      vx: 0,
      vy: 0,
      angle: 0,
      omega: 0,
      mass: this.pierThickness * this.pierHeight * 0.4,
      stress: 0.15,
      active: true
    });

    // Impost Capital Blocks (Springing Bedstones)
    const impostH = 16;
    const impostFlange = 6;
    this.blocks.push({
      id: 'impost_left',
      name: 'Impost Sinister',
      isPier: false,
      isImpost: true,
      isKeystone: false,
      x: leftPierX + this.pierThickness / 2,
      y: ySpring - impostH / 2,
      poly: [
        { x: leftPierX - impostFlange, y: ySpring - impostH },
        { x: leftPierX + this.pierThickness + impostFlange, y: ySpring - impostH },
        { x: leftPierX + this.pierThickness, y: ySpring },
        { x: leftPierX, y: ySpring }
      ],
      vx: 0, vy: 0, angle: 0, omega: 0, mass: 60, stress: 0.25, active: true
    });

    this.blocks.push({
      id: 'impost_right',
      name: 'Impost Dexter',
      isPier: false,
      isImpost: true,
      isKeystone: false,
      x: rightPierX + this.pierThickness / 2,
      y: ySpring - impostH / 2,
      poly: [
        { x: rightPierX - impostFlange, y: ySpring - impostH },
        { x: rightPierX + this.pierThickness + impostFlange, y: ySpring - impostH },
        { x: rightPierX + this.pierThickness, y: ySpring },
        { x: rightPierX, y: ySpring }
      ],
      vx: 0, vy: 0, angle: 0, omega: 0, mass: 60, stress: 0.25, active: true
    });

    // 2. Construct Arch Voussoirs (Wedge Stones)
    const dTheta = Math.PI / this.numVoussoirs;
    const keystoneIdx = Math.floor(this.numVoussoirs / 2);

    for (let i = 0; i < this.numVoussoirs; i++) {
      const isKeystone = (i === keystoneIdx);
      const thStart = Math.PI - i * dTheta;
      const thEnd = Math.PI - (i + 1) * dTheta;
      const thMid = (thStart + thEnd) / 2;

      // Keystone extrados is raised slightly higher in classical Vitruvian style
      const extraExtrados = isKeystone ? 12 : 0;
      const rOutEff = rOut + extraExtrados;

      // 4 Quadrilateral vertices in polar coords from (xc, ySpring)
      const p1 = { x: xc + rIn * Math.cos(thStart), y: ySpring - rIn * Math.sin(thStart) };
      const p2 = { x: xc + rOutEff * Math.cos(thStart), y: ySpring - rOutEff * Math.sin(thStart) };
      const p3 = { x: xc + rOutEff * Math.cos(thEnd), y: ySpring - rOutEff * Math.sin(thEnd) };
      const p4 = { x: xc + rIn * Math.cos(thEnd), y: ySpring - rIn * Math.sin(thEnd) };

      // Centroid
      const rCentroid = isKeystone ? (rIn + rOutEff) / 2 : rMid;
      const cx = xc + rCentroid * Math.cos(thMid);
      const cy = ySpring - rCentroid * Math.sin(thMid);

      // Local offsets from centroid
      const localPoly = [
        { x: p1.x - cx, y: p1.y - cy },
        { x: p2.x - cx, y: p2.y - cy },
        { x: p3.x - cx, y: p3.y - cy },
        { x: p4.x - cx, y: p4.y - cy }
      ];

      this.blocks.push({
        id: `voussoir_${i}`,
        index: i,
        name: isKeystone ? 'CLAVIS LAPIS (KEYSTONE)' : `Voussoir ${i + 1}`,
        isPier: false,
        isKeystone: isKeystone,
        thMid: thMid,
        thStart: thStart,
        thEnd: thEnd,
        x: cx,
        y: cy,
        homeX: cx,
        homeY: cy,
        poly: [p1, p2, p3, p4],
        localPoly: localPoly,
        vx: 0,
        vy: 0,
        angle: 0,
        omega: 0,
        mass: isKeystone ? 85 : 55,
        stress: 0.2,
        active: true
      });
    }

    // 3. Build Timber Centering Scaffold Structure
    this.buildScaffoldTimbers(xc, ySpring, rIn, groundY);

    // 4. Calculate Initial Line of Thrust & Telemetry
    this.updateThrustAndStability();
    this.updateDomTelemetry();
  }

  buildScaffoldTimbers(xc, ySpring, rIn, groundY) {
    this.timberScaffold = [];
    const numRibs = 7;
    const scaffoldMargin = 6;
    const rScaffold = rIn - scaffoldMargin;

    // Curved Rim Rib
    const rimPoints = [];
    for (let i = 0; i <= 24; i++) {
      const th = Math.PI - (i / 24) * Math.PI;
      rimPoints.push({
        x: xc + rScaffold * Math.cos(th),
        y: ySpring - rScaffold * Math.sin(th)
      });
    }

    // Radial Struts & Vertical Props
    const struts = [];
    for (let i = 0; i < numRibs; i++) {
      const th = Math.PI - ((i + 0.5) / numRibs) * Math.PI;
      const topX = xc + rScaffold * Math.cos(th);
      const topY = ySpring - rScaffold * Math.sin(th);
      const botX = xc + (topX - xc) * 0.45;
      const botY = ySpring + 30;

      struts.push({ x1: topX, y1: topY, x2: botX, y2: botY });
      struts.push({ x1: botX, y1: botY, x2: botX, y2: groundY });
    }

    // Cross Braces
    const crossBraces = [
      { x1: xc - rScaffold * 0.7, y1: ySpring, x2: xc, y2: ySpring - rScaffold * 0.5 },
      { x1: xc + rScaffold * 0.7, y1: ySpring, x2: xc, y2: ySpring - rScaffold * 0.5 },
      { x1: xc - rScaffold * 0.4, y1: ySpring + 30, x2: xc + rScaffold * 0.4, y2: ySpring + 30 }
    ];

    // Wooden Wedges (Cunei) directly supporting voussoir intrados
    const wedges = [];
    for (let i = 0; i < this.numVoussoirs; i++) {
      const th = Math.PI - ((i + 0.5) / this.numVoussoirs) * Math.PI;
      const wx = xc + (rIn - 3) * Math.cos(th);
      const wy = ySpring - (rIn - 3) * Math.sin(th);
      wedges.push({ x: wx, y: wy, th: th });
    }

    this.timberScaffold = {
      rimPoints,
      struts,
      crossBraces,
      wedges,
      alpha: 1.0
    };
  }

  // Strike Centering (Knock out wooden wedges to test arch under live load)
  strikeCentering() {
    if (!this.scaffoldActive && !this.collapsed) return;

    this.playAudio('strike');
    this.scaffoldActive = false;

    // Evaluate stability under raw masonry contact
    this.updateThrustAndStability();

    if (this.maxEccentricity > 1.0) {
      // Thrust line breaches masonry thickness -> Catastrophic dynamic collapse
      setTimeout(() => {
        this.triggerCollapse('LINE OF THRUST BREACHED ARCH RING — HINGE COLLAPSE');
      }, 120);
    } else {
      // Stable arch! Settle blocks with realistic micro-deflection
      this.playAudio('settle');
      this.spawnDustPuffs(12, this.width / 2, this.height - 90 - this.pierHeight - this.spanWidth / 2);
    }

    this.updateDomTelemetry();
  }

  // Calculate Catenary / Funicular Line of Thrust & Middle-Third Kern
  updateThrustAndStability() {
    this.thrustNodes = [];
    const xc = this.width / 2;
    const groundY = this.height - 90;
    const ySpring = groundY - this.pierHeight;
    const rIn = this.spanWidth / 2;
    const rOut = rIn + this.archThickness;
    const rMid = (rIn + rOut) / 2;
    const kernLimit = this.archThickness / 6; // Hooke's middle-third rule boundary

    // 1. Calculate half-arch masonry dead weight & crown live load
    const halfVoussoirs = Math.floor(this.numVoussoirs / 2);
    let deadWeightHalf = 0;
    for (let i = halfVoussoirs; i < this.numVoussoirs; i++) {
      deadWeightHalf += 12.5; // kN equivalent stone weight
    }
    const crownHalfLoad = this.crownLiveLoad * 0.5;
    const totalHalfWeight = deadWeightHalf + crownHalfLoad;

    // 2. Horizontal Thrust H at the Crown (Heyman Equilibrium)
    // H = (Sum of moments about springing) / Rise
    const rise = rMid;
    const spanHalf = rMid;
    // As span increases or rise/span ratio changes, H scales:
    const baseThrust = (totalHalfWeight * (spanHalf * 0.52)) / (rise * 0.95);
    this.horizontalThrust = Math.max(12, baseThrust * 1.8);

    // 3. Construct Discrete Funicular Polygon from Crown Outwards
    const samples = 21;
    let maxEcc = 0;

    for (let s = 0; s <= samples; s++) {
      // t from -1 (left springing) to 0 (crown) to +1 (right springing)
      const t = -1 + (s / samples) * 2;
      const x = xc + t * spanHalf;

      // Funicular curve formula under self-weight + concentrated crown load
      // Weighted catenary / inverted parabola approximation
      const verticalDrop = (rise * (t * t)) * (0.82 + 0.18 * (this.crownLiveLoad / 150));
      
      // Thrust node Y position
      const yCrownApex = ySpring - rOut + (this.archThickness * 0.28);
      const y = yCrownApex + verticalDrop;

      // Find radial distance from arch center (xc, ySpring) to evaluate against middle-third
      const dx = x - xc;
      const dy = ySpring - y;
      const rActual = Math.hypot(dx, dy);

      // Eccentricity relative to arch centerline rMid
      const ecc = Math.abs(rActual - rMid);
      const eccRatio = ecc / kernLimit; // > 1.0 means outside middle third!

      if (Math.abs(t) < 0.95 && eccRatio > maxEcc) {
        maxEcc = eccRatio;
      }

      // Determine joint state color
      let nodeState = 'stable'; // Green
      if (eccRatio > 1.0 && eccRatio <= 2.5) {
        nodeState = 'warning'; // Yellow (cracking risk)
      } else if (eccRatio > 2.5) {
        nodeState = 'failure'; // Red (thrust exited masonry ring)
      }

      this.thrustNodes.push({
        x: x,
        y: y,
        t: t,
        eccRatio: eccRatio,
        state: nodeState,
        thrustVal: this.horizontalThrust * (1 + 0.3 * Math.abs(t))
      });
    }

    // 4. Pier Stability & Overturning Moment Check
    // Overturning moment Mot = H * pierHeight
    // Stabilizing moment Mres = W_pier * (pierThickness / 2) + V_spring * pierThickness
    const pierWeight = (this.pierThickness * 0.02) * (this.pierHeight * 0.02) * 24; // kN
    const mot = this.horizontalThrust * (this.pierHeight * 0.02);
    const mres = pierWeight * (this.pierThickness * 0.01) + totalHalfWeight * (this.pierThickness * 0.02);
    const pierSafety = mres / Math.max(0.1, mot);

    if (pierSafety < 1.0) {
      maxEcc = Math.max(maxEcc, 3.2); // Overturning failure
    }

    this.maxEccentricity = maxEcc;
    this.safetyFactor = Math.max(0.1, 1.0 / (0.1 + maxEcc * 0.35));

    // Update Voussoir stress visual levels
    this.blocks.forEach(b => {
      if (!b.isPier) {
        const stressMult = (this.crownLiveLoad / 100) + (this.horizontalThrust / 60);
        b.stress = Math.min(1.0, 0.15 + 0.4 * stressMult);
      }
    });

    // Update Human-Readable Status
    if (this.collapsed) {
      this.stabilityStatus = 'COLLAPSED: RUINA MASONRY COLLAPSE';
    } else if (this.scaffoldActive) {
      this.stabilityStatus = 'CENTERING IN PLACE (FALSEWORK BEARING)';
    } else if (this.maxEccentricity <= 1.0) {
      this.stabilityStatus = 'STABLE (LINEA IN TERTIA MEDIANIS)';
    } else if (this.maxEccentricity <= 2.5) {
      this.stabilityStatus = 'TENSILE CRACKING RISK (EXCENTRICITAS)';
    } else {
      this.stabilityStatus = 'UNSTABLE: MECHANISM HINGE FORMATION';
    }
  }

  // Trigger Dynamic Multi-Body Structural Collapse
  triggerCollapse(reason) {
    if (this.collapsed) return;
    this.collapsed = true;
    this.scaffoldActive = false;
    this.playAudio('collapse');

    const xc = this.width / 2;
    const groundY = this.height - 90;

    // Impart kinetic velocities to voussoirs based on outward thrust forces
    this.blocks.forEach(b => {
      if (b.isKeystone) {
        // Keystone drops down rapidly
        b.vy = 80 + Math.random() * 60;
        b.vx = (Math.random() - 0.5) * 40;
        b.omega = (Math.random() - 0.5) * 4;
      } else if (b.isPier) {
        // Piers tip outward
        const dir = b.side === 'left' ? -1 : 1;
        b.vx = dir * (50 + Math.random() * 40);
        b.omega = dir * (0.8 + Math.random() * 0.6);
      } else {
        // Flank voussoirs burst outwards and tumble
        const dx = b.x - xc;
        const dir = dx < 0 ? -1 : 1;
        b.vx = dir * (40 + Math.random() * 60);
        b.vy = (Math.random() - 0.2) * 50;
        b.omega = (Math.random() - 0.5) * 6;
      }
    });

    // Spawn massive cloud of stone shards, mortar dust, and sparks
    this.spawnCollapseDebris(xc, groundY - this.pierHeight, 90);
    this.updateDomTelemetry();
  }

  spawnCollapseDebris(originX, originY, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 220;
      this.debris.push({
        x: originX + (Math.random() - 0.5) * this.spanWidth,
        y: originY + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 2 + Math.random() * 7,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 1.0,
        decay: 0.15 + Math.random() * 0.35,
        type: Math.random() > 0.4 ? 'stone' : 'dust',
        color: Math.random() > 0.5 ? '#d8cbb8' : '#8fa4b8'
      });
    }
  }

  spawnDustPuffs(count, x, y) {
    for (let i = 0; i < count; i++) {
      this.debris.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 40,
        vy: -15 - Math.random() * 30,
        size: 4 + Math.random() * 10,
        rotation: 0,
        rotSpeed: 0,
        life: 0.8,
        decay: 0.4 + Math.random() * 0.4,
        type: 'dust',
        color: 'rgba(216, 203, 184, 0.4)'
      });
    }
  }

  updateDomTelemetry() {
    if (!this.controlsContainer) return;
    const tH = this.controlsContainer.querySelector('#tel-thrust');
    const tEcc = this.controlsContainer.querySelector('#tel-ecc');
    const tSafe = this.controlsContainer.querySelector('#tel-safety');
    const tStat = this.controlsContainer.querySelector('#tel-status');

    if (tH) tH.textContent = `${this.horizontalThrust.toFixed(1)} kN`;
    if (tEcc) tEcc.textContent = `${(this.maxEccentricity * (this.archThickness / 6) * 0.02 * 100).toFixed(1)} cm`;
    if (tSafe) {
      tSafe.textContent = this.safetyFactor.toFixed(2);
      tSafe.style.color = this.safetyFactor >= 1.5 ? '#3bd678' : this.safetyFactor >= 1.0 ? '#f5c242' : '#ff4757';
    }
    if (tStat) {
      tStat.textContent = this.stabilityStatus;
      tStat.style.color = this.collapsed ? '#ff4757' : (this.scaffoldActive ? 'var(--accent-gold, #d4af37)' : (this.maxEccentricity <= 1.0 ? '#3bd678' : '#f5c242'));
    }
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  // Contract Methods: Resize, Update, Render, Entity Count, Destroy
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.rebuildArch();
  }

  getEntityCount() {
    const activeBlocks = this.blocks ? this.blocks.filter(b => b.active).length : 0;
    const activeNodes = this.thrustNodes ? this.thrustNodes.length : 0;
    const activeDebris = this.debris ? this.debris.filter(d => d.life > 0).length : 0;
    return activeBlocks + activeNodes + activeDebris;
  }

  reset() {
    this.rebuildArch();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  }

  // Physics Simulation Step
  update(dt) {
    this.time += dt;
    const groundY = this.height - 90;
    const gravity = 380; // px/s^2

    // 1. Dynamic Collapse Multi-Body Integration
    if (this.collapsed) {
      this.blocks.forEach(b => {
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.angle += b.omega * dt;

        // Ground Collision & Resting Friction
        const estBottom = b.y + 20;
        if (estBottom > groundY) {
          b.y = groundY - 20;
          b.vy = -b.vy * 0.22; // Restitution
          b.vx *= 0.85;        // Ground friction
          b.omega *= 0.8;
          if (Math.abs(b.vy) < 8) b.vy = 0;
        }

        // Walls / Boundary Dampening
        if (b.x < 30) { b.x = 30; b.vx = -b.vx * 0.3; }
        if (b.x > this.width - 30) { b.x = this.width - 30; b.vx = -b.vx * 0.3; }
      });
    }

    // 2. Update Debris & Dust Particles
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const p = this.debris[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.debris.splice(i, 1);
        continue;
      }

      p.vy += (p.type === 'stone' ? 320 : 40) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      // Ground bounce for stones
      if (p.y > groundY && p.type === 'stone') {
        p.y = groundY;
        p.vy = -p.vy * 0.3;
        p.vx *= 0.8;
      }
    }
  }

  // Blueprint Rendering Pipeline
  render(ctx) {
    if (!ctx) return;

    // 1. Blueprint Grid Background
    this.renderBlueprintBackground(ctx);

    // 2. Springing Line, Centerline & Vitruvian Dimension Guides
    this.renderDraftingGuides(ctx);

    // 3. Wooden Centering Falsework (if active or fading)
    if (this.scaffoldActive || (this.timberScaffold && this.timberScaffold.alpha > 0.01)) {
      this.renderCenteringScaffold(ctx);
    }

    // 4. Middle-Third Kern Ribbon
    if (this.showMiddleThird && !this.collapsed) {
      this.renderMiddleThirdRibbon(ctx);
    }

    // 5. Masonry Blocks (Voussoirs, Keystone, Piers)
    this.renderMasonryBlocks(ctx);

    // 6. Catenary Line of Thrust & Funicular Nodes
    if (!this.collapsed) {
      this.renderLineOfThrust(ctx);
    }

    // 7. Contact Stress & Normal Thrust Vectors
    if (this.showVectors && !this.collapsed) {
      this.renderStressVectors(ctx);
    }

    // 8. Crown Live Load Weight Graphic
    if (!this.collapsed) {
      this.renderCrownLoadWeight(ctx);
    }

    // 9. Collapse Debris & Stone Shards
    this.renderDebris(ctx);

    // 10. Blueprint Telemetry HUD & Title Box
    this.renderBlueprintHUD(ctx);
  }

  renderBlueprintBackground(ctx) {
    const w = this.width;
    const h = this.height;

    // Deep Cyanotype Blueprint Gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#0c1a2e');
    bgGrad.addColorStop(1, '#060d17');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Fine Blueprint Grid Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(78, 140, 204, 0.08)';
    ctx.lineWidth = 1;

    const gridSize = 20;
    ctx.beginPath();
    for (let x = 0; x <= w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Major Grid Accents (100px)
    ctx.strokeStyle = 'rgba(78, 140, 204, 0.18)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 100) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += 100) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  renderDraftingGuides(ctx) {
    const xc = this.width / 2;
    const groundY = this.height - 90;
    const ySpring = groundY - this.pierHeight;
    const rIn = this.spanWidth / 2;
    const rOut = rIn + this.archThickness;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Springing Level Datum Line
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.4)';
    ctx.beginPath();
    ctx.moveTo(30, ySpring);
    ctx.lineTo(this.width - 30, ySpring);
    ctx.stroke();

    // Centerline (CL)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.beginPath();
    ctx.moveTo(xc, ySpring - rOut - 60);
    ctx.lineTo(xc, groundY + 20);
    ctx.stroke();

    // Ground Line Foundation
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(230, 232, 238, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(this.width - 20, groundY);
    ctx.stroke();

    // Foundation Hatching
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 30; x < this.width - 30; x += 15) {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 10, groundY + 14);
    }
    ctx.stroke();

    // Span Width Dimension Line
    const dimY = groundY + 28;
    const xL = xc - rIn;
    const xR = xc + rIn;
    ctx.strokeStyle = '#d4af37';
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(xL, dimY);
    ctx.lineTo(xR, dimY);
    // Arrows
    ctx.moveTo(xL, dimY - 4); ctx.lineTo(xL, dimY + 4);
    ctx.moveTo(xR, dimY - 4); ctx.lineTo(xR, dimY + 4);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SPAN: ${(this.spanWidth * 0.02).toFixed(1)} m (L = ${this.spanWidth}px)`, xc, dimY + 14);

    ctx.restore();
  }

  renderCenteringScaffold(ctx) {
    if (!this.timberScaffold || !this.timberScaffold.rimPoints) return;
    const groundY = this.height - 90;

    ctx.save();
    ctx.strokeStyle = '#9c6b3f'; // Timber amber
    ctx.fillStyle = 'rgba(156, 107, 63, 0.12)';
    ctx.lineWidth = 2.5;

    // Curved Timber Rib
    const pts = this.timberScaffold.rimPoints;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Radial Timber Struts & Vertical Shores
    ctx.lineWidth = 2;
    this.timberScaffold.struts.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    });

    // Diagonal Cross Bracing
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(180, 130, 80, 0.7)';
    this.timberScaffold.crossBraces.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    });

    // Wedges (Cunei)
    ctx.fillStyle = '#d4af37';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    this.timberScaffold.wedges.forEach(w => {
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(w.th - Math.PI / 2);
      ctx.fillRect(-4, -2, 8, 4);
      ctx.strokeRect(-4, -2, 8, 4);
      ctx.restore();
    });

    // Centering Text Label
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('ARMATURA LIGNEA (TIMBER CENTERING SUPPORT)', this.width / 2, groundY - this.pierHeight * 0.45);

    ctx.restore();
  }

  renderMiddleThirdRibbon(ctx) {
    const xc = this.width / 2;
    const groundY = this.height - 90;
    const ySpring = groundY - this.pierHeight;
    const rIn = this.spanWidth / 2;
    const t = this.archThickness;
    const rKernIn = rIn + t / 3;
    const rKernOut = rIn + 2 * (t / 3);

    ctx.save();
    // Translucent Glowing Green Middle-Third Band
    ctx.fillStyle = 'rgba(59, 214, 120, 0.08)';
    ctx.strokeStyle = 'rgba(59, 214, 120, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    // Outer boundary of middle third
    ctx.arc(xc, ySpring, rKernOut, Math.PI, 0, false);
    // Inner boundary of middle third
    ctx.arc(xc, ySpring, rKernIn, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderMasonryBlocks(ctx) {
    ctx.save();

    this.blocks.forEach(b => {
      if (!b.active) return;

      ctx.save();
      if (this.collapsed) {
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
      }

      // Fill & Stroke Styling
      if (b.isKeystone) {
        // Distinct Keystone Highlight
        ctx.fillStyle = this.hoveredBlock === b ? '#3a4b63' : '#1d2c42';
        ctx.strokeStyle = '#e6c66e'; // Golden Keystone Border
        ctx.lineWidth = 2.5;
      } else if (b.isPier) {
        ctx.fillStyle = '#142236';
        ctx.strokeStyle = '#5a799e';
        ctx.lineWidth = 1.5;
      } else {
        // Standard Voussoirs
        ctx.fillStyle = this.hoveredBlock === b ? '#263852' : '#18273b';
        ctx.strokeStyle = '#4e7299';
        ctx.lineWidth = 1.5;
      }

      // Draw Polygon
      const poly = this.collapsed ? b.localPoly : b.poly;
      if (poly && poly.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Architectural Ashlar Drafting Hatching
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (poly.length === 4) {
          ctx.moveTo((poly[0].x + poly[1].x) / 2, (poly[0].y + poly[1].y) / 2);
          ctx.lineTo((poly[2].x + poly[3].x) / 2, (poly[2].y + poly[3].y) / 2);
        }
        ctx.stroke();
      }

      // Keystone Label
      if (b.isKeystone && !this.collapsed) {
        ctx.fillStyle = '#e6c66e';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CLAVIS', b.x, b.y - 2);
        ctx.fillText('I', b.x, b.y + 8);
      }

      ctx.restore();
    });

    ctx.restore();
  }

  renderLineOfThrust(ctx) {
    if (this.thrustNodes.length < 2) return;

    ctx.save();

    // 1. Draw Glowing Funicular Thrust Curve
    ctx.beginPath();
    ctx.moveTo(this.thrustNodes[0].x, this.thrustNodes[0].y);
    for (let i = 1; i < this.thrustNodes.length; i++) {
      ctx.lineTo(this.thrustNodes[i].x, this.thrustNodes[i].y);
    }

    // Dynamic Color Transition based on max eccentricity
    let strokeCol = '#3bd678'; // Green (stable, pure compression)
    if (this.maxEccentricity > 1.0 && this.maxEccentricity <= 2.5) {
      strokeCol = '#f5c242'; // Yellow (cracking tension)
    } else if (this.maxEccentricity > 2.5) {
      strokeCol = '#ff4757'; // Red (failure)
    }

    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = strokeCol;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Thrust Sample Nodes & Force Rings
    this.thrustNodes.forEach((node, i) => {
      // Draw every 2nd sample ring
      if (i % 2 === 0) {
        ctx.fillStyle = node.state === 'stable' ? '#3bd678' : (node.state === 'warning' ? '#f5c242' : '#ff4757');
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Crown Thrust Label
    const crownNode = this.thrustNodes[Math.floor(this.thrustNodes.length / 2)];
    if (crownNode) {
      ctx.fillStyle = strokeCol;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`THRUST H = ${this.horizontalThrust.toFixed(1)} kN`, crownNode.x, crownNode.y - 12);
    }

    ctx.restore();
  }

  renderStressVectors(ctx) {
    const xc = this.width / 2;

    ctx.save();
    ctx.lineWidth = 2;

    this.blocks.forEach(b => {
      if (b.isPier || !b.thMid) return;

      // Contact vector pointing along tangent of arch ring
      const vLen = 14 + b.stress * 22;
      const angleTang = b.thMid + (b.x < xc ? Math.PI / 2 : -Math.PI / 2);

      const vx = Math.cos(angleTang) * vLen;
      const vy = -Math.sin(angleTang) * vLen;

      // Color based on stress level
      ctx.strokeStyle = b.stress < 0.4 ? 'rgba(59, 214, 120, 0.7)' : (b.stress < 0.75 ? 'rgba(245, 194, 66, 0.85)' : 'rgba(255, 71, 87, 0.9)');
      ctx.fillStyle = ctx.strokeStyle;

      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + vx, b.y + vy);
      ctx.stroke();

      // Arrowhead
      const headLen = 4;
      const hAng = Math.atan2(vy, vx);
      ctx.beginPath();
      ctx.moveTo(b.x + vx, b.y + vy);
      ctx.lineTo(b.x + vx - headLen * Math.cos(hAng - Math.PI / 6), b.y + vy - headLen * Math.sin(hAng - Math.PI / 6));
      ctx.lineTo(b.x + vx - headLen * Math.cos(hAng + Math.PI / 6), b.y + vy - headLen * Math.sin(hAng + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }

  renderCrownLoadWeight(ctx) {
    if (this.crownLiveLoad <= 0) return;

    const xc = this.width / 2;
    const groundY = this.height - 90;
    const ySpring = groundY - this.pierHeight;
    const rIn = this.spanWidth / 2;
    const rOut = rIn + this.archThickness;
    const apexY = ySpring - rOut - 12; // Atop keystone

    const boxW = 44 + Math.min(60, this.crownLiveLoad * 0.2);
    const boxH = 26;

    ctx.save();
    ctx.translate(xc, apexY);

    // Cast Iron / Stone Test Weight Block
    ctx.fillStyle = '#7a2222';
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-boxW / 2, -boxH, boxW, boxH);
    ctx.strokeRect(-boxW / 2, -boxH, boxW, boxH);

    // Weight Text Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LOAD`, 0, -boxH / 2 - 4);
    ctx.fillText(`${this.crownLiveLoad} kN`, 0, -boxH / 2 + 6);

    // Downward Force Vector Arrow
    ctx.strokeStyle = '#ff6b6b';
    ctx.fillStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-4, 11);
    ctx.lineTo(4, 11);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderDebris(ctx) {
    if (this.debris.length === 0) return;

    ctx.save();
    this.debris.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'stone') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#3a4b63';
        ctx.lineWidth = 1;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        // Dust Puff
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
    ctx.restore();
  }

  renderBlueprintHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    if (narrow) {
      const boxW = Math.min(sw - 24, 250);
      const boxH = 68;
      ctx.fillStyle = 'rgba(12, 26, 46, 0.88)';
      ctx.strokeStyle = this.collapsed ? '#ff4757' : (this.scaffoldActive ? '#d4af37' : (this.maxEccentricity <= 1.0 ? '#3bd678' : '#f5c242'));
      ctx.lineWidth = 1;
      ctx.fillRect(12, 12, boxW, boxH);
      ctx.strokeRect(12, 12, boxW, boxH);

      ctx.font = 'bold 10px serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText('FORNIX ET ARCUS (VAULT)', 20, 28);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(this.collapsed ? 'COLLAPSED' : (this.scaffoldActive ? 'CENTERING ACTIVE' : (this.maxEccentricity <= 1.0 ? 'STABLE' : 'UNSTABLE')), 20, 46);

      ctx.font = '8.5px monospace';
      ctx.fillStyle = '#e6e8ee';
      ctx.fillText(`THRUST: ${this.horizontalThrust.toFixed(1)} kN | S.F.: ${this.safetyFactor.toFixed(2)}`, 20, 62);
    } else {
      // Vitruvian Title Plaque (Top Left)
      ctx.fillStyle = 'rgba(12, 26, 46, 0.85)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.fillRect(20, 20, 280, 68);
      ctx.strokeRect(20, 20, 280, 68);

      ctx.font = 'bold 11px serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText('DE ARCHITECTURA — LIBER VI', 32, 38);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#e6e8ee';
      ctx.fillText('FORNIX ET ARCUS (KEYSTONE VAULT)', 32, 54);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#3bd6c6';
      ctx.fillText('HOOKE CATENARY & MIDDLE-THIRD ANALYSIS', 32, 70);

      // Status Banner (Top Center)
      const bannerW = 340;
      const bannerX = (sw - bannerW) / 2;
      ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
      ctx.strokeStyle = this.collapsed ? '#ff4757' : (this.scaffoldActive ? '#d4af37' : (this.maxEccentricity <= 1.0 ? '#3bd678' : '#f5c242'));
      ctx.lineWidth = 1.5;
      ctx.fillRect(bannerX, 20, bannerW, 26);
      ctx.strokeRect(bannerX, 20, bannerW, 26);

      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`STATUS: ${this.stabilityStatus}`, sw / 2, 36);
    }

    ctx.restore();
  }

  // Interactive Input Handlers
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = pos;
    this.initAudio();

    // Check if clicked near crown load to drag
    const xc = this.width / 2;
    const groundY = this.height - 90;
    const apexY = groundY - this.pierHeight - (this.spanWidth / 2 + this.archThickness);
    if (Math.hypot(pos.x - xc, pos.y - apexY) < 40) {
      this.isDraggingCrown = true;
      return;
    }

    // Check if clicked a block to inspect
    this.blocks.forEach(b => {
      if (Math.hypot(pos.x - b.x, pos.y - b.y) < 30) {
        this.hoveredBlock = b;
        this.playAudio('tap');
      }
    });
  }

  onMouseMove(pos) {
    this.mousePos = pos;

    if (this.isDraggingCrown && !this.collapsed) {
      const xc = this.width / 2;
      const dy = Math.max(0, pos.y - (this.height - 90 - this.pierHeight - this.spanWidth / 2));
      this.crownLiveLoad = Math.min(250, Math.round(dy * 1.5));

      if (this.controlsContainer) {
        const slider = this.controlsContainer.querySelector('#arch-load');
        const val = this.controlsContainer.querySelector('#load-val');
        if (slider) slider.value = this.crownLiveLoad;
        if (val) val.textContent = `${this.crownLiveLoad} kN`;
      }

      this.updateThrustAndStability();
      if (!this.scaffoldActive && this.maxEccentricity > 1.5) {
        this.triggerCollapse('EXCESSIVE CROWN LOAD DISLODGED KEYSTONE');
      }
    } else {
      // Hover detection
      this.hoveredBlock = null;
      for (const b of this.blocks) {
        if (Math.hypot(pos.x - b.x, pos.y - b.y) < 25) {
          this.hoveredBlock = b;
          break;
        }
      }
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    this.isDraggingCrown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      if (this.collapsed) {
        this.rebuildArch();
      } else if (this.scaffoldActive) {
        this.strikeCentering();
      } else {
        this.rebuildArch();
      }
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === 'r' || key === 'R') {
      this.rebuildArch();
    } else if (key === 's' || key === 'S') {
      this.strikeCentering();
    } else if (key === '1') {
      this.applyPreset('pont_du_gard');
    } else if (key === '2') {
      this.applyPreset('colosseum');
    } else if (key === '3') {
      this.applyPreset('segmental');
    } else if (key === '4') {
      this.applyPreset('overload');
    } else if (key === 'ArrowUp') {
      this.crownLiveLoad = Math.min(250, this.crownLiveLoad + 10);
      this.updateThrustAndStability();
      this.updateDomTelemetry();
    } else if (key === 'ArrowDown') {
      this.crownLiveLoad = Math.max(0, this.crownLiveLoad - 10);
      this.updateThrustAndStability();
      this.updateDomTelemetry();
    }
  }

  onKeyUp(key, e) {}

  // Web Audio Sound Synthesizer (Headless-safe)
  initAudio() {
    if (this.audioCtx || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch {}
  }

  playAudio(type) {
    if (!this.audioCtx) return;
    try {
      const t = this.audioCtx.currentTime;
      if (type === 'strike') {
        // Wooden wedge mallet strike crack
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      } else if (type === 'settle') {
        // Deep stone friction settling thud
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.28);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      } else if (type === 'collapse') {
        // Low frequency tumbling rubble rumble
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, t);
        osc.frequency.linearRampToValueAtTime(25, t + 0.65);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.7);
      } else if (type === 'tap') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
      }
    } catch {}
  }
}
