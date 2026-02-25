# Codex Task 0083 - REF_MOVES: Invariants tests (enablement/order/duplicates tripwires)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0083
- **Area:** `packages/game` tests (moves assembly invariants)
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Low-medium (tests only; must be stable)

## 1) Context (frozen)

The hidden boss fight in moves refactoring is nondeterministic ordering + silent overwrites.
Once Task 0082 exists, the most valuable step is to add tripwire tests before touching helper dedupe or file splitting.

## 2) Goal (frozen)

Add deterministic invariants tests that fail loudly if future refactors reintroduce:

- state/zone-based enablement (instead of match config)
- nondeterministic module ordering
- silent overwrites / duplicates being accepted

## 3) Non-goals (frozen)

- No changes to move logic
- No changes to resolver logic

## 4) Inputs (frozen)

- Task 0081 outputs (canonical module list)
- Task 0082 outputs (MoveModuleRegistry)
- Existing test harness in `packages/game/test/*`

## 5) Outputs (frozen)

Add tests validating at minimum:

1) Disabled expansion registers nothing (flag=false contributes no moves)
2) Ordering invariant: module order equals canonical order list filtered by enablement
3) Duplicate move key fails deterministically (assert stable error message)

## 6) Constraints (frozen)

- Tests must be deterministic and non-flaky (no reliance on env or iteration side effects)
- Prefer small, direct tests over broad snapshots

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012)
- AGENTS: 5.1-5.3 (tests + determinism expectations)

## 8) Acceptance Criteria (frozen)

- Tests fail on regression for enablement/order/duplicates
- Entire test suite passes

## 9) PR Checklist (frozen)

- [x] Tripwire tests added (disabled contributes nothing, canonical order, deterministic duplicate error)
- [x] Tests are stable (no flakiness)
- [x] Tests pass
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Added move assembly tripwire tests for enablement, ordering, and duplicates.
- Verified expansion move modules are gated only by match config flags (no state/zone heuristics).
- Verified module ordering equals `CANONICAL_ENGINE_MODULE_ORDER` filtered by enablement.
- Added deterministic duplicate-move error assertion (stable message + conflict order).

### Commands Run

- `pnpm lint` -> pass (exit 0)
- `$env:NO_COLOR='1'; pnpm test` -> pass (exit 0)
- `git status` -> see Postflight Proof
- `git diff --stat` -> see Postflight Proof

### Postflight Proof

#### `git status`

```text
On branch task/0083-ref-moves-invariants-tests
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0083-REF_MOVES-invariants-tests.md
	new file:   packages/game/test/move-assembly-invariants.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

#### `git diff --stat`

```text
 docs/tasks/0083-REF_MOVES-invariants-tests.md      | 18 ++++--
 .../game/test/move-assembly-invariants.test.ts     | 73 ++++++++++++++++++++++
 2 files changed, 85 insertions(+), 6 deletions(-)
```

#### Tests (`$env:NO_COLOR='1'; pnpm test`)

```text
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 88ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/setup.test.ts  (8 tests) 12ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 11ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: exp03
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 12ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 18ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 19ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 28ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 44ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 54ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 22ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 60ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 68ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  ✓ test/turn.test.ts  (9 tests) 229ms
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 347ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 414ms
packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 19ms
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
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 23ms
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 8ms
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 15ms
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 21ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 19ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 8ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 12ms
packages/game test:  ✓ test/move-assembly-invariants.test.ts  (3 tests) 5ms
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > disabled expansion contributes no move modules
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > module ordering equals canonical order filtered by enablement (independent of registration order)
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > duplicate move keys fail deterministically
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 4ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  ✓ test/move-module-registry.test.ts  (1 test) 3ms
packages/game test:  Test Files  28 passed (28)
packages/game test:       Tests  106 passed (106)
packages/game test:    Start at  04:31:20
packages/game test:    Duration  4.96s (transform 5.18s, setup 6ms, collect 35.05s, tests 1.57s, environment 9ms, prepare 6.84s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 18ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 8ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 111ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 8ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 38ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 60ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 65ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 78ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 90ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 148ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 114ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 134ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 129ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 224ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 244ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 7ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  04:31:26
packages/client-web test:    Duration  4.95s (transform 1.32s, setup 2ms, collect 13.76s, tests 1.48s, environment 35.79s, prepare 4.01s)
packages/client-web test: Done
```
