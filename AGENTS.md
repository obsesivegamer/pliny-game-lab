# Repository guidance

## Run and verify

- This is a static browser ES-module app, not an npm-built app. Run `python3 -m http.server 8000` from the repository root. There is no build step, npm script, configured linter, formatter, or typechecker.
- Browser QA needs `npm ci` and Puppeteer's browser installation. The locked Puppeteer version requires Node >=22.12.0. Running the app itself needs no npm install.
- Headless checks need no HTTP server: `node tests/verify-engines.js` and `node tests/visual-qa.js`. The latter instruments mocked Canvas calls; it is not a real-browser visual test. Neither runner accepts an engine-filter argument.
- With the server running, `./scripts/verify-all.sh` checks HTTP, syntax-checks selected modules, runs the Vesuvius gameplay smoke (`tests/vesuvius-gameplay.js`), then runs `verify-engines.js`. It appends `.audit/verification.log`; it does not run the other QA suites. Syntax-check changed JavaScript separately with `node --check <file>`.
- Run browser suites separately against their hardcoded `http://localhost:8000`: `node tests/showcase-qa.js`, `node tests/codex-qa.js`, `node tests/audio-qa.js`, `node tests/vesuvius-browser-smoke.js`, `node tests/panel-toggle-qa.js`, `node tests/mobile-layout-qa.js`, and `node tests/browser-qa.js`. The last visits all 50 engines with a 2.5-second wait per engine.
- `mobile-layout-qa.js` guards the viewport contract at four sizes: the canvas backing store matches its CSS box, the mission world is not aspect-stretched, and the mobile controls sheet does not cover the canvas. It asserts against Vesuvius because its playfield sits in the bottom rows of the world, which is where the sheet lands.

## Test results need inspection

- Require `50 PASSED | 0 PENDING | 0 FAILED` from the engine runner. Missing engine files count as pending without a failing exit status; its entity check rejects NaN/non-numbers but does not enforce positive or finite counts.
- Read visual QA warnings as well as errors. Resize, reset, and input problems can be warnings without a failing exit status.
- Browser QA can exit successfully despite per-engine issues. Inspect its summary and `.audit/browser-qa-report.json`, including warnings. The hub catches load/render exceptions and can show a placeholder, so a visible canvas alone is not proof of a working engine.
- Browser screenshots go to `.audit/screenshots/`; showcase screenshots go to `.audit/showcase/`. These do not refresh the shipped `assets/screenshots/` thumbnails automatically. `.audit/` is not gitignored.

## Runtime contracts

- `index.html` loads `src/core/hub.js`, which creates `window.__hub` on DOMContentLoaded. `DEMOS` and `PAVILIONS` wire the catalog, navigation, and dynamic engine imports. Keep each catalog key aligned with `src/demos/<key>/<key>.js` and its named `exportName`; tests construct this path instead of using `DEMOS.path`.
- Engines receive `(canvas, ctx, controlsContainer)`. The hub calls `resize(width, height, dpr)`, `update(dt)`, `render(ctx)`, and `getEntityCount()`, and calls `destroy()` on replacement. Keep DOM/audio initialization compatible with the Node mocks in both headless suites.
- `dt` is seconds, capped at 0.1 by the hub. Resize dimensions and mouse `x/y` are backing-store pixels; mouse `rawX/rawY` are CSS pixels. Do not apply device-pixel scaling twice.
- Focus one engine at `http://localhost:8000/#game=<key>`. `switchDemo()` loads the engine but does not reveal the simulator; `launchDemo()` does both but does not return its asynchronous load. Wait for the actual engine and rendered frames before browser assertions or screenshots.
- Catalog order determines numbered thumbnail paths (`assets/screenshots/01_vesuvius.png`, etc.). Adding/reordering engines also affects hardcoded browser QA keys/counts, HTML counters, and the separate `CODEX_DATA` registry in `src/core/codex.js`.
- `src/core/sound.js` exports `PlinySoundMaster` and the `soundMaster` singleton for hub audio. Engines may own separate synthesizers; do not assume the hub's mute control covers them. Preserve user-gesture audio unlocking.
- Keep static asset URLs relative for the GitHub Pages project subpath. `.nojekyll` belongs in the deployed root; no generated `dist/` bundle exists.

## Existing guidance

- Read `.agent/CONTINUITY.md` for handoff context and `.agents/skills/verify-pliny-game-lab/` for driving guides. Treat past green results and completion claims as history, not current evidence. The `.cursor/skills/` copy still describes the older five-engine app.
- The feature guides contain stale details: Vesuvius uses a 280x180 grid; Bestiarium's species and Mechanica's presets differ from their guides; Labyrinthus Space drops a breadcrumb, not a spell. Verify selectors and method names in current source before using copied browser steps.
