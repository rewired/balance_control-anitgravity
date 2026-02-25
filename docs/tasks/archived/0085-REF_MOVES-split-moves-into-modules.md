# Codex Task 0085 - REF_MOVES: Split moves.ts into stage/domain modules (mechanical)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0085
- **Area:** `packages/game` moves organization
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium-high (mechanical move across files; reviewability concerns)

## 1) Context (frozen)

`packages/game/src/moves.ts` (~460 LOC) mixes helpers + multiple move implementations across stages.
After ordering/enablement invariants are locked (0081-0083) and shared helpers are deduped (0084), we can safely split files to improve readability.

## 2) Goal (frozen)

Mechanically split `moves.ts` into smaller modules grouped by stage/domain, while keeping:

- public move keys and signatures unchanged
- behavior unchanged
- rule anchor comments colocated with the logic they justify
- no formatting churn beyond required imports/exports

## 3) Non-goals (frozen)

- Do not redesign the game to eliminate direct mutations inside moves in this task
- Do not change legality rules, costs, effect queueing, or events flow

## 4) Inputs (frozen)

- `packages/game/src/moves.ts`
- Task 0081-0084 outputs (deterministic assembly + tripwire tests + shared helpers)
- Existing tests (including golden replay, if applicable to moves)

## 5) Outputs (frozen)

- Split move modules under a new folder (example only):
  - `packages/game/src/moves/index.ts` (thin entry/export)
  - `packages/game/src/moves/stages/drawAndPlace.ts`
  - `packages/game/src/moves/stages/politicalAction.ts`
  - `packages/game/src/moves/system/resolveChoice.ts`
- `packages/game/src/moves.ts` reduced to a thin re-export or replaced by the new index (choose minimal churn)

## 6) Constraints (frozen)

- Mechanical move: avoid reformatting unrelated code
- Preserve determinism and stage flow
- Keep diffs reviewable (no mass prettier churn)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-006 (Pending Choice Gate)
- GR-005 (No Phantom Moves)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-006)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (legal move surface)
- `docs/rules/000-core.md` (rule anchors referenced by move comments; must remain attached)

## 8) Acceptance Criteria (frozen)

- Entry file is thin; move logic is grouped by stage/domain
- Rule anchor comments moved with their functions (no anchor loss)
- No behavior changes (all tests pass; golden replay expectations unchanged if present)
- No silent overwrites possible (registry remains in effect)

## 9) PR Checklist (frozen)

- [x] Moves split is mechanical and reviewable (minimal formatting churn)
- [x] Entry/exports are thin and readable
- [x] Rule anchors preserved and colocated
- [x] Tests pass (including golden replay if present)
- [x] Registry invariants still enforced (no silent overwrites)
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Split `packages/game/src/moves.ts` into stage/system modules under `packages/game/src/moves/`.
- Kept `CoreMoves` keys/signatures unchanged by assembling a single move map in `packages/game/src/moves/index.ts`.
- Preserved all existing rule anchor comments by moving them with their move implementations.
- Reduced `packages/game/src/moves.ts` to a thin re-export for minimal churn in imports.

### Commands Run

- `pnpm lint` -> pass (exit 0)
- `$env:NO_COLOR='1'; pnpm test` -> pass (exit 0)
- `git status` -> see Postflight Proof
- `git diff --stat` -> see Postflight Proof

### Postflight Proof

#### `git status`

```text
On branch task/0085-ref-moves-split-moves-into-modules
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/changelog.md
	modified:   docs/tasks/0085-REF_MOVES-split-moves-into-modules.md
	modified:   packages/game/src/moves.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/moves/

no changes added to commit (use "git add" and/or "git commit -a")
```

#### `git diff --stat`

```text
 docs/changelog.md                                  |   1 +
 .../0085-REF_MOVES-split-moves-into-modules.md     |  10 +-
 packages/game/src/moves.ts                         | 537 +--------------------
 3 files changed, 7 insertions(+), 541 deletions(-)
```

#### Tests (`$env:NO_COLOR='1'; pnpm test`)

```text

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 99ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/setup.test.ts  (8 tests) 28ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/expansion.test.ts > Expansion System > should return expansions in deterministic canonical order
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: Expansion registered: exp02
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 8ms
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 12ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 13ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: exp03
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 25ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 22ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 41ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 45ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 31ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 56ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 98ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 252ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 396ms
packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 43ms
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
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 17…304 chars truncated…lver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 18ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 635ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 12ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 9ms
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 12ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 7ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 7ms
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
packages/game test:  ✓ test/move-module-registry.test.ts  (1 test) 4ms
packages/game test:  Test Files  28 passed (28)
packages/game test:       Tests  106 passed (106)
packages/game test:    Start at  04:55:26
packages/game test:    Duration  6.21s (transform 5.34s, setup 5ms, collect 40.72s, tests 1.92s, environment 16ms, prepare 11.93s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 12ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 5ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 156ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 16ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 52ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 79ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 83ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 94ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 103ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 147ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 180ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 144ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 154ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 281ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 293ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 8ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  04:55:33
packages/client-web test:    Duration  5.90s (transform 969ms, setup 5ms, collect 15.28s, tests 1.81s, environment 43.09s, prepare 4.73s)
packages/client-web test: Done
```

### Commit Proof

#### `git show -1 --stat`

```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 04:57:25 2026 +0100

    task(0085): split core moves into modules

- Split packages/game/src/moves.ts into stage/system modules

- Keep CoreMoves keys/signatures unchanged via a thin index assembler

- Preserve rule anchor comments by moving them with the move logic

- Reduce moves.ts to a thin re-export for minimal import churn

 docs/changelog.md                                  |   1 +
 .../0085-REF_MOVES-split-moves-into-modules.md     | 211 +++++++-
 packages/game/src/moves.ts                         | 537 +--------------------
 packages/game/src/moves/index.ts                   |  10 +
 packages/game/src/moves/shared.ts                  |  92 ++++
 packages/game/src/moves/stages/drawAndPlace.ts     | 119 +++++
 packages/game/src/moves/stages/politicalAction.ts  | 320 ++++++++++++
 packages/game/src/moves/system/resolveChoice.ts    |  38 ++
 8 files changed, 784 insertions(+), 544 deletions(-)
```
