// Universal Headless Test & Verification Suite for Pliny Game Lab Engines
import fs from 'fs';
import assert from 'node:assert/strict';

const TOUCH_ENGINES = {
  vesuvius: { mod: 'ELEMENT', paint: 'WATER', cell: (x) => 36 * 280 + x,
    probe: (e) => e.isDrawing },
  geyser: { state: 'mouse', probe: (e, m) => m.isDown },
  caverna: { state: 'isMouseDown', probe: (e, m) => m },
  terrae_motus: { state: 'isDragging', probe: (e, m) => m },
  aurum: { state: 'mouse', probe: (e, m) => m.isDown }
};

function makeTouch(canvas, engine, cfg) {
  const finger = { identifier: 7, clientX: 120, clientY: 90 };
  const second = { identifier: 8, clientX: 320, clientY: 90 };
  const engaged = () => (cfg && cfg.probe ? cfg.probe(engine, engine[cfg.state] ?? engine) : engine.activeTouchId === finger.identifier);
  const touch = (type, changedTouches, touches) => {
    let prevented = false;
    canvas.dispatchEvent({ type, changedTouches, touches, cancelable: true,
      preventDefault() { prevented = true; } });
    return prevented;
  };
  assert.equal(touch('touchstart', [finger], [finger]), true, `${canvas.engineKey}: touch must prevent scrolling`);
  assert.ok(engaged(), `${canvas.engineKey}: primary touch must engage the engine's drag state`);
  touch('touchstart', [second], [finger, second]);
  assert.ok(engaged(), `${canvas.engineKey}: a second finger must not hijack the drag`);
  touch('touchmove', [second], [finger, second]);
  assert.ok(engaged(), `${canvas.engineKey}: a second finger must not move the drag`);
  touch('touchend', [second], [finger]);
  finger.clientX = 220;
  touch('touchmove', [finger], [finger]);
  assert.ok(engaged(), `${canvas.engineKey}: primary finger must keep the drag active`);
  touch('touchcancel', [finger], []);
  assert.equal(engaged(), false, `${canvas.engineKey}: cancellation must release the drag`);
  finger.clientX = 320;
  touch('touchmove', [finger], [finger]);
  assert.equal(engaged(), false, `${canvas.engineKey}: movement after cancellation must stay released`);
  touch('touchstart', [finger], [finger]);
  assert.ok(engaged(), `${canvas.engineKey}: a new touch must engage again`);
  touch('touchend', [finger], []);
  assert.equal(engaged(), false, `${canvas.engineKey}: lifting the finger must release the drag`);
  return finger;
}

function touch(canvas, changedTouches, touches) {
  let prevented = false;
  const type = canvas.nextTouchType || 'touchstart';
  canvas.dispatchEvent({ type, changedTouches, touches, cancelable: true,
    preventDefault() { prevented = true; } });
  return prevented;
}
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MockCanvas {
  constructor(w = 800, h = 600) {
    this.width = w;
    this.height = h;
    this.style = {};
    this.listeners = new Map();
  }
  getContext() {
    return new MockContext(this);
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }
  dispatchEvent(event) {
    for (const handler of this.listeners.get(event.type) || []) handler(event);
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }
}

class MockContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
    this.imageSmoothingEnabled = false;
    this.globalAlpha = 1;
    this._m = [1, 1];
    this._stack = [];
    this._scaled = false;
  }
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  rect() {}
  fillRect() {}
  strokeRect() {}
  stroke() {}
  fill() {}
  save() {
    this._stack.push([...this._m]);
  }
  restore() {
    if (this._stack.length > 0) {
      this._m = this._stack.pop();
    }
  }
  translate() {}
  rotate() {}
  scale(x, y = x) {
    this._m[0] *= x;
    this._m[1] *= y;
    if (x !== 1 || y !== 1) {
      this._scaled = true;
    }
  }
  fillText() {}
  strokeText() {}
  createImageData(w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  putImageData() {}
  drawImage() {}
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
  clip() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  ellipse() {}
  setLineDash() {}
  getLineDash() { return []; }
  measureText(text) { return { width: (text || "").length * 8 }; }
  roundRect() {}
  setTransform() {}
  resetTransform() {}
  clearRect() {}
  isPointInPath() { return false; }
  getImageData(x, y, w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
}

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.dataset = {};
    this.classList = {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    };
    this.style = {};
    this.children = [];
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  querySelector() { return new MockElement(); }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
}

class MockAudioParam {
  constructor() { this.value = 0; }
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
  cancelScheduledValues() { return this; }
}

