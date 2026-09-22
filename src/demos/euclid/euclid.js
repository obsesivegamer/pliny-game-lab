// Pliny Game Lab — Euclid (Geometric Construction & Analytical Intersections)
// Pure ES module with zero external dependencies.
// Analytical straightedge & compass geometry solver with line-line, line-circle,
// circle-circle intersections, magnetic point snapping, dynamic theorem presets
// from Euclid's Elements (Στοιχεῖα, c. 300 BC), and dark parchment blueprint styling.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

// -----------------------------------------------------------------------------
// Constants & Theme Palette (Parchment Dark Blueprint)
// -----------------------------------------------------------------------------

export const EUCLID_PALETTE = {
  bg: '#0A0D14',              // Deep indigo blueprint background
  gridMinor: 'rgba(28, 42, 68, 0.28)',
  gridMajor: 'rgba(45, 75, 120, 0.38)',
  gridAxis: 'rgba(59, 214, 198, 0.22)',
  gold: '#D4AF37',            // Classical Hellenistic Gold
  goldGlow: 'rgba(212, 175, 55, 0.45)',
  goldFill: 'rgba(212, 175, 55, 0.14)',
  cyan: '#3BD6C6',            // Aegean Cyan
  cyanGlow: 'rgba(59, 214, 198, 0.45)',
  cyanFill: 'rgba(59, 214, 198, 0.12)',
  white: '#E8EDF5',
  silver: '#A6B4C9',
  dim: '#4A5568',
  amber: '#E5A93C',
  ruby: '#E05A47',
  intersection: '#FF6B8B',
  snapReticle: '#3BD6C6'
};

const GREEK_ALPHABET = [
  'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ',
  'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π',
  'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'
];

export const TOOLS = {
  POINT: 'point',
  STRAIGHTEDGE: 'straightedge',
  COMPASS: 'compass',
  POLYGON: 'polygon',
  PERP_BISECTOR: 'perp-bisector'
};

// -----------------------------------------------------------------------------
// Analytical Geometric Solvers
// -----------------------------------------------------------------------------

function distSq(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

function dist(p1, p2) {
  return Math.sqrt(distSq(p1, p2));
}

// Line-Line Intersection (Analytical)
function intersectLineLine(p1, p2, p3, p4, infinite = true) {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-9) return null; // Parallel or coincident

  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  const u = ((p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1) / denom;

  if (!infinite) {
    if (t < -0.01 || t > 1.01 || u < -0.01 || u > 1.01) return null;
  }

  return {
    x: p1.x + t * dx1,
    y: p1.y + t * dy1,
    t,
    u
  };
}

// Line-Circle Intersection (Analytical)
function intersectLineCircle(p1, p2, center, radius) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  if (a < 1e-9) return [];

  const b = 2 * (fx * dx + fy * dy);
  const c = (fx * fx + fy * fy) - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < -1e-6) return []; // No intersection

  if (Math.abs(discriminant) <= 1e-6) {
    // 1 tangent point
    const t = -b / (2 * a);
    return [{ x: p1.x + t * dx, y: p1.y + t * dy }];
  }

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  return [
    { x: p1.x + t1 * dx, y: p1.y + t1 * dy },
    { x: p1.x + t2 * dx, y: p1.y + t2 * dy }
  ];
}

// Circle-Circle Intersection (Analytical)
function intersectCircleCircle(c1, r1, c2, r2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d < 1e-7) return []; // Concentric
  if (d > r1 + r2 + 1e-6) return []; // Separate
  if (d < Math.abs(r1 - r2) - 1e-6) return []; // Contained within

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSq = r1 * r1 - a * a;
  if (hSq < -1e-6) return [];
  const h = Math.sqrt(Math.max(0, hSq));

  const mx = c1.x + (a * dx) / d;
  const my = c1.y + (a * dy) / d;

  if (h < 1e-5) {
    return [{ x: mx, y: my }];
  }

  const rx = -dy * (h / d);
  const ry = dx * (h / d);

  return [
    { x: mx + rx, y: my + ry },
    { x: mx - rx, y: my - ry }
  ];
}

// -----------------------------------------------------------------------------
// Theorem Definitions (Euclid's Elements)
// -----------------------------------------------------------------------------

