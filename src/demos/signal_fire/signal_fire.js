// Pliny Game Lab — Polybius Signal Fire & Mountain Watchtower Network
// Polybius 5x5 optical coordinate cipher telegraph across mountain relays

export class SignalFireEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = 1;

    this.mode = "night";
    this.transmissionSpeed = 1.0;
    this.activePreset = "HOSTIS ADEST";

    this.matrix = [
      ["A", "B", "C", "D", "E"],
      ["F", "G", "H", "I", "K"],
      ["L", "M", "N", "O", "P"],
      ["Q", "R", "S", "T", "U"],
      ["V", "W", "X", "Y", "Z"]
    ];

    this.charIndex = 0;
    this.charTimer = 0;
    this.activeRow = 1;
    this.activeCol = 1;

    this.towers = [
      { name: "Specula I (Vesuvio)", x: 0.15, y: 0.58 },
      { name: "Specula II (Mons Lactarius)", x: 0.38, y: 0.52 },
      { name: "Specula III (Campania Ridge)", x: 0.62, y: 0.48 },
      { name: "Specula IV (Capua Citadel)", x: 0.85, y: 0.42 }
    ];

    this.particles = [];
    this.packets = [];

    this.encodeChar(this.activePreset[0]);
    this.initControls();
  }

  encodeChar(ch) {
    if (!ch) return;
    const c = ch.toUpperCase() === "J" ? "I" : ch.toUpperCase();
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 5; col++) {
        if (this.matrix[r][col] === c) {
          this.activeRow = r + 1;
          this.activeCol = col + 1;
          return;
        }
      }
    }
  }

  initControls() {
    if (!this.controlsContainer || typeof document === "undefined") return;
    this.controlsContainer.innerHTML = "";

    const g1 = document.createElement("div");
    g1.className = "control-group";
    const l1 = document.createElement("label");
    l1.textContent = "Telegraph Message";
    const sel = document.createElement("select");
    ["HOSTIS ADEST", "LEGIO VICTA", "MITTE AUXILIUM", "ROMA AETERNA"].forEach(msg => {
      const opt = document.createElement("option");
      opt.value = msg;
      opt.textContent = msg;
      sel.appendChild(opt);
    });
    sel.value = this.activePreset;
    sel.addEventListener("change", (e) => {
      this.activePreset = e.target.value;
      this.reset();
    });
    g1.appendChild(l1);
    g1.appendChild(sel);
    this.controlsContainer.appendChild(g1);

    const g2 = document.createElement("div");
    g2.className = "control-group";
    const l2 = document.createElement("label");
    l2.textContent = "Transmission Speed";
    const s2 = document.createElement("input");
    s2.type = "range";
    s2.min = "0.5";
    s2.max = "3.0";
    s2.step = "0.1";
    s2.value = this.transmissionSpeed;
    s2.addEventListener("input", (e) => this.transmissionSpeed = parseFloat(e.target.value));
    g2.appendChild(l2);
    g2.appendChild(s2);
    this.controlsContainer.appendChild(g2);

    const btn1 = document.createElement("button");
    btn1.className = "action-btn";
    btn1.textContent = "Transmit Message";
    btn1.addEventListener("click", () => this.transmitNext());
    this.controlsContainer.appendChild(btn1);

    const btn2 = document.createElement("button");
    btn2.className = "sub-btn";
    btn2.textContent = "Toggle Day Smoke / Night Fire";
    btn2.addEventListener("click", () => {
      this.mode = this.mode === "night" ? "day" : "night";
    });
    this.controlsContainer.appendChild(btn2);
  }

  transmitNext() {
    this.charIndex = (this.charIndex + 1) % this.activePreset.length;
    while (this.activePreset[this.charIndex] === " ") {
      this.charIndex = (this.charIndex + 1) % this.activePreset.length;
    }
    this.encodeChar(this.activePreset[this.charIndex]);

    for (let i = 0; i < this.towers.length - 1; i++) {
      const t1 = this.towers[i];
      const t2 = this.towers[i + 1];
      this.packets.push({
        x: t1.x * this.width,
        y: t1.y * this.height - 30,
        tx: t2.x * this.width,
        ty: t2.y * this.height - 30,
        progress: 0,
        speed: 1.2 * this.transmissionSpeed,
        char: this.activePreset[this.charIndex]
      });
    }
  }

  resize(w, h, dpr) {
    this.width = w;
    this.height = h;
    this.dpr = dpr || 1;
  }

  update(dt) {
    this.charTimer += dt * this.transmissionSpeed;
    if (this.charTimer > 2.2) {
      this.charTimer = 0;
      this.transmitNext();
    }

    this.towers.forEach(t => {
      if (Math.random() < 0.6) {
        const px = t.x * this.width;
        const py = t.y * this.height - 25;
        this.particles.push({
          x: px + (Math.random() - 0.5) * 16,
          y: py,
          vx: (Math.random() - 0.5) * 12 + 8,
          vy: -(25 + Math.random() * 35),
          radius: this.mode === "night" ? 2 + Math.random() * 3 : 5 + Math.random() * 6,
          alpha: 0.8,
          life: 0.9,
          color: this.mode === "night" ? "#ff6600" : "rgba(160, 160, 170, 0.5)"
        });
      }
    });

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.9 * 0.8);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.packets.length - 1; i >= 0; i--) {
      const pk = this.packets[i];
      pk.progress += pk.speed * dt;
      if (pk.progress >= 1) {
        this.packets.splice(i, 1);
      }
    }
  }

  render(ctx) {
    if (this.mode === "night") {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, "#03030c");
      skyGrad.addColorStop(0.6, "#15102a");
      skyGrad.addColorStop(1, "#2b141e");
      ctx.fillStyle = skyGrad;
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, "#4a6984");
      skyGrad.addColorStop(0.7, "#87a3be");
      skyGrad.addColorStop(1, "#c9a67a");
      ctx.fillStyle = skyGrad;
    }
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = this.mode === "night" ? "#0a0715" : "#322d25";
    ctx.beginPath();
    ctx.moveTo(0, this.height * 0.7);
    ctx.lineTo(this.width * 0.25, this.height * 0.5);
    ctx.lineTo(this.width * 0.5, this.height * 0.65);
    ctx.lineTo(this.width * 0.75, this.height * 0.42);
    ctx.lineTo(this.width, this.height * 0.58);
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();

    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    this.towers.forEach((t, idx) => {
      const tx = t.x * this.width;
      const ty = t.y * this.height;

      ctx.fillStyle = "#1e1b18";
      ctx.fillRect(tx - 12, ty - 30, 24, 30);
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 1;
      ctx.strokeRect(tx - 12, ty - 30, 24, 30);

      ctx.fillStyle = "#ffaa00";
      ctx.beginPath();
      ctx.arc(tx, ty - 32, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffd700";
      ctx.font = "9px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText("T" + (idx + 1), tx, ty + 14);
    });

    this.packets.forEach(pk => {
      const curX = pk.x + (pk.tx - pk.x) * pk.progress;
      const curY = pk.y + (pk.ty - pk.y) * pk.progress - Math.sin(pk.progress * Math.PI) * 20;

      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pk.x, pk.y);
      ctx.lineTo(pk.tx, pk.ty);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    const hudX = 20;
    const hudY = 20;
    ctx.fillStyle = "rgba(10, 10, 18, 0.85)";
    ctx.fillRect(hudX, hudY, 240, 140);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX, hudY, 240, 140);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 13px Cinzel, serif";
    ctx.textAlign = "left";
    ctx.fillText("POLYBIUS CIPHER TELEGRAPH", hudX + 12, hudY + 22);

    ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillStyle = "#00ffff";
    ctx.fillText('Char: "' + (this.activePreset[this.charIndex] || '') + '" -> (' + this.activeRow + ', ' + this.activeCol + ')', hudX + 12, hudY + 44);

    const cellSize = 16;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cx = hudX + 12 + c * (cellSize + 4);
        const cy = hudY + 54 + r * (cellSize + 1);
        const isActive = (r + 1 === this.activeRow && c + 1 === this.activeCol);

        ctx.fillStyle = isActive ? "#ff9900" : "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(cx, cy, cellSize, cellSize);

        ctx.fillStyle = isActive ? "#000" : "#d4af37";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.matrix[r][c], cx + cellSize / 2, cy + cellSize / 2 + 3);
      }
    }
  }

  getEntityCount() {
    return this.towers.length + this.particles.length + this.packets.length + 25;
  }

  onMouseDown(pos) {
    this.transmitNext();
  }
  onMouseMove(pos) {}
  onMouseUp(pos) {}
  onKeyDown(key, e) {
    if (key === " " || key === "Enter") {
      this.transmitNext();
    }
  }
  onKeyUp(key, e) {}
  reset() {
    this.charIndex = 0;
    this.charTimer = 0;
    this.packets = [];
    this.particles = [];
    this.encodeChar(this.activePreset[0]);
  }
  destroy() {
    this.particles = [];
    this.packets = [];
  }
}
