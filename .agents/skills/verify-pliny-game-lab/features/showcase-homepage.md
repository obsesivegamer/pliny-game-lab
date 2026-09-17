# Feature: Showcase Homepage

Interactive landing page displaying all 50 engines with search, pavilion filter chips, and card grid with screenshot previews.

## Sub-features
- Hero section with animated stats counters (50 Engines, 10 Pavilions, 37 Books of Pliny, 0 Dependencies, 60 FPS).
- "▶ Launch Vesuvius (#1)", "🎲 Random Engine", and "📜 Explore All 50 ↓" hero buttons.
- Live search bar (hotkey `/`) filtering cards by name, description, physics keywords.
- 11 pavilion filter chips (All + 10 pavilions) with active highlight and match counter.
- 50-card responsive grid with:
  - Engine screenshot preview (loaded from `assets/screenshots/{num}_{key}.png`).
  - Pavilion badge with color dot.
  - Engine name, physics description summary, and interactivity hint.
  - Click → launches engine in Simulator view via `launchDemo(key)`.
- Match counter showing "Showing X of 50 engines".

## How to get to it (user POV)
1. Open `http://localhost:8000` — Showcase is the default view.
2. Scroll down to see the 50-card grid.
3. Type in the search bar to filter.
4. Click pavilion chips to filter by category.
5. Click any card to launch that engine.
6. Press `Esc` from Simulator to return to Showcase.

## Driving it with headless harness
```bash
node tests/showcase-qa.js
```

Exercises: default view activation, 50 cards rendered, 11 chips rendered, search filtering ("antikythera" → 1 match), chip filtering ("bestiarium" pavilion → 5 visible), card click → Simulator launch, Esc → Showcase return.

## Source entry points
- `src/core/hub.js`: `initShowcase()` (line ~860), `selectPavilionFilter()`, `filterShowcaseCards()`
- `index.html`: `#showcase-view`, `#showcase-grid`, `#showcase-chips`, `#showcase-search`

## Gotchas
- Screenshot images are loaded lazily from `assets/screenshots/`; if screenshots are missing or show homepage snapshots instead of simulations, the cards will display incorrect previews.
