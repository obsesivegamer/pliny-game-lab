// Fractal Roman: Ancient Roman Mosaic Art & Computational Fractal Tessellation Engine
// Grounded in Roman Opus Vermiculatum, Opus Tessellatum, Voronoi Lloyd Relaxation,
// Recursive Greek Key / Roman Meander Fractals, and Penrose Golden Quasicrystals.

export const MOSAIC_STYLES = [
  'Opus Vermiculatum (Contour)',
  'Voronoi Organic Pavement',
  'Roman Meander Fractal',
  'Penrose Quasicrystal'
];

export const PALETTES = {
  'Villa of Mysteries (Pompeii Red & Black)': {
    name: 'Villa of Mysteries (Pompeii Red & Black)',
    grout: '#181615',
    groutAlt: '#23201d',
    primary: ['#8c1d14', '#a6261c', '#6f140c', '#7d1911'], // Pompeian cinnabar
    secondary: ['#1c1c20', '#2a2a32', '#141416', '#353540'], // Basalt / Obsidian
    tertiary: ['#ede6d4', '#dfd7c2', '#f6f0df', '#c8bea5'], // Carrara marble
    accent: ['#c47335', '#db8741', '#9e511c'], // Terracotta
    gold: ['#dfb03f', '#f5d369', '#c49729', '#fff0a3'] // Imperial gold leaf
  },
  'Oceanus Mosaic (Lapis & Cyan)': {
    name: 'Oceanus Mosaic (Lapis & Cyan)',
    grout: '#0f171d',
    groutAlt: '#16232c',
    primary: ['#1d4277', '#295a9e', '#132e56', '#214983'], // Egyptian Lapis Lazuli
    secondary: ['#2e8997', '#3faec1', '#1f626c', '#4bc0d4'], // Aegean Sea Cyan
    tertiary: ['#ddf0ee', '#c7e4e1', '#eef8f7', '#b3d8d4'], // Thassos crystalline marble
    accent: ['#11202e', '#192f42', '#0a131b'], // Deep abyssal basalt
    gold: ['#e1c172', '#f7dd9b', '#b9943c', '#fff2cd'] // Sunken Roman Aureus gold
  },
  'Imperial Gold & Marble': {
    name: 'Imperial Gold & Marble',
    grout: '#181412',
    groutAlt: '#241e1b',
    primary: ['#581622', '#721f2f', '#420e18', '#7f2838'], // Imperial porphyry
    secondary: ['#d4a23d', '#e9bb55', '#b98725', '#f8d379'], // Giallo Antico Numidian marble
    tertiary: ['#f8f5ed', '#e8e1cf', '#d3c8b1', '#fffdf8'], // Statuario Carrara marble
    accent: ['#2d4c3e', '#1c342a', '#3e6c58', '#14271f'], // Spartan green serpentine
    gold: ['#ffd700', '#ffdf43', '#dda300', '#fff59e'] // Pure Byzantine beaten gold
  }
};

// Fast deterministic pseudo-random hash for per-tessera micro-facets and veining
function hash2D(x, y, seed = 1337) {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.123) * 43758.5453123;
  return n - Math.floor(n);
}

// Sutherland-Hodgman Polygon Clipping by Half-Plane: nx * x + ny * y + d <= 0
function clipPolygonWithHalfPlane(poly, nx, ny, d) {
  const out = [];
  const len = poly.length;
  if (len === 0) return out;

  let p1 = poly[len - 1];
  let d1 = nx * p1.x + ny * p1.y + d;

  for (let i = 0; i < len; i++) {
    const p2 = poly[i];
    const d2 = nx * p2.x + ny * p2.y + d;

    if (d1 <= 0) {
      if (d2 <= 0) {
        out.push(p2);
      } else {
        const t = -d1 / (d2 - d1);
        out.push({
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y)
        });
      }
    } else {
      if (d2 <= 0) {
        const t = -d1 / (d2 - d1);
        out.push({
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y)
        });
        out.push(p2);
      }
    }
    p1 = p2;
    d1 = d2;
  }
  return out;
}

// Calculate polygon centroid and signed area
function getPolygonCentroidAndArea(poly) {
  let aSum = 0;
  let cx = 0;
  let cy = 0;
  const n = poly.length;
  if (n < 3) return { cx: poly[0]?.x || 0, cy: poly[0]?.y || 0, area: 0 };

  for (let i = 0; i < n; i++) {
    const p0 = poly[i];
    const p1 = poly[(i + 1) % n];
    const cross = p0.x * p1.y - p1.x * p0.y;
    aSum += cross;
    cx += (p0.x + p1.x) * cross;
    cy += (p0.y + p1.y) * cross;
  }
  const area = aSum * 0.5;
  if (Math.abs(area) > 1e-4) {
    cx /= (6 * area);
    cy /= (6 * area);
    return { cx, cy, area };
  }
  // Fallback to vertex average
  cx = 0; cy = 0;
  for (let i = 0; i < n; i++) {
    cx += poly[i].x;
    cy += poly[i].y;
  }
  return { cx: cx / n, cy: cy / n, area: 0 };
}

// Inset polygon towards centroid to form realistic mortar grout spacing
function insetPolygon(poly, cx, cy, groutWidth) {
  const n = poly.length;
  if (n < 3) return poly;
  const inset = [];

  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.001) {
      const factor = Math.max(0.1, (dist - groutWidth) / dist);
      inset.push({
        x: cx + dx * factor,
        y: cy + dy * factor
      });
    } else {
      inset.push({ x: p.x, y: p.y });
    }
  }
  return inset;
}

