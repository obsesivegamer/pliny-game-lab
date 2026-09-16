---
name: verify-pliny-game-lab
description: "Drive and verify Pliny Game Lab: start the local arcade server, run headless engine simulation suites, and validate visual/simulation integrity for Vesuvius, Bestiarium, Mechanica, Cosmographia, and Labyrinthus."
---

# Verify Pliny Game Lab

Pliny Game Lab is an interactive procedural game development and simulation suite containing 5 engines (Vesuvius, Bestiarium, Mechanica, Cosmographia, Labyrinthus) running inside a browser Canvas/WebGL arcade hub.

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
2. All ES modules passing syntax checks (`node --check`).
3. All 5 engines successfully completing 60 headless simulation ticks without NaNs or unhandled exceptions.

## 3. Drive

### Automated Headless Simulation Suite
Run the multi-engine test runner:

```bash
node tests/verify-engines.js
```

What it exercises:
- **Vesuvius**: Cellular automata grid updates, thermal diffusion, and Plinian eruption event.
- **Bestiarium**: Boids steering calculations, flock cohesion/separation, predator-prey consumption.
- **Cosmographia**: Epicycle calculation, Keplerian orbital integration, starfield scintillation.
- **Mechanica**: Verlet numerical integration, constraint relaxation, tension spring solving.
- **Labyrinthus**: DDA raycasting vertical column sweeps, procedural maze carving, sprite sorting.

### Browser Driving (Interactive Verification)
Open `http://localhost:8000` in the browser.
1. Click between navigation tabs: `🌋 Vesuvius`, `🦅 Bestiarium`, `⚙️ Mechanica`, `🪐 Cosmographia`, `⚔️ Labyrinthus`.
2. Verify top-right telemetry HUD displays `FPS: 60` and `Entities > 0`.
3. Interact with controls: sliders modify simulation parameters in real time without frame drops.

## 4. Evidence

All verification runs append results to:
`.audit/verification.log`

Proof standards:
- All 5 engines must pass with exit code `0`.
- Active simulated entity counters must be non-zero (`particles > 0`, `organisms > 0`, `stars > 0`, `constraints > 0`).
- No NaN values in positions, velocities, or temperatures.

## 5. Cleanup

To stop the background server when finished:

```bash
kill $(lsof -t -i :8000) 2>/dev/null || true
```

Evidence logs in `.audit/verification.log` and `decisions.tsv` survive cleanup.

## 6. Helpers

- `./scripts/verify-all.sh`: Complete end-to-end doctor and test runner script.
- `node tests/verify-engines.js`: Headless simulation test harness.
