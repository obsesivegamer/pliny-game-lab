import assert from 'node:assert/strict';
import { OracleWordsEngine } from '../src/demos/oracle_words/oracle_words.js';

class Canvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.style = {};
    this.listeners = new Map();
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
}

const ctx = new Proxy({}, {
  get(target, property) { return target[property] ?? (() => {}); },
  set(target, property, value) { target[property] = value; return true; }
});
const canvas = new Canvas();
const engine = new OracleWordsEngine(canvas, ctx, null);
engine.resize(800, 600, 1);
for (const letter of 'WATER') engine.onKeyDown(letter, { preventDefault() {} });
engine.onKeyDown('Enter', { preventDefault() {} });
assert.equal(engine.round.status, 'won', 'the first game can be completed with physical keys');
engine.render(ctx);
assert.ok(engine.getEntityCount() > 0, 'the board contributes a meaningful entity count');
engine.destroy();
assert.equal(canvas.listeners.get('touchstart')?.size || 0, 0, 'switching games releases touch listeners');

console.log('Oracle Words engine: playable, rendered, and cleaned up');
