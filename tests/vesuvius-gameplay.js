// Focused smoke for Vesuvius "Evacuate Stabiae" gameplay.
// Pure mission reducer first, then a headless engine integration pass.
import assert from 'node:assert/strict';
import {
  MODE,
  STATUS,
  LOSE_REASON,
  TOOL,
  OBJECTIVE,
  MISSION_NUMBERS,
  PHASE_SCHEDULE,
  createMission,
  scheduledPhase,
  tryVent,
  trySpendBarrier,
  applyWorldHazards,
  resolveMission,
  threatMeter
} from '../src/demos/vesuvius/mission.js';

function test(name, fn) {
  fn();
  console.log(`  ✓ ${name}`);
}

console.log('VESUVIUS GAMEPLAY — mission reducer\n');

test('default mission is gameplay with an explicit Stabiae objective', () => {
  const m = createMission();
  assert.equal(m.mode, MODE.GAMEPLAY);
  assert.equal(m.status, STATUS.PLAYING);
  assert.equal(m.tool, TOOL.ORDER);
  assert.equal(m.rescued, 0);
  assert.equal(m.civiliansAtStabiae, MISSION_NUMBERS.startingCivilians);
  assert.equal(m.quota, MISSION_NUMBERS.rescueQuota);
  assert.equal(typeof m.objective, 'string');
  assert.match(m.objective, /Stabiae/);
  assert.equal(m.objective, OBJECTIVE);
});

test('sandbox missions do not start in order-ship tool', () => {
  const m = createMission(MODE.SANDBOX);
  assert.equal(m.mode, MODE.SANDBOX);
  assert.equal(m.tool, TOOL.PAINT);
});

test('phase schedule advances, and venting delays collapse', () => {
  const pdcAt = PHASE_SCHEDULE.find((s) => s.phase === 5).at;
  assert.equal(scheduledPhase(pdcAt, 0), 5);
  assert.ok(scheduledPhase(pdcAt - 0.01, 0) < 5);
  assert.ok(scheduledPhase(pdcAt, MISSION_NUMBERS.ventDelaySec) < 5);
  assert.equal(scheduledPhase(pdcAt + MISSION_NUMBERS.ventDelaySec, MISSION_NUMBERS.ventDelaySec), 5);
});

test('controlled vent spends a charge and adds delay; empty magazine fails', () => {
  const m = createMission();
  const first = tryVent(m);
  assert.equal(first.ok, true);
  assert.equal(m.ventCharges, MISSION_NUMBERS.ventCharges - 1);
  assert.equal(m.ventDelay, MISSION_NUMBERS.ventDelaySec);
  assert.equal(first.bleed, MISSION_NUMBERS.ventPressureBleed);
  m.ventCharges = 0;
  const dry = tryVent(m);
  assert.equal(dry.ok, false);
  assert.equal(m.ventDelay, MISSION_NUMBERS.ventDelaySec);
});

test('venting is ignored after the mission is decided', () => {
  const m = createMission();
  m.status = STATUS.WON;
  assert.equal(tryVent(m).ok, false);
});

test('barrier spend decrements charges and refuses when empty', () => {
  const m = createMission();
  assert.equal(trySpendBarrier(m).ok, true);
  assert.equal(m.barrierCharges, MISSION_NUMBERS.barrierCharges - 1);
  m.barrierCharges = 0;
  assert.equal(trySpendBarrier(m).ok, false);
});

test('PDCs near Stabiae kill civilians; PDCs near ships damage hulls', () => {
  const m = createMission();
  const ships = [{ x: MISSION_NUMBERS.stabiaeX, y: 149, health: 100, alive: true, cargo: 0 }];
  const pdcs = [{ x: MISSION_NUMBERS.stabiaeX, y: 140, alive: true }];
  applyWorldHazards(m, { pdcs, ships, phase: 5 }, 1);
  assert.ok(m.civiliansAtStabiae < MISSION_NUMBERS.startingCivilians);
  assert.ok(ships[0].health < 100);
});

test('win when rescued quota is met before catastrophe', () => {
  const m = createMission();
  m.rescued = MISSION_NUMBERS.rescueQuota;
  resolveMission(m, { ships: [{ alive: true, health: 40 }], phase: 4 });
  assert.equal(m.status, STATUS.WON);
  assert.equal(m.loseReason, null);
});

test('lose when the fleet is destroyed before the quota', () => {
  const m = createMission();
  resolveMission(m, {
    ships: [
      { alive: false, health: 0 },
      { alive: false, health: 0 }
    ],
    phase: 3
  });
  assert.equal(m.status, STATUS.LOST);
  assert.equal(m.loseReason, LOSE_REASON.FLEET);
});

test('lose when Stabiae is emptied before the quota', () => {
  const m = createMission();
  m.civiliansAtStabiae = 0;
  resolveMission(m, { ships: [{ alive: true, health: 80, cargo: 0 }], phase: 5 });
  assert.equal(m.status, STATUS.LOST);
  assert.equal(m.loseReason, LOSE_REASON.TOWN);
});

