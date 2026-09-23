import assert from 'node:assert/strict';
import { LEVELS, makeForgeState, combineForge, forgeWon, solveForge } from '../src/demos/number_forge/logic.js';

assert.equal(LEVELS.length, 12);
for (const [index, level] of LEVELS.entries()) {
  let state = makeForgeState(level);
  const solution = solveForge(state, level);
  assert.equal(solution?.length, 2, `forge ${index + 1} uses both operations`);
  for (const move of solution) state = combineForge(state, move.first, move.second, move.operation);
  assert.equal(forgeWon(state, level), true);
}
const start = makeForgeState(LEVELS[0]);
assert.equal(combineForge(start, 0, 1, '/'), start, 'fractional division is rejected');
console.log('Number Forge: 12 two-step targets and exact arithmetic pass');
