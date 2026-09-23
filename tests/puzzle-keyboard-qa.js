import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const baseUrl = process.env.PLINY_BASE_URL || 'http://localhost:8000';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => localStorage.clear());

async function open(key, name) {
  await page.goto(`${baseUrl}/#game=${key}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(value => window.__hub?.currentEngine?.constructor.name === value, {}, name);
}
async function press(...keys) { for (const key of keys) await page.keyboard.press(key); }
async function won() {
  return page.evaluate(() => {
    const engine = window.__hub.currentEngine;
    return engine.spec.won(engine.state, engine.getLevel());
  });
}

try {
  await open('star_switch', 'StarSwitchEngine');
  await press('ArrowRight', 'ArrowDown', 'Enter');
  assert.equal(await won(), true, 'Star Switch is solvable from the keyboard');

  await open('number_forge', 'NumberForgeEngine');
  await press('ArrowLeft', 'Enter', 'ArrowRight', 'Enter', '+');
  await press('ArrowLeft', 'Enter', 'ArrowRight', 'Enter', '+');
  assert.equal(await won(), true, 'Number Forge supports keyboard selection and operations');

  await open('signal_route', 'SignalRouteEngine');
  await press('ArrowRight', 'ArrowRight', 'ArrowDown', 'Enter', 'Enter', 'Enter', 'r');
  assert.equal(await won(), true, 'Signal Route supports keyboard arrows and Run');

  await open('harbor_jam', 'HarborJamEngine');
  const harbor = () => page.evaluate(() => [document.body.dataset.view, window.__hub.currentEngine.state.selected]);
  await press('ArrowDown', 'ArrowDown', 'Enter');
  assert.deepEqual(await harbor(), ['simulator', 0], 'Enter picks up the courier boat');
  await press('Escape');
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.deepEqual(await harbor(), ['simulator', null], 'Esc lets go of the boat without leaving Harbor Jam');
  await press('ArrowRight', 'ArrowRight', 'ArrowRight', 'Enter');
  assert.deepEqual(await harbor(), ['simulator', 1], 'after letting go the cursor reaches another boat');
  await press('Escape', 'Escape');
  await page.waitForFunction(() => document.body.dataset.view === 'showcase');

  await open('stonefall', 'StonefallEngine');
  await page.evaluate(() => document.getElementById('pause-btn').click());
  const frozen = await page.evaluate(() => JSON.stringify(window.__hub.currentEngine.state));
  await press('ArrowLeft', 'ArrowUp', 'ArrowDown');
  await page.evaluate(() => document.querySelector('[data-stone-action="drop"]').click());
  assert.equal(await page.evaluate(() => JSON.stringify(window.__hub.currentEngine.state)), frozen,
    'the hub Pause button freezes Stonefall input as well as gravity');
  await page.evaluate(() => document.getElementById('pause-btn').click());
  await page.evaluate(() => document.querySelector('[data-stone-action="drop"]').click());
  assert.notEqual(await page.evaluate(() => JSON.stringify(window.__hub.currentEngine.state)), frozen);

  await open('oracle_words', 'OracleWordsEngine');
  const shortcuts = await page.evaluate(() => ['r', 'l', 'f', 'c'].map(key => {
    const event = new KeyboardEvent('keydown', { key, metaKey: true, cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }).concat(window.__hub.currentEngine.round.draft));
  assert.deepEqual(shortcuts, [false, false, false, false, ''], 'Cmd shortcuts reach the browser and type nothing');

  await page.goto(`${baseUrl}/#showcase`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.view === 'showcase');
  const filters = await page.evaluate(() => {
    const send = init => window.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));
    send({ key: 'p', metaKey: true });
    send({ key: 'p', ctrlKey: true });
    send({ key: 'c', metaKey: true });
    const afterShortcuts = [window.__hub.activePavilionFilter, window.__hub.codexDrawer.classList.contains('open')];
    send({ key: 'p' });
    return afterShortcuts.concat(window.__hub.activePavilionFilter);
  });
  assert.deepEqual(filters, ['all', false, 'puzzle'], 'Cmd/Ctrl+P and Cmd+C leave the showcase filter and codex alone');
  console.log('Puzzle keyboard browser: keyboard solves, Harbor Jam Esc, Stonefall pause, and shortcut guards pass');
} finally {
  await browser.close();
}
