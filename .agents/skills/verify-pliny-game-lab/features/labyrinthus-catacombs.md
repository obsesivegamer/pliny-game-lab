# Feature: Labyrinthus 3D Catacomb Crawler

Classic Wolfenstein-style DDA raycasting, procedural maze generation, A* Asterion Minotaur AI, Ariadne's thread, and procedural WebAudio synthesis.

## Sub-features
- 3D DDA (Digital Differential Analyzer) raycasting rendering vertical column slices with depth fog.
- Procedural catacomb maze generation with Roman architecture corridors (4 difficulty levels).
- A* pathfinding Asterion (Minotaur) AI that hunts the player through the labyrinth.
- Ariadne's thread: glowing trail that tracks the player's path for backtracking.
- Billboarded 2D sprites in pseudo-3D space: Minotaur, torches, relics.
- WebAudio API procedural synthesizer generating ambient dungeon drones, footsteps, and arcane spell sounds without static audio files.
- HP and Stamina bars with combat mechanics.
- Minimap radar HUD (toggled with M key / "Reveal Blueprint" button).
- Drop Stone (Space) for sound-based Minotaur distraction.
- Teleport Sanctuary and Reset Labyrinth buttons.
- 4 relic collectibles per labyrinth run.

## How to get to it (user POV)
1. Open `http://localhost:8000` in browser (Showcase homepage loads).
2. Find the "Labyrinthus" card in the grid (Pavilion V: Fabula & Arena) or use the search bar.
3. Click the card to launch it in Simulator view.
4. Alternatively: select "V. Fabula & Arena" from the Pavilion dropdown, then "21. Labyrinthus" from the Game dropdown.
5. Click "Enter the Labyrinth of Daedalus" to begin.
6. Use `W`/`S` to walk forward/back, `A`/`D` or Arrow keys to turn.
7. Press `Space` to cast an arcane projectile bolt.
8. Press `M` to toggle the minimap blueprint.
9. Use difficulty selector (floors 1–4) for increasing maze complexity.

## Driving it with headless harness
Execute via test suite:
```bash
node tests/verify-engines.js
# Labyrinthus is engine #21; look for "[21/50] ✓ labyrinthus (LabyrinthusEngine) OK"
```

The engine exports `LabyrinthusEngine` from `src/demos/labyrinthus/labyrinthus.js`.
Audio module: `src/demos/labyrinthus/audio.js`.
Entity count after 60 ticks: ~40 active 3D sprites.

## Gotchas
- Browsers block WebAudio autoplay until the user interacts with the canvas via mouse click or keypress.
- Raycasting resolution slider allows switching from high detail (1 ray per screen column) to medium (1 ray per 2 columns) for high-framerate rendering on lower-power devices.
- The Minotaur ("Asterion") uses A* pathfinding and can be distracted by dropped stones.
