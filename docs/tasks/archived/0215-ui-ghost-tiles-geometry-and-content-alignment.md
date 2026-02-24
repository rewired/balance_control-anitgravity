# Task 0215 — PG-7: Fix ghost-tile alignment (geometry drift + icon/weight overlap)

Status: DRAFT

## Meta
- Owner: Codex
- Area: Board placement UX polish
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Baseline scan (no edits yet):
   - `rg -n "HexSilhouette|hex-outline-clip|HexTileFrame|ghost-preview|hex-ghost" packages/client-web/src`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
When placing a tile, the ghost must be “what you see is what you get”:
- Ghost outlines must be **deckungsgleich** with real tiles (no geometry drift).
- The previewed tile content (icon + weight/tag) must sit cleanly in the center disc (no overlap).

## 2) Inputs
- Ghost rendering:
  - `packages/client-web/src/components/HexBoard.tsx` (ghost button + preview)
- Ghost geometry:
  - `packages/client-web/src/components/HexSilhouette.tsx` (clipPath + outline)
- Real tile rendering:
  - `packages/client-web/src/ui/tiles/HexTileVisual.tsx`
  - `packages/client-web/src/ui/tiles/HexTileFrame.tsx`
  - `packages/client-web/src/ui/tiles/tileGeometry.ts`
- Styling:
  - `packages/client-web/src/index.css` (hex-cell / hex-ghost / ghost-preview)

## 3) Outputs
### 3.1 Code
#### 3.1.1 Unify hex geometry (no drift)
- Introduce a single canonical hex path definition used by BOTH:
  - the CSS clipPath (`hex-outline-clip`) / `HexOutline`
  - the frame hex path in `HexTileFrame`
- Acceptable approaches:
  - Export a normalized hex path constant from `tileGeometry.ts` (preferred), and use it in `HexSilhouette`.
  - Or adjust `HexTileFrame` to use the same normalized geometry as the clipPath.
- Result: ghost outline and tile outline must match.

#### 3.1.2 Fix ghost preview content alignment
- If the overlap is caused by scaling/offset logic:
  - adjust `HexTileVisual` offsets (iconOffset / secondaryOffset) so icon + weight/tag never collide at the current `HEX_SIZE`.
- If overlap is caused by the ghost container:
  - ensure `ghost-preview` and `HexTileVisual` have identical sizing and no extra transforms.

### 3.2 Tests
- Add a small “geometry drift” unit test:
  - Validate that the canonical hex path used by `HexSilhouette` equals the one used by `HexTileFrame` (string equality on the exported constant is enough).
- If practical, add a lightweight render test ensuring:
  - `HexTileVisual` in ghost preview has the same width/height style as in normal tiles.

### 3.3 Files touched
- `packages/client-web/src/components/HexBoard.tsx` (only if needed)
- `packages/client-web/src/components/HexSilhouette.tsx`
- `packages/client-web/src/ui/tiles/tileGeometry.ts` (or new shared constant module)
- `packages/client-web/src/ui/tiles/HexTileFrame.tsx`
- `packages/client-web/src/ui/tiles/HexTileVisual.tsx` (only if needed)
- `packages/client-web/src/index.css` (only if needed)
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- Engine authority (GR-002): strictly presentational; do not change legality logic.
- No phantom moves (GR-005): purely visual polish; do not add behavior.

## 5) Acceptance Criteria
- [x] Ghost outlines match real tiles (no visible mismatch at normal zoom).
- [x] Ghost preview content (icon + weight/tag) does not overlap.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/005).
- [x] No engine/rule/spec changes.
- [x] No new commit shortcuts / auto-commit.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Derived `HEX_NORMALIZED_PATH_POINTS` in `tileGeometry.ts` from `INFLUENCE_MARKER_CENTERS_ABS` to ensure mathematical consistency.
- Updated `HexSilhouette.tsx` to use `HEX_NORMALIZED_PATH_POINTS` for `clipPath` and `HexOutline`, fixing geometry drift.
- Updated `HexTileVisual.tsx` offsets (icon: -115, secondary: +85) to increase separation and prevent overlap.
- Added `tileGeometry.test.tsx` to verify normalized points match absolute source.
- Updated `hex-tile-visual-layout.test.tsx` to reflect new layout offsets.

## 8) Commands Run
- `grep "HexSilhouette|hex-outline-clip|HexTileFrame|ghost-preview|hex-ghost" packages/client-web/src`
- `pnpm -C packages/client-web test`
