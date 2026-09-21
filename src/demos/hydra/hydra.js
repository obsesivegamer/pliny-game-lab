// Pliny Game Lab — Hydra (Lernaean Regenerative Soft-Body & Bioluminescent Organism)
// Grounded in Pliny the Elder's Naturalis Historia (Books IX & XI: Marine Life & Polyps)
// Features soft-body mass-spring column, articulated IK tentacles, mitotic regeneration,
// vascular luciferin fluid transport, and micro-prey hunting dynamics.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class HydraEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 1200;
    this.height = canvas.height || 800;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    // Simulation Clock
    this.time = 0;

    // Parameters & State
    this.currentTool = 'Lure / Feed'; // 'Lure / Feed', 'Sever / Prune', 'Stir Current'
    this.rigidity = 1.0; // Tentacle Flexibility / Rigidity (0.2 loose to 2.5 stiff)
    this.pulseIntensity = 1.5; // Bioluminescent Pulse Intensity (0.2 to 3.0)
    this.currentFlow = 0.8; // Water Current Flow (-2.0 to 3.0)

    // Interaction State
    this.mousePos = { x: this.width * 0.5, y: this.height * 0.35 };
    this.prevMousePos = { x: this.width * 0.5, y: this.height * 0.35 };
    this.isMouseDown = false;
    this.mouseButton = 0;
    this.slicePath = [];
    this.lureActive = false;

    // Soft-Body Entities
    this.trunk = null;
    this.tentacles = [];
    this.severedPieces = [];
    this.fluidParticles = [];
    this.prey = [];
    this.ambientParticles = [];
    this.shockwaves = [];
    this.bubbles = [];

    // Next ID counters
    this.nextTentacleId = 1;

    // Build UI and initialize simulation
    this.buildControls();
    this.reset();
    attachTouchBridge(this, canvas);
  }

  // ==========================================
  // ARCHITECTURE CONTRACT & UI
  // ==========================================

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Abyssal Tool</label>
        <div class="control-btn-grid" id="hydra-tools">
          <button class="sub-btn active" data-tool="Lure / Feed">🪱 Lure / Feed</button>
          <button class="sub-btn" data-tool="Sever / Prune">✂️ Sever / Prune</button>
          <button class="sub-btn" data-tool="Stir Current" style="grid-column: span 2;">🌀 Stir Current</button>
        </div>
      </div>

      <div class="control-group">
        <label>Tentacle Rigidity: <span id="rigidity-val">${this.rigidity.toFixed(2)}</span></label>
        <input type="range" id="rigidity-slider" min="0.2" max="2.5" step="0.05" value="${this.rigidity}">
      </div>

      <div class="control-group">
        <label>Luciferin Pulse Intensity: <span id="pulse-val">${this.pulseIntensity.toFixed(1)}</span></label>
        <input type="range" id="pulse-slider" min="0.2" max="3.0" step="0.1" value="${this.pulseIntensity}">
      </div>

      <div class="control-group">
        <label>Water Current Flow: <span id="flow-val">${this.currentFlow.toFixed(1)}</span></label>
        <input type="range" id="flow-slider" min="-2.0" max="3.0" step="0.1" value="${this.currentFlow}">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
        <button id="mythic-100-btn" class="sub-btn" style="background: rgba(212,175,55,0.18); border-color: #d4af37; color: #ffd700; font-weight: bold; padding: 8px;">
          🐉 Regenerate Mythic Hydra (100 Heads)
        </button>
        <button id="shockwave-btn" class="sub-btn" style="background: rgba(59,214,198,0.18); border-color: #3bd6c6; color: #3bd6c6; font-weight: bold; padding: 8px;">
          ⚡ Trigger Full Bioluminescent Shockwave
        </button>
      </div>

      <div class="control-group" style="margin-top: 6px; font-size: 0.72rem; color: #8a99a8; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
        <div>⚡ <i>Severing any tentacle buds 2 independent heads.</i></div>
        <div>🔬 <i>Micro-copepods are stunned and drawn into the mouth.</i></div>
      </div>
    `;

    // Tool switching
    this.controlsContainer.querySelectorAll('#hydra-tools .sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controlsContainer.querySelectorAll('#hydra-tools .sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    // Sliders
    const rigSlider = this.controlsContainer.querySelector('#rigidity-slider');
    const rigVal = this.controlsContainer.querySelector('#rigidity-val');
    if (rigSlider && rigVal) {
      rigSlider.addEventListener('input', (e) => {
        this.rigidity = parseFloat(e.target.value);
        rigVal.textContent = this.rigidity.toFixed(2);
      });
    }

    const pulseSlider = this.controlsContainer.querySelector('#pulse-slider');
    const pulseVal = this.controlsContainer.querySelector('#pulse-val');
    if (pulseSlider && pulseVal) {
      pulseSlider.addEventListener('input', (e) => {
        this.pulseIntensity = parseFloat(e.target.value);
        pulseVal.textContent = this.pulseIntensity.toFixed(1);
      });
    }

    const flowSlider = this.controlsContainer.querySelector('#flow-slider');
    const flowVal = this.controlsContainer.querySelector('#flow-val');
    if (flowSlider && flowVal) {
      flowSlider.addEventListener('input', (e) => {
        this.currentFlow = parseFloat(e.target.value);
        flowVal.textContent = this.currentFlow.toFixed(1);
      });
    }

    // Buttons
    const mythicBtn = this.controlsContainer.querySelector('#mythic-100-btn');
    if (mythicBtn) {
      mythicBtn.addEventListener('click', () => {
        this.triggerMythicBloom(100);
      });
    }

    const shockBtn = this.controlsContainer.querySelector('#shockwave-btn');
    if (shockBtn) {
      shockBtn.addEventListener('click', () => {
        this.triggerShockwave();
      });
    }
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    // Anchor base to bottom center
    if (this.trunk) {
      const targetBaseX = this.width * 0.5;
      const targetBaseY = this.height - 50;
      const dx = targetBaseX - this.trunk.baseX;
      const dy = targetBaseY - this.trunk.baseY;

      this.trunk.baseX = targetBaseX;
      this.trunk.baseY = targetBaseY;

      for (const node of this.trunk.spine) {
        node.x += dx;
        node.y += dy;
        node.oldX += dx;
        node.oldY += dy;
      }
      for (const node of this.trunk.leftWall) {
        node.x += dx;
        node.y += dy;
        node.oldX += dx;
        node.oldY += dy;
      }
      for (const node of this.trunk.rightWall) {
        node.x += dx;
        node.y += dy;
        node.oldX += dx;
        node.oldY += dy;
      }
    }
  }

  reset() {
    this.time = 0;
    this.tentacles = [];
    this.severedPieces = [];
    this.fluidParticles = [];
    this.prey = [];
    this.ambientParticles = [];
    this.shockwaves = [];
    this.bubbles = [];
    this.slicePath = [];

    // Initialize Soft-Body Column (Trunk)
    this.initTrunk();

    // Initial Primary Tentacles (Lernaean baseline: 7 primordial heads)
    const initialHeads = 7;
    for (let i = 0; i < initialHeads; i++) {
      const angleOffset = -Math.PI * 0.5 + ((i - (initialHeads - 1) * 0.5) / initialHeads) * (Math.PI * 0.85);
      this.spawnTentacle(angleOffset, 1.0, null, 1);
    }

    // Seed micro-prey (daphnia / copepods)
    for (let i = 0; i < 28; i++) {
      this.spawnPrey(Math.random() * this.width, Math.random() * (this.height - 150));
    }

    // Seed ambient abyssal plankton particles
    for (let i = 0; i < 90; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 10 - 5,
        size: Math.random() * 2.2 + 0.8,
        brightness: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Trigger welcoming bioluminescent pulse
    this.triggerShockwave(false);
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    this.tentacles = [];
    this.severedPieces = [];
    this.fluidParticles = [];
    this.prey = [];
    this.ambientParticles = [];
    this.shockwaves = [];
    this.bubbles = [];
    this.trunk = null;
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  getEntityCount() {
    let count = 0;
    if (this.trunk) {
      count += this.trunk.spine.length + this.trunk.leftWall.length + this.trunk.rightWall.length;
    }
    for (const t of this.tentacles) {
      count += t.nodes.length;
    }
    for (const s of this.severedPieces) {
      count += s.nodes.length;
    }
    count += this.tentacles.length;
    count += this.fluidParticles.length;
    count += this.prey.length;
    count += this.ambientParticles.length;
    return Math.max(1, Math.floor(count));
  }

  // ==========================================
  // INPUT HANDLING
  // ==========================================

  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mouseButton = pos.button ?? 0;
    this.mousePos = { x: pos.x, y: pos.y };
    this.prevMousePos = { x: pos.x, y: pos.y };

    if (this.currentTool === 'Lure / Feed') {
      this.lureActive = true;
      // Spawn nutrient bait burst
      this.emitBaitParticles(pos.x, pos.y, 14);
    } else if (this.currentTool === 'Sever / Prune') {
      this.slicePath = [{ x: pos.x, y: pos.y }];
      this.checkDirectPointSever(pos.x, pos.y);
    } else if (this.currentTool === 'Stir Current') {
      this.createVortex(pos.x, pos.y, 40);
    }
  }

  onMouseMove(pos) {
    this.prevMousePos = { x: this.mousePos.x, y: this.mousePos.y };
    this.mousePos = { x: pos.x, y: pos.y };

    if (this.isMouseDown) {
      if (this.currentTool === 'Sever / Prune') {
        this.slicePath.push({ x: pos.x, y: pos.y });
        if (this.slicePath.length > 12) this.slicePath.shift();

        // Check intersection with all tentacle segments
        const p1 = this.slicePath[this.slicePath.length - 2];
        const p2 = this.slicePath[this.slicePath.length - 1];
        if (p1 && p2) {
          this.checkSliceIntersection(p1, p2);
        }
      } else if (this.currentTool === 'Stir Current') {
        const dx = pos.x - this.prevMousePos.x;
        const dy = pos.y - this.prevMousePos.y;
        const speed = Math.hypot(dx, dy);
        if (speed > 3) {
          this.createVortex(pos.x, pos.y, Math.min(speed * 2, 70));
        }
      }
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
    this.lureActive = false;
    this.slicePath = [];
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      this.triggerShockwave();
    } else if (key === 'm' || key === 'M') {
      this.triggerMythicBloom(100);
    } else if (key === '1') {
      this.selectTool('Lure / Feed');
    } else if (key === '2') {
      this.selectTool('Sever / Prune');
    } else if (key === '3') {
      this.selectTool('Stir Current');
    }
  }

  selectTool(toolName) {
    this.currentTool = toolName;
    if (!this.controlsContainer) return;
    this.controlsContainer.querySelectorAll('#hydra-tools .sub-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
  }

  // ==========================================
  // SOFT-BODY SIMULATION: TRUNK & HYPOSTOME
  // ==========================================

  initTrunk() {
    const baseX = this.width * 0.5;
    const baseY = this.height - 50;
    const segmentCount = 7;
    const trunkHeight = Math.min(220, this.height * 0.32);
    const segHeight = trunkHeight / segmentCount;

    const spine = [];
    const leftWall = [];
    const rightWall = [];

    for (let i = 0; i <= segmentCount; i++) {
      const y = baseY - i * segHeight;
      const t = i / segmentCount;
      // Flaring basal foot tapering toward mid-body, widening again at hypostome
      const halfWidth = 28 * (1.3 - t * 0.6 + Math.pow(t, 2) * 0.7);

      spine.push({
        x: baseX,
        y: y,
        oldX: baseX,
        oldY: y,
        pinned: i === 0,
        radius: halfWidth
      });

      leftWall.push({
        x: baseX - halfWidth,
        y: y,
        oldX: baseX - halfWidth,
        oldY: y,
        pinned: i === 0
      });

      rightWall.push({
        x: baseX + halfWidth,
        y: y,
        oldX: baseX + halfWidth,
        oldY: y,
        pinned: i === 0
      });
    }

    this.trunk = {
      baseX,
      baseY,
      segmentCount,
      spine,
      leftWall,
      rightWall,
      mouthGlow: 0,
      digestionPulse: 0
    };
  }

  updateTrunk(dt) {
    if (!this.trunk) return;
    const { spine, leftWall, rightWall } = this.trunk;

    // Fluid drag, water current, and sinusoidal muscular sway
    const currentForce = this.currentFlow * 18;

    for (let i = 1; i < spine.length; i++) {
      const s = spine[i];
      const lw = leftWall[i];
      const rw = rightWall[i];
      const t = i / spine.length;

      // Verlet for spine
      const sway = (Math.sin(this.time * 1.2 + i * 0.4) * 8 + currentForce) * t * (1.0 / this.rigidity);
      let vx = (s.x - s.oldX) * 0.93 + (sway * dt * dt);
      let vy = (s.y - s.oldY) * 0.93 - (20 * t * dt * dt); // Buoyancy upward

      s.oldX = s.x;
      s.oldY = s.y;
      s.x += vx;
      s.y += vy;

      // Soft-body lateral wall integration
      const halfWidth = s.radius;
      lw.oldX = lw.x;
      lw.oldY = lw.y;
      rw.oldX = rw.x;
      rw.oldY = rw.y;

      // Target wall positions perpendicular to spine tangent
      const prev = spine[i - 1];
      const tangentX = s.x - prev.x;
      const tangentY = s.y - prev.y;
      const len = Math.hypot(tangentX, tangentY) || 1;
      const normX = -tangentY / len;
      const normY = tangentX / len;

      lw.x = s.x + normX * halfWidth;
      lw.y = s.y + normY * halfWidth;
      rw.x = s.x - normX * halfWidth;
      rw.y = s.y - normY * halfWidth;
    }

    // Distance constraint iterations along spine
    const segLen = Math.min(220, this.height * 0.32) / this.trunk.segmentCount;
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 1; i < spine.length; i++) {
        const p1 = spine[i - 1];
        const p2 = spine[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy) || 1;
        const diff = (dist - segLen) / dist;

        if (!p1.pinned) {
          p1.x += dx * 0.5 * diff;
          p1.y += dy * 0.5 * diff;
        }
        if (!p2.pinned) {
          p2.x -= dx * 0.5 * diff;
          p2.y -= dy * 0.5 * diff;
        }
      }
    }

    // Mouth digestion pulse decay
    if (this.trunk.mouthGlow > 0) {
      this.trunk.mouthGlow = Math.max(0, this.trunk.mouthGlow - dt * 1.5);
    }
    if (this.trunk.digestionPulse > 0) {
      this.trunk.digestionPulse = Math.max(0, this.trunk.digestionPulse - dt * 2.0);
    }
  }

  // ==========================================
  // TENTACLE GENERATION, DYNAMICS & IK
  // ==========================================

  spawnTentacle(baseAngle, targetLengthScale = 1.0, parentStub = null, generation = 1) {
    const id = this.nextTentacleId++;
    const nodeCount = Math.max(12, Math.floor(18 * targetLengthScale));
    const segmentLength = 11;
    const baseHypostome = this.trunk ? this.trunk.spine[this.trunk.spine.length - 1] : { x: this.width * 0.5, y: this.height * 0.6 };

    let startX = baseHypostome.x;
    let startY = baseHypostome.y;

    if (parentStub) {
      startX = parentStub.x;
      startY = parentStub.y;
    }

    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const dist = i * segmentLength;
      const angle = baseAngle + (Math.random() - 0.5) * 0.15;
      const x = startX + Math.cos(angle) * dist;
      const y = startY + Math.sin(angle) * dist;
      nodes.push({
        x,
        y,
        oldX: x,
        oldY: y,
        targetDist: segmentLength,
        radius: Math.max(2, 7 * (1 - i / nodeCount)),
        luminescence: 0.2
      });
    }

    const tentacle = {
      id,
      generation,
      baseAngle,
      targetBaseAngle: baseAngle,
      nodes,
      nodeCount,
      segmentLength,
      growthProgress: parentStub ? 0.05 : 1.0, // Budding stubs unfurl from 0.05 to 1.0
      isBudding: !!parentStub,
      budDuration: 1.6,
      budTimer: 0,
      phase: Math.random() * Math.PI * 2,
      curlCycle: Math.random() * Math.PI * 2,
      state: 'idle', // 'idle', 'reaching', 'grasping', 'retracting'
      capturedPrey: null,
      parentStubPos: parentStub ? { x: parentStub.x, y: parentStub.y } : null,
      retractFactor: 1.0,
      shockGlow: 0
    };

    this.tentacles.push(tentacle);
    return tentacle;
  }

  updateTentacles(dt) {
    if (!this.trunk) return;
    const hypostome = this.trunk.spine[this.trunk.spine.length - 1];

    // Current ambient water eddy flow
    const flowX = this.currentFlow * 24;

    for (let tIdx = this.tentacles.length - 1; tIdx >= 0; tIdx--) {
      const t = this.tentacles[tIdx];

      // Growth morphing for newly budded tentacles
      if (t.isBudding) {
        t.budTimer += dt;
        t.growthProgress = Math.min(1.0, t.budTimer / t.budDuration);
        if (t.growthProgress >= 1.0) {
          t.isBudding = false;
        }
      }

      const activeLength = Math.max(4, Math.floor(t.nodeCount * t.growthProgress));
      t.curlCycle += dt * 1.5;

      // Base anchoring on hypostome
      const baseNode = t.nodes[0];
      const oralRadius = 22;
      const anchorX = hypostome.x + Math.cos(t.baseAngle) * oralRadius;
      const anchorY = hypostome.y + Math.sin(t.baseAngle) * (oralRadius * 0.7);

      baseNode.x = anchorX;
      baseNode.y = anchorY;
      baseNode.oldX = anchorX;
      baseNode.oldY = anchorY;

      // Determine target reach point for Inverse Kinematics
      let ikTarget = null;
      let ikStrength = 0;

      // 1. Tool: Lure / Feed interaction
      if (this.currentTool === 'Lure / Feed' && this.isMouseDown) {
        const distToMouse = Math.hypot(this.mousePos.x - baseNode.x, this.mousePos.y - baseNode.y);
        if (distToMouse < 450) {
          ikTarget = { x: this.mousePos.x, y: this.mousePos.y };
          ikStrength = Math.min(1.0, (450 - distToMouse) / 300) * 0.8;
          t.state = 'reaching';
        }
      }

      // 2. Micro-prey detection & nematocyst grasping
      if (t.capturedPrey) {
        // Retracting with captured prey toward the mouth
        t.state = 'retracting';
        t.retractFactor = Math.max(0.35, t.retractFactor - dt * 0.8);
        ikTarget = { x: hypostome.x, y: hypostome.y };
        ikStrength = 0.9;

        // Pull prey to tip
        const tipNode = t.nodes[activeLength - 1];
        t.capturedPrey.x = tipNode.x;
        t.capturedPrey.y = tipNode.y;
        t.capturedPrey.vx = 0;
        t.capturedPrey.vy = 0;

        // Check if prey reached hypostome / mouth for ingestion
        const distToMouth = Math.hypot(tipNode.x - hypostome.x, tipNode.y - hypostome.y);
        if (distToMouth < 24) {
          this.digestPrey(t.capturedPrey, t);
          t.capturedPrey = null;
          t.state = 'idle';
          t.retractFactor = 1.0;
        }
      } else if (!ikTarget) {
        // Search for nearest uncaught prey within sensory perception range
        let nearestPrey = null;
        let minDist = 180;
        const tipNode = t.nodes[activeLength - 1];

        for (const p of this.prey) {
          if (p.consumed || p.capturedBy) continue;
          const dist = Math.hypot(p.x - tipNode.x, p.y - tipNode.y);
          if (dist < minDist) {
            minDist = dist;
            nearestPrey = p;
          }
        }

        if (nearestPrey) {
          ikTarget = { x: nearestPrey.x, y: nearestPrey.y };
          ikStrength = Math.min(1.0, (180 - minDist) / 100);
          t.state = 'reaching';

          // Nematocyst strike if within grasping distance (< 26px)
          if (minDist < 26) {
            t.capturedPrey = nearestPrey;
            nearestPrey.capturedBy = t;
            nearestPrey.stunned = true;
            t.state = 'grasping';
            this.emitNematocystSting(tipNode.x, tipNode.y, nearestPrey.x, nearestPrey.y);
          }
        } else {
          t.state = 'idle';
        }
      }

      // Neuromuscular undulating wave forces & Verlet step
      for (let i = 1; i < activeLength; i++) {
        const node = t.nodes[i];
        const segRatio = i / activeLength;

        // Sinusoidal muscular undulation wave
        const wave = Math.sin(this.time * 2.2 + t.phase + i * 0.42) * (18 * segRatio) * (1.0 / this.rigidity);
        const perpAngle = t.baseAngle + Math.PI * 0.5;

        // External water current & buoyancy
        const fx = (Math.cos(perpAngle) * wave + flowX * (0.5 + segRatio * 0.8)) * dt * dt;
        const fy = (Math.sin(perpAngle) * wave - 25 * segRatio) * dt * dt; // Buoyancy lifts tips upward

        const vx = (node.x - node.oldX) * 0.92 + fx;
        const vy = (node.y - node.oldY) * 0.92 + fy;

        node.oldX = node.x;
        node.oldY = node.y;
        node.x += vx;
        node.y += vy;
      }

      // Inverse Kinematics (FABRIK) pass when reaching/grasping
      if (ikTarget && ikStrength > 0) {
        this.solveFABRIK(t, activeLength, ikTarget, ikStrength);
      }

      // Distance constraint solver (spring-mass chain)
      const targetSegLen = t.segmentLength * (t.retractFactor ?? 1.0);
      for (let iter = 0; iter < 4; iter++) {
        for (let i = 1; i < activeLength; i++) {
          const p1 = t.nodes[i - 1];
          const p2 = t.nodes[i];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const diff = (dist - targetSegLen) / dist;

          if (i === 1) {
            p2.x -= dx * diff;
            p2.y -= dy * diff;
          } else {
            p1.x += dx * 0.5 * diff;
            p1.y += dy * 0.5 * diff;
            p2.x -= dx * 0.5 * diff;
            p2.y -= dy * 0.5 * diff;
          }
        }
      }

      // Shock glow decay
      if (t.shockGlow > 0) {
        t.shockGlow = Math.max(0, t.shockGlow - dt * 2.0);
      }
    }
  }

  // FABRIK (Forward And Backward Reaching Inverse Kinematics)
  solveFABRIK(tentacle, activeLength, target, strength) {
    const nodes = tentacle.nodes;
    if (activeLength < 2) return;

    // Backward pass: pull from tip to target
    const tip = nodes[activeLength - 1];
    const targetX = tip.x + (target.x - tip.x) * strength;
    const targetY = tip.y + (target.y - tip.y) * strength;
    tip.x = targetX;
    tip.y = targetY;

    for (let i = activeLength - 2; i >= 0; i--) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      const dx = curr.x - next.x;
      const dy = curr.y - next.y;
      const dist = Math.hypot(dx, dy) || 1;
      const scale = tentacle.segmentLength / dist;
      curr.x = next.x + dx * scale;
      curr.y = next.y + dy * scale;
    }

    // Forward pass: pin base back to hypostome anchor
    const base = nodes[0];
    const hypostome = this.trunk.spine[this.trunk.spine.length - 1];
    const oralRadius = 22;
    base.x = hypostome.x + Math.cos(tentacle.baseAngle) * oralRadius;
    base.y = hypostome.y + Math.sin(tentacle.baseAngle) * (oralRadius * 0.7);

    for (let i = 0; i < activeLength - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const dist = Math.hypot(dx, dy) || 1;
      const scale = tentacle.segmentLength / dist;
      next.x = curr.x + dx * scale;
      next.y = curr.y + dy * scale;
    }
  }

  // ==========================================
  // REGENERATION SYSTEM (PLINY / HERCULES MYTH)
  // ==========================================

  checkSliceIntersection(p1, p2) {
    for (let tIdx = this.tentacles.length - 1; tIdx >= 0; tIdx--) {
      const t = this.tentacles[tIdx];
      const activeLength = Math.max(4, Math.floor(t.nodeCount * t.growthProgress));

      for (let i = 1; i < activeLength - 1; i++) {
        const seg1 = t.nodes[i];
        const seg2 = t.nodes[i + 1];
        const hit = this.getLineIntersection(p1, p2, seg1, seg2);
        if (hit) {
          this.severTentacle(tIdx, i, hit);
          break;
        }
      }
    }
  }

  checkDirectPointSever(x, y) {
    const threshold = 18;
    for (let tIdx = this.tentacles.length - 1; tIdx >= 0; tIdx--) {
      const t = this.tentacles[tIdx];
      const activeLength = Math.max(4, Math.floor(t.nodeCount * t.growthProgress));

      for (let i = 2; i < activeLength; i++) {
        const node = t.nodes[i];
        if (Math.hypot(node.x - x, node.y - y) < threshold) {
          this.severTentacle(tIdx, i, { x: node.x, y: node.y });
          return;
        }
      }
    }
  }

  getLineIntersection(p0, p1, p2, p3) {
    const s1_x = p1.x - p0.x;
    const s1_y = p1.y - p0.y;
    const s2_x = p3.x - p2.x;
    const s2_y = p3.y - p2.y;
    const denom = -s2_x * s1_y + s1_x * s2_y;
    if (Math.abs(denom) < 0.0001) return null;
    const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / denom;
    const t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / denom;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return { x: p0.x + t * s1_x, y: p0.y + t * s1_y };
    }
    return null;
  }

  severTentacle(tentacleIdx, cutNodeIdx, cutPos) {
    const parentTentacle = this.tentacles[tentacleIdx];
    if (!parentTentacle) return;

    // Release captured prey if any
    if (parentTentacle.capturedPrey) {
      parentTentacle.capturedPrey.capturedBy = null;
      parentTentacle.capturedPrey = null;
    }

    // 1. Create drifting, glowing severed distal piece
    const severedNodes = [];
    for (let i = cutNodeIdx; i < parentTentacle.nodes.length; i++) {
      const n = parentTentacle.nodes[i];
      severedNodes.push({
        x: n.x,
        y: n.y,
        vx: (Math.random() - 0.5) * 40 + (this.currentFlow * 20),
        vy: (Math.random() - 0.5) * 30 - 15,
        radius: n.radius,
        luminescence: 1.0
      });
    }

    if (severedNodes.length > 0) {
      this.severedPieces.push({
        nodes: severedNodes,
        life: 1.8,
        maxLife: 1.8
      });
    }

    // 2. Spawn burst of bioluminescent luciferin sparks at cut site
    this.emitCutSparks(cutPos.x, cutPos.y, 25);

    // 3. Classical Mythic Rule: Amputato capite duo capita renascebantur!
    // Remove the old severed parent tentacle
    const oldAngle = parentTentacle.baseAngle;
    const gen = parentTentacle.generation + 1;
    this.tentacles.splice(tentacleIdx, 1);

    // Limit maximum concurrent tentacles to avoid performance degradation (max 120)
    if (this.tentacles.length < 115) {
      const branchSpread = 0.38;
      const angle1 = oldAngle - branchSpread;
      const angle2 = oldAngle + branchSpread;

      // Spawn TWO new budding tentacles at diverging angles
      this.spawnTentacle(angle1, 0.95, cutPos, gen);
      this.spawnTentacle(angle2, 0.95, cutPos, gen);
    } else {
      // If at max capacity, spawn 1 replacement
      this.spawnTentacle(oldAngle, 1.0, cutPos, gen);
    }

    // Send vascular ripple through remaining body
    this.triggerVascularPulse(cutPos.x, cutPos.y, 0.8);
  }

  triggerMythicBloom(targetCount = 100) {
    // Accelerate mitosis across all heads until reaching target count
    const needed = targetCount - this.tentacles.length;
    if (needed <= 0) return;

    const hypostome = this.trunk ? this.trunk.spine[this.trunk.spine.length - 1] : { x: this.width * 0.5, y: this.height * 0.6 };

    for (let i = 0; i < needed && this.tentacles.length < 105; i++) {
      const baseAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * (Math.PI * 1.4);
      const t = this.spawnTentacle(baseAngle, Math.random() * 0.3 + 0.75, hypostome, 2);
      t.growthProgress = 0.1;
      t.isBudding = true;
      t.budDuration = 0.8 + Math.random() * 1.0;
    }

    this.triggerShockwave(true);
  }

  // ==========================================
  // BIOLUMINESCENT FLUID TRANSPORT SYSTEM
  // ==========================================

  triggerShockwave(massive = false) {
    if (!this.trunk) return;
    const hypostome = this.trunk.spine[this.trunk.spine.length - 1];

    this.shockwaves.push({
      x: hypostome.x,
      y: hypostome.y,
      radius: 10,
      maxRadius: massive ? 450 : 260,
      alpha: 1.0,
      color: massive ? '#ffd700' : '#3bd6c6'
    });

    this.trunk.mouthGlow = 1.0;

    // Light up all tentacles with luciferin surge
    for (const t of this.tentacles) {
      t.shockGlow = 1.0;
      for (const n of t.nodes) {
        n.luminescence = 1.0;
      }
      // Inject vascular fluid particles
      for (let i = 0; i < 4; i++) {
        this.fluidParticles.push({
          tentacle: t,
          nodeIndex: 0,
          t: Math.random() * 0.2,
          speed: Math.random() * 8 + 12,
          color: Math.random() > 0.4 ? '#3bd6c6' : '#d4af37',
          brightness: 1.0,
          size: Math.random() * 2.5 + 1.5
        });
      }
    }

    // Emit radiant bioluminescent fluid embers into the surrounding abyss
    const sparkCount = massive ? 70 : 35;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30;
      this.bubbles.push({
        x: hypostome.x,
        y: hypostome.y,
        vx: Math.cos(angle) * speed + (this.currentFlow * 15),
        vy: Math.sin(angle) * speed - 20,
        radius: Math.random() * 2.8 + 1.0,
        color: Math.random() > 0.35 ? '#3bd6c6' : '#ffd700',
        life: 2.0,
        maxLife: 2.0
      });
    }
  }

  triggerVascularPulse(originX, originY, intensity = 1.0) {
    for (const t of this.tentacles) {
      t.shockGlow = Math.max(t.shockGlow, intensity);
      this.fluidParticles.push({
        tentacle: t,
        nodeIndex: 0,
        t: 0,
        speed: 15,
        color: Math.random() > 0.3 ? '#3bd6c6' : '#d4af37',
        brightness: intensity,
        size: 2.0
      });
    }
  }

  digestPrey(prey, tentacle) {
    prey.consumed = true;
    if (this.trunk) {
      this.trunk.mouthGlow = 1.0;
      this.trunk.digestionPulse = 1.0;
    }

    const hypostome = this.trunk ? this.trunk.spine[this.trunk.spine.length - 1] : { x: prey.x, y: prey.y };

    // Emit celebratory feeding spark burst
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 60 + 20;
      this.bubbles.push({
        x: hypostome.x,
        y: hypostome.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 10,
        radius: Math.random() * 2.4 + 1.2,
        color: '#ffd700',
        life: 1.5,
        maxLife: 1.5
      });
    }

    // Trigger nutrient pulse throughout hydra vascular channels
    this.triggerVascularPulse(hypostome.x, hypostome.y, 0.9);
  }

  updateFluidParticles(dt) {
    for (let i = this.fluidParticles.length - 1; i >= 0; i--) {
      const p = this.fluidParticles[i];
      const t = p.tentacle;

      if (!t || !this.tentacles.includes(t)) {
        this.fluidParticles.splice(i, 1);
        continue;
      }

      const activeLength = Math.max(2, Math.floor(t.nodeCount * t.growthProgress));
      p.t += dt * (p.speed / (activeLength * t.segmentLength));

      if (p.t >= 1.0) {
        // Reached the tentacle tip: discharge into sea as drifting luciferin bubble
        const tipNode = t.nodes[activeLength - 1];
        if (tipNode) {
          this.bubbles.push({
            x: tipNode.x,
            y: tipNode.y,
            vx: (Math.random() - 0.5) * 15 + this.currentFlow * 10,
            vy: (Math.random() - 0.5) * 15 - 10,
            radius: p.size,
            color: p.color,
            life: 1.8,
            maxLife: 1.8
          });
        }
        this.fluidParticles.splice(i, 1);
      }
    }

    // Spontaneous vascular pulses along tentacles
    if (Math.random() < 0.12 * this.pulseIntensity && this.tentacles.length > 0) {
      const randomTentacle = this.tentacles[Math.floor(Math.random() * this.tentacles.length)];
      this.fluidParticles.push({
        tentacle: randomTentacle,
        nodeIndex: 0,
        t: 0,
        speed: Math.random() * 10 + 10,
        color: Math.random() > 0.3 ? '#3bd6c6' : '#d4af37',
        brightness: 0.8 * this.pulseIntensity,
        size: Math.random() * 2.0 + 1.2
      });
    }
  }

  // ==========================================
  // MICRO-PREY: DAPHNIA & COPEPODS
  // ==========================================

  spawnPrey(x, y) {
    this.prey.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      hopTimer: Math.random() * 1.5,
      hopInterval: Math.random() * 1.2 + 0.8,
      size: Math.random() * 2.5 + 4.5,
      angle: Math.random() * Math.PI * 2,
      capturedBy: null,
      stunned: false,
      consumed: false,
      glow: Math.random() * 0.4 + 0.2
    });
  }

  updatePrey(dt) {
    const flowX = this.currentFlow * 15;

    for (let i = this.prey.length - 1; i >= 0; i--) {
      const p = this.prey[i];

      if (p.consumed) {
        this.prey.splice(i, 1);
        continue;
      }

      if (p.capturedBy) {
        // Controlled by tentacle nematocyst tether
        continue;
      }

      p.hopTimer -= dt;
      if (p.hopTimer <= 0) {
        p.hopTimer = p.hopInterval;
        // Daphnia kick-and-glide power-stroke
        const hopAngle = Math.random() * Math.PI * 2;
        const kickStrength = Math.random() * 120 + 70;
        p.vx = Math.cos(hopAngle) * kickStrength;
        p.vy = Math.sin(hopAngle) * kickStrength - 20;
        p.angle = hopAngle;
      }

      // Drag & water currents
      p.vx = (p.vx + flowX * dt) * 0.94;
      p.vy = (p.vy - 5 * dt) * 0.94; // slight sinking / neutral buoyancy

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Wrap-around screen boundaries
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
      if (p.y < 30) p.y = 30;
      if (p.y > this.height - 40) p.y = this.height - 40;
    }

    // Maintain steady micro-prey population
    while (this.prey.length < 24) {
      const side = Math.random() > 0.5;
      const spawnX = side ? -10 : this.width + 10;
      const spawnY = Math.random() * (this.height - 180) + 40;
      this.spawnPrey(spawnX, spawnY);
    }
  }

  // ==========================================
  // PARTICLES, VORTICES & EMISSIONS
  // ==========================================

  emitBaitParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 40 + 10;
      this.bubbles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd + 15,
        radius: Math.random() * 2.2 + 1.0,
        color: '#ffd700',
        life: 2.2,
        maxLife: 2.2
      });
    }
  }

  emitCutSparks(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 80 + 25;
      this.bubbles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 10,
        radius: Math.random() * 2.6 + 1.2,
        color: Math.random() > 0.4 ? '#3bd6c6' : '#ffd700',
        life: 1.4,
        maxLife: 1.4
      });
    }
  }

  emitNematocystSting(x1, y1, x2, y2) {
    for (let i = 0; i < 8; i++) {
      const t = Math.random();
      const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 8;
      const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 8;
      this.bubbles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        radius: 1.5,
        color: '#3bd6c6',
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  createVortex(x, y, force = 40) {
    // Push nearby ambient plankton, prey, and tentacle nodes in circular eddies
    for (const p of this.prey) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 180) {
        const angle = Math.atan2(dy, dx) + Math.PI * 0.5;
        const push = (180 - dist) / 180 * force;
        p.vx += Math.cos(angle) * push;
        p.vy += Math.sin(angle) * push;
      }
    }

    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 40 + 10;
      this.bubbles.push({
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r,
        vx: -Math.sin(a) * force * 0.8,
        vy: Math.cos(a) * force * 0.8,
        radius: Math.random() * 2.0 + 1.0,
        color: 'rgba(59,214,198,0.7)',
        life: 1.2,
        maxLife: 1.2
      });
    }
  }

  updateSeveredPieces(dt) {
    for (let i = this.severedPieces.length - 1; i >= 0; i--) {
      const s = this.severedPieces[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.severedPieces.splice(i, 1);
        continue;
      }

      // Advect severed nodes through water
      for (const n of s.nodes) {
        n.vx = (n.vx + this.currentFlow * 12 * dt) * 0.95;
        n.vy = (n.vy - 12 * dt) * 0.95;
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        n.luminescence = s.life / s.maxLife;
      }
    }
  }

  updateShockwaves(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += dt * 260;
      sw.alpha = Math.max(0, 1.0 - sw.radius / sw.maxRadius);
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.bubbles.splice(i, 1);
        continue;
      }
      b.vx *= 0.96;
      b.vy = b.vy * 0.96 - 6 * dt; // gentle rise
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    // Ambient abyssal plankton particles
    for (const ap of this.ambientParticles) {
      ap.x += (ap.vx + this.currentFlow * 12) * dt;
      ap.y += ap.vy * dt;
      if (ap.x < 0) ap.x = this.width;
      if (ap.x > this.width) ap.x = 0;
      if (ap.y < 0) ap.y = this.height;
      if (ap.y > this.height) ap.y = 0;
    }
  }

  // ==========================================
  // MAIN UPDATE LOOP
  // ==========================================

  update(dt) {
    // Clamp delta time to prevent physics instabilities
    const clampedDt = Math.min(dt, 0.05);
    this.time += clampedDt;

    this.updateTrunk(clampedDt);
    this.updateTentacles(clampedDt);
    this.updateSeveredPieces(clampedDt);
    this.updateFluidParticles(clampedDt);
    this.updatePrey(clampedDt);
    this.updateShockwaves(clampedDt);
  }

  // ==========================================
  // RENDERING PIPELINE
  // ==========================================

  render(ctx) {
    // 1. Deep Aquatic Abyss Background
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle abyssal radial vignette / bioluminescent back-glow
    if (ctx.createRadialGradient && this.trunk) {
      const hypostome = this.trunk.spine[this.trunk.spine.length - 1];
      const grad = ctx.createRadialGradient(
        hypostome.x, hypostome.y, 20,
        hypostome.x, hypostome.y, Math.max(this.width, this.height) * 0.65
      );
      grad.addColorStop(0, 'rgba(8, 38, 48, 0.45)');
      grad.addColorStop(0.5, 'rgba(4, 18, 26, 0.25)');
      grad.addColorStop(1, 'rgba(5, 7, 12, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Ambient Marine Snow / Plankton Particles
    this.renderAmbientParticles(ctx);

    // 3. Shockwave Rings
    this.renderShockwaves(ctx);

    // 4. Soft-body Trunk & Pedal Disc
    if (this.trunk) {
      this.renderTrunk(ctx);
    }

    // 5. Articulated Tentacles & Luciferin Channels
    this.renderTentacles(ctx);

    // 6. Severed Floating Tentacle Pieces
    this.renderSeveredPieces(ctx);

    // 7. Micro-Prey Organisms (Daphnia / Copepods)
    this.renderPrey(ctx);

    // 8. Drifting Luciferin Sparks & Fluid Embers
    this.renderSparksAndBubbles(ctx);

    // 9. Interactive Blade Slash / Lure Tool Overlays
    this.renderToolOverlay(ctx);

    // 10. Organism Telemetry & Heads Counter
    this.renderHUD(ctx);
  }

  renderAmbientParticles(ctx) {
    ctx.save();
    for (const ap of this.ambientParticles) {
      const twinkle = Math.sin(this.time * 2.0 + ap.phase) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(59, 214, 198, ${(ap.brightness * twinkle * 0.4).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderShockwaves(ctx) {
    ctx.save();
    ctx.lineWidth = 2.5;
    for (const sw of this.shockwaves) {
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha * 0.75;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderTrunk(ctx) {
    const { spine, leftWall, rightWall, mouthGlow, digestionPulse } = this.trunk;
    ctx.save();

    // 1. Pedal Disc Anchor (Seabed Foundation)
    const baseNode = spine[0];
    ctx.fillStyle = '#0f171d';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(baseNode.x, baseNode.y + 12, 60, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rooting rootlet filaments into the rock
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(baseNode.x + i * 12, baseNode.y + 10);
      ctx.quadraticCurveTo(
        baseNode.x + i * 16,
        baseNode.y + 22,
        baseNode.x + i * 20 + Math.sin(this.time + i) * 3,
        baseNode.y + 28
      );
      ctx.stroke();
    }

    // 2. Soft-Body Trunk Wall (Translucent Mesoglea / Column)
    ctx.beginPath();
    ctx.moveTo(leftWall[0].x, leftWall[0].y);
    for (let i = 1; i < leftWall.length; i++) {
      const prev = leftWall[i - 1];
      const curr = leftWall[i];
      const midX = (prev.x + curr.x) * 0.5;
      const midY = (prev.y + curr.y) * 0.5;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.lineTo(leftWall[leftWall.length - 1].x, leftWall[leftWall.length - 1].y);

    // Across hypostome
    const hypostome = spine[spine.length - 1];
    ctx.lineTo(hypostome.x, hypostome.y);
    ctx.lineTo(rightWall[rightWall.length - 1].x, rightWall[rightWall.length - 1].y);

    // Down right wall
    for (let i = rightWall.length - 2; i >= 0; i--) {
      const prev = rightWall[i + 1];
      const curr = rightWall[i];
      const midX = (prev.x + curr.x) * 0.5;
      const midY = (prev.y + curr.y) * 0.5;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.closePath();

    // Column fill: translucent iridescent deep cyan
    ctx.fillStyle = 'rgba(14, 52, 60, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 214, 198, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Gastrovascular Cavity Spine (Internal Glowing Digestive Tube)
    ctx.beginPath();
    ctx.moveTo(spine[0].x, spine[0].y);
    for (let i = 1; i < spine.length; i++) {
      ctx.lineTo(spine[i].x, spine[i].y);
    }
    ctx.strokeStyle = digestionPulse > 0.1 ? '#ffd700' : 'rgba(59, 214, 198, 0.85)';
    ctx.lineWidth = 4 + digestionPulse * 6;
    ctx.stroke();

    // 4. Hypostome & Oral Cone (Mouth)
    ctx.fillStyle = mouthGlow > 0.1 ? '#ffd700' : '#3bd6c6';
    ctx.beginPath();
    ctx.arc(hypostome.x, hypostome.y, 8 + mouthGlow * 6, 0, Math.PI * 2);
    ctx.fill();

    // Oral sphincter glow halo
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hypostome.x, hypostome.y, 14 + mouthGlow * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderTentacles(ctx) {
    ctx.save();

    for (const t of this.tentacles) {
      const activeLength = Math.max(2, Math.floor(t.nodeCount * t.growthProgress));
      if (activeLength < 2) continue;

      // Outer Translucent Sheath
      ctx.beginPath();
      ctx.moveTo(t.nodes[0].x, t.nodes[0].y);
      for (let i = 1; i < activeLength; i++) {
        const p1 = t.nodes[i - 1];
        const p2 = t.nodes[i];
        const midX = (p1.x + p2.x) * 0.5;
        const midY = (p1.y + p2.y) * 0.5;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.lineTo(t.nodes[activeLength - 1].x, t.nodes[activeLength - 1].y);

      // Base width tapering toward tip
      const baseWidth = Math.max(3, 10 * (t.growthProgress ?? 1.0));
      ctx.lineWidth = baseWidth;
      ctx.strokeStyle = 'rgba(28, 95, 105, 0.45)';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner Bioluminescent Vascular Canal
      ctx.beginPath();
      ctx.moveTo(t.nodes[0].x, t.nodes[0].y);
      for (let i = 1; i < activeLength; i++) {
        ctx.lineTo(t.nodes[i].x, t.nodes[i].y);
      }
      const pulseWave = Math.sin(this.time * 3.0 + t.phase) * 0.3 + 0.7;
      const glowLevel = Math.min(1.0, (pulseWave + t.shockGlow) * this.pulseIntensity);

      ctx.lineWidth = Math.max(1.5, 3.2 * (t.growthProgress ?? 1.0));
      ctx.strokeStyle = t.shockGlow > 0.2 ? '#ffd700' : `rgba(59, 214, 198, ${glowLevel.toFixed(2)})`;
      ctx.stroke();

      // Nematocyst batteries (pearly glowing beads along tentacle nodes)
      for (let i = 2; i < activeLength; i += 3) {
        const node = t.nodes[i];
        ctx.fillStyle = t.shockGlow > 0.2 ? '#ffd700' : '#3bd6c6';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tip Bulb (Sensory organelle)
      const tip = t.nodes[activeLength - 1];
      ctx.fillStyle = t.capturedPrey ? '#ffd700' : '#3bd6c6';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Budding Mitosis Indicator (if stub is actively budding)
      if (t.isBudding) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6.0 + Math.sin(this.time * 8.0) * 2.0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Bioluminescent Vascular Fluid Packets
    for (const p of this.fluidParticles) {
      const t = p.tentacle;
      const activeLength = Math.max(2, Math.floor(t.nodeCount * t.growthProgress));
      const exactIndex = p.t * (activeLength - 1);
      const idx0 = Math.floor(exactIndex);
      const idx1 = Math.min(activeLength - 1, idx0 + 1);
      const frac = exactIndex - idx0;

      const n0 = t.nodes[idx0];
      const n1 = t.nodes[idx1];
      if (n0 && n1) {
        const px = n0.x + (n1.x - n0.x) * frac;
        const py = n0.y + (n1.y - n0.y) * frac;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size * this.pulseIntensity, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderSeveredPieces(ctx) {
    ctx.save();
    for (const s of this.severedPieces) {
      const alpha = s.life / s.maxLife;
      ctx.strokeStyle = `rgba(59, 214, 198, ${(alpha * 0.8).toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < s.nodes.length; i++) {
        const n = s.nodes[i];
        if (i === 0) ctx.moveTo(n.x, n.y);
        else ctx.lineTo(n.x, n.y);
      }
      ctx.stroke();

      // Dissolving sparks from severed section
      for (const n of s.nodes) {
        ctx.fillStyle = `rgba(212, 175, 55, ${(alpha * 0.9).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  renderPrey(ctx) {
    ctx.save();
    for (const p of this.prey) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Daphnia / Copepod carapace
      ctx.fillStyle = p.stunned ? 'rgba(59, 214, 198, 0.7)' : 'rgba(212, 175, 55, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Distinct central eye spot
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.arc(p.size * 0.5, 0, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Feathery swimming antennae
      ctx.strokeStyle = p.stunned ? '#3bd6c6' : '#d4af37';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.size * 0.4, -2);
      ctx.lineTo(p.size * 0.8, -p.size * 0.8);
      ctx.moveTo(p.size * 0.4, 2);
      ctx.lineTo(p.size * 0.8, p.size * 0.8);
      ctx.stroke();

      ctx.restore();

      // Stunned nematocyst thread connection
      if (p.capturedBy && p.capturedBy.nodes) {
        const tip = p.capturedBy.nodes[p.capturedBy.nodes.length - 1];
        ctx.strokeStyle = 'rgba(59, 214, 198, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderSparksAndBubbles(ctx) {
    ctx.save();
    for (const b of this.bubbles) {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderToolOverlay(ctx) {
    ctx.save();
    if (this.currentTool === 'Sever / Prune' && this.slicePath.length > 1) {
      // Razor-sharp iridescent cutting trajectory
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < this.slicePath.length; i++) {
        const pt = this.slicePath[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#3bd6c6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.currentTool === 'Lure / Feed') {
      // Golden bait cursor with pulsating aura
      const aura = Math.sin(this.time * 6.0) * 3 + 10;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, aura, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderHUD(ctx) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const narrow = sw < 560;

    const x = narrow ? 16 : 20;
    const y = 24;
    const count = this.getEntityCount();
    const boxW = narrow ? Math.min(sw - 24, 210) : 210;

    ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 8, y - 14, boxW, 80);
    ctx.strokeRect(x - 8, y - 14, boxW, 80);

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('HYDRA VULGARIS (MYTHIC POLYP)', x, y);

    ctx.fillStyle = '#3bd6c6';
    ctx.fillText(`HEADS / TENTACLES: ${this.tentacles.length}`, x, y + 16);

    ctx.fillStyle = '#a0b0c0';
    ctx.fillText(`SOFT-BODY ENTITIES: ${count}`, x, y + 32);
    ctx.fillText(`MICRO-PREY: ${this.prey.length} | TOOL: ${this.currentTool}`, x, y + 48);

    ctx.restore();
  }
}
