# Antigravity implementation handoff 01: Vesuvius timing

Prepared 2026-09-23. Status: ready for implementation; this document does not claim the change is implemented or validated.

## Assignment

Implement one bounded part of work package 3 in the gameplay improvement plan: make Vesuvius advance at a consistent simulation speed across display refresh rates, while keeping its materials, hazards, ships and mission clock synchronized. Preserve existing 60 Hz gameplay tuning. Return a reviewable diff and reproducible evidence for Codex to validate independently.

This is a correctness foundation for subsequent gameplay and mobile work. It does not complete the broader plan, prove that the game is more fun, or certify phone performance. Do not combine this with new missions, onboarding, graphics, music, layout changes or work on the other 49 engines.

Project: `/Users/jeremylichtman/Documents/pliny-game-lab`.

Parent plan: `.swarm/2026-09-21-gameplay-plan/PLAN.md`, work package 3. Read that document for context, but implement only this handoff.

## Starting state: avoid implementing on the stale checkout

The local checkout inspected while preparing this handoff is `pr-2` at `63024b0`, with existing modifications to `.agent/CONTINUITY.md` and untracked `.swarm/` artifacts. Preserve those files. Do not reset, clean, overwrite or broadly stage that checkout.

PR #7 has merged, and PR #8 changed the showcase and surrounding interface. The latest main revision verified during the preceding assessment was `095a972e18e1cafc50b1319597658a371e552bd5`. Treat this as a reference revision, not a permanent assertion about the current remote.

Before coding:

1. Read the current repository `AGENTS.md`, `.agent/CONTINUITY.md`, and `.agents/skills/verify-pliny-game-lab/SKILL.md`.
2. Record the current branch, commit, working-tree status, Node version and browser version. Refresh remote main using the environment's authorized Git workflow and record its exact SHA.
3. Work in an isolated checkout/branch based on current main, preferably `codex/vesuvius-fixed-step`. Preserve unrelated local work. If branch/worktree creation is unavailable, report that constraint rather than switching or resetting a dirty checkout.
4. Check whether this timing fix has already landed. Reproduce the public-update failure below before changing code. If main already passes, report the evidence and stop rather than creating a redundant implementation.

Historical review evidence is in `.swarm/pr7-review/`. The Vesuvius source at reviewed PR head `e5545603e36f8aa9b0b9cc17b29b380e2abf8a75` had the same file hash as main `095a972e`. Other engines changed after that review; do not turn old review findings into this task's backlog.

Do not merge, deploy, push or create a PR unless separately authorized by the user. Local code, tests and an implementation report are the deliverable. If the user authorizes a PR, include this handoff and the completed evidence report in its description or linked repository documents.

## Confirmed problem and source map

Vesuvius currently calls its cellular automaton once per `update(dt)`. Gravity transports a sand cell by one row per pass, so supplying a smaller `dt` more often still moves the sand faster. The existing isolated CA probe moved sand from row 10 to rows 40, 70 and 130 after one simulated second at 30, 60 and 120 calls respectively. That establishes material transport dependence; it does not establish a measured mission win-rate difference.

Inspect these symbols in current source; line numbers from the older snapshot are navigation hints only:

| File / symbol | Relevant behavior |
| --- | --- |
| `src/demos/vesuvius/vesuvius.js`: constructor, near 1561 | Initializes time, pause state and simulation arrays. |
| `update(dt)`, near 2434 | Advances time, shake, plume smoothing, heat, CA, magma, kinematics, seismograph, then gameplay. |
| `updateCellularAutomata(dt)`, near 2527 | Resets visited cells; traversal direction uses `Math.floor(this.time * 60)`. |
| `tickGameplay(dt)`, near 2019 | Advances mission time, eruption schedule, ships, hazards and outcome; also synchronizes HUD. |
| `updateKinematics(dt)` | Updates particles and hazards; updates the fleet only in sandbox. Avoid double-ticking gameplay ships. |
| `setPlayMode`, `reset`, `destroy` | Establish lifecycle boundaries for new timing state. |
| `src/demos/vesuvius/mission.js` | Existing mission constants, phase schedule, hazard reducer and result rules. Preserve their values. |
| `tests/vesuvius-gameplay.js` | Existing mission reducer and engine integration tests. |
| `tests/vesuvius-browser-smoke.js` | Existing browser launch, gameplay and fit checks. Selectors may need updating for PR #8. |
| `src/core/hub.js` | Calls engine updates with seconds, ordinarily capped at 0.1; owns shared pause/view scheduling. Read, do not refactor. |

