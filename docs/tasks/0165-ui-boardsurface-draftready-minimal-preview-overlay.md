# Task 0165 — PG-2: draftReady minimal preview overlay (no simulation) + board freeze enforcement

Status: DRAFT

## Meta
- Owner: Codex
- Area: BoardSurface preview semantics
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S04 (Determinism Guard)
- affected_guardrails: GR-002, GR-005

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Read ARCH-06 sections:
   - draftReady: "minimal preview on board" + "board clicks inspect-only".
3. [ ] Baseline tests:
   - `pnpm -C packages/client-web test`

## 1) Goal
When the UI is in `draftReady`:
- Render a **minimal on-board preview overlay** for the drafted intent.
- Enforce that **board interaction is inspect-only** and can **never** change the drafted intent.

Preview must be **minimal** and must **not** simulate rules, costs, or outcomes.

## 2) Inputs
- Contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md` (Sections 4 + 10)
- BoardSurface components:
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`
  - `packages/client-web/src/components/GameLayout.tsx` (wiring only)
- Styling:
  - `packages/client-web/src/index.css`

## 3) Outputs
### 3.1 Code
- Extend BoardSurface props to accept the current draft intent:
  - `HexBoard` gets `draftIntent?: LegalIntent | null` and the active player seat/color.
  - `BoardViewport` and `GameLayout` pass these through from the interaction controller.
- Implement minimal overlay rendering in `HexBoard` for these intents:
  - `placeTile`: show a tile-look preview at the drafted `targetCoord` (use existing `pendingTile` rendering if available).
  - `placeInfluence`: show a minimal influence marker on the drafted `targetTileId`.
  - `moveInfluence`: highlight source + target and show a minimal “move marker” (no pathfinding).
  - `formalizeInfluence` / `convertResources`: highlight the selected tile only.

Board freeze enforcement (draftReady):
- Disable clickability for ghosts/targets while `draftIntent` exists.
- Ensure any click on the board can only update Inspector selection.

### 3.2 CSS
- Add minimal preview classes (examples; exact names up to you, but keep consistent):
  - `.hex-preview` root layer
  - `.hex-preview-marker` for small markers
  - `.hex-preview-tile` for placeTile preview
- Preview must be subtle; detailed consequences remain in ActionDock.

### 3.3 Tests
- Add/extend tests to verify preview + freeze:
  - Add a `HexBoard` unit test that passes `draftIntent` and asserts preview elements exist.
  - Add an integration test (recommended):
    - Choose PlaceInfluence, click a valid tile → draftReady.
    - Verify preview marker exists.
    - Click another valid target → draft remains unchanged (Confirm still commits the original intent).

## 4) Constraints
- GR-002: preview must be derived only from the drafted intent payload (no engine simulation).
- GR-005: no phantom actions; preview is visual only.
- Determinism: no time-based animation logic.

## 5) Acceptance Criteria
- [ ] In `draftReady`, the board shows a minimal preview overlay for the drafted intent.
- [ ] In `draftReady`, board clicks cannot change the drafted intent.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/GR-005).
- [x] No engine/rule/spec changes.
- [x] No new commit path introduced.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Extended `HexBoard` props to accept `draftIntent`.
- Implemented visual preview overlay in `HexBoard` for `placeTile` (ghost), `placeInfluence`, `moveInfluence`, `formalizeInfluence`, and `convertResources`.
- Implemented interaction freeze: when `draftIntent` exists, board clicks are inspect-only (select) and cannot propose new moves.
- Updated `BoardViewport` and `GameLayout` to propagate `draftIntent` from the interaction controller.
- Added CSS classes for preview markers (`.hex-preview-overlay`, `.hex-preview-marker`, etc.).
- Added comprehensive unit tests in `packages/client-web/test/board-preview-overlay.test.tsx`.

## 8) Commands Run
- `pnpm -C packages/client-web test` (baseline & verification)
- `pnpm lint`
