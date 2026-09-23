import assert from 'node:assert/strict';
import { LEVELS, initialLanternState, moveLantern, lanternWon, solveLantern } from '../src/demos/lantern_push/logic.js';

assert.equal(LEVELS.length, 12);
for (const [index, level] of LEVELS.entries()) {
  let state = initialLanternState(level);
  const solution = solveLantern(state, level);
  assert.ok(solution?.length, `level ${index + 1} can be solved`);
  for (const direction of solution) state = moveLantern(state, level, direction);
  assert.equal(lanternWon(state, level), true);
}
const first = LEVELS[0];
const start = initialLanternState(first);
assert.equal(moveLantern(start, first, 'Left'), start, 'walls prevent walking outside the room');
console.log('Lantern Push: 12 solvable levels and blocked movement pass');