The simulation grid is already independent of viewport size at 280 × 180. Do not introduce a new world-coordinate system or change its dimensions.

## Required timing contract

### One engine-local simulation clock

Use a fixed step of **1/60 second**. Add a per-instance accumulator and integer completed-step counter. Move the current simulation update body into a single fixed-step method, keeping the present order of operations. `update(dt)` should accumulate admitted elapsed time and execute zero or more fixed steps; rendering remains under the hub's control.

Run the coupled simulation on the same fixed step: heat diffusion, cellular transport, magma, kinematics/hazards, gameplay fleet, mission clock and eruption schedule. Moving only the CA into a loop while ships and mission deadlines use variable frame time would create two clocks. Keep sandbox fleet updates in their existing path and gameplay fleet updates in theirs.

Advance `this.time` only when a simulation step executes. Base CA scan-direction alternation on the integer step counter, with an explicitly tested first-step convention, instead of floating-point multiplication and flooring. Keep mission time under its existing PLAYING-state rule. Do not add elapsed time again outside the fixed-step method.

Preserve the old per-step behavior at 60 updates/second: the same physical rates, probabilities, order of hazards and mission reduction, loading/offloading rules and phase thresholds. Integer scan parity may correct historical floating-point boundary artifacts; document that intentional difference rather than disguising it as exact legacy equivalence.

### Bounded catch-up

- Admit at most **0.1 seconds per outer update** and execute at most **6 fixed steps** in that call.
- Retain the fractional remainder below one step. Do not discard normal fractional time every frame.
- Excess elapsed time from a stall is deliberately dropped. The simulation and mission clock both slow together; neither silently jumps forward by the dropped duration.
- After exhausting the step budget, discard any whole-step backlog while preserving only a valid fractional remainder. Never carry an unbounded debt into future frames.
- Ignore zero, negative and non-finite `dt` without changing simulation state or poisoning the accumulator.
- Use a small, documented floating-point tolerance at the step boundary, and normalize tiny negative residuals to zero. Do not round every input `dt` to milliseconds or round the accumulator after each call.

At 30 Hz, ordinarily run two steps per call; at 60 Hz, one; at 120 Hz, alternate zero and one. Equal admitted elapsed time and identical inputs must execute the same number of steps. A direct `update(5)` must execute at most six, not 300. This policy bounds simulation work per frame; it is not a promise that six steps fit a particular device's frame budget.

### Pause and lifecycle

| Event | Required behavior |
| --- | --- |
| Engine pause | No clock, material, ship, hazard or outcome changes. Paused calls add no accumulator time. Retain at most the pre-pause fractional remainder. |
| Hub pause, help, showcase or hidden tab | Inspect the actual hub behavior. Where updates are suspended, no elapsed wall time may be fed back as paused-time catch-up. Verify in browser. If shared scheduling violates this, report the exact reproduction as a dependency instead of silently expanding into a hub rewrite. |
| Resume | Continue from pre-pause state using newly admitted active time. No burst of missed simulation ticks. |
| Reset / deliberate retry | Clear accumulator, completed-step counter and simulation clock along with the existing mission reset. A half-step from the previous run must not enter the new run. |
| Gameplay ↔ sandbox | Follow existing reset semantics and clear timing state. |
| Resize / rotation / DPR change | Preserve timing state, mission, cargo and world contents. Resize is not reset. |
| Win / loss | Preserve existing mission terminal semantics: no further rescue totals, resources or result changes. Ambient simulation may continue as it does today. Do not redesign result screens. |
| Destroy / new instance | No timing state leaks between instances; do not introduce engine-owned animation loops or timers. |

Do not change pause UX or add a document-level visibility listener casually. Keep the existing ownership contract and identify any required shared follow-up honestly.

### Randomness and presentation

Seeded regression tests must isolate randomness and restore any test override in `finally`. Inspect render-time randomness: this source uses `Math.random()` for material colors as well as simulation. Different render counts can therefore consume the simulation's random sequence.

Require that extra renders cannot change the simulated result in a controlled replay. If necessary, make the small local separation needed: use an engine-local simulation random source or separate cosmetic noise from the simulation random stream. Keep defaults nondeterministic for normal play and avoid a project-wide RNG framework. Do not redesign material appearance. Include a test that interleaves differing render counts; merely testing updates with no renders misses this coupling.

Keep DOM writes out of the six-step hot loop where straightforward. `syncMissionHud()` currently sits inside `tickGameplay`; preserve immediate HUD updates for input/reset while batching simulation-driven synchronization to at most once per outer update. Do not couple mission rules to the presence of a DOM or audio context. Avoid unrelated render optimizations.