export const THEOREMS = [
  {
    id: 'prop1',
    name: 'Book I, Prop 1: Equilateral Triangle',
    greekTitle: 'Στοιχεῖα Αʹ: Πρότασις αʹ',
    subtitle: 'On a given finite straight line, to construct an equilateral triangle.',
    desc: 'Constructing circles with radii equal to segment AB from endpoints A and B. Their intersection forms a perfect equilateral triangle.',
    buildSteps: (cx, cy) => {
      const len = 160;
      const ax = cx - len * 0.5;
      const ay = cy + 45;
      const bx = cx + len * 0.5;
      const by = ay;
      const pA = { id: 'pt-A', label: 'Α', x: ax, y: ay, isFixed: true };
      const pB = { id: 'pt-B', label: 'Β', x: bx, y: by, isFixed: true };

      const inters = intersectCircleCircle(pA, len, pB, len);
      const topInter = inters.find(p => p.y < ay) || { x: cx, y: ay - len * Math.sin(Math.PI / 3) };
      const pGamma = { id: 'pt-G', label: 'Γ', x: topInter.x, y: topInter.y, isFixed: true };

      return [
        {
          step: 1,
          instruction: 'Given finite straight line segment ΑΒ.',
          greekQuote: 'Ἔστω ἡ δοθεῖσα εὐθεῖα πεπερασμένη ἡ ΑΒ.',
          points: [pA, pB],
          lines: [{ id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }],
          circles: [],
          polys: []
        },
        {
          step: 2,
          instruction: 'With center Α and radius ΑΒ, describe circle ΒΓΔ (⊙Α).',
          greekQuote: 'Κέντρῳ μὲν τῷ Α διαστήματι δὲ τῷ ΑΒ κύκλος γεγράφθω ὁ ΒΓΔ.',
          points: [pA, pB],
          lines: [{ id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }],
          circles: [{ id: 'c-A', center: pA, radius: len, color: EUCLID_PALETTE.cyan, style: 'solid' }],
          polys: []
        },
        {
          step: 3,
          instruction: 'With center Β and radius ΒΑ, describe circle ΑΓΕ (⊙Β).',
          greekQuote: 'Καὶ πάλιν κέντρῳ τῷ Β διαστήματι δὲ τῷ ΒΑ κύκλος γεγράφθω ὁ ΑΓΕ.',
          points: [pA, pB],
          lines: [{ id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }],
          circles: [
            { id: 'c-A', center: pA, radius: len, color: EUCLID_PALETTE.cyan, style: 'solid' },
            { id: 'c-B', center: pB, radius: len, color: EUCLID_PALETTE.cyan, style: 'solid' }
          ],
          polys: []
        },
        {
          step: 4,
          instruction: 'From intersection point Γ, draw straight lines ΓΑ and ΓΒ.',
          greekQuote: 'Καὶ ἀπὸ τοῦ Γ σημείου ἐπὶ τὰ Α, Β σημεῖα ἐπεζεύχθωσαν εὐθεῖαι αἱ ΓΑ, ΓΒ.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'ln-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.gold, style: 'solid', width: 2 },
            { id: 'ln-GB', p1: pGamma, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2 }
          ],
          circles: [
            { id: 'c-A', center: pA, radius: len, color: 'rgba(59, 214, 198, 0.45)', style: 'dashed' },
            { id: 'c-B', center: pB, radius: len, color: 'rgba(59, 214, 198, 0.45)', style: 'dashed' }
          ],
          polys: [
            { pts: [pA, pB, pGamma], color: EUCLID_PALETTE.goldFill, stroke: EUCLID_PALETTE.gold }
          ]
        },
        {
          step: 5,
          instruction: 'Triangle ΑΒΓ is equilateral, since ΑΓ = ΑΒ and ΒΓ = ΑΒ. Ὅπερ ἔδει ποιῆσαι (Q.E.F.)',
          greekQuote: 'Ἰσόπλευρον ἄρα ἐστὶ τὸ ΑΒΓ τρίγωνον συνέσταται ἐπὶ τῆς δοθείσης εὐθείας.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 3 },
            { id: 'ln-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.gold, style: 'solid', width: 3 },
            { id: 'ln-GB', p1: pGamma, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 3 }
          ],
          circles: [
            { id: 'c-A', center: pA, radius: len, color: 'rgba(59, 214, 198, 0.3)', style: 'dashed' },
            { id: 'c-B', center: pB, radius: len, color: 'rgba(59, 214, 198, 0.3)', style: 'dashed' }
          ],
          polys: [
            { pts: [pA, pB, pGamma], color: 'rgba(212, 175, 55, 0.28)', stroke: EUCLID_PALETTE.gold }
          ]
        }
      ];
    }
  },

  {
    id: 'prop10',
    name: 'Book I, Prop 10: Segment Bisection (Perpendicular)',
    greekTitle: 'Στοιχεῖα Αʹ: Πρότασις ιʹ',
    subtitle: 'To bisect a given finite straight line segment.',
    desc: 'Drawing overlapping circles from both endpoints and connecting their upper and lower intersection points cuts segment AB exactly in half at 90 degrees.',
    buildSteps: (cx, cy) => {
      const len = 170;
      const ax = cx - len * 0.5;
      const ay = cy;
      const bx = cx + len * 0.5;
      const by = cy;

      const pA = { id: 'pt-A', label: 'Α', x: ax, y: ay, isFixed: true };
      const pB = { id: 'pt-B', label: 'Β', x: bx, y: by, isFixed: true };

      const r = len * 0.72;
      const inters = intersectCircleCircle(pA, r, pB, r);
      const topP = inters[0] || { x: cx, y: cy - 75 };
      const botP = inters[1] || { x: cx, y: cy + 75 };

      const pGamma = { id: 'pt-G', label: 'Γ', x: topP.x, y: topP.y, isFixed: true };
      const pDelta = { id: 'pt-D', label: 'Δ', x: botP.x, y: botP.y, isFixed: true };
      const pEpsilon = { id: 'pt-E', label: 'Ε', x: cx, y: cy, isFixed: true };

      return [
        {
          step: 1,
          instruction: 'Given finite line segment ΑΒ to be bisected.',
          greekQuote: 'Ἔστω ἡ δοθεῖσα εὐθεῖα πεπερασμένη ἡ ΑΒ.',
          points: [pA, pB],
          lines: [{ id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }],
          circles: [],
          polys: []
        },
        {
          step: 2,
          instruction: 'Describe intersecting circles ⊙Α and ⊙Β with equal radii greater than half ΑΒ.',
          greekQuote: 'Κέντροις μὲν τοῖς Α, Β διαστήματι δὲ μείζονι ἢ τῷ ἡμίσει κύκλοι γεγράφθωσαν.',
          points: [pA, pB],
          lines: [{ id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }],
          circles: [
            { id: 'c-A', center: pA, radius: r, color: EUCLID_PALETTE.cyan, style: 'solid' },
            { id: 'c-B', center: pB, radius: r, color: EUCLID_PALETTE.cyan, style: 'solid' }
          ],
          polys: []
        },
        {
          step: 3,
          instruction: 'Mark the dual intersection points Γ and Δ of the two circles.',
          greekQuote: 'Καὶ ἐπεὶ τέμνουσιν ἀλλήλους οἱ κύκλοι κατὰ τὰ Γ, Δ σημεῖα.',
          points: [pA, pB, pGamma, pDelta],
          lines: [{ id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }],
          circles: [
            { id: 'c-A', center: pA, radius: r, color: 'rgba(59, 214, 198, 0.4)', style: 'dashed' },
            { id: 'c-B', center: pB, radius: r, color: 'rgba(59, 214, 198, 0.4)', style: 'dashed' }
          ],
          polys: []
        },
        {
          step: 4,
          instruction: 'Draw straight line ΓΔ connecting the intersection points with straightedge.',
          greekQuote: 'Ἐπεζεύχθω ἡ ΓΔ.',
          points: [pA, pB, pGamma, pDelta, pEpsilon],
          lines: [
            { id: 'ln-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'ln-GD', p1: pGamma, p2: pDelta, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 }
          ],
          circles: [
            { id: 'c-A', center: pA, radius: r, color: 'rgba(59, 214, 198, 0.3)', style: 'dashed' },
            { id: 'c-B', center: pB, radius: r, color: 'rgba(59, 214, 198, 0.3)', style: 'dashed' }
          ],
          polys: []
        },
        {
          step: 5,
          instruction: 'Line ΓΔ intersects ΑΒ at point Ε. Point Ε bisects segment ΑΒ (ΑΕ = ΕΒ) perpendicularly. Q.E.F.',
          greekQuote: 'Ἡ ἄρα δοθεῖσα εὐθεῖα πεπερασμένη ἡ ΑΒ δίχα τέτμηται κατὰ τὸ Ε σημεῖον.',
          points: [pA, pB, pGamma, pDelta, pEpsilon],
          lines: [
            { id: 'ln-AE', p1: pA, p2: pEpsilon, color: EUCLID_PALETTE.gold, style: 'solid', width: 3 },
            { id: 'ln-EB', p1: pEpsilon, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 3 },
            { id: 'ln-GD', p1: pGamma, p2: pDelta, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2 }
          ],
          circles: [],
          polys: []
        }
      ];
    }
  },

  {
    id: 'prop47',
    name: 'Book I, Prop 47: Pythagorean Theorem',
    greekTitle: 'Στοιχεῖα Αʹ: Πρότασις μζʹ',
    subtitle: 'The square on the hypotenuse equals the sum of the squares on the legs.',
    desc: "Euclid's classic 'Bride's Chair' proof (τὸ θεώρημα τῆς νύμφης): constructing squares on all 3 sides of a right triangle.",
    buildSteps: (cx, cy) => {
      // Scale 3:4:5 right triangle
      const s = 24;
      const legA = 4 * s; // 96
      const legB = 3 * s; // 72

      const pA = { id: 'p-A', label: 'Α', x: cx - 40, y: cy + 10, isFixed: true };
      const pB = { id: 'p-B', label: 'Β', x: pA.x + legA, y: pA.y, isFixed: true };
      const pGamma = { id: 'p-G', label: 'Γ', x: pA.x, y: pA.y - legB, isFixed: true };

      // Square on leg A (bottom, AB)
      const sqAB_3 = { x: pB.x, y: pB.y + legA };
      const sqAB_4 = { x: pA.x, y: pA.y + legA };

      // Square on leg B (left, AΓ)
      const sqAG_3 = { x: pGamma.x - legB, y: pGamma.y };
      const sqAG_4 = { x: pA.x - legB, y: pA.y };

      // Square on hypotenuse (BΓ)
      const hdx = pB.x - pGamma.x;
      const hdy = pB.y - pGamma.y;
      const sqHyp_3 = { x: pB.x + hdy, y: pB.y - hdx };
      const sqHyp_4 = { x: pGamma.x + hdy, y: pGamma.y - hdx };

      return [
        {
          step: 1,
          instruction: 'Given right-angled triangle ΑΒΓ with right angle at Α.',
          greekQuote: 'Ἔστω τρίγωνον ὀρθογώνιον τὸ ΑΒΓ ὀρθὴν ἔχον τὴν ὑπὸ ΒΑΓ γωνίαν.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'l-AG', p1: pA, p2: pGamma, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.white, style: 'solid', width: 3 }
          ],
          circles: [],
          polys: [
            { pts: [pA, pB, pGamma], color: 'rgba(255, 255, 255, 0.08)', stroke: EUCLID_PALETTE.white }
          ]
        },
        {
          step: 2,
          instruction: 'Describe square ΑΒΔΕ on side ΑΒ (area = a²).',
          greekQuote: 'Ἀναγεγράφθω γὰρ ἀπὸ μὲν τῆς ΑΒ τετράγωνον.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'l-AG', p1: pA, p2: pGamma, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.white, style: 'solid', width: 3 }
          ],
          circles: [],
          polys: [
            { pts: [pA, pB, sqAB_3, sqAB_4], color: EUCLID_PALETTE.goldFill, stroke: EUCLID_PALETTE.gold }
          ]
        },
        {
          step: 3,
          instruction: 'Describe square ΑΓΖΗ on side ΑΓ (area = b²).',
          greekQuote: 'Ἀπὸ δὲ τῆς ΑΓ τὸ ΑΓΖΗ τετράγωνον.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'l-AG', p1: pA, p2: pGamma, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.white, style: 'solid', width: 3 }
          ],
          circles: [],
          polys: [
            { pts: [pA, pB, sqAB_3, sqAB_4], color: EUCLID_PALETTE.goldFill, stroke: EUCLID_PALETTE.gold },
            { pts: [pA, pGamma, sqAG_3, sqAG_4], color: EUCLID_PALETTE.cyanFill, stroke: EUCLID_PALETTE.cyan }
          ]
        },
        {
          step: 4,
          instruction: 'Describe square ΒΓΘΚ on the hypotenuse ΒΓ (area = c²).',
          greekQuote: 'Ἀπὸ δὲ τῆς ΒΓ τὸ ΒΓΘΚ τετράγωνον.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'l-AG', p1: pA, p2: pGamma, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.white, style: 'solid', width: 3 }
          ],
          circles: [],
          polys: [
            { pts: [pA, pB, sqAB_3, sqAB_4], color: EUCLID_PALETTE.goldFill, stroke: EUCLID_PALETTE.gold },
            { pts: [pA, pGamma, sqAG_3, sqAG_4], color: EUCLID_PALETTE.cyanFill, stroke: EUCLID_PALETTE.cyan },
            { pts: [pB, pGamma, sqHyp_4, sqHyp_3], color: 'rgba(232, 237, 245, 0.16)', stroke: EUCLID_PALETTE.white }
          ]
        },
        {
          step: 5,
          instruction: 'Drop altitude perpendicular to hypotenuse. Area(Hypotenuse) = Area(Side 1) + Area(Side 2). Q.E.D.',
          greekQuote: 'Τὸ ἀπὸ τῆς ΒΓ τετράγωνον ἴσον ἐστὶ τοῖς ἀπὸ τῶν ΒΑ, ΑΓ τετραγώνοις. Ὅπερ ἔδει δεῖξαι.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 },
            { id: 'l-AG', p1: pA, p2: pGamma, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.white, style: 'solid', width: 3 },
            { id: 'l-alt', p1: pA, p2: { x: cx + 45, y: cy - 45 }, color: EUCLID_PALETTE.amber, style: 'dashed', width: 2 }
          ],
          circles: [],
          polys: [
            { pts: [pA, pB, sqAB_3, sqAB_4], color: 'rgba(212, 175, 55, 0.32)', stroke: EUCLID_PALETTE.gold },
            { pts: [pA, pGamma, sqAG_3, sqAG_4], color: 'rgba(59, 214, 198, 0.32)', stroke: EUCLID_PALETTE.cyan },
            { pts: [pB, pGamma, sqHyp_4, sqHyp_3], color: 'rgba(232, 237, 245, 0.22)', stroke: EUCLID_PALETTE.white }
          ]
        }
      ];
    }
  },

  {
    id: 'propIV4',
    name: 'Book IV, Prop 4: Inscribed Circle (Incircle)',
    greekTitle: 'Στοιχεῖα Δʹ: Πρότασις δʹ',
    subtitle: 'In a given triangle, to inscribe a circle.',
    desc: 'Bisecting the interior angles of a triangle with straightedge and compass locates the incenter Z, tangent to all three sides.',
    buildSteps: (cx, cy) => {
      const pA = { id: 'p-A', label: 'Α', x: cx, y: cy - 100, isFixed: true };
      const pB = { id: 'p-B', label: 'Β', x: cx - 130, y: cy + 80, isFixed: true };
      const pGamma = { id: 'p-G', label: 'Γ', x: cx + 130, y: cy + 80, isFixed: true };

      // Incenter calculation
      const a = dist(pB, pGamma);
      const b = dist(pA, pGamma);
      const c = dist(pA, pB);
      const perimeter = a + b + c;

      const incenterX = (a * pA.x + b * pB.x + c * pGamma.x) / perimeter;
      const incenterY = (a * pA.y + b * pB.y + c * pGamma.y) / perimeter;
      const pZeta = { id: 'p-Z', label: 'Ζ', x: incenterX, y: incenterY, isFixed: true };

      // Semi-perimeter & inradius
      const s = perimeter * 0.5;
      const area = Math.sqrt(Math.max(1, s * (s - a) * (s - b) * (s - c)));
      const inradius = area / s;

      return [
        {
          step: 1,
          instruction: 'Given arbitrary triangle ΑΒΓ.',
          greekQuote: 'Ἔστω τὸ δοθὲν τρίγωνον τὸ ΑΒΓ.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 }
          ],
          circles: [],
          polys: [{ pts: [pA, pB, pGamma], color: 'rgba(255, 255, 255, 0.04)', stroke: EUCLID_PALETTE.silver }]
        },
        {
          step: 2,
          instruction: 'Bisect angle ΒΑΓ with ray ΑΔ using compass arcs.',
          greekQuote: 'Τετμήσθω ἡ ὑπὸ ΒΑΓ γωνία δίχα τῇ ΑΔ εὐθείᾳ.',
          points: [pA, pB, pGamma],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'bis-A', p1: pA, p2: { x: incenterX, y: incenterY + 50 }, color: EUCLID_PALETTE.cyan, style: 'dashed', width: 1.5 }
          ],
          circles: [],
          polys: []
        },
        {
          step: 3,
          instruction: 'Bisect angle ΑΒΓ with ray ΒΕ. Their meeting point is incenter Ζ.',
          greekQuote: 'Καὶ τετμήσθω ἡ ὑπὸ ΑΒΓ γωνία δίχα τῇ ΒΕ εὐθείᾳ καὶ συμβαλλέτωσαν ἀλλήλαις κατὰ τὸ Ζ.',
          points: [pA, pB, pGamma, pZeta],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'bis-A', p1: pA, p2: pZeta, color: EUCLID_PALETTE.cyan, style: 'dashed', width: 1.5 },
            { id: 'bis-B', p1: pB, p2: pZeta, color: EUCLID_PALETTE.cyan, style: 'dashed', width: 1.5 }
          ],
          circles: [],
          polys: []
        },
        {
          step: 4,
          instruction: 'From incenter Ζ drop perpendicular to side ΒΓ to determine radius.',
          greekQuote: 'Καὶ ἤχθω ἀπὸ τοῦ Ζ ἐπὶ τὴν ΒΓ κάθετος.',
          points: [pA, pB, pGamma, pZeta],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.silver, style: 'solid', width: 2 },
            { id: 'l-rad', p1: pZeta, p2: { x: incenterX, y: incenterY + inradius }, color: EUCLID_PALETTE.gold, style: 'solid', width: 2 }
          ],
          circles: [
            { id: 'c-incircle', center: pZeta, radius: inradius, color: EUCLID_PALETTE.gold, style: 'solid' }
          ],
          polys: []
        },
        {
          step: 5,
          instruction: 'Describe circle with center Ζ and radius to side. The circle is inscribed in triangle ΑΒΓ. Q.E.F.',
          greekQuote: 'Ὁ ἄρα κέντρῳ τῷ Ζ διαστήματι κύκλος γραφόμενος ἐγγεγραμμένος ἔσται εἰς τὸ ΑΒΓ τρίγωνον.',
          points: [pA, pB, pGamma, pZeta],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 },
            { id: 'l-BG', p1: pB, p2: pGamma, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 },
            { id: 'l-GA', p1: pGamma, p2: pA, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 }
          ],
          circles: [
            { id: 'c-incircle', center: pZeta, radius: inradius, color: EUCLID_PALETTE.gold, style: 'solid', width: 2.5 }
          ],
          polys: [
            { pts: [pA, pB, pGamma], color: 'rgba(59, 214, 198, 0.08)', stroke: EUCLID_PALETTE.cyan }
          ]
        }
      ];
    }
  },

  {
    id: 'propVI30',
    name: 'Book VI, Prop 30: Extreme & Mean Ratio (Golden Section Φ)',
    greekTitle: 'Στοιχεῖα Ϛʹ: Πρότασις λʹ',
    subtitle: 'To cut a given finite straight line in extreme and mean ratio (Φ = 1.618033...).',
    desc: 'Constructing a perpendicular half-length side and swinging compass arcs creates the Divine Proportion where Total / Long = Long / Short.',
    buildSteps: (cx, cy) => {
      const L = 180;
      const pA = { id: 'p-A', label: 'Α', x: cx - L * 0.5, y: cy + 40, isFixed: true };
      const pB = { id: 'p-B', label: 'Β', x: cx + L * 0.5, y: cy + 40, isFixed: true };

      const halfL = L * 0.5;
      const pM = { id: 'p-M', label: 'Μ', x: pB.x, y: pB.y - halfL, isFixed: true };

      const hyp = Math.sqrt(L * L + halfL * halfL);
      // N is on AM at distance halfL from M
      const ux = (pA.x - pM.x) / hyp;
      const uy = (pA.y - pM.y) / hyp;
      const pN = { id: 'p-N', label: 'Ν', x: pM.x + ux * halfL, y: pM.y + uy * halfL, isFixed: true };

      const goldenCut = dist(pA, pN); // ~111.24
      const pP = { id: 'p-P', label: 'Φ', x: pA.x + goldenCut, y: pA.y, isFixed: true };

      return [
        {
          step: 1,
          instruction: 'Given finite line segment ΑΒ of length L.',
          greekQuote: 'Ἔστω ἡ δοθεῖσα εὐθεῖα πεπερασμένη ἡ ΑΒ.',
          points: [pA, pB],
          lines: [{ id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 }],
          circles: [],
          polys: []
        },
        {
          step: 2,
          instruction: 'Erect perpendicular ΒΜ of length L/2 at point Β.',
          greekQuote: 'Ἤχθω τῇ ΑΒ πρὸς ὀρθὰς ἡ ΒΜ ἴση τῇ ἡμισείᾳ τῆς ΑΒ.',
          points: [pA, pB, pM],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 },
            { id: 'l-BM', p1: pB, p2: pM, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-AM', p1: pA, p2: pM, color: EUCLID_PALETTE.silver, style: 'dashed', width: 1.5 }
          ],
          circles: [],
          polys: []
        },
        {
          step: 3,
          instruction: 'With center Μ and radius ΜΒ, describe circle cutting hypotenuse ΑΜ at Ν.',
          greekQuote: 'Κέντρῳ τῷ Μ διαστήματι δὲ τῷ ΜΒ κύκλος γεγράφθω τέμνων τὴν ΑΜ κατὰ τὸ Ν.',
          points: [pA, pB, pM, pN],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 },
            { id: 'l-BM', p1: pB, p2: pM, color: EUCLID_PALETTE.cyan, style: 'solid', width: 2.5 },
            { id: 'l-AM', p1: pA, p2: pM, color: EUCLID_PALETTE.silver, style: 'solid', width: 1.5 }
          ],
          circles: [
            { id: 'c-M', center: pM, radius: halfL, color: EUCLID_PALETTE.cyan, style: 'solid' }
          ],
          polys: []
        },
        {
          step: 4,
          instruction: 'With center Α and radius ΑΝ, describe circle cutting segment ΑΒ at golden section point Φ.',
          greekQuote: 'Κέντρῳ τῷ Α διαστήματι δὲ τῷ ΑΝ κύκλος γεγράφθω τέμνων τὴν ΑΒ κατὰ τὸ Φ.',
          points: [pA, pB, pM, pN, pP],
          lines: [
            { id: 'l-AB', p1: pA, p2: pB, color: EUCLID_PALETTE.white, style: 'solid', width: 2.5 },
            { id: 'l-AM', p1: pA, p2: pM, color: EUCLID_PALETTE.silver, style: 'dashed', width: 1.5 }
          ],
          circles: [
            { id: 'c-M', center: pM, radius: halfL, color: 'rgba(59, 214, 198, 0.3)', style: 'dashed' },
            { id: 'c-A', center: pA, radius: goldenCut, color: EUCLID_PALETTE.gold, style: 'solid' }
          ],
          polys: []
        },
        {
          step: 5,
          instruction: 'Line ΑΒ is cut in extreme and mean ratio: ΑΒ / ΑΦ = ΑΦ / ΦΒ = (1 + √5)/2 = 1.618033... Q.E.F.',
          greekQuote: 'Ἡ ΑΒ ἄρα ἄκρον καὶ μέσον λόγον τέτμηται κατὰ τὸ Φ σημεῖον.',
          points: [pA, pB, pP],
          lines: [
            { id: 'l-AP', p1: pA, p2: pP, color: EUCLID_PALETTE.gold, style: 'solid', width: 3.5 },
            { id: 'l-PB', p1: pP, p2: pB, color: EUCLID_PALETTE.cyan, style: 'solid', width: 3 }
          ],
          circles: [],
          polys: []
        }
      ];
    }
  }
];

