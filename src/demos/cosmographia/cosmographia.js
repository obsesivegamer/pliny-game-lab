/**
 * Pliny Game Lab — Cosmographia (Celestial Mechanics & Planetarium)
 * Pavilion IV: Cosmographia & Caelestia
 *
 * "Mundum, et hoc quodcumque nomine alio caelum appellare libuit,
 *  cuius circumflexu degunt cuncta, numen esse credi par est,
 *  aeternum, immensum, neque genitum neque interiturum umquam."
 *  — C. Plinius Secundus, Naturalis Historia, Liber II.i
 *
 * Monumental Celestial Mechanics & Planetarium simulation featuring:
 *  1. Dual Cosmological Models (Book II of Pliny's Naturalis Historia):
 *     - Ptolemaic Geocentric System (Almagest & Pliny):
 *       Earth at center, Eccentric center, Equant point with constant angular velocity,
 *       Epicycles generating authentic retrograde loops (Mars, Venus, Jupiter, Saturn),
 *       and 8 concentric crystalline spheres (Moon to Firmament).
 *     - Keplerian Heliocentric System (Harmonia Mundi):
 *       Elliptic orbits r = a(1 - e^2) / (1 + e*cos(theta)), Kepler's Second Law
 *       (area speed constancy via Newton-Raphson solver for Kepler's equation M = E - e*sin(E)),
 *       full classical system: Sol, Mercurius, Venus, Terra & Luna, Mars (Phobos/Deimos),
 *       Jupiter (Io, Europa, Ganymede, Callisto), Saturn (Titan + 3D tilted rings).
 *  2. Pythagorean Harmonia Mundi (Musica Universalis):
 *     - Harmonic resonance lines connecting planetary pairs at harmonic intervals (2:1, 3:2, 4:3, 5:4, 8:5).
 *     - Sacred geometry Spirograph webbing (Rose of Venus 8:5 pentagram, Mars-Earth cardioids).
 *  3. Celestial Sphere & Visual Presentation:
 *     - 800+ twinkling stars with accurate celestial coordinates, magnitudes, and spectral classes.
 *     - 12 Zodiacal Constellations with golden asterism lines and Latin epigraphy.
 *     - Ecliptic plane band (obliquity 23.44°) with Solstices and Equinoxes.
 *     - Celestial Equator, Colures, and 25,772-year Precession circle.
 *     - 3D perspective projection with smooth pitch/yaw camera orbit and target tracking.
 *     - Cyber-Classical palette: Obsidian (#07090E), Imperial Gold (#D4AF37), Cyan Starlight (#3BD6C6),
 *       Deep Roman Crimson (#8B1E2D), Ethereal Violet (#6C5CE7).
 *  4. Full Interactive Controls & Canvas HUD telemetry overlay.
 *  5. Pure ES Module, safe headless DOM guard, zero external dependencies.
 */

// ============================================================================
// ASTRONOMICAL CONSTANTS & HISTORICAL DATA TABLES
// ============================================================================

export const J2000_EPOCH_JD = 2451545.0; // Standard Julian Epoch
export const PLINIAN_EPOCH_JD = 1749000.0; // Approximate epoch of Pliny's Naturalis Historia (~77 AD)
export const TROPICAL_YEAR_DAYS = 365.242189;
export const SYNODIC_MONTH_DAYS = 29.530589;
export const SIDEREAL_MONTH_DAYS = 27.321661;
export const EARTH_AXIAL_TILT_RAD = 23.43928 * (Math.PI / 180); // Obliquity of the ecliptic
export const PRECESSION_PERIOD_YEARS = 25772; // Great Platonic Year

/**
 * 12 Zodiacal Constellations with Latin designations, classical boundaries,
 * and authentic star asterism coordinates (Right Ascension in degrees, Declination in degrees).
 */
export const ZODIAC_CONSTELLATIONS = [
  {
    id: 'aries',
    name: 'Aries',
    latin: 'Aries (Aries - Ram)',
    symbol: '♈',
    color: '#E0564C',
    eclipticStart: 0,
    eclipticEnd: 30,
    stars: [
      { name: 'Hamal (α Ari)', ra: 31.79, dec: 23.46, mag: 2.0 },
      { name: 'Sheratan (β Ari)', ra: 28.66, dec: 20.81, mag: 2.64 },
      { name: 'Mesarthim (γ Ari)', ra: 27.91, dec: 19.29, mag: 3.88 },
      { name: 'Botein (δ Ari)', ra: 47.90, dec: 19.72, mag: 4.35 }
    ],
    lines: [[0, 1], [1, 2], [0, 3]]
  },
  {
    id: 'taurus',
    name: 'Taurus',
    latin: 'Taurus (Taurus - Bull)',
    symbol: '♉',
    color: '#E67E22',
    eclipticStart: 30,
    eclipticEnd: 60,
    stars: [
      { name: 'Aldebaran (α Tau)', ra: 68.98, dec: 16.51, mag: 0.85 },
      { name: 'Elnath (β Tau)', ra: 81.57, dec: 28.61, mag: 1.65 },
      { name: 'Alcyone (Pleiades)', ra: 56.87, dec: 24.11, mag: 2.87 },
      { name: 'Hyadum I (γ Tau)', ra: 64.95, dec: 15.63, mag: 3.65 },
      { name: 'Ain (ε Tau)', ra: 67.15, dec: 19.18, mag: 3.53 },
      { name: 'Tianguan (ζ Tau)', ra: 84.41, dec: 21.14, mag: 2.97 }
    ],
    lines: [[0, 3], [3, 4], [4, 0], [0, 5], [4, 1], [3, 2]]
  },
  {
    id: 'gemini',
    name: 'Gemini',
    latin: 'Gemini (Gemini - Twins)',
    symbol: '♊',
    color: '#F1C40F',
    eclipticStart: 60,
    eclipticEnd: 90,
    stars: [
      { name: 'Pollux (β Gem)', ra: 116.14, dec: 28.03, mag: 1.14 },
      { name: 'Castor (α Gem)', ra: 113.65, dec: 31.89, mag: 1.58 },
      { name: 'Alhena (γ Gem)', ra: 99.43, dec: 16.40, mag: 1.93 },
      { name: 'Wasat (δ Gem)', ra: 110.03, dec: 21.98, mag: 3.53 },
      { name: 'Mebsuta (ε Gem)', ra: 100.98, dec: 25.13, mag: 3.06 },
      { name: 'Tejat (μ Gem)', ra: 95.74, dec: 22.51, mag: 2.87 }
    ],
    lines: [[1, 0], [1, 4], [4, 5], [0, 3], [3, 2], [4, 3]]
  },
  {
    id: 'cancer',
    name: 'Cancer',
    latin: 'Cancer (Cancer - Crab)',
    symbol: '♋',
    color: '#2ECC71',
    eclipticStart: 90,
    eclipticEnd: 120,
    stars: [
      { name: 'Al Tarf (β Cnc)', ra: 124.13, dec: 9.19, mag: 3.52 },
      { name: 'Acubens (α Cnc)', ra: 134.58, dec: 11.86, mag: 4.25 },
      { name: 'Asellus Australis (δ Cnc)', ra: 131.17, dec: 18.15, mag: 3.94 },
      { name: 'Asellus Borealis (γ Cnc)', ra: 130.83, dec: 21.47, mag: 4.66 },
      { name: 'Tegmine (ζ Cnc)', ra: 123.04, dec: 17.65, mag: 4.67 }
    ],
    lines: [[0, 2], [2, 3], [2, 1], [3, 4]]
  },
  {
    id: 'leo',
    name: 'Leo',
    latin: 'Leo (Leo - Lion)',
    symbol: '♌',
    color: '#D4AF37',
    eclipticStart: 120,
    eclipticEnd: 150,
    stars: [
      { name: 'Regulus (α Leo)', ra: 152.09, dec: 11.97, mag: 1.36 },
      { name: 'Denebola (β Leo)', ra: 177.26, dec: 14.57, mag: 2.14 },
      { name: 'Algieba (γ Leo)', ra: 154.99, dec: 19.84, mag: 2.01 },
      { name: 'Zosma (δ Leo)', ra: 168.53, dec: 20.52, mag: 2.56 },
      { name: 'Chertan (θ Leo)', ra: 168.66, dec: 15.43, mag: 3.32 },
      { name: 'Adhafera (ζ Leo)', ra: 154.17, dec: 23.42, mag: 3.44 }
    ],
    lines: [[0, 2], [2, 5], [2, 3], [3, 1], [3, 4], [4, 0]]
  },
  {
    id: 'virgo',
    name: 'Virgo',
    latin: 'Virgo (Virgo - Virgin)',
    symbol: '♍',
    color: '#1ABC9C',
    eclipticStart: 150,
    eclipticEnd: 180,
    stars: [
      { name: 'Spica (α Vir)', ra: 201.30, dec: -11.16, mag: 0.98 },
      { name: 'Zavijava (β Vir)', ra: 177.67, dec: 1.77, mag: 3.61 },
      { name: 'Porrima (γ Vir)', ra: 190.42, dec: -1.45, mag: 2.74 },
      { name: 'Auva (δ Vir)', ra: 193.90, dec: 3.40, mag: 3.39 },
      { name: 'Vindemiatrix (ε Vir)', ra: 195.54, dec: 10.96, mag: 2.85 },
      { name: 'Heze (ζ Vir)', ra: 203.87, dec: -0.60, mag: 3.38 }
    ],
    lines: [[1, 2], [2, 3], [3, 4], [2, 0], [0, 5], [3, 5]]
  },
  {
    id: 'libra',
    name: 'Libra',
    latin: 'Libra (Libra - Scales)',
    symbol: '♎',
    color: '#3498DB',
    eclipticStart: 180,
    eclipticEnd: 210,
    stars: [
      { name: 'Zubeneschamali (β Lib)', ra: 229.25, dec: -9.38, mag: 2.61 },
      { name: 'Zubenelgenubi (α Lib)', ra: 222.72, dec: -16.04, mag: 2.75 },
      { name: 'Zubenelakrab (γ Lib)', ra: 233.88, dec: -14.79, mag: 3.91 },
      { name: 'Brachium (σ Lib)', ra: 226.01, dec: -25.28, mag: 3.25 }
    ],
    lines: [[1, 0], [0, 2], [2, 3], [3, 1]]
  },
  {
    id: 'scorpio',
    name: 'Scorpius',
    latin: 'Scorpius (Scorpio - Scorpion)',
    symbol: '♏',
    color: '#C0392B',
    eclipticStart: 210,
    eclipticEnd: 240,
    stars: [
      { name: 'Antares (α Sco)', ra: 247.35, dec: -26.43, mag: 0.96 },
      { name: 'Shaula (λ Sco)', ra: 263.40, dec: -37.10, mag: 1.62 },
      { name: 'Sargas (θ Sco)', ra: 264.33, dec: -42.99, mag: 1.86 },
      { name: 'Dschubba (δ Sco)', ra: 240.08, dec: -22.62, mag: 2.29 },
      { name: 'Acrab (β Sco)', ra: 241.36, dec: -19.81, mag: 2.56 },
      { name: 'Wei (ε Sco)', ra: 252.05, dec: -34.29, mag: 2.29 }
    ],
    lines: [[4, 3], [3, 0], [0, 5], [5, 2], [2, 1]]
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    latin: 'Sagittarius (Sagittarius - Archer)',
    symbol: '♐',
    color: '#9B59B6',
    eclipticStart: 240,
    eclipticEnd: 270,
    stars: [
      { name: 'Kaus Australis (ε Sgr)', ra: 276.04, dec: -34.38, mag: 1.79 },
      { name: 'Nunki (σ Sgr)', ra: 283.82, dec: -26.30, mag: 2.05 },
      { name: 'Ascella (ζ Sgr)', ra: 285.65, dec: -29.88, mag: 2.60 },
      { name: 'Kaus Media (δ Sgr)', ra: 275.24, dec: -29.83, mag: 2.72 },
      { name: 'Kaus Borealis (λ Sgr)', ra: 276.99, dec: -25.42, mag: 2.82 },
      { name: 'Alnasl (γ Sgr)', ra: 271.45, dec: -30.42, mag: 2.98 }
    ],
    lines: [[5, 3], [3, 0], [0, 4], [4, 3], [3, 2], [2, 1], [4, 1], [0, 2]]
  },
  {
    id: 'capricorn',
    name: 'Capricornus',
    latin: 'Capricornus (Capricorn - Sea-Goat)',
    symbol: '♑',
    color: '#7F8C8D',
    eclipticStart: 270,
    eclipticEnd: 300,
    stars: [
      { name: 'Deneb Algedi (δ Cap)', ra: 326.76, dec: -16.13, mag: 2.85 },
      { name: 'Dabih (β Cap)', ra: 305.27, dec: -14.78, mag: 3.05 },
      { name: 'Algedi (α Cap)', ra: 304.49, dec: -12.54, mag: 3.58 },
      { name: 'Nashira (γ Cap)', ra: 324.97, dec: -16.66, mag: 3.67 },
      { name: 'Oculus (π Cap)', ra: 306.81, dec: -18.22, mag: 5.08 }
    ],
    lines: [[2, 1], [1, 4], [4, 3], [3, 0], [0, 2]]
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    latin: 'Aquarius (Aquarius - Water-Bearer)',
    symbol: '♒',
    color: '#00B4D8',
    eclipticStart: 300,
    eclipticEnd: 330,
    stars: [
      { name: 'Sadalsuud (β Aqr)', ra: 323.79, dec: -5.57, mag: 2.90 },
      { name: 'Sadalmelik (α Aqr)', ra: 331.45, dec: -0.32, mag: 2.95 },
      { name: 'Skat (δ Aqr)', ra: 343.66, dec: -15.82, mag: 3.27 },
      { name: 'Sadachbia (γ Aqr)', ra: 335.41, dec: -1.39, mag: 3.86 },
      { name: 'Albali (ε Aqr)', ra: 311.98, dec: -9.50, mag: 3.78 }
    ],
    lines: [[4, 0], [0, 1], [1, 3], [3, 2]]
  },
  {
    id: 'pisces',
    name: 'Pisces',
    latin: 'Pisces (Pisces - Fishes)',
    symbol: '♓',
    color: '#3BD6C6',
    eclipticStart: 330,
    eclipticEnd: 360,
    stars: [
      { name: 'Alrescha (α Psc)', ra: 30.50, dec: 2.76, mag: 3.82 },
      { name: 'Fumalsamakah (β Psc)', ra: 345.96, dec: 3.82, mag: 4.48 },
      { name: 'Torcular (ο Psc)', ra: 26.27, dec: 9.15, mag: 4.26 },
      { name: 'Linteum (η Psc)', ra: 22.95, dec: 15.35, mag: 3.62 },
      { name: 'Simmah (γ Psc)', ra: 349.25, dec: 3.28, mag: 3.70 }
    ],
    lines: [[1, 4], [4, 0], [0, 2], [2, 3]]
  }
];

