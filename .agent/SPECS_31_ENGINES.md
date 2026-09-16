# Pliny Game Lab - 31 Engine Architectural Specifications

This document defines the implementation specifications for the remaining 31 engines in the Pliny Game Lab suite. All implementations must adhere to the standard Hub interface, ensure a safe headless DOM guard, and utilize zero external dependencies (pure HTML5 Canvas/WebGL/WebAudio API).

---

## III. Mechanica

### 1. Horologium (Water Clock)
- **Simulation Model**: Fluid dynamics and discrete mechanical stepping. A main reservoir drains at a constant rate $dV/dt = -k \sqrt{h}$, which turns gears and floats a marker.
- **Rendering**: Cyber-Classical styling (Gold `#FFD700`, Cyan `#00FFFF`, Deep Blue `#000033`). Semi-transparent water level and rotating cogwheels.
- **Controls**: Sliders for `Drain Rate` and `Initial Volume`. Button for `Reset Clock`.
- **Entity Count**: Number of distinct visible components (water droplets + gears + markers).

### 2. Antikythera (Mechanism)
- **Simulation Model**: Epicyclic gearing. Multiple interconnected gears with varying teeth counts simulating celestial positions. $\theta_{gear_{n+1}} = - \theta_{gear_n} \times (T_n / T_{n+1})$.
- **Rendering**: Complex interlocking circles with teeth markers. Bronze/Copper `#B87333` and Cyber-Teal `#008080` glowing lines.
- **Controls**: Slider for `Time Speed`. Toggles for `Show Moon Phase` and `Show Sun Position`.
- **Entity Count**: Number of active gears + indicator dials.

---

## IV. Cosmographia

### 3. Aurora (Borealis)
- **Simulation Model**: Perlin noise and sine wave interference determining particle color and alpha intensity in a vector field based on solar wind intensity.
- **Rendering**: Additive blending. Soft gradients of neon green `#39FF14`, purple `#800080`, and cyber-blue `#00FFFF` fading into a dark sky backdrop.
- **Controls**: Sliders for `Solar Wind Strength`, `Color Shift`, and `Turbulence`.
- **Entity Count**: Number of rendered aurora particle strips/nodes.

### 4. Cometa (Comet Trajectory)
- **Simulation Model**: N-body gravitational simulation. $F = G(m_1m_2)/r^2$. Comet sheds particles proportional to proximity to the central star.
- **Rendering**: Glowing head with a trailing particle system. Deep space black with blinding white/blue `#E0FFFF` core and tail.
- **Controls**: Sliders for `Comet Velocity` and `Star Mass`. Button for `Launch New Comet`.
- **Entity Count**: Number of celestial bodies + active tail particles.

---

## V. Fabula

### 5. Colosseum (Gladiator Arena)
- **Simulation Model**: Boids-based crowd dynamics for spectators, and simple state-machine AI for gladiators (seek, attack, evade).
- **Rendering**: Top-down view. Sand color `#C2B280`, Roman red `#CE2029`, and Cyber-gold highlights for weapons.
- **Controls**: Toggles for `Add Lion`, `Add Gladiator`. Slider for `Crowd Excitement`.
- **Entity Count**: Gladiators + Lions + Spectator aggregate nodes.

### 6. Trireme (Naval Battle)
- **Simulation Model**: Kinematic ship movement with inertia and row-sync mechanics. Oar timing dictates acceleration.
- **Rendering**: Ocean wave shader (sine waves), wooden ships `#8B4513` with glowing wake trails.
- **Controls**: Slider for `Rowing Cadence`. Toggles for `Ramming Speed` and `Fire Arrows`.
- **Entity Count**: Number of ships + oars + arrows.

### 7. Chariot (Circus Maximus)
- **Simulation Model**: Vehicle physics on a track. Centripetal force and friction limits. Oversteering causes drift or crash.
- **Rendering**: Elliptical track with sand particles. Glowing horse trails (Tron-style chariots). Neon purple and cyan accents.
- **Controls**: Sliders for `Horse Speed` and `Turn Sharpness`.
- **Entity Count**: Chariots + sand particles + track markers.

### 8. Oraculum (Delphic Prophecy)
- **Simulation Model**: Chaotic pendulum or double pendulum representing unpredictable prophecies, trailing a path that forms runes.
- **Rendering**: Mystical vapor (smoke particles) and glowing gold/green rune traces on a dark altar background.
- **Controls**: Button for `Ask Question` (adds impulse). Slider for `Vapor Density`.
- **Entity Count**: Pendulum nodes + rune trail segments + smoke particles.

---

## VI. Mathematica

