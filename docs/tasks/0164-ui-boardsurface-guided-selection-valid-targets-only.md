# Task 0164 — PG-2: Guided selection — only valid targets advance (invalid clicks are inspect-only)

Status: COMPLETED

## Meta
- Owner: Codex
- Area: BoardSurface guided parameter selection
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S04 (Determinism Guard)
- affected_guardrails: GR-002, GR-005

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Re-check ARCH-06 contract + checklist sections:
   - Guided parameter selection (valid targets only)
   - Invalid tile clicks are inspect-only
3. [x] Baseline scan (no edits yet):
   - `pnpm -C packages/client-web test`

## 1) Goal
Make BoardSurface selection match ARCH-06 for parameter steps:
- In **parameter selection** states, **only valid targets advance** the action flow.
- Clicking an invalid tile is always **inspect-only** (no parameter changes).

This task focuses on the currently leaky case:
- **MoveInfluence source selection** must not pin a source when a non-source tile is clicked.

## 2) Inputs
- Normative contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md` (Section 5)
- Board wiring:
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`
- Existing tests:
  - `packages/client-web/test/start-flow-mode-select.smoke.test.tsx`
  - `packages/client-web/test/selection-inspector.test.tsx`

## 3) Outputs
### 3.1 Code
- Implement "valid targets only" gating **without adding new engine APIs**:
  - In `GameLayout`, wrap the board tile-click handler.
  - When `actionMode === 'moveInfluence'` and no source is pinned yet:
    - determine if the clicked tile is a valid source using the existing `moveInfluenceIntents` list (engine-provided legality).
    - if valid → allow advancing (call the existing selection path that pins source).
    - if invalid → do **inspect-only** selection and **do not** change any move parameters.

Implementation note (expected):
- Today, `controller.selectTile(...)` has MoveInfluence-side effects.
- The fix should be done in **component wiring** so BoardSurface can still update Inspector selection on invalid clicks without triggering those side effects.

### 3.2 Tests
- Add an integration test (recommended new test file):
  - `packages/client-web/test/guided-selection-valid-targets-only.test.tsx`
  - Scenario:
    1) Mock `enumerateLegalIntents` to return MoveInfluence intents with a single valid source tile (e.g. `tile_alpha`).
    2) Enter MoveInfluence mode via the ActionDock button.
    3) Click an **invalid** tile (`tile_gamma`) → the hint must remain "Select source tile".
    4) Click the **valid** source tile (`tile_alpha`) → the hint must switch to "Select target tile".

## 4) Constraints
- GR-002: determine validity only from enumerated legal intents; no new local legality rules.
- GR-005: do not add new actions; only change selection gating.
- Determinism: no time, no randomness.
- Keep changes within UI scope; no engine/rule/spec edits.

## 5) Acceptance Criteria
- [x] Invalid tile clicks during MoveInfluence source selection do not change selection parameters (no source pinned).
- [x] Valid source click advances the flow as before.
- [x] Inspector still updates on invalid clicks (inspect-only behavior preserved).
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/GR-005).
- [x] No engine/rule/spec changes.
- [x] No new commit path introduced.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Created reproduction test `packages/client-web/test/guided-selection-valid-targets-only.test.tsx` which confirmed the bug (invalid tiles advanced flow).
- Modified `useGameInteractionController.ts` to remove the automatic side-effect (pinning source) from `selectTile`.
- Added `selectMoveInfluenceSource` to `InteractionController` interface and implementation.
- Modified `GameLayout.tsx` to wrap `selectTile` and conditionally call `selectMoveInfluenceSource` only when the clicked tile is a valid source (using existing `vm.intents`).
- Verified that invalid clicks now only inspect the tile, while valid clicks inspect AND pin the source.

## 8) Commands Run
- `pnpm -C packages/client-web test` (Baseline passed)
- `pnpm -C packages/client-web test test/guided-selection-valid-targets-only.test.tsx` (Reproduction failed initially, then passed)
- `pnpm lint` (Passed)
- `pnpm -C packages/client-web test` (All tests passed)
