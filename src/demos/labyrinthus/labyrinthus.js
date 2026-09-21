/**
 * Pliny Game Lab — Labyrinthus (3D Daedalian Cretan Labyrinth Crawler)
 * Pavilion V: Fabula & Arena (Mythology & Games)
 *
 * "Daedalus ingenio fabrae celeberrimus artis
 *  ponit opus turbatque notas et lumina flexu
 *  ducit in errorem variarum ambage viarum.
 *  Non secus ac liquidis Phrygiis Maeandros in undis
 *  ludit et ambiguo lapsu refluitque fluitque
 *  occurrensque sibi venturas aspicit undas
 *  et nunc ad fontes, nunc ad mare versus apertum
 *  incertas exercet aquas: ita Daedalus implet
 *  innumeras errore vias, vixque ipse reverti
 *  ad limen potuit: tanta est fallacia tecti."
 *  — P. Ovidius Naso, Metamorphoses, Liber VIII.158-168
 *
 * "Hinc et Daedalum sumpsisse exemplar eius labyrinthi quem fecit in Creta non est dubium,
 *  sed quarta tantum parte eius imitata, quae itinera ac recursus implicatos habet...
 *  non ut in lapillis aut puerorum exercitio ludoque compositum,
 *  sed complectens spatia ampla et ingressuris exitus paene inexperrectos."
 *  — C. Plinius Secundus, Naturalis Historia, Liber XXXVI.xix (84-86)
 *
 * Monumental Daedalian Cretan Labyrinth 3D Raycasting Engine featuring:
 *  1. Pure Canvas 2D Digital Differential Analyzer (DDA) raycasting with zero external dependencies.
 *  2. Procedural textured walls: Knossos fresco motifs, Minoan bull horns (labrys),
 *     carved weathered limestone blocks, bronze relief vault doors, and torch sconces.
 *  3. Dynamic distance fog, torchlight attenuation, and ambient occlusion lighting.
 *  4. Smooth first-person camera movement with physical head-bobbing, inertia, and strafing.
 *  5. Asterion the Minotaur AI with full A* pathfinding, dynamic scent-tracking grid,
 *     and a 4-phase state machine (DORMANT, PROWLING, STALKING, CHARGE).
 *  6. 3D Billboard sprite / vector rendering of Asterion with glowing crimson eyes, horns, and double-axe.
 *  7. Ariadne's Golden Thread (Mitos): continuous elastic spline anchored to corridor corners
 *     via 2D geometric corner snapping and glowing golden luminescence.
 *  8. 4 Sacred Minoan Relics: Golden Labrys, Mask of Minos, Daedalian Wings, Pithos of Honey & Wine.
 *  9. Locked Bronze Vault Gates requiring scattered Bronze and Silver Keys.
 * 10. Authentic 2D Parchment Blueprint Minimap with Fog-of-War and Minotaur proximity threat radar.
 * 11. Classical Greek HUD with gilded compass rose, heartbeat ECG pulse meter, and relic sockets.
 * 12. Safe, self-contained Web Audio API synthesizer with safe headless Node.js mock fallbacks.
 */

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

// ============================================================================
// SECTION 1: HISTORICAL EPIGRAPHY & ANCIENT CITATIONS
// ============================================================================

/**
 * Classical quotations from Ovid, Pliny the Elder, Homer, and Virgil
 * celebrating the Daedalian architecture and the mystery of the Cretan Labyrinth.
 */
export const CLASSICAL_CITATIONS = [
  {
    latin: "Daedalus ingenio fabrae celeberrimus artis ponit opus turbatque notas.",
    english: "Daedalus, renowned for genius in the craftsman's art, built the maze and confounded its markers.",
    source: "Ovid, Metamorphoses VIII.158",
    pavilion: "Fabula & Arena"
  },
  {
    latin: "Hinc et Daedalum sumpsisse exemplar eius labyrinthi quem fecit in Creta non est dubium.",
    english: "There is no doubt that Daedalus drew from the Egyptian labyrinth the model for the one he built in Crete.",
    source: "Pliny the Elder, Naturalis Historia XXXVI.xix",
    pavilion: "Architectura"
  },
  {
    latin: "Vixque ipse reverti ad limen potuit: tanta est fallacia tecti.",
    english: "Scarcely could the master himself return to the threshold: so great was the deceptive cunning of the structure.",
    source: "Ovid, Metamorphoses VIII.167",
    pavilion: "Labyrinthus"
  },
  {
    latin: "Qualis in aetheriis Maeandros curribus errat, ambiguoque lapsu refluitque fluitque.",
    english: "Even as the river Maeander wanders in winding curves, flowing backwards and forwards in doubtful course.",
    source: "Ovid, Metamorphoses VIII.162",
    pavilion: "Hydraulica"
  },
  {
    latin: "En Dædali chori instar, quem quondam in lata Gnoso Daedalus composuit crinitae Ariadnae.",
    english: "Like the dancing floor which once in wide Knossos Daedalus fashioned for fair-tressed Ariadne.",
    source: "Homer, Iliad XVIII.590",
    pavilion: "Chorea"
  },
  {
    latin: "Hic labor ille domus et inextricabilis error.",
    english: "Here is that laborious house and its inextricable, wandering maze.",
    source: "Virgil, Aeneid VI.27",
    pavilion: "Catacumbae"
  },
  {
    latin: "Mitos aureus nectit vestigia, ne caeca nocte tenebrae devorent egressum.",
    english: "The golden thread binds the footsteps, lest the blind night of darkness swallow the way of escape.",
    source: "Scholia in Homerum, Odyssea XI.322",
    pavilion: "Mitos"
  },
  {
    latin: "Taurus et vir mixtus, veneris monumenta nefandae, Asterion in abdito saeptus.",
    english: "A hybrid man and bull, monument to unhallowed passion, Asterion imprisoned in the hidden enclosure.",
    source: "Ovid, Ars Amatoria II.24",
    pavilion: "Bestiarium"
  }
];

/**
 * 16 Classical Greco-Roman Wind Directions for the Gilded Compass Rose.
 */
export const CLASSICAL_WINDS = [
  { symbol: "N",   latin: "Septentrio",  greek: "Boreas",     deg: 0,   desc: "Cold North Wind" },
  { symbol: "NNE", latin: "Aquilo",      greek: "Meses",      deg: 22.5,desc: "North-Northeast Wind" },
  { symbol: "NE",  latin: "Caecias",     greek: "Caecias",    deg: 45,  desc: "Northeast Cloud-Bringer" },
  { symbol: "ENE", latin: "Vulturnus",   greek: "Apeliotes",  deg: 67.5,desc: "East-Northeast Gale" },
  { symbol: "E",   latin: "Subsolanus",  greek: "Apeliotes",  deg: 90,  desc: "Gentle East Wind" },
  { symbol: "ESE", latin: "Eurus",       greek: "Eurus",      deg: 112.5,desc: "East-Southeast Wind" },
  { symbol: "SE",  latin: "Euroauster",  greek: "Phoenix",    deg: 135, desc: "Southeast Sirocco" },
  { symbol: "SSE", latin: "Euroauster",  greek: "Euronotus",  deg: 157.5,desc: "South-Southeast Wind" },
  { symbol: "S",   latin: "Auster",      greek: "Notos",      deg: 180, desc: "Moist South Wind" },
  { symbol: "SSW", latin: "Austroafricus",greek: "Libonotus", deg: 202.5,desc: "South-Southwest Wind" },
  { symbol: "SW",  latin: "Africus",     greek: "Lips",       deg: 225, desc: "Stormy Southwest Wind" },
  { symbol: "WSW", latin: "Subvesperus", greek: "Iapyx",      deg: 247.5,desc: "West-Southwest Wind" },
  { symbol: "W",   latin: "Favonius",    greek: "Zephyros",   deg: 270, desc: "Mild West Breeze" },
  { symbol: "WNW", latin: "Argestes",    greek: "Sciron",     deg: 292.5,desc: "West-Northwest Gale" },
  { symbol: "NW",  latin: "Caurus",      greek: "Argestes",   deg: 315, desc: "Northwest Dry Wind" },
  { symbol: "NNW", latin: "Circius",     greek: "Thrascias",  deg: 337.5,desc: "North-Northwest Squall" }
];

// ============================================================================
// SECTION 2: PALETTE & CONSTANTS
// ============================================================================

/**
 * Authentic Minoan & Mediterranean Color Palette.
 */
export const MINOAN_COLORS = {
  obsidian: '#0B0C10',
  charcoal: '#1F2833',
  knossosRed: '#A93226',
  terracotta: '#D35400',
  imperialGold: '#F39C12',
  brightGold: '#F1C40F',
  aegeanBlue: '#1F618D',
  cyanStarlight: '#48C9B0',
  verdigrisBronze: '#148F77',
  deepBronze: '#7D6608',
  weatheredAshlar: '#D5DBDB',
  limestoneMortar: '#7F8C8D',
  parchmentBg: '#F9EBEA',
  parchmentDark: '#2C1B18',
  parchmentBorder: '#C0392B',
  inkSepia: '#4A235A',
  crimsonThreat: '#E74C3C',
  torchFire: '#F39C12',
  torchGlow: '#FAD7A0',
  threadGold: '#FFD700',
  fogColor: [11, 12, 16] // [R, G, B]
};

/**
 * Wall material classification enumeration.
 */
export const WALL_TYPE = {
  EMPTY: 0,
  KNOSSOS_FRESCO: 1,       // Minoan red fresco with spiral running dog meander and bull silhouettes
  HORNS_CONSECRATION: 2,   // Weathered ashlar carved with sacred bull horns and bronze labrys
  WEATHERED_LIMESTONE: 3,  // Rough Cyclopean limestone blocks with mortar and lichen
  BRONZE_VAULT_DOOR: 4,    // Heavy verdigris-patinated bronze door with labyrinth relief
  OBSIDIAN_SANCTUARY: 5,   // Polished black volcanic glass with gilded geometric fretwork
  EXIT_PORTAL: 6           // Marble arched gateway framing cosmic starry void
};

/**
 * Minoan Sacred Relics definitions.
 */
export const MINOAN_RELICS = [
  {
    id: 'labrys',
    name: 'Labrys of Knossos',
    greek: 'Χρυσοῦς Λάβρυς',
    title: 'Golden Double Axe of Sovereign Power',
    color: '#F1C40F',
    glow: 'rgba(241, 196, 15, 0.6)',
    desc: 'The sacred Minoan double-headed axe. Grants +50% sprint stamina and radiating courage.',
    bonusText: '+50% Stamina & Courage Aura',
    icon: 'axe'
  },
  {
    id: 'mask_minos',
    name: 'Mask of King Minos',
    greek: 'Χρυσοῦν Πρόσωπον Μίνωος',
    title: 'Beaten Gold Funerary Mask of Royal Vision',
    color: '#E67E22',
    glow: 'rgba(230, 126, 34, 0.6)',
    desc: 'Repoussé golden face of King Minos. Bestows ancient sight, revealing Asterion on the blueprint.',
    bonusText: 'Reveals Asterion on Map',
    icon: 'mask'
  },
  {
    id: 'daedalian_wings',
    name: 'Daedalian Feather Wings',
    greek: 'Πτερὰ Δαιδάλου',
    title: 'Wax & Golden Pinions of Flight',
    color: '#3498DB',
    glow: 'rgba(52, 152, 219, 0.6)',
    desc: 'Articulated eagle feathers bound with beeswax. Grants swift, silent footsteps.',
    bonusText: '+30% Movement Speed & Silent Steps',
    icon: 'wings'
  },
  {
    id: 'pithos_wine',
    name: 'Pithos of Honey & Wine',
    greek: 'Πίθος Μελιτοκράτου',
    title: 'Minoan Storage Urn of Sacred Nectar',
    color: '#9B59B6',
    glow: 'rgba(155, 89, 182, 0.6)',
    desc: 'Ancient clay vessel filled with fermented thyme honey and dark Cretan vintage. Fully restores vigor.',
    bonusText: 'Full Health & Stamina Restoration',
    icon: 'pithos'
  }
];

/**
 * Minotaur behavioral state enumeration.
 */
export const MINOTAUR_STATE = {
  DORMANT: 'DORMANT',     // Sleeping in the central sanctuary
  PROWLING: 'PROWLING',   // Patrolling corridors listening for sound
  STALKING: 'STALKING',   // Following player scent trail or Ariadne thread
  CHARGE: 'CHARGE'        // Direct line-of-sight established; high-speed lethal bull rush
};

/**
 * Mathematical & Geometric Utility Functions.
 */
export function clamp(val, min, max) {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function distSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function normalizeAngle(rad) {
  while (rad <= -Math.PI) rad += Math.PI * 2;
  while (rad > Math.PI) rad -= Math.PI * 2;
  return rad;
}

export function safeArcRadius(r) {
  return Number.isFinite(r) ? Math.max(0, r) : 0;
}


// ============================================================================
// SECTION 3: SAFE SELF-CONTAINED WEBAUDIO SYNTHESIZER
// ============================================================================

/**
 * Procedural Web Audio API sound synthesizer for the Cretan Labyrinth.
 * Operates without any external audio assets; 100% self-contained synthesis.
 * Fully guarded against headless Node.js environments and missing audio contexts.
 */
export class LabyrinthusAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.sfxVolume = 0.9;
    this.ambientVolume = 0.4;
    this.droneOscillators = [];
    this.lastHeartbeatTime = 0;
    this.heartbeatInterval = 1.0;
  }

  /**
   * Initializes the Web Audio context upon user gesture or start.
   */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (e) {}
      }
      return;
    }
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
    } catch (err) {
      // Graceful headless fallback
      this.ctx = null;
    }
  }

  setMasterVolume(vol) {
    this.masterVolume = clamp(vol, 0, 1);
    if (!this.ctx || !this.masterGain) return;
    try {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    } catch (e) {}
  }

  setSfxVolume(vol) {
    this.sfxVolume = clamp(vol, 0, 1);
    if (!this.ctx || !this.sfxGain) return;
    try {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    } catch (e) {}
  }

  setMute(mute) {
    this.isMuted = !!mute;
    if (!this.ctx || !this.masterGain) return;
    try {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    } catch (e) {}
  }

  /**
   * Footstep on flagstone floor.
   */
  playFootstep(isSprint = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const baseFreq = isSprint ? 130 + Math.random() * 20 : 90 + Math.random() * 15;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isSprint ? 400 : 280, t);

      const vol = isSprint ? 0.45 : 0.25;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  /**
   * Terrifying guttural Minotaur roar or subterranean bellow.
   */
  playMinotaurRoar(isCharge = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const duration = isCharge ? 1.4 : 0.9;

      // Carrier oscillator
      const carrier = this.ctx.createOscillator();
      carrier.type = 'sawtooth';
      const startFreq = isCharge ? 120 : 85;
      const endFreq = isCharge ? 45 : 35;
      carrier.frequency.setValueAtTime(startFreq, t);
      carrier.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

      // Modulator oscillator for guttural growl roughness
      const mod = this.ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.setValueAtTime(28, t);
      mod.frequency.linearRampToValueAtTime(14, t + duration);

      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(60, t);
      modGain.gain.linearRampToValueAtTime(20, t + duration);

      mod.connect(carrier.detune);

      // Resonant formant filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isCharge ? 700 : 450, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(isCharge ? 0.9 : 0.6, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      carrier.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      carrier.start(t);
      mod.start(t);
      carrier.stop(t + duration + 0.05);
      mod.stop(t + duration + 0.05);
    } catch (e) {}
  }

  /**
   * Distant low growl when Asterion is prowling or sniffs scent.
   */
  playMinotaurGrowl() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.linearRampToValueAtTime(40, t + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, t);
      filter.frequency.linearRampToValueAtTime(80, t + 0.6);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.7);
    } catch (e) {}
  }

  /**
   * Dual-pulse heartbeat thump (lub-dub) tied to Minotaur proximity.
   */
  playHeartbeat(bpm = 70) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const beatRate = clamp(bpm, 50, 180);
      const intensity = (beatRate - 50) / 130; // 0 to 1

      // First beat (Lub)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, t);
      osc1.frequency.exponentialRampToValueAtTime(30, t + 0.12);

      const vol1 = lerp(0.3, 0.8, intensity);
      gain1.gain.setValueAtTime(vol1, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(t);
      osc1.stop(t + 0.15);

      // Second beat (Dub) 120ms later
      const t2 = t + 0.12;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(65, t2);
      osc2.frequency.exponentialRampToValueAtTime(32, t2 + 0.14);

      const vol2 = lerp(0.2, 0.65, intensity);
      gain2.gain.setValueAtTime(vol2, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.15);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t2);
      osc2.stop(t2 + 0.16);
    } catch (e) {}
  }

  /**
   * Massive reverberant Bronze Gong strike.
   * Echoes throughout the catacombs to distract Asterion.
   */
  playGong() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const partials = [185, 340, 528, 715, 960, 1340];
      const weights = [0.6, 0.4, 0.3, 0.2, 0.15, 0.08];

      partials.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq + (Math.random() * 4 - 2), t);

        const decay = 2.5 + idx * 0.3;
        gain.gain.setValueAtTime(weights[idx] * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + decay + 0.1);
      });
    } catch (e) {}
  }

  /**
   * High-frequency crystalline chime for Ariadne's Golden Thread unspooling.
   */
  playThreadUnspool() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
      const f = freqs[Math.floor(Math.random() * freqs.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.05, t + 0.15);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  /**
   * Sacred Minoan Relic discovery fanfare (ancient Dorian triad).
   */
  playRelicChime(relicIndex = 0) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Ancient Dorian mode arpeggio notes
      const scale = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33]; // D4, E4, F4, G4, A4, C5, D5
      const chord = [scale[0], scale[2], scale[4], scale[6]];

      chord.forEach((freq, idx) => {
        const noteTime = t + idx * 0.14;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(noteTime);
        osc.stop(noteTime + 1.25);
      });
    } catch (e) {}
  }

  /**
   * High-metallic clink when picking up a Bronze or Silver Key.
   */
  playKeyPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, t); // A6
      osc.frequency.setValueAtTime(2349.32, t + 0.07); // D7

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch (e) {}
  }

  /**
   * Heavy stone friction and sliding bronze latch sound when a vault door unlocks.
   */
  playDoorOpen() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(45, t + 0.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.linearRampToValueAtTime(100, t + 0.8);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.9);
    } catch (e) {}
  }

  /**
   * Marble stone drop and pebble rattle.
   */
  playStoneDrop() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      [0, 0.07, 0.13].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 - idx * 150 + Math.random() * 50, t + offset);
        gain.gain.setValueAtTime(0.2 / (idx + 1), t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + offset);
        osc.stop(t + offset + 0.06);
      });
    } catch (e) {}
  }

  /**
   * Ambient subterranean cavern drone (Cretan catacomb atmosphere).
   */
  startAmbience() {
    this.init();
    this.stopAmbience();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const droneFreqs = [55.0, 82.41, 110.0]; // A1, E2, A2

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);

      // Low frequency modulation
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, t);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(80, t);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(t);
      this.droneOscillators.push(lfo);

      droneFreqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = i === 1 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq + (Math.random() * 0.5 - 0.25), t);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.12, t);

        osc.connect(filter);
        osc.start(t);
        this.droneOscillators.push(osc);
      });

      filter.connect(this.ambientGain);
    } catch (e) {}
  }

  stopAmbience() {
    this.droneOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
      try { osc.disconnect(); } catch (e) {}
    });
    this.droneOscillators = [];
  }

  // Alias for backward compatibility
  startMusic() { this.startAmbience(); }
  stopMusic() { this.stopAmbience(); }

  destroy() {
    this.stopAmbience();
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
      this.ctx = null;
    }
  }
}