/**
 * Major historical navigation and magnitude calibration stars.
 */
export const MAJOR_STELLAR_CATALOG = [
  { name: 'Sirius (α CMa)', ra: 101.28, dec: -16.71, mag: -1.46, spectral: 'A1V', color: '#DEEDFF' },
  { name: 'Canopus (α Car)', ra: 95.98, dec: -52.69, mag: -0.74, spectral: 'A9II', color: '#F8F9FA' },
  { name: 'Arcturus (α Boo)', ra: 213.91, dec: 19.18, mag: -0.05, spectral: 'K1III', color: '#FFD2A1' },
  { name: 'Vega (α Lyr)', ra: 279.23, dec: 38.78, mag: 0.03, spectral: 'A0V', color: '#F0F8FF' },
  { name: 'Capella (α Aur)', ra: 79.17, dec: 45.99, mag: 0.08, spectral: 'G3III', color: '#FFF4E8' },
  { name: 'Rigel (β Ori)', ra: 78.63, dec: -8.20, mag: 0.18, spectral: 'B8Ia', color: '#D6E5FF' },
  { name: 'Procyon (α CMi)', ra: 114.82, dec: 5.22, mag: 0.40, spectral: 'F5IV', color: '#FFF8F0' },
  { name: 'Betelgeuse (α Ori)', ra: 88.79, dec: 7.40, mag: 0.45, spectral: 'M1Ia', color: '#FFA07A' },
  { name: 'Achernar (α Eri)', ra: 24.42, dec: -57.24, mag: 0.45, spectral: 'B6Vep', color: '#CCE2FF' },
  { name: 'Altair (α Aql)', ra: 297.69, dec: 8.86, mag: 0.77, spectral: 'A7V', color: '#F5FAFF' },
  { name: 'Polaris (α UMi - Cynosura)', ra: 37.95, dec: 89.26, mag: 1.98, spectral: 'F7Ib', color: '#FFF9F2' },
  { name: 'Thuban (α Dra - Ancient Pole)', ra: 211.09, dec: 64.37, mag: 3.65, spectral: 'A0III', color: '#F0F5FF' },
  { name: 'Deneb (α Cyg)', ra: 310.35, dec: 45.28, mag: 1.25, spectral: 'A2Ia', color: '#EBF3FF' },
  { name: 'Fomalhaut (α PsA)', ra: 344.41, dec: -29.62, mag: 1.17, spectral: 'A3V', color: '#EFF5FF' }
];

/**
 * Pythagorean Musica Universalis Harmonic Interval definitions:
 * Expressed as frequency ratios, corresponding musical chords, and sacred geometry spirograph ratios.
 */
export const HARMONIA_MUNDI_INTERVALS = [
  { name: 'Diapason (Octave)', ratio: 2 / 1, fraction: '2:1', p: 2, q: 1, color: '#D4AF37' },
  { name: 'Diapente (Perfect Fifth)', ratio: 3 / 2, fraction: '3:2', p: 3, q: 2, color: '#3BD6C6' },
  { name: 'Diatessaron (Perfect Fourth)', ratio: 4 / 3, fraction: '4:3', p: 4, q: 3, color: '#6C5CE7' },
  { name: 'Ditonus (Major Third)', ratio: 5 / 4, fraction: '5:4', p: 5, q: 4, color: '#E67E22' },
  { name: 'Semiditonus (Minor Third)', ratio: 6 / 5, fraction: '6:5', p: 6, q: 5, color: '#2ECC71' },
  { name: 'Aurea Pentagramma (Rose of Venus)', ratio: 8 / 5, fraction: '8:5', p: 8, q: 5, color: '#FF7675' },
  { name: 'Mysterium Cosmographicum (Golden Mean)', ratio: 13 / 8, fraction: '13:8', p: 13, q: 8, color: '#F1C40F' },
  { name: 'Major Semitone', ratio: 16 / 15, fraction: '16:15', p: 16, q: 15, color: '#9B59B6' }
];

// ============================================================================
// MATHEMATICAL HELPER FUNCTIONS (TRIGONOMETRY, KEPLER, 3D PROJECTION)
// ============================================================================

/**
 * Normalizes an angle into [0, 2*PI).
 */
export function normalizeAngle(rad) {
  let a = rad % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

/**
 * Solves Kepler's Equation M = E - e*sin(E) for Eccentric Anomaly E via Newton-Raphson.
 */
export function solveKepler(M, e, tolerance = 1e-6, maxIter = 25) {
  M = normalizeAngle(M);
  let E = e > 0.8 ? Math.PI : M;
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    if (Math.abs(fPrime) < 1e-12) break;
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < tolerance) break;
  }
  return E;
}

/**
 * Converts Right Ascension (degrees) and Declination (degrees) on a celestial sphere of radius R
 * to equatorial Cartesian coordinates (X, Y, Z).
 */
export function celestialToCartesian(raDeg, decDeg, radius = 2400) {
  const raRad = raDeg * (Math.PI / 180);
  const decRad = decDeg * (Math.PI / 180);
  const cosDec = Math.cos(decRad);
  return {
    x: radius * cosDec * Math.cos(raRad),
    y: radius * Math.sin(decRad), // Y is celestial North Pole
    z: radius * cosDec * Math.sin(raRad)
  };
}

/**
 * 3D Vector transformation applying Camera Yaw (azimuth) and Pitch (elevation).
 */
export function rotate3D(point, yaw, pitch) {
  // Rotate around Y-axis (Yaw / Azimuth)
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  const y1 = point.y;

  // Rotate around X-axis (Pitch / Elevation)
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  return { x: x1, y: y2, z: z2 };
}

/**
 * 3D to 2D Perspective Projection with viewport bounds checking and focal scaling.
 */
export function project3D(point3D, camera, viewportWidth, viewportHeight) {
  const focalLength = 1100;
  const cameraZ = camera.distance || 850;
  const rotated = rotate3D(point3D, camera.yaw, camera.pitch);

  const zEffective = rotated.z + cameraZ;
  if (zEffective <= 20) {
    return { x: 0, y: 0, scale: 0, visible: false, zDepth: zEffective };
  }

  const factor = (focalLength / zEffective) * camera.zoom;
  const screenX = viewportWidth * 0.5 + camera.panX + rotated.x * factor;
  const screenY = viewportHeight * 0.5 + camera.panY - rotated.y * factor; // Invert Y for screen canvas coords

  return {
    x: screenX,
    y: screenY,
    scale: Math.max(0.001, factor),
    visible: isFinite(screenX) && isFinite(screenY),
    zDepth: zEffective
  };
}

// ============================================================================
// MAIN ENGINE CLASS: CosmographiaEngine
// ============================================================================

