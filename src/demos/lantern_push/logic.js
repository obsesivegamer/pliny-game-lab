const RAW_LEVELS = [
  ['#####', '#...#', '#P.B#', '#..G#', '#####'],
  ['######', '#....#', '#.B..#', '#..P.#', '#..G.#', '######'],
  ['######', '#...G#', '#..B.#', '#.P..#', '#....#', '######'],
  ['######', '#..G.#', '#..B.#', '#....#', '#P...#', '######'],
  ['#######', '#....G#', '#..#B.#', '#P....#', '#.....#', '#######'],
  ['#######', '#G....#', '#.B#..#', '#...P.#', '#.....#', '#######'],
  ['#######', '#.....#', '#.G.G.#', '#.B.B.#', '#..P..#', '#######'],
  ['#######', '#.....#', '#.G.G.#', '#..B..#', '#.B.P.#', '#.....#', '#######'],
  ['#######', '#.....#', '#G...G#', '#.B.B.#', '#..P..#', '#.....#', '#######'],
  ['#######', '#G...G#', '#.....#', '#.B.B.#', '#..#P.#', '#.....#', '#######'],
  ['########', '#......#', '#.G..G.#', '#.B..B.#', '#...P..#', '#......#', '########'],
  ['########', '#G....G#', '#......#', '#..B.B.#', '#..#P..#', '#......#', '########']
];

const key = ([x, y]) => `${x},${y}`;
const DELTAS = { Up: [0, -1], Down: [0, 1], Left: [-1, 0], Right: [1, 0] };

function parse(rows) {
  const width = rows[0].length;
  if (!rows.every(row => row.length === width)) throw new Error('Uneven Lantern Push map');
  const walls = [];
  const goals = [];
  const boxes = [];
  let player = null;
  rows.forEach((row, y) => [...row].forEach((char, x) => {
    if (char === '#') walls.push([x, y]);
    if (char === 'G' || char === '*') goals.push([x, y]);
    if (char === 'B' || char === '*') boxes.push([x, y]);
    if (char === 'P') player = [x, y];
  }));
  if (!player || goals.length !== boxes.length) throw new Error('Invalid Lantern Push map');
  return { width, height: rows.length, walls, goals, boxes, player };
}

export const LEVELS = RAW_LEVELS.map(parse);
export function initialLanternState(level) {
  return { player: [...level.player], boxes: level.boxes.map(box => [...box]) };
}
export function lanternWon(state, level) {
  return state.boxes.every(box => level.goals.some(goal => key(goal) === key(box)));
}
export function moveLantern(state, level, direction) {
  const delta = DELTAS[direction];
  if (!delta) return state;
  const next = [state.player[0] + delta[0], state.player[1] + delta[1]];
  const blocked = point => level.walls.some(wall => key(wall) === key(point));
  if (blocked(next)) return state;
  const boxIndex = state.boxes.findIndex(box => key(box) === key(next));
  if (boxIndex < 0) return { ...state, player: next };
  const beyond = [next[0] + delta[0], next[1] + delta[1]];
  if (blocked(beyond) || state.boxes.some(box => key(box) === key(beyond))) return state;
  const boxes = state.boxes.map((box, index) => index === boxIndex ? beyond : box);
  return { player: next, boxes };
}

export function solveLantern(start, level) {
  const signature = state => `${key(state.player)}|${state.boxes.map(key).sort().join(';')}`;
  const queue = [{ state: start, moves: '' }];
  const seen = new Set([signature(start)]);
  const directions = { U: 'Up', D: 'Down', L: 'Left', R: 'Right' };
  for (let index = 0; index < queue.length && index < 150000; index++) {
    const { state, moves } = queue[index];
    if (lanternWon(state, level)) return [...moves].map(letter => directions[letter]);
    for (const [letter, direction] of Object.entries(directions)) {
      const next = moveLantern(state, level, direction);
      if (next === state) continue;
      const id = signature(next);
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push({ state: next, moves: moves + letter });
    }
  }
  return null;
}
