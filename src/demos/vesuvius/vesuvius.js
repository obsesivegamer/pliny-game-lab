/**
 * ============================================================================
 * PLINY GAME LAB — MONUMENTAL SIMULATION ENGINE
 * DEMO: VESUVIUS (Volcanology & Thermodynamic Cellular Automata)
 * PAVILION I: IGNIS & TERRA (Earth & Fire)
 * ============================================================================
 *
 * "Petis ut tibi avunculi mei exitum scribam, quo verius tradere posteris possis...
 *  Erat Miseni classemque imperio praesens regebat. Nonum kal. Septembres hora fere
 *  septima mater mea indicat ei apparere nubem inusitata et magnitudine et specie.
 *  Nubes oriebatur, cuius similitudinem et formam non alia magis arbor quam pinus expresserit.
 *  Nam longissimo velut trunco elata in altum quibusdam ramis diffundebatur, credo quia
 *  recenti spiritu evecta, deinde senescente eo destituta aut etiam pondere suo victa
 *  in latitudinem vanescebat, candida interdum, interdum sordida et maculosa, prout terram
 *  cineremve sustulerat."
 *  — C. Plinius Caecilius Secundus (Pliny the Younger), Epistulae VI.16 (Ad Tacitum)
 *
 * "Iam navibus cinis incidebat, calidior et densior, quo propius accederent;
 *  iam pumices etiam nigrique et ambusti et fracti igne lapides; iam vadum subitum
 *  ruinaque montis litora obstantia. Cunctatus paulum an retro flecteret, mox
 *  gubernatori ut ita faceret monenti 'Fortes' inquit 'fortuna iuvat: Pomponianum pete!'
 *  Stabiis erat diremptus sinu medio... Ibi decretum in litore perstare et mare ex proximo
 *  aspicere, ecquid iam admitteret; quod adhuc vastum et adversum permanebat.
 *  Ibi super abiectum linteum recubans semel atque iterum frigidam aquam poposcit hausitque.
 *  Deinde flammae flammarumque praenuntius odor sulfuris alios in fugam vertunt, excitant illum."
 *  — C. Plinius Caecilius Secundus, Epistulae VI.16
 *
 * "Respicio: tergo caligo densa imminebat, quae nos torrentis modo infusa terrae sequebatur...
 *  Vix consideramus, et nox — non qualis illunis aut nubila, sed qualis in locis clausis lumine
 *  extincto. Audires ululatus feminarum, infantum quiritatus, clamores virorum; alii parentes,
 *  alii liberos, alii coniuges vocibus requirebant, vocibus noscitabant; hi suum casum, illi
 *  suorum miserabantur; erant qui metu mortis mortem precarentur; multi ad deos manus tollere,
 *  plures nusquam iam deos ullos aeternamque illam et novissimam noctem mundo interpretabantur."
 *  — C. Plinius Caecilius Secundus, Epistulae VI.20
 *
 * ============================================================================
 * ARCHITECTURAL SPECIFICATION & SCIENTIFIC PRINCIPLES:
 *
 * 1. DUAL-LAYER MULTIPHYSICS ARCHITECTURE:
 *    - Layer A: Thermodynamic Cellular Automata (CA) Grid:
 *      * 280 x 180 fine-grained physical lattice (50,400 active cells).
 *      * 13 elemental states: EMPTY, STONE, BASALT, SAND, PUMICE, LAVA,
 *        MAGMA_CORE, WATER, STEAM, FIRE, SMOKE, ASH, SULFUR_GAS.
 *      * Discrete Fourier heat diffusion: dT/dt = alpha * laplacian(T).
 *      * Phreatomagmatic explosions: instantaneous phase transition of water to steam
 *        with 1600x volume expansion upon contact with molten lava (T > 100°C).
 *      * Granular physics with angle of repose, viscous liquid dynamics, and
 *        buoyant gas convection.
 *      * Porous Pumice physics: pumice density (~620 kg/m³) is less than water (~1000 kg/m³),
 *        causing vast floating pumice rafts in the Bay of Naples as recorded by Pliny.
 *
 *    - Layer B: High-Precision Kinematic & Particle Physics:
 *      * Volcanic Bombs (Tephra): Ballistic projectiles with quadratic aerodynamic drag:
 *        F_drag = 0.5 * Cd * rho_air * A * v^2, incandescent thermal cooling,
 *        rotational spin, and explosive impact cratering.
 *      * Pyroclastic Density Currents (PDCs / Nuées Ardentes): Ground-hugging fluidized
 *        avalanches following mountain slope elevation vectors, reaching supersonic speeds,
 *        incinerating settlements, and depositing ignimbrite ash layers.
 *      * Convective Plinian Plume: 3-stage atmospheric eruption column:
 *        1) Momentum gas jet, 2) Convective thermal buoyancy rise (up to 33 km),
 *        3) Lateral stratospheric spreading into the iconic Umbrella Pine (Pinus pinea) canopy.
 *      * Volcanic Lightning (Triboelectric discharge): Stochastic fractal branching arcs
 *        between electrostatic ash clouds with full-screen atmospheric corona illumination.
 *      * Acoustic Shockwaves: Spherical Mach shockfronts displacing ash, particles, and air.
 *      * Roman Naval Evacuation Fleet: Authentic Classis Misenensis quadriremes and liburnians
 *        commanded by Pliny the Elder, with animated rowing sweeps, deck pumice clearing,
 *        historical Latin speech quotes, and citizen rescue mechanics.
 *
 * 2. VOLCANOLOGICAL ERUPTION PHASES (VEI 0 TO VEI 5+):
 *    - Phase 0: DORMANT (Mild geothermal fumaroles, peaceful Bay of Naples, olive groves).
 *    - Phase 1: SEISMIC TREMOR (Ground fissures open, harmonic tremors, sulfur venting).
 *    - Phase 2: PHREATOMAGMATIC (Groundwater aquifer breach, violent steam-ash blasts).
 *    - Phase 3: SUB-PLINIAN COLUMN (Continuous eruptive column reaching 15 km troposphere).
 *    - Phase 4: ULTRA-PLINIAN CLIMAX (Umbrella Pine spreading to 30+ km, massive pumice fall).
 *    - Phase 5: COLUMN COLLAPSE & PDCs (Fatal collapse of convective column, superheated surges).
 *    - Phase 6: CALDERA COLLAPSE (Catastrophic structural failure of Mount Somma rim).
 *
 * 3. REAL-TIME TELEMETRY & SEISMOLOGY:
 *    - Rolling seismograph with P-wave, S-wave, and harmonic tremor recording.
 *    - VEI index meter, plume height gauge, mass eruption rate (kg/s), and magma pressure.
 *    - Eyewitness Latin text scrolls with English translations from Pliny's letters.
 *
 * 4. PURE ES MODULE — ZERO EXTERNAL DEPENDENCIES — STRICT BROWSER & HEADLESS SAFETY.
 * ============================================================================
 */

// ============================================================================
// SECTION 1: SIMULATION CONSTANTS, ELEMENT TAXONOMY & THERMODYNAMICS
// ============================================================================

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';
import {
  MODE,
  STATUS,
  LOSE_REASON,
  TOOL,
  MISSION_NUMBERS,
  OBJECTIVE,
  READABILITY,
  createMission,
  scheduledPhase,
  tryVent,
  trySpendBarrier,
  applyWorldHazards,
  resolveMission,
  threatMeter,
  clampShipX,
  pdcHitsX,
  galleyDrawScale,
  missionWorldView,
  missionQuota,
  missionCoachCopy
} from './mission.js';

export { MODE, STATUS, TOOL, LOSE_REASON };

// ---------------------------------------------------------------------------
// Fixed-step simulation timing constants
// ---------------------------------------------------------------------------
const SIM_FIXED_DT = 1 / 60;            // 16.667 ms fixed step
const SIM_MAX_ADMITTED_DT = 0.1;         // cap outer dt from hub
const SIM_MAX_STEPS_PER_UPDATE = 6;      // bounded catch-up (6 × 1/60 = 0.1 s)
const SIM_STEP_EPSILON = 1e-9;           // floating-point tolerance at step boundary

// Export for tests only — not part of the public gameplay API
export { SIM_FIXED_DT, SIM_MAX_STEPS_PER_UPDATE };

// ---------------------------------------------------------------------------
// Deterministic simulation PRNG (mulberry32)
// Isolates simulation randomness from render-time Math.random() calls so that
// different render counts between updates cannot shift the simulated result.
// Normal play seeds from Math.random(); tests can override via _setSeed().
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ELEMENT = {
  EMPTY: 0,
  STONE: 1,
  BASALT: 2,
  SAND: 3,
  PUMICE: 4,
  LAVA: 5,
  MAGMA_CORE: 6,
  WATER: 7,
  STEAM: 8,
  FIRE: 9,
  SMOKE: 10,
  ASH: 11,
  SULFUR_GAS: 12
};

export const ELEMENT_NAMES = [
  'Empty (Atmosphere)',
  'Stone (Country Rock)',
  'Basalt (Cooled Lava)',
  'Sand (Granular Sediment)',
  'Pumice (Poriferous Tephra)',
  'Lava (Molten Silicate)',
  'Magma Core (Plutonic Reservoir)',
  'Water (Bay & Aquifers)',
  'Steam (Superheated Vapor)',
  'Fire (Thermal Combustion)',
  'Smoke (Volcanic Aerosol)',
  'Ash (Fine Silicate Tephra)',
  'Sulfur Gas (SO₂ / H₂S Fumarole)'
];

/**
 * Elemental physical properties table:
 * density: kg/m^3 (used for buoyancy, sedimentation, and floating)
 * thermalDiff: thermal diffusivity alpha in m^2/s
 * baseTemp: standard ambient equilibrium temperature in °C
 * viscosity: fluid internal resistance to shear flow (higher = more sluggish)
 * solid: boolean flag for rigid / granular solids
 * albedo: reflectivity coefficient for light scattering
 */
export const ELEMENT_PROPS = {
  [ELEMENT.EMPTY]: {
    density: 1.225,
    thermalDiff: 0.05,
    baseTemp: 20,
    viscosity: 0,
    solid: false,
    albedo: 0.02
  },
  [ELEMENT.STONE]: {
    density: 2650,
    thermalDiff: 0.08,
    baseTemp: 22,
    viscosity: 1000,
    solid: true,
    albedo: 0.25
  },
  [ELEMENT.BASALT]: {
    density: 2900,
    thermalDiff: 0.12,
    baseTemp: 35,
    viscosity: 1000,
    solid: true,
    albedo: 0.12
  },
  [ELEMENT.SAND]: {
    density: 1600,
    thermalDiff: 0.06,
    baseTemp: 22,
    viscosity: 80,
    solid: true,
    albedo: 0.40
  },
  [ELEMENT.PUMICE]: {
    density: 620, // Critically: less than water (1000 kg/m3) -> floats on water!
    thermalDiff: 0.04,
    baseTemp: 180,
    viscosity: 40,
    solid: true,
    albedo: 0.55
  },
  [ELEMENT.LAVA]: {
    density: 2450,
    thermalDiff: 0.28,
    baseTemp: 1050,
    viscosity: 12,
    solid: false,
    albedo: 0.85
  },
  [ELEMENT.MAGMA_CORE]: {
    density: 2800,
    thermalDiff: 0.45,
    baseTemp: 1350,
    viscosity: 5,
    solid: true,
    albedo: 0.95
  },
  [ELEMENT.WATER]: {
    density: 1000,
    thermalDiff: 0.14,
    baseTemp: 18,
    viscosity: 1,
    solid: false,
    albedo: 0.08
  },
  [ELEMENT.STEAM]: {
    density: 0.59,
    thermalDiff: 0.22,
    baseTemp: 140,
    viscosity: 0.5,
    solid: false,
    albedo: 0.70
  },
  [ELEMENT.FIRE]: {
    density: 0.25,
    thermalDiff: 0.60,
    baseTemp: 1100,
    viscosity: 0.1,
    solid: false,
    albedo: 1.00
  },
  [ELEMENT.SMOKE]: {
    density: 0.85,
    thermalDiff: 0.10,
    baseTemp: 75,
    viscosity: 0.8,
    solid: false,
    albedo: 0.20
  },
  [ELEMENT.ASH]: {
    density: 1150,
    thermalDiff: 0.07,
    baseTemp: 60,
    viscosity: 50,
    solid: true,
    albedo: 0.30
  },
  [ELEMENT.SULFUR_GAS]: {
    density: 1.88, // Heavier than air at STP -> sinks into low valleys unless superheated
    thermalDiff: 0.15,
    baseTemp: 90,
    viscosity: 0.9,
    solid: false,
    albedo: 0.45
  }
};

/**
 * 8-bit RGBA color palette for cellular automata rendering
 */
export const PALETTE = {
  [ELEMENT.EMPTY]: [12, 14, 22, 255],
  [ELEMENT.STONE]: [75, 78, 88, 255],
  [ELEMENT.BASALT]: [42, 44, 52, 255],
  [ELEMENT.SAND]: [198, 172, 108, 255],
  [ELEMENT.PUMICE]: [214, 204, 182, 255],
  [ELEMENT.LAVA]: [255, 76, 12, 255],
  [ELEMENT.MAGMA_CORE]: [255, 28, 0, 255],
  [ELEMENT.WATER]: [34, 118, 210, 220],
  [ELEMENT.STEAM]: [212, 226, 245, 140],
  [ELEMENT.FIRE]: [255, 204, 32, 245],
  [ELEMENT.SMOKE]: [44, 42, 48, 200],
  [ELEMENT.ASH]: [130, 126, 132, 230],
  [ELEMENT.SULFUR_GAS]: [186, 205, 52, 170]
};

// ============================================================================
// SECTION 2: ERUPTION PHASES & HISTORICAL EYEWITNESS CHRONICLES
// ============================================================================

export const PHASE = {
  DORMANT: 0,
  SEISMIC_TREMOR: 1,
  PHREATOMAGMATIC: 2,
  SUB_PLINIAN: 3,
  ULTRA_PLINIAN: 4,
  COLUMN_COLLAPSE: 5,
  CALDERA_COLLAPSE: 6
};

export const PHASE_CONFIG = [
  {
    id: PHASE.DORMANT,
    name: 'Dormant (Quiet Geothermal)',
    latin: 'Mons Vesuvius Tacitus',
    vei: 0,
    plumeTargetKm: 0.5,
    massRateKgS: 0,
    seismicTremor: 0.05,
    lightningRate: 0,
    bombRate: 0,
    pdcActive: false,
    skyDarkness: 0.0,
    excerpt: 'Antecedebat per multos dies tremor terrae, minus formidolosus quia Campaniae solitus.'
  },
  {
    id: PHASE.SEISMIC_TREMOR,
    name: 'Seismic Precursor Tremors',
    latin: 'Terrae Motus Campanus',
    vei: 1,
    plumeTargetKm: 2.0,
    massRateKgS: 5e4,
    seismicTremor: 0.38,
    lightningRate: 0,
    bombRate: 0.2,
    pdcActive: false,
    skyDarkness: 0.15,
    excerpt: 'Illa vero nocte ita invaluit, ut non moveri omnia sed verti crederentur.'
  },
  {
    id: PHASE.PHREATOMAGMATIC,
    name: 'Phreatomagmatic Explosion',
    latin: 'Eruptio Phreatomagmatica',
    vei: 3,
    plumeTargetKm: 9.0,
    massRateKgS: 2e6,
    seismicTremor: 0.65,
    lightningRate: 0.15,
    bombRate: 1.5,
    pdcActive: false,
    skyDarkness: 0.40,
    excerpt: 'Nubes oriebatur, cuius similitudinem et formam non alia magis arbor quam pinus expresserit.'
  },
  {
    id: PHASE.SUB_PLINIAN,
    name: 'Sub-Plinian Ash Column',
    latin: 'Columna Sub-Pliniana',
    vei: 4,
    plumeTargetKm: 18.0,
    massRateKgS: 1.5e7,
    seismicTremor: 0.78,
    lightningRate: 0.45,
    bombRate: 3.5,
    pdcActive: false,
    skyDarkness: 0.65,
    excerpt: 'Iam navibus cinis incidebat, calidior et densior; iam pumices etiam nigrique et ambusti lapides.'
  },
  {
    id: PHASE.ULTRA_PLINIAN,
    name: 'Ultra-Plinian Climax (Umbrella Pine)',
    latin: 'Plinianus Pinus Pinea Summus',
    vei: 5,
    plumeTargetKm: 32.0,
    massRateKgS: 8.5e7,
    seismicTremor: 0.95,
    lightningRate: 0.85,
    bombRate: 7.0,
    pdcActive: false,
    skyDarkness: 0.88,
    excerpt: 'Fortes fortuna iuvat: Pomponianum pete! Latissimae flammae altaque incendia relucebant.'
  },
  {
    id: PHASE.COLUMN_COLLAPSE,
    name: 'Column Collapse & Pyroclastic Surges',
    latin: 'Ruina Columnae & Flumina Ignita',
    vei: 5,
    plumeTargetKm: 22.0,
    massRateKgS: 1.2e8,
    seismicTremor: 0.98,
    lightningRate: 0.95,
    bombRate: 9.0,
    pdcActive: true,
    skyDarkness: 0.96,
    excerpt: 'Respicio: tergo caligo densa imminebat, quae nos torrentis modo infusa terrae sequebatur.'
  },
  {
    id: PHASE.CALDERA_COLLAPSE,
    name: 'Caldera Collapse & Aftermath',
    latin: 'Crateris Fractura & Caligo Perpetua',
    vei: 5,
    plumeTargetKm: 12.0,
    massRateKgS: 3e6,
    seismicTremor: 0.50,
    lightningRate: 0.20,
    bombRate: 1.0,
    pdcActive: false,
    skyDarkness: 0.85,
    excerpt: 'Dies alibi, illic nox omnibus noctibus nigrior densiorque, quam tamen faces multae solvebant.'
  }
];

