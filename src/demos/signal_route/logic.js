const DELTAS = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
const CYCLE = [undefined, 'U', 'R', 'D', 'L'];
const pointKey = ([x, y]) => `${x},${y}`;

function level(width, height, start, route, scrollSteps, rocks = []) {
  if (route[0] !== 'R') throw new Error('Courier must leave facing right');
  const solution = [[...start]];
  const arrows = {};
  let x = start[0], y = start[1], direction = 'R';
  for (const step of route) {
    if (step !== direction) arrows[`${x},${y}`] = step;
    direction = step;
    x += DELTAS[step][0];
    y += DELTAS[step][1];
    if (x < 0 || y < 0 || x >= width || y >= height ||
      solution.some(point => point[0] === x && point[1] === y)) throw new Error('Invalid signal route');
    solution.push([x, y]);
  }
  if (rocks.some(rock => solution.some(point => pointKey(point) === pointKey(rock)))) {
    throw new Error('Rock blocks signal route');
  }
  return { width, height, start, target: [x, y], scrolls: scrollSteps.map(index => solution[index]),
    rocks, solution, solutionArrows: arrows };
}

export const LEVELS = [
  level(4, 4, [0, 1], 'RRDD', [2]),
  level(4, 4, [0, 3], 'RRUUR', [2, 4]),
  level(5, 5, [0, 0], 'RRDDRR', [2, 4]),
  level(5, 5, [0, 4], 'RRUURR', [2, 4]),
  level(5, 5, [0, 2], 'RRUURRDD', [2, 4, 6]),
  level(6, 6, [0, 1], 'RRDDLLDDRRRR', [2, 4, 8]),
  level(6, 6, [0, 5], 'RRUUURRRD', [2, 5, 8]),
  level(6, 6, [0, 0], 'RRRDDLLDDRRR', [3, 5, 9]),
  level(6, 6, [0, 4], 'RRUURRDD', [2, 4, 6]),
  level(6, 6, [0, 2], 'RRUURRRDDDLLL', [2, 5, 10]),
  level(6, 6, [0, 5], 'RRRUUULLUURRR', [3, 6, 10]),
  level(6, 6, [0, 0], 'RRRRDDLLDDRRU', [4, 8, 12])
];

export function makeRouteState() { return { arrows: {}, ran: false }; }
export function solutionArrows(level) { return level.solutionArrows; }
export function cycleArrow(state, level, x, y) {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height ||
    level.rocks.some(point => point[0] === x && point[1] === y) ||
    pointKey(level.start) === `${x},${y}` || pointKey(level.target) === `${x},${y}`) return state;
  const id = `${x},${y}`;
  const next = CYCLE[(CYCLE.indexOf(state.arrows[id]) + 1) % CYCLE.length];
  const arrows = { ...state.arrows };
  if (next) arrows[id] = next;
  else delete arrows[id];
  return { arrows, ran: false };
}

export function traceCourier(level, state) {
  let [x, y] = level.start;
  let direction = 'R';
  const path = [[x, y]];
  const collected = new Set();
  const seen = new Set();
  for (let step = 0; step < level.width * level.height * 5; step++) {
    const id = `${x},${y},${direction}`;
    if (seen.has(id)) return { hit: false, path, collected: collected.size, reason: 'loop' };
    seen.add(id);
    if (level.scrolls.some(point => point[0] === x && point[1] === y)) collected.add(`${x},${y}`);
    if (x === level.target[0] && y === level.target[1]) {
      return { hit: collected.size === level.scrolls.length, path, collected: collected.size,
        reason: collected.size === level.scrolls.length ? 'beacon' : 'missed scrolls' };
    }
    direction = state.arrows[`${x},${y}`] || direction;
    x += DELTAS[direction][0];
    y += DELTAS[direction][1];
    if (x < 0 || y < 0 || x >= level.width || y >= level.height ||
      level.rocks.some(point => point[0] === x && point[1] === y)) {
      return { hit: false, path, collected: collected.size, reason: 'blocked' };
    }
    path.push([x, y]);
  }
  return { hit: false, path, collected: collected.size, reason: 'loop' };
}
