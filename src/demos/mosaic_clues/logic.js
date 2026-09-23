function picture(...rows) {
  if (!rows.every(row => row.length === rows.length && /^[01]+$/.test(row))) throw new Error('Square mosaic required');
  return { size: rows.length, rows };
}

export const LEVELS = [
  picture('010', '111', '010'),
  picture('110', '100', '100'),
  picture('0110', '1111', '0110', '0110'),
  picture('1001', '1111', '0110', '0110'),
  picture('00100', '00100', '11111', '00100', '00100'),
  picture('00110', '01110', '11111', '01110', '00100'),
  picture('00100', '01100', '11111', '01100', '00100'),
  picture('00100', '01110', '11111', '10101', '11111'),
  picture('001100', '001100', '011110', '111111', '001100', '001100'),
  picture('111000', '101000', '111110', '001010', '001110', '000010'),
  picture('001100', '011110', '111111', '111111', '011110', '001100'),
  picture('111110', '100010', '101110', '101000', '101111', '111111')
];

export function cluesFor(bits) {
  const runs = [];
  let count = 0;
  for (const bit of bits) {
    if (bit === '1' || bit === 1) count++;
    else if (count) { runs.push(count); count = 0; }
  }
  if (count) runs.push(count);
  return runs.length ? runs : [0];
}

export function rowClues(level) { return level.rows.map(cluesFor); }
export function columnClues(level) {
  return Array.from({ length: level.size }, (_, x) => cluesFor(level.rows.map(row => row[x])));
}

export function markMosaic(state, size, x, y) {
  if (x < 0 || y < 0 || x >= size || y >= size) return state;
  const index = y * size + x;
  const next = [...state];
  next[index] = (next[index] + 1) % 3;
  return next;
}

export function mosaicWon(state, level) {
  return level.rows.every((row, y) => [...row].every((bit, x) =>
    (state[y * level.size + x] === 1) === (bit === '1')));
}

export function countMosaicSolutions(level, limit = 2) {
  const size = level.size;
  const rows = rowClues(level);
  const columns = columnClues(level);
  const candidates = rows.map(clue => Array.from({ length: 1 << size }, (_, mask) =>
    Array.from({ length: size }, (_, x) => mask & (1 << x) ? '1' : '0').join(''))
    .filter(bits => String(cluesFor(bits)) === String(clue)));
  let count = 0;
  const chosen = [];
  function search(y) {
    if (count >= limit) return;
    if (y === size) { count++; return; }
    for (const bits of candidates[y]) {
      chosen.push(bits);
      const valid = columns.every((clue, x) => {
        const prefix = chosen.map(row => row[x]).join('');
        for (let mask = 0; mask < 1 << (size - chosen.length); mask++) {
          const suffix = Array.from({ length: size - chosen.length }, (_, i) => mask & (1 << i) ? '1' : '0').join('');
          if (String(cluesFor(prefix + suffix)) === String(clue)) return true;
        }
        return false;
      });
      if (valid) search(y + 1);
      chosen.pop();
      if (count >= limit) return;
    }
  }
  search(0);
  return count;
}
