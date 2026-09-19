// Pliny Game Lab — Plinius Codex Database
// Authentic Latin citations, English translations, scientific principles, and lore
// Derived from Gaius Plinius Secundus's Naturalis Historia (AD 77)

export const CODEX_DATA = {
  // Pavilion I: Ignis & Terra
  vesuvius: {
    title: "Vesuvius (Mons Vesuvius)",
    book: "Plinii Caecilii Secundi Epistulae VI.16 & Naturalis Historia Liber II",
    latinQuote: "Cuius similitudinem et formam non alia magis arbor quam pinus expresserit. Nam longissimo velut trunco elata in altum quibusdam ramis diffundebatur.",
    translation: "Its general appearance can best be expressed as being like an umbrella pine, for it rose to a great height on a sort of trunk and then split off into branches.",
    science: "Thermodynamic Rayleigh-Taylor instability, buoyant convective plume dynamics, pyroclastic density currents (PDCs), and phreatomagmatic steam detonations.",
    controlsGuide: "Evacuate Stabiae: Select Roman galleys and order them to Stabiae to rescue citizens before pyroclastic surges arrive. Vent magma chamber (V) to delay eruption phases, and build berms (B) to shield the bay. Switch to Sandbox mode to paint elements and trigger manual eruption phases."
  },
  geyser: {
    title: "Geyser (Aqua Calida & Fumarola)",
    book: "Naturalis Historia Liber II, c. 106",
    latinQuote: "In Nymphæo flamma e terra exilit, qua nullo umquam tempore extinguitur, et circa eam prata florentia.",
    translation: "At Nymphaeum flames leap from the earth which are never extinguished, yet blooming meadows surround them.",
    science: "Subterranean thermodynamic flash boiling cycles, Clausius-Clapeyron vapor pressure, and silica sinter mineral precipitation.",
    controlsGuide: "Inject subterranean heat cores, carve porous karst fissures, and trigger cyclical superheated steam eruptions."
  },
  caverna: {
    title: "Caverna (Speleothems & Karst)",
    book: "Naturalis Historia Liber XXXVI, c. 24",
    latinQuote: "In Corycio specu stillicidia lapidescunt, miro naturae lusu concreti suci in tophum durescentes.",
    translation: "In the Corycian cave, dripping water turns to stone, through a marvelous game of nature where hardened juices petrify into tufa.",
    science: "Calcium bicarbonate dissolution and precipitation: Ca(HCO3)2 <-> CaCO3 + CO2 + H2O. Stalactite, stalagmite, and karst river speleogenesis.",
    controlsGuide: "Drill acidic drip fissures, toggle stalactite accretion rates, and channel underground subterranean rivers."
  },
  terrae_motus: {
    title: "Terrae Motus (Seismic Dynamics)",
    book: "Naturalis Historia Liber II, c. 81",
    latinQuote: "Non aliud est terrae motus quam in nubibus tonitruum, inclusi spiritus lucta et erumpere nitentis.",
    translation: "An earthquake is nothing other than thunder inside the earth, the struggle of pent-up breath striving to break forth.",
    science: "Stick-slip friction mechanics along tectonic fault boundaries, elastodynamic P-wave and S-wave propagation, and architectural resonance collapse.",
    controlsGuide: "Accumulate tectonic shear strain by dragging fault lines. Release destructive seismic shocks and observe Basilica colonnade structural failure."
  },
  aurum: {
    title: "Aurum (Ruina Montium & Gold Sluicing)",
    book: "Naturalis Historia Liber XXXIII, c. 21",
    latinQuote: "Tertia ratio opera vicerit Gigantum: convelluntur montes ad lucernas... ruina montium vocatur.",
    translation: "The third method surpasses the labors of the Giants: mountains are torn apart by lamplight... it is called the ruin of mountains.",
    science: "Hydraulic mining sediment slurry transport, fluid shear stress, density-based gold nugget separation across riffle sluice barriers.",
    controlsGuide: "Tilt sluice gradient, regulate hydraulic head water flow, and agitate auriferous gravel paydirt."
  },

  // Pavilion II: Bestiarium & Silva
  bestiarium: {
    title: "Bestiarium (Animalium Natura)",
    book: "Naturalis Historia Liber VIII, c. 1-19",
    latinQuote: "Maximum est animal elephas, proximumque humanis sensibus; leoni summa nobilitas, sed grifo auri custos acerrimus.",
    translation: "The elephant is the greatest of animals, closest to human senses; the lion has the greatest nobility, but the griffin is the fiercest guardian of gold.",
    science: "Lotka-Volterra predator-prey non-linear differential equations, Craig Reynolds flocking boids, sensory perception cones, and metabolic food webs.",
    controlsGuide: "Spawn 6 ancient species (Cervus, Leo, Griffin, Basilisk, Monoceros, Elephantus). Observe pack stalking, flight shadows, petrifying gaze, and ecological phase loops."
  },
  myrmex: {
    title: "Myrmex (Formicarum Prudentia)",
    book: "Naturalis Historia Liber XI, c. 36",
    latinQuote: "Formicis parvis ingens est sollertia, sepeliuntque mortuas, et commeatus congerunt.",
    translation: "Small ants possess immense ingenuity; they bury their dead and store grain for the winter.",
    science: "Ant Colony Optimization (ACO), stigmergic positive feedback, chemotaxis along volatile pheromone trails, and subterranean excavation.",
    controlsGuide: "Drop sugar food caches, place granite stone barriers, and trigger alarm pheromone pulses."
  },
  apis: {
    title: "Apis (Vespa & Mellificium)",
    book: "Naturalis Historia Liber XI, c. 4-22",
    latinQuote: "Apibus sola respublica est, communis suboles, communes aedes, unus omnibus labor.",
    translation: "Bees alone possess a commonwealth, shared offspring, common dwellings, and one labor for all.",
    science: "Hexagonal tessellation mathematics (honeycomb conjecture), waggle dance polarization vectors, and pollen foraging energetics.",
    controlsGuide: "Plant nectar-rich flora, direct bee scout flight headings, and observe wax cell honeycomb construction."
  },
  hydra: {
    title: "Hydra (Animalia Serpentina)",
    book: "Naturalis Historia Liber XXIX, c. 22",
    latinQuote: "Hydram Lernaeam fabulosam multi-capitem natura finxit renascentibus membris.",
    translation: "Nature created the legendary many-headed Lernaean hydra with limbs that regenerate as soon as they are cut.",
    science: "Soft-body mass-spring continuum mechanics, inverse kinematics, bioluminescent luciferin oxidation, and regenerative cellular bifurcation.",
    controlsGuide: "Click to sever tentacle heads (spawning two replacements). Drag bioluminescent bait lures to guide muscular contractions."
  },
  silva: {
    title: "Silva (Arborum Incrementum)",
    book: "Naturalis Historia Liber XII, c. 1-5",
    latinQuote: "Arbores fuere numinum templa, priscoque ritu simplicia rura etiam nunc deo praecellentem arborem dicant.",
    translation: "Trees were once the temples of the gods, and by ancient rite the simple countryside still dedicates a magnificent tree to a deity.",
    science: "Space-colonization botanical branching algorithm, apical dominance, auxin hormone gradients, and annual dendrochronological ring formation.",
    controlsGuide: "Plant hormone attraction seeds, toggle sunlight orientation, and observe dynamic forest canopy competition."
  },

  // Pavilion III: Mechanica & Machina
  mechanica: {
    title: "Mechanica (Machinae Vitruvii & Heronis)",
    book: "Vitruvius De Architectura Liber X & Heron Alexandrinus Pneumatica",
    latinQuote: "Machina est continens e materia coniunctio, maximas ad onerum motus habens virtutes.",
    translation: "A machine is a coherent combination of timber and iron, possessing the greatest power for moving heavy burdens.",
    science: "Verlet particle structural integration, tension stress tensors (sigma = F/A), compound pulley mechanical advantage, and aeolipile reaction thrust.",
    controlsGuide: "Switch between Polyspaston Crane, Hero's Steam Turbine (Aeolipile), Archimedes Screw, and Temple Siphon Doors. Pull, stress, and slice structural cables."
  },
  aqueduct: {
    title: "Aqueduct (Specus & Siphon)",
    book: "Naturalis Historia Liber XXXVI, c. 24 & Frontinus De Aquaeductu",
    latinQuote: "Vicit omnia miracula perductio aquarum per colles et valles, substructionibus arcuatis.",
    translation: "The conduction of waters through hills and valleys upon arched substructures surpassed all marvels of the world.",
    science: "Manning open channel hydraulic gravity flow, hydraulic jump energy dissipation, and Torricelli inverted siphon head pressure.",
    controlsGuide: "Adjust channel slope gradient, breach siphon seals, and regulate arcade arch water flow toward Rome's castella."
  },
  ballista: {
    title: "Ballista (Tormenta & Nervi)",
    book: "Vitruvius De Architectura Liber X, c. 10-12",
    latinQuote: "Tormenta nervis tortis intenduntur, quorum vi saxa immensa et pila per aera iaciuntur.",
    translation: "Torsion engines are tensioned with twisted animal sinews, whose power hurls immense stones and bolts through the air.",
    science: "Non-linear sinew bundle torsion elasticity, parabolic ballistic kinematics with quadratic air drag, and kinetic impact energy transfer.",
    controlsGuide: "Crank bronze ratchet winch, align pitch stadia elevation, and release trigger sear to shatter fortified ramparts."
  },
  horologium: {
    title: "Horologium (Clepsydra Ctesibii)",
    book: "Vitruvius Liber IX, c. 8 & Naturalis Historia Liber VII, c. 60",
    latinQuote: "Ctesibius Alexandrinus primus invenit aquae naturam machinis horologiis aptare.",
    translation: "Ctesibius of Alexandria was the first to adapt the nature of water to clockwork mechanisms.",
    science: "Torricelli orifice drainage velocity (v = sqrt(2gh)), mechanical escapement gear trains, and Archimedean float siphon resets.",
    controlsGuide: "Regulate reservoir flow rate, calibrate water float markers, and toggle escapement gear ratios."
  },
  antikythera: {
    title: "Antikythera (Computator Astrae)",
    book: "Cicero De Re Publica I.14 (Archimedis Sphaera)",
    latinQuote: "Archimedes sphaeram effecit in qua solis et lunae motus et quinque errantium stellarum converterentur.",
    translation: "Archimedes fashioned a sphere in which the motions of the sun, moon, and five wandering planets were turned by a single mechanism.",
    science: "Epicyclic differential gearing, Metonic 235-lunar-month cycle, Saros eclipse prediction, and Callippic calendar mechanics.",
    controlsGuide: "Turn solar drive crown wheel, step forward through Olympiad cycles, and inspect differential pin-and-slot lunar anomaly gears."
  },

  // Pavilion IV: Cosmographia & Astra
  cosmographia: {
    title: "Cosmographia (Harmonia Mundi & Epicycli)",
    book: "Naturalis Historia Liber II, c. 1-25",
    latinQuote: "Mundus et hoc quodcunque nomine alio caelum appellare libuit, numen esse creditur, aeternum, immensum.",
    translation: "The universe, or whatever other name one chooses to give the sky, is believed to be a deity, eternal and vast without measure.",
    science: "Ptolemaic deferent, epicycle, and equant geometry, Keplerian elliptical orbital mechanics, and Pythagorean Harmonia Mundi resonance ratios.",
    controlsGuide: "Toggle Ptolemaic vs Keplerian celestial models. Trace retrograde loops, display resonance chord web, and accelerate celestial time."
  },
  solstitium: {
    title: "Solstitium (Gnomon & Umbra)",
    book: "Naturalis Historia Liber II, c. 70-76",
    latinQuote: "In Italia gnomonis umbra solstitio est nona parte brevior quam ipse gnomon.",
    translation: "In Italy at the summer solstice, the shadow of the gnomon is one-ninth shorter than the gnomon itself.",
    science: "Solar declination geometry, ecliptic obliquity (epsilon = 23.44 deg), analemma figure-8 progression, and seasonal diurnal arcs.",
    controlsGuide: "Scrub calendar date through seasonal equinoxes and solstices. Adjust latitude slider and read bronze dial solar time."
  },
  aurora: {
    title: "Aurora (Trabes & Chasmata)",
    book: "Naturalis Historia Liber II, c. 33",
    latinQuote: "Caelo sereno noctibus trabae et chasmata ardere conspecta sunt, sanguineo fulgore terrificantia.",
    translation: "In a clear night sky, burning beams and chasms of fire have been seen, terrifying people with their blood-red glow.",
    science: "Birkeland magnetospheric field-aligned currents, atmospheric nitrogen/oxygen ionization, and curtain curtain folding harmonics.",
    controlsGuide: "Tune geomagnetic storm Kp index, sweep altitude emission bands, and induce solar wind magnetic substorms."
  },
  cometa: {
    title: "Cometa (Sidus Crinitum)",
    book: "Naturalis Historia Liber II, c. 22-24",
    latinQuote: "Cometas Graeci vocant, nostri crinitas stellas, horrendo iubar sparsas lumine, regnorum mutationes nuntiantes.",
    translation: "The Greeks call them comets, our people hairy stars; they scatter dread light and herald the overthrow of empires.",
    science: "Keplerian hyperbolic and parabolic orbital mechanics, solar radiation pressure sublimation, and separate gas ion vs dust tails.",
    controlsGuide: "Set orbital eccentricity, pass perihelion around the central Sun, and watch volatile coma outgassing."
  },
  armilla: {
    title: "Armilla (Sphaera Armillaris)",
    book: "Ptolemy Almagest & Naturalis Historia Liber II",
    latinQuote: "Sphaera aereis circulis contexta caeli cardines et zodiaci flexus certis modis demonstrat.",
    translation: "A sphere woven from bronze rings demonstrates the poles of heaven and the turns of the zodiac in exact measurements.",
    science: "Spherical coordinate transformations (equatorial to ecliptic to horizontal), solstitial colure, and precession of the equinoxes.",
    controlsGuide: "Rotate concentric nested bronze rings, set observer latitude, and align celestial equator with ecliptic zodiac signs."
  },

  // Pavilion V: Fabula & Arena
  labyrinthus: {
    title: "Labyrinthus (Labyrinthi Cretae & Asterion)",
    book: "Naturalis Historia Liber XXXVI, c. 19 & Ovidius Metamorphoses VIII",
    latinQuote: "Daedalus ingenio clarissimus artem ponit, et incertas caecis ducit ambagibus vias.",
    translation: "Daedalus, renowned for his genius, applies his craft and creates confusing paths with bewildering blind windings.",
    science: "3D DDA raycasting rendering, A* graph pathfinding with auditory scent tracking, and Ariadne's elastic spring thread physics.",
    controlsGuide: "Navigate 3D stone corridors with WASD. Collect 4 Minoan sacred relics. Trace Ariadne's golden thread back to avoid the charging Minotaur."
  },
  colosseum: {
    title: "Colosseum (Amphitheatrum Flavium)",
    book: "Martialis De Spectaculis & Naturalis Historia Liber XXXVI",
    latinQuote: "Barbara Pyramidum sileat miracula Memphis; unum pro cunctis Fama loquatur opus.",
    translation: "Let barbarian Memphis be silent concerning the wonders of her Pyramids; Fame shall speak of one work in place of all.",
    science: "Underground hypogeum counterweight elevators, velarium fabric tension cable catenary, and arena gladiator combat AI.",
    controlsGuide: "Hoist gladiators and wild beasts via hypogeum trapdoors, unfurl Imperial velarium sun awning, and flood arena for naval naumachia."
  },
  trireme: {
    title: "Trireme (Navis Bellica & Remigium)",
    book: "Naturalis Historia Liber VII, c. 57",
    latinQuote: "Triremem primo Corinthios fabricasse ferunt; remorum ordines tres mirabili ratione concordant.",
    translation: "It is said the Corinthians first built a trireme; three tiers of oars move in marvelous harmony.",
    science: "Hydrodynamic hull wave-making drag, ram kinetic momentum impact, and three-tiered oar rowing kinematics (thranite, zeugite, thalamite).",
    controlsGuide: "Coordinate trireme stroke cadence, turn dual steering oars, hoist square sails, and ram enemy Phoenician galleys."
  },
  chariot: {
    title: "Chariot (Circus Maximus Grand Prix)",
    book: "Naturalis Historia Liber VIII, c. 65 & Tertullianus De Spectaculis",
    latinQuote: "Circensibus quadrigae quattuor factionum certant: Russata, Albata, Veneta, Prasina.",
    translation: "In the circus games, quadrigas of the four factions compete: the Reds, the Whites, the Blues, and the Greens.",
    science: "Quadriga 4-horse harness kinematics, non-linear centrifugal drift friction, turning post cornering, and spina lap-counter monuments.",
    controlsGuide: "Drive as Green, Blue, Red, or White faction. Steer with A/D, whip horses with W/Space, drift tight around turning metae, and tip 7 bronze dolphins."
  },
  oraculum: {
    title: "Oraculum (Pythia Delphica)",
    book: "Naturalis Historia Liber II, c. 95",
    latinQuote: "Delphis in terrae foramine halitus exit qui mentes hominum divinitate imbuit et fatidicos facit.",
    translation: "At Delphi an exhalation rises from a crevice in the earth that fills the minds of men with divine inspiration and prophetic power.",
    science: "Stochastic hydrocarbon gas plume dispersion, Pythian prophetic state transitions, and resonant golden tripod acoustics.",
    controlsGuide: "Feed sacred bay laurel leaves, regulate subterranean ethylene gas vents, and decipher Greek hexameter prophecies."
  },

  // Pavilion VI: Mathematica & Geometria
  euclid: {
    title: "Euclid (Elementa & Constructio)",
    book: "Euclid Elementa Liber I & Proclus In Primum Euclidis",
    latinQuote: "Punctum est cuius pars nulla est. Linea autem est longitudo sine latitudine.",
    translation: "A point is that which has no part. A line is breadthless length.",
    science: "Ideal compass and straightedge geometric constructions, magnetic snapping, and circle-circle/line-line intersection analytical geometry.",
    controlsGuide: "Select Straightedge, Compass, or Point. Construct equilateral triangles, angle bisectors, and circumscribed polygons step-by-step."
  },
  archimedes_spiral: {
    title: "Archimedes Spiral (Spira Archimedea & Cochlea)",
    book: "Archimedes De Spiralibus & Vitruvius Liber X, c. 6",
    latinQuote: "Si recta linea in plano convertatur aequabili celeritate manente termino altero... punctum spiram describit.",
    translation: "If a straight line in a plane revolves at a uniform rate while one endpoint remains fixed... a moving point describes a spiral.",
    science: "Polar spiral kinematics (r = a * theta), Fermat and logarithmic spirals, and Archimedean water screw hydrodynamic lifting.",
    controlsGuide: "Adjust spiral growth constant, switch between spiral families (Archimedean, Fermat, Logarithmic), and power helical water pumps."
  },
  eratosthenes: {
    title: "Eratosthenes (Metratio Terrae)",
    book: "Naturalis Historia Liber II, c. 108 & Cleomedes De Motu",
    latinQuote: "Eratosthenes mundi ambitum collegit ducentorum quinquaginta duorum milium stadiorum.",
    translation: "Eratosthenes determined the circumference of the world to be 252,000 stadia.",
    science: "Solar zenith shadow triangulation, meridian arc length proportionality (theta / 360 = s / C), and Earth curvature geodesy.",
    controlsGuide: "Align summer solstice sun over Syene well, measure Alexandria gnomon shadow angle, and calculate Earth's true circumference."
  },
  pythagoras: {
    title: "Pythagoras (Musica Mundana & Monochordon)",
    book: "Naturalis Historia Liber II, c. 20 & Nicomachus Harmonices",
    latinQuote: "Pythagoras ex chordarum motu mundi concentum et harmoniam caelestem docuit.",
    translation: "Pythagoras taught the harmony of the universe and celestial concord from the motion of vibrating strings.",
    science: "Acoustic wave resonance, integer frequency ratios (2:1 octave, 3:2 fifth, 4:3 fourth), and monochord bridge divisions.",
    controlsGuide: "Move bridge stop along Greek monochord string, pluck harmonic nodes, and visualize Lissajous standing wave oscillations."
  },
  fractal_roman: {
    title: "Fractal Roman (Ornamentum Iteratum)",
    book: "Vitruvius De Architectura Liber VII & Naturalis Historia Liber XXXVI",
    latinQuote: "Opus tesselatum et vermiculatum mira linearum complexione oculos decipit.",
    translation: "Tessellated and vermiculated mosaic work deceives the eyes with a marvelous complexity of lines.",
    science: "Affine fractal transformations (IFS), self-similarity dimensions, and Roman meander recursive subdivision.",
    controlsGuide: "Zoom infinitely into Roman mosaic borders, adjust recursive depth, and animate fractal golden ratios."
  },

  // Pavilion VII: Mare Nostrum
  scylla_charybdis: {
    title: "Scylla & Charybdis (Fretum Siculum)",
    book: "Naturalis Historia Liber III, c. 8 & Homerus Odyssea XII",
    latinQuote: "Dextrum Scylla latus, laevum implacata Charybdis obsidet, terque fretum sorbet et erigit.",
    translation: "Scylla guards the right side, relentless Charybdis the left; thrice she swallows down the sea and thrice spews it forth.",
    science: "Non-linear vortex whirlpool hydrodynamics, coriolis centrifugal shear, and tidal basin current collisions.",
    controlsGuide: "Steer Greek merchant ship through the treacherous Messina strait, balance rudder drift, and avoid vortex suction."
  },
  mare_nostrum: {
    title: "Mare Nostrum (Venti & Aestus)",
    book: "Naturalis Historia Liber II, c. 45-50",
    latinQuote: "Venti quattuor principales sunt: Septentrio, Subsolanus, Auster, Favonius.",
    translation: "The four chief winds are: the North Wind, the East Wind, the South Wind, and the West Wind.",
    science: "Mediterranean shallow-water tidal wave equations, Coriolis drift, and classical 12-wind rose meteorology.",
    controlsGuide: "Manipulate Mediterranean sea winds, generate winter gale swells, and guide Roman shipping trade lanes."
  },
  pharos: {
    title: "Pharos (Lumen Alexandrinum)",
    book: "Naturalis Historia Liber XXXVI, c. 18",
    latinQuote: "Pharos miraculum est orbis, noctu ignibus naves praemonens, a Sostrato Cnidio constructa.",
    translation: "The Pharos is a wonder of the world, warning ships by night with fires, built by Sostratus of Cnidus.",
    science: "Catoptric concave specular optics, atmospheric rayleigh scattering, Fresnel beam collimation, and beacon fuel combustion.",
    controlsGuide: "Aim colossal bronze parabolic mirror, sweep sweeping beacon beam through nocturnal fog, and guide ships past submerged reefs."
  },
  coral_reef: {
    title: "Coral Reef (Corallium & Lithophyta)",
    book: "Naturalis Historia Liber XXXII, c. 11",
    latinQuote: "Corallium fruticat in mari arboreis ramis, exemptum aeri durescit in lapidem.",
    translation: "Coral grows in the sea with tree-like branches, but when removed into the air it hardens into stone.",
    science: "Diffusion-Limited Aggregation (DLA) branching calcification, Brownian nutrient ions, and schooling reef fish boids.",
    controlsGuide: "Seed coral polyps, release nutrient currents, and trigger bioluminescent nocturnal spawning waves."
  },
  nautilus: {
    title: "Nautilus (Navigium Conchylii)",
    book: "Naturalis Historia Liber IX, c. 47",
    latinQuote: "Nautilus concha navigat in summo mari, expansa veli specie membrana, brachiis remigans.",
    translation: "The nautilus shell sails on top of the sea, with a membrane spread out like a sail, rowing with its arms.",
    science: "Logarithmic spiral chamber geometry (r = ae^(b*theta)), siphuncle hydrostatic gas-fluid displacement, and buoyancy equilibrium.",
    controlsGuide: "Adjust chamber buoyancy gas pressure to dive or ascend, pulse siphon jet propulsion, and inspect mother-of-pearl septa."
  },

  // Pavilion VIII: Architectura & Structura
  forum_builder: {
    title: "Forum Builder (Civitas & Colonnades)",
    book: "Vitruvius De Architectura Liber V & Naturalis Historia Liber XXXVI",
    latinQuote: "Fori magnitudo ad copiam multitudinis est accommodanda, ne angustum sit spatium.",
    translation: "The size of the Forum must be proportioned to the multitude of citizens, lest the space be too narrow.",
    science: "Classical proportional orders (Doric, Ionic, Corinthian), civic pedestrian crowd dynamics, and sightline acoustics.",
    controlsGuide: "Place marble temples, basilicas, rostra speaker platforms, and triumphal arches. Inspect citizen traffic flow."
  },
  arch_vault: {
    title: "Arch Vault (Fornix & Clavis)",
    book: "Vitruvius De Architectura Liber VI & Seneca Epistulae 90",
    latinQuote: "Fornix constat cuneis lapidibus, quorum medium clavis claudit et sustinet.",
    translation: "An arch consists of wedge-shaped stones, whose middle is locked and sustained by the keystone.",
    science: "Funicular thrust line analysis, voussoir normal compression vectors, buttress horizontal shear, and centering strike.",
    controlsGuide: "Lay voussoir wedge stones over wooden centering. Place central keystone, strike centering, and load heavy battlements."
  },
  opus_caementicium: {
    title: "Opus Caementicium (Roman Concrete)",
    book: "Naturalis Historia Liber XXXVI, c. 70 & Vitruvius Liber II, c. 6",
    latinQuote: "Pulvis Puteolanus si aquae misceatur, undis submersus fit saxeus.",
    translation: "Pozzolanic ash from Puteoli, if mixed with water, becomes hard as rock even when submerged beneath the waves.",
    science: "Hydraulic lime carbonation: Ca(OH)2 + SiO2 + H2O -> C-S-H gel. Seawater aluminum-tobermorite crystallization and autogenous crack healing.",
    controlsGuide: "Mix quicklime, volcanic pozzolana ash, and sea water. Pour marine harbor mole piers and test tensile strength under storm breakers."
  },
  thermae: {
    title: "Thermae (Hypocaustum & Sudatorium)",
    book: "Vitruvius Liber V, c. 10 & Naturalis Historia Liber XXXVI",
    latinQuote: "Hypocausta ardentibus lignis calorem sub pavimenta et per tubulos parietum mittunt.",
    translation: "Hypocausts send heat from burning wood beneath the pavements and through clay flue pipes in the walls.",
    science: "Porous pillar heat conduction, flue buoyancy chimney convection, latent steam humidity, and thermal comfort stratification.",
    controlsGuide: "Fuel hypocaust furnace, regulate caldarium water temperatures, and direct heated air through wall tubuli bricks."
  },
  pantheon: {
    title: "Pantheon (Rotunda & Oculus)",
    book: "Plinius & Cassius Dio Historia Romana LIII.27",
    latinQuote: "Pantheum Agrippae tholus caeli imaginem reddit, oculo aperto lucem fundens.",
    translation: "The dome of Agrippa's Pantheon mirrors the sphere of heaven, pouring daylight through its open eye.",
    science: "Step-ring dome mass reduction, stepped aggregate density grading (tufa to pumice), coffered ceiling relief, and solar beam oculus traversal.",
    controlsGuide: "Track solar beam projection across interior marble niches throughout the equinoxes, and inspect tensile hoop stress rings."
  },

  // Pavilion IX: Alchemia & Mineralia
  vitrum: {
    title: "Vitrum (Ars Vitriaria)",
    book: "Naturalis Historia Liber XXXVI, c. 65-67",
    latinQuote: "Navem nitri mercatores appulere... accensis ignibus harena cum nitro colliquefacta est in vitrum.",
    translation: "Merchants landed a ship of natron... fires being lit, the sand fused with the soda and flowed into glass.",
    science: "Silica-soda-lime eutectic phase transitions, glass transition temperature (Tg), viscosity curve, and glassblower lung pressure.",
    controlsGuide: "Melt natron sand mixture in furnace crucible, gather molten glass gather on blowpipe, and blow ornate Roman balsamaria flasks."
  },
  metallum: {
    title: "Metallum (Fornax & Ferrum)",
    book: "Naturalis Historia Liber XXXIV, c. 41",
    latinQuote: "Ferri metalla naturae nobilissimum et pessimum instrumentum sunt.",
    translation: "Iron ores are at once the most noble and the most terrible instrument of human nature.",
    science: "Carbon-iron phase diagram, bloomery solid-state reduction, forge quenching martensite crystal formation, and tempering embrittlement.",
    controlsGuide: "Pump twin leather forge bellows, hammer bloomery iron sponge, quench glowing gladius blades, and test Rockwell hardness."
  },
  pigmentum: {
    title: "Pigmentum (Color Fresco & Cinnabaris)",
    book: "Naturalis Historia Liber XXXV, c. 12-32",
    latinQuote: "Colorum duo genera: floridi et austeri. Minium e cinnabari pretiosissimum est.",
    translation: "There are two kinds of colors: the brilliant and the austere. Vermilion made from cinnabar is the most precious of all.",
    science: "Subtractive Kubelka-Munk optical color absorption/scattering, wet lime intonaco carbonatization, and pigment binder kinetics.",
    controlsGuide: "Select 6 authentic mineral pigments (Tyrian Purple, Egyptian Blue, Cinnabar, Malachite, Ochre, Lead White) and paint wet Pompeian frescoes."
  },
  hermetica: {
    title: "Hermetica (Alembic & Destillatio)",
    book: "Zosimos Panopolis & Naturalis Historia Liber XXX",
    latinQuote: "Vapor ascendit in alembicum, ibique frigore densatus per tubum in guttas redigitur.",
    translation: "Vapor rises into the alembic helm, and there condensed by cold, is converted through the spout into drops.",
    science: "Multi-component vapor-liquid equilibrium (Raoult's and Dalton's laws), condensation heat transfer, and fractional distillation yields.",
    controlsGuide: "Heat cucurbit boiler wash, regulate alembic helm cooling sponge, and collect refined distilled floral essences and spirits."
  },
  electrum: {
    title: "Electrum (Succinum & Triboelectricitas)",
    book: "Naturalis Historia Liber XXXVII, c. 11",
    latinQuote: "Succinum frictionis calore attractum ad se paleas et folia arida trahit.",
    translation: "Amber, heated by the friction of rubbing, attracts to itself chaff and dry leaves.",
    science: "Triboelectric electron transfer series, Coulomb electrostatic force (F = k * q1 * q2 / r^2), and dielectrophoretic polarization.",
    controlsGuide: "Rub amber rod with wool cloth, scatter lightweight gold leaf and wheat chaff, and ground discharge with high-voltage sparks."
  },

  // Pavilion X: Strategia & Legio
  testudo: {
    title: "Testudo (Scutorum Coniunctio)",
    book: "Naturalis Historia Liber VII & Polybius Historiae",
    latinQuote: "Scutis super capita densatis testudo fit, quae telorum imbres et saxa velut tectum sustinet.",
    translation: "With shields compacted above their heads a tortoise is formed, which sustains rains of missiles and rocks like a tiled roof.",
    science: "Rigid curved scutum impulse mechanics, projectile ricochet vector deflection, and interlocking shield grid cohesion.",
    controlsGuide: "Deploy Testudo, Acies Triplex line, or Orbis circle formations. Deflect incoming Parthian arrow volleys and advance upon the breach."
  },
  siege_tower: {
    title: "Siege Tower (Helepolis & Aries)",
    book: "Vitruvius Liber X, c. 13-15 & Naturalis Historia Liber VII",
    latinQuote: "Turris ambulatoria multis tabulatis structa, arietem in imo gestans et pontem in summo.",
    translation: "A walking tower constructed with many stories, carrying a battering ram at the base and a drawbridge at the summit.",
    science: "Rolling wheel timber track friction, swinging battering ram momentum impact (p = m*v), and pitch incendiary fire suppression.",
    controlsGuide: "Advance multi-story timber tower toward ramparts, swing bronze ram against stone gate, drop assault drawbridge, and douse flaming cauldrons."
  },
  hoplite_phalanx: {
    title: "Hoplite Phalanx (Othismos & Dory)",
    book: "Thucydides Historiae & Xenophon Anabasis",
    latinQuote: "Coniunctis umbonibus acies una quasi murus stetit, vir viro et hasta hastae haerente.",
    translation: "With boss joined to boss the line stood as one wall, man pressed against man and spear against spear.",
    science: "Crowd particle physics with inter-agent compressive pressure waves (othismos push dynamics), lowered spear hedge physics.",
    controlsGuide: "Select 4, 8, or 16 rank formation depth. Command mass othismos shove, lower front 3 ranks of dory spears, and clash with rival phalanx."
  },
  scorpio: {
    title: "Scorpio (Tormentum Sagittarium)",
    book: "Vitruvius De Architectura Liber X, c. 10",
    latinQuote: "Scorpiones minutiora tormenta sunt quae subtilissima iacula tanta vi mittunt ut scuta transverberent.",
    translation: "Scorpions are smaller engines that hurl precision bolts with such force as to pierce clean through shields.",
    science: "Precision torsion ballistics, aerodynamic windage deflection, crosshair range estimation, and kinetic armor penetration.",
    controlsGuide: "Crank bronze winch arms, aim crosshair reticle with windage compensation, and loose high-velocity armor-piercing iron bolts."
  },
  signal_fire: {
    title: "Signal Fire (Polybius Telegraphia)",
    book: "Polybius Historiae X.43-47 & Naturalis Historia Liber VII",
    latinQuote: "Polybius modum invenit per duas quinque facium ordines litteras omnes noctu transmittendi.",
    translation: "Polybius discovered a method to transmit every letter by night using two banks of five torches each.",
    science: "5x5 coordinate matrix encoding/decoding, optical line-of-sight signal propagation, and multi-node repeater latency.",
    controlsGuide: "Transmit military intelligence messages (HOSTIS ADEST, LEGIO VICTA). Toggle day smoke vs night torches across 4 mountain watchtowers."
  }
};
