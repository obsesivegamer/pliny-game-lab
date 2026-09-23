/**
 * Vesuvius Fixed-Step Timing Test Suite
 *
 * Proves that the Vesuvius simulation advances at a consistent rate
 * regardless of display refresh rate. Baseline and browser evidence live
 * alongside ANTIGRAVITY-01-RESULTS.md.
 *
 * Run: node tests/vesuvius-timing.js
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Mocks (mirror tests/vesuvius-gameplay.js conventions)
// ---------------------------------------------------------------------------

class MockCanvas {
  constructor(w = 800, h = 600) {
    this.width = w;
    this.height = h;
    this.style = {};
    this.listeners = new Map();
  }
  getContext() { return new MockContext(this); }
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
    this.texts = [];
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
  fillText(text) { this.texts.push(String(text)); }
  strokeText() {}
  createImageData(w, h) {
    return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  }
  putImageData() {}
  drawImage() {}
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
  clip() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  ellipse() {}
  setLineDash() {}
  getLineDash() { return []; }
  measureText(text) { return { width: (text || '').length * 8 }; }
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
  constructor() {
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.dataset = {};
    this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    this.style = {};
    this.children = [];
  }
  appendChild(child) { this.children.push(child); return child; }
  querySelector() { return new MockElement(); }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
}

class MockAudioParam { constructor() { this.value = 0; } setValueAtTime() { return this; } linearRampToValueAtTime() { return this; } exponentialRampToValueAtTime() { return this; } setTargetAtTime() { return this; } cancelScheduledValues() { return this; } }
class MockAudioNode { connect() { return this; } disconnect() {} start() {} stop() {} }

global.document = {
  createElement: (tag) => tag === 'canvas' ? new MockCanvas() : new MockElement(),
  getElementById: () => new MockElement(),
  querySelectorAll: () => [],
  documentElement: new MockElement()
};
global.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
  AudioContext: class {
    constructor() {
      this.destination = new MockAudioNode();
      this.currentTime = 0;
      this.state = 'running';
    }
    createGain() { const n = new MockAudioNode(); n.gain = new MockAudioParam(); return n; }
    createOscillator() {
      const n = new MockAudioNode();
      n.type = 'sine';
      n.frequency = new MockAudioParam();
      n.detune = new MockAudioParam();
      return n;
    }
    createBiquadFilter() { const n = new MockAudioNode(); n.frequency = new MockAudioParam(); n.Q = new MockAudioParam(); return n; }
    createBufferSource() { const n = new MockAudioNode(); n.buffer = null; n.playbackRate = new MockAudioParam(); return n; }
    createBuffer(c, length) { return { getChannelData: () => new Float32Array(length) }; }
    createDynamicsCompressor() {
      const n = new MockAudioNode();
      n.threshold = new MockAudioParam(); n.knee = new MockAudioParam();
      n.ratio = new MockAudioParam(); n.attack = new MockAudioParam(); n.release = new MockAudioParam();
      return n;
    }
    createConvolver() { return new MockAudioNode(); }
    createDelay() { const n = new MockAudioNode(); n.delayTime = new MockAudioParam(); return n; }
    createStereoPanner() { const n = new MockAudioNode(); n.pan = new MockAudioParam(); return n; }
    close() {}
    resume() { return Promise.resolve(); }
  }
};

// ---------------------------------------------------------------------------
// Import engine
// ---------------------------------------------------------------------------
const { VesuviusEngine, ELEMENT, PHASE, SIM_FIXED_DT, SIM_MAX_STEPS_PER_UPDATE } = await import('../src/demos/vesuvius/vesuvius.js');
const { MODE, STATUS, createMission, MISSION_NUMBERS, scheduledPhase } = await import('../src/demos/vesuvius/mission.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEngine() {
  const canvas = new MockCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  const engine = new VesuviusEngine(canvas, ctx, new MockElement());
  engine.resize(800, 600, 1);
  return engine;
}

/** Keep the production 280 × 180 world; clear it to isolate one sand column. */
function makeSandboxFixture() {
  const engine = makeEngine();
  engine.setPlayMode(MODE.SANDBOX);
  // Clear the grid completely
  engine.grid.fill(ELEMENT.EMPTY);
  engine.heat.fill(0);
  engine.visited.fill(0);
  // Clear all kinematic entities so they don't interfere
  engine.bombs = [];
  engine.bombFragments = [];
  engine.pdcs = [];
  engine.plumeParticles = [];
  engine.lightningBolts = [];
  engine.shockwaves = [];
  // Suppress volcano spawning by setting phase to dormant and pressure to 0
  engine.currentPhase = PHASE.DORMANT;
  engine.chamberPressure = 0;
  engine.targetPlumeKm = 0;
  engine.plumeHeightKm = 0;
  // Seed for determinism
  engine._setSeed(42);
  return engine;
}