## Implementation sequence

1. **Capture a failing baseline.** Add a focused `tests/vesuvius-timing.js` suite. First prove the sand failure through public `engine.update(dt)`, not by calling only `updateCellularAutomata`. Use the real constructor with existing Node mocks where possible. If a minimal fixture stubs unrelated volcano emitters, list exactly what was stubbed and retain a separate real-engine integration replay.
2. **Add the scheduler and fixed step.** Keep it local to Vesuvius. Add constructor/reset lifecycle state, bound catch-up, and establish integer traversal parity. Do not refactor the whole 4,000-line engine.
3. **Audit every time consumer.** Confirm no subsystem advances twice, and no mission timer or fleet still advances using outer frame time. Inspect emission probabilities, ship loops, phase changes, screen shake and terminal mission behavior.
4. **Separate render randomness if needed and batch HUD synchronization.** Cover each with focused assertions; do not turn this into a graphics task.
5. **Run the evidence matrix below.** Fix regressions introduced by this chunk. Classify existing failures separately and provide baseline evidence before calling them pre-existing.
6. **Write the implementation report.** Document the chosen behavior, files, commands, results, limitations and exact revision/diff for Codex's independent validation. Update the Vesuvius verification guide only where its instructions or coverage changed.

## Required automated evidence

Use actual engine results, not tests that merely assert the new constants or count calls to an invented scheduler. A call-count spy is useful in addition to state assertions.

| Case | Setup and pass criterion |
| --- | --- |
| Sand baseline/treatment | Empty 5 × 180 fixture, sand at x=2/y=10, no terrain/hazard interference. Public updates totaling one second at 30/60/120 Hz must all put sand at y=70 and execute 60 steps after the fix. Baseline must show the rate-dependent failure. |
| Irregular cadence | Repeat `[1/120, 1/40, 1/30]` 15 times: total one second. Same step count and sand position as regular cadence. Also test explicit half-step and just-below/above-step boundaries. |
| Real-engine replay | Default 280 × 180 engine with a controlled seed and simulation-time input script. Compare 30/60/120 and irregular runs at equal completed ticks for at least 10 seconds. Report grid hash, heat comparison, phase, mission time, ship positions/cargo/health, resources and rescued count. Input at the same simulation ticks, not different frame numbers. |
| Longer mission boundaries | A scripted mission run crossing at least one real scheduled eruption boundary and a loading/offloading transition. Compare equal-tick states; use current mission constants, not historical quota numbers. |
| Render independence | Same seed and update/input sequence, with 0, 1 and 2 renders between outer updates in a supported mock or browser. Authoritative world/mission results agree. Cosmetic output need not be pixel-identical. |
| Catch-up bound | `update(0.1)` consumes six ticks; `update(5)` consumes at most six; the following `update(1/60)` consumes one, with no old whole-step backlog. Mission and simulation advance by the same admitted duration while playing. |
| Invalid inputs | `0`, negative, `NaN`, `Infinity`: no world/clock change and no poisoned state; a subsequent valid step still works. |
| Pause/resume | Pause with a half-step remainder; send large elapsed values while paused; resume. No paused changes, no debt, and only the retained half-step plus new active time can complete the next tick. |
| Reset/mode/new instance | Begin with a half-step remainder; reset, switch mode, or construct another engine. Each new run starts with zero debt and tick count. |
| Resize | With a nonzero remainder and populated mission, resize portrait ↔ landscape and change DPR. World hash, cargo, mission time and timing remainder remain unchanged immediately after resizing. |
| Terminal state | Exercise existing success and failure fixtures, then keep updating at multiple cadences. Mission status, result totals and depleted resources stay settled. |
| 60 Hz compatibility | Compare baseline and treatment at 60 Hz on deterministic material and mission scenarios. Preserve sand travel, mission timing, phase thresholds and fleet rates. Document any limited parity correction; do not change difficulty constants to make tests pass. |

Use exact equality for discrete state and tick counts. For identical fixed-step sequences in the same runtime, prefer exact floating-array equality too; if a tolerance is required, justify it per quantity. Mission elapsed-time arithmetic may use an absolute tolerance of `1e-9` seconds in short tests. Do not use broad tolerances that hide a lost step or a changed outcome.

## Commands and browser checks

Run from the implementation checkout, not the historical `.swarm/pr7-review/head` snapshot:

