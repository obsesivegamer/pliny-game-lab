# Feature: Hub Navigation

Dual-view navigation system switching between Showcase homepage and play view, with collection/game dropdowns and sequential/random game navigation.

## Sub-features
- Dual-view toggle: Showcase (floor plan + shelves) ↔ Simulator (active engine + controls panel).
- Nav bar with "All games" (`#showcase-nav-btn`) and "Play" (`#simulator-nav-btn`) buttons (active one underlined).
- `switchView()` sets `body[data-view]`; header elements with class `sim-only` (pickers, arrows, readouts, fullscreen) are hidden on the showcase.
- Collection dropdown (Puzzle Arcade plus 10 original pavilions) filtering the game dropdown.
- Game dropdown (10 puzzles in the arcade, 5 games per original pavilion) switching the active game.
- Previous/next buttons for sequential navigation across the whole catalog.
- Random game button.
- URL hash routing: `#showcase`, `#game={key}` for deep linking.
- Brand logo click returns to Showcase.
- `Esc` key returns to Showcase from Simulator.
- Keyboard shortcuts: `P` for the Puzzle Arcade, number keys 1–9 and 0 for the original pavilion filters (in Showcase view).
- Game counter readout: "Game X/60".

## How to get to it (user POV)
1. The nav bar is always visible at the top of the page.
2. Click "All games" or "Simulator" to switch views.
3. Use the Pavilion dropdown to filter engines by category.
4. Use the Game dropdown to switch the active engine.
5. Use the arrows to step through games or the die for a random one.

## Driving it with headless harness
```bash
node tests/browser-qa.js
# Exercises launchDemo() for all 60 games, verifying view transitions
```

## Source entry points
- `src/core/hub.js`: `switchView()`, `launchDemo()`, `handleInitialRoute()`, `initViewControls()`, `initNavigationControls()`
- `index.html`: `#pavilion-select`, `#game-select`, `#prev-game-btn`, `#next-game-btn`, `#random-game-btn`

## Gotchas
- `switchView("simulator")` hides the showcase DOM and shows the viewport container; if the showcase CSS transition hasn't completed, screenshots may capture the showcase instead.
- Hash routing only triggers on `hashchange` events, not on initial `DOMContentLoaded` (handled separately by `handleInitialRoute()`).
