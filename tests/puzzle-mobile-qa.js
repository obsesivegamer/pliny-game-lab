import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const baseUrl = process.env.PLINY_BASE_URL || 'http://localhost:8000';
const captureDir = process.env.PLINY_QA_DIR;
if (captureDir) await fs.mkdir(captureDir, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => localStorage.clear());
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

async function open(key, className) {
  await page.goto(`${baseUrl}/#game=${key}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(name => window.__hub?.currentEngine?.constructor.name === name, {}, className);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const metrics = await page.evaluate(() => {
    const engine = window.__hub.currentEngine;
    const rect = engine.getRect?.();
    const canvas = document.getElementById('main-canvas');
    const panel = document.getElementById('controls-panel');
    return { rect, canvasWidth: canvas.clientWidth, canvasHeight: canvas.clientHeight,
      panelHeight: panel.getBoundingClientRect().height, viewportHeight: innerHeight };
  });
  if (metrics.rect) {
    assert.ok(metrics.rect.x >= 0 && metrics.rect.y >= 0);
    assert.ok(metrics.rect.x + metrics.rect.width <= metrics.canvasWidth);
    assert.ok(metrics.rect.y + metrics.rect.height <= metrics.canvasHeight);
  }
  assert.ok(metrics.canvasHeight >= 250, 'the phone leaves room to see the puzzle board');
  if (captureDir) await page.screenshot({ path: `${captureDir}/${key}-phone.png` });
}

async function tapCell(x, y) {
  const [px, py] = await page.evaluate(([x, y]) => {
    const board = window.__hub.currentEngine.getRect();
    const canvas = document.getElementById('main-canvas').getBoundingClientRect();
    return [canvas.left + board.x + (x + 0.5) * board.cell,
      canvas.top + board.y + (y + 0.5) * board.cell];
  }, [x, y]);
  await page.touchscreen.tap(px, py);
}

async function tapButton(selector) {
  const point = await page.$eval(selector, element => {
    element.scrollIntoView({ block: 'center' });
    const rect = element.getBoundingClientRect();
    return [rect.left + rect.width / 2, rect.top + rect.height / 2];
  });
  await page.touchscreen.tap(...point);
}

try {
  await open('canal_lines', 'CanalLinesEngine');
  const route = await page.evaluate(() => window.__hub.currentEngine.getLevel().solution.slice(1));
  for (const [x, y] of route) await tapCell(x, y);
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.spec.won(
    window.__hub.currentEngine.state, window.__hub.currentEngine.getLevel())), true,
  'a phone touch can complete the canal');

  await open('oracle_words', 'OracleWordsEngine');
  for (const letter of 'WATER') await tapButton(`.puzzle-key[data-key="${letter}"]`);
  await tapButton('.puzzle-key[data-key="Enter"]');
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.round.status), 'won',
    'phone touches can complete the word');

  await open('stonefall', 'StonefallEngine');
  await tapButton('[data-stone-action="drop"]');
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.state.grid.some(Boolean)), true,
    'the phone drop button locks a stone');

  for (const [key, className] of [
    ['lantern_push', 'LanternPushEngine'],
    ['mirror_harbor', 'MirrorHarborEngine'],
    ['mosaic_clues', 'MosaicCluesEngine'],
    ['harbor_jam', 'HarborJamEngine'],
    ['star_switch', 'StarSwitchEngine'],
    ['number_forge', 'NumberForgeEngine'],
    ['signal_route', 'SignalRouteEngine'],
  ]) await open(key, className);

  await page.setViewport({ width: 740, height: 360, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await open('canal_lines', 'CanalLinesEngine');
  const landscape = await page.evaluate(() => {
    const board = window.__hub.currentEngine.getRect();
    const canvas = document.getElementById('main-canvas').getBoundingClientRect();
    const panel = document.getElementById('controls-panel').getBoundingClientRect();
    return { cell: board.cell, canvasHeight: canvas.height,
      boardRight: canvas.left + board.x + board.width, panelLeft: panel.left };
  });
  assert.ok(landscape.cell >= 24 && landscape.canvasHeight >= 250,
    'phone landscape leaves a readable puzzle board');
  assert.ok(landscape.boardRight < landscape.panelLeft - 4,
    'phone landscape keeps the board clear of the controls');
  assert.deepEqual(errors, [], 'phone play has no browser errors');
  console.log('Puzzle mobile: all 10 games fit a phone, touch solves Canal and Oracle, Stonefall drops, and landscape remains legible');
} finally {
  await browser.close();
}
