# Pliny Game Lab Continuity Briefing

## [PLANS]
- 2026-09-16T00:30:00-04:00 [CODE] Complete all 50 game engines in Pliny Game Lab suite. COMPLETE.

## [DECISIONS]
- 2026-09-15T20:25:00-04:00 [USER] Restricted subagents to Gemini 3.8 Flash High (flash). Planning reserved for Opus 4.6 Thinking. Gemini 3.1 Pro excluded.
- 2026-09-15T20:28:00-04:00 [CODE] Converted Hub engine loading to dynamic async imports for instant boot and modular loading across 50 engines.
- 2026-09-16T00:24:00-04:00 [TOOL] Invoked Opus 4.6 Thinking subagent to author complete architectural specifications for all remaining 31 engines (.agent/SPECS_31_ENGINES.md) prior to Flash code worker dispatch.
- 2026-09-16T00:25:00-04:00 [CODE] Dispatched Flash code workers in parallel batches with Opus-authored mathematical and aesthetic specs.

## [PROGRESS]
- 2026-09-15T20:20:00-04:00 [TOOL] 5 initial engines verified green: vesuvius, bestiarium, cosmographia, mechanica, labyrinthus.
- 2026-09-15T20:36:00-04:00 [TOOL] 14 new engines landed and verified before weekly quota limit. (19/50 passed).
- 2026-09-16T00:24:00-04:00 [TOOL] Opus Game Design Architect completed .agent/SPECS_31_ENGINES.md.
- 2026-09-16T00:30:00-04:00 [TOOL] All remaining 31 engines landed and verified. 50/50 engines PASSED (0 failed, 0 pending).
- 2026-09-16T12:57:00-04:00 [TOOL] Puppeteer Browser Visual QA executed across all 50 engines in headless Chrome: 50/50 PASSED clean (0 errors, 0 warnings).
- 2026-09-16T13:45:00-04:00 [USER] Built Step 1B: Showcase Homepage modeled on Fable 5 Showcase with 50-card responsive grid, live search (hotkey /), 11 pavilion filter chips, hero stats, and seamless arcade simulator toggling. Verified clean across E2E and visual suites.
- 2026-09-16T15:20:00-04:00 [CODE] Upgraded chariot.js to 2,488-line monumental Circus Maximus Grand Prix simulation matching pavilion flagship standards (colosseum, trireme, antikythera). Added quadriga 4-horse harness kinematics, non-linear centrifugal drift, spina monuments with 7 turning delphines and 7 ova, Flaminian obelisk, 320+ animated spectators, 4 faction AI personalities, and telemetry HUD. Passes all 50/50 test suites.
- 2026-09-16T15:55:00-04:00 [CODE] Step 4 Completed: Built pure procedural Web Audio API synthesis engine (`src/core/sound.js`, 1,500+ lines). Implemented authentic Roman/Greek instruments (Karplus-Strong lyre, dual-pipe aulos, Alexandrian hydraulis, Roman salpinx, tympanum, crotala, UI chimes, and launch fanfare) and 10 ambient generative pavilion soundscapes. Wired top-bar `#audio-toggle-btn` mute/unmute, user interaction unlock, hover feedback, and simulation launch fanfare into `src/core/hub.js`. All headless tests and new `tests/audio-qa.js` Puppeteer suite pass 100% clean (0 console errors).
- 2026-09-16T16:10:00-04:00 [CODE] Step 2, B, and C Completed:
  - Step 2 (Cosmographia Upgrade): Expanded `src/demos/cosmographia/cosmographia.js` to 2,475 lines of monumental celestial mechanics with Ptolemaic epicycles/equants, Keplerian ellipses, Harmonia Mundi resonance web, and 800+ star celestial sphere.
  - Step B (Audio Polish): Added `#audio-volume-slider`, active soundscape HUD badge (`#audio-soundscape-pill`), smooth volume ramping, and pavilion soundscape names registry.
  - Step C (Showcase Polish): Added interactive golden constellation backdrop canvas (`#showcase-canvas`) with cursor magnetic webbing and full keyboard navigation (Arrow keys, Enter, 1-0 pavilion jumps, 'A' for all). All suites 100% green.
