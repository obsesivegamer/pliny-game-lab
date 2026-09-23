export const LEVELS = [
  { numbers: [1, 2, 3], target: 6 },
  { numbers: [2, 3, 4], target: 9 },
  { numbers: [2, 4, 5], target: 7 },
  { numbers: [3, 5, 8], target: 10 },
  { numbers: [2, 3, 4], target: 14 },
  { numbers: [3, 4, 5], target: 17 },
  { numbers: [2, 6, 8], target: 10 },
  { numbers: [3, 9, 7], target: 10 },
  { numbers: [2, 5, 9], target: 23 },
  { numbers: [4, 7, 8], target: 25 },
  { numbers: [6, 8, 3], target: 18 },
  { numbers: [4, 9, 12], target: 24 }
];

export function makeForgeState(level) { return { values: [...level.numbers], selected: [] }; }
export function selectStone(state, index) {
  if (index < 0 || index >= state.values.length) return state;
  const selected = state.selected.includes(index) ? state.selected.filter(value => value !== index) :
    [...state.selected.slice(-1), index];
  return { ...state, selected };
}
export function combineForge(state, first, second, operation) {
  if (first === second || first < 0 || second < 0 ||
    first >= state.values.length || second >= state.values.length) return state;
  const a = state.values[first], b = state.values[second];
  const result = operation === '+' ? a + b : operation === '-' ? a - b :
    operation === '*' ? a * b : operation === '/' && b !== 0 ? a / b : NaN;
  if (!Number.isInteger(result) || result < 1 || result > 100) return state;
  return { values: [...state.values.filter((_, index) => index !== first && index !== second), result], selected: [] };
}
export function forgeWon(state, level) {
  return state.values.length === 1 && state.values[0] === level.target;
}
export function solveForge(start, level) {
  if (forgeWon(start, level)) return [];
  if (start.values.length < 2) return null;
  for (let first = 0; first < start.values.length; first++) {
    for (let second = 0; second < start.values.length; second++) {
      if (first === second) continue;
      for (const operation of ['+', '-', '*', '/']) {
        const next = combineForge(start, first, second, operation);
        if (next === start) continue;
        const rest = solveForge(next, level);
        if (rest) return [{ first, second, operation }, ...rest];
      }
    }
  }
  return null;
}
