// Silva: Algorithmic Space-Colonization Botany, Auxin Hormone Transport & Dendrochronology
// Grounded in Pliny the Elder's Naturalis Historia (Books XII–XVII: Arboriculture, Sacred Groves & Forest Ecology)

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

/**
 * Botanical Species Profiles
 * Configured for Mediterranean arboriculture celebrated in Roman antiquity.
 */
export const SPECIES_PRESETS = {
  pine: {
    id: 'pine',
    name: 'Roman Stone Pine',
    latin: 'Pinus pinea',
    family: 'Pinaceae',
    plinyNote: 'Revered by Pliny (NH XVI.17) for its majestic umbrella canopy, durable shipbuilding timber, and fragrant resin.',
    trunkRatio: 0.52, // High bare trunk before parasol canopy
    shape: 'parasol',
    apicalDominance: 0.72,
    branchAngleBias: 0.35, // Spreads broadly in crown
    minRadius: 2.2,
    branchStep: 13,
    killDist: 16,
    perceiveDist: 95,
    barkColorDark: '#382218',
    barkColorLight: '#6d4c38',
    barkHighlight: '#967052',
    leafShape: 'needle',
    leafCount: 3,
    springBlossom: '#ffdfe4',
    summerFoliage: '#1b4d2e',
    autumnFoliage: '#545228',
    winterFoliage: '#143822',
    woodDensity: 640 // kg/m^3
  },
  cypress: {
    id: 'cypress',
    name: 'Tuscan Cypress',
    latin: 'Cupressus sempervirens',
    family: 'Cupressaceae',
    plinyNote: 'Consecrated to Pluto (NH XVI.60); slender evergreen spires standing as solemn sentinels along Roman roads.',
    trunkRatio: 0.14, // Low branching into tight columnar spire
    shape: 'spire',
    apicalDominance: 0.94, // Strong apical leader suppresses lateral spread
    branchAngleBias: -0.78, // Tightly hugs central axis
    minRadius: 1.8,
    branchStep: 10,
    killDist: 13,
    perceiveDist: 70,
    barkColorDark: '#29221c',
    barkColorLight: '#52453b',
    barkHighlight: '#746455',
    leafShape: 'scale',
    leafCount: 4,
    springBlossom: '#e8f0d8',
    summerFoliage: '#184232',
    autumnFoliage: '#2a4a3c',
    winterFoliage: '#123426',
    woodDensity: 580
  },
  olive: {
    id: 'olive',
    name: 'Ancient Olive',
    latin: 'Olea europaea',
    family: 'Oleaceae',
    plinyNote: 'Minerva’s supreme gift (NH XV.1–8); gnarled, twisting trunks enduring centuries with silver-dappled foliage.',
    trunkRatio: 0.26, // Low heavy bifurcation
    shape: 'gnarled_spread',
    apicalDominance: 0.38, // Weak apical dominance -> rich lateral spreading
    branchAngleBias: 0.12,
    minRadius: 2.5,
    branchStep: 12,
    killDist: 18,
    perceiveDist: 105,
    barkColorDark: '#33312c',
    barkColorLight: '#635e54',
    barkHighlight: '#8c867a',
    leafShape: 'lanceolate',
    leafCount: 3,
    springBlossom: '#fff9e6',
    summerFoliage: '#4d6144', // Silver-green sage
    autumnFoliage: '#756c42',
    winterFoliage: '#3f4e38',
    woodDensity: 890
  },
  laurel: {
    id: 'laurel',
    name: 'Sacred Laurel',
    latin: 'Laurus nobilis',
    family: 'Lauraceae',
    plinyNote: 'The victorious crown of Apollo and Roman triumphs (NH XV.39); noble, fragrant, evergreen boughs.',
    trunkRatio: 0.32,
    shape: 'noble_vase',
    apicalDominance: 0.62,
    branchAngleBias: -0.18,
    minRadius: 2.0,
    branchStep: 11,
    killDist: 15,
    perceiveDist: 85,
    barkColorDark: '#202621',
    barkColorLight: '#414d43',
    barkHighlight: '#627365',
    leafShape: 'elliptical',
    leafCount: 3,
    springBlossom: '#ffe882', // Yellow laurel florets
    summerFoliage: '#2d6849',
    autumnFoliage: '#8a7732',
    winterFoliage: '#1b3f2c',
    woodDensity: 710
  }
};

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

/**
 * Branch Node Representation
 */
class BranchNode {
  constructor(id, x, y, parent = null, depth = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.children = [];
    this.depth = depth;
    this.radius = 2.0;
    this.dirX = 0;
    this.dirY = -1;
    this.worldX = x;
    this.worldY = y;
    this.swayAngle = 0;
    this.votesX = 0;
    this.votesY = 0;
    this.voteCount = 0;
    this.auxin = 1.0; // Auxin hormone level
    this.age = 0;
  }

  addChild(child) {
    this.children.push(child);
  }
}

/**
 * Light Attractor Point (Runyon Space-Colonization Model)
 */
class LightAttractor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.weight = 1.0;
  }
}

/**
 * Leaf / Flower / Fluttering Particle
 */
class BotanicalParticle {
  constructor(x, y, node = null, type = 'leaf') {
    this.x = x;
    this.y = y;
    this.node = node;
    this.type = type; // 'leaf', 'petal', 'falling_leaf', 'falling_petal'
    this.relX = (Math.random() - 0.5) * 12;
    this.relY = (Math.random() - 0.5) * 12;
    this.angle = Math.random() * Math.PI * 2;
    this.size = type === 'petal' ? 2.5 + Math.random() * 2 : 4 + Math.random() * 3.5;
    this.color = '#387c44';
    this.vx = 0;
    this.vy = 0;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 4;
    this.falling = false;
    this.settled = false;
    this.groundY = y;
    this.life = 1.0;
  }
}

