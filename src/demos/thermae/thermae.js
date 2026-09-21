import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

// Thermae: Roman Baths Hypocaust & Thermal Conduction Engine
// Pliny Game Lab — Pavilion VIII: Architectura & Structura
// Grounded in Vitruvius (De Architectura Book V.10: "De balnearum dispositionibus et partibus")
// and Pliny the Elder (Naturalis Historia IX.79, XXXVI.70 on Sergius Orata & "pensiles balneas").
//
// Simulates:
// 1. 2D Thermal Conduction Grid via Laplace heat diffusion equation:
//      ∂T/∂t = α ∇²T - u · ∇T - h_loss*(T - T_amb) + Q_hearth
// 2. Heterogeneous Roman masonry materials:
//      - Praefurnium arched brick furnace hearth (heat source)
//      - Hypocaust subterranean chamber with brick pilae stacks (bipedales tiles)
//      - Suspensura suspended floor slab (tegulae bipedales + opus signinum concrete + marble mosaic)
//      - Tubuli / tegulae mammatae (hollow box-tile wall flues venting hot gases)
//      - Caldarium hot alveus pool & bronze labrum
//      - Tepidarium warm transition hall & warm water basin
//      - Frigidarium cold plunge natatio pool
// 3. Flue draft advection (controlled by damper venting)
// 4. Rising steam buoyancy convection particles from heated pools
// 5. Thermal heatmap gradient: Frigidarium Blue (#007BFF), Tepidarium Yellow (#FFC107), Caldarium Red (#DC3545)
// 6. Dual View: Vitruvian Architectural Elevation vs. False-Color Thermal Heatmap

// Material IDs for 2D Thermal Conduction Grid
const MAT_EXTERIOR_AIR = 0;
const MAT_ROOM_AIR = 1;
const MAT_HYPOCAUST_AIR = 2;
const MAT_PILAE = 3;
const MAT_SUSPENSURA = 4;
const MAT_TUBULI = 5;
const MAT_CALDARIUM_WATER = 6;
const MAT_TEPIDARIUM_WATER = 7;
const MAT_FRIGIDARIUM_WATER = 8;
const MAT_MASONRY = 9;
const MAT_HEARTH = 10;
const MAT_ROOF = 11;

