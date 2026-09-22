/**
 * Pliny Game Lab — Mechanica (Ancient Mechanical Engineering & Automata)
 * Pavilion III: Machina & Opus Caementicium
 *
 * "Machina est continens e materia coniunctio maximas ad onerum motus habens virtutes.
 *  Ea movetur ex arte circulorum rotundationibus, quam Graeci kykliken kinesin appellant...
 *  Omnis autem ratio machinarum oritur ex natura, et magistro atque auctore mundi cursu instituta est."
 *  — Vitruvius Pollio, De Architectura, Liber X.i
 *
 * Monumental Hellenistic & Roman mechanical engineering laboratory simulating:
 *  1. Polyspaston Crane (Vitruvius X.2):
 *     Authentic Roman compound pulley derrick with compound sheaves (trispastos MA=2,
 *     pentaspastos MA=4, polyspaston MA=8), winch drum (ergates / sucula), tension-stressed
 *     guy ropes (antetoni/retenti), and carved Corinthian stone capital load block.
 *  2. Hero's Aeolipile (Pneumatica 50):
 *     Hollow copper sphere pivoted on hollow trunnions above an incandescent charcoal brazier,
 *     producing reaction torque (tau = r x F), angular momentum, boiling thermodynamics,
 *     and whirling tangential steam plumes with RPM tachometer.
 *  3. Archimedean Hydrostatic Screw (Cochlea, Vitruvius X.6):
 *     Inclined timber auger barrel at Pythagorean 3-4-5 angle (36.87 deg) with helical wooden blades,
 *     lifting hydrostatic water droplets uphill from a lower sump basin into an elevated aqueduct flume.
 *  4. Heron's Temple Door Automation (Pneumatica 38):
 *     Subterranean thermal siphon system: altar fire expands air inside an airtight copper globe,
 *     displacing water into a suspended counterweight bucket that rotates vertical door spindles
 *     to swing monumental temple sanctuary doors open automatically; cooling reverses the cycle.
 *  5. Vitruvian Gear Train & Pile-Driver Truss (Vitruvius X.1 & X.5):
 *     Multi-stage reduction gear train (64:1 mechanical advantage) with cycloidal bronze teeth,
 *     driving an ancient pile-driver rhamnus / catapult winch atop a braced King-post timber truss.
 *
 * Physical & Visual Specifications:
 *  - Verlet particle integration with distance constraints and shear/fracture limits.
 *  - Dynamic stress tensor calculation: sigma = F / A, color-coded Cyan -> Gold -> Orange -> Red fracture.
 *  - Interactive severing / cutting cross-section slicing through ropes and cables.
 *  - Rotational dynamics: Inertia (I = 1/2 m r^2), angular velocity, drag, reaction torque.
 *  - Classical Blueprint drawing aesthetic (#0c1017 deep slate, #D4AF37 brass, #8B5A2B oak).
 *  - Complete Canvas HUD: MA ratio, Peak Stress meter, RPM gauge, historical Vitruvian citations.
 *  - Pure ES Module, zero external dependencies, safe headless execution guard.
 */

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

// ============================================================================
// MATERIAL SCIENCE OF ANTIQUITY & HISTORICAL TABLES
// ============================================================================

/**
 * Mechanical and physical properties of authentic Roman engineering materials
 * compiled from Vitruvius (De Architectura II & X) and modern archaeo-engineering data.
 */
export const ROMAN_MATERIAL_PROPERTIES = {
  quercus: {
    latin: 'Quercus (Roman Sessile Oak)',
    densityKgM3: 740,
    youngsModulusGPa: 11.5,
    yieldTensileStrengthMPa: 42.0,
    yieldCompressiveStrengthMPa: 48.0,
    shearStrengthMPa: 9.5,
    poissonRatio: 0.32,
    color: '#8B5A2B',
    usage: 'Derrick legs (tigna), winch drums (suculae), gear wheels (tympana), and auger staves'
  },
  pinus: {
    latin: 'Pinus Sylvestris (Scots / Mediterranean Pine)',
    densityKgM3: 510,
    youngsModulusGPa: 9.0,
    yieldTensileStrengthMPa: 34.0,
    yieldCompressiveStrengthMPa: 38.0,
    shearStrengthMPa: 6.8,
    poissonRatio: 0.35,
    color: '#A06E3B',
    usage: 'Cross-bracing spars, water flumes, and scaffolding struts'
  },
  aes: {
    latin: 'Aes / Aurichalcum (Classical Leaded Bronze & Brass)',
    densityKgM3: 8750,
    youngsModulusGPa: 105.0,
    yieldTensileStrengthMPa: 240.0,
    yieldCompressiveStrengthMPa: 310.0,
    shearStrengthMPa: 180.0,
    poissonRatio: 0.34,
    color: '#D4AF37',
    usage: 'Compound pulley sheaves (orbiculi), gear teeth (dentes), bushings (fistulae), and steam globes'
  },
  ferrum: {
    latin: 'Ferrum (Smelted Roman Wrought Iron)',
    densityKgM3: 7850,
    youngsModulusGPa: 195.0,
    yieldTensileStrengthMPa: 220.0,
    yieldCompressiveStrengthMPa: 240.0,
    shearStrengthMPa: 140.0,
    poissonRatio: 0.28,
    color: '#708090',
    usage: 'Lifting Lewis clamps (forfices), axle pivots, barrel hoops, and pile-driver shoe caps'
  },
  marmor: {
    latin: 'Marmor Lunense / Lapis Tiburtinus (Travertine & Carrara Marble)',
    densityKgM3: 2680,
    youngsModulusGPa: 52.0,
    yieldTensileStrengthMPa: 6.5,
    yieldCompressiveStrengthMPa: 82.0,
    shearStrengthMPa: 11.0,
    poissonRatio: 0.25,
    color: '#EAE6DF',
    usage: 'Carved Corinthian capitals, architraves, temple plinths, and counterweight blocks'
  },
  spartum: {
    latin: 'Spartum / Cannabis (Spanish Broom & Twisted Hemp Cordage)',
    densityKgM3: 1300,
    youngsModulusGPa: 1.6,
    yieldTensileStrengthMPa: 320.0,
    yieldCompressiveStrengthMPa: 0.0, // Ropes cannot support compression
    shearStrengthMPa: 45.0,
    poissonRatio: 0.40,
    color: '#00F0FF', // Cyan tension vector in engineering view
    usage: 'Hoist tackle falls (ductarii), guy cables (antetoni/retenti), and driving loops'
  },
  plumbum: {
    latin: 'Plumbum (Cast Roman Lead)',
    densityKgM3: 11340,
    youngsModulusGPa: 16.0,
    yieldTensileStrengthMPa: 18.0,
    yieldCompressiveStrengthMPa: 25.0,
    shearStrengthMPa: 12.0,
    poissonRatio: 0.44,
    color: '#546E7A',
    usage: 'Subterranean door counterpoises (pondera) and anchor weights'
  }
};

/**
 * The Five Simple Machines of Antiquity (Quinque Vires Mechanicae)
 * Systematized by Heron of Alexandria in his Mechanica (c. 62 AD) and Pappus of Alexandria.
 */
export const QUINQUE_VIRES_TABLE = [
  {
    name: 'Vectis (The Lever)',
    greek: 'Mochlos (Μοχλός)',
    law: 'F1 * d1 = F2 * d2 (Law of the Balance - Archimedes)',
    maFormula: 'd_effort / d_load',
    vitruvianRef: 'De Arch. X.3'
  },
  {
    name: 'Axis in Peritrochio (Wheel & Axle / Winch Drum)',
    greek: 'Axon en peristropho (Ἄξων ἐν περιστροφῷ)',
    law: 'Torque equilibrium: F_crank * R_crank = F_load * r_drum',
    maFormula: 'R_crank / r_drum',
    vitruvianRef: 'De Arch. X.2 (Sucula & Ergates)'
  },
  {
    name: 'Trochlea / Polyspaston (Compound Pulley Tackle)',
    greek: 'Trochilia / Polyspaston (Πολύσπαστον)',
    law: 'Force reduction via n supporting rope strands: F = W / n',
    maFormula: 'Number of rope falls (n = 2, 4, 8)',
    vitruvianRef: 'De Arch. X.2'
  },
  {
    name: 'Cuneus (The Wedge / Inclined Plane)',
    greek: 'Sphen (Σφήν)',
    law: 'Normal force multiplication: F_split = F_drive / (2 * tan(theta))',
    maFormula: 'Length / Thickness (L / t)',
    vitruvianRef: 'De Arch. X.5'
  },
  {
    name: 'Cochlea (The Endless Screw / Helix)',
    greek: 'Kochlias (Κοχλίας)',
    law: 'Torque to axial thrust: F_thrust = 2 * pi * r * F_effort / pitch',
    maFormula: '2 * pi * r / lead',
    vitruvianRef: 'De Arch. X.6'
  }
];

/**
 * Authentic textual citations from Vitruvius Pollio and Heron of Alexandria.
 */
export const MECHANICA_SCHOLIA = {
  polyspaston: {
    title: 'POLYSPOSTON ROMAN CRANE (Vitruvius, De Arch. X.2)',
    latin: 'In his autem machinis omnibus continentur virtutes trium generum: ex his unum est kylon, alterum amphikylon, tertium perikylon... Cum vero plures habent orbiculi, polyspaston dicitur.',
    english: 'In all these hoisting machines are principles of three kinds: the balance, the lever, and compound pulleys. When the tackle has many sheaves, it is called a Polyspaston, granting immense mechanical force.',
    historicalNotes: 'Operated by sucula winches with handspikes or giant human treadwheels (majus tympanum) capable of hoisting monolithic travertine blocks up to 50 metric tons.',
    nominalMA: 8,
    vitruvianBook: 'Liber X, Caput II'
  },
  aeolipile: {
    title: "HERO'S STEAM TURBINE (Heron, Pneumatica 50)",
    latin: 'Sphaira in lebetem imposita per fistulas duas incurvatas vaporem emittit, et circumvolvitur continuo.',
    english: 'A cauldron having a sphere placed upon it: fire being kindled under the cauldron, steam enters the sphere through the pivot tubes and rushes out through bent pipes, rotating it continually.',
    historicalNotes: 'The earliest recorded steam reaction turbine in world history. The reaction torque (tau = r x F) anticipated Isaac Newton\'s Third Law of Motion by seventeen centuries.',
    nominalMA: 1,
    vitruvianBook: 'Pneumatica, Theorema L'
  },
  cochlea: {
    title: 'ARCHIMEDEAN WATER SCREW (Vitruvius, De Arch. X.6)',
    latin: 'Est autem cochleae ratio, quae magna vi aquam haurit, sed non tam alte extollit quam rota... Inclinatio autem eius constituatur ad formam trianguli pythagorici.',
    english: 'The screw raises a great volume of water, though not to so great a height as a wheel. Its inclination must be fixed to the slope of a right-angled Pythagorean triangle of 3, 4, and 5 parts.',
    historicalNotes: 'Crucial for draining silver and gold mines in Roman Hispania and lifting irrigation water from the Nile into Roman canal networks and municipal aqueducts.',
    nominalMA: 4,
    vitruvianBook: 'Liber X, Caput VI'
  },
  templeDoors: {
    title: "HERON'S SANCTUARY AUTOMATA (Heron, Pneumatica 38)",
    latin: 'Altare cum igne accenditur, valvae templi sua sponte aperiuntur; extincto autem igne, iterum clauduntur.',
    english: 'When a fire is kindled upon the altar, the doors of the temple open of their own accord; and when the fire is extinguished, they close again automatically through subterranean siphons.',
    historicalNotes: 'Employed subterranean pneumatics and the thermal expansion of air to astound temple worshipers in Roman Alexandria, showcasing invisible hydraulic power governed by divine geometry.',
    nominalMA: 6,
    vitruvianBook: 'Pneumatica, Theorema XXXVIII'
  },
  gearTrain: {
    title: 'VITRUVIAN GEAR TRAIN & TRUSS (Vitruvius, De Arch. X.1 & X.5)',
    latin: 'Dentes tympanorum inter se congruentes motus transmittunt et vires ad multiplicandum pondus adiuvant.',
    english: 'Teeth of toothed wheels meshing together transmit motion from axle to axle, multiplying human effort to elevate crushing loads or draw torsion catapult ropes.',
    historicalNotes: 'Spur gear reduction systems driven by pinions and lantern gears were foundational to Roman watermills (Venafro, Barbegal), crane capstans, and odometer mechanisms.',
    nominalMA: 16,
    vitruvianBook: 'Liber X, Caput I & V'
  }
};


// ============================================================================
// 2D VECTOR MATHEMATICS & COMPUTATIONAL GEOMETRY SOLVERS
// ============================================================================

export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
  }

  set(x, y) {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len > 1e-7) {
      this.x /= len;
      this.y /= len;
    } else {
      this.x = 0;
      this.y = 0;
    }
    return this;
  }

  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dist(v) {
    return Math.sqrt(this.distSq(v));
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  rotate(radians) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const rx = this.x * cos - this.y * sin;
    const ry = this.x * sin + this.y * cos;
    this.x = rx;
    this.y = ry;
    return this;
  }

  lerp(v, alpha) {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    return this;
  }

  perpendicular() {
    const temp = this.x;
    this.x = -this.y;
    this.y = temp;
    return this;
  }

  project(v) {
    const d = v.dot(v);
    if (d < 1e-7) return this.set(0, 0);
    const scale = this.dot(v) / d;
    return this.set(v.x * scale, v.y * scale);
  }
}

/**
 * Line segment intersection test for slicing / severing mechanical constraints.
 * Returns true if segment (p1 -> p2) strictly crosses segment (q1 -> q2).
 */
export function testSegmentIntersection(p1, p2, q1, q2) {
  const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  return (
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) &&
    ccw(p1, p2, q1) !== ccw(p1, p2, q2)
  );
}

/**
 * Computes shortest Euclidean distance from point P to line segment AB.
 */
export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) {
    const rx = px - ax;
    const ry = py - ay;
    return Math.sqrt(rx * rx + ry * ry);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const rx = px - projX;
  const ry = py - projY;
  return Math.sqrt(rx * rx + ry * ry);
}

/**
 * Point-in-polygon containment test using Jordan curve raycasting.
 */
