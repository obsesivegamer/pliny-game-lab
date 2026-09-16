# Feature: Mechanica Physics & Automata Sandbox

Verlet integration rigid constraint physics, ancient Roman automata, and hydraulic mechanisms.

## Sub-features
- Verlet particle and distance constraint solver with relaxation sub-stepping.
- Archimedean screw simulation lifting water particles into an elevated flume.
- Hero of Alexandria's Aeolipile (rotational steam reaction turbine).
- Catapult siege machine with release latch trigger.
- Interactive constraint slicing (sever ropes and springs by dragging with slice tool).

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser.
2. Click the `⚙️ Mechanica` button on the top navigation bar.
3. Select presets: 'Cloth & Chains', 'Archimedes Screw', 'Catapult Siege', 'Hero Steam Turbine'.
4. Drag points with left-click, or select 'Slice / Sever Constraints' to cut connections.

## Driving it with headless harness
Execute via test suite:
```bash
node -e "import('./src/demos/mechanica/mechanica.js').then(m => {
  const e = new m.MechanicaEngine({ width: 800, height: 600, getContext: () => ({ fillRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {} }) }, {}, { appendChild: () => {} });
  for (let i=0; i<60; i++) e.update(0.016);
  console.log('Points & Constraints:', e.getEntityCount());
  if (e.getEntityCount() === 0) process.exit(1);
})"
```

## Gotchas
- Rapid extreme mouse dragging can over-stretch constraints beyond breaking threshold if tearable is enabled.
- Setting gravity to 0 creates zero-G orbital and tumbling dynamics.
