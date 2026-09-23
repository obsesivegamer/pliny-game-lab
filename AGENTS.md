# Repository guidance

## Run and verify

- This is a static browser ES-module app, not an npm-built app. Run `python3 -m http.server 8000` from the repository root. There is no build step, npm script, configured linter, formatter, or typechecker.
- Browser QA needs `npm ci` and Puppeteer's browser installation. The locked Puppeteer version requires Node >=22.12.0. Running the app itself needs no npm install.
- Headless checks need no HTTP server: `node tests/verify-engines.js` and `node tests/visual-qa.js`. The latter instruments mocked Canvas calls; it is not a real-browser visual test. Neither runner accepts an engine-filter argument.
- With the server running, `./scripts/verify-all.sh` checks HTTP, syntax-checks selected modules, runs the Vesuvius gameplay smoke (`tests/vesuvius-gameplay.js`), then runs `verify-engines.js` and puzzle rule tests. It appends `.audit/verification.log`; it does not run browser QA. Syntax-check changed JavaScript separately with `node --check <file>`.
- Run browser suites separately against `http://localhost:8000` or set `PLINY_BASE_URL`: `node tests/showcase-qa.js`, `node tests/codex-qa.js`, `node tests/audio-qa.js`, `node tests/puzzle-browser-qa.js`, `node tests/puzzle-playthrough-qa.js`, `node tests/puzzle-mobile-qa.js`, `node tests/puzzle-keyboard-qa.js`, `node tests/vesuvius-browser-smoke.js`, `node tests/panel-toggle-qa.js`, `node tests/mobile-layout-qa.js`, and `node tests/browser-qa.js`. The last visits all 60 games with a 2.5-second wait per game.
- `mobile-layout-qa.js` guards the viewport contract at four sizes: the canvas backing store matches its CSS box, the mission world is not aspect-stretched, and the mobile controls sheet does not cover the canvas. It asserts against Vesuvius because its playfield sits in the bottom rows of the world, which is where the sheet lands.
- The controls panel floats over the right of the canvas on desktop and on short landscape screens. Puzzle boards measure it with `panelReserve()` in `src/core/puzzle.js`; do not copy panel widths or CSS breakpoints into engines. `puzzle-mobile-qa.js` checks every puzzle's `getRect()` against the real panel at phone, landscape-phone (568–844px) and desktop sizes, including a collapsed desktop panel.

## Test results need inspection

- Require `60 PASSED | 0 PENDING | 0 FAILED` from the engine runner. Missing engine files count as pending without a failing exit status; its entity check rejects NaN/non-numbers but does not enforce positive or finite counts.
- Read visual QA warnings as well as errors. Resize, reset, and input problems can be warnings without a failing exit status.
- Browser QA can exit successfully despite per-engine issues. Inspect its summary and `.audit/browser-qa-report.json`, including warnings. The hub catches load/render exceptions and can show a placeholder, so a visible canvas alone is not proof of a working engine.
- Browser screenshots go to `.audit/screenshots/`; showcase screenshots go to `.audit/showcase/`. These do not refresh the shipped `assets/screenshots/` thumbnails automatically. `.audit/` is not gitignored.

## Runtime contracts

- `index.html` loads `src/core/hub.js`, which creates `window.__hub` on DOMContentLoaded. `DEMOS` and `PAVILIONS` wire the catalog, navigation, and dynamic engine imports. Keep each catalog key aligned with `src/demos/<key>/<key>.js` and its named `exportName`; tests construct this path instead of using `DEMOS.path`.
- Engines receive `(canvas, ctx, controlsContainer)`. The hub calls `resize(width, height, dpr)`, `update(dt)`, `render(ctx)`, and `getEntityCount()`, and calls `destroy()` on replacement. The Pause button also calls an optional `setPaused(paused)`; a real-time engine that takes moves outside `update()` (Stonefall) must ignore them while paused. `onKeyDown` handlers should leave keys held with Ctrl, Cmd, or Alt to the browser, apart from an engine's own undo. Keep DOM/audio initialization compatible with the Node mocks in both headless suites.
- `dt` is seconds, capped at 0.1 by the hub. Resize dimensions and mouse `x/y` are backing-store pixels; mouse `rawX/rawY` are CSS pixels. Do not apply device-pixel scaling twice.
- Focus one game at `http://localhost:8000/#game=<key>`. `switchDemo()` loads the engine but does not reveal the play view; `launchDemo()` does both but does not return its asynchronous load. Wait for the actual engine and rendered frames before browser assertions or screenshots.
- The showcase (`src/core/showcase.js`) builds its eleven-room floor plan, collection index, sixty ranked cards and counts from `DEMOS` and `PAVILIONS`; a game appears under the collection named by its `pavilionId`. The Puzzle Arcade is a special unnumbered collection; the ten original pavilions retain Roman numeral names. Game names may omit a subtitle.
- Puzzle cards use explicit `assets/screenshots/<key>.svg` artwork. Original cards load `assets/thumbs/<key>.webp`, fall back to their preserved original numbered `assets/screenshots/NN_<key>.png`, then a hatched "Drawing pending" plate. After adding a game without artwork, run `node scripts/capture-thumbs.js` with the server up; it captures only games missing a thumb (`--all` redoes every one, or pass keys). It crops the engine canvas, so no app chrome appears in thumbs.
- Catalog order determines rank badges, not the preserved original screenshot numbers. Adding/reordering games also affects browser QA keys/counts. The fifty simulation entries remain in `CODEX_DATA`; puzzle rules live in `hub.js`.
- `hub.switchView()` sets `body[data-view]`; elements with class `sim-only` in the header are hidden on the showcase. Engines read the original tokens (`--accent-gold`, `--font-mono`, `--font-display`, etc.), so keep those values; the site's own styling uses the `--bp-*` tokens.
- `src/core/sound.js` exports `PlinySoundMaster` and the `soundMaster` singleton for hub audio. Engines may own separate synthesizers; do not assume the hub's mute control covers them. Preserve user-gesture audio unlocking.
- Keep static asset URLs relative for the GitHub Pages project subpath. `.nojekyll` belongs in the deployed root; no generated `dist/` bundle exists.

## Existing guidance

- Read `.agent/CONTINUITY.md` for handoff context and `.agents/skills/verify-pliny-game-lab/` for driving guides. Treat past green results and completion claims as history, not current evidence. Verify selectors and method names in current source before using copied browser steps.
- `.cursor/skills/verify-pliny-game-lab/` is an exact mirror of the `.agents` copy for Cursor. Edit the `.agents` copy, then mirror into `.cursor/skills/`; `diff -r .agents/skills .cursor/skills` should print nothing.