export function pointInPolygon(px, py, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Computes the catenary sag curve points for a slack cable suspended between p1 and p2.
 */
export function computeCatenaryPoints(p1, p2, restLength, segments = 12) {
  const points = [];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chordDist = Math.hypot(dx, dy);

  // If taut or stretched, return direct straight line
  if (chordDist >= restLength || chordDist < 1e-4) {
    points.push({ x: p1.x, y: p1.y });
    points.push({ x: p2.x, y: p2.y });
    return points;
  }

  // Parabolic approximation of catenary sag: y = 4 * sag * (x / L) * (1 - x / L)
  const slack = restLength - chordDist;
  const maxSag = Math.min(chordDist * 0.45, Math.sqrt(Math.max(0, (3 * chordDist * slack) / 8)));

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lx = p1.x + dx * t;
    const ly = p1.y + dy * t;
    const sag = 4.0 * maxSag * t * (1.0 - t);
    points.push({ x: lx, y: ly + sag });
  }

  return points;
}


// ============================================================================
// VERLET PARTICLE PHYSICS SYSTEM
// ============================================================================

export class VerletParticle {
  constructor(x, y, options = {}) {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
    this.oldX = options.oldX !== undefined ? Number(options.oldX) : this.x;
    this.oldY = options.oldY !== undefined ? Number(options.oldY) : this.y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.mass = options.mass !== undefined ? Math.max(0.01, Number(options.mass)) : 1.0;
    this.invMass = options.pinned ? 0.0 : (this.mass > 0 ? 1.0 / this.mass : 0.0);
    this.pinned = !!options.pinned;
    this.radius = options.radius !== undefined ? Math.max(1.0, Number(options.radius)) : 4.0;
    this.friction = options.friction !== undefined ? Number(options.friction) : 0.99;
    this.restitution = options.restitution !== undefined ? Number(options.restitution) : 0.45;
    this.color = options.color || '#D4AF37';
    this.tag = options.tag || 'particle'; // 'stone', 'sheave_hub', 'counterweight', 'footing', 'winch'
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.stress = 0;
    this.carvedStone = !!options.carvedStone;
    this.stoneWidth = options.stoneWidth || 80;
    this.stoneHeight = options.stoneHeight || 50;
    this.metadata = options.metadata || {};
  }

  pin() {
    this.pinned = true;
    this.invMass = 0.0;
  }

  unpin() {
    this.pinned = false;
    this.invMass = this.mass > 0 ? 1.0 / this.mass : 1.0;
  }

  applyForce(fx, fy) {
    if (this.pinned) return;
    this.ax += fx * this.invMass;
    this.ay += fy * this.invMass;
  }

  integrate(dt, gravityX, gravityY, damping) {
    if (this.pinned) return;

    // Frame-rate-independent damping: convert per-frame factor to continuous decay
    const dtDamping = Math.pow(damping, dt * 60);
    this.vx = (this.x - this.oldX) * dtDamping;
    this.vy = (this.y - this.oldY) * dtDamping;

    this.oldX = this.x;
    this.oldY = this.y;

    const totalAx = gravityX + this.ax;
    const totalAy = gravityY + this.ay;

    const dtSq = dt * dt;
    this.x += this.vx + totalAx * dtSq;
    this.y += this.vy + totalAy * dtSq;

    this.ax = 0;
    this.ay = 0;
  }

  constrainBounds(width, height, floorMargin = 60) {
    if (this.pinned) return;

    const floorY = height - floorMargin;

    // Floor collision with Roman pavement friction
    if (this.y + this.radius > floorY) {
      this.y = floorY - this.radius;
      const vy = (this.y - this.oldY) * this.friction;
      this.oldY = this.y + vy * this.restitution;
      // Lateral friction
      const vx = (this.x - this.oldX) * 0.82;
      this.oldX = this.x - vx;
    }

    // Left and right arena walls
    const minX = 24 + this.radius;
    const maxX = width - 24 - this.radius;

    if (this.x < minX) {
      this.x = minX;
      this.oldX = this.x;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.oldX = this.x;
    }
  }

  resolveCollisionWith(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dist = Math.hypot(dx, dy);
    const minDist = this.radius + other.radius;

    if (dist < minDist && dist > 1e-6) {
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      const totalInv = this.invMass + other.invMass;
      if (totalInv <= 1e-9) return;

      if (!this.pinned) {
        this.x -= nx * overlap * (this.invMass / totalInv);
        this.y -= ny * overlap * (this.invMass / totalInv);
      }
      if (!other.pinned) {
        other.x += nx * overlap * (other.invMass / totalInv);
        other.y += ny * overlap * (other.invMass / totalInv);
      }
    }
  }

  render(ctx) {
    if (this.carvedStone) return; // Handled by specialized architectural renderer

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0, this.radius), 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    if (this.pinned) {
      // Bronze anchor ring around pinned pivots
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0, this.radius * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = '#0c1017';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
    ctx.restore();
  }
}


// ============================================================================
// STRUCTURAL CONSTRAINTS & DYNAMIC STRESS TENSOR ANALYSIS
// ============================================================================

export class StructuralConstraint {
  constructor(p1, p2, options = {}) {
    this.p1 = p1;
    this.p2 = p2;
    this.restLength = options.length !== undefined ? Number(options.length) : Math.hypot(p2.x - p1.x, p2.y - p1.y);
    this.stiffness = options.stiffness !== undefined ? Math.max(0.01, Math.min(1.0, Number(options.stiffness))) : 0.96;
    this.type = options.type || 'timber'; // 'timber', 'hemp_cable', 'iron_rod', 'chain_link'
    this.crossSection = options.crossSection !== undefined ? Math.max(0.1, Number(options.crossSection)) : 1.0; // Area A (cm^2)
    this.maxTensileStress = options.maxTensileStress !== undefined ? Number(options.maxTensileStress) : 380.0; // MPa
    this.currentTension = 0.0; // Newtons
    this.currentStress = 0.0; // sigma = T / A (MPa)
    this.broken = false;
    this.color = options.color || null;
    this.visible = options.visible !== undefined ? options.visible : true;
    this.renderWidth = options.renderWidth || 3.0;
    this.flashTimer = 0.0;
    this.tag = options.tag || 'strut';
  }

  solve() {
    if (this.broken) return;

    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const currentDist = Math.hypot(dx, dy);

    if (currentDist < 1e-6) return;

    const delta = currentDist - this.restLength;
    const totalInvMass = this.p1.invMass + this.p2.invMass;

    if (totalInvMass <= 1e-9) return;

    // Hooke's Law: F = k * delta
    const forceMag = delta * this.stiffness * 450.0;
    this.currentTension = Math.max(0.0, forceMag);
    this.currentStress = this.currentTension / this.crossSection;

    // Cable types cannot resist compressive buckling
    if (this.type === 'hemp_cable' && delta < 0) {
      this.currentTension = 0;
      this.currentStress = 0;
      return;
    }

    // Stress fracture check: sigma > sigma_yield
    if (this.currentStress > this.maxTensileStress) {
      this.broken = true;
      this.flashTimer = 0.45; // Fracture flash duration
      return;
    }

    const nx = dx / currentDist;
    const ny = dy / currentDist;

    const correction = (delta * this.stiffness) / totalInvMass;

    if (!this.p1.pinned) {
      this.p1.x += nx * correction * this.p1.invMass;
      this.p1.y += ny * correction * this.p1.invMass;
    }
    if (!this.p2.pinned) {
      this.p2.x -= nx * correction * this.p2.invMass;
      this.p2.y -= ny * correction * this.p2.invMass;
    }
  }

  sever() {
    if (!this.broken) {
      this.broken = true;
      this.flashTimer = 0.4;
    }
  }

  getStrain() {
    const d = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    return (d - this.restLength) / Math.max(1e-4, this.restLength);
  }

  getStressRatio() {
    return Math.min(1.0, Math.max(0.0, this.currentStress / Math.max(1.0, this.maxTensileStress)));
  }

  getStressColor() {
    if (this.broken) return '#4A1515';
    if (this.flashTimer > 0) return '#FFFFFF'; // Impact / Fracture flash

    const ratio = this.getStressRatio();

    if (this.type === 'hemp_cable') {
      // Vitruvian tension spectrum: Cyan (Safe) -> Gold (Working) -> Amber (High) -> Crimson (Critical)
      if (ratio < 0.35) {
        return '#00F0FF'; // Safe cyan tension vector
      } else if (ratio < 0.65) {
        return '#D4AF37'; // Working load Imperial Brass
      } else if (ratio < 0.88) {
        return '#FF8C00'; // Amber warning
      } else {
        return '#FF1744'; // Imminent failure fracture red
      }
    } else if (this.type === 'timber') {
      if (ratio < 0.55) return '#8B5A2B'; // Roman Oak
      if (ratio < 0.85) return '#C87D32'; // Stressed timber
      return '#FF3D00'; // Overstressed beam
    } else {
      // Iron / Bronze
      if (ratio < 0.65) return '#78909C';
      return '#FF5252';
    }
  }