/** Narrow the isolated CA fixture to exactly five columns without changing production world size. */
function makeSandFixture() {
  const engine = makeSandboxFixture();
  engine.simWidth = 5;
  engine.cellCount = 5 * 180;
  engine.grid = new Uint8Array(engine.cellCount);
  engine.heat = new Float32Array(engine.cellCount);
  engine.visited = new Uint8Array(engine.cellCount);
  engine.pressure = new Float32Array(engine.cellCount);
  engine.elevationMap = new Int16Array(5).fill(180);
  return engine;
}

function test(name, fn) {
  fn();
  console.log(`  ✓ ${name}`);
}

/** Find the lowest row containing the given element in column x. */
function findLowestRow(engine, x, elem) {
  for (let y = engine.simHeight - 1; y >= 0; y--) {
    if (engine.grid[y * engine.simWidth + x] === elem) {
      return y;
    }
  }
  return -1;
}

/** Simple grid hash for comparing simulation states. */
function gridHash(engine) {
  let hash = 0;
  for (let i = 0; i < engine.grid.length; i++) {
    hash = ((hash << 5) - hash + engine.grid[i]) | 0;
  }
  return hash;
}

function bytesHash(view) {
  return createHash('sha256').update(Buffer.from(view.buffer, view.byteOffset, view.byteLength)).digest('hex');
}

function replayState(engine) {
  return {
    steps: engine.simStepCount,
    time: engine.time,
    phase: engine.currentPhase,
    grid: bytesHash(engine.grid),
    heat: bytesHash(engine.heat),
    mission: {
      time: engine.mission.time,
      status: engine.mission.status,
      loseReason: engine.mission.loseReason,
      rescued: engine.mission.rescued,
      civiliansAtStabiae: engine.mission.civiliansAtStabiae,
      ventCharges: engine.mission.ventCharges,
      barrierCharges: engine.mission.barrierCharges,
      ventDelay: engine.mission.ventDelay
    },
    ships: engine.fleet.map(({ x, y, cargo, health, alive, orderedX, state, deckPumice }) =>
      ({ x, y, cargo, health, alive, orderedX, state, deckPumice })),
    hazards: {
      bombs: engine.bombs.map(({ x, y, vx, vy, mass, isPumice }) => ({ x, y, vx, vy, mass, isPumice })),
      pdcs: engine.pdcs.map(({ x, y, vx, vy, life, maxLife, radius }) => ({ x, y, vx, vy, life, maxLife, radius }))
    }
  };
}

function section(name) {
  console.log(`\n${name}\n`);
}

// ===========================================================================
section('VESUVIUS TIMING — sand baseline and treatment');
// ===========================================================================

test('sand at 30/60/120 Hz travels equally through the five-column fixture', () => {
  const results = {};

  for (const fps of [30, 60, 120]) {
    const engine = makeSandFixture();
    // Place sand at column 2, row 10
    engine.grid[10 * engine.simWidth + 2] = ELEMENT.SAND;

    const dt = 1 / fps;
    const calls = fps; // 1 second of simulation time
    for (let i = 0; i < calls; i++) {
      engine.update(dt);
    }

    results[fps] = {
      sandY: findLowestRow(engine, 2, ELEMENT.SAND),
      steps: engine.simStepCount
    };
  }

  // With fixed-step timing, all frame rates should produce identical results
  assert.equal(results[30].steps, 60, '30 Hz should execute 60 steps in 1 second');
  assert.equal(results[60].steps, 60, '60 Hz should execute 60 steps in 1 second');
  assert.equal(results[120].steps, 60, '120 Hz should execute 60 steps in 1 second');

  // Sand position must be identical across all frame rates
  assert.equal(results[30].sandY, results[60].sandY,
    `Sand position should match: 30Hz=${results[30].sandY}, 60Hz=${results[60].sandY}`);
  assert.equal(results[60].sandY, results[120].sandY,
    `Sand position should match: 60Hz=${results[60].sandY}, 120Hz=${results[120].sandY}`);

  assert.equal(results[60].sandY, 70, '60 steps move sand from row 10 to row 70');
});

test('sand at all rates reaches row 70 after 1 second (60 fixed steps)', () => {
  for (const fps of [30, 60, 120]) {
    const engine = makeSandFixture();
    engine.grid[10 * engine.simWidth + 2] = ELEMENT.SAND;
    const dt = 1 / fps;
    for (let i = 0; i < fps; i++) {
      engine.update(dt);
    }
    assert.equal(engine.simStepCount, 60, `${fps} Hz: 60 steps expected`);
    assert.equal(findLowestRow(engine, 2, ELEMENT.SAND), 70,
      `${fps} Hz: sand should be at row 70 after 60 steps`);
  }
});

