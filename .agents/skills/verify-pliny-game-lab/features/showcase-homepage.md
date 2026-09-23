# Feature: Showcase Homepage

Blueprint-style landing page: a generated floor plan of the pavilions, then every game shelved by pavilion with search and a pavilion filter. Everything is built from `DEMOS` and `PAVILIONS`, so counts are never hardcoded.

## Sub-features
- Hero floor plan (`#showcase-plan`, SVG): one room per pavilion, laid clockwise around an atrium; one small plinth per game in each room. Hovering or focusing a room fills `#plan-legend` with the pavilion name and its games. Clicking a room filters to that pavilion and scrolls to the index.
- Hero buttons: `#hero-launch-btn` ("Play Vesuvius", always Vesuvius), `#hero-random-btn` ("Random game"), and a "Browse the index" link.
- Title block and `[data-stat="games"]` / `[data-stat="pavilions"]` spans, filled from the catalog.
- Index (`#showcase-bar`): sticky sidebar with search (`#showcase-search`, hotkey `/`), match count (`#showcase-count`, "50 games" or "5 of 50 games"), and pavilion filter buttons (`#showcase-chips .chip-btn`, `data-pav` = pavilion id or `all`, `.active` + `aria-pressed` on the selected one). On phones (≤768px) the sidebar becomes a sticky bar with a horizontally scrolling strip of pavilions.
- Shelves: one `section.pavilion-group` per pavilion, each with a numbered callout, title, gloss and a grid of cards.
- Cards (`a.engine-card[data-key][data-pavilion]`, `href="#game=<key>"`): thumbnail, room number (pavilion III, second game → `302`; pavilion X → `1001`), `.card-title`, subtitle, description. A plain click calls `launchDemo(key)`; a modified click opens the game in a new tab.
- Filtering hides cards with `style.display = "none"` and hides a shelf whose cards are all hidden. `#showcase-empty` shows when nothing matches.
- Revisions table and a closing "Play Vesuvius" button (`[data-launch="vesuvius"]`).

## How to get to it (user POV)
1. Open `http://localhost:8000`. The showcase is the default view.
2. Hover rooms on the floor plan; click one to jump to its shelf.
3. Press `/` and type to search; press `Esc` in the search box to clear it.
4. Click a pavilion in the index, or press `1`–`9`/`0` for pavilions I–X and `A` for all.
5. Arrow keys move focus between visible cards, following the rendered grid; `Enter` launches the focused card.
6. Click any card to launch that game. `Esc` in the simulator returns here.

## Driving it with headless harness
```bash
node tests/showcase-qa.js
```

Exercises: default view, card count, chip count (All + pavilions), search ("antikythera" → 1 match), chip filter ("alchemia" → 5 visible), card click → simulator with `#game=antikythera`, the nav button back to the showcase, and the phone controls-sheet geometry. `tests/audio-qa.js` also checks arrow-key focus, the `3`/`a` shortcuts and that the floor plan has one room per pavilion.

## Thumbnails
- Cards load `assets/thumbs/<key>.webp`, then fall back to `assets/screenshots/NN_<key>.png` (NN = catalog position), then show a hatched "Drawing pending" plate.
- With the server running, `node scripts/capture-thumbs.js` captures only games missing a thumb; add `--all` to redo every game, or pass keys. It crops each engine's canvas to 800x500, so thumbs never include the header or controls panel.

## Source entry points
- `src/core/showcase.js`: `buildCatalog()`, `renderShowcase()`, `applyShowcaseFilter()`, `neighborCard()`, and the floor-plan helpers (`planRooms`, `buildPlan`).
- `src/core/hub.js`: `initShowcase()`, `selectPavilionFilter()` and `filterShowcase()` delegate to the module; `setupKeyboardShortcuts()` holds the `/`, number, `A` and arrow keys.
- `index.html`: `#showcase-view`, `#showcase-plan`, `#plan-legend`, `#showcase-bar`, `#showcase-search`, `#showcase-chips`, `#showcase-grid`, `#showcase-empty`.

## Gotchas
- Pavilion names must keep the `"<Roman numeral>. <Title> (<Gloss>)"` shape and game names `"<Title> (<Subtitle>)"`; the showcase splits them for display.
- A game shows under the pavilion named by its `pavilionId`, not by `PAVILIONS[].games`.
- The floor plan draws itself on load (about 2s for ten rooms), and room labels fade in last. Wait for that before screenshotting the plan, or set `prefers-reduced-motion`.
- `#showcase-view` is the scroll container, not the window; scroll it with `scrollTop` in tests.
