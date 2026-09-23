import assert from 'node:assert/strict';
import { LEVELS, cluesFor, countMosaicSolutions, markMosaic, mosaicWon } from '../src/demos/mosaic_clues/logic.js';

assert.equal(LEVELS.length, 12);
for (const [index, level] of LEVELS.entries()) {
  assert.equal(countMosaicSolutions(level), 1, `mosaic ${index + 1} has one logical answer`);
  let state = Array(level.size ** 2).fill(0);
  level.rows.forEach((row, y) => [...row].forEach((bit, x) => {
    if (bit === '1') state = markMosaic(state, level.size, x, y);
  }));
  assert.equal(mosaicWon(state, level), true);
}
assert.deepEqual(cluesFor('11011'), [2, 2]);
console.log('Mosaic Clues: 12 unique pictures, run clues, and marking pass');
