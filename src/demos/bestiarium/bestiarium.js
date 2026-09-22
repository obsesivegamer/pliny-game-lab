/**
 * Pliny Game Lab — Bestiarium (Artificial Life, Ethology & Ecological Simulation)
 * Pavilion II: Bestiarium & Res Rustica
 *
 * "Maximum est elephas proximumque humanis sensibus, quippe intellectus illis sermonis patrii...
 *  Leoni tantum ex feris clementia in supplices: prostratis parcit...
 *  Cyrenaica hunc generat provincia, duodecim non amplius digitorum magnitudine, candida in capite macula velut diademate imposita...
 *  Asperrimam autem feram monocerotem, reliquo corpore equo similem, capite cervo, uno cornu nigro media fronte cubitorum duum eminente...
 *  Grypas aurum effodere et custodire tradunt adversus Arimaspos, alites feras, aduncis rostris et unguibus praeditas...
 *  Cervis in Africa vita non est, in aliis terris gregatim degunt, duces agminis servant."
 *  — C. Plinius Secundus, Naturalis Historia, Liber VIII & X
 */

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

/**
 * Complete Monumental Artificial Life & Ecosystem Simulation Engine:
 *  1. Six Plinian Creature Species:
 *     - 1. Cervus (Forest Red Deer / Herd Prey): Reynolds flocking (separation, alignment, cohesion),
 *          foraging on lush flora, panic stampede vectors away from predators with panic wave propagation.
 *     - 2. Leo (Nemean / Barbary Lion): Pack stalking in tall grass, stealth creeping,
 *          explosive sprint burst with stamina bar, cooperative surrounding maneuvers, carcass feeding.
 *     - 3. Griffin (Apex Sky Hunter): Soaring overhead flight with variable altitude, wing flapping,
 *          cast ground shadows, swooping dive attacks, razor talons, guarding golden egg nests on crags.
 *     - 4. Basilisk (Crowned Serpent of Cyrene): Slithering multi-segment spine inverse kinematics (IK),
 *          petrifying gaze cone that paralyzes prey into stone, withered toxic trail footprints.
 *     - 5. Monoceros (Unicorn): Solitary mythic grazer, radiant healing aura that purges toxicity and
 *          blooms rare ambrosia flora, evasive agile dash.
 *     - 6. Elephantus (Roman War Elephant): Massive high-inertia physics body, protective herd wall
 *          guarding calves, trumpeting acoustic shockwaves that scatter predators.
 *  2. Ecological & Mathematical Models:
 *     - Lotka-Volterra predator-prey differential dynamics coupled with seasonal rainfall / drought cycles.
 *     - Scent trail diffusion grid: Herbivore trails, predator musk, toxic blight, and blood scent diffusing
 *       and decaying across a 2D scalar field with bilinear gradient sampling.
 *     - Sensory perception: Visual cones with angle and distance limits, acoustic hearing radius,
 *       and olfactory gradient sensing.
 *     - Metabolic model: Energy (E), hunger, digestion, reproduction when E > threshold, starvation,
 *       aging, and corpse decomposition returning organic biomass to soil.
 *  3. Visuals & Rendering:
 *     - Authentic Roman mosaic / illuminated bestiary parchment aesthetic.
 *     - Procedural skeleton & limb kinematics: Galloping legs, flapping wings, waving lion manes and tails,
 *       swaying elephant trunks and ears, slithering snake vertebrae.
 *     - Dynamic terrain with waving golden grass blades, water ponds, and blooming flora clusters.
 *  4. Interactive Controls & Canvas HUD:
 *     - Safe headless DOM guard: if (!this.controlsContainer || typeof document === 'undefined') return;
 *     - Species spawner palette (Cervus, Leo, Griffin, Basilisk, Monoceros, Elephantus, Flora).
 *     - Sliders: Simulation Speed, Ecosystem Balance, Flora Regrowth Rate, Predator Ferocity, Sensory Range.
 *     - Presets: 'Plinian Wilderness', 'Pride of the Nemean Lion', 'Clash of Mythic Beasts', 'Great Migration'.
 *     - Buttons: Scatter Ambrosia Flora, Drought Event, Spring Bloom, Clear Extinct Bodies, Reset Ecosystem.
 *     - Canvas HUD: Real-time Census counts, Lotka-Volterra phase-space trajectory graph,
 *       Selected Creature Inspector panel, Authentic Pliny Book VIII citation scroll.
 *  5. Pure ES module, zero external dependencies, robust Math.max(0, radius) guards,
 *     guaranteed ctx.save() / ctx.restore() balance, safe lifecycle methods.
 */

// ============================================================================
// I. HISTORICAL CITATIONS & LATIN EPIGRAPHY (NATURALIS HISTORIA LIBER VIII)
// ============================================================================

export const PLINIAN_CITATIONS = [
  {
    book: 'VIII.i',
    species: 'Elephantus',
    title: 'De Elephantis (On the War Elephant)',
    latin: 'Maximum est elephas proximumque humanis sensibus, quippe intellectus illis sermonis patrii et imperiorum obedientia, officiorum quae didicere memoria, amoris et gloriae voluptas, immo vero probitas, prudentia, aequitas, religio quoque siderum solisque ac lunae veneratio.',
    english: 'The elephant is the largest of terrestrial beasts, and in intelligence approaches nearest to man, understanding the speech of its native land, obeying commands, and delighting in love and glory. It possesses honesty, prudence, and equity, venerating the celestial stars and the sun and moon.'
  },
  {
    book: 'VIII.xvi',
    species: 'Leo',
    title: 'De Leonum Natura (On the Nature of Lions)',
    latin: 'Leoni tantum ex feris clementia in supplices: prostratis parcit, et ubi saevit, in viros potius quam in feminas impetum facit, in infantes non nisi magna fame. Libyci leones praedam venantur sagacitate et impetu.',
    english: 'The lion alone among wild beasts shows mercy to suppliants: it spares those who prostrate themselves, and when enraged it attacks men rather than women, and children only under extreme hunger. Libyan lions hunt their prey with acute cunning and sudden bursts of speed.'
  },
  {
    book: 'VIII.xxxiii',
    species: 'Basilisk',
    title: 'De Basilisco Serpentis (On the King Serpent)',
    latin: 'Cyrenaica hunc generat provincia, duodecim non amplius digitorum magnitudine, candida in capite macula velut diademate imposita. Pecudes et arbores halitu peremit, herbas urit, saxa rumpit: tanta vis malo est.',
    english: 'The province of Cyrenaica produces the basilisk, not more than twelve fingers in length, with a white mark on its head like a royal diadem. It destroys flocks with its breath, burns up grass, and shatters stone, so devastating is its deadly venom.'
  },
  {
    book: 'VIII.xxxi',
    species: 'Monoceros',
    title: 'De Monocerote (On the Unicorn)',
    latin: 'Asperrimam autem feram monocerotem, reliquo corpore equo similem, capite cervo, pedibus elephanto, cauda apro, mugitu gravi, uno cornu nigro media fronte cubitorum duum eminente. Hanc feram vivam negant capi.',
    english: 'The most wondrous of beasts is the monoceros, having the body of a steed, the head of a stag, the feet of an elephant, the tail of a boar, a deep bellowing call, and a single black horn two cubits long emerging from its brow. They say it cannot be taken alive.'
  },
  {
    book: 'VIII.l',
    species: 'Cervus',
    title: 'De Cervis (On Stags and Harts)',
    latin: 'Cervis in Africa vita non est. In aliis terris gregatim degunt, duces agminis servant, ac nando maria transmittunt, capita ponentes in clunibus praecedentium vicibusque subeuntes ac fessos refoventes.',
    english: 'Deer live in herds and observe leaders on the march. When swimming across broad channels, each rests its chin upon the haunches of the one before it, taking turns to lead the vanguard and relieving those fatigued.'
  },
  {
    book: 'X.xlix',
    species: 'Griffin',
    title: 'De Grypibus (On the Scythian Griffins)',
    latin: 'Grypas aurum effodere in terra Scythica tradunt, custodesque esse metallorum ferocissimos adversus Arimaspos, alites feras, aduncis rostris et unguibus praeditas, fulvis pennis et leonis membris.',
    english: 'Tradition relates that griffins excavate gold in the crags of Scythia, fiercely guarding the sacred hoard against intruders—winged beasts armed with hooked raptor beaks and razor talons, tawny plumage and leonine limbs.'
  }
];

// ============================================================================
// II. SPECIES CATALOG & BIOME CONSTANTS
// ============================================================================

export const SPECIES_CATALOG = {
  cervus: {
    id: 'cervus',
    name: 'Cervus',
    commonName: 'Forest Red Deer',
    latin: 'Cervus elaphus plinianus',
    role: 'prey',
    color: '#d49b42',
    accentColor: '#f3c77c',
    shadowColor: 'rgba(50, 30, 10, 0.35)',
    size: 7,
    mass: 1.0,
    baseSpeed: 135,
    sprintSpeed: 195,
    maxEnergy: 150,
    metabolism: 2.1,
    perceptionRadius: 130,
    visionAngle: Math.PI * 0.75, // 135 deg wide prey peripheral vision
    hearingRadius: 170,
    maturityAge: 12,
    lifespan: 190,
    reproThreshold: 115,
    reproCost: 55,
    reproCooldown: 22,
    forageEfficiency: 1.2,
    description: 'Gregarious herd prey with Reynolds flocking and panic stampede vectors.'
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    commonName: 'Nemean Lion',
    latin: 'Panthera leo nemeaeus',
    role: 'predator',
    color: '#c94a29',
    accentColor: '#ea7f42',
    shadowColor: 'rgba(60, 20, 10, 0.45)',
    size: 11,
    mass: 2.3,
    baseSpeed: 115,
    sprintSpeed: 235,
    maxEnergy: 230,
    metabolism: 3.2,
    perceptionRadius: 190,
    visionAngle: Math.PI * 0.52, // 94 deg forward predatory binocular focus
    hearingRadius: 220,
    maturityAge: 18,
    lifespan: 230,
    reproThreshold: 185,
    reproCost: 90,
    reproCooldown: 34,
    staminaMax: 100,
    staminaDrain: 36,
    staminaRecovery: 18,
    description: 'Apex pack stalker with stamina-draining sprint burst, surrounding maneuvers, and carcass feeding.'
  },
  griffin: {
    id: 'griffin',
    name: 'Griffin',
    commonName: 'Scythian Sky Raptor',
    latin: 'Gryps scythicus aurifer',
    role: 'apex_sky',
    color: '#d4af37',
    accentColor: '#ffd700',
    shadowColor: 'rgba(20, 15, 5, 0.55)',
    size: 16,
    mass: 3.8,
    baseSpeed: 165,
    sprintSpeed: 310,
    maxEnergy: 360,
    metabolism: 4.0,
    perceptionRadius: 290,
    visionAngle: Math.PI * 0.82,
    hearingRadius: 310,
    maturityAge: 25,
    lifespan: 320,
    reproThreshold: 290,
    reproCost: 140,
    reproCooldown: 45,
    flightAltitude: 85,
    description: 'Soaring apex raptor with flight altitude, cast ground shadows, dive attacks, and golden egg nests.'
  },
  basilisk: {
    id: 'basilisk',
    name: 'Basilisk',
    commonName: 'Crowned Serpent of Cyrene',
    latin: 'Regulus cyrenaicus letalis',
    role: 'mythic_predator',
    color: '#2e7d32',
    accentColor: '#81c784',
    shadowColor: 'rgba(10, 40, 20, 0.45)',
    size: 13,
    mass: 2.1,
    baseSpeed: 90,
    sprintSpeed: 145,
    maxEnergy: 260,
    metabolism: 1.9,
    perceptionRadius: 165,
    visionAngle: Math.PI * 0.42, // 75 deg focused petrifying gaze
    hearingRadius: 140,
    maturityAge: 20,
    lifespan: 290,
    reproThreshold: 210,
    reproCost: 105,
    reproCooldown: 38,
    gazeRange: 160,
    gazeConeAngle: Math.PI * 0.38,
    description: 'Crowned serpentine horror with inverse kinematics spine, paralyzing gaze cone, and toxic withered trails.'
  },
  monoceros: {
    id: 'monoceros',
    name: 'Monoceros',
    commonName: 'Mythic Unicorn',
    latin: 'Monoceros indicus sanctus',
    role: 'mythic_herbivore',
    color: '#f0f4f8',
    accentColor: '#38bdf8',
    shadowColor: 'rgba(30, 45, 60, 0.35)',
    size: 10,
    mass: 1.6,
    baseSpeed: 150,
    sprintSpeed: 245,
    maxEnergy: 280,
    metabolism: 2.0,
    perceptionRadius: 210,
    visionAngle: Math.PI * 0.72,
    hearingRadius: 240,
    maturityAge: 16,
    lifespan: 380,
    reproThreshold: 230,
    reproCost: 110,
    reproCooldown: 42,
    auraRadius: 130,
    description: 'Solitary divine grazer emitting radiant healing aura that cleanses toxicity and sprouts rare flora.'
  },
  elephantus: {
    id: 'elephantus',
    name: 'Elephantus',
    commonName: 'Roman War Elephant',
    latin: 'Elephas bellicus maximus',
    role: 'mega_herbivore',
    color: '#64748b',
    accentColor: '#991b1b',
    shadowColor: 'rgba(25, 30, 40, 0.5)',
    size: 22,
    mass: 8.5,
    baseSpeed: 75,
    sprintSpeed: 125,
    maxEnergy: 520,
    metabolism: 4.8,
    perceptionRadius: 195,
    visionAngle: Math.PI * 0.65,
    hearingRadius: 270,
    maturityAge: 30,
    lifespan: 420,
    reproThreshold: 430,
    reproCost: 200,
    reproCooldown: 50,
    trumpetShockwaveRadius: 260,
    description: 'Massive pachyderm with high inertia, defensive herd wall shielding calves, and trumpeting shockwaves.'
  }
};

export const SEASONS = [
  { id: 'ver', name: 'Ver', latin: 'Ver (Spring Bloom)', floraGrowth: 1.8, rainRate: 1.5, temp: '18°C', color: '#3bd6c6' },
  { id: 'aestas', name: 'Aestas', latin: 'Aestas (Summer Heat)', floraGrowth: 1.1, rainRate: 0.6, temp: '32°C', color: '#f59e0b' },
  { id: 'autumnus', name: 'Autumnus', latin: 'Autumnus (Harvest)', floraGrowth: 0.9, rainRate: 1.0, temp: '22°C', color: '#d97706' },
  { id: 'hiems', name: 'Hiems', latin: 'Hiems (Winter Frost)', floraGrowth: 0.4, rainRate: 0.8, temp: '8°C', color: '#93c5fd' }
];

