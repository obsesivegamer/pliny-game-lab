# Feature: Bestiarium ALife & Flocking Ecosystem

Autonomous agent-based artificial life ecosystem with 6 Plinian species, Lotka-Volterra predator-prey dynamics, 2D scent grid diffusion, and real-time population telemetry.

## Sub-features
- 6 Plinian species: Cervus, Leo, Griffin, Basilisk, Monoceros and Elephantus (roles and parameters live in `SPECIES_CATALOG` in `src/demos/bestiarium/bestiarium.js`).
- Craig Reynolds steering behaviors: separation, alignment, and cohesion per species.
- Lotka-Volterra population dynamics governing predator-prey equilibrium.
- 2D scent grid diffusion: prey leave scent trails that predators follow with gradient ascent.
- Dynamic food replenishment and grazing foraging vectors.
- Genetic adaptation: offspring inherit mutated speed/perception traits.
- Real-time population telemetry overlay graph plotting species populations over time.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser (Showcase homepage loads).
2. Find the "Bestiarium" card in the grid (Pavilion II: Bestiarium & Silva) or use the search bar.
3. Click the card to launch it in Simulator view.
4. Alternatively: select "II. Bestiarium & Silva" from the Pavilion dropdown, then "6. Bestiarium" from the Game dropdown.
5. Left-click anywhere on the canvas to spawn the selected creature type.
6. Use sliders on the right-hand panel to adjust species parameters and ecosystem controls.

## Driving it with headless harness
Execute via test runner:
```bash
node tests/verify-engines.js
# Bestiarium is engine #6; look for "[6/50] ✓ bestiarium (BestiariumEngine) OK"
```

The engine exports `BestiariumEngine` from `src/demos/bestiarium/bestiarium.js`.
Entity count after 60 ticks: ~190+ organisms.

## Gotchas
- If all predators starve, the herbivore population blooms until food depletion causes a population correction cycle.
- The Griffin causes wide-radius panic scattering among both prey and predators.
- The scent grid uses Float64Array diffusion with evaporation, which can show interesting trail patterns at slow simulation speeds.
