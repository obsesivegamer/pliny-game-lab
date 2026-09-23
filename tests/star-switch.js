import assert from 'node:assert/strict';
import { LEVELS, toggleStars, solveStars, makeStarState } from '../src/demos/star_switch/logic.js';

assert.equal(LEVELS.length, 12);
for (const level of LEVELS) {
  let board = makeStarState(level);
  assert.ok(board.some(Boolean), 'each sky starts unsolved');
  const answer = solveStars(board, level.size);
  assert.ok(answer.length > 0, 'a hint sequence exists');
  for (const [x, y] of answer) board = toggleStars(board, level.size, x, y);
  assert.ok(board.every(value => value === 0), 'the solution clears the sky');
}
assert.deepEqual(toggleStars(Array(9).fill(0), 3, 1, 1), [0,1,0,1,1,1,0,1,0]);
console.log('Star Switch: 12 solvable skies and neighbor toggles pass');
