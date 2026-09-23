import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const baseUrl = process.env.PLINY_BASE_URL || 'http://localhost:8000';
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${baseUrl}/#game=oracle_words`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__hub?.currentEngine?.constructor.name === 'OracleWordsEngine');
  await page.waitForSelector('.puzzle-keyboard');
  const paintColors = await page.evaluate(() => {
    const canvas = document.getElementById('main-canvas');
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const colors = new Set();
    for (let i = 0; i < data.length; i += 400) {
      if (data[i + 3] > 0) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    }
    return colors.size;
  });
  assert.ok(paintColors >= 4, 'the puzzle board is drawn rather than a flat placeholder');

  const goal = await page.$eval('.puzzle-goal', element => element.textContent);
  assert.match(goal, /five-letter word/i);
  for (const letter of 'WATER') await page.click(`.puzzle-key[data-key="${letter}"]`);
  await page.click('.puzzle-key[data-key="Enter"]');
  const result = await page.evaluate(() => ({
    status: window.__hub.currentEngine.round.status,
    message: document.querySelector('.puzzle-status')?.textContent
  }));
  assert.equal(result.status, 'won', 'touch-sized on-screen controls can finish the first word');
  assert.match(result.message, /found|solved|great/i);

  await page.click('[data-action="next"]');
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.mode), 'daily');
  await page.click('.puzzle-key[data-key="A"]');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__hub?.currentEngine?.constructor.name === 'OracleWordsEngine');
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.round.draft), 'A',
    'the daily word keeps a partially typed guess on reload');

  await page.goto(`${baseUrl}/#showcase`, { waitUntil: 'networkidle0' });
  const catalog = await page.evaluate(() => ({
    keys: [...document.querySelectorAll('.engine-card')].map(card => card.dataset.key),
    ranks: [...document.querySelectorAll('.engine-card .card-rank')].map(badge => badge.textContent),
    total: document.querySelector('[data-stat="games"]')?.textContent,
    count: document.querySelector('#showcase-count')?.textContent,
    puzzleThumb: document.querySelector('.engine-card[data-key="oracle_words"] img')?.getAttribute('src'),
    oldThumb: document.querySelector('.engine-card[data-key="vesuvius"] img')?.getAttribute('src')
  }));
  assert.equal(catalog.keys.length, 60);
  assert.deepEqual(catalog.keys.slice(0, 10), [
    'oracle_words', 'canal_lines', 'stonefall', 'lantern_push', 'mirror_harbor',
    'mosaic_clues', 'harbor_jam', 'star_switch', 'number_forge', 'signal_route'
  ]);
  assert.equal(catalog.keys[10], 'vesuvius');
  assert.equal(catalog.keys[59], 'signal_fire');
  assert.equal(catalog.ranks[0], '#01');
  assert.equal(catalog.ranks[10], '#11');
  assert.equal(catalog.ranks[59], '#60');
  assert.equal(catalog.total, '60');
  assert.match(catalog.count, /60 games/);
  assert.equal(catalog.puzzleThumb, 'assets/screenshots/oracle_words.svg');
  assert.equal(catalog.oldThumb, 'assets/thumbs/vesuvius.webp');

  await page.click('#hero-launch-btn');
  await page.waitForFunction(() => window.__hub?.currentEngine?.constructor.name === 'OracleWordsEngine');
  assert.equal(new URL(page.url()).hash, '#game=oracle_words', 'the main play button opens the first puzzle');
  await page.click('#showcase-nav-btn');
  await page.click('.engine-card[data-key="canal_lines"]');
  await page.waitForFunction(() => window.__hub?.currentEngine?.constructor.name === 'CanalLinesEngine');
  assert.equal(new URL(page.url()).hash, '#game=canal_lines', 'a new puzzle card launches from the blueprint');

  const session = await page.createCDPSession();
  async function listenerCount(expression, type) {
    const { result } = await session.send('Runtime.evaluate', { expression });
    const { listeners } = await session.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    await session.send('Runtime.releaseObject', { objectId: result.objectId });
    return listeners.filter(listener => listener.type === type).length;
  }
  const panel = 'document.getElementById("dynamic-controls")';
  const canvas = 'document.getElementById("main-canvas")';
  const settled = [await listenerCount(panel, 'click'), await listenerCount(canvas, 'touchstart')];
  await page.evaluate(() => Promise.all([
    window.__hub.switchDemo('lantern_push'), window.__hub.switchDemo('mirror_harbor')
  ]));
  assert.equal(await page.evaluate(() => window.__hub.currentEngine.spec.key), 'mirror_harbor');
  assert.deepEqual([await listenerCount(panel, 'click'), await listenerCount(canvas, 'touchstart')], settled,
    'overlapping game switches leave exactly one live engine');
  assert.deepEqual(errors, [], 'playing the puzzle emits no browser errors');
  console.log('Puzzle browser: Oracle Words round and 60 ordered showcase cards pass');
} finally {
  await browser.close();
}