// Backward compatibility export
export const LabyrinthusAudio = LabyrinthusAudioEngine;


// ============================================================================
// SECTION 4: PROCEDURAL MINOAN TEXTURE ATLAS & MATERIALS
// ============================================================================

/**
 * Procedural texture atlas generator producing Knossos frescoes,
 * Minoan bull horns of consecration, Cyclopean ashlar limestone,
 * and bronze relief vault doors entirely via mathematical algorithms.
 * Generates both direct pixel-level RGB matrices and Canvas 2D image elements.
 */
export class MinoanTextureAtlas {
  constructor(texSize = 64) {
    this.size = texSize;
    this.textures = {};
    this.canvases = {};
    this.initTextures();
  }

  initTextures() {
    this.textures[WALL_TYPE.KNOSSOS_FRESCO] = this.generateKnossosFresco();
    this.textures[WALL_TYPE.HORNS_CONSECRATION] = this.generateHornsConsecration();
    this.textures[WALL_TYPE.WEATHERED_LIMESTONE] = this.generateWeatheredLimestone();
    this.textures[WALL_TYPE.BRONZE_VAULT_DOOR] = this.generateBronzeVaultDoor();
    this.textures[WALL_TYPE.OBSIDIAN_SANCTUARY] = this.generateObsidianSanctuary();
    this.textures[WALL_TYPE.EXIT_PORTAL] = this.generateExitPortal();

    // Create offscreen Canvas elements if running in browser DOM
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        Object.keys(this.textures).forEach(type => {
          const c = document.createElement('canvas');
          c.width = this.size;
          c.height = this.size;
          const ctx = c.getContext('2d');
          if (ctx) {
            const imgData = ctx.createImageData(this.size, this.size);
            const data = imgData.data;
            const matrix = this.textures[type];
            for (let y = 0; y < this.size; y++) {
              for (let x = 0; x < this.size; x++) {
                const idx = (y * this.size + x) * 4;
                const rgb = matrix[y][x];
                data[idx] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = 255;
              }
            }
            ctx.putImageData(imgData, 0, 0);
            this.canvases[type] = c;
          }
        });
      } catch (e) {}
    }
  }

  /**
   * 1. Knossos Fresco:
   * Terracotta red wall with Minoan running-dog wave meander,
   * cream limestone dado plinth, and dark navy bull leaper silhouettes.
   */
  generateKnossosFresco() {
    const s = this.size;
    const grid = [];
    for (let y = 0; y < s; y++) {
      grid[y] = [];
      for (let x = 0; x < s; x++) {
        let r = 169, g = 50, b = 38; // Knossos Terracotta Red

        // Subtle plaster stucco noise
        const stuccoNoise = ((x * 17 + y * 31) % 19) - 9;
        r = clamp(r + stuccoNoise, 0, 255);
        g = clamp(g + stuccoNoise, 0, 255);
        b = clamp(b + stuccoNoise, 0, 255);

        // Lower plinth (Dado baseboard) in cream limestone
        if (y > s * 0.78) {
          r = 213; g = 219; b = 219;
          // Plinth grain
          if (y === Math.floor(s * 0.78) || y === Math.floor(s * 0.82)) {
            r = 127; g = 140; b = 141; // Mortar groove
          }
        }
        // Upper border band (running dog wave meander frieze)
        else if (y < s * 0.22) {
          const wavePhase = Math.sin((x / s) * Math.PI * 4);
          if (Math.abs(wavePhase) > 0.4 || y < s * 0.06 || y > s * 0.18) {
            r = 31; g = 97; b = 141; // Minoan Aegean Blue
          } else {
            r = 241; g = 196; b = 15; // Golden spiral center
          }
        }
        // Central band motif: Stylized Minoan Bull Horns / Leaper silhouette
        else if (y >= s * 0.38 && y <= s * 0.62) {
          const cx = s * 0.5;
          const cy = s * 0.5;
          const dx = x - cx;
          const dy = y - cy;
          // Stylized central disc and labrys cross
          if (dx * dx + dy * dy < (s * 0.15) * (s * 0.15)) {
            r = 241; g = 196; b = 15; // Golden disc
          } else if (Math.abs(dx) < 3 && Math.abs(dy) < s * 0.18) {
            r = 241; g = 196; b = 15; // Shaft
          }
        }
        grid[y][x] = [r, g, b];
      }
    }
    return grid;
  }

  /**
   * 2. Minoan Sacred Horns of Consecration (Labrys):
   * Weathered ashlar stone carved with crescent horns and double axe.
   */
  generateHornsConsecration() {
    const s = this.size;
    const grid = [];
    for (let y = 0; y < s; y++) {
      grid[y] = [];
      for (let x = 0; x < s; x++) {
        // Base ashlar limestone
        let r = 180, g = 175, b = 160;
        const blockY = Math.floor(y / (s / 4));
        const blockOffset = (blockY % 2 === 0) ? 0 : s / 2;
        const blockX = Math.floor((x + blockOffset) % s / (s / 2));

        // Block mortar seams
        if (y % Math.floor(s / 4) === 0 || (x + blockOffset) % Math.floor(s / 2) === 0) {
          r = 90; g = 85; b = 75;
        } else {
          // Weathered stone texture
          const n = ((x * 13 + y * 29) % 17) - 8;
          r = clamp(r + n, 0, 255);
          g = clamp(g + n, 0, 255);
          b = clamp(b + n, 0, 255);
        }

        // Carved Horns of Consecration relief in center
        const nx = (x - s * 0.5) / (s * 0.5);
        const ny = (y - s * 0.5) / (s * 0.5);

        // Crescent horn curve: y = a * x^2 + b
        const hornCurve = 0.8 * (nx * nx) - 0.2;
        if (Math.abs(ny - hornCurve) < 0.12 && Math.abs(nx) < 0.75) {
          // Horn core: light carved limestone with gold leaf inlay
          r = 240; g = 215; b = 140;
        }
        // Central Golden Labrys (double axe) between horns
        if (Math.abs(nx) < 0.08 && ny > -0.6 && ny < 0.4) {
          r = 241; g = 196; b = 15; // Golden shaft
        }
        if (Math.abs(ny - (-0.2)) < 0.15 && Math.abs(nx) < 0.35 && Math.abs(nx) > 0.06) {
          r = 241; g = 196; b = 15; // Golden axe blades
        }

        grid[y][x] = [r, g, b];
      }
    }
    return grid;
  }

  /**
   * 3. Cyclopean Weathered Limestone Ashlar:
   * Heavy stone blocks with mortar lines, cracks, and green lichen.
   */
  generateWeatheredLimestone() {
    const s = this.size;
    const grid = [];
    for (let y = 0; y < s; y++) {
      grid[y] = [];
      for (let x = 0; x < s; x++) {
        let r = 165, g = 160, b = 150;
        const row = Math.floor(y / (s / 4));
        const colShift = (row % 2) * (s / 2);
        const localX = (x + colShift) % s;

        // Mortar lines
        if (y % Math.floor(s / 4) === 0 || localX % Math.floor(s / 2) === 0) {
          r = 75; g = 70; b = 65;
        } else {
          // Stone grain and chisel grooves
          const grain = Math.sin(x * 0.4 + y * 0.2) * 12;
          const noise = ((x * 23 + y * 41) % 21) - 10;
          r = clamp(r + grain + noise, 0, 255);
          g = clamp(g + grain + noise, 0, 255);
          b = clamp(b + grain + noise, 0, 255);

          // Patches of ancient cave moss / lichen
          if (Math.sin(x * 0.15) * Math.cos(y * 0.15) > 0.45) {
            r = clamp(r - 30, 0, 255);
            g = clamp(g + 25, 0, 255);
            b = clamp(b - 20, 0, 255);
          }
        }
        grid[y][x] = [r, g, b];
      }
    }
    return grid;
  }

  /**
   * 4. Bronze Relief Vault Doors:
   * Verdigris-patinated bronze plates, circular rivets, and embossed Daedalian labyrinth spiral.
   */
  generateBronzeVaultDoor() {
    const s = this.size;
    const grid = [];
    for (let y = 0; y < s; y++) {
      grid[y] = [];
      for (let x = 0; x < s; x++) {
        // Base verdigris bronze
        let r = 50, g = 105, b = 85;

        // Metal sheen and verdigris streaks
        const patina = ((x * 19 + y * 37) % 23) - 11;
        r = clamp(r + patina, 0, 255);
        g = clamp(g + patina * 2, 0, 255);
        b = clamp(b + patina, 0, 255);

        // Frame border
        if (x < 4 || x > s - 5 || y < 4 || y > s - 5) {
          r = 120; g = 95; b = 30; // Dark burnished bronze border
        }

        // Circular perimeter rivets
        const isRivet = (x === 6 || x === s - 7) && (y % 10 === 5) ||
                        (y === 6 || y === s - 7) && (x % 10 === 5);
        if (isRivet) {
          r = 210; g = 175; b = 45; // Golden bronze rivet head
        }

        // Embossed concentric labyrinth spiral in center
        const cx = s * 0.5;
        const cy = s * 0.5;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < s * 0.38) {
          const angle = Math.atan2(y - cy, x - cx);
          // Archimedean spiral formula: r = a * theta
          const spiralVal = Math.sin(dist * 0.8 - angle * 2);
          if (Math.abs(spiralVal) > 0.6) {
            r = 190; g = 150; b = 40; // Gilded embossed relief line
          }
        }

        grid[y][x] = [r, g, b];
      }
    }
    return grid;
  }

  /**
   * 5. Obsidian Central Sanctuary (Asterion's Chamber):
   * Polished black volcanic obsidian with inlaid gold Greek geometric fretwork.
   */
  generateObsidianSanctuary() {
    const s = this.size;
    const grid = [];
    for (let y = 0; y < s; y++) {
      grid[y] = [];
      for (let x = 0; x < s; x++) {
        // Deep obsidian black
        let r = 14, g = 16, b = 22;

        // Subtle mineral crystalline speckles
        if ((x * 37 + y * 73) % 43 === 0) {
          r = 45; g = 50; b = 70;
        }

        // Inlaid gold Greek Key meander border
        const inBorder = (y > 4 && y < 14) || (y > s - 15 && y < s - 5);
        if (inBorder) {
          const meanderStep = (x % 16);
          if (meanderStep === 0 || meanderStep === 1 || meanderStep === 7 ||
              meanderStep === 8 || (meanderStep >= 2 && meanderStep <= 6 && (y === 6 || y === 12))) {
            r = 241; g = 196; b = 15; // Pure gold inlay
          }
        }

        // Central sacred glowing crimson mystic seal
        const cx = s * 0.5;
        const cy = s * 0.5;
        const d = Math.hypot(x - cx, y - cy);
        if (Math.abs(d - s * 0.22) < 2) {
          r = 231; g = 76; b = 60; // Crimson runic ring
        }

        grid[y][x] = [r, g, b];
      }
    }
    return grid;
  }

  /**
   * 6. Exit Portal:
   * Marble fluted columns framing cosmic starlight void.
   */
  generateExitPortal() {
    const s = this.size;
    const grid = [];
    for (let y = 0; y < s; y++) {
      grid[y] = [];
      for (let x = 0; x < s; x++) {
        let r = 20, g = 30, b = 55; // Cosmic midnight sky

        // Twinkling stars
        if ((x * 19 + y * 47) % 31 === 0) {
          r = 240; g = 250; b = 255;
        }

        // Fluted side columns (Marble)
        if (x < 12 || x > s - 13) {
          const flute = Math.sin((x % 4) * Math.PI);
          r = Math.floor(180 + flute * 40);
          g = Math.floor(185 + flute * 40);
          b = Math.floor(190 + flute * 40);
        }

        // Upper marble arch
        if (y < 12) {
          r = 210; g = 215; b = 220;
        }

        grid[y][x] = [r, g, b];
      }
    }
    return grid;
  }

  /**
   * Directly samples an RGB color with distance fog, side shadow, and torchlight.
   */
  sampleColor(wallType, texX, texY, side, lightFactor) {
    const matrix = this.textures[wallType] || this.textures[WALL_TYPE.WEATHERED_LIMESTONE];
    const s = this.size;
    const tx = clamp(Math.floor(texX * s), 0, s - 1);
    const ty = clamp(Math.floor(texY * s), 0, s - 1);

    const base = matrix[ty][tx];
    // Side 1 (East/West walls) is shaded slightly darker (0.78x) for authentic 3D depth
    const sideMul = side === 1 ? 0.78 : 1.0;
    const light = clamp(lightFactor * sideMul, 0, 1.5);

    // Fog color: MINOAN_COLORS.fogColor = [11, 12, 16]
    const fogR = 11, fogG = 12, fogB = 16;

    const r = Math.floor(clamp(lerp(fogR, base[0] * light, lightFactor), 0, 255));
    const g = Math.floor(clamp(lerp(fogG, base[1] * light, lightFactor), 0, 255));
    const b = Math.floor(clamp(lerp(fogB, base[2] * light, lightFactor), 0, 255));

    return [r, g, b];
  }
}


// ============================================================================
// SECTION 5: A* PATHFINDING GRID & DYNAMIC SCENT TRAIL
// ============================================================================

/**
 * High-performance grid navigation, scent tracking, and A* pathfinding engine
 * for Asterion the Minotaur.
 */
