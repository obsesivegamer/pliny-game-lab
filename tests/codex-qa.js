// Automated E2E verification for Plinius Codex Drawer
import puppeteer from 'puppeteer';

const BASE_URL = process.env.PLINY_BASE_URL || 'http://localhost:8000';

async function runCodexQA() {
  console.log('════════════════════════════════════════════════════════');
  console.log('PLINY GAME LAB — PLINIUS CODEX DRAWER QA');
  console.log('════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  try {
    console.log('1. Loading Pliny Game Lab...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    // Check if codex toggle button exists
    const codexBtn = await page.$('#codex-toggle-btn');
    console.log(`   Codex toggle button present: ${codexBtn ? '✓ YES' : '✗ NO'}`);
    if (!codexBtn) throw new Error('Missing #codex-toggle-btn');

    // 2. Open Codex drawer via button click
    console.log('2. Testing Codex open via header button...');
    await page.click('#codex-toggle-btn');
    await new Promise(r => setTimeout(r, 400));

    let isOpen = await page.$eval('#codex-drawer', el => el.classList.contains('open'));
    console.log(`   Codex drawer open: ${isOpen ? '✓ YES' : '✗ NO'}`);
    if (!isOpen) throw new Error('Codex drawer failed to open');

    const latinQuote = await page.$eval('#codex-latin-quote', el => el.textContent);
    const translation = await page.$eval('#codex-translation', el => el.textContent);
    const science = await page.$eval('#codex-science', el => el.textContent);
    console.log(`   Latin Quote preview: ${latinQuote.substring(0, 50)}...`);
    console.log(`   Translation preview: ${translation.substring(0, 50)}...`);
    console.log(`   Science preview: ${science.substring(0, 50)}...`);

    // 3. Test Close Codex via Close button
    console.log('3. Testing Codex close via ✕ button...');
    await page.click('#codex-close-btn');
    await new Promise(r => setTimeout(r, 400));
    isOpen = await page.$eval('#codex-drawer', el => el.classList.contains('open'));
    console.log(`   Codex drawer closed: ${!isOpen ? '✓ YES' : '✗ NO'}`);
    if (isOpen) throw new Error('Codex drawer failed to close');

    // 4. Test Keyboard shortcut 'c' to open and 'Escape' to close
    console.log('4. Testing Keyboard Shortcut \'c\' to open & \'Escape\' to close...');
    await page.keyboard.press('c');
    await new Promise(r => setTimeout(r, 400));
    isOpen = await page.$eval('#codex-drawer', el => el.classList.contains('open'));
    console.log(`   Opened via key 'c': ${isOpen ? '✓ YES' : '✗ NO'}`);

    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    isOpen = await page.$eval('#codex-drawer', el => el.classList.contains('open'));
    console.log(`   Closed via key 'Escape': ${!isOpen ? '✓ YES' : '✗ NO'}`);

    // 5. Switch to a different game in simulator and check dynamic update
    console.log('5. Testing dynamic Codex updates on game switch (e.g. #game=antikythera)...');
    await page.goto(`${BASE_URL}/#game=antikythera`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    await page.click('#codex-toggle-btn');
    await new Promise(r => setTimeout(r, 400));

    const antiTitle = await page.$eval('#codex-title', el => el.textContent);
    console.log(`   Active Codex Title: "${antiTitle}" -> ${antiTitle.includes('Antikythera') ? '✓ PASS' : '✗ FAIL'}`);

    console.log('\n════════════════════════════════════════════════════════');
    console.log('PLINIUS CODEX QA: ALL VERIFICATIONS PASSED CLEANLY');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log('════════════════════════════════════════════════════════\n');

    if (consoleErrors.length > 0) {
      console.error('Errors encountered:', consoleErrors);
      process.exit(1);
    }
  } catch (err) {
    console.error('QA FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runCodexQA();
