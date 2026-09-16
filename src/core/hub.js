// Pliny Game Lab — 50 Engines Master Coordinator
// Manages 10 Thematic Pavilions and 50 Roman / Natural History Simulations

import { soundMaster } from "./sound.js";

export const PAVILIONS = [
  { id: "ignis", name: "I. Ignis & Terra (Earth & Fire)", games: ["vesuvius", "geyser", "caverna", "terrae_motus", "aurum"] },
  { id: "bestiarium", name: "II. Bestiarium & Silva (ALife & Botany)", games: ["bestiarium", "myrmex", "apis", "hydra", "silva"] },
  { id: "mechanica", name: "III. Mechanica & Machina (Roman Engineering)", games: ["mechanica", "aqueduct", "ballista", "horologium", "antikythera"] },
  { id: "cosmographia", name: "IV. Cosmographia & Astra (Celestial Mechanics)", games: ["cosmographia", "solstitium", "aurora", "cometa", "armilla"] },
  { id: "fabula", name: "V. Fabula & Arena (Mythology & Games)", games: ["labyrinthus", "colosseum", "trireme", "chariot", "oraculum"] },
  { id: "mathematica", name: "VI. Mathematica & Geometria (Greek Math)", games: ["euclid", "archimedes_spiral", "eratosthenes", "pythagoras", "fractal_roman"] },
  { id: "mare", name: "VII. Mare Nostrum (Ocean & Marine)", games: ["scylla_charybdis", "mare_nostrum", "pharos", "coral_reef", "nautilus"] },
  { id: "architectura", name: "VIII. Architectura & Structura (Roman Architecture)", games: ["forum_builder", "arch_vault", "opus_caementicium", "thermae", "pantheon"] },
  { id: "alchemia", name: "IX. Alchemia & Mineralia (Materials Science)", games: ["vitrum", "metallum", "pigmentum", "hermetica", "electrum"] },
  { id: "strategia", name: "X. Strategia & Legio (Military Tactics)", games: ["testudo", "siege_tower", "hoplite_phalanx", "scorpio", "signal_fire"] }
];

