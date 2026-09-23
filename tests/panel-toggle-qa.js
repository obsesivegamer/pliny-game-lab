// Pliny Game Lab — Desktop/mobile controls panel collapse ↔ expand
// Click path: Simulator → #game=vesuvius → #toggle-panel (collapse) → #toggle-panel (expand)
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const BASE_URL = process.env.PLINY_BASE_URL || 'http://localhost:8000';

function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
}

async function openSimulator(page) {
  await page.goto(`${BASE_URL}/#game=vesuvius`, { waitUntil: 'networkidle0', timeout: 20000 });
  await page.waitForFunction(() => {
    const hub = window.__hub;
    const viewport = document.getElementById('viewport-container');
    return hub?.currentEngine?.constructor?.name === 'VesuviusEngine'
      && viewport
      && !viewport.classList.contains('view-hidden');
  }, { timeout: 15000 });
}

async function inspectToggle(page) {
  return page.evaluate(() => {
    const button = document.getElementById('toggle-panel');
    const panel = document.getElementById('controls-panel');
    const desc = document.getElementById('demo-desc');
    const br = button.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const dr = desc.getBoundingClientRect();
    const cx = br.x + br.width / 2;
    const cy = br.y + br.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    const inViewport = (r) => r.width > 0 && r.height > 0
      && r.right > 0 && r.left < innerWidth
      && r.bottom > 0 && r.top < innerHeight;
    return {
      collapsed: panel.classList.contains('collapsed'),
      ariaExpanded: button.getAttribute('aria-expanded'),
      ariaLabel: button.getAttribute('aria-label'),
      text: button.textContent.trim(),
      toggle: { left: br.left, right: br.right, top: br.top, bottom: br.bottom, width: br.width, height: br.height },
      panel: { left: pr.left, right: pr.right, top: pr.top, bottom: pr.bottom, width: pr.width, height: pr.height },
      contentVisible: inViewport(dr) && getComputedStyle(desc).display !== 'none',
      toggleInViewport: inViewport(br),
      hitIsToggle: Boolean(hit) && (hit === button || button.contains(hit) || hit.id === 'toggle-panel'),
      hitId: hit?.id || hit?.tagName || null,
      innerWidth,
      innerHeight
    };
  });
}

async function clickToggle(page) {
  await page.click('#toggle-panel');
  await new Promise(r => setTimeout(r, 400)); // CSS transition is 250ms
}

async function assertExpandable(state, label) {
  assert.equal(state.collapsed, true, `${label}: panel should have .collapsed`);
  assert.equal(state.ariaExpanded, 'false', `${label}: aria-expanded should be false`);
  assert.equal(state.text, '+', `${label}: toggle glyph should be +`);
  assert.equal(state.contentVisible, false, `${label}: control content should be out of the way`);
  assert.ok(state.toggleInViewport, `${label}: #toggle-panel must remain inside the viewport`);
  assert.ok(state.hitIsToggle, `${label}: #toggle-panel must be the hit target at its center (got ${state.hitId})`);
}

async function assertExpanded(state, label) {
  assert.equal(state.collapsed, false, `${label}: panel should not have .collapsed`);
  assert.equal(state.ariaExpanded, 'true', `${label}: aria-expanded should be true`);
  assert.equal(state.text, '−', `${label}: toggle glyph should be −`);
  assert.equal(state.contentVisible, true, `${label}: panel description/content should be visible`);
  assert.ok(state.toggleInViewport, `${label}: #toggle-panel still in viewport`);
  assert.ok(state.hitIsToggle, `${label}: #toggle-panel still hittable`);
}

async function collapseThenExpand(page, label) {
  const before = await inspectToggle(page);
  console.log(`   ${label} initial:`, JSON.stringify(before));
  assertExpanded(before, `${label} initial`);

  await clickToggle(page);
  const collapsed = await inspectToggle(page);
  console.log(`   ${label} collapsed:`, JSON.stringify(collapsed));
  assertExpandable(collapsed, `${label} collapsed`);

  await clickToggle(page);
  const expanded = await inspectToggle(page);
  console.log(`   ${label} expanded:`, JSON.stringify(expanded));
  assertExpanded(expanded, `${label} expanded`);
}

async function run() {
  console.log('════════════════════════════════════════════════════════');
  console.log('PLINY GAME LAB — CONTROLS PANEL TOGGLE QA');
  console.log('Click path: #toggle-panel collapse → #toggle-panel expand');
  console.log('════════════════════════════════════════════════════════\n');

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    console.log('1. Desktop 1280x800 — collapse then expand...');
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
    await openSimulator(page);
    await collapseThenExpand(page, 'desktop');

    console.log('\n2. Mobile 375x667 — collapse then expand...');
    await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await openSimulator(page);
    await collapseThenExpand(page, 'mobile');

    console.log('\nPANEL TOGGLE QA: PASSED (desktop + mobile collapse/expand)');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('PANEL TOGGLE QA FAILED:', err.message);
  process.exit(1);
});
