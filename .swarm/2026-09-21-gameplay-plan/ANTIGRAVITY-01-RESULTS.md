# Vesuvius fixed-step timing: implementation and evidence

2026-09-23T05:32:40Z; merge-readiness update 2026-09-23T05:56:56Z. **Implementation complete.** The Codex help drawer pause defect found during browser validation was reproduced, fixed in the hub update gate, and verified in Chrome. No deployment or change to another engine's implementation was made.

## Identity and files

- Preserved implementation checkout: `/Users/jeremylichtman/Documents/antigravity/Pliny Game Dev`, branch `codex/vesuvius-fixed-step`.
- Base: `095a972e18e1cafc50b1319597658a371e552bd5`. Implementation commit: `3cd5261`. Current `main` at integration: `ce54d4b`; merge commit: `2b61fea`. The latter brings in the ten puzzle games already on `main`. The PR diff against `main` contains the Vesuvius change and its focused hub/doc/test work.
- Validation was performed in `/private/tmp/pliny-vesuvius-fixed-step`, a local shared clone of that branch with Antigravity's two uncommitted files copied in before further edits. The checkout above receives the finished files and evidence; generated `.audit/` screenshots and the temporary baseline module are excluded.
- Product code: `src/demos/vesuvius/vesuvius.js` and the one-line update gate in `src/core/hub.js`. Tests: `tests/vesuvius-timing.js`, `tests/vesuvius-gameplay.js`, `tests/vesuvius-browser-smoke.js`, `tests/vesuvius-timing-browser.js`. Guides: mirrored Vesuvius entries under `.agents/skills/` and `.cursor/skills/`. Handoff and evidence: this report and `evidence/` beside it. `.agent/CONTINUITY.md` records the result.
- `src/demos/vesuvius/mission.js`, mission constants, CSS, and other engine implementations were untouched by this work.

## Behavior

The engine accumulates admitted active time and executes fixed `1/60` second steps. Every step advances heat, cellular materials, magma, hazards, fleet, eruption schedule, and the mission clock in the existing order. One outer update admits at most `0.1` seconds, runs at most six steps, retains a fractional remainder, and drops excess whole-step debt. Invalid or nonpositive deltas do nothing. Engine pause retains only existing fractional time; reset and mode switches clear timing state. The hub still owns rendering and its own pause/view scheduling. Its update gate now also checks whether the Codex drawer is open; `lastTime` continues to refresh, so closing the drawer does not admit hidden time, and an explicit Pause remains in force.

The cellular scan now alternates by integer completed-step parity. The old `Math.floor(time * 60)` had floating-point boundary artifacts: in a 1,500-step arithmetic check, 582 steps floored below the integer count. This is an intentional difference for scan direction; deterministic straight sand travel, mission timing, fleet travel, and phase thresholds at 60 Hz match the baseline cases below. Exact legacy stochastic world identity is not claimed.

Simulation-affecting random calls now use the engine's local PRNG through bomb, fragment, pyroclastic-current, plume, and lightning construction/update paths. Render-time colors, sound noise, and the seismograph may still use `Math.random`; they cannot consume the simulation stream. Default play seeds the local PRNG nondeterministically. Controlled replays set a seed after constructing or resetting the engine. The active-fire hazard regression failed before this completion and passed after it. Mission HUD synchronization runs once per outer update with completed steps, while selection and reset still update it immediately.

## Baseline versus treatment

The public-update sand probe used a cleared **5 × 180** test grid, sand at `(2, 10)`, and the actual engine update path. It generated the baseline module from the exact base revision. Results after one simulated second:

| Calls | Base sand row | Fixed-step sand row | Fixed-step count |
| --- | ---: | ---: | ---: |
| 30 at `1/30` s | 40 | 70 | 60 |
| 60 at `1/60` s | 70 | 70 | 60 |
| 120 at `1/120` s | 130 | 70 | 60 |

The production world remains 280 × 180. Only the isolated test fixture substitutes five-column arrays; the separate seeded replay uses the real 280 × 180 engine. At 60 Hz after 270 updates with a commanded flagship, baseline and treatment both reported time and mission time `4.499999999999989`, phase `1`, ship x `250.40000000000123`, y `149`, cargo `0`, health `100`, `sailing`, rescued `0`, and 160 civilians. The timing suite pins those 60 Hz fleet and phase values, as well as the sand result. See `evidence/baseline-probe.log`.