export const DEMOS = {
  // Pavilion I: Ignis & Terra
  vesuvius: {
    id: "vesuvius",
    name: "Vesuvius (Volcanology Sim)",
    pavilionId: "ignis",
    pavilionName: "Pavilion I: Ignis & Terra",
    path: "../demos/vesuvius/vesuvius.js",
    exportName: "VesuviusEngine",
    desc: "Thermodynamic cellular automata falling-sand and magma simulation with Plinian eruption dynamics.",
    hint: "L-Click: Deposit material | R-Click: Detonate/Heat | Scroll: Brush Size"
  },
  geyser: {
    id: "geyser",
    name: "Geyser (Hydrothermal Vent)",
    pavilionId: "ignis",
    pavilionName: "Pavilion I: Ignis & Terra",
    path: "../demos/geyser/geyser.js",
    exportName: "GeyserEngine",
    desc: "Subterranean thermodynamic chamber with boiling cycles, steam plumes, and mineral sinter accretion.",
    hint: "Click: Add heat core | Drag: Sculpt fissure walls | Space: Force steam eruption"
  },
  caverna: {
    id: "caverna",
    name: "Caverna (Karst & Speleothems)",
    pavilionId: "ignis",
    pavilionName: "Pavilion I: Ignis & Terra",
    path: "../demos/caverna/caverna.js",
    exportName: "CavernaEngine",
    desc: "Limestone dissolution, acidic mineral drips, stalactite/stalagmite growth, and underground river erosion.",
    hint: "Click: Drill drip source | Shift+Click: Acid surge | Drag: Carve subterranean limestone"
  },
  terrae_motus: {
    id: "terrae_motus",
    name: "Terrae Motus (Seismic Dynamics)",
    pavilionId: "ignis",
    pavilionName: "Pavilion I: Ignis & Terra",
    path: "../demos/terrae_motus/terrae_motus.js",
    exportName: "TerraeMotusEngine",
    desc: "Tectonic plate fault friction slip, P-wave and S-wave elastodynamic propagation, and Roman basilica resonance collapse.",
    hint: "Click & Drag: Build tectonic shear strain | Space: Release earthquake fault slip | 1-4: Colonnade presets"
  },
  aurum: {
    id: "aurum",
    name: "Aurum (Alluvial Gold Sluice)",
    pavilionId: "ignis",
    pavilionName: "Pavilion I: Ignis & Terra",
    path: "../demos/aurum/aurum.js",
    exportName: "AurumEngine",
    desc: "Hydraulic gold panning and riffle sluice box physics. Heavy gold nugget deposition vs light quartz sediment.",
    hint: "Click & Drag: Pan tilt / Agitate slurry | Scroll: Water feed rate | S: Drop alluvial paydirt"
  },

  // Pavilion II: Bestiarium & Silva
  bestiarium: {
    id: "bestiarium",
    name: "Bestiarium (ALife Ecosystem)",
    pavilionId: "bestiarium",
    pavilionName: "Pavilion II: Bestiarium & Silva",
    path: "../demos/bestiarium/bestiarium.js",
    exportName: "BestiariumEngine",
    desc: "Autonomous boids flocking, predator-prey Craig Reynolds dynamics, sensory fields, and metabolic reproduction.",
    hint: "Click: Spawn Food / Creature | Space: Add Apex Griffin Predator"
  },
  myrmex: {
    id: "myrmex",
    name: "Myrmex (Ant Colony Optimization)",
    pavilionId: "bestiarium",
    pavilionName: "Pavilion II: Bestiarium & Silva",
    path: "../demos/myrmex/myrmex.js",
    exportName: "MyrmexEngine",
    desc: "Agent-based ant superorganism. Foraging and alarm pheromone diffusion, tunnel excavation, and food gathering.",
    hint: "Click: Drop food sugar pile | Right-Click: Drop obstacle rock | Space: Alarm pheromone pulse"
  },
  apis: {
    id: "apis",
    name: "Apis (Beehive & Waggle Dance)",
    pavilionId: "bestiarium",
    pavilionName: "Pavilion II: Bestiarium & Silva",
    path: "../demos/apis/apis.js",
    exportName: "ApisEngine",
    desc: "Hexagonal honeycomb wax building cellular automata, pollen foraging boids, and waggle dance vector communication.",
    hint: "Click: Plant nectar flower | Drag: Guide bee scout | Space: Queen royal jelly pulse"
  },
  hydra: {
    id: "hydra",
    name: "Hydra (Soft-Body Bioluminescence)",
    pavilionId: "bestiarium",
    pavilionName: "Pavilion II: Bestiarium & Silva",
    path: "../demos/hydra/hydra.js",
    exportName: "HydraEngine",
    desc: "Multi-headed regenerative soft-body tentacle physics with inverse kinematics, muscle contraction, and bioluminescent fluid.",
    hint: "Click: Sever head (spawns 2 new heads!) | Drag: Lure tentacles with bioluminescent bait"
  },
  silva: {
    id: "silva",
    name: "Silva (Space-Colonization Botany)",
    pavilionId: "bestiarium",
    pavilionName: "Pavilion II: Bestiarium & Silva",
    path: "../demos/silva/silva.js",
    exportName: "SilvaEngine",
    desc: "Algorithmic space-colonization tree growth, auxin hormone flow, leaf canopy light competition, and annual rings.",
    hint: "Click: Scatter light attractors | Drag: Prune branches | Space: Advance seasonal growth cycle"
  },

  // Pavilion III: Mechanica & Machina
  mechanica: {
    id: "mechanica",
    name: "Mechanica (Verlet Automata)",
    pavilionId: "mechanica",
    pavilionName: "Pavilion III: Mechanica & Machina",
    path: "../demos/mechanica/mechanica.js",
    exportName: "MechanicaEngine",
    desc: "Verlet integration physics sandbox. Archimedean screws, catapult linkages, pendulum arrays, and Hero aeolipile.",
    hint: "Click & Drag: Move bodies | Shift + Drag: Sever constraints | G: Toggle Gravity"
  },
  aqueduct: {
    id: "aqueduct",
    name: "Aqueduct (Hydraulic Incline)",
    pavilionId: "mechanica",
    pavilionName: "Pavilion III: Mechanica & Machina",
    path: "../demos/aqueduct/aqueduct.js",
    exportName: "AqueductEngine",
    desc: "Roman hydraulic channel fluid simulation. Manning formula gradient flow, siphon pressure, and sediment settling settling basins.",
    hint: "Click & Drag: Adjust channel slope / piers | Click: Toggle sluice gate | Space: Water surge"
  },
  ballista: {
    id: "ballista",
    name: "Ballista (Torsion Siege Weapon)",
    pavilionId: "mechanica",
    pavilionName: "Pavilion III: Mechanica & Machina",
    path: "../demos/ballista/ballista.js",
    exportName: "BallistaEngine",
    desc: "Torsion spring elastodynamics, winch tension winding, aerodynamic projectile drag, and destructible stone fortifications.",
    hint: "Drag & Pull: Crank winch back & aim | Release: Fire bolt | Scroll: Change ammo (Lead/Fire/Battering)"
  },
  horologium: {
    id: "horologium",
    name: "Horologium (Vitruvian Water Clock)",
    pavilionId: "mechanica",
    pavilionName: "Pavilion III: Mechanica & Machina",
    path: "../demos/horologium/horologium.js",
    exportName: "HorologiumEngine",
    desc: "Ctesibius clepsydra water clock with float escapement, rotary gear transmission, and astronomical bronze dial.",
    hint: "Click: Adjust float orifice valve | Drag: Spin astronomical gear train | Space: Trigger chime"
  },
  antikythera: {
    id: "antikythera",
    name: "Antikythera (Cosmic Gear Calculator)",
    pavilionId: "mechanica",
    pavilionName: "Pavilion III: Mechanica & Machina",
    path: "../demos/antikythera/antikythera.js",
    exportName: "AntikytheraEngine",
    desc: "Intermeshing differential gear train mechanical computer predicting Metonic, Saros eclipse, and Olympic game cycles.",
    hint: "Drag: Rotate main drive crown gear | Click Gear: Inspect tooth ratio & astronomy cycle"
  },

  // Pavilion IV: Cosmographia & Astra
  cosmographia: {
    id: "cosmographia",
    name: "Cosmographia (Celestial Spheres)",
    pavilionId: "cosmographia",
    pavilionName: "Pavilion IV: Cosmographia & Astra",
    path: "../demos/cosmographia/cosmographia.js",
    exportName: "CosmographiaEngine",
    desc: "Ptolemaic epicycles, Keplerian orbital resonance, and procedural spherical planetary raymarching with day-night terminator.",
    hint: "Click & Drag: Rotate Sphere | Scroll: Zoom Orbits | T: Accelerate Time"
  },
  solstitium: {
    id: "solstitium",
    name: "Solstitium (Solar Analemma & Sundial)",
    pavilionId: "cosmographia",
    pavilionName: "Pavilion IV: Cosmographia & Astra",
    path: "../demos/solstitium/solstitium.js",
    exportName: "SolstitiumEngine",
    desc: "Earth axial tilt, solar declination, figure-8 analemma curve tracing, and shadow casting gnomon sundial.",
    hint: "Drag: Scrub time of day | Scroll: Scrub calendar month | Click: Calibrate latitude dial"
  },
  aurora: {
    id: "aurora",
    name: "Aurora (Geomagnetic Plasma Field)",
    pavilionId: "cosmographia",
    pavilionName: "Pavilion IV: Cosmographia & Astra",
    path: "../demos/aurora/aurora.js",
    exportName: "AuroraEngine",
    desc: "Planetary dipole magnetic field lines, Lorentz force charged particle trapping, and curtains of atmospheric spectral emission.",
    hint: "Click: Inject solar flare coronal mass ejection | Drag: Tilt magnetic dipole axis"
  },
  cometa: {
    id: "cometa",
    name: "Cometa (Cometary Tail & Grav-Slingshot)",
    pavilionId: "cosmographia",
    pavilionName: "Pavilion IV: Cosmographia & Astra",
    path: "../demos/cometa/cometa.js",
    exportName: "CometaEngine",
    desc: "N-body gravity simulation with solar radiation pressure, outgassing volatile sublimation, and dual ion/dust tails.",
    hint: "Click & Drag: Launch comet vector | Click Sun/Planet: Alter mass | Space: Reset trajectory"
  },
  armilla: {
    id: "armilla",
    name: "Armilla (3D Armillary Sphere)",
    pavilionId: "cosmographia",
    pavilionName: "Pavilion IV: Cosmographia & Astra",
    path: "../demos/armilla/armilla.js",
    exportName: "ArmillaEngine",
    desc: "Interactive 3D wireframe brass armillary sphere: meridian ring, celestial equator, zodiac ecliptic, and colures.",
    hint: "Click & Drag: Rotate 3D armillary sphere | Scroll: Zoom | Click Ring: Isolate celestial coordinate"
  },

  // Pavilion V: Fabula & Arena
  labyrinthus: {
    id: "labyrinthus",
    name: "Labyrinthus (3D Catacomb Crawler)",
    pavilionId: "fabula",
    pavilionName: "Pavilion V: Fabula & Arena",
    path: "../demos/labyrinthus/labyrinthus.js",
    exportName: "LabyrinthusEngine",
    desc: "Procedural Roman catacomb labyrinth rendered with classic DDA raycasting. Autonomous minotaurs and WebAudio chiptune.",
    hint: "WASD / Arrows: Move & Turn | Space: Cast Arcane Bolt | M: Minimap"
  },
  colosseum: {
    id: "colosseum",
    name: "Colosseum (Gladiator Combat Sim)",
    pavilionId: "fabula",
    pavilionName: "Pavilion V: Fabula & Arena",
    path: "../demos/colosseum/colosseum.js",
    exportName: "ColosseumEngine",
    desc: "Tactical gladiatorial arena combat. Retiarius (net and trident) vs Murmillo (scutum and gladius) with crowd favor dynamics.",
    hint: "WASD: Move gladiator | Click: Attack/Thrust | Space: Cast net / Shield bash"
  },
  trireme: {
    id: "trireme",
    name: "Trireme (Naval Ramming Fleet)",
    pavilionId: "fabula",
    pavilionName: "Pavilion V: Fabula & Arena",
    path: "../demos/trireme/trireme.js",
    exportName: "TriremeEngine",
    desc: "Hydrodynamic ship maneuvering, synchronized rower stroke cadence, wake displacement, and bronze ram collisions.",
    hint: "A/D: Steer rudder | W/S: Stroke cadence | Space: Full ramming speed! | Click: Fire ballista"
  },
  chariot: {
    id: "chariot",
    name: "Chariot (Circus Maximus Grand Prix)",
    pavilionId: "fabula",
    pavilionName: "Pavilion V: Fabula & Arena",
    path: "../demos/chariot/chariot.js",
    exportName: "ChariotEngine",
    desc: "Quad-horse chariot centrifugal physics, sand drift, wheel whip collisions, and high-speed turns around the spina.",
    hint: "Arrows/WASD: Steer & Whip horses | Space: Tight drift around metae turning post"
  },
  oraculum: {
    id: "oraculum",
    name: "Oraculum (Delphic Pythia Smoke Oracle)",
    pavilionId: "fabula",
    pavilionName: "Pavilion V: Fabula & Arena",
    path: "../demos/oraculum/oraculum.js",
    exportName: "OraculumEngine",
    desc: "Navier-Stokes smoke fluid dynamics with procedural Latin/Greek prophecy generation and mystical acoustic drone resonance.",
    hint: "Click & Drag: Stir sacred ethylene fumes | Space: Chant for new hexameter prophecy"
  },

  // Pavilion VI: Mathematica & Geometria
  euclid: {
    id: "euclid",
    name: "Euclid (Compass & Straightedge)",
    pavilionId: "mathematica",
    pavilionName: "Pavilion VI: Mathematica & Geometria",
    path: "../demos/euclid/euclid.js",
    exportName: "EuclidEngine",
    desc: "Interactive Euclidean geometry construction engine with automatic intersection solver and golden ratio demonstrations.",
    hint: "Click: Place Point | Drag: Draw Line / Circle | 1-5: Theorem presets (Pythagoras, Inscribed Circle)"
  },
  archimedes_spiral: {
    id: "archimedes_spiral",
    name: "Archimedes Spiral (Golden Harmonics)",
    pavilionId: "mathematica",
    pavilionName: "Pavilion VI: Mathematica & Geometria",
    path: "../demos/archimedes_spiral/archimedes_spiral.js",
    exportName: "ArchimedesSpiralEngine",
    desc: "Parametric polar spiral geometry: Archimedean, Logarithmic (spira mirabilis), Fermat, and phyllotaxis sunflower patterns.",
    hint: "Drag: Morph spiral divergence angle | Scroll: Scale iterations | Space: Toggle prime number Ulam grid"
  },
  eratosthenes: {
    id: "eratosthenes",
    name: "Eratosthenes (Planetary Circumference & Sieve)",
    pavilionId: "mathematica",
    pavilionName: "Pavilion VI: Mathematica & Geometria",
    path: "../demos/eratosthenes/eratosthenes.js",
    exportName: "EratosthenesEngine",
    desc: "Interactive geometry measuring the Earth circumference between Alexandria and Syene, alongside the prime number sieve.",
    hint: "Drag: Adjust sun ray angle & obelisk shadow | Space: Step sieve of Eratosthenes primes"
  },
  pythagoras: {
    id: "pythagoras",
    name: "Pythagoras (Monochord Harmonics)",
    pavilionId: "mathematica",
    pavilionName: "Pavilion VI: Mathematica & Geometria",
    path: "../demos/pythagoras/pythagoras.js",
    exportName: "PythagorasEngine",
    desc: "Acoustic vibrating string physics with movable bridge, standing wave harmonics (octave 2:1, fifth 3:2), and WebAudio synthesis.",
    hint: "Click String: Pluck string | Drag Bridge: Change ratio (3:2 fifth, 4:3 fourth, 2:1 octave)"
  },
  fractal_roman: {
    id: "fractal_roman",
    name: "Fractal Roman (Mosaic & Voronoi Tessellation)",
    pavilionId: "mathematica",
    pavilionName: "Pavilion VI: Mathematica & Geometria",
    path: "../demos/fractal_roman/fractal_roman.js",
    exportName: "FractalRomanEngine",
    desc: "Procedural Roman opus vermiculatum mosaic tessellation, Voronoi relaxation, and Sierpinski stone tile subdivision.",
    hint: "Click: Seed mosaic tesserae | Drag: Deform grid | Space: Run Lloyd relaxation step"
  },

  // Pavilion VII: Mare Nostrum
  scylla_charybdis: {
    id: "scylla_charybdis",
    name: "Scylla & Charybdis (Vortex Hydrodynamics)",
    pavilionId: "mare",
    pavilionName: "Pavilion VII: Mare Nostrum",
    path: "../demos/scylla_charybdis/scylla_charybdis.js",
    exportName: "ScyllaCharybdisEngine",
    desc: "Dual hydrodynamic hazard simulation: rotating whirlpool vortex suction on one flank and jagged breaking waves on the other.",
    hint: "Arrows/WASD: Pilot Ulysses vessel | Avoid whirlpool vortex center | Space: Drop sea anchor"
  },
  mare_nostrum: {
    id: "mare_nostrum",
    name: "Mare Nostrum (Wind Rose Navigation)",
    pavilionId: "mare",
    pavilionName: "Pavilion VII: Mare Nostrum",
    path: "../demos/mare_nostrum/mare_nostrum.js",
    exportName: "MareNostrumEngine",
    desc: "Classical 12-wind rose meteorology, lateen sail aerodynamics, keel leeway, and tacking against headwind currents.",
    hint: "A/D: Steer helm | W/S: Trim sail angle to apparent wind | Space: Toggle wind vector streamlines"
  },
  pharos: {
    id: "pharos",
    name: "Pharos (Lighthouse Optics & Fog)",
    pavilionId: "mare",
    pavilionName: "Pavilion VII: Mare Nostrum",
    path: "../demos/pharos/pharos.js",
    exportName: "PharosEngine",
    desc: "Pharos of Alexandria beacon optics: parabolic polished bronze mirror specular raymarching through dynamic coastal fog.",
    hint: "Drag: Rotate lighthouse mirror beam | Scroll: Change beam focal width | Space: Toggle sea squall"
  },
  coral_reef: {
    id: "coral_reef",
    name: "Coral Reef (DLA Biomineralization)",
    pavilionId: "mare",
    pavilionName: "Pavilion VII: Mare Nostrum",
    path: "../demos/coral_reef/coral_reef.js",
    exportName: "CoralReefEngine",
    desc: "Diffusion-limited aggregation (DLA) branching coral structures, calcium carbonate deposition, and schooling tropical boids.",
    hint: "Click: Seed coral polyp | Drag: Steer nutrient current | Space: Flash bioluminescence"
  },
  nautilus: {
    id: "nautilus",
    name: "Nautilus (Buoyancy Chambers)",
    pavilionId: "mare",
    pavilionName: "Pavilion VII: Mare Nostrum",
    path: "../demos/nautilus/nautilus.js",
    exportName: "NautilusEngine",
    desc: "Equiangular spiral cephalopod shell with siphuncle gas-water displacement, Archimedean buoyancy, and siphon jet pulses.",
    hint: "Up/Down: Regulate chamber water/gas | Space: Expel siphon jet pulse | Drag: Move specimen"
  },

  // Pavilion VIII: Architectura & Structura
  forum_builder: {
    id: "forum_builder",
    name: "Forum Builder (Roman Town Planner)",
    pavilionId: "architectura",
    pavilionName: "Pavilion VIII: Architectura & Structura",
    path: "../demos/forum_builder/forum_builder.js",
    exportName: "ForumBuilderEngine",
    desc: "Cellular Roman castrum/forum urban planner with cardo, decumanus, insulae, aqueduct pipes, and citizen traffic.",
    hint: "1-5: Pick structure (Road, Insula, Temple, Bath, Fountain) | Click: Place | Right-Click: Demolish"
  },
  arch_vault: {
    id: "arch_vault",
    name: "Arch & Vault (Thrust Line & Voussoirs)",
    pavilionId: "architectura",
    pavilionName: "Pavilion VIII: Architectura & Structura",
    path: "../demos/arch_vault/arch_vault.js",
    exportName: "ArchVaultEngine",
    desc: "True Roman voussoir arch physics: thrust line catenary calculation, keystone friction locks, and load limit collapse.",
    hint: "Drag: Adjust arch span & rise | Click Block: Add structural load | Space: Remove wooden centering support"
  },
  opus_caementicium: {
    id: "opus_caementicium",
    name: "Opus Caementicium (Roman Concrete)",
    pavilionId: "architectura",
    pavilionName: "Pavilion VIII: Architectura & Structura",
    path: "../demos/opus_caementicium/opus_caementicium.js",
    exportName: "OpusCaementiciumEngine",
    desc: "Hydraulic lime, volcanic pozzolana, and saltwater crystal needle growth simulation forming self-healing concrete.",
    hint: "Click: Pour aggregate mix | Drag: Submerge in seawater | Space: Crack concrete and watch self-heal"
  },
  thermae: {
    id: "thermae",
    name: "Thermae (Hypocaust Thermal Diffusion)",
    pavilionId: "architectura",
    pavilionName: "Pavilion VIII: Architectura & Structura",
    path: "../demos/thermae/thermae.js",
    exportName: "ThermaeEngine",
    desc: "Roman underfloor hypocaust radiant heating thermodynamics: thermal conduction through pilae stacks and caldarium steam.",
    hint: "Click: Stoke praefurnium furnace | Drag: Reconfigure heat baffles | Space: Cold plunge in frigidarium"
  },
  pantheon: {
    id: "pantheon",
    name: "Pantheon (Rotunda Dome & Oculus)",
    pavilionId: "architectura",
    pavilionName: "Pavilion VIII: Architectura & Structura",
    path: "../demos/pantheon/pantheon.js",
    exportName: "PantheonEngine",
    desc: "Unreinforced concrete dome stress tensor visualization, step-ring mass grading, and moving solar beam through the oculus.",
    hint: "Drag: Orbit 3D perspective | Scroll: Change time of day (sweeps solar beam) | Space: Toggle stress tensors"
  },

  // Pavilion IX: Alchemia & Mineralia
  vitrum: {
    id: "vitrum",
    name: "Vitrum (Viscoelastic Glassblowing)",
    pavilionId: "alchemia",
    pavilionName: "Pavilion IX: Alchemia & Mineralia",
    path: "../demos/vitrum/vitrum.js",
    exportName: "VitrumEngine",
    desc: "Temperature-dependent non-Newtonian fluid glassblowing physics. Molten gather inflation, marver shaping, and thermal stress.",
    hint: "Hold Space: Blow air into glass pipe | Drag: Shape with marvering paddle | Scroll: Furnace reheat"
  },
  metallum: {
    id: "metallum",
    name: "Metallum (Bloomery Iron Smelter)",
    pavilionId: "alchemia",
    pavilionName: "Pavilion IX: Alchemia & Mineralia",
    path: "../demos/metallum/metallum.js",
    exportName: "MetallumEngine",
    desc: "Charcoal and iron ore redox reaction cellular automata: carbon diffusion, molten slag drainage, and sponge iron bloom forging.",
    hint: "Click: Pump leather bellows | 1-3: Add Ore, Charcoal, Flux | Space: Hammer bloom on anvil"
  },
  pigmentum: {
    id: "pigmentum",
    name: "Pigmentum (Ancient Fresco Pigments)",
    pavilionId: "alchemia",
    pavilionName: "Pavilion IX: Alchemia & Mineralia",
    path: "../demos/pigmentum/pigmentum.js",
    exportName: "PigmentumEngine",
    desc: "Kubelka-Munk optical pigment mixing: Tyrian purple, Egyptian blue, vermilion cinnabar, and wet plaster buon fresco absorption.",
    hint: "Click & Drag: Paint with wet mineral slurry | 1-5: Switch pigment mineral | Scroll: Water ratio"
  },
  hermetica: {
    id: "hermetica",
    name: "Hermetica (Alembic Distillation)",
    pavilionId: "alchemia",
    pavilionName: "Pavilion IX: Alchemia & Mineralia",
    path: "../demos/hermetica/hermetica.js",
    exportName: "HermeticaEngine",
    desc: "Alexandrian alchemical distillation: fractional vaporization in cucurbit, condensation inside alembic helm, and receiver yield.",
    hint: "Drag: Regulate athanor flame | Click: Add herb/wine charge | Space: Purge distillate condenser"
  },
  electrum: {
    id: "electrum",
    name: "Electrum (Amber Triboelectricity)",
    pavilionId: "alchemia",
    pavilionName: "Pavilion IX: Alchemia & Mineralia",
    path: "../demos/electrum/electrum.js",
    exportName: "ElectrumEngine",
    desc: "Coulomb electrostatic force simulation: rubbing Baltic amber with wool to accumulate electron charge and attract light chaff.",
    hint: "Drag Amber: Rub on wool to charge | Move charged amber near gold leaf & chaff | Space: Ground discharge"
  },

  // Pavilion X: Strategia & Legio
  testudo: {
    id: "testudo",
    name: "Testudo (Legionary Shield Wall)",
    pavilionId: "strategia",
    pavilionName: "Pavilion X: Strategia & Legio",
    path: "../demos/testudo/testudo.js",
    exportName: "TestudoEngine",
    desc: "Rigid scutum shield mesh mechanics with projectile ricochets, interlocking lock joints, and kinetic energy deflection.",
    hint: "Drag: Steer cohort formation | Space: Raise shields into roof testudo | Click: Enemy arrow volley"
  },
  siege_tower: {
    id: "siege_tower",
    name: "Siege Tower (Helepolis Assault)",
    pavilionId: "strategia",
    pavilionName: "Pavilion X: Strategia & Legio",
    path: "../demos/siege_tower/siege_tower.js",
    exportName: "SiegeTowerEngine",
    desc: "Multi-level wooden siege tower physics: wheel friction, counterweight drawbridge deployment, and defensive burning pitch.",
    hint: "Drag: Advance tower towards ramparts | Space: Drop drawbridge ramp | Click: Extinguish flaming arrows"
  },
  hoplite_phalanx: {
    id: "hoplite_phalanx",
    name: "Hoplite Phalanx (Othismos Push Dynamics)",
    pavilionId: "strategia",
    pavilionName: "Pavilion X: Strategia & Legio",
    path: "../demos/hoplite_phalanx/hoplite_phalanx.js",
    exportName: "HoplitePhalanxEngine",
    desc: "Dense hoplite crowd particle physics: cooperative pushing force (othismos), spear ranks interlocking, and morale breaking.",
    hint: "WASD: Steer push pressure | Space: Synchronized shield heave | Shift: Lower dory spears"
  },
  scorpio: {
    id: "scorpio",
    name: "Scorpio (Sniper Torsion Dart)",
    pavilionId: "strategia",
    pavilionName: "Pavilion X: Strategia & Legio",
    path: "../demos/scorpio/scorpio.js",
    exportName: "ScorpioEngine",
    desc: "Precision Roman torsion sniper dart launcher: crosshair elevation, windage deflection, kinetic penetration, and iron bolt physics.",
    hint: "Mouse: Aim sight elevation & traverse | Click & Hold: Crank torsion sinew | Release: Fire precision bolt"
  },
  signal_fire: {
    id: "signal_fire",
    name: "Signal Fire (Polybius Optical Telegraph)",
    pavilionId: "strategia",
    pavilionName: "Pavilion X: Strategia & Legio",
    path: "../demos/signal_fire/signal_fire.js",
    exportName: "SignalFireEngine",
    desc: "Polybius 5x5 Greek cipher optical telegraph network across mountain watchtowers using torch coordinate signalling.",
    hint: "Type any message: Encodes to torch coordinates | Click Torches: Manual signal transmission | Space: Relay"
  }
};

