# Codex Task 0136 — PACK SPLIT: Drop `@balance-control/game -> @balance-control/expansion-*` deps; move EXP pack wrappers into `@balance-control/packs`

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0136
- **Owner:** Codex
- **Area:** `packages/game` public surface + deps, `packages/packs` pack wrappers
- **Priority:** P1
- **Risk:** High (public API surface change; must keep repo green)
- **Branch name:** `task/0136-game-drop-expansion-dependencies-and-move-exp-packs-to-packs-package`

## 1) Guardrails (frozen)

- **GR-001 (Engine State Authority):** engine remains authoritative; no state shape changes.
- **GR-002 (Engine-only Rule Execution):** pack code may live outside `packages/game`, but execution remains engine-owned.
- **GR-003 (Determinism Contract):** canonical ordering must not drift.
- **GR-012 (Match Config is Canonical):** enablement still flows through `packs.enabledPacks`.

## 2) Spec anchors (frozen)

- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-001, GR-002, GR-003, GR-012
- `ARCH-01-ENGINE-CONTRACT.md` — pack execution + registration contracts
- `ARCH-04-LLM-BOT-CONTRACT.md` — (indirect) stable public surface hashing for bots/tools

## 3) Context (frozen)

With Option 2 selected, rule code may live in pack packages.

Right now `@balance-control/game` still:

- depends on `@balance-control/expansion-01..03` in `packages/game/package.json`, and
- exports `Exp01Pack/Exp02Pack/Exp03Pack` implemented in `packages/game/src/packs/exp0*`.

That hard dependency blocks clean pack extraction and makes engine reuse harder.

After Task 0134 we have `@balance-control/packs` as the canonical import surface for pack sets, and after Task 0135 the game test suite is pack-agnostic.

Now we can remove the hard dependency and relocate the EXP pack wrappers.

## 4) Goal (frozen)

- Remove all `@balance-control/expansion-*` dependencies from `@balance-control/game`.
- Delete/stop exporting `Exp01Pack/Exp02Pack/Exp03Pack` from `@balance-control/game`.
- Implement those pack wrappers inside `@balance-control/packs` instead (import `Expansion01/02/03` engine definitions from the expansion packages).
- Keep build/tests green across the monorepo.

## 5) Scope (frozen)

### 5.1 In-scope

- `packages/game`:
  - Remove dependencies on `@balance-control/expansion-01..03`.
  - Remove `src/packs/exp01|exp02|exp03` pack wrapper modules.
  - Remove public exports of `Exp01Pack/Exp02Pack/Exp03Pack`.

- `packages/packs`:
  - Stop re-exporting expansion packs from `@balance-control/game`.
  - Define and export `Exp01Pack/Exp02Pack/Exp03Pack` directly by wrapping `Expansion01/02/03`.

### 5.2 Out-of-scope

- Any changes to expansion rule behavior, measure atoms, effect handlers.
- Any UI changes beyond import rewiring already done in 0134.
- Deleting the deprecated `EnginePackRegistry.getMeasureAtoms(...)` API.

## 6) Plan (frozen)

### Entry criteria

- Task 0134 merged (`@balance-control/packs` adopted by consumers).
- Task 0135 merged (game tests no longer rely on real expansion packs).

### Steps

1) **Move pack wrappers to `@balance-control/packs`**
   - In `packages/packs/src/index.ts` (or `src/exp01.ts` etc):
     - Import `Expansion01` from `@balance-control/expansion-01/engine` (same for 02/03).
     - Import `RULESET_MANIFEST` from `@balance-control/rules`.
     - Import `EnginePackDefinition` type from `@balance-control/game` (or a dedicated type-only entrypoint if already available).
     - Recreate the wrapper shape currently in `packages/game/src/packs/exp0*/index.ts`.
   - Keep manifest calculation deterministic.

2) **Remove expansion pack modules from `packages/game`**
   - Delete:
     - `packages/game/src/packs/exp01/*`
     - `packages/game/src/packs/exp02/*`
     - `packages/game/src/packs/exp03/*`
   - Update `packages/game/src/index.ts` exports:
     - Remove `export { Exp01Pack } ...` etc.

3) **Drop `@balance-control/game` deps on expansions**
   - In `packages/game/package.json`: remove `@balance-control/expansion-01..03` from `dependencies`.
   - Ensure `pnpm -C packages/game build` succeeds.

4) **Update remaining internal references**
   - Search the repo for any imports of `Exp0xPack` from `@balance-control/game`.
   - Migrate them to `@balance-control/packs`.
   - Ensure scripts and integration-tests remain correct.

### Exit criteria

- `@balance-control/game` has no dependency edges to `@balance-control/expansion-*`.
- All real-pack consumers import packs from `@balance-control/packs`.

## 7) Acceptance Criteria (frozen)

- `pnpm -r build` passes.
- `pnpm -r test` passes.
- `cat packages/game/package.json | grep "@balance-control/expansion-"` has **no matches**.
- `grep -R "from '@balance-control/expansion-" packages/game/src` has **no matches**.
- `grep -R "Exp0[123]Pack" packages/game/src/index.ts` has **no matches**.

## 8) Files likely touched (frozen)

- `packages/packs/src/*`
- `packages/game/package.json`
- `packages/game/src/index.ts`
- `packages/game/src/packs/*` (remove exp0* directories)
- any remaining import sites in `packages/server`, `packages/client-web`, `scripts`, `packages/integration-tests`
- `/docs/hand-off/current.md`

## 9) Notes / hazards (frozen)

- If `@balance-control/packs` needs pack helper moves (e.g. measure moves), keep them local or import from a non-game package to avoid reintroducing coupling.
- Do not introduce import-time registration.

## 10) PR Checklist (to be completed before merge)

- [x] Build passes (`pnpm -r build`)
- [x] Tests pass (`pnpm -r test`)
- [x] No rules changes (SPEC-anchored)
- [x] `@balance-control/game` no longer depends on `@balance-control/expansion-*`
- [x] All consumers import packs from `@balance-control/packs`
- [x] Updated docs/hand-off/current.md

## 11) Work Summary (fill after implementation)

- Moved pack wrappers (`Exp01Pack`, `Exp02Pack`, `Exp03Pack`) from `packages/game` to `packages/packs`.
- Updated `packages/packs/src/index.ts` to export the new pack wrappers.
- Removed `packages/game/src/packs/exp0*` and `packages/game/src/packs/_shared/measure-moves.ts`.
- Removed `@balance-control/expansion-*` dependencies from `packages/game/package.json`.
- Updated `packages/game/src/index.ts` to export internal APIs (`EffectResolver`, `lookupMeasureDeckForObjectId`, etc.) needed by `packages/packs`.
- Updated `packages/bot-llm/src/boot.ts` and `packages/game/test/entrypoint-pack-wiring.test.ts` to use `registerCanonicalPacks` from `@balance-control/packs`.

## 12) Commands Run (fill after implementation)

- `pnpm -r build`
- `pnpm -r test`

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-

## 15) Downstream follow-ups

- Once all external usage is migrated, consider deprecating/removing any remaining legacy pack exports or config aliases.
