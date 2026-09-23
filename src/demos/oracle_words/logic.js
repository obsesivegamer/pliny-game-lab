// Common English answer words, curated for this game. Guesses may be any five
// letters so a real word is never rejected by an incomplete local dictionary.
export const ANSWERS = `
  apple beach bloom bread brick brush cabin candy chair charm cloud coast coral
  crane crown dance dream drink earth flame flute forge fruit ghost glass globe
  grape grass green grove heart honey horse house ivory jelly juice knife
  lemon light linen magic mango maple metal mossy music ocean olive orbit
  paint pearl piano plane plant plume point power queen quiet river robin round
  scarf shell shore slate smile smoke snake solar sound spark spice spoon stone
  storm story sugar table thank thorn tiger torch tower train trail
  tulip under valve vivid voice water whale wheat wheel world woven yacht young
`.trim().split(/\s+/).map(word => word.toUpperCase());

export function evaluateGuess(answer, guess) {
  const target = answer.toUpperCase();
  const attempt = guess.toUpperCase();
  if (!/^[A-Z]{5}$/.test(target) || !/^[A-Z]{5}$/.test(attempt)) {
    throw new Error('Words must contain five letters.');
  }
  const marks = Array(5).fill('absent');
  const remaining = new Map();
  for (let i = 0; i < 5; i++) {
    if (attempt[i] === target[i]) marks[i] = 'correct';
    else remaining.set(target[i], (remaining.get(target[i]) || 0) + 1);
  }
  for (let i = 0; i < 5; i++) {
    if (marks[i] === 'correct') continue;
    const count = remaining.get(attempt[i]) || 0;
    if (count > 0) {
      marks[i] = 'present';
      remaining.set(attempt[i], count - 1);
    }
  }
  return marks;
}

export function createWordState(answer) {
  const target = String(answer).toUpperCase();
  if (!/^[A-Z]{5}$/.test(target)) throw new Error('Answer must contain five letters.');
  return { answer: target, rows: [], draft: '', status: 'playing', message: '' };
}

export function applyWordInput(state, key) {
  if (state.status !== 'playing') return state;
  if (key === 'Backspace') {
    return { ...state, draft: state.draft.slice(0, -1), message: '' };
  }
  if (key === 'Enter') {
    if (state.draft.length !== 5) return { ...state, message: 'Enter five letters.' };
    const marks = evaluateGuess(state.answer, state.draft);
    const rows = [...state.rows, { guess: state.draft, marks }];
    const won = state.draft === state.answer;
    return {
      ...state,
      rows,
      draft: '',
      status: won ? 'won' : rows.length === 6 ? 'lost' : 'playing',
      message: won ? 'You found the word!' : rows.length === 6 ? `The word was ${state.answer}.` : ''
    };
  }
  if (/^[a-z]$/i.test(key) && state.draft.length < 5) {
    return { ...state, draft: state.draft + key.toUpperCase(), message: '' };
  }
  return state;
}

export function wordForDate(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Date must be YYYY-MM-DD.');
  const day = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86400000);
  if (!Number.isFinite(day)) throw new Error('Invalid date.');
  return ANSWERS[((day % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
}

export function restoreDaily(answer, saved) {
  let data;
  try { data = JSON.parse(saved); } catch { return createWordState(answer); }
  if (!data || !Array.isArray(data.rows) || data.rows.length > 6 ||
    typeof data.draft !== 'string' || !/^[A-Z]{0,5}$/.test(data.draft)) return createWordState(answer);
  let state = createWordState(answer);
  for (const row of data.rows) {
    if (!row || typeof row.guess !== 'string' || !/^[A-Z]{5}$/.test(row.guess) ||
      state.status !== 'playing') return createWordState(answer);
    for (const letter of row.guess) state = applyWordInput(state, letter);
    state = applyWordInput(state, 'Enter');
  }
  if (state.status !== 'playing' && data.draft) return createWordState(answer);
  for (const letter of data.draft) state = applyWordInput(state, letter);
  return state;
}
