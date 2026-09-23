import { LevelPuzzleEngine, drawCell, drawSymbol, COLORS } from '../../core/puzzle.js';
import { LEVELS, makeHarborState, boatAt, boatCells, moveHarbor, harborWon, solveHarbor } from './logic.js';

const spec = {
  key: 'harbor_jam', title: 'Harbor Jam',
  goal: 'Slide the blue courier boat to the right edge.',
  rule: 'Tap or press Enter on a boat to select it. Drag or use arrows to slide it. Esc lets go.',
  levels: LEVELS, makeState: makeHarborState,
  size: () => [6, 6],
  select(state, level, x, y) {
    const index = boatAt(level, state, x, y);
    if (index >= 0) return { ...state, selected: index };
    if (state.selected === null) return state;
    const boat = level.vehicles[state.selected];
    const position = state.positions[state.selected];
    const desired = boat.axis === 'h' ? (x < position ? x : x - boat.length + 1) :
      (y < position ? y : y - boat.length + 1);
    return moveHarbor(state, level, state.selected, desired - position);
  },
  drag(state, level, x, y) {
    if (state.selected === null) return state;
    const boat = level.vehicles[state.selected];
    const position = state.positions[state.selected];
    const coordinate = boat.axis === 'h' ? x : y;
    if (coordinate >= position && coordinate < position + boat.length) return state;
    const desired = coordinate < position ? coordinate : coordinate - boat.length + 1;
    return moveHarbor(state, level, state.selected, desired - position);
  },
  won: harborWon,
  hint(state, level) {
    const [move] = solveHarbor(state, level) || [];
    if (!move) return 'Try undoing a slide to open another lane.';
    const [index, offset] = move;
    const boat = level.vehicles[index];
    const direction = boat.axis === 'h' ? offset > 0 ? 'right' : 'left' : offset > 0 ? 'down' : 'up';
    return `Slide boat ${boat.id} ${direction} ${Math.abs(offset)} square${Math.abs(offset) === 1 ? '' : 's'}.`;
  },
  status(state, level) {
    return state.selected === null ? 'Select a boat to move it.' :
      `Boat ${level.vehicles[state.selected].id} selected. Move it along its lane.`;
  },
  extraControls: `<div class="puzzle-dpad" aria-label="Slide selected boat">
    <button type="button" data-puzzle-action="Up">↑</button>
    <button type="button" data-puzzle-action="Left">←</button>
    <button type="button" data-puzzle-action="Down">↓</button>
    <button type="button" data-puzzle-action="Right">→</button>
  </div>`,
  action(action, engine) {
    if (engine.state.selected === null) return;
    const boat = engine.getLevel().vehicles[engine.state.selected];
    const offset = action === 'Right' && boat.axis === 'h' || action === 'Down' && boat.axis === 'v' ? 1 :
      action === 'Left' && boat.axis === 'h' || action === 'Up' && boat.axis === 'v' ? -1 : 0;
    if (offset) engine.commit(moveHarbor(engine.state, engine.getLevel(), engine.state.selected, offset));
  },
  keyboard(state, level, key, engine) {
    if (state.selected === null) return null;
    const onSelected = engine.cursor && boatAt(level, state, ...engine.cursor) === state.selected;
    if (key === 'Escape' || (key === 'Enter' || key === ' ') && onSelected) return { ...state, selected: null };
    const boat = level.vehicles[state.selected];
    const offset = key === 'ArrowRight' && boat.axis === 'h' || key === 'ArrowDown' && boat.axis === 'v' ? 1 :
      key === 'ArrowLeft' && boat.axis === 'h' || key === 'ArrowUp' && boat.axis === 'v' ? -1 : 0;
    if (!offset) return null;
    const next = moveHarbor(state, level, state.selected, offset);
    if (next !== state && onSelected) {
      const [x, y] = engine.cursor;
      engine.cursor = boat.axis === 'h' ? [x + offset, y] : [x, y + offset];
    }
    return next;
  },
  draw(ctx, state, level, rect) {
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) drawCell(ctx, rect, x, y, '#DDEDEB', '#B3CBC6');
    level.vehicles.forEach((boat, index) => {
      const cells = boatCells(level, state, index);
      const fill = index === 0 ? '#238C9D' : index === state.selected ? '#F1B867' :
        ['#E09170', '#8EA8B7', '#A2B67D', '#CA98B8'][index % 4];
      for (const [x, y] of cells) drawCell(ctx, rect, x, y, fill, index === state.selected ? '#9B6728' : '#779B9D', 9);
      const center = cells[Math.floor(cells.length / 2)];
      drawSymbol(ctx, rect, ...center, boat.id, '#FFFFFF', 0.48);
    });
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 ${Math.max(16, rect.cell * 0.38)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('→', rect.x + rect.width + rect.cell * 0.25, rect.y + rect.cell * 2.5);
  }
};

export class HarborJamEngine extends LevelPuzzleEngine {
  constructor(canvas, ctx, controlsContainer) { super(spec, canvas, ctx, controlsContainer); }
}
