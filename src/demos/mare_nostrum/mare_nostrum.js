// Mare Nostrum: Classical Mediterranean Trade & Portolan Navigation
// Pliny Game Lab — Pavilion VII: Mare Nostrum
// Classical 12-Wind Rose Meteorology, Lateen Sail Aerodynamics, Keel Leeway, and Portolan Cartography

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

const TWO_PI = Math.PI * 2;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function normalizeAngle(rad) {
  let a = rad % TWO_PI;
  if (a > Math.PI) a -= TWO_PI;
  if (a < -Math.PI) a += TWO_PI;
  return a;
}

// -------------------------------------------------------------
// Classical 12-Wind Rose of Antiquity (Aristotle, Seneca, Vitruvius)
// Meteorological definition: wind blows FROM the named direction
// -------------------------------------------------------------
export const WINDS_12 = [
  { id: 0, name: 'Septentrio', greek: 'Aparctias', dir: 'N', compassDeg: 0, desc: 'Ventus Frigidus et Siccus (Cold Alpine North Wind)' },
  { id: 1, name: 'Aquilo', greek: 'Boreas', dir: 'NNE', compassDeg: 30, desc: 'Boreas Vehemens (Fierce Cold North-Northeast Gale)' },
  { id: 2, name: 'Caecias', greek: 'Hellespontias', dir: 'ENE', compassDeg: 60, desc: 'Nubes Cogens (Dark Cloud-Gathering Wind)' },
  { id: 3, name: 'Subsolanus', greek: 'Apeliotes', dir: 'E', compassDeg: 90, desc: 'Aurorae Suavis (Gentle Dawn Breeze of the East)' },
  { id: 4, name: 'Vulturnus', greek: 'Eurus', dir: 'ESE', compassDeg: 120, desc: 'Calidus et Aridus (Warm, Dry Levant Wind)' },
  { id: 5, name: 'Euronotus', greek: 'Euroauster', dir: 'SSE', compassDeg: 150, desc: 'Humidus Pluvialis (Sultry Rain-Bringer)' },
  { id: 6, name: 'Auster', greek: 'Notus', dir: 'S', compassDeg: 180, desc: 'Turbidus et Fervens (Heavy African Sirocco)' },
  { id: 7, name: 'Austroafricus', greek: 'Libonotus', dir: 'SSW', compassDeg: 210, desc: 'Calens Meridionalis (Warm South-Southwest Breeze)' },
  { id: 8, name: 'Africus', greek: 'Lips', dir: 'WSW', compassDeg: 240, desc: 'Procellosus Libeccio (Gusty Squall of the Southwest)' },
  { id: 9, name: 'Favonius', greek: 'Zephyrus', dir: 'W', compassDeg: 270, desc: 'Vernus Suavissimus (Gentle Spring Westerly)' },
  { id: 10, name: 'Corus', greek: 'Argestes / Mistral', dir: 'WNW', compassDeg: 300, desc: 'Impetuosus Caurus (Brisk Northwest Mistral)' },
  { id: 11, name: 'Thrascias', greek: 'Circius', dir: 'NNW', compassDeg: 330, desc: 'Glacialis et Acer (Fierce Alpine North-Northwest)' }
];

// Helper: Convert compass degrees (0° = North, 90° = East) to canvas flow vector angle in radians
// Wind blowing FROM compassDeg flows TOWARDS (compassDeg + 180°)
function compassToFlowAngle(compassDeg) {
  const flowDeg = (compassDeg + 180) % 360;
  return (flowDeg - 90) * DEG2RAD;
}

// -------------------------------------------------------------
// Classical Mediterranean Ports & Economic Commodities
// -------------------------------------------------------------
const PORTS_DATA = [
  { id: 'ostia', name: 'Ostia', latin: 'Portus Augusti (Roma)', x: 0.445, y: 0.385, region: 'Italia', exports: 'Vinum & Figlina', imports: 'Frumentum & Marmor', color: '#B33927' },
  { id: 'alexandria', name: 'Alexandria', latin: 'Alexandria ad Aegyptum', x: 0.825, y: 0.805, region: 'Aegyptus', exports: 'Frumentum & Papyri', imports: 'Argentum & Oleum', color: '#C29B38' },
  { id: 'carthago', name: 'Carthago', latin: 'Colonia Iunonia', x: 0.415, y: 0.630, region: 'Africa', exports: 'Oleum & Purpura', imports: 'Ferrum & Vinum', color: '#8C2B20' },
  { id: 'massalia', name: 'Massalia', latin: 'Massilia Phocaea', x: 0.285, y: 0.285, region: 'Gallia', exports: 'Stannum & Lana', imports: 'Garum & Oleum', color: '#2B5B84' },
  { id: 'athenae', name: 'Athenae', latin: 'Piraeus Athenarum', x: 0.695, y: 0.495, region: 'Graecia', exports: 'Marmor & Mel', imports: 'Frumentum & Trabes', color: '#265C38' },
  { id: 'byzantium', name: 'Byzantium', latin: 'Byzantium Thracicum', x: 0.780, y: 0.270, region: 'Thracia', exports: 'Sericum & Pisces', imports: 'Vinum & Oleum', color: '#8C5B26' },
  { id: 'gades', name: 'Gades', latin: 'Gades Baetica', x: 0.075, y: 0.605, region: 'Hispania', exports: 'Garum & Argentum', imports: 'Purpura & Vitrum', color: '#A04020' },
  { id: 'syracusae', name: 'Syracusae', latin: 'Syracusae Trinacriae', x: 0.525, y: 0.615, region: 'Sicilia', exports: 'Frumentum & Sulfur', imports: 'Textilia & Vinum', color: '#C27A28' },
  { id: 'antiochia', name: 'Antiochia', latin: 'Seleucia Pieria', x: 0.920, y: 0.540, region: 'Syria', exports: 'Aromata & Cedrus', imports: 'Argentum & Oleum', color: '#9E3A5A' },
  { id: 'ephesus', name: 'Ephesus', latin: 'Ephesus Asiana', x: 0.790, y: 0.450, region: 'Asia', exports: 'Pergamenum & Lana', imports: 'Frumentum & Garum', color: '#526A35' },
  { id: 'leptis', name: 'Leptis Magna', latin: 'Leptis Magna', x: 0.515, y: 0.790, region: 'Tripolitania', exports: 'Oleum & Ferae', imports: 'Vinum & Terra Sigillata', color: '#A86C32' },
  { id: 'rhodos', name: 'Rhodos', latin: 'Rhodos Dodecanesi', x: 0.805, y: 0.620, region: 'Rhodos', exports: 'Nautica & Vinum', imports: 'Frumentum & Linum', color: '#3A6B70' }
];

