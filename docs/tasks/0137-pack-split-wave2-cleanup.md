# Codex Task 0137 — PACK SPLIT Wave 2: Cleanup legacy exports and EnginePackRegistry

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0137
- **Owner:** Codex
- **Area:** `packages/game` cleanup, `EnginePackRegistry`
- **Priority:** P1
- **Risk:** Medium (cleanup and API removal)
- **Branch name:** `task/0137-pack-split-wave2-cleanup`

## 1) Guardrails (frozen)

- **GR-001 (Engine State Authority):** engine remains authoritative.
- **GR-002 (Engine-only Rule Execution):** no rules logic in client; registry stays engine-side.
- **GR-003 (Determinism Contract):** registry ordering must remain canonical.
- **GR-010 (No Downstream Breakage):** ensure removals are safe (usage was migrated).

## 2) Spec anchors (frozen)

- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-010
- `ARCH-01-ENGINE-CONTRACT.md` — Pack registration contract

## 3) Context (frozen)

Task 0136 removed the hard dependencies from `packages/game` to expansion packages.
Now we need to perform "Wave 2" cleanup:
- Remove deprecated APIs that were kept for migration safety (e.g., `EnginePackRegistry.getMeasureAtoms`).
- Verify `EnginePackRegistry` is truly generic and decoupled.
- Ensure no lingering "shim" exports remain.

## 4) Goal (frozen)

- Delete `EnginePackRegistry.getMeasureAtoms(...)` (deprecated).
- Verify `EnginePackRegistry` implementation is generic (does not hardcode expansion logic beyond canonical ID lists).
- Ensure `packages/game` exports are clean.

## 5) Scope (frozen)

### 5.1 In-scope

- `packages/game/src/expansion-registry.ts`:
  - Remove `getMeasureAtoms(...)`.
  - Remove any legacy shims.
- `packages/game/src/index.ts`:
  - Verify exports.
- `packages/game/test/*`:
  - Ensure tests don't use removed APIs (should be done in 0133, but verify).

### 5.2 Out-of-scope

- Moving `EnginePackRegistry` to another package (unless strictly necessary to break a cycle). Current analysis suggests it belongs in `game` as the "kernel" registry.

## 6) Plan (frozen)

### Entry criteria

- Task 0136 merged.

### Steps

1.  **Remove deprecated `getMeasureAtoms`**
    - Delete the method from `EnginePackRegistry` class.
    - Verify no internal usage remains.

2.  **Audit `EnginePackRegistry` for coupling**
    - Check `resolveFlags` (is it generic enough?).
    - Check `applyProductionModifiers` (does it hardcode logic?).
    - If logic is generic (iterating IDs), it is fine.

3.  **Verify decoupling**
    - Run `grep` to ensure no `@balance-control/expansion-*` imports remain in `packages/game`.
    - Run build and tests.

### Exit criteria

- `EnginePackRegistry` is clean and does not expose deprecated APIs.
- Build and tests pass.

## 7) Acceptance Criteria (frozen)

- `pnpm -r build` passes.
- `pnpm -r test` passes.
- `getMeasureAtoms` is gone.

## 8) Files likely touched (frozen)

- `packages/game/src/expansion-registry.ts`

## 9) Notes / hazards (frozen)

- `EnginePackRegistry` is a singleton used by `packages/game` internals.

## 10) PR Checklist (to be completed before merge)

- [x] Build passes (`pnpm -r build`)
- [x] Tests pass (`pnpm -r test`)
- [x] Deprecated APIs removed
- [x] No new coupling introduced

## 11) Work Summary (fill after implementation)

- Removed deprecated `EnginePackRegistry.getMeasureAtoms` method.
- Verified `packages/game` contains no imports from `@balance-control/expansion-*`.
- Verified `EnginePackRegistry` relies only on canonical ID lists (`CANONICAL_ENGINE_MODULE_ORDER`) and generic iteration, with no expansion-specific logic coupling.
- Confirmed `packages/game/src/index.ts` exports are clean.
- Updated `docs/hand-off/current.md` to reflect decoupled state.

## 12) Commands Run (fill after implementation)

- `pnpm -r build` (passed)
- `pnpm -r test` (passed)
- `grep -r "@balance-control/expansion-" packages/game/src` (no matches)

## 13) Postflight (fill after implementation)

- Verified build and tests are green.
- Confirmed decoupling is complete.

## 14) Patch Notes (fill after implementation)

- Removed deprecated `EnginePackRegistry.getMeasureAtoms`.
- Confirmed `packages/game` is fully decoupled from expansion packages.

## 15) Downstream follow-ups

- Wave 3: Remove `CoreZoneNames` / `CoreResources` deprecated exports from `@balance-control/rules`.
