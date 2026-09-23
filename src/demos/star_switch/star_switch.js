import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, makeStarState, solveStars, toggleStars } from './logic.js';

const spec = {
  key: 'star_switch', title: 'Star Switch',
  goal: 'Turn every star off to clear the sky.',
  rule: 'Tap one star to change it and its four neighbors. Arrows and Enter work too.',
  levels: LEVELS,
  makeState: makeStarState,
  size: level => [level.size, level.size],
  select: (board, level, x, y) => toggleStars(board, level.size, x, y),
  won: board => board.every(value => value === 0),
  hint: (board, level) => {
    const [move] = solveStars(board, level.size);
    return move ? `Try column ${move[0] + 1}, row ${move[1] + 1}.` : 'The sky is clear!';
  },
  status: board => `${board.filter(Boolean).length} stars are still lit.`,
  draw(ctx, board, level, rect) {
    for (let y = 0; y < level.size; y++) {
      for (let x = 0; x < level.size; x++) {
        const lit = board[y * level.size + x];
        drawCell(ctx, rect, x, y, lit ? '#254D5B' : '#D7E4DF', '#829FA4', 10);
        drawSymbol(ctx, rect, x, y, lit ? '✦' : '·', lit ? '#FFD370' : COLORS.ink, lit ? 0.7 : 0.54);
      }
    }
  }
};

export class StarSwitchEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
