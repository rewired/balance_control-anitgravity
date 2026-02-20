# Codex Task 0094 - REF_PACKS: Remove core special-casing (Game wiring uses packs only)

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0094
- **Area:** `packages/game` public Game factory + move/atom assembly wiring
- **Recommended execution order:** after 0093 (CorePack exists)
- **Risk:** Medium-high (touches Game factory and stages)

## 1) Context (frozen)

After 0093, core logic lives in `CorePack`, but we still have special-casing in `packages/game/src/index.ts`:

- direct imports of `CoreMoves`
- manual slicing of “political core moves”
- stage move maps hardwired to core

This blocks the intended architecture:

- “Game = kernel that assembles packs”
- core is mandatory, but should not require bespoke imports and manual wiring

## 2) Goal (frozen)

Update `createBalanceControlGame()` to:

- assemble **all move maps** from the pack registry (superset construction)
- build stage move maps by selecting from the merged move superset (not by importing core directly)
- ensure core pack is **mandatory**: if core is missing, fail fast with a clear error
- keep determinism and “no silent overwrite” behavior

## 3) Non-goals (frozen)

- Do not change turn structure, stage names, or end conditions.
- Do not change legality gating strategy (enumeration + resolver + cfg remain authoritative).
- Do not add expansion moves; this is purely wiring correctness.

## 4) Inputs (frozen)

- `packages/game/src/index.ts` (Game factory + stages)
- `packages/game/src/move-assembly.ts`
- `packages/game/src/expansion-registry.ts` (now pack registry)
- `packages/game/src/packs/core/index.ts` (CorePack)
- Existing tests in `packages/game/test`

## 5) Outputs (frozen)

### A) Game factory uses pack move superset

Refactor `packages/game/src/index.ts`:

- Remove direct `import { CoreMoves } from './moves'` usage.
- Build:
  - `const moveModules = getMoveModulesSuperset()` (should now include `core` pack moves)
  - `const mergedMoves = mergeMoveModules(moveModules)`
- Stage move maps must be derived from `mergedMoves` by move id selection:
  - `drawAndPlace` stage must expose `placeTile` and `passTilePlacement` from `mergedMoves`
  - `politicalAction` stage must expose:
    - core political-action moves (same move ids as before)
    - plus all expansion move modules (as today’s “superset” intent)

Implementation detail (recommended):
- define a stable list of core political-action move ids:
  - `['placeInfluence','moveInfluence','formalizeInfluence','convertResources','resolveChoice']`
- build `politicalActionMoves` by picking those keys from `mergedMoves`, plus merged expansion moves (excluding non-political core moves if any).

### B) Mandatory core guard

Add a clear runtime guard:

- If core pack is not registered (or provides no required moves), throw an error like:
  - `Core pack not registered. Register CorePack before calling createBalanceControlGame().`

This must trigger in:
- server startup
- client-web startup
- bot startup
- tests (unless they register core)

### C) Tests

Update tests to align with new wiring:

- Any test that uses `createBalanceControlGame()` must register CorePack first (or use a helper).
- Add a unit test that asserts the factory throws if core pack is missing.
- Ensure move assembly invariants still hold (no silent override).
- Golden replays still pass.

## 6) Constraints (frozen)

- Deterministic move surface: merging must remain canonical and key-sorted.
- No behavior changes: stage gating must result in the same legal move availability as before (modulo the superset principle).
- Do not reintroduce DEFAULT_GAME_CONFIG import-time traps (0092/0088 intent).

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/rules/000-core.md` (turn/stage structure references)

## 8) Acceptance Criteria (frozen)

- `packages/game/src/index.ts` no longer imports `CoreMoves` directly for stage wiring.
- Stage move maps are sourced from the merged pack move superset.
- Factory fails fast with a clear error if core is not registered.
- Test suite passes (`pnpm -r test`) including golden replays.

## 9) PR Checklist (frozen)

- [x] Core special-casing removed from Game factory
- [x] Mandatory core guard added
- [x] Tests updated + new guard test added
- [x] `pnpm -r test` passes
- [x] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- Registered CorePack in remaining game and replay tests that build game state.
- Exported CorePack from the game package for downstream registration.
- Registered CorePack in the client-web game entrypoint before creating the game.
- Verified test suite and lint after wiring changes.

### Guardrails

- GR-003
- GR-012

### Commands Run

- `pnpm -r test` (pass)
- `pnpm lint` (pass with TypeScript version warning)
- `git status`
- `git diff --stat`
- `git show -1 --stat`

### Postflight Proof

- `git status`
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   docs/tasks/0094-REF_PACKS-game-wiring-packs-only.md
        modified:   packages/client-web/src/game.ts
        modified:   packages/game/src/index.ts
        modified:   packages/game/src/move-assembly.ts
        modified:   packages/game/src/packs/register-core.ts
        modified:   packages/game/test/convert-resources-real-setup.test.ts
        modified:   packages/game/test/determinism-policy.test.ts
        modified:   packages/game/test/exp01-controller-grants-no-throw.test.ts
        modified:   packages/game/test/exp02-controller-grants-no-throw.test.ts
        modified:   packages/game/test/exp02-hotspot-ids.test.ts
        modified:   packages/game/test/exp03-controller-grants-no-throw.test.ts
        modified:   packages/game/test/golden-replay.test.ts
        modified:   packages/game/test/legal-intents.test.ts
        modified:   packages/game/test/move-assembly-invariants.test.ts
        modified:   packages/game/test/player-view.test.ts
        modified:   packages/game/test/replay-runner.test.ts
        modified:   packages/game/test/server-smoke.test.ts
        modified:   packages/game/test/setup.test.ts
        modified:   packages/game/test/turn.test.ts
        modified:   packages/game/test/unplaceable-draw-redraw.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```
