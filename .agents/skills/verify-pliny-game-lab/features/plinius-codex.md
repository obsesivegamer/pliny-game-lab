# Feature: Plinius Codex Lore Drawer

Slide-out encyclopedia drawer displaying historical lore, Pliny the Elder references, and simulation design notes for each of the 50 engines.

## Sub-features
- 📜 Codex toggle button in the nav bar opens a slide-out drawer overlay.
- Per-engine lore entries with Latin titles, Naturalis Historia book references, and simulation design rationale.
- Entries update automatically when switching engines.
- Scrollable content with styled Roman typography.

## How to get to it (user POV)
1. Click the 📜 Codex icon in the nav bar (visible in both Showcase and Simulator views).
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
- `index.html`: `#codex-drawer`, `#codex-toggle`

## Gotchas
- The codex data is a static object in `codex.js`; new engines need entries added manually.
- The drawer uses CSS transitions for the slide animation.
