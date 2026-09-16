// Vesuvius: Thermodynamic Cellular Automata & Volcanology Simulation
// Grounded in Pliny the Younger's eyewitness account of the 79 AD eruption

export const ELEMENT = {
  EMPTY: 0,
  STONE: 1,
  SAND: 2,
  LAVA: 3,
  WATER: 4,
  STEAM: 5,
  FIRE: 6,
  SMOKE: 7,
  ASH: 8,
  MAGMA_CORE: 9,
  OIL: 10
};

const PALETTE = {
  [ELEMENT.EMPTY]: [10, 11, 14, 255],
  [ELEMENT.STONE]: [82, 85, 96, 255],
  [ELEMENT.SAND]: [212, 185, 110, 255],
  [ELEMENT.LAVA]: [255, 90, 10, 255],
  [ELEMENT.WATER]: [45, 135, 235, 220],
  [ELEMENT.STEAM]: [200, 215, 235, 120],
  [ELEMENT.FIRE]: [255, 210, 40, 240],
  [ELEMENT.SMOKE]: [50, 48, 55, 180],
  [ELEMENT.ASH]: [140, 138, 142, 230],
  [ELEMENT.MAGMA_CORE]: [255, 40, 0, 255],
  [ELEMENT.OIL]: [70, 50, 40, 255]
};