// ===========================================================================
section('VESUVIUS TIMING — irregular cadence');
// ===========================================================================

test('irregular cadence [1/120, 1/40, 1/30] × 15 matches regular cadence', () => {
  // Total: 15 * (1/120 + 1/40 + 1/30) = 15 * (1/120 + 3/120 + 4/120) = 15 * 8/120 = 1.0 seconds
  const irregular = [1 / 120, 1 / 40, 1 / 30];

  // Regular 60 Hz
  const regular = makeSandFixture();
  regular.grid[10 * regular.simWidth + 2] = ELEMENT.SAND;
  for (let i = 0; i < 60; i++) regular.update(1 / 60);

  // Irregular
  const engine = makeSandFixture();
  engine.grid[10 * engine.simWidth + 2] = ELEMENT.SAND;
  for (let rep = 0; rep < 15; rep++) {
    for (const dt of irregular) {
      engine.update(dt);
    }
  }

  assert.equal(engine.simStepCount, 60, 'Irregular cadence: 60 steps in 1 second');
  assert.equal(engine.simStepCount, regular.simStepCount, 'Step count matches regular');
  assert.equal(
    findLowestRow(engine, 2, ELEMENT.SAND),
    findLowestRow(regular, 2, ELEMENT.SAND),
    'Sand position matches regular cadence'
  );
});

test('half-step and just-below/above-step boundaries', () => {
  const engine = makeSandboxFixture();

  // Half step — should not trigger a simulation step
  engine.update(SIM_FIXED_DT * 0.5);
  assert.equal(engine.simStepCount, 0, 'Half step: no simulation step');
  assert.ok(engine.simAccumulator > 0, 'Half step: accumulator has time');

  // Another half step — total is now exactly 1 step
  engine.update(SIM_FIXED_DT * 0.5);
  assert.equal(engine.simStepCount, 1, 'Two half steps: one simulation step');

  // Just below one step
  const engine2 = makeSandboxFixture();
  engine2.update(SIM_FIXED_DT - 1e-10);
  // With epsilon tolerance of 1e-9, this should trigger
  assert.equal(engine2.simStepCount, 1, 'Just below step (within epsilon): triggers step');

  // Just above one step
  const engine3 = makeSandboxFixture();
  engine3.update(SIM_FIXED_DT + 1e-10);
  assert.equal(engine3.simStepCount, 1, 'Just above step: one step, remainder carried');
  assert.ok(engine3.simAccumulator > 0, 'Fractional remainder preserved');
});

// ===========================================================================
section('VESUVIUS TIMING — catch-up bound');
// ===========================================================================

test('update(0.1) executes exactly 6 steps', () => {
  const engine = makeSandboxFixture();
  engine.update(0.1);
  assert.equal(engine.simStepCount, 6, 'update(0.1) = 6 steps');
});

test('update(5) executes at most 6 steps (stall recovery)', () => {
  const engine = makeSandboxFixture();
  engine.update(5);
  assert.equal(engine.simStepCount, 6, 'update(5) = 6 steps max (bounded catch-up)');
  // Verify the backlog was discarded
  assert.ok(engine.simAccumulator < SIM_FIXED_DT, 'Backlog discarded, only fractional remainder');
});

test('after a stall, the next update(1/60) executes one step normally', () => {
  const engine = makeSandboxFixture();
  engine.update(5); // Stall — 6 steps, backlog discarded
  assert.equal(engine.simStepCount, 6);

  engine.update(1 / 60); // Normal frame
  assert.equal(engine.simStepCount, 7, 'One more step after stall recovery');
});

test('mission and simulation advance by the same admitted duration while playing', () => {
  const engine = makeEngine();
  engine._setSeed(42);
  engine.update(0.1); // 6 steps at 1/60 each = 0.1 seconds
  assert.ok(Math.abs(engine.time - 6 * SIM_FIXED_DT) < 1e-9,
    'Simulation time matches 6 fixed steps');
  assert.ok(Math.abs(engine.mission.time - 6 * SIM_FIXED_DT) < 1e-9,
    'Mission time matches simulation time');
});

// ===========================================================================
section('VESUVIUS TIMING — invalid inputs');
// ===========================================================================

test('zero dt: no state change', () => {
  const engine = makeSandboxFixture();
  const timeBefore = engine.time;
  engine.update(0);
  assert.equal(engine.time, timeBefore, 'Time unchanged on dt=0');
  assert.equal(engine.simStepCount, 0, 'No steps on dt=0');
});

