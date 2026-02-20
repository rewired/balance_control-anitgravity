# Codex Task 0093 - REF_PACKS: Extract Core into a mandatory CorePack (setup + moves + atoms)

**Date:** 2026-02-17  
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0093
- **Area:** `packages/game` core wiring extraction into a single pack
- **Recommended execution order:** after 0092 (EnginePackRegistry exists)
- **Risk:** Medium-high (touches Setup + Resolver + move wiring)

## 1) Context (frozen)

After 0092 we have a core-capable pack registry, but core is still scattered:

- core setup is embedded in `packages/game/src/setup.ts`
- core moves are embedded via `CoreMoves` imports and manual selection in `packages/game/src/index.ts`
- core atoms are registered inline in `packages/game/src/engine/resolver.ts`

This makes it hard to:
- enforce “core is just a pack”
- avoid special cases
- reason about what core contributes

## 2) Goal (frozen)

Create a single `CorePack` definition that encapsulates core contributions:

- **Setup** (pre-shuffle and post-shuffle hooks)
- **Moves** (full core move surface)
- **Engine atoms** (core atom registrations, with hook trigger injection)

…and register it as the mandatory `core` pack through the new registry.

## 3) Non-goals (frozen)

- Do not change gameplay, rule semantics, or move legality logic.
- Do not implement new expansion moves.
- Do not rework expansion atom ownership (exp02/exp03 atoms may remain where they are for now).

## 4) Inputs (frozen)

- `packages/game/src/setup.ts` (core setup implementation)
- `packages/game/src/moves/**` (core moves)
- `packages/game/src/engine/atoms/{resource,production,measure,influence,choice,hotspot,rules}.ts`
- `packages/game/src/engine/resolver.ts` (inline core module registration)
- `packages/game/src/index.ts` (core moves imported/sliced)
- 0092 outputs:
  - pack types
  - core-capable registry

## 5) Outputs (frozen)

### A) CorePack definition

Add `packages/game/src/packs/core/index.ts` exporting:

- `export const CorePack: EnginePackDefinition`

CorePack must set:

1) `id: 'core'`
2) `name: 'CORE-01 (v1.1.0)'` (or a similarly stable label)
3) `moves`: reuse existing core move implementations from `packages/game/src/moves/**`
4) `setup.preShuffle`: move the **core pre-shuffle setup** logic out of `SetupGame`:
   - global zones init (DrawPile, DiscardFaceUp, Board, Bank, Noise)
   - personal zones + meta markers
   - start committee tile + tile zone
   - staging zones if needed (respect current semantics)
   - generate core tiles (incl ADD56) into DrawPile + create zones for each tile
   - leave expansion setup invocation to the orchestrator (SetupGame)
5) `setup.postShuffle`: move the **starting influence assignment** logic out of `SetupGame`:
   - after final shuffle, add Influence objects into PersonalSupply zones based on player count
6) `engine.atoms`: expose a factory that returns `AtomRegistration[]` for core atoms:
   - must include:
     - coreResourceAtoms
     - coreProductionAtoms
     - coreMeasureAtoms
     - coreInfluenceAtoms
     - coreChoiceAtoms
     - coreHotspotAtoms
     - createCoreRulesAtoms(...) (requires injected `triggerHook`)
   - signature should accept `{ triggerHook }` and wire it into `createCoreRulesAtoms`.

### B) SetupGame delegates to CorePack hooks

Modify `packages/game/src/setup.ts`:

- Keep: ruleset manifest + config normalization + base `G` object creation
- Replace embedded core setup code with:
  - `CorePack.setup.preShuffle(G, ctx, cfg)`
  - `EnginePackRegistry.applySetupPreShuffle(G, ctx, cfg)` for enabled expansions
  - canonical draw pile ordering + shuffle (keep the exact algorithm + anchor comments)
  - `EnginePackRegistry.applySetupPostShuffle(G, ctx, cfg)` (so core post-shuffle runs deterministically)
- Ensure expansion setup still happens **before** final DrawPile shuffle, exactly as today.

### C) Resolver consumes CorePack atoms

Modify `packages/game/src/engine/resolver.ts`:

- Replace inline `registry.registerModule({ id:'core', ... atoms:[...] })` with:
  - `CorePack.engine.atoms({ triggerHook: ... })` as the atoms source for the `core` module registration.

