# Feature: Procedural Audio System

Fully procedural WebAudio soundscape with no static audio files: pavilion-specific ambient soundscapes, UI chimes, launch fanfare, and per-engine synthesized sound effects.

## Sub-features
- 10 pavilion-specific ambient soundscapes (e.g., volcanic rumble for Ignis, forest birdsong for Bestiarium, mechanical clanks for Mechanica).
- UI interaction chimes (note-based, e.g., D5 on hover, A4 on chip click).
- Launch fanfare on engine activation.
- Soundscape HUD toggle and volume controls.
- AudioContext resume on user interaction (browser autoplay policy compliance).
- All audio is procedurally synthesized via oscillators, noise buffers, and filters — zero static audio files.

## How to get to it (user POV)
1. Click anywhere on the page to activate the AudioContext (browser autoplay policy).
2. Navigate between pavilions — ambient soundscape changes automatically.
3. Click UI elements to hear interaction chimes.
4. Launch an engine to hear the launch fanfare.
5. The soundscape HUD shows the current ambient state.

## Driving it with headless harness
```bash
node tests/audio-qa.js
```

## Source entry points
- `src/core/sound.js`: `SoundMaster` class, `startPavilionAmbience()`, `playChime()`, `playLaunchFanfare()`, `resume()`
- `src/demos/labyrinthus/audio.js`: Engine-specific procedural synthesizer for dungeon audio

## Gotchas
- WebAudio autoplay is blocked until user interaction; `soundMaster.resume()` is called on first click/key.
- Some browsers limit the number of concurrent AudioContext nodes; the system reuses oscillator pools.
