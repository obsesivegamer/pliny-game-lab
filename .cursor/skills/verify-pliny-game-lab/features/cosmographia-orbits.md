# Feature: Cosmographia Celestial Spheres

Ptolemaic epicycles, Keplerian orbital mechanics, and procedural planetary rendering.

## Sub-features
- Ptolemaic Geocentric model with deferents and epicycles generating rosetta orbital paths.
- Keplerian Heliocentric elliptical orbital mechanics with eccentricity and true anomaly.
- Procedural planet rendering with lambertian diffuse shading, atmospheric rim scattering, and cloud bands.
- Starfield of 500+ stars with realistic stellar spectral colors and classical constellation lines.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser.
2. Click the `🪐 Cosmographia` button on the top navigation bar.
3. Switch between 'Ptolemaic (Epicycles)' and 'Keplerian (Heliocentric)' in the controls panel.
4. Click and drag on canvas to pan/orbit view angle; scroll wheel to zoom.

## Driving it with headless harness
Execute via test suite:
```bash
node -e "import('./src/demos/cosmographia/cosmographia.js').then(m => {
  const e = new m.CosmographiaEngine({ width: 800, height: 600, getContext: () => ({ fillRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {} }) }, {}, { appendChild: () => {} });
  for (let i=0; i<60; i++) e.update(0.016);
  console.log('Celestial entities:', e.getEntityCount());
  if (e.getEntityCount() < 500) process.exit(1);
})"
```

## Gotchas
- High time compression speeds (>50x) will cause inner planet orbits (Mercury, Venus) to appear as complete solid loops due to rapid cycle completion.
