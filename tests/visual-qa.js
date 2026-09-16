// Pliny Game Lab — Deep Visual QA Test Suite
// Extends verify-engines.js with rendering quality and robustness checks
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Instrumented Mocks ─────────────────────────────────────────────
// Track all render calls to detect rendering issues

class RenderTracker {
  constructor() {
    this.fillRectCalls = 0;
    this.arcCalls = 0;
    this.lineToCount = 0;
    this.fillTextCalls = 0;
    this.strokeCalls = 0;
    this.fillCalls = 0;
    this.drawImageCalls = 0;
    this.putImageDataCalls = 0;
    this.saveCalls = 0;
    this.restoreCalls = 0;
    this.gradientCalls = 0;
    this.clipCalls = 0;
    this.invalidColors = [];
    this.nanCoords = [];
    this.infiniteCoords = [];
    this.totalCalls = 0;
  }

  checkNum(label, ...vals) {
    for (const v of vals) {
      if (typeof v === 'number') {
        if (isNaN(v)) this.nanCoords.push(label);
        if (!isFinite(v)) this.infiniteCoords.push(label);
      }
    }
  }

  checkColor(val) {
    if (typeof val === 'string' && val.includes('NaN')) {
      this.invalidColors.push(val);
    }
  }

  get issues() {
    const problems = [];
    if (this.nanCoords.length > 0) problems.push(`${this.nanCoords.length} NaN coordinates detected in: ${[...new Set(this.nanCoords)].slice(0, 5).join(', ')}`);
    if (this.infiniteCoords.length > 0) problems.push(`${this.infiniteCoords.length} Infinite coordinates in: ${[...new Set(this.infiniteCoords)].slice(0, 5).join(', ')}`);
    if (this.invalidColors.length > 0) problems.push(`${this.invalidColors.length} invalid colors containing NaN: ${this.invalidColors.slice(0, 3).join(', ')}`);
    if (this.totalCalls === 0) problems.push('ZERO render calls — engine renders nothing');
    if (this.saveCalls !== this.restoreCalls) problems.push(`save/restore mismatch: ${this.saveCalls} saves vs ${this.restoreCalls} restores (context leak)`);
    return problems;
  }
}

class MockCanvas {
  constructor(w = 800, h = 600) {
    this.width = w;
    this.height = h;
    this.style = {};
  }
  getContext() { return new InstrumentedContext(this); }
  addEventListener() {}
  removeEventListener() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }
  toDataURL() { return 'data:image/png;base64,'; }
  toBlob(cb) { cb(new Uint8Array(0)); }
}

class InstrumentedContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 1;
    this.font = '12px sans-serif';
    this.textAlign = 'left';
    this.textBaseline = 'top';
    this.imageSmoothingEnabled = true;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 10;
    this.shadowBlur = 0;
    this.shadowColor = 'rgba(0,0,0,0)';
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.tracker = new RenderTracker();
    this._transformStack = [];
  }

  // Tracked rendering calls
  fillRect(x, y, w, h) {
    this.tracker.fillRectCalls++;
    this.tracker.totalCalls++;
    this.tracker.checkNum('fillRect', x, y, w, h);
    this.tracker.checkColor(this.fillStyle);
  }
  strokeRect(x, y, w, h) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('strokeRect', x, y, w, h);
  }
  clearRect(x, y, w, h) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('clearRect', x, y, w, h);
  }
  arc(x, y, r, s, e) {
    this.tracker.arcCalls++;
    this.tracker.totalCalls++;
    this.tracker.checkNum('arc', x, y, r, s, e);
  }
  lineTo(x, y) {
    this.tracker.lineToCount++;
    this.tracker.totalCalls++;
    this.tracker.checkNum('lineTo', x, y);
  }
  moveTo(x, y) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('moveTo', x, y);
  }
  fillText(text, x, y) {
    this.tracker.fillTextCalls++;
    this.tracker.totalCalls++;
    this.tracker.checkNum('fillText', x, y);
  }
  strokeText(text, x, y) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('strokeText', x, y);
  }
  stroke() { this.tracker.strokeCalls++; this.tracker.totalCalls++; }
  fill(ruleOrPath) { this.tracker.fillCalls++; this.tracker.totalCalls++; }
  drawImage() { this.tracker.drawImageCalls++; this.tracker.totalCalls++; }
  putImageData() { this.tracker.putImageDataCalls++; this.tracker.totalCalls++; }

  save() { this.tracker.saveCalls++; this.tracker.totalCalls++; }
  restore() { this.tracker.restoreCalls++; this.tracker.totalCalls++; }

  beginPath() { this.tracker.totalCalls++; }
  closePath() { this.tracker.totalCalls++; }
  clip() { this.tracker.clipCalls++; this.tracker.totalCalls++; }
  translate(x, y) { this.tracker.checkNum('translate', x, y); }
  rotate(a) { this.tracker.checkNum('rotate', a); }
  scale(x, y) { this.tracker.checkNum('scale', x, y); }
  setTransform(a, b, c, d, e, f) { this.tracker.checkNum('setTransform', a, b, c, d, e, f); }
  resetTransform() {}
  transform(a, b, c, d, e, f) { this.tracker.checkNum('transform', a, b, c, d, e, f); }

  createImageData(w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  getImageData(x, y, w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  createLinearGradient() {
    this.tracker.gradientCalls++;
    return { addColorStop() {} };
  }
  createRadialGradient() {
    this.tracker.gradientCalls++;
    return { addColorStop() {} };
  }
  createPattern() { return {}; }
  quadraticCurveTo(cpx, cpy, x, y) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('quadraticCurveTo', cpx, cpy, x, y);
  }
  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y);
  }
  ellipse(x, y, rx, ry, rot, sa, ea) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('ellipse', x, y, rx, ry, rot, sa, ea);
  }
  roundRect(x, y, w, h, r) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('roundRect', x, y, w, h);
  }
  rect(x, y, w, h) {
    this.tracker.totalCalls++;
    this.tracker.checkNum('rect', x, y, w, h);
  }
  setLineDash() {}
  getLineDash() { return []; }
  measureText(text) { return { width: (text || '').length * 8, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }; }
  isPointInPath() { return false; }
  isPointInStroke() { return false; }
  createConicGradient() { return { addColorStop() {} }; }
}

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.type = '';
    this.min = '';
    this.max = '';
    this.step = '';
    this.checked = false;
    this.selected = false;
    this.disabled = false;
    this.id = '';
    this.className = '';
    this.title = '';
    this.placeholder = '';
    this.dataset = {};
    this.classList = {
      add() {}, remove() {}, toggle() {}, contains() { return false; }
    };
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.parentElement = null;
    this.nextSibling = null;
    this.previousSibling = null;
  }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(c => c !== child); return child; }
  insertBefore(newChild, refChild) { this.children.push(newChild); return newChild; }
  replaceChild(newChild, oldChild) { this.children.push(newChild); return oldChild; }
  querySelector() { return new MockElement(); }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k] || null; }
  removeAttribute() {}
  hasAttribute() { return false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 30 }; }
  focus() {}
  blur() {}
  click() {}
  cloneNode() { return new MockElement(this.tagName.toLowerCase()); }
  contains() { return false; }
  remove() {}
  closest() { return null; }
  matches() { return false; }
  dispatchEvent() { return true; }
  get offsetWidth() { return 100; }
  get offsetHeight() { return 30; }
  get clientWidth() { return 100; }
  get clientHeight() { return 30; }
  get scrollWidth() { return 100; }
  get scrollHeight() { return 30; }
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
}

// ─── Audio Mocks ────────────────────────────────────────────────────

class MockAudioParam {
  constructor() { this.value = 0; this.defaultValue = 0; this.minValue = -3.4028235e38; this.maxValue = 3.4028235e38; }
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
  cancelScheduledValues() { return this; }
  cancelAndHoldAtTime() { return this; }
}

