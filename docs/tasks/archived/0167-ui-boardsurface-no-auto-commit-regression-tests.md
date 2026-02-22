# Task 0167 — PG-2: BoardSurface no-auto-commit regression tests (ghost placement + skip placement)

Status: COMPLETE

## Meta
- Owner: Codex
- Area: Regression safety for “draft then confirm”
- Packages: `packages/client-web`
- Skills: S04 (Determinism Guard), S08 (PR Hygiene)
- affected_guardrails: GR-005

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Re-check ARCH-06 checklist:
   - No Auto-Commit
   - Single Commit Path
3. [x] Baseline tests:
   - `pnpm -C packages/client-web test`

## 1) Goal
Lock in the “no auto-commit” behavior with integration tests so future UI refactors cannot silently reintroduce:
- Ghost placement committing immediately.
- Skip placement committing immediately.

## 2) Inputs
- Contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md` (Sections 1–2)
- Existing tests for patterns:
  - `packages/client-web/test/tile-placement-ux.test.tsx`
  - `packages/client-web/test/public-notice-unplaceable.test.tsx`

## 3) Outputs
### 3.1 Tests
- Add a new integration test file:
  - `packages/client-web/test/no-auto-commit-board-surface.test.tsx`

Test cases:
1) **Ghost placement is draft-only**
   - Setup: stage `drawAndPlace`, enumerateLegalIntents returns a `placeTile` intent for a ghost coord.
   - Click ghost → assert `moves.placeTile` NOT called.
   - Click `Confirm` in ActionDock → assert `moves.placeTile` called exactly once.

2) **Skip placement is draft-only**
   - Setup: stage `drawAndPlace`, enumerateLegalIntents returns `passTilePlacement`.
   - Click “Skip placement” → assert `moves.passTilePlacement` NOT called.
   - Click `Confirm` → assert called exactly once.

Optional (if easy):
3) While `draftReady`, further board clicks do not change which intent is confirmed.

## 4) Constraints
- Do not introduce new UI code paths; tests only.
- Stable ordering in mocks and assertions.

## 5) Acceptance Criteria
- [x] Tests fail if ghost placement or skip placement ever auto-commit.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-005).
- [x] No engine/rule/spec changes.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Created `packages/client-web/test/no-auto-commit-board-surface.test.tsx`.
- Mocked `@balance-control/game` to control `enumerateLegalIntents` for testing.
- Implemented test case for Ghost placement ensuring it requires confirmation.
- Implemented test case for Skip placement ensuring it requires confirmation.
- Implemented test case for `draftReady` stability (inspect-only mode when draft is ready).
- Polyfilled `ResizeObserver` to support `react-zoom-pan-pinch` in test environment.

## 8) Commands Run
- `pnpm -C packages/client-web test` (baseline)
- `pnpm -C packages/client-web test test/no-auto-commit-board-surface.test.tsx` (verification)