export const PLINIAN_HISTORICAL_LOGS = [
  {
    tag: 'HORA SEPTIMA (~1:00 PM)',
    latin: 'Mater mea indicat ei apparere nubem inusitata et magnitudine et specie.',
    eng: 'My mother drew his attention to a cloud of unusual size and appearance.'
  },
  {
    tag: 'PINUS PINEA',
    latin: 'Similitudinem et formam non alia magis arbor quam pinus expresserit.',
    eng: 'No other tree could give you a more exact description of its form than an umbrella pine.'
  },
  {
    tag: 'CLASSIS MISENENSIS',
    latin: 'Deducit quadriremes, ascendit ipse non Rectinae modo sed multis laturus auxilium.',
    eng: 'He ordered the quadriremes launched, steering himself to rescue not only Rectina but many.'
  },
  {
    tag: 'PUMICES INCIDENTES',
    latin: 'Iam navibus cinis incidebat, calidior et densior... iam pumices fractique igne lapides.',
    eng: 'Ashes were falling on the ships, hotter and denser; then pumice stones shattered by flame.'
  },
  {
    tag: 'FORTES FORTUNA IUVAT',
    latin: "'Fortes' inquit 'fortuna iuvat: Pomponianum pete!'",
    eng: "'Fortune favors the brave,' he cried: 'steer for Pomponianus!'"
  },
  {
    tag: 'FULGURA VOLCANICA',
    latin: 'Ab altero latere nubes atra et horrenda, ignei spiritus tortis vibratisque discursibus rupta.',
    eng: 'From the other side, a terrifying black cloud, rent by zigzag flashes of fiery gas.'
  },
  {
    tag: 'NOX PERPETUA',
    latin: 'Nox omnibus noctibus nigrior densiorque, quam tamen faces multae solvebant.',
    eng: 'A night blacker and denser than any night, though relieved by countless torches.'
  }
];
// ============================================================================
// SECTION 3: PROCEDURAL AUDIO SYNTHESIZER (WEB AUDIO API SAFEGUARD)
// ============================================================================

export class VesuviusAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.rumbleOsc = null;
    this.rumbleGain = null;
    this.rumbleFilter = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Continuous subterranean low-frequency volcanic rumble
      this.rumbleOsc = this.ctx.createOscillator();
      this.rumbleGain = this.ctx.createGain();
      this.rumbleFilter = this.ctx.createBiquadFilter();

      this.rumbleOsc.type = 'sawtooth';
      this.rumbleOsc.frequency.setValueAtTime(36, this.ctx.currentTime);

      this.rumbleFilter.type = 'lowpass';
      this.rumbleFilter.frequency.setValueAtTime(75, this.ctx.currentTime);
      this.rumbleFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.rumbleGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.rumbleOsc.connect(this.rumbleFilter);
      this.rumbleFilter.connect(this.rumbleGain);
      this.rumbleGain.connect(this.masterGain);

      this.rumbleOsc.start();
      this.isInitialized = true;
    } catch {
      this.ctx = null;
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setRumbleIntensity(intensity) {
    if (!this.ctx || !this.rumbleGain || this.isMuted) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetGain = clamped * 0.28;
    const t = this.ctx.currentTime;
    this.rumbleGain.gain.setTargetAtTime(targetGain, t, 0.2);
    if (this.rumbleOsc) {
      this.rumbleOsc.frequency.setTargetAtTime(32 + clamped * 30, t, 0.3);
    }
    if (this.rumbleFilter) {
      this.rumbleFilter.frequency.setTargetAtTime(70 + clamped * 120, t, 0.3);
    }
  }

  playExplosion(magnitude = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 1.2 + Math.min(2.5, magnitude * 0.8);

      // Noise buffer for blast
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380 * Math.max(0.5, magnitude), t);
      filter.frequency.exponentialRampToValueAtTime(40, t + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85 * Math.min(1, magnitude), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + dur);
    } catch {
      // Audio fallback guard
    }
  }

  playLightningCrack() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(2.0, t);

      gain.gain.setValueAtTime(0.65, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch {
      // Safe guard
    }
  }

  playSteamHiss() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 0.55;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + dur);
    } catch {
      // Safe guard
    }
  }

  playOarStroke() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.32);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.32);
    } catch {
      // Safe guard
    }
  }

  playBell() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(580, t + 1.2);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.2);
    } catch {
      // Safe guard
    }
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.05);
    }
  }
}

// ============================================================================
// SECTION 4: KINEMATIC ENTITY CLASSES & SIMULATION MODELS
// ============================================================================

/**
 * Secondary fragment debris spawned during volcanic bomb impact shattering
 */
