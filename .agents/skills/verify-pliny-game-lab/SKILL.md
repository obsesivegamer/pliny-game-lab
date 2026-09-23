---
name: verify-pliny-game-lab
description: "Drive and verify Pliny Game Lab: start the local server, test the 60-game catalog, play puzzle controls, and inspect browser and visual QA."
---

# Verify Pliny Game Lab

Pliny Game Lab contains **ten puzzle games** in the Puzzle Arcade, followed by **fifty simulations** in ten original pavilions. It runs as browser ES modules with Canvas 2D and Web Audio. The blueprint showcase has eleven collections, search, filters, and 60 ranked cards.

## 1. Launch

Start the local HTTP server from the repository root:

```bash
# Check if already running on port 8000
curl -s -I http://localhost:8000/ | grep -q "200 OK" || python3 -m http.server 8000 &
```

Ready signal:
`curl -s -I http://localhost:8000/` responds with `HTTP/1.0 200 OK`.

## 2. Doctor

Run the project check before driving. It appends `.audit/verification.log`:

```bash
./scripts/verify-all.sh
```

A passing doctor check shows:
1. HTTP server responding with 200 OK.
2. Core and puzzle ES modules passing syntax checks.
3. `60 PASSED | 0 PENDING | 0 FAILED` from the engine runner, plus puzzle rule checks.

## 3. Drive

### Automated Headless Simulation Suite
Run the multi-engine test runner:

```bash
node tests/verify-engines.js
```

What it exercises:
- Imports every engine class registered in `DEMOS` (hub.js) via its `exportName`.
- Instantiates each engine with a `MockCanvas`, `MockContext`, and `MockElement` container.
- Runs 60 update ticks at dt=0.016 (simulating 1 second at 60 FPS).
- Calls `render()`, `getEntityCount()`, and input handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onKeyDown`, `onKeyUp`).
- Validates entity count is a real number > 0.
- Calls `destroy()` for cleanup.
- Reports `PASSED / PENDING / FAILED` per engine.

### Browser Visual QA (Puppeteer)

Requires the locked `puppeteer` dev dependency (`npm ci`, Node 22.12 or newer):

```bash
node tests/browser-qa.js
```

What it exercises:
- Launches headless Chrome at `http://localhost:8000`.
- For each of the 60 games, calls `window.__hub.launchDemo(key)` to switch to the play view.
- Waits 2.5s for the engine to render frames.
- Reads canvas pixel data to verify ≥1% non-black pixels (not blank).
- Captures a full-page screenshot to `.audit/screenshots/`.
- Reports FPS, entity count, console errors, and canvas fill ratio.

### Showcase Homepage QA

```bash
node tests/showcase-qa.js
```

Exercises: default Showcase view activation, card count, collection filter chips, live search, chip filtering, card click → play view, and the nav button back to the Showcase. See `features/showcase-homepage.md` for the page's structure and the thumbnail script.

### Deep Visual QA (Headless Render Instrumentation)

```bash
node tests/visual-qa.js
```

Exercises: NaN coordinate detection, infinite value detection, invalid CSS color detection, save/restore stack mismatch, zero-render-call detection, per-engine render call profiling.

### Additional Test Suites

- `node tests/codex-qa.js` — Plinius Codex drawer content and navigation.
- `node tests/audio-qa.js` — Procedural WebAudio soundscape validation.
- `node tests/puzzle-playthrough-qa.js` — Play the first level of each authored puzzle in Chromium.
- `node tests/puzzle-mobile-qa.js` — Check all ten phone layouts and touch play.
- `node tests/puzzle-keyboard-qa.js` — Solve representative puzzles with a keyboard.
- `node tests/mobile-layout-qa.js` and `node tests/panel-toggle-qa.js` — Legacy simulator layout checks.

### Browser Driving (Interactive Verification)
Open `http://localhost:8000` in the browser.
1. The **Showcase homepage** loads by default: a floor plan with Puzzle Arcade first, then the ten original pavilions. The first ten cards are puzzles; Vesuvius is #11.
2. Click any game card (or "Play Oracle Words" / "Random game") to open the play view.
3. In the play view, verify the header readouts show `FPS 60` and `Entities` above 0. They are hidden on the showcase, drop away below 1440px (entities) and 1280px (FPS), and are all hidden on phones; read `#fps-val` / `#entity-val` directly at narrower widths.
4. Use the **Pavilion dropdown** and **Game dropdown** in the nav bar to switch engines.
5. Use the previous/next arrows and the die button to navigate sequentially or randomly.
6. Interact with the puzzle controls or original engine controls in the panel.
7. Press `Esc` to return to Showcase view.
8. Press `/` (in Showcase view) to focus the search bar.
9. Press `P` to filter to the puzzles, or `1`–`0` for the original pavilions.
10. Click the Codex button in the header (or press `C` on the showcase) to open puzzle rules or the Plinius Codex.

## 4. Evidence

`./scripts/verify-all.sh` appends results to `.audit/verification.log`. Other suites print their results; browser suites may also write screenshots or JSON reports.

Screenshots from browser-qa.js are saved to:
`.audit/screenshots/`

Showcase QA screenshots saved to:
`.audit/showcase/`

Browser QA JSON report saved to:
`.audit/browser-qa-report.json`

Proof standards:
- All 60 engines must pass `verify-engines.js` with zero pending or failed entries.
- `visual-qa.js` must report zero warnings and errors; inspect `.audit/browser-qa-report.json` for per-game issues.
- Active simulated entity counters must be non-zero.
- No NaN values in positions, velocities, or temperatures.
- Browser QA: ≥1% canvas fill ratio per engine, 0 console errors.
- Original simulation screenshots must match their game keys. Puzzle cards use hand-drawn SVG thumbnails.

## 5. Cleanup

Stop only the local server process you started. Do not kill an unrelated process on the same port.

Evidence logs in `.audit/` survive cleanup.

## 6. Helpers

- `./scripts/verify-all.sh`: HTTP, syntax, engine, and puzzle rule checks.
- `node tests/verify-engines.js`: Headless 60-engine simulation harness.
- `node tests/browser-qa.js`: Puppeteer browser visual QA with screenshots.
- `node tests/showcase-qa.js`: Showcase homepage E2E verification.
- `node tests/visual-qa.js`: Deep render instrumentation QA.
- `node tests/codex-qa.js`: Codex drawer content verification.
- `node tests/audio-qa.js`: Audio system verification.
- `node tests/puzzle-mobile-qa.js`: Puzzle phone layout and touch verification.
