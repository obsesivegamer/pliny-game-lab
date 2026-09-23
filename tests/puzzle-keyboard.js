import assert from 'node:assert/strict';
import { StarSwitchEngine } from '../src/demos/star_switch/star_switch.js';

const canvas = {
  width: 800, height: 600, style: {}, listeners: new Map(),
  addEventListener(type, handler) { this.listeners.set(type, handler); },
  removeEventListener(type) { this.listeners.delete(type); }
};
const engine = new StarSwitchEngine(canvas, {}, null);
const before = [...engine.state];
engine.onKeyDown('ArrowRight', { preventDefault() {} });
assert.deepEqual(engine.cursor, [1, 0], 'arrow keys move a visible grid cursor');
engine.onKeyDown('Enter', { preventDefault() {} });
assert.notDeepEqual(engine.state, before, 'Enter activates the focused tile');
engine.destroy();
console.log('Puzzle keyboard: arrow focus and Enter activation pass');