// -----------------------------------------------------------------------------
// EuclidEngine Main Class
// -----------------------------------------------------------------------------

export class EuclidEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Simulation Clock & Animation State
    this.time = 0;
    this.dt = 0.016;
    this.animProgress = 1.0;
    this.sweepAngle = Math.PI * 2;

    // Active Tool & Mode
    this.activeTool = TOOLS.POINT;
    this.magneticSnapEnabled = true;
    this.showIntersections = true;
    this.audioEnabled = true;
    this.showGrid = true;
    this.showMeasurements = false;
    this.snapToGridEnabled = false;
    this.gridSize = 32;
    this.currentToolColor = EUCLID_PALETTE.gold;

    // Undo History (Sandbox Mode)
    this.history = [];
    this.maxHistory = 50;

    // Polygon Tool Draft State
    this.polygonDraft = [];

    // Theorems & Presets
    this.selectedTheoremIndex = 0;
    this.currentTheoremStep = 0;
    this.isTheoremMode = true;
    this.autoPlay = false;
    this.autoPlayTimer = 0;

    // Geometric Entities Cache
    this.points = [];
    this.lines = [];
    this.circles = [];
    this.intersections = [];
    this.polygons = [];

    // Free Construction State
    this.dragStart = null;
    this.hoverPoint = null;
    this.snapTarget = null;
    this.mousePos = { x: 400, y: 300, rawX: 400, rawY: 300, isDown: false };

    // Point Label Sequencer
    this.labelIndex = 0;

    // Sound FX (Safe WebAudio initialization)
    this.audioCtx = null;
    this.initAudio();

    // DOM Controls & Initial State Setup
    if (typeof document !== 'undefined') {
      this.buildControls(this.controlsContainer);
    }
    this.reset();
    attachTouchBridge(this, canvas);
  }

  // ---------------------------------------------------------------------------
  // Web Audio Synthesizer (Pythagorean Tuning & Harmonic Chimes)
  // ---------------------------------------------------------------------------

  initAudio() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch {
      this.audioCtx = null;
    }
  }

  playChime(freq = 440, type = 'sine', duration = 0.35, gainLevel = 0.08) {
    if (!this.audioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx || this.audioCtx.state !== 'running') return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainLevel, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // Graceful headless audio fallback
    }
  }

  playConstructionChord() {
    // Pythagorean Dorian chord: D4 (293.7Hz), G4 (392Hz), A4 (440Hz), D5 (587.3Hz)
    const notes = [293.66, 392.00, 440.00, 587.33];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.playChime(f, 'sine', 0.6, 0.06 / (i + 1));
      }, i * 45);
    });
  }

  playSnapPing() {
    this.playChime(880, 'triangle', 0.18, 0.05);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Methods
  // ---------------------------------------------------------------------------

  resize(width, height, dpr = 1) {
    const newW = width || (this.canvas ? this.canvas.width : 800);
    const newH = height || (this.canvas ? this.canvas.height : 600);
    const oldW = this.width;
    const oldH = this.height;

    // Sandbox mode: rescale existing construction proportionally so it is
    // preserved (not clipped/lost) instead of being wiped on resize.
    if (!this.isTheoremMode && oldW > 0 && oldH > 0 && (newW !== oldW || newH !== oldH)) {
      this.rescaleConstruction(newW / oldW, newH / oldH);
    }

    this.width = newW;
    this.height = newH;
    this.dpr = dpr || 1;

    if (this.isTheoremMode) {
      this.loadTheoremStep(this.selectedTheoremIndex, this.currentTheoremStep);
    } else {
      this.recomputeAllIntersections();
    }
  }

  // Scales every free-standing point (and dependent circle radii) so a
  // sandbox construction survives a canvas resize instead of being reset.
  // Lines/circle centers reference point objects, so scaling this.points
  // updates them automatically.
  rescaleConstruction(sx, sy) {
    if (!isFinite(sx) || !isFinite(sy) || sx <= 0 || sy <= 0) return;
    const uniformScale = Math.min(sx, sy);
    const offsetX = (sx - uniformScale) * this.width / (2 * sx);
    const offsetY = (sy - uniformScale) * this.height / (2 * sy);
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      p.x = p.x * uniformScale + offsetX;
      p.y = p.y * uniformScale + offsetY;
    }
    for (let i = 0; i < this.circles.length; i++) {
      this.circles[i].radius *= uniformScale;
    }
    for (let i = 0; i < this.history.length; i++) {
      const snap = this.history[i];
      for (let j = 0; j < snap.points.length; j++) {
        snap.points[j].x = snap.points[j].x * uniformScale + offsetX;
        snap.points[j].y = snap.points[j].y * uniformScale + offsetY;
      }
      for (let j = 0; j < snap.circles.length; j++) {
        snap.circles[j].radius *= uniformScale;
      }
    }
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  update(dt = 0.016) {
    this.dt = dt;
    this.time += dt;

    // Step Animation Progress
    if (this.animProgress < 1.0) {
      this.animProgress = Math.min(1.0, this.animProgress + dt * 2.8);
      this.sweepAngle = this.animProgress * Math.PI * 2;
    }

    // Auto Play Stepper
    if (this.autoPlay && this.isTheoremMode) {
      this.autoPlayTimer += dt;
      if (this.autoPlayTimer > 2.8) {
        this.autoPlayTimer = 0;
        this.nextTheoremStep();
      }
    }

    // Pulse decay on points & intersections
    const allPts = [...this.points, ...this.intersections];
    for (let i = 0; i < allPts.length; i++) {
      const p = allPts[i];
      if (p.pulse && p.pulse > 0) {
        p.pulse = Math.max(0, p.pulse - dt * 2.5);
      }
    }
  }

  getEntityCount() {
    return (
      this.points.length +
      this.lines.length +
      this.circles.length +
      this.intersections.length
    );
  }

  reset() {
    this.labelIndex = 0;
    this.dragStart = null;
    this.snapTarget = null;
    this.polygonDraft = [];
    this.animProgress = 1.0;
    this.sweepAngle = Math.PI * 2;

    if (this.isTheoremMode) {
      this.loadTheoremStep(this.selectedTheoremIndex, 0);
    } else {
      this.points = [];
      this.lines = [];
      this.circles = [];
      this.intersections = [];
      this.polygons = [];
      this.history = [];
    }
  }

  clear() {
    if (!this.isTheoremMode) {
      this.pushHistory();
    }
    this.isTheoremMode = false;
    this.autoPlay = false;
    this.points = [];
    this.lines = [];
    this.circles = [];
    this.intersections = [];
    this.polygons = [];
    this.labelIndex = 0;
    this.dragStart = null;
    this.snapTarget = null;
    this.polygonDraft = [];
    this.updateControlsReadout();
    this.playChime(330, 'triangle', 0.25, 0.06);
  }

  // ---------------------------------------------------------------------------
  // Sandbox Undo History
  // ---------------------------------------------------------------------------

  snapshotState() {
    return {
      points: this.points.map(p => ({ ...p })),
      lines: this.lines.map(l => ({ ...l, p1: { ...l.p1 }, p2: { ...l.p2 } })),
      circles: this.circles.map(c => ({ ...c, center: { ...c.center } })),
      polygons: this.polygons.map(poly => ({ ...poly, pts: poly.pts.map(p => ({ ...p })) })),
      labelIndex: this.labelIndex
    };
  }

  pushHistory() {
    this.history.push(this.snapshotState());
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length === 0) return;
    this.isTheoremMode = false;
    const snapshot = this.history.pop();

    this.points = snapshot.points;
    // Re-link lines/circles/polygons to the restored point objects (by id)
    // so future resizes/rescales keep tracking the live points correctly.
    const byId = new Map(this.points.map(p => [p.id, p]));
    const resolve = (pt) => (pt && pt.id && byId.get(pt.id)) || pt;

    this.lines = snapshot.lines.map(l => ({ ...l, p1: resolve(l.p1), p2: resolve(l.p2) }));
    this.circles = snapshot.circles.map(c => ({ ...c, center: resolve(c.center) }));
    this.polygons = snapshot.polygons.map(poly => ({ ...poly, pts: poly.pts.map(resolve) }));
    this.labelIndex = snapshot.labelIndex;

    this.dragStart = null;
    this.snapTarget = null;
    this.polygonDraft = [];
    this.recomputeAllIntersections();
    this.updateControlsReadout();
    this.playChime(294, 'triangle', 0.2, 0.05);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.autoPlay = false;
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // Safe close
      }
      this.audioCtx = null;
    }
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  // ---------------------------------------------------------------------------
  // Theorem Engine & Step Player
  // ---------------------------------------------------------------------------

  setTheorem(idx) {
    this.selectedTheoremIndex = (idx + THEOREMS.length) % THEOREMS.length;
    this.currentTheoremStep = 0;
    this.isTheoremMode = true;
    this.autoPlay = false;
    this.loadTheoremStep(this.selectedTheoremIndex, 0);
    this.playConstructionChord();
    this.updateControlsReadout();
  }

  nextTheoremStep() {
    const theorem = THEOREMS[this.selectedTheoremIndex];
    if (!theorem) return;
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const steps = theorem.buildSteps(cx, cy);

    if (this.currentTheoremStep < steps.length - 1) {
      this.currentTheoremStep++;
      this.loadTheoremStep(this.selectedTheoremIndex, this.currentTheoremStep);
      this.animProgress = 0.0;
      this.playChime(440 + this.currentTheoremStep * 70, 'sine', 0.35, 0.07);
    } else {
      // Loop or conclude
      this.currentTheoremStep = 0;
      this.loadTheoremStep(this.selectedTheoremIndex, 0);
      this.playConstructionChord();
    }
    this.updateControlsReadout();
  }

  prevTheoremStep() {
    if (this.currentTheoremStep > 0) {
      this.currentTheoremStep--;
      this.loadTheoremStep(this.selectedTheoremIndex, this.currentTheoremStep);
      this.animProgress = 0.0;
      this.playChime(392, 'sine', 0.25, 0.06);
      this.updateControlsReadout();
    }
  }

  loadTheoremStep(theoremIdx, stepIdx) {
    const theorem = THEOREMS[theoremIdx];
    if (!theorem) return;

    const cx = this.width * 0.5;
    const cy = this.height * 0.5 + 20; // Room for top HUD
    const steps = theorem.buildSteps(cx, cy);
    const stepData = steps[Math.min(stepIdx, steps.length - 1)];
    if (!stepData) return;

    this.points = (stepData.points || []).map(p => ({ ...p, pulse: 1.0 }));
    this.lines = (stepData.lines || []).map(l => ({ ...l }));
    this.circles = (stepData.circles || []).map(c => ({ ...c }));
    this.polygons = (stepData.polys || []).map(poly => ({ ...poly }));

    this.recomputeAllIntersections();
  }

  // ---------------------------------------------------------------------------
  // Geometry Creation & Intersection Solver
  // ---------------------------------------------------------------------------

  addPoint(x, y, label = null, color = this.currentToolColor) {
    const lbl = label || this.getNextGreekLabel();
    const newPt = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: lbl,
      x,
      y,
      pulse: 1.0,
      isFixed: false,
      color
    };
    this.points.push(newPt);
    this.recomputeAllIntersections();
    this.playSnapPing();
    return newPt;
  }

  addLine(p1, p2, style = 'solid', color = this.currentToolColor) {
    if (distSq(p1, p2) < 4) return null;
    const newLine = {
      id: `ln-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      p1,
      p2,
      style,
      color: color || EUCLID_PALETTE.gold,
      width: 2.2
    };
    this.lines.push(newLine);
    this.recomputeAllIntersections();
    this.playChime(523.25, 'triangle', 0.3, 0.07);
    return newLine;
  }

  addCircle(center, radius, style = 'solid', color = this.currentToolColor) {
    if (radius < 4) return null;
    const newCircle = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      center,
      radius,
      style,
      color: color || EUCLID_PALETTE.cyan,
      width: 2.0
    };
    this.circles.push(newCircle);
    this.recomputeAllIntersections();
    this.playChime(659.25, 'sine', 0.45, 0.08);
    return newCircle;
  }

  // Constructs the perpendicular bisector of segment p1-p2 using the
  // classical two-circle compass method (Elements I.10), adding the
  // auxiliary construction arcs plus the bisecting line and its points.
  addPerpendicularBisector(p1, p2) {
    const segLen = dist(p1, p2);
    if (segLen < 8) return null;

    const r = segLen * 0.65;
    this.circles.push({
      id: `c-${Date.now()}-pbA`,
      center: p1,
      radius: r,
      style: 'dashed',
      color: 'rgba(59, 214, 198, 0.35)',
      width: 1.4
    });
    this.circles.push({
      id: `c-${Date.now()}-pbB`,
      center: p2,
      radius: r,
      style: 'dashed',
      color: 'rgba(59, 214, 198, 0.35)',
      width: 1.4
    });

    const inters = intersectCircleCircle(p1, r, p2, r);
    let topPt, botPt;
    if (inters.length === 2) {
      topPt = this.addPoint(inters[0].x, inters[0].y);
      botPt = this.addPoint(inters[1].x, inters[1].y);
    } else {
      const mx = (p1.x + p2.x) * 0.5;
      const my = (p1.y + p2.y) * 0.5;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      topPt = this.addPoint(mx + nx * r, my + ny * r);
      botPt = this.addPoint(mx - nx * r, my - ny * r);
    }

    const bisLine = this.addLine(topPt, botPt, 'solid');
    this.playConstructionChord();
    return bisLine;
  }

  getNextGreekLabel() {
    const idx = this.labelIndex;
    this.labelIndex++;
    if (idx < GREEK_ALPHABET.length) {
      return GREEK_ALPHABET[idx];
    }
    const cycle = Math.floor(idx / GREEK_ALPHABET.length);
    const sub = idx % GREEK_ALPHABET.length;
    return `${GREEK_ALPHABET[sub]}${cycle}`;
  }

  recomputeAllIntersections() {
    const inters = [];
    const ptsThresholdSq = 9; // Dedup points within 3px

    const isDuplicate = (x, y) => {
      for (let i = 0; i < this.points.length; i++) {
        if (distSq({ x, y }, this.points[i]) < ptsThresholdSq) return true;
      }
      for (let i = 0; i < inters.length; i++) {
        if (distSq({ x, y }, inters[i]) < ptsThresholdSq) return true;
      }
      return false;
    };

    // 1. Line-Line Intersections
    const L = this.lines.length;
    for (let i = 0; i < L; i++) {
      for (let j = i + 1; j < L; j++) {
        const l1 = this.lines[i];
        const l2 = this.lines[j];
        const pt = intersectLineLine(l1.p1, l1.p2, l2.p1, l2.p2, true);
        if (pt && !isDuplicate(pt.x, pt.y)) {
          // Keep within reasonable viewport bounding box
          if (pt.x > -100 && pt.x < this.width + 100 && pt.y > -100 && pt.y < this.height + 100) {
            inters.push({
              x: pt.x,
              y: pt.y,
              type: 'line-line',
              parents: [l1.id, l2.id],
              pulse: 0
            });
          }
        }
      }
    }

    // 2. Line-Circle Intersections
    const C = this.circles.length;
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < C; j++) {
        const line = this.lines[i];
        const circle = this.circles[j];
        const pts = intersectLineCircle(line.p1, line.p2, circle.center, circle.radius);
        for (let k = 0; k < pts.length; k++) {
          const pt = pts[k];
          if (!isDuplicate(pt.x, pt.y)) {
            inters.push({
              x: pt.x,
              y: pt.y,
              type: 'line-circle',
              parents: [line.id, circle.id],
              pulse: 0
            });
          }
        }
      }
    }

    // 3. Circle-Circle Intersections
    for (let i = 0; i < C; i++) {
      for (let j = i + 1; j < C; j++) {
        const c1 = this.circles[i];
        const c2 = this.circles[j];
        const pts = intersectCircleCircle(c1.center, c1.radius, c2.center, c2.radius);
        for (let k = 0; k < pts.length; k++) {
          const pt = pts[k];
          if (!isDuplicate(pt.x, pt.y)) {
            inters.push({
              x: pt.x,
              y: pt.y,
              type: 'circle-circle',
              parents: [c1.id, c2.id],
              pulse: 0
            });
          }
        }
      }
    }

    this.intersections = inters;
  }

  // ---------------------------------------------------------------------------
  // Magnetic Snapping Engine
  // ---------------------------------------------------------------------------

  findMagneticSnap(pos) {
    if (!this.magneticSnapEnabled) return null;
    const snapRadiusSq = 14 * 14;
    let closestTarget = null;
    let minDSq = snapRadiusSq;

    // 1. High Priority: Explicit Geometric Points
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dSq = distSq(pos, p);
      if (dSq < minDSq) {
        minDSq = dSq;
        closestTarget = { x: p.x, y: p.y, label: p.label, type: 'point', ref: p };
      }
    }

    // 2. High Priority: Analytical Intersection Nodes
    for (let i = 0; i < this.intersections.length; i++) {
      const pt = this.intersections[i];
      const dSq = distSq(pos, pt);
      if (dSq < minDSq) {
        minDSq = dSq;
        closestTarget = { x: pt.x, y: pt.y, label: '∩', type: 'intersection', ref: pt };
      }
    }

    if (closestTarget) return closestTarget;

    // 3. Medium Priority: Projections on Segments / Circles
    const lineSnapRadiusSq = 10 * 10;
    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      const proj = this.getPointLineProjection(pos, l.p1, l.p2);
      const dSq = distSq(pos, proj);
      if (dSq < lineSnapRadiusSq && dSq < minDSq) {
        minDSq = dSq;
        closestTarget = { x: proj.x, y: proj.y, label: '⊥', type: 'line-edge', ref: l };
      }
    }

    for (let i = 0; i < this.circles.length; i++) {
      const c = this.circles[i];
      const d = dist(pos, c.center);
      if (Math.abs(d - c.radius) < 10) {
        const angle = Math.atan2(pos.y - c.center.y, pos.x - c.center.x);
        const cx = c.center.x + Math.cos(angle) * c.radius;
        const cy = c.center.y + Math.sin(angle) * c.radius;
        closestTarget = { x: cx, y: cy, label: '⊙', type: 'circle-edge', ref: c };
        break;
      }
    }

    return closestTarget;
  }

  getPointLineProjection(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lSq = dx * dx + dy * dy;
    if (lSq < 1e-6) return { x: a.x, y: a.y };

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lSq;
    t = Math.max(0, Math.min(1, t)); // Clamped to segment
    return { x: a.x + t * dx, y: a.y + t * dy };
  }

  // ---------------------------------------------------------------------------
  // Input Handling
  // ---------------------------------------------------------------------------

  // Resolves the effective construction position: a magnetic snap target
  // takes priority, otherwise falls back to the nearest grid intersection
  // when "Snap to Grid" is enabled, otherwise the raw cursor position.
  resolveTargetPos(x, y, snap) {
    if (snap) return { x: snap.x, y: snap.y };
    if (this.snapToGridEnabled) return this.snapToGridPos(x, y);
    return { x, y };
  }

  snapToGridPos(x, y) {
    const g = this.gridSize || 32;
    return { x: Math.round(x / g) * g, y: Math.round(y / g) * g };
  }

  onMouseDown(pos) {
    const x = pos?.x ?? 400;
    const y = pos?.y ?? 300;
    this.mousePos.x = x;
    this.mousePos.y = y;
    this.mousePos.isDown = true;

    // Check magnetic snap target
    const snap = this.findMagneticSnap({ x, y });
    const targetPos = this.resolveTargetPos(x, y, snap);

    if (this.activeTool === TOOLS.POINT) {
      this.isTheoremMode = false;
      this.pushHistory();
      this.addPoint(targetPos.x, targetPos.y);
      this.updateControlsReadout();
    } else if (this.activeTool === TOOLS.POLYGON) {
      this.isTheoremMode = false;
      this.handlePolygonClick(targetPos, snap);
      this.updateControlsReadout();
    } else if (
      this.activeTool === TOOLS.STRAIGHTEDGE ||
      this.activeTool === TOOLS.COMPASS ||
      this.activeTool === TOOLS.PERP_BISECTOR
    ) {
      let startPoint = snap?.ref;
      if (!startPoint || snap.type === 'line-edge' || snap.type === 'circle-edge') {
        startPoint = this.addPoint(targetPos.x, targetPos.y);
      }
      this.dragStart = startPoint;
      this.isTheoremMode = false;
    }
  }

  onMouseMove(pos) {
    const x = pos?.x ?? 400;
    const y = pos?.y ?? 300;
    this.mousePos.x = x;
    this.mousePos.y = y;

    const snap = this.findMagneticSnap({ x, y });
    this.snapTarget = snap;
  }

  onMouseUp(pos) {
    if (!this.mousePos.isDown) return;
    this.mousePos.isDown = false;

    const x = pos?.x ?? this.mousePos.x;
    const y = pos?.y ?? this.mousePos.y;
    const snap = this.findMagneticSnap({ x, y });
    const targetPos = this.resolveTargetPos(x, y, snap);

    if (this.dragStart) {
      // One history entry covers the whole drag gesture (endpoint + shape).
      this.pushHistory();

      if (this.activeTool === TOOLS.STRAIGHTEDGE) {
        let endPoint = snap?.ref;
        if (!endPoint || snap.type === 'line-edge' || snap.type === 'circle-edge') {
          endPoint = this.addPoint(targetPos.x, targetPos.y);
        }
        if (endPoint && endPoint !== this.dragStart) {
          this.addLine(this.dragStart, endPoint);
        } else {
          this.history.pop();
        }
      } else if (this.activeTool === TOOLS.COMPASS) {
        const radius = dist(this.dragStart, targetPos);
        if (radius > 5) {
          this.addCircle(this.dragStart, radius);
        } else {
          this.history.pop();
        }
      } else if (this.activeTool === TOOLS.PERP_BISECTOR) {
        let endPoint = snap?.ref;
        if (!endPoint || snap.type === 'line-edge' || snap.type === 'circle-edge') {
          endPoint = this.addPoint(targetPos.x, targetPos.y);
        }
        if (endPoint && endPoint !== this.dragStart) {
          this.addPerpendicularBisector(this.dragStart, endPoint);
        } else {
          this.history.pop();
        }
      } else {
        this.history.pop();
      }
      this.dragStart = null;
      this.updateControlsReadout();
    }
  }

  // Click-to-place vertex handling for the polygon tool. Closes the shape
  // when the user clicks back near the first vertex (min. 3 vertices).
  handlePolygonClick(pos, snap) {
    if (this.polygonDraft.length >= 3) {
      const first = this.polygonDraft[0];
      if (distSq(pos, first) < 196) {
        this.finalizePolygon();
        return;
      }
    }
    let pt = snap && snap.type === 'point' ? snap.ref : null;
    if (!pt) {
      this.pushHistory();
      pt = this.addPoint(pos.x, pos.y);
    }
    if (this.polygonDraft[this.polygonDraft.length - 1] !== pt) {
      this.polygonDraft.push(pt);
    }
  }

  finalizePolygon() {
    if (this.polygonDraft.length < 3) {
      this.polygonDraft = [];
      return;
    }
    this.pushHistory();
    const pts = this.polygonDraft.slice();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      this.addLine(a, b, 'solid');
    }
    this.polygons.push({
      id: `poly-${Date.now()}`,
      pts,
      color: 'rgba(212, 175, 55, 0.14)',
      stroke: this.currentToolColor || EUCLID_PALETTE.gold
    });
    this.polygonDraft = [];
    this.recomputeAllIntersections();
    this.playConstructionChord();
    this.updateControlsReadout();
  }

  onKeyDown(key, event) {
    if (!key) return;
    const k = key.toLowerCase();

    if ((k === 'z') && event && (event.ctrlKey || event.metaKey)) {
      this.undo();
      return;
    }

    switch (k) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        const idx = parseInt(k, 10) - 1;
        if (idx < THEOREMS.length) this.setTheorem(idx);
        break;
      case ' ':
      case 'n':
      case 'arrowright':
        this.nextTheoremStep();
        break;
      case 'arrowleft':
        this.prevTheoremStep();
        break;
      case 'p':
        this.setTool(TOOLS.POINT);
        break;
      case 's':
      case 'l':
        this.setTool(TOOLS.STRAIGHTEDGE);
        break;
      case 'c':
        this.setTool(TOOLS.COMPASS);
        break;
      case 'g':
        this.setTool(TOOLS.POLYGON);
        break;
      case 'b':
        this.setTool(TOOLS.PERP_BISECTOR);
        break;
      case 'z':
        this.undo();
        break;
      case 'r':
        this.reset();
        break;
      case 'x':
      case 'delete':
      case 'backspace':
        this.clear();
        break;
    }
  }

  onKeyUp() {
    // Parity with input contract
  }

  setTool(tool) {
    this.activeTool = tool;
    this.dragStart = null;
    this.polygonDraft = [];
    this.updateControlsReadout();
    this.playChime( tool === TOOLS.POINT ? 520 : tool === TOOLS.STRAIGHTEDGE ? 580 : tool === TOOLS.COMPASS ? 640 : tool === TOOLS.POLYGON ? 700 : 460, 'sine', 0.15, 0.05 );
  }

  // ---------------------------------------------------------------------------
  // Canvas Rendering (Dark Parchment Blueprint & Classical Vector Typography)
  // ---------------------------------------------------------------------------

  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;

    ctx.save();

    // 1. Blueprint Background & Coordinate Grid (toggleable)
    if (this.showGrid) {
      this.renderBlueprintGrid(ctx, w, h);
    } else {
      ctx.fillStyle = EUCLID_PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Render Polygons / Proof Shading
    this.renderPolygons(ctx);

    // 3. Render Circles (Compass Construction Arcs)
    this.renderCircles(ctx);

    // 4. Render Lines & Segment Extensions (Straightedge)
    this.renderLines(ctx);

    // 5. Active Tool Drag Preview
    this.renderToolPreview(ctx);

    // 6. Render Intersection Nodes
    if (this.showIntersections) {
      this.renderIntersections(ctx);
    }

    // 7. Render Geometric Points & Greek Labels
    this.renderPoints(ctx);

    // 8. Angle & Distance Measurements
    if (this.showMeasurements) {
      this.renderMeasurements(ctx);
    }

    // 9. Magnetic Snap Reticle
    if (this.snapTarget) {
      this.renderSnapReticle(ctx, this.snapTarget);
    }

    // 10. Classical Top HUD Banner & Measurement Metadata
    this.renderHUD(ctx, w, h);

    ctx.restore();
  }

  // Distance labels at line midpoints and angle labels wherever two or
  // more constructed lines converge at a shared point.
  renderMeasurements(ctx) {
    ctx.save();
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = EUCLID_PALETTE.amber;

    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      const d = dist(l.p1, l.p2);
      const mx = (l.p1.x + l.p2.x) * 0.5;
      const my = (l.p1.y + l.p2.y) * 0.5;
      ctx.fillText(`${d.toFixed(0)}px`, mx, my - 6);
    }

    const byKey = new Map();
    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      for (const endpoint of [l.p1, l.p2]) {
        const key = endpoint.id || `${endpoint.x.toFixed(1)},${endpoint.y.toFixed(1)}`;
        if (!byKey.has(key)) byKey.set(key, { pt: endpoint, lines: [] });
        byKey.get(key).lines.push(l);
      }
    }

    ctx.fillStyle = EUCLID_PALETTE.ruby;
    for (const { pt, lines } of byKey.values()) {
      if (lines.length < 2) continue;
      for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
          const other1 = lines[i].p1 === pt ? lines[i].p2 : lines[i].p1;
          const other2 = lines[j].p1 === pt ? lines[j].p2 : lines[j].p1;
          const a1 = Math.atan2(other1.y - pt.y, other1.x - pt.x);
          const a2 = Math.atan2(other2.y - pt.y, other2.x - pt.x);
          let deg = Math.abs(((a2 - a1) * 180) / Math.PI) % 360;
          if (deg > 180) deg = 360 - deg;
          const midAngle = (a1 + a2) * 0.5;
          const labelX = pt.x + Math.cos(midAngle) * 26;
          const labelY = pt.y + Math.sin(midAngle) * 26;
          ctx.fillText(`${deg.toFixed(0)}°`, labelX, labelY);
        }
      }
    }
    ctx.restore();
  }

  renderBlueprintGrid(ctx, w, h) {
    ctx.fillStyle = EUCLID_PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    const gridSize = this.gridSize || 32;
    const majorMod = 4;

    ctx.lineWidth = 1;

    // Minor Grid Lines
    ctx.beginPath();
    ctx.strokeStyle = EUCLID_PALETTE.gridMinor;
    for (let x = 0; x < w; x += gridSize) {
      if ((x / gridSize) % majorMod !== 0) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
    }
    for (let y = 0; y < h; y += gridSize) {
      if ((y / gridSize) % majorMod !== 0) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
    }
    ctx.stroke();

    // Major Grid Lines
    ctx.beginPath();
    ctx.strokeStyle = EUCLID_PALETTE.gridMajor;
    for (let x = 0; x < w; x += gridSize * majorMod) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y < h; y += gridSize * majorMod) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    // Center Crosshair
    const cx = Math.floor(w * 0.5) + 0.5;
    const cy = Math.floor(h * 0.5 + 20) + 0.5;
    ctx.strokeStyle = EUCLID_PALETTE.gridAxis;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy);
    ctx.lineTo(cx + 30, cy);
    ctx.moveTo(cx, cy - 30);
    ctx.lineTo(cx, cy + 30);
    ctx.stroke();
  }

  renderPolygons(ctx) {
    for (let i = 0; i < this.polygons.length; i++) {
      const poly = this.polygons[i];
      const pts = poly.pts;
      if (!pts || pts.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let j = 1; j < pts.length; j++) {
        ctx.lineTo(pts[j].x, pts[j].y);
      }
      ctx.closePath();

      if (poly.color) {
        ctx.fillStyle = poly.color;
        ctx.fill();
      }
      if (poly.stroke) {
        ctx.strokeStyle = poly.stroke;
        ctx.lineWidth = poly.width || 1.5;
        ctx.stroke();
      }
    }
  }

  renderCircles(ctx) {
    for (let i = 0; i < this.circles.length; i++) {
      const c = this.circles[i];
      const r = c.radius;
      if (r <= 0) continue;

      ctx.save();
      ctx.strokeStyle = c.color || EUCLID_PALETTE.cyan;
      ctx.lineWidth = c.width || 1.8;

      if (c.style === 'dashed') {
        ctx.setLineDash([5, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.shadowColor = c.color || EUCLID_PALETTE.cyanGlow;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      if (this.animProgress < 1.0 && i === this.circles.length - 1 && this.isTheoremMode) {
        // Compass arc sweep animation
        ctx.arc(c.center.x, c.center.y, r, 0, this.sweepAngle);
      } else {
        ctx.arc(c.center.x, c.center.y, r, 0, Math.PI * 2);
      }
      ctx.stroke();

      // Subtle center dot
      ctx.fillStyle = c.color || EUCLID_PALETTE.cyan;
      ctx.beginPath();
      ctx.arc(c.center.x, c.center.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderLines(ctx) {
    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      const p1 = l.p1;
      const p2 = l.p2;

      ctx.save();
      ctx.strokeStyle = l.color || EUCLID_PALETTE.gold;
      ctx.lineWidth = l.width || 2.2;

      if (l.style === 'dashed') {
        ctx.setLineDash([6, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.shadowColor = l.color || EUCLID_PALETTE.goldGlow;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  renderToolPreview(ctx) {
    if (this.activeTool === TOOLS.POLYGON && this.polygonDraft.length > 0) {
      this.renderPolygonDraft(ctx);
    }

    if (!this.mousePos.isDown || !this.dragStart) return;

    const start = this.dragStart;
    const end = this.snapTarget ? { x: this.snapTarget.x, y: this.snapTarget.y } : this.mousePos;

    ctx.save();
    if (this.activeTool === TOOLS.STRAIGHTEDGE || this.activeTool === TOOLS.PERP_BISECTOR) {
      // Preview line with dashed infinite extension
      ctx.strokeStyle = EUCLID_PALETTE.cyan;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Length indicator readout
      const length = dist(start, end).toFixed(1);
      const midX = (start.x + end.x) * 0.5;
      const midY = (start.y + end.y) * 0.5 - 10;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillStyle = EUCLID_PALETTE.cyan;
      ctx.fillText(`L = ${length}px`, midX, midY);

    } else if (this.activeTool === TOOLS.COMPASS) {
      const radius = dist(start, end);
      ctx.strokeStyle = EUCLID_PALETTE.gold;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Radius line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Radius text
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillStyle = EUCLID_PALETTE.gold;
      ctx.fillText(`R = ${radius.toFixed(1)}px`, (start.x + end.x) * 0.5, (start.y + end.y) * 0.5 - 8);
    }
    ctx.restore();
  }

  renderPolygonDraft(ctx) {
    const pts = this.polygonDraft;
    if (!pts.length) return;

    ctx.save();
    ctx.strokeStyle = this.currentToolColor || EUCLID_PALETTE.gold;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    const cursor = this.snapTarget ? { x: this.snapTarget.x, y: this.snapTarget.y } : this.mousePos;
    ctx.lineTo(cursor.x, cursor.y);
    if (pts.length >= 3) {
      ctx.lineTo(pts[0].x, pts[0].y);
    }
    ctx.stroke();

    // Highlight closing vertex once enough points are placed
    if (pts.length >= 3) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = EUCLID_PALETTE.cyan;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderIntersections(ctx) {
    for (let i = 0; i < this.intersections.length; i++) {
      const pt = this.intersections[i];

      ctx.save();
      ctx.fillStyle = EUCLID_PALETTE.intersection;
      ctx.strokeStyle = EUCLID_PALETTE.bg;
      ctx.lineWidth = 1.5;

      ctx.shadowColor = EUCLID_PALETTE.intersection;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tiny crosshair
      ctx.strokeStyle = EUCLID_PALETTE.intersection;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt.x - 6, pt.y);
      ctx.lineTo(pt.x + 6, pt.y);
      ctx.moveTo(pt.x, pt.y - 6);
      ctx.lineTo(pt.x, pt.y + 6);
      ctx.stroke();

      ctx.restore();
    }
  }

  renderPoints(ctx) {
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const radius = p.isFixed ? 5.5 : 4.5;

      const ptColor = p.color || EUCLID_PALETTE.gold;

      ctx.save();
      ctx.shadowColor = EUCLID_PALETTE.goldGlow;
      ctx.shadowBlur = 8;

      // Outer point ring
      ctx.fillStyle = ptColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner dark core
      ctx.fillStyle = EUCLID_PALETTE.bg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Pulse animation if newly added
      if (p.pulse && p.pulse > 0) {
        ctx.strokeStyle = `rgba(212, 175, 55, ${p.pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + (1.0 - p.pulse) * 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Greek Letter Annotation Badge
      if (p.label) {
        ctx.font = 'bold 13px Cinzel, "Palatino Linotype", Georgia, serif';
        ctx.fillStyle = EUCLID_PALETTE.white;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(p.label, p.x + 9, p.y - 8);
      }

      ctx.restore();
    }
  }

  renderSnapReticle(ctx, snap) {
    ctx.save();
    ctx.strokeStyle = EUCLID_PALETTE.snapReticle;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = EUCLID_PALETTE.cyanGlow;
    ctx.shadowBlur = 10;

    const size = 9;
    ctx.strokeRect(snap.x - size, snap.y - size, size * 2, size * 2);

    // Cross reticles
    ctx.beginPath();
    ctx.moveTo(snap.x - size - 4, snap.y);
    ctx.lineTo(snap.x - size, snap.y);
    ctx.moveTo(snap.x + size, snap.y);
    ctx.lineTo(snap.x + size + 4, snap.y);
    ctx.moveTo(snap.x, snap.y - size - 4);
    ctx.lineTo(snap.x, snap.y - size);
    ctx.moveTo(snap.x, snap.y + size);
    ctx.lineTo(snap.x, snap.y + size + 4);
    ctx.stroke();

    // Snap Tooltip Tag
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = EUCLID_PALETTE.snapReticle;
    const tag = `SNAP [${snap.label}] (${Math.round(snap.x)}, ${Math.round(snap.y)})`;
    ctx.fillText(tag, snap.x + 14, snap.y + 14);

    ctx.restore();
  }

  renderHUD(ctx, w, h) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = w / ui;
    const sh = h / ui;
    const narrow = sw < 560;

    // 1. Top Header Bar
    const headerH = narrow ? 86 : 76;
    ctx.fillStyle = 'rgba(10, 13, 20, 0.88)';
    ctx.fillRect(0, 0, sw, headerH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerH + 0.5);
    ctx.lineTo(sw, headerH + 0.5);
    ctx.stroke();

    // Title & Greek Banner
    ctx.font = `bold ${narrow ? 12 : 15}px Cinzel, "Palatino Linotype", Georgia, serif`;
    ctx.fillStyle = EUCLID_PALETTE.gold;
    ctx.textAlign = 'left';
    ctx.fillText(narrow ? 'ΕΥΚΛΕΙΔΗΣ — ΣΤΟΙΧΕΙΑ' : 'ΕΥΚΛΕΙΔΗΣ — ΣΤΟΙΧΕΙΑ (EUCLID\'S ELEMENTS)', 16, 22);

    // Theorem Information
    if (this.isTheoremMode) {
      const th = THEOREMS[this.selectedTheoremIndex];
      const cx = this.width * 0.5;
      const cy = this.height * 0.5 + 20;
      const steps = th.buildSteps(cx, cy);
      const curStep = steps[Math.min(this.currentTheoremStep, steps.length - 1)];

      ctx.font = `${narrow ? 10.5 : 12}px Cinzel, Georgia, serif`;
      ctx.fillStyle = EUCLID_PALETTE.cyan;
      ctx.fillText(`${th.name} — [Step ${this.currentTheoremStep + 1}/${steps.length}]`, 16, narrow ? 40 : 44);

      ctx.font = `${narrow ? 9.5 : 11}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = EUCLID_PALETTE.silver;
      const instr = curStep ? curStep.instruction : '';
      ctx.fillText(narrow && instr.length > 50 ? `${instr.slice(0, 48)}...` : instr, 16, narrow ? 58 : 62);
    } else {
      ctx.font = `${narrow ? 10.5 : 12}px Cinzel, Georgia, serif`;
      ctx.fillStyle = EUCLID_PALETTE.cyan;
      ctx.fillText(`Free Mode — Tool: ${this.activeTool.toUpperCase()}`, 16, narrow ? 40 : 44);

      ctx.font = `${narrow ? 9.5 : 11}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = EUCLID_PALETTE.silver;
      ctx.fillText('Click & drag to construct lines, circles, points.', 16, narrow ? 58 : 62);
    }

    if (!narrow) {
      // Entity Count Readout (Top Right)
      const entityText = `Entities: ${this.getEntityCount()} (Pts: ${this.points.length} | Lines: ${this.lines.length} | ⊙: ${this.circles.length})`;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillStyle = EUCLID_PALETTE.amber;
      ctx.textAlign = 'right';
      ctx.fillText(entityText, sw - 20, 24);

      // Snap & Audio Indicator
      ctx.fillStyle = this.magneticSnapEnabled ? EUCLID_PALETTE.cyan : EUCLID_PALETTE.dim;
      ctx.fillText(`Magnetic Snap: ${this.magneticSnapEnabled ? 'ON' : 'OFF'}`, sw - 20, 44);
    } else {
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = EUCLID_PALETTE.amber;
      ctx.textAlign = 'left';
      ctx.fillText(`Entities: ${this.getEntityCount()} | Snap: ${this.magneticSnapEnabled ? 'ON' : 'OFF'}`, 16, 74);
    }

    // Bottom Navigation Bar Hints
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(166, 180, 201, 0.65)';
    ctx.font = '10px Cinzel, Georgia, serif';
    ctx.fillText(narrow ? 'Tap/Drag: Construct | Next Step' : '1-5: Theorems | Space/N: Next Step | P/S/C/G/B: Tools | Ctrl+Z: Undo | X: Clear', 16, sh - 14);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // UI Controls (Safe Headless Guard & Dynamic HTML / Event Binding)
  // ---------------------------------------------------------------------------

  buildControls(container = this.controlsContainer) {
    if (!container || typeof document === 'undefined') return;
    this.controlsContainer = container;

    const TOOL_OPTIONS = [
      { value: TOOLS.POINT, label: '• Point' },
      { value: TOOLS.STRAIGHTEDGE, label: '／ Line' },
      { value: TOOLS.COMPASS, label: '⊙ Circle' },
      { value: TOOLS.POLYGON, label: '▱ Polygon' },
      { value: TOOLS.PERP_BISECTOR, label: '⊥ Perp. Bisector' }
    ];

    container.innerHTML = `
      <div class="control-group" style="margin-bottom: 12px; padding: 8px 10px; background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 4px;">
        <label style="display: block; font-weight: bold; color: #D4AF37; margin-bottom: 6px; font-size: 11px; letter-spacing: 1px;">
          🏛️ EUCLID'S THEOREM PRESETS
        </label>
        <select id="sel-euclid-theorem" style="width: 100%; padding: 6px; background: #0A0D14; color: #E8EDF5; border: 1px solid #D4AF37; border-radius: 3px; cursor: pointer; font-size: 11px;">
          ${THEOREMS.map((t, idx) => `<option value="${idx}" ${idx === this.selectedTheoremIndex ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </div>

      <div class="control-group" style="display: flex; gap: 6px; margin-bottom: 12px;">
        <button id="btn-next-step" class="sub-btn" style="flex: 1; background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; color: #D4AF37; font-weight: bold; padding: 8px 4px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          Next Step ➔
        </button>
        <button id="btn-prev-step" class="sub-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.25); color: #E8EDF5; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          ⬅
        </button>
        <button id="btn-autoplay" class="sub-btn" style="background: rgba(59, 214, 198, 0.15); border: 1px solid #3BD6C6; color: #3BD6C6; padding: 8px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          ${this.autoPlay ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div class="control-group" style="margin-bottom: 12px; padding: 8px 10px; background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(59, 214, 198, 0.3); border-radius: 4px;">
        <label style="display: block; font-weight: bold; color: #3BD6C6; margin-bottom: 6px; font-size: 11px; letter-spacing: 1px;">
          📐 CONSTRUCTION TOOL
        </label>
        <select id="sel-tool" style="width: 100%; padding: 6px; background: #0A0D14; color: #E8EDF5; border: 1px solid #3BD6C6; border-radius: 3px; cursor: pointer; font-size: 11px; margin-bottom: 8px;">
          ${TOOL_OPTIONS.map(t => `<option value="${t.value}" ${t.value === this.activeTool ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; color: #C9CDD7;">Tool Color:</span>
          <input type="color" id="color-tool" value="${this.currentToolColor}" style="width: 40px; height: 24px; padding: 0; border: 1px solid #3BD6C6; border-radius: 3px; background: #0A0D14; cursor: pointer;">
        </div>
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #2C1B18; color: #F1C40F; border: 1px solid #D4AF37; border-radius: 3px; font-size: 11px;">
          <span>Magnetic Snapping:</span>
          <input type="checkbox" id="chk-snap" ${this.magneticSnapEnabled ? 'checked' : ''} style="cursor: pointer; accent-color: #3BD6C6;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #2C1B18; color: #F1C40F; border: 1px solid #D4AF37; border-radius: 3px; font-size: 11px;">
          <span>Snap to Grid:</span>
          <input type="checkbox" id="chk-snap-grid" ${this.snapToGridEnabled ? 'checked' : ''} style="cursor: pointer; accent-color: #3BD6C6;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #2C1B18; color: #F1C40F; border: 1px solid #D4AF37; border-radius: 3px; font-size: 11px;">
          <span>Show Grid:</span>
          <input type="checkbox" id="chk-grid" ${this.showGrid ? 'checked' : ''} style="cursor: pointer; accent-color: #3BD6C6;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #2C1B18; color: #F1C40F; border: 1px solid #D4AF37; border-radius: 3px; font-size: 11px;">
          <span>Show Intersections (∩):</span>
          <input type="checkbox" id="chk-inters" ${this.showIntersections ? 'checked' : ''} style="cursor: pointer; accent-color: #FF6B8B;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #2C1B18; color: #F1C40F; border: 1px solid #D4AF37; border-radius: 3px; font-size: 11px;">
          <span>Show Angles/Distances:</span>
          <input type="checkbox" id="chk-measure" ${this.showMeasurements ? 'checked' : ''} style="cursor: pointer; accent-color: #E5A93C;">
        </div>
      </div>

      <div class="control-group" style="display: flex; gap: 6px; margin-bottom: 12px;">
        <button id="btn-undo" class="sub-btn" style="flex: 1; background: rgba(166, 180, 201, 0.15); border: 1px solid #A6B4C9; color: #A6B4C9; font-weight: bold; padding: 7px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          ↺ Undo [Ctrl+Z]
        </button>
        <button id="btn-clear" class="sub-btn" style="flex: 1; background: rgba(224, 90, 71, 0.15); border: 1px solid #E05A47; color: #E05A47; font-weight: bold; padding: 7px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          Clear Canvas [X]
        </button>
      </div>

      <div class="control-group" style="padding: 8px; background: rgba(0, 0, 0, 0.35); border-radius: 4px; font-size: 10px; color: #8E96A4; line-height: 1.4;">
        <div><strong>Euclidean Construction:</strong></div>
        <div>• Postulate 1: Draw straight line between any two points</div>
        <div>• Postulate 2: Produce finite line continuously in a straight line</div>
        <div>• Postulate 3: Describe circle with any center and radius</div>
      </div>
    `;

    // Bind Event Listeners
    const selTheorem = container.querySelector('#sel-euclid-theorem');
    if (selTheorem) {
      selTheorem.addEventListener('change', (e) => {
        this.setTheorem(parseInt(e.target.value, 10));
      });
    }

    const btnNext = container.querySelector('#btn-next-step');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.nextTheoremStep();
      });
    }

    const btnPrev = container.querySelector('#btn-prev-step');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.prevTheoremStep();
      });
    }

    const btnAuto = container.querySelector('#btn-autoplay');
    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        this.autoPlay = !this.autoPlay;
        this.autoPlayTimer = 0;
        btnAuto.textContent = this.autoPlay ? '⏸ Pause' : '▶ Play';
      });
    }

    const selTool = container.querySelector('#sel-tool');
    if (selTool) {
      selTool.addEventListener('change', (e) => {
        this.setTool(e.target.value);
      });
    }

    const colorTool = container.querySelector('#color-tool');
    if (colorTool) {
      colorTool.addEventListener('input', (e) => {
        this.currentToolColor = e.target.value;
      });
    }

    const chkSnap = container.querySelector('#chk-snap');
    if (chkSnap) {
      chkSnap.addEventListener('change', (e) => {
        this.magneticSnapEnabled = e.target.checked;
      });
    }

    const chkSnapGrid = container.querySelector('#chk-snap-grid');
    if (chkSnapGrid) {
      chkSnapGrid.addEventListener('change', (e) => {
        this.snapToGridEnabled = e.target.checked;
      });
    }

    const chkGrid = container.querySelector('#chk-grid');
    if (chkGrid) {
      chkGrid.addEventListener('change', (e) => {
        this.showGrid = e.target.checked;
      });
    }

    const chkInters = container.querySelector('#chk-inters');
    if (chkInters) {
      chkInters.addEventListener('change', (e) => {
        this.showIntersections = e.target.checked;
      });
    }

    const chkMeasure = container.querySelector('#chk-measure');
    if (chkMeasure) {
      chkMeasure.addEventListener('change', (e) => {
        this.showMeasurements = e.target.checked;
      });
    }

    const btnUndo = container.querySelector('#btn-undo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        this.undo();
      });
    }

    const btnClear = container.querySelector('#btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.clear();
      });
    }
  }

  updateControlsReadout() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    const sel = this.controlsContainer.querySelector('#sel-euclid-theorem');
    if (sel && this.isTheoremMode) {
      sel.value = String(this.selectedTheoremIndex);
    }

    const selTool = this.controlsContainer.querySelector('#sel-tool');
    if (selTool && selTool.value !== this.activeTool) {
      selTool.value = this.activeTool;
    }

    const btnUndo = this.controlsContainer.querySelector('#btn-undo');
    if (btnUndo) {
      btnUndo.disabled = this.history.length === 0;
      btnUndo.style.opacity = this.history.length === 0 ? '0.5' : '1';
    }
  }
}
