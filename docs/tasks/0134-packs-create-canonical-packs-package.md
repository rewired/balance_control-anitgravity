# Codex Task 0134 — PACKS: Create `@balance-control/packs` canonical pack entrypoint

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0134
- **Owner:** Codex
- **Area:** monorepo wiring (`packages/*`), pack registration UX
- **Priority:** P1
- **Risk:** Medium (touches imports/boot paths; no rules changes)
- **Branch name:** `task/0134-packs-create-canonical-packs-package`

## 1) Guardrails (frozen)

- **GR-002 (Engine-only Rule Execution):** this is wiring only; no client-side rule logic.
- **GR-003 (Determinism Contract):** keep canonical ordering; no import-time side effects.
- **GR-012 (Match Config is Canonical):** keep `packs.enabledPacks` as the only runtime enablement surface.

## 2) Spec anchors (frozen)

- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-002, GR-003, GR-012
- `ARCH-01-ENGINE-CONTRACT.md` — pack registration is explicit; engine stays authoritative

## 3) Context (frozen)

Right now, **every consumer** (server, client-web, scripts) imports `CorePack/Exp01Pack/Exp02Pack/Exp03Pack` from `@balance-control/game` and re-implements the same “register if missing” boilerplate.

We are about to remove the hard dependency `@balance-control/game -> @balance-control/expansion-*` (Option 2 pack split). Before we do that, we need a **single canonical place** that:

- exports the “known pack set” (Core + EXP-01..03), and
- offers a tiny helper to register them deterministically.

This task introduces `@balance-control/packs` as that canonical entrypoint.

## 4) Goal (frozen)

- Add a new workspace package `@balance-control/packs` that exports `{ CorePack, Exp01Pack, Exp02Pack, Exp03Pack }` and a helper `registerCanonicalPacks(registry?: typeof EnginePackRegistry)`.
- Migrate consumers to use `@balance-control/packs` (no more importing packs from `@balance-control/game`).
- Keep registration **explicit** (no side effects on module import).

## 5) Scope (frozen)

### 5.1 In-scope

- Create `packages/packs` (TS build + exports).
- Move the “register packs if missing” boilerplate into `registerCanonicalPacks(...)`.
- Update these call sites to use the new package:
  - `packages/server/src/boot.ts`
  - `packages/client-web/src/game.ts`
  - `scripts/verify-packs.mjs`
  - `packages/integration-tests/test/*`

### 5.2 Out-of-scope

- Removing pack exports from `@balance-control/game`.
- Removing `@balance-control/game` dependencies on `@balance-control/expansion-*`.
- Any rules/engine behavior change.

## 6) Plan (frozen)

### Entry criteria

- HEAD builds/tests green.

### Steps

1) **Create package skeleton**
   - Add `packages/packs/package.json`, `tsconfig.json`, `src/index.ts`.
   - Package exports:
     - `CorePack` re-exported from `@balance-control/game`.
     - `Exp01Pack/Exp02Pack/Exp03Pack` re-exported from `@balance-control/game` (for now; will change after pack split).
     - `registerCanonicalPacks()`.

2) **Implement `registerCanonicalPacks()`**
   - Behavior:
     - Determine current registered ids via `EnginePackRegistry.getRegisteredPacks()`.
     - Register missing packs in **canonical engine module order** (`CANONICAL_ENGINE_MODULE_ORDER`).
   - Constraints:
     - No module-level auto-registration.
     - Idempotent: calling it twice changes nothing.

3) **Migrate consumers**
   - `packages/server/src/boot.ts`: replace local logic with `registerCanonicalPacks()`.
   - `packages/client-web/src/game.ts`: same.
   - `scripts/verify-packs.mjs`: import packs from `@balance-control/packs` and call `registerCanonicalPacks()`.
   - `packages/integration-tests/test/*`: import packs from `@balance-control/packs`.

4) **Config surface cleanup in integration tests**
   - Replace `setupData.expansions` usage with `setupData.packs.enabledPacks` in integration-tests.
   - Keep `cfg.expansions` acceptance only as a legacy input (normalization), but tests should exercise the canonical path.

### Exit criteria

- No consumer imports `Exp01Pack/Exp02Pack/Exp03Pack` from `@balance-control/game` anymore.
- All pack registration boilerplate is gone from server/client-web/scripts.

## 7) Acceptance Criteria (frozen)

- `pnpm -r build` passes.
- `pnpm -r test` passes.
- `grep -R "from '@balance-control/game'" packages/server/src/boot.ts packages/client-web/src/game.ts scripts/verify-packs.mjs packages/integration-tests/test | grep -E "CorePack|Exp0"` has **no matches**.
- `registerCanonicalPacks()` is idempotent and registers packs in deterministic canonical order.

## 8) Files likely touched (frozen)

- `packages/packs/*` (new)
- `packages/server/src/boot.ts`
- `packages/client-web/src/game.ts`
- `scripts/verify-packs.mjs`
- `packages/integration-tests/test/smoke.test.ts`

## 9) Notes / hazards (frozen)

- Do not change pack semantics; only refactor imports and registration.
- Keep the helper small; no "magic" global initialization.

## 10) PR Checklist (to be completed before merge)

- [x] Build passes (`pnpm -r build`)
- [x] Tests pass (`pnpm -r test`)
- [x] No rules changes (SPEC-anchored)
- [x] Registration remains explicit + deterministic
- [x] Updated docs/hand-off/current.md if any decision/fact changed

## 11) Work Summary (fill after implementation)

- Created `@balance-control/packs` with `registerCanonicalPacks()` helper.
- Migrated server, client-web, scripts, and integration tests to use `@balance-control/packs`.
- Removed manual pack registration boilerplate from consumers.
- Verified that no consumer imports packs directly from `@balance-control/game` (except `packs` package itself).
- Integration tests updated to use `setupData.packs.enabledPacks`.

## 12) Commands Run (fill after implementation)

- `pnpm -r build`
- `pnpm -r test`
- `node scripts/verify-packs.mjs`
- `grep -r "from '@balance-control/game'" packages/server/src/boot.ts packages/client-web/src/game.ts scripts/verify-packs.mjs packages/integration-tests/test | grep -E "CorePack|Exp0"`

## 13) Postflight (fill after implementation)

- See commit message.

## 14) Patch Notes (fill after implementation)

- **New Package:** `@balance-control/packs` is now the canonical entrypoint for pack registration.
- **Breaking Change (Internal):** Consumers should import packs from `@balance-control/packs` instead of `@balance-control/game`.
- **Refactor:** Simplified pack registration in server and client-web.

## 15) Downstream follow-ups

- Task 0135: move real-pack tests out of `packages/game` and make engine tests pack-agnostic.
- Task 0136: remove `@balance-control/game -> @balance-control/expansion-*` dependencies and stop exporting Exp packs from `@balance-control/game`.