class MockAudioNode {
  connect() { return this; }
  disconnect() {}
  start() {}
  stop() {}
}

// ─── Globals Setup ──────────────────────────────────────────────────

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return new MockCanvas();
    return new MockElement(tag);
  },
  getElementById: () => new MockElement('div'),
  querySelector: () => new MockElement('div'),
  querySelectorAll: () => [],
  createElementNS: (ns, tag) => new MockElement(tag),
  createTextNode: (text) => ({ textContent: text }),
  createDocumentFragment: () => new MockElement('fragment'),
  documentElement: new MockElement('html'),
  body: new MockElement('body'),
  head: new MockElement('head')
};

global.window = {
  devicePixelRatio: 1,
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: () => {},
  removeEventListener: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  getComputedStyle: () => ({}),
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  AudioContext: class {
    constructor() {
      this.destination = new MockAudioNode();
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.state = 'running';
    }
    createGain() { const n = new MockAudioNode(); n.gain = new MockAudioParam(); n.gain.value = 1; return n; }
    createOscillator() { const n = new MockAudioNode(); n.type = 'sine'; n.frequency = new MockAudioParam(); n.frequency.value = 440; n.detune = new MockAudioParam(); return n; }
    createBiquadFilter() { const n = new MockAudioNode(); n.type = 'lowpass'; n.frequency = new MockAudioParam(); n.Q = new MockAudioParam(); n.gain = new MockAudioParam(); return n; }
    createBufferSource() { const n = new MockAudioNode(); n.buffer = null; n.loop = false; n.playbackRate = new MockAudioParam(); n.playbackRate.value = 1; return n; }
    createBuffer(ch, len, sr) { return { numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: () => new Float32Array(len), duration: len / sr }; }
    createDynamicsCompressor() { const n = new MockAudioNode(); n.threshold = new MockAudioParam(); n.knee = new MockAudioParam(); n.ratio = new MockAudioParam(); n.attack = new MockAudioParam(); n.release = new MockAudioParam(); return n; }
    createConvolver() { const n = new MockAudioNode(); n.buffer = null; return n; }
    createDelay(maxDelay) { const n = new MockAudioNode(); n.delayTime = new MockAudioParam(); return n; }
    createStereoPanner() { const n = new MockAudioNode(); n.pan = new MockAudioParam(); return n; }
    createAnalyser() { const n = new MockAudioNode(); n.fftSize = 2048; n.frequencyBinCount = 1024; n.getByteTimeDomainData = (a) => {}; n.getByteFrequencyData = (a) => {}; n.getFloatFrequencyData = (a) => {}; return n; }
    createWaveShaper() { const n = new MockAudioNode(); n.curve = null; n.oversample = 'none'; return n; }
    createChannelSplitter() { return new MockAudioNode(); }
    createChannelMerger() { return new MockAudioNode(); }
    createPeriodicWave() { return {}; }
    decodeAudioData() { return Promise.resolve(this.createBuffer(1, 44100, 44100)); }
    close() { return Promise.resolve(); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  },
  performance: { now: () => Date.now() }
};

global.AudioContext = global.window.AudioContext;
try { Object.defineProperty(global, 'navigator', { value: { userAgent: 'node-visual-qa' }, writable: true, configurable: true }); } catch(e) {}
global.Image = class { constructor() { this.onload = null; this.src = ''; } };
global.performance = global.window.performance;

// ─── Test Runner ────────────────────────────────────────────────────

const EXTENDED_FRAMES = 300;  // 5 seconds of simulation
const STRESS_FRAMES = 60;

async function runVisualQA() {
  const { DEMOS } = await import('../src/core/hub.js');
  const demoKeys = Object.keys(DEMOS);

  console.log('════════════════════════════════════════════════════════');
  console.log(`PLINY GAME LAB — DEEP VISUAL QA (${demoKeys.length} ENGINES)`);
  console.log('════════════════════════════════════════════════════════\n');

  let passed = 0;
  let warnings = 0;
  let failed = 0;
  const allIssues = [];

  for (let i = 0; i < demoKeys.length; i++) {
    const key = demoKeys[i];
    const demo = DEMOS[key];
    const engineFile = path.resolve(__dirname, '..', 'src', 'demos', key, `${key}.js`);

    if (!fs.existsSync(engineFile)) {
      console.log(`[${i + 1}/${demoKeys.length}] ⏭ ${key} — file missing`);
      continue;
    }

    const issues = [];

    try {
      const mod = await import(`../src/demos/${key}/${key}.js`);
      const EngineClass = mod[demo.exportName];
      if (!EngineClass) throw new Error(`Missing export: ${demo.exportName}`);

      // ── Test 1: Construction & Resize ──
      const canvas = new MockCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      const container = new MockElement();
      const engine = new EngineClass(canvas, ctx, container);

      if (engine.resize) engine.resize(800, 600, 1);

      // ── Test 2: Extended simulation (300 frames = 5 sec) ──
      for (let f = 0; f < EXTENDED_FRAMES; f++) {
        if (engine.update) engine.update(0.016);
      }

      // ── Test 3: Instrumented render pass ──
      const renderCanvas = new MockCanvas(800, 600);
      const renderCtx = renderCanvas.getContext('2d');
      if (engine.render) engine.render(renderCtx);

      const tracker = renderCtx.tracker;
      const renderIssues = tracker.issues;
      if (renderIssues.length > 0) {
        issues.push(...renderIssues.map(i => `[RENDER] ${i}`));
      }

      // Render stats for info
      const stats = {
        totalCalls: tracker.totalCalls,
        fillRect: tracker.fillRectCalls,
        arc: tracker.arcCalls,
        lineTo: tracker.lineToCount,
        text: tracker.fillTextCalls,
        fill: tracker.fillCalls,
        stroke: tracker.strokeCalls,
        drawImage: tracker.drawImageCalls,
        putImageData: tracker.putImageDataCalls,
      };

      // ── Test 4: Entity count sanity ──
      let entityCount = 0;
      if (engine.getEntityCount) {
        entityCount = engine.getEntityCount();
        if (typeof entityCount !== 'number' || isNaN(entityCount)) {
          issues.push(`[ENTITY] getEntityCount returned: ${entityCount}`);
        } else if (entityCount === 0) {
          issues.push(`[ENTITY] Zero entities after ${EXTENDED_FRAMES} frames (simulation may be dead)`);
        }
      }

      // ── Test 5: Interaction flood test ──
      try {
        // Multiple mouse interactions
        for (let j = 0; j < 10; j++) {
          const pos = { x: Math.random() * 800, y: Math.random() * 600, rawX: Math.random() * 800, rawY: Math.random() * 600, button: 0 };
          if (engine.onMouseDown) engine.onMouseDown(pos);
          if (engine.onMouseMove) engine.onMouseMove(pos);
          if (engine.onMouseUp) engine.onMouseUp(pos);
        }
        // Key inputs
        const keys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', '1', '2', '3', '4', '5', 'r', 'Enter', 'Escape'];
        for (const k of keys) {
          if (engine.onKeyDown) engine.onKeyDown(k, { key: k, preventDefault: () => {} });
          if (engine.onKeyUp) engine.onKeyUp(k, { key: k, preventDefault: () => {} });
        }
      } catch (err) {
        issues.push(`[INPUT] Crash during interaction flood: ${err.message}`);
      }

      // ── Test 6: Post-interaction simulation ──
      try {
        for (let f = 0; f < STRESS_FRAMES; f++) {
          if (engine.update) engine.update(0.016);
        }
        // Render again after interactions
        const ctx2 = new MockCanvas(800, 600).getContext('2d');
        if (engine.render) engine.render(ctx2);
        const postIssues = ctx2.tracker.issues;
        if (postIssues.length > 0) {
          issues.push(...postIssues.map(i => `[POST-INTERACT] ${i}`));
        }
      } catch (err) {
        issues.push(`[STABILITY] Crash after interaction flood: ${err.message}`);
      }

      // ── Test 7: Resize handling ──
      try {
        if (engine.resize) {
          engine.resize(1920, 1080, 2);  // HD resize
          if (engine.update) engine.update(0.016);
          const ctx3 = new MockCanvas(1920, 1080).getContext('2d');
          if (engine.render) engine.render(ctx3);

          engine.resize(375, 667, 3);   // Mobile resize
          if (engine.update) engine.update(0.016);
          const ctx4 = new MockCanvas(375, 667).getContext('2d');
          if (engine.render) engine.render(ctx4);
        }
      } catch (err) {
        issues.push(`[RESIZE] Crash on resize: ${err.message}`);
      }

      // ── Test 8: Reset idempotency ──
      try {
        if (engine.reset) {
          engine.reset();
          if (engine.update) engine.update(0.016);
          const ctx5 = new MockCanvas(800, 600).getContext('2d');
          if (engine.render) engine.render(ctx5);

          // Second reset
          engine.reset();
          if (engine.update) engine.update(0.016);
        }
      } catch (err) {
        issues.push(`[RESET] Crash on reset: ${err.message}`);
      }

      // ── Test 9: Destroy & reconstruct ──
      try {
        if (engine.destroy) engine.destroy();
        // Reconstruct
        const engine2 = new EngineClass(canvas, ctx, container);
        if (engine2.resize) engine2.resize(800, 600, 1);
        if (engine2.update) engine2.update(0.016);
        if (engine2.render) engine2.render(ctx);
        if (engine2.destroy) engine2.destroy();
      } catch (err) {
        issues.push(`[LIFECYCLE] Destroy/reconstruct crash: ${err.message}`);
      }

      // ── Report ──
      const severity = issues.filter(i => i.includes('[RENDER]') || i.includes('[STABILITY]') || i.includes('[LIFECYCLE]'));
      const warn = issues.filter(i => !severity.includes(i));

      if (severity.length > 0) {
        console.log(`[${i + 1}/${demoKeys.length}] ✗ ${key} — ${severity.length} ERRORS, ${warn.length} warnings (entities: ${entityCount}, renderCalls: ${stats.totalCalls})`);
        severity.forEach(s => console.log(`    ❌ ${s}`));
        warn.forEach(w => console.log(`    ⚠️  ${w}`));
        failed++;
        allIssues.push({ key, issues, severity: 'ERROR' });
      } else if (warn.length > 0) {
        console.log(`[${i + 1}/${demoKeys.length}] ⚠ ${key} — ${warn.length} warnings (entities: ${entityCount}, renderCalls: ${stats.totalCalls})`);
        warn.forEach(w => console.log(`    ⚠️  ${w}`));
        warnings++;
        allIssues.push({ key, issues, severity: 'WARN' });
      } else {
        console.log(`[${i + 1}/${demoKeys.length}] ✓ ${key} — OK (entities: ${entityCount}, renderCalls: ${stats.totalCalls})`);
        passed++;
      }

    } catch (err) {
      console.log(`[${i + 1}/${demoKeys.length}] ✗ ${key} — FATAL: ${err.message}`);
      failed++;
      allIssues.push({ key, issues: [err.message], severity: 'FATAL' });
    }
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log(`VISUAL QA: ${passed} CLEAN | ${warnings} WARNINGS | ${failed} ERRORS (TOTAL ${demoKeys.length})`);
  console.log('════════════════════════════════════════════════════════');

  if (allIssues.length > 0) {
    console.log('\n── ISSUE SUMMARY ──');
    for (const { key, issues, severity } of allIssues) {
      console.log(`\n${severity === 'FATAL' ? '💀' : severity === 'ERROR' ? '❌' : '⚠️'}  ${key}:`);
      issues.forEach(i => console.log(`  - ${i}`));
    }
  }

  if (failed > 0) process.exit(1);
}

runVisualQA().catch(err => {
  console.error('Fatal QA Error:', err);
  process.exit(1);
});