test('negative dt: no state change', () => {
  const engine = makeSandboxFixture();
  engine.update(1 / 60); // One valid step first
  const timeBefore = engine.time;
  const stepsBefore = engine.simStepCount;
  engine.update(-0.5);
  assert.equal(engine.time, timeBefore, 'Time unchanged on negative dt');
  assert.equal(engine.simStepCount, stepsBefore, 'No steps on negative dt');
});

test('NaN dt: no state change and no poisoned accumulator', () => {
  const engine = makeSandboxFixture();
  engine.update(NaN);
  assert.equal(engine.simStepCount, 0, 'No steps on NaN dt');
  assert.equal(engine.simAccumulator, 0, 'Accumulator not poisoned');
  // Verify a subsequent valid step still works
  engine.update(1 / 60);
  assert.equal(engine.simStepCount, 1, 'Valid step works after NaN');
});

test('Infinity dt: no state change and no poisoned accumulator', () => {
  const engine = makeSandboxFixture();
  engine.update(Infinity);
  assert.equal(engine.simStepCount, 0, 'No steps on Infinity dt');
  assert.equal(engine.simAccumulator, 0, 'Accumulator not poisoned');
  engine.update(1 / 60);
  assert.equal(engine.simStepCount, 1, 'Valid step works after Infinity');
});

// ===========================================================================
section('VESUVIUS TIMING — pause/resume');
// ===========================================================================

test('paused calls add no accumulator time', () => {
  const engine = makeSandboxFixture();
  // Accumulate a half-step
  engine.update(SIM_FIXED_DT * 0.5);
  assert.equal(engine.simStepCount, 0);
  const accBefore = engine.simAccumulator;

  // Pause
  engine.isPaused = true;
  engine.update(1.0); // Large elapsed value while paused
  engine.update(5.0);
  assert.equal(engine.simStepCount, 0, 'No steps while paused');
  assert.equal(engine.simAccumulator, accBefore, 'Accumulator unchanged while paused');
  assert.equal(engine.time, 0, 'Time unchanged while paused');
});

test('resume continues from pre-pause state with no burst', () => {
  const engine = makeSandboxFixture();
  engine.grid[10 * engine.simWidth + 2] = ELEMENT.SAND;

  // Run 30 steps
  for (let i = 0; i < 30; i++) engine.update(1 / 60);
  assert.equal(engine.simStepCount, 30);
  const sandBefore = findLowestRow(engine, 2, ELEMENT.SAND);

  // Pause, send large dt, resume
  engine.isPaused = true;
  engine.update(10.0);
  engine.isPaused = false;

  // One normal step
  engine.update(1 / 60);
  assert.equal(engine.simStepCount, 31, 'Only one step after resume');
  const sandAfter = findLowestRow(engine, 2, ELEMENT.SAND);
  assert.ok(sandAfter >= sandBefore, 'Sand continued falling normally');
});

test('pause with half-step remainder preserved correctly', () => {
  const engine = makeSandboxFixture();
  // Accumulate a half-step remainder
  engine.update(SIM_FIXED_DT * 0.5);
  assert.equal(engine.simStepCount, 0);
  const halfStep = engine.simAccumulator;

  // Pause and send large values
  engine.isPaused = true;
  engine.update(100);
  assert.equal(engine.simAccumulator, halfStep, 'Half-step preserved during pause');

  // Resume — the half-step remainder plus new active time should complete a tick
  engine.isPaused = false;
  engine.update(SIM_FIXED_DT * 0.5);
  assert.equal(engine.simStepCount, 1, 'Half-step remainder + new half completes one tick');
});

// ===========================================================================
section('VESUVIUS TIMING — reset/mode/new instance');
// ===========================================================================

test('reset clears accumulator, step counter and timing', () => {
  const engine = makeEngine();
  engine.update(SIM_FIXED_DT * 1.5); // Creates a half-step remainder
  assert.equal(engine.simStepCount, 1);
  assert.ok(engine.simAccumulator > 0);

  engine.reset();
  assert.equal(engine.time, 0, 'Time cleared');
  assert.equal(engine.simAccumulator, 0, 'Accumulator cleared');
  assert.equal(engine.simStepCount, 0, 'Step counter cleared');
});

test('mode switch clears timing state', () => {
  const engine = makeEngine();
  engine.update(SIM_FIXED_DT * 2.5);
  assert.equal(engine.simStepCount, 2);

  engine.setPlayMode(MODE.SANDBOX);
  assert.equal(engine.simStepCount, 0, 'Step counter cleared on mode switch');
  assert.equal(engine.simAccumulator, 0, 'Accumulator cleared on mode switch');

  engine.setPlayMode(MODE.GAMEPLAY);
  assert.equal(engine.simStepCount, 0, 'Step counter cleared on switch back');
});

