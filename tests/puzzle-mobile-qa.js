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

const GAMES = [
  ['oracle_words', 'OracleWordsEngine'], ['canal_lines', 'CanalLinesEngine'], ['stonefall', 'StonefallEngine'],
  ['lantern_push', 'LanternPushEngine'], ['mirror_harbor', 'MirrorHarborEngine'], ['mosaic_clues', 'MosaicCluesEngine'],
  ['harbor_jam', 'HarborJamEngine'], ['star_switch', 'StarSwitchEngine'], ['number_forge', 'NumberForgeEngine'],
  ['signal_route', 'SignalRouteEngine']
];
const apart = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
const nextFrames = () => page.evaluate(() =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function layout() {
  return page.evaluate(() => {
    const board = window.__hub.currentEngine.getRect();
    const canvas = document.getElementById('main-canvas').getBoundingClientRect();
    const box = element => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    };
    return {
      board: { left: canvas.left + board.x, top: canvas.top + board.y,
        right: canvas.left + board.x + board.width, bottom: canvas.top + board.y + board.height },
      canvas: box(document.getElementById('main-canvas')),
      panel: box(document.getElementById('controls-panel')),
      tab: box(document.getElementById('toggle-panel')),
      cell: board.cell
    };
  });
}

async function open(key, className) {
  await page.goto(`${baseUrl}/#game=${key}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(name => window.__hub?.currentEngine?.constructor.name === name, {}, className);
  await nextFrames();
  const size = page.viewport();
  const where = `${key} at ${size.width}x${size.height}`;
  const m = await layout();
  assert.ok(m.board.left >= m.canvas.left && m.board.top >= m.canvas.top &&
    m.board.right <= m.canvas.right && m.board.bottom <= m.canvas.bottom, `${where}: the board stays inside the canvas`);
  assert.ok(apart(m.board, m.panel), `${where}: the board stays clear of the controls panel ` +
    `(board ${Math.round(m.board.left)}-${Math.round(m.board.right)}, panel from ${Math.round(m.panel.left)})`);
  assert.ok(m.canvas.bottom - m.canvas.top >= 250, `${where}: the screen leaves room to see the puzzle board`);
  if (captureDir) await page.screenshot({ path: `${captureDir}/${key}-${size.width}x${size.height}.png` });
  return m;
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

  for (const [key, className] of GAMES.slice(3)) await open(key, className);

  // The controls float over the canvas on short landscape screens (issue #10:
  // 568-649px wide used to reserve nothing) and on desktop.
  for (const [width, height] of [[568, 320], [640, 360], [740, 360], [844, 390]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    for (const [key, className] of GAMES) {
      const m = await open(key, className);
      // Stonefall's tall well is height-bound here (14.4px cells at 568x320), not panel-bound.
      assert.ok(m.cell >= 14, `${key} at ${width}x${height}: the board stays readable (${m.cell.toFixed(1)}px cells)`);
    }
  }
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  for (const [key, className] of GAMES) await open(key, className);

  await page.click('#toggle-panel');
  await new Promise(resolve => setTimeout(resolve, 500));
  await nextFrames();
  const collapsed = await layout();
  const boardCentre = (collapsed.board.left + collapsed.board.right) / 2;
  const canvasCentre = (collapsed.canvas.left + collapsed.canvas.right) / 2;
  assert.ok(Math.abs(boardCentre - canvasCentre) < 2, 'a collapsed desktop panel gives the board back its centre');
  assert.ok(apart(collapsed.board, collapsed.tab), 'the collapsed panel tab stays clear of the board');
  assert.deepEqual(errors, [], 'phone play has no browser errors');
  console.log('Puzzle mobile: all 10 boards stay clear of the controls on phones, landscape phones and desktop; touch solves Canal and Oracle; Stonefall drops');
} finally {
  await browser.close();
}
