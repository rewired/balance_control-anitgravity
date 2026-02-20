# Codex Task 0092 - REF_PACKS: Promote legacy registry to EnginePackRegistry (Core-capable)

**Date:** 2026-02-17  
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0092
- **Area:** `packages/game` registry layer (expansions -> packs) + public API
- **Recommended execution order:** after 0088 (factory move superset)
- **Risk:** Medium (API surface + many call sites)

## 1) Context (frozen)

We already have deterministic, canonical ordering concepts in place:

- `CANONICAL_ENGINE_MODULE_ORDER = ['core','exp01','exp02','exp03']` exists in `packages/game/src/expansion-registry.ts`
- We have separate registries for:
  - moves (`move-module-registry.ts`)
  - atoms (`engine/engine-module-registry.ts`)
- But **core is still not a first-class “pack”**:
  - the legacy registry only accepts `ExpansionId` (`exp01..03`)
  - core wiring is still special-cased (setup/moves/resolver)

Goal direction:
- Treat **CORE** as a **mandatory pack** that is registered and assembled like any other pack.
- Keep determinism and “no silent overwrite” guarantees.

## 2) Goal (frozen)

Introduce a **single pack registry contract** that can register:

- `core` (mandatory pack)
- `exp01/exp02/exp03` (optional packs; enabled via match config flags)

…and can expose pack contributions in a canonical, deterministic way for:
- move assembly (superset + enabled subsets)
- setup hooks (pre-shuffle and optional post-shuffle)
- engine atom modules (optional; used by resolver wiring)

## 3) Non-goals (frozen)

- Do **not** move or refactor core implementation yet (that is Task 0093).
- Do **not** add new gameplay rules, moves, or atoms.
- Do **not** change match config structure (`G.meta.cfg`).

## 4) Inputs (frozen)

- `packages/game/src/expansion-registry.ts` (current registry)
- `packages/game/src/move-assembly.ts`
- `packages/game/src/engine/engine-module-registry.ts`
- `packages/game/src/engine/resolver.ts`
- Consumers importing the legacy registry alias:
  - `packages/client-web/src/game.ts`
  - `packages/server/src/index.ts`
  - `packages/bot-llm/src/index.ts`
  - multiple `packages/game/test/*.test.ts`

## 5) Outputs (frozen)

### A) Define pack contract (types)

Create a new pack contract type in `packages/game/src/packs/types.ts` (or equivalent, but keep it central):

- `EnginePackId` = `'core' | 'exp01' | 'exp02' | 'exp03'`
- `EnginePackDefinition` with (all optional except id+name):
  - `id: EnginePackId`
  - `name: string`
  - `moves?: Record<string, (...args: any[]) => any>`
  - `setup?: { preShuffle?: (G, ctx, cfg) => void; postShuffle?: (G, ctx, cfg) => void }`
  - `engine?: { atoms?: (args: { triggerHook: Function }) => import('../engine/engine-module-registry').AtomRegistration[] }`

Notes:
- Keep the contract **compatible with existing expansion definitions**: expansions can be adapted/wrapped without modifying `@balance-control/expansion-0x` packages in this task.
- Do not over-design. The goal is: “core can be represented”.

### B) Implement EnginePackRegistry (core-capable)

Refactor `packages/game/src/expansion-registry.ts` into a core-capable registry:

- Keep `CANONICAL_ENGINE_MODULE_ORDER` as the single ordering source.
- Add storage for packs by `EnginePackId` (not only expansions).
- Enablement rules:
  - `core` is always enabled.
  - `exp0x` enabled based on `ExpansionFlags` (`ex01/ex02/ex03`) from config / `G.meta.cfg`.

API expectations (minimum):
- `registerPack(def: EnginePackDefinition): void`
- `getRegisteredPacks(): EnginePackDefinition[]` (canonical order)
- `getEnabledPacks(G?: GameState, cfg?: GameConfig): EnginePackDefinition[]`
- `getRegisteredMoveModules(): MoveModule[]` (includes core if it has moves)
- `getEnabledMoveModules(cfg?: GameConfig): MoveModule[]` (includes core always; expansions gated)
- `applySetupPreShuffle(...)` and `applySetupPostShuffle(...)` helpers that execute pack hooks in canonical order.

### C) Backward compatibility shim

To avoid a flag day across packages, keep a compatibility export:

