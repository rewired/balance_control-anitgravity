# Codex Task 0132 — Deprecations Wave 1: Migrate off `CoreZoneNames` / `CoreResources`

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0132
- **Owner:** Codex
- **Area:** `packages/game` + tests; expansion engines where applicable
- **Priority:** P1
- **Risk:** Medium (wide but mechanical symbol migration)
- **Branch name:** `task/0132-deprecations-migrate-corezonenames-coreresources`

## 1) Guardrails (frozen)

- **ARCH-01 (State authority + determinism):** no derived caches; no rules changes.
- **GR-003 (Determinism):** keep canonical ordering and deterministic outputs.
- **GR-010 (No Downstream Breakage):** keep types stable for consumers; this is a migration away from deprecated surfaces, not deletion.

## 2) Spec anchors (frozen)

- `ARCH-01-ENGINE-CONTRACT.md` — STATE AUTHORITY, DETERMINISM
- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-010

## 3) Context (frozen)

`@balance-control/rules` still exports deprecated enums `CoreZoneNames` and `CoreResources`. The engine and tests still import and use them.

Newer, non-deprecated equivalents exist:
- `CoreZoneName` (core zones only)
- `CoreResort` (union of 'DOM' | 'FOR' | 'INF')

We want to stop using the deprecated exports throughout the repo, but **not delete them yet** (Wave 2 will do deletion once the migration is proven safe).

## 4) Goal (frozen)

Remove all usage of `CoreZoneNames` / `CoreResources` from engine code and tests, switching to `CoreZoneName` / `CoreResort` (or string literals where appropriate), with no rules behavior change.

## 5) Scope (frozen)

### 5.1 In-scope

- Replace imports and usages in `packages/game/src/*`.
- Replace imports and usages in `packages/game/test/*` and `packages/integration-tests/*`.
- If any expansion engines still import deprecated resources/zones, migrate them too.

### 5.2 Out-of-scope

- Deleting the deprecated exports from `@balance-control/rules`.
- Changing zone ids / resource ids.
- Any move logic or effect semantics changes.

## 6) Plan (frozen)

### Entry criteria

- Task 0131 merged (so config tests and tooling are already updated).

### Steps

1) **Engine migration (`packages/game/src`)**
   - Replace `CoreZoneNames.*` with `CoreZoneName.*`.
   - Replace `CoreResources.DOM/FOR/INF` with `CoreResort`-typed string literals.
   - Keep values identical (these are string-backed ids).

2) **Tests migration**
   - Apply the same substitutions in tests.
   - Ensure golden fixtures (if any) remain unchanged (string values should match exactly).

3) **Repo-wide assertion**
   - Ensure there are **no imports** of `CoreZoneNames` or `CoreResources` outside `packages/rules/src/*`.

### Exit criteria

- All code and tests compile without importing deprecated `CoreZoneNames/CoreResources`.
- Behavior is unchanged (tests still pass).

## 7) Acceptance Criteria (frozen)

- `pnpm -r build` passes.
- `pnpm -r test` passes.
- `grep -R "\bCoreZoneNames\b" packages | grep -v "packages/rules/src"` has **no matches**.
- `grep -R "\bCoreResources\b" packages | grep -v "packages/rules/src"` has **no matches**.

## 8) Files likely touched (frozen)

- `packages/game/src/index.ts`
- `packages/game/src/engine/legal-intents.ts`
- `packages/game/src/mechanics*.ts`
- `packages/game/src/moves/*`
- `packages/game/src/packs/core/index.ts`
- `packages/game/test/*`
- `packages/integration-tests/test/smoke.test.ts`
- `packages/expansion-01/src/engine/index.ts` (if still importing `CoreResources` only)

## 9) Notes / hazards (frozen)

- This is a **symbol-only migration**. If a change requires changing a string literal, stop: that’s no longer a deprecation migration.
- Prefer `CoreZoneName` for core zones; do not invent new shared enums for expansion zones.

## 10) PR Checklist (to be completed before merge)

- [x] Build passes (`pnpm -r build`)
- [x] Tests pass (`pnpm -r test`)
- [x] Repo grep confirms no deprecated usage outside rules
- [x] No rules behavior change (only symbols)
- [x] Determinism preserved (no ordering changes)

## 11) Work Summary (fill after implementation)

- Migrated all `CoreZoneNames` references to `CoreZoneName` in `packages/game/src` and `packages/game/test`.
- Migrated all `CoreResources` references to string literals or `CoreResort` in `packages/game`.
- Updated `packages/expansion-03/src/engine/index.ts` to fix broken build caused by missing deprecated constants (replaced with `CoreZoneName` and string literals).
- Verified no remaining usages of deprecated enums outside of their definitions in `packages/rules` and documentation.
- Verified build and tests pass for all packages.

## 12) Commands Run (fill after implementation)

- `grep -r "CoreZoneNames" packages` (verified no matches outside rules)
- `grep -r "CoreResources" packages` (verified no matches outside rules)
- `pnpm -r build` (passed)
- `pnpm -r test` (passed)

## 13) Postflight (fill after implementation)

- See commit message.

## 14) Patch Notes (fill after implementation)

- 

## 15) Downstream follow-ups

- Wave 2: delete deprecated exports from `@balance-control/rules` once proven unused.