- `git diff --stat`
```
.../tasks/0094-REF_PACKS-game-wiring-packs-only.md | 83 +++++++++++++++++++---
packages/client-web/src/game.ts                    |  8 ++-
packages/game/src/index.ts                         | 38 ++++++----
packages/game/src/move-assembly.ts                 | 22 ++----
packages/game/src/packs/register-core.ts           |  8 +--
.../game/test/convert-resources-real-setup.test.ts |  9 ++-
packages/game/test/determinism-policy.test.ts      |  4 +-
.../test/exp01-controller-grants-no-throw.test.ts  |  4 +-
.../test/exp02-controller-grants-no-throw.test.ts  |  4 +-
packages/game/test/exp02-hotspot-ids.test.ts       |  4 +-
.../test/exp03-controller-grants-no-throw.test.ts  |  4 +-
packages/game/test/golden-replay.test.ts           |  4 +-
packages/game/test/measure-deck-provider.test.ts   |  5 +-
.../game/test/move-assembly-invariants.test.ts     | 11 ++-
packages/game/test/player-view.test.ts             |  9 ++-
packages/game/test/replay-runner.test.ts           |  9 ++-
packages/game/test/server-smoke.test.ts            |  9 ++-
packages/game/test/setup.test.ts                   |  4 +-
packages/game/test/turn.test.ts                    | 20 ++++--
packages/game/test/unplaceable-draw-redraw.test.ts | 10 ++-
21 files changed, 210 insertions(+), 68 deletions(-)
```
- `pnpm -r test`
```
Test Files  30 passed (30)
     Tests  116 passed (116)
```
- `git show -1 --stat`
```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 09:52:46 2026 +0100

    task(0094): wire game moves via packs

- remove core-specific wiring in game factory and move assembly

- register core pack for tests and client entrypoint startup

- update task log with verification outputs

 .../tasks/0094-REF_PACKS-game-wiring-packs-only.md | 121 +++++++++++++++++++--
 packages/client-web/src/game.ts                    |   8 +-
 packages/game/src/index.ts                         |  38 ++++---
 packages/game/src/move-assembly.ts                 |  22 ++--
 packages/game/src/packs/register-core.ts           |   8 +-
 .../game/test/convert-resources-real-setup.test.ts |   9 +-
 packages/game/test/determinism-policy.test.ts      |   4 +-
 .../test/exp01-controller-grants-no-throw.test.ts  |   4 +-
 .../test/exp02-controller-grants-no-throw.test.ts  |   4 +-
 packages/game/test/exp02-hotspot-ids.test.ts       |   4 +-
 .../test/exp03-controller-grants-no-throw.test.ts  |   4 +-
 packages/game/test/golden-replay.test.ts           |   4 +-
 packages/game/test/measure-deck-provider.test.ts   |   5 +-
 .../game/test/move-assembly-invariants.test.ts     |  11 +-
 packages/game/test/player-view.test.ts             |   9 +-
 packages/game/test/replay-runner.test.ts           |   9 +-
 packages/game/test/server-smoke.test.ts            |   9 +-
 packages/game/test/setup.test.ts                   |   4 +-
 packages/game/test/turn.test.ts                    |  20 +++-
 packages/game/test/unplaceable-draw-redraw.test.ts |  10 +-
 21 files changed, 248 insertions(+), 68 deletions(-)
```
