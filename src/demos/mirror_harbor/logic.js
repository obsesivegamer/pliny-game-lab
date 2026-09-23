function level(width, height, source, target, mirrors, flipped) {
  return { width, height, source, target, mirrors, flipped };
}

export const LEVELS = [
  level(4, 4, [0, 1, 0], [2, 0], [[2, 1, '/']], [0]),
  level(4, 4, [0, 2, 0], [2, 3], [[2, 2, '\\']], [0]),
  level(5, 5, [0, 3, 0], [4, 1], [[3, 3, '/'], [3, 1, '/']], [1]),
  level(5, 5, [4, 4, 2], [0, 1], [[1, 4, '\\'], [1, 1, '\\']], [0]),
  level(5, 5, [0, 0, 0], [2, 3], [[4, 0, '\\'], [4, 3, '/']], [0, 1]),
  level(6, 6, [0, 5, 0], [5, 2], [[2, 5, '/'], [2, 2, '/']], [0]),
  level(6, 6, [5, 0, 2], [0, 4], [[3, 0, '/'], [3, 4, '/']], [1]),
  level(6, 6, [0, 1, 0], [5, 4], [[2, 1, '\\'], [2, 4, '\\'], [4, 0, '/']], [0, 1]),
  level(6, 6, [0, 5, 0], [1, 0], [[4, 5, '/'], [4, 2, '\\'], [1, 2, '\\']], [0, 2]),
  level(6, 6, [5, 5, 2], [4, 0], [[2, 5, '\\'], [2, 3, '/'], [4, 3, '/']], [0, 1]),
  level(6, 6, [0, 0, 0], [2, 1], [[5, 0, '\\'], [5, 4, '/'], [2, 4, '\\'], [0, 3, '/']], [1, 2]),
  level(6, 6, [5, 0, 2], [4, 1], [[1, 0, '/'], [1, 4, '\\'], [4, 4, '/']], [0, 1, 2])
];

const opposite = value => value === '/' ? '\\' : '/';
export function makeMirrorState(level) {
  return level.mirrors.map(([,, orientation], index) =>
    level.flipped.includes(index) ? opposite(orientation) : orientation);
}
export function rotateMirror(state, index) {
  if (index < 0 || index >= state.length) return state;
  return state.map((value, i) => i === index ? opposite(value) : value);
}
export function traceBeam(level, state) {
  const [sx, sy, initialDirection] = level.source;
  let x = sx, y = sy, direction = initialDirection;
  const path = [[x, y]];
  const seen = new Set();
  for (let step = 0; step < level.width * level.height * 4; step++) {
    const id = `${x},${y},${direction}`;
    if (seen.has(id)) return { hit: false, path, loop: true };
    seen.add(id);
    const [dx, dy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][direction];
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= level.width || y >= level.height) return { hit: false, path, loop: false };
    path.push([x, y]);
    if (x === level.target[0] && y === level.target[1]) return { hit: true, path, loop: false };
    const mirrorIndex = level.mirrors.findIndex(mirror => mirror[0] === x && mirror[1] === y);
    if (mirrorIndex >= 0) direction = state[mirrorIndex] === '/' ? [3, 2, 1, 0][direction] : [1, 0, 3, 2][direction];
  }
  return { hit: false, path, loop: true };
}