class MockAudioNode {
  connect() { return this; }
  disconnect() {}
  start() {}
  stop() {}
}

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return new MockCanvas();
    return new MockElement(tag);
  },
  getElementById: (id) => new MockElement('div'),
  querySelectorAll: () => [],
  documentElement: new MockElement('html')
};

global.window = {
  devicePixelRatio: 1,
  addEventListener: () => {},
  removeEventListener: () => {},
  AudioContext: class {
    constructor() {
      this.destination = new MockAudioNode();
      this.currentTime = 0;
      this.state = 'running';
    }
    createGain() {
      const node = new MockAudioNode();
      node.gain = new MockAudioParam();
      node.gain.value = 1;
      return node;
    }
    createOscillator() {
      const node = new MockAudioNode();
      node.type = 'sine';
      node.frequency = new MockAudioParam();
      node.frequency.value = 440;
      node.detune = new MockAudioParam();
      return node;
    }
    createBiquadFilter() {
      const node = new MockAudioNode();
      node.type = 'lowpass';
      node.frequency = new MockAudioParam();
      node.Q = new MockAudioParam();
      return node;
    }
    createBufferSource() {
      const node = new MockAudioNode();
      node.buffer = null;
      node.loop = false;
      node.playbackRate = new MockAudioParam();
      return node;
    }
    createBuffer(channels, length, sampleRate) {
      return {
        numberOfChannels: channels,
        length: length,
        sampleRate: sampleRate,
        getChannelData: () => new Float32Array(length)
      };
    }
    createDynamicsCompressor() {
      const node = new MockAudioNode();
      node.threshold = new MockAudioParam();
      node.knee = new MockAudioParam();
      node.ratio = new MockAudioParam();
      node.attack = new MockAudioParam();
      node.release = new MockAudioParam();
      return node;
    }
    createConvolver() {
      const node = new MockAudioNode();
      node.buffer = null;
      return node;
    }
    createDelay() {
      const node = new MockAudioNode();
      node.delayTime = new MockAudioParam();
      return node;
    }
    createStereoPanner() {
      const node = new MockAudioNode();
      node.pan = new MockAudioParam();
      return node;
    }
    close() {}
    resume() { return Promise.resolve(); }
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 16)
};

