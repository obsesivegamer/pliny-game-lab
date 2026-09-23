import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, makeMirrorState, rotateMirror, traceBeam } from './logic.js';

const spec = {
  key: 'mirror_harbor', title: 'Mirror Harbor',
  goal: 'Turn the mirrors so the light reaches the lighthouse.',
  rule: 'Tap a mirror to turn it. Keyboard: arrows choose a tile, Enter turns it.',
  levels: LEVELS, makeState: makeMirrorState,
  size: level => [level.width, level.height],
  select(state, level, x, y) {
    const index = level.mirrors.findIndex(mirror => mirror[0] === x && mirror[1] === y);
    return rotateMirror(state, index);
  },
  won: (state, level) => traceBeam(level, state).hit,
  hint(state, level) {
    const index = level.mirrors.findIndex((mirror, i) => state[i] !== mirror[2]);
    return index < 0 ? 'The light already has a route.' :
      `Try the mirror at column ${level.mirrors[index][0] + 1}, row ${level.mirrors[index][1] + 1}.`;
  },
  status: (state, level) => traceBeam(level, state).hit ? 'The lighthouse is lit!' : 'The lighthouse is still dark.',
  draw(ctx, state, level, rect) {
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
      drawCell(ctx, rect, x, y, '#E3F0E9', '#B5CEC7');
    }
    const beam = traceBeam(level, state);
    ctx.strokeStyle = beam.hit ? '#ECA843' : '#C99853';
    ctx.lineWidth = Math.max(4, rect.cell * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    beam.path.forEach(([x, y], index) => {
      const px = rect.x + (x + 0.5) * rect.cell;
      const py = rect.y + (y + 0.5) * rect.cell;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    level.mirrors.forEach(([x, y], index) => {
      drawCell(ctx, rect, x, y, '#2B5360', '#315C67');
      drawSymbol(ctx, rect, x, y, state[index], '#FFF7DA', 0.74);
    });
    const [sx, sy] = level.source;
    drawCell(ctx, rect, sx, sy, '#F7C35D', '#B38027');
    drawSymbol(ctx, rect, sx, sy, '●', COLORS.ink, 0.54);
    drawCell(ctx, rect, ...level.target, beam.hit ? '#F6D482' : '#ADC7CE', '#537E88');
    drawSymbol(ctx, rect, ...level.target, '✦', beam.hit ? '#8C5624' : COLORS.ink, 0.66);
  }
};

export class MirrorHarborEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
