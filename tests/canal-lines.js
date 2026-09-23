import assert from 'node:assert/strict';
import { LEVELS, makeCanalState, extendCanal, canalWon } from '../src/demos/canal_lines/logic.js';

assert.equal(LEVELS.length, 12);
for (const level of LEVELS) {
  let state = makeCanalState(level);
  for (const [x, y] of level.solution.slice(1)) state = extendCanal(state, level, x, y);
  assert.equal(canalWon(state, level), true, 'each authored route waters every field and reaches the sea');
  assert.equal(new Set(state.path.map(point => point.join(','))).size, state.path.length);
}
const level = LEVELS[0];
let state = makeCanalState(level);
const blocked = extendCanal(state, level, 3, 3);
assert.equal(blocked, state, 'a jump across the board is rejected');
state = extendCanal(state, level, ...level.solution[1]);
state = extendCanal(state, level, ...level.solution[0]);
assert.equal(state.path.length, 1, 'backtracking one step is easy');
console.log('Canal Lines: 12 authored paths, field coverage, and backtracking pass');
