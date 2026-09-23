import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, makeRouteState, cycleArrow, traceCourier, solutionArrows } from './logic.js';

const has = (points, x, y) => points.some(point => point[0] === x && point[1] === y);
const SYMBOLS = { U: '↑', R: '→', D: '↓', L: '←' };
const spec = {
  key: 'signal_route', title: 'Signal Route',
  goal: 'Guide the courier through every scroll and into the beacon.',
  rule: 'Tap to turn arrows, then press Run. Arrows and Enter choose tiles; R runs.',
  levels: LEVELS, makeState: makeRouteState,
  size: level => [level.width, level.height],
  select: (state, level, x, y) => cycleArrow(state, level, x, y),
  keyboard: (state, level, key) => (key === 'r' || key === 'R') && !state.ran ? { ...state, ran: true } : null,
  won: (state, level) => state.ran && traceCourier(level, state).hit,
  hint(state, level) {
    const entry = Object.entries(solutionArrows(level)).find(([cell, direction]) => state.arrows[cell] !== direction);
    if (!entry) return 'The arrows are ready. Press Run.';
    const [x, y] = entry[0].split(',').map(Number);
    return `At column ${x + 1}, row ${y + 1}, point ${SYMBOLS[entry[1]]}.`;
  },
  status(state, level) {
    if (!state.ran) return 'Place arrows, then press Run.';
    const result = traceCourier(level, state);
    return result.hit ? 'Courier reached the beacon!' :
      `Courier collected ${result.collected} of ${level.scrolls.length} scrolls. Adjust arrows and run again.`;
  },
  extraControls: '<button type="button" class="puzzle-run" data-puzzle-action="run">▶ Run courier</button>',
  action(action, engine) {
    if (action === 'run' && !engine.state.ran) engine.commit({ ...engine.state, ran: true });
  },
  draw(ctx, state, level, rect) {
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
      const rock = has(level.rocks, x, y);
      const scroll = has(level.scrolls, x, y);
      drawCell(ctx, rect, x, y, rock ? '#83928D' : scroll ? '#FBE3A7' : '#FFFDF3', '#B4CBC2');
      if (scroll) drawSymbol(ctx, rect, x, y, '▤', '#9B682D', 0.55);
      if (state.arrows[`${x},${y}`]) drawSymbol(ctx, rect, x, y, SYMBOLS[state.arrows[`${x},${y}`]], COLORS.ink, 0.59);
    }
    if (state.ran) {
      const route = traceCourier(level, state);
      ctx.strokeStyle = route.hit ? '#168B88' : '#D48167';
      ctx.lineWidth = Math.max(3, rect.cell * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      route.path.forEach(([x, y], index) => {
        const px = rect.x + (x + 0.5) * rect.cell;
        const py = rect.y + (y + 0.5) * rect.cell;
        if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    drawCell(ctx, rect, ...level.start, '#51B5B0', '#328480');
    drawSymbol(ctx, rect, ...level.start, '▶', '#FFFFFF', 0.47);
    drawCell(ctx, rect, ...level.target, '#E2B05F', '#A97A32');
    drawSymbol(ctx, rect, ...level.target, '✦', '#FFFFFF', 0.63);
  }
};

export class SignalRouteEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
