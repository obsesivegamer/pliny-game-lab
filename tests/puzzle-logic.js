import assert from 'node:assert/strict';
import {
  ANSWERS, evaluateGuess, createWordState, applyWordInput, wordForDate, restoreDaily
} from '../src/demos/oracle_words/logic.js';

assert.ok(ANSWERS.length >= 90);
assert.equal(new Set(ANSWERS).size, ANSWERS.length, 'daily answers do not repeat');
assert.ok(ANSWERS.every(word => /^[A-Z]{5}$/.test(word)), 'every daily answer has five letters');

assert.deepEqual(
  evaluateGuess('APPLE', 'PAPAL'),
  ['present', 'present', 'correct', 'absent', 'present'],
  'a repeated guessed letter must not receive more clues than the answer contains'
);

let word = createWordState('STONE');
for (const letter of 'STONE') word = applyWordInput(word, letter);
word = applyWordInput(word, 'Enter');
assert.equal(word.status, 'won');
assert.deepEqual(word.rows[0].marks, ['correct', 'correct', 'correct', 'correct', 'correct']);
assert.equal(applyWordInput(word, 'A'), word, 'a finished round rejects further input');

word = createWordState('STONE');
word = applyWordInput(word, 'S');
word = applyWordInput(word, 'Enter');
assert.equal(word.rows.length, 0, 'short guesses are not submitted');
assert.equal(word.draft, 'S', 'a short guess stays editable');
word = applyWordInput(word, 'Backspace');
assert.equal(word.draft, '');

word = createWordState('STONE');
for (let turn = 0; turn < 6; turn++) {
  for (const letter of 'WATER') word = applyWordInput(word, letter);
  word = applyWordInput(word, 'Enter');
}
assert.equal(word.status, 'lost', 'the sixth unsuccessful guess ends the round');
assert.equal(word.rows.length, 6);

const daily = wordForDate('2026-09-22');
assert.equal(daily, wordForDate('2026-09-22'), 'the same local date has a stable word');
assert.equal(daily.length, 5);
const cycle = Array.from({ length: ANSWERS.length }, (_, day) =>
  ANSWERS.indexOf(wordForDate(new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10))));
assert.equal(new Set(cycle).size, ANSWERS.length, 'every answer appears once per cycle of days');
const neighbours = cycle.slice(1).filter((index, day) => Math.abs(index - cycle[day]) <= 2).length;
assert.ok(neighbours < 10, 'tomorrow\'s word is not a list neighbour of today\'s');

const saved = JSON.stringify({ rows: [{ guess: 'WATER' }], draft: 'A' });
const restored = restoreDaily('STONE', saved);
assert.equal(restored.rows[0].guess, 'WATER');
assert.equal(restored.draft, 'A');
assert.deepEqual(restoreDaily('STONE', '{bad json'), createWordState('STONE'));
assert.deepEqual(restoreDaily('STONE', JSON.stringify({ rows: [{ guess: '12345' }] })), createWordState('STONE'));

console.log('Oracle Words: duplicate clues, editing, win/loss, and daily selection pass');
