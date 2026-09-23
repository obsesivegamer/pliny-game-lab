import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, makeForgeState, selectStone, combineForge, forgeWon, solveForge } from './logic.js';

const spec = {
  key: 'number_forge', title: 'Number Forge',
  goal: 'Make the target number using all three stones.',
  rule: 'Pick two stones in order, then choose +, −, ×, or ÷. Arrows and Enter pick stones too.',
  levels: LEVELS, makeState: makeForgeState,
  size: () => [3, 1],
  select: (state, level, x) => selectStone(state, x),
  keyboard: (state, level, key) => state.selected.length === 2 && ['+', '-', '*', '/'].includes(key) ?
    combineForge(state, ...state.selected, key) : null,
  won: forgeWon,
  hint(state, level) {
    const [move] = solveForge(state, level) || [];
    return move ? `Choose ${state.values[move.first]} then ${state.values[move.second]}, and press ${move.operation}.` :
      'Undo a step and try a different pair.';
  },
  status(state, level) {
    if (state.values.length === 1) return `You made ${state.values[0]}. Target: ${level.target}. Use Undo or Retry.`;
    return state.selected.length === 2 ? 'Now choose an operation.' :
      `${state.values.length} stones remain. Select two in order.`;
  },
  extraControls: `<div class="puzzle-operators" aria-label="Operations">
    <button type="button" data-puzzle-action="+" data-forge-op>+</button>
    <button type="button" data-puzzle-action="-" data-forge-op>−</button>
    <button type="button" data-puzzle-action="*" data-forge-op>×</button>
    <button type="button" data-puzzle-action="/" data-forge-op>÷</button>
  </div>`,
  action(action, engine) {
    if (!['+', '-', '*', '/'].includes(action) || engine.state.selected.length !== 2) return;
    const [first, second] = engine.state.selected;
    const next = combineForge(engine.state, first, second, action);
    if (next === engine.state) {
      engine.message = 'That operation needs a positive whole number. Try another.';
      engine.refreshControls();
    } else engine.commit(next);
  },
  refresh(engine) {
    for (const button of engine.controlsContainer?.querySelectorAll?.('[data-forge-op]') || []) {
      button.disabled = engine.state.selected.length !== 2;
    }
  },
  draw(ctx, state, level, rect) {
    ctx.fillStyle = COLORS.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(20, rect.cell * 0.38)}px system-ui`;
    ctx.fillText(`Target: ${level.target}`, rect.x + rect.width / 2, rect.y - 35);
    for (let x = 0; x < 3; x++) {
      const present = x < state.values.length;
      drawCell(ctx, rect, x, 0, !present ? '#E2E8DE' :
        state.selected.includes(x) ? '#F8D58C' : '#FFFDF4', '#A9BFB5', 12);
      if (present) drawSymbol(ctx, rect, x, 0, state.values[x], COLORS.ink, 0.54);
    }
  }
};

export class NumberForgeEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