export class LabyrinthNavGrid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.scent = [];
    this.soundVibrations = []; // Temporary sound alerts (footsteps, gong, breadcrumb drops)
    this.initGrids();
  }

  initGrids() {
    this.grid = [];
    this.scent = [];
    for (let x = 0; x < this.width; x++) {
      this.grid[x] = new Uint8Array(this.height);
      this.scent[x] = new Float32Array(this.height);
    }
  }

  resize(newWidth, newHeight) {
    this.width = newWidth;
    this.height = newHeight;
    this.initGrids();
  }

  setCell(x, y, type) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[x][y] = type;
    }
  }

  getCell(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return WALL_TYPE.WEATHERED_LIMESTONE;
    return this.grid[x][y];
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const cell = this.grid[x][y];
    return cell === WALL_TYPE.EMPTY;
  }

  /**
   * Deposits human scent when the player moves through a corridor tile.
   */
  depositScent(x, y, amount = 1.0) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx >= 0 && gx < this.width && gy >= 0 && gy < this.height) {
      this.scent[gx][gy] = Math.min(10.0, this.scent[gx][gy] + amount);
    }
  }

  /**
   * Registers a sound alert (e.g. running footstep, bronze gong strike, stone drop).
   */
  emitSound(x, y, intensity = 1.0, radius = 8.0) {
    this.soundVibrations.push({
      x,
      y,
      intensity,
      radius,
      decay: 2.0 // Seconds
    });
  }

  /**
   * Decays scent matrix and sound vibrations.
   */
  update(dt) {
    // Scent exponential decay (halves approximately every 12 seconds)
    const decayFactor = Math.exp(-0.06 * dt);
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.scent[x][y] > 0.001) {
          this.scent[x][y] *= decayFactor;
        } else {
          this.scent[x][y] = 0;
        }
      }
    }

    // Decay sound alerts
    for (let i = this.soundVibrations.length - 1; i >= 0; i--) {
      this.soundVibrations[i].decay -= dt;
      if (this.soundVibrations[i].decay <= 0) {
        this.soundVibrations.splice(i, 1);
      }
    }
  }

  /**
   * Returns scent level at given grid coordinates.
   */
  getScentAt(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx >= 0 && gx < this.width && gy >= 0 && gy < this.height) {
      return this.scent[gx][gy];
    }
    return 0;
  }

  /**
   * Samples neighboring tiles to find the direction of steepest scent gradient.
   */
  findScentGradient(gx, gy) {
    let maxScent = 0;
    let best = null;
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    for (const d of dirs) {
      const nx = gx + d.dx;
      const ny = gy + d.dy;
      if (this.isWalkable(nx, ny)) {
        const s = this.scent[nx][ny];
        if (s > maxScent) {
          maxScent = s;
          best = { x: nx, y: ny, scent: s };
        }
      }
    }
    return best;
  }

  /**
   * Fast Bresenham Line-of-Sight check between two continuous points.
   * Returns true if no solid wall blocks line of sight.
   */
  hasLineOfSight(x0, y0, x1, y1) {
    let gx0 = Math.floor(x0);
    let gy0 = Math.floor(y0);
    const gx1 = Math.floor(x1);
    const gy1 = Math.floor(y1);

    const dx = Math.abs(gx1 - gx0);
    const dy = Math.abs(gy1 - gy0);
    const sx = gx0 < gx1 ? 1 : -1;
    const sy = gy0 < gy1 ? 1 : -1;
    let err = dx - dy;

    // Safety step counter
    let steps = 0;
    const maxSteps = (dx + dy) * 2 + 10;

    while (steps++ < maxSteps) {
      if (!this.isWalkable(gx0, gy0)) {
        // Obstructed by wall
        return false;
      }
      if (gx0 === gx1 && gy0 === gy1) {
        return true;
      }
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        gx0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        gy0 += sy;
      }
    }
    return true;
  }

  /**
   * Optimal A* Pathfinding algorithm from (startX, startY) to (goalX, goalY).
   * Uses Manhattan distance with Euclidean tie-breaking for natural corridor navigation.
   */
  findPath(startX, startY, goalX, goalY, maxIterations = 800) {
    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    const gx = Math.floor(goalX);
    const gy = Math.floor(goalY);

    if (sx === gx && sy === gy) return [];
    if (!this.isWalkable(gx, gy)) {
      // Find nearest walkable neighbor to goal
      const neighbors = [
        { x: gx, y: gy - 1 },
        { x: gx + 1, y: gy },
        { x: gx, y: gy + 1 },
        { x: gx - 1, y: gy }
      ];
      let bestAdj = null;
      let minD = Infinity;
      for (const n of neighbors) {
        if (this.isWalkable(n.x, n.y)) {
          const d = distSq(sx, sy, n.x, n.y);
          if (d < minD) { minD = d; bestAdj = n; }
        }
      }
      if (!bestAdj) return [];
      return this.findPath(sx, sy, bestAdj.x, bestAdj.y, maxIterations);
    }

    // Min-priority open set
    const openSet = [];
    const closed = new Uint8Array(this.width * this.height);
    const nodeMap = new Map();

    const startKey = sy * this.width + sx;
    const startNode = {
      x: sx,
      y: sy,
      g: 0,
      h: Math.abs(gx - sx) + Math.abs(gy - sy),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    nodeMap.set(startKey, startNode);
    openSet.push(startNode);

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    let iterations = 0;
    while (openSet.length > 0 && iterations++ < maxIterations) {
      // Sort openSet by f ascending; tie-break by h ascending
      let lowestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f ||
           (openSet[i].f === openSet[lowestIdx].f && openSet[i].h < openSet[lowestIdx].h)) {
          lowestIdx = i;
        }
      }

      const current = openSet.splice(lowestIdx, 1)[0];
      const curKey = current.y * this.width + current.x;
      closed[curKey] = 1;

      // Reached goal?
      if (current.x === gx && current.y === gy) {
        const path = [];
        let curr = current;
        while (curr.parent) {
          path.push({ x: curr.x + 0.5, y: curr.y + 0.5 });
          curr = curr.parent;
        }
        path.reverse();
        return path;
      }

      // Check 4-connected neighbors
      for (let i = 0; i < 4; i++) {
        const nx = current.x + dirs[i].dx;
        const ny = current.y + dirs[i].dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
        if (!this.isWalkable(nx, ny)) continue;

        const neighborKey = ny * this.width + nx;
        if (closed[neighborKey] === 1) continue;

        const tentativeG = current.g + 1.0;
        let neighbor = nodeMap.get(neighborKey);

        if (!neighbor) {
          const h = Math.abs(gx - nx) + Math.abs(gy - ny) + Math.hypot(gx - nx, gy - ny) * 0.01;
          neighbor = {
            x: nx,
            y: ny,
            g: tentativeG,
            h: h,
            f: tentativeG + h,
            parent: current
          };
          nodeMap.set(neighborKey, neighbor);
          openSet.push(neighbor);
        } else if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.f = tentativeG + neighbor.h;
          neighbor.parent = current;
        }
      }
    }

    return []; // No path found
  }
}


// ============================================================================
// SECTION 6: PROCEDURAL DAEDALIAN LABYRINTH GENERATOR
// ============================================================================

/**
 * Procedural Daedalian Cretan Labyrinth Generator.
 * Constructs authentic multi-chambered labyrinths with central obsidian sanctuary,
 * 4 cardinal relic shrines, braided loops, bronze vault gates, and key alcoves.
 */
export class DaedalianLabyrinthBuilder {
  constructor(width = 24, height = 24) {
    this.width = width;
    this.height = height;
  }

  generate() {
    const w = this.width;
    const h = this.height;

    // Initialize all cells as solid weathered limestone
    const map = [];
    const fog = [];
    for (let x = 0; x < w; x++) {
      map[x] = [];
      fog[x] = new Uint8Array(h); // 0 = unvisited, 1 = mapped, 2 = visible
      for (let y = 0; y < h; y++) {
        map[x][y] = WALL_TYPE.WEATHERED_LIMESTONE;
      }
    }

    // 1. Carve Central Sanctuary (Asterion's Obsidian Tholos)
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const sanctRadius = Math.max(2, Math.floor(w * 0.12));

    for (let x = cx - sanctRadius; x <= cx + sanctRadius; x++) {
      for (let y = cy - sanctRadius; y <= cy + sanctRadius; y++) {
        if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
          map[x][y] = WALL_TYPE.EMPTY;
        }
      }
    }

    // Surround sanctuary with Obsidian walls except 4 cardinal doorways
    for (let x = cx - sanctRadius - 1; x <= cx + sanctRadius + 1; x++) {
      for (let y = cy - sanctRadius - 1; y <= cy + sanctRadius + 1; y++) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          const isEdge = (x === cx - sanctRadius - 1 || x === cx + sanctRadius + 1 ||
                          y === cy - sanctRadius - 1 || y === cy + sanctRadius + 1);
          if (isEdge) {
            // Leave 4 cardinal openings
            const isDoor = (x === cx && (y === cy - sanctRadius - 1 || y === cy + sanctRadius + 1)) ||
                           (y === cy && (x === cx - sanctRadius - 1 || x === cx + sanctRadius + 1));
            if (isDoor) {
              map[x][y] = WALL_TYPE.EMPTY;
            } else {
              map[x][y] = WALL_TYPE.OBSIDIAN_SANCTUARY;
            }
          }
        }
      }
    }

    // 2. Define 4 Cardinal Relic Shrine Chambers
    const shrines = [
      { id: 'north', name: 'Labrys Shrine', relicIdx: 0, x: cx, y: 3 },
      { id: 'east',  name: 'Minos Shrine',  relicIdx: 1, x: w - 4, y: cy },
      { id: 'south', name: 'Wings Shrine',  relicIdx: 2, x: cx, y: h - 4 },
      { id: 'west',  name: 'Pithos Shrine', relicIdx: 3, x: 3, y: cy }
    ];

    shrines.forEach(shrine => {
      for (let sx = shrine.x - 1; sx <= shrine.x + 1; sx++) {
        for (let sy = shrine.y - 1; sy <= shrine.y + 1; sy++) {
          if (sx > 0 && sx < w - 1 && sy > 0 && sy < h - 1) {
            map[sx][sy] = WALL_TYPE.EMPTY;
          }
        }
      }
      // Wall borders with Knossos fresco and Horns of Consecration
      for (let sx = shrine.x - 2; sx <= shrine.x + 2; sx++) {
        for (let sy = shrine.y - 2; sy <= shrine.y + 2; sy++) {
          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const isBorder = (sx === shrine.x - 2 || sx === shrine.x + 2 ||
                              sy === shrine.y - 2 || sy === shrine.y + 2);
            if (isBorder && map[sx][sy] !== WALL_TYPE.EMPTY) {
              map[sx][sy] = (sx + sy) % 2 === 0 ? WALL_TYPE.KNOSSOS_FRESCO : WALL_TYPE.HORNS_CONSECRATION;
            }
          }
        }
      }
    });

    // 3. Recursive Backtracker Maze Generation for remaining corridors
    const stack = [];
    let startCell = { x: 1, y: 1 };
    map[startCell.x][startCell.y] = WALL_TYPE.EMPTY;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];
      const dirs = [
        { dx: 0, dy: -2 },
        { dx: 2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 }
      ];

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
          // Check if unvisited wall
          if (map[nx][ny] !== WALL_TYPE.EMPTY && map[nx][ny] !== WALL_TYPE.OBSIDIAN_SANCTUARY) {
            neighbors.push({
              x: nx,
              y: ny,
              wallX: current.x + d.dx / 2,
              wallY: current.y + d.dy / 2
            });
          }
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        // Carve passage through intermediate wall and target cell
        if (map[next.wallX][next.wallY] !== WALL_TYPE.OBSIDIAN_SANCTUARY) {
          map[next.wallX][next.wallY] = WALL_TYPE.EMPTY;
        }
        map[next.x][next.y] = WALL_TYPE.EMPTY;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }

    // 4. Connect Shrines and Sanctuary to the Maze
    shrines.forEach(shrine => {
      // Carve 1-tile connector corridor towards maze
      const dirs = [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 }];
      for (const d of dirs) {
        const nx = shrine.x + d.dx * 2;
        const ny = shrine.y + d.dy * 2;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
          map[shrine.x + d.dx][shrine.y + d.dy] = WALL_TYPE.EMPTY;
          break;
        }
      }
    });

    // 5. Loop Braiding: Selectively remove 18% of dead ends to create looping corridors
    // This replicates the authentic ancient Cretan labyrinth design (no simple tree structure)
    for (let x = 1; x < w - 1; x++) {
      for (let y = 1; y < h - 1; y++) {
        if (map[x][y] === WALL_TYPE.EMPTY) {
          // Count surrounding walls
          let wallCount = 0;
          const closedDirs = [];
          const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
          dirs.forEach(d => {
            const nx = x + d.dx;
            const ny = y + d.dy;
            if (map[nx][ny] !== WALL_TYPE.EMPTY && map[nx][ny] !== WALL_TYPE.OBSIDIAN_SANCTUARY) {
              wallCount++;
              closedDirs.push(d);
            }
          });

          // If dead end (3 walls), chance to punch through one wall
          if (wallCount === 3 && Math.random() < 0.22 && closedDirs.length > 0) {
            const pick = closedDirs[Math.floor(Math.random() * closedDirs.length)];
            const wx = x + pick.dx;
            const wy = y + pick.dy;
            const targetX = x + pick.dx * 2;
            const targetY = y + pick.dy * 2;
            if (targetX > 0 && targetX < w - 1 && targetY > 0 && targetY < h - 1) {
              if (map[wx][wy] !== WALL_TYPE.OBSIDIAN_SANCTUARY) {
                map[wx][wy] = WALL_TYPE.EMPTY;
              }
            }
          }
        }
      }
    }

    // 6. Place Locked Bronze Vault Doors
    // Positioned at bottleneck corridors guarding access to inner regions
    const vaultDoors = [];
    let placedDoors = 0;
    const candidateDoors = [
      { x: cx, y: cy - sanctRadius - 2, keyReq: 'bronze' },
      { x: cx, y: cy + sanctRadius + 2, keyReq: 'silver' },
      { x: cx - sanctRadius - 2, y: cy, keyReq: 'bronze' },
      { x: cx + sanctRadius + 2, y: cy, keyReq: 'silver' }
    ];

    for (const cd of candidateDoors) {
      if (placedDoors >= 2) break;
      if (cd.x > 1 && cd.x < w - 2 && cd.y > 1 && cd.y < h - 2) {
        if (map[cd.x][cd.y] === WALL_TYPE.EMPTY) {
          // Check if corridor bottleneck (flanked by walls)
          const horizWall = (map[cd.x - 1][cd.y] !== WALL_TYPE.EMPTY && map[cd.x + 1][cd.y] !== WALL_TYPE.EMPTY);
          const vertWall = (map[cd.x][cd.y - 1] !== WALL_TYPE.EMPTY && map[cd.x][cd.y + 1] !== WALL_TYPE.EMPTY);
          if (horizWall || vertWall) {
            map[cd.x][cd.y] = WALL_TYPE.BRONZE_VAULT_DOOR;
            vaultDoors.push({
              x: cd.x,
              y: cd.y,
              keyReq: cd.keyReq,
              isUnlocked: false,
              openProgress: 0 // 0 to 1
            });
            placedDoors++;
          }
        }
      }
    }

    // 7. Place Bronze and Silver Keys in remote alcoves
    const keys = [];
    const keyCandidates = [];
    for (let x = 2; x < w - 2; x++) {
      for (let y = 2; y < h - 2; y++) {
        if (map[x][y] === WALL_TYPE.EMPTY) {
          // Prefer tiles far from center and player start (1.5, 1.5)
          const dFromStart = Math.hypot(x - 1.5, y - 1.5);
          const dFromCenter = Math.hypot(x - cx, y - cy);
          if (dFromStart > w * 0.35 && dFromCenter > sanctRadius + 3) {
            keyCandidates.push({ x: x + 0.5, y: y + 0.5, dist: dFromStart });
          }
        }
      }
    }
    keyCandidates.sort((a, b) => b.dist - a.dist);

    if (keyCandidates.length > 0) {
      keys.push({
        id: 'bronze',
        name: 'Bronze Key of Knossos',
        x: keyCandidates[0].x,
        y: keyCandidates[0].y,
        color: '#D35400',
        collected: false
      });
    }
    if (keyCandidates.length > 2) {
      const idx = Math.floor(keyCandidates.length * 0.5);
      keys.push({
        id: 'silver',
        name: 'Silver Key of Gortyn',
        x: keyCandidates[idx].x,
        y: keyCandidates[idx].y,
        color: '#BDC3C7',
        collected: false
      });
    }

    // 8. Place 4 Sacred Minoan Relics in Shrines
    const relics = shrines.map((shrine, idx) => {
      const def = MINOAN_RELICS[idx];
      return {
        id: def.id,
        name: def.name,
        greek: def.greek,
        desc: def.desc,
        color: def.color,
        glow: def.glow,
        x: shrine.x + 0.5,
        y: shrine.y + 0.5,
        collected: false,
        bobPhase: Math.random() * Math.PI * 2
      };
    });

    // 9. Place Wall Sconces with Flickering Torches
    const torches = [];
    for (let x = 2; x < w - 2; x++) {
      for (let y = 2; y < h - 2; y++) {
        if (map[x][y] === WALL_TYPE.EMPTY) {
          // Check if adjacent to wall
          const adjWall = (map[x - 1][y] !== WALL_TYPE.EMPTY || map[x + 1][y] !== WALL_TYPE.EMPTY ||
                           map[x][y - 1] !== WALL_TYPE.EMPTY || map[x][y + 1] !== WALL_TYPE.EMPTY);
          if (adjWall && Math.random() < 0.08) {
            torches.push({
              x: x + 0.5,
              y: y + 0.5,
              flicker: 1.0,
              color: '#F39C12'
            });
          }
        }
      }
    }

    // 10. Place Exit Portal in outer corner
    let exitPos = { x: w - 2.5, y: h - 2.5 };
    if (map[w - 2][h - 2] !== WALL_TYPE.EMPTY) {
      // Find nearest empty corner cell
      for (let d = 2; d < 6; d++) {
        if (map[w - d][h - d] === WALL_TYPE.EMPTY) {
          exitPos = { x: w - d + 0.5, y: h - d + 0.5 };
          break;
        }
      }
    }

    return {
      map,
      fog,
      sanctuary: { cx: cx + 0.5, cy: cy + 0.5, radius: sanctRadius },
      vaultDoors,
      keys,
      relics,
      torches,
      exit: exitPos
    };
  }
}


// ============================================================================
// SECTION 7: ARIADNE'S GOLDEN THREAD SYSTEM (MITOS)
// ============================================================================

/**
 * Continuous elastic spline rope trail deployed behind the player.
 * Anchored to corridor corners using 2D geometric corner snapping so the
 * thread never cuts through solid walls and guides the player back to safety.
 */
export class AriadneThreadSystem {
  constructor(maxCubits = 250) {
    this.maxCubits = maxCubits;
    this.isDeploying = true;
    this.anchors = []; // Corner anchor pins [{ x, y }]
    this.trail = [];   // High-density sampled trail points [{ x, y }]
    this.totalLength = 0;
    this.glowLuminance = 1.0;
    this.minDistBetweenTrailPoints = 0.35;
  }

  reset(startX = 1.5, startY = 1.5) {
    this.anchors = [{ x: startX, y: startY }];
    this.trail = [{ x: startX, y: startY }];
    this.totalLength = 0;
    this.isDeploying = true;
  }

  toggleDeploying() {
    this.isDeploying = !this.isDeploying;
    return this.isDeploying;
  }

  getRemainingCubits() {
    return Math.max(0, this.maxCubits - this.totalLength);
  }

  /**
   * Updates thread trajectory as player moves.
   * Performs 2D corner snapping check using navGrid raycasting.
   */
  update(playerX, playerY, navGrid, audio = null) {
    if (!this.isDeploying || this.getRemainingCubits() <= 0) return;

    if (this.anchors.length === 0) {
      this.reset(playerX, playerY);
      return;
    }

    const lastAnchor = this.anchors[this.anchors.length - 1];
    const lastTrail = this.trail[this.trail.length - 1];

    const dTrail = Math.hypot(playerX - lastTrail.x, playerY - lastTrail.y);
    if (dTrail < this.minDistBetweenTrailPoints) return;

    // Check if line-of-sight from last anchor to current player position is blocked
    const hasLOS = navGrid.hasLineOfSight(lastAnchor.x, lastAnchor.y, playerX, playerY);

    if (!hasLOS) {
      // Wall intersection occurred! Find the corner pivot point
      const corner = this.findCornerPivot(lastAnchor, playerX, playerY, navGrid);
      if (corner) {
        this.anchors.push(corner);
        this.totalLength += Math.hypot(corner.x - lastAnchor.x, corner.y - lastAnchor.y);
        if (audio && Math.random() < 0.35) {
          audio.playThreadUnspool();
        }
      }
    }

    // Add trail point
    this.trail.push({ x: playerX, y: playerY });
    this.totalLength += dTrail;

    // Cap maximum stored points for memory efficiency while preserving spline
    if (this.trail.length > 1200) {
      this.trail.splice(1, 10);
    }
  }

