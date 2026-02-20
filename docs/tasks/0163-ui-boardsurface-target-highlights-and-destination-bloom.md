# Task 0163 — PG-2: BoardSurface target highlighting + destination-step player-color bloom

Status: DRAFT

## Meta
- Owner: Codex
- Area: BoardSurface guided selection (visual affordances)
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S04 (Determinism Guard)
- affected_guardrails: GR-002, GR-005

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Read `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` and `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`.
3. [x] Baseline scan (no edits yet):
   - `grep -RIn "hex-cell-target" packages/client-web/src` (should find class usage but no CSS)
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Add the **minimum required visual affordances** for guided selection:
- Valid board targets are visibly highlighted.
- When choosing a **destination step** (MoveInfluence after a source is pinned), valid destinations get a subtle **active-player-color bloom**.

No interaction semantics change in this task (purely visual + prop plumbing).

## 2) Inputs
- Normative UX requirements:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md` (Section 10)
- Board components:
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`
  - `packages/client-web/src/components/GameLayout.tsx` (prop wiring only)
- Styles:
  - `packages/client-web/src/index.css`

## 3) Outputs
### 3.1 Code
- `HexBoard` applies explicit classes/attributes for guided-selection states:
  - `hex-cell-target` for any valid selectable tile (source/target)
  - `hex-cell-target-destination` for MoveInfluence destination step only
- `GameLayout` passes active player seat (or a CSS color token) down to `HexBoard` so CSS can implement seat-colored bloom.
  - Keep this presentation-only; do not compute legality.

### 3.2 CSS
- Add styles to `index.css`:
  - `.hex-cell-target::after` highlight ring (subtle, non-distracting)
  - `.hex-cell-target-destination::after` bloom using active player seat color
  - Ensure these styles do **not** override `.hex-cell-selected` (selected must remain the strongest signal).

### 3.3 Tests
- Add/adjust a focused unit test:
  - `packages/client-web/test/Board.test.tsx` (or a new `hex-target-highlights.test.tsx`)
  - Assert that when `actionMode="placeInfluence"` and an intent exists for a tile, the rendered tile element has `hex-cell-target`.
  - For MoveInfluence destination step, assert that valid destination tiles get `hex-cell-target-destination` when `moveInfluenceSourceId` is provided.

## 4) Constraints
- Presentation-only (GR-002): no legality computation; use the already-provided legal intent lists.
- No phantom moves (GR-005): no new action modes beyond what already exists; this task is only visuals.
- Determinism: no time-based animation logic; CSS-only.

## 5) Acceptance Criteria
- [x] Valid targets are visually distinguished on the board (CSS class present + visible effect).
- [x] Destination-step bloom uses the active player's seat color.
- [x] Existing tests stay green: `pnpm -C packages/client-web test`.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/GR-005).
- [x] No engine/rule/spec changes.
- [x] No new commit path introduced.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Updated `HexBoard.tsx` to accept `activePlayerId` and apply `hex-cell-target` and `hex-cell-target-destination` classes.
- Updated `BoardViewport.tsx` and `GameLayout.tsx` to pass `activePlayerId` down from `ctx.currentPlayer`.
- Added CSS styles in `index.css` for `.hex-cell-target` (highlight ring) and `.hex-cell-target-destination` (seat-colored bloom).
- Added `hex-target-highlights.test.tsx` to verify correct class application and CSS variable propagation.
- Verified visual affordances are purely presentational and do not affect game logic.

## 8) Commands Run
- `grep -RIn "hex-cell-target" packages/client-web/src` (Baseline check)
- `pnpm -C packages/client-web test` (Baseline check)
- `pnpm -C packages/client-web test test/hex-target-highlights.test.tsx` (Verification)
- `pnpm -C packages/client-web test` (Regression check)
- `pnpm lint` (Lint check)
