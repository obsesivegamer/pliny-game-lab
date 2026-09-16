// Apis: Karl von Frisch Waggle Dance & Honeycomb Cellular Automata
// Grounded in Pliny the Elder's Naturalis Historia (Book XI: Bees, Hexagonal Combs & Superorganism)
// and Karl von Frisch's Nobel Prize-winning discovery of the Honeybee Dance Language (1973).

export class ApisEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 1200 : 1200;
    this.height = canvas ? canvas.height || 800 : 800;
    this.dpr = 1;

    // Simulation Parameters
    this.flightSpeed = 150;      // Pixels/sec in meadow
    this.bloomDensity = 1.0;     // Floral replenishment factor
    this.waggleAccuracy = 0.88;   // von Frisch angle precision (0 to 1)
    this.sunAngle = -Math.PI * 0.35; // Sun position in meadow (radians from horizontal right)
    
    // Thermal Hive State
    this.targetTemp = 35.0;      // 35°C optimal brood incubation temperature
    this.ambientTemp = 24.0;     // Meadow temperature
    this.hiveTemp = 35.0;

    // Split View Ratio (Hive Comb vs Meadow)
    this.splitRatio = 0.44;

    // Entities
    this.cells = [];             // Hexagonal honeycomb cells
    this.bees = [];              // Superorganism bees
    this.flowers = [];           // Mediterranean flora
    this.pollenParticles = [];   // Spores, nectar drops, pollen dust
    this.sonicRipples = [];      // Waggle dance vibration ripples

    // Interaction & Animation
    this.time = 0;
    this.isDragging = false;
    this.dragTarget = null;      // 'sun' or null
    this.royalJellyPulse = 0;
    this.honeyHarvestedTotal = 0;

    // Performance & Spatial optimization
    this.hiveEntrance = { x: 0, y: 0 };

    this.initSimulation();
    this.initControls();
  }

  /* -------------------------------------------------------------------------
   * INITIALIZATION
   * ---------------------------------------------------------------------- */
  initSimulation() {
    this.time = 0;
    this.cells = [];
    this.bees = [];
    this.flowers = [];
    this.pollenParticles = [];
    this.sonicRipples = [];

    const splitX = Math.floor(this.width * this.splitRatio);
    this.hiveEntrance = {
      x: splitX,
      y: Math.floor(this.height * 0.58)
    };

    this.buildHoneycomb(splitX);
    this.seedMeadow(splitX);
    this.seedBees();
  }

  buildHoneycomb(splitX) {
    const hexRadius = Math.max(14, Math.min(22, Math.floor(this.height / 28)));
    const dx = Math.sqrt(3) * hexRadius;
    const dy = 1.5 * hexRadius;

    const marginX = 24;
    const marginY = 32;
    const availableWidth = splitX - marginX * 2;
    const availableHeight = this.height - marginY * 2;

    const cols = Math.floor(availableWidth / dx);
    const rows = Math.floor(availableHeight / dy);

    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = marginX + c * dx + (r % 2 === 1 ? dx * 0.5 : 0) + hexRadius;
        const y = marginY + r * dy + hexRadius;

        // Determine cell functional zone
        const distFromCenter = Math.hypot(c - centerCol, (r - centerRow) * 1.1);
        const relY = r / rows;

        let type = 'empty';
        let honey = 0;
        let pollen = 0;
        let broodStage = 0;
        let waxLevel = 1.0;

        if (relY > 0.65 && Math.abs(c - centerCol) < 3) {
          // Dance floor near bottom-center hive entrance
          type = 'dance_floor';
          waxLevel = 1.0;
        } else if (distFromCenter < 2.8) {
          // Central warm brood nest
          type = 'brood';
          broodStage = Math.random(); // 0: egg, 0.4: larva, 0.8: capped pupa
          waxLevel = 1.0;
        } else if (distFromCenter < 4.2) {
          // Pollen halo surrounding brood
          type = 'pollen';
          pollen = 0.4 + Math.random() * 0.5;
          waxLevel = 1.0;
        } else {
          // Peripheral honey storage & wax building
          if (relY < 0.45 || distFromCenter > 4.5) {
            type = 'honey';
            honey = 0.3 + Math.random() * 0.65;
            waxLevel = 1.0;
          } else {
            type = 'empty';
            waxLevel = Math.random() > 0.2 ? 1.0 : 0.4;
          }
        }

        this.cells.push({
          id: this.cells.length,
          col: c,
          row: r,
          x,
          y,
          radius: hexRadius,
          type,
          waxLevel,
          honey,
          pollen,
          broodStage,
          temp: 35.0,
          heaterActive: false,
          gleamPhase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  seedMeadow(splitX) {
    const meadowWidth = this.width - splitX;
    const plantTypes = ['lavender', 'thyme', 'poppy'];

    // Plant 9 Mediterranean floral patches
    const patchCount = 8;
    for (let i = 0; i < patchCount; i++) {
      const type = plantTypes[i % plantTypes.length];
      const px = splitX + 70 + Math.random() * (meadowWidth - 140);
      const py = 120 + Math.random() * (this.height - 180);

      this.plantFlower(type, px, py);
    }
  }

  plantFlower(type, x, y) {
    const colors = {
      lavender: { primary: '#8a2be2', secondary: '#9b59b6', stem: '#27ae60' },
      thyme: { primary: '#fd79a8', secondary: '#e056fd', stem: '#2ecc71' },
      poppy: { primary: '#eb2f06', secondary: '#c0392b', stem: '#16a085' }
    };

    const c = colors[type] || colors.lavender;
    this.flowers.push({
      id: this.flowers.length,
      type,
      x,
      y,
      color: c.primary,
      secondaryColor: c.secondary,
      stemColor: c.stem,
      radius: type === 'poppy' ? 14 : (type === 'lavender' ? 16 : 12),
      nectar: 0.8 + Math.random() * 0.2,
      maxNectar: 1.0,
      pollen: 0.9 + Math.random() * 0.1,
      maxPollen: 1.0,
      swayPhase: Math.random() * Math.PI * 2,
      visitedTimer: 0
    });
  }

  seedBees() {
    this.bees = [];

    // Hive workers (nurses, heaters, wax builders)
    const workerCount = 35;
    for (let i = 0; i < workerCount; i++) {
      const cell = this.cells[Math.floor(Math.random() * this.cells.length)];
      this.bees.push(this.createBee('worker', cell ? cell.x : 100, cell ? cell.y : 100, 'hive'));
    }

    // Heaters (vibrate thoracic muscles)
    for (let i = 0; i < 10; i++) {
      const broodCells = this.cells.filter(c => c.type === 'brood');
      const target = broodCells.length ? broodCells[i % broodCells.length] : this.cells[0];
      this.bees.push(this.createBee('heater', target.x, target.y, 'hive'));
    }

    // Fan bees (entrance cooling ventilation)
    for (let i = 0; i < 6; i++) {
      this.bees.push(this.createBee('fan', this.hiveEntrance.x - 15 - Math.random() * 25, this.hiveEntrance.y + (Math.random() - 0.5) * 60, 'hive'));
    }

    // Foragers & Scouts (flying between meadow and hive)
    const foragerCount = 35;
    for (let i = 0; i < foragerCount; i++) {
      const inMeadow = Math.random() > 0.4;
      if (inMeadow) {
        const splitX = Math.floor(this.width * this.splitRatio);
        const bx = splitX + 50 + Math.random() * (this.width - splitX - 80);
        const by = 80 + Math.random() * (this.height - 140);
        this.bees.push(this.createBee('forager', bx, by, 'meadow'));
      } else {
        const dfCells = this.cells.filter(c => c.type === 'dance_floor');
        const target = dfCells.length ? dfCells[Math.floor(Math.random() * dfCells.length)] : this.cells[0];
        this.bees.push(this.createBee('forager', target.x, target.y, 'hive'));
      }
    }

    // Dedicated Karl von Frisch scout bees
    for (let i = 0; i < 6; i++) {
      const dfCells = this.cells.filter(c => c.type === 'dance_floor');
      const target = dfCells.length ? dfCells[i % dfCells.length] : this.cells[0];
      const scout = this.createBee('scout', target.x, target.y, 'hive');
      this.bees.push(scout);
    }
  }

  createBee(role, x, y, location) {
    return {
      id: Math.random(),
      role,               // 'scout', 'forager', 'worker', 'heater', 'fan'
      location,           // 'hive' or 'meadow'
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      heading: Math.random() * Math.PI * 2,
      targetHeading: 0,
      speed: this.flightSpeed,
      state: 'idle',      // 'idle', 'dancing', 'flying_to_flower', 'foraging', 'returning', 'unloading'
      nectarLoad: 0,
      pollenLoad: 0,
      wingPhase: Math.random() * Math.PI * 2,
      vibrationPhase: 0,
      danceTimer: 0,
      danceData: null,    // { angleRelSun, distance, flowerId, cycleDuration }
      danceLoopSide: 1,   // 1 = right, -1 = left
      targetFlower: null,
      danceWatchTimer: 0,
      targetCell: null,
      recruited: false
    };
  }

  /* -------------------------------------------------------------------------
   * DOM CONTROLS
   * ---------------------------------------------------------------------- */
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Forager Flight Speed: <span id="apis-speed-val">${this.flightSpeed} px/s</span></label>
        <input type="range" id="apis-speed-slider" min="60" max="280" step="10" value="${this.flightSpeed}">
      </div>

      <div class="control-group">
        <label>Floral Bloom Density: <span id="apis-bloom-val">${this.bloomDensity.toFixed(1)}x</span></label>
        <input type="range" id="apis-bloom-slider" min="0.2" max="2.5" step="0.1" value="${this.bloomDensity}">
      </div>

      <div class="control-group">
        <label>Waggle Dance Accuracy: <span id="apis-acc-val">${Math.round(this.waggleAccuracy * 100)}%</span></label>
        <input type="range" id="apis-accuracy-slider" min="0.30" max="1.00" step="0.05" value="${this.waggleAccuracy}">
      </div>

      <div class="control-btn-grid" style="margin-top: 6px;">
        <button id="apis-plant-btn" class="sub-btn" style="border-color: #8a2be2; color: #e0b0ff;">
          🌸 Plant Lavender Field
        </button>
        <button id="apis-harvest-btn" class="sub-btn" style="border-color: #d4af37; color: #f9e79f;">
          🍯 Harvest Honeycomb
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="apis-sun-btn" class="sub-btn" style="border-color: #f39c12; color: #f5b041; font-weight: bold; width: 100%; padding: 8px;">
          ☀️ Sun Position Scrub (+35°)
        </button>
      </div>

      <div class="control-group" style="margin-top: 8px; font-size: 0.75rem; color: #8c909e; font-family: monospace;">
        <div>Hive Brood Temp: <strong id="apis-temp-readout" style="color: #2ecc71;">35.0°C</strong></div>
        <div>Honey Stored: <strong id="apis-honey-readout" style="color: #d4af37;">0 mg</strong></div>
        <div>Waggle Communicated: <strong id="apis-angle-readout" style="color: #64b5f6;">--</strong></div>
      </div>
    `;

    // Speed Slider
    const speedSlider = this.controlsContainer.querySelector('#apis-speed-slider');
    const speedVal = this.controlsContainer.querySelector('#apis-speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.flightSpeed = parseFloat(e.target.value);
        if (speedVal) speedVal.textContent = `${this.flightSpeed} px/s`;
      });
    }

    // Bloom Slider
    const bloomSlider = this.controlsContainer.querySelector('#apis-bloom-slider');
    const bloomVal = this.controlsContainer.querySelector('#apis-bloom-val');
    if (bloomSlider) {
      bloomSlider.addEventListener('input', (e) => {
        this.bloomDensity = parseFloat(e.target.value);
        if (bloomVal) bloomVal.textContent = `${this.bloomDensity.toFixed(1)}x`;
      });
    }

    // Accuracy Slider
    const accSlider = this.controlsContainer.querySelector('#apis-accuracy-slider');
    const accVal = this.controlsContainer.querySelector('#apis-acc-val');
    if (accSlider) {
      accSlider.addEventListener('input', (e) => {
        this.waggleAccuracy = parseFloat(e.target.value);
        if (accVal) accVal.textContent = `${Math.round(this.waggleAccuracy * 100)}%`;
      });
    }

    // Button: Plant Lavender Field
    const plantBtn = this.controlsContainer.querySelector('#apis-plant-btn');
    if (plantBtn) {
      plantBtn.addEventListener('click', () => {
        this.plantLavenderField();
      });
    }

    // Button: Harvest Honeycomb
    const harvestBtn = this.controlsContainer.querySelector('#apis-harvest-btn');
    if (harvestBtn) {
      harvestBtn.addEventListener('click', () => {
        this.harvestHoneycomb();
      });
    }

    // Button: Sun Position Scrub
    const sunBtn = this.controlsContainer.querySelector('#apis-sun-btn');
    if (sunBtn) {
      sunBtn.addEventListener('click', () => {
        this.scrubSunPosition();
      });
    }
  }

  plantLavenderField() {
    const splitX = Math.floor(this.width * this.splitRatio);
    const meadowWidth = this.width - splitX;
    const cx = splitX + 80 + Math.random() * (meadowWidth - 160);
    const cy = 120 + Math.random() * (this.height - 200);

    for (let i = 0; i < 6; i++) {
      const ox = cx + (Math.random() - 0.5) * 60;
      const oy = cy + (Math.random() - 0.5) * 50;
      this.plantFlower('lavender', ox, oy);
    }

    // Spawn pollen burst
    for (let i = 0; i < 20; i++) {
      this.pollenParticles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40 - 20,
        color: '#9b59b6',
        life: 1.5,
        maxLife: 1.5,
        size: 2.5
      });
    }
  }

  harvestHoneycomb() {
    let harvested = 0;
    for (const c of this.cells) {
      if (c.type === 'honey' && c.honey > 0.2) {
        harvested += c.honey;
        c.honey = 0.05;

        // Particle splash
        for (let k = 0; k < 3; k++) {
          this.pollenParticles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            color: '#d4af37',
            life: 1.0,
            maxLife: 1.0,
            size: 3
          });
        }
      }
    }
    this.honeyHarvestedTotal += Math.round(harvested * 25);
  }

  scrubSunPosition() {
    this.sunAngle = (this.sunAngle + (35 * Math.PI / 180));
    // Keep in normalized range
    if (this.sunAngle > Math.PI * 2) this.sunAngle -= Math.PI * 2;
  }

  /* -------------------------------------------------------------------------
   * SIMULATION TICK (UPDATE)
   * ---------------------------------------------------------------------- */
  update(dt) {
    this.time += dt;
    const splitX = Math.floor(this.width * this.splitRatio);
    this.hiveEntrance.x = splitX;
    this.hiveEntrance.y = Math.floor(this.height * 0.58);

    // 1. Floral Replenishment & Meadow dynamics
    for (const f of this.flowers) {
      f.swayPhase += dt * 2;
      f.visitedTimer = Math.max(0, f.visitedTimer - dt);
      if (f.nectar < f.maxNectar) {
        f.nectar = Math.min(f.maxNectar, f.nectar + dt * 0.04 * this.bloomDensity);
      }
      if (f.pollen < f.maxPollen) {
        f.pollen = Math.min(f.maxPollen, f.pollen + dt * 0.05 * this.bloomDensity);
      }

      // Random gentle airborne pollen release
      if (Math.random() < 0.03 * this.bloomDensity && this.pollenParticles.length < 250) {
        this.pollenParticles.push({
          x: f.x + (Math.random() - 0.5) * 12,
          y: f.y - 6 + (Math.random() - 0.5) * 6,
          vx: 10 + (Math.random() - 0.5) * 15,
          vy: -8 + Math.sin(this.time * 2 + f.id) * 10,
          color: f.type === 'poppy' ? '#eb2f06' : (f.type === 'lavender' ? '#a29bfe' : '#fd79a8'),
          life: 3.0,
          maxLife: 3.0,
          size: 1.8
        });
      }
    }

    // 2. Honeycomb Thermal & Wax Automata
    this.updateHiveAutomata(dt);

    // 3. Bees Agent-Based Logic & Waggle Dances
    this.updateBees(dt, splitX);

    // 4. Pollen and Sonic Ripples Update
    for (let i = this.pollenParticles.length - 1; i >= 0; i--) {
      const p = this.pollenParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.pollenParticles.splice(i, 1);
      }
    }

    for (let i = this.sonicRipples.length - 1; i >= 0; i--) {
      const r = this.sonicRipples[i];
      r.radius += dt * 45;
      r.opacity -= dt * 1.5;
      if (r.opacity <= 0) {
        this.sonicRipples.splice(i, 1);
      }
    }

    // 5. Update Telemetry UI
    if (this.controlsContainer && typeof document !== 'undefined') {
      const tempReadout = this.controlsContainer.querySelector('#apis-temp-readout');
      if (tempReadout) {
        tempReadout.textContent = `${this.hiveTemp.toFixed(1)}°C`;
        tempReadout.style.color = Math.abs(this.hiveTemp - 35.0) < 0.5 ? '#2ecc71' : (this.hiveTemp > 35.5 ? '#e74c3c' : '#3498db');
      }

      const honeyReadout = this.controlsContainer.querySelector('#apis-honey-readout');
      if (honeyReadout) {
        let totalH = this.honeyHarvestedTotal;
        for (const c of this.cells) {
          if (c.type === 'honey') totalH += Math.round(c.honey * 10);
        }
        honeyReadout.textContent = `${totalH} mg`;
      }

      const angleReadout = this.controlsContainer.querySelector('#apis-angle-readout');
      if (angleReadout) {
        const activeDancers = this.bees.filter(b => b.state === 'dancing');
        if (activeDancers.length > 0 && activeDancers[0].danceData) {
          const deg = Math.round((activeDancers[0].danceData.angleRelSun * 180 / Math.PI + 360) % 360);
          angleReadout.textContent = `${deg}° to Sun`;
        } else {
          angleReadout.textContent = 'None';
        }
      }
    }
  }

  updateHiveAutomata(dt) {
    let totalTemp = 0;
    let broodCount = 0;
    let heatersActive = 0;
    let fansActive = 0;

    // Count active thermoregulators
    for (const b of this.bees) {
      if (b.role === 'heater' && b.state === 'heating') heatersActive++;
      if (b.role === 'fan') fansActive++;
    }

    // Comb thermal diffusion
    for (const c of this.cells) {
      // Natural tendency towards ambient temperature
      const coolingRate = 0.08;
      c.temp += (this.ambientTemp - c.temp) * coolingRate * dt;

      // Heaters warming brood
      if (c.type === 'brood') {
        broodCount++;
        totalTemp += c.temp;

        if (c.heaterActive) {
          c.temp += 1.4 * dt; // Active thoracic muscle heat injection
        }

        // Brood development
        if (c.temp >= 34.0 && c.temp <= 36.0) {
          c.broodStage += dt * 0.015;
          if (c.broodStage >= 1.0) {
            // New worker bee emerges!
            c.broodStage = 0.1;
            if (this.bees.length < 130) {
              this.bees.push(this.createBee('forager', c.x, c.y, 'hive'));
            }
          }
        }
      }

      // Fan bees cooling effect when comb is overheated
      if (c.temp > 35.2 && fansActive > 0) {
        c.temp -= (fansActive * 0.12) * dt;
      }

      // Honey ripening (nectar -> honey)
      if (c.type === 'honey' && c.honey < 1.0) {
        c.honey = Math.min(1.0, c.honey + dt * 0.005);
      }
    }

    this.hiveTemp = broodCount > 0 ? totalTemp / broodCount : 35.0;
  }

  updateBees(dt, splitX) {
    const entrance = this.hiveEntrance;
    const sunVector = { x: Math.cos(this.sunAngle), y: Math.sin(this.sunAngle) };

    for (const b of this.bees) {
      b.wingPhase += dt * 45;

      // Role specific logic
      if (b.role === 'heater') {
        this.updateHeaterBee(b, dt);
      } else if (b.role === 'fan') {
        this.updateFanBee(b, dt, entrance);
      } else if (b.role === 'worker') {
        this.updateWorkerBee(b, dt);
      } else {
        // Foragers and Scouts
        this.updateForagerBee(b, dt, splitX, entrance, sunVector);
      }
    }
  }

  updateHeaterBee(b, dt) {
    // Seek brood cells below 35°C
    b.vibrationPhase += dt * 60;
    if (!b.targetCell || b.targetCell.type !== 'brood' || b.targetCell.temp >= 35.2) {
      const coolBrood = this.cells.filter(c => c.type === 'brood' && c.temp < 34.9);
      if (coolBrood.length > 0) {
        b.targetCell = coolBrood[Math.floor(Math.random() * coolBrood.length)];
      } else {
        b.targetCell = this.cells.find(c => c.type === 'brood') || this.cells[0];
      }
    }

    if (b.targetCell) {
      const dx = b.targetCell.x - b.x;
      const dy = b.targetCell.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        b.x += (dx / dist) * 35 * dt;
        b.y += (dy / dist) * 35 * dt;
        b.heading = Math.atan2(dy, dx);
        b.state = 'crawling';
        if (b.targetCell) b.targetCell.heaterActive = false;
      } else {
        // In position, press thorax and vibrate!
        b.state = 'heating';
        b.targetCell.heaterActive = true;
        // Jitter bee to simulate thoracic muscle shiver
        b.x = b.targetCell.x + (Math.random() - 0.5) * 1.5;
        b.y = b.targetCell.y + (Math.random() - 0.5) * 1.5;

        // Thermal convection particle
        if (Math.random() < 0.05 && this.pollenParticles.length < 250) {
          this.pollenParticles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 10,
            vy: -15 - Math.random() * 15,
            color: '#e67e22',
            life: 0.8,
            maxLife: 0.8,
            size: 2
          });
        }
      }
    }
  }

  updateFanBee(b, dt, entrance) {
    // Fan wings vigorously at hive entrance to circulate cool air
    const targetX = entrance.x - 20;
    const targetY = entrance.y + (Math.sin(b.id * 10) * 40);

    const dx = targetX - b.x;
    const dy = targetY - b.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 6) {
      b.x += (dx / dist) * 40 * dt;
      b.y += (dy / dist) * 40 * dt;
      b.heading = Math.atan2(dy, dx);
    } else {
      b.heading = Math.PI; // Face towards hive entrance, blowing air
      b.wingPhase += dt * 80; // High speed wing beats

      // Cooling breeze stream particles
      if (Math.random() < 0.08 && this.pollenParticles.length < 250) {
        this.pollenParticles.push({
          x: b.x,
          y: b.y,
          vx: -35 - Math.random() * 20,
          vy: (Math.random() - 0.5) * 12,
          color: '#81ecec',
          life: 0.7,
          maxLife: 0.7,
          size: 1.5
        });
      }
    }
  }

  updateWorkerBee(b, dt) {
    // Tends comb cells, cleans, unloads
    if (!b.targetCell || Math.random() < 0.02) {
      b.targetCell = this.cells[Math.floor(Math.random() * this.cells.length)];
    }

    if (b.targetCell) {
      const dx = b.targetCell.x - b.x;
      const dy = b.targetCell.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        b.x += (dx / dist) * 28 * dt;
        b.y += (dy / dist) * 28 * dt;
        b.heading = Math.atan2(dy, dx);
      }
    }
  }

  updateForagerBee(b, dt, splitX, entrance, sunVector) {
    // State machine for foragers & scouts
    switch (b.state) {
      case 'idle':
        // Inside hive, waiting or watching waggle dance on dance floor
        this.handleBeeIdle(b, dt, splitX);
        break;

      case 'dancing':
        // Scout performing the Karl von Frisch figure-8 waggle dance on vertical comb!
        this.handleBeeDancing(b, dt);
        break;

      case 'flying_to_flower':
        // Flying across the meadow towards targeted flower patch
        this.handleBeeOutboundFlight(b, dt, entrance);
        break;

      case 'foraging':
        // Hovering on flower, sipping nectar and collecting pollen
        this.handleBeeForaging(b, dt);
        break;

      case 'returning':
        // Laden flight back to hive entrance
        this.handleBeeInboundFlight(b, dt, entrance);
        break;

      case 'unloading':
        // Inside hive depositing harvest into honeycomb
        this.handleBeeUnloading(b, dt);
        break;

      default:
        b.state = 'idle';
        break;
    }
  }

  handleBeeIdle(b, dt, splitX) {
    // If scout and ready, launch into meadow to search for new blooms
    if (b.role === 'scout' && Math.random() < 0.03) {
      b.location = 'meadow';
      b.x = this.hiveEntrance.x + 10;
      b.y = this.hiveEntrance.y + (Math.random() - 0.5) * 20;
      b.state = 'flying_to_flower';
      // Pick random flower
      if (this.flowers.length > 0) {
        b.targetFlower = this.flowers[Math.floor(Math.random() * this.flowers.length)];
      }
      return;
    }

    // Foragers on dance floor look for active dancers to decode vector
    const dancers = this.bees.filter(other => other.state === 'dancing' && other.danceData);
    if (dancers.length > 0 && Math.random() < 0.05) {
      const chosenDancer = dancers[0];
      const dData = chosenDancer.danceData;

      // von Frisch decoding with accuracy error
      const noise = (1.0 - this.waggleAccuracy) * (Math.random() - 0.5) * 0.8;
      const decodedAngleRelSun = dData.angleRelSun + noise;
      const targetFlower = this.flowers.find(f => f.id === dData.flowerId) || this.flowers[0];

      b.recruited = true;
      b.danceData = {
        angleRelSun: decodedAngleRelSun,
        distance: dData.distance,
        flowerId: dData.flowerId
      };
      b.targetFlower = targetFlower;

      // Depart hive for meadow!
      b.location = 'meadow';
      b.x = this.hiveEntrance.x + 10;
      b.y = this.hiveEntrance.y + (Math.random() - 0.5) * 20;
      b.state = 'flying_to_flower';
      return;
    }

    // Wander gently on dance floor
    const dfCells = this.cells.filter(c => c.type === 'dance_floor');
    if (dfCells.length > 0 && (!b.targetCell || Math.random() < 0.03)) {
      b.targetCell = dfCells[Math.floor(Math.random() * dfCells.length)];
    }
    if (b.targetCell) {
      const dx = b.targetCell.x - b.x;
      const dy = b.targetCell.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        b.x += (dx / dist) * 25 * dt;
        b.y += (dy / dist) * 25 * dt;
        b.heading = Math.atan2(dy, dx);
      }
    }
  }

  handleBeeDancing(b, dt) {
    // Karl von Frisch Nobel Prize Waggle Dance:
    // Vertical comb: Gravity DOWN means UP (-PI/2) is the Sun.
    // Waggle run angle relative to gravity = angle between flower and sun in meadow!
    b.danceTimer += dt;
    const dData = b.danceData;
    if (!dData) {
      b.state = 'idle';
      return;
    }

    // Duration of waggle buzz communicates distance (e.g. 0.6s to 1.8s)
    const waggleRunDuration = Math.max(0.5, Math.min(1.8, 0.4 + (dData.distance / 400) * 1.0));
    const returnLoopDuration = 0.8;
    const cycleDuration = waggleRunDuration + returnLoopDuration;

    const cycleTime = b.danceTimer % cycleDuration;
    const danceOrigin = b.danceOrigin || { x: b.x, y: b.y };
    b.danceOrigin = danceOrigin;

    // Angle on vertical comb: UP (-PI/2) is the Sun, plus angleRelSun
    const waggleCombAngle = -Math.PI * 0.5 + dData.angleRelSun;

    if (cycleTime < waggleRunDuration) {
      // 1. WAGGLE RUN: Straight line along waggleCombAngle with high-frequency abdomen waggle
      const progress = cycleTime / waggleRunDuration;
      const runLength = 36;
      const forwardDist = (progress - 0.5) * runLength;

      // Transverse waggle oscillation
      const waggleFreq = 24; // 24 Hz abdomen waggle
      const waggleAmplitude = 3.5;
      const waggleOffset = Math.sin(cycleTime * waggleFreq * Math.PI * 2) * waggleAmplitude;

      const perpAngle = waggleCombAngle + Math.PI * 0.5;

      b.x = danceOrigin.x + Math.cos(waggleCombAngle) * forwardDist + Math.cos(perpAngle) * waggleOffset;
      b.y = danceOrigin.y + Math.sin(waggleCombAngle) * forwardDist + Math.sin(perpAngle) * waggleOffset;
      b.heading = waggleCombAngle;

      // Emit acoustic sonic ripple / waggle buzz pulses
      if (Math.random() < 0.25 && this.sonicRipples.length < 40) {
        this.sonicRipples.push({
          x: b.x,
          y: b.y,
          radius: 4,
          maxRadius: 28,
          opacity: 0.8,
          color: '#f1c40f'
        });
      }
    } else {
      // 2. RETURN LOOP: Semicircular arc back to start (alternates left and right loop to form figure-8)
      const returnProgress = (cycleTime - waggleRunDuration) / returnLoopDuration;
      const loopSide = b.danceLoopSide || 1; // 1 = right loop, -1 = left loop

      const loopRadius = 16;
      const arcAngle = Math.PI + returnProgress * Math.PI; // Semicircle
      const loopCenterComb = waggleCombAngle + (loopSide * Math.PI * 0.5);

      const cx = danceOrigin.x + Math.cos(loopCenterComb) * loopRadius;
      const cy = danceOrigin.y + Math.sin(loopCenterComb) * loopRadius;

      const currentArc = waggleCombAngle + loopSide * (Math.PI * (1 - returnProgress));
      b.x = cx + Math.cos(currentArc) * loopRadius;
      b.y = cy + Math.sin(currentArc) * loopRadius;
      b.heading = currentArc + (loopSide * Math.PI * 0.5);

      // When loop finishes, switch sides for figure-8!
      if (returnProgress >= 0.95 && !b.switchedSide) {
        b.danceLoopSide = -loopSide;
        b.switchedSide = true;
      } else if (returnProgress < 0.5) {
        b.switchedSide = false;
      }
    }

    // Dance finished after 4 cycles
    if (b.danceTimer > cycleDuration * 4.5) {
      b.state = 'idle';
      b.danceTimer = 0;
      b.danceData = null;
    }
  }

  handleBeeOutboundFlight(b, dt, entrance) {
    if (!b.targetFlower || b.targetFlower.nectar <= 0.05) {
      // Find best nearby flower with nectar/pollen
      if (this.flowers.length > 0) {
        b.targetFlower = this.flowers[Math.floor(Math.random() * this.flowers.length)];
      }
    }

    if (b.targetFlower) {
      const dx = b.targetFlower.x - b.x;
      const dy = b.targetFlower.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        // Boid steering towards flower with gentle organic wander
        const desiredHeading = Math.atan2(dy, dx);
        b.heading += (desiredHeading - b.heading) * 6 * dt;

        b.vx = Math.cos(b.heading) * this.flightSpeed;
        b.vy = Math.sin(b.heading) * this.flightSpeed;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Faint flight trail pollen particle
        if (Math.random() < 0.08 && this.pollenParticles.length < 250) {
          this.pollenParticles.push({
            x: b.x,
            y: b.y,
            vx: -b.vx * 0.1,
            vy: -b.vy * 0.1,
            color: 'rgba(212, 175, 55, 0.4)',
            life: 0.5,
            maxLife: 0.5,
            size: 1.2
          });
        }
      } else {
        // Arrived at flower!
        b.state = 'foraging';
        b.forageTimer = 0;
      }
    }
  }

  handleBeeForaging(b, dt) {
    b.forageTimer = (b.forageTimer || 0) + dt;
    const f = b.targetFlower;

    if (f) {
      b.x = f.x + Math.cos(this.time * 6 + b.id) * 3;
      b.y = f.y + Math.sin(this.time * 6 + b.id) * 3;
      f.visitedTimer = 0.5;

      // Harvest nectar and pollen
      if (f.nectar > 0.02) {
        const harvestedNectar = Math.min(f.nectar, dt * 0.35);
        f.nectar -= harvestedNectar;
        b.nectarLoad = Math.min(1.0, (b.nectarLoad || 0) + harvestedNectar * 2);
      }
      if (f.pollen > 0.02) {
        const harvestedPollen = Math.min(f.pollen, dt * 0.4);
        f.pollen -= harvestedPollen;
        b.pollenLoad = Math.min(1.0, (b.pollenLoad || 0) + harvestedPollen * 2.5);
      }

      // Foraging complete after ~1.5s
      if (b.forageTimer > 1.6) {
        b.state = 'returning';
        // Compute solar vector data for Karl von Frisch dance!
        const entrance = this.hiveEntrance;
        const dx = f.x - entrance.x;
        const dy = f.y - entrance.y;
        const flowerAngle = Math.atan2(dy, dx);
        const distance = Math.hypot(dx, dy);

        // Angle relative to sun:
        let angleRelSun = flowerAngle - this.sunAngle;
        while (angleRelSun > Math.PI) angleRelSun -= Math.PI * 2;
        while (angleRelSun < -Math.PI) angleRelSun += Math.PI * 2;

        b.danceData = {
          angleRelSun,
          distance,
          flowerId: f.id,
          flowerType: f.type
        };
      }
    } else {
      b.state = 'returning';
    }
  }

  handleBeeInboundFlight(b, dt, entrance) {
    const dx = entrance.x - b.x;
    const dy = entrance.y - b.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 12) {
      const desiredHeading = Math.atan2(dy, dx);
      b.heading += (desiredHeading - b.heading) * 6 * dt;

      b.vx = Math.cos(b.heading) * (this.flightSpeed * 0.95); // Slightly heavier when laden
      b.vy = Math.sin(b.heading) * (this.flightSpeed * 0.95);

      b.x += b.vx * dt;
      b.y += b.vy * dt;
    } else {
      // Enter hive through entrance
      b.location = 'hive';
      b.x = entrance.x - 12;
      b.y = entrance.y;

      // If scout or high payload, perform waggle dance!
      if (b.role === 'scout' || (b.nectarLoad > 0.4 && Math.random() < 0.65)) {
        b.state = 'dancing';
        b.danceTimer = 0;
        b.danceLoopSide = 1;
        const dfCells = this.cells.filter(c => c.type === 'dance_floor');
        const target = dfCells.length ? dfCells[Math.floor(Math.random() * dfCells.length)] : this.cells[0];
        b.x = target.x;
        b.y = target.y;
        b.danceOrigin = { x: target.x, y: target.y };
      } else {
        b.state = 'unloading';
      }
    }
  }

  handleBeeUnloading(b, dt) {
    // Find honey cell or pollen cell to unload payload
    if (!b.targetCell) {
      if (b.nectarLoad > 0.1) {
        const honeyCells = this.cells.filter(c => c.type === 'honey' && c.honey < 0.95);
        b.targetCell = honeyCells.length ? honeyCells[Math.floor(Math.random() * honeyCells.length)] : this.cells[0];
      } else {
        const pollenCells = this.cells.filter(c => c.type === 'pollen' && c.pollen < 0.95);
        b.targetCell = pollenCells.length ? pollenCells[Math.floor(Math.random() * pollenCells.length)] : this.cells[0];
      }
    }

    if (b.targetCell) {
      const dx = b.targetCell.x - b.x;
      const dy = b.targetCell.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        b.x += (dx / dist) * 35 * dt;
        b.y += (dy / dist) * 35 * dt;
        b.heading = Math.atan2(dy, dx);
      } else {
        // Unload!
        if (b.nectarLoad > 0) {
          if (b.targetCell.type === 'honey') {
            b.targetCell.honey = Math.min(1.0, b.targetCell.honey + b.nectarLoad * 0.4);
          }
          b.nectarLoad = 0;
        }
        if (b.pollenLoad > 0) {
          if (b.targetCell.type === 'pollen') {
            b.targetCell.pollen = Math.min(1.0, b.targetCell.pollen + b.pollenLoad * 0.4);
          }
          b.pollenLoad = 0;
        }
        b.state = 'idle';
        b.targetCell = null;
      }
    } else {
      b.state = 'idle';
    }
  }

  /* -------------------------------------------------------------------------
   * RENDERING (SPLIT SCREEN: COMB & MEADOW)
   * ---------------------------------------------------------------------- */
  render(ctx) {
    if (!ctx) return;
    const splitX = Math.floor(this.width * this.splitRatio);

    ctx.save();

    // 1. Render Left Pane: The Honeycomb Hive Comb
    this.renderHivePanel(ctx, splitX);

    // 2. Render Right Pane: The Mediterranean Flower Meadow
    this.renderMeadowPanel(ctx, splitX);

    // 3. Render Split Divider & Hive Entrance Tunnel
    this.renderDivider(ctx, splitX);

    // 4. Render Solar Vector & Dance Angle Educational Overlay
    this.renderVectorCompassOverlay(ctx, splitX);

    ctx.restore();
  }

  renderHivePanel(ctx, splitX) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, this.height);
    ctx.clip();

    // Dark woody interior of hive
    const bgGrad = ctx.createLinearGradient(0, 0, splitX, this.height);
    bgGrad.addColorStop(0, '#120d08');
    bgGrad.addColorStop(0.5, '#1e140d');
    bgGrad.addColorStop(1, '#0c0805');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, splitX, this.height);

    // Subtle wooden comb frame lines
    ctx.strokeStyle = 'rgba(78, 52, 34, 0.4)';
    ctx.lineWidth = 2;
    for (let y = 40; y < this.height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(splitX - 10, y);
      ctx.stroke();
    }

    // Render Hexagonal Honeycomb Cells
    for (const c of this.cells) {
      this.drawHexagonCell(ctx, c);
    }

    // Render Waggle Sonic Vibration Ripples
    for (const r of this.sonicRipples) {
      ctx.save();
      ctx.strokeStyle = `rgba(241, 196, 15, ${r.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render In-Hive Bees (workers, heaters, dancers, foragers)
    for (const b of this.bees) {
      if (b.location === 'hive') {
        this.drawBee(ctx, b, false);
      }
    }

    // Hive HUD Banner
    ctx.fillStyle = 'rgba(18, 13, 8, 0.85)';
    ctx.fillRect(10, 10, 240, 48);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 240, 48);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillText('ALVEARIUM (HIVE COMB)', 20, 28);

    ctx.fillStyle = '#f5b041';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`BROOD: ${this.hiveTemp.toFixed(1)}°C | HONEY: #${this.cells.filter(c => c.type === 'honey').length}`, 20, 46);

    ctx.restore();
  }

  drawHexagonCell(ctx, c) {
    const r = c.radius;
    const a = Math.PI / 3;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * a - Math.PI / 6;
      const hx = c.x + r * Math.cos(angle);
      const hy = c.y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();

    // Cell Fill based on biological content
    if (c.type === 'dance_floor') {
      ctx.fillStyle = '#221910';
      ctx.fill();
    } else if (c.type === 'brood') {
      // Warm brood nest
      const isWarm = c.temp >= 34.5 && c.temp <= 35.5;
      ctx.fillStyle = isWarm ? '#2b1b11' : '#1a100b';
      ctx.fill();

      // Draw brood larva / capped pupa
      if (c.broodStage > 0.1) {
        ctx.save();
        if (c.broodStage < 0.7) {
          // Curled white pearl larva
          ctx.fillStyle = '#ecf0f1';
          ctx.beginPath();
          const larvaR = r * 0.45 * Math.min(1.0, c.broodStage / 0.7);
          ctx.arc(c.x, c.y, larvaR, 0, Math.PI * 1.5);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#bdc3c7';
          ctx.stroke();
          ctx.fill();
        } else {
          // Capped golden-brown wax pupal dome
          ctx.fillStyle = '#8b5a2b';
          ctx.beginPath();
          ctx.arc(c.x, c.y, r * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a0522d';
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (c.type === 'pollen') {
      // Pollen pellets (bee bread)
      ctx.fillStyle = '#2d1f0f';
      ctx.fill();
      const fillR = r * 0.75 * Math.min(1.0, c.pollen);
      if (fillR > 2) {
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(c.x, c.y, fillR, 0, Math.PI * 2);
        ctx.fill();

        // Granular detail
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(c.x - 2, c.y - 2, fillR * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (c.type === 'honey') {
      // Golden honey (#d4af37)
      ctx.fillStyle = '#20160b';
      ctx.fill();
      const honeyR = r * 0.85 * Math.min(1.0, c.honey);
      if (honeyR > 2) {
        const honeyGrad = ctx.createRadialGradient(c.x - 2, c.y - 2, 1, c.x, c.y, honeyR);
        honeyGrad.addColorStop(0, '#f9e79f');
        honeyGrad.addColorStop(0.5, '#d4af37');
        honeyGrad.addColorStop(1, '#b7950b');
        ctx.fillStyle = honeyGrad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, honeyR, 0, Math.PI * 2);
        ctx.fill();

        // Amber liquid meniscus gleam
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(c.x - honeyR * 0.35, c.y - honeyR * 0.35, honeyR * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#181109';
      ctx.fill();
    }

    // Wax wall perimeter
    ctx.strokeStyle = c.waxLevel >= 1.0 ? '#d4af37' : 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = c.waxLevel >= 1.0 ? 1.4 : 0.8;
    ctx.stroke();
  }

  renderMeadowPanel(ctx, splitX) {
    const meadowWidth = this.width - splitX;

    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, meadowWidth, this.height);
    ctx.clip();

    // Mediterranean sky-to-meadow gradient
    const skyGrad = ctx.createLinearGradient(splitX, 0, splitX, this.height);
    skyGrad.addColorStop(0, '#74b9ff');    // Azure sky
    skyGrad.addColorStop(0.35, '#a1c4fd'); // Warm Mediterranean haze
    skyGrad.addColorStop(0.42, '#27ae60'); // Rolling olive hills
    skyGrad.addColorStop(1, '#1e3725');    // Lush flora soil
    ctx.fillStyle = skyGrad;
    ctx.fillRect(splitX, 0, meadowWidth, this.height);

    // Distant Apennine / Mediterranean mountain ridges
    ctx.fillStyle = 'rgba(46, 125, 50, 0.35)';
    ctx.beginPath();
    ctx.moveTo(splitX, this.height * 0.38);
    for (let x = splitX; x <= this.width; x += 30) {
      const hillY = this.height * 0.38 + Math.sin((x - splitX) * 0.015) * 25;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(splitX, this.height);
    ctx.closePath();
    ctx.fill();

    // 1. Render Mediterranean Flora (Lavender, Thyme, Poppy)
    for (const f of this.flowers) {
      this.drawFlower(ctx, f);
    }

    // 2. Render The Golden Sun & Solar Vector
    this.drawSun(ctx, splitX);

    // 3. Render Pollen Particles
    for (const p of this.pollenParticles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 4. Render Meadow Flying Bees
    for (const b of this.bees) {
      if (b.location === 'meadow') {
        this.drawBee(ctx, b, true);
      }
    }

    // Meadow HUD Banner
    ctx.fillStyle = 'rgba(10, 20, 15, 0.85)';
    ctx.fillRect(splitX + 16, 10, 250, 48);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1;
    ctx.strokeRect(splitX + 16, 10, 250, 48);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillText('PRATUM (FLORAL MEADOW)', splitX + 26, 28);

    ctx.fillStyle = '#a8e6cf';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`FLORA: ${this.flowers.length} PATCHES | FORAGERS: ${this.bees.filter(b => b.location === 'meadow').length}`, splitX + 26, 46);

    ctx.restore();
  }

  drawFlower(ctx, f) {
    ctx.save();
    const sway = Math.sin(f.swayPhase) * 4;

    // Stem
    ctx.strokeStyle = f.stemColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y + 22);
    ctx.quadraticCurveTo(f.x + sway * 0.5, f.y + 10, f.x + sway, f.y);
    ctx.stroke();

    // Flower blossom heads
    if (f.type === 'lavender') {
      // Slender tiered lavender spikes
      const spikeX = f.x + sway;
      const spikeY = f.y;
      for (let i = 0; i < 5; i++) {
        const py = spikeY - i * 5;
        ctx.fillStyle = i % 2 === 0 ? f.color : f.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(spikeX - 4, py, 3.5, 2.5, Math.PI * 0.2, 0, Math.PI * 2);
        ctx.ellipse(spikeX + 4, py, 3.5, 2.5, -Math.PI * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (f.type === 'poppy') {
      // Bold scarlet poppy petals
      const px = f.x + sway;
      const py = f.y;
      ctx.fillStyle = f.color;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(ang) * 7, py + Math.sin(ang) * 7, 7, 5, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      // Dark center
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Thyme miniature pink cluster
      const px = f.x + sway;
      const py = f.y;
      ctx.fillStyle = f.color;
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(px + Math.cos(ang) * 5, py + Math.sin(ang) * 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nectar & Pollen yield indicator halos
    if (f.nectar > 0.2) {
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(f.x + sway, f.y, f.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSun(ctx, splitX) {
    // Sun position calculated from solar angle relative to hive entrance
    const sunDist = Math.min(this.width - splitX - 100, this.height * 0.48);
    const sunX = splitX + 70 + Math.cos(this.sunAngle) * sunDist;
    const sunY = this.hiveEntrance.y + Math.sin(this.sunAngle) * sunDist;

    ctx.save();

    // Solar Corona Rays
    const coronaR = 24;
    const rayCount = 12;
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < rayCount; i++) {
      const ang = (i * Math.PI * 2) / rayCount + this.time * 0.4;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(ang) * (coronaR + 4), sunY + Math.sin(ang) * (coronaR + 4));
      ctx.lineTo(sunX + Math.cos(ang) * (coronaR + 14), sunY + Math.sin(ang) * (coronaR + 14));
      ctx.stroke();
    }

    // Sun Disk
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, coronaR);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#f9e79f');
    sunGrad.addColorStop(0.8, '#f39c12');
    sunGrad.addColorStop(1, 'rgba(230, 126, 34, 0.1)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, coronaR, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#d35400';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SOL (SUN)', sunX, sunY + 34);

    ctx.restore();
  }

  drawBee(ctx, b, isFlying) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.heading);

    const scale = isFlying ? 1.0 : 0.85;
    ctx.scale(scale, scale);

    // Translucent Flapping Wings
    const wingAngle = Math.sin(b.wingPhase) * 0.75;
    ctx.fillStyle = 'rgba(236, 240, 241, 0.65)';
    ctx.strokeStyle = 'rgba(189, 195, 199, 0.8)';
    ctx.lineWidth = 0.8;

    // Left Wing
    ctx.save();
    ctx.rotate(wingAngle - 0.4);
    ctx.beginPath();
    ctx.ellipse(0, -7, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.rotate(-wingAngle + 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 7, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Abdomen (Striped Golden/Black)
    const abdoGrad = ctx.createLinearGradient(-10, 0, 2, 0);
    abdoGrad.addColorStop(0, '#111');
    abdoGrad.addColorStop(0.35, '#d4af37');
    abdoGrad.addColorStop(0.6, '#111');
    abdoGrad.addColorStop(0.85, '#f39c12');
    abdoGrad.addColorStop(1, '#111');
    ctx.fillStyle = abdoGrad;
    ctx.beginPath();
    ctx.ellipse(-5, 0, 6.5, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thorax (Dark furry brown)
    ctx.fillStyle = b.role === 'heater' && b.state === 'heating' ? '#e74c3c' : '#3e2723';
    ctx.beginPath();
    ctx.ellipse(2, 0, 4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head & Eyes
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(7, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(8, -1);
    ctx.lineTo(11, -3);
    ctx.moveTo(8, 1);
    ctx.lineTo(11, 3);
    ctx.stroke();

    // Pollen Baskets (Corbiculae on hind legs)
    if (b.pollenLoad > 0.1) {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(-4, -4, 2.2, 0, Math.PI * 2);
      ctx.arc(-4, 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Role Indicator Aura (Scout vs Heater vs Dancer)
    if (b.state === 'dancing') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderDivider(ctx, splitX) {
    // Divider line between Hive and Meadow
    ctx.save();
    ctx.fillStyle = '#120d08';
    ctx.fillRect(splitX - 6, 0, 12, this.height);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX - 6, 0);
    ctx.lineTo(splitX - 6, this.height);
    ctx.moveTo(splitX + 6, 0);
    ctx.lineTo(splitX + 6, this.height);
    ctx.stroke();

    // Hive Entrance Landing Board
    const ey = this.hiveEntrance.y;
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(splitX - 18, ey - 30, 36, 60);

    ctx.fillStyle = '#0a0806';
    ctx.beginPath();
    ctx.ellipse(splitX, ey, 10, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#d4af37';
    ctx.font = '9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PORTA (ENTRANCE)', splitX, ey + 38);

    ctx.restore();
  }

  renderVectorCompassOverlay(ctx, splitX) {
    // Karl von Frisch Vector Communication HUD
    // Shows relationship between vertical dance run and solar vector!
    const activeDancers = this.bees.filter(b => b.state === 'dancing' && b.danceData);
    if (activeDancers.length === 0) return;

    const dancer = activeDancers[0];
    const dData = dancer.danceData;

    ctx.save();

    // 1. In Hive: Plumb Line (Gravity = UP = Sun)
    const hiveDialX = 80;
    const hiveDialY = this.height - 80;
    const dialR = 38;

    ctx.fillStyle = 'rgba(18, 13, 8, 0.9)';
    ctx.beginPath();
    ctx.arc(hiveDialX, hiveDialY, dialR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Plumb line (UP = Sun in dark vertical hive)
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.8)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hiveDialX, hiveDialY + dialR - 6);
    ctx.lineTo(hiveDialX, hiveDialY - dialR + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // UP Arrow (Sun)
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(hiveDialX, hiveDialY - dialR + 4);
    ctx.lineTo(hiveDialX - 4, hiveDialY - dialR + 12);
    ctx.lineTo(hiveDialX + 4, hiveDialY - dialR + 12);
    ctx.fill();

    // Waggle Comb Run Vector Arrow
    const waggleAng = -Math.PI * 0.5 + dData.angleRelSun;
    const wx = hiveDialX + Math.cos(waggleAng) * (dialR - 8);
    const wy = hiveDialY + Math.sin(waggleAng) * (dialR - 8);

    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hiveDialX, hiveDialY);
    ctx.lineTo(wx, wy);
    ctx.stroke();

    // Dial label
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VON FRISCH', hiveDialX, hiveDialY + dialR + 12);
    ctx.fillStyle = '#3498db';
    ctx.fillText('WAGGLE RUN', hiveDialX, hiveDialY + dialR + 22);

    // 2. In Meadow: Solar & Flower Vector Lines from Hive Entrance
    const ey = this.hiveEntrance.y;
    const targetFlower = this.flowers.find(f => f.id === dData.flowerId);

    if (targetFlower) {
      // Line towards Sun
      ctx.strokeStyle = 'rgba(243, 156, 18, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(splitX, ey);
      ctx.lineTo(splitX + Math.cos(this.sunAngle) * 90, ey + Math.sin(this.sunAngle) * 90);
      ctx.stroke();

      // Line towards Flower
      ctx.strokeStyle = '#3498db';
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, ey);
      ctx.lineTo(targetFlower.x, targetFlower.y);
      ctx.stroke();

      // Angle Arc
      const targetAngle = Math.atan2(targetFlower.y - ey, targetFlower.x - splitX);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(splitX, ey, 45, Math.min(this.sunAngle, targetAngle), Math.max(this.sunAngle, targetAngle));
      ctx.stroke();

      // Angle text
      const deg = Math.round(Math.abs(dData.angleRelSun * 180 / Math.PI));
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`α = ${deg}°`, splitX + 55, ey - 10);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * INTERACTION CONTRACT & LIFECYCLE
   * ---------------------------------------------------------------------- */
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    const splitX = Math.floor(this.width * this.splitRatio);
    this.hiveEntrance = {
      x: splitX,
      y: Math.floor(this.height * 0.58)
    };
  }

  reset() {
    this.honeyHarvestedTotal = 0;
    this.initSimulation();
  }

  destroy() {
    this.cells = [];
    this.bees = [];
    this.flowers = [];
    this.pollenParticles = [];
    this.sonicRipples = [];
  }

  getEntityCount() {
    // Integer count of active bees, honeycomb cells, and pollen particles
    return this.bees.length + this.cells.length + this.pollenParticles.length;
  }

  onMouseDown(pos) {
    if (!pos) return;
    const splitX = Math.floor(this.width * this.splitRatio);

    if (pos.x > splitX) {
      // Meadow interaction: plant flower at click position!
      const plantTypes = ['lavender', 'thyme', 'poppy'];
      const type = plantTypes[Math.floor(Math.random() * plantTypes.length)];
      this.plantFlower(type, pos.x, pos.y);

      // Scent particle burst
      for (let i = 0; i < 12; i++) {
        this.pollenParticles.push({
          x: pos.x,
          y: pos.y,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          color: type === 'poppy' ? '#eb2f06' : (type === 'lavender' ? '#9b59b6' : '#fd79a8'),
          life: 1.2,
          maxLife: 1.2,
          size: 2.5
        });
      }
    } else {
      // Hive interaction: Click cell to harvest or inspect
      const clickedCell = this.cells.find(c => Math.hypot(c.x - pos.x, c.y - pos.y) < c.radius);
      if (clickedCell) {
        if (clickedCell.type === 'honey') {
          clickedCell.honey = 0.05;
          this.honeyHarvestedTotal += 5;
        } else if (clickedCell.type === 'brood') {
          // Warm the brood cell
          clickedCell.temp = 35.5;
        }
      }
    }
  }

  onMouseMove(pos) {
    if (!pos) return;
    // Optional drag guidance
  }

  onMouseUp(pos) {
    this.isDragging = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      // Queen royal jelly / pheromone pulse
      for (const c of this.cells) {
        if (c.type === 'brood') c.temp = 35.0;
        if (c.type === 'empty') c.waxLevel = 1.0;
      }
      for (const b of this.bees) {
        if (b.role === 'scout') b.state = 'flying_to_flower';
      }
      // Honey burst
      for (let i = 0; i < 25; i++) {
        const c = this.cells[Math.floor(Math.random() * this.cells.length)];
        if (c) {
          this.pollenParticles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            color: '#d4af37',
            life: 1.2,
            maxLife: 1.2,
            size: 2.5
          });
        }
      }
    }
  }
}
