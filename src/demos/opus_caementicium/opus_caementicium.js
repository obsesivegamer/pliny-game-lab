/**
 * Pliny Game Lab — Opus Caementicium (Roman Marine Concrete Engine)
 * 
 * Grounded in Pliny the Elder's Naturalis Historia (Book XXXV, ch. 47)
 * and Vitruvius' De Architectura (Book II, ch. 6):
 *   "Pulvis Puteolanus... the moment it touches the waves of the sea and is
 *    submerged, it becomes a stone which resists the waves and grows firmer every day."
 * 
 * Simulation Model:
 *   1. Macroscopic Roman Marine Breakwater (Pila Submarina):
 *      - Pozzolanic cement matrix embedded with aggregate clasts (caementa: tuff, basalt, terracotta, lime).
 *      - Fracture mechanics: shear & tension cracks propagating through mortar paste.
 *      - Dynamic Tyrrhenian Sea fluid boundary, wave action, and tidal/submergence hydrostatic head.
 *   2. Microscopic Crystalline Matrix Cellular Automata:
 *      - Dissolution of relict lime clasts (Ca²⁺) and reactive volcanic ash glass (Si-Al).
 *      - Seawater capillary percolation and alkaline buffering.
 *      - Aluminum-Tobermorite [Ca₄(Si₅.₅Al₀.₅O₁₇H₂)]·(Ca,Na,K)·4H₂O crystal needle growth.
 *      - Felted interlocking crystalline needle mesh bridging crack walls (Self-Healing Concrete).
 * 
 * Color Palette:
 *   Volcanic Ash Grey: #4B4B4B
 *   Lime White:        #FAFAFA
 *   Sea Foam:          #88D49E
 */

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class OpusCaementiciumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;
    attachTouchBridge(this, canvas);

    // Simulation Parameters
    this.pozzolanaRatio = 0.58; // 58% reactive volcanic ash (optimal Pozzuoli ratio)
    this.waterSaturation = 0.85; // 85% seawater saturation
    this.isSubmerged = true; // Submerged breakwater pier vs tidal splash zone
    this.tideLevel = 0.38; // Normalized sea level (0 = top, 1 = bottom)
    this.waveTime = 0;
    this.time = 0;

    // Split-Screen Layout
    this.splitRatio = 0.50; // Split at 50% width

    // Macroscopic Simulation State (Breakwater Block)
    this.blockX = 0;
    this.blockY = 0;
    this.blockW = 0;
    this.blockH = 0;
    this.aggregates = [];
    this.cracks = [];
    this.structuralIntegrity = 1.0; // [0, 1]
    this.seaParticles = [];
    this.maxSeaParticles = 80;

    // Microscopic Crystalline Cellular Automata State
    this.microGridW = 50;
    this.microGridH = 50;
    this.gridCells = this.microGridW * this.microGridH;
    this.caFieldCa = new Float32Array(this.gridCells); // Dissolved Ca2+ ions
    this.caFieldSiAl = new Float32Array(this.gridCells); // Dissolved Si/Al ions
    this.caFieldWater = new Float32Array(this.gridCells); // Seawater moisture
    this.caFieldMineral = new Float32Array(this.gridCells); // Precipitated tobermorite

    // Crystal Needle Agents (Al-Tobermorite)
    this.crystalNeedles = [];
    this.maxNeedles = 450;
    this.microCrackGap = 0.36; // Normalized crack width in microscope view
    this.healedRatio = 0.0; // Percentage of crack bridged by crystal needles

    // Interaction State
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.activeHoverPanel = null; // 'macro' | 'micro'
    this.crackShockwave = 0; // Visual pulse when crack is induced

    // Audio State (Lazy Web Audio)
    this.audioCtx = null;
    this.audioInitialized = false;

    // Initialize Simulation
    this.initLayout();
    this.initMacroAggregates();
    this.initMicroGrid();
    this.induceCrack(); // Initial structural stress fracture for demo
    this.buildControls();
  }

  // =========================================================================
  // VIEWPORT LAYOUT & SIZING
  // =========================================================================

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.initLayout();
  }

  initLayout() {
    const splitX = Math.floor(this.width * this.splitRatio);
    const pad = 24;

    // Macroscopic block coordinates (Left Panel)
    const macroW = splitX;
    this.blockW = Math.max(120, Math.min(340, macroW - pad * 2));
    this.blockH = Math.max(180, Math.min(420, this.height - pad * 3 - 60));
    this.blockX = Math.floor((macroW - this.blockW) * 0.5);
    this.blockY = Math.floor(this.height - this.blockH - pad - 30);

    // Microscopic view coordinates (Right Panel)
    this.microPanelX = splitX + pad;
    this.microPanelY = pad + 40;
    this.microPanelW = Math.max(160, this.width - splitX - pad * 2);
    this.microPanelH = Math.max(180, this.height - pad * 2 - 70);
  }

  // =========================================================================
  // MACROSCOPIC ROMAN BREAKWATER (AGGREGATE & CAEMENTA SETUP)
  // =========================================================================
  initMacroAggregates() {
    this.aggregates = [];
    const count = 160;

    // Aggregate types matching Vitruvius & Pliny:
    // - Volcanic Tuff (yellowish brown porous rock)
    // - Vesuvian Basalt (dark grey-black durable stone)
    // - Terracotta / Brick shards (opus testaceum fragments, burnt red)
    // - Relict Quicklime Clasts (white unslaked lime lumps - crucial self-healing catalyst)
    const types = [
      { name: 'tuff', color: '#5A544C', weight: 0.35, minR: 8, maxR: 20 },
      { name: 'basalt', color: '#2E2D30', weight: 0.25, minR: 6, maxR: 16 },
      { name: 'terracotta', color: '#8F3D33', weight: 0.20, minR: 7, maxR: 18 },
      { name: 'lime_clast', color: '#FAFAFA', weight: 0.20, minR: 5, maxR: 12 }
    ];

    for (let i = 0; i < count; i++) {
      // Pick aggregate type based on weight
      const rVal = Math.random();
      let cumulative = 0;
      let selectedType = types[0];
      for (const t of types) {
        cumulative += t.weight;
        if (rVal <= cumulative) {
          selectedType = t;
          break;
        }
      }

      const radius = selectedType.minR + Math.random() * (selectedType.maxR - selectedType.minR);
      // Normalized relative coordinate within breakwater block [0, 1]
      const relX = 0.08 + Math.random() * 0.84;
      const relY = 0.06 + Math.random() * 0.88;

      // Angular polygonal vertices for realistic quarry-crushed stones
      const numVerts = 5 + Math.floor(Math.random() * 4);
      const vertices = [];
      for (let v = 0; v < numVerts; v++) {
        const ang = (v / numVerts) * Math.PI * 2;
        const radVar = radius * (0.7 + Math.random() * 0.55);
        vertices.push({
          x: Math.cos(ang) * radVar,
          y: Math.sin(ang) * radVar
        });
      }

      this.aggregates.push({
        relX,
        relY,
        radius,
        type: selectedType.name,
        color: selectedType.color,
        vertices,
        rotation: Math.random() * Math.PI * 2
      });
    }

    // Initialize sea spray particles
    this.seaParticles = [];
    for (let p = 0; p < this.maxSeaParticles; p++) {
      this.seaParticles.push({
        x: Math.random() * (this.width * this.splitRatio),
        y: this.height * (0.3 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 30,
        radius: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
        life: Math.random()
      });
    }
  }

  // =========================================================================
  // CRACK INDUCTION & FRACTURE MECHANICS
  // =========================================================================
  induceCrack() {
    this.crackShockwave = 1.0;
    this.structuralIntegrity = Math.max(0.35, this.structuralIntegrity - 0.45);
    this.healedRatio = 0.0;

    // Reset microscopic crystallization upon severe fracture
    this.crystalNeedles = [];
    this.initMicroGrid();

    // Generate tortuous crack trajectory through the macroscopic block
    // Cracks follow paths of least resistance through the pozzolanic mortar, deflecting around hard basalt
    this.cracks = [];
    const numCrackBranches = 1 + (Math.random() > 0.4 ? 1 : 0);

    for (let b = 0; b < numCrackBranches; b++) {
      const crackNodes = [];
      let curX = 0.2 + Math.random() * 0.6; // Entry point at top/side
      let curY = 0.05 + b * 0.15;
      crackNodes.push({ x: curX, y: curY });

      const steps = 12 + Math.floor(Math.random() * 8);
      for (let s = 0; s < steps; s++) {
        curY += (0.90 - curY) / (steps - s) * (0.8 + Math.random() * 0.4);
        curX += (Math.random() - 0.5) * 0.14;
        curX = Math.max(0.12, Math.min(0.88, curX));
        crackNodes.push({ x: curX, y: Math.min(0.96, curY) });
      }

      this.cracks.push({
        nodes: crackNodes,
        width: 3.5 + Math.random() * 3.0,
        infiltrated: 0.0, // Seawater infiltration progress [0, 1]
        healed: 0.0 // Tobermorite crystal bridging progress [0, 1]
      });
    }

    this.playAudioTone('crack');
  }

  // =========================================================================
  // MICROSCOPIC CELLULAR AUTOMATA INITIALIZATION
  // =========================================================================
  initMicroGrid() {
    const W = this.microGridW;
    const H = this.microGridH;
    const total = W * H;

    // Clear chemical fields
    this.caFieldCa.fill(0);
    this.caFieldSiAl.fill(0);
    this.caFieldWater.fill(0);
    this.caFieldMineral.fill(0);

    // Populate boundary walls with reactive lime clasts and pozzolanic ash
    // Top wall: y < H * 0.32
    // Bottom wall: y > H * 0.68
    // Middle zone: crack channel / pore fluid void
    const crackTop = Math.floor(H * (0.5 - this.microCrackGap * 0.5));
    const crackBot = Math.floor(H * (0.5 + this.microCrackGap * 0.5));

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const isUpperWall = y <= crackTop;
        const isLowerWall = y >= crackBot;

        if (isUpperWall || isLowerWall) {
          // Pozzolanic matrix with discrete white lime clasts
          const isLimeClast = (x % 9 === 3 || x % 13 === 7) && Math.random() < 0.45;
          if (isLimeClast) {
            this.caFieldCa[idx] = 1.0; // Rich Calcium reservoir
            this.caFieldSiAl[idx] = 0.2;
          } else {
            this.caFieldSiAl[idx] = 0.85 * this.pozzolanaRatio; // Amorphous silica & alumina
            this.caFieldCa[idx] = 0.15;
          }
          this.caFieldWater[idx] = 0.2; // Bound hydrate water
        } else {
          // Crack fissure void filled with seawater electrolyte
          this.caFieldWater[idx] = this.waterSaturation;
          this.caFieldCa[idx] = 0.05;
          this.caFieldSiAl[idx] = 0.05;
        }
      }
    }
  }

  // =========================================================================
  // SIMULATION UPDATE LOOP
  // =========================================================================
  update(dt) {
    // Guard against large time steps or NaN
    const step = Math.min(dt || 0.016, 0.05);
    this.time += step;
    this.waveTime += step * 2.2;

    if (this.crackShockwave > 0) {
      this.crackShockwave = Math.max(0, this.crackShockwave - step * 2.5);
    }

    // 1. Update Macroscopic Seawater Dynamics & Crack Infiltration
    this.updateMacroSeawater(step);

    // 2. Update Chemical Cellular Automata (Ion Diffusion & Reaction)
    this.updateChemicalCA(step);

    // 3. Update Aluminum-Tobermorite Needle Growth & Interlocking
    this.updateCrystalNeedles(step);

    // 4. Calculate Structural Healing & Strength Recovery
    this.updateStructuralHealing(step);
  }

  updateMacroSeawater(dt) {
    // Dynamic tide height
    const targetTide = this.isSubmerged ? 0.18 : 0.48;
    this.tideLevel += (targetTide - this.tideLevel) * dt * 2.0;

    // Seawater infiltration into macroscopic fractures
    for (const crack of this.cracks) {
      if (this.isSubmerged || this.waterSaturation > 0.4) {
        crack.infiltrated = Math.min(1.0, crack.infiltrated + dt * (0.35 + this.waterSaturation * 0.4));
      }
      // Macro healing tracks micro healed ratio
      crack.healed = Math.min(1.0, crack.healed + (this.healedRatio - crack.healed) * dt * 1.5);
    }

    // Animate sea spray particles
    const splitX = this.width * this.splitRatio;
    for (const p of this.seaParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt * 0.8;
      if (p.life > 1.0 || p.y > this.height) {
        p.life = 0;
        p.x = Math.random() * splitX;
        p.y = this.height * (this.tideLevel + Math.sin(this.waveTime + p.x * 0.02) * 0.05) + Math.random() * 20;
        p.vx = (Math.random() - 0.5) * 35;
        p.vy = -15 - Math.random() * 45;
        p.alpha = 0.3 + Math.random() * 0.5;
      }
    }
  }

  updateChemicalCA(dt) {
    const W = this.microGridW;
    const H = this.microGridH;
    const crackTop = Math.floor(H * (0.5 - this.microCrackGap * 0.5));
    const crackBot = Math.floor(H * (0.5 + this.microCrackGap * 0.5));

    // Ion diffusion constants scaled by water saturation
    const diffRate = 0.45 * this.waterSaturation * dt;
    const pozzolanaFactor = this.pozzolanaRatio;

    // Quick single-pass ion dissolution and diffusion
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = y * W + x;
        const inCrack = y > crackTop && y < crackBot;

        if (inCrack) {
          // Pore fluid receives diffusing Ca2+ from lime clasts and Si/Al from pozzolana
          this.caFieldWater[idx] = this.waterSaturation;

          // Simple 4-neighbor averaging for ion diffusion
          const left = idx - 1;
          const right = idx + 1;
          const up = idx - W;
          const down = idx + W;

          const avgCa = (this.caFieldCa[left] + this.caFieldCa[right] + this.caFieldCa[up] + this.caFieldCa[down]) * 0.25;
          const avgSiAl = (this.caFieldSiAl[left] + this.caFieldSiAl[right] + this.caFieldSiAl[up] + this.caFieldSiAl[down]) * 0.25;

          this.caFieldCa[idx] += (avgCa - this.caFieldCa[idx]) * diffRate;
          this.caFieldSiAl[idx] += (avgSiAl - this.caFieldSiAl[idx]) * diffRate * (0.8 + pozzolanaFactor * 0.4);

          // Chemical reaction forming Aluminum-Tobermorite:
          // Reaction occurs when both Ca2+ and Si/Al are present in the presence of seawater
          const reactionPotential = this.caFieldCa[idx] * this.caFieldSiAl[idx] * this.waterSaturation;
          if (reactionPotential > 0.035 && this.caFieldMineral[idx] < 1.0) {
            const formed = reactionPotential * dt * 0.85;
            this.caFieldMineral[idx] = Math.min(1.0, this.caFieldMineral[idx] + formed);
            this.caFieldCa[idx] = Math.max(0, this.caFieldCa[idx] - formed * 0.4);
            this.caFieldSiAl[idx] = Math.max(0, this.caFieldSiAl[idx] - formed * 0.5);

            // Spontaneous crystal needle nucleation along crack boundary
            if (this.crystalNeedles.length < this.maxNeedles && Math.random() < 0.22) {
              const fromTop = Math.random() > 0.5;
              this.spawnNeedleAt(x / W, fromTop ? 0.32 : 0.68, fromTop ? Math.PI * 0.5 : -Math.PI * 0.5);
            }
          }
        } else {
          // Boundary walls slowly dissolve ions into adjacent pore fluid
          if (this.waterSaturation > 0.1) {
            this.caFieldCa[idx] = Math.min(1.0, this.caFieldCa[idx] + dt * 0.05);
            this.caFieldSiAl[idx] = Math.min(1.0, this.caFieldSiAl[idx] + dt * 0.05 * pozzolanaFactor);
          }
        }
      }
    }
  }

  spawnNeedleAt(relX, relY, baseAngle) {
    if (this.crystalNeedles.length >= this.maxNeedles) return;

    // Platy / acicular needle-like crystal habit of Al-Tobermorite
    const spread = (Math.random() - 0.5) * 1.1;
    const angle = baseAngle + spread;
    const maxLen = 0.15 + Math.random() * 0.32; // Normalized length in microscope view
    const growthRate = (0.04 + Math.random() * 0.08) * (0.5 + this.waterSaturation * 0.7) * (0.6 + this.pozzolanaRatio * 0.8);

    this.crystalNeedles.push({
      startX: relX,
      startY: relY,
      angle,
      length: 0.01,
      maxLength: maxLen,
      growthRate,
      thickness: 1.2 + Math.random() * 1.8,
      segments: 1 + Math.floor(Math.random() * 3),
      interlocked: false,
      colorTint: Math.random() > 0.4 ? '#FAFAFA' : '#88D49E' // Lime White or Sea Foam crystal sheen
    });
  }

  updateCrystalNeedles(dt) {
    let activeBridges = 0;

    for (let i = 0; i < this.crystalNeedles.length; i++) {
      const needle = this.crystalNeedles[i];
      if (needle.length < needle.maxLength) {
        needle.length += needle.growthRate * dt;
        if (needle.length >= needle.maxLength) {
          needle.length = needle.maxLength;
          // Spawn branching daughter needles (felted crystal mesh)
          if (this.crystalNeedles.length < this.maxNeedles && Math.random() < 0.35) {
            const branchAng = needle.angle + (Math.random() > 0.5 ? 0.85 : -0.85);
            const tipX = needle.startX + Math.cos(needle.angle) * needle.length;
            const tipY = needle.startY + Math.sin(needle.angle) * needle.length;
            this.spawnNeedleAt(tipX, tipY, branchAng);
          }
        }
      }

      // Check for needle reaching across the crack gap to form interlocking crystal bridge
      const currentY = needle.startY + Math.sin(needle.angle) * needle.length;
      if (!needle.interlocked) {
        if ((needle.startY < 0.5 && currentY >= 0.58) || (needle.startY > 0.5 && currentY <= 0.42)) {
          needle.interlocked = true;
          this.playAudioTone('crystallize');
        }
      }

      if (needle.interlocked || needle.length > 0.18) {
        activeBridges++;
      }
    }

    // Calculate healed gap percentage
    const targetRatio = Math.min(1.0, activeBridges / Math.max(1, this.maxNeedles * 0.38));
    this.healedRatio += (targetRatio - this.healedRatio) * dt * 2.0;
  }

  updateStructuralHealing(dt) {
    // Structural integrity recovers as Al-tobermorite crystal needle mesh bridges the fracture
    const targetIntegrity = 0.35 + this.healedRatio * 0.65;
    if (this.structuralIntegrity < targetIntegrity) {
      this.structuralIntegrity += dt * 0.15;
      if (this.structuralIntegrity > targetIntegrity) {
        this.structuralIntegrity = targetIntegrity;
      }
    }
  }

  // =========================================================================
  // ENTITY COUNT ARCHITECTURE REQUIREMENT
  // "Entity Count: Active aggregate particles + crystal needle segments."
  // =========================================================================
  getEntityCount() {
    let needleSegmentsCount = 0;
    for (let i = 0; i < this.crystalNeedles.length; i++) {
      needleSegmentsCount += this.crystalNeedles[i].segments;
    }
    const total = this.aggregates.length + needleSegmentsCount;
    return Math.max(1, total);
  }

  // =========================================================================
  // RENDERING PIPELINE
  // =========================================================================
  render(ctx) {
    const w = this.width;
    const h = this.height;

    // Clear canvas with dark Roman basaltic backdrop
    ctx.save();
    ctx.fillStyle = '#161514';
    ctx.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * this.splitRatio);

    // 1. Render Left View: Macroscopic Roman Breakwater Block
    this.renderMacroscopicBreakwater(ctx, 0, 0, splitX, h);

    // 2. Render Vertical Architectural Divider
    this.renderDivider(ctx, splitX, h);

    // 3. Render Right View: Microscopic Crystalline Matrix & Needle Mesh
    this.renderMicroscopicMatrix(ctx, splitX, 0, w - splitX, h);

    // 4. Render Telemetry HUD Overlay
    this.renderHUD(ctx);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // MACROSCOPIC RENDERING (Breakwater Block, Sea, Cracks, Formwork)
  // -------------------------------------------------------------------------
  renderMacroscopicBreakwater(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    // Sky & atmospheric marine background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#10161C');
    skyGrad.addColorStop(0.5, '#1B2730');
    skyGrad.addColorStop(1, '#0C1C24');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(x, y, width, height);

    // Seafloor bedrock / Pozzolanic volcanic shelf
    const seaFloorY = height - 35;
    ctx.fillStyle = '#22211F';
    ctx.fillRect(x, seaFloorY, width, 35);
    ctx.fillStyle = '#383531';
    for (let bx = x; bx < x + width; bx += 24) {
      ctx.fillRect(bx, seaFloorY, 20, 4);
    }

    // Roman Concrete Breakwater Monolith (Pila)
    const bx = this.blockX;
    const by = this.blockY;
    const bw = this.blockW;
    const bh = this.blockH;

    // Breakwater Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(bx - 6, by + 10, bw + 12, bh);

    // Volcanic Ash Concrete Paste Matrix (#4B4B4B)
    ctx.fillStyle = '#4B4B4B';
    ctx.fillRect(bx, by, bw, bh);

    // Concrete texture mottling (pozzolanic grain)
    ctx.fillStyle = 'rgba(250, 250, 250, 0.04)';
    for (let ty = by; ty < by + bh; ty += 12) {
      for (let tx = bx; tx < bx + bw; tx += 12) {
        if ((tx + ty) % 5 === 0) {
          ctx.fillRect(tx, ty, 6, 6);
        }
      }
    }

    // Wooden Formwork Staves (Arca Caementicia) on left/right edges
    this.renderFormwork(ctx, bx, by, bw, bh);

    // Render Embedded Aggregate Particles (Caementa)
    this.renderAggregates(ctx, bx, by, bw, bh);

    // Render Structural Stress Fractures & Seawater Infiltration
    this.renderCracks(ctx, bx, by, bw, bh);

    // Render Dynamic Tyrrhenian Seawater with animated waves and foam
    this.renderSeawater(ctx, x, width, height);

    // Shockwave pulse if crack was recently induced
    if (this.crackShockwave > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 80, 80, ${this.crackShockwave * 0.7})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(bx - 4, by - 4, bw + 8, bh + 8);
      ctx.restore();
    }

    // Panel Header Banner
    this.renderPanelBanner(
      ctx,
      x + 16,
      28,
      '🏛️ MACROSCOPIC: PILA SUBMARINA',
      'Roman Marine Breakwater Block (Pozzolana + Lime + Tuff)'
    );

    // Macro Strength & Integrity Bar
    this.renderIntegrityGauge(ctx, bx, by + bh + 10, bw);

    ctx.restore();
  }

  renderFormwork(ctx, bx, by, bw, bh) {
    // Vitruvian submerged oak timber caisson (*arca*)
    ctx.save();
    const staveW = 10;
    // Left timber pile
    ctx.fillStyle = '#3E2A1E';
    ctx.fillRect(bx - staveW, by, staveW, bh);
    ctx.fillStyle = '#5A3E2C';
    ctx.fillRect(bx - staveW + 2, by, staveW - 4, bh);

    // Right timber pile
    ctx.fillStyle = '#3E2A1E';
    ctx.fillRect(bx + bw, by, staveW, bh);
    ctx.fillStyle = '#5A3E2C';
    ctx.fillRect(bx + bw + 2, by, staveW - 4, bh);

    // Bronze tie-bands clamping formwork
    ctx.fillStyle = '#8B6A2B';
    const bands = 5;
    for (let b = 1; b <= bands; b++) {
      const bandY = by + (bh / (bands + 1)) * b;
      ctx.fillRect(bx - staveW - 2, bandY - 3, staveW + 2, 6);
      ctx.fillRect(bx + bw, bandY - 3, staveW + 2, 6);
      // Bolt heads
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(bx - staveW * 0.5, bandY, 2, 0, Math.PI * 2);
      ctx.arc(bx + bw + staveW * 0.5, bandY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderAggregates(ctx, bx, by, bw, bh) {
    ctx.save();
    for (let i = 0; i < this.aggregates.length; i++) {
      const agg = this.aggregates[i];
      const posX = bx + agg.relX * bw;
      const posY = by + agg.relY * bh;

      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(agg.rotation);

      ctx.beginPath();
      const verts = agg.vertices;
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let v = 1; v < verts.length; v++) {
        ctx.lineTo(verts[v].x, verts[v].y);
      }
      ctx.closePath();

      ctx.fillStyle = agg.color;
      ctx.fill();

      // Aggregate rim highlight
      if (agg.type === 'lime_clast') {
        // Glowing halo around lime clasts representing calcium reservoir dissolution
        ctx.strokeStyle = '#FAFAFA';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  renderCracks(ctx, bx, by, bw, bh) {
    if (this.cracks.length === 0) return;

    ctx.save();
    for (let c = 0; c < this.cracks.length; c++) {
      const crack = this.cracks[c];
      const nodes = crack.nodes;
      if (nodes.length < 2) continue;

      // 1. Dark fracture void base
      ctx.beginPath();
      ctx.moveTo(bx + nodes[0].x * bw, by + nodes[0].y * bh);
      for (let n = 1; n < nodes.length; n++) {
        ctx.lineTo(bx + nodes[n].x * bw, by + nodes[n].y * bh);
      }
      ctx.strokeStyle = '#121214';
      ctx.lineWidth = crack.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 2. Seawater infiltration seepage (#88D49E Sea Foam)
      if (crack.infiltrated > 0.05) {
        ctx.beginPath();
        const infilCount = Math.floor(nodes.length * crack.infiltrated);
        ctx.moveTo(bx + nodes[0].x * bw, by + nodes[0].y * bh);
        for (let n = 1; n <= infilCount && n < nodes.length; n++) {
          ctx.lineTo(bx + nodes[n].x * bw, by + nodes[n].y * bh);
        }
        ctx.strokeStyle = `rgba(136, 212, 158, ${0.4 + Math.sin(this.waveTime * 3) * 0.2})`;
        ctx.lineWidth = Math.max(1.5, crack.width * 0.7);
        ctx.stroke();
      }

      // 3. Crystalline Tobermorite self-healing bridges (#FAFAFA & #88D49E)
      if (crack.healed > 0.08) {
        ctx.save();
        ctx.strokeStyle = '#FAFAFA';
        ctx.lineWidth = crack.width * crack.healed;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  renderSeawater(ctx, x, width, height) {
    ctx.save();
    const seaY = height * this.tideLevel;

    // Animated multi-sine wave surface
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x, seaY);

    const stepPx = 10;
    for (let px = x; px <= x + width; px += stepPx) {
      const wave = Math.sin(this.waveTime + px * 0.035) * 6 + Math.cos(this.waveTime * 0.7 + px * 0.015) * 4;
      ctx.lineTo(px, seaY + wave);
    }
    ctx.lineTo(x + width, height);
    ctx.closePath();

    // Seawater gradient: Sea Foam to Tyrrhenian Deep Cyan
    const seaGrad = ctx.createLinearGradient(0, seaY, 0, height);
    seaGrad.addColorStop(0, 'rgba(136, 212, 158, 0.45)'); // #88D49E Sea Foam crest
    seaGrad.addColorStop(0.2, 'rgba(26, 75, 84, 0.75)');
    seaGrad.addColorStop(1, 'rgba(10, 30, 36, 0.90)');
    ctx.fillStyle = seaGrad;
    ctx.fill();

    // Foam wave crest highlight (#88D49E)
    ctx.strokeStyle = '#88D49E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = x; px <= x + width; px += stepPx) {
      const wave = Math.sin(this.waveTime + px * 0.035) * 6 + Math.cos(this.waveTime * 0.7 + px * 0.015) * 4;
      if (px === x) ctx.moveTo(px, seaY + wave);
      else ctx.lineTo(px, seaY + wave);
    }
    ctx.stroke();

    // Animated sea foam particles & bubbles
    for (let i = 0; i < this.seaParticles.length; i++) {
      const p = this.seaParticles[i];
      ctx.fillStyle = `rgba(136, 212, 158, ${p.alpha * (1 - p.life)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderIntegrityGauge(ctx, x, y, width) {
    ctx.save();
    const h = 14;

    // Gauge container
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, width, h);
    ctx.strokeStyle = '#88D49E';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, h);

    // Fill bar
    const fillW = Math.max(0, width * this.structuralIntegrity);
    const fillGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    fillGrad.addColorStop(0, '#C83232'); // Red if cracked
    fillGrad.addColorStop(0.5, '#D4AF37'); // Gold intermediate
    fillGrad.addColorStop(1, '#88D49E'); // Sea Foam full strength

    ctx.fillStyle = fillGrad;
    ctx.fillRect(x + 1, y + 1, fillW - 2, h - 2);

    // Label
    ctx.font = '10px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    const mpa = (15 + this.structuralIntegrity * 25).toFixed(1);
    ctx.fillText(`FRACTURE INTEGRITY: ${(this.structuralIntegrity * 100).toFixed(0)}% (${mpa} MPa Compressive)`, x + width * 0.5, y + 11);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // ARCHITECTURAL SPLIT-SCREEN DIVIDER
  // -------------------------------------------------------------------------
  renderDivider(ctx, splitX, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'; // Gold border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(splitX, 15);
    ctx.lineTo(splitX, height - 15);
    ctx.stroke();

    // Central Roman medaillon
    ctx.fillStyle = '#1A1918';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    const midY = height * 0.5;
    ctx.beginPath();
    ctx.arc(splitX, midY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', splitX, midY);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // MICROSCOPIC CRYSTALLINE RENDERING (Scanning Electron View)
  // -------------------------------------------------------------------------
  renderMicroscopicMatrix(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    // SEM Electron Microscope Aperture background
    const bgGrad = ctx.createRadialGradient(x + width * 0.5, y + height * 0.5, 40, x + width * 0.5, y + height * 0.5, width * 0.6);
    bgGrad.addColorStop(0, '#121415');
    bgGrad.addColorStop(1, '#090A0B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(x, y, width, height);

    const px = this.microPanelX;
    const py = this.microPanelY;
    const pw = this.microPanelW;
    const ph = this.microPanelH;

    // Microscopic Reticle Frame
    ctx.strokeStyle = 'rgba(136, 212, 158, 0.35)'; // Sea Foam
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, pw, ph);

    // Render Cellular Automata Chemical & Mineral Concentrations
    this.renderMicroCAField(ctx, px, py, pw, ph);

    // Render Aluminum-Tobermorite Needle Network
    this.renderNeedleNetwork(ctx, px, py, pw, ph);

    // Micro Reticle Crosshairs and Micron Scale Bar (50 μm)
    this.renderMicroReticle(ctx, px, py, pw, ph);

    // Panel Header Banner
    this.renderPanelBanner(
      ctx,
      x + 16,
      28,
      '🔬 MICROSCOPIC: TOBERMORITE CA',
      'Pozzolana + Lime + Seawater → Al-Tobermorite Crystal Needles'
    );

    // Chemical Reaction Formula Banner at bottom
    this.renderChemicalFormulaBanner(ctx, px, py + ph + 8, pw);

    ctx.restore();
  }

  renderMicroCAField(ctx, px, py, pw, ph) {
    ctx.save();
    const W = this.microGridW;
    const H = this.microGridH;
    const cellW = pw / W;
    const cellH = ph / H;

    const crackTop = Math.floor(H * (0.5 - this.microCrackGap * 0.5));
    const crackBot = Math.floor(H * (0.5 + this.microCrackGap * 0.5));

    // Draw boundary walls: Pozzolanic Ash Grey (#4B4B4B) with Lime White (#FAFAFA) clasts
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const cx = px + x * cellW;
        const cy = py + y * cellH;

        if (y <= crackTop || y >= crackBot) {
          // Wall matrix: Pozzolanic volcanic ash
          const caVal = this.caFieldCa[idx];
          if (caVal > 0.8) {
            // Relict Lime Clast (#FAFAFA)
            ctx.fillStyle = '#FAFAFA';
          } else {
            // Volcanic Ash Matrix (#4B4B4B with local variance)
            const ashShade = Math.floor(65 + this.caFieldSiAl[idx] * 30);
            ctx.fillStyle = `rgb(${ashShade}, ${ashShade}, ${ashShade})`;
          }
          ctx.fillRect(cx, cy, cellW + 0.5, cellH + 0.5);
        } else {
          // Pore fluid in crack gap with dissolved ions (#88D49E Sea Foam tint)
          const moisture = this.caFieldWater[idx];
          const mineral = this.caFieldMineral[idx];
          const ionSum = (this.caFieldCa[idx] + this.caFieldSiAl[idx]) * 0.5;

          if (mineral > 0.1) {
            // Precipitated Tobermorite micro-mass
            ctx.fillStyle = `rgba(200, 242, 224, ${mineral * 0.75})`;
            ctx.fillRect(cx, cy, cellW + 0.5, cellH + 0.5);
          } else if (moisture > 0.1) {
            // Seawater electrolyte buffer
            const alpha = 0.15 + ionSum * 0.35;
            ctx.fillStyle = `rgba(136, 212, 158, ${alpha})`;
            ctx.fillRect(cx, cy, cellW + 0.5, cellH + 0.5);
          }
        }
      }
    }
    ctx.restore();
  }

  renderNeedleNetwork(ctx, px, py, pw, ph) {
    ctx.save();
    for (let i = 0; i < this.crystalNeedles.length; i++) {
      const needle = this.crystalNeedles[i];
      const startX = px + needle.startX * pw;
      const startY = py + needle.startY * ph;
      const endX = startX + Math.cos(needle.angle) * (needle.length * pw);
      const endY = startY + Math.sin(needle.angle) * (needle.length * ph);

      // Crystalline Needle Spine (Lustrous white / sea-foam taper)
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      if (needle.interlocked) {
        // Interlocked crystal needle bridge: glowing luminous Sea Foam / Lime White
        ctx.strokeStyle = needle.colorTint === '#FAFAFA' ? '#FAFAFA' : '#88D49E';
        ctx.lineWidth = needle.thickness + 0.8;
        ctx.shadowColor = '#88D49E';
        ctx.shadowBlur = 6;
      } else {
        ctx.strokeStyle = needle.colorTint;
        ctx.lineWidth = needle.thickness;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Sharp crystalline diamond facet at needle tip
      ctx.beginPath();
      ctx.arc(endX, endY, needle.thickness * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
    ctx.restore();
  }

  renderMicroReticle(ctx, px, py, pw, ph) {
    ctx.save();
    // Subtle crosshairs
    const midX = px + pw * 0.5;
    const midY = py + ph * 0.5;

    ctx.strokeStyle = 'rgba(136, 212, 158, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(px + 10, midY);
    ctx.lineTo(px + pw - 10, midY);
    ctx.moveTo(midX, py + 10);
    ctx.lineTo(midX, py + ph - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Micron Scale Bar: 50 μm in bottom-right corner of microscope view
    const barW = Math.min(80, pw * 0.25);
    const barX = px + pw - barW - 14;
    const barY = py + ph - 16;

    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(barX, barY, barW, 3);
    ctx.fillRect(barX, barY - 4, 2, 8);
    ctx.fillRect(barX + barW - 2, barY - 4, 2, 8);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#88D49E';
    ctx.textAlign = 'center';
    ctx.fillText('50 μm (SEM)', barX + barW * 0.5, barY - 6);

    // Crack healing ratio readout in top-right of reticle
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FAFAFA';
    ctx.fillText(`HEALED: ${(this.healedRatio * 100).toFixed(1)}%`, px + pw - 10, py + 18);
    ctx.fillStyle = '#88D49E';
    ctx.fillText(`NEEDLES: ${this.crystalNeedles.length}`, px + pw - 10, py + 32);

    ctx.restore();
  }

  renderChemicalFormulaBanner(ctx, x, y, width) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(x, y, width, 20);
    ctx.strokeStyle = 'rgba(136, 212, 158, 0.3)';
    ctx.strokeRect(x, y, width, 20);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#88D49E';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Ca(OH)₂ [Lime] + SiO₂/Al₂O₃ [Pozzolana] + Seawater ⟶ Al-Tobermorite [Self-Heal]',
      x + width * 0.5,
      y + 14
    );
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // HUD & BANNER OVERLAYS
  // -------------------------------------------------------------------------
  renderPanelBanner(ctx, x, y, title, subtitle) {
    ctx.save();
    const narrow = (this.width / this.uiScale()) < 560;
    ctx.font = narrow ? 'bold 10px monospace' : 'bold 12px monospace';
    ctx.fillStyle = '#D4AF37'; // Gold
    ctx.fillText(narrow ? title.split(':')[0] : title, x, y);

    if (!narrow) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#A0A0A0';
      ctx.fillText(subtitle, x, y + 14);
    }
    ctx.restore();
  }

  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    // Top-center Roman Pliny quotation banner
    ctx.font = narrow ? 'italic 9.5px Georgia, serif' : 'italic 11px Georgia, serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
    ctx.textAlign = 'center';
    ctx.fillText(
      narrow ? 'OPUS CAEMENTICIUM — Pliny (NH XXXV.47)' : '"The moment it touches the sea and is submerged, it becomes a stone..." — Pliny (NH XXXV.47)',
      sw * 0.5,
      14
    );
    ctx.restore();
  }

  // =========================================================================
  // DOM CONTROLS BUILDER (SAFE HEADLESS DOM GUARD)
  // =========================================================================
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.controlsContainer.style.color = '#e0dacb';
    this.controlsContainer.style.fontFamily = "'Cinzel', 'JetBrains Mono', Georgia, monospace";
    this.controlsContainer.style.fontSize = '12px';

    // 1. Slider: Pozzolana Ratio
    this.addSlider(
      'Pozzolana Ratio (Volcanic Ash)',
      10,
      90,
      1,
      Math.round(this.pozzolanaRatio * 100),
      (val) => `${val}% Puteoli Ash`,
      (val) => {
        this.pozzolanaRatio = val / 100;
      }
    );

    // 2. Slider: Water Saturation
    this.addSlider(
      'Water Saturation (Seawater)',
      0,
      100,
      1,
      Math.round(this.waterSaturation * 100),
      (val) => `${val}% Saturation`,
      (val) => {
        this.waterSaturation = val / 100;
      }
    );

    // 3. Action Buttons Group
    const actionGroup = document.createElement('div');
    actionGroup.className = 'control-group';
    actionGroup.style.marginTop = '10px';
    actionGroup.style.display = 'flex';
    actionGroup.style.flexDirection = 'column';
    actionGroup.style.gap = '8px';

    // Button: Induce Crack
    const crackBtn = document.createElement('button');
    crackBtn.className = 'sub-btn';
    crackBtn.style.background = 'rgba(200, 50, 50, 0.25)';
    crackBtn.style.border = '1px solid #C83232';
    crackBtn.style.color = '#FF9999';
    crackBtn.style.fontWeight = 'bold';
    crackBtn.style.padding = '8px';
    crackBtn.style.cursor = 'pointer';
    crackBtn.textContent = '⚡ Induce Crack (Space)';
    crackBtn.addEventListener('click', () => {
      this.induceCrack();
    });
    actionGroup.appendChild(crackBtn);

    // Button: Submerge in Seawater
    const submergeBtn = document.createElement('button');
    submergeBtn.className = 'sub-btn';
    submergeBtn.style.background = 'rgba(136, 212, 158, 0.2)';
    submergeBtn.style.border = '1px solid #88D49E';
    submergeBtn.style.color = '#88D49E';
    submergeBtn.style.fontWeight = 'bold';
    submergeBtn.style.padding = '8px';
    submergeBtn.style.cursor = 'pointer';
    submergeBtn.textContent = this.isSubmerged ? '🌊 Submerged (Click to Drain)' : '🌊 Submerge in Seawater';
    submergeBtn.addEventListener('click', () => {
      this.isSubmerged = !this.isSubmerged;
      submergeBtn.textContent = this.isSubmerged ? '🌊 Submerged (Click to Drain)' : '🌊 Submerge in Seawater';
      this.waterSaturation = this.isSubmerged ? 0.95 : 0.35;
      this.playAudioTone('splash');
    });
    actionGroup.appendChild(submergeBtn);

    // Button: Pour Fresh Batch
    const resetBtn = document.createElement('button');
    resetBtn.className = 'sub-btn';
    resetBtn.style.border = '1px solid #D4AF37';
    resetBtn.style.padding = '7px';
    resetBtn.style.cursor = 'pointer';
    resetBtn.textContent = '🏺 Pour Fresh Aggregate Batch';
    resetBtn.addEventListener('click', () => {
      this.reset();
    });
    actionGroup.appendChild(resetBtn);

    this.controlsContainer.appendChild(actionGroup);
  }

  addSlider(title, min, max, step, initialVal, formatFn, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'control-group';
    wrap.style.marginBottom = '10px';

    const lbl = document.createElement('label');
    lbl.style.display = 'flex';
    lbl.style.justifyContent = 'space-between';
    lbl.style.marginBottom = '4px';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    const valSpan = document.createElement('span');
    valSpan.textContent = formatFn(initialVal);
    valSpan.style.color = '#88D49E';
    valSpan.style.fontWeight = 'bold';

    lbl.appendChild(titleSpan);
    lbl.appendChild(valSpan);

    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = min;
    inp.max = max;
    inp.step = step;
    inp.value = initialVal;
    inp.style.width = '100%';
    inp.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valSpan.textContent = formatFn(val);
      onChange(val);
    });

    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    this.controlsContainer.appendChild(wrap);
  }

  // =========================================================================
  // RESET & DESTROY LIFECYCLE
  // =========================================================================
  reset() {
    this.pozzolanaRatio = 0.58;
    this.waterSaturation = 0.85;
    this.isSubmerged = true;
    this.structuralIntegrity = 1.0;
    this.healedRatio = 0.0;
    this.crystalNeedles = [];
    this.cracks = [];

    this.initMacroAggregates();
    this.initMicroGrid();
    this.induceCrack();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer && typeof document !== 'undefined') {
      this.controlsContainer.innerHTML = '';
    }
    this.aggregates = [];
    this.crystalNeedles = [];
    this.cracks = [];
    this.seaParticles = [];
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }

  // =========================================================================
  // USER INPUT HANDLERS
  // =========================================================================
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = pos;
    const splitX = this.width * this.splitRatio;

    if (pos.x < splitX) {
      // Left side click: strike breakwater block / induce crack
      this.induceCrack();
    } else {
      // Right side click: seed crystal nucleation cluster in microscope view
      const relX = (pos.x - this.microPanelX) / this.microPanelW;
      const relY = (pos.y - this.microPanelY) / this.microPanelH;
      if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
        for (let k = 0; k < 6; k++) {
          this.spawnNeedleAt(relX, relY, Math.random() * Math.PI * 2);
        }
        this.playAudioTone('crystallize');
      }
    }
  }

  onMouseMove(pos) {
    this.mousePos = pos;
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      if (e && e.preventDefault) e.preventDefault();
      this.induceCrack();
    } else if (key === 's' || key === 'S') {
      this.isSubmerged = !this.isSubmerged;
      this.waterSaturation = this.isSubmerged ? 0.95 : 0.35;
      this.playAudioTone('splash');
    } else if (key === 'r' || key === 'R') {
      this.reset();
    }
  }

  onKeyUp() {}

  // =========================================================================
  // OPTIONAL LAZY AUDIO SYNTHESIS
  // =========================================================================
  initAudio() {
    if (this.audioInitialized) return;
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      this.audioCtx = new window.AudioContext();
      this.audioInitialized = true;
    } catch (_) {}
  }

  playAudioTone(type) {
    this.initAudio();
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      if (type === 'crack') {
        // Low sharp transient crack sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'crystallize') {
        // High ethereal crystalline chime
        osc.type = 'sine';
        const freqs = [880, 1174.66, 1318.51, 1760];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'splash') {
        // Water surge sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      }
    } catch (_) {}
  }
}
