import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, markMosaic, mosaicWon, rowClues, columnClues } from './logic.js';

const spec = {
  key: 'mosaic_clues', title: 'Mosaic Clues',
  goal: 'Fill the hidden picture using the row and column numbers.',
  rule: 'Numbers count runs of filled tiles. Tap to fill, X, then clear; arrows and Enter work too.',
  levels: LEVELS,
  makeState: level => Array(level.size ** 2).fill(0),
  size: level => [level.size, level.size],
  boardOptions: { insetLeft: 52, insetTop: 53 },
  select: (state, level, x, y) => markMosaic(state, level.size, x, y),
  won: mosaicWon,
  hint(state, level) {
    for (let y = 0; y < level.size; y++) for (let x = 0; x < level.size; x++) {
      if (level.rows[y][x] === '1' && state[y * level.size + x] !== 1) {
        return `Fill column ${x + 1}, row ${y + 1}.`;
      }
    }
    return 'A filled tile does not belong in the picture. Tap it again.';
  },
  status: (state, level) => `${state.filter(value => value === 1).length} filled tiles. Match the clues to finish.`,
  draw(ctx, state, level, rect) {
    const size = level.size;
    const rowHints = rowClues(level);
    const columnHints = columnClues(level);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 ${Math.min(17, rect.cell * 0.31)}px system-ui`;
    ctx.textBaseline = 'middle';
    rowHints.forEach((clue, y) => {
      ctx.textAlign = 'right';
      ctx.fillText(clue.join(' '), rect.x - 8, rect.y + (y + 0.5) * rect.cell);
    });
    columnHints.forEach((clue, x) => {
      ctx.textAlign = 'center';
      clue.forEach((number, i) => {
        ctx.fillText(number, rect.x + (x + 0.5) * rect.cell,
          rect.y - 11 - (clue.length - 1 - i) * 17);
      });
    });
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const value = state[y * size + x];
      drawCell(ctx, rect, x, y, value === 1 ? '#247E84' : '#FFFDF4', '#A5BDB7', 4);
      if (value === 2) drawSymbol(ctx, rect, x, y, '×', '#A37970', 0.48);
    }
  }
};

export class MosaicCluesEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
