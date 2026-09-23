import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, makeCanalState, extendCanal, canalWon } from './logic.js';

const has = (points, x, y) => points.some(point => point[0] === x && point[1] === y);
const spec = {
  key: 'canal_lines', title: 'Canal Lines',
  goal: 'Connect the spring to the sea and water every gold field.',
  rule: 'Tap or drag through neighboring squares. Retrace one square to back up.',
  levels: LEVELS, makeState: makeCanalState,
  size: level => [level.width, level.height],
  select: (state, level, x, y) => extendCanal(state, level, x, y),
  drag: (state, level, x, y) => extendCanal(state, level, x, y),
  keyboard(state, level, key) {
    const direction = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
    if (!direction) return null;
    const [x, y] = state.path[state.path.length - 1];
    return extendCanal(state, level, x + direction[0], y + direction[1]);
  },
  won: canalWon,
  status: (state, level) => `${level.fields.filter(field => has(state.path, ...field)).length} of ${level.fields.length} fields watered.`,
  hint(state, level) {
    const index = state.path.length;
    if (state.path.every((point, i) => point[0] === level.solution[i]?.[0] && point[1] === level.solution[i]?.[1])) {
      const next = level.solution[index];
      if (next) return `Try column ${next[0] + 1}, row ${next[1] + 1}.`;
    }
    return 'Undo a step and look for a route through the gold fields.';
  },
  draw(ctx, state, level, rect) {
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
      const rock = has(level.rocks, x, y);
      const water = has(state.path, x, y);
      const field = has(level.fields, x, y);
      const start = x === level.start[0] && y === level.start[1];
      const end = x === level.end[0] && y === level.end[1];
      drawCell(ctx, rect, x, y,
        rock ? '#9DA9A0' : water ? '#50B5B2' : field ? '#F6DEA3' : end ? '#B9CFDC' : '#FFFCF2',
        rock ? '#667C78' : '#B5CFC7');
      if (rock) drawSymbol(ctx, rect, x, y, '■', '#667C78', 0.35);
      else if (start) drawSymbol(ctx, rect, x, y, 'S', COLORS.ink);
      else if (end) drawSymbol(ctx, rect, x, y, '≈', water ? '#FFFFFF' : COLORS.ink, 0.63);
      else if (field) drawSymbol(ctx, rect, x, y, water ? '✓' : '✿', water ? '#FFFFFF' : '#9A611D');
      else if (water) drawSymbol(ctx, rect, x, y, '≈', '#FFFFFF', 0.56);
    }
  }
};

export class CanalLinesEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
