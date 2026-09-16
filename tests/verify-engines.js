// Universal Headless Test & Verification Suite for Pliny Game Lab Engines
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MockCanvas {
  constructor(w = 800, h = 600) {
    this.width = w;
    this.height = h;
    this.style = {};
  }
  getContext() {
    return new MockContext(this);
  }
  addEventListener() {}
  removeEventListener() {}
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
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
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
