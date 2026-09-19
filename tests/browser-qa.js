// Pliny Game Lab — Browser Visual QA via Puppeteer
// Takes screenshots of all 50 engines and reports console errors
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:8000';
const SCREENSHOT_DIR = path.join(__dirname, '..', '.audit', 'screenshots');
const SETTLE_MS = 2500;  // Wait for engine to render a few frames
const VIEWPORT = { width: 1280, height: 800 };

// All 50 engine keys in order
const ENGINE_KEYS = [
  'vesuvius', 'geyser', 'caverna', 'terrae_motus', 'aurum',
  'bestiarium', 'myrmex', 'apis', 'hydra', 'silva',
  'mechanica', 'aqueduct', 'ballista', 'horologium', 'antikythera',
  'cosmographia', 'solstitium', 'aurora', 'cometa', 'armilla',
  'labyrinthus', 'colosseum', 'trireme', 'chariot', 'oraculum',
  'euclid', 'archimedes_spiral', 'eratosthenes', 'pythagoras', 'fractal_roman',
  'scylla_charybdis', 'mare_nostrum', 'pharos', 'coral_reef', 'nautilus',
  'forum_builder', 'arch_vault', 'opus_caementicium', 'thermae', 'pantheon',
  'vitrum', 'metallum', 'pigmentum', 'hermetica', 'electrum',
  'testudo', 'siege_tower', 'hoplite_phalanx', 'scorpio', 'signal_fire'
];

