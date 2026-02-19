# Codex Task 0138 — Deprecations Wave 3: Delete `CoreZoneNames` / `CoreResources` legacy exports

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0138
- **Owner:** Codex
- **Area:** `@balance-control/rules` public API cleanup
- **Priority:** P1
- **Risk:** Medium (public API removal; expected safe due to prior repo-wide migration)
- **Branch name:** `task/0138-deprecations-remove-corezonenames-coreresources`

## 1) Guardrails (frozen)

- **GR-003 (Determinism):** no runtime behavior changes.
- **GR-010 (No Downstream Breakage):** remove only symbols proven unused repo-wide; keep replacements (`CoreZoneName`, `CoreResort`).
- **ARCH-01 (Engine authority):** no rules logic moves to client; this is types-only.

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-010
- `docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md` — infrastructure symbols must be documented without inventing `@rule` anchors
- Task 0132 (migration): `docs/tasks/0132-deprecations-migrate-corezonenames-coreresources.md`

## 3) Context (frozen)

`@balance-control/rules` still exports two deprecated enums:
- `CoreZoneNames` (legacy + expansion zone leakage)
- `CoreResources` (legacy + expansion resource leakage)

Task 0132 migrated engine/tests off these symbols. At this point they appear to remain only as dead-compat exports.

We now want to delete them to finish the deprecation cycle.

## 4) Goal (frozen)

- Remove `CoreZoneNames` and `CoreResources` exports from `@balance-control/rules`.
- Preserve canonical replacements:
  - `CoreZoneName` (core-only zones)
  - `CoreResort` (union of 'DOM' | 'FOR' | 'INF')
- Keep behavior identical (this is API cleanup; no rules/engine semantics).

## 5) Scope (frozen)

### 5.1 In-scope

- `packages/rules/src/zones.ts`: delete `CoreZoneNames` enum.
- `packages/rules/src/resources.ts`: delete `CoreResources` enum.
- Ensure public exports remain coherent (`packages/rules/src/index.ts` re-exports files; keep as-is unless it becomes misleading).
- Update docs:
  - `docs/changelog.md` add an Unreleased entry for the removal.
  - `docs/hand-off/current.md` update the snapshot after completion.

### 5.2 Out-of-scope

- Any rule changes in `/docs/rules/*`.
- Any engine logic changes.
- Any new compatibility layer.

## 6) Plan (frozen)

### Entry criteria

- Task 0137 merged.
- Repo currently builds/tests green.

### Steps

1) **Assert the symbols are unused**
   - Run:
     - `grep -R "\\bCoreZoneNames\\b" packages | grep -v "packages/rules/src"` (must be empty)
     - `grep -R "\\bCoreResources\\b" packages | grep -v "packages/rules/src"` (must be empty)

2) **Delete the legacy exports**
   - Remove `CoreZoneNames` from `packages/rules/src/zones.ts`.
   - Remove `CoreResources` from `packages/rules/src/resources.ts`.
   - Keep `CoreZoneName`, `CoreResort`, and other exports intact.

3) **Update docs**
   - Add an Unreleased bullet to `docs/changelog.md` noting the removal.
   - Update `docs/hand-off/current.md`:
     - Current state: remove the "deprecated exports still exist" bullet.
     - Next packet goal: advance to the next sensible cleanup.

4) **Build + tests**
   - `pnpm -r build`
   - `pnpm -r test`

### Exit criteria

- No `CoreZoneNames` / `CoreResources` symbol exists in `@balance-control/rules`.
- Build + tests remain green.

## 7) Acceptance Criteria (frozen)

- `pnpm -r build` passes.
- `pnpm -r test` passes.
- Grep confirms no remaining references:
  - `grep -R "\\bCoreZoneNames\\b" packages` → no matches
  - `grep -R "\\bCoreResources\\b" packages` → no matches
- `docs/changelog.md` contains an Unreleased note about the removal.

## 8) Files likely touched (frozen)

- `packages/rules/src/zones.ts`
- `packages/rules/src/resources.ts`
- `docs/changelog.md`
- `docs/hand-off/current.md`

## 9) Notes / hazards (frozen)

- This is a **public API removal** in `@balance-control/rules`. The mitigation is the prior migration (Task 0132) and the repo-wide greps.
- Do **not** replace the removed enums with a new mega-enum. The whole point was to stop leaking expansion identifiers from core types.

## 10) PR Checklist (to be completed before merge)

- [x] Grep confirms no usage outside `packages/rules/src/*`
- [x] Deleted `CoreZoneNames` and `CoreResources`
- [x] Build passes (`pnpm -r build`)
- [x] Tests pass (`pnpm -r test`)
- [x] `docs/changelog.md` updated
- [x] `docs/hand-off/current.md` updated

## 11) Work Summary (fill after implementation)

- Verified zero usage of `CoreZoneNames` and `CoreResources` outside of their definitions using `grep`.
- Removed `CoreZoneNames` enum from `packages/rules/src/zones.ts`.
- Removed `CoreResources` enum from `packages/rules/src/resources.ts`.
- Updated `docs/changelog.md` with the removal note.
- Updated `docs/hand-off/current.md` to reflect the completed task and updated state.
- Verified build and tests pass.

## 12) Commands Run (fill after implementation)

- `grep -r "CoreZoneNames" packages | grep -v "packages/rules/src"` (Clean)
- `grep -r "CoreResources" packages | grep -v "packages/rules/src"` (Clean)
- `pnpm -r build` (Passed)
- `pnpm -r test` (Passed)
- `git status -sb` (Clean)

## 13) Postflight (fill after implementation)

- See commit message.

## 14) Patch Notes (fill after implementation)

- **API Breaking Change**: Removed deprecated `CoreZoneNames` and `CoreResources` from `@balance-control/rules`. Use `CoreZoneName` and `CoreResort` (or `ResourceId`) instead.

## 15) Downstream follow-ups

- If any external consumer still relies on these enums, re-introduce them only as a separate compatibility package (not in `@balance-control/rules`).
