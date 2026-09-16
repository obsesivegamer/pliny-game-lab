// Trireme: Roman Naval Warfare & Hydrodynamic Ramming Physics
// Pliny Game Lab — Pavilion V: Fabula & Arena
// Grounded in classical naval mechanics (Pliny the Elder, Naturalis Historia; Polybius, The Histories)
// Pure ES module — Zero external dependencies

export class TriremeEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport & Canvas scaling
    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation Timing & Environment
    this.time = 0;
    this.screenShake = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Fleet & Projectile Collections
    this.ships = [];
    this.wakeParticles = [];
    this.bolts = [];
    this.splinters = [];
    this.floatingDebris = [];
    this.floatingTexts = [];

    // Player Flagship Controls & Tuning
    this.cadence = 28; // Strokes Per Minute (SPM): 10 to 60
    this.rudderAngle = 0; // Degrees: -35 (port) to +35 (starboard)
    this.targetRudderAngle = 0;
    this.isRammingSpeed = false;
    this.rammingTimer = 0;
    this.rammingDuration = 3.5; // seconds of sprint
    this.rammingCooldown = 0;

    // Input States
    this.keys = {
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false
    };
    this.mousePos = { x: this.width * 0.7, y: this.height * 0.5 };
    this.isMouseDown = false;
    this.lastPlayerBallistaFire = 0;

    // Audio Synthesizer (Safe Web Audio)
    this.audioCtx = null;
    this.lastDrumTime = 0;

    // Game / Fleet Score Stats
    this.enemiesSunk = 0;
    this.rammingKills = 0;

    // Initialize UI and Simulation State
    this.initControls();
    this.reset();
  }

  /* -------------------------------------------------------------------------- */
  /* SAFE WEB AUDIO SYNTHESIZER                                                 */
  /* -------------------------------------------------------------------------- */

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

  playSound(type, param = 1) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    const t = this.audioCtx.currentTime;

    try {
      if (type === 'drum') {
        // Deep resonant hortator rhythm drum
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        const baseFreq = param > 1.2 ? 95 : 80;
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.22);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      } else if (type === 'ram_impact') {
        // Massive bronze rostrum crunch & wood splinter shockwave
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);
        gain.gain.setValueAtTime(0.55 * Math.min(1.5, param), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.45);

        // Sub rumble
        const sub = this.audioCtx.createOscillator();
        const subGain = this.audioCtx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(55, t);
        sub.frequency.exponentialRampToValueAtTime(15, t + 0.5);
        subGain.gain.setValueAtTime(0.45, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        sub.connect(subGain);
        subGain.connect(this.audioCtx.destination);
        sub.start(t);
        sub.stop(t + 0.55);
      } else if (type === 'ballista') {
        // Torsion cord snap + whoosh
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.14);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      } else if (type === 'splash') {
        // Water displacement splash
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } else if (type === 'sink') {
        // Deep gurgling plunge
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(75, t);
        osc.frequency.exponentialRampToValueAtTime(18, t + 0.7);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.75);
      }
    } catch {
      // Ignore audio synthesis glitches in non-standard browsers
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION & FLEET BUILDER                                             */
  /* -------------------------------------------------------------------------- */

  reset() {
    this.time = 0;
    this.screenShake = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this.cadence = 28;
    this.rudderAngle = 0;
    this.targetRudderAngle = 0;
    this.isRammingSpeed = false;
    this.rammingTimer = 0;
    this.rammingCooldown = 0;

    this.ships = [];
    this.wakeParticles = [];
    this.bolts = [];
    this.splinters = [];
    this.floatingDebris = [];
    this.floatingTexts = [];

    // Create Roman Flagship Trireme (Player)
    this.playerShip = this.createShip({
      id: 'player',
      name: 'Victoria (Flagship)',
      team: 'roman',
      x: this.width * 0.24,
      y: this.height * 0.5,
      heading: 0, // facing East (+X)
      length: 82,
      width: 22,
      mass: 880,
      hull: 100,
      maxHull: 100,
      colorHull: '#8B0000', // Roman Red
      colorTrim: '#D4AF37', // Gold/Bronze
      colorDeck: '#6B4226',
      shieldColor: '#B22222',
      sailColor: '#FFFFFF',
      isPlayer: true
    });
    this.ships.push(this.playerShip);

    // Create Adversary Fleet (Carthaginian / Pirate Triremes)
    const enemyConfigs = [
      {
        id: 'enemy_1',
        name: 'Baal-Hamon (Vanguard)',
        x: this.width * 0.76,
        y: this.height * 0.35,
        heading: Math.PI, // facing West
        length: 80,
        width: 21,
        mass: 840,
        colorHull: '#1A1E2E',
        colorTrim: '#702963',
        colorDeck: '#4A3525',
        shieldColor: '#5C1D58',
        sailColor: '#D8BFD8'
      },
      {
        id: 'enemy_2',
        name: 'Melqart (Heavy Trireme)',
        x: this.width * 0.82,
        y: this.height * 0.65,
        heading: Math.PI * 0.95,
        length: 86,
        width: 23,
        mass: 920,
        colorHull: '#1A2A2E',
        colorTrim: '#C27C2E',
        colorDeck: '#4A3525',
        shieldColor: '#2B535C',
        sailColor: '#F5DEB3'
      },
      {
        id: 'enemy_3',
        name: 'Tanit (Corsair)',
        x: this.width * 0.65,
        y: this.height * 0.18,
        heading: Math.PI * 1.15,
        length: 76,
        width: 20,
        mass: 780,
        colorHull: '#2A1A1E',
        colorTrim: '#8A3324',
        colorDeck: '#4A3525',
        shieldColor: '#7A1F1D',
        sailColor: '#E6E6FA'
      }
    ];

    for (const cfg of enemyConfigs) {
      this.ships.push(this.createShip({
        ...cfg,
        team: 'carthage',
        hull: 85,
        maxHull: 85,
        isPlayer: false
      }));
    }

    // Seed Flotsam & Ocean Debris
    this.initDebris();

    // Update UI controls if present
    this.syncControls();
  }

  createShip(opts) {
    return {
      id: opts.id,
      name: opts.name,
      team: opts.team,
      isPlayer: !!opts.isPlayer,
      x: opts.x,
      y: opts.y,
      vx: 0,
      vy: 0,
      heading: opts.heading || 0,
      angularVel: 0,
      length: opts.length || 80,
      width: opts.width || 22,
      mass: opts.mass || 850,
      hull: opts.hull || 100,
      maxHull: opts.maxHull || 100,
      colorHull: opts.colorHull || '#8B0000',
      colorTrim: opts.colorTrim || '#D4AF37',
      colorDeck: opts.colorDeck || '#6B4226',
      shieldColor: opts.shieldColor || '#B22222',
      sailColor: opts.sailColor || '#FFFFFF',
      // Rowing mechanics
      cadence: opts.isPlayer ? this.cadence : 24 + Math.random() * 8,
      strokePhase: Math.random() * Math.PI * 2,
      oarPairs: 12, // 12 oars per side = 24 oars visible
      oarDamagePort: 0, // 0 = pristine, 1 = all shattered
      oarDamageStarboard: 0,
      rudderAngle: 0,
      isSprinting: false,
      sprintTimer: 0,
      // Combat & Ballista
      lastFireTime: 0,
      aiState: 'patrol', // 'patrol' | 'align_ram' | 'ram_charge' | 'turn_away'
      aiTarget: null,
      aiTimer: 1.0 + Math.random() * 2.0,
      // Destruction & Sinking
      isDestroyed: false,
      sinkTimer: 0,
      sinkDepth: 0,
      sinkRoll: 0
    };
  }

  initDebris() {
    this.floatingDebris = [];
    const debrisCount = 20;
    for (let i = 0; i < debrisCount; i++) {
      this.floatingDebris.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        angle: Math.random() * Math.PI * 2,
        angularVel: (Math.random() - 0.5) * 0.4,
        type: Math.random() < 0.4 ? 'amphora' : (Math.random() < 0.7 ? 'plank' : 'broken_oar'),
        scale: 0.8 + Math.random() * 0.5
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* CONTROLS & UI CONTRACT                                                     */
  /* -------------------------------------------------------------------------- */

  initControls() {
    // Safe headless DOM guard
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Rowing Cadence (Hortator Rhythm): <span id="val-cadence">${this.cadence} SPM</span></label>
        <input type="range" id="slider-cadence" min="10" max="60" step="1" value="${this.cadence}">
      </div>

      <div class="control-group">
        <label>Rudder Angle (Steering Oars): <span id="val-rudder">${this.rudderAngle.toFixed(0)}°</span></label>
        <input type="range" id="slider-rudder" min="-35" max="35" step="1" value="${this.rudderAngle}">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 8px;">
        <button id="btn-ram" class="sub-btn" style="background: rgba(139, 0, 0, 0.35); border-color: #D4AF37; color: #FFFFFF; font-weight: bold; padding: 10px; font-size: 0.92rem; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
          ⚔️ Full Ramming Speed! (Space)
        </button>
        <button id="btn-ballista" class="sub-btn" style="background: rgba(212, 175, 55, 0.2); border-color: #D4AF37; color: #E0E0E0; font-weight: bold; padding: 8px; font-size: 0.86rem; border-radius: 4px; cursor: pointer;">
          🏹 Fire Bow Ballista (Click / F)
        </button>
        <div style="display: flex; gap: 6px;">
          <button id="btn-spawn-enemy" class="sub-btn" style="flex: 1; background: rgba(30, 60, 90, 0.4); border-color: #48CAE4; color: #E0E0E0; padding: 6px; font-size: 0.8rem; border-radius: 4px; cursor: pointer;">
            + Add Warship
          </button>
          <button id="btn-reset" class="sub-btn" style="flex: 1; background: rgba(80, 20, 20, 0.4); border-color: #FF5A5F; color: #E0E0E0; padding: 6px; font-size: 0.8rem; border-radius: 4px; cursor: pointer;">
            ↺ Reset Fleet
          </button>
        </div>
      </div>

      <div class="control-group" style="font-size: 0.8rem; line-height: 1.45; opacity: 0.88; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 8px;">
        <div><strong>Helm:</strong> [A/D] or [←/→] Port / Starboard Rudder</div>
        <div><strong>Cadence:</strong> [W/S] or [↑/↓] Accelerate / Ease Stroke</div>
        <div><strong>Rostrum Ramming:</strong> Drive the bronze bow into enemy flanks (T-bone) to shatter their oar banks and crush hulls!</div>
      </div>
    `;

    // Sliders
    const sliderCadence = this.controlsContainer.querySelector('#slider-cadence');
    const valCadence = this.controlsContainer.querySelector('#val-cadence');
    if (sliderCadence) {
      sliderCadence.addEventListener('input', (e) => {
        this.cadence = parseInt(e.target.value, 10);
        if (valCadence) valCadence.textContent = `${this.cadence} SPM`;
        if (this.playerShip && !this.playerShip.isDestroyed) {
          this.playerShip.cadence = this.cadence;
        }
      });
    }

    const sliderRudder = this.controlsContainer.querySelector('#slider-rudder');
    const valRudder = this.controlsContainer.querySelector('#val-rudder');
    if (sliderRudder) {
      sliderRudder.addEventListener('input', (e) => {
        this.targetRudderAngle = parseFloat(e.target.value);
        if (valRudder) {
          const dir = this.targetRudderAngle < 0 ? 'Port' : (this.targetRudderAngle > 0 ? 'Stbd' : 'Center');
          valRudder.textContent = `${Math.abs(this.targetRudderAngle).toFixed(0)}° ${dir}`;
        }
      });
    }

    // Buttons
    const btnRam = this.controlsContainer.querySelector('#btn-ram');
    if (btnRam) {
      btnRam.addEventListener('click', () => {
        this.triggerRammingSpeed();
      });
    }

    const btnBallista = this.controlsContainer.querySelector('#btn-ballista');
    if (btnBallista) {
      btnBallista.addEventListener('click', () => {
        this.firePlayerBallista();
      });
    }

    const btnSpawn = this.controlsContainer.querySelector('#btn-spawn-enemy');
    if (btnSpawn) {
      btnSpawn.addEventListener('click', () => {
        this.spawnEnemyWarship();
      });
    }

    const btnReset = this.controlsContainer.querySelector('#btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  syncControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const sliderCadence = this.controlsContainer.querySelector('#slider-cadence');
    const valCadence = this.controlsContainer.querySelector('#val-cadence');
    if (sliderCadence && valCadence) {
      sliderCadence.value = this.cadence;
      valCadence.textContent = `${this.cadence} SPM`;
    }

    const sliderRudder = this.controlsContainer.querySelector('#slider-rudder');
    const valRudder = this.controlsContainer.querySelector('#val-rudder');
    if (sliderRudder && valRudder) {
      sliderRudder.value = this.targetRudderAngle;
      const dir = this.targetRudderAngle < 0 ? 'Port' : (this.targetRudderAngle > 0 ? 'Stbd' : 'Center');
      valRudder.textContent = `${Math.abs(this.targetRudderAngle).toFixed(0)}° ${dir}`;
    }
  }

  triggerRammingSpeed() {
    this.initAudio();
    if (!this.playerShip || this.playerShip.isDestroyed) return;
    if (this.rammingCooldown > 0) return;

    this.isRammingSpeed = true;
    this.rammingTimer = this.rammingDuration;
    this.rammingCooldown = this.rammingDuration + 3.0; // cooldown
    this.playerShip.isSprinting = true;
    this.playerShip.sprintTimer = this.rammingDuration;

    // Surge cadence
    this.cadence = 54;
    this.syncControls();

    this.playSound('drum', 1.8);
    this.playSound('splash', 1.5);

    // Visual notification
    this.addFloatingText(this.playerShip.x, this.playerShip.y - 45, '⚔️ FULL RAMMING SPEED!', '#FFD700', 1.8);
  }

  firePlayerBallista() {
    this.initAudio();
    if (!this.playerShip || this.playerShip.isDestroyed) return;
    if (this.time - this.lastPlayerBallistaFire < 0.5) return;

    this.lastPlayerBallistaFire = this.time;

    // Prow position
    const bowDist = this.playerShip.length * 0.46;
    const bowX = this.playerShip.x + Math.cos(this.playerShip.heading) * bowDist;
    const bowY = this.playerShip.y + Math.sin(this.playerShip.heading) * bowDist;

    // Aim toward mouse cursor
    const dx = this.mousePos.x - bowX;
    const dy = this.mousePos.y - bowY;
    const aimAngle = Math.atan2(dy, dx);

    // Limit firing arc to forward 120°
    let angleDiff = aimAngle - this.playerShip.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const clampedAim = Math.abs(angleDiff) < Math.PI * 0.4 ? aimAngle : this.playerShip.heading + Math.sign(angleDiff) * Math.PI * 0.4;
    const boltSpeed = 580;

    this.bolts.push({
      x: bowX,
      y: bowY,
      vx: Math.cos(clampedAim) * boltSpeed + this.playerShip.vx * 0.3,
      vy: Math.sin(clampedAim) * boltSpeed + this.playerShip.vy * 0.3,
      angle: clampedAim,
      life: 1.4,
      maxLife: 1.4,
      team: 'roman',
      damage: 22
    });

    this.playSound('ballista');
  }

  spawnEnemyWarship() {
    const side = Math.random() < 0.5 ? 'right' : 'top_bottom';
    let x, y, heading;
    if (side === 'right') {
      x = this.width + 50;
      y = this.height * 0.2 + Math.random() * (this.height * 0.6);
      heading = Math.PI + (Math.random() - 0.5) * 0.5;
    } else {
      x = this.width * 0.5 + (Math.random() - 0.5) * (this.width * 0.4);
      y = Math.random() < 0.5 ? -50 : this.height + 50;
      heading = y < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    }

    const newShip = this.createShip({
      id: `enemy_${Date.now()}`,
      name: 'Carthaginian Raider',
      team: 'carthage',
      x,
      y,
      heading,
      length: 78 + Math.random() * 8,
      width: 20 + Math.random() * 3,
      mass: 800 + Math.random() * 100,
      hull: 75,
      maxHull: 75,
      colorHull: '#1A1E2E',
      colorTrim: '#702963',
      colorDeck: '#4A3525',
      shieldColor: '#5C1D58',
      sailColor: '#D8BFD8',
      isPlayer: false
    });

    this.ships.push(newShip);
    this.addFloatingText(this.width * 0.85, 30, '+ Reinforcement Warship Sighted!', '#E0FAFF', 1.6);
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE METHODS                                                          */
  /* -------------------------------------------------------------------------- */

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  getEntityCount() {
    // Number of ships + active wake particles + projectile bolts
    return this.ships.length + this.wakeParticles.length + this.bolts.length;
  }

  destroy() {
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING                                                             */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    this.initAudio();
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };
    this.firePlayerBallista();
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    this.initAudio();
    const code = e && e.code ? e.code : key;

    if (code === 'KeyW' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.keys.KeyW = true;
      this.cadence = Math.min(60, this.cadence + 3);
      if (this.playerShip) this.playerShip.cadence = this.cadence;
      this.syncControls();
    }
    if (code === 'KeyS' || key === 'ArrowDown' || key === 's' || key === 'S') {
      this.keys.KeyS = true;
      this.cadence = Math.max(10, this.cadence - 3);
      if (this.playerShip) this.playerShip.cadence = this.cadence;
      this.syncControls();
    }
    if (code === 'KeyA' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.keys.KeyA = true;
      this.targetRudderAngle = Math.max(-35, this.targetRudderAngle - 6);
      this.syncControls();
    }
    if (code === 'KeyD' || key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.keys.KeyD = true;
      this.targetRudderAngle = Math.min(35, this.targetRudderAngle + 6);
      this.syncControls();
    }
    if (code === 'Space' || key === ' ') {
      this.triggerRammingSpeed();
      if (e && e.preventDefault) e.preventDefault();
    }
    if (code === 'KeyF' || key === 'f' || key === 'F') {
      this.firePlayerBallista();
    }
  }

  onKeyUp(key, e) {
    const code = e && e.code ? e.code : key;
    if (code === 'KeyW' || key === 'ArrowUp' || key === 'w' || key === 'W') this.keys.KeyW = false;
    if (code === 'KeyS' || key === 'ArrowDown' || key === 's' || key === 'S') this.keys.KeyS = false;
    if (code === 'KeyA' || key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.KeyA = false;
    if (code === 'KeyD' || key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.KeyD = false;
  }

  /* -------------------------------------------------------------------------- */
  /* RIGID BODY SIMULATION & HYDRODYNAMICS                                      */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    // Clamp delta time to avoid instability during tab blur
    const delta = Math.min(0.05, Math.max(0.001, dt));
    this.time += delta;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - delta * 18);
      this.shakeOffsetX = (Math.random() - 0.5) * this.screenShake;
      this.shakeOffsetY = (Math.random() - 0.5) * this.screenShake;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Update Player Timers
    if (this.rammingTimer > 0) {
      this.rammingTimer -= delta;
      if (this.rammingTimer <= 0) {
        this.isRammingSpeed = false;
        if (this.playerShip) this.playerShip.isSprinting = false;
        this.cadence = 28;
        this.syncControls();
      }
    }
    if (this.rammingCooldown > 0) {
      this.rammingCooldown = Math.max(0, this.rammingCooldown - delta);
    }

    // Smooth Rudder Interpolation
    const rudderDiff = this.targetRudderAngle - this.rudderAngle;
    this.rudderAngle += rudderDiff * Math.min(1.0, delta * 8.0);
    if (this.playerShip && !this.playerShip.isDestroyed) {
      this.playerShip.rudderAngle = this.rudderAngle;
    }

    // Update Hortator War Drum cadence audio
    if (this.playerShip && !this.playerShip.isDestroyed) {
      const strokePeriod = 60 / Math.max(10, this.playerShip.cadence);
      if (this.time - this.lastDrumTime >= strokePeriod) {
        this.lastDrumTime = this.time;
        this.playSound('drum', this.isRammingSpeed ? 1.6 : 1.0);
      }
    }

    // 1. Update Ships Simulation
    for (let i = this.ships.length - 1; i >= 0; i--) {
      const ship = this.ships[i];

      if (ship.isDestroyed) {
        this.updateSinkingShip(ship, delta, i);
        continue;
      }

      // AI Behavior for Enemy Warships
      if (!ship.isPlayer) {
        this.updateEnemyAI(ship, delta);
      }

      // Hydrodynamic Physics Model
      this.updateShipPhysics(ship, delta);

      // Boundary soft tether / turnaround
      this.constrainShipToBounds(ship);
    }

    // 2. Ramming & Hull Collisions
    this.resolveShipCollisions();

    // 3. Projectile Bolts
    this.updateBolts(delta);

    // 4. Wake Particles & Kelvin Dispersion
    this.updateWakeParticles(delta);

    // 5. Splinters & Debris
    this.updateSplinters(delta);
    this.updateDebris(delta);

    // 6. Floating Damage / Combat Text
    this.updateFloatingTexts(delta);
  }

  updateShipPhysics(ship, dt) {
    // Forward and Lateral unit vectors
    const fwdX = Math.cos(ship.heading);
    const fwdY = Math.sin(ship.heading);
    const latX = -fwdY;
    const latY = fwdX;

    // Velocity decomposition into forward and lateral components
    const vFwd = ship.vx * fwdX + ship.vy * fwdY;
    const vLat = ship.vx * latX + ship.vy * latY;

    // Synchronized Rower Stroke Cycle
    // Stroke phase advances based on cadence (strokes per minute)
    const cadenceHz = ship.cadence / 60.0;
    ship.strokePhase = (ship.strokePhase + cadenceHz * Math.PI * 2 * dt) % (Math.PI * 2);

    // Oar power: drive phase is in first half of cycle (0 to PI), recovery in second half
    let strokeThrustFactor = 0;
    if (ship.strokePhase < Math.PI) {
      strokeThrustFactor = Math.sin(ship.strokePhase); // smooth bell curve drive
    }

    // Net forward thrust: base rower power + sprint boost
    let baseThrust = 160.0 * (ship.cadence / 28.0) * (0.4 + 0.6 * strokeThrustFactor);
    if (ship.isSprinting) {
      baseThrust *= 1.85; // Ramming surge multiplier
    }

    // Damaged oar penalties
    const oarHealth = 1.0 - (ship.oarDamagePort + ship.oarDamageStarboard) * 0.5;
    baseThrust *= Math.max(0.15, oarHealth);

    // Hydrodynamic Resistance Forces
    // 1. Longitudinal drag (quadratic water drag along sleek hull)
    const dragFwd = -0.0035 * vFwd * Math.abs(vFwd) - 0.08 * vFwd;

    // 2. Keel lateral resistance: deep keel strongly opposes sideways drift/slipping
    const dragLat = -1.65 * vLat;

    // Net acceleration vector
    const totalAccFwd = (baseThrust + dragFwd * ship.mass) / ship.mass;
    const totalAccLat = (dragLat * ship.mass) / ship.mass;

    ship.vx += (fwdX * totalAccFwd + latX * totalAccLat) * dt;
    ship.vy += (fwdY * totalAccFwd + latY * totalAccLat) * dt;

    // 3. Rudder Steering Torque & Hydrodynamic Lift
    // Water flowing past twin stern rudders exerts steering torque proportional to forward speed
    const rudderRad = (ship.rudderAngle * Math.PI) / 180.0;
    // Stern lever arm creates yaw torque
    const steeringTorque = -Math.sin(rudderRad) * Math.max(12, Math.abs(vFwd)) * 0.045;

    // Differential oar torque (if oars damaged on one side or rowing unevenly)
    const oarImbalanceTorque = (ship.oarDamagePort - ship.oarDamageStarboard) * 0.035;

    // Hydrodynamic rotational damping (water resists rapid hull spinning)
    const rotDamping = -2.8 * ship.angularVel;

    ship.angularVel += (steeringTorque + oarImbalanceTorque + rotDamping) * dt;
    ship.heading += ship.angularVel * dt;

    // Position integration
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Wake Generation
    this.spawnShipWakes(ship, vFwd, dt);
  }

  spawnShipWakes(ship, vFwd, dt) {
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    if (speed < 4) return;

    // 1. Bow Wave (Kelvin wake V-pattern foam)
    const bowDist = ship.length * 0.48;
    const bowX = ship.x + Math.cos(ship.heading) * bowDist;
    const bowY = ship.y + Math.sin(ship.heading) * bowDist;

    if (Math.random() < Math.min(0.85, speed * 0.015)) {
      // Divergent wake angles
      const spreadAngle = 0.35; // ~20 degrees
      const leftAngle = ship.heading + Math.PI - spreadAngle + (Math.random() - 0.5) * 0.2;
      const rightAngle = ship.heading + Math.PI + spreadAngle + (Math.random() - 0.5) * 0.2;
      const wakeSpeed = speed * 0.25;

      // Left bow foam
      this.wakeParticles.push({
        x: bowX + (Math.random() - 0.5) * 4,
        y: bowY + (Math.random() - 0.5) * 4,
        vx: Math.cos(leftAngle) * wakeSpeed,
        vy: Math.sin(leftAngle) * wakeSpeed,
        life: 0.8 + Math.random() * 0.8,
        maxLife: 1.6,
        size: ship.isSprinting ? 4.5 : 2.8,
        growth: 3.5,
        alpha: 0.85,
        type: 'bow_foam'
      });

      // Right bow foam
      this.wakeParticles.push({
        x: bowX + (Math.random() - 0.5) * 4,
        y: bowY + (Math.random() - 0.5) * 4,
        vx: Math.cos(rightAngle) * wakeSpeed,
        vy: Math.sin(rightAngle) * wakeSpeed,
        life: 0.8 + Math.random() * 0.8,
        maxLife: 1.6,
        size: ship.isSprinting ? 4.5 : 2.8,
        growth: 3.5,
        alpha: 0.85,
        type: 'bow_foam'
      });
    }

    // 2. Stern turbulent wake wash
    const sternDist = -ship.length * 0.46;
    const sternX = ship.x + Math.cos(ship.heading) * sternDist;
    const sternY = ship.y + Math.sin(ship.heading) * sternDist;

    if (Math.random() < 0.6) {
      this.wakeParticles.push({
        x: sternX + (Math.random() - 0.5) * 8,
        y: sternY + (Math.random() - 0.5) * 8,
        vx: -Math.cos(ship.heading) * (speed * 0.15) + (Math.random() - 0.5) * 2,
        vy: -Math.sin(ship.heading) * (speed * 0.15) + (Math.random() - 0.5) * 2,
        life: 1.2 + Math.random() * 1.0,
        maxLife: 2.2,
        size: 3.5,
        growth: 5.0,
        alpha: 0.65,
        type: 'stern_wash'
      });
    }

    // 3. Oar tip dip swirls (during drive stroke)
    if (ship.strokePhase < Math.PI * 0.7 && Math.random() < 0.4) {
      const fwdX = Math.cos(ship.heading);
      const fwdY = Math.sin(ship.heading);
      const latX = -fwdY;
      const latY = fwdX;

      const oarReach = ship.width * 0.95;
      const oarPosLong = (Math.random() - 0.5) * (ship.length * 0.5);

      // Port side swirl
      this.wakeParticles.push({
        x: ship.x + fwdX * oarPosLong - latX * oarReach,
        y: ship.y + fwdY * oarPosLong - latY * oarReach,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        size: 1.8,
        growth: 2.5,
        alpha: 0.5,
        type: 'oar_swirl'
      });

      // Starboard side swirl
      this.wakeParticles.push({
        x: ship.x + fwdX * oarPosLong + latX * oarReach,
        y: ship.y + fwdY * oarPosLong + latY * oarReach,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        size: 1.8,
        growth: 2.5,
        alpha: 0.5,
        type: 'oar_swirl'
      });
    }
  }

  constrainShipToBounds(ship) {
    const margin = 50;
    let pushTorque = 0;

    if (ship.x < margin) {
      ship.vx += 15;
      pushTorque += Math.sin(ship.heading) * 0.5;
    } else if (ship.x > this.width - margin) {
      ship.vx -= 15;
      pushTorque -= Math.sin(ship.heading) * 0.5;
    }

    if (ship.y < margin) {
      ship.vy += 15;
      pushTorque += Math.cos(ship.heading) * 0.5;
    } else if (ship.y > this.height - margin) {
      ship.vy -= 15;
      pushTorque -= Math.cos(ship.heading) * 0.5;
    }

    ship.angularVel += pushTorque;
  }

  /* -------------------------------------------------------------------------- */
  /* ENEMY AI TACTICS (DIEKPLOUS & RAMMING INTERCEPT)                           */
  /* -------------------------------------------------------------------------- */

  updateEnemyAI(ship, dt) {
    ship.aiTimer -= dt;

    // Target: player flagship if active, or nearest enemy
    const target = (this.playerShip && !this.playerShip.isDestroyed) ? this.playerShip : null;
    if (!target) return;

    const dx = target.x - ship.x;
    const dy = target.y - ship.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const targetAngle = Math.atan2(dy, dx);

    // Angle delta between ship heading and target
    let angleDiff = targetAngle - ship.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // State Transitions
    if (ship.aiTimer <= 0) {
      ship.aiTimer = 1.2 + Math.random() * 1.5;
      if (dist < 180 && Math.abs(angleDiff) < 0.35) {
        ship.aiState = 'ram_charge';
      } else if (dist < 320) {
        ship.aiState = 'align_ram';
      } else {
        ship.aiState = 'patrol';
      }
    }

    // Execute State
    if (ship.aiState === 'ram_charge') {
      // Maximum effort sprint straight at the player's beam or bow
      ship.cadence = 48;
      ship.isSprinting = true;
      ship.rudderAngle = Math.max(-30, Math.min(30, angleDiff * 45));
    } else if (ship.aiState === 'align_ram') {
      // Maneuver into striking angle
      ship.cadence = 32;
      ship.isSprinting = false;
      ship.rudderAngle = Math.max(-35, Math.min(35, angleDiff * 55));

      // Attempt to fire ballista if in forward cone
      if (Math.abs(angleDiff) < 0.25 && dist < 380 && this.time - ship.lastFireTime > 3.0) {
        ship.lastFireTime = this.time;
        this.fireEnemyBallista(ship, targetAngle);
      }
    } else {
      // Cruising
      ship.cadence = 24;
      ship.isSprinting = false;
      ship.rudderAngle = Math.max(-25, Math.min(25, angleDiff * 30));
    }
  }

  fireEnemyBallista(ship, angle) {
    const bowDist = ship.length * 0.46;
    const bowX = ship.x + Math.cos(ship.heading) * bowDist;
    const bowY = ship.y + Math.sin(ship.heading) * bowDist;
    const boltSpeed = 540;

    this.bolts.push({
      x: bowX,
      y: bowY,
      vx: Math.cos(angle) * boltSpeed,
      vy: Math.sin(angle) * boltSpeed,
      angle,
      life: 1.4,
      maxLife: 1.4,
      team: 'carthage',
      damage: 18
    });

    this.playSound('ballista');
  }

  /* -------------------------------------------------------------------------- */
  /* RAMMING, COLLISIONS & MOMENTUM PHYSICS                                     */
  /* -------------------------------------------------------------------------- */

  resolveShipCollisions() {
    const count = this.ships.length;

    for (let i = 0; i < count; i++) {
      const shipA = this.ships[i];
      if (shipA.isDestroyed) continue;

      for (let j = i + 1; j < count; j++) {
        const shipB = this.ships[j];
        if (shipB.isDestroyed) continue;

        // Bounding circle fast check
        const dx = shipB.x - shipA.x;
        const dy = shipB.y - shipA.y;
        const distSq = dx * dx + dy * dy;
        const maxCollisionDist = (shipA.length + shipB.length) * 0.55;

        if (distSq > maxCollisionDist * maxCollisionDist) continue;

        // Check Ramming Strike: Ship A ram into Ship B, or Ship B ram into Ship A
        this.checkRammingStrike(shipA, shipB);
        this.checkRammingStrike(shipB, shipA);

        // General Hull-to-Hull Soft Elastic Collision Response
        this.resolveHullGlance(shipA, shipB, Math.sqrt(distSq));
      }
    }
  }

  checkRammingStrike(attacker, defender) {
    // Ram is at attacker's prow (bow tip)
    const ramX = attacker.x + Math.cos(attacker.heading) * (attacker.length * 0.52);
    const ramY = attacker.y + Math.sin(attacker.heading) * (attacker.length * 0.52);

    // Defender hull is represented as 3 interior collision discs along its centerline
    const defFwdX = Math.cos(defender.heading);
    const defFwdY = Math.sin(defender.heading);
    const discRadius = defender.width * 0.58;

    const discOffsets = [-defender.length * 0.3, 0, defender.length * 0.3];

    for (let d = 0; d < discOffsets.length; d++) {
      const discX = defender.x + defFwdX * discOffsets[d];
      const discY = defender.y + defFwdY * discOffsets[d];

      const ddx = ramX - discX;
      const ddy = ramY - discY;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);

      if (dist < discRadius + 8) {
        // RAMMING COLLISION OCCURRED!
        // Relative velocity along attacker forward heading
        const relVx = attacker.vx - defender.vx;
        const relVy = attacker.vy - defender.vy;
        const ramNormalX = Math.cos(attacker.heading);
        const ramNormalY = Math.sin(attacker.heading);
        const closingSpeed = relVx * ramNormalX + relVy * ramNormalY;

        if (closingSpeed > 18) {
          // Kinetic Impact Calculation
          // T-Bone angle factor: angle between attacker heading and defender heading
          const angleBetweenHulls = Math.abs(Math.sin(attacker.heading - defender.heading));
          const tBoneMultiplier = 1.0 + angleBetweenHulls * 1.2; // Devastating into flanks!

          let damage = Math.floor(closingSpeed * 0.85 * tBoneMultiplier);
          if (attacker.isSprinting) damage = Math.floor(damage * 1.4);

          defender.hull = Math.max(0, defender.hull - damage);

          // Screen shake & Sound
          const shakeMag = Math.min(22, 6 + closingSpeed * 0.25);
          this.screenShake = Math.max(this.screenShake, shakeMag);
          this.playSound('ram_impact', closingSpeed / 30.0);

          // Particle Eruption: Wood Splinters & Water Foam
          this.spawnSplinterBurst(ramX, ramY, 24, attacker.heading);
          this.spawnWaterSpray(ramX, ramY, 30);

          // Oar Raking: if struck in flank, shatter defender's oars
          if (angleBetweenHulls > 0.4) {
            // Determine port or starboard side of defender
            const toRamX = ramX - defender.x;
            const toRamY = ramY - defender.y;
            const defenderLatX = -defFwdY;
            const defenderLatY = defFwdX;
            const sideDot = toRamX * defenderLatX + toRamY * defenderLatY;

            if (sideDot < 0) {
              defender.oarDamagePort = Math.min(1.0, defender.oarDamagePort + 0.6);
            } else {
              defender.oarDamageStarboard = Math.min(1.0, defender.oarDamageStarboard + 0.6);
            }
            defender.angularVel += (sideDot > 0 ? -1.8 : 1.8);
            this.addFloatingText(defender.x, defender.y - 20, '💥 OAR BANKS SHATTERED!', '#FFA07A', 1.4);
          }

          // Inelastic Momentum Impulse
          const impulse = closingSpeed * 0.65;
          defender.vx += ramNormalX * impulse;
          defender.vy += ramNormalY * impulse;
          attacker.vx -= ramNormalX * (impulse * 0.4);
          attacker.vy -= ramNormalY * (impulse * 0.4);

          // Floating damage label
          const hitText = `⚡ RAMMED! -${damage} HP`;
          const hitColor = attacker.isPlayer ? '#FFD700' : '#FF6B6B';
          this.addFloatingText(defender.x, defender.y - 35, hitText, hitColor, 1.6);

          // Check if defender sunk
          if (defender.hull <= 0 && !defender.isDestroyed) {
            this.destroyShip(defender, attacker);
          }

          break;
        }
      }
    }
  }

  resolveHullGlance(shipA, shipB, dist) {
    const minDist = (shipA.width + shipB.width) * 0.58;
    if (dist < minDist && dist > 0.001) {
      const overlap = minDist - dist;
      const nx = (shipB.x - shipA.x) / dist;
      const ny = (shipB.y - shipA.y) / dist;

      // Soft push apart
      const separationFactor = overlap * 0.5;
      shipA.x -= nx * separationFactor;
      shipA.y -= ny * separationFactor;
      shipB.x += nx * separationFactor;
      shipB.y += ny * separationFactor;

      // Exchange some lateral momentum
      const relVx = shipB.vx - shipA.vx;
      const relVy = shipB.vy - shipA.vy;
      const normSpeed = relVx * nx + relVy * ny;

      if (normSpeed < 0) {
        const impulse = normSpeed * 0.35;
        shipA.vx += nx * impulse;
        shipA.vy += ny * impulse;
        shipB.vx -= nx * impulse;
        shipB.vy -= ny * impulse;
      }
    }
  }

  destroyShip(ship, killer) {
    ship.isDestroyed = true;
    ship.sinkTimer = 0;
    this.playSound('sink');

    if (killer && killer.isPlayer) {
      this.enemiesSunk++;
      this.addFloatingText(ship.x, ship.y - 50, `🏆 ${ship.name} SUNK!`, '#00FFFF', 2.2);
    } else if (ship.isPlayer) {
      this.addFloatingText(ship.x, ship.y - 50, '💀 FLAGSHIP LOST TO THE DEEP', '#FF3333', 3.0);
    }

    // Spawn massive flotsam & wreckage
    for (let k = 0; k < 12; k++) {
      this.floatingDebris.push({
        x: ship.x + (Math.random() - 0.5) * ship.length * 0.7,
        y: ship.y + (Math.random() - 0.5) * ship.width * 0.8,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        angle: Math.random() * Math.PI * 2,
        angularVel: (Math.random() - 0.5) * 1.5,
        type: Math.random() < 0.5 ? 'broken_oar' : 'plank',
        scale: 0.9 + Math.random() * 0.6
      });
    }
  }

  updateSinkingShip(ship, dt, index) {
    ship.sinkTimer += dt;
    ship.sinkDepth += dt * 0.18;
    ship.sinkRoll += dt * 0.35;

    // Slow drift
    ship.vx *= 0.94;
    ship.vy *= 0.94;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Spawn sinking bubbles
    if (Math.random() < 0.45) {
      this.wakeParticles.push({
        x: ship.x + (Math.random() - 0.5) * 30,
        y: ship.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        size: 2.0,
        growth: 2.0,
        alpha: 0.7,
        type: 'bubble'
      });
    }

    // After 6 seconds, hull vanishes completely into the abyss
    if (ship.sinkTimer > 6.0) {
      this.ships.splice(index, 1);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* PROJECTILE BOLTS & WEAPON MECHANICS                                        */
  /* -------------------------------------------------------------------------- */

  updateBolts(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.life -= dt;

      if (bolt.life <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }

      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;

      // Bolt wake streak
      if (Math.random() < 0.35) {
        this.wakeParticles.push({
          x: bolt.x,
          y: bolt.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 0.3,
          maxLife: 0.3,
          size: 1.5,
          growth: 1.2,
          alpha: 0.45,
          type: 'bolt_trail'
        });
      }

      // Check hit against hostile ships
      let hit = false;
      for (const ship of this.ships) {
        if (ship.isDestroyed || ship.team === bolt.team) continue;

        const dx = bolt.x - ship.x;
        const dy = bolt.y - ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ship.length * 0.48) {
          // Hit ship!
          ship.hull = Math.max(0, ship.hull - bolt.damage);
          this.spawnSplinterBurst(bolt.x, bolt.y, 10, bolt.angle);
          this.playSound('splash', 0.8);
          this.addFloatingText(ship.x, ship.y - 18, `-${bolt.damage}`, '#E0FFFF', 1.0);

          if (ship.hull <= 0 && !ship.isDestroyed) {
            this.destroyShip(ship, bolt.team === 'roman' ? this.playerShip : null);
          }

          hit = true;
          break;
        }
      }

      if (hit) {
        this.bolts.splice(i, 1);
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* PARTICLE SYSTEMS (WAKES, SPLINTERS, DEBRIS)                                */
  /* -------------------------------------------------------------------------- */

  spawnSplinterBurst(x, y, count, angle) {
    for (let i = 0; i < count; i++) {
      const spread = angle + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = 30 + Math.random() * 110;
      this.splinters.push({
        x,
        y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 14,
        length: 5 + Math.random() * 8,
        width: 1.5 + Math.random() * 1.5,
        color: Math.random() < 0.6 ? '#8B5A2B' : '#D2B48C',
        life: 0.6 + Math.random() * 0.7,
        maxLife: 1.3
      });
    }
  }

  spawnWaterSpray(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80;
      this.wakeParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.6,
        maxLife: 1.1,
        size: 2.5 + Math.random() * 3.0,
        growth: 4.0,
        alpha: 0.9,
        type: 'spray'
      });
    }
  }

  updateWakeParticles(dt) {
    for (let i = this.wakeParticles.length - 1; i >= 0; i--) {
      const p = this.wakeParticles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.wakeParticles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.size += p.growth * dt;
    }
  }

  updateSplinters(dt) {
    for (let i = this.splinters.length - 1; i >= 0; i--) {
      const s = this.splinters[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.splinters.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.92;
      s.vy *= 0.92;
      s.rot += s.rotSpeed * dt;
    }
  }

  updateDebris(dt) {
    for (const d of this.floatingDebris) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.angle += d.angularVel * dt;

      // Wrap around bounds
      if (d.x < -30) d.x = this.width + 30;
      if (d.x > this.width + 30) d.x = -30;
      if (d.y < -30) d.y = this.height + 30;
      if (d.y > this.height + 30) d.y = -30;
    }
  }

  addFloatingText(x, y, text, color, duration = 1.5) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: duration,
      maxLife: duration
    });
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 14 * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING PIPELINE                                                         */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    if (!ctx) return;

    ctx.save();

    // Camera screen shake
    if (this.screenShake > 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    // 1. Deep Mediterranean Blue Ocean Base
    this.renderOceanSurface(ctx);

    // 2. Active Wake Foam & Dispersion Particles
    this.renderWakeParticles(ctx);

    // 3. Floating Flotsam & Ocean Debris
    this.renderDebris(ctx);

    // 4. Ships (Sinking hulls first, then afloat warships)
    for (const ship of this.ships) {
      if (ship.isDestroyed) {
        this.renderShip(ctx, ship);
      }
    }
    for (const ship of this.ships) {
      if (!ship.isDestroyed) {
        this.renderShip(ctx, ship);
      }
    }

    // 5. Wood Splinters & Foam Spray
    this.renderSplinters(ctx);

    // 6. Projectile Ballista Bolts
    this.renderBolts(ctx);

    // 7. Tactical HUD & Classical Gauges
    this.renderHUD(ctx);

    // 8. Floating Combat Announcements
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  renderOceanSurface(ctx) {
    // Deep Mediterranean Blue base (#002244)
    ctx.fillStyle = '#002244';
    ctx.fillRect(0, 0, this.width, this.height);

    // Flowing caustic wave shimmer bands
    ctx.save();
    ctx.lineWidth = 2.5;

    const waveCount = 7;
    const waveSpacing = this.height / waveCount;
    for (let i = 0; i < waveCount + 2; i++) {
      const baseY = (i * waveSpacing + (this.time * 18)) % (this.height + 60) - 30;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(72, 202, 228, 0.07)';

      for (let x = 0; x <= this.width; x += 30) {
        const yOffset = Math.sin(x * 0.015 + this.time * 1.2 + i) * 12 + Math.cos(x * 0.008 - this.time * 0.8) * 8;
        if (x === 0) {
          ctx.moveTo(x, baseY + yOffset);
        } else {
          ctx.lineTo(x, baseY + yOffset);
        }
      }
      ctx.stroke();
    }

    // Sun caustic ripple glints
    const glintStep = 90;
    for (let gx = 40; gx < this.width; gx += glintStep) {
      for (let gy = 40; gy < this.height; gy += glintStep) {
        const shimmer = Math.sin(gx * 0.04 + gy * 0.03 + this.time * 2.5);
        if (shimmer > 0.6) {
          const alpha = (shimmer - 0.6) * 0.4;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(gx + Math.cos(this.time + gx) * 10, gy + Math.sin(this.time + gy) * 10, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  renderWakeParticles(ctx) {
    ctx.save();
    for (const p of this.wakeParticles) {
      const progress = p.life / p.maxLife;
      const alpha = p.alpha * progress;

      if (p.type === 'bow_foam' || p.type === 'spray') {
        // Frothy bright white wake foam (#FFFFFF)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Aqua edge
        ctx.fillStyle = `rgba(160, 230, 255, ${(alpha * 0.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'stern_wash' || p.type === 'oar_swirl') {
        ctx.fillStyle = `rgba(210, 245, 255, ${(alpha * 0.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  renderDebris(ctx) {
    ctx.save();
    for (const d of this.floatingDebris) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.scale(d.scale, d.scale);

      if (d.type === 'amphora') {
        // Terracotta amphora (#C86D51)
        ctx.fillStyle = '#C86D51';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (d.type === 'plank') {
        // Wood plank
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(-12, -3, 24, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-10, -1, 20, 2);
      } else {
        // Broken oar spar
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        // Oar blade
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(8, -2.5, 7, 5);
      }

      ctx.restore();
    }
    ctx.restore();
  }

  renderShip(ctx, ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // Sinking visual transformations
    if (ship.isDestroyed) {
      const sinkProgress = Math.min(1.0, ship.sinkTimer / 5.5);
      ctx.globalAlpha = Math.max(0, 1.0 - sinkProgress);
      ctx.rotate(ship.heading + ship.sinkRoll);
      const sinkScale = Math.max(0.75, 1.0 - sinkProgress * 0.25);
      ctx.scale(sinkScale, sinkScale);
    } else {
      ctx.rotate(ship.heading);
    }

    const hl = ship.length * 0.5;
    const hw = ship.width * 0.5;

    // 1. Oar Banks (Port & Starboard synchronized strokes)
    this.renderOars(ctx, ship, hl, hw);

    // 2. Twin Steering Rudders (Gubernacula at Stern)
    this.renderSteeringRudders(ctx, ship, hl, hw);

    // 3. Main Hull Body (Hydrodynamic tapered classical warship)
    ctx.fillStyle = ship.colorDeck;
    ctx.strokeStyle = ship.colorTrim;
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Prow / Ram mount
    ctx.moveTo(hl, 0);
    // Starboard side curves
    ctx.bezierCurveTo(hl * 0.65, hw * 0.85, hl * 0.15, hw, -hl * 0.45, hw * 0.95);
    ctx.bezierCurveTo(-hl * 0.75, hw * 0.85, -hl * 0.9, hw * 0.5, -hl, 0);
    // Port side curves
    ctx.bezierCurveTo(-hl * 0.9, -hw * 0.5, -hl * 0.75, -hw * 0.85, -hl * 0.45, -hw * 0.95);
    ctx.bezierCurveTo(hl * 0.15, -hw, hl * 0.65, -hw * 0.85, hl, 0);
    ctx.closePath();
    ctx.fill();

    // Hull bulwarks / sides in Roman Red (#8B0000) or Enemy colors
    ctx.fillStyle = ship.colorHull;
    ctx.fill();
    ctx.stroke();

    // Wooden deck planking lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    for (let lx = -hl * 0.65; lx < hl * 0.6; lx += 8) {
      ctx.beginPath();
      ctx.moveTo(lx, -hw * 0.65);
      ctx.lineTo(lx, hw * 0.65);
      ctx.stroke();
    }

    // Central raised marine catwalk (stolos / hypozoma)
    ctx.fillStyle = '#5A381E';
    ctx.fillRect(-hl * 0.55, -hw * 0.28, hl * 1.05, hw * 0.56);
    ctx.strokeStyle = ship.colorTrim;
    ctx.strokeRect(-hl * 0.55, -hw * 0.28, hl * 1.05, hw * 0.56);

    // 4. Classical Bronze Rostrum (Three-Pronged Ram at Prow)
    this.renderBronzeRam(ctx, ship, hl, hw);

    // 5. Painted Classical Eye (Ophthalmos) on Bow
    this.renderNavalEye(ctx, hl, hw);

    // 6. Marine Shields (Scuta) lining the bulwarks
    this.renderDeckShields(ctx, ship, hl, hw);

    // 7. Stern Aphlaston (Ornamental curving tail) & Standard
    this.renderSternDecorations(ctx, ship, hl, hw);

    // 8. Bow Ballista / Catapult Mount
    this.renderBowBallista(ctx, ship, hl);

    // 9. Overhead Health & Status Bar
    ctx.restore(); // Exit ship rotation space for clean horizontal health bar
    this.renderShipHUD(ctx, ship);
  }

  renderOars(ctx, ship, hl, hw) {
    const oarCount = ship.oarPairs;
    const oarSpan = hl * 1.05;
    const startX = -hl * 0.48;
    const stepX = oarSpan / (oarCount - 1);

    // Stroke phase defines oar swing angle: -26° (forward feather) to +26° (back drive)
    const strokeAngle = Math.sin(ship.strokePhase) * 0.42;

    ctx.save();
    ctx.lineWidth = 1.8;

    for (let i = 0; i < oarCount; i++) {
      const ox = startX + i * stepX;

      // Port oar
      if (ship.oarDamagePort < 1.0 || Math.random() > ship.oarDamagePort) {
        ctx.strokeStyle = '#D2B48C';
        ctx.beginPath();
        ctx.moveTo(ox, -hw * 0.85);
        const oarLen = hw * 1.6;
        const tipX = ox - Math.sin(strokeAngle) * oarLen * 0.6;
        const tipY = -hw * 0.85 - Math.cos(strokeAngle) * oarLen;
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Oar blade
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(tipX - 2, tipY - 1.5, 4, 3);
      }

      // Starboard oar
      if (ship.oarDamageStarboard < 1.0 || Math.random() > ship.oarDamageStarboard) {
        ctx.strokeStyle = '#D2B48C';
        ctx.beginPath();
        ctx.moveTo(ox, hw * 0.85);
        const oarLen = hw * 1.6;
        const tipX = ox - Math.sin(strokeAngle) * oarLen * 0.6;
        const tipY = hw * 0.85 + Math.cos(strokeAngle) * oarLen;
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Oar blade
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(tipX - 2, tipY - 1.5, 4, 3);
      }
    }
    ctx.restore();
  }

  renderSteeringRudders(ctx, ship, hl, hw) {
    const sternX = -hl * 0.88;
    const rudderRad = (ship.rudderAngle * Math.PI) / 180.0;

    ctx.save();
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2.5;

    // Port rudder
    ctx.save();
    ctx.translate(sternX, -hw * 0.6);
    ctx.rotate(rudderRad);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -6);
    ctx.stroke();
    ctx.fillStyle = '#5A381E';
    ctx.fillRect(-16, -9, 8, 6);
    ctx.restore();

    // Starboard rudder
    ctx.save();
    ctx.translate(sternX, hw * 0.6);
    ctx.rotate(rudderRad);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, 6);
    ctx.stroke();
    ctx.fillStyle = '#5A381E';
    ctx.fillRect(-16, 3, 8, 6);
    ctx.restore();

    ctx.restore();
  }

  renderBronzeRam(ctx, ship, hl, hw) {
    ctx.save();
    // Bronze Rostrum color gradient
    const ramGradient = ctx.createLinearGradient(hl * 0.85, 0, hl + 14, 0);
    ramGradient.addColorStop(0, '#B87333');
    ramGradient.addColorStop(0.5, '#D4AF37'); // Gold sheen
    ramGradient.addColorStop(1, '#8C5A20');

    ctx.fillStyle = ramGradient;
    ctx.strokeStyle = '#5A3A1A';
    ctx.lineWidth = 1.5;

    // Pointed three-pronged rostrum shape
    ctx.beginPath();
    ctx.moveTo(hl * 0.85, -hw * 0.42);
    ctx.lineTo(hl + 13, -hw * 0.15); // Upper barb
    ctx.lineTo(hl + 17, 0); // Main central spike
    ctx.lineTo(hl + 13, hw * 0.15); // Lower barb
    ctx.lineTo(hl * 0.85, hw * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ram glow when sprinting / full ramming speed active
    if (ship.isSprinting) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(hl + 17, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderNavalEye(ctx, hl, hw) {
    ctx.save();
    // Painted Classical Eye (Ophthalmos) on Port & Starboard bow
    const eyeX = hl * 0.68;
    const eyeY = hw * 0.58;

    // Starboard eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#002244';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Port eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(eyeX, -eyeY, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#002244';
    ctx.beginPath();
    ctx.arc(eyeX, -eyeY, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderDeckShields(ctx, ship, hl, hw) {
    const shieldCount = 7;
    const shieldStartX = -hl * 0.45;
    const shieldSpan = hl * 0.85;
    const step = shieldSpan / (shieldCount - 1);

    ctx.save();
    ctx.fillStyle = ship.shieldColor;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;

    for (let i = 0; i < shieldCount; i++) {
      const sx = shieldStartX + i * step;

      // Port rail shield
      ctx.beginPath();
      ctx.rect(sx - 3.5, -hw * 0.85, 7, 3);
      ctx.fill();
      ctx.stroke();

      // Starboard rail shield
      ctx.beginPath();
      ctx.rect(sx - 3.5, hw * 0.85 - 3, 7, 3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSternDecorations(ctx, ship, hl, hw) {
    ctx.save();
    // Curving ornamental aphlaston tail at stern
    ctx.strokeStyle = ship.colorTrim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-hl * 0.95, 0);
    ctx.quadraticCurveTo(-hl * 1.12, -hw * 0.4, -hl * 1.05, -hw * 0.85);
    ctx.stroke();

    // Roman Crimson standard banner / flag fluttering
    if (ship.isPlayer) {
      const flagX = -hl * 0.72;
      const wave = Math.sin(this.time * 6 + ship.x * 0.05) * 3;
      ctx.fillStyle = '#8B0000';
      ctx.beginPath();
      ctx.moveTo(flagX, 0);
      ctx.lineTo(flagX - 16, -6 + wave);
      ctx.lineTo(flagX - 12, 0);
      ctx.lineTo(flagX - 16, 6 + wave);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderBowBallista(ctx, ship, hl) {
    const bX = hl * 0.42;

    ctx.save();
    ctx.translate(bX, 0);

    // Aim angle toward cursor if player, or straight forward
    let aimAngle = 0;
    if (ship.isPlayer) {
      const globalBX = ship.x + Math.cos(ship.heading) * bX;
      const globalBY = ship.y + Math.sin(ship.heading) * bX;
      const dx = this.mousePos.x - globalBX;
      const dy = this.mousePos.y - globalBY;
      aimAngle = Math.atan2(dy, dx) - ship.heading;
      // Clamp aim
      while (aimAngle > Math.PI) aimAngle -= Math.PI * 2;
      while (aimAngle < -Math.PI) aimAngle += Math.PI * 2;
      aimAngle = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, aimAngle));
    }

    ctx.rotate(aimAngle);

    // Ballista base & frame
    ctx.fillStyle = '#4A2E18';
    ctx.fillRect(-4, -3, 10, 6);

    // Torsion arms
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(2, 0);
    ctx.lineTo(-2, 9);
    ctx.stroke();

    // Bronze reinforced prod
    ctx.fillStyle = '#B87333';
    ctx.fillRect(4, -1.5, 6, 3);

    ctx.restore();
  }

  renderShipHUD(ctx, ship) {
    if (ship.isDestroyed) return;

    ctx.save();
    const barWidth = 42;
    const barHeight = 4.5;
    const barX = ship.x - barWidth * 0.5;
    const barY = ship.y - ship.length * 0.52 - 14;

    // Background box
    ctx.fillStyle = 'rgba(0, 10, 25, 0.65)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Hull HP bar
    const hpRatio = Math.max(0, ship.hull / ship.maxHull);
    const hpColor = hpRatio > 0.55 ? '#2ECC71' : (hpRatio > 0.25 ? '#F39C12' : '#E74C3C');
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // Ship Label
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = ship.isPlayer ? '#FFD700' : '#E0E0E0';
    ctx.fillText(ship.name, ship.x, barY - 4);

    ctx.restore();
  }

  renderSplinters(ctx) {
    ctx.save();
    for (const s of this.splinters) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-s.length * 0.5, -s.width * 0.5, s.length, s.width);
      ctx.restore();
    }
    ctx.restore();
  }

  renderBolts(ctx) {
    ctx.save();
    for (const b of this.bolts) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Wooden shaft
      ctx.strokeStyle = '#D2B48C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();

      // Bronze arrowhead (#D4AF37)
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(2, -2.5);
      ctx.lineTo(2, 2.5);
      ctx.closePath();
      ctx.fill();

      // Red fletching
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(-12, -2, 3.5, 4);

      ctx.restore();
    }
    ctx.restore();
  }

  renderHUD(ctx) {
    ctx.save();

    // Top-Left Tactical Helm Readout
    ctx.fillStyle = 'rgba(0, 18, 38, 0.78)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, 14, 210, 86, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#FFD700'; // Roman Gold
    ctx.textAlign = 'left';
    ctx.fillText('TRIREME NAVAL HELM', 24, 32);

    if (this.playerShip && !this.playerShip.isDestroyed) {
      const speedKnots = (Math.sqrt(this.playerShip.vx * this.playerShip.vx + this.playerShip.vy * this.playerShip.vy) * 0.12).toFixed(1);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#E0FAFF';
      ctx.fillText(`SPEED:   ${speedKnots} kn`, 24, 49);
      ctx.fillText(`CADENCE: ${this.cadence} SPM`, 24, 65);
      const rudderDir = this.rudderAngle < 0 ? 'Port' : (this.rudderAngle > 0 ? 'Stbd' : 'Center');
      ctx.fillText(`RUDDER:  ${Math.abs(this.rudderAngle).toFixed(0)}° ${rudderDir}`, 24, 81);
    } else {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#FF5A5F';
      ctx.fillText('FLAGSHIP COMPROMISED', 24, 55);
    }

    // Top-Right Fleet Score & Kills
    ctx.beginPath();
    ctx.roundRect(this.width - 165, 14, 151, 62, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('FLEET ENGAGEMENT', this.width - 153, 32);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`WARSHIPS SUNK: ${this.enemiesSunk}`, this.width - 153, 50);
    const activeEnemies = this.ships.filter(s => !s.isPlayer && !s.isDestroyed).length;
    ctx.fillText(`HOSTILES LEFT: ${activeEnemies}`, this.width - 153, 65);

    // Bottom Center Ramming Status Banner
    if (this.isRammingSpeed) {
      const bannerWidth = 260;
      const bx = (this.width - bannerWidth) * 0.5;
      const by = this.height - 48;

      ctx.fillStyle = 'rgba(139, 0, 0, 0.85)';
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerWidth, 34, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ FULL RAMMING SPEED ENGAGED! ⚔️', this.width * 0.5, by + 21);
    }

    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';

    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}
