# Feature: Labyrinthus 3D Catacomb Crawler

Classic Wolfenstein-style DDA raycasting, procedural maze generation, and procedural WebAudio synthesis.

## Sub-features
- 3D DDA (Digital Differential Analyzer) raycasting rendering vertical column slices with depth fog.
- Procedural catacomb maze generation with Roman architecture corridors.
- Billboarded 2D sprites in pseudo-3D space: Minotaurs, Skeleton Guardians, torch pillars.
- WebAudio API procedural synthesizer generating ambient dungeon drones, footsteps, and arcane spell sounds without static audio files.
- Minimap radar HUD (toggled with M key).

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser.
2. Click the `⚔️ Labyrinthus` button on the top navigation bar.
3. Click once on the canvas to activate WebAudio sound synthesis.
4. Use `W`/`S` to walk forward/back, `A`/`D` or Arrow keys to turn.
5. Press `Space` to cast an arcane projectile bolt at monsters.

## Driving it with headless harness
Execute via test suite:
```bash
node -e "import('./src/demos/labyrinthus/labyrinthus.js').then(m => {
  const e = new m.LabyrinthusEngine({ width: 800, height: 600, getContext: () => ({ fillRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {} }), addEventListener: () => {} }, {}, null);
  for (let i=0; i<60; i++) e.update(0.016);
  console.log('Active 3D Sprites:', e.getEntityCount());
  if (e.getEntityCount() === 0) process.exit(1);
})"
```

## Gotchas
- Browsers block WebAudio autoplay until the user interacts with the canvas via mouse click or keypress.
- Raycasting resolution slider allows switching from high detail (1 ray per screen column) to medium (1 ray per 2 columns) for high-framerate rendering on lower-power devices.
