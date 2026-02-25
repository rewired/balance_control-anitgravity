# Codex Task 0049 - Client-Web: Fix Active State + Legal Intents Fallback

**Date:** 2026-02-15
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Turn stages: CORE-01-04 (via ctx.currentPlayer / ctx.activePlayers)
- Prohibitions: engine attributes prohibitions (`EffectResolver.isProhibited`)
- Client is presentation only: ARCH-01, AGENTS 1.5
- Determinism: AGENTS 0.2

---

## Goal

Fix the UI "cold" state in client setups where `state.isActive` and/or `ctx.activePlayers` are not reliably present:

- client-web computes `isActive` from `ctx` and `gameover`
- legal intent enumeration stays usable even when `ctx.activePlayers[playerID]` is missing
- engine prohibition checks are applied correctly (fix `isProhibited` arg order)

---

## Inputs

- `packages/client-web/src/App.tsx` currently reads `isActive` from `state.isActive`, which can be missing with `boardgame.io/client`.
- `packages/game/src/engine/legal-intents.ts` returns no intents when `ctx.activePlayers[playerID]` is missing.
- `EffectResolver.isProhibited(G, actionType, playerId, tileId?)` was called with the wrong argument order in `legal-intents.ts`.

---

## Outputs

### A) Client `isActive` derived from `ctx`

Update `packages/client-web/src/App.tsx`:

- Derive `isActive` from:
  - connected status
  - not gameover
  - `ctx.currentPlayer === playerID`
  - `ctx.activePlayers[playerID]` when present (treat missing `activePlayers` as best-effort active)
- Fix `moves` memo dependencies to include `client`.

### B) Legal intents stage fallback + prohibition check

Update `packages/game/src/engine/legal-intents.ts`:

- If `ctx.activePlayers[playerID]` is missing:
  - infer stage as `drawAndPlace` when staging contains a tile
  - otherwise fall back to `politicalAction`
- Ensure `pendingChoice` intents still emit even if `activePlayers` is missing.
- Call `EffectResolver.isProhibited` with correct argument order everywhere.

### C) Tests

Update `packages/game/test/legal-intents.test.ts`:

- Regression: emits draw-and-place `placeTile` intents without `ctx.activePlayers` when staging has a tile.
- Regression: respects global prohibitions for `placeTile` (no intents emitted).

### D) Bookkeeping (repo)

