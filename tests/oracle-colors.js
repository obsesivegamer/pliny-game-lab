import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COLORS, LETTER } from '../src/demos/oracle_words/oracle_words.js';

// Machado, Oliveira & Fernandes (2009) full-severity simulation, applied in linear RGB.
const SIMULATIONS = {
  normal: null,
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]
};
const channels = hex => {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map(c => c + c).join('')}` : hex;
  return [1, 3, 5].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
};
const linear = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const luminance = hex => { const [r, g, b] = channels(hex).map(linear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function lab(hex, simulation) {
  let rgb = channels(hex).map(linear);
  if (simulation) rgb = simulation.map(row => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])));
  const [r, g, b] = rgb;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}

// CIEDE2000 colour difference.
function deltaE([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const Cbar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const [ap1, ap2] = [(1 + G) * a1, (1 + G) * a2];
  const [C1, C2] = [Math.hypot(ap1, b1), Math.hypot(ap2, b2)];
  const hue = (a, b) => (Math.atan2(b, a) / rad + 360) % 360;
  const [h1, h2] = [hue(ap1, b1), hue(ap2, b2)];
  let dh = C1 * C2 === 0 ? 0 : h2 - h1;
  if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh / 2 * rad);
  const Lbar = (L1 + L2) / 2, Cp = (C1 + C2) / 2;
  let hbar = h1 + h2;
  if (C1 * C2 !== 0) { if (Math.abs(h1 - h2) > 180) hbar += hbar < 360 ? 360 : -360; hbar /= 2; }
  const T = 1 - 0.17 * Math.cos((hbar - 30) * rad) + 0.24 * Math.cos(2 * hbar * rad) +
    0.32 * Math.cos((3 * hbar + 6) * rad) - 0.2 * Math.cos((4 * hbar - 63) * rad);
  const SL = 1 + 0.015 * (Lbar - 50) ** 2 / Math.sqrt(20 + (Lbar - 50) ** 2);
  const SC = 1 + 0.045 * Cp, SH = 1 + 0.015 * Cp * T;
  const RT = -2 * Math.sqrt(Cp ** 7 / (Cp ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hbar - 275) / 25) ** 2)) * rad);
  const [dL, dC] = [(L2 - L1) / SL, (C2 - C1) / SC];
  return Math.sqrt(dL ** 2 + dC ** 2 + (dH / SH) ** 2 + RT * dC * (dH / SH));
}

const marks = ['correct', 'present', 'absent'];
const pairs = [['correct', 'present'], ['correct', 'absent'], ['present', 'absent']];
function checkPalette(where, fill, letter) {
  for (const [name, simulation] of Object.entries(SIMULATIONS)) {
    for (const [a, b] of pairs) {
      const difference = deltaE(lab(fill[a], simulation), lab(fill[b], simulation));
      assert.ok(difference >= 20, `${where}: ${a} and ${b} look alike with ${name} (ΔE ${difference.toFixed(1)})`);
    }
  }
  for (const [a, b] of pairs) {
    assert.ok(contrast(fill[a], fill[b]) >= 1.8, `${where}: ${a} and ${b} need different lightness, not just hue`);
  }
  for (const mark of marks) {
    assert.ok(contrast(fill[mark], letter[mark]) >= 4.5, `${where}: the ${mark} letter is hard to read`);
  }
}

checkPalette('Oracle Words tiles', COLORS, LETTER);

const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const key = {}, keyLetter = {};
for (const [, mark, background, color] of css.matchAll(
  /\.puzzle-key\[data-mark="(\w+)"\]\s*\{\s*background:\s*(#[0-9a-f]{3,6});\s*color:\s*(#[0-9a-f]{3,6});/gi)) {
  key[mark] = background;
  keyLetter[mark] = color;
}
assert.deepEqual(Object.keys(key).sort(), [...marks].sort(), 'every keyboard mark sets its own colours');
// A dimmed "absent" letter only needs to stay legible, not full body-text contrast.
checkPalette('Oracle Words keys', key, { ...keyLetter, absent: '#ffffff' });
assert.ok(contrast(key.absent, keyLetter.absent) >= 4, 'the dimmed absent key letter stays legible');
// An unmarked key is the panel's translucent button over the navy panel, about #33456C.
for (const mark of marks) {
  for (const [name, simulation] of Object.entries(SIMULATIONS)) {
    const difference = deltaE(lab(key[mark], simulation), lab('#33456c', simulation));
    assert.ok(difference >= 15, `a ${mark} key looks like an unused key with ${name} (ΔE ${difference.toFixed(1)})`);
  }
}

console.log('Oracle Words colours: tiles and keys stay distinct with protanopia and deuteranopia, in greyscale, and readable');
