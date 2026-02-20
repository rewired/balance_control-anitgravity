# Codex Task 0080 - REF_RESOLVER: Split resolver.ts into modules (mechanical move, preserve anchors)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`

## 0) Metadata (frozen)

- **Task ID:** 0080
- **Area:** Refactor for readability (mechanical split)
- **Risk:** Medium-high (large file moves; must preserve behavior, determinism, and rule anchors)

## 1) Context (frozen)

`packages/game/src/engine/resolver.ts` is large and mixes concerns (queue runner, modifiers, costs, and many atom handlers).
We want to improve readability by splitting into focused modules while keeping:

- one canonical resolver pipeline
- deterministic behavior
- rule anchor comments moving with the logic they justify

## 2) Goal (frozen)

Mechanically split `resolver.ts` into modules:

- `resolver.ts`: orchestrator + dispatch only
- atom handlers moved into `engine/atoms/*` grouped by domain (resource/influence/measure/regulation/countdown/production/hotspot/rules/choice)
- shared helpers extracted (hooks/modifiers, deterministic ids, cost logic as appropriate)

All semantic behavior remains unchanged.

## 3) Non-goals (frozen)

- No rules changes
- No functional changes to atom semantics, costs, production, or majority behavior
- No reformatting-only churn beyond what is required by file moves/imports/exports

## 4) Inputs (frozen)

- `packages/game/src/engine/resolver.ts`
- `packages/game/src/engine/types.ts`
- `packages/game/src/engine/selectors.ts`
- `packages/game/src/expansion-registry.ts`
- Tests in `packages/game/test/*` (especially golden replay)

## 5) Outputs (frozen)

- New engine modules under `packages/game/src/engine/` that reduce resolver.ts size substantially
- Rule-anchor comments preserved and relocated with code
- All tests passing

## 6) Constraints (frozen)

- Must preserve canonical resolver order (no pipeline reordering)
- Must preserve determinism (stable ordering, seeded RNG usage only)
- Must not introduce alternative state mutation paths outside resolver

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-007 (Effect CPU Resolution Order)
- GR-009 (Zone Invariants)
- GR-011 (Production Canon)

### spec_anchor_refs

- `docs/architecture/ARCH-03-MEASURE-CPU.md` (resolver CPU model)
- `docs/architecture/ARCH-02-STATE-SHAPE.md` (zone invariants and expansion isolation)
- `docs/rules/000-core.md` (rule anchors referenced by code - must remain attached)
- AGENTS: 0.2, 0.5, 3.5, 3.6

## 8) Acceptance Criteria (frozen)

- `resolver.ts` becomes primarily orchestration + dispatch (no large domain logic blocks)
- Atom behavior is unchanged (golden replay final hash/result remains identical)
- Rule anchors remain present, accurate, and colocated with logic
- All tests pass
 
Reviewability requirements:

- Avoid diff churn: do not reformat unrelated code. Keep changes to mechanical moves + required imports/exports only.

## 9) PR Checklist (frozen)

- [x] `resolver.ts` split into focused modules
- [x] Rule anchor comments moved with logic (no anchor loss)
- [x] No semantic changes (golden replay unchanged)
- [x] Determinism preserved
- [x] All tests pass
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Split `packages/game/src/engine/resolver.ts` into an orchestrator + dispatch-only entry point.
- Moved atom handlers into `packages/game/src/engine/atoms/*` grouped by domain (resource/influence/measure/regulation/countdown/production/hotspot/rules/choice).
- Extracted shared resolver helpers into `packages/game/src/engine/resolver/*` (ids, prohibitions, modifiers, costs).
- Preserved existing rule-anchor comments by moving them with their corresponding logic (mechanical move).
- Verified determinism and golden replay invariants via `vitest` (workspace `pnpm test`).
- Added `docs/changelog.md` entry per repo documentation contract.

### Commands Run

