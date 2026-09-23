import assert from 'node:assert/strict';
import { LEVELS, makeMirrorState, rotateMirror, traceBeam } from '../src/demos/mirror_harbor/logic.js';

assert.equal(LEVELS.length, 12);
for (const [index, level] of LEVELS.entries()) {
  let state = makeMirrorState(level);
  assert.equal(traceBeam(level, state).hit, false, `level ${index + 1} starts unlit`);
  for (const mirrorIndex of level.flipped) state = rotateMirror(state, mirrorIndex);
  assert.equal(traceBeam(level, state).hit, true, `level ${index + 1} has a clear light route`);
}
assert.equal(rotateMirror(['/'], 0)[0], '\\');
console.log('Mirror Harbor: 12 dark starts, working routes, and rotation pass');
