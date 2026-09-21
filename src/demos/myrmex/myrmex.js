// Myrmex: Ant Colony Optimization, Subterranean Excavation & Pheromone ALife
// Grounded in Pliny the Elder's Naturalis Historia (Book XI, Ch. 36: The Industry of Ants)

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export const CELL = {
  AIR: 0,
  SOIL_FIRM: 1,   // Compacted subterranean loam, stable & diggable
  SOIL_LOOSE: 2,  // Crumbling sand / excavated dirt, obeys angle-of-repose physics
  ROCK: 3,        // Impenetrable stone barrier
  FOOD: 4,        // Sugar crystals / grain harvest
  WATER: 5        // Rain water flow
};

export const CASTE = {
  WORKER: 0,
  SOLDIER: 1,
  NURSE: 2
};

export class MyrmexEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 1200;
    this.height = canvas.height || 800;
    this.dpr = 1;

    // Simulation grid dimensions
    this.simWidth = 240;
    this.simHeight = 160;
    this.surfaceY = 44; // Surface boundary row

    // Terrain grid and cellular physics
    this.grid = new Uint8Array(this.simWidth * this.simHeight);
    this.soilColorVariance = new Uint8Array(this.simWidth * this.simHeight);

    // Continuous dual pheromone fields
    // Trail (cyan): Foraging paths laid by returning workers
    // Alarm (crimson): Threat signals laid when encountering obstacles/rain/disturbances
    this.foodTrail = new Float32Array(this.simWidth * this.simHeight);
    this.alarmField = new Float32Array(this.simWidth * this.simHeight);
    this.pheromoneTemp = new Float32Array(this.simWidth * this.simHeight);

    // Offscreen pixel buffer for terrain & pheromone rendering
    if (typeof document !== 'undefined' && document.createElement) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.simWidth;
      this.offscreenCanvas.height = this.simHeight;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.imgData = this.offscreenCtx.createImageData(this.simWidth, this.simHeight);
    } else {
      this.offscreenCanvas = null;
      this.offscreenCtx = null;
      this.imgData = { data: new Uint8ClampedArray(this.simWidth * this.simHeight * 4) };
    }

    // Parameters & Sliders
    this.targetPopulation = 220;
    this.evaporationRate = 0.022; // Evaporation per second
    this.diffusionRate = 0.16;   // Diffusion coefficient
    this.activeTool = 'food';    // 'food', 'excavate', 'rock', 'alarm'
    this.brushRadius = 3;

    // Entities
    this.ants = [];
    this.queen = null;
    this.royalEggs = [];
    this.tunnelNodes = [];
    this.foodCount = 0;
    this.rainDrops = [];
    this.floatingAlerts = [];

    // Interaction state
    this.isMouseDown = false;
    this.mousePos = { x: 0, y: 0 };
    this.mouseGrid = { x: 120, y: 35 };
    this.frame = 0;

    // Colony Statistics
    this.stats = {
      foodStored: 45,
      eggsLaid: 12,
      excavations: 0,
      alarmLevel: 0
    };

    // Initialize colony
    this.initControls();
    this.reset();
    attachTouchBridge(this, canvas);
  }

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Tool Selector</label>
        <div class="control-btn-grid" id="myrmex-tool-grid">
          <button class="sub-btn active" data-tool="food">🍬 Drop Food Sugar</button>
          <button class="sub-btn" data-tool="excavate">⛏️ Excavate Soil</button>
          <button class="sub-btn" data-tool="rock">🪨 Place Rock Barrier</button>
          <button class="sub-btn" data-tool="alarm">🚨 Alarm Pulse</button>
        </div>
      </div>

      <div class="control-group">
        <label>Ant Colony Population: <span id="myrmex-pop-val">${this.targetPopulation}</span></label>
        <input type="range" id="myrmex-pop-slider" min="50" max="500" step="10" value="${this.targetPopulation}">
      </div>

      <div class="control-group">
        <label>Pheromone Evaporation: <span id="myrmex-evap-val">${this.evaporationRate.toFixed(3)}</span></label>
        <input type="range" id="myrmex-evap-slider" min="0.005" max="0.08" step="0.005" value="${this.evaporationRate}">
      </div>

      <div class="control-group">
        <label>Pheromone Diffusion: <span id="myrmex-diff-val">${this.diffusionRate.toFixed(2)}</span></label>
        <input type="range" id="myrmex-diff-slider" min="0.02" max="0.40" step="0.02" value="${this.diffusionRate}">
      </div>

      <div class="control-group" style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
        <button id="myrmex-spawn-eggs-btn" class="sub-btn" style="background: rgba(212,175,55,0.18); border-color: var(--accent-gold); font-weight: bold; padding: 7px;">
          👑 Spawn Queen Egg Batch
        </button>
        <button id="myrmex-rain-btn" class="sub-btn" style="background: rgba(45,135,235,0.2); border-color: #2d87eb; font-weight: bold; padding: 7px;">
          🌧️ Inundate Nest with Rain
        </button>
      </div>
    `;

    // Tool selection binding
    const toolButtons = this.controlsContainer.querySelectorAll('#myrmex-tool-grid .sub-btn');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.dataset.tool;
      });
    });

    // Sliders binding
    const popSlider = this.controlsContainer.querySelector('#myrmex-pop-slider');
    const popVal = this.controlsContainer.querySelector('#myrmex-pop-val');
    if (popSlider && popVal) {
      popSlider.addEventListener('input', (e) => {
        this.targetPopulation = parseInt(e.target.value, 10);
        popVal.textContent = this.targetPopulation;
        this.adjustPopulation();
      });
    }

    const evapSlider = this.controlsContainer.querySelector('#myrmex-evap-slider');
    const evapVal = this.controlsContainer.querySelector('#myrmex-evap-val');
    if (evapSlider && evapVal) {
      evapSlider.addEventListener('input', (e) => {
        this.evaporationRate = parseFloat(e.target.value);
        evapVal.textContent = this.evaporationRate.toFixed(3);
      });
    }

    const diffSlider = this.controlsContainer.querySelector('#myrmex-diff-slider');
    const diffVal = this.controlsContainer.querySelector('#myrmex-diff-val');
    if (diffSlider && diffVal) {
      diffSlider.addEventListener('input', (e) => {
        this.diffusionRate = parseFloat(e.target.value);
        diffVal.textContent = this.diffusionRate.toFixed(2);
      });
    }

    // Action buttons
    const eggBtn = this.controlsContainer.querySelector('#myrmex-spawn-eggs-btn');
    if (eggBtn) {
      eggBtn.addEventListener('click', () => {
        this.spawnQueenEggBatch();
      });
    }

    const rainBtn = this.controlsContainer.querySelector('#myrmex-rain-btn');
    if (rainBtn) {
      rainBtn.addEventListener('click', () => {
        this.inundateNestWithRain();
      });
    }
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  reset() {
    this.buildSubterraneanTerrain();
    this.foodTrail.fill(0);
    this.alarmField.fill(0);
    this.royalEggs = [];
    this.rainDrops = [];
    this.floatingAlerts = [];

    // Initialize Queen in royal chamber
    this.queen = {
      x: 120,
      y: 126,
      heading: 0,
      size: 7.5,
      eggTimer: 4.0,
      legCycle: 0
    };

    // Populate initial royal egg cluster
    for (let i = 0; i < 14; i++) {
      this.royalEggs.push({
        x: 114 + Math.random() * 12,
        y: 124 + Math.random() * 5,
        carriedBy: null
      });
    }

    // Populate ants according to target population
    this.ants = [];
    this.adjustPopulation();
    this.recountFood();
  }

  buildSubterraneanTerrain() {
    const w = this.simWidth;
    const h = this.simHeight;
    const sY = this.surfaceY;

    this.grid.fill(CELL.AIR);

    // Procedural noise for soil shading variance
    for (let i = 0; i < w * h; i++) {
      this.soilColorVariance[i] = Math.floor(Math.random() * 32);
    }

    // Subterranean soil foundation
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;

        // Impenetrable bedrock base
        if (y >= h - 6) {
          this.grid[idx] = CELL.ROCK;
          continue;
        }

        // Subterranean soil layer below surface
        if (y >= sY) {
          this.grid[idx] = CELL.SOIL_FIRM;
        }

        // Ant hill mound on surface: bell curve from x=85 to x=155 rising to y=32
        const moundDist = Math.abs(x - 120);
        if (moundDist < 36 && y < sY) {
          const moundHeight = Math.max(0, (sY - 32) * Math.cos((moundDist / 36) * (Math.PI * 0.5)));
          if (y >= sY - moundHeight) {
            this.grid[idx] = CELL.SOIL_LOOSE;
          }
        }
      }
    }

    // Tunnel and Chamber Excavation Architecture
    // Define landmark tunnel nodes for AI wayfinding and colony telemetry
    this.tunnelNodes = [
      { id: 'crater', x: 120, y: 34, r: 5, type: 'entrance', name: 'Hill Crater' },
      { id: 'junction_top', x: 120, y: 55, r: 7, type: 'junction', name: 'Upper Shaft' },
      { id: 'granary_w', x: 55, y: 68, r: 11, type: 'granary', name: 'West Granary' },
      { id: 'granary_e', x: 185, y: 68, r: 11, type: 'granary', name: 'East Granary' },
      { id: 'junction_mid', x: 120, y: 82, r: 8, type: 'junction', name: 'Central Crossroads' },
      { id: 'nursery_w', x: 72, y: 98, r: 13, type: 'nursery', name: 'West Brood Nursery' },
      { id: 'nursery_e', x: 168, y: 98, r: 13, type: 'nursery', name: 'East Brood Nursery' },
      { id: 'queen_chamber', x: 120, y: 126, r: 18, type: 'royal', name: 'Queen Royal Chamber' },
      { id: 'deep_haven', x: 120, y: 146, r: 12, type: 'haven', name: 'Sub-Bedrock Haven' }
    ];

    // Carve chambers around nodes
    this.tunnelNodes.forEach(node => {
      this.carveCircle(node.x, node.y, node.r, CELL.AIR);
    });

    // Carve connecting tunnel shafts
    this.carveLine(120, 32, 120, 82, 3.5);   // Central vertical entrance shaft
    this.carveLine(120, 82, 120, 126, 3.5);  // Deep royal shaft
    this.carveLine(120, 126, 120, 146, 2.5); // Haven descent
    this.carveLine(120, 55, 55, 68, 3.0);    // Ramp to West Granary
    this.carveLine(120, 55, 185, 68, 3.0);   // Ramp to East Granary
    this.carveLine(120, 82, 72, 98, 3.2);    // Shaft to West Nursery
    this.carveLine(120, 82, 168, 98, 3.2);   // Shaft to East Nursery
    this.carveLine(72, 98, 120, 126, 2.8);   // Nursery to Queen transit tunnel
    this.carveLine(168, 98, 120, 126, 2.8);  // Nursery to Queen transit tunnel

    // Scatter subterranean rock boulders to divert paths
    const boulderCoords = [
      [35, 85, 5], [92, 70, 4], [148, 70, 4], [205, 85, 5],
      [90, 112, 5], [150, 112, 5], [42, 128, 6], [198, 128, 6]
    ];
    boulderCoords.forEach(([bx, by, br]) => {
      this.carveCircle(bx, by, br, CELL.ROCK);
    });

    // Seed initial food sugar deposits on surface and in granaries
    this.seedFoodCluster(35, sY - 2, 12, 28);
    this.seedFoodCluster(205, sY - 2, 12, 28);
    this.seedFoodCluster(55, 68, 6, 16);
    this.seedFoodCluster(185, 68, 6, 16);
  }

  carveCircle(cx, cy, r, cellType) {
    const w = this.simWidth;
    const h = this.simHeight;
    const r2 = r * r;
    const minX = Math.max(1, Math.floor(cx - r));
    const maxX = Math.min(w - 2, Math.ceil(cx + r));
    const minY = Math.max(1, Math.floor(cy - r));
    const maxY = Math.min(h - 2, Math.ceil(cy + r));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = (y - cy) * 1.25; // Slight elliptical horizontal elongation
        if (dx * dx + dy * dy <= r2) {
          this.grid[y * w + x] = cellType;
        }
      }
    }
  }

  carveLine(x0, y0, x1, y1, radius) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.carveCircle(x, y, radius, CELL.AIR);
    }
  }

  seedFoodCluster(cx, cy, radius, count) {
    const w = this.simWidth;
    const h = this.simHeight;
    let placed = 0;
    for (let i = 0; i < count * 3 && placed < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const x = Math.floor(cx + Math.cos(ang) * dist);
      const y = Math.floor(cy + Math.sin(ang) * dist);
      if (x > 1 && x < w - 2 && y > 1 && y < h - 2) {
        const idx = y * w + x;
        if (this.grid[idx] === CELL.AIR || this.grid[idx] === CELL.SOIL_LOOSE) {
          this.grid[idx] = CELL.FOOD;
          placed++;
        }
      }
    }
  }

  adjustPopulation() {
    const target = this.targetPopulation;
    while (this.ants.length < target) {
      // Caste distribution: 70% Worker, 15% Soldier, 15% Nurse
      const roll = Math.random();
      let caste = CASTE.WORKER;
      if (roll < 0.15) caste = CASTE.SOLDIER;
      else if (roll < 0.30) caste = CASTE.NURSE;

      // Spawn near entrance or nursery nodes
      const startNode = caste === CASTE.NURSE
        ? (Math.random() < 0.5 ? this.tunnelNodes[5] : this.tunnelNodes[6])
        : this.tunnelNodes[Math.floor(Math.random() * this.tunnelNodes.length)];

      const ant = {
        x: startNode.x + (Math.random() - 0.5) * 6,
        y: startNode.y + (Math.random() - 0.5) * 4,
        heading: Math.random() * Math.PI * 2,
        speed: 28 + Math.random() * 14,
        caste: caste,
        state: 'forage', // 'forage', 'return', 'dig', 'defend', 'nurse'
        carrying: null,  // null, 'food', 'dirt', 'egg'
        walkCycle: Math.random() * Math.PI * 2,
        turnTimer: Math.random() * 1.5,
        energy: 60 + Math.random() * 60,
        age: Math.random() * 200
      };

      if (caste === CASTE.SOLDIER) {
        ant.speed *= 1.15;
        ant.state = 'defend';
      } else if (caste === CASTE.NURSE) {
        ant.speed *= 0.85;
        ant.state = 'nurse';
      }

      this.ants.push(ant);
    }

    if (this.ants.length > target) {
      this.ants.length = target;
    }
  }

  spawnQueenEggBatch() {
    if (!this.queen) return;
    for (let i = 0; i < 12; i++) {
      this.royalEggs.push({
        x: this.queen.x + (Math.random() - 0.5) * 10,
        y: this.queen.y + (Math.random() - 0.5) * 5,
        carriedBy: null
      });
    }
    this.stats.eggsLaid += 12;
    this.addFloatingAlert('👑 Royal Brood Clutched (+12 Eggs)', this.queen.x, this.queen.y - 12, '#d4af37');
  }

  inundateNestWithRain() {
    // Spawn downpour of rain particles
    for (let i = 0; i < 80; i++) {
      this.rainDrops.push({
        x: Math.random() * this.simWidth,
        y: -Math.random() * 20,
        vy: 80 + Math.random() * 40
      });
    }

    // Trigger high-intensity alarm in entrance crater and tunnels
    this.addAlarmPulse(120, 35, 2.5);
    this.addAlarmPulse(120, 60, 2.0);
    this.addFloatingAlert('🌧️ TORRENTIAL INUNDATION!', 120, 24, '#c83232');
  }

  addAlarmPulse(gridX, gridY, intensity = 2.0) {
    const w = this.simWidth;
    const h = this.simHeight;
    const r = 16;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = Math.floor(gridX + dx);
        const y = Math.floor(gridY + dy);
        if (x >= 0 && x < w && y >= 0 && y < h) {
          const dist = Math.hypot(dx, dy);
          if (dist <= r) {
            const idx = y * w + x;
            this.alarmField[idx] = Math.min(3.0, this.alarmField[idx] + (1 - dist / r) * intensity);
          }
        }
      }
    }
    this.stats.alarmLevel = 1.0;
  }

  addFloatingAlert(text, x, y, color = '#3bd6c6') {
    this.floatingAlerts.push({
      text,
      x,
      y,
      color,
      life: 2.4,
      maxLife: 2.4
    });
    if (this.floatingAlerts.length > 5) {
      this.floatingAlerts.shift();
    }
  }

  update(dt) {
    // Clamp delta time to avoid simulation instability
    const stepDt = Math.min(dt, 0.05);
    this.frame++;

    // 1. Pheromone Evaporation & Diffusion
    this.updatePheromones(stepDt);

    // 2. Cellular Falling Sand / Soil Crumble & Rain Physics
    this.updateCellularPhysics(stepDt);

    // 3. Raindrop precipitation
    this.updateRain(stepDt);

    // 4. Queen Life Cycle
    this.updateQueen(stepDt);

    // 5. Ant Superorganism Autonomous Agents
    this.updateAnts(stepDt);

    // 6. User continuous brush dragging
    if (this.isMouseDown) {
      this.applyTool(this.mouseGrid.x, this.mouseGrid.y);
    }

    // 7. Update floating notifications
    for (let i = this.floatingAlerts.length - 1; i >= 0; i--) {
      const a = this.floatingAlerts[i];
      a.life -= stepDt;
      a.y -= stepDt * 4.0;
      if (a.life <= 0) {
        this.floatingAlerts.splice(i, 1);
      }
    }

    // Slowly decay colony alarm metric
    this.stats.alarmLevel = Math.max(0, this.stats.alarmLevel - stepDt * 0.15);

    // Periodically recount food particles
    if (this.frame % 30 === 0) {
      this.recountFood();
    }
  }

  updatePheromones(dt) {
    const w = this.simWidth;
    const h = this.simHeight;
    const totalCells = w * h;

    const evapFactor = Math.max(0, 1 - this.evaporationRate * dt);
    const alarmEvapFactor = Math.max(0, 1 - (this.evaporationRate * 1.4) * dt);

    // Evaporate both continuous fields
    for (let i = 0; i < totalCells; i++) {
      if (this.foodTrail[i] > 0.001) {
        this.foodTrail[i] *= evapFactor;
      } else {
        this.foodTrail[i] = 0;
      }

      if (this.alarmField[i] > 0.001) {
        this.alarmField[i] *= alarmEvapFactor;
      } else {
        this.alarmField[i] = 0;
      }
    }

    // Diffuse pheromones every 2 frames for optimal 60fps performance
    if (this.frame % 2 === 0) {
      const diffCoeff = Math.min(0.24, this.diffusionRate * 0.5);

      // Diffuse food trail through open spaces
      this.diffuseField(this.foodTrail, this.pheromoneTemp, diffCoeff);
      // Diffuse alarm field
      this.diffuseField(this.alarmField, this.pheromoneTemp, diffCoeff * 1.2);
    }
  }

  diffuseField(field, temp, k) {
    const w = this.simWidth;
    const h = this.simHeight;
    temp.set(field);

    // 4-neighbor laplacian diffusion
    for (let y = 1; y < h - 1; y++) {
      const rowIdx = y * w;
      for (let x = 1; x < w - 1; x++) {
        const idx = rowIdx + x;
        const current = temp[idx];
        if (current < 0.01 &&
            temp[idx - 1] < 0.01 &&
            temp[idx + 1] < 0.01 &&
            temp[idx - w] < 0.01 &&
            temp[idx + w] < 0.01) {
          continue;
        }

        // Stones block pheromone diffusion
        if (this.grid[idx] === CELL.ROCK) {
          field[idx] = 0;
          continue;
        }

        const neighborSum = temp[idx - 1] + temp[idx + 1] + temp[idx - w] + temp[idx + w];
        field[idx] = current + (neighborSum * 0.25 - current) * k;
      }
    }
  }

  updateCellularPhysics(dt) {
    const w = this.simWidth;
    const h = this.simHeight;
    const grid = this.grid;

    // Scan from bottom upward to model gravity and angle of repose correctly
    // Alternate horizontal sweep direction to prevent left/right bias
    const sweepDir = (this.frame % 2 === 0) ? 1 : -1;
    const startX = sweepDir === 1 ? 1 : w - 2;
    const endX = sweepDir === 1 ? w - 1 : 0;

    for (let y = h - 2; y >= 1; y--) {
      for (let x = startX; x !== endX; x += sweepDir) {
        const idx = y * w + x;
        const cell = grid[idx];

        if (cell === CELL.SOIL_LOOSE || cell === CELL.FOOD) {
          const below = idx + w;

          // 1. Direct vertical gravity drop
          if (grid[below] === CELL.AIR) {
            grid[below] = cell;
            grid[idx] = CELL.AIR;
          } else if (grid[below] === CELL.WATER && cell === CELL.SOIL_LOOSE) {
            // Sand sinks through water
            grid[below] = CELL.SOIL_LOOSE;
            grid[idx] = CELL.WATER;
          } else {
            // 2. Angle-of-repose diagonal crumbling (30-35 degree slope)
            const leftBelow = below - 1;
            const rightBelow = below + 1;
            const roll = Math.random() < 0.5;
            const first = roll ? leftBelow : rightBelow;
            const second = roll ? rightBelow : leftBelow;

            if (grid[first] === CELL.AIR) {
              grid[first] = cell;
              grid[idx] = CELL.AIR;
            } else if (grid[second] === CELL.AIR) {
              grid[second] = cell;
              grid[idx] = CELL.AIR;
            }
          }
        } else if (cell === CELL.WATER) {
          // Liquid fluid dynamics: flow down, diagonal, or spread horizontally
          const below = idx + w;
          if (grid[below] === CELL.AIR) {
            grid[below] = CELL.WATER;
            grid[idx] = CELL.AIR;
          } else {
            const leftBelow = below - 1;
            const rightBelow = below + 1;
            if (grid[leftBelow] === CELL.AIR) {
              grid[leftBelow] = CELL.WATER;
              grid[idx] = CELL.AIR;
            } else if (grid[rightBelow] === CELL.AIR) {
              grid[rightBelow] = CELL.WATER;
              grid[idx] = CELL.AIR;
            } else {
              // Lateral fluid spread
              const left = idx - 1;
              const right = idx + 1;
              const roll = Math.random() < 0.5;
              const dir1 = roll ? left : right;
              const dir2 = roll ? right : left;

              if (grid[dir1] === CELL.AIR) {
                grid[dir1] = CELL.WATER;
                grid[idx] = CELL.AIR;
              } else if (grid[dir2] === CELL.AIR) {
                grid[dir2] = CELL.WATER;
                grid[idx] = CELL.AIR;
              } else if (Math.random() < 0.003) {
                // Soil absorbs stagnant standing water
                grid[idx] = CELL.AIR;
              }
            }
          }
        }
      }
    }
  }

  updateRain(dt) {
    const w = this.simWidth;
    const h = this.simHeight;
    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const drop = this.rainDrops[i];
      drop.y += drop.vy * dt;
      const gx = Math.floor(drop.x);
      const gy = Math.floor(drop.y);

      if (gy >= 0 && gy < h && gx >= 0 && gx < w) {
        const idx = gy * w + gx;
        if (this.grid[idx] !== CELL.AIR) {
          // Rain lands: convert air space immediately above into water droplet
          const aboveIdx = (gy - 1) * w + gx;
          if (gy > 0 && this.grid[aboveIdx] === CELL.AIR) {
            this.grid[aboveIdx] = CELL.WATER;
          }
          this.rainDrops.splice(i, 1);
        }
      } else if (drop.y >= h) {
        this.rainDrops.splice(i, 1);
      }
    }
  }

  updateQueen(dt) {
    if (!this.queen) return;
    const q = this.queen;

    // Queen gently paces inside the royal chamber (x: 112 to 128)
    q.eggTimer -= dt;
    q.legCycle += dt * 3.0;

    const targetX = 120 + Math.sin(this.frame * 0.02) * 8;
    const dx = targetX - q.x;
    q.x += dx * dt * 0.8;
    q.heading = dx > 0 ? 0.1 : Math.PI - 0.1;

    // Natural egg oviposition cycle
    if (q.eggTimer <= 0) {
      q.eggTimer = 8.0 + Math.random() * 6.0;
      this.royalEggs.push({
        x: q.x + (Math.random() - 0.5) * 4,
        y: q.y + 2,
        carriedBy: null
      });
      this.stats.eggsLaid++;
    }
  }

  updateAnts(dt) {
    const w = this.simWidth;
    const h = this.simHeight;
    const sY = this.surfaceY;

    for (let i = 0; i < this.ants.length; i++) {
      const ant = this.ants[i];
      ant.walkCycle += dt * (ant.speed * 0.3);
      ant.turnTimer -= dt;

      // 1. Sensory Perception (Antennae Braitenberg Chemotaxis)
      // Left and right sensory whiskers sampling ahead
      const sensorDist = 5.0;
      const sensorAngle = 0.55;

      const leftX = Math.floor(ant.x + Math.cos(ant.heading - sensorAngle) * sensorDist);
      const leftY = Math.floor(ant.y + Math.sin(ant.heading - sensorAngle) * sensorDist);
      const rightX = Math.floor(ant.x + Math.cos(ant.heading + sensorAngle) * sensorDist);
      const rightY = Math.floor(ant.y + Math.sin(ant.heading + sensorAngle) * sensorDist);

      const leftTrail = this.samplePheromone(this.foodTrail, leftX, leftY);
      const rightTrail = this.samplePheromone(this.foodTrail, rightX, rightY);
      const leftAlarm = this.samplePheromone(this.alarmField, leftX, leftY);
      const rightAlarm = this.samplePheromone(this.alarmField, rightX, rightY);

      // Behavior decision tree based on Caste & State
      if (ant.caste === CASTE.SOLDIER) {
        // Soldier Behavior: Patrols perimeter, drawn strongly to alarm pheromones
        if (leftAlarm > 0.05 || rightAlarm > 0.05) {
          ant.state = 'defend';
          // Steer directly up alarm gradient
          ant.heading += (rightAlarm - leftAlarm) * 0.4;
          ant.speed = 52.0; // Aggressive sprint
        } else {
          ant.state = 'patrol';
          ant.speed = 30.0;
          if (ant.turnTimer <= 0) {
            ant.heading += (Math.random() - 0.5) * 1.2;
            ant.turnTimer = 0.8 + Math.random() * 1.5;
          }
        }
      } else if (ant.caste === CASTE.NURSE) {
        // Nurse Behavior: Stays in royal and brood chambers, tends and moves eggs
        ant.speed = 24.0;
        if (leftAlarm > 0.1 || rightAlarm > 0.1) {
          // Flee alarm deeper into nest
          ant.heading -= (rightAlarm - leftAlarm) * 0.5;
        }

        // Egg tending
        if (!ant.carrying) {
          // Search for loose eggs to care for
          for (let eIdx = 0; eIdx < this.royalEggs.length; eIdx++) {
            const egg = this.royalEggs[eIdx];
            if (!egg.carriedBy && Math.hypot(egg.x - ant.x, egg.y - ant.y) < 3.5) {
              ant.carrying = 'egg';
              egg.carriedBy = ant;
              break;
            }
          }
        } else if (ant.carrying === 'egg') {
          // Deposit egg safely in nursery or royal chamber
          if (ant.y > 90 && Math.random() < 0.015) {
            ant.carrying = null;
            // Detach carried egg
            const egg = this.royalEggs.find(e => e.carriedBy === ant);
            if (egg) {
              egg.carriedBy = null;
              egg.x = ant.x;
              egg.y = ant.y;
            }
          }
        }

        if (ant.turnTimer <= 0) {
          ant.heading += (Math.random() - 0.5) * 1.5;
          ant.turnTimer = 0.6 + Math.random() * 1.2;
        }
      } else {
        // Worker Behavior: Foraging, Excavation, Food Hauling
        if (ant.carrying === 'food') {
          // Returning with food: deposit cyan trail pheromone
          this.depositPheromone(this.foodTrail, ant.x, ant.y, 0.85);

          // Head towards nest entrance (if on surface) or deep into granary
          if (ant.y < sY) {
            // Steer towards ant hill crater (x: 120, y: 34)
            const angleToCrater = Math.atan2(34 - ant.y, 120 - ant.x);
            ant.heading = this.lerpAngle(ant.heading, angleToCrater, 0.18);
          } else {
            // Steer towards nearest granary or queen
            const target = ant.x < 120 ? this.tunnelNodes[2] : this.tunnelNodes[3];
            const angleToGranary = Math.atan2(target.y - ant.y, target.x - ant.x);
            ant.heading = this.lerpAngle(ant.heading, angleToGranary, 0.14);

            // Reached granary or queen chamber: deposit food
            if (Math.hypot(target.x - ant.x, target.y - ant.y) < 7 || ant.y >= 120) {
              ant.carrying = null;
              this.stats.foodStored++;
              ant.heading += Math.PI; // Turn back around to forage
              ant.state = 'forage';
            }
          }
        } else if (ant.carrying === 'dirt') {
          // Excavating: haul loose dirt pellet up to surface crater mound
          if (ant.y > 36) {
            const angleToCrater = Math.atan2(34 - ant.y, 120 - ant.x);
            ant.heading = this.lerpAngle(ant.heading, angleToCrater, 0.2);
          } else {
            // At surface mound: deposit loose crumbling sand on flanks
            const depositX = Math.floor(ant.x + (Math.random() < 0.5 ? -3 : 3));
            const depositY = Math.floor(ant.y);
            if (depositX > 1 && depositX < w - 2 && depositY > 1 && depositY < h - 2) {
              const depIdx = depositY * w + depositX;
              if (this.grid[depIdx] === CELL.AIR) {
                this.grid[depIdx] = CELL.SOIL_LOOSE;
              }
            }
            ant.carrying = null;
            ant.heading += Math.PI;
            this.stats.excavations++;
          }
        } else {
          // Foraging / Searching
          // If on surface: follow cyan trail towards sugar or wander
          if (ant.y < sY) {
            if (leftTrail > 0.05 || rightTrail > 0.05) {
              // Chemotaxis steering towards food source
              ant.heading += (rightTrail - leftTrail) * 0.35;
            } else if (ant.turnTimer <= 0) {
              ant.heading += (Math.random() - 0.5) * 1.4;
              ant.turnTimer = 0.5 + Math.random() * 1.5;
            }
          } else {
            // Underground: either climb out to forage, or excavate tunnel edges
            if (Math.random() < 0.02 && ant.y < 70) {
              // Climb out towards surface
              ant.heading = this.lerpAngle(ant.heading, -Math.PI * 0.5, 0.2);
            } else if (ant.turnTimer <= 0) {
              ant.heading += (Math.random() - 0.5) * 1.5;
              ant.turnTimer = 0.6 + Math.random() * 1.4;
            }
          }
        }
      }

      // 2. Kinematic Translation & Collision Handling
      const moveDist = ant.speed * dt;
      const nextX = ant.x + Math.cos(ant.heading) * moveDist;
      const nextY = ant.y + Math.sin(ant.heading) * moveDist;

      const gx = Math.floor(nextX);
      const gy = Math.floor(nextY);

      if (gx < 1 || gx >= w - 1 || gy < 1 || gy >= h - 1) {
        // Boundary bounce
        ant.heading += Math.PI * 0.75;
        continue;
      }

      const nextCell = this.grid[gy * w + gx];

      if (nextCell === CELL.AIR || nextCell === CELL.SOIL_LOOSE) {
        // Clear passage: advance
        ant.x = nextX;
        ant.y = nextY;
      } else if (nextCell === CELL.FOOD) {
        // Encountered food crystal!
        if (ant.caste === CASTE.WORKER && !ant.carrying) {
          ant.carrying = 'food';
          this.grid[gy * w + gx] = CELL.AIR; // Harvest grain
          ant.heading += Math.PI; // Reverse direction
        } else {
          ant.heading += Math.PI * 0.6;
        }
      } else if (nextCell === CELL.SOIL_FIRM) {
        // Encountered firm subterranean soil
        if (ant.caste === CASTE.WORKER && !ant.carrying && ant.y > sY + 8 && Math.random() < 0.12) {
          // Nibble / excavate new tunnel passage!
          this.grid[gy * w + gx] = CELL.AIR;
          ant.carrying = 'dirt';
          ant.heading += Math.PI;
        } else {
          // Rebound away from tunnel wall
          ant.heading += (Math.random() - 0.5) * Math.PI * 0.9 + Math.PI * 0.5;
        }
      } else if (nextCell === CELL.ROCK) {
        // Rock obstacle: bounce and alert
        ant.heading += Math.PI * 0.7;
        this.depositPheromone(this.alarmField, ant.x, ant.y, 0.4);
      } else if (nextCell === CELL.WATER) {
        // Water pool: trigger alarm and back away
        ant.heading += Math.PI;
        this.depositPheromone(this.alarmField, ant.x, ant.y, 0.7);
      }
    }
  }

  samplePheromone(field, x, y) {
    if (x < 0 || x >= this.simWidth || y < 0 || y >= this.simHeight) return 0;
    return field[y * this.simWidth + x];
  }

  depositPheromone(field, x, y, amount) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx >= 0 && gx < this.simWidth && gy >= 0 && gy < this.simHeight) {
      const idx = gy * this.simWidth + gx;
      field[idx] = Math.min(2.5, field[idx] + amount);
    }
  }

  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }

  recountFood() {
    let count = 0;
    const total = this.simWidth * this.simHeight;
    for (let i = 0; i < total; i++) {
      if (this.grid[i] === CELL.FOOD) count++;
    }
    // Count carried food items
    this.ants.forEach(a => {
      if (a.carrying === 'food') count++;
    });
    this.foodCount = count;
  }

  applyTool(gridX, gridY) {
    const w = this.simWidth;
    const h = this.simHeight;
    const r = this.brushRadius;

    if (this.activeTool === 'alarm') {
      this.addAlarmPulse(gridX, gridY, 2.2);
      return;
    }

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = Math.floor(gridX + dx);
          const y = Math.floor(gridY + dy);
          if (x >= 1 && x < w - 1 && y >= 1 && y < h - 1) {
            const idx = y * w + x;
            if (this.activeTool === 'food') {
              if (this.grid[idx] === CELL.AIR || this.grid[idx] === CELL.SOIL_LOOSE) {
                this.grid[idx] = CELL.FOOD;
              }
            } else if (this.activeTool === 'excavate') {
              if (this.grid[idx] !== CELL.ROCK) {
                this.grid[idx] = CELL.AIR;
              }
            } else if (this.activeTool === 'rock') {
              this.grid[idx] = CELL.ROCK;
            }
          }
        }
      }
    }
  }

  render(ctx) {
    const w = this.simWidth;
    const h = this.simHeight;
    const sY = this.surfaceY;
    const data = this.imgData.data;

    // 1. Generate cutaway terrain and bioluminescent pheromone pixel buffer
    let p = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const cell = this.grid[idx];
        const trailVal = Math.min(1.0, this.foodTrail[idx]);
        const alarmVal = Math.min(1.0, this.alarmField[idx]);
        const variance = this.soilColorVariance[idx];

        let r = 0, g = 0, b = 0, a = 255;

        if (cell === CELL.AIR) {
          if (y < sY) {
            // Above ground open twilight air atmosphere
            const skyT = y / sY;
            r = Math.floor(10 + skyT * 8);
            g = Math.floor(14 + skyT * 12);
            b = Math.floor(22 + skyT * 16);
          } else {
            // Subterranean excavated hollow tunnel interior
            r = 14;
            g = 10;
            b = 9;
          }
        } else if (cell === CELL.SOIL_FIRM) {
          // Compacted subterranean loam / earth strata
          const depthT = (y - sY) / (h - sY);
          // Dark earth gradient #1a1412 transitioning to deep clay #261a15
          r = Math.floor(26 + depthT * 12 + variance * 0.3);
          g = Math.floor(20 + depthT * 8 + variance * 0.2);
          b = Math.floor(18 + depthT * 6 + variance * 0.2);
        } else if (cell === CELL.SOIL_LOOSE) {
          // Crumbling sand / ant hill surface crater soil
          r = Math.floor(75 + variance * 0.6);
          g = Math.floor(52 + variance * 0.4);
          b = Math.floor(36 + variance * 0.3);
        } else if (cell === CELL.ROCK) {
          // Ancient Roman stone / bedrock barrier
          r = Math.floor(68 + variance * 0.4);
          g = Math.floor(72 + variance * 0.4);
          b = Math.floor(82 + variance * 0.5);
        } else if (cell === CELL.FOOD) {
          // Glistening sugar crystal
          r = 210;
          g = 250;
          b = 245;
        } else if (cell === CELL.WATER) {
          // Water flow
          r = 45;
          g = 135;
          b = 235;
        }

        // Additive bioluminescent glow for Pheromone Trails
        // Food trail (cyan: #3bd6c6 -> [59, 214, 198])
        if (trailVal > 0.01) {
          r = Math.min(255, Math.floor(r + 59 * trailVal * 1.5));
          g = Math.min(255, Math.floor(g + 214 * trailVal * 1.5));
          b = Math.min(255, Math.floor(b + 198 * trailVal * 1.5));
        }

        // Alarm signal (crimson: #c83232 -> [200, 50, 50])
        if (alarmVal > 0.01) {
          r = Math.min(255, Math.floor(r + 200 * alarmVal * 1.8));
          g = Math.min(255, Math.floor(g + 50 * alarmVal * 0.8));
          b = Math.min(255, Math.floor(b + 50 * alarmVal * 0.8));
        }

        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
        data[p + 3] = a;
        p += 4;
      }
    }

    // 2. Blit offscreen buffer scaled up to main canvas
    if (this.offscreenCtx) {
      this.offscreenCtx.putImageData(this.imgData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
    }

    // Coordinate scalers
    const sx = this.width / this.simWidth;
    const sy = this.height / this.simHeight;

    // 3. Render Royal Eggs
    ctx.fillStyle = '#f4f6fa';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 4;
    for (let i = 0; i < this.royalEggs.length; i++) {
      const egg = this.royalEggs[i];
      if (!egg.carriedBy) {
        ctx.beginPath();
        ctx.ellipse(egg.x * sx, egg.y * sy, 2.8 * sx, 1.8 * sy, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // 4. Render The Queen Ant
    if (this.queen) {
      this.renderQueen(ctx, this.queen, sx, sy);
    }

    // 5. Render Autonomous Worker, Soldier, and Nurse Ants
    for (let i = 0; i < this.ants.length; i++) {
      this.renderAnt(ctx, this.ants[i], sx, sy);
    }

    // 6. Render Raindrop Streaks
    if (this.rainDrops.length > 0) {
      ctx.strokeStyle = 'rgba(80, 165, 245, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < this.rainDrops.length; i++) {
        const drop = this.rainDrops[i];
        ctx.moveTo(drop.x * sx, drop.y * sy);
        ctx.lineTo(drop.x * sx, (drop.y + 4) * sy);
      }
      ctx.stroke();
    }

    // 7. Render Interactive Tool Brush Cursor Indicator
    if (this.mousePos && !this.isMouseDown) {
      ctx.strokeStyle = this.activeTool === 'alarm' ? 'rgba(200, 50, 50, 0.7)' : 'rgba(59, 214, 198, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, this.brushRadius * sx, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 8. Render Floating Notification Alerts
    for (let i = 0; i < this.floatingAlerts.length; i++) {
      const a = this.floatingAlerts[i];
      const alpha = Math.min(1.0, a.life / (a.maxLife * 0.5));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = a.color;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText(a.text, a.x * sx, a.y * sy);
      ctx.restore();
    }

    // 9. Subterranean Telemetry HUD in Corner
    this.renderHUD(ctx);
  }

  renderAnt(ctx, ant, sx, sy) {
    const px = ant.x * sx;
    const py = ant.y * sy;
    const heading = ant.heading;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(heading);

    const isSoldier = ant.caste === CASTE.SOLDIER;
    const isNurse = ant.caste === CASTE.NURSE;
    const scale = isSoldier ? 1.35 : (isNurse ? 0.9 : 1.0);

    // Chitin coloration
    let bodyColor = '#2b170c'; // Dark espresso for worker
    let headColor = '#3a1f10';
    if (isSoldier) {
      bodyColor = '#1a0e08';
      headColor = '#611b15'; // Dark armored crimson head
    } else if (isNurse) {
      bodyColor = '#7a4b18';
      headColor = '#9e6422'; // Golden amber
    }

    // 6 Articulated scurrying legs using cyclical walking gait
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 1.0 * scale;
    const legPhase = ant.walkCycle;

    // Alternating tripod gait: 3 left/right leg pairs
    const legOffsets = [-2.5, 0, 2.5];
    for (let i = 0; i < 3; i++) {
      const offset = legOffsets[i] * scale;
      const swing = Math.sin(legPhase + i * 1.5) * 2.8 * scale;

      // Left leg
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset - swing * 0.5, -4.5 * scale);
      ctx.lineTo(offset - swing, -7.0 * scale);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + swing * 0.5, 4.5 * scale);
      ctx.lineTo(offset + swing, 7.0 * scale);
      ctx.stroke();
    }

    // Gaster / Abdomen
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-3.8 * scale, 0, 3.2 * scale, 2.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thorax & Petiole waist
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.8 * scale, 1.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = headColor;
    ctx.beginPath();
    const headRadius = isSoldier ? 2.5 * scale : 1.8 * scale;
    ctx.arc(2.8 * scale, 0, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(3.5 * scale, -0.8 * scale);
    ctx.lineTo(5.5 * scale, -2.5 * scale);
    ctx.lineTo(7.5 * scale, -2.0 * scale);
    ctx.moveTo(3.5 * scale, 0.8 * scale);
    ctx.lineTo(5.5 * scale, 2.5 * scale);
    ctx.lineTo(7.5 * scale, 2.0 * scale);
    ctx.stroke();

    // Prominent mandibles for soldiers
    if (isSoldier) {
      ctx.strokeStyle = '#c83232';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4.5 * scale, -1.2 * scale);
      ctx.lineTo(6.8 * scale, -0.6 * scale);
      ctx.moveTo(4.5 * scale, 1.2 * scale);
      ctx.lineTo(6.8 * scale, 0.6 * scale);
      ctx.stroke();
    }

    // Carried Item in mandibles
    if (ant.carrying === 'food') {
      ctx.fillStyle = '#3bd6c6';
      ctx.shadowColor = '#3bd6c6';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(5.2 * scale, 0, 2.0 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (ant.carrying === 'dirt') {
      ctx.fillStyle = '#5c3a20';
      ctx.beginPath();
      ctx.arc(4.8 * scale, 0, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (ant.carrying === 'egg') {
      ctx.fillStyle = '#f4f6fa';
      ctx.beginPath();
      ctx.ellipse(5.2 * scale, 0, 2.4 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderQueen(ctx, queen, sx, sy) {
    const px = queen.x * sx;
    const py = queen.y * sy;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(queen.heading);

    const scale = 2.2;

    // Articulated walking legs
    ctx.strokeStyle = '#5a3010';
    ctx.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) {
      const offset = i * 4.0;
      const swing = Math.sin(queen.legCycle + i * 1.8) * 3.5;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset - swing, -9.0);
      ctx.lineTo(offset - swing * 1.2, -14.0);
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + swing, 9.0);
      ctx.lineTo(offset + swing * 1.2, 14.0);
      ctx.stroke();
    }

    // Huge Royal Gaster with golden striped tergites
    ctx.fillStyle = '#7a3e12';
    ctx.beginPath();
    ctx.ellipse(-8.5, 0, 9.0, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    for (let g = -14; g <= -3; g += 3.5) {
      ctx.beginPath();
      ctx.moveTo(g, -4.5);
      ctx.lineTo(g, 4.5);
      ctx.stroke();
    }

    // Royal Thorax
    ctx.fillStyle = '#9e5618';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Regal Head
    ctx.fillStyle = '#6e3810';
    ctx.beginPath();
    ctx.arc(6.5, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Golden Crown antennae
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8.5, -1.2);
    ctx.lineTo(12.5, -4.5);
    ctx.lineTo(16.0, -3.5);
    ctx.moveTo(8.5, 1.2);
    ctx.lineTo(12.5, 4.5);
    ctx.lineTo(16.0, 3.5);
    ctx.stroke();

    ctx.restore();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    const w = narrow ? Math.min(sw - 28, 260) : 260;
    const h = 62;
    const x = 14;
    const y = sh - 76;

    ctx.fillStyle = 'rgba(10, 12, 16, 0.72)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText('COLONIA MYRMEX (NAT. HIST. XI)', x + 10, y + 18);

    ctx.fillStyle = '#8c909e';
    ctx.font = '10px "JetBrains Mono", monospace';
    const workers = this.ants.filter(a => a.caste === CASTE.WORKER).length;
    const soldiers = this.ants.filter(a => a.caste === CASTE.SOLDIER).length;
    const nurses = this.ants.filter(a => a.caste === CASTE.NURSE).length;

    ctx.fillText(`Ants: ${this.ants.length} (W:${workers} S:${soldiers} N:${nurses})`, x + 10, y + 34);
    ctx.fillText(`Granary: ${this.stats.foodStored} | Brood Eggs: ${this.royalEggs.length}`, x + 10, y + 50);
    ctx.restore();
  }

  getEntityCount() {
    // Integer count of active ants, food particles, and landmark tunnel nodes
    const antCount = this.ants.length + (this.queen ? 1 : 0);
    const nodeCount = this.tunnelNodes.length;
    return Math.floor(antCount + this.foodCount + nodeCount);
  }

  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = pos;
    this.updateMouseGrid(pos);

    // Right-click always places rock barrier
    if (pos.button === 2) {
      const prevTool = this.activeTool;
      this.activeTool = 'rock';
      this.applyTool(this.mouseGrid.x, this.mouseGrid.y);
      this.activeTool = prevTool;
      return;
    }

    this.applyTool(this.mouseGrid.x, this.mouseGrid.y);
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    this.updateMouseGrid(pos);
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    if (pos) {
      this.mousePos = pos;
      this.updateMouseGrid(pos);
    }
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      // Spacebar triggers emergency alarm pulse
      this.addAlarmPulse(this.mouseGrid.x, this.mouseGrid.y, 2.4);
      this.addFloatingAlert('🚨 ALARM PULSE BROADCAST', this.mouseGrid.x, this.mouseGrid.y - 10, '#c83232');
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === 'f' || key === 'F') {
      this.activeTool = 'food';
      this.syncToolButtons();
    } else if (key === 'e' || key === 'E') {
      this.activeTool = 'excavate';
      this.syncToolButtons();
    } else if (key === 'r' || key === 'R') {
      this.activeTool = 'rock';
      this.syncToolButtons();
    }
  }

  onKeyUp(key, e) {}

  onWheel(deltaY) {
    // Scroll adjusts brush radius
    if (deltaY < 0) {
      this.brushRadius = Math.min(10, this.brushRadius + 1);
    } else {
      this.brushRadius = Math.max(1, this.brushRadius - 1);
    }
  }

  onContextMenu(pos) {
    // Suppress default browser context menu
    if (pos) {
      this.updateMouseGrid(pos);
      this.applyTool(this.mouseGrid.x, this.mouseGrid.y);
    }
  }

  updateMouseGrid(pos) {
    if (!pos) return;
    this.mouseGrid.x = Math.max(0, Math.min(this.simWidth - 1, (pos.x / this.width) * this.simWidth));
    this.mouseGrid.y = Math.max(0, Math.min(this.simHeight - 1, (pos.y / this.height) * this.simHeight));
  }

  syncToolButtons() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const btns = this.controlsContainer.querySelectorAll('#myrmex-tool-grid .sub-btn');
    btns.forEach(b => {
      if (b.dataset.tool === this.activeTool) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.ants = [];
    this.royalEggs = [];
    this.tunnelNodes = [];
    this.rainDrops = [];
    this.floatingAlerts = [];
  }
}
