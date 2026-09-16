// Pliny Game Lab — Circus Maximus Chariot Grand Prix Engine
// Top-down / isometric Roman chariot racing with centrifugal drift & faction AI

export class ChariotEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    this.speedMult = 1.0;
    this.driftTraction = 0.85;
    this.whipBoost = 0;

    this.trackRadiusX = 300;
    this.trackRadiusY = 160;
    this.spinaWidth = 240;

    this.factions = [
      { name: "Prasina (Green)", color: "#27ae60", horseColor: "#ffffff", lap: 0, s: 0, d: -25, speed: 220, angle: 0 },
      { name: "Veneta (Blue)", color: "#2980b9", horseColor: "#d35400", lap: 0, s: 0.25, d: -10, speed: 215, angle: 0 },
      { name: "Russata (Red)", color: "#c0392b", horseColor: "#2c3e50", lap: 0, s: 0.5, d: 10, speed: 210, angle: 0 },
      { name: "Albata (White)", color: "#bdc3c7", horseColor: "#7f8c8d", lap: 0, s: 0.75, d: 25, speed: 205, angle: 0 }
    ];

    this.playerFaction = 0;
    this.dustParticles = [];
    this.skidMarks = [];
    this.spectatorCount = 120;
    this.spectators = [];

    this.initSpectators();
    this.setupUI();
  }

  initSpectators() {
    this.spectators = [];
    for (let i = 0; i < this.spectatorCount; i++) {
      this.spectators.push({
        x: Math.random(),
        y: Math.random(),
        color: ["#c0392b", "#2980b9", "#27ae60", "#f1c40f", "#bdc3c7"][Math.floor(Math.random() * 5)],
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  setupUI() {
    if (!this.controlsContainer || typeof document === "undefined") return;
    this.controlsContainer.innerHTML = "";

    const group1 = document.createElement("div");
    group1.className = "control-group";
    const label1 = document.createElement("label");
    label1.textContent = "Chariot Speed";
    const slider1 = document.createElement("input");
    slider1.type = "range";
    slider1.min = "0.5";
    slider1.max = "2.5";
    slider1.step = "0.1";
    slider1.value = this.speedMult;
    slider1.addEventListener("input", (e) => this.speedMult = parseFloat(e.target.value));
    group1.appendChild(label1);
    group1.appendChild(slider1);
    this.controlsContainer.appendChild(group1);

    const group2 = document.createElement("div");
    group2.className = "control-group";
    const label2 = document.createElement("label");
    label2.textContent = "Drift Traction";
    const slider2 = document.createElement("input");
    slider2.type = "range";
    slider2.min = "0.4";
    slider2.max = "0.98";
    slider2.step = "0.02";
    slider2.value = this.driftTraction;
    slider2.addEventListener("input", (e) => this.driftTraction = parseFloat(e.target.value));
    group2.appendChild(label2);
    group2.appendChild(slider2);
    this.controlsContainer.appendChild(group2);

    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = "Whip Horses!";
    btn.addEventListener("click", () => this.whip());
    this.controlsContainer.appendChild(btn);
  }

  whip() {
    this.whipBoost = 150;
  }

  resize(w, h, dpr) {
    this.width = w;
    this.height = h;
    this.dpr = dpr || 1;
    this.trackRadiusX = Math.min(w * 0.4, 380);
    this.trackRadiusY = Math.min(h * 0.3, 200);
    this.spinaWidth = this.trackRadiusX * 0.65;
  }

  getTrackPos(s, d) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const perimeter = 2 * (2 * this.spinaWidth) + 2 * Math.PI * this.trackRadiusY;
    const dist = ((s % 1) + 1) % 1 * perimeter;

    const straightLen = 2 * this.spinaWidth;
    const turnLen = Math.PI * this.trackRadiusY;

    let x = 0, y = 0, angle = 0;

    if (dist < straightLen) {
      const progress = dist / straightLen;
      x = cx - this.spinaWidth + progress * straightLen;
      y = cy + this.trackRadiusY + d;
      angle = 0;
    } else if (dist < straightLen + turnLen) {
      const progress = (dist - straightLen) / turnLen;
      const th = progress * Math.PI - Math.PI / 2;
      x = cx + this.spinaWidth + Math.cos(th) * (this.trackRadiusY + d);
      y = cy + Math.sin(th) * (this.trackRadiusY + d);
      angle = th + Math.PI / 2;
    } else if (dist < straightLen * 2 + turnLen) {
      const progress = (dist - (straightLen + turnLen)) / straightLen;
      x = cx + this.spinaWidth - progress * straightLen;
      y = cy - this.trackRadiusY - d;
      angle = Math.PI;
    } else {
      const progress = (dist - (straightLen * 2 + turnLen)) / turnLen;
      const th = progress * Math.PI + Math.PI / 2;
      x = cx - this.spinaWidth + Math.cos(th) * (this.trackRadiusY + d);
      y = cy + Math.sin(th) * (this.trackRadiusY + d);
      angle = th + Math.PI / 2;
    }

    return { x, y, angle };
  }

  update(dt) {
    if (this.whipBoost > 0) {
      this.whipBoost = Math.max(0, this.whipBoost - dt * 80);
    }

    const perimeter = 2 * (4 * this.spinaWidth) + 2 * Math.PI * this.trackRadiusY;

    this.factions.forEach((f, idx) => {
      let currentSpeed = f.speed * this.speedMult;
      if (idx === this.playerFaction) {
        currentSpeed += this.whipBoost;
      }

      f.s += (currentSpeed / perimeter) * dt;
      if (f.s >= 1) {
        f.s -= 1;
        f.lap++;
      }

      const target = this.getTrackPos(f.s, f.d);
      f.x = target.x;
      f.y = target.y;
      f.angle = target.angle;

      if (Math.random() < 0.35) {
        this.dustParticles.push({
          x: f.x - Math.cos(f.angle) * 15 + (Math.random() - 0.5) * 8,
          y: f.y - Math.sin(f.angle) * 15 + (Math.random() - 0.5) * 8,
          vx: -Math.cos(f.angle) * 30 + (Math.random() - 0.5) * 20,
          vy: -Math.sin(f.angle) * 30 + (Math.random() - 0.5) * 20,
          radius: 2 + Math.random() * 4,
          alpha: 0.6,
          life: 0.8
        });
      }
    });

    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.8 * 0.6);
      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    const cx = this.width / 2;
    const cy = this.height / 2;

    ctx.fillStyle = "#120e0a";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "#c89d66";
    ctx.beginPath();
    ctx.ellipse(cx - this.spinaWidth, cy, this.trackRadiusY + 60, this.trackRadiusY + 60, 0, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(cx + this.spinaWidth, cy - (this.trackRadiusY + 60));
    ctx.ellipse(cx + this.spinaWidth, cy, this.trackRadiusY + 60, this.trackRadiusY + 60, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - this.spinaWidth, cy + this.trackRadiusY + 60);
    ctx.fill();

    ctx.fillStyle = "#8d6e47";
    ctx.beginPath();
    ctx.ellipse(cx - this.spinaWidth, cy, this.trackRadiusY - 50, this.trackRadiusY - 50, 0, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(cx + this.spinaWidth, cy - (this.trackRadiusY - 50));
    ctx.ellipse(cx + this.spinaWidth, cy, this.trackRadiusY - 50, this.trackRadiusY - 50, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - this.spinaWidth, cy + this.trackRadiusY - 50);
    ctx.fill();

    ctx.fillStyle = "#2c2621";
    ctx.beginPath();
    ctx.roundRect(cx - this.spinaWidth, cy - 18, this.spinaWidth * 2, 36, 12);
    ctx.fill();
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(cx - this.spinaWidth, cy, 14, 0, Math.PI * 2);
    ctx.arc(cx + this.spinaWidth, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    this.dustParticles.forEach(p => {
      ctx.fillStyle = "rgba(220, 185, 140, " + p.alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    this.factions.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);

      ctx.fillStyle = f.horseColor;
      ctx.fillRect(8, -8, 14, 6);
      ctx.fillRect(8, 2, 14, 6);

      ctx.strokeStyle = "#4a3c31";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, -5); ctx.lineTo(-4, -4);
      ctx.moveTo(8, 5); ctx.lineTo(-4, 4);
      ctx.stroke();

      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.roundRect(-16, -7, 12, 14, 3);
      ctx.fill();
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#111";
      ctx.fillRect(-18, -9, 4, 3);
      ctx.fillRect(-18, 6, 4, 3);

      ctx.restore();
    });

    ctx.fillStyle = "rgba(10, 11, 14, 0.8)";
    ctx.fillRect(16, 16, 200, 70);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 200, 70);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 13px Cinzel, serif";
    ctx.fillText("CIRCUS MAXIMUS", 26, 36);
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillStyle = "#e6e8ee";
    ctx.fillText("Leader: " + this.factions[0].name, 26, 54);
    ctx.fillText("Lap: " + (this.factions[0].lap + 1) + " / 7", 26, 70);
  }

  getEntityCount() {
    return this.factions.length * 5 + this.dustParticles.length + 8;
  }

  onMouseDown(pos) {
    this.whip();
  }
  onMouseMove(pos) {}
  onMouseUp(pos) {}
  onKeyDown(key, e) {
    if (key === " " || key === "ArrowUp" || key === "w") {
      this.whip();
    }
  }
  onKeyUp(key, e) {}
  reset() {
    this.factions.forEach(f => {
      f.lap = 0;
      f.s = Math.random() * 0.1;
    });
    this.dustParticles = [];
  }
  destroy() {
    this.dustParticles = [];
  }
}
