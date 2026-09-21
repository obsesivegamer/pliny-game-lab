// Pliny Game Lab — Nautilus (Logarithmic Spiral & Hydrostatic Buoyancy Chambers)
// Pure ES module simulating Nautilus pompilius shell geometry (r = ae^(bθ)),
// siphuncle cameral fluid/gas osmosis, Archimedean buoyancy dynamics, and hyponome jet pulses.
// Visuals: Cutaway iridescent mother-of-pearl (nacre), Amber (#FFBF00), Pearl (#EAE6DF), Deep Sea Blue (#0B1B3D).

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class NautilusEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 800 : 800;
    this.height = canvas ? canvas.height || 600 : 600;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    attachTouchBridge(this, canvas);

    // Simulation Clock
    this.time = 0;
    this.dt = 0.016;

    // Logarithmic Spiral Parameters: r = a * exp(b * theta)
    // For Nautilus pompilius, typical expansion ratio per whorl is ~3.0 - 3.2
    this.spiralA = 5.6; // Initial inner radius scale
    this.spiralB = 0.176; // Logarithmic growth constant (e^(2π*0.176) ≈ 3.02)
    this.totalWhorls = 2.75; // Total spiral revolutions
    this.thetaMax = this.totalWhorls * Math.PI * 2; // ~17.27 radians
    this.chamberCount = 28; // Number of calcified camerae

    // Archimedean Hydrostatic & Siphuncle Parameters
    this.depthTarget = 220; // Meters (mapped to canvas Y: 20m - 500m)
    this.jetThrustForce = 150; // Newtons equivalent (impulse force)
    this.osmosisRate = 1.2; // Siphuncle fluid exchange rate multiplier
    this.gravity = 9.81;
    this.waterDensity = 1025; // Seawater kg/m^3

    // Specimen Physics State
    this.specimen = {
      x: this.width * 0.48,
      y: this.height * 0.45,
      vx: 0,
      vy: 0,
      pitch: -0.15, // Radians (slight forward tilt)
      angularVel: 0,
      scale: 1.0,
      dryMass: 0.82, // Baseline shell + tissue mass (kg)
      fluidMass: 0.20, // Variable cameral liquid mass (kg)
      displacedVolume: 0.00100, // Total shell volume m^3 (1.00 L)
      jetCooldown: 0,
      jetPulseActive: 0,
      isDragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0
    };

    // Camerae & Septa Structures
    this.chambers = [];
    this.septaSegments = [];
    this.siphunclePath = [];
    this.buildShellGeometry();

    // Particle Systems
    this.gasParticles = [];
    this.waterJetParticles = [];
    this.marinePlankton = [];
    this.initParticles();

    // Sound Synthesizer (Headless guarded)
    this.audioCtx = null;
    this.initAudio();

    // DOM Controls (Headless guarded)
    this.initControls();
  }

  /* -------------------------------------------------------------------------- */
  /* 1. MATHEMATICAL LOGARITHMIC SPIRAL & SHELL GEOMETRY                        */
  /* -------------------------------------------------------------------------- */

  buildShellGeometry() {
    this.chambers = [];
    this.septaSegments = [];
    this.siphunclePath = [];

    const a = this.spiralA;
    const b = this.spiralB;

    // Body chamber (living chamber) spans the final ~180 degrees (π radians)
    const bodyChamberSpan = Math.PI * 1.05;
    const phragmoconeThetaEnd = this.thetaMax - bodyChamberSpan;
    const phragmoconeThetaStart = 0.75;

    // Generate 28 camerae along the logarithmic spiral
    const count = this.chamberCount;
    for (let i = 0; i < count; i++) {
      // Nonlinear spacing: younger chambers nearer protoconch are angularly tighter
      const progress = i / (count - 1);
      const theta = phragmoconeThetaStart + (phragmoconeThetaEnd - phragmoconeThetaStart) * Math.pow(progress, 0.94);

      // Outer shell wall radius at this septum
      const rOut = a * Math.exp(b * theta);
      // Inner shell wall radius (ventral floor) nests on the previous whorl (theta - 2π)
      let rIn = 0;
      if (theta >= Math.PI * 2) {
        rIn = a * Math.exp(b * (theta - Math.PI * 2));
      } else {
        rIn = Math.max(1.8, a * Math.exp(b * (theta - Math.PI * 2)) * Math.sqrt(theta / (Math.PI * 2)));
      }

      // Coordinates in shell-local coordinate system
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const pOut = { x: rOut * cosT, y: rOut * sinT };
      const pIn = { x: rIn * cosT, y: rIn * sinT };

      // Nautilus septa are concave arches (bowing towards apex / protoconch)
      // Midpoint arch control point
      const midTheta = theta - 0.28 * (1 - 0.35 * (i / count));
      const midR = (rOut + rIn) * 0.49 * 0.94;
      const pCtrl = {
        x: midR * Math.cos(midTheta),
        y: midR * Math.sin(midTheta)
      };

      // Discretize the curved septum into 8 line segments for entity count & rendering
      const segments = [];
      const numSteps = 8;
      let prevPt = pIn;
      for (let s = 1; s <= numSteps; s++) {
        const t = s / numSteps;
        const pt = this.getQuadraticBezierPoint(pIn, pCtrl, pOut, t);
        segments.push({
          x1: prevPt.x,
          y1: prevPt.y,
          x2: pt.x,
          y2: pt.y
        });
        prevPt = pt;
      }

      // Siphuncle penetrates septum at approximately t = 0.44 (sub-central septal neck)
      const siphunclePt = this.getQuadraticBezierPoint(pIn, pCtrl, pOut, 0.44);

      // Initial fluid fraction: inner chambers (0-6) are dry (~0%), outer chambers have hydrostatic fluid
      const initialFluid = i < 6 ? 0.02 : Math.max(0.01, Math.min(0.95, 0.15 + 0.35 * Math.sin(i * 0.2)));

      // Approximate volume of chamber proportional to local shell radius cubed (liters)
      const approxVol = Math.pow(rOut - rIn, 2) * ((rOut + rIn) * 0.5) * 0.000001;

      this.chambers.push({
        index: i,
        theta,
        pIn,
        pCtrl,
        pOut,
        siphunclePt,
        rIn,
        rOut,
        segments,
        volume: approxVol,
        fluidFraction: initialFluid, // 0.0 (all gas) to 1.0 (flooded)
        targetFluidFraction: initialFluid,
        gasBubbles: []
      });

      this.septaSegments.push(...segments);
      this.siphunclePath.push(siphunclePt);
    }

    // Outer wall spiral path points
    this.outerWallPoints = [];
    const wallSteps = 120;
    for (let j = 0; j <= wallSteps; j++) {
      const th = 0.5 + (this.thetaMax - 0.5) * (j / wallSteps);
      const r = a * Math.exp(b * th);
      this.outerWallPoints.push({
        x: r * Math.cos(th),
        y: r * Math.sin(th),
        r,
        theta: th
      });
    }

    // Inner wall spiral path points
    this.innerWallPoints = [];
    for (let j = 0; j <= wallSteps; j++) {
      const th = 0.5 + (this.thetaMax - 0.5) * (j / wallSteps);
      let r = 0;
      if (th >= Math.PI * 2) {
        r = a * Math.exp(b * (th - Math.PI * 2));
      } else {
        r = Math.max(1.8, a * Math.exp(b * (th - Math.PI * 2)) * Math.sqrt(th / (Math.PI * 2)));
      }
      this.innerWallPoints.push({
        x: r * Math.cos(th),
        y: r * Math.sin(th),
        r,
        theta: th
      });
    }

    // Connect siphuncle terminal into the body tissue
    const lastSeptum = this.chambers[this.chambers.length - 1];
    const bodyTerminal = {
      x: lastSeptum.siphunclePt.x + Math.cos(lastSeptum.theta + 0.3) * 16,
      y: lastSeptum.siphunclePt.y + Math.sin(lastSeptum.theta + 0.3) * 16
    };
    this.siphunclePath.push(bodyTerminal);
  }

  getQuadraticBezierPoint(p0, p1, p2, t) {
    const inv = 1 - t;
    return {
      x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
      y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
    };
  }

  /* -------------------------------------------------------------------------- */
  /* 2. PARTICLE SYSTEMS (GAS, WATER JET, MARINE PLANKTON)                      */
  /* -------------------------------------------------------------------------- */

  initParticles() {
    this.gasParticles = [];
    this.waterJetParticles = [];
    this.marinePlankton = [];

    // Initialize micro gas bubble entities inside the camerae
    const totalGasParticles = 84;
    for (let k = 0; k < totalGasParticles; k++) {
      const chIndex = Math.floor(Math.random() * this.chambers.length);
      const ch = this.chambers[chIndex];
      const t = 0.15 + Math.random() * 0.7;
      const pt = this.getQuadraticBezierPoint(ch.pIn, ch.pCtrl, ch.pOut, t);
      this.gasParticles.push({
        chamberIndex: chIndex,
        x: pt.x + (Math.random() - 0.5) * 6,
        y: pt.y + (Math.random() - 0.5) * 6,
        radius: 0.8 + Math.random() * 1.5,
        alpha: 0.4 + Math.random() * 0.5,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.8 + Math.random() * 1.2
      });
    }

    // Initialize ambient ocean plankton / marine snow
    const planktonCount = 65;
    for (let p = 0; p < planktonCount; p++) {
      this.marinePlankton.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1.0 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 8,
        vy: -4 - Math.random() * 10,
        luminance: 0.2 + Math.random() * 0.6,
        pulseSpeed: 1 + Math.random() * 2
      });
    }
  }

  spawnSiphonJetNodes(count = 28) {
    if (count <= 0) return;

    // Siphon nozzle position in world coordinates (located on ventral side of living chamber)
    const pitch = isFinite(this.specimen.pitch) ? this.specimen.pitch : -0.15;
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // Living chamber ventral nozzle offset
    const nozzleLocalX = 115;
    const nozzleLocalY = 48;
    const specX = isFinite(this.specimen.x) ? this.specimen.x : this.width * 0.48;
    const specY = isFinite(this.specimen.y) ? this.specimen.y : this.height * 0.45;
    const nozzleWorldX = specX + (nozzleLocalX * cosP - nozzleLocalY * sinP);
    const nozzleWorldY = specY + (nozzleLocalX * sinP + nozzleLocalY * cosP);

    // Jet impulse direction: expelled backwards & slightly down
    const jetAngle = pitch + Math.PI * 0.88;
    const baseJetSpeed = ((this.jetThrustForce || 150) / 150) * 190;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.45;
      const speed = baseJetSpeed * (0.6 + Math.random() * 0.8);
      const angle = jetAngle + spread;

      this.waterJetParticles.push({
        x: nozzleWorldX + (Math.random() - 0.5) * 6,
        y: nozzleWorldY + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 20,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 20,
        radius: 2.2 + Math.random() * 3.5,
        maxRadius: 10 + Math.random() * 14,
        life: 1.0,
        decay: 0.8 + Math.random() * 0.9, // seconds
        isVortexRing: i % 4 === 0,
        ringRadius: 3 + Math.random() * 5
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 3. SOUND SYNTHESIS (HEADLESS SAFE)                                         */
  /* -------------------------------------------------------------------------- */

  initAudio() {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (_) {}
  }

  playJetSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;

      // Filtered noise burst simulating whooshing water propulsion
      const bufferSize = this.audioCtx.sampleRate * 0.35;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.35);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      whiteNoise.start(now);

      // Low sub-bass thud for muscular mantle contraction
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (_) {}
  }

  playOsmosisSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }

  /* -------------------------------------------------------------------------- */
  /* 4. DOM CONTROLS BUILDER (HEADLESS SAFE GUARDED)                            */
  /* -------------------------------------------------------------------------- */

  initControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Depth Target (Buoyancy): <span id="val-depth">${Math.round(this.depthTarget)} m</span></label>
        <input type="range" id="slider-depth" min="20" max="500" step="5" value="${this.depthTarget}">
      </div>

      <div class="control-group">
        <label>Jet Thrust Force: <span id="val-thrust">${Math.round(this.jetThrustForce)} N</span></label>
        <input type="range" id="slider-thrust" min="50" max="300" step="10" value="${this.jetThrustForce}">
      </div>

      <div class="control-group">
        <label>Siphuncle Osmosis Rate: <span id="val-osmosis">${this.osmosisRate.toFixed(1)}x</span></label>
        <input type="range" id="slider-osmosis" min="0.5" max="3.0" step="0.1" value="${this.osmosisRate}">
      </div>

      <div class="control-group" style="display: flex; flex-direction: column; gap: 6px;">
        <button id="btn-jet" class="sub-btn" style="background: rgba(255, 191, 0, 0.2); border-color: #FFBF00; font-weight: bold; padding: 8px; color: #FFBF00;">
          ⚡ Siphon Jet Pulse (Space)
        </button>
        <div style="display: flex; gap: 6px;">
          <button id="btn-dive" class="sub-btn" style="flex: 1; background: rgba(11, 27, 61, 0.6); border-color: #48CAE4; padding: 7px; font-size: 0.82rem; color: #EAE6DF;">
            ⬇ Flood (Dive)
          </button>
          <button id="btn-surface" class="sub-btn" style="flex: 1; background: rgba(234, 230, 223, 0.15); border-color: #EAE6DF; padding: 7px; font-size: 0.82rem; color: #EAE6DF;">
            ⬆ Vent Gas (Rise)
          </button>
        </div>
        <button id="btn-reset" class="sub-btn" style="background: rgba(150, 40, 40, 0.25); border-color: #FF5A5F; padding: 7px; font-size: 0.82rem; color: #FF5A5F;">
          ↺ Reset Specimen
        </button>
      </div>

      <div class="control-group" style="font-size: 0.82rem; line-height: 1.45; opacity: 0.9; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
        <div><strong>Key Navigation:</strong> [Space] Siphon Jet | [W/S] or [↑/↓] Target Depth</div>
        <div><strong>Specimen Drag:</strong> Click & drag Nautilus to reposition in abyss</div>
        <div><strong>Hydrostatic Model:</strong> Siphuncle osmotically pumps fluid to reach target density</div>
      </div>
    `;

    // Bind Depth Slider
    const sliderDepth = this.controlsContainer.querySelector('#slider-depth');
    const valDepth = this.controlsContainer.querySelector('#val-depth');
    if (sliderDepth) {
      sliderDepth.addEventListener('input', (e) => {
        this.depthTarget = parseFloat(e.target.value);
        if (valDepth) valDepth.textContent = `${Math.round(this.depthTarget)} m`;
      });
    }

    // Bind Thrust Slider
    const sliderThrust = this.controlsContainer.querySelector('#slider-thrust');
    const valThrust = this.controlsContainer.querySelector('#val-thrust');
    if (sliderThrust) {
      sliderThrust.addEventListener('input', (e) => {
        this.jetThrustForce = parseFloat(e.target.value);
        if (valThrust) valThrust.textContent = `${Math.round(this.jetThrustForce)} N`;
      });
    }

    // Bind Osmosis Slider
    const sliderOsmosis = this.controlsContainer.querySelector('#slider-osmosis');
    const valOsmosis = this.controlsContainer.querySelector('#val-osmosis');
    if (sliderOsmosis) {
      sliderOsmosis.addEventListener('input', (e) => {
        this.osmosisRate = parseFloat(e.target.value);
        if (valOsmosis) valOsmosis.textContent = `${this.osmosisRate.toFixed(1)}x`;
      });
    }

    // Bind Buttons
    const btnJet = this.controlsContainer.querySelector('#btn-jet');
    if (btnJet) {
      btnJet.addEventListener('click', () => {
        this.triggerSiphonJet();
      });
    }

    const btnDive = this.controlsContainer.querySelector('#btn-dive');
    if (btnDive) {
      btnDive.addEventListener('click', () => {
        this.floodChambers(0.25);
      });
    }

    const btnSurface = this.controlsContainer.querySelector('#btn-surface');
    if (btnSurface) {
      btnSurface.addEventListener('click', () => {
        this.purgeChambers(0.25);
      });
    }

    const btnReset = this.controlsContainer.querySelector('#btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 5. HYDROSTATIC BUOYANCY & PHYSICS SIMULATION                               */
  /* -------------------------------------------------------------------------- */

  triggerSiphonJet() {
    this.specimen.jetPulseActive = 0.32; // Active surge duration (seconds)
    this.specimen.jetCooldown = 0.45;

    // Reaction impulse vector (pointing forward & slightly upward relative to shell)
    const thrust = (this.jetThrustForce || 150) * 0.95;
    const pitch = isFinite(this.specimen.pitch) ? this.specimen.pitch : -0.15;
    const forwardAngle = pitch - Math.PI * 0.12;
    this.specimen.vx = (this.specimen.vx || 0) + Math.cos(forwardAngle) * thrust * 0.35;
    this.specimen.vy = (this.specimen.vy || 0) + Math.sin(forwardAngle) * thrust * 0.35;

    // Rocking torque recoil
    this.specimen.angularVel = (this.specimen.angularVel || 0) + 0.85;

    // Eject water jet nodes
    this.spawnSiphonJetNodes(32);

    // Audio cue
    this.playJetSound();
  }

  floodChambers(amount = 0.2) {
    const amt = isFinite(amount) ? amount : 0.2;
    for (let i = 6; i < this.chambers.length; i++) {
      this.chambers[i].fluidFraction = Math.min(1.0, Math.max(0.01, (this.chambers[i].fluidFraction || 0) + amt));
    }
    this.playOsmosisSound();
  }

  purgeChambers(amount = 0.2) {
    const amt = isFinite(amount) ? amount : 0.2;
    for (let i = 6; i < this.chambers.length; i++) {
      this.chambers[i].fluidFraction = Math.max(0.01, Math.min(1.0, (this.chambers[i].fluidFraction || 0) - amt));
    }
    this.playOsmosisSound();
  }

  update(dt) {
    // Clamp delta time to avoid simulation instability
    const step = Math.min(Math.max(0.001, isFinite(dt) ? dt : 0.016), 0.05);
    this.time += step;

    // Sanitize specimen values if non-finite
    if (!isFinite(this.specimen.x)) this.specimen.x = this.width * 0.48;
    if (!isFinite(this.specimen.y)) this.specimen.y = this.height * 0.45;
    if (!isFinite(this.specimen.vx)) this.specimen.vx = 0;
    if (!isFinite(this.specimen.vy)) this.specimen.vy = 0;
    if (!isFinite(this.specimen.pitch)) this.specimen.pitch = -0.15;
    if (!isFinite(this.specimen.angularVel)) this.specimen.angularVel = 0;

    // 1. Current depth in meters (canvas Y mapped: 50px = 20m, height-50px = 500m)
    const depthMargin = 60;
    const depthSpan = Math.max(10, this.height - depthMargin * 2);
    const currentDepth = 20 + Math.max(0, Math.min(1, (this.specimen.y - depthMargin) / depthSpan)) * 480;

    // 2. Automated Siphuncle Cameral Fluid Osmoregulation:
    // Siphuncle senses depth error and alters target fluid fraction
    const targetDepth = isFinite(this.depthTarget) ? this.depthTarget : 220;
    const depthError = targetDepth - currentDepth; // positive means too shallow -> needs more liquid to sink
    const baseTargetFluid = 0.18 + Math.max(0, Math.min(0.65, (targetDepth - 20) / 480 * 0.65));

    // Dynamic target fluid level across camerae
    let totalFluidMass = 0;
    const osmosisSpeed = 0.45 * (this.osmosisRate || 1.2) * step;

    for (let i = 0; i < this.chambers.length; i++) {
      const ch = this.chambers[i];
      if (i < 6) {
        ch.targetFluidFraction = 0.02; // Earliest chambers remain gas-sealed
      } else {
        // Outer chambers have greater fluid exchange responsiveness
        const responsiveness = 0.6 + 0.4 * (i / this.chambers.length);
        const bias = (depthError / 250) * responsiveness;
        ch.targetFluidFraction = Math.max(0.01, Math.min(0.95, baseTargetFluid + bias));
      }

      // Smooth osmotic diffusion
      const diff = ch.targetFluidFraction - (ch.fluidFraction || 0);
      ch.fluidFraction = Math.max(0.01, Math.min(0.95, (ch.fluidFraction || 0) + diff * osmosisSpeed));

      // Accumulate mass (water density = 1000 kg/m^3)
      totalFluidMass += ch.volume * ch.fluidFraction * 1.05;
    }
    this.specimen.fluidMass = isFinite(totalFluidMass) ? totalFluidMass : 0.20;

    // 3. Archimedean Buoyancy Physics
    // Gravity Force: Fg = m_total * g
    const totalMass = (this.specimen.dryMass || 0.82) + this.specimen.fluidMass;
    const fg = totalMass * this.gravity;

    // Buoyant Force: Fb = rho_water * V_displaced * g
    // Equilibrium is achieved when totalMass = neutralMass (~1.02 kg)
    const neutralMass = 1.025;
    const fb = neutralMass * this.gravity;
    const netVerticalForce = fb - fg; // Positive = upwards buoyant acceleration

    // Vertical acceleration (screen coordinates: down is +Y, so -netVerticalForce accelerates down)
    const netAccY = -netVerticalForce * 55; // Screen pixel acceleration scale

    // Apply forces if not being manually dragged
    if (!this.specimen.isDragging) {
      if (isFinite(netAccY)) {
        this.specimen.vy += netAccY * step;
      }

      // Hydrodynamic water drag (quadratic damping)
      const dragCoeff = 1.8;
      const speedSq = this.specimen.vx * this.specimen.vx + this.specimen.vy * this.specimen.vy;
      const speed = Math.sqrt(speedSq);
      if (speed > 0.001) {
        // Unconditionally stable semi-implicit quadratic drag formulation
        const dragFactor = 1 / (1 + dragCoeff * speed * step);
        this.specimen.vx *= dragFactor;
        this.specimen.vy *= dragFactor;
      }

      // Linear viscous damping
      this.specimen.vx *= Math.pow(0.88, step * 60);
      this.specimen.vy *= Math.pow(0.90, step * 60);

      // Clamp velocities to prevent runaway
      const maxSpeed = 1200;
      this.specimen.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.specimen.vx));
      this.specimen.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.specimen.vy));

      // Integrate velocity to position
      this.specimen.x += this.specimen.vx * step;
      this.specimen.y += this.specimen.vy * step;

      // Soft boundary constraints
      const marginX = 140;
      const marginY = 80;
      if (this.specimen.x < marginX) {
        this.specimen.x = marginX;
        this.specimen.vx = Math.abs(this.specimen.vx) * 0.5;
      } else if (this.specimen.x > this.width - marginX) {
        this.specimen.x = this.width - marginX;
        this.specimen.vx = -Math.abs(this.specimen.vx) * 0.5;
      }
      if (this.specimen.y < marginY) {
        this.specimen.y = marginY;
        this.specimen.vy = Math.abs(this.specimen.vy) * 0.4;
      } else if (this.specimen.y > this.height - marginY) {
        this.specimen.y = this.height - marginY;
        this.specimen.vy = -Math.abs(this.specimen.vy) * 0.4;
      }

      // 4. Pitch & Rotational Metacentric Stability:
      // Nautilus center of buoyancy is above center of gravity -> restoring upright torque
      const targetPitch = -0.15 + (this.specimen.vy * 0.002);
      const pitchDiff = targetPitch - this.specimen.pitch;
      const restoringTorque = pitchDiff * 14.0;

      this.specimen.angularVel = (this.specimen.angularVel || 0) + restoringTorque * step;
      this.specimen.angularVel *= Math.pow(0.82, step * 60); // Angular hydrodynamic damping
      this.specimen.angularVel = Math.max(-10, Math.min(10, this.specimen.angularVel));
      this.specimen.pitch += this.specimen.angularVel * step;
      this.specimen.pitch = Math.max(-Math.PI, Math.min(Math.PI, this.specimen.pitch));
    }

    // Jet pulse timer
    if (this.specimen.jetPulseActive > 0) {
      this.specimen.jetPulseActive -= step;
      // Secondary bubble trail during jet duration
      if (Math.random() < 0.4) {
        this.spawnSiphonJetNodes(3);
      }
    }
    if (this.specimen.jetCooldown > 0) {
      this.specimen.jetCooldown -= step;
    }

    // 5. Update Water Jet Particles
    for (let j = this.waterJetParticles.length - 1; j >= 0; j--) {
      const p = this.waterJetParticles[j];
      p.x += (p.vx || 0) * step;
      p.y += (p.vy || 0) * step;
      p.vx *= Math.pow(0.85, step * 60);
      p.vy *= Math.pow(0.85, step * 60);
      p.radius += (p.maxRadius - p.radius) * 4.0 * step;
      const decay = p.decay > 0 ? p.decay : 1.0;
      p.life -= (1.0 / decay) * step;

      if (p.life <= 0 || !isFinite(p.x) || !isFinite(p.y)) {
        this.waterJetParticles.splice(j, 1);
      }
    }

    // 6. Update Gas Particles inside chambers
    for (let g = 0; g < this.gasParticles.length; g++) {
      const gp = this.gasParticles[g];
      gp.driftPhase += (gp.driftSpeed || 1) * step;
      // Micro-oscillation simulating osmotic gas exchange
      gp.currentOffsetX = Math.cos(gp.driftPhase) * 2.2;
      gp.currentOffsetY = Math.sin(gp.driftPhase) * 2.2;
    }

    // 7. Update Marine Plankton
    for (let m = 0; m < this.marinePlankton.length; m++) {
      const pl = this.marinePlankton[m];
      pl.x += (pl.vx || 0) * step;
      pl.y += (pl.vy || 0) * step;

      // Wrap around bounds
      if (pl.y < 0) pl.y = this.height;
      if (pl.y > this.height) pl.y = 0;
      if (pl.x < 0) pl.x = this.width;
      if (pl.x > this.width) pl.x = 0;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 6. RENDERING: CUTAWAY IRIDESCENT NACRE & DEEP SEA PALETTE                  */
  /* -------------------------------------------------------------------------- */

  render(ctx) {
    const renderCtx = ctx || this.ctx;
    if (!renderCtx) return;

    // Palette Definitions (Per Specification)
    const deepSeaBlue = '#0B1B3D';
    const pearlNacre = '#EAE6DF';
    const amberGold = '#FFBF00';

    // 1. Deep Sea Ocean Gradient Background
    const bgGrad = renderCtx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0.0, '#040d1f');
    bgGrad.addColorStop(0.45, deepSeaBlue);
    bgGrad.addColorStop(1.0, '#020611');
    renderCtx.fillStyle = bgGrad;
    renderCtx.fillRect(0, 0, this.width, this.height);

    // 2. Ambient Sunlight God-Rays filtering through deep water column
    renderCtx.save();
    renderCtx.globalCompositeOperation = 'screen';
    for (let r = 0; r < 4; r++) {
      const rayX = (this.width * 0.2) + r * (this.width * 0.22);
      const rayGrad = renderCtx.createLinearGradient(rayX, 0, rayX - 80, this.height);
      rayGrad.addColorStop(0, 'rgba(72, 202, 228, 0.08)');
      rayGrad.addColorStop(0.6, 'rgba(72, 202, 228, 0.02)');
      rayGrad.addColorStop(1, 'rgba(11, 27, 61, 0.0)');

      renderCtx.fillStyle = rayGrad;
      renderCtx.beginPath();
      renderCtx.moveTo(rayX - 30, 0);
      renderCtx.lineTo(rayX + 50, 0);
      renderCtx.lineTo(rayX + 160, this.height);
      renderCtx.lineTo(rayX - 40, this.height);
      renderCtx.closePath();
      renderCtx.fill();
    }
    renderCtx.restore();

    // 3. Render Ambient Marine Plankton / Bioluminescence
    renderCtx.save();
    for (let m = 0; m < this.marinePlankton.length; m++) {
      const pl = this.marinePlankton[m];
      if (!isFinite(pl.x) || !isFinite(pl.y) || !isFinite(pl.size)) continue;
      const pulse = 0.5 + 0.5 * Math.sin(this.time * pl.pulseSpeed + m);
      renderCtx.fillStyle = `rgba(180, 230, 255, ${pl.luminance * pulse * 0.75})`;
      renderCtx.beginPath();
      renderCtx.arc(pl.x, pl.y, pl.size, 0, Math.PI * 2);
      renderCtx.fill();
    }
    renderCtx.restore();

    // 4. Render Siphon Jet Particles & Water Vortices in World Space
    renderCtx.save();
    for (let j = 0; j < this.waterJetParticles.length; j++) {
      const p = this.waterJetParticles[j];
      if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.radius) || p.radius <= 0) continue;
      const alpha = Math.max(0, p.life || 0);

      if (p.isVortexRing) {
        // Expansive vortex bubble ring
        renderCtx.strokeStyle = `rgba(234, 230, 223, ${alpha * 0.75})`;
        renderCtx.lineWidth = 1.6;
        renderCtx.beginPath();
        renderCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        renderCtx.stroke();
      } else {
        // Cavitation bubble node
        const jetGrad = renderCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        jetGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
        jetGrad.addColorStop(0.4, `rgba(72, 202, 228, ${alpha * 0.6})`);
        jetGrad.addColorStop(1, 'rgba(11, 27, 61, 0)');
        renderCtx.fillStyle = jetGrad;
        renderCtx.beginPath();
        renderCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        renderCtx.fill();
      }
    }
    renderCtx.restore();

    // 5. Render Nautilus Specimen (Transform to Specimen Frame)
    renderCtx.save();
    const specX = isFinite(this.specimen.x) ? this.specimen.x : this.width * 0.48;
    const specY = isFinite(this.specimen.y) ? this.specimen.y : this.height * 0.45;
    const specPitch = isFinite(this.specimen.pitch) ? this.specimen.pitch : -0.15;
    const specScale = isFinite(this.specimen.scale) ? this.specimen.scale : 1.0;
    renderCtx.translate(specX, specY);
    renderCtx.rotate(specPitch);
    renderCtx.scale(specScale, specScale);

    this.renderNautilusCutaway(renderCtx, pearlNacre, amberGold, deepSeaBlue);

    renderCtx.restore();

    // 6. Hydrostatic HUD & Depth Telemetry Overlay
    this.renderHUD(renderCtx, pearlNacre, amberGold);
  }

  renderNautilusCutaway(ctx, pearlColor, amberColor, deepBlue) {
    // A. Outer Shell Wall Base & Iridescent Nacre Outer Border
    ctx.save();

    // Outer spiral wall path
    ctx.beginPath();
    for (let i = 0; i < this.outerWallPoints.length; i++) {
      const pt = this.outerWallPoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    // Connect along aperture opening to inner wall
    for (let i = this.innerWallPoints.length - 1; i >= 0; i--) {
      const pt = this.innerWallPoints[i];
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();

    // Fill cutaway interior background with deep pearlescent nacre sheen
    const nacreFillGrad = ctx.createRadialGradient(0, 0, 10, 30, 40, 180);
    nacreFillGrad.addColorStop(0.0, '#102244');
    nacreFillGrad.addColorStop(0.5, '#0d1a33');
    nacreFillGrad.addColorStop(0.85, '#071020');
    nacreFillGrad.addColorStop(1.0, '#030812');
    ctx.fillStyle = nacreFillGrad;
    ctx.fill();

    // Thick outer calcified porcelain shell wall with mother-of-pearl border
    ctx.strokeStyle = pearlColor;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Flame / Zebra pattern stripes on the exterior shell surface (dorsal camouflage)
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 120, 30, 0.45)';
    ctx.lineWidth = 2.4;
    for (let th = 3.2; th < this.thetaMax; th += 0.22) {
      const rOuter = this.spiralA * Math.exp(this.spiralB * th);
      const rInner = rOuter * 0.72;
      const wave = Math.sin(th * 6) * 6;
      ctx.beginPath();
      ctx.moveTo(rInner * Math.cos(th), rInner * Math.sin(th));
      ctx.lineTo((rOuter + wave) * Math.cos(th), (rOuter + wave) * Math.sin(th));
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();

    // B. Individual Camerae (Chambers): Cameral Fluid, Meniscus & Gas Bubbles
    for (let i = 0; i < this.chambers.length; i++) {
      const ch = this.chambers[i];
      const nextCh = (i < this.chambers.length - 1) ? this.chambers[i + 1] : null;

      // Draw chamber interior liquid and gas if adjacent chamber exists
      if (nextCh) {
        ctx.save();
        ctx.beginPath();
        // Path enclosing this single chamber
        ctx.moveTo(ch.pIn.x, ch.pIn.y);
        ctx.quadraticCurveTo(ch.pCtrl.x, ch.pCtrl.y, ch.pOut.x, ch.pOut.y);
        ctx.lineTo(nextCh.pOut.x, nextCh.pOut.y);
        ctx.quadraticCurveTo(nextCh.pCtrl.x, nextCh.pCtrl.y, nextCh.pIn.x, nextCh.pIn.y);
        ctx.closePath();
        ctx.clip();

        // 1. Mother-of-pearl iridescent nacreous sheen in the chamber ceiling
        const nacreSheen = ctx.createLinearGradient(ch.pIn.x, ch.pIn.y, ch.pOut.x, ch.pOut.y);
        nacreSheen.addColorStop(0.0, 'rgba(234, 230, 223, 0.12)');
        nacreSheen.addColorStop(0.35, 'rgba(180, 240, 255, 0.18)'); // Cyan opalescent
        nacreSheen.addColorStop(0.7, 'rgba(255, 210, 240, 0.15)'); // Magenta opalescent
        nacreSheen.addColorStop(1.0, 'rgba(255, 191, 0, 0.14)'); // Amber sheen
        ctx.fillStyle = nacreSheen;
        ctx.fill();

        // 2. Amber Cameral Fluid Level
        if (ch.fluidFraction > 0.01) {
          const fluidRatio = ch.fluidFraction;
          // Fluid settles in ventral region of chamber
          const fInX = ch.pIn.x * (1 - fluidRatio) + ch.pOut.x * fluidRatio * 0.4;
          const fInY = ch.pIn.y * (1 - fluidRatio) + ch.pOut.y * fluidRatio * 0.4;
          const fOutX = nextCh.pIn.x * (1 - fluidRatio) + nextCh.pOut.x * fluidRatio * 0.4;
          const fOutY = nextCh.pIn.y * (1 - fluidRatio) + nextCh.pOut.y * fluidRatio * 0.4;

          const fluidGrad = ctx.createLinearGradient(ch.pIn.x, ch.pIn.y, ch.pOut.x, ch.pOut.y);
          fluidGrad.addColorStop(0.0, 'rgba(255, 191, 0, 0.75)'); // Glowing Amber
          fluidGrad.addColorStop(0.6, 'rgba(212, 140, 0, 0.65)');
          fluidGrad.addColorStop(1.0, 'rgba(160, 90, 0, 0.45)');

          ctx.fillStyle = fluidGrad;
          ctx.beginPath();
          ctx.moveTo(ch.pIn.x, ch.pIn.y);
          ctx.lineTo(fInX, fInY);
          // Meniscus curve
          ctx.quadraticCurveTo((fInX + fOutX) * 0.5, (fInY + fOutY) * 0.5 - 2, fOutX, fOutY);
          ctx.lineTo(nextCh.pIn.x, nextCh.pIn.y);
          ctx.closePath();
          ctx.fill();

          // Meniscus surface highlight line
          ctx.strokeStyle = 'rgba(255, 235, 150, 0.85)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(fInX, fInY);
          ctx.quadraticCurveTo((fInX + fOutX) * 0.5, (fInY + fOutY) * 0.5 - 2, fOutX, fOutY);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Render Septum Arch Curve (Pearlescent Septal Wall)
      ctx.save();
      ctx.strokeStyle = pearlColor;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(234, 230, 223, 0.5)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(ch.pIn.x, ch.pIn.y);
      ctx.quadraticCurveTo(ch.pCtrl.x, ch.pCtrl.y, ch.pOut.x, ch.pOut.y);
      ctx.stroke();

      // Septal Neck (calcified funnel collar where siphuncle penetrates)
      ctx.fillStyle = '#D6CFC3';
      ctx.beginPath();
      ctx.arc(ch.siphunclePt.x, ch.siphunclePt.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // C. Render Micro Gas Bubble Entities Inside Chambers
    ctx.save();
    for (let g = 0; g < this.gasParticles.length; g++) {
      const gp = this.gasParticles[g];
      const posX = gp.x + (gp.currentOffsetX || 0);
      const posY = gp.y + (gp.currentOffsetY || 0);
      if (!isFinite(posX) || !isFinite(posY) || !isFinite(gp.radius) || gp.radius <= 0) continue;

      ctx.fillStyle = `rgba(234, 230, 223, ${isFinite(gp.alpha) ? gp.alpha : 0.5})`;
      ctx.beginPath();
      ctx.arc(posX, posY, gp.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // D. Siphuncle Continuous Cord (Active Osmotic Tube)
    ctx.save();
    ctx.beginPath();
    for (let s = 0; s < this.siphunclePath.length; s++) {
      const sp = this.siphunclePath[s];
      if (s === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    }
    ctx.strokeStyle = amberColor;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = amberColor;
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Active transport pulse nodes traveling along the siphuncle
    if (this.siphunclePath.length > 0) {
      const activePulseNodeIndex = Math.floor((this.time * 6 * (this.osmosisRate || 1.2)) % this.siphunclePath.length);
      const activeNode = this.siphunclePath[activePulseNodeIndex];
      if (activeNode && isFinite(activeNode.x) && isFinite(activeNode.y)) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(activeNode.x, activeNode.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // E. Living Chamber: The Nautilus Animal (Mantle, Hood, Eye, Tentacles, Siphon)
    this.renderLivingAnimal(ctx, pearlColor, amberColor);
  }

  renderLivingAnimal(ctx, pearlColor, amberColor) {
    const lastSeptum = this.chambers[this.chambers.length - 1];
    const bodyBaseX = lastSeptum.pIn.x;
    const bodyBaseY = lastSeptum.pIn.y;

    ctx.save();
    // Translate relative to living chamber aperture opening
    const mantleX = bodyBaseX + 68;
    const mantleY = bodyBaseY - 14;

    // 1. Soft Fleshy Mantle & Visceral Mass inside living chamber
    const mantleGrad = ctx.createRadialGradient(mantleX - 20, mantleY, 10, mantleX, mantleY, 65);
    mantleGrad.addColorStop(0, '#E8BA9B'); // Fleshy peach/nacre
    mantleGrad.addColorStop(0.65, '#C67A5A');
    mantleGrad.addColorStop(1, '#662B1A');
    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    ctx.ellipse(mantleX - 10, mantleY + 5, 48, 36, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // 2. Leathery Protective Hood (Opercular Flap)
    ctx.save();
    const hoodGrad = ctx.createLinearGradient(mantleX, mantleY - 35, mantleX + 45, mantleY);
    hoodGrad.addColorStop(0, '#D45B28');
    hoodGrad.addColorStop(0.5, '#A43A14');
    hoodGrad.addColorStop(1, '#501708');
    ctx.fillStyle = hoodGrad;
    ctx.beginPath();
    ctx.moveTo(mantleX + 5, mantleY - 32);
    ctx.bezierCurveTo(mantleX + 42, mantleY - 36, mantleX + 68, mantleY - 12, mantleX + 62, mantleY + 8);
    ctx.bezierCurveTo(mantleX + 45, mantleY + 2, mantleX + 25, mantleY - 10, mantleX + 5, mantleY - 32);
    ctx.closePath();
    ctx.fill();

    // White tuberculated spots on the hood
    ctx.fillStyle = 'rgba(234, 230, 223, 0.75)';
    for (let sp = 0; sp < 7; sp++) {
      const spotX = mantleX + 18 + sp * 5 + (sp % 2) * 4;
      const spotY = mantleY - 22 + (sp % 3) * 6;
      ctx.beginPath();
      ctx.arc(spotX, spotY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Pinhole Camera Obscura Eye
    const eyeX = mantleX + 16;
    const eyeY = mantleY + 2;
    // Eye globe
    ctx.fillStyle = '#EAE6DF';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pinhole pupil (primitive aperture without lens)
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Sensory groove radiating from pinhole
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(eyeX - 5, eyeY);
    ctx.lineTo(eyeX + 5, eyeY);
    ctx.stroke();

    // 4. Undulating Tentacles (Cirri)
    ctx.save();
    ctx.strokeStyle = '#F0D4C2';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    const tentacleCount = 10;
    for (let t = 0; t < tentacleCount; t++) {
      const startX = mantleX + 48 + (t % 3) * 4;
      const startY = mantleY - 4 + t * 3.5;
      const wave = Math.sin(this.time * 2.8 + t * 0.6) * 7;
      const wave2 = Math.cos(this.time * 3.4 + t) * 5;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(
        startX + 18, startY + wave,
        startX + 35, startY + wave2,
        startX + 48 + (t % 4) * 5, startY + wave * 1.4
      );
      ctx.stroke();
    }
    ctx.restore();

    // 5. Hyponome (Muscular Siphon Funnel)
    const siphonX = mantleX + 32;
    const siphonY = mantleY + 38;
    // Pulsing contraction when jet pulse is active
    const contraction = this.specimen.jetPulseActive > 0 ? 0.75 : 1.0;

    ctx.save();
    ctx.fillStyle = '#B44C2B';
    ctx.beginPath();
    ctx.moveTo(siphonX - 18, siphonY - 14);
    ctx.quadraticCurveTo(siphonX - 2, siphonY, siphonX + 16 * contraction, siphonY + 8 * contraction);
    ctx.lineTo(siphonX + 14 * contraction, siphonY + 18 * contraction);
    ctx.quadraticCurveTo(siphonX - 8, siphonY + 12, siphonX - 28, siphonY - 6);
    ctx.closePath();
    ctx.fill();

    // Nozzle opening ring
    ctx.strokeStyle = amberColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(siphonX + 15 * contraction, siphonY + 13 * contraction, 4 * contraction, 7 * contraction, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderHUD(ctx, pearlColor, amberColor) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = this.width / ui;
    const sh = this.height / ui;
    const narrow = sw < 560;

    const pad = 16;
    const boxW = narrow ? Math.min(sw - 32, 230) : 260;
    const boxH = narrow ? 92 : 102;

    ctx.fillStyle = 'rgba(6, 15, 33, 0.82)';
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.45)';
    ctx.lineWidth = 1;
    ctx.fillRect(pad, pad, boxW, boxH);
    ctx.strokeRect(pad, pad, boxW, boxH);

    // Header Title
    ctx.fillStyle = amberColor;
    ctx.font = 'bold 11px monospace';
    ctx.fillText('NAUTILUS POMPILIUS', pad + 10, pad + 18);

    // Current Depth & Pressure
    const depthMargin = 60;
    const depthSpan = Math.max(10, sh - depthMargin * 2);
    const validSpecY = isFinite(this.specimen.y) ? this.specimen.y / ui : sh * 0.45;
    const currentDepthMeters = 20 + Math.max(0, Math.min(1, (validSpecY - depthMargin) / depthSpan)) * 480;
    const pressureAtm = 1.0 + (currentDepthMeters / 10.0);

    ctx.fillStyle = pearlColor;
    ctx.font = narrow ? '9.5px monospace' : '11px monospace';
    const targetD = isFinite(this.depthTarget) ? this.depthTarget : 220;
    ctx.fillText(`DEPTH: ${Math.round(currentDepthMeters)}m / TGT: ${Math.round(targetD)}m`, pad + 10, pad + 36);
    ctx.fillText(`PRESSURE: ${pressureAtm.toFixed(1)} atm`, pad + 10, pad + 50);

    // Archimedean Buoyancy State
    const totalMass = (this.specimen.dryMass || 0.82) + (this.specimen.fluidMass || 0.20);
    const neutralMass = 1.025;
    const netB = neutralMass - totalMass;
    let buoyancyLabel = 'NEUTRAL';
    let buoyancyColor = '#2EC4B6';
    if (netB > 0.015) {
      buoyancyLabel = 'POSITIVE (SURFACING)';
      buoyancyColor = '#48CAE4';
    } else if (netB < -0.015) {
      buoyancyLabel = 'NEGATIVE (DESCENDING)';
      buoyancyColor = amberColor;
    }

    ctx.fillStyle = buoyancyColor;
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`BUOYANCY: ${buoyancyLabel}`, pad + 10, pad + 65);

    // Siphuncle Osmosis Rate & Active Entities
    ctx.fillStyle = 'rgba(234, 230, 223, 0.85)';
    ctx.font = '9px monospace';
    const entities = this.getEntityCount();
    ctx.fillText(`OSMOSIS: ${(this.osmosisRate || 1.2).toFixed(1)}x | ENT: ${entities}`, pad + 10, pad + 80);

    if (!narrow) {
      // Depth Gauge Scale on Right Margin
      const gaugeX = sw - 24;
      const gaugeY1 = depthMargin;
      const gaugeY2 = sh - depthMargin;

      ctx.strokeStyle = 'rgba(234, 230, 223, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gaugeX, gaugeY1);
      ctx.lineTo(gaugeX, gaugeY2);
      ctx.stroke();

      // Target depth marker
      const targetY = gaugeY1 + ((targetD - 20) / 480) * (gaugeY2 - gaugeY1);
      ctx.fillStyle = amberColor;
      ctx.beginPath();
      ctx.moveTo(gaugeX - 8, targetY);
      ctx.lineTo(gaugeX, targetY - 5);
      ctx.lineTo(gaugeX, targetY + 5);
      ctx.closePath();
      ctx.fill();

      // Current specimen depth marker
      const specY = Math.max(gaugeY1, Math.min(gaugeY2, validSpecY));
      ctx.fillStyle = '#48CAE4';
      ctx.beginPath();
      ctx.arc(gaugeX, specY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* 7. CONTRACT METHODS: ENTITY COUNT, RESIZE, RESET, DESTROY                 */
  /* -------------------------------------------------------------------------- */

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  getEntityCount() {
    // Exact spec requirement: Chamber septa segments + gas particles + water jet nodes
    return this.septaSegments.length + this.gasParticles.length + this.waterJetParticles.length;
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    // Reposition specimen if bounds shift drastically
    const curX = isFinite(this.specimen.x) ? this.specimen.x : this.width * 0.48;
    const curY = isFinite(this.specimen.y) ? this.specimen.y : this.height * 0.45;
    this.specimen.x = Math.max(120, Math.min(this.width - 120, curX));
    this.specimen.y = Math.max(80, Math.min(this.height - 80, curY));
  }

  reset() {
    this.time = 0;
    this.depthTarget = 220;
    this.jetThrustForce = 150;
    this.osmosisRate = 1.2;

    this.specimen.x = this.width * 0.48;
    this.specimen.y = this.height * 0.45;
    this.specimen.vx = 0;
    this.specimen.vy = 0;
    this.specimen.pitch = -0.15;
    this.specimen.angularVel = 0;
    this.specimen.jetCooldown = 0;
    this.specimen.jetPulseActive = 0;
    this.specimen.isDragging = false;

    this.buildShellGeometry();
    this.initParticles();

    // Update UI controls if present
    if (this.controlsContainer && typeof document !== 'undefined') {
      const sliderDepth = this.controlsContainer.querySelector('#slider-depth');
      const valDepth = this.controlsContainer.querySelector('#val-depth');
      if (sliderDepth) sliderDepth.value = this.depthTarget;
      if (valDepth) valDepth.textContent = `${Math.round(this.depthTarget)} m`;

      const sliderThrust = this.controlsContainer.querySelector('#slider-thrust');
      const valThrust = this.controlsContainer.querySelector('#val-thrust');
      if (sliderThrust) sliderThrust.value = this.jetThrustForce;
      if (valThrust) valThrust.textContent = `${Math.round(this.jetThrustForce)} N`;

      const sliderOsmosis = this.controlsContainer.querySelector('#slider-osmosis');
      const valOsmosis = this.controlsContainer.querySelector('#val-osmosis');
      if (sliderOsmosis) sliderOsmosis.value = this.osmosisRate;
      if (valOsmosis) valOsmosis.textContent = `${this.osmosisRate.toFixed(1)}x`;
    }
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 8. INTERACTION HANDLERS (MOUSE & KEYBOARD)                                */
  /* -------------------------------------------------------------------------- */

  onMouseDown(pos) {
    if (!pos || !isFinite(pos.x) || !isFinite(pos.y)) return;
    const specX = isFinite(this.specimen.x) ? this.specimen.x : this.width * 0.48;
    const specY = isFinite(this.specimen.y) ? this.specimen.y : this.height * 0.45;
    const dx = pos.x - specX;
    const dy = pos.y - specY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If clicked on specimen, begin drag
    if (dist < 140) {
      this.specimen.isDragging = true;
      this.specimen.dragOffsetX = dx;
      this.specimen.dragOffsetY = dy;
      this.specimen.vx = 0;
      this.specimen.vy = 0;
    } else {
      // Click in ocean column: sets depth target to clicked level
      const depthMargin = 60;
      const depthSpan = Math.max(10, this.height - depthMargin * 2);
      const clickedDepth = 20 + Math.max(0, Math.min(1, (pos.y - depthMargin) / depthSpan)) * 480;
      this.depthTarget = Math.round(clickedDepth);

      if (this.controlsContainer && typeof document !== 'undefined') {
        const sliderDepth = this.controlsContainer.querySelector('#slider-depth');
        const valDepth = this.controlsContainer.querySelector('#val-depth');
        if (sliderDepth) sliderDepth.value = this.depthTarget;
        if (valDepth) valDepth.textContent = `${Math.round(this.depthTarget)} m`;
      }
    }
  }

  onMouseMove(pos) {
    if (!pos || !isFinite(pos.x) || !isFinite(pos.y)) return;
    if (this.specimen.isDragging) {
      const prevX = isFinite(this.specimen.x) ? this.specimen.x : pos.x;
      const prevY = isFinite(this.specimen.y) ? this.specimen.y : pos.y;
      this.specimen.x = pos.x - (this.specimen.dragOffsetX || 0);
      this.specimen.y = pos.y - (this.specimen.dragOffsetY || 0);
      // Calculate drag throw velocity with clamp
      const maxThrow = 600;
      this.specimen.vx = Math.max(-maxThrow, Math.min(maxThrow, (this.specimen.x - prevX) * 15));
      this.specimen.vy = Math.max(-maxThrow, Math.min(maxThrow, (this.specimen.y - prevY) * 15));
    }
  }

  onMouseUp() {
    this.specimen.isDragging = false;
  }

  onKeyDown(key, e) {
    if (!key) return;
    if (key === ' ' || key === 'Space') {
      if (e && e.preventDefault) e.preventDefault();
      this.triggerSiphonJet();
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      // Surface / ascend
      this.depthTarget = Math.max(20, (this.depthTarget || 220) - 25);
      this.updateDepthSliderUI();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      // Dive / descend
      this.depthTarget = Math.min(500, (this.depthTarget || 220) + 25);
      this.updateDepthSliderUI();
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.specimen.angularVel = Math.max(-10, (this.specimen.angularVel || 0) - 0.6);
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.specimen.angularVel = Math.min(10, (this.specimen.angularVel || 0) + 0.6);
    }
  }

  onKeyUp() {}

  updateDepthSliderUI() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const sliderDepth = this.controlsContainer.querySelector('#slider-depth');
    const valDepth = this.controlsContainer.querySelector('#val-depth');
    if (sliderDepth) sliderDepth.value = this.depthTarget;
    if (valDepth) valDepth.textContent = `${Math.round(this.depthTarget)} m`;
  }
}