- Add this file: `docs/tasks/0049-client-web-isactive-and-legal-intents-fallback.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0049)
- Update `CHANGELOG.md` (Unreleased): client active-state + legal-intents fallback fix

---

## Constraints

- No new rules: legality comes from engine/moves; UI only consumes enumerated legal intents.
- Deterministic: fallback stage inference must use only `G` + `ctx` (no system time, no randomness).

---

## Invariants

- ActionPanel renders when it is the player's turn and the game is not over.
- Ghost placement hexes appear during draw-and-place when a staging tile exists.

---

## Acceptance Criteria

1. ActionPanel appears (fixed-bottom) during an active turn even when `state.isActive` is absent.
2. Ghost hex placement targets render around StartCommittee and dispatch `placeTile`.
3. `pnpm -w test` is green.

---

## PR Checklist

- [x] Client: compute `isActive` from `ctx` + `gameover`
- [x] Client: `moves` memo updates with `client`
- [x] Engine: legal-intents stage fallback when `activePlayers` missing
- [x] Engine: `isProhibited` called with correct argument order
- [x] Tests: regressions for fallback + prohibitions
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] Update `docs/PR_TASK_LIST.md`
- [x] `pnpm -w lint`
- [x] `pnpm -w test`

---

## Work Summary

- Fixed client `isActive` derivation to rely on `ctx` (current player / active stage) and respect `gameover`.
- Rebuilt `moves` memo when the underlying `client` instance changes to avoid stale move dispatchers.
- Hardened legal-intent enumeration when `ctx.activePlayers` is missing and corrected `EffectResolver.isProhibited` argument order.
- Added regression tests covering best-effort stage inference and prohibition gating.
- Updated changelog + PR task list entry for Task 0049.

---

## Commands Run

- `git -c core.pager=cat status -sb`
  ```text
  ## task/0049-client-web-isactive-legal-intents
   M CHANGELOG.md
   M docs/PR_TASK_LIST.md
   M packages/client-web/src/App.tsx
   M packages/game/src/engine/legal-intents.ts
   M packages/game/test/legal-intents.test.ts
  ?? docs/tasks/0049-client-web-isactive-and-legal-intents-fallback.md
  ```
- `git -c core.pager=cat diff --stat`
  ```text
   CHANGELOG.md                              |  1 +
   docs/PR_TASK_LIST.md                      |  1 +
   packages/client-web/src/App.tsx           |  8 ++++++--
   packages/game/src/engine/legal-intents.ts | 22 ++++++++++++++--------
   packages/game/test/legal-intents.test.ts  | 28 ++++++++++++++++++++++++++++
   5 files changed, 50 insertions(+), 10 deletions(-)
  ```
- `$env:NO_COLOR=1; pnpm -w lint`
  ```text
  > balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
  > eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
  ```
- `$env:NO_COLOR=1; pnpm -w test`
  ```text
  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test
  
  Scope: 9 of 10 workspace projects
  packages/game test$ vitest run
  packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
  packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 52ms
  packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test:  ✓ test/setup.test.ts  (8 tests) 14ms
  packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
  packages/game test: Expansion registered: EXP-02 Security & Order
  packages/game test: EXP-02 Setup Complete.
  packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
  packages/game test: Expansion registered: EXP-02 Security & Order
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 21ms
  packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
  packages/game test: [resolver:resource.pay] insufficient resources for cost
  packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
  packages/game test: Expansion registered: PingPongModExp
  packages/game test:  ✓ test/resolver.test.ts  (6 tests) 18ms
  packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 12ms
  packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 24ms
  packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 17ms
  packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 26ms
  packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 33ms
  packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
  packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
  packages/game test:  ✓ test/moves.test.ts  (22 tests) 43ms
  packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 47ms
  packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 52ms
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
  packages/game test: ERROR: disallowed move: placeTile
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
  packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
  packages/game test: ERROR: disallowed move: pass
  packages/game test:  ✓ test/turn.test.ts  (9 tests) 136ms
  packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 231ms
  packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
  packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
  packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test: EXP-01 Setup Complete.
  packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 254ms
  packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 11ms
  packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
  packages/game test: Expansion registered: EXP-01 Economy & Labor
  packages/game test: EXP-01 Setup Complete.
  packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 12ms
  packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 18ms
  packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
  packages/game test: Expansion registered: EXP-03 Climate & Future
  packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
  packages/game test: Expansion registered: EXP-03 Climate & Future
  packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 6ms
  packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
  packages/game test: Expansion registered: EXP-02 Security & Order
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
  packages/game test: Expansion registered: TestExp
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
  packages/game test: Expansion registered: ModExp
  packages/game test:  ✓ test/player-view.test.ts  (2 tests) 7ms
  packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 6ms
  packages/game test:  Test Files  22 passed (22)
  packages/game test:       Tests  88 passed (88)
  packages/game test:    Start at  13:17:04
  packages/game test:    Duration  5.60s (transform 5.26s, setup 3ms, collect 29.87s, tests 1.04s, environment 6ms, prepare 6.15s)
  packages/game test: Done
  packages/client-web test$ vitest run
  packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 6ms
  packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 8ms
  packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 35ms
  packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 64ms
  packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 77ms
  packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 87ms
  packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 115ms
  packages/client-web test:  Test Files  7 passed (7)
  packages/client-web test:       Tests  21 passed (21)
  packages/client-web test:    Start at  13:17:11
  packages/client-web test:    Duration  3.28s (transform 448ms, setup 2ms, collect 2.73s, tests 392ms, environment 11.63s, prepare 1.43s)
  packages/client-web test: Done
  ```