- Keep `export const LegacyRegistry = EnginePackRegistry` (or re-export alias)
- Keep existing `register(...)` working for expansions (wrap to `registerPack(...)`), but **do not** allow registering core through the old method.

Document in code comments:
- “Legacy registry is deprecated; use EnginePackRegistry / registerPack.”

### D) Tests

Update / add tests in `packages/game/test`:

- Registry ordering is canonical and deterministic.
- Duplicate pack id registration is rejected.
- Duplicate move ids across packs are rejected deterministically (no silent overwrite).
- Enabled pack selection:
  - core always enabled
  - expansions match flags

Keep all existing tests passing.

## 6) Constraints (frozen)

- Determinism: do not rely on object insertion order; always sort keys when merging.
- No override: duplicates must throw with an actionable error.
- Core-mandatory: the new registry must have an explicit concept that `core` is always enabled (even if not registered yet).

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)
- GR-002 (Engine-only Rule Execution)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012, GR-002)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`

## 8) Acceptance Criteria (frozen)

- `EnginePackRegistry` exists and can register `core` plus expansions.
- Canonical ordering is enforced for all public registry outputs.
- Duplicate ids (pack id, move id) throw deterministically.
- Existing test suite passes (`pnpm -r test`).

## 9) PR Checklist (frozen)

- [x] Pack contract added (`packs/types.ts` or equivalent)
- [x] Registry refactor complete and backward-compatible
- [x] Deterministic ordering + no-override invariants enforced
- [x] Tests updated/added and passing (`pnpm -r test`)
- [x] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- ...
- Added `EnginePackId`/`EnginePackDefinition` contract (`packages/game/src/packs/types.ts`).
- Refactored registry to `EnginePackRegistry` (core-capable) with backward-compatible legacy alias and legacy `register()` adapter.
- Updated move assembly to consume enabled/registered pack move modules deterministically (core fallback to existing `CoreMoves`).
- Added pack registry tests covering canonical ordering, core enablement, duplicate pack ids, and duplicate move id rejection.
- Updated `docs/changelog.md` with task(0092) entry.

### Commands Run

- ...
- `pnpm -r test` (OK)
- `git status` (OK)
- `git diff --stat` (OK)

### Postflight Proof

- `git status`
- `pnpm -r test`
- `git diff --stat`

#### `git status`

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/changelog.md
	modified:   packages/game/src/expansion-registry.ts
	modified:   packages/game/src/index.ts
	modified:   packages/game/src/move-assembly.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/packs/
	packages/game/test/engine-pack-registry.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

#### `git diff --stat`

```
 docs/changelog.md                       |   1 +
 packages/game/src/expansion-registry.ts | 190 +++++++++++++++++++++++---------
 packages/game/src/index.ts              |   4 +-
 packages/game/src/move-assembly.ts      |  46 ++++----
 4 files changed, 158 insertions(+), 83 deletions(-)
