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
5. Use the right-hand panel to pick eruption phases (0: Dormant through 6: Caldera) and elemental brush materials.
6. Left-click and drag on the canvas to deposit material.
7. Right-click to trigger a localized phreatomagmatic blast.
8. Click "🌋 TRIGGER ULTRA-PLINIAN CLIMAX" for the climactic eruption.

## Driving it with headless harness
Execute via test suite:
```bash
node tests/verify-engines.js
# Vesuvius is engine #1; look for "[1/50] ✓ vesuvius (VesuviusEngine) OK"
```

The engine exports `VesuviusEngine` from `src/demos/vesuvius/vesuvius.js`.
Key method: `setEruptionPhase(phaseIndex)` — triggers eruption phases 0–6.
Entity count after 60 ticks: ~14,000+ particles.

## Gotchas
- High particle counts can tax CPU; the engine uses a 240×180 grid with pixelated scaling for 60 FPS.
- Right-clicking triggers a localized phreatomagmatic blast with shockwave at cursor coordinates.
- The `triggerEruption()` method does NOT exist; use `setEruptionPhase(PHASE.ULTRA_PLINIAN)` instead.