// ============================================================================
// III. VECTOR2D MATHEMATICS & GEOMETRY UTILITIES
// ============================================================================

export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
  }

  set(x, y) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    return this;
  }

  copy() {
    return new Vec2(this.x, this.y);
  }

  add(v) {
    if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) {
      this.x += v.x;
      this.y += v.y;
    }
    return this;
  }

  sub(v) {
    if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) {
      this.x -= v.x;
      this.y -= v.y;
    }
    return this;
  }

  mult(n) {
    if (Number.isFinite(n)) {
      this.x *= n;
      this.y *= n;
    }
    return this;
  }

  div(n) {
    if (Number.isFinite(n) && n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.magSq());
  }

  distSq(v) {
    if (!v) return 0;
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dist(v) {
    return Math.sqrt(this.distSq(v));
  }

  normalize() {
    const m = this.mag();
    if (m > 0.00001) {
      this.div(m);
    } else {
      this.set(0, 0);
    }
    return this;
  }

  limit(max) {
    if (!Number.isFinite(max) || max <= 0) return this;
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq)).mult(max);
    }
    return this;
  }

  setMag(len) {
    if (!Number.isFinite(len)) return this;
    return this.normalize().mult(len);
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  rotate(rad) {
    if (!Number.isFinite(rad)) return this;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = this.x * cos - this.y * sin;
    const ry = this.x * sin + this.y * cos;
    this.x = rx;
    this.y = ry;
    return this;
  }

  lerp(target, amt) {
    if (!target) return this;
    const t = clamp(amt, 0, 1);
    this.x += (target.x - this.x) * t;
    this.y += (target.y - this.y) * t;
    return this;
  }

  static fromAngle(angle, len = 1) {
    const l = Number.isFinite(len) ? len : 1;
    const a = Number.isFinite(angle) ? angle : 0;
    return new Vec2(Math.cos(a) * l, Math.sin(a) * l);
  }

  static add(v1, v2) {
    const x1 = v1 && Number.isFinite(v1.x) ? v1.x : 0;
    const y1 = v1 && Number.isFinite(v1.y) ? v1.y : 0;
    const x2 = v2 && Number.isFinite(v2.x) ? v2.x : 0;
    const y2 = v2 && Number.isFinite(v2.y) ? v2.y : 0;
    return new Vec2(x1 + x2, y1 + y2);
  }

  static sub(v1, v2) {
    const x1 = v1 && Number.isFinite(v1.x) ? v1.x : 0;
    const y1 = v1 && Number.isFinite(v1.y) ? v1.y : 0;
    const x2 = v2 && Number.isFinite(v2.x) ? v2.x : 0;
    const y2 = v2 && Number.isFinite(v2.y) ? v2.y : 0;
    return new Vec2(x1 - x2, y1 - y2);
  }

  static mult(v, n) {
    const x = v && Number.isFinite(v.x) ? v.x : 0;
    const y = v && Number.isFinite(v.y) ? v.y : 0;
    const m = Number.isFinite(n) ? n : 1;
    return new Vec2(x * m, y * m);
  }

  static dist(v1, v2) {
    if (!v1 || !v2) return 0;
    return Math.hypot(v1.x - v2.x, v1.y - v2.y);
  }

  static dot(v1, v2) {
    if (!v1 || !v2) return 0;
    return v1.x * v2.x + v1.y * v2.y;
  }

  static angleBetween(v1, v2) {
    if (!v1 || !v2) return 0;
    const dot = Vec2.dot(v1, v2);
    const m1 = v1.mag();
    const m2 = v2.mag();
    if (m1 * m2 === 0) return 0;
    const cosA = Math.max(-1, Math.min(1, dot / (m1 * m2)));
    return Math.acos(cosA);
  }
}

export function clamp(val, min, max) {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function angleDiff(a, b) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

export function remap(val, inMin, inMax, outMin, outMax) {
  if (inMax - inMin === 0) return outMin;
  const t = clamp((val - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
}

// ============================================================================
// III-B. SPATIAL HASH GRID (PERFORMANCE — O(1) NEIGHBOR QUERIES)
// ============================================================================

export class SpatialHash {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return cx + cy * 100003;
  }

  insert(entity) {
    if (!entity || !entity.pos) return;
    const cx = Math.floor(entity.pos.x / this.cellSize);
    const cy = Math.floor(entity.pos.y / this.cellSize);
    const key = this._key(cx, cy);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push(entity);
  }

  query(x, y, radius) {
    const results = [];
    const pad = this.cellSize;
    const minCx = Math.floor((x - radius - pad) / this.cellSize);
    const maxCx = Math.floor((x + radius + pad) / this.cellSize);
    const minCy = Math.floor((y - radius - pad) / this.cellSize);
    const maxCy = Math.floor((y + radius + pad) / this.cellSize);
    const rSq = (radius + pad) * (radius + pad);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this._key(cx, cy));
        if (bucket) {
          for (const e of bucket) {
            const dx = e.pos.x - x;
            const dy = e.pos.y - y;
            if (dx * dx + dy * dy <= rSq) {
              results.push(e);
            }
          }
        }
      }
    }
    return results;
  }
}

// ============================================================================
// IV. SCENT TRAIL DIFFUSION GRID (2D SCALAR FIELDS)
// ============================================================================

export class ScentGrid {
  constructor(width, height, cellSize = 24) {
    this.cellSize = cellSize;
    this.width = Math.max(100, width);
    this.height = Math.max(100, height);
    this.cols = Math.ceil(this.width / this.cellSize);
    this.rows = Math.ceil(this.height / this.cellSize);
    this.totalCells = this.cols * this.rows;

    this.herbivoreTrail = new Float32Array(this.totalCells);
    this.predatorMusk = new Float32Array(this.totalCells);
    this.bloodScent = new Float32Array(this.totalCells);
    this.toxicBlight = new Float32Array(this.totalCells);
    this.buffer = new Float32Array(this.totalCells);
  }

  resize(width, height) {
    this.width = Math.max(100, width);
    this.height = Math.max(100, height);
    const newCols = Math.ceil(this.width / this.cellSize);
    const newRows = Math.ceil(this.height / this.cellSize);
    const newTotal = newCols * newRows;

    if (newTotal !== this.totalCells) {
      this.cols = newCols;
      this.rows = newRows;
      this.totalCells = newTotal;
      this.herbivoreTrail = new Float32Array(this.totalCells);
      this.predatorMusk = new Float32Array(this.totalCells);
      this.bloodScent = new Float32Array(this.totalCells);
      this.toxicBlight = new Float32Array(this.totalCells);
      this.buffer = new Float32Array(this.totalCells);
    }
  }

  clear() {
    this.herbivoreTrail.fill(0);
    this.predatorMusk.fill(0);
    this.bloodScent.fill(0);
    this.toxicBlight.fill(0);
  }

  getIndex(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
    return row * this.cols + col;
  }