async function runSuite() {
  const { DEMOS, PAVILIONS } = await import('../src/core/hub.js');
  const demoKeys = Object.keys(DEMOS);

  console.log('====================================================');
  console.log(`PLINY GAME LAB — VERIFYING ${demoKeys.length} CATALOG ENGINES`);
  console.log('====================================================\n');

  let passed = 0;
  let pending = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < demoKeys.length; i++) {
    const key = demoKeys[i];
    const demo = DEMOS[key];
    const engineFile = path.resolve(__dirname, '..', 'src', 'demos', key, `${key}.js`);

    if (!fs.existsSync(engineFile)) {
      pending++;
      continue;
    }

    try {
      const mod = await import(`../src/demos/${key}/${key}.js`);
      const EngineClass = mod[demo.exportName];
      if (!EngineClass) {
        throw new Error(`Export '${demo.exportName}' missing from ${engineFile}`);
      }

      const canvas = new MockCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      const container = new MockElement();

      const engine = new EngineClass(canvas, ctx, container);
      if (engine.resize) engine.resize(800, 600, 1);

      // Simulate 60 frames (1 second of simulation)
      for (let f = 0; f < 60; f++) {
        if (engine.update) engine.update(0.016);
      }

      // Test render pass
      if (engine.render) engine.render(ctx);

      // Verify entity count
      let count = 0;
      if (engine.getEntityCount) {
        count = engine.getEntityCount();
        if (typeof count !== 'number' || isNaN(count)) {
          throw new Error(`Invalid getEntityCount: ${count}`);
        }
      }

      // Test input methods don't throw
      if (engine.onMouseDown) engine.onMouseDown({ x: 400, y: 300, rawX: 400, rawY: 300, button: 0 });
      if (engine.onMouseMove) engine.onMouseMove({ x: 410, y: 310, rawX: 410, rawY: 310, button: 0 });
      if (engine.onMouseUp) engine.onMouseUp({ x: 410, y: 310, rawX: 410, rawY: 310, button: 0 });
      if (engine.onKeyDown) engine.onKeyDown(' ', {});
      if (engine.onKeyUp) engine.onKeyUp(' ', {});

      if (key === 'vesuvius') {
        assert.equal(engine.mission.mode, 'gameplay', 'Vesuvius must boot into Evacuate Stabiae gameplay');
        assert.match(engine.mission.objective, /Stabiae/);
        canvas.engineKey = key;
        canvas.getBoundingClientRect = () => ({ left: 20, top: 30, width: 400, height: 300 });
        engine.setPlayMode(mod.MODE.SANDBOX);
        engine.grid.fill(mod.ELEMENT.EMPTY);
        engine.selectedElement = mod.ELEMENT.WATER;
        const finger = makeTouch(canvas, engine, TOUCH_ENGINES[key]);
        const simIdx = (clientX, clientY) => {
          const rect = canvas.getBoundingClientRect();
          const pos = {
            x: (clientX - rect.left) * canvas.width / rect.width,
            y: (clientY - rect.top) * canvas.height / rect.height
          };
          const { gx, gy } = engine.toSim(pos);
          return Math.floor(gy) * engine.simWidth + Math.floor(gx);
        };
        assert.equal(engine.grid[simIdx(120, 90)], mod.ELEMENT.WATER, 'Touch must paint at scaled canvas coordinates');
        assert.ok(!engine.isDrawing, 'Cancellation must release the brush');
        engine.grid.fill(mod.ELEMENT.EMPTY);
        canvas.nextTouchType = 'touchstart';
        touch(canvas, [finger], [finger]);
        canvas.nextTouchType = 'touchmove';
        touch(canvas, [finger], [finger]);
        canvas.nextTouchType = undefined;
        assert.equal(engine.grid[simIdx(finger.clientX, finger.clientY)], mod.ELEMENT.WATER, 'Touch must keep painting across moves');
        engine.destroy();
        assert.ok(!engine.isDrawing, 'Destroy must stop an active drag');
        engine.grid.fill(mod.ELEMENT.EMPTY);
        canvas.nextTouchType = 'touchstart';
        touch(canvas, [finger], [finger]);
        canvas.nextTouchType = 'touchmove';
        touch(canvas, [finger], [finger]);
        canvas.nextTouchType = undefined;
        assert.equal(engine.grid[simIdx(finger.clientX, finger.clientY)], mod.ELEMENT.EMPTY, 'Destroyed engines must not receive touch input');
        assert.equal(canvas.style.touchAction, undefined, 'Destroy must restore canvas touch behavior');
      }

      if (key !== 'vesuvius') {
        canvas.engineKey = key;
        canvas.getBoundingClientRect = () => ({ left: 20, top: 30, width: 400, height: 300 });
        makeTouch(canvas, engine, TOUCH_ENGINES[key]);
      }

      // Verify uiScale contract at 1x and 3x
      assert.equal(typeof engine.uiScale, 'function', `${key}: engine must implement uiScale()`);
      assert.equal(engine.uiScale(), 1, `${key}: uiScale() must default to 1 at dpr=1`);
      if (engine.resize) {
        engine.resize(2400, 1800, 3);
        assert.equal(engine.uiScale(), 3, `${key}: uiScale() must return 3 when resized with dpr=3`);
        if (key === 'eratosthenes') engine.mode = 'sieve';
        if (key === 'silva') engine.inspectingRings = true;
        ctx._scaled = false;
        if (engine.render) engine.render(ctx);
        assert.equal(ctx._scaled, true, `${key}: render() must apply uiScale() via ctx.scale() at dpr=3`);
        assert.equal(ctx._stack.length, 0, `${key}: transform stack depth must return to 0 after render()`);
        assert.deepEqual(ctx._m, [1, 1], `${key}: residual transform scale must return to [1, 1] after render()`);
        if (key === 'eratosthenes') engine.mode = 'circumference';
        if (key === 'silva') engine.inspectingRings = false;
        engine.resize(800, 600, 1);
        assert.equal(engine.uiScale(), 1, `${key}: uiScale() must return 1 after restoring dpr=1`);
      }

      console.log(`[${i + 1}/50] ✓ ${key} (${demo.exportName}) OK — Entities: ${count}`);
      passed++;

      // Cleanup
      if (engine.destroy) engine.destroy();
    } catch (err) {
      console.error(`[${i + 1}/50] ✗ ${key} FAILED:`, err.message);
      failed++;
      failures.push({ key, error: err.message, stack: err.stack });
    }
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED | ${pending} PENDING | ${failed} FAILED (TOTAL ${demoKeys.length})`);
  console.log('====================================================');

  if (failed > 0) {
    console.error('\nFAILURE DETAILS:');
    failures.forEach(f => console.error(`- ${f.key}: ${f.error}\n${f.stack}`));
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal Suite Runner Error:', err);
  process.exit(1);
});
