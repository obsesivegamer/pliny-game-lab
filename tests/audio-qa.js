// Pliny Game Lab — Deep Audio Synthesizer QA via Puppeteer
// Tests pure WebAudio procedural synthesis, 10 pavilion ambient soundscapes,
// classical acoustic instruments, and topbar mute/unmute controls.

import puppeteer from 'puppeteer';

const BASE_URL = process.env.PLINY_BASE_URL || 'http://localhost:8000';

async function runAudioQA() {
  console.log('════════════════════════════════════════════════════════');
  console.log('PLINY GAME LAB — PROCEDURAL WEBAUDIO SYNTHESIZER QA');
  console.log('════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  console.log(`1. Navigating to ${BASE_URL} ...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // 1. Verify Audio Toggle Button Presence & Initial State
  const audioBtnExists = await page.$('#audio-toggle-btn') !== null;
  const initialIcon = await page.$eval('#audio-toggle-btn', el => el.textContent.trim());
  console.log(`   Audio toggle button present: ${audioBtnExists ? '✓ YES' : '✗ NO'}`);
  console.log(`   Initial icon: ${initialIcon}`);

  // 2. Test Mute/Unmute Toggling via UI Click
  console.log('\n2. Testing UI Mute / Unmute interactions...');
  await page.click('#audio-toggle-btn');
  const mutedIcon = await page.$eval('#audio-toggle-btn', el => el.textContent.trim());
  const isMutedClass = await page.$eval('#audio-toggle-btn', el => el.classList.contains('muted'));
  console.log(`   After Click 1 (Mute) -> Icon: ${mutedIcon}, has 'muted' class: ${isMutedClass ? '✓ YES' : '✗ NO'}`);

  await page.click('#audio-toggle-btn');
  const unmutedIcon = await page.$eval('#audio-toggle-btn', el => el.textContent.trim());
  const isUnmutedClass = !await page.$eval('#audio-toggle-btn', el => el.classList.contains('muted'));
  console.log(`   After Click 2 (Unmute) -> Icon: ${unmutedIcon}, 'muted' class removed: ${isUnmutedClass ? '✓ YES' : '✗ NO'}`);

  // 3. Test Pure Web Audio Instrument Synthesis in Browser
  console.log('\n3. Testing procedural instrument synthesis methods...');
  const instrumentResults = await page.evaluate(async () => {
    const { soundMaster } = await import('./src/core/sound.js');
    await soundMaster.resume();

    const tests = [
      { name: 'Lyre (Karplus-Strong)', fn: () => soundMaster.playLyre('D4', 0.5) },
      { name: 'Aulos (Dual-Pipe Reed)', fn: () => soundMaster.playAulos(440, 0.5) },
      { name: 'Hydraulis (Alexandrian Water Organ)', fn: () => soundMaster.playHydraulis(330, 0.5) },
      { name: 'Salpinx (Bronze Fanfare Horn)', fn: () => soundMaster.playSalpinx(293.66, 0.5) },
      { name: 'Tympanum (Low-End Frame Drum)', fn: () => soundMaster.playTympanum() },
      { name: 'Crotala (Bronze Clapper)', fn: () => soundMaster.playCrotala() },
      { name: 'Chime (Hellenistic Temple Chime)', fn: () => soundMaster.playChime('A5', 0.3) },
      { name: 'Triumphant Launch Fanfare', fn: () => soundMaster.playLaunchFanfare() }
    ];

    const results = [];
    for (const t of tests) {
      try {
        const out = t.fn();
        results.push({ name: t.name, ok: out !== null });
      } catch (err) {
        results.push({ name: t.name, ok: false, error: err.message });
      }
    }
    return results;
  });

  instrumentResults.forEach(r => {
    console.log(`   [${r.ok ? '✓' : '✗'}] ${r.name}: ${r.ok ? 'Synthesized OK' : 'FAILED: ' + r.error}`);
  });

  // 4. Test Generative Ambient Soundscapes across all 10 Pavilions
  console.log('\n4. Testing generative ambient soundscapes for all 10 Pavilions...');
  const pavilionIds = [
    'ignis', 'bestiarium', 'mechanica', 'cosmographia', 'fabula',
    'mathematica', 'mare', 'architectura', 'alchemia', 'strategia'
  ];

  const ambientResults = await page.evaluate(async (pavs) => {
    const { soundMaster } = await import('./src/core/sound.js');
    await soundMaster.resume();

    const results = [];
    for (const p of pavs) {
      try {
        const ok = soundMaster.startPavilionAmbience(p);
        results.push({ pavilion: p, ok: !!ok });
      } catch (err) {
        results.push({ pavilion: p, ok: false, error: err.message });
      }
    }
    soundMaster.stopPavilionAmbience(0.1);
    return results;
  }, pavilionIds);

  ambientResults.forEach(r => {
    console.log(`   [${r.ok ? '✓' : '✗'}] Pavilion: ${r.pavilion} -> Ambience Active`);
  });

  // 5. Test Showcase -> Simulator Navigation Sound Triggering
  console.log('\n5. Testing navigation audio triggering & Soundscape HUD...');
  await page.click('.engine-card');
  await new Promise(r => setTimeout(r, 600));
  const simActive = !await page.$eval('#viewport-container', el => el.classList.contains('view-hidden'));
  console.log(`   Launched simulator from card click: ${simActive ? '✓ YES' : '✗ NO'}`);

  const activeSoundscapeTitle = await page.$eval('#soundscape-title', el => el.textContent.trim());
  console.log(`   Soundscape HUD active title: "${activeSoundscapeTitle}" -> ${activeSoundscapeTitle.length > 0 ? '✓ OK' : '✗ EMPTY'}`);

  // Test volume slider interaction
  const sliderExists = await page.$('#audio-volume-slider') !== null;
  console.log(`   Volume slider present in telemetry: ${sliderExists ? '✓ YES' : '✗ NO'}`);

  // Return to showcase
  await page.click('#showcase-nav-btn');
  await new Promise(r => setTimeout(r, 300));

  // Test Keyboard Navigation in Showcase
  console.log('\n6. Testing Keyboard Navigation & Shortcuts in Showcase...');
  // ArrowRight moves card focus
  await page.keyboard.press('ArrowRight');
  const focusedCard1 = await page.$('.engine-card.keyboard-focused');
  console.log(`   ArrowRight focuses engine card: ${focusedCard1 !== null ? '✓ YES' : '✗ NO'}`);

  // Quick jump to Pavilion 3 (Mechanica) with '3'
  await page.keyboard.press('3');
  await new Promise(r => setTimeout(r, 200));
  const activeChip3 = await page.$eval('.chip-btn.active', el => el.dataset.pav);
  console.log(`   Press '3' selects pavilion: "${activeChip3}" -> ${activeChip3 === 'mechanica' ? '✓ YES' : '✗ NO'}`);

  // Press 'A' to reset to All
  await page.keyboard.press('a');
  await new Promise(r => setTimeout(r, 200));
  const activeChipAll = await page.$eval('.chip-btn.active', el => el.dataset.pav);
  console.log(`   Press 'A' resets filter to: "${activeChipAll}" -> ${activeChipAll === 'all' ? '✓ YES' : '✗ NO'}`);

  // Hero floor plan: one room per pavilion
  const planRooms = await page.$$eval('#showcase-plan .plan-room', rooms => rooms.length);
  console.log(`   Hero floor plan rooms: ${planRooms} -> ${planRooms === 10 ? '✓ YES' : '✗ NO'}`);

  await browser.close();

  console.log('\n════════════════════════════════════════════════════════');
  const allInstrumentsOk = instrumentResults.every(r => r.ok);
  const allAmbienceOk = ambientResults.every(r => r.ok);
  const noErrors = consoleErrors.length === 0;

  if (allInstrumentsOk && allAmbienceOk && noErrors && audioBtnExists) {
    console.log('WEBAUDIO QA: ALL PROCEDURAL AUDIO SUITES PASSED CLEANLY');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log('════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.error('WEBAUDIO QA FAILED!');
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    }
    process.exit(1);
  }
}

runAudioQA().catch(err => {
  console.error('Fatal Audio QA Error:', err);
  process.exit(1);
});
