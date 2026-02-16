# Codex Task 0081 - REF_MOVES: Moves registry normalization (canonical order, config-only enablement)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0081
- **Area:** `packages/game` moves assembly
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium (ordering + expansion enablement + determinism)

## 1) Context (frozen)

`packages/game/src/moves.ts` currently mixes multiple concerns and expansion moves are assembled in a way that can allow silent overwrites and accidental nondeterministic ordering.

We want the same "deterministic or dead" posture as the resolver refactor series:

- canonical ordering is explicit and used everywhere
- enablement comes only from match config (not state slices, not "zone exists")

## 2) Goal (frozen)

Normalize move assembly so that:

- move module ordering is **explicitly canonical** (e.g. `['core','exp01','exp02','exp03']`) and never derived from object keys, map insertion order, or registration side effects
- expansion enablement is derived **only** from match config (single canonical source)
- assembly is deterministic and reviewable, without changing any move behavior

## 3) Non-goals (frozen)

- No gameplay semantics change (legality, costs, effects, state mutations)
- No changes to resolver behavior
- No "move logic rewritten into atoms" redesign in this task

## 4) Inputs (frozen)

- `packages/game/src/moves.ts`
- `packages/game/src/config.ts` (or canonical match config location)
- `packages/game/src/expansion-registry.ts` (enablement + ordering policy)
- expansion move sources (wherever they are defined today)

## 5) Outputs (frozen)

- A deterministic move assembly API that:
  - takes match config
  - returns an ordered list of enabled move sources/modules in canonical order
  - does not rely on object spreads for semantics

## 6) Constraints (frozen)

- Determinism: no hidden ordering dependencies (JS object key order, map insertion order)
- Enablement: match config only; no gating via `G.engine.attributes.*`, "zone exists", or other heuristics
- Keep changes minimal and localized to move assembly (not implementations)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-005 (No Phantom Moves)
- GR-006 (Pending Choice Gate)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-006, GR-012)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (engine-only rule execution + legality surface)

## 8) Acceptance Criteria (frozen)

- Moves exported for a given match config are identical to current behavior for all existing tests
- Module ordering equals the canonical list filtered by enablement (exact order)
- Negative: disabled expansions contribute nothing (no moves included) and are not inferred via state/zone existence

## 9) PR Checklist (frozen)

- [x] Canonical order defined in one place and used by move assembly
- [x] Enablement derived only from match config (no state/zone heuristics)
- [x] No gameplay semantics changed
- [x] Tests pass
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Added deterministic move assembly helpers (`getEnabledMoveModules` + strict merging with duplicate detection).
- Updated `ExpansionRegistry.getMergedMoves` to be config-only and to reject duplicate move IDs deterministically.
- Updated `packages/game` entrypoints to assemble moves via canonical module order (no semantic changes at current coverage).
- Updated changelog entry for task 0081.

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
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 16ms
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 95ms
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
packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 14ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: exp03
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 10ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 22ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 30ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 28ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 24ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 45ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 65ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test:  ✓ test/turn.test.ts  (9 tests) 155ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 275ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 359ms
packages/game test:  ✓ test/setup.test.ts  (8 tests) 18ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 19ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 17ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 10ms
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 8ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/expansion.test.ts > Expansion System > should return expansions in deterministic canonical order
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: Expansion registered: exp02
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 10ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 10ms
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 8ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 3ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  26 passed (26)
packages/game test:       Tests  102 passed (102)
packages/game test:    Start at  19:26:19
packages/game test:    Duration  4.74s (transform 3.76s, setup 3ms, collect 30.98s, tests 1.28s, environment 7ms, prepare 6.24s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 10ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 18ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 9ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 41ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 61ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 68ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 137ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 86ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 100ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 131ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 127ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 141ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 225ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 233ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 125ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 8ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  19:26:25
packages/client-web test:    Duration  4.76s (transform 1.09s, setup 2ms, collect 12.63s, tests 1.52s, environment 33.95s, prepare 4.00s)
packages/client-web test: Done
```

```bash
git status
```
```text
On branch task/0081-moves-registry-normalization
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/changelog.md
	modified:   packages/game/src/client-game.ts
	modified:   packages/game/src/expansion-registry.ts
	modified:   packages/game/src/index.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/move-assembly.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```text
 docs/changelog.md                       |  2 +-
 packages/game/src/client-game.ts        | 18 +++++++++-------
 packages/game/src/expansion-registry.ts | 37 ++++++++++++++++++++++++++-------
 packages/game/src/index.ts              | 18 +++++++++-------
 4 files changed, 51 insertions(+), 24 deletions(-)
```

```bash
git status
```
```text
On branch task/0081-moves-registry-normalization
nothing to commit, working tree clean
```

```bash
git diff --stat
```
```text
```

```bash
git show -1 --stat
```
```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 19:29:06 2026 +0100

    task(0081): normalize move assembly

- Add deterministic move module assembly helpers.

- Enforce config-only expansion move enablement.

- Reject duplicate move ids deterministically.

- Update changelog + task log.

 docs/changelog.md                                  |   2 +-
 .../0081-REF_MOVES-moves-registry-normalization.md | 217 ++++++++++++++++++++-
 packages/game/src/client-game.ts                   |  18 +-
 packages/game/src/expansion-registry.ts            |  37 +++-
 packages/game/src/index.ts                         |  18 +-
 packages/game/src/move-assembly.ts                 |  61 +++++++
 6 files changed, 322 insertions(+), 31 deletions(-)
```
