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
  READABILITY,
  createMission,
  scheduledPhase,
  tryVent,
  trySpendBarrier,
  applyWorldHazards,
  resolveMission,
  threatMeter,
  galleyDrawScale,
  missionWorldView,
  missionQuota,
  missionCoachCopy
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

test('meeting mission.quota resolves WON', () => {
  const m = createMission();
  assert.equal(m.quota, 80);
  m.rescued = m.quota;
  resolveMission(m, { ships: [{ alive: true, health: 80, cargo: 0 }], phase: 4 });
  assert.equal(m.status, STATUS.WON);
  assert.equal(m.quota, missionQuota());
  assert.equal(m.quota, 80);
  assert.ok(m.rescued >= m.quota);
});

test('displayed quota and win check share missionQuota()', () => {
  assert.equal(missionQuota(), MISSION_NUMBERS.rescueQuota);
  assert.equal(OBJECTIVE.includes(String(missionQuota())), true);
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

const { VesuviusEngine, ELEMENT, PHASE, VolcanicLightning } = await import('../src/demos/vesuvius/vesuvius.js');

function makeEngine() {
  const canvas = new MockCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  const engine = new VesuviusEngine(canvas, ctx, new MockElement());
  engine.resize(800, 600, 1);
  return { canvas, ctx, engine };
}

function clickSim(engine, sx, sy) {
  const p = engine.toCanvas(sx, sy);
  engine.onMouseDown(p);
  engine.onMouseUp(p);
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
  assert.ok(ship.x > engine.waterlineX, `fleet should sit in the bay, got x=${ship.x}`);
  assert.ok(ship.x < engine.simWidth - 8, `fleet should not sit on the far clip edge, got x=${ship.x}`);
  clickSim(engine, ship.x, ship.y);
  assert.equal(engine.mission.selectedShip, 0);
  clickSim(engine, MISSION_NUMBERS.stabiaeX, ship.y);
  assert.ok(Math.abs(ship.orderedX - MISSION_NUMBERS.stabiaeX) < 2);
  assert.ok(ship.state === 'sailing' || ship.state === 'rescuing');
  engine.destroy();
});

test('Stabiae ring still issues an order when a large hull sits nearby', () => {
  const { engine } = makeEngine();
  const ship = engine.fleet[0];
  ship.x = MISSION_NUMBERS.stabiaeX - 10;
  engine.selectShip(0);
  clickSim(engine, MISSION_NUMBERS.stabiaeX, engine.simHeight - 28);
  assert.ok(Math.abs(ship.orderedX - MISSION_NUMBERS.stabiaeX) < 2);
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

test('gameplay clicks do not paint elements, while sandbox mode allows painting', () => {
  const { engine } = makeEngine();
  engine.selectedElement = ELEMENT.WATER;
  const { gx, gy } = engine.toSim({ x: 80, y: 40 });
  const cellIdx = Math.floor(gy) * engine.simWidth + Math.floor(gx);
  const origElem = engine.grid[cellIdx];

  // In gameplay mode: missed clicks should not paint
  engine.onMouseDown({ x: 80, y: 40 });
  assert.equal(engine.grid[cellIdx], origElem, 'gameplay clicks must not paint into the bay');
  assert.equal(engine.isDrawing, false);
  engine.onMouseUp();

  // In sandbox mode: brush painting works
  engine.setPlayMode(MODE.SANDBOX);
  engine.grid.fill(ELEMENT.EMPTY);
  engine.selectedElement = ELEMENT.WATER;
  engine.onMouseDown({ x: 80, y: 40 });
  const sandSim = engine.toSim({ x: 80, y: 40 });
  const sandIdx = Math.floor(sandSim.gy) * engine.simWidth + Math.floor(sandSim.gx);
  assert.equal(engine.grid[sandIdx], ELEMENT.WATER, 'sandbox mode allows painting');
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
  for (let i = 0; i < engine.fleet.length; i++) {
    const ship = engine.fleet[i];
    clickSim(engine, ship.x, ship.y);
    clickSim(engine, MISSION_NUMBERS.stabiaeX, ship.y);
  }

  let frames = 0;
  const limit = Math.ceil(80 / 0.05);
  while (engine.mission.status === STATUS.PLAYING && frames < limit) {
    const threat = engine.currentPhase >= 3 && engine.mission.ventCharges > 0;
    if (threat && frames % 100 === 0) engine.ventChamber();
    for (const ship of engine.fleet) {
      if (!ship.alive) continue;
      if (ship.state === 'idle' && engine.mission.rescued < engine.mission.quota) {
        ship.orderedX = MISSION_NUMBERS.stabiaeX;
      }
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

test('gameplay galleys draw larger than the 48px sprite at canvas scale', () => {
  const play = galleyDrawScale(true);
  const sand = galleyDrawScale(false);
  const view = missionWorldView(MODE.GAMEPLAY, 280, 180);
  const zoom = 280 / view.w;
  assert.ok(play > sand, `gameplay scale ${play} should exceed sandbox ${sand}`);
  assert.ok(play * 48 * zoom > 90, `flagship pixels ${play * 48 * zoom} should beat the unscaled 48px hull`);
});

test('on-canvas coach names the next click: galley, then Stabiae', () => {
  const { engine, ctx } = makeEngine();
  engine.render(ctx);
  const idle = ctx.texts.join(' | ');
  assert.match(idle, /CLICK A GALLEY/i);
  assert.doesNotMatch(idle, /right beach/i);
  assert.ok(idle.includes(missionCoachCopy(false).sub));
  engine.selectShip(0);
  ctx.texts = [];
  engine.render(ctx);
  const next = ctx.texts.join(' | ');
  assert.match(next, /STABIAE/i);
  assert.doesNotMatch(next, /right beach/i);
  assert.match(next, /east gold/i);
  assert.match(next, /west teal/i);
  engine.destroy();
});

test('mission camera frames Stabiae and OFFLOAD as distinct bay targets', () => {
  const { engine } = makeEngine();
  const v = engine.worldView();
  const n = MISSION_NUMBERS;
  assert.ok(v.x > engine.ventX, `camera should pan east of the crater (vent ${engine.ventX}, view.x ${v.x})`);
  assert.ok(n.stabiaeX > v.x && n.stabiaeX < v.x + v.w, 'Stabiae must sit inside the bay crop');
  assert.ok(n.offloadX > v.x && n.offloadX < v.x + v.w, 'offload must sit inside the bay crop');
  const sep = Math.abs(n.stabiaeX - n.offloadX) / v.w;
  assert.ok(sep > 0.35, `Stabiae/offload only ${sep.toFixed(2)} of the crop apart`);
  const stab = engine.toCanvas(n.stabiaeX, engine.simHeight - 28);
  const off = engine.toCanvas(n.offloadX, engine.simHeight - 28);
  assert.ok(off.x / 800 < 0.4, `offload should read west, canvas x=${off.x}`);
  assert.ok(stab.x / 800 > 0.6, `Stabiae should read east, canvas x=${stab.x}`);
  assert.ok(stab.x - off.x > 180, `targets too close on canvas: ${off.x} vs ${stab.x}`);
  const back = engine.toSim(stab);
  assert.ok(Math.abs(back.gx - n.stabiaeX) < 0.6, 'toCanvas/toSim must invert');
  engine.destroy();
});

test('reaching quota resolves WON on engine and renders victory overlay', () => {
  const { engine, ctx } = makeEngine();
  engine.mission.rescued = engine.mission.quota;
  engine.update(0.016);
  assert.equal(engine.mission.status, STATUS.WON);
  assert.equal(engine.mission.quota, missionQuota());
  ctx.texts = [];
  engine.render(ctx);
  assert.match(ctx.texts.join(' | '), /STABIAE SERVED/);
  assert.match(ctx.texts.join(' | '), /Rescued 80 citizens/);
  engine.destroy();
});

test('venting does not rewind eruption phase or re-trigger entry effects', () => {
  const { engine } = makeEngine();
  engine.mission.time = 26;
  engine.update(0.016);
  assert.equal(engine.currentPhase, PHASE.ULTRA_PLINIAN);

  const initialShockwaves = engine.shockwaves.length;
  const vented = engine.ventChamber();
  assert.equal(vented, true);
  assert.equal(engine.mission.ventDelay, MISSION_NUMBERS.ventDelaySec);
  engine.update(0.016);

  assert.ok(engine.currentPhase >= PHASE.ULTRA_PLINIAN, `phase should not rewind, got ${engine.currentPhase}`);
  assert.equal(engine.shockwaves.length, initialShockwaves + 1, 'vent shockwave fired, but phase entry effects did not re-fire');
  engine.destroy();
});

test('volcanic lightning and shockwaves render with finite coordinates (no NaN)', () => {
  const { engine, ctx } = makeEngine();
  engine.triggerShockwave(100, 100, 50);
  assert.ok(engine.shockwaves.length > 0);

  const bolt = new VolcanicLightning(100, 100, 120, 150);
  engine.lightningBolts.push(bolt);

  const calls = [];
  ctx.arc = (x, y, r) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r), `arc coords must be finite, got x=${x}, y=${y}, r=${r}`);
    calls.push({ type: 'arc', x, y, r });
  };
  ctx.moveTo = (x, y) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y), `moveTo coords must be finite, got x=${x}, y=${y}`);
    calls.push({ type: 'moveTo', x, y });
  };
  ctx.lineTo = (x, y) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y), `lineTo coords must be finite, got x=${x}, y=${y}`);
    calls.push({ type: 'lineTo', x, y });
  };

  engine.renderVolcanicLightning(ctx, 800, 600);
  engine.renderShockwaves(ctx, 800, 600);
  assert.ok(calls.length > 0, 'lightning and shockwave path calls should execute');
  engine.destroy();
});