```bash
git status
```
```
On branch task/0080-split-resolver-modules
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	new file:   docs/changelog.md
	modified:   docs/tasks/0080-REF_RESOLVER-split-resolver-into-modules.md
	new file:   packages/game/src/engine/atoms/choice.ts
	new file:   packages/game/src/engine/atoms/countdown.ts
	new file:   packages/game/src/engine/atoms/hotspot.ts
	new file:   packages/game/src/engine/atoms/influence.ts
	new file:   packages/game/src/engine/atoms/measure.ts
	new file:   packages/game/src/engine/atoms/production.ts
	new file:   packages/game/src/engine/atoms/regulation.ts
	new file:   packages/game/src/engine/atoms/resource.ts
	new file:   packages/game/src/engine/atoms/rules.ts
	modified:   packages/game/src/engine/resolver.ts
	new file:   packages/game/src/engine/resolver/costs.ts
	new file:   packages/game/src/engine/resolver/ids.ts
	new file:   packages/game/src/engine/resolver/modifiers.ts
	new file:   packages/game/src/engine/resolver/prohibitions.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```
 docs/changelog.md                                  |   6 +
 ...080-REF_RESOLVER-split-resolver-into-modules.md |  12 +-
 packages/game/src/engine/atoms/choice.ts           |  28 +
 packages/game/src/engine/atoms/countdown.ts        |  26 +
 packages/game/src/engine/atoms/hotspot.ts          |  43 ++
 packages/game/src/engine/atoms/influence.ts        |  56 ++
 packages/game/src/engine/atoms/measure.ts          |  85 ++
 packages/game/src/engine/atoms/production.ts       |  69 ++
 packages/game/src/engine/atoms/regulation.ts       |  59 ++
 packages/game/src/engine/atoms/resource.ts         | 132 ++++
 packages/game/src/engine/atoms/rules.ts            |  44 ++
 packages/game/src/engine/resolver.ts               | 857 ++-------------------
 packages/game/src/engine/resolver/costs.ts         | 273 +++++++
 packages/game/src/engine/resolver/ids.ts           |  16 +
 packages/game/src/engine/resolver/modifiers.ts     |  50 ++
 packages/game/src/engine/resolver/prohibitions.ts  |  23 +
 16 files changed, 959 insertions(+), 820 deletions(-)
```

```bash
pnpm test -- --reporter dot --silent
```
```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test "--" "--reporter" "dot" "--silent"

Scope: 9 of 10 workspace projects
packages/game test$ vitest run "--" "--reporter" "dot" "--silent"
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 77ms
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 29ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/setup.test.ts  (8 tests) 20ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 24ms
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
packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 1868ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 26ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 29ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 21ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/moves.test.ts  (22 tests) 39ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 40ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 62ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 153ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: ...3171 chars truncated… test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/expansion.test.ts > Expansion System > should return expansions in deterministic canonical order
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: Expansion registered: exp02
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 6ms
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 8ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 9ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 3ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  26 passed (26)
packages/game test:       Tests  102 passed (102)
packages/game test:    Start at  18:38:51
packages/game test:    Duration  4.69s (transform 5.20s, setup 4ms, collect 27.59s, tests 3.11s, environment 9ms, prepare 6.04s)
packages/game test: Done
packages/client-web test$ vitest run "--" "--reporter" "dot" "--silent"
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 6ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 21ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 122ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 10ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 41ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 60ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 61ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 73ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 70ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 126ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 107ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 110ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 120ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 211ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 217ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 8ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  18:38:56
packages/client-web test:    Duration  4.89s (transform 1.11s, setup 3ms, collect 13.12s, tests 1.36s, environment 34.62s, prepare 3.94s)
packages/client-web test: Done
```

```bash
pnpm lint
```
```
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

```bash
git show -1 --stat
```
```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 18:40:22 2026 +0100

    task(0080): split resolver into modules

- Move atom handlers into engine/atoms/* by domain
- Extract cost/modifier/prohibition/id helpers into engine/resolver/*
- Keep resolver.ts as orchestration + dispatch entry point
- Preserve rule anchors and determinism; tests remain green

 docs/changelog.md                                  |   6 +
 ...080-REF_RESOLVER-split-resolver-into-modules.md | 218 +++++-
 packages/game/src/engine/atoms/choice.ts           |  28 +
 packages/game/src/engine/atoms/countdown.ts        |  26 +
 packages/game/src/engine/atoms/hotspot.ts          |  43 ++
 packages/game/src/engine/atoms/influence.ts        |  56 ++
 packages/game/src/engine/atoms/measure.ts          |  85 ++
 packages/game/src/engine/atoms/production.ts       |  69 ++
 packages/game/src/engine/atoms/regulation.ts       |  59 ++
 packages/game/src/engine/atoms/resource.ts         | 132 ++++
 packages/game/src/engine/atoms/rules.ts            |  44 ++
 packages/game/src/engine/resolver.ts               | 857 ++-------------------
 packages/game/src/engine/resolver/costs.ts         | 273 +++++++
 packages/game/src/engine/resolver/ids.ts           |  16 +
 packages/game/src/engine/resolver/modifiers.ts     |  50 ++
 packages/game/src/engine/resolver/prohibitions.ts  |  23 +
 16 files changed, 1163 insertions(+), 822 deletions(-)
```

```bash
git status
```
```
On branch task/0080-split-resolver-modules
nothing to commit, working tree clean
```
