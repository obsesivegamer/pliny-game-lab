import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:8000';
const OUT = path.resolve(__dirname, '..', '.audit', 'vesuvius-gameplay');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

console.log('1. Showcase → Vesuvius launch');
await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 20000 });
await page.waitForSelector('#showcase-grid .engine-card[data-key="vesuvius"]', { timeout: 10000 });
await page.click('#showcase-grid .engine-card[data-key="vesuvius"]');
await page.waitForSelector('#mission-objective', { timeout: 15000 });
await page.waitForFunction(() => window.__hub?.currentEngine?.mission?.mode === 'gameplay', { timeout: 15000 });
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => {
  const panel = document.getElementById('controls-panel');
  if (panel) panel.classList.add('collapsed');
});
await new Promise((r) => setTimeout(r, 400));

const ui = await page.evaluate(() => {
  const obj = document.getElementById('mission-objective');
  const vents = document.getElementById('mission-vents');
  const restart = document.getElementById('btn-restart-mission');
  const sandbox = document.getElementById('sandbox-tools');
  const engine = window.__hub?.currentEngine;
  return {
    objective: obj?.textContent?.trim() || '',
    vents: vents?.textContent?.trim() || '',
    hasRestart: !!restart,
    sandboxClosed: sandbox ? !sandbox.open : null,
    mode: engine?.mission?.mode,
    status: engine?.mission?.status,
    shipStates: (engine?.fleet || []).map((g) => g.state),
    viewHidden: document.getElementById('viewport-container')?.classList.contains('view-hidden')
  };
});
console.log(JSON.stringify(ui, null, 2));
assert.match(ui.objective, /Stabiae/);
assert.equal(ui.mode, 'gameplay');
assert.equal(ui.status, 'playing');
assert.equal(ui.hasRestart, true);
assert.equal(ui.viewHidden, false);
assert.ok(ui.shipStates.every((s) => s === 'idle'));
assert.equal(ui.sandboxClosed, true);

const entry = await page.evaluate(() => {
  const e = window.__hub.currentEngine;
  const c = e.canvas;
  return {
    ships: e.fleet.map((g) => ({ name: g.name, x: g.x, y: g.y })),
    canvas: { w: c.width, h: c.height },
    entities: e.getEntityCount(),
    plume: e.plumeParticles.length
  };
});
console.log('   entry', JSON.stringify(entry));
assert.ok(entry.ships.every((s) => s.x > 190 && s.x < 270), 'galleys should sit in the bay, not on the far clip edge');

await page.screenshot({ path: path.join(OUT, '01_mission_entry.png') });
console.log('   captured 01_mission_entry.png');

console.log('2. Select galley (coach should name Stabiae) then order');
await page.evaluate(() => {
  const engine = window.__hub.currentEngine;
  const ship = engine.fleet[0];
  const c = engine.canvas;
  const toPos = (sx, sy) => ({
    x: (sx / engine.simWidth) * c.width,
    y: (sy / engine.simHeight) * c.height
  });
  engine.onMouseMove(toPos(ship.x, ship.y));
  engine.onMouseDown(toPos(ship.x, ship.y));
  engine.onMouseUp(toPos(ship.x, ship.y));
  engine.render(engine.ctx);
});
const selected = await page.evaluate(() => window.__hub.currentEngine.mission.selectedShip);
assert.equal(selected, 0);
await page.screenshot({ path: path.join(OUT, '01b_galley_selected.png') });
console.log('   captured 01b_galley_selected.png');

await page.evaluate(() => {
  const panel = document.getElementById('controls-panel');
  if (panel) panel.classList.remove('collapsed');
});
await page.click('#btn-vent');
await new Promise((r) => setTimeout(r, 200));
const afterVent = await page.evaluate(() => document.getElementById('mission-vents')?.textContent);
assert.match(afterVent, /Vents 2/);