test('sandbox phase buttons can be triggered repeatedly in any order', () => {
  const { engine } = makeEngine();
  engine.setPlayMode(MODE.SANDBOX);

  const initialSurges = engine.pdcs.length;
  engine.requestManualPhase(PHASE.COLUMN_COLLAPSE);
  const surgesAfter1 = engine.pdcs.length;
  assert.ok(surgesAfter1 > initialSurges, 'first column collapse triggers surges');

  engine.requestManualPhase(PHASE.COLUMN_COLLAPSE);
  const surgesAfter2 = engine.pdcs.length;
  assert.ok(surgesAfter2 > surgesAfter1, 'second column collapse also triggers surges (not one-shot)');

  const initialShock = engine.shockwaves.length;
  engine.requestManualPhase(PHASE.ULTRA_PLINIAN);
  assert.ok(engine.shockwaves.length > initialShock, 'ultra-plinian after collapse fires shockwaves');
  engine.destroy();
});

test('right click context menu is disabled in gameplay mode but active in sandbox', () => {
  const { engine } = makeEngine();
  const { gx, gy } = engine.toSim({ x: 100, y: 100 });
  const cellIdx = Math.floor(gy) * engine.simWidth + Math.floor(gx);
  const origElem = engine.grid[cellIdx];
  const initialShocks = engine.shockwaves.length;

  engine.onContextMenu({ x: 100, y: 100 });
  assert.equal(engine.grid[cellIdx], origElem, 'right-click in gameplay mode must not excavate crater');
  assert.equal(engine.shockwaves.length, initialShocks, 'right-click in gameplay mode must not trigger shockwave');

  engine.setPlayMode(MODE.SANDBOX);
  engine.onContextMenu({ x: 100, y: 100 });
  assert.ok(engine.shockwaves.length > initialShocks, 'right-click in sandbox mode triggers shockwave');
  engine.destroy();
});

