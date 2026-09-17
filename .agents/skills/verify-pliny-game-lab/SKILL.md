---
name: verify-pliny-game-lab
description: "Drive and verify Pliny Game Lab: start the local arcade server, run headless engine simulation suites, browser visual QA, and validate simulation integrity across all 50 engines in 10 Pavilions."
---

# Verify Pliny Game Lab

Pliny Game Lab is an interactive procedural simulation suite containing **50 engines** organized into **10 thematic Pavilions**, running inside a browser Canvas 2D / WebAudio arcade hub. It includes a Showcase homepage with search, filters, and card grid; a Simulator view with per-engine controls; a Plinius Codex lore drawer; and a procedural audio soundscape system.

## 1. Launch

Start the local HTTP server from the repository root:

```bash
# Check if already running on port 8000
curl -s -I http://localhost:8000/ | grep -q "200 OK" || python3 -m http.server 8000 &
```

Ready signal:
`curl -s -I http://localhost:8000/` responds with `HTTP/1.0 200 OK`.

## 2. Doctor

Run this single read-only command to check system health before driving:

```bash
./scripts/verify-all.sh
```

A passing doctor check shows:
1. HTTP server responding with 200 OK.
2. Core ES modules passing syntax checks (`node --check` on `src/core/hub.js`, `src/core/sound.js`, and key engine modules).
3. All 50 engines successfully completing 60 headless simulation ticks with valid entity counts and no unhandled exceptions.

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

Requires `puppeteer` dev dependency (`npm install`):

```bash
node tests/browser-qa.js
```

What it exercises:
- Launches headless Chrome at `http://localhost:8000`.
- For each of the 50 engines, calls `window.__hub.launchDemo(key)` to switch to the Simulator view.
- Waits 2.5s for the engine to render frames.
- Reads canvas pixel data to verify ≥1% non-black pixels (not blank).
- Captures a full-page screenshot to `.audit/screenshots/`.
- Reports FPS, entity count, console errors, and canvas fill ratio.

### Showcase Homepage QA

```bash
node tests/showcase-qa.js
```

Exercises: default Showcase view activation, 50 card rendering, 11 pavilion filter chips, live search, chip filtering, card click → Simulator launch, and Esc → Showcase return.

### Deep Visual QA (Headless Render Instrumentation)

```bash
node tests/visual-qa.js
```

Exercises: NaN coordinate detection, infinite value detection, invalid CSS color detection, save/restore stack mismatch, zero-render-call detection, per-engine render call profiling.

### Additional Test Suites

- `node tests/codex-qa.js` — Plinius Codex drawer content and navigation.
- `node tests/audio-qa.js` — Procedural WebAudio soundscape validation.

### Browser Driving (Interactive Verification)
Open `http://localhost:8000` in the browser.
1. The **Showcase homepage** loads by default with a hero section, stats counters, search bar, pavilion filter chips, and a 50-card grid.
2. Click any engine card (or use "▶ Launch Vesuvius (#1)" / "🎲 Random Engine") to switch to **Simulator view**.
3. In Simulator view, verify the top-right telemetry HUD displays `FPS: 60` and `Entities > 0`.
4. Use the **Pavilion dropdown** and **Game dropdown** in the nav bar to switch engines.
5. Use ◁/▷ arrows and 🎲 to navigate sequentially or randomly.
6. Interact with engine-specific controls in the right-side panel.
7. Press `Esc` to return to Showcase view.
8. Press `/` (in Showcase view) to focus the search bar.
9. Click the 📜 Codex icon to open the Plinius Codex lore drawer.

## 4. Evidence

All verification runs append results to:
`.audit/verification.log`

Screenshots from browser-qa.js are saved to:
`.audit/screenshots/`

Showcase QA screenshots saved to:
`.audit/showcase/`

Browser QA JSON report saved to:
`.audit/browser-qa-report.json`

Proof standards:
- All 50 engines must pass `verify-engines.js` with exit code `0`.
- Active simulated entity counters must be non-zero.
- No NaN values in positions, velocities, or temperatures.
- Browser QA: ≥1% canvas fill ratio per engine, 0 console errors.
- Each screenshot in `assets/screenshots/` should depict the engine's active simulation, not the Showcase homepage.

## 5. Cleanup

To stop the background server when finished:

```bash
kill $(lsof -t -i :8000) 2>/dev/null || true
```

Evidence logs in `.audit/` survive cleanup.

## 6. Helpers

- `./scripts/verify-all.sh`: Complete end-to-end doctor and test runner script.
- `node tests/verify-engines.js`: Headless 50-engine simulation harness.
- `node tests/browser-qa.js`: Puppeteer browser visual QA with screenshots.
- `node tests/showcase-qa.js`: Showcase homepage E2E verification.
- `node tests/visual-qa.js`: Deep render instrumentation QA.
- `node tests/codex-qa.js`: Codex drawer content verification.
- `node tests/audio-qa.js`: Audio system verification.
