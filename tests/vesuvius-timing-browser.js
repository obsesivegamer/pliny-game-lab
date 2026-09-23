import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
});

try {
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle0' });
  await page.click('#showcase-grid .engine-card[data-key="vesuvius"]');
  await page.waitForFunction(() => window.__hub?.currentEngine?.constructor.name === 'VesuviusEngine' && window.__hub.currentEngine.simStepCount > 0);
  await page.evaluate(() => {
    const hub = window.__hub;
    document.getElementById('controls-panel').classList.add('collapsed');
    hub.isPaused = true;
    const e = hub.currentEngine;
    e.reset();
    e._setSeed(99999);
  });
  await pause(400);
  const simPoint = (x, y) => page.evaluate(({ x, y }) => {
    const e = window.__hub.currentEngine;
    const p = e.toCanvas(x, y);
    const rect = e.canvas.getBoundingClientRect();
    return { x: rect.left + p.x * rect.width / e.canvas.width, y: rect.top + p.y * rect.height / e.canvas.height };
  }, { x, y });
  const ship = await page.evaluate(() => ({ x: window.__hub.currentEngine.fleet[0].x, y: window.__hub.currentEngine.fleet[0].y }));
  const shipPoint = await simPoint(ship.x, ship.y);
  await page.mouse.click(shipPoint.x, shipPoint.y);
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.mission.selectedShip), 0, 'canvas click selects the flagship');
  const townPoint = await simPoint(252, ship.y);
  await page.mouse.click(townPoint.x, townPoint.y);
  console.log('CANVAS_CLICKS', JSON.stringify({ shipPoint, townPoint, state: await page.evaluate(({ x, y }) => ({
    selected: window.__hub.currentEngine.mission.selectedShip,
    orderedX: window.__hub.currentEngine.fleet[0].orderedX,
    target: document.elementFromPoint(x, y)?.outerHTML?.slice(0, 180),
    tool: window.__hub.currentEngine.mission.tool
  }), townPoint) }));
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.fleet[0].orderedX), 252, 'canvas click orders pickup');

  const pickup = await page.evaluate(() => {
    const e = window.__hub.currentEngine;
    let loading = false;
    for (let i = 0; i < 600 && e.fleet[0].cargo === 0; i++) {
      e.update(1 / 60);
      loading ||= e.fleet[0].state === 'rescuing';
    }
    e.update(1 / 120);
    return { loading, cargo: e.fleet[0].cargo, steps: e.simStepCount, rescued: e.mission.rescued };
  });
  assert.equal(pickup.loading, true);
  assert.ok(pickup.cargo > 0, 'ship picked up civilians');
  console.log('PICKUP', JSON.stringify(pickup));

  const snapshot = () => page.evaluate(() => {
    const e = window.__hub.currentEngine;
    let gridHash = 0;
    for (const cell of e.grid) gridHash = (Math.imul(gridHash, 31) + cell) | 0;
    return {
      steps: e.simStepCount,
      time: e.time,
      remainder: e.simAccumulator,
      missionTime: e.mission.time,
      cargo: e.fleet[0].cargo,
      civilians: e.mission.civiliansAtStabiae,
      gridHash
    };
  });
  const beforeResize = await snapshot();
  for (const viewport of [
    { width: 390, height: 844, deviceScaleFactor: 1 },
    { width: 844, height: 390, deviceScaleFactor: 3 },
    { width: 1280, height: 800, deviceScaleFactor: 1 }
  ]) {
    await page.setViewport(viewport);
    await page.waitForFunction((dpr) => {
      const e = window.__hub.currentEngine;
      const c = e.canvas;
      return e.dpr === dpr && c.width === Math.round(c.clientWidth * dpr) && c.height === Math.round(c.clientHeight * dpr);
    }, {}, viewport.deviceScaleFactor);
    assert.deepEqual(await snapshot(), beforeResize, 'resize preserves mission, cargo, world and fixed-step remainder');
    console.log('RESIZE', JSON.stringify({ ...viewport, state: await snapshot() }));
  }

  const offload = await page.evaluate(() => {
    const e = window.__hub.currentEngine;
    let unloading = false;
    for (let i = 0; i < 1200 && e.mission.rescued === 0; i++) {
      e.update(1 / 60);
      unloading ||= e.fleet[0].state === 'offloading';
    }
    return { unloading, rescued: e.mission.rescued, cargo: e.fleet[0].cargo, status: e.mission.status };
  });
  assert.equal(offload.unloading, true);
  assert.ok(offload.rescued > 0, 'citizens offloaded into rescued total');
  console.log('OFFLOAD', JSON.stringify(offload));

  await page.evaluate(() => { window.__hub.isPaused = false; });
  const liveStart = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  await pause(250);
  const liveEnd = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  assert.ok(liveEnd > liveStart, 'hub resumes the engine');
  await page.click('#pause-btn');
  const paused = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  await pause(250);
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.simStepCount), paused, 'hub pause stops steps');
  await page.click('#pause-btn');
  await pause(250);
  assert.ok((await page.evaluate(() => window.__hub.currentEngine.simStepCount)) > paused, 'hub resume advances');
  console.log('PAUSE_RESUME', JSON.stringify({ liveStart, liveEnd, paused }));

  await page.click('#codex-toggle-btn');
  const helpBefore = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  await pause(250);
  const helpAfter = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  assert.equal(await page.evaluate(() => window.__hub.codexDrawer.classList.contains('open')), true, 'Codex drawer opens');
  assert.equal(helpAfter, helpBefore, 'Codex drawer suspends simulation');
  await page.click('#codex-close-btn');
  await pause(250);
  assert.ok((await page.evaluate(() => window.__hub.currentEngine.simStepCount)) > helpAfter, 'closing Codex resumes simulation');
  await page.click('#pause-btn');
  const held = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  await page.click('#codex-toggle-btn');
  await pause(250);
  await page.click('#codex-close-btn');
  await pause(250);
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.simStepCount), held, 'closing Codex preserves explicit pause');
  assert.equal(await page.evaluate(() => window.__hub.isPaused), true, 'Codex leaves the Pause setting intact');
  await page.click('#pause-btn');
  console.log('HELP', JSON.stringify({ helpBefore, helpAfter, explicitPauseHeld: held }));

  await page.evaluate(() => window.__hub.switchView('showcase'));
  const away = await page.evaluate(() => window.__hub.currentEngine.simStepCount);
  await pause(250);
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.simStepCount), away, 'showcase suspends engine updates');
  await page.evaluate(() => window.__hub.switchView('simulator'));
  await pause(250);
  assert.ok((await page.evaluate(() => window.__hub.currentEngine.simStepCount)) > away, 'return to simulator resumes');
  console.log('SHOWCASE', JSON.stringify({ stepsWhileAway: away }));

  const background = await browser.newPage();
  await background.bringToFront();
  const hiddenBefore = await page.evaluate(() => ({ hidden: document.hidden, steps: window.__hub.currentEngine.simStepCount }));
  await pause(300);
  const hiddenAfter = await page.evaluate(() => ({ hidden: document.hidden, steps: window.__hub.currentEngine.simStepCount }));
  await page.evaluate(() => {
    const e = window.__hub.currentEngine;
    const update = e.update.bind(e);
    window.__resumeUpdates = [];
    e.update = (dt) => {
      const before = e.simStepCount;
      update(dt);
      window.__resumeUpdates.push({ dt, steps: e.simStepCount - before });
    };
  });
  await page.bringToFront();
  await pause(200);
  const resumeUpdates = await page.evaluate(() => window.__resumeUpdates);
  if (hiddenBefore.hidden && hiddenAfter.hidden) {
    assert.equal(hiddenAfter.steps, hiddenBefore.steps, 'hidden tab does not advance the engine');
    assert.ok(resumeUpdates.length > 0, 'foreground resumes updates');
    assert.ok(resumeUpdates[0].dt <= 0.1 && resumeUpdates[0].steps <= 6, 'first resumed update respects catch-up bound');
  }
  console.log('TAB_VISIBILITY', JSON.stringify({ hiddenBefore, hiddenAfter, firstResume: resumeUpdates[0] || null }));
  await background.close();

  await page.evaluate(async () => {
    await window.__hub.switchDemo('geyser');
    await window.__hub.switchDemo('vesuvius');
    window.__hub.isPaused = true;
  });
  const fresh = await page.evaluate(() => {
    const e = window.__hub.currentEngine;
    return { engine: e.constructor.name, steps: e.simStepCount, rescued: e.mission.rescued, cargo: e.fleet[0].cargo };
  });
  assert.equal(fresh.engine, 'VesuviusEngine');
  assert.ok(fresh.steps <= 1, 'new engine starts without timing debt');
  assert.equal(fresh.rescued, 0);
  assert.equal(fresh.cargo, 0);
  console.log('NEW_INSTANCE', JSON.stringify(fresh));

  const retry = await page.evaluate(() => {
    const e = window.__hub.currentEngine;
    e.update(1 / 120);
    document.getElementById('btn-restart-mission').click();
    return { steps: e.simStepCount, remainder: e.simAccumulator, status: e.mission.status };
  });
  assert.deepEqual(retry, { steps: 0, remainder: 0, status: 'playing' });
  console.log('RETRY', JSON.stringify(retry));

  const terminal = await page.evaluate(() => {
    const e = window.__hub.currentEngine;
    e.mission.rescued = e.mission.quota;
    e.update(1 / 60);
    const won = { status: e.mission.status, time: e.mission.time, rescued: e.mission.rescued, charges: e.mission.ventCharges };
    for (let i = 0; i < 60; i++) e.update(1 / 30);
    const wonAfter = { status: e.mission.status, time: e.mission.time, rescued: e.mission.rescued, charges: e.mission.ventCharges };
    e.reset();
    for (const ship of e.fleet) { ship.health = 0; ship.alive = false; }
    e.update(1 / 60);
    const lost = { status: e.mission.status, time: e.mission.time, rescued: e.mission.rescued, charges: e.mission.ventCharges };
    for (let i = 0; i < 60; i++) e.update(1 / 30);
    const lostAfter = { status: e.mission.status, time: e.mission.time, rescued: e.mission.rescued, charges: e.mission.ventCharges };
    e.setPlayMode('sandbox');
    e.update(1 / 60);
    return { won, wonAfter, lost, lostAfter, sandbox: { mode: e.mission.mode, steps: e.simStepCount } };
  });
  assert.equal(terminal.won.status, 'won');
  assert.deepEqual(terminal.wonAfter, terminal.won, 'forced browser win stays settled');
  assert.equal(terminal.lost.status, 'lost');
  assert.deepEqual(terminal.lostAfter, terminal.lost, 'forced browser loss stays settled');
  assert.deepEqual(terminal.sandbox, { mode: 'sandbox', steps: 1 }, 'sandbox updates after mode switch');
  console.log('TERMINAL_AND_SANDBOX', JSON.stringify(terminal));

  assert.deepEqual(errors, [], 'browser console/page errors and warnings');
  console.log('BROWSER_TIMING_PASSED');
} finally {
  await browser.close();
}