export class CosmographiaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Simulation Clock
    this.simDays = 0; // Elapsed simulation days from J2000 epoch
    this.timeRate = 12.0; // Simulation days per real-time second
    this.isPaused = false;
    this.elapsedRealTime = 0;

    // Camera 3D Orbital Model
    this.camera = {
      yaw: 0.45, // Azimuth radians
      pitch: 0.48, // Elevation radians (tilted oblique perspective)
      distance: 980, // Viewport camera distance
      zoom: 1.0,
      panX: 0,
      panY: 0,
      targetPanX: 0,
      targetPanY: 0,
      targetZoom: 1.0,
      focusTargetId: 'overview' // 'overview', 'terra', 'mars', 'venus', 'jupiter', 'saturn'
    };

    // User Interactive Mouse / Touch Dragging State
    this.isDragging = false;
    this.dragMode = 'orbit'; // 'orbit' or 'pan'
    this.lastMouse = { x: 0, y: 0 };
    this.mouseWorldPos = { x: 0, y: 0 };

    // Simulation Configuration & Model State
    this.state = {
      model: 'keplerian', // 'keplerian' or 'ptolemaic'
      trailPersistence: 450, // Point count buffer
      epicycleRatio: 1.0, // Multiplier for Ptolemaic epicycles
      equantEccentricity: 0.12, // Ptolemaic equant point offset ratio
      harmonicIntensity: 0.85, // Sacred geometry webbing opacity
      showConstellations: true,
      showGuides: true, // Deferent, equant, eccentric vectors
      showHarmonicWeb: true, // Spirograph orbital resonance curves
      showCrystallineSpheres: true, // Concentric celestial crystalline glass shells
      showEclipticGrid: true, // Ecliptic circle, Equator, Solstices, Equinoxes
      showStellarLabels: true,
      showMoons: true,
      showTelemetryHUD: true
    };

    // Historical & Geometric Data Buffers
    this.stars = [];
    this.keplerianBodies = [];
    this.ptolemaicSpheres = [];
    this.moons = [];
    this.harmonicWebLines = []; // Spirograph resonance chords buffer
    this.orbitalTrails = {}; // Body trails: Map<id, Array<{x,y,z}>>

    // Retrograde Motion Telemetry Cache
    this.retrogradeStates = {
      Mars: false,
      Venus: false,
      Jupiter: false,
      Saturn: false,
      Mercurius: false
    };
    this.apparentGeocentricLongitudes = {};
    this.apparentGeoPrev = {};

    // DOM UI cleanup references
    this.uiElements = [];

    // Initialize all astronomical models and DOM components
    this.initStellarFirmament();
    this.initPlanetaryModels();
    this.buildControls();
  }

  // ==========================================================================
  // STELLAR FIRMAMENT INITIALIZATION (800+ TWINKLING STARS)
  // ==========================================================================

  initStellarFirmament() {
    this.stars = [];

    // 1. Add Named Major Calibration Stars
    MAJOR_STELLAR_CATALOG.forEach((st) => {
      const pos = celestialToCartesian(st.ra, st.dec, 2400);
      this.stars.push({
        id: st.name,
        name: st.name,
        ra: st.ra,
        dec: st.dec,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        mag: st.mag,
        spectral: st.spectral,
        color: st.color,
        size: Math.max(1.5, (4.5 - st.mag) * 1.1),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.5 + Math.random() * 2.5,
        isMajor: true
      });
    });

    // 2. Add Zodiac Asterism Stars
    ZODIAC_CONSTELLATIONS.forEach((zod) => {
      zod.stars.forEach((zs, sIdx) => {
        const pos = celestialToCartesian(zs.ra, zs.dec, 2400);
        this.stars.push({
          id: `${zod.id}_${sIdx}`,
          name: zs.name,
          zodiacId: zod.id,
          ra: zs.ra,
          dec: zs.dec,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          mag: zs.mag,
          spectral: 'G2V',
          color: zod.color,
          size: Math.max(1.2, 3.8 - zs.mag * 0.6),
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 2.0 + Math.random() * 2.0,
          isConstellation: true
        });
      });
    });

    // 3. Generate Authentic Procedural Background Stars to reach 850+ total stars
    // Distribute with realistic spherical coordinate density (cos(dec) distribution)
    const neededStars = 850 - this.stars.length;
    for (let i = 0; i < neededStars; i++) {
      const ra = Math.random() * 360;
      // Inverse CDF for uniform sphere distribution: dec = asin(2*u - 1)
      const u = Math.random();
      const dec = (Math.asin(2 * u - 1) * 180) / Math.PI;
      const mag = 3.0 + Math.random() * 3.5;
      const pos = celestialToCartesian(ra, dec, 2400 + (Math.random() - 0.5) * 80);

      // Realistic spectral distribution: M-stars (red/orange) most common, O/B (blue) rare
      const rSpec = Math.random();
      let color = '#FFFFFF';
      let spectral = 'G';
      if (rSpec < 0.12) {
        color = '#B5D3FF';
        spectral = 'B';
      } else if (rSpec < 0.28) {
        color = '#EDF4FF';
        spectral = 'A';
      } else if (rSpec < 0.5) {
        color = '#FFF8EC';
        spectral = 'F';
      } else if (rSpec < 0.72) {
        color = '#FFE8C8';
        spectral = 'G';
      } else if (rSpec < 0.88) {
        color = '#FFD29D';
        spectral = 'K';
      } else {
        color = '#FFA980';
        spectral = 'M';
      }

      this.stars.push({
        id: `bg_star_${i}`,
        name: `Star ${i}`,
        ra,
        dec,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        mag,
        spectral,
        color,
        size: Math.max(0.6, 2.6 - mag * 0.35),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.0 + Math.random() * 3.0,
        isBackground: true
      });
    }
  }

  // ==========================================================================
  // PLANETARY & COSMOLOGICAL MODELS INITIALIZATION
  // ==========================================================================

  initPlanetaryModels() {
    this.orbitalTrails = {};
    this.harmonicWebLines = [];

    // ------------------------------------------------------------------------
    // A. HELIOCENTRIC KEPLERIAN BODIES (Harmonia Mundi)
    // ------------------------------------------------------------------------
    this.keplerianBodies = [
      {
        id: 'Sol',
        name: 'Sol (The Sun)',
        latin: 'Sol Pythius',
        symbol: '☉',
        color: '#FFD700',
        coreColor: '#FFF8DC',
        radius: 30,
        a: 0,
        e: 0,
        i: 0,
        period: 0,
        meanAnomaly0: 0,
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Mercurius',
        name: 'Mercurius (Mercury)',
        latin: 'Mercurius Cyllenius',
        symbol: '☿',
        color: '#C2B280',
        coreColor: '#DFD7C2',
        radius: 6,
        a: 75, // Scaled astronomical unit
        e: 0.2056,
        i: 7.0 * (Math.PI / 180),
        omegaNode: 48.33 * (Math.PI / 180),
        omegaPeri: 29.12 * (Math.PI / 180),
        period: 87.97, // Earth days
        meanAnomaly0: 174.79 * (Math.PI / 180),
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Venus',
        name: 'Venus (Lucifer / Vesper)',
        latin: 'Venus Genitrix',
        symbol: '♀',
        color: '#E8C37B',
        coreColor: '#FFF0D4',
        radius: 11,
        a: 135,
        e: 0.0067,
        i: 3.39 * (Math.PI / 180),
        omegaNode: 76.68 * (Math.PI / 180),
        omegaPeri: 54.88 * (Math.PI / 180),
        period: 224.70,
        meanAnomaly0: 50.11 * (Math.PI / 180),
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Terra',
        name: 'Terra & Luna (Earth & Moon)',
        latin: 'Terra Parens Mundi',
        symbol: '♁',
        color: '#4DA6FF',
        coreColor: '#E6F2FF',
        radius: 12,
        a: 200,
        e: 0.0167,
        i: 0.0,
        omegaNode: 0.0,
        omegaPeri: 102.94 * (Math.PI / 180),
        period: 365.25,
        meanAnomaly0: 357.53 * (Math.PI / 180),
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Mars',
        name: 'Mars (The Red Planet)',
        latin: 'Mars Gradivus',
        symbol: '♂',
        color: '#E74C3C',
        coreColor: '#FFA07A',
        radius: 8.5,
        a: 285,
        e: 0.0934,
        i: 1.85 * (Math.PI / 180),
        omegaNode: 49.56 * (Math.PI / 180),
        omegaPeri: 286.50 * (Math.PI / 180),
        period: 686.98,
        meanAnomaly0: 19.37 * (Math.PI / 180),
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Jupiter',
        name: 'Jupiter (The King)',
        latin: 'Iuppiter Optimus Maximus',
        symbol: '♃',
        color: '#E0A96D',
        coreColor: '#F5DEB3',
        radius: 22,
        a: 430,
        e: 0.0485,
        i: 1.30 * (Math.PI / 180),
        omegaNode: 100.46 * (Math.PI / 180),
        omegaPeri: 273.87 * (Math.PI / 180),
        period: 4332.59,
        meanAnomaly0: 20.02 * (Math.PI / 180),
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Saturn',
        name: 'Saturn (The Ringed Titan)',
        latin: 'Saturnus Senex',
        symbol: '♄',
        color: '#F4D03F',
        coreColor: '#FFF8DC',
        radius: 18,
        a: 570,
        e: 0.0555,
        i: 2.49 * (Math.PI / 180),
        omegaNode: 113.67 * (Math.PI / 180),
        omegaPeri: 339.39 * (Math.PI / 180),
        period: 10759.22,
        meanAnomaly0: 317.02 * (Math.PI / 180),
        hasRings: true,
        ringInner: 24,
        ringOuter: 46,
        x: 0,
        y: 0,
        z: 0
      }
    ];

    // Moons of the Solar System
    this.moons = [
      // Earth's Moon
      {
        id: 'Luna',
        parent: 'Terra',
        name: 'Luna',
        symbol: '☽',
        radius: 3.5,
        dist: 28,
        period: 27.32,
        color: '#E0E0E0',
        e: 0.0549,
        i: 5.14 * (Math.PI / 180),
        x: 0,
        y: 0,
        z: 0
      },
      // Mars Moons
      {
        id: 'Phobos',
        parent: 'Mars',
        name: 'Phobos',
        radius: 1.4,
        dist: 14,
        period: 0.318,
        color: '#D2B48C',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Deimos',
        parent: 'Mars',
        name: 'Deimos',
        radius: 1.1,
        dist: 20,
        period: 1.263,
        color: '#B0C4DE',
        x: 0,
        y: 0,
        z: 0
      },
      // Galilean Moons of Jupiter (Laplace Resonance: Io 1 : Europa 2 : Ganymede 4)
      {
        id: 'Io',
        parent: 'Jupiter',
        name: 'Io',
        radius: 2.6,
        dist: 34,
        period: 1.769,
        color: '#FFF275',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Europa',
        parent: 'Jupiter',
        name: 'Europa',
        radius: 2.3,
        dist: 46,
        period: 3.551,
        color: '#E8F1F5',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ganymede',
        parent: 'Jupiter',
        name: 'Ganymede',
        radius: 3.4,
        dist: 62,
        period: 7.155,
        color: '#B8B8B8',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Callisto',
        parent: 'Jupiter',
        name: 'Callisto',
        radius: 3.0,
        dist: 82,
        period: 16.689,
        color: '#8A7968',
        x: 0,
        y: 0,
        z: 0
      },
      // Saturn's Titan
      {
        id: 'Titan',
        parent: 'Saturn',
        name: 'Titan',
        radius: 3.5,
        dist: 68,
        period: 15.945,
        color: '#FFCC66',
        x: 0,
        y: 0,
        z: 0
      }
    ];

    // ------------------------------------------------------------------------
    // B. PTOLEMAIC GEOCENTRIC SPHERES (Almagest / Pliny Book II)
    // ------------------------------------------------------------------------
    // Concentric Crystalline Spheres from Moon out to Firmament of Fixed Stars:
    // Earth is at Center (with eccentric displacement and equant point).
    this.ptolemaicSpheres = [
      {
        id: 'Ptolemy_Earth',
        name: 'Terra (Geocenter)',
        latin: 'Terra Inmobilis',
        symbol: '♁',
        color: '#4DA6FF',
        radius: 14,
        deferentR: 0,
        epicycleR: 0,
        eccentricOffset: 0,
        period: 0,
        epiPeriod: 0,
        sphereName: 'Centrum Mundi',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Luna',
        name: 'Sphaera Lunae (Moon)',
        latin: 'Luna / Diana',
        symbol: '☽',
        color: '#E0E0E0',
        radius: 5,
        deferentR: 80,
        epicycleR: 20,
        eccentricOffset: 6,
        eccentricAngle: 0.1,
        period: 27.32,
        epiPeriod: 29.53,
        sphereName: 'I. Sphaera Lunae',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Mercurius',
        name: 'Sphaera Mercurii (Mercury)',
        latin: 'Mercurius / Stilbon',
        symbol: '☿',
        color: '#C2B280',
        radius: 6,
        deferentR: 135,
        epicycleR: 48,
        eccentricOffset: 12,
        eccentricAngle: 1.4,
        period: 365.25, // Centered on mean Sun direction
        epiPeriod: 115.88, // Synodic revolution on epicycle
        sphereName: 'II. Sphaera Mercurii',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Venus',
        name: 'Sphaera Veneris (Venus)',
        latin: 'Venus / Lucifer / Phosphorus',
        symbol: '♀',
        color: '#E8C37B',
        radius: 9,
        deferentR: 195,
        epicycleR: 110,
        eccentricOffset: 14,
        eccentricAngle: 0.8,
        period: 365.25, // Tied to Sun's mean longitude
        epiPeriod: 583.92, // Venus synodic period creating 5 retrograde loops
        sphereName: 'III. Sphaera Veneris',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Sol',
        name: 'Sphaera Solis (The Sun)',
        latin: 'Sol / Apollo / Titan',
        symbol: '☉',
        color: '#FFD700',
        radius: 18,
        deferentR: 280,
        epicycleR: 0, // In Ptolemaic theory, Sun has simple eccentric deferent
        eccentricOffset: 24,
        eccentricAngle: 1.15,
        period: 365.25,
        epiPeriod: 0,
        sphereName: 'IV. Sphaera Solis',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Mars',
        name: 'Sphaera Martis (Mars)',
        latin: 'Mars / Pyrois',
        symbol: '♂',
        color: '#E74C3C',
        radius: 8,
        deferentR: 375,
        epicycleR: 165,
        eccentricOffset: 38,
        eccentricAngle: 2.1,
        period: 686.98,
        epiPeriod: 779.94, // Synodic epicycle generates dramatic retrograde loops!
        sphereName: 'V. Sphaera Martis',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Jupiter',
        name: 'Sphaera Iovis (Jupiter)',
        latin: 'Iuppiter / Phaethon',
        symbol: '♃',
        color: '#E0A96D',
        radius: 16,
        deferentR: 475,
        epicycleR: 85,
        eccentricOffset: 42,
        eccentricAngle: 3.8,
        period: 4332.59,
        epiPeriod: 398.88,
        sphereName: 'VI. Sphaera Iovis',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Saturn',
        name: 'Sphaera Saturni (Saturn)',
        latin: 'Saturnus / Phainon',
        symbol: '♄',
        color: '#F4D03F',
        radius: 14,
        deferentR: 565,
        epicycleR: 55,
        eccentricOffset: 50,
        eccentricAngle: 5.2,
        period: 10759.22,
        epiPeriod: 378.09,
        sphereName: 'VII. Sphaera Saturni',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'Ptolemy_Firmamentum',
        name: 'Firmamentum (Fixed Stars)',
        latin: 'Octava Sphaera / Firmamentum',
        symbol: '⭐',
        color: '#3BD6C6',
        radius: 0,
        deferentR: 660,
        epicycleR: 0,
        eccentricOffset: 0,
        eccentricAngle: 0,
        period: 25772 * 365.25, // Precessional cycle
        epiPeriod: 0,
        sphereName: 'VIII. Primum Mobile / Firmamentum',
        x: 0,
        y: 0,
        z: 0
      }
    ];

    // Initialize trail history arrays for all bodies
    this.keplerianBodies.forEach((b) => (this.orbitalTrails[b.id] = []));
    this.ptolemaicSpheres.forEach((b) => (this.orbitalTrails[b.id] = []));
  }

  // ==========================================================================
  // INTERACTIVE DOM CONTROLS BUILDER (SAFE HEADLESS GUARDED)
  // ==========================================================================

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="cosmo-controls" style="display:flex; flex-direction:column; gap:12px; font-size:12px; color:#E6E8EE;">
        <!-- Cosmological System Switcher -->
        <div class="control-group">
          <label style="display:block; font-weight:700; margin-bottom:6px; color:#D4AF37; text-transform:uppercase; letter-spacing:1px;">
            Cosmological System (Pliny Lib. II)
          </label>
          <div class="control-btn-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <button class="sub-btn ${this.state.model === 'keplerian' ? 'active' : ''}" id="btn-model-kepler">
              ☀️ Keplerian (Heliocentric)
            </button>
            <button class="sub-btn ${this.state.model === 'ptolemaic' ? 'active' : ''}" id="btn-model-ptolemy">
              🌍 Ptolemaic (Geocentric)
            </button>
          </div>
        </div>

        <!-- Focus Camera Targets -->
        <div class="control-group">
          <label style="display:block; font-weight:700; margin-bottom:6px; color:#3BD6C6; letter-spacing:0.5px;">
            Celestial Focus & Observatory Target
          </label>
          <select id="sel-focus-target" style="width:100%; background:#12141C; border:1px solid rgba(212,175,55,0.35); color:#FFF; padding:6px 8px; border-radius:4px; font-family:inherit;">
            <option value="overview">🌌 Solar System Overview</option>
            <option value="Terra">🌍 Terra & Luna (Earth-Moon System)</option>
            <option value="Mars">♂ Mars (Retrograde Loops & Moons)</option>
            <option value="Venus">♀ Venus (Morning/Evening Star & Pentagram)</option>
            <option value="Jupiter">♃ Jupiter & 4 Galilean Moons</option>
            <option value="Saturn">♄ Saturn (Rings & Titan)</option>
            <option value="Sol">☀️ Sol (Solar Corona & Coronal Loops)</option>
          </select>
        </div>

        <!-- Sliders -->
        <div class="control-group">
          <label style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Simulation Time Rate</span>
            <span id="label-time-rate" style="color:#D4AF37; font-weight:bold;">${this.timeRate.toFixed(1)} days/s</span>
          </label>
          <input type="range" id="slider-time-rate" min="-50" max="50" step="1" value="${this.timeRate}" style="width:100%;">
        </div>

        <div class="control-group">
          <label style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Orbit Trail Persistence</span>
            <span id="label-trail-len" style="color:#3BD6C6; font-weight:bold;">${this.state.trailPersistence} pts</span>
          </label>
          <input type="range" id="slider-trail-len" min="50" max="1200" step="25" value="${this.state.trailPersistence}" style="width:100%;">
        </div>

        <div class="control-group" id="group-ptolemy-sliders" style="display:${this.state.model === 'ptolemaic' ? 'block' : 'none'};">
          <label style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Epicycle Radius Ratio</span>
            <span id="label-epi-ratio" style="color:#E0564C; font-weight:bold;">${this.state.epicycleRatio.toFixed(2)}x</span>
          </label>
          <input type="range" id="slider-epi-ratio" min="0.2" max="2.5" step="0.05" value="${this.state.epicycleRatio}" style="width:100%;">

          <label style="display:flex; justify-content:space-between; margin-top:8px; margin-bottom:4px;">
            <span>Equant Point Eccentricity</span>
            <span id="label-equant-ecc" style="color:#E0564C; font-weight:bold;">${this.state.equantEccentricity.toFixed(2)}</span>
          </label>
          <input type="range" id="slider-equant-ecc" min="0.0" max="0.45" step="0.01" value="${this.state.equantEccentricity}" style="width:100%;">
        </div>

        <div class="control-group" id="group-harmonia-slider" style="display:${this.state.model === 'keplerian' ? 'block' : 'none'};">
          <label style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Harmonia Mundi Web Intensity</span>
            <span id="label-harm-int" style="color:#D4AF37; font-weight:bold;">${Math.round(this.state.harmonicIntensity * 100)}%</span>
          </label>
          <input type="range" id="slider-harm-int" min="0" max="1" step="0.05" value="${this.state.harmonicIntensity}" style="width:100%;">
        </div>

        <!-- Visual Feature Toggles -->
        <div class="control-group">
          <label style="display:block; font-weight:700; margin-bottom:6px; color:#D4AF37;">Celestial Visual Layers</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <button class="sub-btn ${this.state.showConstellations ? 'active' : ''}" id="btn-toggle-zodiac">
              ✨ 12 Zodiacs
            </button>
            <button class="sub-btn ${this.state.showEclipticGrid ? 'active' : ''}" id="btn-toggle-ecliptic">
              🌐 Ecliptic & Grid
            </button>
            <button class="sub-btn ${this.state.showGuides ? 'active' : ''}" id="btn-toggle-guides">
              📐 Equant / Vectors
            </button>
            <button class="sub-btn ${this.state.showHarmonicWeb ? 'active' : ''}" id="btn-toggle-harm-web">
              🕸️ Spirograph Web
            </button>
            <button class="sub-btn ${this.state.showCrystallineSpheres ? 'active' : ''}" id="btn-toggle-spheres">
              🔮 Crystal Spheres
            </button>
            <button class="sub-btn ${this.state.showTelemetryHUD ? 'active' : ''}" id="btn-toggle-hud">
              📜 Plinian Telemetry
            </button>
          </div>
        </div>

        <!-- Celestial Presets & Actions -->
        <div class="control-group">
          <label style="display:block; font-weight:700; margin-bottom:6px; color:#3BD6C6;">Astronomical Alignments & Ephemeris</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <button class="sub-btn" id="btn-snap-solstice">☀️ Snap Solstice</button>
            <button class="sub-btn" id="btn-snap-equinox">⚖️ Snap Equinox</button>
            <button class="sub-btn" id="btn-snap-retrograde">⚡ Mars Retrograde</button>
            <button class="sub-btn" id="btn-venus-pentagram">🌹 Rose of Venus</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px;">
            <button class="sub-btn" id="btn-pause-sim">⏸️ Pause / Resume</button>
            <button class="sub-btn" id="btn-reset-cam">🔄 Reset Camera</button>
          </div>
        </div>
      </div>
    `;

    // ------------------------------------------------------------------------
    // ATTACH DOM EVENT LISTENERS
    // ------------------------------------------------------------------------
    const btnModelKepler = this.controlsContainer.querySelector('#btn-model-kepler');
    const btnModelPtolemy = this.controlsContainer.querySelector('#btn-model-ptolemy');
    const groupPtolemy = this.controlsContainer.querySelector('#group-ptolemy-sliders');
    const groupHarmonia = this.controlsContainer.querySelector('#group-harmonia-slider');

    const setCosmoModel = (mod) => {
      this.state.model = mod;
      if (btnModelKepler) btnModelKepler.classList.toggle('active', mod === 'keplerian');
      if (btnModelPtolemy) btnModelPtolemy.classList.toggle('active', mod === 'ptolemaic');
      if (groupPtolemy) groupPtolemy.style.display = mod === 'ptolemaic' ? 'block' : 'none';
      if (groupHarmonia) groupHarmonia.style.display = mod === 'keplerian' ? 'block' : 'none';
      this.harmonicWebLines = [];
      Object.keys(this.orbitalTrails).forEach((k) => (this.orbitalTrails[k] = []));
    };

    if (btnModelKepler) btnModelKepler.addEventListener('click', () => setCosmoModel('keplerian'));
    if (btnModelPtolemy) btnModelPtolemy.addEventListener('click', () => setCosmoModel('ptolemaic'));

    // Focus dropdown
    const selFocus = this.controlsContainer.querySelector('#sel-focus-target');
    if (selFocus) {
      selFocus.addEventListener('change', (e) => {
        this.camera.focusTargetId = e.target.value;
      });
    }

    // Time Rate Slider
    const sliderTime = this.controlsContainer.querySelector('#slider-time-rate');
    const lblTime = this.controlsContainer.querySelector('#label-time-rate');
    if (sliderTime && lblTime) {
      sliderTime.addEventListener('input', (e) => {
        this.timeRate = parseFloat(e.target.value);
        lblTime.textContent = `${this.timeRate.toFixed(1)} days/s`;
      });
    }

    // Trail length slider
    const sliderTrail = this.controlsContainer.querySelector('#slider-trail-len');
    const lblTrail = this.controlsContainer.querySelector('#label-trail-len');
    if (sliderTrail && lblTrail) {
      sliderTrail.addEventListener('input', (e) => {
        this.state.trailPersistence = parseInt(e.target.value, 10);
        lblTrail.textContent = `${this.state.trailPersistence} pts`;
      });
    }

    // Ptolemaic sliders
    const sliderEpi = this.controlsContainer.querySelector('#slider-epi-ratio');
    const lblEpi = this.controlsContainer.querySelector('#label-epi-ratio');
    if (sliderEpi && lblEpi) {
      sliderEpi.addEventListener('input', (e) => {
        this.state.epicycleRatio = parseFloat(e.target.value);
        lblEpi.textContent = `${this.state.epicycleRatio.toFixed(2)}x`;
      });
    }

    const sliderEquant = this.controlsContainer.querySelector('#slider-equant-ecc');
    const lblEquant = this.controlsContainer.querySelector('#label-equant-ecc');
    if (sliderEquant && lblEquant) {
      sliderEquant.addEventListener('input', (e) => {
        this.state.equantEccentricity = parseFloat(e.target.value);
        lblEquant.textContent = `${this.state.equantEccentricity.toFixed(2)}`;
      });
    }

    // Harmonia Mundi slider
    const sliderHarm = this.controlsContainer.querySelector('#slider-harm-int');
    const lblHarm = this.controlsContainer.querySelector('#label-harm-int');
    if (sliderHarm && lblHarm) {
      sliderHarm.addEventListener('input', (e) => {
        this.state.harmonicIntensity = parseFloat(e.target.value);
        lblHarm.textContent = `${Math.round(this.state.harmonicIntensity * 100)}%`;
      });
    }

    // Toggles
    const setupToggle = (btnId, key) => {
      const btn = this.controlsContainer.querySelector(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          this.state[key] = !this.state[key];
          btn.classList.toggle('active', this.state[key]);
        });
      }
    };

    setupToggle('#btn-toggle-zodiac', 'showConstellations');
    setupToggle('#btn-toggle-ecliptic', 'showEclipticGrid');
    setupToggle('#btn-toggle-guides', 'showGuides');
    setupToggle('#btn-toggle-harm-web', 'showHarmonicWeb');
    setupToggle('#btn-toggle-spheres', 'showCrystallineSpheres');
    setupToggle('#btn-toggle-hud', 'showTelemetryHUD');

    // Presets
    const btnSolstice = this.controlsContainer.querySelector('#btn-snap-solstice');
    if (btnSolstice) {
      btnSolstice.addEventListener('click', () => {
        // Snap to Summer Solstice (day ~172 of solar year)
        this.simDays = 172.5;
        this.updateSimulationKinematics(0);
      });
    }

    const btnEquinox = this.controlsContainer.querySelector('#btn-snap-equinox');
    if (btnEquinox) {
      btnEquinox.addEventListener('click', () => {
        // Snap to Vernal Equinox (Aries point, day ~80 of year)
        this.simDays = 79.5;
        this.updateSimulationKinematics(0);
      });
    }

    const btnRetrograde = this.controlsContainer.querySelector('#btn-snap-retrograde');
    if (btnRetrograde) {
      btnRetrograde.addEventListener('click', () => {
        // Mars in opposition retrograde conjunction
        this.camera.focusTargetId = 'Mars';
        if (selFocus) selFocus.value = 'Mars';
        this.simDays = 360.0;
        this.updateSimulationKinematics(0);
      });
    }

    const btnVenusRose = this.controlsContainer.querySelector('#btn-venus-pentagram');
    if (btnVenusRose) {
      btnVenusRose.addEventListener('click', () => {
        setCosmoModel('keplerian');
        this.camera.focusTargetId = 'Venus';
        if (selFocus) selFocus.value = 'Venus';
        this.state.showHarmonicWeb = true;
        this.state.harmonicIntensity = 1.0;
        this.harmonicWebLines = [];
        this.timeRate = 35.0;
        if (sliderTime && lblTime) {
          sliderTime.value = '35';
          lblTime.textContent = '35.0 days/s';
        }
      });
    }

    const btnPause = this.controlsContainer.querySelector('#btn-pause-sim');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        btnPause.textContent = this.isPaused ? '▶ Resume Orbit' : '⏸️ Pause';
      });
    }

    const btnResetCam = this.controlsContainer.querySelector('#btn-reset-cam');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        this.resetCamera();
      });
    }
  }

  // ==========================================================================
  // KINEMATICS & ORBITAL PHYSICS CALCULATIONS
  // ==========================================================================

  update(dt) {
    if (this.isPaused) return;

    const clampedDt = Math.min(0.1, Math.max(0.001, dt));
    this.elapsedRealTime += clampedDt;
    const deltaDays = (this.timeRate * clampedDt);
    this.simDays += deltaDays;

    this.updateSimulationKinematics(deltaDays);
    this.updateCameraInterpolation(clampedDt);
  }

  updateSimulationKinematics(deltaDays) {
    // ------------------------------------------------------------------------
    // 1. UPDATE HELIOCENTRIC KEPLERIAN BODIES
    // ------------------------------------------------------------------------
    this.keplerianBodies.forEach((body) => {
      if (body.period === 0) {
        // Sun sits at focal coordinate origin
        body.x = 0;
        body.y = 0;
        body.z = 0;
        return;
      }

      // Mean motion n = 2*PI / period (in days)
      const n = (Math.PI * 2) / body.period;
      const M = body.meanAnomaly0 + n * this.simDays;
      const E = solveKepler(M, body.e);

      // True Anomaly theta & Radius vector r
      const cosE = Math.cos(E);
      const sinE = Math.sin(E);
      const r = body.a * (1 - body.e * cosE);
      const theta = 2 * Math.atan2(Math.sqrt(1 + body.e) * Math.sin(E * 0.5), Math.sqrt(1 - body.e) * Math.cos(E * 0.5));

      // Orbital plane orbital angle u = theta + omegaPeri
      const u = theta + (body.omegaPeri || 0);
      const inc = body.i || 0;
      const node = body.omegaNode || 0;

      // 3D coordinates inclined relative to ecliptic plane
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosNode = Math.cos(node);
      const sinNode = Math.sin(node);
      const cosInc = Math.cos(inc);
      const sinInc = Math.sin(inc);

      // Cartesian coordinates (X-Z is ecliptic plane, Y is ecliptic North)
      body.x = r * (cosNode * cosU - sinNode * sinU * cosInc);
      body.y = r * (sinU * sinInc);
      body.z = r * (sinNode * cosU + cosNode * sinU * cosInc);

      // Velocity magnitude approximation for HUD
      body.orbitalSpeed = Math.sqrt((Math.PI * 2 * body.a) / body.period * ((2 / r) - (1 / body.a)));

      // Store trail history
      if (this.state.model === 'keplerian') {
        const trail = this.orbitalTrails[body.id];
        if (trail) {
          trail.push({ x: body.x, y: body.y, z: body.z });
          if (trail.length > this.state.trailPersistence) {
            trail.shift();
          }
        }
      }
    });

    // ------------------------------------------------------------------------
    // 2. UPDATE MOONS (Luna, Phobos, Deimos, Galilean Moons, Titan)
    // ------------------------------------------------------------------------
    const earth = this.keplerianBodies.find((b) => b.id === 'Terra');
    const mars = this.keplerianBodies.find((b) => b.id === 'Mars');
    const jupiter = this.keplerianBodies.find((b) => b.id === 'Jupiter');
    const saturn = this.keplerianBodies.find((b) => b.id === 'Saturn');

    this.moons.forEach((m) => {
      let parent = null;
      if (m.parent === 'Terra') parent = earth;
      else if (m.parent === 'Mars') parent = mars;
      else if (m.parent === 'Jupiter') parent = jupiter;
      else if (m.parent === 'Saturn') parent = saturn;

      if (!parent) return;

      const nMoon = (Math.PI * 2) / m.period;
      const angle = nMoon * this.simDays;
      const inc = m.i || 0;

      const lx = m.dist * Math.cos(angle);
      const lz = m.dist * Math.sin(angle) * Math.cos(inc);
      const ly = m.dist * Math.sin(angle) * Math.sin(inc);

      m.x = parent.x + lx;
      m.y = parent.y + ly;
      m.z = parent.z + lz;
    });

    // ------------------------------------------------------------------------
    // 3. UPDATE HARMONIC MUNDI SPIROGRAPH WEBBING (VENUS-EARTH ROSE / MARS)
    // ------------------------------------------------------------------------
    if (this.state.model === 'keplerian' && this.state.showHarmonicWeb) {
      const v = this.keplerianBodies.find((b) => b.id === 'Venus');
      const e = this.keplerianBodies.find((b) => b.id === 'Terra');
      if (v && e) {
        // Every few frames, capture the harmonic chord line
        if (this.harmonicWebLines.length === 0 || Math.abs(deltaDays) > 0.05) {
          this.harmonicWebLines.push({
            p1: { x: v.x, y: v.y, z: v.z },
            p2: { x: e.x, y: e.y, z: e.z },
            age: 0,
            maxAge: this.state.trailPersistence * 2
          });
          if (this.harmonicWebLines.length > 350) {
            this.harmonicWebLines.shift();
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 4. UPDATE PTOLEMAIC GEOCENTRIC KINEMATICS (EPICYCLES & EQUANT)
    // ------------------------------------------------------------------------
    this.ptolemaicSpheres.forEach((sphere) => {
      if (sphere.deferentR === 0) {
        // Earth fixed at geocentric center
        sphere.x = 0;
        sphere.y = 0;
        sphere.z = 0;
        return;
      }

      // Deferent rotation rate
      const nDef = (Math.PI * 2) / sphere.period;
      // Ptolemaic Equant angle alpha(t) advances uniformly from equant point
      const equantAngle = (sphere.eccentricAngle || 0) + nDef * this.simDays;

      // Eccentric Center C is displaced from Earth E by eccentricOffset * equantEccentricity factor
      const eccDist = (sphere.eccentricOffset || 0) * (this.state.equantEccentricity / 0.12);
      const eccX = eccDist * Math.cos(sphere.eccentricAngle || 0);
      const eccZ = eccDist * Math.sin(sphere.eccentricAngle || 0);

      // Equant point Q is symmetric to Earth with respect to Center C (displacement = 2 * eccDist)
      const equantX = 2 * eccX;
      const equantZ = 2 * eccZ;

      // Deferent center point of epicycle M(t):
      // The line from Equant Q at angle equantAngle intersects deferent circle of radius R centered at C.
      // Exact trigonometric solution:
      const sinDiff = (eccDist / sphere.deferentR) * Math.sin(equantAngle - (sphere.eccentricAngle || 0));
      const defAngle = equantAngle + Math.asin(Math.max(-1, Math.min(1, sinDiff)));

      const deferentCenterX = eccX + sphere.deferentR * Math.cos(defAngle);
      const deferentCenterZ = eccZ + sphere.deferentR * Math.sin(defAngle);
      sphere.deferentCenterX = deferentCenterX;
      sphere.deferentCenterZ = deferentCenterZ;
      sphere.equantX = equantX;
      sphere.equantZ = equantZ;
      sphere.eccX = eccX;
      sphere.eccZ = eccZ;

      // Epicyclic rotation
      let epicycleX = 0;
      let epicycleZ = 0;
      if (sphere.epicycleR > 0 && sphere.epiPeriod > 0) {
        const nEpi = (Math.PI * 2) / sphere.epiPeriod;
        // Epicyclic angle
        const epiAngle = nEpi * this.simDays;
        const currentEpiR = sphere.epicycleR * this.state.epicycleRatio;
        epicycleX = currentEpiR * Math.cos(epiAngle);
        epicycleZ = currentEpiR * Math.sin(epiAngle);
      }

      sphere.x = deferentCenterX + epicycleX;
      sphere.y = 0; // Simplified to ecliptic plane
      sphere.z = deferentCenterZ + epicycleZ;

      // Ptolemaic trails
      if (this.state.model === 'ptolemaic') {
        const trail = this.orbitalTrails[sphere.id];
        if (trail) {
          trail.push({ x: sphere.x, y: sphere.y, z: sphere.z });
          if (trail.length > this.state.trailPersistence) {
            trail.shift();
          }
        }
      }
    });

    // ------------------------------------------------------------------------
    // 5. COMPUTE APPARENT GEOCENTRIC LONGITUDE & RETROGRADE MOTIONS
    // ------------------------------------------------------------------------
    const testPlanets = ['Mercurius', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    testPlanets.forEach((pName) => {
      let geoX = 0;
      let geoZ = 0;

      if (this.state.model === 'keplerian') {
        const p = this.keplerianBodies.find((b) => b.id === pName);
        const e = this.keplerianBodies.find((b) => b.id === 'Terra');
        if (p && e) {
          geoX = p.x - e.x;
          geoZ = p.z - e.z;
        }
      } else {
        const p = this.ptolemaicSpheres.find((b) => b.id.includes(pName));
        if (p) {
          geoX = p.x;
          geoZ = p.z;
        }
      }

      const currentLong = normalizeAngle(Math.atan2(geoZ, geoX));
      const prevLong = this.apparentGeoPrev[pName] !== undefined ? this.apparentGeoPrev[pName] : currentLong;

      let dLong = currentLong - prevLong;
      // Handle wraparound
      if (dLong > Math.PI) dLong -= Math.PI * 2;
      if (dLong < -Math.PI) dLong += Math.PI * 2;

      // In celestial mechanics, if dLong/dt < 0, motion is Retrograde (westward against fixed stars)
      const isRetrograde = deltaDays !== 0 ? (dLong / deltaDays) < -1e-5 : false;
      this.retrogradeStates[pName] = isRetrograde;
      this.apparentGeocentricLongitudes[pName] = currentLong;
      this.apparentGeoPrev[pName] = currentLong;
    });
  }

  updateCameraInterpolation(dt) {
    // Smooth tracking when focused on specific planets
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;

    if (this.camera.focusTargetId !== 'overview') {
      let targetBody = null;
      if (this.state.model === 'keplerian') {
        targetBody = this.keplerianBodies.find((b) => b.id === this.camera.focusTargetId);
      } else {
        targetBody = this.ptolemaicSpheres.find((b) => b.id.includes(this.camera.focusTargetId));
      }

      if (targetBody) {
        targetX = targetBody.x;
        targetY = targetBody.y;
        targetZ = targetBody.z;
      }
    }

    // Smoothly interpolate pan to center the focus body
    const rot = rotate3D({ x: targetX, y: targetY, z: targetZ }, this.camera.yaw, this.camera.pitch);
    const focalFactor = (1100 / Math.max(20, rot.z + this.camera.distance)) * this.camera.zoom;

    if (this.camera.focusTargetId === 'overview') {
      this.camera.targetPanX = 0;
      this.camera.targetPanY = 0;
    } else {
      this.camera.targetPanX = -rot.x * focalFactor;
      this.camera.targetPanY = rot.y * focalFactor;
    }

    // Dampened smooth transition
    const lerpRate = Math.min(1.0, dt * 4.5);
    this.camera.panX += (this.camera.targetPanX - this.camera.panX) * lerpRate;
    this.camera.panY += (this.camera.targetPanY - this.camera.panY) * lerpRate;
  }

  // ==========================================================================
  // RENDERING PIPELINE (CELESTIAL SPHERE, CONSTELLATIONS, ORBITS & BODIES)
  // ==========================================================================

  render(ctx) {
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // 1. Cosmic Void Background (Obsidian #07090E with Radial Starlight Core)
    ctx.fillStyle = '#07090E';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5 + this.camera.panX;
    const cy = h * 0.5 + this.camera.panY;
    if (isFinite(cx) && isFinite(cy)) {
      const bgGrad = ctx.createRadialGradient(cx, cy, Math.max(0, 10), cx, cy, Math.max(0, Math.max(w, h) * 0.75));
      bgGrad.addColorStop(0, 'rgba(18, 25, 45, 0.45)');
      bgGrad.addColorStop(0.5, 'rgba(10, 14, 25, 0.25)');
      bgGrad.addColorStop(1, 'rgba(7, 9, 14, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Render 800+ Twinkling Stars & Celestial Firmament
    this.renderStellarFirmament(ctx);

    // 3. Render 12 Zodiacal Constellations & Asterisms
    if (this.state.showConstellations) {
      this.renderZodiacConstellations(ctx);
    }

    // 4. Render Ecliptic Plane Band, Celestial Equator, Colures & Precession Circle
    if (this.state.showEclipticGrid) {
      this.renderCelestialGridAndEcliptic(ctx);
    }

    // 5. Render Ptolemaic Concentric Crystalline Spheres
    if (this.state.model === 'ptolemaic' && this.state.showCrystallineSpheres) {
      this.renderCrystallineSpheres(ctx);
    }

    // 6. Render Ptolemaic Deferent, Equant & Eccentric Vector Guides
    if (this.state.model === 'ptolemaic' && this.state.showGuides) {
      this.renderPtolemaicGuides(ctx);
    }

    // 7. Render Harmonic Mundi Spirograph Webbing (Sacred Geometry Resonances)
    if (this.state.model === 'keplerian' && this.state.showHarmonicWeb) {
      this.renderHarmonicWeb(ctx);
    }

    // 8. Render Orbital Trails
    this.renderOrbitalTrails(ctx);

    // 9. Render Planetary Bodies & Moons (Depth Sorted)
    this.renderPlanetaryBodies(ctx);

    // 10. Render Astronomical Telemetry Overlay & Roman HUD Plaque
    if (this.state.showTelemetryHUD) {
      this.renderAstronomicalHUD(ctx);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 1: STELLAR FIRMAMENT (800+ TWINKLING STARS)
  // --------------------------------------------------------------------------
  renderStellarFirmament(ctx) {
    const w = this.width;
    const h = this.height;

    this.stars.forEach((star) => {
      const proj = project3D(star, this.camera, w, h);
      if (!proj.visible || proj.x < -40 || proj.x > w + 40 || proj.y < -40 || proj.y > h + 40) return;

      // Authentic atmospheric scintillation / stellar twinkling
      const twinkle = 0.55 + 0.45 * Math.sin(this.elapsedRealTime * star.twinkleSpeed + star.phase);
      const radius = Math.max(0.2, star.size * proj.scale * 1.8 * twinkle);

      ctx.save();
      ctx.globalAlpha = Math.min(1.0, (0.4 + 0.6 * twinkle) * (star.isMajor ? 1.0 : 0.8));
      ctx.fillStyle = star.color;

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, Math.max(0, radius), 0, Math.PI * 2);
      ctx.fill();

      // For prominent stars, draw 4-point golden diffraction spikes
      if (star.isMajor && star.mag < 1.0 && proj.scale > 0.4) {
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.35 * twinkle;
        const spikeLen = radius * 4.2;

        ctx.beginPath();
        ctx.moveTo(proj.x - spikeLen, proj.y);
        ctx.lineTo(proj.x + spikeLen, proj.y);
        ctx.moveTo(proj.x, proj.y - spikeLen);
        ctx.lineTo(proj.x, proj.y + spikeLen);
        ctx.stroke();

        // Label major stars
        if (this.state.showStellarLabels && proj.scale > 0.5) {
          ctx.fillStyle = '#D4AF37';
          ctx.font = `${Math.round(Math.max(9, 11 * proj.scale))}px 'Cinzel', serif, monospace`;
          ctx.fillText(star.name, proj.x + radius + 4, proj.y - 2);
        }
      }

      ctx.restore();
    });
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 2: 12 ZODIACAL CONSTELLATIONS & GOLDEN ASTERISMS
  // --------------------------------------------------------------------------
  renderZodiacConstellations(ctx) {
    const w = this.width;
    const h = this.height;

    ctx.save();
    ZODIAC_CONSTELLATIONS.forEach((zod) => {
      // Draw golden constellation connecting lines
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.2;

      zod.lines.forEach(([s1Idx, s2Idx]) => {
        const star1 = zod.stars[s1Idx];
        const star2 = zod.stars[s2Idx];
        if (!star1 || !star2) return;

        const p1 = celestialToCartesian(star1.ra, star1.dec, 2400);
        const p2 = celestialToCartesian(star2.ra, star2.dec, 2400);
        const pr1 = project3D(p1, this.camera, w, h);
        const pr2 = project3D(p2, this.camera, w, h);

        if (pr1.visible && pr2.visible) {
          ctx.beginPath();
          ctx.moveTo(pr1.x, pr1.y);
          ctx.lineTo(pr2.x, pr2.y);
          ctx.stroke();
        }
      });

      // Calculate centroid of constellation for Latin name badge
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      zod.stars.forEach((st) => {
        const pos = celestialToCartesian(st.ra, st.dec, 2400);
        sumX += pos.x;
        sumY += pos.y;
        sumZ += pos.z;
      });
      const centroid = {
        x: sumX / zod.stars.length,
        y: sumY / zod.stars.length,
        z: sumZ / zod.stars.length
      };

      const cProj = project3D(centroid, this.camera, w, h);
      if (cProj.visible && cProj.x >= 20 && cProj.x <= w - 20 && cProj.y >= 20 && cProj.y <= h - 20) {
        ctx.fillStyle = zod.color;
        ctx.font = `bold ${Math.round(Math.max(10, 13 * cProj.scale))}px 'Cinzel', serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${zod.symbol} ${zod.name.toUpperCase()}`, cProj.x, cProj.y);

        ctx.fillStyle = 'rgba(230, 232, 238, 0.55)';
        ctx.font = `${Math.round(Math.max(8, 9 * cProj.scale))}px sans-serif`;
        ctx.fillText(`${zod.eclipticStart}° - ${zod.eclipticEnd}°`, cProj.x, cProj.y + 12 * cProj.scale);
      }
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 3: ECLIPTIC PLANE BAND, CELESTIAL EQUATOR & SOLSTICES
  // --------------------------------------------------------------------------
  renderCelestialGridAndEcliptic(ctx) {
    const w = this.width;
    const h = this.height;
    ctx.save();

    // A. Celestial Equator (Cyan Ring at Dec = 0°)
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    let prevProj = null;
    for (let deg = 0; deg <= 360; deg += 5) {
      const p = celestialToCartesian(deg, 0, 2400);
      const pr = project3D(p, this.camera, w, h);
      if (pr.visible) {
        if (!prevProj) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
      }
      prevProj = pr;
    }
    ctx.stroke();

    // B. Ecliptic Band (Tilted Obliquity 23.44°, Imperial Gold Ring with 30° Ticks)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    prevProj = null;
    for (let deg = 0; deg <= 360; deg += 2) {
      // Ecliptic coordinates to equatorial:
      // sin(dec) = sin(eps) * sin(lambda)
      // tan(ra) = cos(eps) * tan(lambda)
      const rad = deg * (Math.PI / 180);
      const dec = Math.asin(Math.sin(EARTH_AXIAL_TILT_RAD) * Math.sin(rad)) * (180 / Math.PI);
      const ra = Math.atan2(Math.cos(EARTH_AXIAL_TILT_RAD) * Math.sin(rad), Math.cos(rad)) * (180 / Math.PI);

      const p = celestialToCartesian(ra, dec, 2400);
      const pr = project3D(p, this.camera, w, h);
      if (pr.visible) {
        if (!prevProj) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
      }
      prevProj = pr;
    }
    ctx.stroke();

    // C. Mark Equinoxes and Solstices along the Ecliptic
    const CARDINAL_POINTS = [
      { name: 'Aequinoctium Vernum (♈ 0°)', deg: 0, label: 'Vernal Equinox' },
      { name: 'Solstitium Aestivum (♋ 90°)', deg: 90, label: 'Summer Solstice' },
      { name: 'Aequinoctium Autumnale (♎ 180°)', deg: 180, label: 'Autumnal Equinox' },
      { name: 'Solstitium Hiemale (♑ 270°)', deg: 270, label: 'Winter Solstice' }
    ];

    CARDINAL_POINTS.forEach((cp) => {
      const rad = cp.deg * (Math.PI / 180);
      const dec = Math.asin(Math.sin(EARTH_AXIAL_TILT_RAD) * Math.sin(rad)) * (180 / Math.PI);
      const ra = Math.atan2(Math.cos(EARTH_AXIAL_TILT_RAD) * Math.sin(rad), Math.cos(rad)) * (180 / Math.PI);
      const p = celestialToCartesian(ra, dec, 2400);
      const pr = project3D(p, this.camera, w, h);

      if (pr.visible && pr.x >= 0 && pr.x <= w && pr.y >= 0 && pr.y <= h) {
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, Math.max(0, 4 * pr.scale), 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `bold ${Math.round(Math.max(9, 10 * pr.scale))}px 'Cinzel', serif`;
        ctx.textAlign = 'left';
        ctx.fillText(cp.label, pr.x + 6, pr.y - 4);
      }
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 4: CONCENTRIC CRYSTALLINE SPHERES (PTOLEMAIC GLASS SHELLS)
  // --------------------------------------------------------------------------
  renderCrystallineSpheres(ctx) {
    const w = this.width;
    const h = this.height;
    ctx.save();

    this.ptolemaicSpheres.forEach((sphere, idx) => {
      if (sphere.deferentR === 0) return;

      const r = sphere.deferentR;
      ctx.strokeStyle = `rgba(108, 92, 231, ${0.12 + idx * 0.02})`;
      ctx.lineWidth = 1;

      // Draw concentric crystalline circle in equatorial plane
      ctx.beginPath();
      let prevProj = null;
      for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.08) {
        const pt = { x: r * Math.cos(angle), y: 0, z: r * Math.sin(angle) };
        const pr = project3D(pt, this.camera, w, h);
        if (pr.visible) {
          if (!prevProj) ctx.moveTo(pr.x, pr.y);
          else ctx.lineTo(pr.x, pr.y);
        }
        prevProj = pr;
      }
      ctx.stroke();

      // Label crystalline shell
      const labelPt = { x: r * 0.98, y: 0, z: 0 };
      const prLabel = project3D(labelPt, this.camera, w, h);
      if (prLabel.visible && prLabel.x > 0 && prLabel.x < w) {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
        ctx.font = `${Math.round(Math.max(8, 9 * prLabel.scale))}px 'Cinzel', serif`;
        ctx.textAlign = 'left';
        ctx.fillText(sphere.sphereName, prLabel.x + 4, prLabel.y - 2);
      }
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 5: PTOLEMAIC GUIDES (DEFERENT, EQUANT & ECCENTRIC VECTORS)
  // --------------------------------------------------------------------------
  renderPtolemaicGuides(ctx) {
    const w = this.width;
    const h = this.height;
    ctx.save();

    this.ptolemaicSpheres.forEach((sphere) => {
      if (sphere.deferentR === 0) return;

      // 1. Draw Deferent Circle centered at Eccentric Center C
      ctx.strokeStyle = 'rgba(59, 214, 198, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let prevProj = null;
      for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.08) {
        const dx = sphere.eccX + sphere.deferentR * Math.cos(th);
        const dz = sphere.eccZ + sphere.deferentR * Math.sin(th);
        const pr = project3D({ x: dx, y: 0, z: dz }, this.camera, w, h);
        if (pr.visible) {
          if (!prevProj) ctx.moveTo(pr.x, pr.y);
          else ctx.lineTo(pr.x, pr.y);
        }
        prevProj = pr;
      }
      ctx.stroke();

      // 2. Draw Epicycle Circle centered at M(t)
      if (sphere.epicycleR > 0) {
        const currentEpiR = sphere.epicycleR * this.state.epicycleRatio;
        ctx.strokeStyle = 'rgba(224, 86, 76, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        prevProj = null;
        for (let eth = 0; eth <= Math.PI * 2 + 0.1; eth += 0.1) {
          const ex = sphere.deferentCenterX + currentEpiR * Math.cos(eth);
          const ez = sphere.deferentCenterZ + currentEpiR * Math.sin(eth);
          const pr = project3D({ x: ex, y: 0, z: ez }, this.camera, w, h);
          if (pr.visible) {
            if (!prevProj) ctx.moveTo(pr.x, pr.y);
            else ctx.lineTo(pr.x, pr.y);
          }
          prevProj = pr;
        }
        ctx.stroke();

        // Vector line from Earth -> Epicycle Center M -> Planet Body P
        const prEarth = project3D({ x: 0, y: 0, z: 0 }, this.camera, w, h);
        const prEpiCenter = project3D({ x: sphere.deferentCenterX, y: 0, z: sphere.deferentCenterZ }, this.camera, w, h);
        const prPlanet = project3D({ x: sphere.x, y: sphere.y, z: sphere.z }, this.camera, w, h);

        if (prEarth.visible && prEpiCenter.visible && prPlanet.visible) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.beginPath();
          ctx.moveTo(prEarth.x, prEarth.y);
          ctx.lineTo(prEpiCenter.x, prEpiCenter.y);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(224, 86, 76, 0.55)';
          ctx.beginPath();
          ctx.moveTo(prEpiCenter.x, prEpiCenter.y);
          ctx.lineTo(prPlanet.x, prPlanet.y);
          ctx.stroke();
        }
      }

      // 3. Draw Eccentric and Equant Points
      const prEcc = project3D({ x: sphere.eccX, y: 0, z: sphere.eccZ }, this.camera, w, h);
      const prEquant = project3D({ x: sphere.equantX, y: 0, z: sphere.equantZ }, this.camera, w, h);

      if (prEcc.visible) {
        ctx.fillStyle = '#3BD6C6';
        ctx.beginPath();
        ctx.arc(prEcc.x, prEcc.y, Math.max(0, 2.5 * prEcc.scale), 0, Math.PI * 2);
        ctx.fill();
      }

      if (prEquant.visible) {
        ctx.fillStyle = '#E0564C';
        ctx.beginPath();
        ctx.arc(prEquant.x, prEquant.y, Math.max(0, 2.5 * prEquant.scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 6: HARMONIA MUNDI SPIROGRAPH WEBBING (SACRED GEOMETRY)
  // --------------------------------------------------------------------------
  renderHarmonicWeb(ctx) {
    const w = this.width;
    const h = this.height;
    if (this.harmonicWebLines.length === 0) return;

    ctx.save();
    const baseAlpha = this.state.harmonicIntensity;

    this.harmonicWebLines.forEach((chord, idx) => {
      const frac = idx / this.harmonicWebLines.length;
      const alpha = frac * baseAlpha * 0.65;
      if (alpha <= 0.01) return;

      const pr1 = project3D(chord.p1, this.camera, w, h);
      const pr2 = project3D(chord.p2, this.camera, w, h);

      if (pr1.visible && pr2.visible) {
        // Gradient from Venus gold/rose to Earth cyan starlight
        ctx.strokeStyle = `rgba(212, 175, 55, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pr1.x, pr1.y);
        ctx.lineTo(pr2.x, pr2.y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 7: ORBITAL TRAILS
  // --------------------------------------------------------------------------
  renderOrbitalTrails(ctx) {
    const w = this.width;
    const h = this.height;
    ctx.save();

    const activeList = this.state.model === 'keplerian' ? this.keplerianBodies : this.ptolemaicSpheres;

    activeList.forEach((body) => {
      const trail = this.orbitalTrails[body.id];
      if (!trail || trail.length < 2) return;

      ctx.lineWidth = 1.6;
      for (let i = 1; i < trail.length; i++) {
        const ptPrev = trail[i - 1];
        const ptCurr = trail[i];

        const pr1 = project3D(ptPrev, this.camera, w, h);
        const pr2 = project3D(ptCurr, this.camera, w, h);

        if (pr1.visible && pr2.visible) {
          const alpha = (i / trail.length) * 0.7;
          ctx.strokeStyle = body.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(pr1.x, pr1.y);
          ctx.lineTo(pr2.x, pr2.y);
          ctx.stroke();
        }
      }
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 8: PLANETARY BODIES & MOONS (3D DEPTH SORTED)
  // --------------------------------------------------------------------------
  renderPlanetaryBodies(ctx) {
    const w = this.width;
    const h = this.height;
    const renderQueue = [];

    // Collect all bodies according to active system
    if (this.state.model === 'keplerian') {
      this.keplerianBodies.forEach((b) => renderQueue.push({ ...b, isMoon: false }));
      if (this.state.showMoons) {
        this.moons.forEach((m) => renderQueue.push({ ...m, isMoon: true }));
      }
    } else {
      this.ptolemaicSpheres.forEach((b) => renderQueue.push({ ...b, isMoon: false }));
    }

    // Project each body and determine depth for painter's sorting (back-to-front)
    const projectedQueue = [];
    renderQueue.forEach((body) => {
      const pr = project3D({ x: body.x, y: body.y, z: body.z }, this.camera, w, h);
      if (pr.visible) {
        projectedQueue.push({
          body,
          proj: pr,
          depth: pr.zDepth
        });
      }
    });

    // Sort descending by depth (farthest zDepth first)
    projectedQueue.sort((a, b) => b.depth - a.depth);

    // Render sorted bodies
    projectedQueue.forEach(({ body, proj }) => {
      ctx.save();
      const r = Math.max(1, body.radius * proj.scale);

      // A. Special Rendering for Sol (Sun) with Animated Coronal Flares
      if (body.id === 'Sol' || body.id === 'Ptolemy_Sol') {
        const coronaR = r * 2.4;
        const sunGrad = ctx.createRadialGradient(proj.x, proj.y, Math.max(0, r * 0.6), proj.x, proj.y, Math.max(0, coronaR));
        sunGrad.addColorStop(0, '#FFFFFF');
        sunGrad.addColorStop(0.2, '#FFE57F');
        sunGrad.addColorStop(0.5, 'rgba(255, 170, 0, 0.45)');
        sunGrad.addColorStop(1, 'rgba(255, 69, 0, 0.0)');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0, coronaR), 0, Math.PI * 2);
        ctx.fill();

        // Sun disc
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();
      }
      // B. Special Rendering for Saturn's 3D Tilted Ring System
      else if (body.hasRings) {
        this.renderSaturnAndRings(ctx, body, proj, r);
      }
      // C. General Planet with Atmospheric Rayleigh Rim Glow
      else {
        // Atmospheric Rim Glow
        const glowR = r * 1.45;
        const glowGrad = ctx.createRadialGradient(proj.x, proj.y, Math.max(0, r * 0.8), proj.x, proj.y, Math.max(0, glowR));
        glowGrad.addColorStop(0, body.color);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0, glowR), 0, Math.PI * 2);
        ctx.fill();

        // Planet Sphere Body
        ctx.fillStyle = body.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();

        // Pseudo-lambertian shadow gradient (illuminated from Sol at focal center)
        const sunDx = -body.x;
        const sunDz = -body.z;
        const distToSun = Math.hypot(sunDx, sunDz);

        if (distToSun > 1e-4) {
          const rotSun = rotate3D({ x: sunDx, y: 0, z: sunDz }, this.camera.yaw, this.camera.pitch);
          const shadowAngle = Math.atan2(-rotSun.y, rotSun.x);

          const shadowGrad = ctx.createLinearGradient(
            proj.x - Math.cos(shadowAngle) * r,
            proj.y - Math.sin(shadowAngle) * r,
            proj.x + Math.cos(shadowAngle) * r,
            proj.y + Math.sin(shadowAngle) * r
          );
          shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
          shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
          shadowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');

          ctx.fillStyle = shadowGrad;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, Math.max(0, r), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Planet Latin Designation Label
      if (proj.scale > 0.35) {
        ctx.fillStyle = '#E6E8EE';
        ctx.font = `${Math.round(Math.max(9, 11 * proj.scale))}px 'Cinzel', serif`;
        ctx.textAlign = 'left';
        ctx.fillText(body.name, proj.x + r + 5, proj.y + 3);

        if (body.symbol) {
          ctx.fillStyle = '#D4AF37';
          ctx.fillText(body.symbol, proj.x - r - 14 * proj.scale, proj.y + 3);
        }
      }

      ctx.restore();
    });
  }

  // --------------------------------------------------------------------------
  // RENDER SATURN AND 3D TILTED RINGS
  // --------------------------------------------------------------------------
  renderSaturnAndRings(ctx, body, proj, r) {
    const ringInner = body.ringInner * proj.scale;
    const ringOuter = body.ringOuter * proj.scale;
    const ringTilt = 0.38; // Oblique projected ring eccentricity

    // Draw Back half of rings (Behind planet)
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.65)';
    ctx.lineWidth = Math.max(1, (ringOuter - ringInner) * 0.45);
    ctx.beginPath();
    ctx.ellipse(proj.x, proj.y, Math.max(0, (ringInner + ringOuter) * 0.5), Math.max(0, (ringInner + ringOuter) * 0.5 * ringTilt), 0.25, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Planet Sphere
    ctx.save();
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, Math.max(0, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Front half of rings (In front of planet globe)
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.85)';
    ctx.lineWidth = Math.max(1, (ringOuter - ringInner) * 0.45);
    ctx.beginPath();
    ctx.ellipse(proj.x, proj.y, Math.max(0, (ringInner + ringOuter) * 0.5), Math.max(0, (ringInner + ringOuter) * 0.5 * ringTilt), 0.25, 0, Math.PI);
    ctx.stroke();

    // Cassini Division dark line
    ctx.strokeStyle = 'rgba(7, 9, 14, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(proj.x, proj.y, Math.max(0, ringOuter * 0.84), Math.max(0, ringOuter * 0.84 * ringTilt), 0.25, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // SUB-RENDERER 9: CANVAS HUD TELEMETRY OVERLAY (PLINIAN EPHEMERIS)
  // --------------------------------------------------------------------------
  renderAstronomicalHUD(ctx) {
    const w = this.width;
    const h = this.height;
    ctx.save();

    // ========================================================================
    // TOP-LEFT HUD PLAQUE: SYSTEM & PLINIAN CALENDAR
    // ========================================================================
    const plaqueW = 280;
    const plaqueH = 150;
    const px = 16;
    const py = 16;

    // Bronze Roman Border Plaque
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(px, py, plaqueW, plaqueH);
    ctx.strokeRect(px, py, plaqueW, plaqueH);

    // Inner accent line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.strokeRect(px + 3, py + 3, plaqueW - 6, plaqueH - 6);

    ctx.fillStyle = '#D4AF37';
    ctx.font = "bold 13px 'Cinzel', serif";
    ctx.textAlign = 'left';
    ctx.fillText('COSMOGRAPHIA & EPHEMERIS', px + 12, py + 22);

    ctx.fillStyle = '#8C909E';
    ctx.font = '11px sans-serif';
    ctx.fillText(
      this.state.model === 'keplerian' ? 'SYSTEMA HELIOCENTRICUM (Kepler)' : 'SYSTEMA GEOCENTRICUM (Ptolemaeus)',
      px + 12,
      py + 40
    );

    // Julian / Plinian Day Count
    const currentJD = J2000_EPOCH_JD + this.simDays;
    const solarYearFraction = (this.simDays % TROPICAL_YEAR_DAYS) / TROPICAL_YEAR_DAYS;
    const solarEclipticDeg = normalizeAngle(solarYearFraction * Math.PI * 2) * (180 / Math.PI);

    // Calculate current Zodiac sign of Sol
    const zodiacIndex = Math.floor(solarEclipticDeg / 30) % 12;
    const currentZodiac = ZODIAC_CONSTELLATIONS[zodiacIndex] || ZODIAC_CONSTELLATIONS[0];
    const zodiacDegree = Math.floor(solarEclipticDeg % 30);
    const zodiacMinute = Math.floor(((solarEclipticDeg % 30) - zodiacDegree) * 60);

    ctx.fillStyle = '#E6E8EE';
    ctx.fillText(`Dies Iulianus (JD): ${currentJD.toFixed(2)}`, px + 12, py + 62);
    ctx.fillText(`Anno Simulatrix: Day ${(this.simDays % 365.25).toFixed(1)} / 365.25`, px + 12, py + 80);

    // Zodiac sign of the Sun
    ctx.fillStyle = currentZodiac.color;
    ctx.font = "bold 12px 'Cinzel', serif";
    ctx.fillText(
      `Sol in ${currentZodiac.symbol} ${currentZodiac.name}: ${zodiacDegree}° ${zodiacMinute}'`,
      px + 12,
      py + 104
    );

    // Time Rate Readout
    ctx.fillStyle = '#3BD6C6';
    ctx.font = '11px monospace';
    ctx.fillText(`Cursus Temporis: ${this.timeRate.toFixed(1)} days/s ${this.isPaused ? '(PAUSED)' : ''}`, px + 12, py + 128);

    // ========================================================================
    // RETROGRADE MOTION WARNING BADGES
    // ========================================================================
    let retroCount = 0;
    Object.entries(this.retrogradeStates).forEach(([pName, isRetro]) => {
      if (isRetro) {
        retroCount++;
        const badgeY = py + plaqueH + 12 + (retroCount - 1) * 32;

        ctx.fillStyle = 'rgba(192, 57, 43, 0.85)';
        ctx.strokeStyle = '#E0564C';
        ctx.fillRect(px, badgeY, plaqueW, 26);
        ctx.strokeRect(px, badgeY, plaqueW, 26);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "bold 11px 'Cinzel', serif";
        ctx.fillText(`⚡ MOTUS RETROGRADUS: ${pName.toUpperCase()}`, px + 10, badgeY + 17);
      }
    });

    // ========================================================================
    // TOP-RIGHT HUD PLAQUE: MUSICA UNIVERSALIS & HARMONIC RESONANCE
    // ========================================================================
    if (this.state.model === 'keplerian') {
      const harmW = 270;
      const harmH = 110;
      const hx = w - harmW - 16;
      const hy = 16;

      ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.fillRect(hx, hy, harmW, harmH);
      ctx.strokeRect(hx, hy, harmW, harmH);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.strokeRect(hx + 3, hy + 3, harmW - 6, harmH - 6);

      ctx.fillStyle = '#D4AF37';
      ctx.font = "bold 12px 'Cinzel', serif";
      ctx.fillText('MUSICA UNIVERSALIS (Harmonia)', hx + 12, hy + 22);

      ctx.fillStyle = '#E6E8EE';
      ctx.font = '11px sans-serif';
      ctx.fillText('Resonantia Veneris & Terrae: 8:5', hx + 12, hy + 44);
      ctx.fillText('Pentagramma Aurea (Rose of Venus)', hx + 12, hy + 62);

      ctx.fillStyle = '#3BD6C6';
      ctx.font = '10px monospace';
      ctx.fillText('Chorda Pythagorica: Diapente (3:2)', hx + 12, hy + 86);
    }

    // ========================================================================
    // BOTTOM NAVIGATION GUIDE / CONTROLS HINT
    // ========================================================================
    ctx.fillStyle = 'rgba(230, 232, 238, 0.45)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pan: Mouse Drag | Orbit: Pitch/Yaw | Zoom: Mouse Wheel | Keys: Space (Pause), 1/2 (Model), R (Reset)', w * 0.5, h - 16);

    ctx.restore();
  }

  // ==========================================================================
  // INPUT HANDLERS (MOUSE, TOUCH, WHEEL, KEYBOARD)
  // ==========================================================================

  onMouseDown(pos) {
    this.isDragging = true;
    this.dragMode = pos.button === 2 || pos.shiftKey ? 'pan' : 'orbit';
    this.lastMouse = { x: pos.x, y: pos.y };
  }

  onMouseMove(pos) {
    const dx = pos.x - this.lastMouse.x;
    const dy = pos.y - this.lastMouse.y;
    this.lastMouse = { x: pos.x, y: pos.y };

    if (this.isDragging) {
      if (this.dragMode === 'orbit') {
        // Orbit Yaw and Pitch
        this.camera.yaw += dx * 0.008;
        this.camera.pitch = Math.max(-1.4, Math.min(1.4, this.camera.pitch + dy * 0.008));
      } else {
        // Pan Viewport
        this.camera.panX += dx;
        this.camera.panY += dy;
        this.camera.targetPanX = this.camera.panX;
        this.camera.targetPanY = this.camera.panY;
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(deltaY) {
    const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
    this.camera.zoom = Math.max(0.15, Math.min(8.0, this.camera.zoom * zoomFactor));
    this.camera.targetZoom = this.camera.zoom;
  }

  onKeyDown(key, e) {
    const k = (key || '').toLowerCase();
    switch (k) {
      case ' ':
        this.isPaused = !this.isPaused;
        if (this.controlsContainer) {
          const btn = this.controlsContainer.querySelector('#btn-pause-sim');
          if (btn) btn.textContent = this.isPaused ? '▶ Resume Orbit' : '⏸️ Pause';
        }
        if (e && e.preventDefault) e.preventDefault();
        break;
      case '1':
        this.state.model = 'keplerian';
        this.syncModelButtons();
        break;
      case '2':
        this.state.model = 'ptolemaic';
        this.syncModelButtons();
        break;
      case 'r':
        this.reset();
        break;
      case 'z':
        this.state.showConstellations = !this.state.showConstellations;
        break;
      case 'h':
        this.state.showHarmonicWeb = !this.state.showHarmonicWeb;
        break;
      case 'c':
        this.state.showCrystallineSpheres = !this.state.showCrystallineSpheres;
        break;
      case 'arrowright':
        this.simDays += 5.0;
        this.updateSimulationKinematics(5.0);
        break;
      case 'arrowleft':
        this.simDays -= 5.0;
        this.updateSimulationKinematics(-5.0);
        break;
    }
  }

  onKeyUp() {
    // Parity with engine event contract
  }

  syncModelButtons() {
    if (!this.controlsContainer) return;
    const btnKepler = this.controlsContainer.querySelector('#btn-model-kepler');
    const btnPtolemy = this.controlsContainer.querySelector('#btn-model-ptolemy');
    const groupPtolemy = this.controlsContainer.querySelector('#group-ptolemy-sliders');
    const groupHarmonia = this.controlsContainer.querySelector('#group-harmonia-slider');

    if (btnKepler) btnKepler.classList.toggle('active', this.state.model === 'keplerian');
    if (btnPtolemy) btnPtolemy.classList.toggle('active', this.state.model === 'ptolemaic');
    if (groupPtolemy) groupPtolemy.style.display = this.state.model === 'ptolemaic' ? 'block' : 'none';
    if (groupHarmonia) groupHarmonia.style.display = this.state.model === 'keplerian' ? 'block' : 'none';
  }

  // ==========================================================================
  // LIFECYCLE, RESIZE, RESET & CLEANUP
  // ==========================================================================

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  resetCamera() {
    this.camera.yaw = 0.45;
    this.camera.pitch = 0.48;
    this.camera.distance = 980;
    this.camera.zoom = 1.0;
    this.camera.panX = 0;
    this.camera.panY = 0;
    this.camera.targetPanX = 0;
    this.camera.targetPanY = 0;
    this.camera.focusTargetId = 'overview';

    if (this.controlsContainer) {
      const selFocus = this.controlsContainer.querySelector('#sel-focus-target');
      if (selFocus) selFocus.value = 'overview';
    }
  }

  reset() {
    this.simDays = 0;
    this.isPaused = false;
    this.harmonicWebLines = [];
    Object.keys(this.orbitalTrails).forEach((k) => (this.orbitalTrails[k] = []));
    this.resetCamera();
    this.updateSimulationKinematics(0);
  }

  destroy() {
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.uiElements = [];
    this.stars = [];
    this.keplerianBodies = [];
    this.ptolemaicSpheres = [];
    this.moons = [];
    this.harmonicWebLines = [];
    this.orbitalTrails = {};
  }

  getEntityCount() {
    // Total count of active astronomical simulated entities
    return (
      this.stars.length +
      this.keplerianBodies.length +
      this.ptolemaicSpheres.length +
      this.moons.length +
      this.harmonicWebLines.length
    );
  }
}
