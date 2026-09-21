// Scylla & Charybdis: Dual Hydrodynamic Peril in the Strait of Messina
// Ancient Greek Maritime Navigation & Vortex Fluid Simulation
// Odysseus' Penteconter navigating between the Sucking Maw and the Serpentine Crags

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class ScyllaCharybdisEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation parameters (tunable via controls)
    this.vortexSuctionStrength = 1.0;  // 0.2 to 3.0
    this.scyllaReachAggression = 1.0;  // 0.5 to 2.5
    this.tidalCurrentVelocity = 25.0;  // px/s along strait (+X)

    // Simulation timing & cycle
    this.time = 0;
    this.charybdisCycleTimer = 0;
    this.charybdisCyclePeriod = 24.0; // 24s total cycle (swallow -> slack -> spout)
    this.charybdisPhase = 'SWALLOW';  // 'SWALLOW' | 'SLACK' | 'SPOUT'

    // Vortex Geometry
    this.charybdisPos = {
      x: this.width * 0.52,
      y: this.height * 0.74,
      coreRadius: 36,
      outerRadius: 320
    };

    // Scylla Cliffs & 6 Serpentine Heads
    this.cliffWaterlineY = this.height * 0.26;
    this.scyllaHeads = [];
    this.initScyllaHeads();

    // Odysseus' Penteconter Ship
    this.ship = {
      x: 90,
      y: this.height * 0.48,
      vx: 20,
      vy: 0,
      heading: 0, // radians: 0 is East
      angularVel: 0,
      rudderInput: 0,
      oarPower: 0,
      isSurging: false,
      surgeTimer: 0,
      anchorDeployed: false,
      hull: 100,
      maxHull: 100,
      crew: 6, // 6 sailors can be snatched by Scylla
      maxCrew: 6,
      rowCycle: 0,
      roll: 0,
      pitch: 0,
      width: 22,
      length: 68,
      isDestroyed: false,
      snatchedCrewTimer: 0
    };

    // Input state
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false,
      Space: false
    };
    this.mouseTarget = null;
    this.isMouseDown = false;

    // Particle systems & Debris
    this.vortexParticles = [];
    this.sprayParticles = [];
    this.debrisList = [];
    this.wakeTrail = [];

    this.maxVortexParticles = 420;
    this.initVortexParticles();
    this.initDebris();

    // Setup UI Controls
    this.initControls();
    attachTouchBridge(this, canvas);
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION HELPERS                                                     */
  /* -------------------------------------------------------------------------- */

  initScyllaHeads() {
    this.scyllaHeads = [];
    const count = 6;
    const startX = this.width * 0.28;
    const endX = this.width * 0.78;
    const span = (endX - startX) / (count - 1);

    for (let i = 0; i < count; i++) {
      const anchorX = startX + i * span + (Math.sin(i * 1.7) * 20);
      const anchorY = this.cliffWaterlineY - 45 - (i % 2) * 20;

      // Inverse Kinematics / Verlets for 8 neck segments
      const segmentCount = 9;
      const segmentLength = 22;
      const joints = [];
      for (let j = 0; j < segmentCount; j++) {
        joints.push({
          x: anchorX + (j * 4),
          y: anchorY + (j * segmentLength * 0.6),
          vx: 0,
          vy: 0
        });
      }

      this.scyllaHeads.push({
        id: i,
        anchorX,
        anchorY,
        headX: anchorX,
        headY: anchorY + 80,
        targetX: anchorX,
        targetY: anchorY + 80,
        joints,
        segmentLength,
        state: 'COILED', // 'COILED' | 'TRACKING' | 'LUNGING' | 'SNATCHED' | 'RETRACTING'
        stateTimer: Math.random() * 3,
        jawOpen: 0,
        eyeGlow: 0.8,
        snatchedVictim: null,
        strikeCooldown: 2.0 + Math.random() * 3.0
      });
    }
  }

  initVortexParticles() {
    this.vortexParticles = [];
    for (let i = 0; i < this.maxVortexParticles; i++) {
      this.vortexParticles.push(this.createVortexParticle(true));
    }
  }

  createVortexParticle(randomRadius = false) {
    const angle = Math.random() * Math.PI * 2;
    const minR = this.charybdisPos.coreRadius * 0.8;
    const maxR = this.charybdisPos.outerRadius * 1.35;
    const r = randomRadius ? minR + Math.random() * (maxR - minR) : maxR * (0.8 + Math.random() * 0.2);

    return {
      x: this.charybdisPos.x + Math.cos(angle) * r,
      y: this.charybdisPos.y + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      life: 0.5 + Math.random() * 1.0,
      maxLife: 2.0 + Math.random() * 3.0,
      size: 1.2 + Math.random() * 2.2,
      alpha: 0.3 + Math.random() * 0.7,
      color: Math.random() < 0.25 ? '#E0FAFF' : (Math.random() < 0.6 ? '#70D6FF' : '#1D63B8')
    };
  }

  initDebris() {
    this.debrisList = [];
    const debrisTypes = ['plank', 'amphora', 'barrel', 'broken_oar'];
    const count = 28;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * (this.charybdisPos.outerRadius * 1.2);
      this.debrisList.push({
        x: this.charybdisPos.x + Math.cos(angle) * dist,
        y: this.charybdisPos.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        angle: Math.random() * Math.PI * 2,
        vAngular: (Math.random() - 0.5) * 1.5,
        type: debrisTypes[i % debrisTypes.length],
        scale: 0.7 + Math.random() * 0.6,
        hp: 1.0
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* HYDRODYNAMIC VECTOR FIELD CALCULATION                                      */
  /* -------------------------------------------------------------------------- */

  getHydrodynamicVelocity(px, py) {
    // 1. Tidal Current along the Strait (Eastward drift)
    let vx = this.tidalCurrentVelocity;
    let vy = Math.sin(px * 0.006 + this.time * 0.8) * 3.0;

    // 2. Charybdis Whirlpool Vortex Field
    const dx = px - this.charybdisPos.x;
    const dy = py - this.charybdisPos.y;
    const rSq = dx * dx + dy * dy;
    const r = Math.sqrt(rSq);

    if (r < this.charybdisPos.outerRadius * 1.6) {
      // Modified Lamb-Oseen / Rankine vortex tangential circulation
      // v_theta = Gamma / (2 * pi * r) with core softening r / (r^2 + rc^2)
      const rc = this.charybdisPos.coreRadius;
      const gamma = 120000.0 * this.vortexSuctionStrength;
      const vThetaMag = (gamma / (2 * Math.PI)) * (r / (rSq + rc * rc));

      // Tangential unit vector (counter-clockwise rotation in Northern Hemisphere Mediterranean)
      // (-sin(theta), cos(theta)) = (-dy / r, dx / r)
      const invR = r > 0.001 ? 1.0 / r : 0;
      const tanX = -dy * invR;
      const tanY = dx * invR;

      // Radial suction or geyser eruption velocity
      let vRadMag = 0;
      if (this.charybdisPhase === 'SWALLOW') {
        // Strong inward suction drawing water down into abyssal maw
        const suctionIntensity = 85.0 * this.vortexSuctionStrength;
        vRadMag = -suctionIntensity / Math.pow(Math.max(20.0, r) / 80.0, 0.75);
      } else if (this.charybdisPhase === 'SPOUT') {
        // Violent geyser eruption outward expulsion
        const spoutIntensity = 110.0 * this.vortexSuctionStrength;
        const blastFactor = Math.exp(-Math.pow(r / 140.0, 2));
        vRadMag = spoutIntensity * blastFactor;
      } else {
        // SLACK water churn
        vRadMag = Math.sin(r * 0.1 - this.time * 4) * 8.0;
      }

      // Radial unit vector (dx / r, dy / r)
      const radX = dx * invR;
      const radY = dy * invR;

      vx += tanX * vThetaMag + radX * vRadMag;
      vy += tanY * vThetaMag + radY * vRadMag;
    }

    // 3. Breaking wave rebound off Scylla's jagged cliffs
    if (py < this.cliffWaterlineY + 45) {
      const cliffDist = Math.max(1, py - this.cliffWaterlineY);
      const pushY = (45 - cliffDist) * 1.2;
      vy += pushY;
      vx += Math.cos(px * 0.05 + this.time * 3) * 6.0;
    }

    return { vx, vy, r };
  }

  /* -------------------------------------------------------------------------- */
  /* CONTROLS & UI CONTRACT                                                     */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Charybdis Vortex Suction: <span id="val-charybdis">${this.vortexSuctionStrength.toFixed(1)}x</span></label>
        <input type="range" id="slider-charybdis" min="0.2" max="3.0" step="0.1" value="${this.vortexSuctionStrength}">
      </div>

      <div class="control-group">
        <label>Scylla Reach / Aggression: <span id="val-scylla">${this.scyllaReachAggression.toFixed(1)}x</span></label>
        <input type="range" id="slider-scylla" min="0.5" max="2.5" step="0.1" value="${this.scyllaReachAggression}">
      </div>

      <div class="control-group">
        <label>Strait Tidal Current: <span id="val-current">${this.tidalCurrentVelocity.toFixed(0)} px/s</span></label>
        <input type="range" id="slider-current" min="-40" max="80" step="5" value="${this.tidalCurrentVelocity}">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px;">
        <button id="btn-surge" class="sub-btn" style="background: rgba(72, 202, 228, 0.25); border-color: #48CAE4; font-weight: bold; padding: 9px;">
          ⚡ Rowers Full Surge! (W / Up)
        </button>
        <button id="btn-anchor" class="sub-btn" style="background: rgba(212, 175, 55, 0.2); border-color: #D4AF37; font-weight: bold; padding: 9px;">
          ⚓ Drop Drag Anchor (Space)
        </button>
        <button id="btn-reset-ship" class="sub-btn" style="background: rgba(180, 50, 50, 0.25); border-color: #FF5A5F; font-weight: bold; padding: 9px;">
          ↺ Reset Ship to Strait Entrance
        </button>
      </div>

      <div class="control-group" style="font-size: 0.82rem; line-height: 1.4; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
        <div><strong>Navigation Helm:</strong> [A/D] or [←/→] Steer Rudder</div>
        <div><strong>Rowing Speed:</strong> [W/S] or [↑/↓] Forward / Reverse</div>
        <div><strong>Peril Advice:</strong> Keep mid-channel. Scylla lurks on North cliffs; Charybdis pulls on South flank.</div>
      </div>
    `;

    // Bind Sliders
    const sliderCharybdis = this.controlsContainer.querySelector('#slider-charybdis');
    const valCharybdis = this.controlsContainer.querySelector('#val-charybdis');
    if (sliderCharybdis) {
      sliderCharybdis.addEventListener('input', (e) => {
        this.vortexSuctionStrength = parseFloat(e.target.value);
        if (valCharybdis) valCharybdis.textContent = `${this.vortexSuctionStrength.toFixed(1)}x`;
      });
    }

    const sliderScylla = this.controlsContainer.querySelector('#slider-scylla');
    const valScylla = this.controlsContainer.querySelector('#val-scylla');
    if (sliderScylla) {
      sliderScylla.addEventListener('input', (e) => {
        this.scyllaReachAggression = parseFloat(e.target.value);
        if (valScylla) valScylla.textContent = `${this.scyllaReachAggression.toFixed(1)}x`;
      });
    }

    const sliderCurrent = this.controlsContainer.querySelector('#slider-current');
    const valCurrent = this.controlsContainer.querySelector('#val-current');
    if (sliderCurrent) {
      sliderCurrent.addEventListener('input', (e) => {
        this.tidalCurrentVelocity = parseFloat(e.target.value);
        if (valCurrent) valCurrent.textContent = `${this.tidalCurrentVelocity.toFixed(0)} px/s`;
      });
    }

    // Bind Buttons
    const btnSurge = this.controlsContainer.querySelector('#btn-surge');
    if (btnSurge) {
      btnSurge.addEventListener('click', () => {
        this.triggerSurge();
      });
    }

    const btnAnchor = this.controlsContainer.querySelector('#btn-anchor');
    if (btnAnchor) {
      btnAnchor.addEventListener('click', () => {
        this.toggleAnchor();
      });
    }

    const btnReset = this.controlsContainer.querySelector('#btn-reset-ship');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetShip();
      });
    }
  }

  triggerSurge() {
    if (this.ship.isDestroyed) return;
    this.ship.isSurging = true;
    this.ship.surgeTimer = 4.0; // 4 seconds surge
    this.spawnShipOarSpray(35);
  }

  toggleAnchor() {
    this.ship.anchorDeployed = !this.ship.anchorDeployed;
    const btnAnchor = this.controlsContainer ? this.controlsContainer.querySelector('#btn-anchor') : null;
    if (btnAnchor) {
      if (this.ship.anchorDeployed) {
        btnAnchor.textContent = '⚓ Weighed Anchor (Haul In)';
        btnAnchor.style.borderColor = '#48CAE4';
      } else {
        btnAnchor.textContent = '⚓ Drop Drag Anchor (Space)';
        btnAnchor.style.borderColor = '#D4AF37';
      }
    }
  }

  resetShip() {
    this.ship.x = 90;
    this.ship.y = this.height * 0.48;
    this.ship.vx = 22;
    this.ship.vy = 0;
    this.ship.heading = 0;
    this.ship.angularVel = 0;
    this.ship.rudderInput = 0;
    this.ship.oarPower = 0;
    this.ship.isSurging = false;
    this.ship.surgeTimer = 0;
    this.ship.anchorDeployed = false;
    this.ship.hull = 100;
    this.ship.crew = 6;
    this.ship.isDestroyed = false;
    this.ship.snatchedCrewTimer = 0;
    this.ship.roll = 0;
    this.wakeTrail = [];

    const btnAnchor = this.controlsContainer ? this.controlsContainer.querySelector('#btn-anchor') : null;
    if (btnAnchor) {
      btnAnchor.textContent = '⚓ Drop Drag Anchor (Space)';
      btnAnchor.style.borderColor = '#D4AF37';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE & CONTRACT METHODS                                               */
  /* -------------------------------------------------------------------------- */

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.cliffWaterlineY = this.height * 0.26;
    this.charybdisPos.x = this.width * 0.52;
    this.charybdisPos.y = this.height * 0.74;
    this.charybdisPos.outerRadius = Math.min(this.width, this.height) * 0.48;

    this.initScyllaHeads();
  }

  getEntityCount() {
    // Count of whirlpool vortex particles, sea spray, and ship debris (+ active monster segments)
    let headSegmentsCount = 0;
    for (let i = 0; i < this.scyllaHeads.length; i++) {
      headSegmentsCount += this.scyllaHeads[i].joints.length;
    }
    return this.vortexParticles.length + this.sprayParticles.length + this.debrisList.length + headSegmentsCount;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  reset() {
    this.time = 0;
    this.charybdisCycleTimer = 0;
    this.charybdisPhase = 'SWALLOW';
    this.resetShip();
    this.initScyllaHeads();
    this.initVortexParticles();
    this.initDebris();
    this.sprayParticles = [];
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING                                                             */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mouseTarget = { x: pos.x, y: pos.y };
  }

  onMouseMove(pos) {
    if (this.isMouseDown) {
      this.mouseTarget = { x: pos.x, y: pos.y };
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.mouseTarget = null;
  }

  onKeyDown(key, e) {
    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.keys.ArrowUp = true;
    if (key === 'ArrowDown' || key === 's' || key === 'S') this.keys.ArrowDown = true;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.ArrowLeft = true;
    if (key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.ArrowRight = true;

    if (key === ' ' || key === 'Spacebar') {
      if (e && e.preventDefault) e.preventDefault();
      this.toggleAnchor();
    }
    if (key === 'Shift') {
      this.triggerSurge();
    }
    if (key === 'r' || key === 'R') {
      this.resetShip();
    }
  }

  onKeyUp(key) {
    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.keys.ArrowUp = false;
    if (key === 'ArrowDown' || key === 's' || key === 'S') this.keys.ArrowDown = false;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.ArrowLeft = false;
    if (key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.ArrowRight = false;
  }

  /* -------------------------------------------------------------------------- */
  /* SIMULATION UPDATE                                                          */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    // Clamp delta time to avoid large physics steps
    const step = Math.min(0.05, Math.max(0.001, dt));
    this.time += step;

    // Update Charybdis 3-phase abyssal cycle
    this.updateCharybdisCycle(step);

    // Update Ship Hydrodynamics & Piloting
    this.updateShip(step);

    // Update Scylla Sea Monster Heads
    this.updateScylla(step);

    // Update Whirlpool Flow Particles
    this.updateVortexParticles(step);

    // Update Sea Spray & Splashes
    this.updateSprayParticles(step);

    // Update Ship Debris
    this.updateDebris(step);
  }

  updateCharybdisCycle(dt) {
    this.charybdisCycleTimer += dt;
    if (this.charybdisCycleTimer >= this.charybdisCyclePeriod) {
      this.charybdisCycleTimer = 0;
    }

    // Cycle breakdown:
    // 0s - 14s: Sucking Abyss (water swallowed down into depths)
    // 14s - 17s: Slack Water (boiling core calm before storm)
    // 17s - 24s: Geyser Eruption (foaming water column spouted upward)
    if (this.charybdisCycleTimer < 14.0) {
      this.charybdisPhase = 'SWALLOW';
    } else if (this.charybdisCycleTimer < 17.0) {
      this.charybdisPhase = 'SLACK';
    } else {
      this.charybdisPhase = 'SPOUT';
      // Geyser eruption throws massive spray upwards
      if (Math.random() < 0.6) {
        this.spawnGeyserSpray();
      }
    }
  }

  updateShip(dt) {
    if (this.ship.isDestroyed) {
      // Ship splinters drift in the currents
      this.ship.x += this.ship.vx * dt;
      this.ship.y += this.ship.vy * dt;
      const hydro = this.getHydrodynamicVelocity(this.ship.x, this.ship.y);
      this.ship.vx += (hydro.vx - this.ship.vx) * 1.5 * dt;
      this.ship.vy += (hydro.vy - this.ship.vy) * 1.5 * dt;
      return;
    }

    // Surge timing
    if (this.ship.isSurging) {
      this.ship.surgeTimer -= dt;
      if (this.ship.surgeTimer <= 0) {
        this.ship.isSurging = false;
      }
    }

    // Process Controls
    let rudderTarget = 0;
    if (this.keys.ArrowLeft) rudderTarget -= 1.0;
    if (this.keys.ArrowRight) rudderTarget += 1.0;

    let thrustInput = 0;
    if (this.keys.ArrowUp) thrustInput += 1.0;
    if (this.keys.ArrowDown) thrustInput -= 0.5;

    // Mouse Steer Assist if dragging
    if (this.mouseTarget) {
      const dx = this.mouseTarget.x - this.ship.x;
      const dy = this.mouseTarget.y - this.ship.y;
      const desiredAngle = Math.atan2(dy, dx);
      let angleDiff = desiredAngle - this.ship.heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      rudderTarget = Math.max(-1.0, Math.min(1.0, angleDiff * 1.8));
      thrustInput = Math.max(0.2, Math.min(1.0, Math.hypot(dx, dy) / 120.0));
    }

    this.ship.rudderInput += (rudderTarget - this.ship.rudderInput) * 8.0 * dt;

    // Hydrodynamic local velocity
    const hydro = this.getHydrodynamicVelocity(this.ship.x, this.ship.y);
    const relVx = this.ship.vx - hydro.vx;
    const relVy = this.ship.vy - hydro.vy;

    // Local hull reference frame
    const cosH = Math.cos(this.ship.heading);
    const sinH = Math.sin(this.ship.heading);

    // Forward and lateral relative speeds
    const vFwd = relVx * cosH + relVy * sinH;
    const vLat = -relVx * sinH + relVy * cosH;

    // Rudder steering torque: effective when moving relative to water or when rowing
    const oarCadence = (this.ship.isSurging ? 2.2 : 1.0) * (thrustInput > 0 ? 1.0 : 0.4);
    this.ship.rowCycle = (this.ship.rowCycle + oarCadence * 8.0 * dt) % (Math.PI * 2);

    const rudderTorque = this.ship.rudderInput * (Math.abs(vFwd) * 0.05 + 1.2);
    this.ship.angularVel += rudderTorque * 3.8 * dt;
    this.ship.angularVel *= Math.exp(-2.6 * dt); // angular damping
    this.ship.heading += this.ship.angularVel * dt;

    // Propulsion from 50 rowers
    let thrustForce = 0;
    const crewRatio = Math.max(0.2, this.ship.crew / this.ship.maxCrew);
    if (thrustInput > 0 || this.ship.isSurging) {
      const baseOarThrust = (this.ship.isSurging ? 160.0 : 75.0) * crewRatio;
      thrustForce = baseOarThrust * (this.ship.isSurging ? 1.0 : thrustInput);

      // Emit wake foam from oar blades
      if (Math.random() < (this.ship.isSurging ? 0.8 : 0.35)) {
        this.spawnShipOarSpray(2);
      }
    } else if (thrustInput < 0) {
      thrustForce = -35.0 * crewRatio; // backing water
    }

    // Hydrodynamic Forces
    // 1. Keel resistance: lateral water drag is 8x stronger than longitudinal drag
    const fwdDrag = -0.045 * vFwd * Math.abs(vFwd);
    const latDrag = -0.38 * vLat * Math.abs(vLat) - 1.2 * vLat;

    // 2. Drag Anchor (Drogue) Force
    let anchorDragX = 0;
    let anchorDragY = 0;
    if (this.ship.anchorDeployed) {
      const anchorCoeff = 3.5;
      anchorDragX = -this.ship.vx * anchorCoeff;
      anchorDragY = -this.ship.vy * anchorCoeff;
      // Anchor generates stabilizing foam
      if (Math.random() < 0.2) {
        this.sprayParticles.push({
          x: this.ship.x - cosH * 45,
          y: this.ship.y - sinH * 45,
          vx: -cosH * 15 + (Math.random() - 0.5) * 6,
          vy: -sinH * 15 + (Math.random() - 0.5) * 6,
          life: 0.8,
          maxLife: 0.8,
          size: 2.5,
          alpha: 0.7,
          color: '#E0FAFF'
        });
      }
    }

    // Acceleration in world coordinates
    const fTotalLocalX = thrustForce + fwdDrag;
    const fTotalLocalY = latDrag;

    const ax = fTotalLocalX * cosH - fTotalLocalY * sinH + anchorDragX;
    const ay = fTotalLocalX * sinH + fTotalLocalY * cosH + anchorDragY;

    // Integrate ship velocity towards ambient water flow
    this.ship.vx += ax * dt;
    this.ship.vy += ay * dt;

    // Hydrodynamic coupling with surrounding water
    this.ship.vx += (hydro.vx - this.ship.vx) * 0.45 * dt;
    this.ship.vy += (hydro.vy - this.ship.vy) * 0.45 * dt;

    // Update Position
    this.ship.x += this.ship.vx * dt;
    this.ship.y += this.ship.vy * dt;

    // Compute Dynamic Roll from turning centripetal acceleration and whirlpool suction tilt
    const centripetal = vFwd * this.ship.angularVel * 0.08;
    const vortexTilt = (this.ship.y - this.charybdisPos.y) / (hydro.r + 50) * 0.15;
    const targetRoll = Math.max(-0.35, Math.min(0.35, centripetal + vortexTilt));
    this.ship.roll += (targetRoll - this.ship.roll) * 5.0 * dt;

    // Boundary wrap/clamp in the strait
    if (this.ship.x > this.width + 60) {
      // Completed passage through the Strait of Messina!
      this.ship.x = -40;
      this.ship.y = this.height * 0.48;
      this.ship.hull = Math.min(100, this.ship.hull + 20);
    } else if (this.ship.x < -60) {
      this.ship.x = -60;
      this.ship.vx = Math.max(10, this.ship.vx);
    }

    // Wake trail point
    if (Math.hypot(this.ship.vx, this.ship.vy) > 8.0) {
      this.wakeTrail.push({
        x: this.ship.x - cosH * 28,
        y: this.ship.y - sinH * 28,
        alpha: 0.75,
        width: 6.0
      });
    }
    for (let i = this.wakeTrail.length - 1; i >= 0; i--) {
      this.wakeTrail[i].alpha -= dt * 0.4;
      this.wakeTrail[i].width += dt * 8.0;
      if (this.wakeTrail[i].alpha <= 0) {
        this.wakeTrail.splice(i, 1);
      }
    }

    // Charybdis Abyss Core Hazards
    const distToCharybdis = hydro.r;
    if (distToCharybdis < this.charybdisPos.coreRadius * 1.1) {
      if (this.charybdisPhase === 'SWALLOW') {
        // Sucked into abyssal abyss!
        this.ship.hull -= 35.0 * dt;
        this.ship.angularVel += 4.5 * dt; // violent spin
        if (this.ship.hull <= 0) {
          this.capsizeShip();
        }
      } else if (this.charybdisPhase === 'SPOUT') {
        // Blasted by roaring geyser
        this.ship.hull -= 15.0 * dt;
        this.ship.vx += (this.ship.x - this.charybdisPos.x) * 4.0 * dt;
        this.ship.vy += (this.ship.y - this.charybdisPos.y) * 4.0 * dt;
      }
    }

    // Cliff collision hazards (Scylla's rocks)
    if (this.ship.y < this.cliffWaterlineY + 12) {
      this.ship.hull -= 40.0 * dt;
      this.ship.vy = Math.max(25, this.ship.vy + 60 * dt);
      this.spawnSpray(this.ship.x, this.cliffWaterlineY + 10, 8, '#FFFFFF');
      if (this.ship.hull <= 0) {
        this.capsizeShip();
      }
    }
  }

  capsizeShip() {
    this.ship.isDestroyed = true;
    this.ship.hull = 0;
    this.ship.crew = 0;

    // Spawn wreckage debris
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 50;
      this.debrisList.push({
        x: this.ship.x + (Math.random() - 0.5) * 20,
        y: this.ship.y + (Math.random() - 0.5) * 15,
        vx: this.ship.vx * 0.4 + Math.cos(angle) * spd,
        vy: this.ship.vy * 0.4 + Math.sin(angle) * spd,
        angle: Math.random() * Math.PI * 2,
        vAngular: (Math.random() - 0.5) * 4,
        type: i % 2 === 0 ? 'plank' : 'broken_oar',
        scale: 0.8 + Math.random() * 0.5,
        hp: 1.0
      });
    }

    this.spawnSpray(this.ship.x, this.ship.y, 40, '#E0FAFF');
  }

  updateScylla(dt) {
    const baseReach = 180.0 * this.scyllaReachAggression;

    for (let i = 0; i < this.scyllaHeads.length; i++) {
      const head = this.scyllaHeads[i];
      head.stateTimer -= dt;

      // Distance from head anchor to ship
      const distToShip = Math.hypot(this.ship.x - head.anchorX, this.ship.y - head.anchorY);
      const isShipInRange = !this.ship.isDestroyed && distToShip < baseReach && this.ship.y < this.cliffWaterlineY + 140;

      // State Machine
      switch (head.state) {
        case 'COILED':
          // Rest near cave entrance with sinuous breathing motion
          head.targetX = head.anchorX + Math.sin(this.time * 1.5 + i) * 22;
          head.targetY = head.anchorY + 65 + Math.cos(this.time * 2.0 + i) * 14;
          head.jawOpen = 0.1;
          head.eyeGlow = 0.5;

          if (isShipInRange && head.stateTimer <= 0) {
            head.state = 'TRACKING';
            head.stateTimer = 1.2 + Math.random() * 0.8;
          }
          break;

        case 'TRACKING':
          // Coiling and rearing back to strike
          head.targetX = this.ship.x + (head.anchorX - this.ship.x) * 0.35;
          head.targetY = head.anchorY + 90;
          head.jawOpen = 0.4 + Math.sin(this.time * 8.0) * 0.2;
          head.eyeGlow = 0.95;

          if (head.stateTimer <= 0) {
            head.state = 'LUNGING';
            head.stateTimer = 1.0;
          }
          break;

        case 'LUNGING':
          // Sudden lightning strike downward to snatch a sailor
          head.targetX = this.ship.x + (Math.sin(i) * 10);
          head.targetY = this.ship.y - 4;
          head.jawOpen = 1.0;
          head.eyeGlow = 1.0;

          // Check if jaws reach ship deck
          const tipDist = Math.hypot(head.headX - this.ship.x, head.headY - this.ship.y);
          if (tipDist < 36.0 && this.ship.crew > 0 && !head.snatchedVictim) {
            // Snatched a sailor!
            this.ship.crew--;
            head.snatchedVictim = {
              name: `Ithacan Oarsman ${6 - this.ship.crew}`,
              struggleTimer: 2.0
            };
            head.state = 'SNATCHED';
            head.stateTimer = 0.4;
            // Snatch effects
            this.spawnSpray(this.ship.x, this.ship.y, 25, '#FF5A5F');
            this.spawnSpray(this.ship.x, this.ship.y, 15, '#E0FAFF');
          } else if (head.stateTimer <= 0) {
            head.state = 'RETRACTING';
            head.stateTimer = 1.5;
          }
          break;

        case 'SNATCHED':
          head.targetY = head.headY - 60 * dt;
          head.jawOpen = 0.2;
          if (head.stateTimer <= 0) {
            head.state = 'RETRACTING';
            head.stateTimer = 2.2;
          }
          break;

        case 'RETRACTING':
          // Retract back up to cave with victim
          head.targetX = head.anchorX;
          head.targetY = head.anchorY + 50;
          head.jawOpen = head.snatchedVictim ? 0.15 : 0.05;
          head.eyeGlow = 0.4;

          if (head.stateTimer <= 0) {
            head.snatchedVictim = null;
            head.state = 'COILED';
            head.stateTimer = head.strikeCooldown;
          }
          break;
      }

      // Smooth Head Tip movement
      const moveSpd = head.state === 'LUNGING' ? 9.5 : 4.0;
      head.headX += (head.targetX - head.headX) * moveSpd * dt;
      head.headY += (head.targetY - head.headY) * moveSpd * dt;

      // Inverse Kinematics / Segment Constraint Solving for the neck
      this.solveNeckKinematics(head);
    }
  }

  solveNeckKinematics(head) {
    const joints = head.joints;
    const len = head.segmentLength;

    // Forward pass from head to anchor
    joints[joints.length - 1].x = head.headX;
    joints[joints.length - 1].y = head.headY;

    for (let j = joints.length - 2; j >= 0; j--) {
      const cur = joints[j];
      const next = joints[j + 1];
      const dx = cur.x - next.x;
      const dy = cur.y - next.y;
      const d = Math.max(0.001, Math.hypot(dx, dy));
      cur.x = next.x + (dx / d) * len;
      cur.y = next.y + (dy / d) * len;
    }

    // Backward pass: anchor joint 0 to cliff base
    joints[0].x = head.anchorX;
    joints[0].y = head.anchorY;

    for (let j = 1; j < joints.length; j++) {
      const prev = joints[j - 1];
      const cur = joints[j];
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const d = Math.max(0.001, Math.hypot(dx, dy));
      cur.x = prev.x + (dx / d) * len;
      cur.y = prev.y + (dy / d) * len;
    }
  }

  updateVortexParticles(dt) {
    for (let i = 0; i < this.vortexParticles.length; i++) {
      const p = this.vortexParticles[i];
      p.life += dt;

      const hydro = this.getHydrodynamicVelocity(p.x, p.y);
      p.vx = hydro.vx;
      p.vy = hydro.vy;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Despawn if near center during swallow, or if reached maxLife, or if out of bounds
      const dist = hydro.r;
      const isSwallowed = this.charybdisPhase === 'SWALLOW' && dist < this.charybdisPos.coreRadius * 0.65;
      const isOutOfBounds = p.x < -100 || p.x > this.width + 100 || p.y < -50 || p.y > this.height + 100;

      if (p.life >= p.maxLife || isSwallowed || isOutOfBounds) {
        this.vortexParticles[i] = this.createVortexParticle(false);
      }
    }
  }

  updateSprayParticles(dt) {
    for (let i = this.sprayParticles.length - 1; i >= 0; i--) {
      const s = this.sprayParticles[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 45.0 * dt; // gravity
      s.size *= 0.98;

      if (s.life <= 0) {
        this.sprayParticles.splice(i, 1);
      }
    }
  }

  updateDebris(dt) {
    for (let i = 0; i < this.debrisList.length; i++) {
      const d = this.debrisList[i];
      const hydro = this.getHydrodynamicVelocity(d.x, d.y);

      d.vx += (hydro.vx - d.vx) * 1.5 * dt;
      d.vy += (hydro.vy - d.vy) * 1.5 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      d.angle += d.vAngular * dt;

      // If sucked into center during swallow, respawn at entrance
      if (this.charybdisPhase === 'SWALLOW' && hydro.r < this.charybdisPos.coreRadius * 0.7) {
        d.x = -20 - Math.random() * 60;
        d.y = this.height * 0.45 + (Math.random() - 0.5) * 120;
        d.vx = 20;
        d.vy = 0;
      }

      // Strait bounds wrap
      if (d.x > this.width + 50) {
        d.x = -40;
        d.y = this.height * (0.35 + Math.random() * 0.45);
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* PARTICLE SPAWNERS                                                          */
  /* -------------------------------------------------------------------------- */

  spawnShipOarSpray(count = 10) {
    const cosH = Math.cos(this.ship.heading);
    const sinH = Math.sin(this.ship.heading);
    for (let i = 0; i < count; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const lateralDist = side * (this.ship.width * 0.75 + Math.random() * 12);
      const longDist = (Math.random() - 0.5) * (this.ship.length * 0.6);

      const px = this.ship.x + cosH * longDist - sinH * lateralDist;
      const py = this.ship.y + sinH * longDist + cosH * lateralDist;

      this.sprayParticles.push({
        x: px,
        y: py,
        vx: this.ship.vx * 0.3 + (-sinH * side * (20 + Math.random() * 30)),
        vy: this.ship.vy * 0.3 + (cosH * side * (20 + Math.random() * 30)),
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 1.5 + Math.random() * 2.2,
        alpha: 0.8,
        color: '#FFFFFF'
      });
    }
  }

  spawnSpray(x, y, count, color = '#FFFFFF') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 60;
      this.sprayParticles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 25,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.85,
        color
      });
    }
  }

  spawnGeyserSpray() {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (this.charybdisPos.coreRadius * 0.85);
    const px = this.charybdisPos.x + Math.cos(angle) * r;
    const py = this.charybdisPos.y + Math.sin(angle) * r;

    this.sprayParticles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * (40 + Math.random() * 90),
      vy: Math.sin(angle) * (40 + Math.random() * 90) - (80 + Math.random() * 120),
      life: 0.6 + Math.random() * 0.8,
      maxLife: 1.4,
      size: 2.0 + Math.random() * 3.5,
      alpha: 0.9,
      color: Math.random() < 0.4 ? '#E0FAFF' : '#70D6FF'
    });
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING PIPELINE                                                         */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    ctx.save();

    // 1. Swirling Deep Indigo Sea Base
    this.renderSeaBackground(ctx);

    // 2. Charybdis Whirlpool Abyss & Vortex Funnel
    this.renderCharybdis(ctx);

    // 3. Vortex Foam Streamlines & Currents
    this.renderVortexStreamlines(ctx);

    // 4. Floating Shipwreck Debris
    this.renderDebris(ctx);

    // 5. Odysseus' Penteconter Ship & Oars
    this.renderShip(ctx);

    // 6. Sea Spray & Geyser Mist
    this.renderSpray(ctx);

    // 7. Scylla's Towering Sea Cliffs & Serpentine Heads
    this.renderScyllaCliffs(ctx);
    this.renderScyllaHeads(ctx);

    // 8. Nautical HUD & Telemetry
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderSeaBackground(ctx) {
    // Deep Mediterranean indigo gradient
    const seaGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    seaGrad.addColorStop(0, '#061325'); // dark shadowed under cliffs
    seaGrad.addColorStop(0.35, '#0B2545');
    seaGrad.addColorStop(0.7, '#071E3D');
    seaGrad.addColorStop(1.0, '#030E1F');

    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle water caustics / flow bands
    ctx.save();
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.05)';
    ctx.lineWidth = 1.5;
    const bandStep = 45;
    for (let y = this.cliffWaterlineY + 15; y < this.height; y += bandStep) {
      ctx.beginPath();
      for (let x = 0; x <= this.width; x += 30) {
        const wave = Math.sin(x * 0.015 + y * 0.02 + this.time * 1.5) * 6;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  renderCharybdis(ctx) {
    const cx = this.charybdisPos.x;
    const cy = this.charybdisPos.y;
    const maxR = this.charybdisPos.outerRadius;
    const coreR = this.charybdisPos.coreRadius;

    ctx.save();

    // Concentric swirling suction abyss gradient
    const vortexGrad = ctx.createRadialGradient(cx, cy, coreR * 0.2, cx, cy, maxR);
    if (this.charybdisPhase === 'SWALLOW') {
      vortexGrad.addColorStop(0, '#000000'); // bottomless abyss
      vortexGrad.addColorStop(0.18, '#030D1A');
      vortexGrad.addColorStop(0.45, '#072540');
      vortexGrad.addColorStop(0.8, '#0A3B5C');
      vortexGrad.addColorStop(1.0, 'rgba(10, 59, 92, 0)');
    } else if (this.charybdisPhase === 'SPOUT') {
      vortexGrad.addColorStop(0, '#E0FAFF'); // blinding foam geyser core
      vortexGrad.addColorStop(0.12, '#48CAE4');
      vortexGrad.addColorStop(0.35, '#0B4F6C');
      vortexGrad.addColorStop(0.8, '#072A40');
      vortexGrad.addColorStop(1.0, 'rgba(7, 42, 64, 0)');
    } else {
      vortexGrad.addColorStop(0, '#041726');
      vortexGrad.addColorStop(0.3, '#0A3B5C');
      vortexGrad.addColorStop(1.0, 'rgba(10, 59, 92, 0)');
    }

    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fill();

    // Swirling spiral arms (golden ratio logarithmic spiral bands)
    const armCount = 5;
    const rotBase = this.time * (this.vortexSuctionStrength * 1.4);
    ctx.lineWidth = 2.0;

    for (let a = 0; a < armCount; a++) {
      const armOffset = (a * (Math.PI * 2)) / armCount;
      ctx.strokeStyle = this.charybdisPhase === 'SPOUT' ? 'rgba(224, 250, 255, 0.45)' : 'rgba(72, 202, 228, 0.25)';
      ctx.beginPath();

      for (let r = coreR * 0.7; r < maxR * 0.95; r += 6) {
        // Spiral theta: theta = log(r/b) / k + rotation
        const theta = armOffset + rotBase - (r / 50.0);
        const sx = cx + Math.cos(theta) * r;
        const sy = cy + Math.sin(theta) * r;
        if (r === coreR * 0.7) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Abyssal maw core ring
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    if (this.charybdisPhase === 'SWALLOW') {
      ctx.fillStyle = '#010307';
      ctx.fill();
      ctx.strokeStyle = 'rgba(72, 202, 228, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.charybdisPhase === 'SPOUT') {
      ctx.fillStyle = 'rgba(240, 250, 255, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderVortexStreamlines(ctx) {
    ctx.save();
    for (let i = 0; i < this.vortexParticles.length; i++) {
      const p = this.vortexParticles[i];
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Velocity trail line
      if (Math.hypot(p.vx, p.vy) > 15) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderDebris(ctx) {
    ctx.save();
    for (let i = 0; i < this.debrisList.length; i++) {
      const d = this.debrisList[i];
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.scale(d.scale, d.scale);

      if (d.type === 'plank') {
        ctx.fillStyle = '#5A3D28';
        ctx.fillRect(-12, -3, 24, 6);
        ctx.strokeStyle = '#382516';
        ctx.lineWidth = 1;
        ctx.strokeRect(-12, -3, 24, 6);
      } else if (d.type === 'amphora') {
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-10, -2, 3, 4);
      } else if (d.type === 'barrel') {
        ctx.fillStyle = '#6E4720';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1F1710';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (d.type === 'broken_oar') {
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(-16, -1.5, 32, 3);
        ctx.fillStyle = '#C4A482';
        ctx.fillRect(10, -4, 8, 8);
      }

      ctx.restore();
    }
    ctx.restore();
  }

  renderShip(ctx) {
    if (this.ship.isDestroyed) {
      // Burned/broken hull wreckage icon
      ctx.save();
      ctx.translate(this.ship.x, this.ship.y);
      ctx.rotate(this.ship.heading);
      ctx.fillStyle = '#2C1810';
      ctx.fillRect(-20, -8, 40, 16);
      ctx.strokeStyle = '#FF3333';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-20, -8, 40, 16);
      ctx.restore();
      return;
    }

    // Wake trail rendering
    ctx.save();
    for (let i = 0; i < this.wakeTrail.length; i++) {
      const w = this.wakeTrail[i];
      ctx.fillStyle = `rgba(224, 250, 255, ${w.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.width, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(this.ship.x, this.ship.y);
    ctx.rotate(this.ship.heading);

    // Roll tilt projection: scales vertically to simulate hull heel
    const rollScaleY = Math.cos(this.ship.roll);
    ctx.scale(1.0, rollScaleY);

    // Hull Shadow on water
    ctx.fillStyle = 'rgba(0, 8, 20, 0.45)';
    ctx.beginPath();
    ctx.ellipse(3, 8 * (this.ship.roll > 0 ? 1 : -1), 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Drag Anchor (Drogue) line if deployed
    if (this.ship.anchorDeployed) {
      ctx.save();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(-32, 0);
      ctx.lineTo(-65, Math.sin(this.time * 6.0) * 4);
      ctx.stroke();

      // Canvas Drogue cone
      ctx.setLineDash([]);
      ctx.fillStyle = '#A88932';
      ctx.beginPath();
      ctx.moveTo(-65, -6);
      ctx.lineTo(-80, 0);
      ctx.lineTo(-65, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. 50 Oars (25 Port & 25 Starboard)
    const oarCountPerSide = 12; // 12 rendered pairs represents penteconter banks
    const oarSwing = Math.sin(this.ship.rowCycle) * 0.35;
    const oarLength = 22;

    ctx.strokeStyle = '#C2A370';
    ctx.lineWidth = 1.6;

    for (let i = 0; i < oarCountPerSide; i++) {
      const oarX = -20 + i * 3.4;

      // Port oars (top)
      const portAngle = -Math.PI / 2 + oarSwing;
      ctx.beginPath();
      ctx.moveTo(oarX, -8);
      ctx.lineTo(oarX + Math.cos(portAngle) * oarLength, -8 + Math.sin(portAngle) * oarLength);
      ctx.stroke();

      // Starboard oars (bottom)
      const starAngle = Math.PI / 2 - oarSwing;
      ctx.beginPath();
      ctx.moveTo(oarX, 8);
      ctx.lineTo(oarX + Math.cos(starAngle) * oarLength, 8 + Math.sin(starAngle) * oarLength);
      ctx.stroke();
    }

    // 3. Wooden Hull Planking
    const hl = this.ship.length * 0.5;
    const hw = this.ship.width * 0.5;

    ctx.beginPath();
    // Bow: Sharp Greek Bronze Ram (Embolos)
    ctx.moveTo(hl + 6, 0);
    // Starboard curve
    ctx.bezierCurveTo(hl - 8, hw, -hl + 12, hw, -hl, 0);
    // Port curve
    ctx.bezierCurveTo(-hl + 12, -hw, hl - 8, -hw, hl + 6, 0);
    ctx.closePath();

    ctx.fillStyle = '#3D2514'; // Dark Greek pitch hull
    ctx.fill();
    ctx.strokeStyle = '#634125';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Deck planking
    ctx.fillStyle = '#8B653E';
    ctx.beginPath();
    ctx.ellipse(0, 0, hl - 10, hw - 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bronze Ram Prow (Embolos)
    ctx.fillStyle = '#D4AF37'; // Bronze
    ctx.beginPath();
    ctx.moveTo(hl - 2, -3);
    ctx.lineTo(hl + 12, 0);
    ctx.lineTo(hl - 2, 3);
    ctx.closePath();
    ctx.fill();

    // Greek Bow Eye (Ophthalmos - Apotropaic eye painted on prow)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(hl - 6, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1D63B8';
    ctx.beginPath();
    ctx.arc(hl - 6, -4, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Gunwale Shields
    const shieldCount = 6;
    for (let s = 0; s < shieldCount; s++) {
      const sx = -16 + s * 6;
      ctx.fillStyle = s % 2 === 0 ? '#B22222' : '#D4AF37';
      ctx.beginPath();
      ctx.arc(sx, -hw + 1, 2.2, 0, Math.PI * 2);
      ctx.arc(sx, hw - 1, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mast & Furled Sail
    ctx.fillStyle = '#4A3525';
    ctx.fillRect(-2, -hw + 2, 4, (hw - 2) * 2); // yardarm
    ctx.fillStyle = '#E8E1D5';
    ctx.fillRect(-3, -hw + 3, 6, (hw - 3) * 2); // furled linen canvas

    // Crew Figures on Deck
    const aliveCrew = this.ship.crew;
    ctx.fillStyle = '#E0AC69'; // Skin/garb
    for (let c = 0; c < 6; c++) {
      if (c < aliveCrew) {
        const cx = -14 + c * 5.5;
        const cy = (c % 2 === 0 ? -3 : 3);
        ctx.beginPath();
        ctx.arc(cx, cy, 2.0, 0, Math.PI * 2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(cx - 1.5, cy - 2, 3, 1.5);
        ctx.fillStyle = '#E0AC69';
      }
    }

    // Odysseus at Helm (Stern)
    ctx.fillStyle = '#990000'; // Red cloak of Ithaca
    ctx.beginPath();
    ctx.arc(-hl + 8, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Twin Steering Oars (Pedalia) at stern
    const rudderAngle = this.ship.rudderInput * 0.4;
    ctx.strokeStyle = '#A67B48';
    ctx.lineWidth = 2.2;
    // Port rudder
    ctx.beginPath();
    ctx.moveTo(-hl + 4, -6);
    ctx.lineTo(-hl - 12 + Math.cos(rudderAngle) * 4, -10 + Math.sin(rudderAngle) * 8);
    ctx.stroke();
    // Starboard rudder
    ctx.beginPath();
    ctx.moveTo(-hl + 4, 6);
    ctx.lineTo(-hl - 12 + Math.cos(rudderAngle) * 4, 10 + Math.sin(rudderAngle) * 8);
    ctx.stroke();

    ctx.restore();
  }

  renderSpray(ctx) {
    ctx.save();
    for (let i = 0; i < this.sprayParticles.length; i++) {
      const s = this.sprayParticles[i];
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.alpha * (s.life / s.maxLife));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderScyllaCliffs(ctx) {
    ctx.save();

    // Jagged Basalt Sea Cliffs Silhouette
    const cliffH = this.cliffWaterlineY;
    const grad = ctx.createLinearGradient(0, 0, 0, cliffH);
    grad.addColorStop(0, '#100E14');
    grad.addColorStop(0.7, '#1C1924');
    grad.addColorStop(1.0, '#2C2738');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.width, 0);
    ctx.lineTo(this.width, cliffH);

    // Procedural craggy rock silhouette along waterline
    for (let x = this.width; x >= 0; x -= 25) {
      const jagged = Math.sin(x * 0.08) * 9 + Math.cos(x * 0.02) * 14;
      ctx.lineTo(x, cliffH + jagged);
    }
    ctx.closePath();
    ctx.fill();

    // Shadowed Cavern Entrances where the 6 heads emerge
    for (let i = 0; i < this.scyllaHeads.length; i++) {
      const h = this.scyllaHeads[i];
      ctx.fillStyle = '#06050A';
      ctx.beginPath();
      ctx.ellipse(h.anchorX, h.anchorY, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#181424';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Crashing White Surf at cliff base
    ctx.strokeStyle = 'rgba(230, 245, 255, 0.55)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += 15) {
      const surf = Math.sin(x * 0.1 + this.time * 4) * 4 + Math.cos(x * 0.04) * 6;
      const y = cliffH + 6 + surf;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  renderScyllaHeads(ctx) {
    ctx.save();

    for (let i = 0; i < this.scyllaHeads.length; i++) {
      const head = this.scyllaHeads[i];
      const joints = head.joints;

      // 1. Serpentine Shadow on Water
      ctx.strokeStyle = 'rgba(0, 5, 15, 0.35)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j < joints.length; j++) {
        const shadowY = joints[j].y + 16;
        if (j === 0) ctx.moveTo(joints[j].x + 6, shadowY);
        else ctx.lineTo(joints[j].x + 6, shadowY);
      }
      ctx.stroke();

      // 2. Serpentine Muscular Neck Segments
      for (let j = 0; j < joints.length - 1; j++) {
        const p1 = joints[j];
        const p2 = joints[j + 1];
        const t = j / joints.length;
        const segWidth = 14 * (1.1 - t * 0.4);

        ctx.strokeStyle = j % 2 === 0 ? '#1E332B' : '#14241E'; // Dark scaly reptilian green
        ctx.lineWidth = segWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Dorsal spines
        if (j % 2 === 1) {
          const midX = (p1.x + p2.x) * 0.5;
          const midY = (p1.y + p2.y) * 0.5;
          const normalX = -(p2.y - p1.y) * 0.5;
          const normalY = (p2.x - p1.x) * 0.5;
          ctx.strokeStyle = '#2F4F42';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX + normalX, midY + normalY);
          ctx.stroke();
        }
      }

      // 3. Serpentine Head & Jaws
      const tip = joints[joints.length - 1];
      const prev = joints[joints.length - 2];
      const headAngle = Math.atan2(tip.y - prev.y, tip.x - prev.x);

      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(headAngle);

      // Skull
      ctx.fillStyle = '#182C24';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upper Jaw & Fangs
      ctx.fillStyle = '#12211B';
      ctx.beginPath();
      ctx.moveTo(4, -5);
      ctx.lineTo(18, -3 - head.jawOpen * 4);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();

      // Lower Jaw
      ctx.beginPath();
      ctx.moveTo(4, 5);
      ctx.lineTo(18, 3 + head.jawOpen * 6);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();

      // Needle Fangs (Ivory)
      ctx.fillStyle = '#FAF0E6';
      ctx.fillRect(10, -4 - head.jawOpen * 3, 2, 4);
      ctx.fillRect(14, -3 - head.jawOpen * 3, 2, 5);
      ctx.fillRect(10, 2 + head.jawOpen * 4, 2, 4);

      // Glowing Terrifying Eye
      ctx.fillStyle = `rgba(255, 60, 40, ${head.eyeGlow})`;
      ctx.beginPath();
      ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Snatched Sailor being dragged into the cave
      if (head.snatchedVictim) {
        ctx.fillStyle = '#E0AC69';
        ctx.fillRect(14, 0, 6, 4);
        ctx.fillStyle = '#990000';
        ctx.fillRect(16, 2, 5, 3);
      }

      ctx.restore();
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

    // Top status strip
    const pad = 16;
    const boxW = narrow ? Math.min(sw - 32, 220) : 260;
    const boxH = 88;

    ctx.fillStyle = 'rgba(6, 12, 22, 0.78)';
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(pad, pad, boxW, boxH);
    ctx.strokeRect(pad, pad, boxW, boxH);

    // Title
    ctx.fillStyle = '#D4AF37'; // Classical Greek Gold
    ctx.font = 'bold 12px monospace';
    ctx.fillText('FRETUM SICULUM (MESSINA)', pad + 10, pad + 18);

    // Hull Integrity Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px monospace';
    ctx.fillText(`PENTECONTER HULL: ${Math.max(0, Math.round(this.ship.hull))}%`, pad + 10, pad + 36);

    const barW = narrow ? 110 : 140;
    const barH = 7;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(pad + 10, pad + 42, barW, barH);

    const hullRatio = Math.max(0, this.ship.hull / this.ship.maxHull);
    ctx.fillStyle = hullRatio > 0.5 ? '#2EC4B6' : (hullRatio > 0.25 ? '#FFBF69' : '#FF5A5F');
    ctx.fillRect(pad + 10, pad + 42, barW * hullRatio, barH);

    // Ithacan Crew Status
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`ITHACAN ROWERS: ${this.ship.crew} / 6`, pad + 10, pad + 66);
    // Render helmet dots
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i < this.ship.crew ? '#D4AF37' : '#555555';
      ctx.beginPath();
      ctx.arc(pad + (narrow ? 125 : 145) + i * (narrow ? 11 : 14), pad + 63, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Anchor status indicator
    if (this.ship.anchorDeployed) {
      ctx.fillStyle = '#48CAE4';
      ctx.fillText('⚓ DROGUE DEPLOYED', pad + 10, pad + 81);
    } else if (this.ship.isSurging) {
      ctx.fillStyle = '#FFBF69';
      ctx.fillText('⚡ ROWERS SURGE!', pad + 10, pad + 81);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('HELM: STEERING EAST', pad + 10, pad + 81);
    }

    if (!narrow) {
      // Top-Right Charybdis State indicator
      const trW = 210;
      const trH = 50;
      const trX = sw - trW - pad;
      ctx.fillStyle = 'rgba(6, 12, 22, 0.78)';
      ctx.strokeStyle = this.charybdisPhase === 'SWALLOW' ? 'rgba(72, 202, 228, 0.4)' : 'rgba(255, 90, 95, 0.5)';
      ctx.fillRect(trX, pad, trW, trH);
      ctx.strokeRect(trX, pad, trW, trH);

      ctx.fillStyle = this.charybdisPhase === 'SWALLOW' ? '#48CAE4' : (this.charybdisPhase === 'SPOUT' ? '#FF5A5F' : '#FFBF69');
      ctx.font = 'bold 11px monospace';
      const phaseLabel = this.charybdisPhase === 'SWALLOW' ? 'CHARYBDIS: SUCKING ABYSS' : (this.charybdisPhase === 'SPOUT' ? 'CHARYBDIS: FOAM GEYSER' : 'CHARYBDIS: SLACK CHURN');
      ctx.fillText(phaseLabel, trX + 10, pad + 20);

      const cycleRemaining = Math.max(0, this.charybdisCyclePeriod - this.charybdisCycleTimer);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '10px monospace';
      ctx.fillText(`CYCLE NEXT: ${cycleRemaining.toFixed(1)}s`, trX + 10, pad + 38);
    }

    ctx.restore();
  }
}
