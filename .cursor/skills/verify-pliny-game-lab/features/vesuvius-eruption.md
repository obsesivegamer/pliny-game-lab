# Feature: Vesuvius Volcanic Simulation

Thermodynamic cellular automata falling-sand, lava flows, pyroclastic density currents, and 7-phase Plinian eruption chronology with historical eyewitness chronicles.

## Sub-features
- Stratovolcano terrain generation with basalt bedrock, ash strata, and Roman settlements.
- 13-element cellular automata: Lava, Water, Sand, Ash, Basalt, Pumice, Magma, Sulfur, Oil, Fire, Stone, Obsidian, and Excavation.
- Thermal diffusion matrix with phase changes (water + lava → stone + explosive steam).
- 7-phase eruption chronology: Dormant → Tremor → Phreatic → Sub-Plinian → Ultra-Plinian → PDC Column Collapse → Caldera.
- Convective Plinian plume with 3-stage atmospheric column (gas thrust, convective, umbrella).
- Pyroclastic density current (PDC) surge simulation on column collapse.
- Ballistic volcanic bombs with parabolic trajectories.
- Classis Misenensis fleet evacuation (Pliny the Elder's rescue mission).
- Historical Plinian epigraphy HUD with real quotes from Pliny the Younger (Epistulae VI.16).
- Seismic tremor gauge and VEI meter.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser (Showcase homepage loads).
2. Find the "Vesuvius" card in the grid (Pavilion I: Ignis & Terra) or use the search bar.
3. Click the card to launch it in Simulator view.
4. Alternatively: select "I. Ignis & Terra" from the Pavilion dropdown, then "1. Vesuvius" from the Game dropdown.
5. The simulator opens in the Stabiae rescue mission. Select a galley, then order it to the east Stabiae ring; a full ship returns to the west OFFLOAD ring automatically.
6. Select Sandbox in the controls panel to paint materials and choose eruption phases (0: Dormant through 6: Caldera).
7. In Sandbox, left-click and drag to deposit material. Right-click triggers a localized phreatomagmatic blast.

## Driving it with headless harness
Execute via test suite:
```bash
node tests/verify-engines.js
# Vesuvius is engine #11 in the current 60-game catalog; look for "[11/60] ✓ vesuvius (VesuviusEngine) OK"
node tests/vesuvius-timing.js
node tests/vesuvius-gameplay.js
# With the static server running on port 8000:
node tests/vesuvius-browser-smoke.js
node tests/vesuvius-timing-browser.js
```

The engine exports `VesuviusEngine` from `src/demos/vesuvius/vesuvius.js`.
Key method: `setEruptionPhase(phaseIndex)` — triggers eruption phases 0–6.
Entity count after 60 ticks: ~14,000+ particles.
`update(dt)` accepts seconds and completes 1/60-second simulation steps. A call below one step carries a fractional remainder; a single update executes at most six steps. Advance a full `1 / 60` in tests that expect mission resolution.

## Gotchas
- High particle counts can tax CPU; the engine uses a 280×180 grid with pixelated scaling for 60 FPS.
- Right-clicking triggers a localized phreatomagmatic blast with shockwave at cursor coordinates.
- The `triggerEruption()` method does NOT exist; use `setEruptionPhase(PHASE.ULTRA_PLINIAN)` instead.
- The Codex help drawer, hub pause button, and Showcase view suspend engine updates. Closing help preserves an explicit Pause setting.
