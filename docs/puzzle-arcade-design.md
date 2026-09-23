# Puzzle Arcade design

The approved plan adds ten short puzzle games before the existing 50 simulations. The old game keys and relative order remain unchanged.

## Player experience

Each game has one visible goal, a teachable first move, direct touch input, undo or retry, and a clear completion screen. Boards use flat color, strong outlines, and symbols that remain distinguishable without color. The first authored puzzle should take less than a minute to solve; later puzzles add one rule at a time. Progress is stored locally.

## Integration

Add an unnumbered Puzzle Arcade group before the existing pavilions. Register ten ES-module engines at the start of `DEMOS`; keep existing engine keys and URLs. Give every card an explicit thumbnail path so rank changes do not break images. Derive visible totals from the catalog. Keep the legacy 1–0 pavilion shortcuts and add a separate puzzle shortcut. Puzzle help uses game rules, not invented historical excerpts.

## Engineering

Game logic is independent of Canvas rendering and the hub. Each level-based game ships at least twelve authored levels with a known solution replayed by tests. The existing engine lifecycle remains: constructor, resize, update, render, input handlers, entity count, and destroy. Shared helpers cover only responsive board drawing, controls, undo, and local progress. The 50 existing engines remain untouched.

## Release gates

All 60 engines load and render without placeholders or console errors. Puzzle solution replays pass, all old URLs still select their engines, and the first/last legacy ranks become 11/60. Browser checks cover desktop and phone touch. Existing headless and visual suites report 60 passing with no pending engines, warnings, or errors. Human playtests assess whether first-time players understand and want to continue; they are not replaced by automated tests.
