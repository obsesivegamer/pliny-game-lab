import { VesuviusEngine } from '../demos/vesuvius/vesuvius.js';
import { BestiariumEngine } from '../demos/bestiarium/bestiarium.js';
import { MechanicaEngine } from '../demos/mechanica/mechanica.js';
import { CosmographiaEngine } from '../demos/cosmographia/cosmographia.js';
import { LabyrinthusEngine } from '../demos/labyrinthus/labyrinthus.js';

const DEMOS = {
  vesuvius: {
    name: 'Vesuvius (Volcanology Sim)',
    desc: 'Thermodynamic cellular automata falling-sand & fluid simulation. Magma, smoke, fire, stone, water, and explosive subterranean pressure.',
    engine: VesuviusEngine,
    hint: 'L-Click: Deposit material | R-Click: Detonate / Heat | Scroll: Brush Size'
  },
  bestiarium: {
    name: 'Bestiarium (ALife Ecosystem)',
    desc: 'Autonomous steering boids, predator-prey dynamics, sensory perception fields, and genetic metabolic reproduction.',
    engine: BestiariumEngine,
    hint: 'Click: Spawn Food / Creature | Space: Add Apex Predator'
  },
  mechanica: {
    name: 'Mechanica (Roman Physics & Automata)',
    desc: 'Verlet integration physics sandbox. Archimedean screws, catapult linkages, pendulum arrays, and Hero of Alexandria aeolipile.',
    engine: MechanicaEngine,
    hint: 'Click & Drag: Move bodies | Shift + Drag: Sever constraints | G: Toggle Gravity'
  },
  cosmographia: {
    name: 'Cosmographia (Celestial Spheres)',
    desc: 'Ptolemaic epicycles, Keplerian orbital resonance, and procedural spherical planetary raymarching with day-night terminator.',
    engine: CosmographiaEngine,
    hint: 'Click & Drag: Rotate Sphere | Scroll: Zoom Orbits | T: Accelerate Time'
  },
  labyrinthus: {
    name: 'Labyrinthus (3D Catacomb Crawler)',
    desc: 'Procedural Roman catacomb labyrinth rendered with classic DDA raycasting. Autonomous minotaurs and WebAudio chiptune soundtrack.',
    engine: LabyrinthusEngine,
    hint: 'WASD / Arrows: Move & Turn | Space: Cast Arcane Bolt | M: Minimap'
  }
};

class PlinyHub {
  constructor() {
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.controlsContainer = document.getElementById('dynamic-controls');
    this.demoTitle = document.getElementById('demo-title');
    this.demoDesc = document.getElementById('demo-desc');
    this.hintOverlay = document.getElementById('hint-overlay');
    this.fpsVal = document.getElementById('fps-val');
    this.entityVal = document.getElementById('entity-val');
    this.resetBtn = document.getElementById('reset-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.togglePanelBtn = document.getElementById('toggle-panel');
    this.controlsPanel = document.getElementById('controls-panel');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');

    this.activeKey = 'vesuvius';
    this.currentEngine = null;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = 0;

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = btn.dataset.demo;
        if (key && key !== this.activeKey) {
          this.switchDemo(key);
        }
      });
    });

    // Reset button
    this.resetBtn.addEventListener('click', () => {
      if (this.currentEngine && this.currentEngine.reset) {
        this.currentEngine.reset();
      }
    });

    // Pause button
    this.pauseBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
      this.pauseBtn.style.color = this.isPaused ? 'var(--accent-crimson)' : 'var(--text-main)';
    });

    // Panel collapse
    this.togglePanelBtn.addEventListener('click', () => {
      this.controlsPanel.classList.toggle('collapsed');
      this.togglePanelBtn.textContent = this.controlsPanel.classList.contains('collapsed') ? '+' : '−';
    });

    // Fullscreen toggle
    this.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Bind canvas input handlers
    this.setupInputHandling();

    // Start initial demo
    this.switchDemo('vesuvius');

    // Start main game loop
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize() {
    const container = document.getElementById('viewport-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Support device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.currentEngine && this.currentEngine.resize) {
      this.currentEngine.resize(this.canvas.width, this.canvas.height, dpr);
    }
  }

  switchDemo(key) {
    if (!DEMOS[key]) return;

    // Teardown existing
    if (this.currentEngine) {
      if (this.currentEngine.destroy) this.currentEngine.destroy();
      this.currentEngine = null;
    }

    this.activeKey = key;
    const info = DEMOS[key];

    // Update UI headers & nav
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.demo === key);
    });

    this.demoTitle.textContent = info.name;
    this.demoDesc.textContent = info.desc;
    this.hintOverlay.textContent = info.hint;

    // Reset controls container
    this.controlsContainer.innerHTML = '';

    // Instantiate new engine
    const EngineClass = info.engine;
    this.currentEngine = new EngineClass(this.canvas, this.ctx, this.controlsContainer);
    
    const dpr = window.devicePixelRatio || 1;
    if (this.currentEngine.resize) {
      this.currentEngine.resize(this.canvas.width, this.canvas.height, dpr);
    }

    this.isPaused = false;
    this.pauseBtn.textContent = 'Pause';
    this.pauseBtn.style.color = 'var(--text-main)';
  }

  setupInputHandling() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
        y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        rawX: e.clientX - rect.left,
        rawY: e.clientY - rect.top,
        button: e.button
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.currentEngine && this.currentEngine.onMouseDown) {
        this.currentEngine.onMouseDown(getPos(e));
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.currentEngine && this.currentEngine.onMouseMove) {
        this.currentEngine.onMouseMove(getPos(e));
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.currentEngine && this.currentEngine.onMouseUp) {
        this.currentEngine.onMouseUp(getPos(e));
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      if (this.currentEngine && this.currentEngine.onWheel) {
        this.currentEngine.onWheel(e.deltaY);
        e.preventDefault();
      }
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => {
      if (this.currentEngine && this.currentEngine.onContextMenu) {
        this.currentEngine.onContextMenu(getPos(e));
      }
      e.preventDefault();
    });

    window.addEventListener('keydown', (e) => {
      if (this.currentEngine && this.currentEngine.onKeyDown) {
        this.currentEngine.onKeyDown(e.key, e);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.currentEngine && this.currentEngine.onKeyUp) {
        this.currentEngine.onKeyUp(e.key, e);
      }
    });
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp to 100ms max
    this.lastTime = currentTime;

    // Calculate FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      const currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.fpsVal.textContent = currentFps;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Update and render active engine
    if (this.currentEngine) {
      if (!this.isPaused && this.currentEngine.update) {
        this.currentEngine.update(dt);
      }
      if (this.currentEngine.render) {
        this.currentEngine.render(this.ctx);
      }
      if (this.currentEngine.getEntityCount) {
        this.entityVal.textContent = this.currentEngine.getEntityCount();
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Boot hub
window.addEventListener('DOMContentLoaded', () => {
  new PlinyHub();
});
