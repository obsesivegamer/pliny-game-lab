import assert from 'node:assert/strict';
import { boardRect, cellAt, getProgress, setProgress, paintBoard, panelReserve } from '../src/core/puzzle.js';

const canvasAt = box => ({ getBoundingClientRect: () => box });
const panelAt = box => ({ closest: () => ({ getBoundingClientRect: () => box }) });
const desktop = { left: 0, right: 1280, top: 54, bottom: 900 };
assert.equal(panelReserve(canvasAt(desktop), panelAt({ left: 940, right: 1260, top: 74, bottom: 600, width: 320 })), 350,
  'the floating desktop panel keeps its 350px reserve');
assert.equal(panelReserve(canvasAt(desktop), panelAt({ left: 1280, right: 1600, top: 74, bottom: 600, width: 320 })), 0,
  'a collapsed desktop panel gives its width back to the board');
const landscape = { left: 0, right: 640, top: 60, bottom: 360 };
assert.equal(panelReserve(canvasAt(landscape), panelAt({ left: 372, right: 632, top: 68, bottom: 340, width: 260 })), 278,
  'a 640px landscape phone reserves the floating panel it actually has');
assert.equal(panelReserve(canvasAt({ left: 0, right: 390, top: 54, bottom: 490 }),
  panelAt({ left: 0, right: 390, top: 490, bottom: 844, width: 390 })), 0, 'a sheet below the canvas reserves nothing');
assert.equal(panelReserve(canvasAt(desktop), null), 0, 'headless engines without a panel reserve nothing');

const rect = boardRect(900, 600, 5, 5, { reserve: 350 });
assert.ok(rect.x + rect.width < 550, 'the board leaves the desktop controls unobscured');
assert.equal(rect.reserved, 350);
const phoneLandscape = boardRect(640, 300, 6, 6, { reserve: 278 });
assert.ok(phoneLandscape.cell >= 24 && phoneLandscape.x + phoneLandscape.width <= 640 - 278,
  'a landscape phone board fits beside the controls');
const open = boardRect(1280, 800, 5, 5);
assert.ok(Math.abs(open.x + open.width / 2 - 640) < 1, 'with no panel over the canvas the board is centred');
assert.deepEqual(cellAt(rect, rect.x + rect.cell * 2.5, rect.y + rect.cell * 3.5), [2, 3]);
assert.equal(cellAt(rect, rect.x - 2, rect.y), null);

const phone = boardRect(390, 300, 6, 6);
assert.ok(phone.x >= 0 && phone.y >= 0, 'a phone board stays in the visible canvas');
assert.ok(phone.width <= 390 && phone.height <= 300);

assert.equal(getProgress('missing', 12), 0);
setProgress('example', 3);
assert.equal(getProgress('example', 12), 3);
globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('Storage full'); } };
setProgress('write-failed', 4);
assert.equal(getProgress('write-failed', 12), 4, 'progress survives a denied storage write for this session');
delete globalThis.localStorage;

const calls = [];
const ctx = new Proxy({}, { get(target, key) { return target[key] ?? ((...args) => calls.push([key, ...args])); } });
paintBoard(ctx, 900, 600, 1, 'A board', 'Level 1', rect);
assert.ok(calls.some(call => call[0] === 'fillRect'), 'painting a board draws a background');

console.log('Puzzle foundation: responsive geometry, progress fallback, and drawing pass');
