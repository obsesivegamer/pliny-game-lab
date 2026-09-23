# Feature: Showcase Homepage

Blueprint-style landing page: a generated floor plan of the Puzzle Arcade and ten original pavilions, then sixty ranked cards with search and collection filters. Everything is built from `DEMOS` and `PAVILIONS`.

## Sub-features
- Hero floor plan (`#showcase-plan`, SVG): eleven rooms around an atrium, Puzzle Arcade first, with one small plinth per game. Hovering or focusing a room fills `#plan-legend`; clicking filters to that collection and scrolls to the index.
- Hero buttons: `#hero-launch-btn` ("Play Oracle Words"), `#hero-random-btn` ("Random game"), and a "Browse the index" link.
- Title block and `[data-stat="games"]` / `[data-stat="pavilions"]` spans, filled from the catalog.
- Index (`#showcase-bar`): sticky sidebar with search (`#showcase-search`, hotkey `/`), match count (`#showcase-count`, "60 games" or "5 of 60 games"), and collection filter buttons (`#showcase-chips .chip-btn`, `data-pav` = collection id or `all`). On phones (≤768px) the sidebar becomes a scrolling strip.
- Shelves: one `section.pavilion-group` per pavilion, each with a numbered callout, title, gloss and a grid of cards.
- Cards (`a.engine-card[data-key][data-pavilion]`, `href="#game=<key>"`): thumbnail, global rank badge (`#01` through `#60`), room number (Puzzle Arcade → `01`–`10`; original pavilion III, second game → `302`), title and description. A plain click calls `launchDemo(key)`; a modified click opens a new tab.
- Filtering hides cards with `style.display = "none"` and hides a shelf whose cards are all hidden. `#showcase-empty` shows when nothing matches.
- Revisions table and a closing "Play Oracle Words" button (`[data-launch="oracle_words"]`).

## How to get to it (user POV)
1. Open `http://localhost:8000`. The showcase is the default view.
2. Hover rooms on the floor plan; click one to jump to its shelf.
3. Press `/` and type to search; press `Esc` in the search box to clear it.
4. Click a collection in the index, or press `P` for puzzles, `1`–`9`/`0` for pavilions I–X, and `A` for all.
5. Arrow keys move focus between visible cards, following the rendered grid; `Enter` launches the focused card.
6. Click any card to launch that game. `Esc` in the simulator returns here.

## Driving it with headless harness
```bash
node tests/showcase-qa.js
```

Exercises: default view, 60 cards, 12 chips, search ("antikythera" → 1 match), chip filtering, card launch, return navigation, and phone controls geometry. `tests/puzzle-browser-qa.js` checks the first ten keys, rank badges, Oracle Words, and puzzle launches. `tests/audio-qa.js` checks the `P` shortcut and eleven plan rooms.

## Thumbnails
- Puzzle cards load their `assets/screenshots/<key>.svg` artwork directly. Original simulation cards load `assets/thumbs/<key>.webp`, then their preserved original numbered PNG. A missing image shows a hatched "Drawing pending" plate.
- With the server running, `node scripts/capture-thumbs.js` captures only games missing artwork; add `--all` to redo WebP captures, or pass keys. It crops each engine's canvas to 800x500.

## Source entry points
- `src/core/showcase.js`: `buildCatalog()`, `renderShowcase()`, `applyShowcaseFilter()`, `neighborCard()`, and the floor-plan helpers (`planRooms`, `buildPlan`).
- `src/core/hub.js`: `initShowcase()`, `selectPavilionFilter()` and `filterShowcase()` delegate to the module; `setupKeyboardShortcuts()` holds the `/`, number, `A` and arrow keys.
- `index.html`: `#showcase-view`, `#showcase-plan`, `#plan-legend`, `#showcase-bar`, `#showcase-search`, `#showcase-chips`, `#showcase-grid`, `#showcase-empty`.

## Gotchas
- Original pavilion names keep the `"<Roman numeral>. <Title> (<Gloss>)"` shape. Puzzle Arcade is a special unnumbered collection. A game name can omit a subtitle in parentheses.
- A game shows under the pavilion named by its `pavilionId`, not by `PAVILIONS[].games`.
- The floor plan draws itself on load (about 2s for eleven rooms), and room labels fade in last. Wait for that before screenshotting the plan, or set `prefers-reduced-motion`.
- `#showcase-view` is the scroll container, not the window; scroll it with `scrollTop` in tests.
