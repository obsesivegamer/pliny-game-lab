# Pliny Game Lab Feature Map

Index of core user-facing features across the 50-engine, 10-Pavilion Pliny Game Lab suite.

## Hub-Level Features

| Feature | Surface | Harness | Verified State |
| :--- | :--- | :--- | :--- |
| [Showcase Homepage](showcase-homepage.md) | HTML + SVG floor plan | `node tests/showcase-qa.js` | Catalog-driven cards, search, pavilion filter, floor plan |
| [Hub Navigation](hub-navigation.md) | HTML dropdowns + buttons | `node tests/browser-qa.js` | Dual-view (Showcase ↔ Simulator), pavilion/game dropdowns, prev/next/random |
| [Procedural Audio](procedural-audio.md) | WebAudio API | `node tests/audio-qa.js` | Pavilion ambience, chimes, launch fanfare, synthesized FX |
| [Plinius Codex](plinius-codex.md) | HTML drawer + Canvas | `node tests/codex-qa.js` | Slide-out lore encyclopedia for all 50 engines |

## Flagship Engine Features (5 documented in depth)

| Feature | Surface | Harness | Verified State |
| :--- | :--- | :--- | :--- |
| [Vesuvius Volcanology](vesuvius-eruption.md) | Canvas 2D | `node tests/verify-engines.js` | 14,000+ particles, 7-phase eruption chronology |
| [Bestiarium ALife](bestiarium-flocking.md) | Canvas 2D | `node tests/verify-engines.js` | 190+ organisms, 6 Plinian species, Lotka-Volterra dynamics |
| [Mechanica Physics](mechanica-physics.md) | Canvas 2D | `node tests/verify-engines.js` | Verlet constraints, 5 Vitruvian machines, stress analysis |
| [Cosmographia Orbits](cosmographia-orbits.md) | Canvas 2D | `node tests/verify-engines.js` | 900+ stars, Ptolemaic & Keplerian orbits |
| [Labyrinthus Catacombs](labyrinthus-catacombs.md) | Raycaster + WebAudio | `node tests/verify-engines.js` | 3D DDA raycaster, A* Minotaur AI, Ariadne's thread |

## Remaining 45 Engines

All 45 remaining engines are covered by `node tests/verify-engines.js` (headless) and `node tests/browser-qa.js` (browser). They are organized across 10 Pavilions:

- **I. Ignis & Terra**: vesuvius, geyser, caverna, terrae_motus, aurum
- **II. Bestiarium & Silva**: bestiarium, myrmex, apis, hydra, silva
- **III. Mechanica & Machina**: mechanica, aqueduct, ballista, horologium, antikythera
- **IV. Cosmographia & Astra**: cosmographia, solstitium, aurora, cometa, armilla
- **V. Fabula & Arena**: labyrinthus, colosseum, trireme, chariot, oraculum
- **VI. Mathematica & Geometria**: euclid, archimedes_spiral, eratosthenes, pythagoras, fractal_roman
- **VII. Mare Nostrum**: scylla_charybdis, mare_nostrum, pharos, coral_reef, nautilus
- **VIII. Architectura & Structura**: forum_builder, arch_vault, opus_caementicium, thermae, pantheon
- **IX. Alchemia & Mineralia**: vitrum, metallum, pigmentum, hermetica, electrum
- **X. Strategia & Legio**: testudo, siege_tower, hoplite_phalanx, scorpio, signal_fire