export class BombFragment {
  constructor(x, y, vx, vy, radius = 1.5, temp = 900, rng = Math.random) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = Math.max(0.8, radius);
    this.temp = temp;
    this.life = 0;
    this.maxLife = 1.2 + rng() * 1.5;
    this.alive = true;
  }

  update(dt, simWidth, simHeight, elevationMap) {
    if (!this.alive) return;
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
      return;
    }

    this.vy += 9.81 * 2.2 * dt;
    this.vx *= Math.pow(0.96, dt * 60);
    this.x += this.vx * dt * 25;
    this.y += this.vy * dt * 25;
    this.temp = Math.max(30, this.temp - dt * 250);

    const gx = Math.floor(this.x);
    if (gx >= 0 && gx < simWidth) {
      const surfaceY = elevationMap[gx];
      if (this.y >= surfaceY) {
        this.y = surfaceY;
        this.vx *= 0.4;
        this.vy *= -0.3;
        if (Math.abs(this.vy) < 0.5) this.alive = false;
      }
    }
  }

  render(ctx, scaleX, scaleY) {
    if (!this.alive) return;
    const progress = this.life / this.maxLife;
    const alpha = (1 - progress);
    const r = Math.max(0.5, this.radius * scaleX);

    ctx.save();
    ctx.fillStyle = this.temp > 500 ? `rgba(255, 160, 40, ${alpha})` : `rgba(160, 150, 140, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x * scaleX, this.y * scaleY, Math.max(0, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Volcanic Bomb (Tephra Ballistics):
 * Incandescent projectile ejected from crater vent with drag, smoke trails,
 * rotation, and explosive impact cratering.
 */
export class VolcanicBomb {
  constructor(x, y, vx, vy, radius = 3, temp = 1050, rng = Math.random) {
    this.rng = rng;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = Math.max(1, radius);
    this.temp = temp;
    this.rotation = rng() * Math.PI * 2;
    this.rotSpeed = (rng() - 0.5) * 8;
    this.trail = [];
    this.alive = true;
    this.impacted = false;
    this.isPumice = rng() < 0.38;
    this.mass = this.isPumice ? 0.9 : 4.8;
  }

  update(dt, simWidth, simHeight, windSpeed, elevationMap) {
    if (!this.alive) return;

    // Atmospheric aerodynamic drag: F_drag = 0.5 * Cd * rho * v^2
    const speed = Math.hypot(this.vx, this.vy);
    const cd = 0.47; // Spherical projectile drag coefficient
    const rhoAir = 1.2;
    const area = Math.PI * (this.radius * 0.05) ** 2;
    const dragForce = 0.5 * cd * rhoAir * area * speed * speed;
    const dragAcc = speed > 0.001 ? dragForce / this.mass : 0;

    const ax = -(this.vx / (speed || 1)) * dragAcc + windSpeed * 0.18;
    const ay = 9.81 * 1.8 - (this.vy / (speed || 1)) * dragAcc; // Scaled gravity

    this.vx += ax * dt;
    this.vy += ay * dt;
    this.x += this.vx * dt * 28;
    this.y += this.vy * dt * 28;
    this.rotation += this.rotSpeed * dt;

    // Incandescent thermal radiation and cooling
    this.temp = Math.max(40, this.temp - dt * 35);

    // Record trail history
    if (this.trail.length > 9) this.trail.shift();
    this.trail.push({ x: this.x, y: this.y, temp: this.temp });

    // Boundary check
    if (this.x < 0 || this.x >= simWidth || this.y >= simHeight) {
      this.alive = false;
      return;
    }

    // Ground elevation collision check
    const gx = Math.floor(this.x);
    if (gx >= 0 && gx < simWidth) {
      const surfaceY = elevationMap[gx];
      if (this.y >= surfaceY - 1) {
        this.alive = false;
        this.impacted = true;
      }
    }
  }

  createFragments() {
    const frags = [];
    const count = 4 + Math.floor(this.rng() * 5);
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2;
      const spd = 3 + this.rng() * 8;
      const fvx = Math.cos(angle) * spd + this.vx * 0.2;
      const fvy = Math.sin(angle) * spd - 3;
      frags.push(new BombFragment(this.x, this.y, fvx, fvy, this.radius * 0.45, this.temp, this.rng));
    }
    return frags;
  }

  render(ctx, scaleX, scaleY) {
    if (!this.alive && !this.impacted) return;

    // Render incandescent trail sparks
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const alpha = ((i + 1) / this.trail.length) * 0.65;
      ctx.fillStyle = `rgba(255, 140, 20, ${alpha})`;
      ctx.beginPath();
      const trR = Math.max(0.5, this.radius * scaleX * 0.5 * (i / this.trail.length));
      ctx.arc(pt.x * scaleX, pt.y * scaleY, Math.max(0, trR), 0, Math.PI * 2);
      ctx.fill();
    }

    // Render bomb core
    ctx.save();
    ctx.translate(this.x * scaleX, this.y * scaleY);
    ctx.rotate(this.rotation);

    const r = Math.max(1, this.radius * scaleX);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    if (this.temp > 600) {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.35, '#FFA500');
      grad.addColorStop(1, '#8B1000');
    } else {
      grad.addColorStop(0, '#756858');
      grad.addColorStop(0.7, '#423c34');
      grad.addColorStop(1, '#1e1c18');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Irregular jagged polygon contour for rugged volcanic bomb
    const sides = 7;
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      const radOffset = (s % 2 === 0 ? 1 : 0.84) * r;
      const px = Math.cos(angle) * radOffset;
      const py = Math.sin(angle) * radOffset;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Fiery glow halo
    if (this.temp > 400) {
      ctx.strokeStyle = `rgba(255, 200, 50, ${Math.min(1, (this.temp - 400) / 600)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}
/**
 * Pyroclastic Density Current (PDC / Nuée Ardente):
 * Superheated, fluidized density avalanche hugging the mountain topography,
 * sweeping down toward Herculaneum and Pompeii at hurricane velocities.
 */
export class PyroclasticCurrent {
  constructor(x, y, vx, vy, side = 'west', rng = Math.random) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.side = side;
    this.temp = 750; // °C
    this.density = 2.4; // Ratio to ambient air
    this.radius = 4;
    this.maxRadius = 20;
    this.life = 0;
    this.maxLife = 5.8 + rng() * 2.8; // seconds
    this.alive = true;
    this.billowOffset = (rng() - 0.5) * 4;
    this.turbulence = rng() * Math.PI * 2;
    this.subBillows = [];
  }

  update(dt, elevationMap, simWidth) {
    if (!this.alive) return;
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
      return;
    }

    this.turbulence += dt * 4.2;
    const progress = this.life / this.maxLife;

    // Radius expansion as fluidized gas billows outwards
    this.radius = 4 + progress * (this.maxRadius - 4);
    this.temp = Math.max(120, this.temp - dt * 85);

    // Gravity flow hugging surface elevation
    const gx = Math.floor(this.x);
    if (gx >= 0 && gx < simWidth) {
      const surfaceY = elevationMap[gx];
      const slope = (gx < simWidth - 1 ? elevationMap[gx + 1] - elevationMap[Math.max(0, gx - 1)] : 0) * 0.5;

      // Accelerate downslope
      const dirX = this.side === 'west' ? -1 : 1;
      this.vx += (dirX * 3.8 + slope * 1.9) * dt;
      this.vy += 2.4 * dt;

      this.x += this.vx * dt * 26;
      // Maintain ground contact with turbulent billow lift
      const targetY = surfaceY - this.radius * 0.45 + Math.sin(this.turbulence) * 2.2;
      this.y += (targetY - this.y) * (1 - Math.pow(0.84, dt * 60));
    } else {
      this.alive = false;
    }
  }

  render(ctx, scaleX, scaleY) {
    if (!this.alive) return;
    const progress = this.life / this.maxLife;
    const alpha = (1 - progress) * 0.78;
    const r = Math.max(1, this.radius * scaleX);

    ctx.save();
    const cx = this.x * scaleX;
    const cy = this.y * scaleY;

    // Volumetric gradient with incandescent base and billowing ash top
    const grad = ctx.createRadialGradient(cx, cy, Math.max(0, r * 0.18), cx, cy, r);
    if (this.temp > 400) {
      grad.addColorStop(0, `rgba(255, 120, 20, ${alpha * 0.95})`);
      grad.addColorStop(0.35, `rgba(180, 70, 30, ${alpha * 0.85})`);
      grad.addColorStop(0.75, `rgba(70, 60, 65, ${alpha * 0.65})`);
      grad.addColorStop(1, `rgba(30, 28, 35, 0)`);
    } else {
      grad.addColorStop(0, `rgba(140, 130, 135, ${alpha * 0.85})`);
      grad.addColorStop(0.6, `rgba(80, 75, 80, ${alpha * 0.65})`);
      grad.addColorStop(1, `rgba(40, 38, 42, 0)`);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Convective Plinian Plume Particle:
 * Ascends via thermal buoyancy to neutral buoyancy level (~25-33 km),
 * then expands radially with stratospheric wind shear into the Umbrella Pine.
 */
export class PlumeParticle {
  constructor(x, y, vx, vy, isUmbrella = false, rng = Math.random) {
    this.rng = rng;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isUmbrella = isUmbrella;
    this.radius = 2.5 + rng() * 3.5;
    this.maxRadius = 15 + rng() * 18;
    this.life = 0;
    this.maxLife = 6.5 + rng() * 5.5;
    this.alive = true;
    this.temp = 920;
    this.charge = (rng() - 0.5) * 2; // Triboelectric charge
    this.wobblePhase = rng() * Math.PI * 2;
    this.ashDensity = 0.8 + rng() * 0.4;
  }

  update(dt, windSpeed, neutralBuoyancyY) {
    if (!this.alive) return;
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
      return;
    }

    const progress = this.life / this.maxLife;
    this.wobblePhase += dt * 2.6;

    // Thermal buoyancy ascent: F_b = (rho_amb - rho_p) * g
    if (this.y > neutralBuoyancyY) {
      // Momentum & convective rise through troposphere
      const buoyancy = Math.max(0.2, (this.y - neutralBuoyancyY) * 0.085);
      this.vy -= buoyancy * dt * 9.81;
      this.temp = Math.max(40, this.temp - dt * 135);
    } else {
      // Reached Neutral Buoyancy Level (Stratosphere): Lateral Umbrella Pine expansion
      this.isUmbrella = true;
      this.vy *= Math.pow(0.86, dt * 60); // Vertical motion stalls
      // Radial umbrella mushrooming
      const spreadDir = this.vx >= 0 ? 1 : -1;
      this.vx += spreadDir * (1.3 + this.rng() * 2.2) * dt;
      // Stratospheric wind shear drift
      this.vx += windSpeed * 2.0 * dt;
    }

    // Aerodynamic dampening (frame-rate independent)
    this.vx *= Math.pow(0.96, dt * 60);
    this.vy *= Math.pow(0.97, dt * 60);

    this.x += (this.vx + Math.sin(this.wobblePhase) * 0.45) * dt * 21;
    this.y += this.vy * dt * 21;
    this.radius = Math.min(this.maxRadius, this.radius + dt * 4.6);
  }

  render(ctx, scaleX, scaleY) {
    if (!this.alive) return;
    const progress = this.life / this.maxLife;
    const alpha = Math.sin(progress * Math.PI) * 0.68;
    const r = Math.max(1, this.radius * scaleX);

    ctx.save();
    const cx = this.x * scaleX;
    const cy = this.y * scaleY;

    const grad = ctx.createRadialGradient(cx, cy, Math.max(0, r * 0.12), cx, cy, r);
    if (this.temp > 600) {
      grad.addColorStop(0, `rgba(255, 180, 40, ${alpha * 0.92})`);
      grad.addColorStop(0.45, `rgba(160, 70, 30, ${alpha * 0.75})`);
      grad.addColorStop(1, `rgba(40, 35, 45, 0)`);
    } else {
      const ashShade = Math.floor(45 + progress * 70);
      grad.addColorStop(0, `rgba(${ashShade + 20}, ${ashShade + 15}, ${ashShade + 25}, ${alpha * 0.85})`);
      grad.addColorStop(0.55, `rgba(${ashShade}, ${ashShade - 5}, ${ashShade + 5}, ${alpha * 0.65})`);
      grad.addColorStop(1, `rgba(25, 22, 28, 0)`);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Volcanic Lightning (Dirty Thunderstorm):
 * Procedural branching fractal electrostatic discharge within plume ash clouds.
 */
export class VolcanicLightning {
  constructor(startX, startY, endX, endY, rng = Math.random) {
    this.rng = rng;
    this.segments = [];
    this.life = 0;
    this.maxLife = 0.24 + rng() * 0.14; // Short flash
    this.alive = true;
    this.intensity = 0.85 + rng() * 0.15;
    this.generateBranches(startX, startY, endX, endY, 5);
  }

  generateBranches(x1, y1, x2, y2, depth) {
    if (depth <= 0) {
      this.segments.push({ x1, y1, x2, y2 });
      return;
    }

    const midX = (x1 + x2) * 0.5 + (this.rng() - 0.5) * 15;
    const midY = (y1 + y2) * 0.5 + (this.rng() - 0.5) * 15;

    this.generateBranches(x1, y1, midX, midY, depth - 1);
    this.generateBranches(midX, midY, x2, y2, depth - 1);

    // Stochastic lateral fork
    if (this.rng() < 0.42) {
      const forkX = midX + (midX - x1) * 0.72 + (this.rng() - 0.5) * 20;
      const forkY = midY + (midY - y1) * 0.72 + (this.rng() - 0.5) * 20;
      this.generateBranches(midX, midY, forkX, forkY, depth - 2);
    }
  }

  update(dt) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
    }
  }

  render(ctx, scaleX, scaleY) {
    if (!this.alive || this.segments.length === 0) return;
    const alpha = (1 - this.life / this.maxLife) * this.intensity;

    ctx.save();
    ctx.strokeStyle = `rgba(180, 215, 255, ${alpha})`;
    ctx.lineWidth = 2.6;
    ctx.shadowColor = '#5c9eff';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    for (const seg of this.segments) {
      ctx.moveTo(seg.x1 * scaleX, seg.y1 * scaleY);
      ctx.lineTo(seg.x2 * scaleX, seg.y2 * scaleY);
    }
    ctx.stroke();

    // Hot white electric core
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 1.25})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Acoustic Shockwave:
 * Spherical Mach shockfront expanding outward from phreatomagmatic vent explosions,
 * displacing air, ash, and particles.
 */
export class Shockwave {
  constructor(x, y, maxRadius = 85, speed = 95) {
    this.x = x;
    this.y = y;
    this.radius = 2;
    this.maxRadius = maxRadius;
    this.speed = speed;
    this.alive = true;
    this.thickness = 4.5;
  }

  update(dt) {
    this.radius += this.speed * dt;
    if (this.radius >= this.maxRadius) {
      this.alive = false;
    }
  }

  render(ctx, scaleX, scaleY) {
    if (!this.alive) return;
    const progress = this.radius / this.maxRadius;
    const alpha = (1 - progress) * 0.48;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 240, 210, ${alpha})`;
    ctx.lineWidth = Math.max(1, this.thickness * (1 - progress * 0.5));
    ctx.beginPath();
    ctx.arc(this.x * scaleX, this.y * scaleY, Math.max(0, this.radius * scaleX), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
/**
 * Roman Naval Evacuation Galley (Classis Misenensis):
 * Detailed Roman naval quadrireme commanded by Pliny the Elder.
 * Features animated rhythmic oar sweeps, deck pumice accumulation,
 * legionary banners, speech bubbles, and refugee rescue logic.
 */
export class RomanGalley {
  constructor(x, y, name = 'Minerva (Flagship)', isFlagship = true) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.isFlagship = isFlagship;
    this.speed = 8.5; // knots
    this.oarPhase = 0;
    this.oarCadence = 26; // SPM
    this.deckPumice = 0; // kg of pumice on deck
    this.rescuedCount = 0;
    this.targetX = 185; // Coast near Herculaneum/Pompeii
    this.state = 'sailing_to_coast'; // 'idle' | 'sailing' | 'rescuing' | 'offloading' | 'retreating' | 'sunk' | sandbox states
    this.dialog = isFlagship ? 'Fortes fortuna iuvat!' : 'Ad latus praetorium!';
    this.dialogTimer = 4.2;
    this.health = 100;
    this.alive = true;
    this.cargo = 0;
    this.orderedX = null;
    this.selected = false;
  }

  update(dt, pumiceFallRate) {
    if (!this.alive) return;
    this.oarPhase += (this.oarCadence / 60) * Math.PI * 2 * dt;
    if (this.dialogTimer > 0) this.dialogTimer -= dt;

    // Deck pumice accumulation under tephra fallout
    if (pumiceFallRate > 0) {
      this.deckPumice += pumiceFallRate * dt * 1.5;
      // Crew actively sweeps pumice overboard as recounted by Pliny
      this.deckPumice = Math.max(0, this.deckPumice - dt * 0.82);
      if (this.deckPumice > 60) {
        this.health = Math.max(20, this.health - dt * 2.2);
      }
    }

    // Navigation state machine
    if (this.state === 'sailing_to_coast') {
      if (this.x < this.targetX) {
        this.x += this.speed * dt * 0.65;
      } else {
        this.state = 'rescuing';
        this.dialog = 'Cives recipite! Ascendite in navem!';
        this.dialogTimer = 5.2;
      }
    } else if (this.state === 'rescuing') {
      this.rescuedCount += dt * 3.8;
      if (this.rescuedCount > 85 || this.deckPumice > 48) {
        this.state = 'retreating';
        this.dialog = 'Retrahite remis! Stabilias petamus!';
        this.dialogTimer = 5.2;
      }
    } else if (this.state === 'retreating') {
      this.x -= this.speed * dt * 0.45;
      if (this.x < 130) {
        this.state = 'sailing_to_coast';
      }
    }
  }

  render(ctx, scaleX, scaleY, spriteScale = 1) {
    const px = this.x * scaleX;
    const py = this.y * scaleY;
    const k = Math.max(0.001, spriteScale);

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(k, k);

    if (!this.alive) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#2A2218';
      ctx.beginPath();
      ctx.ellipse(0, 6, 22, 5, 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3A2A1C';
      ctx.fillRect(-18, -2, 34, 6);
      ctx.fillStyle = '#8B1E2D';
      ctx.font = '7px serif';
      ctx.textAlign = 'center';
      ctx.fillText('NAUFRAGIUM', 0, -8);
      ctx.textAlign = 'left';
      ctx.restore();
      return;
    }

    // Dynamic water bobbing
    const bob = Math.sin(this.oarPhase) * 1.6;
    ctx.translate(0, bob);

    if (this.selected) {
      ctx.strokeStyle = 'rgba(255, 220, 90, 0.95)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.ellipse(0, 4, 30, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hull dimensions
    const hullLen = this.isFlagship ? 48 : 38;
    const hullH = 9;

    // Pale wake so the hull reads against dark water and ash
    ctx.fillStyle = 'rgba(190, 225, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, hullH + 3, hullLen * 0.52, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bronze underwater ram (Rostrum)
    ctx.fillStyle = '#C29B38';
    ctx.beginPath();
    ctx.moveTo(hullLen * 0.5, 2);
    ctx.lineTo(hullLen * 0.5 + 8, 4);
    ctx.lineTo(hullLen * 0.5 + 4, 7);
    ctx.lineTo(hullLen * 0.5, 6);
    ctx.closePath();
    ctx.fill();

    // Wooden hull (Oak & Pine)
    ctx.fillStyle = this.isFlagship ? '#5C2D15' : '#422410';
    ctx.beginPath();
    ctx.moveTo(-hullLen * 0.5, -hullH * 0.4);
    ctx.lineTo(hullLen * 0.45, -hullH * 0.3);
    ctx.quadraticCurveTo(hullLen * 0.54, 0, hullLen * 0.5, hullH * 0.6);
    ctx.lineTo(-hullLen * 0.42, hullH * 0.6);
    ctx.quadraticCurveTo(-hullLen * 0.54, hullH * 0.2, -hullLen * 0.5, -hullH * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#F0E2C0';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = '#8B1E2D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-hullLen * 0.48, 0);
    ctx.lineTo(hullLen * 0.46, 0);
    ctx.stroke();

    // Painted apotropaic eye (Oculus) on the prow
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(hullLen * 0.4, -1, Math.max(0, 1.8), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F1522';
    ctx.beginPath();
    ctx.arc(hullLen * 0.4 + 0.4, -1, Math.max(0, 0.9), 0, Math.PI * 2);
    ctx.fill();

    // Animated bank of rowing oars
    const oarCount = 8;
    const oarStrokeAngle = Math.sin(this.oarPhase) * 0.42;
    ctx.strokeStyle = '#D8B278';
    ctx.lineWidth = 1.2;

    for (let i = 0; i < oarCount; i++) {
      const ox = -hullLen * 0.35 + (i / (oarCount - 1)) * (hullLen * 0.7);
      const oy = 2;
      const oarLen = 14;
      const bladeX = ox + Math.sin(oarStrokeAngle) * oarLen;
      const bladeY = oy + Math.cos(oarStrokeAngle) * oarLen * 0.6;

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(bladeX, bladeY);
      ctx.stroke();

      // Oar blade dip splash in water
      if (bladeY > 7) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(bladeX - 1, bladeY, 2.5, 1.5);
      }
    }

    // Mast and Furled Square Sail
    ctx.strokeStyle = '#6B4423';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -hullH * 0.4);
    ctx.lineTo(0, -hullH * 2.6);
    ctx.stroke();

    // Sail Yardarm
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, -hullH * 2.3);
    ctx.lineTo(14, -hullH * 2.3);
    ctx.stroke();

    // Furled Sail canvas
    ctx.fillStyle = '#E5DAC4';
    ctx.fillRect(-13, -hullH * 2.3, 26, 4);

    // Roman Legionary Imperial Vexillum (Eagle Banner)
    if (this.isFlagship) {
      ctx.fillStyle = '#A31826';
      ctx.fillRect(-1, -hullH * 3.1, 7, 5);
      ctx.fillStyle = '#FFD700';
      ctx.font = '5px sans-serif';
      ctx.fillText('SPQR', 0, -hullH * 3.1 + 4);
    }

    // Pumice debris accumulation on deck
    if (this.deckPumice > 2) {
      ctx.fillStyle = '#D6CCB6';
      for (let p = 0; p < Math.min(18, Math.floor(this.deckPumice * 0.4)); p++) {
        const pxPos = -hullLen * 0.35 + ((p * 7) % Math.floor(hullLen * 0.7));
        ctx.fillRect(pxPos, -hullH * 0.4 - 1, 2, 2);
      }
    }

    // Speech bubble for Pliny the Elder / Captain
    if (this.dialogTimer > 0) {
      ctx.fillStyle = 'rgba(15, 18, 28, 0.88)';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      const textW = ctx.measureText(this.dialog).width;
      const bW = textW + 14;
      const bH = 15;
      const bX = -bW * 0.5;
      const bY = -hullH * 3.5 - bH;

      ctx.fillRect(bX, bY, bW, bH);
      ctx.strokeRect(bX, bY, bW, bH);

      ctx.fillStyle = '#F5E6C8';
      ctx.font = '8px serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.dialog, 0, bY + 11);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}

/**
 * Seismograph:
 * High-precision circular waveform buffer recording P-waves, S-waves,
 * and volcanic harmonic tremor in real-time.
 */
export class Seismograph {
  constructor(bufferSize = 140) {
    this.bufferSize = bufferSize;
    this.values = new Float32Array(bufferSize);
    this.head = 0;
    this.peakAcceleration = 0;
    this.harmonicPhase = 0;
  }

  record(tremorIntensity, dt) {
    this.harmonicPhase += dt * 18;
    // Harmonic tremor + high frequency micro-fracture noise
    const harmonic = Math.sin(this.harmonicPhase) * 0.42 + Math.sin(this.harmonicPhase * 2.7) * 0.26;
    const noise = (Math.random() - 0.5) * 0.36;
    const val = (harmonic + noise) * tremorIntensity;

    this.values[this.head] = val;
    this.head = (this.head + 1) % this.bufferSize;
    this.peakAcceleration = Math.max(Math.abs(val), this.peakAcceleration * Math.pow(0.98, dt * 60));
  }

  render(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);

    // Frame & oscilloscope dark background
    ctx.fillStyle = 'rgba(8, 12, 18, 0.88)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);

    // Gridlines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.moveTo(0, h * 0.25);
    ctx.lineTo(w, h * 0.25);
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w, h * 0.75);
    ctx.stroke();

    // Seismograph trace
    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    const midY = h * 0.5;
    for (let i = 0; i < this.bufferSize; i++) {
      const idx = (this.head + i) % this.bufferSize;
      const sx = (i / (this.bufferSize - 1)) * w;
      const sy = midY - this.values[idx] * (h * 0.42);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Title and peak readout
    ctx.fillStyle = '#D4AF37';
    ctx.font = '8px monospace';
    ctx.fillText('SEISMIC TREMOR (G)', 4, 9);
    ctx.fillStyle = '#FF8C00';
    ctx.fillText(`${this.peakAcceleration.toFixed(3)}g`, w - 38, 9);

    ctx.restore();
  }
}

/**
 * Historical Settlement Site:
 * Roman coastal cities, villas, and temples around the Bay of Naples
 */
export class SettlementSite {
  constructor(name, x, latinName, type = 'town') {
    this.name = name;
    this.x = x;
    this.latinName = latinName;
    this.type = type;
    this.damaged = false;
    this.buriedDepth = 0;
  }
}
// ============================================================================
// SECTION 5: MAIN VESUVIUS SIMULATION ENGINE
// ============================================================================

export class VesuviusEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Viewport scaling
    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation grid dimensions (280 x 180 = 50,400 cells)
    this.simWidth = 280;
    this.simHeight = 180;
    this.cellCount = this.simWidth * this.simHeight;

    // Primary cellular automata buffers
    this.grid = new Uint8Array(this.cellCount);
    this.heat = new Float32Array(this.cellCount);
    this.visited = new Uint8Array(this.cellCount);
    this.pressure = new Float32Array(this.cellCount);
    this.elevationMap = new Int16Array(this.simWidth);

    // Offscreen render canvas for ultra-fast CA blitting
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.simWidth;
      this.offscreenCanvas.height = this.simHeight;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.imgData = this.offscreenCtx.createImageData(this.simWidth, this.simHeight);
    } else {
      this.offscreenCanvas = null;
      this.offscreenCtx = null;
      this.imgData = { data: new Uint8ClampedArray(this.cellCount * 4) };
    }

    // Kinematic entity collections
    this.bombs = [];
    this.bombFragments = [];
    this.pdcs = [];
    this.plumeParticles = [];
    this.lightningBolts = [];
    this.shockwaves = [];
    this.fleet = [];
    this.seismograph = new Seismograph(140);
    this.audio = new VesuviusAudioSynthesizer();

    // Simulation state and volcanological parameters
    this.currentPhase = PHASE.DORMANT;
    this.targetPlumeKm = 0.5;
    this.plumeHeightKm = 0.5;
    this.massEruptionRate = 0; // kg/s
    this.vei = 0;
    this.chamberPressure = 25; // MPa (0 to 100)
    this.ventExitVelocity = 35; // m/s
    this.windSpeed = -1.2; // m/s (drift towards Pompeii/Stabiae to the south-east)
    this.magmaViscosity = 12;
    this.time = 0;
    this.simAccumulator = 0;          // fractional time below one fixed step
    this.simStepCount = 0;            // integer completed-step counter
    this.simRng = mulberry32((Math.random() * 0xFFFFFFFF) >>> 0);
    this.screenShake = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.selectedElement = ELEMENT.LAVA;
    this.brushSize = 4;
    this.isDrawing = false;
    this.mousePos = { x: 0, y: 0 };
    this.activeParticles = 0;
    this.isPaused = false;
    this.showHUD = true;
    this.mission = createMission(MODE.GAMEPLAY);
    this.barrierMask = new Uint8Array(this.simWidth);
    this.overlayButton = null;

    // Topographical benchmarks
    this.ventX = Math.floor(this.simWidth * 0.44); // Mount Somma crater peak
    this.ventY = Math.floor(this.simHeight * 0.41);
    this.chamberX = this.ventX;
    this.chamberY = this.simHeight - 28;
    this.chamberRadius = 26;
    this.waterlineX = Math.floor(this.simWidth * 0.68); // Bay of Naples coastline

    // Settlements
    this.settlements = [
      new SettlementSite('Herculaneum', 182, 'Herculaneum', 'port'),
      new SettlementSite('Pompeii', 146, 'Pompeii', 'forum'),
      new SettlementSite('Stabiae', 215, 'Stabiae', 'villa'),
      new SettlementSite('Misenum', 28, 'Misenum', 'naval_base')
    ];

    // Initialize simulation environment and DOM
    this.initControls();
    this.buildVolcanoTerrain();
    this.initFleet();
    this.initTouchInput();
  }

  initTouchInput() {
    attachTouchBridge(this, this.canvas);
  }

  // ==========================================================================
  // SECTION 6: DOM CONTROLS & UI CONFIGURATION (HEADLESS SAFE)
  // ==========================================================================

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group" style="margin-bottom: 10px; padding: 8px; border: 1px solid rgba(212, 175, 55, 0.45); background: rgba(18, 16, 12, 0.55);">
        <label style="font-weight: bold; color: var(--accent-gold, #D4AF37); font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
          Evacuate Stabiae — Classis Misenensis
        </label>
        <p id="mission-objective" style="margin: 6px 0 8px; font-size: 11px; line-height: 1.45; color: #E5DAC4; font-family: serif;">
          ${OBJECTIVE}
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc; font-family: var(--font-mono, monospace);">
          <span>Rescued</span>
          <span id="mission-rescued" style="color: #72D572; font-weight: bold;">0 / ${MISSION_NUMBERS.rescueQuota}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc; font-family: var(--font-mono, monospace);">
          <span>Stabiae remaining</span>
          <span id="mission-civilians" style="color: #F5E6C8; font-weight: bold;">${MISSION_NUMBERS.startingCivilians}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc; font-family: var(--font-mono, monospace); margin-top: 4px;">
          <span>Threat</span>
          <span id="mission-threat" style="color: #FFA500; font-weight: bold;">0%</span>
        </div>
        <div id="mission-threat-bar" style="height: 6px; margin-top: 4px; background: rgba(255,255,255,0.08); border: 1px solid rgba(212,175,55,0.3);">
          <div id="mission-threat-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, #C29B38, #FF3B30);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #b0a58a; margin-top: 6px; font-family: var(--font-mono, monospace);">
          <span id="mission-vents">Vents ${MISSION_NUMBERS.ventCharges}</span>
          <span id="mission-barriers">Berms ${MISSION_NUMBERS.barrierCharges}</span>
        </div>
        <p id="mission-selected" style="margin: 6px 0 0; font-size: 10px; color: #D4AF37;">
          Click a galley, then click Stabiae or the western bay.
        </p>
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
        <button id="btn-vent" class="sub-btn" style="background: rgba(180, 80, 20, 0.35); border-color: #E67E22; font-weight: bold; padding: 7px;">
          V · Controlled vent (buy time)
        </button>
        <button id="btn-barrier" class="sub-btn" style="background: rgba(80, 70, 40, 0.35); border-color: #C29B38; font-weight: bold; padding: 7px;">
          B · Place stone berm
        </button>
        <button id="btn-restart-mission" class="sub-btn" style="background: rgba(80, 80, 90, 0.3); border-color: #888; font-weight: bold; padding: 7px;">
          Restart mission
        </button>
      </div>

      <div class="control-btn-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 10px;">
        <button id="btn-mode-gameplay" class="sub-btn active">Mission</button>
        <button id="btn-mode-sandbox" class="sub-btn">Sandbox</button>
      </div>

      <details id="sandbox-tools" style="margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.08); padding: 6px 8px;">
        <summary style="cursor: pointer; color: var(--accent-gold, #D4AF37); font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
          Sandbox & advanced volcanology
        </summary>
      <div class="control-group" style="margin-bottom: 12px; margin-top: 8px;">
        <label style="font-weight: bold; color: var(--accent-gold, #D4AF37); font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
          🌋 Eruption Phase Chronology
        </label>
        <div class="control-btn-grid" id="phase-selector" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 5px;">
          <button class="sub-btn active" data-phase="${PHASE.DORMANT}">0: Dormant</button>
          <button class="sub-btn" data-phase="${PHASE.SEISMIC_TREMOR}">1: Tremor</button>
          <button class="sub-btn" data-phase="${PHASE.PHREATOMAGMATIC}">2: Phreatic</button>
          <button class="sub-btn" data-phase="${PHASE.SUB_PLINIAN}">3: Sub-Plinian</button>
          <button class="sub-btn" data-phase="${PHASE.ULTRA_PLINIAN}">4: Ultra-Plinian</button>
          <button class="sub-btn" data-phase="${PHASE.COLUMN_COLLAPSE}">5: PDC Surges</button>
          <button class="sub-btn" data-phase="${PHASE.CALDERA_COLLAPSE}">6: Caldera</button>
        </div>
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="font-weight: bold; color: var(--accent-gold, #D4AF37); font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
          🧪 Elemental Brush
        </label>
        <div class="control-btn-grid" id="elem-selector" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 5px;">
          <button class="sub-btn active" data-elem="${ELEMENT.LAVA}">🔥 Lava</button>
          <button class="sub-btn" data-elem="${ELEMENT.WATER}">💧 Water</button>
          <button class="sub-btn" data-elem="${ELEMENT.PUMICE}">🪨 Pumice</button>
          <button class="sub-btn" data-elem="${ELEMENT.BASALT}">🧱 Basalt</button>
          <button class="sub-btn" data-elem="${ELEMENT.SAND}">🏜️ Sand</button>
          <button class="sub-btn" data-elem="${ELEMENT.ASH}">🌪️ Ash</button>
          <button class="sub-btn" data-elem="${ELEMENT.MAGMA_CORE}">🌋 Magma</button>
          <button class="sub-btn" data-elem="${ELEMENT.SULFUR_GAS}">☣️ Sulfur</button>
          <button class="sub-btn" data-elem="${ELEMENT.EMPTY}">🧹 Excavate</button>
        </div>
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc;">
          <span>Brush Radius</span>
          <span id="brush-val" style="color: var(--accent-gold, #D4AF37); font-weight: bold;">${this.brushSize}px</span>
        </div>
        <input type="range" id="brush-slider" min="1" max="16" value="${this.brushSize}" style="width: 100%;">
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc;">
          <span>Chamber Pressure (MPa)</span>
          <span id="pressure-val" style="color: var(--accent-gold, #D4AF37); font-weight: bold;">${this.chamberPressure} MPa</span>
        </div>
        <input type="range" id="pressure-slider" min="0" max="100" value="${this.chamberPressure}" style="width: 100%;">
      </div>

      <div class="control-group" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc;">
          <span>Atmospheric Wind Drift</span>
          <span id="wind-val" style="color: var(--accent-gold, #D4AF37); font-weight: bold;">${this.windSpeed} m/s</span>
        </div>
        <input type="range" id="wind-slider" min="-5" max="5" step="0.5" value="${this.windSpeed}" style="width: 100%;">
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc;">
          <span>Magma Viscosity</span>
          <span id="visc-val" style="color: var(--accent-gold, #D4AF37); font-weight: bold;">${this.magmaViscosity}</span>
        </div>
        <input type="range" id="visc-slider" min="1" max="50" value="${this.magmaViscosity}" style="width: 100%;">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
        <button id="btn-ultra" class="sub-btn" style="background: rgba(180, 40, 20, 0.4); border-color: #FF3B30; font-weight: bold; padding: 7px;">
          🌋 TRIGGER ULTRA-PLINIAN CLIMAX
        </button>
        <button id="btn-pdc" class="sub-btn" style="background: rgba(160, 100, 20, 0.4); border-color: #FFA500; font-weight: bold; padding: 7px;">
          🌊 COLUMN COLLAPSE & PDCs
        </button>
        <button id="btn-shock" class="sub-btn" style="background: rgba(40, 120, 200, 0.3); border-color: #38ACEC; font-weight: bold; padding: 7px;">
          💥 PHREATOMAGMATIC SHOCKWAVE
        </button>
        <button id="btn-fleet" class="sub-btn" style="background: rgba(120, 40, 180, 0.3); border-color: #9B59B6; font-weight: bold; padding: 7px;">
          🚢 DEPLOY ROMAN RESCUE FLEET
        </button>
        <button id="btn-reset" class="sub-btn" style="background: rgba(80, 80, 90, 0.3); border-color: #888; font-weight: bold; padding: 7px;">
          🔄 RESET MOUNT SOMMA & BAY
        </button>
      </div>
      </details>
    `;

    // Bind Phase selection buttons
    this.controlsContainer.querySelectorAll('#phase-selector .sub-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.phase, 10);
        this.requestManualPhase(p);
      });
    });

    // Bind Element brush selector buttons
    this.controlsContainer.querySelectorAll('#elem-selector .sub-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.controlsContainer.querySelectorAll('#elem-selector .sub-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedElement = parseInt(btn.dataset.elem, 10);
      });
    });

    // Sliders
    const brushSlider = this.controlsContainer.querySelector('#brush-slider');
    const brushVal = this.controlsContainer.querySelector('#brush-val');
    if (brushSlider) {
      brushSlider.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value, 10);
        if (brushVal) brushVal.textContent = `${this.brushSize}px`;
      });
    }

    const pressureSlider = this.controlsContainer.querySelector('#pressure-slider');
    const pressureVal = this.controlsContainer.querySelector('#pressure-val');
    if (pressureSlider) {
      pressureSlider.addEventListener('input', (e) => {
        this.chamberPressure = parseInt(e.target.value, 10);
        if (pressureVal) pressureVal.textContent = `${this.chamberPressure} MPa`;
      });
    }

    const windSlider = this.controlsContainer.querySelector('#wind-slider');
    const windVal = this.controlsContainer.querySelector('#wind-val');
    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.windSpeed = parseFloat(e.target.value);
        if (windVal) windVal.textContent = `${this.windSpeed} m/s`;
      });
    }

    const viscSlider = this.controlsContainer.querySelector('#visc-slider');
    const viscVal = this.controlsContainer.querySelector('#visc-val');
    if (viscSlider) {
      viscSlider.addEventListener('input', (e) => {
        this.magmaViscosity = parseInt(e.target.value, 10);
        if (viscVal) viscVal.textContent = `${this.magmaViscosity}`;
      });
    }

    // Action Triggers
    const btnUltra = this.controlsContainer.querySelector('#btn-ultra');
    if (btnUltra) btnUltra.addEventListener('click', () => this.requestManualPhase(PHASE.ULTRA_PLINIAN));

    const btnPdc = this.controlsContainer.querySelector('#btn-pdc');
    if (btnPdc) btnPdc.addEventListener('click', () => this.requestManualPhase(PHASE.COLUMN_COLLAPSE));

    const btnShock = this.controlsContainer.querySelector('#btn-shock');
    if (btnShock) btnShock.addEventListener('click', () => this.triggerShockwave(this.ventX, this.ventY, 85));

    const btnFleet = this.controlsContainer.querySelector('#btn-fleet');
    if (btnFleet) btnFleet.addEventListener('click', () => this.deployFleetMission());

    const btnReset = this.controlsContainer.querySelector('#btn-reset');
    if (btnReset) btnReset.addEventListener('click', () => this.reset());

    const btnVent = this.controlsContainer.querySelector('#btn-vent');
    if (btnVent) btnVent.addEventListener('click', () => this.ventChamber());

    const btnBarrier = this.controlsContainer.querySelector('#btn-barrier');
    if (btnBarrier) btnBarrier.addEventListener('click', () => this.toggleBarrierTool());

    const btnRestart = this.controlsContainer.querySelector('#btn-restart-mission');
    if (btnRestart) btnRestart.addEventListener('click', () => this.reset());

    const btnGameplay = this.controlsContainer.querySelector('#btn-mode-gameplay');
    if (btnGameplay) btnGameplay.addEventListener('click', () => this.setPlayMode(MODE.GAMEPLAY));

    const btnSandbox = this.controlsContainer.querySelector('#btn-mode-sandbox');
    if (btnSandbox) btnSandbox.addEventListener('click', () => this.setPlayMode(MODE.SANDBOX));

    this.syncMissionHud();
  }

  // ==========================================================================
  // SECTION 7: TOPOGRAPHICAL TERRAIN GENERATION & HYDROLOGY
  // ==========================================================================

  buildVolcanoTerrain() {
    this.grid.fill(ELEMENT.EMPTY);
    this.heat.fill(20); // 20°C ambient
    this.pressure.fill(0);

    const w = this.simWidth;
    const h = this.simHeight;
    const ventX = this.ventX;
    const ventY = this.ventY;
    const coastX = this.waterlineX;

    // 1. Build Bedrock crust and Mount Somma Stratovolcano Profile
    for (let x = 0; x < w; x++) {
      // Flank profile equation
      let surfaceY;
      if (x < coastX) {
        // Continental landmass with volcano cone
        const distFromPeak = Math.abs(x - ventX);
        const mountainElevation = Math.max(0, (h - 32 - ventY) - distFromPeak * 0.78);
        surfaceY = Math.floor(h - 32 - mountainElevation);
      } else {
        // Coastal shoreline descending into the Bay of Naples
        const distIntoBay = x - coastX;
        surfaceY = Math.floor(h - 30 + Math.min(18, distIntoBay * 0.45));
      }

      this.elevationMap[x] = surfaceY;

      for (let y = surfaceY; y < h; y++) {
        const idx = y * w + x;
        // Deep bedrock vs volcanic stratocone layers
        if (y > h - 14) {
          this.grid[idx] = ELEMENT.BASALT;
          this.heat[idx] = 45;
        } else if (y >= surfaceY) {
          // Stratified volcanic layers (ancient ash falls and basalt lava flows)
          const layerSeed = Math.sin(x * 0.12) * 3 + y;
          if (layerSeed % 12 < 3) {
            this.grid[idx] = ELEMENT.ASH;
            this.heat[idx] = 25;
          } else if (layerSeed % 12 < 5) {
            this.grid[idx] = ELEMENT.SAND;
            this.heat[idx] = 22;
          } else {
            this.grid[idx] = ELEMENT.STONE;
            this.heat[idx] = 28;
          }
        }
      }
    }

    // 2. Excavate Central Volcanic Conduit / Neck
    const conduitRadius = 7;
    for (let y = ventY; y < h - 35; y++) {
      for (let dx = -conduitRadius; dx <= conduitRadius; dx++) {
        const cx = ventX + dx;
        if (cx >= 0 && cx < w) {
          const idx = y * w + cx;
          if (y > h - 52) {
            this.grid[idx] = ELEMENT.LAVA;
            this.heat[idx] = 1050;
          } else {
            this.grid[idx] = ELEMENT.EMPTY;
            this.heat[idx] = 150;
          }
        }
      }
    }

    // 3. Fill the Bay of Naples with Water
    const seaLevelY = h - 28;
    for (let x = coastX; x < w; x++) {
      for (let y = seaLevelY; y < h; y++) {
        const idx = y * w + x;
        if (this.grid[idx] === ELEMENT.EMPTY) {
          this.grid[idx] = ELEMENT.WATER;
          this.heat[idx] = 18;
        }
      }
    }

    // 4. Subterranean Groundwater Aquifers (Breaches create Phreatomagmatic Blasts)
    const aquiferX1 = Math.floor(w * 0.32);
    const aquiferX2 = Math.floor(w * 0.58);
    const aquiferY = h - 45;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        if (dx * dx + dy * dy < 50) {
          const idx1 = (aquiferY + dy) * w + (aquiferX1 + dx);
          const idx2 = (aquiferY + dy) * w + (aquiferX2 + dx);
          this.grid[idx1] = ELEMENT.WATER;
          this.heat[idx1] = 24;
          this.grid[idx2] = ELEMENT.WATER;
          this.heat[idx2] = 24;
        }
      }
    }

    // 5. Deep Plutonic Magma Chamber
    const cX = this.chamberX;
    const cY = this.chamberY;
    const cR = this.chamberRadius;
    for (let dy = -cR; dy <= cR; dy++) {
      for (let dx = -cR; dx <= cR; dx++) {
        if (dx * dx + dy * dy * 1.4 < cR * cR) {
          const px = cX + dx;
          const py = cY + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = py * w + px;
            if (dx * dx + dy * dy < 36) {
              this.grid[idx] = ELEMENT.MAGMA_CORE;
              this.heat[idx] = 1350;
            } else {
              this.grid[idx] = ELEMENT.LAVA;
              this.heat[idx] = 1150;
            }
          }
        }
      }
    }
  }

  initFleet() {
    if (this.mission && this.mission.mode === MODE.GAMEPLAY) {
      // Park in the bay, east of the waterline, with spacing for the larger
      // gameplay hulls. The hub side panel covers the far-right water at 1280px.
      const names = ['Minerva (Flagship)', 'Victoria (Liburnian)', 'Neptunus (Quadrireme)'];
      const ys = [this.simHeight - 31, this.simHeight - 29, this.simHeight - 30];
      this.fleet = READABILITY.galleyHomeOffset.map((ox, i) =>
        new RomanGalley(this.waterlineX + ox, ys[i], names[i], i === 0)
      );
      for (const galley of this.fleet) {
        galley.state = 'idle';
        galley.orderedX = null;
        galley.cargo = 0;
        galley.alive = true;
        galley.health = 100;
        galley.dialog = galley.isFlagship ? 'Expecto iussa, Praefecte.' : 'Ad nutum tuum.';
        galley.dialogTimer = 5.5;
      }
      return;
    }

    this.fleet = [
      new RomanGalley(this.waterlineX + 18, this.simHeight - 31, 'Minerva (Flagship)', true),
      new RomanGalley(this.waterlineX + 38, this.simHeight - 29, 'Victoria (Liburnian)', false),
      new RomanGalley(this.waterlineX + 58, this.simHeight - 30, 'Neptunus (Quadrireme)', false)
    ];
  }

  deployFleetMission() {
    for (const galley of this.fleet) {
      galley.state = 'sailing_to_coast';
      galley.dialog = 'Ad oram Herculanei contendite!';
      galley.dialogTimer = 4.5;
    }
    this.audio.playOarStroke();
  }

  setPlayMode(mode) {
    this.mission = createMission(mode);
    this.reset();
    if (this.controlsContainer) {
      const g = this.controlsContainer.querySelector('#btn-mode-gameplay');
      const s = this.controlsContainer.querySelector('#btn-mode-sandbox');
      if (g && g.classList) g.classList.toggle('active', mode === MODE.GAMEPLAY);
      if (s && s.classList) s.classList.toggle('active', mode === MODE.SANDBOX);
      const sandbox = this.controlsContainer.querySelector('#sandbox-tools');
      if (sandbox && mode === MODE.SANDBOX) sandbox.open = true;
    }
  }

  requestManualPhase(phaseIndex) {
    if (this.mission && this.mission.mode === MODE.GAMEPLAY && this.mission.status === STATUS.PLAYING) {
      return false;
    }
    this.setEruptionPhase(phaseIndex);
    return true;
  }

  tickGameplay(dt) {
    if (this.mission.status !== STATUS.PLAYING) {
      this.screenShake = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      for (const galley of this.fleet) {
        if (galley.alive) {
          galley.oarPhase += (galley.oarCadence / 60) * Math.PI * 2 * dt;
          if (galley.dialogTimer > 0) galley.dialogTimer -= dt;
        }
      }
      return;
    }

    this.mission.time += dt;
    const target = scheduledPhase(this.mission.time, this.mission.ventDelay);
    const next = Math.max(this.currentPhase, target);
    if (next > this.currentPhase) {
      this.setEruptionPhase(next);
    }
    this.updateGameplayFleet(dt);
    applyWorldHazards(this.mission, {
      pdcs: this.pdcs,
      ships: this.fleet,
      phase: this.currentPhase
    }, dt);
    resolveMission(this.mission, { ships: this.fleet, phase: this.currentPhase });
    if (this.mission.status !== STATUS.PLAYING) this.screenShake = 0;
    // HUD sync is batched to once per outer update() call
  }

  updateGameplayFleet(dt) {
    const n = MISSION_NUMBERS;
    const pumiceFall = this.currentPhase >= PHASE.SUB_PLINIAN ? 1.8 : 0;
    const selected = this.mission.selectedShip;

    for (let i = 0; i < this.fleet.length; i++) {
      const galley = this.fleet[i];
      galley.selected = selected === i;
      if (!galley.alive) {
        galley.state = 'sunk';
        continue;
      }

      galley.oarPhase += (galley.oarCadence / 60) * Math.PI * 2 * dt;
      if (galley.dialogTimer > 0) galley.dialogTimer -= dt;

      if (pumiceFall > 0) {
        galley.deckPumice += pumiceFall * dt * 1.5;
        galley.deckPumice = Math.max(0, galley.deckPumice - dt * 0.82);
        if (galley.deckPumice > 60) {
          galley.health = Math.max(0, galley.health - dt * n.pumiceShipDamageRate);
        }
      }

      if (galley.orderedX != null) {
        const dx = galley.orderedX - galley.x;
        if (Math.abs(dx) > 1.4) {
          galley.state = 'sailing';
          galley.x += Math.sign(dx) * n.sailSpeed * dt;
        } else {
          galley.x = galley.orderedX;
          if (Math.abs(galley.x - n.stabiaeX) <= n.pickupRadius) {
            galley.state = 'rescuing';
          } else if (Math.abs(galley.x - n.offloadX) <= n.offloadRadius) {
            galley.state = 'offloading';
          } else {
            galley.state = 'idle';
          }
        }
      } else if (galley.state !== 'rescuing' && galley.state !== 'offloading') {
        galley.state = 'idle';
      }

      if (galley.state === 'rescuing') {
        const room = n.shipCapacity - galley.cargo;
        const take = Math.min(room, this.mission.civiliansAtStabiae, n.pickupRate * dt);
        if (take > 0) {
          galley.cargo += take;
          this.mission.civiliansAtStabiae = Math.max(0, this.mission.civiliansAtStabiae - take);
          galley.rescuedCount = galley.cargo;
        }
        if (galley.cargo >= n.shipCapacity - 0.05 || this.mission.civiliansAtStabiae <= 0) {
          galley.orderedX = n.offloadX;
          galley.state = 'sailing';
          galley.dialog = 'Retrahite remis! Misenum petamus!';
          galley.dialogTimer = 4;
        }
      }

      if (galley.state === 'offloading' && galley.cargo > 0) {
        const give = Math.min(galley.cargo, n.offloadRate * dt);
        galley.cargo -= give;
        this.mission.rescued += give;
        galley.rescuedCount = galley.cargo;
        if (galley.cargo <= 0.05) {
          galley.cargo = 0;
          galley.orderedX = null;
          galley.state = 'idle';
          galley.dialog = 'Cives in tuto. Iterum iube, Praefecte.';
          galley.dialogTimer = 4;
        }
      }

      if (galley.health <= 0) {
        galley.alive = false;
        galley.state = 'sunk';
        galley.dialog = 'Vae! Navis perit!';
        galley.dialogTimer = 3;
      }
    }
  }

  ventChamber() {
    const result = tryVent(this.mission);
    if (!result.ok) return false;
    this.ventedPressureRelief = (this.ventedPressureRelief || 0) + result.bleed;
    this.chamberPressure = Math.max(4, this.chamberPressure - result.bleed);
    this.triggerShockwave(this.ventX, this.ventY, 42);
    this.syncMissionHud();
    return true;
  }

  toggleBarrierTool() {
    if (this.mission.mode !== MODE.GAMEPLAY) return;
    this.mission.tool = this.mission.tool === TOOL.BARRIER ? TOOL.ORDER : TOOL.BARRIER;
    this.syncMissionHud();
  }

  placeBarrier(gx, gy) {
    if (this.mission.barrierCharges <= 0) {
      this.mission.tool = TOOL.ORDER;
      this.syncMissionHud();
      return false;
    }
    const w = this.simWidth;
    const h = this.simHeight;
    const cx = Math.max(0, Math.min(w - 1, Math.floor(gx)));
    if (cx > this.waterlineX + 10 || cx < this.ventX - 20) {
      return false;
    }
    const spend = trySpendBarrier(this.mission);
    if (!spend.ok) {
      this.mission.tool = TOOL.ORDER;
      this.syncMissionHud();
      return false;
    }
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= w) continue;
      this.barrierMask[x] = 1;
      const surface = this.elevationMap[x] ?? Math.floor(gy);
      this.elevationMap[x] = Math.max(8, surface - 6);
      for (let dy = -8; dy <= 3; dy++) {
        const y = surface + dy;
        if (y >= 0 && y < h) {
          const idx = y * w + x;
          const elem = this.grid[idx];
          if (elem === ELEMENT.EMPTY || elem === ELEMENT.ASH || elem === ELEMENT.SAND || elem === ELEMENT.SMOKE) {
            this.grid[idx] = ELEMENT.BASALT;
            this.heat[idx] = 35;
          }
        }
      }
    }
    this.syncMissionHud();
    return true;
  }

  toSim(pos) {
    const cw = this.canvas ? this.canvas.width : this.width;
    const ch = this.canvas ? this.canvas.height : this.height;
    const v = this.worldView();
    return {
      gx: v.x + (pos.x / (cw || 1)) * v.w,
      gy: v.y + (pos.y / (ch || 1)) * v.h
    };
  }

  toCanvas(sx, sy) {
    const cw = this.canvas ? this.canvas.width : this.width;
    const ch = this.canvas ? this.canvas.height : this.height;
    const v = this.worldView();
    return {
      x: ((sx - v.x) / v.w) * cw,
      y: ((sy - v.y) / v.h) * ch
    };
  }

  worldView() {
    const cw = this.canvas ? this.canvas.width : this.width;
    const ch = this.canvas ? this.canvas.height : this.height;
    const aspect = cw > 0 && ch > 0 ? cw / ch : 0;
    return missionWorldView(this.mission && this.mission.mode, this.simWidth, this.simHeight, aspect);
  }

  applyWorldCamera(ctx, w, h) {
    const v = this.worldView();
    // World drawers use (simX * w/simWidth). Scale-after-translate in canvas
    // terms is last-specified-first-applied: zoom the sim-pixel draw, then
    // shift so view.x maps to canvas 0. Translate must use w/view.w, not
    // w/simWidth, or the crop slides off the bay.
    ctx.translate(-v.x * (w / v.w), -v.y * (h / v.h));
    ctx.scale(this.simWidth / v.w, this.simHeight / v.h);
  }

  hitShipIndex(gx, gy, radius = 9) {
    const r = radius;
    let best = -1;
    let bestD = r * r;
    for (let i = 0; i < this.fleet.length; i++) {
      const g = this.fleet[i];
      if (!g.alive) continue;
      const dx = g.x - gx;
      const dy = g.y - gy;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  missionLandmark(gx, gy) {
    const n = MISSION_NUMBERS;
    const waterY = this.simHeight - 28;
    const villaY = this.elevationMap[n.stabiaeX] || waterY;
    const spots = [
      { x: n.stabiaeX, y: villaY, r: 18 },
      { x: n.stabiaeX, y: waterY, r: n.pickupRadius + 8 },
      { x: n.offloadX, y: waterY, r: n.offloadRadius + 6 }
    ];
    let best = null;
    let bestD = Infinity;
    for (const spot of spots) {
      const d = (gx - spot.x) * (gx - spot.x) + (gy - spot.y) * (gy - spot.y);
      if (d <= spot.r * spot.r && d < bestD) {
        bestD = d;
        best = { dist2: d };
      }
    }
    return best;
  }

  selectShip(index) {
    if (index == null || index < 0 || index >= this.fleet.length) {
      this.mission.selectedShip = null;
    } else if (this.fleet[index].alive) {
      this.mission.selectedShip = index;
    }
    this.syncMissionHud();
  }

  orderSelectedShip(gx) {
    const idx = this.mission.selectedShip;
    if (idx == null || !this.fleet[idx] || !this.fleet[idx].alive) return false;
    const n = MISSION_NUMBERS;
    let target = clampShipX(gx, this.waterlineX, this.simWidth);
    const dStabiae = Math.abs(gx - n.stabiaeX);
    const dOffload = Math.abs(gx - n.offloadX);
    if (dStabiae <= n.pickupRadius + 8 && dStabiae <= dOffload) {
      target = n.stabiaeX;
    } else if (dOffload <= n.offloadRadius + 6) {
      target = n.offloadX;
    }
    const ship = this.fleet[idx];
    ship.orderedX = target;
    ship.state = 'sailing';
    ship.dialog = target >= n.stabiaeX - 2 ? 'Pomponianum pete!' : 'Ad Misenum!';
    ship.dialogTimer = 3.6;
    this.audio.playOarStroke();
    this.syncMissionHud();
    return true;
  }

  syncMissionHud() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const m = this.mission;
    const set = (id, text) => {
      const el = this.controlsContainer.querySelector(id);
      if (el) el.textContent = text;
    };
    set('#mission-objective', m.objective);
    set('#mission-rescued', `${Math.floor(m.rescued)} / ${m.quota}`);
    set('#mission-civilians', `${Math.ceil(m.civiliansAtStabiae)}`);
    const threat = threatMeter(m, this.currentPhase, pdcHitsX(this.pdcs, MISSION_NUMBERS.stabiaeX, MISSION_NUMBERS.pdcTownRadius));
    set('#mission-threat', `${Math.round(threat * 100)}%`);
    const fill = this.controlsContainer.querySelector('#mission-threat-fill');
    if (fill && fill.style) fill.style.width = `${Math.round(threat * 100)}%`;
    set('#mission-vents', `Vents ${m.ventCharges}`);
    set('#mission-barriers', `Berms ${m.barrierCharges}`);
    const ship = m.selectedShip != null ? this.fleet[m.selectedShip] : null;
    let selected = 'Click a galley, then the east Stabiae ring or the west offload ring.';
    if (m.tool === TOOL.BARRIER) selected = 'Berm tool armed — click the east flank to raise a stone wall.';
    else if (ship) selected = `Selected: ${ship.name} — east gold ring is Stabiae, west teal is offload`;
    if (m.status === STATUS.WON) selected = 'Victory — Stabiae lives. Restart to sail again.';
    if (m.status === STATUS.LOST) selected = 'The bay is lost. Restart the mission.';
    set('#mission-selected', selected);

    const barrierBtn = this.controlsContainer.querySelector('#btn-barrier');
    if (barrierBtn && barrierBtn.classList) {
      barrierBtn.classList.toggle('active', m.tool === TOOL.BARRIER);
    }
  }

  // ==========================================================================
  // SECTION 8: VOLCANOLOGICAL PHASE CONTROLLER & TRIGGERS
  // ==========================================================================

  setEruptionPhase(phaseIndex) {
    const oldPhase = this.currentPhase;
    this.currentPhase = phaseIndex;
    const config = PHASE_CONFIG[phaseIndex];
    if (!config) return;

    this.vei = config.vei;
    this.targetPlumeKm = config.plumeTargetKm;
    this.massEruptionRate = config.massRateKgS;
    const basePressure = 20 + phaseIndex * 13;
    const relief = this.ventedPressureRelief || 0;
    this.chamberPressure = Math.max(4, Math.min(100, basePressure - relief));

    // Audio cues
    this.audio.ensureContext();
    this.audio.setRumbleIntensity(config.seismicTremor);

    if (phaseIndex === PHASE.PHREATOMAGMATIC || phaseIndex === PHASE.ULTRA_PLINIAN) {
      this.triggerShockwave(this.ventX, this.ventY, 95);
      this.audio.playExplosion(1.2);
    } else if (phaseIndex === PHASE.COLUMN_COLLAPSE) {
      this.triggerColumnCollapseSurges();
    } else if (phaseIndex === PHASE.CALDERA_COLLAPSE) {
      this.triggerCalderaCollapse();
    }

    // Update UI button states if container exists
    if (this.controlsContainer) {
      this.controlsContainer.querySelectorAll('#phase-selector .sub-btn').forEach((btn) => {
        const p = parseInt(btn.dataset.phase, 10);
        btn.classList.toggle('active', p === phaseIndex);
      });
      const pressureSlider = this.controlsContainer.querySelector('#pressure-slider');
      const pressureVal = this.controlsContainer.querySelector('#pressure-val');
      if (pressureSlider) pressureSlider.value = this.chamberPressure;
      if (pressureVal) pressureVal.textContent = `${this.chamberPressure} MPa`;
    }
  }

  triggerShockwave(x, y, intensity = 80) {
    this.shockwaves.push(new Shockwave(x, y, intensity, 110));
    this.screenShake = Math.min(15, intensity * 0.16);
    this.audio.playExplosion(intensity * 0.012);

    // Blast away loose ash and smoke around shock origin
    const w = this.simWidth;
    const h = this.simHeight;
    const blastRadius = 14;
    for (let dy = -blastRadius; dy <= blastRadius; dy++) {
      for (let dx = -blastRadius; dx <= blastRadius; dx++) {
        if (dx * dx + dy * dy <= blastRadius * blastRadius) {
          const bx = x + dx;
          const by = y + dy;
          if (bx >= 0 && bx < w && by >= 0 && by < h) {
            const idx = by * w + bx;
            const elem = this.grid[idx];
            if (elem === ELEMENT.SMOKE || elem === ELEMENT.STEAM || elem === ELEMENT.ASH) {
              this.grid[idx] = this.simRng() < 0.3 ? ELEMENT.FIRE : ELEMENT.EMPTY;
            }
          }
        }
      }
    }
  }

  triggerColumnCollapseSurges() {
    this.triggerShockwave(this.ventX, this.ventY, 80);
    // Spawn massive pyroclastic density currents down both flanks
    for (let i = 0; i < 18; i++) {
      const vxWest = -2.8 - this.simRng() * 3.5;
      const vyWest = 1.2 + this.simRng() * 1.8;
      this.pdcs.push(new PyroclasticCurrent(this.ventX - 6, this.ventY + 2, vxWest, vyWest, 'west', this.simRng));

      const vxEast = 2.8 + this.simRng() * 3.5;
      const vyEast = 1.2 + this.simRng() * 1.8;
      this.pdcs.push(new PyroclasticCurrent(this.ventX + 6, this.ventY + 2, vxEast, vyEast, 'east', this.simRng));
    }
  }

  triggerCalderaCollapse() {
    this.triggerShockwave(this.ventX, this.ventY, 120);
    this.screenShake = 22;
    // Structural subsidence of crater rim
    const w = this.simWidth;
    const h = this.simHeight;
    const rimRadius = 22;
    for (let dx = -rimRadius; dx <= rimRadius; dx++) {
      const cx = this.ventX + dx;
      if (cx >= 0 && cx < w) {
        const drop = Math.floor((1 - Math.abs(dx) / rimRadius) * 12);
        for (let y = this.ventY - 5; y < this.ventY + 20; y++) {
          const idx = y * w + cx;
          if (this.grid[idx] === ELEMENT.STONE || this.grid[idx] === ELEMENT.ASH) {
            this.grid[idx] = this.simRng() < 0.6 ? ELEMENT.SAND : ELEMENT.FIRE;
            this.heat[idx] = 850;
          }
        }
        this.elevationMap[cx] = Math.min(h - 20, this.elevationMap[cx] + drop);
      }
    }
  }
  // ==========================================================================
  // SECTION 9: CELLULAR AUTOMATA STEP & THERMAL HEAT DIFFUSION
  // ==========================================================================

  /**
   * Replace the simulation PRNG with a deterministic seed for test replays.
   * Normal play uses a random seed set in the constructor / reset.
   */
  _setSeed(seed) {
    this.simRng = mulberry32(seed >>> 0);
  }

  /**
   * Execute exactly one fixed simulation step at SIM_FIXED_DT (1/60 s).
   * All coupled subsystems advance on the same clock: heat, CA, magma,
   * kinematics, fleet, mission time, eruption schedule.
   *
   * Scan-direction alternation uses the integer step counter instead of
   * Math.floor(this.time * 60), correcting historical floating-point
   * boundary artifacts where the old formula could skip or repeat a
   * parity at certain accumulated time values.
   */
  _simStep() {
    const dt = SIM_FIXED_DT;
    this.time += dt;
    this.simStepCount++;

    // Decay screen shake (uses simulation PRNG for determinism)
    if (this.screenShake > 0) {
      this.shakeOffsetX = (this.simRng() - 0.5) * this.screenShake;
      this.shakeOffsetY = (this.simRng() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - dt * 9);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Smooth plume height lerp towards target
    this.plumeHeightKm += (this.targetPlumeKm - this.plumeHeightKm) * dt * 0.45;

    // 1. Thermodynamic Cellular Automata Pass
    this.updateHeatDiffusion(dt);
    this.updateCellularAutomata();
    this.updateMagmaChamber(dt);

    // 2. High-Precision Kinematic & Particle Layer Pass
    this.updateKinematics(dt);

    // 3. Update Seismograph Waveform
    const tremorVal = PHASE_CONFIG[this.currentPhase] ? PHASE_CONFIG[this.currentPhase].seismicTremor : 0.05;
    this.seismograph.record(tremorVal + (this.screenShake > 0 ? 0.45 : 0), dt);

    // 4. Gameplay tick (mission time, fleet, hazards — all on same fixed clock)
    if (this.mission && this.mission.mode === MODE.GAMEPLAY) {
      this.tickGameplay(dt);
    }
  }

  /**
   * Outer update called by the hub once per animation frame.
   *
   * Admits at most SIM_MAX_ADMITTED_DT (0.1 s) of elapsed time and executes
   * up to SIM_MAX_STEPS_PER_UPDATE (6) fixed steps. Excess elapsed time from
   * a stall is deliberately dropped — the simulation and mission clock both
   * slow together; neither silently jumps forward.
   *
   * At 30 Hz: ordinarily 2 steps/call. At 60 Hz: 1. At 120 Hz: alternates 0/1.
   * A direct update(5) executes at most 6, not 300.
   */
  update(dt) {
    if (this.isPaused) return;

    // Guard: ignore zero, negative, and non-finite dt
    if (!(dt > 0) || !Number.isFinite(dt)) return;

    // Admit at most 0.1 s per outer update
    const admitted = Math.min(dt, SIM_MAX_ADMITTED_DT);
    this.simAccumulator += admitted;

    // Execute fixed steps
    let steps = 0;
    while (this.simAccumulator >= SIM_FIXED_DT - SIM_STEP_EPSILON && steps < SIM_MAX_STEPS_PER_UPDATE) {
      this._simStep();
      this.simAccumulator -= SIM_FIXED_DT;
      steps++;
    }

    // Discard whole-step backlog from a stall while keeping valid fractional remainder
    if (this.simAccumulator >= SIM_FIXED_DT) {
      this.simAccumulator = this.simAccumulator % SIM_FIXED_DT;
    }

    // Normalize tiny negative residuals to zero
    if (this.simAccumulator < 0) {
      this.simAccumulator = 0;
    }

    // Batch HUD synchronization: at most once per outer update
    if (steps > 0 && this.mission && this.mission.mode === MODE.GAMEPLAY) {
      this.syncMissionHud();
    }
  }

  updateHeatDiffusion(dt) {
    const w = this.simWidth;
    const h = this.simHeight;
    const alpha = 0.08; // Thermal diffusivity coefficient

    // Sample discrete 4-neighbor Laplacian heat transfer
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const idx = y * w + x;
        const elem = this.grid[idx];
        if (elem === ELEMENT.EMPTY) continue;

        const tCenter = this.heat[idx];
        const laplacian =
          this.heat[idx - 1] +
          this.heat[idx + 1] +
          this.heat[idx - w] +
          this.heat[idx + w] -
          4 * tCenter;

        this.heat[idx] += alpha * laplacian * dt * 10;

        // Phase transitions under thermodynamic thresholds
        if (elem === ELEMENT.LAVA && this.heat[idx] < 650) {
          // Lava solidifies to Basalt when cooled below 650°C
          this.grid[idx] = ELEMENT.BASALT;
        } else if (elem === ELEMENT.BASALT && this.heat[idx] > 1150) {
          // Basalt remelts into Lava
          this.grid[idx] = ELEMENT.LAVA;
        } else if (elem === ELEMENT.WATER && this.heat[idx] > 100) {
          // Water boils into Steam
          this.grid[idx] = ELEMENT.STEAM;
          this.audio.playSteamHiss();
        }
      }
    }
  }

  updateMagmaChamber(dt) {
    const w = this.simWidth;
    const h = this.simHeight;
    const cX = this.chamberX;
    const cY = this.chamberY;

    // Chamber pressure forces lava bubbles up the central feeder conduit
    if (this.chamberPressure > 5) {
      const bubbleProb = this.chamberPressure * 0.008;
      if (this.simRng() < (1 - Math.pow(1 - Math.min(1, bubbleProb), dt * 60))) {
        const bx = cX + Math.floor((this.simRng() - 0.5) * 10);
        const by = cY - 14;
        const idx = by * w + bx;
        if (by >= 0 && (this.grid[idx] === ELEMENT.EMPTY || this.grid[idx] === ELEMENT.LAVA)) {
          this.grid[idx] = this.simRng() < 0.25 ? ELEMENT.FIRE : ELEMENT.LAVA;
          this.heat[idx] = 1150;
        }
      }
    }
  }

  updateCellularAutomata() {
    this.visited.fill(0);
    const w = this.simWidth;
    const h = this.simHeight;
    let totalActive = 0;

    // Bottom-to-top traversal for gravity falling elements
    for (let y = h - 1; y >= 0; y--) {
      // Alternate X scan direction using integer step counter to prevent
      // directional bias. Replaces Math.floor(this.time * 60) which had
      // floating-point boundary artifacts at certain accumulated time values.
      const ltr = (y + this.simStepCount) % 2 === 0;
      const startX = ltr ? 0 : w - 1;
      const endX = ltr ? w : -1;
      const stepX = ltr ? 1 : -1;

      for (let x = startX; x !== endX; x += stepX) {
        const idx = y * w + x;
        const elem = this.grid[idx];
        if (elem === ELEMENT.EMPTY) continue;

        totalActive++;
        if (this.visited[idx]) continue;

        switch (elem) {
          case ELEMENT.SAND:
          case ELEMENT.ASH:
            this.updateFallingSolid(x, y, idx, elem);
            break;

          case ELEMENT.PUMICE:
            this.updatePumice(x, y, idx);
            break;

          case ELEMENT.WATER:
            this.updateLiquid(x, y, idx, elem, 4);
            break;

          case ELEMENT.LAVA:
            this.updateLava(x, y, idx);
            break;

          case ELEMENT.FIRE:
            this.updateFire(x, y, idx);
            break;

          case ELEMENT.STEAM:
          case ELEMENT.SMOKE:
            this.updateGas(x, y, idx, elem);
            break;

          case ELEMENT.SULFUR_GAS:
            this.updateSulfurGas(x, y, idx);
            break;

          case ELEMENT.MAGMA_CORE:
            // Continuous plutonic heat source
            this.heat[idx] = 1350;
            break;
        }
      }
    }

    this.activeParticles = totalActive;
  }

  updateFallingSolid(x, y, idx, elem) {
    const w = this.simWidth;
    const h = this.simHeight;
    if (y >= h - 1) return;

    const belowIdx = (y + 1) * w + x;
    const belowElem = this.grid[belowIdx];

    // Fall straight down through empty or light fluids
    if (belowElem === ELEMENT.EMPTY || belowElem === ELEMENT.WATER) {
      this.swap(idx, belowIdx);
      this.visited[belowIdx] = 1;
      return;
    }

    // Down-diagonal slide along angle of repose
    const dir = this.simRng() < 0.5 ? 1 : -1;
    const d1x = x + dir;
    const d2x = x - dir;

    if (d1x >= 0 && d1x < w) {
      const diag1 = (y + 1) * w + d1x;
      if (this.grid[diag1] === ELEMENT.EMPTY) {
        this.swap(idx, diag1);
        this.visited[diag1] = 1;
        return;
      }
    }

    if (d2x >= 0 && d2x < w) {
      const diag2 = (y + 1) * w + d2x;
      if (this.grid[diag2] === ELEMENT.EMPTY) {
        this.swap(idx, diag2);
        this.visited[diag2] = 1;
      }
    }
  }

  updatePumice(x, y, idx) {
    const w = this.simWidth;
    const h = this.simHeight;
    if (y >= h - 1) return;

    const belowIdx = (y + 1) * w + x;
    const belowElem = this.grid[belowIdx];

    // Porous Pumice physics: Density ~620 kg/m^3 is LESS than Water (1000 kg/m^3)
    // Therefore, Pumice FLOATS on Water, creating vast pumice rafts in the Bay!
    if (belowElem === ELEMENT.WATER) {
      // Float atop water: slide horizontally across water surface
      const floatDir = this.windSpeed >= 0 ? 1 : -1;
      const sideX = x + floatDir;
      if (sideX >= 0 && sideX < w) {
        const sideIdx = y * w + sideX;
        if (this.grid[sideIdx] === ELEMENT.EMPTY) {
          this.swap(idx, sideIdx);
          this.visited[sideIdx] = 1;
          return;
        }
      }
      return; // Rest comfortably floating atop water
    }

    // Otherwise behaves as lightweight granular tephra
    this.updateFallingSolid(x, y, idx, ELEMENT.PUMICE);
  }

  updateLiquid(x, y, idx, elem, spread) {
    const w = this.simWidth;
    const h = this.simHeight;
    if (y >= h - 1) return;

    // Fall straight down
    const belowIdx = (y + 1) * w + x;
    if (this.grid[belowIdx] === ELEMENT.EMPTY) {
      this.swap(idx, belowIdx);
      this.visited[belowIdx] = 1;
      return;
    }

    // Down-diagonal flow
    const dir = this.simRng() < 0.5 ? 1 : -1;
    const d1 = x + dir;
    const d2 = x - dir;

    if (d1 >= 0 && d1 < w && this.grid[(y + 1) * w + d1] === ELEMENT.EMPTY) {
      this.swap(idx, (y + 1) * w + d1);
      this.visited[(y + 1) * w + d1] = 1;
      return;
    }

    if (d2 >= 0 && d2 < w && this.grid[(y + 1) * w + d2] === ELEMENT.EMPTY) {
      this.swap(idx, (y + 1) * w + d2);
      this.visited[(y + 1) * w + d2] = 1;
      return;
    }

    // Lateral spreading
    for (let s = 1; s <= spread; s++) {
      const lx = x + dir * s;
      if (lx >= 0 && lx < w && this.grid[y * w + lx] === ELEMENT.EMPTY) {
        this.swap(idx, y * w + lx);
        this.visited[y * w + lx] = 1;
        return;
      }
    }
  }

  updateLava(x, y, idx) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Contact interactions: Water + Lava -> Violent Phreatomagmatic Flashing!
    const neighbors = [
      (y - 1) * w + x,
      (y + 1) * w + x,
      y * w + (x - 1),
      y * w + (x + 1)
    ];

    for (const nIdx of neighbors) {
      if (nIdx >= 0 && nIdx < w * h) {
        if (this.grid[nIdx] === ELEMENT.WATER) {
          // Instant explosive phase change!
          this.grid[idx] = ELEMENT.BASALT;
          this.grid[nIdx] = ELEMENT.STEAM;
          this.heat[idx] = 450;
          this.heat[nIdx] = 280;
          this.triggerShockwave(x, y, 25);
          this.audio.playSteamHiss();
          return;
        }
      }
    }

    // Viscous fluid motion governed by magma viscosity
    const moveProb = 1.0 / (1.0 + this.magmaViscosity * 0.18);
    if (this.simRng() < moveProb) {
      this.updateLiquid(x, y, idx, ELEMENT.LAVA, 1);
    }
  }

  updateFire(x, y, idx) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Rapid thermal dissipation into smoke
    if (this.simRng() < 0.28) {
      this.grid[idx] = this.simRng() < 0.45 ? ELEMENT.SMOKE : ELEMENT.EMPTY;
      return;
    }

    // Rise upward
    if (y > 0) {
      const upX = x + Math.floor((this.simRng() - 0.5) * 3 + this.windSpeed * 0.3);
      if (upX >= 0 && upX < w) {
        const upIdx = (y - 1) * w + upX;
        if (this.grid[upIdx] === ELEMENT.EMPTY) {
          this.swap(idx, upIdx);
          this.visited[upIdx] = 1;
        }
      }
    }
  }

  updateGas(x, y, idx, elem) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Dissipate at ceiling or with age
    if (y <= 1 || this.simRng() < (elem === ELEMENT.STEAM ? 0.012 : 0.006)) {
      this.grid[idx] = ELEMENT.EMPTY;
      return;
    }

    // Convective ascent with atmospheric wind drift
    const upX = x + Math.floor((this.simRng() - 0.5) * 2.5 + this.windSpeed * 0.6);
    const upY = y - 1;

    if (upX >= 0 && upX < w && upY >= 0) {
      const targetIdx = upY * w + upX;
      if (this.grid[targetIdx] === ELEMENT.EMPTY) {
        this.swap(idx, targetIdx);
        this.visited[targetIdx] = 1;
      }
    }
  }

  updateSulfurGas(x, y, idx) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Sulfur gas (SO2/H2S) is heavy (density 1.88 kg/m3) -> sinks into ravines!
    if (y < h - 1 && this.simRng() < 0.35) {
      const belowIdx = (y + 1) * w + x;
      if (this.grid[belowIdx] === ELEMENT.EMPTY) {
        this.swap(idx, belowIdx);
        this.visited[belowIdx] = 1;
        return;
      }
    }

    // Lateral drift with wind
    const driftX = x + (this.windSpeed >= 0 ? 1 : -1);
    if (driftX >= 0 && driftX < w && this.simRng() < 0.4) {
      const sideIdx = y * w + driftX;
      if (this.grid[sideIdx] === ELEMENT.EMPTY) {
        this.swap(idx, sideIdx);
        this.visited[sideIdx] = 1;
      }
    }
  }

  swap(i1, i2) {
    const tempElem = this.grid[i1];
    const tempHeat = this.heat[i1];
    this.grid[i1] = this.grid[i2];
    this.heat[i1] = this.heat[i2];
    this.grid[i2] = tempElem;
    this.heat[i2] = tempHeat;
  }

  // ==========================================================================
  // SECTION 10: KINEMATICS, BALLISTICS & CONVECTIVE PLUME EVOLUTION
  // ==========================================================================

  updateKinematics(dt) {
    const config = PHASE_CONFIG[this.currentPhase];
    const ventX = this.ventX;
    const ventY = this.ventY;

    // 1. Spawn Volcanic Bombs based on phase bomb rate
    if (config && config.bombRate > 0) {
      if (this.simRng() < config.bombRate * dt * 2.5) {
        const ejectionSpeed = 12 + this.simRng() * 22;
        const angle = -Math.PI * 0.5 + (this.simRng() - 0.5) * 0.95;
        const vx = Math.cos(angle) * ejectionSpeed;
        const vy = Math.sin(angle) * ejectionSpeed;
        const radius = 2.0 + this.simRng() * 3.5;
        this.bombs.push(new VolcanicBomb(ventX + (this.simRng() - 0.5) * 6, ventY - 4, vx, vy, radius, 1050, this.simRng));
      }
    }

    // 2. Spawn Convective Plume Column Particles
    const gameplayPlume = this.mission && this.mission.mode === MODE.GAMEPLAY;
    const spawnPerKm = gameplayPlume ? READABILITY.plumeSpawnPerKm : 1.8;
    const plumeCap = gameplayPlume ? READABILITY.plumeCap : 8000;
    let plumeSpawnRate = Math.floor(this.plumeHeightKm * spawnPerKm);
    if (gameplayPlume && this.plumeHeightKm >= 2) {
      plumeSpawnRate = Math.max(2, plumeSpawnRate);
    }
    plumeSpawnRate = Math.min(plumeSpawnRate, Math.max(0, plumeCap - this.plumeParticles.length));
    for (let p = 0; p < plumeSpawnRate; p++) {
      const vx = (this.simRng() - 0.5) * 3.0 + this.windSpeed * 0.4;
      const vy = -(6.0 + this.plumeHeightKm * 0.85 + this.simRng() * 4.0);
      this.plumeParticles.push(new PlumeParticle(ventX + (this.simRng() - 0.5) * 8, ventY - 2, vx, vy, false, this.simRng));
    }

    // 3. Volcanic Lightning Generation within Plume
    if (config && config.lightningRate > 0) {
      if (this.simRng() < config.lightningRate * dt * 3.5) {
        const lx1 = ventX + (this.simRng() - 0.5) * 45 + this.windSpeed * 8;
        const ly1 = Math.max(10, ventY - 25 - this.simRng() * (this.plumeHeightKm * 2.5));
        const lx2 = lx1 + (this.simRng() - 0.5) * 35;
        const ly2 = ly1 + 18 + this.simRng() * 35;
        this.lightningBolts.push(new VolcanicLightning(lx1, ly1, lx2, ly2, this.simRng));
        this.audio.playLightningCrack();
      }
    }

    // 4. Update Volcanic Bombs & Handle Ground Impact
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.update(dt, this.simWidth, this.simHeight, this.windSpeed, this.elevationMap);

      if (bomb.impacted) {
        // Crater excavation & deposit hot tephra in CA grid
        const bx = Math.floor(bomb.x);
        const by = Math.floor(bomb.y);
        this.excavateCrater(bx, by, bomb.radius * 1.5, bomb.isPumice ? ELEMENT.PUMICE : ELEMENT.BASALT);
        const frags = bomb.createFragments();
        this.bombFragments.push(...frags);
        if (this.mission && this.mission.mode === MODE.GAMEPLAY && this.bombFragments.length > READABILITY.fragmentCap) {
          this.bombFragments.splice(0, this.bombFragments.length - READABILITY.fragmentCap);
        }
        this.audio.playExplosion(0.35);
      }

      if (!bomb.alive) {
        this.bombs.splice(i, 1);
      }
    }

    // Update Bomb Fragments
    for (let i = this.bombFragments.length - 1; i >= 0; i--) {
      const frag = this.bombFragments[i];
      frag.update(dt, this.simWidth, this.simHeight, this.elevationMap);
      if (!frag.alive) {
        this.bombFragments.splice(i, 1);
      }
    }

    // 5. Update Pyroclastic Density Currents (PDCs)
    for (let i = this.pdcs.length - 1; i >= 0; i--) {
      const pdc = this.pdcs[i];
      pdc.update(dt, this.elevationMap, this.simWidth);

      // Scorch terrain & deposit thick ignimbrite ash in CA grid
      if (this.simRng() < 0.25) {
        const px = Math.floor(pdc.x);
        const py = Math.floor(pdc.y);
        if (px >= 0 && px < this.simWidth && py >= 0 && py < this.simHeight) {
          const idx = py * this.simWidth + px;
          if (this.grid[idx] === ELEMENT.EMPTY) {
            this.grid[idx] = ELEMENT.ASH;
            this.heat[idx] = pdc.temp;
          }
        }
      }

      if (!pdc.alive) {
        this.pdcs.splice(i, 1);
      } else {
        const bx = Math.floor(pdc.x);
        if (this.barrierMask && bx >= 0 && bx < this.barrierMask.length && this.barrierMask[bx]) {
          pdc.vx *= Math.pow(0.55, dt * 60);
          pdc.life += dt * 1.8;
        }
      }
    }

    // 6. Update Convective Plume Column
    const neutralBuoyancyY = Math.max(8, ventY - this.plumeHeightKm * 3.8);
    const bayCullX = this.waterlineX - READABILITY.bayCullMargin;
    const bayCullY = this.simHeight * READABILITY.bayCullYFrac;
    const gameplayPlumeUpdate = this.mission && this.mission.mode === MODE.GAMEPLAY;
    for (let i = this.plumeParticles.length - 1; i >= 0; i--) {
      const p = this.plumeParticles[i];
      p.update(dt, this.windSpeed, neutralBuoyancyY);
      if (gameplayPlumeUpdate && p.x > bayCullX && p.y > bayCullY) p.alive = false;
      if (!p.alive) {
        this.plumeParticles.splice(i, 1);
      }
    }

    // 7. Update Lightning Bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.update(dt);
      if (!bolt.alive) {
        this.lightningBolts.splice(i, 1);
      }
    }

    // 8. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt);
      if (!sw.alive) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 9. Update Roman Naval Evacuation Fleet (sandbox auto-loop; gameplay is ticked separately)
    if (!this.mission || this.mission.mode !== MODE.GAMEPLAY) {
      const pumiceFall = this.currentPhase >= PHASE.SUB_PLINIAN ? 1.8 : 0;
      for (const galley of this.fleet) {
        galley.update(dt, pumiceFall);
      }
    }
  }

  excavateCrater(cx, cy, radius, depositElem = ELEMENT.BASALT) {
    const w = this.simWidth;
    const h = this.simHeight;
    const rInt = Math.ceil(radius);

    for (let dy = -rInt; dy <= rInt; dy++) {
      for (let dx = -rInt; dx <= rInt; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const px = cx + dx;
          const py = cy + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = py * w + px;
            if (dx * dx + dy * dy < radius) {
              this.grid[idx] = ELEMENT.FIRE;
              this.heat[idx] = 950;
            } else if (this.grid[idx] === ELEMENT.STONE || this.grid[idx] === ELEMENT.SAND) {
              this.grid[idx] = depositElem;
              this.heat[idx] = 500;
            }
          }
        }
      }
    }
  }
  // ==========================================================================
  // SECTION 11: RENDERING PIPELINE & MULTI-LAYER COMPOSITION
  // ==========================================================================

  render(ctx) {
    if (!ctx) return;
    const w = this.canvas ? this.canvas.width : this.width;
    const h = this.canvas ? this.canvas.height : this.height;

    ctx.save();
    // Apply screen shake
    if (this.screenShake > 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    // Layer 1: Atmospheric Sky (screen space so it always fills the canvas)
    this.renderAtmosphericSky(ctx, w, h);

    const gameplay = this.mission && this.mission.mode === MODE.GAMEPLAY;

    ctx.save();
    this.applyWorldCamera(ctx, w, h);

    // Layer 2: Distant Capri & Gulf Silhouette
    this.renderDistantIslands(ctx, w, h);

    // Layer 3: Cellular Automata Grid (Thermal Glow & Incandescence)
    this.renderCellularGrid(ctx, w, h);

    // Layer 4: Roman Coastal Settlements & Umbrella Pines
    this.renderSettlementsAndFlora(ctx, w, h);

    // Layer 5–8: kinematics. In mission mode the fleet is drawn last so ash cannot bury the boats.
    if (gameplay) {
      this.renderPyroclasticCurrents(ctx, w, h);
      this.renderPlumeCanopy(ctx, w, h);
      this.renderVolcanicBombs(ctx, w, h);
      this.renderVolcanicLightning(ctx, w, h);
      this.renderShockwaves(ctx, w, h);
      this.renderFleet(ctx, w, h);
      this.renderLandingMarks(ctx, w, h);
    } else {
      this.renderFleet(ctx, w, h);
      this.renderPyroclasticCurrents(ctx, w, h);
      this.renderPlumeCanopy(ctx, w, h);
      this.renderVolcanicBombs(ctx, w, h);
      this.renderVolcanicLightning(ctx, w, h);
      this.renderShockwaves(ctx, w, h);
    }
    ctx.restore();

    // Layer 11: Canvas Telemetry HUD & Historical Plinian Epigraphy
    if (this.showHUD) {
      this.renderHUD(ctx, w, h);
    } else if (this.mission && this.mission.mode === MODE.GAMEPLAY && this.mission.status !== STATUS.PLAYING) {
      // renderHUD supplies the CSS-pixel transform on the other path.
      const uiScale = this.uiScale();
      ctx.save();
      ctx.scale(uiScale, uiScale);
      this.renderMissionOverlay(ctx, w / uiScale, h / uiScale);
      ctx.restore();
    }

    if (gameplay) this.renderMissionCoachBanner(ctx, w, h);

    // Layer 12: Interactive Brush Cursor Indicator
    this.renderBrushCursor(ctx, w, h);

    ctx.restore();
  }

  renderAtmosphericSky(ctx, w, h) {
    const config = PHASE_CONFIG[this.currentPhase] || PHASE_CONFIG[0];
    const darkness = config.skyDarkness;

    // Gradient from pristine Mediterranean azure down to apocalyptic ash twilight
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    if (darkness < 0.3) {
      grad.addColorStop(0, '#1c4273');
      grad.addColorStop(0.6, '#46729e');
      grad.addColorStop(1, '#c29a68');
    } else if (darkness < 0.7) {
      grad.addColorStop(0, '#141724');
      grad.addColorStop(0.5, '#452c2c');
      grad.addColorStop(1, '#8f4a2d');
    } else {
      // Complete darkness: "Nox omnibus noctibus nigrior densiorque"
      grad.addColorStop(0, '#06070a');
      grad.addColorStop(0.5, '#1e1112');
      grad.addColorStop(1, '#571811');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  renderDistantIslands(ctx, w, h) {
    ctx.save();
    // Distant Isle of Capri & Sorrento Peninsula silhouette
    ctx.fillStyle = 'rgba(28, 38, 54, 0.45)';
    ctx.beginPath();
    ctx.moveTo(w * 0.65, h * 0.68);
    ctx.quadraticCurveTo(w * 0.78, h * 0.63, w * 0.88, h * 0.68);
    ctx.quadraticCurveTo(w * 0.94, h * 0.64, w, h * 0.69);
    ctx.lineTo(w, h * 0.74);
    ctx.lineTo(w * 0.65, h * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderCellularGrid(ctx, w, h) {
    if (!this.offscreenCtx || !this.imgData) return;

    const data = this.imgData.data;
    const simW = this.simWidth;
    const simH = this.simHeight;
    const timeVal = this.time;

    let ptr = 0;
    for (let i = 0; i < this.cellCount; i++) {
      const elem = this.grid[i];
      const rgba = PALETTE[elem] || PALETTE[ELEMENT.EMPTY];

      let r = rgba[0];
      let g = rgba[1];
      let b = rgba[2];
      const a = rgba[3];

      // Dynamic incandescence and heat flicker for Molten Lava & Fire
      if (elem === ELEMENT.LAVA) {
        const flicker = (Math.sin(i * 0.28 + timeVal * 12) + 1) * 18;
        r = Math.min(255, r + flicker);
        g = Math.min(255, g + flicker * 0.45);
      } else if (elem === ELEMENT.FIRE) {
        r = 255;
        g = Math.floor(160 + Math.random() * 95);
        b = Math.floor(Math.random() * 40);
      } else if (elem === ELEMENT.WATER) {
        // Shimmering Bay of Naples waves
        const wave = Math.sin((i % simW) * 0.18 + timeVal * 4) * 12;
        b = Math.min(255, Math.max(0, b + wave));
      }

      data[ptr] = r;
      data[ptr + 1] = g;
      data[ptr + 2] = b;
      data[ptr + 3] = a;
      ptr += 4;
    }

    this.offscreenCtx.putImageData(this.imgData, 0, 0);

    // Blit scaled up to main canvas with crisp pixelation
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.offscreenCanvas, 0, 0, w, h);
  }

  renderSettlementsAndFlora(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;

    ctx.save();

    // 1. Herculaneum (Coastal port settlement near x = 180)
    const hercX = 182 * scaleX;
    const hercY = (this.elevationMap[182] || (this.simHeight - 32)) * scaleY;
    this.drawRomanVilla(ctx, hercX, hercY, 'Herculaneum');

    // 2. Pompeii (Flank Roman Forum & Basilica near x = 145)
    const pompX = 146 * scaleX;
    const pompY = (this.elevationMap[146] || (this.simHeight - 34)) * scaleY;
    this.drawRomanVilla(ctx, pompX, pompY, 'Pompeii');

    // 3. Stabiae (Villa of Pomponianus, east bay — the evacuation objective)
    const stabX = MISSION_NUMBERS.stabiaeX;
    const stabY = (this.elevationMap[stabX] || (this.simHeight - 28)) * scaleY;
    const gameplay = this.mission && this.mission.mode === MODE.GAMEPLAY;
    const stabTarget = gameplay && this.mission.selectedShip != null;
    this.drawRomanVilla(ctx, stabX * scaleX, stabY, 'Stabiae', stabTarget);
    if (gameplay) {
      this.drawStabiaeRefugees(ctx, stabX * scaleX, stabY);
      const ox = MISSION_NUMBERS.offloadX * scaleX;
      const oy = (this.simHeight - 28) * scaleY;
      ctx.fillStyle = '#C8BCA6';
      ctx.fillRect(ox - 12, oy - 5, 24, 7);
      ctx.fillStyle = '#7EE0D6';
      ctx.font = 'bold 9px serif';
      ctx.textAlign = 'center';
      ctx.fillText('Misenum quay', ox, oy + 16);
    }

    // 4. Umbrella Pines (Pinus Pinea) on the peaceful mountain slopes
    const treeSites = [75, 95, 115, 162, 205];
    for (const tx of treeSites) {
      const ty = (this.elevationMap[tx] || (this.simHeight - 30)) * scaleY;
      this.drawUmbrellaPineTree(ctx, tx * scaleX, ty);
    }

    ctx.restore();
  }

  drawRomanVilla(ctx, x, y, name, highlight = false) {
    ctx.save();
    ctx.translate(x, y);
    if (highlight) {
      ctx.strokeStyle = 'rgba(255, 213, 74, 0.95)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, -8, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 213, 74, 0.16)';
      ctx.beginPath();
      ctx.arc(0, -8, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stone podium
    ctx.fillStyle = '#C8BCA6';
    ctx.fillRect(-12, -4, 24, 4);

    // Classical Marble Colonnade
    ctx.fillStyle = '#EAE2D2';
    for (let c = -9; c <= 9; c += 6) {
      ctx.fillRect(c, -16, 2.5, 12);
    }

    // Roman Terracotta Tile Roof (Tegula & Imbrex)
    ctx.fillStyle = '#A3462A';
    ctx.beginPath();
    ctx.moveTo(-15, -16);
    ctx.lineTo(0, -24);
    ctx.lineTo(15, -16);
    ctx.closePath();
    ctx.fill();

    // Latin Settlement Marker
    ctx.fillStyle = highlight ? '#FFD54A' : '#D4AF37';
    ctx.font = highlight ? 'bold 12px serif' : '8px serif';
    ctx.textAlign = 'center';
    ctx.fillText(highlight ? `CLICK · ${name.toUpperCase()}` : name, 0, 10);

    ctx.restore();
  }

  drawStabiaeRefugees(ctx, x, y) {
    const remaining = Math.max(0, this.mission.civiliansAtStabiae);
    const dots = Math.min(18, Math.ceil(remaining / 10));
    ctx.save();
    ctx.translate(x, y + 14);
    for (let i = 0; i < dots; i++) {
      const ox = -16 + (i % 9) * 4;
      const oy = Math.floor(i / 9) * 5;
      ctx.fillStyle = remaining < 40 ? '#8B1E2D' : '#F5E6C8';
      ctx.fillRect(ox, oy, 2.5, 4);
    }
    ctx.fillStyle = '#D4AF37';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(remaining)} cives`, 0, 18);
    ctx.restore();
  }

  drawUmbrellaPineTree(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Bare trunk arching high (authentic Pinus Pinea form)
    ctx.strokeStyle = '#4A3525';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-1, -14, 0, -22);
    ctx.stroke();

    // Flat parasol canopy atop trunk
    ctx.fillStyle = '#264A2F';
    ctx.beginPath();
    ctx.ellipse(0, -24, 9, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderFleet(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    const gameplay = this.mission && this.mission.mode === MODE.GAMEPLAY;
    for (const galley of this.fleet) {
      const spriteScale = galleyDrawScale(gameplay);
      galley.render(ctx, scaleX, scaleY, spriteScale);
      if (gameplay && galley.alive) {
        ctx.save();
        ctx.fillStyle = galley.selected ? '#FFD54A' : '#F5E6C8';
        ctx.strokeStyle = 'rgba(10, 14, 22, 0.75)';
        const labelZoom = gameplay ? (this.simWidth / this.worldView().w) : 1;
        // Floors are absolute pixel counts, so they have to be expressed in
        // backing pixels or the labels shrink by the device pixel ratio.
        const ui = this.uiScale();
        const fontPx = Math.max(8 * ui, Math.round((2.4 * scaleX) / labelZoom));
        ctx.font = `bold ${fontPx}px serif`;
        ctx.lineWidth = Math.max(1, 2 * ui / labelZoom);
        ctx.textAlign = 'center';
        const lx = galley.x * scaleX;
        const ly = galley.y * scaleY + 16 * spriteScale;
        const label = galley.isFlagship ? 'MINERVA' : galley.name.split(' ')[0].toUpperCase();
        ctx.strokeText(label, lx, ly);
        ctx.fillText(label, lx, ly);
        if (galley.cargo > 0) {
          ctx.fillStyle = '#72D572';
          ctx.fillText(`${Math.floor(galley.cargo)} aboard`, lx, ly + Math.max(10 * ui, 2.5 * scaleX / labelZoom));
        }
        ctx.restore();
      }
    }
    if (gameplay) this.renderMissionCoachWorld(ctx, w, h);
  }

  renderPyroclasticCurrents(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    for (const pdc of this.pdcs) {
      pdc.render(ctx, scaleX, scaleY);
    }
  }

  renderPlumeCanopy(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    const hideBay = this.mission && this.mission.mode === MODE.GAMEPLAY;
    const bayX = this.waterlineX - READABILITY.bayCullMargin;
    const bayY = this.simHeight * READABILITY.bayCullYFrac;
    for (const p of this.plumeParticles) {
      if (hideBay && p.x > bayX && p.y > bayY) continue;
      p.render(ctx, scaleX, scaleY);
    }
  }

  renderVolcanicBombs(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    for (const b of this.bombs) {
      b.render(ctx, scaleX, scaleY);
    }
    for (const f of this.bombFragments) {
      f.render(ctx, scaleX, scaleY);
    }
  }

  renderVolcanicLightning(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    for (const bolt of this.lightningBolts) {
      bolt.render(ctx, scaleX, scaleY);
    }
  }

  renderShockwaves(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    for (const s of this.shockwaves) {
      s.render(ctx, scaleX, scaleY);
    }
  }

  // ==========================================================================
  // SECTION 12: CANVAS TELEMETRY HUD & HISTORICAL PLINIAN EPIGRAPHY
  // ==========================================================================

  renderHUD(ctx, w, h) {
    const config = PHASE_CONFIG[this.currentPhase] || PHASE_CONFIG[0];
    const gameplayHud = this.mission && this.mission.mode === MODE.GAMEPLAY;

    ctx.save();
    // Draw the HUD in CSS pixels. Every size below is a fixed pixel count, so
    // on a 3x phone an 11px title used to land at 3.7 CSS px — unreadable.
    const uiScale = this.uiScale();
    ctx.scale(uiScale, uiScale);
    w /= uiScale;
    h /= uiScale;

    // A phone canvas is ~390 CSS px wide: the title and the right-hand
    // telemetry collide long before that, so drop to the short forms.
    const narrow = w < 560;

    // 1. Top Bar: Title & Eruption Status
    ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
    const barH = gameplayHud ? (narrow ? 46 : 56) : 40;
    ctx.fillRect(12, 10, w - 24, barH);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 10, w - 24, barH);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px serif';
    let title;
    if (gameplayHud) {
      title = narrow ? 'EVACUATE STABIAE' : 'EVACUATE STABIAE — CLASSIS MISENENSIS, AD 79';
    } else {
      title = narrow ? 'MONS VESUVIUS AD 79' : 'MONS VESUVIUS AD 79 — PLINIAN VOLCANOLOGY SIMULATOR';
    }
    ctx.fillText(title, 22, 26);

    ctx.fillStyle = '#E5DAC4';
    ctx.font = '9px monospace';
    if (gameplayHud) {
      const threat = threatMeter(this.mission, this.currentPhase, pdcHitsX(this.pdcs, MISSION_NUMBERS.stabiaeX, MISSION_NUMBERS.pdcTownRadius));
      if (!narrow) ctx.fillText(this.mission.objective, 22, 40);
      ctx.fillStyle = '#72D572';
      const progress = `RESCUED ${Math.floor(this.mission.rescued)} / ${this.mission.quota} CITIZENS · STABIAE ${Math.ceil(this.mission.civiliansAtStabiae)} · THREAT ${Math.round(threat * 100)}%`;
      ctx.fillText(progress, 22, narrow ? 42 : 54);
    } else {
      ctx.fillText(`PHASE ${this.currentPhase}: ${config.name.toUpperCase()} (${config.latin})`, 22, 40);
    }

    // Top Bar Right: VEI & Plume Telemetry. No room for a second column on a
    // phone — the progress line is what the mission is actually scored on.
    if (!narrow) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFB300';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`VEI INDEX: ${this.vei} / 8`, w - 24, 26);
      ctx.fillStyle = '#A0AEC0';
      ctx.font = '9px monospace';
      ctx.fillText(`PLUME: ${this.plumeHeightKm.toFixed(1)} KM | MASS: ${(this.massEruptionRate / 1e6).toFixed(1)} MT/S`, w - 24, 40);
      ctx.textAlign = 'left';
    }

    // 2. Seismograph Graph Widget (Bottom-Left). The bay sits in the bottom
    // rows of the world, so on a phone this 175px box lands on the fleet and
    // the Misenum quay while eating half the width.
    if (!narrow) {
      this.seismograph.render(ctx, 12, h - 85, 175, 68);
    }

    // 3. Eyewitness Latin Scroll — sandbox only. In mission mode it covered the bay fleet.
    if (!gameplayHud) {
      const scrollW = Math.min(380, w * 0.46);
      const scrollH = 68;
      const scrollX = w - scrollW - 12;
      const scrollY = h - scrollH - 17;

      ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
      ctx.strokeStyle = '#D4AF37';
      ctx.fillRect(scrollX, scrollY, scrollW, scrollH);
      ctx.strokeRect(scrollX, scrollY, scrollW, scrollH);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('C. PLINIUS SECUNDUS — EPISTULAE VI.16', scrollX + 8, scrollY + 12);

      ctx.fillStyle = '#F5E6C8';
      ctx.font = 'italic 9px serif';
      ctx.fillText(`"${config.excerpt}"`, scrollX + 8, scrollY + 28);

      let totalRescued = 0;
      for (const g of this.fleet) totalRescued += Math.floor(g.rescuedCount);
      ctx.fillStyle = '#72D572';
      ctx.font = '8px monospace';
      ctx.fillText(`FLEET RESCUED: ${totalRescued} ROMAN CITIZENS | FLEET: ${this.fleet.length} GALLEYS`, scrollX + 8, scrollY + 54);
    }

    if (gameplayHud) this.renderMissionOverlay(ctx, w, h);

    ctx.restore();
  }

  renderLandingMarks(ctx, w, h) {
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    const n = MISSION_NUMBERS;
    const waterY = (this.simHeight - 28) * scaleY;
    const villaY = (this.elevationMap[n.stabiaeX] || (this.simHeight - 28)) * scaleY;
    const selected = this.mission.selectedShip != null ? this.fleet[this.mission.selectedShip] : null;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
    const zoom = this.simWidth / this.worldView().w;

    ctx.save();
    // Rings are in sim cells; the bay camera already zooms them. Keep them
    // beach-sized so they do not swallow the galleys as sea clutter.
    const stabR = (selected ? 8 : 6.5) * scaleX;
    ctx.strokeStyle = selected ? `rgba(255, 213, 74, ${0.55 + 0.4 * pulse})` : 'rgba(212, 175, 55, 0.9)';
    ctx.lineWidth = Math.max(1, (selected ? 2.4 : 1.8) / zoom);
    ctx.setLineDash(selected ? [6, 4] : [4, 3]);
    ctx.beginPath();
    ctx.arc(n.stabiaeX * scaleX, waterY, stabR, 0, Math.PI * 2);
    ctx.stroke();
    if (selected) {
      ctx.fillStyle = `rgba(255, 213, 74, ${0.12 + 0.1 * pulse})`;
      ctx.beginPath();
      ctx.arc(n.stabiaeX * scaleX, waterY, stabR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(80, 200, 190, 0.95)';
    ctx.lineWidth = Math.max(1, 1.8 / zoom);
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(n.offloadX * scaleX, waterY, 6 * scaleX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const fontPx = Math.max(8 * this.uiScale(), Math.round((2.4 * scaleX) / zoom));
    ctx.font = `bold ${fontPx}px serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = selected ? '#FFD54A' : '#D4AF37';
    ctx.fillText(selected ? 'CLICK · STABIAE' : 'STABIAE', n.stabiaeX * scaleX, villaY - 28);
    ctx.fillStyle = '#7EE0D6';
    ctx.fillText('OFFLOAD', n.offloadX * scaleX, waterY - 16);
    ctx.restore();
  }

  renderMissionCoachBanner(ctx, w, h) {
    if (!this.mission || this.mission.status !== STATUS.PLAYING) return;
    const selected = this.mission.selectedShip != null ? this.fleet[this.mission.selectedShip] : null;
    const hasShip = !!(selected && selected.alive);
    const { prompt, sub } = missionCoachCopy(hasShip);

    ctx.save();
    const uiScale = this.uiScale();
    ctx.scale(uiScale, uiScale);
    w /= uiScale;
    h /= uiScale;

    const font = Math.max(18, Math.round(w * 0.02));
    const boxW = Math.min(w - 40, Math.max(360, w * 0.62));
    const boxH = font * 2.55;
    const boxX = (w - boxW) / 2;
    const boxY = 74;

    ctx.fillStyle = 'rgba(12, 10, 8, 0.82)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = '#FFD54A';
    ctx.font = `bold ${font}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(prompt, w / 2, boxY + font + 4);
    ctx.fillStyle = '#E5DAC4';
    ctx.font = `${Math.max(11, Math.round(font * 0.55))}px serif`;
    ctx.fillText(sub, w / 2, boxY + font * 2.05);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  renderMissionCoachWorld(ctx, w, h) {
    if (!this.mission || this.mission.status !== STATUS.PLAYING) return;
    const scaleX = w / this.simWidth;
    const scaleY = h / this.simHeight;
    const selected = this.mission.selectedShip != null ? this.fleet[this.mission.selectedShip] : null;
    const hasShip = selected && selected.alive;

    ctx.save();
    if (!hasShip) {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 3.4));
      for (let i = 0; i < this.fleet.length; i++) {
        const g = this.fleet[i];
        if (!g.alive) continue;
        const cx = g.x * scaleX;
        const cy = g.y * scaleY;
        const r = (11 + i * 1.5) * scaleX * 0.5;
        ctx.strokeStyle = `rgba(255, 213, 74, ${0.45 * pulse})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const n = MISSION_NUMBERS;
      const cx = selected.x * scaleX;
      const cy = selected.y * scaleY;
      const tx = n.stabiaeX * scaleX;
      const ty = (this.simHeight - 28) * scaleY;
      ctx.strokeStyle = 'rgba(255, 213, 74, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  renderMissionOverlay(ctx, w, h) {
    this.overlayButton = null;
    if (!this.mission || this.mission.status === STATUS.PLAYING) return;
    const won = this.mission.status === STATUS.WON;
    const boxW = Math.min(420, w * 0.72);
    const boxH = 168;
    const boxX = (w - boxW) / 2;
    const boxY = (h - boxH) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 16, 0.9)';
    ctx.strokeStyle = won ? '#D4AF37' : '#E57373';
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    let title = 'STABIAE SERVED';
    let body = `Rescued ${Math.floor(this.mission.rescued)} citizens. The fleet made port.`;
    if (!won) {
      if (this.mission.loseReason === LOSE_REASON.FLEET) {
        title = 'CLASSIS AMISSA';
        body = 'All rescue galleys were sunk by pyroclastic density currents.';
      } else if (this.mission.loseReason === LOSE_REASON.TOWN) {
        title = 'STABIAE DELETA';
        body = 'The villa and its people were buried before the fleet could save them.';
      } else {
        title = 'CALIGO PERPETUA';
        body = 'The mountain collapsed. The bay is gone. Quota unmet.';
      }
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#D4AF37' : '#FF8A65';
    ctx.font = 'bold 18px serif';
    ctx.fillText(title, w / 2, boxY + 42);
    ctx.fillStyle = '#F5E6C8';
    ctx.font = '13px serif';
    ctx.fillText(body, w / 2, boxY + 74);
    ctx.fillStyle = '#B0A58A';
    ctx.font = '11px monospace';
    ctx.fillText('R · Restart mission', w / 2, boxY + 100);

    const btnW = 180;
    const btnH = 32;
    const btnX = w / 2 - btnW / 2;
    const btnY = boxY + 118;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px serif';
    ctx.fillText('Restart', w / 2, btnY + 21);
    ctx.textAlign = 'left';
    ctx.restore();
    // Callers draw this in CSS pixels; onMouseDown hit-tests in backing pixels.
    const s = this.uiScale();
    this.overlayButton = { x: btnX * s, y: btnY * s, w: btnW * s, h: btnH * s };
  }

  renderBrushCursor(ctx, w, h) {
    if (!this.mousePos) return;
    const gameplay = this.mission && this.mission.mode === MODE.GAMEPLAY && this.mission.status === STATUS.PLAYING;
    if (gameplay && this.mission.tool !== TOOL.PAINT && this.mission.selectedShip == null) return;
    const selected = gameplay && this.mission.selectedShip != null;
    const scaleX = w / this.simWidth;

    ctx.save();
    if (selected) {
      ctx.strokeStyle = '#FFD54A';
      ctx.lineWidth = 2;
      const r = Math.max(12, 4 * scaleX);
      ctx.beginPath();
      ctx.moveTo(this.mousePos.x - r, this.mousePos.y);
      ctx.lineTo(this.mousePos.x + r, this.mousePos.y);
      ctx.moveTo(this.mousePos.x, this.mousePos.y - r);
      ctx.lineTo(this.mousePos.x, this.mousePos.y + r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (gameplay) {
      ctx.strokeStyle = 'rgba(255, 213, 74, 0.85)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, Math.max(14, 5 * scaleX), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, Math.max(0, this.brushSize * scaleX), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  // ==========================================================================
  // SECTION 13: INTERACTION, BRUSH TOOLS & EVENT DISPATCHERS
  // ==========================================================================

  onMouseDown(pos) {
    this.mousePos = pos;
    this.audio.ensureContext();

    if (this.mission && this.mission.mode === MODE.GAMEPLAY) {
      if (this.mission.status !== STATUS.PLAYING) {
        const btn = this.overlayButton;
        if (!btn || (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h)) {
          this.reset();
        }
        this.isDrawing = false;
        return;
      }

      const { gx, gy } = this.toSim(pos);
      if (this.mission.tool === TOOL.BARRIER) {
        const placed = this.placeBarrier(gx, gy);
        this.isDrawing = false;
        if (!placed) {
          this.mission.tool = TOOL.ORDER;
          this.syncMissionHud();
        }
        return;
      }

      const shipHit = this.hitShipIndex(gx, gy, READABILITY.galleyHitRadius);
      const landmark = this.missionLandmark(gx, gy);
      // Landmark wins only when it is at least as close as any hull, so a
      // second galley can still be selected after the first.
      if (this.mission.selectedShip != null && landmark) {
        if (shipHit < 0) {
          this.orderSelectedShip(gx);
          this.isDrawing = false;
          return;
        }
        const hull = this.fleet[shipHit];
        const dShip = (gx - hull.x) * (gx - hull.x) + (gy - hull.y) * (gy - hull.y);
        if (landmark.dist2 <= dShip) {
          this.orderSelectedShip(gx);
          this.isDrawing = false;
          return;
        }
      }

      if (shipHit >= 0) {
        this.selectShip(shipHit);
        this.isDrawing = false;
        return;
      }

      if (this.mission.selectedShip != null) {
        this.orderSelectedShip(gx);
        this.isDrawing = false;
        return;
      }

      // Mission gameplay with ORDER tool: missed click is a no-op — do not paint lava into the bay!
      if (this.mission.tool === TOOL.ORDER) {
        this.isDrawing = false;
        return;
      }
    }

    this.isDrawing = true;
    this.paint(pos);
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    if (this.isDrawing) {
      this.paint(pos);
    }
  }

  onMouseUp() {
    this.isDrawing = false;
  }

  onWheel(deltaY) {
    if (deltaY < 0) {
      this.brushSize = Math.min(16, this.brushSize + 1);
    } else {
      this.brushSize = Math.max(1, this.brushSize - 1);
    }
    if (this.controlsContainer) {
      const brushVal = this.controlsContainer.querySelector('#brush-val');
      const brushSlider = this.controlsContainer.querySelector('#brush-slider');
      if (brushVal) brushVal.textContent = `${this.brushSize}px`;
      if (brushSlider) brushSlider.value = this.brushSize;
    }
  }

  onContextMenu(pos) {
    if (this.mission && this.mission.mode === MODE.GAMEPLAY) return;
    // Localized Phreatomagmatic blast trigger on right click
    const { gx, gy } = this.toSim(pos);
    this.triggerShockwave(Math.floor(gx), Math.floor(gy), 45);
    this.excavateCrater(Math.floor(gx), Math.floor(gy), 6, ELEMENT.FIRE);
  }

  onKeyDown(key) {
    const k = (key || '').toLowerCase();
    const gameplay = this.mission && this.mission.mode === MODE.GAMEPLAY;

    if (gameplay) {
      if (k === '1' || k === '2' || k === '3') {
        this.selectShip(parseInt(k, 10) - 1);
        return;
      }
      if (k === 'v') {
        this.ventChamber();
        return;
      }
      if (k === 'b') {
        this.toggleBarrierTool();
        return;
      }
      if (k === 'escape') {
        this.selectShip(null);
        this.mission.tool = TOOL.ORDER;
        this.syncMissionHud();
        return;
      }
      if (k === 'arrowleft' || k === 'arrowright') {
        const idx = this.mission.selectedShip;
        if (idx != null && this.fleet[idx] && this.fleet[idx].alive) {
          const delta = k === 'arrowleft' ? -10 : 10;
          const origin = this.fleet[idx].orderedX ?? this.fleet[idx].x;
          this.orderSelectedShip(origin + delta);
        }
        return;
      }
    }

    switch (k) {
      case '1':
        this.selectedElement = ELEMENT.LAVA;
        break;
      case '2':
        this.selectedElement = ELEMENT.WATER;
        break;
      case '3':
        this.selectedElement = ELEMENT.PUMICE;
        break;
      case '4':
        this.selectedElement = ELEMENT.BASALT;
        break;
      case '5':
        this.selectedElement = ELEMENT.SAND;
        break;
      case '6':
        this.selectedElement = ELEMENT.ASH;
        break;
      case '7':
        this.selectedElement = ELEMENT.MAGMA_CORE;
        break;
      case '8':
        this.selectedElement = ELEMENT.SULFUR_GAS;
        break;
      case '0':
      case 'e':
        this.selectedElement = ELEMENT.EMPTY;
        break;
      case 'p':
        this.isPaused = !this.isPaused;
        break;
      case 'h':
        this.showHUD = !this.showHUD;
        break;
      case 'u':
        if (!gameplay) this.setEruptionPhase(PHASE.ULTRA_PLINIAN);
        break;
      case 'c':
        if (!gameplay) this.setEruptionPhase(PHASE.COLUMN_COLLAPSE);
        break;
      case 'r':
        this.reset();
        break;
    }
  }

  onKeyUp() {
    // Event contract compliance
  }

  paint(pos) {
    const w = this.simWidth;
    const h = this.simHeight;
    const { gx: sgx, gy: sgy } = this.toSim(pos);
    const gx = Math.floor(sgx);
    const gy = Math.floor(sgy);
    const r = this.brushSize;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const px = gx + dx;
          const py = gy + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = py * w + px;
            this.grid[idx] = this.selectedElement;
            const props = ELEMENT_PROPS[this.selectedElement];
            if (props) this.heat[idx] = props.baseTemp;
          }
        }
      }
    }
  }

  // ==========================================================================
  // SECTION 14: LIFECYCLE, RESIZE, RESET & ENTITY TELEMETRY
  // ==========================================================================

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  /**
   * Backing-store pixels per CSS pixel. Screen-space chrome (HUD, coach banner,
   * result overlay) is drawn through this so its fixed pixel sizes stay the
   * same physical size on a high-density display.
   */
  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  reset() {
    const mode = this.mission ? this.mission.mode : MODE.GAMEPLAY;
    this.mission = createMission(mode);
    this.barrierMask = new Uint8Array(this.simWidth);
    this.ventedPressureRelief = 0;
    this.overlayButton = null;
    this.buildVolcanoTerrain();
    this.initFleet();
    this.bombs = [];
    this.bombFragments = [];
    this.pdcs = [];
    this.plumeParticles = [];
    this.lightningBolts = [];
    this.shockwaves = [];
    this.time = 0;
    this.simAccumulator = 0;
    this.simStepCount = 0;
    this.simRng = mulberry32((Math.random() * 0xFFFFFFFF) >>> 0);
    this.isPaused = false;
    this.setEruptionPhase(PHASE.DORMANT);
    this.syncMissionHud();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.bombs = [];
    this.bombFragments = [];
    this.pdcs = [];
    this.plumeParticles = [];
    this.lightningBolts = [];
    this.shockwaves = [];
    this.fleet = [];
    if (this.audio && this.audio.ctx) {
      try {
        this.audio.ctx.close();
      } catch {
        // Guard
      }
    }
  }

  getEntityCount() {
    // Total count of active simulated elements and kinematic bodies
    return (
      this.activeParticles +
      this.bombs.length +
      this.bombFragments.length +
      this.pdcs.length +
      this.plumeParticles.length +
      this.lightningBolts.length +
      this.shockwaves.length +
      this.fleet.length
    );
  }
}
