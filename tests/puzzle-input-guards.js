import assert from 'node:assert/strict';
import { DEMOS } from '../src/core/hub.js';
import { HarborJamEngine } from '../src/demos/harbor_jam/harbor_jam.js';
import { StonefallEngine } from '../src/demos/stonefall/stonefall.js';
import { LEVELS, boatCells, moveHarbor, solveHarbor } from '../src/demos/harbor_jam/logic.js';

const makeCanvas = () => ({
  width: 800, height: 600, style: {},
  addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {}
});
const ctx = new Proxy({}, {
  get(target, property) { return target[property] ?? (() => {}); },
  set(target, property, value) { target[property] = value; return true; }
});
function keyEvent(modifiers = {}) {
  const event = { ...modifiers, prevented: false };
  event.preventDefault = () => { event.prevented = true; };
  return event;
}
const snapshot = engine => JSON.stringify([engine.state ?? engine.round, engine.cursor ?? null]);

const puzzleKeys = Object.keys(DEMOS).filter(key => DEMOS[key].pavilionId === 'puzzle');
assert.equal(puzzleKeys.length, 10);
const shortcuts = [
  ['r', { metaKey: true }], ['R', { ctrlKey: true }], ['f', { ctrlKey: true }], ['s', { metaKey: true }],
  ['a', { metaKey: true }], ['d', { metaKey: true }], ['x', { metaKey: true }], ['c', { metaKey: true }],
  ['l', { metaKey: true }], ['w', { altKey: true }], [' ', { ctrlKey: true }], ['ArrowLeft', { metaKey: true }]
];
for (const key of puzzleKeys) {
  const mod = await import(`../src/demos/${key}/${key}.js`);
  const engine = new mod[DEMOS[key].exportName](makeCanvas(), ctx, null);
  engine.resize(800, 600, 1);
  const before = snapshot(engine);
  for (const [shortcut, modifiers] of shortcuts) {
    const event = keyEvent(modifiers);
    engine.onKeyDown(shortcut, event);
    assert.equal(event.prevented, false, `${key} leaves ${JSON.stringify(modifiers)}+${shortcut} to the browser`);
  }
  assert.equal(snapshot(engine), before, `${key} ignores browser shortcuts`);
  engine.destroy();
}

const harbor = new HarborJamEngine(makeCanvas(), ctx, null);
harbor.resize(800, 600, 1);
const press = key => { const event = keyEvent(); harbor.onKeyDown(key, event); return event; };
function moveCursorTo([x, y]) {
  assert.equal(harbor.state.selected, null, 'the cursor roams only while no boat is held');
  if (!harbor.cursor) press('ArrowRight');
  while (harbor.cursor[0] < x) press('ArrowRight');
  while (harbor.cursor[0] > x) press('ArrowLeft');
  while (harbor.cursor[1] < y) press('ArrowDown');
  while (harbor.cursor[1] > y) press('ArrowUp');
}
for (const [levelIndex, level] of LEVELS.entries()) {
  for (let from = 0; from < level.vehicles.length; from++) {
    for (let to = 0; to < level.vehicles.length; to++) {
      if (from === to) continue;
      harbor.loadLevel(levelIndex);
      moveCursorTo(boatCells(level, harbor.state, from)[0]);
      press('Enter');
      assert.equal(harbor.state.selected, from);
      assert.equal(press('Escape').prevented, true, 'Esc lets go of a boat instead of leaving the game');
      moveCursorTo(boatCells(level, harbor.state, to)[0]);
      press('Enter');
      assert.equal(harbor.state.selected, to, `jam ${levelIndex + 1}: keyboard reaches boat ${to} after holding ${from}`);
    }
  }
}

harbor.loadLevel(0);
moveCursorTo(boatCells(LEVELS[0], harbor.state, 0)[0]);
press('Enter');
press('ArrowRight');
assert.equal(harbor.state.positions[0], LEVELS[0].vehicles[0].pos + 1, 'arrows slide the held boat');
assert.deepEqual(boatCells(LEVELS[0], harbor.state, 0)[0], harbor.cursor, 'the cursor rides along with the boat');
press('Enter');
assert.equal(harbor.state.selected, null, 'Enter on the held boat lets go');
assert.equal(press('Escape').prevented, false, 'Esc with nothing held still leaves the game');
const buttonEnter = keyEvent({ target: { tagName: 'BUTTON' } });
harbor.onKeyDown('Enter', buttonEnter);
assert.equal(buttonEnter.prevented, false, 'Enter on a focused panel button belongs to the button');
assert.equal(harbor.state.selected, null);

harbor.loadLevel(0);
moveCursorTo(boatCells(LEVELS[0], harbor.state, 0)[0]);
press('Enter');
for (const [boat, offset] of solveHarbor(harbor.state, LEVELS[0])) {
  harbor.commit(moveHarbor(harbor.state, LEVELS[0], boat, offset));
}
assert.equal(harbor.state.selected, 0, 'the courier is still held when the jam is solved');
const solvedMessage = harbor.message;
assert.match(solvedMessage, /solved|finished/i);
harbor.hint();
assert.equal(harbor.message, solvedMessage, 'Hint after solving keeps the solved message');
assert.equal(press('Escape').prevented, false, 'Esc still leaves a solved jam while a boat is held');
harbor.destroy();

for (const key of puzzleKeys) {
  const mod = await import(`../src/demos/${key}/${key}.js`);
  const engine = new mod[DEMOS[key].exportName](makeCanvas(), ctx, null);
  if (!engine.spec) { engine.destroy(); continue; }
  const won = engine.spec.won;
  engine.spec.won = () => true;
  engine.message = 'Solved! The next puzzle is ready.';
  engine.hint();
  assert.equal(engine.message, 'Solved! The next puzzle is ready.', `${key} gives no hint once solved`);
  engine.spec.won = won;
  engine.destroy();
}

const stone = new StonefallEngine(makeCanvas(), ctx, null);
stone.resize(800, 600, 1);
stone.setPaused(true);
const paused = JSON.stringify(stone.state);
for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'x']) stone.onKeyDown(key, keyEvent());
for (const action of ['left', 'right', 'rotate', 'down', 'drop']) stone.apply(action);
stone.onMouseDown({ rawX: 200, rawY: 300 });
assert.equal(JSON.stringify(stone.state), paused, 'a paused Stonefall ignores every move');
stone.setPaused(false);
stone.onKeyDown(' ', keyEvent());
assert.notEqual(JSON.stringify(stone.state), paused, 'moves resume after unpausing');
stone.destroy();

console.log('Puzzle input guards: shortcuts, Harbor Jam keyboard, solved hints, and Stonefall pause pass');