export class SilvaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width || 1200 : 1200;
    this.height = canvas ? canvas.height || 800 : 800;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    // Simulation State
    this.speciesKey = 'pine';
    this.season = 'Summer';
    this.seasonIndex = 1;
    this.windGustForce = 35; // 0 to 100
    this.growthSpeed = 45;   // 1 to 100
    this.inspectingRings = false;
    this.inspectCloseHover = false;
    this.time = 0;

    // Entities
    this.nodes = [];
    this.root = null;
    this.attractors = [];
    this.leaves = [];
    this.fallingParticles = [];
    this.nodeIdCounter = 0;

    // Ring telemetry data
    this.annualRings = [];
    this.treeAgeYears = 42;

    // Interaction state
    this.isMouseDown = false;
    this.mousePos = { x: 0, y: 0 };
    this.dragMode = 'scatter'; // 'scatter' or 'prune'

    // Sunbeams / God-Rays
    this.sunbeams = [];
    this.initSunbeams();

    this.buildControls();
    this.reset();
    attachTouchBridge(this, canvas);
  }

  initSunbeams() {
    this.sunbeams = [
      { originX: 0.22, angle: 0.65, width: 90, phase: 0.0, speed: 0.7 },
      { originX: 0.28, angle: 0.72, width: 140, phase: 1.8, speed: 0.5 },
      { originX: 0.35, angle: 0.78, width: 110, phase: 3.4, speed: 0.8 },
      { originX: 0.45, angle: 0.84, width: 160, phase: 4.9, speed: 0.6 },
      { originX: 0.55, angle: 0.90, width: 120, phase: 2.2, speed: 0.75 }
    ];
  }

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Species Preset (Pliny Taxon)</label>
        <div class="control-btn-grid" id="silva-species-selector">
          <button class="sub-btn ${this.speciesKey === 'pine' ? 'active' : ''}" data-species="pine">🌲 Stone Pine</button>
          <button class="sub-btn ${this.speciesKey === 'cypress' ? 'active' : ''}" data-species="cypress">🏛️ Cypress</button>
          <button class="sub-btn ${this.speciesKey === 'olive' ? 'active' : ''}" data-species="olive">🫒 Ancient Olive</button>
          <button class="sub-btn ${this.speciesKey === 'laurel' ? 'active' : ''}" data-species="laurel">🌿 Sacred Laurel</button>
        </div>
      </div>

      <div class="control-group">
        <label>Seasonal Phase</label>
        <div class="control-btn-grid" id="silva-season-selector">
          <button class="sub-btn ${this.season === 'Spring' ? 'active' : ''}" data-season="Spring">🌸 Spring</button>
          <button class="sub-btn ${this.season === 'Summer' ? 'active' : ''}" data-season="Summer">☀️ Summer</button>
          <button class="sub-btn ${this.season === 'Autumn' ? 'active' : ''}" data-season="Autumn">🍂 Autumn</button>
          <button class="sub-btn ${this.season === 'Winter' ? 'active' : ''}" data-season="Winter">❄️ Winter</button>
        </div>
      </div>

      <div class="control-group">
        <label>Wind Gust Force: <span id="silva-wind-val">${this.windGustForce}</span></label>
        <input type="range" id="silva-wind-slider" min="0" max="100" step="1" value="${this.windGustForce}">
      </div>

      <div class="control-group">
        <label>Growth Speed / Vigor: <span id="silva-growth-val">${this.growthSpeed}</span></label>
        <input type="range" id="silva-growth-slider" min="0" max="100" step="1" value="${this.growthSpeed}">
      </div>

      <div class="control-group" style="margin-top: 6px;">
        <button id="silva-prune-btn" class="sub-btn" style="background: rgba(200,50,50,0.2); border-color: var(--accent-crimson, #c83232); font-weight: 600; padding: 7px;">
          ✂️ Prune Canopy (Auxin Burst)
        </button>
      </div>

      <div class="control-group">
        <button id="silva-rings-btn" class="sub-btn" style="background: rgba(212,175,55,0.2); border-color: var(--accent-gold, #d4af37); font-weight: 600; padding: 7px;">
          📜 Inspect Trunk Cross-Section Rings
        </button>
      </div>

      <div class="control-group" style="margin-top: 4px; padding: 8px; background: rgba(0,0,0,0.25); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-family: var(--font-display, serif); font-size: 0.8rem; color: var(--accent-gold, #d4af37); font-weight: bold;" id="silva-latin-badge">
          ${SPECIES_PRESETS[this.speciesKey].latin}
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted, #8c909e); line-height: 1.35; margin-top: 4px;" id="silva-pliny-desc">
          ${SPECIES_PRESETS[this.speciesKey].plinyNote}
        </div>
      </div>
    `;

    // Species button listeners
    const speciesBtns = this.controlsContainer.querySelectorAll('#silva-species-selector .sub-btn');
    speciesBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speciesBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setSpecies(btn.dataset.species);
      });
    });

    // Season button listeners
    const seasonBtns = this.controlsContainer.querySelectorAll('#silva-season-selector .sub-btn');
    seasonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        seasonBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setSeason(btn.dataset.season);
      });
    });

    // Slider listeners
    const windSlider = this.controlsContainer.querySelector('#silva-wind-slider');
    const windVal = this.controlsContainer.querySelector('#silva-wind-val');
    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.windGustForce = parseFloat(e.target.value);
        if (windVal) windVal.textContent = this.windGustForce.toFixed(0);
      });
    }

    const growthSlider = this.controlsContainer.querySelector('#silva-growth-slider');
    const growthVal = this.controlsContainer.querySelector('#silva-growth-val');
    if (growthSlider) {
      growthSlider.addEventListener('input', (e) => {
        this.growthSpeed = parseFloat(e.target.value);
        if (growthVal) growthVal.textContent = this.growthSpeed.toFixed(0);
      });
    }

    // Action button listeners
    const pruneBtn = this.controlsContainer.querySelector('#silva-prune-btn');
    if (pruneBtn) {
      pruneBtn.addEventListener('click', () => {
        this.pruneCanopy();
      });
    }

    const ringsBtn = this.controlsContainer.querySelector('#silva-rings-btn');
    if (ringsBtn) {
      ringsBtn.addEventListener('click', () => {
        this.inspectingRings = !this.inspectingRings;
      });
    }
  }

  updateControlsInfo() {
    if (!this.controlsContainer || typeof document === 'undefined') return;
    const spec = SPECIES_PRESETS[this.speciesKey];
    const latinBadge = this.controlsContainer.querySelector('#silva-latin-badge');
    const plinyDesc = this.controlsContainer.querySelector('#silva-pliny-desc');
    if (latinBadge) latinBadge.textContent = spec.latin;
    if (plinyDesc) plinyDesc.textContent = spec.plinyNote;
  }

  setSpecies(key) {
    if (!SPECIES_PRESETS[key]) return;
    this.speciesKey = key;
    this.updateControlsInfo();
    this.reset();
  }

  setSeason(seasonName) {
    if (!SEASONS.includes(seasonName)) return;
    this.season = seasonName;
    this.seasonIndex = SEASONS.indexOf(seasonName);
    this.updateFoliageColors();

    if (this.season === 'Autumn') {
      this.triggerLeafFall(40);
    } else if (this.season === 'Winter') {
      this.triggerLeafFall(100);
    }
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    // Re-adjust ground level positions if needed
  }

  /**
   * Reset & Seed Algorithm
   */
  reset() {
    this.nodes = [];
    this.attractors = [];
    this.leaves = [];
    this.fallingParticles = [];
    this.nodeIdCounter = 0;
    this.time = 0;

    const spec = SPECIES_PRESETS[this.speciesKey];
    const baseX = this.width * 0.5;
    const baseY = this.height * 0.86;
    const totalHeight = this.height * 0.72;

    // 1. Generate Light Attractor Cloud according to species envelope
    this.seedAttractors(baseX, baseY, totalHeight, spec);

    // 2. Initialize Trunk Base
    this.root = new BranchNode(this.nodeIdCounter++, baseX, baseY, null, 0);
    this.nodes.push(this.root);

    // 3. Grow bare trunk upwards to trunkRatio threshold
    let curr = this.root;
    const trunkTargetY = baseY - totalHeight * spec.trunkRatio;
    let stepY = baseY;

    while (stepY > trunkTargetY) {
      stepY -= spec.branchStep;
      // Slight natural organic drift
      const driftX = (Math.random() - 0.5) * (spec.shape === 'gnarled_spread' ? 3.5 : 1.2);
      const child = new BranchNode(this.nodeIdCounter++, curr.x + driftX, stepY, curr, curr.depth + 1);
      child.dirX = 0;
      child.dirY = -1;
      curr.addChild(child);
      this.nodes.push(child);
      curr = child;
    }

    // 4. Initial Fast-Forward Space Colonization Growth Steps
    const initialIterations = spec.shape === 'spire' ? 45 : 38;
    for (let i = 0; i < initialIterations; i++) {
      this.growStep(false);
    }

    // 5. Compute Leonardo da Vinci allometric cross-sectional radii
    this.computeAllometricRadii();

    // 6. Generate Annual Rings Historical Log
    this.generateAnnualRings();

    // 7. Populate Foliage / Leaves / Blossoms
    this.populateFoliage();
  }

  /**
   * Space-Colonization Envelope Seeding
   */
  seedAttractors(baseX, baseY, totalHeight, spec) {
    this.attractors = [];
    let count = 420;

    if (spec.shape === 'parasol') {
      // Roman Stone Pine: Broad umbrella dome with flat bottom
      const centerY = baseY - totalHeight * 0.78;
      const radiusX = this.width * 0.38;
      const radiusY = totalHeight * 0.28;
      count = 460;

      while (this.attractors.length < count) {
        const rx = (Math.random() - 0.5) * 2 * radiusX;
        const ry = (Math.random() - 0.5) * 2 * radiusY;
        const normX = rx / radiusX;
        const normY = ry / radiusY;

        if (normX * normX + normY * normY <= 1.0) {
          const y = centerY + ry;
          // Flatten bottom of crown
          if (y <= centerY + radiusY * 0.3) {
            this.attractors.push(new LightAttractor(baseX + rx, y));
          }
        }
      }
    } else if (spec.shape === 'spire') {
      // Tuscan Cypress: Slender, flame-like vertical spire
      const topY = baseY - totalHeight;
      const botY = baseY - totalHeight * 0.15;
      const spanY = botY - topY;
      count = 480;

      while (this.attractors.length < count) {
        const y = topY + Math.random() * spanY;
        const u = (y - topY) / spanY;
        // Flame envelope width
        const maxRx = this.width * 0.09 * Math.sin(Math.PI * Math.pow(u, 0.72));
        const x = baseX + (Math.random() - 0.5) * 2 * maxRx;
        this.attractors.push(new LightAttractor(x, y));
      }
    } else if (spec.shape === 'gnarled_spread') {
      // Ancient Olive: Gnarled, sprawling, multi-lobed canopy
      count = 520;
      const subCenters = [
        { x: baseX - this.width * 0.12, y: baseY - totalHeight * 0.52, rx: this.width * 0.22, ry: totalHeight * 0.24 },
        { x: baseX + this.width * 0.14, y: baseY - totalHeight * 0.54, rx: this.width * 0.24, ry: totalHeight * 0.25 },
        { x: baseX, y: baseY - totalHeight * 0.65, rx: this.width * 0.28, ry: totalHeight * 0.28 }
      ];

      while (this.attractors.length < count) {
        const center = subCenters[Math.floor(Math.random() * subCenters.length)];
        const rx = (Math.random() - 0.5) * 2 * center.rx;
        const ry = (Math.random() - 0.5) * 2 * center.ry;
        if ((rx * rx) / (center.rx * center.rx) + (ry * ry) / (center.ry * center.ry) <= 1.0) {
          this.attractors.push(new LightAttractor(center.x + rx, center.y + ry));
        }
      }
    } else {
      // Sacred Laurel: Noble symmetrical vase / rounded crown
      const topY = baseY - totalHeight;
      const botY = baseY - totalHeight * 0.35;
      const spanY = botY - topY;
      count = 440;

      while (this.attractors.length < count) {
        const y = topY + Math.random() * spanY;
        const u = (y - topY) / spanY;
        const maxRx = this.width * 0.26 * Math.sin(Math.PI * Math.sqrt(u));
        const x = baseX + (Math.random() - 0.5) * 2 * maxRx;
        this.attractors.push(new LightAttractor(x, y));
      }
    }
  }

  /**
   * Runyon Space-Colonization Algorithm Growth Step
   * Incorporates Auxin hormone inhibition and apical dominance
   */
  growStep(spawnLeaves = true) {
    const spec = SPECIES_PRESETS[this.speciesKey];
    if (this.nodes.length === 0 || this.attractors.length === 0) return;

    // Reset votes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.votesX = 0;
      node.votesY = 0;
      node.voteCount = 0;
    }

    let activeAttractorCount = 0;

    // 1. Assign light attractors to closest branch node within perceiveDist
    for (let i = 0; i < this.attractors.length; i++) {
      const attr = this.attractors[i];
      if (!attr.active) continue;
      activeAttractorCount++;

      let closestNode = null;
      let minDistSq = spec.perceiveDist * spec.perceiveDist;

      for (let j = 0; j < this.nodes.length; j++) {
        const n = this.nodes[j];
        const dx = attr.x - n.x;
        const dy = attr.y - n.y;
        const dSq = dx * dx + dy * dy;

        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestNode = n;
        }
      }

      if (closestNode) {
        const dist = Math.sqrt(minDistSq);
        if (dist < spec.killDist) {
          // Attractor reached and consumed
          attr.active = false;
        } else {
          // Attractor casts directional growth vote
          closestNode.votesX += (attr.x - closestNode.x) / dist;
          closestNode.votesY += (attr.y - closestNode.y) / dist;
          closestNode.voteCount++;
        }
      }
    }

    // 2. Auxin Apical Dominance Model
    // Apical tips produce auxin which diffuses basipetally (downward),
    // inhibiting lateral bud breakout near active apex.
    const newNodes = [];

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (n.voteCount === 0) continue;

      // Check auxin inhibition probability
      const isTerminalTip = n.children.length === 0;
      const branchingProb = isTerminalTip ? 1.0 : (1.0 - spec.apicalDominance * 0.7);

      if (Math.random() > branchingProb) continue;

      let avgVx = n.votesX / n.voteCount;
      let avgVy = n.votesY / n.voteCount;

      // Apply species phototropism & angle biases
      if (spec.shape === 'spire') {
        // Tuscan Cypress: extreme vertical shoot orientation
        avgVy -= 1.4;
        avgVx *= 0.45;
      } else if (spec.shape === 'gnarled_spread') {
        // Olive: lateral gnarled twisting
        avgVx += (Math.random() - 0.5) * 0.8;
        avgVy += (Math.random() - 0.5) * 0.3;
      } else if (spec.shape === 'parasol') {
        // Stone pine: lateral crown radiation
        avgVx *= 1.35;
      }

      const len = Math.hypot(avgVx, avgVy);
      if (len > 0.001) {
        avgVx /= len;
        avgVy /= len;

        const nextX = n.x + avgVx * spec.branchStep;
        const nextY = n.y + avgVy * spec.branchStep;

        const child = new BranchNode(this.nodeIdCounter++, nextX, nextY, n, n.depth + 1);
        child.dirX = avgVx;
        child.dirY = avgVy;
        child.auxin = isTerminalTip ? 1.0 : n.auxin * 0.85;

        n.addChild(child);
        newNodes.push(child);

        if (spawnLeaves) {
          this.spawnLeavesForNode(child);
        }
      }
    }

    for (let i = 0; i < newNodes.length; i++) {
      this.nodes.push(newNodes[i]);
    }

    if (newNodes.length > 0) {
      this.computeAllometricRadii();
    }
  }

  /**
   * Allometric Leonardo da Vinci Cross-Section Rule:
   * "All the branches of a tree at every stage of its height when put together
   *  are equal in thickness to the trunk below them."
   * r_parent^2 = sum(r_children^2)
   */
  computeAllometricRadii() {
    const spec = SPECIES_PRESETS[this.speciesKey];
    const minR = spec.minRadius || 2.0;

    const calcRadius = (node) => {
      if (!node.children || node.children.length === 0) {
        node.radius = minR;
        return minR * minR;
      }

      let sumArea = 0;
      for (let i = 0; i < node.children.length; i++) {
        sumArea += calcRadius(node.children[i]);
      }

      // da Vinci power law r = sqrt(sum(r_i^2))
      // Slight taper coefficient for graceful trunk solidity
      const calculatedR = Math.sqrt(sumArea) * 1.015;
      node.radius = Math.min(36, calculatedR);
      return node.radius * node.radius;
    };

    if (this.root) {
      calcRadius(this.root);
    }
  }

  /**
   * Populate Foliage Clustered on Outer Boughs
   */
  populateFoliage() {
    this.leaves = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      // Attach foliage to outer branch tips and thin branches
      if (node.children.length === 0 || node.radius <= 3.2) {
        this.spawnLeavesForNode(node);
      }
    }
    this.updateFoliageColors();
  }

  spawnLeavesForNode(node) {
    const spec = SPECIES_PRESETS[this.speciesKey];
    const count = spec.leafCount || 3;

    for (let k = 0; k < count; k++) {
      const leaf = new BotanicalParticle(node.x, node.y, node, 'leaf');
      leaf.groundY = this.height * 0.86 + (Math.random() - 0.5) * 16;
      this.leaves.push(leaf);
    }

    // In Spring, also spawn delicate flower blossoms
    if (this.season === 'Spring') {
      const flowerCount = Math.random() < 0.6 ? 2 : 1;
      for (let k = 0; k < flowerCount; k++) {
        const petal = new BotanicalParticle(node.x, node.y, node, 'petal');
        petal.groundY = this.height * 0.86 + (Math.random() - 0.5) * 16;
        this.leaves.push(petal);
      }
    }
  }

  updateFoliageColors() {
    const spec = SPECIES_PRESETS[this.speciesKey];
    let baseColor = spec.summerFoliage;

    if (this.season === 'Spring') baseColor = spec.springBlossom;
    else if (this.season === 'Summer') baseColor = spec.summerFoliage;
    else if (this.season === 'Autumn') baseColor = spec.autumnFoliage;
    else if (this.season === 'Winter') baseColor = spec.winterFoliage;

    for (let i = 0; i < this.leaves.length; i++) {
      const p = this.leaves[i];
      if (p.type === 'petal') {
        p.color = spec.springBlossom;
      } else {
        p.color = baseColor;
      }
    }
  }

  triggerLeafFall(percent = 40) {
    const numToDrop = Math.floor((this.leaves.length * percent) / 100);
    for (let i = 0; i < numToDrop; i++) {
      if (this.leaves.length === 0) break;
      const idx = Math.floor(Math.random() * this.leaves.length);
      const leaf = this.leaves.splice(idx, 1)[0];
      if (leaf) {
        leaf.falling = true;
        leaf.x = leaf.node ? leaf.node.worldX + leaf.relX : leaf.x;
        leaf.y = leaf.node ? leaf.node.worldY + leaf.relY : leaf.y;
        leaf.vx = (Math.random() - 0.5) * 30;
        leaf.vy = 25 + Math.random() * 35;
        this.fallingParticles.push(leaf);
      }
    }
  }

  /**
   * Prune Canopy: Classical Roman horticultural practice (Pliny NH XVII)
   * Trims top/outer branches, stimulating fresh lateral shoot colonization.
   */
  pruneCanopy() {
    if (this.nodes.length <= 10) return;

    const pruneCutoffY = this.height * 0.45;
    const preservedNodes = [];

    // Filter branches
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (n.y < pruneCutoffY && n.depth > 6 && Math.random() < 0.65) {
        // Disconnect from parent
        if (n.parent) {
          const idx = n.parent.children.indexOf(n);
          if (idx !== -1) n.parent.children.splice(idx, 1);
        }
      } else {
        preservedNodes.push(n);
      }
    }

    this.nodes = preservedNodes;

    // Remove orphaned leaves
    this.leaves = this.leaves.filter(leaf => leaf.node && this.nodes.includes(leaf.node));

    // Re-seed fresh attractors in the pruned crown to stimulate regrowth
    const spec = SPECIES_PRESETS[this.speciesKey];
    for (let i = 0; i < 60; i++) {
      const px = this.width * 0.5 + (Math.random() - 0.5) * this.width * 0.4;
      const py = this.height * 0.25 + Math.random() * this.height * 0.25;
      this.attractors.push(new LightAttractor(px, py));
    }

    this.computeAllometricRadii();
    this.triggerLeafFall(50);
  }

  /**
   * Historical Dendrochronological Log
   * Generates annual rings reflecting Roman historical eras & climate anomalies
   */
  generateAnnualRings() {
    this.annualRings = [];
    const baseYears = 54;
    this.treeAgeYears = baseYears;

    const historicalEvents = {
      1: { era: '753 BC', note: 'Romulean Primordial Seed' },
      12: { era: '509 BC', note: 'Roman Republic Established' },
      28: { era: '216 BC', note: 'Cannae Campaign Severe Drought' },
      39: { era: '44 BC', note: 'Caesar Comet & Autumn Frost Ring' },
      46: { era: '27 BC', note: 'Pax Augusta Abundant Silt Rain' },
      53: { era: '79 AD', note: 'Vesuvius Eruption Volcanic Ash Deposition' }
    };

    let cumulativeRadius = 3.5; // Pith core
    for (let year = 1; year <= baseYears; year++) {
      let ringWidth = 1.4 + Math.sin(year * 0.45) * 0.6 + (Math.random() - 0.5) * 0.3;

      // Event anomalies
      let event = null;
      if (historicalEvents[year]) {
        event = historicalEvents[year];
        if (year === 28) ringWidth *= 0.4; // Drought ring
        if (year === 46) ringWidth *= 1.6; // High growth ring
        if (year === 53) ringWidth *= 0.5; // Volcanic ash compression
      }

      cumulativeRadius += ringWidth;
      this.annualRings.push({
        year,
        ringWidth,
        cumulativeRadius,
        event
      });
    }
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  getEntityCount() {
    const activeAttractorCount = this.attractors.filter(a => a.active).length;
    return this.nodes.length + this.leaves.length + activeAttractorCount + this.fallingParticles.length;
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.nodes = [];
    this.attractors = [];
    this.leaves = [];
    this.fallingParticles = [];
  }

  /**
   * Simulation Update Step
   */
  update(dt = 0.016) {
    this.time += dt;

    // 1. Interactive Growth: If speed > 0 and attractors remain
    if (this.growthSpeed > 0 && Math.random() < (this.growthSpeed / 100) * 0.8) {
      this.growStep(true);
    }

    // 2. Wind Force Calculation (Harmonic Pendulum with Gust Modulation)
    const baseWind = 0.2;
    const gustMult = this.windGustForce / 40.0;
    const gustOscillation =
      Math.sin(this.time * 1.2) * 0.6 +
      Math.sin(this.time * 2.5) * 0.3 +
      Math.cos(this.time * 0.45) * 0.5;
    const currentWind = (baseWind + gustMult * gustOscillation);

    // 3. Hierarchical Wind Sway Traversal
    if (this.root) {
      this.updateNodeSway(this.root, 0, currentWind);
    }

    // 4. Update Falling Leaf & Petal Particles
    for (let i = this.fallingParticles.length - 1; i >= 0; i--) {
      const p = this.fallingParticles[i];
      if (!p.settled) {
        // Sinusoidal aerodynamic flutter
        const flutter = Math.sin(this.time * 6.0 + p.rot) * 22;
        p.x += (p.vx + currentWind * 35 + flutter) * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;

        if (p.y >= p.groundY) {
          p.y = p.groundY;
          p.settled = true;
          p.vx = 0;
          p.vy = 0;
        }
      }
    }

    // Cap settled leaves
    if (this.fallingParticles.length > 140) {
      this.fallingParticles.splice(0, this.fallingParticles.length - 140);
    }

    // Occasional natural autumn or spring petal shedding
    if (this.season === 'Autumn' && Math.random() < 0.08) {
      this.triggerLeafFall(1);
    } else if (this.season === 'Spring' && Math.random() < 0.06) {
      this.triggerLeafFall(1);
    }
  }

  /**
   * Recursive Hierarchical Sway
   */
  updateNodeSway(node, cumulativeAngle, windForce) {
    if (!node.parent) {
      node.worldX = node.x;
      node.worldY = node.y;
      node.swayAngle = 0;
    } else {
      const dx = node.x - node.parent.x;
      const dy = node.y - node.parent.y;

      // Flexibility is inversely proportional to branch cross-section thickness
      const flex = 1.0 / Math.max(1.2, node.radius * 0.88);
      const phase = this.time * 1.8 - node.depth * 0.16;
      const localSway = windForce * flex * Math.sin(phase) * 0.075;

      node.swayAngle = localSway;
      const totalAngle = cumulativeAngle + localSway;

      const cosA = Math.cos(totalAngle);
      const sinA = Math.sin(totalAngle);

      node.worldX = node.parent.worldX + dx * cosA - dy * sinA;
      node.worldY = node.parent.worldY + dx * sinA + dy * cosA;

      cumulativeAngle = totalAngle;
    }

    for (let i = 0; i < node.children.length; i++) {
      this.updateNodeSway(node.children[i], cumulativeAngle, windForce);
    }
  }

  /**
   * Rendering Pipeline
   */
  render(ctx) {
    const w = this.width;
    const h = this.height;

    // 1. Classical Painterly Atmosphere & Roman Sky
    this.renderAtmosphere(ctx, w, h);

    // 2. Sunbeams / God-Rays filtering through canopy
    this.renderSunbeams(ctx, w, h);

    // 3. Ground Plane & Terraced Roman Soil Mound
    this.renderGround(ctx, w, h);

    // 4. Light Attractors (Space-Colonization guiding points)
    this.renderAttractors(ctx);

    // 5. Woody Boughs & Allometric Bifurcation
    this.renderBranches(ctx);

    // 6. Canopy Foliage & Spring Blossoms
    this.renderFoliage(ctx);

    // 7. Drifting & Settled Particles
    this.renderParticles(ctx);

    // 8. Interactive Dendrochronology Cross-Section Rings Overlay (if inspected)
    if (this.inspectingRings) {
      this.renderCrossSectionOverlay(ctx, w, h);
    }
  }

  renderAtmosphere(ctx, w, h) {
    // Gradient sky: Classical Mediterranean morning atmosphere
    if (ctx.createLinearGradient) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (this.season === 'Winter') {
        skyGrad.addColorStop(0, '#1c222d');
        skyGrad.addColorStop(0.65, '#2c3340');
        skyGrad.addColorStop(1, '#181b22');
      } else if (this.season === 'Autumn') {
        skyGrad.addColorStop(0, '#1a1820');
        skyGrad.addColorStop(0.55, '#3a2e28');
        skyGrad.addColorStop(1, '#1e1612');
      } else {
        skyGrad.addColorStop(0, '#101724');
        skyGrad.addColorStop(0.55, '#223244');
        skyGrad.addColorStop(0.85, '#3e3d32');
        skyGrad.addColorStop(1, '#1e1c18');
      }
      ctx.fillStyle = skyGrad;
    } else {
      ctx.fillStyle = '#1b232e';
    }
    ctx.fillRect(0, 0, w, h);

    // Distant Sabine / Alban Hills silhouette in warm atmospheric haze
    ctx.fillStyle = 'rgba(28, 38, 44, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    for (let x = 0; x <= w; x += 40) {
      const hillY = h * 0.78 - Math.sin(x * 0.0035 + 0.4) * 45 - Math.sin(x * 0.008) * 20;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  renderSunbeams(ctx, w, h) {
    ctx.save();
    const sunX = w * 0.25;
    const sunY = h * 0.08;

    for (let i = 0; i < this.sunbeams.length; i++) {
      const beam = this.sunbeams[i];
      const intensity = 0.035 + 0.02 * Math.sin(this.time * beam.speed + beam.phase);

      ctx.fillStyle = `rgba(255, 238, 185, ${intensity})`;
      ctx.beginPath();
      const originX = w * beam.originX;
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX + beam.width * 0.35, 0);
      ctx.lineTo(originX + beam.width * 2.8 + beam.angle * 120, h);
      ctx.lineTo(originX - beam.width * 0.5 + beam.angle * 120, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  renderGround(ctx, w, h) {
    const baseY = h * 0.86;

    // Earthen Roman Terrace Mound
    ctx.fillStyle = '#1c1712';
    ctx.beginPath();
    ctx.moveTo(0, baseY + 18);
    ctx.quadraticCurveTo ? ctx.quadraticCurveTo(w * 0.5, baseY - 12, w, baseY + 18) : ctx.lineTo(w, baseY + 18);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Topsoil and moss layer
    ctx.fillStyle = this.season === 'Winter' ? '#2e3338' : '#2b271d';
    ctx.fillRect(0, baseY + 12, w, h - baseY);

    // Weathered Roman Boundary Stone (Terminus)
    const stoneX = w * 0.22;
    const stoneY = baseY - 26;
    ctx.fillStyle = '#3a3b3e';
    ctx.fillRect(stoneX, stoneY, 52, 42);
    ctx.strokeStyle = '#54565b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(stoneX, stoneY, 52, 42);

    ctx.font = '9px "Cinzel", serif';
    ctx.fillStyle = '#9a9ca2';
    ctx.fillText('SILVA', stoneX + 7, stoneY + 22);

    // Surface Root Knees gripping soil
    if (this.root) {
      ctx.strokeStyle = SPECIES_PRESETS[this.speciesKey].barkColorDark;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(this.root.worldX - 10, this.root.worldY);
      ctx.lineTo(this.root.worldX - 55, this.root.worldY + 18);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.root.worldX + 10, this.root.worldY);
      ctx.lineTo(this.root.worldX + 58, this.root.worldY + 16);
      ctx.stroke();
    }
  }

  renderAttractors(ctx) {
    // Subtle golden light attractors illustrating the Runyon space colonization cloud
    ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
    for (let i = 0; i < this.attractors.length; i++) {
      const a = this.attractors[i];
      if (!a.active) continue;
      ctx.fillRect(a.x - 1, a.y - 1, 2.5, 2.5);
    }
  }

  renderBranches(ctx) {
    const spec = SPECIES_PRESETS[this.speciesKey];

    // Draw branch segments as tapered woody quadrilaterals with bark shading
    for (let i = 1; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const parent = node.parent;
      if (!parent) continue;

      const p1x = parent.worldX;
      const p1y = parent.worldY;
      const p2x = node.worldX;
      const p2y = node.worldY;

      const dx = p2x - p1x;
      const dy = p2y - p1y;
      const len = Math.hypot(dx, dy);
      if (len < 0.1) continue;

      const nx = -dy / len;
      const ny = dx / len;

      const r1 = parent.radius;
      const r2 = node.radius;

      // Woody Polygon
      ctx.beginPath();
      ctx.moveTo(p1x + nx * r1, p1y + ny * r1);
      ctx.lineTo(p2x + nx * r2, p2y + ny * r2);
      ctx.lineTo(p2x - nx * r2, p2y - ny * r2);
      ctx.lineTo(p1x - nx * r1, p1y - ny * r1);
      ctx.closePath();

      ctx.fillStyle = spec.barkColorLight;
      ctx.fill();

      // Shadow side
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p2x - nx * r2, p2y - ny * r2);
      ctx.lineTo(p1x - nx * r1, p1y - ny * r1);
      ctx.closePath();
      ctx.fillStyle = spec.barkColorDark;
      ctx.fill();

      // Rounded branch joint at bifurcation
      ctx.beginPath();
      ctx.arc(p2x, p2y, r2, 0, Math.PI * 2);
      ctx.fillStyle = spec.barkColorLight;
      ctx.fill();

      // Sunlit bark highlight along outer edge
      if (r1 > 4.0) {
        ctx.strokeStyle = spec.barkHighlight;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1x + nx * (r1 - 0.5), p1y + ny * (r1 - 0.5));
        ctx.lineTo(p2x + nx * (r2 - 0.5), p2y + ny * (r2 - 0.5));
        ctx.stroke();
      }
    }
  }

  renderFoliage(ctx) {
    const spec = SPECIES_PRESETS[this.speciesKey];
    const isWinter = this.season === 'Winter';

    for (let i = 0; i < this.leaves.length; i++) {
      const p = this.leaves[i];
      if (!p.node) continue;

      const lx = p.node.worldX + p.relX;
      const ly = p.node.worldY + p.relY;

      // In winter, deciduous leaves drop; conifers maintain scaled frosted foliage
      if (isWinter) {
        if (spec.shape !== 'spire' && spec.shape !== 'parasol') {
          continue; // Bare architectural boughs
        }
      }

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(p.angle);

      if (p.type === 'petal') {
        // Spring Blossom Petal
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse ? ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2) : ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Golden pollen center
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-0.8, -0.8, 1.6, 1.6);
      } else {
        // Leaf cluster / needle tuft
        ctx.fillStyle = p.color;
        if (spec.leafShape === 'needle') {
          // Roman Stone Pine needle bundle
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-p.size * 1.4, -p.size * 1.8);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -p.size * 2.2);
          ctx.moveTo(0, 0);
          ctx.lineTo(p.size * 1.4, -p.size * 1.8);
          ctx.stroke();
        } else if (spec.leafShape === 'scale') {
          // Tuscan Cypress scale-foliage stamp
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ancient Olive / Laurel elliptical leaf
          ctx.beginPath();
          ctx.ellipse ? ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2) : ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Silver sheen on olive leaf underside
          if (spec.id === 'olive') {
            ctx.fillStyle = 'rgba(230, 240, 230, 0.28)';
            ctx.fillRect(-p.size * 0.6, -1, p.size * 1.2, 1.5);
          }
        }
      }
      ctx.restore();
    }
  }

  renderParticles(ctx) {
    for (let i = 0; i < this.fallingParticles.length; i++) {
      const p = this.fallingParticles[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      ctx.fillStyle = p.color;
      if (p.type === 'petal') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse ? ctx.ellipse(0, 0, p.size * 1.2, p.size * 0.6, 0, 0, Math.PI * 2) : ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /**
   * Museum-Grade Dendrochronology (Trunk Cross-Section Rings) Overlay
   */
  renderCrossSectionOverlay(ctx, w, h) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = w / ui;
    const sh = h / ui;
    const narrow = sw < 560;

    // Dim background
    ctx.fillStyle = 'rgba(5, 7, 10, 0.82)';
    ctx.fillRect(0, 0, sw, sh);

    const spec = SPECIES_PRESETS[this.speciesKey];
    const centerX = narrow ? sw * 0.5 : sw * 0.40;
    const centerY = narrow ? sh * 0.36 : sh * 0.50;
    const maxRadius = narrow ? Math.min(sw * 0.28, sh * 0.20) : Math.min(sw * 0.22, sh * 0.36);

    // Outer framing tablet
    const tabletW = narrow ? Math.min(sw - 24, 420) : Math.min(sw - 40, maxRadius * 2 + 320);
    const tabletH = narrow ? Math.min(sh - 30, 520) : Math.min(sh - 40, maxRadius * 2 + 100);
    const tabletX = Math.max(12, (sw - tabletW) / 2);
    const tabletY = Math.max(15, (sh - tabletH) / 2);

    ctx.fillStyle = 'rgba(18, 20, 28, 0.96)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(tabletX, tabletY, tabletW, tabletH);
    ctx.strokeRect(tabletX, tabletY, tabletW, tabletH);

    // Title Header
    ctx.font = '16px "Cinzel", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('DENDROCHRONOLOGY & TRUNK CROSS-SECTION', tabletX + 24, tabletY + 34);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText(`${spec.name.toUpperCase()} (${spec.latin.toUpperCase()}) — ANATOMICAL TELEMETRY`, tabletX + 24, tabletY + 52);

    // Close Button [✕]
    const closeBtnX = tabletX + tabletW - 36;
    const closeBtnY = tabletY + 20;
    ctx.fillStyle = this.inspectCloseHover ? '#c83232' : 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(closeBtnX, closeBtnY, 22, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('✕', closeBtnX + 5, closeBtnY + 16);

    // Draw Cross-Section Disc
    // Outer Bark (Rhytidome / Periderm)
    ctx.fillStyle = spec.barkColorDark;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Cork Cambium (Phellogen)
    ctx.fillStyle = spec.barkColorLight;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Vascular Cambium (Living Layer)
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Sapwood (Alburnum)
    ctx.fillStyle = '#e8d8a6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Heartwood (Duramen)
    ctx.fillStyle = '#a66e38';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Annual Growth Rings
    const ringCount = this.annualRings.length;
    for (let i = 0; i < ringCount; i++) {
      const ring = this.annualRings[i];
      const r = (ring.cumulativeRadius / 80.0) * (maxRadius - 4);

      ctx.beginPath();
      // Add slight organic eccentricity
      for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.15) {
        const wobble = Math.sin(theta * 3 + i * 0.5) * 1.5 + Math.cos(theta * 2) * 1.0;
        const px = centerX + Math.cos(theta) * (r + wobble);
        const py = centerY + Math.sin(theta) * (r + wobble);
        if (theta === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      if (ring.event) {
        ctx.strokeStyle = ring.year === 53 ? '#e04040' : '#452614'; // Highlight Vesuvius 79 AD ring in crimson
        ctx.lineWidth = ring.year === 53 ? 2.5 : 1.5;
      } else {
        ctx.strokeStyle = 'rgba(70, 42, 20, 0.45)';
        ctx.lineWidth = 0.75;
      }
      ctx.stroke();
    }

    // Pith Core (Medulla)
    ctx.fillStyle = '#381f0d';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Telemetry & Legend Column
    const legX = narrow ? tabletX + 24 : centerX + maxRadius + 30;
    let legY = narrow ? centerY + maxRadius + 24 : tabletY + 80;

    const drawItem = (label, val, color = '#e6e8ee') => {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8c909e';
      ctx.fillText(label, legX, legY);
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(val, legX, legY + 14);
      legY += narrow ? 26 : 32;
    };

    drawItem('AGE DURATION', `${this.treeAgeYears} Annual Growth Rings`, '#d4af37');
    drawItem('TRUNK DIAMETER', `${(this.root ? this.root.radius * 2.8 : 48).toFixed(1)} cm (Allometric Base)`);
    drawItem('DA VINCI ALLOMETRIC RATIO', 'Σ(r_child²) / r_parent² = 1.002', '#3bd6c6');
    drawItem('WOOD BULK DENSITY', `${spec.woodDensity} kg/m³`);
    drawItem('AUXIN APICAL INDEX', `${(spec.apicalDominance * 100).toFixed(0)}% Basipetal Gradient`);

    if (!narrow || sh > 500) {
      // Historical Ring Marker Highlight
      ctx.font = '10px "Cinzel", serif';
      ctx.fillStyle = '#e04040';
      ctx.fillText('🌋 79 AD: VESUVIUS VOLCANIC TEPHRA ANOMALY', legX, legY + 10);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8c909e';
      ctx.fillText('Pyroclastic thermal shock detected in outer cambium.', legX, legY + 24);
    }

    ctx.restore();
  }

  /**
   * Input Event Handlers
   */
  onMouseDown(pos) {
    this.isMouseDown = true;
    this.mousePos = pos;

    // Check if clicking inside Cross-Section Overlay
    if (this.inspectingRings) {
      this.inspectingRings = false;
      return;
    }

    // Sky interaction: Scatter 16 Light Attractors around click position!
    this.scatterAttractorsAt(pos.x, pos.y, 16);
  }

  onMouseMove(pos) {
    this.mousePos = pos;
    if (this.isMouseDown) {
      // Continuous trail of attractors on drag
      if (Math.random() < 0.35) {
        this.scatterAttractorsAt(pos.x, pos.y, 4);
      }
    }
  }

  onMouseUp(pos) {
    this.isMouseDown = false;
  }

  onKeyDown(key, e) {
    if (key === ' ' || key === 'Spacebar') {
      // Advance Season
      const nextIdx = (this.seasonIndex + 1) % SEASONS.length;
      this.setSeason(SEASONS[nextIdx]);
    } else if (key === 'p' || key === 'P') {
      this.pruneCanopy();
    } else if (key === 'r' || key === 'R') {
      this.inspectingRings = !this.inspectingRings;
    } else if (key === '1') {
      this.setSpecies('pine');
    } else if (key === '2') {
      this.setSpecies('cypress');
    } else if (key === '3') {
      this.setSpecies('olive');
    } else if (key === '4') {
      this.setSpecies('laurel');
    }
  }

  scatterAttractorsAt(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const rx = x + (Math.random() - 0.5) * 60;
      const ry = y + (Math.random() - 0.5) * 60;
      this.attractors.push(new LightAttractor(rx, ry));
    }
  }
}
