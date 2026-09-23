import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMOS, PAVILIONS } from '../src/core/hub.js';
import { buildCatalog } from '../src/core/showcase.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newGames = [
  'oracle_words', 'canal_lines', 'stonefall', 'lantern_push', 'mirror_harbor',
  'mosaic_clues', 'harbor_jam', 'star_switch', 'number_forge', 'signal_route'
];
const legacyGames = [
  'vesuvius', 'geyser', 'caverna', 'terrae_motus', 'aurum',
  'bestiarium', 'myrmex', 'apis', 'hydra', 'silva',
  'mechanica', 'aqueduct', 'ballista', 'horologium', 'antikythera',
  'cosmographia', 'solstitium', 'aurora', 'cometa', 'armilla',
  'labyrinthus', 'colosseum', 'trireme', 'chariot', 'oraculum',
  'euclid', 'archimedes_spiral', 'eratosthenes', 'pythagoras', 'fractal_roman',
  'scylla_charybdis', 'mare_nostrum', 'pharos', 'coral_reef', 'nautilus',
  'forum_builder', 'arch_vault', 'opus_caementicium', 'thermae', 'pantheon',
  'vitrum', 'metallum', 'pigmentum', 'hermetica', 'electrum',
  'testudo', 'siege_tower', 'hoplite_phalanx', 'scorpio', 'signal_fire'
];

const keys = Object.keys(DEMOS);
assert.deepEqual(keys, [...newGames, ...legacyGames], 'new games lead and legacy links keep their order');
assert.equal(PAVILIONS.length, 11, 'the puzzle group joins the ten existing pavilions');
assert.equal(PAVILIONS[0].id, 'puzzle');
assert.deepEqual(PAVILIONS[0].games, newGames);
assert.deepEqual(PAVILIONS.slice(1).flatMap(pavilion => pavilion.games), legacyGames);

const groups = buildCatalog(DEMOS, PAVILIONS);
assert.equal(groups[0].numeral, 'P', 'the arcade has its own blueprint room label');
assert.deepEqual(groups[0].games.map(game => game.room),
  Array.from({ length: 10 }, (_, index) => String(index + 1).padStart(2, '0')));
assert.equal(groups[1].numeral, 'I', 'the original pavilions retain their Roman numerals');
assert.equal(groups[1].games[0].room, 101, 'old room labels are preserved');
assert.equal(groups[1].games[0].overall, 11, 'the old first game moves to rank 11');
assert.equal(groups[10].games.at(-1).overall, 60);

for (const key of keys) {
  const demo = DEMOS[key];
  assert.ok(demo.thumb, `${key} needs an order-independent thumbnail path`);
  assert.ok(fs.existsSync(path.join(root, demo.thumb)), `${key} thumbnail is missing: ${demo.thumb}`);
  assert.ok(fs.existsSync(path.join(root, 'src', 'demos', key, `${key}.js`)), `${key} engine is missing`);
}

console.log('Puzzle catalog: 10 new games, 50 preserved games, 60 working thumbnails');
