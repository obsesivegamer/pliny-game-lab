# Feature: Cosmographia Celestial Spheres

Ptolemaic epicycles, Keplerian orbital mechanics, and procedural planetary rendering.

## Sub-features
- Ptolemaic Geocentric model with deferents and epicycles generating rosetta orbital paths.
- Keplerian Heliocentric elliptical orbital mechanics with eccentricity and true anomaly.
- Procedural planet rendering with Lambertian diffuse shading, atmospheric rim scattering, and cloud bands.
- Starfield of 900+ stars with realistic stellar spectral colors and classical constellation lines.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser (Showcase homepage loads).
2. Find the "Cosmographia" card in the grid (Pavilion IV: Cosmographia & Astra) or use the search bar.
3. Click the card to launch it in Simulator view.
4. Alternatively: select "IV. Cosmographia & Astra" from the Pavilion dropdown, then "16. Cosmographia" from the Game dropdown.
5. Switch between 'Ptolemaic (Epicycles)' and 'Keplerian (Heliocentric)' in the controls panel.
6. Click and drag on canvas to pan/orbit view angle; scroll wheel to zoom.

## Driving it with headless harness
Execute via test suite:
```bash
node tests/verify-engines.js
# Cosmographia is engine #16; look for "[16/50] ✓ cosmographia (CosmographiaEngine) OK"
```

The engine exports `CosmographiaEngine` from `src/demos/cosmographia/cosmographia.js`.
Entity count after 60 ticks: ~934 celestial entities.

## Gotchas
- High time compression speeds (>50×) will cause inner planet orbits (Mercury, Venus) to appear as complete solid loops due to rapid cycle completion.