```sh
node --version
node --check src/demos/vesuvius/vesuvius.js
node --check tests/vesuvius-timing.js
node tests/vesuvius-timing.js
node tests/vesuvius-gameplay.js
node tests/verify-engines.js
node tests/visual-qa.js
```

Syntax-check every additional changed JavaScript file. Require **50 PASSED | 0 PENDING | 0 FAILED** from the engine runner. Inspect visual warnings as well as errors: mocked Canvas checks are not browser verification. There is no configured build, linter or typechecker; report those as not applicable rather than inventing successful checks.

For browser tests, use the current project's documented Node/Puppeteer setup (`npm ci` if needed; the locked Puppeteer requires Node >=22.12). Start the static server from the implementation checkout:

```sh
python3 -m http.server 8000
```

In a separate terminal:

```sh
node tests/vesuvius-browser-smoke.js
```

Port 8000 may already belong to another checkout. Identify the served project before testing; do not kill an unrelated server. Existing suites hardcode this port. If blocked, report that accurately. Do not accept a hub placeholder as a working game: confirm the loaded Vesuvius engine and advancing state.

Add or extend focused browser checks for:

- Launch gameplay, select a ship, order pickup, observe cargo increasing, return/offload and observe rescued count increasing. Reuse established deterministic fixtures where necessary; label forced outcomes separately from an end-to-end rescue.
- Pause/resume, open/close help, leave/return to the simulator and hide/show the tab. Capture state before/after and the hub scheduling behavior, not just screenshots. Distinguish browser automation that can actually hide a tab from mocked visibility events.
- Rotate 390 × 844 to 844 × 390 with cargo aboard; also verify 1280 × 800 desktop. Use DPR 1 and 3 for the targeted preservation check. Keep existing broader fit tests intact.
- Confirm results remain stable, retry clears timing debt, sandbox still runs and switching away/back does not inherit another instance's timing state.
- Capture browser errors and warnings. Update obsolete showcase selectors only as necessary to run the existing test against current main.

Record one repeatable before/after update-time sample on the same machine/browser, scene and cadence, separating update from render. Include the six-step catch-up case. Report the measurement method and sample count. Do not claim a speed improvement from fewer CA calls at 120 Hz, or regress 30 Hz correctness to make a benchmark look faster. Physical phone validation and the parent plan's full performance budgets remain separate work.

## Files and scope boundaries

Expected changes: `src/demos/vesuvius/vesuvius.js`, new `tests/vesuvius-timing.js`, focused extensions to existing Vesuvius tests, and relevant verification documentation. Change `mission.js` only if necessary to expose/preserve timing behavior; do not rebalance its constants. Test-only helpers should stay small and follow existing conventions.

Not in this chunk: global scheduler changes; Chariot timing; shared input redesign; responsive CSS; mission content; save systems; new dependencies; worker threads; rendering rewrites; sound; all-50 migration; deployment. If a required acceptance criterion needs a shared fix, return a precise blocker/dependency with evidence and proposed smallest follow-up. Do not silently weaken the criterion or expand this PR to every engine.

## Return package for Codex validation

Write `.swarm/2026-09-21-gameplay-plan/ANTIGRAVITY-01-RESULTS.md` in the implementation checkout. Include:

1. **Identity:** exact base SHA, final SHA if committed, branch/worktree path, changed files, and whether uncommitted changes remain. Supply the diff if the branch is not accessible to Codex.
2. **Behavior:** fixed-step/catch-up policy, pause/reset behavior, scan parity convention, RNG separation and any intentional 60 Hz difference.
3. **Baseline versus treatment:** sand result table; replay comparisons; commands; exit codes and inspected suite summaries. Preserve raw focused logs in an explicitly named evidence directory; avoid committing unrelated generated screenshots/logs.
4. **Acceptance checklist:** every row above marked PASS, FAIL or BLOCKED with a test name/artifact. Never mark missing device/browser evidence PASS based on source inspection.
5. **Browser evidence:** viewport/DPR, browser version, actual ship and timer assertions, screenshots where useful, console errors and known limitations.
6. **Performance observation:** same-scene update/render measurements with hardware and method; no unmeasured claims.
7. **Remaining work:** unresolved dependencies and untouched parent-plan work. State that this completes only the Vesuvius timing chunk if it passes.

Codex will inspect the actual diff, rerun focused and broad headless tests, independently replay cadence/pause/reset cases, and verify targeted gameplay in the browser. An implementation report alone is not acceptance. A clean smoke suite alone is not acceptance. Return the artifact and exact checkout/revision so independent validation can begin without reconstructing your session.
