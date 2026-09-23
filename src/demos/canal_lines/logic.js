const directions = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

function level(width, height, start, steps, fields, rocks = []) {
  const solution = [[...start]];
  let [x, y] = start;
  for (const step of steps) {
    const [dx, dy] = directions[step];
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= width || y >= height ||
      solution.some(point => point[0] === x && point[1] === y)) throw new Error('Invalid canal route');
    solution.push([x, y]);
  }
  for (const [rx, ry] of rocks) {
    if (solution.some(point => point[0] === rx && point[1] === ry)) throw new Error('Rock blocks the authored route');
  }
  return { width, height, start, end: [x, y], fields: fields.map(index => solution[index]), rocks, solution };
}

export const LEVELS = [
  level(4, 4, [0, 1], 'RRRD', [2], [[1, 0], [2, 3]]),
  level(4, 4, [0, 0], 'DDRRUR', [2, 4], [[1, 1], [3, 3]]),
  level(5, 4, [0, 0], 'RRDDRRU', [2, 4, 6], [[1, 1], [3, 0]]),
  level(5, 5, [0, 4], 'UURRUURR', [2, 4, 6], [[1, 3], [3, 2]]),
  level(5, 5, [0, 0], 'DDDRRUURRDD', [3, 5, 8], [[1, 1], [3, 3]]),
  level(5, 5, [4, 0], 'LLDDLLDDRR', [2, 4, 8], [[3, 2], [1, 1]]),
  level(6, 5, [0, 2], 'RRUURRRDDD', [2, 4, 7], [[1, 1], [4, 2]]),
  level(6, 6, [5, 5], 'UUULLLUULL', [3, 6, 9], [[4, 4], [1, 2]]),
  level(6, 6, [0, 0], 'DDDRRUURRDDDR', [3, 5, 9], [[1, 2], [3, 3]]),
  level(6, 6, [0, 5], 'UUURRURRUR', [3, 5, 8], [[1, 3], [3, 2]]),
  level(6, 6, [0, 0], 'RRRDDDLLDDRRRR', [3, 6, 10], [[2, 1], [4, 4]]),
  level(6, 6, [5, 0], 'LLLDDRRDDLLLD', [3, 5, 9], [[3, 1], [3, 3]])
];

const same = ([ax, ay], [bx, by]) => ax === bx && ay === by;

export function makeCanalState(level) { return { path: [[...level.start]] }; }

export function extendCanal(state, level, x, y) {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return state;
  const path = state.path;
  if (path.length > 1 && same(path[path.length - 2], [x, y])) return { path: path.slice(0, -1) };
  const [lastX, lastY] = path[path.length - 1];
  if (Math.abs(x - lastX) + Math.abs(y - lastY) !== 1 ||
    path.some(point => same(point, [x, y])) ||
    level.rocks.some(point => same(point, [x, y]))) return state;
  return { path: [...path, [x, y]] };
}

export function canalWon(state, level) {
  return same(state.path[state.path.length - 1], level.end) &&
    level.fields.every(field => state.path.some(point => same(field, point)));
}