  deposit(channel, x, y, amount) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(amount) || amount <= 0) return;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    const idx = this.getIndex(col, row);
    if (idx === -1) return;

    let targetArray = null;
    if (channel === 'herbivore') targetArray = this.herbivoreTrail;
    else if (channel === 'predator') targetArray = this.predatorMusk;
    else if (channel === 'blood') targetArray = this.bloodScent;
    else if (channel === 'toxic') targetArray = this.toxicBlight;

    if (targetArray) {
      targetArray[idx] = Math.min(100.0, targetArray[idx] + amount);

      // Splatter gently to 4 immediate orthogonal neighbors
      const neighbors = [
        this.getIndex(col + 1, row),
        this.getIndex(col - 1, row),
        this.getIndex(col, row + 1),
        this.getIndex(col, row - 1)
      ];
      const splash = amount * 0.22;
      for (const n of neighbors) {
        if (n !== -1) {
          targetArray[n] = Math.min(100.0, targetArray[n] + splash);
        }
      }
    }
  }

  sample(channel, x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    const gx = x / this.cellSize - 0.5;
    const gy = y / this.cellSize - 0.5;
    const c0 = Math.floor(gx);
    const r0 = Math.floor(gy);
    const c1 = c0 + 1;
    const r1 = r0 + 1;
    const tx = clamp(gx - c0, 0, 1);
    const ty = clamp(gy - r0, 0, 1);

    let arr = null;
    if (channel === 'herbivore') arr = this.herbivoreTrail;
    else if (channel === 'predator') arr = this.predatorMusk;
    else if (channel === 'blood') arr = this.bloodScent;
    else if (channel === 'toxic') arr = this.toxicBlight;
    if (!arr) return 0;

    const getVal = (c, r) => {
      const idx = this.getIndex(clamp(c, 0, this.cols - 1), clamp(r, 0, this.rows - 1));
      return idx >= 0 ? arr[idx] : 0;
    };

    const v00 = getVal(c0, r0);
    const v10 = getVal(c1, r0);
    const v01 = getVal(c0, r1);
    const v11 = getVal(c1, r1);

    const top = v00 * (1 - tx) + v10 * tx;
    const btm = v01 * (1 - tx) + v11 * tx;
    return top * (1 - ty) + btm * ty;
  }

  sampleGradient(channel, x, y) {
    const delta = this.cellSize * 0.65;
    const valL = this.sample(channel, x - delta, y);
    const valR = this.sample(channel, x + delta, y);
    const valU = this.sample(channel, x, y - delta);
    const valD = this.sample(channel, x, y + delta);

    return new Vec2((valR - valL) / (2 * delta), (valD - valU) / (2 * delta));
  }

  purgeAround(x, y, radius) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0) return;
    const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.ceil((x + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.ceil((y + radius) / this.cellSize));
    const rSq = radius * radius;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cx = (c + 0.5) * this.cellSize;
        const cy = (r + 0.5) * this.cellSize;
        const distSq = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        if (distSq <= rSq) {
          const idx = this.getIndex(c, r);
          if (idx >= 0) {
            const factor = Math.sqrt(distSq) / radius;
            this.toxicBlight[idx] *= factor * 0.4;
            this.predatorMusk[idx] *= factor * 0.6;
          }
        }
      }
    }
  }

  update(dt) {
    const diffRate = 0.26;
    const decayRate = 0.14;

    this.diffuseDecayArray(this.herbivoreTrail, diffRate, decayRate * 1.1, dt);
    this.diffuseDecayArray(this.predatorMusk, diffRate, decayRate * 0.85, dt);
    this.diffuseDecayArray(this.bloodScent, diffRate * 1.3, decayRate * 1.35, dt);
    this.diffuseDecayArray(this.toxicBlight, diffRate * 0.55, decayRate * 0.45, dt);
  }

  diffuseDecayArray(arr, diff, decay, dt) {
    const cols = this.cols;
    const rows = this.rows;
    const retention = Math.max(0, 1.0 - decay * dt);
    const alpha = clamp(diff * dt, 0, 0.22);

    for (let r = 0; r < rows; r++) {
      const rOffset = r * cols;
      const upOffset = Math.max(0, r - 1) * cols;
      const dnOffset = Math.min(rows - 1, r + 1) * cols;

      for (let c = 0; c < cols; c++) {
        const idx = rOffset + c;
        const left = rOffset + Math.max(0, c - 1);
        const right = rOffset + Math.min(cols - 1, c + 1);
        const up = upOffset + c;
        const dn = dnOffset + c;

        const laplacian = arr[left] + arr[right] + arr[up] + arr[dn] - 4 * arr[idx];
        this.buffer[idx] = (arr[idx] + laplacian * alpha) * retention;
      }
    }

    // Fast copy back
    arr.set(this.buffer);
  }

  renderDebug(ctx) {
    ctx.save();
    const step = 2;
    for (let r = 0; r < this.rows; r += step) {
      for (let c = 0; c < this.cols; c += step) {
        const idx = this.getIndex(c, r);
        const blood = this.bloodScent[idx];
        const toxic = this.toxicBlight[idx];
        const pred = this.predatorMusk[idx];

        if (blood > 2 || toxic > 2 || pred > 2) {
          if (toxic > blood && toxic > pred) {
            ctx.fillStyle = `rgba(34, 197, 94, ${Math.min(0.24, toxic * 0.005)})`;
          } else if (blood > pred) {
            ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.26, blood * 0.006)})`;
          } else {
            ctx.fillStyle = `rgba(249, 115, 22, ${Math.min(0.2, pred * 0.004)})`;
          }
          ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize * step, this.cellSize * step);
        }
      }
    }
    ctx.restore();
  }
}

// ============================================================================
// V. DYNAMIC TERRAIN, WATER PONDS & VEGETATION
// ============================================================================

export class WaterPond {
  constructor(x, y, rx, ry, rotation = 0) {
    this.x = Number.isFinite(x) ? x : 200;
    this.y = Number.isFinite(y) ? y : 200;
    this.rx = Math.max(20, rx);
    this.ry = Math.max(15, ry);
    this.rotation = rotation;
    this.rippleTime = Math.random() * 10;
  }

  contains(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return (lx * lx) / (this.rx * this.rx) + (ly * ly) / (this.ry * this.ry) <= 1.0;
  }

  distanceToEdge(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const centerDist = Math.hypot(dx, dy);
    const avgRadius = (this.rx + this.ry) * 0.5;
    return centerDist - avgRadius;
  }

  update(dt) {
    this.rippleTime += dt * 1.6;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Muddy / sandy Roman shore ring
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, this.rx + 16), Math.max(0, this.ry + 13), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(165, 138, 98, 0.45)';
    ctx.fill();

    // Reeds / moss shore band
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, this.rx + 7), Math.max(0, this.ry + 6), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(75, 110, 65, 0.4)';
    ctx.fill();

    // Deep freshwater body
    const waterGrad = ctx.createRadialGradient(0, 0, Math.max(0, this.rx * 0.15), 0, 0, Math.max(0, this.rx));
    waterGrad.addColorStop(0, '#1a4e66');
    waterGrad.addColorStop(0.7, '#133a4f');
    waterGrad.addColorStop(1, '#0e2b3b');

    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, this.rx), Math.max(0, this.ry), 0, 0, Math.PI * 2);
    ctx.fillStyle = waterGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Specular animated water ripple rings
    const ripple1 = (Math.sin(this.rippleTime) + 1) * 0.5;
    const ripple2 = (Math.cos(this.rippleTime * 1.3) + 1) * 0.5;

    ctx.strokeStyle = `rgba(186, 230, 253, ${0.12 + ripple1 * 0.14})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(
      -this.rx * 0.12,
      -this.ry * 0.1,
      Math.max(0, this.rx * 0.58 * (0.8 + ripple1 * 0.2)),
      Math.max(0, this.ry * 0.58 * (0.8 + ripple1 * 0.2)),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + ripple2 * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(
      this.rx * 0.2,
      this.ry * 0.14,
      Math.max(0, this.rx * 0.36 * (0.85 + ripple2 * 0.15)),
      Math.max(0, this.ry * 0.36 * (0.85 + ripple2 * 0.15)),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.restore();
  }
}

export class GrassTuft {
  constructor(x, y, bladeCount = 5) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.blades = [];
    for (let i = 0; i < bladeCount; i++) {
      this.blades.push({
        height: 10 + Math.random() * 14,
        lean: (Math.random() - 0.5) * 0.9,
        swaySpeed: 1.2 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? '#8a9a5b' : '#b5a642'
      });
    }
  }

  render(ctx, time, windAngle, windForce) {
    ctx.save();
    ctx.translate(this.x, this.y);

    for (const b of this.blades) {
      const sway = Math.sin(time * b.swaySpeed + b.phase) * 4.5 * windForce;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(b.lean * 7 + sway * 0.5, -b.height * 0.5, b.lean * 13 + sway, -b.height);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class RockCrag {
  constructor(x, y, radius = 24) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.radius = Math.max(10, radius);
    this.facets = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const ang = (i * Math.PI * 2) / count;
      const r = this.radius * (0.75 + Math.random() * 0.35);
      this.facets.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Cast shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 4, Math.max(0, this.radius * 1.2), Math.max(0, this.radius * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone facets
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    for (let i = 0; i < this.facets.length; i++) {
      const p = this.facets[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Highlight ridge
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.facets[0].x * 0.8, this.facets[0].y * 0.8);
    ctx.lineTo(this.facets[2].x * 0.8, this.facets[2].y * 0.8);
    ctx.stroke();

    ctx.restore();
  }
}

export class GriffinNest {
  constructor(x, y) {
    this.x = Number.isFinite(x) ? x : 400;
    this.y = Number.isFinite(y) ? y : 200;
    this.radius = 32;
    this.goldenEggs = 3;
    this.auraPhase = 0;
  }

  update(dt) {
    this.auraPhase += dt * 1.8;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Stone crag base
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius + 8), 0, Math.PI * 2);
    ctx.fill();

    // Woven Scythian twigs
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius * 0.8), 0, Math.PI * 2);
    ctx.stroke();

    // Shimmering Golden Egg Aura
    const shimmer = (Math.sin(this.auraPhase) + 1) * 0.5;
    const auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, Math.max(2, this.radius * 0.85));
    auraGrad.addColorStop(0, `rgba(255, 235, 59, ${0.5 + shimmer * 0.3})`);
    auraGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius * 0.9), 0, Math.PI * 2);
    ctx.fill();

    // Scythian Sacred Golden Eggs
    for (let e = 0; e < this.goldenEggs; e++) {
      const ang = (e * Math.PI * 2) / 3 + 0.3;
      const ex = Math.cos(ang) * 9.5;
      const ey = Math.sin(ang) * 9.5;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(0, 6.5), Math.max(0, 8.5), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Specular shine
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(-1.5, -2.5, Math.max(0, 1.8), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}

// ============================================================================
// VI. FLORA ECOSYSTEM ENGINE & AMBROSIA BLOOMS
// ============================================================================

export class FloraCluster {
  constructor(x, y, type = 'silphium') {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.type = type; // 'silphium', 'acanthus', 'ambrosia', 'reeds'
    this.biomass = 40 + Math.random() * 50;
    this.maxBiomass = 100;
    this.withered = 0; // 0: sound, 1: poisoned/blighted by Basilisk
    this.isAmbrosia = type === 'ambrosia';
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.seedTimer = 10 + Math.random() * 20;
  }

  update(dt, seasonGrowthRate) {
    this.pulsePhase += dt * 2;

    if (this.withered > 0) {
      // Slow natural detoxification
      this.withered = Math.max(0, this.withered - dt * 0.05);
      return;
    }

    // Regrowth modulated by season
    const growth = (this.isAmbrosia ? 4.8 : 2.6) * seasonGrowthRate * dt;
    this.biomass = Math.min(this.maxBiomass, this.biomass + growth);
    this.seedTimer -= dt;
  }

  graze(amount) {
    if (this.withered > 0.4) return 0; // Poisoned flora is inedible
    const harvested = Math.min(this.biomass, amount);
    this.biomass -= harvested;
    return harvested * (this.isAmbrosia ? 1.8 : 1.0);
  }

  blight() {
    this.withered = 1.0;
    this.biomass = Math.max(5, this.biomass * 0.35);
  }

  rejuvenate() {
    this.withered = 0;
    this.biomass = Math.min(this.maxBiomass, this.biomass + 50);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const radius = Math.max(1, (this.biomass / this.maxBiomass) * (this.isAmbrosia ? 11 : 8));
    const pulse = Math.sin(this.pulsePhase) * 1.5;

    if (this.withered > 0.2) {
      // Withered toxic scorched bush
      ctx.fillStyle = `rgba(55, 65, 50, ${0.4 + this.withered * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius * 0.8), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3f4f38';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (this.isAmbrosia) {
      // Golden Ambrosia (Pliny's Celestial Herb)
      const glowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(1, radius + 8));
      glowGrad.addColorStop(0, 'rgba(255, 235, 120, 0.9)');
      glowGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
      glowGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius + 6 + pulse), 0, Math.PI * 2);
      ctx.fill();

      // Flower petals
      ctx.fillStyle = '#fde047';
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5 + this.pulsePhase * 0.2;
        const px = Math.cos(ang) * (radius * 0.7);
        const py = Math.sin(ang) * (radius * 0.7);
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0, radius * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius * 0.35), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard Silphium / Acanthus lush flora
      ctx.fillStyle = 'rgba(74, 128, 62, 0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius), 0, Math.PI * 2);
      ctx.fill();

      // Inner bud
      ctx.fillStyle = '#78a65a';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius * 0.5), 0, Math.PI * 2);
      ctx.fill();

      // Yellow blossoms
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(radius * 0.4, -radius * 0.3, Math.max(0, 1.8), 0, Math.PI * 2);
      ctx.arc(-radius * 0.3, radius * 0.4, Math.max(0, 1.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// VII. CARCASS DECOMPOSITION & SOIL BIOMASS RECYCLING
// ============================================================================

export class Carcass {
  constructor(speciesId, x, y, initialBiomass = 80) {
    this.speciesId = speciesId;
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.biomass = Math.max(10, initialBiomass);
    this.maxBiomass = this.biomass;
    this.rotTimer = 0;
    this.decayLifespan = 45; // seconds until soil absorption
    this.ribAngle = Math.random() * Math.PI * 2;
  }

  update(dt, scentGrid) {
    this.rotTimer += dt;
    // Emits blood scent trail into the scent grid
    if (this.biomass > 5) {
      scentGrid.deposit('blood', this.x, this.y, 4.2 * dt);
    }

    // Natural soil biodegradation
    this.biomass -= dt * 0.65;
  }

  feed(amount) {
    const consumed = Math.min(this.biomass, amount);
    this.biomass -= consumed;
    return consumed;
  }

  isFullyDecomposed() {
    return this.biomass <= 0 || this.rotTimer >= this.decayLifespan;
  }

  render(ctx) {
    if (this.biomass <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.ribAngle);

    const freshness = clamp(this.biomass / this.maxBiomass, 0, 1);
    const size = 12 + freshness * 8;

    // Blood pool stain
    ctx.fillStyle = `rgba(136, 19, 19, ${0.15 + freshness * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, size * 1.2), Math.max(0, size * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();

    // Flesh remnants
    if (freshness > 0.25) {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(0, size * 0.7 * freshness), Math.max(0, size * 0.45 * freshness), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Skeletal ribcage
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) {
      const rx = i * 3.2;
      const rLen = (4 - Math.abs(i)) * 2.2;
      ctx.beginPath();
      ctx.moveTo(rx, -rLen);
      ctx.lineTo(rx, rLen);
      ctx.stroke();
    }

    // Spine axis line
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    ctx.restore();
  }
}

// ============================================================================
// VIII. ACOUSTIC SHOCKWAVES & DYNAMIC PARTICLE VFX
// ============================================================================

export class AcousticShockwave {
  constructor(x, y, maxRadius = 260) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.radius = 8;
    this.maxRadius = Math.max(50, maxRadius);
    this.speed = 420; // sound propagation in pixels/sec
    this.strength = 1.0;
  }

  update(dt) {
    this.radius += this.speed * dt;
    this.strength = Math.max(0, 1.0 - this.radius / this.maxRadius);
  }

  isFinished() {
    return this.radius >= this.maxRadius || this.strength <= 0;
  }

  render(ctx) {
    if (this.strength <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.strokeStyle = `rgba(217, 119, 6, ${this.strength * 0.85})`;
    ctx.lineWidth = Math.max(1, 4 * this.strength);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(254, 240, 138, ${this.strength * 0.65})`;
    ctx.lineWidth = Math.max(1, 2 * this.strength);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius * 0.85), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, maxLife = 0.8, size = 3) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.vx = Number.isFinite(vx) ? vx : 0;
    this.vy = Number.isFinite(vy) ? vy : 0;
    this.color = color || '#ffffff';
    this.life = Math.max(0.1, maxLife);
    this.maxLife = this.life;
    this.size = Math.max(1, size);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
  }

  render(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    const alpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// IX. BASE CREATURE CLASS & METABOLIC STATE MACHINE
// ============================================================================

export class Creature {
  constructor(speciesKey, x, y, dna = null) {
    this.config = SPECIES_CATALOG[speciesKey];
    this.speciesKey = speciesKey;

    this.pos = new Vec2(x, y);
    this.vel = new Vec2((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    this.acc = new Vec2(0, 0);
    this.heading = Math.random() * Math.PI * 2;

    // Genetic DNA inheritance & mutation bounds
    const parentDna = dna || {};
    this.dna = {
      speed: parentDna.speed || this.config.baseSpeed,
      sprintSpeed: parentDna.sprintSpeed || this.config.sprintSpeed,
      perceptionRadius: parentDna.perceptionRadius || this.config.perceptionRadius,
      size: parentDna.size || this.config.size,
      mass: parentDna.mass || this.config.mass,
      metabolism: parentDna.metabolism || this.config.metabolism
    };

    // Metabolic Lifecycle & Health
    this.energy = this.config.maxEnergy * (0.65 + Math.random() * 0.3);
    this.maxEnergy = this.config.maxEnergy;
    this.health = 100;
    this.maxHealth = 100;
    this.age = parentDna.age || Math.random() * 15;
    this.lifespan = this.config.lifespan * (0.85 + Math.random() * 0.3);
    this.reproductionCooldown = 8.0 + Math.random() * 12;
    this.state = 'foraging';
    this.paralyzeTimer = 0; // Basilisk gaze petrifaction timer
    this.stamina = this.config.staminaMax || 100;

    // Procedural skeletal & limb gait cycles
    this.gaitPhase = Math.random() * Math.PI * 2;
    this.tailPhase = Math.random() * Math.PI * 2;
    this.turnRate = 0;
  }

  isDead() {
    return this.health <= 0 || this.energy <= 0 || this.age >= this.lifespan;
  }

  isMature() {
    return this.age >= this.config.maturityAge;
  }

  canReproduce() {
    return (
      this.isMature() &&
      this.reproductionCooldown <= 0 &&
      this.energy >= this.config.reproThreshold &&
      this.health > 40 &&
      this.paralyzeTimer <= 0
    );
  }

  applyForce(force) {
    if (!force || !Number.isFinite(force.x) || !Number.isFinite(force.y)) return;
    const f = force.copy().div(this.dna.mass);
    this.acc.add(f);
  }

  updateBaseMetabolism(dt, scentGrid) {
    this.age += dt;
    this.reproductionCooldown = Math.max(0, this.reproductionCooldown - dt);

    // Basilisk petrifaction decay
    if (this.paralyzeTimer > 0) {
      this.paralyzeTimer = Math.max(0, this.paralyzeTimer - dt * 0.65);
      this.state = 'paralyzed';
    }

    // Basal Metabolic Drain based on velocity and mass
    const speed = this.vel.mag();
    const speedRatio = speed / Math.max(1, this.dna.speed);
    const activityCost = 1.0 + speedRatio * speedRatio * 1.5;
    const totalDrain = this.dna.metabolism * activityCost * dt;
    this.energy -= totalDrain;

    // Scent Footprint Emission
    if (this.config.role === 'prey' || this.config.role === 'mega_herbivore') {
      scentGrid.deposit('herbivore', this.pos.x, this.pos.y, 1.2 * dt);
    } else if (this.config.role === 'predator' || this.config.role === 'mythic_predator') {
      scentGrid.deposit('predator', this.pos.x, this.pos.y, 1.8 * dt);
    }

    // Bleeding scent emission if severely wounded
    if (this.health < 60) {
      scentGrid.deposit('blood', this.pos.x, this.pos.y, 2.8 * dt);
    }

    // Natural regeneration when well-fed and healthy
    if (this.energy > this.maxEnergy * 0.75 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + dt * 4.5);
    }
  }

  integratePhysics(dt, maxSpd) {
    if (this.paralyzeTimer > 0) {
      // Frozen into stone statue
      this.vel.mult(0.8);
      this.acc.set(0, 0);
      return;
    }

    this.vel.add(Vec2.mult(this.acc, dt));
    const spdLimit = maxSpd || this.dna.speed;
    this.vel.limit(spdLimit);

    this.pos.add(Vec2.mult(this.vel, dt));
    this.acc.set(0, 0);

    const speed = this.vel.mag();
    if (speed > 1.5) {
      const desiredHeading = this.vel.heading();
      const diff = angleDiff(this.heading, desiredHeading);
      this.turnRate = diff;
      this.heading += diff * Math.min(1.0, dt * 7);
    }

    // Gait cycle advances in proportion to linear ground speed
    this.gaitPhase += (speed / 20) * dt * 10;
    this.tailPhase += dt * 4;
  }

  avoidBoundaries(width, height, margin = 60) {
    const desired = new Vec2(0, 0);
    const p = this.pos;
    const force = 450;

    if (p.x < margin) desired.x = force * (1 - p.x / margin);
    else if (p.x > width - margin) desired.x = -force * (1 - (width - p.x) / margin);

    if (p.y < margin) desired.y = force * (1 - p.y / margin);
    else if (p.y > height - margin) desired.y = -force * (1 - (height - p.y) / margin);

    this.applyForce(desired);
  }

  canSee(otherPos, range = null, fov = null) {
    if (!otherPos) return false;
    const maxR = range || this.dna.perceptionRadius;
    const dSq = this.pos.distSq(otherPos);
    if (dSq > maxR * maxR) return false;

    // Angular check against vision cone
    const toTarget = Vec2.sub(otherPos, this.pos);
    const angle = Math.abs(angleDiff(this.heading, toTarget.heading()));
    const cone = fov || this.config.visionAngle;
    return angle <= cone * 0.5;
  }

  canHear(otherPos, radius = null) {
    if (!otherPos) return false;
    const hr = radius || this.config.hearingRadius;
    return this.pos.distSq(otherPos) <= hr * hr;
  }
}

// ============================================================================
// X. CERVUS (FOREST RED DEER / HERD PREY)
// ============================================================================

export class Cervus extends Creature {
  constructor(x, y, dna = null) {
    super('cervus', x, y, dna);
    this.isMaleStag = Math.random() > 0.45; // Stags have branching antler crowns
    this.panicVector = new Vec2(0, 0);
  }

  update(dt, ecosystem) {
    this.updateBaseMetabolism(dt, ecosystem.scentGrid);
    if (this.paralyzeTimer > 0) {
      this.integratePhysics(dt, 0);
      return;
    }

    const force = new Vec2(0, 0);
    let inPanic = false;

    // 1. Sensory scan for predators (Leo, Griffin shadow, Basilisk)
    let closestThreat = null;
    let minThreatDist = Infinity;

    for (const c of ecosystem.creatures) {
      if (c.config.role === 'predator' || c.config.role === 'apex_sky' || c.config.role === 'mythic_predator') {
        const d = this.pos.dist(c.pos);
        if (d < this.config.perceptionRadius * 1.3) {
          if (this.canSee(c.pos, this.config.perceptionRadius * 1.3) || this.canHear(c.pos)) {
            if (d < minThreatDist) {
              minThreatDist = d;
              closestThreat = c;
            }
          }
        }
      }
    }

    // Olfactory detection of predator musk
    const muskGradient = ecosystem.scentGrid.sampleGradient('predator', this.pos.x, this.pos.y);
    if (muskGradient.magSq() > 0.05) {
      // Flee away from predator musk gradient
      force.sub(muskGradient.setMag(120));
    }

    if (closestThreat) {
      inPanic = true;
      this.state = 'fleeing';
      const fleeDir = Vec2.sub(this.pos, closestThreat.pos).normalize();
      const panicMag = 380 * (1.0 - Math.min(1.0, minThreatDist / (this.config.perceptionRadius * 1.3)));
      force.add(fleeDir.mult(panicMag));
    }

    // 2. Reynolds Flocking Behaviors with conspecifics (Cervus herd)
    if (!inPanic) {
      this.applyFlocking(ecosystem, force);

      // 3. Foraging on lush flora if hungry
      if (this.energy < this.maxEnergy * 0.85) {
        this.forageFlora(ecosystem.flora, force);
      } else {
        this.state = 'foraging';
      }
    }

    this.applyForce(force);
    this.avoidBoundaries(ecosystem.width, ecosystem.height);

    const targetSpeed = inPanic ? this.dna.sprintSpeed : this.dna.speed;
    this.integratePhysics(dt, targetSpeed);
  }

  applyFlocking(ecosystem, force) {
    let sepCount = 0,
      alignCount = 0,
      cohCount = 0;
    const sep = new Vec2(0, 0);
    const align = new Vec2(0, 0);
    const coh = new Vec2(0, 0);

    const sepDist = this.dna.size * 3.8;
    const neighborDist = this.dna.perceptionRadius * 0.85;
    const nearby = ecosystem.spatialHash
      ? ecosystem.spatialHash.query(this.pos.x, this.pos.y, neighborDist)
      : ecosystem.creatures;

    for (const other of nearby) {
      if (other === this || other.speciesKey !== 'cervus') continue;
      const d = this.pos.dist(other.pos);

      if (d > 0 && d < sepDist) {
        const diff = Vec2.sub(this.pos, other.pos).normalize().div(d);
        sep.add(diff);
        sepCount++;
      }

      if (d > 0 && d < neighborDist) {
        align.add(other.vel);
        alignCount++;
        coh.add(other.pos);
        cohCount++;
      }
    }

    if (sepCount > 0) {
      sep.div(sepCount).setMag(this.dna.speed * 1.5).sub(this.vel);
      force.add(sep.mult(1.8));
    }
    if (alignCount > 0) {
      align.div(alignCount).setMag(this.dna.speed).sub(this.vel);
      force.add(align.mult(1.0));
    }
    if (cohCount > 0) {
      coh.div(cohCount);
      const desired = Vec2.sub(coh, this.pos).setMag(this.dna.speed).sub(this.vel);
      force.add(desired.mult(0.9));
    }
  }

  forageFlora(floraList, force) {
    let bestFlora = null;
    let minDist = Infinity;

    for (const f of floraList) {
      if (f.biomass < 15 || f.withered > 0.3) continue;
      const d = this.pos.dist(new Vec2(f.x, f.y));
      if (d < minDist && d < this.dna.perceptionRadius) {
        minDist = d;
        bestFlora = f;
      }
    }

    if (bestFlora) {
      const fPos = new Vec2(bestFlora.x, bestFlora.y);
      if (minDist < this.dna.size + 10) {
        // Graze on flora
        const eaten = bestFlora.graze(18);
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 2.2);
        this.state = 'grazing';
      } else {
        const seek = Vec2.sub(fPos, this.pos).setMag(this.dna.speed * 0.8).sub(this.vel);
        force.add(seek.mult(1.2));
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.heading);

    const s = this.dna.size;
    const isPetrified = this.paralyzeTimer > 0;

    // Ground Shadow
    ctx.fillStyle = this.config.shadowColor;
    ctx.beginPath();
    ctx.ellipse(0, 3, Math.max(0, s * 1.4), Math.max(0, s * 0.7), 0, 0, Math.PI * 2);
    ctx.fill();

    // Four Procedural Galloping Legs
    const gallop = Math.sin(this.gaitPhase);
    ctx.strokeStyle = isPetrified ? '#64748b' : '#92400e';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';

    // Front Left & Right legs
    ctx.beginPath();
    ctx.moveTo(s * 0.8, -s * 0.4);
    ctx.lineTo(s * 1.2 + gallop * 4, -s * 0.9);
    ctx.moveTo(s * 0.8, s * 0.4);
    ctx.lineTo(s * 1.2 - gallop * 4, s * 0.9);
    // Back Left & Right legs
    ctx.moveTo(-s * 0.8, -s * 0.4);
    ctx.lineTo(-s * 1.3 - gallop * 4, -s * 0.9);
    ctx.moveTo(-s * 0.8, s * 0.4);
    ctx.lineTo(-s * 1.3 + gallop * 4, s * 0.9);
    ctx.stroke();

    // Torso (Tawny Roman mosaic ochre)
    ctx.fillStyle = isPetrified ? '#94a3b8' : this.config.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, s * 1.3), Math.max(0, s * 0.65), 0, 0, Math.PI * 2);
    ctx.fill();

    // Flank highlight
    ctx.fillStyle = isPetrified ? '#cbd5e1' : this.config.accentColor;
    ctx.beginPath();
    ctx.ellipse(s * 0.2, 0, Math.max(0, s * 0.7), Math.max(0, s * 0.35), 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck & Head
    ctx.fillStyle = isPetrified ? '#94a3b8' : this.config.color;
    ctx.beginPath();
    ctx.moveTo(s * 0.8, -s * 0.3);
    ctx.lineTo(s * 1.8, 0);
    ctx.lineTo(s * 0.8, s * 0.3);
    ctx.closePath();
    ctx.fill();

    // Antlers (for mature stags)
    if (this.isMaleStag && !isPetrified) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.6;
      // Left branch
      ctx.beginPath();
      ctx.moveTo(s * 1.2, -s * 0.2);
      ctx.lineTo(s * 1.6, -s * 1.1);
      ctx.lineTo(s * 1.3, -s * 1.5);
      ctx.moveTo(s * 1.6, -s * 1.1);
      ctx.lineTo(s * 2.0, -s * 1.4);
      // Right branch
      ctx.moveTo(s * 1.2, s * 0.2);
      ctx.lineTo(s * 1.6, s * 1.1);
      ctx.lineTo(s * 1.3, s * 1.5);
      ctx.moveTo(s * 1.6, s * 1.1);
      ctx.lineTo(s * 2.0, s * 1.4);
      ctx.stroke();
    }

    // Bobbing white rump / tail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 1.3, Math.sin(this.tailPhase) * 1.5, Math.max(0, s * 0.3), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================================
// XI. LEO (NEMEAN / BARBARY LION)
// ============================================================================

export class Leo extends Creature {
  constructor(x, y, dna = null) {
    super('leo', x, y, dna);
    this.stamina = this.config.staminaMax;
    this.isSprinting = false;
    this.stalkTarget = null;
    this.killCooldown = 0;
  }

  update(dt, ecosystem) {
    this.updateBaseMetabolism(dt, ecosystem.scentGrid);
    this.killCooldown = Math.max(0, this.killCooldown - dt);

    if (this.paralyzeTimer > 0) {
      this.integratePhysics(dt, 0);
      return;
    }

    const force = new Vec2(0, 0);

    // 1. Scan for fresh carcasses to scavenge
    let targetCarcass = null;
    let minCarcassDist = Infinity;
    for (const carcass of ecosystem.carcasses) {
      if (carcass.biomass > 5) {
        const d = this.pos.dist(new Vec2(carcass.x, carcass.y));
        if (d < minCarcassDist && d < this.config.perceptionRadius * 1.2) {
          minCarcassDist = d;
          targetCarcass = carcass;
        }
      }
    }

    // 2. Scan for live prey (Cervus, calves, wounded beasts)
    let targetPrey = null;
    let minPreyDist = Infinity;
    for (const c of ecosystem.creatures) {
      if (c.config.role === 'prey' || (c.config.role === 'mega_herbivore' && c.age < 15)) {
        const d = this.pos.dist(c.pos);
        if (d < minPreyDist && d < this.config.perceptionRadius) {
          if (this.canSee(c.pos) || this.canHear(c.pos)) {
            minPreyDist = d;
            targetPrey = c;
          }
        }
      }
    }

    // Olfactory hunting: follow herbivore or blood scent gradient if no visual prey
    if (!targetPrey && !targetCarcass) {
      const bloodGrad = ecosystem.scentGrid.sampleGradient('blood', this.pos.x, this.pos.y);
      const herbGrad = ecosystem.scentGrid.sampleGradient('herbivore', this.pos.x, this.pos.y);

      if (bloodGrad.magSq() > 0.04) {
        force.add(bloodGrad.setMag(140));
        this.state = 'tracking_blood';
      } else if (herbGrad.magSq() > 0.04) {
        force.add(herbGrad.setMag(100));
        this.state = 'tracking_herb';
      } else {
        this.state = 'prowling';
        // Gentle wander
        force.add(Vec2.fromAngle(this.heading + Math.sin(this.gaitPhase * 0.3) * 0.5, 45));
      }
    }

    // Feeding on carcass
    if (targetCarcass && (!targetPrey || minCarcassDist < 80)) {
      if (minCarcassDist < this.dna.size + 14) {
        const bite = targetCarcass.feed(35 * dt);
        this.energy = Math.min(this.maxEnergy, this.energy + bite * 3.0);
        this.stamina = Math.min(this.config.staminaMax, this.stamina + dt * 25);
        this.state = 'carcass_feeding';
      } else {
        const seek = Vec2.sub(new Vec2(targetCarcass.x, targetCarcass.y), this.pos)
          .setMag(this.dna.speed * 0.9)
          .sub(this.vel);
        force.add(seek.mult(1.5));
      }
    } else if (targetPrey) {
      // Predation tactics: Stalking vs Sprint Burst
      const dist = minPreyDist;
      const sprintRange = 95;

      if (dist > sprintRange || this.stamina < 20) {
        // Stalking stealthily through tall grass
        this.isSprinting = false;
        this.state = 'stalking';
        const creepSpd = this.dna.speed * 0.65;
        const seek = Vec2.sub(targetPrey.pos, this.pos).setMag(creepSpd).sub(this.vel);
        force.add(seek.mult(1.4));
        // Recover stamina while creeping
        this.stamina = Math.min(this.config.staminaMax, this.stamina + this.config.staminaRecovery * dt);
      } else {
        // Explosive Sprint Burst
        this.isSprinting = true;
        this.state = 'sprinting';
        const sprintSpd = this.dna.sprintSpeed;
        const seek = Vec2.sub(targetPrey.pos, this.pos).setMag(sprintSpd).sub(this.vel);
        force.add(seek.mult(2.5));
        this.stamina = Math.max(0, this.stamina - this.config.staminaDrain * dt);

        // Takedown & Consumption strike
        if (dist < this.dna.size + targetPrey.dna.size + 4 && this.killCooldown <= 0) {
          targetPrey.health -= 75;
          targetPrey.energy -= 40;
          this.killCooldown = 1.0;
          this.energy = Math.min(this.maxEnergy, this.energy + 65);
          ecosystem.spawnParticles(this.pos.x, this.pos.y, 8, '#ef4444');
          ecosystem.scentGrid.deposit('blood', this.pos.x, this.pos.y, 15.0);

          if (targetPrey.health <= 0) {
            ecosystem.spawnCarcass(targetPrey.speciesKey, targetPrey.pos.x, targetPrey.pos.y, 85);
          }
        }
      }
    }

    this.applyForce(force);
    this.avoidBoundaries(ecosystem.width, ecosystem.height);

    const maxSpeed = this.isSprinting ? this.dna.sprintSpeed : this.dna.speed;
    this.integratePhysics(dt, maxSpeed);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.heading);

    const s = this.dna.size;
    const isPetrified = this.paralyzeTimer > 0;

    // Ground Shadow
    ctx.fillStyle = this.config.shadowColor;
    ctx.beginPath();
    ctx.ellipse(0, 4, Math.max(0, s * 1.6), Math.max(0, s * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();

    // Muscular Legs
    const prowl = Math.sin(this.gaitPhase);
    ctx.strokeStyle = isPetrified ? '#475569' : '#7c2d12';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    // Front Legs
    ctx.moveTo(s * 0.9, -s * 0.5);
    ctx.lineTo(s * 1.3 + prowl * 5, -s * 1.0);
    ctx.moveTo(s * 0.9, s * 0.5);
    ctx.lineTo(s * 1.3 - prowl * 5, s * 1.0);
    // Hind Legs
    ctx.moveTo(-s * 0.9, -s * 0.5);
    ctx.lineTo(-s * 1.4 - prowl * 5, -s * 1.0);
    ctx.moveTo(-s * 0.9, s * 0.5);
    ctx.lineTo(-s * 1.4 + prowl * 5, s * 1.0);
    ctx.stroke();

    // Muscular Torso (Roman crimson-ochre predator)
    ctx.fillStyle = isPetrified ? '#64748b' : this.config.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, s * 1.5), Math.max(0, s * 0.75), 0, 0, Math.PI * 2);
    ctx.fill();

    // Magnificent Imperial Nemean Mane
    if (!isPetrified) {
      const maneWave = Math.sin(this.tailPhase * 2) * 2;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(s * 0.6, 0, Math.max(0, s * 1.1 + maneWave), 0, Math.PI * 2);
      ctx.fill();

      // Radiant Mane Spikes
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      for (let m = 0; m < 8; m++) {
        const mAng = (m * Math.PI) / 4 + maneWave * 0.1;
        ctx.beginPath();
        ctx.moveTo(s * 0.6, 0);
        ctx.lineTo(s * 0.6 + Math.cos(mAng) * (s * 1.3), Math.sin(mAng) * (s * 1.3));
        ctx.stroke();
      }
    }

    // Predatory Head & Glowing Eyes
    ctx.fillStyle = isPetrified ? '#475569' : '#ea580c';
    ctx.beginPath();
    ctx.arc(s * 1.3, 0, Math.max(0, s * 0.6), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isPetrified ? '#94a3b8' : '#fef08a';
    ctx.beginPath();
    ctx.arc(s * 1.5, -s * 0.25, Math.max(0, 1.8), 0, Math.PI * 2);
    ctx.arc(s * 1.5, s * 0.25, Math.max(0, 1.8), 0, Math.PI * 2);
    ctx.fill();

    // Sweeping Tail with tufted tassel
    const tailSway = Math.sin(this.tailPhase) * s * 0.8;
    ctx.strokeStyle = isPetrified ? '#64748b' : this.config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 1.4, 0);
    ctx.quadraticCurveTo(-s * 2.0, tailSway * 0.5, -s * 2.4, tailSway);
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(-s * 2.4, tailSway, Math.max(0, 3.2), 0, Math.PI * 2);
    ctx.fill();

    // Stamina Bar
    if (this.isSprinting && !isPetrified) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-s, -s * 1.8, s * 2, 4);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-s, -s * 1.8, (s * 2 * this.stamina) / this.config.staminaMax, 4);
    }

    ctx.restore();
  }
}

// ============================================================================
// XII. GRIFFIN (APEX SKY HUNTER - GRYPS SCYTHICUS)
// ============================================================================

export class Griffin extends Creature {
  constructor(x, y, dna = null) {
    super('griffin', x, y, dna);
    this.altitude = this.config.flightAltitude;
    this.wingCycle = Math.random() * Math.PI * 2;
    this.diveTarget = null;
    this.diveTimer = 0;
    this.nestPos = new Vec2(x, y);
  }

  update(dt, ecosystem) {
    this.updateBaseMetabolism(dt, ecosystem.scentGrid);
    this.wingCycle += dt * (this.state === 'diving' ? 14 : 7);

    if (this.paralyzeTimer > 0) {
      this.altitude = Math.max(0, this.altitude - dt * 40);
      this.integratePhysics(dt, 0);
      return;
    }

    const force = new Vec2(0, 0);

    // 1. Scan for Golden Nest or Guard Territory
    if (ecosystem.nest) {
      this.nestPos.set(ecosystem.nest.x, ecosystem.nest.y);
    }

    // 2. High altitude soaring vs Swoop Dive Attack
    if (this.state === 'diving') {
      if (this.diveTarget && !this.diveTarget.isDead()) {
        const toTarget = Vec2.sub(this.diveTarget.pos, this.pos);
        const dist = toTarget.mag();
        force.add(toTarget.normalize().mult(550));
        // Altitude drops fast during dive
        this.altitude = Math.max(0, this.altitude - dt * 110);

        // Talon strike at ground impact
        if (dist < this.dna.size + this.diveTarget.dna.size + 10 || this.altitude <= 5) {
          this.diveTarget.health -= 110;
          this.energy = Math.min(this.maxEnergy, this.energy + 90);
          ecosystem.spawnParticles(this.pos.x, this.pos.y, 14, '#ffd700');
          ecosystem.scentGrid.deposit('blood', this.pos.x, this.pos.y, 20.0);

          if (this.diveTarget.health <= 0) {
            ecosystem.spawnCarcass(this.diveTarget.speciesKey, this.diveTarget.pos.x, this.diveTarget.pos.y, 95);
          }
          this.state = 'climbing';
          this.diveTimer = 4.0;
        }
      } else {
        this.state = 'climbing';
      }
    } else if (this.state === 'climbing') {
      this.altitude = Math.min(this.config.flightAltitude, this.altitude + dt * 45);
      force.add(Vec2.fromAngle(this.heading, 120));
      this.diveTimer -= dt;
      if (this.altitude >= this.config.flightAltitude * 0.9 && this.diveTimer <= 0) {
        this.state = 'soaring';
      }
    } else {
      // Soaring at high altitude: sweeping thermal circular patrol
      this.state = 'soaring';
      this.altitude = this.config.flightAltitude;

      // Scan ground for vulnerable targets (lone Cervus or Leo)
      let bestTarget = null;
      let minScore = Infinity;

      for (const c of ecosystem.creatures) {
        if (c !== this && (c.config.role === 'prey' || c.config.role === 'predator')) {
          const d = this.pos.dist(c.pos);
          if (d < this.dna.perceptionRadius * 1.5) {
            if (d < minScore) {
              minScore = d;
              bestTarget = c;
            }
          }
        }
      }

      if (bestTarget && this.energy < this.maxEnergy * 0.85 && Math.random() < 0.08) {
        this.diveTarget = bestTarget;
        this.state = 'diving';
      } else {
        // Patrol orbit around nest or map center
        const nestDist = this.pos.dist(this.nestPos);
        if (nestDist > 350) {
          const returnSeek = Vec2.sub(this.nestPos, this.pos).setMag(this.dna.speed).sub(this.vel);
          force.add(returnSeek.mult(1.5));
        } else {
          // Sweeping orbital arc
          this.heading += 0.018;
          force.add(Vec2.fromAngle(this.heading, this.dna.speed * 0.8));
        }
      }
    }

    this.applyForce(force);
    this.avoidBoundaries(ecosystem.width, ecosystem.height, 40);

    const speedCap = this.state === 'diving' ? this.dna.sprintSpeed : this.dna.speed;
    this.integratePhysics(dt, speedCap);
  }

  render(ctx) {
    ctx.save();

    const s = this.dna.size;
    const isPetrified = this.paralyzeTimer > 0;
    const altRatio = this.altitude / this.config.flightAltitude;

    // 1. Dynamic Cast Ground Shadow (Offset by sun and altitude)
    const shadowOffset = 25 * altRatio;
    ctx.save();
    ctx.translate(this.pos.x + shadowOffset, this.pos.y + shadowOffset);
    ctx.rotate(this.heading);
    ctx.fillStyle = `rgba(15, 23, 42, ${0.15 + (1 - altRatio) * 0.35})`;
    const shadowScale = 1.0 - altRatio * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, s * 2.2 * shadowScale), Math.max(0, s * 1.8 * shadowScale), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. High-Altitude Airborne Body Rendering
    ctx.translate(this.pos.x, this.pos.y - this.altitude * 0.35);
    ctx.rotate(this.heading);

    // Flapping Articulated Eagle Wings
    const wingFlap = Math.sin(this.wingCycle) * (s * 1.8 * (0.4 + altRatio * 0.6));
    const wingSpread = s * 2.6;

    ctx.fillStyle = isPetrified ? '#64748b' : '#d97706';
    ctx.strokeStyle = isPetrified ? '#94a3b8' : '#fbbf24';
    ctx.lineWidth = 2;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(s * 0.5, -s * 0.4);
    ctx.lineTo(-s * 0.8, -wingSpread + wingFlap);
    ctx.lineTo(-s * 1.6, -wingSpread * 0.7 + wingFlap * 0.8);
    ctx.lineTo(-s * 0.8, -s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.4);
    ctx.lineTo(-s * 0.8, wingSpread - wingFlap);
    ctx.lineTo(-s * 1.6, wingSpread * 0.7 - wingFlap * 0.8);
    ctx.lineTo(-s * 0.8, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lion Hindquarters & Eagle Forebody
    ctx.fillStyle = isPetrified ? '#94a3b8' : this.config.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, s * 1.6), Math.max(0, s * 0.85), 0, 0, Math.PI * 2);
    ctx.fill();

    // Hooked Raptor Beak & Crown Crest
    ctx.fillStyle = isPetrified ? '#475569' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(s * 1.4, -s * 0.4);
    ctx.lineTo(s * 2.3, 0);
    ctx.lineTo(s * 1.4, s * 0.4);
    ctx.closePath();
    ctx.fill();

    // Hooked Beak Tip
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 1.8, 0);
    ctx.lineTo(s * 2.4, s * 0.2);
    ctx.stroke();

    // Piercing Eagle Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 1.5, -s * 0.25, Math.max(0, 2.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(s * 1.6, -s * 0.25, Math.max(0, 1.2), 0, Math.PI * 2);
    ctx.fill();

    // Golden Halo / Scythian Aura
    if (!isPetrified) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, s * 2.2), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ============================================================================
// XIII. BASILISK (CROWNED SERPENT OF CYRENE)
// ============================================================================

export class Basilisk extends Creature {
  constructor(x, y, dna = null) {
    super('basilisk', x, y, dna);
    this.segmentCount = 16;
    this.segments = [];
    for (let i = 0; i < this.segmentCount; i++) {
      this.segments.push(new Vec2(x - i * 8, y));
    }
    this.slitherPhase = 0;
    this.tongueCycle = 0;
    this.gazeActive = false;
  }

  update(dt, ecosystem) {
    this.updateBaseMetabolism(dt, ecosystem.scentGrid);
    this.slitherPhase += dt * 6.5;
    this.tongueCycle += dt * 8.0;

    if (this.paralyzeTimer > 0) {
      this.integratePhysics(dt, 0);
      return;
    }

    const force = new Vec2(0, 0);

    // 1. Slither Footprints: Deposits Toxic Blight into Scent Grid
    ecosystem.scentGrid.deposit('toxic', this.pos.x, this.pos.y, 4.8 * dt);

    // Withering nearby flora clusters
    for (const f of ecosystem.flora) {
      if (this.pos.distSq(new Vec2(f.x, f.y)) < 36 * 36) {
        f.blight();
      }
    }

    // 2. Petrifying Gaze: Sweeps Forward Visual Cone
    this.gazeActive = false;
    let targetPrey = null;
    let minDist = Infinity;

    for (const c of ecosystem.creatures) {
      if (c !== this && c.config.role !== 'mythic_predator') {
        const d = this.pos.dist(c.pos);
        if (d < this.config.gazeRange && this.canSee(c.pos, this.config.gazeRange, this.config.gazeConeAngle)) {
          this.gazeActive = true;
          // Apply petrification paralyze timer
          c.paralyzeTimer = Math.min(8.0, c.paralyzeTimer + dt * 2.8);
          if (d < minDist) {
            minDist = d;
            targetPrey = c;
          }
        }
      }
    }

    // Hunting or wandering
    if (targetPrey) {
      const seek = Vec2.sub(targetPrey.pos, this.pos).setMag(this.dna.sprintSpeed).sub(this.vel);
      force.add(seek.mult(2.2));

      // Venomous strike if within striking range
      if (minDist < this.dna.size + targetPrey.dna.size + 4) {
        targetPrey.health -= 95;
        this.energy = Math.min(this.maxEnergy, this.energy + 80);
        ecosystem.spawnParticles(this.pos.x, this.pos.y, 10, '#22c55e');

        if (targetPrey.health <= 0) {
          ecosystem.spawnCarcass(targetPrey.speciesKey, targetPrey.pos.x, targetPrey.pos.y, 90);
        }
      }
    } else {
      // Serpentine slither wander
      const slitherWander = Math.sin(this.slitherPhase * 0.4) * 0.8;
      force.add(Vec2.fromAngle(this.heading + slitherWander, this.dna.speed));
    }

    this.applyForce(force);
    this.avoidBoundaries(ecosystem.width, ecosystem.height);
    this.integratePhysics(dt, targetPrey ? this.dna.sprintSpeed : this.dna.speed);

    // 3. Multi-Segment Inverse Kinematics Spine Propagation
    this.segments[0].set(this.pos.x, this.pos.y);
    const segDist = 8.2;
    for (let i = 1; i < this.segmentCount; i++) {
      const prev = this.segments[i - 1];
      const curr = this.segments[i];
      const dir = Vec2.sub(curr, prev);
      const wave = Math.sin(this.slitherPhase - i * 0.45) * 2.4;
      dir.rotate(wave * 0.05);
      curr.set(prev.x + (dir.x / (dir.mag() || 1)) * segDist, prev.y + (dir.y / (dir.mag() || 1)) * segDist);
    }
  }

  render(ctx) {
    ctx.save();

    const isPetrified = this.paralyzeTimer > 0;

    // 1. Petrifying Gaze Visual Cone Beam
    if (this.gazeActive && !isPetrified) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.heading);

      const gazeR = this.config.gazeRange;
      const coneA = this.config.gazeConeAngle;
      const gazeGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, Math.max(5, gazeR));
      gazeGrad.addColorStop(0, 'rgba(163, 230, 53, 0.45)');
      gazeGrad.addColorStop(0.7, 'rgba(74, 222, 128, 0.2)');
      gazeGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');

      ctx.fillStyle = gazeGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(0, gazeR), -coneA * 0.5, coneA * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 2. Slithering Multi-Segment Spine
    for (let i = this.segmentCount - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const radius = Math.max(2, (1.0 - i / this.segmentCount) * 8.5 + 3);

      ctx.save();
      ctx.translate(seg.x, seg.y);

      // Segment shadow
      ctx.fillStyle = 'rgba(10, 30, 15, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 2, Math.max(0, radius * 1.1), 0, Math.PI * 2);
      ctx.fill();

      // Scaled mosaic emerald disc
      ctx.fillStyle = isPetrified ? '#64748b' : i % 2 === 0 ? '#15803d' : '#166534';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isPetrified ? '#94a3b8' : '#86efac';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Head & Royal Golden Diadem ("candida in capite macula velut diademate imposita")
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.heading);

    // Crown Diadem
    if (!isPetrified) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(4, -8);
      ctx.lineTo(8, -12);
      ctx.lineTo(10, -7);
      ctx.lineTo(14, -13);
      ctx.lineTo(13, -4);
      ctx.closePath();
      ctx.fill();
    }

    // Baleful glowing eyes
    ctx.fillStyle = isPetrified ? '#cbd5e1' : '#fef08a';
    ctx.beginPath();
    ctx.arc(8, -4, Math.max(0, 2), 0, Math.PI * 2);
    ctx.arc(8, 4, Math.max(0, 2), 0, Math.PI * 2);
    ctx.fill();

    // Flicking forked serpentine tongue
    if (!isPetrified && Math.sin(this.tongueCycle) > 0.4) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(19, 0);
      ctx.lineTo(23, -3);
      ctx.moveTo(19, 0);
      ctx.lineTo(23, 3);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}

// ============================================================================
// XIV. MONOCEROS (SOLITARY MYTHIC UNICORN)
// ============================================================================

export class Monoceros extends Creature {
  constructor(x, y, dna = null) {
    super('monoceros', x, y, dna);
    this.auraPulse = 0;
    this.dashCooldown = 0;
  }

  update(dt, ecosystem) {
    this.updateBaseMetabolism(dt, ecosystem.scentGrid);
    this.auraPulse += dt * 3.2;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    if (this.paralyzeTimer > 0) {
      // Pure celestial blood dissolves paralysis rapidly
      this.paralyzeTimer = Math.max(0, this.paralyzeTimer - dt * 2.5);
    }

    const force = new Vec2(0, 0);

    // 1. Radiant Healing Aura: Purges toxic blight and blooms ambrosia flora
    ecosystem.scentGrid.purgeAround(this.pos.x, this.pos.y, this.config.auraRadius);
    for (const f of ecosystem.flora) {
      if (this.pos.distSq(new Vec2(f.x, f.y)) < this.config.auraRadius * this.config.auraRadius) {
        if (f.withered > 0) f.rejuvenate();
      }
    }

    // Heal nearby friendly creatures
    for (const c of ecosystem.creatures) {
      if (c !== this && c.pos.distSq(this.pos) < this.config.auraRadius * this.config.auraRadius) {
        c.health = Math.min(c.maxHealth, c.health + dt * 12);
        c.paralyzeTimer = Math.max(0, c.paralyzeTimer - dt * 3);
      }
    }

    // 2. Solitary Wander & Evasive Agile Dash away from predators
    let nearThreat = null;
    let minThreatDist = Infinity;

    for (const c of ecosystem.creatures) {
      if (c.config.role === 'predator' || c.config.role === 'mythic_predator' || c.config.role === 'apex_sky') {
        const d = this.pos.dist(c.pos);
        if (d < 140 && d < minThreatDist) {
          minThreatDist = d;
          nearThreat = c;
        }
      }
    }

    if (nearThreat) {
      this.state = 'evasive_dash';
      const fleeDir = Vec2.sub(this.pos, nearThreat.pos).normalize();
      force.add(fleeDir.mult(450));

      if (this.dashCooldown <= 0 && minThreatDist < 80) {
        // Ethereal blink dash
        this.pos.add(Vec2.mult(fleeDir, 65));
        this.dashCooldown = 3.5;
        ecosystem.spawnParticles(this.pos.x, this.pos.y, 16, '#38bdf8');
      }
    } else {
      this.state = 'divine_grazing';
      // Peaceful solitary wander
      force.add(Vec2.fromAngle(this.heading + Math.sin(this.auraPulse * 0.2) * 0.4, 60));
      // Grazing on ambrosia flora
      for (const f of ecosystem.flora) {
        if (f.isAmbrosia && this.pos.distSq(new Vec2(f.x, f.y)) < 30 * 30) {
          f.graze(15);
          this.energy = Math.min(this.maxEnergy, this.energy + 25);
        }
      }
    }

    this.applyForce(force);
    this.avoidBoundaries(ecosystem.width, ecosystem.height);
    this.integratePhysics(dt, nearThreat ? this.dna.sprintSpeed : this.dna.speed);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.heading);

    const s = this.dna.size;
    const isPetrified = this.paralyzeTimer > 0;

    // 1. Pulsing Radiant Celestial Halo Aura
    if (!isPetrified) {
      const pulseR = this.config.auraRadius * (0.85 + Math.sin(this.auraPulse) * 0.15);
      const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, Math.max(5, pulseR));
      auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      auraGrad.addColorStop(0.6, 'rgba(147, 197, 253, 0.1)');
      auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, pulseR), 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground Shadow
    ctx.fillStyle = this.config.shadowColor;
    ctx.beginPath();
    ctx.ellipse(0, 3, Math.max(0, s * 1.5), Math.max(0, s * 0.7), 0, 0, Math.PI * 2);
    ctx.fill();

    // Pure White Equine Torso & Galloping Legs
    const gallop = Math.sin(this.gaitPhase);
    ctx.strokeStyle = isPetrified ? '#64748b' : '#cbd5e1';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(s * 0.8, -s * 0.4);
    ctx.lineTo(s * 1.2 + gallop * 4, -s * 0.9);
    ctx.moveTo(s * 0.8, s * 0.4);
    ctx.lineTo(s * 1.2 - gallop * 4, s * 0.9);
    ctx.moveTo(-s * 0.8, -s * 0.4);
    ctx.lineTo(-s * 1.3 - gallop * 4, -s * 0.9);
    ctx.moveTo(-s * 0.8, s * 0.4);
    ctx.lineTo(-s * 1.3 + gallop * 4, s * 0.9);
    ctx.stroke();

    // Torso (Gleaming white mosaic steed)
    ctx.fillStyle = isPetrified ? '#94a3b8' : this.config.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, s * 1.4), Math.max(0, s * 0.7), 0, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Silver Mane
    ctx.fillStyle = isPetrified ? '#64748b' : '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(s * 0.4, -s * 0.4, Math.max(0, s * 0.8), Math.max(0, s * 0.35), -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Slender Equine Head
    ctx.fillStyle = isPetrified ? '#94a3b8' : this.config.color;
    ctx.beginPath();
    ctx.moveTo(s * 0.8, -s * 0.3);
    ctx.lineTo(s * 1.8, 0);
    ctx.lineTo(s * 0.8, s * 0.3);
    ctx.closePath();
    ctx.fill();

    // Spiraling Black & Opalescent Horn ("uno cornu nigro media fronte cubitorum duum eminente")
    if (!isPetrified) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s * 1.5, 0);
      ctx.lineTo(s * 2.8, 0);
      ctx.stroke();

      // Gleaming Starlight Tip
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(s * 2.8, 0, Math.max(0, 2.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// XV. ELEPHANTUS (ROMAN WAR ELEPHANT - ELEPHAS MAXIMUS)
// ============================================================================

export class Elephantus extends Creature {
  constructor(x, y, dna = null) {
    super('elephantus', x, y, dna);
    this.trunkAngle = 0;
    this.earFlap = 0;
    this.trumpetTimer = 0;
    this.shockwaveCooldown = 0;
  }

  update(dt, ecosystem) {
    this.updateBaseMetabolism(dt, ecosystem.scentGrid);
    this.earFlap += dt * 3.0;
    this.shockwaveCooldown = Math.max(0, this.shockwaveCooldown - dt);

    if (this.paralyzeTimer > 0) {
      // High mass resists petrifaction
      this.paralyzeTimer = Math.max(0, this.paralyzeTimer - dt * 1.8);
      this.integratePhysics(dt, 0);
      return;
    }

    const force = new Vec2(0, 0);

    // 1. Scan for Threats (Lions or Basilisks threatening calves or herd)
    let threatNearby = null;
    let minThreatDist = Infinity;

    for (const c of ecosystem.creatures) {
      if (c.config.role === 'predator' || c.config.role === 'mythic_predator') {
        const d = this.pos.dist(c.pos);
        if (d < 180 && d < minThreatDist) {
          minThreatDist = d;
          threatNearby = c;
        }
      }
    }

    // 2. Trumpeting Acoustic Shockwave Defense
    if (threatNearby && this.shockwaveCooldown <= 0) {
      this.trumpetTimer = 1.2;
      this.shockwaveCooldown = 8.0;
      this.state = 'trumpeting';
      ecosystem.spawnShockwave(this.pos.x, this.pos.y, this.config.trumpetShockwaveRadius);
      ecosystem.spawnParticles(this.pos.x, this.pos.y, 20, '#eab308');

      // Knock back and stun threats
      const shockTargets = ecosystem.spatialHash
        ? ecosystem.spatialHash.query(this.pos.x, this.pos.y, this.config.trumpetShockwaveRadius)
        : ecosystem.creatures;
      for (const other of shockTargets) {
        if (other !== this && other.pos.dist(this.pos) < this.config.trumpetShockwaveRadius) {
          const knockDir = Vec2.sub(other.pos, this.pos).normalize();
          other.applyForce(knockDir.mult(600));
          if (other.config.role === 'predator') other.health -= 25;
        }
      }
    }

    if (this.trumpetTimer > 0) {
      this.trumpetTimer -= dt;
      // Trunk raised triumphantly
      this.trunkAngle = -Math.PI * 0.45;
    } else {
      this.trunkAngle = Math.sin(this.gaitPhase * 0.5) * 0.35;

      // 3. Herd Wall Formation: Protect Juveniles
      this.applyHerdDefense(ecosystem.creatures, force);

      // 4. Foraging: consumes large amounts of shrubs and visits ponds
      this.forageAndDrink(ecosystem, force);
    }

    this.applyForce(force);
    this.avoidBoundaries(ecosystem.width, ecosystem.height, 70);
    this.integratePhysics(dt, this.dna.speed);
  }

  applyHerdDefense(creatures, force) {
    let elephantCount = 0;
    const herdCenter = new Vec2(0, 0);

    for (const c of creatures) {
      if (c !== this && c.speciesKey === 'elephantus') {
        herdCenter.add(c.pos);
        elephantCount++;
      }
    }

    if (elephantCount > 0) {
      herdCenter.div(elephantCount);
      const d = this.pos.dist(herdCenter);
      // Ring defense perimeter at 80px radius around herd center
      if (d > 100) {
        force.add(Vec2.sub(herdCenter, this.pos).setMag(this.dna.speed * 0.6));
      } else if (d < 50) {
        force.add(Vec2.sub(this.pos, herdCenter).setMag(this.dna.speed * 0.8));
      }
    }
  }

  forageAndDrink(ecosystem, force) {
    if (this.energy < this.maxEnergy * 0.8) {
      for (const f of ecosystem.flora) {
        if (f.biomass > 20 && this.pos.distSq(new Vec2(f.x, f.y)) < 40 * 40) {
          const eaten = f.graze(35);
          this.energy = Math.min(this.maxEnergy, this.energy + eaten * 2.0);
          break;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.heading);

    const s = this.dna.size;
    const isPetrified = this.paralyzeTimer > 0;

    // Colossal Ground Shadow
    ctx.fillStyle = this.config.shadowColor;
    ctx.beginPath();
    ctx.ellipse(0, 6, Math.max(0, s * 1.8), Math.max(0, s * 1.1), 0, 0, Math.PI * 2);
    ctx.fill();

    // Four Massive Pillar Legs
    const step = Math.sin(this.gaitPhase);
    ctx.strokeStyle = isPetrified ? '#334155' : '#475569';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.6);
    ctx.lineTo(s * 1.2 + step * 4, -s * 1.2);
    ctx.moveTo(s * 0.9, s * 0.6);
    ctx.lineTo(s * 1.2 - step * 4, s * 1.2);
    ctx.moveTo(-s * 0.9, -s * 0.6);
    ctx.lineTo(-s * 1.3 - step * 4, -s * 1.2);
    ctx.moveTo(-s * 0.9, s * 0.6);
    ctx.lineTo(-s * 1.3 + step * 4, s * 1.2);
    ctx.stroke();

    // Massive Pachyderm Body (Roman War Slate Gray)
    ctx.fillStyle = isPetrified ? '#64748b' : this.config.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, s * 1.6), Math.max(0, s * 1.1), 0, 0, Math.PI * 2);
    ctx.fill();

    // Imperial Roman Crimson War Blanket / Saddle Caparison
    if (!isPetrified) {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-s * 0.8, -s * 0.7, s * 1.6, s * 1.4);

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-s * 0.8, -s * 0.7, s * 1.6, s * 1.4);
    }

    // Broad Flapping Ears
    const earWave = Math.sin(this.earFlap) * 3;
    ctx.fillStyle = isPetrified ? '#475569' : '#64748b';
    ctx.beginPath();
    ctx.ellipse(s * 0.8, -s * 1.0 + earWave, Math.max(0, s * 0.5), Math.max(0, s * 0.8), -0.3, 0, Math.PI * 2);
    ctx.ellipse(s * 0.8, s * 1.0 - earWave, Math.max(0, s * 0.5), Math.max(0, s * 0.8), 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Pachyderm Head
    ctx.fillStyle = isPetrified ? '#64748b' : '#475569';
    ctx.beginPath();
    ctx.arc(s * 1.3, 0, Math.max(0, s * 0.75), 0, Math.PI * 2);
    ctx.fill();

    // Long Ivory War Tusks with Gold Tips
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s * 1.4, -s * 0.4);
    ctx.quadraticCurveTo(s * 2.2, -s * 0.6, s * 2.5, -s * 0.2);
    ctx.moveTo(s * 1.4, s * 0.4);
    ctx.quadraticCurveTo(s * 2.2, s * 0.6, s * 2.5, 0.2);
    ctx.stroke();

    // Articulated Multi-Segment Swaying Trunk
    ctx.save();
    ctx.translate(s * 1.8, 0);
    ctx.rotate(this.trunkAngle);
    ctx.strokeStyle = isPetrified ? '#475569' : '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.6, s * 0.2, s * 1.2, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}

// ============================================================================
// XVI. LOTKA-VOLTERRA POPULATION DYNAMICS & PHASE-SPACE TRACKER
// ============================================================================

export class LotkaVolterraTracker {
  constructor() {
    this.history = [];
    this.maxPoints = 120;
    this.timer = 0;

    // Classical mathematical model parameters
    this.alpha = 0.85; // intrinsic prey growth
    this.beta = 0.015; // predation encounter rate
    this.gamma = 0.65; // predator mortality rate
    this.delta = 0.008; // predator reproduction conversion efficiency
    this.simH = 50.0;
    this.simP = 8.0;
  }

  update(dt, preyCount, predCount) {
    this.timer += dt;

    // Solve internal coupled differential equations:
    // dH/dt = alpha * H - beta * H * P
    // dP/dt = delta * beta * H * P - gamma * P
    const dH = this.alpha * this.simH - this.beta * this.simH * this.simP;
    const dP = this.delta * this.beta * this.simH * this.simP - this.gamma * this.simP;
    this.simH = clamp(this.simH + dH * dt, 5, 250);
    this.simP = clamp(this.simP + dP * dt, 1, 60);

    // Sample empirical census into historical trajectory buffer
    if (this.timer >= 0.75) {
      this.timer = 0;
      this.history.push({
        prey: Number.isFinite(preyCount) ? preyCount : 0,
        predator: Number.isFinite(predCount) ? predCount : 0,
        time: Date.now()
      });
      if (this.history.length > this.maxPoints) {
        this.history.shift();
      }
    }
  }

  renderPhasePlot(ctx, gx, gy, gw, gh) {
    if (this.history.length < 2) return;

    ctx.save();
    // Dark Roman mosaic container card
    ctx.fillStyle = 'rgba(10, 15, 24, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeRect(gx, gy, gw, gh);

    // Epigraph Header
    ctx.font = '10px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('LOTKA-VOLTERRA PHASE SPACE', gx + 8, gy + 14);

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('X: Prey (H) | Y: Predator (P)', gx + 8, gy + 26);

    const plotX = gx + 10;
    const plotY = gy + 32;
    const plotW = gw - 20;
    const plotH = gh - 40;

    // Coordinate grid axes
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    const maxPrey = 120;
    const maxPred = 30;

    // Draw historical orbital trajectory loop with alpha gradient
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const pt = this.history[i];
      const px = plotX + clamp((pt.prey / maxPrey) * plotW, 0, plotW);
      const py = plotY + plotH - clamp((pt.predator / maxPred) * plotH, 0, plotH);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Current state beacon
    const current = this.history[this.history.length - 1];
    const curX = plotX + clamp((current.prey / maxPrey) * plotW, 0, plotW);
    const curY = plotY + plotH - clamp((current.predator / maxPred) * plotH, 0, plotH);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(curX, curY, Math.max(0, 3.5), 0, Math.PI * 2);
    ctx.fill();

    // Subtle beacon ring
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(curX, curY, Math.max(0, 6), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ============================================================================
// XVII. ROMAN MOSAIC AESTHETIC & BIOME WORLD RENDERER
// ============================================================================

export function renderParchmentBackground(ctx, width, height) {
  ctx.save();
  // Warm Roman illuminated parchment tone
  ctx.fillStyle = '#10141d';
  ctx.fillRect(0, 0, width, height);

  // Subtle classical tessellation mosaic grid lines
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
  ctx.lineWidth = 1;
  const tileSize = 48;
  ctx.beginPath();
  for (let x = 0; x < width; x += tileSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += tileSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Outer Roman Mosaic Meander Border Accent
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, Math.max(0, width - 8), Math.max(0, height - 8));

  // Inner border fillet
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, Math.max(0, width - 16), Math.max(0, height - 16));

  ctx.restore();
}

export function renderSelectionLaurel(ctx, creature) {
  if (!creature || creature.isDead()) return;
  ctx.save();
  ctx.translate(creature.pos.x, creature.pos.y);

  const r = creature.dna.size * 2.2 + 6;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2);
  ctx.stroke();

  // Golden Laurel Leaf Accents
  ctx.fillStyle = '#fde047';
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const lx = Math.cos(ang) * r;
    const ly = Math.sin(ang) * r;
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(0, 2.5), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================================
// XVIII. CANVAS HUD & ROMAN BESTIARY TELEMETRY
// ============================================================================

export class BestiariumHUD {
  constructor(engine) {
    this.engine = engine;
    this.citationIndex = 0;
    this.citationTimer = 0;
  }

  update(dt) {
    this.citationTimer += dt;
    if (this.citationTimer > 12.0) {
      this.citationTimer = 0;
      this.citationIndex = (this.citationIndex + 1) % PLINIAN_CITATIONS.length;
    }
  }

  render(ctx) {
    ctx.save();
    const ui = this.engine.uiScale();
    ctx.scale(ui, ui);
    const w = this.engine.width / ui;
    const h = this.engine.height / ui;
    const narrow = w < 560;

    // 1. Top Ribbon: Census & Season Epigraphy
    this.renderTopRibbon(ctx, w);

    // 2. Bottom-Right: Lotka-Volterra Phase Space Plot
    if (!narrow) {
      this.engine.lotkaVolterra.renderPhasePlot(ctx, w - 210, h - 145, 195, 130);
    }

    // 3. Bottom-Left: Authentic Pliny Book VIII Citation Scroll
    const scrollW = narrow ? (w - 32) : Math.min(600, w - 240);
    this.renderCitationScroll(ctx, 16, h - 75, scrollW, 65);

    // 4. Selected Creature Inspector Card (if creature is selected)
    if (this.engine.selectedCreature && !this.engine.selectedCreature.isDead()) {
      this.renderInspectorCard(ctx, 16, 48, Math.min(260, w - 32), 160);
    }

    ctx.restore();
  }

  renderTopRibbon(ctx, w) {
    ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(0, 0, w, 36);
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(w, 36);
    ctx.stroke();

    // Season badge
    const season = this.engine.currentSeason;
    ctx.font = 'bold 11px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = season.color;
    ctx.fillText(`🏛 ${season.latin.toUpperCase()} (${season.temp})`, 16, 22);

    // Species Census Badges
    const counts = this.engine.getCensus();
    ctx.font = '10px "JetBrains Mono", monospace';

    const badges = [
      { label: '🦌 Cervus', val: counts.cervus, color: '#d49b42' },
      { label: '🦁 Leo', val: counts.leo, color: '#ea580c' },
      { label: '🦅 Griffin', val: counts.griffin, color: '#eab308' },
      { label: '🐍 Basilisk', val: counts.basilisk, color: '#22c55e' },
      { label: '🦄 Monoceros', val: counts.monoceros, color: '#38bdf8' },
      { label: '🐘 Elephantus', val: counts.elephantus, color: '#94a3b8' },
      { label: '🌿 Flora', val: counts.flora, color: '#86efac' }
    ];

    let bx = 240;
    for (const b of badges) {
      if (bx + 85 > w - 10) break;
      ctx.fillStyle = b.color;
      ctx.fillText(`${b.label}: ${b.val}`, bx, 22);
      bx += 90;
    }
  }

  renderCitationScroll(ctx, x, y, cw, ch) {
    const citation = PLINIAN_CITATIONS[this.citationIndex];
    ctx.fillStyle = 'rgba(15, 20, 32, 0.9)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, cw, ch);
    ctx.strokeRect(x, y, cw, ch);

    ctx.font = 'bold 10px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`📜 C. PLINII NATURALIS HISTORIA — LIBER ${citation.book} (${citation.title})`, x + 8, y + 15);

    ctx.font = 'italic 9px "Georgia", serif';
    ctx.fillStyle = '#cbd5e1';
    this.wrapText(ctx, `"${citation.latin}"`, x + 8, y + 29, cw - 16, 11);

    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`— ${citation.english.slice(0, 105)}...`, x + 8, y + 58);
  }

  renderInspectorCard(ctx, x, y, cw, ch) {
    const c = this.engine.selectedCreature;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, cw, ch);
    ctx.strokeRect(x, y, cw, ch);

    ctx.font = 'bold 12px "Cinzel", serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${c.config.name} (${c.config.commonName})`, x + 10, y + 20);

    ctx.font = 'italic 9px serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(c.config.latin, x + 10, y + 34);

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`STATE: ${c.state.toUpperCase()}`, x + 10, y + 50);

    // Energy Bar
    ctx.fillStyle = '#64748b';
    ctx.fillText('ENERGY', x + 10, y + 68);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + 65, y + 60, 180, 8);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + 65, y + 60, clamp((c.energy / c.maxEnergy) * 180, 0, 180), 8);

    // Health Bar
    ctx.fillStyle = '#64748b';
    ctx.fillText('HEALTH', x + 10, y + 84);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + 65, y + 76, 180, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 65, y + 76, clamp((c.health / c.maxHealth) * 180, 0, 180), 8);

    // Telemetry stats
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Age: ${c.age.toFixed(1)}s / Lifespan: ${c.lifespan.toFixed(0)}s`, x + 10, y + 106);
    ctx.fillText(`Speed: ${c.vel.mag().toFixed(1)} px/s | Mass: ${c.dna.mass}`, x + 10, y + 120);
    ctx.fillText(`Repro Cooldown: ${c.reproductionCooldown.toFixed(1)}s`, x + 10, y + 134);
    ctx.fillText(c.paralyzeTimer > 0 ? 'STATUS: PETRIFIED BY BASILISK' : 'STATUS: SOUND', x + 10, y + 148);
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }
}

// ============================================================================
// XIX. DOM CONTROLS UI MANAGER (HEADLESS GUARDED)
// ============================================================================

export function setupDOMControls(engine) {
  if (!engine.controlsContainer || typeof document === 'undefined') return;

  engine.controlsContainer.innerHTML = `
    <div class="control-group">
      <label style="font-weight: bold; color: var(--accent-gold, #d4af37);">BESTIARIUM ROMANUM</label>
      <div style="font-size: 10px; color: #8c909e; margin-bottom: 8px;">Ecologia Pliniana — Naturalis Historia Liber VIII</div>
    </div>

    <div class="control-group">
      <label>Species Spawner Palette</label>
      <div class="control-btn-grid" id="bestia-palette">
        <button class="sub-btn active" data-species="cervus">🦌 Cervus</button>
        <button class="sub-btn" data-species="leo">🦁 Leo</button>
        <button class="sub-btn" data-species="griffin">🦅 Griffin</button>
        <button class="sub-btn" data-species="basilisk">🐍 Basilisk</button>
        <button class="sub-btn" data-species="monoceros">🦄 Monoceros</button>
        <button class="sub-btn" data-species="elephantus">🐘 Elephantus</button>
        <button class="sub-btn" data-species="flora">🌿 Ambrosia</button>
      </div>
    </div>

    <div class="control-group">
      <label>Simulation Speed: <span id="sim-speed-val">${engine.simSpeed.toFixed(1)}x</span></label>
      <input type="range" id="sim-speed-slider" min="0.2" max="3.0" step="0.1" value="${engine.simSpeed}">
    </div>

    <div class="control-group">
      <label>Flora Regrowth Rate: <span id="flora-val">${engine.floraRegrowthMultiplier.toFixed(1)}</span></label>
      <input type="range" id="flora-slider" min="0.2" max="3.0" step="0.1" value="${engine.floraRegrowthMultiplier}">
    </div>

    <div class="control-group">
      <label>Predator Ferocity: <span id="ferocity-val">${engine.predatorFerocity.toFixed(1)}</span></label>
      <input type="range" id="ferocity-slider" min="0.5" max="2.5" step="0.1" value="${engine.predatorFerocity}">
    </div>

    <div class="control-group">
      <label>Ecosystem Presets</label>
      <div class="control-btn-grid">
        <button class="sub-btn" id="preset-wilderness">Plinian Wilderness</button>
        <button class="sub-btn" id="preset-pride">Pride of Nemea</button>
        <button class="sub-btn" id="preset-mythic">Mythic Clash</button>
        <button class="sub-btn" id="preset-migration">Great Migration</button>
      </div>
    </div>

    <div class="control-group">
      <div class="control-btn-grid">
        <button class="sub-btn" id="btn-bloom" style="color: #4ade80;">🌸 Spring Bloom</button>
        <button class="sub-btn" id="btn-drought" style="color: #f87171;">☀️ Drought Event</button>
        <button class="sub-btn" id="btn-clear-corpse">💀 Clear Carcasses</button>
        <button class="sub-btn" id="btn-reset-all" style="border-color: #d4af37;">🔄 Reset Realm</button>
      </div>
    </div>
  `;

  // Bind Palette buttons
  engine.controlsContainer.querySelectorAll('#bestia-palette .sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      engine.controlsContainer.querySelectorAll('#bestia-palette .sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.spawnMode = btn.dataset.species;
    });
  });

  // Bind Sliders
  const speedSlider = engine.controlsContainer.querySelector('#sim-speed-slider');
  const speedVal = engine.controlsContainer.querySelector('#sim-speed-val');
  if (speedSlider) {
    speedSlider.addEventListener('input', e => {
      engine.simSpeed = parseFloat(e.target.value);
      if (speedVal) speedVal.textContent = `${engine.simSpeed.toFixed(1)}x`;
    });
  }

  const floraSlider = engine.controlsContainer.querySelector('#flora-slider');
  const floraVal = engine.controlsContainer.querySelector('#flora-val');
  if (floraSlider) {
    floraSlider.addEventListener('input', e => {
      engine.floraRegrowthMultiplier = parseFloat(e.target.value);
      if (floraVal) floraVal.textContent = engine.floraRegrowthMultiplier.toFixed(1);
    });
  }

  const ferocitySlider = engine.controlsContainer.querySelector('#ferocity-slider');
  const ferocityVal = engine.controlsContainer.querySelector('#ferocity-val');
  if (ferocitySlider) {
    ferocitySlider.addEventListener('input', e => {
      engine.predatorFerocity = parseFloat(e.target.value);
      if (ferocityVal) ferocityVal.textContent = engine.predatorFerocity.toFixed(1);
    });
  }

  // Bind Presets
  const bindPreset = (id, mode) => {
    const el = engine.controlsContainer.querySelector(id);
    if (el) el.addEventListener('click', () => engine.seedEcosystem(mode));
  };
  bindPreset('#preset-wilderness', 'wilderness');
  bindPreset('#preset-pride', 'pride');
  bindPreset('#preset-mythic', 'mythic');
  bindPreset('#preset-migration', 'migration');

  // Bind Action Buttons
  const bloomBtn = engine.controlsContainer.querySelector('#btn-bloom');
  if (bloomBtn) {
    bloomBtn.addEventListener('click', () => engine.triggerSpringBloom());
  }

  const droughtBtn = engine.controlsContainer.querySelector('#btn-drought');
  if (droughtBtn) {
    droughtBtn.addEventListener('click', () => engine.triggerDroughtEvent());
  }

  const clearCorpseBtn = engine.controlsContainer.querySelector('#btn-clear-corpse');
  if (clearCorpseBtn) {
    clearCorpseBtn.addEventListener('click', () => {
      engine.carcasses = [];
    });
  }

  const resetBtn = engine.controlsContainer.querySelector('#btn-reset-all');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => engine.reset());
  }
}

// ============================================================================
// XX. MONUMENTAL MAIN ENGINE: BESTIARIUM ENGINE
// ============================================================================

export class BestiariumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 1200;
    this.height = canvas.height || 800;
    this.dpr = 1;

    // Simulation Entities
    this.creatures = [];
    this.flora = [];
    this.carcasses = [];
    this.shockwaves = [];
    this.particles = [];
    this.ponds = [];
    this.grassTufts = [];
    this.rocks = [];
    this.nest = null;
    this.spatialHash = new SpatialHash(120);

    // Interactive & Selection State
    this.spawnMode = 'cervus'; // cervus, leo, griffin, basilisk, monoceros, elephantus, flora
    this.selectedCreature = null;
    this.simSpeed = 1.0;
    this.ecosystemBalance = 1.0;
    this.floraRegrowthMultiplier = 1.0;
    this.predatorFerocity = 1.0;
    this.sensoryRangeMultiplier = 1.0;

    // Seasons & Environmental Climate
    this.seasonIndex = 0;
    this.seasonTimer = 0;
    this.seasonDuration = 45.0; // 45 seconds per season
    this.currentSeason = SEASONS[0];
    this.windAngle = Math.PI * 0.25;
    this.windForce = 1.0;
    this.windTime = 0;

    // Subsystems
    this.scentGrid = new ScentGrid(this.width, this.height, 24);
    this.lotkaVolterra = new LotkaVolterraTracker();
    this.hud = new BestiariumHUD(this);

    this.initPondsAndTerrain();
    setupDOMControls(this);
    this.seedEcosystem('wilderness');
    attachTouchBridge(this, canvas);
  }

  initPondsAndTerrain() {
    this.ponds = [
      new WaterPond(this.width * 0.28, this.height * 0.4, 110, 75, 0.2),
      new WaterPond(this.width * 0.72, this.height * 0.65, 130, 85, -0.3)
    ];

    this.nest = new GriffinNest(this.width * 0.85, this.height * 0.22);

    this.rocks = [
      new RockCrag(this.width * 0.86, this.height * 0.24, 38),
      new RockCrag(this.width * 0.15, this.height * 0.78, 28),
      new RockCrag(this.width * 0.52, this.height * 0.18, 22)
    ];

    this.grassTufts = [];
    const tuftCount = Math.max(20, Math.floor((this.width * this.height) / 11000));
    for (let i = 0; i < tuftCount; i++) {
      this.grassTufts.push(new GrassTuft(Math.random() * this.width, Math.random() * this.height, 5));
    }
  }

  resize(width, height, dpr = 1) {
    this.width = Math.max(100, width);
    this.height = Math.max(100, height);
    this.dpr = dpr || 1;
    this.scentGrid.resize(this.width, this.height);
    this.initPondsAndTerrain();
  }

  seedEcosystem(preset = 'wilderness') {
    this.creatures = [];
    this.flora = [];
    this.carcasses = [];
    this.shockwaves = [];
    this.particles = [];
    this.scentGrid.clear();
    this.selectedCreature = null;

    const w = this.width;
    const h = this.height;

    // Seed Flora
    const floraCount = preset === 'migration' ? 140 : 100;
    for (let i = 0; i < floraCount; i++) {
      const type = Math.random() < 0.15 ? 'ambrosia' : 'silphium';
      this.flora.push(new FloraCluster(Math.random() * w, Math.random() * h, type));
    }

    if (preset === 'pride') {
      // High predator pride scenario
      for (let i = 0; i < 40; i++) this.spawnCreature('cervus', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 14; i++) this.spawnCreature('leo', Math.random() * w, Math.random() * h);
      this.spawnCreature('elephantus', w * 0.5, h * 0.5);
    } else if (preset === 'mythic') {
      // Clash of Mythic Beasts
      for (let i = 0; i < 25; i++) this.spawnCreature('cervus', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 4; i++) this.spawnCreature('griffin', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 4; i++) this.spawnCreature('basilisk', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 3; i++) this.spawnCreature('monoceros', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 2; i++) this.spawnCreature('elephantus', Math.random() * w, Math.random() * h);
    } else if (preset === 'migration') {
      // Vast Cervus & Elephantus Herds
      for (let i = 0; i < 75; i++) this.spawnCreature('cervus', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 6; i++) this.spawnCreature('elephantus', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 5; i++) this.spawnCreature('leo', Math.random() * w, Math.random() * h);
    } else {
      // Plinian Wilderness (Standard Balanced Reserve)
      for (let i = 0; i < 50; i++) this.spawnCreature('cervus', Math.random() * w, Math.random() * h);
      for (let i = 0; i < 6; i++) this.spawnCreature('leo', Math.random() * w, Math.random() * h);
      this.spawnCreature('griffin', w * 0.8, h * 0.3);
      this.spawnCreature('basilisk', w * 0.2, h * 0.7);
      this.spawnCreature('monoceros', w * 0.5, h * 0.4);
      this.spawnCreature('elephantus', w * 0.3, h * 0.6);
      this.spawnCreature('elephantus', w * 0.35, h * 0.65);
    }
  }

  spawnCreature(speciesKey, x, y, dna = null) {
    const px = clamp(x, 40, this.width - 40);
    const py = clamp(y, 40, this.height - 40);

    let creature = null;
    if (speciesKey === 'cervus') creature = new Cervus(px, py, dna);
    else if (speciesKey === 'leo') creature = new Leo(px, py, dna);
    else if (speciesKey === 'griffin') creature = new Griffin(px, py, dna);
    else if (speciesKey === 'basilisk') creature = new Basilisk(px, py, dna);
    else if (speciesKey === 'monoceros') creature = new Monoceros(px, py, dna);
    else if (speciesKey === 'elephantus') creature = new Elephantus(px, py, dna);

    if (creature) {
      this.creatures.push(creature);
    }
    return creature;
  }

  spawnFlora(x, y, isAmbrosia = false) {
    const px = clamp(x, 20, this.width - 20);
    const py = clamp(y, 20, this.height - 20);
    this.flora.push(new FloraCluster(px, py, isAmbrosia ? 'ambrosia' : 'silphium'));
  }

  spawnCarcass(speciesKey, x, y, biomass) {
    if (this.carcasses.length > 40) this.carcasses.shift();
    this.carcasses.push(new Carcass(speciesKey, x, y, biomass));
  }

  spawnShockwave(x, y, maxRadius) {
    this.shockwaves.push(new AcousticShockwave(x, y, maxRadius));
  }

  spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 70;
      this.particles.push(
        new Particle(
          x,
          y,
          Math.cos(ang) * spd,
          Math.sin(ang) * spd,
          color,
          0.6 + Math.random() * 0.5,
          2.5 + Math.random() * 2
        )
      );
    }
  }

  triggerSpringBloom() {
    for (let i = 0; i < 45; i++) {
      this.spawnFlora(Math.random() * this.width, Math.random() * this.height, Math.random() < 0.4);
    }
    this.seasonIndex = 0; // Ver (Spring)
    this.currentSeason = SEASONS[0];
  }

  triggerDroughtEvent() {
    this.seasonIndex = 1; // Aestas (Summer Drought)
    this.currentSeason = SEASONS[1];
    for (const f of this.flora) {
      f.biomass *= 0.45;
    }
  }

  update(dt) {
    const effectiveDt = Math.min(0.05, dt) * this.simSpeed;

    // 1. Environmental Weather & Seasons
    this.windTime += effectiveDt;
    this.windAngle = Math.PI * 0.25 + Math.sin(this.windTime * 0.3) * 0.35;
    this.seasonTimer += effectiveDt;
    if (this.seasonTimer >= this.seasonDuration) {
      this.seasonTimer = 0;
      this.seasonIndex = (this.seasonIndex + 1) % SEASONS.length;
      this.currentSeason = SEASONS[this.seasonIndex];
    }

    // 2. Terrain & Ponds
    for (const p of this.ponds) {
      p.update(effectiveDt);
    }

    // 3. Scent Diffusion Grid
    this.scentGrid.update(effectiveDt);

    // 4. Flora Simulation & Ambient Regrowth
    const seasonGrowth = this.currentSeason.floraGrowth * this.floraRegrowthMultiplier;
    for (let i = this.flora.length - 1; i >= 0; i--) {
      const f = this.flora[i];
      f.update(effectiveDt, seasonGrowth);
    }

    // Ambient flora sprouting if count is low
    if (this.flora.length < 130 && Math.random() < 0.25 * seasonGrowth) {
      this.spawnFlora(Math.random() * this.width, Math.random() * this.height, Math.random() < 0.1);
    }

    // 5. Carcasses & Decomposition
    for (let i = this.carcasses.length - 1; i >= 0; i--) {
      const c = this.carcasses[i];
      c.update(effectiveDt, this.scentGrid);
      if (c.isFullyDecomposed()) {
        // Soil enrichment: sprout new flora where carcass decomposed
        this.spawnFlora(c.x, c.y, true);
        this.carcasses.splice(i, 1);
      }
    }

    // 6. Griffin Golden Nest
    if (this.nest) {
      this.nest.update(effectiveDt);
    }

    // 7. Acoustic Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(effectiveDt);
      if (sw.isFinished()) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 8. Dynamic Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(effectiveDt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 9. Creature AI & Metabolic Simulation
    const survivingCreatures = [];
    const births = [];

    this.spatialHash.clear();
    for (const c of this.creatures) this.spatialHash.insert(c);

    const ecosystemContext = {
      width: this.width,
      height: this.height,
      creatures: this.creatures,
      flora: this.flora,
      carcasses: this.carcasses,
      scentGrid: this.scentGrid,
      ponds: this.ponds,
      nest: this.nest,
      spatialHash: this.spatialHash,
      spawnParticles: (x, y, n, col) => this.spawnParticles(x, y, n, col),
      spawnCarcass: (sp, x, y, bio) => this.spawnCarcass(sp, x, y, bio),
      spawnShockwave: (x, y, r) => this.spawnShockwave(x, y, r)
    };

    for (const c of this.creatures) {
      c.update(effectiveDt, ecosystemContext);

      // Starvation or Mortality Check
      if (c.isDead()) {
        this.spawnCarcass(c.speciesKey, c.pos.x, c.pos.y, c.dna.size * 5);
        this.spawnParticles(c.pos.x, c.pos.y, 6, '#cbd5e1');
        continue;
      }

      // Reproduction check
      if (c.canReproduce() && this.creatures.length < 240) {
        c.energy -= c.config.reproCost;
        c.reproductionCooldown = c.config.reproCooldown;

        // DNA mutation
        const mutatedDna = {
          speed: clamp(c.dna.speed + (Math.random() - 0.5) * 8, 50, 320),
          sprintSpeed: clamp(c.dna.sprintSpeed + (Math.random() - 0.5) * 12, 80, 400),
          perceptionRadius: clamp(c.dna.perceptionRadius + (Math.random() - 0.5) * 10, 80, 350),
          size: c.dna.size,
          mass: c.dna.mass,
          metabolism: c.dna.metabolism
        };

        births.push({
          species: c.speciesKey,
          x: c.pos.x + (Math.random() - 0.5) * 20,
          y: c.pos.y + (Math.random() - 0.5) * 20,
          dna: mutatedDna
        });
      }

      survivingCreatures.push(c);
    }

    this.creatures = survivingCreatures;
    for (const b of births) {
      this.spawnCreature(b.species, b.x, b.y, b.dna);
    }

    // 10. Population Telemetry & Lotka-Volterra Sampling
    const census = this.getCensus();
    const preyCount = census.cervus + census.monoceros + census.elephantus;
    const predCount = census.leo + census.griffin + census.basilisk;
    this.lotkaVolterra.update(effectiveDt, preyCount, predCount);

    // 11. HUD updates
    this.hud.update(effectiveDt);
  }

  render(ctx) {
    // 1. Parchment & Mosaic Tessellation Background
    renderParchmentBackground(ctx, this.width, this.height);

    // 2. Water Ponds
    for (const pond of this.ponds) {
      pond.render(ctx);
    }

    // 3. Rock Crags
    for (const rock of this.rocks) {
      rock.render(ctx);
    }

    // 4. Waving Grass Tufts
    for (const tuft of this.grassTufts) {
      tuft.render(ctx, this.windTime, this.windAngle, this.windForce);
    }

    // 5. Griffin Golden Nest
    if (this.nest) {
      this.nest.render(ctx);
    }

    // 6. Flora Clusters
    for (const f of this.flora) {
      f.render(ctx);
    }

    // 7. Carcasses
    for (const carcass of this.carcasses) {
      carcass.render(ctx);
    }

    // 8. Creature Entities
    for (const creature of this.creatures) {
      creature.render(ctx);
    }

    // 9. Selection Laurels
    if (this.selectedCreature && !this.selectedCreature.isDead()) {
      renderSelectionLaurel(ctx, this.selectedCreature);
    }

    // 10. Acoustic Shockwaves & Particle VFX
    for (const sw of this.shockwaves) {
      sw.render(ctx);
    }
    for (const p of this.particles) {
      p.render(ctx);
    }

    // 11. HUD Overlays (Census Ribbon, Lotka-Volterra Graph, Citation Scroll, Inspector)
    this.hud.render(ctx);
  }

  getCensus() {
    const counts = {
      cervus: 0,
      leo: 0,
      griffin: 0,
      basilisk: 0,
      monoceros: 0,
      elephantus: 0,
      flora: this.flora.length,
      carcasses: this.carcasses.length
    };

    for (const c of this.creatures) {
      if (counts[c.speciesKey] !== undefined) {
        counts[c.speciesKey]++;
      }
    }

    return counts;
  }

  getEntityCount() {
    return this.creatures.length + this.flora.length + this.carcasses.length;
  }

  onMouseDown(pos) {
    if (!pos) return;
    const px = Number.isFinite(pos.x) ? pos.x : this.width * 0.5;
    const py = Number.isFinite(pos.y) ? pos.y : this.height * 0.5;

    // Check if clicking on an existing creature to select it
    let clickedCreature = null;
    for (const c of this.creatures) {
      if (c.pos.dist(new Vec2(px, py)) < c.dna.size * 2.5 + 8) {
        clickedCreature = c;
        break;
      }
    }

    if (clickedCreature) {
      this.selectedCreature = clickedCreature;
      return;
    }

    // Otherwise spawn based on spawnMode
    if (this.spawnMode === 'flora') {
      for (let i = 0; i < 4; i++) {
        this.spawnFlora(px + (Math.random() - 0.5) * 35, py + (Math.random() - 0.5) * 35, Math.random() < 0.35);
      }
    } else {
      const created = this.spawnCreature(this.spawnMode, px, py);
      this.selectedCreature = created;
    }
  }

  onMouseMove(pos) {
    // Retained for interactive cursor telemetry
  }

  onMouseUp(pos) {
    // Retained for mouse drag operations
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Space') {
      this.simSpeed = this.simSpeed > 0 ? 0 : 1.0;
    } else if (key === 'r' || key === 'R') {
      this.reset();
    } else if (key === '1') this.spawnMode = 'cervus';
    else if (key === '2') this.spawnMode = 'leo';
    else if (key === '3') this.spawnMode = 'griffin';
    else if (key === '4') this.spawnMode = 'basilisk';
    else if (key === '5') this.spawnMode = 'monoceros';
    else if (key === '6') this.spawnMode = 'elephantus';
    else if (key === '7') this.spawnMode = 'flora';
    else if (key === 'Escape') this.selectedCreature = null;
  }

  onKeyUp(key, e) {
    // Retained for hotkey management
  }

  reset() {
    this.seedEcosystem('wilderness');
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.creatures = [];
    this.flora = [];
    this.carcasses = [];
    this.shockwaves = [];
    this.particles = [];
    this.selectedCreature = null;
  }
}
