const h = (id, fixed, pos, length = 2) => ({ id, axis: 'h', fixed, pos, length });
const v = (id, fixed, pos, length = 2) => ({ id, axis: 'v', fixed, pos, length });
const red = () => h('R', 2, 0);

function level(...vehicles) {
  const occupied = new Set();
  for (const boat of vehicles) {
    for (let i = 0; i < boat.length; i++) {
      const x = boat.axis === 'h' ? boat.pos + i : boat.fixed;
      const y = boat.axis === 'v' ? boat.pos + i : boat.fixed;
      if (x >= 6 || y >= 6 || occupied.has(`${x},${y}`)) throw new Error('Overlapping Harbor Jam boats');
      occupied.add(`${x},${y}`);
    }
  }
  return { width: 6, height: 6, vehicles };
}

export const LEVELS = [
  level(red(), v('A', 3, 1)),
  level(red(), v('A', 3, 1, 3), h('B', 4, 2)),
  level(red(), v('A', 2, 1), v('B', 4, 1)),
  level(red(), v('A', 3, 0, 3), h('B', 3, 2)),
  level(red(), v('A', 2, 1, 3), v('B', 4, 1, 3), h('C', 4, 1)),
  level(red(), v('A', 3, 1), h('B', 0, 2), h('C', 3, 2)),
  level(red(), v('A', 2, 1), v('B', 4, 1), h('C', 4, 1), h('D', 0, 3)),
  level(red(), v('A', 3, 1, 3), h('B', 4, 2), v('C', 1, 3)),
  level(red(), v('A', 3, 1, 3), v('B', 5, 1, 3), h('C', 4, 2), h('D', 0, 4)),
  level(red(), v('A', 2, 1), v('B', 3, 1), v('C', 4, 1)),
  level(red(), v('A', 3, 1, 3), v('B', 4, 1), h('C', 4, 2), h('D', 0, 2)),
  level(red(), v('A', 2, 0, 3), v('B', 3, 1), v('C', 4, 0, 3), h('D', 3, 1), h('E', 4, 3))
];

export function makeHarborState(level) {
  return { positions: level.vehicles.map(boat => boat.pos), selected: null };
}
export function boatCells(level, state, index, position = state.positions[index]) {
  const boat = level.vehicles[index];
  return Array.from({ length: boat.length }, (_, offset) =>
    boat.axis === 'h' ? [position + offset, boat.fixed] : [boat.fixed, position + offset]);
}
export function boatAt(level, state, x, y) {
  return level.vehicles.findIndex((_, index) => boatCells(level, state, index)
    .some(([bx, by]) => bx === x && by === y));
}
export function moveHarbor(state, level, index, offset) {
  const boat = level.vehicles[index];
  if (!boat || !Number.isInteger(offset) || offset === 0) return state;
  const original = state.positions[index];
  const target = original + offset;
  const limit = (boat.axis === 'h' ? level.width : level.height) - boat.length;
  if (target < 0 || target > limit) return state;
  const occupied = new Set(level.vehicles.flatMap((_, other) => other === index ? [] :
    boatCells(level, state, other).map(([x, y]) => `${x},${y}`)));
  const step = Math.sign(offset);
  for (let pos = original + step; pos !== target + step; pos += step) {
    if (boatCells(level, state, index, pos).some(([x, y]) => occupied.has(`${x},${y}`))) return state;
  }
  const positions = [...state.positions];
  positions[index] = target;
  return { positions, selected: state.selected };
}
export function harborWon(state, level) {
  return state.positions[0] + level.vehicles[0].length === level.width;
}
export function solveHarbor(start, level) {
  const queue = [{ state: { ...start, selected: null }, moves: [] }];
  const seen = new Set([start.positions.join(',')]);
  for (let cursor = 0; cursor < queue.length && cursor < 100000; cursor++) {
    const { state, moves } = queue[cursor];
    if (harborWon(state, level)) return moves;
    for (let boat = 0; boat < level.vehicles.length; boat++) {
      for (let offset = -5; offset <= 5; offset++) {
        const next = moveHarbor(state, level, boat, offset);
        if (next === state) continue;
        const key = next.positions.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ state: next, moves: [...moves, [boat, offset]] });
      }
    }
  }
  return null;
}
