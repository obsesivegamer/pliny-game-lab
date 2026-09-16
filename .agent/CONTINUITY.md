# Pliny Game Lab Continuity Briefing

## [PLANS]
- 2026-09-15T20:36:00-04:00 [CODE] Scale from 19 to 50 games when quota resets (~4h from now).
- 2026-09-15T20:36:00-04:00 [CODE] Use Opus 4.6 Thinking for game design/planning subagent FIRST, then Flash for code workers. Previous session skipped the Opus planning phase.

## [DECISIONS]
- 2026-09-15T20:25:00-04:00 [USER] Restricted subagents to Gemini 3.8 Flash High (flash). Planning reserved for Opus 4.6 Thinking. Gemini 3.1 Pro excluded.
- 2026-09-15T20:28:00-04:00 [CODE] Converted Hub engine loading to dynamic async imports for instant boot and modular loading across 50 engines.
- 2026-09-15T20:35:00-04:00 [USER] Identified that Opus was never invoked for game design/planning in Poteto Mode. Must be fixed in next session.

## [PROGRESS]
- 2026-09-15T20:20:00-04:00 [TOOL] 5 initial engines verified green: vesuvius, bestiarium, cosmographia, mechanica, labyrinthus.
- 2026-09-15T20:36:00-04:00 [TOOL] 14 new engines landed and verified. Total: 19/50 passed, 0 failed, 31 pending (quota exhausted).

## [DISCOVERIES]
- 2026-09-15T20:19:00-04:00 [TOOL] Headless Node simulation requires guarding controlsContainer and DOM queries with typeof document !== 'undefined'.
- 2026-09-15T20:32:00-04:00 [TOOL] RESOURCE_EXHAUSTED (429) hit after ~45 parallel subagent dispatches. Resets in ~4h.
- 2026-09-15T20:36:00-04:00 [TOOL] Test harness needed roundRect, clearRect, getImageData mocks for Canvas2D and full AudioParam/AudioNode mocks for WebAudio.

## [OUTCOMES]
- 19/50 engines completed and verified (commit 15b0cd2).
- 31 remaining engines need generation when quota resets.
- Engines that need building: colosseum, trireme, chariot, oraculum, euclid, archimedes_spiral, eratosthenes, pythagoras, mare_nostrum, pharos, coral_reef, nautilus, forum_builder, arch_vault, opus_caementicium, thermae, pantheon, vitrum, metallum, pigmentum, hermetica, electrum, testudo, siege_tower, hoplite_phalanx, scorpio, signal_fire, horologium, antikythera, aurora, cometa.