test('new instance starts with zero timing state', () => {
  const engine1 = makeEngine();
  engine1.update(SIM_FIXED_DT * 3.5);
  assert.equal(engine1.simStepCount, 3);

  const engine2 = makeEngine();
  assert.equal(engine2.time, 0, 'New instance: time=0');
  assert.equal(engine2.simAccumulator, 0, 'New instance: accumulator=0');
  assert.equal(engine2.simStepCount, 0, 'New instance: stepCount=0');
});

// ===========================================================================
section('VESUVIUS TIMING — resize');
// ===========================================================================

test('resize preserves timing state, mission and world', () => {
  const engine = makeEngine();
  engine._setSeed(42);
  engine.grid[10 * engine.simWidth + 2] = ELEMENT.SAND;
  engine.selectShip(0);
  engine.orderSelectedShip(MISSION_NUMBERS.stabiaeX);
  for (let i = 0; i < 360 && engine.fleet[0].cargo === 0; i++) engine.update(1 / 60);
  assert.ok(engine.fleet[0].cargo > 0, 'ship has real pickup cargo before resize');

  // Keep a half-step remainder through CSS and DPR changes.
  engine.update(SIM_FIXED_DT * 0.5); // Half-step remainder
  const timeBefore = engine.time;
  const accBefore = engine.simAccumulator;
  const stepsBefore = engine.simStepCount;
  const missionTimeBefore = engine.mission.time;
  const hashBefore = gridHash(engine);
  const cargoBefore = engine.fleet[0].cargo;
  const civiliansBefore = engine.mission.civiliansAtStabiae;

  // Hub passes backing-store dimensions, so CSS 844 × 390 at DPR 3 is 2532 × 1170.
  engine.canvas.width = 2532;
  engine.canvas.height = 1170;
  engine.resize(2532, 1170, 3);
  assert.equal(engine.time, timeBefore, 'Time preserved after resize');
  assert.equal(engine.simAccumulator, accBefore, 'Accumulator preserved after resize');
  assert.equal(engine.simStepCount, stepsBefore, 'Step counter preserved after resize');
  assert.equal(engine.mission.time, missionTimeBefore, 'Mission time preserved');
  assert.equal(gridHash(engine), hashBefore, 'Grid state preserved after resize');
  assert.equal(engine.fleet[0].cargo, cargoBefore, 'Cargo preserved after DPR change');
  assert.equal(engine.mission.civiliansAtStabiae, civiliansBefore, 'Civilians preserved');

  engine.canvas.width = 390;
  engine.canvas.height = 844;
  engine.resize(390, 844, 1);
  assert.equal(engine.time, timeBefore, 'Time preserved after second resize');
  assert.equal(gridHash(engine), hashBefore, 'Grid preserved after DPR change');
  assert.equal(engine.fleet[0].cargo, cargoBefore, 'Cargo preserved in portrait');

  // Desktop resize
  engine.canvas.width = 1280;
  engine.canvas.height = 800;
  engine.resize(1280, 800, 1);
  assert.equal(engine.simStepCount, stepsBefore, 'Steps preserved at desktop size');
  assert.equal(engine.fleet[0].cargo, cargoBefore, 'Cargo preserved at desktop size');
});

// ===========================================================================
section('VESUVIUS TIMING — terminal state');
// ===========================================================================

test('win/loss results stay settled across continued updates', () => {
  const engine = makeEngine();
  engine._setSeed(42);
  // Force a win
  engine.mission.rescued = MISSION_NUMBERS.rescueQuota;
  engine.update(1 / 60); // Triggers tickGameplay which calls resolveMission

  assert.equal(engine.mission.status, STATUS.WON, 'Mission won');
  const wonState = replayState(engine).mission;

  // Continue updating at various cadences
  for (let i = 0; i < 60; i++) engine.update(1 / 30);
  for (let i = 0; i < 120; i++) engine.update(1 / 120);
  engine.update(0.1);
  engine.update(5);

  assert.equal(engine.mission.status, STATUS.WON, 'Status remains WON');
  assert.deepEqual(replayState(engine).mission, wonState, 'Won mission time, totals and resources stay settled');

  engine.reset();
  for (const ship of engine.fleet) {
    ship.health = 0;
    ship.alive = false;
  }
  engine.update(1 / 60);
  assert.equal(engine.mission.status, STATUS.LOST, 'Destroyed fleet loses');
  const lostState = replayState(engine).mission;
  for (let i = 0; i < 60; i++) engine.update(1 / 30);
  for (let i = 0; i < 120; i++) engine.update(1 / 120);
  engine.update(5);
  assert.deepEqual(replayState(engine).mission, lostState, 'Lost mission time, totals and resources stay settled');
});