test('citizens already aboard still count — town is not lost until they sink or fail to offload', () => {
  const m = createMission();
  m.civiliansAtStabiae = 0;
  resolveMission(m, { ships: [{ alive: true, health: 80, cargo: 40 }], phase: 5 });
  assert.equal(m.status, STATUS.PLAYING);
});

test('lose on caldera if the quota is still unmet', () => {
  const m = createMission();
  m.rescued = MISSION_NUMBERS.rescueQuota - 1;
  resolveMission(m, { ships: [{ alive: true, health: 80 }], phase: 6 });
  assert.equal(m.status, STATUS.LOST);
  assert.equal(m.loseReason, LOSE_REASON.CALDERA);
});

test('sandbox never resolves a win or loss', () => {
  const m = createMission(MODE.SANDBOX);
  m.rescued = MISSION_NUMBERS.rescueQuota;
  m.civiliansAtStabiae = 0;
  resolveMission(m, { ships: [], phase: 6 });
  assert.equal(m.status, STATUS.PLAYING);
});

test('resolved missions stay resolved (no flip from win to lose)', () => {
  const m = createMission();
  m.rescued = MISSION_NUMBERS.rescueQuota;
  resolveMission(m, { ships: [{ alive: true, health: 10 }], phase: 4 });
  assert.equal(m.status, STATUS.WON);
  m.civiliansAtStabiae = 0;
  resolveMission(m, { ships: [], phase: 6 });
  assert.equal(m.status, STATUS.WON);
});

test('threat meter is a finite 0..1 value that rises with phase', () => {
  const m = createMission();
  const low = threatMeter(m, 0, false);
  const high = threatMeter(m, 5, true);
  assert.ok(low >= 0 && low <= 1);
  assert.ok(high >= 0 && high <= 1);
  assert.ok(high > low);
  assert.equal(Number.isFinite(high), true);
});

console.log('\nVESUVIUS GAMEPLAY — engine integration\n');

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

const { VesuviusEngine, ELEMENT, PHASE } = await import('../src/demos/vesuvius/vesuvius.js');

function makeEngine() {
  const canvas = new MockCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  const engine = new VesuviusEngine(canvas, ctx, new MockElement());
  engine.resize(800, 600, 1);
  return { canvas, ctx, engine };
}

test('opening Vesuvius launches gameplay mode with objective text', () => {
  const { engine, ctx } = makeEngine();
  assert.equal(engine.mission.mode, MODE.GAMEPLAY);
  assert.equal(engine.mission.status, STATUS.PLAYING);
  assert.match(engine.mission.objective, /Stabiae/);
  engine.render(ctx);
  const hud = ctx.texts.join(' | ');
  assert.match(hud, /Stabiae|RESCUE|EVACUATE|quota|citizens/i);
  engine.destroy();
});

test('galleys start idle in gameplay until the player orders them', () => {
  const { engine } = makeEngine();
  assert.ok(engine.fleet.length >= 3);
  for (const g of engine.fleet) {
    assert.equal(g.state, 'idle');
    assert.equal(g.alive, true);
  }
  engine.destroy();
});

test('click a galley then click Stabiae issues a sailing order', () => {
  const { engine } = makeEngine();
  const ship = engine.fleet[0];
  const toCanvas = (sx, sy) => ({
    x: (sx / engine.simWidth) * 800,
    y: (sy / engine.simHeight) * 600
  });
  engine.onMouseDown(toCanvas(ship.x, ship.y));
  engine.onMouseUp(toCanvas(ship.x, ship.y));
  assert.equal(engine.mission.selectedShip, 0);
  engine.onMouseDown(toCanvas(MISSION_NUMBERS.stabiaeX, ship.y));
  engine.onMouseUp(toCanvas(MISSION_NUMBERS.stabiaeX, ship.y));
  assert.ok(Math.abs(ship.orderedX - MISSION_NUMBERS.stabiaeX) < 2);
  assert.ok(ship.state === 'sailing' || ship.state === 'rescuing');
  engine.destroy();
});

test('player can win and lose without painting the CA grid', () => {
  const { engine } = makeEngine();
  engine.mission.rescued = MISSION_NUMBERS.rescueQuota;
  engine.update(0.016);
  assert.equal(engine.mission.status, STATUS.WON);

  engine.reset();
  assert.equal(engine.mission.status, STATUS.PLAYING);
  assert.equal(engine.mission.rescued, 0);

  for (const g of engine.fleet) {
    g.health = 0;
    g.alive = false;
  }
  engine.update(0.016);
  assert.equal(engine.mission.status, STATUS.LOST);
  assert.equal(engine.mission.loseReason, LOSE_REASON.FLEET);
  engine.destroy();
});

test('V vents the chamber; B arms the berm tool; R restarts', () => {
  const { engine } = makeEngine();
  const pressure = engine.chamberPressure;
  engine.onKeyDown('v');
  assert.equal(engine.mission.ventCharges, MISSION_NUMBERS.ventCharges - 1);
  assert.ok(engine.chamberPressure < pressure);
  engine.onKeyDown('b');
  assert.equal(engine.mission.tool, TOOL.BARRIER);
  engine.mission.status = STATUS.WON;
  engine.onKeyDown('r');
  assert.equal(engine.mission.status, STATUS.PLAYING);
  assert.equal(engine.currentPhase, PHASE.DORMANT);
  engine.destroy();
});