// -------------------------------------------------------------
// Historical Mediterranean Trade Network Routes (Waypoints)
// All waypoints carefully plotted through open maritime waters
// -------------------------------------------------------------
const TRADE_ROUTES_DATA = [
  {
    id: 'annona',
    name: 'Annona Aegyptiaca (Imperial Grain Fleet)',
    from: 'alexandria',
    to: 'ostia',
    cargo: 'Frumentum (Nile Wheat)',
    value: 850,
    color: '#D4AF37',
    waypoints: [
      { x: 0.825, y: 0.805 },
      { x: 0.740, y: 0.720 },
      { x: 0.650, y: 0.640 },
      { x: 0.525, y: 0.615 },
      { x: 0.515, y: 0.540 },
      { x: 0.460, y: 0.440 },
      { x: 0.445, y: 0.385 }
    ]
  },
  {
    id: 'africana',
    name: 'Via Africana (Carthaginian Oil & Purple)',
    from: 'carthago',
    to: 'ostia',
    cargo: 'Oleum & Purpura',
    value: 620,
    color: '#8C2B20',
    waypoints: [
      { x: 0.415, y: 0.630 },
      { x: 0.450, y: 0.570 },
      { x: 0.445, y: 0.480 },
      { x: 0.445, y: 0.385 }
    ]
  },
  {
    id: 'gallicus',
    name: 'Cursus Gallicus (Imperial Wine & Metals)',
    from: 'ostia',
    to: 'massalia',
    cargo: 'Vinum & Figlina',
    value: 480,
    color: '#2B5B84',
    waypoints: [
      { x: 0.445, y: 0.385 },
      { x: 0.380, y: 0.320 },
      { x: 0.330, y: 0.280 },
      { x: 0.285, y: 0.285 }
    ]
  },
  {
    id: 'hispanicus',
    name: 'Iter Hispanicum (Silver & Garum Route)',
    from: 'gades',
    to: 'massalia',
    cargo: 'Argentum & Garum',
    value: 710,
    color: '#A04020',
    waypoints: [
      { x: 0.075, y: 0.605 },
      { x: 0.110, y: 0.660 },
      { x: 0.170, y: 0.630 },
      { x: 0.240, y: 0.520 },
      { x: 0.260, y: 0.400 },
      { x: 0.285, y: 0.285 }
    ]
  },
  {
    id: 'aegaea',
    name: 'Classis Aegaea (Aegean Silk & Marble)',
    from: 'athenae',
    to: 'byzantium',
    cargo: 'Marmor & Sericum',
    value: 590,
    color: '#265C38',
    waypoints: [
      { x: 0.695, y: 0.495 },
      { x: 0.745, y: 0.460 },
      { x: 0.790, y: 0.450 },
      { x: 0.770, y: 0.340 },
      { x: 0.780, y: 0.270 }
    ]
  },
  {
    id: 'orientalis',
    name: 'Iter Orientale (Levantine Spices & Silk)',
    from: 'antiochia',
    to: 'alexandria',
    cargo: 'Aromata & Vitrum',
    value: 940,
    color: '#9E3A5A',
    waypoints: [
      { x: 0.920, y: 0.540 },
      { x: 0.880, y: 0.660 },
      { x: 0.805, y: 0.620 },
      { x: 0.780, y: 0.720 },
      { x: 0.825, y: 0.805 }
    ]
  },
  {
    id: 'tripolitana',
    name: 'Via Tripolitana (African Beasts & Ivory)',
    from: 'leptis',
    to: 'syracusae',
    cargo: 'Ferae & Oleum',
    value: 540,
    color: '#A86C32',
    waypoints: [
      { x: 0.515, y: 0.790 },
      { x: 0.510, y: 0.720 },
      { x: 0.525, y: 0.615 }
    ]
  },
  {
    id: 'transmare',
    name: 'Trans-Mare Nostrum (East-West Spine)',
    from: 'gades',
    to: 'alexandria',
    cargo: 'Pretiosa & Metallum',
    value: 1200,
    color: '#70428E',
    waypoints: [
      { x: 0.075, y: 0.605 },
      { x: 0.140, y: 0.650 },
      { x: 0.280, y: 0.620 },
      { x: 0.415, y: 0.630 },
      { x: 0.525, y: 0.615 },
      { x: 0.680, y: 0.680 },
      { x: 0.825, y: 0.805 }
    ]
  }
];

// -------------------------------------------------------------
// Coastline Polygons for Mediterranean Basin Cartography
// -------------------------------------------------------------
const COASTLINES = {
  europe: [
    [0.02, 0.55], [0.075, 0.61], [0.10, 0.62], [0.13, 0.58], [0.16, 0.51], [0.19, 0.44],
    [0.22, 0.38], [0.22, 0.28], [0.25, 0.27], [0.285, 0.285], [0.32, 0.26], [0.36, 0.26],
    [0.38, 0.30], [0.42, 0.35], [0.445, 0.385], [0.48, 0.43], [0.51, 0.49], [0.52, 0.54],
    [0.53, 0.55], [0.56, 0.53], [0.58, 0.48], [0.62, 0.46], [0.58, 0.42], [0.54, 0.36],
    [0.50, 0.30], [0.48, 0.25], [0.46, 0.20], [0.48, 0.18], [0.50, 0.20], [0.53, 0.26],
    [0.56, 0.32], [0.58, 0.36], [0.60, 0.40], [0.62, 0.44], [0.65, 0.47], [0.66, 0.52],
    [0.68, 0.57], [0.70, 0.52], [0.695, 0.495], [0.72, 0.45], [0.71, 0.38], [0.72, 0.33],
    [0.75, 0.31], [0.77, 0.29], [0.780, 0.270], [0.98, 0.10], [0.98, 0.02], [0.02, 0.02]
  ],
  anatolia: [
    [0.780, 0.270], [0.77, 0.33], [0.78, 0.38], [0.790, 0.450], [0.80, 0.50], [0.81, 0.56],
    [0.83, 0.59], [0.86, 0.58], [0.89, 0.57], [0.920, 0.540], [0.98, 0.54], [0.98, 0.27]
  ],
  levant: [
    [0.920, 0.540], [0.92, 0.60], [0.91, 0.65], [0.90, 0.71], [0.88, 0.77],
    [0.98, 0.77], [0.98, 0.54]
  ],
  africa: [
    [0.88, 0.77], [0.86, 0.79], [0.825, 0.805], [0.79, 0.80], [0.75, 0.79], [0.71, 0.78],
    [0.68, 0.76], [0.64, 0.77], [0.61, 0.82], [0.57, 0.84], [0.53, 0.81], [0.515, 0.790],
    [0.48, 0.79], [0.45, 0.78], [0.43, 0.73], [0.42, 0.68], [0.415, 0.630], [0.38, 0.64],
    [0.34, 0.65], [0.28, 0.67], [0.22, 0.68], [0.15, 0.69], [0.10, 0.70], [0.075, 0.69],
    [0.02, 0.72], [0.02, 0.98], [0.98, 0.98], [0.98, 0.77]
  ],
  sicilia: [
    [0.48, 0.57], [0.53, 0.56], [0.53, 0.62], [0.49, 0.63], [0.44, 0.60]
  ],
  sardinia: [
    [0.35, 0.44], [0.38, 0.44], [0.39, 0.53], [0.36, 0.54]
  ],
  corsica: [
    [0.35, 0.34], [0.38, 0.34], [0.38, 0.41], [0.35, 0.41]
  ],
  creta: [
    [0.69, 0.68], [0.73, 0.67], [0.78, 0.68], [0.77, 0.70], [0.71, 0.70]
  ],
  cyprus: [
    [0.86, 0.64], [0.91, 0.62], [0.92, 0.63], [0.88, 0.66]
  ],
  baleares: [
    [0.21, 0.48], [0.24, 0.46], [0.25, 0.48], [0.22, 0.50]
  ],
  rhodos: [
    [0.800, 0.610], [0.815, 0.615], [0.810, 0.628]
  ]
};

// -------------------------------------------------------------
// Ship Names & Roman Cargo Classes
// -------------------------------------------------------------
const MERCHANT_NAMES = [
  'Minerva', 'Fortuna', 'Castor', 'Pollux', 'Mercurius',
  'Isis Pharia', 'Triton', 'Victoria', 'Castitas', 'Salus',
  'Neptunus', 'Ceres', 'Roma Aeterna', 'Pegasus'
];

