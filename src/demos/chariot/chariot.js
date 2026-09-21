// Pliny Game Lab — Circus Maximus Chariot Grand Prix Engine
// Monumental Roman Quadriga Simulation & Centrifugal Drift Physics
// Grounded in Pliny the Elder's Naturalis Historia (Book VIII: Equorum Natura; Book XXXVI: Circus Maximus et Obelisci)
// Pure ES module with ZERO external dependencies.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

/* ============================================================================
 * ARCHITECTURAL DESIGN & HISTORICAL FOUNDATIONS
 *
 * Pliny the Elder, Naturalis Historia:
 *   "Equorum studio vel praecipua cura Romanis... nullum animal magis generosum
 *    in certamine aut ad cursus gloriae ardore flagrans."
 *   ("In the passion for horses, the Romans were foremost... no animal is more noble
 *    in competition or burns with greater ardour for the glory of the race.")
 *   — Book VIII, Chapter 65
 *
 *   "Circus Maximus a Caesare dictatore tribus stadiis in longitudinem,
 *    uno in latitudinem extructus... Euripo circumdatus aqua repleto,
 *    medio spinae obeliscum augusti regis Aegyptii sustinens."
 *   ("The Circus Maximus was constructed by Caesar the Dictator, three stadia in
 *    length and one in width... surrounded by the Euripus canal filled with water,
 *    holding in the middle of the spina the obelisk of the Egyptian kings.")
 *   — Book XXXVI, Chapter 24
 *
 * This simulation pavilion implements:
 * 1. Quadriga Vehicle Physics:
 *    - 4 horses abreast (Funalis Sinister, Iugalis Sinister, Iugalis Dexter, Funalis Dexter).
 *    - Articulated galloping kinematics (shoulder, knee, fetlock, hooves, tossing manes).
 *    - Roman two-wheeled currus with rotating 6-spoke bronze wheels and dynamic body roll.
 *    - Non-linear centrifugal drift: F_c = m * v^2 / r vs lateral sand friction limit (mu * g).
 *    - Dynamic slip angle beta, persistent skidding ruts, sand roosts, and dust vortices.
 * 2. Circus Maximus Environment:
 *    - Monumental Spina (Euripus water canal with marble curbs, caustics, and lion-head spouts).
 *    - Flaminian Egyptian Obelisk with authentic hieroglyphic bands and gilded pyramidion.
 *    - 7 turning bronze dolphins (Delphines) instituted by Agrippa (33 BC).
 *    - 7 marble lap eggs (Ova) instituted in 174 BC.
 *    - Gilded Meta Prima & Meta Secunda (triple conical turning posts on semicircular bases).
 *    - Classical Temple of Consus & Cybele with corinthian columns and cult statues.
 *    - Stadium Cavea with 320+ animated spectators waving faction banners in cheering waves (undulatio).
 *    - Carceres (12 starting stalls) and Creta / Alba Linea (chalk finish line).
 * 3. Four Imperial Factions:
 *    - Prasina (Greens) — Aggressive inside apex cutting & bold passes.
 *    - Veneta (Blues) — Slipstream drafting & aerodynamic straightaway speed.
 *    - Russata (Reds) — Mars-devoted enforcers, heavy jostling & defensive lines.
 *    - Albata (Whites) — Agile Zephyr specialists, smooth lines & rapid whip recovery.
 * 4. Procedural Web Audio Synthesizer:
 *    - Quad-horse gallop rhythms, rumbling wooden currus, snapping whip cracks,
 *      sand drift hiss, metal/wood naufragium crashes, bronze dolphin lap bells,
 *      salpinx brass fanfares, and crowd roar modulation.
 * ============================================================================ */

// ─── PALETTES & HISTORICAL COLOR TOKENS ──────────────────────────────────────

const COLOR_SAND_DEEP = '#937042';
const COLOR_SAND_BASE = '#caa672';
const COLOR_SAND_LIGHT = '#e2c598';
const COLOR_SAND_RUT = '#6e5128';
const COLOR_MARBLE = '#ede8dd';
const COLOR_MARBLE_SHADOW = '#aba292';
const COLOR_MARBLE_DARK = '#7d7465';
const COLOR_GOLD = '#d4af37';
const COLOR_GOLD_BRIGHT = '#ffd700';
const COLOR_GOLD_DULL = '#997e28';
const COLOR_BRONZE = '#8c6239';
const COLOR_BRONZE_DARK = '#4a331c';
const COLOR_OBELISK_GRANITE = '#a64d43';
const COLOR_OBELISK_SHADOW = '#6d2b24';
const COLOR_WATER_DEEP = '#1a525a';
const COLOR_WATER_AQUA = '#2a6f78';
const COLOR_WATER_SHIMMER = '#58b3be';
const COLOR_ROMAN_CRIMSON = '#7e181e';
const COLOR_TYRIAN_PURPLE = '#4d1031';
const COLOR_CHARCOAL = '#141210';
const COLOR_CHARCOAL_LIGHT = '#211d1a';

// ─── FOUR IMPERIAL FACTION SPECIFICATIONS ────────────────────────────────────

export const FACTION_SPECS = [
  {
    id: 'prasina',
    name: 'Prasina (Greens)',
    latinTitle: 'FACTIO PRASINA',
    driver: 'Scorpus',
    tunicColor: '#1e824c',
    tunicDark: '#145a32',
    trimColor: '#ffd700',
    horseColor: '#e8eaed', // White / dapple grey steeds
    horseManeColor: '#b0b5bc',
    tactics: 'Inside Rail Hunter',
    description: 'Devoted to Flora and Spring. Dives aggressively for the tightest inside apex at the metae.',
    lanePreference: 0.16,
    draftingBonus: 1.06,
    corneringBonus: 1.25,
    whipEfficiency: 1.12,
    aggression: 1.35
  },
  {
    id: 'veneta',
    name: 'Veneta (Blues)',
    latinTitle: 'FACTIO VENETA',
    driver: 'Porphyrius',
    tunicColor: '#1b4f72',
    tunicDark: '#113248',
    trimColor: '#e67e22',
    horseColor: '#8a4b27', // Bay / rich chestnut steeds
    horseManeColor: '#361b0c',
    tactics: 'Aerodynamic Drafting',
    description: 'Devoted to Neptune and Winter. Exploits slipstream drafting for high-speed straightaway slingshot passes.',
    lanePreference: 0.50,
    draftingBonus: 1.30,
    corneringBonus: 1.02,
    whipEfficiency: 1.15,
    aggression: 0.95
  },
  {
    id: 'russata',
    name: 'Russata (Reds)',
    latinTitle: 'FACTIO RUSSATA',
    driver: 'Spiculus',
    tunicColor: '#900c3f',
    tunicDark: '#5c0828',
    trimColor: '#d4af37',
    horseColor: '#2b231d', // Dark brown / black steeds
    horseManeColor: '#120f0c',
    tactics: 'Mars Heavy Jostling',
    description: 'Devoted to Mars and Summer. Dominates the track with physical crowding, defensive blocks, and hard contacts.',
    lanePreference: 0.68,
    draftingBonus: 1.03,
    corneringBonus: 0.95,
    whipEfficiency: 1.05,
    aggression: 1.45
  },
  {
    id: 'albata',
    name: 'Albata (Whites)',
    latinTitle: 'FACTIO ALBATA',
    driver: 'Thrax',
    tunicColor: '#dcdde1',
    tunicDark: '#9aa0a6',
    trimColor: '#6c5ce7',
    horseColor: '#7f8c8d', // Silver / iron-grey steeds
    horseManeColor: '#4b5257',
    tactics: 'Zephyr Quick Recovery',
    description: 'Devoted to the Zephyrs and Autumn. Mathematical racing lines with lightning-fast whip surge exiting the metae.',
    lanePreference: 0.36,
    draftingBonus: 1.08,
    corneringBonus: 1.18,
    whipEfficiency: 1.32,
    aggression: 0.85
  }
];

// ─── SAFE PROCEDURAL WEB AUDIO SYNTHESIZER ───────────────────────────────────

class ChariotAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastGallopTime = 0;
    this.lastDriftTime = 0;
  }

  init() {
    if (this.ctx || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      this.ctx = new AudioContextClass();
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playGallop(speedRatio = 1.0, volume = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const minInterval = 0.11 / Math.max(0.4, speedRatio);
    if (t - this.lastGallopTime < minInterval) return;
    this.lastGallopTime = t;

    try {
      // 2-tone quad-hoof impact on hard-packed sand
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115 * (0.92 + Math.random() * 0.16), t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.07);

      gain.gain.setValueAtTime(Math.min(0.25, volume * 0.5), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  playWhip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    try {
      // High-velocity flagellum snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.10);
    } catch {}
  }

  playDrift(intensity = 0.5) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    if (t - this.lastDriftTime < 0.12) return;
    this.lastDriftTime = t;

    try {
      // Sand friction sliding hiss
      const bufSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680, t);
      filter.Q.setValueAtTime(1.8, t);

      const gain = this.ctx.createGain();
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      gain.gain.setValueAtTime(clampedIntensity * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    } catch {}
  }

  playDolphinClank() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    try {
      // Bronze mechanical gong with dual resonant overtones
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(880, t);
      osc1.frequency.exponentialRampToValueAtTime(440, t + 0.38);
      osc2.frequency.setValueAtTime(1320, t);
      osc2.frequency.exponentialRampToValueAtTime(660, t + 0.35);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.40);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.40);
      osc2.stop(t + 0.40);
    } catch {}
  }

  playCrash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    try {
      // Shattering ash wood and bronze wheel collision
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    } catch {}
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Roman Salpinx brass fanfare
    notes.forEach((freq, idx) => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.12);

        gain.gain.setValueAtTime(0, t + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, t + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.12);
        osc.stop(t + idx * 0.12 + 0.30);
      } catch {}
    });
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