export const PAVILION_COLORS = {
  ignis: "#ff6b4a",
  bestiarium: "#34d399",
  mechanica: "#38bdf8",
  cosmographia: "#a78bfa",
  fabula: "#f43f5e",
  mathematica: "#fbbf24",
  mare: "#2dd4bf",
  architectura: "#fb923c",
  alchemia: "#c084fc",
  strategia: "#e11d48"
};

class PlinyHub {
  constructor() {
    this.canvas = document.getElementById("main-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.controlsContainer = document.getElementById("dynamic-controls");
    this.demoTitle = document.getElementById("demo-title");
    this.demoDesc = document.getElementById("demo-desc");
    this.hintOverlay = document.getElementById("hint-overlay");
    this.fpsVal = document.getElementById("fps-val");
    this.entityVal = document.getElementById("entity-val");
    this.gameNumVal = document.getElementById("game-num-val");
    this.pavilionBadge = document.getElementById("pavilion-badge");
    this.resetBtn = document.getElementById("reset-btn");
    this.pauseBtn = document.getElementById("pause-btn");
    this.togglePanelBtn = document.getElementById("toggle-panel");
    this.controlsPanel = document.getElementById("controls-panel");
    this.fullscreenBtn = document.getElementById("fullscreen-btn");
    this.audioToggleBtn = document.getElementById("audio-toggle-btn");

    this.pavilionSelect = document.getElementById("pavilion-select");
    this.gameSelect = document.getElementById("game-select");
    this.prevBtn = document.getElementById("prev-game-btn");
    this.randomBtn = document.getElementById("random-game-btn");
    this.nextBtn = document.getElementById("next-game-btn");

    // Showcase & View Elements
    this.currentView = "showcase";
    this.showcaseView = document.getElementById("showcase-view");
    this.viewportContainer = document.getElementById("viewport-container");
    this.showcaseNavBtn = document.getElementById("showcase-nav-btn");
    this.simulatorNavBtn = document.getElementById("simulator-nav-btn");
    this.brandEl = document.querySelector(".brand");

    this.showcaseGrid = document.getElementById("showcase-grid");
    this.showcaseSearch = document.getElementById("showcase-search");
    this.showcaseChips = document.getElementById("showcase-chips");
    this.showcaseCount = document.getElementById("showcase-count");
    this.showcaseEmpty = document.getElementById("showcase-empty");
    this.clearSearchBtn = document.getElementById("clear-search-btn");
    this.heroLaunchBtn = document.getElementById("hero-launch-btn");
    this.heroRandomBtn = document.getElementById("hero-random-btn");

    this.activePavilionFilter = "all";
    this.searchQuery = "";

    this.activeKey = "vesuvius";
    this.currentEngine = null;
    this.isPaused = false;
    this.lastTime = (typeof performance !== "undefined") ? performance.now() : Date.now();
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.engineCache = {};

    this.init();
  }

  init() {
    this.populateSelectors();
    this.initShowcase();
    this.initViewControls();
    this.setupKeyboardShortcuts();
    this.handleResize();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => this.handleResize());
    }

