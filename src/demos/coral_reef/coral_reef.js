// Pliny Game Lab — Coral Reef (DLA Biomineralization & Marine Ecology)
// Diffusion-Limited Aggregation (DLA) branching calcification with Brownian nutrient ions,
// schooling tropical boids, dynamic water caustics, and bioluminescent pulse dynamics.

export class CoralReefEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation Timing
    this.time = 0;
    this.lastFrameTime = 0;

    // Core Parameters (interactive sliders & controls)
    this.nutrientSaturation = 320; // Number of free Brownian nutrient ions (100 - 800)
    this.currentFlow = 0.65;       // Cross-current drift velocity (-2.5 to +2.5)
    this.currentAngle = 0;         // Angle of current (radians: 0 = East/Right)
    this.growthStickiness = 0.85;  // Probability of DLA aggregation on contact
    this.selectedSpecies = 'cyan'; // 'cyan' | 'magenta' | 'gold'
    this.showCaustics = true;
    this.showGodRays = true;
    this.showNutrientTrails = true;

    // Species Color Palette Specifications
    // Spec: Neon Cyan #00F0FF, Magenta #FF007F, Gold #FFD700
    this.speciesConfig = {
      cyan: {
        id: 'cyan',
        name: 'Staghorn Coral (Acropora)',
        primaryColor: '#00F0FF',
        glowColor: 'rgba(0, 240, 255, 0.85)',
        coreColor: '#E0FFFF',
        polypColor: '#70FFFF',
        branchTendencyY: -1.2, // Strong upward vertical phototropism
        branchSpreadX: 0.6,
        maxBranchLevel: 18,
        segmentLength: 7.0,
        baseRadius: 6.5,
        tipRadius: 2.2
      },
      magenta: {
        id: 'magenta',
        name: 'Sea Fan (Gorgonacea)',
        primaryColor: '#FF007F',
        glowColor: 'rgba(255, 0, 127, 0.85)',
        coreColor: '#FFE4E1',
        polypColor: '#FF69B4',
        branchTendencyY: -0.8, // Lateral fan spread
        branchSpreadX: 1.4,
        maxBranchLevel: 22,
        segmentLength: 6.0,
        baseRadius: 5.5,
        tipRadius: 1.8
      },
      gold: {
        id: 'gold',
        name: 'Brain Coral (Diploria)',
        primaryColor: '#FFD700',
        glowColor: 'rgba(255, 215, 0, 0.85)',
        coreColor: '#FFFACD',
        polypColor: '#FFA500',
        branchTendencyY: -0.4, // Dense mounding hemispherical accretion
        branchSpreadX: 1.1,
        maxBranchLevel: 16,
        segmentLength: 5.0,
        baseRadius: 8.0,
        tipRadius: 3.0
      }
    };

    // DLA Coral Skeleton Data Structures
    this.coralNodes = [];
    this.polypSeeds = [];
    this.cellSize = 24;
    this.spatialGrid = new Map(); // key "cx,cy" -> array of node indices

    // Nutrients (Brownian Walkers)
    this.nutrients = [];

    // Schooling Fish (Boids)
    this.fish = [];
    this.maxFish = 48;

    // Particle FX (Calcification sparks, Plankton, Bioluminescent pulses)
    this.calcificationSparks = [];
    this.pulses = [];
    this.plankton = [];

    // Seabed Topography
    this.seabedHeightmap = [];
    this.seabedDetail = 64;

    // Interaction State
    this.mouse = { x: this.width * 0.5, y: this.height * 0.5, isDown: false, lastX: 0, lastY: 0 };
    this.stats = {
      calcificationsTotal: 0,
      recentCalcRate: 0,
      recentCalcTimer: 0,
      recentCalcCount: 0
    };

    // Audio Engine (Safe Web Audio)
    this.audioCtx = null;
    this.initAudio();

    // Initialize Simulation Elements
    this.initSeabed();
    this.initCoralReef();
    this.initNutrients();
    this.initFish();
    this.initPlankton();

    // UI Controls Setup
    this.initControls();
  }

  /* -------------------------------------------------------------------------- */
  /* AUDIO SYNTHESIZER (PROCEDURAL UNDERWATER SOUNDS)                            */
  /* -------------------------------------------------------------------------- */
  initAudio() {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playCalcifySound(species) {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const baseFreq = species === 'cyan' ? 880 : (species === 'magenta' ? 660 : 520);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  playPulseSound() {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.6);
      osc.frequency.exponentialRampToValueAtTime(80, t + 1.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(2400, t + 0.5);
      filter.frequency.exponentialRampToValueAtTime(300, t + 1.6);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1.85);
    } catch (e) {}
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION HELPERS                                                     */
  /* -------------------------------------------------------------------------- */
  initSeabed() {
    this.seabedHeightmap = [];
    const pts = this.seabedDetail;
    const baseFloorY = this.height * 0.88;

    for (let i = 0; i <= pts; i++) {
      const frac = i / pts;
      const x = frac * this.width;
      // Multi-octave natural undulating ocean floor with coral ridges
      const wave1 = Math.sin(frac * Math.PI * 3.2 + 0.4) * 26;
      const wave2 = Math.sin(frac * Math.PI * 7.5 + 1.8) * 12;
      const wave3 = Math.cos(frac * Math.PI * 14.1) * 6;
      const y = baseFloorY + wave1 + wave2 + wave3;
      this.seabedHeightmap.push({ x, y });
    }
  }

  getSeabedY(x) {
    if (this.seabedHeightmap.length === 0) return this.height * 0.88;
    const frac = Math.max(0, Math.min(1, x / this.width));
    const indexFloat = frac * (this.seabedHeightmap.length - 1);
    const i0 = Math.floor(indexFloat);
    const i1 = Math.min(this.seabedHeightmap.length - 1, i0 + 1);
    const t = indexFloat - i0;
    return this.seabedHeightmap[i0].y * (1 - t) + this.seabedHeightmap[i1].y * t;
  }

  initCoralReef() {
    this.coralNodes = [];
    this.polypSeeds = [];
    this.spatialGrid.clear();

    // Plant 4 foundational polyps across the seabed with distinct neon species
    const seedSpecs = [
      { frac: 0.22, species: 'magenta', initialBranches: 14 },
      { frac: 0.46, species: 'cyan', initialBranches: 20 },
      { frac: 0.72, species: 'gold', initialBranches: 18 },
      { frac: 0.88, species: 'cyan', initialBranches: 12 }
    ];

    seedSpecs.forEach(spec => {
      const seedX = this.width * spec.frac;
      const seedY = this.getSeabedY(seedX) - 4;
      this.seedPolyp(seedX, seedY, spec.species, spec.initialBranches);
    });
  }

  seedPolyp(x, y, species = null, initialGrowthSteps = 0) {
    const sp = species || this.selectedSpecies;
    const cfg = this.speciesConfig[sp];

    const seedId = this.coralNodes.length;
    const baseNode = {
      id: seedId,
      parentId: null,
      x: x,
      y: y,
      radius: cfg.baseRadius,
      species: sp,
      branchLevel: 0,
      age: 0,
      pulseGlow: 0,
      tentaclePhase: Math.random() * Math.PI * 2,
      tentacleLength: 4 + Math.random() * 3,
      isTip: true,
      children: []
    };

    this.coralNodes.push(baseNode);
    this.insertSpatialGrid(baseNode, seedId);
    this.polypSeeds.push(seedId);

    // Bootstrap initial embryonic coral branch skeleton
    let currentTipId = seedId;
    for (let step = 0; step < initialGrowthSteps; step++) {
      const parentNode = this.coralNodes[currentTipId];
      parentNode.isTip = false;

      const angleSpread = (Math.random() - 0.5) * cfg.branchSpreadX;
      const angle = -Math.PI / 2 + angleSpread;
      const segLen = cfg.segmentLength * (0.8 + Math.random() * 0.4);

      const nextX = parentNode.x + Math.cos(angle) * segLen;
      const nextY = parentNode.y + Math.sin(angle) * segLen;

      const nextId = this.coralNodes.length;
      const nextLevel = parentNode.branchLevel + 1;
      const nextRadius = Math.max(cfg.tipRadius, cfg.baseRadius * (1 - (nextLevel / cfg.maxBranchLevel) * 0.7));

      const childNode = {
        id: nextId,
        parentId: parentNode.id,
        x: nextX,
        y: nextY,
        radius: nextRadius,
        species: sp,
        branchLevel: nextLevel,
        age: 0,
        pulseGlow: 0,
        tentaclePhase: Math.random() * Math.PI * 2,
        tentacleLength: 3 + Math.random() * 4,
        isTip: true,
        children: []
      };

      parentNode.children.push(nextId);
      this.coralNodes.push(childNode);
      this.insertSpatialGrid(childNode, nextId);

      // Branching probability for initial growth
      if (Math.random() < 0.35 && this.coralNodes.length > 2) {
        // Fork: choose random non-dead node to branch from next
        const candidates = this.coralNodes.filter(n => n.species === sp && n.branchLevel < cfg.maxBranchLevel);
        if (candidates.length > 0) {
          currentTipId = candidates[Math.floor(Math.random() * candidates.length)].id;
        } else {
          currentTipId = nextId;
        }
      } else {
        currentTipId = nextId;
      }
    }
  }

  // Spatial Grid Methods for O(1) DLA Collision Detection
  getGridKey(cx, cy) {
    return `${cx},${cy}`;
  }

  insertSpatialGrid(node, index) {
    const cx = Math.floor(node.x / this.cellSize);
    const cy = Math.floor(node.y / this.cellSize);
    const key = this.getGridKey(cx, cy);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key).push(index);
  }

  queryNearbyCoralNodes(x, y, radius) {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const nearbyIndices = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.getGridKey(cx, cy);
        const cell = this.spatialGrid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            nearbyIndices.push(cell[i]);
          }
        }
      }
    }
    return nearbyIndices;
  }

  initNutrients() {
    this.nutrients = [];
    const count = this.nutrientSaturation;
    for (let i = 0; i < count; i++) {
      this.nutrients.push(this.spawnNutrientIon(true));
    }
  }

  spawnNutrientIon(scatterAllOver = false) {
    let x, y;
    if (scatterAllOver) {
      x = Math.random() * this.width;
      y = Math.random() * (this.height * 0.85);
    } else {
      // Spawn preferentially upstream of the ocean current or from upper sunlit photic zone
      if (this.currentFlow >= 0) {
        x = Math.random() < 0.75 ? -10 + Math.random() * 20 : Math.random() * this.width;
      } else {
        x = Math.random() < 0.75 ? this.width + 10 - Math.random() * 20 : Math.random() * this.width;
      }
      y = Math.random() < 0.7 ? 10 + Math.random() * (this.height * 0.45) : Math.random() * (this.height * 0.82);
    }

    // Affinity toward a species (influences color and binding preference)
    const speciesKeys = ['cyan', 'magenta', 'gold'];
    const assignedSpecies = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      species: assignedSpecies,
      radius: 1.2 + Math.random() * 1.4,
      sparklePhase: Math.random() * Math.PI * 2,
      life: 20 + Math.random() * 40
    };
  }

  initFish() {
    this.fish = [];
    const fishTypes = [
      { species: 'cyan', count: 18, size: 7.5, maxSpeed: 105, schoolGroup: 0 },
      { species: 'magenta', count: 18, size: 6.8, maxSpeed: 115, schoolGroup: 1 },
      { species: 'gold', count: 12, size: 9.0, maxSpeed: 90, schoolGroup: 2 }
    ];

    fishTypes.forEach(typeInfo => {
      const centerX = this.width * (0.2 + 0.6 * Math.random());
      const centerY = this.height * (0.3 + 0.4 * Math.random());

      for (let i = 0; i < typeInfo.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 90;
        this.fish.push({
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: Math.cos(angle) * (typeInfo.maxSpeed * 0.6),
          vy: Math.sin(angle) * (typeInfo.maxSpeed * 0.6),
          heading: angle,
          species: typeInfo.species,
          size: typeInfo.size,
          maxSpeed: typeInfo.maxSpeed,
          schoolGroup: typeInfo.schoolGroup,
          finWigglePhase: Math.random() * Math.PI * 2,
          finWiggleFreq: 12 + Math.random() * 6,
          personalNeighborRadius: 55 + Math.random() * 20,
          separationRadius: 18,
          frightTimer: 0,
          frightVx: 0,
          frightVy: 0
        });
      }
    });
  }

  initPlankton() {
    this.plankton = [];
    const planktonCount = 75;
    for (let i = 0; i < planktonCount; i++) {
      this.plankton.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.8 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.5 + Math.random() * 2.5,
        glowHue: Math.random() < 0.6 ? '#00F0FF' : (Math.random() < 0.5 ? '#FF007F' : '#FFD700')
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* UI CONTROLS IMPLEMENTATION                                                 */
  /* -------------------------------------------------------------------------- */
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group" style="margin-bottom: 8px;">
        <label style="display:flex; justify-content:space-between; font-family:monospace; font-size:12px; color:#c7d5e0;">
          <span>Nutrient Saturation:</span>
          <span id="reef-nutrient-val" style="color:#00F0FF; font-weight:bold;">${this.nutrientSaturation} ions</span>
        </label>
        <input type="range" id="reef-nutrient-slider" min="100" max="800" step="20" value="${this.nutrientSaturation}" style="width:100%;">
      </div>

      <div class="control-group" style="margin-bottom: 8px;">
        <label style="display:flex; justify-content:space-between; font-family:monospace; font-size:12px; color:#FFD700;">
          <span>Current Flow:</span>
          <span id="reef-flow-val" style="color:#FFD700; font-weight:bold;">${this.currentFlow.toFixed(2)} kn</span>
        </label>
        <input type="range" id="reef-flow-slider" min="-2.5" max="2.5" step="0.1" value="${this.currentFlow}" style="width:100%;">
      </div>

      <div class="control-btn-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom: 8px;">
        <button id="reef-seed-btn" class="sub-btn" style="background:#0a1828; border:1px solid #00F0FF; color:#00F0FF; padding:6px 8px; font-family:monospace; font-size:11px; cursor:pointer; border-radius:3px; transition:0.2s;">
          🌱 Seed Coral Polyp
        </button>
        <button id="reef-pulse-btn" class="sub-btn" style="background:#0a1828; border:1px solid #FF007F; color:#FF007F; padding:6px 8px; font-family:monospace; font-size:11px; cursor:pointer; border-radius:3px; transition:0.2s;">
          ✨ Bioluminescent Pulse
        </button>
      </div>

      <div class="control-group" style="display:flex; gap:6px; margin-bottom: 8px;">
        <button id="reef-spec-cyan" class="sub-btn" style="flex:1; background:#0a1828; border:1px solid #00F0FF; color:#00F0FF; padding:4px; font-size:10px; font-family:monospace; border-radius:3px;">
          ● Cyan Staghorn
        </button>
        <button id="reef-spec-magenta" class="sub-btn" style="flex:1; background:#0a1828; border:1px solid #FF007F; color:#FF007F; padding:4px; font-size:10px; font-family:monospace; border-radius:3px;">
          ● Magenta Fan
        </button>
        <button id="reef-spec-gold" class="sub-btn" style="flex:1; background:#0a1828; border:1px solid #FFD700; color:#FFD700; padding:4px; font-size:10px; font-family:monospace; border-radius:3px;">
          ● Gold Brain
        </button>
      </div>

      <div class="control-group" style="display:flex; justify-content:space-between; margin-bottom: 6px;">
        <button id="reef-clear-btn" class="sub-btn" style="background:#130b14; border:1px solid #d4af37; color:#f9e79f; padding:5px 10px; font-family:monospace; font-size:11px; border-radius:3px; cursor:pointer;">
          ↺ Re-seed Reef
        </button>
        <button id="reef-caustics-btn" class="sub-btn" style="background:#0a1828; border:1px solid #48cae4; color:#90e0ef; padding:5px 10px; font-family:monospace; font-size:11px; border-radius:3px; cursor:pointer;">
          🌊 Caustics: ON
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px; font-size: 11px; color: #8c909e; font-family: monospace; background: rgba(3, 10, 20, 0.6); padding: 6px; border-radius: 4px; border: 1px solid rgba(0, 240, 255, 0.15);">
        <div style="display:flex; justify-content:space-between;">
          <span>Active Entities:</span>
          <strong id="reef-entity-readout" style="color:#FFD700;">${this.getEntityCount()}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:2px;">
          <span>Calcification Rate:</span>
          <strong id="reef-calc-readout" style="color:#00F0FF;">0.0 /sec</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:2px;">
          <span>Active Species:</span>
          <strong id="reef-active-species" style="color:#00F0FF;">Cyan Staghorn</strong>
        </div>
      </div>
    `;

    // Slider: Nutrient Saturation
    const nutrientSlider = this.controlsContainer.querySelector('#reef-nutrient-slider');
    const nutrientVal = this.controlsContainer.querySelector('#reef-nutrient-val');
    if (nutrientSlider) {
      nutrientSlider.addEventListener('input', (e) => {
        this.nutrientSaturation = parseInt(e.target.value, 10);
        if (nutrientVal) nutrientVal.textContent = `${this.nutrientSaturation} ions`;
        this.adjustNutrientPopulation();
      });
    }

    // Slider: Current Flow
    const flowSlider = this.controlsContainer.querySelector('#reef-flow-slider');
    const flowVal = this.controlsContainer.querySelector('#reef-flow-val');
    if (flowSlider) {
      flowSlider.addEventListener('input', (e) => {
        this.currentFlow = parseFloat(e.target.value);
        if (flowVal) flowVal.textContent = `${this.currentFlow.toFixed(2)} kn`;
      });
    }

    // Button: Seed Coral Polyp
    const seedBtn = this.controlsContainer.querySelector('#reef-seed-btn');
    if (seedBtn) {
      seedBtn.addEventListener('click', () => {
        const spawnX = this.width * (0.15 + 0.7 * Math.random());
        const spawnY = this.getSeabedY(spawnX) - 4;
        this.seedPolyp(spawnX, spawnY, this.selectedSpecies, 16);
        this.updateTelemetryHUD();
      });
    }

    // Button: Bioluminescent Pulse
    const pulseBtn = this.controlsContainer.querySelector('#reef-pulse-btn');
    if (pulseBtn) {
      pulseBtn.addEventListener('click', () => {
        this.triggerBioluminescentPulse();
      });
    }

    // Species Selectors
    const specCyan = this.controlsContainer.querySelector('#reef-spec-cyan');
    const specMagenta = this.controlsContainer.querySelector('#reef-spec-magenta');
    const specGold = this.controlsContainer.querySelector('#reef-spec-gold');
    const activeSpecText = this.controlsContainer.querySelector('#reef-active-species');

    const updateSpecSelection = (species, name, color) => {
      this.selectedSpecies = species;
      if (activeSpecText) {
        activeSpecText.textContent = name;
        activeSpecText.style.color = color;
      }
    };

    if (specCyan) specCyan.addEventListener('click', () => updateSpecSelection('cyan', 'Cyan Staghorn', '#00F0FF'));
    if (specMagenta) specMagenta.addEventListener('click', () => updateSpecSelection('magenta', 'Magenta Fan', '#FF007F'));
    if (specGold) specGold.addEventListener('click', () => updateSpecSelection('gold', 'Gold Brain', '#FFD700'));

    // Button: Re-seed Reef
    const clearBtn = this.controlsContainer.querySelector('#reef-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    // Button: Caustics Toggle
    const causticsBtn = this.controlsContainer.querySelector('#reef-caustics-btn');
    if (causticsBtn) {
      causticsBtn.addEventListener('click', () => {
        this.showCaustics = !this.showCaustics;
        causticsBtn.textContent = `🌊 Caustics: ${this.showCaustics ? 'ON' : 'OFF'}`;
      });
    }

    this.updateTelemetryHUD();
  }

  updateTelemetryHUD() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const entityReadout = this.controlsContainer.querySelector('#reef-entity-readout');
    const calcReadout = this.controlsContainer.querySelector('#reef-calc-readout');

    if (entityReadout) {
      entityReadout.textContent = `${this.getEntityCount()}`;
    }
    if (calcReadout) {
      calcReadout.textContent = `${this.stats.recentCalcRate.toFixed(1)} /sec`;
    }
  }

  adjustNutrientPopulation() {
    while (this.nutrients.length < this.nutrientSaturation) {
      this.nutrients.push(this.spawnNutrientIon(false));
    }
    if (this.nutrients.length > this.nutrientSaturation) {
      this.nutrients.length = this.nutrientSaturation;
    }
  }

  triggerBioluminescentPulse(originPos = null) {
    let px, py;
    if (originPos) {
      px = originPos.x;
      py = originPos.y;
    } else {
      // Find center of mass of living polyps or center of screen
      if (this.coralNodes.length > 0) {
        const randomNode = this.coralNodes[Math.floor(Math.random() * this.coralNodes.length)];
        px = randomNode.x;
        py = randomNode.y;
      } else {
        px = this.width * 0.5;
        py = this.height * 0.7;
      }
    }

    this.pulses.push({
      x: px,
      y: py,
      radius: 8,
      maxRadius: Math.max(this.width, this.height) * 1.1,
      speed: 480, // px per second
      strength: 1.0,
      color: this.selectedSpecies === 'cyan' ? '#00F0FF' : (this.selectedSpecies === 'magenta' ? '#FF007F' : '#FFD700')
    });

    // Fish react in awe & startle
    for (const f of this.fish) {
      const dx = f.x - px;
      const dy = f.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      f.frightTimer = 1.4;
      f.frightVx = (dx / dist) * (f.maxSpeed * 1.8);
      f.frightVy = (dy / dist) * (f.maxSpeed * 1.8);
    }

    this.playPulseSound();
  }

  /* -------------------------------------------------------------------------- */
  /* SIMULATION UPDATE LOOP                                                     */
  /* -------------------------------------------------------------------------- */
  update(dt) {
    const safeDt = Math.min(dt, 0.05);
    this.time += safeDt;

    // Rate Calculation Telemetry
    this.stats.recentCalcTimer += safeDt;
    if (this.stats.recentCalcTimer >= 0.5) {
      this.stats.recentCalcRate = this.stats.recentCalcCount / this.stats.recentCalcTimer;
      this.stats.recentCalcCount = 0;
      this.stats.recentCalcTimer = 0;
      this.updateTelemetryHUD();
    }

    // 1. Update Bioluminescent Pulses
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.radius += p.speed * safeDt;
      p.strength = Math.max(0, 1.0 - (p.radius / p.maxRadius));

      // Light up coral nodes within the wave envelope
      const waveBand = 35;
      for (let j = 0; j < this.coralNodes.length; j++) {
        const node = this.coralNodes[j];
        const dx = node.x - p.x;
        const dy = node.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(dist - p.radius) < waveBand) {
          node.pulseGlow = Math.max(node.pulseGlow, p.strength * 1.0);
        }
      }

      if (p.radius >= p.maxRadius || p.strength <= 0.01) {
        this.pulses.splice(i, 1);
      }
    }

    // 2. Update Coral Node Animation & Glow Decay
    for (let i = 0; i < this.coralNodes.length; i++) {
      const node = this.coralNodes[i];
      node.age += safeDt;
      if (node.pulseGlow > 0.005) {
        node.pulseGlow -= safeDt * 0.45; // Decay pulse glow gracefully
        if (node.pulseGlow < 0) node.pulseGlow = 0;
      }
      node.tentaclePhase += safeDt * 2.5;
    }

    // 3. Update Calcification Sparks
    for (let i = this.calcificationSparks.length - 1; i >= 0; i--) {
      const spark = this.calcificationSparks[i];
      spark.x += spark.vx * safeDt;
      spark.y += spark.vy * safeDt;
      spark.vy -= 12 * safeDt; // slight buoyancy
      spark.life -= safeDt * 2.2;
      spark.size *= 0.96;
      if (spark.life <= 0) {
        this.calcificationSparks.splice(i, 1);
      }
    }

    // 4. Update DLA Nutrients (Brownian Motion + Ocean Hydrodynamics + Aggregation)
    this.updateDLA(safeDt);

    // 5. Update Schooling Tropical Fish (Boids Algorithm)
    this.updateFish(safeDt);

    // 6. Update Plankton Marine Snow
    for (let i = 0; i < this.plankton.length; i++) {
      const pl = this.plankton[i];
      const eddyX = Math.sin(pl.y * 0.02 + this.time * 0.8) * 8;
      const eddyY = Math.cos(pl.x * 0.02 + this.time * 0.6) * 4;
      pl.x += (this.currentFlow * 18 + eddyX) * safeDt;
      pl.y += (-6 + eddyY) * safeDt; // slow upward drift

      if (pl.x < -10) pl.x = this.width + 10;
      if (pl.x > this.width + 10) pl.x = -10;
      if (pl.y < -10) pl.y = this.height + 10;
      if (pl.y > this.height + 10) pl.y = -10;
    }
  }

  updateDLA(dt) {
    const currentVx = this.currentFlow * 42;
    const stickDist = 11.5;
    const stickDistSq = stickDist * stickDist;
    const maxCoralLimit = 2200; // Cap to keep render at smooth 60fps

    // Sub-stepping for accurate Brownian collision without tunneling
    const subSteps = 2;
    const subDt = dt / subSteps;

    for (let step = 0; step < subSteps; step++) {
      for (let i = 0; i < this.nutrients.length; i++) {
        const ion = this.nutrients[i];

        // Hydrodynamic advection + multi-frequency wave eddies
        const eddyVx = Math.sin(ion.y * 0.015 + this.time * 1.1) * 16 + Math.cos(ion.x * 0.02 - this.time * 0.7) * 8;
        const eddyVy = Math.cos(ion.x * 0.018 + this.time * 0.9) * 12 - 4; // Slight negative buoyancy/upwelling

        // Brownian stochastic agitation: sqrt(dt) scaling
        const brownianSigma = 85;
        const brownianDx = (Math.random() - 0.5) * brownianSigma * Math.sqrt(subDt) * 2;
        const brownianDy = (Math.random() - 0.5) * brownianSigma * Math.sqrt(subDt) * 2;

        ion.x += (currentVx + eddyVx) * subDt + brownianDx;
        ion.y += eddyVy * subDt + brownianDy;

        // Repel from sea surface and wrap edges
        if (ion.y < 15) ion.y = 15;
        if (ion.x < -20) ion.x = this.width + 15;
        if (ion.x > this.width + 20) ion.x = -15;

        // Check if settled on seabed or beyond bounds
        const seabedY = this.getSeabedY(ion.x);
        if (ion.y > seabedY + 5) {
          // Respawn at open water
          Object.assign(ion, this.spawnNutrientIon(false));
          continue;
        }

        // Fast spatial collision check against nearby coral branches
        if (this.coralNodes.length < maxCoralLimit) {
          const nearbyIndices = this.queryNearbyCoralNodes(ion.x, ion.y, stickDist + 8);
          let adhered = false;

          for (let k = 0; k < nearbyIndices.length; k++) {
            const parentIdx = nearbyIndices[k];
            const parentNode = this.coralNodes[parentIdx];
            const dx = ion.x - parentNode.x;
            const dy = ion.y - parentNode.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < stickDistSq) {
              const cfg = this.speciesConfig[parentNode.species];
              // Stickiness check & level bound
              const speciesAffinityBonus = (ion.species === parentNode.species) ? 0.2 : 0.0;
              const calcifyProbability = Math.min(0.95, this.growthStickiness + speciesAffinityBonus);

              if (Math.random() < calcifyProbability && parentNode.branchLevel < cfg.maxBranchLevel) {
                // Biomineralization Aggregation Event!
                adhered = true;
                this.calcifyNode(parentNode, ion.x, ion.y);
                break;
              }
            }
          }

          if (adhered) {
            // Respawn consumed nutrient ion
            Object.assign(ion, this.spawnNutrientIon(false));
          }
        }
      }
    }

    // Maintain population equilibrium
    if (this.nutrients.length < this.nutrientSaturation) {
      this.adjustNutrientPopulation();
    }
  }

  calcifyNode(parentNode, rawX, rawY) {
    const sp = parentNode.species;
    const cfg = this.speciesConfig[sp];

    // Compute growth direction vector influenced by parent branch angle + current rheotropism
    let dx = rawX - parentNode.x;
    let dy = rawY - parentNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Normalizing to fixed segment length
    let segLen = cfg.segmentLength * (0.85 + Math.random() * 0.3);
    let targetX = parentNode.x + (dx / dist) * segLen;
    let targetY = parentNode.y + (dy / dist) * segLen;

    // Apply upward phototropism & current lean
    targetY += cfg.branchTendencyY * 1.5;
    targetX += this.currentFlow * 1.2;

    const newLevel = parentNode.branchLevel + 1;
    const newRadius = Math.max(cfg.tipRadius, cfg.baseRadius * (1 - (newLevel / cfg.maxBranchLevel) * 0.72));

    const newNodeId = this.coralNodes.length;
    const newNode = {
      id: newNodeId,
      parentId: parentNode.id,
      x: targetX,
      y: targetY,
      radius: newRadius,
      species: sp,
      branchLevel: newLevel,
      age: 0,
      pulseGlow: 0.8, // Fresh calcification neon glow
      tentaclePhase: Math.random() * Math.PI * 2,
      tentacleLength: 3 + Math.random() * 3,
      isTip: true,
      children: []
    };

    parentNode.isTip = false;
    parentNode.children.push(newNodeId);

    this.coralNodes.push(newNode);
    this.insertSpatialGrid(newNode, newNodeId);

    // Spawn crystalline calcification spark particles
    const sparkCount = 4 + Math.floor(Math.random() * 4);
    for (let s = 0; s < sparkCount; s++) {
      const sparkAngle = Math.random() * Math.PI * 2;
      const sparkSpeed = 25 + Math.random() * 45;
      this.calcificationSparks.push({
        x: targetX,
        y: targetY,
        vx: Math.cos(sparkAngle) * sparkSpeed,
        vy: Math.sin(sparkAngle) * sparkSpeed,
        size: 1.5 + Math.random() * 2.0,
        life: 1.0,
        color: cfg.primaryColor
      });
    }

    this.stats.calcificationsTotal++;
    this.stats.recentCalcCount++;

    if (Math.random() < 0.15) {
      this.playCalcifySound(sp);
    }
  }

  updateFish(dt) {
    const mouseInfluenceDist = 90;

    for (let i = 0; i < this.fish.length; i++) {
      const boid = this.fish[i];

      // Fright / Startle dampening
      if (boid.frightTimer > 0) {
        boid.frightTimer -= dt;
        boid.vx += boid.frightVx * dt * 2.5;
        boid.vy += boid.frightVy * dt * 2.5;
        boid.frightVx *= 0.94;
        boid.frightVy *= 0.94;
      }

      // Reynolds Boids 3-Rules: Separation, Alignment, Cohesion
      let sepX = 0, sepY = 0, sepCount = 0;
      let alignX = 0, alignY = 0, alignCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      for (let j = 0; j < this.fish.length; j++) {
        if (i === j) continue;
        const other = this.fish[j];
        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const distSq = dx * dx + dy * dy;

        // Personal separation bubble
        if (distSq < boid.separationRadius * boid.separationRadius && distSq > 0) {
          const dist = Math.sqrt(distSq);
          sepX -= (dx / dist) / dist;
          sepY -= (dy / dist) / dist;
          sepCount++;
        }

        // Cohort schooling (same school group preferred)
        const isSameSchool = other.schoolGroup === boid.schoolGroup;
        const effectiveRadius = isSameSchool ? boid.personalNeighborRadius : boid.personalNeighborRadius * 0.5;

        if (distSq < effectiveRadius * effectiveRadius) {
          alignX += other.vx;
          alignY += other.vy;
          alignCount++;

          cohX += other.x;
          cohY += other.y;
          cohCount++;
        }
      }

      // Forces
      let steerX = 0, steerY = 0;

      if (sepCount > 0) {
        steerX += sepX * 180;
        steerY += sepY * 180;
      }
      if (alignCount > 0) {
        alignX /= alignCount;
        alignY /= alignCount;
        steerX += (alignX - boid.vx) * 1.2;
        steerY += (alignY - boid.vy) * 1.2;
      }
      if (cohCount > 0) {
        cohX /= cohCount;
        cohY /= cohCount;
        steerX += (cohX - boid.x) * 0.8;
        steerY += (cohY - boid.y) * 0.8;
      }

      // Soft boundary steering (avoid edges and bottom seabed)
      const margin = 70;
      if (boid.x < margin) steerX += (margin - boid.x) * 2.2;
      if (boid.x > this.width - margin) steerX -= (boid.x - (this.width - margin)) * 2.2;
      if (boid.y < margin) steerY += (margin - boid.y) * 2.2;

      const seabedY = this.getSeabedY(boid.x);
      if (boid.y > seabedY - 60) {
        steerY -= (boid.y - (seabedY - 60)) * 3.5;
      }

      // Coral reef shelter attraction (fish love swimming above coral formations)
      const targetMidY = this.height * 0.55;
      steerY += (targetMidY - boid.y) * 0.15;

      // Mouse repulsion / scatter on cursor proximity
      const mdx = boid.x - this.mouse.x;
      const mdy = boid.y - this.mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < mouseInfluenceDist && mDist > 0) {
        const factor = (1 - mDist / mouseInfluenceDist) * 320;
        steerX += (mdx / mDist) * factor;
        steerY += (mdy / mDist) * factor;
      }

      // Ambient cross-current contribution
      steerX += this.currentFlow * 18;

      // Integrate velocity
      boid.vx += steerX * dt;
      boid.vy += steerY * dt;

      // Speed limit clamp
      const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy) || 1;
      const effectiveMaxSpeed = boid.frightTimer > 0 ? boid.maxSpeed * 1.9 : boid.maxSpeed;
      if (speed > effectiveMaxSpeed) {
        boid.vx = (boid.vx / speed) * effectiveMaxSpeed;
        boid.vy = (boid.vy / speed) * effectiveMaxSpeed;
      } else if (speed < boid.maxSpeed * 0.3) {
        boid.vx = (boid.vx / speed) * (boid.maxSpeed * 0.3);
        boid.vy = (boid.vy / speed) * (boid.maxSpeed * 0.3);
      }

      boid.x += boid.vx * dt;
      boid.y += boid.vy * dt;

      // Update heading & fin oscillation
      boid.heading = Math.atan2(boid.vy, boid.vx);
      boid.finWigglePhase += dt * boid.finWiggleFreq * (speed / boid.maxSpeed);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING PIPELINE                                                         */
  /* -------------------------------------------------------------------------- */
  render(ctx) {
    if (!ctx) return;

    // 1. Oceanic Water Column Gradient
    this.renderWaterBackground(ctx);

    // 2. Volumetric God Rays
    if (this.showGodRays) {
      this.renderGodRays(ctx);
    }

    // 3. Sandy Coral Seabed
    this.renderSeabed(ctx);

    // 4. Coral Reef Skeleton Branches & Living Polyps (DLA Structure)
    this.renderCoralReef(ctx);

    // 5. Bioluminescent Pulses & Calcification Sparks
    this.renderPulsesAndSparks(ctx);

    // 6. Free Brownian Nutrient Ions
    this.renderNutrientIons(ctx);

    // 7. Schooling Tropical Boids (Fish)
    this.renderFish(ctx);

    // 8. Plankton & Floating Marine Snow
    this.renderPlankton(ctx);

    // 9. Caustic Water Ripple Overlay
    if (this.showCaustics) {
      this.renderCaustics(ctx);
    }

    // 10. Atmospheric Water Surface & Vignette
    this.renderAtmosphereVignette(ctx);

    // 11. HUD Info Panel
    this.renderHUD(ctx);
  }

  renderWaterBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    // Sunlit surface turquoise down to deep twilight reef abyss
    grad.addColorStop(0, '#042238');
    grad.addColorStop(0.35, '#041628');
    grad.addColorStop(0.75, '#030c1a');
    grad.addColorStop(1.0, '#01050e');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderGodRays(ctx) {
    ctx.save();
    const rayCount = 7;
    const originX = this.width * 0.45 + Math.sin(this.time * 0.3) * (this.width * 0.15);

    for (let i = 0; i < rayCount; i++) {
      const angle = 0.85 + (i - rayCount / 2) * 0.12 + Math.sin(this.time * 0.4 + i) * 0.04;
      const rayWidth = 40 + Math.sin(this.time * 0.8 + i * 1.5) * 18;
      const alpha = 0.035 + Math.sin(this.time * 0.6 + i * 1.2) * 0.02;

      ctx.save();
      ctx.translate(originX + i * 35, -20);
      ctx.rotate(angle);

      const rayGrad = ctx.createLinearGradient(0, 0, 0, this.height * 1.2);
      rayGrad.addColorStop(0, `rgba(0, 240, 255, ${alpha * 1.8})`);
      rayGrad.addColorStop(0.4, `rgba(72, 202, 228, ${alpha})`);
      rayGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = rayGrad;
      ctx.fillRect(-rayWidth / 2, 0, rayWidth, this.height * 1.2);
      ctx.restore();
    }
    ctx.restore();
  }

  renderSeabed(ctx) {
    ctx.save();

    // Dark volcanic / limestone marine base
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let i = 0; i < this.seabedHeightmap.length; i++) {
      ctx.lineTo(this.seabedHeightmap[i].x, this.seabedHeightmap[i].y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();

    const sandGrad = ctx.createLinearGradient(0, this.height * 0.75, 0, this.height);
    sandGrad.addColorStop(0, '#071520');
    sandGrad.addColorStop(0.4, '#040d16');
    sandGrad.addColorStop(1.0, '#02060b');

    ctx.fillStyle = sandGrad;
    ctx.fill();

    // Seabed rim highlight
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i < this.seabedHeightmap.length; i++) {
      if (i === 0) ctx.moveTo(this.seabedHeightmap[i].x, this.seabedHeightmap[i].y);
      else ctx.lineTo(this.seabedHeightmap[i].x, this.seabedHeightmap[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }

  renderCoralReef(ctx) {
    ctx.save();

    // PASS 1: Thick Calcified Branch Segments (Base Layer)
    for (let i = 0; i < this.coralNodes.length; i++) {
      const node = this.coralNodes[i];
      if (node.parentId === null) continue;
      const parent = this.coralNodes[node.parentId];
      if (!parent) continue;

      const cfg = this.speciesConfig[node.species];
      ctx.beginPath();
      ctx.moveTo(parent.x, parent.y);
      ctx.lineTo(node.x, node.y);

      // Gradient or color according to species
      ctx.strokeStyle = cfg.primaryColor;
      ctx.lineWidth = Math.max(1.5, (parent.radius + node.radius) * 0.9);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // PASS 2: Inner Mineral Core & Bioluminescent Phosphor Glow
    for (let i = 0; i < this.coralNodes.length; i++) {
      const node = this.coralNodes[i];
      const cfg = this.speciesConfig[node.species];

      // Draw node joint
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = cfg.coreColor;
      ctx.fill();

      // Bioluminescent pulse glow halo
      if (node.pulseGlow > 0.05) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (2.2 + node.pulseGlow * 3.5), 0, Math.PI * 2);
        ctx.fillStyle = cfg.glowColor;
        ctx.globalAlpha = node.pulseGlow * 0.75;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Living Polyp Nematocyst Tentacles on Branch Tips
      if (node.isTip || node.branchLevel > 4) {
        const tentacleCount = 5;
        const baseAngle = node.tentaclePhase;
        const tLen = node.tentacleLength * (1 + node.pulseGlow * 0.6);

        ctx.strokeStyle = cfg.polypColor;
        ctx.lineWidth = 1.2;

        for (let t = 0; t < tentacleCount; t++) {
          const a = baseAngle + (t * Math.PI * 2) / tentacleCount;
          const sway = Math.sin(this.time * 3 + t + node.id) * 1.8;
          const tx = node.x + Math.cos(a) * tLen + sway;
          const ty = node.y + Math.sin(a) * tLen - 1.2; // slight upward reach

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.quadraticCurveTo(node.x + Math.cos(a) * (tLen * 0.5), node.y + Math.sin(a) * (tLen * 0.5), tx, ty);
          ctx.stroke();

          // Tiny bioluminescent tentacle tip bulb
          ctx.fillStyle = cfg.coreColor;
          ctx.fillRect(tx - 0.75, ty - 0.75, 1.5, 1.5);
        }
      }
    }

    ctx.restore();
  }

  renderPulsesAndSparks(ctx) {
    ctx.save();

    // Expanding Bioluminescent Shockwave Rings
    for (let i = 0; i < this.pulses.length; i++) {
      const p = this.pulses[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4.0 * p.strength;
      ctx.globalAlpha = p.strength * 0.85;
      ctx.stroke();

      // Soft outer ring haze
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = p.strength * 0.5;
      ctx.stroke();
      ctx.restore();
    }

    // Calcification Crystalline Sparks
    for (let i = 0; i < this.calcificationSparks.length; i++) {
      const spark = this.calcificationSparks[i];
      ctx.save();
      ctx.fillStyle = spark.color;
      ctx.globalAlpha = spark.life;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderNutrientIons(ctx) {
    ctx.save();

    for (let i = 0; i < this.nutrients.length; i++) {
      const ion = this.nutrients[i];
      const cfg = this.speciesConfig[ion.species];
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 4 + ion.sparklePhase);

      // Ion halo
      ctx.fillStyle = cfg.glowColor;
      ctx.globalAlpha = 0.35 * twinkle;
      ctx.beginPath();
      ctx.arc(ion.x, ion.y, ion.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Ion core
      ctx.fillStyle = cfg.coreColor;
      ctx.globalAlpha = 0.9 * twinkle;
      ctx.beginPath();
      ctx.arc(ion.x, ion.y, ion.radius, 0, Math.PI * 2);
      ctx.fill();

      // Motion drift streak
      if (this.showNutrientTrails && Math.abs(this.currentFlow) > 0.3) {
        ctx.strokeStyle = cfg.primaryColor;
        ctx.lineWidth = 0.75;
        ctx.globalAlpha = 0.25 * twinkle;
        ctx.beginPath();
        ctx.moveTo(ion.x, ion.y);
        ctx.lineTo(ion.x - this.currentFlow * 3.5, ion.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderFish(ctx) {
    ctx.save();

    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      const cfg = this.speciesConfig[f.species];

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.heading);

      const length = f.size * 2.2;
      const halfWidth = f.size * 0.65;
      const tailWag = Math.sin(f.finWigglePhase) * (f.size * 0.45);

      // 1. Hydrodynamic Fish Body
      ctx.beginPath();
      ctx.moveTo(length * 0.65, 0); // Snout
      ctx.quadraticCurveTo(0, -halfWidth, -length * 0.45, -halfWidth * 0.4); // Top dorsal curve
      ctx.lineTo(-length * 0.65, tailWag * 0.5); // Tail peduncle
      ctx.lineTo(-length * 0.45, halfWidth * 0.4); // Lower curve
      ctx.quadraticCurveTo(0, halfWidth, length * 0.65, 0); // Belly to snout
      ctx.closePath();

      ctx.fillStyle = cfg.primaryColor;
      ctx.fill();

      // 2. Forked Caudal (Tail) Fin
      ctx.beginPath();
      ctx.moveTo(-length * 0.65, tailWag * 0.5);
      ctx.lineTo(-length * 1.1, tailWag - halfWidth * 0.9);
      ctx.lineTo(-length * 0.9, tailWag);
      ctx.lineTo(-length * 1.1, tailWag + halfWidth * 0.9);
      ctx.closePath();

      ctx.fillStyle = cfg.coreColor;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // 3. Pectoral Fin & Neon Lateral Line
      ctx.beginPath();
      ctx.moveTo(-length * 0.1, 0);
      ctx.lineTo(-length * 0.35, -halfWidth * 0.8);
      ctx.lineTo(-length * 0.25, 0);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.6;
      ctx.fill();

      // Glowing Eye
      ctx.beginPath();
      ctx.arc(length * 0.45, -halfWidth * 0.25, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1.0;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(length * 0.48, -halfWidth * 0.25, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#02060b';
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  renderPlankton(ctx) {
    ctx.save();
    for (let i = 0; i < this.plankton.length; i++) {
      const pl = this.plankton[i];
      const alpha = 0.2 + 0.3 * Math.sin(this.time * pl.twinkleSpeed + pl.twinklePhase);
      ctx.fillStyle = pl.glowHue;
      ctx.globalAlpha = alpha;
      ctx.fillRect(pl.x, pl.y, pl.size, pl.size);
    }
    ctx.restore();
  }

  renderCaustics(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Procedural overlapping sinusoidal caustic wave mesh
    const t = this.time * 0.9;
    const step = 48;
    const xSteps = Math.ceil(this.width / step);
    const ySteps = Math.ceil(this.height / step);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.11)';
    ctx.lineWidth = 1.2;

    for (let iy = 0; iy < ySteps; iy++) {
      const y = iy * step;
      ctx.beginPath();
      for (let ix = 0; ix <= xSteps; ix++) {
        const x = ix * step;
        const wave1 = Math.sin(x * 0.018 + y * 0.012 + t);
        const wave2 = Math.cos(x * 0.024 - y * 0.016 - t * 1.3);
        const wave3 = Math.sin((x + y) * 0.02 + t * 0.7);
        const causticOffset = (wave1 + wave2 + wave3) * 6;

        const cy = y + causticOffset;
        if (ix === 0) ctx.moveTo(x, cy);
        else ctx.lineTo(x, cy);
      }
      ctx.stroke();
    }

    // Secondary diagonal caustic reflections
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.04)';
    ctx.lineWidth = 1.0;
    for (let ix = 0; ix < xSteps; ix += 2) {
      const x = ix * step;
      ctx.beginPath();
      for (let iy = 0; iy <= ySteps; iy++) {
        const y = iy * step;
        const wave = Math.sin((x - y) * 0.022 + t * 1.1) * 7;
        const cx = x + wave;
        if (iy === 0) ctx.moveTo(cx, y);
        else ctx.lineTo(cx, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  renderAtmosphereVignette(ctx) {
    ctx.save();

    // Top water surface shimmer line
    const surfaceGrad = ctx.createLinearGradient(0, 0, 0, 18);
    surfaceGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    surfaceGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = surfaceGrad;
    ctx.fillRect(0, 0, this.width, 18);

    // Deep corner vignette
    const vig = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.5, this.width * 0.35,
      this.width * 0.5, this.height * 0.5, this.width * 0.85
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(1, 4, 10, 0.6)');

    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  renderHUD(ctx) {
    ctx.save();

    // Top-Left Marine Telemetry Card
    const pad = 14;
    const cardW = 260;
    const cardH = 92;

    ctx.fillStyle = 'rgba(3, 10, 22, 0.82)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(pad, pad, cardW, cardH);
    ctx.strokeRect(pad, pad, cardW, cardH);

    // Header Title
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('MARE NOSTRUM // CORAL REEF DLA', pad + 10, pad + 18);

    // Stat Lines
    ctx.fillStyle = '#c7d5e0';
    ctx.font = '10px monospace';
    ctx.fillText(`BIOMINERALIZATION: ${this.stats.recentCalcRate.toFixed(1)} /s (TOT: ${this.stats.calcificationsTotal})`, pad + 10, pad + 35);
    ctx.fillText(`CURRENT DRIFT:     ${this.currentFlow >= 0 ? '+' : ''}${this.currentFlow.toFixed(2)} kn (CROSSFLOW)`, pad + 10, pad + 50);
    ctx.fillText(`ENTITIES:          ${this.getEntityCount()} (DLA+IONS+BOIDS)`, pad + 10, pad + 65);

    // Species Badges
    const cyanNodes = this.coralNodes.filter(n => n.species === 'cyan').length;
    const magNodes = this.coralNodes.filter(n => n.species === 'magenta').length;
    const goldNodes = this.coralNodes.filter(n => n.species === 'gold').length;

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`■ ${cyanNodes}`, pad + 10, pad + 81);
    ctx.fillStyle = '#FF007F';
    ctx.fillText(`■ ${magNodes}`, pad + 78, pad + 81);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`■ ${goldNodes}`, pad + 146, pad + 81);

    // Top-Right Current & Weather Compass Indicator
    const compW = 100;
    const compH = 50;
    const compX = this.width - compW - pad;
    ctx.fillStyle = 'rgba(3, 10, 22, 0.82)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.fillRect(compX, pad, compW, compH);
    ctx.strokeRect(compX, pad, compW, compH);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('OCEAN FLOW', compX + 18, pad + 16);

    // Flow arrow vector
    const arrowCenterX = compX + compW * 0.5;
    const arrowCenterY = pad + 33;
    const arrowLength = 24 * Math.min(1.5, Math.max(0.3, Math.abs(this.currentFlow) / 1.5));
    const dirSign = this.currentFlow >= 0 ? 1 : -1;

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowCenterX - (arrowLength * 0.5) * dirSign, arrowCenterY);
    ctx.lineTo(arrowCenterX + (arrowLength * 0.5) * dirSign, arrowCenterY);
    ctx.lineTo(arrowCenterX + (arrowLength * 0.25) * dirSign, arrowCenterY - 4);
    ctx.moveTo(arrowCenterX + (arrowLength * 0.5) * dirSign, arrowCenterY);
    ctx.lineTo(arrowCenterX + (arrowLength * 0.25) * dirSign, arrowCenterY + 4);
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE & CONTRACT METHODS                                               */
  /* -------------------------------------------------------------------------- */
  /**
   * Returns total count of active simulation entities:
   * Coral branch segments + free nutrient ions + swimming fish boids.
   */
  getEntityCount() {
    return this.coralNodes.length + this.nutrients.length + this.fish.length;
  }

  resize(width, height, dpr = 1) {
    this.width = width || 800;
    this.height = height || 600;
    this.dpr = dpr || 1;

    this.initSeabed();
    // Rebuild spatial grid for resized coordinates
    this.spatialGrid.clear();
    for (let i = 0; i < this.coralNodes.length; i++) {
      this.insertSpatialGrid(this.coralNodes[i], i);
    }

    this.updateTelemetryHUD();
  }

  reset() {
    this.coralNodes = [];
    this.polypSeeds = [];
    this.spatialGrid.clear();
    this.calcificationSparks = [];
    this.pulses = [];
    this.stats.calcificationsTotal = 0;
    this.stats.recentCalcCount = 0;

    this.initSeabed();
    this.initCoralReef();
    this.initNutrients();
    this.initFish();
    this.updateTelemetryHUD();
  }

  destroy() {
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }

    this.coralNodes = [];
    this.polypSeeds = [];
    this.spatialGrid.clear();
    this.nutrients = [];
    this.fish = [];
    this.pulses = [];
    this.calcificationSparks = [];
    this.plankton = [];

    if (this.controlsContainer && typeof document !== 'undefined') {
      this.controlsContainer.innerHTML = '';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING                                                             */
  /* -------------------------------------------------------------------------- */
  onMouseDown(pos) {
    if (!pos) return;
    this.mouse.isDown = true;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    // Resume Audio Context on User Gesture
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Planting a polyp or triggering nutrient dispersion
    const seabedY = this.getSeabedY(pos.x);
    if (pos.y >= seabedY - 35) {
      // Plant polyp near seabed
      this.seedPolyp(pos.x, Math.min(pos.y, seabedY - 2), this.selectedSpecies, 12);
      this.updateTelemetryHUD();
    } else {
      // Click in open water: inject nutrient ion cluster & trigger mini bioluminescent sparkle
      const clusterCount = 14;
      for (let i = 0; i < clusterCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 40;
        this.nutrients.push({
          x: pos.x + Math.cos(angle) * 8,
          y: pos.y + Math.sin(angle) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          species: this.selectedSpecies,
          radius: 1.5 + Math.random() * 1.5,
          sparklePhase: Math.random() * Math.PI * 2,
          life: 25
        });
      }
      this.triggerBioluminescentPulse(pos);
    }
  }

  onMouseMove(pos) {
    if (!pos) return;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;

    if (this.mouse.isDown) {
      // Dragging water: stir current and leave nutrient wake
      const dx = pos.x - (this.mouse.lastX || pos.x);
      if (Math.abs(dx) > 3) {
        this.currentFlow = Math.max(-2.5, Math.min(2.5, this.currentFlow + dx * 0.005));
        const flowSlider = this.controlsContainer ? this.controlsContainer.querySelector('#reef-flow-slider') : null;
        const flowVal = this.controlsContainer ? this.controlsContainer.querySelector('#reef-flow-val') : null;
        if (flowSlider) flowSlider.value = this.currentFlow;
        if (flowVal) flowVal.textContent = `${this.currentFlow.toFixed(2)} kn`;
      }
    }
    this.mouse.lastX = pos.x;
    this.mouse.lastY = pos.y;
  }

  onMouseUp(pos) {
    this.mouse.isDown = false;
  }

  onKeyDown(key, e) {
    if (!key) return;

    if (key === ' ' || key === 'Spacebar') {
      this.triggerBioluminescentPulse();
    } else if (key === 's' || key === 'S') {
      // Seed polyp at mouse or center
      const sx = this.mouse.x || this.width * 0.5;
      const sy = this.getSeabedY(sx) - 4;
      this.seedPolyp(sx, sy, this.selectedSpecies, 14);
      this.updateTelemetryHUD();
    } else if (key === 'c' || key === 'C') {
      // Cycle species
      const speciesList = ['cyan', 'magenta', 'gold'];
      const nextIdx = (speciesList.indexOf(this.selectedSpecies) + 1) % speciesList.length;
      this.selectedSpecies = speciesList[nextIdx];
      const cfg = this.speciesConfig[this.selectedSpecies];
      const activeSpecText = this.controlsContainer ? this.controlsContainer.querySelector('#reef-active-species') : null;
      if (activeSpecText) {
        activeSpecText.textContent = cfg.name;
        activeSpecText.style.color = cfg.primaryColor;
      }
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === 'n' || key === 'N') {
      // Inject nutrient burst
      for (let i = 0; i < 25; i++) {
        this.nutrients.push(this.spawnNutrientIon(true));
      }
      this.updateTelemetryHUD();
    }
  }

  onKeyUp(key, e) {
    // No-op
  }
}
