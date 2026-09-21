// Colosseum: Tactical Roman Gladiatorial Arena & Agent-Based Combat Simulation
// Grounded in Pliny the Elder's Naturalis Historia (Book VIII: Wild Beasts; Book XXXVI: Amphitheatres)
// Pure ES module with ZERO external dependencies.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

const CYBER_RED = '#FF0055';
const GOLD = '#D4AF37';
const CHARCOAL = '#1A1A1A';
const SAND_BASE = '#C2B280';
const SAND_DARK = '#9E8E62';
const SAND_LIGHT = '#D8C79D';
const CRIMSON_DARK = '#770022';
const BRONZE = '#8C6239';

// Safe Sound Synthesizer using Web Audio API
class ColosseumAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        this.ctx = null;
      }
    }
  }

  play(sound) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    try {
      if (sound === 'slash') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      } else if (sound === 'clash') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.22);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      } else if (sound === 'shield_bash') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } else if (sound === 'hit') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      } else if (sound === 'net') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.linearRampToValueAtTime(620, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.22);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      } else if (sound === 'roar') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(170, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.45);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.48);
      } else if (sound === 'cheer') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.linearRampToValueAtTime(480, t + 0.25);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      }
    } catch {
      // Audio errors are non-critical
    }
  }

  destroy() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

