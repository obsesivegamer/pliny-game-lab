# Feature: Hub Navigation

Dual-view navigation system switching between Showcase homepage and Simulator game view, with pavilion/game dropdowns and sequential/random engine navigation.

## Sub-features
- Dual-view toggle: Showcase (card grid) ↔ Simulator (active engine + controls panel).
- Nav bar with Showcase and Simulator buttons (active state highlight).
- Pavilion dropdown (10 pavilions) filtering the game dropdown.
- Game dropdown (5 engines per pavilion) switching the active engine.
- ◁/▷ prev/next buttons for sequential engine navigation across all 50.
- 🎲 random engine button.
- URL hash routing: `#showcase`, `#game={key}` for deep linking.
- Brand logo click returns to Showcase.
- `Esc` key returns to Showcase from Simulator.
- Keyboard shortcuts: number keys 1–9, 0 for pavilion filter chips (in Showcase view).
- Game counter HUD: "Game: X/50".

## How to get to it (user POV)
1. The nav bar is always visible at the top of the page.
2. Click "Showcase" or "Simulator" buttons to switch views.
3. Use the Pavilion dropdown to filter engines by category.
4. Use the Game dropdown to switch the active engine.
5. Use ◁/▷ to step through engines or 🎲 for a random one.

## Driving it with headless harness
```bash
node tests/browser-qa.js
# Exercises launchDemo() for all 50 engines, verifying view transitions
```

## Source entry points
- `src/core/hub.js`: `switchView()`, `launchDemo()`, `handleInitialRoute()`, `initViewControls()`, `initNavigationControls()`
- `index.html`: `#pavilion-select`, `#game-select`, `#prev-btn`, `#next-btn`, `#random-btn`

## Gotchas
- `switchView("simulator")` hides the showcase DOM and shows the viewport container; if the showcase CSS transition hasn't completed, screenshots may capture the showcase instead.
- Hash routing only triggers on `hashchange` events, not on initial `DOMContentLoaded` (handled separately by `handleInitialRoute()`).
