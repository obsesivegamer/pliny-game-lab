// Geyser: Hydrothermal Vent & Thermodynamic Subterranean Chamber Simulation
// Pliny Game Lab — Pavilion I: Ignis & Terra (Earth & Fire)
// Grounded in classical geothermal physics, hydrostatic boiling point curves,
// explosive steam-flashing eruption cycles, and mineral sinter (geyserite) accretion.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class GeyserEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Simulation Parameters & Thermodynamic Constants
    this.heatRate = 280; // Magma hearth temperature (°C), range 50 - 500
    this.chamberDepthMeters = 120; // Simulated depth in meters (20 - 250)
    this.pressureThresholdBar = 12.0; // Critical pressure threshold for runaway flashing
    this.mineralDepositionRate = 1.0; // Multiplier for silica/calcite accretion (0.1 - 5.0)

    // Hydrodynamic & Geothermal State
    this.simTime = 0;
    this.chamberPressure = 1.0; // Bar (1.0 = atmospheric)
    this.chamberTemp = 60.0; // Average deep chamber water temp (°C)
    this.waterLevel = 1.0; // 0.0 (empty) to 1.0 (brim filled)
    this.phase = 'HEATING'; // 'RECHARGE', 'HEATING', 'CAVITATION', 'FLASHING', 'EXHAUST'
    this.phaseTimer = 0;
    this.eruptionIntensity = 0.0; // 0.0 to 1.0
    this.eruptionCount = 0;
    this.totalSinterAccretedMg = 0.0; // Accreted silica in milligrams / units

    // Geometry layout constants (normalized coordinates, updated in resize)
    this.groundY = 0.44 * this.height;
    this.ventX = 0.48 * this.width;
    this.ventWidth = 24;
    this.magmaY = 0.88 * this.height;
    this.chamberY = 0.72 * this.height;

    // Sinter Cone Elevation Profile (accumbens geyserite cone)
    this.coneResolution = 64;
    this.coneSpan = 220; // Width of cone mound in pixels
    this.sinterHeights = new Float32Array(this.coneResolution);
    this.baseConeHeights = new Float32Array(this.coneResolution);
    this.initConeProfile();

    // Discretized Hydrothermal Column Nodes
    this.numNodes = 32;
    this.nodes = [];
    this.initHydrothermalNodes();

    // High-performance preallocated particle pool
    this.maxParticles = 2000;
    this.particlePool = new Array(this.maxParticles);
    this.activeParticleCount = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool[i] = {
        active: false,
        type: 'STEAM', // 'STEAM', 'WATER', 'BUBBLE', 'MINERAL', 'EMBER'
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        baseSize: 2,
        growth: 0,
        alpha: 1,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        rot: 0,
        vRot: 0
      };
    }
    this.poolCursor = 0;

    // Atmospheric & Wind State
    this.windSpeed = 12.0; // Horizontal drift (px/s)
    this.ambientTemp = 18.0; // °C

    // Interaction State
    this.mouse = { x: 0, y: 0, isDown: false, button: 0 };
    this.activeTool = 'HEAT_BRUSH'; // 'HEAT_BRUSH', 'CHISEL', 'COLD_QUENCH'

    // Build UI Controls
    this.buildControls();
    attachTouchBridge(this, canvas);
  }

  // --- Initializers ---

  initConeProfile() {
    // Sculpt natural base geyserite mound with central vent crater
    for (let i = 0; i < this.coneResolution; i++) {
      const u = i / (this.coneResolution - 1); // 0 to 1
      const distFromCenter = Math.abs(u - 0.5) * 2.0; // 0 at center, 1 at flanks
      // Gaussian / volcano mound shape with crater depression at center
      const mound = Math.exp(-distFromCenter * distFromCenter * 3.5) * 32.0;
      const crater = Math.exp(-distFromCenter * distFromCenter * 40.0) * 28.0;
      const h = Math.max(0, mound - crater);
      this.baseConeHeights[i] = h;
      this.sinterHeights[i] = 0;
    }
  }

  initHydrothermalNodes() {
    this.nodes = [];
    for (let i = 0; i < this.numNodes; i++) {
      const frac = i / (this.numNodes - 1); // 0 at vent, 1 at magma hearth
      // Conduit natural sinuous path
      const naturalWiggle = Math.sin(frac * Math.PI * 2.4) * 14;
      const x = this.ventX + naturalWiggle;
      const y = this.groundY + frac * (this.magmaY - this.groundY);

      // Hydrostatic boiling point calculation:
      // Clausius-Clapeyron approximation for water depth
      const depthMeters = frac * this.chamberDepthMeters;
      const hydrostaticOverburdenBar = 1.0 + (depthMeters * 9.81 * 1000) / 100000;
      // Boiling point increases with depth/pressure: T_boil ~ 100 * (P)^0.24
      const tBoil = 100.0 + 44.0 * Math.log10(Math.max(1.0, hydrostaticOverburdenBar));

      this.nodes.push({
        id: i,
        frac,
        x,
        y,
        width: 14 + frac * 28 + (frac > 0.65 ? (frac - 0.65) * 70 : 0), // Chamber widens at depth
        temp: 25.0 + frac * 50.0, // Initial temperature profile
        targetTemp: 25.0 + frac * 50.0,
        pressureBar: hydrostaticOverburdenBar,
        hydrostaticBoilPoint: tBoil,
        vaporFraction: 0.0,
        cavitationEnergy: 0.0,
        heatFlux: 0.0
      });
    }
  }

  // --- UI Controls Contract ---

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Subterranean Heat Source</span>
          <span id="heat-rate-val">${Math.round(this.heatRate)}°C</span>
        </label>
        <input type="range" id="heat-rate-slider" min="50" max="500" step="5" value="${this.heatRate}">
      </div>

      <div class="control-group">
        <label>
          <span>Chamber Depth / Pressure</span>
          <span id="depth-val">${Math.round(this.chamberDepthMeters)}m (${this.pressureThresholdBar.toFixed(1)} bar)</span>
        </label>
        <input type="range" id="depth-slider" min="30" max="250" step="5" value="${this.chamberDepthMeters}">
      </div>

      <div class="control-group">
        <label>
          <span>Mineral Deposition Rate</span>
          <span id="mineral-val">${this.mineralDepositionRate.toFixed(1)}x</span>
        </label>
        <input type="range" id="mineral-slider" min="0.1" max="5.0" step="0.1" value="${this.mineralDepositionRate}">
      </div>

      <div class="control-group" style="margin-top: 8px;">
        <button id="force-erupt-btn" class="sub-btn" style="background: rgba(212,175,55,0.2); border-color: var(--accent-gold); font-weight: bold; padding: 8px 10px;">
          ⚡ Force Eruption
        </button>
      </div>

      <div class="control-group">
        <button id="quench-btn" class="sub-btn" style="background: rgba(34,119,187,0.25); border-color: var(--accent-cyan); font-weight: bold; padding: 8px 10px;">
          ❄️ Quench Chamber
        </button>
      </div>

      <div class="control-group" style="margin-top: 4px;">
        <label><span>Interactivity:</span></label>
        <div class="control-btn-grid">
          <button class="sub-btn active" data-tool="HEAT_BRUSH" id="tool-heat">🔥 Magma Inject</button>
          <button class="sub-btn" data-tool="COLD_QUENCH" id="tool-cold">💧 Cool Inflow</button>
        </div>
      </div>
    `;

    // Bind slider events
    const heatSlider = this.controlsContainer.querySelector('#heat-rate-slider');
    const heatVal = this.controlsContainer.querySelector('#heat-rate-val');
    if (heatSlider && heatVal) {
      heatSlider.addEventListener('input', (e) => {
        this.heatRate = parseFloat(e.target.value);
        heatVal.textContent = `${Math.round(this.heatRate)}°C`;
      });
    }

    const depthSlider = this.controlsContainer.querySelector('#depth-slider');
    const depthVal = this.controlsContainer.querySelector('#depth-val');
    if (depthSlider && depthVal) {
      depthSlider.addEventListener('input', (e) => {
        this.chamberDepthMeters = parseFloat(e.target.value);
        // Pressure threshold scales with chamber depth
        this.pressureThresholdBar = 1.0 + (this.chamberDepthMeters * 9.81 * 1000) / 100000;
        depthVal.textContent = `${Math.round(this.chamberDepthMeters)}m (${this.pressureThresholdBar.toFixed(1)} bar)`;
        this.updateNodeBoilingPoints();
      });
    }

    const mineralSlider = this.controlsContainer.querySelector('#mineral-slider');
    const mineralVal = this.controlsContainer.querySelector('#mineral-val');
    if (mineralSlider && mineralVal) {
      mineralSlider.addEventListener('input', (e) => {
        this.mineralDepositionRate = parseFloat(e.target.value);
        mineralVal.textContent = `${this.mineralDepositionRate.toFixed(1)}x`;
      });
    }

    // Bind buttons
    const forceBtn = this.controlsContainer.querySelector('#force-erupt-btn');
    if (forceBtn) {
      forceBtn.addEventListener('click', () => {
        this.forceEruption();
      });
    }

    const quenchBtn = this.controlsContainer.querySelector('#quench-btn');
    if (quenchBtn) {
      quenchBtn.addEventListener('click', () => {
        this.quenchChamber();
      });
    }

    // Bind tool selector
    const toolBtns = this.controlsContainer.querySelectorAll('[data-tool]');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.dataset.tool;
      });
    });
  }

  updateNodeBoilingPoints() {
    for (let i = 0; i < this.numNodes; i++) {
      const node = this.nodes[i];
      const depthMeters = node.frac * this.chamberDepthMeters;
      const hydrostaticOverburdenBar = 1.0 + (depthMeters * 9.81 * 1000) / 100000;
      node.pressureBar = hydrostaticOverburdenBar;
      node.hydrostaticBoilPoint = 100.0 + 44.0 * Math.log10(Math.max(1.0, hydrostaticOverburdenBar));
    }
  }

  // --- Lifecycle & Dimensions ---

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.groundY = 0.44 * this.height;
    this.ventX = 0.48 * this.width;
    this.magmaY = 0.88 * this.height;
    this.chamberY = 0.72 * this.height;

    // Recompute node positions to conform to resized canvas
    for (let i = 0; i < this.numNodes; i++) {
      const node = this.nodes[i];
      const frac = node.frac;
      const naturalWiggle = Math.sin(frac * Math.PI * 2.4) * (14 * (this.width / 800));
      node.x = this.ventX + naturalWiggle;
      node.y = this.groundY + frac * (this.magmaY - this.groundY);
      node.width = (14 + frac * 28 + (frac > 0.65 ? (frac - 0.65) * 70 : 0)) * (this.width / 800);
    }
  }

  reset() {
    this.simTime = 0;
    this.phase = 'HEATING';
    this.phaseTimer = 0;
    this.eruptionIntensity = 0.0;
    this.eruptionCount = 0;
    this.chamberPressure = 1.0;
    this.waterLevel = 1.0;
    this.totalSinterAccretedMg = 0.0;

    this.initConeProfile();
    this.initHydrothermalNodes();

    // Clear particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool[i].active = false;
    }
    this.activeParticleCount = 0;
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    // Clean up timers or references if any
    this.particlePool = [];
    this.nodes = [];
  }

  getEntityCount() {
    return this.activeParticleCount + this.numNodes;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  // --- Direct Actions ---

  forceEruption() {
    // Superheat the entire chamber and trigger immediate steam flashing
    for (let i = 0; i < this.numNodes; i++) {
      const node = this.nodes[i];
      node.temp = Math.max(node.temp, node.hydrostaticBoilPoint + 18.0);
      node.vaporFraction = 0.85;
      node.cavitationEnergy = 1.0;
    }
    this.chamberPressure = this.pressureThresholdBar * 1.4;
    this.phase = 'FLASHING';
    this.phaseTimer = 0;
    this.eruptionIntensity = 1.0;
    this.eruptionCount++;
  }

  quenchChamber() {
    // Flood with cool groundwater from surrounding aquifer
    for (let i = 0; i < this.numNodes; i++) {
      const node = this.nodes[i];
      node.temp = Math.max(18.0, node.temp * 0.35);
      node.vaporFraction = 0.0;
      node.cavitationEnergy = 0.0;
    }
    this.chamberPressure = 1.0;
    this.phase = 'RECHARGE';
    this.phaseTimer = 0;
    this.eruptionIntensity = 0.0;
    this.waterLevel = 1.0;

    // Spawn quenching mist
    for (let j = 0; j < 60; j++) {
      this.spawnParticle(
        'STEAM',
        this.ventX + (Math.random() - 0.5) * 30,
        this.groundY + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 40,
        -Math.random() * 80 - 20,
        Math.random() * 8 + 6,
        1.5,
        'rgba(200, 225, 255, 0.45)'
      );
    }
  }

  // --- Simulation Update Loop ---

  update(dt) {
    // Safety clamp dt to avoid simulation exploding under frame hitch
    dt = Math.min(Math.max(dt || 0.016, 0.001), 0.1);
    this.simTime += dt;
    this.phaseTimer += dt;

    // Handle interactive mouse dragging
    if (this.mouse.isDown) {
      this.applyToolInteraction(dt);
    }

    // 1. Thermodynamic Conduction & Convection in Conduit
    this.updateThermodynamics(dt);

    // 2. State Machine of Geyser Cycle
    this.updateCycleStateMachine(dt);

    // 3. Eruption Particle Generation & Jet Kinetics
    this.updateEruptionDynamics(dt);

    // 4. Update Particle Physics Pool
    this.updateParticles(dt);

    // 5. Mineral Deposition & Sinter Accretion
    this.updateMineralAccretion(dt);

    // 6. Aquifer Recharge & Drainage Flow
    this.updateAquiferFlow(dt);
  }

  updateThermodynamics(dt) {
    const bottomNode = this.nodes[this.numNodes - 1];
    const topNode = this.nodes[0];

    // Magma heat influx at the deepest node (Fourier's Law / Newton cooling)
    const magmaThermalTransferCoeff = 0.85;
    const heatDelta = (this.heatRate - bottomNode.temp) * magmaThermalTransferCoeff * dt;
    bottomNode.temp = Math.max(10, bottomNode.temp + heatDelta);

    // Thermal diffusion and buoyancy convection along the column
    const conductionCoeff = 4.2;
    const convectionBuoyancy = 6.5;

    for (let i = this.numNodes - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const prev = this.nodes[i + 1];
      const next = this.nodes[i - 1];

      // Conduct heat from below
      if (prev) {
        const dTemp = prev.temp - node.temp;
        if (dTemp > 0) {
          const transfer = dTemp * conductionCoeff * dt;
          node.temp += transfer;
          prev.temp -= transfer * 0.4; // Thermal inertia of water
        }
      }

      // Convective upward bubble buoyancy if warmer than layer above
      if (next && node.temp > next.temp) {
        const buoyantTransfer = (node.temp - next.temp) * convectionBuoyancy * dt;
        next.temp += buoyantTransfer;
        node.temp -= buoyantTransfer * 0.5;
      }

      // Heat dissipation to surrounding basalt rock (gradient to ambient)
      const surroundingRockTemp = 15.0 + (node.frac * 40.0);
      node.temp -= (node.temp - surroundingRockTemp) * 0.04 * dt;

      // Vapor fraction and cavitation check
      const superheat = node.temp - node.hydrostaticBoilPoint;
      if (superheat > 0) {
        // Water starts boiling into steam bubbles!
        node.vaporFraction = Math.min(1.0, node.vaporFraction + superheat * 0.08 * dt);
        node.cavitationEnergy = Math.min(1.0, node.cavitationEnergy + dt * 1.5);

        // Spawn subterranean rising bubbles
        if (Math.random() < 0.35) {
          this.spawnParticle(
            'BUBBLE',
            node.x + (Math.random() - 0.5) * node.width * 0.6,
            node.y + (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 12,
            -Math.random() * 45 - 25,
            Math.random() * 3 + 2,
            1.2,
            'rgba(180, 240, 255, 0.75)'
          );
        }
      } else {
        // Vapor condenses if subcooled
        node.vaporFraction = Math.max(0.0, node.vaporFraction - 0.5 * dt);
        node.cavitationEnergy = Math.max(0.0, node.cavitationEnergy - 0.4 * dt);
      }
    }

    // Cooling at vent orifice
    topNode.temp -= (topNode.temp - this.ambientTemp) * 0.25 * dt;

    // Chamber average temperature & pressure calculation
    let tempSum = 0;
    let vaporSum = 0;
    for (let i = 0; i < this.numNodes; i++) {
      tempSum += this.nodes[i].temp;
      vaporSum += this.nodes[i].vaporFraction;
    }
    this.chamberTemp = tempSum / this.numNodes;

    // Dynamic chamber pressure:
    // Builds up as deep water vaporizes and expansion is constrained by conduit throat
    const vaporExpansionPressure = (vaporSum / this.numNodes) * (this.pressureThresholdBar * 1.35);
    this.chamberPressure = 1.0 + vaporExpansionPressure * this.waterLevel;
  }

  updateCycleStateMachine(dt) {
    switch (this.phase) {
      case 'RECHARGE': {
        // Groundwater fills the evacuated fissure
        this.waterLevel = Math.min(1.0, this.waterLevel + 0.25 * dt);
        if (this.waterLevel >= 0.95 && this.phaseTimer > 3.0) {
          this.phase = 'HEATING';
          this.phaseTimer = 0;
        }
        break;
      }

      case 'HEATING': {
        // Chamber is full; magma is transferring intense heat.
        // Check if lower conduit reaches boiling point
        let boilingCount = 0;
        for (let i = Math.floor(this.numNodes * 0.5); i < this.numNodes; i++) {
          if (this.nodes[i].temp >= this.nodes[i].hydrostaticBoilPoint - 2.0) {
            boilingCount++;
          }
        }

        if (boilingCount >= 4 || this.chamberPressure > this.pressureThresholdBar * 0.6) {
          this.phase = 'CAVITATION';
          this.phaseTimer = 0;
        }
        break;
      }

      case 'CAVITATION': {
        // "Preplay" phase: steam bubbles lift water column, causing dome pulsing and overflow
        const domePulse = Math.sin(this.simTime * 8.0) * 0.5 + 0.5;

        // Occasional pre-eruption hot splash surges out of vent
        if (Math.random() < 0.25) {
          this.spawnParticle(
            'WATER',
            this.ventX + (Math.random() - 0.5) * 12,
            this.groundY - 4,
            (Math.random() - 0.5) * 35,
            -Math.random() * 90 - 40,
            Math.random() * 3 + 2.5,
            1.2,
            '#3bd6c6'
          );
          this.spawnParticle(
            'STEAM',
            this.ventX + (Math.random() - 0.5) * 10,
            this.groundY - 8,
            (Math.random() - 0.5) * 20,
            -Math.random() * 50 - 20,
            Math.random() * 7 + 4,
            2.0,
            'rgba(235, 245, 255, 0.4)'
          );
        }

        // As water sloshes out of the vent, hydrostatic head decreases!
        // When pressure exceeds threshold, catastrophic runaway flashing occurs!
        if (this.chamberPressure >= this.pressureThresholdBar || this.phaseTimer > 12.0) {
          this.phase = 'FLASHING';
          this.phaseTimer = 0;
          this.eruptionIntensity = 1.0;
          this.eruptionCount++;
        }
        break;
      }

      case 'FLASHING': {
        // Full violent eruption fountain!
        // Massive upward column of superheated steam and water
        this.eruptionIntensity = Math.min(1.0, this.eruptionIntensity + dt * 2.0);

        // Water level inside the conduit is blasted out into the atmosphere
        this.waterLevel = Math.max(0.08, this.waterLevel - 0.12 * dt);

        // Subterranean chamber temperature drops as latent heat of vaporization is consumed
        for (let i = 0; i < this.numNodes; i++) {
          this.nodes[i].temp = Math.max(90.0, this.nodes[i].temp - 12.0 * dt);
        }

        // Eruption duration lasts 4 - 8 seconds depending on heat rate
        if (this.phaseTimer > 6.5 || this.waterLevel <= 0.12) {
          this.phase = 'EXHAUST';
          this.phaseTimer = 0;
        }
        break;
      }

      case 'EXHAUST': {
        // Water is depleted; mostly steam and roaring gas escaping
        this.eruptionIntensity = Math.max(0.0, this.eruptionIntensity - 0.35 * dt);
        this.chamberPressure = Math.max(1.0, this.chamberPressure - 3.5 * dt);

        if (this.eruptionIntensity <= 0.02 && this.phaseTimer > 2.5) {
          // Chamber depressurized, cold groundwater begins rushing back in
          this.phase = 'RECHARGE';
          this.phaseTimer = 0;
        }
        break;
      }
    }
  }

  updateEruptionDynamics(dt) {
    if (this.eruptionIntensity <= 0.01) return;

    // Spawn massive vertical fountain jet of water droplets and billowing steam
    const spawnRate = Math.floor(this.eruptionIntensity * 18);
    const coneTopY = this.getVentRimY();

    for (let i = 0; i < spawnRate; i++) {
      const nozzleSpread = (Math.random() - 0.5) * (this.ventWidth * 0.85);
      const jetAngle = (Math.random() - 0.5) * 0.12; // Focused vertical nozzle
      const speed = (280 + Math.random() * 420) * (0.6 + 0.4 * this.eruptionIntensity);

      const vx = Math.sin(jetAngle) * speed + (Math.random() - 0.5) * 30;
      const vy = -Math.cos(jetAngle) * speed;

      // Spawn ballistic superheated water droplet
      if (Math.random() < 0.65) {
        const col = Math.random() < 0.4 ? '#3bd6c6' : (Math.random() < 0.7 ? '#2277bb' : '#e6f8ff');
        this.spawnParticle(
          'WATER',
          this.ventX + nozzleSpread,
          coneTopY - 2,
          vx,
          vy,
          Math.random() * 3.5 + 2.0,
          2.5 + Math.random() * 1.5,
          col
        );
      }

      // Spawn expanding billowing steam cloud
      this.spawnParticle(
        'STEAM',
        this.ventX + nozzleSpread * 1.2,
        coneTopY - 6,
        vx * 0.55 + (Math.random() - 0.5) * 45,
        vy * 0.75 - Math.random() * 80,
        Math.random() * 9 + 6,
        3.2 + Math.random() * 2.0,
        'rgba(240, 246, 255, 0.6)'
      );

      // Spawn mineral silica grain
      if (Math.random() < 0.15 * this.mineralDepositionRate) {
        this.spawnParticle(
          'MINERAL',
          this.ventX + nozzleSpread,
          coneTopY - 4,
          vx * 0.7 + (Math.random() - 0.5) * 60,
          vy * 0.5 - Math.random() * 50,
          Math.random() * 2.2 + 1.2,
          2.0,
          '#d4af37'
        );
      }
    }
  }

  getVentRimY() {
    // Current elevation of the crater rim including accreted sinter
    const centerIdx = Math.floor(this.coneResolution * 0.5);
    const leftRimH = this.baseConeHeights[centerIdx - 4] + this.sinterHeights[centerIdx - 4];
    const rightRimH = this.baseConeHeights[centerIdx + 4] + this.sinterHeights[centerIdx + 4];
    const avgRimH = (leftRimH + rightRimH) * 0.5;
    return this.groundY - avgRimH;
  }

  updateParticles(dt) {
    let count = 0;
    const gravity = 420; // Downward gravity for water
    const steamBuoyancy = -65; // Upward buoyant acceleration for steam
    const groundLevel = this.groundY;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      count++;
      const lifeFrac = p.life / p.maxLife;

      switch (p.type) {
        case 'STEAM': {
          // Billowing steam expansion & atmospheric drag
          p.vy += steamBuoyancy * dt;
          p.vx += this.windSpeed * 0.8 * dt;
          p.vx *= 1.0 - 0.85 * dt;
          p.vy *= 1.0 - 0.65 * dt;

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Radial expansion as steam billows and disperses
          p.size = p.baseSize * (1.0 + lifeFrac * 4.2);
          p.alpha = Math.max(0, (1.0 - lifeFrac) * 0.55);
          break;
        }

        case 'WATER': {
          // Heavy ballistic trajectory with air drag
          p.vy += gravity * dt;
          p.vx += this.windSpeed * 0.3 * dt;
          p.vx *= 1.0 - 0.15 * dt;

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          p.alpha = Math.max(0, 1.0 - lifeFrac * 0.4);

          // Check collision with ground & sinter cone
          const coneOffset = p.x - (this.ventX - this.coneSpan * 0.5);
          const coneU = coneOffset / this.coneSpan;

          let terrainElevation = 0;
          if (coneU >= 0 && coneU <= 1) {
            const idx = Math.floor(coneU * (this.coneResolution - 1));
            terrainElevation = this.baseConeHeights[idx] + this.sinterHeights[idx];
          }

          const currentGroundY = groundLevel - terrainElevation;

          if (p.y >= currentGroundY && p.vy > 0) {
            // Splash on ground!
            p.y = currentGroundY;
            p.vy = -p.vy * 0.18; // Inelastic rebound
            p.vx *= Math.pow(0.5, dt * 60);

            // Trigger mineral deposition if close to the vent cone
            if (coneU >= 0.15 && coneU <= 0.85) {
              const coneIdx = Math.floor(coneU * (this.coneResolution - 1));
              const depositAmount = 0.015 * this.mineralDepositionRate;
              this.sinterHeights[coneIdx] += depositAmount;
              this.totalSinterAccretedMg += depositAmount * 8.5;
            }

            // Water droplet dissolves into runoff film
            p.life += p.maxLife * 0.45;
          }
          break;
        }

        case 'BUBBLE': {
          // Subterranean bubbles rising through liquid conduit
          p.y += p.vy * dt;
          p.x += p.vx * dt + Math.sin(this.simTime * 12 + p.y * 0.1) * 0.8;
          p.size = p.baseSize * (1.0 + (1.0 - p.y / this.magmaY) * 0.8);

          // Pop at surface or if escaping conduit
          if (p.y <= this.groundY) {
            p.active = false;
          }
          break;
        }

        case 'MINERAL': {
          // Golden/calcite silica grain deposition
          p.vy += gravity * 0.9 * dt;
          p.vx += this.windSpeed * 0.4 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const coneOffset = p.x - (this.ventX - this.coneSpan * 0.5);
          const coneU = coneOffset / this.coneSpan;
          if (coneU >= 0 && coneU <= 1) {
            const idx = Math.floor(coneU * (this.coneResolution - 1));
            const coneH = this.baseConeHeights[idx] + this.sinterHeights[idx];
            if (p.y >= groundLevel - coneH) {
              // Mineral settles onto cone
              const deposit = 0.04 * this.mineralDepositionRate;
              this.sinterHeights[idx] += deposit;
              this.totalSinterAccretedMg += deposit * 12.0;
              p.active = false;
            }
          } else if (p.y >= groundLevel) {
            p.active = false;
          }
          break;
        }

        case 'EMBER': {
          // Molten sparks inside magma hearth
          p.vx += (Math.random() - 0.5) * 20 * dt;
          p.vy += (Math.random() - 0.5) * 15 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha = 1.0 - lifeFrac;
          break;
        }
      }
    }

    this.activeParticleCount = count;
  }

  spawnParticle(type, x, y, vx, vy, size, maxLife, color) {
    const p = this.particlePool[this.poolCursor];
    p.active = true;
    p.type = type;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.baseSize = size;
    p.life = 0;
    p.maxLife = maxLife;
    p.alpha = 1.0;
    p.color = color;
    p.rot = Math.random() * Math.PI * 2;
    p.vRot = (Math.random() - 0.5) * 4;

    this.poolCursor = (this.poolCursor + 1) % this.maxParticles;
  }

  updateMineralAccretion(dt) {
    // Subtle natural diffusion / consolidation of accreted sinter mound
    // Ensures realistic smooth geyserite crater terraces (resembling Old Faithful / Castle Geyser)
    for (let i = 1; i < this.coneResolution - 1; i++) {
      const laplacian = (this.sinterHeights[i - 1] - 2 * this.sinterHeights[i] + this.sinterHeights[i + 1]);
      this.sinterHeights[i] += laplacian * 0.015 * dt;

      // Prevent sinter from fully occluding the central nozzle throat
      const u = i / (this.coneResolution - 1);
      if (Math.abs(u - 0.5) < 0.06) {
        this.sinterHeights[i] = Math.min(this.sinterHeights[i], 12.0);
      }
    }
  }

  updateAquiferFlow(dt) {
    // Lateral seepage of groundwater from runoff pool back down through porous rock strata
    if (this.phase === 'RECHARGE' && Math.random() < 0.4) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const startX = this.ventX + side * (this.coneSpan * 0.6 + Math.random() * 60);
      const startY = this.groundY + 10;
      this.spawnParticle(
        'BUBBLE',
        startX,
        startY,
        -side * (Math.random() * 20 + 10),
        Math.random() * 25 + 15,
        Math.random() * 2 + 1,
        2.2,
        'rgba(59, 214, 198, 0.4)'
      );
    }

    // Spawn ambient magma embers in deep hearth
    if (Math.random() < 0.5) {
      this.spawnParticle(
        'EMBER',
        this.ventX + (Math.random() - 0.5) * 140,
        this.magmaY + Math.random() * (this.height - this.magmaY),
        (Math.random() - 0.5) * 20,
        -Math.random() * 15 - 5,
        Math.random() * 2.5 + 1.2,
        1.5,
        Math.random() < 0.6 ? '#d4af37' : '#ff4500'
      );
    }
  }

  // --- User Interactivity & Input Handling ---

  applyToolInteraction(dt) {
    const mx = this.mouse.x;
    const my = this.mouse.y;

    if (this.activeTool === 'HEAT_BRUSH') {
      // Heat injection into clicked subterranean area
      for (let i = 0; i < this.numNodes; i++) {
        const node = this.nodes[i];
        const dist = Math.hypot(node.x - mx, node.y - my);
        if (dist < 65) {
          const power = (1.0 - dist / 65) * 220.0 * dt;
          node.temp += power;
          node.cavitationEnergy = Math.min(1.0, node.cavitationEnergy + 0.3);
        }
      }

      // Visual feedback sparks
      if (Math.random() < 0.5) {
        this.spawnParticle(
          'EMBER',
          mx + (Math.random() - 0.5) * 20,
          my + (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          Math.random() * 3 + 1,
          0.8,
          '#d4af37'
        );
      }
    } else if (this.activeTool === 'COLD_QUENCH') {
      // Cold water injection
      for (let i = 0; i < this.numNodes; i++) {
        const node = this.nodes[i];
        const dist = Math.hypot(node.x - mx, node.y - my);
        if (dist < 65) {
          const cooling = (1.0 - dist / 65) * 160.0 * dt;
          node.temp = Math.max(15, node.temp - cooling);
          node.vaporFraction = Math.max(0, node.vaporFraction - 0.5);
        }
      }

      if (Math.random() < 0.5) {
        this.spawnParticle(
          'STEAM',
          mx + (Math.random() - 0.5) * 15,
          my + (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 20,
          -Math.random() * 30 - 10,
          Math.random() * 5 + 3,
          1.0,
          'rgba(200, 230, 255, 0.5)'
        );
      }
    }
  }

  onMouseDown(pos) {
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.mouse.isDown = true;
    this.mouse.button = pos.button;

    // Right click or click at vent forces eruption
    if (pos.button === 2) {
      this.forceEruption();
    }
  }

  onMouseMove(pos) {
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }

  onMouseUp(pos) {
    this.mouse.isDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.forceEruption();
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === 'q' || key === 'Q') {
      this.quenchChamber();
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === '1') {
      this.activeTool = 'HEAT_BRUSH';
      this.updateToolButtons();
    } else if (key === '2') {
      this.activeTool = 'COLD_QUENCH';
      this.updateToolButtons();
    }
  }

  updateToolButtons() {
    if (!this.controlsContainer) return;
    const btns = this.controlsContainer.querySelectorAll('[data-tool]');
    btns.forEach(b => {
      if (b.dataset.tool === this.activeTool) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  onWheel(delta) {
    // Adjust heat rate with wheel
    this.heatRate = Math.min(500, Math.max(50, this.heatRate - Math.sign(delta) * 15));
    if (this.controlsContainer) {
      const slider = this.controlsContainer.querySelector('#heat-rate-slider');
      const label = this.controlsContainer.querySelector('#heat-rate-val');
      if (slider) slider.value = this.heatRate;
      if (label) label.textContent = `${Math.round(this.heatRate)}°C`;
    }
  }

  // --- Rendering & Visual Aesthetics ---

  render(ctx) {
    const w = this.width;
    const h = this.height;

    // 1. Cyber-Classical Canvas Base: Deep Obsidian
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, 0, w, h);

    // 2. Classical Grid / Subtle Vitruvian Reference Lines
    this.renderAtmosphereAndSky(ctx, w, h);

    // 3. Subterranean Stratification Cross-Section
    this.renderSubsurfaceStrata(ctx, w, h);

    // 4. Magma Hearth at the Bottom
    this.renderMagmaHearth(ctx, w, h);

    // 5. Hydrothermal Conduit & Geothermal Chamber
    this.renderConduitAndChamber(ctx);

    // 6. Surface Runoff Pools & Sinter Cone
    this.renderSinterConeAndBasins(ctx, w, h);

    // 7. Render Particle Systems (Water, Steam, Minerals, Bubbles)
    this.renderParticles(ctx);

    // 8. Cyber-Classical Roman Telemetry HUD
    this.renderTelemetryHUD(ctx, w, h);
  }

  renderAtmosphereAndSky(ctx, w, h) {
    // Atmospheric twilight horizon gradient
    if (ctx.createLinearGradient) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
      skyGrad.addColorStop(0, '#06070a');
      skyGrad.addColorStop(0.7, '#0d1017');
      skyGrad.addColorStop(1, '#151c27');
      ctx.fillStyle = skyGrad;
    } else {
      ctx.fillStyle = '#0e121a';
    }
    ctx.fillRect(0, 0, w, this.groundY);

    // Subtle classical star/spark grid
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 48;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.groundY);
      ctx.stroke();
    }
    for (let y = 0; y < this.groundY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSubsurfaceStrata(ctx, w, h) {
    const gy = this.groundY;

    // Layer 1: Porous volcanic tuff & gravel (aquifer zone)
    ctx.fillStyle = '#141720';
    ctx.fillRect(0, gy, w, h - gy);

    // Layer 2: Fractured columnar basalt
    ctx.fillStyle = '#181d28';
    ctx.fillRect(0, gy + (h - gy) * 0.28, w, (h - gy) * 0.45);

    // Geological fracture line details
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash ? ctx.setLineDash([6, 12]) : null;

    // Strata boundary markings
    ctx.beginPath();
    ctx.moveTo(0, gy + (h - gy) * 0.28);
    ctx.lineTo(w, gy + (h - gy) * 0.28);
    ctx.moveTo(0, gy + (h - gy) * 0.73);
    ctx.lineTo(w, gy + (h - gy) * 0.73);
    ctx.stroke();

    if (ctx.setLineDash) ctx.setLineDash([]);
    ctx.restore();

    // Subtle strata depth labels (Roman style)
    ctx.save();
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(140, 144, 158, 0.45)';
    ctx.fillText('STRATA I: AQUIFER PERMEABILIS', 16, gy + 22);
    ctx.fillText('STRATA II: BASALTES FRACTVRATVS', 16, gy + (h - gy) * 0.32);
    ctx.fillText('STRATA III: CAMERA HYDROTHERMALIS', 16, gy + (h - gy) * 0.76);
    ctx.restore();
  }

  renderMagmaHearth(ctx, w, h) {
    const my = this.magmaY;
    const hearthHeight = h - my;

    // Pulsing magma molten glow
    const pulse = Math.sin(this.simTime * 2.0) * 0.1 + 0.9;

    if (ctx.createLinearGradient) {
      const magmaGrad = ctx.createLinearGradient(0, my, 0, h);
      magmaGrad.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
      magmaGrad.addColorStop(0.35, 'rgba(230, 126, 34, 0.85)');
      magmaGrad.addColorStop(1, '#ff3800');
      ctx.fillStyle = magmaGrad;
    } else {
      ctx.fillStyle = '#d4af37';
    }

    ctx.beginPath();
    ctx.moveTo(0, my);
    // Molten magma wave surface
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const x = u * w;
      const wave = Math.sin(u * 14 + this.simTime * 2.5) * 5 * pulse;
      ctx.lineTo(x, my + wave);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Magma thermal text inscription
    ctx.save();
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 8;
    ctx.fillText(`MAGMA PLVTONIVM • ${Math.round(this.heatRate)}°C`, w * 0.5 - 75, h - 14);
    ctx.restore();
  }

  renderConduitAndChamber(ctx) {
    if (this.nodes.length < 2) return;

    // Draw subterranean chamber wall contour
    ctx.save();

    // Left and Right walls of the fissure
    ctx.beginPath();
    // Trace left wall downwards
    for (let i = 0; i < this.numNodes; i++) {
      const n = this.nodes[i];
      const lx = n.x - n.width * 0.5;
      if (i === 0) ctx.moveTo(lx, n.y);
      else ctx.lineTo(lx, n.y);
    }
    // Trace right wall upwards
    for (let i = this.numNodes - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const rx = n.x + n.width * 0.5;
      ctx.lineTo(rx, n.y);
    }
    ctx.closePath();

    // Fill conduit with deep geothermal fluid
    // Color varies with temperature: cyan (#3bd6c6) -> azure (#2277bb) -> boiling gold/amber (#d4af37)
    const avgT = this.chamberTemp;
    let fluidColor = '#2277bb';
    if (avgT > 130) fluidColor = 'rgba(212, 175, 55, 0.85)';
    else if (avgT > 90) fluidColor = 'rgba(59, 214, 198, 0.75)';
    else fluidColor = 'rgba(34, 119, 187, 0.7)';

    ctx.fillStyle = fluidColor;
    ctx.fill();

    // Outline rocky fissure walls
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render boiling water level inside the conduit
    if (this.waterLevel < 0.98) {
      const meniscusIdx = Math.floor((1.0 - this.waterLevel) * (this.numNodes - 1));
      const mNode = this.nodes[meniscusIdx] || this.nodes[0];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(mNode.x, mNode.y, mNode.width * 0.45, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Node temperature telemetry pins along conduit
    for (let i = 4; i < this.numNodes; i += 7) {
      const n = this.nodes[i];
      const isSuperheated = n.temp >= n.hydrostaticBoilPoint;
      ctx.fillStyle = isSuperheated ? '#ff4d4d' : '#3bd6c6';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Mini text readout next to conduit
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isSuperheated ? '#ff8080' : 'rgba(200, 220, 240, 0.7)';
      ctx.fillText(
        `${Math.round(n.temp)}° / ${Math.round(n.hydrostaticBoilPoint)}°`,
        n.x + n.width * 0.5 + 8,
        n.y + 3
      );
    }

    ctx.restore();
  }

  renderSinterConeAndBasins(ctx, w, h) {
    const gy = this.groundY;
    const startX = this.ventX - this.coneSpan * 0.5;
    const stepX = this.coneSpan / (this.coneResolution - 1);

    // Draw geological ground surface
    ctx.save();

    // Ground bedrock line
    ctx.fillStyle = '#10131a';
    ctx.fillRect(0, gy, w, 8);

    // Draw Accreted Sinter Cone (Silica geyserite mound)
    ctx.beginPath();
    ctx.moveTo(startX, gy);

    for (let i = 0; i < this.coneResolution; i++) {
      const x = startX + i * stepX;
      const totalH = this.baseConeHeights[i] + this.sinterHeights[i];
      ctx.lineTo(x, gy - totalH);
    }
    ctx.lineTo(startX + this.coneSpan, gy);
    ctx.closePath();

    // Sinter travertine / silica gradient
    if (ctx.createLinearGradient) {
      const sinterGrad = ctx.createLinearGradient(0, gy - 60, 0, gy);
      sinterGrad.addColorStop(0, '#f5efe0'); // Pure white silica
      sinterGrad.addColorStop(0.35, '#dcd2b8'); // Travertine beige
      sinterGrad.addColorStop(0.8, '#b8a682'); // Weathered geyserite
      sinterGrad.addColorStop(1, '#1c1f28'); // Volcanic bedrock
      ctx.fillStyle = sinterGrad;
    } else {
      ctx.fillStyle = '#dcd2b8';
    }
    ctx.fill();

    // Sinter rim highlight line
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Carve the central vent throat opening
    ctx.fillStyle = '#0e1118';
    const ventL = this.ventX - this.ventWidth * 0.5;
    const ventR = this.ventX + this.ventWidth * 0.5;
    const rimY = this.getVentRimY();
    ctx.fillRect(ventL, rimY, this.ventWidth, gy - rimY + 4);

    // Left and Right Runoff Thermal Pools (Azure water)
    const poolW = 75;
    const leftPoolX = startX - poolW - 8;
    const rightPoolX = startX + this.coneSpan + 8;

    ctx.fillStyle = 'rgba(59, 214, 198, 0.35)';
    ctx.fillRect(leftPoolX, gy - 3, poolW, 6);
    ctx.fillRect(rightPoolX, gy - 3, poolW, 6);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.strokeRect(leftPoolX, gy - 3, poolW, 6);
    ctx.strokeRect(rightPoolX, gy - 3, poolW, 6);

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(59, 214, 198, 0.7)';
    ctx.fillText('LACVS RECH.', leftPoolX + 8, gy + 14);
    ctx.fillText('LACVS RECH.', rightPoolX + 8, gy + 14);

    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'STEAM': {
          // Billowy volumetric soft steam cloud
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'WATER': {
          // Velocity-aligned ballistic water droplet streak
          const len = Math.max(2, Math.hypot(p.vx, p.vy) * 0.035);
          const angle = Math.atan2(p.vy, p.vx);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, len, p.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'BUBBLE': {
          // Subterranean glowing steam cavitation bubble
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 'MINERAL': {
          // Golden silica/calcite flake
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
          break;
        }

        case 'EMBER': {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }

    ctx.restore();
  }

  renderTelemetryHUD(ctx, w, h) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = w / ui;
    const sh = h / ui;
    const narrow = sw < 560;

    // Top-Left Cyber-Classical Telemetry Box
    const hudX = narrow ? 10 : 20;
    const hudY = narrow ? 10 : 20;
    const hudW = narrow ? Math.min(sw - 20, 240) : 260;
    const hudH = 138;

    ctx.fillStyle = 'rgba(10, 11, 14, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    // Header
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('GEYSER HYDROTHERMALIS • I. IGNIS', hudX + 10, hudY + 18);

    // Phase Badge
    let phaseBadgeColor = '#3bd6c6';
    let phaseText = this.phase;
    if (this.phase === 'FLASHING') {
      phaseBadgeColor = '#ff4500';
      phaseText = 'FLASH ERUPTION!';
    } else if (this.phase === 'CAVITATION') {
      phaseBadgeColor = '#d4af37';
      phaseText = 'BOILING CAVITATION';
    }

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = phaseBadgeColor;
    ctx.fillText(`STATUS: [ ${phaseText} ]`, hudX + 10, hudY + 36);

    // Telemetry items
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e6e8ee';

    // Temperature
    ctx.fillText(`CHAMBER TEMP:    ${this.chamberTemp.toFixed(1)}°C`, hudX + 10, hudY + 54);

    // Pressure & Threshold
    const pressRatio = Math.min(1.0, this.chamberPressure / this.pressureThresholdBar);
    ctx.fillText(
      `PRESSURE:        ${this.chamberPressure.toFixed(1)} / ${this.pressureThresholdBar.toFixed(1)} BAR`,
      hudX + 10,
      hudY + 70
    );

    // Mini Pressure Bar
    const barW = 120;
    const barH = 5;
    const barX = hudX + 10;
    const barY = hudY + 76;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = pressRatio > 0.85 ? '#ff4500' : (pressRatio > 0.6 ? '#d4af37' : '#3bd6c6');
    ctx.fillRect(barX, barY, barW * pressRatio, barH);

    // Sinter Cone Accretion
    const coneHeightMm = (this.totalSinterAccretedMg * 0.1).toFixed(2);
    ctx.fillText(`SINTER CONE:     +${coneHeightMm} mm ACCRETED`, hudX + 10, hudY + 98);

    // Active Entities & Count
    ctx.fillText(`ACTIVE ENTITIES: ${this.getEntityCount()} (FLUID+STEAM)`, hudX + 10, hudY + 114);
    ctx.fillText(`CYCLE COUNT:     #${this.eruptionCount}`, hudX + 10, hudY + 128);

    // Water level indicator in conduit (right side badge)
    ctx.fillStyle = 'rgba(34, 119, 187, 0.3)';
    ctx.fillRect(hudX + hudW - 24, hudY + 28, 14, 94);
    ctx.fillStyle = '#3bd6c6';
    const waterFillH = 94 * this.waterLevel;
    ctx.fillRect(hudX + hudW - 24, hudY + 28 + (94 - waterFillH), 14, waterFillH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.strokeRect(hudX + hudW - 24, hudY + 28, 14, 94);

    ctx.restore();
  }
}
