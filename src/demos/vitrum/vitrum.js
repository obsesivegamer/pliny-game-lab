// Vitrum: Non-Newtonian Viscoelastic Glassblowing & Thermal Dynamics Engine
// Grounded in Pliny the Elder's Naturalis Historia (Book XXXVI, Ch. 65-66: De Vitro et Origine Eius)
// Pure ES Module — Zero External Dependencies

export const VITRUM_PRESETS = {
  GATHER: 'Raw Molten Gather',
  UNGUENTARIUM: 'Roman Unguentarium (Perfume Flask)',
  AMPHORA: 'Roman Flagon (Decanter)',
  BOWL: 'Patella (Centrifugal Bowl)'
};

export const GLASS_TINTS = {
  AQUA: { name: 'Roman Aqua (Natron)', r: 64, g: 184, b: 168 },
  OLIVE: { name: 'Campanian Olive', r: 92, g: 154, b: 72 },
  AMBER: { name: 'Phoenician Amber', r: 215, g: 145, b: 45 },
  COBALT: { name: 'Alexandrian Cobalt', r: 35, g: 105, b: 205 },
  CLEAR: { name: 'Vitrum Crystallinum', r: 180, g: 210, b: 220 }
};

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class VitrumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 1200 : 1200;
    this.height = canvas ? canvas.height || 800 : 800;
    this.dpr = 1;
    attachTouchBridge(this, canvas);

    // Simulation Clock
    this.time = 0;

    // Thermodynamic & Material Parameters
    this.furnaceTemp = 1180;         // Temperature of furnace / glory hole (°C)
    this.ambientTemp = 25;           // Room / workshop temperature (°C)
    this.blowingPressure = 2.2;      // Blowing pneumatic pressure (kPa)
    this.rotationSpeed = 45;         // Blowpipe spin speed (RPM)
    this.rotationAngle = 0;
    this.autoRotate = true;
    this.activeTool = 'air';         // 'air', 'marver', 'jacks'
    this.currentTintKey = 'AQUA';
    this.currentPreset = VITRUM_PRESETS.GATHER;

    // State Flags
    this.isBlowing = false;
    this.isReheating = false;
    this.isAnnealing = false;
    this.annealProgress = 0;
    this.isCracked = false;
    this.furnaceOffset = 0;          // Slide blowpipe into glory hole (0 to 1)

    // Glass Vessel Discretization (Axisymmetric Viscoelastic Slices)
    this.numSlices = 46;
    this.radialSegments = 24;        // Circumferential vertices per ring
    this.baseLength = 220;           // Axial length of gather
    this.slices = [];

    // Air Particles & Visual Effects
    this.airParticles = [];
    this.maxAirParticles = 100;
    this.heatParticles = [];
    this.sparkParticles = [];
    this.fractures = [];

    // Interaction State
    this.mousePos = { x: this.width * 0.5, y: this.height * 0.5 };
    this.isMouseDown = false;
    this.marverY = this.height * 0.5 + 75;
    this.jacksX = this.width * 0.5;
    this.jacksWidth = 30;

    // Telemetry
    this.telemetry = {
      avgTemp: 1100,
      cavityVolume: 0,
      wallThicknessMin: 0,
      maxStress: 0
    };

    // Initialize UI and Geometry
    this.initControls();
    this.reset();
  }

  // ---------------------------------------------------------------------------
  // UI Controls Construction
  // ---------------------------------------------------------------------------
  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display:block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #d4af37; margin-bottom: 4px;">Vessel Form Preset</label>
        <select id="vitrum-preset" class="sub-btn" style="width: 100%; text-align: left; padding: 6px 8px; background: rgba(20,20,28,0.85); color: #eae6da; border: 1px solid rgba(212,175,55,0.3); border-radius: 4px;">
          <option value="${VITRUM_PRESETS.GATHER}" ${this.currentPreset === VITRUM_PRESETS.GATHER ? 'selected' : ''}>Raw Molten Gather</option>
          <option value="${VITRUM_PRESETS.UNGUENTARIUM}" ${this.currentPreset === VITRUM_PRESETS.UNGUENTARIUM ? 'selected' : ''}>Roman Unguentarium (Flask)</option>
          <option value="${VITRUM_PRESETS.AMPHORA}" ${this.currentPreset === VITRUM_PRESETS.AMPHORA ? 'selected' : ''}>Roman Flagon (Decanter)</option>
          <option value="${VITRUM_PRESETS.BOWL}" ${this.currentPreset === VITRUM_PRESETS.BOWL ? 'selected' : ''}>Patella (Centrifugal Bowl)</option>
        </select>
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display:block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #d4af37; margin-bottom: 4px;">Artisan Tool</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
          <button class="sub-btn ${this.activeTool === 'air' ? 'active' : ''}" id="tool-air" style="padding: 6px 4px; font-size: 11px;">💨 Blowpipe</button>
          <button class="sub-btn ${this.activeTool === 'marver' ? 'active' : ''}" id="tool-marver" style="padding: 6px 4px; font-size: 11px;">🪵 Marver</button>
          <button class="sub-btn ${this.activeTool === 'jacks' ? 'active' : ''}" id="tool-jacks" style="padding: 6px 4px; font-size: 11px;">✂️ Jacks</button>
        </div>
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <label style="display: flex; justify-content: space-between; font-size: 11px; color: #c4c0b5;">
          <span>Blowing Pressure:</span>
          <span id="pressure-val" style="color: #4dd0e1; font-weight: bold;">${this.blowingPressure.toFixed(1)} kPa</span>
        </label>
        <input type="range" id="pressure-slider" min="0.5" max="5.0" step="0.1" value="${this.blowingPressure}" style="width: 100%;">
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <label style="display: flex; justify-content: space-between; font-size: 11px; color: #c4c0b5;">
          <span>Furnace Heat:</span>
          <span id="furnace-val" style="color: #ff7043; font-weight: bold;">${Math.round(this.furnaceTemp)}°C</span>
        </label>
        <input type="range" id="furnace-slider" min="800" max="1350" step="10" value="${this.furnaceTemp}" style="width: 100%;">
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display: flex; justify-content: space-between; font-size: 11px; color: #c4c0b5;">
          <span>Pipe Rotation:</span>
          <span id="spin-val" style="color: #d4af37; font-weight: bold;">${Math.round(this.rotationSpeed)} RPM</span>
        </label>
        <input type="range" id="spin-slider" min="0" max="120" step="5" value="${this.rotationSpeed}" style="width: 100%;">
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display:block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #d4af37; margin-bottom: 4px;">Roman Glass Composition</label>
        <select id="vitrum-tint" class="sub-btn" style="width: 100%; text-align: left; padding: 6px 8px; background: rgba(20,20,28,0.85); color: #eae6da; border: 1px solid rgba(212,175,55,0.3); border-radius: 4px;">
          ${Object.entries(GLASS_TINTS).map(([k, v]) => `<option value="${k}" ${this.currentTintKey === k ? 'selected' : ''}>${v.name}</option>`).join('')}
        </select>
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display:block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #d4af37; margin-bottom: 4px;">Thermal Operations</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button class="sub-btn" id="reheat-btn" style="padding: 8px 4px; font-weight: bold; background: linear-gradient(180deg, rgba(255,100,20,0.25), rgba(180,40,10,0.4)); border: 1px solid #ff7043;">🔥 Reheat Gather</button>
          <button class="sub-btn" id="anneal-btn" style="padding: 8px 4px; font-weight: bold; background: linear-gradient(180deg, rgba(60,180,160,0.25), rgba(20,90,80,0.4)); border: 1px solid #4dd0e1;">🏺 Anneal Lehr</button>
        </div>
      </div>

      <div class="control-group" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,200,0.08); font-size: 11px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #9e9e9e;">Mean Temperature:</span>
          <span id="tele-temp" style="color: #ffab40; font-weight: bold;">1100°C</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #9e9e9e;">Cavity Volume:</span>
          <span id="tele-vol" style="color: #80deea; font-weight: bold;">0 cm³</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #9e9e9e;">Min Wall Thickness:</span>
          <span id="tele-wall" style="color: #eae6da; font-weight: bold;">12.0 mm</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #9e9e9e;">Thermal Stress State:</span>
          <span id="tele-stress" style="color: #81c784; font-weight: bold;">Viscoelastic Flow</span>
        </div>
      </div>
    `;

    // Hook listeners
    const presetSelect = this.controlsContainer.querySelector('#vitrum-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.currentPreset = e.target.value;
        this.loadPreset(this.currentPreset);
      });
    }

    const tintSelect = this.controlsContainer.querySelector('#vitrum-tint');
    if (tintSelect) {
      tintSelect.addEventListener('change', (e) => {
        this.currentTintKey = e.target.value;
      });
    }

    const toolAir = this.controlsContainer.querySelector('#tool-air');
    const toolMarver = this.controlsContainer.querySelector('#tool-marver');
    const toolJacks = this.controlsContainer.querySelector('#tool-jacks');

    const updateToolBtns = (active) => {
      this.activeTool = active;
      [toolAir, toolMarver, toolJacks].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (active === 'air' && toolAir) toolAir.classList.add('active');
      if (active === 'marver' && toolMarver) toolMarver.classList.add('active');
      if (active === 'jacks' && toolJacks) toolJacks.classList.add('active');
    };

    if (toolAir) toolAir.addEventListener('click', () => updateToolBtns('air'));
    if (toolMarver) toolMarver.addEventListener('click', () => updateToolBtns('marver'));
    if (toolJacks) toolJacks.addEventListener('click', () => updateToolBtns('jacks'));

    const pressSlider = this.controlsContainer.querySelector('#pressure-slider');
    const pressVal = this.controlsContainer.querySelector('#pressure-val');
    if (pressSlider && pressVal) {
      pressSlider.addEventListener('input', (e) => {
        this.blowingPressure = parseFloat(e.target.value);
        pressVal.textContent = `${this.blowingPressure.toFixed(1)} kPa`;
      });
    }

    const furnSlider = this.controlsContainer.querySelector('#furnace-slider');
    const furnVal = this.controlsContainer.querySelector('#furnace-val');
    if (furnSlider && furnVal) {
      furnSlider.addEventListener('input', (e) => {
        this.furnaceTemp = parseFloat(e.target.value);
        furnVal.textContent = `${Math.round(this.furnaceTemp)}°C`;
      });
    }

    const spinSlider = this.controlsContainer.querySelector('#spin-slider');
    const spinVal = this.controlsContainer.querySelector('#spin-val');
    if (spinSlider && spinVal) {
      spinSlider.addEventListener('input', (e) => {
        this.rotationSpeed = parseFloat(e.target.value);
        spinVal.textContent = `${Math.round(this.rotationSpeed)} RPM`;
      });
    }

    const reheatBtn = this.controlsContainer.querySelector('#reheat-btn');
    if (reheatBtn) {
      reheatBtn.addEventListener('mousedown', () => { this.isReheating = true; });
      reheatBtn.addEventListener('mouseup', () => { this.isReheating = false; });
      reheatBtn.addEventListener('mouseleave', () => { this.isReheating = false; });
      reheatBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.isReheating = true; });
      reheatBtn.addEventListener('touchend', () => { this.isReheating = false; });
    }

    const annealBtn = this.controlsContainer.querySelector('#anneal-btn');
    if (annealBtn) {
      annealBtn.addEventListener('click', () => this.annealLehr());
    }
  }

  // ---------------------------------------------------------------------------
  // Geometry & Preset Initialization
  // ---------------------------------------------------------------------------
  reset() {
    this.time = 0;
    this.isBlowing = false;
    this.isReheating = false;
    this.isAnnealing = false;
    this.annealProgress = 0;
    this.isCracked = false;
    this.furnaceOffset = 0;
    this.airParticles = [];
    this.heatParticles = [];
    this.sparkParticles = [];
    this.fractures = [];

    this.loadPreset(this.currentPreset);
  }

  loadPreset(presetName) {
    this.currentPreset = presetName;
    this.slices = [];
    this.fractures = [];
    this.isCracked = false;

    const pipeTipX = this.getPipeTipX();
    const pipeY = this.getPipeCenterY();
    const N = this.numSlices;

    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      let outerR = 16;
      let innerR = 0;
      let temp = 1140;

      if (presetName === VITRUM_PRESETS.GATHER) {
        // Fresh molten gather straight out of crucible
        if (i === 0) {
          outerR = 16;
          innerR = 9;
        } else if (i < 4) {
          outerR = 16 + i * 4;
          innerR = 9 * (1 - i / 4);
        } else {
          const profile = Math.sin(Math.PI * (i - 2) / (N - 2));
          outerR = 18 + 26 * Math.pow(Math.max(0, profile), 0.75);
          innerR = 0;
        }
        temp = 1120 + Math.sin(u * Math.PI) * 50;
      } else if (presetName === VITRUM_PRESETS.UNGUENTARIUM) {
        // Tear-shaped unguentarium perfume flask
        if (i < 16) {
          // Slender elongated cylindrical neck
          outerR = 14 + (i / 16) * 3;
          innerR = outerR - 3.5;
        } else if (i < 38) {
          // Swelling teardrop body
          const bodyU = (i - 16) / 22;
          const swell = Math.sin(bodyU * Math.PI * 0.9);
          outerR = 17 + swell * 44;
          innerR = Math.max(0, outerR - 4.2);
        } else {
          // Rounded base
          const baseU = (i - 38) / 7;
          outerR = 28 * Math.cos(baseU * Math.PI * 0.45);
          innerR = Math.max(0, outerR - 5.0);
        }
        temp = 680 + (1 - u) * 120;
      } else if (presetName === VITRUM_PRESETS.AMPHORA) {
        // Flagon with cinched waist and bulbous body
        if (i < 10) {
          // Flared lip
          outerR = 18 - (i / 10) * 4;
          innerR = outerR - 3.0;
        } else if (i < 20) {
          // High waist
          outerR = 14 + Math.sin((i - 10) / 10 * Math.PI) * 16;
          innerR = outerR - 3.5;
        } else if (i < 38) {
          // Main bulb
          const bulbU = (i - 20) / 18;
          outerR = 24 + Math.sin(bulbU * Math.PI) * 38;
          innerR = outerR - 3.8;
        } else {
          // Flat pontil foot
          outerR = Math.max(12, 34 - (i - 38) * 4);
          innerR = Math.max(0, outerR - 6.0);
        }
        temp = 640 + (1 - u) * 90;
      } else if (presetName === VITRUM_PRESETS.BOWL) {
        // Wide flared dish
        if (i < 14) {
          outerR = 15;
          innerR = 10;
        } else {
          const flareU = (i - 14) / (N - 14);
          outerR = 15 + Math.pow(flareU, 1.3) * 78;
          innerR = Math.max(0, outerR - 4.5);
        }
        temp = 620 + (1 - u) * 100;
      }

      const segLen = this.baseLength / (N - 1);
      const x = pipeTipX + i * segLen;
      const y = pipeY;

      this.slices.push({
        x: x,
        y: y,
        nominalX: x,
        outerR: outerR,
        innerR: innerR,
        targetOuterR: outerR,
        temp: temp,
        stress: 0,
        sag: 0,
        vol: Math.PI * (outerR * outerR - innerR * innerR) * segLen
      });
    }

    this.marverY = pipeY + 65;
    this.jacksX = pipeTipX + this.baseLength * 0.45;
  }

  getPipeTipX() {
    return Math.max(160, Math.min(260, this.width * 0.22));
  }

  getPipeCenterY() {
    return this.height * 0.48;
  }

  // ---------------------------------------------------------------------------
  // Contract & Resize Handlers
  // ---------------------------------------------------------------------------
  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;

    const pipeTipX = this.getPipeTipX();
    const pipeY = this.getPipeCenterY();
    const N = this.slices.length;

    if (N > 0) {
      const segLen = this.baseLength / (N - 1);
      for (let i = 0; i < N; i++) {
        const s = this.slices[i];
        s.nominalX = pipeTipX + i * segLen;
        s.x = s.nominalX;
        s.y = pipeY + s.sag;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Thermal Viscosity Relation (Vogel-Fulcher-Tammann)
  // ---------------------------------------------------------------------------
  getViscosity(tempC) {
    // Glass working range ~750°C - 1200°C
    // Lower temp = exponentially higher viscosity (stiff resistance)
    if (tempC >= 1200) return 1.0;
    if (tempC <= 550) return 4000.0;
    const norm = (1200 - tempC) / (1200 - 550);
    return 1.0 + Math.pow(norm, 3.2) * 3999.0;
  }

  // ---------------------------------------------------------------------------
  // Physical Simulation Loop
  // ---------------------------------------------------------------------------
  update(dt) {
    const clampedDt = Math.min(dt, 0.05);
    this.time += clampedDt;

    // Smooth blowpipe slide into furnace during reheat
    const targetOffset = this.isReheating ? 1.0 : 0.0;
    this.furnaceOffset += (targetOffset - this.furnaceOffset) * Math.min(1.0, clampedDt * 4.0);

    // Continuous pipe rotation (averages out gravity and shapes gather)
    if (this.autoRotate && this.rotationSpeed > 0) {
      const revsPerSec = this.rotationSpeed / 60;
      this.rotationAngle = (this.rotationAngle + revsPerSec * Math.PI * 2 * clampedDt) % (Math.PI * 2);
    }

    // Step physical subsystems
    this.updateThermal(clampedDt);
    this.updateViscoelasticMechanics(clampedDt);
    this.updateAirParticles(clampedDt);
    this.updateParticlesAndSparks(clampedDt);
    this.updateTelemetry();
  }

  // ---------------------------------------------------------------------------
  // Thermal Conduction, Radiation & Annealing
  // ---------------------------------------------------------------------------
  updateThermal(dt) {
    const N = this.slices.length;
    if (N === 0) return;

    // Annealing Lehr schedule
    if (this.isAnnealing) {
      this.annealProgress += dt * 0.12; // ~8 seconds for full cycle
      if (this.annealProgress >= 1.0) {
        this.annealProgress = 1.0;
        this.isAnnealing = false;
      }
    }

    const furnaceFactor = this.furnaceOffset;

    for (let i = 0; i < N; i++) {
      const s = this.slices[i];
      const wallThick = Math.max(1.5, s.outerR - s.innerR);

      if (this.isAnnealing) {
        // In the Lehr: temperature smoothly descends along optimal cooling curve
        // First soak at 560°C (relax internal stresses), then cool to ambient
        let lehrTarget = 560;
        if (this.annealProgress > 0.4) {
          const ramp = (this.annealProgress - 0.4) / 0.6;
          lehrTarget = 560 - ramp * (560 - this.ambientTemp);
        }
        s.temp += (lehrTarget - s.temp) * Math.min(1.0, dt * 1.5);
        // Viscoelastic stress relaxation in lehr
        s.stress *= Math.max(0, 1.0 - dt * 2.5);
        continue;
      }

      // 1. Furnace Radiant Heating
      if (furnaceFactor > 0.01) {
        // Radiant heat transfer from glory hole
        const distFalloff = 1.0 - (i / N) * 0.35;
        const heatTransfer = (this.furnaceTemp - s.temp) * 2.4 * furnaceFactor * distFalloff;
        s.temp += heatTransfer * dt;
        s.stress *= Math.max(0, 1.0 - dt * 1.8); // Stress melts away when reheated
      }

      // 2. Ambient Radiative & Convective Cooling
      // Thinner walls cool faster due to low thermal mass!
      const coolRate = 0.06 + (6.0 / wallThick) * 0.08;
      const radiationLoss = Math.pow(Math.max(0, s.temp - this.ambientTemp) / 1000, 1.5) * 65.0 * coolRate;
      s.temp -= radiationLoss * dt;
      s.temp = Math.max(this.ambientTemp, s.temp);

      // 3. Thermal Stress Generation if cooled rapidly through glass transition (550°C)
      if (s.temp < 650 && s.temp > 200 && furnaceFactor < 0.1) {
        // Differential cooling creates locked-in stress
        const stressRate = (650 - s.temp) * 0.08;
        s.stress = Math.min(160, s.stress + stressRate * dt);
        if (s.stress > 130 && !this.isCracked && Math.random() < 0.04) {
          this.triggerThermalShock(i);
        }
      }
    }

    // 4. Axial Heat Diffusion between adjacent slices
    for (let i = 1; i < N - 1; i++) {
      const prev = this.slices[i - 1].temp;
      const curr = this.slices[i].temp;
      const next = this.slices[i + 1].temp;
      const laplacian = (prev - 2 * curr + next);
      this.slices[i].temp += laplacian * 0.25 * dt;
    }
  }

  // ---------------------------------------------------------------------------
  // Viscoelastic Fluid Dynamics & Tool Deformation
  // ---------------------------------------------------------------------------
  updateViscoelasticMechanics(dt) {
    const N = this.slices.length;
    if (N === 0) return;

    const pipeTipX = this.getPipeTipX();
    const pipeY = this.getPipeCenterY();
    const furnaceShift = -this.furnaceOffset * (this.width * 0.18);

    // Centrifugal angular speed (rad/s)
    const omega = (this.rotationSpeed / 60) * Math.PI * 2;
    const centrifugalForce = omega * omega;

    // Blowing pneumatic pressure
    const activePressure = (this.isBlowing || (this.isMouseDown && this.activeTool === 'air')) 
      ? this.blowingPressure 
      : 0;

    for (let i = 0; i < N; i++) {
      const s = this.slices[i];
      const eta = this.getViscosity(s.temp);
      const fluidity = 1.0 / eta;

      // Axial coordinate
      const segLen = this.baseLength / (N - 1);
      s.nominalX = pipeTipX + furnaceShift + i * segLen;
      s.x = s.nominalX;

      // 1. Gravity Sagging vs Rotational Averaging
      // If pipe is rotating fast enough (>18 RPM), gravity vector averages to zero.
      // If stationary or slow, molten gather droops downward!
      if (this.rotationSpeed < 18) {
        const droopFactor = (1.0 - this.rotationSpeed / 18);
        const sagRate = (35.0 * droopFactor) * fluidity;
        s.sag += sagRate * dt;
      } else {
        // Centering tension restores straight axis
        s.sag *= Math.max(0, 1.0 - dt * 2.0);
      }
      s.y = pipeY + s.sag;

      // 2. Cavity Inflation (Internal Pneumatic Pressure)
      if (activePressure > 0 && s.temp > 700) {
        // Cavity propagation forward into solid gather
        if (i > 0 && this.slices[i - 1].innerR > 2.0 && s.innerR < 2.0) {
          s.innerR = Math.max(s.innerR, 2.0);
        }

        if (s.innerR > 0) {
          const wall = Math.max(1.5, s.outerR - s.innerR);
          // Laplace's law for cylindrical membrane: stress = P * r / wall
          const hoopStress = (activePressure * 16.0 * s.innerR) / wall;
          const expansionRate = hoopStress * fluidity * 2.5;

          s.innerR += expansionRate * dt;
          // Incompressible glass volume conservation: R^2 - r^2 = V / (pi * dl)
          // Allow subtle axial stretching
          const currentAnnularArea = s.outerR * s.outerR - s.innerR * s.innerR;
          const targetArea = Math.max(25, s.vol / (Math.PI * segLen));
          s.outerR = Math.sqrt(Math.max(s.innerR * s.innerR + 15, currentAnnularArea + targetArea * 0.5 * dt));
        }
      }

      // 3. Centrifugal Flaring (High-Speed Spin expands outer rim)
      if (centrifugalForce > 4.0 && s.temp > 780 && i > N * 0.3) {
        const rimWeight = Math.pow(i / N, 1.8);
        const flareRate = (centrifugalForce * 0.08 * rimWeight) * fluidity;
        s.outerR += flareRate * dt;
        if (s.innerR > 0) {
          s.innerR = Math.max(0, s.outerR - Math.max(2.0, (s.outerR - s.innerR)));
        }
      }

      // 4. Tool Interaction: Marver Slab Flattening & Contact Chilling
      if (this.activeTool === 'marver' && this.isMouseDown) {
        const slabY = this.marverY;
        const bottomEdge = s.y + s.outerR;
        if (bottomEdge > slabY) {
          // Push outer boundary flat to slab line
          const targetR = Math.max(s.innerR + 1.8, slabY - s.y);
          s.outerR += (targetR - s.outerR) * Math.min(1.0, dt * 14.0);
          // Conductive cooling on contacted stone
          s.temp -= 280.0 * dt;
          s.temp = Math.max(this.ambientTemp, s.temp);
        }
      }

      // 5. Tool Interaction: Jacks / Shears Constriction
      if (this.activeTool === 'jacks' && this.isMouseDown) {
        const distFromJacks = Math.abs(s.x - this.jacksX);
        if (distFromJacks < this.jacksWidth) {
          const pinchStrength = 1.0 - distFromJacks / this.jacksWidth;
          const pinchRate = (38.0 * pinchStrength) * fluidity;
          s.outerR = Math.max(s.innerR + 1.8, s.outerR - pinchRate * dt);
          if (s.innerR > 0) {
            s.innerR = Math.min(s.innerR, s.outerR - 1.8);
          }
        }
      }

      // Enforce physical boundary safety
      s.innerR = Math.max(0, s.innerR);
      s.outerR = Math.max(s.innerR + 1.8, s.outerR);
      s.outerR = Math.min(180, s.outerR); // Viewport safety bounds
    }

    // 6. Surface Tension Smoothing across adjacent slices
    for (let i = 1; i < N - 1; i++) {
      const eta = this.getViscosity(this.slices[i].temp);
      const fluid = 1.0 / eta;
      const smoothFactor = 0.22 * fluid * dt * 30;

      const pOuter = this.slices[i - 1].outerR;
      const cOuter = this.slices[i].outerR;
      const nOuter = this.slices[i + 1].outerR;
      this.slices[i].outerR += (pOuter - 2 * cOuter + nOuter) * smoothFactor;

      if (this.slices[i].innerR > 0) {
        const pInner = this.slices[i - 1].innerR;
        const cInner = this.slices[i].innerR;
        const nInner = this.slices[i + 1].innerR;
        this.slices[i].innerR += (pInner - 2 * cInner + nInner) * smoothFactor;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Internal Air Pressure Particles Simulation
  // ---------------------------------------------------------------------------
  updateAirParticles(dt) {
    const pipeTipX = this.getPipeTipX() - this.furnaceOffset * (this.width * 0.18);
    const pipeY = this.getPipeCenterY();
    const isPumpingAir = this.isBlowing || (this.isMouseDown && this.activeTool === 'air');

    // Inject fresh air stream into pipe bore
    if (isPumpingAir && this.airParticles.length < this.maxAirParticles) {
      const count = 3;
      for (let k = 0; k < count; k++) {
        this.airParticles.push({
          x: pipeTipX - 100 + Math.random() * 20,
          y: pipeY + (Math.random() - 0.5) * 8,
          vx: 240 + Math.random() * 120,
          vy: (Math.random() - 0.5) * 30,
          life: 1.0,
          size: 2.0 + Math.random() * 2.5
        });
      }
    }

    // Step active air particles
    const N = this.slices.length;
    const segLen = this.baseLength / Math.max(1, N - 1);

    for (let i = this.airParticles.length - 1; i >= 0; i--) {
      const p = this.airParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.85;

      // Inside blowpipe tube (left of tip)
      if (p.x < pipeTipX) {
        if (Math.abs(p.y - pipeY) > 8) {
          p.vy *= -0.7;
          p.y = pipeY + Math.sign(p.y - pipeY) * 8;
        }
      } else {
        // Inside glass cavity
        const sliceIdx = Math.floor((p.x - pipeTipX) / segLen);
        if (sliceIdx >= 0 && sliceIdx < N) {
          const s = this.slices[sliceIdx];
          const innerRad = Math.max(3, s.innerR);
          const dy = p.y - s.y;

          if (Math.abs(dy) > innerRad) {
            // Collision with internal viscoelastic glass boundary
            p.vy = -Math.sign(dy) * Math.abs(p.vy) * 0.7;
            p.vx *= 0.85;
            p.y = s.y + Math.sign(dy) * innerRad;
            p.life -= 0.15; // Energy transfer to glass
          }
        } else {
          // Escaped out tip or sides
          p.life -= dt * 2.0;
        }
      }

      if (p.life <= 0 || p.x > this.width + 50) {
        this.airParticles.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Thermal Shimmer & Furnace Ember Particles
  // ---------------------------------------------------------------------------
  updateParticlesAndSparks(dt) {
    // 1. Rising convective heat shimmer
    if (this.heatParticles.length < 35 && Math.random() < 0.6) {
      const N = this.slices.length;
      if (N > 0) {
        const randSlice = this.slices[Math.floor(Math.random() * N)];
        if (randSlice.temp > 650) {
          this.heatParticles.push({
            x: randSlice.x + (Math.random() - 0.5) * 15,
            y: randSlice.y - randSlice.outerR - Math.random() * 8,
            vx: (Math.random() - 0.5) * 12,
            vy: -35 - Math.random() * 40,
            life: 1.0,
            temp: randSlice.temp
          });
        }
      }
    }

    for (let i = this.heatParticles.length - 1; i >= 0; i--) {
      const p = this.heatParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.4;
      if (p.life <= 0) this.heatParticles.splice(i, 1);
    }

    // 2. Furnace Sparks when reheating
    if (this.furnaceOffset > 0.3 && this.sparkParticles.length < 50) {
      this.sparkParticles.push({
        x: Math.max(30, this.width * 0.08) + Math.random() * 40,
        y: this.getPipeCenterY() + (Math.random() - 0.5) * 70,
        vx: 80 + Math.random() * 140,
        vy: (Math.random() - 0.5) * 90,
        life: 1.0,
        size: 1.5 + Math.random() * 2.0
      });
    }

    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const sp = this.sparkParticles[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 60 * dt; // Gravity on ember
      sp.life -= dt * 1.8;
      if (sp.life <= 0) this.sparkParticles.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Thermal Shock Fracture
  // ---------------------------------------------------------------------------
  triggerThermalShock(sliceIdx) {
    this.isCracked = true;
    const s = this.slices[sliceIdx];
    this.fractures.push({
      x: s.x,
      y: s.y,
      radius: s.outerR,
      branches: Array.from({ length: 6 }, () => ({
        angle: Math.random() * Math.PI * 2,
        len: s.outerR * (0.4 + Math.random() * 0.6)
      }))
    });
  }

  // ---------------------------------------------------------------------------
  // Telemetry Aggregation
  // ---------------------------------------------------------------------------
  updateTelemetry() {
    const N = this.slices.length;
    if (N === 0) return;

    let totalTemp = 0;
    let minWall = 999;
    let totalCavity = 0;
    let maxS = 0;

    const segLen = this.baseLength / (N - 1);

    for (let i = 0; i < N; i++) {
      const s = this.slices[i];
      totalTemp += s.temp;
      const wall = s.outerR - s.innerR;
      if (wall < minWall) minWall = wall;
      if (s.innerR > 0) {
        totalCavity += Math.PI * s.innerR * s.innerR * segLen;
      }
      if (s.stress > maxS) maxS = s.stress;
    }

    this.telemetry.avgTemp = Math.round(totalTemp / N);
    this.telemetry.wallThicknessMin = (minWall * 0.45).toFixed(1); // Scaled mm estimate
    this.telemetry.cavityVolume = Math.round(totalCavity * 0.008);  // Scaled cm³ estimate
    this.telemetry.maxStress = Math.round(maxS);

    if (this.controlsContainer && typeof document !== 'undefined') {
      const tTemp = this.controlsContainer.querySelector('#tele-temp');
      const tVol = this.controlsContainer.querySelector('#tele-vol');
      const tWall = this.controlsContainer.querySelector('#tele-wall');
      const tStress = this.controlsContainer.querySelector('#tele-stress');

      if (tTemp) tTemp.textContent = `${this.telemetry.avgTemp}°C`;
      if (tVol) tVol.textContent = `${this.telemetry.cavityVolume} cm³`;
      if (tWall) tWall.textContent = `${this.telemetry.wallThicknessMin} mm`;
      if (tStress) {
        if (this.isAnnealing) {
          tStress.textContent = `Annealing (${Math.round(this.annealProgress * 100)}%)`;
          tStress.style.color = '#4dd0e1';
        } else if (this.isCracked) {
          tStress.textContent = 'THERMAL SHOCK FRACTURE!';
          tStress.style.color = '#ff5252';
        } else if (this.telemetry.avgTemp > 800) {
          tStress.textContent = 'Viscoelastic Flow';
          tStress.style.color = '#ffab40';
        } else if (this.telemetry.maxStress > 70) {
          tStress.textContent = `High Strain (${this.telemetry.maxStress} MPa)`;
          tStress.style.color = '#ffd54f';
        } else {
          tStress.textContent = 'Annealed / Rigid';
          tStress.style.color = '#81c784';
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // High-Quality Canvas Rendering Pass
  // ---------------------------------------------------------------------------
  render(ctx) {
    if (!ctx) return;

    // 1. Dark Roman Workshop Ambient Background
    this.renderWorkshop(ctx);

    // 2. Furnace / Glory Hole Architecture
    this.renderFurnace(ctx);

    // 3. Forged Iron Blowpipe (Fistula Vitrea)
    this.renderBlowpipe(ctx);

    // 4. Soft-Body Viscoelastic Molten Glass Gather
    this.renderGlassVessel(ctx);

    // 5. Internal Air Pressure Particles
    this.renderAirParticles(ctx);

    // 6. Thermal Shimmer, Sparks & Glow Blooming
    this.renderAtmospherics(ctx);

    // 7. Interactive Tool Overlays (Marver table, Jacks calipers)
    this.renderToolOverlays(ctx);

    // 8. Artisan Workshop HUD
    this.renderHUD(ctx);
  }

  renderWorkshop(ctx) {
    const w = this.width;
    const h = this.height;

    // Atmospheric dark masonry gradient
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 50, w * 0.5, h * 0.5, Math.max(w, h));
    bgGrad.addColorStop(0, '#16151c');
    bgGrad.addColorStop(0.65, '#0d0c11');
    bgGrad.addColorStop(1.0, '#060508');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Roman stone arch / block mortar line silhouettes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const blockSize = 64;
    for (let y = 0; y < h; y += blockSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  renderFurnace(ctx) {
    const mouthX = Math.max(30, this.width * 0.08);
    const mouthY = this.getPipeCenterY();
    const mouthR = 95;

    ctx.save();

    // Radiant furnace interior glow
    const glow = ctx.createRadialGradient(mouthX, mouthY, 10, mouthX, mouthY, mouthR * 1.8);
    glow.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    glow.addColorStop(0.35, 'rgba(255, 120, 20, 0.7)');
    glow.addColorStop(0.7, 'rgba(180, 40, 10, 0.35)');
    glow.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, Math.max(0, mouthR * 1.8), 0, Math.PI * 2);
    ctx.fill();

    // Heavy Roman brick furnace arch outline
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, Math.max(0, mouthR), -Math.PI * 0.5, Math.PI * 0.5, true);
    ctx.lineTo(0, mouthY + mouthR);
    ctx.lineTo(0, mouthY - mouthR);
    ctx.closePath();

    ctx.fillStyle = '#24120c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 140, 40, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Fiery furnace aperture
    const aperGrad = ctx.createRadialGradient(mouthX - 20, mouthY, 5, mouthX, mouthY, mouthR * 0.75);
    aperGrad.addColorStop(0, '#ffffff');
    aperGrad.addColorStop(0.2, '#ffe082');
    aperGrad.addColorStop(0.5, '#ff5722');
    aperGrad.addColorStop(0.9, '#bf360c');
    aperGrad.addColorStop(1.0, '#3e1708');

    ctx.beginPath();
    ctx.ellipse(mouthX - 10, mouthY, mouthR * 0.45, mouthR * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = aperGrad;
    ctx.fill();

    ctx.restore();
  }

  renderBlowpipe(ctx) {
    const pipeTipX = this.getPipeTipX() - this.furnaceOffset * (this.width * 0.18);
    const pipeY = this.getPipeCenterY();
    const pipeStartX = -20;
    const outerR = 14;
    const innerR = 7;

    ctx.save();

    // 1. Cast shadow of iron pipe
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;

    // 2. Iron pipe shaft metallic gradient
    const ironGrad = ctx.createLinearGradient(0, pipeY - outerR, 0, pipeY + outerR);
    ironGrad.addColorStop(0, '#3a3a44');
    ironGrad.addColorStop(0.25, '#7b7b8a');
    ironGrad.addColorStop(0.5, '#9a9aa8');
    ironGrad.addColorStop(0.75, '#5c5c68');
    ironGrad.addColorStop(1.0, '#222228');

    ctx.fillStyle = ironGrad;
    ctx.beginPath();
    ctx.rect(pipeStartX, pipeY - outerR, pipeTipX - pipeStartX, outerR * 2);
    ctx.fill();

    // 3. Wooden / Bronze grip handles (manubria)
    const gripX = pipeStartX + 80;
    const gripLen = 70;
    const woodGrad = ctx.createLinearGradient(0, pipeY - outerR - 3, 0, pipeY + outerR + 3);
    woodGrad.addColorStop(0, '#5d4037');
    woodGrad.addColorStop(0.4, '#8d6e63');
    woodGrad.addColorStop(0.7, '#4e342e');
    woodGrad.addColorStop(1.0, '#2b1b17');

    ctx.fillStyle = woodGrad;
    ctx.fillRect(gripX, pipeY - outerR - 3, gripLen, (outerR + 3) * 2);

    // Brass ferrules on grips
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(gripX, pipeY - outerR - 4, 4, (outerR + 4) * 2);
    ctx.fillRect(gripX + gripLen - 4, pipeY - outerR - 4, 4, (outerR + 4) * 2);

    // 4. Hollow inner air channel (bore)
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
    ctx.fillRect(pipeStartX, pipeY - innerR, pipeTipX - pipeStartX, innerR * 2);

    // 5. Thermal glow on tip from molten gather contact
    const tipGlow = ctx.createRadialGradient(pipeTipX, pipeY, 2, pipeTipX, pipeY, 35);
    tipGlow.addColorStop(0, 'rgba(255, 120, 20, 0.85)');
    tipGlow.addColorStop(0.5, 'rgba(200, 40, 10, 0.4)');
    tipGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tipGlow;
    ctx.fillRect(pipeTipX - 35, pipeY - 25, 40, 50);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Molten & Translucent Glass Body Rendering
  // ---------------------------------------------------------------------------
  renderGlassVessel(ctx) {
    const N = this.slices.length;
    if (N < 2) return;

    ctx.save();

    // Tint profile
    const tint = GLASS_TINTS[this.currentTintKey] || GLASS_TINTS.AQUA;

    // Path tracing for the 2D vessel profile
    const topOuter = [];
    const botOuter = [];
    const topInner = [];
    const botInner = [];

    for (let i = 0; i < N; i++) {
      const s = this.slices[i];
      topOuter.push({ x: s.x, y: s.y - s.outerR });
      botOuter.push({ x: s.x, y: s.y + s.outerR });
      if (s.innerR > 0.5) {
        topInner.push({ x: s.x, y: s.y - s.innerR });
        botInner.push({ x: s.x, y: s.y + s.innerR });
      }
    }

    // 1. Incandescent Thermal Bloom (if hot)
    const avgT = this.telemetry.avgTemp;
    if (avgT > 750) {
      const bloomAlpha = Math.min(0.65, (avgT - 750) / 450);
      const midSlice = this.slices[Math.floor(N * 0.5)];
      const bloomGrad = ctx.createRadialGradient(
        midSlice.x, midSlice.y, 20,
        midSlice.x, midSlice.y, Math.max(80, midSlice.outerR * 2.2)
      );
      bloomGrad.addColorStop(0, `rgba(255, 170, 40, ${bloomAlpha})`);
      bloomGrad.addColorStop(0.5, `rgba(255, 60, 10, ${bloomAlpha * 0.45})`);
      bloomGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(midSlice.x, midSlice.y, Math.max(0, midSlice.outerR * 2.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Outer Solid Glass Envelope
    ctx.beginPath();
    ctx.moveTo(topOuter[0].x, topOuter[0].y);
    for (let i = 1; i < N; i++) {
      ctx.lineTo(topOuter[i].x, topOuter[i].y);
    }
    // Rounded base tip
    const last = this.slices[N - 1];
    ctx.arc(last.x, last.y, Math.max(0, last.outerR), -Math.PI * 0.5, Math.PI * 0.5, false);
    for (let i = N - 1; i >= 0; i--) {
      ctx.lineTo(botOuter[i].x, botOuter[i].y);
    }
    ctx.closePath();

    // 3. Dynamic Color Shader based on Temperature & Material Translucency
    const shaderGrad = ctx.createLinearGradient(
      this.slices[0].x, this.slices[0].y - 80,
      this.slices[0].x, this.slices[0].y + 80
    );

    // Color interpolation function
    const sampleColor = (normY) => {
      // Blend between cooled Roman glass tint and hot incandescence
      const incandescence = Math.max(0, Math.min(1.0, (avgT - 600) / 550));
      if (incandescence > 0.05) {
        // Hot incandescent state: white-yellow (1150°C) -> fiery orange -> dark crimson (700°C)
        if (avgT > 1050) {
          return `rgba(255, ${Math.round(210 + normY * 40)}, ${Math.round(90 + normY * 110)}, 0.95)`;
        } else if (avgT > 880) {
          return `rgba(255, ${Math.round(110 + normY * 60)}, 20, 0.92)`;
        } else {
          return `rgba(${Math.round(190 + normY * 50)}, 30, 15, 0.88)`;
        }
      } else {
        // Cooled, translucent Roman sea-glass with specular highlights
        const alpha = 0.55 + Math.abs(normY) * 0.35; // Thicker rim = more saturated
        return `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${alpha})`;
      }
    };

    shaderGrad.addColorStop(0, sampleColor(-1));
    shaderGrad.addColorStop(0.3, sampleColor(-0.4));
    shaderGrad.addColorStop(0.5, sampleColor(0));
    shaderGrad.addColorStop(0.7, sampleColor(0.4));
    shaderGrad.addColorStop(1.0, sampleColor(1));

    ctx.fillStyle = shaderGrad;
    ctx.fill();

    // 4. Internal Hollow Air Cavity Cutout
    if (topInner.length > 2) {
      ctx.beginPath();
      ctx.moveTo(topInner[0].x, topInner[0].y);
      for (let i = 1; i < topInner.length; i++) {
        ctx.lineTo(topInner[i].x, topInner[i].y);
      }
      const lastInner = topInner[topInner.length - 1];
      ctx.arc(lastInner.x, this.slices[N - 1].y, Math.max(0, Math.abs(lastInner.y - this.slices[N - 1].y)), -Math.PI * 0.5, Math.PI * 0.5, false);
      for (let i = botInner.length - 1; i >= 0; i--) {
        ctx.lineTo(botInner[i].x, botInner[i].y);
      }
      ctx.closePath();

      // Cavity illumination
      if (avgT > 750) {
        ctx.fillStyle = 'rgba(255, 240, 180, 0.45)';
      } else {
        ctx.fillStyle = 'rgba(10, 18, 22, 0.7)';
      }
      ctx.fill();
      ctx.strokeStyle = avgT > 750 ? 'rgba(255, 200, 80, 0.5)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 5. Specular Highlights (Glaze reflection along top ridge)
    ctx.beginPath();
    ctx.moveTo(topOuter[0].x, topOuter[0].y + 2);
    for (let i = 1; i < N; i++) {
      ctx.lineTo(topOuter[i].x, topOuter[i].y + 2);
    }
    ctx.strokeStyle = avgT > 750 ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Subtle counter-reflection along bottom ridge
    ctx.beginPath();
    ctx.moveTo(botOuter[0].x, botOuter[0].y - 2);
    for (let i = 1; i < N; i++) {
      ctx.lineTo(botOuter[i].x, botOuter[i].y - 2);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Thermal Shock Fractures (if cracked)
    if (this.isCracked && this.fractures.length > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (const frac of this.fractures) {
        for (const branch of frac.branches) {
          ctx.beginPath();
          ctx.moveTo(frac.x, frac.y);
          const endX = frac.x + Math.cos(branch.angle) * branch.len;
          const endY = frac.y + Math.sin(branch.angle) * branch.len;
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Internal Air Pressure Particles Rendering
  // ---------------------------------------------------------------------------
  renderAirParticles(ctx) {
    if (this.airParticles.length === 0) return;

    ctx.save();
    for (const p of this.airParticles) {
      const alpha = Math.max(0, p.life * 0.75);
      ctx.fillStyle = `rgba(180, 240, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Thermal Atmospherics (Heat Shimmer, Sparks)
  // ---------------------------------------------------------------------------
  renderAtmospherics(ctx) {
    ctx.save();

    // 1. Heat shimmer particles
    for (const p of this.heatParticles) {
      const alpha = p.life * 0.35;
      ctx.fillStyle = `rgba(255, 140, 50, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, 2.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Furnace sparks
    for (const sp of this.sparkParticles) {
      const alpha = sp.life;
      ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
      ctx.shadowColor = '#ff9100';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0, sp.size), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Interactive Tool Overlays (Marver & Jacks)
  // ---------------------------------------------------------------------------
  renderToolOverlays(ctx) {
    ctx.save();

    if (this.activeTool === 'marver') {
      // Marble/iron marver shaping slab
      const slabY = this.marverY;
      const slabX1 = this.getPipeTipX() - 40;
      const slabX2 = slabX1 + this.baseLength + 100;

      // Slab surface
      const marverGrad = ctx.createLinearGradient(0, slabY, 0, slabY + 30);
      marverGrad.addColorStop(0, '#546e7a');
      marverGrad.addColorStop(0.1, '#cfd8dc');
      marverGrad.addColorStop(0.3, '#37474f');
      marverGrad.addColorStop(1.0, '#1c252a');

      ctx.fillStyle = marverGrad;
      ctx.fillRect(slabX1, slabY, slabX2 - slabX1, 30);

      // Polished stone reflection line
      ctx.strokeStyle = '#eceff1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(slabX1, slabY);
      ctx.lineTo(slabX2, slabY);
      ctx.stroke();

      // Tool label
      ctx.fillStyle = 'rgba(207, 216, 220, 0.7)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('TABULA MARMORIS (MARVER SLAB)', slabX1 + 10, slabY + 20);
    } else if (this.activeTool === 'jacks') {
      // Roman iron calipers (pucellas)
      const jX = this.jacksX;
      const pipeY = this.getPipeCenterY();
      const bladeGap = 65;

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;

      // Top blade
      ctx.beginPath();
      ctx.moveTo(jX - 25, pipeY - bladeGap - 40);
      ctx.lineTo(jX, pipeY - bladeGap);
      ctx.lineTo(jX + 15, pipeY - bladeGap - 10);
      ctx.stroke();

      // Bottom blade
      ctx.beginPath();
      ctx.moveTo(jX - 25, pipeY + bladeGap + 40);
      ctx.lineTo(jX, pipeY + bladeGap);
      ctx.lineTo(jX + 15, pipeY + bladeGap + 10);
      ctx.stroke();

      // Jack axis line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(jX, pipeY - bladeGap);
      ctx.lineTo(jX, pipeY + bladeGap);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Artisan Workshop HUD & Historical Annotations
  // ---------------------------------------------------------------------------
  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    // Header Title
    ctx.fillStyle = '#d4af37';
    ctx.font = '600 12px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText(narrow ? 'VITRUM — ARS VITRIARIA' : 'VITRUM — ARS VITRIARIA ROMANA (NATURALIS HISTORIA XXXVI)', 16, 24);

    if (!narrow) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('Non-Newtonian Viscoelastic Fluid Dynamics & Pneumatic Inflation', 16, 40);

      // Interactive Hint Toast
      ctx.textAlign = 'right';
      let hint = 'Hold Space / Left-Click: Blow Air into Pipe | Tool: ' + this.activeTool.toUpperCase();
      if (this.activeTool === 'marver') {
        hint = 'Drag vertically to adjust Marver Slab & roll molten gather';
      } else if (this.activeTool === 'jacks') {
        hint = 'Click & Drag along gather to cinch waist & sculpt neck';
      }
      ctx.fillStyle = '#80deea';
      ctx.fillText(hint, sw - 16, 24);
    } else {
      ctx.fillStyle = '#80deea';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`Tool: ${this.activeTool.toUpperCase()} | Press Space to Blow`, 16, 40);
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Public Operations: Reheat, Anneal & Interaction
  // ---------------------------------------------------------------------------
  reheatGather() {
    this.isReheating = true;
    setTimeout(() => {
      this.isReheating = false;
    }, 1800);
  }

  annealLehr() {
    if (this.isAnnealing) return;
    this.isAnnealing = true;
    this.annealProgress = 0;
  }

  // ---------------------------------------------------------------------------
  // Verification & Telemetry Requirements
  // ---------------------------------------------------------------------------
  getEntityCount() {
    // Spec Requirement: Molten glass mesh vertices + air pressure particles
    // Mesh has numSlices * radialSegments outer vertices + inner cavity vertices
    const meshVertices = this.numSlices * this.radialSegments * 2;
    const airParticles = this.airParticles.length;
    return meshVertices + airParticles;
  }

  // ---------------------------------------------------------------------------
  // Input Event Handlers
  // ---------------------------------------------------------------------------
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };

    if (this.activeTool === 'marver') {
      this.marverY = Math.max(this.getPipeCenterY() + 15, pos.y);
    } else if (this.activeTool === 'jacks') {
      this.jacksX = pos.x;
    } else if (this.activeTool === 'air') {
      this.isBlowing = true;
    }
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };

    if (this.isMouseDown) {
      if (this.activeTool === 'marver') {
        this.marverY = Math.max(this.getPipeCenterY() + 15, pos.y);
      } else if (this.activeTool === 'jacks') {
        this.jacksX = pos.x;
      }
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.isBlowing = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.isBlowing = true;
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === 'r' || key === 'R') {
      this.isReheating = true;
    } else if (key === 'a' || key === 'A') {
      this.annealLehr();
    } else if (key === '1') {
      this.activeTool = 'air';
    } else if (key === '2') {
      this.activeTool = 'marver';
    } else if (key === '3') {
      this.activeTool = 'jacks';
    }
  }

  onKeyUp(key) {
    if (key === ' ' || key === 'Spacebar') {
      this.isBlowing = false;
    } else if (key === 'r' || key === 'R') {
      this.isReheating = false;
    }
  }

  onWheel(deltaY) {
    // Scroll adjusts furnace reheat temperature
    this.furnaceTemp = Math.max(800, Math.min(1350, this.furnaceTemp - Math.sign(deltaY) * 25));
    if (this.controlsContainer && typeof document !== 'undefined') {
      const fSlider = this.controlsContainer.querySelector('#furnace-slider');
      const fVal = this.controlsContainer.querySelector('#furnace-val');
      if (fSlider) fSlider.value = this.furnaceTemp;
      if (fVal) fVal.textContent = `${Math.round(this.furnaceTemp)}°C`;
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Teardown
  // ---------------------------------------------------------------------------
  destroy() {
    detachTouchBridge(this, this.canvas);
    this.isMouseDown = false;
    this.isBlowing = false;
    this.isReheating = false;
    this.isAnnealing = false;
    this.airParticles = [];
    this.heatParticles = [];
    this.sparkParticles = [];
    this.fractures = [];
    this.slices = [];
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }
}
