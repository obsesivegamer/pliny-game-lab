import { LabyrinthusAudio } from './audio.js';

export class LabyrinthusEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.audio = new LabyrinthusAudio();
    this.keys = {};
    
    this.mapWidth = 16;
    this.mapHeight = 16;
    this.resolution = 2; // Raycast resolution (1=high, 2=med, 4=low)
    
    this.player = {
      x: 1.5,
      y: 1.5,
      dirX: -1,
      dirY: 0,
      planeX: 0,
      planeY: 0.66,
      hp: 100,
      mana: 100,
      gold: 0,
      level: 1
    };
    
    this.map = [];
    this.entities = [];
    this.projectiles = [];
    this.particles = [];
    
    this.showMap = false;
    this.lastTime = performance.now();
    
    this.initControls();
    this.generateMap();
    
    // Attempt to start music (might require user interaction first)
    this.clickListener = () => {
      this.audio.init();
      if (this.audio.musicOscillators.length === 0) {
        this.audio.startMusic();
      }
    };
    this.canvas.addEventListener('click', this.clickListener, { once: true });
  }
  
  initControls() {
    this.controlsContainer.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '10px';
    wrapper.style.padding = '10px';
    wrapper.style.color = '#fff';
    wrapper.style.fontFamily = 'monospace';
    
    // Size Selector
    const sizeLabel = document.createElement('label');
    sizeLabel.innerText = 'Dungeon Size: ';
    const sizeSelect = document.createElement('select');
    sizeSelect.innerHTML = `
      <option value="16">Small 16x16</option>
      <option value="24">Medium 24x24</option>
      <option value="32">Large 32x32</option>
    `;
    sizeSelect.onchange = (e) => {
      const v = parseInt(e.target.value);
      this.mapWidth = v;
      this.mapHeight = v;
      this.generateMap();
    };
    sizeLabel.appendChild(sizeSelect);
    
    // Resolution Slider
    const resLabel = document.createElement('label');
    resLabel.innerText = 'Resolution: ';
    const resSelect = document.createElement('select');
    resSelect.innerHTML = `
      <option value="4">Low Performance</option>
      <option value="2" selected>Standard</option>
      <option value="1">High Detail</option>
    `;
    resSelect.onchange = (e) => {
      this.resolution = parseInt(e.target.value);
    };
    resLabel.appendChild(resSelect);
    
    // Audio volume
    const volLabel = document.createElement('label');
    volLabel.innerText = 'Master Vol: ';
    const volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '1';
    volSlider.step = '0.1';
    volSlider.value = '1';
    volSlider.oninput = (e) => this.audio.setMasterVolume(parseFloat(e.target.value));
    volLabel.appendChild(volSlider);
    
    // Mute toggle
    const muteLabel = document.createElement('label');
    muteLabel.innerText = ' Mute: ';
    const muteCheck = document.createElement('input');
    muteCheck.type = 'checkbox';
    muteCheck.onchange = (e) => this.audio.setMute(e.target.checked);
    muteLabel.appendChild(muteCheck);
    
    const sfxLabel = document.createElement('label');
    sfxLabel.innerText = 'SFX Vol: ';
    const sfxSlider = document.createElement('input');
    sfxSlider.type = 'range';
    sfxSlider.min = '0';
    sfxSlider.max = '1';
    sfxSlider.step = '0.1';
    sfxSlider.value = '1';
    sfxSlider.oninput = (e) => this.audio.setSfxVolume(parseFloat(e.target.value));
    sfxLabel.appendChild(sfxSlider);
    
    // Generate Button
    const genBtn = document.createElement('button');
    genBtn.innerText = 'Generate New Labyrinth';
    genBtn.onclick = () => this.generateMap();
    
    wrapper.appendChild(sizeLabel);
    wrapper.appendChild(resLabel);
    
    const volRow = document.createElement('div');
    volRow.appendChild(volLabel);
    volRow.appendChild(muteLabel);
    wrapper.appendChild(volRow);
    wrapper.appendChild(sfxLabel);
    
    wrapper.appendChild(genBtn);
    
    this.controlsContainer.appendChild(wrapper);
  }
  
  generateMap() {
    this.map = [];
    for (let x = 0; x < this.mapWidth; x++) {
      let col = [];
      for (let y = 0; y < this.mapHeight; y++) {
        col.push(1);
      }
      this.map.push(col);
    }
    
    // Recursive backtracker
    const stack = [];
    let curr = { x: 1, y: 1 };
    this.map[curr.x][curr.y] = 0;
    stack.push(curr);
    
    while(stack.length > 0) {
      const neighbors = [];
      const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
      dirs.forEach(d => {
        let nx = curr.x + d[0];
        let ny = curr.y + d[1];
        if (nx > 0 && nx < this.mapWidth-1 && ny > 0 && ny < this.mapHeight-1 && this.map[nx][ny] === 1) {
          neighbors.push({x: nx, y: ny, dx: d[0]/2, dy: d[1]/2});
        }
      });
      
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.map[curr.x + next.dx][curr.y + next.dy] = 0;
        this.map[next.x][next.y] = 0;
        stack.push(curr);
        curr = next;
      } else {
        curr = stack.pop();
      }
    }
    
    // Spawn player
    this.player.x = 1.5;
    this.player.y = 1.5;
    
    this.entities = [];
    
    // Spawn entities
    for (let x = 1; x < this.mapWidth - 1; x++) {
      for (let y = 1; y < this.mapHeight - 1; y++) {
        if (this.map[x][y] === 0 && (x !== 1 || y !== 1)) {
          if (Math.random() < 0.05) {
            this.entities.push({ type: 'enemy', x: x+0.5, y: y+0.5, hp: 30, color: 'red', state: 'idle', timer: 0 });
          } else if (Math.random() < 0.05) {
            this.entities.push({ type: 'torch', x: x+0.5, y: y+0.5, color: '#ffaa00' });
          } else if (Math.random() < 0.02) {
            this.entities.push({ type: 'health', x: x+0.5, y: y+0.5 });
          } else if (Math.random() < 0.02) {
            this.entities.push({ type: 'scroll', x: x+0.5, y: y+0.5 });
          }
        }
      }
    }
    
    // Place exit
    let exitPlaced = false;
    while(!exitPlaced) {
      let ex = Math.floor(Math.random() * (this.mapWidth-2)) + 1;
      let ey = Math.floor(Math.random() * (this.mapHeight-2)) + 1;
      if (this.map[ex][ey] === 0 && (ex > this.mapWidth/2 || ey > this.mapHeight/2)) {
        this.entities.push({ type: 'exit', x: ex+0.5, y: ey+0.5 });
        exitPlaced = true;
      }
    }
  }
  
  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
  }
  
  onKeyDown(key, e) {
    this.keys[key.toLowerCase()] = true;
    if (key.toLowerCase() === 'm') this.showMap = !this.showMap;
    if (key === ' ' && !this.keys['space_pressed']) {
      this.keys['space_pressed'] = true;
      this.castSpell();
    }
  }
  
  onKeyUp(key, e) {
    this.keys[key.toLowerCase()] = false;
    if (key === ' ') this.keys['space_pressed'] = false;
  }
  
  onMouseDown(pos) {
    this.castSpell();
  }
  
  castSpell() {
    if (this.player.mana >= 10) {
      this.player.mana -= 10;
      this.audio.playCast();
      this.projectiles.push({
        x: this.player.x,
        y: this.player.y,
        dx: this.player.dirX * 5,
        dy: this.player.dirY * 5,
        life: 2.0
      });
    }
  }
  
  update(dt) {
    // Player movement
    const moveSpeed = 3.0 * dt;
    const rotSpeed = 2.0 * dt;
    
    let moved = false;
    
    if (this.keys['w'] || this.keys['arrowup']) {
      if(this.map[Math.floor(this.player.x + this.player.dirX * moveSpeed)][Math.floor(this.player.y)] === 0) this.player.x += this.player.dirX * moveSpeed;
      if(this.map[Math.floor(this.player.x)][Math.floor(this.player.y + this.player.dirY * moveSpeed)] === 0) this.player.y += this.player.dirY * moveSpeed;
      moved = true;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      if(this.map[Math.floor(this.player.x - this.player.dirX * moveSpeed)][Math.floor(this.player.y)] === 0) this.player.x -= this.player.dirX * moveSpeed;
      if(this.map[Math.floor(this.player.x)][Math.floor(this.player.y - this.player.dirY * moveSpeed)] === 0) this.player.y -= this.player.dirY * moveSpeed;
      moved = true;
    }
    
    if (this.keys['a'] || this.keys['arrowleft']) {
      const oldDirX = this.player.dirX;
      this.player.dirX = this.player.dirX * Math.cos(rotSpeed) - this.player.dirY * Math.sin(rotSpeed);
      this.player.dirY = oldDirX * Math.sin(rotSpeed) + this.player.dirY * Math.cos(rotSpeed);
      const oldPlaneX = this.player.planeX;
      this.player.planeX = this.player.planeX * Math.cos(rotSpeed) - this.player.planeY * Math.sin(rotSpeed);
      this.player.planeY = oldPlaneX * Math.sin(rotSpeed) + this.player.planeY * Math.cos(rotSpeed);
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      const oldDirX = this.player.dirX;
      this.player.dirX = this.player.dirX * Math.cos(-rotSpeed) - this.player.dirY * Math.sin(-rotSpeed);
      this.player.dirY = oldDirX * Math.sin(-rotSpeed) + this.player.dirY * Math.cos(-rotSpeed);
      const oldPlaneX = this.player.planeX;
      this.player.planeX = this.player.planeX * Math.cos(-rotSpeed) - this.player.planeY * Math.sin(-rotSpeed);
      this.player.planeY = oldPlaneX * Math.sin(-rotSpeed) + this.player.planeY * Math.cos(-rotSpeed);
    }
    
    if (moved && Math.random() < 0.1) {
      this.audio.playFootstep();
    }
    
    // Mana regen
    this.player.mana = Math.min(100, this.player.mana + 5 * dt);
    
    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      let p = this.projectiles[i];
      p.x += p.dx * dt;
      p.y += p.dy * dt;
      p.life -= dt;
      
      // Spawn particles
      this.particles.push({x: p.x, y: p.y, life: 0.5, color: '#00ffff'});
      
      if (this.map[Math.floor(p.x)][Math.floor(p.y)] !== 0 || p.life <= 0) {
        this.projectiles.splice(i, 1);
        this.audio.playImpact();
        continue;
      }
      
      // Collision with enemies
      for (let j = 0; j < this.entities.length; j++) {
        let e = this.entities[j];
        if (e.type === 'enemy' && Math.hypot(e.x - p.x, e.y - p.y) < 0.5) {
          e.hp -= 15;
          this.projectiles.splice(i, 1);
          this.audio.playImpact();
          if (e.hp <= 0) {
            this.player.gold += 10;
            this.entities.splice(j, 1);
          }
          break;
        }
      }
    }
    
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    
    // Entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      let e = this.entities[i];
      let dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      
      if (e.type === 'enemy') {
        e.timer += dt;
        if (dist < 5) {
          if (e.state === 'idle') {
            e.state = 'pursue';
            this.audio.playGrowl();
          }
          if (dist > 0.8) {
            let dx = (this.player.x - e.x) / dist;
            let dy = (this.player.y - e.y) / dist;
            if(this.map[Math.floor(e.x + dx * moveSpeed * 0.5)][Math.floor(e.y)] === 0) e.x += dx * moveSpeed * 0.5;
            if(this.map[Math.floor(e.x)][Math.floor(e.y + dy * moveSpeed * 0.5)] === 0) e.y += dy * moveSpeed * 0.5;
          } else if (e.timer > 1.0) {
            this.player.hp -= 10;
            e.timer = 0;
            this.audio.playImpact();
          }
        } else {
          e.state = 'idle';
        }
      }
      
      // Pickups
      if (dist < 0.5) {
        if (e.type === 'health') {
          this.player.hp = Math.min(100, this.player.hp + 30);
          this.audio.playPickup();
          this.entities.splice(i, 1);
        } else if (e.type === 'scroll') {
          this.player.mana = Math.min(100, this.player.mana + 50);
          this.audio.playPickup();
          this.entities.splice(i, 1);
        } else if (e.type === 'exit') {
          this.audio.playPickup();
          this.player.level++;
          this.generateMap();
          break;
        }
      }
    }
    
    if (this.player.hp <= 0) {
      this.reset();
    }
  }
  
  render(ctx) {
    // Render Floor and Ceiling
    const gradientCeil = ctx.createLinearGradient(0, 0, 0, this.height/2);
    gradientCeil.addColorStop(0, '#111');
    gradientCeil.addColorStop(1, '#333');
    ctx.fillStyle = gradientCeil;
    ctx.fillRect(0, 0, this.width, this.height/2);
    
    const gradientFloor = ctx.createLinearGradient(0, this.height/2, 0, this.height);
    gradientFloor.addColorStop(0, '#432');
    gradientFloor.addColorStop(1, '#211');
    ctx.fillStyle = gradientFloor;
    ctx.fillRect(0, this.height/2, this.width, this.height/2);
    
    // Z-Buffer for sprite casting
    const zBuffer = new Array(this.width).fill(0);
    
    // Torch flicker
    const flicker = Math.sin(performance.now() * 0.01) * 0.1 + 0.9;
    
    // Raycasting
    for (let x = 0; x < this.width; x += this.resolution) {
      let cameraX = 2 * x / this.width - 1;
      let rayDirX = this.player.dirX + this.player.planeX * cameraX;
      let rayDirY = this.player.dirY + this.player.planeY * cameraX;
      
      let mapX = Math.floor(this.player.x);
      let mapY = Math.floor(this.player.y);
      
      let sideDistX, sideDistY;
      
      let deltaDistX = Math.abs(1 / rayDirX);
      let deltaDistY = Math.abs(1 / rayDirY);
      let perpWallDist;
      
      let stepX, stepY;
      let hit = 0;
      let side;
      
      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (this.player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - this.player.x) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (this.player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - this.player.y) * deltaDistY;
      }
      
      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
          hit = 1;
        } else if (this.map[mapX][mapY] > 0) {
          hit = 1;
        }
      }
      
      if (side === 0) perpWallDist = (mapX - this.player.x + (1 - stepX) / 2) / rayDirX;
      else           perpWallDist = (mapY - this.player.y + (1 - stepY) / 2) / rayDirY;
      
      let lineHeight = Math.floor(this.height / perpWallDist);
      let drawStart = -lineHeight / 2 + this.height / 2;
      if (drawStart < 0) drawStart = 0;
      let drawEnd = lineHeight / 2 + this.height / 2;
      if (drawEnd >= this.height) drawEnd = this.height - 1;
      
      // Depth fog color calculation
      let fog = Math.max(0, 1 - (perpWallDist / 10));
      let color = side === 1 ? [100, 100, 100] : [150, 150, 150];
      color[0] = Math.floor(color[0] * fog * flicker);
      color[1] = Math.floor(color[1] * fog * flicker);
      color[2] = Math.floor(color[2] * fog * flicker);
      
      ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      ctx.fillRect(x, drawStart, this.resolution, drawEnd - drawStart);
      
      for(let i=0; i<this.resolution; i++) {
        zBuffer[x+i] = perpWallDist;
      }
    }
    
    // Draw Sprites
    const sprites = this.entities.concat(this.projectiles).concat(this.particles);
    sprites.sort((a, b) => {
      let d1 = (this.player.x - a.x)**2 + (this.player.y - a.y)**2;
      let d2 = (this.player.x - b.x)**2 + (this.player.y - b.y)**2;
      return d2 - d1;
    });
    
    for (let i = 0; i < sprites.length; i++) {
      let sprite = sprites[i];
      let spriteX = sprite.x - this.player.x;
      let spriteY = sprite.y - this.player.y;
      
      let invDet = 1.0 / (this.player.planeX * this.player.dirY - this.player.dirX * this.player.planeY);
      
      let transformX = invDet * (this.player.dirY * spriteX - this.player.dirX * spriteY);
      let transformY = invDet * (-this.player.planeY * spriteX + this.player.planeX * spriteY);
      
      if (transformY > 0) {
        let spriteScreenX = Math.floor((this.width / 2) * (1 + transformX / transformY));
        let spriteHeight = Math.abs(Math.floor(this.height / transformY));
        let spriteWidth = Math.abs(Math.floor(this.height / transformY));
        let drawStartY = -spriteHeight / 2 + this.height / 2;
        let drawEndY = spriteHeight / 2 + this.height / 2;
        
        let drawStartX = -spriteWidth / 2 + spriteScreenX;
        let drawEndX = spriteWidth / 2 + spriteScreenX;
        
        if (drawStartX < this.width && drawEndX > 0) {
          for(let stripe = Math.max(0, Math.floor(drawStartX)); stripe < Math.min(this.width, drawEndX); stripe+=this.resolution) {
            if (transformY < zBuffer[stripe]) {
              // Pick color
              let c = 'white';
              if (sprite.type === 'enemy') c = sprite.color;
              else if (sprite.type === 'torch') c = '#ffaa00';
              else if (sprite.type === 'health') c = '#00ff00';
              else if (sprite.type === 'scroll') c = '#0000ff';
              else if (sprite.type === 'exit') c = '#ffff00';
              else if (sprite.color) c = sprite.color; // particle
              
              ctx.fillStyle = c;
              ctx.fillRect(stripe, drawStartY, this.resolution, drawEndY - drawStartY);
            }
          }
        }
      }
    }
    
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 300, 80);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Level: ${this.player.level}   Gold: ${this.player.gold}`, 10, 20);
    
    // Health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 35, 100, 15);
    ctx.fillStyle = 'lightgreen';
    ctx.fillRect(10, 35, this.player.hp, 15);
    ctx.fillStyle = 'white';
    ctx.fillText('HP', 115, 47);
    
    // Mana bar
    ctx.fillStyle = 'darkblue';
    ctx.fillRect(10, 55, 100, 15);
    ctx.fillStyle = 'cyan';
    ctx.fillRect(10, 55, this.player.mana, 15);
    ctx.fillStyle = 'white';
    ctx.fillText('MP', 115, 67);
    
    // Minimap
    if (this.showMap) {
      let mmSize = 10;
      for(let x=0; x<this.mapWidth; x++) {
        for(let y=0; y<this.mapHeight; y++) {
          ctx.fillStyle = this.map[x][y] > 0 ? '#333' : '#aaa';
          ctx.fillRect(this.width - this.mapWidth*mmSize + x*mmSize, y*mmSize, mmSize, mmSize);
        }
      }
      ctx.fillStyle = 'red';
      ctx.fillRect(this.width - this.mapWidth*mmSize + this.player.x*mmSize - 2, this.player.y*mmSize - 2, 4, 4);
    }
  }
  
  getEntityCount() {
    return this.entities.length + this.projectiles.length + this.particles.length;
  }
  
  reset() {
    this.player.hp = 100;
    this.player.mana = 100;
    this.player.gold = 0;
    this.player.level = 1;
    this.generateMap();
  }
  
  destroy() {
    if (this.clickListener) {
      this.canvas.removeEventListener('click', this.clickListener);
    }
    this.audio.destroy();
    this.controlsContainer.innerHTML = '';
  }
}
