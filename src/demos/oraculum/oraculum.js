// Oraculum: Delphic Pythia Smoke Oracle & Navier-Stokes Fluid Advection
// Pliny Game Lab — Pavilion V: Fabula & Arena (Mythology & Games)
//
// Grounded in classical history (Strabo Geographica 9.3.5, Plutarch De Defectu Oraculorum,
// Pliny the Elder Naturalis Historia): The Pythia breathed intoxicating hydrocarbon/ethylene vapors
// rising from subterranean limestone fissures beneath Apollo's Temple at Delphi, uttering
// prophecies in dactylic hexameter verse while seated upon the sacred bronze tripod over the chasm.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class OraculumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation Parameters (tunable via controls)
    this.vaporDensity = 1.0;     // 0.2 to 3.0: particle emission rate & life
    this.swirlVorticity = 1.0;   // 0.2 to 3.0: fluid turbulence & cursor stirring strength
    this.colorBalance = 0.5;     // 0.0 (all purple) to 1.0 (all gold)
    this.buoyancy = 1.2;         // upward thermal draft of the sacred fissure
    this.audioEnabled = false;   // Delphic acoustic drone toggle

    // Simulation Timing & Trance State
    this.time = 0;
    this.tranceState = 'INSPIRATION'; // 'CONTEMPLATION', 'INSPIRATION', 'ENTHOUSIASMOS', 'EPIPHANY'
    this.tranceTimer = 0;
    this.prophecyFlash = 0; // Flash intensity for prophecy chant

    // Cavern & Altar Geometry
    this.chasmX = this.width * 0.5;
    this.chasmY = this.height * 0.82;
    this.tripodWidth = 140;
    this.tripodHeight = 90;

    // Fluid Simulation (Eulerian Grid)
    // 64x48 grid cells provides crisp fluid swirls at 60+ FPS with zero allocation during step
    this.gridW = 64;
    this.gridH = 48;
    this.fluid = new FluidGrid(this.gridW, this.gridH);

    // Particle Pool for Smoke Advection
    this.maxParticles = 2200;
    this.particles = new Array(this.maxParticles);
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 4,
        baseSize: 4,
        colorType: 'PURPLE', // 'PURPLE' | 'GOLD' | 'EMBER'
        alpha: 0,
        rot: 0,
        vRot: 0,
        curlPhase: 0
      };
    }
    this.particleCursor = 0;

    // Sacred Hexameter Rune Glyphs
    this.maxRunes = 240;
    this.runes = new Array(this.maxRunes);
    for (let i = 0; i < this.maxRunes; i++) {
      this.runes[i] = {
        active: false,
        char: 'Ω',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        vRot: 0,
        size: 16,
        color: '#F1C40F',
        glow: '#9B59B6',
        alpha: 0,
        targetAlpha: 1,
        life: 0,
        maxLife: 6.0,
        scale: 1,
        isHexameterWord: false
      };
    }
    this.runeCursor = 0;

    // Classical Delphic Prophecies Database
    this.prophecies = [
      {
        greek: 'ΓΝΩΘΙ ΣΕΑΥΤΟΝ',
        latin: 'NOSCE TE IPSUM',
        english: 'Know thyself — inscribed on the pronaos of Apollo at Delphi.',
        scansion: '— ∪ ∪ | — —',
        meter: 'Delphic Maxim'
      },
      {
        greek: 'ΜΗΔΕΝ ΑΓΑΝ',
        latin: 'NE QUID NIMIS',
        english: 'Nothing in excess — the golden balance of the Pythian god.',
        scansion: '— ∪ ∪ | —',
        meter: 'Delphic Maxim'
      },
      {
        greek: 'ΑΙΩ ΤΕ ΑΙΑΚΙΔΑ ΡΩΜΑΙΟΥΣ ΝΙΚΑΝ ΔΥΝΑΣΘΑΙ',
        latin: 'AIO TE AEACIDA ROMANOS VINCERE POSSE',
        english: 'I declare that you, son of Aeacus, the Romans can conquer (Pyrrhus).',
        scansion: '— ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      },
      {
        greek: 'ΗΞΕΙΣ ΑΦΙΞΕΙΣ ΟΥ ΘΝΗΞΕΙΣ ΕΝ ΠΟΛΕΜΩ',
        latin: 'IBIS REDIBIS NON MORIERIS IN BELLO',
        english: 'Thou shalt go thou shalt return never in battle shalt thou perish.',
        scansion: '— ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      },
      {
        greek: 'ΤΕΙΧΟΣ ΞΥΛΙΝΟΝ ΔΙΔΟΙ ΤΡΙΤΟΓΕΝΕΙ ΕΥΡΥΟΠΑ ΖΕΥΣ',
        latin: 'MURUM DILATAT LIGNEUM JOVIS PROVIDENTIA',
        english: 'A wooden wall wide-seeing Zeus gives as an impregnable bulwark.',
        scansion: '— — | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      },
      {
        greek: 'ΕΓΓΥΑ ΠΑΡΑ Δ ΑΤΑ',
        latin: 'SPONSIO PESTIS ADES',
        english: 'Pledge a surety, and ruin is right beside thee.',
        scansion: '— ∪ ∪ | — —',
        meter: 'Delphic Maxim'
      },
      {
        greek: 'ΟΥ ΠΑΝΤΩΣ ΘΑΝΟΥΜΑΙ ΠΟΛΥ Δ ΑΙΩΝΟΣ ΥΠΕΡΒΗΣΕΤΑΙ',
        latin: 'NON OMNIS MORIAR MULTAQUE PARS MEI VITABIT LIBITINAM',
        english: 'Not all of me shall die; a great part of me will elude the grave.',
        scansion: '— — | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      },
      {
        greek: 'ΤΟΛΜΑ ΤΥΧΗΝ ΚΡΑΤΥΝΕΙ ΔΕΙΛΟΥΣ Δ ΑΠΟΤΡΕΠΕΙ',
        latin: 'AUDACES FORTUNA IUVAT TIMIDOSQUE REPELLIT',
        english: 'Fortune aids the bold, but turns away the faint of heart.',
        scansion: '— — | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      },
      {
        greek: 'ΕΛΠΙΣ ΕΣΤΙ ΚΑΙ ΕΚ ΣΠΟΔΟΥ ΦΟΙΝΙΞ ΑΝΙΣΤΑΤΑΙ',
        latin: 'SPERO MELIORA SURGETQUE E CINERE PHOENIX',
        english: 'I hope for better things; out of sacred ash the Phoenix shall arise.',
        scansion: '— ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      },
      {
        greek: 'ΧΡΟΝΟΣ ΠΑΝΤΑ ΦΕΡΕΙ ΚΑΙ ΓΝΩΣΙΝ ΑΠΟΚΑΛΥΠΤΕΙ',
        latin: 'TEMPORA LABUNTUR VERITASQUE TANDEM APERITUR',
        english: 'Time bears away all mortal things and uncovers hidden truth.',
        scansion: '— ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — ∪ ∪ | — —',
        meter: 'Dactylic Hexameter'
      }
    ];
    this.currentProphecyIndex = 0;
    this.currentProphecy = this.prophecies[0];

    // Archaic Rune Characters for Smoke Glyphs
    this.greekRunes = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω', 'Ϝ', 'Ϙ', 'Ͳ', 'Ϡ'];

    // Mouse Interaction
    this.isMouseDown = false;
    this.lastMousePos = { x: this.width * 0.5, y: this.height * 0.5 };
    this.mouseVelocity = { x: 0, y: 0 };
    this.stirTimer = 0;

    // Acoustic Drone State (Web Audio API)
    this.audioCtx = null;
    this.droneGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;

    // Presets
    this.presets = {
      delphi: { density: 1.1, vorticity: 1.2, balance: 0.45, name: "Delphi (Apollo's Ethylene Fume)" },
      dodona: { density: 0.8, vorticity: 0.7, balance: 0.75, name: "Dodona (Zeus' Whispering Oaks)" },
      cumae: { density: 1.5, vorticity: 1.8, balance: 0.3, name: "Cumae (Sibyl's Whirlwind Leaves)" }
    };

    // Pre-seed initial smoke & runes
    this.seedInitialVapors();

    // DOM Controls Initialization
    this.initControls();
    attachTouchBridge(this, canvas);
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION & SEEDING                                                   */
  /* -------------------------------------------------------------------------- */

  seedInitialVapors() {
    // Inject warm upward velocity plume at the chasm
    for (let f = 0; f < 30; f++) {
      this.emitChasmVapors(0.016);
    }
    // Spawn initial oracle runes
    this.spawnProphecyRunes(this.currentProphecy.greek);
  }

  /* -------------------------------------------------------------------------- */
  /* DOM CONTROLS (Safe Headless Guard)                                         */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Delphic Temple Preset</label>
        <select id="oracle-preset" class="sub-btn" style="width: 100%; text-align: left; padding: 6px 8px;">
          <option value="delphi" selected>🏛️ Delphi (Apollo's Ethylene Fume)</option>
          <option value="dodona">🌳 Dodona (Zeus' Whispering Oaks)</option>
          <option value="cumae">🌪️ Cumae (Sibyl's Whirlwind Leaves)</option>
        </select>
      </div>

      <div class="control-group">
        <label>Vapor Density: <span id="density-val">${this.vaporDensity.toFixed(2)}x</span></label>
        <input type="range" id="vapor-density" min="0.2" max="3.0" step="0.05" value="${this.vaporDensity}">
      </div>

      <div class="control-group">
        <label>Swirl Vorticity: <span id="vorticity-val">${this.swirlVorticity.toFixed(2)}x</span></label>
        <input type="range" id="swirl-vorticity" min="0.2" max="3.0" step="0.05" value="${this.swirlVorticity}">
      </div>

      <div class="control-group">
        <label>Sacred Spectrum (Purple vs Gold): <span id="balance-val">${Math.round(this.colorBalance * 100)}% Gold</span></label>
        <input type="range" id="color-balance" min="0.0" max="1.0" step="0.02" value="${this.colorBalance}">
      </div>

      <div class="control-group">
        <label>Oracular Rites</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="chant-prophecy" style="grid-column: span 2; font-weight: 700; color: #f1c40f; border-color: #d4af37;">
            🔥 Chant Prophecy (Space)
          </button>
          <button class="sub-btn" id="stir-vapors">🌀 Stir Sacred Fumes</button>
          <button class="sub-btn" id="clear-vapors">💨 Disperse Vapors</button>
        </div>
      </div>

      <div class="control-group">
        <label>Acoustic Cavern Resonance</label>
        <button class="sub-btn" id="toggle-audio">
          ${this.audioEnabled ? '🔔 Drone Resonance: ACTIVE' : '🔕 Enable Cave Acoustic Drone'}
        </button>
      </div>

      <div style="font-size: 0.72rem; color: #8c909e; line-height: 1.35; padding: 6px 4px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 4px;">
        <strong style="color: #d4af37;">How to Divine:</strong> Click & drag cursor to stir the sacred vapor vortices. Press <em>Chant Prophecy</em> or tap <em>Space</em> to consult the Delphic Oracle.
      </div>
    `;

    // Event Bindings
    const densitySlider = this.controlsContainer.querySelector('#vapor-density');
    const densityVal = this.controlsContainer.querySelector('#density-val');
    if (densitySlider && densityVal) {
      densitySlider.addEventListener('input', (e) => {
        this.vaporDensity = parseFloat(e.target.value);
        densityVal.textContent = `${this.vaporDensity.toFixed(2)}x`;
      });
    }

    const vorticitySlider = this.controlsContainer.querySelector('#swirl-vorticity');
    const vorticityVal = this.controlsContainer.querySelector('#vorticity-val');
    if (vorticitySlider && vorticityVal) {
      vorticitySlider.addEventListener('input', (e) => {
        this.swirlVorticity = parseFloat(e.target.value);
        vorticityVal.textContent = `${this.swirlVorticity.toFixed(2)}x`;
      });
    }

    const balanceSlider = this.controlsContainer.querySelector('#color-balance');
    const balanceVal = this.controlsContainer.querySelector('#balance-val');
    if (balanceSlider && balanceVal) {
      balanceSlider.addEventListener('input', (e) => {
        this.colorBalance = parseFloat(e.target.value);
        balanceVal.textContent = `${Math.round(this.colorBalance * 100)}% Gold`;
      });
    }

    const presetSelect = this.controlsContainer.querySelector('#oracle-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const p = this.presets[e.target.value];
        if (p) {
          this.vaporDensity = p.density;
          this.swirlVorticity = p.vorticity;
          this.colorBalance = p.balance;
          if (densitySlider) densitySlider.value = p.density;
          if (densityVal) densityVal.textContent = `${p.density.toFixed(2)}x`;
          if (vorticitySlider) vorticitySlider.value = p.vorticity;
          if (vorticityVal) vorticityVal.textContent = `${p.vorticity.toFixed(2)}x`;
          if (balanceSlider) balanceSlider.value = p.balance;
          if (balanceVal) balanceVal.textContent = `${Math.round(p.balance * 100)}% Gold`;
          this.chantProphecy();
        }
      });
    }

    const chantBtn = this.controlsContainer.querySelector('#chant-prophecy');
    if (chantBtn) {
      chantBtn.addEventListener('click', () => {
        this.chantProphecy();
      });
    }

    const stirBtn = this.controlsContainer.querySelector('#stir-vapors');
    if (stirBtn) {
      stirBtn.addEventListener('click', () => {
        this.stirChasmVortex();
      });
    }

    const clearBtn = this.controlsContainer.querySelector('#clear-vapors');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearVapors();
      });
    }

    const audioBtn = this.controlsContainer.querySelector('#toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.toggleAudio();
        audioBtn.textContent = this.audioEnabled ? '🔔 Drone Resonance: ACTIVE' : '🔕 Enable Cave Acoustic Drone';
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* ORACLE PROPHESY CHANT & RUNE GENERATION                                   */
  /* -------------------------------------------------------------------------- */

  chantProphecy() {
    this.currentProphecyIndex = (this.currentProphecyIndex + 1) % this.prophecies.length;
    this.currentProphecy = this.prophecies[this.currentProphecyIndex];
    this.tranceState = 'ENTHOUSIASMOS';
    this.tranceTimer = 3.5;
    this.prophecyFlash = 1.0;

    // Inject violent holy swirl at the altar
    const cx = this.chasmX;
    const cy = this.chasmY - 40;
    this.fluid.addSwirl(cx, cy, (Math.random() > 0.5 ? 450 : -450) * this.swirlVorticity, 160);
    this.fluid.addVelocity(cx, cy, 0, -220 * this.buoyancy, 120);

    // Burst sacred glowing smoke particles
    const burstCount = Math.floor(180 * this.vaporDensity);
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      const p = this.allocateParticle();
      if (!p) break;
      p.active = true;
      p.x = cx + (Math.random() - 0.5) * 60;
      p.y = cy + (Math.random() - 0.5) * 30;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 60;
      p.life = 0;
      p.maxLife = 2.5 + Math.random() * 3.5;
      p.baseSize = 6 + Math.random() * 12;
      p.size = p.baseSize;
      p.colorType = Math.random() < 0.65 ? 'GOLD' : 'PURPLE';
      p.alpha = 0.9;
      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 4.0;
      p.curlPhase = Math.random() * 10;
    }

    // Spawn floating hexameter rune words into the rising smoke
    this.spawnProphecyRunes(this.currentProphecy.greek);

    // Play singing bowl resonance chime
    this.playBowlChime();
  }

  spawnProphecyRunes(text) {
    const cleanText = text.replace(/[^Α-Ωα-ωA-Za-z]/g, '');
    const charList = cleanText.length > 0 ? cleanText.split('') : this.greekRunes.slice(0, 16);
    const startX = this.width * 0.2;
    const spanX = this.width * 0.6;
    const step = spanX / Math.max(1, charList.length);

    for (let i = 0; i < charList.length; i++) {
      const char = charList[i].toUpperCase();
      const r = this.allocateRune();
      if (!r) break;
      r.active = true;
      r.char = char;
      r.x = startX + i * step + (Math.random() - 0.5) * 20;
      r.y = this.chasmY - 60 - Math.sin((i / charList.length) * Math.PI) * 50 + (Math.random() - 0.5) * 30;
      r.vx = (Math.random() - 0.5) * 25;
      r.vy = -30 - Math.random() * 40;
      r.rot = (Math.random() - 0.5) * 0.3;
      r.vRot = (Math.random() - 0.5) * 0.8;
      r.size = 18 + Math.random() * 10;
      r.scale = 1.4;
      r.alpha = 0;
      r.targetAlpha = 0.9 + Math.random() * 0.1;
      r.life = 0;
      r.maxLife = 6.0 + Math.random() * 4.0;
      r.color = i % 2 === 0 ? '#F1C40F' : '#F7DC6F';
      r.glow = '#9B59B6';
      r.isHexameterWord = true;
    }
  }

  stirChasmVortex() {
    const cx = this.chasmX;
    const cy = this.height * 0.55;
    const dir = Math.random() > 0.5 ? 1 : -1;
    this.fluid.addSwirl(cx, cy, dir * 550 * this.swirlVorticity, 220);
    this.fluid.addVelocity(cx, cy, 0, -180, 150);

    // Condense 6 ethereal runes from the stirred smoke
    for (let i = 0; i < 6; i++) {
      const r = this.allocateRune();
      if (!r) break;
      const angle = (i / 6) * Math.PI * 2;
      const rad = 80 + Math.random() * 60;
      r.active = true;
      r.char = this.greekRunes[Math.floor(Math.random() * this.greekRunes.length)];
      r.x = cx + Math.cos(angle) * rad;
      r.y = cy + Math.sin(angle) * rad;
      r.vx = -Math.sin(angle) * 70 * dir;
      r.vy = Math.cos(angle) * 70 * dir;
      r.rot = angle;
      r.vRot = dir * 1.5;
      r.size = 20;
      r.scale = 1.0;
      r.alpha = 0;
      r.targetAlpha = 0.95;
      r.life = 0;
      r.maxLife = 5.0;
      r.color = '#F1C40F';
      r.glow = '#9B59B6';
      r.isHexameterWord = false;
    }
  }

  clearVapors() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].active = false;
    }
    for (let i = 0; i < this.maxRunes; i++) {
      this.runes[i].active = false;
    }
    this.fluid.clear();
  }

  /* -------------------------------------------------------------------------- */
  /* PARTICLE & RUNE ALLOCATORS (Pre-allocated Object Pools)                   */
  /* -------------------------------------------------------------------------- */

  allocateParticle() {
    for (let i = 0; i < this.maxParticles; i++) {
      const idx = (this.particleCursor + i) % this.maxParticles;
      if (!this.particles[idx].active) {
        this.particleCursor = (idx + 1) % this.maxParticles;
        return this.particles[idx];
      }
    }
    // Overwrite oldest if saturated
    const oldest = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % this.maxParticles;
    return oldest;
  }

  allocateRune() {
    for (let i = 0; i < this.maxRunes; i++) {
      const idx = (this.runeCursor + i) % this.maxRunes;
      if (!this.runes[idx].active) {
        this.runeCursor = (idx + 1) % this.maxRunes;
        return this.runes[idx];
      }
    }
    const oldest = this.runes[this.runeCursor];
    this.runeCursor = (this.runeCursor + 1) % this.maxRunes;
    return oldest;
  }

  /* -------------------------------------------------------------------------- */
  /* CONTINUOUS EMISSION & SIMULATION STEP                                      */
  /* -------------------------------------------------------------------------- */

  emitChasmVapors(dt) {
    const cx = this.chasmX;
    const cy = this.chasmY - 25;

    // Inject thermal upward buoyancy and micro turbulence into fluid grid
    const plumeStrength = 90 * this.buoyancy;
    const wobble = Math.sin(this.time * 2.8) * 40 * this.swirlVorticity;
    this.fluid.addVelocity(cx, cy, wobble, -plumeStrength, 80);

    // Number of particles to emit this frame
    const rate = 85 * this.vaporDensity;
    const count = Math.floor(rate * dt) + (Math.random() < (rate * dt) % 1 ? 1 : 0);

    for (let i = 0; i < count; i++) {
      const p = this.allocateParticle();
      if (!p) break;
      p.active = true;

      // Fissure spread along the chasm lips
      const spreadX = (Math.random() - 0.5) * 70;
      p.x = cx + spreadX;
      p.y = cy + (Math.random() - 0.5) * 16;

      // Initial rising velocity with gentle curl
      p.vx = wobble * 0.4 + (Math.random() - 0.5) * 20;
      p.vy = -35 - Math.random() * 50;

      p.life = 0;
      p.maxLife = 3.5 + Math.random() * 3.5;
      p.baseSize = 7 + Math.random() * 14;
      p.size = p.baseSize;

      // Purple ethylene vs Apollo's divine Gold
      const isGold = Math.random() < this.colorBalance;
      p.colorType = isGold ? 'GOLD' : 'PURPLE';

      p.alpha = 0;
      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 1.5;
      p.curlPhase = Math.random() * Math.PI * 2;
    }

    // Occasional glowing embers leaping from tripod brazier
    if (Math.random() < 0.25 * this.vaporDensity) {
      const ember = this.allocateParticle();
      if (ember) {
        ember.active = true;
        ember.x = cx + (Math.random() - 0.5) * 35;
        ember.y = cy - 5;
        ember.vx = (Math.random() - 0.5) * 45;
        ember.vy = -70 - Math.random() * 60;
        ember.life = 0;
        ember.maxLife = 1.2 + Math.random() * 1.4;
        ember.baseSize = 2.5 + Math.random() * 2.5;
        ember.size = ember.baseSize;
        ember.colorType = 'EMBER';
        ember.alpha = 1.0;
        ember.rot = 0;
        ember.vRot = 0;
        ember.curlPhase = 0;
      }
    }

    // Occasional spontaneous mystic rune condensation
    if (Math.random() < 0.08 * this.vaporDensity) {
      const r = this.allocateRune();
      if (r) {
        r.active = true;
        r.char = this.greekRunes[Math.floor(Math.random() * this.greekRunes.length)];
        r.x = cx + (Math.random() - 0.5) * 90;
        r.y = cy - 20 - Math.random() * 60;
        r.vx = (Math.random() - 0.5) * 15;
        r.vy = -20 - Math.random() * 30;
        r.rot = (Math.random() - 0.5) * 0.4;
        r.vRot = (Math.random() - 0.5) * 0.6;
        r.size = 14 + Math.random() * 8;
        r.scale = 0.8;
        r.alpha = 0;
        r.targetAlpha = 0.7 + Math.random() * 0.3;
        r.life = 0;
        r.maxLife = 4.0 + Math.random() * 3.0;
        r.color = Math.random() < this.colorBalance ? '#F1C40F' : '#D2B4DE';
        r.glow = '#9B59B6';
        r.isHexameterWord = false;
      }
    }
  }

  update(dt) {
    // Clamp delta time to prevent physics explosions on lag spikes
    const stepDt = Math.min(dt, 0.05);
    this.time += stepDt;

    // Trance State Machine
    if (this.tranceTimer > 0) {
      this.tranceTimer -= stepDt;
      if (this.tranceTimer <= 0) {
        this.tranceState = 'INSPIRATION';
      }
    }
    if (this.prophecyFlash > 0) {
      this.prophecyFlash = Math.max(0, this.prophecyFlash - stepDt * 1.5);
    }

    // Mouse Stirring Advection Injection
    if (this.isMouseDown) {
      const stirVx = this.mouseVelocity.x * 3.5 * this.swirlVorticity;
      const stirVy = this.mouseVelocity.y * 3.5 * this.swirlVorticity;
      this.fluid.addVelocity(this.lastMousePos.x, this.lastMousePos.y, stirVx, stirVy, 90);

      // Add rotational vortex curl
      const speed = Math.hypot(stirVx, stirVy);
      if (speed > 10) {
        const curlDirection = (this.lastMousePos.x > this.width * 0.5 ? 1 : -1);
        this.fluid.addSwirl(this.lastMousePos.x, this.lastMousePos.y, curlDirection * speed * 2.0, 80);

        // Emit cursor stirring wisps
        if (Math.random() < 0.6) {
          const p = this.allocateParticle();
          if (p) {
            p.active = true;
            p.x = this.lastMousePos.x + (Math.random() - 0.5) * 14;
            p.y = this.lastMousePos.y + (Math.random() - 0.5) * 14;
            p.vx = stirVx * 0.3 + (Math.random() - 0.5) * 20;
            p.vy = stirVy * 0.3 + (Math.random() - 0.5) * 20;
            p.life = 0;
            p.maxLife = 1.8 + Math.random() * 2.0;
            p.baseSize = 6 + Math.random() * 8;
            p.size = p.baseSize;
            p.colorType = Math.random() < this.colorBalance ? 'GOLD' : 'PURPLE';
            p.alpha = 0.8;
            p.rot = Math.random() * Math.PI * 2;
            p.vRot = (Math.random() - 0.5) * 3.0;
            p.curlPhase = Math.random() * 10;
          }
        }
      }
    }

    // Decay mouse velocity
    this.mouseVelocity.x *= Math.pow(0.85, stepDt * 60);
    this.mouseVelocity.y *= Math.pow(0.85, stepDt * 60);

    // Step continuous Delphic Chasm emission
    this.emitChasmVapors(stepDt);

    // Step Navier-Stokes Eulerian Fluid Grid
    this.fluid.step(stepDt, this.swirlVorticity);

    // Step Smoke Particles (Lagrangian Advection)
    const fw = this.width;
    const fh = this.height;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += stepDt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      const progress = p.life / p.maxLife;

      // Soft fade in, long wavering sustain, graceful dissipation
      if (progress < 0.15) {
        p.alpha = (progress / 0.15);
      } else if (progress > 0.65) {
        p.alpha = (1 - (progress - 0.65) / 0.35);
      } else {
        p.alpha = 1.0;
      }

      // Advect particle using fluid velocity field at (p.x, p.y)
      const [u, v] = this.fluid.sampleVelocity(p.x, p.y, fw, fh);

      // Micro-curl turbulence for ethereal wisp tendrils
      p.curlPhase += stepDt * 2.5;
      const microCurlX = Math.cos(p.curlPhase + p.y * 0.02) * 12;
      const microCurlY = Math.sin(p.curlPhase + p.x * 0.02) * 8;

      p.vx = p.vx * 0.94 + (u + microCurlX) * 0.06;
      p.vy = p.vy * 0.94 + (v + microCurlY - (p.colorType === 'EMBER' ? 25 : 8) * this.buoyancy) * 0.06;

      p.x += (p.vx + u) * stepDt;
      p.y += (p.vy + v) * stepDt;

      p.rot += p.vRot * stepDt;

      // Growth as smoke expands into the cavern air
      if (p.colorType !== 'EMBER') {
        p.size = p.baseSize * (1 + progress * 2.2);
      } else {
        p.size = p.baseSize * (1 - progress * 0.6);
      }

      // Cavern boundary bounce / damping
      if (p.x < 10) { p.x = 10; p.vx = Math.abs(p.vx) * 0.5; }
      if (p.x > fw - 10) { p.x = fw - 10; p.vx = -Math.abs(p.vx) * 0.5; }
      if (p.y < 10) {
        p.alpha *= Math.pow(0.9, stepDt * 60);
        if (p.y < -30) p.active = false;
      }
    }

    // Step Floating Sacred Runes
    for (let i = 0; i < this.maxRunes; i++) {
      const r = this.runes[i];
      if (!r.active) continue;

      r.life += stepDt;
      if (r.life >= r.maxLife) {
        r.active = false;
        continue;
      }

      const progress = r.life / r.maxLife;

      // Fade in & out
      if (progress < 0.2) {
        r.alpha = (progress / 0.2) * r.targetAlpha;
      } else if (progress > 0.7) {
        r.alpha = (1 - (progress - 0.7) / 0.3) * r.targetAlpha;
      } else {
        r.alpha = r.targetAlpha;
      }

      // Advection through fluid grid
      const [u, v] = this.fluid.sampleVelocity(r.x, r.y, fw, fh);
      r.vx = r.vx * 0.92 + u * 0.08;
      r.vy = r.vy * 0.92 + (v - 12 * this.buoyancy) * 0.08;

      r.x += (r.vx + u * 0.5) * stepDt;
      r.y += (r.vy + v * 0.5) * stepDt;

      r.rot += r.vRot * stepDt;
      r.scale = 1.0 + Math.sin(this.time * 2.0 + r.x * 0.05) * 0.15;

      // Boundary cleanup
      if (r.x < 20 || r.x > fw - 20 || r.y < 20) {
        r.alpha *= Math.pow(0.92, stepDt * 60);
        if (r.y < 0) r.active = false;
      }
    }

    // Update Web Audio drone modulations if active
    if (this.audioEnabled && this.droneFilter) {
      const targetFreq = 180 + Math.sin(this.time * 0.4) * 80 + this.swirlVorticity * 60;
      this.droneFilter.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.2);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING PIPELINE                                                         */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    const w = this.width;
    const h = this.height;

    ctx.save();

    // 1. Cavernous Black Background & Subterranean Atmosphere
    this.renderCavernBackground(ctx, w, h);

    // 2. Sacred Chasm Fissure & Geological Cracks
    this.renderChasmFissure(ctx, w, h);

    // 3. Apollo's Bronze Tripod & Incense Brazier
    this.renderBronzeTripod(ctx, w, h);

    // 4. Wisps of Glowing Purple & Gold Smoke
    this.renderSmokeWisps(ctx);

    // 5. Floating Sacred Hexameter Runes
    this.renderFloatingRunes(ctx);

    // 6. Pythian Trance Epiphany Flash & Ethereal Rays
    if (this.prophecyFlash > 0.01) {
      this.renderEpiphanyFlash(ctx, w, h);
    }

    // 7. Delphic Prophecy Inscription Banner & Classical HUD
    this.renderProphecyBanner(ctx, w, h);

    ctx.restore();
  }

  renderCavernBackground(ctx, w, h) {
    // Deep obsidian/slate cave gradient
    const bgGrad = ctx.createRadialGradient(
      this.chasmX, this.chasmY, 60,
      w * 0.5, h * 0.45, Math.max(w, h) * 0.75
    );
    bgGrad.addColorStop(0, '#150a22');
    bgGrad.addColorStop(0.35, '#0c0716');
    bgGrad.addColorStop(0.7, '#07040d');
    bgGrad.addColorStop(1, '#020104');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant subterranean stalactite ceiling silhouettes
    ctx.fillStyle = 'rgba(6, 4, 10, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const stalactites = [
      [0.0, 35], [0.08, 90], [0.15, 45], [0.24, 110], [0.32, 60],
      [0.42, 135], [0.5, 75], [0.58, 140], [0.68, 65], [0.76, 120],
      [0.85, 50], [0.92, 100], [1.0, 40]
    ];
    for (let i = 0; i < stalactites.length; i++) {
      ctx.lineTo(stalactites[i][0] * w, stalactites[i][1]);
    }
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.fill();

    // Cavern rock flanks
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.12, h * 0.4);
    ctx.lineTo(w * 0.08, h * 0.85);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.88, h * 0.4);
    ctx.lineTo(w * 0.92, h * 0.85);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  renderChasmFissure(ctx, w, h) {
    const cx = this.chasmX;
    const cy = this.chasmY;

    // Subterranean glowing chasm floor
    ctx.save();
    const chasmGrad = ctx.createRadialGradient(cx, cy + 15, 10, cx, cy + 15, 140);
    chasmGrad.addColorStop(0, 'rgba(155, 89, 182, 0.45)');
    chasmGrad.addColorStop(0.4, 'rgba(241, 196, 15, 0.25)');
    chasmGrad.addColorStop(0.8, 'rgba(142, 68, 173, 0.1)');
    chasmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = chasmGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 15, 160, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chasm rock fracture edges
    ctx.strokeStyle = '#2c1e3d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 25);
    ctx.quadraticCurveTo(cx - 70, cy + 10, cx - 20, cy + 18);
    ctx.quadraticCurveTo(cx + 60, cy + 8, cx + 150, cy + 26);
    ctx.stroke();

    ctx.strokeStyle = '#1a0e28';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 130, cy + 28);
    ctx.quadraticCurveTo(cx, cy + 34, cx + 130, cy + 28);
    ctx.stroke();

    // Sacred luminous cracks with ethylene glow
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy + 20);
    ctx.lineTo(cx - 35, cy + 28);
    ctx.lineTo(cx - 10, cy + 22);
    ctx.lineTo(cx + 40, cy + 27);
    ctx.lineTo(cx + 70, cy + 19);
    ctx.stroke();

    ctx.restore();
  }

  renderBronzeTripod(ctx, w, h) {
    const cx = this.chasmX;
    const cy = this.chasmY - 10;
    const tw = this.tripodWidth;
    const th = this.tripodHeight;

    ctx.save();

    // Bronze legs of Apollo's sacred tripod (Cortina Pythiae)
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - th + 22);
    ctx.quadraticCurveTo(cx - 55, cy - th * 0.4, cx - tw * 0.45, cy + 18);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - th + 22);
    ctx.quadraticCurveTo(cx + 55, cy - th * 0.4, cx + tw * 0.45, cy + 18);
    ctx.stroke();

    // Center rear leg
    ctx.strokeStyle = '#7f5a06';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - th + 22);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // Bronze ring braces
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy - th * 0.4, 38, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Tripod Basin (Lebes / Sacred Cauldron)
    const bowlY = cy - th + 22;
    const bowlGrad = ctx.createLinearGradient(cx - 45, bowlY - 16, cx + 45, bowlY + 12);
    bowlGrad.addColorStop(0, '#5a3d08');
    bowlGrad.addColorStop(0.3, '#d4af37');
    bowlGrad.addColorStop(0.7, '#f1c40f');
    bowlGrad.addColorStop(1, '#5a3d08');

    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.ellipse(cx, bowlY, 46, 15, 0, 0, Math.PI);
    ctx.fill();

    // Brazier rim
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, bowlY, 46, 11, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred laurel branch (Daphne) over the tripod
    ctx.fillStyle = '#27ae60';
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx - 36, bowlY - 6, 12, 5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(cx + 36, bowlY - 6, 12, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing coals & sacred ethylene luminescence inside cauldron
    const coalGrad = ctx.createRadialGradient(cx, bowlY, 2, cx, bowlY, 35);
    coalGrad.addColorStop(0, '#ffffff');
    coalGrad.addColorStop(0.3, '#f1c40f');
    coalGrad.addColorStop(0.7, '#9b59b6');
    coalGrad.addColorStop(1, 'rgba(155, 89, 182, 0)');
    ctx.fillStyle = coalGrad;
    ctx.beginPath();
    ctx.ellipse(cx, bowlY, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSmokeWisps(ctx) {
    ctx.save();
    // Use 'screen' blending to achieve ethereal glowing vapor overlays
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active || p.alpha <= 0.01) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.colorType === 'PURPLE') {
        // Delphic Pythia Purple Smoke (#9B59B6)
        const rad = p.size;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        grad.addColorStop(0, `rgba(210, 180, 222, ${p.alpha * 0.45})`);
        grad.addColorStop(0.4, `rgba(155, 89, 182, ${p.alpha * 0.35})`);
        grad.addColorStop(0.8, `rgba(142, 68, 173, ${p.alpha * 0.15})`);
        grad.addColorStop(1, 'rgba(142, 68, 173, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        // Slightly elongated wisp lobe
        ctx.ellipse(0, 0, rad, rad * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.colorType === 'GOLD') {
        // Apollo's Solar Gold Smoke (#F1C40F)
        const rad = p.size;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        grad.addColorStop(0, `rgba(254, 249, 231, ${p.alpha * 0.55})`);
        grad.addColorStop(0.4, `rgba(241, 196, 15, ${p.alpha * 0.38})`);
        grad.addColorStop(0.75, `rgba(243, 156, 18, ${p.alpha * 0.16})`);
        grad.addColorStop(1, 'rgba(243, 156, 18, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad, rad * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.colorType === 'EMBER') {
        // Glowing Tripod Sparks / Embers
        const rad = p.size;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 1.8);
        grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
        grad.addColorStop(0.3, `rgba(241, 196, 15, ${p.alpha * 0.9})`);
        grad.addColorStop(0.7, `rgba(230, 126, 34, ${p.alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(230, 126, 34, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, rad * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  renderFloatingRunes(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < this.maxRunes; i++) {
      const r = this.runes[i];
      if (!r.active || r.alpha <= 0.01) continue;

      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.scale(r.scale, r.scale);

      const fontSize = Math.floor(r.size);
      ctx.font = `bold ${fontSize}px 'Cinzel', 'Times New Roman', serif`;

      // Soft purple or gold aura glow
      ctx.shadowColor = r.glow;
      ctx.shadowBlur = 12 * r.scale;

      // Glyph stroke
      ctx.strokeStyle = `rgba(155, 89, 182, ${r.alpha * 0.6})`;
      ctx.lineWidth = 3;
      ctx.strokeText(r.char, 0, 0);

      // Glyph core fill (radiant gold)
      ctx.fillStyle = r.color === '#F1C40F'
        ? `rgba(241, 196, 15, ${r.alpha})`
        : `rgba(210, 180, 222, ${r.alpha})`;
      ctx.fillText(r.char, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }

  renderEpiphanyFlash(ctx, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const flashGrad = ctx.createRadialGradient(
      this.chasmX, this.chasmY - 40, 20,
      this.chasmX, this.chasmY - 40, w * 0.8
    );
    flashGrad.addColorStop(0, `rgba(255, 255, 255, ${this.prophecyFlash * 0.5})`);
    flashGrad.addColorStop(0.3, `rgba(241, 196, 15, ${this.prophecyFlash * 0.35})`);
    flashGrad.addColorStop(0.7, `rgba(155, 89, 182, ${this.prophecyFlash * 0.2})`);
    flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  renderProphecyBanner(ctx, w, h) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = w / ui;
    const sh = h / ui;
    const narrow = sw < 560;

    // Classical Inscription Stone Tablet at top
    const bannerW = Math.min(680, sw - 32);
    const bannerH = narrow ? 84 : 104;
    const bannerX = (sw - bannerW) * 0.5;
    const bannerY = narrow ? 12 : 24;

    // Semi-translucent dark marble plaque
    ctx.fillStyle = 'rgba(10, 7, 16, 0.78)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.stroke();

    // Inner gold meander filigree corners
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    const cornerSize = narrow ? 6 : 10;
    // Top-left
    ctx.strokeRect(bannerX + 4, bannerY + 4, cornerSize, cornerSize);
    // Top-right
    ctx.strokeRect(bannerX + bannerW - (cornerSize + 4), bannerY + 4, cornerSize, cornerSize);
    // Bottom-left
    ctx.strokeRect(bannerX + 4, bannerY + bannerH - (cornerSize + 4), cornerSize, cornerSize);
    // Bottom-right
    ctx.strokeRect(bannerX + bannerW - (cornerSize + 4), bannerY + bannerH - (cornerSize + 4), cornerSize, cornerSize);

    // Title: Oracular Hexameter
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.font = `600 ${narrow ? 9 : 11}px 'JetBrains Mono', monospace`;
    ctx.letterSpacing = narrow ? '1px' : '2px';
    const tranceLabel = this.tranceState === 'ENTHOUSIASMOS' ? '⚡ PYTHIAN ENTHOUSIASMOS ⚡' : 'DELPHIC ORACULUM';
    ctx.fillText(narrow ? tranceLabel : `${tranceLabel} — ${this.currentProphecy.meter.toUpperCase()}`, bannerX + bannerW * 0.5, bannerY + (narrow ? 16 : 20));

    // Main Greek Prophecy Line (Glowing Gold)
    ctx.fillStyle = '#f1c40f';
    ctx.font = `bold ${narrow ? 13 : 17}px 'Cinzel', 'Times New Roman', serif`;
    ctx.shadowColor = '#9b59b6';
    ctx.shadowBlur = 8;
    ctx.fillText(this.currentProphecy.greek, bannerX + bannerW * 0.5, bannerY + (narrow ? 36 : 44));
    ctx.shadowBlur = 0;

    // Latin Equivalent / Hexameter Verse
    ctx.fillStyle = '#d2b4de';
    ctx.font = `italic ${narrow ? 10 : 12}px 'Cinzel', serif`;
    ctx.fillText(this.currentProphecy.latin, bannerX + bannerW * 0.5, bannerY + (narrow ? 54 : 65));

    // Scansion & Translation
    ctx.fillStyle = '#8c909e';
    ctx.font = `${narrow ? 9 : 11}px 'JetBrains Mono', monospace`;
    const engText = narrow && this.currentProphecy.english.length > 40 ? `${this.currentProphecy.english.slice(0, 38)}...` : this.currentProphecy.english;
    ctx.fillText(narrow ? `"${engText}"` : `Meter: ${this.currentProphecy.scansion} | "${this.currentProphecy.english}"`, bannerX + bannerW * 0.5, bannerY + (narrow ? 72 : 88));

    ctx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* CONTRACT METHODS: RESIZE, RESET, DESTROY, ENTITY COUNT                    */
  /* -------------------------------------------------------------------------- */

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.chasmX = this.width * 0.5;
    this.chasmY = this.height * 0.82;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  reset() {
    this.time = 0;
    this.tranceState = 'CONTEMPLATION';
    this.tranceTimer = 0;
    this.prophecyFlash = 0;
    this.currentProphecyIndex = 0;
    this.currentProphecy = this.prophecies[0];

    this.clearVapors();
    this.seedInitialVapors();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.clearVapors();
    this.particles = [];
    this.runes = [];
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {
        // safe ignore
      }
      this.audioCtx = null;
    }
  }

  getEntityCount() {
    // Contract requirement: Active smoke particles + floating rune glyphs
    let activeSmoke = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.particles[i] && this.particles[i].active) activeSmoke++;
    }
    let activeRunes = 0;
    for (let i = 0; i < this.maxRunes; i++) {
      if (this.runes[i] && this.runes[i].active) activeRunes++;
    }
    return activeSmoke + activeRunes;
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING: MOUSE & KEYBOARD                                          */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    if (!pos) return;
    this.isMouseDown = true;
    this.lastMousePos = { x: pos.x, y: pos.y };

    // Burst sacred swirl at click point
    const dir = Math.random() > 0.5 ? 1 : -1;
    this.fluid.addSwirl(pos.x, pos.y, dir * 350 * this.swirlVorticity, 110);
    this.fluid.addVelocity(pos.x, pos.y, (Math.random() - 0.5) * 60, -80, 80);

    // Condense rune glyph at touch
    const r = this.allocateRune();
    if (r) {
      r.active = true;
      r.char = this.greekRunes[Math.floor(Math.random() * this.greekRunes.length)];
      r.x = pos.x;
      r.y = pos.y;
      r.vx = (Math.random() - 0.5) * 40;
      r.vy = -40 - Math.random() * 30;
      r.rot = 0;
      r.vRot = dir * 1.5;
      r.size = 22;
      r.scale = 1.2;
      r.alpha = 0;
      r.targetAlpha = 1.0;
      r.life = 0;
      r.maxLife = 4.5;
      r.color = '#F1C40F';
      r.glow = '#9B59B6';
      r.isHexameterWord = false;
    }
  }

  onMouseMove(pos) {
    if (!pos) return;
    if (this.lastMousePos) {
      this.mouseVelocity.x = pos.x - this.lastMousePos.x;
      this.mouseVelocity.y = pos.y - this.lastMousePos.y;
    }
    this.lastMousePos = { x: pos.x, y: pos.y };
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.chantProphecy();
    } else if (key === 'c' || key === 'C') {
      this.clearVapors();
    } else if (key === 's' || key === 'S') {
      this.stirChasmVortex();
    }
  }

  onKeyUp(key, e) {
    // Contract completeness
  }

  /* -------------------------------------------------------------------------- */
  /* ACOUSTIC SYNTHESIS (Web Audio API)                                        */
  /* -------------------------------------------------------------------------- */

  initAudio() {
    if (typeof window === 'undefined') return false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Master gain
      this.droneGain = this.audioCtx.createGain();
      this.droneGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      this.droneGain.connect(this.audioCtx.destination);

      // Lowpass resonant cavern filter
      this.droneFilter = this.audioCtx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(180, this.audioCtx.currentTime);
      this.droneFilter.Q.setValueAtTime(4.0, this.audioCtx.currentTime);
      this.droneFilter.connect(this.droneGain);

      // D2 Sacred Drone (73.4 Hz)
      this.droneOsc1 = this.audioCtx.createOscillator();
      this.droneOsc1.type = 'triangle';
      this.droneOsc1.frequency.setValueAtTime(73.4, this.audioCtx.currentTime);
      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc1.start();

      // A2 Sacred Fifth Drone (110.0 Hz)
      this.droneOsc2 = this.audioCtx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(110.0, this.audioCtx.currentTime);
      this.droneOsc2.connect(this.droneFilter);
      this.droneOsc2.start();

      return true;
    } catch (e) {
      return false;
    }
  }

  toggleAudio() {
    if (!this.audioEnabled) {
      if (!this.audioCtx) {
        const ok = this.initAudio();
        this.audioEnabled = ok;
      } else {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        if (this.droneGain) {
          this.droneGain.gain.setTargetAtTime(0.08, this.audioCtx.currentTime, 0.1);
        }
        this.audioEnabled = true;
      }
    } else {
      if (this.droneGain && this.audioCtx) {
        this.droneGain.gain.setTargetAtTime(0.001, this.audioCtx.currentTime, 0.1);
      }
      this.audioEnabled = false;
    }
  }

  playBowlChime() {
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;

      // Sacred Tripod Singing Bowl Bronze Chime (A4 440Hz + partials)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(436, now + 3.0);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    } catch (e) {
      // safe ignore
    }
  }
}

/* ----------------------------------------------------------------------------
 * NAVIER-STOKES EULERIAN FLUID SOLVER (Stam Stable Fluids with Vorticity)
 * ------------------------------------------------------------------------- */
class FluidGrid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    const size = w * h;
    this.u = new Float32Array(size);
    this.v = new Float32Array(size);
    this.u0 = new Float32Array(size);
    this.v0 = new Float32Array(size);
    this.curl = new Float32Array(size);
  }

  clear() {
    this.u.fill(0);
    this.v.fill(0);
    this.u0.fill(0);
    this.v0.fill(0);
    this.curl.fill(0);
  }

  idx(x, y) {
    return y * this.w + x;
  }

  addVelocity(worldX, worldY, amountX, amountY, radius) {
    const gx = (worldX / (this.w * 10)) * this.w;
    const gy = (worldY / (this.h * 10)) * this.h;
    const radG = Math.max(1, Math.floor(radius / 16));

    const minX = Math.max(1, Math.floor(gx - radG));
    const maxX = Math.min(this.w - 2, Math.ceil(gx + radG));
    const minY = Math.max(1, Math.floor(gy - radG));
    const maxY = Math.min(this.h - 2, Math.ceil(gy + radG));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const distSq = (x - gx) * (x - gx) + (y - gy) * (y - gy);
        if (distSq < radG * radG) {
          const factor = 1 - Math.sqrt(distSq) / radG;
          const i = this.idx(x, y);
          this.u[i] += amountX * factor * 0.3;
          this.v[i] += amountY * factor * 0.3;
        }
      }
    }
  }

  addSwirl(worldX, worldY, vorticity, radius) {
    const gx = (worldX / (this.w * 10)) * this.w;
    const gy = (worldY / (this.h * 10)) * this.h;
    const radG = Math.max(2, Math.floor(radius / 14));

    const minX = Math.max(1, Math.floor(gx - radG));
    const maxX = Math.min(this.w - 2, Math.ceil(gx + radG));
    const minY = Math.max(1, Math.floor(gy - radG));
    const maxY = Math.min(this.h - 2, Math.ceil(gy + radG));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - gx;
        const dy = y - gy;
        const dist = Math.hypot(dx, dy);
        if (dist < radG && dist > 0.1) {
          const factor = (1 - dist / radG) * (dist / radG);
          const i = this.idx(x, y);
          this.u[i] += (-dy / dist) * vorticity * factor;
          this.v[i] += (dx / dist) * vorticity * factor;
        }
      }
    }
  }

  sampleVelocity(worldX, worldY, screenW, screenH) {
    // Bilinear interpolation on grid
    const normX = Math.max(0, Math.min(1, worldX / screenW));
    const normY = Math.max(0, Math.min(1, worldY / screenH));

    const gx = normX * (this.w - 1);
    const gy = normY * (this.h - 1);

    const x0 = Math.floor(gx);
    const x1 = Math.min(this.w - 1, x0 + 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(this.h - 1, y0 + 1);

    const fx = gx - x0;
    const fy = gy - y0;

    const i00 = this.idx(x0, y0);
    const i10 = this.idx(x1, y0);
    const i01 = this.idx(x0, y1);
    const i11 = this.idx(x1, y1);

    const uTop = this.u[i00] * (1 - fx) + this.u[i10] * fx;
    const uBot = this.u[i01] * (1 - fx) + this.u[i11] * fx;
    const u = uTop * (1 - fy) + uBot * fy;

    const vTop = this.v[i00] * (1 - fx) + this.v[i10] * fx;
    const vBot = this.v[i01] * (1 - fx) + this.v[i11] * fx;
    const v = vTop * (1 - fy) + vBot * fy;

    return [u, v];
  }

  step(dt, vorticityStrength) {
    const w = this.w;
    const h = this.h;

    // 1. Vorticity Confinement (produces persistent curling swirls)
    this.computeVorticity();
    this.applyVorticityConfinement(dt, vorticityStrength);

    // 2. Velocity Diffusion & Damping
    for (let i = 0; i < w * h; i++) {
      this.u[i] *= Math.pow(0.985, dt * 60);
      this.v[i] *= Math.pow(0.985, dt * 60);
    }

    // 3. Pressure Projection (divergence-free incompressibility)
    this.project();

    // 4. Velocity Advection (semi-Lagrangian)
    this.advectVelocity(dt);

    // 5. Final Projection
    this.project();
  }

  computeVorticity() {
    const w = this.w;
    const h = this.h;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const dv_dx = (this.v[this.idx(x + 1, y)] - this.v[this.idx(x - 1, y)]) * 0.5;
        const du_dy = (this.u[this.idx(x, y + 1)] - this.u[this.idx(x, y - 1)]) * 0.5;
        this.curl[this.idx(x, y)] = dv_dx - du_dy;
      }
    }
  }

  applyVorticityConfinement(dt, scale) {
    const w = this.w;
    const h = this.h;
    const confScale = 8.0 * scale;

    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        // Gradient of absolute curl magnitude
        const dCurlX = Math.abs(this.curl[this.idx(x + 1, y)]) - Math.abs(this.curl[this.idx(x - 1, y)]);
        const dCurlY = Math.abs(this.curl[this.idx(x, y + 1)]) - Math.abs(this.curl[this.idx(x, y - 1)]);
        const len = Math.hypot(dCurlX, dCurlY) + 1e-5;

        const nx = dCurlX / len;
        const ny = dCurlY / len;
        const c = this.curl[this.idx(x, y)];

        // Cross product force F = N x omega
        const fx = ny * c * confScale;
        const fy = -nx * c * confScale;

        this.u[this.idx(x, y)] += fx * dt;
        this.v[this.idx(x, y)] += fy * dt;
      }
    }
  }

  project() {
    const w = this.w;
    const h = this.h;
    const p = this.u0; // reuse buffer for pressure
    const div = this.v0; // reuse buffer for divergence
    p.fill(0);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        div[this.idx(x, y)] = -0.5 * (
          this.u[this.idx(x + 1, y)] - this.u[this.idx(x - 1, y)] +
          this.v[this.idx(x, y + 1)] - this.v[this.idx(x, y - 1)]
        );
      }
    }

    // Jacobi relaxation (10 iterations)
    for (let iter = 0; iter < 10; iter++) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          p[this.idx(x, y)] = (
            div[this.idx(x, y)] +
            p[this.idx(x - 1, y)] + p[this.idx(x + 1, y)] +
            p[this.idx(x, y - 1)] + p[this.idx(x, y + 1)]
          ) * 0.25;
        }
      }
    }

    // Subtract pressure gradient from velocities
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        this.u[this.idx(x, y)] -= 0.5 * (p[this.idx(x + 1, y)] - p[this.idx(x - 1, y)]);
        this.v[this.idx(x, y)] -= 0.5 * (p[this.idx(x, y + 1)] - p[this.idx(x, y - 1)]);
      }
    }
  }

  advectVelocity(dt) {
    const w = this.w;
    const h = this.h;
    const nextU = this.u0;
    const nextV = this.v0;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = this.idx(x, y);
        // Backtrace
        const backX = Math.max(0.5, Math.min(w - 1.5, x - this.u[i] * dt * 0.2));
        const backY = Math.max(0.5, Math.min(h - 1.5, y - this.v[i] * dt * 0.2));

        const x0 = Math.floor(backX);
        const x1 = x0 + 1;
        const y0 = Math.floor(backY);
        const y1 = y0 + 1;

        const s1 = backX - x0;
        const s0 = 1 - s1;
        const t1 = backY - y0;
        const t0 = 1 - t1;

        nextU[i] = t0 * (s0 * this.u[this.idx(x0, y0)] + s1 * this.u[this.idx(x1, y0)]) +
                   t1 * (s0 * this.u[this.idx(x0, y1)] + s1 * this.u[this.idx(x1, y1)]);

        nextV[i] = t0 * (s0 * this.v[this.idx(x0, y0)] + s1 * this.v[this.idx(x1, y0)]) +
                   t1 * (s0 * this.v[this.idx(x0, y1)] + s1 * this.v[this.idx(x1, y1)]);
      }
    }

    this.u.set(nextU);
    this.v.set(nextV);
  }
}
