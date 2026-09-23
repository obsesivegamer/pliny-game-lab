# Feature: Mechanica Physics & Automata Sandbox

Verlet integration rigid constraint physics with 5 Vitruvian machine presets, stress analysis visualization, and cable cutting.

## Sub-features
- Verlet particle and distance constraint solver with relaxation sub-stepping.
- 5 Vitruvian machine presets: Polyspaston Roman Crane (the default), Hero Steam Turbine (Aeolipile), Archimedean Water Screw, Temple Automatic Siphon Doors, and Compound Gear Train & Truss.
- Stress analysis: constraints color-coded by tension/compression ratio with visual strain indicators.
- Cable cutting: drag the slice tool across constraints to sever ropes and springs.
- Gravity, damping, and constraint stiffness sliders.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser (Showcase homepage loads).
2. Find the "Mechanica" card in the grid (Pavilion III: Mechanica & Machina) or use the search bar.
3. Click the card to launch it in Simulator view.
4. Alternatively: select "III. Mechanica & Machina" from the Pavilion dropdown, then "11. Mechanica" from the Game dropdown.
5. Select machine presets from the controls panel.
6. Drag points with left-click, or select the slice tool to cut connections.

## Driving it with headless harness
Execute via test suite:
```bash
node tests/verify-engines.js
# Mechanica is engine #11; look for "[11/50] ✓ mechanica (MechanicaEngine) OK"
```

The engine exports `MechanicaEngine` from `src/demos/mechanica/mechanica.js`.
Entity count after 60 ticks: ~23 points & constraints (varies by preset).

## Gotchas
- Rapid extreme mouse dragging can over-stretch constraints beyond breaking threshold if tearable is enabled.
- Setting gravity to 0 creates zero-G orbital and tumbling dynamics.
- Stress analysis colors update per-frame; red = high tension, blue = compression.
