/**
 * Pliny Game Lab — Antikythera Mechanism (Cosmic Gear Calculator)
 * Pavilion III: Mechanica & Machina
 *
 * Simulates the Hellenistic analog mechanical computer discovered off Antikythera (~150-100 BC).
 * Features:
 *  - Epicyclic gearing: theta_{gear_{n+1}} = -theta_{gear_n} * (T_n / T_{n+1})
 *  - Hipparchus pin-and-slot lunar anomaly mechanism (elliptical lunar orbit emulation)
 *  - Front face: Egyptian 365-day calendar ring, 360-degree Greek Zodiac ring, true Sun pointer,
 *    true Moon pointer with rotating 3D spherical moon phase indicator, and Dragon lunar node pointer
 *  - Rear face: 5-turn Metonic spiral (235 synodic months), 4-year Olympiad dial,
 *    4-turn Saros eclipse spiral (223 lunar months), and Exeligmos dial (54-year triple Saros)
 *  - Core cutaway view: 31 interconnected bronze gears with tooth markers, spokes, and pin-slot kinetics
 *  - Bronze/Copper (#B87333) & Cyber-Teal (#008080, #3BD6C6) glowing lines and readout runes
 *  - Safe headless DOM guard & zero external dependencies.
 */

// Astronomical constants
const DAYS_PER_SOLAR_YEAR = 365.2422;
const DAYS_PER_SYNODIC_MONTH = 29.530588; // New moon to new moon
const DAYS_PER_SIDEREAL_MONTH = 27.321661; // Moon orbit relative to stars
const DAYS_PER_ANOMALISTIC_MONTH = 27.55455; // Perigee to perigee (radial anomaly)
const DAYS_PER_DRACONIC_MONTH = 27.21222; // Node to node (eclipse cycles)
const METONIC_MONTHS = 235; // 19 solar years ~ 235 synodic months ~ 6939.69 days
const SAROS_MONTHS = 223; // 223 synodic months ~ 6585.32 days (18y 11d 8h)
const EXELIGMOS_MONTHS = 669; // 3 Saros cycles ~ 19755.96 days (54y 33d)

const ZODIAC_SIGNS = [
  { name: 'Aries', greek: 'ΚΡΙΟΣ', symbol: '♈', color: '#ff7755' },
  { name: 'Taurus', greek: 'ΤΑΥΡΟΣ', symbol: '♉', color: '#66bb66' },
  { name: 'Gemini', greek: 'ΔΙΔΥΜΟΙ', symbol: '♊', color: '#ffdd55' },
  { name: 'Cancer', greek: 'ΚΑΡΚΙΝΟΣ', symbol: '♋', color: '#44bbff' },
  { name: 'Leo', greek: 'ΛΕΩΝ', symbol: '♌', color: '#ffaa33' },
  { name: 'Virgo', greek: 'ΠΑΡΘΕΝΟΣ', symbol: '♍', color: '#77dd77' },
  { name: 'Libra', greek: 'ΖΥΓΟΣ', symbol: '♎', color: '#ff88cc' },
  { name: 'Scorpio', greek: 'ΣΚΟΡΠΙΟΣ', symbol: '♏', color: '#ff4444' },
  { name: 'Sagittarius', greek: 'ΤΟΞΟΤΗΣ', symbol: '♐', color: '#aa77ff' },
  { name: 'Capricorn', greek: 'ΑΙΓΟΚΕΡΩΣ', symbol: '♑', color: '#8899aa' },
  { name: 'Aquarius', greek: 'ΥΔΡΟΧΟΟΣ', symbol: '♒', color: '#33ccff' },
  { name: 'Pisces', greek: 'ΙΧΘΥΕΣ', symbol: '♓', color: '#55eebb' }
];

const EGYPTIAN_MONTHS = [
  'Thoth', 'Phaophi', 'Athyr', 'Choiak', 'Tybi', 'Mecheir',
  'Phamenoth', 'Pharmouthi', 'Pachon', 'Payni', 'Epiphi', 'Mesore', 'Epagomenae'
];

const OLYMPIAD_GAMES = [
  { year: 1, name: 'Olympia (Olympic Games)', location: 'Elis / Olympia' },
  { year: 2, name: 'Nemea & Isthmia', location: 'Nemea / Corinth' },
  { year: 3, name: 'Pythia (Pythian Games)', location: 'Delphi' },
  { year: 4, name: 'Nemea & Isthmia', location: 'Nemea / Corinth' }
];