export class FractalRomanEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    // Simulation configuration
    this.currentStyle = 'Opus Vermiculatum (Contour)';
    this.tesseraeDensity = 850;
    this.groutWidth = 2.5;
    this.selectedPaletteKey = 'Villa of Mysteries (Pompeii Red & Black)';
    this.palette = PALETTES[this.selectedPaletteKey];
    this.goldShimmerEnabled = true;

    // Computational Geometry State
    this.tesserae = []; // List of cut stone tiles
    this.voronoiSeeds = []; // Seeds for Voronoi pavement
    this.contourAttractors = []; // Attractors for Opus Vermiculatum
    this.fractalMeanderDepth = 2; // Depth of Greek Key fractal
    this.penroseDepth = 3; // Depth of Quasicrystal deflation

    // Lighting and interaction
    this.mousePos = { x: this.width * 0.5, y: this.height * 0.5 };
    this.lightPos = { x: this.width * 0.5, y: this.height * 0.5 };
    this.isMouseDown = false;
    this.selectedTool = 'deposit'; // 'deposit', 'relax', 'gold'
    this.time = 0;
    this.dirty = true;
    this.totalVertices = 0;

    // Build user controls and generate initial mosaic
    this.buildControls();
    this.reset();
  }

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.controlsContainer.style.color = '#e0dacb';
    this.controlsContainer.style.fontFamily = "'Cinzel', 'JetBrains Mono', Georgia, serif";
    this.controlsContainer.style.fontSize = '13px';

    const createGroup = () => {
      const g = document.createElement('div');
      g.style.marginBottom = '12px';
      g.style.padding = '8px 10px';
      g.style.background = 'rgba(25, 23, 22, 0.65)';
      g.style.border = '1px solid rgba(212, 175, 55, 0.25)';
      g.style.borderRadius = '4px';
      return g;
    };

    // 1. Mosaic Style Selector
    const styleGroup = createGroup();
    const styleLabel = document.createElement('label');
    styleLabel.textContent = '🏛️ MOSAIC TECHNIQUE';
    styleLabel.style.display = 'block';
    styleLabel.style.fontWeight = 'bold';
    styleLabel.style.letterSpacing = '1px';
    styleLabel.style.marginBottom = '6px';
    styleLabel.style.color = '#d4af37';
    styleGroup.appendChild(styleLabel);

    this.styleSelect = document.createElement('select');
    this.styleSelect.style.width = '100%';
    this.styleSelect.style.padding = '6px';
    this.styleSelect.style.background = '#1a1918';
    this.styleSelect.style.color = '#f5f2eb';
    this.styleSelect.style.border = '1px solid #d4af37';
    this.styleSelect.style.borderRadius = '3px';
    this.styleSelect.style.cursor = 'pointer';

    MOSAIC_STYLES.forEach(style => {
      const opt = document.createElement('option');
      opt.value = style;
      opt.textContent = style;
      if (style === this.currentStyle) opt.selected = true;
      this.styleSelect.appendChild(opt);
    });

    this.styleSelect.onchange = (e) => {
      this.currentStyle = e.target.value;
      this.reset();
    };
    styleGroup.appendChild(this.styleSelect);
    this.controlsContainer.appendChild(styleGroup);

    // 2. Palette Selector
    const palGroup = createGroup();
    const palLabel = document.createElement('label');
    palLabel.textContent = '🎨 ROMAN VILLA PALETTE';
    palLabel.style.display = 'block';
    palLabel.style.fontWeight = 'bold';
    palLabel.style.letterSpacing = '1px';
    palLabel.style.marginBottom = '6px';
    palLabel.style.color = '#d4af37';
    palGroup.appendChild(palLabel);

    this.palSelect = document.createElement('select');
    this.palSelect.style.width = '100%';
    this.palSelect.style.padding = '6px';
    this.palSelect.style.background = '#1a1918';
    this.palSelect.style.color = '#f5f2eb';
    this.palSelect.style.border = '1px solid #8c1d14';
    this.palSelect.style.borderRadius = '3px';
    this.palSelect.style.cursor = 'pointer';

    Object.keys(PALETTES).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      if (key === this.selectedPaletteKey) opt.selected = true;
      this.palSelect.appendChild(opt);
    });

    this.palSelect.onchange = (e) => {
      this.selectedPaletteKey = e.target.value;
      this.palette = PALETTES[this.selectedPaletteKey];
      this.recolorMosaic();
    };
    palGroup.appendChild(this.palSelect);
    this.controlsContainer.appendChild(palGroup);

    // 3. Tesserae Density Slider (100 to 3000)
    const densityGroup = createGroup();
    const densityLabel = document.createElement('div');
    densityLabel.textContent = `Tesserae Density: ${this.tesseraeDensity}`;
    densityLabel.style.marginBottom = '4px';
    densityLabel.style.color = '#c9c2b5';
    densityGroup.appendChild(densityLabel);

    this.densitySlider = document.createElement('input');
    this.densitySlider.type = 'range';
    this.densitySlider.min = '100';
    this.densitySlider.max = '3000';
    this.densitySlider.step = '50';
    this.densitySlider.value = String(this.tesseraeDensity);
    this.densitySlider.style.width = '100%';
    this.densitySlider.style.accentColor = '#d4af37';

    this.densitySlider.oninput = (e) => {
      this.tesseraeDensity = parseInt(e.target.value, 10);
      densityLabel.textContent = `Tesserae Density: ${this.tesseraeDensity}`;
      this.reset();
    };
    densityGroup.appendChild(this.densitySlider);
    this.controlsContainer.appendChild(densityGroup);

    // 4. Grout Width / Stone Spacing Slider (1 to 8px)
    const groutGroup = createGroup();
    const groutLabel = document.createElement('div');
    groutLabel.textContent = `Grout / Mortar Width: ${this.groutWidth.toFixed(1)}px`;
    groutLabel.style.marginBottom = '4px';
    groutLabel.style.color = '#c9c2b5';
    groutGroup.appendChild(groutLabel);

    this.groutSlider = document.createElement('input');
    this.groutSlider.type = 'range';
    this.groutSlider.min = '1.0';
    this.groutSlider.max = '7.0';
    this.groutSlider.step = '0.5';
    this.groutSlider.value = String(this.groutWidth);
    this.groutSlider.style.width = '100%';
    this.groutSlider.style.accentColor = '#8c1d14';

    this.groutSlider.oninput = (e) => {
      this.groutWidth = parseFloat(e.target.value);
      groutLabel.textContent = `Grout / Mortar Width: ${this.groutWidth.toFixed(1)}px`;
      this.recomputeInsets();
    };
    groutGroup.appendChild(this.groutSlider);
    this.controlsContainer.appendChild(groutGroup);

    // 5. Action Buttons Grid
    const btnGrid = document.createElement('div');
    btnGrid.style.display = 'grid';
    btnGrid.style.gridTemplateColumns = '1fr 1fr';
    btnGrid.style.gap = '8px';
    btnGrid.style.marginBottom = '10px';

    const makeBtn = (text, icon, bg, borderColor, onClick) => {
      const btn = document.createElement('button');
      btn.innerHTML = `${icon} ${text}`;
      btn.style.padding = '8px 4px';
      btn.style.background = bg;
      btn.style.color = '#f5f2eb';
      btn.style.border = `1px solid ${borderColor}`;
      btn.style.borderRadius = '3px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '11px';
      btn.style.fontWeight = 'bold';
      btn.style.letterSpacing = '0.5px';
      btn.onclick = onClick;
      return btn;
    };

    // Button: Step Lloyd Relaxation
    this.relaxBtn = makeBtn('Step Lloyd Relaxation', '⚖️', 'rgba(212, 175, 55, 0.2)', '#d4af37', () => {
      this.stepLloydRelaxation();
    });
    btnGrid.appendChild(this.relaxBtn);

    // Button: Subdivide Fractal Meander
    this.subdivideBtn = makeBtn('Subdivide Fractal Meander', '🌀', 'rgba(140, 29, 20, 0.3)', '#a6261c', () => {
      this.subdivideFractal();
    });
    btnGrid.appendChild(this.subdivideBtn);
    this.controlsContainer.appendChild(btnGrid);

    // Secondary Action Buttons
    const btnGrid2 = document.createElement('div');
    btnGrid2.style.display = 'grid';
    btnGrid2.style.gridTemplateColumns = '1fr 1fr';
    btnGrid2.style.gap = '8px';

    const reseedBtn = makeBtn('Re-cut All Stones', '🔨', 'rgba(40, 40, 45, 0.8)', '#777', () => {
      this.reset();
    });
    btnGrid2.appendChild(reseedBtn);

    const goldLeafBtn = makeBtn('Gold Leaf Brush', '✨', 'rgba(223, 176, 63, 0.25)', '#dfb03f', () => {
      this.selectedTool = this.selectedTool === 'gold' ? 'deposit' : 'gold';
      goldLeafBtn.style.background = this.selectedTool === 'gold' ? 'rgba(223, 176, 63, 0.6)' : 'rgba(223, 176, 63, 0.25)';
    });
    btnGrid2.appendChild(goldLeafBtn);
    this.controlsContainer.appendChild(btnGrid2);
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.reset();
  }

  reset() {
    this.time = 0;
    this.tesserae = [];
    this.voronoiSeeds = [];
    this.contourAttractors = [
      { x: this.width * 0.5, y: this.height * 0.5, radius: Math.min(this.width, this.height) * 0.45, strength: 1.0 }
    ];

    if (this.currentStyle === 'Voronoi Organic Pavement') {
      this.initVoronoiPavement();
    } else if (this.currentStyle === 'Opus Vermiculatum (Contour)') {
      this.initOpusVermiculatum();
    } else if (this.currentStyle === 'Roman Meander Fractal') {
      this.initRomanMeanderFractal();
    } else if (this.currentStyle === 'Penrose Quasicrystal') {
      this.initPenroseQuasicrystal();
    }

    this.recomputeInsets();
    this.recolorMosaic();
  }

  // ==========================================
  // 1. VORONOI ORGANIC PAVEMENT WITH LLOYD'S
  // ==========================================
  initVoronoiPavement() {
    const count = Math.min(2200, Math.max(80, this.tesseraeDensity));
    const pad = 10;
    const w = this.width;
    const h = this.height;

    this.voronoiSeeds = [];
    // Seed points with mild blue-noise spatial jitter
    const cols = Math.ceil(Math.sqrt(count * (w / h)));
    const rows = Math.ceil(count / cols);
    const dx = (w - pad * 2) / cols;
    const dy = (h - pad * 2) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.voronoiSeeds.length >= count) break;
        const jx = (Math.random() - 0.5) * dx * 0.85;
        const jy = (Math.random() - 0.5) * dy * 0.85;
        this.voronoiSeeds.push({
          x: Math.max(pad, Math.min(w - pad, pad + (c + 0.5) * dx + jx)),
          y: Math.max(pad, Math.min(h - pad, pad + (r + 0.5) * dy + jy)),
          gold: Math.random() < 0.03,
          seed: Math.random() * 1000
        });
      }
    }

    this.computeVoronoiCells();
  }

  computeVoronoiCells() {
    const seeds = this.voronoiSeeds;
    const nSeeds = seeds.length;
    const w = this.width;
    const h = this.height;
    const pad = 4;

    // Build uniform spatial hash grid for fast neighbor lookup
    const cellSize = Math.max(25, Math.sqrt((w * h) / (nSeeds * 0.9)) * 2.2);
    const gridCols = Math.ceil(w / cellSize);
    const gridRows = Math.ceil(h / cellSize);
    const grid = new Map();

    const getCellKey = (gx, gy) => `${gx},${gy}`;

    for (let i = 0; i < nSeeds; i++) {
      const s = seeds[i];
      const gx = Math.floor(s.x / cellSize);
      const gy = Math.floor(s.y / cellSize);
      const k = getCellKey(gx, gy);
      let list = grid.get(k);
      if (!list) {
        list = [];
        grid.set(k, list);
      }
      list.push(i);
    }

    this.tesserae = [];

    // Clip bounding box for each seed
    for (let i = 0; i < nSeeds; i++) {
      const si = seeds[i];
      let poly = [
        { x: pad, y: pad },
        { x: w - pad, y: pad },
        { x: w - pad, y: h - pad },
        { x: pad, y: h - pad }
      ];

      const gx = Math.floor(si.x / cellSize);
      const gy = Math.floor(si.y / cellSize);

      // Collect candidate neighbors within radius
      const candidates = [];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const k = getCellKey(gx + dx, gy + dy);
          const list = grid.get(k);
          if (list) {
            for (let idx of list) {
              if (idx !== i) {
                const sj = seeds[idx];
                const d2 = (sj.x - si.x) ** 2 + (sj.y - si.y) ** 2;
                candidates.push({ idx, d2 });
              }
            }
          }
        }
      }

      // Sort candidate neighbors by proximity to si
      candidates.sort((a, b) => a.d2 - b.d2);
      const limit = Math.min(26, candidates.length);

      for (let c = 0; c < limit; c++) {
        const sj = seeds[candidates[c].idx];
        const mx = (si.x + sj.x) * 0.5;
        const my = (si.y + sj.y) * 0.5;
        const nx = sj.x - si.x;
        const ny = sj.y - si.y;
        const d = -(nx * mx + ny * my);

        poly = clipPolygonWithHalfPlane(poly, nx, ny, d);
        if (poly.length < 3) break;
      }

      if (poly.length >= 3) {
        const { cx, cy, area } = getPolygonCentroidAndArea(poly);
        this.tesserae.push({
          id: i,
          rawPoly: poly,
          poly: poly,
          cx,
          cy,
          area,
          gold: si.gold,
          seed: si.seed,
          material: si.gold ? 'gold' : (i % 7 === 0 ? 'porphyry' : (i % 3 === 0 ? 'basalt' : 'marble'))
        });
      }
    }
  }

  // Lloyd's relaxation step: moves seeds towards polygon centroids
  stepLloydRelaxation() {
    if (this.currentStyle === 'Voronoi Organic Pavement') {
      if (!this.tesserae.length) return;
      for (let t of this.tesserae) {
        const s = this.voronoiSeeds[t.id];
        if (s && t.area > 0) {
          // Smooth relaxation step with damping
          s.x += (t.cx - s.x) * 0.72;
          s.y += (t.cy - s.y) * 0.72;
          s.x = Math.max(10, Math.min(this.width - 10, s.x));
          s.y = Math.max(10, Math.min(this.height - 10, s.y));
        }
      }
      this.computeVoronoiCells();
      this.recomputeInsets();
      this.recolorMosaic();
    } else if (this.currentStyle === 'Opus Vermiculatum (Contour)') {
      // For Vermiculatum: relax contour rings into smoother concentric flow
      this.contourAttractors.forEach(att => {
        att.radius = Math.min(this.width, this.height) * (0.35 + Math.random() * 0.15);
      });
      this.initOpusVermiculatum();
      this.recomputeInsets();
      this.recolorMosaic();
    } else {
      this.subdivideFractal();
    }
  }

  // ==========================================
  // 2. ROMAN OPUS VERMICULATUM (CONTOUR RIPPLES)
  // ==========================================
  initOpusVermiculatum() {
    this.tesserae = [];
    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.hypot(w * 0.5, h * 0.5) * 1.05;

    // Density drives ring thickness and tile segment spacing
    const density = Math.min(2800, Math.max(200, this.tesseraeDensity));
    const targetTileSize = Math.max(8, Math.sqrt((w * h) / (density * 1.4)));
    const ringSpacing = targetTileSize;

    const ringCount = Math.floor(maxR / ringSpacing);
    let tileId = 0;

    for (let rIdx = 1; rIdx < ringCount; rIdx++) {
      const baseR = rIdx * ringSpacing;
      // Circumference and segment count
      const circum = 2 * Math.PI * baseR;
      const segCount = Math.max(8, Math.round(circum / targetTileSize));
      const dTheta = (Math.PI * 2) / segCount;

      // Classify ribbon type based on Roman villa conventions
      // Inner emblema: Medusa/Sun core (gold & cinnabar)
      // Middle concentric zones: undulating Greek frieze waves
      let isGoldRibbon = (rIdx === 1 || rIdx === 4 || rIdx === 12 || rIdx === 24);
      let ribbonType = (rIdx % 5 === 0) ? 'cinnabar' : ((rIdx % 3 === 0) ? 'basalt' : 'marble');

      for (let s = 0; s < segCount; s++) {
        const theta1 = s * dTheta;
        const theta2 = (s + 1) * dTheta;

        // Contour distortion function to create vermicular (worm-like) rippling curves
        const deform = (theta, radius) => {
          let r = radius;
          // Primary emblem harmonics (8-fold Roman rosette wave)
          const h8 = Math.cos(theta * 8) * (targetTileSize * 0.6);
          const h4 = Math.sin(theta * 4) * (targetTileSize * 0.4);
          const ripple = Math.sin(radius * 0.05 + theta * 2) * (targetTileSize * 0.5);
          r += (h8 + h4 + ripple);

          // Interaction attractors distortion
          for (let att of this.contourAttractors) {
            const px = cx + Math.cos(theta) * radius;
            const py = cy + Math.sin(theta) * radius;
            const dist = Math.hypot(px - att.x, py - att.y);
            r += Math.sin(dist * 0.08) * (targetTileSize * 0.7 * att.strength);
          }
          return r;
        };

        const rIn1 = deform(theta1, baseR - ringSpacing * 0.5);
        const rIn2 = deform(theta2, baseR - ringSpacing * 0.5);
        const rOut1 = deform(theta1, baseR + ringSpacing * 0.5);
        const rOut2 = deform(theta2, baseR + ringSpacing * 0.5);

        // Hand-cut stone chisel jitter
        const jit = (n) => (hash2D(s, rIdx, n) - 0.5) * (targetTileSize * 0.15);

        const p0 = { x: cx + Math.cos(theta1) * rIn1 + jit(1), y: cy + Math.sin(theta1) * rIn1 + jit(2) };
        const p1 = { x: cx + Math.cos(theta2) * rIn2 + jit(3), y: cy + Math.sin(theta2) * rIn2 + jit(4) };
        const p2 = { x: cx + Math.cos(theta2) * rOut2 + jit(5), y: cy + Math.sin(theta2) * rOut2 + jit(6) };
        const p3 = { x: cx + Math.cos(theta1) * rOut1 + jit(7), y: cy + Math.sin(theta1) * rOut1 + jit(8) };

        // Clip to canvas window
        const midX = (p0.x + p1.x + p2.x + p3.x) * 0.25;
        const midY = (p0.y + p1.y + p2.y + p3.y) * 0.25;

        if (midX >= -10 && midX <= w + 10 && midY >= -10 && midY <= h + 10) {
          const poly = [p0, p1, p2, p3];
          const { cx: tcx, cy: tcy, area } = getPolygonCentroidAndArea(poly);

          const isGold = isGoldRibbon && (s % 2 === 0);
          this.tesserae.push({
            id: tileId++,
            rawPoly: poly,
            poly: poly,
            cx: tcx,
            cy: tcy,
            area,
            gold: isGold,
            seed: rIdx * 100 + s,
            material: isGold ? 'gold' : ribbonType
          });
        }
      }
    }
  }

  // ==========================================
  // 3. ROMAN MEANDER FRACTAL (GREEK KEY)
  // ==========================================
  initRomanMeanderFractal() {
    this.tesserae = [];
    const w = this.width;
    const h = this.height;
    const depth = Math.min(4, Math.max(1, this.fractalMeanderDepth));

    // Classical Roman Labyrinth / Meander Recursive Pattern
    // Divides area into recursive Greek Key spiral paths
    const pad = Math.min(w, h) * 0.06;
    const boxW = w - pad * 2;
    const boxH = h - pad * 2;

    const meanderSegments = [];

    // Recursive Meander subdivision function
    const subdivideQuadrant = (x, y, sw, sh, d, dir) => {
      if (d <= 1) {
        // Base Roman Meander Key Motif (Classical 7-step orthogonal key)
        const u = sw / 4;
        const v = sh / 4;
        const pts = [
          { x: x, y: y + sh },
          { x: x, y: y },
          { x: x + sw, y: y },
          { x: x + sw, y: y + sh - v },
          { x: x + u, y: y + sh - v },
          { x: x + u, y: y + v },
          { x: x + sw - u, y: y + v },
          { x: x + sw - u, y: y + sh * 0.5 }
        ];
        if (dir === -1) pts.reverse();
        for (let i = 0; i < pts.length - 1; i++) {
          meanderSegments.push({ p1: pts[i], p2: pts[i + 1], level: d });
        }
        return;
      }

      // Recursive 4-quadrant decomposition with Hilbert-like Roman labyrinth rotations
      const halfW = sw * 0.5;
      const halfH = sh * 0.5;
      subdivideQuadrant(x, y, halfW, halfH, d - 1, dir);
      subdivideQuadrant(x + halfW, y, halfW, halfH, d - 1, -dir);
      subdivideQuadrant(x + halfW, y + halfH, halfW, halfH, d - 1, dir);
      subdivideQuadrant(x, y + halfH, halfW, halfH, d - 1, -dir);
    };

    subdivideQuadrant(pad, pad, boxW, boxH, depth, 1);

    // Now discretize every meander segment into physical stone tesserae
    const densityFactor = Math.sqrt(this.tesseraeDensity / 600);
    const tileSize = Math.max(6, 16 / (depth * densityFactor));
    let tileId = 0;

    meanderSegments.forEach((seg, idx) => {
      const dx = seg.p2.x - seg.p1.x;
      const dy = seg.p2.y - seg.p1.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;

      const steps = Math.max(1, Math.round(len / tileSize));
      const ux = dx / len;
      const uy = dy / len;
      // Perpendicular normal vector
      const nx = -uy * (tileSize * 0.5);
      const ny = ux * (tileSize * 0.5);

      for (let s = 0; s < steps; s++) {
        const t1 = s / steps;
        const t2 = (s + 1) / steps;
        const x1 = seg.p1.x + dx * t1;
        const y1 = seg.p1.y + dy * t1;
        const x2 = seg.p1.x + dx * t2;
        const y2 = seg.p1.y + dy * t2;

        const jit = (n) => (hash2D(s, idx, n) - 0.5) * (tileSize * 0.15);

        const poly = [
          { x: x1 - nx + jit(1), y: y1 - ny + jit(2) },
          { x: x2 - nx + jit(3), y: y2 - ny + jit(4) },
          { x: x2 + nx + jit(5), y: y2 + ny + jit(6) },
          { x: x1 + nx + jit(7), y: y1 + ny + jit(8) }
        ];

        const { cx, cy, area } = getPolygonCentroidAndArea(poly);
        const isCorner = (s === 0 || s === steps - 1);
        const isGold = isCorner && (idx % 3 === 0);

        this.tesserae.push({
          id: tileId++,
          rawPoly: poly,
          poly: poly,
          cx,
          cy,
          area,
          gold: isGold,
          seed: idx * 50 + s,
          material: isGold ? 'gold' : (idx % 2 === 0 ? 'porphyry' : 'marble')
        });
      }
    });

    // Add surrounding outer guilloche frieze tesserae border
    const borderRows = 2;
    const bStep = tileSize * 1.2;
    for (let br = 0; br < borderRows; br++) {
      const bPad = pad - (br + 1) * bStep;
      if (bPad > 2) {
        const bw = w - bPad * 2;
        const bh = h - bPad * 2;
        const horizSteps = Math.floor(bw / bStep);
        const vertSteps = Math.floor(bh / bStep);

        // Top & Bottom border rows
        for (let bx = 0; bx < horizSteps; bx++) {
          const x0 = bPad + bx * bStep;
          const y0 = bPad;
          const polyTop = [
            { x: x0, y: y0 }, { x: x0 + bStep, y: y0 },
            { x: x0 + bStep, y: y0 + bStep }, { x: x0, y: y0 + bStep }
          ];
          const { cx, cy, area } = getPolygonCentroidAndArea(polyTop);
          this.tesserae.push({
            id: tileId++,
            rawPoly: polyTop,
            poly: polyTop,
            cx, cy, area,
            gold: br === 0 && (bx % 6 === 0),
            seed: bx * 77 + br,
            material: (bx % 2 === 0) ? 'basalt' : 'terracotta'
          });
        }
      }
    }
  }

  // Subdivide Roman Meander or Penrose fractal
  subdivideFractal() {
    if (this.currentStyle === 'Roman Meander Fractal') {
      this.fractalMeanderDepth = (this.fractalMeanderDepth % 4) + 1;
      this.initRomanMeanderFractal();
    } else if (this.currentStyle === 'Penrose Quasicrystal') {
      this.penroseDepth = ((this.penroseDepth - 1) % 4) + 2;
      this.initPenroseQuasicrystal();
    } else {
      this.stepLloydRelaxation();
      return;
    }
    this.recomputeInsets();
    this.recolorMosaic();
  }

  // ==========================================
  // 4. PENROSE QUASICRYSTAL (ROBINSON DEFLATION)
  // ==========================================
  initPenroseQuasicrystal() {
    this.tesserae = [];
    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const radius = Math.max(w, h) * 0.62;

    const PHI = (1 + Math.sqrt(5)) * 0.5; // Golden ratio ~1.6180339887

    // Robinson golden triangles:
    // Type 0: Acute Golden Triangle (sides: 1, phi, phi; angles: 36, 72, 72)
    // Type 1: Obtuse Golden Triangle (sides: phi, 1, 1; angles: 108, 36, 36)
    let triangles = [];

    // Initialize 10 golden triangles forming a 10-fold decagon rosette meeting at center
    for (let i = 0; i < 10; i++) {
      const a1 = (i * 36) * (Math.PI / 180);
      const a2 = ((i + 1) * 36) * (Math.PI / 180);
      const pB = { x: cx + Math.cos(a1) * radius, y: cy + Math.sin(a1) * radius };
      const pC = { x: cx + Math.cos(a2) * radius, y: cy + Math.sin(a2) * radius };
      // Alternating mirroring for Penrose symmetry
      if (i % 2 === 0) {
        triangles.push({ type: 0, A: { x: cx, y: cy }, B: pB, C: pC });
      } else {
        triangles.push({ type: 0, A: { x: cx, y: cy }, B: pC, C: pB });
      }
    }

    // Deflate recursively
    const depth = Math.min(4, Math.max(2, this.penroseDepth));
    for (let d = 0; d < depth; d++) {
      const nextTriangles = [];
      for (let tri of triangles) {
        const { type, A, B, C } = tri;
        if (type === 0) {
          // Subdivide acute triangle: P divides side AC in ratio 1 : phi
          const P = {
            x: A.x + (C.x - A.x) / PHI,
            y: A.y + (C.y - A.y) / PHI
          };
          nextTriangles.push({ type: 0, A: C, B: P, C: B });
          nextTriangles.push({ type: 1, A: B, B: P, C: A });
        } else {
          // Subdivide obtuse triangle: Q divides side BA in ratio 1 : phi
          const Q = {
            x: B.x + (A.x - B.x) / PHI,
            y: B.y + (A.y - B.y) / PHI
          };
          nextTriangles.push({ type: 1, A: C, B: Q, C: B });
          nextTriangles.push({ type: 0, A: Q, B: C, C: A });
        }
      }
      triangles = nextTriangles;
    }

    // Convert triangles into tesserae polygons
    let tileId = 0;
    triangles.forEach((tri, idx) => {
      // Jitter triangle vertices slightly for hand-cleaved cut marble texture
      const jit = (n) => (hash2D(idx, n, 88) - 0.5) * 1.5;
      const poly = [
        { x: tri.A.x + jit(1), y: tri.A.y + jit(2) },
        { x: tri.B.x + jit(3), y: tri.B.y + jit(4) },
        { x: tri.C.x + jit(5), y: tri.C.y + jit(6) }
      ];

      const { cx: tcx, cy: tcy, area } = getPolygonCentroidAndArea(poly);

      // Keep only tiles within screen margins
      if (tcx >= -20 && tcx <= w + 20 && tcy >= -20 && tcy <= h + 20) {
        const distToCenter = Math.hypot(tcx - cx, tcy - cy);
        const isGold = (tri.type === 1 && distToCenter < radius * 0.25) || (idx % 19 === 0);

        this.tesserae.push({
          id: tileId++,
          rawPoly: poly,
          poly: poly,
          cx: tcx,
          cy: tcy,
          area,
          gold: isGold,
          seed: idx * 37,
          material: isGold ? 'gold' : (tri.type === 0 ? 'porphyry' : 'marble')
        });
      }
    });
  }

  // Recompute inset stone polygons based on mortar grout width
  recomputeInsets() {
    this.totalVertices = 0;
    for (let t of this.tesserae) {
      if (t.rawPoly && t.rawPoly.length >= 3) {
        t.poly = insetPolygon(t.rawPoly, t.cx, t.cy, this.groutWidth);
        this.totalVertices += t.poly.length;
      }
    }
  }

  // Recolor all tesserae tiles based on the active Roman Villa Palette
  recolorMosaic() {
    const pal = this.palette;
    for (let t of this.tesserae) {
      const h = hash2D(t.id, t.seed || 0);

      if (t.gold) {
        const gIdx = Math.floor(h * pal.gold.length) % pal.gold.length;
        t.fillColor = pal.gold[gIdx];
        t.specular = 0.95;
        t.roughness = 0.15;
      } else if (t.material === 'porphyry' || t.material === 'cinnabar') {
        const pIdx = Math.floor(h * pal.primary.length) % pal.primary.length;
        t.fillColor = pal.primary[pIdx];
        t.specular = 0.45;
        t.roughness = 0.4;
      } else if (t.material === 'basalt') {
        const sIdx = Math.floor(h * pal.secondary.length) % pal.secondary.length;
        t.fillColor = pal.secondary[sIdx];
        t.specular = 0.3;
        t.roughness = 0.5;
      } else if (t.material === 'terracotta') {
        const aIdx = Math.floor(h * pal.accent.length) % pal.accent.length;
        t.fillColor = pal.accent[aIdx];
        t.specular = 0.2;
        t.roughness = 0.6;
      } else {
        // Carrara / Thassos / Statuario White Marble
        const mIdx = Math.floor(h * pal.tertiary.length) % pal.tertiary.length;
        t.fillColor = pal.tertiary[mIdx];
        t.specular = 0.55;
        t.roughness = 0.35;
      }
    }
  }

  // ==========================================
  // SIMULATION & LIFECYCLE
  // ==========================================
  update(dt) {
    this.time += dt;

    // Smooth Roman oil lamp torch light tracking towards mouse position
    const followSpeed = 8.0 * dt;
    this.lightPos.x += (this.mousePos.x - this.lightPos.x) * Math.min(1.0, followSpeed);
    this.lightPos.y += (this.mousePos.y - this.lightPos.y) * Math.min(1.0, followSpeed);
  }

  render(ctx) {
    const w = this.width;
    const h = this.height;
    const pal = this.palette;

    // 1. Render Roman Lime Mortar Grout Background
    ctx.fillStyle = pal.grout;
    ctx.fillRect(0, 0, w, h);

    // Fine mortar pebble aggregate texture
    ctx.fillStyle = pal.groutAlt;
    const speckleStep = 18;
    for (let sy = 0; sy < h; sy += speckleStep) {
      for (let sx = 0; sx < w; sx += speckleStep) {
        const rnd = hash2D(sx, sy, 77);
        if (rnd > 0.65) {
          ctx.fillRect(sx + (rnd * 6), sy + (rnd * 4), 2, 2);
        }
      }
    }

    const lx = this.lightPos.x;
    const ly = this.lightPos.y;
    const lz = 70; // Height of Roman lamp flame above mosaic pavement
    const time = this.time;

    // 2. Render Cut Marble Tesserae Stones
    const numTiles = this.tesserae.length;

    for (let i = 0; i < numTiles; i++) {
      const t = this.tesserae[i];
      const poly = t.poly;
      const vCount = poly.length;
      if (vCount < 3) continue;

      // Distance and light vector to torch
      const dx = lx - t.cx;
      const dy = ly - t.cy;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq + lz * lz);
      const lightFactor = Math.max(0.2, 1.0 - (distSq / (w * w * 0.75)));

      // Begin stone polygon
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let v = 1; v < vCount; v++) {
        ctx.lineTo(poly[v].x, poly[v].y);
      }
      ctx.closePath();

      // Stone base color
      ctx.fillStyle = t.fillColor;
      ctx.fill();

      // Individual stone surface beveling and hand-chiseled facets
      // Chisel bevel edge lighting (top-left lit, bottom-right shadow)
      for (let e = 0; e < vCount; e++) {
        const p1 = poly[e];
        const p2 = poly[(e + 1) % vCount];

        const edgeDx = p2.x - p1.x;
        const edgeDy = p2.y - p1.y;
        const edgeLen = Math.hypot(edgeDx, edgeDy);
        if (edgeLen < 0.001) continue;

        // Outward normal of the edge
        const enx = edgeDy / edgeLen;
        const eny = -edgeDx / edgeLen;

        // Dot product with torch light vector
        const lnx = dx / dist;
        const lny = dy / dist;
        const dot = enx * lnx + eny * lny;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (dot > 0.15) {
          // Illuminated bevel edge
          ctx.strokeStyle = `rgba(255, 250, 230, ${(dot * 0.45 * lightFactor).toFixed(2)})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        } else if (dot < -0.15) {
          // Grout shadow edge
          ctx.strokeStyle = `rgba(0, 0, 0, ${(-dot * 0.45).toFixed(2)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Gold Leaf Specular Sparkle & Metallic Flakes
      if (t.gold && this.goldShimmerEnabled) {
        // Animated twinkling sparkle for gold foil tesserae
        const twinkle = Math.sin(time * 6.0 + t.seed) * 0.35 + 0.65;
        const goldProximity = Math.max(0, 1.0 - (Math.hypot(dx, dy) / 280));

        if (goldProximity > 0.05) {
          ctx.fillStyle = `rgba(255, 245, 180, ${(goldProximity * twinkle * 0.6).toFixed(2)})`;
          ctx.fill();

          // Star glint at stone center when directly under torch light
          if (goldProximity > 0.7 && twinkle > 0.8) {
            const glintSize = 3.5 * twinkle;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(t.cx - glintSize * 0.5, t.cy - 0.5, glintSize, 1);
            ctx.fillRect(t.cx - 0.5, t.cy - glintSize * 0.5, 1, glintSize);
          }
        }
      }
    }

    // 3. Render Roman Oil Lamp Torch Radial Glow
    const torchGlow = ctx.createRadialGradient(lx, ly, 10, lx, ly, Math.min(w, h) * 0.48);
    torchGlow.addColorStop(0, 'rgba(255, 215, 120, 0.22)');
    torchGlow.addColorStop(0.35, 'rgba(212, 120, 40, 0.10)');
    torchGlow.addColorStop(0.8, 'rgba(80, 25, 10, 0.04)');
    torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = torchGlow;
    ctx.fillRect(0, 0, w, h);

    // 4. Subtle Ambient Vignette
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.hypot(w * 0.5, h * 0.5));
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(10, 8, 7, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // 5. Cursor Lamp Indicator
    ctx.beginPath();
    ctx.arc(this.mousePos.x, this.mousePos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffec8b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Total count of simulated entities (tiles, Voronoi cells, vertices)
  getEntityCount() {
    return this.tesserae.length + this.voronoiSeeds.length + this.totalVertices;
  }

  // ==========================================
  // INTERACTION HANDLERS
  // ==========================================
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = { x: pos.x, y: pos.y };
    this.handleInteraction(pos);
  }

  onMouseMove(pos) {
    this.mousePos = { x: pos.x, y: pos.y };
    if (this.isMouseDown) {
      this.handleInteraction(pos);
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  handleInteraction(pos) {
    const x = pos.x;
    const y = pos.y;

    if (this.selectedTool === 'gold') {
      // Paint stone tile with gold leaf under cursor
      for (let t of this.tesserae) {
        if (Math.hypot(t.cx - x, t.cy - y) < 24) {
          t.gold = true;
          t.material = 'gold';
        }
      }
      this.recolorMosaic();
      return;
    }

    if (this.currentStyle === 'Voronoi Organic Pavement') {
      // Deposit new stone seed in Voronoi mosaic
      if (this.voronoiSeeds.length < 2800) {
        this.voronoiSeeds.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          gold: Math.random() < 0.15,
          seed: Math.random() * 999
        });
        this.computeVoronoiCells();
        this.recomputeInsets();
        this.recolorMosaic();
      }
    } else if (this.currentStyle === 'Opus Vermiculatum (Contour)') {
      // Add contour ripple attractor at click location
      this.contourAttractors.push({
        x: x,
        y: y,
        radius: 80,
        strength: 1.2
      });
      if (this.contourAttractors.length > 5) this.contourAttractors.shift();
      this.initOpusVermiculatum();
      this.recomputeInsets();
      this.recolorMosaic();
    } else {
      // Roman Meander / Penrose: Gild tiles near click
      for (let t of this.tesserae) {
        if (Math.hypot(t.cx - x, t.cy - y) < 30) {
          t.gold = true;
        }
      }
      this.recolorMosaic();
    }
  }

  onKeyDown(key) {
    if (key === ' ' || key === 'Spacebar') {
      // Space runs a relaxation step
      this.stepLloydRelaxation();
    } else if (key === 'm' || key === 'M') {
      // Subdivide meander / fractal
      this.subdivideFractal();
    } else if (key === 'r' || key === 'R') {
      // Randomize / re-cut
      this.reset();
    } else if (key === '1') {
      this.currentStyle = MOSAIC_STYLES[0];
      if (this.styleSelect) this.styleSelect.value = this.currentStyle;
      this.reset();
    } else if (key === '2') {
      this.currentStyle = MOSAIC_STYLES[1];
      if (this.styleSelect) this.styleSelect.value = this.currentStyle;
      this.reset();
    } else if (key === '3') {
      this.currentStyle = MOSAIC_STYLES[2];
      if (this.styleSelect) this.styleSelect.value = this.currentStyle;
      this.reset();
    } else if (key === '4') {
      this.currentStyle = MOSAIC_STYLES[3];
      if (this.styleSelect) this.styleSelect.value = this.currentStyle;
      this.reset();
    } else if (key === 'g' || key === 'G') {
      this.goldShimmerEnabled = !this.goldShimmerEnabled;
    }
  }

  destroy() {
    if (this.controlsContainer && typeof document !== 'undefined') {
      this.controlsContainer.innerHTML = '';
    }
    this.tesserae = [];
    this.voronoiSeeds = [];
  }
}
