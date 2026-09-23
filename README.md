# 🏛️ Pliny Game Lab

[![GitHub Pages Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-gold?style=for-the-badge&logo=github)](https://obsesivegamer.github.io/pliny-game-lab/)
[![Catalog Verified](https://img.shields.io/badge/Catalog-60%2F60%20Green-emerald?style=for-the-badge)](https://github.com/obsesivegamer/pliny-game-lab)
[![Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-blue?style=for-the-badge)](https://github.com/obsesivegamer/pliny-game-lab)
[![Audio](https://img.shields.io/badge/Audio-Procedural%20WebAudio%20API-purple?style=for-the-badge)](https://github.com/obsesivegamer/pliny-game-lab)

> **"Natura nihil frustra facit, omniaque ad ordinem componit."**  
> *"Nature does nothing in vain, and arranges all things according to order."*  
> — Gaius Plinius Secundus (AD 23/24 – 79)

**Pliny Game Lab** starts with ten short puzzle games and keeps the original fifty classical simulations inspired by Pliny the Elder's *Naturalis Historia*.

The games run as browser ES modules with Canvas 2D and Web Audio. No framework or build step is needed to play.

🎮 **Live Interactive Showcase**: [https://obsesivegamer.github.io/pliny-game-lab/](https://obsesivegamer.github.io/pliny-game-lab/)

---

## 🧩 Puzzle Arcade (showcase slots 1–10)

| Game | Goal |
|---|---|
| Oracle Words | Find a five-letter word in six guesses; try the daily word or unlimited play. |
| Canal Lines | Draw one canal through every field to the sea. |
| Stonefall | Move and rotate falling stones to clear rows. |
| Lantern Push | Push lanterns onto marked floor tiles. |
| Mirror Harbor | Turn mirrors to light a lighthouse. |
| Mosaic Clues | Fill a small picture from row and column clues. |
| Harbor Jam | Slide boats to let the courier leave. |
| Star Switch | Turn every star off by toggling its neighbors. |
| Number Forge | Combine three stones into a target number. |
| Signal Route | Place arrows to guide a courier through scrolls to a beacon. |

The eight level games have twelve puzzles each. Progress stays in this browser. Oracle Words saves the current daily round; Stonefall saves the best score. Puzzle controls support touch, mouse, and keyboard.

## 🏛️ The Ten Original Pavilions (showcase slots 11–60)

| Pavilion | Theme & Focus | Simulations (5 per Pavilion) |
|---|---|---|
| **I. Ignis & Terra** | Volcanology, Speleothems & Seismology | Vesuvius, Geyser, Caverna, Terrae Motus, Aurum |
| **II. Bestiarium & Silva** | Artificial Life, Boids & Botany | Bestiarium, Myrmex, Apis, Hydra, Silva |
| **III. Mechanica & Machina** | Vitruvian Engineering & Heron's Automata | Mechanica, Aqueduct, Ballista, Horologium, Antikythera |
| **IV. Cosmographia & Astra** | Ptolemaic & Keplerian Celestial Mechanics | Cosmographia, Solstitium, Aurora, Cometa, Armilla |
| **V. Fabula & Arena** | Mythology, Roman Games & Naval Warfare | Labyrinthus, Colosseum, Trireme, Chariot, Oraculum |
| **VI. Mathematica & Geometria** | Euclidean Geometry & Harmonics | Euclid, Archimedes Spiral, Eratosthenes, Pythagoras, Fractal Roman |
| **VII. Mare Nostrum** | Oceanography, Hydrodynamics & Marine ALife | Scylla & Charybdis, Mare Nostrum, Pharos, Coral Reef, Nautilus |
| **VIII. Architectura & Structura** | Roman Architecture, Concrete & Domes | Forum Builder, Arch Vault, Opus Caementicium, Thermae, Pantheon |
| **IX. Alchemia & Mineralia** | Materials Science, Glass & Pigments | Vitrum, Metallum, Pigmentum, Hermetica, Electrum |
| **X. Strategia & Legio** | Roman Military Engineering & Tactics | Testudo, Siege Tower, Hoplite Phalanx, Scorpio, Signal Fire |

---

## 🌟 Key Architecture & Highlights

1. **Showcase Homepage** (`src/core/showcase.js`):
   - Drawn as an architect's blueprint: a Roman house floor plan with the Puzzle Arcade and ten original pavilions (hover to see their games, click to open a shelf).
   - Games are shelved by pavilion with architectural room numbers (pavilion III, second game → room 302).
   - Everything, including the floor plan, counts and filters, is generated from `DEMOS` and `PAVILIONS`, so new games and pavilions need no markup changes.
   - Live search (hotkey `/`) and a pavilion index that turns into a scrolling strip on phones.
   - Keyboard navigation (`Arrow keys` to move between games, `Enter` to launch, `P` for puzzles, `1-0` for original pavilion quick-jumps, `A` for all).
   - Original simulation thumbnails are captured from each canvas into `assets/thumbs/<key>.webp` by `node scripts/capture-thumbs.js`; the puzzle cards use simple SVG artwork.

2. **📖 Plinius Codex**:
   - Slide-out drawer (hotkey `C` / `Escape`, or the Codex button in the header).
   - Classical citations and translations for the fifty simulations; concise rules for the ten puzzles.
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
# Run the 60-engine headless harness (Node.js)
node tests/verify-engines.js

# Run the 60-engine visual QA (Canvas 2D call inspector, NaN guards, save/restore balance)
node tests/visual-qa.js

# Run Puppeteer E2E test suites (Showcase, Codex drawer, Procedural Audio)
node tests/showcase-qa.js
node tests/codex-qa.js
node tests/audio-qa.js

# Run puzzle rules, catalog, desktop playthrough, and phone touch QA
node tests/puzzle-catalog.js
node tests/puzzle-logic.js
node tests/puzzle-playthrough-qa.js
node tests/puzzle-mobile-qa.js
node tests/puzzle-keyboard-qa.js

# Run full project verification suite
./scripts/verify-all.sh

# Capture showcase thumbnails for games that don't have one yet (add --all to redo every game)
node scripts/capture-thumbs.js
```

Browser QA requires Node.js 22.12 or newer, `npm ci`, and Puppeteer's browser installation. The app itself needs no package installation. Set `PLINY_BASE_URL` to test a server on a port other than 8000.

---

## 📜 License

Inspired by Gaius Plinius Secundus (AD 23/24 – 79).  
Distributed under the MIT License.
