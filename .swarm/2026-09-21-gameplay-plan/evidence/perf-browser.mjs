import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle0' });
  const samples = await page.evaluate(async () => {
    const base = await import('/src/demos/vesuvius/vesuvius-baseline.mjs');
    const changed = await import('/src/demos/vesuvius/vesuvius.js');
    const types = { baseline: base.VesuviusEngine, treatment: changed.VesuviusEngine };
    const result = {};
    const create = (Type) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const e = new Type(canvas, ctx, document.createElement('div'));
      e.resize(800, 600, 1);
      if (e._setSeed) e._setSeed(12345);
      return { e, ctx };
    };
    const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    for (const [name, Type] of Object.entries(types)) {
      const update = [];
      const render = [];
      const catchup = [];
      const initial = create(Type);
      let gridHash = 0;
      for (const cell of initial.e.grid) gridHash = (Math.imul(gridHash, 31) + cell) | 0;
      initial.e.destroy();
      for (let sample = 0; sample < 3; sample++) {
        const { e, ctx } = create(Type);
        for (let i = 0; i < 30; i++) e.update(1 / 60);
        let start = performance.now();
        for (let i = 0; i < 120; i++) e.update(1 / 60);
        update.push((performance.now() - start) / 120);
        for (let i = 0; i < 5; i++) e.render(ctx);
        start = performance.now();
        for (let i = 0; i < 30; i++) e.render(ctx);
        render.push((performance.now() - start) / 30);
        e.destroy();

        const c = create(Type);
        for (let i = 0; i < 5; i++) c.e.update(0.1);
        start = performance.now();
        for (let i = 0; i < 30; i++) c.e.update(0.1);
        catchup.push((performance.now() - start) / 30);
        c.e.destroy();
      }
      result[name] = {
        gridHash,
        scene: '800x600 default dormant gameplay',
        update60Ms: { samples: update, median: median(update), callsPerSample: 120 },
        renderMs: { samples: render, median: median(render), callsPerSample: 30 },
        update100ms: { samples: catchup, median: median(catchup), callsPerSample: 30 }
      };
    }
    return result;
  });
  if (samples.baseline.gridHash !== samples.treatment.gridHash) {
    throw new Error(`Initial grid differs: ${samples.baseline.gridHash} vs ${samples.treatment.gridHash}`);
  }
  console.log(JSON.stringify(samples, null, 2));
} finally {
  await browser.close();
}