Keep existing exp02/exp03 registrations unchanged in this task (do not expand scope).

### D) CorePack registration

In a central place (recommended: `packages/game/src/index.ts` module initialization or a dedicated `packages/game/src/packs/register-core.ts`):

- Ensure CorePack is registered into the pack registry exactly once.
- If you choose auto-registration inside `@balance-control/game`, it must be deterministic and must not depend on import order across workspace packages.

(If you choose **explicit** registration by entrypoints, defer that to Task 0095, but then update tests in this task so they register CorePack before using the factory.)

### E) Tests

Update / add tests:

- Setup tests must still pass and produce identical invariants (zones, tiles, starting influence counts).
- Golden replay tests must pass unchanged.
- Add a focused unit test that calls `CorePack.setup.preShuffle` and asserts it initializes the Start Committee + base zones deterministically.

## 6) Constraints (frozen)

- Preserve all existing CORE-01 anchor comments and algorithms (especially shuffle and draw pile ordering).
- Do not introduce any new randomness calls.
- Do not change object ids that are relied on by tests (e.g., `tile_start_committee`, `meta_{pid}`) unless tests are updated and determinism is preserved.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-002 (Engine-only Rule Execution)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/rules/000-core.md` (setup + shuffle anchors)

## 8) Acceptance Criteria (frozen)

- `CorePack` exists and encapsulates core setup + moves + atom registrations.
- `SetupGame` delegates core initialization via pack hooks.
- `EffectResolver` sources core atoms via CorePack, not inline arrays.
- Full test suite passes (`pnpm -r test`), including golden replays.

## 9) PR Checklist (frozen)

- [ ] CorePack added (`packages/game/src/packs/core/index.ts`)
- [ ] SetupGame delegates to CorePack hooks (pre/post shuffle)
- [ ] Resolver uses CorePack atoms (triggerHook injection preserved)
- [ ] CorePack registration handled deterministically (tests updated accordingly)
- [ ] Tests pass (`pnpm -r test`)
- [ ] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- Added `CorePack` (setup hooks, core moves, core engine atoms).
- Updated `SetupGame` to delegate core setup to `CorePack` and run expansion setup via `EnginePackRegistry` hooks (pre/post shuffle).
- Updated `EffectResolver` to source core atom registrations via `CorePack` (triggerHook injection preserved).
- Added a focused unit test for `CorePack.setup.preShuffle`.
- Updated `docs/changelog.md`.

### Guardrails

- affected_guardrails: GR-003, GR-002

### PR Checklist (Completed)

- [x] CorePack added (`packages/game/src/packs/core/index.ts`)
- [x] SetupGame delegates to CorePack hooks (pre/post shuffle)
- [x] Resolver uses CorePack atoms (triggerHook injection preserved)
- [x] CorePack registration handled deterministically (tests updated accordingly)
- [x] Tests pass (`pnpm -r test`)
- [x] Task file updated with execution log

### Commands Run

- `pnpm -r test` (pass)
- `git status`
- `git diff --stat`

### Postflight Proof

- `git status`
```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/changelog.md
	modified:   packages/game/src/engine/resolver.ts
	modified:   packages/game/src/expansion-registry.ts
	modified:   packages/game/src/index.ts
	modified:   packages/game/src/setup.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/packs/core/
	packages/game/src/packs/register-core.ts
	packages/game/test/core-pack-setup.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

- `git diff --stat`
```text
 docs/changelog.md                       |   1 +
 packages/game/src/engine/resolver.ts    |  24 ++----
 packages/game/src/expansion-registry.ts |   1 +
 packages/game/src/index.ts              |   2 +
 packages/game/src/setup.ts              | 146 ++------------------------------
 5 files changed, 17 insertions(+), 157 deletions(-)
```

- `pnpm -r test`
```text
PASS (pnpm -r test)
```

### Commands Run (Additional)

- `pnpm -r test` (pass)
- `pnpm -r test -- --reporter dot` (pass)
- `pnpm -r test -- --silent` (pass)

### Postflight Proof (Additional)

