# Feature: Vesuvius Volcanic Simulation

Thermodynamic falling-sand, lava flows, and catastrophic Plinian explosive eruptions.

## Sub-features
- Stratovolcano terrain generation with basalt bedrock and ash strata.
- Falling solid particle physics (sand, ash) and fluid physics (water, lava, oil).
- Thermal diffusion matrix with phase changes (water + lava -> stone + explosive steam).
- Subterranean magma chamber pressure buildup triggering Plinian ash plume.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser.
2. Click the `🌋 Vesuvius` button on the top navigation bar.
3. Use the right-hand panel to pick brush materials (Lava, Water, Sand, Fire, Basalt).
4. Left-click and drag on the canvas to deposit material.
5. Click "TRIGGER PLINIAN ERUPTION" to blow the volcanic vent.

## Driving it with headless harness
Execute via test suite:
```bash
node -e "import('./src/demos/vesuvius/vesuvius.js').then(m => {
  const e = new m.VesuviusEngine({ width: 800, height: 600, getContext: () => ({ createImageData: (w,h) => ({ data: new Uint8ClampedArray(w*h*4) }), putImageData() {}, drawImage() {} }) }, {}, {});
  e.triggerEruption();
  for (let i=0; i<30; i++) e.update(0.016);
  console.log('Particles:', e.getEntityCount());
  if (e.getEntityCount() < 1000) process.exit(1);
})"
```

## Gotchas
- High particle counts can tax CPU if grid resolution exceeds 320x240. The engine is tuned to 240x160 with pixelated scaling for 60 FPS performance.
- Right-clicking triggers an explosive excavation at cursor coordinates.
