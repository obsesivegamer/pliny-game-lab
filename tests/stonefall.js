import assert from 'node:assert/strict';
import { createStoneState, moveStone, rotateStone, hardDropStone, shapeCells } from '../src/demos/stonefall/logic.js';

const start = createStoneState(1);
assert.equal(start.grid.length, 8 * 12);
assert.equal(shapeCells('I', 0).length, 3);
assert.equal(moveStone(start, -50, 0), start, 'stones cannot leave the left wall');
assert.notEqual(rotateStone(start), start, 'the first bar can rotate');

const grid = Array(8 * 12).fill(0);
for (let x = 0; x < 5; x++) grid[11 * 8 + x] = 1;
const ready = { ...start, grid, active: { type: 'I', x: 5, y: 0, rotation: 0 } };
const dropped = hardDropStone(ready);
assert.equal(dropped.lines, 1, 'filling a row clears it');
assert.equal(dropped.score, 100);
assert.equal(dropped.grid.slice(11 * 8).filter(Boolean).length, 0);

let sequenceState = start;
const pieces = [];
for (let turn = 0; turn < 12; turn++) {
  pieces.push(sequenceState.active.type);
  sequenceState = hardDropStone({ ...sequenceState, grid: Array(8 * 12).fill(0) });
}
assert.ok(pieces.some((piece, index) => index > 0 && piece === pieces[index - 1]),
  'the stone sequence should not be forced to alternate');
assert.ok(pieces.some((piece, index) => index > 0 && piece !== pieces[index - 1]),
  'the stone sequence should still include both shapes');
console.log('Stonefall: collision, rotation, hard drop, and row clears pass');
