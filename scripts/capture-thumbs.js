// Captures showcase thumbnails from each engine's own canvas (no header, no
// controls panel) into assets/thumbs/<key>.webp. The showcase falls back to
// assets/screenshots/NN_<key>.png, so a new engine without a thumb still shows.
//
// Usage (with `python3 -m http.server 8000` running from the repo root):
//   node scripts/capture-thumbs.js                 # only engines missing a thumb
//   node scripts/capture-thumbs.js --all           # recapture everything
//   node scripts/capture-thumbs.js vesuvius aurum  # just these keys
// BASE_URL overrides the server address.
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'assets', 'thumbs');
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const WIDTH = 800;
const HEIGHT = 500;
const SETTLE_MS = 3500;

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter(a => !a.startsWith('--'));

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 880, deviceScaleFactor: 1 });

await page.goto(`${BASE_URL}/#showcase`, { waitUntil: 'networkidle0' });
const catalog = await page.evaluate(async () => {
  const { DEMOS } = await import('./src/core/hub.js');
  return Object.values(DEMOS).map(d => ({ key: d.id, exportName: d.exportName }));
});

const targets = catalog.filter(({ key }) => {
  if (only.length) return only.includes(key);
  return all || !fs.existsSync(path.join(OUT_DIR, `${key}.webp`));
});

let failed = 0;
for (const { key, exportName } of targets) {
  try {
    await page.goto(`${BASE_URL}/?thumb=${key}#game=${key}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      name => window.__hub?.currentEngine?.constructor.name === name,
      { timeout: 15000 },
      exportName
    );
    await new Promise(r => setTimeout(r, SETTLE_MS));
    const dataUrl = await page.evaluate((w, h) => {
      const src = document.getElementById('main-canvas');
      const target = w / h;
      let sw = src.width;
      let sh = sw / target;
      if (sh > src.height) {
        sh = src.height;
        sw = sh * target;
      }
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h);
      return out.toDataURL('image/webp', 0.82);
    }, WIDTH, HEIGHT);
    const file = path.join(OUT_DIR, `${key}.webp`);
    fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(`✓ ${key} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  } catch (err) {
    failed++;
    console.error(`✗ ${key}: ${err.message}`);
  }
}

await browser.close();
console.log(`\n${targets.length - failed}/${targets.length} thumbnails written to assets/thumbs/`);
process.exit(failed ? 1 : 0);
