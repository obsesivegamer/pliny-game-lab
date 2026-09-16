// Caverna: Karst Limestone Dissolution, Speleothems & Hydrogeology Engine
// Grounded in Pliny the Elder's Naturalis Historia (Book XXXVI: Subterranean Stone, Stalactites & Mineral Springs)

export const CAVERNA_PRESETS = {
  CATHEDRAL: 'Limestone Cathedral',
  RIVER: 'Underground River',
  FISSURE: 'Fissure Chasm'
};

export class CavernaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 1200;
    this.height = canvas.height || 800;
    this.dpr = 1;

    // Simulation Clock & Parameters
    this.simTime = 0;
    this.seepageRate = 1.0;          // Rainwater seepage volume (0.1 - 3.0)
    this.saturation = 1.2;           // Mineral saturation / acidity (0.1 - 3.0)
    this.airflow = 1.0;              // Cave airflow & evaporation rate (0.1 - 3.0)
    this.currentPreset = CAVERNA_PRESETS.CATHEDRAL;

    // Geological Structures
    this.numCols = 160;
    this.ceiling = new Float32Array(this.numCols);
    this.floor = new Float32Array(this.numCols);
    this.waterLevel = this.height - 70;

    // Dynamic Entities
    this.dripNodes = [];             // Active ceiling / stalactite drip points
    this.droplets = [];              // Falling water drops with surface tension
    this.splashes = [];              // Secondary splash particles
    this.speleothems = [];           // Stalactites, stalagmites, and monolithic pillars
    this.excavationParticles = [];   // Rock fragments from chisel/excavation

    // Subterranean Karst River Wave Simulation
    this.riverCols = this.numCols;
    this.riverHeight = new Float32Array(this.riverCols);
    this.riverVel = new Float32Array(this.riverCols);
    this.riverCurrentOffset = 0;
    this.flashFloodTime = 0;

    // Interactive Torch / Lantern & Excavation Tool
    this.torch = {
      x: this.width * 0.5,
      y: this.height * 0.5,
      targetX: this.width * 0.5,
      targetY: this.height * 0.5,
      flicker: 1.0
    };
    this.isMouseDown = false;
    this.mousePos = { x: this.width * 0.5, y: this.height * 0.5 };
    this.activeTool = 'excavate'; // 'excavate' or 'fissure'

    // Metrics & Statistics
    this.totalCalciteDeposited = 0;
    this.pillarsMergedCount = 0;
    this.flashFloodsTriggered = 0;

    // Initialize UI and Simulation
    this.initControls();
    this.loadPreset(this.currentPreset);
  }

  // -------------------------------------------------------------------------
  // DOM Controls & UI Construction
  // -------------------------------------------------------------------------
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Cavern Topology Preset</label>
        <select id="caverna-preset" class="sub-btn" style="width: 100%; text-align: left; padding: 6px 8px;">
          <option value="${CAVERNA_PRESETS.CATHEDRAL}" ${this.currentPreset === CAVERNA_PRESETS.CATHEDRAL ? 'selected' : ''}>Limestone Cathedral</option>
          <option value="${CAVERNA_PRESETS.RIVER}" ${this.currentPreset === CAVERNA_PRESETS.RIVER ? 'selected' : ''}>Underground River</option>
          <option value="${CAVERNA_PRESETS.FISSURE}" ${this.currentPreset === CAVERNA_PRESETS.FISSURE ? 'selected' : ''}>Fissure Chasm</option>
        </select>
      </div>

      <div class="control-group">
        <label>Rainwater Seepage Rate: <span id="seepage-val">${this.seepageRate.toFixed(1)}x</span></label>
        <input type="range" id="seepage-slider" min="0.1" max="3.0" step="0.1" value="${this.seepageRate}">
      </div>

      <div class="control-group">
        <label>Acidity / Mineral Saturation: <span id="saturation-val">${this.saturation.toFixed(1)}x</span></label>
        <input type="range" id="saturation-slider" min="0.2" max="3.0" step="0.1" value="${this.saturation}">
      </div>

      <div class="control-group">
        <label>Cave Airflow / Evaporation: <span id="airflow-val">${this.airflow.toFixed(1)}x</span></label>
        <input type="range" id="airflow-slider" min="0.1" max="3.0" step="0.1" value="${this.airflow}">
      </div>

      <div class="control-group">
        <label>Subterranean Events</label>
        <div class="control-btn-grid">
          <button class="sub-btn" id="flood-btn">🌊 Trigger Flash Flood</button>
          <button class="sub-btn" id="accel-btn">⏳ Accelerate 1000 Years</button>
        </div>
      </div>

      <div class="control-group">
        <label>Interactive Chisel Mode</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="tool-excavate">⛏️ Excavate Rock</button>
          <button class="sub-btn" id="tool-fissure">💧 Drill Drip Fissure</button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
        <label>Monolithic Pillars Merged: <span id="pillars-val" style="color: #d4af37; font-weight: bold;">0</span></label>
        <label>Precipitated Calcite: <span id="calcite-val" style="color: #eae6da;">0 mg</span></label>
      </div>
    `;

    // Bind UI elements
    const presetSelect = this.controlsContainer.querySelector('#caverna-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.currentPreset = e.target.value;
        this.loadPreset(this.currentPreset);
      });
    }

    const seepageSlider = this.controlsContainer.querySelector('#seepage-slider');
    const seepageVal = this.controlsContainer.querySelector('#seepage-val');
    if (seepageSlider && seepageVal) {
      seepageSlider.addEventListener('input', (e) => {
        this.seepageRate = parseFloat(e.target.value);
        seepageVal.textContent = `${this.seepageRate.toFixed(1)}x`;
      });
    }

    const saturationSlider = this.controlsContainer.querySelector('#saturation-slider');
    const saturationVal = this.controlsContainer.querySelector('#saturation-val');
    if (saturationSlider && saturationVal) {
      saturationSlider.addEventListener('input', (e) => {
        this.saturation = parseFloat(e.target.value);
        saturationVal.textContent = `${this.saturation.toFixed(1)}x`;
      });
    }

    const airflowSlider = this.controlsContainer.querySelector('#airflow-slider');
    const airflowVal = this.controlsContainer.querySelector('#airflow-val');
    if (airflowSlider && airflowVal) {
      airflowSlider.addEventListener('input', (e) => {
        this.airflow = parseFloat(e.target.value);
        airflowVal.textContent = `${this.airflow.toFixed(1)}x`;
      });
    }

    const floodBtn = this.controlsContainer.querySelector('#flood-btn');
    if (floodBtn) {
      floodBtn.addEventListener('click', () => this.triggerFlashFlood());
    }

    const accelBtn = this.controlsContainer.querySelector('#accel-btn');
    if (accelBtn) {
      accelBtn.addEventListener('click', () => this.accelerateYears(1000));
    }

    const toolExcavate = this.controlsContainer.querySelector('#tool-excavate');
    const toolFissure = this.controlsContainer.querySelector('#tool-fissure');
    if (toolExcavate && toolFissure) {
      toolExcavate.addEventListener('click', () => {
        this.activeTool = 'excavate';
        toolExcavate.classList.add('active');
        toolFissure.classList.remove('active');
      });
      toolFissure.addEventListener('click', () => {
        this.activeTool = 'fissure';
        toolFissure.classList.add('active');
        toolExcavate.classList.remove('active');
      });
    }
  }

  updateHUD() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const pillarsVal = this.controlsContainer.querySelector('#pillars-val');
    if (pillarsVal) pillarsVal.textContent = this.pillarsMergedCount;

    const calciteVal = this.controlsContainer.querySelector('#calcite-val');
    if (calciteVal) calciteVal.textContent = `${Math.round(this.totalCalciteDeposited)} mg`;
  }

  // -------------------------------------------------------------------------
  // Preset Generation & Topography Seeding
  // -------------------------------------------------------------------------
  loadPreset(presetName) {
    this.currentPreset = presetName;
    this.droplets = [];
    this.splashes = [];
    this.speleothems = [];
    this.dripNodes = [];
    this.excavationParticles = [];
    this.pillarsMergedCount = 0;
    this.totalCalciteDeposited = 0;

    const w = this.width;
    const h = this.height;
    this.waterLevel = h - 75;

    // Reset river wave simulation
    for (let i = 0; i < this.riverCols; i++) {
      this.riverHeight[i] = 0;
      this.riverVel[i] = 0;
    }

    if (presetName === CAVERNA_PRESETS.CATHEDRAL) {
      // Grand arched vault ceiling with monumental stalactites and stalagmites
      for (let i = 0; i < this.numCols; i++) {
        const u = i / (this.numCols - 1);
        // Cathedral dome arch
        const dome = Math.sin(u * Math.PI) * 55;
        const noise = Math.sin(u * 18) * 8 + Math.cos(u * 32) * 4;
        this.ceiling[i] = 55 - dome * 0.4 + noise;
        // Terraced cave floor with central river basin
        const basin = Math.sin(u * Math.PI) * 45;
        this.floor[i] = h - 50 + basin * 0.5 + Math.sin(u * 14) * 6;
      }

      // Seed prominent cathedral stalactites and opposing stalagmites
      const seedPoints = [
        { x: w * 0.18, stalactiteH: 140, stalagmiteH: 110 },
        { x: w * 0.35, stalactiteH: 190, stalagmiteH: 170 }, // Close to pillar merger!
        { x: w * 0.52, stalactiteH: 120, stalagmiteH: 90 },
        { x: w * 0.68, stalactiteH: 210, stalagmiteH: 200 }, // Almost touching!
        { x: w * 0.84, stalactiteH: 150, stalagmiteH: 120 }
      ];

      seedPoints.forEach((sp, idx) => {
        this.createStalactitePair(sp.x, sp.stalactiteH, sp.stalagmiteH, idx % 2 === 0);
      });

      // Add secondary ceiling soda straws
      for (let x = w * 0.08; x < w * 0.95; x += w * 0.07) {
        this.addDripNode(x, null);
      }

    } else if (presetName === CAVERNA_PRESETS.RIVER) {
      // Low ceiling, broad underground torrent
      this.waterLevel = h - 90;
      for (let i = 0; i < this.numCols; i++) {
        const u = i / (this.numCols - 1);
        this.ceiling[i] = 75 + Math.sin(u * 12) * 12 + Math.cos(u * 28) * 5;
        this.floor[i] = h - 45 + Math.sin(u * Math.PI) * 35;
      }

      // Slender soda straws hanging low over the water
      for (let x = w * 0.12; x < w * 0.9; x += w * 0.09) {
        const stalactite = this.createSpeleothem('stalactite', x, 40 + Math.random() * 50);
        this.addDripNode(x, stalactite);
      }

    } else if (presetName === CAVERNA_PRESETS.FISSURE) {
      // Jagged fault fracture chasm with high seepage
      for (let i = 0; i < this.numCols; i++) {
        const u = i / (this.numCols - 1);
        const faultStep = u > 0.5 ? 40 : -20;
        this.ceiling[i] = 85 + faultStep + Math.sin(u * 40) * 15;
        this.floor[i] = h - 60 - faultStep * 0.5 + Math.cos(u * 35) * 12;
      }

      // Narrow cascade of drip fissures
      for (let x = w * 0.15; x < w * 0.88; x += w * 0.08) {
        const stalH = 60 + Math.random() * 80;
        const stagH = 50 + Math.random() * 70;
        this.createStalactitePair(x, stalH, stagH, false);
      }
    }

    this.updateHUD();
  }

  createStalactitePair(x, stalactiteHeight, stalagmiteHeight, fused = false) {
    const col = this.getCol(x);
    const ceilY = this.ceiling[col];
    const floorY = this.floor[col];

    // Create Stalactite downwards
    const stalactite = this.createSpeleothem('stalactite', x, stalactiteHeight);

    // Create Stalagmite upwards
    const stalagmite = this.createSpeleothem('stalagmite', x + (Math.random() - 0.5) * 6, stalagmiteHeight);

    // Add drip node to stalactite tip
    this.addDripNode(x, stalactite);

    if (fused) {
      // Merge into an antique monolithic Roman column immediately for variety
      this.fusePair(stalactite, stalagmite);
    }
  }

  createSpeleothem(type, x, targetLength) {
    const col = this.getCol(x);
    const baseY = type === 'stalactite' ? this.ceiling[col] : this.floor[col];
    const segmentSpacing = 5;
    const segmentCount = Math.max(3, Math.floor(targetLength / segmentSpacing));
    const segments = [];

    let currentY = baseY;
    let currentX = x;

    for (let i = 0; i < segmentCount; i++) {
      const prog = i / segmentCount; // 0 at base, 1 at tip
      const baseRadius = type === 'stalactite' ? 14 : 20;
      const tipRadius = type === 'stalactite' ? 2.5 : 4.0;
      // Natural conical taper with organic fluting
      const r = baseRadius * (1 - prog * 0.75) + (Math.sin(i * 0.9) * 0.8);

      segments.push({
        x: currentX,
        y: currentY,
        r: Math.max(1.8, r),
        mineral: 1.0,
        shimmerPhase: Math.random() * Math.PI * 2,
        facetAngle: Math.random() * Math.PI * 2
      });

      if (type === 'stalactite') {
        currentY += segmentSpacing;
        currentX += (Math.sin(i * 0.4 + x) * 0.4);
      } else {
        currentY -= segmentSpacing;
        currentX += (Math.cos(i * 0.4 + x) * 0.4);
      }
    }

    const speleo = {
      id: Math.random(),
      type, // 'stalactite' | 'stalagmite' | 'pillar'
      baseX: x,
      baseY,
      segments,
      growthAccumulator: 0,
      crystallinity: 0.8 + Math.random() * 0.4
    };

    this.speleothems.push(speleo);
    return speleo;
  }

  addDripNode(x, parentSpeleothem = null) {
    const col = this.getCol(x);
    let y = this.ceiling[col];
    if (parentSpeleothem && parentSpeleothem.segments.length > 0) {
      const tip = parentSpeleothem.segments[parentSpeleothem.segments.length - 1];
      y = tip.y;
      x = tip.x;
    }

    const node = {
      x,
      y,
      parentSpeleothem,
      waterVolume: Math.random() * 0.4, // Accumulated water mass
      mineralPayload: 1.0,
      seepageFactor: 0.7 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      active: true
    };

    this.dripNodes.push(node);
    return node;
  }

  getCol(x) {
    const c = Math.floor((x / Math.max(1, this.width)) * this.numCols);
    return Math.max(0, Math.min(this.numCols - 1, c));
  }

  getSpeleothemSegmentCount() {
    let count = 0;
    for (let i = 0; i < this.speleothems.length; i++) {
      count += this.speleothems[i].segments.length;
    }
    return count;
  }

  // Contract requirement:
  // integer count of active water droplets, drip nodes, and speleothem segments
  getEntityCount() {
    const activeDrops = this.droplets.length;
    const activeNodes = this.dripNodes.filter(n => n.active).length;
    const segments = this.getSpeleothemSegmentCount();
    return activeDrops + activeNodes + segments;
  }

  // -------------------------------------------------------------------------
  // Simulation Step: Water Seepage, Droplet Kinematics, Karst Precipitation
  // -------------------------------------------------------------------------
  update(dt) {
    if (!dt || dt <= 0) return;
    const clampedDt = Math.min(dt, 0.05);
    this.simTime += clampedDt;

    // Smooth torchlight guidance towards cursor with subterranean draft wobble
    const draftWobbleX = Math.sin(this.simTime * 2.1) * 3;
    const draftWobbleY = Math.cos(this.simTime * 1.8) * 3;
    this.torch.x += (this.torch.targetX + draftWobbleX - this.torch.x) * (clampedDt * 8);
    this.torch.y += (this.torch.targetY + draftWobbleY - this.torch.y) * (clampedDt * 8);
    this.torch.flicker = 1.0 + Math.sin(this.simTime * 9.4) * 0.04 + (Math.random() - 0.5) * 0.02;

    // Continuous excavation if mouse is held down
    if (this.isMouseDown) {
      this.performExcavation(this.mousePos.x, this.mousePos.y, clampedDt);
    }

    // 1. Update Drip Nodes & Overhead Limestone Seepage
    this.updateDripNodes(clampedDt);

    // 2. Update Falling Water Droplets & Surface Tension Physics
    this.updateDroplets(clampedDt);

    // 3. Update Splash Droplets
    this.updateSplashes(clampedDt);

    // 4. Update Excavation Dust & Rock Chipping Particles
    this.updateParticles(clampedDt);

    // 5. Update Underground Karst River Waves & Currents
    this.updateRiver(clampedDt);

    // 6. Check for Opposing Stalactite & Stalagmite Mergers into Pillars
    this.checkPillarMergers();

    // 7. Update HUD Telemetry occasionally
    if (Math.random() < 0.1) {
      this.updateHUD();
    }
  }

  updateDripNodes(dt) {
    for (let i = 0; i < this.dripNodes.length; i++) {
      const node = this.dripNodes[i];
      if (!node.active) continue;

      // Sync drip node position with its parent stalactite tip if attached
      if (node.parentSpeleothem) {
        if (node.parentSpeleothem.type === 'pillar') {
          // Pillars conduct sheet wash down stone, no pendant detachment
          node.active = false;
          continue;
        }
        const segs = node.parentSpeleothem.segments;
        if (segs.length > 0) {
          const tip = segs[segs.length - 1];
          node.x = tip.x;
          node.y = tip.y;
        }
      }

      // Overhead limestone porosity: seepage accumulates carbonic acid rainwater
      const dripRate = this.seepageRate * node.seepageFactor;
      node.waterVolume += dt * dripRate * 0.45;

      // When pendant mass exceeds surface tension threshold, droplet detaches!
      if (node.waterVolume >= 1.0) {
        node.waterVolume = 0;
        this.spawnDroplet(node);

        // Degasification of CO2 at tip deposits a micro-ring of calcium carbonate (soda straw growth)
        const tipAccretion = 0.035 * this.saturation * this.airflow;
        if (node.parentSpeleothem) {
          this.accreteStalactiteTip(node.parentSpeleothem, tipAccretion);
        }
        this.totalCalciteDeposited += tipAccretion * 0.8;
      }
    }
  }

  spawnDroplet(node) {
    // Translucent falling droplet with mineral payload
    this.droplets.push({
      x: node.x + (Math.random() - 0.5) * 1.2,
      y: node.y + 2,
      vx: (Math.random() - 0.5) * 4,
      vy: 18 + Math.random() * 15,
      r: 2.2 + Math.random() * 0.6,
      mineral: 0.18 * this.saturation,
      age: 0,
      opacity: 0.85
    });
  }

  updateDroplets(dt) {
    const gravity = 420;
    const airDrift = (this.airflow - 1.0) * 12;

    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.age += dt;

      // Gravity & Aerodynamic drag
      d.vy += gravity * dt;
      d.vx += (airDrift + Math.sin(this.simTime * 3 + d.y * 0.02) * 6) * dt;
      d.vx *= Math.pow(0.98, dt * 60);

      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Check boundary bounds
      if (d.x < 0 || d.x > this.width || d.y > this.height + 20) {
        this.droplets.splice(i, 1);
        continue;
      }

      const col = this.getCol(d.x);
      const floorY = this.floor[col];
      const riverSurfaceY = this.waterLevel + this.riverHeight[col];

      // Check collision with speleothems (stalagmites, pillars)
      let hitSpeleo = false;
      for (let s = 0; s < this.speleothems.length; s++) {
        const speleo = this.speleothems[s];
        if (speleo.type === 'stalactite') continue; // Drops fall away from stalactites

        // Check proximity to tip or upper segments
        const segs = speleo.segments;
        if (segs.length === 0) continue;
        const tip = segs[segs.length - 1];
        const dx = d.x - tip.x;
        const dy = d.y - tip.y;
        const distSq = dx * dx + dy * dy;
        const hitRadius = tip.r + d.r + 3;

        if (distSq < hitRadius * hitRadius) {
          // Impact on stalagmite or pillar!
          hitSpeleo = true;
          this.triggerSplash(d.x, d.y, d.vy, '#eae6da');

          // Impact agitation releases CO2: calcium carbonate accretes upward!
          this.accreteStalagmiteTip(speleo, d.mineral * this.airflow);
          this.totalCalciteDeposited += d.mineral;
          break;
        }
      }

      if (hitSpeleo) {
        this.droplets.splice(i, 1);
        continue;
      }

      // Check collision with Karst River pool
      if (d.y >= riverSurfaceY && riverSurfaceY <= floorY) {
        // Impact into underground river pool
        this.triggerSplash(d.x, riverSurfaceY, d.vy * 0.45, 'rgba(80, 190, 220, 0.7)');

        // Transfer downward momentum to 1D river ripple wave
        this.riverVel[col] += d.vy * 0.08;
        if (col > 0) this.riverVel[col - 1] += d.vy * 0.04;
        if (col < this.riverCols - 1) this.riverVel[col + 1] += d.vy * 0.04;

        this.droplets.splice(i, 1);
        continue;
      }

      // Check collision with dry rock cave floor
      if (d.y >= floorY) {
        this.triggerSplash(d.x, floorY, d.vy * 0.6, '#d8d4c8');

        // Accrete new stalagmite or feed nearest floor stalagmite
        this.depositOnFloor(d.x, floorY, d.mineral);
        this.totalCalciteDeposited += d.mineral;

        this.droplets.splice(i, 1);
        continue;
      }
    }
  }

  triggerSplash(x, y, impactVelocity, color) {
    const splashCount = Math.min(6, 3 + Math.floor(Math.abs(impactVelocity) * 0.015));
    for (let k = 0; k < splashCount; k++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const speed = 25 + Math.random() * 55;
      this.splashes.push({
        x,
        y: y - 1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.0 + Math.random() * 1.2,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        color
      });
    }
  }

  updateSplashes(dt) {
    const gravity = 380;
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.splashes.splice(i, 1);
        continue;
      }
      s.vy += gravity * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
  }

  depositOnFloor(x, floorY, mineralAmount) {
    // Find nearest stalagmite within 25px
    let nearest = null;
    let minDist = 26;
    for (let i = 0; i < this.speleothems.length; i++) {
      const s = this.speleothems[i];
      if (s.type === 'stalagmite') {
        const d = Math.abs(s.baseX - x);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }
    }

    if (nearest) {
      this.accreteStalagmiteTip(nearest, mineralAmount * this.airflow);
    } else {
      // Seed a new baby stalagmite growing upwards from the cave bedrock
      const newStag = this.createSpeleothem('stalagmite', x, 12);
      this.accreteStalagmiteTip(newStag, mineralAmount);
    }
  }

  accreteStalactiteTip(speleo, mineralAmount) {
    speleo.growthAccumulator += mineralAmount;
    // Thicken existing upper segments via trickling film flow
    for (let i = 0; i < speleo.segments.length; i++) {
      speleo.segments[i].r += mineralAmount * 0.012 * (1 / (1 + i * 0.1));
    }

    // When enough mineral mass precipitates, extend the tip downwards
    if (speleo.growthAccumulator >= 1.0) {
      speleo.growthAccumulator -= 1.0;
      const segs = speleo.segments;
      const tip = segs[segs.length - 1];
      const spacing = 4.5;
      const newY = tip.y + spacing;

      segs.push({
        x: tip.x + (Math.random() - 0.5) * 0.8,
        y: newY,
        r: Math.max(2.2, tip.r * 0.95),
        mineral: 1.0,
        shimmerPhase: Math.random() * Math.PI * 2,
        facetAngle: Math.random() * Math.PI * 2
      });
    }
  }

  accreteStalagmiteTip(speleo, mineralAmount) {
    speleo.growthAccumulator += mineralAmount;
    // Broaden lower segments from splash washdown (candle wax profile)
    for (let i = 0; i < speleo.segments.length; i++) {
      speleo.segments[i].r += mineralAmount * 0.018;
    }

    // When enough mineral mass accumulates, build upwards towards ceiling
    if (speleo.growthAccumulator >= 1.2) {
      speleo.growthAccumulator -= 1.2;
      const segs = speleo.segments;
      const tip = segs[segs.length - 1];
      const spacing = 4.5;
      const newY = tip.y - spacing;

      segs.push({
        x: tip.x + (Math.random() - 0.5) * 0.8,
        y: newY,
        r: Math.max(3.2, tip.r * 0.96),
        mineral: 1.0,
        shimmerPhase: Math.random() * Math.PI * 2,
        facetAngle: Math.random() * Math.PI * 2
      });
    }
  }

  // -------------------------------------------------------------------------
  // Speleothem Pillar Merging Physics
  // -------------------------------------------------------------------------
  checkPillarMergers() {
    for (let i = 0; i < this.speleothems.length; i++) {
      const s1 = this.speleothems[i];
      if (s1.type !== 'stalactite') continue;

      const tip1 = s1.segments[s1.segments.length - 1];
      if (!tip1) continue;

      for (let j = 0; j < this.speleothems.length; j++) {
        const s2 = this.speleothems[j];
        if (s2.type !== 'stalagmite') continue;

        const tip2 = s2.segments[s2.segments.length - 1];
        if (!tip2) continue;

        // Check horizontal alignment and vertical overlap / proximity
        const horizDist = Math.abs(tip1.x - tip2.x);
        const touchDistance = tip1.r + tip2.r + 4;

        if (horizDist < touchDistance && tip1.y >= tip2.y - 4) {
          // MONOLITHIC PILLAR FORMATION!
          this.fusePair(s1, s2);
          break;
        }
      }
    }
  }

  fusePair(stalactite, stalagmite) {
    // Merge both into a unified monolithic pillar column
    stalactite.type = 'pillar';
    stalactite.baseY = Math.min(stalactite.baseY, stalagmite.baseY);

    // Concatenate segments in order from ceiling down to floor
    const mergedSegments = [...stalactite.segments];
    // Stalagmite segments are indexed 0 at floor to tip at top; reverse to connect seamlessly
    const stagReversed = [...stalagmite.segments].reverse();
    mergedSegments.push(...stagReversed);

    stalactite.segments = mergedSegments;

    // Remove merged stalagmite from array
    const stagIndex = this.speleothems.indexOf(stalagmite);
    if (stagIndex !== -1) {
      this.speleothems.splice(stagIndex, 1);
    }

    // Deactivate dripping node (water now flows as continuous calcite sheet down column)
    for (let k = 0; k < this.dripNodes.length; k++) {
      if (this.dripNodes[k].parentSpeleothem === stalactite || this.dripNodes[k].parentSpeleothem === stalagmite) {
        this.dripNodes[k].active = false;
      }
    }

    this.pillarsMergedCount++;

    // Celebratory golden crystal glitter burst
    const midY = (mergedSegments[0].y + mergedSegments[mergedSegments.length - 1].y) * 0.5;
    for (let p = 0; p < 24; p++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 60;
      this.excavationParticles.push({
        x: stalactite.baseX,
        y: midY,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        r: 1.5 + Math.random() * 2.0,
        color: '#d4af37',
        life: 0.9 + Math.random() * 0.6
      });
    }

    this.updateHUD();
  }

  // -------------------------------------------------------------------------
  // Karst River Hydrodynamics (1D Wave Equation, Flow Currents, Flash Flood)
  // -------------------------------------------------------------------------
  updateRiver(dt) {
    this.riverCurrentOffset += dt * 35; // Subsurface horizontal stream drift

    // Handle active flash flood surge
    if (this.flashFloodTime > 0) {
      this.flashFloodTime -= dt;
      const surgeStrength = Math.sin((this.flashFloodTime / 4.0) * Math.PI);
      // Sweeping pulse wave from left to right
      this.riverVel[0] += surgeStrength * 70 * dt;
      this.waterLevel = (this.height - 75) - surgeStrength * 32;
    } else {
      // Easing back to calm base level
      const targetWaterLevel = this.height - 75;
      this.waterLevel += (targetWaterLevel - this.waterLevel) * (dt * 2.0);
    }

    // Solve 1D wave equation: d2h/dt2 = c^2 * d2h/dx2 - damping * dh/dt
    const waveSpeed = 240;
    const damping = 0.982;
    const dx = this.width / this.riverCols;
    const cSq = (waveSpeed * waveSpeed) / (dx * dx);

    // Sub-stepping for numerical stability
    const steps = 2;
    const subDt = dt / steps;

    for (let s = 0; s < steps; s++) {
      for (let i = 1; i < this.riverCols - 1; i++) {
        const d2y = this.riverHeight[i - 1] + this.riverHeight[i + 1] - 2 * this.riverHeight[i];
        this.riverVel[i] += d2y * (cSq * 0.0001) * subDt;
        this.riverVel[i] *= Math.pow(damping, subDt * 60);
      }

      // Boundary condition: open cavern outflow on edges
      this.riverVel[0] *= 0.95;
      this.riverVel[this.riverCols - 1] *= 0.95;

      for (let i = 0; i < this.riverCols; i++) {
        this.riverHeight[i] += this.riverVel[i] * subDt;
        // Clamp extreme waves
        if (Math.abs(this.riverHeight[i]) > 38) {
          this.riverHeight[i] = Math.sign(this.riverHeight[i]) * 38;
        }
      }
    }
  }

  triggerFlashFlood() {
    this.flashFloodTime = 4.0;
    this.flashFloodsTriggered++;
    // Excite waves along entire river basin
    for (let i = 0; i < this.riverCols; i++) {
      this.riverVel[i] += (Math.random() - 0.5) * 80;
    }
  }

  accelerateYears(years) {
    // Geological time jump: run 250 accelerated simulation iterations in a burst
    const iterations = Math.min(300, Math.floor(years * 0.25));
    const dtStep = 0.03;

    for (let step = 0; step < iterations; step++) {
      this.simTime += dtStep;

      // Accelerated seepage & dripping
      for (let i = 0; i < this.dripNodes.length; i++) {
        const node = this.dripNodes[i];
        if (!node.active) continue;

        node.waterVolume += dtStep * this.seepageRate * 1.2;
        if (node.waterVolume >= 1.0) {
          node.waterVolume = 0;
          const deposit = 0.15 * this.saturation * this.airflow;
          if (node.parentSpeleothem) {
            this.accreteStalactiteTip(node.parentSpeleothem, deposit);
          }
          this.totalCalciteDeposited += deposit;

          // Find opposing stalagmite underneath
          const col = this.getCol(node.x);
          const floorY = this.floor[col];
          this.depositOnFloor(node.x, floorY, deposit * 1.2);
        }
      }

      // Thicken pillars
      for (let s = 0; s < this.speleothems.length; s++) {
        const speleo = this.speleothems[s];
        if (speleo.type === 'pillar') {
          for (let k = 0; k < speleo.segments.length; k++) {
            speleo.segments[k].r += 0.015 * this.saturation;
          }
        }
      }

      this.checkPillarMergers();
    }

    this.updateHUD();
  }

  // -------------------------------------------------------------------------
  // Interactive Excavation & Fissure Carving
  // -------------------------------------------------------------------------
  performExcavation(x, y, dt) {
    const col = this.getCol(x);
    const radius = 24;

    if (this.activeTool === 'excavate') {
      // Carve into rock: raise ceiling or deepen floor
      const ceilDist = Math.abs(y - this.ceiling[col]);
      const floorDist = Math.abs(y - this.floor[col]);

      if (y < this.ceiling[col] + 30) {
        // Hollowing ceiling upward
        const carveCols = 5;
        for (let c = Math.max(0, col - carveCols); c <= Math.min(this.numCols - 1, col + carveCols); c++) {
          const factor = 1 - Math.abs(c - col) / (carveCols + 1);
          this.ceiling[c] = Math.max(15, this.ceiling[c] - 18 * factor * (dt * 15));
        }
        this.spawnRockChips(x, y, '#6b7280');
      } else if (y > this.floor[col] - 30) {
        // Trenching floor downward
        const carveCols = 5;
        for (let c = Math.max(0, col - carveCols); c <= Math.min(this.numCols - 1, col + carveCols); c++) {
          const factor = 1 - Math.abs(c - col) / (carveCols + 1);
          this.floor[c] = Math.min(this.height - 10, this.floor[c] + 18 * factor * (dt * 15));
        }
        this.spawnRockChips(x, y, '#4b5563');
      } else {
        // In open space: check if chipping a speleothem segment
        for (let i = 0; i < this.speleothems.length; i++) {
          const s = this.speleothems[i];
          for (let k = s.segments.length - 1; k >= 0; k--) {
            const seg = s.segments[k];
            const dx = x - seg.x;
            const dy = y - seg.y;
            if (dx * dx + dy * dy < radius * radius) {
              seg.r = Math.max(1.5, seg.r - 2.5 * dt * 10);
              this.spawnRockChips(seg.x, seg.y, '#eae6da');
            }
          }
        }
      }
    } else if (this.activeTool === 'fissure') {
      // Drill a new active water drip fissure into the ceiling
      if (Math.random() < 0.15) {
        this.addDripNode(x, null);
        this.spawnRockChips(x, y, '#6ee7b7');
      }
    }
  }

  spawnRockChips(x, y, color) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 45;
      this.excavationParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.2 + Math.random() * 1.8,
        color,
        life: 0.4 + Math.random() * 0.3
      });
    }
  }

  updateParticles(dt) {
    const gravity = 350;
    for (let i = this.excavationParticles.length - 1; i >= 0; i--) {
      const p = this.excavationParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.excavationParticles.splice(i, 1);
        continue;
      }
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  // -------------------------------------------------------------------------
  // Rendering: Deep Cavern Ambience, Shimmering Calcite Crystals, Torchlight
  // -------------------------------------------------------------------------
  render(ctx) {
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    // 1. Deep Subterranean Dark Cavern Ambience
    ctx.save();
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, w, h);

    // Subtle distant cavern silhouette gradient
    if (ctx.createLinearGradient) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0c0e14');
      bgGrad.addColorStop(0.5, '#07080b');
      bgGrad.addColorStop(1, '#050608');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Render Porous Limestone Ceiling
    this.renderCeilingRock(ctx);

    // 3. Render Cave Floor & Bedrock
    this.renderFloorRock(ctx);

    // 4. Render Speleothems (Stalactites, Stalagmites, Monolithic Pillars)
    this.renderSpeleothems(ctx);

    // 5. Render Underground Karst River Pool & Surface Ripples
    this.renderRiver(ctx);

    // 6. Render Active Drip Nodes & Hanging Pendant Droplets
    this.renderDripNodes(ctx);

    // 7. Render Translucent Falling Droplets
    this.renderDroplets(ctx);

    // 8. Render Splash & Excavation Particles
    this.renderParticles(ctx);

    // 9. Dynamic Torchlight / Lantern Radiance Following Cursor
    this.renderTorchRadiance(ctx);

    ctx.restore();
  }

  renderCeilingRock(ctx) {
    const w = this.width;
    const dx = w / (this.numCols - 1);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, this.ceiling[this.numCols - 1]);

    for (let i = this.numCols - 2; i >= 0; i--) {
      ctx.lineTo(i * dx, this.ceiling[i]);
    }
    ctx.closePath();

    // Dark subterranean limestone texture
    ctx.fillStyle = '#1c1f28';
    ctx.fill();

    // Strata fissure veins
    ctx.strokeStyle = '#2d3342';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Organic fissure lines in overhead rock
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'; // Carbonic mineral seep seams
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this.numCols; i += 4) {
      const x = i * dx;
      const y = this.ceiling[i];
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.sin(i * 1.5) * 8, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  renderFloorRock(ctx) {
    const w = this.width;
    const h = this.height;
    const dx = w / (this.numCols - 1);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, this.floor[0]);

    for (let i = 1; i < this.numCols; i++) {
      ctx.lineTo(i * dx, this.floor[i]);
    }

    ctx.lineTo(w, h);
    ctx.closePath();

    ctx.fillStyle = '#14161f';
    ctx.fill();

    ctx.strokeStyle = '#232733';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  renderSpeleothems(ctx) {
    ctx.save();

    for (let s = 0; s < this.speleothems.length; s++) {
      const speleo = this.speleothems[s];
      const segs = speleo.segments;
      if (segs.length < 2) continue;

      // Draw layered fluted stone body
      this.drawSpeleothemContour(ctx, speleo);

      // Draw shimmering calcite crystal highlights (#d4af37)
      this.drawCalciteCrystals(ctx, speleo);
    }

    ctx.restore();
  }

  drawSpeleothemContour(ctx, speleo) {
    const segs = speleo.segments;
    ctx.save();

    // Left and right perimeter profiles
    const leftProfile = [];
    const rightProfile = [];

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      leftProfile.push({ x: seg.x - seg.r, y: seg.y });
      rightProfile.push({ x: seg.x + seg.r, y: seg.y });
    }

    ctx.beginPath();
    ctx.moveTo(leftProfile[0].x, leftProfile[0].y);
    for (let i = 1; i < leftProfile.length; i++) {
      ctx.lineTo(leftProfile[i].x, leftProfile[i].y);
    }

    // Connect across tip / base
    for (let i = rightProfile.length - 1; i >= 0; i--) {
      ctx.lineTo(rightProfile[i].x, rightProfile[i].y);
    }
    ctx.closePath();

    if (speleo.type === 'pillar') {
      // Classical Roman architectural stone column tone
      ctx.fillStyle = '#2f3442';
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    } else if (speleo.type === 'stalactite') {
      ctx.fillStyle = '#2a2e3b';
      ctx.fill();
      ctx.strokeStyle = '#42485c';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else {
      // Stalagmite: tiered pagoda/candle wax tone
      ctx.fillStyle = '#252936';
      ctx.fill();
      ctx.strokeStyle = '#3d4354';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawCalciteCrystals(ctx, speleo) {
    const segs = speleo.segments;
    const torchX = this.torch.x;
    const torchY = this.torch.y;

    ctx.save();
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      // Distance from torch determines specular glint intensity
      const dx = seg.x - torchX;
      const dy = seg.y - torchY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 320) {
        const lightFactor = Math.max(0, 1 - dist / 320);
        const shimmer = Math.sin(this.simTime * 3.5 + seg.shimmerPhase);

        if (shimmer > 0.45) {
          const glintAlpha = (shimmer - 0.45) * 1.8 * lightFactor;
          const glintSize = 1.5 + shimmer * 1.5;

          // Gold crystal faceted glint (#d4af37)
          ctx.fillStyle = `rgba(212, 175, 55, ${glintAlpha.toFixed(2)})`;
          ctx.fillRect(seg.x - glintSize * 0.5, seg.y - glintSize * 0.5, glintSize, glintSize);

          // Central white diamond specular sparkle
          if (shimmer > 0.85 && lightFactor > 0.4) {
            ctx.fillStyle = `rgba(255, 255, 240, ${(glintAlpha * 0.8).toFixed(2)})`;
            ctx.fillRect(seg.x - 0.5, seg.y - 0.5, 1.2, 1.2);
          }
        }
      }
    }
    ctx.restore();
  }

  renderRiver(ctx) {
    const w = this.width;
    const h = this.height;
    const dx = w / (this.riverCols - 1);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, this.waterLevel + this.riverHeight[0]);

    for (let i = 1; i < this.riverCols; i++) {
      const x = i * dx;
      const y = this.waterLevel + this.riverHeight[i];
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();

    // Deep subterranean karst water body
    if (ctx.createLinearGradient) {
      const waterGrad = ctx.createLinearGradient(0, this.waterLevel - 20, 0, h);
      waterGrad.addColorStop(0, 'rgba(30, 95, 116, 0.8)');
      waterGrad.addColorStop(0.4, 'rgba(18, 55, 75, 0.88)');
      waterGrad.addColorStop(1, 'rgba(8, 25, 38, 0.95)');
      ctx.fillStyle = waterGrad;
    } else {
      ctx.fillStyle = 'rgba(20, 60, 80, 0.85)';
    }
    ctx.fill();

    // Luminescent water surface wave crest
    ctx.beginPath();
    ctx.moveTo(0, this.waterLevel + this.riverHeight[0]);
    for (let i = 1; i < this.riverCols; i++) {
      ctx.lineTo(i * dx, this.waterLevel + this.riverHeight[i]);
    }
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subsurface stream flow streaks
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let line = 0; line < 4; line++) {
      const lineY = this.waterLevel + 18 + line * 14;
      if (lineY >= h - 10) continue;
      const offset = (this.riverCurrentOffset * (0.8 + line * 0.3)) % w;
      for (let x = -w; x < w * 2; x += 120) {
        ctx.moveTo(x + offset, lineY);
        ctx.lineTo(x + offset + 45, lineY);
      }
    }
    ctx.stroke();

    ctx.restore();
  }

  renderDripNodes(ctx) {
    ctx.save();
    for (let i = 0; i < this.dripNodes.length; i++) {
      const node = this.dripNodes[i];
      if (!node.active) continue;

      const swellRadius = 1.2 + node.waterVolume * 2.2;
      // Swelling pendant water droplet at ceiling tip
      ctx.beginPath();
      ctx.arc(node.x, node.y + swellRadius * 0.5, swellRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180, 230, 255, 0.75)';
      ctx.fill();

      // Specular highlight on drop
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(node.x - 0.5, node.y + 0.5, 1, 1);
    }
    ctx.restore();
  }

  renderDroplets(ctx) {
    ctx.save();
    for (let i = 0; i < this.droplets.length; i++) {
      const d = this.droplets[i];
      // Elongated falling droplet trajectory
      const trailLength = Math.min(10, d.vy * 0.025);

      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r * 0.8, d.r + trailLength, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(165, 225, 250, ${d.opacity.toFixed(2)})`;
      ctx.fill();

      // Specular center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(d.x - 0.5, d.y - trailLength * 0.3, 1, 1.5);
    }
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    // Render splashes
    for (let i = 0; i < this.splashes.length; i++) {
      const s = this.splashes[i];
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color.startsWith('#')
        ? s.color
        : s.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    // Render rock chipping debris
    ctx.globalAlpha = 1.0;
    for (let i = 0; i < this.excavationParticles.length; i++) {
      const p = this.excavationParticles[i];
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.restore();
  }

  renderTorchRadiance(ctx) {
    const tx = this.torch.x;
    const ty = this.torch.y;
    const radius = 280 * this.torch.flicker;

    ctx.save();
    if (ctx.createRadialGradient) {
      const torchGrad = ctx.createRadialGradient(tx, ty, 10, tx, ty, radius);
      torchGrad.addColorStop(0, 'rgba(255, 185, 70, 0.38)');
      torchGrad.addColorStop(0.35, 'rgba(220, 130, 40, 0.18)');
      torchGrad.addColorStop(0.7, 'rgba(120, 60, 20, 0.06)');
      torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = torchGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small glowing lantern flame core at cursor
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffecb3';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tx, ty, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Lifecycle & Interactive Events
  // -------------------------------------------------------------------------
  resize(width, height, dpr = 1) {
    this.width = width || 1200;
    this.height = height || 800;
    this.dpr = dpr || 1;
    this.waterLevel = this.height - 75;
  }

  reset() {
    this.loadPreset(this.currentPreset);
  }

  destroy() {
    // Clean up simulation arrays
    this.droplets = [];
    this.splashes = [];
    this.speleothems = [];
    this.dripNodes = [];
    this.excavationParticles = [];
  }

  onMouseDown(pos) {
    this.isMouseDown = true;
    if (pos) {
      this.mousePos = { x: pos.x, y: pos.y };
      this.torch.targetX = pos.x;
      this.torch.targetY = pos.y;
      this.performExcavation(pos.x, pos.y, 0.05);
    }
  }

  onMouseMove(pos) {
    if (pos) {
      this.mousePos = { x: pos.x, y: pos.y };
      this.torch.targetX = pos.x;
      this.torch.targetY = pos.y;
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    if (pos) {
      this.mousePos = { x: pos.x, y: pos.y };
    }
  }

  onKeyDown(key, e) {
    if (!key) return;
    const lowerKey = key.toLowerCase();

    if (lowerKey === ' ' || lowerKey === 'f') {
      this.triggerFlashFlood();
      if (e && e.preventDefault) e.preventDefault();
    } else if (lowerKey === 't') {
      this.accelerateYears(1000);
    } else if (lowerKey === '1') {
      this.loadPreset(CAVERNA_PRESETS.CATHEDRAL);
    } else if (lowerKey === '2') {
      this.loadPreset(CAVERNA_PRESETS.RIVER);
    } else if (lowerKey === '3') {
      this.loadPreset(CAVERNA_PRESETS.FISSURE);
    } else if (lowerKey === 'e') {
      this.activeTool = this.activeTool === 'excavate' ? 'fissure' : 'excavate';
    } else if (lowerKey === 'r') {
      this.reset();
    }
  }
}