To regenerate the baseline probe in this checkout, create the temporary baseline module from `095a972e18e1cafc50b1319597658a371e552bd5` and run `evidence/baseline-probe.mjs`. The module is intentionally not part of the change:

```sh
git show 095a972e18e1cafc50b1319597658a371e552bd5:src/demos/vesuvius/vesuvius.js > src/demos/vesuvius/vesuvius-baseline.mjs
node .swarm/2026-09-21-gameplay-plan/evidence/baseline-probe.mjs
```

## Acceptance checks

| Requirement | Result | Evidence |
| --- | --- | --- |
| Public-update 5 × 180 sand baseline and 30/60/120 treatment | **PASS** | `baseline-probe.log`; timing tests reach row 70 and 60 steps at every rate. |
| Irregular `[1/120, 1/40, 1/30]` cadence, half-step and boundary carry | **PASS** | `tests/vesuvius-timing.js`; irregular one-second run matches 60 Hz. |
| Ten-second seeded real-engine replay with simulation-tick ship commands | **PASS** | 30/60/120/irregular runs compare exact grid and heat byte hashes, phase/time, all mission resources and totals, fleet position/cargo/health/state, bombs and PDCs. Cargo is positive. |
| 25-second phase boundary and loading/offloading | **PASS** | All four cadences reach 1,500 steps and phase 4, observe loading and offloading, reach ship capacity 18, rescue citizens, and match full state. |
| Render independence with active fire and stochastic hazards | **PASS** | Tests compare 0/1/2 renders between updates, PDC lifetimes and evolved world, plus bomb mass, fragment velocities/lifetimes, and plume physics. The PDC and bomb/plume tests failed before the RNG fix. |
| `0.1`/`5` second catch-up bound and next-update debt | **PASS** | At most six steps on a stalled update; next `1/60` call runs one. Simulation and mission advance together. |
| Invalid `dt` | **PASS** | Zero, negative, NaN and infinity leave state unchanged; the next valid step works. |
| Engine pause and resume | **PASS** | Paused calls accumulate no time; a pre-pause half-step survives and no paused-time burst appears. |
| Reset, mode switch and new instance | **PASS** | Timing suite and browser retry/engine replacement checks start with zero debt. |
| Resize with cargo and fractional time | **PASS** | Node and Chrome retain cargo, grid, mission clock, steps and half-step remainder at CSS 390 × 844 DPR 1, 844 × 390 DPR 3, and desktop 1280 × 800 DPR 1. |
| Terminal win and loss persistence | **PASS** | Node and browser force each result, then continue updates; status, time, rescue totals and resources remain settled. Forced outcomes are fixtures, separate from the commanded pickup/offload run. |
| HUD batching and immediate input/reset feedback | **PASS** | Six steps invoke one HUD sync; a zero-step call invokes none; selection and reset invoke immediate sync. |
| 60 Hz compatibility | **PASS, bounded** | Exact sand travel and deterministic 270-step fleet/mission/phase values match base. Integer scan parity intentionally changes some multi-cell traversal orders. |
| Hub pause, showcase, hidden-tab resume | **PASS** | Real Chrome paused and Showcase states held step count. A genuinely backgrounded tab reported `document.hidden=true`, held steps, then its first foreground update admitted `0.1` s and ran six steps. |
| Codex help drawer as a pause | **PASS after shared hub fix** | Before: real Chrome advanced 861→876 steps over 250 ms with help open. After: 861→861; closing resumed steps, and opening/closing help while explicitly paused retained the pause. `tests/vesuvius-timing-browser.js`. |
| Browser and performance evidence | **PASS for this machine/browser** | Real Chrome smoke and 50-engine sweep passed; update/render samples below. Physical phone performance was not measured. |

## Verification and browser evidence

Node `v24.4.0`. Headless `Chrome/153.0.8010.36`. The static server served the modified engine from the validation checkout on port 8000; the served response was checked for the new constructor RNG parameters before browser tests. All commands below exited 0 after the fixes:

