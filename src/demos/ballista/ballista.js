// Ballista: Roman Torsion Siege Engine & Fortification Physics
// Grounded in Vitruvius (De Architectura Book X) and Pliny the Elder (Naturalis Historia)
// Zero external dependencies — pure ES module

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class BallistaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Scaling
    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    // Ballistics & Torsion Parameters
    this.tension = 1200; // Winch tension: 100N to 2000N
    this.elevation = 32; // Launch elevation angle: 0° to 75°
    this.wind = 15; // Crosswind deflection: -50 to 50 m/s
    this.gravity = 440; // Simulated gravity (px/s^2)
    this.ammoType = 'heavy'; // 'heavy', 'pitch', 'triple'

    // Ballista Mechanics State
    this.recoil = 0; // Recoil displacement (px)
    this.recoilVel = 0; // Recoil velocity
    this.armTwist = 0; // Arm rotation deflection
    this.isDraggingAim = false;
    this.isAiming = false;
    this.mousePos = { x: 0, y: 0 };
    this.lastFireTime = 0;

    // Entities
    this.bolts = [];
    this.blocks = [];
    this.debris = [];
    this.particles = [];
    this.fireParticles = [];
    this.smokeParticles = [];

    // Sound Synthesizer (Safe Web Audio)
    this.audioCtx = null;

    // Initialize UI and Simulation State
    this.initControls();
    this.reset();
    attachTouchBridge(this, canvas);
  }

  // Safe Web Audio Synthesizer
  initAudio() {
    if (this.audioCtx || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.audioCtx = new AudioContextClass();
      } catch {
        this.audioCtx = null;
      }
    }
  }

  playSound(type) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    if (type === 'launch') {
      // Wood snap + heavy cord release
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === 'impact_stone') {
      // Deep masonry shattering thud
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.25);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    } else if (type === 'impact_wood') {
      // Splintering timber crack
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Ammunition Type</label>
        <div class="control-btn-grid" id="ballista-ammo-selector">
          <button class="sub-btn active" data-ammo="heavy" title="Armor-Piercing Iron Bolt">🏹 Heavy Bolt</button>
          <button class="sub-btn" data-ammo="pitch" title="Incendiary Pitch Bolt">🔥 Pitch Bolt</button>
          <button class="sub-btn" data-ammo="triple" title="Triple Scythian Volley">🎯 Triple Spread</button>
        </div>
      </div>

      <div class="control-group">
        <label>
          <span>Torsion Winch Tension</span>
          <span id="ballista-tension-val">${this.tension} N</span>
        </label>
        <input type="range" id="ballista-tension" min="100" max="2000" step="25" value="${this.tension}">
      </div>

      <div class="control-group">
        <label>
          <span>Launch Elevation Angle</span>
          <span id="ballista-elevation-val">${this.elevation}°</span>
        </label>
        <input type="range" id="ballista-elevation" min="0" max="75" step="1" value="${this.elevation}">
      </div>

      <div class="control-group">
        <label>
          <span>Crosswind Deflection</span>
          <span id="ballista-wind-val">${this.wind > 0 ? '+' + this.wind : this.wind} m/s</span>
        </label>
        <input type="range" id="ballista-wind" min="-50" max="50" step="2" value="${this.wind}">
      </div>

      <div class="control-group" style="margin-top: 4px; display: flex; flex-direction: column; gap: 6px;">
        <button id="ballista-fire-btn" class="sub-btn" style="background: rgba(200, 50, 50, 0.35); border-color: var(--accent-crimson, #c83232); color: #fff; font-weight: bold; padding: 9px;">
          ⚡ FIRE BALLISTA (Space)
        </button>
        <button id="ballista-rebuild-btn" class="sub-btn" style="border-color: var(--accent-gold, #d4af37); padding: 7px;">
          🛡️ Rebuild Barbarian Stronghold
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.25); border-radius: 6px; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #a0a6b6; line-height: 1.5;">
        <div><strong>Stored Energy:</strong> <span id="telemetry-energy">0 J</span></div>
        <div><strong>Muzzle Velocity:</strong> <span id="telemetry-vel">0 m/s</span></div>
        <div><strong>Flight Ballistics:</strong> Aero Drag & Crosswind</div>
      </div>
    `;

    // Ammunition Buttons
    const ammoBtns = this.controlsContainer.querySelectorAll('#ballista-ammo-selector .sub-btn');
    ammoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ammoBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ammoType = btn.dataset.ammo;
        this.updateTelemetry();
      });
    });

    // Tension Slider
    const tensionSlider = this.controlsContainer.querySelector('#ballista-tension');
    const tensionVal = this.controlsContainer.querySelector('#ballista-tension-val');
    if (tensionSlider) {
      tensionSlider.addEventListener('input', (e) => {
        this.tension = parseFloat(e.target.value);
        if (tensionVal) tensionVal.textContent = `${this.tension} N`;
        this.updateTelemetry();
      });
    }

    // Elevation Slider
    const elevSlider = this.controlsContainer.querySelector('#ballista-elevation');
    const elevVal = this.controlsContainer.querySelector('#ballista-elevation-val');
    if (elevSlider) {
      elevSlider.addEventListener('input', (e) => {
        this.elevation = parseFloat(e.target.value);
        if (elevVal) elevVal.textContent = `${this.elevation}°`;
        this.updateTelemetry();
      });
    }

    // Crosswind Slider
    const windSlider = this.controlsContainer.querySelector('#ballista-wind');
    const windVal = this.controlsContainer.querySelector('#ballista-wind-val');
    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.wind = parseFloat(e.target.value);
        if (windVal) windVal.textContent = `${this.wind > 0 ? '+' + this.wind : this.wind} m/s`;
      });
    }

    // Fire Button
    const fireBtn = this.controlsContainer.querySelector('#ballista-fire-btn');
    if (fireBtn) {
      fireBtn.addEventListener('click', () => {
        this.fire();
      });
    }

    // Rebuild Button
    const rebuildBtn = this.controlsContainer.querySelector('#ballista-rebuild-btn');
    if (rebuildBtn) {
      rebuildBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    this.updateTelemetry();
  }

  updateTelemetry() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const energyEl = this.controlsContainer.querySelector('#telemetry-energy');
    const velEl = this.controlsContainer.querySelector('#telemetry-vel');

    const m = this.getBoltMass(this.ammoType);
    const stroke = 1.25; // 1.25m torsion draw stroke
    const storedJoules = Math.round(this.tension * stroke * 0.95);
    const eff = 0.76; // Mechanical release efficiency
    const muzzleVel = Math.round(Math.sqrt((2 * eff * storedJoules) / m));

    if (energyEl) energyEl.textContent = `${storedJoules} Joules`;
    if (velEl) velEl.textContent = `${muzzleVel} m/s (${(muzzleVel * 3.6).toFixed(0)} km/h)`;
  }

  getBoltMass(type) {
    if (type === 'heavy') return 1.6; // 1.6 kg dense forged iron head
    if (type === 'pitch') return 0.85; // 0.85 kg pitch-wrapped incendiary
    return 0.52; // 0.52 kg light Scythian bolt
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    // Keep ballista and target scaled to viewport
    this.repositionEntities();
  }

  repositionEntities() {
    // If blocks haven't been built yet, build them
    if (this.blocks.length === 0) {
      this.buildStronghold();
    }
  }

  reset() {
    this.bolts = [];
    this.debris = [];
    this.particles = [];
    this.fireParticles = [];
    this.smokeParticles = [];
    this.recoil = 0;
    this.recoilVel = 0;
    this.buildStronghold();
    this.updateTelemetry();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.bolts = [];
    this.blocks = [];
    this.debris = [];
    this.particles = [];
    this.fireParticles = [];
    this.smokeParticles = [];
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  getEntityCount() {
    const activeBolts = this.bolts.filter(b => b.active).length;
    const activeBlocks = this.blocks.filter(b => b.active).length;
    const activeDebris = this.debris.filter(d => d.active).length;
    return activeBolts + activeBlocks + activeDebris;
  }

  // Build Destructible Barbarian Stronghold & Roman Fortifications
  buildStronghold() {
    this.blocks = [];
    const groundY = this.height - 85;
    const targetStartX = Math.max(this.width * 0.58, 480);

    // 1. Stone Foundation & Gateway Bastion
    // 6 columns x 7 courses of Ashlar masonry blocks
    const blockW = 34;
    const blockH = 18;
    const cols = 7;
    const rows = 9;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Leave opening for archway at lower middle
        if (r < 3 && (c === 3 || c === 4)) continue;

        const bx = targetStartX + c * (blockW + 1);
        const by = groundY - (r + 1) * (blockH + 1);

        // Stone blocks
        const isKeystone = r === 3 && (c === 3 || c === 4);
        const isCrenel = r === rows - 1 && c % 2 === 0;

        // Skip gaps in crenellations atop wall
        if (r === rows - 1 && c % 2 === 1) continue;

        this.blocks.push({
          x: bx,
          y: by,
          w: blockW,
          h: blockH,
          vx: 0,
          vy: 0,
          angle: 0,
          vAngle: 0,
          mass: isKeystone ? 12 : 9,
          hp: isKeystone ? 160 : 120,
          maxHp: isKeystone ? 160 : 120,
          material: 'stone',
          color: isKeystone ? '#8e8674' : (c % 2 === 0 ? '#6e7078' : '#7d7b82'),
          onFire: false,
          fireTime: 0,
          active: true,
          settled: true
        });
      }
    }

    // 2. Barbarian Wooden Siege Watchtower (Built to the right of stone wall)
    const towerX = targetStartX + cols * (blockW + 1) + 24;
    const tWoodW = 28;
    const tWoodH = 14;
    const towerFloors = 11;

    for (let f = 0; f < towerFloors; f++) {
      // Left vertical timber upright
      this.blocks.push({
        x: towerX,
        y: groundY - (f + 1) * (tWoodH + 2),
        w: 14,
        h: tWoodH,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        mass: 3.5,
        hp: 55,
        maxHp: 55,
        material: 'wood',
        color: '#6e4e37',
        onFire: false,
        fireTime: 0,
        active: true,
        settled: true
      });

      // Right vertical timber upright
      this.blocks.push({
        x: towerX + 60,
        y: groundY - (f + 1) * (tWoodH + 2),
        w: 14,
        h: tWoodH,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        mass: 3.5,
        hp: 55,
        maxHp: 55,
        material: 'wood',
        color: '#7a573e',
        onFire: false,
        fireTime: 0,
        active: true,
        settled: true
      });

      // Horizontal deck platform every 3 levels
      if (f % 3 === 2 || f === towerFloors - 1) {
        this.blocks.push({
          x: towerX - 6,
          y: groundY - (f + 1) * (tWoodH + 2) - 4,
          w: 86,
          h: 8,
          vx: 0,
          vy: 0,
          angle: 0,
          vAngle: 0,
          mass: 5.0,
          hp: 45,
          maxHp: 45,
          material: 'wood',
          color: '#8b6243',
          onFire: false,
          fireTime: 0,
          active: true,
          settled: true
        });
      }
    }

    // Tower Battlement / Barbarian Banner Platform
    const topFloorY = groundY - (towerFloors + 1) * (tWoodH + 2);
    this.blocks.push({
      x: towerX + 16,
      y: topFloorY - 10,
      w: 42,
      h: 18,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      mass: 4.0,
      hp: 40,
      maxHp: 40,
      material: 'wood',
      color: '#9e3028', // Painted barbarian war totem block
      onFire: false,
      fireTime: 0,
      active: true,
      settled: true
    });

    // 3. Wooden Palisade Stakes in front of the wall
    for (let p = 0; p < 4; p++) {
      this.blocks.push({
        x: targetStartX - 32 - p * 16,
        y: groundY - 24,
        w: 10,
        h: 24,
        vx: 0,
        vy: 0,
        angle: -0.15,
        vAngle: 0,
        mass: 2.5,
        hp: 35,
        maxHp: 35,
        material: 'wood',
        color: '#5c402d',
        onFire: false,
        fireTime: 0,
        active: true,
        settled: true
      });
    }
  }

  // Launch Mechanism
  fire() {
    this.initAudio();
    this.playSound('launch');

    const m = this.getBoltMass(this.ammoType);
    const stroke = 1.25;
    const storedJoules = this.tension * stroke * 0.95;
    const eff = 0.76;
    // Speed in pixels per second: ~450 to 1100 px/s
    const realSpeedMs = Math.sqrt((2 * eff * storedJoules) / m);
    const speed = realSpeedMs * 16.5;

    // Ballista Muzzle Coordinates
    const muzzle = this.getMuzzlePosition();
    const rad = (this.elevation * Math.PI) / 180;

    // Trigger frame recoil
    this.recoil = 18;
    this.recoilVel = -80;

    if (this.ammoType === 'triple') {
      // Scythian 3-bolt fan spread
      const spreadAngles = [-0.065, 0, 0.065];
      spreadAngles.forEach((offset, idx) => {
        const a = rad + offset;
        const s = speed * (1.0 + (idx === 1 ? 0.05 : -0.04));
        this.spawnBolt({
          x: muzzle.x - Math.sin(rad) * (idx - 1) * 8,
          y: muzzle.y + Math.cos(rad) * (idx - 1) * 8,
          vx: Math.cos(a) * s,
          vy: -Math.sin(a) * s,
          mass: m,
          drag: 0.0014,
          type: 'triple',
          damage: 85,
          color: '#d4af37'
        });
      });
    } else if (this.ammoType === 'pitch') {
      this.spawnBolt({
        x: muzzle.x,
        y: muzzle.y,
        vx: Math.cos(rad) * speed,
        vy: -Math.sin(rad) * speed,
        mass: m,
        drag: 0.0022,
        type: 'pitch',
        damage: 95,
        color: '#ff6611'
      });
    } else {
      // Heavy Iron Bolt
      this.spawnBolt({
        x: muzzle.x,
        y: muzzle.y,
        vx: Math.cos(rad) * speed,
        vy: -Math.sin(rad) * speed,
        mass: m,
        drag: 0.0011,
        type: 'heavy',
        damage: 175,
        color: '#424854'
      });
    }

    // Launch Muzzle Smoke / Dust Puff
    for (let i = 0; i < 14; i++) {
      const pAngle = rad + (Math.random() - 0.5) * 0.8;
      const pSpeed = Math.random() * 80 + 30;
      this.particles.push({
        x: muzzle.x,
        y: muzzle.y,
        vx: Math.cos(pAngle) * pSpeed,
        vy: -Math.sin(pAngle) * pSpeed,
        radius: Math.random() * 4 + 2,
        color: 'rgba(180, 165, 140, 0.6)',
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  spawnBolt(spec) {
    this.bolts.push({
      x: spec.x,
      y: spec.y,
      prevX: spec.x,
      prevY: spec.y,
      vx: spec.vx,
      vy: spec.vy,
      mass: spec.mass,
      drag: spec.drag,
      type: spec.type,
      damage: spec.damage,
      color: spec.color,
      length: spec.type === 'heavy' ? 32 : 26,
      angle: Math.atan2(spec.vy, spec.vx),
      active: true,
      pierceCount: spec.type === 'heavy' ? 2 : 0,
      trail: []
    });
  }

  getBallistaOrigin() {
    const groundY = this.height - 85;
    return {
      x: Math.max(90, this.width * 0.14),
      y: groundY - 30
    };
  }

  getMuzzlePosition() {
    const origin = this.getBallistaOrigin();
    const rad = (this.elevation * Math.PI) / 180;
    const barrelLength = 65 - this.recoil;
    return {
      x: origin.x + Math.cos(rad) * barrelLength,
      y: origin.y - Math.sin(rad) * barrelLength
    };
  }

  // Simulation Update Loop
  update(dt) {
    // Clamp delta time to avoid spiral of death
    const clampedDt = Math.min(dt, 0.05);

    // Update Recoil Spring Oscillation
    if (this.recoil !== 0 || this.recoilVel !== 0) {
      const springK = 350;
      const damping = 18;
      const accel = -springK * this.recoil - damping * this.recoilVel;
      this.recoilVel += accel * clampedDt;
      this.recoil += this.recoilVel * clampedDt;
      if (Math.abs(this.recoil) < 0.05 && Math.abs(this.recoilVel) < 0.5) {
        this.recoil = 0;
        this.recoilVel = 0;
      }
    }

    // 1. Update Projectile Bolts
    this.updateBolts(clampedDt);

    // 2. Update Fortification Blocks & Fire Spread
    this.updateBlocks(clampedDt);

    // 3. Update Fracture Debris
    this.updateDebris(clampedDt);

    // 4. Update Particle Systems
    this.updateParticles(clampedDt);
  }

  updateBolts(dt) {
    const groundY = this.height - 85;

    for (let i = 0; i < this.bolts.length; i++) {
      const b = this.bolts[i];
      if (!b.active) continue;

      b.prevX = b.x;
      b.prevY = b.y;

      // Aerodynamic Drag with Crosswind
      // Relative velocity: v_rel = (vx - wind, vy)
      const relVx = b.vx - this.wind * 2.2;
      const relVy = b.vy;
      const speedRel = Math.sqrt(relVx * relVx + relVy * relVy);

      // F_drag = 0.5 * rho * Cd * A * v_rel^2
      const dragMag = b.drag * speedRel * speedRel;
      const dragAx = speedRel > 0.001 ? -(relVx / speedRel) * dragMag : 0;
      const dragAy = speedRel > 0.001 ? -(relVy / speedRel) * dragMag : 0;

      // Integrate velocity
      b.vx += dragAx * dt;
      b.vy += (this.gravity + dragAy) * dt;

      // Integrate position
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Projectile orientation follows velocity vector
      b.angle = Math.atan2(b.vy, b.vx);

      // Record Trail for rendering
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 18) b.trail.shift();

      // Pitch Bolt Flame / Smoke Particles
      if (b.type === 'pitch') {
        for (let p = 0; p < 2; p++) {
          this.fireParticles.push({
            x: b.x - Math.cos(b.angle) * 12 + (Math.random() - 0.5) * 4,
            y: b.y - Math.sin(b.angle) * 12 + (Math.random() - 0.5) * 4,
            vx: -b.vx * 0.15 + (Math.random() - 0.5) * 30 + this.wind * 0.5,
            vy: -b.vy * 0.15 - Math.random() * 40 - 15,
            radius: Math.random() * 3.5 + 2,
            life: 0.35,
            maxLife: 0.35
          });
        }
      }

      // Check Collision with Target Blocks (Continuous Segment Sweep)
      this.checkBoltBlockCollisions(b);

      // Check Ground Impact
      if (b.y >= groundY) {
        b.y = groundY;
        b.active = false;
        this.spawnImpactParticles(b.x, b.y, '#9e8c6e', 12);
        this.playSound('impact_stone');
      }

      // Offscreen Boundary Check
      if (b.x > this.width + 120 || b.x < -60 || b.y > this.height + 60) {
        b.active = false;
      }
    }
  }

  checkBoltBlockCollisions(bolt) {
    if (!bolt.active) return;

    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      if (!block.active) continue;

      // Continuous collision test: line segment (bolt.prevX, bolt.prevY) -> (bolt.x, bolt.y) vs block rect
      if (this.segmentIntersectsRect(bolt.prevX, bolt.prevY, bolt.x, bolt.y, block)) {
        // Impact detected!
        const boltSpeed = Math.sqrt(bolt.vx * bolt.vx + bolt.vy * bolt.vy);
        const impulseMag = (bolt.mass * boltSpeed) / block.mass;

        // Transfer momentum
        block.settled = false;
        block.vx += (bolt.vx / boltSpeed) * impulseMag * 0.65;
        block.vy += (bolt.vy / boltSpeed) * impulseMag * 0.65 - 15;
        block.vAngle += (Math.random() - 0.5) * (impulseMag * 0.04);

        // Apply Damage
        block.hp -= bolt.damage;

        // Audio & Visual impact
        if (block.material === 'stone') {
          this.playSound('impact_stone');
          this.spawnImpactParticles(bolt.x, bolt.y, '#afb2be', 16);
        } else {
          this.playSound('impact_wood');
          this.spawnImpactParticles(bolt.x, bolt.y, '#8b6243', 14);
        }

        // Pitch bolt ignites wooden structures!
        if (bolt.type === 'pitch' && block.material === 'wood') {
          block.onFire = true;
          this.spawnImpactParticles(bolt.x, bolt.y, '#ff4400', 20);
        }

        // Destruction Check
        if (block.hp <= 0) {
          block.active = false;
          this.shatterBlock(block, bolt.vx, bolt.vy);
        }

        // Heavy bolt armor piercing handling
        if (bolt.type === 'heavy' && bolt.pierceCount > 0) {
          bolt.pierceCount--;
          bolt.vx *= 0.65;
          bolt.vy *= 0.65;
        } else {
          bolt.active = false;
          break;
        }
      }
    }
  }

  segmentIntersectsRect(x1, y1, x2, y2, rect) {
    const rx = rect.x;
    const ry = rect.y;
    const rw = rect.w;
    const rh = rect.h;

    // Fast rejection if segment bounding box does not overlap rect
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) {
      return false;
    }

    // If start or end point is inside rect
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
    if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

    // Line intersection against the 4 boundaries
    return (
      this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
      this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
      this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
      this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry)
    );
  }

  lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  shatterBlock(block, impactVx, impactVy) {
    const pieces = block.material === 'stone' ? 5 : 4;
    const speed = Math.sqrt(impactVx * impactVx + impactVy * impactVy);

    for (let i = 0; i < pieces; i++) {
      const angle = Math.random() * Math.PI * 2;
      const pSpeed = (Math.random() * 0.4 + 0.2) * Math.min(speed, 350) + 40;
      this.debris.push({
        x: block.x + block.w * 0.5 + (Math.random() - 0.5) * block.w * 0.5,
        y: block.y + block.h * 0.5 + (Math.random() - 0.5) * block.h * 0.5,
        vx: (impactVx * 0.25) + Math.cos(angle) * pSpeed,
        vy: (impactVy * 0.25) - Math.sin(angle) * pSpeed - 30,
        w: block.w * 0.35 + Math.random() * 4,
        h: block.h * 0.35 + Math.random() * 4,
        angle: Math.random() * Math.PI,
        vAngle: (Math.random() - 0.5) * 12,
        color: block.color,
        material: block.material,
        active: true,
        life: 4.5,
        maxLife: 4.5
      });
    }
  }

  updateBlocks(dt) {
    const groundY = this.height - 85;

    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (!b.active) continue;

      // Fire physics on wooden target structures
      if (b.onFire) {
        b.fireTime += dt;
        b.hp -= 22 * dt;

        // Emit dynamic fire & smoke particles
        if (Math.random() < 0.7) {
          this.fireParticles.push({
            x: b.x + Math.random() * b.w,
            y: b.y + Math.random() * b.h,
            vx: (Math.random() - 0.5) * 20 + this.wind * 0.4,
            vy: -Math.random() * 50 - 20,
            radius: Math.random() * 4 + 2,
            life: 0.45,
            maxLife: 0.45
          });
        }
        if (Math.random() < 0.4) {
          this.smokeParticles.push({
            x: b.x + Math.random() * b.w,
            y: b.y,
            vx: (Math.random() - 0.5) * 15 + this.wind * 0.6,
            vy: -Math.random() * 40 - 15,
            radius: Math.random() * 7 + 4,
            life: 0.8,
            maxLife: 0.8
          });
        }

        // Spread fire to adjacent wooden blocks
        for (let j = 0; j < this.blocks.length; j++) {
          const neighbor = this.blocks[j];
          if (neighbor.active && !neighbor.onFire && neighbor.material === 'wood') {
            const dx = (b.x + b.w * 0.5) - (neighbor.x + neighbor.w * 0.5);
            const dy = (b.y + b.h * 0.5) - (neighbor.y + neighbor.h * 0.5);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 42 && Math.random() < 0.08) {
              neighbor.onFire = true;
            }
          }
        }

        // Structural burn collapse
        if (b.hp <= 0) {
          b.active = false;
          this.shatterBlock(b, 0, 0);
          continue;
        }
      }

      // Physics Integration if not settled
      if (!b.settled) {
        b.vy += this.gravity * dt;
        b.vx *= 0.985;
        b.vy *= 0.99;
        b.vAngle *= 0.96;

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.angle += b.vAngle * dt;

        // Ground Collision
        if (b.y + b.h >= groundY) {
          b.y = groundY - b.h;
          b.vy = -b.vy * 0.22;
          b.vx *= 0.72;
          b.vAngle *= 0.65;

          if (Math.abs(b.vy) < 10 && Math.abs(b.vx) < 5) {
            b.settled = true;
            b.vx = 0;
            b.vy = 0;
            b.vAngle = 0;
          }
        }

        // Simple Stacking / Collision against other blocks
        for (let j = 0; j < this.blocks.length; j++) {
          if (i === j) continue;
          const other = this.blocks[j];
          if (!other.active) continue;

          // AABB overlap check
          if (
            b.x < other.x + other.w &&
            b.x + b.w > other.x &&
            b.y < other.y + other.h &&
            b.y + b.h > other.y
          ) {
            // Push out vertically or horizontally
            const overlapX = (b.w + other.w) * 0.5 - Math.abs((b.x + b.w * 0.5) - (other.x + other.w * 0.5));
            const overlapY = (b.h + other.h) * 0.5 - Math.abs((b.y + b.h * 0.5) - (other.y + other.h * 0.5));

            if (overlapY < overlapX) {
              if (b.y < other.y) {
                b.y -= overlapY;
                b.vy = -b.vy * 0.18;
                other.settled = false;
                other.vy += 15;
              } else {
                b.y += overlapY;
                b.vy = 0;
              }
            } else {
              if (b.x < other.x) {
                b.x -= overlapX * 0.5;
                other.x += overlapX * 0.5;
              } else {
                b.x += overlapX * 0.5;
                other.x -= overlapX * 0.5;
              }
              b.vx *= 0.8;
            }
          }
        }
      }
    }
  }

  updateDebris(dt) {
    const groundY = this.height - 85;

    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i];
      if (!d.active) continue;

      d.vy += this.gravity * dt;
      d.vx += (this.wind * 0.1) * dt;
      d.vx *= 0.98;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.angle += d.vAngle * dt;

      if (d.y + d.h >= groundY) {
        d.y = groundY - d.h;
        d.vy = -d.vy * 0.3;
        d.vx *= 0.7;
        d.vAngle *= 0.7;
      }

      d.life -= dt;
      if (d.life <= 0) {
        d.active = false;
      }
    }
  }

  updateParticles(dt) {
    // Normal Impact Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Fire Particles
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const f = this.fireParticles[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.radius *= 0.97;
      f.life -= dt;
      if (f.life <= 0) {
        this.fireParticles.splice(i, 1);
      }
    }

    // Smoke Particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const s = this.smokeParticles[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.radius += 12 * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  spawnImpactParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 110 + 30;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        radius: Math.random() * 3.5 + 1.5,
        color: color,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  // Visual Rendering Pipeline
  render(ctx) {
    if (!ctx) return;

    // 1. Atmosphere & Sky Gradient
    this.renderAtmosphere(ctx);

    // 2. Distant Roman Siege Encampment & Hills
    this.renderDistantScenery(ctx);

    // 3. Terrain & Ground Ramparts
    this.renderTerrain(ctx);

    // 4. Parabolic Flight Trajectory Arc Preview
    this.renderTrajectoryPreview(ctx);

    // 5. Destructible Fortification Blocks
    this.renderBlocks(ctx);

    // 6. Fracture Debris
    this.renderDebris(ctx);

    // 7. Bolts and Trails
    this.renderBolts(ctx);

    // 8. Fire, Smoke & Spark Particles
    this.renderParticles(ctx);

    // 9. Detailed Roman Timber & Bronze Ballista
    this.renderBallista(ctx);

    // 10. HUD Overlay & Wind Vane
    this.renderHUD(ctx);
  }

  renderAtmosphere(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#10141f'); // Deep Roman twilight
    grad.addColorStop(0.45, '#1e202e');
    grad.addColorStop(0.8, '#44322d'); // Burnt terracotta / dusk glow
    grad.addColorStop(1, '#1b1614');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderDistantScenery(ctx) {
    const groundY = this.height - 85;

    // Distant Apennine Mountains Silhouette
    ctx.fillStyle = 'rgba(28, 30, 42, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(0, groundY - 120);
    ctx.lineTo(this.width * 0.25, groundY - 170);
    ctx.lineTo(this.width * 0.55, groundY - 110);
    ctx.lineTo(this.width * 0.8, groundY - 180);
    ctx.lineTo(this.width, groundY - 130);
    ctx.lineTo(this.width, groundY);
    ctx.closePath();
    ctx.fill();

    // Distant Roman Aqueduct Silhouette
    ctx.fillStyle = 'rgba(40, 36, 42, 0.55)';
    const aqStartX = this.width * 0.15;
    const aqW = this.width * 0.35;
    const aqTop = groundY - 60;
    ctx.fillRect(aqStartX, aqTop, aqW, 8);
    for (let x = aqStartX + 15; x < aqStartX + aqW - 20; x += 30) {
      ctx.fillRect(x, aqTop + 8, 8, 52);
      ctx.beginPath();
      ctx.arc(x + 15, aqTop + 14, 11, Math.PI, 0);
      ctx.fill();
    }
  }

  renderTerrain(ctx) {
    const groundY = this.height - 85;

    // Ballista Siege Rampart Mound
    const bPos = this.getBallistaOrigin();
    ctx.fillStyle = '#3a342a';
    ctx.beginPath();
    ctx.moveTo(0, groundY + 15);
    ctx.quadraticCurveTo(bPos.x * 0.5, bPos.x * 0.1 + groundY - 25, bPos.x + 85, groundY);
    ctx.lineTo(0, groundY);
    ctx.closePath();
    ctx.fill();

    // Main Ground Strip
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    groundGrad.addColorStop(0, '#2c251d');
    groundGrad.addColorStop(0.15, '#1e1913');
    groundGrad.addColorStop(1, '#0e0c0a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // Roman Earthwork / Rampart Timber Fasces
    ctx.strokeStyle = '#5a4933';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // Small decorative grass and siege pebbles
    ctx.fillStyle = '#4a4435';
    for (let x = 10; x < this.width; x += 45) {
      ctx.fillRect(x, groundY - 2, 8, 2);
    }
  }

  renderTrajectoryPreview(ctx) {
    const muzzle = this.getMuzzlePosition();
    const rad = (this.elevation * Math.PI) / 180;
    const m = this.getBoltMass(this.ammoType);
    const stroke = 1.25;
    const storedJoules = this.tension * stroke * 0.95;
    const eff = 0.76;
    const speed = Math.sqrt((2 * eff * storedJoules) / m) * 16.5;

    let simX = muzzle.x;
    let simY = muzzle.y;
    let simVx = Math.cos(rad) * speed;
    let simVy = -Math.sin(rad) * speed;
    const dtSim = 0.032;
    const groundY = this.height - 85;

    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'; // Roman Gold dotted preview
    ctx.beginPath();
    ctx.moveTo(simX, simY);

    for (let step = 0; step < 55; step++) {
      const relVx = simVx - this.wind * 2.2;
      const speedRel = Math.sqrt(relVx * relVx + simVy * simVy);
      const drag = (this.ammoType === 'heavy' ? 0.0011 : 0.0022) * speedRel * speedRel;

      simVx -= (relVx / (speedRel || 1)) * drag * dtSim;
      simVy += (this.gravity - (simVy / (speedRel || 1)) * drag) * dtSim;

      simX += simVx * dtSim;
      simY += simVy * dtSim;

      ctx.lineTo(simX, simY);
      if (simY >= groundY || simX > this.width) break;
    }
    ctx.stroke();
    ctx.restore();
  }

  renderBlocks(ctx) {
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (!b.active) continue;

      ctx.save();
      ctx.translate(b.x + b.w * 0.5, b.y + b.h * 0.5);
      ctx.rotate(b.angle);

      // Block Base Fill
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);

      // Material Detailing & Textures
      if (b.material === 'stone') {
        // Ashlar bevel highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-b.w * 0.5 + 1, -b.h * 0.5 + 1, b.w - 2, b.h - 2);

        // Chisel fracture lines if damaged
        if (b.hp < b.maxHp * 0.7) {
          ctx.strokeStyle = '#222';
          ctx.beginPath();
          ctx.moveTo(-b.w * 0.3, -b.h * 0.4);
          ctx.lineTo(b.w * 0.2, b.h * 0.3);
          ctx.stroke();
        }
      } else {
        // Timber wood grain & bronze rivets
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-b.w * 0.4, 0);
        ctx.lineTo(b.w * 0.4, 0);
        ctx.stroke();

        ctx.fillStyle = '#b28b48';
        ctx.fillRect(-b.w * 0.4, -b.h * 0.35, 2, 2);
        ctx.fillRect(b.w * 0.4 - 2, -b.h * 0.35, 2, 2);
      }

      // Burning Char / Glowing Embers
      if (b.onFire) {
        ctx.fillStyle = 'rgba(255, 60, 0, 0.45)';
        ctx.fillRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);
      }

      ctx.restore();
    }
  }

  renderDebris(ctx) {
    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i];
      if (!d.active) continue;

      const alpha = Math.min(1, d.life / 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.w * 0.5, -d.h * 0.5, d.w, d.h);
      ctx.restore();
    }
  }

  renderBolts(ctx) {
    for (let i = 0; i < this.bolts.length; i++) {
      const b = this.bolts[i];
      if (!b.active) continue;

      // Vapor / Motion Trail
      if (b.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = b.type === 'pitch' ? 'rgba(255, 90, 20, 0.35)' : 'rgba(200, 205, 220, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Bolt Body & Head
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Wooden Ash Shaft
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(-b.length, -1.8, b.length, 3.6);

      // Bronze/Iron Armor-Piercing Head (Pyramidal Roman Bodkin)
      ctx.fillStyle = b.type === 'heavy' ? '#2a2e36' : (b.type === 'pitch' ? '#ff4400' : '#d4af37');
      ctx.beginPath();
      ctx.moveTo(0, -3.5);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 3.5);
      ctx.closePath();
      ctx.fill();

      // Incendiary Pitch Wrap
      if (b.type === 'pitch') {
        ctx.fillStyle = '#ff7700';
        ctx.beginPath();
        ctx.arc(-6, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bronze Fletching / Vanes
      ctx.fillStyle = '#c5a059';
      ctx.beginPath();
      ctx.moveTo(-b.length, -3);
      ctx.lineTo(-b.length + 6, -1.8);
      ctx.lineTo(-b.length, 0);
      ctx.lineTo(-b.length + 6, 1.8);
      ctx.lineTo(-b.length, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  renderParticles(ctx) {
    // Normal Impact Sparks & Dust
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Fiery Pitch Embers
    for (let i = 0; i < this.fireParticles.length; i++) {
      const f = this.fireParticles[i];
      ctx.save();
      ctx.globalAlpha = f.life / f.maxLife;
      const radGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      radGrad.addColorStop(0, '#fff4a0');
      radGrad.addColorStop(0.4, '#ff6a00');
      radGrad.addColorStop(1, 'rgba(200, 20, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Billowing Pitch Smoke
    for (let i = 0; i < this.smokeParticles.length; i++) {
      const s = this.smokeParticles[i];
      ctx.save();
      ctx.globalAlpha = (s.life / s.maxLife) * 0.4;
      ctx.fillStyle = '#222026';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderBallista(ctx) {
    const origin = this.getBallistaOrigin();
    const rad = (this.elevation * Math.PI) / 180;
    const recoilOffset = this.recoil;

    ctx.save();

    // 1. Fixed Plinth & Support Brackets (Timber Pedestal)
    ctx.fillStyle = '#4a3625';
    ctx.fillRect(origin.x - 28, origin.y, 56, 32);

    // Bronze Plinth Plate & Studs
    ctx.fillStyle = '#b8923a';
    ctx.fillRect(origin.x - 24, origin.y + 26, 48, 4);
    for (let s = -20; s <= 20; s += 10) {
      ctx.beginPath();
      ctx.arc(origin.x + s, origin.y + 28, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Elevation Strut & Sector Gear
    ctx.strokeStyle = '#6a4e32';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(origin.x - 14, origin.y + 12);
    ctx.lineTo(origin.x + Math.cos(rad) * 22, origin.y - Math.sin(rad) * 22);
    ctx.stroke();

    // 2. Elevating Swivel Chassis & Dovetail Stock (Scapus)
    ctx.translate(origin.x, origin.y);
    ctx.rotate(-rad);

    // Stock beam kicks back with recoil
    const stockX = -recoilOffset;

    // Heavy Stock (Scapus) Beam
    ctx.fillStyle = '#5c432d';
    ctx.fillRect(stockX - 35, -7, 95, 14);

    // Polished Brass Dovetail Guide Groove
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(stockX - 25, -2, 85, 4);

    // Rear Winch Ratchet Crank (Ergates) & Spindle
    ctx.fillStyle = '#8f6f2e';
    ctx.beginPath();
    ctx.arc(stockX - 28, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crank Handle
    ctx.strokeStyle = '#b8923a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(stockX - 28, 0);
    ctx.lineTo(stockX - 38, -8);
    ctx.stroke();

    // 3. Torsion Head Frame (Capitulum)
    // Twin vertical skein housings for twisted sinew cords
    const headX = stockX + 48;

    // Capitulum bronze frame
    ctx.fillStyle = '#9c792b';
    ctx.fillRect(headX - 6, -32, 14, 64);

    // Top & Bottom Bronze Tension Washers (Epizygis)
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(headX + 1, -32, 6, 0, Math.PI * 2);
    ctx.arc(headX + 1, 32, 6, 0, Math.PI * 2);
    ctx.fill();

    // Twisted Skeins of Horsehair / Sinew Cords (Funiculi)
    ctx.strokeStyle = '#3e2e20';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(headX + 1, -30);
    ctx.lineTo(headX + 1, -8);
    ctx.moveTo(headX + 1, 8);
    ctx.lineTo(headX + 1, 30);
    ctx.stroke();

    // Twisted cord spiral wraps
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    for (let y = -28; y <= -10; y += 4) {
      ctx.beginPath();
      ctx.moveTo(headX - 3, y);
      ctx.lineTo(headX + 5, y + 2);
      ctx.stroke();
    }
    for (let y = 10; y <= 28; y += 4) {
      ctx.beginPath();
      ctx.moveTo(headX - 3, y);
      ctx.lineTo(headX + 5, y + 2);
      ctx.stroke();
    }

    // 4. Elastic Bow Arms (Brachia)
    // Arms sweep forward or backward depending on recoil and tension
    const armAngle = 0.42 - (this.recoil * 0.018);

    // Upper Arm
    ctx.save();
    ctx.translate(headX + 1, -20);
    ctx.rotate(-armAngle);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(-2, -34, 5, 34);
    ctx.fillStyle = '#b8923a';
    ctx.fillRect(-3, -38, 7, 6); // Bronze arm tip
    ctx.restore();

    // Lower Arm
    ctx.save();
    ctx.translate(headX + 1, 20);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(-2, 0, 5, 34);
    ctx.fillStyle = '#b8923a';
    ctx.fillRect(-3, 32, 7, 6);
    ctx.restore();

    // 5. Taut Torsion Bowstring (Nerous)
    const upperTipX = headX + 1 + Math.sin(armAngle) * 34;
    const upperTipY = -20 - Math.cos(armAngle) * 34;
    const lowerTipX = headX + 1 + Math.sin(armAngle) * 34;
    const lowerTipY = 20 + Math.cos(armAngle) * 34;
    const triggerClawX = stockX - 18;

    ctx.strokeStyle = '#f0e6d2'; // Taut twisted gut cord
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(upperTipX, upperTipY);
    ctx.lineTo(triggerClawX, 0);
    ctx.lineTo(lowerTipX, lowerTipY);
    ctx.stroke();

    // 6. Loaded Projectile resting on slider
    ctx.fillStyle = this.ammoType === 'heavy' ? '#2a2e36' : (this.ammoType === 'pitch' ? '#ff5500' : '#d4af37');
    ctx.fillRect(triggerClawX, -1.8, 30, 3.6);

    ctx.restore();
  }

  renderHUD(ctx) {
    const origin = this.getBallistaOrigin();

    // Roman Vexillum / Wind Indicator Flag atop Siege Hill
    ctx.save();
    const flagPoleX = origin.x - 45;
    const flagPoleY = origin.y - 40;

    // Pole
    ctx.strokeStyle = '#7a5e3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(flagPoleX, flagPoleY + 50);
    ctx.lineTo(flagPoleX, flagPoleY);
    ctx.stroke();

    // Golden Roman Eagle / Spear Finial
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(flagPoleX, flagPoleY - 7);
    ctx.lineTo(flagPoleX - 4, flagPoleY);
    ctx.lineTo(flagPoleX + 4, flagPoleY);
    ctx.closePath();
    ctx.fill();

    // Fluttering Vexillum Banner reacting to crosswind
    const windEffect = this.wind * 0.65;
    ctx.fillStyle = '#b02424'; // Roman Imperial Crimson
    ctx.beginPath();
    ctx.moveTo(flagPoleX, flagPoleY + 2);
    ctx.lineTo(flagPoleX + windEffect + (this.wind >= 0 ? 24 : -24), flagPoleY + 8);
    ctx.lineTo(flagPoleX + windEffect + (this.wind >= 0 ? 20 : -20), flagPoleY + 28);
    ctx.lineTo(flagPoleX, flagPoleY + 22);
    ctx.closePath();
    ctx.fill();

    // Wind HUD Legend
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    ctx.fillStyle = '#d4af37';
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText(`WIND: ${this.wind > 0 ? '+' + this.wind : this.wind} m/s`, (flagPoleX - 25) / ui, (flagPoleY + 62) / ui);
    ctx.restore();

    ctx.restore();
  }

  // Interactive Input Handling
  onMouseDown(pos) {
    this.initAudio();
    this.isDraggingAim = true;
    this.updateAimFromPointer(pos);
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    if (this.isDraggingAim) {
      this.updateAimFromPointer(pos);
    }
  }

  onMouseUp(pos) {
    if (this.isDraggingAim) {
      this.isDraggingAim = false;
      // Fire if dragged and released with intention
      if (pos && pos.x > this.width * 0.25) {
        this.fire();
      }
    }
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Enter') {
      this.fire();
      if (e && e.preventDefault) e.preventDefault();
    } else if (key === '1') {
      this.setAmmoType('heavy');
    } else if (key === '2') {
      this.setAmmoType('pitch');
    } else if (key === '3') {
      this.setAmmoType('triple');
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === 'ArrowUp') {
      this.setElevation(Math.min(75, this.elevation + 2));
    } else if (key === 'ArrowDown') {
      this.setElevation(Math.max(0, this.elevation - 2));
    }
  }

  setAmmoType(type) {
    this.ammoType = type;
    if (!this.controlsContainer) return;
    const btns = this.controlsContainer.querySelectorAll('#ballista-ammo-selector .sub-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.ammo === type);
    });
    this.updateTelemetry();
  }

  setElevation(deg) {
    this.elevation = deg;
    if (!this.controlsContainer) return;
    const slider = this.controlsContainer.querySelector('#ballista-elevation');
    const val = this.controlsContainer.querySelector('#ballista-elevation-val');
    if (slider) slider.value = deg;
    if (val) val.textContent = `${deg}°`;
    this.updateTelemetry();
  }

  updateAimFromPointer(pos) {
    if (!pos) return;
    const origin = this.getBallistaOrigin();
    const dx = pos.x - origin.x;
    const dy = origin.y - pos.y;
    if (dx > 5) {
      let angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      angleDeg = Math.max(0, Math.min(75, angleDeg));
      this.setElevation(angleDeg);
    }
  }
}
