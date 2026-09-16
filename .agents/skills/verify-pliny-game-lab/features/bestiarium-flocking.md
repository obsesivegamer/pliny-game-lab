# Feature: Bestiarium ALife & Flocking Ecosystem

Autonomous Craig Reynolds steering boids, trophic food web, and genetic adaptation.

## Sub-features
- Craig Reynolds steering behaviors: separation, alignment, and cohesion.
- Trophic tiers: Cervus (herbivore boids), Leo (pack predators), and the Plinian Griffin (apex aerial predator).
- Dynamic food replenishment and grazing foraging vectors.
- Real-time population telemetry overlay graph plotting herbivores vs predators over time.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser.
2. Click the `🦅 Bestiarium` button on the top navigation bar.
3. Left-click anywhere on the canvas to spawn the selected creature (Cervus, Leo, Griffin, or Food).
4. Use sliders on the right-hand panel to adjust herd cohesion, separation, and reproduction rates.

## Driving it with headless harness
Execute via test runner:
```bash
node -e "import('./src/demos/bestiarium/bestiarium.js').then(m => {
  const e = new m.BestiariumEngine({ width: 800, height: 600, getContext: () => ({ fillRect() {}, beginPath() {}, arc() {}, fill() {}, save() {}, restore() {}, translate() {}, rotate() {}, stroke() {}, moveTo() {}, lineTo() {}, closePath() {} }) }, {}, {});
  for (let i=0; i<60; i++) e.update(0.016);
  console.log('Organisms:', e.getEntityCount());
  if (e.getEntityCount() < 50) process.exit(1);
})"
```

## Gotchas
- If all predators starve, the herbivore population blooms until food depletion causes a population correction cycle.
- The Griffin causes wide-radius panic scattering among both prey and predators.
