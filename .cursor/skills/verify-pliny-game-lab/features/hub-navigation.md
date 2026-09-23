# Feature: Hub Navigation

Dual-view navigation system switching between Showcase homepage and Simulator game view, with pavilion/game dropdowns and sequential/random engine navigation.

## Sub-features
- Dual-view toggle: Showcase (floor plan + shelves) ↔ Simulator (active engine + controls panel).
- Nav bar with "All games" (`#showcase-nav-btn`) and "Simulator" (`#simulator-nav-btn`) buttons (active one underlined).
- `switchView()` sets `body[data-view]`; header elements with class `sim-only` (pickers, arrows, readouts, fullscreen) are hidden on the showcase.
- Pavilion dropdown (10 pavilions) filtering the game dropdown.
- Game dropdown (5 engines per pavilion) switching the active engine.
- Previous/next buttons for sequential navigation across the whole catalog.
- Random game button.
- URL hash routing: `#showcase`, `#game={key}` for deep linking.
- Brand logo click returns to Showcase.
- `Esc` key returns to Showcase from Simulator.
- Keyboard shortcuts: number keys 1–9, 0 for pavilion filter chips (in Showcase view).
- Game counter readout: "Game X/N", where N is the catalog size.

## How to get to it (user POV)
1. The nav bar is always visible at the top of the page.
2. Click "All games" or "Simulator" to switch views.
3. Use the Pavilion dropdown to filter engines by category.
4. Use the Game dropdown to switch the active engine.
5. Use the arrows to step through games or the die for a random one.

## Driving it with headless harness
```bash
node tests/browser-qa.js
# Exercises launchDemo() for all 50 engines, verifying view transitions
```

## Source entry points
- `src/core/hub.js`: `switchView()`, `launchDemo()`, `handleInitialRoute()`, `initViewControls()`, `initNavigationControls()`
- `index.html`: `#pavilion-select`, `#game-select`, `#prev-game-btn`, `#next-game-btn`, `#random-game-btn`

## Gotchas
- `switchView("simulator")` hides the showcase DOM and shows the viewport container; if the showcase CSS transition hasn't completed, screenshots may capture the showcase instead.
- Hash routing only triggers on `hashchange` events, not on initial `DOMContentLoaded` (handled separately by `handleInitialRoute()`).