    // Selector events
    if (this.pavilionSelect) {
      this.pavilionSelect.addEventListener("change", () => {
        const pavId = this.pavilionSelect.value;
        const pav = PAVILIONS.find(p => p.id === pavId);
        if (pav && pav.games.length > 0) {
          this.updateGameDropdown(pavId);
          this.switchDemo(pav.games[0]);
        }
      });
    }

    if (this.gameSelect) {
      this.gameSelect.addEventListener("change", () => {
        const key = this.gameSelect.value;
        if (key && key !== this.activeKey) {
          this.switchDemo(key);
        }
      });
    }

    // Navigation buttons
    const allKeys = Object.keys(DEMOS);
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => {
        const idx = allKeys.indexOf(this.activeKey);
        const prevIdx = (idx - 1 + allKeys.length) % allKeys.length;
        this.switchDemo(allKeys[prevIdx]);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => {
        const idx = allKeys.indexOf(this.activeKey);
        const nextIdx = (idx + 1) % allKeys.length;
        this.switchDemo(allKeys[nextIdx]);
      });
    }

    if (this.randomBtn) {
      this.randomBtn.addEventListener("click", () => {
        const randomIdx = Math.floor(Math.random() * allKeys.length);
        this.switchDemo(allKeys[randomIdx]);
      });
    }

    // Reset button
    if (this.resetBtn) {
      this.resetBtn.addEventListener("click", () => {
        if (this.currentEngine && this.currentEngine.reset) {
          this.currentEngine.reset();
        }
      });
    }

    // Pause button
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener("click", () => {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
        this.pauseBtn.style.color = this.isPaused ? "var(--accent-crimson)" : "var(--text-main)";
      });
    }

    // Panel collapse
    if (this.togglePanelBtn && this.controlsPanel) {
      this.togglePanelBtn.addEventListener("click", () => {
        this.controlsPanel.classList.toggle("collapsed");
        this.togglePanelBtn.textContent = this.controlsPanel.classList.contains("collapsed") ? "+" : "−";
      });
    }

    // Fullscreen toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Audio Unlock & Toggle
    if (typeof window !== "undefined") {
      const unlockAudio = () => {
        soundMaster.resume();
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
    }

    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener("click", () => {
        soundMaster.resume();
        const isMuted = soundMaster.toggleMute();
        this.audioToggleBtn.textContent = isMuted ? "🔇" : "🔊";
        this.audioToggleBtn.title = isMuted ? "Unmute Sound" : "Mute Sound";
        this.audioToggleBtn.classList.toggle("muted", isMuted);
      });
    }

    this.setupInputHandling();

    // Route initial view based on URL hash
    this.handleInitialRoute();

    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  handleInitialRoute() {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#game=")) {
      const key = hash.replace("#game=", "").trim();
      if (DEMOS[key]) {
        this.switchDemo(key);
        this.switchView("simulator");
        return;
      }
    }
    // Default: showcase homepage
    this.switchDemo("vesuvius");
    this.switchView("showcase");
  }

  initViewControls() {
    if (this.showcaseNavBtn) {
      this.showcaseNavBtn.addEventListener("click", () => this.switchView("showcase"));
    }
    if (this.simulatorNavBtn) {
      this.simulatorNavBtn.addEventListener("click", () => this.switchView("simulator"));
    }
    if (this.brandEl) {
      this.brandEl.addEventListener("click", () => this.switchView("showcase"));
    }
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", () => {
        const hash = window.location.hash;
        if (hash.startsWith("#game=")) {
          const key = hash.replace("#game=", "").trim();
          if (DEMOS[key] && key !== this.activeKey) {
            this.switchDemo(key);
          }
          this.switchView("simulator");
        } else if (hash === "#showcase" || hash === "") {
          this.switchView("showcase");
        }
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    if (viewName === "showcase") {
      if (this.showcaseView) this.showcaseView.classList.remove("view-hidden");
      if (this.viewportContainer) this.viewportContainer.classList.add("view-hidden");
      if (this.showcaseNavBtn) this.showcaseNavBtn.classList.add("active");
      if (this.simulatorNavBtn) this.simulatorNavBtn.classList.remove("active");
      soundMaster.playChime("D5", 0.15);
      if (typeof history !== "undefined" && history.replaceState) {
        history.replaceState(null, "", "#showcase");
      }
    } else {
      if (this.showcaseView) this.showcaseView.classList.add("view-hidden");
      if (this.viewportContainer) this.viewportContainer.classList.remove("view-hidden");
      if (this.simulatorNavBtn) this.simulatorNavBtn.classList.add("active");
      if (this.showcaseNavBtn) this.showcaseNavBtn.classList.remove("active");
      this.handleResize();
      const info = DEMOS[this.activeKey];
      if (info && info.pavilionId) {
        soundMaster.startPavilionAmbience(info.pavilionId);
      }
      if (typeof history !== "undefined" && history.replaceState) {
        history.replaceState(null, "", `#game=${this.activeKey}`);
      }
    }
  }

  launchDemo(key) {
    soundMaster.resume();
    soundMaster.playLaunchFanfare();
    this.switchDemo(key);
    this.switchView("simulator");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  initShowcase() {
    if (!this.showcaseGrid) return;

    // 1. Build Pavilion Filter Chips
    if (this.showcaseChips) {
      this.showcaseChips.innerHTML = "";
      
      // All chip
      const allChip = document.createElement("button");
      allChip.className = "chip-btn active";
      allChip.dataset.pav = "all";
      allChip.innerHTML = `<span class="chip-dot" style="--dot-color: var(--accent-gold);"></span> All (50)`;
      allChip.addEventListener("mouseenter", () => soundMaster.playChime("D5", 0.08));
      allChip.addEventListener("click", () => {
        soundMaster.playChime("A4", 0.15);
        this.selectPavilionFilter("all", allChip);
      });
      this.showcaseChips.appendChild(allChip);

      // Pavilion chips
      PAVILIONS.forEach(pav => {
        const chip = document.createElement("button");
        chip.className = "chip-btn";
        chip.dataset.pav = pav.id;
        const color = PAVILION_COLORS[pav.id] || "#d4af37";
        const shortName = pav.name.split("(")[0].trim();
        chip.innerHTML = `<span class="chip-dot" style="--dot-color: ${color};"></span> ${shortName} (${pav.games.length})`;
        chip.addEventListener("mouseenter", () => soundMaster.playChime("E5", 0.08));
        chip.addEventListener("click", () => {
          soundMaster.playChime("C5", 0.15);
          this.selectPavilionFilter(pav.id, chip);
        });
        this.showcaseChips.appendChild(chip);
      });
    }

    // 2. Build 50 Engine Cards
    this.showcaseGrid.innerHTML = "";
    const allKeys = Object.keys(DEMOS);

    allKeys.forEach((key, idx) => {
      const demo = DEMOS[key];
      const overallNum = idx + 1;
      const numStr = String(overallNum).padStart(2, "0");
      const thumbUrl = `.audit/screenshots/${numStr}_${key}.png`;
      const color = PAVILION_COLORS[demo.pavilionId] || "#d4af37";
      const shortPavilion = demo.pavilionName.split("(")[0].trim();
      const cleanTitle = demo.name.replace(/\(.*?\)/, "").trim();

      const card = document.createElement("article");
      card.className = "engine-card";
      card.dataset.key = key;
      card.dataset.pavilion = demo.pavilionId;
      card.dataset.search = `${demo.name} ${demo.pavilionName} ${demo.desc} ${demo.hint}`.toLowerCase();
      card.style.setProperty("--card-accent", color);

      card.innerHTML = `
        <div class="card-thumb-wrap">
          <img class="card-thumb" src="${thumbUrl}" alt="${demo.name}" loading="lazy" onerror="this.style.opacity='0.4'">
          <div class="card-pavilion-tag">
            <span class="chip-dot" style="--dot-color: ${color};"></span>
            <span>${shortPavilion}</span>
          </div>
          <div class="card-num-tag">#${overallNum}/50</div>
          <button class="card-launch-btn" title="Launch ${cleanTitle}">▶ Launch</button>
        </div>
        <div class="card-body">
          <h3 class="card-title">
            <span class="card-swatch"></span>
            <span>${overallNum}. ${cleanTitle}</span>
          </h3>
          <p class="card-desc">${demo.desc}</p>
          <div class="card-hint" title="${demo.hint}">🎮 ${demo.hint}</div>
        </div>
      `;

      card.addEventListener("mouseenter", () => soundMaster.playChime("A4", 0.05));
      card.addEventListener("click", () => this.launchDemo(key));
      this.showcaseGrid.appendChild(card);
    });

    // 3. Wire Search Input
    if (this.showcaseSearch) {
      this.showcaseSearch.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.filterShowcase();
      });
    }

    // 4. Wire Clear Search Button
    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener("click", () => {
        if (this.showcaseSearch) this.showcaseSearch.value = "";
        this.searchQuery = "";
        this.selectPavilionFilter("all");
      });
    }

    // 5. Wire Hero Buttons
    if (this.heroLaunchBtn) {
      this.heroLaunchBtn.addEventListener("click", () => {
        this.launchDemo(this.activeKey || "vesuvius");
      });
    }

    if (this.heroRandomBtn) {
      this.heroRandomBtn.addEventListener("click", () => {
        const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        this.launchDemo(randomKey);
      });
    }
  }

  selectPavilionFilter(pavId, targetChip = null) {
    this.activePavilionFilter = pavId;
    if (this.showcaseChips) {
      const chips = this.showcaseChips.querySelectorAll(".chip-btn");
      chips.forEach(c => {
        if (c.dataset.pav === pavId) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
    }
    this.filterShowcase();
  }

  filterShowcase() {
    if (!this.showcaseGrid) return;
    const cards = this.showcaseGrid.querySelectorAll(".engine-card");
    let visibleCount = 0;

    cards.forEach(card => {
      const matchPav = (this.activePavilionFilter === "all" || card.dataset.pavilion === this.activePavilionFilter);
      const matchSearch = (!this.searchQuery || card.dataset.search.includes(this.searchQuery));

      if (matchPav && matchSearch) {
        card.style.display = "flex";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    if (this.showcaseCount) {
      this.showcaseCount.textContent = `Showing ${visibleCount} of 50 engines`;
    }

    if (this.showcaseEmpty) {
      this.showcaseEmpty.style.display = (visibleCount === 0) ? "block" : "none";
    }
  }

  setupKeyboardShortcuts() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", (e) => {
      // Focus search on '/' when in showcase
      if (e.key === "/" && this.currentView === "showcase") {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (activeTag !== "input" && activeTag !== "textarea") {
          e.preventDefault();
          if (this.showcaseSearch) {
            this.showcaseSearch.focus();
            this.showcaseSearch.select();
          }
        }
      }
      // Escape: return to showcase or clear search
      if (e.key === "Escape") {
        if (this.currentView === "simulator") {
          this.switchView("showcase");
        } else if (this.showcaseSearch && document.activeElement === this.showcaseSearch) {
          this.showcaseSearch.value = "";
          this.searchQuery = "";
          this.showcaseSearch.blur();
          this.filterShowcase();
        }
      }
    });
  }

  populateSelectors() {
    this.pavilionSelect.innerHTML = "";
    PAVILIONS.forEach(pav => {
      const opt = document.createElement("option");
      opt.value = pav.id;
      opt.textContent = pav.name;
      this.pavilionSelect.appendChild(opt);
    });
    this.updateGameDropdown("ignis");
  }

  updateGameDropdown(pavilionId) {
    this.gameSelect.innerHTML = "";
    const pav = PAVILIONS.find(p => p.id === pavilionId);
    if (!pav) return;
    const allKeys = Object.keys(DEMOS);
    pav.games.forEach(key => {
      const demo = DEMOS[key];
      if (!demo) return;
      const opt = document.createElement("option");
      opt.value = key;
      const overallNum = allKeys.indexOf(key) + 1;
      opt.textContent = overallNum + ". " + demo.name;
      this.gameSelect.appendChild(opt);
    });
  }

  handleResize() {
    const container = document.getElementById("viewport-container");
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    if (this.currentEngine && this.currentEngine.resize) {
      this.currentEngine.resize(this.canvas.width, this.canvas.height, dpr);
    }
  }

  async switchDemo(key) {
    const info = DEMOS[key];
    if (!info) return;

    // Teardown existing
    if (this.currentEngine) {
      if (this.currentEngine.destroy) this.currentEngine.destroy();
      this.currentEngine = null;
    }

    this.activeKey = key;
    const allKeys = Object.keys(DEMOS);
    const gameIdx = allKeys.indexOf(key) + 1;

    // Update UI controls
    if (this.pavilionSelect.value !== info.pavilionId) {
      this.pavilionSelect.value = info.pavilionId;
      this.updateGameDropdown(info.pavilionId);
    }
    this.gameSelect.value = key;

    if (this.gameNumVal) this.gameNumVal.textContent = gameIdx + "/50";
    if (this.pavilionBadge) this.pavilionBadge.textContent = info.pavilionName;
    this.demoTitle.textContent = info.name;
    this.demoDesc.textContent = info.desc;
    this.hintOverlay.textContent = info.hint;

    // Reset controls container
    this.controlsContainer.innerHTML = "";

    try {
      let EngineClass = this.engineCache[key];
      if (!EngineClass) {
        const mod = await import(info.path);
        EngineClass = mod[info.exportName];
        this.engineCache[key] = EngineClass;
      }

      this.currentEngine = new EngineClass(this.canvas, this.ctx, this.controlsContainer);
      const dpr = window.devicePixelRatio || 1;
      if (this.currentEngine.resize) {
        this.currentEngine.resize(this.canvas.width, this.canvas.height, dpr);
      }

      // Update ambient soundscape if currently viewing simulator
      if (this.currentView === "simulator" && info.pavilionId) {
        soundMaster.startPavilionAmbience(info.pavilionId);
      }
    } catch (err) {
      console.warn("Failed to load engine for " + key, err);
      // Fallback placeholder rendering if module not yet compiled
      this.currentEngine = {
        update: () => {},
        render: (ctx) => {
          ctx.fillStyle = "#0a0b0e";
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          ctx.fillStyle = "#d4af37";
          ctx.font = "bold 24px Cinzel, serif";
          ctx.textAlign = "center";
          ctx.fillText(info.name, this.canvas.width / 2, this.canvas.height / 2 - 20);
          ctx.fillStyle = "#8c909e";
          ctx.font = "14px JetBrains Mono, monospace";
          ctx.fillText("Engine compiling / initializing...", this.canvas.width / 2, this.canvas.height / 2 + 20);
        },
        getEntityCount: () => 0
      };
    }

    this.isPaused = false;
    this.pauseBtn.textContent = "Pause";
    this.pauseBtn.style.color = "var(--text-main)";
  }

  setupInputHandling() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
        y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        rawX: e.clientX - rect.left,
        rawY: e.clientY - rect.top,
        button: e.button
      };
    };

    this.canvas.addEventListener("mousedown", (e) => {
      if (this.currentEngine && this.currentEngine.onMouseDown) {
        this.currentEngine.onMouseDown(getPos(e));
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (this.currentEngine && this.currentEngine.onMouseMove) {
        this.currentEngine.onMouseMove(getPos(e));
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (this.currentEngine && this.currentEngine.onMouseUp) {
        this.currentEngine.onMouseUp(getPos(e));
      }
    });

    this.canvas.addEventListener("wheel", (e) => {
      if (this.currentEngine && this.currentEngine.onWheel) {
        this.currentEngine.onWheel(e.deltaY);
        e.preventDefault();
      }
    }, { passive: false });

    this.canvas.addEventListener("contextmenu", (e) => {
      if (this.currentEngine && this.currentEngine.onContextMenu) {
        this.currentEngine.onContextMenu(getPos(e));
      }
      e.preventDefault();
    });

    window.addEventListener("keydown", (e) => {
      if (this.currentEngine && this.currentEngine.onKeyDown) {
        this.currentEngine.onKeyDown(e.key, e);
      }
    });

    window.addEventListener("keyup", (e) => {
      if (this.currentEngine && this.currentEngine.onKeyUp) {
        this.currentEngine.onKeyUp(e.key, e);
      }
    });
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      const currentFps = Math.round(this.frameCount / this.fpsTimer);
      if (this.fpsVal) this.fpsVal.textContent = currentFps;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.currentEngine && this.currentView === "simulator") {
      try {
        if (!this.isPaused && this.currentEngine.update) {
          this.currentEngine.update(dt);
        }
        if (this.currentEngine.render) {
          this.currentEngine.render(this.ctx);
        }
        if (this.currentEngine.getEntityCount && this.entityVal) {
          this.entityVal.textContent = this.currentEngine.getEntityCount();
        }
      } catch (err) {
        console.warn("Engine error in " + this.activeKey + ":", err.message);
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener("DOMContentLoaded", () => {
    window.__hub = new PlinyHub();
  });
}
