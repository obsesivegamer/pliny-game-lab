// Bestiarium: Artificial Life, Flocking & Predator-Prey Ecological Simulation
// Grounded in Pliny's Naturalis Historia (Books VIII-XI: Zoology & Ancient Beasts)

export class BestiariumEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas.width || 1200;
    this.height = canvas.height || 800;

    // Simulation entities
    this.creatures = [];
    this.food = [];
    this.particles = [];

    // Parameters
    this.spawnMode = 'herbivore'; // 'herbivore', 'predator', 'food', 'griffin'
    this.separationWeight = 1.6;
    this.alignmentWeight = 1.0;
    this.cohesionWeight = 1.1;
    this.predatorSpeed = 160;
    this.herbivoreSpeed = 130;
    this.reproductionRate = 1.0;
    this.foodSpawnTimer = 0;

    // Population history graph buffer
    this.historyTimer = 0;
    this.popHistory = [];

    this.initControls();
    this.seedEcosystem();
  }

  initControls() {
    if (!this.controlsContainer) return;

    this.controlsContainer.innerHTML = `
      <div class="control-group">
        <label>Spawn Tool</label>
        <div class="control-btn-grid" id="bestia-selector">
          <button class="sub-btn active" data-mode="herbivore">🦌 Cervus (Prey)</button>
          <button class="sub-btn" data-mode="predator">🦁 Leo (Predator)</button>
          <button class="sub-btn" data-mode="griffin">🦅 Griffin (Apex)</button>
          <button class="sub-btn" data-mode="food">🌿 Manna (Food)</button>
        </div>
      </div>

      <div class="control-group">
        <label>Herd Cohesion: <span id="cohesion-val">${this.cohesionWeight}</span></label>
        <input type="range" id="cohesion-slider" min="0.2" max="3.0" step="0.1" value="${this.cohesionWeight}">
      </div>

      <div class="control-group">
        <label>Flock Separation: <span id="separation-val">${this.separationWeight}</span></label>
        <input type="range" id="separation-slider" min="0.5" max="4.0" step="0.1" value="${this.separationWeight}">
      </div>

      <div class="control-group">
        <label>Reproduction Rate</label>
        <input type="range" id="repro-slider" min="0.2" max="2.5" step="0.1" value="${this.reproductionRate}">
      </div>

      <div class="control-group">
        <button id="mass-bloom-btn" class="sub-btn" style="background: rgba(45,214,198,0.2); border-color: var(--accent-cyan); font-weight: bold; padding: 8px;">
          🌾 Scatter Abundant Flora
        </button>
      </div>
    `;

    // Bind controls
    this.controlsContainer.querySelectorAll('#bestia-selector .sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controlsContainer.querySelectorAll('#bestia-selector .sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.spawnMode = btn.dataset.mode;
      });
    });

    const cohesionSlider = this.controlsContainer.querySelector('#cohesion-slider');
    const cohesionVal = this.controlsContainer.querySelector('#cohesion-val');
    cohesionSlider.addEventListener('input', (e) => {
      this.cohesionWeight = parseFloat(e.target.value);
      cohesionVal.textContent = this.cohesionWeight.toFixed(1);
    });

    const sepSlider = this.controlsContainer.querySelector('#separation-slider');
    const sepVal = this.controlsContainer.querySelector('#separation-val');
    sepSlider.addEventListener('input', (e) => {
      this.separationWeight = parseFloat(e.target.value);
      sepVal.textContent = this.separationWeight.toFixed(1);
    });

    const reproSlider = this.controlsContainer.querySelector('#repro-slider');
    reproSlider.addEventListener('input', (e) => {
      this.reproductionRate = parseFloat(e.target.value);
    });

    const bloomBtn = this.controlsContainer.querySelector('#mass-bloom-btn');
    bloomBtn.addEventListener('click', () => {
      for (let i = 0; i < 60; i++) {
        this.spawnFood(Math.random() * this.width, Math.random() * this.height);
      }
    });
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  seedEcosystem() {
    this.creatures = [];
    this.food = [];
    this.particles = [];
    this.popHistory = [];

    // Seed 70 herbivores
    for (let i = 0; i < 70; i++) {
      this.spawnCreature('herbivore', Math.random() * this.width, Math.random() * this.height);
    }

    // Seed 8 predators
    for (let i = 0; i < 8; i++) {
      this.spawnCreature('predator', Math.random() * this.width, Math.random() * this.height);
    }

    // Seed 1 Griffin
    this.spawnCreature('griffin', this.width * 0.5, this.height * 0.5);

    // Seed 100 food plants
    for (let i = 0; i < 100; i++) {
      this.spawnFood(Math.random() * this.width, Math.random() * this.height);
    }
  }

  spawnCreature(type, x, y, dna = null) {
    const defaultDna = {
      speed: type === 'griffin' ? 180 : (type === 'predator' ? this.predatorSpeed : this.herbivoreSpeed),
      perceptionRadius: type === 'griffin' ? 240 : (type === 'predator' ? 160 : 100),
      size: type === 'griffin' ? 16 : (type === 'predator' ? 9 : 6),
      mutationRate: 0.1
    };

    const finalDna = dna ? { ...defaultDna, ...dna } : defaultDna;

    this.creatures.push({
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      heading: Math.random() * Math.PI * 2,
      energy: type === 'griffin' ? 300 : (type === 'predator' ? 180 : 100),
      maxEnergy: type === 'griffin' ? 400 : (type === 'predator' ? 240 : 150),
      age: 0,
      dna: finalDna,
      wingCycle: Math.random() * Math.PI * 2
    });
  }

  spawnFood(x, y) {
    this.food.push({
      x,
      y,
      nutrition: 30 + Math.random() * 20,
      size: 3 + Math.random() * 2,
      pulse: Math.random() * Math.PI
    });
  }

  onMouseDown(pos) {
    if (this.spawnMode === 'food') {
      for (let i = 0; i < 5; i++) {
        this.spawnFood(pos.x + (Math.random() - 0.5) * 40, pos.y + (Math.random() - 0.5) * 40);
      }
    } else {
      this.spawnCreature(this.spawnMode, pos.x, pos.y);
    }
  }

  update(dt) {
    // Dynamic food replenishment
    this.foodSpawnTimer += dt;
    if (this.foodSpawnTimer > 0.4 && this.food.length < 150) {
      this.spawnFood(Math.random() * this.width, Math.random() * this.height);
      this.foodSpawnTimer = 0;
    }

    // Creature logic
    const survivors = [];
    const newBirths = [];

    for (const c of this.creatures) {
      c.age += dt;
      c.wingCycle += dt * 8;

      // Energy consumption
      const speedMag = Math.hypot(c.vx, c.vy);
      c.energy -= (1.5 + (speedMag / c.dna.speed) * 3) * dt;

      // Starvation death
      if (c.energy <= 0) {
        // Spawn death puff particles
        for (let p = 0; p < 4; p++) {
          this.particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 0.6,
            maxLife: 0.6,
            color: c.type === 'predator' ? 'rgba(200,50,50,0.8)' : 'rgba(212,185,110,0.8)'
          });
        }
        continue;
      }

      // Steering forces
      const force = { x: 0, y: 0 };

      if (c.type === 'herbivore') {
        this.applyHerbivoreBehaviors(c, force);
      } else if (c.type === 'predator') {
        this.applyPredatorBehaviors(c, force);
      } else if (c.type === 'griffin') {
        this.applyGriffinBehaviors(c, force);
      }

      // Screen boundary softness
      this.applyBoundaryForce(c, force);

      // Integration
      c.vx += force.x * dt;
      c.vy += force.y * dt;

      // Cap speed
      const curSpeed = Math.hypot(c.vx, c.vy);
      if (curSpeed > c.dna.speed) {
        c.vx = (c.vx / curSpeed) * c.dna.speed;
        c.vy = (c.vy / curSpeed) * c.dna.speed;
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;

      if (curSpeed > 1) {
        c.heading = Math.atan2(c.vy, c.vx);
      }

      // Reproduction check
      if (c.energy > c.maxEnergy * 0.85 && this.creatures.length < 250) {
        c.energy *= 0.5;
        // Mutate offspring slightly
        const mutatedDna = {
          speed: Math.max(80, c.dna.speed + (Math.random() - 0.5) * 10),
          perceptionRadius: Math.max(60, c.dna.perceptionRadius + (Math.random() - 0.5) * 15),
          size: c.dna.size
        };
        newBirths.push({ type: c.type, x: c.x, y: c.y, dna: mutatedDna });
      }

      survivors.push(c);
    }

    this.creatures = survivors.concat(newBirths);

    // Update decay particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Population history sampling
    this.historyTimer += dt;
    if (this.historyTimer >= 1.0) {
      this.historyTimer = 0;
      const herbivores = this.creatures.filter(c => c.type === 'herbivore').length;
      const predators = this.creatures.filter(c => c.type === 'predator' || c.type === 'griffin').length;
      this.popHistory.push({ herbivores, predators, food: this.food.length });
      if (this.popHistory.length > 80) this.popHistory.shift();
    }
  }

  applyHerbivoreBehaviors(c, force) {
    let sepX = 0, sepY = 0, sepCount = 0;
    let alignX = 0, alignY = 0, alignCount = 0;
    let cohX = 0, cohY = 0, cohCount = 0;
    let fleeX = 0, fleeY = 0;

    for (const other of this.creatures) {
      if (other === c) continue;
      const dx = other.x - c.x;
      const dy = other.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (other.type === 'predator' || other.type === 'griffin') {
        // Flee from danger
        if (dist < c.dna.perceptionRadius * (other.type === 'griffin' ? 1.6 : 1.0) && dist > 0) {
          const urgency = 1.0 - (dist / c.dna.perceptionRadius);
          fleeX -= (dx / dist) * urgency * 450;
          fleeY -= (dy / dist) * urgency * 450;
        }
      } else if (other.type === 'herbivore' && dist < c.dna.perceptionRadius) {
        // Flock cohesion and alignment
        alignX += other.vx;
        alignY += other.vy;
        alignCount++;

        cohX += other.x;
        cohY += other.y;
        cohCount++;

        if (dist < c.dna.size * 3.5 && dist > 0) {
          sepX -= (dx / dist) * (1.0 - dist / (c.dna.size * 3.5)) * 300;
          sepY -= (dy / dist) * (1.0 - dist / (c.dna.size * 3.5)) * 300;
          sepCount++;
        }
      }
    }

    if (fleeX !== 0 || fleeY !== 0) {
      // Survival takes precedence over flocking
      force.x += fleeX * 1.5;
      force.y += fleeY * 1.5;
    } else {
      if (sepCount > 0) {
        force.x += (sepX / sepCount) * this.separationWeight;
        force.y += (sepY / sepCount) * this.separationWeight;
      }
      if (alignCount > 0) {
        force.x += ((alignX / alignCount) - c.vx) * this.alignmentWeight;
        force.y += ((alignY / alignCount) - c.vy) * this.alignmentWeight;
      }
      if (cohCount > 0) {
        const targetX = cohX / cohCount;
        const targetY = cohY / cohCount;
        force.x += (targetX - c.x) * this.cohesionWeight * 0.4;
        force.y += (targetY - c.y) * this.cohesionWeight * 0.4;
      }

      // Forage for nearest food
      let nearestFood = null;
      let nearestDist = Infinity;
      for (let i = 0; i < this.food.length; i++) {
        const f = this.food[i];
        const dist = Math.hypot(f.x - c.x, f.y - c.y);
        if (dist < nearestDist && dist < c.dna.perceptionRadius) {
          nearestDist = dist;
          nearestFood = { food: f, index: i };
        }
      }

      if (nearestFood) {
        const f = nearestFood.food;
        const fx = f.x - c.x;
        const fy = f.y - c.y;
        if (nearestDist < c.dna.size + f.size) {
          // Eat food
          c.energy = Math.min(c.maxEnergy, c.energy + f.nutrition);
          this.food.splice(nearestFood.index, 1);
        } else {
          force.x += (fx / nearestDist) * 120;
          force.y += (fy / nearestDist) * 120;
        }
      }
    }
  }

  applyPredatorBehaviors(c, force) {
    let nearestPrey = null;
    let nearestDist = Infinity;

    for (let i = 0; i < this.creatures.length; i++) {
      const other = this.creatures[i];
      if (other.type === 'herbivore') {
        const dist = Math.hypot(other.x - c.x, other.y - c.y);
        if (dist < nearestDist && dist < c.dna.perceptionRadius) {
          nearestDist = dist;
          nearestPrey = other;
        }
      }
    }

    if (nearestPrey) {
      const dx = nearestPrey.x - c.x;
      const dy = nearestPrey.y - c.y;
      if (nearestDist < c.dna.size + nearestPrey.dna.size) {
        // Attack & consume
        c.energy = Math.min(c.maxEnergy, c.energy + 80);
        nearestPrey.energy = -1; // Mark dead
      } else {
        force.x += (dx / nearestDist) * 200;
        force.y += (dy / nearestDist) * 200;
      }
    } else {
      // Wander randomly
      force.x += Math.cos(c.heading + (Math.random() - 0.5)) * 50;
      force.y += Math.sin(c.heading + (Math.random() - 0.5)) * 50;
    }
  }

  applyGriffinBehaviors(c, force) {
    // Griffin patrols the skies, diving on any clump of prey or predators
    let target = null;
    let minDist = Infinity;

    for (const other of this.creatures) {
      if (other === c) continue;
      const dist = Math.hypot(other.x - c.x, other.y - c.y);
      if (dist < minDist && dist < c.dna.perceptionRadius) {
        minDist = dist;
        target = other;
      }
    }

    if (target) {
      const dx = target.x - c.x;
      const dy = target.y - c.y;
      if (minDist < c.dna.size + target.dna.size) {
        c.energy = Math.min(c.maxEnergy, c.energy + 100);
        target.energy = -1;
      } else {
        force.x += (dx / minDist) * 240;
        force.y += (dy / minDist) * 240;
      }
    } else {
      // Majestic sweeping circles
      c.heading += 0.02;
      force.x += Math.cos(c.heading) * 100;
      force.y += Math.sin(c.heading) * 100;
    }
  }

  applyBoundaryForce(c, force) {
    const margin = 50;
    const power = 300;
    if (c.x < margin) force.x += power * ((margin - c.x) / margin);
    if (c.x > this.width - margin) force.x -= power * ((c.x - (this.width - margin)) / margin);
    if (c.y < margin) force.y += power * ((margin - c.y) / margin);
    if (c.y > this.height - margin) force.y -= power * ((c.y - (this.height - margin)) / margin);
  }

  render(ctx) {
    // Clear canvas
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render food
    ctx.fillStyle = '#3bd6c6';
    for (const f of this.food) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render creatures
    for (const c of this.creatures) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.heading);

      if (c.type === 'herbivore') {
        // Roman Stag / Gazelle (Golden-tan boid)
        ctx.fillStyle = '#d4b96e';
        ctx.beginPath();
        ctx.moveTo(c.dna.size * 1.5, 0);
        ctx.lineTo(-c.dna.size, c.dna.size * 0.7);
        ctx.lineTo(-c.dna.size * 0.5, 0);
        ctx.lineTo(-c.dna.size, -c.dna.size * 0.7);
        ctx.closePath();
        ctx.fill();
      } else if (c.type === 'predator') {
        // Nemean Lion / Wolf (Crimson predator)
        ctx.fillStyle = '#e04040';
        ctx.beginPath();
        ctx.moveTo(c.dna.size * 1.8, 0);
        ctx.lineTo(-c.dna.size, c.dna.size * 0.8);
        ctx.lineTo(-c.dna.size * 0.6, 0);
        ctx.lineTo(-c.dna.size, -c.dna.size * 0.8);
        ctx.closePath();
        ctx.fill();

        // Perception aura
        ctx.strokeStyle = 'rgba(224, 64, 64, 0.08)';
        ctx.beginPath();
        ctx.arc(0, 0, c.dna.perceptionRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (c.type === 'griffin') {
        // Plinian Griffin (Winged Mythic Apex)
        const wingSpan = Math.sin(c.wingCycle) * 12;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(c.dna.size * 2, 0);
        ctx.lineTo(-c.dna.size, c.dna.size * 1.2 + wingSpan);
        ctx.lineTo(-c.dna.size * 0.5, 0);
        ctx.lineTo(-c.dna.size, -c.dna.size * 1.2 - wingSpan);
        ctx.closePath();
        ctx.fill();

        // Glowing crown
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, c.dna.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Render Population Telemetry Graph Overlay
    this.renderPopulationGraph(ctx);
  }

  renderPopulationGraph(ctx) {
    if (this.popHistory.length < 2) return;

    const gw = 180;
    const gh = 70;
    const gx = 20;
    const gy = this.height - gh - 20;

    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8c909e';
    ctx.fillText('ECOSYSTEM TELEMETRY', gx + 6, gy + 12);

    const step = gw / (this.popHistory.length - 1);

    // Draw herbivore line (gold)
    ctx.strokeStyle = '#d4b96e';
    ctx.beginPath();
    for (let i = 0; i < this.popHistory.length; i++) {
      const val = this.popHistory[i].herbivores;
      const y = gy + gh - (val / 180) * (gh - 18) - 4;
      if (i === 0) ctx.moveTo(gx, y);
      else ctx.lineTo(gx + i * step, y);
    }
    ctx.stroke();

    // Draw predator line (crimson)
    ctx.strokeStyle = '#e04040';
    ctx.beginPath();
    for (let i = 0; i < this.popHistory.length; i++) {
      const val = this.popHistory[i].predators;
      const y = gy + gh - (val / 40) * (gh - 18) - 4;
      if (i === 0) ctx.moveTo(gx, y);
      else ctx.lineTo(gx + i * step, y);
    }
    ctx.stroke();
  }

  getEntityCount() {
    return this.creatures.length + this.food.length;
  }

  reset() {
    this.seedEcosystem();
  }

  destroy() {
    this.creatures = [];
    this.food = [];
  }
}
