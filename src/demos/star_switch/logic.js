// Each starting sky is made from authored taps on an empty grid, so every
// level has at least one solution. The first teaches the center cross.
export const LEVELS = [
  { size: 3, taps: [[1, 1]] },
  { size: 3, taps: [[0, 0], [2, 2]] },
  { size: 3, taps: [[0, 2], [1, 1], [2, 0]] },
  { size: 3, taps: [[0, 0], [1, 2], [2, 1], [2, 2]] },
  { size: 4, taps: [[1, 1], [2, 2]] },
  { size: 4, taps: [[0, 3], [1, 1], [3, 0]] },
  { size: 4, taps: [[0, 0], [1, 2], [2, 1], [3, 3]] },
  { size: 4, taps: [[0, 2], [1, 0], [2, 3], [3, 1], [2, 2]] },
  { size: 5, taps: [[2, 2], [0, 0], [4, 4]] },
  { size: 5, taps: [[0, 4], [1, 1], [2, 3], [4, 0]] },
  { size: 5, taps: [[0, 0], [1, 3], [2, 2], [3, 1], [4, 4]] },
  { size: 5, taps: [[0, 2], [1, 0], [1, 4], [2, 2], [3, 1], [4, 3]] }
];

export function toggleStars(board, size, x, y) {
  if (x < 0 || y < 0 || x >= size || y >= size) return board;
  const next = [...board];
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const col = x + dx;
    const row = y + dy;
    if (col >= 0 && row >= 0 && col < size && row < size) next[row * size + col] ^= 1;
  }
  return next;
}

export function makeStarState(level) {
  let board = Array(level.size ** 2).fill(0);
  for (const [x, y] of level.taps) board = toggleStars(board, level.size, x, y);
  return board;
}

export function solveStars(board, size) {
  let best = null;
  for (let mask = 0; mask < (1 << size); mask++) {
    let working = [...board];
    const taps = [];
    for (let x = 0; x < size; x++) {
      if (mask & (1 << x)) {
        working = toggleStars(working, size, x, 0);
        taps.push([x, 0]);
      }
    }
    for (let y = 1; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (working[(y - 1) * size + x]) {
          working = toggleStars(working, size, x, y);
          taps.push([x, y]);
        }
      }
    }
    if (working.every(value => value === 0) && (!best || taps.length < best.length)) best = taps;
  }
  return best || [];
}