- 2026-09-16T16:27:00-04:00 [CODE] Upgraded `src/demos/labyrinthus/labyrinthus.js` to 4,677-line monumental Daedalian Cretan Labyrinth 3D Raycasting Engine. Pure Canvas 2D DDA raycaster with procedural Minoan wall textures (Knossos frescoes, Horns of Consecration, weathered limestone, bronze relief vault gates, obsidian sanctuary), autonomous Asterion the Minotaur AI with A* pathfinding and scent tracking across a 4-phase state machine (DORMANT, PROWLING, STALKING, CHARGE), Ariadne's Golden Thread (Mitos) with 2D geometric corner snapping, 4 Sacred Minoan Relics (Labrys, Mask of Minos, Daedalian Wings, Pithos), 2D Parchment Blueprint Minimap with Fog-of-War and threat radar, and self-contained WebAudio chiptune/drone synthesizer. Verified green on `verify-engines.js` and `visual-qa.js`.
- 2026-09-16T16:28:00-04:00 [CODE] Upgraded remaining early flagships to monumental scale:
  - `src/demos/vesuvius/vesuvius.js` (2,991 lines): 13-element thermodynamic cellular automata, Fourier heat diffusion, ballistic volcanic bombs, 3-stage convective Plinian plume, ground-hugging PDC avalanches, and Classis Misenensis Roman evacuation fleet under Pliny's command.
  - `src/demos/bestiarium/bestiarium.js` (3,567 lines): 6 Plinian species (Cervus, Leo, Griffin, Basilisk, Monoceros, Elephantus), Lotka-Volterra predator-prey dynamics, 2D scent-trail diffusion, and sensory perception cones.
  - `src/demos/mechanica/mechanica.js` (3,617 lines): 5 operational classical engineering machines (Polyspaston crane with MA=8, Heron's steam aeolipile, Archimedes water screw, temple sanctuary automatic siphon doors, and Vitruvian gear train with dynamic tension stress tensors and cable severing).
- 2026-09-16T16:29:00-04:00 [CODE] Built Plinius Codex slide-out parchment lore drawer (`src/core/codex.js`, `index.html`, `style.css`, `src/core/hub.js`) with authentic Latin excerpts, translations, and scientific models for all 50 simulations. Keyboard shortcut `C` / `Escape`. Verified 100% green on `tests/codex-qa.js`. Total codebase now 90,543 lines across 50 monumental simulations.
- 2026-09-16T17:03:00-04:00 [CODE] Deployed live to GitHub Pages at https://obsesivegamer.github.io/pliny-game-lab/. Created public repository `obsesivegamer/pliny-game-lab`, configured `.nojekyll`, staged `assets/screenshots/`, added Open Graph / Twitter Card social preview metadata, authored `README.md`, and added topics. Verified 100% clean live over HTTPS with Puppeteer (0 console errors).
- 2026-09-19T15:53:00-04:00 [CODE] Evaluated, visually verified, and squash-merged PR #3 (`fix: desktop controls panel can expand after collapse`, commit `666a21b`). Added hanging gold `+` tab on `#controls-panel.collapsed` on desktop (`@media (min-width: 769px)`), and landed `tests/panel-toggle-qa.js`. Verified clean across desktop (1280x800, 1920x1080), tablet (820x1180), and mobile (375x667). All 7 QA suites 100% green.
- 2026-09-19T16:36:00-04:00 [CODE] Addressed all 10 items from Claude review on PR #2 ('Evacuate Stabiae: Vesuvius gameplay loop', branch 'cursor/vesuvius-evacuate-stabiae-6ed5'). Fixed phase rewinding on controlled vent (monotonic target), prevented missed clicks from dumping lava into the bay, rebalanced loop tension (quota 70, capacity 20, requiring multi-trip evacuation through eruption phases), added persistent vent pressure relief, auto-disarmed berm tool, single-sourced mission.quota, hit-tested overlayButton, fixed zoom text scaling, and aligned AGENTS.md/codex.js docs. Merged origin/main cleanly, resolved mergeable state to MERGEABLE, marked PR ready for review, and verified all 7 test suites 100% green.
- 2026-09-19T16:45:00-04:00 [CODE] Addressed all 7 items from Claude re-review #2 on PR #2. Fixed volcanic lightning and shockwave NaN coordinates by passing canvas scale factors; restored repeated sandbox catastrophe phase triggers by removing monotonicity guard from shared engine method; restored on-canvas mission HUD readout (title, objective, citizen rescue count); disabled right-click blast trigger during mission mode; cleaned up syncGameplayChrome() and destroy() leftovers; simplified galleyDrawScale(isGameplay); tightened mission balance (quota 80, capacity 18, 9s vent delay, trip 2 hits Phase 4/5 eruption tension). Added full test coverage in tests/vesuvius-gameplay.js and verified clean across all 7 suites (41/41 unit/integration, browser smoke, 50/50 headless, 50/50 visual QA, showcase, codex, audio).
- 2026-09-19T18:37:00-04:00 [CODE] Filed issue #4 and opened PR #5 (`fix/mobile-viewport-layout`) for the mobile viewport. On a phone the simulator showed an empty black frame: the playfield was drawn underneath `#controls-panel`, which the mobile media query docks to the bottom 40% while keeping `position: absolute`. Vesuvius exposed it because its bay, fleet and landing rings sit in the bottom rows of the world (390x844@3x: galleys at y=626, panel top at y=543). Three causes fixed: the sheet now sits below the canvas in flow and `handleResize()` measures the canvas box (plus a `ResizeObserver`); `missionWorldView()` takes the canvas aspect so the near-square bay crop is never stretched (was 1.73:1 desktop, 1:2 phone); HUD, coach banner and result overlay draw through a new `uiScale()` so an 11px title stops rendering at 3.7 CSS px on a 3x screen. Narrow canvases also drop the VEI/plume column, the long title and the seismograph, and the hint toast moves into the sheet (`#hint-inline`). Added `tests/mobile-layout-qa.js` (4 viewports); it fails on main with `world is stretched 0.50:1`. All 8 suites green including 50/50 browser QA.

## [DISCOVERIES]
- 2026-09-15T20:19:00-04:00 [TOOL] Headless Node simulation requires guarding controlsContainer and DOM queries with typeof document !== 'undefined'.
- 2026-09-15T20:36:00-04:00 [TOOL] Test harness needed roundRect, clearRect, getImageData mocks for Canvas2D and full AudioParam/AudioNode mocks for WebAudio.
- 2026-09-16T00:26:00-04:00 [TOOL] Large subagent batch spikes trigger short-term concurrency 429 ("Resets in 0s"). Staggering into 5-6 worker batches prevents throttling.
- 2026-09-16T10:45:00-04:00 [CODE] Missing favicon caused 404 in browser console; resolved with inline SVG data URI favicon and root favicon.ico.
- 2026-09-16T10:47:00-04:00 [CODE] Vitrum engine negative radius in ctx.arc() fixed with Math.max(0, ...).
- 2026-09-16T10:48:00-04:00 [CODE] Hub animation loop wrapped in try/catch to isolate per-engine render faults and preserve telemetry.
- 2026-09-19T18:37:00-04:00 [CODE] A canvas with a percentage height inside an auto-height flex item resolves that percentage against its own backing store, which then feeds back into layout. The box and the bitmap end up different shapes and the browser silently rescales the drawing. Position the canvas `absolute; inset: 0` inside a `position: relative` stage instead.
- 2026-09-19T18:37:00-04:00 [CODE] `window.resize` is not enough to keep a canvas backing store in sync. Injecting an engine's controls or collapsing the mobile sheet changes the canvas box without any window resize, so the hub observes the canvas with a `ResizeObserver`. Measuring the box (not `#viewport-container`) is what keeps the two honest.
- 2026-09-19T18:37:00-04:00 [CODE] Canvas chrome drawn in backing-store pixels shrinks by the device pixel ratio: fixed `11px` text lands at 3.7 CSS px on a 3x phone. Screen-space UI should be drawn through a `ctx.scale(dpr, dpr)` with logical dimensions, and any rect kept for hit-testing converted back, since mouse coordinates arrive in backing pixels.

## [OUTCOMES]
- 50/50 engines completed and verified green across headless Node simulation and Puppeteer headless Chrome.
- 50/50 screenshots captured in .audit/screenshots/ at 1280x800.
- 10 Pavilions populated with 5 authentic simulations each:
  - I. Ignis & Terra: vesuvius, geyser, caverna, terrae_motus, aurum
  - II. Bestiarium & Silva: bestiarium, myrmex, apis, hydra, silva
  - III. Mechanica & Machina: mechanica, aqueduct, ballista, horologium, antikythera
  - IV. Cosmographia & Astra: cosmographia, solstitium, aurora, cometa, armilla
  - V. Fabula & Arena: labyrinthus, colosseum, trireme, chariot, oraculum
  - VI. Mathematica & Geometria: euclid, archimedes_spiral, eratosthenes, pythagoras, fractal_roman
  - VII. Mare Nostrum: scylla_charybdis, mare_nostrum, pharos, coral_reef, nautilus
  - VIII. Architectura & Structura: forum_builder, arch_vault, opus_caementicium, thermae, pantheon
  - IX. Alchemia & Mineralia: vitrum, metallum, pigmentum, hermetica, electrum
  - X. Strategia & Legio: testudo, siege_tower, hoplite_phalanx, scorpio, signal_fire
