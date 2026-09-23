import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, initialLanternState, moveLantern, lanternWon, solveLantern } from './logic.js';

const contains = (points, x, y) => points.some(point => point[0] === x && point[1] === y);
const arrows = { ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  w: 'Up', s: 'Down', a: 'Left', d: 'Right' };
const spec = {
  key: 'lantern_push', title: 'Lantern Push',
  goal: 'Push every lantern onto a gold mark.',
  rule: 'Walk with arrow keys or tap an adjacent tile. Lanterns can only be pushed.',
  levels: LEVELS, makeState: initialLanternState,
  size: level => [level.width, level.height],
  select(state, level, x, y) {
    const dx = x - state.player[0], dy = y - state.player[1];
    const direction = dx === 1 && dy === 0 ? 'Right' : dx === -1 && dy === 0 ? 'Left' :
      dx === 0 && dy === 1 ? 'Down' : dx === 0 && dy === -1 ? 'Up' : null;
    return direction ? moveLantern(state, level, direction) : state;
  },
  keyboard: (state, level, key) => arrows[key] ? moveLantern(state, level, arrows[key]) : null,
  won: lanternWon,
  hint(state, level) {
    const [next] = solveLantern(state, level) || [];
    return next ? `Try moving ${next.toLowerCase()}.` : 'That box may be trapped. Undo a move.';
  },
  status: (state, level) => `${state.boxes.filter(box => contains(level.goals, ...box)).length} of ${level.goals.length} lanterns placed.`,
  extraControls: `<div class="puzzle-dpad" aria-label="Movement">
    <button type="button" data-puzzle-action="Up">↑</button>
    <button type="button" data-puzzle-action="Left">←</button>
    <button type="button" data-puzzle-action="Down">↓</button>
    <button type="button" data-puzzle-action="Right">→</button>
  </div>`,
  action(action, engine) { if (['Up', 'Down', 'Left', 'Right'].includes(action)) engine.commit(moveLantern(engine.state, engine.getLevel(), action)); },
  draw(ctx, state, level, rect) {
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
      const wall = contains(level.walls, x, y);
      const goal = contains(level.goals, x, y);
      const box = contains(state.boxes, x, y);
      const player = state.player[0] === x && state.player[1] === y;
      drawCell(ctx, rect, x, y, wall ? '#738A83' : goal ? '#FFE3A3' : '#FFFDF4',
        wall ? '#738A83' : '#C4D2C8');
      if (goal) drawSymbol(ctx, rect, x, y, '✦', '#B87D2E', 0.48);
      if (box) drawSymbol(ctx, rect, x, y, '▣', goal ? '#168B88' : '#C98344', 0.7);
      if (player) drawSymbol(ctx, rect, x, y, '●', COLORS.ink, 0.65);
    }
  }
};

export class LanternPushEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