  /**
   * Geometric corner snapping:
   * Scans grid cells between anchor and player to locate the convex corner.
   */
  findCornerPivot(anchor, px, py, navGrid) {
    const ax = anchor.x;
    const ay = anchor.y;

    // Sample along line segment to find point just before wall entry
    const steps = 16;
    let lastFreeX = ax;
    let lastFreeY = ay;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sx = lerp(ax, px, t);
      const sy = lerp(ay, py, t);
      const gx = Math.floor(sx);
      const gy = Math.floor(sy);

      if (navGrid.isWalkable(gx, gy)) {
        lastFreeX = sx;
        lastFreeY = sy;
      } else {
        // Hit wall cell! Find nearest corner vertex
        const cornerX = (px > ax) ? gx - 0.05 : gx + 1.05;
        const cornerY = (py > ay) ? gy - 0.05 : gy + 1.05;

        // Ensure corner point itself is walkable
        const testGx = Math.floor(cornerX);
        const testGy = Math.floor(cornerY);
        if (navGrid.isWalkable(testGx, testGy)) {
          return { x: cornerX, y: cornerY };
        }
        return { x: lastFreeX, y: lastFreeY };
      }
    }
    return null;
  }

  /**
   * Evaluates a smooth Catmull-Rom spline through anchor points.
   */
  getSplinePoints(resolution = 4) {
    const pts = this.anchors;
    if (pts.length < 2) return pts;

    const result = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

      for (let t = 0; t < 1; t += 1 / resolution) {
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

        const y = 0.5 * ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

        result.push({ x, y });
      }
    }
    result.push(pts[pts.length - 1]);
    return result;
  }

  /**
   * Calculates dynamic light contribution from nearby thread nodes
   * onto a given grid coordinate (x, y).
   */
  getLightAt(x, y, maxDist = 2.0) {
    if (this.trail.length === 0) return 0;
    let light = 0;
    const maxDSq = maxDist * maxDist;

    // Sample every 4th trail point for performance
    const step = Math.max(1, Math.floor(this.trail.length / 40));
    for (let i = 0; i < this.trail.length; i += step) {
      const p = this.trail[i];
      const dSq = distSq(x, y, p.x, p.y);
      if (dSq < maxDSq) {
        const falloff = 1 - Math.sqrt(dSq) / maxDist;
        light += falloff * 0.3 * this.glowLuminance;
        if (light >= 0.8) break;
      }
    }
    return clamp(light, 0, 1.0);
  }
}


// ============================================================================
// SECTION 8: THE MINOTAUR (ASTERION) AI ENTITY & STATE MACHINE
// ============================================================================

/**
 * Asterion the Minotaur AI Entity.
 * Implements a 4-phase state machine (DORMANT, PROWLING, STALKING, CHARGE)
 * with A* pathfinding, dynamic scent-tracking, sound vibration response,
 * and terrifying physical presence.
 */
export class AsterionEntity {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.spawnX = startX;
    this.spawnY = startY;
    this.dirX = 0;
    this.dirY = 1;
    this.angle = Math.PI / 2;

    this.state = MINOTAUR_STATE.DORMANT;
    this.stateTimer = 0;
    this.path = [];
    this.pathIndex = 0;
    this.repathTimer = 0;

    // Movement speeds (tiles per second)
    this.baseSpeed = 1.6;
    this.prowlSpeed = 1.4;
    this.stalkSpeed = 2.4;
    this.chargeSpeed = 4.2;

    this.hp = 1000; // Legendary guardian
    this.attackRange = 0.85;
    this.attackCooldown = 0;
    this.damage = 35;

    // Threat telemetry
    this.distanceToPlayer = 20.0;
    this.threatLevel = 0.0; // 0 (safe) to 1 (lethal danger)
    this.heartbeatBpm = 65;
    this.screenShake = 0.0;
    this.redVignette = 0.0;

    // Visual & Animation state
    this.walkCycle = 0;
    this.hornTilt = 0;
    this.eyeGlow = 1.0;
    this.axeAngle = 0;
    this.steamTimer = 0;

    // Hearing & Perception radii (tiles)
    this.sightRadius = 11.0;
    this.sightFovCos = Math.cos(Math.PI * 0.45); // ~80 degree forward cone
    this.hearingRadius = 9.0;
    this.wakeRadius = 6.0;

    // Memory of player's last known location
    this.lastSeenPlayerX = null;
    this.lastSeenPlayerY = null;
    this.lostSightTimer = 0;
  }

  reset(startX = this.spawnX, startY = this.spawnY) {
    this.x = startX;
    this.y = startY;
    this.state = MINOTAUR_STATE.DORMANT;
    this.stateTimer = 0;
    this.path = [];
    this.pathIndex = 0;
    this.repathTimer = 0;
    this.attackCooldown = 0;
    this.threatLevel = 0.0;
    this.screenShake = 0.0;
    this.redVignette = 0.0;
    this.lastSeenPlayerX = null;
    this.lastSeenPlayerY = null;
  }

  wakeUp(reason = 'noise', audio = null) {
    if (this.state === MINOTAUR_STATE.DORMANT) {
      this.state = MINOTAUR_STATE.PROWLING;
      this.stateTimer = 0;
      if (audio) audio.playMinotaurRoar(false);
    }
  }

  distractTo(x, y, audio = null) {
    // Gong or stone breadcrumb distraction
    this.state = MINOTAUR_STATE.STALKING;
    this.stateTimer = 0;
    this.lastSeenPlayerX = x;
    this.lastSeenPlayerY = y;
    this.path = [];
    if (audio) audio.playMinotaurGrowl();
  }

  /**
   * Main update loop for Asterion AI.
   */
  update(dt, player, navGrid, particles, audio = null) {
    this.stateTimer += dt;
    this.repathTimer -= dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.steamTimer += dt;

    // Distance and line of sight to player
    this.distanceToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const hasLOS = (this.distanceToPlayer <= this.sightRadius) &&
                   navGrid.hasLineOfSight(this.x, this.y, player.x, player.y);

    // Compute threat level and heartbeat
    this.updateThreatTelemetry(player, dt, audio);

    // Snort breath steam periodically
    if (this.steamTimer > (this.state === MINOTAUR_STATE.CHARGE ? 0.4 : 1.8)) {
      this.steamTimer = 0;
      this.emitBreathSteam(particles);
    }

    // State Machine Dispatch
    switch (this.state) {
      case MINOTAUR_STATE.DORMANT:
        this.updateDormant(dt, player, hasLOS, audio);
        break;
      case MINOTAUR_STATE.PROWLING:
        this.updateProwling(dt, player, hasLOS, navGrid, audio);
        break;
      case MINOTAUR_STATE.STALKING:
        this.updateStalking(dt, player, hasLOS, navGrid, audio);
        break;
      case MINOTAUR_STATE.CHARGE:
        this.updateCharge(dt, player, hasLOS, navGrid, audio);
        break;
    }

    // Decay visual screen effects
    this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
    this.redVignette = Math.max(0, this.redVignette - dt * 1.5);
  }

  /**
   * Updates threat level, camera shake, and heartbeat.
   */
  updateThreatTelemetry(player, dt, audio) {
    if (this.state === MINOTAUR_STATE.DORMANT) {
      this.threatLevel = 0.05;
      this.heartbeatBpm = 60;
      return;
    }

    // Closeness factor: 0 at 16 tiles, 1 at 0 tiles
    const closeness = clamp(1 - (this.distanceToPlayer / 16.0), 0, 1);

    if (this.state === MINOTAUR_STATE.CHARGE) {
      this.threatLevel = 1.0;
      this.heartbeatBpm = 175;
      this.screenShake = Math.min(1.0, this.screenShake + dt * 3.0);
      this.redVignette = Math.min(0.6, closeness * 0.8);
    } else if (this.state === MINOTAUR_STATE.STALKING) {
      this.threatLevel = lerp(0.4, 0.85, closeness);
      this.heartbeatBpm = Math.floor(lerp(80, 140, closeness));
    } else { // PROWLING
      this.threatLevel = lerp(0.1, 0.4, closeness);
      this.heartbeatBpm = Math.floor(lerp(65, 95, closeness));
    }

    // Trigger heartbeat audio ticks
    if (audio && this.threatLevel > 0.15) {
      const beatInterval = 60.0 / this.heartbeatBpm;
      if (!this.lastHeartbeatTime || performance.now() * 0.001 - this.lastHeartbeatTime > beatInterval) {
        this.lastHeartbeatTime = performance.now() * 0.001;
        audio.playHeartbeat(this.heartbeatBpm);
      }
    }
  }

  /**
   * 1. DORMANT STATE:
   * Sleeping in the sanctuary until awakened by closeness, relic seizure, or gong.
   */
  updateDormant(dt, player, hasLOS, audio) {
    // Wake up if player enters sanctuary or steps too close
    if (this.distanceToPlayer < this.wakeRadius || (hasLOS && this.distanceToPlayer < this.sightRadius * 0.6)) {
      this.wakeUp('player_near', audio);
    }
  }

  /**
   * 2. PROWLING STATE:
   * Roams corridors listening for footsteps or picking up scent trails.
   */
  updateProwling(dt, player, hasLOS, navGrid, audio) {
    // Line of sight triggers immediate CHARGE
    if (hasLOS) {
      this.initiateCharge(player, audio);
      return;
    }

    // Check player scent at current position
    const localScent = navGrid.getScentAt(this.x, this.y);
    if (localScent > 0.4) {
      this.state = MINOTAUR_STATE.STALKING;
      this.stateTimer = 0;
      if (audio && Math.random() < 0.3) audio.playMinotaurGrowl();
      return;
    }

    // Check for nearby sound vibrations (running steps, stone drops)
    if (navGrid.soundVibrations.length > 0) {
      const loudest = navGrid.soundVibrations[navGrid.soundVibrations.length - 1];
      const dSound = Math.hypot(loudest.x - this.x, loudest.y - this.y);
      if (dSound <= this.hearingRadius * loudest.intensity) {
        this.distractTo(loudest.x, loudest.y, audio);
        return;
      }
    }

    // Move along patrol path or pick new random waypoint
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      this.pickRandomPatrolGoal(navGrid);
    }

    this.followPath(dt, this.prowlSpeed);
  }

  /**
   * 3. STALKING STATE:
   * Following scent trail or heading to last known player position via A*.
   */
  updateStalking(dt, player, hasLOS, navGrid, audio) {
    // Direct sight triggers CHARGE!
    if (hasLOS) {
      this.initiateCharge(player, audio);
      return;
    }

    // Repath towards player or scent gradient
    if (this.repathTimer <= 0) {
      this.repathTimer = 1.0; // Repath every 1s
      let targetX = player.x;
      let targetY = player.y;

      // If player is far, follow scent gradient
      if (this.distanceToPlayer > 8.0) {
        const gradient = navGrid.findScentGradient(Math.floor(this.x), Math.floor(this.y));
        if (gradient) {
          targetX = gradient.x + 0.5;
          targetY = gradient.y + 0.5;
        }
      }

      this.path = navGrid.findPath(this.x, this.y, targetX, targetY);
      this.pathIndex = 0;
    }

    // Revert to prowling if lost trail for > 14 seconds
    if (this.stateTimer > 14.0 && this.distanceToPlayer > 12.0) {
      this.state = MINOTAUR_STATE.PROWLING;
      this.stateTimer = 0;
      this.path = [];
      return;
    }

    this.followPath(dt, this.stalkSpeed);
  }

  /**
   * 4. CHARGE STATE:
   * High-speed sprint directly towards player with lowered horns!
   */
  updateCharge(dt, player, hasLOS, navGrid, audio) {
    this.hornTilt = lerp(this.hornTilt, 0.45, dt * 6.0); // Lower horns
    this.eyeGlow = 2.0; // Crimson eye flare

    if (hasLOS) {
      this.lastSeenPlayerX = player.x;
      this.lastSeenPlayerY = player.y;
      this.lostSightTimer = 0;

      // Direct sprint vector
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001) {
        this.dirX = dx / dist;
        this.dirY = dy / dist;
        this.angle = Math.atan2(this.dirY, this.dirX);
      }

      // Attack player if within reach
      if (dist < this.attackRange && this.attackCooldown <= 0) {
        this.attackPlayer(player, audio);
      }

      // High-speed charge movement
      const moveDist = this.chargeSpeed * dt;
      const nx = this.x + this.dirX * moveDist;
      const ny = this.y + this.dirY * moveDist;

      if (navGrid.isWalkable(Math.floor(nx), Math.floor(this.y))) this.x = nx;
      if (navGrid.isWalkable(Math.floor(this.x), Math.floor(ny))) this.y = ny;

      this.walkCycle += dt * 14.0;
    } else {
      // Lost direct sight — sprint towards last seen position
      this.lostSightTimer += dt;
      if (this.repathTimer <= 0 && this.lastSeenPlayerX !== null) {
        this.repathTimer = 0.5;
        this.path = navGrid.findPath(this.x, this.y, this.lastSeenPlayerX, this.lastSeenPlayerY);
        this.pathIndex = 0;
      }

      this.followPath(dt, this.chargeSpeed * 0.85);

      // If lost sight for > 4.5 seconds, revert to Stalking
      if (this.lostSightTimer > 4.5) {
        this.state = MINOTAUR_STATE.STALKING;
        this.stateTimer = 0;
        this.hornTilt = 0;
        this.eyeGlow = 1.0;
        if (audio) audio.playMinotaurGrowl();
      }
    }
  }

  initiateCharge(player, audio) {
    this.state = MINOTAUR_STATE.CHARGE;
    this.stateTimer = 0;
    this.lostSightTimer = 0;
    this.lastSeenPlayerX = player.x;
    this.lastSeenPlayerY = player.y;
    this.screenShake = 1.0;
    if (audio) audio.playMinotaurRoar(true);
  }

  attackPlayer(player, audio) {
    this.attackCooldown = 1.2;
    player.hp = Math.max(0, player.hp - this.damage);
    this.screenShake = 1.5;
    this.redVignette = 0.9;
    if (audio) audio.playMinotaurRoar(true);
  }

  followPath(dt, speed) {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) return;

    const target = this.path[this.pathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.25) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.path = [];
        return;
      }
    }

    if (dist > 0.001) {
      this.dirX = dx / dist;
      this.dirY = dy / dist;
      this.angle = Math.atan2(this.dirY, this.dirX);
      this.x += this.dirX * speed * dt;
      this.y += this.dirY * speed * dt;
      this.walkCycle += dt * (speed * 3.5);
    }
  }

  pickRandomPatrolGoal(navGrid) {
    const attempts = 15;
    for (let i = 0; i < attempts; i++) {
      const rx = Math.floor(Math.random() * (navGrid.width - 2)) + 1;
      const ry = Math.floor(Math.random() * (navGrid.height - 2)) + 1;
      if (navGrid.isWalkable(rx, ry)) {
        this.path = navGrid.findPath(this.x, this.y, rx + 0.5, ry + 0.5);
        this.pathIndex = 0;
        break;
      }
    }
  }

  emitBreathSteam(particles) {
    if (!particles) return;
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: this.x + (Math.random() * 0.2 - 0.1),
        y: this.y + (Math.random() * 0.2 - 0.1),
        vx: this.dirX * 0.5 + (Math.random() * 0.3 - 0.15),
        vy: this.dirY * 0.5 + (Math.random() * 0.3 - 0.15),
        life: 0.8,
        maxLife: 0.8,
        size: 3 + Math.random() * 3,
        color: 'rgba(230, 235, 240, 0.45)',
        type: 'steam'
      });
    }
  }
}


// ============================================================================
// SECTION 9: RELICS, VAULT DOORS, KEYS, BREADCRUMBS & PARTICLES
// ============================================================================

/**
 * Particle FX Engine for torch flames, rising embers, Minotaur steam,
 * thread luminescence motes, and sacred relic sparkles.
 */
export class LabyrinthusParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() {
    this.particles = [];
  }

  spawnTorchEmber(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.4;
    this.particles.push({
      x: x + (Math.random() * 0.1 - 0.05),
      y: y + (Math.random() * 0.1 - 0.05),
      vx: Math.cos(angle) * speed * 0.4,
      vy: Math.sin(angle) * speed * 0.4,
      life: 0.6 + Math.random() * 0.6,
      maxLife: 1.2,
      size: 1.5 + Math.random() * 2,
      color: Math.random() < 0.6 ? '#F39C12' : '#E74C3C',
      type: 'ember'
    });
  }

  spawnRelicSparkle(x, y, color = '#F1C40F') {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.5;
    this.particles.push({
      x: x + (Math.random() * 0.3 - 0.15),
      y: y + (Math.random() * 0.3 - 0.15),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.5,
      maxLife: 1.3,
      size: 2 + Math.random() * 2.5,
      color: color,
      type: 'sparkle'
    });
  }

  spawnStoneDust(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 2.0,
        color: '#BDC3C7',
        type: 'dust'
      });
    }
  }

  spawnGongRings(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        life: 1.2,
        maxLife: 1.2,
        size: 4.0,
        color: '#F1C40F',
        type: 'shockwave'
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
    }
  }
}

/**
 * Manages player breadcrumb stones, relics, keys, and vault door states.
 */
export class LabyrinthusDungeonManager {
  constructor() {
    this.relics = [];
    this.keys = [];
    this.vaultDoors = [];
    this.breadcrumbs = [];
    this.relicsCollectedCount = 0;
    this.maskActiveTimer = 0;
    this.wingsActive = false;
  }

