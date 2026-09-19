// Pliny Game Lab — mobile viewport layout
// Regression guard for #4: on a phone the controls sheet covered the canvas, so
// the Vesuvius bay, its fleet and both landing rings were drawn underneath it.
// Checks the canvas box, the world aspect and the HUD's physical text size.
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:8000';

const VIEWPORTS = [
  { name: 'phone portrait', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'phone landscape', width: 740, height: 360, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'small tablet', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 2 }
];

function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
}

async function openSimulator(page) {
  // domcontentloaded, not networkidle0: the engine's own readiness is asserted
  // below, and idle-waiting is flaky across repeated loads on one server.
  await page.goto(`${BASE_URL}/#game=vesuvius`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => {
    const hub = window.__hub;
    const viewport = document.getElementById('viewport-container');
    return hub?.currentEngine?.constructor?.name === 'VesuviusEngine'
      && viewport
      && !viewport.classList.contains('view-hidden');
  }, { timeout: 15000 });
  // Let the layout settle after the engine injects its controls.
  await new Promise((r) => setTimeout(r, 1200));
}

async function measure(page) {
  return page.evaluate(() => {
    const engine = window.__hub.currentEngine;
    const canvas = document.getElementById('main-canvas');
    const panel = document.getElementById('controls-panel');
    const cr = canvas.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const view = engine.worldView();

    const toPage = (simX, simY) => {
      const p = engine.toCanvas(simX, simY);
      return {
        x: p.x / canvas.width * cr.width + cr.left,
        y: p.y / canvas.height * cr.height + cr.top
      };
    };
    // The sheet spans the full width on mobile; the desktop aside does not, so
    // only a full-width panel can hide the playfield.
    const sheetCoversWidth = pr.width >= cr.width - 1;
    const clear = (pt) => pt.x >= cr.left && pt.x <= cr.right
      && pt.y >= cr.top && pt.y <= cr.bottom
      && (!sheetCoversWidth || pt.y <= pr.top);

    const waterY = engine.simHeight - 28;
    return {
      canvas: { width: cr.width, height: cr.height, backingW: canvas.width, backingH: canvas.height },
      // Backing store must match its box, or the browser rescales the bitmap.
      backingMatchesBox: Math.abs(canvas.width / canvas.height - cr.width / cr.height) < 0.02,
      // World must not be stretched: canvas px per sim cell equal on both axes.
      worldStretch: (cr.width / view.w) / (cr.height / view.h),
      sheetOverlap: sheetCoversWidth ? Math.max(0, cr.bottom - pr.top) : 0,
      fleetClear: engine.fleet.every((g) => clear(toPage(g.x, g.y))),
      stabiaeClear: clear(toPage(252, waterY)),
      offloadClear: clear(toPage(202, waterY)),
      // Measure the painted HUD bar, not the arithmetic that positions it. The
      // bar is stroked gold (#D4AF37) along its top and bottom; the gap between
      // those lines is its height, which must come back as the 46/56 CSS px the
      // code asks for. Deriving this from uiScale() would be circular:
      // 11 * dpr / (cssWidth * dpr) * cssWidth is 11 at every dpr, so that form
      // of the assert still passes with the scaling deleted.
      hudBarCssPx: (() => {
        const ictx = canvas.getContext('2d');
        const scale = canvas.width / cr.width;
        // Stop above the coach banner at y=74, whose gold border shares this column.
        const depth = Math.min(canvas.height, Math.round(70 * scale));
        const px = ictx.getImageData(Math.round(20 * scale), 0, 1, depth).data;
        const gold = [];
        for (let y = 0; y < depth; y++) {
          const r = px[y * 4], g = px[y * 4 + 1], b = px[y * 4 + 2];
          // Tight match: the ash sky gradient carries gold-ish tones that a loose
          // tolerance picks up above the bar.
          if (Math.abs(r - 212) < 18 && Math.abs(g - 175) < 18 && Math.abs(b - 55) < 22) gold.push(y);
        }
        return gold.length < 2 ? null : (gold[gold.length - 1] - gold[0]) / scale;
      })(),
      hintToastVisible: getComputedStyle(document.getElementById('hint-overlay')).display !== 'none',
      hintInlineText: (document.getElementById('hint-inline')?.textContent || '').trim().length
    };
  });
}

async function run() {
  const browser = await launchBrowser();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      await openSimulator(page);
      const m = await measure(page);

      assert.ok(m.backingMatchesBox, `${vp.name}: canvas backing store ${m.canvas.backingW}x${m.canvas.backingH} does not match its ${Math.round(m.canvas.width)}x${Math.round(m.canvas.height)} box`);
      assert.ok(Math.abs(m.worldStretch - 1) < 0.05, `${vp.name}: world is stretched ${m.worldStretch.toFixed(2)}:1`);
      assert.equal(m.sheetOverlap, 0, `${vp.name}: controls sheet covers ${Math.round(m.sheetOverlap)}px of the canvas`);
      assert.ok(m.fleetClear, `${vp.name}: at least one galley is hidden behind the controls sheet`);
      assert.ok(m.stabiaeClear, `${vp.name}: the Stabiae landing mark is hidden behind the controls sheet`);
      assert.ok(m.offloadClear, `${vp.name}: the OFFLOAD landing mark is hidden behind the controls sheet`);
      // 46 narrow / 56 wide, per renderHUD. Without the CSS-pixel transform the
      // painted bar comes back dpr times smaller.
      const expectedBar = m.canvas.width < 560 ? 46 : 56;
      assert.ok(m.hudBarCssPx !== null, `${vp.name}: could not find the HUD bar's gold border`);
      assert.ok(Math.abs(m.hudBarCssPx - expectedBar) <= 4, `${vp.name}: HUD bar paints ${m.hudBarCssPx.toFixed(1)} CSS px, expected ~${expectedBar}`);

      const mobile = vp.width <= 768;
      assert.equal(m.hintToastVisible, !mobile, `${vp.name}: hint toast visibility should be ${!mobile}`);
      if (mobile) {
        assert.ok(m.hintInlineText > 0, `${vp.name}: the sheet must carry the hint text the toast drops`);
      }

      // Collapsing the sheet hands its height back to the canvas; the loop has
      // to pick that up without leaving the backing store stale.
      if (mobile) {
        await page.click('#toggle-panel');
        await new Promise((r) => setTimeout(r, 700));
        const c = await measure(page);
        assert.ok(c.canvas.height > m.canvas.height + 20, `${vp.name}: collapsing the sheet did not grow the canvas (${Math.round(m.canvas.height)} -> ${Math.round(c.canvas.height)})`);
        assert.ok(c.backingMatchesBox, `${vp.name}: backing store went stale after collapse`);
        assert.ok(Math.abs(c.worldStretch - 1) < 0.05, `${vp.name}: world stretched ${c.worldStretch.toFixed(2)}:1 after collapse`);
        assert.equal(c.sheetOverlap, 0, `${vp.name}: collapsed sheet still covers the canvas`);
      }

      console.log(`  ✓ ${vp.name} (${vp.width}x${vp.height}@${vp.deviceScaleFactor}x) — canvas ${Math.round(m.canvas.width)}x${Math.round(m.canvas.height)}, stretch ${m.worldStretch.toFixed(2)}, HUD bar ${m.hudBarCssPx.toFixed(1)}px`);
      await page.close();
    }
    console.log('\nMOBILE LAYOUT QA: PASSED (playfield clear of the controls sheet, world unstretched, HUD legible)');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('MOBILE LAYOUT QA FAILED:', err.message);
  process.exit(1);
});
