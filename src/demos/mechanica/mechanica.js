export class MechanicaEngine {
    constructor(canvas, ctx, controlsContainer) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.controlsContainer = controlsContainer;
        this.width = canvas.width;
        this.height = canvas.height;
        this.dpr = 1;
        
        this.points = [];
        this.sticks = [];
        
        this.gravity = 9.81;
        this.restitution = 0.5;
        this.wind = 0.0;
        
        this.currentTool = 'Drag / Pull';
        this.mousePos = { x: 0, y: 0 };
        this.mouseDown = false;
        this.draggedPoint = null;
        this.slicePath = [];
        
        this.timeElapsed = 0;
        this.activePreset = 'Cloth & Chains';
        
        this.buildControls();
        this.reset();
    }
    
    buildControls() {
        this.controlsContainer.innerHTML = '';
        this.controlsContainer.style.color = '#fff';
        this.controlsContainer.style.fontFamily = 'monospace';
        this.controlsContainer.style.fontSize = '14px';
        
        const createSelect = (label, options, onChange) => {
            const wrap = document.createElement('div');
            wrap.style.marginBottom = '12px';
            const lbl = document.createElement('div');
            lbl.textContent = label;
            lbl.style.marginBottom = '4px';
            const sel = document.createElement('select');
            sel.style.width = '100%';
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                sel.appendChild(o);
            });
            sel.onchange = (e) => onChange(e.target.value);
            wrap.appendChild(lbl);
            wrap.appendChild(sel);
            this.controlsContainer.appendChild(wrap);
            return sel;
        };
        
        const createSlider = (label, min, max, step, val, onChange) => {
            const wrap = document.createElement('div');
            wrap.style.marginBottom = '12px';
            const lbl = document.createElement('div');
            lbl.textContent = `${label}: ${val}`;
            lbl.style.marginBottom = '4px';
            const inp = document.createElement('input');
            inp.type = 'range';
            inp.min = min;
            inp.max = max;
            inp.step = step;
            inp.value = val;
            inp.style.width = '100%';
            inp.oninput = (e) => {
                lbl.textContent = `${label}: ${e.target.value}`;
                onChange(parseFloat(e.target.value));
            };
            wrap.appendChild(lbl);
            wrap.appendChild(inp);
            this.controlsContainer.appendChild(wrap);
            return inp;
        };
        
        this.toolSelect = createSelect('Tool', ['Drag / Pull', 'Slice / Sever Constraints', 'Spawn Ball', 'Spawn Rope', 'Spawn Catapult'], val => {
            this.currentTool = val;
        });
        
        this.presetSelect = createSelect('Preset', ['Archimedes Screw', 'Catapult Siege', 'Hero Steam Turbine', 'Cloth & Chains'], val => {
            this.activePreset = val;
            this.reset();
        });
        this.presetSelect.value = 'Cloth & Chains';
        
        createSlider('Gravity', 0, 20, 0.1, this.gravity, val => this.gravity = val);
        createSlider('Restitution', 0, 1, 0.01, this.restitution, val => this.restitution = val);
        createSlider('Wind', -20, 20, 0.1, this.wind, val => this.wind = val);
    }
    
    resize(width, height, dpr) {
        this.width = width;
        this.height = height;
        this.dpr = dpr;
    }
    
    reset() {
        this.points = [];
        this.sticks = [];
        this.timeElapsed = 0;
        this.slicePath = [];
        
        if (this.activePreset === 'Cloth & Chains') {
            this.createCloth(this.width * 0.3, 100, 15, 10, 20);
            this.createChain(this.width * 0.7, 100, 15, 20);
        } else if (this.activePreset === 'Catapult Siege') {
            this.createCatapult(this.width * 0.5, this.height - 100);
        } else if (this.activePreset === 'Archimedes Screw') {
            this.createArchimedesScrew();
        } else if (this.activePreset === 'Hero Steam Turbine') {
            this.createSteamTurbine();
        }
    }
    
    destroy() {
        if (this.controlsContainer) this.controlsContainer.innerHTML = '';
    }
    
    getEntityCount() {
        return this.points.length + this.sticks.length;
    }
    
    createPoint(x, y, radius = 5, mass = 1, pinned = false, type = 'normal') {
        const p = { x, y, oldX: x, oldY: y, radius, mass, pinned, type, life: -1, vx: 0, vy: 0 };
        this.points.push(p);
        return p;
    }
    
    createStick(p1, p2, length = null, stiffness = 1, tearable = false, tearDist = 3.0) {
        if (length === null) {
            length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
        const s = { p1, p2, length, stiffness, tearable, tearDist, tension: 0, broken: false, hidden: false, type: 'stick' };
        this.sticks.push(s);
        return s;
    }
    
    createCloth(startX, startY, cols, rows, spacing) {
        const clothPoints = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const pinned = (y === 0 && (x % 3 === 0 || x === cols - 1));
                const p = this.createPoint(startX + x * spacing, startY + y * spacing, 3, 1, pinned, 'normal');
                clothPoints.push(p);
                
                if (x > 0) {
                    this.createStick(p, clothPoints[clothPoints.length - 2], spacing, 1, true, 4.0);
                }
                if (y > 0) {
                    this.createStick(p, clothPoints[(y - 1) * cols + x], spacing, 1, true, 4.0);
                }
            }
        }
    }
    
    createChain(x, y, segments, length) {
        let prev = this.createPoint(x, y, 6, 1, true, 'metal');
        for (let i = 1; i < segments; i++) {
            const p = this.createPoint(x, y + i * length, 6, 2, false, 'metal');
            this.createStick(prev, p, length, 1, true, 2.5);
            prev = p;
        }
        prev.radius = 20;
        prev.mass = 10;
        prev.type = 'stone';
    }
    
    createCatapult(bx, by) {
        // Base
        const w = 180, h = 30;
        const p1 = this.createPoint(bx - w/2, by, 5, 1, true, 'wood');
        const p2 = this.createPoint(bx + w/2, by, 5, 1, true, 'wood');
        const p3 = this.createPoint(bx + w/2, by - h, 5, 1, false, 'wood');
        const p4 = this.createPoint(bx - w/2, by - h, 5, 1, false, 'wood');
        
        this.createStick(p1, p2, null, 1);
        this.createStick(p2, p3, null, 1);
        this.createStick(p3, p4, null, 1);
        this.createStick(p4, p1, null, 1);
        this.createStick(p1, p3, null, 1);
        this.createStick(p2, p4, null, 1);
        
        // Pivot
        const pivotHeight = 100;
        const pivotPoint = this.createPoint(bx, by - h - pivotHeight, 8, 5, true, 'metal');
        this.createStick(p4, pivotPoint, null, 1);
        this.createStick(p3, pivotPoint, null, 1);
        
        // Arm
        const armLeft = 50, armRight = 200;
        const armP1 = this.createPoint(bx - armLeft, by - h - pivotHeight, 6, 2, false, 'wood');
        const armP2 = this.createPoint(bx + armRight, by - h - pivotHeight, 6, 2, false, 'wood');
        this.createStick(armP1, pivotPoint, null, 1);
        this.createStick(pivotPoint, armP2, null, 1);
        this.createStick(armP1, armP2, null, 1, false);
        
        // Cup
        const cup1 = this.createPoint(bx + armRight, by - h - pivotHeight - 20, 5, 1, false, 'wood');
        const cup2 = this.createPoint(bx + armRight + 30, by - h - pivotHeight - 10, 5, 1, false, 'wood');
        this.createStick(armP2, cup1, null, 1);
        this.createStick(armP2, cup2, null, 1);
        this.createStick(cup1, cup2, null, 1);
        
        // Projectile
        const proj = this.createPoint(bx + armRight + 15, by - h - pivotHeight - 35, 15, 0.5, false, 'stone');
        
        // Tension spring (counterweight substitute)
        this.createStick(p4, armP1, null, 0.05, false);
        
        // Release latch
        const latchBase = this.createPoint(bx + armRight - 20, by, 5, 1, true, 'wood');
        this.createStick(latchBase, armP2, null, 1, true, 1.2);
    }

    createArchimedesScrew() {
        this.screwCenter = {x: this.width / 2, y: this.height / 2};
        this.screwAngle = 0;
        this.screwPlatforms = [];
        for (let i = 0; i < 5; i++) {
            this.screwPlatforms.push({
                offset: i * (this.height / 5),
                width: 200,
                angle: Math.PI / 6
            });
        }
        for(let i = 0; i < 150; i++) {
            this.createPoint(this.width/2 - 60 + Math.random()*120, this.height - 30 - Math.random()*100, 8, 1, false, 'water');
        }
    }
    
    createSteamTurbine() {
        const cx = this.width / 2, cy = this.height / 2;
        this.turbineCenter = this.createPoint(cx, cy, 20, 10, true, 'metal');
        
        const r = 100;
        this.turbineJets = [];
        for(let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const jet = this.createPoint(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r, 6, 2, false, 'metal');
            this.createStick(this.turbineCenter, jet, r, 1);
            if (i > 0) {
                this.createStick(this.turbineJets[i-1], jet, null, 1);
            }
            this.turbineJets.push(jet);
        }
        this.createStick(this.turbineJets[3], this.turbineJets[0], null, 1);
        
        this.turbineAngle = 0;
    }

    onMouseDown(pos) {
        this.mousePos = pos;
        this.mouseDown = true;
        
        if (this.currentTool === 'Drag / Pull') {
            this.draggedPoint = this.getClosestPoint(pos.x, pos.y, 30);
        } else if (this.currentTool === 'Slice / Sever Constraints') {
            this.slicePath = [pos];
        } else if (this.currentTool === 'Spawn Ball') {
            this.createPoint(pos.x, pos.y, 15 + Math.random()*10, 5, false, 'stone');
        } else if (this.currentTool === 'Spawn Rope') {
            this.createChain(pos.x, pos.y, 10, 15);
        } else if (this.currentTool === 'Spawn Catapult') {
            this.createCatapult(pos.x, pos.y + 100);
        }
    }
    
    onMouseMove(pos) {
        if (this.mouseDown && this.currentTool === 'Slice / Sever Constraints') {
            this.slicePath.push(pos);
            this.checkSlice();
        }
        this.mousePos = pos;
    }
    
    onMouseUp(pos) {
        this.mouseDown = false;
        this.draggedPoint = null;
        this.slicePath = [];
    }
    
    onKeyDown(key) {
        // Optional key bindings
    }
    
    getClosestPoint(x, y, radius) {
        let minDist = radius * radius;
        let closest = null;
        for (const p of this.points) {
            const dx = p.x - x, dy = p.y - y;
            const distSq = dx*dx + dy*dy;
            if (distSq < minDist) {
                minDist = distSq;
                closest = p;
            }
        }
        return closest;
    }
    
    checkSlice() {
        if (this.slicePath.length < 2) return;
        const p1 = this.slicePath[this.slicePath.length - 2];
        const p2 = this.slicePath[this.slicePath.length - 1];
        
        for (const s of this.sticks) {
            if (s.broken || !s.tearable) continue;
            if (this.lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, s.p1.x, s.p1.y, s.p2.x, s.p2.y)) {
                s.broken = true;
            }
        }
    }
    
    lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denominator === 0) return false;
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
        return (t > 0 && t < 1 && u > 0 && u < 1);
    }
    
    update(dt) {
        // Prevent giant leaps
        if (dt > 0.1) dt = 0.1;
        
        const subSteps = 5;
        const sdt = dt / subSteps;
        
        this.timeElapsed += dt;
        
        if (this.activePreset === 'Archimedes Screw') {
            this.updateArchimedesScrew(dt);
        } else if (this.activePreset === 'Hero Steam Turbine') {
            this.updateSteamTurbine(dt);
        }
        
        if (this.draggedPoint) {
            this.draggedPoint.x = this.mousePos.x;
            this.draggedPoint.y = this.mousePos.y;
            this.draggedPoint.oldX = this.mousePos.x;
            this.draggedPoint.oldY = this.mousePos.y;
        }

        for (let step = 0; step < subSteps; step++) {
            for (let i = this.points.length - 1; i >= 0; i--) {
                const p = this.points[i];
                if (p.life > 0) {
                    p.life -= sdt;
                    if (p.life <= 0) {
                        this.points.splice(i, 1);
                        continue;
                    }
                }
                
                if (p.pinned) continue;
                
                let vx = (p.x - p.oldX);
                let vy = (p.y - p.oldY);
                
                vx += this.wind * sdt * 0.1;
                
                p.oldX = p.x;
                p.oldY = p.y;
                
                p.x += vx;
                p.y += vy + this.gravity * sdt * sdt * 15;
                
                if (p.y > this.height - p.radius) {
                    p.y = this.height - p.radius;
                    let vy2 = p.y - p.oldY;
                    p.oldY = p.y + vy2 * this.restitution;
                    let vx2 = p.x - p.oldX;
                    p.oldX = p.x - vx2 * 0.95;
                }
                if (p.x < p.radius) {
                    p.x = p.radius;
                    p.oldX = p.x + (p.x - p.oldX) * this.restitution;
                } else if (p.x > this.width - p.radius) {
                    p.x = this.width - p.radius;
                    p.oldX = p.x + (p.x - p.oldX) * this.restitution;
                }
            }
            
            for (const s of this.sticks) {
                if (s.broken) continue;
                
                const dx = s.p2.x - s.p1.x;
                const dy = s.p2.y - s.p1.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist === 0) continue;
                
                const diff = (s.length - dist) / dist;
                s.tension = Math.abs(diff);
                
                if (s.tearable && dist > s.length * s.tearDist) {
                    s.broken = true;
                    continue;
                }
                
                const offsetX = dx * 0.5 * diff * s.stiffness;
                const offsetY = dy * 0.5 * diff * s.stiffness;
                
                const m1 = s.p1.pinned ? 0 : 1/s.p1.mass;
                const m2 = s.p2.pinned ? 0 : 1/s.p2.mass;
                const mTotal = m1 + m2;
                
                if (mTotal > 0) {
                    if (!s.p1.pinned) {
                        s.p1.x -= offsetX * (m1 / mTotal) * 2;
                        s.p1.y -= offsetY * (m1 / mTotal) * 2;
                    }
                    if (!s.p2.pinned) {
                        s.p2.x += offsetX * (m2 / mTotal) * 2;
                        s.p2.y += offsetY * (m2 / mTotal) * 2;
                    }
                }
            }
            
            for (let i = 0; i < this.points.length; i++) {
                const p1 = this.points[i];
                if (p1.pinned || p1.type === 'steam') continue;
                for (let j = i + 1; j < this.points.length; j++) {
                    const p2 = this.points[j];
                    if (p2.pinned || p2.type === 'steam') continue;
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const distSq = dx*dx + dy*dy;
                    const r = p1.radius + p2.radius;
                    
                    if (distSq < r*r && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const diff = (r - dist) / dist;
                        const ox = dx * diff * 0.5;
                        const oy = dy * diff * 0.5;
                        
                        const m1 = 1/p1.mass;
                        const m2 = 1/p2.mass;
                        const mTotal = m1 + m2;
                        
                        p1.x -= ox * (m1 / mTotal) * 2;
                        p1.y -= oy * (m1 / mTotal) * 2;
                        p2.x += ox * (m2 / mTotal) * 2;
                        p2.y += oy * (m2 / mTotal) * 2;
                    }
                }
            }
        }
    }
    
    updateArchimedesScrew(dt) {
        this.screwAngle -= dt * 2.0;
        const speed = 100 * dt;
        for (let plat of this.screwPlatforms) {
            plat.offset -= speed;
            if (plat.offset < 0) {
                plat.offset += this.height;
            }
            
            const slope = Math.tan(plat.angle);
            for (let p of this.points) {
                if (p.type === 'water') {
                    const lineY = plat.offset + (p.x - this.screwCenter.x) * slope;
                    const dx = this.screwCenter.x - p.x;
                    if (Math.abs(dx) < plat.width/2) {
                        if (p.y > lineY - 10 && p.y < lineY + 10) {
                            p.y = lineY - 10;
                            p.oldY = p.y + dt * 20; 
                        }
                    }
                }
            }
        }
    }
    
    updateSteamTurbine(dt) {
        if (!this.turbineJets) return;
        
        let torque = 0;
        
        for (let i = 0; i < this.turbineJets.length; i++) {
            const jet = this.turbineJets[i];
            const dx = jet.x - this.turbineCenter.x;
            const dy = jet.y - this.turbineCenter.y;
            
            const tx = -dy;
            const ty = dx;
            const len = Math.sqrt(tx*tx + ty*ty);
            const nx = tx/len;
            const ny = ty/len;
            
            if (Math.random() < 0.3) {
                const sp = this.createPoint(jet.x + nx*10, jet.y + ny*10, 4, 0.1, false, 'steam');
                sp.life = 0.5 + Math.random()*0.5;
                sp.oldX = sp.x - nx * 15;
                sp.oldY = sp.y - ny * 15;
            }
            
            torque += 5000;
        }
        
        this.turbineAngle += torque * dt * dt * 0.0001;
        
        const r = 100;
        for (let i = 0; i < 4; i++) {
            const baseAng = (Math.PI / 2) * i;
            const angle = baseAng + this.turbineAngle;
            this.turbineJets[i].x = this.turbineCenter.x + Math.cos(angle)*r;
            this.turbineJets[i].y = this.turbineCenter.y + Math.sin(angle)*r;
            this.turbineJets[i].oldX = this.turbineJets[i].x;
            this.turbineJets[i].oldY = this.turbineJets[i].y;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#111316';
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.activePreset === 'Archimedes Screw') {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.screwCenter.x - 100, 0);
            ctx.lineTo(this.screwCenter.x - 100, this.height);
            ctx.moveTo(this.screwCenter.x + 100, 0);
            ctx.lineTo(this.screwCenter.x + 100, this.height);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(180, 140, 60, 0.8)';
            ctx.lineWidth = 10;
            const slope = Math.tan(this.screwPlatforms[0].angle);
            for (let plat of this.screwPlatforms) {
                ctx.beginPath();
                ctx.moveTo(this.screwCenter.x - plat.width/2, plat.offset - plat.width/2 * slope);
                ctx.lineTo(this.screwCenter.x + plat.width/2, plat.offset + plat.width/2 * slope);
                ctx.stroke();
            }
        }
        
        for (const s of this.sticks) {
            if (s.broken || s.hidden) continue;
            
            ctx.beginPath();
            ctx.moveTo(s.p1.x, s.p1.y);
            ctx.lineTo(s.p2.x, s.p2.y);
            
            if (s.tension > 0.1) {
                const t = Math.min(1.0, s.tension * 5.0);
                if (t > 0.5) {
                    ctx.strokeStyle = `rgb(255, ${Math.floor(255 - (t-0.5)*2*255)}, 50)`;
                } else {
                    ctx.strokeStyle = `rgb(${Math.floor(t*2*255)}, 255, 50)`;
                }
                ctx.lineWidth = 2 + t * 2;
            } else {
                ctx.strokeStyle = '#8a95a5';
                ctx.lineWidth = 2;
            }
            
            ctx.stroke();
        }
        
        for (const p of this.points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            
            if (p.type === 'water') {
                ctx.fillStyle = 'rgba(60, 150, 255, 0.8)';
            } else if (p.type === 'steam') {
                ctx.fillStyle = `rgba(200, 220, 255, ${p.life})`;
            } else if (p.type === 'wood') {
                ctx.fillStyle = '#8b5a2b';
            } else if (p.type === 'metal') {
                ctx.fillStyle = '#b48c3c';
            } else if (p.type === 'stone') {
                ctx.fillStyle = '#555';
            } else {
                ctx.fillStyle = '#ccc';
            }
            
            ctx.fill();
            
            if (p.pinned) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#000';
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            }
        }
        
        if (this.currentTool === 'Slice / Sever Constraints' && this.slicePath.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
            ctx.lineWidth = 2;
            ctx.moveTo(this.slicePath[0].x, this.slicePath[0].y);
            for (let i = 1; i < this.slicePath.length; i++) {
                ctx.lineTo(this.slicePath[i].x, this.slicePath[i].y);
            }
            ctx.stroke();
        }
    }
}