test('on-canvas HUD displays Evacuate Stabiae title, objective, and progress in gameplay mode', () => {
  const { engine, ctx } = makeEngine();
  ctx.texts = [];
  engine.render(ctx);
  const hud = ctx.texts.join(' | ');
  assert.match(hud, /EVACUATE STABIAE — CLASSIS MISENENSIS/);
  assert.match(hud, /Rescue 80 citizens/);
  assert.match(hud, /RESCUED 0 \/ 80 CITIZENS/);
  engine.destroy();
});

test('mission-mode plume budget stays under the ash-soup baseline', () => {
  const { engine } = makeEngine();
  engine.mission.time = 26;
  engine.setEruptionPhase(PHASE.ULTRA_PLINIAN);
  engine.plumeHeightKm = 32;
  engine.targetPlumeKm = 32;
  for (let i = 0; i < 180; i++) engine.update(0.016);
  const plume = engine.plumeParticles.length;
  const overBay = engine.plumeParticles.filter((p) => p.x > engine.waterlineX - 4 && p.y > engine.simHeight * READABILITY.bayCullYFrac).length;
  const entities = engine.getEntityCount();
  const ca = engine.activeParticles;
  const kinematic = entities - ca;
  console.log(`  ↳ ultra-plinian gameplay: entities=${entities} ca=${ca} plume=${plume} bayAsh=${overBay} kinematic=${kinematic}`);
  assert.ok(plume > 80, `mission still needs an eruptive column, got plume ${plume}`);
  assert.ok(plume <= READABILITY.plumeCap, `plume ${plume} exceeded cap ${READABILITY.plumeCap}`);
  assert.ok(overBay <= 40, `bay ash ${overBay} still burying the fleet`);
  assert.ok(kinematic < 1200, `kinematic entities ${kinematic} should be far below the ~13k ash-soup surplus`);
  engine.destroy();
});

test('sandbox plume is allowed to run richer than the mission budget', () => {
  const { engine } = makeEngine();
  engine.setPlayMode(MODE.SANDBOX);
  engine.setEruptionPhase(PHASE.ULTRA_PLINIAN);
  engine.plumeHeightKm = 32;
  engine.targetPlumeKm = 32;
  for (let i = 0; i < 90; i++) engine.update(0.016);
  const plume = engine.plumeParticles.length;
  const entities = engine.getEntityCount();
  console.log(`  ↳ ultra-plinian sandbox: entities=${entities} ca=${engine.activeParticles} plume=${plume}`);
  assert.ok(
    plume > READABILITY.plumeCap,
    `sandbox plume ${plume} should exceed the mission cap`
  );
  engine.destroy();
});

console.log('\nVESUVIUS GAMEPLAY — all checks passed');