export class ThermaeEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;
    attachTouchBridge(this, canvas);

    // Simulation Parameters & Roman Engineering Controls
    this.fireRate = 75; // 10% - 100% (praefurnium furnace intensity)
    this.draftVenting = 60; // 0% - 100% (tubuli flue damper opening)
    this.viewMode = 'architectural'; // 'architectural' | 'heatmap'
    this.stokeBoost = 0; // Temporary boost from wood fueling (°C)
    this.stokeTimer = 0;
    this.activePreset = 'Caracalla Imperial';

    // Thermal Simulation Constants
    this.ambientTemp = 18.0; // Outdoor / foundation ambient temperature (°C)
    this.hearthBaseTemp = 420.0; // Base temperature of burning coals (°C)
    this.simTime = 0;

    // Discretized 2D Heat Grid (100 columns x 50 rows = 5,000 cells)
    this.gridW = 100;
    this.gridH = 50;
    this.cellCount = this.gridW * this.gridH;

    // Typed arrays for heat simulation
    this.temperature = new Float32Array(this.cellCount);
    this.tempPrev = new Float32Array(this.cellCount);
    this.material = new Uint8Array(this.cellCount);
    this.diffusivity = new Float32Array(this.cellCount);
    this.draftVx = new Float32Array(this.cellCount);
    this.draftVy = new Float32Array(this.cellCount);
    this.ambientLoss = new Float32Array(this.cellCount);

    // Dynamic entity counters
    this.activeCellsCount = 0;
    this.activeSteamCount = 0;
    this.activeEmberCount = 0;

    // Steam Convection Particles Pool (buoyant vapor rising from hot pools)
    this.maxSteam = 350;
    this.steamPool = new Array(this.maxSteam);
    for (let i = 0; i < this.maxSteam; i++) {
      this.steamPool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        growth: 4,
        alpha: 0,
        maxLife: 2,
        life: 0,
        spin: 0,
        spinSpeed: 0
      };
    }

    // Furnace Embers & Sparks Pool
    this.maxEmbers = 120;
    this.emberPool = new Array(this.maxEmbers);
    for (let i = 0; i < this.maxEmbers; i++) {
      this.emberPool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 1.5,
        alpha: 0,
        life: 0,
        maxLife: 1.2,
        color: '#ffc107'
      };
    }

    // Offscreen Canvas for Fast Bilinear Thermal Heatmap Rendering
    this.heatmapCanvas = null;
    this.heatmapCtx = null;
    this.heatmapImage = null;
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        this.heatmapCanvas = document.createElement('canvas');
        this.heatmapCanvas.width = this.gridW;
        this.heatmapCanvas.height = this.gridH;
        this.heatmapCtx = this.heatmapCanvas.getContext('2d');
        if (this.heatmapCtx && this.heatmapCtx.createImageData) {
          this.heatmapImage = this.heatmapCtx.createImageData(this.gridW, this.gridH);
        }
      } catch (e) {
        // Safe fallback in mock environments
        this.heatmapCanvas = null;
      }
    }

    // Interactive State
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.hoveredCell = { x: 0, y: 0, temp: 18, mat: 0 };

    // Audio Context (lazy initialization on user interaction)
    this.audioCtx = null;
    this.audioInitialized = false;

    // Initialize Architecture Grid, Controls, and State
    this.buildArchitectureGrid();
    this.buildControls();
    this.reset();
  }

  // =========================================================================
  // ARCHITECTURAL GRID GEOMETRY & MATERIAL DEFINITION
  // =========================================================================
  buildArchitectureGrid() {
    const gw = this.gridW;
    const gh = this.gridH;

    // Room horizontal boundaries in grid columns (X: 0 to 99)
    // 0 -> 18: Praefurnium (Furnace Stokehole & Boilers)
    // 19 -> 48: Caldarium (Hot Bath Hall, Alveus, Tubuli flues)
    // 49 -> 73: Tepidarium (Warm Hall, Benches, Warm Basin)
    // 74 -> 99: Frigidarium (Cold Hall, Deep Natatio Pool)

    // Vertical structural levels (Y: 0 to 49)
    // 0 -> 7: Vaulted Ceilings & Chimney Exhaust Vents
    // 8 -> 26: Main Bath Halls (Chamber Rooms, Pools, Benches)
    // 27 -> 31: Suspensura Floor (Bipedales Tiles + Opus Signinum)
    // 32 -> 43: Hypocaust Subfloor Void & Pilae Brick Stacks
    // 44 -> 49: Subterranean Bedrock Foundation

    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const idx = y * gw + x;
        let mat = MAT_ROOM_AIR;
        let diff = 0.12;
        let loss = 0.005;
        let vx = 0;
        let vy = 0;

        // --- 1. Bedrock Subterranean Foundation ---
        if (y >= 44) {
          mat = MAT_MASONRY;
          diff = 0.06;
          loss = 0.012; // Thermal mass sink to earth
        }
        // --- 2. Hypocaust Subfloor Zone (Y: 32 -> 43) ---
        else if (y >= 32 && y <= 43) {
          if (x < 18) {
            // Praefurnium Furnace Pit
            if (y >= 35 && y <= 42 && x >= 3 && x <= 16) {
              mat = MAT_HEARTH;
              diff = 0.30;
              loss = 0.0;
            } else {
              mat = MAT_MASONRY;
              diff = 0.08;
            }
          } else if (x >= 18 && x <= 73) {
            // Hypocaust Void beneath Caldarium and Tepidarium with Pilae Pillars
            // Pilae brick pillars placed every 5 columns (width 2 columns)
            const isPila = (x % 5 === 2 || x % 5 === 3) && (y >= 34 && y <= 43);
            if (isPila) {
              mat = MAT_PILAE;
              diff = 0.18; // Brick conducts heat to floor
              loss = 0.002;
            } else {
              mat = MAT_HYPOCAUST_AIR;
              diff = 0.32; // Fast hot flue gas diffusion
              loss = 0.001;
              // Draft velocity moves hot air horizontally toward vents
              vx = 0.35;
            }
          } else {
            // Beneath Frigidarium (X >= 74): Solid unheated earth/foundation!
            mat = MAT_MASONRY;
            diff = 0.05;
            loss = 0.015;
          }
        }
        // --- 3. Suspensura Floor Slab (Y: 27 -> 31) ---
        else if (y >= 27 && y <= 31) {
          if (x >= 18 && x <= 73) {
            mat = MAT_SUSPENSURA;
            diff = 0.22; // Bipedales tiles & hydraulic concrete conduct heat up into room
            loss = 0.003;
          } else {
            mat = MAT_MASONRY;
            diff = 0.06;
            loss = 0.010;
          }
        }
        // --- 4. Bath Halls, Pools & Tubuli Walls (Y: 8 -> 26) ---
        else if (y >= 8 && y <= 26) {
          // Dividing / Exterior Walls & Tubuli Box-Tile Flues
          if (x === 0 || x === 1 || x === 98 || x === 99) {
            mat = MAT_MASONRY;
            diff = 0.05;
            loss = 0.02;
          } else if (x === 17 || x === 18) {
            // Left Caldarium Tubuli Flue (exhaust wall flue carrying heat up)
            mat = MAT_TUBULI;
            diff = 0.28;
            vy = -0.40; // Chimney upward updraft
            loss = 0.004;
          } else if (x === 47 || x === 48) {
            // Caldarium / Tepidarium Partition Flue
            mat = MAT_TUBULI;
            diff = 0.26;
            vy = -0.35;
            loss = 0.004;
          } else if (x === 72 || x === 73) {
            // Insulated dividing wall between Tepidarium and Frigidarium
            mat = MAT_MASONRY;
            diff = 0.04;
            loss = 0.015;
          }
          // Pools & Water Basins
          else if (x >= 22 && x <= 38 && y >= 20 && y <= 26) {
            // Caldarium Heated Alveus Pool
            mat = MAT_CALDARIUM_WATER;
            diff = 0.16;
            loss = 0.002;
          } else if (x >= 54 && x <= 67 && y >= 22 && y <= 26) {
            // Tepidarium Warm Pool
            mat = MAT_TEPIDARIUM_WATER;
            diff = 0.14;
            loss = 0.004;
          } else if (x >= 77 && x <= 95 && y >= 17 && y <= 26) {
            // Frigidarium Cold Natatio Plunge Pool (deep, cold aqueduct water)
            mat = MAT_FRIGIDARIUM_WATER;
            diff = 0.12;
            loss = 0.035; // Constantly replenished with cold mountain water
          } else {
            // Room Air
            mat = MAT_ROOM_AIR;
            diff = 0.10;
            loss = 0.008;
          }
        }
        // --- 5. Roof Vaults & Chimney Exhausts (Y: 0 -> 7) ---
        else {
          if ((x >= 16 && x <= 19) || (x >= 46 && x <= 49)) {
            // Top Chimney Flue Exhausts (where flue gases escape)
            mat = MAT_TUBULI;
            diff = 0.30;
            vy = -0.45;
            loss = 0.04;
          } else if (y <= 2) {
            mat = MAT_EXTERIOR_AIR;
            diff = 0.20;
            loss = 0.06;
          } else {
            mat = MAT_ROOF;
            diff = 0.05;
            loss = 0.03;
          }
        }

        this.material[idx] = mat;
        this.diffusivity[idx] = diff;
        this.draftVx[idx] = vx;
        this.draftVy[idx] = vy;
        this.ambientLoss[idx] = loss;
      }
    }
  }

  // =========================================================================
  // UI CONTROLS CONTRACT
  // =========================================================================
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Furnace Fire Rate</span>
          <span id="fire-rate-val" style="color: var(--accent-gold, #d4af37); font-weight: bold;">${this.fireRate}% (Praefurnium)</span>
        </label>
        <input type="range" id="fire-rate-slider" min="10" max="100" step="1" value="${this.fireRate}">
      </div>

      <div class="control-group">
        <label>
          <span>Draft Venting</span>
          <span id="draft-val" style="color: var(--accent-cyan, #3bd6c6); font-weight: bold;">${this.draftVenting}% Damper</span>
        </label>
        <input type="range" id="draft-slider" min="0" max="100" step="1" value="${this.draftVenting}">
      </div>

      <div class="control-group">
        <label><span>Thermal View Mode</span></label>
        <div class="control-btn-grid">
          <button class="sub-btn ${this.viewMode === 'architectural' ? 'active' : ''}" id="view-arch" data-view="architectural">
            🏛️ Architectural
          </button>
          <button class="sub-btn ${this.viewMode === 'heatmap' ? 'active' : ''}" id="view-heat" data-view="heatmap">
            🌡️ Thermal Heatmap
          </button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="btn-stoke" class="sub-btn" style="background: rgba(220, 53, 69, 0.25); border-color: #dc3545; color: #ff9999; font-weight: bold; padding: 8px 10px;">
          🪵 Stoke Furnace (+Wood Fuel)
        </button>
      </div>

      <div class="control-group">
        <button id="btn-quench" class="sub-btn" style="background: rgba(0, 123, 255, 0.25); border-color: #007bff; color: #80bdff; font-weight: bold; padding: 8px 10px;">
          ❄️ Cold Plunge (Frigidarium Quench)
        </button>
      </div>

      <div class="control-group" style="margin-top: 4px;">
        <label><span>Imperial Thermae Presets</span></label>
        <div class="control-btn-grid">
          <button class="sub-btn active" data-preset="Caracalla Imperial">🏛️ Caracalla</button>
          <button class="sub-btn" data-preset="Pompeii Forum">🏺 Pompeii</button>
          <button class="sub-btn" data-preset="Titus Thermae">🔥 Titus</button>
        </div>
      </div>
    `;

    // Bind Fire Rate Slider
    const fireSlider = this.controlsContainer.querySelector('#fire-rate-slider');
    const fireVal = this.controlsContainer.querySelector('#fire-rate-val');
    if (fireSlider && fireVal) {
      fireSlider.addEventListener('input', (e) => {
        this.fireRate = parseFloat(e.target.value);
        fireVal.textContent = `${Math.round(this.fireRate)}% (Praefurnium)`;
      });
    }

    // Bind Draft Venting Slider
    const draftSlider = this.controlsContainer.querySelector('#draft-slider');
    const draftVal = this.controlsContainer.querySelector('#draft-val');
    if (draftSlider && draftVal) {
      draftSlider.addEventListener('input', (e) => {
        this.draftVenting = parseFloat(e.target.value);
        draftVal.textContent = `${Math.round(this.draftVenting)}% Damper`;
      });
    }

    // Bind View Mode Buttons
    const viewArchBtn = this.controlsContainer.querySelector('#view-arch');
    const viewHeatBtn = this.controlsContainer.querySelector('#view-heat');
    if (viewArchBtn && viewHeatBtn) {
      viewArchBtn.addEventListener('click', () => {
        this.viewMode = 'architectural';
        viewArchBtn.classList.add('active');
        viewHeatBtn.classList.remove('active');
      });
      viewHeatBtn.addEventListener('click', () => {
        this.viewMode = 'heatmap';
        viewHeatBtn.classList.add('active');
        viewArchBtn.classList.remove('active');
      });
    }

    // Bind Stoke Furnace Button
    const btnStoke = this.controlsContainer.querySelector('#btn-stoke');
    if (btnStoke) {
      btnStoke.addEventListener('click', () => {
        this.stokeFurnace();
      });
    }

    // Bind Cold Quench Button
    const btnQuench = this.controlsContainer.querySelector('#btn-quench');
    if (btnQuench) {
      btnQuench.addEventListener('click', () => {
        this.quenchFrigidarium();
      });
    }

    // Bind Presets
    const presetBtns = this.controlsContainer.querySelectorAll('[data-preset]');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyPreset(btn.dataset.preset);
      });
    });
  }

  // =========================================================================
  // SIMULATION CYCLE & ACTIONS
  // =========================================================================
  stokeFurnace() {
    this.stokeBoost = 260.0;
    this.stokeTimer = 6.0;

    // Burst of fire embers
    const furnaceX = this.width * 0.11;
    const furnaceY = this.height * 0.76;
    for (let i = 0; i < 35; i++) {
      this.spawnEmber(furnaceX, furnaceY, true);
    }

    this.playAudioCrack();
  }

  quenchFrigidarium() {
    // Flood the Frigidarium natatio pool with fresh icy mountain spring water
    const gw = this.gridW;
    const gh = this.gridH;
    for (let y = 17; y <= 26; y++) {
      for (let x = 77; x <= 95; x++) {
        const idx = y * gw + x;
        this.temperature[idx] = 14.0;
      }
    }
  }

  applyPreset(presetName) {
    this.activePreset = presetName;
    if (presetName === 'Caracalla Imperial') {
      this.fireRate = 85;
      this.draftVenting = 65;
    } else if (presetName === 'Pompeii Forum') {
      this.fireRate = 60;
      this.draftVenting = 45;
    } else if (presetName === 'Titus Thermae') {
      this.fireRate = 95;
      this.draftVenting = 85;
    }

    // Update UI controls if present
    if (this.controlsContainer) {
      const fSlider = this.controlsContainer.querySelector('#fire-rate-slider');
      const fVal = this.controlsContainer.querySelector('#fire-rate-val');
      if (fSlider && fVal) {
        fSlider.value = this.fireRate;
        fVal.textContent = `${Math.round(this.fireRate)}% (Praefurnium)`;
      }

      const dSlider = this.controlsContainer.querySelector('#draft-slider');
      const dVal = this.controlsContainer.querySelector('#draft-val');
      if (dSlider && dVal) {
        dSlider.value = this.draftVenting;
        dVal.textContent = `${Math.round(this.draftVenting)}% Damper`;
      }
    }
  }

  reset() {
    this.simTime = 0;
    this.stokeBoost = 0;
    this.stokeTimer = 0;

    const gw = this.gridW;
    const gh = this.gridH;

    // Initialize temperatures with realistic thermodynamic equilibrium
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const idx = y * gw + x;
        const mat = this.material[idx];

        if (mat === MAT_HEARTH) {
          this.temperature[idx] = 480.0;
        } else if (mat === MAT_HYPOCAUST_AIR) {
          // Heat attenuates from left (furnace) to right
          const dist = (x - 18) / 55;
          this.temperature[idx] = 240.0 * (1.0 - dist * 0.65) + 40.0;
        } else if (mat === MAT_PILAE) {
          const dist = (x - 18) / 55;
          this.temperature[idx] = 200.0 * (1.0 - dist * 0.6) + 35.0;
        } else if (mat === MAT_SUSPENSURA) {
          const dist = (x - 18) / 55;
          this.temperature[idx] = 68.0 * (1.0 - dist * 0.55) + 24.0;
        } else if (mat === MAT_CALDARIUM_WATER) {
          this.temperature[idx] = 52.0;
        } else if (mat === MAT_TEPIDARIUM_WATER) {
          this.temperature[idx] = 36.0;
        } else if (mat === MAT_FRIGIDARIUM_WATER) {
          this.temperature[idx] = 18.0;
        } else if (mat === MAT_TUBULI) {
          this.temperature[idx] = 110.0 - y * 2.5;
        } else if (mat === MAT_ROOM_AIR) {
          if (x <= 48) this.temperature[idx] = 44.0; // Caldarium room
          else if (x <= 73) this.temperature[idx] = 32.0; // Tepidarium room
          else this.temperature[idx] = 20.0; // Frigidarium room
        } else {
          this.temperature[idx] = this.ambientTemp;
        }

        this.tempPrev[idx] = this.temperature[idx];
      }
    }

    // Reset particles
    for (let i = 0; i < this.maxSteam; i++) {
      this.steamPool[i].active = false;
    }
    this.activeSteamCount = 0;

    for (let i = 0; i < this.maxEmbers; i++) {
      this.emberPool[i].active = false;
    }
    this.activeEmberCount = 0;
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.steamPool = [];
    this.emberPool = [];
    this.temperature = null;
    this.tempPrev = null;
    this.heatmapCanvas = null;
    this.heatmapCtx = null;
    this.heatmapImage = null;
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  getEntityCount() {
    return this.activeCellsCount + this.activeSteamCount + this.activeEmberCount;
  }

  resize(width, height, dpr = 1) {
    this.width = width || 800;
    this.height = height || 600;
    this.dpr = dpr || 1;
  }

  // =========================================================================
  // UPDATE LOOP: LAPLACE HEAT CONDUCTION & FLUID CONVECTION
  // =========================================================================
  update(dt) {
    const clampedDt = Math.min(0.05, Math.max(0.001, dt));
    this.simTime += clampedDt;

    // Decay stoke boost
    if (this.stokeTimer > 0) {
      this.stokeTimer -= clampedDt;
      this.stokeBoost = Math.max(0, this.stokeBoost - clampedDt * 45.0);
    } else {
      this.stokeBoost = 0;
    }

    // Multiple numerical sub-steps for unconditionally stable heat diffusion
    const subSteps = 2;
    const subDt = clampedDt / subSteps;
    for (let step = 0; step < subSteps; step++) {
      this.stepHeatEquation(subDt);
    }

    // Count active thermal cells
    let activeCells = 0;
    const cellTotal = this.cellCount;
    for (let i = 0; i < cellTotal; i++) {
      if (Math.abs(this.temperature[i] - this.ambientTemp) > 0.8) {
        activeCells++;
      }
    }
    this.activeCellsCount = activeCells;

    // Update Convection & Ember Particles
    this.updateParticles(clampedDt);
  }

  stepHeatEquation(dt) {
    const gw = this.gridW;
    const gh = this.gridH;
    const T = this.temperature;
    const Tprev = this.tempPrev;
    const mat = this.material;
    const diff = this.diffusivity;
    const loss = this.ambientLoss;
    const draftScale = this.draftVenting / 100.0;
    const fireScale = this.fireRate / 100.0;

    // Copy current state to previous buffer
    Tprev.set(T);

    // Dynamic Hearth combustion temperature
    const targetHearthTemp = this.hearthBaseTemp + fireScale * 380.0 + this.stokeBoost;

    for (let y = 1; y < gh - 1; y++) {
      const rowOffset = y * gw;
      for (let x = 1; x < gw - 1; x++) {
        const idx = rowOffset + x;
        const m = mat[idx];

        // 1. Fixed source condition in Praefurnium fire hearth
        if (m === MAT_HEARTH) {
          // Heat generation with small flicker
          const flicker = Math.sin(this.simTime * 14.0 + x * 2.1) * 12.0;
          T[idx] += (targetHearthTemp + flicker - T[idx]) * Math.min(1.0, dt * 4.5);
          continue;
        }

        // 2. 5-point discrete Laplace operator: ∇²T = (T_east + T_west + T_north + T_south - 4*T)
        const tCenter = Tprev[idx];
        const tEast = Tprev[idx + 1];
        const tWest = Tprev[idx - 1];
        const tNorth = Tprev[idx - gw];
        const tSouth = Tprev[idx + gw];
        const laplacian = tEast + tWest + tNorth + tSouth - 4.0 * tCenter;

        // Diffusion rate α * ∇²T
        const alpha = diff[idx];
        let dT = alpha * laplacian * dt * 8.0;

        // 3. Draft Advection (upwind differencing for hot flue gas draft)
        // Horizontal draft in hypocaust (carries heat rightwards from furnace)
        const vx = this.draftVx[idx] * draftScale;
        if (vx > 0) {
          dT -= vx * (tCenter - tWest) * dt * 12.0;
        }

        // Vertical chimney draft in tubuli flues (carries heat upwards)
        const vy = this.draftVy[idx] * draftScale;
        if (vy < 0) {
          dT -= (-vy) * (tCenter - tSouth) * dt * 14.0;
        }

        // 4. Ambient cooling / thermal loss to exterior
        const ambL = loss[idx];
        if (ambL > 0) {
          dT -= ambL * (tCenter - this.ambientTemp) * dt * 6.0;
        }

        // 5. Cold aqueduct inflow to Frigidarium pool
        if (m === MAT_FRIGIDARIUM_WATER) {
          dT += (16.0 - tCenter) * dt * 0.6;
        }

        // Apply clamped step to prevent numerical instability
        T[idx] = Math.max(10.0, Math.min(950.0, tCenter + dT));
      }
    }
  }

  updateParticles(dt) {
    const gw = this.gridW;
    const gh = this.gridH;
    const T = this.temperature;

    // --- 1. Steam Generation from Caldarium & Tepidarium Pools ---
    // Sample Caldarium pool temperature
    const caldariumIdx = 23 * gw + 30;
    const caldariumTemp = T[caldariumIdx] || 50.0;

    // Steam emission rate scales strongly with water temperature above 32°C
    if (caldariumTemp > 32.0) {
      const steamRate = Math.min(1.0, (caldariumTemp - 32.0) / 25.0);
      const spawnCount = Math.floor(steamRate * 3.5) + (Math.random() < 0.4 ? 1 : 0);
      for (let k = 0; k < spawnCount; k++) {
        // Random position along the Caldarium alveus pool surface
        const poolPxStart = this.width * (22 / gw);
        const poolPxEnd = this.width * (38 / gw);
        const px = poolPxStart + Math.random() * (poolPxEnd - poolPxStart);
        const py = this.height * (20 / gh);
        this.spawnSteam(px, py, caldariumTemp);
      }
    }

    // Mild steam from Tepidarium if heated high
    const tepidIdx = 24 * gw + 60;
    const tepidTemp = T[tepidIdx] || 35.0;
    if (tepidTemp > 38.0 && Math.random() < 0.25) {
      const poolPxStart = this.width * (54 / gw);
      const poolPxEnd = this.width * (67 / gw);
      const px = poolPxStart + Math.random() * (poolPxEnd - poolPxStart);
      const py = this.height * (22 / gh);
      this.spawnSteam(px, py, tepidTemp);
    }

    // --- 2. Update Active Steam Particles ---
    let activeSteam = 0;
    const draftV = (this.draftVenting / 100.0) * 18.0;
    for (let i = 0; i < this.maxSteam; i++) {
      const s = this.steamPool[i];
      if (!s.active) continue;

      s.life += dt;
      if (s.life >= s.maxLife) {
        s.active = false;
        continue;
      }

      activeSteam++;
      const progress = s.life / s.maxLife;

      // Soft billowy expansion & curl turbulence
      s.size += s.growth * dt;
      s.x += s.vx * dt + Math.sin(s.life * 4.0 + i) * 12.0 * dt + draftV * 0.3 * dt;
      s.y += s.vy * dt;
      s.spin += s.spinSpeed * dt;

      // Buoyancy acceleration (hot air rises faster, then slows as it cools)
      s.vy *= Math.pow(0.985, dt * 60);

      // Alpha envelope: quick fade-in, long soft billowy fade-out
      if (progress < 0.2) {
        s.alpha = (progress / 0.2) * 0.42;
      } else {
        s.alpha = 0.42 * (1.0 - (progress - 0.2) / 0.8);
      }
    }
    this.activeSteamCount = activeSteam;

    // --- 3. Furnace Hearth Sparks & Embers ---
    const furnaceX = this.width * 0.11;
    const furnaceY = this.height * 0.77;
    const emberSpawnRate = (this.fireRate / 100.0) * 1.8 + (this.stokeBoost > 0 ? 3.0 : 0);
    const emberSpawns = Math.floor(emberSpawnRate) + (Math.random() < emberSpawnRate % 1 ? 1 : 0);
    for (let k = 0; k < emberSpawns; k++) {
      this.spawnEmber(furnaceX, furnaceY, false);
    }

    let activeEmbers = 0;
    const hypocaustDraftX = (this.draftVenting / 100.0) * 80.0 + 30.0;
    for (let i = 0; i < this.maxEmbers; i++) {
      const e = this.emberPool[i];
      if (!e.active) continue;

      e.life += dt;
      if (e.life >= e.maxLife) {
        e.active = false;
        continue;
      }

      activeEmbers++;
      e.x += (e.vx + hypocaustDraftX) * dt;
      e.y += e.vy * dt;
      e.vy += 25.0 * dt; // Slight gravity/settling
      e.alpha = 1.0 - (e.life / e.maxLife);
    }
    this.activeEmberCount = activeEmbers;
  }

  spawnSteam(x, y, temp) {
    for (let i = 0; i < this.maxSteam; i++) {
      const s = this.steamPool[i];
      if (!s.active) {
        s.active = true;
        s.x = x + (Math.random() - 0.5) * 16.0;
        s.y = y;
        // Upward buoyancy velocity proportional to water heat
        const buoyancy = -22.0 - (temp - 30.0) * 1.1 - Math.random() * 12.0;
        s.vx = (Math.random() - 0.5) * 14.0;
        s.vy = buoyancy;
        s.size = 4.0 + Math.random() * 4.0;
        s.growth = 9.0 + Math.random() * 8.0;
        s.life = 0;
        s.maxLife = 2.4 + Math.random() * 1.6;
        s.alpha = 0.05;
        s.spin = Math.random() * Math.PI * 2;
        s.spinSpeed = (Math.random() - 0.5) * 1.5;
        return;
      }
    }
  }

  spawnEmber(x, y, isStoked) {
    for (let i = 0; i < this.maxEmbers; i++) {
      const e = this.emberPool[i];
      if (!e.active) {
        e.active = true;
        e.x = x + (Math.random() - 0.5) * (this.width * 0.09);
        e.y = y + (Math.random() - 0.5) * (this.height * 0.04);
        const speedMultiplier = isStoked ? 1.6 : 1.0;
        e.vx = (Math.random() * 60.0 + 20.0) * speedMultiplier;
        e.vy = -(Math.random() * 50.0 + 20.0) * speedMultiplier;
        e.size = 1.2 + Math.random() * (isStoked ? 2.5 : 1.5);
        e.life = 0;
        e.maxLife = 0.6 + Math.random() * (isStoked ? 1.2 : 0.8);
        e.alpha = 1.0;
        e.color = Math.random() < 0.4 ? '#ffffff' : (Math.random() < 0.7 ? '#ffc107' : '#ff5722');
        return;
      }
    }
  }

  // =========================================================================
  // THERMAL COLOR GRADIENT SPECIFICATION
  // Exact colors requested:
  // - Frigidarium Blue:   #007BFF
  // - Tepidarium Yellow:  #FFC107
  // - Caldarium Red:      #DC3545
  // =========================================================================
  getThermalRgb(temp) {
    // Calibrated Roman Thermal Scale:
    // <= 16°C: Cold baseline bedrock (dark navy #0B132B)
    // 20°C: Frigidarium Blue (#007BFF: 0, 123, 255)
    // 28°C: Transition Cyan-Green (#20C997: 32, 201, 151)
    // 36°C: Tepidarium Yellow (#FFC107: 255, 193, 7)
    // 52°C: Caldarium Warm Red/Orange (#FD7E14: 253, 126, 20)
    // 65°C: Caldarium Hot Red (#DC3545: 220, 53, 69)
    // 160°C: Hypocaust Flue Magenta/Crimson (180, 20, 90)
    // 380°C: Praefurnium Fire Gold (255, 140, 20)
    // >= 650°C: Incandescent White (255, 245, 210)

    if (temp <= 16.0) {
      return [11, 19, 43];
    } else if (temp <= 20.0) {
      const u = (temp - 16.0) / 4.0;
      return [
        Math.round(11 + u * (0 - 11)),
        Math.round(19 + u * (123 - 19)),
        Math.round(43 + u * (255 - 43))
      ];
    } else if (temp <= 28.0) {
      // 20°C (#007BFF) -> 28°C (#20C997)
      const u = (temp - 20.0) / 8.0;
      return [
        Math.round(0 + u * 32),
        Math.round(123 + u * (201 - 123)),
        Math.round(255 + u * (151 - 255))
      ];
    } else if (temp <= 36.0) {
      // 28°C (#20C997) -> 36°C Tepidarium Yellow (#FFC107)
      const u = (temp - 28.0) / 8.0;
      return [
        Math.round(32 + u * (255 - 32)),
        Math.round(201 + u * (193 - 201)),
        Math.round(151 + u * (7 - 151))
      ];
    } else if (temp <= 52.0) {
      // 36°C (#FFC107) -> 52°C (#FD7E14)
      const u = (temp - 36.0) / 16.0;
      return [
        Math.round(255 + u * (253 - 255)),
        Math.round(193 + u * (126 - 193)),
        Math.round(7 + u * (20 - 7))
      ];
    } else if (temp <= 65.0) {
      // 52°C (#FD7E14) -> 65°C Caldarium Red (#DC3545)
      const u = (temp - 52.0) / 13.0;
      return [
        Math.round(253 + u * (220 - 253)),
        Math.round(126 + u * (53 - 126)),
        Math.round(20 + u * (69 - 20))
      ];
    } else if (temp <= 160.0) {
      // 65°C (#DC3545) -> 160°C Hypocaust Flue Magenta (180, 20, 90)
      const u = (temp - 65.0) / 95.0;
      return [
        Math.round(220 + u * (180 - 220)),
        Math.round(53 + u * (20 - 53)),
        Math.round(69 + u * (90 - 69))
      ];
    } else if (temp <= 380.0) {
      // 160°C -> 380°C Fire Gold (255, 140, 20)
      const u = (temp - 160.0) / 220.0;
      return [
        Math.round(180 + u * (255 - 180)),
        Math.round(20 + u * (140 - 20)),
        Math.round(90 + u * (20 - 90))
      ];
    } else {
      // >= 380°C -> Incandescent Core (255, 245, 210)
      const u = Math.min(1.0, (temp - 380.0) / 270.0);
      return [
        255,
        Math.round(140 + u * (245 - 140)),
        Math.round(20 + u * (210 - 20))
      ];
    }
  }

  // =========================================================================
  // RENDERING PIPELINE
  // =========================================================================
  render(ctx) {
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (this.viewMode === 'heatmap') {
      this.renderThermalHeatmapView(ctx, w, h);
    } else {
      this.renderArchitecturalView(ctx, w, h);
    }

    // Render Rising Steam Convection
    this.renderSteamClouds(ctx, w, h);

    // Render Hearth Sparks & Embers
    this.renderEmbers(ctx, w, h);

    // Render Roman Engineering Telemetry HUD
    this.renderTelemetryHUD(ctx, w, h);

    // Render Mouse Probe Tooltip if hovering over simulation
    this.renderProbeTooltip(ctx, w, h);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 1. ARCHITECTURAL ELEVATION & VITRUVIAN CROSS-SECTION
  // -------------------------------------------------------------------------
  renderArchitecturalView(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;

    // A. Sky & Ambient Roman Exterior Background
    ctx.fillStyle = '#0f1118';
    ctx.fillRect(0, 0, w, h);

    // B. Subterranean Bedrock Foundation (opus caementicium & tuff)
    const foundationY = h * (44 / gh);
    ctx.fillStyle = '#171922';
    ctx.fillRect(0, foundationY, w, h - foundationY);

    // Classical bedrock geological lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.lineWidth = 1;
    for (let ly = foundationY + 12; ly < h; ly += 14) {
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly);
      ctx.stroke();
    }

    // C. Render Hypocaust Chamber Subfloor (Y: 32 -> 44)
    const hypocaustTopY = h * (32 / gh);
    const hypocaustH = foundationY - hypocaustTopY;
    const hypocaustLeftX = w * (18 / gw);
    const hypocaustRightX = w * (73 / gw);

    // Dark subterranean flue cavity with warm ambient reflection
    ctx.fillStyle = '#100c0a';
    ctx.fillRect(hypocaustLeftX, hypocaustTopY, hypocaustRightX - hypocaustLeftX, hypocaustH);

    // D. Soft Thermal Glow under Floor & Walls (Conducted Heat Visualization)
    this.renderSubtleThermalGlow(ctx, w, h);

    // E. Brick Pilae Stacks (bipedales circular and square brick columns)
    this.renderPilaeStacks(ctx, w, h, hypocaustTopY, foundationY);

    // F. Praefurnium Arched Brick Furnace (Left Stokehouse)
    this.renderPraefurniumFurnace(ctx, w, h, hypocaustTopY, foundationY);

    // G. Solid Foundation beneath Frigidarium (X: 74 -> 99)
    const frigidariumFoundX = w * (74 / gw);
    ctx.fillStyle = '#1d212b';
    ctx.fillRect(frigidariumFoundX, hypocaustTopY, w - frigidariumFoundX, hypocaustH);
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.15)';
    ctx.strokeRect(frigidariumFoundX, hypocaustTopY, w - frigidariumFoundX, hypocaustH);

    // H. Suspensura Hanging Floor Slab (Y: 27 -> 32)
    this.renderSuspensuraFloor(ctx, w, h);

    // I. Vertical Tubuli Wall Flues (hollow wall tiles)
    this.renderTubuliFlues(ctx, w, h);

    // J. Roman Bath Halls: Vaults, Columns, Basins & Pools
    this.renderBathHalls(ctx, w, h);

    // K. Flue Draft Flow Vector Indicators (damper arrows)
    this.renderDraftFlowVectors(ctx, w, h);
  }

  renderSubtleThermalGlow(ctx, w, h) {
    // Fast sampled thermal radiant glow in hypocaust and suspensura
    const gw = this.gridW;
    const gh = this.gridH;
    const T = this.temperature;

    ctx.save();
    for (let x = 18; x <= 72; x += 3) {
      for (let y = 27; y <= 43; y += 2) {
        const idx = y * gw + x;
        const temp = T[idx];
        if (temp > 40.0) {
          const px = w * (x / gw);
          const py = h * (y / gh);
          const [r, g, b] = this.getThermalRgb(temp);
          const intensity = Math.min(0.35, (temp - 30.0) / 500.0);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
          ctx.fillRect(px, py, (w / gw) * 3, (h / gh) * 2);
        }
      }
    }
    ctx.restore();
  }

  renderPilaeStacks(ctx, w, h, topY, bottomY) {
    const gw = this.gridW;
    const pilaH = bottomY - topY;

    // Pilae brick stacks placed across hypocaust
    ctx.save();
    for (let x = 22; x <= 70; x += 5) {
      const px = w * (x / gw);
      const pw = w * (2.2 / gw);

      // Stack of Roman bipedales ceramic tiles
      const numTiles = 7;
      const tileH = pilaH / numTiles;

      for (let t = 0; t < numTiles; t++) {
        const ty = topY + t * tileH;
        // Terracotta brick gradient
        ctx.fillStyle = t % 2 === 0 ? '#8b3a2b' : '#a04230';
        ctx.fillRect(px, ty + 1, pw, tileH - 2);

        // Mortar joint line
        ctx.strokeStyle = '#3a201c';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, ty + 1, pw, tileH - 2);
      }

      // Column capital tile (wider tile supporting suspensura slab)
      ctx.fillStyle = '#b84a36';
      ctx.fillRect(px - 2, topY, pw + 4, 3);
    }
    ctx.restore();
  }

  renderPraefurniumFurnace(ctx, w, h, topY, bottomY) {
    const gw = this.gridW;
    const gh = this.gridH;

    const furnaceLeftX = w * (2 / gw);
    const furnaceRightX = w * (18 / gw);
    const furnaceW = furnaceRightX - furnaceLeftX;
    const furnaceH = bottomY - topY;

    ctx.save();

    // Heavy refractory firebrick masonry around furnace chamber
    ctx.fillStyle = '#261715';
    ctx.fillRect(furnaceLeftX, topY - 10, furnaceW, furnaceH + 10);

    // Arched furnace firebox opening
    const fireboxX = w * (4 / gw);
    const fireboxW = w * (12 / gw);
    const fireboxY = topY + 6;
    const fireboxH = furnaceH - 8;

    ctx.fillStyle = '#140706';
    ctx.beginPath();
    ctx.arc(fireboxX + fireboxW * 0.5, fireboxY + 14, fireboxW * 0.45, Math.PI, 0);
    ctx.lineTo(fireboxX + fireboxW * 0.95, fireboxY + fireboxH);
    ctx.lineTo(fireboxX + fireboxW * 0.05, fireboxY + fireboxH);
    ctx.closePath();
    ctx.fill();

    // Roaring furnace flames & glowing olive-wood charcoal bed
    const fireScale = this.fireRate / 100.0;
    const isStoked = this.stokeBoost > 0;
    const flameBaseY = fireboxY + fireboxH;

    // Glowing ember bed
    ctx.fillStyle = isStoked ? '#ffffff' : (fireScale > 0.7 ? '#ff9900' : '#e65100');
    ctx.fillRect(fireboxX + 2, flameBaseY - 12, fireboxW - 4, 10);

    // Dynamic animated flame tongues
    const numFlames = 8;
    for (let f = 0; f < numFlames; f++) {
      const u = f / (numFlames - 1);
      const fx = fireboxX + 4 + u * (fireboxW - 8);
      const flameHeight = (28 + Math.sin(this.simTime * 16.0 + f * 1.7) * 12.0) * (fireScale * 0.6 + 0.5) * (isStoked ? 1.5 : 1.0);
      const tipX = fx + Math.sin(this.simTime * 12.0 + f * 2.3) * 6.0;

      ctx.beginPath();
      ctx.moveTo(fx - 4, flameBaseY - 6);
      ctx.quadraticCurveTo(fx, flameBaseY - flameHeight * 0.6, tipX, flameBaseY - flameHeight);
      ctx.quadraticCurveTo(fx + 4, flameBaseY - flameHeight * 0.6, fx + 4, flameBaseY - 6);
      ctx.closePath();

      ctx.fillStyle = f % 2 === 0 ? 'rgba(255, 193, 7, 0.85)' : 'rgba(220, 53, 69, 0.85)';
      ctx.fill();
    }

    // Furnace arch keystones and decorative Roman brick ring
    ctx.strokeStyle = '#8d3c2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(fireboxX + fireboxW * 0.5, fireboxY + 14, fireboxW * 0.46, Math.PI, 0);
    ctx.stroke();

    // Inscription label
    ctx.font = 'bold 8px "Cinzel", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('PRAEFVRNIVM', furnaceLeftX + 6, topY + 4);

    ctx.restore();
  }

  renderSuspensuraFloor(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;

    const floorTopY = h * (27 / gh);
    const floorH = h * (5 / gh);
    const leftX = w * (18 / gw);
    const rightX = w * (73 / gw);

    ctx.save();

    // Bottom layer: Bipedales ceramic tiles (2 Roman feet square bricks)
    ctx.fillStyle = '#8f3c2c';
    ctx.fillRect(leftX, floorTopY + floorH * 0.65, rightX - leftX, floorH * 0.35);

    // Middle layer: Opus signinum hydraulic pozzolana concrete with crushed potsherds
    ctx.fillStyle = '#a6594d';
    ctx.fillRect(leftX, floorTopY + floorH * 0.25, rightX - leftX, floorH * 0.40);

    // Top layer: Polished Roman marble tesserae mosaic pavement
    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(leftX, floorTopY, rightX - leftX, floorH * 0.25);

    // Mosaic meander border line
    ctx.strokeStyle = '#3a201c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, floorTopY);
    ctx.lineTo(rightX, floorTopY);
    ctx.stroke();

    // Frigidarium unheated solid stone floor (X: 74 -> 99)
    const frigX = w * (74 / gw);
    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(frigX, floorTopY, w - frigX, floorH);
    ctx.strokeRect(frigX, floorTopY, w - frigX, floorH);

    ctx.restore();
  }

  renderTubuliFlues(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;

    const flueTopY = h * (6 / gh);
    const flueBottomY = h * (32 / gh);

    ctx.save();
    // Caldarium Left Flue & Caldarium/Tepidarium Flue
    const flueCols = [17, 47];
    flueCols.forEach((col) => {
      const fx = w * (col / gw);
      const fw = w * (1.8 / gw);

      // Hollow clay tile flue casing
      ctx.fillStyle = '#221513';
      ctx.fillRect(fx, flueTopY, fw, flueBottomY - flueTopY);

      // Hot flue gas glow rising through wall
      const draftAlpha = Math.min(0.7, (this.draftVenting / 100.0) * 0.8);
      ctx.fillStyle = `rgba(220, 53, 69, ${draftAlpha})`;
      ctx.fillRect(fx + 1, flueTopY, fw - 2, flueBottomY - flueTopY);

      // Box tile modular lines (tegulae mammatae joints)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 1;
      for (let y = flueTopY; y < flueBottomY; y += 12) {
        ctx.strokeRect(fx, y, fw, 10);
      }
    });

    ctx.restore();
  }

  renderBathHalls(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;

    const roomFloorY = h * (27 / gh);
    const vaultApexY = h * (6 / gh);

    ctx.save();

    // --- 1. CALDARIUM (Hot Bath Hall, X: 19 -> 48) ---
    const caldLeft = w * (19 / gw);
    const caldRight = w * (47 / gw);
    const caldW = caldRight - caldLeft;

    // Barrel Vault Ceiling with Coffered Panels
    this.renderVaultCeiling(ctx, caldLeft, vaultApexY, caldW, roomFloorY - vaultApexY, '#78261e', '#451511');

    // Caldarium Alveus Hot Immersion Pool (X: 22 -> 38, Y: 20 -> 27)
    const poolLeft = w * (22 / gw);
    const poolRight = w * (38 / gw);
    const poolW = poolRight - poolLeft;
    const poolTopY = h * (20 / gh);
    const poolDepth = roomFloorY - poolTopY;

    // Stepped red porphyry marble basin
    ctx.fillStyle = '#5c1d18';
    ctx.fillRect(poolLeft, poolTopY, poolW, poolDepth);

    // Heated steaming water (Caldarium Red with warm highlights)
    const caldTemp = this.temperature[23 * gw + 30] || 52.0;
    const waterColor = caldTemp > 45 ? '#dc3545' : '#e06666';
    ctx.fillStyle = waterColor;
    ctx.globalAlpha = 0.65;
    ctx.fillRect(poolLeft + 2, poolTopY + 4, poolW - 4, poolDepth - 4);
    ctx.globalAlpha = 1.0;

    // Stepped pool marble rim
    ctx.fillStyle = '#dcd3be';
    ctx.fillRect(poolLeft - 4, poolTopY, poolW + 8, 4);

    // Labrum: Elevated Ornate Circular Bronze Cold Water Splash Basin
    const labrumX = w * (43 / gw);
    const labrumY = h * (21 / gh);
    // Marble pedestal
    ctx.fillStyle = '#c7bc9f';
    ctx.fillRect(labrumX - 3, labrumY, 6, roomFloorY - labrumY);
    // Bronze wash bowl
    ctx.fillStyle = '#cd7f32';
    ctx.beginPath();
    ctx.arc(labrumX, labrumY, 11, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#8b5a2b';
    ctx.stroke();

    // Room Inscription
    ctx.font = 'bold 9px "Cinzel", serif';
    ctx.fillStyle = '#dc3545';
    ctx.fillText('I. CALDARIVM (HOT)', caldLeft + 8, vaultApexY + 16);

    // --- 2. TEPIDARIUM (Warm Transition Hall, X: 49 -> 72) ---
    const tepLeft = w * (49 / gw);
    const tepRight = w * (72 / gw);
    const tepW = tepRight - tepLeft;

    // Vaulted Ceiling in Warm Ochre / Terracotta
    this.renderVaultCeiling(ctx, tepLeft, vaultApexY + 8, tepW, roomFloorY - (vaultApexY + 8), '#b3741b', '#5c390b');

    // Warm Lounging Bench (marble seat)
    const benchX = w * (51 / gw);
    const benchW = w * (8 / gw);
    const benchH = h * (4 / gh);
    ctx.fillStyle = '#d8cbb0';
    ctx.fillRect(benchX, roomFloorY - benchH, benchW, benchH);
    ctx.strokeStyle = '#8d7854';
    ctx.strokeRect(benchX, roomFloorY - benchH, benchW, benchH);

    // Warm Water Basin (X: 60 -> 70, Y: 22 -> 27)
    const tepPoolLeft = w * (60 / gw);
    const tepPoolRight = w * (70 / gw);
    const tepPoolW = tepPoolRight - tepPoolLeft;
    const tepPoolTopY = h * (22 / gh);
    const tepPoolDepth = roomFloorY - tepPoolTopY;

    ctx.fillStyle = '#7a5214';
    ctx.fillRect(tepPoolLeft, tepPoolTopY, tepPoolW, tepPoolDepth);

    // Tepidarium Yellow Warm Water
    ctx.fillStyle = '#ffc107';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(tepPoolLeft + 2, tepPoolTopY + 3, tepPoolW - 4, tepPoolDepth - 3);
    ctx.globalAlpha = 1.0;

    // Marble rim
    ctx.fillStyle = '#dcd3be';
    ctx.fillRect(tepPoolLeft - 3, tepPoolTopY, tepPoolW + 6, 3);

    // Room Inscription
    ctx.font = 'bold 9px "Cinzel", serif';
    ctx.fillStyle = '#ffc107';
    ctx.fillText('II. TEPIDARIVM (WARM)', tepLeft + 6, vaultApexY + 22);

    // --- 3. FRIGIDARIUM (Cold Hall & Deep Natatio Pool, X: 74 -> 99) ---
    const frigLeft = w * (74 / gw);
    const frigRight = w * (99 / gw);
    const frigW = frigRight - frigLeft;

    // Vaulted Groin Ceiling with Clerestory Lunette (deep cool blue atmosphere)
    this.renderVaultCeiling(ctx, frigLeft, vaultApexY, frigW, roomFloorY - vaultApexY, '#1b3b6f', '#091c3d');

    // Natatio Cold Plunge Pool (deep basin, cold aqueduct water)
    const natatioLeft = w * (77 / gw);
    const natatioRight = w * (96 / gw);
    const natatioW = natatioRight - natatioLeft;
    const natatioTopY = h * (17 / gh);
    const natatioDepth = roomFloorY - natatioTopY;

    // Cyan mosaic tile lining
    ctx.fillStyle = '#062040';
    ctx.fillRect(natatioLeft, natatioTopY, natatioW, natatioDepth);

    // Deep Clear Frigidarium Blue Water (#007BFF) with Caustics
    ctx.fillStyle = '#007bff';
    ctx.globalAlpha = 0.70;
    ctx.fillRect(natatioLeft + 2, natatioTopY + 3, natatioW - 4, natatioDepth - 3);
    ctx.globalAlpha = 1.0;

    // Caustic rippling highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let cx = natatioLeft + 4; cx < natatioRight - 4; cx += 10) {
      const cy = natatioTopY + 8 + Math.sin(this.simTime * 4.0 + cx * 0.2) * 2.5;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 6, cy + 1);
    }
    ctx.stroke();

    // Marble balustrade & steps
    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(natatioLeft - 4, natatioTopY, natatioW + 8, 4);

    // Room Inscription
    ctx.font = 'bold 9px "Cinzel", serif';
    ctx.fillStyle = '#007bff';
    ctx.fillText('III. FRIGIDARIVM (COLD)', frigLeft + 8, vaultApexY + 16);

    // Columns dividing halls (Corinthian style pilasters)
    this.renderColumn(ctx, caldRight - 3, vaultApexY + 8, 6, roomFloorY - (vaultApexY + 8));
    this.renderColumn(ctx, tepRight - 3, vaultApexY + 8, 6, roomFloorY - (vaultApexY + 8));

    ctx.restore();
  }

  renderVaultCeiling(ctx, x, y, width, height, strokeColor, fillColor) {
    ctx.save();
    // Arched coffered vault
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + height * 0.35);
    ctx.quadraticCurveTo(x + width * 0.5, y, x + width, y + height * 0.35);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Decorative coffer ribs
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    const ribs = 4;
    for (let r = 1; r < ribs; r++) {
      const rx = x + (width / ribs) * r;
      ctx.beginPath();
      ctx.moveTo(rx, y + height * 0.4);
      ctx.lineTo(rx, y + height);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderColumn(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#c7bca1';
    ctx.fillRect(x, y, w, h);
    // Capital & base
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(x - 2, y, w + 4, 4);
    ctx.fillRect(x - 2, y + h - 4, w + 4, 4);
    ctx.restore();
  }

  renderDraftFlowVectors(ctx, w, h) {
    // Show gentle airflow/flue gas drafting arrows in hypocaust and flues
    if (this.draftVenting < 10) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.35)';
    ctx.fillStyle = 'rgba(255, 193, 7, 0.35)';
    ctx.lineWidth = 1.2;

    const draftSpeed = (this.draftVenting / 100.0) * 40.0;
    const offset = (this.simTime * draftSpeed) % 24;

    // Horizontal arrows in hypocaust (X: 20% to 70%, Y: 80%)
    const hypoY = h * 0.80;
    for (let x = w * 0.22; x < w * 0.68; x += 32) {
      const curX = x + offset;
      if (curX < w * 0.70) {
        ctx.beginPath();
        ctx.moveTo(curX, hypoY);
        ctx.lineTo(curX + 12, hypoY);
        ctx.lineTo(curX + 9, hypoY - 2.5);
        ctx.stroke();
      }
    }

    // Upward arrows in tubuli flues
    const flueX = w * (17.5 / this.gridW);
    const vertOffset = (this.simTime * draftSpeed * 1.2) % 20;
    for (let y = h * 0.60; y > h * 0.18; y -= 24) {
      const curY = y - vertOffset;
      if (curY > h * 0.14) {
        ctx.beginPath();
        ctx.moveTo(flueX, curY);
        ctx.lineTo(flueX, curY - 10);
        ctx.lineTo(flueX - 2.5, curY - 7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 2. THERMAL HEATMAP VIEW
  // -------------------------------------------------------------------------
  renderThermalHeatmapView(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;
    const T = this.temperature;

    // If offscreen canvas and imageData are available, use fast pixel blit
    if (this.heatmapCtx && this.heatmapImage) {
      const data = this.heatmapImage.data;
      for (let i = 0; i < this.cellCount; i++) {
        const [r, g, b] = this.getThermalRgb(T[i]);
        const p = i * 4;
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
        data[p + 3] = 255;
      }
      this.heatmapCtx.putImageData(this.heatmapImage, 0, 0);

      // Scale up to full canvas with smooth interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.heatmapCanvas, 0, 0, w, h);
    } else {
      // Direct box fill fallback
      const cellW = w / gw;
      const cellH = h / gh;
      for (let y = 0; y < gh; y++) {
        const row = y * gw;
        const py = y * cellH;
        for (let x = 0; x < gw; x++) {
          const temp = T[row + x];
          const [r, g, b] = this.getThermalRgb(temp);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x * cellW, py, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // Architectural Wireframe Overlay (semi-transparent outlines for context)
    this.renderHeatmapWireframe(ctx, w, h);

    // Isothermal Contour Lines (20°C, 36°C, 50°C, 100°C, 300°C)
    this.renderIsothermContours(ctx, w, h);
  }

  renderHeatmapWireframe(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;

    // Floor lines
    const suspTop = h * (27 / gh);
    const suspBot = h * (32 / gh);
    ctx.beginPath();
    ctx.moveTo(w * (18 / gw), suspTop);
    ctx.lineTo(w * (73 / gw), suspTop);
    ctx.moveTo(w * (18 / gw), suspBot);
    ctx.lineTo(w * (73 / gw), suspBot);
    ctx.stroke();

    // Pool outlines
    ctx.strokeRect(w * (22 / gw), h * (20 / gh), w * (16 / gw), h * (7 / gh));
    ctx.strokeRect(w * (54 / gw), h * (22 / gh), w * (13 / gw), h * (5 / gh));
    ctx.strokeRect(w * (77 / gw), h * (17 / gh), w * (19 / gw), h * (10 / gh));

    // Furnace box outline
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)';
    ctx.strokeRect(w * (3 / gw), h * (35 / gh), w * (14 / gw), h * (8 / gh));

    // Room labels
    ctx.font = 'bold 10px "Cinzel", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('PRAEFVRNIVM', w * 0.05, h * 0.72);
    ctx.fillText('CALDARIVM (HOT)', w * 0.28, h * 0.28);
    ctx.fillText('TEPIDARIVM (WARM)', w * 0.56, h * 0.30);
    ctx.fillText('FRIGIDARIVM (COLD)', w * 0.78, h * 0.25);
    ctx.fillText('HYPOCAVSTVM PILAE (DIFFVSION)', w * 0.35, h * 0.88);

    ctx.restore();
  }

  renderIsothermContours(ctx, w, h) {
    const gw = this.gridW;
    const gh = this.gridH;
    const T = this.temperature;

    ctx.save();
    ctx.lineWidth = 1;

    // Isothermal levels of interest:
    // 20°C: Frigidarium boundary (#007BFF)
    // 36°C: Tepidarium comfort (#FFC107)
    // 52°C: Caldarium bath (#DC3545)
    // 120°C: Hypocaust underfloor
    const isotherms = [
      { temp: 20.0, color: 'rgba(0, 123, 255, 0.75)', label: '20°C (Frigidarium)' },
      { temp: 36.0, color: 'rgba(255, 193, 7, 0.85)', label: '36°C (Tepidarium)' },
      { temp: 52.0, color: 'rgba(220, 53, 69, 0.85)', label: '52°C (Caldarium)' },
      { temp: 120.0, color: 'rgba(255, 255, 255, 0.65)', label: '120°C (Flue)' }
    ];

    const cellW = w / gw;
    const cellH = h / gh;

    isotherms.forEach(({ temp, color }) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      // Sample horizontal edges for contour crossings
      for (let y = 1; y < gh - 1; y += 2) {
        for (let x = 1; x < gw - 1; x += 2) {
          const idx = y * gw + x;
          const t0 = T[idx];
          const tEast = T[idx + 1];
          const tSouth = T[idx + gw];

          if ((t0 <= temp && tEast > temp) || (t0 > temp && tEast <= temp)) {
            const px = (x + 0.5) * cellW;
            const py = y * cellH;
            ctx.moveTo(px, py - 2);
            ctx.lineTo(px, py + 2);
          }
          if ((t0 <= temp && tSouth > temp) || (t0 > temp && tSouth <= temp)) {
            const px = x * cellW;
            const py = (y + 0.5) * cellH;
            ctx.moveTo(px - 2, py);
            ctx.lineTo(px + 2, py);
          }
        }
      }
      ctx.stroke();
    });

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 3. STEAM & EMBER PARTICLES RENDERING
  // -------------------------------------------------------------------------
  renderSteamClouds(ctx) {
    ctx.save();
    for (let i = 0; i < this.maxSteam; i++) {
      const s = this.steamPool[i];
      if (!s.active || s.alpha <= 0.01) continue;

      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#ffffff';

      // Soft billowy steam puff
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(1, s.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderEmbers(ctx) {
    ctx.save();
    for (let i = 0; i < this.maxEmbers; i++) {
      const e = this.emberPool[i];
      if (!e.active || e.alpha <= 0.01) continue;

      ctx.globalAlpha = e.alpha;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 4. TELEMETRY HUD & PROBE
  // -------------------------------------------------------------------------
  renderTelemetryHUD(ctx, w, h) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = (w || this.width) / ui;
    const sh = (h || this.height) / ui;
    const narrow = sw < 560;

    const hudX = narrow ? 10 : 20;
    const hudY = narrow ? 10 : 20;
    const hudW = narrow ? Math.min(sw - 20, 240) : 270;
    const hudH = narrow ? 128 : 150;

    // Semi-translucent dark slate Roman parchment box
    ctx.fillStyle = 'rgba(12, 14, 20, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    // Header Title
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(narrow ? 'THERMAE ROMANAE' : 'THERMAE ROMANAE • HYPOCAUSTVM', hudX + 10, hudY + 18);

    // View Mode Badge on desktop
    if (!narrow) {
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = this.viewMode === 'heatmap' ? '#ffc107' : '#3bd6c6';
      ctx.fillText(
        `VIEW: [ ${this.viewMode.toUpperCase()} ]`,
        hudX + 10,
        hudY + 34
      );
    }

    // Compute live average room temperatures
    const gw = this.gridW;
    const T = this.temperature;

    const caldAvg = T[23 * gw + 30] || 52.0;
    const tepidAvg = T[24 * gw + 60] || 36.0;
    const frigAvg = T[21 * gw + 86] || 18.5;
    const hypoAvg = T[38 * gw + 35] || 145.0;
    const hearthT = T[38 * gw + 10] || 520.0;

    ctx.font = narrow ? '9px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';

    if (narrow) {
      ctx.fillStyle = '#ff8888';
      ctx.fillText(`HEARTH:     ${Math.round(hearthT)}°C (${this.fireRate}% FIRE)`, hudX + 10, hudY + 36);

      ctx.fillStyle = '#dc3545';
      ctx.fillText(`CALDARIVM:  ${caldAvg.toFixed(1)}°C (HOT)`, hudX + 10, hudY + 52);

      ctx.fillStyle = '#ffc107';
      ctx.fillText(`TEPIDARIVM: ${tepidAvg.toFixed(1)}°C (WARM)`, hudX + 10, hudY + 68);

      ctx.fillStyle = '#007bff';
      ctx.fillText(`FRIGIDARIVM: ${frigAvg.toFixed(1)}°C (COLD)`, hudX + 10, hudY + 84);

      ctx.fillStyle = '#e6e8ee';
      ctx.fillText(`DRAFT:      ${this.draftVenting}% | ENT: ${this.getEntityCount()}`, hudX + 10, hudY + 100);
    } else {
      ctx.fillStyle = '#ff8888';
      ctx.fillText(`PRAEFVRNIVM:  ${Math.round(hearthT)}°C (${this.fireRate}% FIRE)`, hudX + 10, hudY + 52);

      ctx.fillStyle = '#dc3545';
      ctx.fillText(`CALDARIVM:    ${caldAvg.toFixed(1)}°C (HOT BATH)`, hudX + 10, hudY + 68);

      ctx.fillStyle = '#ffc107';
      ctx.fillText(`TEPIDARIVM:   ${tepidAvg.toFixed(1)}°C (WARM HALL)`, hudX + 10, hudY + 84);

      ctx.fillStyle = '#007bff';
      ctx.fillText(`FRIGIDARIVM:  ${frigAvg.toFixed(1)}°C (NATATIO)`, hudX + 10, hudY + 100);

      ctx.fillStyle = '#e6e8ee';
      ctx.fillText(`HYPOCAVSTVM:  ${hypoAvg.toFixed(0)}°C (DRAFT: ${this.draftVenting}%)`, hudX + 10, hudY + 116);

      ctx.fillStyle = '#8c909e';
      ctx.fillText(`ENTITIES:     ${this.getEntityCount()} (HEAT+STEAM)`, hudX + 10, hudY + 132);
    }

    // Mini Thermal Gradient Color Legend Bar at the bottom
    const barX = hudX + 10;
    const barY = narrow ? hudY + 114 : hudY + 140;
    const barW = hudW - 20;
    const barH = 4;

    if (ctx.createLinearGradient) {
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0.0, '#007bff'); // Frigidarium Blue
      grad.addColorStop(0.35, '#ffc107'); // Tepidarium Yellow
      grad.addColorStop(0.65, '#dc3545'); // Caldarium Red
      grad.addColorStop(1.0, '#ffffff'); // Incandescent Hearth
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }

  renderProbeTooltip(ctx, w, h) {
    if (this.mousePos.x <= 0 || this.mousePos.y <= 0) return;
    if (this.mousePos.x >= w || this.mousePos.y >= h) return;

    const gw = this.gridW;
    const gh = this.gridH;
    const gx = Math.min(gw - 1, Math.max(0, Math.floor((this.mousePos.x / w) * gw)));
    const gy = Math.min(gh - 1, Math.max(0, Math.floor((this.mousePos.y / h) * gh)));
    const idx = gy * gw + gx;

    const temp = this.temperature ? this.temperature[idx] : 20.0;
    const mat = this.material ? this.material[idx] : MAT_ROOM_AIR;

    let matName = 'ROOM AIR';
    let roomTag = 'CALDARIVM';
    if (mat === MAT_HEARTH) {
      matName = 'PRAEFURNIUM HEARTH';
      roomTag = 'IGNIS';
    } else if (mat === MAT_PILAE) {
      matName = 'PILAE BRICK STACK';
      roomTag = 'HYPOCAUSTUM';
    } else if (mat === MAT_SUSPENSURA) {
      matName = 'SUSPENSURA MOSAIC FLOOR';
      roomTag = 'BALNEUM';
    } else if (mat === MAT_TUBULI) {
      matName = 'TUBULI WALL FLUE';
      roomTag = 'CHIMNEY';
    } else if (mat === MAT_CALDARIUM_WATER) {
      matName = 'CALDARIUM ALVEUS WATER';
      roomTag = 'CALDARIUM';
    } else if (mat === MAT_TEPIDARIUM_WATER) {
      matName = 'TEPIDARIUM BASIN WATER';
      roomTag = 'TEPIDARIUM';
    } else if (mat === MAT_FRIGIDARIUM_WATER) {
      matName = 'FRIGIDARIUM NATATIO WATER';
      roomTag = 'FRIGIDARIUM';
    } else if (mat === MAT_HYPOCAUST_AIR) {
      matName = 'HOT FLUE GAS VOID';
      roomTag = 'HYPOCAUSTUM';
    } else if (gx >= 74) {
      roomTag = 'FRIGIDARIUM';
    } else if (gx >= 49) {
      roomTag = 'TEPIDARIUM';
    }

    ctx.save();
    // Crosshair reticle at mouse
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.mousePos.x, this.mousePos.y, 6, 0, Math.PI * 2);
    ctx.moveTo(this.mousePos.x - 9, this.mousePos.y);
    ctx.lineTo(this.mousePos.x + 9, this.mousePos.y);
    ctx.moveTo(this.mousePos.x, this.mousePos.y - 9);
    ctx.lineTo(this.mousePos.x, this.mousePos.y + 9);
    ctx.stroke();

    // Probe readout box
    const tipX = Math.min(w - 180, Math.max(10, this.mousePos.x + 14));
    const tipY = Math.min(h - 50, Math.max(10, this.mousePos.y - 30));
    ctx.fillStyle = 'rgba(10, 11, 14, 0.9)';
    ctx.strokeStyle = '#d4af37';
    ctx.fillRect(tipX, tipY, 170, 42);
    ctx.strokeRect(tipX, tipY, 170, 42);

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    const [r, g, b] = this.getThermalRgb(temp);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillText(`${temp.toFixed(1)}°C [ ${roomTag} ]`, tipX + 8, tipY + 16);

    ctx.fillStyle = '#cccccc';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText(matName, tipX + 8, tipY + 30);

    ctx.restore();
  }

  // =========================================================================
  // INPUT HANDLING
  // =========================================================================
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };

    // Stoke furnace if clicked near praefurnium
    if (pos.x < this.width * 0.20 && pos.y > this.height * 0.65) {
      this.stokeFurnace();
    }

    // Quench if clicked in Frigidarium pool
    if (pos.x > this.width * 0.75 && pos.y > this.height * 0.25 && pos.y < this.height * 0.60) {
      this.quenchFrigidarium();
    }

    this.ensureAudio();
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };

    if (this.isMouseDown) {
      // Injects localized heat disturbance when dragging with mouse
      const gw = this.gridW;
      const gh = this.gridH;
      const gx = Math.min(gw - 1, Math.max(0, Math.floor((pos.x / this.width) * gw)));
      const gy = Math.min(gh - 1, Math.max(0, Math.floor((pos.y / this.height) * gh)));
      const idx = gy * gw + gx;
      if (this.temperature) {
        this.temperature[idx] = Math.min(700.0, this.temperature[idx] + 25.0);
      }
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    if (pos) {
      this.mousePos = { x: pos.x, y: pos.y };
    }
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.stokeFurnace();
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === 't' || key === 'T') {
      this.viewMode = this.viewMode === 'architectural' ? 'heatmap' : 'architectural';
      if (this.controlsContainer) {
        const archBtn = this.controlsContainer.querySelector('#view-arch');
        const heatBtn = this.controlsContainer.querySelector('#view-heat');
        if (archBtn && heatBtn) {
          if (this.viewMode === 'architectural') {
            archBtn.classList.add('active');
            heatBtn.classList.remove('active');
          } else {
            heatBtn.classList.add('active');
            archBtn.classList.remove('active');
          }
        }
      }
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === 'c' || key === 'C') {
      this.quenchFrigidarium();
    }
  }

  onKeyUp(key, e) {
    // Optional keyup hook
  }

  // =========================================================================
  // AUDIO (Safe Web Audio crackle & steam hiss)
  // =========================================================================
  ensureAudio() {
    if (this.audioInitialized || typeof window === 'undefined' || !window.AudioContext) return;
    try {
      this.audioCtx = new window.AudioContext();
      this.audioInitialized = true;
    } catch (e) {
      // Audio not supported in headless mode
    }
  }

  playAudioCrack() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.16);
    } catch (e) {
      // ignore
    }
  }
}