export class VesuviusEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    // Simulation grid dimensions
    this.simWidth = 240;
    this.simHeight = 160;
    this.grid = new Uint8Array(this.simWidth * this.simHeight);
    this.heat = new Float32Array(this.simWidth * this.simHeight);
    this.visited = new Uint8Array(this.simWidth * this.simHeight);

    // Offscreen render buffer
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.simWidth;
    this.offscreenCanvas.height = this.simHeight;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    this.imgData = this.offscreenCtx.createImageData(this.simWidth, this.simHeight);

    // State & parameters
    this.selectedElement = ELEMENT.LAVA;
    this.brushSize = 4;
    this.isDrawing = false;
    this.mousePos = { x: 0, y: 0 };
    this.chamberPressure = 20;
    this.windSpeed = -0.5;
    this.eruptionActive = false;
    this.volcanoBuilt = false;
    this.particleCount = 0;

    this.initControls();
    this.buildVolcanoTerrain();
  }

  initControls() {
    if (!this.controlsContainer) return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Material Brush</label>
        <div class="control-btn-grid" id="elem-selector">
          <button class="sub-btn active" data-elem="${ELEMENT.LAVA}">🔥 Lava</button>
          <button class="sub-btn" data-elem="${ELEMENT.WATER}">💧 Water</button>
          <button class="sub-btn" data-elem="${ELEMENT.SAND}">🏜️ Sand</button>
          <button class="sub-btn" data-elem="${ELEMENT.STONE}">🪨 Basalt</button>
          <button class="sub-btn" data-elem="${ELEMENT.OIL}">🛢️ Naptha</button>
          <button class="sub-btn" data-elem="${ELEMENT.FIRE}">⚡ Fire</button>
          <button class="sub-btn" data-elem="${ELEMENT.MAGMA_CORE}">🌋 Magma Core</button>
          <button class="sub-btn" data-elem="${ELEMENT.EMPTY}">🧹 Excavate</button>
        </div>
      </div>

      <div class="control-group">
        <label>Brush Radius: <span id="brush-val">${this.brushSize}px</span></label>
        <input type="range" id="brush-slider" min="1" max="14" value="${this.brushSize}">
      </div>

      <div class="control-group">
        <label>Magma Chamber Pressure</label>
        <input type="range" id="pressure-slider" min="0" max="100" value="${this.chamberPressure}">
      </div>

      <div class="control-group">
        <label>Atmospheric Wind Drift</label>
        <input type="range" id="wind-slider" min="-3" max="3" step="0.5" value="${this.windSpeed}">
      </div>

      <div class="control-group">
        <button id="erupt-btn" class="sub-btn" style="background: rgba(200,50,50,0.3); border-color: var(--accent-crimson); font-weight: bold; padding: 10px;">
          🌋 TRIGGER PLINIAN ERUPTION
        </button>
      </div>
    `;

    // Bind controls
    this.controlsContainer.querySelectorAll('#elem-selector .sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controlsContainer.querySelectorAll('#elem-selector .sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedElement = parseInt(btn.dataset.elem, 10);
      });
    });

    const brushSlider = this.controlsContainer.querySelector('#brush-slider');
    const brushVal = this.controlsContainer.querySelector('#brush-val');
    brushSlider.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value, 10);
      brushVal.textContent = `${this.brushSize}px`;
    });

    const pressureSlider = this.controlsContainer.querySelector('#pressure-slider');
    pressureSlider.addEventListener('input', (e) => {
      this.chamberPressure = parseInt(e.target.value, 10);
    });

    const windSlider = this.controlsContainer.querySelector('#wind-slider');
    windSlider.addEventListener('input', (e) => {
      this.windSpeed = parseFloat(e.target.value);
    });

    const eruptBtn = this.controlsContainer.querySelector('#erupt-btn');
    eruptBtn.addEventListener('click', () => {
      this.triggerEruption();
    });
  }

  buildVolcanoTerrain() {
    this.grid.fill(ELEMENT.EMPTY);
    this.heat.fill(20); // 20 C ambient

    const w = this.simWidth;
    const h = this.simHeight;
    const peakX = Math.floor(w * 0.48);
    const peakY = Math.floor(h * 0.42);
    const ventWidth = 14;

    // Construct stratified stratovolcano cone
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        
        // Bedrock base
        if (y > h - 18) {
          this.grid[idx] = ELEMENT.STONE;
          this.heat[idx] = 25;
          continue;
        }

        // Mountain flanks slope equation
        const distFromPeak = Math.abs(x - peakX);
        const mountainHeight = Math.max(0, (h - 20 - peakY) - distFromPeak * 0.72);
        const surfaceY = (h - 20) - mountainHeight;

        if (y >= surfaceY) {
          // Vent conduit in middle
          if (distFromPeak < ventWidth / 2 && y < h - 35) {
            // Conduit interior: magma reservoir
            if (y > h - 50) {
              this.grid[idx] = ELEMENT.LAVA;
              this.heat[idx] = 850;
            } else {
              this.grid[idx] = ELEMENT.EMPTY;
            }
          } else {
            // Layered volcanic rock and ash strata
            if ((y + Math.sin(x * 0.15) * 3) % 10 < 3) {
              this.grid[idx] = ELEMENT.ASH;
            } else {
              this.grid[idx] = ELEMENT.STONE;
            }
            this.heat[idx] = 30;
          }
        }
      }
    }

    // Subterranean Magma Chamber
    const chamberX = peakX;
    const chamberY = h - 26;
    const chamberR = 24;

    for (let dy = -chamberR; dy <= chamberR; dy++) {
      for (let dx = -chamberR; dx <= chamberR; dx++) {
        if (dx * dx + dy * dy * 1.5 < chamberR * chamberR) {
          const cx = chamberX + dx;
          const cy = chamberY + dy;
          if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
            const idx = cy * w + cx;
            if (dx * dx + dy * dy < 16) {
              this.grid[idx] = ELEMENT.MAGMA_CORE;
              this.heat[idx] = 1200;
            } else {
              this.grid[idx] = ELEMENT.LAVA;
              this.heat[idx] = 950;
            }
          }
        }
      }
    }
  }

  triggerEruption() {
    this.eruptionActive = true;
    const w = this.simWidth;
    const h = this.simHeight;
    const ventX = Math.floor(w * 0.48);
    const ventY = Math.floor(h * 0.42);

    // Blast conduit clear of obstructions
    for (let dy = -15; dy <= 20; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        const x = ventX + dx;
        const y = ventY + dy;
        if (x >= 0 && x < w && y >= 0 && y < h) {
          const idx = y * w + x;
          this.grid[idx] = ELEMENT.FIRE;
          this.heat[idx] = 1100;
        }
      }
    }

    // Spawn massive ash column and lava fountain
    for (let i = 0; i < 40; i++) {
      const vx = ventX + (Math.random() - 0.5) * 12;
      const vy = ventY - 5 - Math.random() * 25;
      const rx = Math.floor(vx);
      const ry = Math.floor(vy);
      if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
        const idx = ry * w + rx;
        this.grid[idx] = Math.random() < 0.6 ? ELEMENT.LAVA : ELEMENT.FIRE;
        this.heat[idx] = 1000;
      }
    }
  }

  onMouseDown(pos) {
    this.isDrawing = true;
    this.mousePos = pos;
    this.paint(pos);
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    if (this.isDrawing) {
      this.paint(pos);
    }
  }

  onMouseUp() {
    this.isDrawing = false;
  }

  onWheel(deltaY) {
    if (deltaY < 0) {
      this.brushSize = Math.min(16, this.brushSize + 1);
    } else {
      this.brushSize = Math.max(1, this.brushSize - 1);
    }
    const brushVal = this.controlsContainer.querySelector('#brush-val');
    const brushSlider = this.controlsContainer.querySelector('#brush-slider');
    if (brushVal) brushVal.textContent = `${this.brushSize}px`;
    if (brushSlider) brushSlider.value = this.brushSize;
  }

  onContextMenu(pos) {
    // Right click triggers heat / explosion at point
    const gx = Math.floor((pos.x / this.canvas.width) * this.simWidth);
    const gy = Math.floor((pos.y / this.canvas.height) * this.simHeight);
    this.explode(gx, gy, 10);
  }

  paint(pos) {
    const gx = Math.floor((pos.x / this.canvas.width) * this.simWidth);
    const gy = Math.floor((pos.y / this.canvas.height) * this.simHeight);
    const r = this.brushSize;
    const w = this.simWidth;
    const h = this.simHeight;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = gx + dx;
          const y = gy + dy;
          if (x >= 0 && x < w && y >= 0 && y < h) {
            const idx = y * w + x;
            this.grid[idx] = this.selectedElement;
            if (this.selectedElement === ELEMENT.LAVA) this.heat[idx] = 950;
            else if (this.selectedElement === ELEMENT.FIRE) this.heat[idx] = 1100;
            else if (this.selectedElement === ELEMENT.WATER) this.heat[idx] = 15;
            else if (this.selectedElement === ELEMENT.EMPTY) this.heat[idx] = 20;
          }
        }
      }
    }
  }

  explode(cx, cy, radius) {
    const w = this.simWidth;
    const h = this.simHeight;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSq = dx * dx + dy * dy;
        if (distSq <= radius * radius) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < w && y >= 0 && y < h) {
            const idx = y * w + x;
            if (distSq < radius * 2) {
              this.grid[idx] = ELEMENT.FIRE;
              this.heat[idx] = 1400;
            } else if (this.grid[idx] === ELEMENT.STONE) {
              this.grid[idx] = Math.random() < 0.5 ? ELEMENT.ASH : ELEMENT.SAND;
            }
          }
        }
      }
    }
  }

  update(dt) {
    this.visited.fill(0);
    const w = this.simWidth;
    const h = this.simHeight;
    let totalActive = 0;

    // Process subterranean pressure & chamber bubbling
    if (this.chamberPressure > 0) {
      const chamberX = Math.floor(w * 0.48);
      const chamberY = h - 26;
      if (Math.random() < this.chamberPressure * 0.005) {
        // Spawn rising lava bubble
        const bx = chamberX + Math.floor((Math.random() - 0.5) * 10);
        const by = chamberY - 10;
        const idx = by * w + bx;
        if (this.grid[idx] === ELEMENT.EMPTY || this.grid[idx] === ELEMENT.LAVA) {
          this.grid[idx] = Math.random() < 0.3 ? ELEMENT.FIRE : ELEMENT.LAVA;
          this.heat[idx] = 1100;
        }
      }
    }

    // Bottom-to-top traversal for falling gravity elements
    for (let y = h - 1; y >= 0; y--) {
      // Alternate X direction scan to prevent directional bias
      const leftToRight = (y % 2 === 0);
      const startX = leftToRight ? 0 : w - 1;
      const endX = leftToRight ? w : -1;
      const stepX = leftToRight ? 1 : -1;

      for (let x = startX; x !== endX; x += stepX) {
        const idx = y * w + x;
        const elem = this.grid[idx];

        if (elem === ELEMENT.EMPTY) continue;
        totalActive++;

        if (this.visited[idx]) continue;

        switch (elem) {
          case ELEMENT.SAND:
          case ELEMENT.ASH:
            this.updateFallingSolid(x, y, idx, elem);
            break;

          case ELEMENT.WATER:
          case ELEMENT.OIL:
            this.updateLiquid(x, y, idx, elem, elem === ELEMENT.WATER ? 3 : 2);
            break;

          case ELEMENT.LAVA:
            this.updateLava(x, y, idx);
            break;

          case ELEMENT.FIRE:
            this.updateFire(x, y, idx);
            break;

          case ELEMENT.STEAM:
          case ELEMENT.SMOKE:
            this.updateGas(x, y, idx, elem);
            break;

          case ELEMENT.MAGMA_CORE:
            // Continuous magma generator
            if (Math.random() < 0.08) {
              const aboveIdx = (y - 1) * w + x;
              if (y > 0 && (this.grid[aboveIdx] === ELEMENT.EMPTY || this.grid[aboveIdx] === ELEMENT.STONE)) {
                this.grid[aboveIdx] = ELEMENT.LAVA;
                this.heat[aboveIdx] = 1100;
              }
            }
            break;
        }
      }
    }

    this.particleCount = totalActive;
  }

  updateFallingSolid(x, y, idx, elem) {
    const w = this.simWidth;
    const h = this.simHeight;
    if (y >= h - 1) return;

    const belowIdx = (y + 1) * w + x;
    const belowElem = this.grid[belowIdx];

    // Fall directly down
    if (belowElem === ELEMENT.EMPTY || belowElem === ELEMENT.WATER || belowElem === ELEMENT.OIL) {
      this.swap(idx, belowIdx);
      this.visited[belowIdx] = 1;
      return;
    }

    // Down-diagonal slide
    const dir = Math.random() < 0.5 ? 1 : -1;
    const d1x = x + dir;
    const d2x = x - dir;

    if (d1x >= 0 && d1x < w) {
      const diag1 = (y + 1) * w + d1x;
      if (this.grid[diag1] === ELEMENT.EMPTY) {
        this.swap(idx, diag1);
        this.visited[diag1] = 1;
        return;
      }
    }

    if (d2x >= 0 && d2x < w) {
      const diag2 = (y + 1) * w + d2x;
      if (this.grid[diag2] === ELEMENT.EMPTY) {
        this.swap(idx, diag2);
        this.visited[diag2] = 1;
      }
    }
  }

  updateLiquid(x, y, idx, elem, spread) {
    const w = this.simWidth;
    const h = this.simHeight;
    if (y >= h - 1) return;

    // Down
    const belowIdx = (y + 1) * w + x;
    if (this.grid[belowIdx] === ELEMENT.EMPTY) {
      this.swap(idx, belowIdx);
      this.visited[belowIdx] = 1;
      return;
    }

    // Water extinguish fire or boil
    if (elem === ELEMENT.WATER && this.heat[idx] > 100) {
      this.grid[idx] = ELEMENT.STEAM;
      return;
    }

    // Diagonal flow
    const dir = Math.random() < 0.5 ? 1 : -1;
    const d1 = x + dir;
    const d2 = x - dir;

    if (d1 >= 0 && d1 < w && this.grid[(y + 1) * w + d1] === ELEMENT.EMPTY) {
      this.swap(idx, (y + 1) * w + d1);
      this.visited[(y + 1) * w + d1] = 1;
      return;
    }

    if (d2 >= 0 && d2 < w && this.grid[(y + 1) * w + d2] === ELEMENT.EMPTY) {
      this.swap(idx, (y + 1) * w + d2);
      this.visited[(y + 1) * w + d2] = 1;
      return;
    }

    // Lateral spread
    for (let s = 1; s <= spread; s++) {
      const lx = x + dir * s;
      if (lx >= 0 && lx < w && this.grid[y * w + lx] === ELEMENT.EMPTY) {
        this.swap(idx, y * w + lx);
        this.visited[y * w + lx] = 1;
        return;
      }
    }
  }

  updateLava(x, y, idx) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Lava interaction with neighbors
    const neighbors = [
      (y - 1) * w + x,
      (y + 1) * w + x,
      y * w + (x - 1),
      y * w + (x + 1)
    ];

    for (const nIdx of neighbors) {
      if (nIdx >= 0 && nIdx < w * h) {
        const nElem = this.grid[nIdx];
        if (nElem === ELEMENT.WATER) {
          // Water + Lava -> Stone + Steam explosion!
          this.grid[idx] = ELEMENT.STONE;
          this.grid[nIdx] = ELEMENT.STEAM;
          this.heat[idx] = 300;
          this.heat[nIdx] = 200;
          return;
        } else if (nElem === ELEMENT.OIL) {
          this.grid[nIdx] = ELEMENT.FIRE;
          this.heat[nIdx] = 1200;
        }
      }
    }

    // Viscous fluid motion (slower than water)
    if (Math.random() < 0.7) {
      this.updateLiquid(x, y, idx, ELEMENT.LAVA, 1);
    }
  }

  updateFire(x, y, idx) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Fire burns and dies quickly
    if (Math.random() < 0.25) {
      this.grid[idx] = Math.random() < 0.4 ? ELEMENT.SMOKE : ELEMENT.EMPTY;
      return;
    }

    // Rise upward
    if (y > 0) {
      const upX = x + Math.floor((Math.random() - 0.5) * 3 + this.windSpeed);
      if (upX >= 0 && upX < w) {
        const upIdx = (y - 1) * w + upX;
        if (this.grid[upIdx] === ELEMENT.EMPTY) {
          this.swap(idx, upIdx);
          this.visited[upIdx] = 1;
        } else if (this.grid[upIdx] === ELEMENT.OIL) {
          this.grid[upIdx] = ELEMENT.FIRE;
        }
      }
    }
  }

  updateGas(x, y, idx, elem) {
    const w = this.simWidth;
    const h = this.simHeight;

    // Dissipate at ceiling or with age
    if (y <= 1 || Math.random() < (elem === ELEMENT.STEAM ? 0.015 : 0.008)) {
      this.grid[idx] = ELEMENT.EMPTY;
      return;
    }

    // Rise up with wind drift
    const upX = x + Math.floor((Math.random() - 0.5) * 2 + this.windSpeed);
    const upY = y - 1;

    if (upX >= 0 && upX < w && upY >= 0) {
      const targetIdx = upY * w + upX;
      if (this.grid[targetIdx] === ELEMENT.EMPTY) {
        this.swap(idx, targetIdx);
        this.visited[targetIdx] = 1;
      }
    }
  }

  swap(i1, i2) {
    const tempElem = this.grid[i1];
    const tempHeat = this.heat[i1];
    this.grid[i1] = this.grid[i2];
    this.heat[i1] = this.heat[i2];
    this.grid[i2] = tempElem;
    this.heat[i2] = tempHeat;
  }

  render(ctx) {
    const w = this.simWidth;
    const h = this.simHeight;
    const data = this.imgData.data;

    let p = 0;
    for (let i = 0; i < w * h; i++) {
      const elem = this.grid[i];
      const rgba = PALETTE[elem] || PALETTE[ELEMENT.EMPTY];

      let r = rgba[0];
      let g = rgba[1];
      let b = rgba[2];
      const a = rgba[3];

      // Dynamic glow for heat
      if (elem === ELEMENT.LAVA) {
        const flicker = (Math.sin(i * 0.3 + Date.now() * 0.005) + 1) * 20;
        r = Math.min(255, r + flicker);
        g = Math.min(255, g + flicker * 0.5);
      } else if (elem === ELEMENT.FIRE) {
        r = 255;
        g = Math.floor(150 + Math.random() * 105);
        b = Math.floor(Math.random() * 50);
      }

      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
      data[p + 3] = a;
      p += 4;
    }

    // Blit to offscreen canvas
    this.offscreenCtx.putImageData(this.imgData, 0, 0);

    // Draw scaled up to main canvas with crisp pixelation
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width, this.canvas.height);

    // Render brush cursor indicator if mouse inside
    if (this.mousePos) {
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const scaleX = this.canvas.width / this.simWidth;
      ctx.arc(this.mousePos.x, this.mousePos.y, this.brushSize * scaleX, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  getEntityCount() {
    return this.particleCount;
  }

  reset() {
    this.buildVolcanoTerrain();
  }

  destroy() {
    // Teardown
  }
}
