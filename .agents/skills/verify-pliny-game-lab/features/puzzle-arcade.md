# Feature: Puzzle Arcade

The first ten showcase cards form an unnumbered Puzzle Arcade. The fifty original simulations follow in their previous order. The art is flat Canvas drawing with a separate SVG card illustration for each puzzle.

## Games

1. Oracle Words — five-letter deduction with duplicate-letter feedback; daily and endless words.
2. Canal Lines — draw one canal from spring to sea through every gold field.
3. Stonefall — rotate and place falling triominoes to clear rows.
4. Lantern Push — push crates onto marked goals.
5. Mirror Harbor — turn mirrors to guide a beam to its goal.
6. Mosaic Clues — fill a nonogram using row and column clues.
7. Harbor Jam — slide vehicles until the target can escape.
8. Star Switch — toggle lights to match the target pattern.
9. Number Forge — combine three numbers with arithmetic to hit a target.
10. Signal Route — lay a route by rotating arrow tiles.

The eight level-based games have twelve authored levels each. Oracle Words saves the daily round locally and offers unlimited fresh rounds. Stonefall stores its best score locally. Level puzzles offer retry, hints, undo where useful, and next-level controls. `src/core/puzzle.js` supplies shared controls, progress, board sizing, and keyboard cursor behavior. Puzzle controls are touch targets as well as mouse targets.

## How to drive it

1. Open the showcase and choose one of the first ten cards, or use "Play Oracle Words".
2. Read the rule and first-level hint in the controls panel. On a phone, the panel sits below the game board.
3. Use on-screen controls or the keyboard. Arrow keys move a board cursor and Enter activates it when the puzzle has a cell grid.
4. Finish a level and use Next to advance. Retry resets the current level.

## Verification

```bash
./scripts/verify-all.sh
node tests/puzzle-browser-qa.js
node tests/puzzle-playthrough-qa.js
node tests/puzzle-mobile-qa.js
node tests/puzzle-keyboard-qa.js
```

`verify-all.sh` covers all sixty engine contracts and puzzle rule tests. The browser suites cover catalog placement, representative first-level solves, all ten phone layouts, touch play, and keyboard play. They use `http://localhost:8000` by default; set `PLINY_BASE_URL` when using another port.

## Source entry points

- `src/core/hub.js`: game order, collection metadata, dynamic imports, puzzle guide and puzzle ambience.
- `src/core/puzzle.js`: common board and controls.
- `src/demos/<key>/<key>.js`: each game engine.
- `src/core/showcase.js`: card ranking, grouping and puzzle artwork.