  init(dungeonData) {
    this.relics = dungeonData.relics || [];
    this.keys = dungeonData.keys || [];
    this.vaultDoors = dungeonData.vaultDoors || [];
    this.breadcrumbs = [];
    this.relicsCollectedCount = 0;
    this.maskActiveTimer = 0;
    this.wingsActive = false;
  }

  dropBreadcrumb(playerX, playerY, navGrid, particles, audio = null) {
    if (this.breadcrumbs.length >= 40) {
      this.breadcrumbs.shift(); // Cap maximum breadcrumbs
    }
    const stone = {
      x: playerX,
      y: playerY,
      glow: 1.0,
      color: '#ECF0F1'
    };
    this.breadcrumbs.push(stone);
    navGrid.emitSound(playerX, playerY, 0.7, 7.0);
    if (particles) particles.spawnStoneDust(playerX, playerY);
    if (audio) audio.playStoneDrop();
  }

  strikeGong(gongX, gongY, asterion, navGrid, particles, audio = null) {
    navGrid.emitSound(gongX, gongY, 2.0, 24.0);
    if (asterion) {
      asterion.distractTo(gongX, gongY, audio);
    }
    if (particles) particles.spawnGongRings(gongX, gongY);
    if (audio) audio.playGong();
  }

  update(dt, player, navGrid, particles, audio = null, onToast = null) {
    if (this.maskActiveTimer > 0) {
      this.maskActiveTimer -= dt;
    }

    // 1. Check Relic Collisions
    for (let i = 0; i < this.relics.length; i++) {
      const r = this.relics[i];
      if (!r.collected) {
        r.bobPhase += dt * 2.5;
        if (particles && Math.random() < 0.15) {
          particles.spawnRelicSparkle(r.x, r.y, r.color);
        }

        const d = Math.hypot(player.x - r.x, player.y - r.y);
        if (d < 0.65) {
          r.collected = true;
          this.relicsCollectedCount++;
          if (audio) audio.playRelicChime(i);
          if (particles) {
            for (let k = 0; k < 12; k++) particles.spawnRelicSparkle(r.x, r.y, r.color);
          }

          // Apply Relic Blessing
          if (r.id === 'labrys') {
            player.maxStamina = 150;
            player.stamina = 150;
            if (onToast) onToast('Labrys of Knossos Claimed! (+50% Stamina Capacity)');
          } else if (r.id === 'mask_minos') {
            this.maskActiveTimer = 18.0; // Reveal Asterion for 18 seconds
            if (onToast) onToast('Mask of King Minos Acquired! (Asterion Position Revealed)');
          } else if (r.id === 'daedalian_wings') {
            this.wingsActive = true;
            player.sprintSpeedMultiplier = 1.35;
            if (onToast) onToast('Daedalian Feather Wings Claimed! (Silent Steps & +35% Speed)');
          } else if (r.id === 'pithos_wine') {
            player.hp = 100;
            player.stamina = player.maxStamina;
            if (onToast) onToast('Pithos of Sacred Honey & Wine! (Full Health & Stamina Restored)');
          }
        }
      }
    }

    // 2. Check Key Pickups
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      if (!k.collected) {
        const d = Math.hypot(player.x - k.x, player.y - k.y);
        if (d < 0.6) {
          k.collected = true;
          if (audio) audio.playKeyPickup();
          if (onToast) onToast(`Collected ${k.name}!`);
        }
      }
    }

    // 3. Check Vault Doors Interaction
    for (let i = 0; i < this.vaultDoors.length; i++) {
      const vd = this.vaultDoors[i];
      if (!vd.isUnlocked) {
        const d = Math.hypot(player.x - (vd.x + 0.5), player.y - (vd.y + 0.5));
        if (d < 1.2) {
          // Check if player owns the matching key
          const hasKey = this.keys.some(k => k.id === vd.keyReq && k.collected);
          if (hasKey) {
            vd.isUnlocked = true;
            navGrid.setCell(vd.x, vd.y, WALL_TYPE.EMPTY); // Clear wall collision
            if (audio) audio.playDoorOpen();
            if (onToast) onToast(`Bronze Vault Unlocked with ${vd.keyReq.toUpperCase()} key!`);
          } else {
            if (onToast && Math.random() < 0.03) {
              onToast(`Vault Door Sealed! Requires ${vd.keyReq.toUpperCase()} Key.`);
            }
          }
        }
      }
    }
  }
}


// ============================================================================
// SECTION 10: HIGH-PERFORMANCE DDA RAYCASTING ENGINE
// ============================================================================

/**
 * Digital Differential Analyzer (DDA) 3D Raycasting Engine.
 * Renders textured Minoan frescoes, carved limestone ashlar, bronze relief vault doors,
 * dynamic distance fog, torchlight attenuation, and 3D billboard sprites in pure Canvas 2D.
 */
export class LabyrinthusRaycaster {
  constructor(textureAtlas) {
    this.textureAtlas = textureAtlas;
    this.resolution = 2; // Raycast resolution step (1 = high, 2 = standard, 4 = retro)
    this.fovDegrees = 72; // Field of View (60° to 90°)
    this.torchRadius = 8.0; // Distance in tiles that player torch penetrates
    this.torchFlicker = 1.0;
    this.zBuffer = [];
  }

  setResolution(res) {
    this.resolution = clamp(res, 1, 4);
  }

  setFov(deg) {
    this.fovDegrees = clamp(deg, 50, 100);
  }

  setTorchRadius(r) {
    this.torchRadius = clamp(r, 3, 16);
  }

  /**
   * Main 3D Scene Render Pass:
   * Floor & Ceiling -> DDA Wall Raycast Columns -> 3D Billboard Sprites -> Ariadne's Thread Glow.
   */
  render(ctx, width, height, player, navGrid, dungeon, asterion, thread, particles, timeMs) {
    if (!ctx || width <= 0 || height <= 0) return;

    // Torchlight sinusoidal & pseudo-random flicker
    const tSec = timeMs * 0.001;
    this.torchFlicker = 0.92 + Math.sin(tSec * 13.0) * 0.05 + Math.cos(tSec * 29.0) * 0.03;

    // Camera pitch offset from head-bobbing and sprint inertia
    const pitchOffset = Math.floor(player.pitchOffset || 0);
    const halfHeight = Math.floor(height * 0.5) + pitchOffset;

    // 1. Render Ceiling & Floor Planes with Ambient Depth Gradients
    this.renderFloorAndCeiling(ctx, width, height, halfHeight);

    // Initialize or resize Z-Buffer for sprite occlusion testing
    if (this.zBuffer.length !== width) {
      this.zBuffer = new Float32Array(width);
    }

    // 2. Cast DDA Wall Rays across horizontal screen columns
    this.castWallRays(ctx, width, height, halfHeight, pitchOffset, player, navGrid, thread);

    // 3. Render 3D Billboard Sprites (Asterion, Relics, Keys, Torches, Breadcrumbs, Exit Portal)
    this.renderBillboardSprites(ctx, width, height, halfHeight, pitchOffset, player, dungeon, asterion, particles, tSec);

    // 4. Render 3D Projected Ground Nodes for Ariadne's Golden Thread
    this.renderGroundThreadNodes(ctx, width, height, halfHeight, pitchOffset, player, thread);
  }

