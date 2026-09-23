# 🏛️ Pliny Game Lab

[![GitHub Pages Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-gold?style=for-the-badge&logo=github)](https://obsesivegamer.github.io/pliny-game-lab/)
[![Engines Verified](https://img.shields.io/badge/Engines-50%2F50%20Green-emerald?style=for-the-badge)](https://github.com/obsesivegamer/pliny-game-lab)
[![Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-blue?style=for-the-badge)](https://github.com/obsesivegamer/pliny-game-lab)
[![Audio](https://img.shields.io/badge/Audio-Procedural%20WebAudio%20API-purple?style=for-the-badge)](https://github.com/obsesivegamer/pliny-game-lab)

> **"Natura nihil frustra facit, omniaque ad ordinem componit."**  
> *"Nature does nothing in vain, and arranges all things according to order."*  
> — Gaius Plinius Secundus (AD 23/24 – 79)

**Pliny Game Lab** is a monumental 50-engine classical procedural simulation laboratory inspired by Pliny the Elder's 37 books of *Naturalis Historia*.

Every single engine is a **pure, self-contained ES module** running in Canvas 2D and the Web Audio API with **zero external dependencies** (no frameworks, no bundlers, no external audio files or sprites).

🎮 **Live Interactive Showcase**: [https://obsesivegamer.github.io/pliny-game-lab/](https://obsesivegamer.github.io/pliny-game-lab/)

---

## 🏛️ The Ten Thematic Pavilions (50 Engines)

| Pavilion | Theme & Focus | Simulations (5 per Pavilion) |
|---|---|---|
| **I. Ignis & Terra** | Volcanology, Speleothems & Seismology | `01. Vesuvius`, `02. Geyser`, `03. Caverna`, `04. Terrae Motus`, `05. Aurum` |
| **II. Bestiarium & Silva** | Artificial Life, Boids & Botany | `06. Bestiarium`, `07. Myrmex`, `08. Apis`, `09. Hydra`, `10. Silva` |
| **III. Mechanica & Machina** | Vitruvian Engineering & Heron's Automata | `11. Mechanica`, `12. Aqueduct`, `13. Ballista`, `14. Horologium`, `15. Antikythera` |
| **IV. Cosmographia & Astra** | Ptolemaic & Keplerian Celestial Mechanics | `16. Cosmographia`, `17. Solstitium`, `18. Aurora`, `19. Cometa`, `20. Armilla` |
| **V. Fabula & Arena** | Mythology, Roman Games & Naval Warfare | `21. Labyrinthus`, `22. Colosseum`, `23. Trireme`, `24. Chariot`, `25. Oraculum` |
| **VI. Mathematica & Geometria** | Euclidean Geometry & Harmonics | `26. Euclid`, `27. Archimedes Spiral`, `28. Eratosthenes`, `29. Pythagoras`, `30. Fractal Roman` |
| **VII. Mare Nostrum** | Oceanography, Hydrodynamics & Marine ALife | `31. Scylla & Charybdis`, `32. Mare Nostrum`, `33. Pharos`, `34. Coral Reef`, `35. Nautilus` |
| **VIII. Architectura & Structura** | Roman Architecture, Concrete & Domes | `36. Forum Builder`, `37. Arch Vault`, `38. Opus Caementicium`, `39. Thermae`, `40. Pantheon` |
| **IX. Alchemia & Mineralia** | Materials Science, Glass & Pigments | `41. Vitrum`, `42. Metallum`, `43. Pigmentum`, `44. Hermetica`, `45. Electrum` |
| **X. Strategia & Legio** | Roman Military Engineering & Tactics | `46. Testudo`, `47. Siege Tower`, `48. Hoplite Phalanx`, `49. Scorpio`, `50. Signal Fire` |

---

## 🌟 Key Architecture & Highlights

1. **Showcase Homepage** (`src/core/showcase.js`):
   - Drawn as an architect's blueprint: a Roman house floor plan where each room is a pavilion (hover to see its games, click to open its shelf).
   - Games are shelved by pavilion with architectural room numbers (pavilion III, second game → room 302).
   - Everything, including the floor plan, counts and filters, is generated from `DEMOS` and `PAVILIONS`, so new games and pavilions need no markup changes.
   - Live search (hotkey `/`) and a pavilion index that turns into a scrolling strip on phones.
   - Keyboard navigation (`Arrow keys` to move between games, `Enter` to launch, `1-0` for pavilion quick-jumps, `A` for all).
   - Thumbnails are captured from each game's own canvas into `assets/thumbs/<key>.webp` by `node scripts/capture-thumbs.js`.

2. **📖 Plinius Codex**:
   - Slide-out drawer (hotkey `C` / `Escape`, or the Codex button in the header).
   - Curated Latin text citations and English translations from Pliny's *Naturalis Historia*, Vitruvius, and Ovid for all 50 simulations.
   - Explanations of underlying physical and mathematical principles simulated.

3. **Procedural Web Audio Synthesizer**:
   - Pure procedural Web Audio API synthesis with zero external audio assets (`src/core/sound.js`).
   - 8 authentic instruments: Karplus-Strong plucked lyre, dual-pipe aulos, Alexandrian hydraulis organ, Roman salpinx horn, tympanum drum, crotala clappers, temple chimes, and victorious fanfare.
   - 10 generative ambient soundscapes tuned to each pavilion's atmosphere.
   - Master volume slider with exponential gain ramping and dynamic Soundscape HUD pill.

4. **Monumental Simulation Depth**:
   - Over **90,500 lines of simulation code** across the repository.
   - Flagship simulations feature full thermodynamic cellular automata (`vesuvius`), 6-species predator-prey food webs (`bestiarium`), 5 Vitruvian machines with stress tensors (`mechanica`), and pure Canvas 2D 3D DDA raycasting with A* Minotaur stalking AI (`labyrinthus`).

---

## 🚀 Getting Started Locally

Because Pliny Game Lab uses standard ES modules and Web APIs, no build step or package installation is required to run the application.

```bash
# Clone the repository
git clone https://github.com/obsesivegamer/pliny-game-lab.git
cd pliny-game-lab

# Start any static HTTP server (e.g. Python, Node, or Caddy)
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your modern browser.

---

## 🧪 Automated Verification Suites

The codebase includes full headless and browser-automated QA verification suites:

```bash
# Run 50-engine headless physics simulation harness (Node.js)
node tests/verify-engines.js

# Run 50-engine deep visual QA (Canvas 2D call inspector, NaN guards, save/restore balance)
node tests/visual-qa.js

# Run Puppeteer E2E test suites (Showcase, Codex drawer, Procedural Audio)
node tests/showcase-qa.js
node tests/codex-qa.js
node tests/audio-qa.js

# Run full project verification suite
./scripts/verify-all.sh

# Capture showcase thumbnails for games that don't have one yet (add --all to redo every game)
node scripts/capture-thumbs.js
```

---

## 📜 License

Inspired by Gaius Plinius Secundus (AD 23/24 – 79).  
Distributed under the MIT License.
