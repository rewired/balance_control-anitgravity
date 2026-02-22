# Task 0212 — PG-7: Move ActionDock to a full-width bottom row (never occlude board targets)

Status: DRAFT

## Meta
- Owner: Codex
- Area: Layout / board visibility
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Re-check the UI interaction contract + checklist:
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
3. [x] Baseline scan (no edits yet):
   - `rg -n "controls-container|game-layout|left-panel|right-panel" packages/client-web/src`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Fix the core usability issue: the ActionDock must not compete with the board.
- The ActionDock must be rendered **below** the board, spanning the full app width.
- The board viewport must always have a clean, uninterrupted interaction surface (no overlay, no occlusion).
- Keep behavior unchanged (no interaction redesign, no new actions).

## 2) Inputs
- Current layout:
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/index.css` (`.game-layout`, `.center-panel`, `.controls-container`)
- Dock:
  - `packages/client-web/src/components/ActionDock.tsx`
- Board surface:
  - `packages/client-web/src/components/BoardViewport.tsx`
  - `packages/client-web/src/components/HexBoard.tsx`

## 3) Outputs
### 3.1 Code
- Update `GameLayout.tsx` to render ActionDock in a dedicated layout slot **outside** the center board panel:
  - Suggested DOM structure:
    - Row 1: left-panel | center(board) | right-panel
    - Row 2: action-dock (spans all columns)
- Update `index.css` grid:
  - `grid-template-rows: 1fr auto;`
  - Ensure the dock row has stable padding and does not force the board to overflow/clip unexpectedly.
- Ensure PendingChoice behavior remains contract-compliant:
  - When `vm.hasPendingChoice`, the dock remains hidden (existing behavior) unless ARCH-06 requires a hard-gate dock surface (do not invent behavior in this task).

### 3.2 Tests
- Adjust any UI tests that assume the dock lives inside `.center-panel`.
- Add one focused test (or update existing):
  - Dock exists and is outside the board panel container.
  - No change in commit path semantics.

### 3.3 Files touched
- `packages/client-web/src/components/GameLayout.tsx`
- `packages/client-web/src/index.css`
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- Engine authority (GR-002): layout changes must not compute legality, costs, majority, or effects.
- No phantom moves (GR-005): no new buttons like “End turn” or “Pass action”.
- Pending choice gate (GR-006): do not accidentally re-enable normal actions while pendingChoice exists.
- No new overlays that capture clicks over the board.

## 5) Acceptance Criteria
- [x] ActionDock is rendered below the board, spanning full width.
- [x] No element of the dock visually or interactively occludes board targets (place ghosts, move/target highlights).
- [x] Pan/zoom controls remain usable and not overlapped by the dock.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/005/006).
- [x] No engine/rule/spec changes.
- [x] No new commit shortcuts / auto-commit.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Modified `GameLayout.tsx` to remove `ActionDock` from `center-panel` and place it in a new full-width row in `.game-layout`.
- Updated `index.css` to change `.game-layout` grid to `1fr auto` and set `.controls-container` to `grid-column: 1 / -1`.
- Added `packages/client-web/test/dock-layout.test.tsx` to verify that `ActionDock` (via `.controls-container`) is rendered outside `.center-panel`.
- Verified all tests pass.

## 8) Commands Run
- `pnpm -C packages/client-web test` (baseline & verification)
- `rg -n "controls-container|game-layout|left-panel|right-panel" packages/client-web/src` (baseline scan)