### 9. Euclid (Geometric Construction)
- **Simulation Model**: Intersecting lines and circles to find precise geometric points. Constraint-based solver for straightedge and compass.
- **Rendering**: Crisp vector lines. Blueprint aesthetic (Deep blue background, bright white/cyan lines, glowing intersection points).
- **Controls**: Buttons for `Draw Line`, `Draw Circle`, `Find Intersection`.
- **Entity Count**: Total lines + circles + points.

### 10. Archimedes Spiral
- **Simulation Model**: Polar coordinate equation $r = a + b\theta$. Animated growth of the spiral over time.
- **Rendering**: Continuous line drawing with color cycling (HSL shift based on angle $\theta$).
- **Controls**: Sliders for `Parameter A (Offset)`, `Parameter B (Spacing)`, and `Growth Speed`.
- **Entity Count**: Number of spiral segments rendered.

### 11. Eratosthenes (Prime Sieve)
- **Simulation Model**: Algorithmic step-through of the Sieve of Eratosthenes. Number grid state updates.
- **Rendering**: Hexagonal or square grid of numbers. Primes glow Cyber-Gold, composites fade to dark gray.
- **Controls**: Slider for `Grid Size` (up to 1000). Button to `Step Algorithm` or `Auto-Play`.
- **Entity Count**: Total numbers in the grid.

### 12. Pythagoras (Tree & Theorem)
- **Simulation Model**: Fractal generation of the Pythagorean tree. Recursive squares and right triangles.
- **Rendering**: Neon geometric shapes. The depth of recursion maps to color (cyan to magenta).
- **Controls**: Slider for `Recursion Depth` and `Angle`.
- **Entity Count**: Number of squares and triangles drawn.

---

## VII. Mare

