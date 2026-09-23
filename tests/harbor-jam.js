import assert from 'node:assert/strict';
import { LEVELS, makeHarborState, moveHarbor, harborWon, solveHarbor } from '../src/demos/harbor_jam/logic.js';

assert.equal(LEVELS.length, 12);
for (const [index, level] of LEVELS.entries()) {
  let state = makeHarborState(level);
  assert.equal(harborWon(state, level), false, `jam ${index + 1} starts blocked`);
  const solution = solveHarbor(state, level);
  assert.ok(solution?.length, `jam ${index + 1} has a slide solution`);
  for (const [boat, offset] of solution) state = moveHarbor(state, level, boat, offset);
  assert.equal(harborWon(state, level), true);
}
const first = LEVELS[0];
const start = makeHarborState(first);
assert.equal(moveHarbor(start, first, 0, 3), start, 'the courier cannot pass through another boat');
console.log('Harbor Jam: 12 solvable jams and collision rules pass');