async function runBrowserQA() {
  // Create screenshot directory
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('════════════════════════════════════════════════════════');
  console.log(`PLINY GAME LAB — BROWSER VISUAL QA (${ENGINE_KEYS.length} ENGINES)`);
  console.log('════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Collect console errors per engine
  const results = [];
  let currentEngine = '';
  let consoleErrors = [];
  let consoleWarnings = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
    } else if (type === 'warning' && !text.includes('DevTools')) {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  // Navigate to the app
  console.log('Loading Pliny Game Lab...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (err) {
    console.error(`FATAL: Could not load ${BASE_URL}: ${err.message}`);
    await browser.close();
    process.exit(1);
  }

  // Wait for initial load
  await page.waitForSelector('#main-canvas', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log('App loaded. Starting engine walkthrough...\n');

  for (let i = 0; i < ENGINE_KEYS.length; i++) {
    const key = ENGINE_KEYS[i];
    consoleErrors = [];
    consoleWarnings = [];
    currentEngine = key;

    try {
      // Switch to engine via hub's switchDemo
      await page.evaluate(async (engineKey) => {
        // Access the hub instance — it's attached to window or we call switchDemo directly
        if (window.__hub) {
          if (window.__hub.launchDemo) {
            window.__hub.launchDemo(engineKey);
          } else {
            await window.__hub.switchDemo(engineKey);
          }
        } else {
          // Find the game-select dropdown and change it
          const gameSelect = document.getElementById('game-select');
          const pavilionSelect = document.getElementById('pavilion-select');

          // We need to find which pavilion this engine belongs to
          const allOptions = gameSelect.querySelectorAll('option');
          let found = false;
          for (const opt of allOptions) {
            if (opt.value === engineKey) {
              gameSelect.value = engineKey;
              gameSelect.dispatchEvent(new Event('change'));
              found = true;
              break;
            }
          }

          if (!found) {
            // Need to switch pavilion first
            const pavilions = pavilionSelect.querySelectorAll('option');
            for (const pOpt of pavilions) {
              pavilionSelect.value = pOpt.value;
              pavilionSelect.dispatchEvent(new Event('change'));
              // Check if engine is now in game dropdown
              await new Promise(r => setTimeout(r, 100));
              const newOptions = gameSelect.querySelectorAll('option');
              for (const opt of newOptions) {
                if (opt.value === engineKey) {
                  gameSelect.value = engineKey;
                  gameSelect.dispatchEvent(new Event('change'));
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
          }
        }
      }, key);

      await page.waitForFunction((engineKey) => {
        const hub = window.__hub;
        const EngineClass = hub?.engineCache[engineKey];
        const canvas = document.getElementById('main-canvas');
        return typeof EngineClass === 'function'
          && hub.activeKey === engineKey
          && hub.currentEngine instanceof EngineClass
          && hub.currentView === 'simulator'
          && canvas?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
          && canvas.getBoundingClientRect().width > 0
          && canvas.getBoundingClientRect().height > 0;
      }, { timeout: 15000 }, key);

      await page.evaluate(() => {
        const engine = window.__hub.currentEngine;
        const render = engine.render;
        window.__qaRenderedFrames = 0;
        engine.render = function (...args) {
          const result = render.apply(this, args);
          window.__qaRenderedFrames++;
          if (window.__qaRenderedFrames >= 3) this.render = render;
          return result;
        };
      });
      await page.waitForFunction(() => window.__qaRenderedFrames >= 3, { timeout: 5000 });
      await new Promise(r => setTimeout(r, SETTLE_MS));

      // Get telemetry data
      const telemetry = await page.evaluate(() => {
        const fpsEl = document.getElementById('fps-val');
        const entityEl = document.getElementById('entity-val');
        const titleEl = document.getElementById('demo-title');
        return {
          fps: fpsEl ? fpsEl.textContent : 'N/A',
          entities: entityEl ? entityEl.textContent : 'N/A',
          title: titleEl ? titleEl.textContent : 'N/A'
        };
      });

      // Check canvas is actually rendering (not blank)
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return { width: 0, height: 0, hasContent: false };
        const ctx = canvas.getContext('2d');
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let nonBlack = 0;
          let nonTransparent = 0;
          // Sample every 100th pixel for speed
          for (let j = 0; j < data.length; j += 400) {
            if (data[j] > 5 || data[j + 1] > 5 || data[j + 2] > 5) nonBlack++;
            if (data[j + 3] > 0) nonTransparent++;
          }
          const totalSampled = Math.floor(data.length / 400);
          return {
            width: canvas.width,
            height: canvas.height,
            hasContent: nonBlack > totalSampled * 0.01,  // At least 1% non-black
            nonBlackRatio: (nonBlack / totalSampled * 100).toFixed(1),
            nonTransparentRatio: (nonTransparent / totalSampled * 100).toFixed(1)
          };
        } catch (e) {
          return { width: canvas.width, height: canvas.height, hasContent: true, error: e.message };
        }
      });

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${String(i + 1).padStart(2, '0')}_${key}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Assess results
      const issues = [];
      if (consoleErrors.length > 0) {
        issues.push(`${consoleErrors.length} console error(s): ${consoleErrors.slice(0, 2).join('; ')}`);
      }
      if (!canvasInfo.hasContent) {
        issues.push(`Canvas appears blank (${canvasInfo.nonBlackRatio}% non-black)`);
      }
      if (telemetry.entities === '0' || telemetry.entities === 'N/A') {
        issues.push(`Entity count: ${telemetry.entities}`);
      }

      const status = issues.length > 0 ? (consoleErrors.length > 0 ? '✗' : '⚠') : '✓';
      const statusLine = `[${i + 1}/50] ${status} ${key} — ${telemetry.title} | FPS: ${telemetry.fps} | Entities: ${telemetry.entities} | Canvas: ${canvasInfo.nonBlackRatio}% filled`;

      if (issues.length > 0) {
        console.log(statusLine);
        issues.forEach(iss => console.log(`    ⚠️  ${iss}`));
      } else {
        console.log(statusLine);
      }

      results.push({
        key,
        title: telemetry.title,
        fps: telemetry.fps,
        entities: telemetry.entities,
        canvasFill: canvasInfo.nonBlackRatio,
        errors: consoleErrors.length,
        warnings: consoleWarnings.length,
        issues,
        screenshot: screenshotPath
      });

    } catch (err) {
      console.log(`[${i + 1}/50] ✗ ${key} — FATAL: ${err.message}`);
      results.push({
        key,
        title: '',
        fps: 'N/A',
        entities: 'N/A',
        canvasFill: '0',
        errors: 1,
        warnings: 0,
        issues: [`FATAL: ${err.message}`],
        screenshot: ''
      });
    }
  }

  await browser.close();

  // Summary
  const clean = results.filter(r => r.issues.length === 0).length;
  const withIssues = results.filter(r => r.issues.length > 0);

  console.log('\n════════════════════════════════════════════════════════');
  console.log(`BROWSER QA: ${clean} CLEAN | ${withIssues.length} WITH ISSUES (TOTAL ${results.length})`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('════════════════════════════════════════════════════════');

  if (withIssues.length > 0) {
    console.log('\n── ENGINES WITH ISSUES ──');
    for (const r of withIssues) {
      console.log(`\n⚠️  ${r.key} (${r.title}):`);
      r.issues.forEach(i => console.log(`  - ${i}`));
    }
  }

  // Write JSON report
  const reportPath = path.join(SCREENSHOT_DIR, '..', 'browser-qa-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nFull report: ${reportPath}`);
}

runBrowserQA().catch(err => {
  console.error('Fatal Browser QA Error:', err);
  process.exit(1);
});
