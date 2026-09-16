export class CosmographiaEngine {
    constructor(canvas, ctx, controlsContainer) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.controlsContainer = controlsContainer;
        
        this.width = canvas.width;
        this.height = canvas.height;
        this.dpr = 1;
        
        this.time = 0;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.camera = { x: 0, y: 0, zoom: 1 };
        
        this.state = {
            system: 'Keplerian (Heliocentric)', // or 'Ptolemaic (Epicycles)'
            focus: 'Terra & Luna', // 'Mars (Retrograde Motion)', 'Jupiter & 4 Galilean Moons'
            trailLength: 200,
            timeSpeed: 1.0,
            showConstellations: true,
            showEpicycles: true,
            showAtmosphere: true
        };
        
        this.uiElements = [];
        this.initUI();
        this.initSimulation();
    }

    initUI() {
        if (!this.controlsContainer) return;
        
        const createSelect = (label, options, key) => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            const lbl = document.createElement('label');
            lbl.textContent = label + ': ';
            lbl.style.display = 'inline-block';
            lbl.style.width = '120px';
            lbl.style.color = '#fff';
            const sel = document.createElement('select');
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                if (opt === this.state[key]) o.selected = true;
                sel.appendChild(o);
            });
            sel.addEventListener('change', (e) => {
                this.state[key] = e.target.value;
                this.resetSimulation();
            });
            div.appendChild(lbl);
            div.appendChild(sel);
            this.controlsContainer.appendChild(div);
            this.uiElements.push(div);
        };

        const createSlider = (label, min, max, step, key) => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            const lbl = document.createElement('label');
            lbl.textContent = label + ': ';
            lbl.style.display = 'inline-block';
            lbl.style.width = '120px';
            lbl.style.color = '#fff';
            const input = document.createElement('input');
            input.type = 'range';
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = this.state[key];
            const valLbl = document.createElement('span');
            valLbl.textContent = ' ' + this.state[key];
            valLbl.style.color = '#fff';
            input.addEventListener('input', (e) => {
                this.state[key] = parseFloat(e.target.value);
                valLbl.textContent = ' ' + this.state[key];
            });
            div.appendChild(lbl);
            div.appendChild(input);
            div.appendChild(valLbl);
            this.controlsContainer.appendChild(div);
            this.uiElements.push(div);
        };

        const createToggle = (label, key) => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            const lbl = document.createElement('label');
            lbl.textContent = label + ': ';
            lbl.style.display = 'inline-block';
            lbl.style.width = '160px';
            lbl.style.color = '#fff';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.state[key];
            input.addEventListener('change', (e) => {
                this.state[key] = e.target.checked;
            });
            div.appendChild(lbl);
            div.appendChild(input);
            this.controlsContainer.appendChild(div);
            this.uiElements.push(div);
        };

        createSelect('System Model', ['Keplerian (Heliocentric)', 'Ptolemaic (Epicycles)'], 'system');
        createSelect('Planet Selector', ['Terra & Luna', 'Mars (Retrograde Motion)', 'Jupiter & 4 Galilean Moons'], 'focus');
        createSlider('Orbit Trail Length', 10, 1000, 10, 'trailLength');
        createSlider('Time Speed', 0.1, 100, 0.1, 'timeSpeed');
        createToggle('Constellations', 'showConstellations');
        createToggle('Epicycles', 'showEpicycles');
        createToggle('Atmosphere Glow', 'showAtmosphere');
    }

    initSimulation() {
        this.stars = [];
        for (let i = 0; i < 500; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * 4000,
                y: (Math.random() - 0.5) * 4000,
                z: (Math.random() - 0.5) * 4000,
                brightness: Math.random() * 0.8 + 0.2,
                color: this.getStarColor(Math.random()),
                phase: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 2
            });
        }

        // Dummy constellations
        this.constellations = [];
        for (let i = 0; i < 5; i++) {
            let line = [];
            for (let j = 0; j < 4; j++) {
                line.push(this.stars[Math.floor(Math.random() * this.stars.length)]);
            }
            this.constellations.push(line);
        }

        this.bodies = [];
        this.resetSimulation();
    }
    
    getStarColor(t) {
        if (t < 0.2) return '#ffcccc'; // M class
        if (t < 0.4) return '#ffddaa'; // K class
        if (t < 0.6) return '#ffffcc'; // G class
        if (t < 0.8) return '#ccffff'; // A class
        return '#bbbbff'; // O/B class
    }

    resetSimulation() {
        this.bodies = [];
        this.trails = {};
        this.time = 0;

        if (this.state.system === 'Keplerian (Heliocentric)') {
            // Sun
            this.bodies.push({ id: 'Sun', color: '#ffcc00', radius: 40, a: 0, e: 0, speed: 0, parent: null, phase: 0 });
            
            if (this.state.focus === 'Terra & Luna') {
                this.bodies.push({ id: 'Earth', color: '#4488ff', radius: 15, a: 200, e: 0.016, speed: 0.5, parent: 'Sun', phase: 0, type: 'procedural' });
                this.bodies.push({ id: 'Moon', color: '#cccccc', radius: 4, a: 30, e: 0.054, speed: 6.0, parent: 'Earth', phase: 0 });
            } else if (this.state.focus === 'Mars (Retrograde Motion)') {
                this.bodies.push({ id: 'Earth', color: '#4488ff', radius: 15, a: 200, e: 0.016, speed: 0.5, parent: 'Sun', phase: 0 });
                this.bodies.push({ id: 'Mars', color: '#ff5533', radius: 10, a: 300, e: 0.093, speed: 0.3, parent: 'Sun', phase: Math.PI / 4, type: 'procedural' });
            } else if (this.state.focus === 'Jupiter & 4 Galilean Moons') {
                this.bodies.push({ id: 'Jupiter', color: '#ddaadd', radius: 30, a: 500, e: 0.048, speed: 0.1, parent: 'Sun', phase: Math.PI / 2, type: 'procedural' });
                this.bodies.push({ id: 'Io', color: '#ffffaa', radius: 3, a: 45, e: 0.004, speed: 10.0, parent: 'Jupiter', phase: 0 });
                this.bodies.push({ id: 'Europa', color: '#eeeeff', radius: 2.5, a: 60, e: 0.009, speed: 5.0, parent: 'Jupiter', phase: 1 });
                this.bodies.push({ id: 'Ganymede', color: '#cccccc', radius: 4, a: 80, e: 0.001, speed: 2.5, parent: 'Jupiter', phase: 2 });
                this.bodies.push({ id: 'Callisto', color: '#aa9988', radius: 3.5, a: 110, e: 0.007, speed: 1.1, parent: 'Jupiter', phase: 3 });
            }
        } else {
            // Ptolemaic
            this.bodies.push({ id: 'Earth (Center)', color: '#4488ff', radius: 20, deferent: 0, epicycle: 0, speed: 0, e_speed: 0, phase: 0, e_phase: 0 });
            
            if (this.state.focus === 'Mars (Retrograde Motion)') {
                this.bodies.push({ id: 'Mars', color: '#ff5533', radius: 10, deferent: 300, epicycle: 150, speed: 0.2, e_speed: 0.5, phase: 0, e_phase: 0 });
            } else if (this.state.focus === 'Jupiter & 4 Galilean Moons') {
                this.bodies.push({ id: 'Jupiter', color: '#ddaadd', radius: 30, deferent: 400, epicycle: 60, speed: 0.1, e_speed: 0.6, phase: 0, e_phase: 0 });
            } else {
                this.bodies.push({ id: 'Sun', color: '#ffcc00', radius: 30, deferent: 200, epicycle: 0, speed: 0.5, e_speed: 0, phase: 0, e_phase: 0 });
            }
        }

        this.bodies.forEach(b => {
            this.trails[b.id] = [];
            b.x = 0; b.y = 0;
        });
    }

    resize(width, height, dpr) {
        this.width = width;
        this.height = height;
        this.dpr = dpr;
    }

    update(dt) {
        const adjustedDt = dt * this.state.timeSpeed;
        this.time += adjustedDt;

        this.bodies.forEach(b => {
            if (this.state.system === 'Keplerian (Heliocentric)') {
                let currentPhase = b.phase + b.speed * this.time;
                let r = b.a * (1 - b.e * b.e) / (1 + b.e * Math.cos(currentPhase));
                let lx = Math.cos(currentPhase) * r;
                let ly = Math.sin(currentPhase) * r;
                
                if (b.parent) {
                    let parent = this.bodies.find(p => p.id === b.parent);
                    b.x = parent.x + lx;
                    b.y = parent.y + ly;
                } else {
                    b.x = lx;
                    b.y = ly;
                }
            } else {
                let d_phase = b.phase + b.speed * this.time;
                let e_phase = b.e_phase + b.e_speed * this.time;
                
                let dx = Math.cos(d_phase) * b.deferent;
                let dy = Math.sin(d_phase) * b.deferent;
                let ex = Math.cos(e_phase) * b.epicycle;
                let ey = Math.sin(e_phase) * b.epicycle;
                
                b.x = dx + ex;
                b.y = dy + ey;
                b.dx = dx;
                b.dy = dy; // for drawing deferent
            }
            
            if (this.trails[b.id]) {
                this.trails[b.id].push({ x: b.x, y: b.y });
                if (this.trails[b.id].length > this.state.trailLength) {
                    this.trails[b.id].shift();
                }
            }
        });
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.translate(this.width / 2 + this.camera.x, this.height / 2 + this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        // Draw stars
        this.stars.forEach(s => {
            let twinkle = Math.sin(this.time * s.speed + s.phase) * 0.5 + 0.5;
            ctx.globalAlpha = s.brightness * twinkle;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = 1.0;

        if (this.state.showConstellations) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1 / this.camera.zoom;
            this.constellations.forEach(c => {
                ctx.beginPath();
                ctx.moveTo(c[0].x, c[0].y);
                for (let i = 1; i < c.length; i++) {
                    ctx.lineTo(c[i].x, c[i].y);
                }
                ctx.stroke();
            });
        }

        // Draw Trails & Epicycles
        this.bodies.forEach(b => {
            if (this.state.system === 'Ptolemaic (Epicycles)' && this.state.showEpicycles && b.deferent > 0) {
                ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(0, 0, b.deferent, 0, Math.PI * 2);
                ctx.stroke();
                
                if (b.epicycle > 0) {
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
                    ctx.beginPath();
                    ctx.arc(b.dx, b.dy, b.epicycle, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(b.dx, b.dy);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            let trail = this.trails[b.id];
            if (trail && trail.length > 1) {
                ctx.strokeStyle = b.color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 2 / this.camera.zoom;
                ctx.beginPath();
                ctx.moveTo(trail[0].x, trail[0].y);
                for (let i = 1; i < trail.length; i++) {
                    ctx.lineTo(trail[i].x, trail[i].y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        });

        // Draw Bodies
        this.bodies.forEach(b => {
            if (b.type === 'procedural') {
                this.drawProceduralPlanet(ctx, b);
            } else {
                if (this.state.showAtmosphere) {
                    let grad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.8, b.x, b.y, b.radius * 1.5);
                    grad.addColorStop(0, b.color);
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = b.color;
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.fillStyle = '#fff';
            ctx.font = `${12 / this.camera.zoom}px Arial`;
            ctx.fillText(b.id, b.x + b.radius + 5, b.y + 4);
        });

        ctx.restore();
    }

    drawProceduralPlanet(ctx, b) {
        // Simplified procedural planet rendering
        ctx.save();
        ctx.translate(b.x, b.y);
        
        if (this.state.showAtmosphere) {
            let grad = ctx.createRadialGradient(0, 0, b.radius * 0.9, 0, 0, b.radius * 1.4);
            grad.addColorStop(0, b.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, b.radius * 1.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.clip();

        // Base color
        ctx.fillStyle = b.color;
        ctx.fill();

        // Pseudo-texture / bands / clouds
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = -b.radius; i < b.radius; i += b.radius / 4) {
            let w = Math.sqrt(b.radius * b.radius - i * i);
            let offset = Math.sin(this.time * 2 + i) * 10;
            ctx.fillRect(-w + offset, i, w * 2, b.radius / 8);
        }

        // Fake lambertian shading
        let sunDx = -b.x;
        let sunDy = -b.y;
        let sunDist = Math.sqrt(sunDx * sunDx + sunDy * sunDy);
        
        if (sunDist > 0) {
            let shadowGrad = ctx.createLinearGradient(-sunDx/sunDist * b.radius, -sunDy/sunDist * b.radius, sunDx/sunDist * b.radius, sunDy/sunDist * b.radius);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
            
            ctx.fillStyle = shadowGrad;
            ctx.fillRect(-b.radius, -b.radius, b.radius * 2, b.radius * 2);
        }

        ctx.restore();
    }

    reset() {
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.resetSimulation();
    }

    destroy() {
        this.uiElements.forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        this.uiElements = [];
    }

    getEntityCount() {
        return this.stars.length + this.bodies.length;
    }

    onMouseDown(pos) {
        this.isDragging = true;
        this.lastMouse = { ...pos };
    }

    onMouseMove(pos) {
        if (this.isDragging) {
            this.camera.x += (pos.x - this.lastMouse.x);
            this.camera.y += (pos.y - this.lastMouse.y);
            this.lastMouse = { ...pos };
        }
    }

    onMouseUp(pos) {
        this.isDragging = false;
    }

    onWheel(deltaY) {
        let zoomSpeed = 0.1;
        if (deltaY > 0) {
            this.camera.zoom *= (1 - zoomSpeed);
        } else {
            this.camera.zoom *= (1 + zoomSpeed);
        }
    }

    onKeyDown(key) {
        if (key === 'r') this.reset();
    }
}