### 13. Mare Nostrum (Mediterranean Trade)
- **Simulation Model**: Network graph routing. Ships travel between port nodes along shortest paths (Dijkstra's).
- **Rendering**: Stylized map. Glowing nodes (ports) and moving light pulses (ships) along bezier curves.
- **Controls**: Sliders for `Trade Volume` and `Pirate Threat`. Toggles for `Show Routes`.
- **Entity Count**: Ports + active ships + route lines.

### 14. Pharos (Lighthouse of Alexandria)
- **Simulation Model**: Raycasting from a rotating central point, intersecting with distant ship polygons.
- **Rendering**: Fog effect. A sweeping volumetric light beam (yellow/white) illuminating dark silhouettes.
- **Controls**: Sliders for `Rotation Speed`, `Beam Width`, and `Fog Density`.
- **Entity Count**: Lighthouse + ships + raycast segments.

### 15. Coral Reef
- **Simulation Model**: Cellular automata (similar to Game of Life but multi-state) simulating coral growth and competition.
- **Rendering**: Vibrant neon pinks, greens, and blues `#FF1493`, `#00FF00` on a dark blue background.
- **Controls**: Buttons for `Seed Coral A`, `Seed Coral B`. Slider for `Growth Rate`.
- **Entity Count**: Active living coral cells.

### 16. Nautilus (Logarithmic Spiral)
- **Simulation Model**: Growth based on the golden ratio and logarithmic spiral $r = ae^{b\theta}$. Fluid resistance on the shell.
- **Rendering**: Translucent segmented shell structure. Iridescent shading (pearlescent cyber-colors).
- **Controls**: Sliders for `Chamber Growth` and `Current Strength`.
- **Entity Count**: Shell chambers + water bubbles.

---

## VIII. Architectura

### 17. Forum Builder
- **Simulation Model**: Grid-based placement and simple economy/adjacency bonuses for placed buildings.
- **Rendering**: Isometric grid. Neon wireframe buildings (Temples, Basilicas, Markets).
- **Controls**: Buttons to select `Temple`, `Market`, `Road`. Button for `Clear`.
- **Entity Count**: Number of placed structures.

### 18. Arch Vault (Keystone Physics)
- **Simulation Model**: Rigid body physics (stacked blocks). Gravity and lateral friction. Removing blocks tests stability.
- **Rendering**: Stone textures with neon stress indicators (green = stable, red = breaking).
- **Controls**: Buttons to `Build Arch`, `Remove Block`. Slider for `Gravity`.
- **Entity Count**: Number of stone blocks.

### 19. Opus Caementicium (Roman Concrete)
- **Simulation Model**: Particle-based fluid to solid transition (viscosity increasing over time to form a solid matrix).
- **Rendering**: Gray/White particles mixing with volcanic ash (red particles), hardening into a solid block.
- **Controls**: Sliders for `Ash Ratio`, `Water`, and `Curing Time`.
- **Entity Count**: Concrete particles.

### 20. Thermae (Baths Heating)
- **Simulation Model**: Heat diffusion via hypocaust system. 2D heat equation $\partial u/\partial t = \alpha \nabla^2 u$.
- **Rendering**: Thermal heatmap (Blue -> Red -> Yellow -> White) over a floorplan.
- **Controls**: Sliders for `Furnace Heat` and `Water Flow`.
- **Entity Count**: Grid cells in the heat simulation.

### 21. Pantheon (Dome Lighting)
- **Simulation Model**: Sun path tracking and raymarching/shadow projection through the Oculus.
- **Rendering**: Inside the dome. High-contrast god rays casting an elliptical light pool on the floor/walls.
- **Controls**: Sliders for `Time of Day` and `Day of Year`.
- **Entity Count**: Light rays + architectural vertices.

---

## IX. Alchemia

### 22. Vitrum (Glassblowing)
- **Simulation Model**: Soft body physics. Expanding a mesh via internal pressure, cooling increases rigidity.
- **Rendering**: Glowing orange/yellow blob that cools into transparent cyan/glassy material.
- **Controls**: Buttons to `Blow Air`, `Spin`. Slider for `Temperature`.
- **Entity Count**: Vertices in the soft body mesh.

### 23. Metallum (Transmutation)
- **Simulation Model**: Particle interaction based on affinity rules. Lead particles + Philosopher's Stone particles = Gold.
- **Rendering**: Swirling particles in a crucible. Lead (dark gray) turning to glowing Gold `#FFD700`.
- **Controls**: Sliders for `Heat`, `Stir Speed`. Button to `Add Stone`.
- **Entity Count**: Total particles in the crucible.

### 24. Pigmentum (Color Mixing)
- **Simulation Model**: Subtractive color mixing (CMYK equivalent with historical pigments: Tyrian Purple, Egyptian Blue).
- **Rendering**: Fluid ink bleed effect using blur and threshold filters (metaballs).
- **Controls**: Buttons to drop `Cyan`, `Magenta`, `Yellow`. Slider for `Viscosity`.
- **Entity Count**: Ink droplets/metaballs.

### 25. Hermetica (Astrological Symbols)
- **Simulation Model**: Orbital nodes drawing complex spirograph patterns based on frequency ratios.
- **Rendering**: High-tech mystical HUD. Neon glowing paths fading out slowly.
- **Controls**: Sliders for `Inner Radius`, `Outer Radius`, `Node Speed`.
- **Entity Count**: Trajectory trail segments + nodes.

### 26. Electrum (Alloy Dynamics)
- **Simulation Model**: Phase separation simulation (Cahn-Hilliard equation) for Gold and Silver mixing.
- **Rendering**: Cellular level. Gold and Silver domains forming labyrinthine patterns.
- **Controls**: Slider for `Gold/Silver Ratio` and `Cooling Rate`.
- **Entity Count**: Simulation grid cells.

---

## X. Strategia

### 27. Testudo (Shield Formation)
- **Simulation Model**: Flocking behavior with a tight cohesion constraint. Agents block incoming projectile vectors.
- **Rendering**: Top-down view. Rectangular shield units (roman red/iron) deflecting neon yellow arrows.
- **Controls**: Toggles for `Form Testudo`, `Break Formation`. Button `Fire Arrows`.
- **Entity Count**: Soldiers + incoming arrows.

### 28. Siege Tower
- **Simulation Model**: 2D inverse kinematics and rigid body physics for a tower rolling on uneven terrain towards a wall.
- **Rendering**: Wireframe/Silhouette of a wooden tower and wall. Cyberpunk neon outlines.
- **Controls**: Sliders for `Push Force` and `Terrain Roughness`.
- **Entity Count**: Rigid body parts of the tower + terrain segments.

### 29. Hoplite Phalanx
- **Simulation Model**: Vector field pathfinding. Agents move in rigid lines, pushing against an opposing force field.
- **Rendering**: Dense blocks of circles with protruding lines (spears). Blue vs Red neon.
- **Controls**: Sliders for `Formation Width` and `Advance Speed`.
- **Entity Count**: Individual hoplite units.

### 30. Scorpio (Ballista Variant)
- **Simulation Model**: Tension and torsion physics. Projectile trajectory with air resistance. $F = -kx$.
- **Rendering**: Detailed side-view of a torsion engine firing glowing bolts across the screen.
- **Controls**: Sliders for `Torsion Level` and `Elevation Angle`. Button `Fire`.
- **Entity Count**: Engine components + active bolts.

### 31. Signal Fire (Network)
- **Simulation Model**: Signal propagation across a network graph with delay and probability of failure (weather).
- **Rendering**: Topographical map. Mountain peaks lighting up sequentially with glowing orange fires.
- **Controls**: Slider for `Weather Interference`. Button to `Light Initial Beacon`.
- **Entity Count**: Beacons + signal transmission lines.
