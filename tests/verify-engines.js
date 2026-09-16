// Headless Test & Verification Suite for Pliny Game Lab Engines

class MockCanvas {
  constructor(w = 800, h = 600) {
    this.width = w;
    this.height = h;
    this.style = {};
  }
  getContext() {
    return new MockContext();
  }
  addEventListener() {}
  removeEventListener() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }
}

class MockContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.font = '';
    this.imageSmoothingEnabled = false;
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
  createImageData(w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  putImageData() {}
  drawImage() {}
}

class MockElement {
  constructor() {
    this.innerHTML = '';
    this.classList = {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    };
    this.style = {};
  }
  appendChild(child) { return child; }
  querySelector() { return new MockElement(); }
  querySelectorAll() { return []; }
  addEventListener() {}
}

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return new MockCanvas();
    return new MockElement();
  },
  getElementById: () => new MockElement(),
  querySelectorAll: () => []
};

global.window = {
  devicePixelRatio: 1,
  addEventListener: () => {},
  AudioContext: class {
    createGain() { return { connect() {}, gain: { value: 1 } }; }
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } }; }
    get destination() { return {}; }
    get currentTime() { return 0; }
  }
};

async function testVesuvius() {
  console.log('Testing VesuviusEngine...');
  const { VesuviusEngine } = await import('../src/demos/vesuvius/vesuvius.js');
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const container = new MockElement();

  const engine = new VesuviusEngine(canvas, ctx, container);
  for (let i = 0; i < 30; i++) engine.update(0.016);
  engine.triggerEruption();
  for (let i = 0; i < 30; i++) engine.update(0.016);

  const count = engine.getEntityCount();
  console.log(`✓ VesuviusEngine OK (Active particles: ${count})`);
}

async function testBestiarium() {
  console.log('Testing BestiariumEngine...');
  const { BestiariumEngine } = await import('../src/demos/bestiarium/bestiarium.js');
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const container = new MockElement();

  const engine = new BestiariumEngine(canvas, ctx, container);
  for (let i = 0; i < 60; i++) engine.update(0.016);

  const count = engine.getEntityCount();
  console.log(`✓ BestiariumEngine OK (Active organisms: ${count})`);
}

async function testCosmographia() {
  console.log('Testing CosmographiaEngine...');
  const { CosmographiaEngine } = await import('../src/demos/cosmographia/cosmographia.js');
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const container = new MockElement();

  const engine = new CosmographiaEngine(canvas, ctx, container);
  for (let i = 0; i < 60; i++) engine.update(0.016);

  const count = engine.getEntityCount();
  console.log(`✓ CosmographiaEngine OK (Celestial bodies: ${count})`);
}

async function testMechanica() {
  console.log('Testing MechanicaEngine...');
  const { MechanicaEngine } = await import('../src/demos/mechanica/mechanica.js');
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const container = new MockElement();

  const engine = new MechanicaEngine(canvas, ctx, container);
  for (let i = 0; i < 60; i++) engine.update(0.016);

  const count = engine.getEntityCount();
  console.log(`✓ MechanicaEngine OK (Points & constraints: ${count})`);
}

async function testLabyrinthus() {
  console.log('Testing LabyrinthusEngine...');
  const { LabyrinthusEngine } = await import('../src/demos/labyrinthus/labyrinthus.js');
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const container = new MockElement();

  const engine = new LabyrinthusEngine(canvas, ctx, container);
  for (let i = 0; i < 60; i++) engine.update(0.016);

  const count = engine.getEntityCount();
  console.log(`✓ LabyrinthusEngine OK (Active 3D sprites: ${count})`);
}

async function runAll() {
  try {
    await testVesuvius();
    await testBestiarium();
    await testCosmographia();
    await testMechanica();
    await testLabyrinthus();
    console.log('\n=======================================');
    console.log('ALL 5 PLINY GAME LAB ENGINES VERIFIED!');
    console.log('=======================================');
  } catch (err) {
    console.error('Test Failure:', err);
    process.exit(1);
  }
}

runAll();