// ─── MATHEMATICAL & GEOMETRICAL HELPERS ───────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function normalizeAngle(a) {
  let angle = a;
  while (angle < -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ─── PARTICLE & EFFECTS HIERARCHY ───────────────────────────────────────────

class DustParticle {
  constructor(x, y, vx, vy, radius, alpha, life, color = COLOR_SAND_LIGHT) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.maxLife = life;
    this.life = life;
    this.baseAlpha = alpha;
    this.alpha = alpha;
    this.color = color;
    this.expansion = 1.0 + Math.random() * 1.5;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.88, dt * 60);
    this.vy *= Math.pow(0.88, dt * 60);
    this.life -= dt;
    const progress = clamp(this.life / this.maxLife, 0, 1);
    this.alpha = progress * this.baseAlpha;
    this.radius += dt * this.expansion * 6.0;
  }

  render(ctx) {
    if (this.alpha <= 0.01) return;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = clamp(this.alpha, 0, 1);
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, this.radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class SplinterParticle {
  constructor(x, y, vx, vy, length, width, color = COLOR_BRONZE) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.angle = Math.random() * Math.PI * 2;
    this.vAngle = (Math.random() - 0.5) * 16;
    this.length = length;
    this.width = width;
    this.color = color;
    this.life = 2.5 + Math.random() * 1.5;
    this.maxLife = this.life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);
    this.angle += this.vAngle * dt;
    this.vAngle *= Math.pow(0.95, dt * 60);
    this.life -= dt;
  }

  render(ctx) {
    const alpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.length / 2, -this.width / 2, Math.max(0.5, this.length), Math.max(0.5, this.width));
    ctx.restore();
  }
}

class SkidSegment {
  constructor(x1, y1, x2, y2, width, alpha = 0.35) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width = width;
    this.alpha = alpha;
    this.life = 14.0;
    this.maxLife = 14.0;
  }

  update(dt) {
    this.life -= dt;
    this.alpha = clamp((this.life / this.maxLife) * 0.35, 0, 0.35);
  }

  render(ctx) {
    if (this.alpha <= 0.01) return;
    ctx.strokeStyle = COLOR_SAND_RUT;
    ctx.lineWidth = Math.max(1, this.width);
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
}

class LaurelPetal {
  constructor(x, y, color = '#27ae60') {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 35;
    this.vy = 20 + Math.random() * 30;
    this.angle = Math.random() * Math.PI * 2;
    this.vAngle = (Math.random() - 0.5) * 8;
    this.color = color;
    this.size = 3 + Math.random() * 3;
    this.life = 2.2 + Math.random() * 1.5;
    this.maxLife = this.life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.vAngle * dt;
    this.life -= dt;
  }

