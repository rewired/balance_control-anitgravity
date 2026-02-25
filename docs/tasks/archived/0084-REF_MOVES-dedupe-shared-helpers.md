# Codex Task 0084 - REF_MOVES: Dedupe shared helpers (moves + resolver)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0084
- **Area:** Shared helper utilities (within `packages/game`)
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium (risk of circular deps; must be mechanical)

## 1) Context (frozen)

`packages/game/src/moves.ts` duplicates low-level helpers also present in the resolver, notably:

- player meta marker lookup
- object zone lookup

We want to centralize shared helpers so both moves and resolver can import the same deterministic implementation.

## 2) Goal (frozen)

Create a shared helper module and replace duplicated implementations in both moves and resolver where applicable, without semantic changes.

## 3) Non-goals (frozen)

- No changes to any move legality/cost/effect logic
- No changes to resolver behavior
- No changes to state shape

## 4) Inputs (frozen)

- `packages/game/src/moves.ts` (duplicated helpers)
- `packages/game/src/engine/resolver.ts` (duplicated helpers)

## 5) Outputs (frozen)

- Shared helper module(s) located to avoid circular imports
- Moves imports shared helpers instead of local copies
- Resolver imports the same helpers where applicable

## 6) Constraints (frozen)

- Avoid circular dependencies (moves must not import resolver, resolver must not import moves)
- Helpers must be deterministic and side-effect free
- Keep changes mechanical (minimal rename churn)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003)
- AGENTS: 0.2 (determinism), 0.4 (keep repo clean)

## 8) Acceptance Criteria (frozen)

- Duplicated helper implementations are removed for the targeted helpers
- No circular dependency introduced
- All tests pass and behavior is unchanged

## 9) PR Checklist (frozen)

- [x] Shared helper module added (no cycles)
- [x] Moves uses shared helper (no duplicates)
- [x] Resolver uses shared helper where applicable
- [x] No semantic changes
- [x] Tests pass
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Added shared state lookup helpers for MetaMarker and zone location.
- Replaced duplicated `getPlayerMetaMarker` / `findObjectZoneId` implementations in moves and resolver costs.
- Refactored `mechanics-turn` to use the same shared zone lookup helper.
- Verified no circular dependencies introduced (helper has no imports).

### Commands Run

- `pnpm lint` -> pass (exit 0)
- `$env:NO_COLOR='1'; pnpm test` -> pass (exit 0)
- `git status` -> see Postflight Proof
- `git diff --stat` -> see Postflight Proof
- `git show -1 --stat` -> see Commit Proof

### Postflight Proof

#### `git status`

```text
On branch task/0084-ref-moves-dedupe-shared-helpers
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0084-REF_MOVES-dedupe-shared-helpers.md
	modified:   packages/game/src/engine/resolver/costs.ts
	modified:   packages/game/src/mechanics-turn.ts
	modified:   packages/game/src/moves.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/state-lookup.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

#### `git diff --stat`

```text
 docs/tasks/0084-REF_MOVES-dedupe-shared-helpers.md | 40 ++++++++++++++++++----
 packages/game/src/engine/resolver/costs.ts         | 19 +---------
 packages/game/src/mechanics-turn.ts                |  9 +----
 packages/game/src/moves.ts                         | 20 +----------
 4 files changed, 36 insertions(+), 52 deletions(-)
```

#### Tests (`$env:NO_COLOR='1'; pnpm test`)

```text

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 97ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 11ms
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-02 measure object ids to the EXP-02 measure zones
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-03 measure object ids to the EXP-03 measure zones
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > does not register disabled expansions as measure deck providers
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > fails deterministically when multiple enabled decks match the same object id
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 15ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 13ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 26ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 34ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/moves.test.ts  (22 tests) 41ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 24ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 49ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 74ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  ✓ test/turn.test.ts  (9 tests) 207ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 382ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 57ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 444ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion reg…301 chars truncated…d return expansions in deterministic canonical order
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: Expansion registered: exp02
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 22ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: exp03
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 39ms
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 9ms
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 18ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 9ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 11ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 7ms
packages/game test:  ✓ test/move-assembly-invariants.test.ts  (3 tests) 8ms
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > disabled expansion contributes no move modules
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > module ordering equals canonical order filtered by enablement (independent of registration order)
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > duplicate move keys fail deterministically
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 3ms
packages/game test:  ✓ test/move-module-registry.test.ts  (1 test) 3ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 5ms
packages/game test:  Test Files  28 passed (28)
packages/game test:       Tests  106 passed (106)
packages/game test:    Start at  04:39:26
packages/game test:    Duration  5.31s (transform 4.01s, setup 2ms, collect 35.67s, tests 1.67s, environment 12ms, prepare 7.26s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 9ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 19ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 144ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 6ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 45ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 69ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 74ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 82ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 92ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 133ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 146ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 143ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 110ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 146ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 234ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 233ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 10ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  04:39:32
packages/client-web test:    Duration  5.27s (transform 1.23s, setup 3ms, collect 13.54s, tests 1.55s, environment 37.25s, prepare 5.01s)
packages/client-web test: Done
```

### Commit Proof

#### `git show -1 --stat`

```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 04:42:26 2026 +0100

    task(0084): dedupe shared state lookup helpers

- Add shared helpers for MetaMarker + zone lookup

- Reuse helper from moves, resolver costs, and mechanics-turn

- Keep change mechanical and deterministic

 docs/tasks/0084-REF_MOVES-dedupe-shared-helpers.md | 184 ++++++++++++++++++++-
 packages/game/src/engine/resolver/costs.ts         |  19 +--
 packages/game/src/mechanics-turn.ts                |   9 +-
 packages/game/src/moves.ts                         |  20 +--
 packages/game/src/state-lookup.ts                  |  21 +++
 5 files changed, 200 insertions(+), 53 deletions(-)
```
