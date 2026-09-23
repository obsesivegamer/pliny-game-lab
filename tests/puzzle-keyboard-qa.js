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
  console.log('Puzzle keyboard browser: Star Switch, Number Forge, and Signal Route pass');
} finally {
  await browser.close();
}
