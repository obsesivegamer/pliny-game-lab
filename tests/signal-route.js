import assert from 'node:assert/strict';
import { LEVELS, makeRouteState, cycleArrow, traceCourier, solutionArrows } from '../src/demos/signal_route/logic.js';

assert.equal(LEVELS.length, 12);
for (const [index, level] of LEVELS.entries()) {
  let state = makeRouteState(level);
  assert.equal(traceCourier(level, state).hit, false, `route ${index + 1} needs directions`);
  for (const [cell, direction] of Object.entries(solutionArrows(level))) {
    const [x, y] = cell.split(',').map(Number);
    for (let turns = 0; turns < 5 && state.arrows[cell] !== direction; turns++) {
      state = cycleArrow(state, level, x, y);
    }
    assert.equal(state.arrows[cell], direction);
  }
  assert.equal(traceCourier(level, state).hit, true, `route ${index + 1} collects every scroll`);
}
console.log('Signal Route: 12 playable arrow solutions and scroll collection pass');