test('HUD sync runs once per outer update and immediately after input or reset', () => {
  const engine = makeEngine();
  const sync = engine.syncMissionHud.bind(engine);
  let writes = 0;
  engine.syncMissionHud = () => { writes++; sync(); };
  engine.update(0.1);
  assert.equal(engine.simStepCount, 6);
  assert.equal(writes, 1, 'six simulation steps cause one HUD sync');
  engine.update(1 / 120);
  assert.equal(writes, 1, 'no completed step causes no HUD sync');
  engine.selectShip(0);
  assert.equal(writes, 2, 'selection updates HUD immediately');
  engine.reset();
  assert.equal(writes, 3, 'reset updates HUD immediately');
});

// ===========================================================================
section('VESUVIUS TIMING — render independence');
// ===========================================================================

test('renders between updates do not affect simulation state', () => {
  const ctx = new MockContext(new MockCanvas());
  const results = [];

  for (const renderCount of [0, 1, 2]) {
    const engine = makeSandboxFixture();
    engine.grid[10 * engine.simWidth + 2] = ELEMENT.SAND;

    for (let frame = 0; frame < 60; frame++) {
      engine.update(1 / 60);
      // Interleave renders — these consume Math.random() for fire flicker
      for (let r = 0; r < renderCount; r++) {
        engine.render(ctx);
      }
    }

    results.push({
      renders: renderCount,
      sandY: findLowestRow(engine, 2, ELEMENT.SAND),
      steps: engine.simStepCount,
      hash: gridHash(engine),
      time: engine.time
    });
  }

  // All render counts should produce identical simulation results
  assert.equal(results[0].sandY, results[1].sandY,
    `0 vs 1 render: sand position must match (${results[0].sandY} vs ${results[1].sandY})`);
  assert.equal(results[1].sandY, results[2].sandY,
    `1 vs 2 renders: sand position must match`);
  assert.equal(results[0].hash, results[1].hash, '0 vs 1 render: grid hash must match');
  assert.equal(results[1].hash, results[2].hash, '1 vs 2 renders: grid hash must match');
  assert.equal(results[0].steps, results[1].steps, 'Step counts match');
});

test('active fire renders do not change pyroclastic hazard lifetimes', () => {
  const originalRandom = Math.random;
  const states = [];
  try {
    for (const renderCount of [0, 1, 2]) {
      let seed = 123456;
      Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
      const engine = makeEngine();
      engine._setSeed(2026);
      engine.grid[20 * engine.simWidth + 20] = ELEMENT.FIRE;
      for (let i = 0; i < renderCount; i++) engine.render(engine.ctx);
      engine.triggerColumnCollapseSurges();
      const spawned = engine.pdcs.length;
      for (let frame = 0; frame < 60; frame++) {
        engine.update(1 / 60);
        for (let i = 0; i < renderCount; i++) engine.render(engine.ctx);
      }
      states.push({
        spawned,
        grid: bytesHash(engine.grid),
        heat: bytesHash(engine.heat),
        rescued: engine.mission.rescued,
        currents: engine.pdcs.map(({ x, y, vx, vy, radius, life, maxLife }) =>
          ({ x, y, vx, vy, radius, life, maxLife }))
      });
      engine.destroy();
    }
  } finally {
    Math.random = originalRandom;
  }
  assert.equal(states[0].spawned, 36, 'collapse creates real currents');
  assert.deepEqual(states[1], states[0], 'one extra render preserves hazard state');
  assert.deepEqual(states[2], states[0], 'two extra renders preserve hazard state');
});

test('active fire renders do not change bomb, fragment, or plume physics', () => {
  const originalRandom = Math.random;
  const states = [];
  try {
    for (const renderCount of [0, 1, 2]) {
      let seed = 98765;
      Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
      const engine = makeEngine();
      engine.setPlayMode(MODE.SANDBOX);
      engine._setSeed(773);
      engine.setEruptionPhase(PHASE.ULTRA_PLINIAN);
      engine.grid[20 * engine.simWidth + 20] = ELEMENT.FIRE;
      for (let i = 0; i < renderCount; i++) engine.render(engine.ctx);
      for (let i = 0; i < 30 && !engine.bombs.length; i++) engine.update(1 / 60);
      assert.ok(engine.bombs.length, 'eruption spawns a bomb');
      const bomb = engine.bombs[0];
      const bombState = { mass: bomb.mass, isPumice: bomb.isPumice, vx: bomb.vx, vy: bomb.vy };
      const createFragments = bomb.createFragments.bind(bomb);
      let spawnedFragments = [];
      bomb.createFragments = () => (spawnedFragments = createFragments());
      bomb.x = engine.ventX;
      bomb.y = engine.elevationMap[engine.ventX] - 1;
      bomb.vy = 10;
      engine.update(1 / 60);
      assert.ok(spawnedFragments.length >= 4, 'impact creates fragments');
      assert.ok(engine.plumeParticles.length, 'eruption creates plume particles');
      states.push({
        bomb: bombState,
        fragments: spawnedFragments.map(({ vx, vy, maxLife }) => ({ vx, vy, maxLife })),
        plume: engine.plumeParticles.slice(0, 3).map(({ x, y, vx, vy, maxLife }) => ({ x, y, vx, vy, maxLife }))
      });
      engine.destroy();
    }
  } finally {
    Math.random = originalRandom;
  }
  assert.deepEqual(states[1], states[0], 'one extra render preserves entity physics');
  assert.deepEqual(states[2], states[0], 'two extra renders preserve entity physics');
});