test('placing a berm spends a charge and marks barrier cells', () => {
  const { engine } = makeEngine();
  engine.mission.tool = TOOL.BARRIER;
  const gx = 200;
  const gy = engine.elevationMap[gx] - 2;
  const ok = engine.placeBarrier(gx, gy);
  assert.equal(ok, true);
  assert.equal(engine.mission.barrierCharges, MISSION_NUMBERS.barrierCharges - 1);
  assert.ok(engine.barrierMask[gx] > 0);
  engine.destroy();
});

test('empty-canvas clicks still paint so the touch harness keeps working', () => {
  const { engine } = makeEngine();
  engine.selectedElement = ELEMENT.WATER;
  engine.onMouseDown({ x: 80, y: 40 });
  const gx = Math.floor((80 / 800) * engine.simWidth);
  const gy = Math.floor((40 / 600) * engine.simHeight);
  assert.equal(engine.grid[gy * engine.simWidth + gx], ELEMENT.WATER);
  assert.equal(engine.isDrawing, true);
  engine.onMouseUp();
  engine.destroy();
});

test('restart overlay path returns a playable fleet', () => {
  const { engine } = makeEngine();
  engine.mission.status = STATUS.LOST;
  engine.mission.loseReason = LOSE_REASON.TOWN;
  engine.reset();
  assert.equal(engine.mission.status, STATUS.PLAYING);
  assert.ok(engine.fleet.every((g) => g.alive && g.health === 100));
  assert.equal(engine.pdcs.length, 0);
  engine.destroy();
});

test('a commanded fleet can meet the quota before caldera (winnable loop)', () => {
  const { engine } = makeEngine();
  const toCanvas = (sx, sy) => ({
    x: (sx / engine.simWidth) * 800,
    y: (sy / engine.simHeight) * 600
  });
  for (let i = 0; i < engine.fleet.length; i++) {
    const ship = engine.fleet[i];
    engine.onMouseDown(toCanvas(ship.x, ship.y));
    engine.onMouseUp(toCanvas(ship.x, ship.y));
    engine.onMouseDown(toCanvas(MISSION_NUMBERS.stabiaeX, ship.y));
    engine.onMouseUp(toCanvas(MISSION_NUMBERS.stabiaeX, ship.y));
  }

  let frames = 0;
  const limit = Math.ceil(70 / 0.05);
  while (engine.mission.status === STATUS.PLAYING && frames < limit) {
    const threat = engine.currentPhase >= 4 && engine.mission.ventCharges > 0;
    if (threat) engine.ventChamber();
    for (const ship of engine.fleet) {
      if (!ship.alive) continue;
      if (ship.cargo > 1 && engine.currentPhase >= 5) {
        ship.orderedX = MISSION_NUMBERS.offloadX;
      }
    }
    engine.update(0.05);
    frames++;
  }
  assert.equal(engine.mission.status, STATUS.WON, `expected win after commanded play, got ${engine.mission.status}/${engine.mission.loseReason} rescued=${engine.mission.rescued.toFixed(1)} t=${engine.mission.time.toFixed(1)}`);
  engine.destroy();
});

test('doing nothing loses the bay before the quota', () => {
  const { engine } = makeEngine();
  let frames = 0;
  const limit = Math.ceil(90 / 0.05);
  while (engine.mission.status === STATUS.PLAYING && frames < limit) {
    engine.update(0.05);
    frames++;
  }
  assert.equal(engine.mission.status, STATUS.LOST);
  assert.ok(
    engine.mission.loseReason === LOSE_REASON.TOWN || engine.mission.loseReason === LOSE_REASON.CALDERA,
    `idle lose reason ${engine.mission.loseReason}`
  );
  assert.ok(engine.mission.rescued < engine.mission.quota);
  engine.destroy();
});

test('sandbox catastrophe buttons cannot skip the mission clock', () => {
  const { engine } = makeEngine();
  assert.equal(engine.requestManualPhase(PHASE.CALDERA_COLLAPSE), false);
  assert.equal(engine.currentPhase, PHASE.DORMANT);
  assert.equal(engine.mission.status, STATUS.PLAYING);
  engine.setPlayMode(MODE.SANDBOX);
  assert.equal(engine.requestManualPhase(PHASE.CALDERA_COLLAPSE), true);
  assert.equal(engine.currentPhase, PHASE.CALDERA_COLLAPSE);
  engine.destroy();
});

test('any canvas click after victory restarts the mission', () => {
  const { engine } = makeEngine();
  engine.mission.rescued = MISSION_NUMBERS.rescueQuota;
  engine.update(0.016);
  assert.equal(engine.mission.status, STATUS.WON);
  engine.onMouseDown({ x: 12, y: 12 });
  assert.equal(engine.mission.status, STATUS.PLAYING);
  assert.equal(engine.mission.rescued, 0);
  engine.destroy();
});

console.log('\nVESUVIUS GAMEPLAY — all checks passed');