  render(ctx) {
    const alpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.1, this.size), Math.max(0.1, this.size * 0.45), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class WaterSplashParticle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 1.2 + Math.random() * 1.6;
    this.life = 0.5 + Math.random() * 0.4;
    this.maxLife = this.life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 80 * dt; // Gravity
    this.life -= dt;
  }

  render(ctx) {
    const alpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.fillStyle = COLOR_WATER_SHIMMER;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, this.radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

// ─── CIRCUS MAXIMUS TRACK GEOMETRY & KINEMATICS ──────────────────────────────

class CircusTrack {
  constructor() {
    this.cx = 400;
    this.cy = 300;
    this.spinaLength = 340;
    this.spinaHalf = 170;
    this.spinaWidth = 44;
    this.trackWidth = 110;

    this.rInner = 22; // Semi-width of spina cap
    this.rOuter = 132;
    this.rMid = 77;

    this.metaPrima = { x: 570, y: 300 };
    this.metaSecunda = { x: 230, y: 300 };

    this.carceresX = 140; // Western starting stalls
    this.cretaS = 0.08; // Normalized lap position of start/finish chalk line
  }

  resize(w, h) {
    this.cx = w / 2;
    this.cy = h / 2;
    this.spinaHalf = clamp(w * 0.26, 140, 360);
    this.spinaLength = this.spinaHalf * 2;
    this.spinaWidth = clamp(h * 0.075, 32, 54);
    this.trackWidth = clamp(h * 0.22, 75, 130);

    this.rInner = this.spinaWidth / 2;
    this.rOuter = this.rInner + this.trackWidth;
    this.rMid = (this.rInner + this.rOuter) / 2;

    this.metaPrima = { x: this.cx + this.spinaHalf, y: this.cy };
    this.metaSecunda = { x: this.cx - this.spinaHalf, y: this.cy };
    this.carceresX = this.cx - this.spinaHalf - this.rOuter * 0.4;
  }

  // Parameterize track position by continuous distance s (0 to 1) and lateral lane d (0 = inner rail, 1 = outer wall)
  eval(s, laneOffset = 0.5) {
    const d = clamp(laneOffset, 0.05, 0.95);
    const R = this.rInner + d * this.trackWidth;
    const straightLen = this.spinaLength;
    const turnLen = Math.PI * R;
    const totalPerimeter = 2 * straightLen + 2 * turnLen;

    let dist = ((s % 1) + 1) % 1 * totalPerimeter;

    // Segment 0: South Straight (West to East towards Meta Prima, heading 0 rad)
    if (dist < straightLen) {
      const p = dist / straightLen;
      const x = (this.cx - this.spinaHalf) + p * straightLen;
      const y = this.cy + R;
      return { x, y, angle: 0, curvature: 0, R, seg: 0 };
    }
    dist -= straightLen;

    // Segment 1: Meta Prima Turn (East curve, counter-clockwise from angle +PI/2 to -PI/2)
    if (dist < turnLen) {
      const p = dist / turnLen;
      const theta = Math.PI / 2 - p * Math.PI;
      const x = this.cx + this.spinaHalf + Math.cos(theta) * R;
      const y = this.cy + Math.sin(theta) * R;
      const angle = theta - Math.PI / 2;
      return { x, y, angle: normalizeAngle(angle), curvature: 1 / Math.max(1, R), R, seg: 1 };
    }
    dist -= turnLen;

    // Segment 2: North Straight (East to West towards Meta Secunda, heading -PI rad)
    if (dist < straightLen) {
      const p = dist / straightLen;
      const x = (this.cx + this.spinaHalf) - p * straightLen;
      const y = this.cy - R;
      return { x, y, angle: -Math.PI, curvature: 0, R, seg: 2 };
    }
    dist -= straightLen;

    // Segment 3: Meta Secunda Turn (West curve, counter-clockwise from angle -PI/2 to -3PI/2)
    const p = clamp(dist / Math.max(0.001, turnLen), 0, 1);
    const theta = -Math.PI / 2 - p * Math.PI;
    const x = this.cx - this.spinaHalf + Math.cos(theta) * R;
    const y = this.cy + Math.sin(theta) * R;
    const angle = theta - Math.PI / 2;
    return { x, y, angle: normalizeAngle(angle), curvature: 1 / Math.max(1, R), R, seg: 3 };
  }

  // Lap distance delta accounting for track loop wrap
  getLapDistance(s1, s2) {
    let delta = s2 - s1;
    while (delta < -0.5) delta += 1.0;
    while (delta > 0.5) delta -= 1.0;
    return delta;
  }
}

// ─── QUADRIGA STEED (INDIVIDUAL HORSE RIG & KINEMATICS) ──────────────────────

class QuadrigaHorse {
  constructor(index, name, role, harnessOffsetLateral, horseColor, maneColor) {
    this.index = index;
    this.name = name; // Funalis Sinister, Iugalis Sinister, Iugalis Dexter, Funalis Dexter
    this.role = role;
    this.lateralOffset = harnessOffsetLateral; // Lateral position along chariot yoke beam
    this.horseColor = horseColor;
    this.maneColor = maneColor;

    this.gallopPhase = (index * 0.25) % 1.0; // Phase staggering for authentic 4-beat rhythm
    this.strideCycle = 0;
    this.headBob = 0;
    this.tailSway = 0;
    this.strain = 0.5;
  }

  update(dt, forwardSpeed, isWhipping) {
    const cadence = (forwardSpeed / 90.0) * (isWhipping ? 1.35 : 1.0);
    this.gallopPhase = (this.gallopPhase + dt * cadence * 2.8) % 1.0;
    this.strideCycle = Math.sin(this.gallopPhase * Math.PI * 2);
    this.headBob = Math.sin(this.gallopPhase * Math.PI * 2 - 0.4) * 3.5;
    this.tailSway = Math.cos(this.gallopPhase * Math.PI * 2) * 4.0;
    this.strain = isWhipping ? 1.0 : clamp(forwardSpeed / 240, 0.3, 0.9);
  }

  render(ctx, chariotAngle, bodyRoll) {
    ctx.save();
    // Offset horse laterally along yoke beam
    ctx.translate(22, this.lateralOffset);
    ctx.rotate(this.headBob * 0.02 * bodyRoll);

    // Horse Torso (muscular barrel)
    ctx.fillStyle = this.horseColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rump & Hindquarters
    ctx.beginPath();
    ctx.arc(-8, 0, Math.max(0.1, 4.8), 0, Math.PI * 2);
    ctx.fill();

    // Shoulders & Chest
    ctx.beginPath();
    ctx.arc(8, 0, Math.max(0.1, 4.6), 0, Math.PI * 2);
    ctx.fill();

    // Neck & Head with Gallop Bobbing motion
    const neckAngle = 0.28 + this.headBob * 0.05;
    ctx.save();
    ctx.translate(10, 0);
    ctx.rotate(neckAngle);
    ctx.fillStyle = this.horseColor;
    ctx.fillRect(0, -2.5, 7, 5); // Neck
    ctx.beginPath();
    ctx.arc(8, -0.5, Math.max(0.1, 3.2), 0, Math.PI * 2); // Head
    ctx.fill();

    // Snout / Muzzle
    ctx.fillStyle = '#222';
    ctx.fillRect(9, -1.8, 3.5, 3.6);

    // Ears
    ctx.fillStyle = this.horseColor;
    ctx.beginPath();
    ctx.moveTo(7, -3);
    ctx.lineTo(8.5, -6);
    ctx.lineTo(9.5, -3);
    ctx.fill();

    // Flowing Mane Strands
    ctx.strokeStyle = this.maneColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(1, -2.8);
    ctx.lineTo(-2 + Math.sin(this.strideCycle) * 2, -4);
    ctx.moveTo(5, -2.8);
    ctx.lineTo(2 + Math.sin(this.strideCycle) * 2, -4.5);
    ctx.stroke();

    // Bridle & Bit (Bronze)
    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(7, -2.5, 4, 4);

    ctx.restore();

    // Galloping Forelegs (Articulated kinematics)
    ctx.strokeStyle = this.horseColor;
    ctx.lineWidth = 2.2;
    const foreLegSwing = Math.sin(this.gallopPhase * Math.PI * 2) * 6.0;
    ctx.beginPath();
    ctx.moveTo(7, -3.5);
    ctx.lineTo(10 + foreLegSwing, -7); // Left foreleg
    ctx.moveTo(7, 3.5);
    ctx.lineTo(10 - foreLegSwing, 7);  // Right foreleg
    ctx.stroke();

    // Hooves (Bronze / Dark horn)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(9 + foreLegSwing, -8, 2.5, 2.2);
    ctx.fillRect(9 - foreLegSwing, 6, 2.5, 2.2);

    // Galloping Hindlegs
    const hindLegSwing = Math.sin((this.gallopPhase + 0.3) * Math.PI * 2) * 5.5;
    ctx.beginPath();
    ctx.moveTo(-7, -3.5);
    ctx.lineTo(-11 - hindLegSwing, -7);
    ctx.moveTo(-7, 3.5);
    ctx.lineTo(-11 + hindLegSwing, 7);
    ctx.stroke();

    ctx.fillRect(-12 - hindLegSwing, -8, 2.5, 2.2);
    ctx.fillRect(-12 + hindLegSwing, 6, 2.5, 2.2);

    // Flowing Tail Strands
    ctx.strokeStyle = this.maneColor;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.quadraticCurveTo(-16, this.tailSway * 1.5, -20, this.tailSway * 2.2);
    ctx.stroke();

    // Leather Harness & Yoke Straps
    ctx.strokeStyle = '#4a2c11';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, 4.8), -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ─── QUADRIGA VEHICLE & DRIVER (ROMAN CURRUS) ────────────────────────────────

class ChariotVehicle {
  constructor(factionSpec, isPlayer = false, initialLane = 0.5) {
    this.spec = factionSpec;
    this.isPlayer = isPlayer;
    this.name = factionSpec.name;
    this.color = factionSpec.tunicColor;
    this.trimColor = factionSpec.trimColor;

    // Track positioning
    this.s = 0; // Lap distance (0 to 1)
    this.laneOffset = initialLane; // Target lateral lane (0 to 1)
    this.d = initialLane; // Current lateral lane
    this.lap = 0;
    this.totalDistance = 0;
    this.lapStartTime = 0;
    this.bestLapTime = Infinity;
    this.lastLapTime = 0;

    // Physical Kinematic State
    this.x = 0;
    this.y = 0;
    this.angle = 0; // Chassis heading
    this.bodyRoll = 0; // Outward tilt on turns
    this.speed = 190.0; // Forward velocity (px/sec)
    this.targetSpeed = 225.0;
    this.lateralVel = 0;
    this.slipAngle = 0; // Drift slip angle beta
    this.isDrifting = false;
    this.skidIntensity = 0;

    // Stamina & Whip Dynamics
    this.stamina = 100.0;
    this.maxStamina = 100.0;
    this.whipBoostTimer = 0;
    this.whipCooldown = 0;
    this.handbrake = false;

    // Durability & Naufragium
    this.durability = 100.0;
    this.isCrashed = false;
    this.crashTimer = 0;
    this.finishPosition = null;
    this.finishTime = 0;

    // Collision flash feedback
    this.collisionFlashTimer = 0;

    // 4-horse harness rig
    this.horses = [
      new QuadrigaHorse(0, 'Funalis Sinister', 'outrider_left', -16, factionSpec.horseColor, factionSpec.horseManeColor),
      new QuadrigaHorse(1, 'Iugalis Sinister', 'yoke_left', -5.5, factionSpec.horseColor, factionSpec.horseManeColor),
      new QuadrigaHorse(2, 'Iugalis Dexter', 'yoke_right', 5.5, factionSpec.horseColor, factionSpec.horseManeColor),
      new QuadrigaHorse(3, 'Funalis Dexter', 'outrider_right', 16, factionSpec.horseColor, factionSpec.horseManeColor)
    ];

    // Wheel rotation and reins animation
    this.wheelRotation = 0;
    this.reinsWiggle = 0;

    // AI tactical state
    this.aiSteerTimer = Math.random() * 2;
    this.aiWhipTimer = 1.0 + Math.random() * 2;
    this.draftingTarget = null;
    this.isDrafting = false;
  }

  whip() {
    if (this.isCrashed || this.whipCooldown > 0 || this.stamina < 10) return false;
    this.whipBoostTimer = 1.8;
    this.whipCooldown = 1.6;
    this.stamina = Math.max(0, this.stamina - 15);
    return true;
  }

  triggerNaufragium(engine) {
    if (this.isCrashed) return;
    this.isCrashed = true;
    this.durability = 0;
    this.crashTimer = 0;

    // Explode into flying splinter debris
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 160;
      engine.splinters.push(
        new SplinterParticle(
          this.x + (Math.random() - 0.5) * 20,
          this.y + (Math.random() - 0.5) * 20,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          6 + Math.random() * 12,
          1.8 + Math.random() * 2.2,
          i % 3 === 0 ? COLOR_GOLD : (i % 2 === 0 ? this.color : COLOR_BRONZE_DARK)
        )
      );
    }

    // Heavy dust explosion
    for (let i = 0; i < 25; i++) {
      engine.dustParticles.push(
        new DustParticle(
          this.x + (Math.random() - 0.5) * 15,
          this.y + (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 90,
          (Math.random() - 0.5) * 90,
          4 + Math.random() * 8,
          0.85,
          1.2,
          COLOR_SAND_LIGHT
        )
      );
    }

    engine.audio.playCrash();
    engine.addChronicle(`💥 NAUFRAGIUM! ${this.name} shatters violently in the turn!`);
  }

  update(dt, track, engine) {
    if (this.collisionFlashTimer > 0) {
      this.collisionFlashTimer = Math.max(0, this.collisionFlashTimer - dt);
    }

    if (this.isCrashed) {
      this.crashTimer += dt;
      this.speed *= Math.pow(0.85, dt * 60);
      return;
    }

    // Recover stamina gradually
    this.stamina = Math.min(this.maxStamina, this.stamina + dt * 6.5);
    if (this.whipCooldown > 0) this.whipCooldown = Math.max(0, this.whipCooldown - dt);

    // Whip boost progression
    let currentMaxSpeed = this.targetSpeed * engine.speedMultiplier;
    if (this.whipBoostTimer > 0) {
      this.whipBoostTimer = Math.max(0, this.whipBoostTimer - dt);
      currentMaxSpeed *= 1.35 * this.spec.whipEfficiency;
    }

    // Slipstream drafting bonus
    this.isDrafting = false;
    if (this.draftingTarget && !this.draftingTarget.isCrashed) {
      const dist = track.getLapDistance(this.s, this.draftingTarget.s);
      // Directly behind leader within 0.025 lap distance (~50px)
      if (dist > 0 && dist < 0.025 && Math.abs(this.d - this.draftingTarget.d) < 0.15) {
        this.isDrafting = true;
        currentMaxSpeed *= this.spec.draftingBonus;
      }
    }

    // Handbrake deceleration
    if (this.handbrake) {
      currentMaxSpeed *= 0.65;
    }

    // Accelerate or coast towards currentMaxSpeed
    const accel = this.whipBoostTimer > 0 ? 140 : 65;
    if (this.speed < currentMaxSpeed) {
      this.speed = Math.min(currentMaxSpeed, this.speed + accel * dt);
    } else {
      this.speed = Math.max(currentMaxSpeed, this.speed - 70 * dt);
    }

    // Evaluate track target at current s and lane d
    const trackPt = track.eval(this.s, this.d);
    this.x = trackPt.x;
    this.y = trackPt.y;

    // Centrifugal acceleration: a_c = v^2 * kappa
    const a_c = Math.pow(this.speed, 2) * trackPt.curvature;
    const gripLimit = 9.81 * engine.driftTraction * 180; // Scaled friction threshold
    const lateralExcess = a_c - gripLimit;

    // Non-linear Centrifugal Drift Dynamics
    if (lateralExcess > 0 || this.handbrake) {
      this.isDrifting = true;
      this.skidIntensity = clamp(lateralExcess / (gripLimit * 0.7), 0.2, 1.0);
      if (this.handbrake) this.skidIntensity = 1.0;

      // Chariot slides outward on the sand
      const driftOutwardRate = (this.skidIntensity * 0.45 + (this.handbrake ? 0.35 : 0)) * dt;
      this.d = clamp(this.d + driftOutwardRate, 0.06, 0.94);

      // Body roll outwards
      this.bodyRoll = lerp(this.bodyRoll, clamp(a_c / 450, -0.6, 0.6), dt * 8);

      // Slip angle: heading rotates inwards while velocity vector slides
      this.slipAngle = lerp(this.slipAngle, clamp(a_c / 600, -0.45, 0.45), dt * 6);

      // Deposit persistent skid ruts on sand
      if (Math.random() < 0.6) {
        const perpX = -Math.sin(trackPt.angle);
        const perpY = Math.cos(trackPt.angle);
        const wLeftX = this.x + perpX * 12;
        const wLeftY = this.y + perpY * 12;
        const wRightX = this.x - perpX * 12;
        const wRightY = this.y - perpY * 12;

        engine.skidMarks.push(new SkidSegment(wLeftX, wLeftY, wLeftX + Math.cos(trackPt.angle) * 8, wLeftY + Math.sin(trackPt.angle) * 8, 2.5, 0.35));
        engine.skidMarks.push(new SkidSegment(wRightX, wRightY, wRightX + Math.cos(trackPt.angle) * 8, wRightY + Math.sin(trackPt.angle) * 8, 2.5, 0.35));
      }

      // Kicking sand & dust vortices
      if (Math.random() < 0.45) {
        engine.dustParticles.push(
          new DustParticle(
            this.x - Math.cos(trackPt.angle) * 16 + (Math.random() - 0.5) * 8,
            this.y - Math.sin(trackPt.angle) * 16 + (Math.random() - 0.5) * 8,
            -Math.cos(trackPt.angle) * (60 + Math.random() * 40) + (Math.random() - 0.5) * 30,
            -Math.sin(trackPt.angle) * (60 + Math.random() * 40) + (Math.random() - 0.5) * 30,
            2.5 + Math.random() * 3.5,
            0.55,
            0.9,
            COLOR_SAND_LIGHT
          )
        );
      }

      if (this.isPlayer && Math.random() < 0.25) {
        engine.audio.playDrift(this.skidIntensity);
      }
    } else {
      this.isDrifting = false;
      this.skidIntensity = 0;
      this.slipAngle = lerp(this.slipAngle, 0, dt * 7);
      this.bodyRoll = lerp(this.bodyRoll, 0, dt * 7);

      // Smoothly track towards target lane
      this.d = lerp(this.d, this.laneOffset, dt * 2.5 * engine.metaTurnSharpness);
    }

    this.angle = trackPt.angle + this.slipAngle;

    // Progress along track perimeter
    const totalTrackPerimeter = 2 * track.spinaLength + 2 * Math.PI * trackPt.R;
    const ds = (this.speed / Math.max(10, totalTrackPerimeter)) * dt;
    const oldS = this.s;
    this.s = (this.s + ds) % 1.0;
    this.totalDistance += this.speed * dt;

    // Lap crossing logic (Creta start/finish line)
    if (oldS < track.cretaS && this.s >= track.cretaS) {
      this.lap++;
      const now = performance.now ? performance.now() / 1000 : Date.now() / 1000;
      if (this.lapStartTime > 0) {
        this.lastLapTime = now - this.lapStartTime;
        if (this.lastLapTime < this.bestLapTime) {
          this.bestLapTime = this.lastLapTime;
        }
      }
      this.lapStartTime = now;
      engine.onChariotLap(this);
    }

    // Wheel rotation and reins animation
    this.wheelRotation = (this.wheelRotation + (this.speed / 14.0) * dt) % (Math.PI * 2);
    this.reinsWiggle = Math.sin(this.wheelRotation * 3.0) * 1.5;

    // Update 4 individual horses
    this.horses.forEach(h => h.update(dt, this.speed, this.whipBoostTimer > 0));

    // Audio gallop
    if (this.isPlayer) {
      engine.audio.playGallop(this.speed / 180, 0.2);
    }

    // Check collision with Meta turning posts
    this.checkMetaCollision(track, engine);
  }

  checkMetaCollision(track, engine) {
    // If inside lane d is clipped too tight at the apex of Meta Prima or Meta Secunda
    const distToMeta1 = Math.hypot(this.x - track.metaPrima.x, this.y - track.metaPrima.y);
    const distToMeta2 = Math.hypot(this.x - track.metaSecunda.x, this.y - track.metaSecunda.y);

    if (distToMeta1 < track.rInner + 6 || distToMeta2 < track.rInner + 6) {
      // Clipped the conical metae turning post!
      this.durability -= 65;
      this.collisionFlashTimer = 0.35;
      engine.audio.playCrash();
      if (this.durability <= 0) {
        this.triggerNaufragium(engine);
      } else {
        // Severe bounce off the bronze base
        this.d = Math.min(0.85, this.d + 0.35);
        this.speed *= 0.45;
        engine.addChronicle(`⚠️ ${this.name} clipped the gilded Meta!`);
      }
    }
  }

  render(ctx) {
    if (this.isCrashed && this.crashTimer > 6.0) return; // Disintegrated after full wreck

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // ── 1. Render Reins from Auriga to 4 Horses ──
    ctx.strokeStyle = '#3a2312';
    ctx.lineWidth = 1.0;
    this.horses.forEach(h => {
      ctx.beginPath();
      ctx.moveTo(-16, 0); // Driver hands
      ctx.quadraticCurveTo(2, h.lateralOffset * 0.5 + this.reinsWiggle, 24, h.lateralOffset);
      ctx.stroke();
    });

    // ── 2. Yoke Pole (Temo) between yoke horses ──
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();

    // Cross-yoke beam (Iugum)
    ctx.strokeStyle = '#3d2613';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.lineTo(18, 12);
    ctx.stroke();

    // ── 3. Render the 4 Quadriga Horses ──
    this.horses.forEach(h => h.render(ctx, this.angle, this.bodyRoll));

    // ── 4. Chariot Body (Roman Currus) ──
    ctx.save();
    ctx.translate(-16, 0);
    // Body roll tilt
    ctx.rotate(this.bodyRoll * 0.25);

    // Axle beam
    ctx.fillStyle = COLOR_BRONZE;
    ctx.fillRect(-2, -14, 4, 28);

    // 2 Wheels with rotating spokes
    this.renderWheel(ctx, 0, -14);
    this.renderWheel(ctx, 0, 14);

    // Currus Platform (Tabula)
    ctx.fillStyle = '#422817';
    ctx.beginPath();
    ctx.roundRect(-10, -9, 14, 18, 2);
    ctx.fill();

    // Semicircular Curved Front Shield
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, 9.5), -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-4, 9.5);
    ctx.lineTo(-4, -9.5);
    ctx.closePath();
    ctx.fill();

    // Shield Embossed Gold / Trim Rim
    ctx.strokeStyle = this.trimColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Faction Bronze Medallion
    ctx.fillStyle = COLOR_GOLD_BRIGHT;
    ctx.beginPath();
    ctx.arc(3, 0, Math.max(0.1, 3.2), 0, Math.PI * 2);
    ctx.fill();

    // ── 5. Auriga (Driver) Figure ──
    ctx.save();
    ctx.translate(-3, 0);
    // Driver leans into the turns
    ctx.rotate(-this.bodyRoll * 0.35);

    // Driver Tunic
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 4.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leather protective bands (Fasciae) across chest
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-3, -2); ctx.lineTo(3, 2);
    ctx.moveTo(-3, 2); ctx.lineTo(3, -2);
    ctx.stroke();

    // Helmet (Galea) with crest
    ctx.fillStyle = COLOR_BRONZE;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, 3.0), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.trimColor;
    ctx.fillRect(-1.5, -4.5, 3.0, 2.0); // Helmet crest

    // Whip (Flagellum) in driver hand -- always show handle, animate crack when boosting
    ctx.strokeStyle = '#2b180d';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.lineTo(4, 6); // Whip handle always visible
    ctx.stroke();

    if (this.whipBoostTimer > 0) {
      const whipPhase = this.whipBoostTimer * 8;
      // Animated cracking whip lash
      ctx.strokeStyle = '#2b180d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.quadraticCurveTo(10, 14 + Math.sin(whipPhase) * 6, 20, 6 + Math.cos(whipPhase * 1.5) * 4);
      ctx.stroke();

      // Whip crack tip spark
      const tipX = 20;
      const tipY = 6 + Math.cos(whipPhase * 1.5) * 4;
      if (this.whipBoostTimer > 1.2) {
        ctx.fillStyle = COLOR_GOLD_BRIGHT;
        ctx.globalAlpha = clamp((this.whipBoostTimer - 1.2) * 4, 0, 1);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Speed lines behind the chariot during boost
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.lineWidth = 1.0;
      for (let sl = 0; sl < 3; sl++) {
        const ly = -6 + sl * 6;
        ctx.beginPath();
        ctx.moveTo(-22, ly);
        ctx.lineTo(-22 - 8 - Math.random() * 6, ly);
        ctx.stroke();
      }
    }

    ctx.restore(); // End Auriga
    ctx.restore(); // End Currus

    // Collision flash overlay
    if (this.collisionFlashTimer > 0) {
      const flashAlpha = clamp(this.collisionFlashTimer / 0.35, 0, 0.7);
      ctx.fillStyle = `rgba(255, 60, 60, ${flashAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player indicator marker
    if (this.isPlayer) {
      ctx.fillStyle = COLOR_GOLD_BRIGHT;
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(-34, -5);
      ctx.lineTo(-34, 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  renderWheel(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Wheel tire rim
    ctx.strokeStyle = '#261c14';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-5, -1.5, 10, 3);

    // Bronze Hubcap
    ctx.fillStyle = COLOR_GOLD;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, 2.0), 0, Math.PI * 2);
    ctx.fill();

    // 6 Rotating spokes (rendered as dynamic spoke lines)
    ctx.strokeStyle = COLOR_BRONZE_DARK;
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const spkAngle = this.wheelRotation + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(spkAngle) * 4.5, Math.sin(spkAngle) * 1.5);
      ctx.lineTo(-Math.cos(spkAngle) * 4.5, -Math.sin(spkAngle) * 1.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ─── STADIUM CAVEA & 320+ ANIMATED SPECTATORS ─────────────────────────────────

class SpectatorSystem {
  constructor(count = 320) {
    this.count = count;
    this.spectators = [];
    this.wavePhase = 0;
    this.waveActive = true;
  }

  init(track) {
    this.spectators = [];
    const colors = [
      '#1e824c', // Greens
      '#1b4f72', // Blues
      '#900c3f', // Reds
      '#dcdde1', // Whites
      COLOR_ROMAN_CRIMSON,
      COLOR_MARBLE,
      COLOR_GOLD
    ];

    // 1. North Cavea (Upper tiers, straight stretch)
    const northRows = 4;
    const northCols = 32;
    for (let r = 0; r < northRows; r++) {
      for (let c = 0; c < northCols; c++) {
        const p = c / (northCols - 1);
        const x = (track.cx - track.spinaHalf) + p * track.spinaLength;
        const y = (track.cy - track.rOuter - 14) - r * 10;
        this.spectators.push(this.createSpectator(x, y, p * Math.PI, colors));
      }
    }

    // 2. South Cavea (Lower tiers, straight stretch)
    const southRows = 4;
    const southCols = 32;
    for (let r = 0; r < southRows; r++) {
      for (let c = 0; c < southCols; c++) {
        const p = c / (southCols - 1);
        const x = (track.cx - track.spinaHalf) + p * track.spinaLength;
        const y = (track.cy + track.rOuter + 14) + r * 10;
        this.spectators.push(this.createSpectator(x, y, p * Math.PI + Math.PI, colors));
      }
    }

    // 3. Meta Prima Curve Cavea (East semicircular stadium bowl)
    const curveEastTiers = 3;
    const curveEastCount = 20;
    for (let t = 0; t < curveEastTiers; t++) {
      const rad = track.rOuter + 16 + t * 11;
      for (let i = 0; i < curveEastCount; i++) {
        const th = -Math.PI / 2 + (i / (curveEastCount - 1)) * Math.PI;
        const x = track.cx + track.spinaHalf + Math.cos(th) * rad;
        const y = track.cy + Math.sin(th) * rad;
        this.spectators.push(this.createSpectator(x, y, th, colors));
      }
    }

    // 4. Meta Secunda Curve Cavea (West semicircular stadium bowl)
    const curveWestTiers = 3;
    const curveWestCount = 20;
    for (let t = 0; t < curveWestTiers; t++) {
      const rad = track.rOuter + 16 + t * 11;
      for (let i = 0; i < curveWestCount; i++) {
        const th = Math.PI / 2 + (i / (curveWestCount - 1)) * Math.PI;
        const x = track.cx - track.spinaHalf + Math.cos(th) * rad;
        const y = track.cy + Math.sin(th) * rad;
        this.spectators.push(this.createSpectator(x, y, th, colors));
      }
    }
  }

  createSpectator(x, y, spatialPhase, colors) {
    return {
      x,
      y,
      baseY: y,
      color: colors[Math.floor(Math.random() * colors.length)],
      spatialPhase,
      hasBanner: Math.random() < 0.28,
      bannerColor: colors[Math.floor(Math.random() * 4)],
      armOffset: 0,
      jumpOffset: 0,
      excitement: 0
    };
  }

  update(dt, waveActive) {
    this.waveActive = waveActive;
    if (this.waveActive) {
      this.wavePhase = (this.wavePhase + dt * 2.8) % (Math.PI * 2);
    }

    this.spectators.forEach(s => {
      if (this.waveActive) {
        // Sinusoidal wave wave (undulatio)
        const waveAngle = this.wavePhase - s.spatialPhase;
        const waveIntensity = Math.max(0, Math.sin(waveAngle));
        s.jumpOffset = waveIntensity > 0.75 ? (waveIntensity - 0.75) * 14 : 0;
        s.armOffset = waveIntensity * 3.5;
        s.excitement = waveIntensity;
      } else {
        s.jumpOffset = lerp(s.jumpOffset, 0, dt * 6);
        s.armOffset = lerp(s.armOffset, 0, dt * 6);
      }
    });
  }

  render(ctx) {
    this.spectators.forEach(s => {
      const curY = s.baseY - s.jumpOffset;

      // Spectator Tunic
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, curY, Math.max(0.1, 2.6), 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#edd2b6';
      ctx.beginPath();
      ctx.arc(s.x, curY - 2.8, Math.max(0.1, 1.8), 0, Math.PI * 2);
      ctx.fill();

      // Faction Vexillum (Banner)
      if (s.hasBanner && s.excitement > 0.3) {
        ctx.strokeStyle = '#4a3219';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x, curY);
        ctx.lineTo(s.x + 3, curY - 9 - s.armOffset);
        ctx.stroke();

        ctx.fillStyle = s.bannerColor;
        ctx.fillRect(s.x + 3, curY - 9 - s.armOffset, 5, 3.5);
      }
    });
  }
}

// ─── MONUMENTAL SPINA & SACRED ORNAMENTS ─────────────────────────────────────

class SpinaMonuments {
  constructor() {
    this.delphinesLapsFlipped = 0; // 0 to 7
    this.ovaLapsLowered = 0; // 0 to 7
    this.waterRipple = 0;
    this.obeliskShadowAngle = 0.5;
  }

  reset() {
    this.delphinesLapsFlipped = 0;
    this.ovaLapsLowered = 0;
  }

  onLapComplete(leaderLap) {
    this.delphinesLapsFlipped = clamp(leaderLap, 0, 7);
    this.ovaLapsLowered = clamp(leaderLap, 0, 7);
  }

  update(dt) {
    this.waterRipple = (this.waterRipple + dt * 1.5) % (Math.PI * 2);
  }

  render(ctx, track) {
    const cx = track.cx;
    const cy = track.cy;
    const halfLen = track.spinaHalf;
    const w = track.spinaWidth;

    // ── 1. Spina Outer Marble Curb ──
    ctx.fillStyle = COLOR_MARBLE_SHADOW;
    ctx.beginPath();
    ctx.roundRect(cx - halfLen, cy - w / 2, halfLen * 2, w, w / 2);
    ctx.fill();

    ctx.fillStyle = COLOR_MARBLE;
    ctx.beginPath();
    ctx.roundRect(cx - halfLen + 3, cy - w / 2 + 3, (halfLen * 2) - 6, w - 6, (w - 6) / 2);
    ctx.fill();

    // ── 2. Euripus Water Canal ──
    ctx.fillStyle = COLOR_WATER_AQUA;
    ctx.beginPath();
    ctx.roundRect(cx - halfLen * 0.75, cy - 6, halfLen * 1.5, 12, 6);
    ctx.fill();

    // Water shimmering reflections
    ctx.strokeStyle = COLOR_WATER_SHIMMER;
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 6; i++) {
      const ripX = cx - halfLen * 0.6 + i * (halfLen * 0.24) + Math.sin(this.waterRipple + i) * 8;
      ctx.beginPath();
      ctx.moveTo(ripX, cy - 3);
      ctx.lineTo(ripX + 18, cy + 3);
      ctx.stroke();
    }

    // ── 3. Flaminian Egyptian Obelisk (Augustus Obeliscus) ──
    this.renderObelisk(ctx, cx, cy);

    // ── 4. The 7 Bronze Dolphins (Delphines Lap Counter) ──
    this.renderDelphines(ctx, cx - halfLen * 0.42, cy);

    // ── 5. The 7 Marble Eggs (Ova Lap Counter) ──
    this.renderOva(ctx, cx + halfLen * 0.42, cy);

    // ── 6. Temple Shrine of Consus & Cybele ──
    this.renderShrine(ctx, cx - halfLen * 0.15, cy);
    this.renderShrine(ctx, cx + halfLen * 0.15, cy);

    // ── 7. Meta Prima & Meta Secunda (Triple Gilded Conical Turning Posts) ──
    this.renderMeta(ctx, track.metaPrima.x, track.metaPrima.y, 'Meta Prima');
    this.renderMeta(ctx, track.metaSecunda.x, track.metaSecunda.y, 'Meta Secunda');
  }

  renderObelisk(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Plinth base
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-8, -8, 16, 16);

    // Tapering Red Granite Shaft (Vertical top-down isometric projection)
    ctx.fillStyle = COLOR_OBELISK_GRANITE;
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.lineTo(3, -22);
    ctx.lineTo(-3, -22);
    ctx.closePath();
    ctx.fill();

    // Authentic Hieroglyphic Carving Bands
    ctx.strokeStyle = COLOR_GOLD_BRIGHT;
    ctx.lineWidth = 0.8;
    for (let b = -18; b <= 0; b += 4) {
      ctx.beginPath();
      ctx.moveTo(-2.5, b);
      ctx.lineTo(2.5, b);
      ctx.stroke();
    }

    // Gilded Pyramidion (Golden Top)
    ctx.fillStyle = COLOR_GOLD_BRIGHT;
    ctx.beginPath();
    ctx.moveTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.lineTo(0, -28);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderDelphines(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Bronze gantry crossbeam
    ctx.fillStyle = COLOR_BRONZE;
    ctx.fillRect(-22, -10, 44, 4);

    // 7 Bronze Dolphins
    const startX = -18;
    const spacing = 6;
    for (let i = 0; i < 7; i++) {
      const dolX = startX + i * spacing;
      const isFlipped = i < this.delphinesLapsFlipped;

      ctx.save();
      ctx.translate(dolX, -8);
      // Tipping animation: nose points downward when lap is completed
      ctx.rotate(isFlipped ? Math.PI / 2 : 0);

      ctx.fillStyle = isFlipped ? COLOR_BRONZE_DARK : COLOR_GOLD;
      ctx.beginPath();
      // Curved dolphin body
      ctx.ellipse(0, 0, Math.max(0.1, 2.5), Math.max(0.1, 1.2), 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail fin
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(-4.0, -1.8);
      ctx.lineTo(-4.0, 1.8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  renderOva(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Marble Podium Architrave
    ctx.fillStyle = COLOR_MARBLE_SHADOW;
    ctx.fillRect(-22, 6, 44, 3.5);

    // 7 Gleaming Marble Eggs
    const startX = -18;
    const spacing = 6;
    for (let i = 0; i < 7; i++) {
      const eggX = startX + i * spacing;
      const isLowered = i < this.ovaLapsLowered;

      ctx.fillStyle = isLowered ? 'rgba(237, 232, 221, 0.25)' : COLOR_MARBLE;
      ctx.beginPath();
      ctx.ellipse(eggX, isLowered ? 12 : 7.5, Math.max(0.1, 2.2), Math.max(0.1, 1.6), 0, 0, Math.PI * 2);
      ctx.fill();

      if (!isLowered) {
        ctx.strokeStyle = COLOR_GOLD;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderShrine(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Tetrastyle Shrine (Temple of Consus)
    ctx.fillStyle = COLOR_MARBLE;
    ctx.fillRect(-9, -7, 18, 14);

    // 4 Columns
    ctx.fillStyle = COLOR_MARBLE_SHADOW;
    for (let i = -6; i <= 6; i += 4) {
      ctx.fillRect(i, -6, 2, 12);
    }

    // Pediment & Cult Statue (Gold)
    ctx.fillStyle = COLOR_GOLD;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, 2.4), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderMeta(ctx, x, y, label) {
    ctx.save();
    ctx.translate(x, y);

    // Semicircular Marble Base
    ctx.fillStyle = COLOR_MARBLE_SHADOW;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, 16), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3 Gilded Bronze Conical Turning Posts
    const cones = [
      { x: -5, y: -5 },
      { x: 6, y: 0 },
      { x: -5, y: 5 }
    ];

    cones.forEach(c => {
      // Base ring
      ctx.fillStyle = COLOR_BRONZE;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(0.1, 4.2), 0, Math.PI * 2);
      ctx.fill();

      // Gilded conical summit
      ctx.fillStyle = COLOR_GOLD_BRIGHT;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(0.1, 2.2), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

// ─── HUD OVERLAYS & TELEMETRY GAUGES ──────────────────────────────────────────

class ChariotHUD {
  constructor() {
    this.chronicleFeed = [];
    this.speedometerVal = 0;
    this.lateralGVal = 0;
  }

  addChronicle(msg) {
    this.chronicleFeed.unshift({ text: msg, time: 5.0 });
    if (this.chronicleFeed.length > 5) this.chronicleFeed.pop();
  }

  update(dt, player) {
    for (let i = this.chronicleFeed.length - 1; i >= 0; i--) {
      this.chronicleFeed[i].time -= dt;
      if (this.chronicleFeed[i].time <= 0) {
        this.chronicleFeed.splice(i, 1);
      }
    }

    // Frame-rate independent gauge smoothing (moved from render)
    if (player) {
      const targetStadia = (player.speed / 210.0) * 38.0;
      const smoothFactor = 1 - Math.pow(0.001, dt);
      this.speedometerVal = lerp(this.speedometerVal, targetStadia, smoothFactor);
      const targetG = (Math.pow(player.speed, 2) * (player.isDrifting ? 0.006 : 0.002)) / 9.81;
      this.lateralGVal = lerp(this.lateralGVal, targetG, smoothFactor);
    }
  }

  render(ctx, w, h, engine) {
    const player = engine.playerVehicle;
    const narrow = w < 560;

    this.renderLeaderboard(ctx, 16, 16, engine, narrow);
    if (engine.showTelemetry) {
      this.renderTelemetryGauges(ctx, 16, h - 88, player, narrow);
    }
    this.renderSpinaLapBanner(ctx, w / 2, 28, engine, narrow);
    this.renderPositionIndicator(ctx, w, h, engine, narrow);
    if (!narrow) {
      this.renderChronicleTicker(ctx, w / 2, h - 24);
    }
  }

  renderLeaderboard(ctx, x, y, engine, narrow) {
    // Sort chariots by total distance completed
    const sorted = [...engine.chariots].sort((a, b) => b.totalDistance - a.totalDistance);

    const boxW = narrow ? 160 : 210;
    const boxH = narrow ? 100 : 120;

    // Semi-transparent Roman Parchment / Charcoal frame
    ctx.fillStyle = 'rgba(18, 15, 12, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, boxW, boxH);

    // Title banner
    ctx.fillStyle = COLOR_GOLD_BRIGHT;
    ctx.font = 'bold 11px Cinzel, "Times New Roman", serif';
    ctx.fillText('CIRCUS MAXIMUS — GRAND PRIX', x + 10, y + 16);

    ctx.font = '9px "JetBrains Mono", monospace';
    const romanNumerals = ['I', 'II', 'III', 'IV'];

    sorted.forEach((chariot, idx) => {
      const rowY = y + 36 + idx * 19;

      // Rank
      ctx.fillStyle = COLOR_GOLD;
      ctx.fillText(romanNumerals[idx] || `${idx + 1}`, x + 10, rowY);

      // Faction Color Swatch
      ctx.fillStyle = chariot.color;
      ctx.fillRect(x + 24, rowY - 8, 8, 8);
      ctx.strokeStyle = chariot.trimColor;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 24, rowY - 8, 8, 8);

      // Driver & Faction Name
      ctx.fillStyle = chariot.isPlayer ? '#ffffff' : '#ccc';
      ctx.fillText(`${chariot.spec.driver} (${chariot.spec.id.toUpperCase()})`, x + 38, rowY);

      // Lap or Status
      if (chariot.isCrashed) {
        ctx.fillStyle = '#ff4444';
        ctx.fillText('NAUFRAGIUM', x + 146, rowY);
      } else if (chariot.lap >= 7) {
        ctx.fillStyle = COLOR_GOLD_BRIGHT;
        ctx.fillText('VICTOR!', x + 154, rowY);
      } else {
        ctx.fillStyle = '#a0a0a0';
        ctx.fillText(`Lap ${chariot.lap + 1}/7`, x + 154, rowY);
      }
    });
  }

  renderTelemetryGauges(ctx, x, y, player, narrow) {
    if (!player) return;

    const boxW = narrow ? 220 : 260;
    const boxH = 68;

    ctx.fillStyle = 'rgba(18, 15, 12, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(x, y, boxW, boxH);

    // Speedometer
    ctx.fillStyle = COLOR_GOLD;
    ctx.font = `bold ${narrow ? 9 : 10}px Cinzel, serif`;
    ctx.fillText('CURSUS (SPEED)', x + 10, y + 15);

    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.speedometerVal.toFixed(1)}`, x + 10, y + 33);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('STADIA / H', x + 50, y + 33);

    // Speedometer Bar
    const speedRatio = clamp(this.speedometerVal / 50.0, 0, 1);
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 10, y + 42, 80, 6);
    ctx.fillStyle = COLOR_GOLD_BRIGHT;
    ctx.fillRect(x + 10, y + 42, 80 * speedRatio, 6);

    // Centrifugal Lateral G-Force Gauge
    ctx.fillStyle = COLOR_GOLD;
    ctx.font = `bold ${narrow ? 9 : 10}px Cinzel, serif`;
    ctx.fillText('CENTRIFUGA (G)', x + (narrow ? 105 : 120), y + 15);

    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = player.isDrifting ? '#ff4757' : '#ffffff';
    ctx.fillText(`${this.lateralGVal.toFixed(2)} G`, x + (narrow ? 105 : 120), y + 33);

    // Lateral G Bar with Drift Warning Threshold
    const gRatio = clamp(this.lateralGVal / 1.8, 0, 1);
    ctx.fillStyle = '#333';
    ctx.fillRect(x + (narrow ? 105 : 120), y + 42, narrow ? 70 : 85, 6);
    ctx.fillStyle = player.isDrifting ? '#ff4757' : '#2ed573';
    ctx.fillRect(x + (narrow ? 105 : 120), y + 42, (narrow ? 70 : 85) * gRatio, 6);

    if (player.isDrifting && !narrow) {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('DRIFT!', x + 212, y + 48);
    }

    // Horse Stamina Bar (top thin strip)
    const stamRatio = clamp(player.stamina / player.maxStamina, 0, 1);
    ctx.fillStyle = '#1e824c';
    ctx.fillRect(x + 10, y + 56, (boxW - 20) * stamRatio, 3.5);
  }

  renderSpinaLapBanner(ctx, cx, y, engine, narrow) {
    const leader = engine.getRaceLeader();
    const currentLap = leader ? Math.min(7, leader.lap + 1) : 1;

    ctx.save();
    ctx.translate(cx, y);

    const bannerW = narrow ? 180 : 240;
    ctx.fillStyle = 'rgba(18, 15, 12, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2, -14, bannerW, 28, 4);
    ctx.fill();

    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(-bannerW / 2, -14, bannerW, 28);

    ctx.fillStyle = COLOR_GOLD_BRIGHT;
    ctx.font = `bold ${narrow ? 10 : 12}px Cinzel, serif`;
    ctx.textAlign = 'center';

    if (leader && leader.lap >= 7) {
      ctx.fillText(`VICTORIA! ${leader.name.toUpperCase()}!`, 0, 4);
    } else {
      ctx.fillText(narrow ? `MISSUS ${currentLap} / VII` : `MISSUS (LAP) ${currentLap} / VII — 7 DELPHINES IN CURSU`, 0, 4);
    }

    ctx.restore();
  }

  renderPositionIndicator(ctx, w, h, engine, narrow) {
    const sorted = [...engine.chariots].sort((a, b) => b.totalDistance - a.totalDistance);
    const pos = sorted.findIndex(c => c.isPlayer) + 1;
    if (pos < 1) return;

    const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
    const x = narrow ? w - 50 : w - 70;
    const y0 = narrow ? 24 : 32;
    const size = narrow ? 28 : 36;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size}px Cinzel, serif`;
    ctx.fillStyle = pos === 1 ? COLOR_GOLD_BRIGHT : pos <= 3 ? '#C0C0C0' : '#8B7355';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${pos}${suffix}`, x, y0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  renderChronicleTicker(ctx, cx, y) {
    if (this.chronicleFeed.length === 0) return;
    const latest = this.chronicleFeed[0];
    const alpha = clamp(latest.time / 1.0, 0, 1);

    ctx.save();
    ctx.translate(cx, y);
    ctx.textAlign = 'center';
    ctx.globalAlpha = alpha;
    ctx.font = 'italic 11px Cinzel, serif';
    ctx.fillStyle = COLOR_GOLD_BRIGHT;
    ctx.fillText(latest.text, 0, 0);
    ctx.restore();
  }
}

