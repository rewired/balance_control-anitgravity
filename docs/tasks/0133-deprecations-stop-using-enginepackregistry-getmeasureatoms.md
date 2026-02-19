# Codex Task 0133 — Deprecations Wave 1: Stop using `EnginePackRegistry.getMeasureAtoms(...)`

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0133
- **Owner:** Codex
- **Area:** `packages/game` tests
- **Priority:** P2
- **Risk:** Low (test-only change)
- **Branch name:** `task/0133-deprecations-stop-using-enginepackregistry-getmeasureatoms`

## 1) Guardrails (frozen)

- **GR-003 (Determinism):** tests must remain deterministic.
- **GR-010 (No Downstream Breakage):** Wave 1 means “no deletions”; we only remove usage.

## 2) Spec anchors (frozen)

- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-010
- `ARCH-02-STATE-SHAPE.md` — avoid accidental state changes (test-only task)

## 3) Context (frozen)

The engine registry still exposes a deprecated convenience API `EnginePackRegistry.getMeasureAtoms(...)`. The canonical routing hook is `getMeasureAtomsForExpansion(expansionId, measureId, ...)`.

We want to stop using the deprecated API in tests (Wave 1), then delete it later (Wave 2) without surprise breakage.

## 4) Goal (frozen)

Update tests to use only `EnginePackRegistry.getMeasureAtomsForExpansion(...)` (and/or enabled-pack assembly) and remove all direct calls to deprecated `EnginePackRegistry.getMeasureAtoms(...)`.

## 5) Scope (frozen)

### 5.1 In-scope

- Update test(s) that call `EnginePackRegistry.getMeasureAtoms(...)`.
- Keep the deprecated method in place (no deletion in this task).

### 5.2 Out-of-scope

- Removing the deprecated method.
- Changing measure atom behavior.

## 6) Plan (frozen)

### Entry criteria

- Task 0131 merged (config canonicalization) and Task 0132 merged (CoreZoneNames/CoreResources migration).

### Steps

1) Locate all usages of `EnginePackRegistry.getMeasureAtoms(`.
2) Update the relevant test(s) to assert isolation via:
   - `EnginePackRegistry.getEnabledPacks(..., config)` excluding the pack; and
   - `EnginePackRegistry.getMeasureAtomsForExpansion(expansionId, measureId, ...)` throwing for disabled/unregistered packs.
3) Add a small “grep guard” inside the test suite (optional): a single test that asserts the deprecated symbol is not referenced from `packages/game/test` anymore.

### Exit criteria

- No test uses `EnginePackRegistry.getMeasureAtoms(...)`.

## 7) Acceptance Criteria (frozen)

- `pnpm -C packages/game test` passes.
- `grep -R "EnginePackRegistry\.getMeasureAtoms\(" packages/game/test` has **no matches**.

## 8) Files likely touched (frozen)

- `packages/game/test/pack-disablement-isolation.test.ts`

## 9) Notes / hazards (frozen)

- Keep the intent of the test: ensure disabled packs cannot leak atoms.
- Prefer asserting on the canonical API (`getMeasureAtomsForExpansion`).

## 10) PR Checklist (to be completed before merge)

- [x] `pnpm -C packages/game test` passes
- [x] No deprecated API usage remains in tests
- [x] No rules behavior change

## 11) Work Summary (fill after implementation)

- Identified usage of deprecated `EnginePackRegistry.getMeasureAtoms` in `packages/game/test/pack-disablement-isolation.test.ts`.
- Updated `pack-disablement-isolation.test.ts` to use `EnginePackRegistry.getMeasureAtomsForExpansion` and verified it throws for disabled packs, ensuring isolation.
- Verified no other tests use the deprecated API (excluding direct implementation calls in `Expansion01`).

## 12) Commands Run (fill after implementation)

- `grep -r "getMeasureAtoms" packages/game`
- `pnpm -C packages/game test`

## 13) Postflight (fill after implementation)

- 

## 14) Patch Notes (fill after implementation)

- 

## 15) Downstream follow-ups

- Wave 2: delete `EnginePackRegistry.getMeasureAtoms(...)` once all usage is gone.