  /**
   * 1. Ceiling & Floor Gradient Background.
   */
  renderFloorAndCeiling(ctx, width, height, halfHeight) {
    ctx.save();
    try {
      // Ceiling: Cedar timber & dark cavern gradient
      const ceilGrad = ctx.createLinearGradient(0, 0, 0, halfHeight);
      ceilGrad.addColorStop(0, '#060709');
      ceilGrad.addColorStop(0.7, '#11141A');
      ceilGrad.addColorStop(1, '#1A1817');
      ctx.fillStyle = ceilGrad;
      ctx.fillRect(0, 0, width, halfHeight);

      // Floor: Minoan limestone flagstone gradient with torchlight reflection
      const floorGrad = ctx.createLinearGradient(0, halfHeight, 0, height);
      floorGrad.addColorStop(0, '#1E1B18');
      floorGrad.addColorStop(0.3, '#2D2218');
      floorGrad.addColorStop(1, '#100D0A');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, halfHeight, width, height - halfHeight);
    } finally {
      ctx.restore();
    }
  }

  /**
   * 2. Digital Differential Analyzer (DDA) Wall Columns.
   */
  castWallRays(ctx, width, height, halfHeight, pitchOffset, player, navGrid, thread) {
    const res = this.resolution;
    const px = player.x;
    const py = player.y;

    for (let x = 0; x < width; x += res) {
      // Camera coordinate in normalized space [-1, 1]
      const cameraX = (2 * x / width) - 1;
      const rayDirX = player.dirX + player.planeX * cameraX;
      const rayDirY = player.dirY + player.planeY * cameraX;

      // Current grid cell
      let mapX = Math.floor(px);
      let mapY = Math.floor(py);

      // Delta distances
      const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);

      let sideDistX, sideDistY;
      let stepX, stepY;
      let hit = 0;
      let side = 0; // 0 = X-wall (North/South), 1 = Y-wall (East/West)

      // Step direction and initial sideDist
      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (px - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - px) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (py - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - py) * deltaDistY;
      }

      // DDA traversal loop
      let steps = 0;
      const maxSteps = 48;

      while (hit === 0 && steps++ < maxSteps) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        // Check map boundaries
        if (mapX < 0 || mapX >= navGrid.width || mapY < 0 || mapY >= navGrid.height) {
          hit = WALL_TYPE.WEATHERED_LIMESTONE;
          break;
        }

        const cell = navGrid.getCell(mapX, mapY);
        if (cell !== WALL_TYPE.EMPTY) {
          hit = cell;
        }
      }

      // Perpendicular wall distance (prevents fisheye distortion)
      let perpWallDist;
      if (side === 0) {
        perpWallDist = (sideDistX - deltaDistX);
      } else {
        perpWallDist = (sideDistY - deltaDistY);
      }
      perpWallDist = Math.max(0.04, perpWallDist);

      // Record in Z-Buffer for this column slice
      for (let r = 0; r < res && (x + r) < width; r++) {
        this.zBuffer[x + r] = perpWallDist;
      }

      // Line height and vertical drawing bounds
      const lineHeight = Math.min(height * 8, Math.max(2, Math.floor(height / perpWallDist)));
      const drawStart = clamp(Math.floor(-lineHeight / 2 + halfHeight), 0, height);
      const drawEnd = clamp(Math.floor(lineHeight / 2 + halfHeight), 0, height);
      const sliceHeight = Math.max(1, drawEnd - drawStart);

      // Texture coordinate calculation (wallX in range [0, 1])
      let wallX;
      if (side === 0) {
        wallX = py + perpWallDist * rayDirY;
      } else {
        wallX = px + perpWallDist * rayDirX;
      }
      wallX -= Math.floor(wallX);

      // Light factor: torch attenuation + distance fog + thread luminescence
      const fogFalloff = Math.exp(-perpWallDist * 0.18);
      const torchFalloff = clamp(1.0 - (perpWallDist / this.torchRadius), 0, 1.0) * this.torchFlicker;
      const threadGlow = thread ? thread.getLightAt(mapX + 0.5, mapY + 0.5) : 0;
      const totalLight = clamp(torchFalloff * 1.2 + threadGlow + 0.08, 0, 1.4) * fogFalloff;

      // Sample color from Procedural Texture Atlas
      const rgb = this.textureAtlas.sampleColor(hit, wallX, 0.5, side, totalLight);

      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.fillRect(x, drawStart, res, sliceHeight);
    }
  }

  /**
   * 3. 3D Billboard Sprite Projection.
   */
  renderBillboardSprites(ctx, width, height, halfHeight, pitchOffset, player, dungeon, asterion, particles, tSec) {
    const sprites = [];

    // Collect Minotaur
    if (asterion) {
      sprites.push({
        type: 'minotaur',
        x: asterion.x,
        y: asterion.y,
        entity: asterion,
        size: 1.35
      });
    }

    // Collect Relics
    if (dungeon && dungeon.relics) {
      dungeon.relics.forEach(r => {
        if (!r.collected) {
          sprites.push({
            type: 'relic',
            x: r.x,
            y: r.y,
            relic: r,
            size: 0.8
          });
        }
      });
    }

    // Collect Keys
    if (dungeon && dungeon.keys) {
      dungeon.keys.forEach(k => {
        if (!k.collected) {
          sprites.push({
            type: 'key',
            x: k.x,
            y: k.y,
            key: k,
            size: 0.55
          });
        }
      });
    }

    // Collect Breadcrumb Stones
    if (dungeon && dungeon.breadcrumbs) {
      dungeon.breadcrumbs.forEach(b => {
        sprites.push({
          type: 'breadcrumb',
          x: b.x,
          y: b.y,
          stone: b,
          size: 0.4
        });
      });
    }

    // Collect Wall Torches
    if (dungeon && dungeon.torches) {
      dungeon.torches.forEach(t => {
        sprites.push({
          type: 'torch',
          x: t.x,
          y: t.y,
          torch: t,
          size: 0.75
        });
      });
    }

    // Collect Particles
    if (particles && particles.particles) {
      particles.particles.forEach(p => {
        sprites.push({
          type: 'particle',
          x: p.x,
          y: p.y,
          particle: p,
          size: 0.25
        });
      });
    }

    // Sort sprites back-to-front by squared distance to player
    sprites.forEach(s => {
      s.distSq = distSq(player.x, player.y, s.x, s.y);
    });
    sprites.sort((a, b) => b.distSq - a.distSq);

    // Transform and project sprites
    const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);

    sprites.forEach(sprite => {
      const spriteX = sprite.x - player.x;
      const spriteY = sprite.y - player.y;

      const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
      const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

      if (transformY > 0.15) { // In front of camera
        const screenX = Math.floor((width * 0.5) * (1 + transformX / transformY));
        const spriteHeight = Math.abs(Math.floor((height / transformY) * sprite.size));
        const spriteWidth = Math.abs(Math.floor((height / transformY) * sprite.size));

        const drawStartY = clamp(Math.floor(-spriteHeight * 0.5 + halfHeight), 0, height);
        const drawEndY = clamp(Math.floor(spriteHeight * 0.5 + halfHeight), 0, height);
        const drawStartX = Math.floor(-spriteWidth * 0.5 + screenX);
        const drawEndX = Math.floor(spriteWidth * 0.5 + screenX);

        // Check if on-screen and not occluded by walls in Z-Buffer
        if (drawEndX > 0 && drawStartX < width) {
          const midX = clamp(screenX, 0, width - 1);
          if (transformY < this.zBuffer[midX] + 0.1) {
            this.drawVectorBillboard(ctx, sprite, screenX, halfHeight, spriteWidth, spriteHeight, transformY, tSec);
          }
        }
      }
    });
  }

  /**
   * Draws vector-art billboard sprites for Minotaur, Relics, Keys, Torches.
   */
  drawVectorBillboard(ctx, sprite, screenX, halfHeight, w, h, depth, tSec) {
    ctx.save();
    try {
      const scale = clamp(w / 64, 0.2, 5.0);
      const light = clamp(1.0 - (depth / this.torchRadius), 0.15, 1.2);

      ctx.translate(screenX, halfHeight);

      switch (sprite.type) {
        case 'minotaur':
          this.drawMinotaurSprite(ctx, sprite.entity, scale, light, tSec);
          break;
        case 'relic':
          this.drawRelicSprite(ctx, sprite.relic, scale, light, tSec);
          break;
        case 'key':
          this.drawKeySprite(ctx, sprite.key, scale, light, tSec);
          break;
        case 'torch':
          this.drawTorchSprite(ctx, scale, light, tSec);
          break;
        case 'breadcrumb':
          this.drawBreadcrumbSprite(ctx, scale, light);
          break;
        case 'particle':
          this.drawParticleSprite(ctx, sprite.particle, scale);
          break;
      }
    } finally {
      ctx.restore();
    }
  }

  /**
   * Asterion the Minotaur 3D Billboard Sprite:
   * Massive bovine head, curved horns with golden tips, glowing crimson eyes,
   * muscular chest, raised golden Labrys axe, and breathing steam.
   */
  drawMinotaurSprite(ctx, asterion, scale, light, tSec) {
    ctx.scale(scale, scale);

    // Torso / Shoulders
    ctx.fillStyle = `rgb(${Math.floor(55 * light)},${Math.floor(35 * light)},${Math.floor(25 * light)})`;
    ctx.beginPath();
    ctx.ellipse(0, 15, safeArcRadius(22), safeArcRadius(16), 0, 0, Math.PI * 2);
    ctx.fill();

    // Muscular Neck & Bovine Head
    ctx.fillStyle = `rgb(${Math.floor(75 * light)},${Math.floor(45 * light)},${Math.floor(30 * light)})`;
    ctx.beginPath();
    ctx.ellipse(0, -5, safeArcRadius(16), safeArcRadius(18), 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Muzzle & Snout
    ctx.fillStyle = `rgb(${Math.floor(40 * light)},${Math.floor(25 * light)},${Math.floor(20 * light)})`;
    ctx.beginPath();
    ctx.ellipse(0, 5, safeArcRadius(10), safeArcRadius(8), 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive Curved Horns
    const hornTilt = asterion.hornTilt || 0;
    ctx.strokeStyle = '#DDD2BE';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Left Horn
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.quadraticCurveTo(-28, -25 + hornTilt * 20, -32, -40 + hornTilt * 15);
    ctx.stroke();

    // Right Horn
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.quadraticCurveTo(28, -25 + hornTilt * 20, 32, -40 + hornTilt * 15);
    ctx.stroke();

    // Golden Horn Tips
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(-32, -40 + hornTilt * 15, safeArcRadius(3), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(32, -40 + hornTilt * 15, safeArcRadius(3), 0, Math.PI * 2);
    ctx.fill();

    // Glowing Crimson Eyes
    const eyeFlicker = Math.sin(tSec * 15.0) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(231, 76, 60, ${eyeFlicker * (asterion.eyeGlow || 1)})`;
    ctx.beginPath();
    ctx.arc(-6, -6, safeArcRadius(3), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -6, safeArcRadius(3), 0, Math.PI * 2);
    ctx.fill();

    // Raised Golden Labrys Axe
    ctx.strokeStyle = '#996515';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 20);
    ctx.lineTo(28, -20);
    ctx.stroke();

    // Axe Double Blades
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.moveTo(28, -20);
    ctx.lineTo(38, -26);
    ctx.lineTo(38, -14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(28, -20);
    ctx.lineTo(18, -26);
    ctx.lineTo(18, -14);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Sacred Relic 3D Billboard Sprite (hovering & bobbing).
   */
  drawRelicSprite(ctx, relic, scale, light, tSec) {
    const bob = Math.sin(relic.bobPhase) * 6;
    ctx.translate(0, bob);
    ctx.scale(scale, scale);

    // Glowing aura ring
    ctx.fillStyle = relic.glow || 'rgba(241, 196, 15, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, safeArcRadius(18), 0, Math.PI * 2);
    ctx.fill();

    // Relic specific icon
    if (relic.id === 'labrys') {
      // Golden Double Axe
      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(0, -16);
      ctx.stroke();

      ctx.fillStyle = '#F1C40F';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(-14, -14, -12, 0);
      ctx.quadraticCurveTo(-14, 14, 0, 8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(14, -14, 12, 0);
      ctx.quadraticCurveTo(14, 14, 0, 8);
      ctx.closePath();
      ctx.fill();
    } else if (relic.id === 'mask_minos') {
      // Gold Mask
      ctx.fillStyle = '#E67E22';
      ctx.beginPath();
      ctx.ellipse(0, 0, safeArcRadius(14), safeArcRadius(18), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D35400';
      ctx.beginPath();
      ctx.arc(-5, -3, safeArcRadius(2.5), 0, Math.PI * 2);
      ctx.arc(5, -3, safeArcRadius(2.5), 0, Math.PI * 2);
      ctx.fill();
    } else if (relic.id === 'daedalian_wings') {
      // Golden Feather Wings
      ctx.fillStyle = '#3498DB';
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(-18, -12, -22, -4);
      ctx.quadraticCurveTo(-10, 12, 0, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(18, -12, 22, -4);
      ctx.quadraticCurveTo(10, 12, 0, 8);
      ctx.fill();
    } else {
      // Pithos of Wine
      ctx.fillStyle = '#9B59B6';
      ctx.beginPath();
      ctx.ellipse(0, 2, safeArcRadius(10), safeArcRadius(14), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-6, -14, 12, 4);
    }
  }

  drawKeySprite(ctx, key, scale, light, tSec) {
    ctx.scale(scale, scale);
    ctx.fillStyle = key.color || '#F39C12';
    ctx.beginPath();
    ctx.arc(0, -8, safeArcRadius(6), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-2, -3, 4, 14);
    ctx.fillRect(2, 4, 4, 2);
    ctx.fillRect(2, 8, 4, 2);
  }

  drawTorchSprite(ctx, scale, light, tSec) {
    ctx.scale(scale, scale);
    // Sconce bracket
    ctx.fillStyle = '#4A235A';
    ctx.fillRect(-2, 4, 4, 10);

    // Torch flame
    const flameFlicker = Math.sin(tSec * 20) * 2;
    ctx.fillStyle = '#F39C12';
    ctx.beginPath();
    ctx.ellipse(0, -2 + flameFlicker, safeArcRadius(6), safeArcRadius(9), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(0, 0 + flameFlicker, safeArcRadius(4), 0, Math.PI * 2);
    ctx.fill();
  }

  drawBreadcrumbSprite(ctx, scale, light) {
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ECF0F1';
    ctx.beginPath();
    ctx.arc(0, 10, safeArcRadius(4), 0, Math.PI * 2);
    ctx.fill();
  }

  drawParticleSprite(ctx, p, scale) {
    ctx.fillStyle = p.color || '#F1C40F';
    ctx.beginPath();
    ctx.arc(0, 0, safeArcRadius((p.size || 2) * scale), 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 4. 3D Projected Ground Nodes for Ariadne's Golden Thread.
   * Projects thread points onto the 3D floor plane so the player can trace the golden path.
   */
  renderGroundThreadNodes(ctx, width, height, halfHeight, pitchOffset, player, thread) {
    if (!thread || thread.trail.length < 2) return;

    ctx.save();
    try {
      const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
      const step = Math.max(1, Math.floor(thread.trail.length / 50));

      for (let i = 0; i < thread.trail.length; i += step) {
        const pt = thread.trail[i];
        const sx = pt.x - player.x;
        const sy = pt.y - player.y;

        const transformX = invDet * (player.dirY * sx - player.dirX * sy);
        const transformY = invDet * (-player.planeY * sx + player.planeX * sy);

        if (transformY > 0.4) {
          const screenX = Math.floor((width * 0.5) * (1 + transformX / transformY));
          const floorY = Math.floor((height / transformY) * 0.42 + halfHeight);

          if (screenX >= 0 && screenX < width && floorY < height) {
            if (transformY < this.zBuffer[screenX] + 0.1) {
              const radius = clamp(Math.floor(18 / transformY), 1.5, 8);
              const alpha = clamp(1.0 - (transformY / 12.0), 0.1, 0.85);

              ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
              ctx.beginPath();
              ctx.arc(screenX, floorY, safeArcRadius(radius), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    } finally {
      ctx.restore();
    }
  }
}


// ============================================================================
// SECTION 11: PARCHMENT BLUEPRINT MINIMAP & FOG-OF-WAR
// ============================================================================

/**
 * 2D Parchment Blueprint Minimap and Threat Radar.
 * Renders Daedalian architectural blueprints on aged papyrus with dynamic Fog-of-War,
 * continuous Ariadne's Golden Thread spline, relic markers, and Minotaur proximity threat pulse.
 */
export class ParchmentBlueprintRenderer {
  constructor() {
    this.isFullScreen = false;
    this.radarPulse = 0;
  }

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
    return this.isFullScreen;
  }

  /**
   * Uncovers Fog-of-War around player position.
   */
  updateFogOfWar(fog, playerX, playerY, mapWidth, mapHeight, navGrid, sightRadius = 6) {
    const px = Math.floor(playerX);
    const py = Math.floor(playerY);
    const r = Math.ceil(sightRadius);

    for (let x = Math.max(0, px - r); x <= Math.min(mapWidth - 1, px + r); x++) {
      for (let y = Math.max(0, py - r); y <= Math.min(mapHeight - 1, py + r); y++) {
        const d = Math.hypot(x - playerX, y - playerY);
        if (d <= sightRadius) {
          if (navGrid.hasLineOfSight(playerX, playerY, x + 0.5, y + 0.5)) {
            fog[x][y] = 2; // Directly visible
          } else if (fog[x][y] === 0 && d <= 3.0) {
            fog[x][y] = 1; // Explored/Mapped
          }
        } else if (fog[x][y] === 2) {
          fog[x][y] = 1; // Visited but no longer in direct sight
        }
      }
    }
  }

  /**
   * Main Minimap / Blueprint Render Method.
   */
  render(ctx, screenWidth, screenHeight, map, fog, mapWidth, mapHeight, player, dungeon, asterion, thread, timeMs) {
    this.radarPulse = (timeMs * 0.003) % (Math.PI * 2);

    if (this.isFullScreen) {
      this.renderFullScreenBlueprint(ctx, screenWidth, screenHeight, map, fog, mapWidth, mapHeight, player, dungeon, asterion, thread);
    } else {
      this.renderCornerRadar(ctx, screenWidth, screenHeight, map, fog, mapWidth, mapHeight, player, dungeon, asterion, thread);
    }
  }

  /**
   * 1. Compact HUD Corner Radar.
   */
  renderCornerRadar(ctx, screenWidth, screenHeight, map, fog, mapWidth, mapHeight, player, dungeon, asterion, thread) {
    ctx.save();
    try {
      const size = screenWidth < 560 ? 100 : 170;
      const pad = screenWidth < 560 ? 8 : 15;
      const x0 = screenWidth - size - pad;
      const y0 = pad + 40; // Below top bar
      const tileSize = size / Math.max(mapWidth, mapHeight);

      // Aged parchment background
      ctx.fillStyle = 'rgba(28, 20, 16, 0.88)';
      ctx.fillRect(x0 - 4, y0 - 4, size + 8, size + 8);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 - 4, y0 - 4, size + 8, size + 8);

      // Title
      ctx.fillStyle = '#D4AF37';
      ctx.font = '9px monospace';
      ctx.fillText('BLUEPRINT (M)', x0, y0 - 7);

      // Render Grid Tiles
      for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
          const f = fog[x][y];
          if (f > 0) { // Explored or visible
            const tx = x0 + x * tileSize;
            const ty = y0 + y * tileSize;

            if (map[x][y] === WALL_TYPE.EMPTY) {
              ctx.fillStyle = f === 2 ? '#6B573E' : '#453526';
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            } else if (map[x][y] === WALL_TYPE.OBSIDIAN_SANCTUARY) {
              ctx.fillStyle = '#1A1817';
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            } else if (map[x][y] === WALL_TYPE.BRONZE_VAULT_DOOR) {
              ctx.fillStyle = '#E67E22';
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            } else {
              ctx.fillStyle = '#261D17';
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            }
          }
        }
      }

      // Render Ariadne's Golden Thread Spline
      this.renderThreadSpline(ctx, thread, x0, y0, tileSize);

      // Render Relic Markers
      if (dungeon && dungeon.relics) {
        dungeon.relics.forEach(r => {
          if (!r.collected) {
            const rx = x0 + r.x * tileSize;
            const ry = y0 + r.y * tileSize;
            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.arc(rx, ry, safeArcRadius(3), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Render Minotaur threat radar indicator
      if (asterion) {
        this.renderMinotaurRadarEcho(ctx, asterion, x0, y0, tileSize, dungeon);
      }

      // Render Player with Heading Arrow
      const px = x0 + player.x * tileSize;
      const py = y0 + player.y * tileSize;

      ctx.fillStyle = '#F1C40F';
      ctx.beginPath();
      ctx.arc(px, py, safeArcRadius(3.5), 0, Math.PI * 2);
      ctx.fill();

      // Heading pointer
      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + player.dirX * 7, py + player.dirY * 7);
      ctx.stroke();

    } finally {
      ctx.restore();
    }
  }

  /**
   * 2. Full-Screen Architect Parchment Blueprint.
   */
  renderFullScreenBlueprint(ctx, screenWidth, screenHeight, map, fog, mapWidth, mapHeight, player, dungeon, asterion, thread) {
    ctx.save();
    try {
      // Dark translucent backdrop
      ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
      ctx.fillRect(0, 0, screenWidth, screenHeight);

      // Papyrus sheet bounds
      const sheetW = Math.min(screenWidth * 0.85, 750);
      const sheetH = Math.min(screenHeight * 0.85, 750);
      const sheetX = (screenWidth - sheetW) * 0.5;
      const sheetY = (screenHeight - sheetH) * 0.5;

      // Papyrus background
      ctx.fillStyle = '#F4E8C1';
      ctx.fillRect(sheetX, sheetY, sheetW, sheetH);

      // Burnt parchment vignette border
      ctx.strokeStyle = '#7D4E24';
      ctx.lineWidth = 4;
      ctx.strokeRect(sheetX + 6, sheetY + 6, sheetW - 12, sheetH - 12);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sheetX + 12, sheetY + 12, sheetW - 24, sheetH - 24);

      // Classical Inscription Header
      ctx.fillStyle = '#4A235A';
      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('TABULA ARCHITECTONICA DÆDALI — KNOSSOS', sheetX + sheetW * 0.5, sheetY + 36);

      ctx.font = 'italic 11px serif';
      ctx.fillStyle = '#78281F';
      ctx.fillText('"Innumeras errore vias... vixque ipse reverti ad limen potuit."', sheetX + sheetW * 0.5, sheetY + 52);

      // Grid coordinate dimensions
      const margin = 70;
      const mapDrawW = sheetW - margin * 2;
      const mapDrawH = sheetH - margin * 2;
      const tileSize = Math.min(mapDrawW / mapWidth, mapDrawH / mapHeight);
      const mapOffsetX = sheetX + (sheetW - mapWidth * tileSize) * 0.5;
      const mapOffsetY = sheetY + 68 + (mapDrawH - mapHeight * tileSize) * 0.5;

      // Architectural Grid Background
      ctx.strokeStyle = 'rgba(180, 150, 100, 0.35)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= mapWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(mapOffsetX + x * tileSize, mapOffsetY);
        ctx.lineTo(mapOffsetX + x * tileSize, mapOffsetY + mapHeight * tileSize);
        ctx.stroke();
      }
      for (let y = 0; y <= mapHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(mapOffsetX, mapOffsetY + y * tileSize);
        ctx.lineTo(mapOffsetX + mapWidth * tileSize, mapOffsetY + y * tileSize);
        ctx.stroke();
      }

      // Render Map Cells
      for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
          const f = fog[x][y];
          const tx = mapOffsetX + x * tileSize;
          const ty = mapOffsetY + y * tileSize;

          if (f === 0) {
            // Unexplored: subtle sepia wash
            ctx.fillStyle = '#E5D6A7';
            ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
          } else {
            // Explored: clear architecture
            if (map[x][y] === WALL_TYPE.EMPTY) {
              ctx.fillStyle = '#FFFDF5'; // Open corridor
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            } else if (map[x][y] === WALL_TYPE.OBSIDIAN_SANCTUARY) {
              ctx.fillStyle = '#2C3E50'; // Central sanctuary wall
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            } else if (map[x][y] === WALL_TYPE.BRONZE_VAULT_DOOR) {
              ctx.fillStyle = '#E67E22'; // Bronze door
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            } else {
              ctx.fillStyle = '#8C7B65'; // Solid stone wall
              ctx.fillRect(tx, ty, tileSize + 0.5, tileSize + 0.5);
            }
          }
        }
      }

      // Continuous Golden Thread Spline
      this.renderThreadSpline(ctx, thread, mapOffsetX, mapOffsetY, tileSize, 2.5);

      // Relic markers with classical glyphs
      if (dungeon && dungeon.relics) {
        dungeon.relics.forEach(r => {
          if (!r.collected) {
            const rx = mapOffsetX + r.x * tileSize;
            const ry = mapOffsetY + r.y * tileSize;
            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.arc(rx, ry, safeArcRadius(tileSize * 0.45), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2C1B18';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      }

      // Keys
      if (dungeon && dungeon.keys) {
        dungeon.keys.forEach(k => {
          if (!k.collected) {
            const kx = mapOffsetX + k.x * tileSize;
            const ky = mapOffsetY + k.y * tileSize;
            ctx.fillStyle = k.color;
            ctx.fillRect(kx - 3, ky - 3, 6, 6);
          }
        });
      }

      // Minotaur echo
      if (asterion) {
        this.renderMinotaurRadarEcho(ctx, asterion, mapOffsetX, mapOffsetY, tileSize, dungeon);
      }

      // Player marker
      const px = mapOffsetX + player.x * tileSize;
      const py = mapOffsetY + player.y * tileSize;
      ctx.fillStyle = '#A93226';
      ctx.beginPath();
      ctx.arc(px, py, safeArcRadius(tileSize * 0.45), 0, Math.PI * 2);
      ctx.fill();

      // Heading arrow
      ctx.strokeStyle = '#A93226';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + player.dirX * (tileSize * 1.2), py + player.dirY * (tileSize * 1.2));
      ctx.stroke();

      // Close hint footer
      ctx.font = '11px monospace';
      ctx.fillStyle = '#4A235A';
      ctx.textAlign = 'center';
      ctx.fillText('Press [M] to Close Blueprint', sheetX + sheetW * 0.5, sheetY + sheetH - 18);

    } finally {
      ctx.restore();
    }
  }

  /**
   * Renders Ariadne's Golden Thread spline across blueprint coordinates.
   */
  renderThreadSpline(ctx, thread, offsetX, offsetY, tileSize, lineWidth = 1.8) {
    if (!thread || thread.anchors.length < 2) return;
    const pts = thread.getSplinePoints(3);
    if (pts.length < 2) return;

    ctx.save();
    try {
      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(offsetX + pts[0].x * tileSize, offsetY + pts[0].y * tileSize);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(offsetX + pts[i].x * tileSize, offsetY + pts[i].y * tileSize);
      }
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }

  /**
   * Minotaur Proximity Threat Radar Indicator.
   * Emits pulsing crimson shockwave or reveals exact location if Mask of Minos is active.
   */
  renderMinotaurRadarEcho(ctx, asterion, offsetX, offsetY, tileSize, dungeon) {
    const maskActive = dungeon && dungeon.maskActiveTimer > 0;
    const ax = offsetX + asterion.x * tileSize;
    const ay = offsetY + asterion.y * tileSize;

    if (maskActive) {
      // Full reveal: Mask of Minos blessing active!
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(ax, ay, safeArcRadius(tileSize * 0.5), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#C0392B';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (asterion.threatLevel > 0.2) {
      // Threat radar pulse when within hearing or stalking range
      const pulseR = (1 + Math.sin(this.radarPulse)) * 8 + 4;
      const alpha = clamp(asterion.threatLevel * 0.7, 0, 0.85);

      ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax, ay, safeArcRadius(pulseR), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}


// ============================================================================
// SECTION 12: CLASSICAL CANVAS HUD & EPIGRAPHY OVERLAY
// ============================================================================

/**
 * Classical Greco-Roman Canvas HUD Overlay.
 * Renders bronze aegis health/stamina bars, gilded 16-point compass rose,
 * Asterion proximity threat heartbeat ECG pulse meter, 4 sacred relic sockets,
 * and authentic epigraphy citations from Ovid and Pliny the Elder.
 */
export class LabyrinthusHUD {
  constructor() {
    this.citationIndex = 0;
    this.citationTimer = 0;
    this.toastMessage = '';
    this.toastTimer = 0;
    this.ecgPhase = 0;
  }

  showToast(msg, duration = 3.5) {
    this.toastMessage = msg;
    this.toastTimer = duration;
  }

  update(dt) {
    this.citationTimer += dt;
    if (this.citationTimer > 12.0) {
      this.citationTimer = 0;
      this.citationIndex = (this.citationIndex + 1) % CLASSICAL_CITATIONS.length;
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
    }
  }

  render(ctx, width, height, player, dungeon, asterion, thread, timeMs) {
    if (!ctx || width <= 0 || height <= 0) return;

    this.ecgPhase = (timeMs * 0.005) % (Math.PI * 2);

    ctx.save();
    try {
      // 1. Top Status Banner (Title, Relics, Keys, Thread Spool)
      this.renderTopBanner(ctx, width, dungeon, thread);

      // 2. Bottom Left: Classical Health & Stamina Bars
      this.renderVitalsBars(ctx, height, player);

      // 3. Top Right: Gilded 16-Point Compass Rose
      this.renderCompassRose(ctx, width, player);

      // 4. Bottom Right: Asterion Threat Heartbeat ECG Monitor
      if (asterion) {
        this.renderHeartbeatMonitor(ctx, width, height, asterion);
      }

      // 5. Bottom Center: Classical Latin Epigraphy Citation
      this.renderClassicalEpigraphy(ctx, width, height);

      // 6. Toast Notification Banner
      if (this.toastTimer > 0 && this.toastMessage) {
        this.renderToast(ctx, width, height);
      }

      // 7. Full-Screen Dramatic Overlays (Red vignette, golden sheen)
      this.renderScreenOverlays(ctx, width, height, player, asterion);

    } finally {
      ctx.restore();
    }
  }

  /**
   * 1. Top Status Banner.
   */
  renderTopBanner(ctx, width, dungeon, thread) {
    ctx.save();
    try {
      const bannerH = 40;
      // Dark bronze translucent bar
      ctx.fillStyle = 'rgba(15, 12, 11, 0.88)';
      ctx.fillRect(0, 0, width, bannerH);

      // Gilded bottom border line
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, bannerH);
      ctx.lineTo(width, bannerH);
      ctx.stroke();

      const narrow = width < 560;
      // Title on left
      ctx.fillStyle = '#F1C40F';
      ctx.font = `bold ${narrow ? 12 : 15}px serif`;
      ctx.textAlign = 'left';
      ctx.fillText(narrow ? 'LABYRINTHVS' : 'LABYRINTHVS DÆDALI', narrow ? 8 : 16, 24);

      // Relic Sockets in center
      const relicStartX = narrow ? 110 : Math.floor(width * 0.45);
      const relics = dungeon ? dungeon.relics : [];

      for (let i = 0; i < 4; i++) {
        const r = relics[i];
        const isCollected = r && r.collected;
        const rx = relicStartX + i * (narrow ? 22 : 36);
        const ry = 20;

        // Socket medallion circle
        ctx.strokeStyle = isCollected ? '#F1C40F' : '#564536';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = isCollected ? 'rgba(241, 196, 15, 0.25)' : 'rgba(30, 24, 20, 0.6)';
        ctx.beginPath();
        ctx.arc(rx, ry, safeArcRadius(narrow ? 8 : 12), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Relic icon glyph
        if (isCollected) {
          ctx.fillStyle = r.color || '#F1C40F';
          ctx.beginPath();
          ctx.arc(rx, ry, safeArcRadius(narrow ? 4 : 6), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#65503C';
          ctx.font = `${narrow ? 8 : 9}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText((i + 1).toString(), rx, ry + 3);
        }
      }

      // Keys display
      const keyX = relicStartX + (narrow ? 95 : 160);
      if (dungeon && dungeon.keys) {
        dungeon.keys.forEach((k, idx) => {
          if (k.collected) {
            ctx.fillStyle = k.color;
            ctx.beginPath();
            ctx.arc(keyX + idx * (narrow ? 12 : 18), 20, safeArcRadius(narrow ? 3.5 : 5), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Ariadne's Golden Thread Spool remaining
      if (thread) {
        const rem = Math.floor(thread.getRemainingCubits());
        ctx.fillStyle = '#F1C40F';
        ctx.font = `${narrow ? 10 : 12}px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(narrow ? `${rem}c` : `MITOS: ${rem} cubits`, width - 85, 24);
      }

    } finally {
      ctx.restore();
    }
  }

  /**
   * 2. Bottom Left: Health & Stamina Vitals Bars.
   */
  renderVitalsBars(ctx, height, player) {
    ctx.save();
    try {
      const barX = 18;
      const barY = height - 68;
      const barW = 150;
      const barH = 14;

      // Background Box
      ctx.fillStyle = 'rgba(15, 12, 11, 0.82)';
      ctx.fillRect(barX - 6, barY - 6, barW + 56, 56);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 6, barY - 6, barW + 56, 56);

      // Health Bar (Classical Crimson)
      const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
      ctx.fillStyle = '#2C1210';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#C0392B';
      ctx.fillRect(barX, barY, Math.floor(barW * hpRatio), barH);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`HP: ${Math.floor(player.hp)}`, barX + barW + 6, barY + 11);

      // Stamina Bar (Cyan Starlight)
      const stamRatio = clamp(player.stamina / player.maxStamina, 0, 1);
      ctx.fillStyle = '#0E2429';
      ctx.fillRect(barX, barY + 22, barW, barH);
      ctx.fillStyle = '#16A085';
      ctx.fillRect(barX, barY + 22, Math.floor(barW * stamRatio), barH);
      ctx.strokeStyle = '#48C9B0';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY + 22, barW, barH);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`STAM: ${Math.floor(player.stamina)}`, barX + barW + 6, barY + 33);

    } finally {
      ctx.restore();
    }
  }

  /**
   * 3. Top Right: Gilded 16-Point Compass Rose.
   */
  renderCompassRose(ctx, width, player) {
    ctx.save();
    try {
      const cx = width - 42;
      const cy = 20;
      const radius = 15;

      // Player angle in radians
      const angle = Math.atan2(player.dirY, player.dirX);

      ctx.translate(cx, cy);
      ctx.rotate(-angle + Math.PI / 2);

      // Compass Ring
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, safeArcRadius(radius), 0, Math.PI * 2);
      ctx.stroke();

      // North Arrow (Red)
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.moveTo(0, -radius - 4);
      ctx.lineTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.closePath();
      ctx.fill();

      // South Arrow (Gold)
      ctx.fillStyle = '#BDC3C7';
      ctx.beginPath();
      ctx.moveTo(0, radius + 2);
      ctx.lineTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();

    } finally {
      ctx.restore();
    }
  }

  /**
   * 4. Bottom Right: Asterion Threat Heartbeat ECG Monitor.
   */
  renderHeartbeatMonitor(ctx, width, height, asterion) {
    ctx.save();
    try {
      const boxW = 160;
      const boxH = 58;
      const boxX = width - boxW - 18;
      const boxY = height - boxH - 12;

      // Box Background
      ctx.fillStyle = 'rgba(15, 12, 11, 0.85)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = asterion.threatLevel > 0.6 ? '#E74C3C' : '#D4AF37';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Title & BPM Readout
      ctx.fillStyle = asterion.threatLevel > 0.6 ? '#E74C3C' : '#F1C40F';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ASTERION: ${asterion.state}`, boxX + 8, boxY + 14);

      ctx.textAlign = 'right';
      ctx.fillText(`${asterion.heartbeatBpm} BPM`, boxX + boxW - 8, boxY + 14);

      // ECG Waveform Line
      const ecgY = boxY + 34;
      ctx.strokeStyle = asterion.threatLevel > 0.6 ? '#E74C3C' : '#2ECC71';
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      const numPoints = 28;
      for (let i = 0; i < numPoints; i++) {
        const px = boxX + 8 + (i / (numPoints - 1)) * (boxW - 16);
        const waveX = (i / numPoints) * Math.PI * 4 + this.ecgPhase * (asterion.heartbeatBpm / 60);

        // ECG QRS complex spike calculation
        let py = ecgY;
        const phaseMod = (waveX % (Math.PI * 2));
        if (phaseMod > 2.8 && phaseMod < 3.2) {
          py = ecgY - Math.sin((phaseMod - 2.8) * Math.PI / 0.4) * 12 * (asterion.threatLevel + 0.3);
        } else {
          py = ecgY + Math.sin(waveX) * 2;
        }

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Threat Distance in cubits
      ctx.font = '9px monospace';
      ctx.fillStyle = '#BDC3C7';
      ctx.textAlign = 'left';
      const dPaces = Math.floor(asterion.distanceToPlayer * 1.5);
      ctx.fillText(`Distance: ${dPaces} paces`, boxX + 8, boxY + 50);

    } finally {
      ctx.restore();
    }
  }

  /**
   * 5. Bottom Center: Classical Latin Epigraphy Citation.
   */
  renderClassicalEpigraphy(ctx, width, height) {
    if (width < 560) return;
    ctx.save();
    try {
      const cite = CLASSICAL_CITATIONS[this.citationIndex];
      if (!cite) return;

      ctx.fillStyle = 'rgba(241, 196, 15, 0.75)';
      ctx.font = 'italic 11px serif';
      ctx.textAlign = 'center';
      ctx.fillText(`"${cite.latin}"`, width * 0.5, height - 24);

      ctx.fillStyle = 'rgba(213, 219, 219, 0.55)';
      ctx.font = '10px serif';
      ctx.fillText(`— ${cite.source}`, width * 0.5, height - 10);

    } finally {
      ctx.restore();
    }
  }

  /**
   * 6. Toast Notification Banner.
   */
  renderToast(ctx, width, height) {
    ctx.save();
    try {
      const toastY = 56;
      ctx.font = 'bold 13px serif';
      const textW = ctx.measureText(this.toastMessage).width;
      const pad = 24;

      ctx.fillStyle = 'rgba(20, 16, 14, 0.92)';
      ctx.fillRect((width - textW) * 0.5 - pad, toastY, textW + pad * 2, 28);
      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = 1.5;
      ctx.strokeRect((width - textW) * 0.5 - pad, toastY, textW + pad * 2, 28);

      ctx.fillStyle = '#F1C40F';
      ctx.textAlign = 'center';
      ctx.fillText(this.toastMessage, width * 0.5, toastY + 18);

    } finally {
      ctx.restore();
    }
  }

  /**
   * 7. Full-Screen Cinematic Overlays (Damage vignette, charge shake).
   */
  renderScreenOverlays(ctx, width, height, player, asterion) {
    ctx.save();
    try {
      // Crimson Threat Vignette
      if (asterion && asterion.redVignette > 0.01) {
        const radGrad = ctx.createRadialGradient(
          width * 0.5, height * 0.5, width * 0.2,
          width * 0.5, height * 0.5, width * 0.7
        );
        radGrad.addColorStop(0, 'rgba(231, 76, 60, 0)');
        radGrad.addColorStop(1, `rgba(180, 20, 20, ${asterion.redVignette})`);
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      }
    } finally {
      ctx.restore();
    }
  }
}


// ============================================================================
// SECTION 13: SAFE INTERACTIVE DOM CONTROLS & TELEMETRY
// ============================================================================

/**
 * Interactive DOM controls panel and telemetry dashboard.
 * Safe against headless Node.js test suites.
 */
export class LabyrinthusControls {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;
    this.telemetryDiv = null;
    this.init();
  }

  init() {
    if (!this.container || typeof document === 'undefined') return;
    this.container.innerHTML = '';

    const root = document.createElement('div');
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.gap = '12px';
    root.style.padding = '14px';
    root.style.color = '#F4E8C1';
    root.style.fontFamily = 'monospace';
    root.style.fontSize = '12px';
    root.style.backgroundColor = 'rgba(15, 12, 11, 0.95)';
    root.style.border = '1px solid #D4AF37';
    root.style.borderRadius = '4px';

    // Section 1: Maze Architecture & Raycasting
    const sec1 = document.createElement('div');
    sec1.innerHTML = '<strong style="color:#F1C40F; letter-spacing:1px;">DAEDALIAN LABYRINTH CONTROLS</strong>';
    sec1.style.borderBottom = '1px solid rgba(212, 175, 55, 0.3)';
    sec1.style.paddingBottom = '6px';
    root.appendChild(sec1);

    // Maze Size Selector
    const sizeRow = document.createElement('div');
    sizeRow.style.display = 'flex';
    sizeRow.style.justifyContent = 'space-between';
    sizeRow.style.alignItems = 'center';
    sizeRow.innerHTML = '<span>Labyrinth Size:</span>';
    const sizeSelect = document.createElement('select');
    sizeSelect.style.backgroundColor = '#2C1B18';
    sizeSelect.style.color = '#F1C40F';
    sizeSelect.style.border = '1px solid #D4AF37';
    sizeSelect.style.padding = '3px 6px';
    sizeSelect.style.borderRadius = '3px';
    sizeSelect.innerHTML = `
      <option value="16">Cretan Compact (16x16)</option>
      <option value="24" selected>Daedalian Classical (24x24)</option>
      <option value="32">Knossos Monumental (32x32)</option>
    `;
    sizeSelect.onchange = (e) => {
      const v = parseInt(e.target.value);
      if (this.engine) this.engine.setMazeSize(v, v);
    };
    sizeRow.appendChild(sizeSelect);
    root.appendChild(sizeRow);

    // Raycast Detail Selector
    const resRow = document.createElement('div');
    resRow.style.display = 'flex';
    resRow.style.justifyContent = 'space-between';
    resRow.style.alignItems = 'center';
    resRow.innerHTML = '<span>Raycast Detail:</span>';
    const resSelect = document.createElement('select');
    resSelect.style.backgroundColor = '#2C1B18';
    resSelect.style.color = '#F1C40F';
    resSelect.style.border = '1px solid #D4AF37';
    resSelect.style.padding = '3px 6px';
    resSelect.style.borderRadius = '3px';
    resSelect.innerHTML = `
      <option value="1">High (1px step)</option>
      <option value="2" selected>Standard (2px step)</option>
      <option value="4">Retro (4px step)</option>
    `;
    resSelect.onchange = (e) => {
      const v = parseInt(e.target.value);
      if (this.engine && this.engine.raycaster) {
        this.engine.raycaster.setResolution(v);
      }
    };
    resRow.appendChild(resSelect);
    root.appendChild(resRow);

    // Sliders Container
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.flexDirection = 'column';
    sliderContainer.style.gap = '8px';

    // FOV Slider
    sliderContainer.appendChild(this.createSlider('Field of View:', 60, 90, 72, 1, '°', (v) => {
      if (this.engine) this.engine.setFov(v);
    }));

    // Torch Radius Slider
    sliderContainer.appendChild(this.createSlider('Torch Radius:', 4, 14, 8, 0.5, ' tiles', (v) => {
      if (this.engine && this.engine.raycaster) this.engine.raycaster.setTorchRadius(v);
    }));

    // Minotaur Stalk Speed Slider
    sliderContainer.appendChild(this.createSlider('Minotaur Speed:', 1.0, 4.0, 2.4, 0.2, 'x', (v) => {
      if (this.engine && this.engine.asterion) this.engine.asterion.stalkSpeed = v;
    }));

    // Ariadne Thread Glow Slider
    sliderContainer.appendChild(this.createSlider('Thread Luminescence:', 0.2, 2.0, 1.0, 0.1, '', (v) => {
      if (this.engine && this.engine.thread) this.engine.thread.glowLuminance = v;
    }));

    // Master Volume Slider
    sliderContainer.appendChild(this.createSlider('Master Volume:', 0, 1, 0.8, 0.05, '', (v) => {
      if (this.engine && this.engine.audio) this.engine.audio.setMasterVolume(v);
    }));

    root.appendChild(sliderContainer);

    // Action Buttons Grid
    const btnGrid = document.createElement('div');
    btnGrid.style.display = 'grid';
    btnGrid.style.gridTemplateColumns = '1fr 1fr';
    btnGrid.style.gap = '6px';
    btnGrid.style.marginTop = '4px';

    btnGrid.appendChild(this.createButton('Unspool Thread', () => {
      if (this.engine && this.engine.thread) {
        const active = this.engine.thread.toggleDeploying();
        if (this.engine.hud) this.engine.hud.showToast(active ? 'Thread Unspooling Resumed' : 'Thread Spool Paused');
      }
    }));

    btnGrid.appendChild(this.createButton('Ring Bronze Gong', () => {
      if (this.engine) this.engine.ringGong();
    }));

    btnGrid.appendChild(this.createButton('Reveal Blueprint (M)', () => {
      if (this.engine && this.engine.blueprint) this.engine.blueprint.toggleFullScreen();
    }));

    btnGrid.appendChild(this.createButton('Drop Stone (Space)', () => {
      if (this.engine) this.engine.dropBreadcrumb();
    }));

    btnGrid.appendChild(this.createButton('Teleport Sanctuary', () => {
      if (this.engine) this.engine.teleportToSanctuary();
    }));

    btnGrid.appendChild(this.createButton('Reset Labyrinth', () => {
      if (this.engine) this.engine.reset();
    }));

    root.appendChild(btnGrid);

    // Realtime Telemetry Readout
    this.telemetryDiv = document.createElement('div');
    this.telemetryDiv.style.marginTop = '8px';
    this.telemetryDiv.style.padding = '8px';
    this.telemetryDiv.style.backgroundColor = 'rgba(20, 15, 12, 0.8)';
    this.telemetryDiv.style.border = '1px solid rgba(212, 175, 55, 0.2)';
    this.telemetryDiv.style.fontSize = '10px';
    this.telemetryDiv.style.lineHeight = '1.4';
    this.telemetryDiv.innerHTML = 'Initializing telemetry...';
    root.appendChild(this.telemetryDiv);

    this.container.appendChild(root);
  }

  createSlider(label, min, max, val, step, unit, onChange) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    const lbl = document.createElement('span');
    lbl.innerText = label;

    const control = document.createElement('div');
    control.style.display = 'flex';
    control.style.alignItems = 'center';
    control.style.gap = '6px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = val;
    slider.step = step;
    slider.style.width = '80px';

    const valDisplay = document.createElement('span');
    valDisplay.style.width = '45px';
    valDisplay.style.textAlign = 'right';
    valDisplay.innerText = `${val}${unit}`;

    slider.oninput = (e) => {
      const v = parseFloat(e.target.value);
      valDisplay.innerText = `${v}${unit}`;
      onChange(v);
    };

    control.appendChild(slider);
    control.appendChild(valDisplay);
    row.appendChild(lbl);
    row.appendChild(control);
    return row;
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.style.backgroundColor = '#2C1B18';
    btn.style.color = '#F1C40F';
    btn.style.border = '1px solid #D4AF37';
    btn.style.padding = '6px 8px';
    btn.style.borderRadius = '3px';
    btn.style.cursor = 'pointer';
    btn.style.fontFamily = 'monospace';
    btn.style.fontSize = '10px';
    btn.style.fontWeight = 'bold';
    btn.onmouseover = () => { btn.style.backgroundColor = '#4A235A'; };
    btn.onmouseout = () => { btn.style.backgroundColor = '#2C1B18'; };
    btn.onclick = onClick;
    return btn;
  }

  updateTelemetry(fps, player, asterion, dungeon, thread) {
    if (!this.telemetryDiv) return;
    const px = player.x.toFixed(1);
    const py = player.y.toFixed(1);
    const heading = ((Math.atan2(player.dirY, player.dirX) * 180 / Math.PI + 360) % 360).toFixed(0);
    const minoState = asterion ? asterion.state : 'UNKNOWN';
    const minoDist = asterion ? Math.floor(asterion.distanceToPlayer * 1.5) : 0;
    const relics = dungeon ? dungeon.relicsCollectedCount : 0;
    const remThread = thread ? Math.floor(thread.getRemainingCubits()) : 0;

    this.telemetryDiv.innerHTML = `
      <strong>FPS:</strong> ${fps} | <strong>POS:</strong> [${px}, ${py}] | <strong>DIR:</strong> ${heading}°<br>
      <strong>ASTERION:</strong> <span style="color:#E74C3C">${minoState}</span> (${minoDist} paces)<br>
      <strong>RELICS:</strong> ${relics}/4 | <strong>THREAD:</strong> ${remThread} cubits
    `;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}


// ============================================================================
// SECTION 14: MAIN ENGINE CLASS (LABYRINTHUS ENGINE)
// ============================================================================

/**
 * Monumental Labyrinthus Engine for Pliny Game Lab.
 * Complete first-person 3D raycasting catacomb simulation with autonomous Minotaur AI,
 * Ariadne's Golden Thread corner physics, 4 sacred Minoan relics, and parchment blueprint.
 */
export class LabyrinthusEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Maze Dimensions
    this.mapWidth = 24;
    this.mapHeight = 24;

    // Audio Engine
    this.audio = new LabyrinthusAudioEngine();

    // Procedural Texture Atlas
    this.textureAtlas = new MinoanTextureAtlas(64);

    // Navigation & Scent Grid
    this.navGrid = new LabyrinthNavGrid(this.mapWidth, this.mapHeight);

    // Labyrinth Builder
    this.builder = new DaedalianLabyrinthBuilder(this.mapWidth, this.mapHeight);

    // Ariadne's Golden Thread System
    this.thread = new AriadneThreadSystem(250);

    // Particle FX System
    this.particles = new LabyrinthusParticleSystem();

    // Dungeon & Relics Manager
    this.dungeon = new LabyrinthusDungeonManager();

    // Raycaster Engine
    this.raycaster = new LabyrinthusRaycaster(this.textureAtlas);

    // Blueprint Minimap & Radar
    this.blueprint = new ParchmentBlueprintRenderer();

    // Canvas HUD & Epigraphy
    this.hud = new LabyrinthusHUD();

    // Player State
    this.player = {
      x: 1.5,
      y: 1.5,
      dirX: 1,
      dirY: 0,
      planeX: 0,
      planeY: 0.66, // Corresponds to ~72 degree FOV
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      sprintSpeedMultiplier: 1.0,
      bobPhase: 0,
      bobAmp: 6,
      pitchOffset: 0,
      isSprinting: false,
      stepTimer: 0
    };

    // Asterion the Minotaur AI Entity
    this.asterion = new AsterionEntity(12.5, 12.5);

    // Input States
    this.keys = {};
    this.mouse = { isDown: false, lastX: 0, lastY: 0 };

    // Timing & Performance telemetry
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : 0;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    // Build initial Labyrinth
    this.generateLabyrinth();

    // Initialize DOM Controls
    this.controls = new LabyrinthusControls(this.controlsContainer, this);

    // Setup first-click audio initialization listener
    if (this.canvas && this.canvas.addEventListener) {
      this.clickListener = () => {
        this.audio.init();
        this.audio.startAmbience();
      };
      this.canvas.addEventListener('click', this.clickListener, { once: true });
    }
    attachTouchBridge(this, canvas);
  }

  /**
   * Generates or regenerates the Daedalian Labyrinth.
   */
  generateLabyrinth() {
    this.navGrid.resize(this.mapWidth, this.mapHeight);
    this.builder.width = this.mapWidth;
    this.builder.height = this.mapHeight;

    const data = this.builder.generate();
    this.map = data.map;
    this.fog = data.fog;

    // Load into NavGrid
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        this.navGrid.setCell(x, y, this.map[x][y]);
      }
    }

    // Initialize Dungeon Manager (Relics, Keys, Vault Doors)
    this.dungeon.init(data);

    // Position Player at Entrance
    this.player.x = 1.5;
    this.player.y = 1.5;
    this.player.dirX = 1;
    this.player.dirY = 0;
    this.player.planeX = 0;
    this.player.planeY = 0.66;
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;

    // Position Asterion in the Central Sanctuary Tholos
    this.asterion.reset(data.sanctuary.cx, data.sanctuary.cy);
    this.sanctuary = data.sanctuary;

    // Reset Ariadne's Golden Thread
    this.thread.reset(this.player.x, this.player.y);

    // Reset Particles
    this.particles.reset();

    // Initial Fog-of-War reveal
    this.blueprint.updateFogOfWar(this.fog, this.player.x, this.player.y, this.mapWidth, this.mapHeight, this.navGrid, 7);

    if (this.hud) {
      this.hud.showToast('Enter the Labyrinth of Daedalus. Beware Asterion.');
    }
  }

  setMazeSize(width, height) {
    this.mapWidth = clamp(width, 16, 48);
    this.mapHeight = clamp(height, 16, 48);
    this.generateLabyrinth();
  }

  setFov(deg) {
    this.raycaster.setFov(deg);
    const rad = (deg * Math.PI) / 180;
    const planeLen = Math.tan(rad * 0.5);
    // Recalculate camera plane vector perpendicular to direction
    this.player.planeX = -this.player.dirY * planeLen;
    this.player.planeY = this.player.dirX * planeLen;
  }

  ringGong() {
    if (this.sanctuary) {
      this.dungeon.strikeGong(this.sanctuary.cx, this.sanctuary.cy, this.asterion, this.navGrid, this.particles, this.audio);
      if (this.hud) this.hud.showToast('Bronze Gong Struck! Asterion is Drawn to the Sanctuary.');
    }
  }

  dropBreadcrumb() {
    this.dungeon.dropBreadcrumb(this.player.x, this.player.y, this.navGrid, this.particles, this.audio);
    if (this.hud) this.hud.showToast('Marble Breadcrumb Stone Dropped.');
  }

  teleportToSanctuary() {
    if (this.sanctuary) {
      this.player.x = this.sanctuary.cx;
      this.player.y = this.sanctuary.cy + 1.2;
      this.asterion.wakeUp('teleport', this.audio);
      if (this.hud) this.hud.showToast('Teleported to the Inner Sanctuary Tholos!');
    }
  }

  // Alias for backward compatibility
  castSpell() {
    this.dropBreadcrumb();
  }

  /**
   * Resizes viewport dimensions.
   */
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  /**
   * Main Simulation Update loop.
   */
  update(dt) {
    const safeDt = clamp(dt, 0.001, 0.1);

    // Frame rate telemetry calculation
    this.frameCount++;
    this.fpsTimer += safeDt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      if (this.controls) {
        this.controls.updateTelemetry(this.fps, this.player, this.asterion, this.dungeon, this.thread);
      }
    }

    // 1. Player Movement & Rotation Physics
    this.updatePlayerMovement(safeDt);

    // 2. Deposit Scent into Navigation Grid
    this.navGrid.depositScent(this.player.x, this.player.y, safeDt * 2.0);
    this.navGrid.update(safeDt);

    // 3. Ariadne's Golden Thread Corner Tracking
    this.thread.update(this.player.x, this.player.y, this.navGrid, this.audio);

    // 4. Update Asterion AI Entity
    this.asterion.update(safeDt, this.player, this.navGrid, this.particles.particles, this.audio);

    // 5. Update Relics, Keys, Vault Doors & Breadcrumbs
    this.dungeon.update(safeDt, this.player, this.navGrid, this.particles, this.audio, (msg) => {
      if (this.hud) this.hud.showToast(msg);
    });

    // 6. Update Particle FX System
    this.particles.update(safeDt);

    // 7. Update Fog-of-War Vision
    this.blueprint.updateFogOfWar(this.fog, this.player.x, this.player.y, this.mapWidth, this.mapHeight, this.navGrid, 7.5);

    // 8. Update HUD Epigraphy & Toasts
    this.hud.update(safeDt);

    // 9. Respawn / Reset if player falls to Asterion
    if (this.player.hp <= 0) {
      if (this.hud) this.hud.showToast('Slain by Asterion! Reawakening at the Threshold...');
      this.reset();
    }
  }

  /**
   * First-person movement, inertia, and head-bobbing.
   */
  updatePlayerMovement(dt) {
    const isSprintKey = !!(this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright']);
    const canSprint = isSprintKey && this.player.stamina > 5;
    this.player.isSprinting = canSprint;

    // Stamina depletion / recovery
    if (canSprint && (this.keys['w'] || this.keys['s'] || this.keys['arrowup'] || this.keys['arrowdown'])) {
      this.player.stamina = Math.max(0, this.player.stamina - dt * 25.0);
    } else {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + dt * 15.0);
    }

    const baseMoveSpeed = canSprint ? (4.8 * this.player.sprintSpeedMultiplier) : 3.0;
    const moveSpeed = baseMoveSpeed * dt;
    const rotSpeed = 2.4 * dt;

    let moved = false;
    let dx = 0;
    let dy = 0;

    // Forward / Backward
    if (this.keys['w'] || this.keys['arrowup']) {
      dx += this.player.dirX * moveSpeed;
      dy += this.player.dirY * moveSpeed;
      moved = true;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      dx -= this.player.dirX * moveSpeed;
      dy -= this.player.dirY * moveSpeed;
      moved = true;
    }

    // Strafing Left (Q) / Right (E)
    if (this.keys['q']) {
      dx += this.player.dirY * moveSpeed;
      dy -= this.player.dirX * moveSpeed;
      moved = true;
    }
    if (this.keys['e']) {
      dx -= this.player.dirY * moveSpeed;
      dy += this.player.dirX * moveSpeed;
      moved = true;
    }

    // Sliding Wall Collision Detection
    if (moved) {
      const margin = 0.25;
      const targetX = this.player.x + dx;
      const targetY = this.player.y + dy;

      // X collision
      const checkX = dx > 0 ? targetX + margin : targetX - margin;
      if (this.navGrid.isWalkable(Math.floor(checkX), Math.floor(this.player.y))) {
        this.player.x = targetX;
      }

      // Y collision
      const checkY = dy > 0 ? targetY + margin : targetY - margin;
      if (this.navGrid.isWalkable(Math.floor(this.player.x), Math.floor(checkY))) {
        this.player.y = targetY;
      }

      // Head-bobbing cycle
      this.player.bobPhase += dt * (canSprint ? 16.0 : 10.0);
      this.player.pitchOffset = Math.sin(this.player.bobPhase) * (canSprint ? 9 : 5);

      // Footstep sound
      this.player.stepTimer += dt;
      if (this.player.stepTimer > (canSprint ? 0.28 : 0.45)) {
        this.player.stepTimer = 0;
        // If feather wings active, footsteps are completely silent
        if (!this.dungeon.wingsActive) {
          this.audio.playFootstep(canSprint);
          this.navGrid.emitSound(this.player.x, this.player.y, canSprint ? 1.4 : 0.6, canSprint ? 10.0 : 5.0);
        }
      }
    } else {
      // Settle head bob when idle
      this.player.pitchOffset = lerp(this.player.pitchOffset, 0, dt * 10.0);
    }

    // Turning Counter-Clockwise (A / ArrowLeft)
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.rotatePlayer(rotSpeed);
    }

    // Turning Clockwise (D / ArrowRight)
    if (this.keys['d'] || this.keys['arrowright']) {
      this.rotatePlayer(-rotSpeed);
    }
  }

  rotatePlayer(angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const oldDirX = this.player.dirX;
    this.player.dirX = this.player.dirX * cosA - this.player.dirY * sinA;
    this.player.dirY = oldDirX * sinA + this.player.dirY * cosA;

    const oldPlaneX = this.player.planeX;
    this.player.planeX = this.player.planeX * cosA - this.player.planeY * sinA;
    this.player.planeY = oldPlaneX * sinA + this.player.planeY * cosA;
  }

  /**
   * Main Render Pass.
   */
  render(ctx = this.ctx) {
    if (!ctx) return;
    const timeMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    ctx.save();
    try {
      // Apply Minotaur charge screen shake
      if (this.asterion && this.asterion.screenShake > 0.01) {
        const shakeMag = this.asterion.screenShake * 12;
        const sx = (Math.random() * 2 - 1) * shakeMag;
        const sy = (Math.random() * 2 - 1) * shakeMag;
        ctx.translate(Math.floor(sx), Math.floor(sy));
      }

      // 1. Raycast 3D Scene
      this.raycaster.render(
        ctx,
        this.width,
        this.height,
        this.player,
        this.navGrid,
        this.dungeon,
        this.asterion,
        this.thread,
        this.particles,
        timeMs
      );

      // 2. Blueprint Minimap & Threat Radar and 3. Classical Canvas HUD & Epigraphy
      ctx.save();
      const ui = this.uiScale();
      ctx.scale(ui, ui);
      const sw = this.width / ui;
      const sh = this.height / ui;

      this.blueprint.render(
        ctx,
        sw,
        sh,
        this.map,
        this.fog,
        this.mapWidth,
        this.mapHeight,
        this.player,
        this.dungeon,
        this.asterion,
        this.thread,
        timeMs
      );

      this.hud.render(
        ctx,
        sw,
        sh,
        this.player,
        this.dungeon,
        this.asterion,
        this.thread,
        timeMs
      );
      ctx.restore();

    } finally {
      ctx.restore();
    }
  }

  /**
   * Returns active entity count (must be positive integer for test suites).
   */
  getEntityCount() {
    let count = 1; // Asterion the Minotaur
    if (this.dungeon) {
      count += this.dungeon.relics.length;
      count += this.dungeon.keys.length;
      count += this.dungeon.vaultDoors.length;
      count += this.dungeon.breadcrumbs.length;
    }
    if (this.particles) {
      count += this.particles.particles.length;
    }
    if (this.thread) {
      count += this.thread.anchors.length;
    }
    return count;
  }

  reset() {
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.generateLabyrinth();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.clickListener && this.canvas && this.canvas.removeEventListener) {
      this.canvas.removeEventListener('click', this.clickListener);
    }
    if (this.audio) {
      this.audio.destroy();
    }
    if (this.controls) {
      this.controls.destroy();
    }
  }

  // ==========================================================================
  // INPUT EVENT HANDLERS
  // ==========================================================================

  onKeyDown(key, e) {
    if (!key) return;
    const k = key.toLowerCase();
    this.keys[k] = true;

    // Toggle blueprint map
    if (k === 'm') {
      this.blueprint.toggleFullScreen();
    }

    // Drop breadcrumb stone
    if (key === ' ' || k === 'space') {
      if (!this.keys['space_lock']) {
        this.keys['space_lock'] = true;
        this.dropBreadcrumb();
      }
    }

    // Strike bronze gong
    if (k === 'g') {
      this.ringGong();
    }

    // Toggle thread unspooling
    if (k === 't') {
      const active = this.thread.toggleDeploying();
      this.hud.showToast(active ? 'Thread Unspooling Resumed' : 'Thread Spool Paused');
    }

    // Prevent scrolling for game controls
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      if (e && e.preventDefault) e.preventDefault();
    }
  }

  onKeyUp(key, e) {
    if (!key) return;
    const k = key.toLowerCase();
    this.keys[k] = false;
    if (key === ' ' || k === 'space') {
      this.keys['space_lock'] = false;
    }
  }

  onMouseDown(pos) {
    this.mouse.isDown = true;
    this.mouse.lastX = pos.x;
    this.mouse.lastY = pos.y;
    // Single click drops breadcrumb or wakes audio
    this.audio.init();
  }

  onMouseMove(pos) {
    if (this.mouse.isDown) {
      const dx = pos.x - this.mouse.lastX;
      // Mouse drag rotation
      const rotSpeed = -dx * 0.005;
      this.rotatePlayer(rotSpeed);
      this.mouse.lastX = pos.x;
      this.mouse.lastY = pos.y;
    }
  }

  onMouseUp(pos) {
    this.mouse.isDown = false;
  }
}


