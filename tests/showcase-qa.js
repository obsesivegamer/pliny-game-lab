// Pliny Game Lab — Showcase Homepage E2E Verification
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.PLINY_BASE_URL || 'http://localhost:8000';
const AUDIT_DIR = process.env.SHOWCASE_AUDIT_DIR || path.join(__dirname, '..', '.audit', 'showcase');
fs.mkdirSync(AUDIT_DIR, { recursive: true });

async function verifyShowcase() {
  console.log('════════════════════════════════════════════════════════');
  console.log('PLINY GAME LAB — SHOWCASE HOMEPAGE E2E VERIFICATION');
  console.log('════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  // 1. Initial Load
  console.log(`1. Loading ${BASE_URL} ...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  // Check showcase view is active by default
  const isShowcaseVisible = await page.evaluate(() => {
    const showcase = document.getElementById('showcase-view');
    const viewport = document.getElementById('viewport-container');
    return !showcase.classList.contains('view-hidden') && viewport.classList.contains('view-hidden');
  });
  console.log(`   Showcase View active by default: ${isShowcaseVisible ? '✓ YES' : '✗ NO'}`);
  if (!isShowcaseVisible) throw new Error('Showcase view was not active by default');

  // Check all puzzle and simulation cards rendered
  const cardCount = await page.evaluate(() => {
    return document.querySelectorAll('#showcase-grid .engine-card').length;
  });
  console.log(`   Total cards rendered: ${cardCount} / 60`);
  if (cardCount !== 60) throw new Error(`Expected 60 cards, found ${cardCount}`);

  // Check chips rendered
  const chipCount = await page.evaluate(() => {
    return document.querySelectorAll('#showcase-chips .chip-btn').length;
  });
  console.log(`   Total filter chips rendered: ${chipCount} (All + Puzzle Arcade + 10 Pavilions)`);
  if (chipCount !== 12) throw new Error(`Expected 12 filter chips, found ${chipCount}`);

  // Capture Hero & Top Screenshot
  await page.screenshot({ path: path.join(AUDIT_DIR, '01_showcase_hero.png') });
  console.log('   Captured hero screenshot: .audit/showcase/01_showcase_hero.png');

  // Scroll down and capture grid screenshot
  await page.evaluate(() => {
    document.getElementById('showcase-view').scrollTop = 600;
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(AUDIT_DIR, '02_showcase_grid.png') });
  console.log('   Captured grid screenshot: .audit/showcase/02_showcase_grid.png');

  // 2. Search Filter Test
  console.log('\n2. Testing live search filter ("antikythera")...');
  await page.evaluate(() => {
    document.getElementById('showcase-view').scrollTop = 0;
  });
  await page.type('#showcase-search', 'antikythera');
  await new Promise(r => setTimeout(r, 400));

  const searchResults = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#showcase-grid .engine-card'));
    const visible = cards.filter(c => c.offsetParent !== null);
    const countText = document.getElementById('showcase-count').textContent;
    return {
      count: visible.length,
      firstTitle: visible[0] ? visible[0].querySelector('.card-title').textContent : '',
      countText
    };
  });
  console.log(`   Search match count: ${searchResults.count} (${searchResults.countText})`);
  console.log(`   Matching title: ${searchResults.firstTitle}`);
  if (searchResults.count !== 1) throw new Error(`Expected 1 match for "antikythera", got ${searchResults.count}`);

  await page.screenshot({ path: path.join(AUDIT_DIR, '03_showcase_search.png') });

  // Clear search input
  await page.evaluate(() => {
    const input = document.getElementById('showcase-search');
    input.value = '';
    input.dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 400));

  // 3. Pavilion Chip Filter Test
  console.log('\n3. Testing Pavilion Chip filter ("alchemia")...');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('#showcase-chips .chip-btn'));
    const alchemiaChip = chips.find(c => c.dataset.pav === 'alchemia');
    if (alchemiaChip) alchemiaChip.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const chipResults = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#showcase-grid .engine-card'));
    const visible = cards.filter(c => c.offsetParent !== null);
    return {
      count: visible.length,
      titles: visible.map(c => c.querySelector('.card-title').textContent.trim())
    };
  });
  console.log(`   Alchemia Pavilion visible cards: ${chipResults.count} / 5`);
  console.log(`   Engines: ${chipResults.titles.join(', ')}`);
  if (chipResults.count !== 5) throw new Error(`Expected 5 cards for Alchemia, got ${chipResults.count}`);

  await page.screenshot({ path: path.join(AUDIT_DIR, '04_showcase_chip_filter.png') });

  // Reset to All
  await page.evaluate(() => {
    const allChip = document.querySelector('#showcase-chips .chip-btn[data-pav="all"]');
    if (allChip) allChip.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // 4. Engine Launch Test
  console.log('\n4. Testing engine launch from card click ("antikythera")...');
  await page.evaluate(() => {
    const card = document.querySelector('.engine-card[data-key="antikythera"]');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const simState = await page.evaluate(() => {
    const showcase = document.getElementById('showcase-view');
    const viewport = document.getElementById('viewport-container');
    const title = document.getElementById('demo-title').textContent;
    const hash = window.location.hash;
    return {
      showcaseHidden: showcase.classList.contains('view-hidden'),
      viewportVisible: !viewport.classList.contains('view-hidden'),
      activeTitle: title,
      hash
    };
  });
  console.log(`   Simulator active: ${simState.viewportVisible ? '✓ YES' : '✗ NO'}`);
  console.log(`   Active Engine Title: ${simState.activeTitle}`);
  console.log(`   URL Hash: ${simState.hash}`);
  if (!simState.viewportVisible || simState.hash !== '#game=antikythera') {
    throw new Error('Failed to launch engine to simulator view');
  }

  await page.screenshot({ path: path.join(AUDIT_DIR, '05_simulator_antikythera.png') });

  // 5. Return to Showcase via Nav Button
  console.log('\n5. Testing return to showcase via "🏛️ Showcase" button...');
  await page.click('#showcase-nav-btn');
  await new Promise(r => setTimeout(r, 800));

  const returnState = await page.evaluate(() => {
    const showcase = document.getElementById('showcase-view');
    const viewport = document.getElementById('viewport-container');
    const hash = window.location.hash;
    return {
      showcaseVisible: !showcase.classList.contains('view-hidden'),
      viewportHidden: viewport.classList.contains('view-hidden'),
      hash
    };
  });
  console.log(`   Returned to Showcase: ${returnState.showcaseVisible ? '✓ YES' : '✗ NO'}`);
  console.log(`   URL Hash: ${returnState.hash}`);
  if (!returnState.showcaseVisible) throw new Error('Failed to return to showcase');

  try {
    await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/#game=vesuvius`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hub?.currentEngine?.constructor.name === 'VesuviusEngine');
    const geometry = await page.evaluate(() => {
      const canvas = document.getElementById('main-canvas').getBoundingClientRect();
      const panel = document.getElementById('controls-panel').getBoundingClientRect();
      const target = document.elementFromPoint(canvas.left + canvas.width / 2, canvas.top + canvas.height * 0.3);
      return { canvas: canvas.toJSON(), panel: panel.toJSON(), target: target?.id };
    });
    console.log('Mobile panel geometry:', JSON.stringify(geometry));
    assert.equal(geometry.target, 'main-canvas', 'The upper phone canvas must receive touches');
    assert.ok(geometry.panel.top >= geometry.canvas.top + geometry.canvas.height * 0.6, 'Controls must leave at least 60% of the canvas exposed');
    for (let i = 0; i < 2; i++) {
      await page.tap('#toggle-panel');
      await new Promise(r => setTimeout(r, 300));
      const accessible = await page.$eval('#toggle-panel', button => {
        const r = button.getBoundingClientRect();
        return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth &&
          r.top >= 0 && r.bottom <= innerHeight && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === button;
      });
      assert.ok(accessible, 'The panel toggle must remain a reachable 44px touch target');
    }
    await page.screenshot({ path: path.join(AUDIT_DIR, '06_mobile_panel.png') });
  } finally {
    await browser.close();
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log(`SHOWCASE VERIFICATION: ALL 5 PHASES PASSED CLEANLY`);
  console.log(`Console Errors: ${errors.length}`);
  console.log(`Screenshots saved to: ${AUDIT_DIR}`);
  console.log('════════════════════════════════════════════════════════\n');
  assert.deepEqual(errors, [], 'showcase navigation emits no browser errors');
}

verifyShowcase().catch(err => {
  console.error('FATAL SHOWCASE QA ERROR:', err);
  process.exit(1);
});