// ===========================================================================
section('VESUVIUS TIMING — 60 Hz compatibility');
// ===========================================================================

test('60 Hz produces exactly one step per update call', () => {
  const engine = makeSandboxFixture();
  for (let i = 0; i < 60; i++) {
    const stepsBefore = engine.simStepCount;
    engine.update(1 / 60);
    assert.equal(engine.simStepCount, stepsBefore + 1,
      `Frame ${i}: exactly one step at 60 Hz`);
  }
  assert.equal(engine.simStepCount, 60);
});

test('60 Hz preserves baseline fleet travel and first phase boundary', () => {
  const engine = makeEngine();
  engine.selectShip(0);
  assert.equal(engine.orderSelectedShip(MISSION_NUMBERS.stabiaeX), true);
  for (let i = 0; i < 270; i++) engine.update(1 / 60);
  assert.ok(Math.abs(engine.time - 4.5) < 1e-9);
  assert.ok(Math.abs(engine.mission.time - 4.5) < 1e-9);
  assert.equal(engine.currentPhase, PHASE.SEISMIC_TREMOR);
  assert.ok(Math.abs(engine.fleet[0].x - 250.4) < 1e-9, 'baseline 270-step ship position');
  assert.equal(engine.fleet[0].state, 'sailing');
  assert.equal(engine.fleet[0].cargo, 0);
  assert.equal(engine.fleet[0].health, 100);
  assert.equal(engine.mission.civiliansAtStabiae, MISSION_NUMBERS.startingCivilians);
  engine.destroy();
});

test('30 Hz produces two steps per update call', () => {
  const engine = makeSandboxFixture();
  for (let i = 0; i < 30; i++) {
    const stepsBefore = engine.simStepCount;
    engine.update(1 / 30);
    assert.equal(engine.simStepCount, stepsBefore + 2,
      `Frame ${i}: two steps at 30 Hz`);
  }
  assert.equal(engine.simStepCount, 60);
});

test('120 Hz alternates 0 and 1 steps per call', () => {
  const engine = makeSandboxFixture();
  let zeroCount = 0;
  let oneCount = 0;
  for (let i = 0; i < 120; i++) {
    const stepsBefore = engine.simStepCount;
    engine.update(1 / 120);
    const stepsThisFrame = engine.simStepCount - stepsBefore;
    assert.ok(stepsThisFrame === 0 || stepsThisFrame === 1,
      `120 Hz frame ${i}: 0 or 1 step (got ${stepsThisFrame})`);
    if (stepsThisFrame === 0) zeroCount++;
    else oneCount++;
  }
  assert.equal(engine.simStepCount, 60, '120 Hz: 60 total steps in 1 second');
  assert.equal(oneCount, 60, '120 Hz: exactly 60 frames produced one step');
  assert.equal(zeroCount, 60, '120 Hz: exactly 60 frames produced zero steps');
});

// ===========================================================================
section('VESUVIUS TIMING — real-engine replay (seeded deterministic)');
// ===========================================================================