// Sample historical eclipse events in Saros cycle
const SAROS_ECLIPSE_GLYPHS = [
  { month: 13, type: 'SOLAR', glyph: 'Σ', hour: 4 },
  { month: 19, type: 'LUNAR', glyph: 'H', hour: 11 },
  { month: 31, type: 'SOLAR', glyph: 'Σ', hour: 18 },
  { month: 37, type: 'LUNAR', glyph: 'H', hour: 2 },
  { month: 49, type: 'SOLAR', glyph: 'Σ', hour: 9 },
  { month: 55, type: 'LUNAR', glyph: 'H', hour: 22 },
  { month: 67, type: 'SOLAR', glyph: 'Σ', hour: 15 },
  { month: 73, type: 'LUNAR', glyph: 'H', hour: 6 },
  { month: 85, type: 'SOLAR', glyph: 'Σ', hour: 0 },
  { month: 91, type: 'LUNAR', glyph: 'H', hour: 13 },
  { month: 103, type: 'SOLAR', glyph: 'Σ', hour: 7 },
  { month: 109, type: 'LUNAR', glyph: 'H', hour: 20 },
  { month: 121, type: 'SOLAR', glyph: 'Σ', hour: 14 },
  { month: 127, type: 'LUNAR', glyph: 'H', hour: 3 },
  { month: 139, type: 'SOLAR', glyph: 'Σ', hour: 21 },
  { month: 145, type: 'LUNAR', glyph: 'H', hour: 10 },
  { month: 157, type: 'SOLAR', glyph: 'Σ', hour: 5 },
  { month: 163, type: 'LUNAR', glyph: 'H', hour: 17 },
  { month: 175, type: 'SOLAR', glyph: 'Σ', hour: 12 },
  { month: 181, type: 'LUNAR', glyph: 'H', hour: 1 },
  { month: 193, type: 'SOLAR', glyph: 'Σ', hour: 19 },
  { month: 199, type: 'LUNAR', glyph: 'H', hour: 8 },
  { month: 211, type: 'SOLAR', glyph: 'Σ', hour: 2 },
  { month: 217, type: 'LUNAR', glyph: 'H', hour: 15 }
];

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class AntikytheraEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Simulation Clock
    this.simDays = 0; // days elapsed from epoch
    this.timeSpeed = 6.0; // simulation days per real second
    this.isPaused = false;

    // Visual & State Options
    this.viewMode = 'front'; // 'front', 'rear', 'gears'
    this.showMoonPhase = true;
    this.showSunPosition = true;
    this.showGlow = true;
    this.showTeeth = true;

    // Interactive Dragging & Selection
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.selectedGear = null;
    this.hoveredGear = null;
    this.hoverPos = { x: 0, y: 0 };

    // Sparks / Mesh contact particles
    this.particles = [];

    // Historical Gears and Dials
    this.gears = [];
    this.dials = [];
    this.pointers = [];

    this.initMechanism();
    this.buildControls();
    attachTouchBridge(this, canvas);
  }

  /* -------------------------------------------------------------------------
   * MECHANISM INITIALIZATION & GEAR TRAIN TOPOLOGY
   * ---------------------------------------------------------------------- */
  initMechanism() {
    this.gears = [];
    this.dials = [];
    this.pointers = [];

    // Standard Module & Scaling for visual layout
    const m = 1.15; // gear module (radius factor per tooth)

    /**
     * Complete 31-gear Antikythera gear train topology:
     * Epicyclic gearing relation:
     * theta_{gear_{n+1}} = -theta_{gear_n} * (T_n / T_{n+1})
     */
    const addGear = (config) => {
      const g = {
        id: config.id,
        name: config.name,
        teeth: config.teeth,
        radius: config.teeth * m * (config.radiusScale || 1.0),
        axle: config.axle || 'A',
        x: config.x || 0,
        y: config.y || 0,
        z: config.z || 0,
        angle: config.initialAngle || 0,
        speedRatio: config.speedRatio || 1.0,
        parentGearId: config.parentGearId || null,
        compoundWith: config.compoundWith || null,
        meshRatio: config.meshRatio || 1.0,
        color: config.color || '#b87333',
        spokes: config.spokes !== undefined ? config.spokes : 4,
        isEccentric: !!config.isEccentric,
        eccentricOffset: config.eccentricOffset || { x: 0, y: 0 },
        hasPin: !!config.hasPin,
        hasSlot: !!config.hasSlot,
        pinRadius: config.pinRadius || 0,
        slotLength: config.slotLength || 0,
        cycleName: config.cycleName || 'Mechanical Transmission'
      };
      this.gears.push(g);
      return g;
    };

    // 1. AXLE A: Input Crank & Contrate Gear
    addGear({
      id: 'A1',
      name: 'A1 Contrate Crown Crank Gear',
      teeth: 48,
      axle: 'A',
      x: 230,
      y: 0,
      z: 1,
      speedRatio: 4.0, // 4 turns of crank = 1 solar year (via 48 -> 64 ratio)
      color: '#cd7f32',
      spokes: 6,
      cycleName: 'Input Drive / Manual Crank'
    });

    // 2. AXLE B: Main Solar Drive Wheel (Center of Machine, 1 rev/solar year)
    addGear({
      id: 'B1',
      name: 'B1 Main Solar Drive Wheel',
      teeth: 64,
      axle: 'B',
      x: 0,
      y: 0,
      z: 0,
      speedRatio: 1.0, // 1 rev per year
      parentGearId: 'A1',
      meshRatio: -48 / 64,
      color: '#d4af37',
      spokes: 8,
      cycleName: 'Solar Year (365.24 Days)'
    });
    addGear({
      id: 'B2',
      name: 'B2 Solar Secondary Pinion',
      teeth: 32,
      axle: 'B',
      x: 0,
      y: 0,
      z: 2,
      speedRatio: 1.0,
      compoundWith: 'B1',
      color: '#b87333',
      spokes: 4,
      cycleName: 'Solar Train Auxiliary'
    });
    addGear({
      id: 'B3',
      name: 'B3 Main Epicyclic Crown Driver',
      teeth: 64,
      axle: 'B',
      x: 0,
      y: 0,
      z: -1,
      speedRatio: 1.0,
      compoundWith: 'B1',
      color: '#c5832b',
      spokes: 6,
      cycleName: 'Differential Carrier Drive'
    });

    // 3. AXLE C: First Intermediate Step-Up
    // C1 meshes with B2: speed = -1.0 * (32 / 38) = -0.8421
    addGear({
      id: 'C1',
      name: 'C1 Intermediate Reduction Gear',
      teeth: 38,
      axle: 'C',
      x: -68,
      y: -52,
      z: 2,
      parentGearId: 'B2',
      meshRatio: -32 / 38,
      color: '#b87333',
      spokes: 4,
      cycleName: 'Lunar Train Primary Step'
    });
    addGear({
      id: 'C2',
      name: 'C2 Intermediate Step-Up Gear',
      teeth: 48,
      axle: 'C',
      x: -68,
      y: -52,
      z: 3,
      compoundWith: 'C1',
      color: '#c5832b',
      spokes: 4,
      cycleName: 'Lunar Train Step-Up'
    });

    // 4. AXLE D: Second Lunar Transfer Step
    // D1 meshes with C2: speed = omega_C * (-48 / 24) = 2 * omega_C
    addGear({
      id: 'D1',
      name: 'D1 Lunar Intermediate Pinion',
      teeth: 24,
      axle: 'D',
      x: -128,
      y: -10,
      z: 3,
      parentGearId: 'C2',
      meshRatio: -48 / 24,
      color: '#b87333',
      spokes: 4,
      cycleName: 'Lunar Speed Doubler'
    });
    // D2 has 127 teeth! 127 is the legendary prime factor: 2 * 127 = 254 sidereal months per 19 solar years!
    addGear({
      id: 'D2',
      name: 'D2 Metonic 127-Tooth Lunar Wheel',
      teeth: 127,
      radiusScale: 0.72,
      axle: 'D',
      x: -128,
      y: -10,
      z: 4,
      compoundWith: 'D1',
      color: '#008080',
      spokes: 8,
      cycleName: '254 Sidereal Month Constant (127-Tooth Master)'
    });

    // 5. AXLE E: Epicyclic Turntable & Carrier Assembly
    // E1 meshes with D2: speed = omega_D * (-127 / 32)
    addGear({
      id: 'E1',
      name: 'E1 Lunar Epicyclic Input Pinion',
      teeth: 32,
      axle: 'E',
      x: 0,
      y: -115,
      z: 4,
      parentGearId: 'D2',
      meshRatio: -127 / 32,
      color: '#3bd6c6',
      spokes: 4,
      cycleName: 'Sidereal Lunar Transfer'
    });
    addGear({
      id: 'E2',
      name: 'E2 Epicyclic Carrier Driver',
      teeth: 32,
      axle: 'E',
      x: 0,
      y: -115,
      z: 5,
      compoundWith: 'E1',
      color: '#b87333',
      spokes: 4,
      cycleName: 'Carrier Plate Rotation'
    });
    addGear({
      id: 'E5',
      name: 'E5 Large Epicyclic Turntable Ring',
      teeth: 223,
      radiusScale: 0.54,
      axle: 'E',
      x: 0,
      y: -115,
      z: -2,
      speedRatio: 1.0 / 18.03, // Saros period
      color: '#2a6a6a',
      spokes: 12,
      cycleName: 'Epicyclic Apsidal Precession Ring'
    });

    // 6. AXLE K: Hipparchus Pin-and-Slot Epicyclic Anomaly
    // K1 and K2 are equal 50-tooth gears, but mounted with an eccentric offset of ~1.1mm (here 7px)!
    // K1 has a protruding driving pin; K2 has a radial slot.
    // As they rotate, the pin slides in the slot, producing variable angular velocity reproducing Kepler's 2nd Law!
    addGear({
      id: 'K1',
      name: 'K1 Pin Driving Gear (Hipparchus Anomaly)',
      teeth: 50,
      axle: 'K',
      x: -46,
      y: -115,
      z: 6,
      parentGearId: 'E2',
      meshRatio: -32 / 50,
      color: '#e59b4c',
      spokes: 5,
      hasPin: true,
      pinRadius: 28,
      cycleName: 'Hipparchus Lunar Anomaly (Pin Drive)'
    });
    addGear({
      id: 'K2',
      name: 'K2 Slotted Follower Gear (Eccentric Axis)',
      teeth: 50,
      axle: 'K_eccentric',
      x: -46 + 6.5, // 6.5px eccentric displacement!
      y: -115 - 3.5,
      z: 7,
      isEccentric: true,
      eccentricOffset: { x: 6.5, y: -3.5 },
      hasSlot: true,
      slotLength: 36,
      color: '#3bd6c6',
      spokes: 5,
      cycleName: 'True Anomalistic Lunar Motion (Slot Follower)'
    });

    // 7. AXLE F: Lunar Pointer Shaft & Bevel Differential
    addGear({
      id: 'F1',
      name: 'F1 Lunar Output Pinion',
      teeth: 48,
      axle: 'F',
      x: 0,
      y: 0,
      z: 8,
      parentGearId: 'K2',
      meshRatio: -50 / 48,
      color: '#e0e5eb',
      spokes: 6,
      cycleName: 'True Lunar Output to Front Dial'
    });
    addGear({
      id: 'F2',
      name: 'F2 Lunar Center Shaft Collar',
      teeth: 20,
      axle: 'F',
      x: 0,
      y: 0,
      z: 9,
      compoundWith: 'F1',
      color: '#b0b8c4',
      spokes: 4,
      cycleName: 'Moon Pointer Arbor'
    });

    // Differential Bevel Gears for Moon Phase Ball:
    // Subtracts Sun angle from Moon angle: theta_phase = theta_moon - theta_sun
    addGear({
      id: 'M_bevel_sun',
      name: 'M_sun Differential Bevel (Solar Input)',
      teeth: 16,
      axle: 'Bevel',
      x: 22,
      y: 18,
      z: 10,
      color: '#d4af37',
      spokes: 3,
      cycleName: 'Synodic Moon Phase Subtractor'
    });
    addGear({
      id: 'M_bevel_diff',
      name: 'M_diff Planetary Bevel Idler',
      teeth: 16,
      axle: 'Bevel',
      x: 32,
      y: 0,
      z: 10,
      color: '#cd7f32',
      spokes: 3,
      cycleName: 'Differential Cage Bevel'
    });
    addGear({
      id: 'M_bevel_moon',
      name: 'M_moon Output Bevel (Phase Sphere Drive)',
      teeth: 16,
      axle: 'Bevel',
      x: 22,
      y: -18,
      z: 10,
      color: '#e0e5eb',
      spokes: 3,
      cycleName: 'Moon Phase Sphere Axle'
    });

    // 8. AXLE L & M: Metonic 19-Year Train (Upper Rear Spiral)
    // 235 synodic months in 19 solar years
    addGear({
      id: 'L1',
      name: 'L1 Metonic Intermediate Pinion',
      teeth: 38,
      axle: 'L',
      x: 75,
      y: -70,
      z: 2,
      parentGearId: 'B2',
      meshRatio: -32 / 38,
      color: '#b87333',
      spokes: 4,
      cycleName: 'Metonic Train Step 1'
    });
    addGear({
      id: 'L2',
      name: 'L2 Metonic Intermediate Step',
      teeth: 53,
      axle: 'L',
      x: 75,
      y: -70,
      z: 3,
      compoundWith: 'L1',
      color: '#cd7f32',
      spokes: 5,
      cycleName: 'Metonic Train Step 2'
    });
    addGear({
      id: 'M1',
      name: 'M1 Metonic Transfer Wheel',
      teeth: 96,
      radiusScale: 0.8,
      axle: 'M',
      x: 145,
      y: -115,
      z: 3,
      parentGearId: 'L2',
      meshRatio: -53 / 96,
      color: '#d4af37',
      spokes: 6,
      cycleName: 'Metonic Synchronizer'
    });
    addGear({
      id: 'M2',
      name: 'M2 Metonic Reduction Pinion',
      teeth: 15,
      axle: 'M',
      x: 145,
      y: -115,
      z: 4,
      compoundWith: 'M1',
      color: '#b87333',
      spokes: 3,
      cycleName: 'Metonic Pinion'
    });
    addGear({
      id: 'N1',
      name: 'N1 Metonic 235-Month Spiral Wheel',
      teeth: 60,
      axle: 'N',
      x: 88,
      y: -175,
      z: 4,
      parentGearId: 'M2',
      meshRatio: -15 / 60,
      color: '#008080',
      spokes: 6,
      cycleName: 'Metonic 5-Turn 235-Month Dial Driver'
    });
    addGear({
      id: 'N2',
      name: 'N2 Olympiad Step-Down Pinion',
      teeth: 15,
      axle: 'N',
      x: 88,
      y: -175,
      z: 5,
      compoundWith: 'N1',
      color: '#c5832b',
      spokes: 3,
      cycleName: 'Olympiad Reduction'
    });

    // 9. AXLE O: 4-Year Olympiad Games Dial
    // 4-year cycle: Olympia (Yr 1), Nemea/Isthmia (Yr 2), Pythia (Yr 3), Nemea/Isthmia (Yr 4)
    addGear({
      id: 'O1',
      name: 'O1 Olympiad 4-Year Cycle Dial Gear',
      teeth: 60,
      axle: 'O',
      x: 165,
      y: -175,
      z: 5,
      parentGearId: 'N2',
      meshRatio: -15 / 60,
      color: '#ffd700',
      spokes: 4,
      cycleName: 'Olympiad 4-Year Panhellenic Cycle'
    });

    // 10. AXLE P & Q: Saros 223-Month Eclipse Train (Lower Rear Spiral)
    // 223 synodic months = 18.03 years eclipse prediction cycle
    addGear({
      id: 'P1',
      name: 'P1 Saros Intermediate Transfer',
      teeth: 60,
      axle: 'P',
      x: 65,
      y: 95,
      z: 2,
      parentGearId: 'B2',
      meshRatio: -32 / 60,
      color: '#b87333',
      spokes: 5,
      cycleName: 'Saros Train Step 1'
    });
    addGear({
      id: 'P2',
      name: 'P2 Saros Transfer Pinion',
      teeth: 30,
      axle: 'P',
      x: 65,
      y: 95,
      z: 3,
      compoundWith: 'P1',
      color: '#c5832b',
      spokes: 4,
      cycleName: 'Saros Train Step 2'
    });
    addGear({
      id: 'Q1',
      name: 'Q1 Saros Spiral Driver Gear',
      teeth: 60,
      axle: 'Q',
      x: 125,
      y: 155,
      z: 3,
      parentGearId: 'P2',
      meshRatio: -30 / 60,
      color: '#3bd6c6',
      spokes: 6,
      cycleName: 'Saros 4-Turn 223-Month Dial Driver'
    });
    addGear({
      id: 'Q2',
      name: 'Q2 Saros Follower Step Pinion',
      teeth: 20,
      axle: 'Q',
      x: 125,
      y: 155,
      z: 4,
      compoundWith: 'Q1',
      color: '#b87333',
      spokes: 3,
      cycleName: 'Exeligmos Step-Down'
    });

    // 11. AXLE R: Exeligmos 54-Year Dial (Triple Saros)
    // 3 x 223 = 669 months; turns pointer 1 rev per 54 years to predict time-of-day shift (0h, +8h, +16h)
    addGear({
      id: 'R1',
      name: 'R1 Exeligmos Reduction Pinion',
      teeth: 20,
      axle: 'R',
      x: 195,
      y: 155,
      z: 4,
      parentGearId: 'Q2',
      meshRatio: -20 / 20,
      color: '#cd7f32',
      spokes: 3,
      cycleName: 'Exeligmos Synchronizer'
    });
    addGear({
      id: 'R2',
      name: 'R2 Exeligmos 54-Year Triple-Saros Wheel',
      teeth: 60,
      axle: 'R',
      x: 195,
      y: 155,
      z: 5,
      compoundWith: 'R1',
      meshRatio: 1 / 3, // 3:1 reduction for 3-turn Saros cycle
      color: '#d4af37',
      spokes: 3,
      cycleName: 'Exeligmos 54-Year Triple-Saros (0h / +8h / +16h)'
    });

    // Dials Registration (7 historical dials)
    this.dials = [
      { id: 'FrontCalendarDial', name: 'Egyptian 365-Day Calendar Ring', type: 'circle' },
      { id: 'FrontZodiacDial', name: 'Greek 360° Zodiac Celestial Dial', type: 'circle' },
      { id: 'MoonPhaseDial', name: 'Rotating 3D Lunar Phase Sphere', type: 'sphere' },
      { id: 'MetonicSpiralDial', name: 'Metonic 235-Month 5-Turn Spiral Dial', type: 'spiral' },
      { id: 'OlympiadDial', name: 'Olympiad 4-Year Panhellenic Dial', type: 'circle' },
      { id: 'SarosSpiralDial', name: 'Saros 223-Month 4-Turn Eclipse Spiral Dial', type: 'spiral' },
      { id: 'ExeligmosDial', name: 'Exeligmos 54-Year Dial (0h / 8h / 16h)', type: 'circle' }
    ];

    // Pointers
    this.pointers = [
      { id: 'SunPointer', name: 'True Sun Ecliptic Pointer' },
      { id: 'MoonPointer', name: 'True Moon Anomaly Pointer' },
      { id: 'DragonPointer', name: 'Lunar Nodal Eclipse Pointer (Dragon Head & Tail)' },
      { id: 'MetonicCursor', name: 'Metonic Spiral Follower Stylus' },
      { id: 'OlympiadCursor', name: 'Olympiad Quadrant Hand' },
      { id: 'SarosCursor', name: 'Saros Eclipse Spiral Follower Stylus' },
      { id: 'ExeligmosCursor', name: 'Exeligmos Hour-Shift Hand' }
    ];
  }

  /* -------------------------------------------------------------------------
   * SAFE CONTROLS BUILDER (Safe Headless Guard)
   * ---------------------------------------------------------------------- */
  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>
          <span>Time Speed (Solar Days/sec)</span>
          <span id="speed-label" style="color: var(--accent-gold, #d4af37); font-weight:600;">6.0 days/s</span>
        </label>
        <input type="range" id="speed-slider" min="-30" max="30" step="0.5" value="6">
      </div>

      <div class="control-group">
        <label>Mechanism View & Display</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="btn-view-front">🏛️ Front Dials</button>
          <button class="sub-btn" id="btn-view-rear">📜 Rear Spirals</button>
        </div>
        <button class="sub-btn" id="btn-view-gears" style="margin-top: 6px; width: 100%;">⚙️ Epicyclic Gearing Core</button>
      </div>

      <div class="control-group">
        <label>Astronomical Celestial Overlays</label>
        <div class="control-btn-grid">
          <button class="sub-btn active" id="btn-toggle-moon">🌕 Moon Phase</button>
          <button class="sub-btn active" id="btn-toggle-sun">☀️ Sun Position</button>
        </div>
        <div class="control-btn-grid" style="margin-top: 6px;">
          <button class="sub-btn active" id="btn-toggle-teeth">⚙️ Gear Teeth</button>
          <button class="sub-btn active" id="btn-toggle-glow">✨ Cyber Glow</button>
        </div>
      </div>

      <div class="control-group">
        <label>Astronomical Alignments & Presets</label>
        <div class="control-btn-grid">
          <button class="sub-btn" data-preset="solar-eclipse">🌑 Solar Eclipse</button>
          <button class="sub-btn" data-preset="olympiad">🏆 Olympic Games</button>
        </div>
        <div class="control-btn-grid" style="margin-top: 6px;">
          <button class="sub-btn" data-preset="metonic-sync">🌌 Metonic Conjunction</button>
          <button class="sub-btn" data-preset="hipparchus">📐 Lunar Anomaly</button>
        </div>
      </div>

      <div class="control-group">
        <label>Manual Stepping & Hand Crank</label>
        <div class="control-btn-grid">
          <button class="sub-btn" id="btn-step-back">◀ -1 Day</button>
          <button class="sub-btn" id="btn-step-fwd">+1 Day ▶</button>
        </div>
        <div class="control-btn-grid" style="margin-top: 6px;">
          <button class="sub-btn" id="btn-pause-play">⏸️ Pause</button>
          <button class="sub-btn" id="btn-reset">🔄 Reset</button>
        </div>
      </div>
    `;

    // Sliders
    const speedSlider = this.controlsContainer.querySelector('#speed-slider');
    const speedLabel = this.controlsContainer.querySelector('#speed-label');
    if (speedSlider && speedLabel) {
      speedSlider.addEventListener('input', (e) => {
        this.timeSpeed = parseFloat(e.target.value);
        speedLabel.textContent = `${this.timeSpeed.toFixed(1)} days/s`;
      });
    }

    // View buttons
    const btnFront = this.controlsContainer.querySelector('#btn-view-front');
    const btnRear = this.controlsContainer.querySelector('#btn-view-rear');
    const btnGears = this.controlsContainer.querySelector('#btn-view-gears');

    const setView = (mode) => {
      this.viewMode = mode;
      if (btnFront) btnFront.classList.toggle('active', mode === 'front');
      if (btnRear) btnRear.classList.toggle('active', mode === 'rear');
      if (btnGears) btnGears.classList.toggle('active', mode === 'gears');
    };

    if (btnFront) btnFront.addEventListener('click', () => setView('front'));
    if (btnRear) btnRear.addEventListener('click', () => setView('rear'));
    if (btnGears) btnGears.addEventListener('click', () => setView('gears'));

    // Toggles
    const btnMoon = this.controlsContainer.querySelector('#btn-toggle-moon');
    if (btnMoon) {
      btnMoon.addEventListener('click', () => {
        this.showMoonPhase = !this.showMoonPhase;
        btnMoon.classList.toggle('active', this.showMoonPhase);
      });
    }

    const btnSun = this.controlsContainer.querySelector('#btn-toggle-sun');
    if (btnSun) {
      btnSun.addEventListener('click', () => {
        this.showSunPosition = !this.showSunPosition;
        btnSun.classList.toggle('active', this.showSunPosition);
      });
    }

    const btnTeeth = this.controlsContainer.querySelector('#btn-toggle-teeth');
    if (btnTeeth) {
      btnTeeth.addEventListener('click', () => {
        this.showTeeth = !this.showTeeth;
        btnTeeth.classList.toggle('active', this.showTeeth);
      });
    }

    const btnGlow = this.controlsContainer.querySelector('#btn-toggle-glow');
    if (btnGlow) {
      btnGlow.addEventListener('click', () => {
        this.showGlow = !this.showGlow;
        btnGlow.classList.toggle('active', this.showGlow);
      });
    }

    // Stepping
    const btnStepBack = this.controlsContainer.querySelector('#btn-step-back');
    if (btnStepBack) {
      btnStepBack.addEventListener('click', () => {
        this.simDays -= 1.0;
        this.updateGearsKinematics();
      });
    }

    const btnStepFwd = this.controlsContainer.querySelector('#btn-step-fwd');
    if (btnStepFwd) {
      btnStepFwd.addEventListener('click', () => {
        this.simDays += 1.0;
        this.updateGearsKinematics();
      });
    }

    const btnPausePlay = this.controlsContainer.querySelector('#btn-pause-play');
    if (btnPausePlay) {
      btnPausePlay.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        btnPausePlay.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
      });
    }

    const btnReset = this.controlsContainer.querySelector('#btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.reset();
      });
    }

    // Presets
    this.controlsContainer.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-preset');
        this.applyPreset(p);
      });
    });
  }

  applyPreset(presetName) {
    switch (presetName) {
      case 'solar-eclipse':
        // Saros eclipse month 13 (approx 384 days)
        this.simDays = 383.89;
        this.viewMode = 'rear';
        break;
      case 'olympiad':
        // Start of Olympiad Year 1 (Olympic Games at Olympia)
        this.simDays = 0;
        this.viewMode = 'rear';
        break;
      case 'metonic-sync':
        // 19 solar years Metonic conjunction (~6939.69 days)
        this.simDays = 6939.69;
        this.viewMode = 'rear';
        break;
      case 'hipparchus':
        // Close-up on the pin-and-slot lunar anomaly in gear train mode
        this.viewMode = 'gears';
        this.selectedGear = this.gears.find((g) => g.id === 'K1') || null;
        break;
    }
    this.updateGearsKinematics();
    if (this.controlsContainer) {
      const btnFront = this.controlsContainer.querySelector('#btn-view-front');
      const btnRear = this.controlsContainer.querySelector('#btn-view-rear');
      const btnGears = this.controlsContainer.querySelector('#btn-view-gears');
      if (btnFront) btnFront.classList.toggle('active', this.viewMode === 'front');
      if (btnRear) btnRear.classList.toggle('active', this.viewMode === 'rear');
      if (btnGears) btnGears.classList.toggle('active', this.viewMode === 'gears');
    }
  }

  /* -------------------------------------------------------------------------
   * LIFECYCLE & CONTRACT METHODS
   * ---------------------------------------------------------------------- */
  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  getEntityCount() {
    // Number of active gears + indicator dials
    return this.gears.length + this.dials.length;
  }

  reset() {
    this.simDays = 0;
    this.timeSpeed = 6.0;
    this.isPaused = false;
    this.selectedGear = null;
    this.hoveredGear = null;
    this.particles = [];
    this.updateGearsKinematics();

    if (this.controlsContainer) {
      const speedSlider = this.controlsContainer.querySelector('#speed-slider');
      const speedLabel = this.controlsContainer.querySelector('#speed-label');
      if (speedSlider) speedSlider.value = '6';
      if (speedLabel) speedLabel.textContent = '6.0 days/s';

      const btnPausePlay = this.controlsContainer.querySelector('#btn-pause-play');
      if (btnPausePlay) btnPausePlay.textContent = '⏸️ Pause';
    }
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.particles = [];
  }

  /* -------------------------------------------------------------------------
   * SIMULATION UPDATE & EPICYCLIC KINEMATICS
   * ---------------------------------------------------------------------- */
  update(dt) {
    if (!this.isPaused && !this.isDragging) {
      this.simDays += dt * this.timeSpeed;
    }

    this.updateGearsKinematics();
    this.updateParticles(dt);
  }

  updateGearsKinematics() {
    // Base angles
    const solarFraction = this.simDays / DAYS_PER_SOLAR_YEAR;
    const thetaSun = solarFraction * Math.PI * 2;

    // Lunar sidereal base angle (against fixed stars, period 27.32166 days)
    const lunarMeanSidereal = (this.simDays / DAYS_PER_SIDEREAL_MONTH) * Math.PI * 2;

    // Hipparchus Lunar Radial Anomaly (Perigee to perigee period 27.55455 days)
    // The famous pin-and-slot eccentric assembly computes Kepler's 2nd law:
    // delta_anomaly ~ e * sin(mean_anomaly) where e ~ 0.109 (eccentricity)
    const meanAnomaly = (this.simDays / DAYS_PER_ANOMALISTIC_MONTH) * Math.PI * 2;
    const lunarKeplerAnomaly = 0.109 * Math.sin(meanAnomaly);

    // True lunar angle incorporating the pin-and-slot epicyclic kinematic shift
    const thetaMoon = lunarMeanSidereal + lunarKeplerAnomaly;

    // Moon phase synodic angle (New Moon = 0, Full Moon = PI)
    const thetaPhase = thetaMoon - thetaSun;

    // Lunar Node (Dragon pointer, retrogrades 1 rev every 18.61 years / 6798 days)
    const thetaNode = -((this.simDays / (DAYS_PER_DRACONIC_MONTH * 249.8)) * Math.PI * 2);

    // Map calculated celestial angles to individual gears
    for (const g of this.gears) {
      switch (g.id) {
        case 'A1': // Crank
          g.angle = thetaSun * (64 / 48);
          break;
        case 'B1':
        case 'B2':
        case 'B3': // Main solar wheels: 1 rev / solar year
          g.angle = thetaSun;
          break;
        case 'C1':
        case 'C2':
          g.angle = -thetaSun * (32 / 38);
          break;
        case 'D1':
        case 'D2':
          g.angle = thetaSun * (32 / 38) * (48 / 24);
          break;
        case 'E1':
        case 'E2':
          g.angle = -thetaSun * (32 / 38) * (48 / 24) * (127 / 32);
          break;
        case 'E5': // Turntable ring (Saros precession)
          g.angle = (this.simDays / (SAROS_MONTHS * DAYS_PER_SYNODIC_MONTH)) * Math.PI * 2;
          break;
        case 'K1': // Pin carrier gear
          g.angle = -lunarMeanSidereal;
          break;
        case 'K2': // Slotted follower gear (with eccentric phase advance/retard)
          g.angle = -(lunarMeanSidereal + lunarKeplerAnomaly);
          break;
        case 'F1':
        case 'F2': // Moon output arbor
          g.angle = thetaMoon;
          break;
        case 'M_bevel_sun':
          g.angle = thetaSun;
          break;
        case 'M_bevel_diff':
          g.angle = (thetaSun + thetaMoon) * 0.5;
          break;
        case 'M_bevel_moon':
          g.angle = thetaPhase;
          break;
        case 'L1':
        case 'L2':
          g.angle = -thetaSun * (32 / 38);
          break;
        case 'M1':
        case 'M2':
          g.angle = thetaSun * (32 / 38) * (53 / 96);
          break;
        case 'N1':
        case 'N2': // Metonic 5-turn spiral pointer
          // 5 turns over 235 synodic months
          g.angle = (this.simDays / (METONIC_MONTHS * DAYS_PER_SYNODIC_MONTH)) * Math.PI * 2 * 5;
          break;
        case 'O1': // Olympiad 4-year cycle: 1 rev per 4 solar years
          g.angle = (this.simDays / (4 * DAYS_PER_SOLAR_YEAR)) * Math.PI * 2;
          break;
        case 'P1':
        case 'P2':
          g.angle = -thetaSun * (32 / 60);
          break;
        case 'Q1':
        case 'Q2': // Saros 4-turn spiral pointer
          // 4 turns over 223 synodic months
          g.angle = (this.simDays / (SAROS_MONTHS * DAYS_PER_SYNODIC_MONTH)) * Math.PI * 2 * 4;
          break;
        case 'R1':
        case 'R2': // Exeligmos 54-year cycle (1 rev per 3 Saros cycles)
          g.angle = (this.simDays / (EXELIGMOS_MONTHS * DAYS_PER_SYNODIC_MONTH)) * Math.PI * 2;
          break;
        default:
          if (g.parentGearId) {
            const parent = this.gears.find((p) => p.id === g.parentGearId);
            if (parent) {
              g.angle = -parent.angle * (parent.teeth / g.teeth);
            }
          }
      }
    }

    // Cache current astronomical positions for HUD & rendering
    this.astronomy = {
      solarAngle: thetaSun,
      solarEclipticDeg: (((thetaSun * 180) / Math.PI) % 360 + 360) % 360,
      lunarAngle: thetaMoon,
      lunarEclipticDeg: (((thetaMoon * 180) / Math.PI) % 360 + 360) % 360,
      phaseAngle: thetaPhase,
      phaseFraction: (1 - Math.cos(thetaPhase)) * 0.5,
      nodeAngle: thetaNode,
      metonicMonth: ((this.simDays / DAYS_PER_SYNODIC_MONTH) % METONIC_MONTHS + METONIC_MONTHS) % METONIC_MONTHS,
      sarosMonth: ((this.simDays / DAYS_PER_SYNODIC_MONTH) % SAROS_MONTHS + SAROS_MONTHS) % SAROS_MONTHS,
      olympiadYear: Math.floor(((this.simDays / DAYS_PER_SOLAR_YEAR) % 4 + 4) % 4) + 1,
      olympiadCycle: Math.floor(this.simDays / (4 * DAYS_PER_SOLAR_YEAR)) + 195 // Historical Olympiad counting
    };

    // Emit subtle mesh sparks when running fast
    if (Math.abs(this.timeSpeed) > 8 && Math.random() < 0.3) {
      this.spawnSparks();
    }
  }

  spawnSparks() {
    // Pick a gear contact point
    const g1 = this.gears[Math.floor(Math.random() * this.gears.length)];
    if (!g1) return;
    const cx = this.width * 0.5 + g1.x;
    const cy = this.height * 0.5 + g1.y;
    const ang = g1.angle;
    const sx = cx + Math.cos(ang) * g1.radius;
    const sy = cy + Math.sin(ang) * g1.radius;

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 1.0,
        decay: 2.0 + Math.random() * 3.0,
        color: Math.random() > 0.4 ? '#3bd6c6' : '#d4af37'
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /* -------------------------------------------------------------------------
   * RENDERING PIPELINE
   * ---------------------------------------------------------------------- */
  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Dark celestial workshop background
    this.renderBackground(ctx);

    // 2. Render depending on active view mode
    if (this.viewMode === 'front') {
      this.renderFrontDials(ctx);
    } else if (this.viewMode === 'rear') {
      this.renderRearSpirals(ctx);
    } else {
      this.renderGearsCutaway(ctx);
    }

    // 3. Render mesh sparks & particles
    this.renderParticles(ctx);

    // 4. Render HUD & Astronomical Telemetry
    this.renderHUD(ctx);

    // 5. Render hovered/selected gear tooltips
    this.renderTooltips(ctx);

    ctx.restore();
  }

  renderBackground(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const rMax = Math.max(this.width, this.height);

    // Deep slate vignette with subtle bronze radial wash
    const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, rMax * 0.7);
    grad.addColorStop(0, '#10141e');
    grad.addColorStop(0.5, '#0b0d13');
    grad.addColorStop(1, '#050608');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle calibration grid and celestial lines
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
    ctx.lineWidth = 1;

    const step = 60;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Subtle concentric reference circles
    ctx.strokeStyle = 'rgba(0, 128, 128, 0.06)';
    for (let r = 80; r < rMax * 0.6; r += 80) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * FRONT FACE: CELESTIAL & CALENDAR DIALS
   * ---------------------------------------------------------------------- */
  renderFrontDials(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const baseR = Math.min(this.width, this.height) * 0.42;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Bronze Housing Case with Rivets
    this.renderBronzeHousing(ctx, baseR);

    // 2. Visible Gears under cutouts (glimpse of epicyclic mechanism)
    this.renderSubdialGears(ctx, baseR * 0.55);

    // 3. Outer Ring: Egyptian 365-Day Civil Calendar
    this.renderEgyptianCalendarRing(ctx, baseR);

    // 4. Inner Ring: Greek 360° Zodiac Ring
    this.renderZodiacRing(ctx, baseR * 0.78);

    // 5. Celestial Pointers:
    // Dragon Lunar Node Pointer (Eclipse boundaries)
    this.renderDragonPointer(ctx, baseR * 0.72);

    // True Sun Pointer with Radiant Sol
    if (this.showSunPosition) {
      this.renderSunPointer(ctx, baseR * 0.94);
    }

    // True Moon Pointer with 3D Phase Sphere
    if (this.showMoonPhase) {
      this.renderMoonPointer(ctx, baseR * 0.88);
    }

    // Central Bronze Hub Boss with Archimedean rosette
    this.renderCentralBoss(ctx, 24);

    ctx.restore();
  }

  renderBronzeHousing(ctx, radius) {
    // Outer bronze mounting frame
    ctx.save();
    const grad = ctx.createRadialGradient(0, 0, radius * 0.85, 0, 0, radius * 1.15);
    grad.addColorStop(0, '#593a18');
    grad.addColorStop(0.3, '#b87333');
    grad.addColorStop(0.7, '#8f5624');
    grad.addColorStop(1, '#3b210c');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rivets / Screws around frame perimeter
    const numRivets = 24;
    for (let i = 0; i < numRivets; i++) {
      const ang = (i / numRivets) * Math.PI * 2;
      const rx = Math.cos(ang) * (radius * 1.04);
      const ry = Math.sin(ang) * (radius * 1.04);

      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#d4af37';
      ctx.fill();
      ctx.strokeStyle = '#2d1808';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSubdialGears(ctx, innerRadius) {
    ctx.save();
    // Circular cutout through dial plate showing moving bronze gears
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#0a0d14';
    ctx.fill();

    // Render central gears B1, B2, D1, K1, K2 in the opening
    const visibleGears = ['B1', 'B2', 'C1', 'D1', 'K1', 'K2', 'F1'];
    for (const id of visibleGears) {
      const g = this.gears.find((item) => item.id === id);
      if (g) {
        ctx.save();
        ctx.translate(g.x * 0.7, g.y * 0.7);
        this.renderSingleGear(ctx, g, 0.7);
        ctx.restore();
      }
    }

    // Inner bronze retaining bezel
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  renderEgyptianCalendarRing(ctx, outerR) {
    const innerR = outerR * 0.88;

    ctx.save();
    // Bronze ring base
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = '#22150a';
    ctx.fill();

    ctx.strokeStyle = '#b87333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 12 Egyptian Months + Epagomenae (30 degrees per regular month)
    const monthAngle = (Math.PI * 2) / 12;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '9px "JetBrains Mono", monospace';

    for (let i = 0; i < 12; i++) {
      const ang = i * monthAngle;
      // Month boundary divider
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * innerR, Math.sin(ang) * innerR);
      ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Day tick marks (every 5 days)
      for (let d = 1; d < 6; d++) {
        const dAng = ang + (d / 6) * monthAngle;
        const tickLen = d === 3 ? (outerR - innerR) * 0.5 : (outerR - innerR) * 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(dAng) * (outerR - tickLen), Math.sin(dAng) * (outerR - tickLen));
        ctx.lineTo(Math.cos(dAng) * outerR, Math.sin(dAng) * outerR);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Month name
      const midAng = ang + monthAngle * 0.5;
      const textR = (innerR + outerR) * 0.5;
      ctx.save();
      ctx.translate(Math.cos(midAng) * textR, Math.sin(midAng) * textR);
      ctx.rotate(midAng + Math.PI * 0.5);
      ctx.fillStyle = '#e6e8ee';
      ctx.fillText(EGYPTIAN_MONTHS[i], 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  renderZodiacRing(ctx, outerR) {
    const innerR = outerR * 0.72;

    ctx.save();
    // Deep blue-bronze ring base
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = '#0f1422';
    ctx.fill();

    ctx.strokeStyle = '#008080';
    ctx.lineWidth = 2;
    ctx.stroke();

    const signAngle = (Math.PI * 2) / 12;

    for (let i = 0; i < 12; i++) {
      const ang = i * signAngle;
      const sign = ZODIAC_SIGNS[i];

      // Sign boundary line
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * innerR, Math.sin(ang) * innerR);
      ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
      ctx.strokeStyle = '#3bd6c6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 10-degree and 1-degree tick marks
      for (let deg = 1; deg < 30; deg++) {
        const degAng = ang + (deg / 30) * signAngle;
        const tickLen = deg % 10 === 0 ? (outerR - innerR) * 0.4 : (outerR - innerR) * 0.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(degAng) * (innerR + tickLen), Math.sin(degAng) * (innerR + tickLen));
        ctx.lineTo(Math.cos(degAng) * innerR, Math.sin(degAng) * innerR);
        ctx.strokeStyle = deg % 10 === 0 ? '#d4af37' : 'rgba(59, 214, 198, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Zodiac Glyph and Greek Inscription
      const midAng = ang + signAngle * 0.5;
      const textR = (innerR + outerR) * 0.5;

      ctx.save();
      ctx.translate(Math.cos(midAng) * textR, Math.sin(midAng) * textR);
      ctx.rotate(midAng + Math.PI * 0.5);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = sign.color;
      ctx.fillText(sign.symbol, 0, -5);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(sign.greek, 0, 7);

      ctx.restore();
    }

    ctx.restore();
  }

  renderDragonPointer(ctx, radius) {
    // Lunar Nodal Precession pointer (Head ☊ Ascending Node, Tail ☋ Descending Node)
    ctx.save();
    const ang = this.astronomy.nodeAngle;
    ctx.rotate(ang);

    ctx.strokeStyle = 'rgba(160, 110, 240, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, 0);
    ctx.lineTo(radius * 0.8, 0);
    ctx.stroke();

    // Dragon Head (Ascending Node)
    ctx.fillStyle = '#aa77ff';
    ctx.beginPath();
    ctx.arc(radius * 0.8, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☊', radius * 0.8, -10);

    // Dragon Tail (Descending Node)
    ctx.fillStyle = '#aa77ff';
    ctx.beginPath();
    ctx.arc(-radius * 0.8, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('☋', -radius * 0.8, -10);

    ctx.restore();
  }

  renderSunPointer(ctx, radius) {
    ctx.save();
    const ang = this.astronomy.solarAngle;
    ctx.rotate(ang);

    // Bronze pointer lance
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();

    // Pointer Spearhead
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(radius - 12, -5);
    ctx.lineTo(radius - 8, 0);
    ctx.lineTo(radius - 12, 5);
    ctx.closePath();
    ctx.fill();

    // Radiant Sun Disc along the pointer
    const sunR = radius * 0.72;
    const sunGrad = ctx.createRadialGradient(sunR, 0, 2, sunR, 0, 14);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.4, '#ffdd44');
    sunGrad.addColorStop(0.8, '#ff8800');
    sunGrad.addColorStop(1, 'rgba(255, 136, 0, 0)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunR, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Solar Rays
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const rayAng = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(sunR + Math.cos(rayAng) * 8, Math.sin(rayAng) * 8);
      ctx.lineTo(sunR + Math.cos(rayAng) * 16, Math.sin(rayAng) * 16);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderMoonPointer(ctx, radius) {
    ctx.save();
    const ang = this.astronomy.lunarAngle;
    ctx.rotate(ang);

    // Silver/Cyan Moon Pointer Needle
    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = '#e6e8ee';
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(radius - 10, -4);
    ctx.lineTo(radius - 6, 0);
    ctx.lineTo(radius - 10, 4);
    ctx.closePath();
    ctx.fill();

    // 3D Rotating Lunar Phase Sphere
    // The sphere is painted half silver-white and half black, rotated by synodic phase angle
    const sphereR = radius * 0.62;
    const sphereRadius = 9;

    ctx.save();
    ctx.translate(sphereR, 0);

    // Base circle
    ctx.beginPath();
    ctx.arc(0, 0, sphereRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#11131a';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Synodic phase angle relative to sun pointer
    const phase = this.astronomy.phaseAngle;

    // Draw illuminated crescent / gibbous
    ctx.beginPath();
    ctx.arc(0, 0, sphereRadius, -Math.PI * 0.5, Math.PI * 0.5, false);

    // Elliptical terminator curve
    const k = Math.cos(phase);
    ctx.ellipse(0, 0, Math.abs(k) * sphereRadius, sphereRadius, 0, Math.PI * 0.5, -Math.PI * 0.5, k < 0);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Outer glow
    if (this.showGlow) {
      ctx.strokeStyle = 'rgba(59, 214, 198, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, sphereRadius + 1, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  renderCentralBoss(ctx, radius) {
    ctx.save();
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.6, '#b87333');
    grad.addColorStop(1, '#4a2608');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Central axle screw
    ctx.fillStyle = '#221105';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * REAR FACE: METONIC & SAROS SPIRAL DIALS + OLYMPIAD & EXELIGMOS
   * ---------------------------------------------------------------------- */
  renderRearSpirals(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    // Upper Half: Metonic Spiral Dial & Olympiad Subsidiary Dial
    const metonicCenterY = cy - this.height * 0.22;
    const sarosCenterY = cy + this.height * 0.24;
    const spiralR = Math.min(this.width, this.height) * 0.26;

    ctx.save();

    // 1. Upper Dial: Metonic 235-Month 5-Turn Spiral
    this.renderMetonicDial(ctx, cx, metonicCenterY, spiralR);

    // 2. Olympiad Subsidiary Dial (Inside Upper Dial)
    this.renderOlympiadDial(ctx, cx + spiralR * 0.62, metonicCenterY, spiralR * 0.36);

    // 3. Lower Dial: Saros 223-Month 4-Turn Spiral
    this.renderSarosDial(ctx, cx, sarosCenterY, spiralR);

    // 4. Exeligmos Subsidiary Dial (Inside Lower Dial)
    this.renderExeligmosDial(ctx, cx + spiralR * 0.62, sarosCenterY, spiralR * 0.36);

    ctx.restore();
  }

  renderMetonicDial(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    // Dial Backplate
    ctx.fillStyle = '#10141f';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b87333';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Title Inscription
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('METONIC SPIRAL (19 YEARS / 235 MONTHS)', 0, -radius * 1.02);

    // Archimedean 5-Turn Spiral: r = a + b * theta
    const numTurns = 5;
    const rInner = radius * 0.22;
    const rOuter = radius * 0.98;
    const b = (rOuter - rInner) / (numTurns * Math.PI * 2);

    // Draw spiral grooves
    ctx.strokeStyle = 'rgba(0, 128, 128, 0.45)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    const totalTheta = numTurns * Math.PI * 2;
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * totalTheta;
      const r = rInner + b * th;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw month division tick marks along spiral (235 months)
    for (let m = 0; m <= METONIC_MONTHS; m += 5) {
      const th = (m / METONIC_MONTHS) * totalTheta;
      const r = rInner + b * th;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;

      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = m % 12 === 0 ? '#d4af37' : '#3bd6c6';
      ctx.fill();
    }

    // Follower Pointer & Stylus Peg
    const curMonth = this.astronomy.metonicMonth;
    const pointerTheta = (curMonth / METONIC_MONTHS) * totalTheta;
    const pointerR = rInner + b * pointerTheta;
    const px = Math.cos(pointerTheta) * pointerR;
    const py = Math.sin(pointerTheta) * pointerR;

    // Follower pointer arm
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Stylus Pin inside spiral groove
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center pivot
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#b87333';
    ctx.fill();

    ctx.restore();
  }

  renderOlympiadDial(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    // Dial background
    ctx.fillStyle = '#161a26';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('OLYMPIAD (4 YR)', 0, -radius - 3);

    // 4 Sectors (Olympia, Nemea, Pythia, Isthmia)
    const sectors = [
      { name: 'OLYMPIA', sub: 'YR 1', ang: -Math.PI * 0.5 },
      { name: 'NEMEA', sub: 'YR 2', ang: 0 },
      { name: 'PYTHIA', sub: 'YR 3', ang: Math.PI * 0.5 },
      { name: 'ISTHMIA', sub: 'YR 4', ang: Math.PI }
    ];

    // Sector dividers
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    // Sector Labels
    ctx.font = '8px "JetBrains Mono", monospace';
    for (let i = 0; i < 4; i++) {
      const s = sectors[i];
      const mid = s.ang + Math.PI * 0.25;
      const lx = Math.cos(mid) * (radius * 0.62);
      const ly = Math.sin(mid) * (radius * 0.62);

      const isActive = this.astronomy.olympiadYear === i + 1;
      ctx.fillStyle = isActive ? '#ffd700' : '#8c909e';
      ctx.fillText(s.name, lx, ly - 3);
      ctx.fillText(s.sub, lx, ly + 6);
    }

    // Olympiad Pointer Needle
    const yearFraction = (this.simDays / (4 * DAYS_PER_SOLAR_YEAR)) % 1;
    const needleAng = -Math.PI * 0.5 + yearFraction * Math.PI * 2;

    ctx.save();
    ctx.rotate(needleAng);
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 0.85, 0);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(radius * 0.85, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#b87333';
    ctx.fill();

    ctx.restore();
  }

  renderSarosDial(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    // Dial Backplate
    ctx.fillStyle = '#0f1422';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Title Inscription
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#3bd6c6';
    ctx.fillText('SAROS ECLIPSE SPIRAL (223 MONTHS / 18.03 YEARS)', 0, -radius * 1.02);

    // Archimedean 4-Turn Spiral: r = a + b * theta
    const numTurns = 4;
    const rInner = radius * 0.22;
    const rOuter = radius * 0.98;
    const b = (rOuter - rInner) / (numTurns * Math.PI * 2);

    // Draw spiral grooves
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.45)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    const totalTheta = numTurns * Math.PI * 2;
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * totalTheta;
      const r = rInner + b * th;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Inscribe Eclipse Glyphs (Σ for Solar, H for Lunar)
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ec of SAROS_ECLIPSE_GLYPHS) {
      const th = (ec.month / SAROS_MONTHS) * totalTheta;
      const r = rInner + b * th;
      const ex = Math.cos(th) * r;
      const ey = Math.sin(th) * r;

      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = ec.type === 'SOLAR' ? '#ffaa00' : '#44bbff';
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.fillText(ec.glyph, ex, ey);
    }

    // Follower Pointer & Stylus Peg
    const curMonth = this.astronomy.sarosMonth;
    const pointerTheta = (curMonth / SAROS_MONTHS) * totalTheta;
    const pointerR = rInner + b * pointerTheta;
    const px = Math.cos(pointerTheta) * pointerR;
    const py = Math.sin(pointerTheta) * pointerR;

    // Follower pointer arm
    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Stylus Pin
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center pivot
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#008080';
    ctx.fill();

    ctx.restore();
  }

  renderExeligmosDial(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    // Dial background
    ctx.fillStyle = '#161a26';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#3bd6c6';
    ctx.fillText('EXELIGMOS (54 YR)', 0, -radius - 3);

    // 3 Sectors: 0h, 8h, 16h eclipse shifts
    const angleStep = (Math.PI * 2) / 3;
    const labels = ['0 hrs (I)', '+8 hrs (II)', '+16 hrs (III)'];

    for (let i = 0; i < 3; i++) {
      const ang = i * angleStep - Math.PI * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
      ctx.strokeStyle = 'rgba(59, 214, 198, 0.4)';
      ctx.stroke();

      const mid = ang + angleStep * 0.5;
      const lx = Math.cos(mid) * (radius * 0.6);
      const ly = Math.sin(mid) * (radius * 0.6);
      ctx.fillStyle = '#e6e8ee';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(labels[i], lx, ly);
    }

    // Exeligmos Pointer Hand (1 rev per 54 years)
    const exeligmosFraction = (this.simDays / (EXELIGMOS_MONTHS * DAYS_PER_SYNODIC_MONTH)) % 1;
    const handAng = -Math.PI * 0.5 + exeligmosFraction * Math.PI * 2;

    ctx.save();
    ctx.rotate(handAng);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 0.85, 0);
    ctx.stroke();

    ctx.fillStyle = '#3bd6c6';
    ctx.beginPath();
    ctx.arc(radius * 0.85, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#008080';
    ctx.fill();

    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * EPICYCLIC GEAR TRAIN CORE CUTAWAY VIEW
   * ---------------------------------------------------------------------- */
  renderGearsCutaway(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    ctx.save();
    ctx.translate(cx, cy);

    // Title banner
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('ANTIKYTHERA EPICYCLIC GEAR TRAIN (31 BRONZE GEARS)', 0, -this.height * 0.46);

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('Kinematic Law: θ_{n+1} = -θ_n × (T_n / T_{n+1}) | Drag to crank main drive', 0, -this.height * 0.42);

    // Render gears sorted by Z depth
    const sortedGears = [...this.gears].sort((a, b) => a.z - b.z);

    for (const g of sortedGears) {
      ctx.save();
      ctx.translate(g.x, g.y);

      const isSelected = this.selectedGear && this.selectedGear.id === g.id;
      const isHovered = this.hoveredGear && this.hoveredGear.id === g.id;

      this.renderSingleGear(ctx, g, 1.0, isSelected, isHovered);

      // Render Pin & Slot mechanism explicitly on K1 and K2!
      if (g.id === 'K1') {
        this.renderK1Pin(ctx, g);
      } else if (g.id === 'K2') {
        this.renderK2Slot(ctx, g);
      }

      ctx.restore();
    }

    // Render mesh contact lines / epicyclic link rods
    this.renderMechanicalLinks(ctx);

    ctx.restore();
  }

  renderSingleGear(ctx, gear, scale = 1.0, isSelected = false, isHovered = false) {
    ctx.save();
    const r = gear.radius * scale;
    const teeth = gear.teeth;
    const ang = gear.angle;

    // Outer rim & teeth
    if (this.showTeeth) {
      ctx.save();
      ctx.rotate(ang);

      ctx.beginPath();
      const toothDepth = Math.max(3.5, r * 0.08);
      const rBase = r - toothDepth;
      const rTip = r + toothDepth;

      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = ((i + 0.3) / teeth) * Math.PI * 2;
        const a2 = ((i + 0.6) / teeth) * Math.PI * 2;
        const a3 = ((i + 1.0) / teeth) * Math.PI * 2;

        if (i === 0) {
          ctx.moveTo(Math.cos(a0) * rBase, Math.sin(a0) * rBase);
        } else {
          ctx.lineTo(Math.cos(a0) * rBase, Math.sin(a0) * rBase);
        }
        ctx.lineTo(Math.cos(a1) * rTip, Math.sin(a1) * rTip);
        ctx.lineTo(Math.cos(a2) * rTip, Math.sin(a2) * rTip);
        ctx.lineTo(Math.cos(a3) * rBase, Math.sin(a3) * rBase);
      }
      ctx.closePath();

      // Shaded bronze body gradient
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, rTip);
      grad.addColorStop(0, '#5a3812');
      grad.addColorStop(0.6, gear.color);
      grad.addColorStop(1, '#2d1808');

      ctx.fillStyle = grad;
      ctx.fill();

      // Cyber highlight / outline
      if (isSelected) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
      } else if (isHovered) {
        ctx.strokeStyle = '#3bd6c6';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#3bd6c6';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.restore();
    } else {
      // Fast circle fallback
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = gear.color;
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.stroke();
    }

    // Inner bronze spokes and circular weight-reduction cutouts
    ctx.save();
    ctx.rotate(ang);

    const rCutout = r * 0.58;
    const numSpokes = gear.spokes || 4;

    for (let s = 0; s < numSpokes; s++) {
      const spAng = (s / numSpokes) * Math.PI * 2;
      const hx = Math.cos(spAng) * rCutout;
      const hy = Math.sin(spAng) * rCutout;
      const hRadius = Math.max(3, (r * 0.32) / Math.sin(Math.PI / numSpokes) * 0.45);

      ctx.beginPath();
      ctx.arc(hx, hy, hRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0d13';
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Central bronze arbor boss
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, r * 0.18), 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
    ctx.strokeStyle = '#221105';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Gear ID & Tooth count label
    if (r > 20) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(gear.id, 0, -5);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(`${teeth}T`, 0, 6);
      ctx.restore();
    }

    ctx.restore();
  }

  renderK1Pin(ctx, gear) {
    // Pin carrier gear: draw protruding pin on radius
    ctx.save();
    const pinR = gear.pinRadius || 28;
    const ang = gear.angle;
    const px = Math.cos(ang) * pinR;
    const py = Math.sin(ang) * pinR;

    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pin beacon
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00ffff';
    ctx.stroke();

    ctx.restore();
  }

  renderK2Slot(ctx, gear) {
    // Slotted follower gear: draw milled radial slot
    ctx.save();
    const ang = gear.angle;
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.rect(-3.5, 8, 7, gear.slotLength || 36);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  renderMechanicalLinks(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    // Connect axle pairs with kinematic flow lines
    const links = [
      ['A1', 'B1'],
      ['B2', 'C1'],
      ['C2', 'D1'],
      ['D2', 'E1'],
      ['E2', 'K1'],
      ['K1', 'K2'],
      ['K2', 'F1'],
      ['B2', 'L1'],
      ['L2', 'M1'],
      ['M2', 'N1'],
      ['N2', 'O1'],
      ['B2', 'P1'],
      ['P2', 'Q1'],
      ['Q2', 'R1']
    ];

    for (const [idA, idB] of links) {
      const gA = this.gears.find((g) => g.id === idA);
      const gB = this.gears.find((g) => g.id === idB);
      if (gA && gB) {
        ctx.beginPath();
        ctx.moveTo(gA.x, gA.y);
        ctx.lineTo(gB.x, gB.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderParticles(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * HUD & ASTRONOMICAL TELEMETRY
   * ---------------------------------------------------------------------- */
  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    // Top-Left Panel: Title & Historical Reference
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = narrow ? 'bold 11px "Cinzel", serif' : 'bold 13px "Cinzel", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('ANTIKYTHERA MECHANE', 16, 16);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('Circa 150-100 BC — Analog Computer', 16, narrow ? 30 : 34);

    // Astronomical Telemetry Data
    const astro = this.astronomy;
    const solYear = (this.simDays / DAYS_PER_SOLAR_YEAR).toFixed(2);
    const egyptianDay = Math.floor((this.simDays % 365 + 365) % 365) + 1;
    const monthIdx = Math.min(12, Math.floor((egyptianDay - 1) / 30));
    const dayInMonth = egyptianDay - monthIdx * 30;

    const solSignIdx = Math.floor(astro.solarEclipticDeg / 30);
    const solSign = ZODIAC_SIGNS[solSignIdx] || ZODIAC_SIGNS[0];
    const solDegInSign = (astro.solarEclipticDeg % 30).toFixed(1);

    const lunSignIdx = Math.floor(astro.lunarEclipticDeg / 30);
    const lunSign = ZODIAC_SIGNS[lunSignIdx] || ZODIAC_SIGNS[0];
    const lunDegInSign = (astro.lunarEclipticDeg % 30).toFixed(1);

    const phasePct = (astro.phaseFraction * 100).toFixed(0);
    let phaseName = 'New Moon';
    if (astro.phaseFraction < 0.05) phaseName = 'New Moon';
    else if (astro.phaseFraction < 0.45) phaseName = 'Crescent';
    else if (astro.phaseFraction < 0.55) phaseName = 'Quarter';
    else if (astro.phaseFraction < 0.95) phaseName = 'Gibbous';
    else phaseName = 'Full Moon';

    ctx.fillStyle = '#e6e8ee';
    if (narrow) {
      ctx.fillText(`Year ${solYear} | ${EGYPTIAN_MONTHS[monthIdx]} Day ${dayInMonth}`, 16, 46);
      ctx.fillText(`Sun: ${astro.solarEclipticDeg.toFixed(1)}° (${solSign.symbol} ${solSign.name})`, 16, 60);
      ctx.fillText(`Moon: ${astro.lunarEclipticDeg.toFixed(1)}° | ${phaseName} (${phasePct}%)`, 16, 74);
    } else {
      ctx.fillText(`Solar Time: Year ${solYear} | ${EGYPTIAN_MONTHS[monthIdx]} Day ${dayInMonth} (Day ${egyptianDay}/365)`, 20, 52);
      ctx.fillText(`Sun Longitude: ${astro.solarEclipticDeg.toFixed(1)}° (${solSign.symbol} ${solSign.name} ${solDegInSign}°)`, 20, 68);
      ctx.fillText(`Moon Longitude: ${astro.lunarEclipticDeg.toFixed(1)}° (${lunSign.symbol} ${lunSign.name} ${lunDegInSign}°)`, 20, 84);
      ctx.fillText(`Moon Phase: ${phaseName} (${phasePct}% Illuminated)`, 20, 100);

      // Top-Right Panel: Cycles (Metonic, Saros, Olympiad)
      ctx.textAlign = 'right';
      const rx = sw - 20;

      ctx.fillStyle = '#3bd6c6';
      ctx.fillText(`Metonic: Month ${astro.metonicMonth.toFixed(1)} / 235`, rx, 20);

      const sarosMonthInt = Math.floor(astro.sarosMonth);
      const nextEclipse = SAROS_ECLIPSE_GLYPHS.find((e) => e.month >= sarosMonthInt) || SAROS_ECLIPSE_GLYPHS[0];
      ctx.fillText(`Saros: Month ${astro.sarosMonth.toFixed(1)} / 223`, rx, 36);
      ctx.fillText(`Next: ${nextEclipse.type} (Month ${nextEclipse.month})`, rx, 52);

      const oGame = OLYMPIAD_GAMES[astro.olympiadYear - 1];
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Olympiad ${astro.olympiadCycle}, Yr ${astro.olympiadYear}: ${oGame.name}`, rx, 68);
      ctx.fillText(`Entities: ${this.getEntityCount()} (31 Gears + 7 Dials)`, rx, 84);
    }

    // Bottom Navigation Hint
    ctx.textAlign = 'center';
    ctx.font = '10px "Cinzel", serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.fillText('Drag: Crank | 1: Front | 2: Rear | 3: Gears | Space: Pause', sw * 0.5, sh - 14);

    ctx.restore();
  }

  renderTooltips(ctx) {
    const g = this.selectedGear || this.hoveredGear;
    if (!g) return;

    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const tooltipW = Math.min(sw - 24, 260);
    const tooltipH = 92;

    let tx = (this.hoverPos.x / ui) + 15;
    let ty = (this.hoverPos.y / ui) + 15;

    // Constrain to viewport bounds
    if (tx + tooltipW > sw - 10) tx = (this.hoverPos.x / ui) - tooltipW - 15;
    if (ty + tooltipH > sh - 10) ty = (this.hoverPos.y / ui) - tooltipH - 15;

    ctx.fillStyle = 'rgba(12, 16, 26, 0.92)';
    ctx.strokeStyle = '#3bd6c6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(tx, ty, tooltipW, tooltipH);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`${g.id}: ${g.name}`, tx + 10, ty + 10);

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e6e8ee';
    ctx.fillText(`Teeth Count: ${g.teeth} T | Axle: ${g.axle}`, tx + 10, ty + 28);
    ctx.fillText(`Angle: ${(((g.angle * 180) / Math.PI) % 360).toFixed(1)}° | Ratio: ${g.speedRatio.toFixed(3)}x`, tx + 10, ty + 46);

    ctx.fillStyle = '#3bd6c6';
    ctx.fillText(`Function: ${g.cycleName}`, tx + 10, ty + 64);

    ctx.restore();
  }

  /* -------------------------------------------------------------------------
   * INPUT HANDLING (Mouse, Dragging, Touch & Keyboard)
   * ---------------------------------------------------------------------- */
  onMouseDown(pos) {
    this.isDragging = true;
    this.lastMousePos = { x: pos.x, y: pos.y };

    // Test for gear hit in gears mode or central crank hit
    this.checkGearSelection(pos.x, pos.y);
  }

  onMouseMove(pos) {
    this.hoverPos = { x: pos.x, y: pos.y };

    if (this.isDragging) {
      const cx = this.width * 0.5;
      const cy = this.height * 0.5;

      // Calculate angular delta around machine center (hand-cranking)
      const prevAngle = Math.atan2(this.lastMousePos.y - cy, this.lastMousePos.x - cx);
      const currAngle = Math.atan2(pos.y - cy, pos.x - cx);

      let dAngle = currAngle - prevAngle;
      // Handle wraparound
      if (dAngle > Math.PI) dAngle -= Math.PI * 2;
      if (dAngle < -Math.PI) dAngle += Math.PI * 2;

      // 1 full turn around center = 365.24 solar days
      const daysDelta = (dAngle / (Math.PI * 2)) * DAYS_PER_SOLAR_YEAR * 0.25;
      this.simDays += daysDelta;
      this.updateGearsKinematics();

      this.lastMousePos = { x: pos.x, y: pos.y };
    } else {
      // Update hovered gear
      this.checkGearHover(pos.x, pos.y);
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(delta) {
    // Wheel controls time advance or zoom
    const step = delta > 0 ? 5.0 : -5.0;
    this.simDays += step;
    this.updateGearsKinematics();
  }

  onKeyDown(key) {
    const k = (key || '').toLowerCase();
    switch (k) {
      case ' ':
        this.isPaused = !this.isPaused;
        if (this.controlsContainer) {
          const btn = this.controlsContainer.querySelector('#btn-pause-play');
          if (btn) btn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        }
        break;
      case '1':
        this.viewMode = 'front';
        this.syncViewButtons();
        break;
      case '2':
        this.viewMode = 'rear';
        this.syncViewButtons();
        break;
      case '3':
        this.viewMode = 'gears';
        this.syncViewButtons();
        break;
      case 'm':
        this.showMoonPhase = !this.showMoonPhase;
        if (this.controlsContainer) {
          const btn = this.controlsContainer.querySelector('#btn-toggle-moon');
          if (btn) btn.classList.toggle('active', this.showMoonPhase);
        }
        break;
      case 's':
        this.showSunPosition = !this.showSunPosition;
        if (this.controlsContainer) {
          const btn = this.controlsContainer.querySelector('#btn-toggle-sun');
          if (btn) btn.classList.toggle('active', this.showSunPosition);
        }
        break;
      case 'arrowright':
        this.simDays += 1.0;
        this.updateGearsKinematics();
        break;
      case 'arrowleft':
        this.simDays -= 1.0;
        this.updateGearsKinematics();
        break;
      case 'r':
        this.reset();
        break;
    }
  }

  onKeyUp() {
    // Parity with input contract
  }

  syncViewButtons() {
    if (!this.controlsContainer) return;
    const btnFront = this.controlsContainer.querySelector('#btn-view-front');
    const btnRear = this.controlsContainer.querySelector('#btn-view-rear');
    const btnGears = this.controlsContainer.querySelector('#btn-view-gears');
    if (btnFront) btnFront.classList.toggle('active', this.viewMode === 'front');
    if (btnRear) btnRear.classList.toggle('active', this.viewMode === 'rear');
    if (btnGears) btnGears.classList.toggle('active', this.viewMode === 'gears');
  }

  checkGearSelection(mx, my) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    for (let i = this.gears.length - 1; i >= 0; i--) {
      const g = this.gears[i];
      const gx = cx + g.x;
      const gy = cy + g.y;
      const dist = Math.hypot(mx - gx, my - gy);
      if (dist <= g.radius) {
        this.selectedGear = g;
        return;
      }
    }
    this.selectedGear = null;
  }

  checkGearHover(mx, my) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    for (let i = this.gears.length - 1; i >= 0; i--) {
      const g = this.gears[i];
      const gx = cx + g.x;
      const gy = cy + g.y;
      const dist = Math.hypot(mx - gx, my - gy);
      if (dist <= g.radius) {
        this.hoveredGear = g;
        return;
      }
    }
    this.hoveredGear = null;
  }
}