export class MareNostrumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    attachTouchBridge(this, canvas);

    // Simulation Timing & Animation Clock
    this.time = 0;
    this.totalVoyagesCompleted = 0;
    this.totalDenariiEarned = 14500;

    // Meteorology: 12-Wind Rose Model
    this.windIndex = 9; // Default: Favonius (Zephyrus, West wind)
    this.windVelocityKnots = 22.0; // 5 to 50 knots
    this.windFromCompassDeg = 270; // West
    this.windFlowAngle = compassToFlowAngle(this.windFromCompassDeg);
    this.gustTimer = 0;
    this.gustStrength = 1.0;

    // Display / Cartography Toggles
    this.showRhumbLines = true;
    this.showStreamlines = true;
    this.showTradeRoutes = true;
    this.showWindRose = true;

    // Player Flagship: Roman Navis Oneraria "Augusta"
    this.playerShip = {
      name: 'Augusta (Flagship)',
      x: this.width * 0.445,
      y: this.height * 0.385,
      vx: 0,
      vy: 0,
      heading: 0, // radians
      angularVel: 0,
      rudderInput: 0, // -1 (port) to +1 (starboard)
      sailTrimDeg: 35, // Lateen sail sheet trim angle (10° to 85°)
      autoTrim: true,
      tackSide: 1, // +1 (starboard tack), -1 (port tack)
      isTacking: false,
      tackTimer: 0,
      tackDuration: 2.2, // seconds
      targetHeading: null,
      autoNavPort: null,
      speedKnots: 0,
      apparentWindAngle: 0,
      apparentWindKnots: 0,
      leewayAngleDeg: 0,
      thrustForce: 0,
      inNoGoZone: false,
      cargoHold: 'Imperial Frumentum & Vinum',
      denarii: 3400,
      wakeTrail: []
    };

    // Fleet of Merchant Trade Ships
    this.merchantShips = [];
    this.maxMerchantShips = 9;

    // Wind Vector Streamline Particles
    this.windParticles = [];
    this.maxWindParticles = 260;

    // Floating Trade Reward Coins & Animations
    this.floatingCoins = [];

    // Interaction & Selection
    this.selectedPort = null;
    this.hoveredEntity = null;
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;

    // Key input state
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false,
      t: false,
      Space: false
    };

    // Audio synthesizer (safe guard)
    this.audioCtx = null;

    // Initialize simulation entities & UI
    this.initWindParticles();
    this.initMerchantFleet();
    this.initControls();
  }

  /* -------------------------------------------------------------------------- */
  /* INITIALIZATION HELPERS                                                     */
  /* -------------------------------------------------------------------------- */

  initWindParticles() {
    this.windParticles = [];
    for (let i = 0; i < this.maxWindParticles; i++) {
      this.windParticles.push(this.createWindParticle(true));
    }
  }

  createWindParticle(randomAge = false) {
    // Distribute across the Mediterranean canvas
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
      age: randomAge ? Math.random() * 4.0 : 0,
      maxAge: 3.0 + Math.random() * 2.5,
      speedMult: 0.7 + Math.random() * 0.6,
      alpha: Math.random() * 0.5 + 0.3
    };
  }

  initMerchantFleet() {
    this.merchantShips = [];
    for (let i = 0; i < this.maxMerchantShips; i++) {
      const route = TRADE_ROUTES_DATA[i % TRADE_ROUTES_DATA.length];
      const startWaypointIndex = Math.floor(Math.random() * (route.waypoints.length - 1));
      const wpA = route.waypoints[startWaypointIndex];
      const wpB = route.waypoints[startWaypointIndex + 1];
      const lerpT = Math.random();

      const posX = (wpA.x + (wpB.x - wpA.x) * lerpT) * this.width;
      const posY = (wpA.y + (wpB.y - wpA.y) * lerpT) * this.height;
      const initialHeading = Math.atan2(wpB.y - wpA.y, wpB.x - wpA.x);

      this.merchantShips.push({
        id: i,
        name: MERCHANT_NAMES[i % MERCHANT_NAMES.length],
        routeId: route.id,
        currentWpIndex: startWaypointIndex + 1,
        direction: 1, // +1 forward along route, -1 reverse
        x: posX,
        y: posY,
        vx: Math.cos(initialHeading) * 15,
        vy: Math.sin(initialHeading) * 15,
        heading: initialHeading,
        targetHeading: initialHeading,
        speedKnots: 8.0 + Math.random() * 6.0,
        sailTrimDeg: 40,
        tackSide: (i % 2 === 0) ? 1 : -1,
        isTacking: false,
        tackTimer: 0,
        cargo: route.cargo,
        value: route.value,
        color: route.color,
        wakeTrail: []
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* HEADLESS & DOM CONTROLS                                                    */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #D4AF37;">🌬️ Wind Velocity</span>
          <span id="lbl-wind-vel" style="font-family: monospace; color: #FFF;">${this.windVelocityKnots.toFixed(0)} Knots</span>
        </div>
        <input type="range" id="slider-wind-vel" min="5" max="50" step="1" value="${this.windVelocityKnots}" style="accent-color: #D4AF37; width: 100%;">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #D4AF37;">⛵ Sail Sheet Trim</span>
          <span id="lbl-sail-trim" style="font-family: monospace; color: #FFF;">${this.playerShip.sailTrimDeg.toFixed(0)}°</span>
        </div>
        <input type="range" id="slider-sail-trim" min="10" max="85" step="1" value="${this.playerShip.sailTrimDeg}" style="accent-color: #D4AF37; width: 100%;">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #D4AF37;">🧭 12-Wind Rose Meteorology</span>
          <span id="lbl-wind-name" style="font-family: monospace; color: #FFD700; font-size: 11px;">${WINDS_12[this.windIndex].name}</span>
        </div>
        <select id="select-wind-12" style="background: #1A1A24; color: #F5E6C8; border: 1px solid #D4AF37; padding: 6px; border-radius: 4px; font-size: 12px; width: 100%;">
          ${WINDS_12.map((w, idx) => `
            <option value="${idx}" ${idx === this.windIndex ? 'selected' : ''}>
              ${w.name} (${w.dir} ${w.compassDeg}°) — ${w.greek}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="control-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
        <button id="btn-tack" class="sub-btn" style="background: rgba(212, 175, 55, 0.25); border: 1px solid #D4AF37; color: #FFD700; font-weight: bold; padding: 8px; border-radius: 4px; cursor: pointer;">
          ⛵ Tack Ship (T)
        </button>
        <button id="btn-auto-trim" class="sub-btn" style="background: rgba(43, 91, 132, 0.35); border: 1px solid #48CAE4; color: #E0F7FA; font-weight: bold; padding: 8px; border-radius: 4px; cursor: pointer;">
          ⚖️ Auto-Trim (${this.playerShip.autoTrim ? 'ON' : 'OFF'})
        </button>
      </div>

      <div class="control-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
        <button id="btn-toggle-rhumb" class="sub-btn" style="background: rgba(38, 92, 56, 0.3); border: 1px solid #2E7D32; color: #A5D6A7; font-size: 11px; padding: 6px; border-radius: 4px; cursor: pointer;">
          🗺️ Rhumb Lines
        </button>
        <button id="btn-toggle-stream" class="sub-btn" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #AA8222; color: #FFE082; font-size: 11px; padding: 6px; border-radius: 4px; cursor: pointer;">
          💨 Streamlines
        </button>
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #C2B49E; line-height: 1.4; border-top: 1px solid rgba(212, 175, 55, 0.25); padding-top: 6px;">
        <div><strong>Helm Rudder:</strong> [A/D] or [←/→] Steer Bow</div>
        <div><strong>Sheet Trim:</strong> [W/S] or [↑/↓] Ease / Haul Lateen Sheet</div>
        <div><strong>Course Plotting:</strong> Click any Port to auto-navigate</div>
        <div><strong>Tack Maneuver:</strong> Press [T] to swing bow across wind eye</div>
      </div>
    `;

    // Bind UI inputs
    const sliderWindVel = this.controlsContainer.querySelector('#slider-wind-vel');
    const lblWindVel = this.controlsContainer.querySelector('#lbl-wind-vel');
    if (sliderWindVel) {
      sliderWindVel.addEventListener('input', (e) => {
        this.windVelocityKnots = parseFloat(e.target.value);
        if (lblWindVel) lblWindVel.textContent = `${this.windVelocityKnots.toFixed(0)} Knots`;
      });
    }

    const sliderSailTrim = this.controlsContainer.querySelector('#slider-sail-trim');
    const lblSailTrim = this.controlsContainer.querySelector('#lbl-sail-trim');
    if (sliderSailTrim) {
      sliderSailTrim.addEventListener('input', (e) => {
        this.playerShip.sailTrimDeg = parseFloat(e.target.value);
        this.playerShip.autoTrim = false;
        const btnAuto = this.controlsContainer.querySelector('#btn-auto-trim');
        if (btnAuto) btnAuto.textContent = '⚖️ Auto-Trim (OFF)';
        if (lblSailTrim) lblSailTrim.textContent = `${this.playerShip.sailTrimDeg.toFixed(0)}°`;
      });
    }

    const selectWind12 = this.controlsContainer.querySelector('#select-wind-12');
    const lblWindName = this.controlsContainer.querySelector('#lbl-wind-name');
    if (selectWind12) {
      selectWind12.addEventListener('change', (e) => {
        this.setWind(parseInt(e.target.value, 10));
        if (lblWindName) lblWindName.textContent = WINDS_12[this.windIndex].name;
      });
    }

    const btnTack = this.controlsContainer.querySelector('#btn-tack');
    if (btnTack) {
      btnTack.addEventListener('click', () => {
        this.executeTack(this.playerShip);
      });
    }

    const btnAutoTrim = this.controlsContainer.querySelector('#btn-auto-trim');
    if (btnAutoTrim) {
      btnAutoTrim.addEventListener('click', () => {
        this.playerShip.autoTrim = !this.playerShip.autoTrim;
        btnAutoTrim.textContent = `⚖️ Auto-Trim (${this.playerShip.autoTrim ? 'ON' : 'OFF'})`;
      });
    }

    const btnToggleRhumb = this.controlsContainer.querySelector('#btn-toggle-rhumb');
    if (btnToggleRhumb) {
      btnToggleRhumb.addEventListener('click', () => {
        this.showRhumbLines = !this.showRhumbLines;
        btnToggleRhumb.style.opacity = this.showRhumbLines ? '1' : '0.5';
      });
    }

    const btnToggleStream = this.controlsContainer.querySelector('#btn-toggle-stream');
    if (btnToggleStream) {
      btnToggleStream.addEventListener('click', () => {
        this.showStreamlines = !this.showStreamlines;
        btnToggleStream.style.opacity = this.showStreamlines ? '1' : '0.5';
      });
    }
  }

  setWind(windIdx) {
    this.windIndex = ((windIdx % 12) + 12) % 12;
    const w = WINDS_12[this.windIndex];
    this.windFromCompassDeg = w.compassDeg;
    this.windFlowAngle = compassToFlowAngle(this.windFromCompassDeg);

    if (this.controlsContainer && typeof document !== 'undefined') {
      const sel = this.controlsContainer.querySelector('#select-wind-12');
      if (sel) sel.value = this.windIndex;
      const lbl = this.controlsContainer.querySelector('#lbl-wind-name');
      if (lbl) lbl.textContent = w.name;
    }
  }

  executeTack(ship) {
    if (ship.isTacking) return;
    ship.isTacking = true;
    ship.tackTimer = 0;
    // Reverse tack side
    ship.tackSide = -ship.tackSide;

    // Trigger subtle tacking chime if audio is enabled
    this.playAudioTone(330, 0.15, 'triangle');
  }

  playAudioTone(freq, dur, type = 'sine') {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur);
    } catch {
      // Audio not permitted or supported; silent fallback
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE: RESIZE, ENTITY COUNT, RESET, DESTROY                            */
  /* -------------------------------------------------------------------------- */

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  resize(width, height, dpr = 1) {
    const oldW = this.width || 800;
    const oldH = this.height || 600;

    this.width = width;
    this.height = height;
    this.dpr = dpr;

    // Scale positions proportionally if canvas resized
    const scaleX = width / oldW;
    const scaleY = height / oldH;

    this.playerShip.x *= scaleX;
    this.playerShip.y *= scaleY;

    this.merchantShips.forEach(ship => {
      ship.x *= scaleX;
      ship.y *= scaleY;
    });

    this.windParticles.forEach(p => {
      p.x *= scaleX;
      p.y *= scaleY;
    });
  }

  getEntityCount() {
    // Return total active simulated entities:
    // Trade Routes + Merchant Ships + Player Ship + Wind Particles + Floating Coins
    const routesCount = TRADE_ROUTES_DATA.length;
    const shipsCount = 1 + (this.merchantShips ? this.merchantShips.length : 0);
    const particlesCount = this.windParticles ? this.windParticles.length : 0;
    const coinsCount = this.floatingCoins ? this.floatingCoins.length : 0;
    return routesCount + shipsCount + particlesCount + coinsCount;
  }

  reset() {
    this.windIndex = 9; // Favonius
    this.windVelocityKnots = 22.0;
    this.setWind(9);

    this.playerShip.x = this.width * 0.445;
    this.playerShip.y = this.height * 0.385;
    this.playerShip.vx = 0;
    this.playerShip.vy = 0;
    this.playerShip.heading = 0;
    this.playerShip.angularVel = 0;
    this.playerShip.sailTrimDeg = 35;
    this.playerShip.autoTrim = true;
    this.playerShip.isTacking = false;
    this.playerShip.autoNavPort = null;
    this.playerShip.targetHeading = null;
    this.playerShip.wakeTrail = [];

    this.initWindParticles();
    this.initMerchantFleet();
    this.floatingCoins = [];
    this.selectedPort = null;
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer && typeof document !== 'undefined') {
      this.controlsContainer.innerHTML = '';
    }
    this.windParticles = [];
    this.merchantShips = [];
    this.floatingCoins = [];
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* SIMULATION: UPDATE & VECTOR PHYSICS                                        */
  /* -------------------------------------------------------------------------- */

  update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;
    dt = Math.min(dt, 0.066); // Clamp maximum step
    this.time += dt;

    // Wind gustiness & slight directional oscillation
    this.gustTimer += dt * 0.5;
    this.gustStrength = 1.0 + Math.sin(this.gustTimer * 1.7) * 0.15;
    const currentWindFlowAngle = this.windFlowAngle + Math.sin(this.gustTimer * 0.8) * 0.08;
    const currentWindSpeed = this.windVelocityKnots * this.gustStrength;

    // 1. Update Wind Vector Streamlines
    this.updateWindParticles(dt, currentWindFlowAngle, currentWindSpeed);

    // 2. Update Player Ship Lateen Sailing Physics
    this.updatePlayerShip(dt, currentWindFlowAngle, currentWindSpeed);

    // 3. Update Merchant Ships AI & Trade Cycle
    this.updateMerchantFleet(dt, currentWindFlowAngle, currentWindSpeed);

    // 4. Update Floating Trade Coin Popups
    this.updateFloatingCoins(dt);
  }

  updateWindParticles(dt, windAngle, windSpeed) {
    const flowVx = Math.cos(windAngle) * (windSpeed * 3.5);
    const flowVy = Math.sin(windAngle) * (windSpeed * 3.5);

    for (let i = 0; i < this.windParticles.length; i++) {
      const p = this.windParticles[i];
      p.age += dt;

      // Subtle turbulence curl
      const turb = Math.sin(p.y * 0.01 + this.time * 2) * 8;
      p.x += (flowVx + turb) * dt * p.speedMult;
      p.y += flowVy * dt * p.speedMult;

      // Wrap-around bounds with fade
      if (p.age >= p.maxAge || p.x < -20 || p.x > this.width + 20 || p.y < -20 || p.y > this.height + 20) {
        // Respawn at upwind edge
        p.age = 0;
        if (Math.abs(flowVx) > Math.abs(flowVy)) {
          p.x = flowVx > 0 ? -10 : this.width + 10;
          p.y = Math.random() * this.height;
        } else {
          p.x = Math.random() * this.width;
          p.y = flowVy > 0 ? -10 : this.height + 10;
        }
      }
    }
  }

  updatePlayerShip(dt, windFlowAngle, windSpeed) {
    const ship = this.playerShip;

    // Keyboard & input steering
    let steerDelta = 0;
    if (this.keys.ArrowLeft || this.keys.a) steerDelta -= 1.8;
    if (this.keys.ArrowRight || this.keys.d) steerDelta += 1.8;

    // Sail trim inputs
    if (this.keys.ArrowUp || this.keys.w) {
      ship.sailTrimDeg = clamp(ship.sailTrimDeg - dt * 35, 10, 85);
      ship.autoTrim = false;
    }
    if (this.keys.ArrowDown || this.keys.s) {
      ship.sailTrimDeg = clamp(ship.sailTrimDeg + dt * 35, 10, 85);
      ship.autoTrim = false;
    }

    // Auto-Navigation to Selected Port Waypoint
    if (ship.autoNavPort) {
      const targetX = ship.autoNavPort.x * this.width;
      const targetY = ship.autoNavPort.y * this.height;
      const dist = Math.hypot(targetX - ship.x, targetY - ship.y);

      if (dist < 25) {
        // Arrived at port! Complete voyage
        this.arriveAtPort(ship, ship.autoNavPort);
        ship.autoNavPort = null;
        ship.targetHeading = null;
      } else {
        const desiredHeading = Math.atan2(targetY - ship.y, targetX - ship.x);
        ship.targetHeading = desiredHeading;
      }
    }

    // Steer towards target heading if active
    if (ship.targetHeading !== null && steerDelta === 0) {
      const headingDiff = normalizeAngle(ship.targetHeading - ship.heading);
      steerDelta = clamp(headingDiff * 2.5, -1.8, 1.8);
      if (Math.abs(headingDiff) < 0.05) {
        ship.targetHeading = null;
      }
    }

    // Angular acceleration & damping
    ship.angularVel += steerDelta * dt * 2.0;
    ship.angularVel *= Math.pow(0.85, dt * 60);
    ship.heading = normalizeAngle(ship.heading + ship.angularVel * dt);

    // Vector Sailing Physics: Apparent Wind Calculation
    // True wind vector (px/s equivalent to knots * 2.0)
    const trueWindVx = Math.cos(windFlowAngle) * (windSpeed * 2.0);
    const trueWindVy = Math.sin(windFlowAngle) * (windSpeed * 2.0);

    // Apparent wind vector = True wind - Ship velocity
    const appVx = trueWindVx - ship.vx;
    const appVy = trueWindVy - ship.vy;
    const appSpeed = Math.hypot(appVx, appVy);
    const appAngle = Math.atan2(appVy, appVx);

    ship.apparentWindKnots = appSpeed / 2.0;
    ship.apparentWindAngle = appAngle;

    // Angle of apparent wind relative to ship bow heading
    // 0 = wind blowing towards same heading (following wind / running)
    // +/-PI = wind blowing towards opposite direction (headwind / beating)
    const relFlowAngle = normalizeAngle(appAngle - ship.heading);
    const absRelAngle = Math.abs(relFlowAngle);

    // No-Go Zone: Close-hauled limit for Mediterranean lateen rig (~45° from headwind)
    // Headwind occurs when relFlowAngle is near PI or -PI
    const angleFromHeadwind = Math.abs(Math.PI - absRelAngle);
    const noGoThreshold = 42 * DEG2RAD; // 42° cone around headwind
    ship.inNoGoZone = angleFromHeadwind < noGoThreshold;

    // Automatic sail tack switching if not manual tacking
    if (!ship.isTacking) {
      if (relFlowAngle > 0) ship.tackSide = 1; // Starboard tack
      else ship.tackSide = -1; // Port tack
    } else {
      // Active tacking maneuver
      ship.tackTimer += dt;
      // Force smooth rotation through the wind eye
      const turnDir = ship.tackSide;
      ship.heading = normalizeAngle(ship.heading + turnDir * dt * 1.6);

      if (ship.tackTimer >= ship.tackDuration) {
        ship.isTacking = false;
        ship.tackTimer = 0;
      }
    }

    // Auto-Trim: compute optimal lateen angle of attack (~18° to 22°)
    if (ship.autoTrim && !ship.inNoGoZone) {
      // Optimal sheet trim based on apparent wind angle
      const idealTrim = clamp(Math.round((angleFromHeadwind * RAD2DEG) - 20), 12, 80);
      ship.sailTrimDeg = idealTrim;
    }

    // Aerodynamic Lift & Drag on Lateen Sail
    let thrustForce = 0;
    let lateralForce = 0;

    if (ship.inNoGoZone || ship.isTacking) {
      // Sail luffs / flutters: drag pushes vessel back, no lift generated
      const flapDrag = 0.25;
      thrustForce = -0.5 * flapDrag * appSpeed * Math.cos(relFlowAngle);
      lateralForce = 0.1 * flapDrag * appSpeed * Math.sin(relFlowAngle);
    } else {
      // Effective angle of attack alpha = wind angle - sheet trim
      const sheetRad = ship.sailTrimDeg * DEG2RAD;
      const alpha = clamp(angleFromHeadwind - sheetRad, 0, Math.PI / 3);

      // Lateen lift coefficient: CL = 1.8 * sin(2*alpha)
      const cLift = 1.8 * Math.sin(2.0 * alpha);
      // Parasitic + induced drag coefficient: CD = 0.15 + 1.2 * sin^2(alpha)
      const cDrag = 0.15 + 1.2 * Math.sin(alpha) * Math.sin(alpha);

      // Aerodynamic force magnitude
      const aeroMag = 0.08 * (appSpeed * appSpeed);
      // Resolved along bow axis (thrust) and perpendicular (lateral leeway)
      thrustForce = aeroMag * (cLift * Math.sin(absRelAngle) - cDrag * Math.cos(absRelAngle));
      lateralForce = aeroMag * (cLift * Math.cos(absRelAngle) + cDrag * Math.sin(absRelAngle)) * Math.sign(relFlowAngle);
    }

    ship.thrustForce = thrustForce;

    // Hydrodynamic Resistance & Keel Leeway
    // Forward water drag (quadratic)
    const bowX = Math.cos(ship.heading);
    const bowY = Math.sin(ship.heading);
    const fwdSpeed = ship.vx * bowX + ship.vy * bowY;
    const waterDrag = -0.06 * fwdSpeed * Math.abs(fwdSpeed);

    // Keel lateral resistance: high damping of sideways slip, but leaving realistic leeway
    const beamX = -Math.sin(ship.heading);
    const beamY = Math.cos(ship.heading);
    const lateralSpeed = ship.vx * beamX + ship.vy * beamY;
    const keelResistance = -0.85 * lateralSpeed;

    // Leeway drift angle
    ship.leewayAngleDeg = (Math.abs(fwdSpeed) > 0.5) ? Math.atan2(lateralSpeed, fwdSpeed) * RAD2DEG : 0;

    // Integrate accelerations
    const netAx = bowX * (thrustForce + waterDrag) + beamX * (lateralForce * 0.15 + keelResistance);
    const netAy = bowY * (thrustForce + waterDrag) + beamY * (lateralForce * 0.15 + keelResistance);

    ship.vx += netAx * dt;
    ship.vy += netAy * dt;

    // Apply soft velocity damping
    ship.vx *= Math.pow(0.96, dt * 60);
    ship.vy *= Math.pow(0.96, dt * 60);

    // Update position
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Speed in knots
    ship.speedKnots = Math.hypot(ship.vx, ship.vy) / 2.0;

    // Clamp inside sea boundaries
    ship.x = clamp(ship.x, 25, this.width - 25);
    ship.y = clamp(ship.y, 25, this.height - 25);

    // Wake trail particles
    if (Math.hypot(ship.vx, ship.vy) > 3.0 && Math.random() < 0.4) {
      ship.wakeTrail.push({
        x: ship.x - bowX * 14,
        y: ship.y - bowY * 14,
        life: 1.0,
        radius: 3.5
      });
    }

    // Decay wake trail
    for (let i = ship.wakeTrail.length - 1; i >= 0; i--) {
      const w = ship.wakeTrail[i];
      w.life -= dt * 0.8;
      w.radius += dt * 3.0;
      if (w.life <= 0) ship.wakeTrail.splice(i, 1);
    }
  }

  updateMerchantFleet(dt, windFlowAngle, windSpeed) {
    for (let i = 0; i < this.merchantShips.length; i++) {
      const ship = this.merchantShips[i];
      const route = TRADE_ROUTES_DATA.find(r => r.id === ship.routeId) || TRADE_ROUTES_DATA[0];
      const waypoints = route.waypoints;

      const targetWp = waypoints[ship.currentWpIndex];
      const targetX = targetWp.x * this.width;
      const targetY = targetWp.y * this.height;

      const dist = Math.hypot(targetX - ship.x, targetY - ship.y);

      if (dist < 22) {
        // Reached waypoint! Step to next
        if (ship.direction > 0) {
          ship.currentWpIndex++;
          if (ship.currentWpIndex >= waypoints.length) {
            // Reached destination port! Trade cargo & reverse route
            this.arriveAtPort(ship, PORTS_DATA.find(p => p.id === route.to) || PORTS_DATA[0]);
            ship.direction = -1;
            ship.currentWpIndex = waypoints.length - 2;
          }
        } else {
          ship.currentWpIndex--;
          if (ship.currentWpIndex < 0) {
            // Reached origin port! Trade cargo & reverse route
            this.arriveAtPort(ship, PORTS_DATA.find(p => p.id === route.from) || PORTS_DATA[0]);
            ship.direction = 1;
            ship.currentWpIndex = 1;
          }
        }
      }

      // Steer toward current waypoint
      const desiredHeading = Math.atan2(targetY - ship.y, targetX - ship.x);
      const headingDiff = normalizeAngle(desiredHeading - ship.heading);
      ship.heading = normalizeAngle(ship.heading + clamp(headingDiff, -1.4, 1.4) * dt * 2.0);

      // Lateen Sail aerodynamics for merchant vessel
      const relFlowAngle = normalizeAngle(windFlowAngle - ship.heading);
      const absRel = Math.abs(relFlowAngle);
      const angleFromHeadwind = Math.abs(Math.PI - absRel);

      // AI auto-trims sail
      ship.sailTrimDeg = clamp(Math.round(angleFromHeadwind * RAD2DEG - 18), 15, 75);
      ship.tackSide = relFlowAngle > 0 ? 1 : -1;

      // Speed modulation based on point of sail
      let sailEfficiency = 1.0;
      if (angleFromHeadwind < 40 * DEG2RAD) {
        // Tacking in headwind: slower progress
        sailEfficiency = 0.45;
      } else if (absRel > 80 * DEG2RAD && absRel < 130 * DEG2RAD) {
        // Beam / broad reach: peak lateen speed!
        sailEfficiency = 1.4;
      } else {
        // Running before wind
        sailEfficiency = 1.1;
      }

      const targetSpeed = (8.0 + (windSpeed * 0.4) * sailEfficiency) * 2.2;
      ship.vx = Math.cos(ship.heading) * targetSpeed;
      ship.vy = Math.sin(ship.heading) * targetSpeed;

      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;

      // Wake trail
      if (Math.random() < 0.25) {
        ship.wakeTrail.push({
          x: ship.x - Math.cos(ship.heading) * 10,
          y: ship.y - Math.sin(ship.heading) * 10,
          life: 0.8,
          radius: 2.5
        });
      }

      for (let wIdx = ship.wakeTrail.length - 1; wIdx >= 0; wIdx--) {
        const w = ship.wakeTrail[wIdx];
        w.life -= dt * 0.9;
        w.radius += dt * 2.5;
        if (w.life <= 0) ship.wakeTrail.splice(wIdx, 1);
      }
    }
  }

  arriveAtPort(ship, port) {
    this.totalVoyagesCompleted++;
    const reward = Math.round(500 + Math.random() * 400);
    this.totalDenariiEarned += reward;

    // Spawn floating gold coin popup
    this.floatingCoins.push({
      x: ship.x,
      y: ship.y - 10,
      text: `+${reward} Denarii (${port.name})`,
      life: 1.8,
      maxLife: 1.8,
      color: '#FFD700'
    });

    // Play pleasant harbor arrival chime
    this.playAudioTone(523.25, 0.22, 'sine'); // C5
    setTimeout(() => this.playAudioTone(659.25, 0.35, 'sine'), 120); // E5
  }

  updateFloatingCoins(dt) {
    for (let i = this.floatingCoins.length - 1; i >= 0; i--) {
      const c = this.floatingCoins[i];
      c.life -= dt;
      c.y -= dt * 24; // Float upward
      if (c.life <= 0) {
        this.floatingCoins.splice(i, 1);
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDERING: PORTOLAN CARTOGRAPHY & NAUTICAL STYLING                         */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    if (!ctx) return;

    ctx.save();

    // 1. Parchment Sea Background & Vintage Grid
    this.renderParchmentSea(ctx);

    // 2. Mediterranean Coastlines & Roman Provinces
    this.renderCoastlines(ctx);

    // 3. Portolan Rhumb Lines Network (Loxodromes)
    if (this.showRhumbLines) {
      this.renderPortolanRhumbLines(ctx);
    }

    // 4. Central Classical Wind Rose Medallion
    if (this.showWindRose) {
      this.renderWindRoseMedallion(ctx);
    }

    // 5. Historical Trade Route Networks
    if (this.showTradeRoutes) {
      this.renderTradeRoutes(ctx);
    }

    // 6. Wind Vector Streamlines
    if (this.showStreamlines) {
      this.renderWindStreamlines(ctx);
    }

    // 7. Classical Mediterranean Ports
    this.renderPorts(ctx);

    // 8. Merchant Ships & Lateen Sails
    this.renderMerchantFleet(ctx);

    // 9. Player Roman Navis Oneraria "Augusta"
    this.renderPlayerShip(ctx);

    // 10. Floating Trade Coins
    this.renderFloatingCoins(ctx);

    // 11. Portolan Chart Border & Degree Scales
    this.renderPortolanBorder(ctx);

    // 12. Nautical Telemetry HUD & Roman Helm Readout
    this.renderNauticalTelemetryHUD(ctx);

    // 13. Hover Tooltips
    this.renderHoverTooltip(ctx);

    ctx.restore();
  }

  renderParchmentSea(ctx) {
    // Base aged parchment tint: #F5E6C8
    const seaGrad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.5, 50,
      this.width * 0.5, this.height * 0.5, Math.hypot(this.width, this.height) * 0.65
    );
    seaGrad.addColorStop(0, '#F5E6C8');
    seaGrad.addColorStop(0.7, '#EFE0BE');
    seaGrad.addColorStop(1, '#D8C39E');

    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle antique parchment grid lines (every 60px)
    ctx.strokeStyle = 'rgba(140, 110, 75, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < this.width; x += 60) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 40; y < this.height; y += 60) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();

    // Latin Sea Names in antique calligraphic style
    ctx.save();
    ctx.fillStyle = 'rgba(90, 70, 48, 0.28)';
    ctx.font = 'italic 16px "Cinzel", "Palatino Linotype", "Times New Roman", serif';
    ctx.textAlign = 'center';

    ctx.fillText('MARE NOSTRUM', this.width * 0.58, this.height * 0.52);

    ctx.font = 'italic 11px "Cinzel", "Palatino Linotype", "Times New Roman", serif';
    ctx.fillText('MARE TYRRHENUM', this.width * 0.43, this.height * 0.48);
    ctx.fillText('MARE IONIUM', this.width * 0.60, this.height * 0.65);
    ctx.fillText('MARE AEGAEUM', this.width * 0.74, this.height * 0.48);
    ctx.fillText('MARE IBERICUM', this.width * 0.20, this.height * 0.58);
    ctx.fillText('SINUS GALLICUS', this.width * 0.29, this.height * 0.35);
    ctx.restore();
  }

  renderCoastlines(ctx) {
    ctx.save();

    // Landmass Fill: Warm vellum tone
    ctx.fillStyle = '#E5D4B5';
    ctx.strokeStyle = '#2A2016'; // Dark ink contour
    ctx.lineWidth = 1.4;

    const drawPolygon = (points) => {
      if (!points || points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0] * this.width, points[0][1] * this.height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * this.width, points[i][1] * this.height);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Main continental masses
    drawPolygon(COASTLINES.europe);
    drawPolygon(COASTLINES.anatolia);
    drawPolygon(COASTLINES.levant);
    drawPolygon(COASTLINES.africa);

    // Mediterranean Islands
    drawPolygon(COASTLINES.sicilia);
    drawPolygon(COASTLINES.sardinia);
    drawPolygon(COASTLINES.corsica);
    drawPolygon(COASTLINES.creta);
    drawPolygon(COASTLINES.cyprus);
    drawPolygon(COASTLINES.baleares);
    drawPolygon(COASTLINES.rhodos);

    // Coastal stippling / hatch shading facing inland (authentic Portolan aesthetic)
    ctx.strokeStyle = 'rgba(100, 75, 50, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 3]);
    const strokeIslandDash = (points) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0] * this.width, points[0][1] * this.height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * this.width, points[i][1] * this.height);
      }
      ctx.closePath();
      ctx.stroke();
    };
    strokeIslandDash(COASTLINES.sicilia);
    strokeIslandDash(COASTLINES.sardinia);
    strokeIslandDash(COASTLINES.creta);
    ctx.setLineDash([]);

    // Roman Province Cartographic Labels
    ctx.fillStyle = 'rgba(70, 50, 30, 0.45)';
    ctx.font = 'bold 12px "Cinzel", "Palatino Linotype", "Times New Roman", serif';
    ctx.textAlign = 'center';

    ctx.fillText('ITALIA', this.width * 0.47, this.height * 0.28);
    ctx.fillText('HISPANIA', this.width * 0.12, this.height * 0.42);
    ctx.fillText('GALLIA', this.width * 0.24, this.height * 0.18);
    ctx.fillText('GRAECIA', this.width * 0.66, this.height * 0.40);
    ctx.fillText('ASIA MINOR', this.width * 0.87, this.height * 0.38);
    ctx.fillText('AEGYPTUS', this.width * 0.86, this.height * 0.88);
    ctx.fillText('AFRICA PROCONSULARIS', this.width * 0.34, this.height * 0.76);
    ctx.fillText('TRIPOLITANIA', this.width * 0.58, this.height * 0.89);

    ctx.restore();
  }

  renderPortolanRhumbLines(ctx) {
    ctx.save();

    // 3 Classical Portolan Center Hubs across the Mediterranean
    const hubs = [
      { x: this.width * 0.60, y: this.height * 0.58 }, // Central Ionian Hub
      { x: this.width * 0.26, y: this.height * 0.48 }, // Western Balearic Hub
      { x: this.width * 0.84, y: this.height * 0.68 }  // Eastern Levantine Hub
    ];

    const radius = Math.hypot(this.width, this.height);

    hubs.forEach((hub, hIdx) => {
      // 16 or 32 rhumb line radials
      const numLines = (hIdx === 0) ? 32 : 16;
      for (let i = 0; i < numLines; i++) {
        const ang = (i * TWO_PI) / numLines;
        const endX = hub.x + Math.cos(ang) * radius;
        const endY = hub.y + Math.sin(ang) * radius;

        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(endX, endY);

        // Portolan Color Convention:
        // Cardinal directions (0°, 90°, 180°, 270°): Dark Ink #1A1A24
        // Half-winds (45°, 135°, etc.): Portolan Forest Green #265C38
        // Quarter-winds: Venetian Sienna Red #8C2B20
        if (i % (numLines / 4) === 0) {
          ctx.strokeStyle = 'rgba(26, 26, 36, 0.32)';
          ctx.lineWidth = 1.2;
        } else if (i % (numLines / 8) === 0) {
          ctx.strokeStyle = 'rgba(38, 92, 56, 0.24)';
          ctx.lineWidth = 0.9;
        } else {
          ctx.strokeStyle = 'rgba(140, 43, 32, 0.18)';
          ctx.lineWidth = 0.7;
        }
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  renderWindRoseMedallion(ctx) {
    ctx.save();

    // Center of master wind rose in the central Ionian basin
    const cx = this.width * 0.60;
    const cy = this.height * 0.58;
    const outerR = 52;
    const innerR = 44;

    // Outer concentric gold rings (#D4AF37)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, TWO_PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, TWO_PI);
    ctx.stroke();

    // Classical 12-Wind faceted star points
    const pointsCount = 12;
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i * TWO_PI) / pointsCount - Math.PI / 2;
      const nextAngle = ((i + 1) * TWO_PI) / pointsCount - Math.PI / 2;
      const midAngle = angle + (Math.PI / pointsCount);

      const tipX = cx + Math.cos(angle) * outerR;
      const tipY = cy + Math.sin(angle) * outerR;
      const innerMidX = cx + Math.cos(midAngle) * (innerR * 0.42);
      const innerMidY = cy + Math.sin(midAngle) * (innerR * 0.42);

      // Half Dark Ink #1A1A24
      ctx.fillStyle = (i % 2 === 0) ? '#1A1A24' : '#8C2B20';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(innerMidX, innerMidY);
      ctx.closePath();
      ctx.fill();

      // Half Gold #D4AF37
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(innerMidX, innerMidY);
      const nextTipX = cx + Math.cos(nextAngle) * outerR;
      const nextTipY = cy + Math.sin(nextAngle) * outerR;
      ctx.lineTo(nextTipX, nextTipY);
      ctx.closePath();
      ctx.fill();
    }

    // Fleur-de-lis pointing Septentrio (North)
    ctx.fillStyle = '#D4AF37';
    ctx.strokeStyle = '#1A1A24';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR - 10);
    ctx.lineTo(cx - 5, cy - outerR + 2);
    ctx.lineTo(cx, cy - outerR - 2);
    ctx.lineTo(cx + 5, cy - outerR + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central brass jewel
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, TWO_PI);
    ctx.fill();
    ctx.strokeStyle = '#1A1A24';
    ctx.stroke();

    ctx.fillStyle = '#8C2B20';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, TWO_PI);
    ctx.fill();

    // Active Wind Arrow showing current meteorology flow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.windFlowAngle);

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-innerR * 0.7, 0);
    ctx.lineTo(innerR * 0.9, 0);
    ctx.lineTo(innerR * 0.6, -6);
    ctx.moveTo(innerR * 0.9, 0);
    ctx.lineTo(innerR * 0.6, 6);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderTradeRoutes(ctx) {
    ctx.save();

    TRADE_ROUTES_DATA.forEach(route => {
      const wps = route.waypoints;
      if (!wps || wps.length < 2) return;

      // Draw dashed maritime shipping path
      ctx.strokeStyle = route.color;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 6]);
      ctx.globalAlpha = 0.55;

      ctx.beginPath();
      ctx.moveTo(wps[0].x * this.width, wps[0].y * this.height);
      for (let i = 1; i < wps.length; i++) {
        ctx.lineTo(wps[i].x * this.width, wps[i].y * this.height);
      }
      ctx.stroke();

      // Draw glowing trading pulse along route
      const pulseT = (this.time * 0.2 + route.waypoints.length * 0.15) % 1.0;
      const totalSegments = wps.length - 1;
      const segIndex = Math.min(Math.floor(pulseT * totalSegments), totalSegments - 1);
      const segT = (pulseT * totalSegments) - segIndex;

      const pA = wps[segIndex];
      const pB = wps[segIndex + 1];
      const pulseX = (pA.x + (pB.x - pA.x) * segT) * this.width;
      const pulseY = (pA.y + (pB.y - pA.y) * segT) * this.height;

      ctx.setLineDash([]);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = route.color;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 3, 0, TWO_PI);
      ctx.fill();
    });

    ctx.restore();
  }

  renderWindStreamlines(ctx) {
    ctx.save();

    for (let i = 0; i < this.windParticles.length; i++) {
      const p = this.windParticles[i];
      const lifeRatio = p.age / p.maxAge;
      const alpha = Math.sin(lifeRatio * Math.PI) * p.alpha;

      const trailLen = 14 + p.speedMult * 8;
      const tailX = p.x - Math.cos(this.windFlowAngle) * trailLen;
      const tailY = p.y - Math.sin(this.windFlowAngle) * trailLen;

      ctx.strokeStyle = (i % 3 === 0) ? `rgba(212, 175, 55, ${alpha})` : `rgba(26, 26, 36, ${alpha * 0.7})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderPorts(ctx) {
    ctx.save();

    PORTS_DATA.forEach(port => {
      const px = port.x * this.width;
      const py = port.y * this.height;

      const isHovered = this.hoveredEntity && this.hoveredEntity.id === port.id;
      const isSelected = this.selectedPort && this.selectedPort.id === port.id;

      // Outer gold beacon ring
      ctx.strokeStyle = isSelected ? '#FFD700' : '#D4AF37';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 9 : 7, 0, TWO_PI);
      ctx.stroke();

      // Port emblem fill
      ctx.fillStyle = port.color;
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 7 : 5, 0, TWO_PI);
      ctx.fill();

      // Center anchor dot
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, TWO_PI);
      ctx.fill();

      // Port Latin Name Banner
      ctx.fillStyle = '#1A1A24';
      ctx.font = 'bold 11px "Cinzel", "Palatino Linotype", "Times New Roman", serif';
      ctx.textAlign = 'center';

      // Slight parchment label backing
      const textW = ctx.measureText(port.name).width;
      ctx.fillStyle = 'rgba(245, 230, 200, 0.85)';
      ctx.fillRect(px - textW * 0.5 - 3, py + 8, textW + 6, 13);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - textW * 0.5 - 3, py + 8, textW + 6, 13);

      ctx.fillStyle = '#1A1A24';
      ctx.fillText(port.name, px, py + 18);
    });

    ctx.restore();
  }

  renderMerchantFleet(ctx) {
    ctx.save();

    for (let i = 0; i < this.merchantShips.length; i++) {
      const ship = this.merchantShips[i];

      // Draw wake foam trail
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ship.wakeTrail.forEach(w => {
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, TWO_PI);
        ctx.fill();
      });

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.heading);

      // Wooden hull of Roman merchantman (Navis Oneraria)
      ctx.fillStyle = '#5A3825'; // Dark oak wood
      ctx.strokeStyle = '#1A1A24';
      ctx.lineWidth = 1.0;

      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 4.5, 0, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();

      // Lateen yard & triangular sail
      const yardAngle = (ship.tackSide > 0) ? 0.35 : -0.35;
      ctx.save();
      ctx.rotate(yardAngle);

      // Lateen spar
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(8, 4);
      ctx.stroke();

      // Triangular canvas velum with route accent color
      ctx.fillStyle = ship.color || '#F5E6C8';
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(8, 4);
      ctx.lineTo(0, (ship.tackSide > 0) ? -10 : 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1A1A24';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();

      ctx.restore();
    }

    ctx.restore();
  }

  renderPlayerShip(ctx) {
    const ship = this.playerShip;
    ctx.save();

    // 1. Draw Wake Foam Ripples
    ship.wakeTrail.forEach(w => {
      ctx.fillStyle = `rgba(255, 255, 255, ${w.life * 0.45})`;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, TWO_PI);
      ctx.fill();
    });

    // 2. Sailing Vectors HUD around Player Flagship (Apparent Wind & No-Go Wedge)
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // No-Go Zone Cone (headwind wedge where sail cannot draw)
    const headwindFlow = normalizeAngle(this.windFlowAngle);
    const noGoHalfAngle = 42 * DEG2RAD;
    ctx.fillStyle = 'rgba(180, 50, 50, 0.15)';
    ctx.strokeStyle = 'rgba(180, 50, 50, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Draw arc centered around opposite of wind flow (the headwind origin)
    const headwindOrigin = normalizeAngle(headwindFlow + Math.PI);
    ctx.arc(0, 0, 36, headwindOrigin - noGoHalfAngle, headwindOrigin + noGoHalfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Apparent Wind Vector Arrow
    ctx.strokeStyle = '#00B4D8';
    ctx.lineWidth = 2.0;
    const appLen = clamp(ship.apparentWindKnots * 1.4, 15, 45);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ship.apparentWindAngle) * appLen, Math.sin(ship.apparentWindAngle) * appLen);
    ctx.stroke();

    ctx.restore();

    // 3. Render Hull & Lateen Rig of "Augusta"
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.heading);

    // Roman Corbita / Navis Oneraria Hull
    ctx.fillStyle = '#78350F'; // Rich Cedar/Oak hull
    ctx.strokeStyle = '#1A1A24';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    // Pointed bow at (+16, 0), beamy midships, curved stern at (-14, 0)
    ctx.moveTo(17, 0);
    ctx.quadraticCurveTo(8, -7, -13, -5.5);
    ctx.lineTo(-15, 0);
    ctx.lineTo(-13, 5.5);
    ctx.quadraticCurveTo(8, 7, 17, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner deck planking
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3.8, 0, 0, TWO_PI);
    ctx.fill();

    // Roman Golden Eagle Standard (Aquila) at Stern
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-14, -1.5, 3, 3);

    // Lateen Yard & Triangular Sail
    // Yard pivots based on sheet trim and tack side
    const yardTrimRad = (ship.sailTrimDeg * DEG2RAD) * ship.tackSide;
    ctx.save();
    ctx.rotate(yardTrimRad * 0.4);

    // Heavy wooden yard spar
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-16, -6 * ship.tackSide);
    ctx.lineTo(14, 6 * ship.tackSide);
    ctx.stroke();

    // Imperial Roman Crimson Lateen Sail
    ctx.fillStyle = ship.inNoGoZone ? '#8C2B20' : '#A81C1C';
    ctx.beginPath();
    ctx.moveTo(-16, -6 * ship.tackSide);
    ctx.lineTo(14, 6 * ship.tackSide);
    ctx.quadraticCurveTo(
      0, -18 * ship.tackSide,
      -8, -14 * ship.tackSide
    );
    ctx.closePath();
    ctx.fill();

    // Gold Latin imperial banner stripe across sail
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore(); // yard

    // Steering Oars (Gubernacula)
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-18, -8);
    ctx.moveTo(-12, 4);
    ctx.lineTo(-18, 8);
    ctx.stroke();

    ctx.restore(); // ship transform

    ctx.restore();
  }

  renderFloatingCoins(ctx) {
    ctx.save();

    for (let i = 0; i < this.floatingCoins.length; i++) {
      const c = this.floatingCoins[i];
      const alpha = c.life / c.maxLife;

      ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.font = 'bold 12px "Cinzel", "Palatino Linotype", "Times New Roman", serif';
      ctx.textAlign = 'center';

      // Coin circle icon
      ctx.beginPath();
      ctx.arc(c.x - 45, c.y - 4, 6, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = `rgba(26, 26, 36, ${alpha})`;
      ctx.fillText(c.text, c.x, c.y);
    }

    ctx.restore();
  }

  renderPortolanBorder(ctx) {
    ctx.save();

    const bw = 12; // Border width

    // Outer dark ink border
    ctx.strokeStyle = '#1A1A24';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(bw, bw, this.width - bw * 2, this.height - bw * 2);

    // Inner gold fillet
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bw + 4, bw + 4, this.width - (bw + 4) * 2, this.height - (bw + 4) * 2);

    // Alternate Black & Gold nautical distance ticks along the perimeter
    const tickLen = 50;
    ctx.fillStyle = '#1A1A24';
    for (let x = bw + 4; x < this.width - bw - 4; x += tickLen) {
      if ((Math.floor(x / tickLen)) % 2 === 0) {
        ctx.fillRect(x, bw, tickLen, 4);
        ctx.fillRect(x, this.height - bw - 4, tickLen, 4);
      }
    }
    for (let y = bw + 4; y < this.height - bw - 4; y += tickLen) {
      if ((Math.floor(y / tickLen)) % 2 === 0) {
        ctx.fillRect(bw, y, 4, tickLen);
        ctx.fillRect(this.width - bw - 4, y, 4, tickLen);
      }
    }

    ctx.restore();
  }

  renderNauticalTelemetryHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    const hudW = narrow ? Math.min(sw - 24, 260) : 280;
    const hudH = narrow ? 134 : 158;
    const hudX = narrow ? 12 : 22;
    const hudY = narrow ? 12 : 22;

    // Classical Roman Parchment Cartouche
    const grad = ctx.createLinearGradient(hudX, hudY, hudX + hudW, hudY + hudH);
    grad.addColorStop(0, 'rgba(24, 20, 16, 0.92)');
    grad.addColorStop(1, 'rgba(14, 10, 8, 0.96)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 6);
    ctx.fill();

    // Gold Leaf Cartouche Fillet (#D4AF37)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX + 3, hudY + 3, hudW - 6, hudH - 6);

    // Title: Mare Nostrum
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px "Cinzel", "Palatino Linotype", "Times New Roman", serif';
    ctx.textAlign = 'left';
    ctx.fillText('MARE NOSTRUM • PORTOLANUS', hudX + 10, hudY + 20);

    // Active Classical 12-Wind Metadata
    const currentWind = WINDS_12[this.windIndex];
    ctx.fillStyle = '#E8DFD1';
    ctx.font = '10px serif';
    ctx.fillText(`Ventus: ${currentWind.name} [${currentWind.dir} ${currentWind.compassDeg}°]`, hudX + 10, hudY + 36);

    // Wind Speed & Velocity
    ctx.fillStyle = '#C7B49E';
    ctx.font = '9.5px monospace';
    ctx.fillText(`Wind: ${this.windVelocityKnots.toFixed(0)}kt | Ship: ${this.playerShip.speedKnots.toFixed(1)}kt`, hudX + 10, hudY + 54);

    // Vessel Speed & Apparent Wind
    const ship = this.playerShip;
    ctx.fillText(`Apparent: ${ship.apparentWindKnots.toFixed(1)}kt @ ${(ship.apparentWindAngle * RAD2DEG).toFixed(0)}°`, hudX + 10, hudY + 72);

    // Point of Sail Status (Close-Hauled, Beam Reach, Running, or In Irons)
    let pointOfSail = narrow ? 'Beam Reach' : 'Beam Reach (Celeritas Optima)';
    let statusColor = '#A5D6A7';
    if (ship.inNoGoZone) {
      pointOfSail = narrow ? 'IN IRONS (No-Go)' : 'IN IRONS (No-Go Headwind / Flapping)';
      statusColor = '#FF8A80';
    } else if (ship.isTacking) {
      pointOfSail = narrow ? 'TACKING' : 'TACKING (Maneuver in Progress)';
      statusColor = '#FFD54F';
    } else if (Math.abs(normalizeAngle(ship.apparentWindAngle - ship.heading)) < 45 * DEG2RAD) {
      pointOfSail = narrow ? 'Running' : 'Running (Before the Wind)';
      statusColor = '#80DEEA';
    } else if (Math.abs(normalizeAngle(ship.apparentWindAngle - ship.heading)) > 100 * DEG2RAD) {
      pointOfSail = narrow ? 'Close-Hauled' : 'Beating Upwind (Close-Hauled)';
      statusColor = '#FFF59D';
    }

    ctx.fillStyle = statusColor;
    ctx.fillText(`Point of Sail: ${pointOfSail}`, hudX + 10, hudY + 90);

    // Lateen Trim & Keel Leeway
    ctx.fillStyle = '#C7B49E';
    ctx.fillText(`Trim: ${ship.sailTrimDeg.toFixed(0)}° (${ship.tackSide > 0 ? 'Stbd' : 'Port'})`, hudX + 10, hudY + 108);
    ctx.fillText(`Drift: ${ship.leewayAngleDeg.toFixed(1)}° | Denarii: ${this.totalDenariiEarned}`, hudX + 10, hudY + 126);

    ctx.restore();
  }

  renderHoverTooltip(ctx) {
    if (!this.hoveredEntity) return;
    const ent = this.hoveredEntity;

    ctx.save();
    const tooltipX = clamp(this.mousePos.x + 12, 10, this.width - 210);
    const tooltipY = clamp(this.mousePos.y - 45, 10, this.height - 70);

    ctx.fillStyle = 'rgba(24, 20, 16, 0.94)';
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, 200, 56, 5);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${ent.latin || ent.name}`, tooltipX + 8, tooltipY + 16);

    ctx.fillStyle = '#E8DFD1';
    ctx.font = '10px serif';
    ctx.fillText(`Export: ${ent.exports}`, tooltipX + 8, tooltipY + 32);
    ctx.fillText(`Import: ${ent.imports}`, tooltipX + 8, tooltipY + 46);

    ctx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* INPUT HANDLING (MOUSE & KEYBOARD)                                          */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };

    // Check if user clicked on a port
    for (let i = 0; i < PORTS_DATA.length; i++) {
      const port = PORTS_DATA[i];
      const dist = Math.hypot(port.x * this.width - pos.x, port.y * this.height - pos.y);
      if (dist < 20) {
        this.selectedPort = port;
        this.playerShip.autoNavPort = port;
        this.playAudioTone(440, 0.12, 'sine');
        return;
      }
    }

    // Otherwise, set manual destination waypoint on the sea
    this.playerShip.autoNavPort = null;
    this.playerShip.targetHeading = Math.atan2(pos.y - this.playerShip.y, pos.x - this.playerShip.x);
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };

    // Hover detection over ports
    let hovered = null;
    for (let i = 0; i < PORTS_DATA.length; i++) {
      const port = PORTS_DATA[i];
      const dist = Math.hypot(port.x * this.width - pos.x, port.y * this.height - pos.y);
      if (dist < 18) {
        hovered = port;
        break;
      }
    }
    this.hoveredEntity = hovered;
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (!key) return;

    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = true;
    }
    if (key.toLowerCase() === 't') {
      this.executeTack(this.playerShip);
    }
    if (key === ' ' || key === 'Space') {
      this.showStreamlines = !this.showStreamlines;
    }
  }

  onKeyUp(key, e) {
    if (!key) return;

    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = false;
    }
  }
}
