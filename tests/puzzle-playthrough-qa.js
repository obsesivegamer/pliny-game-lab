import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const baseUrl = process.env.PLINY_BASE_URL || 'http://localhost:8000';
const captureDir = process.env.PLINY_QA_DIR;
if (captureDir) await fs.mkdir(captureDir, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.evaluateOnNewDocument(() => localStorage.clear());

async function open(key, className) {
  await page.goto(`${baseUrl}/#game=${key}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(name => window.__hub?.currentEngine?.constructor.name === name, {}, className);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = await page.evaluate(() => ({
    count: window.__hub.currentEngine.getEntityCount(),
    title: document.querySelector('#demo-title')?.textContent,
    controls: document.querySelector('.puzzle-controls')?.textContent.length
  }));
  assert.ok(state.count > 0 && state.controls > 0, `${key} has a board and controls`);
  if (captureDir) await page.screenshot({ path: `${captureDir}/${key}-desktop.png` });
}

async function clickCell(x, y) {
  const point = await page.evaluate(([x, y]) => {
    const board = window.__hub.currentEngine.getRect();
    const canvas = document.getElementById('main-canvas').getBoundingClientRect();
    return [canvas.left + board.x + (x + 0.5) * board.cell,
      canvas.top + board.y + (y + 0.5) * board.cell];
  }, [x, y]);
  await page.mouse.click(...point);
}

async function assertWin(key) {
  const result = await page.evaluate(() => {
    const engine = window.__hub.currentEngine;
    return { won: engine.spec.won(engine.state, engine.getLevel()), state: engine.state };
  });
  assert.equal(result.won, true, `${key} can be solved through the visible controls: ${JSON.stringify(result.state)}`);
}

try {
  await open('canal_lines', 'CanalLinesEngine');
  const canalRoute = await page.evaluate(() => window.__hub.currentEngine.getLevel().solution.slice(1));
  for (const [x, y] of canalRoute) await clickCell(x, y);
  await assertWin('canal_lines');

  await open('lantern_push', 'LanternPushEngine');
  const lanternMoves = await page.evaluate(async () => {
    const logic = await import('./src/demos/lantern_push/logic.js');
    const engine = window.__hub.currentEngine;
    return logic.solveLantern(engine.state, engine.getLevel());
  });
  for (const move of lanternMoves) await page.click(`[data-puzzle-action="${move}"]`);
  await assertWin('lantern_push');

  await open('mirror_harbor', 'MirrorHarborEngine');
  const mirrors = await page.evaluate(() => {
    const level = window.__hub.currentEngine.getLevel();
    return level.flipped.map(index => level.mirrors[index].slice(0, 2));
  });
  for (const [x, y] of mirrors) await clickCell(x, y);
  await assertWin('mirror_harbor');

  await open('mosaic_clues', 'MosaicCluesEngine');
  const filled = await page.evaluate(() => {
    const rows = window.__hub.currentEngine.getLevel().rows;
    return rows.flatMap((row, y) => [...row].flatMap((bit, x) => bit === '1' ? [[x, y]] : []));
  });
  for (const [x, y] of filled) await clickCell(x, y);
  await assertWin('mosaic_clues');

  await open('harbor_jam', 'HarborJamEngine');
  const harborMoves = await page.evaluate(async () => {
    const logic = await import('./src/demos/harbor_jam/logic.js');
    const engine = window.__hub.currentEngine;
    return logic.solveHarbor(engine.state, engine.getLevel());
  });
  for (const [boat, offset] of harborMoves) {
    const head = await page.evaluate(index => {
      const engine = window.__hub.currentEngine;
      return engine.spec ? [engine.getLevel().vehicles[index].axis === 'h' ? engine.state.positions[index] : engine.getLevel().vehicles[index].fixed,
        engine.getLevel().vehicles[index].axis === 'v' ? engine.state.positions[index] : engine.getLevel().vehicles[index].fixed] : null;
    }, boat);
    await clickCell(...head);
    const axis = await page.evaluate(index => window.__hub.currentEngine.getLevel().vehicles[index].axis, boat);
    const direction = axis === 'h' ? offset > 0 ? 'Right' : 'Left' : offset > 0 ? 'Down' : 'Up';
    for (let step = 0; step < Math.abs(offset); step++) await page.click(`[data-puzzle-action="${direction}"]`);
  }
  await assertWin('harbor_jam');

  await open('star_switch', 'StarSwitchEngine');
  const starMoves = await page.evaluate(async () => {
    const logic = await import('./src/demos/star_switch/logic.js');
    const engine = window.__hub.currentEngine;
    return logic.solveStars(engine.state, engine.getLevel().size);
  });
  for (const [x, y] of starMoves) await clickCell(x, y);
  await assertWin('star_switch');

  await open('number_forge', 'NumberForgeEngine');
  const forgeMoves = await page.evaluate(async () => {
    const logic = await import('./src/demos/number_forge/logic.js');
    const engine = window.__hub.currentEngine;
    return logic.solveForge(engine.state, engine.getLevel());
  });
  for (const { first, second, operation } of forgeMoves) {
    await clickCell(first, 0);
    await clickCell(second, 0);
    await page.click(`[data-puzzle-action="${operation}"]`);
  }
  await assertWin('number_forge');

  await open('signal_route', 'SignalRouteEngine');
  const arrows = await page.evaluate(() => Object.entries(window.__hub.currentEngine.getLevel().solutionArrows));
  for (const [cell, direction] of arrows) {
    const [x, y] = cell.split(',').map(Number);
    for (let turn = 0; turn < 5; turn++) {
      const actual = await page.evaluate(id => window.__hub.currentEngine.state.arrows[id], cell);
      if (actual === direction) break;
      await clickCell(x, y);
    }
  }
  await page.click('[data-puzzle-action="run"]');
  await assertWin('signal_route');

  await open('stonefall', 'StonefallEngine');
  await page.click('[data-stone-action="drop"]');
  const stone = await page.evaluate(() => window.__hub.currentEngine.state);
  assert.ok(stone.grid.some(Boolean), 'dropping the first stone locks it into the board');
  assert.ok(stone.active.type === 'L', 'the next stone appears');

  const thumbs = await page.evaluate(async () => {
    const { DEMOS } = await import('./src/core/hub.js');
    return Promise.all(Object.values(DEMOS).map(async demo => {
      const response = await fetch(demo.thumb);
      return [demo.id, response.status, response.headers.get('content-type')];
    }));
  });
  assert.ok(thumbs.every(([, status, type]) => status === 200 && type?.startsWith('image/')),
    'all sixty cards have loadable images');
  if (captureDir) {
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/#showcase`, { waitUntil: 'domcontentloaded' });
    await page.$eval('#showcase-bar', element => element.scrollIntoView());
    await page.screenshot({ path: `${captureDir}/showcase-desktop.png` });
  }
  assert.deepEqual(errors, [], 'all games load and play without browser errors');
  console.log('Puzzle playthrough: eight first levels, Stonefall drop, and 60 image URLs pass');
} finally {
  await browser.close();
}