test('seeded replay at 30/60/120/irregular produces identical state at equal ticks', () => {
  const seed = 12345;
  const scenarios = {
    '60Hz': () => { const dt = 1 / 60; return Array(600).fill(dt); },
    '30Hz': () => { const dt = 1 / 30; return Array(300).fill(dt); },
    '120Hz': () => { const dt = 1 / 120; return Array(1200).fill(dt); },
    'irregular': () => {
      const pattern = [1 / 120, 1 / 40, 1 / 30];
      const result = [];
      for (let rep = 0; rep < 150; rep++) {
        for (const dt of pattern) result.push(dt);
      }
      return result;
    }
  };

  const states = {};
  for (const [name, makeDts] of Object.entries(scenarios)) {
    const engine = makeEngine();
    engine._setSeed(seed);
    engine.selectShip(0);
    assert.equal(engine.orderSelectedShip(MISSION_NUMBERS.stabiaeX), true);
    const dts = makeDts();
    let orderedSecond = false;
    for (const dt of dts) {
      if (!orderedSecond && engine.simStepCount === 240) {
        engine.selectShip(1);
        assert.equal(engine.orderSelectedShip(MISSION_NUMBERS.stabiaeX), true);
        orderedSecond = true;
      }
      engine.update(dt);
    }
    states[name] = replayState(engine);
    assert.ok(states[name].ships.some((ship) => ship.cargo > 0), `${name}: commanded ships load civilians`);
    engine.destroy();
  }

  // All should have completed 600 steps (10 seconds × 60 steps/s)
  for (const [name, state] of Object.entries(states)) {
    assert.equal(state.steps, 600, `${name}: 600 steps`);
    assert.ok(Math.abs(state.time - 10.0) < 1e-6, `${name}: time ≈ 10s`);
  }

  // World arrays, every mission resource, ship physics and hazards match.
  const ref = states['60Hz'];
  for (const name of ['30Hz', '120Hz', 'irregular']) {
    assert.deepEqual(states[name], ref, `${name} vs 60Hz: complete authoritative replay state`);
  }
});

// ===========================================================================
section('VESUVIUS TIMING — longer mission boundaries');
// ===========================================================================

test('mission crosses phase four and completes ship loading/offloading across cadences', () => {
  const seed = 99999;
  // Run past the phase 3 eruption boundary (at t=15s) and into phase 4 (t=24s)
  const targetSeconds = 25;
  const targetSteps = targetSeconds * 60;

  const states = {};
  const cadences = {
    '30Hz': Array(30 * targetSeconds).fill(1 / 30),
    '60Hz': Array(60 * targetSeconds).fill(1 / 60),
    '120Hz': Array(120 * targetSeconds).fill(1 / 120),
    irregular: Array.from({ length: 375 }, () => [1 / 120, 1 / 40, 1 / 30]).flat()
  };
  for (const [name, dts] of Object.entries(cadences)) {
    const engine = makeEngine();
    engine._setSeed(seed);
    engine.selectShip(0);
    assert.equal(engine.orderSelectedShip(MISSION_NUMBERS.stabiaeX), true);
    let loaded = false;
    let offloaded = false;
    let maxCargo = 0;
    for (const dt of dts) {
      engine.update(dt);
      const ship = engine.fleet[0];
      loaded ||= ship.state === 'rescuing';
      offloaded ||= ship.state === 'offloading';
      maxCargo = Math.max(maxCargo, ship.cargo);
    }
    assert.ok(loaded && offloaded, `${name}: loading and offloading states observed`);
    assert.equal(maxCargo, MISSION_NUMBERS.shipCapacity, `${name}: ship reached capacity`);
    assert.ok(engine.mission.rescued > 0, `${name}: citizens offloaded`);
    states[name] = replayState(engine);
    assert.equal(states[name].steps, targetSteps, `${name}: 1500 steps`);
    assert.equal(states[name].phase, PHASE.ULTRA_PLINIAN, `${name}: crossed t=24 phase boundary`);
    engine.destroy();
  }
  for (const name of ['30Hz', '120Hz', 'irregular']) {
    assert.deepEqual(states[name], states['60Hz'], `${name}: phase, world, fleet, resources match 60 Hz`);
  }
});

// ===========================================================================
section('VESUVIUS TIMING — step counter and time contract');
// ===========================================================================

test('time advances only inside fixed steps, not from outer dt', () => {
  const engine = makeSandboxFixture();
  engine.update(1 / 60);
  const expectedTime = SIM_FIXED_DT;
  assert.ok(Math.abs(engine.time - expectedTime) < 1e-12,
    `Time should be exactly SIM_FIXED_DT (${engine.time} vs ${expectedTime})`);

  engine.update(1 / 120); // No step (accumulator < threshold)
  assert.ok(Math.abs(engine.time - expectedTime) < 1e-12,
    'Time unchanged when no step executed');

  engine.update(1 / 120); // Now completes another step
  assert.equal(engine.simStepCount, 2);
  assert.ok(Math.abs(engine.time - 2 * SIM_FIXED_DT) < 1e-12,
    'Time is exactly 2 × SIM_FIXED_DT');
});

test('fractional remainder is retained, not discarded', () => {
  const engine = makeSandboxFixture();
  engine.update(1 / 60 + 0.001); // One step + 1ms remainder
  assert.equal(engine.simStepCount, 1);
  assert.ok(engine.simAccumulator > 0, 'Fractional remainder retained');
  assert.ok(engine.simAccumulator < SIM_FIXED_DT, 'Remainder is less than one step');
});

// ===========================================================================
// Summary
// ===========================================================================
console.log('\nVESUVIUS TIMING — all tests passed ✓');
