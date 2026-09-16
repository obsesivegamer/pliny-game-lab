/**
 * Pliny Game Lab — Forum Builder (Roman Town Planner)
 * 
 * Classical Roman urban planning simulation based on Vitruvius (De Architectura I-VI).
 * Simulates:
 * 1. Cardo Maximus (N-S) and Decumanus Maximus (E-W) axial grid planning
 * 2. Connected road network graph and orthogonal Roman castrum street grid
 * 3. Multi-tier Insulae residential density and demographic growth
 * 4. Aqueduct Lacus (Fountain) hydraulic pressure radius
 * 5. Thermae (Public Baths) hygiene & recreation service radius
 * 6. Templum (Civic Temple) piety, concord, and moral harmony
 * 7. Autonomous Roman citizen walking agents with BFS road pathfinding
 */

export class ForumBuilderEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    // Simulation Grid Parameters
    this.cols = 24;
    this.rows = 16;
    this.cardoX = 12;      // Column index of Cardo Maximus (N-S)
    this.decumanusY = 8;   // Row index of Decumanus Maximus (E-W)

    this.cellSize = 32;
    this.originX = 0;
    this.originY = 0;

    // Simulation Pace & Tool Selection
    this.simSpeed = 1.0;
    this.activeTool = 'road'; // 'road', 'insula', 'baths', 'temple', 'fountain', 'demolish'
    this.activePreset = 'colonia';
    this.showWaterOverlay = true;

    // State Tracking
    this.grid = [];
    this.citizens = [];
    this.particles = [];
    this.nextCitizenId = 1;
    this.nextParticleId = 1;
    this.simTimer = 0;
    this.animTime = 0;

    // Demographics & Telemetry
    this.totalPopulation = 0;
    this.waterCoverage = 100;
    this.civicHarmony = 100;
    this.bathCoverage = 100;
    this.templeCoverage = 100;

    // Interaction State
    this.mousePos = { x: 0, y: 0 };
    this.hoverGrid = { x: -1, y: -1, valid: false };
    this.isMouseDown = false;
    this.lastPlacedCell = { x: -1, y: -1 };

    // Procedural Audio (Web Audio API)
    this.audioCtx = null;

    // Initialize Grid, Controls, and Default Colonia Preset
    this.initGrid();
    this.buildControls();
    this.reset();
  }

  // =========================================================================
  // GRID INITIALIZATION & DATA STRUCTURE
  // =========================================================================

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const isCardo = (c === this.cardoX);
        const isDecumanus = (r === this.decumanusY);
        row.push({
          x: c,
          y: r,
          type: 'empty', // 'empty', 'road', 'insula', 'baths', 'temple', 'fountain', 'forum'
          isCardo,
          isDecumanus,
          density: 1, // 1 to 4 for insula
          growthTimer: 0,
          hasRoad: false,
          hasWater: false,
          hasBaths: false,
          hasTemple: false,
          waterDist: 999,
          animScale: 1.0,
          variant: (c * 7 + r * 13) % 4,
          citizensCount: 0
        });
      }
      this.grid.push(row);
    }
  }

  // =========================================================================
  // CONTROLS & UI (SAFE HEADLESS DOM GUARD)
  // =========================================================================

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>CIVIC STRUCTURE</span>
          <span id="forum-tool-label" style="color: var(--accent-gold, #d4af37); font-weight:600;">Via (Road)</span>
        </label>
        <div class="control-btn-grid" style="grid-template-columns: repeat(3, 1fr); gap: 4px;">
          <button class="sub-btn active" data-tool="road">🛣️ Road [1]</button>
          <button class="sub-btn" data-tool="insula">🏘️ Insula [2]</button>
          <button class="sub-btn" data-tool="baths">♨️ Baths [3]</button>
          <button class="sub-btn" data-tool="temple">🏛️ Temple [4]</button>
          <button class="sub-btn" data-tool="fountain">⛲ Fountain [5]</button>
          <button class="sub-btn" data-tool="demolish">⛏️ Demolish [X]</button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>SIMULATION PACE</span>
          <span id="speed-label" style="color: var(--accent-gold, #d4af37); font-weight:600;">1.0x</span>
        </label>
        <input type="range" id="speed-slider" min="0.2" max="3.0" step="0.1" value="1.0">
      </div>

      <div class="control-group">
        <label>CIVIC OPERATIONS</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="btn-water-overlay">💧 Water Radius</button>
          <button class="sub-btn" id="btn-clear-plan">🧹 Clear Plan</button>
        </div>
      </div>

      <div class="control-group">
        <label>URBAN PRESETS</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" data-preset="colonia">🏛️ Colonia</button>
          <button class="sub-btn" data-preset="castrum">⚔️ Castrum</button>
        </div>
        <button class="sub-btn" style="margin-top: 4px; width: 100%;" data-preset="empty">📜 Tabula Rasa (Blank)</button>
      </div>

      <div class="control-group" style="background: rgba(255, 255, 255, 0.03); padding: 8px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.75rem; font-family: var(--font-mono, monospace);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: var(--text-muted, #888);">Popvlatio:</span>
          <span id="telemetry-pop" style="color: #ECEFF1; font-weight: 600;">0 Quirites</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: var(--text-muted, #888);">Aqva (Water):</span>
          <span id="telemetry-water" style="color: #3498DB; font-weight: 600;">100%</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted, #888);">Concordia (Harmony):</span>
          <span id="telemetry-concord" style="color: #27AE60; font-weight: 600;">100%</span>
        </div>
      </div>
    `;

    // Tool Selector buttons
    const toolButtons = this.controlsContainer.querySelectorAll('[data-tool]');
    const toolLabel = this.controlsContainer.querySelector('#forum-tool-label');
    const toolNames = {
      road: 'Via (Road)',
      insula: 'Insula (Housing)',
      baths: 'Thermae (Baths)',
      temple: 'Templum (Temple)',
      fountain: 'Lacus (Fountain)',
      demolish: 'Demolish Tool'
    };

    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.dataset.tool;
        if (toolLabel) toolLabel.textContent = toolNames[this.activeTool] || this.activeTool;
      });
    });

    // Simulation Speed Slider
    const speedSlider = this.controlsContainer.querySelector('#speed-slider');
    const speedLabel = this.controlsContainer.querySelector('#speed-label');
    if (speedSlider && speedLabel) {
      speedSlider.addEventListener('input', (e) => {
        this.simSpeed = parseFloat(e.target.value);
        speedLabel.textContent = `${this.simSpeed.toFixed(1)}x`;
      });
    }

    // Water Radius Toggle
    const waterBtn = this.controlsContainer.querySelector('#btn-water-overlay');
    if (waterBtn) {
      waterBtn.addEventListener('click', () => {
        this.showWaterOverlay = !this.showWaterOverlay;
        waterBtn.classList.toggle('active', this.showWaterOverlay);
      });
    }

    // Clear Plan Button
    const clearBtn = this.controlsContainer.querySelector('#btn-clear-plan');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.applyPreset('empty');
      });
    }

    // Preset Buttons
    const presetButtons = this.controlsContainer.querySelectorAll('[data-preset]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activePreset = btn.dataset.preset;
        this.applyPreset(this.activePreset);
      });
    });
  }

  updateDomTelemetry() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const popEl = this.controlsContainer.querySelector('#telemetry-pop');
    if (popEl) popEl.textContent = `${this.totalPopulation} Quirites`;

    const waterEl = this.controlsContainer.querySelector('#telemetry-water');
    if (waterEl) waterEl.textContent = `${Math.round(this.waterCoverage)}%`;

    const concordEl = this.controlsContainer.querySelector('#telemetry-concord');
    if (concordEl) concordEl.textContent = `${Math.round(this.civicHarmony)}%`;
  }

  // =========================================================================
  // PRESETS & RESET
  // =========================================================================

  reset() {
    this.applyPreset(this.activePreset || 'colonia');
  }

  applyPreset(presetKey) {
    this.initGrid();
    this.citizens = [];
    this.particles = [];

    // Always lay out the fundamental Cardo & Decumanus Roman axes
    for (let r = 0; r < this.rows; r++) {
      this.grid[r][this.cardoX].type = 'road';
    }
    for (let c = 0; c < this.cols; c++) {
      this.grid[this.decumanusY][c].type = 'road';
    }

    // Grand Forum at the intersection of Cardo and Decumanus
    this.grid[this.decumanusY][this.cardoX].type = 'forum';

    if (presetKey === 'colonia') {
      // Secondary street grid
      for (let r = 4; r <= 12; r++) {
        this.grid[r][8].type = 'road';
        this.grid[r][16].type = 'road';
      }
      for (let c = 8; c <= 16; c++) {
        this.grid[4][c].type = 'road';
        this.grid[12][c].type = 'road';
      }

      // Civic Monuments
      this.grid[6][14].type = 'temple';
      this.grid[10][10].type = 'baths';
      this.grid[6][10].type = 'fountain';
      this.grid[10][14].type = 'fountain';

      // Residential Quarters (Insulae)
      const insulaCoords = [
        [5, 9], [5, 11], [5, 13], [5, 15],
        [7, 9], [7, 11], [7, 15],
        [9, 9], [9, 13], [9, 15],
        [11, 9], [11, 11], [11, 13], [11, 15]
      ];
      for (const [r, c] of insulaCoords) {
        if (this.grid[r][c].type === 'empty') {
          this.grid[r][c].type = 'insula';
          this.grid[r][c].density = ((r + c) % 3) + 1;
        }
      }
    } else if (presetKey === 'castrum') {
      // Orthogonal Roman military garrison grid
      for (let c = 4; c <= 20; c++) {
        this.grid[4][c].type = 'road';
        this.grid[12][c].type = 'road';
      }
      for (let r = 2; r <= 14; r++) {
        this.grid[r][6].type = 'road';
        this.grid[r][18].type = 'road';
      }

      // HQ and shrines
      this.grid[7][11].type = 'temple';
      this.grid[9][13].type = 'baths';
      this.grid[6][12].type = 'fountain';
      this.grid[10][12].type = 'fountain';

      // Barrack blocks
      for (let r = 5; r <= 11; r += 2) {
        for (let c = 7; c <= 17; c += 2) {
          if (this.grid[r][c].type === 'empty') {
            this.grid[r][c].type = 'insula';
            this.grid[r][c].density = 2;
          }
        }
      }
    }

    this.recomputeCityMetrics();

    // Spawn initial citizens
    this.spawnInitialCitizens(presetKey === 'empty' ? 4 : 24);
  }

  destroy() {
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }

  // =========================================================================
  // RESIZE & COORDINATE TRANSFORMATIONS
  // =========================================================================

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;

    // Compute optimal responsive cell dimensions
    const padX = 24;
    const padTop = 50;
    const padBottom = 30;
    const availW = Math.max(100, this.width - padX * 2);
    const availH = Math.max(100, this.height - padTop - padBottom);

    this.cellSize = Math.max(18, Math.min(48, Math.floor(Math.min(availW / this.cols, availH / this.rows))));
    this.originX = Math.floor((this.width - this.cols * this.cellSize) / 2);
    this.originY = Math.floor(padTop + (availH - this.rows * this.cellSize) / 2);
  }

  screenToGrid(sx, sy) {
    const gx = Math.floor((sx - this.originX) / this.cellSize);
    const gy = Math.floor((sy - this.originY) / this.cellSize);
    const valid = (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows);
    return { x: gx, y: gy, valid };
  }

  gridToScreen(gx, gy) {
    return {
      x: this.originX + gx * this.cellSize,
      y: this.originY + gy * this.cellSize,
      cx: this.originX + (gx + 0.5) * this.cellSize,
      cy: this.originY + (gy + 0.5) * this.cellSize
    };
  }

  // =========================================================================
  // SIMULATION ENGINE: ROADS, WATER, DEMOGRAPHICS & PATHFINDING
  // =========================================================================

  update(dt) {
    const clampedDt = Math.min(dt, 0.1) * this.simSpeed;
    this.animTime += clampedDt;
    this.simTimer += clampedDt;

    // Periodic civic simulation step (demographics & water network)
    if (this.simTimer >= 0.5) {
      this.simTimer = 0;
      this.stepDemographics(0.5);
      this.recomputeCityMetrics();
      this.updateDomTelemetry();
    }

    // Update Building Placement Animations
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.animScale < 1.0) {
          cell.animScale = Math.min(1.0, cell.animScale + clampedDt * 4.0);
        }
      }
    }

    // Update Citizens
    this.updateCitizens(clampedDt);

    // Maintain Citizen Population Target
    const targetCount = Math.max(4, Math.min(100, Math.floor(this.totalPopulation / 5)));
    if (this.citizens.length < targetCount && Math.random() < 0.2) {
      this.spawnCitizen();
    } else if (this.citizens.length > targetCount + 6) {
      this.citizens.pop();
    }

    // Update Ambient Particles (Fountain spray, bath steam, temple flame)
    this.updateParticles(clampedDt);
    this.spawnAmbientParticles();
  }

  stepDemographics(dt) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type !== 'insula') continue;

        // An insula prospers when serviced by roads and fresh water
        const isIdeal = cell.hasRoad && cell.hasWater;
        if (isIdeal) {
          cell.growthTimer += dt * 0.15;
          if (cell.growthTimer >= 1.0) {
            cell.growthTimer = 0;
            // Upgrade density based on civic access
            if (cell.density === 1) {
              cell.density = 2;
            } else if (cell.density === 2 && cell.hasBaths) {
              cell.density = 3;
            } else if (cell.density === 3 && cell.hasTemple) {
              cell.density = 4;
            }
          }
        } else if (!cell.hasRoad || !cell.hasWater) {
          // Stagnation or decline
          cell.growthTimer -= dt * 0.1;
          if (cell.growthTimer <= -1.0) {
            cell.growthTimer = 0;
            if (cell.density > 1) {
              cell.density -= 1;
            }
          }
        }
      }
    }
  }

  recomputeCityMetrics() {
    const fountains = [];
    const baths = [];
    const temples = [];
    let totalInsulae = 0;
    let wateredInsulae = 0;
    let bathedInsulae = 0;
    let templedInsulae = 0;
    let popSum = 0;

    // Collect civic buildings
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type === 'fountain') fountains.push(cell);
        else if (cell.type === 'baths') baths.push(cell);
        else if (cell.type === 'temple') temples.push(cell);
      }
    }

    // Recompute service radii and road adjacency for all cells
    const waterRadius = 5.5; // Aqueduct radius in grid units
    const bathsRadius = 6.0;
    const templeRadius = 6.0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];

        // Check road adjacency (orthogonally connected to road or forum)
        cell.hasRoad = this.isRoadOrForum(c + 1, r) ||
                       this.isRoadOrForum(c - 1, r) ||
                       this.isRoadOrForum(c, r + 1) ||
                       this.isRoadOrForum(c, r - 1);

        // Water supply distance
        let minDist = 999;
        for (const f of fountains) {
          const d = Math.hypot(f.x - c, f.y - r);
          if (d < minDist) minDist = d;
        }
        cell.waterDist = minDist;
        cell.hasWater = (minDist <= waterRadius);

        // Baths access
        cell.hasBaths = baths.some(b => Math.hypot(b.x - c, b.y - r) <= bathsRadius);

        // Temple access
        cell.hasTemple = temples.some(t => Math.hypot(t.x - c, t.y - r) <= templeRadius);

        // Calculate population for insulae
        if (cell.type === 'insula') {
          totalInsulae++;
          if (cell.hasWater) wateredInsulae++;
          if (cell.hasBaths) bathedInsulae++;
          if (cell.hasTemple) templedInsulae++;

          const popTable = [0, 15, 35, 65, 100];
          popSum += popTable[cell.density] || 15;
        }
      }
    }

    this.totalPopulation = popSum;
    this.waterCoverage = totalInsulae > 0 ? (wateredInsulae / totalInsulae) * 100 : 100;
    this.bathCoverage = totalInsulae > 0 ? (bathedInsulae / totalInsulae) * 100 : 100;
    this.templeCoverage = totalInsulae > 0 ? (templedInsulae / totalInsulae) * 100 : 100;

    this.civicHarmony = Math.round(
      this.waterCoverage * 0.4 +
      this.bathCoverage * 0.3 +
      this.templeCoverage * 0.3
    );
  }

  isRoadOrForum(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    const t = this.grid[y][x].type;
    return t === 'road' || t === 'forum';
  }

  // =========================================================================
  // CITIZEN AGENTS (WALKING SIMULATION)
  // =========================================================================

  spawnInitialCitizens(count) {
    for (let i = 0; i < count; i++) {
      this.spawnCitizen();
    }
  }

  spawnCitizen() {
    // Find candidate road tiles adjacent to insulae or forum
    const roadTiles = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.isRoadOrForum(c, r)) {
          roadTiles.push({ x: c, y: r });
        }
      }
    }

    if (roadTiles.length === 0) return;

    const start = roadTiles[Math.floor(Math.random() * roadTiles.length)];
    const roles = ['senator', 'citizen', 'matron', 'priest', 'artisan'];
    const role = roles[Math.floor(Math.random() * roles.length)];

    const citizen = {
      id: this.nextCitizenId++,
      x: start.x,
      y: start.y,
      gx: start.x,
      gy: start.y,
      homeX: start.x,
      homeY: start.y,
      role,
      speed: 1.6 + Math.random() * 0.8,
      path: [],
      pathIdx: 0,
      state: 'walking', // 'walking', 'lingering'
      lingerTimer: 0,
      bounce: Math.random() * Math.PI * 2,
      targetType: 'forum'
    };

    this.assignCitizenDestination(citizen);
    this.citizens.push(citizen);
  }

  assignCitizenDestination(citizen) {
    // Find interesting civic destinations
    const destinations = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type === 'forum' || cell.type === 'temple' || cell.type === 'baths' || cell.type === 'fountain') {
          // Find adjacent road tile
          const adj = this.getAdjacentRoadTile(c, r);
          if (adj) {
            destinations.push({ x: adj.x, y: adj.y, type: cell.type });
          }
        }
      }
    }

    if (destinations.length === 0) {
      // Pick random road tile
      const roadTiles = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.isRoadOrForum(c, r)) roadTiles.push({ x: c, y: r, type: 'stroll' });
        }
      }
      if (roadTiles.length > 0) {
        const dest = roadTiles[Math.floor(Math.random() * roadTiles.length)];
        this.routeCitizen(citizen, dest.x, dest.y);
        citizen.targetType = 'stroll';
      }
      return;
    }

    const target = destinations[Math.floor(Math.random() * destinations.length)];
    citizen.targetType = target.type;
    this.routeCitizen(citizen, target.x, target.y);
  }

  getAdjacentRoadTile(gx, gy) {
    const candidates = [
      { x: gx, y: gy },
      { x: gx + 1, y: gy },
      { x: gx - 1, y: gy },
      { x: gx, y: gy + 1 },
      { x: gx, y: gy - 1 }
    ];
    for (const p of candidates) {
      if (this.isRoadOrForum(p.x, p.y)) return p;
    }
    return null;
  }

  routeCitizen(citizen, destX, destY) {
    const curX = Math.round(citizen.x);
    const curY = Math.round(citizen.y);

    const path = this.findPath(curX, curY, destX, destY);
    if (path && path.length > 1) {
      citizen.path = path;
      citizen.pathIdx = 1;
      citizen.state = 'walking';
    } else {
      citizen.state = 'lingering';
      citizen.lingerTimer = 1.0 + Math.random() * 2.0;
    }
  }

  findPath(startX, startY, goalX, goalY) {
    if (startX === goalX && startY === goalY) return [{ x: startX, y: startY }];

    const queue = [{ x: startX, y: startY }];
    const visited = new Uint8Array(this.cols * this.rows);
    const parent = new Int32Array(this.cols * this.rows).fill(-1);

    const startIdx = startY * this.cols + startX;
    visited[startIdx] = 1;

    let found = false;

    while (queue.length > 0) {
      const cur = queue.shift();
      const curIdx = cur.y * this.cols + cur.x;

      if (cur.x === goalX && cur.y === goalY) {
        found = true;
        break;
      }

      const neighbors = [
        { x: cur.x + 1, y: cur.y },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x, y: cur.y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < this.cols && n.y >= 0 && n.y < this.rows) {
          const nIdx = n.y * this.cols + n.x;
          if (!visited[nIdx] && this.isRoadOrForum(n.x, n.y)) {
            visited[nIdx] = 1;
            parent[nIdx] = curIdx;
            queue.push(n);
          }
        }
      }
    }

    if (!found) return null;

    // Backtrack path
    const path = [];
    let curIdx = goalY * this.cols + goalX;
    while (curIdx !== -1) {
      const px = curIdx % this.cols;
      const py = Math.floor(curIdx / this.cols);
      path.unshift({ x: px, y: py });
      curIdx = parent[curIdx];
    }
    return path;
  }

  updateCitizens(dt) {
    for (const c of this.citizens) {
      c.bounce += dt * 10.0;

      if (c.state === 'walking') {
        if (!c.path || c.pathIdx >= c.path.length) {
          c.state = 'lingering';
          c.lingerTimer = 2.0 + Math.random() * 3.0;
          continue;
        }

        const target = c.path[c.pathIdx];
        const dx = target.x - c.x;
        const dy = target.y - c.y;
        const dist = Math.hypot(dx, dy);
        const step = c.speed * dt;

        if (dist <= step) {
          c.x = target.x;
          c.y = target.y;
          c.pathIdx++;
          if (c.pathIdx >= c.path.length) {
            c.state = 'lingering';
            c.lingerTimer = 2.0 + Math.random() * 3.0;
          }
        } else {
          c.x += (dx / dist) * step;
          c.y += (dy / dist) * step;
        }
      } else if (c.state === 'lingering') {
        c.lingerTimer -= dt;
        if (c.lingerTimer <= 0) {
          this.assignCitizenDestination(c);
        }
      }
    }
  }

  // =========================================================================
  // AMBIENT PARTICLES (FOUNTAINS, THERMAE STEAM, SACRIFICIAL FLAMES)
  // =========================================================================

  spawnAmbientParticles() {
    if (this.particles.length > 180) return;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const pos = this.gridToScreen(c, r);

        if (cell.type === 'fountain') {
          // Bubbling aquatic spray
          if (Math.random() < 0.25) {
            this.particles.push({
              id: this.nextParticleId++,
              x: pos.cx + (Math.random() - 0.5) * 6,
              y: pos.cy + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 12,
              vy: -15 - Math.random() * 20,
              life: 1.0,
              maxLife: 1.0,
              color: '#3498DB',
              size: 2.0,
              type: 'water'
            });
          }
        } else if (cell.type === 'baths') {
          // Warm mineral steam puffs
          if (Math.random() < 0.15) {
            this.particles.push({
              id: this.nextParticleId++,
              x: pos.cx + (Math.random() - 0.5) * (this.cellSize * 0.6),
              y: pos.cy + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 6,
              vy: -8 - Math.random() * 12,
              life: 1.5,
              maxLife: 1.5,
              color: 'rgba(236, 239, 241, 0.4)',
              size: 3.5 + Math.random() * 2,
              type: 'steam'
            });
          }
        } else if (cell.type === 'temple') {
          // Incense smoke and sacrificial altar spark
          if (Math.random() < 0.1) {
            this.particles.push({
              id: this.nextParticleId++,
              x: pos.cx,
              y: pos.cy + this.cellSize * 0.25,
              vx: (Math.random() - 0.5) * 4,
              vy: -10 - Math.random() * 14,
              life: 1.2,
              maxLife: 1.2,
              color: Math.random() < 0.5 ? '#E67E22' : '#D4AF37',
              size: 2.0,
              type: 'fire'
            });
          }
        }
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'water') {
        p.vy += 60 * dt; // Gravity
      } else if (p.type === 'steam') {
        p.size += dt * 3; // Expansion
      }
    }
  }

  spawnConstructionDust(gx, gy) {
    const pos = this.gridToScreen(gx, gy);
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 35;
      this.particles.push({
        id: this.nextParticleId++,
        x: pos.cx,
        y: pos.cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: '#D5C7A9',
        size: 2.5 + Math.random() * 2,
        type: 'dust'
      });
    }
  }

  // =========================================================================
  // RENDERING ENGINE: CLASSICAL ROMAN CITY PLAN
  // =========================================================================

  render(ctx) {
    const w = this.width;
    const h = this.height;

    ctx.save();

    // 1. Classical Drafting Table Background (Travertine stone parchment)
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, w, h);

    // City Boundary & Travertine Basin
    const gridW = this.cols * this.cellSize;
    const gridH = this.rows * this.cellSize;
    const ox = this.originX;
    const oy = this.originY;

    // Subtle ambient grid shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(ox + 6, oy + 6, gridW, gridH);

    // Plan Foundation (Opus Caementicium foundation slab)
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(ox, oy, gridW, gridH);

    // Outer Pomerium border (Sacred Roman city boundary)
    ctx.strokeStyle = '#3D342B';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 2, oy - 2, gridW + 4, gridH + 4);

    // 2. Render Ground Plots & Grid Lines
    this.renderGroundGrid(ctx, ox, oy, gridW, gridH);

    // 3. Render Water Aura (Aqueduct Supply Radius)
    if (this.showWaterOverlay || this.activeTool === 'fountain') {
      this.renderWaterRadiusAura(ctx);
    }

    // 4. Render Roads & Cardo/Decumanus Axes
    this.renderRoadNetwork(ctx);

    // 5. Render Placed Buildings
    this.renderBuildings(ctx);

    // 6. Render Walking Roman Citizens
    this.renderCitizens(ctx);

    // 7. Render Atmospheric & Civic Particles
    this.renderParticles(ctx);

    // 8. Render Cursor & Hover Feedback
    this.renderCursor(ctx);

    // 9. Classical Roman Banner & Telemetry HUD
    this.renderHeaderHUD(ctx);

    ctx.restore();
  }

  renderGroundGrid(ctx, ox, oy, gw, gh) {
    ctx.save();
    ctx.strokeStyle = 'rgba(213, 199, 169, 0.06)';
    ctx.lineWidth = 1;

    for (let c = 0; c <= this.cols; c++) {
      const x = ox + c * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(x, oy + gh);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      const y = oy + r * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + gw, y);
      ctx.stroke();
    }

    // Classical orientation markers (Septentrio / Meridies / Oriens / Occidens)
    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.font = '9px serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEPTENTRIO (N)', ox + gw / 2, oy - 6);
    ctx.fillText('MERIDIES (S)', ox + gw / 2, oy + gh + 14);
    ctx.textAlign = 'left';
    ctx.fillText('OCCIDENS (W)', ox - 20, oy + gh / 2);
    ctx.textAlign = 'right';
    ctx.fillText('ORIENS (E)', ox + gw + 20, oy + gh / 2);

    ctx.restore();
  }

  renderWaterRadiusAura(ctx) {
    ctx.save();
    const radiusPx = 5.5 * this.cellSize;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].type === 'fountain') {
          const pos = this.gridToScreen(c, r);

          // Glowing concentric aqueduct water coverage aura
          const grad = ctx.createRadialGradient(pos.cx, pos.cy, 8, pos.cx, pos.cy, radiusPx);
          grad.addColorStop(0, 'rgba(52, 152, 219, 0.22)');
          grad.addColorStop(0.7, 'rgba(52, 152, 219, 0.08)');
          grad.addColorStop(1, 'rgba(52, 152, 219, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pos.cx, pos.cy, radiusPx, 0, Math.PI * 2);
          ctx.fill();

          // Delicate outer water perimeter line
          ctx.strokeStyle = 'rgba(52, 152, 219, 0.35)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pos.cx, pos.cy, radiusPx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    ctx.restore();
  }

  renderRoadNetwork(ctx) {
    ctx.save();
    const cs = this.cellSize;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type !== 'road') continue;

        const pos = this.gridToScreen(c, r);

        // Roman Road Pavement (Opus Siliceum basalt flagstones)
        if (cell.isCardo || cell.isDecumanus) {
          // Imperial Main Highway (Cardo Maximus / Decumanus Maximus)
          ctx.fillStyle = '#5A4E42';
          ctx.fillRect(pos.x, pos.y, cs, cs);

          // Marble Curbstones
          ctx.strokeStyle = '#ECEFF1';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(pos.x + 1, pos.y + 1, cs - 2, cs - 2);

          // Center drainage groove & flagstone joints
          ctx.strokeStyle = '#3E352C';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (cell.isCardo) {
            ctx.moveTo(pos.cx, pos.y);
            ctx.lineTo(pos.cx, pos.y + cs);
          } else {
            ctx.moveTo(pos.x, pos.cy);
            ctx.lineTo(pos.x + cs, pos.cy);
          }
          ctx.stroke();
        } else {
          // Standard Roman secondary stone street
          ctx.fillStyle = '#443C34';
          ctx.fillRect(pos.x + 1, pos.y + 1, cs - 2, cs - 2);

          // Interlocking polygonal flagstone texture
          ctx.strokeStyle = '#322B24';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pos.x + cs * 0.3, pos.y + 1);
          ctx.lineTo(pos.x + cs * 0.4, pos.y + cs - 1);
          ctx.moveTo(pos.x + cs * 0.7, pos.y + 1);
          ctx.lineTo(pos.x + cs * 0.6, pos.y + cs - 1);
          ctx.moveTo(pos.x + 1, pos.y + cs * 0.5);
          ctx.lineTo(pos.x + cs - 1, pos.y + cs * 0.5);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  renderBuildings(ctx) {
    const cs = this.cellSize;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type === 'empty' || cell.type === 'road') continue;

        const pos = this.gridToScreen(c, r);
        ctx.save();

        // Placement pop-in animation scaling
        if (cell.animScale < 1.0) {
          ctx.translate(pos.cx, pos.cy);
          ctx.scale(cell.animScale, cell.animScale);
          ctx.translate(-pos.cx, -pos.cy);
        }

        switch (cell.type) {
          case 'forum':
            this.drawForumTile(ctx, pos.x, pos.y, cs, cell);
            break;
          case 'insula':
            this.drawInsulaTile(ctx, pos.x, pos.y, cs, cell);
            break;
          case 'baths':
            this.drawBathsTile(ctx, pos.x, pos.y, cs, cell);
            break;
          case 'temple':
            this.drawTempleTile(ctx, pos.x, pos.y, cs, cell);
            break;
          case 'fountain':
            this.drawFountainTile(ctx, pos.x, pos.y, cs, cell);
            break;
        }

        ctx.restore();
      }
    }
  }

  drawForumTile(ctx, x, y, cs, cell) {
    // Marble plaza with diamond lozenge paving
    ctx.fillStyle = '#C5B796';
    ctx.fillRect(x, y, cs, cs);

    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);

    // Diagonal decorative marble cross
    ctx.strokeStyle = 'rgba(236, 239, 241, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + cs - 2, y + cs - 2);
    ctx.moveTo(x + cs - 2, y + 2);
    ctx.lineTo(x + 2, y + cs - 2);
    ctx.stroke();

    // Central gilded statue of the Emperor / Augustus
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(x + cs * 0.5, y + cs * 0.5, cs * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Plinth
    ctx.fillStyle = '#8B1E0F';
    ctx.fillRect(x + cs * 0.38, y + cs * 0.38, cs * 0.24, cs * 0.24);
  }

  drawInsulaTile(ctx, x, y, cs, cell) {
    // 2.5D Roman Insula with Terracotta Roof (#D35400)
    const pad = 2;
    const bx = x + pad;
    const by = y + pad;
    const bw = cs - pad * 2;
    const bh = cs - pad * 2;

    // Building Wall / Facade Base
    ctx.fillStyle = '#875C36';
    ctx.fillRect(bx, by, bw, bh);

    // Terracotta Pitched Roof (#D35400)
    ctx.fillStyle = '#D35400';
    ctx.beginPath();
    ctx.moveTo(bx, by + bh);
    ctx.lineTo(bx + bw * 0.5, by);
    ctx.lineTo(bx + bw, by + bh);
    ctx.closePath();
    ctx.fill();

    // Shaded side for isometric depth
    ctx.fillStyle = '#BA4A00';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.5, by);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw * 0.5, by + bh);
    ctx.closePath();
    ctx.fill();

    // Inner Atrium / Impluvium Courtyard for Density > 1
    if (cell.density >= 2) {
      ctx.fillStyle = '#2C2219';
      ctx.fillRect(bx + bw * 0.35, by + bh * 0.4, bw * 0.3, bh * 0.3);

      if (cell.density >= 3) {
        // Laurel courtyard foliage (#27AE60)
        ctx.fillStyle = '#27AE60';
        ctx.beginPath();
        ctx.arc(bx + bw * 0.5, by + bh * 0.55, bw * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Density Tier Badges (Roman Numerals I, II, III, IV)
    ctx.fillStyle = '#ECEFF1';
    ctx.font = `bold ${Math.max(8, Math.floor(cs * 0.25))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const numerals = ['', 'I', 'II', 'III', 'IV'];
    ctx.fillText(numerals[cell.density] || 'I', bx + bw * 0.5, by + bh * 0.82);

    // Water Warning Icon if lacking water
    if (!cell.hasWater) {
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(bx + bw - 3, by + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBathsTile(ctx, x, y, cs, cell) {
    const pad = 2;
    const bx = x + pad;
    const by = y + pad;
    const bw = cs - pad * 2;
    const bh = cs - pad * 2;

    // Outer Vaulted Complex (Roman Brick Opus Testaceum)
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(bx, by, bw, bh);

    // Marble Colonnade Border (#ECEFF1)
    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

    // Central Heated Turquoise Natatio / Pool (#1ABC9C)
    const poolPad = Math.floor(cs * 0.2);
    ctx.fillStyle = '#1ABC9C';
    ctx.fillRect(bx + poolPad, by + poolPad, bw - poolPad * 2, bh - poolPad * 2);

    // Animated water surface ripple
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    const ripple = Math.sin(this.animTime * 3 + cell.x * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(bx + poolPad + 2, by + bh * 0.5 + ripple);
    ctx.lineTo(bx + bw - poolPad - 2, by + bh * 0.5 + ripple);
    ctx.stroke();

    // Four Marble Corner Columns (#ECEFF1)
    ctx.fillStyle = '#ECEFF1';
    const colR = Math.max(1.5, cs * 0.08);
    ctx.beginPath();
    ctx.arc(bx + 3, by + 3, colR, 0, Math.PI * 2);
    ctx.arc(bx + bw - 3, by + 3, colR, 0, Math.PI * 2);
    ctx.arc(bx + 3, by + bh - 3, colR, 0, Math.PI * 2);
    ctx.arc(bx + bw - 3, by + bh - 3, colR, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTempleTile(ctx, x, y, cs, cell) {
    const pad = 2;
    const bx = x + pad;
    const by = y + pad;
    const bw = cs - pad * 2;
    const bh = cs - pad * 2;

    // Raised Travertine Marble Podium (#D5C7A9)
    ctx.fillStyle = '#D5C7A9';
    ctx.fillRect(bx, by, bw, bh);

    // Grand Marble Steps on front
    ctx.fillStyle = '#C5B796';
    ctx.fillRect(bx, by + bh * 0.75, bw, bh * 0.25);

    // Cella Sanctuary Wall (Porphyry Red)
    ctx.fillStyle = '#8B1E0F';
    ctx.fillRect(bx + bw * 0.15, by + bh * 0.15, bw * 0.7, bh * 0.55);

    // Classical Marble Columns (#ECEFF1)
    ctx.fillStyle = '#ECEFF1';
    const colCount = 4;
    const colSpacing = bw / (colCount + 1);
    for (let i = 1; i <= colCount; i++) {
      ctx.fillRect(bx + i * colSpacing - 1.5, by + bh * 0.18, 3, bh * 0.5);
    }

    // Triangular Pediment Roof in Gleaming Marble (#ECEFF1)
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * 0.25);
    ctx.lineTo(bx + bw * 0.5, by);
    ctx.lineTo(bx + bw, by + bh * 0.25);
    ctx.closePath();
    ctx.fill();

    // Golden Pediment Relief / Wreath (#D4AF37)
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(bx + bw * 0.5, by + bh * 0.16, 2, 0, Math.PI * 2);
    ctx.fill();

    // Altar flame brazier in front
    ctx.fillStyle = '#D35400';
    ctx.beginPath();
    ctx.arc(bx + bw * 0.5, by + bh * 0.85, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFountainTile(ctx, x, y, cs, cell) {
    const pad = 2;
    const bx = x + pad;
    const by = y + pad;
    const bw = cs - pad * 2;
    const bh = cs - pad * 2;

    // Paved stone surround
    ctx.fillStyle = '#5A4E42';
    ctx.fillRect(bx, by, bw, bh);

    // Circular Marble Basin (#ECEFF1)
    const cx = x + cs * 0.5;
    const cy = y + cs * 0.5;
    const basinR = cs * 0.42;

    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(cx, cy, basinR, 0, Math.PI * 2);
    ctx.fill();

    // Clear Azure Water Pool (#2980B9)
    ctx.fillStyle = '#2980B9';
    ctx.beginPath();
    ctx.arc(cx, cy, basinR * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Concentric expanding water ripples
    const ripplePhase = (this.animTime * 2 + cell.x) % 1;
    ctx.strokeStyle = 'rgba(236, 239, 241, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, basinR * 0.2 + ripplePhase * basinR * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Central Marble Jet Spout (#ECEFF1)
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderCitizens(ctx) {
    const cs = this.cellSize;

    for (const c of this.citizens) {
      const sx = this.originX + (c.x + 0.5) * cs;
      const sy = this.originY + (c.y + 0.5) * cs;

      const bob = Math.sin(c.bounce) * 1.5;

      ctx.save();
      ctx.translate(sx, sy + bob);

      // Footstep Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 3.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Roman Toga / Tunic color coding
      let tunicColor = '#ECEFF1'; // Senator white
      let stripeColor = null;

      if (c.role === 'senator') {
        tunicColor = '#ECEFF1';
        stripeColor = '#6C3483'; // Tyrian purple stripe
      } else if (c.role === 'citizen') {
        tunicColor = '#D5C7A9';
      } else if (c.role === 'matron') {
        tunicColor = '#D4AF37'; // Golden stola
      } else if (c.role === 'priest') {
        tunicColor = '#27AE60'; // Laurel green
      } else if (c.role === 'artisan') {
        tunicColor = '#D35400'; // Terracotta tunic
      }

      // Body & Toga
      ctx.fillStyle = tunicColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.8, 4.0, 0, 0, Math.PI * 2);
      ctx.fill();

      if (stripeColor) {
        ctx.fillStyle = stripeColor;
        ctx.fillRect(-0.6, -3.5, 1.2, 7.0);
      }

      // Head
      ctx.fillStyle = '#F5CBA7';
      ctx.beginPath();
      ctx.arc(0, -4.5, 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderCursor(ctx) {
    if (!this.hoverGrid.valid) return;

    const pos = this.gridToScreen(this.hoverGrid.x, this.hoverGrid.y);
    const cs = this.cellSize;

    ctx.save();
    if (this.activeTool === 'demolish') {
      ctx.strokeStyle = '#E74C3C';
      ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
      ctx.lineWidth = 2;
      ctx.fillRect(pos.x, pos.y, cs, cs);
      ctx.strokeRect(pos.x, pos.y, cs, cs);

      // Draw red X
      ctx.beginPath();
      ctx.moveTo(pos.x + 4, pos.y + 4);
      ctx.lineTo(pos.x + cs - 4, pos.y + cs - 4);
      ctx.moveTo(pos.x + cs - 4, pos.y + 4);
      ctx.lineTo(pos.x + 4, pos.y + cs - 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#D4AF37';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
      ctx.lineWidth = 2;
      ctx.fillRect(pos.x, pos.y, cs, cs);
      ctx.strokeRect(pos.x, pos.y, cs, cs);

      // Structure preview ghost if empty
      const cell = this.grid[this.hoverGrid.y][this.hoverGrid.x];
      if (cell.type === 'empty') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.activeTool.toUpperCase(), pos.cx, pos.cy);
      }
    }
    ctx.restore();
  }

  renderHeaderHUD(ctx) {
    ctx.save();
    const w = this.width;

    // Imperial Roman Banner across top
    ctx.fillStyle = '#8B1E0F';
    ctx.fillRect(0, 0, w, 38);

    // Gold borders
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, 38);

    // SPQR Title
    ctx.fillStyle = '#ECEFF1';
    ctx.font = 'bold 13px "Cinzel", "Times New Roman", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('S · P · Q · R  |  FORVM ROMANVM', 14, 19);

    // Metrics Display Chips
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';

    const textPop = `🏛️ Pop: ${this.totalPopulation}`;
    const textWater = `💧 Water: ${Math.round(this.waterCoverage)}%`;
    const textHarmony = `⚖️ Harmony: ${Math.round(this.civicHarmony)}%`;
    const textEnt = `Entities: ${this.getEntityCount()}`;

    ctx.fillStyle = '#ECEFF1';
    ctx.fillText(`${textPop}   ${textWater}   ${textHarmony}   ${textEnt}`, w - 16, 19);

    ctx.restore();
  }

  // =========================================================================
  // CONTRACT REQUIREMENT: getEntityCount()
  // "Active buildings + road tiles + walking citizens"
  // =========================================================================

  getEntityCount() {
    let buildingCount = 0;
    let roadCount = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = this.grid[r][c].type;
        if (type === 'road') {
          roadCount++;
        } else if (type !== 'empty') {
          buildingCount++;
        }
      }
    }

    return buildingCount + roadCount + this.citizens.length;
  }

  // =========================================================================
  // INPUT HANDLING (Contract: onMouseDown, onMouseMove, onMouseUp, onKeyDown)
  // =========================================================================

  onMouseDown(pos) {
    this.initAudioOnInteraction();
    this.mousePos = pos;
    this.isMouseDown = true;

    const grid = this.screenToGrid(pos.x, pos.y);
    if (grid.valid) {
      const isRightClick = (pos.button === 2);
      if (isRightClick || this.activeTool === 'demolish') {
        this.demolishCell(grid.x, grid.y);
      } else {
        this.placeStructure(grid.x, grid.y, this.activeTool);
      }
      this.lastPlacedCell = { x: grid.x, y: grid.y };
    }
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    this.hoverGrid = this.screenToGrid(pos.x, pos.y);

    if (this.isMouseDown && this.hoverGrid.valid) {
      if (this.hoverGrid.x !== this.lastPlacedCell.x || this.hoverGrid.y !== this.lastPlacedCell.y) {
        if (this.activeTool === 'demolish' || pos.button === 2) {
          this.demolishCell(this.hoverGrid.x, this.hoverGrid.y);
        } else if (this.activeTool === 'road' || this.activeTool === 'insula') {
          this.placeStructure(this.hoverGrid.x, this.hoverGrid.y, this.activeTool);
        }
        this.lastPlacedCell = { x: this.hoverGrid.x, y: this.hoverGrid.y };
      }
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    this.lastPlacedCell = { x: -1, y: -1 };
  }

  onKeyDown(key, e) {
    this.initAudioOnInteraction();

    if (key === '1' || key === 'r' || key === 'R') {
      this.selectTool('road');
    } else if (key === '2' || key === 'i' || key === 'I') {
      this.selectTool('insula');
    } else if (key === '3' || key === 'b' || key === 'B') {
      this.selectTool('baths');
    } else if (key === '4' || key === 't' || key === 'T') {
      this.selectTool('temple');
    } else if (key === '5' || key === 'f' || key === 'F') {
      this.selectTool('fountain');
    } else if (key === 'x' || key === 'X' || key === 'd' || key === 'D') {
      this.selectTool('demolish');
    } else if (key === 'c' || key === 'C') {
      this.applyPreset('empty');
    } else if (key === ' ') {
      this.simSpeed = (this.simSpeed === 0 ? 1.0 : 0);
      const speedSlider = this.controlsContainer?.querySelector('#speed-slider');
      const speedLabel = this.controlsContainer?.querySelector('#speed-label');
      if (speedSlider) speedSlider.value = this.simSpeed;
      if (speedLabel) speedLabel.textContent = `${this.simSpeed.toFixed(1)}x`;
    }
  }

  onKeyUp(key, e) {
    // Optional contract completion
  }

  onContextMenu(pos) {
    // Suppress native right-click menu to support seamless demolition
    const grid = this.screenToGrid(pos.x, pos.y);
    if (grid.valid) {
      this.demolishCell(grid.x, grid.y);
    }
  }

  selectTool(toolKey) {
    this.activeTool = toolKey;
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const toolButtons = this.controlsContainer.querySelectorAll('[data-tool]');
    toolButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolKey);
    });

    const toolLabel = this.controlsContainer.querySelector('#forum-tool-label');
    const toolNames = {
      road: 'Via (Road)',
      insula: 'Insula (Housing)',
      baths: 'Thermae (Baths)',
      temple: 'Templum (Temple)',
      fountain: 'Lacus (Fountain)',
      demolish: 'Demolish Tool'
    };
    if (toolLabel) toolLabel.textContent = toolNames[toolKey] || toolKey;
  }

  placeStructure(gx, gy, type) {
    const cell = this.grid[gy][gx];
    if (cell.type === type) return;

    cell.type = type;
    cell.animScale = 0.4;
    cell.density = (type === 'insula' ? 1 : 0);

    this.spawnConstructionDust(gx, gy);
    this.playStoneSound();

    this.recomputeCityMetrics();
    this.updateDomTelemetry();
  }

  demolishCell(gx, gy) {
    const cell = this.grid[gy][gx];
    if (cell.type === 'empty') return;

    cell.type = 'empty';
    cell.density = 0;

    this.spawnConstructionDust(gx, gy);
    this.playRubbleSound();

    this.recomputeCityMetrics();
    this.updateDomTelemetry();
  }

  // =========================================================================
  // PROCEDURAL WEB AUDIO (SAFE SYNTHESIS)
  // =========================================================================

  initAudioOnInteraction() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (_) {}
  }

  playStoneSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }

  playRubbleSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }
}
