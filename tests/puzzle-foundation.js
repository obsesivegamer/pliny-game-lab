import assert from 'node:assert/strict';
import { boardRect, cellAt, getProgress, setProgress, paintBoard } from '../src/core/puzzle.js';

const rect = boardRect(900, 600, 5, 5);
assert.ok(rect.x + rect.width < 560, 'the board leaves the desktop controls unobscured');
const compactDesktop = boardRect(800, 600, 4, 4);
assert.ok(compactDesktop.x + compactDesktop.width < 460, 'the board stays clear of the floating panel at 800px');
const phoneLandscape = boardRect(740, 300, 6, 6);
assert.ok(phoneLandscape.cell >= 24 && phoneLandscape.x + phoneLandscape.width < 470,
  'a landscape phone board fits beside the controls');
assert.deepEqual(cellAt(rect, rect.x + rect.cell * 2.5, rect.y + rect.cell * 3.5), [2, 3]);
assert.equal(cellAt(rect, rect.x - 2, rect.y), null);

const phone = boardRect(390, 300, 6, 6);
assert.ok(phone.x >= 0 && phone.y >= 0, 'a phone board stays in the visible canvas');
assert.ok(phone.width <= 390 && phone.height <= 300);

assert.equal(getProgress('missing', 12), 0);
setProgress('example', 3);
assert.equal(getProgress('example', 12), 3);

const calls = [];
const ctx = new Proxy({}, { get(target, key) { return target[key] ?? ((...args) => calls.push([key, ...args])); } });
paintBoard(ctx, 900, 600, 1, 'A board', 'Level 1', rect);
assert.ok(calls.some(call => call[0] === 'fillRect'), 'painting a board draws a background');

console.log('Puzzle foundation: responsive geometry, progress fallback, and drawing pass');
