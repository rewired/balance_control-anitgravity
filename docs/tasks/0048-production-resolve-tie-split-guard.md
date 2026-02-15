# Codex Task 0048 - Production Resolve: Restore Tie-Split Guard

**Date:** 2026-02-15
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Production distribution: CORE-01-06-16
- Ping-Pong penalty applies to Move: CORE-01-04-12B
- Determinism: AGENTS 0.2

---

## Goal

Fix `handleProductionResolve` so tie-split logic only runs when there is no controller, preventing a stray unconditional split block after removing the non-spec Ping-Pong production-halving.

---

## Inputs

- `packages/game/src/engine/resolver.ts` had an unconditional winner-split block (and mismatched braces) in `handleProductionResolve`, which could cause compile/runtime errors (divide-by-zero when winners is empty).
- Ping-Pong penalty (CORE-01-04-12B) is a Move penalty, not a production modifier.

---

## Outputs

### A) Guard winner split (engine)

Update `packages/game/src/engine/resolver.ts`:

- If `majority.controller` exists: grant the controller (respecting `productionCap:*` attribute if set).
- Else if `majority.winners.length > 0 && baseAmount > 0`: split production evenly and send remainder to Noise.

### B) Bookkeeping (repo)

- Add this file: `docs/tasks/0048-production-resolve-tie-split-guard.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0048)
- Update `CHANGELOG.md` (Unreleased): Ping-Pong penalty applies to Move only (removed incorrect production halving)

### C) Tests + Golden Replay

- Update `packages/game/test/resolver.test.ts` to assert no PingPong production reduction (CORE-01-04-12B is Move-only).
- Add a Move-level PingPong penalty test in `packages/game/test/moves.test.ts` (resources to Noise).
- Update `packages/game/test/golden/core_pingpong_meta_marker.json` to explicitly pay PingPong penalty resources and refresh expected hash.

---

## Constraints

- No rule drift: implement production semantics per CORE-01-06-16 only.
- Deterministic winner ordering for split (stable sort).

---

## Invariants

- Controller takes precedence over tie-splitting.
- No grants occur when `baseAmount === 0` or when `majority.winners` is empty.

---

## Acceptance Criteria

1. TypeScript compiles and tests run without errors.
2. `pnpm -w test` is green.

---

## PR Checklist

- [x] Fix production winner split guard (`handleProductionResolve`)
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] Update `docs/PR_TASK_LIST.md`
- [x] Update tests + golden replay for PingPong semantics
- [x] `pnpm lint`
- [x] CI green (N/A - not run locally)

---

## Work Summary

- Restored `handleProductionResolve` controller/tie-split guard to prevent unconditional splitting and divide-by-zero.
- Updated production tests to reflect CORE-01-04-12B as a Move-only penalty (no production reduction).
- Added a Move-level PingPong penalty test validating required `extraResourceIds` and Resource→Noise transfers.
- Updated the PingPong golden replay to include explicit penalty payments and refreshed expected final hash.
- Updated PR task list and changelog entry.

---

## Commands Run

- `git -c core.pager=cat status -sb`
  ```text
  ## task/0048-production-resolve-tie-split-guard
   M CHANGELOG.md
   M docs/PR_TASK_LIST.md
   M packages/game/src/engine/resolver.ts
   M packages/game/test/golden/core_pingpong_meta_marker.json
   M packages/game/test/moves.test.ts
   M packages/game/test/resolver.test.ts
  ?? docs/tasks/0048-production-resolve-tie-split-guard.md
  ```
- `git -c core.pager=cat diff --stat`
  ```text
   CHANGELOG.md                                       |  1 +
   docs/PR_TASK_LIST.md                               |  1 +
   packages/game/src/engine/resolver.ts               |  6 +---
   .../test/golden/core_pingpong_meta_marker.json     | 34 +++++++++++++++++++---
   packages/game/test/moves.test.ts                   | 29 ++++++++++++++++++
   packages/game/test/resolver.test.ts                | 14 +++++----
   6 files changed, 70 insertions(+), 15 deletions(-)
  ```
- `$env:NO_COLOR=1; pnpm -w test`
  ```text
  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test
  
  Scope: 9 of 10 workspace projects
  packages/game test$ vitest run
  packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
  packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 63ms
  packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test:  ✓ test/setup.test.ts  (8 tests) 15ms
  packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
  packages/game test: Expansion registered: EXP-02 Security & Order
  packages/game test: EXP-02 Setup Complete.
  packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
  packages/game test: Expansion registered: EXP-02 Security & Order
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 14ms
  packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test: EXP-01 Setup Complete.
  packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 10ms
  packages/game test:  ✓ test/resolver.test.ts  (6 tests) 13ms
  packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
  packages/game test: [resolver:resource.pay] insufficient resources for cost
  packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
  packages/game test: Expansion registered: PingPongModExp
  packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 2058ms
  packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 12ms
  packages/game test:  ✓ test/legal-intents.test.ts  (4 tests) 19ms
  packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 24ms
  packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
  packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
  packages/game test:  ✓ test/moves.test.ts  (22 tests) 25ms
  packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 33ms
  packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 51ms
  packages/game test:  ✓ test/turn.test.ts  (9 tests) 102ms
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
  packages/game test: ERROR: disallowed move: placeTile
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
  packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
  packages/game test: ERROR: disallowed move: pass
  packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 160ms
  packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
  packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
  packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test: EXP-01 Setup Complete.
  packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 196ms
  packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 9ms
  packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 10ms
  packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 7ms
  packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
  packages/game test: Expansion registered: EXP-02 Security & Order
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 9ms
  packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
  packages/game test: Expansion registered: EXP-03 Climate & Future
  packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
  packages/game test: Expansion registered: EXP-03 Climate & Future
  packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
  packages/game test: Expansion registered: TestExp
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
  packages/game test: Expansion registered: ModExp
  packages/game test:  ✓ test/player-view.test.ts  (2 tests) 5ms
  packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
  packages/game test:  Test Files  22 passed (22)
  packages/game test:       Tests  86 passed (86)
  packages/game test:    Start at  12:50:34
  packages/game test:    Duration  4.69s (transform 4.21s, setup 2ms, collect 28.89s, tests 2.84s, environment 7ms, prepare 5.92s)
  packages/game test: Done
  packages/client-web test$ vitest run
  packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 4ms
  packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 6ms
  packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 34ms
  packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 49ms
  packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 63ms
  packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 83ms
  packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 91ms
  packages/client-web test:  Test Files  7 passed (7)
  packages/client-web test:       Tests  21 passed (21)
  packages/client-web test:    Start at  12:50:39
  packages/client-web test:    Duration  2.79s (transform 534ms, setup 0ms, collect 2.66s, tests 330ms, environment 9.56s, prepare 1.22s)
  packages/client-web test: Done
  ```
- `pnpm lint`
  ```text
  > balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
  > eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
  ```