- `pnpm -r test`
```text
Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/game[39m
packages/game test:  [32m✓[39m test/spec-anchor-tripwire.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 108[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp01-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-01 controller grants with no controller[2m > [22m[2mshould not throw and should SKIP grant when controller is missing[22m[39m
packages/game test: EXP-01 Setup Complete.
packages/game test:  [32m✓[39m test/exp01-controller-grants-no-throw.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 12[2mms[22m[39m
packages/game test: [90mstderr[2m | test/resolver.test.ts[2m > [22m[2mEffectResolver cost and production behavior[2m > [22m[2mshould not mutate state when resource.pay cannot be fully paid[22m[39m
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test:  [32m✓[39m test/unplaceable-draw-redraw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 17[2mms[22m[39m
packages/game test:  [32m✓[39m test/resolver.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 16[2mms[22m[39m
packages/game test:  [32m✓[39m test/determinism-policy.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 24[2mms[22m[39m
packages/game test:  [32m✓[39m test/legal-intents.test.ts [2m ([22m[2m7 tests[22m[2m)[22m[90m 35[2mms[22m[39m
packages/game test:  [32m✓[39m test/hotspot.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 32[2mms[22m[39m
packages/game test:  [32m✓[39m test/moves.test.ts [2m ([22m[2m22 tests[22m[2m)[22m[90m 41[2mms[22m[39m
packages/game test: [90mstderr[2m | test/moves.test.ts[2m > [22m[2mMoves[2m > [22m[2mplaceInfluence should reject malformed payload without mutation[22m[39m
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  [32m✓[39m test/measure-deck-provider.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 34[2mms[22m[39m
packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mroutes EXP-02 measure object ids to the EXP-02 measure zones[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mfails deterministically when multiple enabled decks match the same object id[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/player-view.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 32[2mms[22m[39m
packages/game test:  [32m✓[39m test/server-smoke.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 61[2mms[22m[39m
packages/game test:  [32m✓[39m test/replay-runner.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 84[2mms[22m[39m
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject placeTile during politicalAction stage without mutation[22m[39m
packages/game test: ERROR: disallowed move: placeTile
packages/game test:  [32m✓[39m test/turn.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[90m 232[2mms[22m[39m
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject passTilePlacement when a staging tile exists[22m[39m
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-02 CONTROLLER grants[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-02 effect path[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/exp02-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 49[2mms[22m[39m
packages/game test: [90mstderr[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_hotspot_convert_pingpong[22m[39m
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: [90mstdout[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_plus_ex01_small[22m[39m
packages/game test: EXP-01 Setup Complete.
packages/game test:  [32m✓[39m test/golden-replay.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[33m 452[2mms[22m[39m
packages/game test: [2m Test Files [22m [1m[32m30 passed[39m[22m[90m (30)[39m
packages/game test: [2m      Tests [22m [1m[32m115 passed[39m[22m[90m (115)[39m
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/client-web[39m
packages/client-web test: [2m Test Files [22m [1m[32m16 passed[39m[22m[90m (16)[39m
packages/client-web test: [2m      Tests [22m [1m[32m48 passed[39m[22m[90m (48)[39m
packages/client-web test: Done
```

### Commit Proof

- Branch: `task/0093-core-pack`

- `git show -1 --stat`
```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 08:54:22 2026 +0100

    task(0093): extract core into CorePack

- Add CorePack (setup hooks, moves, engine atoms)
- Delegate SetupGame pre/post-shuffle via pack hooks
- Wire EffectResolver core atoms through CorePack factory
- Add CorePack preShuffle unit test + changelog entry

 docs/changelog.md                                  |   1 +
 ...EF_PACKS-core-pack-extract-setup-moves-atoms.md | 118 ++++++++++++++-
 packages/game/src/engine/resolver.ts               |  24 +--
 packages/game/src/expansion-registry.ts            |   1 +
 packages/game/src/index.ts                         |   2 +
 packages/game/src/packs/core/index.ts              | 164 +++++++++++++++++++++
 packages/game/src/packs/register-core.ts           |   9 ++
 packages/game/src/setup.ts                         | 146 +-----------------
 packages/game/test/core-pack-setup.test.ts         |  82 +++++++++++
 9 files changed, 388 insertions(+), 159 deletions(-)
```

- `git status`
```text
On branch task/0093-core-pack
nothing to commit, working tree clean
```
