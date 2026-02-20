# Codex Task 0082 - REF_MOVES: MoveModuleRegistry (no override, deterministic duplicate errors)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0082
- **Area:** `packages/game` move assembly
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium-high (changes merge behavior; must be deterministic)

## 1) Context (frozen)

After Task 0081 establishes deterministic module ordering + config-only enablement, we need to eliminate silent overwrites entirely by assembling move maps through an explicit registry that rejects duplicates.

## 2) Goal (frozen)

Introduce a `MoveModuleRegistry` that:

- registers moves (`moveName -> fn`) from core + enabled expansion move modules
- rejects duplicate move keys (no override / no last-write-wins)
- throws deterministic errors (stable message + stable conflict listing order)

## 3) Non-goals (frozen)

- No changes to any move logic or signatures
- No rename of existing move keys
- No "override allowed" mode

## 4) Inputs (frozen)

- Output of Task 0071 (deterministic ordered module list)
- Current move exports (boardgame.io move map)

## 5) Outputs (frozen)

- `MoveModuleRegistry` implementation (location under `packages/game/src/` appropriate, avoiding circular deps)
- Move assembly uses registry output rather than object spread
- Deterministic error format for duplicates:
  - includes duplicate move key
  - includes conflicting module ids
  - lists conflicts in canonical module order (then move key sort if needed)

## 6) Constraints (frozen)

- Determinism: error messages must be stable across runs
- Enablement: core always enabled; expansion modules only when their canonical flag is `true`
- No behavior change when there are no duplicates

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-005 (No Phantom Moves)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (legal move surface)

## 8) Acceptance Criteria (frozen)

- Duplicate move keys are rejected with deterministic errors (unit test added in 0073)
- For valid configs, exported moves behave identically to before
- Disabled expansions register nothing

## 9) PR Checklist (frozen)

- [x] Registry introduced; object-spread merges removed from assembly path
- [x] No override policy enforced (duplicate key errors)
- [x] Deterministic error format (stable message + stable listing order)
- [x] Tests pass
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Added `MoveModuleRegistry` to assemble boardgame.io move maps without silent overwrites (deterministic duplicate conflict listing).
- Refactored `mergeMoveModules` to use the registry (no semantic change when no duplicates exist).
- Added unit test covering deterministic duplicate error formatting and ordering.

### Commands Run

```bash
pnpm lint
```
Outcome: pass (exit 0)

```bash
$env:NO_COLOR='1'; pnpm test
```
Outcome: pass (exit 0)

```text
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 11ms
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 74ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/setup.test.ts  (8 tests) 24ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 15ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 19ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/moves.test.ts  (22 tests) 29ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 31ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 19ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 46ms
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
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 61ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  ✓ test/turn.test.ts  (9 tests) 178ms
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 287ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 318ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 9ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 19ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 26ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: exp03
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 10ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/expansion.test.ts > Expansion System > should return expansions in deterministic canonical order
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: Expansion registered: exp02
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 13ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 11ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  ✓ test/move-module-registry.test.ts  (1 test) 3ms
packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 3ms
packages/game test:  Test Files  27 passed (27)
packages/game test:       Tests  103 passed (103)
packages/game test:    Start at  21:46:50
packages/game test:    Duration  4.79s (transform 4.67s, setup 2ms, collect 29.73s, tests 1.29s, environment 7ms, prepare 6.49s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 21ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 14ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 117ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 6ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 39ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 60ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 64ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 82ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 88ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 122ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 141ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 126ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 201ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 124ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 225ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 6ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  21:46:56
packages/client-web test:    Duration  4.75s (transform 898ms, setup 3ms, collect 12.51s, tests 1.44s, environment 34.25s, prepare 4.16s)
packages/client-web test: Done
```

```bash
git status
```
```text
On branch task/0082-move-module-registry-no-override
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   packages/game/src/move-assembly.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/move-module-registry.ts
	packages/game/test/move-module-registry.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```text
 packages/game/src/move-assembly.ts | 26 +++++---------------------
 1 file changed, 5 insertions(+), 21 deletions(-)
```

```bash
git show -1 --stat
```
```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 21:48:56 2026 +0100

    task(0082): add MoveModuleRegistry

- Introduce MoveModuleRegistry for deterministic move assembly.

- Forbid duplicate move keys with stable conflict listing.

- Refactor mergeMoveModules to use registry.

- Add unit test for duplicate error ordering.

- Update task log with commands and proof.

 ...2-REF_MOVES-move-module-registry-no-override.md | 212 ++++++++++++++++++++-
 packages/game/src/move-assembly.ts                 |  26 +--
 packages/game/src/move-module-registry.ts          |  74 +++++++++
 packages/game/test/move-module-registry.test.ts    |  43 ++++++
 4 files changed, 327 insertions(+), 28 deletions(-)
```

```bash
git status
```
```text
On branch task/0082-move-module-registry-no-override
nothing to commit, working tree clean
```

```bash
git diff --stat
```
```text
```