| Command | Inspected result |
| --- | --- |
| `node --check` on every changed JavaScript file | No syntax errors. |
| `node tests/vesuvius-timing.js` | 32 focused checks passed. |
| `node tests/vesuvius-gameplay.js` | 44 gameplay checks passed, including the exact full-step win/loss and sub-step assertion. |
| `node tests/verify-engines.js` | Original 50-game branch: `50 PASSED | 0 PENDING | 0 FAILED`; after integrating current `main`: `60 PASSED | 0 PENDING | 0 FAILED`. |
| `node tests/visual-qa.js` | Original 50-game branch: `50 CLEAN`; after integrating current `main`: `60 CLEAN | 0 WARNINGS | 0 ERRORS`; mocked Canvas. |
| `node tests/vesuvius-browser-smoke.js` | Passed on a loaded Vesuvius engine, including order, reset, overlay, and eruption budget. |
| `node tests/vesuvius-timing-browser.js` | Passed real canvas selection/order clicks, pickup/offload, rotation/DPR, pause/help/view/tab, retry, terminal results and sandbox. Zero console/page warnings or errors. |
| `node tests/browser-qa.js` | Original 50-game branch: `50 CLEAN`; integrated branch: `60 CLEAN | 0 WITH ISSUES`; all 60 JSON entries have zero warnings, errors, and issues. |
| `git diff --check` | Clean. |

The browser timing log records cargo `0.125` after the first pickup and rescued `0.23333333333333334` after offload began. During all three viewport changes, the state held at 273 steps, `4.549999999999989` mission seconds, `0.008333333333333333` seconds of remainder, cargo `0.125`, and the same grid hash. The controls panel must finish its collapse transition before a real pointer click can reach the Stabiae canvas target. The browser smoke suite generates screenshots under `.audit/vesuvius-gameplay/`, and the full browser sweep under `.audit/screenshots/`; these generated images were not included in the implementation diff. Raw command logs are in `evidence/`.

After copying the finished files to the preserved checkout, its engine file hash matched the bytes served on port 8000 (`d51447663f99d2538728b78fc781ff9fc8b53d4bdc557915586bb608f1d9f6a6`). Syntax, `git diff --check`, 32 timing checks and 44 gameplay checks passed again there. `tests/vesuvius-timing-browser.js` also passed against that checkout; see `evidence/timing-browser-source.log`. The full 50-engine sweeps were run on the byte-identical validation clone, then the 60-engine headless sweeps and targeted real-Chrome checks were run again after merging current `main`.

There is no project build, configured linter, formatter or typechecker. Syntax checks, `git diff --check`, headless tests and real-browser suites were run instead.

## Performance observation

Apple M3 MacBook Air (Mac15,12), 8 cores, 16 GB, arm64; headless Chrome 153.0.8010.36. This engine comparison was measured before merging the ten puzzle games from current `main`. The same 800 × 600 default dormant gameplay scene was constructed for base and treatment; initial grid hashes matched. Each of three samples created a fresh engine, warmed 30 single-step updates, measured 120 `update(1/60)` calls, warmed five renders, measured 30 renders, and separately measured 30 `update(0.1)` calls after five warmups. Figures are median **milliseconds per call** from `performance.now()` in the browser; sample arrays are in `evidence/perf.log` and the method in `evidence/perf-browser.mjs`.

| Operation | Base median | Treatment median |
| --- | ---: | ---: |
| `update(1/60)` | 0.244 | 0.313 |
| `render()` | 0.430 | 0.353 |
| `update(0.1)` | 0.247 | 1.883 |

The `0.1` second calls perform different amounts of work: the base made one simulation pass while treatment makes six synchronized passes. This is a correctness cost, not a like-for-like speed regression. No speed improvement is claimed from the render sample or from fewer 120 Hz simulation passes. These samples do not establish a phone frame budget.

## Integrated-main verification and remaining scope

After merge commit `2b61fea`, syntax and diff checks, 32 timing checks, 44 gameplay checks, the 60-engine headless and mocked-render sweeps, the Vesuvius browser timing/smoke suites, and Codex drawer QA passed. The targeted browser regression failed before the hub fix at 861→876 steps and passed after it at 861→861. Browser cargo pickup/offload, viewport/DPR, hidden-tab, terminal state, and sandbox assertions also passed against the merged branch. The full 60-game Chrome sweep reported `60 CLEAN | 0 WITH ISSUES`; `evidence/browser-qa-60.json` records zero warnings, errors, and issues for every entry. The current-main puzzle browser, puzzle keyboard, showcase, and mobile-layout browser suites also passed. The earlier raw logs in `evidence/` document the original 50-game validation. PR status is tracked on GitHub after publication.

This finishes only the Vesuvius timing chunk. The parent gameplay plan's other engines, mobile control redesign, phone performance, and human fun assessment remain separate work.
