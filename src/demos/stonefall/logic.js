export const STONE_WIDTH = 8;
export const STONE_HEIGHT = 12;
const BASE = {
  I: [[0, 0], [1, 0], [2, 0]],
  L: [[0, 0], [0, 1], [1, 1]]
};

export function shapeCells(type, rotation) {
  let cells = BASE[type]?.map(point => [...point]);
  if (!cells) throw new Error('Unknown stone');
  for (let turn = 0; turn < ((rotation % 4) + 4) % 4; turn++) {
    cells = cells.map(([x, y]) => [-y, x]);
    const minX = Math.min(...cells.map(point => point[0]));
    const minY = Math.min(...cells.map(point => point[1]));
    cells = cells.map(([x, y]) => [x - minX, y - minY]);
  }
  return cells;
}

export function createStoneState(seed = 1) {
  return { grid: Array(STONE_WIDTH * STONE_HEIGHT).fill(0),
    active: { type: 'I', x: 2, y: 0, rotation: 0 }, next: 'L',
    seed, score: 0, lines: 0, gameOver: false };
}

function fits(state, active) {
  return shapeCells(active.type, active.rotation).every(([dx, dy]) => {
    const x = active.x + dx, y = active.y + dy;
    return x >= 0 && x < STONE_WIDTH && y >= 0 && y < STONE_HEIGHT && !state.grid[y * STONE_WIDTH + x];
  });
}

export function moveStone(state, dx, dy) {
  if (state.gameOver) return state;
  const active = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  return fits(state, active) ? { ...state, active } : state;
}

export function rotateStone(state) {
  if (state.gameOver) return state;
  for (const kick of [0, -1, 1, -2, 2]) {
    const active = { ...state.active, x: state.active.x + kick, rotation: (state.active.rotation + 1) % 4 };
    if (fits(state, active)) return { ...state, active };
  }
  return state;
}

function lockStone(state) {
  const grid = [...state.grid];
  for (const [dx, dy] of shapeCells(state.active.type, state.active.rotation)) {
    grid[(state.active.y + dy) * STONE_WIDTH + state.active.x + dx] = state.active.type === 'I' ? 1 : 2;
  }
  const rows = [];
  for (let y = 0; y < STONE_HEIGHT; y++) {
    const row = grid.slice(y * STONE_WIDTH, (y + 1) * STONE_WIDTH);
    if (row.some(value => value === 0)) rows.push(row);
  }
  const cleared = STONE_HEIGHT - rows.length;
  while (rows.length < STONE_HEIGHT) rows.unshift(Array(STONE_WIDTH).fill(0));
  const seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  const active = { type: state.next, x: 2, y: 0, rotation: 0 };
  const nextState = { ...state, grid: rows.flat(), active,
    next: (seed >>> 16) & 1 ? 'I' : 'L', seed,
    score: state.score + cleared * cleared * 100 + (cleared ? 0 : 2),
    lines: state.lines + cleared };
  return { ...nextState, gameOver: !fits(nextState, active) };
}

export function stepStone(state) {
  const moved = moveStone(state, 0, 1);
  return moved === state && !state.gameOver ? lockStone(state) : moved;
}

export function hardDropStone(state) {
  if (state.gameOver) return state;
  let falling = state;
  for (let i = 0; i < STONE_HEIGHT; i++) {
    const moved = moveStone(falling, 0, 1);
    if (moved === falling) return lockStone(falling);
    falling = moved;
  }
  return lockStone(falling);
}