  render(ctx) {
    if (!this.visible || this.broken) return;

    ctx.save();
    ctx.strokeStyle = this.getStressColor();
    ctx.lineWidth = this.renderWidth;
    ctx.lineCap = 'round';

    if (this.type === 'hemp_cable') {
      const dx = this.p2.x - this.p1.x;
      const dy = this.p2.y - this.p1.y;
      const currentDist = Math.hypot(dx, dy);

      // If cable is slack, render authentic catenary sag
      if (currentDist < this.restLength * 0.98) {
        const catPoints = computeCatenaryPoints(this.p1, this.p2, this.restLength, 12);
        ctx.beginPath();
        ctx.moveTo(catPoints[0].x, catPoints[0].y);
        for (let i = 1; i < catPoints.length; i++) {
          ctx.lineTo(catPoints[i].x, catPoints[i].y);
        }
        ctx.stroke();
      } else {
        // Taut cable line
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();

        // Multi-strand twisted hemp texture dashes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = Math.max(1, this.renderWidth * 0.45);
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (this.type === 'timber') {
      // Weathered Roman Oak strut with timber grain highlight
      ctx.beginPath();
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 235, 185, 0.22)';
      ctx.lineWidth = Math.max(1, this.renderWidth * 0.3);
      ctx.beginPath();
      ctx.moveTo(this.p1.x - 1.5, this.p1.y - 1.5);
      ctx.lineTo(this.p2.x - 1.5, this.p2.y - 1.5);
      ctx.stroke();
    } else {
      // Iron rod / Chain link
      ctx.beginPath();
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}


// ============================================================================
// FLUID & THERMODYNAMIC PARTICLE DYNAMICS (STEAM, WATER, EMBERS)
// ============================================================================

export class FluidParticle {
  constructor(x, y, vx, vy, type = 'water') {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
    this.vx = Number(vx) || 0;
    this.vy = Number(vy) || 0;
    this.type = type; // 'water', 'steam', 'ember', 'smoke'
    this.life = 1.0;
    this.maxLife = type === 'steam' ? 1.5 : (type === 'ember' ? 0.95 : (type === 'smoke' ? 2.2 : 5.0));
    this.decay = 1.0 / this.maxLife;
    this.radius = type === 'steam' ? 3.2 : (type === 'ember' ? 2.0 : 3.5);
    this.alpha = 1.0;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 4.0;
    this.temperature = type === 'steam' ? 140 : (type === 'ember' ? 850 : 20); // Celsius
  }

  update(dt, gravityY = 9.81) {
    this.life -= this.decay * dt;
    this.rotation += this.vRot * dt;

    if (this.type === 'water') {
      // Hydrodynamic gravity acceleration
      this.vy += gravityY * 42.0 * dt;
      // Frame-rate-independent damping
      const waterDamp = Math.pow(0.99, dt * 60);
      this.vx *= waterDamp;
      this.vy *= waterDamp;
      this.alpha = Math.max(0.0, Math.min(1.0, this.life / this.maxLife));
    } else if (this.type === 'steam') {
      // Thermal buoyancy lifting steam plume upward with vortex curl
      this.vy -= (48.0 + (this.temperature - 100.0) * 0.25) * dt;
      this.vx += (Math.sin(this.rotation * 2) * 16.0) * dt;
      this.radius += 15.0 * dt; // Expansion in atmosphere
      this.alpha = Math.max(0.0, (this.life / this.maxLife)) * 0.72;
    } else if (this.type === 'ember') {
      // Rising glowing charcoal embers
      this.vy -= (28.0 + Math.random() * 35.0) * dt;
      this.vx += (Math.random() - 0.5) * 18.0 * dt;
      this.alpha = Math.max(0.0, this.life / this.maxLife);
    } else if (this.type === 'smoke') {
      this.vy -= 22.0 * dt;
      this.vx += (Math.random() - 0.5) * 10.0 * dt;
      this.radius += 12.0 * dt;
      this.alpha = Math.max(0.0, this.life / this.maxLife) * 0.45;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0, this.radius), 0, Math.PI * 2);

    if (this.type === 'water') {
      ctx.fillStyle = `rgba(41, 182, 246, ${this.alpha})`;
      ctx.fill();
      // Specular glint
      ctx.beginPath();
      ctx.arc(this.x - 1, this.y - 1, Math.max(0, this.radius * 0.35), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.8})`;
      ctx.fill();
    } else if (this.type === 'steam') {
      ctx.fillStyle = `rgba(224, 247, 250, ${this.alpha})`;
      ctx.fill();
    } else if (this.type === 'ember') {
      ctx.fillStyle = `rgba(255, ${Math.floor(100 + this.life * 155)}, 0, ${this.alpha})`;
      ctx.fill();
    } else {
      // Smoke
      ctx.fillStyle = `rgba(120, 144, 156, ${this.alpha})`;
      ctx.fill();
    }

    ctx.restore();
  }
}

export class ParticleEmitter {
  constructor(options = {}) {
    this.particles = [];
    this.maxParticles = options.maxParticles || 300;
    this.rate = options.rate || 20; // particles per second
    this.accumulator = 0;
  }

  emit(x, y, vx, vy, type) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(new FluidParticle(x, y, vx, vy, type));
    }
  }

  update(dt, gravityY = 9.81) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt, gravityY);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  clear() {
    this.particles = [];
  }

  count() {
    return this.particles.length;
  }
}


// ============================================================================
// CLASSICAL ROTATIONAL DYNAMICS & SPUR / CYCLOIDAL GEAR SYSTEMS
// ============================================================================

export class SpurGear {
  constructor(x, y, radius, teeth, options = {}) {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
    this.radius = Math.max(8.0, Number(radius)); // Pitch radius (r_p)
    this.teeth = Math.max(6, Math.floor(teeth));
    this.angle = options.angle || 0.0;
    this.omega = options.omega || 0.0; // Angular velocity (rad/s)
    this.alpha = 0.0; // Angular acceleration (rad/s^2)
    this.mass = options.mass || (this.radius * 0.4);
    this.inertia = options.inertia || (0.5 * this.mass * this.radius * this.radius * 0.001);
    this.color = options.color || '#D4AF37'; // Imperial Golden Brass
    this.toothHeight = options.toothHeight || Math.max(5.0, this.radius * 0.18);
    this.spokes = options.spokes || (this.radius > 60 ? 6 : (this.radius > 30 ? 4 : 3));
    this.meshPairs = []; // Meshed partner gears
    this.label = options.label || `${this.teeth}T`;
    this.isDriven = !!options.isDriven;
    this.appliedTorque = 0.0;
    this.frictionCoeff = 0.012;
  }

  addMesh(otherGear, ratio) {
    this.meshPairs.push({ gear: otherGear, ratio: ratio });
  }

  applyTorque(tau) {
    this.appliedTorque += tau;
  }

  update(dt, damping = 0.985) {
    if (!this.isDriven) {
      // Net torque = applied - viscous friction
      const viscousDrag = -this.omega * this.frictionCoeff * this.inertia * 80.0;
      const netTorque = this.appliedTorque + viscousDrag;
      this.alpha = netTorque / Math.max(1e-4, this.inertia);
      this.omega += this.alpha * dt;
      // Frame-rate-independent damping
      this.omega *= Math.pow(damping, dt * 60);
    }

    this.angle += this.omega * dt;
    this.appliedTorque = 0.0;

    // Propagate angular velocity across gear tooth engagement
    for (const mesh of this.meshPairs) {
      const targetOmega = -this.omega * mesh.ratio;
      // Stiff kinematic gear mesh coupling with slight elastic compliance
      // Frame-rate-independent lerp: convert per-frame blend to continuous
      const meshBlend = 1.0 - Math.pow(1.0 - 0.52, dt * 60);
      mesh.gear.omega += (targetOmega - mesh.gear.omega) * meshBlend;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const safeR = Math.max(4.0, this.radius);
    const safeTh = Math.max(3.0, this.toothHeight);

    // Gear Tooth Perimeter (Cycloidal / Involute Profile)
    ctx.beginPath();
    const toothAngle = (Math.PI * 2) / this.teeth;
    const halfTooth = toothAngle * 0.5;

    for (let i = 0; i < this.teeth; i++) {
      const a = i * toothAngle;
      const rRoot = safeR - safeTh * 0.55;
      const rTip = safeR + safeTh * 0.55;

      const cos0 = Math.cos(a);
      const sin0 = Math.sin(a);
      const cos1 = Math.cos(a + halfTooth * 0.35);
      const sin1 = Math.sin(a + halfTooth * 0.35);
      const cos2 = Math.cos(a + halfTooth * 0.75);
      const sin2 = Math.sin(a + halfTooth * 0.75);
      const cos3 = Math.cos(a + toothAngle);
      const sin3 = Math.sin(a + toothAngle);

      if (i === 0) {
        ctx.moveTo(cos0 * rRoot, sin0 * rRoot);
      }
      ctx.lineTo(cos1 * rTip, sin1 * rTip);
      ctx.lineTo(cos2 * rTip, sin2 * rTip);
      ctx.lineTo(cos3 * rRoot, sin3 * rRoot);
    }
    ctx.closePath();

    // Bronze gear disc radial metallic gradient
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, safeR + safeTh);
    grad.addColorStop(0, '#FFF5A8');
    grad.addColorStop(0.3, this.color);
    grad.addColorStop(0.85, '#996515');
    grad.addColorStop(1, '#533405');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#2B1700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner Rim & Spoke Cutouts (Authentic Classical Roman Gear Casting)
    const rimInner = safeR * 0.76;
    const hubOuter = safeR * 0.30;

    if (rimInner > hubOuter + 6 && this.spokes > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, rimInner), 0, Math.PI * 2);
      ctx.strokeStyle = '#432607';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const spokeAngle = (Math.PI * 2) / this.spokes;
      for (let s = 0; s < this.spokes; s++) {
        const sa1 = s * spokeAngle + 0.24;
        const sa2 = (s + 1) * spokeAngle - 0.24;

        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, rimInner * 0.94), sa1, sa2);
        ctx.arc(0, 0, Math.max(0, hubOuter * 1.25), sa2, sa1, true);
        ctx.closePath();
        ctx.fillStyle = '#0c1017'; // Cut through to blueprint background
        ctx.fill();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }

    // Central Bronze Hub Sleeve & Square Axle Broach
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, hubOuter), 0, Math.PI * 2);
    ctx.fillStyle = '#ECC364';
    ctx.fill();
    ctx.strokeStyle = '#2B1704';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Square keyway
    const sq = hubOuter * 0.52;
    ctx.fillStyle = '#1A2530';
    ctx.fillRect(-sq * 0.5, -sq * 0.5, sq, sq);
    ctx.strokeStyle = '#D4AF37';
    ctx.strokeRect(-sq * 0.5, -sq * 0.5, sq, sq);

    ctx.restore();
  }
}


// ============================================================================
// SYSTEM 1: POLYSPASTON ROMAN CRANE (VITRUVIUS BOOK X.2)
// ============================================================================

export class PolyspastonCraneSystem {
  constructor(engine) {
    this.engine = engine;
    this.points = [];
    this.constraints = [];
    this.winchAngle = 0.0;
    this.winchOmega = 0.0;
    this.sheaveAngles = [0, 0, 0, 0];
    this.sheaveR = 22.0;
    this.maRatio = 8.0; // Polyspaston compound ratio (8 falls)
    this.loadBlockMass = 720; // kg of carved travertine marble
    this.loadBlockPoint = null;
    this.winchPoint = null;
    this.upperSheavePoint = null;
    this.lowerBlockPoint = null;
    this.guyAnchorLeft = null;
    this.guyAnchorRight = null;
    this.criticalGuyCable = null;
    this.winchCrankRadius = 38.0;
    this.treadwheelMode = false;
    this.pedalAngle = 0.0;

    this.initGeometry();
  }

  initGeometry() {
    this.points = [];
    this.constraints = [];

    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h - 60;
    const centerX = w * 0.48;

    // Base Sill Beams & Ground Footings (Trapezophoron / Hypostateres)
    const footL = new VerletParticle(centerX - 170, groundY, { pinned: true, color: '#8B5A2B', tag: 'footing' });
    const footR = new VerletParticle(centerX + 130, groundY, { pinned: true, color: '#8B5A2B', tag: 'footing' });
    const footCenter = new VerletParticle(centerX, groundY, { pinned: true, color: '#8B5A2B', tag: 'footing' });

    // Guy Cable Ground Anchors (Antetoni on tension side, Retenti on back)
    const anchorL = new VerletParticle(w * 0.08, groundY, { pinned: true, color: '#5C3818', tag: 'anchor' });
    const anchorR = new VerletParticle(w * 0.90, groundY, { pinned: true, color: '#5C3818', tag: 'anchor' });
    this.guyAnchorLeft = anchorL;
    this.guyAnchorRight = anchorR;

    // Crane Derrick Apex (Calcites / Epichites Sheave Cage)
    const apexX = centerX - 12;
    const apexY = h * 0.22;
    const apex = new VerletParticle(apexX, apexY, { mass: 28.0, color: '#D4AF37', tag: 'apex_sheave' });
    this.upperSheavePoint = apex;

    // Mid-Leg Cross Braces (Fibulaturae)
    const midLegLY = (apexY + groundY) * 0.58;
    const midLegLX = (apexX + footL.x) * 0.58;
    const midLegL = new VerletParticle(midLegLX, midLegLY, { mass: 14.0, color: '#8B5A2B', tag: 'strut_node' });

    const midLegRY = (apexY + footR.y) * 0.58;
    const midLegRX = (apexX + footR.x) * 0.58;
    const midLegR = new VerletParticle(midLegRX, midLegLY, { mass: 14.0, color: '#8B5A2B', tag: 'strut_node' });

    // Dual Shear-Leg Derricks (Tigna) - Heavy Roman Sessile Oak
    this.constraints.push(new StructuralConstraint(footL, midLegL, { type: 'timber', stiffness: 1.0, crossSection: 18.0, maxTensileStress: 650 }));
    this.constraints.push(new StructuralConstraint(midLegL, apex, { type: 'timber', stiffness: 1.0, crossSection: 18.0, maxTensileStress: 650 }));
    this.constraints.push(new StructuralConstraint(footR, midLegR, { type: 'timber', stiffness: 1.0, crossSection: 18.0, maxTensileStress: 650 }));
    this.constraints.push(new StructuralConstraint(midLegR, apex, { type: 'timber', stiffness: 1.0, crossSection: 18.0, maxTensileStress: 650 }));
    // Cross-tie collar beam
    this.constraints.push(new StructuralConstraint(midLegL, midLegR, { type: 'timber', stiffness: 0.98, crossSection: 14.0, maxTensileStress: 550 }));

    // Tension Guy Ropes (Hemp Cordage - Antetoni & Retenti)
    const guyL1 = new StructuralConstraint(anchorL, apex, {
      type: 'hemp_cable',
      stiffness: 0.92,
      crossSection: 5.0,
      maxTensileStress: 420.0,
      renderWidth: 3.5,
      tag: 'critical_guy'
    });
    const guyL2 = new StructuralConstraint(anchorL, midLegL, {
      type: 'hemp_cable',
      stiffness: 0.90,
      crossSection: 4.0,
      maxTensileStress: 380.0,
      renderWidth: 2.8
    });
    const guyR1 = new StructuralConstraint(anchorR, apex, {
      type: 'hemp_cable',
      stiffness: 0.92,
      crossSection: 5.0,
      maxTensileStress: 420.0,
      renderWidth: 3.5
    });
    this.criticalGuyCable = guyL1;

    this.constraints.push(guyL1, guyL2, guyR1);

    // Winch Drum (Ergates / Sucula) mounted to base sill
    const winchX = centerX + 82;
    const winchY = groundY - 35;
    const winchP = new VerletParticle(winchX, winchY, { pinned: true, color: '#D4AF37', tag: 'winch' });
    this.winchPoint = winchP;

    // Traveling Pulley Sheave Block (Artemon / Trochlea Inferior)
    const lowerBlockX = apexX + 6;
    const lowerBlockY = apexY + 160;
    const lowerBlock = new VerletParticle(lowerBlockX, lowerBlockY, { mass: 35.0, color: '#D4AF37', tag: 'lower_sheave' });
    this.lowerBlockPoint = lowerBlock;

    // Suspended Heavy Load: Carved Travertine Roman Capital
    const stoneX = lowerBlockX;
    const stoneY = lowerBlockY + 75;
    const stoneBlock = new VerletParticle(stoneX, stoneY, {
      mass: 85.0,
      radius: 28,
      color: '#EAE6DF',
      tag: 'stone_capital',
      carvedStone: true,
      stoneWidth: 92,
      stoneHeight: 56
    });
    this.loadBlockPoint = stoneBlock;

    // Forged Roman Iron Lewis Bolt Clamp (Forfices)
    this.constraints.push(new StructuralConstraint(lowerBlock, stoneBlock, {
      type: 'iron_rod',
      stiffness: 0.99,
      crossSection: 8.5,
      maxTensileStress: 850.0,
      renderWidth: 4.0
    }));

    // Compound Tackle Hoist Cable Passes (Running from Winch -> Sheaves)
    const cableWinchToApex = new StructuralConstraint(winchP, apex, {
      type: 'hemp_cable',
      stiffness: 0.88,
      crossSection: 5.2,
      maxTensileStress: 550.0,
      renderWidth: 3.5
    });
    const fall1 = new StructuralConstraint(apex, lowerBlock, {
      type: 'hemp_cable',
      stiffness: 0.90,
      crossSection: 4.8,
      maxTensileStress: 500.0,
      renderWidth: 3.0
    });
    const fall2 = new StructuralConstraint(lowerBlock, apex, {
      type: 'hemp_cable',
      stiffness: 0.90,
      crossSection: 4.8,
      maxTensileStress: 500.0,
      renderWidth: 3.0
    });

    this.constraints.push(cableWinchToApex, fall1, fall2);

    this.points.push(
      footL, footR, footCenter, anchorL, anchorR,
      apex, midLegL, midLegR, winchP, lowerBlock, stoneBlock
    );
  }

  crankWinch(amount) {
    if (!this.lowerBlockPoint || !this.upperSheavePoint) return;
    this.winchAngle += amount * 0.16;
    this.winchOmega = amount * 1.8;

    // Shorten active falls of hoist tackle
    for (const c of this.constraints) {
      if (c.type === 'hemp_cable' && (c.p1 === this.lowerBlockPoint || c.p2 === this.lowerBlockPoint)) {
        c.restLength = Math.max(35.0, c.restLength - amount * (1.0 / this.maRatio) * 8.5);
      }
    }
  }

  releaseBrake() {
    for (const c of this.constraints) {
      if (c.type === 'hemp_cable' && (c.p1 === this.lowerBlockPoint || c.p2 === this.lowerBlockPoint)) {
        c.restLength = Math.min(380.0, c.restLength + 16.0);
      }
    }
    this.winchOmega = -8.5;
  }

  snapCriticalCable() {
    if (this.criticalGuyCable && !this.criticalGuyCable.broken) {
      this.criticalGuyCable.broken = true;
      this.criticalGuyCable.flashTimer = 0.5;
    }
  }

  update(dt) {
    this.winchAngle += this.winchOmega * dt;
    this.winchOmega *= 0.93;
    this.pedalAngle += this.winchOmega * 0.85 * dt;

    // Pulley sheaves rotation proportional to hoist speed
    const sheaveSpeed = this.winchOmega * 1.3;
    for (let i = 0; i < this.sheaveAngles.length; i++) {
      this.sheaveAngles[i] += sheaveSpeed * (1.0 / (i + 1)) * dt;
    }
  }

  render(ctx) {
    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h - 60;

    // Classical Stone Quay Pavement (Opus Incertum)
    this.renderQuayPavement(ctx, groundY, w, h);

    // Render Constraints (Timber shear legs & Guy ropes)
    for (const c of this.constraints) {
      c.render(ctx);
    }

    // Render Winch Drum (Sucula with Vectes handspikes)
    this.renderWinch(ctx);

    // Render Upper Pulley Sheave Cage (Calcites)
    if (this.upperSheavePoint) {
      this.renderSheaveBlock(ctx, this.upperSheavePoint.x, this.upperSheavePoint.y, 3, this.sheaveAngles[0], true);
    }

    // Render Lower Traveling Sheave Block (Artemon) & Iron Hook
    if (this.lowerBlockPoint) {
      this.renderSheaveBlock(ctx, this.lowerBlockPoint.x, this.lowerBlockPoint.y, 3, this.sheaveAngles[1], false);
      this.renderForgedHook(ctx, this.lowerBlockPoint.x, this.lowerBlockPoint.y + 22);
    }

    // Render Carved Roman Travertine Corinthian Capital
    if (this.loadBlockPoint) {
      this.renderCorinthianCapital(ctx, this.loadBlockPoint.x, this.loadBlockPoint.y, 90, 54);
    }
  }

  renderQuayPavement(ctx, groundY, w, h) {
    ctx.save();
    ctx.fillStyle = '#141c28';
    ctx.fillRect(0, groundY, w, 60);

    ctx.strokeStyle = '#27384e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Flagged paving stone joints
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(78, 105, 140, 0.35)';
    for (let x = 16; x < w; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 22, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderWinch(ctx) {
    if (!this.winchPoint) return;
    const x = this.winchPoint.x;
    const y = this.winchPoint.y;

    ctx.save();
    ctx.translate(x, y);

    // Timber framing pillow blocks
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(-18, -8, 36, 46);
    ctx.strokeStyle = '#271607';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(-18, -8, 36, 46);

    // Cylindrical Oak Drum
    const drumR = 18;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, drumR), 0, Math.PI * 2);
    ctx.fillStyle = '#8B5A2B';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Rope coils on drum
    ctx.strokeStyle = '#C49A45';
    ctx.lineWidth = 3.0;
    for (let r = -12; r <= 12; r += 5) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, drumR - 3), (r / 12) * Math.PI, (r / 12 + 0.4) * Math.PI);
      ctx.stroke();
    }

    // Rotating Handspikes (Vectes)
    ctx.rotate(this.winchAngle);
    const spikeL = this.winchCrankRadius;

    for (let s = 0; s < 4; s++) {
      ctx.rotate(Math.PI * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(spikeL, 0);
      ctx.strokeStyle = '#E6A15C';
      ctx.lineWidth = 4.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(spikeL, 0, Math.max(0, 4.5), 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();
      ctx.strokeStyle = '#331B03';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Axle pin
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, 5.0), 0, Math.PI * 2);
    ctx.fillStyle = '#FFE082';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  renderSheaveBlock(ctx, x, y, sheaveCount, rotation, isUpper) {
    ctx.save();
    ctx.translate(x, y);

    const blockW = 28;
    const blockH = 46;

    // Bronze sheave housing
    ctx.fillStyle = '#8F661B';
    ctx.fillRect(-blockW * 0.5, -blockH * 0.5, blockW, blockH);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(-blockW * 0.5, -blockH * 0.5, blockW, blockH);

    // Rotating sheaves
    const r = this.sheaveR * 0.75;
    ctx.save();
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2);
    ctx.fillStyle = '#E5C158';
    ctx.fill();
    ctx.strokeStyle = '#422405';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI * 0.5);
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.lineTo(r * 0.8, 0);
      ctx.strokeStyle = '#6D440C';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // Central bronze pin
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, 4.5), 0, Math.PI * 2);
    ctx.fillStyle = '#FFF176';
    ctx.fill();
    ctx.strokeStyle = '#2E1903';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shackle loop
    const shackleY = isUpper ? -blockH * 0.5 - 6 : blockH * 0.5 + 6;
    ctx.beginPath();
    ctx.arc(0, shackleY, Math.max(0, 6.0), 0, Math.PI * 2);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  renderForgedHook(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = '#78909C'; // Roman wrought iron
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.arc(6, 16, Math.max(0, 9.0), Math.PI, Math.PI * 0.35, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, 3.5), 0, Math.PI * 2);
    ctx.fillStyle = '#37474F';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderCorinthianCapital(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);

    const halfW = width * 0.5;
    const halfH = height * 0.5;

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-halfW + 4, -halfH + 6, width, height);

    // Marble Gradient
    const marbleGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    marbleGrad.addColorStop(0, '#FFFFFF');
    marbleGrad.addColorStop(0.3, '#EAE6DF');
    marbleGrad.addColorStop(0.7, '#D7D0C5');
    marbleGrad.addColorStop(1, '#B8B0A2');
    ctx.fillStyle = marbleGrad;
    ctx.fillRect(-halfW, -halfH, width, height);

    ctx.strokeStyle = '#6E675B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfW, -halfH, width, height);

    // Abacus (Top Slab)
    const abacusH = height * 0.22;
    ctx.fillStyle = '#F5F3ED';
    ctx.fillRect(-halfW - 4, -halfH, width + 8, abacusH);
    ctx.strokeRect(-halfW - 4, -halfH, width + 8, abacusH);

    // Volute Spirals
    const voluteR = 7.5;
    ctx.strokeStyle = '#8A8172';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(-halfW + 4, -halfH + abacusH + 4, Math.max(0, voluteR), 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(halfW - 4, -halfH + abacusH + 4, Math.max(0, voluteR), 0, Math.PI * 2);
    ctx.stroke();

    // Acanthus Leaf Relief
    ctx.fillStyle = '#BDB5A6';
    const leafCount = 5;
    const leafSpan = width / leafCount;
    for (let i = 0; i < leafCount; i++) {
      const lx = -halfW + (i + 0.5) * leafSpan;
      const ly = halfH - 2;
      ctx.beginPath();
      ctx.moveTo(lx - leafSpan * 0.35, ly);
      ctx.quadraticCurveTo(lx, ly - height * 0.55, lx + leafSpan * 0.35, ly);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Chiseled Epigraphy: S • P • Q • R
    ctx.fillStyle = '#4A443B';
    ctx.font = '7px serif';
    ctx.textAlign = 'center';
    ctx.fillText('S • P • Q • R', 0, -halfH + abacusH * 0.72);

    // Lewis Clamps (Forfices)
    ctx.strokeStyle = '#455A64';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-12, -halfH);
    ctx.lineTo(0, -halfH - 12);
    ctx.lineTo(12, -halfH);
    ctx.stroke();

    ctx.restore();
  }
}


// ============================================================================
// SYSTEM 2: HERO'S AEOLIPILE / STEAM REACTION TURBINE (PNEUMATICA 50)
// ============================================================================

export class AeolipileSystem {
  constructor(engine) {
    this.engine = engine;
    this.sphereRadius = 65.0;
    this.angle = 0.0;
    this.omega = 0.0; // rad/s
    this.alpha = 0.0; // rad/s^2
    this.sphereMass = 3.6; // kg copper
    this.inertia = 0.5 * this.sphereMass * this.sphereRadius * this.sphereRadius * 0.001; // I = 1/2 m r^2

    // Boiler Thermodynamics
    this.waterTempC = 99.0;
    this.boilerPressureBar = 1.0; // Atmospheres absolute
    this.isBoilerFiring = true;
    this.steamMassRate = 0.048; // kg/s
    this.nozzleVelocity = 125.0; // m/s exit velocity
    this.armLength = this.sphereRadius + 22.0;

    // Particle Buffers
    this.steamParticles = [];
    this.flameParticles = [];

    // Telemetry
    this.rpm = 0.0;
    this.peakRpm = 0.0;
  }

  toggleBoilerFire() {
    this.isBoilerFiring = !this.isBoilerFiring;
  }

  update(dt) {
    const w = this.engine.width;
    const h = this.engine.height;
    const sphereX = w * 0.5;
    const sphereY = h * 0.42;

    // Thermodynamics of Saturated Steam Generation
    if (this.isBoilerFiring) {
      this.waterTempC = Math.min(220.0, this.waterTempC + 18.0 * dt);
      if (this.waterTempC >= 100.0) {
        const excessT = this.waterTempC - 100.0;
        this.boilerPressureBar = 1.0 + Math.pow(excessT / 34.0, 1.62);
      }
    } else {
      this.waterTempC = Math.max(24.0, this.waterTempC - 8.5 * dt);
      this.boilerPressureBar = Math.max(1.0, this.boilerPressureBar - 1.6 * dt);
    }

    // Reaction Torque Calculation (Heron Pneumatica L: tau = 2 * (r x F))
    let reactionTorque = 0.0;
    if (this.boilerPressureBar > 1.04) {
      const pGauge = (this.boilerPressureBar - 1.0) * 1e5; // Pascals
      const nozzleArea = 0.00012; // m^2
      const jetThrust = nozzleArea * pGauge * 0.36; // Newtons
      reactionTorque = 2.0 * (this.armLength * 0.01) * jetThrust;

      // Emit high-velocity tangential steam plumes
      const nozzle1Angle = this.angle;
      const nozzle2Angle = this.angle + Math.PI;

      const r = this.armLength;
      const n1X = sphereX + Math.cos(nozzle1Angle) * r;
      const n1Y = sphereY + Math.sin(nozzle1Angle) * r;
      const tan1X = -Math.sin(nozzle1Angle) * this.nozzleVelocity * (this.boilerPressureBar * 0.4);
      const tan1Y = Math.cos(nozzle1Angle) * this.nozzleVelocity * (this.boilerPressureBar * 0.4);

      const n2X = sphereX + Math.cos(nozzle2Angle) * r;
      const n2Y = sphereY + Math.sin(nozzle2Angle) * r;
      const tan2X = -Math.sin(nozzle2Angle) * this.nozzleVelocity * (this.boilerPressureBar * 0.4);
      const tan2Y = Math.cos(nozzle2Angle) * this.nozzleVelocity * (this.boilerPressureBar * 0.4);

      if (this.steamParticles.length < 320) {
        for (let k = 0; k < 3; k++) {
          this.steamParticles.push(new FluidParticle(n1X, n1Y, tan1X + (Math.random() - 0.5) * 20, tan1Y + (Math.random() - 0.5) * 20, 'steam'));
          this.steamParticles.push(new FluidParticle(n2X, n2Y, tan2X + (Math.random() - 0.5) * 20, tan2Y + (Math.random() - 0.5) * 20, 'steam'));
        }
      }
    }

    // Aerodynamic Air Drag & Bearing Friction
    const airDragTorque = -0.5 * 1.2 * 0.022 * Math.pow(this.sphereRadius * 0.01, 3) * this.omega * Math.abs(this.omega);
    const bearingFriction = -0.014 * this.omega;

    const netTorque = reactionTorque + airDragTorque + bearingFriction;
    this.alpha = netTorque / Math.max(1e-4, this.inertia);
    this.omega += this.alpha * dt;
    this.angle += this.omega * dt;

    this.rpm = Math.abs((this.omega * 60.0) / (Math.PI * 2));
    this.peakRpm = Math.max(this.peakRpm, this.rpm);

    // Charcoal Brazier Flame & Ember Particles
    const brazierY = sphereY + 160;
    if (this.isBoilerFiring && this.flameParticles.length < 180) {
      for (let f = 0; f < 2; f++) {
        const fx = sphereX + (Math.random() - 0.5) * 90;
        const fy = brazierY - 10 + (Math.random() - 0.5) * 15;
        this.flameParticles.push(new FluidParticle(fx, fy, (Math.random() - 0.5) * 15, -45 - Math.random() * 50, 'ember'));
      }
    }

    // Particle Lifecycle Updates
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.update(dt, -9.81);
      if (p.life <= 0) this.steamParticles.splice(i, 1);
    }
    for (let i = this.flameParticles.length - 1; i >= 0; i--) {
      const p = this.flameParticles[i];
      p.update(dt, 9.81);
      if (p.life <= 0) this.flameParticles.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.engine.width;
    const h = this.engine.height;
    const sphereX = w * 0.5;
    const sphereY = h * 0.42;

    // Charcoal Brazier Hearth (Focus)
    this.renderBrazier(ctx, sphereX, sphereY + 160);

    // Glowing Charcoal Embers & Flames
    for (const p of this.flameParticles) {
      p.render(ctx);
    }

    // Sealed Copper Cauldron Boiler (Lebes)
    this.renderCauldron(ctx, sphereX, sphereY + 130);

    // Hollow Trunnion Steam Delivery Pipes (Tubuli)
    this.renderTrunnionPipes(ctx, sphereX, sphereY);

    // Spinning Copper Aeolipile Sphere & Tangential Nozzles (Noctuae)
    this.renderSphere(ctx, sphereX, sphereY);

    // Whirling Steam Particle Plumes
    for (const p of this.steamParticles) {
      p.render(ctx);
    }
  }

  renderBrazier(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Terracotta Base Plinth
    ctx.fillStyle = '#1A1E26';
    ctx.fillRect(-110, 0, 220, 45);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(-110, 0, 220, 45);

    // Greek Key Pattern Trim
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.0;
    for (let bx = -100; bx < 100; bx += 20) {
      ctx.strokeRect(bx, 10, 12, 12);
    }

    // Iron Tripod Support Legs
    ctx.strokeStyle = '#455A64';
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(-85, 0);
    ctx.lineTo(-65, -45);
    ctx.moveTo(85, 0);
    ctx.lineTo(65, -45);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -45);
    ctx.stroke();

    // Charcoal Ember Bed with Heat Glow
    const emberGrad = ctx.createRadialGradient(0, -35, 10, 0, -35, 80);
    emberGrad.addColorStop(0, this.isBoilerFiring ? '#FFF59D' : '#3E2723');
    emberGrad.addColorStop(0.35, this.isBoilerFiring ? '#FF6F00' : '#261715');
    emberGrad.addColorStop(0.8, this.isBoilerFiring ? '#D84315' : '#140D0C');
    emberGrad.addColorStop(1, 'rgba(20, 13, 12, 0)');
    ctx.fillStyle = emberGrad;
    ctx.beginPath();
    ctx.ellipse(0, -35, 85, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderCauldron(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const r = 55;
    // Hammered Copper Lebes Cauldron
    const caulGrad = ctx.createRadialGradient(-18, -12, 10, 0, 0, r);
    caulGrad.addColorStop(0, '#FFAB91');
    caulGrad.addColorStop(0.4, '#D87A56');
    caulGrad.addColorStop(0.8, '#BF573F');
    caulGrad.addColorStop(1, '#5D271D');
    ctx.fillStyle = caulGrad;

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, r), 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3E1812';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cauldron Bolted Flange Rim
    ctx.fillStyle = '#FFCCBC';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0, r + 4), 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4E221B';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.restore();
  }

  renderTrunnionPipes(ctx, sphereX, sphereY) {
    ctx.save();

    const caulTopY = sphereY + 130;
    const trunnionX = this.sphereRadius + 14;

    ctx.strokeStyle = '#CD7F32'; // Hammered Roman Copper
    ctx.lineWidth = 6.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left steam delivery tube
    ctx.beginPath();
    ctx.moveTo(sphereX - 42, caulTopY);
    ctx.lineTo(sphereX - trunnionX, caulTopY - 45);
    ctx.lineTo(sphereX - trunnionX, sphereY);
    ctx.lineTo(sphereX - this.sphereRadius + 2, sphereY);
    ctx.stroke();

    // Right steam delivery tube
    ctx.beginPath();
    ctx.moveTo(sphereX + 42, caulTopY);
    ctx.lineTo(sphereX + trunnionX, caulTopY - 45);
    ctx.lineTo(sphereX + trunnionX, sphereY);
    ctx.lineTo(sphereX + this.sphereRadius - 2, sphereY);
    ctx.stroke();

    // Pivot Bushing Collars
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(sphereX - trunnionX - 4, sphereY - 8, 8, 16);
    ctx.fillRect(sphereX + trunnionX - 4, sphereY - 8, 8, 16);

    ctx.restore();
  }

  renderSphere(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.angle);

    const r = Math.max(0, this.sphereRadius);

    // Copper Sphere Radial Gradient
    const sphereGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    sphereGrad.addColorStop(0, '#FFE0B2');
    sphereGrad.addColorStop(0.25, '#FFB74D');
    sphereGrad.addColorStop(0.65, '#E65100');
    sphereGrad.addColorStop(0.9, '#BF360C');
    sphereGrad.addColorStop(1, '#4E1B0A');
    ctx.fillStyle = sphereGrad;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#371306';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hammered Seam Rivet Equator
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.28, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 236, 179, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Opposing Right-Angled Exhaust Nozzles (Noctuae)
    const armL = this.armLength;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 5.0;
    ctx.lineCap = 'square';

    // Nozzle 1
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(armL, 0);
    ctx.lineTo(armL, armL * 0.38);
    ctx.stroke();

    ctx.fillStyle = '#FFE082';
    ctx.fillRect(armL - 4, armL * 0.38, 8, 5);

    // Nozzle 2
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(-armL, 0);
    ctx.lineTo(-armL, -armL * 0.38);
    ctx.stroke();

    ctx.fillRect(-armL - 4, -armL * 0.38 - 5, 8, 5);

    ctx.restore();
  }
}


// ============================================================================
// SYSTEM 3: ARCHIMEDEAN HYDROSTATIC SCREW (COCHLEA, VITRUVIUS X.6)
// ============================================================================

export class ArchimedesScrewSystem {
  constructor(engine) {
    this.engine = engine;
    this.angle = 0.0;
    this.omega = 3.6; // rad/s rotation
    this.barrelLength = 390.0;
    this.barrelRadius = 44.0;
    this.inclineAngle = 36.87 * (Math.PI / 180); // Pythagorean 3-4-5 sacred slope (36.87°)
    this.pitchSpacing = 40.0;
    this.helices = 3; // Triple-start helical wooden auger (Vitruvius X.6)
    this.waterParticles = [];
    this.sumpLevel = 45;
    this.flumeDischargeCount = 0;
    this.volumetricFlowRate = '0.0';
  }

  update(dt) {
    this.angle += this.omega * dt;

    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h - 60;

    const intakeX = w * 0.22;
    const intakeY = groundY - 20;

    const dischargeX = intakeX + Math.cos(this.inclineAngle) * this.barrelLength;
    const dischargeY = intakeY - Math.sin(this.inclineAngle) * this.barrelLength;

    // Hydrostatic intake: scoop water droplets from lower sump basin into helical channel
    if (this.waterParticles.length < 360 && Math.random() < 0.68) {
      const offsetL = (Math.random() * 0.08) * this.barrelLength;
      const bucketX = intakeX + Math.cos(this.inclineAngle) * offsetL;
      const bucketY = intakeY - Math.sin(this.inclineAngle) * offsetL;

      this.waterParticles.push({
        x: bucketX,
        y: bucketY,
        vx: 0,
        vy: 0,
        distAlongBarrel: offsetL,
        inScrew: true,
        helicalPhase: Math.random() * Math.PI * 2
      });
    }

    // Advance droplets along helical strakes
    const linearSpeed = (this.omega / (Math.PI * 2)) * this.pitchSpacing * 2.85;
    this.volumetricFlowRate = (linearSpeed * 0.052).toFixed(1);

    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const p = this.waterParticles[i];

      if (p.inScrew) {
        p.distAlongBarrel += linearSpeed * dt;

        const currentDist = p.distAlongBarrel;
        const shaftX = intakeX + Math.cos(this.inclineAngle) * currentDist;
        const shaftY = intakeY - Math.sin(this.inclineAngle) * currentDist;

        // Helical channel transverse oscillation
        const helixPhase = this.angle + (currentDist / this.pitchSpacing) * Math.PI * 2 + p.helicalPhase;
        const perpX = -Math.sin(this.inclineAngle);
        const perpY = -Math.cos(this.inclineAngle);
        const transverse = Math.sin(helixPhase) * (this.barrelRadius * 0.56);

        p.x = shaftX + perpX * transverse;
        p.y = shaftY + perpY * transverse;

        // Discharge into aqueduct flume
        if (p.distAlongBarrel >= this.barrelLength) {
          p.inScrew = false;
          p.x = dischargeX;
          p.y = dischargeY;
          p.vx = 48.0 + Math.random() * 26.0;
          p.vy = -16.0 - Math.random() * 12.0;
          this.flumeDischargeCount++;
        }
      } else {
        // Free ballistic water particle in stone aqueduct channel
        p.vy += 9.81 * 36.0 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Aqueduct gutter bounce
        const flumeFloor = dischargeY + 45;
        if (p.y > flumeFloor && p.x < w - 20) {
          p.y = flumeFloor;
          p.vy = -p.vy * 0.28;
          p.vx = 68.0; // Flow along aqueduct
        }

        if (p.x > w + 20 || p.y > h + 20) {
          this.waterParticles.splice(i, 1);
        }
      }
    }
  }

  render(ctx) {
    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h - 60;

    const intakeX = w * 0.22;
    const intakeY = groundY - 20;

    const dischargeX = intakeX + Math.cos(this.inclineAngle) * this.barrelLength;
    const dischargeY = intakeY - Math.sin(this.inclineAngle) * this.barrelLength;

    // Lower Catchment Sump Basin (Lacus)
    this.renderSumpBasin(ctx, intakeX - 60, intakeY - 25, 140, 85);

    // Upper Stone Aqueduct Flume (Specus Aquagii)
    this.renderAqueductFlume(ctx, dischargeX, dischargeY, w - dischargeX + 20, 65);

    // Inclined Timber Auger Barrel & Helical Blades
    this.renderCochleaBarrel(ctx, intakeX, intakeY, dischargeX, dischargeY);

    // Water Droplet Particles
    this.renderWaterParticles(ctx);

    // Upper Crank Handle (Fusilla)
    this.renderCrankHandle(ctx, dischargeX, dischargeY);
  }

  renderSumpBasin(ctx, x, y, width, height) {
    ctx.save();
    ctx.fillStyle = '#1A232E';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, width, height);

    // Water Gradient with Meniscus
    const waterGrad = ctx.createLinearGradient(x, y + 20, x, y + height);
    waterGrad.addColorStop(0, 'rgba(41, 182, 246, 0.75)');
    waterGrad.addColorStop(1, 'rgba(2, 119, 189, 0.88)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(x + 2, y + 25, width - 4, height - 27);

    // Water surface ripple
    ctx.strokeStyle = '#B3E5FC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 25);
    for (let rx = x + 2; rx < x + width - 2; rx += 12) {
      ctx.lineTo(rx + 6, y + 25 + Math.sin(rx * 0.2) * 2);
    }
    ctx.stroke();

    ctx.restore();
  }

  renderAqueductFlume(ctx, x, y, width, height) {
    ctx.save();
    // Roman Opus Quadratum Aqueduct Channel (Specus)
    ctx.fillStyle = '#1C2636';
    ctx.fillRect(x, y + 25, width, height);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(x, y + 25, width, height);

    // Masonry Piers (Arcuationes)
    ctx.fillStyle = '#141C27';
    for (let px = x + 35; px < x + width; px += 80) {
      ctx.fillRect(px, y + 25 + height, 38, 200);
      ctx.strokeStyle = '#394B61';
      ctx.strokeRect(px, y + 25 + height, 38, 200);
    }

    // Water Stream flowing in specus
    ctx.fillStyle = 'rgba(41, 182, 246, 0.82)';
    ctx.fillRect(x, y + 38, width, 18);

    ctx.restore();
  }

  renderCochleaBarrel(ctx, x1, y1, x2, y2) {
    ctx.save();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);

    ctx.translate(x1, y1);
    ctx.rotate(angle);

    const r = Math.max(0, this.barrelRadius);

    // Transparent Barrel Staves (Outer wooden casing banded with iron strakes)
    ctx.fillStyle = 'rgba(139, 90, 43, 0.18)';
    ctx.fillRect(0, -r, len, r * 2);

    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(0, -r, len, r * 2);

    // Iron Hoops (Circuli Ferrei)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    for (let x = 15; x < len; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, -r);
      ctx.lineTo(x, r);
      ctx.stroke();
    }

    // Central Timber Axis
    const shaftR = r * 0.22;
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(0, -shaftR, len, shaftR * 2);

    // Rotating Helical Wooden Blades (Archimedean helix visualization)
    const turnDist = this.pitchSpacing;
    const phase = this.angle;

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;

    for (let h = 0; h < this.helices; h++) {
      const hOffset = (h / this.helices) * Math.PI * 2;

      ctx.beginPath();
      let started = false;
      for (let x = 0; x <= len; x += 4) {
        const spiralAngle = phase + (x / turnDist) * Math.PI * 2 + hOffset;
        const bladeY = Math.sin(spiralAngle) * (r * 0.92);

        if (!started) {
          ctx.moveTo(x, bladeY);
          started = true;
        } else {
          ctx.lineTo(x, bladeY);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  renderWaterParticles(ctx) {
    ctx.save();
    for (const p of this.waterParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, 3.2), 0, Math.PI * 2);
      ctx.fillStyle = '#4FC3F7';
      ctx.fill();

      // Droplet specular highlight
      ctx.beginPath();
      ctx.arc(p.x - 1, p.y - 1, Math.max(0, 1.2), 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
    ctx.restore();
  }

  renderCrankHandle(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.angle);

    ctx.strokeStyle = '#E6A15C';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(28, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(28, 0, Math.max(0, 5.0), 0, Math.PI * 2);
    ctx.fillStyle = '#D4AF37';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}


// ============================================================================
// SYSTEM 4: HERON'S TEMPLE DOOR AUTOMATION (PNEUMATICA 38)
// ============================================================================

export class HeronTempleDoorSystem {
  constructor(engine) {
    this.engine = engine;
    this.altarFire = true;
    this.altarHeat = 1.0; // 0 to 1 normalized
    this.airPressure = 1.0; // Atmospheres
    this.siphonWaterLevel = 0.6; // Fraction displaced to bucket
    this.bucketY = 0.0; // Dynamic height of counterweight bucket
    this.doorOpenFraction = 0.0; // 0 = closed, 1 = open
    this.counterweightY = 0.0;
    this.fireParticles = [];
  }

  toggleAltarFire() {
    this.altarFire = !this.altarFire;
  }

  update(dt) {
    // Thermal expansion in subterranean airtight bronze globe (Heron Theorema XXXVIII)
    if (this.altarFire) {
      this.altarHeat = Math.min(1.0, this.altarHeat + 0.35 * dt);
    } else {
      this.altarHeat = Math.max(0.0, this.altarHeat - 0.25 * dt);
    }

    // Target displacement: heated air forces water through siphon into suspended bucket
    const targetWaterLevel = 0.15 + this.altarHeat * 0.75;
    this.siphonWaterLevel += (targetWaterLevel - this.siphonWaterLevel) * 0.9 * dt;

    // As bucket fills with water, bucket becomes heavier than counterpoise weight (Pondera)
    const targetDoor = Math.max(0.0, Math.min(1.0, (this.siphonWaterLevel - 0.25) / 0.6));
    this.doorOpenFraction += (targetDoor - this.doorOpenFraction) * 1.5 * dt;

    // Bucket and counterweight vertical travel
    this.bucketY = this.doorOpenFraction * 85.0;
    this.counterweightY = (1.0 - this.doorOpenFraction) * 85.0;

    // Altar flame particles
    const w = this.engine.width;
    const h = this.engine.height;
    const altarX = w * 0.26;
    const altarTopY = h * 0.45;

    if (this.altarFire && this.fireParticles.length < 120) {
      for (let f = 0; f < 2; f++) {
        const fx = altarX + (Math.random() - 0.5) * 35;
        const fy = altarTopY - 5;
        this.fireParticles.push(new FluidParticle(fx, fy, (Math.random() - 0.5) * 12, -35 - Math.random() * 35, 'ember'));
      }
    }

    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const p = this.fireParticles[i];
      p.update(dt, 9.81);
      if (p.life <= 0) this.fireParticles.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h * 0.54;

    // Division between Above-Ground Temple Sanctuary and Subterranean Crypt
    ctx.save();
    // Above ground sanctuary wall
    ctx.fillStyle = '#0f1622';
    ctx.fillRect(0, 0, w, groundY);

    // Subterranean Mystery Crypt (Underworld chamber)
    ctx.fillStyle = '#070b10';
    ctx.fillRect(0, groundY, w, h - groundY);

    // Stone Pavement dividing slab with Classical molding
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY - 14, w, 14);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, groundY - 14, w, 14);
    ctx.restore();

    // Render Altar with Sacred Fire (Ara Sacra)
    const altarX = w * 0.26;
    const altarTopY = h * 0.45;
    this.renderAltar(ctx, altarX, altarTopY, groundY - 14);

    // Render Altar Flame
    for (const p of this.fireParticles) {
      p.render(ctx);
    }

    // Render Monumental Temple Sanctuary Doors (Valvae Templi)
    const doorX = w * 0.72;
    const doorBottomY = groundY - 14;
    this.renderTempleDoors(ctx, doorX, doorBottomY);

    // Render Subterranean Thermal Siphon Globe (Sphaira)
    const globeX = altarX;
    const globeY = groundY + 80;
    this.renderPneumaticGlobe(ctx, globeX, globeY);

    // Render Subterranean Counterweight Bucket (Hydria) & Door Axle Spindles (Scapi)
    const bucketX = doorX - 60;
    const bucketBaseY = groundY + 50 + this.bucketY;
    const counterX = doorX + 60;
    const counterBaseY = groundY + 50 + this.counterweightY;
    this.renderSubterraneanMachinery(ctx, globeX, globeY, bucketX, bucketBaseY, counterX, counterBaseY, doorX, groundY);
  }

  renderAltar(ctx, x, topY, baseY) {
    ctx.save();
    const w = 70;
    const h = baseY - topY;

    // Classical Marble Altar Pedestal (Ara)
    ctx.fillStyle = '#1A2533';
    ctx.fillRect(x - w * 0.5, topY, w, h);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(x - w * 0.5, topY, w, h);

    // Altar Cornice Molding
    ctx.fillStyle = '#28384D';
    ctx.fillRect(x - w * 0.5 - 8, topY, w + 16, 12);
    ctx.strokeRect(x - w * 0.5 - 8, topY, w + 16, 12);

    // Classical Inscription
    ctx.fillStyle = '#D4AF37';
    ctx.font = '8px serif';
    ctx.textAlign = 'center';
    ctx.fillText('ARA SACRA', x, topY + h * 0.55);

    ctx.restore();
  }

  renderTempleDoors(ctx, x, bottomY) {
    ctx.save();
    const doorW = 140;
    const doorH = 175;
    const topY = bottomY - doorH;

    // Temple Architrave & Portal Frame
    ctx.fillStyle = '#141E2B';
    ctx.fillRect(x - doorW * 0.5 - 18, topY - 24, doorW + 36, doorH + 24);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - doorW * 0.5 - 18, topY - 24, doorW + 36, doorH + 24);

    // Temple Pediment Gable (Triangular Tympanum)
    ctx.beginPath();
    ctx.moveTo(x - doorW * 0.5 - 24, topY - 24);
    ctx.lineTo(x, topY - 65);
    ctx.lineTo(x + doorW * 0.5 + 24, topY - 24);
    ctx.closePath();
    ctx.fillStyle = '#1A2536';
    ctx.fill();
    ctx.stroke();

    // Dark Sanctuary Portal Opening
    ctx.fillStyle = '#05070A';
    ctx.fillRect(x - doorW * 0.5, topY, doorW, doorH);

    // Two-Leaf Monumental Bronze Doors (Valvae) with perspective swing
    const leafW = doorW * 0.5;
    const swing = this.doorOpenFraction; // 0 (closed) -> 1 (open)
    const effectiveW = leafW * (1.0 - swing * 0.85);

    // Left Door Leaf
    ctx.save();
    ctx.translate(x - leafW, topY);
    ctx.fillStyle = '#8C6422'; // Imperial Roman Bronze
    ctx.fillRect(0, 0, effectiveW, doorH);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, effectiveW, doorH);

    if (effectiveW > 12) {
      for (let py = 15; py < doorH - 20; py += 35) {
        ctx.strokeRect(4, py, effectiveW - 8, 25);
      }
    }
    ctx.restore();

    // Right Door Leaf
    ctx.save();
    ctx.translate(x + leafW, topY);
    ctx.scale(-1, 1);
    ctx.fillStyle = '#8C6422';
    ctx.fillRect(0, 0, effectiveW, doorH);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, effectiveW, doorH);

    if (effectiveW > 12) {
      for (let py = 15; py < doorH - 20; py += 35) {
        ctx.strokeRect(4, py, effectiveW - 8, 25);
      }
    }
    ctx.restore();

    ctx.restore();
  }

  renderPneumaticGlobe(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const r = 46;

    // Subterranean Airtight Copper Globe (Sphaira)
    const globeGrad = ctx.createRadialGradient(-12, -12, 5, 0, 0, r);
    globeGrad.addColorStop(0, '#FFCCBC');
    globeGrad.addColorStop(0.5, '#D87A56');
    globeGrad.addColorStop(1, '#4E1F18');
    ctx.fillStyle = globeGrad;

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Internal Water Level inside spherical vessel
    const waterFrac = 1.0 - this.siphonWaterLevel * 0.7;
    const waterY = -r + r * 2 * (1.0 - waterFrac);

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, r - 3), 0, Math.PI * 2);
    if (ctx.clip) ctx.clip();

    ctx.fillStyle = 'rgba(41, 182, 246, 0.72)';
    ctx.fillRect(-r, waterY, r * 2, r * 2);
    ctx.restore();

    ctx.restore();
  }

  renderSubterraneanMachinery(ctx, globeX, globeY, bucketX, bucketY, counterX, counterY, doorX, groundY) {
    ctx.save();

    // Siphon Copper Tube (Bent tube connecting globe bottom to suspended bucket)
    ctx.strokeStyle = '#CD7F32';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(globeX, globeY + 20);
    ctx.lineTo(globeX, globeY + 65);
    ctx.lineTo(bucketX, globeY + 65);
    ctx.lineTo(bucketX, bucketY - 20);
    ctx.stroke();

    // Water flowing in siphon tube
    if (this.altarHeat > 0.1) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vertical Door Axle Spindles (Scapi)
    const spindleLeftX = doorX - 35;
    const spindleRightX = doorX + 35;

    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.moveTo(spindleLeftX, groundY);
    ctx.lineTo(spindleLeftX, groundY + 110);
    ctx.moveTo(spindleRightX, groundY);
    ctx.lineTo(spindleRightX, groundY + 110);
    ctx.stroke();

    // Spindle Ropes
    ctx.strokeStyle = '#C49A45';
    ctx.lineWidth = 2.5;

    // Rope to Counterweight Bucket (Hydria)
    ctx.beginPath();
    ctx.moveTo(spindleLeftX, groundY + 30);
    ctx.lineTo(bucketX, bucketY - 12);
    ctx.stroke();

    // Rope to Counterpoise Lead Weight (Pondera)
    ctx.beginPath();
    ctx.moveTo(spindleRightX, groundY + 30);
    ctx.lineTo(counterX, counterY - 12);
    ctx.stroke();

    // Render Suspended Bucket (Hydria)
    ctx.save();
    ctx.translate(bucketX, bucketY);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(-18, -12, 36, 32);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-18, -12, 36, 32);

    // Water level inside bucket
    const bucketWaterH = this.siphonWaterLevel * 24;
    ctx.fillStyle = 'rgba(41, 182, 246, 0.85)';
    ctx.fillRect(-16, 18 - bucketWaterH, 32, bucketWaterH);
    ctx.restore();

    // Render Counterpoise Weight (Plumbum)
    ctx.save();
    ctx.translate(counterX, counterY);
    ctx.fillStyle = '#546E7A';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, 16.0), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}


// ============================================================================
// SYSTEM 5: VITRUVIAN GEAR TRAIN & PILE-DRIVER TRUSS (VITRUVIUS X.1 & X.5)
// ============================================================================

export class VitruvianGearTrussSystem {
  constructor(engine) {
    this.engine = engine;
    this.gears = [];
    this.crankAngle = 0.0;
    this.crankOmega = 0.0;
    this.appliedTorque = 0.0;
    this.ramHeight = 0.0; // Pile-driver hammer height
    this.ramMaxHeight = 165.0;
    this.ramFalling = false;
    this.ramVy = 0.0;
    this.pilePenetration = 0.0; // Soil depth driven
    this.points = [];
    this.constraints = [];

    this.initGears();
    this.initTruss();
  }

  initGears() {
    this.gears = [];
    const w = this.engine.width;
    const h = this.engine.height;

    const baseX = w * 0.32;
    const baseY = h * 0.48;

    // Multi-stage Epicyclic & Spur Gear Reduction Train (64:1 total reduction)
    // Stage 1: Pinion (12 teeth) -> Intermediate Gear A (48 teeth) = 4:1
    const pinion = new SpurGear(baseX, baseY, 22, 12, { isDriven: true, color: '#E6C364', label: '12T' });
    const gear2 = new SpurGear(baseX + 90, baseY, 70, 48, { color: '#CD7F32', label: '48T' });
    pinion.addMesh(gear2, 12 / 48);

    // Stage 2: Co-axial Pinion B (16 teeth) on same shaft as Gear 2 -> Gear 3 (64 teeth) = 4:1
    const pinionB = new SpurGear(baseX + 90, baseY, 28, 16, { color: '#D4AF37', label: '16T' });
    const gear3 = new SpurGear(baseX + 220, baseY, 102, 64, { color: '#B8860B', label: '64T' });
    pinionB.addMesh(gear3, 16 / 64);

    this.gears.push(pinion, gear2, pinionB, gear3);
  }

  initTruss() {
    this.points = [];
    this.constraints = [];

    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h - 60;
    const trussX = w * 0.72;

    // Classical King-Post Timber Pile-Driver Mast (Rhamnus)
    const baseL = new VerletParticle(trussX - 60, groundY, { pinned: true, color: '#8B5A2B' });
    const baseR = new VerletParticle(trussX + 60, groundY, { pinned: true, color: '#8B5A2B' });
    const mastTop = new VerletParticle(trussX, groundY - 260, { pinned: true, color: '#D4AF37' });
    const mastMidL = new VerletParticle(trussX - 35, groundY - 130, { color: '#8B5A2B' });
    const mastMidR = new VerletParticle(trussX + 35, groundY - 130, { color: '#8B5A2B' });

    // Truss Struts
    this.constraints.push(new StructuralConstraint(baseL, mastMidL, { type: 'timber', stiffness: 1.0 }));
    this.constraints.push(new StructuralConstraint(baseR, mastMidR, { type: 'timber', stiffness: 1.0 }));
    this.constraints.push(new StructuralConstraint(mastMidL, mastTop, { type: 'timber', stiffness: 1.0 }));
    this.constraints.push(new StructuralConstraint(mastMidR, mastTop, { type: 'timber', stiffness: 1.0 }));
    this.constraints.push(new StructuralConstraint(mastMidL, mastMidR, { type: 'timber', stiffness: 1.0 }));

    this.points.push(baseL, baseR, mastTop, mastMidL, mastMidR);
  }

  crankForward(amount) {
    const inputGear = this.gears[0];
    if (inputGear) {
      inputGear.omega += amount * 2.8;
      inputGear.angle += amount * 0.3;
    }
  }

  releaseBrake() {
    this.ramFalling = true;
  }

  update(dt) {
    for (const g of this.gears) {
      g.update(dt);
    }

    // Co-axial shaft coupling: Gear 2 and Pinion B share the exact same axle
    if (this.gears.length >= 3) {
      this.gears[2].angle = this.gears[1].angle;
      this.gears[2].omega = this.gears[1].omega;
    }

    // Cable Drum is driven by output Gear 3
    const outputGear = this.gears[3];
    if (outputGear && !this.ramFalling) {
      const liftDelta = outputGear.omega * 18.0 * dt;
      this.ramHeight = Math.min(this.ramMaxHeight, Math.max(0, this.ramHeight + liftDelta));

      // Automatic trip catch release at peak height
      if (this.ramHeight >= this.ramMaxHeight) {
        this.ramFalling = true;
        this.ramVy = 0.0;
      }
    }

    // Free fall gravity impact
    if (this.ramFalling) {
      this.ramVy += 9.81 * 85.0 * dt;
      this.ramHeight -= this.ramVy * dt;

      if (this.ramHeight <= 0) {
        this.ramHeight = 0;
        this.ramFalling = false;
        this.ramVy = 0.0;
        // Impact drives foundation timber pile deeper into soil
        this.pilePenetration = Math.min(85.0, this.pilePenetration + 4.5);
      }
    }
  }

  render(ctx) {
    const w = this.engine.width;
    const h = this.engine.height;
    const groundY = h - 60;

    // Timber Shaft Bearings for Gears
    this.renderGearMountings(ctx);

    // Render Bronze Gears
    for (const g of this.gears) {
      g.render(ctx);
    }

    // Render Timber King-Post Truss
    this.renderTruss(ctx);

    // Render Pile-Driver Hammer (Tistula) & Wooden Oak Piles (Sublicae)
    this.renderPileDriver(ctx, groundY);
  }

  renderGearMountings(ctx) {
    ctx.save();
    const w = this.engine.width;
    const h = this.engine.height;
    const baseX = w * 0.32;
    const baseY = h * 0.48;

    // Heavy Roman Oak base sleepers supporting shaft bearings
    ctx.fillStyle = '#4A2E12';
    ctx.fillRect(baseX - 35, baseY + 65, 310, 22);
    ctx.strokeStyle = '#271708';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(baseX - 35, baseY + 65, 310, 22);

    // Bearing pillows with bronze caps
    const shaftsX = [baseX, baseX + 90, baseX + 220];
    for (const sx of shaftsX) {
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(sx - 12, baseY - 12, 24, 85);
      ctx.strokeStyle = '#D4AF37';
      ctx.strokeRect(sx - 12, baseY - 12, 24, 85);
    }

    ctx.restore();
  }

  renderTruss(ctx) {
    ctx.save();
    for (const c of this.constraints) {
      ctx.beginPath();
      ctx.moveTo(c.p1.x, c.p1.y);
      ctx.lineTo(c.p2.x, c.p2.y);
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 6.0;
      ctx.stroke();

      // Pin joint bolt
      ctx.beginPath();
      ctx.arc(c.p1.x, c.p1.y, Math.max(0, 4.0), 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();
    }
    ctx.restore();
  }

  renderPileDriver(ctx, groundY) {
    ctx.save();
    const w = this.engine.width;
    const trussX = w * 0.72;
    const topY = groundY - 260;

    // Guide mast tracks
    ctx.strokeStyle = '#6D4418';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(trussX - 14, topY);
    ctx.lineTo(trussX - 14, groundY);
    ctx.moveTo(trussX + 14, topY);
    ctx.lineTo(trussX + 14, groundY);
    ctx.stroke();

    // Heavy Iron Rammer / Hammer Weight (Tistula)
    const hammerY = groundY - 45 - this.ramHeight;
    ctx.fillStyle = '#37474F';
    ctx.fillRect(trussX - 22, hammerY - 32, 44, 32);
    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(trussX - 22, hammerY - 32, 44, 32);

    // Hoist Cable running to upper mast sheave
    ctx.strokeStyle = '#C49A45';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(trussX, hammerY - 32);
    ctx.lineTo(trussX, topY + 12);
    ctx.lineTo(w * 0.32 + 220, groundY - 60);
    ctx.stroke();

    // Driven Foundation Timber Pile (Sublica) being driven into soil
    const pileTopY = groundY - 42 + this.pilePenetration * 0.5;
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(trussX - 10, pileTopY, 20, 110);
    ctx.strokeStyle = '#4E342E';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(trussX - 10, pileTopY, 20, 110);

    ctx.restore();
  }
}


// ============================================================================
// MAIN ENGINE CLASS: MechanicaEngine
// ============================================================================

export class MechanicaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Physical Simulation Engine Constants & Config
    this.gravity = 9.81;
    this.cableRigidity = 0.94;
    this.friction = Math.pow(0.985, 8);
    this.boilerHeat = 1.0;
    this.winchTorque = 120.0;
    this.timeScale = 1.0;
    this.substeps = 8; // Multi-pass relaxation solver iterations

    // Active Engineering Preset Selector
    this.activePreset = 'Polyspaston Roman Crane';
    // 'Polyspaston Roman Crane'
    // 'Hero Steam Turbine (Aeolipile)'
    // 'Archimedean Water Screw'
    // 'Temple Automatic Siphon Doors'
    // 'Compound Gear Train & Truss'

    // Interactive Engineering Tool
    this.activeTool = 'Tension / Pull';
    // 'Tension / Pull'
    // 'Shear / Slice Cables'
    // 'Inspect Stress'
    // 'Spawn Load Block'

    // Mouse & Touch Pointer State
    this.isMouseDown = false;
    this.mousePos = new Vec2(0, 0);
    this.dragStartPos = new Vec2(0, 0);
    this.draggedParticle = null;
    this.sliceLine = { p1: new Vec2(0, 0), p2: new Vec2(0, 0), active: false };
    this.inspectedConstraint = null;

    // Subsystem Modules
    this.polyspaston = null;
    this.aeolipile = null;
    this.archimedes = null;
    this.heronDoors = null;
    this.gearTruss = null;

    // Generic Dynamic Particle & Constraint Buffers
    this.dynamicParticles = [];
    this.dynamicConstraints = [];

    // DOM UI cleanup tracking
    this.uiElements = [];

    // Initialize Active Machine & Controls
    this.initSystem();
    this.buildControls();
    attachTouchBridge(this, canvas);
  }

  initSystem() {
    this.dynamicParticles = [];
    this.dynamicConstraints = [];
    this.draggedParticle = null;
    this.inspectedConstraint = null;

    switch (this.activePreset) {
      case 'Polyspaston Roman Crane':
        this.polyspaston = new PolyspastonCraneSystem(this);
        this.aeolipile = null;
        this.archimedes = null;
        this.heronDoors = null;
        this.gearTruss = null;
        break;

      case 'Hero Steam Turbine (Aeolipile)':
        this.aeolipile = new AeolipileSystem(this);
        this.polyspaston = null;
        this.archimedes = null;
        this.heronDoors = null;
        this.gearTruss = null;
        break;

      case 'Archimedean Water Screw':
        this.archimedes = new ArchimedesScrewSystem(this);
        this.polyspaston = null;
        this.aeolipile = null;
        this.heronDoors = null;
        this.gearTruss = null;
        break;

      case 'Temple Automatic Siphon Doors':
        this.heronDoors = new HeronTempleDoorSystem(this);
        this.polyspaston = null;
        this.aeolipile = null;
        this.archimedes = null;
        this.gearTruss = null;
        break;

      case 'Compound Gear Train & Truss':
        this.gearTruss = new VitruvianGearTrussSystem(this);
        this.polyspaston = null;
        this.aeolipile = null;
        this.archimedes = null;
        this.heronDoors = null;
        break;

      default:
        this.polyspaston = new PolyspastonCraneSystem(this);
        break;
    }
  }

  // ==========================================================================
  // DOM CONTROLS BUILDER (CLASSICAL ARCHITECTURAL PALETTE)
  // ==========================================================================

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.controlsContainer.style.color = '#EAE6DF';
    this.controlsContainer.style.fontFamily = "'Cinzel', 'Trajan Pro', 'Georgia', serif, monospace";
    this.controlsContainer.style.fontSize = '12px';
    this.controlsContainer.style.letterSpacing = '0.5px';

    const panel = document.createElement('div');
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '10px';

    // 1. Mechanism Preset Selector
    const presetWrap = document.createElement('div');
    const presetLbl = document.createElement('div');
    presetLbl.textContent = 'ARCHITECTURAL MECHANISM:';
    presetLbl.style.color = '#D4AF37';
    presetLbl.style.fontWeight = 'bold';
    presetLbl.style.marginBottom = '4px';

    const presetSel = document.createElement('select');
    presetSel.style.width = '100%';
    presetSel.style.backgroundColor = '#141D2B';
    presetSel.style.color = '#FFF';
    presetSel.style.border = '1px solid #D4AF37';
    presetSel.style.padding = '5px';
    presetSel.style.borderRadius = '3px';

    const presets = [
      'Polyspaston Roman Crane',
      'Hero Steam Turbine (Aeolipile)',
      'Archimedean Water Screw',
      'Temple Automatic Siphon Doors',
      'Compound Gear Train & Truss'
    ];

    presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (p === this.activePreset) opt.selected = true;
      presetSel.appendChild(opt);
    });

    presetSel.onchange = (e) => {
      this.activePreset = e.target.value;
      this.initSystem();
    };

    presetWrap.appendChild(presetLbl);
    presetWrap.appendChild(presetSel);
    panel.appendChild(presetWrap);

    // 2. Interactive Tool Selector
    const toolWrap = document.createElement('div');
    const toolLbl = document.createElement('div');
    toolLbl.textContent = 'INTERACTION TOOL:';
    toolLbl.style.color = '#00F0FF';
    toolLbl.style.fontWeight = 'bold';
    toolLbl.style.marginBottom = '4px';

    const toolSel = document.createElement('select');
    toolSel.style.width = '100%';
    toolSel.style.backgroundColor = '#141D2B';
    toolSel.style.color = '#FFF';
    toolSel.style.border = '1px solid #00F0FF';
    toolSel.style.padding = '5px';
    toolSel.style.borderRadius = '3px';

    const tools = ['Tension / Pull', 'Shear / Slice Cables', 'Inspect Stress', 'Spawn Load Block'];
    tools.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === this.activeTool) opt.selected = true;
      toolSel.appendChild(opt);
    });

    toolSel.onchange = (e) => {
      this.activeTool = e.target.value;
    };

    toolWrap.appendChild(toolLbl);
    toolWrap.appendChild(toolSel);
    panel.appendChild(toolWrap);

    // 3. Physical Calibration Sliders
    const makeSlider = (label, min, max, step, initial, onChange) => {
      const wrap = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.textContent = `${label}: ${initial}`;
      lbl.style.color = '#C9D1D9';
      lbl.style.fontSize = '11px';

      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = min;
      inp.max = max;
      inp.step = step;
      inp.value = initial;
      inp.style.width = '100%';

      inp.oninput = (e) => {
        const val = parseFloat(e.target.value);
        lbl.textContent = `${label}: ${val}`;
        onChange(val);
      };

      wrap.appendChild(lbl);
      wrap.appendChild(inp);
      panel.appendChild(wrap);
      return inp;
    };

    makeSlider('Gravity (m/s²)', 0, 25, 0.5, this.gravity, v => this.gravity = v);
    makeSlider('Cable Rigidity', 0.5, 1.0, 0.02, this.cableRigidity, v => this.cableRigidity = v);
    makeSlider('Mechanical Friction', 0.80, 0.999, 0.005, this.friction, v => this.friction = v);
    makeSlider('Boiler Heat / Speed', 0.0, 3.0, 0.1, this.boilerHeat, v => {
      this.boilerHeat = v;
      if (this.aeolipile) this.aeolipile.boilerPressureBar = 1.0 + v * 1.5;
    });

    // 4. Action Buttons
    const btnRow = document.createElement('div');
    btnRow.style.display = 'grid';
    btnRow.style.gridTemplateColumns = '1fr 1fr';
    btnRow.style.gap = '6px';
    btnRow.style.marginTop = '6px';

    const makeBtn = (text, onClick, color = '#D4AF37') => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.backgroundColor = '#141D2B';
      btn.style.color = color;
      btn.style.border = `1px solid ${color}`;
      btn.style.padding = '6px';
      btn.style.cursor = 'pointer';
      btn.style.borderRadius = '3px';
      btn.style.fontSize = '10px';
      btn.style.fontWeight = 'bold';
      btn.onclick = onClick;
      btnRow.appendChild(btn);
      return btn;
    };

    makeBtn('CRANK WINCH ▲', () => {
      if (this.polyspaston) this.polyspaston.crankWinch(1.8);
      if (this.gearTruss) this.gearTruss.crankForward(1.5);
    }, '#D4AF37');

    makeBtn('RELEASE BRAKE ▼', () => {
      if (this.polyspaston) this.polyspaston.releaseBrake();
      if (this.gearTruss) this.gearTruss.releaseBrake();
    }, '#FFAB40');

    makeBtn('TOGGLE FIRE / HEAT', () => {
      if (this.aeolipile) this.aeolipile.toggleBoilerFire();
      if (this.heronDoors) this.heronDoors.toggleAltarFire();
    }, '#FF5252');

    makeBtn('SNAP CABLE (STRESS)', () => {
      if (this.polyspaston) this.polyspaston.snapCriticalCable();
    }, '#FF1744');

    panel.appendChild(btnRow);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'RESTORE MACHINE (RESET)';
    resetBtn.style.width = '100%';
    resetBtn.style.backgroundColor = '#1A2332';
    resetBtn.style.color = '#00F0FF';
    resetBtn.style.border = '1px solid #00F0FF';
    resetBtn.style.padding = '8px';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.borderRadius = '3px';
    resetBtn.style.marginTop = '8px';
    resetBtn.style.fontWeight = 'bold';
    resetBtn.onclick = () => this.reset();
    panel.appendChild(resetBtn);

    this.controlsContainer.appendChild(panel);
  }

  // ==========================================================================
  // INPUT EVENT HANDLERS
  // ==========================================================================

  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos.set(pos.x, pos.y);
    this.dragStartPos.set(pos.x, pos.y);

    if (this.activeTool === 'Tension / Pull') {
      this.draggedParticle = this.findNearestParticle(pos.x, pos.y, 40);
    } else if (this.activeTool === 'Shear / Slice Cables') {
      this.sliceLine.active = true;
      this.sliceLine.p1.set(pos.x, pos.y);
      this.sliceLine.p2.set(pos.x, pos.y);
    } else if (this.activeTool === 'Inspect Stress') {
      this.inspectedConstraint = this.findNearestConstraint(pos.x, pos.y, 25);
    } else if (this.activeTool === 'Spawn Load Block') {
      this.spawnLoadBlock(pos.x, pos.y);
    }
  }

  onMouseMove(pos) {
    this.mousePos.set(pos.x, pos.y);

    if (this.isMouseDown) {
      if (this.activeTool === 'Tension / Pull' && this.draggedParticle) {
        this.draggedParticle.x = pos.x;
        this.draggedParticle.y = pos.y;
        this.draggedParticle.oldX = pos.x;
        this.draggedParticle.oldY = pos.y;
      } else if (this.activeTool === 'Shear / Slice Cables' && this.sliceLine.active) {
        this.sliceLine.p2.set(pos.x, pos.y);
        this.performSevering(this.sliceLine.p1, this.sliceLine.p2);
      }
    }
  }

  onMouseUp(pos) {
    if (pos) this.mousePos.set(pos.x, pos.y);
    this.isMouseDown = false;
    this.draggedParticle = null;
    this.sliceLine.active = false;
  }

  onKeyDown(key, e) {
    if (!key) return;
    const k = String(key).toLowerCase();

    switch (k) {
      case ' ':
        // Crank machine
        if (this.polyspaston) this.polyspaston.crankWinch(1.5);
        if (this.gearTruss) this.gearTruss.crankForward(1.2);
        break;
      case 'b':
        if (this.polyspaston) this.polyspaston.releaseBrake();
        if (this.gearTruss) this.gearTruss.releaseBrake();
        break;
      case 'f':
        if (this.aeolipile) this.aeolipile.toggleBoilerFire();
        if (this.heronDoors) this.heronDoors.toggleAltarFire();
        break;
      case 's':
        if (this.polyspaston) this.polyspaston.snapCriticalCable();
        break;
      case 'r':
        this.reset();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5': {
        const presets = [
          'Polyspaston Roman Crane',
          'Hero Steam Turbine (Aeolipile)',
          'Archimedean Water Screw',
          'Temple Automatic Siphon Doors',
          'Compound Gear Train & Truss'
        ];
        const idx = parseInt(k, 10) - 1;
        if (presets[idx]) {
          this.activePreset = presets[idx];
          this.initSystem();
          this.buildControls();
        }
        break;
      }
    }
  }

  onKeyUp() {
    // Parity with engine event contract
  }

  // ==========================================================================
  // PHYSICAL UTILITIES & CUTTING / SLICING
  // ==========================================================================

  findNearestParticle(x, y, maxDist = 35) {
    let nearest = null;
    let minDist = maxDist;

    const testList = [];
    if (this.polyspaston) testList.push(...this.polyspaston.points);
    if (this.gearTruss) testList.push(...this.gearTruss.points);
    testList.push(...this.dynamicParticles);

    for (const p of testList) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }
    return nearest;
  }

  findNearestConstraint(x, y, maxDist = 25) {
    let nearest = null;
    let minDist = maxDist;

    const testList = [];
    if (this.polyspaston) testList.push(...this.polyspaston.constraints);
    if (this.gearTruss) testList.push(...this.gearTruss.constraints);
    testList.push(...this.dynamicConstraints);

    for (const c of testList) {
      if (c.broken) continue;
      const d = distToSegment(x, y, c.p1.x, c.p1.y, c.p2.x, c.p2.y);
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    }
    return nearest;
  }

  performSevering(q1, q2) {
    const list = [];
    if (this.polyspaston) list.push(...this.polyspaston.constraints);
    if (this.gearTruss) list.push(...this.gearTruss.constraints);
    list.push(...this.dynamicConstraints);

    for (const c of list) {
      if (c.broken) continue;
      if (testSegmentIntersection(c.p1, c.p2, q1, q2)) {
        c.broken = true;
        c.flashTimer = 0.45;
      }
    }
  }

  spawnLoadBlock(x, y) {
    const w = 48;
    const h = 32;
    const p1 = new VerletParticle(x - w * 0.5, y - h * 0.5, { mass: 20, color: '#EAE6DF' });
    const p2 = new VerletParticle(x + w * 0.5, y - h * 0.5, { mass: 20, color: '#EAE6DF' });
    const p3 = new VerletParticle(x + w * 0.5, y + h * 0.5, { mass: 20, color: '#EAE6DF' });
    const p4 = new VerletParticle(x - w * 0.5, y + h * 0.5, { mass: 20, color: '#EAE6DF' });

    // Box constraints with internal cross bracing
    this.dynamicConstraints.push(new StructuralConstraint(p1, p2, { type: 'timber', stiffness: 0.98 }));
    this.dynamicConstraints.push(new StructuralConstraint(p2, p3, { type: 'timber', stiffness: 0.98 }));
    this.dynamicConstraints.push(new StructuralConstraint(p3, p4, { type: 'timber', stiffness: 0.98 }));
    this.dynamicConstraints.push(new StructuralConstraint(p4, p1, { type: 'timber', stiffness: 0.98 }));
    this.dynamicConstraints.push(new StructuralConstraint(p1, p3, { type: 'timber', stiffness: 0.98 }));
    this.dynamicConstraints.push(new StructuralConstraint(p2, p4, { type: 'timber', stiffness: 0.98 }));

    this.dynamicParticles.push(p1, p2, p3, p4);
  }

  // ==========================================================================
  // SIMULATION UPDATE
  // ==========================================================================

  update(dt = 0.016) {
    const safeDt = Math.min(0.05, Math.max(0.001, dt)) * this.timeScale;
    const subDt = safeDt / this.substeps;

    // Sub-step Verlet Physics Loop
    for (let step = 0; step < this.substeps; step++) {
      // 1. Particle Integration
      const allParticles = [];
      if (this.polyspaston) allParticles.push(...this.polyspaston.points);
      if (this.gearTruss) allParticles.push(...this.gearTruss.points);
      allParticles.push(...this.dynamicParticles);

      for (const p of allParticles) {
        p.integrate(subDt, 0, this.gravity * 45.0, this.friction);
        p.constrainBounds(this.width, this.height, 60);
      }

      // 2. Constraint Relaxation Solving
      const allConstraints = [];
      if (this.polyspaston) allConstraints.push(...this.polyspaston.constraints);
      if (this.gearTruss) allConstraints.push(...this.gearTruss.constraints);
      allConstraints.push(...this.dynamicConstraints);

      for (const c of allConstraints) {
        c.solve();
        if (c.flashTimer > 0) {
          c.flashTimer -= subDt;
        }
      }
    }

    // Update active system-specific kinematics and thermodynamics
    if (this.polyspaston) this.polyspaston.update(safeDt);
    if (this.aeolipile) this.aeolipile.update(safeDt);
    if (this.archimedes) this.archimedes.update(safeDt);
    if (this.heronDoors) this.heronDoors.update(safeDt);
    if (this.gearTruss) this.gearTruss.update(safeDt);
  }

  // ==========================================================================
  // RENDERING PIPELINE: CLASSICAL BLUEPRINT & HUD
  // ==========================================================================

  render(ctx = this.ctx) {
    if (!ctx) return;

    ctx.save();

    // Deep Indigo / Slate Architectural Blueprint Background
    ctx.fillStyle = '#0c1017';
    ctx.fillRect(0, 0, this.width, this.height);

    // Blueprint Grid Coordinates & Metric Division Marks
    this.renderBlueprintGrid(ctx);

    // Classical Architectural Border & Corner Rivets
    this.renderBlueprintBorder(ctx);

    // Render Active Mechanical Machine System
    if (this.polyspaston) this.polyspaston.render(ctx);
    if (this.aeolipile) this.aeolipile.render(ctx);
    if (this.archimedes) this.archimedes.render(ctx);
    if (this.heronDoors) this.heronDoors.render(ctx);
    if (this.gearTruss) this.gearTruss.render(ctx);

    // Render Dynamic Particles & Constraint Blocks
    this.renderDynamicEntities(ctx);

    // Slicing Cross-Section Laser / Chisel Line
    if (this.sliceLine.active) {
      this.renderSliceLine(ctx);
    }

    // Telemetry & Engineering HUD Overlay
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderBlueprintGrid(ctx) {
    ctx.save();
    const w = this.width;
    const h = this.height;

    // Major Grid (80px divisions)
    ctx.strokeStyle = '#141d2b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 80) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += 80) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Minor Subdivision Grid (20px fine divisions)
    ctx.strokeStyle = '#0f1722';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 20) {
      if (x % 80 === 0) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += 20) {
      if (y % 80 === 0) continue;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  renderBlueprintBorder(ctx) {
    ctx.save();
    const w = this.width;
    const h = this.height;

    // Outer Architectural Inset Border
    ctx.strokeStyle = '#27384e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Inner Delicate Border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    // Corner Brass Rivets
    const corners = [
      [14, 14],
      [w - 14, 14],
      [14, h - 14],
      [w - 14, h - 14]
    ];
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, 3.5), 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();
      ctx.strokeStyle = '#141D2B';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderDynamicEntities(ctx) {
    ctx.save();
    for (const c of this.dynamicConstraints) {
      c.render(ctx);
    }
    for (const p of this.dynamicParticles) {
      p.render(ctx);
    }
    ctx.restore();
  }

  renderSliceLine(ctx) {
    ctx.save();
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(this.sliceLine.p1.x, this.sliceLine.p1.y);
    ctx.lineTo(this.sliceLine.p2.x, this.sliceLine.p2.y);
    ctx.stroke();

    // Severing cursor icon
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.sliceLine.p2.x, this.sliceLine.p2.y, Math.max(0, 4.0), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ==========================================================================
  // CANVAS HUD: GAUGES, MECHANICAL ADVANTAGE, HISTORICAL SCHOLIA
  // ==========================================================================

  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    // 1. Top Architectural Cartouche Title Block
    this.renderTitleCartouche(ctx, narrow ? 12 : 24, narrow ? 12 : 24, narrow, sw);

    // 2. Mechanical Advantage (MA) Badge & Stress Gauge
    if (narrow) {
      this.renderMABadge(ctx, 12, 66, true);
      this.renderStressGauge(ctx, 146, 66, true, sw);
      if ((this.aeolipile || this.gearTruss) && sh > 480) {
        this.renderRPMGauge(ctx, sw - 45, 84);
      }
      if (sh > 560) {
        this.renderScholiaBanner(ctx, 12, sh - 48, sw - 24);
      }
    } else {
      this.renderMABadge(ctx, sw - 190, 24);
      this.renderStressGauge(ctx, sw - 190, 80);
      if (this.aeolipile || this.gearTruss) {
        this.renderRPMGauge(ctx, sw - 110, 160);
      }
      this.renderScholiaBanner(ctx, 24, sh - 52, sw - 48);
    }

    ctx.restore();
  }

  renderTitleCartouche(ctx, x, y, narrow = false, sw = 800) {
    ctx.save();
    ctx.translate(x, y);

    const cartW = narrow ? Math.min(sw - 24, 290) : 290;

    // Blueprint Cartouche Plaque
    ctx.fillStyle = 'rgba(12, 20, 31, 0.85)';
    ctx.fillRect(0, 0, cartW, 48);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, cartW, 48);

    // Classical Epigraphy
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px serif';
    ctx.fillText('PLINY GAME LAB • LIBER X: MECHANICA', 10, 16);

    ctx.fillStyle = '#EAE6DF';
    ctx.font = '10px monospace';
    ctx.fillText(`SYS: ${this.activePreset.toUpperCase()}`, 10, 32);

    ctx.fillStyle = '#00F0FF';
    ctx.font = '9px monospace';
    ctx.fillText(`TOOL: [${this.activeTool.toUpperCase()}]`, 10, 43);

    ctx.restore();
  }

  renderMABadge(ctx, x, y, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    let ma = 1.0;
    if (this.activePreset === 'Polyspaston Roman Crane') ma = 8.0;
    else if (this.activePreset === 'Archimedean Water Screw') ma = 4.0;
    else if (this.activePreset === 'Temple Automatic Siphon Doors') ma = 6.0;
    else if (this.activePreset === 'Compound Gear Train & Truss') ma = 16.0;
    else if (this.activePreset === 'Hero Steam Turbine (Aeolipile)') ma = 1.0;

    const w = compact ? 124 : 165;
    const h = compact ? 40 : 48;

    // Cartouche Box
    ctx.fillStyle = 'rgba(12, 20, 31, 0.85)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, h);

    ctx.fillStyle = '#00F0FF';
    ctx.font = compact ? 'bold 8.5px monospace' : 'bold 10px monospace';
    ctx.fillText(compact ? 'MECH ADV' : 'MECHANICAL ADVANTAGE', 8, compact ? 13 : 15);

    ctx.fillStyle = '#FFF';
    ctx.font = compact ? 'bold 13px monospace' : 'bold 16px monospace';
    ctx.fillText(`MA = ${ma.toFixed(1)}:1`, 8, compact ? 30 : 36);

    ctx.restore();
  }

  renderStressGauge(ctx, x, y, compact = false, sw = 800) {
    ctx.save();
    ctx.translate(x, y);

    // Compute peak stress across active constraints
    let maxStress = 0;
    let limitStress = 500;
    const testList = [];
    if (this.polyspaston) testList.push(...this.polyspaston.constraints);
    if (this.gearTruss) testList.push(...this.gearTruss.constraints);

    for (const c of testList) {
      if (!c.broken && c.currentStress > maxStress) {
        maxStress = c.currentStress;
        limitStress = c.maxTensileStress;
      }
    }

    const stressRatio = Math.min(1.0, maxStress / Math.max(1.0, limitStress));

    const w = compact ? Math.min(165, sw - x - 12) : 165;
    const h = compact ? 40 : 44;

    // Gauge container
    ctx.fillStyle = 'rgba(12, 20, 31, 0.85)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, h);

    ctx.fillStyle = '#D4AF37';
    ctx.font = '9px monospace';
    ctx.fillText(`STRESS: ${maxStress.toFixed(0)}/${limitStress} MPa`, 6, compact ? 12 : 14);

    // Progress Bar Track
    const barW = Math.max(20, w - 16);
    const barH = compact ? 10 : 12;
    ctx.fillStyle = '#141D2B';
    ctx.fillRect(8, compact ? 18 : 22, barW, barH);

    // Color gradient based on fracture proximity
    let fillCol = '#00F0FF';
    if (stressRatio > 0.85) fillCol = '#FF1744';
    else if (stressRatio > 0.65) fillCol = '#FF9100';
    else if (stressRatio > 0.40) fillCol = '#D4AF37';

    ctx.fillStyle = fillCol;
    ctx.fillRect(8, compact ? 18 : 22, barW * stressRatio, barH);
    ctx.strokeStyle = '#394B61';
    ctx.strokeRect(8, compact ? 18 : 22, barW, barH);

    ctx.restore();
  }

  renderRPMGauge(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    let rpm = 0;
    if (this.aeolipile) rpm = this.aeolipile.rpm;
    else if (this.gearTruss && this.gearTruss.gears[0]) rpm = Math.abs((this.gearTruss.gears[0].omega * 60) / (Math.PI * 2));

    const r = 38;

    // Dial background
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 20, 31, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Scale ticks
    for (let a = -Math.PI * 0.75; a <= Math.PI * 0.75; a += Math.PI * 0.25) {
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cos * (r - 8), sin * (r - 8));
      ctx.lineTo(cos * (r - 2), sin * (r - 2));
      ctx.strokeStyle = '#C9D1D9';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Needle Angle
    const maxRpm = this.aeolipile ? 1200 : 180;
    const frac = Math.min(1.0, rpm / maxRpm);
    const needleAngle = -Math.PI * 0.75 + frac * (Math.PI * 1.5);

    ctx.rotate(needleAngle);
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r - 10, 0);
    ctx.stroke();

    // Center brass cap
    ctx.rotate(-needleAngle);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, 4.0), 0, Math.PI * 2);
    ctx.fillStyle = '#D4AF37';
    ctx.fill();

    // RPM Text
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${rpm.toFixed(0)} RPM`, 0, r + 14);

    ctx.restore();
  }

  renderScholiaBanner(ctx, x, y, customW) {
    ctx.save();
    ctx.translate(x, y);
    const w = customW || (this.width - 48);

    let scholia = MECHANICA_SCHOLIA.polyspaston;
    if (this.activePreset === 'Hero Steam Turbine (Aeolipile)') scholia = MECHANICA_SCHOLIA.aeolipile;
    else if (this.activePreset === 'Archimedean Water Screw') scholia = MECHANICA_SCHOLIA.cochlea;
    else if (this.activePreset === 'Temple Automatic Siphon Doors') scholia = MECHANICA_SCHOLIA.templeDoors;
    else if (this.activePreset === 'Compound Gear Train & Truss') scholia = MECHANICA_SCHOLIA.gearTrain;

    // Parchment Plaque
    ctx.fillStyle = 'rgba(12, 20, 31, 0.9)';
    ctx.fillRect(0, 0, w, 40);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(0, 0, w, 40);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 9px serif';
    ctx.fillText(scholia.title, 8, 12);

    ctx.fillStyle = '#A0AEC0';
    ctx.font = 'italic 8.5px serif';
    ctx.fillText(`"${scholia.latin.substring(0, 95)}..."`, 8, 24);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '8px monospace';
    ctx.fillText(scholia.english.substring(0, 110), 8, 35);

    ctx.restore();
  }

  // ==========================================================================
  // ENGINE LIFECYCLE, RESIZE, RESET & CLEANUP
  // ==========================================================================

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  reset() {
    this.initSystem();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.dynamicParticles = [];
    this.dynamicConstraints = [];
    this.polyspaston = null;
    this.aeolipile = null;
    this.archimedes = null;
    this.heronDoors = null;
    this.gearTruss = null;
  }

  getEntityCount() {
    let count = this.dynamicParticles.length + this.dynamicConstraints.length;
    if (this.polyspaston) {
      count += this.polyspaston.points.length + this.polyspaston.constraints.length;
    }
    if (this.aeolipile) {
      count += 1 + this.aeolipile.steamParticles.length + this.aeolipile.flameParticles.length;
    }
    if (this.archimedes) {
      count += 1 + this.archimedes.waterParticles.length;
    }
    if (this.heronDoors) {
      count += 2 + this.heronDoors.fireParticles.length;
    }
    if (this.gearTruss) {
      count += this.gearTruss.gears.length + this.gearTruss.points.length + this.gearTruss.constraints.length;
    }
    return Math.max(1, count);
  }
}
