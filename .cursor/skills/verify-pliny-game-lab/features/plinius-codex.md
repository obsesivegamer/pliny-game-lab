# Feature: Plinius Codex Lore Drawer

Slide-out drawer displaying brief rules for each puzzle game and historical lore for each of the fifty original simulations.

## Sub-features
- Codex button (`#codex-toggle-btn`) in the header opens a slide-out drawer overlay.
- The ten puzzle entries show their objective and controls. The fifty original entries show Latin titles, Naturalis Historia references, and simulation design notes.
- Puzzle entries hide the science and historical reference sections; those sections return for original simulations.
- Entries update automatically when switching engines.
- Scrollable content with styled Roman typography.

## How to get to it (user POV)
1. Click the Codex button in the header (visible in both Showcase and Simulator views; icon only on phones).
2. The drawer slides out from the right side of the screen.
3. Switch engines while the drawer is open — content updates automatically.
4. Click the close button or click outside to dismiss.

## Driving it with headless harness
```bash
node tests/codex-qa.js
```

## Source entry points
- `src/core/codex.js`: `CODEX_DATA` object mapping engine keys to lore entries
- `src/core/hub.js`: `openCodex()`, `closeCodex()`, codex drawer DOM management
- `index.html`: `#codex-drawer`, `#codex-toggle-btn`

## Gotchas
- Original lore is a static object in `codex.js`; puzzle rules are provided by the puzzle catalog in `hub.js`.
- The drawer uses CSS transitions for the slide animation.