export class ColosseumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation Parameters
    this.gladiatorCount = 8;
    this.aiAggression = 1.0;
    this.playerControlled = true;
    this.crowdExcitement = 20; // 0 to 100%
    this.time = 0;
    this.lastBeastSpawn = -99;

    // Arena geometry
    this.arenaCenter = { x: this.width * 0.5, y: this.height * 0.5 };
    this.arenaRadiusX = this.width * 0.42;
    this.arenaRadiusY = this.height * 0.38;

    // Entities
    this.gladiators = [];
    this.beasts = [];
    this.projectiles = [];
    this.particles = [];       // Blood particles
    this.dustParticles = [];   // Dust puffs
    this.sparkParticles = [];  // Metallic clash sparks
    this.crowdFavors = [];     // Rose petals, coins thrown from stands
    this.bloodStains = [];     // Persistent blood stains on sand (limited to 250)

    // Spectator Nodes along elliptical rim
    this.spectatorCount = 48;
    this.spectators = [];
    this.initSpectators();

    // Input state
    this.keys = {
      w: false, s: false, a: false, d: false,
      ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
      Space: false
    };
    this.mousePos = { x: this.arenaCenter.x, y: this.arenaCenter.y };
    this.isMouseDown = false;

    // Sound Synthesizer
    this.audio = new ColosseumAudio();

    // Event combat log
    this.combatLog = [];

    // Offscreen Decals / Arena Canvas (lazy initialized in browser)
    this.sandCanvas = null;
    this.sandCtx = null;
    this.initSandTexture();

    // Setup controls & entities
    this.initControls();
    this.reset();
    attachTouchBridge(this, canvas);
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION                                                             */
  /* -------------------------------------------------------------------------- */

  initSandTexture() {
    if (typeof document === 'undefined') return;
    try {
      this.sandCanvas = document.createElement('canvas');
      this.sandCanvas.width = Math.max(200, Math.floor(this.width));
      this.sandCanvas.height = Math.max(150, Math.floor(this.height));
      this.sandCtx = this.sandCanvas.getContext('2d');
      this.renderSandBase(this.sandCtx);
    } catch {
      this.sandCanvas = null;
      this.sandCtx = null;
    }
  }

  renderSandBase(ctx) {
    if (!ctx) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Subtle gradient for arena pit
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 50, w * 0.5, h * 0.5, Math.max(w, h) * 0.55);
    grad.addColorStop(0, '#D4C497');
    grad.addColorStop(0.7, '#C2B280');
    grad.addColorStop(1, '#9E8E62');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Raked sand concentric rings
    ctx.strokeStyle = 'rgba(158, 142, 98, 0.25)';
    ctx.lineWidth = 1.5;
    const rx = this.arenaRadiusX;
    const ry = this.arenaRadiusY;
    for (let r = 0.2; r < 0.95; r += 0.08) {
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.5, rx * r, ry * r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Speckles of coarse grit
    ctx.fillStyle = 'rgba(90, 75, 45, 0.15)';
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random());
      const sx = w * 0.5 + Math.cos(angle) * rx * 0.95 * dist;
      const sy = h * 0.5 + Math.sin(angle) * ry * 0.95 * dist;
      ctx.fillRect(sx, sy, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  }

  initSpectators() {
    this.spectators = [];
    for (let i = 0; i < this.spectatorCount; i++) {
      const angle = (i / this.spectatorCount) * Math.PI * 2;
      // Along perimeter outer rim
      const distMult = 1.08 + (i % 3) * 0.04;
      this.spectators.push({
        angle,
        distMult,
        color: (i % 5 === 0) ? CYBER_RED : (i % 7 === 0 ? GOLD : (i % 2 === 0 ? '#C4BAA9' : '#8A8275')),
        cheerOffset: Math.random() * Math.PI * 2,
        cheerAmp: 0
      });
    }
  }

  reset() {
    this.gladiators = [];
    this.beasts = [];
    this.projectiles = [];
    this.particles = [];
    this.dustParticles = [];
    this.sparkParticles = [];
    this.crowdFavors = [];
    this.bloodStains = [];
    this.crowdExcitement = 25;
    this.time = 0;
    this.combatLog = [];

    // Redraw fresh sand texture
    if (this.sandCtx) {
      this.renderSandBase(this.sandCtx);
    }

    // Seed gladiators
    const count = Math.max(2, this.gladiatorCount);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.PI * 0.25;
      const dist = 0.65;
      const x = this.arenaCenter.x + Math.cos(angle) * this.arenaRadiusX * dist;
      const y = this.arenaCenter.y + Math.sin(angle) * this.arenaRadiusY * dist;

      // Class distribution: alternating Murmillo, Retiarius, Thraex
      let type = 'murmillo';
      if (i % 3 === 1) type = 'retiarius';
      else if (i % 3 === 2) type = 'thraex';

      const isPlayer = (i === 0 && this.playerControlled);
      this.gladiators.push(this.createGladiator(type, x, y, isPlayer, i));
    }

    this.addLog('Arena gates open. Let the combat commence!');
  }

  createGladiator(type, x, y, isPlayer = false, id = 0) {
    const names = [
      'Maximus', 'Spartacus', 'Flamma', 'Crixus', 'Commodus',
      'Priscus', 'Verus', 'Tetraites', 'Spiculus', 'Carpophorus',
      'Attilius', 'Hermes', 'Batiatus', 'Varro', 'Aulus', 'Lucius'
    ];
    const name = names[id % names.length] || `Gladiator ${id + 1}`;

    let hp = 110;
    let stamina = 100;
    let speed = 115;
    let reach = 38;
    let damage = 22;
    let weapon = 'gladius';
    let hasShield = true;
    let armorColor = GOLD;

    if (type === 'retiarius') {
      hp = 95;
      speed = 132;
      reach = 62;
      damage = 18;
      weapon = 'trident';
      hasShield = false;
      armorColor = '#3FC1C9';
    } else if (type === 'thraex') {
      hp = 105;
      speed = 124;
      reach = 44;
      damage = 25;
      weapon = 'sica';
      hasShield = true;
      armorColor = '#E056FD';
    }

    return {
      id,
      name,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 14,
      facing: Math.random() * Math.PI * 2,
      targetFacing: 0,
      hp,
      maxHp: hp,
      stamina,
      maxStamina: 100,
      staminaRegen: 18,
      speed,
      reach,
      damage,
      weapon,
      hasShield,
      armorColor,
      isPlayer,
      alive: true,
      kills: 0,

      // State machine: 'IDLE', 'CHASE', 'CIRCLE', 'WINDUP', 'ATTACK', 'PARRY', 'STUNNED', 'TRAPPED', 'VICTORY'
      state: 'IDLE',
      stateTimer: 0,
      attackCooldown: 0,
      netCooldown: Math.random() * 2, // Retiarius net ready after brief delay
      parryActive: false,
      isAttacking: false,
      swingProgress: 0, // 0 to 1 during strike

      // Tactical AI memory
      target: null,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      tacticalTimer: Math.random() * 1.5
    };
  }

  spawnBeast() {
    this.audio.play('roar');
    this.crowdExcitement = Math.min(100, this.crowdExcitement + 20);

    // Spawn from one of the arena gates (North, South, East, West)
    const gates = [
      { x: this.arenaCenter.x, y: this.arenaCenter.y - this.arenaRadiusY * 0.95, facing: Math.PI * 0.5 },
      { x: this.arenaCenter.x, y: this.arenaCenter.y + this.arenaRadiusY * 0.95, facing: -Math.PI * 0.5 },
      { x: this.arenaCenter.x - this.arenaRadiusX * 0.95, y: this.arenaCenter.y, facing: 0 },
      { x: this.arenaCenter.x + this.arenaRadiusX * 0.95, y: this.arenaCenter.y, facing: Math.PI }
    ];
    const gate = gates[Math.floor(Math.random() * gates.length)];

    const beast = {
      id: 500 + this.beasts.length,
      name: 'Leo Ferox',
      type: 'beast',
      x: gate.x,
      y: gate.y,
      vx: 0,
      vy: 0,
      radius: 17,
      facing: gate.facing,
      hp: 140,
      maxHp: 140,
      stamina: 120,
      speed: 155,
      reach: 34,
      damage: 30,
      alive: true,
      state: 'CHASE',
      stateTimer: 0,
      attackCooldown: 0.5,
      pounceCooldown: 1.0,
      isPouncing: false,
      target: null
    };

    this.beasts.push(beast);
    this.addLog('🦁 A ferocious arena lion bursts through the iron gates!');

    // Puffs of dust at gate
    for (let i = 0; i < 20; i++) {
      this.spawnDust(gate.x, gate.y, 40);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* CONTROLS & HUD                                                             */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Gladiator Count: <span id="col-count-val">${this.gladiatorCount}</span></label>
        <input type="range" id="col-count-slider" min="2" max="24" step="1" value="${this.gladiatorCount}">
      </div>

      <div class="control-group">
        <label>AI Aggression: <span id="col-aggr-val">${this.aiAggression.toFixed(1)}x</span></label>
        <input type="range" id="col-aggr-slider" min="0.2" max="2.5" step="0.1" value="${this.aiAggression}">
      </div>

      <div class="control-group">
        <label>Arena Actions</label>
        <div class="control-btn-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button id="col-beast-btn" class="sub-btn" style="background: rgba(255, 0, 85, 0.25); border-color: ${CYBER_RED}; font-weight: bold;">
            🦁 Spawn Beast
          </button>
          <button id="col-reset-btn" class="sub-btn" style="border-color: ${GOLD};">
            ⚔️ Reset Arena
          </button>
        </div>
      </div>

      <div class="control-group">
        <label>Combatant Spawners</label>
        <div class="control-btn-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button id="col-spawn-ret-btn" class="sub-btn" title="Add Retiarius (Trident + Net)">
            🔱 Retiarius
          </button>
          <button id="col-spawn-mur-btn" class="sub-btn" title="Add Murmillo (Gladius + Tower Shield)">
            🛡️ Murmillo
          </button>
        </div>
      </div>

      <div class="control-group">
        <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
          <span>Player Champion (WASD/Mouse)</span>
          <input type="checkbox" id="col-player-toggle" ${this.playerControlled ? 'checked' : ''} style="cursor: pointer;">
        </label>
      </div>

      <div class="control-group" style="font-size: 11px; opacity: 0.85; line-height: 1.4; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; border-left: 2px solid ${GOLD};">
        <b>Controls:</b> WASD to move Champion | Mouse to aim | Left-Click: Thrust/Strike | Space: Throw Net / Shield Bash
      </div>
    `;

    // Bind listeners safely
    const countSlider = this.controlsContainer.querySelector('#col-count-slider');
    const countVal = this.controlsContainer.querySelector('#col-count-val');
    if (countSlider && countSlider.addEventListener) {
      countSlider.addEventListener('input', (e) => {
        this.gladiatorCount = parseInt(e.target.value, 10);
        if (countVal) countVal.textContent = this.gladiatorCount;
        this.reset();
      });
    }

    const aggrSlider = this.controlsContainer.querySelector('#col-aggr-slider');
    const aggrVal = this.controlsContainer.querySelector('#col-aggr-val');
    if (aggrSlider && aggrSlider.addEventListener) {
      aggrSlider.addEventListener('input', (e) => {
        this.aiAggression = parseFloat(e.target.value);
        if (aggrVal) aggrVal.textContent = `${this.aiAggression.toFixed(1)}x`;
      });
    }

    const beastBtn = this.controlsContainer.querySelector('#col-beast-btn');
    if (beastBtn && beastBtn.addEventListener) {
      beastBtn.addEventListener('click', () => {
        this.spawnBeast();
      });
    }

    const resetBtn = this.controlsContainer.querySelector('#col-reset-btn');
    if (resetBtn && resetBtn.addEventListener) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    const retBtn = this.controlsContainer.querySelector('#col-spawn-ret-btn');
    if (retBtn && retBtn.addEventListener) {
      retBtn.addEventListener('click', () => {
        const angle = Math.random() * Math.PI * 2;
        const x = this.arenaCenter.x + Math.cos(angle) * this.arenaRadiusX * 0.6;
        const y = this.arenaCenter.y + Math.sin(angle) * this.arenaRadiusY * 0.6;
        this.gladiators.push(this.createGladiator('retiarius', x, y, false, this.gladiators.length + 1));
        this.addLog('🔱 A new Retiarius enters the sands.');
      });
    }

    const murBtn = this.controlsContainer.querySelector('#col-spawn-mur-btn');
    if (murBtn && murBtn.addEventListener) {
      murBtn.addEventListener('click', () => {
        const angle = Math.random() * Math.PI * 2;
        const x = this.arenaCenter.x + Math.cos(angle) * this.arenaRadiusX * 0.6;
        const y = this.arenaCenter.y + Math.sin(angle) * this.arenaRadiusY * 0.6;
        this.gladiators.push(this.createGladiator('murmillo', x, y, false, this.gladiators.length + 1));
        this.addLog('🛡️ A veteran Murmillo strides into the arena.');
      });
    }

    const playerToggle = this.controlsContainer.querySelector('#col-player-toggle');
    if (playerToggle && playerToggle.addEventListener) {
      playerToggle.addEventListener('change', (e) => {
        this.playerControlled = e.target.checked;
        if (this.gladiators.length > 0) {
          this.gladiators[0].isPlayer = this.playerControlled;
        }
      });
    }
  }

  addLog(msg) {
    this.combatLog.unshift({ text: msg, time: this.time });
    if (this.combatLog.length > 6) {
      this.combatLog.pop();
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE & CONTRACT METHODS                                               */
  /* -------------------------------------------------------------------------- */

  resize(width, height, dpr = 1) {
    this.width = width || 800;
    this.height = height || 600;
    this.dpr = dpr || 1;

    this.arenaCenter = { x: this.width * 0.5, y: this.height * 0.5 };
    this.arenaRadiusX = this.width * 0.42;
    this.arenaRadiusY = this.height * 0.38;

    this.initSandTexture();
  }

  getEntityCount() {
    const activeGladiators = this.gladiators.filter(g => g.alive).length;
    const activeBeasts = this.beasts.filter(b => b.alive).length;
    const activeCombatants = activeGladiators + activeBeasts;
    const activeProjectiles = this.projectiles.length;
    const activeParticles = this.particles.length + this.dustParticles.length + this.sparkParticles.length;
    return activeCombatants + activeProjectiles + activeParticles;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.audio.destroy();
    this.gladiators = [];
    this.beasts = [];
    this.projectiles = [];
    this.particles = [];
    this.dustParticles = [];
    this.sparkParticles = [];
    this.crowdFavors = [];
    this.bloodStains = [];
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING                                                             */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    if (!pos) return;
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };

    const player = this.getPlayerGladiator();
    if (player && player.alive) {
      this.triggerAttack(player);
    }
  }

  onMouseMove(pos) {
    if (!pos) return;
    this.mousePos = { x: pos.x, y: pos.y };
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    if (pos) this.mousePos = { x: pos.x, y: pos.y };
  }

  onKeyDown(key, e) {
    if (!key) return;
    const k = key.toLowerCase();
    if (this.keys.hasOwnProperty(k) || this.keys.hasOwnProperty(key)) {
      this.keys[k] = true;
      this.keys[key] = true;
    }

    if (key === ' ' || key === 'Space') {
      const player = this.getPlayerGladiator();
      if (player && player.alive) {
        this.triggerSpecialAction(player);
      }
      if (e && e.preventDefault) e.preventDefault();
    } else if (k === 'b') {
      this.spawnBeast();
    } else if (k === 'r') {
      this.reset();
    }
  }

  onKeyUp(key) {
    if (!key) return;
    const k = key.toLowerCase();
    if (this.keys.hasOwnProperty(k)) this.keys[k] = false;
    if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
  }

  getPlayerGladiator() {
    if (!this.playerControlled) return null;
    return this.gladiators.find(g => g.isPlayer && g.alive) || null;
  }

  triggerAttack(g) {
    if (!g.alive || g.state === 'STUNNED' || g.state === 'TRAPPED' || g.attackCooldown > 0) return;
    if (g.stamina < 12) return; // Stamina check

    g.stamina -= 12;
    g.state = 'WINDUP';
    g.stateTimer = 0.12; // Quick telegraph
    g.isAttacking = true;
    g.swingProgress = 0;
  }

  triggerSpecialAction(g) {
    if (!g.alive || g.state === 'STUNNED' || g.state === 'TRAPPED') return;

    if (g.type === 'retiarius') {
      if (g.netCooldown <= 0 && g.stamina >= 25) {
        g.stamina -= 25;
        g.netCooldown = 6.0;
        this.throwNet(g);
      }
    } else if (g.hasShield) {
      if (g.stamina >= 20) {
        g.stamina -= 20;
        this.performShieldBash(g);
      }
    } else {
      // Whirling blade flurry
      if (g.stamina >= 20) {
        g.stamina -= 20;
        this.triggerAttack(g);
      }
    }
  }

  throwNet(g) {
    this.audio.play('net');
    const targetDist = 180;
    const targetX = g.x + Math.cos(g.facing) * targetDist;
    const targetY = g.y + Math.sin(g.facing) * targetDist;

    this.projectiles.push({
      type: 'net',
      ownerId: g.id,
      x: g.x + Math.cos(g.facing) * (g.radius + 6),
      y: g.y + Math.sin(g.facing) * (g.radius + 6),
      targetX,
      targetY,
      vx: Math.cos(g.facing) * 280,
      vy: Math.sin(g.facing) * 280,
      radius: 8,
      maxRadius: 26,
      currentRadius: 8,
      life: 0.7,
      maxLife: 0.7
    });

    this.addLog(`${g.name} casts the weighted rete net!`);
  }

  performShieldBash(g) {
    this.audio.play('shield_bash');
    g.state = 'ATTACK';
    g.stateTimer = 0.25;
    g.attackCooldown = 0.6;

    // Lunge forward
    g.vx += Math.cos(g.facing) * 160;
    g.vy += Math.sin(g.facing) * 160;

    // Bash area check
    const bashRange = g.reach + 10;
    const targets = this.getAllCombatants().filter(o => o !== g && o.alive);

    for (const target of targets) {
      const dx = target.x - g.x;
      const dy = target.y - g.y;
      const dist = Math.hypot(dx, dy) || 1e-4;

      if (dist < bashRange) {
        const angleTo = Math.atan2(dy, dx);
        const angleDiff = Math.abs(this.normalizeAngle(angleTo - g.facing));
        if (angleDiff < Math.PI * 0.45) {
          // Stun target!
          target.state = 'STUNNED';
          target.stateTimer = 1.2;
          target.vx += Math.cos(g.facing) * 220;
          target.vy += Math.sin(g.facing) * 220;
          target.stamina = Math.max(0, target.stamina - 30);
          target.hp = Math.max(0, target.hp - 10);

          this.spawnSparks(target.x, target.y, 8);
          this.spawnDust(target.x, target.y, 10);
          this.crowdExcitement = Math.min(100, this.crowdExcitement + 8);
          this.addLog(`${g.name} lands a crushing shield bash on ${target.name}!`);
        }
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* SIMULATION LOOP & PHYSICS                                                  */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    const delta = Math.min(dt, 0.05); // Stability clamp
    this.time += delta;

    // Gradually decay crowd excitement
    this.crowdExcitement = Math.max(10, this.crowdExcitement - delta * 1.2);

    // Update Spectators
    this.updateSpectators(delta);

    // Update Gladiators
    this.updateGladiators(delta);

    // Update Beasts
    this.updateBeasts(delta);

    // Update Projectiles
    this.updateProjectiles(delta);

    // Update Particles
    this.updateParticles(delta);

    // Crowd Favors (Petals / Coins)
    this.updateCrowdFavors(delta);

    // Boundary constraints & collisions between combatants
    this.resolveArenaCollisions();
  }

  updateSpectators(dt) {
    const cheerThreshold = 45;
    for (const spec of this.spectators) {
      if (this.crowdExcitement > cheerThreshold) {
        spec.cheerAmp = Math.min(1.0, spec.cheerAmp + dt * 3.0);
      } else {
        spec.cheerAmp = Math.max(0.0, spec.cheerAmp - dt * 1.5);
      }
    }

    // High excitement spawns tossed gifts
    if (this.crowdExcitement > 70 && Math.random() < 0.08) {
      const spec = this.spectators[Math.floor(Math.random() * this.spectators.length)];
      const startX = this.arenaCenter.x + Math.cos(spec.angle) * this.arenaRadiusX * spec.distMult;
      const startY = this.arenaCenter.y + Math.sin(spec.angle) * this.arenaRadiusY * spec.distMult;
      const targetAngle = spec.angle + Math.PI + (Math.random() - 0.5) * 0.6;
      const dist = Math.random() * this.arenaRadiusX * 0.7;

      this.crowdFavors.push({
        type: Math.random() > 0.4 ? 'petal' : 'coin',
        x: startX,
        y: startY,
        targetX: this.arenaCenter.x + Math.cos(targetAngle) * dist,
        targetY: this.arenaCenter.y + Math.sin(targetAngle) * dist,
        height: 30 + Math.random() * 20,
        t: 0,
        duration: 0.9 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? CYBER_RED : GOLD,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  getAllCombatants() {
    return [...this.gladiators, ...this.beasts];
  }

  updateGladiators(dt) {
    const activeGladiators = this.gladiators.filter(g => g.alive);

    for (const g of this.gladiators) {
      if (!g.alive) continue;

      // Cooldowns
      if (g.attackCooldown > 0) g.attackCooldown -= dt;
      if (g.netCooldown > 0) g.netCooldown -= dt;

      // Stamina Regeneration (faster when resting or circling)
      const regenRate = g.state === 'CIRCLE' || g.state === 'IDLE' ? g.staminaRegen * 1.4 : g.staminaRegen;
      if (g.stamina < g.maxStamina && g.state !== 'ATTACK' && g.state !== 'WINDUP') {
        g.stamina = Math.min(g.maxStamina, g.stamina + regenRate * dt);
      }

      // Handle Stun / Trap
      if (g.state === 'STUNNED' || g.state === 'TRAPPED') {
        g.stateTimer -= dt;
        if (g.stateTimer <= 0) {
          g.state = 'IDLE';
        }
        this.applyFriction(g, 0.85);
        this.integratePosition(g, dt);
        continue;
      }

      // Windup & Attack States
      if (g.state === 'WINDUP') {
        g.stateTimer -= dt;
        if (g.stateTimer <= 0) {
          // Launch attack strike
          g.state = 'ATTACK';
          g.stateTimer = 0.22;
          g.attackCooldown = 0.55 / Math.max(0.5, this.aiAggression);
          this.executeWeaponStrike(g);
        }
        this.applyFriction(g, 0.9);
        this.integratePosition(g, dt);
        continue;
      }

      if (g.state === 'ATTACK') {
        g.stateTimer -= dt;
        g.swingProgress = 1 - (g.stateTimer / 0.22);
        if (g.stateTimer <= 0) {
          g.state = 'IDLE';
          g.isAttacking = false;
        }
        this.applyFriction(g, 0.88);
        this.integratePosition(g, dt);
        continue;
      }

      // Player or AI Control
      if (g.isPlayer) {
        this.updatePlayerControl(g, dt);
      } else {
        this.updateGladiatorAI(g, dt, activeGladiators);
      }

      this.applyFriction(g, 0.88);
      this.integratePosition(g, dt);
    }
  }

  updatePlayerControl(g, dt) {
    let moveX = 0;
    let moveY = 0;
    if (this.keys.w || this.keys.ArrowUp) moveY -= 1;
    if (this.keys.s || this.keys.ArrowDown) moveY += 1;
    if (this.keys.a || this.keys.ArrowLeft) moveX -= 1;
    if (this.keys.d || this.keys.ArrowRight) moveX += 1;

    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
      const accel = g.speed * 4.2;
      g.vx += moveX * accel * dt;
      g.vy += moveY * accel * dt;

      if (Math.random() < 0.2) {
        this.spawnDust(g.x, g.y, 14);
      }
    }

    // Aim towards mouse cursor
    const dx = this.mousePos.x - g.x;
    const dy = this.mousePos.y - g.y;
    g.facing = Math.atan2(dy, dx);

    // Continuous attack if mouse held down
    if (this.isMouseDown && g.attackCooldown <= 0) {
      this.triggerAttack(g);
    }
  }

  updateGladiatorAI(g, dt, allActive) {
    g.tacticalTimer -= dt;

    // Target Selection: find closest active enemy (other gladiator or beast)
    if (!g.target || !g.target.alive || g.tacticalTimer <= 0) {
      g.tacticalTimer = 0.8 + Math.random() * 0.8;
      let closest = null;
      let minDist = Infinity;

      const enemies = this.getAllCombatants().filter(c => c !== g && c.alive);
      for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - g.x, enemy.y - g.y);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
      g.target = closest;
    }

    if (!g.target) {
      g.state = 'IDLE';
      return;
    }

    const target = g.target;
    const dx = target.x - g.x;
    const dy = target.y - g.y;
    const dist = Math.hypot(dx, dy) || 1e-4;
    const targetAngle = Math.atan2(dy, dx);

    // Smooth turn towards target
    g.facing = this.lerpAngle(g.facing, targetAngle, dt * 8.0);

    const optimalDistance = g.reach * 0.95;
    const aggressionFactor = this.aiAggression;

    // Retiarius tactical AI: fling net if at medium range
    if (g.type === 'retiarius' && g.netCooldown <= 0 && dist > 100 && dist < 220 && g.stamina > 30) {
      if (Math.random() < 0.35 * aggressionFactor) {
        g.netCooldown = 7.0;
        g.stamina -= 25;
        this.throwNet(g);
        return;
      }
    }

    // Stamina low -> back off and circle
    if (g.stamina < 20) {
      g.state = 'CIRCLE';
      const retreatAngle = targetAngle + Math.PI + g.strafeDir * 0.8;
      g.vx += Math.cos(retreatAngle) * g.speed * 2.2 * dt;
      g.vy += Math.sin(retreatAngle) * g.speed * 2.2 * dt;
      return;
    }

    // In attack range
    if (dist <= g.reach + 12) {
      // Check if target is attacking -> raise shield or parry
      if (target.isAttacking && g.hasShield && g.stamina > 15 && Math.random() < 0.65 * aggressionFactor) {
        g.state = 'PARRY';
        g.parryActive = true;
        g.stamina -= dt * 10;
        return;
      }

      g.parryActive = false;

      // Attack if cooldown ready
      if (g.attackCooldown <= 0 && g.stamina >= 14) {
        if (Math.random() < 0.75 * aggressionFactor) {
          this.triggerAttack(g);
          return;
        }
      }

      // Circling & feinting
      g.state = 'CIRCLE';
      const circleAngle = targetAngle + (Math.PI * 0.5 * g.strafeDir);
      g.vx += Math.cos(circleAngle) * g.speed * 2.0 * dt;
      g.vy += Math.sin(circleAngle) * g.speed * 2.0 * dt;

    } else {
      // Approaching target
      g.state = 'CHASE';
      const approachAngle = targetAngle + (g.strafeDir * 0.25);
      const accel = g.speed * (dist > 120 ? 3.8 : 2.5) * aggressionFactor;
      g.vx += Math.cos(approachAngle) * accel * dt;
      g.vy += Math.sin(approachAngle) * accel * dt;

      if (Math.random() < 0.15) {
        this.spawnDust(g.x, g.y, 10);
      }
    }
  }

  updateBeasts(dt) {
    for (const b of this.beasts) {
      if (!b.alive) continue;

      if (b.attackCooldown > 0) b.attackCooldown -= dt;
      if (b.pounceCooldown > 0) b.pounceCooldown -= dt;

      // Find nearest living gladiator
      let target = null;
      let minDist = Infinity;
      for (const g of this.gladiators) {
        if (!g.alive) continue;
        const d = Math.hypot(g.x - b.x, g.y - b.y);
        if (d < minDist) {
          minDist = d;
          target = g;
        }
      }

      if (!target) {
        this.applyFriction(b, 0.85);
        this.integratePosition(b, dt);
        continue;
      }

      const dx = target.x - b.x;
      const dy = target.y - b.y;
      const dist = Math.hypot(dx, dy) || 1e-4;
      const targetAngle = Math.atan2(dy, dx);
      b.facing = this.lerpAngle(b.facing, targetAngle, dt * 9.0);

      // Pounce attack
      if (dist > 90 && dist < 210 && b.pounceCooldown <= 0 && Math.random() < 0.35) {
        this.audio.play('roar');
        b.pounceCooldown = 3.5;
        b.vx += Math.cos(b.facing) * 340;
        b.vy += Math.sin(b.facing) * 340;
        b.isPouncing = true;
        this.spawnDust(b.x, b.y, 25);
      } else if (dist <= b.reach + 10) {
        // Strike with claws/jaws
        if (b.attackCooldown <= 0) {
          b.attackCooldown = 0.7;
          this.executeBeastStrike(b, target);
        }
      } else {
        // Run towards gladiator
        const accel = b.speed * 4.0;
        b.vx += Math.cos(b.facing) * accel * dt;
        b.vy += Math.sin(b.facing) * accel * dt;

        if (Math.random() < 0.25) {
          this.spawnDust(b.x, b.y, 15);
        }
      }

      this.applyFriction(b, 0.88);
      this.integratePosition(b, dt);
    }
  }

  executeWeaponStrike(attacker) {
    this.audio.play('slash');
    // Forward lunge impulse
    attacker.vx += Math.cos(attacker.facing) * 110;
    attacker.vy += Math.sin(attacker.facing) * 110;

    const hitRange = attacker.reach + 12;
    const candidates = this.getAllCombatants().filter(o => o !== attacker && o.alive);

    for (const target of candidates) {
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.hypot(dx, dy) || 1e-4;

      if (dist <= hitRange) {
        const strikeAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(this.normalizeAngle(strikeAngle - attacker.facing));

        if (angleDiff < Math.PI * 0.48) {
          // Target is in the forward strike cone
          this.resolveHit(attacker, target);
        }
      }
    }
  }

  executeBeastStrike(beast, target) {
    this.audio.play('hit');
    beast.vx += Math.cos(beast.facing) * 80;
    beast.vy += Math.sin(beast.facing) * 80;

    // Check if gladiator can block with shield
    if (target.hasShield && target.parryActive) {
      this.audio.play('clash');
      this.spawnSparks(target.x, target.y, 10);
      target.stamina = Math.max(0, target.stamina - 20);
      beast.vx -= Math.cos(beast.facing) * 120;
      beast.vy -= Math.sin(beast.facing) * 120;
      this.addLog(`${target.name} deflects the lion's claws with shield!`);
      return;
    }

    const dmg = beast.damage * (0.8 + Math.random() * 0.4);
    target.hp -= dmg;
    this.spawnBlood(target.x, target.y, 16);
    this.crowdExcitement = Math.min(100, this.crowdExcitement + 14);

    if (target.hp <= 0) {
      target.alive = false;
      target.hp = 0;
      this.addLog(`💀 ${target.name} fell to the arena lion!`);
      this.audio.play('cheer');
      this.crowdExcitement = Math.min(100, this.crowdExcitement + 25);
    }
  }

  resolveHit(attacker, target) {
    // Check if target is parrying or blocking
    const facingTarget = Math.atan2(attacker.y - target.y, attacker.x - target.x);
    const targetFacingDiff = Math.abs(this.normalizeAngle(facingTarget - target.facing));
    const isFacingAttacker = targetFacingDiff < Math.PI * 0.55;

    if (target.hasShield && (target.parryActive || isFacingAttacker) && target.stamina > 10) {
      // Successful shield block / parry!
      this.audio.play('clash');
      this.spawnSparks((attacker.x + target.x) * 0.5, (attacker.y + target.y) * 0.5, 12);

      target.stamina = Math.max(0, target.stamina - 15);
      attacker.stamina = Math.max(0, attacker.stamina - 18);

      // Bounce attacker back
      attacker.vx -= Math.cos(attacker.facing) * 140;
      attacker.vy -= Math.sin(attacker.facing) * 140;

      // Stagger attacker slightly
      attacker.state = 'STUNNED';
      attacker.stateTimer = 0.35;

      this.crowdExcitement = Math.min(100, this.crowdExcitement + 8);
      this.addLog(`🛡️ ${target.name} parried ${attacker.name}'s thrust!`);
      return;
    }

    // Direct flesh impact
    this.audio.play('hit');
    const dmg = attacker.damage * (0.85 + Math.random() * 0.3);
    target.hp -= dmg;

    // Recoil
    target.vx += Math.cos(attacker.facing) * 110;
    target.vy += Math.sin(attacker.facing) * 110;

    // Blood splatter & decals
    this.spawnBlood(target.x, target.y, 14);
    this.crowdExcitement = Math.min(100, this.crowdExcitement + 10);

    if (target.hp <= 0) {
      target.alive = false;
      target.hp = 0;
      attacker.kills++;
      attacker.state = 'VICTORY';
      attacker.stateTimer = 1.8;

      this.audio.play('cheer');
      this.crowdExcitement = Math.min(100, this.crowdExcitement + 30);
      this.addLog(`🏆 ${attacker.name} defeated ${target.name} in glorious combat!`);
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'net') {
        const progress = 1 - (p.life / p.maxLife);
        p.currentRadius = p.radius + (p.maxRadius - p.radius) * progress;

        // Check impact against combatants
        const targets = this.getAllCombatants().filter(c => c.id !== p.ownerId && c.alive);
        let hit = false;

        for (const target of targets) {
          const d = Math.hypot(target.x - p.x, target.y - p.y);
          if (d < p.currentRadius + target.radius) {
            hit = true;
            target.state = 'TRAPPED';
            target.stateTimer = 2.8; // Immobilized in net
            target.vx *= 0.1;
            target.vy *= 0.1;

            this.audio.play('hit');
            this.spawnDust(target.x, target.y, 20);
            this.crowdExcitement = Math.min(100, this.crowdExcitement + 15);
            this.addLog(`🕸️ ${target.name} is ensnared in the Retiarius net!`);
            break;
          }
        }

        if (hit || p.life <= 0) {
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  updateParticles(dt) {
    // Blood particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;

      // When settled, deposit persistent blood stain onto sand
      if (p.life <= 0 || Math.hypot(p.vx, p.vy) < 5) {
        this.addBloodStain(p.x, p.y, p.size * 1.5);
        this.particles.splice(i, 1);
      }
    }

    // Dust particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const d = this.dustParticles[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.size += dt * 14;
      d.alpha = Math.max(0, d.life / d.maxLife) * 0.45;

      if (d.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }

    // Sparks
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const s = this.sparkParticles[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.92;
      s.vy *= 0.92;

      if (s.life <= 0) {
        this.sparkParticles.splice(i, 1);
      }
    }
  }

  updateCrowdFavors(dt) {
    for (let i = this.crowdFavors.length - 1; i >= 0; i--) {
      const cf = this.crowdFavors[i];
      cf.t += dt / cf.duration;
      cf.rotation += cf.rotSpeed * dt;

      if (cf.t >= 1) {
        // Settled on sand
        this.crowdFavors.splice(i, 1);
      }
    }
  }

  spawnBlood(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        life: 0.35 + Math.random() * 0.45,
        color: Math.random() > 0.3 ? CYBER_RED : CRIMSON_DARK
      });
    }
  }

  spawnDust(x, y, speed = 20) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    this.dustParticles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      size: 6 + Math.random() * 8,
      life: 0.4 + Math.random() * 0.4,
      maxLife: 0.8,
      alpha: 0.35
    });
  }

  spawnSparks(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 220;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        life: 0.18 + Math.random() * 0.22,
        color: Math.random() > 0.4 ? GOLD : '#FFF6BD'
      });
    }
  }

  addBloodStain(x, y, radius) {
    if (this.sandCtx) {
      this.sandCtx.save();
      this.sandCtx.beginPath();
      this.sandCtx.arc(x, y, radius, 0, Math.PI * 2);
      this.sandCtx.fillStyle = Math.random() > 0.35 ? 'rgba(255, 0, 85, 0.4)' : 'rgba(119, 0, 34, 0.5)';
      this.sandCtx.fill();
      this.sandCtx.restore();
    } else {
      this.bloodStains.push({ x, y, radius, color: Math.random() > 0.35 ? 'rgba(255, 0, 85, 0.35)' : 'rgba(119, 0, 34, 0.45)' });
      if (this.bloodStains.length > 250) {
        this.bloodStains.shift();
      }
    }
  }

  resolveArenaCollisions() {
    const all = this.getAllCombatants().filter(c => c.alive);
    const cx = this.arenaCenter.x;
    const cy = this.arenaCenter.y;
    const rx = this.arenaRadiusX;
    const ry = this.arenaRadiusY;

    // Arena Perimeter Wall Constraint (Elliptical Clamp)
    for (const c of all) {
      const nx = (c.x - cx) / rx;
      const ny = (c.y - cy) / ry;
      const distSq = nx * nx + ny * ny;

      if (distSq > 0.96) {
        const dist = Math.sqrt(distSq);
        const normX = nx / dist;
        const normY = ny / dist;
        c.x = cx + normX * rx * 0.97;
        c.y = cy + normY * ry * 0.97;

        // Bounce velocity away from perimeter wall
        const dot = c.vx * normX + c.vy * normY;
        if (dot > 0) {
          c.vx -= normX * dot * 1.5;
          c.vy -= normY * dot * 1.5;
        }
      }
    }

    // Inter-combatant circular collision push
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1e-4;
        const minDist = a.radius + b.radius;

        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          const pushX = (dx / dist) * overlap;
          const pushY = (dy / dist) * overlap;
          a.x -= pushX;
          a.y -= pushY;
          b.x += pushX;
          b.y += pushY;
        }
      }
    }
  }

  applyFriction(entity, factor) {
    entity.vx *= factor;
    entity.vy *= factor;
  }

  integratePosition(entity, dt) {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
  }

  lerpAngle(current, target, factor) {
    const diff = this.normalizeAngle(target - current);
    return current + diff * Math.min(1, Math.max(0, factor));
  }

  normalizeAngle(angle) {
    let a = angle;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING                                                                  */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    if (!ctx) return;

    // Clear frame
    ctx.save();
    ctx.fillStyle = CHARCOAL;
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Render Outer Amphitheatre Architecture & Stands
    this.renderAmphitheatreStands(ctx);

    // 2. Render Sand Arena Floor & Decals
    this.renderArenaFloor(ctx);

    // 3. Render Crowd Spectators & Banners
    this.renderCrowdAndBanners(ctx);

    // 4. Render Thrown Gifts (Roses & Coins)
    this.renderCrowdFavors(ctx);

    // 5. Render Combatants (Dead first, then living)
    this.renderCombatants(ctx);

    // 6. Render Projectiles
    this.renderProjectiles(ctx);

    // 7. Render Particles (Blood, Dust, Sparks)
    this.renderParticles(ctx);

    // 8. Render HUD Telemetry Overlay
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderAmphitheatreStands(ctx) {
    const cx = this.arenaCenter.x;
    const cy = this.arenaCenter.y;
    const rx = this.arenaRadiusX;
    const ry = this.arenaRadiusY;

    // Outer stone tiered seating (cavea)
    for (let i = 4; i >= 1; i--) {
      const tierMult = 1.0 + i * 0.08;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * tierMult, ry * tierMult, 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#2B2B30' : '#222226';
      ctx.fill();
      ctx.strokeStyle = '#18181C';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Radial stairs / vomitoria aisles
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const x1 = cx + Math.cos(a) * rx * 1.02;
      const y1 = cy + Math.sin(a) * ry * 1.02;
      const x2 = cx + Math.cos(a) * rx * 1.34;
      const y2 = cy + Math.sin(a) * ry * 1.34;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  renderArenaFloor(ctx) {
    const cx = this.arenaCenter.x;
    const cy = this.arenaCenter.y;
    const rx = this.arenaRadiusX;
    const ry = this.arenaRadiusY;

    // Clip to elliptical arena boundary
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    // Draw pre-rendered sand texture or fallback
    if (this.sandCanvas) {
      ctx.drawImage(this.sandCanvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = SAND_BASE;
      ctx.fill();
    }

    // Fallback blood decals if offscreen canvas wasn't supported
    for (const b of this.bloodStains) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    }

    ctx.restore();

    // Arena Perimeter Podium Wall & Golden Trim
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = CHARCOAL;
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Imperial Gates (North, South, East, West)
    const gateAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (const a of gateAngles) {
      const gx = cx + Math.cos(a) * rx;
      const gy = cy + Math.sin(a) * ry;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(a + Math.PI * 0.5);

      // Iron gate bars
      ctx.fillStyle = '#111114';
      ctx.fillRect(-18, -6, 36, 12);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-18, -6, 36, 12);

      ctx.beginPath();
      for (let bar = -12; bar <= 12; bar += 6) {
        ctx.moveTo(bar, -6);
        ctx.lineTo(bar, 6);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  renderCrowdAndBanners(ctx) {
    const cx = this.arenaCenter.x;
    const cy = this.arenaCenter.y;
    const rx = this.arenaRadiusX;
    const ry = this.arenaRadiusY;

    // Render Spectators
    for (const spec of this.spectators) {
      const bob = Math.sin(this.time * 6 + spec.cheerOffset) * (spec.cheerAmp * 4.5);
      const x = cx + Math.cos(spec.angle) * rx * spec.distMult;
      const y = cy + Math.sin(spec.angle) * ry * spec.distMult - bob;

      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = spec.color;
      ctx.fill();
    }

    // Imperial Tribune (Top Center)
    const empX = cx;
    const empY = cy - ry * 1.15;
    ctx.save();
    ctx.translate(empX, empY);

    // Canopy & Gold Frame
    ctx.fillStyle = CYBER_RED;
    ctx.fillRect(-35, -14, 70, 24);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(-35, -14, 70, 24);

    // SPQR Eagle Insignia
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPQR', 0, 0);

    // Emperor's Thumbs Up / Down Verdict
    const verdict = this.crowdExcitement > 40 ? '👍 IUGULA!' : '👎 MISSIO';
    ctx.font = '9px monospace';
    ctx.fillStyle = this.crowdExcitement > 40 ? GOLD : '#C4BAA9';
    ctx.fillText(verdict, 0, 18);

    ctx.restore();
  }

  renderCrowdFavors(ctx) {
    for (const cf of this.crowdFavors) {
      // Parabolic flight
      const currentX = cf.x + (cf.targetX - cf.x) * cf.t;
      const currentY = cf.y + (cf.targetY - cf.y) * cf.t;
      const arcY = Math.sin(cf.t * Math.PI) * cf.height;

      ctx.save();
      ctx.translate(currentX, currentY - arcY);
      ctx.rotate(cf.rotation);

      if (cf.type === 'petal') {
        ctx.fillStyle = cf.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8C6239';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  renderCombatants(ctx) {
    const all = this.getAllCombatants();

    // Render deceased combatants on sand first
    for (const c of all) {
      if (!c.alive) {
        this.renderDeceased(ctx, c);
      }
    }

    // Render living combatants
    for (const c of all) {
      if (c.alive) {
        if (c.type === 'beast') {
          this.renderBeast(ctx, c);
        } else {
          this.renderGladiator(ctx, c);
        }
      }
    }
  }

  renderDeceased(ctx, c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.facing);

    // Silhouette on sand
    ctx.fillStyle = 'rgba(26, 26, 26, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 0, c.radius * 0.9, c.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fallen weapon beside body
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.lineTo(20, 10);
    ctx.stroke();

    ctx.restore();
  }

  renderGladiator(ctx, g) {
    ctx.save();
    ctx.translate(g.x, g.y);

    // Player Champion Laurel Glow
    if (g.isPlayer) {
      ctx.beginPath();
      ctx.arc(0, 0, g.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Rotate towards facing angle
    ctx.rotate(g.facing);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 4, g.radius, g.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Torso / Subligaculum
    ctx.fillStyle = CHARCOAL;
    ctx.beginPath();
    ctx.arc(0, 0, g.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.armorColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Helmet (Cassis) or Head
    ctx.fillStyle = g.type === 'retiarius' ? '#E5D4C0' : GOLD;
    ctx.beginPath();
    ctx.arc(0, 0, g.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (g.type !== 'retiarius') {
      // Crest / Visor
      ctx.strokeStyle = CYBER_RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-g.radius * 0.5, 0);
      ctx.lineTo(g.radius * 0.5, 0);
      ctx.stroke();
    }

    // Shield (Scutum or Parmula) on left arm
    if (g.hasShield) {
      ctx.save();
      const shieldY = -g.radius * 0.85;
      const shieldAngle = g.parryActive ? 0.3 : 0;
      ctx.translate(0, shieldY);
      ctx.rotate(shieldAngle);

      if (g.type === 'murmillo') {
        // Scutum rectangular tower shield
        ctx.fillStyle = CYBER_RED;
        ctx.fillRect(-3, -12, 8, 24);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-3, -12, 8, 24);
        // Boss
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(1, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Small round parmula buckler
        ctx.fillStyle = BRONZE;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Weapon on right arm
    ctx.save();
    const weaponY = g.radius * 0.8;
    ctx.translate(0, weaponY);

    let weaponAngle = 0;
    if (g.state === 'WINDUP') {
      weaponAngle = -0.6; // Pulled back
    } else if (g.state === 'ATTACK') {
      weaponAngle = 0.8 * Math.sin(g.swingProgress * Math.PI); // Forward thrust
    }
    ctx.rotate(weaponAngle);

    if (g.weapon === 'trident') {
      // Retiarius trident
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(g.reach - 10, 0);
      ctx.stroke();

      // Prongs
      const tx = g.reach - 10;
      ctx.beginPath();
      ctx.moveTo(tx, -6);
      ctx.lineTo(tx + 8, -6);
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx + 10, 0);
      ctx.moveTo(tx, 6);
      ctx.lineTo(tx + 8, 6);
      ctx.stroke();
    } else if (g.weapon === 'sica') {
      // Curved blade
      ctx.strokeStyle = '#E056FD';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, -2);
      ctx.lineTo(24, 6);
      ctx.stroke();
    } else {
      // Gladius short sword
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(22, 0);
      ctx.stroke();

      // Pommel & Guard
      ctx.fillStyle = GOLD;
      ctx.fillRect(0, -3, 3, 6);
    }
    ctx.restore();

    // Trapped visual netting overlay
    if (g.state === 'TRAPPED') {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.2;
      for (let k = -g.radius; k <= g.radius; k += 6) {
        ctx.beginPath();
        ctx.moveTo(k, -g.radius);
        ctx.lineTo(k, g.radius);
        ctx.moveTo(-g.radius, k);
        ctx.lineTo(g.radius, k);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Render Health & Stamina Bars (Upright above gladiator)
    this.renderCombatantBars(ctx, g);
  }

  renderBeast(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.facing);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(3, 5, b.radius * 1.2, b.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lion body
    ctx.fillStyle = '#C8933E'; // Tawny golden pelt
    ctx.beginPath();
    ctx.ellipse(0, 0, b.radius * 1.1, b.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mane
    ctx.fillStyle = '#7A4B1A'; // Dark brown lion mane
    ctx.beginPath();
    ctx.arc(b.radius * 0.4, 0, b.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Head & Muzzle
    ctx.fillStyle = '#D6A24D';
    ctx.beginPath();
    ctx.arc(b.radius * 0.75, 0, b.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Glowing Cyber-Red)
    ctx.fillStyle = CYBER_RED;
    ctx.fillRect(b.radius * 0.85, -3, 2, 2);
    ctx.fillRect(b.radius * 0.85, 1, 2, 2);

    // Claws extended if attacking
    if (b.isPouncing || b.attackCooldown > 0.3) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.radius, -8);
      ctx.lineTo(b.radius + 6, -11);
      ctx.moveTo(b.radius, 8);
      ctx.lineTo(b.radius + 6, 11);
      ctx.stroke();
    }

    ctx.restore();

    this.renderCombatantBars(ctx, b);
  }

  renderCombatantBars(ctx, c) {
    const barW = 32;
    const barH = 3.5;
    const barX = c.x - barW * 0.5;
    const barY = c.y - c.radius - 14;

    // Health bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Health bar fill
    const hpRatio = Math.max(0, c.hp / c.maxHp);
    ctx.fillStyle = hpRatio > 0.4 ? (c.isPlayer ? GOLD : CYBER_RED) : '#FF2222';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Stamina bar for gladiators
    if (c.maxStamina) {
      const staY = barY + barH + 1.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX - 1, staY - 1, barW + 2, 2 + 2);

      const staRatio = Math.max(0, c.stamina / c.maxStamina);
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(barX, staY, barW * staRatio, 2);
    }

    // Name tag
    ctx.fillStyle = c.isPlayer ? GOLD : '#C4BAA9';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(c.name, c.x, barY - 2);
  }

  renderProjectiles(ctx) {
    for (const p of this.projectiles) {
      if (p.type === 'net') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1.5;

        const rad = p.currentRadius;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.stroke();

        // Cross threads
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.stroke();

        // Weighted lead sinkers around net perimeter
        ctx.fillStyle = CHARCOAL;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  renderParticles(ctx) {
    // Dust
    for (const d of this.dustParticles) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(216, 194, 157, ${d.alpha})`;
      ctx.fill();
    }

    // Blood droplets
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // Metal Sparks
    for (const s of this.sparkParticles) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }
  }

  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    // Top-left Telemetry
    const badgeW = narrow ? Math.min(sw - 24, 210) : 210;
    ctx.fillStyle = 'rgba(10, 10, 12, 0.75)';
    ctx.fillRect(12, 12, badgeW, 78);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, badgeW, 78);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('COLOSSEUM TELEMETRY', 20, 18);

    ctx.font = '9.5px monospace';
    ctx.fillStyle = '#E5D4C0';
    const activeGlad = this.gladiators.filter(g => g.alive).length;
    const activeBeasts = this.beasts.filter(b => b.alive).length;
    ctx.fillText(`Combatants: ${activeGlad} Glad | ${activeBeasts} Beasts`, 20, 34);
    ctx.fillText(narrow ? `Projs: ${this.projectiles.length} | Parts: ${this.particles.length}` : `Projectiles: ${this.projectiles.length} | Particles: ${this.particles.length + this.dustParticles.length}`, 20, 48);

    // Crowd Excitement Bar
    ctx.fillText('Excitement:', 20, 64);
    const barW = narrow ? 70 : 90;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(100, 63, barW, 8);
    ctx.fillStyle = this.crowdExcitement > 70 ? CYBER_RED : GOLD;
    ctx.fillRect(100, 63, barW * (this.crowdExcitement / 100), 8);

    // Bottom Combat Log (hide on narrow or limit to 2 entries)
    if (this.combatLog.length > 0 && !narrow) {
      const logH = this.combatLog.length * 15 + 10;
      const logY = sh - logH - 12;
      ctx.fillStyle = 'rgba(10, 10, 12, 0.7)';
      ctx.fillRect(12, logY, 340, logH);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.strokeRect(12, logY, 340, logH);

      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (let i = 0; i < this.combatLog.length; i++) {
        const entry = this.combatLog[i];
        const age = this.time - entry.time;
        const alpha = Math.max(0.3, 1 - age * 0.1);
        ctx.fillStyle = i === 0 ? GOLD : `rgba(229, 212, 192, ${alpha})`;
        ctx.fillText(entry.text, 18, logY + 6 + i * 15);
      }
    }

    ctx.restore();
  }
}