// ─── MAIN CHARIOT GRAND PRIX SIMULATION ENGINE ───────────────────────────────

export class ChariotEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    // Simulation Parameters & Sliders
    this.speedMultiplier = 1.2;
    this.driftTraction = 0.78; // Sand grip limit (mu * g)
    this.metaTurnSharpness = 1.0;
    this.aiAggressiveness = 1.0;
    this.spectatorWavesActive = true;
    this.showTelemetry = true;
    this.selectedPlayerFaction = 'prasina'; // Prasina (Greens) by default

    // Subsystems
    this.audio = new ChariotAudio();
    this.track = new CircusTrack();
    this.monuments = new SpinaMonuments();
    this.spectators = new SpectatorSystem(320);
    this.hud = new ChariotHUD();

    // Entity collections
    this.chariots = [];
    this.playerVehicle = null;
    this.dustParticles = [];
    this.splinters = [];
    this.skidMarks = [];
    this.petals = [];

    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };

    // Initialize simulation
    this.resize(this.width, this.height, 1);
    this.initChariots();
    this.setupUI();
    attachTouchBridge(this, canvas);

    this.addChronicle('🏁 The Mappa is dropped! The quadrigae thunder from the carceres!');
  }

  addChronicle(msg) {
    if (this.hud) {
      this.hud.addChronicle(msg);
    }
  }

  getRaceLeader() {
    if (this.chariots.length === 0) return null;
    return [...this.chariots].sort((a, b) => b.totalDistance - a.totalDistance)[0];
  }

  initChariots() {
    this.chariots = [];
    const laneOffsets = [0.18, 0.42, 0.65, 0.85];

    FACTION_SPECS.forEach((spec, idx) => {
      const isPlayer = spec.id === this.selectedPlayerFaction;
      const chariot = new ChariotVehicle(spec, isPlayer, laneOffsets[idx]);
      // Space initial positions along western start lane
      chariot.s = (this.track.cretaS - 0.04) + idx * 0.008;
      chariot.lap = 0;
      chariot.speed = 175.0 + Math.random() * 20;

      this.chariots.push(chariot);
      if (isPlayer) this.playerVehicle = chariot;
    });

    // Assign AI drafting partners
    this.chariots.forEach((c, idx) => {
      if (!c.isPlayer) {
        c.draftingTarget = this.chariots[(idx + 1) % this.chariots.length];
      }
    });
  }

  onChariotLap(chariot) {
    const leader = this.getRaceLeader();
    if (leader === chariot) {
      this.monuments.onLapComplete(chariot.lap);
      this.audio.playDolphinClank();

      if (chariot.lap === 7) {
        this.audio.playFanfare();
        this.addChronicle(`🏆 VICTORIA! ${chariot.name} WINS THE CIRCUS MAXIMUS GRAND PRIX!`);

        // Shower victory petals from cavea
        for (let i = 0; i < 40; i++) {
          this.petals.push(new LaurelPetal(chariot.x + (Math.random() - 0.5) * 60, chariot.y - 30));
        }
      } else {
        this.addChronicle(`🔔 Bronze dolphin tilts! ${chariot.name} leads Lap ${chariot.lap + 1}/7`);
      }
    }
  }

  setupUI() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    this.controlsContainer.innerHTML = '';

    // Faction Selector Dropdown
    const fGroup = document.createElement('div');
    fGroup.className = 'control-group';
    const fLabel = document.createElement('label');
    fLabel.textContent = 'Player Faction (Currus)';
    const fSelect = document.createElement('select');
    fSelect.id = 'chariot-faction-select';
    fSelect.style.width = '100%';
    fSelect.style.background = '#221e1a';
    fSelect.style.color = '#ffd700';
    fSelect.style.border = '1px solid #8c6239';
    fSelect.style.padding = '4px';

    FACTION_SPECS.forEach(spec => {
      const opt = document.createElement('option');
      opt.value = spec.id;
      opt.textContent = `${spec.name} — ${spec.tactics}`;
      if (spec.id === this.selectedPlayerFaction) opt.selected = true;
      fSelect.appendChild(opt);
    });

    const spectOpt = document.createElement('option');
    spectOpt.value = 'spectator';
    spectOpt.textContent = 'Spectator Mode (All AI 4-Way Grand Prix)';
    fSelect.appendChild(spectOpt);

    fSelect.addEventListener('change', (e) => {
      this.selectedPlayerFaction = e.target.value;
      this.chariots.forEach(c => {
        c.isPlayer = c.spec.id === this.selectedPlayerFaction;
      });
      this.playerVehicle = this.chariots.find(c => c.isPlayer) || null;
    });

    fGroup.appendChild(fLabel);
    fGroup.appendChild(fSelect);
    this.controlsContainer.appendChild(fGroup);

    // Speed Multiplier Slider
    const spdGroup = document.createElement('div');
    spdGroup.className = 'control-group';
    const spdLabel = document.createElement('label');
    spdLabel.textContent = `Horse Gallop Speed: ${this.speedMultiplier.toFixed(1)}x`;
    const spdSlider = document.createElement('input');
    spdSlider.type = 'range';
    spdSlider.min = '0.5';
    spdSlider.max = '2.5';
    spdSlider.step = '0.1';
    spdSlider.value = this.speedMultiplier;
    spdSlider.addEventListener('input', (e) => {
      this.speedMultiplier = parseFloat(e.target.value);
      spdLabel.textContent = `Horse Gallop Speed: ${this.speedMultiplier.toFixed(1)}x`;
    });
    spdGroup.appendChild(spdLabel);
    spdGroup.appendChild(spdSlider);
    this.controlsContainer.appendChild(spdGroup);

    // Sand Grip / Drift Traction Slider
    const gripGroup = document.createElement('div');
    gripGroup.className = 'control-group';
    const gripLabel = document.createElement('label');
    gripLabel.textContent = `Sand Traction / Drift Grip: ${this.driftTraction.toFixed(2)}`;
    const gripSlider = document.createElement('input');
    gripSlider.type = 'range';
    gripSlider.min = '0.35';
    gripSlider.max = '0.98';
    gripSlider.step = '0.02';
    gripSlider.value = this.driftTraction;
    gripSlider.addEventListener('input', (e) => {
      this.driftTraction = parseFloat(e.target.value);
      gripLabel.textContent = `Sand Traction / Drift Grip: ${this.driftTraction.toFixed(2)}`;
    });
    gripGroup.appendChild(gripLabel);
    gripGroup.appendChild(gripSlider);
    this.controlsContainer.appendChild(gripGroup);

    // Meta Turn Sharpness Slider
    const metaGroup = document.createElement('div');
    metaGroup.className = 'control-group';
    const metaLabel = document.createElement('label');
    metaLabel.textContent = `Meta Turn Sharpness: ${this.metaTurnSharpness.toFixed(1)}x`;
    const metaSlider = document.createElement('input');
    metaSlider.type = 'range';
    metaSlider.min = '0.5';
    metaSlider.max = '1.8';
    metaSlider.step = '0.1';
    metaSlider.value = this.metaTurnSharpness;
    metaSlider.addEventListener('input', (e) => {
      this.metaTurnSharpness = parseFloat(e.target.value);
      metaLabel.textContent = `Meta Turn Sharpness: ${this.metaTurnSharpness.toFixed(1)}x`;
    });
    metaGroup.appendChild(metaLabel);
    metaGroup.appendChild(metaSlider);
    this.controlsContainer.appendChild(metaGroup);

    // AI Aggressiveness Slider
    const aggrGroup = document.createElement('div');
    aggrGroup.className = 'control-group';
    const aggrLabel = document.createElement('label');
    aggrLabel.textContent = `AI Aggressiveness: ${this.aiAggressiveness.toFixed(1)}x`;
    const aggrSlider = document.createElement('input');
    aggrSlider.type = 'range';
    aggrSlider.min = '0.2';
    aggrSlider.max = '2.2';
    aggrSlider.step = '0.1';
    aggrSlider.value = this.aiAggressiveness;
    aggrSlider.addEventListener('input', (e) => {
      this.aiAggressiveness = parseFloat(e.target.value);
      aggrLabel.textContent = `AI Aggressiveness: ${this.aiAggressiveness.toFixed(1)}x`;
    });
    aggrGroup.appendChild(aggrLabel);
    aggrGroup.appendChild(aggrSlider);
    this.controlsContainer.appendChild(aggrGroup);

    // Action Buttons Grid
    const btnGrid = document.createElement('div');
    btnGrid.style.display = 'grid';
    btnGrid.style.gridTemplateColumns = '1fr 1fr';
    btnGrid.style.gap = '6px';
    btnGrid.style.marginTop = '6px';

    // Whip Button
    const whipBtn = document.createElement('button');
    whipBtn.className = 'action-btn';
    whipBtn.textContent = '🏇 Whip Horses!';
    whipBtn.addEventListener('click', () => {
      if (this.playerVehicle) {
        if (this.playerVehicle.whip()) {
          this.audio.playWhip();
        }
      }
    });

    // Reset Race Button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'action-btn';
    resetBtn.textContent = '🏁 Reset Race';
    resetBtn.addEventListener('click', () => this.reset());

    // Trigger Naufragium Button
    const crashBtn = document.createElement('button');
    crashBtn.className = 'action-btn';
    crashBtn.textContent = '💥 Naufragium!';
    crashBtn.style.borderColor = '#c0392b';
    crashBtn.addEventListener('click', () => {
      const nonPlayerOrFirst = this.chariots.find(c => !c.isPlayer && !c.isCrashed) || this.chariots[0];
      if (nonPlayerOrFirst) {
        nonPlayerOrFirst.triggerNaufragium(this);
      }
    });

    // Toggle Spectator Waves Button
    const waveBtn = document.createElement('button');
    waveBtn.className = 'action-btn';
    waveBtn.textContent = '🌊 Spectator Wave';
    waveBtn.addEventListener('click', () => {
      this.spectatorWavesActive = !this.spectatorWavesActive;
      this.addChronicle(this.spectatorWavesActive ? '🏛️ Undulatio cheering waves sweep the cavea!' : '🏛️ Spectators settle in the cavea.');
    });

    btnGrid.appendChild(whipBtn);
    btnGrid.appendChild(resetBtn);
    btnGrid.appendChild(crashBtn);
    btnGrid.appendChild(waveBtn);
    this.controlsContainer.appendChild(btnGrid);
  }

  resize(w, h, dpr = 1) {
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.track.resize(w, h);
    this.spectators.init(this.track);
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  update(dt) {
    const clampedDt = Math.min(0.05, dt);

    // Update Player Input Controls
    if (this.playerVehicle && !this.playerVehicle.isCrashed) {
      if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
        this.playerVehicle.whip();
      }
      if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
        this.playerVehicle.speed = Math.max(90, this.playerVehicle.speed - 120 * clampedDt);
      }
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
        // Steer towards inside spina rail
        this.playerVehicle.laneOffset = clamp(this.playerVehicle.laneOffset - 0.45 * clampedDt, 0.08, 0.92);
      }
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
        // Steer towards outside cavea wall
        this.playerVehicle.laneOffset = clamp(this.playerVehicle.laneOffset + 0.45 * clampedDt, 0.08, 0.92);
      }
      this.playerVehicle.handbrake = Boolean(this.keys['Shift']);
    }

    // AI Decision Logic for Autonomous Chariots
    this.chariots.forEach(chariot => {
      if (!chariot.isPlayer && !chariot.isCrashed) {
        this.updateAIChariot(chariot, clampedDt);
      }
      chariot.update(clampedDt, this.track, this);
    });

    // Inter-Chariot Collisions & Jostling
    this.checkVehicleCollisions();

    // Update Particles & Debris
    this.updateParticles(clampedDt);

    // Update Subsystems
    this.spectators.update(clampedDt, this.spectatorWavesActive);
    this.monuments.update(clampedDt);
    this.hud.update(clampedDt, this.playerVehicle);
  }

  updateAIChariot(chariot, dt) {
    chariot.aiSteerTimer -= dt;
    chariot.aiWhipTimer -= dt;

    // Tactical Lane Selection
    if (chariot.aiSteerTimer <= 0) {
      chariot.aiSteerTimer = 1.0 + Math.random() * 2.0;

      // Faction personality bias
      let targetLane = chariot.spec.lanePreference;
      // In turns (seg 1 and 3), Greens dive for the apex
      const trackPt = this.track.eval(chariot.s, chariot.d);
      if (trackPt.seg === 1 || trackPt.seg === 3) {
        if (chariot.spec.id === 'prasina') {
          targetLane = 0.12; // Hug inside rail!
        } else if (chariot.spec.id === 'albata') {
          targetLane = 0.40; // Clean geometric apex
        }
      }

      // Avoid wreckage ahead
      this.chariots.forEach(other => {
        if (other !== chariot && other.isCrashed) {
          const dist = this.track.getLapDistance(chariot.s, other.s);
          if (dist > 0 && dist < 0.03 && Math.abs(chariot.d - other.d) < 0.25) {
            // Wreck ahead! Steer away
            targetLane = other.d > 0.5 ? 0.2 : 0.8;
          }
        }
      });

      chariot.laneOffset = clamp(targetLane + (Math.random() - 0.5) * 0.1, 0.1, 0.9);
    }

    // AI Whip Surge
    if (chariot.aiWhipTimer <= 0) {
      chariot.aiWhipTimer = (2.0 + Math.random() * 3.5) / Math.max(0.4, this.aiAggressiveness);
      if (chariot.stamina > 30) {
        chariot.whip();
      }
    }
  }

  checkVehicleCollisions() {
    for (let i = 0; i < this.chariots.length; i++) {
      for (let j = i + 1; j < this.chariots.length; j++) {
        const c1 = this.chariots[i];
        const c2 = this.chariots[j];
        if (c1.isCrashed || c2.isCrashed) continue;

        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 26) {
          // Wheel hub / axle collision!
          const nx = dist > 0.001 ? dx / dist : 1;
          const ny = dist > 0.001 ? dy / dist : 0;

          // Push apart laterally
          const pushForce = (26 - dist) * 0.5;
          c1.d = clamp(c1.d + (ny > 0 ? 0.05 : -0.05), 0.08, 0.92);
          c2.d = clamp(c2.d - (ny > 0 ? 0.05 : -0.05), 0.08, 0.92);

          // Wood sparks & dust
          this.audio.playCrash();
          for (let k = 0; k < 4; k++) {
            this.dustParticles.push(
              new DustParticle(
                (c1.x + c2.x) / 2,
                (c1.y + c2.y) / 2,
                nx * 40 + (Math.random() - 0.5) * 20,
                ny * 40 + (Math.random() - 0.5) * 20,
                2.5,
                0.6,
                0.5,
                COLOR_GOLD_BRIGHT
              )
            );
          }

          // Damage durability if aggressive collision
          const relativeSpeed = Math.abs(c1.speed - c2.speed);
          if (relativeSpeed > 60 * this.aiAggressiveness) {
            c1.durability -= 20;
            c2.durability -= 20;
            if (c1.durability <= 0) c1.triggerNaufragium(this);
            if (c2.durability <= 0) c2.triggerNaufragium(this);
          }
        }
      }
    }
  }

  updateParticles(dt) {
    // Dust Particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.update(dt);
      if (p.life <= 0) this.dustParticles.splice(i, 1);
    }

    // Splinters
    for (let i = this.splinters.length - 1; i >= 0; i--) {
      const sp = this.splinters[i];
      sp.update(dt);
      if (sp.life <= 0) this.splinters.splice(i, 1);
    }

    // Skid Marks
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const sk = this.skidMarks[i];
      sk.update(dt);
      if (sk.life <= 0) this.skidMarks.splice(i, 1);
    }

    // Petals
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const pt = this.petals[i];
      pt.update(dt);
      if (pt.life <= 0) this.petals.splice(i, 1);
    }
  }

  render(ctx) {
    const cx = this.track.cx;
    const cy = this.track.cy;

    // ── 1. Background (Surrounding Roman Earth & Palatine / Aventine backdrop) ──
    ctx.fillStyle = COLOR_CHARCOAL;
    ctx.fillRect(0, 0, this.width, this.height);

    // ── 2. Stadium Cavea Tiers & Outer Boundary ──
    this.renderCaveaArchitecture(ctx);

    // ── 3. Sandy Track Surface (Pulvis) ──
    this.renderTrackSand(ctx);

    // ── 4. Carceres (Western 12 Stalls) & Creta (Chalk Finish Line) ──
    this.renderTrackMarkings(ctx);

    // ── 5. Persistent Skid Marks ──
    this.skidMarks.forEach(sk => sk.render(ctx));

    // ── 6. Central Spina & Monuments ──
    this.monuments.render(ctx, this.track);

    // ── 7. Splinter Debris ──
    this.splinters.forEach(sp => sp.render(ctx));

    // ── 8. Chariots (Sorted by Y for correct orthographic depth) ──
    const sortedChariots = [...this.chariots].sort((a, b) => a.y - b.y);
    sortedChariots.forEach(c => c.render(ctx));

    // ── 9. Dust Particles & Vortices ──
    this.dustParticles.forEach(p => p.render(ctx));

    // ── 10. Victory Laurel Petals ──
    this.petals.forEach(pt => pt.render(ctx));

    // ── 11. Spectators in Tiers ──
    this.spectators.render(ctx);

    // ── 12. Canvas HUD & Gauges ──
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    this.hud.render(ctx, this.width / ui, this.height / ui, this);
    ctx.restore();
  }

  renderCaveaArchitecture(ctx) {
    const cx = this.track.cx;
    const cy = this.track.cy;
    const halfLen = this.track.spinaHalf;
    const rOut = this.track.rOuter;

    // Tiered stone seating stadium oval
    ctx.fillStyle = '#2b2621';
    ctx.beginPath();
    ctx.ellipse(cx - halfLen, cy, Math.max(0.1, rOut + 52), Math.max(0.1, rOut + 52), 0, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(cx + halfLen, cy - (rOut + 52));
    ctx.ellipse(cx + halfLen, cy, Math.max(0.1, rOut + 52), Math.max(0.1, rOut + 52), 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - halfLen, cy + rOut + 52);
    ctx.closePath();
    ctx.fill();

    // Tier line grooves
    ctx.strokeStyle = '#3d342c';
    ctx.lineWidth = 1.0;
    for (let r = 12; r <= 48; r += 12) {
      ctx.beginPath();
      ctx.ellipse(cx - halfLen, cy, Math.max(0.1, rOut + r), Math.max(0.1, rOut + r), 0, Math.PI / 2, Math.PI * 1.5);
      ctx.lineTo(cx + halfLen, cy - (rOut + r));
      ctx.ellipse(cx + halfLen, cy, Math.max(0.1, rOut + r), Math.max(0.1, rOut + r), 0, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx - halfLen, cy + rOut + r);
      ctx.stroke();
    }

    // Outer Podium Barrier Wall
    ctx.strokeStyle = COLOR_MARBLE_SHADOW;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cx - halfLen, cy, Math.max(0.1, rOut + 2), Math.max(0.1, rOut + 2), 0, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(cx + halfLen, cy - (rOut + 2));
    ctx.ellipse(cx + halfLen, cy, Math.max(0.1, rOut + 2), Math.max(0.1, rOut + 2), 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - halfLen, cy + rOut + 2);
    ctx.stroke();
  }

  renderTrackSand(ctx) {
    const cx = this.track.cx;
    const cy = this.track.cy;
    const halfLen = this.track.spinaHalf;
    const rOut = this.track.rOuter;

    // Sand Bed (Pulvis)
    ctx.fillStyle = COLOR_SAND_BASE;
    ctx.beginPath();
    ctx.ellipse(cx - halfLen, cy, Math.max(0.1, rOut), Math.max(0.1, rOut), 0, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(cx + halfLen, cy - rOut);
    ctx.ellipse(cx + halfLen, cy, Math.max(0.1, rOut), Math.max(0.1, rOut), 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - halfLen, cy + rOut);
    ctx.closePath();
    ctx.fill();

    // Subtle Sand Track Grooves / Grain
    ctx.strokeStyle = COLOR_SAND_DEEP;
    ctx.lineWidth = 0.8;
    for (let g = 0.25; g <= 0.75; g += 0.25) {
      const rLane = this.track.rInner + g * this.track.trackWidth;
      ctx.beginPath();
      ctx.ellipse(cx - halfLen, cy, Math.max(0.1, rLane), Math.max(0.1, rLane), 0, Math.PI / 2, Math.PI * 1.5);
      ctx.lineTo(cx + halfLen, cy - rLane);
      ctx.ellipse(cx + halfLen, cy, Math.max(0.1, rLane), Math.max(0.1, rLane), 0, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx - halfLen, cy + rLane);
      ctx.stroke();
    }
  }

  renderTrackMarkings(ctx) {
    const cx = this.track.cx;
    const cy = this.track.cy;
    const halfLen = this.track.spinaHalf;

    // Alba Linea / Creta (Chalk Finish Line on South straight)
    const cretaX = (cx - halfLen) + this.track.cretaS * (halfLen * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cretaX, cy + this.track.rInner);
    ctx.lineTo(cretaX, cy + this.track.rOuter);
    ctx.stroke();

    // Starting Stalls (Carceres) at Western end
    const arcX = cx - halfLen - this.track.rOuter * 0.35;
    ctx.fillStyle = COLOR_MARBLE_SHADOW;
    ctx.fillRect(arcX - 16, cy - this.track.rOuter * 0.9, 14, this.track.trackWidth * 1.8);

    // 12 Stall Doors
    ctx.strokeStyle = COLOR_BRONZE;
    ctx.lineWidth = 1.0;
    const stallHeight = (this.track.trackWidth * 1.8) / 12;
    for (let s = 0; s < 12; s++) {
      const sy = (cy - this.track.rOuter * 0.9) + s * stallHeight;
      ctx.strokeRect(arcX - 15, sy, 12, stallHeight - 1);
    }
  }

  getEntityCount() {
    // Exact count of active simulated physical & visual entities
    let count = this.chariots.length * 6; // Chariot currus + 4 horses + auriga
    count += this.dustParticles.length;
    count += this.splinters.length;
    count += this.skidMarks.length;
    count += this.petals.length;
    count += this.spectators.spectators.length;
    count += 14; // 7 Delphines + 7 Ova
    count += 6; // 3 Cones Meta Prima + 3 Cones Meta Secunda
    count += 1; // Obelisk
    return count;
  }

  onMouseDown(pos) {
    this.mouse.down = true;
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    if (this.playerVehicle) {
      if (this.playerVehicle.whip()) {
        this.audio.playWhip();
      }
    }
  }

  onMouseMove(pos) {
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }

  onMouseUp(pos) {
    this.mouse.down = false;
  }

  onKeyDown(key, e) {
    this.keys[key] = true;
    if (key === ' ' || key === 'Space') {
      if (this.playerVehicle) {
        if (this.playerVehicle.whip()) {
          this.audio.playWhip();
        }
      }
    } else if (key === 'r' || key === 'R') {
      this.reset();
    }
  }

  onKeyUp(key, e) {
    this.keys[key] = false;
  }

  reset() {
    this.dustParticles = [];
    this.splinters = [];
    this.skidMarks = [];
    this.petals = [];
    this.monuments.reset();
    this.initChariots();
    this.addChronicle('🏁 The Missus is restarted at the Carceres!');
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.dustParticles = [];
    this.splinters = [];
    this.skidMarks = [];
    this.petals = [];
    this.audio.destroy();
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }
}