await page.evaluate(() => {
  const engine = window.__hub.currentEngine;
  const ship = engine.fleet[0];
  const c = engine.canvas;
  const toPos = (sx, sy) => ({
    x: (sx / engine.simWidth) * c.width,
    y: (sy / engine.simHeight) * c.height
  });
  engine.onMouseDown(toPos(215, ship.y));
  engine.onMouseUp(toPos(215, ship.y));
});
await new Promise((r) => setTimeout(r, 400));
const ordered = await page.evaluate(() => {
  const ship = window.__hub.currentEngine.fleet[0];
  return { state: ship.state, orderedX: ship.orderedX, selected: window.__hub.currentEngine.mission.selectedShip };
});
console.log('   order', ordered);
assert.equal(ordered.selected, 0);
assert.ok(ordered.state === 'sailing' || ordered.state === 'rescuing');
assert.ok(Math.abs(ordered.orderedX - 215) < 2);

await page.screenshot({ path: path.join(OUT, '02_ship_ordered.png') });

console.log('3. Restart restores a playable mission');
await page.click('#btn-restart-mission');
await new Promise((r) => setTimeout(r, 300));
const afterReset = await page.evaluate(() => {
  const e = window.__hub.currentEngine;
  return {
    status: e.mission.status,
    rescued: e.mission.rescued,
    vents: e.mission.ventCharges,
    shipsIdle: e.fleet.every((g) => g.state === 'idle' && g.alive)
  };
});
assert.equal(afterReset.status, 'playing');
assert.equal(afterReset.rescued, 0);
assert.equal(afterReset.vents, 3);
assert.equal(afterReset.shipsIdle, true);

console.log('4. Win overlay with Restart');
await page.evaluate(() => {
  const e = window.__hub.currentEngine;
  e.mission.rescued = e.mission.quota;
  e.update(0.016);
  e.render(e.ctx);
});
const overlay = await page.evaluate(() => {
  const e = window.__hub.currentEngine;
  return { status: e.mission.status, hasButton: !!e.overlayButton };
});
assert.equal(overlay.status, 'won');
assert.equal(overlay.hasButton, true);
await page.screenshot({ path: path.join(OUT, '03_win_overlay.png') });
console.log('   captured 03_win_overlay.png');

console.log('5. Ultra-Plinian ash budget on the live engine');
await page.click('#btn-restart-mission');
await new Promise((r) => setTimeout(r, 200));
const climax = await page.evaluate(() => {
  const e = window.__hub.currentEngine;
  e.mission.time = 38;
  e.setEruptionPhase(4);
  e.plumeHeightKm = 32;
  e.targetPlumeKm = 32;
  for (let i = 0; i < 180; i++) e.update(0.016);
  e.render(e.ctx);
  const bayY = e.simHeight * 0.62;
  const overBay = e.plumeParticles.filter((p) => p.x > e.waterlineX - 4 && p.y > bayY).length;
  return {
    entities: e.getEntityCount(),
    ca: e.activeParticles,
    plume: e.plumeParticles.length,
    bayAsh: overBay,
    kinematic: e.getEntityCount() - e.activeParticles,
    hudEntities: document.getElementById('entity-val')?.textContent || null
  };
});
await page.evaluate(() => {
  const panel = document.getElementById('controls-panel');
  if (panel) panel.classList.add('collapsed');
});
await new Promise((r) => setTimeout(r, 400));
fs.writeFileSync(path.join(OUT, 'readability-counts.json'), JSON.stringify({
  baseline: { source: 'Jeremy demo screenshot', entities: 27718 },
  liveUltraPlinian: climax
}, null, 2));
console.log('   climax', climax);
assert.ok(climax.plume > 80, `live column missing, plume=${climax.plume}`);
assert.ok(climax.plume <= 720, `live plume ${climax.plume} over cap`);
assert.ok(climax.bayAsh <= 40, `live bay ash ${climax.bayAsh}`);
assert.ok(climax.entities < 20000, `live entities ${climax.entities} still in soup range`);
await page.screenshot({ path: path.join(OUT, '04_ultra_plinian_budget.png') });
console.log('   captured 04_ultra_plinian_budget.png');

const gameplayErrors = errors.filter((t) => !t.includes('favicon') && !t.includes('404'));
if (gameplayErrors.length) {
  console.error(gameplayErrors);
  throw new Error(`page errors: ${gameplayErrors.join(' | ')}`);
}

console.log('\nVESUVIUS BROWSER SMOKE — passed');
await browser.close();