```

#### `pnpm -r test`

```
Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/game[39m
packages/game test:  [32m✓[39m test/spec-anchor-tripwire.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 94[2mms[22m[39m
packages/game test:  [32m✓[39m test/setup.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[90m 19[2mms[22m[39m
packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mroutes EXP-02 measure object ids to the EXP-02 measure zones[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mfails deterministically when multiple enabled decks match the same object id[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/measure-deck-provider.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 34[2mms[22m[39m
packages/game test:  [32m✓[39m test/controller-fallback-hardening.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 6[2mms[22m[39m
packages/game test:  [32m✓[39m test/exp03-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 12[2mms[22m[39m
packages/game test:  [32m✓[39m test/determinism-policy.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 24[2mms[22m[39m
packages/game test:  [32m✓[39m test/legal-intents.test.ts [2m ([22m[2m7 tests[22m[2m)[22m[90m 27[2mms[22m[39m
packages/game test:  [32m✓[39m test/hotspot.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 35[2mms[22m[39m
packages/game test: [90mstderr[2m | test/moves.test.ts[2m > [22m[2mMoves[2m > [22m[2mplaceInfluence should reject malformed payload without mutation[22m[39m
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  [32m✓[39m test/moves.test.ts [2m ([22m[2m22 tests[22m[2m)[22m[90m 41[2mms[22m[39m
packages/game test:  [32m✓[39m test/player-view.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 27[2mms[22m[39m
packages/game test:  [32m✓[39m test/server-smoke.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 47[2mms[22m[39m
packages/game test:  [32m✓[39m test/replay-runner.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 78[2mms[22m[39m
packages/game test:  [32m✓[39m test/convert-resources-real-setup.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 22[2mms[22m[39m
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject placeTile during politicalAction stage without mutation[22m[39m
packages/game test: ERROR: disallowed move: placeTile
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject passTilePlacement when a staging tile exists[22m[39m
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  [32m✓[39m test/turn.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[90m 207[2mms[22m[39m
packages/game test:  [32m✓[39m test/golden-replay.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[33m 352[2mms[22m[39m
packages/game test: [90mstderr[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_hotspot_convert_pingpong[22m[39m
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: [90mstdout[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_plus_ex01_small[22m[39m
packages/game test: EXP-01 Setup Complete.
packages/game test:  [32m✓[39m test/exp02-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 14[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-02 CONTROLLER grants[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-02 effect path[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/resolver.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 16[2mms[22m[39m
packages/game test: [90mstderr[2m | test/resolver.test.ts[2m > [22m[2mEffectResolver cost and production behavior[2m > [22m[2mshould not mutate state when resource.pay cannot be fully paid[22m[39m
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test:  [32m✓[39m test…281 chars truncated… should SKIP grant when controller is missing[22m[39m
packages/game test: EXP-01 Setup Complete.
packages/game test:  [32m✓[39m test/tripwire-controller-grants-policy.test.ts [2m ([22m[2m1 test[22m[2m)[22m[33m 396[2mms[22m[39m
packages/game test:  [32m✓[39m test/computeMajorirty.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 8[2mms[22m[39m
packages/game test:  [32m✓[39m test/unplaceable-draw-redraw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 15[2mms[22m[39m
packages/game test:  [32m✓[39m test/expansion.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 7[2mms[22m[39m
packages/game test:  [32m✓[39m test/resolver-invariants.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 11[2mms[22m[39m
packages/game test:  [32m✓[39m test/exp02-hotspot-ids.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 5[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp02-hotspot-ids.test.ts[2m > [22m[2mEXP-02 Inner Order hotspot id consistency[2m > [22m[2mshould resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id[22m[39m
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/engine-pack-registry.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 5[2mms[22m[39m
packages/game test:  [32m✓[39m test/move-assembly-invariants.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 5[2mms[22m[39m
packages/game test:  [32m✓[39m test/production-uncontrolled.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
packages/game test:  [32m✓[39m test/move-module-registry.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
packages/game test:  [32m✓[39m test/engine-module-registry.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
packages/game test: [2m Test Files [22m [1m[32m29 passed[39m[22m[90m (29)[39m
packages/game test: [2m      Tests [22m [1m[32m114 passed[39m[22m[90m (114)[39m
packages/game test: [2m   Start at [22m 08:20:29
packages/game test: [2m   Duration [22m 4.99s[2m (transform 4.30s, setup 3ms, collect 33.88s, tests 1.53s, environment 7ms, prepare 7.21s)[22m
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/client-web[39m
packages/client-web test:  [32m✓[39m test/hexLayout.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 7[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/fitToBounds.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 6[2mms[22m[39m
packages/client-web test:  [32m✓[39m src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx [2m ([22m[2m9 tests[22m[2m)[22m[90m 99[2mms[22m[39m
packages/client-web test:  [32m✓[39m src/ui/__tests__/intentViewModel.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 8[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/controls-start-committee.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 31[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/action-panel.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 47[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/hotseat-shell.smoke.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 58[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/Board.test.tsx [2m ([22m[2m7 tests[22m[2m)[22m[90m 70[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/drawpile-and-discard-ui.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 82[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/public-notice-unplaceable.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 106[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/pending-choice-modal.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 119[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/selection-inspector.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 141[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/start-flow-mode-select.smoke.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 127[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/lobby-screen.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 184[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/lobby-session-persistence.test.tsx [2m ([22m[2m4 tests[22m[2m)[22m[90m 204[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/no-game-src-imports.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 7[2mms[22m[39m
packages/client-web test: [2m Test Files [22m [1m[32m16 passed[39m[22m[90m (16)[39m
packages/client-web test: [2m      Tests [22m [1m[32m48 passed[39m[22m[90m (48)[39m
packages/client-web test: [2m   Start at [22m 08:20:35
packages/client-web test: [2m   Duration [22m 5.10s[2m (transform 1.70s, setup 7ms, collect 15.25s, tests 1.30s, environment 34.94s, prepare 4.12s)[22m
packages/client-web test: Done
```
